import { API_ENDPOINTS, apiRequest, ensureValidAccessToken } from '../config/api';

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
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('profilePicture', file);

  const data = await apiRequest(API_ENDPOINTS.users.uploadProfilePicture, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return {
    profilePicture: data.profilePicture,
  };
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (): Promise<void> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  await apiRequest(API_ENDPOINTS.users.deleteProfilePicture, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Schedule account deletion
 */
export const scheduleAccountDeletion = async (): Promise<{
  message: string;
  scheduledDeletionAt: string;
}> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  return apiRequest(API_ENDPOINTS.users.deleteAccount, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Reactivate account before deletion finalized
 */
export const reactivateAccount = async (): Promise<{
  message: string;
  reactivatedAt: string;
}> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  return apiRequest(API_ENDPOINTS.users.reactivateAccount, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const userService = {
  getUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  scheduleAccountDeletion,
  reactivateAccount,
};
