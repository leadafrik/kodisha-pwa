# QUICK START - Using the New Unified System

## For Backend Developers

### Creating a Listing (Any Type)

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import Listing from '../models/Listing';

// POST /api/unified-listings
// Create land listing
const landListing = {
  title: '2 acres fertile land',
  description: 'Ready for maize planting',
  category: 'land',      // ← Type of listing
  type: 'rental',        // ← What you're doing (sell/rental/buy/hire/seek)
  price: 15000,
  priceType: 'per-season',
  contact: '+254701234567',
  location: {
    country: 'KE',
    region: 'Nairobi',
    subRegion: 'Dagoretti North',
    ward: 'Kilimani',
    coordinates: { lat: -1.3521, lng: 36.7784 }
  },
  images: ['https://cloudinary.com/...'],
  landDetails: {
    sizeAcres: 2,
    soilType: 'Loamy',
    waterAvailability: 'Good',
    previousCrops: ['Maize', 'Beans'],
    minLeasePeriod: 3,    // months
    maxLeasePeriod: 6,
    preferredCrops: ['Maize', 'Wheat']
  }
};

// Create product listing
const productListing = {
  title: '50kg Fertilizer Bags',
  category: 'product',
  type: 'sell',
  price: 2000,
  priceType: 'per-unit',
  quantity: 100,
  unit: 'bags',
  contact: '+254701234567',
  location: {
    country: 'KE',
    region: 'Kisumu'
  },
  productDetails: {
    category: 'inputs',
    subcategory: 'fertilizer',
    qualityGrade: 'Premium',
    certifications: ['KEBS', 'ISO9001']
  }
};

// Create service listing
const serviceListing = {
  title: 'Farm Preparation & Plowing',
  category: 'service',
  type: 'hire',
  price: 1500,
  priceType: 'per-acre',
  contact: '+254701234567',
  location: {
    country: 'KE',
    region: 'Nairobi'
  },
  serviceDetails: {
    serviceType: 'Farm Preparation',
    availability: 'seasonal',
    yearsOfExperience: 10,
    certifications: ['Tractor Operation'],
    serviceArea: ['Nairobi', 'Kiambu']
  }
};
```

### Handling Errors Properly

```typescript
import { ErrorService, ErrorCode } from '../services/ErrorService';

// Validate required fields
const missingField = ErrorService.validateRequired(data, ['title', 'price', 'contact']);
if (missingField) {
  throw ErrorService.createError(
    ErrorCode.MISSING_REQUIRED_FIELD,
    400,
    { field: missingField }
  );
}

// Validate phone number
if (!ErrorService.validatePhoneByCountry(phone, country)) {
  throw ErrorService.createError(
    ErrorCode.INVALID_PHONE,
    400,
    { phone, country }
  );
}

// Validate email
if (!ErrorService.validateEmail(email)) {
  throw ErrorService.createError(
    ErrorCode.INVALID_EMAIL,
    400
  );
}

// Create custom error
if (listing.owner !== userId) {
  throw ErrorService.createError(
    ErrorCode.LISTING_SELLER_MISMATCH,
    403,
    { listingId, userId, owner: listing.owner }
  );
}

// Handle with automatic Sentry tracking
ErrorService.handleError(error, {
  action: 'create_listing',
  userId: req.userId,
  region: 'Nairobi',
  category: 'land'
});
```

### Querying the Database

```typescript
import Listing from '../models/Listing';

// Find listings in a region
const listings = await Listing.find({
  'location.country': 'KE',
  'location.region': 'Nairobi',
  status: 'active',
  isPublished: true
});

// Search by text
const results = await Listing.find({
  $text: { $search: 'fertile land' }
});

// Filter by trust score
const trustworthy = await Listing.find({
  ownerTrustScore: { $gte: 70 },
  isPublished: true
}).sort({ ownerTrustScore: -1 });

// Get user's listings
const myListings = await Listing.find({
  owner: userId,
  status: { $in: ['draft', 'active', 'sold'] }
});

// Pagination
const page = 1;
const limit = 20;
const listings = await Listing.find({ isPublished: true })
  .skip((page - 1) * limit)
  .limit(limit)
  .sort('-createdAt');

// With owner details
const listings = await Listing.find({ isPublished: true })
  .populate('owner', 'name trustScore email phone');
```

---

## For Frontend Developers

### Using the Services

```typescript
import ListingService from '../services/ListingService';
import GeoService from '../services/GeoService';

// Get available regions
const regions = await GeoService.getRegions('KE');
// Returns: [{ code: 1, name: 'MOMBASA', label: 'Mombasa', ... }, ...]

