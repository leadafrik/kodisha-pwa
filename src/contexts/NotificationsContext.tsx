import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  Notification,
  NotificationPreferences,
  getNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  markNotificationAsRead,
  initializeMonthlyReminderScheduler,
  requestNotificationPermission,
  subscribeToPushNotifications,
} from '../services/notificationService';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupReminder, setCleanupReminder] = useState<(() => void) | null>(null);

  // Fetch notifications on user login
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch preferences on user login
  useEffect(() => {
    if (!user?.id) return;

    const fetchPreferences = async () => {
      try {
        const prefs = await getNotificationPreferences(user.id);
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    };

    fetchPreferences();
    fetchNotifications();

    // Initialize monthly reminder scheduler
    const cleanup = initializeMonthlyReminderScheduler(user.id);
    setCleanupReminder(() => cleanup);

    return () => {
      cleanup();
    };
  }, [user?.id, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        await markNotificationAsRead(user.id, notificationId);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [user?.id]
  );

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      if (!user?.id) return;

      try {
        const updated = await updateNotificationPreferences(user.id, newPreferences);
        setPreferences(updated);
      } catch (error) {
        console.error('Failed to update preferences:', error);
        throw error;
      }
    },
    [user?.id]
  );

  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted && user?.id && 'serviceWorker' in navigator && 'PushManager' in window) {
        // Try to subscribe to push notifications
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
          });
          await subscribeToPushNotifications(user.id, subscription);
        } catch (error) {
          console.warn('Could not subscribe to push notifications:', error);
        }
      }
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        loading,
        fetchNotifications,
        markAsRead,
        updatePreferences,
        requestPermission,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};
