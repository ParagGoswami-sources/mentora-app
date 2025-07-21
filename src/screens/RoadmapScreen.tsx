import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenTemplate from '../components/ScreenTemplate';
import { useStudent } from '../context/StudentContext';
import { useTestProgress } from '../context/TestProgressContext';
import { analyzeRoadmap, RoadmapAnalysis, FieldAlignment } from '../utils/roadmapAnalysis';
import { supabase } from '../context/SupabaseContext';
import { getCurrentUserEmail } from '../utils/userSession';

interface ExamPerformance {
  testId: string;
  title: string;
  testType: 'psychometric' | 'academic';
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  timeTaken?: number;
}

interface DetailedRoadmapData {
  examPerformance: ExamPerformance[];
  subjectStrengths: { [key: string]: number };
  performanceTrends: { period: string; average: number }[];
  skillGaps: { skill: string; currentLevel: number; requiredLevel: number }[];
  achievementProgress: { milestone: string; completed: boolean; date?: string }[];
}

export default function RoadmapScreen() {
  const { studentData } = useStudent();
  const { completedTests, psychometricCompleted, psychometricTotal } = useTestProgress();
  const [analysis, setAnalysis] = useState<RoadmapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<DetailedRoadmapData>({
    examPerformance: [],
    subjectStrengths: {},
    performanceTrends: [],
    skillGaps: [],
    achievementProgress: []
  });
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [_loadingExamData, setLoadingExamData] = useState(false);

  useEffect(() => {
    generateRoadmap();
  }, [completedTests]);

  const generateRoadmap = async () => {
    try {
      setLoading(true);
      const roadmapAnalysis = analyzeRoadmap(completedTests, studentData);
      setAnalysis(roadmapAnalysis);
      
      // Load detailed exam data if roadmap is complete
      if (roadmapAnalysis.isComplete) {
        await loadDetailedExamData();
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedExamData = async () => {
    try {
      setLoadingExamData(true);
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;

      // Fetch exam results from database
      const { data: examResults, error } = await supabase
        .from('exam_results')
        .select('id, exam_type, test_title, score, total_questions, percentage, time_taken, completed_at')
        .eq('student_email', userEmail)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching exam data:', error);
        return;
      }

      const examPerformance: ExamPerformance[] = examResults.map(result => ({
        testId: result.id.toString(),
        title: result.test_title || formatExamType(result.exam_type),
        testType: result.exam_type.includes('Psychometric') ? 'psychometric' : 'academic',
        score: result.score,
        totalQuestions: result.total_questions,
        percentage: result.percentage,
        completedAt: result.completed_at,
        timeTaken: result.time_taken
      }));

      const subjectStrengths = calculateSubjectStrengths(examPerformance);
      const performanceTrends = calculatePerformanceTrends(examPerformance);
      const skillGaps = calculateSkillGaps(examPerformance, analysis);
      const achievementProgress = calculateAchievementProgress(examPerformance);

      setExamData({
        examPerformance,
        subjectStrengths,
        performanceTrends,
        skillGaps,
        achievementProgress
      });
    } catch (error) {
      console.error('Error loading detailed exam data:', error);
    } finally {
      setLoadingExamData(false);
    }
  };

  const calculateSubjectStrengths = (examPerformance: ExamPerformance[]): { [key: string]: number } => {
    const subjects: { [key: string]: number[] } = {};
    
    examPerformance.forEach(exam => {
      let subject = 'General';
      if (exam.title.toLowerCase().includes('science')) subject = 'Science';
      else if (exam.title.toLowerCase().includes('commerce')) subject = 'Commerce';
      else if (exam.title.toLowerCase().includes('arts')) subject = 'Arts';
      else if (exam.title.toLowerCase().includes('aptitude')) subject = 'Aptitude';
      else if (exam.title.toLowerCase().includes('emotional')) subject = 'Emotional Intelligence';
      
      if (!subjects[subject]) subjects[subject] = [];
      subjects[subject].push(exam.percentage);
    });

    const strengths: { [key: string]: number } = {};
    Object.entries(subjects).forEach(([subject, scores]) => {
      strengths[subject] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });

    return strengths;
  };

  const calculatePerformanceTrends = (examPerformance: ExamPerformance[]): { period: string; average: number }[] => {
    if (examPerformance.length === 0) return [];
    
    const now = new Date();
    const trends = [];
    
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
      
      const monthTests = examPerformance.filter(exam => {
        const examDate = new Date(exam.completedAt);
        return examDate >= monthStart && examDate <= monthEnd;
      });
      
      if (monthTests.length > 0) {
        const average = Math.round(
          monthTests.reduce((sum, test) => sum + test.percentage, 0) / monthTests.length
        );
        
        trends.unshift({
          period: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
          average
        });
      }
    }
    
    return trends;
  };

  const calculateSkillGaps = (examPerformance: ExamPerformance[], analysis: RoadmapAnalysis | null): { skill: string; currentLevel: number; requiredLevel: number }[] => {
    if (!analysis?.isComplete || !analysis.topRecommendations.length) return [];
    
    const topField = analysis.topRecommendations[0];
    const skillGaps = [];
    
    // Calculate skill levels based on exam performance
    const aptitudeScore = examPerformance
      .filter(e => e.testType === 'psychometric' && e.title.toLowerCase().includes('aptitude'))
      .reduce((avg, test, _, arr) => avg + test.percentage / arr.length, 0) || 0;
      
    const eiScore = examPerformance
      .filter(e => e.testType === 'psychometric' && e.title.toLowerCase().includes('emotional'))
      .reduce((avg, test, _, arr) => avg + test.percentage / arr.length, 0) || 0;
    
    // Define required levels based on field
    const requirements: { [key: string]: number } = {
      'Analytical Skills': topField.field.includes('Engineering') || topField.field.includes('Computer') ? 80 : 70,
      'Emotional Intelligence': topField.field.includes('Medicine') || topField.field.includes('Education') ? 75 : 65,
      'Problem Solving': 75,
      'Communication': topField.field.includes('Media') || topField.field.includes('Education') ? 80 : 70
    };
    
    skillGaps.push({
      skill: 'Analytical Skills',
      currentLevel: Math.round(aptitudeScore),
      requiredLevel: requirements['Analytical Skills']
    });
    
    skillGaps.push({
      skill: 'Emotional Intelligence',
      currentLevel: Math.round(eiScore),
      requiredLevel: requirements['Emotional Intelligence']
    });
    
    return skillGaps.filter(gap => gap.currentLevel < gap.requiredLevel);
  };

  const calculateAchievementProgress = (examPerformance: ExamPerformance[]): { milestone: string; completed: boolean; date?: string }[] => {
    const milestones = [
      { milestone: 'Complete Psychometric Assessment', targetCount: 5, type: 'psychometric' },
      { milestone: 'Complete Academic Assessment', targetCount: 3, type: 'academic' },
      { milestone: 'Achieve 70%+ Average', targetPercentage: 70, type: 'all' },
      { milestone: 'Achieve 80%+ in Aptitude', targetPercentage: 80, type: 'aptitude' },
      { milestone: 'Complete Comprehensive Evaluation', targetCount: 7, type: 'all' }
    ];
    
    return milestones.map(milestone => {
      let completed = false;
      let date: string | undefined;
      
      if (milestone.type === 'psychometric') {
        const psychTests = examPerformance.filter(e => e.testType === 'psychometric');
        completed = psychTests.length >= milestone.targetCount;
        if (completed && psychTests.length > 0) {
          date = psychTests[psychTests.length - 1].completedAt;
        }
      } else if (milestone.type === 'academic') {
        const academicTests = examPerformance.filter(e => e.testType === 'academic');
        completed = academicTests.length >= milestone.targetCount;
        if (completed && academicTests.length > 0) {
          date = academicTests[academicTests.length - 1].completedAt;
        }
      } else if (milestone.type === 'all' && milestone.targetPercentage) {
        const average = examPerformance.length > 0 
          ? examPerformance.reduce((sum, test) => sum + test.percentage, 0) / examPerformance.length 
          : 0;
        completed = average >= milestone.targetPercentage;
        if (completed && examPerformance.length > 0) {
          date = examPerformance[0].completedAt;
        }
      } else if (milestone.type === 'aptitude' && milestone.targetPercentage) {
        const aptitudeTests = examPerformance.filter(e => 
          e.testType === 'psychometric' && e.title.toLowerCase().includes('aptitude')
        );
        const aptitudeAvg = aptitudeTests.length > 0 
          ? aptitudeTests.reduce((sum, test) => sum + test.percentage, 0) / aptitudeTests.length 
          : 0;
        completed = aptitudeAvg >= milestone.targetPercentage;
        if (completed && aptitudeTests.length > 0) {
          date = aptitudeTests[aptitudeTests.length - 1].completedAt;
        }
      } else if (milestone.type === 'all' && milestone.targetCount) {
        completed = examPerformance.length >= milestone.targetCount;
        if (completed && examPerformance.length > 0) {
          date = examPerformance[0].completedAt;
        }
      }
      
      return {
        milestone: milestone.milestone,
        completed,
        date
      };
    });
  };

  const formatExamType = (examType: string): string => {
    // Convert exam_type to readable format
    if (examType.includes('Aptitude')) return 'Aptitude Test';
    if (examType.includes('Personality')) return 'Personality Test';
    if (examType.includes('Interest')) return 'Interest Assessment';
    if (examType.includes('EQ') || examType.includes('Emotional')) return 'Emotional Intelligence Test';
    if (examType.includes('Orientation')) return 'Orientation Style Test';
    if (examType.includes('Science')) return 'Science Test';
    if (examType.includes('Commerce')) return 'Commerce Test';
    if (examType.includes('Arts')) return 'Arts Test';
    if (examType.includes('Math')) return 'Mathematics Test';
    if (examType.includes('Class_')) {
      const parts = examType.split('_');
      return `Class ${parts[1]} ${parts[2] || 'General'} Test`;
    }
    if (examType.includes('UG_')) {
      const parts = examType.split('_');
      return `${parts[1] || 'UG'} Assessment`;
    }
    return examType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const renderProgressCard = () => (
    <View style={styles.progressCard}>
      <Text style={styles.progressTitle}>Assessment Progress</Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${analysis?.completionPercentage || 0}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {psychometricCompleted}/{psychometricTotal} Tests Completed
        </Text>
      </View>
      
      {!analysis?.isComplete && (
        <View style={styles.incompleteSection}>
          <Text style={styles.incompleteText}>
            Complete all {psychometricTotal} mandatory psychometric assessments to unlock your personalized roadmap
          </Text>
          <Text style={styles.remainingText}>
            {psychometricTotal - psychometricCompleted} tests remaining
          </Text>
        </View>
      )}
    </View>
  );

  const renderFieldCard = (field: FieldAlignment) => (
    <View key={field.field} style={[styles.fieldCard, { borderLeftColor: field.color }]}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldTitleContainer}>
          <Text style={styles.fieldTitle}>{field.field}</Text>
          <Text style={styles.fieldCategory}>{field.category}</Text>
        </View>
        <View style={[styles.alignmentBadge, { backgroundColor: field.color }]}>
          <Text style={styles.alignmentText}>{field.alignmentPercentage}%</Text>
        </View>
      </View>
      
      <Text style={styles.fieldDescription}>{field.description}</Text>
      
      {/* Alignment Percentage Bar */}
      <View style={styles.alignmentSection}>
        <Text style={styles.alignmentLabel}>Alignment with Your Profile</Text>
        <View style={styles.alignmentBarContainer}>
          <View style={styles.alignmentBar}>
            <View 
              style={[
                styles.alignmentBarFill,
                { 
                  width: `${field.alignmentPercentage}%`,
                  backgroundColor: field.color
                }
              ]}
            />
          </View>
          <Text style={styles.alignmentPercentageText}>{field.alignmentPercentage}%</Text>
        </View>
      </View>

      {/* Strengths */}
      {field.strengths.length > 0 && (
        <View style={styles.strengthsSection}>
          <Text style={styles.sectionTitle}>Why This Fits You:</Text>
          {field.strengths.map((strength, idx) => (
            <View key={idx} style={styles.strengthListItem}>
              <Text style={styles.strengthBullet}>✅</Text>
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Career Paths */}
      <View style={styles.careerSection}>
        <Text style={styles.sectionTitle}>Career Opportunities:</Text>
        <View style={styles.careerPaths}>
          {field.careerPaths.slice(0, 3).map((career, idx) => (
            <View key={idx} style={[styles.careerChip, { borderColor: field.color }]}>
              <Text style={[styles.careerChipText, { color: field.color }]}>{career}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Education Path */}
      <View style={styles.educationSection}>
        <Text style={styles.sectionTitle}>Education Path:</Text>
        <Text style={styles.educationText}>{field.educationPath[0]}</Text>
      </View>
    </View>
  );

  const renderPsychometricSummary = () => {
    if (!analysis?.psychometricSummary) return null;
    
    const { psychometricSummary } = analysis;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Profile Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Aptitude</Text>
            <Text style={styles.summaryValue}>{psychometricSummary.aptitude}%</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Emotional Intelligence</Text>
            <Text style={styles.summaryValue}>{psychometricSummary.emotionalIntelligence}%</Text>
          </View>
        </View>
        
        <View style={styles.summaryDetails}>
          <Text style={styles.summaryDetailText}>
            <Text style={styles.summaryDetailLabel}>Personality: </Text>
            {psychometricSummary.personality}
          </Text>
          <Text style={styles.summaryDetailText}>
            <Text style={styles.summaryDetailLabel}>Learning Style: </Text>
            {psychometricSummary.learningStyle}
          </Text>
          <Text style={styles.summaryDetailText}>
            <Text style={styles.summaryDetailLabel}>Interests: </Text>
            {psychometricSummary.interests.join(', ')}
          </Text>
        </View>
      </View>
    );
  };

  const renderExamPerformanceSection = () => {
    if (!examData.examPerformance.length) return null;

    return (
      <View style={styles.examSection}>
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('examPerformance')}
        >
          <Text style={styles.sectionTitle}>📊 Detailed Exam Performance</Text>
          <Text style={styles.expandIcon}>
            {expandedSections['examPerformance'] ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        
        {expandedSections['examPerformance'] && (
          <View style={styles.sectionContent}>
            {examData.examPerformance.slice(0, 5).map((exam) => (
              <View key={exam.testId} style={styles.examItem}>
                <View style={styles.examHeader}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <View style={[styles.scorebadge, { backgroundColor: getScoreColor(exam.percentage) }]}>
                    <Text style={styles.scoreText}>{exam.percentage}%</Text>
                  </View>
                </View>
                <View style={styles.examDetails}>
                  <Text style={styles.examDetailText}>
                    Score: {exam.score}/{exam.totalQuestions}
                  </Text>
                  <Text style={styles.examDetailText}>
                    Type: {exam.testType === 'psychometric' ? 'Psychometric' : 'Academic'}
                  </Text>
                  {exam.timeTaken && (
                    <Text style={styles.examDetailText}>
                      Time: {Math.round(exam.timeTaken / 60)} minutes
                    </Text>
                  )}
                </View>
                <Text style={styles.examDate}>
                  {new Date(exam.completedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSubjectStrengthsSection = () => {
    if (!Object.keys(examData.subjectStrengths).length) return null;

    return (
      <View style={styles.strengthsCard}>
        <Text style={styles.sectionTitle}>🎯 Subject-wise Strengths</Text>
        <View style={styles.strengthsGrid}>
          {Object.entries(examData.subjectStrengths).map(([subject, score]) => (
            <View key={subject} style={styles.strengthItem}>
              <Text style={styles.strengthSubject}>{subject}</Text>
              <View style={styles.strengthBarContainer}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthBarFill, 
                      { 
                        width: `${score}%`,
                        backgroundColor: getScoreColor(score)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.strengthScore}>{score}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPerformanceTrendsSection = () => {
    if (!examData.performanceTrends.length) return null;

    return (
      <View style={styles.trendsCard}>
        <Text style={styles.sectionTitle}>📈 Performance Trends</Text>
        <View style={styles.trendsContainer}>
          {examData.performanceTrends.map((trend, index) => (
            <View key={trend.period} style={styles.trendItem}>
              <Text style={styles.trendPeriod}>{trend.period}</Text>
              <View style={styles.trendBarContainer}>
                <View style={styles.trendBar}>
                  <View 
                    style={[
                      styles.trendBarFill,
                      { 
                        width: `${trend.average}%`,
                        backgroundColor: getScoreColor(trend.average)
                      }
                    ]}
                  />
                </View>
                <Text style={styles.trendScore}>{trend.average}%</Text>
              </View>
              {index > 0 && (
                <Text style={[
                  styles.trendChange,
                  { 
                    color: trend.average >= examData.performanceTrends[index - 1].average 
                      ? '#4CAF50' : '#FF6B6B' 
                  }
                ]}>
                  {trend.average >= examData.performanceTrends[index - 1].average ? '↗' : '↘'}
                  {Math.abs(trend.average - examData.performanceTrends[index - 1].average)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSkillGapsSection = () => {
    if (!examData.skillGaps.length) return null;

    return (
      <View style={styles.skillGapsCard}>
        <Text style={styles.sectionTitle}>🎯 Areas for Improvement</Text>
        <Text style={styles.sectionSubtitle}>
          Skills to develop for your recommended career path
        </Text>
        {examData.skillGaps.map((gap) => (
          <View key={gap.skill} style={styles.skillGapItem}>
            <View style={styles.skillGapHeader}>
              <Text style={styles.skillGapName}>{gap.skill}</Text>
              <Text style={styles.skillGapNumbers}>
                {gap.currentLevel}% / {gap.requiredLevel}%
              </Text>
            </View>
            <View style={styles.skillGapBarContainer}>
              <View style={styles.skillGapBar}>
                <View 
                  style={[
                    styles.skillGapCurrentFill,
                    { width: `${(gap.currentLevel / gap.requiredLevel) * 100}%` }
                  ]}
                />
                <View style={styles.skillGapRequiredLine} />
              </View>
            </View>
            <Text style={styles.skillGapAdvice}>
              Need {gap.requiredLevel - gap.currentLevel}% improvement for optimal performance
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAchievementProgressSection = () => {
    if (!examData.achievementProgress.length) return null;

    return (
      <View style={styles.achievementsCard}>
        <Text style={styles.sectionTitle}>🏆 Achievement Progress</Text>
        {examData.achievementProgress.map((achievement) => (
          <View key={achievement.milestone} style={styles.achievementItem}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementIconText}>
                {achievement.completed ? '✅' : '⏳'}
              </Text>
            </View>
            <View style={styles.achievementContent}>
              <Text style={[
                styles.achievementText,
                { color: achievement.completed ? '#4CAF50' : '#e0e0e0' }
              ]}>
                {achievement.milestone}
              </Text>
              {achievement.completed && achievement.date && (
                <Text style={styles.achievementDate}>
                  Completed: {new Date(achievement.date).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#4CAF50';
    if (score >= 70) return '#8BC34A';
    if (score >= 60) return '#FFC107';
    if (score >= 50) return '#FF9800';
    return '#F44336';
  };

  const renderNextSteps = () => {
    if (!analysis?.nextSteps.length) return null;
    
    return (
      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>Your Next Steps</Text>
        {analysis.nextSteps.map((step, index) => (
          <View key={index} style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenTemplate title="Career Roadmap" scrollable={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating your personalized roadmap...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Career Roadmap" scrollable={false}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          {renderProgressCard()}

          {analysis?.isComplete && (
            <>
              {/* Welcome Message */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>🎉 Your Personalized Career Roadmap</Text>
                <Text style={styles.welcomeText}>
                  Welcome, {studentData?.name}! Based on your comprehensive assessment, 
                  here are the career fields that align best with your unique profile.
                </Text>
              </View>

              {/* Overall Recommendation */}
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>Our Top Recommendation</Text>
                <Text style={styles.recommendationText}>{analysis.overallRecommendation}</Text>
              </View>

              {/* Psychometric Summary */}
              {renderPsychometricSummary()}

              {/* Detailed Exam Performance */}
              {renderExamPerformanceSection()}

              {/* Subject Strengths */}
              {renderSubjectStrengthsSection()}

              {/* Performance Trends */}
              {renderPerformanceTrendsSection()}

              {/* Skill Gaps */}
              {renderSkillGapsSection()}

              {/* Achievement Progress */}
              {renderAchievementProgressSection()}

              {/* Top Field Recommendations */}
              <View style={styles.fieldsSection}>
                <Text style={styles.fieldsSectionTitle}>Career Field Recommendations</Text>
                <Text style={styles.fieldsSectionSubtitle}>
                  Ranked by alignment with your aptitude and interests
                </Text>
                {analysis.topRecommendations.map((field) => renderFieldCard(field))}
              </View>

              {/* Next Steps */}
              {renderNextSteps()}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },

  // Progress Card
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  progressTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
  },
  incompleteSection: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  incompleteText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  remainingText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  welcomeTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  welcomeText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },

  // Recommendation Card
  recommendationCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  recommendationTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommendationText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    flex: 0.48,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 5,
  },
  summaryValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDetails: {
    gap: 8,
  },
  summaryDetailText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
  },
  summaryDetailLabel: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Fields Section
  fieldsSection: {
    marginBottom: 20,
  },
  fieldsSectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldsSectionSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  // Field Card
  fieldCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  fieldTitleContainer: {
    flex: 1,
  },
  fieldTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fieldCategory: {
    color: '#e0e0e0',
    fontSize: 14,
    fontStyle: 'italic',
  },
  alignmentBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  alignmentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldDescription: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },

  // Alignment Section
  alignmentSection: {
    marginBottom: 15,
  },
  alignmentLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  alignmentBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignmentBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  alignmentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  alignmentPercentageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 35,
  },

  // Strengths Section
  strengthsSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  strengthListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  strengthBullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  strengthText: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },

  // Career Section
  careerSection: {
    marginBottom: 15,
  },
  careerPaths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careerChip: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  careerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Education Section
  educationSection: {
    marginBottom: 10,
  },
  educationText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  nextStepsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    color: '#e0e0e0',
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // New comprehensive sections
  examSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  expandIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 20,
  },
  examItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  scorebadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  examDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  examDetailText: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  examDate: {
    color: '#b0b0b0',
    fontSize: 11,
    textAlign: 'right',
  },

  // Subject Strengths
  strengthsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  strengthsGrid: {
    gap: 12,
  },
  strengthItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
  },
  strengthSubject: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthScore: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
  },

  // Performance Trends
  trendsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  trendsContainer: {
    gap: 12,
  },
  trendItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
  },
  trendPeriod: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  trendBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendScore: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 35,
  },
  trendChange: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  // Skill Gaps
  skillGapsCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  sectionSubtitle: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  skillGapItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  skillGapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillGapName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillGapNumbers: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skillGapBarContainer: {
    marginBottom: 8,
  },
  skillGapBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  skillGapCurrentFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  skillGapRequiredLine: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  skillGapAdvice: {
    color: '#e0e0e0',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Achievements
  achievementsCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  achievementIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  achievementDate: {
    color: '#b0b0b0',
    fontSize: 12,
  },
});
