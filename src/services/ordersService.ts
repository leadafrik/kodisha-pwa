import { API_ENDPOINTS, adminApiRequest, apiRequest } from "../config/api";
import {
  CheckoutPayload,
  MarketplaceOrder,
  MarketplaceOrderPaymentStatus,
  MarketplaceOrderStatus,
} from "../types/orders";

export const MARKETPLACE_MPESA_STORE_NUMBER = "4511909";
export const MARKETPLACE_MPESA_TILL_NUMBER = "3319295";
export const MARKETPLACE_ESTIMATED_DELIVERY_DAYS = 3;

export const checkoutMarketplaceOrder = async (payload: CheckoutPayload) => {
  const response = await apiRequest(API_ENDPOINTS.orders.checkout, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response as {
    success: boolean;
    message?: string;
    data: MarketplaceOrder;
  };
};

export const listMyMarketplaceOrders = async () => {
  const response = await apiRequest(API_ENDPOINTS.orders.my);
  return response as {
    success: boolean;
    data: MarketplaceOrder[];
  };
};

export const getMarketplaceOrderById = async (orderId: string) => {
  const response = await apiRequest(API_ENDPOINTS.orders.byId(orderId));
  return response as {
    success: boolean;
    data: MarketplaceOrder;
  };
};

export const listAdminMarketplaceOrders = async (params?: {
  status?: string;
  paymentStatus?: string;
  search?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
  if (params?.search) query.set("search", params.search);

  const url = `${API_ENDPOINTS.orders.admin.list}${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const response = await adminApiRequest(url);
  return response as {
    success: boolean;
    data: MarketplaceOrder[];
    stats: {
      total: number;
      paymentReviewCount: number;
      confirmedCount: number;
      deliveredCount: number;
    };
  };
};

export const updateAdminMarketplaceOrderPayment = async (
  orderId: string,
  action: "verify" | "reject" | "refund",
  adminNote?: string
) => {
  const response = await adminApiRequest(API_ENDPOINTS.orders.admin.payment(orderId), {
    method: "PUT",
    body: JSON.stringify({ action, adminNote }),
  });

  return response as {
    success: boolean;
    message?: string;
    data: MarketplaceOrder;
  };
};

export const updateAdminMarketplaceOrderStatus = async (
  orderId: string,
  orderStatus: Extract<MarketplaceOrderStatus, "processing" | "delivered" | "cancelled">,
  adminNote?: string
) => {
  const response = await adminApiRequest(API_ENDPOINTS.orders.admin.status(orderId), {
    method: "PUT",
    body: JSON.stringify({ orderStatus, adminNote }),
  });

  return response as {
    success: boolean;
    message?: string;
    data: MarketplaceOrder;
  };
};

export const ORDER_PAYMENT_STATUS_LABELS: Record<MarketplaceOrderPaymentStatus, string> = {
  submitted: "Payment review",
  verified: "Payment verified",
  rejected: "Payment rejected",
  refunded: "Refunded",
};

export const ORDER_STATUS_LABELS: Record<MarketplaceOrderStatus, string> = {
  payment_review: "Awaiting payment review",
  confirmed: "Confirmed",
  processing: "Processing",
  delivered: "Delivered",
  payment_rejected: "Payment rejected",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
