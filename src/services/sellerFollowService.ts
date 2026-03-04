import { API_ENDPOINTS, apiRequest, ensureValidAccessToken } from "../config/api";

export interface SellerFollowStatus {
  isFollowing: boolean;
  followerCount: number;
}

export const getSellerFollowStats = async (
  sellerId: string
): Promise<SellerFollowStatus> => {
  const response = await apiRequest(API_ENDPOINTS.sellerFollows.stats(sellerId));
  return response?.data || { isFollowing: false, followerCount: 0 };
};

export const getSellerFollowStatus = async (
  sellerId: string
): Promise<SellerFollowStatus> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await apiRequest(API_ENDPOINTS.sellerFollows.status(sellerId), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response?.data || { isFollowing: false, followerCount: 0 };
};

export const toggleSellerFollow = async (
  sellerId: string
): Promise<SellerFollowStatus & { action: "followed" | "unfollowed" }> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await apiRequest(API_ENDPOINTS.sellerFollows.toggle(sellerId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response?.data;
};
