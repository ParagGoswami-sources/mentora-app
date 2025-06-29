import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserEmail } from '../utils/userSession';
import { supabase } from './SupabaseContext';
import { getAcademicTestsForStudent } from '../data/jsonFiles';

export interface CompletedTest {
  testId: string;
  title: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  testType: 'psychometric' | 'academic';
}

interface TestProgressContextType {
  completedTests: CompletedTest[];
  
  // Psychometric Progress
  psychometricCompleted: number;
  psychometricTotal: number;
  psychometricPercentage: number;
  getPsychometricProgressString: () => string;
  
  // Academic Progress  
  academicCompleted: number;
  academicTotal: number;
  academicPercentage: number;
  getAcademicProgressString: () => string;
  
  // Common methods
  addCompletedTest: (test: CompletedTest) => Promise<void>;
  isTestCompleted: (testId: string) => boolean;
  getTestScore: (testId: string) => CompletedTest | undefined;
  resetProgress: () => Promise<void>;
  updateAcademicTotal: (total: number) => Promise<void>;
  reloadTestsForUser: () => Promise<void>;
  calculateAcademicTotalFromProfile: () => Promise<void>;
  
  // Overall completion
  areAllExamsCompleted: () => boolean;
  getTotalTestsCompleted: () => number;
  getTotalTestsRequired: () => number;
}

const TestProgressContext = createContext<TestProgressContextType | undefined>(undefined);

const PSYCHOMETRIC_TOTAL = 5; // 5 mandatory psychometric tests

