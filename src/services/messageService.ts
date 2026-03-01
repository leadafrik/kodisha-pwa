import { API_ENDPOINTS, apiRequest, ensureValidAccessToken } from '../config/api';

export interface Message {
  _id: string;
  from: string;
  to: string;
  body: string;
  read: boolean;
  readAt?: string;
  status?: "sent" | "delivered" | "read";
  createdAt: string;
  listing?: string | { _id?: string; id?: string };
}

export interface MessageThread {
  _id: string;
  from: string;
  to: string;
  body: string;
  createdAt: string;
  counterpart?: string;
}

/**
 * Send a message to another user
 */
export const sendMessage = async (
  toUserId: string,
  body: string,
  listingId?: string
): Promise<Message> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  return apiRequest(API_ENDPOINTS.messages.send, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      toUserId,
      body,
      listingId: listingId || undefined,
    }),
  });
};

/**
 * Get all message threads (latest message per contact)
 */
export const getMessageThreads = async (): Promise<MessageThread[]> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const data = await apiRequest(API_ENDPOINTS.messages.threads, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data || [];
};

/**
 * Get full conversation with a specific user
 */
export const getConversation = async (userId: string): Promise<Message[]> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const data = await apiRequest(API_ENDPOINTS.messages.withUser(userId), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data || [];
};

/**
 * Mark all messages from a user as read
 */
export const markMessagesAsRead = async (userId: string): Promise<void> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  await apiRequest(API_ENDPOINTS.messages.markRead(userId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const messageService = {
  sendMessage,
  getMessageThreads,
  getConversation,
  markMessagesAsRead,
};
