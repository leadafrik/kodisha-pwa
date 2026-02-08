import React from 'react';

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
          <svg
            key={i}
            className={`${starSize} ${
              i < Math.round(rating.average)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
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
          <svg
            className={`${starSize} text-green-600 fill-current ml-1`}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
          </svg>
          <span className="sr-only">Verified profile</span>
        </>
      )}
    </div>
  );
};

export default UserRatingBadge;