// Validate phone before submission
const isValid = await GeoService.validatePhone('+254701234567', 'KE');
if (!isValid.valid) {
  console.log(isValid.message);  // 'Invalid phone format for KE'
}

// Create a listing
const listing = await ListingService.createListing({
  title: 'Fertile land available',
  description: 'Perfect for farming',
  category: 'land',
  type: 'rental',
  price: 15000,
  priceType: 'per-season',
  contact: '+254701234567',
  location: {
    country: 'KE',
    region: 'Nairobi',
    subRegion: 'Dagoretti North'
  },
  landDetails: {
    sizeAcres: 2,
    soilType: 'Loamy'
  }
});

// Search listings
const results = await ListingService.searchListings({
  category: 'land',
  country: 'KE',
  region: 'Nairobi',
  minPrice: 5000,
  maxPrice: 30000,
  search: 'fertile',
  page: 1,
  limit: 20
});

// Get single listing
const listing = await ListingService.getListing(listingId);

// Update listing
await ListingService.updateListing(listingId, {
  title: 'Updated title',
  price: 20000
});

// Publish draft listing
await ListingService.publishListing(listingId);

// Get my listings
const myListings = await ListingService.getMyListings();

// Search by category
const landListings = await ListingService.getByCategory('land', 'KE');

// Search by region
const nairobiListings = await ListingService.getByRegion('Nairobi', 'KE');
```

### Creating a Listing Form

```typescript
import React, { useState, useEffect } from 'react';
import ListingService from '../services/ListingService';
import GeoService from '../services/GeoService';

export const CreateListingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'land',
    type: 'rental',
    price: '',
    priceType: 'per-season',
    contact: '',
    location: {
      country: 'KE',
      region: '',
      subRegion: ''
    }
  });

  const [regions, setRegions] = useState([]);

  useEffect(() => {
    // Load regions for dropdown
    const loadRegions = async () => {
      const data = await GeoService.getRegionsForDropdown('KE');
      setRegions(data);
    };
    loadRegions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate phone
      const phoneValid = await GeoService.validatePhone(
        formData.contact,
        formData.location.country
      );
      
      if (!phoneValid.valid) {
        alert(phoneValid.message);
        return;
      }

      // Create listing
      const listing = await ListingService.createListing({
        ...formData,
        price: Number(formData.price)
      });

      alert('Listing created! Draft saved.');
      // Navigate to listing or show success
    } catch (error: any) {
      console.error('Error creating listing:', error);
      alert(error.response?.data?.error?.message || 'Failed to create listing');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      >
        <option value="land">Land</option>
        <option value="product">Product</option>
        <option value="service">Service</option>
        <option value="agrovet">Agrovet</option>
        <option value="equipment">Equipment</option>
      </select>

      <select
        value={formData.location.region}
        onChange={(e) =>
          setFormData({
            ...formData,
            location: { ...formData.location, region: e.target.value }
          })
        }
        required
      >
        <option value="">Select Region</option>
        {regions.map((region) => (
          <option key={region.code} value={region.label}>
            {region.label}
          </option>
        ))}
      </select>

      <input
        type="tel"
        placeholder="+254701234567"
        value={formData.contact}
        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
        required
      />

      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        required
      />

      <button type="submit">Create Listing</button>
    </form>
  );
};
```

---

## Testing

### Backend Test
```bash
# Test creating a listing
curl -X POST http://localhost:5000/api/unified-listings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test land",
    "description": "Testing",
    "category": "land",
    "type": "rental",
    "price": 10000,
    "contact": "+254701234567",
    "location": {
      "country": "KE",
      "region": "Nairobi"
    }
  }'

# Test search
curl http://localhost:5000/api/unified-listings?category=land&region=Nairobi

# Test geo API
curl http://localhost:5000/api/geo/counties?country=KE
```

### Frontend Test
```typescript
// In browser console
import ListingService from './services/ListingService';

// Create test listing
await ListingService.createListing({
  title: 'Test',
  description: 'Test',
  category: 'land',
  type: 'rental',
  price: 10000,
  contact: '+254701234567',
  location: { country: 'KE', region: 'Nairobi' }
});

// Search
await ListingService.searchListings({ category: 'land' });
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Missing required field" | Check all required fields: title, description, category, type, price, contact, location |
| "Invalid phone format" | Phone must be in format: +254XXXXXXXXX (Kenya), +256XXXXXXXXX (Uganda), +250XXXXXXXXX (Rwanda) |
| "Location not found" | Use /api/geo/counties to get valid region names |
| "Unauthorized" | Include Authorization header: `Authorization: Bearer YOUR_TOKEN` |
| "Listing not found" | Make sure listing is published (isPublished: true) and status is 'active' |

---

**Documentation:** See IMPLEMENTATION_GUIDE.md for full details
