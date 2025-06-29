import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Navigation from "./src/navigation/Navigation";
import { StudentProvider } from "./src/context/StudentContext";
import { TestProgressProvider } from "./src/context/TestProgressContext";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StudentProvider>
          <TestProgressProvider>
            <Navigation />
          </TestProgressProvider>
        </StudentProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
