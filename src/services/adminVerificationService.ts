import { API_ENDPOINTS } from '../config/api';

const token = localStorage.getItem('kodisha_token');
const adminToken = localStorage.getItem('kodisha_admin_token') || token;

export interface PendingProfile {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  county?: string;
  constituency?: string;
  profileVerificationStatus: 'pending_verification' | 'verified' | 'rejected';
  profileVerifiedAt?: string;
  verification: any;
  fraud: any;
}

export interface SellerDocuments {
  seller: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
  };
  idDocuments: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
    verifiedAt?: string;
  };
  otherDocuments: Array<{
    type: string;
    url: string;
    verified: boolean;
    uploadedAt: string;
    description?: string;
  }>;
  verificationDetails: {
    status: string;
    idVerified: boolean;
    selfieVerified: boolean;
    lastReviewedAt?: string;
    notes?: string;
  };
}

/**
 * Get all profiles pending verification (admin only)
 */
export const getPendingProfiles = async (
  page = 1,
  limit = 20
): Promise<{ profiles: PendingProfile[]; total: number; pages: number }> => {
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }

  let url = API_ENDPOINTS.admin.profiles.getPending;
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (params.toString()) {
    url += '?' + params.toString();
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch pending profiles');
  }

  const data = await response.json();
  return {
    profiles: data.data || [],
    total: data.pagination?.total || 0,
    pages: data.pagination?.pages || 0,
  };
};

/**
 * Verify a user's profile (admin only)
 */
export const verifyProfile = async (userId: string): Promise<void> => {
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }

  const response = await fetch(API_ENDPOINTS.admin.profiles.verify(userId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify profile');
  }
};

/**
 * Reject a user's profile (admin only)
 */
export const rejectProfile = async (
  userId: string,
  reason?: string
): Promise<void> => {
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }

  const response = await fetch(API_ENDPOINTS.admin.profiles.reject(userId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      reason,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reject profile');
  }
};

/**
 * Get seller's documents (admin only)
 */
export const getSellerDocuments = async (
  sellerId: string
): Promise<SellerDocuments> => {
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }

  const response = await fetch(
    API_ENDPOINTS.admin.sellers.getDocuments(sellerId),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch seller documents');
  }

  const data = await response.json();
  return data.data;
};

export const adminVerificationService = {
  getPendingProfiles,
  verifyProfile,
  rejectProfile,
  getSellerDocuments,
};
