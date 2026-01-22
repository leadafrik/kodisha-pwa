import { API_ENDPOINTS } from '../config/api';

const token = localStorage.getItem('kodisha_token');

export interface Message {
  _id: string;
  from: string;
  to: string;
  body: string;
  read: boolean;
  readAt?: string;
  status?: "sent" | "delivered" | "read";
  createdAt: string;
  listing?: string;
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
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.messages.send, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      toUserId,
      body,
      listingId: listingId || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
};

/**
 * Get all message threads (latest message per contact)
 */
export const getMessageThreads = async (): Promise<MessageThread[]> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.messages.threads, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch message threads');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Get full conversation with a specific user
 */
export const getConversation = async (userId: string): Promise<Message[]> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.messages.withUser(userId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch conversation');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Mark all messages from a user as read
 */
export const markMessagesAsRead = async (userId: string): Promise<void> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.messages.markRead(userId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark messages as read');
  }
};

export const messageService = {
  sendMessage,
  getMessageThreads,
  getConversation,
  markMessagesAsRead,
};
