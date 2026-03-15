import { API_ENDPOINTS, adminApiRequest, apiRequest } from "../config/api";

export type BoostListingType = "product" | "service" | "agrovet";
export type BoostRequestStatus = "submitted" | "approved" | "rejected" | "refunded";

export interface ListingBoostRequest {
  _id: string;
  ownerId:
    | string
    | {
        _id: string;
        fullName?: string;
        name?: string;
        email?: string;
        phone?: string;
      };
  listingId: string;
  listingType: BoostListingType;
  listingTitle: string;
  listingCounty?: string;
  amount: number;
  tillNumber: string;
  payerPhone: string;
  status: BoostRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  adminNote?: string;
  approvedAt?: string;
  rejectedAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export const BOOST_PRICE_KES = 100;
export const BOOST_TILL_NUMBER = "3319295";

export const submitListingBoostRequest = async (payload: {
  listingId: string;
  listingType: BoostListingType;
  payerPhone: string;
}) =>
  apiRequest(API_ENDPOINTS.boosts.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listMyBoostRequests = async () => {
  const response = await apiRequest(API_ENDPOINTS.boosts.my);
  return response as {
    success: boolean;
    data: ListingBoostRequest[];
  };
};

export const listAdminBoostRequests = async (params?: {
  status?: BoostRequestStatus | "";
  search?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const url = `${API_ENDPOINTS.boosts.admin.list}${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const response = await adminApiRequest(url);
  return response as {
    success: boolean;
    data: ListingBoostRequest[];
    stats: {
      total: number;
      submitted: number;
      approved: number;
    };
  };
};

export const reviewAdminBoostRequest = async (
  boostId: string,
  action: "approve" | "reject" | "refund",
  adminNote?: string
) =>
  adminApiRequest(API_ENDPOINTS.boosts.admin.review(boostId), {
    method: "PUT",
    body: JSON.stringify({ action, adminNote }),
  });
