import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property, PropertyFormData, ServiceListing, ServiceFormData } from '../types/property';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface PropertyContextType {
  properties: Property[];
  serviceListings: ServiceListing[];
  addProperty: (propertyData: PropertyFormData) => void;
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
      const response = await apiRequest(API_ENDPOINTS.properties.getAll);
      setProperties(response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      // Fallback to sample data if API fails
      setProperties([
        {
          id: '1',
          title: '5 Acre Farmland in Kiambu',
          description: 'Beautiful fertile land suitable for farming, with water access and good road network.',
          price: 2500000,
          size: 5,
          sizeUnit: 'acres',
          county: 'Kiambu',
          constituency: 'Kikuyu',
          contact: '0712345678',
          images: [],
          verified: true,
          listedBy: 'John Kamau',
          createdAt: new Date('2024-01-15'),
          type: 'sale'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async (propertyData: PropertyFormData) => {
    setLoading(true);
    try {
      // TODO: Replace with real API call once we test the form
      console.log('Would create property:', propertyData);
      
      const newProperty: Property = {
        id: Math.random().toString(36).substr(2, 9),
        ...propertyData,
        price: parseInt(propertyData.price),
        size: parseInt(propertyData.size),
        images: [],
        verified: false,
        listedBy: 'Current User',
        createdAt: new Date(),
      };
      
      setProperties(prev => [newProperty, ...prev]);
      
      // Show success message
      alert('Property listed successfully! (Backend integration coming soon)');
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Error creating property. Please try again.');
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