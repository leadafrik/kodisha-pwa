import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LandListing, ServiceListing, ServiceFormData } from '../types/property';
import { API_ENDPOINTS } from '../config/api';

interface PropertyContextType {
  properties: LandListing[];
  serviceListings: ServiceListing[];
  addProperty: (propertyData: FormData) => Promise<void>;
  addService: (serviceData: ServiceFormData) => Promise<void>;
  getPropertiesByCounty: (county: string) => LandListing[];
  getServicesByType: (type: 'equipment' | 'agrovet' | 'professional_services', county?: string) => ServiceListing[];
  loading: boolean;
  refreshProperties: () => Promise<void>;
  refreshServices: () => Promise<void>;
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
  const [properties, setProperties] = useState<LandListing[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Load properties and services from backend on component mount
  React.useEffect(() => {
    refreshProperties();
    refreshServices();
  }, []);

  const refreshProperties = async () => {
    setLoading(true);
    try {
      console.log('=== FRONTEND DEBUG: refreshProperties ===');
      console.log('🔧 API_ENDPOINTS.properties.getAll:', API_ENDPOINTS.properties.getAll);
      
      const response = await fetch(API_ENDPOINTS.properties.getAll);
      
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response ok?', response.ok);
      
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      
      console.log('🔧 Response data received:', data);
      console.log('🔧 Number of properties:', data.data?.length || data.length || 0);
      
      setProperties(data.data || data || []);
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshServices = async () => {
    setLoading(true);
    try {
      console.log('=== FRONTEND DEBUG: refreshServices ===');
      
      // Fetch equipment services
      const equipmentResponse = await fetch('/api/services/equipment');
      console.log('🔧 Equipment response status:', equipmentResponse.status);
      
      if (!equipmentResponse.ok) throw new Error('Failed to fetch equipment services');
      const equipmentData = await equipmentResponse.json();
      
      // Fetch professional services
      const professionalResponse = await fetch('/api/services/professional');
      console.log('🔧 Professional response status:', professionalResponse.status);
      
      if (!professionalResponse.ok) throw new Error('Failed to fetch professional services');
      const professionalData = await professionalResponse.json();
      
      // ✅ ADDED: Fetch agrovet services
      const agrovetResponse = await fetch('/api/agrovets');
      console.log('🔧 Agrovet response status:', agrovetResponse.status);
      
      if (!agrovetResponse.ok) throw new Error('Failed to fetch agrovet services');
      const agrovetData = await agrovetResponse.json();
      
      // Combine all types
      const allServices = [
        ...(equipmentData.data || []).map((service: any) => ({
          ...service,
          type: 'equipment' as const,
          id: service._id || service.id,
          location: service.location || {
            county: service.county,
            constituency: service.constituency,
            ward: service.ward
          }
        })),
        ...(professionalData.data || []).map((service: any) => ({
          ...service,
          type: 'professional_services' as const,
          id: service._id || service.id,
          location: service.location || {
            county: service.county,
            constituency: service.constituency,
            ward: service.ward
          }
        })),
        // ✅ ADDED: Agrovet services
        ...(agrovetData.data || []).map((service: any) => ({
          ...service,
          type: 'agrovet' as const,
          id: service._id || service.id,
          location: service.location || {
            county: service.county,
            constituency: service.constituency,
            ward: service.ward
          }
        }))
      ];
      
      console.log('🔧 Combined services data:', allServices);
      console.log('🔧 Total services:', allServices.length);
      
      setServiceListings(allServices);
      
    } catch (error) {
      console.error('❌ Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (formData: FormData) => {
    setLoading(true);
    try {
      console.log('📤 Uploading property with images...');
      
      console.log('=== FRONTEND DEBUG: addProperty ===');
      console.log('🔧 API_ENDPOINTS.properties.create:', API_ENDPOINTS.properties.create);
      
      const response = await fetch(API_ENDPOINTS.properties.create, {
        method: 'POST',
        body: formData,
      });

      console.log('🔧 Create response status:', response.status);
      console.log('🔧 Create response ok?', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔧 Error response data:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Property created successfully:', result);

      await refreshProperties();
      alert('✅ Property listed successfully with images! It will appear after verification.');
      
    } catch (error: any) {
      console.error('❌ Error creating property:', error);
      console.log('🔧 Error message:', error.message);
      
      // Fallback to local state
      const newLandListing: any = {
        _id: Math.random().toString(36).substr(2, 9),
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        size: parseFloat(formData.get('size') as string),
        price: parseFloat(formData.get('price') as string),
        priceType: 'per-season',
        location: {
          county: formData.get('county') as string,
          constituency: formData.get('constituency') as string,
          ward: formData.get('ward') as string,
          approximateLocation: formData.get('approximateLocation') as string,
        },
        soilType: formData.get('soilType') as string || 'loam',
        waterAvailability: formData.get('waterAvailability') as string || 'rain-fed',
        previousCrops: (formData.get('previousCrops') as string)?.split(',').filter(Boolean) || [],
        organicCertified: formData.get('organicCertified') === 'true',
        availableFrom: new Date(formData.get('availableFrom') as string),
        availableTo: new Date(formData.get('availableTo') as string),
        minLeasePeriod: parseInt(formData.get('minLeasePeriod') as string || '1'),
        maxLeasePeriod: parseInt(formData.get('maxLeasePeriod') as string || '12'),
        preferredCrops: (formData.get('preferredCrops') as string)?.split(',').filter(Boolean) || [],
        contact: formData.get('contact') as string,
        images: [],
        isVerified: false,
        status: 'available',
        views: 0,
        inquiries: 0,
        owner: 'current-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setProperties(prev => [newLandListing, ...prev]);
      alert('ℹ️ Property listed locally (backend connection failed)');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert base64 to blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const addService = async (serviceData: ServiceFormData) => {
    setLoading(true);
    try {
      console.log('📤 Creating service listing...');
      
      // ✅ FIXED: Choose the correct endpoint based on service type
      let endpoint = '';
      if (serviceData.type === 'equipment') {
        endpoint = '/api/services/equipment';
      } else if (serviceData.type === 'professional_services') {
        endpoint = '/api/services/professional';
      } else if (serviceData.type === 'agrovet') {
        endpoint = '/api/agrovets'; // ✅ Your agrovet endpoint
      }

      console.log('🔧 Using endpoint:', endpoint);
      console.log('🔧 Service type:', serviceData.type);
      console.log('🔧 Photo count:', serviceData.photos?.length || 0);

      // Use FormData for file uploads (required by your backend)
      const formData = new FormData();
      
      // Add common fields
      formData.append('name', serviceData.name);
      formData.append('description', serviceData.description);
      formData.append('county', serviceData.county);
      formData.append('constituency', serviceData.constituency);
      formData.append('ward', serviceData.ward);
      formData.append('contact', serviceData.contact);
      
      // Add optional fields
      if (serviceData.approximateLocation) {
        formData.append('approximateLocation', serviceData.approximateLocation);
      }

      // ✅ FIXED: Add type-specific fields
      if (serviceData.type === 'equipment') {
        formData.append('services', serviceData.services.join(','));
        if (serviceData.pricing) {
          formData.append('pricing', serviceData.pricing);
        }
        formData.append('operatorIncluded', (serviceData.operatorIncluded || false).toString());
      } 
      else if (serviceData.type === 'professional_services') {
        formData.append('services', serviceData.services.join(','));
        if (serviceData.pricing) {
          formData.append('pricing', serviceData.pricing);
        }
        if (serviceData.experience) {
          formData.append('experience', serviceData.experience);
        }
        if (serviceData.qualifications) {
          formData.append('qualifications', serviceData.qualifications);
        }
      }
      else if (serviceData.type === 'agrovet') {
        // ✅ ADDED: Agrovet specific fields
        if (serviceData.town) formData.append('town', serviceData.town);
        if (serviceData.openingHours) formData.append('openingHours', serviceData.openingHours);
        formData.append('deliveryAvailable', (serviceData.deliveryAvailable || false).toString());
        
        // Categories
        formData.append('products', (serviceData.products || false).toString());
        formData.append('animalHealth', (serviceData.animalHealth || false).toString());
        formData.append('cropProtection', (serviceData.cropProtection || false).toString());
        formData.append('equipment', (serviceData.equipment || false).toString());
        
        // Services
        if (serviceData.seeds) formData.append('seeds', serviceData.seeds);
        if (serviceData.fertilizers) formData.append('fertilizers', serviceData.fertilizers);
        if (serviceData.animalFeeds) formData.append('animalFeeds', serviceData.animalFeeds);
        
        // Animal Health
        formData.append('dewormers', (serviceData.dewormers || false).toString());
        formData.append('vaccines', (serviceData.vaccines || false).toString());
        formData.append('antibiotics', (serviceData.antibiotics || false).toString());
        formData.append('vitaminSupplements', (serviceData.vitaminSupplements || false).toString());
        formData.append('artificialInsemination', (serviceData.artificialInsemination || false).toString());
        
        // Crop Protection
        formData.append('pesticides', (serviceData.pesticides || false).toString());
        formData.append('herbicides', (serviceData.herbicides || false).toString());
        formData.append('fungicides', (serviceData.fungicides || false).toString());
        
        // Equipment
        formData.append('sprayers', (serviceData.sprayers || false).toString());
        formData.append('waterPumps', (serviceData.waterPumps || false).toString());
        formData.append('protectiveGear', (serviceData.protectiveGear || false).toString());
        formData.append('farmTools', (serviceData.farmTools || false).toString());
      }

      // Add photos as files (convert base64 to blobs)
      if (serviceData.photos && serviceData.photos.length > 0) {
        serviceData.photos.forEach((photo, index) => {
          try {
            const blob = dataURLtoBlob(photo);
            formData.append('images', blob, `photo-${index}.jpg`);
          } catch (error) {
            console.error('Error converting photo to blob:', error);
          }
        });
      }

      // Add a default ownerId (you might want to get this from auth context)
      formData.append('ownerId', 'default-owner-id');

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData, // ✅ Use FormData for file uploads
        // Don't set Content-Type - browser will set it with boundary
      });

      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response ok?', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔧 Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Service created successfully:', result);

      // Refresh services from backend
      await refreshServices();
      
      alert('✅ Service listed successfully! It will appear after verification.');
      
    } catch (error: any) {
      console.error('❌ Error creating service:', error);
      console.log('🔧 Error message:', error.message);
      
      // Fallback to local state
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
      alert('ℹ️ Service listed locally (backend connection failed)');
    } finally {
      setLoading(false);
    }
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
      refreshProperties,
      refreshServices
    }}>
      {children}
    </PropertyContext.Provider>
  );
};