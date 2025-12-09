import React from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, FileText, Shield, BarChart3, Lock } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">Central control center for platform management and fraud prevention</p>
        </div>

        {/* Main Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* User Management */}
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
                <Users className="text-blue-600" size={28} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">CRITICAL</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
            <p className="text-gray-600 mb-4">Search, monitor, suspend, and manage user accounts with fraud flagging</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Search by name, email, phone</p>
              <p>✓ View verification status</p>
              <p>✓ Suspend/unsuspend accounts</p>
              <p>✓ Flag for fraud</p>
            </div>
          </Link>

          {/* Reports Management */}
          <Link
            to="/admin/reports-management"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition">
                <AlertTriangle className="text-red-600" size={28} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-red-50 text-red-700 rounded-full">URGENT</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports Management</h2>
            <p className="text-gray-600 mb-4">Review, investigate, and resolve fraud and policy violation reports</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Filter by status</p>
              <p>✓ Investigate cases</p>
              <p>✓ Document resolutions</p>
              <p>✓ Track outcomes</p>
            </div>
          </Link>

          {/* Profile Verification */}
          <Link
            to="/admin/profile-verification"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition">
                <Shield className="text-green-600" size={28} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 rounded-full">VERIFICATION</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Verification</h2>
            <p className="text-gray-600 mb-4">Verify user identities and review documents for compliance</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Verify ID documents</p>
              <p>✓ Check selfies</p>
              <p>✓ Review business docs</p>
              <p>✓ Approve/reject profiles</p>
            </div>
          </Link>

          {/* Moderation */}
          <Link
            to="/admin/moderation"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:-translate-y-1 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition">
                <FileText className="text-orange-600" size={28} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-orange-50 text-orange-700 rounded-full">CONTENT</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Moderation</h2>
            <p className="text-gray-600 mb-4">Review and moderate listings and user-generated content</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Flag inappropriate content</p>
              <p>✓ Delete violations</p>
              <p>✓ View content reports</p>
              <p>✓ Track moderation history</p>
            </div>
          </Link>

          {/* Listing Management */}
          <div className="bg-white rounded-lg shadow-lg p-8 opacity-50 cursor-not-allowed">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="text-purple-600" size={28} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">COMING SOON</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Management</h2>
            <p className="text-gray-600 mb-4">Manage listings, pricing, and promotional features</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ Review new listings</p>
              <p>✓ Delete violations</p>
              <p>✓ Manage promotions</p>
              <p>✓ Price monitoring</p>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg shadow-lg p-8 opacity-50 cursor-not-allowed">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                <Lock className="text-pink-600" size={28} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">COMING SOON</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600 mb-4">View platform analytics and fraud trend reports</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✓ User activity stats</p>
              <p>✓ Fraud patterns</p>
              <p>✓ Revenue tracking</p>
              <p>✓ Performance metrics</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions & Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-red-500 pl-6">
              <p className="text-sm text-gray-600 mb-1">Immediate Action Needed</p>
              <p className="text-3xl font-bold text-gray-900">Review Reports</p>
              <p className="text-sm text-gray-600 mt-2">Pending user reports require your attention</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-6">
              <p className="text-sm text-gray-600 mb-1">Verification Queue</p>
              <p className="text-3xl font-bold text-gray-900">Check Profiles</p>
              <p className="text-sm text-gray-600 mt-2">Users awaiting ID verification</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-6">
              <p className="text-sm text-gray-600 mb-1">Security</p>
              <p className="text-3xl font-bold text-gray-900">Monitor Users</p>
              <p className="text-sm text-gray-600 mt-2">Keep watch for suspicious activity</p>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">Fraud Prevention Guidelines</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• <strong>Document Everything:</strong> Keep detailed records of all actions taken on user accounts</li>
            <li>• <strong>Investigate Thoroughly:</strong> Don't suspend without proper investigation - use the flag system first</li>
            <li>• <strong>Communicate:</strong> When suspending, provide clear reason to help users understand violations</li>
            <li>• <strong>Pattern Recognition:</strong> Look for patterns in fraud reports - similar victims or MOs suggest organized fraud</li>
            <li>• <strong>Protect Privacy:</strong> Never share user data or investigations with other users</li>
            <li>• <strong>Fair Process:</strong> Give users opportunity to respond before permanent action when possible</li>
            <li>• <strong>Stay Updated:</strong> Keep track of new fraud techniques and update security measures accordingly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
