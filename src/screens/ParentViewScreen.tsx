import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ScreenTemplate from "../components/ScreenTemplate";
import { useStudent } from "../context/StudentContext";
import { useTestProgress } from "../context/TestProgressContext";
import { supabase } from "../context/SupabaseContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StudentStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  strongSubjects: string[];
  weakSubjects: string[];
  recentActivity: any[];
  studyTime: number;
  lastActive: string;
}

interface SubjectPerformance {
  subject: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

export default function ParentViewScreen() {
  const navigation = useNavigation();
  const { studentData } = useStudent();
  const { completedTests, psychometricCompleted, academicCompleted } = useTestProgress();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadStudentAnalytics();
  }, [studentData, completedTests]);

  const loadStudentAnalytics = async () => {
    if (!studentData) return;
    
    try {
      setLoading(true);
      
      // Calculate student statistics
      const totalTests = psychometricCompleted + academicCompleted;
      const totalPossibleTests = 5 + (academicCompleted > 0 ? 2 : 0); // 5 psychometric + 2 academic
      
      const averageScore = completedTests.length > 0 
        ? completedTests.reduce((sum, test) => sum + test.percentage, 0) / completedTests.length
        : 0;

      // Analyze subject performance
      const subjectAnalysis = analyzeSubjectPerformance(completedTests);
      const strongSubjects = subjectAnalysis.filter(s => s.percentage >= 80).map(s => s.subject);
      const weakSubjects = subjectAnalysis.filter(s => s.percentage < 60).map(s => s.subject);

      // Get recent activity (last 7 days)
      const recentTests = completedTests.filter(test => {
        const testDate = new Date(test.completedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return testDate >= weekAgo;
      });

      const stats: StudentStats = {
        totalTests: totalPossibleTests,
        completedTests: totalTests,
        averageScore: Math.round(averageScore),
        strongSubjects,
        weakSubjects,
        recentActivity: recentTests,
        studyTime: calculateStudyTime(completedTests),
        lastActive: completedTests.length > 0 
          ? new Date(Math.max(...completedTests.map(t => new Date(t.completedAt).getTime()))).toLocaleDateString()
          : 'No activity'
      };

      setStudentStats(stats);
      setSubjectPerformance(subjectAnalysis);
      
    } catch (error) {
      console.error('Error loading student analytics:', error);
      Alert.alert('Error', 'Failed to load student analytics');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSubjectPerformance = (tests: any[]): SubjectPerformance[] => {
    const subjectMap: { [key: string]: { total: number, correct: number, tests: number } } = {};
    
    tests.forEach(test => {
      let subject = 'General';
      
      if (test.testId.includes('Aptitude')) subject = 'Aptitude';
      else if (test.testId.includes('Emotional')) subject = 'Emotional Intelligence';
      else if (test.testId.includes('Interest')) subject = 'Interest Assessment';
      else if (test.testId.includes('Personality')) subject = 'Personality';
      else if (test.testId.includes('Orientation')) subject = 'Learning Style';
      else if (test.testId.includes('Science')) subject = 'Science';
      else if (test.testId.includes('Commerce')) subject = 'Commerce';
      else if (test.testId.includes('Arts')) subject = 'Arts';
      
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, correct: 0, tests: 0 };
      }
      
      subjectMap[subject].total += test.totalQuestions;
      subjectMap[subject].correct += test.score;
      subjectMap[subject].tests += 1;
    });

    return Object.entries(subjectMap).map(([subject, data]) => {
      const percentage = Math.round((data.correct / data.total) * 100);
      let status: 'excellent' | 'good' | 'needs_improvement' | 'critical' = 'good';
      
      if (percentage >= 90) status = 'excellent';
      else if (percentage >= 70) status = 'good';
      else if (percentage >= 50) status = 'needs_improvement';
      else status = 'critical';

      return {
        subject,
        score: data.correct,
        totalQuestions: data.total,
        percentage,
        status
      };
    });
  };

  const calculateStudyTime = (tests: any[]): number => {
    // Estimate study time based on completed tests (rough calculation)
    return tests.length * 30; // 30 minutes per test average
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#2196F3';
      case 'needs_improvement': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPerformanceInsight = () => {
    if (!studentStats) return '';
    
    if (studentStats.averageScore >= 85) {
      return 'Excellent performance! Your child is excelling across all areas.';
    } else if (studentStats.averageScore >= 70) {
      return 'Good performance with room for improvement in specific areas.';
    } else if (studentStats.averageScore >= 50) {
      return 'Moderate performance. Consider focusing on weaker subjects.';
    } else {
      return 'Performance needs attention. Recommend additional study support.';
    }
  };

  if (loading) {
    return (
      <ScreenTemplate>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading student analytics...</Text>
          </View>
        </LinearGradient>
      </ScreenTemplate>
    );
  }

  if (!studentData) {
    return (
      <ScreenTemplate>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No student data available</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.refreshButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Parent Dashboard</Text>
            <Text style={styles.headerSubtitle}>Monitor {studentData.name}'s Progress</Text>
          </View>

          {/* Student Overview Card */}
          <LinearGradient
            colors={['rgba(103, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
            style={styles.overviewCard}
          >
            <Text style={styles.cardTitle}>📊 Overall Progress</Text>
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{studentStats?.completedTests || 0}</Text>
                <Text style={styles.statLabel}>Tests Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{studentStats?.averageScore || 0}%</Text>
                <Text style={styles.statLabel}>Average Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{studentStats?.studyTime || 0}m</Text>
                <Text style={styles.statLabel}>Study Time</Text>
              </View>
            </View>
            <Text style={styles.insightText}>{getPerformanceInsight()}</Text>
          </LinearGradient>

          {/* Progress Summary */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>📈 Test Progress</Text>
            
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.progressCard}
            >
              <Text style={styles.progressCardTitle}>Psychometric Assessments</Text>
              <Text style={styles.progressCardNumber}>{psychometricCompleted}/5</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${(psychometricCompleted / 5) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round((psychometricCompleted / 5) * 100)}%
                </Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.progressCard}
            >
              <Text style={styles.progressCardTitle}>Academic Assessments</Text>
              <Text style={styles.progressCardNumber}>{academicCompleted}/2</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${(academicCompleted / 2) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round((academicCompleted / 2) * 100)}%
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Subject Performance */}
          <View style={styles.subjectsSection}>
            <Text style={styles.sectionTitle}>📚 Subject Performance</Text>
            
            {subjectPerformance.map((subject, index) => (
              <View key={index} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subject.subject}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subject.status) }]}>
                    <Text style={styles.statusText}>{subject.percentage}%</Text>
                  </View>
                </View>
                <View style={styles.subjectProgressBar}>
                  <View 
                    style={[
                      styles.subjectProgressFill, 
                      { 
                        width: `${subject.percentage}%`,
                        backgroundColor: getStatusColor(subject.status)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.subjectDetails}>
                  {subject.score}/{subject.totalQuestions} questions correct
                </Text>
              </View>
            ))}
          </View>

          {/* Strengths & Weaknesses */}
          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>🎯 Performance Analysis</Text>
            
            <View style={styles.analysisGrid}>
              <LinearGradient
                colors={['rgba(76, 175, 80, 0.2)', 'rgba(129, 199, 132, 0.2)']}
                style={styles.analysisCard}
              >
                <Text style={styles.analysisCardTitle}>💪 Strengths</Text>
                {studentStats?.strongSubjects.length ? (
                  studentStats.strongSubjects.map((subject, index) => (
                    <Text key={index} style={styles.analysisItem}>• {subject}</Text>
                  ))
                ) : (
                  <Text style={styles.analysisItem}>Take more tests to identify strengths</Text>
                )}
              </LinearGradient>

              <LinearGradient
                colors={['rgba(255, 152, 0, 0.2)', 'rgba(255, 183, 77, 0.2)']}
                style={styles.analysisCard}
              >
                <Text style={styles.analysisCardTitle}>🎯 Focus Areas</Text>
                {studentStats?.weakSubjects.length ? (
                  studentStats.weakSubjects.map((subject, index) => (
                    <Text key={index} style={styles.analysisItem}>• {subject}</Text>
                  ))
                ) : (
                  <Text style={styles.analysisItem}>Great! No weak areas identified</Text>
                )}
              </LinearGradient>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>📅 Recent Activity</Text>
            
            {studentStats?.recentActivity.length ? (
              studentStats.recentActivity.map((activity, index) => (
                <View key={index} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.activityScore}>Score: {activity.percentage}%</Text>
                </View>
              ))
            ) : (
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.emptyCard}
              >
                <Text style={styles.emptyText}>No recent activity</Text>
                <Text style={styles.emptySubtext}>Encourage your child to take assessments</Text>
              </LinearGradient>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Exams' as never)}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>View All Tests</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Scheduler' as never)}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>Schedule Study Time</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Roadmap' as never)}
            >
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>Career Roadmap</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
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
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    padding: 25,
    paddingTop: 15,
  },

  // Header
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
  },

  // Overview Card
  overviewCard: {
    padding: 25,
    borderRadius: 20,
    marginBottom: 25,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
  },
  insightText: {
    color: '#e0e0e0',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Section Titles
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },

  // Progress Section
  progressSection: {
    marginBottom: 25,
  },
  progressCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  progressCardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressCardNumber: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressPercentage: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },

  // Subjects Section
  subjectsSection: {
    marginBottom: 25,
  },
  subjectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subjectProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectDetails: {
    color: '#e0e0e0',
    fontSize: 12,
  },

  // Analysis Section
  analysisSection: {
    marginBottom: 25,
  },
  analysisGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  analysisCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
  },
  analysisCardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisItem: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },

  // Activity Section
  activitySection: {
    marginBottom: 25,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activityDate: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  activityScore: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  emptySubtext: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
  },

  // Actions Section
  actionsSection: {
    marginBottom: 20,
    gap: 15,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 30,
  },
});
