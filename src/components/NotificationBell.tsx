import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Bell, X, ExternalLink } from 'lucide-react';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

const NotificationBell: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  // Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const response = await axios.get('/api/notifications/unread/count');
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // Fetch notifications
  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get('/api/notifications?limit=10&unread=true');
      return response.data.data;
    },
    enabled: open,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.patch(`/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => refetch(),
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = countData?.unreadCount || 0;

  const priorityColors = {
    urgent: 'bg-red-50 border-l-4 border-red-500',
    high: 'bg-orange-50 border-l-4 border-orange-500',
    normal: 'bg-blue-50 border-l-4 border-blue-500',
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif: Notification) => (
                  <div
                    key={notif._id}
                    className={`p-4 ${priorityColors[notif.priority]} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => {
                      if (notif.actionUrl) {
                        window.location.href = notif.actionUrl;
                      }
                      markReadMutation.mutate(notif._id);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {notif.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {notif.actionUrl && (
                        <ExternalLink size={16} className="text-gray-400 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t text-center">
              <a
                href="/notifications"
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
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

export default NotificationBell;
