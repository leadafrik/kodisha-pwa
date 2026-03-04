import React, { Suspense, lazy, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import ReportModal from "../components/ReportModal";
import {
  API_ENDPOINTS,
  API_BASE_URL,
  adminApiRequest,
  ensureValidAccessToken,
} from "../config/api";
import { io, Socket } from "socket.io-client";
import { favoritesService } from "../services/favoritesService";
import { handleImageError } from "../utils/imageFallback";
import { getOptimizedImageUrl } from "../utils/imageOptimization";
import { getAuthToken } from "../utils/auth";
import { Star } from "lucide-react";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { buildMarketplaceCards, getMarketplaceCardScore } from "../utils/marketplaceCards";
import {
  getSellerFollowStats,
  getSellerFollowStatus,
  toggleSellerFollow,
} from "../services/sellerFollowService";
import { normalizeKenyanPhone } from "../utils/phone";

const GoogleMapsLoader = lazy(() => import("../components/GoogleMapsLoader"));
const ListingMap = lazy(() => import("../components/ListingMap"));

// Helper: Check if user is admin by checking role in stored user data
const isUserAdmin = (): boolean => {
  try {
    // Legacy: kodisha_admin_token no longer used - all auth goes through kodisha_token with role
    // const adminToken = localStorage.getItem("kodisha_admin_token");
    // if (adminToken) return true;
    
    const userStr = localStorage.getItem("kodisha_user");
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    return user.role === "admin" || user.type === "admin";
  } catch {
    return false;
  }
};

const formatLastActive = (value?: string | Date) => {
  if (!value) return "Active recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Active recently";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  return `Active ${date.toLocaleDateString()}`;
};

interface Message {
  _id?: string;
  from: string;
  to: string;
  body: string;
  createdAt?: string;
  read?: boolean;
}

interface SellerReview {
  _id?: string;
  score?: number;
  review?: string;
  category?: string;
  createdAt?: string;
  raterId?: {
    _id?: string;
    fullName?: string;
    name?: string;
  };
}

type ResolvedListingType =
  | "land"
  | "product"
  | "equipment"
  | "service"
  | "agrovet"
  | null;

const normalizeListingType = (listing: any): ResolvedListingType => {
  const candidates = [
    listing?.listingType,
    listing?.category,
    listing?.serviceType,
    listing?.type,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim().toLowerCase();
    if (!value) continue;
    if (value === "land") return "land";
    if (value === "product") return "product";
    if (value === "equipment") return "equipment";
    if (value === "agrovet" || value === "agrovets") return "agrovet";
    if (
      value === "service" ||
      value === "services" ||
      value === "professional" ||
      value === "professional_services"
    ) {
      return "service";
    }
  }

  return null;
};

const normalizeListingForView = (listing: any) => {
  if (!listing) return listing;

  const location = listing.location || {};

  return {
    ...listing,
    title: listing.title || listing.name,
    name: listing.name || listing.title,
    listingType: normalizeListingType(listing),
    location: {
      ...location,
      county: location.county || location.region || "",
      constituency: location.constituency || location.subRegion || "",
      ward: location.ward || "",
    },
  };
};

const fetchPublicCollection = async (url: string): Promise<any[]> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const payload = await response.json().catch(() => ({}));
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.services)) return payload.data.services;
  return [];
};

const fetchLegacyListingFallback = async (id: string) => {
  const sources: Array<{ url: string; listingType: ResolvedListingType }> = [
    { url: API_ENDPOINTS.services.products.list, listingType: "product" },
    { url: API_ENDPOINTS.services.equipment.list, listingType: "equipment" },
    { url: API_ENDPOINTS.services.professional.list, listingType: "service" },
    { url: API_ENDPOINTS.services.agrovets.list, listingType: "agrovet" },
  ];

  for (const source of sources) {
    const items = await fetchPublicCollection(source.url);
    const match = items.find((item: any) => {
      const candidateId = item?._id?.toString?.() || item?.id?.toString?.() || String(item?._id || item?.id || "");
      return candidateId === id;
    });

    if (match) {
      return normalizeListingForView({
        ...match,
        listingType: source.listingType,
      });
    }
  }

  return null;
};

