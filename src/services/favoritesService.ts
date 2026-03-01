import { API_ENDPOINTS, apiRequest, ensureValidAccessToken } from '../config/api';

export interface Favorite {
  listingId: string;
  listingType: 'land' | 'product' | 'equipment' | 'service' | 'agrovet';
  addedAt: string;
  data: any;
}

/**
 * Get all user's saved/favorite listings
 */
export const getFavorites = async (): Promise<Favorite[]> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const data = await apiRequest(API_ENDPOINTS.favorites.list, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data || [];
};

/**
 * Add or remove a listing from favorites
 */
export const toggleFavorite = async (
  listingId: string,
  listingType: 'land' | 'product' | 'equipment' | 'service' | 'agrovet'
): Promise<{ action: 'added' | 'removed' }> => {
  const token = await ensureValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const data = await apiRequest(API_ENDPOINTS.favorites.toggle, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      listingId,
      listingType,
    }),
  });
  return {
    action: data.action || 'removed',
  };
};

export const favoritesService = {
  getFavorites,
  toggleFavorite,
};
