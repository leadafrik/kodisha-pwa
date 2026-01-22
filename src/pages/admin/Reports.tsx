import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS, adminApiRequest } from '../../config/api';

interface Report {
  _id: string;
  reportedBy: {
    _id: string;
    fullName: string;
    phone: string;
    email: string;
  };
  reportedUser: {
    _id: string;
    fullName: string;
    phone: string;
    email: string;
    verification?: {
      status: string;
    };
  };
  reason: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolution: string;
  createdAt: string;
  updatedAt: string;
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        status: filterStatus,
        severity: filterSeverity,
        page: page.toString(),
        limit: '20'
      }).toString();

      const data = await adminApiRequest(`${API_ENDPOINTS.admin.reports.getAll}?${query}`);
      setReports(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSeverity, page]);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const data = await adminApiRequest(API_ENDPOINTS.admin.reports.updateStatus(reportId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state
      setReports(reports.map(r => r._id === reportId ? { ...r, status: newStatus as any } : r));
      if (selectedReport?._id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus as any });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update report');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'reviewing': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">User Reports</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <p className="text-center py-8">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-center py-8 text-gray-600">No reports found</p>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report._id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      Report on {report.reportedUser.fullName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm mb-3">
                    <p><strong>Reported by:</strong> {report.reportedBy.fullName} ({report.reportedBy.phone})</p>
                    <p><strong>Reported user:</strong> {report.reportedUser.email}</p>
                    <p><strong>Reason:</strong> {report.reason}</p>
                    {report.description && <p><strong>Description:</strong> {report.description}</p>}
                    <p className="text-gray-500"><strong>Created:</strong> {new Date(report.createdAt).toLocaleString()}</p>
                  </div>

                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Details
                  </button>
                </div>

                <div className="flex gap-2">
                  {report.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(report._id, 'reviewing')}
                        disabled={updatingStatus}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-60"
                      >
                        Reviewing
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                        disabled={updatingStatus}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {report.status === 'reviewing' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(report._id, 'resolved')}
                        disabled={updatingStatus}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-60"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                        disabled={updatingStatus}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-60"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-60"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">User Reported</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Name:</strong> {selectedReport.reportedUser.fullName}</p>
                    <p><strong>Email:</strong> {selectedReport.reportedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedReport.reportedUser.phone}</p>
                    <p><strong>Verification Status:</strong> {selectedReport.reportedUser.verification?.status || 'Unknown'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Report Details</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p><strong>Reason:</strong> {selectedReport.reason}</p>
                    <p><strong>Description:</strong> {selectedReport.description || '—'}</p>
                    <p><strong>Severity:</strong> <span className={`px-2 py-1 rounded ${getSeverityColor(selectedReport.severity)}`}>{selectedReport.severity}</span></p>
                    <p><strong>Status:</strong> <span className={`px-2 py-1 rounded ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Reported By</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Name:</strong> {selectedReport.reportedBy.fullName}</p>
                    <p><strong>Email:</strong> {selectedReport.reportedBy.email}</p>
                    <p><strong>Phone:</strong> {selectedReport.reportedBy.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Timestamps</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Created:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                    <p><strong>Updated:</strong> {new Date(selectedReport.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedReport.status === 'open' && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, 'reviewing');
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60"
                      >
                        Mark as Reviewing
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, 'dismissed');
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60"
                      >
                        Dismiss Report
                      </button>
                    </>
                  )}
                  {selectedReport.status === 'reviewing' && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, 'resolved');
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                      >
                        Mark as Resolved
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, 'dismissed');
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
