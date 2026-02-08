import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import UserRatingBadge from './UserRatingBadge';

interface Rating {
  _id: string;
  score: number;
  review?: string;
  raterId: {
    _id: string;
    fullName: string;
  };
  category: string;
  createdAt: string;
}

interface UserRatingsListProps {
  userId: string;
  maxReviews?: number;
}

const UserRatingsList: React.FC<UserRatingsListProps> = ({ userId, maxReviews = 5 }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [aggregate, setAggregate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/ratings/user/${userId}`
        );
        setRatings(response.data.data.ratings);
        setAggregate(response.data.data.aggregate);
      } catch (err: any) {
        setError('Failed to load ratings');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [userId]);

  if (loading) {
    return <div className="text-center text-gray-600">Loading ratings...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  const displayRatings = ratings.slice(0, maxReviews);

  return (
    <div className="space-y-6">
      {/* Aggregate Rating */}
      {aggregate && (
        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Seller Ratings</h3>
          <UserRatingBadge rating={aggregate} showCount={true} size="lg" verified={true} />
          
          {/* Category Breakdown */}
          {aggregate.breakdown && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {Object.entries(aggregate.breakdown).map(([category, score]: [string, any]) => (
                score > 0 && (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize text-gray-600">{category}:</span>
                    <span className="font-semibold text-gray-900">
                      {(score / (aggregate.count || 1)).toFixed(1)}/5
                    </span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      {displayRatings.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Recent Reviews</h4>
          {displayRatings.map((rating) => (
            <div key={rating._id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{rating.raterId.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating.score
                          ? 'text-yellow-500 fill-yellow-400'
                          : 'text-gray-300 fill-transparent'
                      }`}
                      strokeWidth={2}
                    />
                  ))}
                </div>
              </div>

              {rating.category && rating.category !== 'overall' && (
                <p className="text-xs text-gray-500 mb-2">
                  Rating: <span className="capitalize font-semibold">{rating.category}</span>
                </p>
              )}

              {rating.review && (
                <p className="text-gray-700 text-sm">{rating.review}</p>
              )}
            </div>
          ))}

          {ratings.length > maxReviews && (
            <button className="w-full py-2 text-center text-green-600 font-semibold hover:text-green-700">
              View all {ratings.length} reviews
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
};

export default UserRatingsList;
