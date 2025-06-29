import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/Navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStudent } from '../context/StudentContext';
import { useTestProgress } from '../context/TestProgressContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignOutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { clearStudentData } = useStudent();
  const { resetProgress } = useTestProgress();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Clear all user data
      await AsyncStorage.multiRemove([
        'userEmail',
        'rememberMe', 
        'supabase.auth.token'
      ]);
      
      // Clear contexts
      clearStudentData();
      await resetProgress();
      
      navigation.replace('Login'); // Replace to clear stack
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still navigate to login even if cleanup fails
      navigation.replace('Login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Out</Text>
      <Text style={styles.subtitle}>Are you sure you want to sign out?</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Confirm Sign Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3e0055',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignOutScreen;