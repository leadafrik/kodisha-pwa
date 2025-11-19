import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property, PropertyFormData, ServiceListing, ServiceFormData } from '../types/property';
import { API_ENDPOINTS } from '../config/api';

interface PropertyContextType {
  properties: Property[];
  serviceListings: ServiceListing[];
  addProperty: (propertyData: FormData) => Promise<void>; // ✅ Changed to FormData
  addService: (serviceData: ServiceFormData) => void;
  getPropertiesByCounty: (county: string) => Property[];
  getServicesByType: (type: 'equipment' | 'agrovet' | 'professional_services', county?: string) => ServiceListing[];
  loading: boolean;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
};

interface PropertyProviderProps {
  children: ReactNode;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Load properties from backend on component mount
  React.useEffect(() => {
    refreshProperties();
  }, []);

  const refreshProperties = async () => {
    setLoading(true);
    try {
      // 🔧 ADDED DEBUG LINES
      console.log('=== FRONTEND DEBUG: refreshProperties ===');
      console.log('🔧 API_ENDPOINTS.properties.getAll:', API_ENDPOINTS.properties.getAll);
      console.log('🔧 Full URL being called:', API_ENDPOINTS.properties.getAll);
      
      const response = await fetch(API_ENDPOINTS.properties.getAll);
      
      // 🔧 ADDED DEBUG LINES
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response ok?', response.ok);
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      
      // 🔧 ADDED DEBUG LINES
      console.log('🔧 Response data received:', data);
      console.log('🔧 Number of properties:', data.data?.length || data.length || 0);
      
      setProperties(data.data || data || []);
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      // Keep existing properties if API fails
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (formData: FormData) => {
    setLoading(true);
    try {
      console.log('📤 Uploading property with images...');
      
      // 🔧 ADDED DEBUG LINES
      console.log('=== FRONTEND DEBUG: addProperty ===');
      console.log('🔧 API_ENDPOINTS.properties.create:', API_ENDPOINTS.properties.create);
      console.log('🔧 Full URL being called:', API_ENDPOINTS.properties.create);
      
      // ✅ Use fetch directly for FormData (not apiRequest helper)
      const response = await fetch(API_ENDPOINTS.properties.create, {
        method: 'POST',
        body: formData, // ✅ Send FormData directly (not JSON)
        // Don't set Content-Type header - browser will set it with boundary
      });

      // 🔧 ADDED DEBUG LINES
      console.log('🔧 Create response status:', response.status);
      console.log('🔧 Create response ok?', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔧 Error response data:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Property created successfully:', result);

      // ✅ Refresh the properties list to include the new one
      await refreshProperties();
      
      // ✅ Show success message
      alert('✅ Property listed successfully with images! It will appear after verification.');
      
    } catch (error: any) {
      console.error('❌ Error creating property:', error);
      console.log('🔧 Error message:', error.message);
      
      // ✅ UPDATED: Fallback with all new fields
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const price = formData.get('price') as string;
      const size = formData.get('size') as string;
      const county = formData.get('county') as string;
      const type = formData.get('type') as string;
      
      const newProperty: Property = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        price: parseInt(price),
        size: parseInt(size),
        sizeUnit: (formData.get('sizeUnit') as 'acres' | 'hectares') || 'acres',
        county,
        constituency: formData.get('constituency') as string || '',
        ward: formData.get('ward') as string || '', // ✅ ADDED
        approximateLocation: formData.get('approximateLocation') as string || '', // ✅ ADDED
        soilType: formData.get('soilType') as string || 'loam', // ✅ ADDED
        waterAvailability: formData.get('waterAvailability') as string || 'rain-fed', // ✅ ADDED
        previousCrops: formData.get('previousCrops') as string || '', // ✅ ADDED
        organicCertified: formData.get('organicCertified') === 'true', // ✅ ADDED
        availableFrom: formData.get('availableFrom') as string || '', // ✅ ADDED
        availableTo: formData.get('availableTo') as string || '', // ✅ ADDED
        minLeasePeriod: parseInt(formData.get('minLeasePeriod') as string || '1'), // ✅ ADDED
        maxLeasePeriod: parseInt(formData.get('maxLeasePeriod') as string || '12'), // ✅ ADDED
        preferredCrops: formData.get('preferredCrops') as string || '', // ✅ ADDED
        contact: formData.get('contact') as string,
        images: [], // Empty array for local fallback
        verified: false,
        listedBy: 'Current User',
        createdAt: new Date(),
        type: type as 'sale' | 'rental',
      };
      
      setProperties(prev => [newProperty, ...prev]);
      alert('ℹ️ Property listed locally (backend connection failed)');
    } finally {
      setLoading(false);
    }
  };

  const addService = (serviceData: ServiceFormData) => {
    const newService: ServiceListing = {
      id: Math.random().toString(36).substr(2, 9),
      ...serviceData,
      location: {
        county: serviceData.county,
        constituency: serviceData.constituency,
        ward: serviceData.ward
      },
      verified: false,
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      createdAt: new Date(),
    };
    
    setServiceListings(prev => [newService, ...prev]);
  };

  const getPropertiesByCounty = (county: string) => {
    if (!county) return properties;
    return properties.filter(property => 
      property.county.toLowerCase().includes(county.toLowerCase())
    );
  };

  const getServicesByType = (type: 'equipment' | 'agrovet' | 'professional_services', county?: string) => {
    let filtered = serviceListings.filter(service => service.type === type);
    
    if (county) {
      filtered = filtered.filter(service => 
        service.location.county.toLowerCase().includes(county.toLowerCase())
      );
    }
    
    return filtered;
  };

  return (
    <PropertyContext.Provider value={{ 
      properties, 
      serviceListings, 
      addProperty, 
      addService,
      getPropertiesByCounty, 
      getServicesByType,
      loading,
      refreshProperties
    }}>
      {children}
    </PropertyContext.Provider>
  );
};