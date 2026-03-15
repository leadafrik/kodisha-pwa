import { API_ENDPOINTS, apiRequest } from "../config/api";

export interface BuyerRequestDeliveryOfferInput {
  message: string;
  quoteAmount: number;
  deliveryDate: string;
}

export const submitBuyerRequestDeliveryOffer = async (
  requestId: string,
  payload: BuyerRequestDeliveryOfferInput
) =>
  apiRequest(API_ENDPOINTS.buyerRequests.deliveryOffers.create(requestId), {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const acceptBuyerRequestDeliveryOffer = async (
  requestId: string,
  responseId: string
) =>
  apiRequest(API_ENDPOINTS.buyerRequests.deliveryOffers.accept(requestId, responseId), {
    method: "PUT",
    body: JSON.stringify({}),
  });
