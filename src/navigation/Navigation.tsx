import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { PageProvider } from "../context/PageContext";
import { useTheme } from "../context/ThemeContext";
// Chatbot functionality moved to dashboard

// Screens
import Onboarding from "../screens/Onboarding/Onboarding";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen"; // ✅ Add this line
import StudentForm from "../screens/StudentForm";
import DashboardScreen from "../screens/DashboardScreen";
import AptitudeTestScreen from "../screens/AptitudeTestScreen";
import RoadmapScreen from "../screens/RoadmapScreen";
import SchedulerScreen from "../screens/SchedulerScreen";
import ParentViewScreen from "../screens/ParentViewScreen";
import PerformanceScreen from "../screens/PerformanceScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SignOutScreen from "../screens/SignOutScreen";

import ExamSelectionScreen from "../screens/ExamSelectionScreen";

// Stack type
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  StudentForm: undefined;
  MainApp: { userName?: string; phone?: string; email?: string };
  AptitudeTest: {
    testId?: string;
    testTitle?: string;
    testType?: "psychometric" | "academic";
    questionCount?: number;
    timeLimit?: number;
  };
  Performance: {
    testId?: string;
    testTitle?: string;
    testType?: "psychometric" | "academic";
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function MainAppDrawer({
  route,
}: {
  route: { params?: { userName?: string; phone?: string; email?: string } };
}) {
  const { getThemeColors } = useTheme();
  // const { areAllExamsCompleted } = useTestProgress(); // No longer needed - Performance always visible
  const colors = getThemeColors() || {
    background: "#1a1a2e",
    surface: "#16213e",
    primary: "#667eea",
    secondary: "#764ba2",
    text: "#ffffff",
    textSecondary: "#e0e0e0",
    border: "rgba(255, 255, 255, 0.1)",
    card: "rgba(255, 255, 255, 0.05)",
  };

  return (
    <>
      <Drawer.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          drawerStyle: {
            backgroundColor: colors.background,
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textSecondary,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
        }}
      >
        <Drawer.Screen
          name="Dashboard"
          component={DashboardScreen}
          initialParams={{ userName: route.params?.userName }}
        />
        <Drawer.Screen name="Exams" component={ExamSelectionScreen} />
        <Drawer.Screen name="Performance" component={PerformanceScreen} />
        <Drawer.Screen name="Roadmap" component={RoadmapScreen} />
        <Drawer.Screen name="Scheduler" component={SchedulerScreen} />
        <Drawer.Screen name="ParentView" component={ParentViewScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
        
        <Drawer.Screen name="SignOut" component={SignOutScreen} />
      </Drawer.Navigator>

      {/* Chatbot components moved to dashboard */}
    </>
  );
}

export default function Navigation() {
  const { getThemeColors } = useTheme();
  const colors = getThemeColors() || {
    background: "#1a1a2e",
    surface: "#16213e",
    primary: "#667eea",
    secondary: "#764ba2",
    text: "#ffffff",
    textSecondary: "#e0e0e0",
    border: "rgba(255, 255, 255, 0.1)",
    card: "rgba(255, 255, 255, 0.05)",
  };

  return (
    <PageProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.primary,
          },
          fonts: {
            regular: {
              fontFamily: "System",
              fontWeight: "normal",
            },
            medium: {
              fontFamily: "System",
              fontWeight: "500",
            },
            bold: {
              fontFamily: "System",
              fontWeight: "bold",
            },
            heavy: {
              fontFamily: "System",
              fontWeight: "900",
            },
          },
        }}
      >
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Onboarding" component={Onboarding} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="StudentForm" component={StudentForm} />
          <Stack.Screen name="AptitudeTest" component={AptitudeTestScreen} />
          <Stack.Screen name="Performance" component={PerformanceScreen} />
          <Stack.Screen name="MainApp" component={MainAppDrawer} />
        </Stack.Navigator>
      </NavigationContainer>
    </PageProvider>
  );
}
