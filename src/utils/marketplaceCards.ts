type MarketplaceCategory = "produce" | "livestock" | "inputs" | "service";
type MarketplaceListingType = "product" | "equipment" | "service" | "agrovet";

export interface MarketplaceCard {
  id: string;
  ownerId?: string;
  ownerName?: string;
  category: MarketplaceCategory;
  listingType: MarketplaceListingType;
  subCategory?: string;
  title: string;
  description: string;
  county: string;
  locationLabel: string;
  priceLabel?: string;
  typeLabel: string;
  verified: boolean;
  paid: boolean;
  boosted: boolean;
  createdAt?: Date;
  image?: string;
}

const HIDDEN_LISTING_STATUSES = new Set([
  "draft",
  "rejected",
  "deleted",
  "removed",
  "archived",
  "inactive",
  "delisted",
]);

const formatPrice = (value?: number) =>
  typeof value === "number" ? `KSh ${value.toLocaleString()}` : undefined;

const buildLocation = (loc: any) =>
  [loc?.ward, loc?.constituency, loc?.county, loc?.approximateLocation]
    .filter(Boolean)
    .join(", ");

const isServiceVisible = (service: any) => {
  const status = String(service.publishStatus || service.status || "").toLowerCase();
  if (status && HIDDEN_LISTING_STATUSES.has(status)) return false;
  if (service.isDeleted === true) return false;
  if (service.deletedAt) return false;
  if (service.active === false || service.isActive === false) return false;
  if (typeof service.isPublished === "boolean" && !service.isPublished) return false;
  return true;
};

const resolveProductCategory = (value?: string): MarketplaceCategory => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "livestock") return "livestock";
  if (normalized === "inputs") return "inputs";
  return "produce";
};

const resolveProductTypeLabel = (value?: string) => {
  const normalized = resolveProductCategory(value);
  if (normalized === "livestock") return "Livestock";
  if (normalized === "inputs") return "Inputs";
  return "Produce";
};

const resolveServiceCategory = (value?: string): MarketplaceCategory => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "agrovet" || normalized === "agrovets") return "inputs";
  return "service";
};

const resolveServiceTypeLabel = (value?: string) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "equipment") return "Equipment Hire";
  if (normalized === "agrovet" || normalized === "agrovets") return "Inputs";
  return "Professional Service";
};

const resolveListingType = (value?: string): MarketplaceListingType => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "equipment") return "equipment";
  if (normalized === "agrovet" || normalized === "agrovets") return "agrovet";
  return "service";
};

export const getMarketplaceCardScore = (item: MarketplaceCard) => {
  const boost = item.boosted ? 4 : 0;
  const verified = item.verified ? 2 : 0;
  const paid = item.paid ? 1 : 0;
  return boost + paid + verified;
};

export const buildMarketplaceCards = (
  productListings: any[] = [],
  serviceListings: any[] = []
): MarketplaceCard[] => {
  const productCards = productListings.map((item: any) => ({
    id: item._id || item.id,
    ownerId: item.owner?._id || item.ownerId || item.owner,
    ownerName: item.owner?.fullName || item.owner?.name || item.ownerName,
    category: resolveProductCategory(item.category),
    listingType: "product" as MarketplaceListingType,
    subCategory: item.subcategory,
    title: item.title || "Listing",
    description: item.description || "",
    county: item.location?.county || "",
    locationLabel: buildLocation(item.location || {}),
    priceLabel: formatPrice(item.price),
    typeLabel: resolveProductTypeLabel(item.category),
    verified: !!item.isVerified,
    paid:
      item.payment?.paymentStatus === "paid" ||
      item.monetization?.subscriptionActive === true,
    boosted: !!item.monetization?.premiumBadge,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    image: item.images?.[0],
  }));

  const serviceCards = serviceListings
    .filter(isServiceVisible)
    .map((item: any) => ({
      id: item._id || item.id,
      ownerId: item.owner?._id || item.ownerId || item.owner,
      ownerName: item.owner?.fullName || item.owner?.name || item.ownerName,
      category: resolveServiceCategory(item.type),
      listingType: resolveListingType(item.type),
      subCategory: item.type,
      title: item.name || item.title || "Service",
      description: item.description || "",
      county: item.location?.county || "",
      locationLabel: buildLocation(item.location || {}),
      priceLabel: formatPrice(item.price),
      typeLabel: resolveServiceTypeLabel(item.type),
      verified: !!item.isVerified || !!item.verified,
      paid: item.payment?.paymentStatus === "paid",
      boosted: !!item.monetization?.boostOption && item.monetization.boostOption !== "none",
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      image:
        (Array.isArray(item.images) ? item.images[0] : undefined) ||
        (Array.isArray(item.photos) ? item.photos[0] : undefined),
    }));

  return [...productCards, ...serviceCards].filter((item) => !!item.id);
};
