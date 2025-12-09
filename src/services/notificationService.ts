/**
 * Notification Service
 * Handles in-app notifications, email notifications, and push notifications
 * Includes support for monthly reminder notifications
 */

import { apiRequest } from '../config/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'listing_alert' | 'buy_request_alert' | 'message' | 'rating' | 'monthly_reminder' | 'system';
  title: string;
  message: string;
  channel: 'in-app' | 'email' | 'push' | 'all';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  monthlyReminders: boolean;
  monthlyReminderDay: number; // 1-31, day of month to send reminder
  categories: {
    newListings: boolean;
    newBuyRequests: boolean;
    messages: boolean;
    ratings: boolean;
  };
}

/**
 * Get user's notification preferences
 */
export const getNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences> => {
  try {
    const response = await apiRequest(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/${userId}/notification-preferences`
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch notification preferences:', error);
    // Return default preferences
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      monthlyReminders: true,
      monthlyReminderDay: 1,
      categories: {
        newListings: true,
        newBuyRequests: true,
        messages: true,
        ratings: true,
      },
    };
  }
};

/**
 * Update user's notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  try {
    const token = localStorage.getItem('kodisha_token') || localStorage.getItem('token');
    const response = await apiRequest(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/${userId}/notification-preferences`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    throw error;
  }
};

/**
 * Get user's notifications
 */
export const getNotifications = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Notification[]> => {
  try {
    const token = localStorage.getItem('kodisha_token') || localStorage.getItem('token');
    const response = await apiRequest(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/${userId}/notifications?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const token = localStorage.getItem('kodisha_token') || localStorage.getItem('token');
    await apiRequest(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/${userId}/notifications/${notificationId}/read`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Trigger a monthly reminder notification
 * Called by backend cron job or manually for testing
 */
export const triggerMonthlyReminder = async (userId: string): Promise<void> => {
  try {
    const token = localStorage.getItem('kodisha_token') || localStorage.getItem('token');
    await apiRequest(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/${userId}/notifications/monthly-reminder`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ triggered: new Date() }),
      }
    );
  } catch (error) {
    console.error('Failed to trigger monthly reminder:', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (
  userId: string,
  subscription: PushSubscription
): Promise<void> => {
  try {
    const token = localStorage.getItem('kodisha_token') || localStorage.getItem('token');
    await apiRequest(
      `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/${userId}/push-subscription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      }
    );
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Request notification permission from browser
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a local notification (in-app or browser notification)
 */
export const showNotification = (
  title: string,
  options?: NotificationOptions
): void => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.svg',
      badge: '/logo.svg',
      ...options,
    });
  }
};

/**
 * Initialize monthly reminder scheduler
 * This runs in the browser to check if it's time for a monthly reminder
 */
export const initializeMonthlyReminderScheduler = (userId: string): (() => void) => {
  // Check once per day if it's time for the monthly reminder
  const checkInterval = setInterval(async () => {
    try {
      const prefs = await getNotificationPreferences(userId);
      
      if (!prefs.monthlyReminders) {
        return; // User has disabled monthly reminders
      }

      const today = new Date();
      const lastReminderDate = localStorage.getItem(`lastMonthlyReminder_${userId}`);
      const lastReminderDateObj = lastReminderDate ? new Date(lastReminderDate) : null;

      // Check if we should send the reminder today
      if (today.getDate() === prefs.monthlyReminderDay) {
        // Check if we already sent a reminder this month
        if (
          !lastReminderDateObj ||
          lastReminderDateObj.getMonth() !== today.getMonth() ||
          lastReminderDateObj.getFullYear() !== today.getFullYear()
        ) {
          // Time to send the reminder
          await triggerMonthlyReminder(userId);
          localStorage.setItem(`lastMonthlyReminder_${userId}`, today.toISOString());

          // Show in-app notification
          showNotification('Agrisoko Reminder', {
            body: 'Check out new listings and opportunities in your area! Browse the marketplace to find fresh products and services.',
            tag: 'monthly-reminder',
          });
        }
      }
    } catch (error) {
      console.error('Error checking for monthly reminder:', error);
    }
  }, 1000 * 60 * 60); // Check every hour

  // Return cleanup function
  return () => clearInterval(checkInterval);
};