// Type-specific detail section components
const LandDetailsSection: React.FC<{ listing: any }> = ({ listing }) => (
  <div className="bg-gray-100 p-4 rounded-lg mb-6">
    <h2 className="font-semibold mb-3">Land Details</h2>
    <div className="space-y-2">
      <p><strong>Size:</strong> {listing?.size ?? '—'} {listing?.size ? 'acres' : ''}</p>
      <p><strong>Soil Type:</strong> {listing?.soilType || '—'}</p>
      <p><strong>Water Availability:</strong> {listing?.waterAvailability || '—'}</p>
      <p><strong>Organic Certified:</strong> {listing?.organicCertified ? "Yes" : "No"}</p>
      <p><strong>Previous Crops:</strong> {Array.isArray(listing?.previousCrops) ? listing.previousCrops.join(", ") : listing?.previousCrops || '—'}</p>
      {listing?.availableFrom && <p><strong>Available From:</strong> {new Date(listing.availableFrom).toLocaleDateString()}</p>}
      {listing?.availableTo && <p><strong>Available Until:</strong> {new Date(listing.availableTo).toLocaleDateString()}</p>}
      {listing?.minLeasePeriod && <p><strong>Min Lease Period:</strong> {listing.minLeasePeriod} months</p>}
      {listing?.maxLeasePeriod && <p><strong>Max Lease Period:</strong> {listing.maxLeasePeriod} months</p>}
    </div>
  </div>
);

const EquipmentDetailsSection: React.FC<{ listing: any }> = ({ listing }) => (
  <div className="bg-blue-50 p-4 rounded-lg mb-6">
    <h2 className="font-semibold mb-3 text-blue-900">Equipment & Services</h2>
    <div className="space-y-2">
      <p><strong>Services Available:</strong> {Array.isArray(listing.services) ? listing.services.join(', ') : listing.services || '—'}</p>
      {(listing.pricing || listing.price) && <p><strong>Pricing:</strong> {listing.pricing || (typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : listing.price)}</p>}
      {typeof listing.operatorIncluded !== 'undefined' && <p><strong>Operator Included:</strong> {listing.operatorIncluded ? 'Yes' : 'No'}</p>}
      {listing.minHirePeriod && <p><strong>Min Hire Period:</strong> {listing.minHirePeriod}</p>}
      {listing.maxHirePeriod && <p><strong>Max Hire Period:</strong> {listing.maxHirePeriod}</p>}
    </div>
  </div>
);

const ProfessionalDetailsSection: React.FC<{ listing: any }> = ({ listing }) => (
  <div className="bg-purple-50 p-4 rounded-lg mb-6">
    <h2 className="font-semibold mb-3 text-purple-900">Professional Services</h2>
    <div className="space-y-2">
      <p><strong>Services Offered:</strong> {Array.isArray(listing.services) ? listing.services.join(', ') : listing.services || '—'}</p>
      {listing.experience && <p><strong>Years of Experience:</strong> {listing.experience}</p>}
      {listing.qualifications && <p><strong>Qualifications:</strong> {listing.qualifications}</p>}
      {(listing.pricing || listing.price) && <p><strong>Rate:</strong> {listing.pricing || (typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : listing.price)}</p>}
    </div>
  </div>
);

const AgrovetDetailsSection: React.FC<{ listing: any }> = ({ listing }) => {
  // Handle services - could be array, object, or string
  const renderServices = () => {
    if (!listing.services) return '—';
    
    // If it's an array
    if (Array.isArray(listing.services)) {
      return listing.services.join(', ');
    }
    
    // If it's an object (e.g., {seeds: [...], fertilizers: [...]})
    if (typeof listing.services === 'object') {
      const servicesList: string[] = [];
      Object.entries(listing.services).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          servicesList.push(`${formattedKey}: ${value.join(', ')}`);
        }
      });
      return servicesList.length > 0 ? servicesList.join(' • ') : '—';
    }
    
    // If it's a string
    return String(listing.services);
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg mb-6">
      <h2 className="font-semibold mb-3 text-green-900">Agrovet Details</h2>
      <div className="space-y-2">
        <p><strong>Products/Services:</strong> {renderServices()}</p>
        {(listing.pricing || listing.price) && <p><strong>Pricing Info:</strong> {listing.pricing || (typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : listing.price)}</p>}
        {listing.specialization && <p><strong>Specialization:</strong> {listing.specialization}</p>}
        {listing.businessHours && <p><strong>Business Hours:</strong> {listing.businessHours}</p>}
      </div>
    </div>
  );
};

