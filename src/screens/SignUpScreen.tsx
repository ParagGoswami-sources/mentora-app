import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/Navigation";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../context/SupabaseContext';
import AsyncStorage from "@react-native-async-storage/async-storage";

type SignUpScreenProp = NativeStackNavigationProp<RootStackParamList, "SignUp">;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const STREAMS = ["Science", "Commerce", "Arts"];

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenProp>();
  const { getThemeColors } = useTheme();
  const colors = getThemeColors();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step signup
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    school: "",
    educationType: "School" as "School" | "UG",
    class: "",
    stream: "",
    course: "",
    year: "",
    state: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const { name, username, email, phone, password, confirmPassword } = formData;
    
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return false;
    }
    if (!username.trim()) {
      Alert.alert("Error", "Username is required");
      return false;
    }
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!email.trim() || !emailRegex.test(email.trim())) {
    //   Alert.alert("Error", "Please enter a valid email address");
    //   return false;
    // }
    if (!email.trim()) {
      Alert.alert("Error", "Email is required");
      return false;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert("Error", "Valid phone number is required");
      return false;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { school, state, educationType, class: classValue, stream, course, year } = formData;
    
    if (!school.trim()) {
      Alert.alert("Error", "School/Institution is required");
      return false;
    }
    if (!state) {
      Alert.alert("Error", "State is required");
      return false;
    }
    
    if (educationType === "School") {
      if (!classValue) {
        Alert.alert("Error", "Class is required");
        return false;
      }
      if (parseInt(classValue) >= 11 && !stream) {
        Alert.alert("Error", "Stream is required for classes 11-12");
        return false;
      }
    } else {
      if (!course.trim()) {
        Alert.alert("Error", "Course is required");
        return false;
      }
      if (!year) {
        Alert.alert("Error", "Year is required");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Temporarily skip auth signup for testing
      // const authResult = await signUpWithoutConfirmation(formData.email, formData.password);
      
      // if (!authResult.success && !authResult.alreadyExists) {
      //   Alert.alert("Error", authResult.error || "Failed to create account");
      //   setLoading(false);
      //   return;
      // }

      // Insert student data
      const insertData = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        school: formData.school.trim(),
        education_type: formData.educationType,
        class: formData.class || null,
        stream: formData.stream || null,
        course: formData.course || null,
        year: formData.year || null,
        state: formData.state,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      };

      const { error } = await supabase.from("students").insert(insertData);
      
      if (error) {
        if (error.message.includes('duplicate key')) {
          Alert.alert("Error", "An account with this email or username already exists");
        } else {
          Alert.alert("Error", `Failed to save profile: ${error.message}`);
        }
        setLoading(false);
        return;
      }

      // Save session
      await AsyncStorage.setItem("userEmail", formData.email.trim().toLowerCase());
      await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
      
      Alert.alert(
        "Success", 
        "Account created successfully!", 
        [{ text: "OK", onPress: () => navigation.navigate("MainApp", { userName: formData.name }) }]
      );

    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>Personal Information</Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="account" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Full Name"
          placeholderTextColor={colors.textSecondary}
          value={formData.name}
          onChangeText={(text) => updateFormData("name", text)}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="at" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Username"
          placeholderTextColor={colors.textSecondary}
          value={formData.username}
          onChangeText={(text) => updateFormData("username", text)}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="email" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Email Address"
          placeholderTextColor={colors.textSecondary}
          value={formData.email}
          onChangeText={(text) => updateFormData("email", text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Phone Number"
          placeholderTextColor={colors.textSecondary}
          value={formData.phone}
          onChangeText={(text) => updateFormData("phone", text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text, flex: 1 }]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={formData.password}
          onChangeText={(text) => updateFormData("password", text)}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <MaterialCommunityIcons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock-check" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text, flex: 1 }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textSecondary}
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData("confirmPassword", text)}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
          <MaterialCommunityIcons 
            name={showConfirmPassword ? "eye-off" : "eye"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>Next</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Academic Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your education</Text>

      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="school" size={20} color={colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="School/Institution Name"
          placeholderTextColor={colors.textSecondary}
          value={formData.school}
          onChangeText={(text) => updateFormData("school", text)}
        />
      </View>

      <View style={styles.radioContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Education Level:</Text>
        <View style={styles.radioGroup}>
          {["School", "UG"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.radioOption,
                formData.educationType === type && styles.radioSelected
              ]}
              onPress={() => updateFormData("educationType", type)}
            >
              <Text style={[
                styles.radioText,
                { color: formData.educationType === type ? "white" : colors.text }
              ]}>
                {type === "UG" ? "Undergraduate" : "School"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.educationType === "School" ? (
        <>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="numeric" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Class (1-12)"
              placeholderTextColor={colors.textSecondary}
              value={formData.class}
              onChangeText={(text) => updateFormData("class", text)}
              keyboardType="numeric"
            />
          </View>

          {parseInt(formData.class) >= 11 && (
            <View style={styles.dropdownContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.primary} style={styles.inputIcon} />
              <View style={styles.dropdown}>
                <Text style={[styles.dropdownLabel, { color: colors.text }]}>Stream:</Text>
                <View style={styles.dropdownOptions}>
                  {STREAMS.map((stream) => (
                    <TouchableOpacity
                      key={stream}
                      style={[
                        styles.dropdownOption,
                        formData.stream === stream && styles.dropdownSelected
                      ]}
                      onPress={() => updateFormData("stream", stream)}
                    >
                      <Text style={[
                        styles.dropdownText,
                        { color: formData.stream === stream ? "white" : colors.text }
                      ]}>
                        {stream}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="book" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Course Name"
              placeholderTextColor={colors.textSecondary}
              value={formData.course}
              onChangeText={(text) => updateFormData("course", text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Year (1st, 2nd, 3rd, 4th)"
              placeholderTextColor={colors.textSecondary}
              value={formData.year}
              onChangeText={(text) => updateFormData("year", text)}
            />
          </View>
        </>
      )}

      <View style={styles.dropdownContainer}>
        <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} style={styles.inputIcon} />
        <View style={styles.dropdown}>
          <Text style={[styles.dropdownLabel, { color: colors.text }]}>State:</Text>
          <ScrollView style={styles.stateDropdown} nestedScrollEnabled>
            {INDIAN_STATES.map((state) => (
              <TouchableOpacity
                key={state}
                style={[
                  styles.dropdownOption,
                  formData.state === state && styles.dropdownSelected
                ]}
                onPress={() => updateFormData("state", state)}
              >
                <Text style={[
                  styles.dropdownText,
                  { color: formData.state === state ? "white" : colors.text }
                ]}>
                  {state}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
          <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.buttonGradient}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>Create Account</Text>
                <MaterialCommunityIcons name="check" size={20} color="white" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Sign Up</Text>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
          </View>

          <View style={styles.content}>
            {step === 1 ? renderStep1() : renderStep2()}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{" "}
              <Text 
                style={[styles.linkText, { color: colors.primary }]}
                onPress={() => navigation.navigate("Login")}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  stepDotActive: {
    backgroundColor: "#667eea",
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: "#667eea",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  radioContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
  },
  radioOption: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  radioSelected: {
    backgroundColor: "#667eea",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dropdownOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dropdownOption: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownSelected: {
    backgroundColor: "#667eea",
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
  },
  stateDropdown: {
    maxHeight: 200,
  },
  nextButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signupButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontWeight: "600",
  },
});
