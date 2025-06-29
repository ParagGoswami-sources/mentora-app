import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/Navigation";
import ScreenTemplate from "../components/ScreenTemplate";
import { supabase } from "../context/SupabaseContext";
import { useStudent } from "../context/StudentContext";
import { useTestProgress } from "../context/TestProgressContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomizeExamForUser, simpleRandomizeQuestions } from "../utils/examRandomizer";
// Session management is handled by SessionGuard component
import SessionGuard from '../components/SessionGuard';

interface Option {
  option_id: string;
  text: string;
}

interface Question {
  id: string;
  question_text: string;
  options: { [key: string]: string } | Option[];
  correct_answer: string;
  subject?: string;
  difficulty?: string;
}

interface ExamState {
  questions: Question[];
  currentQuestion: number;
  answers: { [key: number]: string };
  timeRemaining: number;
  examStarted: boolean;
  examCompleted: boolean;
}

// Dimensions available if needed for responsive design
// const { width } = Dimensions.get("window");

type AptitudeTestRouteProp = RouteProp<RootStackParamList, 'AptitudeTest'>;

export default function AptitudeTestScreen() {
  const route = useRoute<AptitudeTestRouteProp>();
  const navigation = useNavigation();
  // Get test parameters from navigation
  const testParams = route.params || {};
  const { testId, testTitle, questionCount, timeLimit } = testParams;

  const { studentData, setStudentData } = useStudent();
  const { addCompletedTest, getPsychometricProgressString } = useTestProgress();
  const [loading, setLoading] = useState(true);
  const [examState, setExamState] = useState<ExamState>({
    questions: [],
    currentQuestion: 0,
    answers: {},
    timeRemaining: (timeLimit || 60) * 60, // Convert minutes to seconds
    examStarted: false,
    examCompleted: false,
  });

  useEffect(() => {
    fetchStudentDataAndQuestions();
  }, [testId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examState.examStarted && !examState.examCompleted && examState.timeRemaining > 0) {
      timer = setInterval(() => {
        setExamState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else if (examState.timeRemaining === 0 && examState.examStarted) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [examState.examStarted, examState.examCompleted, examState.timeRemaining]);

  const fetchStudentDataAndQuestions = async () => {
    try {
      setLoading(true);
      
      let currentStudentData = studentData;
      
      // If no student data in context, fetch from Supabase
      if (!currentStudentData) {
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (!userEmail) {
          Alert.alert("Error", "No user session found. Please log in again.");
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

      // Now fetch questions based on student data
      await fetchQuestionsForStudent(currentStudentData);
      
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const fetchQuestionsForStudent = async (student: any) => {
    try {
      let query = supabase.from("assessments").select("*");
      
      // If we have a specific test ID, filter by that
      if (testId) {
        
        // Filter questions based on test type
        if (testId.includes('Psychometric')) {
          query = query.eq("class_level", "general").eq("stream", "general");
          
          // Add specific subject filtering for different psychometric tests
          if (testId.includes('Aptitude')) {
            query = query.eq("subject", "aptitude");
          } else if (testId.includes('Emotional')) {
            query = query.eq("subject", "emotional_quotient");
          } else if (testId.includes('Interest')) {
            query = query.eq("subject", "interest");
          } else if (testId.includes('Personality')) {
            query = query.eq("subject", "personality");
          } else if (testId.includes('Orientation')) {
            query = query.eq("subject", "orientation_style");
          }
        } else if (testId.includes('10th')) {
          query = query.eq("class_level", "10");
          if (testId.includes('Science')) query = query.eq("stream", "Science");
          else if (testId.includes('Commerce')) query = query.eq("stream", "Commerce");
          else if (testId.includes('Arts')) query = query.eq("stream", "Arts");
        } else if (testId.includes('11th12th')) {
          // Try both 11 and 12
          const class11Query = supabase.from("assessments").select("*").eq("class_level", "11");
          const class12Query = supabase.from("assessments").select("*").eq("class_level", "12");
          
          if (testId.includes('Science')) {
            class11Query.eq("stream", "Science");
            class12Query.eq("stream", "Science");
          } else if (testId.includes('Commerce')) {
            class11Query.eq("stream", "Commerce"); 
            class12Query.eq("stream", "Commerce");
          } else if (testId.includes('Arts')) {
            class11Query.eq("stream", "Arts");
            class12Query.eq("stream", "Arts");
          }
          
          const [{ data: data11 }, { data: data12 }] = await Promise.all([
            class11Query,
            class12Query
          ]);
          
          const combinedData = [...(data11 || []), ...(data12 || [])];
          if (combinedData.length > 0) {
            const userEmail = await AsyncStorage.getItem("userEmail");
            const randomizedQuestions = userEmail 
              ? randomizeExamForUser(combinedData, userEmail, testId || 'default', questionCount || 20)
              : simpleRandomizeQuestions(combinedData, questionCount || 20);
            
            setExamState(prev => ({
              ...prev,
              questions: randomizedQuestions,
            }));
            return;
          }
        } else if (testId.includes('UG')) {
          query = query.eq("class_level", "UG");
          if (testId.includes('Science')) query = query.eq("stream", "Science");
          else if (testId.includes('Commerce')) query = query.eq("stream", "Commerce");
          else if (testId.includes('Arts')) query = query.eq("stream", "Arts");
        }
      } else {
        // Default behavior - filter based on student profile
        if (student.educationType === "School" && student.class) {
          query = query.eq("class_level", student.class);
          if (student.stream) {
            query = query.eq("stream", student.stream);
          }
        } else if (student.educationType === "UG") {
          query = query.eq("class_level", "UG");
          if (student.stream) {
            query = query.eq("stream", student.stream);
          } else if (student.course) {
            const courseToStream: { [key: string]: string } = {
              'BTech': 'Science',
              'BCA': 'Science', 
              'BSc': 'Science',
              'MBBS': 'Science',
              'BCom': 'Commerce',
              'BBA': 'Commerce',
              'BMS': 'Commerce',
              'CA': 'Commerce',
              'BA': 'Arts',
              'BEd': 'Arts',
              'BFA': 'Arts',
              'Mass Communication': 'Arts'
            };
            const mappedStream = courseToStream[student.course] || 'Arts';
            query = query.eq("stream", mappedStream);
          }
        }
      }

      const { data, error } = await query.limit(questionCount || 20);
      
      if (error) {
        console.error("Error fetching questions:", error);
        Alert.alert("Error", "Failed to load exam questions. Please try again.");
        return;
      }

      if (!data || data.length === 0) {
        Alert.alert("No Questions", `No exam questions found for this test. Please ensure questions are imported in Setup.`);
        return;
      }
      
      // Get user email for personalized randomization
      const userEmail = await AsyncStorage.getItem("userEmail");
      const randomizedQuestions = userEmail && testId
        ? randomizeExamForUser(data, userEmail, testId, questionCount || 20)
        : simpleRandomizeQuestions(data, questionCount || 20);
      
      setExamState(prev => ({
        ...prev,
        questions: randomizedQuestions,
      }));
    } catch (error) {
      console.error("Error fetching questions:", error);
      Alert.alert("Error", "Failed to load exam questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setExamState(prev => ({
      ...prev,
      examStarted: true,
      timeRemaining: (timeLimit || 60) * 60, // Reset timer with correct time limit
    }));
  };

  const selectAnswer = (questionIndex: number, selectedOption: string) => {
    setExamState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: selectedOption
      }
    }));
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    setExamState(prev => ({
      ...prev,
      currentQuestion: direction === 'next' 
        ? Math.min(prev.currentQuestion + 1, prev.questions.length - 1)
        : Math.max(prev.currentQuestion - 1, 0)
    }));
  };

  const handleSubmitExam = async () => {
    try {
      const score = calculateScore();
      const percentage = Math.round((score / examState.questions.length) * 100);
      
      // Store result in Supabase (if table exists)
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (userEmail) {
        try {
          const { error } = await supabase.from("exam_results").insert({
            student_email: userEmail,
            exam_type: studentData?.educationType === "School" 
              ? `Class_${studentData.class}_${studentData.stream || 'General'}` 
              : `UG_${studentData?.course || studentData?.stream || 'General'}`,
            score: score,
            total_questions: examState.questions.length,
            percentage: percentage,
            time_taken: ((timeLimit || 60) * 60) - examState.timeRemaining,
            answers: examState.answers,
            completed_at: new Date().toISOString(),
          });
          
          if (error) {
            if (error.code === '42P01') {
              // exam_results table doesn't exist - result not stored
            } else {
              console.error("Error saving result:", error);
            }
          }
        } catch (error) {
          console.error("Error storing exam result:", error);
        }
      }

      setExamState(prev => ({ ...prev, examCompleted: true }));
      
      // Add to completed tests for progress tracking
      if (testId && testTitle) {
        const testType = testId.includes('Psychometric') ? 'psychometric' : 'academic';
        await addCompletedTest({
          testId,
          title: testTitle,
          score,
          totalQuestions: examState.questions.length,
          percentage,
          completedAt: new Date().toISOString(),
          testType,
        });


      }
      
      const progressString = testId && testId.includes('Psychometric') 
        ? getPsychometricProgressString() 
        : 'Test completed';
      
      Alert.alert(
        "Exam Completed!",
        `You scored ${score} out of ${examState.questions.length} (${percentage}%)\n\nProgress: ${progressString} tests completed`,
        [
          { 
            text: "Back to Tests", 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error("Error submitting exam:", error);
      Alert.alert("Error", "Failed to submit exam. Please try again.");
    }
  };

  const calculateScore = () => {
    return examState.questions.reduce((score, question, index) => {
      return examState.answers[index] === question.correct_answer ? score + 1 : score;
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ScreenTemplate title="Aptitude Test">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading exam questions...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (examState.questions.length === 0) {
    return (
      <ScreenTemplate title="Aptitude Test">
        <View style={styles.noQuestionsContainer}>
          <Text style={styles.noQuestionsText}>No exam questions available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStudentDataAndQuestions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenTemplate>
    );
  }

  if (!examState.examStarted) {
    return (
      <ScreenTemplate title="Aptitude Test">
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.startContainer}>
          <View style={styles.examInfo}>
            <Text style={styles.examTitle}>Ready for your Aptitude Test?</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>• Total Questions: {examState.questions.length}</Text>
              <Text style={styles.infoText}>• Time Limit: 60 minutes</Text>
              <Text style={styles.infoText}>• Subject: {studentData?.educationType === "School" ? `Class ${studentData.class} ${studentData.stream || ''}` : `${studentData?.course} Year ${studentData?.year || ''}`}</Text>
              <Text style={styles.infoText}>• Each question carries equal marks</Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startExam}>
              <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.startButtonGradient}>
                <Text style={styles.startButtonText}>Start Exam</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScreenTemplate>
    );
  }

  if (examState.examCompleted) {
    const score = calculateScore();
    const percentage = Math.round((score / examState.questions.length) * 100);
    
    return (
      <ScreenTemplate title="Exam Results">
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.resultsContainer}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Exam Completed!</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{score}/{examState.questions.length}</Text>
              <Text style={styles.percentageText}>{percentage}%</Text>
            </View>
            <View style={styles.resultDetails}>
              <Text style={styles.resultDetail}>Time Taken: {formatTime(((timeLimit || 60) * 60) - examState.timeRemaining)}</Text>
              <Text style={styles.resultDetail}>Correct Answers: {score}</Text>
              <Text style={styles.resultDetail}>Wrong Answers: {examState.questions.length - score}</Text>
            </View>
          </View>
        </LinearGradient>
      </ScreenTemplate>
    );
  }

  const currentQ = examState.questions[examState.currentQuestion];
  const options = Array.isArray(currentQ.options) 
    ? currentQ.options.map(opt => [opt.option_id, opt.text])
    : Object.entries(currentQ.options);

  return (
    <SessionGuard requireAuth={true}>
      <ScreenTemplate title={testTitle || "Aptitude Test"} scrollable={false}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.examContainer}>
        {/* Header */}
        <View style={styles.examHeader}>
          <View style={styles.overallProgressContainer}>
            <Text style={styles.overallProgress}>
              Overall Progress: {getPsychometricProgressString()} Tests
            </Text>
            <Text style={styles.currentTest}>
              {testTitle || "Aptitude Test"}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.questionCounter}>
              Question {examState.currentQuestion + 1} of {examState.questions.length}
            </Text>
            <Text style={styles.timer}>{formatTime(examState.timeRemaining)}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((examState.currentQuestion + 1) / examState.questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Question */}
        <ScrollView style={styles.questionSection} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQ.question_text}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  examState.answers[examState.currentQuestion] === key && styles.selectedOption
                ]}
                onPress={() => selectAnswer(examState.currentQuestion, key)}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionCircle,
                    examState.answers[examState.currentQuestion] === key && styles.selectedCircle
                  ]}>
                    <Text style={[
                      styles.optionLetter,
                      examState.answers[examState.currentQuestion] === key && styles.selectedLetter
                    ]}>
                      {key.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    examState.answers[examState.currentQuestion] === key && styles.selectedOptionText
                  ]}>
                    {value}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, examState.currentQuestion === 0 && styles.disabledButton]}
            onPress={() => navigateQuestion('prev')}
            disabled={examState.currentQuestion === 0}
          >
            <Text style={[styles.navButtonText, examState.currentQuestion === 0 && styles.disabledText]}>
              Previous
            </Text>
          </TouchableOpacity>

          {examState.currentQuestion === examState.questions.length - 1 ? (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitExam}>
              <LinearGradient colors={["#ff6b6b", "#ee5a52"]} style={styles.submitButtonGradient}>
                <Text style={styles.submitButtonText}>Submit Exam</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateQuestion('next')}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
        </LinearGradient>
      </ScreenTemplate>
    </SessionGuard>
  );
}

