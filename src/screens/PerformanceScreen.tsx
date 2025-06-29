import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import ScreenTemplate from '../components/ScreenTemplate';
import { useTestProgress } from '../context/TestProgressContext';
import { supabase } from '../context/SupabaseContext';
import { getCurrentUserEmail } from '../utils/userSession';

interface TestPerformance {
  testId: string;
  title: string;
  testType: 'psychometric' | 'academic';
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  grade: string;
  gradeColor: string;
  timeTaken?: number;
}

interface PerformanceStats {
  totalTests: number;
  psychometricTests: number;
  academicTests: number;
  averageScore: number;
  overallGrade: string;
  overallGradeColor: string;
  strongestArea: string;
  weakestArea: string;
  totalTimeSpent: number; // in minutes
}

interface SubjectAnalysis {
  subject: string;
  averageScore: number;
  testsCount: number;
  performance: 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Needs Improvement';
  color: string;
}

type DrawerParamList = {
  Dashboard: { userName?: string };
  Exams: undefined;
  Performance: undefined;
  Roadmap: undefined;
  Scheduler: undefined;
  ParentView: undefined;
  Profile: undefined;
  Settings: undefined;
  Setup: undefined;
  SignOut: undefined;
};

export default function PerformanceScreen() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList, 'Performance'>>();
  const { completedTests } = useTestProgress();
  
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<TestPerformance[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([]);

  useEffect(() => {
    loadAllExamResults();
  }, [completedTests]); // Refresh when completedTests changes

  // Also refresh when screen comes into focus (after logout/login)
  useFocusEffect(
    React.useCallback(() => {
      loadAllExamResults();
    }, [])
  );

  const loadAllExamResults = async () => {
    try {
      setLoading(true);
      
      // Clear existing data first
      setPerformanceData([]);
      setStats(null);
      setSubjectAnalysis([]);
      
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        setLoading(false);
        return;
      }

      // Get all exam results from database
      const { data: dbResults, error } = await supabase
        .from('exam_results')
        .select('*')
        .eq('student_email', userEmail)
        .order('completed_at', { ascending: false });

      let combinedResults: TestPerformance[] = [];

      // Add database results
      if (dbResults && !error) {
        const dbPerformance = dbResults.map(result => ({
          testId: result.id,
          title: formatTestTitle(result.test_title || result.exam_type),
          testType: result.exam_type.includes('Psychometric') ? 'psychometric' as const : 'academic' as const,
          score: result.score,
          totalQuestions: result.total_questions,
          percentage: result.percentage,
          completedAt: result.completed_at,
          grade: getGradeFromPercentage(result.percentage).grade,
          gradeColor: getGradeFromPercentage(result.percentage).color,
          timeTaken: result.time_taken,
        }));
        combinedResults.push(...dbPerformance);
      }

      // Add completed tests from TestProgressContext that might not be in database
      const localTests = completedTests.filter(test => 
        !combinedResults.some(result => result.testId === test.testId)
      );
      const localPerformance = localTests.map(test => ({
        testId: test.testId,
        title: test.title,
        testType: test.testType,
        score: test.score,
        totalQuestions: test.totalQuestions,
        percentage: test.percentage,
        completedAt: test.completedAt,
        grade: getGradeFromPercentage(test.percentage).grade,
        gradeColor: getGradeFromPercentage(test.percentage).color,
      }));

      combinedResults.push(...localPerformance);

      // Sort by completion date (most recent first)
      combinedResults.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      setPerformanceData(combinedResults);

      // Calculate statistics and analysis
      if (combinedResults.length > 0) {
        calculateStats(combinedResults);
        calculateSubjectAnalysis(combinedResults);
      }

    } catch (error) {
      console.error('Error loading exam results:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (results: TestPerformance[]) => {
    const psychometricTests = results.filter(t => t.testType === 'psychometric');
    const academicTests = results.filter(t => t.testType === 'academic');
    const averageScore = results.reduce((sum, test) => sum + test.percentage, 0) / results.length;
    const overallGrade = getGradeFromPercentage(averageScore);

    // Calculate total time taken (in minutes)
    const totalTimeMinutes = results.reduce((sum, test) => {
      if (test.timeTaken) {
        // If timeTaken is in seconds, convert to minutes
        const timeInMinutes = typeof test.timeTaken === 'string' 
          ? parseInt(test.timeTaken) / 60 
          : test.timeTaken / 60;
        return sum + timeInMinutes;
      }
      return sum;
    }, 0);

    // Find strongest and weakest areas
    const subjectScores: { [key: string]: number[] } = {};
    results.forEach(test => {
      const subject = extractSubject(test.title);
      if (!subjectScores[subject]) subjectScores[subject] = [];
      subjectScores[subject].push(test.percentage);
    });

    const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      average: scores.reduce((a, b) => a + b, 0) / scores.length
    }));

    const strongest = subjectAverages.sort((a, b) => b.average - a.average)[0];
    const weakest = subjectAverages.sort((a, b) => a.average - b.average)[0];

    const statsData: PerformanceStats = {
      totalTests: results.length,
      psychometricTests: psychometricTests.length,
      academicTests: academicTests.length,
      averageScore: Math.round(averageScore),
      overallGrade: overallGrade.grade,
      overallGradeColor: overallGrade.color,
      strongestArea: strongest?.subject || 'N/A',
      weakestArea: weakest?.subject || 'N/A',
      totalTimeSpent: Math.round(totalTimeMinutes), // Add total time in minutes
    };

    setStats(statsData);
  };

  const calculateSubjectAnalysis = (results: TestPerformance[]) => {
    const subjectData: { [key: string]: { scores: number[], count: number } } = {};
    
    results.forEach(test => {
      const subject = extractSubject(test.title);
      if (!subjectData[subject]) {
        subjectData[subject] = { scores: [], count: 0 };
      }
      subjectData[subject].scores.push(test.percentage);
      subjectData[subject].count++;
    });

    const analysis: SubjectAnalysis[] = Object.entries(subjectData).map(([subject, data]) => {
      const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const performance = getPerformanceLevel(averageScore);
      const color = getPerformanceColor(averageScore);

      return {
        subject,
        averageScore: Math.round(averageScore),
        testsCount: data.count,
        performance,
        color,
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    setSubjectAnalysis(analysis);
  };

  const extractSubject = (title: string): string => {
    if (title.toLowerCase().includes('science')) return 'Science';
    if (title.toLowerCase().includes('commerce')) return 'Commerce';
    if (title.toLowerCase().includes('arts')) return 'Arts';
    if (title.toLowerCase().includes('aptitude')) return 'Aptitude';
    if (title.toLowerCase().includes('emotional')) return 'Emotional Intelligence';
    if (title.toLowerCase().includes('interest')) return 'Interest';
    if (title.toLowerCase().includes('personality')) return 'Personality';
    if (title.toLowerCase().includes('orientation')) return 'Orientation';
    return title.split(' ')[0] || 'General';
  };

  const formatTestTitle = (title: string): string => {
    return title
      .replace(/Academic_Test_/g, '')
      .replace(/Psychometric_/g, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: '#4CAF50' };
    if (percentage >= 80) return { grade: 'A', color: '#8BC34A' };
    if (percentage >= 70) return { grade: 'B+', color: '#CDDC39' };
    if (percentage >= 60) return { grade: 'B', color: '#FFC107' };
    if (percentage >= 50) return { grade: 'C', color: '#FF9800' };
    if (percentage >= 40) return { grade: 'D', color: '#FF5722' };
    return { grade: 'F', color: '#F44336' };
  };

  const getPerformanceLevel = (percentage: number): 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Needs Improvement' => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 50) return 'Below Average';
    return 'Needs Improvement';
  };

  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 85) return '#4CAF50';
    if (percentage >= 70) return '#8BC34A';
    if (percentage >= 60) return '#FFC107';
    if (percentage >= 50) return '#FF9800';
    return '#F44336';
  };

  const generateSuggestions = (): string[] => {
    if (!stats || performanceData.length === 0) return [];

    const suggestions: string[] = [];

    if (stats.averageScore >= 85) {
      suggestions.push('Excellent overall performance! Consider advanced courses in your strongest areas.');
      suggestions.push('You might explore leadership roles or teaching opportunities to help others.');
    } else if (stats.averageScore >= 70) {
      suggestions.push('Good performance with room for growth. Focus on consistency across all subjects.');
      suggestions.push('Consider additional practice in your weaker areas to reach excellence.');
    } else if (stats.averageScore >= 60) {
      suggestions.push('Average performance indicates potential for improvement. Create a structured study plan.');
      suggestions.push('Seek help from teachers or tutors in challenging subjects.');
    } else {
      suggestions.push('Significant improvement needed. Consider intensive study sessions and regular practice.');
      suggestions.push('Talk to teachers about additional support and resources.');
    }

    if (stats.psychometricTests > 0 && stats.academicTests > 0) {
      suggestions.push('Balance your academic knowledge with personality development for holistic growth.');
    }

    if (stats.strongestArea !== 'N/A' && stats.weakestArea !== 'N/A') {
      suggestions.push(`Leverage your strength in ${stats.strongestArea} while working on ${stats.weakestArea}.`);
    }

    return suggestions;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderTestCard = ({ item }: { item: TestPerformance }) => (
    <View style={styles.testCard}>
      <View style={styles.testHeader}>
        <Text style={styles.testTitle}>{item.title}</Text>
        <View style={[styles.gradeBadge, { backgroundColor: item.gradeColor }]}>
          <Text style={styles.gradeText}>{item.grade}</Text>
        </View>
      </View>
      
      <View style={styles.testDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Score:</Text>
          <Text style={styles.detailValue}>{item.score}/{item.totalQuestions} ({item.percentage}%)</Text>
        </View>
        {item.timeTaken && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formatTime(item.timeTaken)}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{new Date(item.completedAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={[styles.detailValue, { color: item.testType === 'academic' ? '#4CAF50' : '#2196F3' }]}>
            {item.testType === 'academic' ? 'Academic' : 'Psychometric'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSubjectAnalysis = ({ item }: { item: SubjectAnalysis }) => (
    <View style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectName}>{item.subject}</Text>
        <Text style={[styles.subjectPerformance, { color: item.color }]}>
          {item.performance}
        </Text>
      </View>
      <View style={styles.subjectDetails}>
        <Text style={styles.subjectScore}>{item.averageScore}%</Text>
        <Text style={styles.subjectTests}>{item.testsCount} test{item.testsCount > 1 ? 's' : ''}</Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[styles.progressFill, { width: `${item.averageScore}%`, backgroundColor: item.color }]} 
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenTemplate title="Performance Analysis" scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading performance analysis...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (performanceData.length === 0) {
    return (
      <ScreenTemplate title="Performance Analysis" scrollable={false}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No test results available</Text>
          <Text style={styles.emptySubText}>Complete some tests to view your performance analysis</Text>
          <TouchableOpacity 
            style={styles.startTestButton} 
            onPress={() => navigation.navigate('Dashboard', {})}
          >
            <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Start Taking Tests</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScreenTemplate>
    );
  }

  const suggestions = generateSuggestions();

  return (
    <ScreenTemplate title="Performance Analysis" scrollable={false}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Overall Statistics */}
          {stats && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Overall Performance</Text>
              <View style={styles.statsGrid}>
              <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalTests}</Text>
              <Text style={styles.statLabel}>Total Tests</Text>
              </View>
              <View style={styles.statItem}>
              <View style={[styles.gradeCircle, { backgroundColor: stats.overallGradeColor }]}>
              <Text style={styles.statGrade}>{stats.overallGrade}</Text>
              </View>
              <Text style={styles.statLabel}>Overall Grade</Text>
              </View>
              <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.averageScore}%</Text>
              <Text style={styles.statLabel}>Average Score</Text>
              </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{Math.floor(stats.totalTimeSpent / 60)}h {stats.totalTimeSpent % 60}m</Text>
                  <Text style={styles.statLabel}>Total Time</Text>
                </View>
              </View>
              
              <View style={styles.strengthWeakness}>
                <View style={styles.strengthWeaknessItem}>
                  <Text style={styles.strengthLabel}>💪 Strongest Area</Text>
                  <Text style={styles.strengthValue}>{stats.strongestArea}</Text>
                </View>
                <View style={styles.strengthWeaknessItem}>
                  <Text style={styles.weaknessLabel}>🎯 Focus Area</Text>
                  <Text style={styles.weaknessValue}>{stats.weakestArea}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Subject Analysis */}
          {subjectAnalysis.length > 0 && (
            <View style={styles.analysisCard}>
              <Text style={styles.cardTitle}>Subject-wise Performance</Text>
              <FlatList
                data={subjectAnalysis}
                renderItem={renderSubjectAnalysis}
                keyExtractor={(item) => item.subject}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsCard}>
              <Text style={styles.cardTitle}>Personalized Suggestions</Text>
              {suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Text style={styles.suggestionBullet}>💡</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recent Test Results */}
          <View style={styles.testsCard}>
            <Text style={styles.cardTitle}>Recent Test Results</Text>
            <FlatList
              data={performanceData.slice(0, 5)}
              renderItem={renderTestCard}
              keyExtractor={(item) => item.testId}
              scrollEnabled={false}
            />
            
            {performanceData.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All {performanceData.length} Tests</Text>
              </TouchableOpacity>
            )}
          </View>

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
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  startTestButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },

  // Statistics Card
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statGrade: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    marginTop: 5,
  },
  strengthWeakness: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthWeaknessItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  strengthLabel: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  strengthValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  weaknessLabel: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  weaknessValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Subject Analysis
  analysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  subjectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
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
    fontWeight: 'bold',
  },
  subjectPerformance: {
    fontSize: 14,
    fontWeight: '600',
  },
  subjectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectScore: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subjectTests: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Suggestions
  suggestionsCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  suggestionBullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  suggestionText: {
    color: '#e0e0e0',
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // Test Results
  testsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  testCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testDetails: {
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewAllText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
});
