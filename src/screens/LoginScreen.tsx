import React, { useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  TextInput,
  Alert,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/Navigation";
import { Canvas, Fill, Circle } from "@shopify/react-native-skia";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../context/SupabaseContext";
import { loginWithoutEmailConfirmation, signUpWithoutConfirmation } from "../utils/authConfig";
import { useStudent } from "../context/StudentContext";
import { useTestProgress } from "../context/TestProgressContext";

const { width, height } = Dimensions.get("window");
const NUM_STARS = 30;

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, "Login">;

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function useStars() {
  const stars = [];
  for (let i = 0; i < NUM_STARS; i++) {
    const x = useSharedValue(randomRange(0, width));
    const y = useSharedValue(randomRange(0, height));
    const r = randomRange(1, 3);
    const dx = randomRange(-0.3, 0);
    const dy = randomRange(-0.3, 0.3);
    stars.push({ x, y, r, dx, dy });
  }
  return stars;
}

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenProp>();
  const { clearStudentData } = useStudent();
  const { reloadTestsForUser } = useTestProgress();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const touchX = useSharedValue(width / 2);
  const touchY = useSharedValue(height / 2);
  const stars = useStars();
  const gesture = Gesture.Pan().onUpdate((e) => {
    touchX.value = e.absoluteX;
    touchY.value = e.absoluteY;
  });
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 4000 }), -1);
  }, []);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const angle = rotation.value % 360;
    const progress = angle / 360;
    const borderColor = interpolateColor(
      progress,
      [0, 0.25, 0.5, 0.75, 1],
      ["#FFD700", "#000000", "#FFD700", "#000000", "#FFD700"]
    );
    return { borderColor };
  });

  useEffect(() => {
    let animationFrameId: number;
    function animate() {
      stars.forEach((star) => {
        let newX = star.x.value + star.dx;
        let newY = star.y.value + star.dy;
        if (newX < 0 || newX > width) star.dx = -star.dx;
        if (newY < 0 || newY > height) star.dy = -star.dy;
        star.x.value += star.dx;
        star.y.value += star.dy;
      });
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [stars]);

  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const rememberMeValue = await AsyncStorage.getItem("rememberMe");
        if (rememberMeValue !== "true") return;

        const sessionData = await AsyncStorage.getItem("supabase.auth.token");
        if (!sessionData) return;

        const {
          data: { session },
          error,
        } = await supabase.auth.setSession(JSON.parse(sessionData));
        if (error || !session?.user) {
          return;
        }

        const { data: studentData, error: fetchError } = await supabase
          .from("students")
          .select("name, username, phone, email")
          .eq("email", session.user.email)
          .single();

        if (fetchError || !studentData) {
          return;
        }

        navigation.navigate("MainApp", {
          userName: studentData.name,
          phone: studentData.phone,
          email: studentData.email,
        });
      } catch (error) {
        console.error("Error checking saved session:", error);
      }
    };
    checkSavedSession();
  }, [navigation]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch user data from students table
      const { data: studentData, error: fetchError } = await supabase
        .from("students")
        .select("name, username, phone, email, password")
        .eq("username", username.toLowerCase())
        .single();

      if (fetchError || !studentData) {
        Alert.alert("Error", "No user found with that username");
        navigation.navigate("StudentForm");
        return;
      }

      // Verify password against students table
      if (studentData.password !== password) {
        Alert.alert("Error", "Invalid username or password");
        return;
      }

      // Try to sign in with Supabase auth using improved error handling
      const cleanEmail = studentData.email.trim().toLowerCase();
      const authResult = await loginWithoutEmailConfirmation(cleanEmail, password);
      let authData: any = { user: null, session: null };
      let authError: any = null;
      
      if (authResult.success) {
        authData = {
          user: authResult.user,
          session: authResult.session
        };
        if (authResult.needsConfirmation) {
          // Login successful but email needs confirmation
        }
      } else {
        authError = { message: authResult.error };
      }

      // If auth user doesn't exist, create one or continue without auth
      if (
        authError &&
        (authError.message.includes("Invalid login credentials") || 
         authError.message.includes("User not found"))
      ) {
        
        let signUpData: any = { user: null, session: null };
        
        try {
          // Clean email before auth operation
          const cleanEmail = studentData.email.trim().toLowerCase();
          const signUpResult = await signUpWithoutConfirmation(cleanEmail, password);
          
          if (signUpResult.success) {
            if (signUpResult.alreadyExists) {
              authData = { user: null, session: null };
            } else {
              signUpData = {
                user: signUpResult.user,
                session: signUpResult.session
              };
              authData = signUpData;
            }
          } else {
            console.error("Sign-up error:", signUpResult.error);
            authData = { user: null, session: null };
          }
        } catch (error) {
          console.error("Signup attempt failed:", error);
          authData = { user: null, session: null };
        }
        
        // For new signups with authData set, handle email confirmation flow if needed
        if (authData.user && !authData.session) {
          Alert.alert(
            "Account Created", 
            "Your account has been created! You can start using the app. Check your email to confirm your account for full features.",
            [{ text: "OK" }]
          );
          authData = { user: null, session: null };
        }
      } else if (authError) {
        console.error("Auth error:", authError);
        
        // Handle email not confirmed error specifically
        if (authError.message.includes("Email not confirmed")) {
          Alert.alert(
            "Email Not Confirmed", 
            "Your email address hasn't been confirmed yet. You can still use the app with basic features. Check your email for a confirmation link.",
            [{ text: "Continue Anyway", onPress: () => {
              // Continue without auth session - user can still access the app
            }}]
          );
          // Don't return here - continue with the login flow
        } else {
          Alert.alert("Error", "Authentication failed");
          return;
        }
      }

      // Store session if rememberMe is checked and we have a valid session
      if (rememberMe && authData?.session) {
        await AsyncStorage.setItem("rememberMe", "true");
        await AsyncStorage.setItem(
          "supabase.auth.token",
          JSON.stringify(authData.session)
        );
      } else {
        await AsyncStorage.removeItem("rememberMe");
        await AsyncStorage.removeItem("supabase.auth.token");
      }
      
      // Always store user email for profile access with session time
      await AsyncStorage.setItem("userEmail", studentData.email);
      await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
      
      // Clear any existing student context and load user-specific test data
      clearStudentData();
      await reloadTestsForUser(); // Load test data for this specific user

      navigation.navigate("MainApp", {
        userName: studentData.name,
        phone: studentData.phone,
        email: studentData.email,
      });
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An unexpected error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!username) {
      Alert.alert(
        "Error",
        "Please enter a username before resetting the password"
      );
      return;
    }
    setShowForgotModal(true);
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
      // Verify username and phone number
      const { data, error } = await supabase
        .from("students")
        .select("username, phone, email")
        .eq("username", username.toLowerCase())
        .eq("phone", phoneNumber)
        .single();

      if (error || !data) {
        Alert.alert(
          "Error",
          "Username and phone number do not match any registered user"
        );
        return;
      }

      // Update password in students table
      const { error: studentUpdateError } = await supabase
        .from("students")
        .update({ password: newPassword })
        .eq("username", username.toLowerCase());

      if (studentUpdateError) {
        console.error("Student table update error:", studentUpdateError);
        Alert.alert("Error", "Failed to update password");
        return;
      }

      // Trigger password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: "your-app://reset-password", // Adjust redirect URL as needed
        }
      );
      if (resetError) {
        console.error("Password reset error:", resetError);
        Alert.alert("Error", "Failed to send password reset email");
        return;
      }

      Alert.alert(
        "Success",
        "A password reset link has been sent to your email. Please follow the link to reset your password.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowForgotModal(false);
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

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setPhoneNumber("");
    setNewPassword("");
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);
  const toggleShowNewPassword = () => setShowNewPassword((prev) => !prev);
  const toggleRememberMe = () => setRememberMe((prev) => !prev);

  return (
    <LinearGradient
      colors={["#3f0c89", "#000000", "#8A6A26"]}
      style={styles.container}
    >
      <GestureDetector gesture={gesture}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color="transparent" />
          {stars.map((star, i) => (
            <Circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.r}
              color="white"
              opacity={0.8}
            />
          ))}
          <Circle cx={touchX} cy={touchY} r={10} color="white" />
        </Canvas>
      </GestureDetector>
      <Animated.View style={[styles.card, animatedBorderStyle]}>
        <Text style={styles.title}>HEY SEEKER!</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#ccc"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputWithButton}
            placeholder="Password"
            placeholderTextColor="#ccc"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={toggleShowPassword}
          >
            <Text style={styles.eyeIcon}>{showPassword ? "😯" : "😌"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              rememberMe ? styles.checkboxChecked : styles.checkboxUnchecked,
            ]}
            onPress={toggleRememberMe}
          >
            {rememberMe && <Text style={styles.checkmark}>✔</Text>}
          </TouchableOpacity>
          <Text style={styles.rememberMeText}>Remember Me</Text>
        </View>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={handleSignUp}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </Animated.View>

      {showForgotModal && (
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your registered phone number and new password
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputWithButton}
                  placeholder="New Password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={toggleShowNewPassword}
                >
                  <Text style={styles.eyeIcon}>
                    {showNewPassword ? "😯" : "😌"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeForgotModal}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handlePhoneSubmit}
                  disabled={isResetLoading}
                >
                  {isResetLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.modalButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: "#9b5de5",
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
    alignSelf: "center",
    marginTop: 250,
    borderWidth: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
  },
  inputWithButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: { padding: 10 },
  eyeIcon: { fontSize: 20, color: "#666" },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#64b5f6",
    borderColor: "#64b5f6",
  },
  checkboxUnchecked: {
    backgroundColor: "transparent",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  rememberMeText: {
    color: "#f3f3f3",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#f3f3f3",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 16,
    textDecorationLine: "underline",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  loginButton: { backgroundColor: "#64b5f6" },
  signUpButton: { backgroundColor: "#1976d2" },
  buttonText: { fontWeight: "bold", fontSize: 16, color: "white" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: { width: "100%", alignItems: "center" },
  modalContent: {
    backgroundColor: "#9b5de5",
    width: "85%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#e0e0e0",
    textAlign: "center",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#000",
    width: "100%",
    marginBottom: 12,
  },
  modalButtonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: { backgroundColor: "#666" },
  submitButton: { backgroundColor: "#64b5f6" },
  modalButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
