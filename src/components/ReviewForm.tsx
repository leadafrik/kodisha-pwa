import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  reviewedId: string;
  listingId: string;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  reviewedId,
  listingId,
  onSuccess,
}) => {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    communication: 5,
    accuracy: 5,
    reliability: 5,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/reviews', {
        reviewedId,
        listingId,
        rating,
        comment,
        categories,
      });
      return response.data.data;
    },
    onSuccess: () => {
      setRating(5);
      setComment('');
      setCategories({ communication: 5, accuracy: 5, reliability: 5 });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.length < 10) {
      alert('Comment must be at least 10 characters');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border">
      <h3 className="text-xl font-semibold mb-4">Leave a Review</h3>

      {/* Overall Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
              className="focus:outline-none"
            >
              <Star
                size={32}
                className={`${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                } cursor-pointer transition-colors`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Category Ratings */}
      <div className="mb-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Category Ratings
        </label>
        {Object.entries(categories).map(([category, value]) => (
          <div key={category}>
            <label className="block text-sm text-gray-600 capitalize mb-1">
              {category}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={value}
              onChange={(e) =>
                setCategories({
                  ...categories,
                  [category]: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={`${
                    star <= value
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (minimum 10 characters)"
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length} / 500 characters
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitMutation.isPending || comment.length < 10}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
      >
        {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
      </button>

      {submitMutation.isSuccess && (
        <p className="text-green-600 text-sm mt-2">Review submitted successfully!</p>
      )}
      {submitMutation.isError && (
        <p className="text-red-600 text-sm mt-2">
          {(submitMutation.error as any)?.response?.data?.error ||
            'Failed to submit review'}
        </p>
      )}
    </form>
  );
};

export default ReviewForm;
