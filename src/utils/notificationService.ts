// Notification service for study reminders and alerts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'study_reminder' | 'performance_alert' | 'goal_completion' | 'parent_notification';
  scheduledTime: string;
  isRead: boolean;
  isActive: boolean;
  data?: any;
  createdAt: string;
}

export interface NotificationSchedule {
  sessionId: string;
  subject: string;
  scheduledTime: Date;
  reminderMinutes: number;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize() {
    try {
      await this.loadNotifications();
      await this.scheduleActiveReminders();
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  // Load notifications from storage
  private async loadNotifications() {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) return;

      const stored = await AsyncStorage.getItem(`notifications_${userEmail}`);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Save notifications to storage
  private async saveNotifications() {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) return;

      await AsyncStorage.setItem(`notifications_${userEmail}`, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Schedule study reminder
  async scheduleStudyReminder(schedule: NotificationSchedule): Promise<string> {
    const notificationId = `reminder_${schedule.sessionId}_${Date.now()}`;
    const reminderTime = new Date(schedule.scheduledTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - schedule.reminderMinutes);

    const notification: Notification = {
      id: notificationId,
      title: '📚 Study Reminder',
      message: `Time to study ${schedule.subject}! Your session starts in ${schedule.reminderMinutes} minutes.`,
      type: 'study_reminder',
      scheduledTime: reminderTime.toISOString(),
      isRead: false,
      isActive: true,
      data: {
        sessionId: schedule.sessionId,
        subject: schedule.subject,
        reminderMinutes: schedule.reminderMinutes
      },
      createdAt: new Date().toISOString()
    };

    this.notifications.push(notification);
    await this.saveNotifications();

    // Schedule the actual reminder
    this.scheduleNotification(notification);

    return notificationId;
  }

  // Schedule performance alert
  async schedulePerformanceAlert(subject: string, percentage: number, type: 'improvement' | 'decline'): Promise<string> {
    const notificationId = `performance_${Date.now()}`;

    const message = type === 'improvement' 
      ? `Great job! Your ${subject} performance improved to ${percentage}%! 🎉`
      : `Your ${subject} performance needs attention (${percentage}%). Consider scheduling extra study time.`;

    const notification: Notification = {
      id: notificationId,
      title: type === 'improvement' ? '🎉 Performance Improvement!' : '⚠️ Performance Alert',
      message,
      type: 'performance_alert',
      scheduledTime: new Date().toISOString(),
      isRead: false,
      isActive: true,
      data: {
        subject,
        percentage,
        type
      },
      createdAt: new Date().toISOString()
    };

    this.notifications.push(notification);
    await this.saveNotifications();

    // Show immediately
    this.showNotification(notification);

    return notificationId;
  }

  // Schedule goal completion notification
  async scheduleGoalCompletion(title: string, description: string): Promise<string> {
    const notificationId = `goal_${Date.now()}`;

    const notification: Notification = {
      id: notificationId,
      title: '🎯 Goal Achieved!',
      message: `Congratulations! You've completed: ${title}`,
      type: 'goal_completion',
      scheduledTime: new Date().toISOString(),
      isRead: false,
      isActive: true,
      data: {
        title,
        description
      },
      createdAt: new Date().toISOString()
    };

    this.notifications.push(notification);
    await this.saveNotifications();

    // Show immediately
    this.showNotification(notification);

    return notificationId;
  }

  // Schedule parent notification
  async scheduleParentNotification(studentName: string, message: string, data?: any): Promise<string> {
    const notificationId = `parent_${Date.now()}`;

    const notification: Notification = {
      id: notificationId,
      title: `📊 ${studentName}'s Progress Update`,
      message,
      type: 'parent_notification',
      scheduledTime: new Date().toISOString(),
      isRead: false,
      isActive: true,
      data: data || {},
      createdAt: new Date().toISOString()
    };

    this.notifications.push(notification);
    await this.saveNotifications();

    return notificationId;
  }

  // Schedule notification for later
  private scheduleNotification(notification: Notification) {
    const scheduledTime = new Date(notification.scheduledTime);
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    console.log(`⏰ Scheduling notification:`);
    console.log(`   📅 Scheduled for: ${scheduledTime.toLocaleString()}`);
    console.log(`   🕐 Current time: ${now.toLocaleString()}`);
    console.log(`   ⏱️ Delay: ${Math.round(delay / 1000 / 60)} minutes`);

    if (delay > 0) {
      const timer = setTimeout(() => {
        console.log(`🔔 Triggering scheduled notification: ${notification.title}`);
        this.showNotification(notification);
        this.timers.delete(notification.id);
      }, delay);

      this.timers.set(notification.id, timer);
      console.log(`✅ Notification scheduled successfully for ${scheduledTime.toLocaleString()}`);
    } else {
      // Past time, show immediately if still relevant (within 1 hour)
      if (now.getTime() - scheduledTime.getTime() < 60 * 60 * 1000) { // Within 1 hour
        console.log(`⚡ Showing past notification immediately (within 1 hour)`);
        this.showNotification(notification);
      } else {
        console.log(`❌ Notification too old, skipping: ${scheduledTime.toLocaleString()}`);
      }
    }
  }

  // Show notification
  private showNotification(notification: Notification) {
    console.log(`📱 Study Reminder: ${notification.title}`);
    console.log(`📝 Message: ${notification.message}`);
    
    // For study reminders, show alert notification
    if (notification.type === 'study_reminder') {
      Alert.alert(
        notification.title,
        notification.message,
        [
          {
            text: 'Dismiss',
            onPress: () => this.markAsRead(notification.id)
          },
          {
            text: 'Got it!',
            onPress: () => {
              this.markAsRead(notification.id);
              this.handleNotificationAction(notification);
            }
          }
        ]
      );
    } else {
      // For other types, just log (no popup)
      console.log(`📊 Notification: ${notification.title} - ${notification.message}`);
      this.markAsRead(notification.id);
    }
  }

  // Handle notification action
  private handleNotificationAction(notification: Notification) {
    // This can be enhanced to navigate to specific screens
    console.log(`Handling notification action for: ${notification.type}`, notification.data);
    
    switch (notification.type) {
      case 'study_reminder':
        // Could navigate to study session or exam screen
        break;
      case 'performance_alert':
        // Could navigate to performance screen
        break;
      case 'goal_completion':
        // Could navigate to achievements or roadmap screen
        break;
      case 'parent_notification':
        // Could navigate to parent view screen
        break;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    await this.saveNotifications();
  }

  // Cancel notification
  async cancelNotification(notificationId: string) {
    // Cancel timer if exists
    const timer = this.timers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(notificationId);
    }

    // Mark as inactive
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isActive: false }
        : notification
    );
    await this.saveNotifications();
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead && n.isActive);
  }

