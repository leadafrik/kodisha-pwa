import React, { createContext, useContext, useState, ReactNode } from "react";
import { LandListing, ServiceListing, ServiceFormData } from "../types/property";
import { API_ENDPOINTS } from "../config/api";

interface PropertyContextType {
  properties: LandListing[];
  serviceListings: ServiceListing[];
  addProperty: (propertyData: FormData) => Promise<void>;
  addService: (serviceData: ServiceFormData) => Promise<void>;
  getPropertiesByCounty: (county: string) => LandListing[];
  getServicesByType: (
    type: "equipment" | "agrovet" | "professional_services",
    county?: string
  ) => ServiceListing[];
  loading: boolean;
  refreshProperties: () => Promise<void>;
  refreshServices: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("useProperties must be used within PropertyProvider");
  }
  return context;
};

interface PropertyProviderProps {
  children: ReactNode;
}

export const PropertyProvider: React.FC<PropertyProviderProps> = ({
  children,
}) => {
  const [properties, setProperties] = useState<LandListing[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(false);

  // Load properties on mount
  React.useEffect(() => {
    refreshProperties();
  }, []);

  // ============================================================
  // FETCH LAND LISTINGS
  // ============================================================
  const refreshProperties = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching properties:", API_ENDPOINTS.properties.getAll);

      const response = await fetch(API_ENDPOINTS.properties.getAll);

      if (!response.ok) throw new Error("Failed to fetch listings");

      const data = await response.json();

      setProperties(data.data || []);
      console.log("✅ Listings loaded:", data.data?.length || 0);
    } catch (error) {
      console.error("❌ Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // TEMP DISABLE SERVICES (backend not implemented yet)
  // ============================================================
  const refreshServices = async () => {
    console.warn("⚠️ Service fetch disabled — backend route not ready");
    setServiceListings([]);
  };

  // ============================================================
  // ADD PROPERTY (ACTUAL BACKEND UPLOAD)
  // ============================================================
  const addProperty = async (formData: FormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kodisha_token");

      if (!token) {
        alert("You must be logged in to list property.");
        throw new Error("No auth token");
      }

      console.log("📤 Uploading property →", API_ENDPOINTS.properties.create);

      const response = await fetch(API_ENDPOINTS.properties.create, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ⭐ required for backend protect middleware
        },
        body: formData,
      });

      const result = await response.json();
      console.log("📩 Backend response:", result);

      if (!response.ok) {
        alert(`❌ Upload failed: ${result.message || "Unknown error"}`);
        throw new Error(result.message || "Failed");
      }

      await refreshProperties();
      alert("✅ Property listed successfully! It will appear after verification.");
    } catch (error) {
      console.error("❌ addProperty error:", error);
      alert("❌ Failed to upload property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ADD SERVICE (DISABLED UNTIL BACKEND IS READY)
  // ============================================================
  const addService = async () => {
    alert("⚠️ Services upload not yet connected to backend.");
  };

  // ============================================================
  // FILTER PROPERTIES BY COUNTY
  // ============================================================
  const getPropertiesByCounty = (county: string) => {
    if (!county) return properties;
    return properties.filter(
      (p) =>
        p.location?.county?.toLowerCase() === county.toLowerCase()
    );
  };

  // ============================================================
  // FILTER SERVICES (TEMPORARILY UNUSED)
  // ============================================================
  const getServicesByType = () => {
    return [];
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        serviceListings,
        addProperty,
        addService,
        getPropertiesByCounty,
        getServicesByType,
        loading,
        refreshProperties,
        refreshServices,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};
