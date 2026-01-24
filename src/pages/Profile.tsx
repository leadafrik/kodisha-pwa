import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import { scheduleAccountDeletion } from "../services/userService";
import { Shield } from "lucide-react";

const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { properties, serviceListings, productListings } = useProperties();
  const navigate = useNavigate();
  const [userProfilePicture, setUserProfilePicture] = useState<string | undefined>(user?.profilePicture);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Update local state when user context changes
  React.useEffect(() => {
    setUserProfilePicture(user?.profilePicture);
  }, [user?.profilePicture]);

  // Safety check: ensure all listing arrays are valid
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeServiceListings = Array.isArray(serviceListings) ? serviceListings : [];
  const safeProductListings = Array.isArray(productListings) ? productListings : [];

  if (!user) {
    navigate("/login");
    return null;
  }

  const userProperties = safeProperties.filter((p) => p?.listedBy === "Current User");
  const userServices = safeServiceListings.filter((s) => s?.contact === user?.phone || s?.ownerId === user?.id || s?.ownerId === user?._id);
  const userAgrovets = safeServiceListings.filter((s) => s?.type === "agrovet" && (s?.contact === user?.phone || s?.ownerId === user?.id || s?.ownerId === user?._id));
  const userProducts = safeProductListings.filter((p) => p?.seller?._id === user?._id || p?.seller?.email === user?.email || p?.contact === user?.phone);

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case "verified":
        return (
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Source+Sans+3:wght@400;600;700&display=swap');
        .profile-shell {
          font-family: "Source Sans 3", "Segoe UI", "Tahoma", sans-serif;
        }
        .profile-title {
          font-family: "Space Grotesk", "Segoe UI", "Tahoma", sans-serif;
        }
      `}</style>
      <div className="profile-shell">
        <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex-1">
            <h1 className="profile-title text-3xl font-bold text-slate-900 mb-2">{user.name}</h1>
            <div className="flex items-center gap-4 mb-2">
              {getVerificationBadge()}
              <span className="text-slate-600">{getUserTypeLabel()}</span>
            </div>
            {/* Avoid duplicate contact lines when email-only signup stores email in phone */}
            {user.phone && user.phone !== user.email && (
              <p className="text-slate-600">{user.phone}</p>
            )}
            {user.email && <p className="text-slate-600">{user.email}</p>}
          </div>
          <div className="flex flex-col items-end gap-4">
            <ProfilePictureUpload 
              currentPicture={userProfilePicture}
              onUploadSuccess={(picture) => {
                setUserProfilePicture(picture);
                // Update user context to persist the change
                updateProfile({ profilePicture: picture });
              }}
              onDeleteSuccess={() => {
                setUserProfilePicture(undefined);
                // Update user context
                updateProfile({ profilePicture: undefined });
              }}
            />
            <button
              onClick={logout}
              className="border border-red-200 text-red-600 px-6 py-2 rounded-2xl hover:bg-red-50 transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Verification level</p>
            <p className="text-lg font-bold text-blue-900 mt-2">
              {verificationDetails.verificationLevel || "Not set"}
            </p>
            <p className="text-sm text-sky-600 mt-1">
              Trust score: {verificationDetails.trustScore ?? "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold text-emerald-700 uppercase mb-3">Verification checklist</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {verificationItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-slate-900">
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

      {/* ID Verification Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-emerald-600" size={28} />
              <h2 className="text-2xl font-bold text-slate-900">Identity Verification</h2>
            </div>
            <p className="text-slate-600 mb-4">
              {verificationDetails.idVerified
                ? "Your identity has been verified"
                : "Verify your identity to build trust and unlock premium features"}
            </p>
            {!verificationDetails.idVerified && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900 mb-4">
                <p className="font-semibold mb-2">Benefits of ID verification:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Display an "ID Verified" badge on your profile and listings</li>
                  <li>Increase buyer confidence and trust</li>
                  <li>Higher visibility in marketplace search results</li>
                  <li>Priority support from the Agrisoko team</li>
                </ul>
              </div>
            )}
          </div>
          <Link
            to="/verify-id"
            className={`px-6 py-2 rounded-2xl font-semibold transition whitespace-nowrap ${
              verificationDetails.idVerified
                ? "bg-gray-200 text-slate-600 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
            onClick={(e) => verificationDetails.idVerified && e.preventDefault()}
          >
            {verificationDetails.idVerified ? "Verified" : "Get Verified"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600 mb-2">{userProperties.length}</div>
          <div className="text-slate-600 text-sm">Land Listings</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div className="text-3xl font-bold text-sky-600 mb-2">{userServices.length}</div>
          <div className="text-slate-600 text-sm">Services</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{userAgrovets.length}</div>
          <div className="text-slate-600 text-sm">Agrovets</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{userProducts.length}</div>
          <div className="text-slate-600 text-sm">Products</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/create-listing"
            className="bg-emerald-600 text-white p-6 rounded-xl hover:bg-emerald-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">List for Sale</div>
            <div className="text-emerald-100 text-sm">Products, livestock, inputs, services</div>
          </Link>
          <Link
            to="/request/new"
            className="bg-sky-600 text-white p-6 rounded-xl hover:bg-sky-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">Post Buy Request</div>
            <div className="text-sky-100 text-sm">Share what you're looking for</div>
          </Link>
          <Link
            to="/favorites"
            className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">Saved Listings</div>
            <div className="text-purple-100 text-sm">View your favorites</div>
          </Link>
          {user.type === "admin" && (
            <Link
              to="/admin/dashboard"
              className="bg-red-600 text-white p-6 rounded-xl hover:bg-red-700 transition duration-300 text-center"
            >
              <div className="font-semibold text-lg">Admin Panel</div>
              <div className="text-red-100 text-sm">Manage marketplace</div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Listings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Land Listings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Your Land Listings</h3>
          {userProperties.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No land listings yet</p>
              <Link to="/create-listing" className="text-emerald-600 font-semibold mt-2 inline-block">
                List your first property
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userProperties.slice(0, 3).map((property) => (
                <div key={property.id} className="border border-slate-200 rounded-2xl p-3 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 text-sm">{property.title}</h4>
                  <p className="text-emerald-600 font-bold text-sm">KSh {property.price?.toLocaleString() || 'N/A'}</p>
                  <p className="text-slate-600 text-xs">{property.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buyer Requests Posted */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Your Buyer Requests</h3>
          <div className="text-center py-8 text-slate-500">
            <p>View and manage your posted needs</p>
            <Link to="/request" className="text-indigo-600 font-semibold mt-2 inline-block">
              View your requests
            </Link>
          </div>
        </div>

        {/* Service Listings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Your Service Listings</h3>
          {userServices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No service listings yet</p>
              <Link to="/create-listing" className="text-sky-600 font-semibold mt-2 inline-block">
                List your first service
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userServices.slice(0, 3).map((service) => (
                <div key={service.id} className="border border-slate-200 rounded-2xl p-3 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 text-sm">{service.name}</h4>
                  <p className="text-slate-600 text-xs">{service.type}</p>
                  <p className="text-slate-600 text-xs">{service.location?.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agrovet Listings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Your Agrovet Listings</h3>
          {userAgrovets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No agrovet listings yet</p>
              <Link to="/create-listing" className="text-purple-600 font-semibold mt-2 inline-block">
                List your agrovet from the main listing flow
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userAgrovets.slice(0, 3).map((agrovet) => (
                <div key={agrovet.id} className="border border-slate-200 rounded-2xl p-3 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 text-sm">{agrovet.name}</h4>
                  <p className="text-slate-600 text-xs">
                    {Array.isArray(agrovet.services) ? agrovet.services.slice(0, 2).join(', ') : 'Services available'}
                  </p>
                  <p className="text-slate-600 text-xs">{agrovet.location?.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Listings */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Your Product Listings</h3>
          {userProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No product listings yet</p>
              <Link to="/create-listing" className="text-orange-600 font-semibold mt-2 inline-block">
                List your first product
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userProducts.slice(0, 3).map((product) => (
                <div key={product._id || product.id} className="border border-slate-200 rounded-2xl p-3 hover:shadow-md transition">
                  <h4 className="font-semibold text-slate-900 text-sm">{product.name || product.title}</h4>
                  <p className="text-orange-600 font-bold text-sm">KSh {product.price?.toLocaleString() || 'N/A'}</p>
                  <p className="text-slate-600 text-xs">{product.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Management - Danger Zone */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Account Settings</h3>
          {deleteError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
              {deleteError}
            </div>
          )}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-600 mb-4">
              Once you delete your account, there is no going back. Your account, listings, and messages will be permanently deleted.
            </p>
            <button
              onClick={async () => {
                const confirmDelete = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
                if (confirmDelete) {
                  const confirmType = window.confirm('Type DELETE to confirm account deletion. Once deleted, your account cannot be recovered.');
                  if (confirmType) {
                    setDeletingAccount(true);
                    setDeleteError(null);
                    try {
                      await scheduleAccountDeletion();
                      window.alert('Your account has been scheduled for deletion. You have 30 days to reactivate it before permanent deletion.');
                      logout();
                      navigate('/login');
                    } catch (err: any) {
                      setDeleteError(err.message || 'Failed to delete account');
                      setDeletingAccount(false);
                    }
                  }
                }
              }}
              disabled={deletingAccount}
              className="w-full border border-red-200 text-red-700 bg-white px-6 py-3 rounded-2xl font-semibold tracking-wide hover:bg-red-50 transition duration-300 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
            >
              {deletingAccount ? 'Deleting account...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default Profile;
