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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex-1">
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
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-300"
            >
              Logout
            </button>
          </div>
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

      {/* ID Verification Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-green-600" size={28} />
              <h2 className="text-2xl font-bold text-gray-800">Identity Verification</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {verificationDetails.idVerified
                ? "✓ Your identity has been verified"
                : "Verify your identity to build trust and unlock premium features"}
            </p>
            {!verificationDetails.idVerified && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
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
            className={`px-6 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
              verificationDetails.idVerified
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            onClick={(e) => verificationDetails.idVerified && e.preventDefault()}
          >
            {verificationDetails.idVerified ? "Verified" : "Get Verified"}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{userProducts.length + userServices.length + userProperties.length}</div>
          <div className="text-gray-600 text-sm">Marketplace Listings</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{userAgrovets.length}</div>
          <div className="text-gray-600 text-sm">Agrovet Listings</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/create-listing"
            className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">List Item</div>
            <div className="text-green-100 text-sm">Sell products or offer services</div>
          </Link>
          <Link
            to="/create-buyer-request"
            className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition duration-300 text-center"
          >
            <div className="font-semibold text-lg">Post Need</div>
            <div className="text-blue-100 text-sm">Post what you're looking for</div>
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
        {/* Marketplace Listings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Marketplace Listings</h3>
          {userProducts.length === 0 && userProperties.length === 0 && userServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No marketplace listings yet</p>
              <Link to="/create-listing" className="text-green-600 font-semibold mt-2 inline-block">
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...userProducts, ...userProperties, ...userServices].slice(0, 5).map((listing) => (
                <div key={listing.id} className="border rounded-lg p-3 hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-800 text-sm">{listing.title || listing.name}</h4>
                  <p className="text-green-600 font-bold text-sm">KSh {listing.price?.toLocaleString() || listing.pricing || 'N/A'}</p>
                  <p className="text-gray-600 text-xs">{listing.location?.county || listing.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agrovet Listings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Agrovet Listings</h3>
          {userAgrovets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No agrovet listings yet</p>
              <Link to="/create-listing" className="text-purple-600 font-semibold mt-2 inline-block">
                Create an agrovet listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userAgrovets.slice(0, 3).map((agrovet) => (
                <div key={agrovet.id} className="border rounded-lg p-3 hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-800 text-sm">{agrovet.name}</h4>
                  <p className="text-gray-600 text-xs">
                    {Array.isArray(agrovet.services) ? agrovet.services.slice(0, 2).join(', ') : 'Services available'}
                  </p>
                  <p className="text-gray-600 text-xs">{agrovet.location?.county} County</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Management - Subtle Section */}
        <div className="mt-8 border-t pt-6">
          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {deleteError}
            </div>
          )}
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete your account? This will:\n\n• Remove all your listings\n• Delete all your data\n• Unverify your account\n\nThis action cannot be undone.')) {
                if (window.confirm('Type "DELETE" to confirm account deletion. Once deleted, your account cannot be recovered.')) {
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
            className="text-sm text-gray-500 hover:text-red-600 disabled:text-gray-400 transition duration-300 underline disabled:cursor-not-allowed"
          >
            {deletingAccount ? 'Deleting account...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
