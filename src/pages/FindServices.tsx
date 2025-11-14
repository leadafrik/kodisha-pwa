import React, { useState } from 'react';
import { useProperties } from '../contexts/PropertyContext';
import { Link } from 'react-router-dom';

const FindServices: React.FC = () => {
  const { serviceListings, getServicesByType } = useProperties();
  const [filters, setFilters] = useState({
    type: '' as 'equipment' | 'agrovet' | 'professional_services' | '',
    county: '',
    service: ''
  });

  const filteredServices = serviceListings.filter((service: any) => {
    if (filters.type && service.type !== filters.type) return false;
    if (filters.county && !service.location.county.toLowerCase().includes(filters.county.toLowerCase())) return false;
    if (filters.service && !service.services.some((s: string) => s.toLowerCase().includes(filters.service.toLowerCase()))) return false;
    return true;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const typeLabels = {
    equipment: '🚜 Equipment',
    agrovet: '🏪 Agrovet',
    professional_services: '👨‍💼 Professional Services'
  };

  const typeDescriptions = {
    equipment: 'Find tractors, ploughs, and farm machinery for hire',
    agrovet: 'Discover farm inputs, seeds, and animal health products',
    professional_services: 'Connect with surveyors, agents, and consultants'
  };

  const allServices = Array.from(new Set(serviceListings.flatMap((s: any) => s.services)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Find Equipment & Services
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Connect with trusted equipment providers, agrovets, and professional services across Kenya
        </p>
      </div>

      {/* Service Type Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {(['equipment', 'agrovet', 'professional_services'] as const).map(type => (
          <Link
            key={type}
            to="#filters"
            onClick={() => setFilters({ ...filters, type })}
            className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition duration-300 border-2 border-transparent hover:border-green-500"
          >
            <div className="text-4xl mb-4">
              {type === 'equipment' && '🚜'}
              {type === 'agrovet' && '🏪'}
              {type === 'professional_services' && '👨‍💼'}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {typeLabels[type]}
            </h3>
            <p className="text-gray-600 text-sm">
              {typeDescriptions[type]}
            </p>
            <div className="mt-4 text-green-600 font-semibold">
              {serviceListings.filter((s: any) => s.type === type).length} Listings
            </div>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div id="filters" className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Find Specific Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Types</option>
            <option value="equipment">🚜 Equipment</option>
            <option value="agrovet">🏪 Agrovet</option>
            <option value="professional_services">👨‍💼 Professional Services</option>
          </select>

          <select
            name="county"
            value={filters.county}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Counties</option>
            <option value="nairobi">Nairobi</option>
            <option value="kiambu">Kiambu</option>
            <option value="nakuru">Nakuru</option>
            <option value="mombasa">Mombasa</option>
            <option value="kisumu">Kisumu</option>
          </select>

          <select
            name="service"
            value={filters.service}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Services</option>
            {allServices.map((service: any) => (
              <option key={service} value={service}>
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ type: '', county: '', service: '' })}
            className="bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600 transition duration-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Available Services
          </h2>
          <span className="text-gray-600">
            {filteredServices.length} {filteredServices.length === 1 ? 'listing' : 'listings'} found
          </span>
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No services found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or list a new service</p>
            <Link
              to="/list-service"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
            >
              List Your Service
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service: any) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-100">
                {/* Header with type badge */}
                <div className={`px-4 py-2 text-white font-semibold ${
                  service.type === 'equipment' ? 'bg-blue-500' :
                  service.type === 'agrovet' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}>
                  {typeLabels[service.type as keyof typeof typeLabels]}
                </div>

                <div className="p-6">
                  {/* Name and verification */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{service.name}</h3>
                    {service.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                        ✅ Verified
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                  {/* Services */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {service.services.slice(0, 3).map((serviceItem: string, index: number) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {serviceItem}
                        </span>
                      ))}
                      {service.services.length > 3 && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                          +{service.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="text-gray-600 text-sm mb-4">
                    <p>📍 {service.location.county.charAt(0).toUpperCase() + service.location.county.slice(1)} County</p>
                    <p>🏠 {service.location.constituency}, {service.location.ward}</p>
                  </div>

                  {/* Contact */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">📞 {service.contact}</span>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 text-sm">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Have Equipment or Services to Offer?</h2>
        <p className="text-green-100 mb-6 max-w-2xl mx-auto">
          Join hundreds of service providers connecting with farmers across Kenya. List your equipment, agrovet, or professional services today.
        </p>
        <Link
          to="/list-service"
          className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-50 transition duration-300 inline-block"
        >
          List Your Service
        </Link>
      </div>
    </div>
  );
};

export default FindServices;