import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { properties, serviceListings } = useProperties();
  const navigate = useNavigate();

  // Safety check: ensure properties and serviceListings are arrays
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeServiceListings = Array.isArray(serviceListings) ? serviceListings : [];

  if (!user) {
    navigate("/login");
    return null;
  }

  const userProperties = safeProperties.filter((p) => p?.listedBy === "Current User");
  const userServices = safeServiceListings.filter((s) => s?.contact === user?.phone);

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case "verified":
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
            Pending
          </span>
        );
      default:
        return (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
            Not Verified
          </span>
        );
    }
  };

  const getUserTypeLabel = () => {
    switch (user.type) {
      case "buyer":
        return "Buyer";
      case "seller":
        return "Seller";
      case "service_provider":
        return "Service Provider";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  const verificationDetails: {
    phoneVerified?: boolean;
    idVerified?: boolean;
    selfieVerified?: boolean;
    ownershipVerified?: boolean;
    businessVerified?: boolean;
    verificationLevel?: string;
    trustScore?: number;
  } = user?.verification || {};

  const verificationItems = [
    { label: "Phone verified", value: verificationDetails.phoneVerified ?? false },
    { label: "ID verified", value: verificationDetails.idVerified ?? false },
    { label: "Selfie verified", value: verificationDetails.selfieVerified ?? false },
    { label: "Ownership verified", value: verificationDetails.ownershipVerified ?? false },
    { label: "Business verified", value: verificationDetails.businessVerified ?? false },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.name}</h1>
            <div className="flex items-center gap-4 mb-2">
              {getVerificationBadge()}
              <span className="text-gray-600">{getUserTypeLabel()}</span>
            </div>
            {/* Avoid duplicate contact lines when email-only signup stores email in phone */}
            {user.phone && user.phone !== user.email && (
              <p className="text-gray-600">{user.phone}</p>
            )}
            {user.email && <p className="text-gray-600">{user.email}</p>}
          </div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-300"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Verification level</p>
            <p className="text-lg font-semibold text-gray-900">
              {verificationDetails.verificationLevel || "Not set"}
            </p>
            <p className="text-sm text-gray-500">
              Trust score: {verificationDetails.trustScore ?? "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Verification checklist</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {verificationItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-gray-800">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      item.value ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{userProperties.length}</div>
          <div className="text-gray-600">Land Listings</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{userServices.length}</div>
          <div className="text-gray-600">Service Listings</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {user.verificationStatus === "verified" ? "Verified" : "Not Verified"}
          </div>
          <div className="text-gray-600">Account Status</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/list?category=land"
            className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">List Land</div>
            <div className="text-green-100 text-sm">Sell or rent out your land</div>
          </Link>
          <Link
            to="/list?category=service"
            className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">List Service</div>
            <div className="text-blue-100 text-sm">Offer professional services</div>
          </Link>
          <Link
            to="/list-service"
            className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">List Equipment</div>
            <div className="text-purple-100 text-sm">Rent out farm equipment</div>
          </Link>
          <Link
            to="/list?category=product"
            className="bg-orange-600 text-white p-6 rounded-xl hover:bg-orange-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">List Product</div>
            <div className="text-orange-100 text-sm">Sell agricultural products</div>
          </Link>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Land Listings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Land Listings</h3>
          {userProperties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No land listings yet</p>
              <Link to="/list?category=land" className="text-green-600 font-semibold mt-2 inline-block">
                List your first property
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userProperties.slice(0, 3).map((property) => (
                <div key={property.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800">{property.title}</h4>
                  <p className="text-green-600 font-bold">KSh {property.price.toLocaleString()}</p>
                  <p className="text-gray-600 text-sm">{property.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Listings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Service Listings</h3>
          {userServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No service listings yet</p>
              <Link to="/list?category=service" className="text-blue-600 font-semibold mt-2 inline-block">
                List your first service
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userServices.slice(0, 3).map((service) => (
                <div key={service.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800">{service.name}</h4>
                  <p className="text-gray-600 text-sm">{service.type}</p>
                  <p className="text-gray-600 text-sm">{service.location.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