const ProductDetailsSection: React.FC<{ listing: any }> = ({ listing }) => (
  <div className="bg-orange-50 p-4 rounded-lg mb-6">
    <h2 className="font-semibold mb-3 text-orange-900">Product Information</h2>
    <div className="space-y-2">
      <p><strong>Category:</strong> {listing.category || listing.type || '—'}</p>
      {listing.price && <p><strong>Price per Unit:</strong> {typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : listing.price}</p>}
      {listing.unit && <p><strong>Unit:</strong> {listing.unit}</p>}
      {listing.quantity && <p><strong>Quantity Available:</strong> {listing.quantity}</p>}
      {listing.grade && <p><strong>Grade:</strong> {listing.grade}</p>}
      {listing.harvestDate && <p><strong>Harvest Date:</strong> {new Date(listing.harvestDate).toLocaleDateString()}</p>}
    </div>
  </div>
);

const renderDetailsSection = (listingType: string | null, listing: any) => {
  switch (listingType) {
    case 'land':
      return <LandDetailsSection listing={listing} />;
    case 'equipment':
      return <EquipmentDetailsSection listing={listing} />;
    case 'service':
      return <ProfessionalDetailsSection listing={listing} />;
    case 'agrovet':
      return <AgrovetDetailsSection listing={listing} />;
    case 'product':
      return <ProductDetailsSection listing={listing} />;
    default:
      return null;
  }
};

// Admin controls component
interface AdminControlsProps {
  listing: any;
  onUpdate: () => void;
}

