import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ScreenTemplate from "../components/ScreenTemplate";
import { useTestProgress } from "../context/TestProgressContext";
import { useStudent } from "../context/StudentContext";
import { getAIResponse, buildStudentContext, ChatMessage } from "../services/geminiAPI";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type DrawerParamList = {
  Dashboard: { userName?: string };
  AptitudeTest: undefined;
  Roadmap: undefined;
  Scheduler: undefined;
  ParentView: undefined;
  Performance: undefined;
  Profile: undefined;
  Settings: undefined;
};

type NavigationProp = DrawerNavigationProp<DrawerParamList>;
type DashboardRouteProp = RouteProp<DrawerParamList, "Dashboard">;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DashboardRouteProp>();
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentTips, setCurrentTips] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Progress tracking
  const {
    psychometricCompleted,
    psychometricTotal,
    academicCompleted,
    academicTotal,
    psychometricPercentage,
    academicPercentage,
  } = useTestProgress();

  const { studentData } = useStudent();

  // Use current student data name, fallback to route params, then default
  const userName = studentData?.name || route.params?.userName || "User";

  // Study Tips Data Pool (40 tips)
  const getAllStudyTips = () => {
    const generalTips = [
      "Take assessments in a quiet environment for better focus",
      "Review your performance regularly to track improvement", 
      "Complete psychometric tests before academic ones for better insights",
      "Use the scheduler to plan your study sessions effectively",
      "Take short breaks every 25-30 minutes while studying",
      "Practice active recall by testing yourself without looking at notes",
      "Create mind maps to visualize complex concepts",
      "Form study groups with classmates for collaborative learning",
      "Use flashcards for memorizing key terms and formulas",
      "Teach concepts to others to strengthen your understanding",
      "Set specific, measurable goals for each study session",
      "Find your peak concentration hours and study then",
      "Remove distractions like phones during study time",
      "Use different colors for highlighting different types of information",
      "Practice past papers to familiarize with exam patterns",
    ];

    const educationSpecific = studentData ? [
      // School-specific tips
      ...(studentData.educationType === "School" ? [
        `Focus on ${studentData.class}th grade syllabus completion`,
        `Practice previous year ${studentData.class}th board exam papers`,
        `${parseInt(studentData.class || "0") >= 11 ? `Strengthen your ${studentData.stream} fundamentals` : "Build strong foundation for higher classes"}`,
        `${studentData.stream === "Science" ? "Practice numerical problems daily" : studentData.stream === "Commerce" ? "Stay updated with current economic affairs" : "Read extensively to improve language skills"}`,
        "Maintain consistent study schedule for board exam preparation",
        "Create chapter-wise notes for quick revision",
        "Focus on NCERT textbooks as primary study material",
      ] : []),
      
      // UG-specific tips  
      ...(studentData.educationType === "UG" ? [
        `Excel in your ${studentData.course} core subjects`,
        "Participate in college seminars and workshops",
        "Build practical knowledge alongside theoretical concepts",
        "Network with seniors and faculty members",
        "Consider internships in your field of study",
        "Attend guest lectures in your domain",
        "Join professional associations related to your course",
      ] : []),

      // Stream-specific tips
      ...(studentData.stream === "Science" ? [
        "Practice derivations and numerical problems regularly",
        "Understand concepts rather than memorizing formulas",
        "Use lab experiments to visualize theoretical concepts",
        "Keep updated with recent scientific discoveries",
        "Focus on Physics, Chemistry, and Mathematics equally",
      ] : []),
      
      ...(studentData.stream === "Commerce" ? [
        "Stay updated with current business news and trends",
        "Practice balance sheets and profit-loss statements",
        "Understand real-world applications of economic theories",
        "Follow stock market trends and economic indicators",
        "Learn basic accounting software like Tally",
      ] : []),
      
      ...(studentData.stream === "Arts" ? [
        "Develop critical thinking and analytical skills",
        "Read diverse literature and historical perspectives",
        "Practice essay writing and improve vocabulary",
        "Stay informed about current affairs and social issues",
        "Explore creative expression through various mediums",
      ] : []),
    ] : [];

    const motivationalTips = [
      "Celebrate small wins to maintain motivation",
      "Keep a study journal to track your progress",
      "Remember: every expert was once a beginner",
      "Consistency beats intensity in long-term learning",
      "Embrace challenges as opportunities to grow",
      "Your future self will thank you for today's efforts",
      "Focus on progress, not perfection",
      "Believe in your ability to learn and improve",
    ];

    return [...generalTips, ...educationSpecific, ...motivationalTips];
  };

  // Generate 4 random tips
  const generateRandomTips = () => {
    const allTips = getAllStudyTips();
    const shuffled = allTips.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  // Animated tips refresh function
  const refreshTipsWithAnimation = () => {
    // Fade out and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update tips while hidden
      setCurrentTips(generateRandomTips());
      
      // Reset position and fade in from top
      translateY.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Auto-refresh tips every 10 seconds with animation
  useEffect(() => {
    setCurrentTips(generateRandomTips());
    
    const interval = setInterval(() => {
      refreshTipsWithAnimation();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [studentData]);

  const searchMap: { [key: string]: keyof DrawerParamList } = {
    performance: "Performance",
    aptitude: "AptitudeTest",
    "aptitude test": "AptitudeTest",
    roadmap: "Roadmap",
    road: "Roadmap",
    profile: "Profile",
    settings: "Settings",
    scheduler: "Scheduler",
    parent: "ParentView",
    parentview: "ParentView",
  };

  const searchableTerms = Object.keys(searchMap);

  const handleTextChange = (text: string) => {
    setSearchText(text);
    if (text.trim().length > 0) {
      const filteredSuggestions = searchableTerms.filter((term) =>
        term.toLowerCase().includes(text.toLowerCase().trim())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (text: string = searchText) => {
    const searchKey = text.toLowerCase().trim();
    const targetScreen = searchMap[searchKey];
    if (targetScreen) {
      navigation.navigate(targetScreen as any);
      setSearchText("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSearch(item)}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenTemplate>
      <View style={styles.container}>
        <View style={styles.relativeContainer}>
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ImageBackground
              source={require("../../assets/header_wave.png")}
              style={styles.headerBackground}
              imageStyle={{
                borderBottomRightRadius: 40,
                borderBottomLeftRadius: 40,
              }}
            >
              <Text style={styles.title}>Hey {userName}</Text>
              <Text style={styles.subtitle}>Having a great day?</Text>

              <TouchableOpacity
                style={styles.progressButton}
                onPress={() => navigation.navigate("Profile")}
              >
                <Text style={styles.progressText}>Profile</Text>
              </TouchableOpacity>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchBar}
                  placeholder="search"
                  placeholderTextColor="grey"
                  value={searchText}
                  onChangeText={handleTextChange}
                  onSubmitEditing={() => handleSearch()}
                  returnKeyType="done"
                />
              </View>
            </ImageBackground>

            {/* Progress Overview Section */}
            <View style={styles.mainContent}>
              {/* Progress Cards */}
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Your Progress</Text>

                <View style={styles.progressCardsContainer}>
                  {/* Psychometric Progress Card */}
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    style={styles.progressCard}
                  >
                    <Text style={styles.progressCardTitle}>
                      Psychometric Tests
                    </Text>
                    <Text style={styles.progressCardNumber}>
                      {psychometricCompleted}/{psychometricTotal}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${psychometricPercentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressPercentage}>
                        {Math.round(psychometricPercentage)}%
                      </Text>
                    </View>
                  </LinearGradient>

                  {/* Academic Progress Card */}
                  <LinearGradient
                    colors={["#f093fb", "#f5576c"]}
                    style={styles.progressCard}
                  >
                    <Text style={styles.progressCardTitle}>Academic Tests</Text>
                    <Text style={styles.progressCardNumber}>
                      {academicCompleted}/{academicTotal || 0}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${academicPercentage}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressPercentage}>
                        {Math.round(academicPercentage)}%
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickActionsContainer}
                >
                  {[
                    {
                      label: "Take Exams",
                      screen: "Exams",
                      icon: "📝",
                      color: "#4CAF50",
                    },
                    {
                      label: "View Performance",
                      screen: "Performance",
                      icon: "📊",
                      color: "#2196F3",
                    },
                    {
                      label: "Career Roadmap",
                      screen: "Roadmap",
                      icon: "🗺️",
                      color: "#FF9800",
                    },
                    {
                      label: "Schedule",
                      screen: "Scheduler",
                      icon: "📅",
                      color: "#9C27B0",
                    },
                    {
                      label: "Parent View",
                      screen: "ParentView",
                      icon: "👥",
                      color: "#607D8B",
                    },
                  ].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.quickActionCard,
                        { backgroundColor: item.color },
                      ]}
                      onPress={() => navigation.navigate(item.screen as any)}
                    >
                      <Text style={styles.quickActionIcon}>{item.icon}</Text>
                      <Text style={styles.quickActionLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Recent Activity */}
              <View style={styles.recentActivitySection}>
                <Text style={styles.sectionTitle}>Personalized Insights</Text>

                <LinearGradient
                  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                  style={styles.insightCard}
                >
                  <Text style={styles.insightTitle}>
                    👋 Welcome back, {userName}!
                  </Text>
                  <Text style={styles.insightText}>
                    {psychometricCompleted === 0
                      ? "Start your journey with psychometric assessments to discover your potential!"
                      : psychometricCompleted < psychometricTotal
                      ? `You're making great progress! Complete ${
                          psychometricTotal - psychometricCompleted
                        } more tests to unlock your career roadmap.`
                      : academicTotal === 0
                      ? "Complete your profile to access academic assessments tailored to your stream."
                      : "Excellent! You've completed all available assessments. Check your roadmap for career insights!"}
                  </Text>
                </LinearGradient>

                {studentData && (
                  <LinearGradient
                    colors={[
                      "rgba(103, 126, 234, 0.2)",
                      "rgba(118, 75, 162, 0.2)",
                    ]}
                    style={styles.profileCard}
                  >
                    <Text style={styles.profileTitle}>📚 Your Profile</Text>
                    <Text style={styles.profileText}>
                      {studentData.educationType === "School"
                        ? `Class ${studentData.class} • ${
                            studentData.stream || "General"
                          } Stream`
                        : `${
                            studentData.course || studentData.stream || "UG"
                          } Student`}
                    </Text>
                    <Text style={styles.profileSubtext}>
                      {studentData.school || "Student"}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* Tips Section */}
              <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>💡 Study Tips</Text>
                <Text style={styles.tipsSubtitle}>Personalized for {studentData?.educationType === "School" ? `Class ${studentData?.class} ${studentData?.stream}` : studentData?.course || "you"}</Text>

                <Animated.View 
                  style={[
                    styles.tipsContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateY }],
                    }
                  ]}
                >
                  {currentTips.map((tip, index) => (
                    <View key={index} style={styles.tipCard}>
                      <Text style={styles.tipText}>• {tip}</Text>
                    </View>
                  ))}
                </Animated.View>
              </View>
            </View>

            {/* AI Tutor Section */}
            <AIChatSection />

          </ScrollView>

          {showSuggestions && suggestions.length > 0 && (
            <FlatList
              style={styles.suggestionsContainer}
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </ScreenTemplate>
  );
};

// AI Chat Section Component
const AIChatSection: React.FC = () => {
  const { studentData } = useStudent();
  const { completedTests } = useTestProgress();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [_outerScrollEnabled, setOuterScrollEnabled] = useState(true);

  const scrollViewRef = React.useRef<ScrollView>(null);
  
  const screenHeight = Dimensions.get('window').height;
  const chatHeight = isExpanded ? Math.min(400, screenHeight * 0.5) : 250;

  const studentContext = buildStudentContext(studentData, completedTests);

  // Add welcome message on first load
  useState(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        text: `Hi ${studentContext?.name || 'there'}! I'm your AI tutor. Ask me anything about studies, career guidance, or exam tips! 🎓`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);
    
    // Auto-scroll when user sends a message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const aiResponse = await getAIResponse(currentInput, studentContext);
      
      const aiMessage: ChatMessage = {
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-scroll when AI responds
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: ChatMessage = {
        text: "Sorry, I'm having trouble connecting right now. Please try again!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "Give me study tips",
    "How is my performance?",
    "Career guidance",
    "I need motivation"
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage, index: number) => (
    <View key={index} style={[
      styles.messageContainer,
      message.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      {!message.isUser && (
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="robot" size={16} color="white" />
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
      </View>
      
      {message.isUser && (
        <View style={styles.userAvatar}>
          <MaterialCommunityIcons name="account" size={16} color="white" />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.aiChatSection}>
      <TouchableOpacity 
        style={styles.aiChatHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.aiChatHeaderContent}>
          <View style={styles.aiChatIcon}>
            <MaterialCommunityIcons name="robot-excited" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.aiChatTitle}>AI Tutor</Text>
            <Text style={styles.aiChatSubtitle}>
              {studentContext ? `Hi ${studentContext.name}!` : 'Ask me anything'}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="white" 
        />
      </TouchableOpacity>

      {/* Quick stats when collapsed */}
      {!isExpanded && studentContext && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{studentContext.completedTests}</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{studentContext.averageScore}%</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>
      )}

      {/* Expanded chat interface */}
      {isExpanded && (
        <View style={[styles.chatContainer, { maxHeight: chatHeight }]}>
          {/* Messages */}
          <View 
            style={styles.messagesWrapper}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={() => setOuterScrollEnabled(false)}
            onResponderRelease={() => setOuterScrollEnabled(true)}
            onTouchStart={() => setOuterScrollEnabled(false)}
            onTouchEnd={() => setOuterScrollEnabled(true)}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={[styles.messagesContainer, { height: chatHeight }]}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              bounces={true}
              alwaysBounceVertical={false}
              directionalLockEnabled={true}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              pagingEnabled={false}
              decelerationRate="normal"
              onContentSizeChange={(_width, _height) => {
                // Only auto-scroll when sending a new message
                // Don't auto-scroll if user is reading previous messages
              }}
              onScrollBeginDrag={() => {
                setOuterScrollEnabled(false);
              }}
              onScrollEndDrag={() => {
                setOuterScrollEnabled(true);
              }}
            >
              {messages.map(renderMessage)}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>AI Tutor is thinking...</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <View style={styles.quickQuestions}>
              <Text style={styles.quickQuestionsTitle}>Quick questions:</Text>
              <View style={styles.quickQuestionButtons}>
                {quickQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickQuestionButton}
                    onPress={() => setInputText(question)}
                  >
                    <Text style={styles.quickQuestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Input area */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask me anything about your studies..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={200}
                blurOnSubmit={false}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={inputText.trim() ? "white" : "#999"}
              />
            </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "hsl(0, 0.00%, 0.00%)",
  },
  relativeContainer: {
    flex: 1,
    position: "relative",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBackground: {
    padding: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    minHeight: 200,
  },
  title: {
    color: "white",
    fontSize: 40,
    paddingTop: 80,
    fontWeight: "bold",
    marginTop: 10,
  },
  subtitle: {
    color: "white",
    fontSize: 14,
    marginVertical: 4,
    paddingLeft: 3,
  },
  progressButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#fff",
    width: 80,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.8,
  },
  progressText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
  },
  searchContainer: {
    position: "relative",
  },
  searchBar: {
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "black",
    fontSize: 14,
    opacity: 0.8,
  },

  // Main content area
  mainContent: {
    padding: 20,
    paddingTop: 10,
  },

  // Section titles
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },

  // Progress Section
  progressSection: {
    marginBottom: 25,
  },
  progressCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  progressCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    minHeight: 120,
  },
  progressCardTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  progressCardNumber: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
  },
  progressPercentage: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    minWidth: 35,
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 25,
  },
  quickActionsContainer: {
    paddingHorizontal: 5,
    gap: 15,
  },
  quickActionCard: {
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  quickActionLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Insights Section
  recentActivitySection: {
    marginBottom: 25,
  },
  insightCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  insightTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  insightText: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 20,
  },
  profileCard: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  profileTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  profileText: {
    color: "#e0e0e0",
    fontSize: 14,
    marginBottom: 4,
  },
  profileSubtext: {
    color: "#b0b0b0",
    fontSize: 12,
  },

  // Tips Section
  tipsSection: {
    marginBottom: 20,
  },
  tipsContainer: {
    gap: 10,
  },
  tipCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#667eea",
  },
  tipText: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 18,
  },
  tipsSubtitle: {
    color: "#a0a0a0",
    fontSize: 12,
    marginBottom: 10,
    fontStyle: "italic",
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: 150,
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    color: "#000",
    fontSize: 14,
  },

  // AI Chat Section Styles
  aiChatSection: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  aiChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  aiChatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiChatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiChatTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiChatSubtitle: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#e0e0e0',
    fontSize: 12,
    marginTop: 2,
  },
  chatContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  messagesWrapper: {
    marginBottom: 12,
  },
  messagesContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 15,
    paddingTop: 10,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontStyle: 'italic',
  },
  quickQuestions: {
    marginBottom: 12,
  },
  quickQuestionsTitle: {
    color: '#e0e0e0',
    fontSize: 12,
    marginBottom: 8,
  },
  quickQuestionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickQuestionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickQuestionText: {
    color: 'white',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  sendButtonInactive: {
    backgroundColor: 'transparent',
  },
});

export default DashboardScreen;
