import { API_ENDPOINTS, apiRequest, ensureValidAccessToken } from "../config/api";

export type PaymentRequestPayload = {
  targetType: "land" | "service" | "agrovet";
  targetId: string;
  amount: number;
  phone: string;
  accountReference?: string;
  description?: string;
  targetCategory?: string;
};

export const requestStkPayment = async (
  payload: PaymentRequestPayload
) => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error("You must be logged in to complete MPesa payments.");
  }

  const data = await apiRequest(API_ENDPOINTS.payments.initiateStk, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  // If backend indicates a simulated/stubbed MPesa response (dev sandbox), notify user
  const mpesaSimulated = data?.simulated || data?.mpesa?.simulated;
  if (mpesaSimulated) {
    console.warn("MPesa is running in simulated mode:", data?.message || data);
    if (typeof window !== "undefined") {
      window.alert(
        data?.message ||
          "MPesa configuration not present; STK push simulated. Complete payment in sandbox or mark as paid in admin."
      );
    }
  }

  return data;
};
