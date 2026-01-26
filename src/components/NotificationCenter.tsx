import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';

const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, preferences } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleMarkAsRead = async (notificationId: string, actionUrl?: string) => {
    if (actionUrl) {
      window.location.href = actionUrl;
    }
    await markAsRead(notificationId);
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
                aria-label="Notification settings"
              >
                Settings
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>

          {/* Preferences Panel */}
          {showPreferences && preferences && (
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <h4 className="font-semibold mb-4 text-gray-900">Notification Preferences</h4>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    className="w-4 h-4"
                    readOnly
                  />
                  <span className="text-gray-700">Email Notifications</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    className="w-4 h-4"
                    readOnly
                  />
                  <span className="text-gray-700">Push Notifications</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.monthlyReminders}
                    className="w-4 h-4"
                    readOnly
                  />
                  <span className="text-gray-700">Monthly Reminders</span>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Full preference management available in your profile settings.
                </p>
              </div>
            </div>
          )}

          {/* Notification List */}
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() =>
                    !notification.read && handleMarkAsRead(notification._id, notification.actionUrl)
                  }
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </h5>
                      <p className="text-gray-600 text-xs mt-1">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No notifications yet</p>
            </div>
          )}

          {/* View All Link */}
          {notifications.length > 10 && (
            <div className="border-t border-gray-200 p-4 text-center">
              <a
                href="/profile/notifications"
                className="text-sm font-semibold text-green-600 hover:text-green-700 transition"
              >
                View All Notifications 
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Format timestamp for display
 */
const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
};

export default NotificationCenter;





