import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import ScreenTemplate from "../components/ScreenTemplate";
import { supabase } from "../context/SupabaseContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  school: string;
  education_type: string;
  class?: string;
  stream?: string;
  course?: string;
  year?: string;
  state: string;
}

export default function ProfileScreen() {
  const { profileImage, setProfileImage } = useTheme();
  const [studentData, setStudentData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isResetLoading, setIsResetLoading] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get email from AsyncStorage
      const storedEmail = await AsyncStorage.getItem("userEmail");
      if (!storedEmail) {
        setError("No user session found. Please log in.");
        Alert.alert(
          "Session Expired",
          "Please log in to view your profile.",
          [
            {
              text: "Log In",
              onPress: () => navigation.navigate("Login"),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      // Query the students table based on email - excluding unwanted fields
      const { data, error: queryError } = await supabase
        .from("students")
        .select("name, email, phone, school, education_type, class, stream, course, year, state")
        .eq("email", storedEmail)
        .single();

      if (queryError) throw queryError;
      setStudentData(data);
      
    } catch (err: any) {
      console.error("Error fetching student data:", err.message);
      setError(err.message || "Failed to fetch student data");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please grant permission to access your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      await setProfileImage(result.assets[0].uri);
    }
  };

  const handleResetPassword = () => {
    if (!studentData?.email) {
      Alert.alert("Error", "Please ensure profile data is loaded.");
      return;
    }
    setShowResetModal(true);
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || !newPassword) {
      Alert.alert("Error", "Phone number and new password are required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit Indian phone number");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long");
      return;
    }

    setIsResetLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("email, phone")
        .eq("email", studentData!.email)
        .eq("phone", phoneNumber)
        .single();

      if (error || !data) {
        Alert.alert("Error", "Email and phone number do not match any registered user");
        return;
      }

      const { error: updateError } = await supabase
        .from("students")
        .update({ password: newPassword })
        .eq("email", studentData!.email);

      if (updateError) {
        console.error("Password update error:", updateError);
        Alert.alert("Error", "Failed to update password");
        return;
      }

      Alert.alert(
        "Success",
        "Password has been reset successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowResetModal(false);
              setPhoneNumber("");
              setNewPassword("");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Password recovery error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setPhoneNumber("");
    setNewPassword("");
  };

  const getFieldIcon = (field: string) => {
    const icons: { [key: string]: string } = {
      name: "account",
      email: "email",
      phone: "phone",
      school: "school",
      education_type: "book-education",
      class: "numeric",
      stream: "book-open-variant",
      course: "book",
      year: "calendar",
      state: "map-marker",
    };
    return icons[field] || "information";
  };

  const formatFieldName = (field: string) => {
    const names: { [key: string]: string } = {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      school: "School/Institution",
      education_type: "Education Level",
      class: "Class",
      stream: "Stream",
      course: "Course",
      year: "Year",
      state: "State",
    };
    return names[field] || field;
  };

  if (loading) {
    return (
      <ScreenTemplate title="Profile">
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        </View>
      </ScreenTemplate>
    );
  }

  if (error) {
    return (
      <ScreenTemplate title="Profile">
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStudentData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Profile">
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.imageBorder}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <MaterialCommunityIcons 
                      name="camera-plus" 
                      size={40} 
                      color="rgba(255, 255, 255, 0.6)" 
                    />
                    <Text style={styles.placeholderText}>Add Photo</Text>
                  </View>
                )}
                <View style={styles.editOverlay}>
                  <MaterialCommunityIcons name="camera" size={20} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.userName}>{studentData?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{studentData?.email}</Text>
          </View>

          {/* Profile Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            {studentData && Object.entries(studentData)
              .filter(([_key, value]) => value && value !== '')
              .map(([key, value]) => (
                <View key={key} style={styles.fieldContainer}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
                    style={styles.fieldCard}
                  >
                    <View style={styles.fieldHeader}>
                      <MaterialCommunityIcons 
                        name={getFieldIcon(key) as any} 
                        size={20} 
                        color="#667eea" 
                      />
                      <Text style={styles.fieldLabel}>{formatFieldName(key)}</Text>
                    </View>
                    <Text style={styles.fieldValue}>{String(value)}</Text>
                  </LinearGradient>
                </View>
              ))
            }
          </View>

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity onPress={handleResetPassword} style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
                style={styles.actionButtonGradient}
              >
                <MaterialCommunityIcons name="key-variant" size={24} color="#667eea" />
                <Text style={styles.actionButtonText}>Reset Password</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255, 255, 255, 0.6)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Reset Password Modal */}
        {showResetModal && (
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.8)']}
                  style={styles.modalGradient}
                >
                  <View style={styles.modalHeader}>
                    <MaterialCommunityIcons name="key-variant" size={32} color="#667eea" />
                    <Text style={styles.modalTitle}>Reset Password</Text>
                    <Text style={styles.modalSubtitle}>
                      Enter your registered phone number and new password
                    </Text>
                  </View>

                  <View style={styles.modalInputContainer}>
                    <View style={styles.inputGroup}>
                      <MaterialCommunityIcons name="phone" size={20} color="#667eea" />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Phone Number"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <MaterialCommunityIcons name="lock" size={20} color="#667eea" />
                      <TextInput
                        style={[styles.modalInput, { flex: 1 }]}
                        placeholder="New Password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <MaterialCommunityIcons 
                          name={showNewPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color="rgba(255, 255, 255, 0.6)" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={closeResetModal}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handlePhoneSubmit}
                      disabled={isResetLoading}
                    >
                      {isResetLoading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.modalButtonText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImage: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  placeholderContainer: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  fieldValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 32,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },

  // Modal Styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalInput: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
