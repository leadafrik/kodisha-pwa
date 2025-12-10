import React, { useState } from 'react';
import { submitReport } from '../services/reportService';

interface ReportModalProps {
  isOpen: boolean;
  sellerId: string;
  sellerName: string;
  listingId?: string;
  listingType?: string;
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  sellerId,
  sellerName,
  listingId,
  listingType,
  onClose,
  onSubmitSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please select a reason for the report');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await submitReport(
        sellerId,
        reason,
        description,
        listingId,
        listingType,
        severity
      );

      if (!result || !result._id) {
        throw new Error('Failed to submit report');
      }

      // Success
      setReason('');
      setDescription('');
      setSeverity('medium');
      onSubmitSuccess?.();
      onClose();
    } catch (err) {
      const message = (err as Error).message;
      setError(message || 'Failed to submit report. Please try again.');
      console.error('Report submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Report User</h2>
          <button
            onClick={onClose}
            className="text-white hover:opacity-80 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600">
            Reporting: <strong>{sellerName}</strong>
          </p>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Report *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">Select a reason...</option>
              <option value="Fraud">Fraud or scam</option>
              <option value="Harassment">Harassment or abuse</option>
              <option value="Inappropriate Content">Inappropriate content</option>
              <option value="Spam">Spam</option>
              <option value="Fake Profile">Fake or misrepresented profile</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about the issue..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
