import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ScreenTemplate from "../components/ScreenTemplate";
import { useTestProgress } from "../context/TestProgressContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scheduleStudyReminder, initializeNotifications } from "../utils/notificationService";

interface StudySession {
  id: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  notes?: string;
  type: 'scheduled' | 'suggested';
}

interface WeekDay {
  date: Date;
  dayName: string;
  isToday: boolean;
  sessions: StudySession[];
}

export default function SchedulerScreen() {
  const { completedTests } = useTestProgress();
  
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeekDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [newSession, setNewSession] = useState({
    subject: '',
    time: '',
    duration: 60,
    priority: 'medium' as 'high' | 'medium' | 'low',
    notes: ''
  });

  useEffect(() => {
    initializeScheduler();
    initializeNotifications();
  }, [completedTests]);

  const initializeScheduler = async () => {
    try {
      setLoading(true);
      
      // Load existing sessions
      await loadSessions();
      
      // Analyze weak subjects from test results
      const weakAreas = analyzeWeakSubjects(completedTests);
      setWeakSubjects(weakAreas);
      
      // Generate current week
      generateCurrentWeek();
      
      // Generate AI suggestions for weak subjects
      if (weakAreas.length > 0) {
        await generateAISuggestions(weakAreas);
      }
      
    } catch (error) {
      console.error('Error initializing scheduler:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWeakSubjects = (tests: any[]): string[] => {
    const subjectPerformance: { [key: string]: { total: number, correct: number } } = {};
    
    tests.forEach(test => {
      let subject = 'General';
      
      if (test.testId.includes('Aptitude')) subject = 'Aptitude & Reasoning';
      else if (test.testId.includes('Science')) subject = 'Science & Technology';
      else if (test.testId.includes('Commerce')) subject = 'Business & Economics';
      else if (test.testId.includes('Arts')) subject = 'Humanities & Arts';
      else if (test.testId.includes('Emotional')) subject = 'Emotional Intelligence';
      else if (test.testId.includes('Personality')) subject = 'Personality Development';
      
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, correct: 0 };
      }
      
      subjectPerformance[subject].total += test.totalQuestions;
      subjectPerformance[subject].correct += test.score;
    });

    // Identify subjects with < 70% performance
    return Object.entries(subjectPerformance)
      .filter(([_, data]) => (data.correct / data.total) < 0.7)
      .map(([subject]) => subject);
  };

  const generateCurrentWeek = () => {
    const today = new Date();
    const week: WeekDay[] = [];
    
    // Start from Monday of current week
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      
      week.push({
        date,
        dayName: dayNames[i],
        isToday,
        sessions: sessions.filter(session => 
          new Date(session.date).toDateString() === date.toDateString()
        )
      });
    }
    
    setCurrentWeek(week);
    
    // Select today by default
    const todayIndex = week.findIndex(day => day.isToday);
    if (todayIndex !== -1) {
      setSelectedDay(week[todayIndex]);
    }
  };

  const generateAISuggestions = async (weakAreas: string[]) => {
    const suggestions: StudySession[] = [];
    const today = new Date();
    
    weakAreas.forEach((subject) => {
      // Suggest sessions for the next few days
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + dayOffset);
        
        if (dayOffset <= 3) { // High priority for first 3 days
          suggestions.push({
            id: `suggestion_${subject}_${dayOffset}`,
            subject,
            date: sessionDate.toISOString().split('T')[0],
            time: dayOffset === 1 ? '18:00' : '19:00', // Vary times
            duration: 45,
            priority: 'high',
            completed: false,
            type: 'suggested',
            notes: `AI Recommendation: Focus on ${subject} - identified as weak area`
          });
        }
      }
    });
    
    // Add suggestions to sessions if they don't already exist
    const existingSessionKeys = new Set(
      sessions.map(s => `${s.subject}_${s.date}_${s.time}`)
    );
    
    const newSuggestions = suggestions.filter(s => 
      !existingSessionKeys.has(`${s.subject}_${s.date}_${s.time}`)
    );
    
    if (newSuggestions.length > 0) {
      const updatedSessions = [...sessions, ...newSuggestions];
      setSessions(updatedSessions);
      await saveSessions(updatedSessions);
    }
  };

  const loadSessions = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) return;
      
      const stored = await AsyncStorage.getItem(`scheduler_${userEmail}`);
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const saveSessions = async (sessionsToSave: StudySession[]) => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) return;
      
      await AsyncStorage.setItem(`scheduler_${userEmail}`, JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };

  const addSession = async () => {
    if (!newSession.subject || !newSession.time || !selectedDay) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    const session: StudySession = {
      id: Date.now().toString(),
      subject: newSession.subject,
      date: selectedDay.date.toISOString().split('T')[0],
      time: newSession.time,
      duration: newSession.duration,
      priority: newSession.priority,
      completed: false,
      type: 'scheduled',
      notes: newSession.notes
    };
    
    const updatedSessions = [...sessions, session];
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    
    // Schedule notification reminder (15 minutes before session)
    try {
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      
      await scheduleStudyReminder({
        sessionId: session.id,
        subject: session.subject,
        scheduledTime: sessionDateTime,
        reminderMinutes: 15
      });
    } catch (error) {
      console.error('❌ Error scheduling reminder:', error);
    }
    
    // Refresh current week
    generateCurrentWeek();
    
    // Reset form and close modal
    setNewSession({
      subject: '',
      time: '',
      duration: 60,
      priority: 'medium',
      notes: ''
    });
    setShowAddModal(false);
    
    Alert.alert('Success', 'Study session scheduled successfully! You\'ll receive a reminder 15 minutes before.');
  };

  const toggleSessionComplete = async (sessionId: string) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId 
        ? { ...session, completed: !session.completed }
        : session
    );
    
    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
    generateCurrentWeek();
  };

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this study session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);
            await saveSessions(updatedSessions);
            generateCurrentWeek();
          }
        }
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getSessionTypeIcon = (type: string) => {
    return type === 'suggested' ? '🤖' : '📚';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Consistency is the key to mastery!",
      "Every expert was once a beginner.",
      "Focus on progress, not perfection.",
      "Your future self will thank you!",
      "Small steps lead to big achievements."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  if (loading) {
    return (
      <ScreenTemplate>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing your study needs...</Text>
          </View>
        </LinearGradient>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Study Scheduler</Text>
            <Text style={styles.headerSubtitle}>AI-powered study planning</Text>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.motivationCard}
            >
              <Text style={styles.motivationText}>💡 {getMotivationalQuote()}</Text>
            </LinearGradient>
          </View>

          {/* Weak Subjects Alert */}
          {weakSubjects.length > 0 && (
            <LinearGradient
              colors={['rgba(255, 152, 0, 0.2)', 'rgba(255, 183, 77, 0.2)']}
              style={styles.alertCard}
            >
              <Text style={styles.alertTitle}>🎯 Focus Areas Identified</Text>
              <Text style={styles.alertText}>
                Based on your test performance, we recommend focusing on:
              </Text>
              {weakSubjects.map((subject, index) => (
                <Text key={index} style={styles.alertSubject}>• {subject}</Text>
              ))}
              <Text style={styles.alertFooter}>
                AI suggestions have been added to your schedule
              </Text>
            </LinearGradient>
          )}

          {/* Week View */}
          <View style={styles.weekSection}>
            <Text style={styles.sectionTitle}>📅 This Week</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.weekContainer}>
                {currentWeek.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCard,
                      day.isToday && styles.todayCard,
                      selectedDay?.date.toDateString() === day.date.toDateString() && styles.selectedDayCard
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[
                      styles.dayName,
                      day.isToday && styles.todayText,
                      selectedDay?.date.toDateString() === day.date.toDateString() && styles.selectedDayText
                    ]}>
                      {day.dayName}
                    </Text>
                    <Text style={[
                      styles.dayDate,
                      day.isToday && styles.todayText,
                      selectedDay?.date.toDateString() === day.date.toDateString() && styles.selectedDayText
                    ]}>
                      {day.date.getDate()}
                    </Text>
                    {day.sessions.length > 0 && (
                      <View style={styles.sessionIndicator}>
                        <Text style={styles.sessionCount}>{day.sessions.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Selected Day Sessions */}
          {selectedDay && (
            <View style={styles.sessionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  📖 {selectedDay.dayName}, {selectedDay.date.toLocaleDateString()}
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {selectedDay.sessions.length > 0 ? (
                selectedDay.sessions.map((session) => (
                  <LinearGradient
                    key={session.id}
                    colors={session.completed 
                      ? ['rgba(76, 175, 80, 0.2)', 'rgba(129, 199, 132, 0.2)']
                      : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                    }
                    style={[styles.sessionCard, session.completed && styles.completedSession]}
                  >
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionSubject}>
                          {getSessionTypeIcon(session.type)} {session.subject}
                        </Text>
                        <Text style={styles.sessionTime}>
                          {session.time} • {session.duration} mins
                        </Text>
                      </View>
                      <View style={styles.sessionActions}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(session.priority) }]}>
                          <Text style={styles.priorityText}>{session.priority}</Text>
                        </View>
                      </View>
                    </View>
                    
                    {session.notes && (
                      <Text style={styles.sessionNotes}>{session.notes}</Text>
                    )}
                    
                    <View style={styles.sessionFooter}>
                      <TouchableOpacity
                        style={styles.sessionButton}
                        onPress={() => toggleSessionComplete(session.id)}
                      >
                        <Text style={styles.sessionButtonText}>
                          {session.completed ? '✓ Completed' : 'Mark Complete'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteSession(session.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                ))
              ) : (
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.emptyCard}
                >
                  <Text style={styles.emptyText}>No study sessions scheduled</Text>
                  <Text style={styles.emptySubtext}>Tap "Add" to schedule your first session</Text>
                </LinearGradient>
              )}
            </View>
          )}

          {/* Study Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>💡 Study Tips</Text>
            
            <View style={styles.tipsGrid}>
            {[
            { title: 'Pomodoro Technique', desc: '25 min study + 5 min break', icon: '⏰' },
            { title: 'Active Recall', desc: 'Test yourself regularly', icon: '🧠' },
            { title: 'Spaced Repetition', desc: 'Review at increasing intervals', icon: '📈' },
            { title: 'Environment', desc: 'Study in a quiet, dedicated space', icon: '🏠' }
            ].map((tip, index) => (
            <LinearGradient
            key={index}
            colors={['rgba(103, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
            style={styles.tipCard}
            >
            <Text style={styles.tipIcon}>{tip.icon}</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipDesc}>{tip.desc}</Text>
            </LinearGradient>
            ))}
            </View>

            {/* Test Notification Button */}
            <TouchableOpacity
              style={styles.testNotificationButton}
              onPress={async () => {
                try {
                  const testTime = new Date();
                  testTime.setSeconds(testTime.getSeconds() + 10); // 10 seconds from now
                  
                  await scheduleStudyReminder({
                    sessionId: 'test_notification',
                    subject: 'Test Subject',
                    scheduledTime: testTime,
                    reminderMinutes: 0
                  });
                  
                  Alert.alert('Test Notification', 'A test notification will appear in 10 seconds!');
                } catch (error) {
                  console.error('Error scheduling test notification:', error);
                }
              }}
            >
              <Text style={styles.testNotificationText}>🔔 Test Notification (10s)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Add Session Modal */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#1a1a2e", "#16213e"]}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Schedule Study Session</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Subject"
                placeholderTextColor="#888"
                value={newSession.subject}
                onChangeText={(text) => setNewSession(prev => ({...prev, subject: text}))}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Time (HH:MM)"
                placeholderTextColor="#888"
                value={newSession.time}
                onChangeText={(text) => setNewSession(prev => ({...prev, time: text}))}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Duration (minutes)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={newSession.duration.toString()}
                onChangeText={(text) => setNewSession(prev => ({...prev, duration: parseInt(text) || 60}))}
              />
              
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes (optional)"
                placeholderTextColor="#888"
                multiline
                value={newSession.notes}
                onChangeText={(text) => setNewSession(prev => ({...prev, notes: text}))}
              />
              
              <View style={styles.prioritySection}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                <View style={styles.priorityButtons}>
                  {['high', 'medium', 'low'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        { backgroundColor: getPriorityColor(priority) },
                        newSession.priority === priority && styles.selectedPriority
                      ]}
                      onPress={() => setNewSession(prev => ({...prev, priority: priority as any}))}
                    >
                      <Text style={styles.priorityButtonText}>{priority}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={addSession}
                >
                  <Text style={[styles.modalButtonText, styles.primaryButtonText]}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    padding: 25,
    paddingTop: 15,
  },

  // Header
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  motivationCard: {
    padding: 15,
    borderRadius: 12,
    width: '100%',
  },
  motivationText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Alert Card
  alertCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  alertTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertText: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 10,
  },
  alertSubject: {
    color: 'white',
    fontSize: 15,
    marginBottom: 5,
    fontWeight: '600',
  },
  alertFooter: {
    color: '#e0e0e0',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Section
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  // Week View
  weekSection: {
    marginBottom: 25,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    gap: 10,
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  todayCard: {
    backgroundColor: 'rgba(103, 126, 234, 0.3)',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  selectedDayCard: {
    backgroundColor: 'rgba(118, 75, 162, 0.3)',
    borderWidth: 2,
    borderColor: '#764ba2',
  },
  dayName: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  dayDate: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayText: {
    color: 'white',
  },
  selectedDayText: {
    color: 'white',
  },
  sessionIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Sessions
  sessionsSection: {
    marginBottom: 25,
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  completedSession: {
    opacity: 0.7,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionSubject: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sessionTime: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  sessionActions: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sessionNotes: {
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    flex: 1,
    marginRight: 10,
  },
  sessionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  emptySubtext: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
  },

  // Tips Section
  tipsSection: {
    marginBottom: 25,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  tipCard: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  tipTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  tipDesc: {
    color: '#e0e0e0',
    fontSize: 12,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  prioritySection: {
    marginBottom: 20,
  },
  priorityLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedPriority: {
    borderWidth: 2,
    borderColor: 'white',
  },
  priorityButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  modalButtonText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  bottomPadding: {
    height: 30,
  },

  // Test Notification Button
  testNotificationButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },
  testNotificationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
