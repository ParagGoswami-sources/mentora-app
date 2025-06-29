import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface Page3Props {
  onNext?: () => void;
}

const Page3: React.FC<Page3Props> = ({ onNext: _onNext }) => {
  const navigation = useNavigation<any>();

  return (
    <ImageBackground
      source={require("../../../assets/skip_background3.jpg")} // Your gradient background
      style={styles.background}
      imageStyle={{ borderRadius: 30 }}
    >
      {/* Center Content */}
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Set Goals That{"\n"}Actually Matter</Text>
        <Text style={styles.subtitle}>Stop drifting. Start building.</Text>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text style={styles.nextButtonText}>Continue sign up</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginText}> Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
    justifyContent: "space-between",
    backgroundColor: "#000",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
    marginBottom: 10,
    alignSelf: "flex-start",
    width: "100%",
    marginVertical: 270,
    marginHorizontal: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#e0e0e0",
    textAlign: "left",
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    width: "100%",
  },
  footer: {
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 100,
    borderRadius: 30,
    marginBottom: 12,
  },
  nextButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginPrompt: {
    color: "white",
    fontSize: 14,
  },
  loginText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});

export default Page3;
