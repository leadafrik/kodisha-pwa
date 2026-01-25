import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Heart, X } from 'lucide-react';
import { handleImageError } from "../utils/imageFallback";

const WishlistPage: React.FC = () => {
  // Fetch wishlist
  const { data: wishlist, isLoading, error, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await axios.get('/api/wishlist');
      return response.data.data;
    },
  });

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: async (listingId: string) => {
      await axios.delete(`/api/wishlist/${listingId}`);
    },
    onSuccess: () => refetch(),
  });

  const handleRemove = (listingId: string) => {
    removeMutation.mutate(listingId);
  };

  if (isLoading) return <div className="p-8">Loading wishlist...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading wishlist</div>;

  const items = wishlist?.items || [];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center gap-2 mb-8">
        <Heart size={32} className="fill-red-500 text-red-500" />
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <span className="text-gray-600">({items.length} items)</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-50 p-12 rounded-lg text-center">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg">Your wishlist is empty</p>
          <p className="text-gray-500 text-sm mt-2">
            Save listings to your wishlist for later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <div
              key={item.listing._id}
              className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              {item.listing.images?.[0] && (
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={item.listing.images[0]}
                    alt={item.listing.title}
                    onError={handleImageError}
                    className="w-full h-full object-cover hover:scale-110 transition-transform"
                  />
                  <button
                    onClick={() => handleRemove(item.listing._id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50"
                  >
                    <X size={20} className="text-red-500" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {item.listing.title}
                </h3>

                <div className="mb-3">
                  <p className="text-2xl font-bold text-blue-600">
                    KES {item.listing.price?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.listing.category}
                  </p>
                </div>

                {/* Seller Info */}
                {item.listing.ownerTrustScore !== undefined && (
                  <div className="mb-3 pb-3 border-b">
                    <p className="text-sm text-gray-600">
                      Seller Trust Score:{' '}
                      <span className="font-semibold text-green-600">
                        {item.listing.ownerTrustScore.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="mb-3 bg-blue-50 p-2 rounded text-sm text-gray-700">
                    <p className="font-medium text-gray-600">Your note:</p>
                    <p>{item.notes}</p>
                  </div>
                )}

                {/* Saved Date */}
                <p className="text-xs text-gray-500">
                  Saved {new Date(item.addedAt).toLocaleDateString()}
                </p>

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
                    View Details
                  </button>
                  <button className="w-full px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 font-medium">
                    Message Seller
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
