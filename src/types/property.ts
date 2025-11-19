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

// ✅ UPDATED: Added all the new fields from your form
export interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  size: string;
  sizeUnit: 'acres' | 'hectares';
  county: string;
  constituency: string;
  ward: string; // ✅ ADDED
  approximateLocation: string; // ✅ ADDED
  soilType: string; // ✅ ADDED
  waterAvailability: string; // ✅ ADDED
  previousCrops: string; // ✅ ADDED
  organicCertified: boolean; // ✅ ADDED
  availableFrom: string; // ✅ ADDED
  availableTo: string; // ✅ ADDED
  minLeasePeriod: string; // ✅ ADDED
  maxLeasePeriod: string; // ✅ ADDED
  preferredCrops: string; // ✅ ADDED
  contact: string;
  type: 'sale' | 'rental';
  // Removed images field since we're using FormData
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

// User Types - UPDATED WITH VERIFICATION FIELDS
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
  
  // ✅ ADD THESE NEW FIELDS TO MATCH BACKEND
  _id?: string;
  fullName?: string;
  userType?: 'farmer' | 'landowner' | 'buyer' | 'service provider';
  county?: string;
  isVerified?: boolean;
  
  // ✅ ADD VERIFICATION OBJECT
  verification?: {
    phoneVerified: boolean;
    idVerified: boolean;
    selfieVerified: boolean;
    ownershipVerified: boolean;
    businessVerified: boolean;
    trustScore: number;
    verificationLevel: 'basic' | 'verified' | 'premium';
  };
}

// Update the AuthContextType interface
export interface AuthContextType {
  user: User | null;
  login: (phone: string, name: string) => void;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  register: (userData: UserFormData) => Promise<User>;
  loading: boolean;
}

// Update the UserFormData interface
export interface UserFormData {
  name: string;
  phone: string;
  email?: string;
  type: 'buyer' | 'seller' | 'service_provider';
  county: string;
  constituency?: string;
  ward?: string;
}