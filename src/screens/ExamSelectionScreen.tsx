import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  Alert,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/Navigation';
import ScreenTemplate from '../components/ScreenTemplate';
import { useStudent } from '../context/StudentContext';
import { useTestProgress } from '../context/TestProgressContext';
import { supabase } from '../context/SupabaseContext';
import { MANDATORY_TESTS, getAcademicTestsForStudent } from '../data/jsonFiles';
import { isCurrentUser, getCurrentUserEmail } from '../utils/userSession';

// const { width } = Dimensions.get('window'); // Available if needed

type ExamSelectionProp = NativeStackNavigationProp<RootStackParamList>;

interface ExamSection {
  id: string;
  title: string;
  description: string;
  tests: ExamTest[];
  mandatory: boolean;
  completed: number;
}

interface ExamTest {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  testType: 'psychometric' | 'academic';
  completed: boolean;
  score?: number;
}

export default function ExamSelectionScreen() {
  const navigation = useNavigation<ExamSelectionProp>();
  const { studentData, setStudentData } = useStudent();
  const { 
    completedTests,
    psychometricCompleted, 
    psychometricTotal, 
    psychometricPercentage, 
    getPsychometricProgressString,
    academicCompleted,
    academicTotal,
    academicPercentage,
    getAcademicProgressString
  } = useTestProgress();
  const [loading, setLoading] = useState(true);
  const [examSections, setExamSections] = useState<ExamSection[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStudentDataAndExams();
  }, []);

  // Refresh data when screen comes into focus (after completing a test)
  useFocusEffect(
    React.useCallback(() => {
      // Always reload when screen comes into focus, unless we're currently loading
      if (!loading) {
        loadStudentDataAndExams();
      }
    }, [])
  );

  // React to changes in completed tests - this ensures immediate updates
  useEffect(() => {
    // Force a refresh when completed tests change
    if (completedTests.length > 0) {
      setRefreshKey(prev => prev + 1);
    }
  }, [completedTests.length]);

  // Refresh sections when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0 && studentData) {
      loadStudentDataAndExams();
    }
  }, [refreshKey]);

  const loadStudentDataAndExams = async () => {
    try {
      setLoading(true);
      
      let currentStudentData = studentData;
      
      // Check if we need to reload student data (user changed or no data)
      const isCurrentUserValid = await isCurrentUser(studentData);
      
      if (!currentStudentData || !isCurrentUserValid) {
        const userEmail = await getCurrentUserEmail();
        if (!userEmail) {
          Alert.alert("Error", "No user session found. Please log in again.");
          navigation.navigate("Login");
          return;
        }

        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("email", userEmail)
          .single();

        if (error || !data) {
          console.error("Error fetching student data:", error);
          Alert.alert("Error", "Failed to load your profile. Please try again.");
          return;
        }

        currentStudentData = {
          name: data.name,
          username: data.username,
          school: data.school,
          educationType: data.education_type,
          class: data.class,
          stream: data.stream,
          course: data.course,
          year: data.year,
          state: data.state,
          email: data.email,
          phone: data.phone,
          password: data.password,
        };
        
        setStudentData(currentStudentData);
      }

      // Load exam progress
      const examResults = await loadExamResults(currentStudentData.email);
      
      // Create exam sections
      const sections = createExamSections(currentStudentData, examResults);
      setExamSections(sections);
      
    } catch (error) {
      console.error('Error loading exam data:', error);
      Alert.alert('Error', 'Failed to load exam data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadExamResults = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('exam_type, score, total_questions, percentage')
        .eq('student_email', email);

      if (error) {
        // Handle case where table doesn't exist
        if (error.code === '42P01') {
          return [];
        }
        console.error('Error loading exam results:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in loadExamResults:', error);
      return [];
    }
  };

  const createExamSections = (student: any, results: any[]): ExamSection[] => {
    const sections: ExamSection[] = [];

    // Mandatory Psychometric Tests Section
    const psychometricTests = MANDATORY_TESTS.map(testKey => {
      const result = results.find(r => r.exam_type === testKey);
      // Also check TestProgressContext for completion status
      const progressResult = completedTests.find(t => t.testId === testKey);
      const isCompleted = !!result || !!progressResult;
      const score = result?.percentage || progressResult?.percentage || 0;
      
      return {
        id: testKey,
        title: formatTestTitle(testKey),
        description: getTestDescription(testKey),
        questionCount: 25,
        timeLimit: 30,
        testType: 'psychometric' as const,
        completed: isCompleted,
        score: score
      };
    });

    const psychometricCompleted = psychometricTests.filter(t => t.completed).length;

    sections.push({
      id: 'psychometric',
      title: 'Psychometric Assessment',
      description: 'Mandatory personality and aptitude tests for all students',
      tests: psychometricTests,
      mandatory: true,
      completed: psychometricCompleted
    });

    // Academic Tests Section
    const academicTestKeys = getAcademicTestsForStudent(
      student.educationType, 
      student.class, 
      student.stream, 
      student.course
    );

    const academicTests = academicTestKeys.map(testKey => {
      const result = results.find(r => r.exam_type === testKey);
      // Also check TestProgressContext for completion status
      const progressResult = completedTests.find(t => t.testId === testKey);
      const isCompleted = !!result || !!progressResult;
      const score = result?.percentage || progressResult?.percentage || 0;
      
      return {
        id: testKey,
        title: formatTestTitle(testKey),
        description: getTestDescription(testKey),
        questionCount: 30,
        timeLimit: 45,
        testType: 'academic' as const,
        completed: isCompleted,
        score: score
      };
    });

    const academicCompleted = academicTests.filter(t => t.completed).length;

    if (academicTests.length > 0) {
      sections.push({
        id: 'academic',
        title: 'Academic Assessment',
        description: `Subject-specific tests for ${student.educationType === 'School' ? `Class ${student.class} ${student.stream}` : `${student.course} students`}`,
        tests: academicTests,
        mandatory: false,
        completed: academicCompleted
      });
    }

    return sections;
  };

  const formatTestTitle = (testKey: string): string => {
    return testKey
      .replace(/Academic_Test_/g, '')
      .replace(/Psychometric_/g, '')
      .replace(/_/g, ' ')
      .replace(/Test/g, '')
      .trim();
  };

  const getTestDescription = (testKey: string): string => {
    if (testKey.includes('Aptitude')) return 'Cognitive abilities and problem-solving skills';
    if (testKey.includes('Emotional')) return 'Emotional intelligence and interpersonal skills';
    if (testKey.includes('Interest')) return 'Career interests and preferences';
    if (testKey.includes('Personality')) return 'Personality traits and behavioral patterns';
    if (testKey.includes('Orientation')) return 'Learning style and preferences';
    if (testKey.includes('Science')) return 'Science and technical knowledge assessment';
    if (testKey.includes('Commerce')) return 'Business and economics knowledge assessment';
    if (testKey.includes('Arts')) return 'Humanities and general knowledge assessment';
    return 'Comprehensive assessment for your academic level';
  };

  const handleStartTest = (test: ExamTest) => {
    if (test.completed) {
      // Navigate to performance screen to check score
      navigation.navigate('Performance', { 
        testId: test.id,
        testTitle: test.title,
        testType: test.testType
      });
    } else {
      // Start the test
      navigation.navigate('AptitudeTest', { 
        testId: test.id,
        testTitle: test.title,
        testType: test.testType,
        questionCount: test.questionCount,
        timeLimit: test.timeLimit
      });
    }
  };



  if (loading) {
    return (
      <ScreenTemplate title="Exams" scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your exams...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  // Create data array for FlatList
  const listData = [
    { type: 'header', key: 'header' },
    { type: 'psychometric-progress', key: 'psychometric-progress' },
    ...(academicTotal > 0 ? [{ type: 'academic-progress', key: 'academic-progress' }] : []),
    ...examSections.map(section => ({ type: 'section', key: section.id, section }))
  ];

  const renderItem: ListRenderItem<any> = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome, {studentData?.name || 'Student'}!</Text>
            <Text style={styles.subText}>Complete your assessments to get personalized career guidance</Text>
          </View>
        );

      case 'psychometric-progress':
        return (
          <View style={styles.overallProgressCard}>
            <View style={styles.overallProgressHeader}>
              <Text style={styles.overallProgressTitle}>Psychometric Assessment</Text>
              <Text style={styles.overallProgressCount}>{getPsychometricProgressString()}</Text>
            </View>
            
            <View style={styles.overallProgressBarContainer}>
              <View style={styles.overallProgressBar}>
                <View 
                  style={[
                    styles.overallProgressFill,
                    { width: `${psychometricPercentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.overallProgressPercent}>{Math.round(psychometricPercentage)}%</Text>
            </View>
            
            <Text style={styles.overallProgressSubtext}>
              {psychometricCompleted === psychometricTotal 
                ? "🎉 All psychometric tests completed!" 
                : `${psychometricTotal - psychometricCompleted} psychometric tests remaining`}
            </Text>
          </View>
        );

      case 'academic-progress':
        return (
          <View style={[styles.overallProgressCard, styles.academicProgressCard]}>
            <View style={styles.overallProgressHeader}>
              <Text style={styles.overallProgressTitle}>Academic Assessment</Text>
              <Text style={styles.overallProgressCount}>{getAcademicProgressString()}</Text>
            </View>
            
            <View style={styles.overallProgressBarContainer}>
              <View style={styles.overallProgressBar}>
                <View 
                  style={[
                    styles.overallProgressFill,
                    styles.academicProgressFill,
                    { width: `${academicPercentage}%` }
                  ]}
                />
              </View>
              <Text style={styles.overallProgressPercent}>{Math.round(academicPercentage)}%</Text>
            </View>
            
            <Text style={styles.overallProgressSubtext}>
              {academicCompleted === academicTotal 
                ? "🎓 All academic tests completed!" 
                : `${academicTotal - academicCompleted} academic tests remaining`}
            </Text>
          </View>
        );

      case 'section':
        const section = item.section;
        return (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.mandatory && (
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryText}>MANDATORY</Text>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.sectionDescription}>{section.description}</Text>
            
            <View style={styles.testsContainer}>
              {section.tests.map((test: ExamTest) => (
                <TouchableOpacity
                  key={test.id}
                  style={[
                    styles.testCard,
                    test.completed && styles.completedTestCard
                  ]}
                  onPress={() => handleStartTest(test)}
                  activeOpacity={0.8}
                >
                  <View style={styles.testHeader}>
                    <Text style={styles.testTitle}>{test.title}</Text>
                    {test.completed && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓ {test.score}%</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.testDescription}>{test.description}</Text>
                  
                  <View style={styles.testMeta}>
                    <Text style={styles.metaText}>🕒 {test.timeLimit} minutes</Text>
                    <Text style={styles.metaText}>❓ {test.questionCount} questions</Text>
                  </View>
                  
                  <View style={styles.testAction}>
                    <LinearGradient 
                      colors={test.completed ? ["#4CAF50", "#45a049"] : ["#667eea", "#764ba2"]} 
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>
                        {test.completed ? 'Check Score' : 'Start Test'}
                      </Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenTemplate title="Exams" scrollable={false}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <FlatList
          data={listData}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
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
    marginTop: 16,
  },
  listContainer: {
    padding: 25, // Increased padding for better visibility
    paddingTop: 15,
    paddingBottom: 50, // Extra padding for last item
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Overall Progress Card
  overallProgressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  overallProgressTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  overallProgressCount: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overallProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallProgressBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  overallProgressPercent: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 45,
  },
  overallProgressSubtext: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  academicProgressCard: {
    borderColor: 'rgba(255, 152, 0, 0.3)', // Orange border for academic
  },
  academicProgressFill: {
    backgroundColor: '#FF9800', // Orange fill for academic
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25, // Increased padding
    marginBottom: 25, // Increased margin
    marginHorizontal: 5, // Side margins
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  mandatoryBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mandatoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionDescription: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  testsContainer: {
    gap: 15,
  },
  testCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  completedTestCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testDescription: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  testMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  metaText: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  testAction: {
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 35, // Increased horizontal padding
    paddingVertical: 14, // Increased vertical padding
    borderRadius: 25, // Increased border radius
    minWidth: 140, // Increased minimum width
    alignItems: 'center',
    marginTop: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
