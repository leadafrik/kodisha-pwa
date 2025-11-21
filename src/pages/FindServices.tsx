import React, { useMemo, useState } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { Link } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties"; // 🔁 adjust path if needed

type ServiceType = "equipment" | "agrovet" | "professional_services";

interface ServiceListing {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  services: string[];
  verified?: boolean;
  contact: string;
  location: {
    county: string;
    constituency?: string;
    ward?: string;
  };
}

const PAGE_SIZE = 9;

const FindServices: React.FC = () => {
  const { serviceListings } = useProperties();

  const [filters, setFilters] = useState<{
    type: ServiceType | "";
    county: string;
    service: string;
    search: string;
  }>({
    type: "",
    county: "",
    service: "",
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      type: "",
      county: "",
      service: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const typeLabels: Record<ServiceType, string> = {
    equipment: "🚜 Equipment",
    agrovet: "🏪 Agrovet",
    professional_services: "👨‍💼 Professional Services",
  };

  const typeDescriptions: Record<ServiceType, string> = {
    equipment: "Find tractors, ploughs, and farm machinery for hire",
    agrovet: "Discover farm inputs, seeds, and animal health products",
    professional_services: "Connect with surveyors, agents, and consultants",
  };

  const allServices: string[] = useMemo(
    () =>
      Array.from(
        new Set(
          serviceListings.flatMap((s: any) => s.services || [])
        )
      ),
    [serviceListings]
  );

  const filteredServices: ServiceListing[] = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const selectedService = filters.service.trim().toLowerCase();
    const selectedCounty = filters.county.trim().toLowerCase();

    return serviceListings.filter((raw: any) => {
      const service: ServiceListing = raw;

      // Filter by type
      if (filters.type && service.type !== filters.type) return false;

      // Filter by county (simple substring match)
      if (
        selectedCounty &&
        !service.location.county.toLowerCase().includes(selectedCounty)
      ) {
        return false;
      }

      // Filter by service tag
      if (selectedService) {
        const matchesTag = (service.services || []).some((s) =>
          s.toLowerCase().includes(selectedService)
        );
        if (!matchesTag) return false;
      }

      // Keyword search across name, description, services, county, constituency, ward
      if (searchTerm) {
        const haystack = [
          service.name,
          service.description,
          service.location.county,
          service.location.constituency,
          service.location.ward,
          ...(service.services || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchTerm)) return false;
      }

      return true;
    });
  }, [serviceListings, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / PAGE_SIZE)
  );
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 rounded-2xl px-6 py-8 md:px-10 md:py-10 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 md:max-w-xl">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Find Equipment & Farm Services Across Kenya
            </h1>
            <p className="text-green-50 text-sm md:text-base">
              Connect with trusted equipment owners, agrovets, and
              professionals to power your farm — from land preparation to
              harvest.
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 w-full md:max-w-md">
            <label className="block text-xs font-semibold text-green-100 mb-1">
              Quick search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search services, equipment, providers or locations"
              className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <p className="mt-2 text-[11px] text-green-100">
              Try “tractor hire in Nakuru” or “surveyor” or “agrovet”.
            </p>
          </div>
        </div>
      </div>

      {/* Service Type Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {(["equipment", "agrovet", "professional_services"] as const).map(
          (type) => {
            const active = filters.type === type;
            const count = serviceListings.filter(
              (s: any) => s.type === type
            ).length;

            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    type: prev.type === type ? "" : type,
                  }))
                }
                className={`text-left rounded-xl border-2 p-5 shadow-sm transition-all duration-200 ${
                  active
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-100 bg-white hover:border-emerald-400 hover:shadow-md"
                }`}
              >
                <div className="text-3xl mb-3">
                  {type === "equipment" && "🚜"}
                  {type === "agrovet" && "🏪"}
                  {type === "professional_services" && "👨‍💼"}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {typeLabels[type]}
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  {typeDescriptions[type]}
                </p>
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-flex px-3 py-1 rounded-full">
                  {count} listing{count === 1 ? "" : "s"} available
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* Filters */}
      <div
        id="filters"
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800">
            Filter services
          </h2>
          <button
            onClick={resetFilters}
            className="self-start md:self-auto text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type filter */}
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Types</option>
            <option value="equipment">🚜 Equipment</option>
            <option value="agrovet">🏪 Agrovet</option>
            <option value="professional_services">👨‍💼 Professional Services</option>
          </select>

          {/* County filter */}
          <select
            name="county"
            value={filters.county}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Counties</option>
            {[...kenyaCounties]
             .sort((a, b) => a.name.localeCompare(b.name))
             .map((county) => (
               <option key={county.code} value={county.name.toLowerCase()}>
                 {county.name}
              </option>
            ))}
          </select>

          {/* Service tag filter */}
          <select
            name="service"
            value={filters.service}
            onChange={handleFilterChange}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Services</option>
            {allServices.map((service) => (
              <option key={service} value={service}>
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </option>
            ))}
          </select>

          {/* Results count */}
          <div className="flex items-center justify-between md:justify-end text-xs text-gray-500">
            <span>
              {filteredServices.length} listing
              {filteredServices.length === 1 ? "" : "s"} found
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-dashed border-emerald-200">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              No services found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try adjusting your filters or be the first to list a service in
              this area.
            </p>
            <Link
              to="/list-service"
              className="inline-flex items-center bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              List your service
            </Link>
          </div>
        ) : (
          <>
            {/* Cards grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedServices.map((service: any) => (
                <div
                  key={service.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col"
                >
                  {/* Type header */}
                  <div
                    className={`px-4 py-2 text-xs font-semibold text-white ${
                      service.type === "equipment"
                        ? "bg-blue-500"
                        : service.type === "agrovet"
                        ? "bg-green-600"
                        : "bg-purple-600"
                    }`}
                  >
                    {typeLabels[service.type as ServiceType]}
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    {/* Title + verified */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {service.name}
                      </h3>
                      {service.verified && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          ✅ <span>Verified</span>
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {service.description}
                    </p>

                    {/* Services tags */}
                    <div className="flex flex-wrap gap-1">
                      {(service.services || []).slice(0, 3).map(
                        (s: string, idx: number) => (
                          <span
                            key={`${s}-${idx}`}
                            className="bg-gray-100 text-gray-700 text-[11px] px-2 py-1 rounded-full"
                          >
                            {s}
                          </span>
                        )
                      )}
                      {service.services &&
                        service.services.length > 3 && (
                          <span className="bg-gray-50 text-gray-500 text-[11px] px-2 py-1 rounded-full">
                            +{service.services.length - 3} more
                          </span>
                        )}
                    </div>

                    {/* Location */}
                    <div className="text-[11px] text-gray-600 space-y-0.5">
                      <p>
                        📍{" "}
                        {service.location.county &&
                          (service.location.county.charAt(0).toUpperCase() +
                            service.location.county.slice(1))}{" "}
                        County
                      </p>
                      {(service.location.constituency ||
                        service.location.ward) && (
                        <p>
                          🏠 {service.location.constituency}
                          {service.location.constituency && service.location.ward
                            ? ", "
                            : ""}
                          {service.location.ward}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">
                        📞 {service.contact}
                      </span>
                      <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    currentPage === 1
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs border ${
                    currentPage === totalPages
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-8 text-center text-white shadow-md">
        <h2 className="text-2xl font-bold mb-3">
          Have Equipment or Services to Offer?
        </h2>
        <p className="text-sm md:text-base text-emerald-50 mb-5 max-w-2xl mx-auto">
          Join other service providers connecting with farmers across Kenya.
          List your tractor, agrovet, or professional services and start
          getting bookings through Kodisha.
        </p>
        <Link
          to="/list-service"
          className="inline-flex items-center bg-white text-emerald-700 px-7 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-colors"
        >
          List Your Service
        </Link>
      </div>
    </div>
  );
};

export default FindServices;
