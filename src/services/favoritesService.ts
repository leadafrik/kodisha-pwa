import { API_ENDPOINTS } from '../config/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('kodisha_token');
};

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
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.favorites.list, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch favorites');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Add or remove a listing from favorites
 */
export const toggleFavorite = async (
  listingId: string,
  listingType: 'land' | 'product' | 'equipment' | 'service' | 'agrovet'
): Promise<{ action: 'added' | 'removed' }> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.favorites.toggle, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      listingId,
      listingType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle favorite');
  }

  const data = await response.json();
  return {
    action: data.message === 'added' ? 'added' : 'removed',
  };
};

export const favoritesService = {
  getFavorites,
  toggleFavorite,
};
