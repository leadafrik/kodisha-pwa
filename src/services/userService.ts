import { API_ENDPOINTS } from '../config/api';

const token = localStorage.getItem('kodisha_token');

export interface UserProfile {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  profilePicture?: string;
  county?: string;
  constituency?: string;
  ward?: string;
  town?: string;
  userType: string;
  verification: any;
  ratings: any;
}

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(API_ENDPOINTS.users.getProfile(userId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user profile');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (
  file: File
): Promise<{ profilePicture: string }> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('profilePicture', file);

  const response = await fetch(API_ENDPOINTS.users.uploadProfilePicture, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload profile picture');
  }

  const data = await response.json();
  return {
    profilePicture: data.profilePicture,
  };
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (): Promise<void> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.users.deleteProfilePicture, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete profile picture');
  }
};

/**
 * Schedule account deletion
 */
export const scheduleAccountDeletion = async (): Promise<{
  message: string;
  scheduledDeletionAt: string;
}> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.users.deleteAccount, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to schedule account deletion');
  }

  const data = await response.json();
  return data;
};

/**
 * Reactivate account before deletion finalized
 */
export const reactivateAccount = async (): Promise<{
  message: string;
  reactivatedAt: string;
}> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.users.reactivateAccount, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reactivate account');
  }

  const data = await response.json();
  return data;
};

export const userService = {
  getUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  scheduleAccountDeletion,
  reactivateAccount,
};
