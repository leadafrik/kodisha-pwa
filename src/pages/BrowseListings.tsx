import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties } from "../data/kenyaCounties";
import { Search, Filter } from "lucide-react";

type Category = "all" | "produce" | "livestock" | "inputs" | "service";
type ServiceSubType = "all" | "equipment" | "professional_services";

type UnifiedCard = {
  id: string;
  category: Category;
  subCategory?: string;
  title: string;
  description: string;
  county: string;
  locationLabel: string;
  priceLabel?: string;
  sizeLabel?: string;
  typeLabel: string;
  verified: boolean;
  paid: boolean;
  boosted: boolean;
  isDemo?: boolean;
  ownerId?: string;
  contact?: string;
  createdAt?: Date;
  image?: string;
};

const formatPrice = (value?: number) =>
  typeof value === "number"
    ? `KSh ${value.toLocaleString()}`
    : undefined;

const buildLocation = (loc: any) =>
  [loc?.ward, loc?.constituency, loc?.county, loc?.approximateLocation]
    .filter(Boolean)
    .join(", ");

const getScore = (item: UnifiedCard) =>
  (item.boosted ? 3 : 0) + (item.paid ? 2 : 0) + (item.verified ? 1 : 0);

const BrowseListings: React.FC = () => {
  const { properties, serviceListings, productListings, loading } = useProperties();
  const { user } = useAuth();

  const [category, setCategory] = useState<Category>("all");
  const [serviceSub, setServiceSub] = useState<ServiceSubType>("all");
  const [county, setCounty] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const cards = useMemo<UnifiedCard[]>(() => {
    // Product listings: Produce, Livestock, Inputs
    const productCards =
      (productListings as any[])?.map((p: any) => {
        const boostFlag = p.monetization?.premiumBadge;
        const paidFlag = p.payment?.paymentStatus === "paid" || p.monetization?.subscriptionActive;
        const verifiedFlag = !!p.isVerified;
        
        let categoryLabel: Category = "produce";
        let typeLabel = "Produce";
        if (p.category === "livestock") {
          categoryLabel = "livestock";
          typeLabel = "Livestock";
        } else if (p.category === "inputs") {
          categoryLabel = "inputs";
          typeLabel = "Farm Inputs";
        }
        
        return {
          id: p._id || p.id,
          category: categoryLabel,
          subCategory: p.subcategory,
          title: p.title,
          description: p.description,
          county: p.location?.county || "",
          locationLabel: buildLocation(p.location || {}),
          priceLabel: formatPrice(p.price),
          typeLabel,
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          isDemo: !!p.isDemo,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          image: p.images?.[0],
          ownerId: p.owner?._id || p.ownerId || p.owner,
          contact: p.contact || p.owner?.phone || p.owner?.email,
        } as UnifiedCard;
      }) || [];

    // Service listings
    const serviceCards =
      (serviceListings as any[])?.map((s: any) => {
        const status = s.publishStatus || s.status;
        if (status === "rejected" || status === "draft") return null;
        const boostFlag =
          s.monetization?.boostOption &&
          s.monetization?.boostOption !== "none";
        const paidFlag = s.payment?.paymentStatus === "paid";
        const verifiedFlag = !!s.isVerified || !!s.verified;
        const locationLabel = buildLocation(s.location || {});
        return {
          id: s._id || s.id,
          category: "service" as Category,
          subCategory: s.type,
          title: s.name,
          description: s.description,
          county: s.location?.county || "",
          locationLabel,
          typeLabel: s.type === "equipment"
            ? "Equipment Hire"
            : "Professional Service",
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
          image: s.images?.[0],
          ownerId: s.owner?._id || s.ownerId || s.owner,
          contact: s.contact || s.owner?.phone || s.owner?.email,
        } as UnifiedCard;
      }) || [];

    return [...productCards, ...serviceCards].filter(
      (c): c is UnifiedCard => !!c && !!c.id
    );
  }, [productListings, serviceListings]);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return cards
      .filter((card) => {
        if (category !== "all" && card.category !== category) return false;
        if (
          category === "service" &&
          serviceSub !== "all" &&
          card.subCategory !== serviceSub
        )
          return false;
        if (county && card.county.toLowerCase() !== county.toLowerCase())
          return false;
        if (searchTerm) {
          const haystack = `${card.title} ${card.description} ${card.locationLabel}`.toLowerCase();
          if (!haystack.includes(searchTerm)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }, [cards, category, serviceSub, county, search]);

  const categoryPills: Array<{ id: Category; label: string; icon?: string }> = [
    { id: "all", label: "All" },
    { id: "produce", label: "Produce" },
    { id: "livestock", label: "Livestock" },
    { id: "inputs", label: "Farm Inputs" },
    { id: "service", label: "Services" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {!user && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-700">
              Sign in to view details and contact sellers
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1">
              Marketplace
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Browse & Buy
            </h1>
            <p className="text-gray-700 text-base font-medium max-w-2xl">
              Discover fresh produce, livestock, farm inputs, and professional agricultural services. Direct connections with verified sellers across Kenya.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, location, or description…"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categoryPills.map((pill) => {
          const active = category === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                setCategory(pill.id);
                setServiceSub("all");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                active
                  ? "border-green-600 bg-green-600 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">
              County
            </label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="">All counties</option>
              {[...kenyaCounties]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.code} value={c.name.toLowerCase()}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {category === "service" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Service type
              </label>
              <select
                value={serviceSub}
                onChange={(e) =>
                  setServiceSub(e.target.value as ServiceSubType)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="all">All services</option>
                <option value="equipment">Equipment Hire</option>
                <option value="professional_services">Professional Services</option>
              </select>
            </div>
          )}
          
          {(county || search) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCounty("");
                  setSearch("");
                  setCategory("all");
                  setServiceSub("all");
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-white rounded-xl p-4 border border-gray-100">
        <span className="font-semibold">
          {filtered.length} listing{filtered.length === 1 ? "" : "s"} found
        </span>
        <span className="text-xs text-gray-500">
          Verified & boosted listings shown first
        </span>
      </div>

      {loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600 mb-3"></div>
          <p className="text-gray-600">Loading listings…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-dashed border-gray-300">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            No listings found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {search ? "Try a different search term or remove filters." : "Try adjusting your filters or browsing other categories."}
          </p>
          <button
            onClick={() => {
              setCategory("all");
              setServiceSub("all");
              setCounty("");
              setSearch("");
            }}
            className="inline-flex px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-md"
          >
            Browse all listings
          </button>
        </div>
      )}

      {/* Listings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((card) => {
          const categoryColors: Record<Category, string> = {
            all: "bg-gray-50 text-gray-700",
            produce: "bg-orange-50 text-orange-700",
            livestock: "bg-red-50 text-red-700",
            inputs: "bg-blue-50 text-blue-700",
            service: "bg-purple-50 text-purple-700",
          };
          const badgeColor = categoryColors[card.category] || categoryColors.produce;

          return (
            <div
              key={card.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
            >
              {/* Image Section */}
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm font-medium">
                    <div className="text-gray-300">No image</div>
                  </div>
                )}
                
                {/* Status Badges */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-2 flex-wrap max-w-[calc(100%-1.5rem)]">
                  {card.isDemo && (
                    <span className="rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 whitespace-nowrap">
                      Sample Listing
                    </span>
                  )}
                  {card.boosted && (
                    <span className="rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2.5 py-1 whitespace-nowrap">
                      ⭐ Boosted
                    </span>
                  )}
                  {card.verified && (
                    <span className="rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1 whitespace-nowrap">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Category Badge & Price */}
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${badgeColor}`}>
                    {card.typeLabel}
                  </span>
                  {card.priceLabel && (
                    <span className="text-base font-bold text-green-700 whitespace-nowrap">
                      {card.priceLabel}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {card.description || "No description provided."}
                </p>

                {/* Location */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">
                    📍 {card.locationLabel || "Location pending"}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="mt-3 flex gap-2">
                  <Link
                    to={user ? `/listings/${card.id}` : "/login"}
                    className="flex-1 text-center rounded-lg bg-green-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-green-700 transition shadow-sm"
                  >
                    View details
                  </Link>
                  {card.contact && (
                    user ? (
                      <a
                        href={`tel:${card.contact}`}
                        className="flex-1 text-center rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Call
                      </a>
                    ) : (
                      <Link
                        to="/login"
                        className="flex-1 text-center rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Call
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state placeholder */}
      {!loading && filtered.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Showing {filtered.length} of {cards.length} listings
        </div>
      )}

      {/* Alternative Action - For Sellers */}
      <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Looking to Sell Instead?</h3>
          <p className="text-gray-600 mb-6">
            Find buyers actively looking for what you offer. Browse buy requests from customers across Kenya who need your products or services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/request"
              className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              View Buy Requests
            </Link>
            <Link
              to={user ? "/create-listing" : "/login?next=/create-listing"}
              className="inline-flex justify-center items-center px-6 py-3 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition"
            >
              Post Your Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseListings;
