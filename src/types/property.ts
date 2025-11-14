export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  sizeUnit: 'acres' | 'hectares';
  county: string;
  constituency?: string;
  ward?: string;
  contact: string;
  images: string[];
  verified: boolean;
  listedBy: string;
  createdAt: Date;
  type: 'sale' | 'rental';
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  size: string;
  sizeUnit: 'acres' | 'hectares';
  county: string;
  constituency: string;
  contact: string;
  type: 'sale' | 'rental';
}

// Service Types
export interface ServiceListing {
  id: string;
  type: 'equipment' | 'agrovet' | 'professional_services';
  name: string;
  description: string;
  location: {
    county: string;
    constituency: string;
    ward: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: string;
  services: string[];
  verified: boolean;
  subscriptionEnd: Date;
  createdAt: Date;
}

export interface ServiceFormData {
  type: 'equipment' | 'agrovet' | 'professional_services';
  name: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  contact: string;
  services: string[];
}

// Add to your existing types in src/types/property.ts

// User Types
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  idPhoto?: string;
  listings: string[];
  createdAt: Date;
  type: 'buyer' | 'seller' | 'service_provider' | 'admin';
}

// Update the AuthContextType interface
export interface AuthContextType {
  user: User | null;
  login: (phone: string, name: string) => void;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  register: (userData: UserFormData) => Promise<User>; // ADD THIS LINE
  loading: boolean; // ADD THIS LINE
}

// Update the UserFormData interface
export interface UserFormData {
  name: string;
  phone: string;
  email?: string;
  type: 'buyer' | 'seller' | 'service_provider';
  county: string; // ADD THIS LINE
  constituency?: string;
  ward?: string;
}