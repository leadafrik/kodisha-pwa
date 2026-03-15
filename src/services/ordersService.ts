import { API_ENDPOINTS, adminApiRequest, apiRequest } from "../config/api";
import {
  CheckoutPayload,
  MarketplaceOrder,
  MarketplaceOrderPaymentStatus,
  MarketplaceOrderSellerFulfillmentStatus,
  MarketplaceOrderStatus,
  OfferCheckoutSummary,
  SellerMarketplaceOrder,
} from "../types/orders";

export const MARKETPLACE_MPESA_TILL_NUMBER = "3319295";
export const MARKETPLACE_MPESA_MERCHANT_NAME = "Purity Valary Akong'ai";
export const MARKETPLACE_ESTIMATED_DELIVERY_DAYS = 3;
export const MARKETPLACE_DELIVERY_FEE = 350;
export const MARKETPLACE_PLATFORM_FEE = 30;
export const MARKETPLACE_SUPPORTED_DELIVERY_COUNTIES = [
  "Kiambu",
  "Nairobi",
  "Kakamega",
  "Narok",
];

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

export const getBuyerRequestOfferCheckout = async (responseId: string) => {
  const response = await apiRequest(API_ENDPOINTS.orders.requestOfferCheckout.get(responseId));
  return response as {
    success: boolean;
    data: OfferCheckoutSummary;
  };
};

export const checkoutBuyerRequestOffer = async (
  responseId: string,
  payload: Omit<CheckoutPayload, "items" | "payerPhoneSource">
) => {
  const response = await apiRequest(API_ENDPOINTS.orders.requestOfferCheckout.submit(responseId), {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response as {
    success: boolean;
    message?: string;
    data: MarketplaceOrder;
  };
};

export const getBulkOfferCheckout = async (orderId: string) => {
  const response = await apiRequest(API_ENDPOINTS.orders.bulkOfferCheckout.get(orderId));
  return response as {
    success: boolean;
    data: OfferCheckoutSummary;
  };
};

export const checkoutBulkOffer = async (
  orderId: string,
  payload: Omit<CheckoutPayload, "items" | "payerPhoneSource">
) => {
  const response = await apiRequest(API_ENDPOINTS.orders.bulkOfferCheckout.submit(orderId), {
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

export const listSellerMarketplaceOrders = async () => {
  const response = await apiRequest(API_ENDPOINTS.orders.seller.list);
  return response as {
    success: boolean;
    data: SellerMarketplaceOrder[];
  };
};

export const getSellerMarketplaceOrderById = async (orderId: string) => {
  const response = await apiRequest(API_ENDPOINTS.orders.seller.byId(orderId));
  return response as {
    success: boolean;
    data: SellerMarketplaceOrder;
  };
};

export const updateSellerMarketplaceOrderFulfillment = async (
  orderId: string,
  status: Extract<
    MarketplaceOrderSellerFulfillmentStatus,
    "delivery_in_progress" | "delivered"
  >,
  note?: string
) => {
  const response = await apiRequest(API_ENDPOINTS.orders.seller.fulfillment(orderId), {
    method: "PUT",
    body: JSON.stringify({ status, note }),
  });

  return response as {
    success: boolean;
    message?: string;
    data: SellerMarketplaceOrder;
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

export const SELLER_FULFILLMENT_STATUS_LABELS: Record<
  MarketplaceOrderSellerFulfillmentStatus,
  string
> = {
  awaiting_payment_confirmation: "Awaiting payment review",
  ready_to_ship: "Ready to ship",
  delivery_in_progress: "Delivery in progress",
  delivered: "Delivered",
};
