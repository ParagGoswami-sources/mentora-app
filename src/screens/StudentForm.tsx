import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Modal from "react-native-modal";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/Navigation";
// Use the centralized Supabase client for consistent session management
import { supabase } from '../context/SupabaseContext';
// Using centralized Supabase client from context

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Remove this old code block:
/*
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeGR1dXdud3h1YXN4a2F2dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzOTc5NDgsImV4cCI6MjA2NTk3Mzk0OH0.dxlJLyUZmWnGU8NgPX4ulcgnpH39tS2f3s5MIXgNJ78";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
*/

// Removed duplicate type declaration since it's already added above

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const STREAMS = ["Science", "Commerce", "Arts"];

export default function StudentForm() {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    school: "",
    educationType: "School" as "School" | "UG",
    class: "",
    stream: "",
    course: "",
    year: "",
    state: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isStateModalVisible, setStateModalVisible] = useState(false);
  const [isStreamModalVisible, setStreamModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    // Trim whitespace and handle special cases for email
    let cleanValue = value;
    if (field === 'email') {
      cleanValue = value.trim().toLowerCase();
    } else if (field === 'username') {
      cleanValue = value.trim().toLowerCase();
    } else {
      cleanValue = value.trim();
    }
    
    setFormData((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleEducationTypeChange = (type: "School" | "UG") => {
    setFormData((prev) => ({
      ...prev,
      educationType: type,
      class: "",
      course: "",
      year: "",
      stream: "",
    }));
  };

  const validateForm = () => {
    if (!/^[A-Za-z\s]{2,50}$/.test(formData.name)) {
      Alert.alert(
        "Error",
        "Name must be 2-50 characters, letters and spaces only"
      );
      return false;
    }
    if (!/^[A-Za-z0-9]{3,20}$/.test(formData.username)) {
      Alert.alert(
        "Error",
        "Username must be 3-20 characters, alphanumeric only"
      );
      return false;
    }
    if (!/^[A-Za-z0-9\s]{2,100}$/.test(formData.school)) {
      Alert.alert(
        "Error",
        "School name must be 2-100 characters, alphanumeric with spaces"
      );
      return false;
    }
    if (formData.educationType === "School") {
      if (!["10", "11", "12"].includes(formData.class)) {
        Alert.alert("Error", "You must be at least in class 10");
        return false;
      }
      if (
        ["11", "12"].includes(formData.class) &&
        !STREAMS.includes(formData.stream)
      ) {
        Alert.alert("Error", "Please select a valid stream for class 11 or 12");
        return false;
      }
    } else if (formData.educationType === "UG") {
      if (!/^[A-Za-z0-9\s]{2,50}$/.test(formData.course)) {
        Alert.alert(
          "Error",
          "Course must be 2-50 characters, alphanumeric with spaces"
        );
        return false;
      }
      if (!["1", "2", "3", "4"].includes(formData.year)) {
        Alert.alert("Error", "Year must be 1, 2, 3, or 4");
        return false;
      }
    }
    if (!INDIAN_STATES.includes(formData.state)) {
      Alert.alert("Error", "Please select a valid Indian state");
      return false;
    }
    // Clean and validate email
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    // Check for common email typos
    if (cleanEmail.includes('..') || cleanEmail.endsWith('.')) {
      Alert.alert("Error", "Email address contains invalid characters");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      Alert.alert("Error", "Please enter a valid 10-digit Indian phone number");
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        if (!supabase) {
          console.error(
            'Supabase client is undefined - check import path "../context/SupabaseContext"'
          );
          Alert.alert(
            "Error",
            "Supabase client is not initialized. Check the import path."
          );
          return;
        }
        const insertData = {
          name: formData.name.trim(),
          username: formData.username.trim().toLowerCase(),
          school: formData.school.trim(),
          education_type: formData.educationType,
          class: formData.class,
          stream: formData.stream || null,
          course: formData.course || null,
          year: formData.year || null,
          state: formData.state,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
        };

        // Insert student data
        const { error } = await supabase
          .from("students")
          .insert(insertData);
        if (error) throw error;
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "MainApp", params: { userName: formData.name } }],
          })
        );
      } catch (error: any) {
        console.error(
          "Full Supabase error:",
          error,
          error.message,
          error.details,
          error.hint,
          error.code
        );
        Alert.alert(
          "Error",
          `Failed to save student data: ${error.message || "Unknown error"}`
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputFocus = (field: string) => {
    if (keyboardVisible) {
      setTimeout(() => {
        const input = inputRefs.current[field];
        if (input) {
          input.measureLayout(
            scrollViewRef.current as any,
            (_x, y) => scrollViewRef.current?.scrollTo({ y, animated: true }),
            () => {}
          );
        }
      }, 100);
    }
  };

  return (
    <LinearGradient
      colors={["#3f0c89", "#000000", "#8A6A26"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 60}
        style={{ flex: 1 }}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Student Details</Text>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <TextInput
              ref={(ref) => {
                inputRefs.current["name"] = ref;
              }}
              placeholder="Name"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              onFocus={() => handleInputFocus("name")}
            />
            <TextInput
              ref={(ref) => {
                inputRefs.current["username"] = ref;
              }}
              placeholder="Username (3-20 characters, alphanumeric)"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => handleChange("username", text)}
              autoCapitalize="none"
              onFocus={() => handleInputFocus("username")}
            />
            <TextInput
              ref={(ref) => {
                inputRefs.current["school"] = ref;
              }}
              placeholder="School/Institution"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.school}
              onChangeText={(text) => handleChange("school", text)}
              onFocus={() => handleInputFocus("school")}
            />
            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>Education Level:</Text>
              <View style={styles.radioButtons}>
                {["School", "UG"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() =>
                      handleEducationTypeChange(type as "School" | "UG")
                    }
                  >
                    <View
                      style={
                        formData.educationType === type
                          ? styles.radioSelected
                          : styles.radioUnselected
                      }
                    />
                    <Text style={styles.radioText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {formData.educationType === "School" && (
              <>
                <TextInput
                  ref={(ref) => {
                    inputRefs.current["class"] = ref;
                  }}
                  placeholder="Class (10-12)"
                  placeholderTextColor="#ccc"
                  style={styles.input}
                  value={formData.class}
                  onChangeText={(text) => handleChange("class", text)}
                  keyboardType="numeric"
                  onFocus={() => handleInputFocus("class")}
                />
                {["11", "12"].includes(formData.class) && (
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setStreamModalVisible(true)}
                  >
                    <Text
                      style={
                        formData.stream
                          ? styles.inputText
                          : styles.placeholderText
                      }
                    >
                      {formData.stream || "Select Stream"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {formData.educationType === "UG" && (
              <>
                <TextInput
                  ref={(ref) => {
                    inputRefs.current["course"] = ref;
                  }}
                  placeholder="Course (e.g., B.Tech)"
                  placeholderTextColor="#ccc"
                  style={styles.input}
                  value={formData.course}
                  onChangeText={(text) => handleChange("course", text)}
                  onFocus={() => handleInputFocus("course")}
                />
                <TextInput
                  ref={(ref) => {
                    inputRefs.current["year"] = ref;
                  }}
                  placeholder="Year (1-4)"
                  placeholderTextColor="#ccc"
                  style={styles.input}
                  value={formData.year}
                  onChangeText={(text) => handleChange("year", text)}
                  keyboardType="numeric"
                  onFocus={() => handleInputFocus("year")}
                />
              </>
            )}
            <TouchableOpacity
              style={styles.input}
              onPress={() => setStateModalVisible(true)}
            >
              <Text
                style={
                  formData.state ? styles.inputText : styles.placeholderText
                }
              >
                {formData.state || "Select State"}
              </Text>
            </TouchableOpacity>
            <TextInput
              ref={(ref) => {
                inputRefs.current["email"] = ref;
              }}
              placeholder="Email"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => handleInputFocus("email")}
            />
            <TextInput
              ref={(ref) => {
                inputRefs.current["phone"] = ref;
              }}
              placeholder="Phone (10 digits)"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
              maxLength={10}
              onFocus={() => handleInputFocus("phone")}
            />
            <TextInput
              ref={(ref) => {
                inputRefs.current["password"] = ref;
              }}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry
              onFocus={() => handleInputFocus("password")}
            />
            <TextInput
              ref={(ref) => {
                inputRefs.current["confirmPassword"] = ref;
              }}
              placeholder="Confirm Password"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={formData.confirmPassword} // Corrected from formData.value
              onChangeText={(text) => handleChange("confirmPassword", text)}
              secureTextEntry
              onFocus={() => handleInputFocus("confirmPassword")}
            />
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Modal
          isVisible={isStateModalVisible}
          onBackdropPress={() => setStateModalVisible(false)}
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select State</Text>
            <ScrollView style={styles.modalScroll}>
              {INDIAN_STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={styles.modalOption}
                  onPress={() => {
                    handleChange("state", state);
                    setStateModalVisible(false);
                  }}
                >
                  <View
                    style={
                      formData.state === state
                        ? styles.radioSelected
                        : styles.radioUnselected
                    }
                  />
                  <Text style={styles.modalOptionText}>{state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setStateModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <Modal
          isVisible={isStreamModalVisible}
          onBackdropPress={() => setStreamModalVisible(false)}
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Stream</Text>
            <ScrollView style={styles.modalScroll}>
              {STREAMS.map((stream) => (
                <TouchableOpacity
                  key={stream}
                  style={styles.modalOption}
                  onPress={() => {
                    handleChange("stream", stream);
                    setStreamModalVisible(false);
                  }}
                >
                  <View
                    style={
                      formData.stream === stream
                        ? styles.radioSelected
                        : styles.radioUnselected
                    }
                  />
                  <Text style={styles.modalOptionText}>{stream}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setStreamModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleContainer: {
    backgroundColor: "#3f0c89",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#9b5de5",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  input: {
    backgroundColor: "#7c3aed",
    color: "white",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    justifyContent: "center",
  },
  inputText: { color: "white", fontSize: 16 },
  placeholderText: { color: "#ccc", fontSize: 16 },
  radioGroup: { marginBottom: 15 },
  radioLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  radioButtons: { flexDirection: "row", justifyContent: "space-between" },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    marginRight: 10,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
  },
  radioText: { color: "white", fontSize: 16 },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  modal: { justifyContent: "flex-end", margin: 0 },
  modalContent: {
    backgroundColor: "#9b5de5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 15,
  },
  modalScroll: { maxHeight: 400 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  modalOptionText: { color: "white", fontSize: 16, marginLeft: 10 },
  modalCloseButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 15,
  },
  modalCloseText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
