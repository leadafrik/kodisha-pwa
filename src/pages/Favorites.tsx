import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../utils/auth';
import { Link } from 'react-router-dom';

interface FavoriteItem {
  listingId: string;
  listingType: string;
  addedAt: string;
  data: any;
}

const Favorites: React.FC = () => {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = getAuthToken();
      if (!token) { setLoading(false); return; }
      try {
        const resp = await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
        if (resp.ok) {
          const j = await resp.json();
          if (j.success) setItems(j.data);
        }
      } catch (e) {
        console.error('Load favorites error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6">Loading saved listings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Saved Listings</h1>
      {items.length === 0 && (
        <p className="text-gray-600">You have not saved any listings yet. Click the <strong>Save</strong> button on a listing to add it here.</p>
      )}
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        {items.map(item => {
          const l = item.data;
          const title = l.title || l.name || 'Untitled';
          const image = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : 'https://via.placeholder.com/400x300?text=No+Image';
          const location = l.location ? [l.location.county, l.location.constituency, l.location.ward].filter(Boolean).join(', ') : 'Location N/A';
          return (
            <Link key={item.listingId} to={`/listings/${item.listingId}`} className="group border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
              <div className="h-40 bg-gray-100 overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-lg truncate">{title}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{item.listingType}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{location}</p>
                {l.price && (
                  <p className="text-sm font-medium">KES {l.price}</p>
                )}
                <p className="text-xs text-gray-500">Saved {new Date(item.addedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Favorites;
