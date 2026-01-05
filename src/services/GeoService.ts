import api from './api';

// ===== TYPES =====
export interface Country {
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
}

export interface Region {
  code: number;
  name: string;
  value: string;
  label: string;
}

// ===== GEO SERVICE =====
export const GeoService = {
  /**
   * Get all supported countries
   */
  async getCountries(): Promise<Country[]> {
    try {
      const response = await api.get('/geo/countries');
      return response.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  },

  /**
   * Get regions (counties) for a country
   */
  async getRegions(country: string = 'KE'): Promise<Region[]> {
    try {
      const response = await api.get(`/geo/counties?country=${country}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching regions for ${country}:`, error);
      return [];
    }
  },

  /**
   * Alias for getRegions for backward compatibility
   */
  async getCounties(country: string = 'KE'): Promise<Region[]> {
    return this.getRegions(country);
  },

  /**
   * Get country details
   */
  async getCountry(code: string): Promise<Country | null> {
    try {
      const response = await api.get(`/geo/country/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching country ${code}:`, error);
      return null;
    }
  },

  /**
   * Validate phone number for a country
   */
  async validatePhone(
    phone: string,
    country: string = 'KE'
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await api.post('/geo/validate-phone', {
        phone,
        country,
      });
      return response.data;
    } catch (error) {
      console.error('Error validating phone:', error);
      return {
        valid: false,
        message: 'Validation error',
      };
    }
  },

  /**
   * Search for regions by name
   */
  async searchRegions(query: string, country: string = 'KE'): Promise<Region[]> {
    try {
      const response = await api.get(`/geo/search?q=${encodeURIComponent(query)}&country=${country}`);
      return response.data;
    } catch (error) {
      console.error('Error searching regions:', error);
      return [];
    }
  },

  /**
   * Get formatted regions for dropdown
   */
  async getRegionsForDropdown(country: string = 'KE') {
    const regions = await this.getRegions(country);
    return regions.map((region) => ({
      value: region.name.toLowerCase(),
      label: region.name,
      code: region.code,
    }));
  },

  /**
   * Check if phone format is valid for country (client-side validation)
   */
  validatePhoneFormat(phone: string, country: string = 'KE'): boolean {
    const cleanPhone = phone.replace(/\D/g, '');

    const patterns: Record<string, RegExp> = {
      KE: /^254\d{9}$/,
      UG: /^256\d{9}$/,
      RW: /^250\d{9}$/,
    };

    return patterns[country]?.test(cleanPhone) ?? false;
  },

  /**
   * Format phone number for storage (remove non-digits)
   */
  formatPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  },

  /**
   * Get country from phone prefix
   */
  getCountryFromPhone(phone: string): string | null {
    const prefixes: Record<string, string> = {
      '254': 'KE',
      '256': 'UG',
      '250': 'RW',
    };

    const cleanPhone = phone.replace(/\D/g, '');
    for (const [prefix, country] of Object.entries(prefixes)) {
      if (cleanPhone.startsWith(prefix)) {
        return country;
      }
    }

    return null;
  },
};

export default GeoService;
