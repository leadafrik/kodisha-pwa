import { API_ENDPOINTS, adminApiRequest, apiRequest } from "../config/api";

export type BulkRole = "buyer" | "seller";
export type BulkApplicationStatus = "pending" | "approved" | "rejected" | "not_applied";

export interface BulkApplicationInput {
  role: BulkRole;
  contactName: string;
  organizationName: string;
  institutionType:
    | "farm"
    | "cooperative"
    | "restaurant"
    | "hotel"
    | "hospital"
    | "school"
    | "processor"
    | "distributor"
    | "retailer"
    | "ngo"
    | "government"
    | "other";
  address: {
    county: string;
    constituency?: string;
    ward?: string;
    streetAddress?: string;
  };
  phone: string;
  email: string;
  products: string[];
  yearsInAgriculture?: number;
  deliveryCoverage: "countrywide" | "within_county" | "negotiable";
  procurementFrequency?: "daily" | "weekly" | "biweekly" | "monthly" | "as_needed";
  monthlyVolume?: string;
  estimatedBudgetPerOrder?: string;
  notes?: string;
}

export interface BulkAccessStatusResponse {
  buyerStatus: BulkApplicationStatus;
  sellerStatus: BulkApplicationStatus;
  hasActiveMarketplaceListings: boolean;
  canOfferToOpenDemand: boolean;
  canAccessB2BPortal: boolean;
  canPostB2BDemand: boolean;
  canRespondToB2BDemand: boolean;
  isAdmin: boolean;
  reviewNotes?: {
    buyer?: string;
    seller?: string;
  };
  applications?: Array<{
    _id: string;
    role: BulkRole;
    status: BulkApplicationStatus;
    organizationName: string;
    institutionType: string;
    updatedAt: string;
    reviewNotes?: string;
    deliveryCoverage?: string;
    products?: string[];
  }>;
}

export const submitBulkApplication = async (payload: BulkApplicationInput) => {
  return apiRequest(API_ENDPOINTS.bulkApplications.apply, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getMyBulkAccessStatus = async (): Promise<BulkAccessStatusResponse> => {
  const response = await apiRequest(API_ENDPOINTS.bulkApplications.myStatus);
  return response?.data || response;
};

export const listAdminBulkApplications = async (params: {
  status?: "pending" | "approved" | "rejected" | "";
  role?: "buyer" | "seller" | "";
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const url = `${API_ENDPOINTS.bulkApplications.admin.list}${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  return adminApiRequest(url);
};

export const approveAdminBulkApplication = async (
  applicationId: string,
  notes?: string
) => {
  return adminApiRequest(API_ENDPOINTS.bulkApplications.admin.approve(applicationId), {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
};

export const rejectAdminBulkApplication = async (
  applicationId: string,
  notes?: string
) => {
  return adminApiRequest(API_ENDPOINTS.bulkApplications.admin.reject(applicationId), {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
};
