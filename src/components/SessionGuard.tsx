import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isSessionValid, clearUserSession } from '../utils/userSession';
import { useStudent } from '../context/StudentContext';
import type { RootStackParamList } from '../navigation/Navigation';

interface SessionGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function SessionGuard({ children, requireAuth = true }: SessionGuardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { clearStudentData } = useStudent();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      if (!requireAuth) {
        setIsAuthorized(true);
        setIsValidating(false);
        return;
      }

      const valid = await isSessionValid();
      
      if (!valid) {
        // Clear all user data
        await clearUserSession();
        clearStudentData();
        
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setIsAuthorized(false);
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidating) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Validating session...</Text>
      </View>
    );
  }

  if (!isAuthorized && requireAuth) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session validation failed</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
});
