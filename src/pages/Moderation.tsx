import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiRequest } from '../config/api';

interface ModerationListing {
  _id: string;
  listingType: 'land' | 'equipment' | 'professional_services' | 'agrovet' | 'product';
  title?: string;
  description?: string;
  status?: string;
  isVerified?: boolean;
  verified?: boolean;
  createdAt?: string;
  location?: {
    county?: string;
    constituency?: string;
    ward?: string;
    approximateLocation?: string;
  };
  price?: number;
  contact?: string;
  owner?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const Moderation: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ModerationListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const adminToken =
      localStorage.getItem('kodisha_admin_token') ||
      localStorage.getItem('kodisha_token') ||
      localStorage.getItem('token');
    if (!adminToken) {
      navigate('/login');
      return;
    }
    fetchListings();
  }, [navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError('');
      const [pending, approved] = await Promise.all([
        adminApiRequest('/admin/listings/pending'),
        adminApiRequest('/admin/listings/approved'),
      ]);
      const combined = [
        ...(pending?.data || pending?.listings || []),
        ...(approved?.data || approved?.listings || []),
      ];
      setListings(combined);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError('Failed to fetch listings for moderation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      setActionLoading(listingId);
      const response = await adminApiRequest(`/admin/listings/${listingId}`, {
        method: 'DELETE',
      });
      if (response.success) {
        setListings((prev) => prev.filter((item) => item._id !== listingId));
      } else {
        alert(response.message || 'Failed to delete listing');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting listing');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((item) => {
      const title = item.title?.toLowerCase() || '';
      const contact = item.contact?.toLowerCase() || '';
      const ownerName = item.owner?.name?.toLowerCase() || '';
      const ownerEmail = item.owner?.email?.toLowerCase() || '';
      return (
        title.includes(needle) ||
        contact.includes(needle) ||
        ownerName.includes(needle) ||
        ownerEmail.includes(needle)
      );
    });
  }, [listings, query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Moderation Queue</h1>
          <p className="text-gray-600">Loading flagged users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Content Moderation</h1>
            <p className="text-gray-600 text-sm">Review every listing and remove violations fast.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 border">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search listings by title, seller, or contact..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No listings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((item) => (
              <div key={item._id} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{item.title || 'Listing'}</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded capitalize">
                        {item.listingType.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                        {item.status || (item.isVerified ? 'active' : 'pending')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {item.owner?.name && <p><strong>Seller:</strong> {item.owner.name}</p>}
                      {item.owner?.email && <p><strong>Email:</strong> {item.owner.email}</p>}
                      {item.contact && <p><strong>Contact:</strong> {item.contact}</p>}
                      {item.location?.county && (
                        <p><strong>Location:</strong> {[item.location.county, item.location.constituency].filter(Boolean).join(', ')}</p>
                      )}
                      {item.price && (
                        <p><strong>Price:</strong> KES {item.price.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(item._id)}
                      disabled={actionLoading === item._id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {actionLoading === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;
