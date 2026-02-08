import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
import { messageService, MessageThread } from '../services/messageService';

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

const API_NOTIFICATIONS_POLL_INTERVAL_MS = 30000;
const MESSAGE_THREADS_POLL_INTERVAL_MS = 10000;
const SYNTHETIC_MESSAGE_PREFIX = 'synthetic-message:';

const valueAsString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const asDate = (value: unknown): Date => {
  const parsed =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' || typeof value === 'number' ? value : Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const toEpoch = (value: Date | string | undefined): number => {
  const date = value instanceof Date ? value : new Date(value || 0);
  const epoch = date.getTime();
  return Number.isNaN(epoch) ? 0 : epoch;
};

const resolveCounterpartId = (thread: MessageThread, currentUserId: string): string => {
  if (thread.counterpart) return thread.counterpart;
  if (thread.from === currentUserId) return thread.to;
  if (thread.to === currentUserId) return thread.from;
  return thread.to || thread.from;
};

const getLastSeenThreadsStorageKey = (userId: string) =>
  `kodisha_last_seen_message_threads_${userId}`;

const loadLastSeenThreads = (userId: string): Record<string, string> => {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = window.localStorage.getItem(getLastSeenThreadsStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const saveLastSeenThreads = (userId: string, map: Record<string, string>) => {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(getLastSeenThreadsStorageKey(userId), JSON.stringify(map));
  } catch {
    // Non-critical: ignore localStorage write failures.
  }
};

const normalizeNotifications = (items: Notification[]): Notification[] => {
  return (Array.isArray(items) ? items : [])
    .map((raw: any) => {
      const id = valueAsString(raw?.id) || valueAsString(raw?._id);
      return {
        ...raw,
        id,
        createdAt: asDate(raw?.createdAt),
      } as Notification;
    })
    .filter((item) => !!item.id);
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [apiNotifications, setApiNotifications] = useState<Notification[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUserId = valueAsString(user?.id || user?._id);
  const lastSeenThreadsRef = useRef<Record<string, string>>({});
  const threadsBaselineReadyRef = useRef(false);

  // Fetch notifications on user login
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const data = await getNotifications(currentUserId);
      setApiNotifications(normalizeNotifications(data));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Fetch preferences on user login
  useEffect(() => {
    if (!currentUserId) {
      setApiNotifications([]);
      setMessageNotifications([]);
      setPreferences(null);
      lastSeenThreadsRef.current = {};
      threadsBaselineReadyRef.current = false;
      return;
    }

    const fetchPreferences = async () => {
      try {
        const prefs = await getNotificationPreferences(currentUserId);
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    };

    fetchPreferences();
    fetchNotifications();

    // Initialize monthly reminder scheduler
    const cleanup = initializeMonthlyReminderScheduler(currentUserId);

    return () => {
      cleanup();
    };
  }, [currentUserId, fetchNotifications]);

  // Poll backend notifications so new server-side events appear without refresh.
  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, API_NOTIFICATIONS_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentUserId, fetchNotifications]);

  // Build fallback in-app message notifications from message threads.
  useEffect(() => {
    if (!currentUserId) return;

    lastSeenThreadsRef.current = loadLastSeenThreads(currentUserId);
    threadsBaselineReadyRef.current = Object.keys(lastSeenThreadsRef.current).length > 0;

    let cancelled = false;

    const pollThreads = async () => {
      try {
        const threads = await messageService.getMessageThreads();
        if (cancelled) return;

        const nextSeen = { ...lastSeenThreadsRef.current };
        const pendingNotifications: Notification[] = [];
        let hasSeenChanges = false;

        threads.forEach((thread) => {
          const threadAny = thread as any;
          const counterpartId = resolveCounterpartId(thread, currentUserId);
          const createdAt = valueAsString(thread.createdAt);
          if (!counterpartId || !createdAt) return;

          const previous = nextSeen[counterpartId];
          const unreadHint =
            Number(threadAny?.unreadCount || 0) > 0 ||
            threadAny?.read === false ||
            threadAny?.isUnread === true;
          const isIncoming = thread.from && thread.from !== currentUserId;

          // On first poll with no prior snapshot, establish baseline only.
          if (!threadsBaselineReadyRef.current) {
            nextSeen[counterpartId] = createdAt;
            hasSeenChanges = true;
            if (isIncoming && unreadHint) {
              const bootstrapId = `${SYNTHETIC_MESSAGE_PREFIX}${counterpartId}:${createdAt}`;
              pendingNotifications.push({
                id: bootstrapId,
                userId: currentUserId,
                type: 'message',
                title: 'Unread message',
                message: valueAsString(thread.body) || 'You have unread messages.',
                channel: 'in-app',
                read: false,
                createdAt: asDate(createdAt),
                actionUrl: '/messages',
              });
            }
            return;
          }

          const isNewer = toEpoch(createdAt) > toEpoch(previous);
          if (!isNewer) return;

          nextSeen[counterpartId] = createdAt;
          hasSeenChanges = true;

          if (!isIncoming) return;

          const syntheticId = `${SYNTHETIC_MESSAGE_PREFIX}${counterpartId}:${createdAt}`;
          pendingNotifications.push({
            id: syntheticId,
            userId: currentUserId,
            type: 'message',
            title: 'New message',
            message: valueAsString(thread.body) || 'You have a new message.',
            channel: 'in-app',
            read: false,
            createdAt: asDate(createdAt),
            actionUrl: '/messages',
          });
        });

        if (!threadsBaselineReadyRef.current) {
          threadsBaselineReadyRef.current = true;
        }

        if (hasSeenChanges) {
          lastSeenThreadsRef.current = nextSeen;
          saveLastSeenThreads(currentUserId, nextSeen);
        }

        if (pendingNotifications.length > 0) {
          setMessageNotifications((prev) => {
            const existing = new Set(prev.map((item) => item.id));
            const uniqueIncoming = pendingNotifications.filter((item) => !existing.has(item.id));
            if (uniqueIncoming.length === 0) return prev;
            return [...uniqueIncoming, ...prev];
          });
        }
      } catch (error) {
        // Fallback signal only; don't block the app if this fails.
        console.warn('Failed to poll message threads for notifications:', error);
      }
    };

    pollThreads();
    const intervalId = window.setInterval(pollThreads, MESSAGE_THREADS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentUserId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (notificationId.startsWith(SYNTHETIC_MESSAGE_PREFIX)) {
        setMessageNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        return;
      }

      if (!currentUserId) return;

      try {
        await markNotificationAsRead(currentUserId, notificationId);
        setApiNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    [currentUserId]
  );

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      if (!currentUserId) return;

      try {
        const updated = await updateNotificationPreferences(currentUserId, newPreferences);
        setPreferences(updated);
      } catch (error) {
        console.error('Failed to update preferences:', error);
        throw error;
      }
    },
    [currentUserId]
  );

  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted && currentUserId && 'serviceWorker' in navigator && 'PushManager' in window) {
        // Try to subscribe to push notifications
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
          });
          await subscribeToPushNotifications(currentUserId, subscription);
        } catch (error) {
          console.warn('Could not subscribe to push notifications:', error);
        }
      }
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [currentUserId]);

  const notifications = useMemo(() => {
    const map = new Map<string, Notification>();
    [...messageNotifications, ...apiNotifications].forEach((item) => {
      if (!item.id || map.has(item.id)) return;
      map.set(item.id, {
        ...item,
        createdAt: asDate(item.createdAt),
      });
    });
    return Array.from(map.values()).sort(
      (a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt)
    );
  }, [apiNotifications, messageNotifications]);

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
