import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GoogleMapsLoader from "../components/GoogleMapsLoader";
import ListingMap from "../components/ListingMap";
import ReportModal from "../components/ReportModal";
import { API_ENDPOINTS, API_BASE_URL, adminApiRequest } from "../config/api";
import { io, Socket } from "socket.io-client";
import { favoritesService } from "../services/favoritesService";
import { handleImageError } from "../utils/imageFallback";
import { Star } from "lucide-react";

// Helper: Get auth token (user or admin)
const getAuthToken = (): string | null => {
  return localStorage.getItem("kodisha_token") || localStorage.getItem("kodisha_admin_token");
};

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
    case 'professional':
      return <ProfessionalDetailsSection listing={listing} />;
    case 'agrovet':
      return <AgrovetDetailsSection listing={listing} />;
    case 'product':
      return <ProductDetailsSection listing={listing} />;
    default:
      return <LandDetailsSection listing={listing} />;
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
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) {
        setLoading(false);
        return;
      }
      const res = await fetch(API_ENDPOINTS.properties.getById(id as string));
      if (!res.ok) {
        console.error('Listing fetch failed with status:', res.status);
        setListing(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setListing(data.data);
        setListingType(data.data.listingType || "land");
        // After setting listing, check if saved
        const token = getAuthToken();
        if (token) {
          try {
            const favorites = await favoritesService.getFavorites();
            const listingIdStr = data.data._id.toString?.() || String(data.data._id);
            const isSaved = favorites.some((f: any) => {
              const favIdStr = f.listingId.toString?.() || String(f.listingId);
              return favIdStr === listingIdStr && f.listingType === (data.data.listingType || 'land');
            });
            setSaved(isSaved);
          } catch (e) {
            // Silently handle favorite check failures
          }
        }
        if (Array.isArray(data.data.images) && data.data.images.length > 0) {
          setMainImage(data.data.images[0]);
        }
      } else {
        console.error('Listing fetch failed:', data);
        setListing(null);
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    try {
      const token = getAuthToken();
      if (!token) return; // chat only for logged in users

      // Fetch messages with this listing's owner
      // API_ENDPOINTS.messages.withUser(ownerId) returns messages between current user and ownerId
      const res = await fetch(API_ENDPOINTS.messages.withUser(ownerId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const fetchUserRatings = async (ownerId: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.ratings.getUserRatings(ownerId));
      const data = await res.json();
      if (data.success) {
        setUserRatings(data.data);
      }
    } catch (err) {
      console.error('Error loading ratings:', err);
    }
  };

  const setupSocket = (ownerId: string) => {
    const token = getAuthToken();
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
      const token = getAuthToken();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate(`/login?next=/listings/${id}`);
      return;
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    if (listing?.owner?._id) {
      fetchMessages(listing.owner._id);
      fetchUserRatings(listing.owner._id);
      setupSocket(listing.owner._id);
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
  }, [listing?.owner?._id]);

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

  const owner = listing.owner || {};
  const coords = listing.coordinates || listing.location?.coordinates;
  const responseTimeLabel = owner.responseTime || owner.responseTimeLabel || "Usually replies within 24 hours";
  const lastActiveLabel = formatLastActive(owner.lastActive || owner.updatedAt || listing.updatedAt || listing.createdAt);
  const sellerReviews: SellerReview[] = Array.isArray(userRatings?.ratings) ? userRatings.ratings : [];

  // Determine owner/admin privileges for marking sold
  const currentUserRaw = localStorage.getItem('kodisha_user');
  let currentUserId: string | null = null;
  try { if (currentUserRaw) currentUserId = JSON.parse(currentUserRaw)?._id; } catch {}
  const canMarkSold = !!listing && (isAdmin || (currentUserId && listing.owner && listing.owner._id === currentUserId));

  const hoursUntilHide = listing?.sold && listing?.soldAt ? Math.max(0, 48 - ((Date.now() - new Date(listing.soldAt).getTime()) / (1000*60*60))) : null;

  const handleMarkSold = async () => {
    if (!listing || !canMarkSold) return;
    setMarkingSold(true);
    setSoldMessage("");
    try {
      const token = getAuthToken();
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
      const token = getAuthToken();
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
                  src={mainImage || listing.images[0]}
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
                      src={img} 
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
                  const el = document.querySelector('textarea');
                  if (el) (el as HTMLElement).focus();
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
                  const listingTypeToSend = (listing.listingType || listingType || 'land') as 'land' | 'product' | 'equipment' | 'service' | 'agrovet';
                  
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
            {canMarkSold && !listing.sold && (
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

          {/* Admin controls (only visible to admins) */}
          {isAdmin && <AdminControlsSection listing={listing} onUpdate={fetchListing} />}

          <div className="mt-6">
            <h2 className="font-semibold mb-2">Map Location</h2>

            {!coords || !coords.lat || !coords.lng ? (
              <p className="text-gray-500 text-sm">No map location was provided for this listing.</p>
            ) : (
              <>
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
              </>
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
                    src={owner.profilePicture}
                    alt={owner.fullName || owner.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white">{owner.name ? owner.name[0].toUpperCase() : (owner.fullName ? owner.fullName[0].toUpperCase() : 'S')}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{owner.fullName || owner.name || 'Seller'}</h3>
                {owner.isVerified && (
                  <span className="inline-block text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    ✓ Verified
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
                  onClick={() => setShowReviewsModal(true)}
                  className="mt-1 text-xs font-semibold text-yellow-700 underline decoration-dotted hover:text-yellow-800"
                >
                  Read reviews
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {listing.owner.phone ? (
                <a
                  href={`tel:${listing.owner.phone}`}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 text-center"
                >
                  Call
                </a>
              ) : (
                <div className="flex-1 px-3 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-semibold text-center cursor-not-allowed">
                  Call Unavailable
                </div>
              )}
              <button
                onClick={() => {
                  const el = document.querySelector('textarea');
                  if (el) (el as HTMLElement).focus();
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Message
              </button>
            </div>

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
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">Message the Seller</h3>

            <div className="max-h-64 overflow-y-auto border rounded-lg p-3 mb-3 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-4">
                  No messages yet. Ask about availability, pricing, or arrange a viewing.
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`rounded p-2 mb-2 ${msg.from === owner._id ? 'bg-white border' : 'bg-green-50'}`}>
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      {msg.from === owner._id ? 'Seller' : 'You'} {msg.read && msg.from === owner._id ? '✓✓' : ''}
                    </p>
                    <p className="text-gray-800 text-sm">{msg.body}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                ))
              )}
              {typing && <p className="text-xs text-gray-500 italic">Seller is typing…</p>}
            </div>

            <textarea
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
