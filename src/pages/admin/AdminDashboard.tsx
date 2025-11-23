import React, { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS, adminApiRequest } from '../../config/api';
export {}; // Add this line to make it a module

type ListingType = 'land' | 'equipment' | 'professional_services' | 'agrovet';

interface CountBreakdown {
  total: number;
  pending: number;
  verified: number;
}

interface DashboardStats {
  totalListings: number;
  pendingListings: number;
  verifiedListings: number;
  totalUsers: number;
  breakdown?: Partial<Record<ListingType, CountBreakdown>>;
}

interface AdminListing {
  _id: string;
  listingType: ListingType;
  type?: string;
  title: string;
  description: string;
  status?: string;
  isVerified?: boolean;
  price?: number;
  priceType?: string;
  size?: number;
  location?: {
    county?: string;
    constituency?: string;
    ward?: string;
    approximateLocation?: string;
  };
  images: string[];
  contact?: string;
  services?: string[];
  categories?: any;
  createdAt?: string;
  ownerTrustScore?: number;
  ownerTrustLevel?: "very_low" | "low" | "medium" | "high" | "very_high";
}

const listingTypeMeta: Record<
  ListingType,
  { label: string; color: string; pill: string; icon: string }
> = {
  land: {
    label: 'Land Listing',
    color: 'text-green-700',
    pill: 'bg-green-100 text-green-800',
    icon: '🌾',
  },
  equipment: {
    label: 'Equipment Service',
    color: 'text-orange-700',
    pill: 'bg-orange-100 text-orange-800',
    icon: '🚜',
  },
  professional_services: {
    label: 'Professional Service',
    color: 'text-purple-700',
    pill: 'bg-purple-100 text-purple-800',
    icon: '🧑‍🔧',
  },
  agrovet: {
    label: 'Agrovet / Inputs',
    color: 'text-blue-700',
    pill: 'bg-blue-100 text-blue-800',
    icon: '🧪',
  },
};