export function TestProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedTests, setCompletedTests] = useState<CompletedTest[]>([]);
  const [academicTotal, setAcademicTotal] = useState<number>(0);

  useEffect(() => {
    loadCompletedTests();
    loadAcademicTotalFromStorage();
  }, []);

  // Calculate academic total from profile when completed tests change
  useEffect(() => {
    if (completedTests.length >= 0) {
      calculateAcademicTotalFromProfile();
    }
  }, [completedTests.length]);

  const getUserStorageKey = async (): Promise<string | null> => {
    try {
      const userEmail = await getCurrentUserEmail();
      return userEmail ? `completedTests_${userEmail}` : null;
    } catch (error) {
      console.error('Error getting user storage key:', error);
      return null;
    }
  };

  const loadCompletedTests = async () => {
    try {
      const storageKey = await getUserStorageKey();
      if (!storageKey) {
        return;
      }

      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setCompletedTests(JSON.parse(stored));
      } else {
        setCompletedTests([]);
      }
    } catch (error) {
      console.error('Error loading completed tests:', error);
    }
  };

  const saveCompletedTests = async (tests: CompletedTest[]) => {
    try {
      const storageKey = await getUserStorageKey();
      if (!storageKey) {
        return;
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(tests));
      setCompletedTests(tests);
    } catch (error) {
      console.error('Error saving completed tests:', error);
    }
  };

  const addCompletedTest = async (test: CompletedTest) => {
    try {
      const updatedTests = completedTests.filter(t => t.testId !== test.testId);
      updatedTests.push(test);
      await saveCompletedTests(updatedTests);
    } catch (error) {
      console.error('Error adding completed test:', error);
    }
  };

  // Calculate progress for psychometric tests
  const psychometricTests = completedTests.filter(test => test.testType === 'psychometric');
  const psychometricCompleted = psychometricTests.length;
  const psychometricPercentage = (psychometricCompleted / PSYCHOMETRIC_TOTAL) * 100;
  
  const getPsychometricProgressString = () => {
    return `${psychometricCompleted}/${PSYCHOMETRIC_TOTAL}`;
  };

  // Calculate progress for academic tests
  const academicTests = completedTests.filter(test => test.testType === 'academic');
  const academicCompleted = academicTests.length;
  const academicPercentage = academicTotal > 0 ? (academicCompleted / academicTotal) * 100 : 0;
  

  
  const getAcademicProgressString = () => {
    return `${academicCompleted}/${academicTotal}`;
  };

  const loadAcademicTotalFromStorage = async () => {
    try {
      const storageKey = await getUserStorageKey();
      if (!storageKey) return;

      const stored = await AsyncStorage.getItem(`${storageKey}_academicTotal`);
      if (stored) {
        const total = parseInt(stored, 10);
        setAcademicTotal(total);
      }
    } catch (error) {
      console.error('Error loading academic total:', error);
    }
  };

  const calculateAcademicTotalFromProfile = async () => {
    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;



      // Fetch student data from Supabase
      const { data: studentData, error } = await supabase
        .from('students')
        .select('education_type, class, stream, course')
        .eq('email', userEmail)
        .single();

      if (error || !studentData) {
        return;
      }

      // Get academic tests for this student based on their profile
      const academicTestKeys = getAcademicTestsForStudent(
        studentData.education_type,
        studentData.class,
        studentData.stream,
        studentData.course
      );

      const calculatedTotal = academicTestKeys.length;

      // If we calculated a valid total, update it
      if (calculatedTotal > 0) {
        await updateAcademicTotal(calculatedTotal);
      } else {
        // If no tests but user has completed academic tests, preserve the completed count
        const currentAcademicCompleted = completedTests.filter(t => t.testType === 'academic').length;
        if (currentAcademicCompleted > 0) {
          await updateAcademicTotal(currentAcademicCompleted);
        }
      }
    } catch (error) {
      console.error('Error calculating academic total from profile:', error);
    }
  };

  const updateAcademicTotal = async (total: number) => {
    try {
      const storageKey = await getUserStorageKey();
      if (storageKey) {
        await AsyncStorage.setItem(`${storageKey}_academicTotal`, total.toString());
      }
      setAcademicTotal(total);
    } catch (error) {
      console.error('Error saving academic total:', error);
      setAcademicTotal(total); // Fallback to just setting state
    }
  };

  const isTestCompleted = (testId: string) => {
    return completedTests.some(test => test.testId === testId);
  };

  const getTestScore = (testId: string) => {
    return completedTests.find(test => test.testId === testId);
  };

  const resetProgress = async () => {
    try {
      const storageKey = await getUserStorageKey();
      if (storageKey) {
        await AsyncStorage.removeItem(storageKey);
        await AsyncStorage.removeItem(`${storageKey}_academicTotal`);
      }
      setCompletedTests([]);
      setAcademicTotal(0);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  // Add method to reload tests when user changes
  const reloadTestsForUser = async () => {
    await loadCompletedTests();
    await loadAcademicTotalFromStorage();
    await calculateAcademicTotalFromProfile();
  };

  // Check if all exams are completed
  const areAllExamsCompleted = () => {
    return psychometricCompleted === PSYCHOMETRIC_TOTAL && 
           academicCompleted === academicTotal && 
           academicTotal > 0; // Ensure academic total is loaded
  };

  // Get total tests completed
  const getTotalTestsCompleted = () => {
    return psychometricCompleted + academicCompleted;
  };

  // Get total tests required
  const getTotalTestsRequired = () => {
    return PSYCHOMETRIC_TOTAL + academicTotal;
  };

  return (
    <TestProgressContext.Provider value={{
      completedTests,
      
      // Psychometric Progress
      psychometricCompleted,
      psychometricTotal: PSYCHOMETRIC_TOTAL,
      psychometricPercentage,
      getPsychometricProgressString,
      
      // Academic Progress
      academicCompleted,
      academicTotal,
      academicPercentage,
      getAcademicProgressString,
      
      // Common methods
      addCompletedTest,
      isTestCompleted,
      getTestScore,
      resetProgress,
      updateAcademicTotal,
      reloadTestsForUser,
      calculateAcademicTotalFromProfile,
      
      // Overall completion
      areAllExamsCompleted,
      getTotalTestsCompleted,
      getTotalTestsRequired,
    }}>
      {children}
    </TestProgressContext.Provider>
  );
}

export function useTestProgress() {
  const context = useContext(TestProgressContext);
  if (context === undefined) {
    throw new Error('useTestProgress must be used within a TestProgressProvider');
  }
  return context;
}
