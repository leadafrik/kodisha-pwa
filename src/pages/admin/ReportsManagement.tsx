import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { API_ENDPOINTS, adminApiRequest } from '../../config/api';

interface Report {
  _id: string;
  reportingUser?: { fullName?: string; email?: string };
  reportedUser?: { fullName?: string; email?: string };
  reason: string;
  description?: string;
  status: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

const AdminReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const statusMap: Record<string, string> = {
    pending: 'open',
    investigating: 'reviewing',
    resolved: 'resolved',
    dismissed: 'dismissed',
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '15');

      const apiStatus = statusMap[statusFilter] || statusFilter;
      params.set('status', apiStatus);
      const data = await adminApiRequest(`${API_ENDPOINTS.admin.reports.getAll}?${params}`);
      setReports(data.data);
      setTotal(data.pagination.total);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string, resolution?: string) => {
    try {
      const apiStatus = statusMap[newStatus] || newStatus;
      await adminApiRequest(API_ENDPOINTS.admin.reports.updateStatus(reportId), {
        method: 'PATCH',
        body: JSON.stringify({ status: apiStatus, resolution }),
      });

      setShowModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'investigating':
        return <AlertTriangle size={16} />;
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'dismissed':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reports Management</h1>
          <p className="text-gray-600">Review and resolve user reports and fraud cases</p>
        </div>

        {/* Status Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['pending', 'investigating', 'resolved', 'dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                  statusFilter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reported User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reporter</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.reportedUser?.fullName || "Unknown user"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.reportedUser?.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {report.reportingUser?.fullName || "Unknown reporter"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.reportingUser?.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      <p className="line-clamp-1">{report.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowModal(true);
                        }}
                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reports.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No reports found in this status.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 15 >= total}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showModal && selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => {
            setShowModal(false);
            setSelectedReport(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
  onUpdateStatus: (reportId: string, status: string, resolution?: string) => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onUpdateStatus,
}) => {
  const [newStatus, setNewStatus] = useState(report.status);
  const [resolution, setResolution] = useState(report.resolution || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
          >
            x
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Reported User Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Reported User</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 font-medium">{report.reportedUser?.fullName || 'Unknown user'}</p>
              <p className="text-gray-600 text-sm">{report.reportedUser?.email || 'No email'}</p>
            </div>
          </div>

          {/* Reporter Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Reported By</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 font-medium">{report.reportingUser?.fullName || 'Unknown reporter'}</p>
              <p className="text-gray-600 text-sm">{report.reportingUser?.email || 'No email'}</p>
            </div>
          </div>

          {/* Report Details */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Report Reason</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{report.reason}</p>
          </div>

          {report.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{report.description}</p>
            </div>
          )}

          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {(newStatus === 'resolved' || newStatus === 'dismissed') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution/Notes
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Document the resolution..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onUpdateStatus(report._id, newStatus, resolution)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
            >
              Update Report
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsManagement;

