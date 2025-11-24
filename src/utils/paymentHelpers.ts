import { requestStkPayment } from "../services/paymentService";

export type PaymentFlowArgs = {
  targetType: "land" | "service" | "agrovet";
  targetId: string;
  amount: number;
  summaryLabel?: string;
  targetCategory?: string;
};

export const normalizeKenyanPhone = (value: string): string => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = `254${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    digits = `254${digits}`;
  }
  return digits;
};

export const promptForPaymentPhone = (summaryLabel?: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const promptMessage = summaryLabel
    ? `${summaryLabel}\nEnter the phone number that should receive the STK push (e.g., 2547...)`
    : "Enter the phone number that should receive the MPesa STK push";
  const entry = window.prompt(promptMessage, "2547");
  if (!entry) return null;
  const normalized = normalizeKenyanPhone(entry);
  if (!normalized.startsWith("254") || normalized.length !== 12) {
    window.alert("Please enter a valid Kenyan phone number (e.g., 254712345678).");
    return null;
  }
  return normalized;
};

export const initiatePaymentFlow = async (options: PaymentFlowArgs) => {
  if (options.amount <= 0) return null;
  const phone = promptForPaymentPhone(options.summaryLabel);
  if (!phone) return null;

  const payload = {
    targetType: options.targetType,
    targetId: options.targetId,
    amount: options.amount,
    phone,
    accountReference: options.targetId,
    description: `Kodisha ${options.targetType} listing`,
    targetCategory: options.targetCategory,
  };

  return await requestStkPayment(payload);
};
