import React, { useMemo, useState } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { kenyaCounties } from "../data/kenyaCounties";

type Category = "all" | "land" | "service" | "agrovet" | "product";
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

  const [category, setCategory] = useState<Category>("all");
  const [serviceSub, setServiceSub] = useState<ServiceSubType>("all");
  const [county, setCounty] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const cards = useMemo<UnifiedCard[]>(() => {
    const landCards =
      properties?.map((p: any) => {
        const status = p.status;
        if (status === "rejected" || status === "archived") return null;
        if (p.type === "sale") return null; // temporarily hide sale listings
        const boostFlag =
          p.isFeatured ||
          (p.monetization?.boostOption &&
            p.monetization?.boostOption !== "none");
        const paidFlag = p.payment?.paymentStatus === "paid";
        const verifiedFlag = !!p.verified;
        return {
          id: p._id || p.id,
          category: "land" as Category,
          subCategory: p.type,
          title: p.title,
          description: p.description,
          county: p.location?.county || "",
          locationLabel: buildLocation(p.location || {}),
          priceLabel: formatPrice(p.price),
          sizeLabel: p.size ? `${p.size} ${p.sizeUnit || "acres"}` : undefined,
          typeLabel: "For Rent/Lease",
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          image: p.images?.[0],
          ownerId: p.owner?._id || p.owner?._id?.toString?.() || p.owner,
          contact: p.contact || p.owner?.phone || p.owner?.email,
        } as UnifiedCard;
      }) || [];

    const serviceCards =
      (serviceListings as any[])?.map((s: any) => {
        const status = s.publishStatus || s.status;
        if (status === "rejected" || status === "draft") return null;
        const isAgrovet = s.type === "agrovet";
        const boostFlag =
          s.monetization?.boostOption &&
          s.monetization?.boostOption !== "none";
        const paidFlag = s.payment?.paymentStatus === "paid";
        const verifiedFlag = !!s.isVerified || !!s.verified;
        const locationLabel = buildLocation(s.location || {});
        return {
          id: s._id || s.id,
          category: isAgrovet ? ("agrovet" as Category) : ("service" as Category),
          subCategory: s.type,
          title: s.name,
          description: s.description,
          county: s.location?.county || "",
          locationLabel,
          typeLabel: isAgrovet
            ? "Agrovet"
            : s.type === "equipment"
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

    const productCards =
      (productListings as any[])?.map((p: any) => {
        const boostFlag = p.monetization?.premiumBadge;
        const paidFlag = p.payment?.paymentStatus === "paid" || p.monetization?.subscriptionActive;
        const verifiedFlag = !!p.isVerified;
        return {
          id: p._id || p.id,
          category: "product" as Category,
          subCategory: p.category,
          title: p.title,
          description: p.description,
          county: p.location?.county || "",
          locationLabel: buildLocation(p.location || {}),
          priceLabel: formatPrice(p.price),
          typeLabel:
            p.category === "produce"
              ? "Produce"
              : p.category === "livestock"
              ? "Livestock"
              : "Farm Input",
          verified: verifiedFlag,
          paid: !!paidFlag,
          boosted: !!boostFlag,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
          image: p.images?.[0],
          ownerId: p.owner?._id || p.ownerId || p.owner,
          contact: p.contact || p.owner?.phone || p.owner?.email,
        } as UnifiedCard;
      }) || [];

    return [...landCards, ...serviceCards, ...productCards].filter(
      (c): c is UnifiedCard => !!c && !!c.id
    );
  }, [properties, serviceListings, productListings]);

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

  const categoryPills: Array<{ id: Category; label: string }> = [
    { id: "all", label: "All" },
    { id: "land", label: "Land" },
    { id: "service", label: "Services" },
    { id: "agrovet", label: "Agrovets" },
    { id: "product", label: "Products" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Marketplace
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Browse Land, Services, and Agrovets
            </h1>
            <p className="text-gray-600 text-sm">
              Filter by category, sale/rent, county, and quickly find verified/paid and boosted listings first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryPills.map((pill) => {
              const active = category === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setCategory(pill.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                    active
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-green-400"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
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

          {category === "land" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Land type
              </label>
              <div className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-700">
                Rent / Lease only (sales temporarily disabled)
              </div>
            </div>
          )}

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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, location"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filtered.length} listing{filtered.length === 1 ? "" : "s"} found
        </span>
        <span className="text-xs text-gray-500">
          Boosted, paid, and verified listings are shown first.
        </span>
      </div>

      {loading && (
        <div className="text-center text-gray-600">Loading listings…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No listings found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Try removing some filters or searching a different county.
          </p>
          <button
            onClick={() => {
              setCategory("all");
              setServiceSub("all");
              setCounty("");
              setSearch("");
            }}
            className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((card) => {
          const badgeColor =
            card.category === "land"
              ? "bg-blue-50 text-blue-700"
            : card.category === "agrovet"
            ? "bg-green-50 text-green-700"
            : card.category === "product"
            ? "bg-orange-50 text-orange-700"
            : "bg-purple-50 text-purple-700";

          return (
            <div
              key={card.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-green-200 transition"
            >
              <div className="h-40 bg-gray-100 relative">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    No image
                  </div>
                )}
                <div className="absolute top-3 left-3 inline-flex items-center gap-2">
                  {card.boosted && (
                    <span className="rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-2 py-1">
                      Boosted
                    </span>
                  )}
                  {card.verified && (
                    <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-1">
                      Verified
                    </span>
                  )}
                  {card.paid && (
                    <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-1">
                      Paid
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${badgeColor}`}>
                    {card.typeLabel}
                  </span>
                  {card.priceLabel && (
                    <span className="text-sm font-bold text-gray-900">
                      {card.priceLabel}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {card.description || "No description provided."}
                </p>
                <p className="text-xs text-gray-500">{card.locationLabel || "Location pending"}</p>
                {card.sizeLabel && (
                  <p className="text-xs text-gray-500">{card.sizeLabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrowseListings;
