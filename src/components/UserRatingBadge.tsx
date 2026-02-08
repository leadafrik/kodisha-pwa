import React from 'react';
import { CheckCircle, Star } from 'lucide-react';

interface UserRating {
  average: number;
  count: number;
}

interface UserRatingBadgeProps {
  rating?: UserRating;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  verified?: boolean;
}

const UserRatingBadge: React.FC<UserRatingBadgeProps> = ({ 
  rating, 
  showCount = true, 
  size = 'md',
  verified = false 
}) => {
  if (!rating || rating.count === 0) {
    return (
      <div className={`flex items-center gap-2 ${
        size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
      }`}>
        <span className="text-gray-400">No ratings yet</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
  };

  const starSize = sizeClasses[size];
  const ratingSummary = `${rating.average.toFixed(1)} out of 5 from ${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}`;

  return (
    <div className={`flex items-center gap-2 ${
      size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
    }`} aria-label={ratingSummary}>
      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${
              i < Math.round(rating.average)
                ? 'text-yellow-500 fill-yellow-400'
                : 'text-gray-300 fill-transparent'
            }`}
            strokeWidth={2}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Rating value */}
      <span className="font-semibold text-gray-800">{rating.average.toFixed(1)}</span>

      {/* Count */}
      {showCount && (
        <span className="text-gray-500">
          ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
        </span>
      )}

      {/* Verified badge */}
      {verified && (
        <>
          <CheckCircle className={`${starSize} text-green-600 fill-current ml-1`} aria-hidden="true" />
          <span className="sr-only">Verified profile</span>
        </>
      )}
    </div>
  );
};

export default UserRatingBadge;
