import { API_ENDPOINTS } from '../config/api';

const token = localStorage.getItem('kodisha_token');

export interface Report {
  _id: string;
  reportedUser: string;
  reportedBy: string;
  reason: string;
  description?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  severity?: 'low' | 'medium' | 'high';
  listingId?: string;
  listingType?: string;
  createdAt: string;
}

/**
 * Submit a report on a user
 */
export const submitReport = async (
  sellerId: string,
  reason: string,
  description?: string,
  listingId?: string,
  listingType?: string,
  severity?: 'low' | 'medium' | 'high'
): Promise<Report> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.reports.submit(sellerId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reason,
      description,
      listingId,
      listingType,
      severity,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit report');
  }

  const data = await response.json();
  return data.data || data;
};

/**
 * Get all reports (admin only)
 */
export const getReports = async (
  status?: string,
  severity?: string,
  page = 1,
  limit = 20
): Promise<{ reports: Report[]; total: number; pages: number }> => {
  const adminToken = localStorage.getItem('kodisha_admin_token') || token;
  if (!adminToken) {
    throw new Error('Authentication required');
  }

  let url = API_ENDPOINTS.admin.reports.getAll;
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (severity) params.append('severity', severity);
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
    throw new Error(error.message || 'Failed to fetch reports');
  }

  const data = await response.json();
  return {
    reports: data.data || [],
    total: data.pagination?.total || 0,
    pages: data.pagination?.pages || 0,
  };
};

/**
 * Get reports on a specific user (admin only)
 */
export const getUserReports = async (
  userId: string,
  status?: string,
  page = 1,
  limit = 20
): Promise<{ reports: Report[]; total: number; pages: number }> => {
  const adminToken = localStorage.getItem('kodisha_admin_token') || token;
  if (!adminToken) {
    throw new Error('Authentication required');
  }

  let url = API_ENDPOINTS.admin.reports.getByUser(userId);
  const params = new URLSearchParams();
  if (status) params.append('status', status);
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
    throw new Error(error.message || 'Failed to fetch user reports');
  }

  const data = await response.json();
  return {
    reports: data.data || [],
    total: data.pagination?.total || 0,
    pages: data.pagination?.pages || 0,
  };
};

/**
 * Update report status (admin only)
 */
export const updateReportStatus = async (
  reportId: string,
  status: 'reviewing' | 'resolved' | 'dismissed',
  resolution?: string
): Promise<Report> => {
  const adminToken = localStorage.getItem('kodisha_admin_token') || token;
  if (!adminToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    API_ENDPOINTS.admin.reports.updateStatus(reportId),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status,
        resolution,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update report');
  }

  const data = await response.json();
  return data.data || data;
};

export const reportService = {
  submitReport,
  getReports,
  getUserReports,
  updateReportStatus,
};