const normalizeServices = (services: any): string[] => {
  if (!services) return [];
  if (Array.isArray(services)) return services.filter(Boolean);
  if (typeof services === 'string') {
    return services
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const formatLocation = (location?: AdminListing['location']) => {
  if (!location) return 'Location not provided';
  const { ward, constituency, county } = location;
  const parts = [ward, constituency, county].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not provided';
};

const formatPrice = (price?: number, priceType?: string) => {
  if (typeof price !== 'number') return 'N/A';
  const suffix = priceType ? ` (${priceType.replace('-', ' ')})` : '';
  return `Ksh ${price.toLocaleString()}${suffix}`;
};

const trustLevelMeta: Record<
  NonNullable<AdminListing['ownerTrustLevel']>,
  { label: string; color: string; bg: string }
> = {
  very_low: { label: 'Very Low Trust', color: 'text-red-700', bg: 'bg-red-100' },
  low: { label: 'Low Trust', color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { label: 'Medium Trust', color: 'text-amber-700', bg: 'bg-amber-100' },
  high: { label: 'High Trust', color: 'text-green-700', bg: 'bg-green-100' },
  very_high: { label: 'Very High Trust', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

const AdminDashboard: React.FC = () => {
  const [pendingListings, setPendingListings] = useState<AdminListing[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    pendingListings: 0,
    verifiedListings: 0,
    totalUsers: 0,
    breakdown: undefined,
  });
  const [loading, setLoading] = useState(true);

  const normalizeListing = (listing: any): AdminListing => {
    const rawType = (listing.listingType || listing.type) as string;
    const derivedType: ListingType =
      rawType === 'equipment' || rawType === 'professional_services' || rawType === 'agrovet'
        ? (rawType as ListingType)
        : 'land';

    const services = normalizeServices(listing.services);

    return {
      _id: listing._id || listing.id,
      listingType: derivedType,
      type: listing.type,
      title: listing.title || listing.name || 'Listing',
      description: listing.description || '',
      status: listing.status,
      isVerified: listing.isVerified ?? listing.verified ?? false,
      price: listing.price,
      priceType: listing.priceType,
      size: listing.size,
      location:
        listing.location || {
          county: listing.county,
          constituency: listing.constituency,
          ward: listing.ward,
          approximateLocation: listing.approximateLocation,
        },
      images: listing.images || [],
      contact:
        listing.contact ||
        listing.owner?.phone ||
        listing.owner?.email ||
        listing.owner?.contact ||
        '',
      services,
      categories: listing.categories,
      createdAt: listing.createdAt,
    };
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, listingsData] = await Promise.all([
        adminApiRequest(API_ENDPOINTS.admin.dashboard),
        adminApiRequest(API_ENDPOINTS.admin.listings.getPending),
      ]);

      if (statsData?.success !== false) {
        setStats({
          totalListings: statsData.data?.totalListings ?? 0,
          pendingListings: statsData.data?.pendingListings ?? 0,
          verifiedListings: statsData.data?.verifiedListings ?? 0,
          totalUsers: statsData.data?.totalUsers ?? 0,
          breakdown: statsData.data?.breakdown,
        });
      }

      if (listingsData?.success !== false) {
        const items = (listingsData.data || []).map(normalizeListing);
        setPendingListings(items);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      alert(
        error?.message ||
          'Could not load dashboard data. Please confirm you are logged in as an admin.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const verifyListing = async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      await adminApiRequest(API_ENDPOINTS.admin.listings.verify(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      alert(`Listing ${status} successfully!`);
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      console.error('Error verifying listing:', error);
      alert(error?.message || 'Error verifying listing');
    }
  };

  const deleteListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await adminApiRequest(API_ENDPOINTS.admin.listings.getById(id), {
        method: 'DELETE',
      });

      alert('Listing deleted successfully!');
      fetchDashboardData(); // Refresh data
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
          <p className="text-gray-600">
            Manage verification for land, equipment, professional services, and agrovets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalListings}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingListings}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.verifiedListings}
                </p>
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

        {stats.breakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {(['land', 'equipment', 'professional_services', 'agrovet'] as ListingType[]).map(
              (type) => {
                const meta = listingTypeMeta[type];
                const counts = stats.breakdown?.[type] || {
                  total: 0,
                  pending: 0,
                  verified: 0,
                };

                return (
                  <div
                    key={type}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{meta.icon}</span>
                        <div>
                          <p className="text-sm text-gray-600">{meta.label}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {counts.total} total
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 text-right space-y-1">
                        <p>
                          Pending:{' '}
                          <span className="font-semibold text-yellow-700">
                            {counts.pending}
                          </span>
                        </p>
                        <p>
                          Verified:{' '}
                          <span className="font-semibold text-green-700">
                            {counts.verified}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* Pending Listings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Pending Verification</h2>
            <p className="text-gray-600 text-sm">
              {pendingListings.length} listings waiting for approval
            </p>
          </div>

          {pendingListings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending listings</h3>
              <p className="text-gray-500">All listings have been verified!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingListings.map((listing) => {
                const meta = listingTypeMeta[listing.listingType];
                const hasServices = listing.services && listing.services.length > 0;
                const trustMeta = listing.ownerTrustLevel
                  ? trustLevelMeta[listing.ownerTrustLevel]
                  : null;

                return (
                  <div key={listing._id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Listing Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.pill}`}
                              >
                                {meta.icon} {meta.label}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {listing.status?.replace(/_/g, ' ') || 'pending verification'}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {listing.title}
                            </h3>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">{listing.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-900">
                              <span className="font-medium">Location:</span>{' '}
                              {formatLocation(listing.location)}
                            </p>
                            {listing.listingType === 'land' ? (
                              <>
                                <p className="text-gray-900">
                                  <span className="font-medium">Price:</span>{' '}
                                  {formatPrice(listing.price, listing.priceType)}
                                </p>
                                <p className="text-gray-900">
                                  <span className="font-medium">Size:</span>{' '}
                                  {listing.size ? `${listing.size} acres` : 'N/A'}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-900">
                                <span className="font-medium">Category:</span> {meta.label}
                              </p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-900">
                              <span className="font-medium">Contact:</span>{' '}
                              {listing.contact || 'Not provided'}
                            </p>
                            <p className="text-gray-900">
                              <span className="font-medium">Status:</span>{' '}
                              {listing.status?.replace(/_/g, ' ') || 'pending verification'}
                            </p>
                            <p className="text-gray-900">
                              <span className="font-medium">Created:</span>{' '}
                              {listing.createdAt
                                ? new Date(listing.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </p>
                            {trustMeta && (
                              <p className="text-gray-900">
                                <span className="font-medium">Owner Trust:</span>{' '}
                                <span className={`${trustMeta.color} px-2 py-0.5 rounded-full text-xs ${trustMeta.bg}`}>
                                  {trustMeta.label}
                                  {listing.ownerTrustScore != null ? ` (${listing.ownerTrustScore})` : ''}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {listing.listingType !== 'land' && hasServices && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                            <div className="flex gap-2 flex-wrap">
                              {listing.services!.slice(0, 8).map((service, index) => (
                                <span
                                  key={`${listing._id}-svc-${index}`}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                >
                                  {service}
                                </span>
                              ))}
                              {listing.services!.length > 8 && (
                                <span className="text-xs text-gray-500">
                                  +{listing.services!.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Images Preview */}
                        {listing.images.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Images:</p>
                            <div className="flex gap-2 flex-wrap">
                              {listing.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Listing ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
