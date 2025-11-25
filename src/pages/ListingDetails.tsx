import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import GoogleMapsLoader from "../components/GoogleMapsLoader";
import ListingMap from "../components/ListingMap";
import { API_ENDPOINTS, API_BASE_URL } from "../config/api";
import { io, Socket } from "socket.io-client";

interface Message {
  _id?: string;
  from: string;
  to: string;
  body: string;
  createdAt?: string;
  read?: boolean;
}

const ListingDetails: React.FC = () => {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [listingType, setListingType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [ownerOnline, setOwnerOnline] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) return;

      // Try multiple endpoints so the details page can show land, services, agrovets, or products
      const candidates = [
        API_ENDPOINTS.properties.getById(id as string),
        `${API_BASE_URL}/services/equipment/${id}`,
        `${API_BASE_URL}/services/professional/${id}`,
        `${API_BASE_URL}/agrovets/${id}`,
        `${API_BASE_URL}/products/${id}`,
      ];

      let found: any = null;
      let foundType: string | null = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url);
          // Try to parse — some endpoints return { success, data }
          const txt = await res.text();
          if (!txt) continue;
          const data = JSON.parse(txt);
          if (res.ok && data && (data.data || data.success)) {
            found = data.data || data;
            // Infer type from the url
            if (url.includes('/services/equipment')) foundType = 'equipment';
            else if (url.includes('/services/professional')) foundType = 'professional';
            else if (url.includes('/agrovets')) foundType = 'agrovet';
            else if (url.includes('/products')) foundType = 'product';
            else foundType = 'land';
            break;
          }
        } catch (e) {
          // ignore and try next
        }
      }

      if (found) {
        setListing(found);
        setListingType(foundType);
      } else {
        setListing(null);
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
    }
    setLoading(false);
  }, [id]);

  const fetchMessages = async (ownerId: string) => {
    try {
      const token =
        localStorage.getItem("kodisha_token") ||
        localStorage.getItem("kodisha_admin_token");
      if (!token) return; // chat only for logged in users

      const res = await fetch(API_ENDPOINTS.messages.withUser(ownerId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const setupSocket = (ownerId: string) => {
    const token =
      localStorage.getItem("kodisha_token") ||
      localStorage.getItem("kodisha_admin_token");
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
      setOwnerOnline(Array.isArray(list) && list.includes(ownerId));
    });

    socketRef.current = socket;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !listing?.owner?._id) return;
    setSending(true);
    try {
      const token =
        localStorage.getItem("kodisha_token") ||
        localStorage.getItem("kodisha_admin_token");
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

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    if (listing?.owner?._id) {
      fetchMessages(listing.owner._id);
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
  }, [listing]);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading listing...</div>;
  }

  if (!listing) {
    return (
      <div className="p-4 text-center text-red-600">
        Listing not found.
      </div>
    );
  }

  const owner = listing.owner || {};
  const coords = listing.coordinates;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {listing.title || listing.name}
          </h1>
          <p className="text-gray-600 mb-4">
            {listing.location?.county}, {listing.location?.constituency},{" "}
            {listing.location?.ward}
          </p>

          {listing.images && listing.images.length > 0 && (
            <div className="mb-6">
              <img
                src={listing.images[0]}
                alt="Property"
                className="w-full h-72 object-cover rounded-lg"
              />

              <div className="grid grid-cols-3 gap-2 mt-2">
                {listing.images.slice(1).map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt="Property"
                    className="h-24 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <span className="text-xl font-semibold text-green-700">
              {listing.price || listing.pricing ? (
                typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : `KES ${listing.price || listing.pricing}`
              ) : null}
            </span>
          </div>

          <p className="text-gray-700 mb-6">{listing.description}</p>

          {/* Details section: land, service, or product-specific */}
          {listingType === 'land' || listing.soilType || listing.size ? (
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h2 className="font-semibold mb-2">Land Details</h2>

              <p><strong>Size:</strong> {listing.size ?? '—'} {listing.size ? 'acres' : ''}</p>
              <p><strong>Soil Type:</strong> {listing.soilType || '—'}</p>
              <p><strong>Water Availability:</strong> {listing.waterAvailability || '—'}</p>
              <p><strong>Organic Certified:</strong> {listing.organicCertified ? "Yes" : "No"}</p>
              <p><strong>Previous Crops:</strong> {Array.isArray(listing.previousCrops) ? listing.previousCrops.join(", ") : listing.previousCrops || '—'}</p>
            </div>
          ) : listingType === 'equipment' || listingType === 'professional' || listingType === 'agrovet' ? (
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h2 className="font-semibold mb-2">Service Details</h2>
              <p><strong>Services / Offerings:</strong> {Array.isArray(listing.services) ? listing.services.join(', ') : listing.services || '—'}</p>
              {listing.pricing && <p><strong>Pricing:</strong> {listing.pricing}</p>}
              {listing.experience && <p><strong>Experience:</strong> {listing.experience}</p>}
              {listing.qualifications && <p><strong>Qualifications:</strong> {listing.qualifications}</p>}
              {typeof listing.operatorIncluded !== 'undefined' && <p><strong>Operator included:</strong> {listing.operatorIncluded ? 'Yes' : 'No'}</p>}
            </div>
          ) : listingType === 'product' ? (
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h2 className="font-semibold mb-2">Product Details</h2>
              <p><strong>Category:</strong> {listing.category || listing.type || '—'}</p>
              {listing.price && <p><strong>Price:</strong> {typeof listing.price === 'number' ? `KES ${listing.price.toLocaleString()}` : listing.price}</p>}
              {listing.unit && <p><strong>Unit:</strong> {listing.unit}</p>}
              {listing.quantity && <p><strong>Quantity:</strong> {listing.quantity}</p>}
            </div>
          ) : null}

          <div className="mt-6">
            <h2 className="font-semibold mb-2">Map Location</h2>

            {!coords ? (
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
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="font-semibold mb-2">Seller Information</h2>

            <p><strong>Name:</strong> {owner.fullName || owner.name}</p>
            <p><strong>Phone:</strong> {owner.phone || "Not provided"}</p>
            <p className="text-sm text-gray-600">
              Status:{" "}
              <span className={ownerOnline ? "text-green-700" : "text-gray-500"}>
                {ownerOnline ? "Online" : "Offline"}
              </span>
            </p>

            {owner.isVerified ? (
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                Verified Seller
              </span>
            ) : (
              <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
                Unverified Seller
              </span>
            )}

            <div className="flex gap-3 mt-4">
              <a
                href={`tel:${owner.phone || ""}`}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm text-center"
              >
                Call Seller
              </a>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Chat with Seller</h3>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-2 mb-3 text-sm space-y-2">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center text-xs">No messages yet.</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded p-2 ${
                      msg.from === owner._id ? "bg-gray-100" : "bg-green-50"
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {msg.from === owner._id ? "Seller" : "You"}
                      {msg.read ? " • Read" : ""}
                    </p>
                    <p className="text-gray-800 text-sm">{msg.body}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                ))
              )}
              {typing && (
                <p className="text-xs text-gray-500 italic">Seller is typing…</p>
              )}
            </div>
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                sendTyping();
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="w-full mt-2 bg-blue-600 text-white rounded-lg py-2 text-sm disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              You must be logged in to send messages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
