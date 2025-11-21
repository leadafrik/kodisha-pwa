import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import GoogleMapsLoader from "../components/GoogleMapsLoader";
import ListingMap from "../components/ListingMap";

const ListingDetails: React.FC = () => {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (data.success) {
        setListing(data.data);
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Loading listing...
      </div>
    );
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
    <div className="p-4 max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {listing.title}
      </h1>

      {/* Location */}
      <p className="text-gray-600 mb-4">
        {listing.location?.county}, {listing.location?.constituency},{" "}
        {listing.location?.ward}
      </p>

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <div className="mb-6">
          <img
            src={listing.images[0]}
            alt="Property"
            className="w-full h-64 object-cover rounded-lg"
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

      {/* Price */}
      <div className="mb-4">
        <span className="text-xl font-semibold text-green-700">
          KES {listing.price.toLocaleString()}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-6">{listing.description}</p>

      {/* Property details */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Land Details</h2>

        <p><strong>Size:</strong> {listing.size} acres</p>
        <p><strong>Soil Type:</strong> {listing.soilType}</p>
        <p><strong>Water Availability:</strong> {listing.waterAvailability}</p>
        <p><strong>Organic Certified:</strong> {listing.organicCertified ? "Yes" : "No"}</p>
        <p><strong>Previous Crops:</strong> {listing.previousCrops?.join(", ")}</p>
      </div>

      {/* MAP SECTION */}
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

         {/* Coordinates text */}
         <p className="text-gray-500 text-xs mt-2">
           Coordinates: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
         </p>

         {/* Open in Google Maps */}
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

      {/* Seller info */}
      <div className="bg-white p-4 rounded-lg mt-6 border">
        <h2 className="font-semibold mb-2">Seller Information</h2>

        <p><strong>Name:</strong> {owner.fullName || owner.name}</p>
        <p><strong>Phone:</strong> {owner.phone}</p>

        {owner.isVerified ? (
          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
            ✔ Verified Seller
          </span>
        ) : (
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">
            ⚠ Unverified Seller
          </span>
        )}

        <div className="flex gap-3 mt-4">
          {/* Call button */}
          <a
            href={`tel:${owner.phone}`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
          >
            Call Seller
          </a>

          {/* Chat button - future */}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Chat Seller
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
