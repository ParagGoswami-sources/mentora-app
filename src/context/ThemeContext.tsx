import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserEmail } from "../utils/userSession";

export interface ThemeSettings {
  theme: "dark" | "light" | "auto";
  fontSize: "small" | "medium" | "large";
  language: "en" | "hi" | "es";
}

export interface NotificationSettings {
  studyReminders: boolean;
  performanceAlerts: boolean;
  parentUpdates: boolean;
  dailyGoals: boolean;
}

export interface PrivacySettings {
  shareProgress: boolean;
  allowAnalytics: boolean;
  parentAccess: boolean;
}

export interface StudySettings {
  reminderTime: number;
  dailyGoalHours: number;
  autoScheduleWeakSubjects: boolean;
  difficultyLevel: "easy" | "medium" | "hard";
}

export interface AppSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  study: StudySettings;
  appearance: ThemeSettings;
}

interface ThemeContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateAppearance: (appearance: Partial<ThemeSettings>) => Promise<void>;
  profileImage: string | null;
  setProfileImage: (imageUri: string | null) => Promise<void>;
  getThemeColors: () => any;
  getFontSizes: () => any;
  isDark: boolean;
}

const defaultSettings: AppSettings = {
  notifications: {
    studyReminders: true,
    performanceAlerts: true,
    parentUpdates: false,
    dailyGoals: true,
  },
  privacy: {
    shareProgress: true,
    allowAnalytics: true,
    parentAccess: false,
  },
  study: {
    reminderTime: 15,
    dailyGoalHours: 2,
    autoScheduleWeakSubjects: true,
    difficultyLevel: "medium",
  },
  appearance: {
    theme: "dark",
    fontSize: "medium",
    language: "en",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadProfileImage();
  }, []);

  // Monitor user changes and clear profile image when user switches
  useEffect(() => {
    const checkUserChange = async () => {
      const userEmail = await getCurrentUserEmail();
      if (userEmail !== currentUserEmail) {
        if (currentUserEmail && !userEmail) {
          // User logged out - clear profile image
          setProfileImageState(null);
        }
        setCurrentUserEmail(userEmail);
        if (userEmail) {
          // New user - load their profile image
          loadProfileImage();
        }
      }
    };

    const interval = setInterval(checkUserChange, 1000);
    return () => clearInterval(interval);
  }, [currentUserEmail]);

  const loadSettings = async () => {
    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;

      const stored = await AsyncStorage.getItem(`settings_${userEmail}`);
      if (stored) {
        const storedSettings = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...storedSettings });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const loadProfileImage = async () => {
    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;

      const stored = await AsyncStorage.getItem(`profileImage_${userEmail}`);
      if (stored) {
        setProfileImageState(stored);
      }
    } catch (error) {
      console.error("Error loading profile image:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;

      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(
        `settings_${userEmail}`,
        JSON.stringify(updatedSettings)
      );
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const updateAppearance = async (appearance: Partial<ThemeSettings>) => {
    const updatedSettings = {
      ...settings,
      appearance: { ...settings.appearance, ...appearance },
    };
    await updateSettings(updatedSettings);
  };

  const setProfileImage = async (imageUri: string | null) => {
    try {
      const userEmail = await getCurrentUserEmail();
      if (!userEmail) return;

      if (imageUri) {
        await AsyncStorage.setItem(`profileImage_${userEmail}`, imageUri);
      } else {
        await AsyncStorage.removeItem(`profileImage_${userEmail}`);
      }
      setProfileImageState(imageUri);
    } catch (error) {
      console.error("Error saving profile image:", error);
    }
  };

  const isDark =
    settings.appearance.theme === "dark" ||
    (settings.appearance.theme === "auto" && true); // For now, assume auto = dark

  const getThemeColors = () => {
    if (isDark) {
      return {
        background: "#000000",
        surface: "#1a1a1a",
        primary: "#667eea",
        secondary: "#764ba2",
        text: "#ffffff",
        textSecondary: "#cccccc",
        border: "rgba(255, 255, 255, 0.1)",
        card: "rgba(255, 255, 255, 0.05)",
      };
    } else {
      return {
        background: "#ffffff",
        surface: "#f5f5f5",
        primary: "#667eea",
        secondary: "#764ba2",
        text: "#000000",
        textSecondary: "#666666",
        border: "rgba(0, 0, 0, 0.1)",
        card: "rgba(0, 0, 0, 0.05)",
      };
    }
  };

  const getFontSizes = () => {
    const baseSize =
      settings.appearance.fontSize === "small"
        ? 0.9
        : settings.appearance.fontSize === "large"
        ? 1.2
        : 1.0;

    return {
      tiny: 10 * baseSize,
      small: 12 * baseSize,
      medium: 14 * baseSize,
      large: 16 * baseSize,
      xlarge: 18 * baseSize,
      xxlarge: 20 * baseSize,
      title: 24 * baseSize,
      header: 28 * baseSize,
    };
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        updateSettings,
        updateAppearance,
        profileImage,
        setProfileImage,
        getThemeColors,
        getFontSizes,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Instead of throwing error, return default theme for better UX
    console.warn(
      "useTheme must be used within a ThemeProvider. Using default theme."
    );
    return {
      settings: defaultSettings,
      updateSettings: async () => {},
      updateAppearance: async () => {},
      profileImage: null,
      setProfileImage: async () => {},
      getThemeColors: () => ({
        background: "#1a1a2e",
        surface: "#16213e",
        primary: "#667eea",
        secondary: "#764ba2",
        text: "#ffffff",
        textSecondary: "#e0e0e0",
        border: "rgba(255, 255, 255, 0.1)",
        card: "rgba(255, 255, 255, 0.05)",
      }),
      getFontSizes: () => ({
        tiny: 10,
        small: 12,
        medium: 14,
        large: 16,
        xlarge: 18,
        xxlarge: 24,
        huge: 32,
      }),
      isDark: true,
    };
  }
  return context;
}
