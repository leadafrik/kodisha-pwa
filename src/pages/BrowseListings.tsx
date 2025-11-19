import React, { useState } from 'react';
import { useProperties } from '../contexts/PropertyContext';

const BrowseListings: React.FC = () => {
  const { getPropertiesByCounty } = useProperties(); // Remove unused 'properties'
  const [filters, setFilters] = useState({
    county: '',
    priceRange: '',
    sizeRange: '',
    type: ''
  });

  // All 47 Kenyan Counties
  const kenyanCounties = [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
    'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
    'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
    'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
    'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
    'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
    'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
    'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
    'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
    'Vihiga', 'Wajir', 'West Pokot'
  ];

  const filteredProperties = getPropertiesByCounty(filters.county).filter(property => {
    if (filters.type && property.type !== filters.type) return false;
    
    // Price range filtering
    if (filters.priceRange) {
      const price = property.price;
      switch (filters.priceRange) {
        case '0-5000':
          if (price > 5000) return false;
          break;
        case '5000-20000':
          if (price < 5000 || price > 20000) return false;
          break;
        case '20000-50000':
          if (price < 20000 || price > 50000) return false;
          break;
        case '50000-100000':
          if (price < 50000 || price > 100000) return false;
          break;
        case '100000-500000':
          if (price < 100000 || price > 500000) return false;
          break;
        case '500000+':
          if (price < 500000) return false;
          break;
        default:
          break;
      }
    }
    
    return true;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      county: '',
      priceRange: '',
      sizeRange: '',
      type: ''
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatSize = (size: number, unit: 'acres' | 'hectares' = 'acres') => {
    return `${size} ${unit}`;
  };

  // ✅ IMPROVED LOCATION FORMATTING
  const formatLocation = (property: any) => {
    if (property.location) {
      const { county, constituency, ward, approximateLocation } = property.location;
      return `${approximateLocation}, ${ward}, ${constituency}, ${county}`;
    }
    
    // Fallback for old property structure
    if (property.county) {
      const countyName = property.county.charAt(0).toUpperCase() + property.county.slice(1);
      return `${countyName} County${property.constituency ? `, ${property.constituency}` : ''}`;
    }
    
    return 'Location not specified';
  };

  // ✅ GET FIRST IMAGE OR PLACEHOLDER
  const getPropertyImage = (property: any) => {
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Farmland Listings</h1>
        <p className="text-gray-600">Discover verified agricultural land across Kenya</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            name="county" 
            value={filters.county} 
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Counties</option>
            {kenyanCounties.map(county => (
              <option key={county} value={county.toLowerCase()}>
                {county}
              </option>
            ))}
          </select>
          
          <select 
            name="type" 
            value={filters.type} 
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="sale">For Sale</option>
            <option value="rental">For Rent/Lease</option>
          </select>
          
          <select 
            name="priceRange" 
            value={filters.priceRange} 
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Any Price</option>
            <option value="0-5000">Under KSh 5K</option>
            <option value="5000-20000">KSh 5K - 20K</option>
            <option value="20000-50000">KSh 20K - 50K</option>
            <option value="50000-100000">KSh 50K - 100k</option>
            <option value="100000-500000">KSh 100k - 500k</option>
            <option value="500000+">Over KSh 500k</option>
          </select>

          <select 
            name="sizeRange" 
            value={filters.sizeRange} 
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Any Size</option>
            <option value="0-1">Under 1 acre</option>
            <option value="1-5">1 - 5 acres</option>
            <option value="5-10">5 - 10 acres</option>
            <option value="10-20">10 - 20 acres</option>
            <option value="20+">Over 20 acres</option>
          </select>
          
          <div className="flex gap-2">
            <button 
              onClick={clearFilters}
              className="flex-1 bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600 transition duration-300"
            >
              Clear
            </button>
            <button className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition duration-300">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredProperties.length}</span> 
          {filteredProperties.length === 1 ? ' listing' : ' listings'}
          {filters.county && ` in ${filters.county.charAt(0).toUpperCase() + filters.county.slice(1)}`}
        </p>
      </div>

      {/* Listings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300 border border-gray-100">
            {/* Image Section */}
            <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center relative">
              {getPropertyImage(property) ? (
                <img 
                  src={getPropertyImage(property)} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🌱</div>
                  <span className="text-lg font-semibold">Farmland Photo</span>
                </div>
              )}
              
              {/* ✅ FIXED: Use 'verified' instead of 'isVerified' */}
              {property.verified && (
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                  <span>✅</span>
                  <span>Verified</span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-800 flex-1 pr-2">{property.title}</h3>
                {property.verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0">
                    ✅ Verified
                  </span>
                )}
              </div>

              <p className="text-2xl font-bold text-green-600 mb-3">
                {formatPrice(property.price)}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  {property.type === 'rental' ? '/year' : ''}
                </span>
              </p>

              <div className="text-gray-600 space-y-2 mb-4">
                <div className="flex items-start">
                  <span className="mr-2">📍</span>
                  <span className="text-sm">{formatLocation(property)}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📏</span>
                  <span className="text-sm">{formatSize(property.size, property.sizeUnit)}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🏷️</span>
                  <span className="text-sm">
                    {property.type === 'sale' ? 'For Sale' : 'For Rent/Lease'}
                    {property.organicCertified && ' • 🌿 Organic'}
                  </span>
                </div>
                {property.contact && (
                  <div className="flex items-center">
                    <span className="mr-2">📞</span>
                    <span className="text-sm">{property.contact}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{property.description}</p>

              <div className="flex gap-2">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300 font-medium">
                  View Details
                </button>
                <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition duration-300">
                  💬
                </button>
              </div>

              {/* Additional Info */}
              {(property.soilType || property.waterAvailability) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {property.soilType && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        Soil: {property.soilType}
                      </span>
                    )}
                    {property.waterAvailability && (
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        Water: {property.waterAvailability}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or browse all counties</p>
          <button 
            onClick={clearFilters}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Show All Listings
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseListings;