import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/auth';

interface SubmitRatingProps {
  ratedUserId: string;
  ratedUserName: string;
  listingId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SubmitRating: React.FC<SubmitRatingProps> = ({
  ratedUserId,
  ratedUserName,
  listingId,
  onSuccess,
  onCancel,
}) => {
  const [score, setScore] = useState(5);
  const [review, setReview] = useState('');
  const [category, setCategory] = useState('overall');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scoreLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = getAuthToken() || localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await axios.post(
        `${API_BASE_URL}/ratings`,
        {
          ratedUserId,
          listingId,
          score,
          review: review || undefined,
          category,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate {ratedUserName}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <fieldset>
          <legend className="block text-sm font-semibold text-gray-700 mb-3">
            How was your experience?
          </legend>
          <div className="flex gap-2" role="group" aria-label="Select a rating from one to five stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                aria-label={`${star} star${star > 1 ? 's' : ''} - ${scoreLabels[star]}`}
                aria-pressed={score === star}
                className="transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= score
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              </button>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600" aria-live="polite">
            {scoreLabels[score]}
          </div>
        </fieldset>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
            What are you rating?
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          >
            <option value="overall">Overall Experience</option>
            <option value="communication">Communication</option>
            <option value="reliability">Reliability</option>
            <option value="quality">Quality</option>
          </select>
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-sm font-semibold text-gray-700 mb-2">
            Share details (optional)
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell others about your experience..."
            maxLength={1000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
            rows={4}
          />
          <div className="mt-1 text-xs text-gray-500">
            {review.length}/1000 characters
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitRating;
