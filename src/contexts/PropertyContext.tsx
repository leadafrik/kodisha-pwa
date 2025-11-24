import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  LandListing,
  ServiceListing,
} from "../types/property";
import { API_ENDPOINTS } from "../config/api";

type ServiceType = "equipment" | "agrovet" | "professional_services";
type ProductListing = any;

interface PropertyContextType {
  properties: LandListing[];
  serviceListings: ServiceListing[];
  productListings: ProductListing[];
  addProperty: (propertyData: FormData) => Promise<any>;
  addService: (serviceData: FormData) => Promise<any>;
  addProduct: (productData: FormData) => Promise<any>;
  getPropertiesByCounty: (county: string) => LandListing[];
  getServicesByType: (
    type: ServiceType,
    county?: string
  ) => ServiceListing[];
  loading: boolean;
  refreshProperties: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshProducts: () => Promise<void>;
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

const normalizeServiceTags = (services: any): string[] => {
  if (!services) return [];
  if (Array.isArray(services)) return services.filter(Boolean);
  if (typeof services === "string") {
    return services
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const mapServiceRecord = (item: any): ServiceListing => {
  const services = normalizeServiceTags(item.services);
  const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
  const subscriptionEnd = item.subscriptionEnd
    ? new Date(item.subscriptionEnd)
    : new Date();
  const ownerId = item.owner?._id || item.ownerId || item.owner;
  const ownerName = item.owner?.name || item.owner?.fullName;

  return {
    id: item._id || item.id,
    type: (item.type || "equipment") as ServiceType,
    name: item.name || "Service",
    description: item.description || "",
    ownerId,
    ownerName,
    owner: item.owner,
    location: {
      county: item.location?.county || "",
      constituency: item.location?.constituency || "",
      ward: item.location?.ward || "",
      coordinates: item.location?.coordinates,
    },
    contact:
      item.contact ||
      item.owner?.phone ||
      item.owner?.email ||
      item.alternativeContact ||
      "",
    services,
    verified: item.isVerified ?? item.verified ?? false,
    subscriptionEnd,
    createdAt,
    pricing: item.pricing,
    experience: item.experience,
    operatorIncluded: item.operatorIncluded,
    approximateLocation:
      item.location?.approximateLocation || item.approximateLocation,
    qualifications: item.qualifications,
    photos: item.images || item.photos,
    alternativeContact: item.alternativeContact,
    email: item.email,
    businessHours: item.businessHours,
  };
};

export const PropertyProvider: React.FC<PropertyProviderProps> = ({
  children,
}) => {
  const [properties, setProperties] = useState<LandListing[]>([]);
  const [serviceListings, setServiceListings] = useState<ServiceListing[]>([]);
  const [productListings, setProductListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshProperties();
    refreshServices();
    refreshProducts();
  }, []);

  const refreshProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.properties.getAll);
      if (!response.ok) throw new Error("Failed to fetch listings");
      const data = await response.json();
      setProperties(data.data || data.listings || []);
      console.log("Listings loaded:", data.data?.length || 0);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshServices = async () => {
    setLoading(true);
    try {
      const [equipmentRes, professionalRes, agrovetRes] = await Promise.all([
        fetch(API_ENDPOINTS.services.equipment.list),
        fetch(API_ENDPOINTS.services.professional.list),
        fetch(API_ENDPOINTS.services.agrovets.list),
      ]);

      if (!equipmentRes.ok || !professionalRes.ok || !agrovetRes.ok) {
        throw new Error("Failed to fetch services");
      }

      const equipmentJson = await equipmentRes.json();
      const professionalJson = await professionalRes.json();
      const agrovetJson = await agrovetRes.json();

      const equipment = (equipmentJson.data || []).map(mapServiceRecord);
      const professional = (professionalJson.data || []).map(mapServiceRecord);
      const agrovet = (agrovetJson.data || []).map((item: any) =>
        mapServiceRecord({ ...item, type: "agrovet" })
      );

      const combined = [...equipment, ...professional, ...agrovet].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      setServiceListings(combined);
      console.log("Services loaded:", combined.length);
    } catch (error) {
      console.error("Error loading services:", error);
      setServiceListings([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.services.products.list);
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      setProductListings(json.data || []);
    } catch (err) {
      console.error("Error loading products:", err);
      setProductListings([]);
    }
  };

  const addProperty = async (formData: FormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kodisha_token");

      if (!token) {
        alert("You must be logged in to list property.");
        throw new Error("No auth token");
      }

      const response = await fetch(API_ENDPOINTS.properties.create, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Upload failed: ${result.message || "Unknown error"}`);
        throw new Error(result.message || "Failed");
      }

      await refreshProperties();
      return result;
    } catch (error) {
      console.error("addProperty error:", error);
      alert("Failed to upload property. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addService = async (formData: FormData) => {
    setLoading(true);
    try {
      const type = (formData.get("type") as string) || "equipment";
      const token = localStorage.getItem("kodisha_token");

      if (!token) {
        alert("You must be logged in and verified to list a service or agrovet.");
        throw new Error("No auth token");
      }
      // Default equipment, send non-equipment (professional/agrovet) to professional endpoint
      const endpoint =
        type === "equipment"
          ? API_ENDPOINTS.services.equipment.create
          : API_ENDPOINTS.services.professional.create;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to create service");
      }

      await refreshServices();
      return result;
    } catch (error) {
      console.error("addService error:", error);
      alert("Failed to upload service. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (formData: FormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("kodisha_token");
      if (!token) {
        alert("You must be logged in to list a product.");
        throw new Error("No auth token");
      }
      const response = await fetch(API_ENDPOINTS.services.products.create, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to create product");
      }
      await refreshProducts();
      return result;
    } catch (error) {
      console.error("addProduct error:", error);
      alert("Failed to upload product. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPropertiesByCounty = (county: string) => {
    if (!county) return properties;
    return properties.filter(
      (p) => p.location?.county?.toLowerCase() === county.toLowerCase()
    );
  };

  const getServicesByType = (type: ServiceType, county?: string) => {
    let list = serviceListings.filter((s) => s.type === type);
    if (county) {
      list = list.filter(
        (s) => s.location?.county?.toLowerCase() === county.toLowerCase()
      );
    }
    return list;
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        serviceListings,
        productListings,
        addProperty,
        addService,
        addProduct,
        getPropertiesByCounty,
        getServicesByType,
        loading,
        refreshProperties,
        refreshServices,
        refreshProducts,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};
