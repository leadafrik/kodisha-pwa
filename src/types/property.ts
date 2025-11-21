export interface LandListing {
  id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  sizeUnit: 'acres' | 'hectares';
  county: string;
  constituency: string;
  ward: string;
  contact: string;
  images: string[];
  verified: boolean;
  listedBy: string;
  createdAt: Date;
  type: 'sale' | 'rental';
  
  // Agricultural fields
  approximateLocation: string;
  soilType: string;
  waterAvailability: string;
  previousCrops: string;
  organicCertified: boolean;
  availableFrom: string;
  availableTo: string;
  minLeasePeriod: number;
  maxLeasePeriod: number;
  preferredCrops: string;
  
  // Backend fields (from MongoDB)
  _id?: string;
  isVerified?: boolean;
  status?: 'available' | 'leased' | 'under-maintenance';
  views?: number;
  inquiries?: number;
  owner?: any;
  location?: {
    county: string;
    constituency: string;
    ward: string;
    approximateLocation: string;
  };
  priceType?: 'per-season' | 'per-month' | 'per-acre';
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  size: string;
  sizeUnit: 'acres' | 'hectares';
  county: string;
  constituency: string;
  ward: string;
  approximateLocation: string;
  soilType: string;
  waterAvailability: string;
  previousCrops: string;
  organicCertified: boolean;
  availableFrom: string;
  availableTo: string;
  minLeasePeriod: string;
  maxLeasePeriod: string;
  preferredCrops: string;
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
  
  // New fields for equipment and professional services
  pricing?: string;
  experience?: string;
  operatorIncluded?: boolean;
  approximateLocation?: string;
  qualifications?: string;
  photos?: string[]; // Add photos field
  
  // ✅ ADDED: New contact fields for listings
  alternativeContact?: string;
  email?: string;
  businessHours?: string;
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
  
  // New fields for equipment and professional services
  pricing?: string;
  experience?: string;
  operatorIncluded?: boolean;
  approximateLocation?: string;
  qualifications?: string;
  photos?: string[]; // Add photos field
  
  // ✅ ADDED: Agrovet specific fields
  town?: string;
  openingHours?: string;
  deliveryAvailable?: boolean;
  
  // Categories
  products?: boolean;
  animalHealth?: boolean;
  cropProtection?: boolean;
  equipment?: boolean;
  
  // Services
  seeds?: string;
  fertilizers?: string;
  animalFeeds?: string;
  dewormers?: boolean;
  vaccines?: boolean;
  antibiotics?: boolean;
  vitaminSupplements?: boolean;
  artificialInsemination?: boolean;
  pesticides?: boolean;
  herbicides?: boolean;
  fungicides?: boolean;
  sprayers?: boolean;
  waterPumps?: boolean;
  protectiveGear?: boolean;
  farmTools?: boolean;
  
  // ✅ ADDED: New contact fields
  alternativeContact?: string;
  email?: string;
  businessHours?: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  idPhoto?: string;
  listings: string[];
  createdAt: Date;
  type: "buyer" | "seller" | "service_provider" | "admin";
  
  // Backend fields
  _id?: string;
  fullName?: string;
  userType?: "farmer" | "landowner" | "buyer" | "service provider";
  county?: string;
  isVerified?: boolean;
  role?: "user" | "admin" | "moderator";
  

  // Verification object
  verification?: {
    phoneVerified: boolean;
    idVerified: boolean;
    selfieVerified: boolean;
    ownershipVerified: boolean;
    businessVerified: boolean;
    trustScore: number;
    verificationLevel: "basic" | "verified" | "premium";
  };
}

export interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  register: (userData: UserFormData) => Promise<User>;
  loading: boolean;
}

export interface UserFormData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  type: "buyer" | "seller" | "service_provider";
  county: string;
  constituency?: string;
  ward?: string;
}

// Agrovet Types
export interface AgrovetListing {
  id: string;
  name: string;
  description: string;
  location: {
    county: string;
    constituency: string;
    ward: string;
    town?: string;
    approximateLocation: string;
  };
  contact: string;
  categories: {
    products: boolean;
    animalHealth: boolean;
    cropProtection: boolean;
    equipment: boolean;
  };
  services: {
    seeds: string[];
    fertilizers: string[];
    animalFeeds: string[];
    dewormers: boolean;
    vaccines: boolean;
    antibiotics: boolean;
    vitaminSupplements: boolean;
    artificialInsemination: boolean;
    pesticides: boolean;
    herbicides: boolean;
    fungicides: boolean;
    sprayers: boolean;
    waterPumps: boolean;
    protectiveGear: boolean;
    farmTools: boolean;
  };
  openingHours?: string;
  deliveryAvailable: boolean;
  verified: boolean;
  createdAt: Date;
  
  // ✅ ADDED: New contact fields for agrovet
  alternativeContact?: string;
  email?: string;
  businessHours?: string;
}

export interface AgrovetFormData {
  name: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  town: string;
  approximateLocation: string;
  contact: string;
  openingHours: string;
  deliveryAvailable: boolean;
  
  // Categories
  products: boolean;
  animalHealth: boolean;
  cropProtection: boolean;
  equipment: boolean;
  
  // Services
  seeds: string;
  fertilizers: string;
  animalFeeds: string;
  dewormers: boolean;
  vaccines: boolean;
  antibiotics: boolean;
  vitaminSupplements: boolean;
  artificialInsemination: boolean;
  pesticides: boolean;
  herbicides: boolean;
  fungicides: boolean;
  sprayers: boolean;
  waterPumps: boolean;
  protectiveGear: boolean;
  farmTools: boolean;
  
  // ✅ ADDED: New contact fields
  alternativeContact?: string;
  email?: string;
  businessHours?: string;
}