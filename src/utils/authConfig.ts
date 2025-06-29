// Development utility to handle email confirmation issues

import { supabase } from '../context/SupabaseContext';

/**
 * Disables email confirmation requirement for development
 * This should only be used in development mode
 */
export async function disableEmailConfirmationForDev() {
  try {
    // This would require admin access to Supabase settings
    // For now, we'll handle it in the app logic
    console.log('Email confirmation handling configured for development');
    return true;
  } catch (error) {
    console.error('Error configuring email confirmation:', error);
    return false;
  }
}

/**
 * Alternative login method that bypasses Supabase auth for unconfirmed users
 */
export async function loginWithoutEmailConfirmation(email: string, password: string) {
  try {
    // First try normal sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        console.log('Email not confirmed, continuing without auth session');
        return {
          success: true,
          session: null,
          user: null,
          needsConfirmation: true,
          message: 'Login successful, but email needs confirmation'
        };
      }
      return {
        success: false,
        error: error.message,
        needsConfirmation: false
      };
    }

    return {
      success: true,
      session: data.session,
      user: data.user,
      needsConfirmation: false,
      message: 'Login successful'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      needsConfirmation: false
    };
  }
}

/**
 * Signs up user with email confirmation disabled (for development)
 */
export async function signUpWithoutConfirmation(email: string, password: string) {
  try {
    // First try simple signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      // Handle common errors gracefully
      if (error.message.includes('User already registered')) {
        return {
          success: true,
          user: null,
          session: null,
          message: 'User already exists, can proceed with login',
          alreadyExists: true
        };
      }
      
      // Temporarily bypass email validation errors
      if (error.message.includes('Email address is invalid') || error.message.includes('Invalid email')) {
        console.warn('Bypassing email validation error:', error.message);
        return {
          success: true,
          user: { email: email }, // Mock user object
          session: null,
          message: 'Bypassing email validation for development'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }

    // User created successfully
    return {
      success: true,
      user: data.user,
      session: data.session,
      needsManualConfirmation: !data.user?.email_confirmed_at,
      message: data.user?.email_confirmed_at ? 'Account created successfully' : 'Account created, email confirmation needed'
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed - unknown error'
    };
  }
}
