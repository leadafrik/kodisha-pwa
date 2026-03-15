export type MarketplaceOrderPaymentStatus =
  | "submitted"
  | "verified"
  | "rejected"
  | "refunded";

export type MarketplaceOrderStatus =
  | "payment_review"
  | "confirmed"
  | "processing"
  | "delivered"
  | "payment_rejected"
  | "cancelled"
  | "refunded";

export type MarketplaceOrderSellerFulfillmentStatus =
  | "awaiting_payment_confirmation"
  | "ready_to_ship"
  | "delivery_in_progress"
  | "delivered";

export type PayerPhoneSource = "account" | "different";

export interface CartItem {
  listingId: string;
  listingType: "product";
  title: string;
  image?: string;
  category?: string;
  county?: string;
  deliveryScope?: "countrywide" | "within_county" | "negotiable";
  sellerId?: string;
  sellerName?: string;
  unit?: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
}

export interface MarketplaceOrderItem {
  listingId: string;
  listingType: "product" | "buyer_request_offer" | "bulk_offer";
  title: string;
  image?: string;
  category?: string;
  county?: string;
  deliveryScope?: "countrywide" | "within_county" | "negotiable";
  sellerId: string;
  sellerName: string;
  unit?: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface MarketplaceOrderSellerFulfillmentEntry {
  sellerId: string;
  sellerName: string;
  itemIds: string[];
  status: MarketplaceOrderSellerFulfillmentStatus;
  note?: string;
  updatedAt: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
}

export interface MarketplaceOrder {
  _id: string;
  orderNumber: string;
  buyerId: string;
  source?: {
    type: "cart" | "buyer_request_offer" | "bulk_offer";
    requestId?: string;
    responseId?: string;
    bulkOrderId?: string;
    bidId?: string;
  };
  buyerSnapshot: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  contactPhone: string;
  items: MarketplaceOrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  currency: "KES";
  paymentStatus: MarketplaceOrderPaymentStatus;
  orderStatus: MarketplaceOrderStatus;
  payment: {
    method: "mpesa_till";
    storeNumber: string;
    tillNumber: string;
    payerPhoneSource: PayerPhoneSource;
    buyerPhoneOnRecord?: string;
    payerPhone: string;
    submittedAt: string;
    verifiedAt?: string;
    rejectedAt?: string;
    refundedAt?: string;
    verifiedBy?: string;
  };
  invoice: {
    invoiceNumber: string;
    issuedAt: string;
    buyerEmailSentAt?: string;
    adminEmailSentAt?: string;
  };
  sellerFulfillment: MarketplaceOrderSellerFulfillmentEntry[];
  delivery: {
    county: string;
    constituency?: string;
    ward?: string;
    approximateLocation?: string;
    notes?: string;
    estimatedDeliveryDays: number;
    estimatedDeliveryDate: string;
  };
  moneyBackGuarantee: boolean;
  customerNote?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferCheckoutSummary {
  sourceType: "buyer_request_offer" | "bulk_offer";
  sourceId: string;
  heading: string;
  title: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  county: string;
  category?: string;
  deliveryScope?: "countrywide" | "within_county" | "negotiable";
  estimatedDeliveryDate?: string;
  existingOrderId?: string;
  requestId?: string;
  responseId?: string;
  bulkOrderId?: string;
  bidId?: string;
}

export interface SellerMarketplaceOrder
  extends Omit<MarketplaceOrder, "items" | "sellerFulfillment"> {
  items: MarketplaceOrderItem[];
  sellerFulfillment: MarketplaceOrderSellerFulfillmentEntry | null;
  sellerSubtotal: number;
}

export interface CheckoutPayload {
  items: Array<Pick<CartItem, "listingId" | "quantity">>;
  contactPhone: string;
  payerPhoneSource: PayerPhoneSource;
  payerPhone?: string;
  customerNote?: string;
  delivery: {
    county: string;
    constituency?: string;
    ward?: string;
    approximateLocation?: string;
    notes?: string;
  };
}
