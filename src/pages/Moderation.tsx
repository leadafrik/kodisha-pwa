import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, adminApiRequest } from '../config/api';

interface FlaggedUser {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  userType: string;
  fraud: {
    flagsCount: number;
    reviewStatus: string;
    flaggedBy: string[];
  };
  ratings?: {
    average: number;
    count: number;
  };
  createdAt: string;
}

const Moderation: React.FC = () => {
  const navigate = useNavigate();
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('kodisha_admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    fetchFlaggedUsers();
  }, [navigate]);

  const fetchFlaggedUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApiRequest(API_ENDPOINTS.moderation.getFlagged);
      if (response.success) {
        setFlaggedUsers(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch flagged users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!window.confirm('Suspend this user? They will not be able to log in.')) return;
    try {
      setActionLoading(userId);
      const response = await adminApiRequest(API_ENDPOINTS.moderation.suspend(userId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 30 }), // 30 days
      });
      if (response.success) {
        alert('User suspended successfully');
        fetchFlaggedUsers();
      } else {
        alert(response.message || 'Failed to suspend user');
      }
    } catch (err: any) {
      alert(err.message || 'Error suspending user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Permanently DELETE this user account? This cannot be undone.')) return;
    try {
      setActionLoading(userId);
      const response = await adminApiRequest(API_ENDPOINTS.moderation.deleteUser(userId), {
        method: 'DELETE',
      });
      if (response.success) {
        alert('User deleted successfully');
        fetchFlaggedUsers();
      } else {
        alert(response.message || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForgive = async (userId: string) => {
    if (!window.confirm('Clear all fraud flags for this user?')) return;
    try {
      setActionLoading(userId);
      const response = await adminApiRequest(API_ENDPOINTS.moderation.forgive(userId), {
        method: 'POST',
      });
      if (response.success) {
        alert('User forgiven - fraud flags cleared');
        fetchFlaggedUsers();
      } else {
        alert(response.message || 'Failed to forgive user');
      }
    } catch (err: any) {
      alert(err.message || 'Error forgiving user');
    } finally {
      setActionLoading(null);
    }
  };

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
          <h1 className="text-3xl font-bold">Moderation Queue</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>

        {flaggedUsers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No flagged users pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{user.fullName}</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        {user.fraud.flagsCount} reports
                      </span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                        {user.userType}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Phone:</strong> {user.phone}</p>
                      {user.email && <p><strong>Email:</strong> {user.email}</p>}
                      <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                      {user.ratings && (
                        <p>
                          <strong>Rating:</strong> {user.ratings.average.toFixed(1)}/5 ({user.ratings.count} reviews)
                        </p>
                      )}
                      <p><strong>Review Status:</strong> <span className="font-semibold text-orange-600">{user.fraud.reviewStatus}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSuspend(user._id)}
                      disabled={actionLoading === user._id}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {actionLoading === user._id ? 'Processing...' : 'Suspend'}
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      disabled={actionLoading === user._id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleForgive(user._id)}
                      disabled={actionLoading === user._id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Forgive
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;
