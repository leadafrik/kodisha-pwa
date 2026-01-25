import { API_ENDPOINTS, adminApiRequest, apiRequest } from '../config/api';

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

const getUserToken = () =>
  localStorage.getItem('kodisha_token') ||
  localStorage.getItem('kodisha_admin_token') ||
  localStorage.getItem('token');

const getAdminToken = () =>
  localStorage.getItem('kodisha_admin_token') ||
  localStorage.getItem('kodisha_token') ||
  localStorage.getItem('token');

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
  if (!getUserToken()) {
    throw new Error('Authentication required');
  }

  const data = await apiRequest(API_ENDPOINTS.reports.submit(sellerId), {
    method: 'POST',
    body: JSON.stringify({
      reason,
      description,
      listingId,
      listingType,
      severity,
    }),
  });

  const reportId = data?.data?.reportId || data?.reportId || data?._id;
  if (reportId) {
    return { _id: reportId } as Report;
  }
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
  if (!getAdminToken()) {
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

  const data = await adminApiRequest(url);
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
  if (!getAdminToken()) {
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

  const data = await adminApiRequest(url);
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
  if (!getAdminToken()) {
    throw new Error('Authentication required');
  }

  const data = await adminApiRequest(API_ENDPOINTS.admin.reports.updateStatus(reportId), {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      resolution,
    }),
  });
  return data.data || data;
};

export const reportService = {
  submitReport,
  getReports,
  getUserReports,
  updateReportStatus,
};
