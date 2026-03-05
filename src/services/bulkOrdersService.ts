import { API_ENDPOINTS, adminApiRequest, apiRequest } from "../config/api";

export type BulkOrderCategory = "produce" | "livestock" | "inputs" | "service";
export type BulkOrderStatus = "open" | "awarded" | "closed" | "cancelled";
export type BulkBidStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type BulkInvoiceStatus = "issued" | "paid" | "cancelled";
export type BulkCompletionStatus =
  | "pending"
  | "buyer_marked"
  | "seller_marked"
  | "completed"
  | "presumed_complete";

export interface BulkOrderInput {
  title: string;
  itemName: string;
  category: BulkOrderCategory;
  description?: string;
  quantity: number;
  unit: string;
  budget: {
    min?: number;
    max?: number;
    currency?: "KES";
  };
  deliveryScope: "countrywide" | "within_county" | "negotiable";
  deliveryLocation: {
    county: string;
    constituency?: string;
    ward?: string;
    addressLine?: string;
  };
  deliveryDeadline?: string;
  contactPhone?: string;
}

export interface BulkOrderBidInput {
  quoteAmount: number;
  deliveryDate: string;
  note?: string;
}

export interface BulkOrderBid {
  _id: string;
  orderId: string;
  sellerId: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    county?: string;
  };
  quoteAmount: number;
  currency: "KES";
  deliveryDate: string;
  note?: string;
  status: BulkBidStatus;
  buyerDecisionReason?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkOrderInvoice {
  _id: string;
  orderId: string;
  bidId: string;
  buyerId: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    county?: string;
  };
  sellerId: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    county?: string;
  };
  invoiceNumber: string;
  currency: "KES";
  quoteAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  totalBuyerAmount: number;
  status: BulkInvoiceStatus;
  issuedAt: string;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkOrder {
  _id: string;
  buyerId: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    county?: string;
  };
  title: string;
  itemName: string;
  category: BulkOrderCategory;
  description?: string;
  quantity: number;
  unit: string;
  budget: {
    min?: number;
    max?: number;
    currency: "KES";
  };
  deliveryScope: "countrywide" | "within_county" | "negotiable";
  deliveryLocation: {
    county: string;
    constituency?: string;
    ward?: string;
    addressLine?: string;
  };
  deliveryDeadline?: string;
  contactPhone?: string;
  status: BulkOrderStatus;
  acceptedBidId?: string;
  awardedAt?: string;
  sellerAcceptedAt?: string;
  sellerAcceptanceNote?: string;
  buyerMarkedCompleteAt?: string;
  sellerMarkedCompleteAt?: string;
  completionReminderSentAt?: string;
  completionStatus?: BulkCompletionStatus;
  presumedCompletedAt?: string;
  closedBySystem?: boolean;
  closedAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  bidCount?: number;
  myBid?: {
    _id: string;
    orderId: string;
    quoteAmount: number;
    deliveryDate: string;
    status: BulkBidStatus;
    currency: "KES";
  } | null;
}

export const createBulkOrder = async (payload: BulkOrderInput) =>
  apiRequest(API_ENDPOINTS.bulkOrders.create, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listBulkOrders = async (params?: {
  mine?: boolean;
  status?: BulkOrderStatus | "";
  category?: BulkOrderCategory | "";
  county?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.mine) query.set("mine", "true");
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.county) query.set("county", params.county);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const url = `${API_ENDPOINTS.bulkOrders.list}${query.toString() ? `?${query.toString()}` : ""}`;
  return apiRequest(url);
};

export const getBulkOrderDetails = async (orderId: string) =>
  apiRequest(API_ENDPOINTS.bulkOrders.getById(orderId));

export const getSellerAwardedBulkOrders = async () =>
  apiRequest(API_ENDPOINTS.bulkOrders.sellerAwarded);

export const placeBulkOrderBid = async (orderId: string, payload: BulkOrderBidInput) =>
  apiRequest(API_ENDPOINTS.bulkOrders.bids.create(orderId), {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const acceptBulkOrderBid = async (
  orderId: string,
  bidId: string,
  reason?: string,
  rejectReason?: string
) =>
  apiRequest(API_ENDPOINTS.bulkOrders.bids.accept(orderId, bidId), {
    method: "PUT",
    body: JSON.stringify({ reason, rejectReason }),
  });

export const rejectBulkOrderBid = async (
  orderId: string,
  bidId: string,
  reason: string
) =>
  apiRequest(API_ENDPOINTS.bulkOrders.bids.reject(orderId, bidId), {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });

export const closeBulkOrder = async (
  orderId: string,
  status: "closed" | "cancelled",
  reason?: string
) =>
  apiRequest(API_ENDPOINTS.bulkOrders.close(orderId), {
    method: "PUT",
    body: JSON.stringify({ status, reason }),
  });

export const acceptAwardedBulkOrder = async (orderId: string, note?: string) =>
  apiRequest(API_ENDPOINTS.bulkOrders.acceptOrder(orderId), {
    method: "PUT",
    body: JSON.stringify({ note }),
  });

export const markBulkOrderComplete = async (orderId: string) =>
  apiRequest(API_ENDPOINTS.bulkOrders.markComplete(orderId), {
    method: "PUT",
    body: JSON.stringify({}),
  });

export const getBulkOrderInvoice = async (orderId: string) =>
  apiRequest(API_ENDPOINTS.bulkOrders.invoice(orderId));

export const listAdminBulkOrders = async (params?: {
  status?: BulkOrderStatus | "";
  category?: BulkOrderCategory | "";
  county?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.county) query.set("county", params.county);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const url = `${API_ENDPOINTS.bulkOrders.admin.list}${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  return adminApiRequest(url);
};
