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
  listingType: "product";
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

export interface MarketplaceOrder {
  _id: string;
  orderNumber: string;
  buyerId: string;
  buyerSnapshot: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  contactPhone: string;
  items: MarketplaceOrderItem[];
  subtotal: number;
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
