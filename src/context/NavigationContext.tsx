import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NavigationState {
  navigationHistory: string[];
  addToHistory: (screenName: string) => void;
  goBackSafe: () => string | null;
  clearHistory: () => void;
  canGoBack: () => boolean;
  getCurrentScreen: () => string | null;
  preventBackToLogin: boolean;
  setPreventBackToLogin: (prevent: boolean) => void;
  resetNavigationState: () => void;
}

const NavigationContext = createContext<NavigationState | null>(null);

export const useNavigationTracking = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationTracking must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [preventBackToLogin, setPreventBackToLogin] = useState(false);
  const currentScreen = useRef<string | null>(null);

  // Load navigation state from AsyncStorage on app start
  useEffect(() => {
    const loadNavigationState = async () => {
      try {
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (userEmail) {
          // User is logged in, prevent back to login screens
          setPreventBackToLogin(true);
        }
      } catch (error) {
        console.error('Error loading navigation state:', error);
      }
    };
    loadNavigationState();
  }, []);

  const addToHistory = (screenName: string) => {
    // Don't add the same screen twice in a row
    if (currentScreen.current !== screenName) {
      setNavigationHistory(prev => {
        const newHistory = [...prev, screenName];
        // Keep only last 10 screens to prevent memory issues
        return newHistory.slice(-10);
      });
      currentScreen.current = screenName;
    }
  };

  const goBackSafe = (): string | null => {
    if (navigationHistory.length <= 1) {
      return null;
    }

    const newHistory = [...navigationHistory];
    newHistory.pop(); // Remove current screen
    
    // Look for the first safe screen in history
    const forbiddenScreens = ['Login', 'SignUp', 'Onboarding'];
    let safeScreen = null;
    
    for (let i = newHistory.length - 1; i >= 0; i--) {
      const screen = newHistory[i];
      if (!preventBackToLogin || !forbiddenScreens.includes(screen)) {
        safeScreen = screen;
        // Update history to remove everything after this safe screen
        setNavigationHistory(newHistory.slice(0, i + 1));
        currentScreen.current = safeScreen;
        break;
      }
    }

    // If no safe screen found, go to main app or dashboard
    if (!safeScreen) {
      const defaultScreen = preventBackToLogin ? 'Dashboard' : 'Login';
      setNavigationHistory([defaultScreen]);
      currentScreen.current = defaultScreen;
      return defaultScreen;
    }

    return safeScreen;
  };

  const clearHistory = () => {
    setNavigationHistory([]);
    currentScreen.current = null;
  };

  const canGoBack = (): boolean => {
    if (navigationHistory.length <= 1) return false;
    
    if (preventBackToLogin) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current screen
      
      // Check if there's any safe screen to go back to
      const forbiddenScreens = ['Login', 'SignUp', 'Onboarding'];
      for (let i = newHistory.length - 1; i >= 0; i--) {
        const screen = newHistory[i];
        if (!forbiddenScreens.includes(screen)) {
          return true;
        }
      }
      return false;
    }
    
    return true;
  };

  const getCurrentScreen = (): string | null => {
    return currentScreen.current;
  };

  const resetNavigationState = () => {
    setNavigationHistory([]);
    currentScreen.current = null;
    setPreventBackToLogin(false);
  };

  const value: NavigationState = {
    navigationHistory,
    addToHistory,
    goBackSafe,
    clearHistory,
    canGoBack,
    getCurrentScreen,
    preventBackToLogin,
    setPreventBackToLogin,
    resetNavigationState,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook for handling back button in screens
export const useBackHandler = (navigation: any, screenName: string) => {
  const { goBackSafe, addToHistory, canGoBack } = useNavigationTracking();

  // Add current screen to history when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      addToHistory(screenName);
    }, [screenName, addToHistory])
  );

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack()) {
          const previousScreen = goBackSafe();
          if (previousScreen) {
            navigation.navigate(previousScreen);
            return true; // Prevent default back behavior
          }
        }
        
        // Show exit app dialog if can't go back
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit the app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() }
          ]
        );
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation, canGoBack, goBackSafe])
  );

  return {
    goBackSafe: () => {
      if (canGoBack()) {
        const previousScreen = goBackSafe();
        if (previousScreen) {
          navigation.navigate(previousScreen);
        }
      }
    },
    canGoBack,
  };
};
