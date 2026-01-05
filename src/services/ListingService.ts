import api from './api';

// ===== TYPES =====
export interface CreateListingPayload {
  title: string;
  description: string;
  category: 'land' | 'product' | 'service' | 'agrovet' | 'equipment';
  type: 'sell' | 'rental' | 'buy' | 'hire' | 'seek';
  price: number;
  priceType?: string;
  quantity?: number;
  unit?: string;
  images?: string[];
  contact: string;
  location: {
    country: string;
    region: string;
    subRegion?: string;
    ward?: string;
    coordinates?: { lat: number; lng: number };
  };
  [key: string]: any;
}

export interface ListingFilters {
  category?: string;
  type?: string;
  country?: string;
  region?: string;
  search?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export interface UnifiedListing extends CreateListingPayload {
  _id: string;
  owner: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    trustScore: number;
    isVerified: boolean;
  };
  status: string;
  isPublished: boolean;
  verified: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// ===== API SERVICE =====
export const ListingService = {
  /**
   * Create a new unified listing
   */
  async createListing(payload: CreateListingPayload): Promise<UnifiedListing> {
    const response = await api.post('/unified-listings', payload);
    return response.data.listing;
  },

  /**
   * Get all listings with filters
   */
  async searchListings(filters: ListingFilters) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.type) params.append('type', filters.type);
    if (filters.country) params.append('country', filters.country);
    if (filters.region) params.append('region', filters.region);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/unified-listings?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single listing details
   */
  async getListing(id: string): Promise<UnifiedListing> {
    const response = await api.get(`/unified-listings/${id}`);
    return response.data.data;
  },

  /**
   * Update listing
   */
  async updateListing(id: string, payload: Partial<CreateListingPayload>): Promise<UnifiedListing> {
    const response = await api.patch(`/unified-listings/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete (delist) listing
   */
  async deleteListing(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/unified-listings/${id}`);
    return response.data;
  },

  /**
   * Publish a draft listing
   */
  async publishListing(id: string): Promise<UnifiedListing> {
    const response = await api.post(`/unified-listings/${id}/publish`);
    return response.data.data;
  },

  /**
   * Get current user's listings
   */
  async getMyListings(status?: string, category?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const response = await api.get(`/unified-listings/user/my-listings?${params.toString()}`);
    return response.data;
  },

  /**
   * Get listings by category
   */
  async getByCategory(category: string, country: string = 'KE'): Promise<{ data: UnifiedListing[] }> {
    const response = await api.get(`/unified-listings?category=${category}&country=${country}`);
    return response.data;
  },

  /**
   * Get listings by region
   */
  async getByRegion(region: string, country: string = 'KE') {
    const response = await api.get(`/unified-listings?region=${region}&country=${country}`);
    return response.data;
  },

  /**
   * Search listings by text
   */
  async search(query: string, country: string = 'KE') {
    const response = await api.get(`/unified-listings?search=${encodeURIComponent(query)}&country=${country}`);
    return response.data;
  },
};

export default ListingService;