const styles = StyleSheet.create({
  // Loading & No Questions
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  noQuestionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 20,
  },
  noQuestionsText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Start Screen
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  examInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  examTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
  },
  infoBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    width: "100%",
  },
  infoText: {
    color: "#e0e0e0",
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  startButton: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
  },
  startButtonGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Results Screen
  resultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  resultCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  resultTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  scoreText: {
    color: "#4CAF50",
    fontSize: 48,
    fontWeight: "bold",
  },
  percentageText: {
    color: "#81C784",
    fontSize: 24,
    fontWeight: "600",
  },
  resultDetails: {
    width: "100%",
  },
  resultDetail: {
    color: "#e0e0e0",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },

  // Exam Interface
  examContainer: {
    flex: 1,
  },
  examHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 25,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 15,
  },
  overallProgressContainer: {
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  overallProgress: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  currentTest: {
    color: "#e0e0e0",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  questionCounter: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timer: {
    color: "#ff6b6b",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },

  // Question Section - Mobile Optimized
  questionSection: {
    flex: 1,
    padding: 20, // Increased padding for better visibility
    paddingTop: 10,
  },
  questionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    padding: 20, // Slightly reduced for mobile
    marginBottom: 20,
  },
  questionText: {
    color: "white",
    fontSize: 17, // Optimal for mobile reading
    lineHeight: 25,
    fontWeight: "500",
  },

  // Options - Mobile Optimized
  optionsContainer: {
    gap: 12, // Reduced gap for mobile
  },
  optionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: {
    backgroundColor: "rgba(103, 126, 234, 0.2)",
    borderColor: "#667eea",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  selectedCircle: {
    backgroundColor: "#667eea",
  },
  optionLetter: {
    color: "#e0e0e0",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedLetter: {
    color: "white",
  },
  optionText: {
    color: "#e0e0e0",
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: "white",
    fontWeight: "500",
  },

  // Navigation
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 25,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledText: {
    color: "#666",
  },
  submitButton: {
    borderRadius: 25,
    overflow: "hidden",
    minWidth: 120,
  },
  submitButtonGradient: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
