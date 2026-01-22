import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Flag } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  verification: { idVerified: boolean };
  fraudFlags?: number;
  accountStatus?: string;
  createdAt: string;
  ratings?: { average: number };
  listings?: any[];
}

const AdminUserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const token = localStorage.getItem('token');

  const handleSearch = async (newPage = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', newPage.toString());
      params.append('limit', '20');
      params.append('sortBy', 'createdAt');

      const response = await fetch(
        `${API_BASE_URL}/admin/users/search?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to search users');

      const data = await response.json();
      setUsers(data.data);
      setTotal(data.pagination.total);
      setPage(newPage);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string, reason: string) => {
    if (!reason.trim()) {
      setError('Suspension reason is required');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/suspend`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) throw new Error('Failed to suspend user');

      setError('');
      handleSearch(page);
      setShowUserDetail(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/unsuspend`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to unsuspend user');

      setError('');
      handleSearch(page);
      setShowUserDetail(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleFlagUser = async (userId: string, reason: string) => {
    if (!reason.trim()) {
      setError('Flag reason is required');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/flag`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) throw new Error('Failed to flag user');

      setError('');
      handleSearch(page);
      setShowUserDetail(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleClearFlags = async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/clear-flags`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to clear flags');

      setError('');
      handleSearch(page);
      setShowUserDetail(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Search, monitor, and manage user accounts</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by name, email, or phone
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSearch(1);
                  }}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="suspended">Suspended</option>
                <option value="flagged">Flagged for Fraud</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Verification</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fraud Flags</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{user.email}</div>
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          user.accountStatus === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.accountStatus === 'suspended' ? (
                          <>
                            <Lock size={14} />
                            Suspended
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Active
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.verification.idVerified ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle size={16} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-600 text-sm font-medium">
                          <AlertTriangle size={16} />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.fraudFlags && user.fraudFlags > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
                          <Flag size={14} />
                          {user.fraudFlags}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.ratings?.average ? (
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">{user.ratings.average.toFixed(1)}</span>
                          <span className="text-gray-500 text-xs ml-1">★</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetail(true);
                        }}
                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found. Try adjusting your filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => handleSearch(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">Page {page}</span>
            <button
              onClick={() => handleSearch(page + 1)}
              disabled={page * 20 >= total}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onSuspend={handleSuspend}
          onUnsuspend={handleUnsuspend}
          onFlag={handleFlagUser}
          onClearFlags={handleClearFlags}
        />
      )}
    </div>
  );
};

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onSuspend: (userId: string, reason: string) => void;
  onUnsuspend: (userId: string) => void;
  onFlag: (userId: string, reason: string) => void;
  onClearFlags: (userId: string) => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  onSuspend,
  onUnsuspend,
  onFlag,
  onClearFlags,
}) => {
  const [suspendReason, setSuspendReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [action, setAction] = useState<'view' | 'suspend' | 'flag'>('view');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-gray-900 font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="text-gray-900 font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Verification</p>
              <p className={`font-medium ${user.verification.idVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user.verification.idVerified ? 'ID Verified' : 'Not Verified'}
              </p>
            </div>
          </div>

          {/* Fraud Info */}
          {user.fraudFlags && user.fraudFlags > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2">Fraud Flags: {user.fraudFlags}</p>
              <p className="text-red-800 text-sm">This user has been flagged for suspicious activity</p>
            </div>
          )}

          {/* Action Buttons */}
          {action === 'view' && (
            <div className="flex gap-3">
              <button
                onClick={() => setAction('suspend')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition"
              >
                <Lock size={18} />
                {user.accountStatus === 'suspended' ? 'Unsuspend' : 'Suspend Account'}
              </button>
              <button
                onClick={() => setAction('flag')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition"
              >
                <Flag size={18} />
                Flag for Fraud
              </button>
              {user.fraudFlags && user.fraudFlags > 0 && (
                <button
                  onClick={() => onClearFlags(user._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition"
                >
                  <CheckCircle size={18} />
                  Clear Flags
                </button>
              )}
            </div>
          )}

          {/* Suspend Form */}
          {action === 'suspend' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Suspension Reason
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Describe why this account is being suspended..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (user.accountStatus === 'suspended') {
                      onUnsuspend(user._id);
                    } else {
                      onSuspend(user._id, suspendReason);
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {user.accountStatus === 'suspended' ? 'Confirm Unsuspend' : 'Confirm Suspension'}
                </button>
                <button
                  onClick={() => setAction('view')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Flag Form */}
          {action === 'flag' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Flag Reason
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select a reason...</option>
                <option value="Suspicious payment behavior">Suspicious payment behavior</option>
                <option value="Multiple fraud reports">Multiple fraud reports</option>
                <option value="Item mismatch in listings">Item mismatch in listings</option>
                <option value="Fake identity verification">Fake identity verification</option>
                <option value="Harassment reports">Harassment reports</option>
                <option value="Other">Other - Please describe</option>
              </select>
              {flagReason === 'Other' && (
                <textarea
                  placeholder="Describe the issue..."
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => onFlag(user._id, flagReason)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Confirm Flag
                </button>
                <button
                  onClick={() => setAction('view')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
