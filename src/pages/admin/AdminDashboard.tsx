import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, adminApiRequest } from '../../config/api';
export {}; // Add this line to make it a module

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  size: number;
  location: {
    county: string;
    constituency: string;
    ward: string;
    approximateLocation: string;
  };
  images: string[];
  contact: string;
  verified?: boolean;
  status?: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingListings: 0,
    verifiedListings: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [statsData, listingsData] = await Promise.all([
        adminApiRequest(API_ENDPOINTS.admin.dashboard),
        adminApiRequest(API_ENDPOINTS.admin.listings.getPending),
      ]);

      if (statsData?.success && statsData.data) setStats(statsData.data);
      if (listingsData?.success && listingsData.data) setPendingListings(listingsData.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.message || 'Failed to load admin data. Check your admin login/token.');
    } finally {
      setLoading(false);
    }
  };

  const verifyListing = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const data = await adminApiRequest(API_ENDPOINTS.admin.listings.verify(id), {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      if (data.success) {
        fetchDashboardData(); // Refresh data
      } else {
        alert('Error: ' + (data.message || 'Could not update listing'));
      }
    } catch (error: any) {
      console.error('Error verifying listing:', error);
      alert(error?.message || 'Error verifying listing');
    }
  };

  const deleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const data = await adminApiRequest(API_ENDPOINTS.admin.listings.getById(id), {
        method: 'DELETE',
      });

      if (data.success) {
        fetchDashboardData(); // Refresh data
      } else {
        alert('Error: ' + (data.message || 'Could not delete listing'));
      }
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      alert(error?.message || 'Error deleting listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage land listing verifications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalListings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingListings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.verifiedListings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Listings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Pending Verification</h2>
            <p className="text-gray-600 text-sm">
              {pendingListings.length} listings waiting for approval
            </p>
            {error && (
              <p className="text-red-600 text-sm mt-2">
                {error}
              </p>
            )}
          </div>

          {pendingListings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending listings</h3>
              <p className="text-gray-500">All listings have been verified!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingListings.map((listing) => (
                <div key={listing._id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Listing Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-900">
                            <span className="font-medium">Location:</span> {listing.location.approximateLocation}, {listing.location.ward}, {listing.location.constituency}, {listing.location.county}
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium">Price:</span> Ksh {listing.price.toLocaleString()} per season
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-900">
                            <span className="font-medium">Size:</span> {listing.size} acres
                          </p>
                          <p className="text-gray-900">
                            <span className="font-medium">Contact:</span> {listing.contact}
                          </p>
                        </div>
                      </div>

                      {/* Images Preview */}
                      {listing.images.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Images:</p>
                          <div className="flex gap-2 flex-wrap">
                            {listing.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Listing image ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-3">
                        Listed on: {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:gap-3">
                      <button
                        onClick={() => verifyListing(listing._id, 'approved')}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => verifyListing(listing._id, 'rejected')}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        ❌ Reject
                      </button>
                      <button
                        onClick={() => deleteListing(listing._id)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
