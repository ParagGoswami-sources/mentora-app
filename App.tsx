import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Navigation from "./src/navigation/Navigation";
import { StudentProvider } from "./src/context/StudentContext";
import { TestProgressProvider } from "./src/context/TestProgressContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { NavigationProvider } from "./src/context/NavigationContext";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StudentProvider>
          <TestProgressProvider>
            <NavigationProvider>
              <Navigation />
            </NavigationProvider>
          </TestProgressProvider>
        </StudentProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
