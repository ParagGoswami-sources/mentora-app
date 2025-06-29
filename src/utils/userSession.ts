// Utility to manage user session and detect user changes

import AsyncStorage from '@react-native-async-storage/async-storage';

interface StudentData {
  name: string;
  username: string;
  school: string;
  educationType: "School" | "UG";
  class?: string;
  stream?: string;
  course?: string;
  year?: string;
  state: string;
  email: string;
  phone: string;
  password: string;
}

/**
 * Checks if the current user in AsyncStorage matches the user in StudentContext
 */
export async function isCurrentUser(studentData: StudentData | null): Promise<boolean> {
  try {
    const userEmail = await AsyncStorage.getItem("userEmail");
    
    if (!userEmail || !studentData) {
      return false;
    }
    
    return userEmail === studentData.email;
  } catch (error) {
    console.error('Error checking current user:', error);
    return false;
  }
}

/**
 * Gets the current user email from AsyncStorage
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("userEmail");
  } catch (error) {
    console.error('Error getting current user email:', error);
    return null;
  }
}

/**
 * Clears all user session data including profile image
 */
export async function clearUserSession(): Promise<void> {
  try {
    // Get current user email before clearing to remove their profile image
    const currentUserEmail = await getCurrentUserEmail();
    
    await AsyncStorage.multiRemove([
      'userEmail',
      'rememberMe', 
      'supabase.auth.token'
    ]);
    
    // Clear user-specific profile image
    if (currentUserEmail) {
      await AsyncStorage.removeItem(`profileImage_${currentUserEmail}`);
    }
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
}

/**
 * Checks if user session is valid and hasn't expired
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const userEmail = await getCurrentUserEmail();
    if (!userEmail) return false;
    
    // Check if session has been valid for more than 24 hours
    const lastLoginTime = await AsyncStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
      const timeDiff = Date.now() - parseInt(lastLoginTime);
      const hoursPassrd = timeDiff / (1000 * 60 * 60);
      
      // Session expires after 24 hours
      if (hoursPassrd > 24) {
        await clearUserSession();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

/**
 * Updates last login time for session management
 */
export async function updateLoginTime(): Promise<void> {
  try {
    await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
  } catch (error) {
    console.error('Error updating login time:', error);
  }
}

/**
 * Sets the current user email
 */
export async function setCurrentUserEmail(email: string): Promise<void> {
  try {
    await AsyncStorage.setItem("userEmail", email);
  } catch (error) {
    console.error('Error setting current user email:', error);
  }
}
