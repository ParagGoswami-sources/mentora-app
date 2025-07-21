import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import ScreenTemplate from "../components/ScreenTemplate";
import { useTestProgress } from "../context/TestProgressContext";
import { useStudent } from "../context/StudentContext";
import { supabase } from "../context/SupabaseContext";
import { getCurrentUserEmail } from "../utils/userSession";
import { getAIResponse, buildStudentContext } from "../services/geminiAPI";

interface TestPerformance {
  testId: string;
  title: string;
  testType: "psychometric" | "academic";
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
  performance:
    | "Excellent"
    | "Good"
    | "Average"
    | "Below Average"
    | "Needs Improvement";
  color: string;
}

interface PerformanceTrend {
  period: string;
  averageScore: number;
  testsCount: number;
  improvement: number; // percentage change
}

interface DetailedAnalytics {
  consistencyScore: number; // How consistent performance is
  improvementRate: number; // Rate of improvement over time
  timeToCompletion: {
    average: number;
    fastest: number;
    slowest: number;
  };
  difficultyAnalysis: {
    easyQuestions: number;
    mediumQuestions: number;
    hardQuestions: number;
  };
  weeklyProgress: PerformanceTrend[];
  monthlyProgress: PerformanceTrend[];
  aiInsights: string[];
  studyRecommendations: string[];
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
  const navigation =
    useNavigation<DrawerNavigationProp<DrawerParamList, "Performance">>();
  const { completedTests } = useTestProgress();
  const { studentData } = useStudent();

  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<TestPerformance[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([]);
  const [detailedAnalytics, setDetailedAnalytics] = useState<DetailedAnalytics | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [lastInsightsHash, setLastInsightsHash] = useState<string>('');

  useEffect(() => {
    loadAllExamResults();
  }, [completedTests]); // Refresh when completedTests changes

  // Also refresh when screen comes into focus (after logout/login)
  useFocusEffect(
    React.useCallback(() => {
      // Clean up any potential stale data first, then load fresh data
      setPerformanceData([]);
      setStats(null);
      setSubjectAnalysis([]);
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

      // Get all exam results from database (primary source) - only for current user
      const { data: dbResults, error } = await supabase
        .from("exam_results")
        .select("id, exam_type, test_title, score, total_questions, percentage, time_taken, completed_at")
        .eq("student_email", userEmail)
        .not("test_title", "ilike", "%sample%")
        .not("test_title", "ilike", "%demo%")
        .not("test_title", "ilike", "%test%data%")
        .not("exam_type", "ilike", "%sample%")
        .not("exam_type", "ilike", "%demo%")
        .gte("percentage", 0)
        .lte("percentage", 100)
        .gt("total_questions", 0) // Ensure we have actual questions
        .order("completed_at", { ascending: false });

      let finalResults: TestPerformance[] = [];

      // Database query successful

      // Process database results first (most reliable source)
      if (dbResults && !error && dbResults.length > 0) {
        // Processing database results
        const dbPerformance = dbResults.map((result) => {
          // Validate required fields
          if (!result.score && result.score !== 0) {
            console.warn(`[Performance] Missing score for result:`, result);
          }
          if (!result.total_questions) {
            console.warn(`[Performance] Missing total_questions for result:`, result);
          }
          if (!result.percentage && result.percentage !== 0) {
            console.warn(`[Performance] Missing percentage for result:`, result);
          }

          return {
            testId: result.id.toString(),
            title: formatTestTitle(result.test_title || result.exam_type),
            testType: result.exam_type && result.exam_type.includes("Psychometric")
              ? ("psychometric" as const)
              : ("academic" as const),
            score: result.score || 0,
            totalQuestions: result.total_questions || 0,
            percentage: result.percentage || 0,
            completedAt: result.completed_at,
            grade: getGradeFromPercentage(result.percentage || 0).grade,
            gradeColor: getGradeFromPercentage(result.percentage || 0).color,
            timeTaken: result.time_taken,
          };
        });
        finalResults.push(...dbPerformance);
        // Database results processed successfully
      } else if (error) {
        console.error(`[Performance] Database error:`, error);
      } else {
        // No database results found
      }

      // If we have database results, prioritize them and only add context tests that are truly missing
      if (finalResults.length > 0) {
        // Using database results as primary source
        // Only add context tests that are definitely not in database
        const missingLocalTests = completedTests.filter((test) => {
          // Basic validation
          if (!test.testId || !test.title || test.score === undefined) {
            return false;
          }
          
          // Check if this test is missing from database
          const existsInDb = finalResults.some((dbResult) => {
            return dbResult.testId === test.testId ||
                   (dbResult.title === test.title && 
                    Math.abs(dbResult.score - test.score) <= 1 && 
                    Math.abs(dbResult.percentage - test.percentage) <= 1);
          });

          return !existsInDb;
        });

        if (missingLocalTests.length > 0) {
          // Adding missing local tests if any
          const localPerformance = missingLocalTests.map((test) => ({
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
          finalResults.push(...localPerformance);
        }
      } else {
        // No database results, using context tests
        // Fallback to context tests if no database results
        const validLocalTests = completedTests.filter((test) => {
          return test.testId && test.title && test.score !== undefined && 
                 !test.title.toLowerCase().includes('sample') &&
                 !test.title.toLowerCase().includes('demo') &&
                 test.title !== 'Unknown Test';
        });

        const localPerformance = validLocalTests.map((test) => ({
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
        finalResults = localPerformance;
      }

      // Filter out any sample/demo/test data and validate real test results
      const validResults = finalResults.filter((test) => {
        // Filter out any obvious sample/demo data
        const title = test.title.toLowerCase();
        
        if (title.includes('sample') || 
            title.includes('demo') || 
            title.includes('test data') ||
            title === 'unknown test' ||
            title.includes('example') ||
            title.includes('default') ||
            title.includes('placeholder')) {
          console.log(`[Performance] Filtering out sample data: ${test.title}`);
          return false;
        }
        
        // Filter out tests that might be auto-generated or seed data
        if (test.testId && (test.testId.includes('sample') || test.testId.includes('demo'))) {
          console.log(`[Performance] Filtering out test with sample ID: ${test.testId}`);
          return false;
        }
        
        // Filter out any suspicious identical scores (like all 45%)
        if (test.percentage === 45 && 
            (title.includes('commerce') || title.includes('science') || title.includes('arts') ||
             title.includes('class 10') || title.includes('class 11') || title.includes('class 12'))) {
          console.log(`[Performance] Filtering out suspicious data with 45%: ${test.title}`);
          return false;
        }
        
        // Also filter out any test that looks like placeholder data
        if ((test.score === 0 && test.totalQuestions === 0) || 
            (test.percentage === 0 && test.score === 0 && test.totalQuestions > 0)) {
          console.log(`[Performance] Filtering out placeholder data: ${test.title}`);
          return false;
        }
        
        // Ensure test has valid data
        if (!test.testId || !test.title || test.score < 0 || test.percentage < 0 || test.percentage > 100) {
          console.log(`[Performance] Filtering out invalid test data: ${test.title}`);
          return false;
        }
        
        return true;
      });

      // Final deduplication - only remove exact duplicates
      const seenTests = new Set();
      const uniqueResults = validResults.filter((test) => {
        // Create a unique key based on exact test data
        const uniqueKey = `${test.testId}-${test.title}-${test.score}-${test.percentage}-${test.completedAt}`;
        
        if (seenTests.has(uniqueKey)) {
          console.log(`[Performance] Removing exact duplicate test: ${test.title}`);
          return false;
        }
        
        seenTests.add(uniqueKey);
        return true;
      });

      // Sort by completion date (most recent first)
      uniqueResults.sort((a, b) => {
        const dateA = new Date(a.completedAt).getTime();
        const dateB = new Date(b.completedAt).getTime();
        return dateB - dateA; // Most recent first
      });

      console.log(`[Performance] Loaded ${uniqueResults.length} unique test results`);
      console.log(`[Performance] Final test results:`, uniqueResults.map(t => ({ 
        title: t.title, 
        testId: t.testId, 
        score: t.score, 
        totalQuestions: t.totalQuestions,
        percentage: t.percentage,
        testType: t.testType
      })));

      setPerformanceData(uniqueResults);

      // Calculate statistics and analysis only if we have real test data
      if (uniqueResults.length > 0) {
        console.log(`[Performance] Starting calculations for ${uniqueResults.length} tests`);
        calculateStats(uniqueResults);
        calculateSubjectAnalysis(uniqueResults);
        await calculateDetailedAnalytics(uniqueResults);
        await generateAIInsights(uniqueResults);
        console.log(`[Performance] Completed all calculations`);
      } else {
        console.log(`[Performance] No test results to process`);
      }
    } catch (error) {
      console.error("Error loading exam results:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (results: TestPerformance[]) => {
    console.log(`[Performance] calculateStats: Processing ${results.length} results`);
    
    const psychometricTests = results.filter(
      (t) => t.testType === "psychometric"
    );
    const academicTests = results.filter((t) => t.testType === "academic");
    
    console.log(`[Performance] calculateStats: ${psychometricTests.length} psychometric, ${academicTests.length} academic tests`);
    
    const averageScore =
      results.reduce((sum, test) => sum + test.percentage, 0) / results.length;
    const overallGrade = getGradeFromPercentage(averageScore);
    
    console.log(`[Performance] calculateStats: Average score ${averageScore}, grade ${overallGrade.grade}`);

    // Calculate total time taken (in minutes)
    const totalTimeMinutes = results.reduce((sum, test) => {
      if (test.timeTaken) {
        // If timeTaken is in seconds, convert to minutes
        const timeInMinutes =
          typeof test.timeTaken === "string"
            ? parseInt(test.timeTaken) / 60
            : test.timeTaken / 60;
        return sum + timeInMinutes;
      }
      return sum;
    }, 0);

    // Find strongest and weakest areas
    const subjectScores: { [key: string]: number[] } = {};
    results.forEach((test) => {
      const subject = extractSubject(test.title);
      if (!subjectScores[subject]) subjectScores[subject] = [];
      subjectScores[subject].push(test.percentage);
    });

    const subjectAverages = Object.entries(subjectScores).map(
      ([subject, scores]) => ({
        subject,
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
      })
    );

    const strongest = subjectAverages.sort((a, b) => b.average - a.average)[0];
    const weakest = subjectAverages.sort((a, b) => a.average - b.average)[0];

    const statsData: PerformanceStats = {
      totalTests: results.length,
      psychometricTests: psychometricTests.length,
      academicTests: academicTests.length,
      averageScore: Math.round(averageScore),
      overallGrade: overallGrade.grade,
      overallGradeColor: overallGrade.color,
      strongestArea: strongest?.subject || "N/A",
      weakestArea: weakest?.subject || "N/A",
      totalTimeSpent: Math.round(totalTimeMinutes), // Add total time in minutes
    };

    console.log(`[Performance] calculateStats: Final stats:`, statsData);
    setStats(statsData);
  };

  const calculateSubjectAnalysis = (results: TestPerformance[]) => {
    console.log(`[Performance] calculateSubjectAnalysis: Processing ${results.length} results`);
    
    const subjectData: { [key: string]: { scores: number[]; count: number } } =
      {};

    results.forEach((test) => {
      const subject = extractSubject(test.title);
      console.log(`[Performance] Categorizing "${test.title}" as "${subject}"`);
      if (!subjectData[subject]) {
        subjectData[subject] = { scores: [], count: 0 };
      }
      subjectData[subject].scores.push(test.percentage);
      subjectData[subject].count++;
    });

    console.log(`[Performance] Subject data:`, subjectData);

    const analysis: SubjectAnalysis[] = Object.entries(subjectData)
      .map(([subject, data]) => {
        const averageScore =
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const performance = getPerformanceLevel(averageScore);
        const color = getPerformanceColor(averageScore);

        return {
          subject,
          averageScore: Math.round(averageScore),
          testsCount: data.count,
          performance,
          color,
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);

    console.log(`[Performance] Subject analysis result:`, analysis);
    setSubjectAnalysis(analysis);
  };

  const createResultsHash = (results: TestPerformance[]): string => {
    // Create a simple hash based on test count, scores, and types
    const hashData = results.map(r => `${r.testId}-${r.percentage}-${r.testType}`).join('|');
    return hashData;
  };

  const calculateDetailedAnalytics = async (results: TestPerformance[]) => {
    try {
      // Calculate consistency score (how consistent performance is)
      const scores = results.map(r => r.percentage);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
      const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

      // Calculate improvement rate over time
      const sortedByDate = [...results].sort((a, b) => 
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
      
      let improvementRate = 0;
      if (sortedByDate.length >= 2) {
        const firstHalf = sortedByDate.slice(0, Math.ceil(sortedByDate.length / 2));
        const secondHalf = sortedByDate.slice(Math.ceil(sortedByDate.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b.percentage, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b.percentage, 0) / secondHalf.length;
        
        improvementRate = ((secondAvg - firstAvg) / firstAvg) * 100;
      }

      // Time completion analysis
      const timesWithData = results.filter(r => r.timeTaken).map(r => r.timeTaken!);
      const timeAnalysis = {
        average: timesWithData.length > 0 ? timesWithData.reduce((a, b) => a + b, 0) / timesWithData.length : 0,
        fastest: timesWithData.length > 0 ? Math.min(...timesWithData) : 0,
        slowest: timesWithData.length > 0 ? Math.max(...timesWithData) : 0,
      };

      // Weekly and monthly progress trends
      const weeklyProgress = calculateProgressTrends(results, 'weekly');
      const monthlyProgress = calculateProgressTrends(results, 'monthly');

      // Difficulty analysis (simulated based on scores)
      const difficultyAnalysis = {
        easyQuestions: results.filter(r => r.percentage >= 80).length,
        mediumQuestions: results.filter(r => r.percentage >= 60 && r.percentage < 80).length,
        hardQuestions: results.filter(r => r.percentage < 60).length,
      };

      const analytics: DetailedAnalytics = {
        consistencyScore: Math.round(consistencyScore),
        improvementRate: Math.round(improvementRate * 10) / 10,
        timeToCompletion: {
          average: Math.round(timeAnalysis.average / 60), // Convert to minutes
          fastest: Math.round(timeAnalysis.fastest / 60),
          slowest: Math.round(timeAnalysis.slowest / 60),
        },
        difficultyAnalysis,
        weeklyProgress,
        monthlyProgress,
        aiInsights: [],
        studyRecommendations: [],
      };

      setDetailedAnalytics(analytics);
    } catch (error) {
      console.error('Error calculating detailed analytics:', error);
    }
  };

  const calculateProgressTrends = (results: TestPerformance[], type: 'weekly' | 'monthly'): PerformanceTrend[] => {
    const trends: PerformanceTrend[] = [];
    const now = new Date();
    const periods = type === 'weekly' ? 4 : 3; // Last 4 weeks or 3 months
    
    for (let i = 0; i < periods; i++) {
      const periodStart = new Date(now);
      const periodEnd = new Date(now);
      
      if (type === 'weekly') {
        periodStart.setDate(now.getDate() - (i + 1) * 7);
        periodEnd.setDate(now.getDate() - i * 7);
      } else {
        periodStart.setMonth(now.getMonth() - (i + 1));
        periodEnd.setMonth(now.getMonth() - i);
      }
      
      const periodResults = results.filter(r => {
        const testDate = new Date(r.completedAt);
        return testDate >= periodStart && testDate < periodEnd;
      });
      
      if (periodResults.length > 0) {
        const avgScore = periodResults.reduce((a, b) => a + b.percentage, 0) / periodResults.length;
        const improvement = trends.length > 0 ? avgScore - trends[trends.length - 1].averageScore : 0;
        
        trends.push({
          period: type === 'weekly' ? `Week ${periods - i}` : `Month ${periods - i}`,
          averageScore: Math.round(avgScore),
          testsCount: periodResults.length,
          improvement: Math.round(improvement * 10) / 10,
        });
      }
    }
    
    return trends.reverse();
  };

  const generateAIInsights = async (results: TestPerformance[]) => {
    try {
      console.log(`[Performance] generateAIInsights: Starting AI analysis for ${results.length} results`);
      
      // Create a hash of current results to check if we need new insights
      const resultsHash = createResultsHash(results);
      if (resultsHash === lastInsightsHash && aiInsights.length > 0) {
        console.log('[Performance] Using cached AI insights');
        return;
      }
      
      setLoadingInsights(true);
      
      // Generate intelligent fallback insights based on actual performance data
      const smartFallbackInsights = generateSmartFallbackInsights(results);
      
      // Try to get AI insights with timeout and error handling
      try {
        const context = buildStudentContext(studentData, results);
        const performanceSummary = generatePerformanceSummary(results);
        
        console.log(`[Performance] generateAIInsights: Performance summary:`, performanceSummary);
        
        const prompt = `Analyze this student's test performance and provide personalized insights:

${performanceSummary}

Provide 3-4 specific, actionable insights about:
1. Performance patterns and strengths
2. Areas needing improvement
3. Study strategies based on their test history
4. Motivation and encouragement

Keep insights concise and practical.`;

        const aiResponse = await getAIResponse(prompt, context);
        console.log(`[Performance] generateAIInsights: AI response received:`, aiResponse);
        
        // Split response into individual insights
        const insights = aiResponse.split(/[.!?](?:\s|$)/)
          .filter(insight => insight.trim().length > 10)
          .map(insight => insight.trim() + (insight.endsWith('.') ? '' : '.'))
          .slice(0, 4);
        
        console.log(`[Performance] generateAIInsights: Processed insights:`, insights);
        const finalInsights = insights.length > 0 ? insights : smartFallbackInsights;
        setAiInsights(finalInsights);
        setLastInsightsHash(resultsHash);
      } catch (apiError: any) {
        console.warn('[Performance] AI API unavailable, using smart fallback insights:', apiError.message);
        
        // Check if it's a quota/rate limit error
        if (apiError.message && (apiError.message.includes('429') || apiError.message.includes('quota') || apiError.message.includes('RESOURCE_EXHAUSTED'))) {
          console.log('[Performance] API quota exceeded, using performance-based insights');
        }
        
        // Use smart fallback insights
        setAiInsights(smartFallbackInsights);
        setLastInsightsHash(resultsHash);
      }
    } catch (error) {
      console.error('Error in generateAIInsights:', error);
      // Ultimate fallback
      setAiInsights([
        "Keep up the consistent effort in your studies!",
        "Focus on understanding concepts rather than memorization.",
        "Regular practice will help improve your performance.",
        "Review your weaker subjects more frequently."
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  const generateSmartFallbackInsights = (results: TestPerformance[]): string[] => {
    const insights: string[] = [];
    
    if (results.length === 0) {
      return [
        "Start taking tests to get personalized insights about your performance.",
        "Regular assessment helps identify your strengths and areas for improvement."
      ];
    }

    const averageScore = results.reduce((sum, test) => sum + test.percentage, 0) / results.length;
    const psychometricTests = results.filter(t => t.testType === 'psychometric');
    const academicTests = results.filter(t => t.testType === 'academic');
    
    // Performance level insights
    if (averageScore >= 85) {
      insights.push("Excellent performance! You're demonstrating strong mastery across subjects.");
      insights.push("Consider exploring advanced topics or helping peers to reinforce your knowledge.");
    } else if (averageScore >= 70) {
      insights.push("Good performance with room for growth. Focus on consistency across all areas.");
      insights.push("Identify and strengthen your weaker topics for even better results.");
    } else if (averageScore >= 50) {
      insights.push("Steady progress! Develop a structured study plan to improve systematically.");
      insights.push("Focus on understanding core concepts before moving to advanced topics.");
    } else {
      insights.push("Keep working hard! Every test is a learning opportunity to improve.");
      insights.push("Consider seeking additional help and practicing regularly to build confidence.");
    }

    // Test type specific insights
    if (psychometricTests.length > 0 && academicTests.length > 0) {
      const psychAvg = psychometricTests.reduce((sum, t) => sum + t.percentage, 0) / psychometricTests.length;
      const academicAvg = academicTests.reduce((sum, t) => sum + t.percentage, 0) / academicTests.length;
      
      if (psychAvg > academicAvg + 10) {
        insights.push("Your aptitude scores are strong! Apply these thinking skills to boost academic performance.");
      } else if (academicAvg > psychAvg + 10) {
        insights.push("Strong academic knowledge! Work on problem-solving techniques to improve aptitude scores.");
      } else {
        insights.push("Balanced performance across aptitude and academics shows well-rounded development.");
      }
    }

    // Recent performance trend
    if (results.length >= 3) {
      const recentTests = results.slice(0, 3);
      const olderTests = results.slice(3, 6);
      
      if (olderTests.length > 0) {
        const recentAvg = recentTests.reduce((sum, t) => sum + t.percentage, 0) / recentTests.length;
        const olderAvg = olderTests.reduce((sum, t) => sum + t.percentage, 0) / olderTests.length;
        
        if (recentAvg > olderAvg + 5) {
          insights.push("Great improvement trend! Your recent performance shows you're learning effectively.");
        } else if (olderAvg > recentAvg + 5) {
          insights.push("Review your recent study approach. Consider returning to successful past strategies.");
        }
      }
    }

    // Subject-specific insights
    const subjectScores: { [key: string]: number[] } = {};
    results.forEach((test) => {
      const subject = extractSubject(test.title);
      if (!subjectScores[subject]) subjectScores[subject] = [];
      subjectScores[subject].push(test.percentage);
    });

    const subjectAverages = Object.entries(subjectScores)
      .map(([subject, scores]) => ({
        subject,
        average: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => b.average - a.average);

    if (subjectAverages.length > 1) {
      const strongest = subjectAverages[0];
      const weakest = subjectAverages[subjectAverages.length - 1];
      
      if (strongest.average - weakest.average > 20) {
        insights.push(`Leverage your strength in ${strongest.subject} while dedicating extra time to ${weakest.subject}.`);
      }
    }

    return insights.slice(0, 4); // Return maximum 4 insights
  };

  const generatePerformanceSummary = (results: TestPerformance[]): string => {
    const totalTests = results.length;
    const avgScore = results.reduce((a, b) => a + b.percentage, 0) / totalTests;
    const psychometric = results.filter(r => r.testType === 'psychometric').length;
    const academic = results.filter(r => r.testType === 'academic').length;
    
    const recentTests = results.slice(0, 3);
    const recentAvg = recentTests.reduce((a, b) => a + b.percentage, 0) / recentTests.length;
    
    const subjectPerformance = results.reduce((acc, test) => {
      const subject = extractSubject(test.title);
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(test.percentage);
      return acc;
    }, {} as Record<string, number[]>);

    const strongSubjects = Object.entries(subjectPerformance)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length >= 75)
      .map(([subject]) => subject);

    const weakSubjects = Object.entries(subjectPerformance)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length < 60)
      .map(([subject]) => subject);

    return `
Student Performance Summary:
- Total Tests: ${totalTests} (${psychometric} psychometric, ${academic} academic)
- Overall Average: ${Math.round(avgScore)}%
- Recent Tests Average (last 3): ${Math.round(recentAvg)}%
- Strong Subjects: ${strongSubjects.join(', ') || 'None identified'}
- Weak Subjects: ${weakSubjects.join(', ') || 'None identified'}
- Test Types: ${results.map(r => r.title).join(', ')}
`;
  };

  const extractSubject = (title: string): string => {
    // For academic tests, use the full test name instead of generic categories
    if (title.toLowerCase().includes("academic") || 
        title.toLowerCase().includes("class") ||
        title.toLowerCase().includes("science") ||
        title.toLowerCase().includes("commerce") ||
        title.toLowerCase().includes("arts")) {
      // Return the full formatted title for academic tests
      return title;
    }
    
    // For psychometric tests, keep the category approach
    if (title.toLowerCase().includes("aptitude")) return "Aptitude Test";
    if (title.toLowerCase().includes("emotional"))
      return "Emotional Intelligence";
    if (title.toLowerCase().includes("interest")) return "Interest Assessment";
    if (title.toLowerCase().includes("personality")) return "Personality Test";
    if (title.toLowerCase().includes("orientation")) return "Learning Style";
    
    // Default fallback
    return title.length > 30 ? title.substring(0, 30) + "..." : title;
  };

  const formatTestTitle = (title: string): string => {
    if (!title) return "Unknown Test";

    // Handle specific academic test patterns with better naming
    if (title.includes("Academic_Test_")) {
      let formatted = title
        .replace(/Academic_Test_/g, "")
        .replace(/UG_/g, "")
        .replace(/_/g, " ");

      // Map specific patterns to better names
      const titleMappings: { [key: string]: string } = {
        "10th Arts": "Class 10 Arts",
        "10th Commerce": "Class 10 Commerce",
        "10th Science": "Class 10 Science",
        "11th12th Arts BA": "Class 11-12 Arts (BA)",
        "11th12th Arts BEd": "Class 11-12 Arts (B.Ed)",
        "11th12th Arts BFA": "Class 11-12 Arts (BFA)",
        "11th12th Arts MassComm": "Class 11-12 Arts (Mass Comm)",
        "11th12th Commerce BBA": "Class 11-12 Commerce (BBA)",
        "11th12th Commerce BCom": "Class 11-12 Commerce (B.Com)",
        "11th12th Commerce BMS": "Class 11-12 Commerce (BMS)",
        "11th12th Commerce CAFoundation":
          "Class 11-12 Commerce (CA Foundation)",
        "11th12th Science BCA": "Class 11-12 Science (BCA)",
        "11th12th Science BCS": "Class 11-12 Science (BCS)",
        "11th12th Science BTech": "Class 11-12 Science (B.Tech)",
        "11th12th Science MBBS": "Class 11-12 Science (MBBS)",
        "Science BTech": "Science (B.Tech)",
        "Science MBBS": "Science (MBBS)",
        "Science BCA": "Science (BCA)",
        "Science BCS": "Science (BCS)",
        "Arts BA": "Arts (BA)",
        "Arts BEd": "Arts (B.Ed)",
        "Arts BFA": "Arts (BFA)",
        "Commerce BBA": "Commerce (BBA)",
        "Commerce BCom": "Commerce (B.Com)",
        "Commerce BMS": "Commerce (BMS)",
      };

      // Check if we have a specific mapping
      for (const [pattern, replacement] of Object.entries(titleMappings)) {
        if (formatted.toLowerCase().includes(pattern.toLowerCase())) {
          return replacement;
        }
      }

      // Default formatting if no specific mapping found
      return formatted.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    // Handle psychometric test patterns
    if (title.includes("Psychometric_")) {
      return title
        .replace(/Psychometric_/g, "")
        .replace(/_Test/g, "")
        .replace(/_/g, " ")
        .replace(/Aptitude/g, "Aptitude Test")
        .replace(/Emotional Quotient/g, "EQ Test")
        .replace(/Interest/g, "Interest Test")
        .replace(/Orientation Style/g, "Learning Style Test")
        .replace(/Personality/g, "Personality Test")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    // For other titles, just clean up underscores and capitalize
    return title.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 90) return { grade: "A+", color: "#4CAF50" };
    if (percentage >= 80) return { grade: "A", color: "#8BC34A" };
    if (percentage >= 70) return { grade: "B+", color: "#CDDC39" };
    if (percentage >= 60) return { grade: "B", color: "#FFC107" };
    if (percentage >= 50) return { grade: "C", color: "#FF9800" };
    if (percentage >= 40) return { grade: "D", color: "#FF5722" };
    return { grade: "F", color: "#F44336" };
  };

  const getPerformanceLevel = (
    percentage: number
  ):
    | "Excellent"
    | "Good"
    | "Average"
    | "Below Average"
    | "Needs Improvement" => {
    if (percentage >= 85) return "Excellent";
    if (percentage >= 70) return "Good";
    if (percentage >= 60) return "Average";
    if (percentage >= 50) return "Below Average";
    return "Needs Improvement";
  };

  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 85) return "#4CAF50";
    if (percentage >= 70) return "#8BC34A";
    if (percentage >= 60) return "#FFC107";
    if (percentage >= 50) return "#FF9800";
    return "#F44336";
  };

  const generateSuggestions = (): string[] => {
    if (!stats || performanceData.length === 0) return [];

    const suggestions: string[] = [];

    if (stats.averageScore >= 85) {
      suggestions.push(
        "Excellent overall performance! Consider advanced courses in your strongest areas."
      );
      suggestions.push(
        "You might explore leadership roles or teaching opportunities to help others."
      );
    } else if (stats.averageScore >= 70) {
      suggestions.push(
        "Good performance with room for growth. Focus on consistency across all subjects."
      );
      suggestions.push(
        "Consider additional practice in your weaker areas to reach excellence."
      );
    } else if (stats.averageScore >= 60) {
      suggestions.push(
        "Average performance indicates potential for improvement. Create a structured study plan."
      );
      suggestions.push(
        "Seek help from teachers or tutors in challenging subjects."
      );
    } else {
      suggestions.push(
        "Significant improvement needed. Consider intensive study sessions and regular practice."
      );
      suggestions.push(
        "Talk to teachers about additional support and resources."
      );
    }

    if (stats.psychometricTests > 0 && stats.academicTests > 0) {
      suggestions.push(
        "Balance your academic knowledge with personality development for holistic growth."
      );
    }

    if (stats.strongestArea !== "N/A" && stats.weakestArea !== "N/A") {
      suggestions.push(
        `Leverage your strength in ${stats.strongestArea} while working on ${stats.weakestArea}.`
      );
    }

    return suggestions;
  };





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
        <Text style={styles.subjectTests}>
          {item.testsCount} test{item.testsCount > 1 ? "s" : ""}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${item.averageScore}%`, backgroundColor: item.color },
          ]}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenTemplate title="Performance Analysis" scrollable={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>
            Loading performance analysis...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (performanceData.length === 0) {
    return (
      <ScreenTemplate title="Performance Analysis" scrollable={false}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📊 No Performance Data</Text>
          <Text style={styles.emptySubText}>
            You haven't completed any tests yet.{'\n'}
            Start your assessment journey to see detailed performance insights!
          </Text>
          <TouchableOpacity
            style={styles.startTestButton}
            onPress={() => navigation.navigate("Exams")}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>🚀 Start Your First Test</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScreenTemplate>
    );
  }

  const suggestions = generateSuggestions();

  return (
    <ScreenTemplate title="Performance Analysis" scrollable={false}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall Statistics */}
          {stats && (
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Overall Performance</Text>

              {/* Top Row Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalTests}</Text>
                  <Text style={styles.statLabel}>Total Tests</Text>
                </View>
                <View style={styles.statBox}>
                  <View
                    style={[
                      styles.gradeCircle,
                      { backgroundColor: stats.overallGradeColor },
                    ]}
                  >
                    <Text style={styles.statGrade}>{stats.overallGrade}</Text>
                  </View>
                  <Text style={styles.statLabel}>Overall Grade</Text>
                </View>
              </View>

              {/* Bottom Row Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.averageScore}%</Text>
                  <Text style={styles.statLabel}>Average Score</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {Math.floor(stats.totalTimeSpent / 60)}h{" "}
                    {stats.totalTimeSpent % 60}m
                  </Text>
                  <Text style={styles.statLabel}>Total Time</Text>
                </View>
              </View>

              {/* Strength & Weakness Section */}
              <View style={styles.strengthWeaknessContainer}>
                <View style={styles.strengthWeaknessItem}>
                  <Text style={styles.strengthLabel}>💪 Strongest Area</Text>
                  <Text style={styles.strengthValue}>
                    {stats.strongestArea}
                  </Text>
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

          {/* AI-Powered Insights */}
          {aiInsights.length > 0 && (
            <View style={styles.aiInsightsCard}>
              <Text style={styles.cardTitle}>🤖 AI Performance Insights</Text>
              {loadingInsights ? (
                <View style={styles.loadingInsights}>
                  <ActivityIndicator color="#667eea" />
                  <Text style={styles.loadingText}>Analyzing your performance...</Text>
                </View>
              ) : (
                aiInsights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Text style={styles.insightBullet}>💡</Text>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Detailed Analytics */}
          {detailedAnalytics && (
            <View style={styles.analyticsCard}>
              <Text style={styles.cardTitle}>📊 Advanced Analytics</Text>
              
              {/* Performance Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{detailedAnalytics.consistencyScore}%</Text>
                  <Text style={styles.metricLabel}>Consistency</Text>
                  <Text style={styles.metricSubtext}>
                    {detailedAnalytics.consistencyScore >= 80 ? 'Very Stable' : 
                     detailedAnalytics.consistencyScore >= 60 ? 'Moderately Stable' : 'Variable'}
                  </Text>
                </View>
                
                <View style={styles.metricBox}>
                  <Text style={[styles.metricValue, { 
                    color: detailedAnalytics.improvementRate >= 0 ? '#4CAF50' : '#FF6B6B' 
                  }]}>
                    {detailedAnalytics.improvementRate > 0 ? '+' : ''}{detailedAnalytics.improvementRate}%
                  </Text>
                  <Text style={styles.metricLabel}>Improvement</Text>
                  <Text style={styles.metricSubtext}>
                    {detailedAnalytics.improvementRate >= 5 ? 'Excellent Growth' : 
                     detailedAnalytics.improvementRate >= 0 ? 'Positive Trend' : 'Needs Focus'}
                  </Text>
                </View>
              </View>

              {/* Time Analysis */}
              {detailedAnalytics.timeToCompletion.average > 0 && (
                <View style={styles.timeAnalysisSection}>
                  <Text style={styles.sectionSubtitle}>⏱️ Time Analysis</Text>
                  <View style={styles.timeMetrics}>
                    <View style={styles.timeMetric}>
                      <Text style={styles.timeValue}>{detailedAnalytics.timeToCompletion.average}m</Text>
                      <Text style={styles.timeLabel}>Average</Text>
                    </View>
                    <View style={styles.timeMetric}>
                      <Text style={styles.timeValue}>{detailedAnalytics.timeToCompletion.fastest}m</Text>
                      <Text style={styles.timeLabel}>Fastest</Text>
                    </View>
                    <View style={styles.timeMetric}>
                      <Text style={styles.timeValue}>{detailedAnalytics.timeToCompletion.slowest}m</Text>
                      <Text style={styles.timeLabel}>Slowest</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Difficulty Breakdown */}
              <View style={styles.difficultySection}>
                <Text style={styles.sectionSubtitle}>🎯 Performance Distribution</Text>
                <View style={styles.difficultyBars}>
                  <View style={styles.difficultyBar}>
                    <View style={styles.difficultyBarHeader}>
                      <Text style={styles.difficultyLabel}>Excellent (80%+)</Text>
                      <Text style={styles.difficultyCount}>{detailedAnalytics.difficultyAnalysis.easyQuestions}</Text>
                    </View>
                    <View style={styles.difficultyBarBackground}>
                      <View style={[styles.difficultyBarFill, { 
                        width: `${(detailedAnalytics.difficultyAnalysis.easyQuestions / performanceData.length) * 100}%`,
                        backgroundColor: '#4CAF50' 
                      }]} />
                    </View>
                  </View>
                  
                  <View style={styles.difficultyBar}>
                    <View style={styles.difficultyBarHeader}>
                      <Text style={styles.difficultyLabel}>Good (60-79%)</Text>
                      <Text style={styles.difficultyCount}>{detailedAnalytics.difficultyAnalysis.mediumQuestions}</Text>
                    </View>
                    <View style={styles.difficultyBarBackground}>
                      <View style={[styles.difficultyBarFill, { 
                        width: `${(detailedAnalytics.difficultyAnalysis.mediumQuestions / performanceData.length) * 100}%`,
                        backgroundColor: '#FF9800' 
                      }]} />
                    </View>
                  </View>
                  
                  <View style={styles.difficultyBar}>
                    <View style={styles.difficultyBarHeader}>
                      <Text style={styles.difficultyLabel}>Needs Work (Below 60%)</Text>
                      <Text style={styles.difficultyCount}>{detailedAnalytics.difficultyAnalysis.hardQuestions}</Text>
                    </View>
                    <View style={styles.difficultyBarBackground}>
                      <View style={[styles.difficultyBarFill, { 
                        width: `${(detailedAnalytics.difficultyAnalysis.hardQuestions / performanceData.length) * 100}%`,
                        backgroundColor: '#F44336' 
                      }]} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Progress Trends */}
              {detailedAnalytics.weeklyProgress.length > 0 && (
                <View style={styles.trendsSection}>
                  <Text style={styles.sectionSubtitle}>📈 Weekly Progress</Text>
                  <View style={styles.trendsList}>
                    {detailedAnalytics.weeklyProgress.map((trend, index) => (
                      <View key={index} style={styles.trendItem}>
                        <Text style={styles.trendPeriod}>{trend.period}</Text>
                        <Text style={styles.trendScore}>{trend.averageScore}%</Text>
                        <Text style={[styles.trendImprovement, {
                          color: trend.improvement >= 0 ? '#4CAF50' : '#FF6B6B'
                        }]}>
                          {trend.improvement > 0 ? '+' : ''}{trend.improvement}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  emptyText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubText: {
    color: "#e0e0e0",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  startTestButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },

  // Statistics Card
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
  },
  cardTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statNumber: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  statGrade: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#e0e0e0",
    fontSize: 14,
    marginTop: 5,
  },
  strengthWeaknessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  strengthWeaknessItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  strengthLabel: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  strengthValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  weaknessLabel: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  weaknessValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Subject Analysis
  analysisCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  subjectCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subjectName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  subjectPerformance: {
    fontSize: 14,
    fontWeight: "600",
  },
  subjectDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subjectScore: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  subjectTests: {
    color: "#e0e0e0",
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Suggestions
  suggestionsCard: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  suggestionBullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  suggestionText: {
    color: "#e0e0e0",
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // Test Results
  testsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  testCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  testTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 15,
    lineHeight: 24,
  },
  gradeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  gradeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  testDetails: {
    gap: 8,
    marginTop: 5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    fontWeight: "500",
  },
  detailValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
  },

  // AI Insights
  aiInsightsCard: {
    backgroundColor: "rgba(103, 126, 234, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#667eea",
  },
  loadingInsights: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  insightBullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  insightText: {
    color: "#e0e0e0",
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // Advanced Analytics
  analyticsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  metricValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  metricLabel: {
    color: "#e0e0e0",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "600",
  },
  metricSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },

  // Time Analysis
  timeAnalysisSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timeMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeMetric: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 3,
  },
  timeValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  timeLabel: {
    color: "#e0e0e0",
    fontSize: 12,
    marginTop: 3,
  },

  // Difficulty Analysis
  difficultySection: {
    marginBottom: 20,
  },
  difficultyBars: {
    gap: 10,
  },
  difficultyBar: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 10,
  },
  difficultyBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  difficultyLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  difficultyCount: {
    color: "#e0e0e0",
    fontSize: 14,
    fontWeight: "bold",
  },
  difficultyBarBackground: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  difficultyBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Progress Trends
  trendsSection: {
    marginBottom: 20,
  },
  trendsList: {
    gap: 8,
  },
  trendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  trendPeriod: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  trendScore: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    minWidth: 50,
    textAlign: "center",
  },
  trendImprovement: {
    fontSize: 14,
    fontWeight: "bold",
    minWidth: 60,
    textAlign: "right",
  },
});
