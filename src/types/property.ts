// ===============================
// LAND LISTING TYPES
// ===============================
export interface LandListing {
  id: string;             // frontend ID
  _id?: string;           // backend MongoDB ID

  // Basic fields
  title: string;
  description: string;
  price: number;
  size: number;
  sizeUnit: "acres" | "hectares";
  type: "sale" | "rental";

  // Frontend location fields
  county: string;
  constituency: string;
  ward: string;
  approximateLocation: string;

  // Backend location structure
  location?: {
    county: string;
    constituency: string;
    ward: string;
    approximateLocation?: string;
  };

  // Contact
  contact: string;

  // Images
  images: string[];

  // Agricultural details
  soilType: string;
  waterAvailability: string;
  previousCrops: string[]; // FIXED: backend sends array
  organicCertified: boolean;

  availableFrom: string;
  availableTo: string;
  minLeasePeriod: number;
  maxLeasePeriod: number;
  preferredCrops: string[]; // FIXED: should be array

  // Backend verification + status
  verified?: boolean;
  isVerified?: boolean;
  status?:
    | "pending_verification"
    | "pending_payment"
    | "active"
    | "leased"
    | "sold"
    | "rejected";

  // Location coordinates
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Analytics
  views?: number;
  inquiries?: number;

  // Owner object from backend
  owner?: any;

  // Payment structure
  payment?: {
    firstListingFreeApplied?: boolean;
    paymentStatus?: "not_required" | "pending" | "paid";
  };

  // Pricing
  priceType?: "per-season" | "per-month" | "per-acre";

  listedBy: string;
  createdAt: Date;
}

// ===============================
// PROPERTY FORM DATA (frontend form)
// ===============================
export interface PropertyFormData {
  title: string;
  description: string;
  price: string;
  size: string;
  sizeUnit: "acres" | "hectares";
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
  type: "sale" | "rental";

  // Coordinates added
  latitude?: number;
  longitude?: number;
}

// ===============================
// SERVICE LISTINGS
// ===============================
export interface ServiceListing {
  id: string;
  type: "equipment" | "agrovet" | "professional_services";
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

  // Extra details
  pricing?: string;
  experience?: string;
  operatorIncluded?: boolean;
  approximateLocation?: string;
  qualifications?: string;
  photos?: string[];

  // New contact fields
  alternativeContact?: string;
  email?: string;
  businessHours?: string;
}

export interface ServiceFormData {
  type: "equipment" | "agrovet" | "professional_services";
  name: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  contact: string;
  services: string[];

  pricing?: string;
  experience?: string;
  operatorIncluded?: boolean;
  approximateLocation?: string;
  qualifications?: string;
  photos?: string[];

  town?: string;
  openingHours?: string;
  deliveryAvailable?: boolean;

  products?: boolean;
  animalHealth?: boolean;
  cropProtection?: boolean;
  equipment?: boolean;

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

  alternativeContact?: string;
  email?: string;
  businessHours?: string;
}

// ===============================
// USER TYPES
// ===============================
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

  _id?: string;
  fullName?: string;
  userType?: "farmer" | "landowner" | "buyer" | "service provider";
  county?: string;
  isVerified?: boolean;
  role?: "user" | "admin" | "moderator";

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
  login: (identifier: string, password: string) => Promise<void>;
   requestEmailOtp: (email: string) => Promise<void>;
   verifyEmailOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  register: (userData: UserFormData) => Promise<User | null>;
  loading: boolean;
}

export interface UserFormData {
  name: string;
  phone?: string;
  email?: string;
  password: string;
  type: "buyer" | "seller" | "service_provider";
  county: string;
  constituency?: string;
  ward?: string;
}

// ===============================
// AGROVET TYPES
// ===============================
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

  products: boolean;
  animalHealth: boolean;
  cropProtection: boolean;
  equipment: boolean;

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

  alternativeContact?: string;
  email?: string;
  businessHours?: string;
}
