import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

type ScreenTemplateProps = {
  title?: string;
  children: ReactNode;
  scrollable?: boolean; // Allow disabling ScrollView for screens with FlatList
};

const ScreenTemplate: React.FC<ScreenTemplateProps> = ({ children, scrollable = true }) => {
  const { getThemeColors, isDark } = useTheme();
  const colors = getThemeColors() || {
    background: '#1a1a2e',
    surface: '#16213e',
    primary: '#667eea',
    secondary: '#764ba2',
    text: '#ffffff',
    textSecondary: '#e0e0e0',
    border: 'rgba(255, 255, 255, 0.1)',
    card: 'rgba(255, 255, 255, 0.05)',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000", // Match app's dark theme
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  content: {
    flexGrow: 1,
  },
});

export default ScreenTemplate;