  // Get all notifications
  getAllNotifications(): Notification[] {
    return this.notifications.filter(n => n.isActive).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Schedule active reminders on app start
  private async scheduleActiveReminders() {
    const now = new Date();
    
    this.notifications
      .filter(n => n.isActive && !n.isRead && n.type === 'study_reminder')
      .forEach(notification => {
        const scheduledTime = new Date(notification.scheduledTime);
        if (scheduledTime > now) {
          this.scheduleNotification(notification);
        }
      });
  }

  // Clean up old notifications (older than 30 days)
  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.notifications = this.notifications.filter(notification => 
      new Date(notification.createdAt) > thirtyDaysAgo
    );

    await this.saveNotifications();
  }

  // Send daily study reminder
  async sendDailyStudyReminder() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 6 PM tomorrow

    await this.scheduleStudyReminder({
      sessionId: 'daily_reminder',
      subject: 'Daily Study Session',
      scheduledTime: tomorrow,
      reminderMinutes: 0
    });
  }

  // Get notification statistics
  getNotificationStats() {
    const total = this.notifications.filter(n => n.isActive).length;
    const unread = this.getUnreadNotifications().length;
    const byType = this.notifications.reduce((acc, notification) => {
      if (notification.isActive) {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      byType
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export utility functions
export const scheduleStudyReminder = (schedule: NotificationSchedule) => 
  notificationService.scheduleStudyReminder(schedule);

export const schedulePerformanceAlert = (subject: string, percentage: number, type: 'improvement' | 'decline') =>
  notificationService.schedulePerformanceAlert(subject, percentage, type);

export const scheduleGoalCompletion = (title: string, description: string) =>
  notificationService.scheduleGoalCompletion(title, description);

export const scheduleParentNotification = (studentName: string, message: string, data?: any) =>
  notificationService.scheduleParentNotification(studentName, message, data);

export const initializeNotifications = () => notificationService.initialize();

export const getUnreadNotifications = () => notificationService.getUnreadNotifications();

export const getAllNotifications = () => notificationService.getAllNotifications();

export const markNotificationAsRead = (id: string) => notificationService.markAsRead(id);

export const cancelNotification = (id: string) => notificationService.cancelNotification(id);
