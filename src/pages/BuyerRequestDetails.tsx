import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../config/api';
import * as Sentry from '@sentry/react';

interface BuyerRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  productType?: string;
  budget?: number;
  quantity?: number;
  unit?: string;
  location: {
    county: string;
    constituency?: string;
    ward?: string;
  };
  urgency: string;
  status: string;
  images?: string[];
  userId: {
    _id: string;
    fullName: string;
    ratings?: number;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    _id: string;
    sellerId: string;
    sellerName: string;
    message: string;
    createdAt: string;
  }>;
}

const BuyerRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Try to get request from location state first
  const initialRequest = (location.state as any)?.request;

  // Helper: Get auth token
  const getAuthToken = (): string | null => {
    return localStorage.getItem("kodisha_token") || localStorage.getItem("kodisha_admin_token");
  };

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        
        // If we have request from state, use it
        if (initialRequest) {
          setRequest(initialRequest);
          setLoading(false);
          return;
        }

        // Otherwise fetch from API
        if (!id) {
          setError('Invalid request ID');
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/buyer-requests/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
            }
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('Buy request not found');
          } else {
            setError(`Failed to load request: ${response.statusText}`);
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setRequest(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching buyer request:', err);
        setError(err instanceof Error ? err.message : 'Failed to load request');
        setLoading(false);
        // Report to Sentry for monitoring
        try {
          Sentry.captureException(err);
        } catch (e) {
          // Silently ignore Sentry errors
        }
      }
    };

    fetchRequest();
  }, [id, initialRequest]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!request?._id) {
      setError('Request ID is missing');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/buyer-requests/${request._id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            message: replyMessage.trim(),
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit reply: ${response.statusText}`);
      }

      // Success
      setSubmitted(true);
      setReplyMessage('');
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);

      // Refresh the request to show the new response
      const refreshResponse = await fetch(
        `${API_BASE_URL}/buyer-requests/${request._id}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          }
        }
      );

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setRequest(data.data);
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
      Sentry.captureException(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading request details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'Request not found'}</p>
            <button
              onClick={() => navigate('/request')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Back to Buy Requests
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnRequest = user?._id === request.userId._id;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/request')}
            className="mb-6 flex items-center text-green-600 hover:text-green-700 font-semibold transition"
          >
            <span className="mr-2">←</span> Back to Buy Requests
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Request Header Card */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{request.title}</h1>
                    <div className="flex gap-3 flex-wrap">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {request.category}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.urgency?.charAt(0).toUpperCase() + request.urgency?.slice(1) || 'Normal'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    request.status === 'active' ? 'bg-green-100 text-green-800' :
                    request.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Location</p>
                    <p className="text-gray-800 font-semibold">
                      {request.location.county}
                      {request.location.constituency && `, ${request.location.constituency}`}
                    </p>
                  </div>
                  {request.budget && (
                    <div>
                      <p className="text-gray-500 text-sm">Budget</p>
                      <p className="text-gray-800 font-semibold">
                        KES {request.budget.toLocaleString()}
                        {request.unit && `/${request.unit}`}
                      </p>
                    </div>
                  )}
                  {request.quantity && (
                    <div>
                      <p className="text-gray-500 text-sm">Quantity Needed</p>
                      <p className="text-gray-800 font-semibold">
                        {request.quantity} {request.unit || 'units'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-sm">Posted</p>
                    <p className="text-gray-800 font-semibold">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>

                {/* Images */}
                {request.images && request.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {request.images.map((image, idx) => (
                        <img
                          key={idx}
                          src={image}
                          alt={`Request image ${idx + 1}`}
                          className="rounded-lg max-h-48 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Requester Info Card */}
              <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-600">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Posted By</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-bold text-gray-800">{request.userId.fullName}</p>
                    {typeof request.userId.ratings === 'number' && (
                      <p className="text-sm text-gray-600 mt-1">
                        ⭐ Rating: {request.userId.ratings.toFixed(1)}
                      </p>
                    )}
                  </div>
                  {request.userId.phone && !isOwnRequest && (
                    <a
                      href={`https://wa.me/${request.userId.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Responses Section */}
              {request.responses && request.responses.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Responses ({request.responses.length})
                  </h3>
                  <div className="space-y-4">
                    {request.responses.map((response) => (
                      <div
                        key={response._id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-gray-800">{response.sellerName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {response.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Reply Form */}
            <div className="lg:col-span-1">
              {isOwnRequest ? (
                <div className="bg-blue-50 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
                  <p className="text-gray-700 font-semibold">
                    This is your buy request. You cannot reply to your own request.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    You can view and manage your responses from the requests dashboard.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Reply to Request</h3>

                  {submitted && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-semibold">
                        ✓ Reply submitted successfully!
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  {!user ? (
                    <div>
                      <p className="text-gray-700 mb-4">
                        Please log in to reply to this buy request.
                      </p>
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                      >
                        Log In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReplySubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Message
                        </label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Tell the buyer about your product/service, pricing, availability, etc..."
                          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
                          rows={6}
                          disabled={submitting}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || !replyMessage.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                      >
                        {submitting ? 'Submitting...' : 'Submit Reply'}
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        The buyer will see your message and can contact you directly.
                      </p>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BuyerRequestDetails;
