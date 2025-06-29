import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

type Page1Props = {
  onNext: () => void;
};

const Page1 = ({ onNext }: Page1Props) => {
  const navigation = useNavigation<any>();

  return (
    <ImageBackground
      source={require("../../../assets/skip_background2.jpg")} // Replace with your gradient bg image
      style={styles.background}
      imageStyle={{ borderRadius: 30 }}
    >
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      {/* Center Content */}
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Break the{"\n"}Mental Fog</Text>
        <Text style={styles.subtitle}>
          Every decision starts with a clear mind.
        </Text>
      </View>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
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
  skipButton: {
    alignSelf: "flex-end",
    minWidth: 20,
  },
  skipButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  image: {
    width: 200,
    height: 200,
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
    marginVertical: 250,
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
    paddingHorizontal: 120,
    borderRadius: 30,
    marginBottom: 28,
  },
  nextButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Page1;
