import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProperties } from "../contexts/PropertyContext";
import { kenyaCounties } from "../data/kenyaCounties";

const BrowseListings: React.FC = () => {
  const navigate = useNavigate();
  const { getPropertiesByCounty } = useProperties();

  const [filters, setFilters] = useState({
    county: "",
    priceRange: "",
    sizeRange: "",
    type: "",
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      county: "",
      priceRange: "",
      sizeRange: "",
      type: "",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSize = (size: number, unit: "acres" | "hectares" = "acres") => {
    return `${size} ${unit}`;
  };

  const formatLocation = (property: any) => {
    if (property.location) {
      const { county, constituency, ward, approximateLocation } =
        property.location;

      return [approximateLocation, ward, constituency, county]
        .filter(Boolean)
        .join(", ");
    }

    if (property.county) {
      return property.county;
    }

    return "Location not specified";
  };

  const getPropertyImage = (property: any) => {
    return property.images?.length ? property.images[0] : null;
  };

  // SAFELY GET PROPERTIES WITHOUT CRASHING
  const baseProperties =
    getPropertiesByCounty(filters.county.toUpperCase()) || [];

  // FILTERED PROPERTIES
  const filteredProperties = baseProperties.filter((property: any) => {
    // Type filter
    if (filters.type && property.type !== filters.type) return false;

    // Price filter
    if (filters.priceRange) {
      const price = property.price;

      const ranges: any = {
        "0-5000": price <= 5000,
        "5000-20000": price >= 5000 && price <= 20000,
        "20000-50000": price >= 20000 && price <= 50000,
        "50000-100000": price >= 50000 && price <= 100000,
        "100000-500000": price >= 100000 && price <= 500000,
        "500000+": price >= 500000,
      };

      if (!ranges[filters.priceRange]) return false;
    }

    // Size filter
    if (filters.sizeRange) {
      let size = property.size;

      if (property.sizeUnit === "hectares") {
        size = property.size * 2.47105; // convert ha → acres
      }

      const sizes: any = {
        "0-1": size <= 1,
        "1-5": size >= 1 && size <= 5,
        "5-10": size >= 5 && size <= 10,
        "10-20": size >= 10 && size <= 20,
        "20+": size >= 20,
      };

      if (!sizes[filters.sizeRange]) return false;
    }

    return true;
  });

  const openListing = (id: string) => navigate(`/listings/${id}`);

  const openChat = (property: any) => {
    if (!property.ownerId) {
      alert("Seller information missing.");
      return;
    }
    navigate(`/chat/${property.id}/${property.ownerId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Browse Farmland Listings
        </h1>
        <p className="text-gray-600">
          Discover verified agricultural land across Kenya
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* COUNTY SELECT */}
          <select
            name="county"
            value={filters.county}
            onChange={handleFilterChange}
            className="border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Counties</option>
            {kenyaCounties.map((county: any) => (
              <option key={county.code} value={county.name}>
                {county.name.charAt(0) +
                  county.name.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* TYPE */}
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Types</option>
            <option value="sale">For Sale</option>
            <option value="rental">For Rent/Lease</option>
          </select>

          {/* PRICE */}
          <select
            name="priceRange"
            value={filters.priceRange}
            onChange={handleFilterChange}
            className="border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Any Price</option>
            <option value="0-5000">Under KSh 5K</option>
            <option value="5000-20000">KSh 5K - 20K</option>
            <option value="20000-50000">KSh 20K - 50K</option>
            <option value="50000-100000">KSh 50K - 100k</option>
            <option value="100000-500000">KSh 100k - 500k</option>
            <option value="500000+">Over KSh 500k</option>
          </select>

          {/* SIZE */}
          <select
            name="sizeRange"
            value={filters.sizeRange}
            onChange={handleFilterChange}
            className="border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Any Size</option>
            <option value="0-1">Under 1 acre</option>
            <option value="1-5">1 - 5 acres</option>
            <option value="5-10">5 - 10 acres</option>
            <option value="10-20">10 - 20 acres</option>
            <option value="20+">Over 20 acres</option>
          </select>

          {/* BUTTONS */}
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="flex-1 bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition"
            >
              Clear
            </button>
            <button className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition">
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-semibold">
            {filteredProperties.length}
          </span>{" "}
          {filteredProperties.length === 1 ? "listing" : "listings"}
          {filters.county && ` in ${filters.county}`}
        </p>
      </div>

      {/* LISTINGS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property: any) => (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition duration-300"
          >
            {/* IMAGE */}
            <div className="h-48 relative bg-gradient-to-br from-green-400 to-green-600">
              {getPropertyImage(property) ? (
                <img
                  src={getPropertyImage(property)}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <div className="text-4xl">🌱</div>
                  <p>No Image</p>
                </div>
              )}

              {property.verified && (
                <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                  ✅ Verified
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {property.title}
              </h3>

              <p className="text-2xl font-bold text-green-600 mb-3">
                {formatPrice(property.price)}
                {property.type === "rental" && (
                  <span className="text-sm text-gray-600">/year</span>
                )}
              </p>

              <div className="space-y-1 text-gray-600 text-sm mb-3">
                <p>📍 {formatLocation(property)}</p>
                <p>
                  📏 {formatSize(property.size, property.sizeUnit)}
                </p>
                <p>
                  🏷️{" "}
                  {property.type === "sale"
                    ? "For Sale"
                    : "For Rent/Lease"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openListing(property.id)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  View Details
                </button>

                <button
                  onClick={() => openChat(property)}
                  className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition"
                >
                  💬
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No listings found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting filters.
          </p>
          <button
            onClick={clearFilters}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Show All Listings
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseListings;
