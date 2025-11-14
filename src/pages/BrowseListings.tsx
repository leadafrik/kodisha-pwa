import React, { useState } from 'react';
import { useProperties } from '../contexts/PropertyContext';

const BrowseListings: React.FC = () => {
  const { properties, getPropertiesByCounty } = useProperties();
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
        case '0-50000':
          if (price > 50000) return false;
          break;
        case '50000-200000':
          if (price < 50000 || price > 200000) return false;
          break;
        case '200000-500000':
          if (price < 200000 || price > 500000) return false;
          break;
        case '500000-1000000':
          if (price < 500000 || price > 1000000) return false;
          break;
        case '1000000-5000000':
          if (price < 1000000 || price > 5000000) return false;
          break;
        case '5000000+':
          if (price < 5000000) return false;
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatSize = (size: number, unit: 'acres' | 'hectares') => {
    return `${size} ${unit}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Browse Land Listings</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select 
            name="county" 
            value={filters.county} 
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2"
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
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="sale">For Sale</option>
            <option value="rental">For Rent/Lease</option>
          </select>
          
          <select 
            name="priceRange" 
            value={filters.priceRange} 
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Price Range</option>
            <option value="0-5000">Under KSh 5K</option>
            <option value="5000-20000">KSh 5K - 20K</option>
            <option value="20000-50000">KSh 20K - 50K</option>
            <option value="50000-100000">KSh 50K - 100k</option>
            <option value="100000-500000">KSh 100k - 500k</option>
            <option value="500000+">Over KSh 500k</option>
          </select>
          
          <button className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition duration-300">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
            <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center relative">
              <span className="text-white text-lg font-semibold">Land Photo</span>
              {property.verified && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ✅ Verified
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{property.title}</h3>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {formatPrice(property.price)}
                <span className="text-sm font-normal text-gray-600 ml-2">
                  {property.type === 'rental' ? '/year' : ''}
                </span>
              </p>
              <div className="text-gray-600 space-y-1 mb-3">
                <p>📍 {property.county.charAt(0).toUpperCase() + property.county.slice(1)} County{property.constituency && `, ${property.constituency}`}</p>
                <p>📏 {formatSize(property.size, property.sizeUnit)}</p>
                <p>🏷️ {property.type === 'sale' ? 'For Sale' : 'For Rent/Lease'}</p>
                <p className="text-sm">📞 {property.contact}</p>
              </div>
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{property.description}</p>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No properties found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default BrowseListings;