const AdminControlsSection: React.FC<AdminControlsProps> = ({ listing, onUpdate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async (status: "approved" | "rejected") => {
    setLoading(true);
    setMessage("");
    try {
      await adminApiRequest(
        API_ENDPOINTS.admin.listings.verify(listing._id),
        {
          method: "PUT",
          body: JSON.stringify({ status }),
        }
      );
      setMessage(`Listing ${status === "approved" ? "approved" : "rejected"} successfully.`);
      setTimeout(onUpdate, 1500);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) {
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await adminApiRequest(
        API_ENDPOINTS.admin.listings.delete(listing._id),
        { method: "DELETE" }
      );
      setMessage("Listing deleted. Redirecting...");
      setTimeout(() => navigate("/listings"), 1500);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isVerified = listing.verified || listing.isVerified || listing.status === "active";

  return (
    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200 mb-6">
      <h2 className="font-semibold text-red-900 mb-3">Admin Controls</h2>
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleVerify("approved")}
            disabled={loading || isVerified}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerified ? "✓ Verified" : "Approve"}
          </button>
          <button
            onClick={() => handleVerify("rejected")}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Error") ? "text-red-700" : "text-green-700"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

const ListingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { productListings, serviceListings } = useProperties();
  const [listing, setListing] = useState<any>(null);
  const [markingSold, setMarkingSold] = useState(false);
  const [soldMessage, setSoldMessage] = useState("");
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [listingType, setListingType] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userRatings, setUserRatings] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [ratingsLoaded, setRatingsLoaded] = useState(false);
  const [sellerFollowState, setSellerFollowState] = useState({
    isFollowing: false,
    followerCount: 0,
  });
  const [followLoading, setFollowLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatSectionRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const applyListingState = useCallback(
    async (rawListing: any) => {
      const normalizedListing = normalizeListingForView(rawListing);
      const resolvedListingType = normalizeListingType(normalizedListing);

      setListing(normalizedListing);
      setListingType(resolvedListingType);

      const token = getAuthToken();
      if (token) {
        try {
          const favorites = await favoritesService.getFavorites();
          const listingIdStr =
            normalizedListing._id.toString?.() || String(normalizedListing._id);
          const isSaved = favorites.some((f: any) => {
            const favIdStr = f.listingId.toString?.() || String(f.listingId);
            return (
              favIdStr === listingIdStr &&
              !!resolvedListingType &&
              f.listingType === resolvedListingType
            );
          });
          setSaved(isSaved);
        } catch {
          // Ignore favorites lookup failures on detail load.
        }
      }

      if (
        Array.isArray(normalizedListing.images) &&
        normalizedListing.images.length > 0
      ) {
        setMainImage(normalizedListing.images[0]);
      } else {
        setMainImage(null);
      }
    },
    []
  );

  const openChatPanel = useCallback(() => {
    setChatReady(true);
    window.setTimeout(() => {
      chatSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      messageInputRef.current?.focus();
    }, 120);
  }, []);

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) {
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/unified-listings/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        console.error('Listing fetch failed with status:', res.status);
        const fallbackListing = await fetchLegacyListingFallback(id as string);
        if (fallbackListing) {
          await applyListingState(fallbackListing);
          return;
        }
        setListing(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        await applyListingState(data.data);
      } else {
        console.error('Listing fetch failed:', data);
        const fallbackListing = await fetchLegacyListingFallback(id as string);
        if (fallbackListing) {
          await applyListingState(fallbackListing);
          return;
        }
        setListing(null);
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
      const fallbackListing = id
        ? await fetchLegacyListingFallback(id as string).catch(() => null)
        : null;
      if (fallbackListing) {
        await applyListingState(fallbackListing);
      } else {
        setListing(null);
      }
    } finally {
      setLoading(false);
    }
  }, [applyListingState, id]);

  // Check if user is admin on mount and when storage changes
  useEffect(() => {
    setIsAdmin(isUserAdmin());
    
    // Listen for storage changes (e.g., when user logs in/out)
    const handleStorageChange = () => {
      setIsAdmin(isUserAdmin());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchMessages = async (ownerId: string) => {
    setChatLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return; // chat only for logged in users

      // Fetch messages with this listing's owner
      // API_ENDPOINTS.messages.withUser(ownerId) returns messages between current user and ownerId
      const res = await fetch(API_ENDPOINTS.messages.withUser(ownerId), {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchUserRatings = async (ownerId: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.ratings.getUserRatings(ownerId), {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setUserRatings(data.data);
      }
    } catch (err) {
      console.error('Error loading ratings:', err);
    } finally {
      setRatingsLoaded(true);
    }
  };

  const setupSocket = async (ownerId: string) => {
    const token = await ensureValidAccessToken();
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const baseUrl = API_BASE_URL.replace(/\/api$/, "");
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("message:read", { from: ownerId });
    });

    socket.on("message:new", (msg: Message) => {
      if (
        (msg.from === ownerId && msg.to) ||
        (msg.to === ownerId && msg.from)
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg].sort(
            (a, b) =>
              new Date(a.createdAt || "").getTime() -
              new Date(b.createdAt || "").getTime()
          );
        });
        socket.emit("message:read", { from: ownerId });
      }
    });

    socket.on("message:typing", (payload: any) => {
      if (payload?.from === ownerId) {
        setTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
      }
    });

    socket.on("message:read", (payload: any) => {
      if (payload?.from === ownerId) {
        setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
      }
    });

    socket.on("presence:update", (list: string[]) => {
      // Track owner online status for real-time messaging
      if (Array.isArray(list) && list.includes(ownerId)) {
        // Owner is online
      }
    });

    socketRef.current = socket;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !listing?.owner?._id) return;
    setSending(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) {
        alert("Please log in to chat with the seller.");
        return;
      }
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit("message:send", {
          to: listing.owner._id,
          listingId: listing._id,
          body: newMessage.trim(),
        });
        setNewMessage("");
      } else {
        const res = await fetch(API_ENDPOINTS.messages.send, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toUserId: listing.owner._id,
            listingId: listing._id,
            body: newMessage.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setNewMessage("");
          await fetchMessages(listing.owner._id);
        } else {
          alert(data.message || "Failed to send message");
        }
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  const sendTyping = () => {
    const socket = socketRef.current;
    if (socket && socket.connected && listing?.owner?._id) {
      socket.emit("message:typing", { to: listing.owner._id, listingId: listing._id });
    }
  };

  // Canonicalize legacy listing URLs.
  useEffect(() => {
    if (id && location.pathname.startsWith("/listing/")) {
      navigate(`/listings/${id}`, { replace: true });
    }
  }, [id, location.pathname, navigate]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    setRatingsLoaded(false);
    setUserRatings(null);
    setChatReady(false);
    setMessages([]);
    setTyping(false);
  }, [id]);

  useEffect(() => {
    if (!listing?.owner?._id || ratingsLoaded) return;

    const timer = window.setTimeout(() => {
      void fetchUserRatings(listing.owner._id);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [listing?.owner?._id, ratingsLoaded]);

  useEffect(() => {
    if (listing?.owner?._id && chatReady) {
      void fetchMessages(listing.owner._id);
      void setupSocket(listing.owner._id);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatReady, listing?.owner?._id]);

  useEffect(() => {
    if (!listing || !id) return;

    const title = listing.title || listing.name || "Agricultural Listing";
    const county = listing.location?.county || listing.county;
    const metaDescription = county
      ? `${title} in ${county}, Kenya. Connect directly with verified sellers on Agrisoko.`
      : `${title}. Connect directly with verified sellers on Agrisoko Kenya.`;
    const canonicalUrl = `https://www.agrisoko254.com/listings/${id}`;

    document.title = `${title} | Agrisoko`;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", metaDescription);
    }

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonicalUrl);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", canonicalUrl);
    }

    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) {
      twitterUrl.setAttribute("content", canonicalUrl);
    }
  }, [listing, id]);

  const owner = listing?.owner || {};
  const moreFromSeller = useMemo(() => {
    const ownerId = owner?._id?.toString?.() || String(owner?._id || "");
    const currentListingId = listing?._id?.toString?.() || String(listing?._id || "");
    if (!ownerId) return [];

    return buildMarketplaceCards(productListings as any[], serviceListings as any[])
      .filter((item) => item.ownerId && String(item.ownerId) === ownerId && item.id !== currentListingId)
      .sort((a, b) => {
        const scoreDiff = getMarketplaceCardScore(b) - getMarketplaceCardScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 3);
  }, [listing?._id, owner?._id, productListings, serviceListings]);

  useEffect(() => {
    const sellerId = owner?._id?.toString?.() || String(owner?._id || "");
    if (!sellerId) {
      setSellerFollowState({ isFollowing: false, followerCount: 0 });
      return;
    }

    const loadFollowState = async () => {
      try {
        if (user?._id && String(user._id) !== sellerId) {
          const data = await getSellerFollowStatus(sellerId);
          setSellerFollowState({
            isFollowing: !!data.isFollowing,
            followerCount: data.followerCount || 0,
          });
          return;
        }

        const data = await getSellerFollowStats(sellerId);
        setSellerFollowState({
          isFollowing: false,
          followerCount: data.followerCount || 0,
        });
      } catch {
        setSellerFollowState((prev) => ({ ...prev }));
      }
    };

    void loadFollowState();
  }, [owner?._id, user?._id]);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading listing...</div>;
  }

  if (!listing) {
    return (
      <div className="p-4 text-center">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-4">This listing may have been removed or is no longer available.</p>
          <button
            onClick={() => navigate('/browse')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const coords = listing.coordinates || listing.location?.coordinates;
  const responseTimeLabel = owner.responseTime || owner.responseTimeLabel || "Usually replies within 24 hours";
  const lastActiveLabel = formatLastActive(owner.lastActive || owner.updatedAt || listing.updatedAt || listing.createdAt);
  const sellerReviews: SellerReview[] = Array.isArray(userRatings?.ratings) ? userRatings.ratings : [];
  const sellerPhone = normalizeKenyanPhone(listing.contact || owner.phone);
  const isOwnListing = !!user?._id && !!owner?._id && String(user._id) === String(owner._id);

  // Determine owner/admin privileges for marking sold
  const currentUserRaw = localStorage.getItem('kodisha_user');
  let currentUserId: string | null = null;
  try { if (currentUserRaw) currentUserId = JSON.parse(currentUserRaw)?._id; } catch {}
  const canMarkSold = !!listing && (isAdmin || (currentUserId && listing.owner && listing.owner._id === currentUserId));
  const supportsMarkSold = listingType === 'product';

  const hoursUntilHide = listing?.sold && listing?.soldAt ? Math.max(0, 48 - ((Date.now() - new Date(listing.soldAt).getTime()) / (1000*60*60))) : null;

  const handleMarkSold = async () => {
    if (!listing || !canMarkSold) return;
    setMarkingSold(true);
    setSoldMessage("");
    try {
      const token = await ensureValidAccessToken();
      if (!token) { window.location.href = '/login'; return; }
      const markEndpoint = listingType === 'product'
        ? API_ENDPOINTS.services.products.markSold(listing._id)
        : API_ENDPOINTS.properties.markSold(listing._id);
      const res = await fetch(markEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to mark sold');
      setSoldMessage('Marked as sold. Will disappear after 48 hours.');
      await fetchListing();
    } catch (err:any) {
      setSoldMessage(err.message);
    } finally {
      setMarkingSold(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!listing?.owner?._id || ratingScore === 0) return;
    setSubmittingRating(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) { window.location.href = '/login'; return; }
      const res = await fetch(API_ENDPOINTS.ratings.submit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ratedUserId: listing.owner._id,
          listingId: listing._id,
          score: ratingScore,
          review: ratingReview,
          category: 'overall',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to submit rating');
      setShowRatingModal(false);
      setRatingScore(0);
      setRatingReview('');
      fetchUserRatings(listing.owner._id);
      window.alert('Rating submitted successfully!');
    } catch (err:any) {
      window.alert(err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleToggleFollowSeller = async () => {
    if (!owner?._id || isOwnListing) return;
    if (!getAuthToken()) {
      window.location.href = `/login?next=/sellers/${owner._id}`;
      return;
    }

    setFollowLoading(true);
    try {
      const result = await toggleSellerFollow(String(owner._id));
      setSellerFollowState({
        isFollowing: !!result.isFollowing,
        followerCount: result.followerCount || 0,
      });
    } catch (err: any) {
      window.alert(err?.message || "Failed to update seller follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Title + price row - improved layout */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {listing.title || listing.name}
              </h1>
              <p className="text-sm text-gray-600">
                {[listing.location?.county, listing.location?.constituency, listing.location?.ward].filter(Boolean).join(', ') || 'Location not specified'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-2xl font-extrabold text-green-700">
                {listing.price || listing.pricing ? (
                  typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : (listing.price || listing.pricing)
                ) : 'Contact for price'}
              </p>
            </div>
          </div>

          {/* Image gallery with main image and selectable thumbnails */}
          {Array.isArray(listing.images) && listing.images.length > 0 && (
            <div className="mb-6">
              <div className="rounded-lg overflow-hidden bg-gray-100 mb-3">
                <img
                  src={getOptimizedImageUrl(mainImage || listing.images[0], {
                    width: 1600,
                    height: 1200,
                    fit: "limit",
                  })}
                  alt="Listing main"
                  className="w-full h-96 object-cover"
                  onError={handleImageError}
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {listing.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setMainImage(img)}
                    className={`h-20 rounded overflow-hidden border-2 transition ${
                      mainImage === img ? 'border-green-600' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    >
                      <img 
                      src={getOptimizedImageUrl(img, {
                        width: 240,
                        height: 240,
                        fit: "fill",
                      })} 
                      alt={`Thumbnail ${i + 1}`} 
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick action CTAs */}
          <div className="flex flex-wrap gap-3 mb-6">
            <a
              href={`tel:${owner.phone || ''}`}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Call Seller
            </a>
            <button
              onClick={() => {
                if (!getAuthToken()) {
                  window.location.href = `/login?next=/listings/${id}`;
                } else {
                  openChatPanel();
                }
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Message
            </button>
            <button
              onClick={() => {
                if ((navigator as any).share) {
                  (navigator as any).share({
                    title: listing.title,
                    text: listing.description,
                    url: window.location.href,
                  });
                } else {
                  window.alert('Share link: ' + window.location.href);
                }
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Share
            </button>
            <button
              onClick={async () => {
                const token = getAuthToken();
                if (!token) {
                  window.location.href = `/login?next=/listings/${id}`;
                  return;
                }
                try {
                  if (!listing || !listing._id) {
                    console.error('Listing not loaded properly');
                    return;
                  }
                  const listingIdToSend = listing._id.toString?.() || String(listing._id);
                  const listingTypeToSend = normalizeListingType(listing);
                  if (!listingTypeToSend) {
                    return;
                  }
                  
                  const result = await favoritesService.toggleFavorite(listingIdToSend, listingTypeToSend);
                  setSaved(result.action === 'added');
                } catch (err) {
                  // Handle toggle error
                }
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              {saved ? 'Saved' : 'Save'}
            </button>
            {canMarkSold && supportsMarkSold && !listing.sold && (
              <button
                onClick={handleMarkSold}
                disabled={markingSold}
                className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 transition"
              >
                {markingSold ? 'Marking...' : 'Mark as Sold'}
              </button>
            )}
            {listing.sold && (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm">
                Sold {hoursUntilHide !== null && hoursUntilHide > 0 && `• hides in ${Math.ceil(hoursUntilHide)}h`}
              </span>
            )}
          </div>
          {soldMessage && (
            <p className={`text-sm mb-4 ${soldMessage.startsWith('Marked') ? 'text-green-700' : 'text-red-600'}`}>{soldMessage}</p>
          )}

          <p className="text-gray-700 mb-6">{listing.description}</p>

          {/* Type-specific details section */}
          {renderDetailsSection(listingType, listing)}

          {userRatings?.aggregate?.count > 0 && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Buyer reviews
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {userRatings.aggregate.average.toFixed(1)} stars from {userRatings.aggregate.count} review
                    {userRatings.aggregate.count === 1 ? "" : "s"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Recent feedback for {owner.fullName || owner.name || "this seller"}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewsModal(true)}
                    className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    Read all reviews
                  </button>
                  {owner._id && (
                    <Link
                      to={`/sellers/${owner._id}`}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Seller profile
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {sellerReviews.slice(0, 2).map((review, index) => (
                  <div
                    key={review._id || `review-preview-${index}`}
                    className="rounded-lg border border-white bg-white/80 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {review.raterId?.fullName || review.raterId?.name || "Buyer"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="mb-2 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={`${review._id || index}-${star}`}
                          className={`h-4 w-4 ${
                            star <= Math.round(review.score || 0)
                              ? "fill-yellow-400 text-yellow-500"
                              : "fill-transparent text-gray-300"
                          }`}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700">
                      {review.review || "Rated the seller without a written review."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin controls (only visible to admins) */}
          {isAdmin && <AdminControlsSection listing={listing} onUpdate={fetchListing} />}

          {moreFromSeller.length > 0 && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    More from this seller
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    More active listings from {owner.fullName || owner.name || "this seller"}
                  </h2>
                </div>
                {owner._id && (
                  <Link
                    to={`/sellers/${owner._id}`}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View full seller profile
                  </Link>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {moreFromSeller.map((item) => (
                  <Link
                    key={item.id}
                    to={`/listings/${item.id}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-32 overflow-hidden bg-slate-100">
                      {item.image ? (
                        <img
                          src={getOptimizedImageUrl(item.image, {
                            width: 520,
                            height: 320,
                            fit: "fill",
                          })}
                          alt={item.title}
                          onError={handleImageError}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {item.typeLabel}
                        </span>
                        {item.priceLabel && (
                          <span className="text-xs font-semibold text-emerald-700">{item.priceLabel}</span>
                        )}
                      </div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {item.locationLabel || item.county || "Location pending"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-semibold mb-2">Map Location</h2>

            {!coords || !coords.lat || !coords.lng ? (
              <p className="text-gray-500 text-sm">No map location was provided for this listing.</p>
            ) : !showMap ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">
                  Load the map only when you need directions.
                </p>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="mt-3 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Load map
                </button>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                    Loading map...
                  </div>
                }
              >
                <GoogleMapsLoader>
                  <div className="rounded-lg overflow-hidden shadow-md border">
                    <ListingMap lat={coords.lat} lng={coords.lng} />
                  </div>
                </GoogleMapsLoader>

                <p className="text-gray-500 text-xs mt-2">
                  Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>

                <a
                  href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  Open in Google Maps
                </a>
              </Suspense>
            )}
          </div>
        </div>

        {/* Sidebar with seller + chat */}
        <div className="space-y-4">
          {/* Seller card - improved with avatar and verification */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-700 overflow-hidden">
                {owner.profilePicture ? (
                  <img
                    src={getOptimizedImageUrl(owner.profilePicture, {
                      width: 160,
                      height: 160,
                      fit: "fill",
                    })}
                    alt={owner.fullName || owner.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white">{owner.name ? owner.name[0].toUpperCase() : (owner.fullName ? owner.fullName[0].toUpperCase() : 'S')}</span>
                )}
              </div>
              <div className="flex-1">
                {owner._id ? (
                  <Link
                    to={`/sellers/${owner._id}`}
                    className="font-semibold text-gray-900 hover:text-emerald-700"
                  >
                    {owner.fullName || owner.name || 'Seller'}
                  </Link>
                ) : (
                  <h3 className="font-semibold text-gray-900">{owner.fullName || owner.name || 'Seller'}</h3>
                )}
                {owner.isVerified && (
                  <span className="inline-block text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              {responseTimeLabel}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {lastActiveLabel}
            </p>

            <p className="mb-3 text-xs font-semibold text-slate-500">
              {sellerFollowState.followerCount} follower{sellerFollowState.followerCount === 1 ? "" : "s"}
            </p>

            {/* Rating display */}
            {userRatings?.aggregate && userRatings.aggregate.count > 0 && (
              <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-0.5" aria-label={`Rating ${userRatings.aggregate.average.toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(userRatings.aggregate.average)
                            ? "text-yellow-500 fill-yellow-400"
                            : "text-gray-300 fill-transparent"
                        }`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">
                    {userRatings.aggregate.average.toFixed(1)} ({userRatings.aggregate.count} reviews)
                  </span>
                </div>
                {userRatings.aggregate.breakdown.overall > 0 && (
                  <p className="text-xs text-gray-600">
                    Overall: {userRatings.aggregate.breakdown.overall.toFixed(1)}/5
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!ratingsLoaded && listing?.owner?._id) {
                      void fetchUserRatings(listing.owner._id);
                    }
                    setShowReviewsModal(true);
                  }}
                  className="mt-1 text-xs font-semibold text-yellow-700 underline decoration-dotted hover:text-yellow-800"
                >
                  Read reviews
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {sellerPhone ? (
                getAuthToken() ? (
                  <a
                    href={`tel:${sellerPhone}`}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 text-center"
                  >
                    Call
                  </a>
                ) : (
                  <Link
                    to={`/login?next=${encodeURIComponent(`/listings/${id}`)}`}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 text-center"
                  >
                    Call
                  </Link>
                )
              ) : (
                <div className="flex-1 px-3 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-semibold text-center cursor-not-allowed">
                  Call Unavailable
                </div>
              )}
              <button
                onClick={() => {
                  if (!getAuthToken()) {
                    window.location.href = `/login?next=/listings/${id}`;
                    return;
                  }
                  openChatPanel();
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Message
              </button>
            </div>

            {!isOwnListing && (
              <button
                type="button"
                onClick={handleToggleFollowSeller}
                disabled={followLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
              >
                {followLoading
                  ? "Updating..."
                  : sellerFollowState.isFollowing
                  ? "Following seller"
                  : "Follow seller"}
              </button>
            )}

            {owner._id && (
              <Link
                to={`/sellers/${owner._id}`}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View seller profile
              </Link>
            )}

            <button
              onClick={() => {
                if (!getAuthToken()) {
                  window.location.href = '/login';
                } else {
                  setShowRatingModal(true);
                }
              }}
              className="w-full mt-2 px-3 py-2 border border-yellow-400 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold hover:bg-yellow-100"
            >
              Rate Seller
            </button>

            {/* Subtle Report Seller link */}
            <button
              aria-label="Report Seller"
              onClick={() => {
                if (!getAuthToken()) {
                  window.location.href = '/login';
                } else {
                  setShowReportModal(true);
                }
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline decoration-dotted"
            >
              Report seller
            </button>

            <p className="text-xs text-gray-500 mt-3">
              {owner.isVerified ? 'ID & phone verified' : 'Unverified seller'}
            </p>
          </div>
          {/* Chat section - improved UI and microcopy */}
          <div ref={chatSectionRef} className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">Message the Seller</h3>

            {!chatReady ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Open the conversation only when you are ready to message.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!getAuthToken()) {
                      window.location.href = `/login?next=/listings/${id}`;
                      return;
                    }
                    openChatPanel();
                  }}
                  className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Open chat
                </button>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-3 mb-3 bg-gray-50">
                  {chatLoading ? (
                    <p className="text-gray-500 text-center text-xs py-4">
                      Loading conversation...
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-gray-500 text-center text-xs py-4">
                      No messages yet. Ask about availability, pricing, or arrange a viewing.
                    </p>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`rounded p-2 mb-2 ${msg.from === owner._id ? 'bg-white border' : 'bg-green-50'}`}>
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          {msg.from === owner._id ? 'Seller' : 'You'} {msg.read && msg.from === owner._id ? '??????' : ''}
                        </p>
                        <p className="text-gray-800 text-sm">{msg.body}</p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    ))
                  )}
                  {typing && <p className="text-xs text-gray-500 italic">Seller is typing???</p>}
                </div>

                <textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    sendTyping();
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Type your message..."
                  rows={3}
                />

                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-full mt-2 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  {getAuthToken() ? 'Messages are private and secure.' : 'Log in to send and receive messages.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Rate {owner.fullName || 'Seller'}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating (1-5 stars)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingScore(star)}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    aria-pressed={ratingScore === star}
                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 transition"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingScore
                          ? "text-yellow-500 fill-yellow-400"
                          : "text-gray-300 fill-transparent"
                      }`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Review (optional)</label>
              <textarea
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                rows={4}
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRatingScore(0);
                  setRatingReview('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={submittingRating || ratingScore === 0}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">
                Seller Reviews
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {sellerReviews.length > 0 ? (
                sellerReviews.map((review, index) => (
                  <div key={review._id || `review-${index}`} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {review.raterId?.fullName || review.raterId?.name || "Buyer"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="mb-2 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={`${review._id || index}-${star}`}
                          className={`h-4 w-4 ${
                            star <= Math.round(review.score || 0)
                              ? "fill-yellow-400 text-yellow-500"
                              : "fill-transparent text-gray-300"
                          }`}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    {review.review ? (
                      <p className="text-sm text-gray-700">{review.review}</p>
                    ) : (
                      <p className="text-sm italic text-gray-500">No written review.</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  No reviews available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal 
        isOpen={showReportModal}
        sellerId={owner?._id}
        sellerName={owner?.fullName || owner?.name || 'Seller'}
        listingId={listing?._id}
        listingType={listingType || undefined}
        onClose={() => setShowReportModal(false)}
        onSubmitSuccess={() => {
          setShowReportModal(false);
          alert('Report submitted successfully. Thank you for helping keep Kodisha safe.');
        }}
      />
    </div>
  );
};

export default ListingDetails;
