import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,

  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenTemplate from "../components/ScreenTemplate";
import { useStudent } from "../context/StudentContext";
import { useTestProgress } from "../context/TestProgressContext";
import { supabase } from "../context/SupabaseContext";
import { clearUserSession, getCurrentUserEmail } from "../utils/userSession";
import { useTheme } from "../context/ThemeContext";

interface AppSettings {
  notifications: {
    studyReminders: boolean;
    performanceAlerts: boolean;
    parentUpdates: boolean;
    dailyGoals: boolean;
  };
  privacy: {
    shareProgress: boolean;
    allowAnalytics: boolean;
    parentAccess: boolean;
  };
  study: {
    reminderTime: number; // minutes before session
    dailyGoalHours: number;
    autoScheduleWeakSubjects: boolean;
    difficultyLevel: 'easy' | 'medium' | 'hard';
  };
  appearance: {
    theme: 'dark' | 'light' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    language: 'en' | 'hi' | 'es';
  };
}

const _defaultSettings: AppSettings = {
  notifications: {
    studyReminders: true,
    performanceAlerts: true,
    parentUpdates: false,
    dailyGoals: true,
  },
  privacy: {
    shareProgress: true,
    allowAnalytics: true,
    parentAccess: false,
  },
  study: {
    reminderTime: 15,
    dailyGoalHours: 2,
    autoScheduleWeakSubjects: true,
    difficultyLevel: 'medium',
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    language: 'en',
  },
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { studentData, setStudentData } = useStudent();
  const { resetProgress } = useTestProgress();
  const { 
    settings: themeSettings, 
    updateAppearance, 
    profileImage, 
    setProfileImage: setThemeProfileImage
  } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    educationType: 'School' as 'School' | 'UG',
    class: '',
    stream: '',
    course: '',
    year: '',
    state: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fetchProfileFromDatabase = async () => {
    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const profileData = {
          name: data.name || '',
          username: data.username || data.email || '',
          email: data.email || '',
          phone: data.phone || '',
          school: data.school || '',
          educationType: data.education_type || 'School',
          class: data.class || '',
          stream: data.stream || '',
          course: data.course || '',
          year: data.year || '',
          state: data.state || '',
          password: data.password || '',
        };

        // Update context with fresh data
        if (setStudentData) {
          setStudentData(profileData);
        }

        // Update edit form
        setEditForm({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          school: profileData.school,
          educationType: profileData.educationType as 'School' | 'UG',
          class: profileData.class,
          stream: profileData.stream,
          course: profileData.course,
          year: profileData.year,
          state: profileData.state,
        });
      }
    } catch (error) {
      console.error('Error fetching profile from database:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileImage();
    fetchProfileFromDatabase();
  }, []);

  useEffect(() => {
    if (studentData) {
      setEditForm({
        name: studentData.name || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        school: studentData.school || '',
        educationType: studentData.educationType || 'School',
        class: studentData.class || '',
        stream: studentData.stream || '',
        course: studentData.course || '',
        year: studentData.year || '',
        state: studentData.state || '',
      });
    }
  }, [studentData]);

  const loadProfileImage = async () => {
    // This is now handled by ThemeContext
  };

  const saveProfileImage = async (imageUri: string) => {
    await setThemeProfileImage(imageUri);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await saveProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const updateProfile = async () => {
    if (!editForm.name || !editForm.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      setLoading(true);

      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        Alert.alert('Error', 'User session not found');
        return;
      }

      // Update in Supabase using current user email
      const { data, error } = await supabase
        .from('students')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          school: editForm.school,
          education_type: editForm.educationType,
          class: editForm.class,
          stream: editForm.stream,
          course: editForm.course,
          year: editForm.year,
          state: editForm.state,
        })
        .eq('email', userEmail)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        return;
      }

      // Update local context with the returned data
      if (data && setStudentData) {
        const updatedData = {
          name: data.name || '',
          username: data.username || data.email || '',
          email: data.email || '',
          phone: data.phone || '',
          school: data.school || '',
          educationType: data.education_type || 'School',
          class: data.class || '',
          stream: data.stream || '',
          course: data.course || '',
          year: data.year || '',
          state: data.state || '',
          password: data.password || '',
        };
        
        setStudentData(updatedData);
      }

      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Refresh profile data from database to ensure consistency
      await fetchProfileFromDatabase();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        Alert.alert('Error', 'User session not found');
        return;
      }

      // First verify current password
      const { data: currentUser, error: verifyError } = await supabase
        .from('students')
        .select('password')
        .eq('email', userEmail)
        .single();

      if (verifyError || !currentUser) {
        Alert.alert('Error', 'Failed to verify current user');
        return;
      }

      if (currentUser.password !== passwordForm.currentPassword) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: passwordForm.newPassword })
        .eq('email', userEmail);

      if (updateError) {
        console.error('Error updating password:', updateError);
        Alert.alert('Error', 'Failed to change password. Please try again.');
        return;
      }

      // Update local context
      if (setStudentData && studentData) {
        setStudentData({
          ...studentData,
          password: passwordForm.newPassword,
        });
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearUserSession();
              if (setStudentData) setStudentData(null);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  const resetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all your test progress, schedules, and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const userEmail = await getCurrentUserEmail();
              if (userEmail) {
                // Clear only exam-related AsyncStorage data (keep student profile)
                await AsyncStorage.multiRemove([
                  `completedTests_${userEmail}`,
                  `completedTests_${userEmail}_academicTotal`,
                ]);

                // Clear exam results from database
                const { error: dbError } = await supabase
                  .from('exam_results')
                  .delete()
                  .eq('student_email', userEmail)
                  .select();

                if (dbError) {
                  console.error('Error clearing exam results:', dbError);
                  Alert.alert('Warning', 'Exam data reset but some exam history may remain');
                }

                // Reset only test progress context (keep student data)
                await resetProgress(); // Clear test progress context only
                
                Alert.alert('Success', 'Exam history and test progress has been reset. Your profile remains unchanged.');
              }
            } catch (error) {
              console.error('Error resetting exam data:', error);
              Alert.alert('Error', 'Failed to reset exam data');
            }
          }
        }
      ]
    );
  };



  const renderPickerItem = (
    title: string,
    description: string,
    value: string,
    options: string[],
    onValueChange: (value: string) => void,
    icon?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        {icon && <Text style={styles.settingIcon}>{icon}</Text>}
        <View style={styles.settingTexts}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => {
          Alert.alert(
            title,
            'Select an option:',
            options.map(option => ({
              text: option,
              onPress: () => onValueChange(option)
            }))
          );
        }}
      >
        <Text style={styles.pickerText}>{value}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenTemplate>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Profile</Text>
            
            <LinearGradient
              colors={['rgba(103, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
              style={styles.profileCard}
            >
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <Text style={styles.profileImageText}>
                      {studentData?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.editImageOverlay}>
                  <Text style={styles.editImageText}>📷</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{studentData?.name || 'Student'}</Text>
                <Text style={styles.profileEmail}>{studentData?.email || 'email@example.com'}</Text>
                <Text style={styles.profileDetails}>
                  {studentData?.educationType === 'School' 
                    ? `Class ${studentData?.class} • ${studentData?.stream || 'General'}`
                    : `${studentData?.course || 'UG'} Student`
                  }
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setShowEditProfile(true)}
              >
                <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>







          {/* Appearance Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Appearance</Text>
            
            {renderPickerItem(
              'Theme',
              'Choose your preferred color theme',
              themeSettings.appearance.theme,
              ['dark', 'light', 'auto'],
              (value) => updateAppearance({ theme: value as any }),
              '🌙'
            )}
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Account</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowChangePassword(true)}
            >
              <Text style={styles.actionButtonIcon}>🔑</Text>
              <Text style={styles.actionButtonText}>Change Password</Text>
              <Text style={styles.actionButtonArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={resetAppData}
            >
              <Text style={styles.actionButtonIcon}>🔄</Text>
              <Text style={styles.actionButtonText}>Reset App Data</Text>
              <Text style={styles.actionButtonArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.actionButtonIcon}>🚪</Text>
              <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
              <Text style={[styles.actionButtonArrow, styles.logoutText]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ About</Text>
            
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.infoCard}
            >
              <Text style={styles.infoTitle}>Mentora - Career Guidance App</Text>
              <Text style={styles.infoText}>Version 1.0.0</Text>
              <Text style={styles.infoText}>
                A comprehensive platform for student assessment, career guidance, and academic planning.
              </Text>
              <Text style={styles.infoText}>
                Developed with ❤️ for students seeking their perfect career path.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfile}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#1a1a2e", "#16213e"]}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Edit Profile</Text>
              
              <ScrollView style={styles.modalScroll}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#888"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({...prev, name: text}))}
                />
                
                <TextInput
                style={[styles.input, styles.disabledInput]}
                placeholder="Email"
                placeholderTextColor="#888"
                value={editForm.email}
                editable={false}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#888"
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm(prev => ({...prev, phone: text}))}
                  keyboardType="phone-pad"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="School/College Name"
                  placeholderTextColor="#888"
                  value={editForm.school}
                  onChangeText={(text) => setEditForm(prev => ({...prev, school: text}))}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#888"
                  value={editForm.state}
                  onChangeText={(text) => setEditForm(prev => ({...prev, state: text}))}
                />
                
                {editForm.educationType === 'School' ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Class"
                      placeholderTextColor="#888"
                      value={editForm.class}
                      onChangeText={(text) => setEditForm(prev => ({...prev, class: text}))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Stream"
                      placeholderTextColor="#888"
                      value={editForm.stream}
                      onChangeText={(text) => setEditForm(prev => ({...prev, stream: text}))}
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Course"
                      placeholderTextColor="#888"
                      value={editForm.course}
                      onChangeText={(text) => setEditForm(prev => ({...prev, course: text}))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Year"
                      placeholderTextColor="#888"
                      value={editForm.year}
                      onChangeText={(text) => setEditForm(prev => ({...prev, year: text}))}
                    />
                  </>
                )}
              </ScrollView>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowEditProfile(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={updateProfile}
                disabled={loading}
                >
                {loading ? (
                <ActivityIndicator color="white" />
                ) : (
                    <Text style={[styles.modalButtonText, styles.primaryButtonText]}>
                       Save Changes
                     </Text>
                   )}
                 </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={showChangePassword}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowChangePassword(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#1a1a2e", "#16213e"]}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Change Password</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor="#888"
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, currentPassword: text}))}
                secureTextEntry
              />
              
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#888"
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, newPassword: text}))}
                secureTextEntry
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#888"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, confirmPassword: text}))}
                secureTextEntry
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowChangePassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={changePassword}
                disabled={loading}
                >
                {loading ? (
                <ActivityIndicator color="white" />
                ) : (
                    <Text style={[styles.modalButtonText, styles.primaryButtonText]}>
                       Change Password
                     </Text>
                   )}
                 </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    </ScreenTemplate>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    opacity: 0.8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 15,
    paddingLeft: 10,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImageContainer: {
    position: 'relative' as const,
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  editImageOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editImageText: {
    fontSize: 14,
  },
  profileInfo: {
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 14,
    color: '#aaa',
  },
  editProfileButton: {
    backgroundColor: 'rgba(103, 126, 234, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingTextContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  settingTexts: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 13,
    color: '#ccc',
    opacity: 0.8,
  },
  pickerButton: {
    backgroundColor: 'rgba(103, 126, 234, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#667eea',
    minWidth: 80,
    alignItems: 'center' as const,
  },
  pickerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlign: 'center' as const,
    fontSize: 16,
    fontWeight: '600' as const,
    minWidth: 60,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
  },
  actionButtonArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    borderColor: 'rgba(255, 99, 99, 0.3)',
    backgroundColor: 'rgba(255, 99, 99, 0.1)',
  },
  logoutText: {
    color: '#ff6b6b',
  },
  infoCard: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    width: '100%' as any,
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
    maxHeight: '80%' as any,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 25,
  },
  modalScroll: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#999',
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  primaryButtonText: {
    color: '#fff',
  },
};
