import React, { useEffect, useState } from "react";
import { API_ENDPOINTS, adminApiRequest } from "../../config/api";

type UiStatus = "open" | "reviewing" | "resolved" | "dismissed";
type UiSeverity = "low" | "medium" | "high" | "critical";

interface ReportUser {
  _id?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  verification?: {
    status?: string;
  };
}

interface Report {
  _id: string;
  reportedBy?: ReportUser;
  reportedUser?: ReportUser;
  reason?: string;
  description?: string;
  severity?: string;
  status?: string;
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeStatus = (status?: string): UiStatus => {
  const value = (status || "").toLowerCase();
  if (value === "pending") return "open";
  if (value === "investigating") return "reviewing";
  if (value === "resolved") return "resolved";
  if (value === "dismissed") return "dismissed";
  return "open";
};

const normalizeSeverity = (severity?: string): UiSeverity => {
  const value = (severity || "").toLowerCase();
  if (value === "low" || value === "medium" || value === "high" || value === "critical") {
    return value;
  }
  return "low";
};

const formatDateTime = (dateValue?: string) => {
  if (!dateValue) return "Unknown";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

const getUserName = (user?: ReportUser) =>
  user?.fullName || user?.email || user?.phone || "Unknown user";
const getUserEmail = (user?: ReportUser) => user?.email || "No email";
const getUserPhone = (user?: ReportUser) => user?.phone || "No phone";

const getSeverityColor = (severity: UiSeverity) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: UiStatus) => {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-800";
    case "reviewing":
      return "bg-purple-100 text-purple-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "dismissed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterStatus !== "all") query.append("status", filterStatus);
      if (filterSeverity !== "all") query.append("severity", filterSeverity);

      const data = await adminApiRequest(
        `${API_ENDPOINTS.admin.reports.getAll}?${query.toString()}`
      );
      setReports(Array.isArray(data?.data) ? data.data : []);
      setTotalPages(Number(data?.pagination?.pages) || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
      setReports([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSeverity, page]);

  const handleUpdateStatus = async (reportId: string, newStatus: UiStatus) => {
    setUpdatingStatus(true);
    try {
      await adminApiRequest(API_ENDPOINTS.admin.reports.updateStatus(reportId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setReports((prev) =>
        prev.map((report) =>
          report._id === reportId ? { ...report, status: newStatus } : report
        )
      );
      setSelectedReport((prev) =>
        prev && prev._id === reportId ? { ...prev, status: newStatus } : prev
      );
    } catch (err: any) {
      setError(err.message || "Failed to update report");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const selectedStatus = normalizeStatus(selectedReport?.status);
  const selectedSeverity = normalizeSeverity(selectedReport?.severity);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">User Reports</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

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

      {loading ? (
        <p className="text-center py-8">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-center py-8 text-gray-600">No reports found</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => {
            const status = normalizeStatus(report.status);
            const severity = normalizeSeverity(report.severity);

            return (
              <div
                key={report._id || `report-${index}`}
                className="border rounded-lg p-4 bg-white hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        Report on {getUserName(report.reportedUser)}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}
                      >
                        {severity.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                      >
                        {status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      <p>
                        <strong>Reported by:</strong> {getUserName(report.reportedBy)} (
                        {getUserPhone(report.reportedBy)})
                      </p>
                      <p>
                        <strong>Reported user:</strong> {getUserEmail(report.reportedUser)}
                      </p>
                      <p>
                        <strong>Reason:</strong> {report.reason || "Not provided"}
                      </p>
                      {report.description && (
                        <p>
                          <strong>Description:</strong> {report.description}
                        </p>
                      )}
                      <p className="text-gray-500">
                        <strong>Created:</strong> {formatDateTime(report.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {status === "open" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(report._id, "reviewing")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-60"
                        >
                          Reviewing
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report._id, "dismissed")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    {status === "reviewing" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(report._id, "resolved")}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-60"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report._id, "dismissed")}
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
            );
          })}
        </div>
      )}

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
                  x
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">User Reported</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p>
                      <strong>Name:</strong> {getUserName(selectedReport.reportedUser)}
                    </p>
                    <p>
                      <strong>Email:</strong> {getUserEmail(selectedReport.reportedUser)}
                    </p>
                    <p>
                      <strong>Phone:</strong> {getUserPhone(selectedReport.reportedUser)}
                    </p>
                    <p>
                      <strong>Verification Status:</strong>{" "}
                      {selectedReport.reportedUser?.verification?.status || "Unknown"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Report Details</h3>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <p>
                      <strong>Reason:</strong> {selectedReport.reason || "Not provided"}
                    </p>
                    <p>
                      <strong>Description:</strong> {selectedReport.description || "-"}
                    </p>
                    <p>
                      <strong>Severity:</strong>{" "}
                      <span
                        className={`px-2 py-1 rounded ${getSeverityColor(selectedSeverity)}`}
                      >
                        {selectedSeverity}
                      </span>
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`px-2 py-1 rounded ${getStatusColor(selectedStatus)}`}>
                        {selectedStatus}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Reported By</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p>
                      <strong>Name:</strong> {getUserName(selectedReport.reportedBy)}
                    </p>
                    <p>
                      <strong>Email:</strong> {getUserEmail(selectedReport.reportedBy)}
                    </p>
                    <p>
                      <strong>Phone:</strong> {getUserPhone(selectedReport.reportedBy)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Timestamps</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p>
                      <strong>Created:</strong> {formatDateTime(selectedReport.createdAt)}
                    </p>
                    <p>
                      <strong>Updated:</strong> {formatDateTime(selectedReport.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedStatus === "open" && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, "reviewing");
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-60"
                      >
                        Mark as Reviewing
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, "dismissed");
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-60"
                      >
                        Dismiss Report
                      </button>
                    </>
                  )}
                  {selectedStatus === "reviewing" && (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, "resolved");
                          setSelectedReport(null);
                        }}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                      >
                        Mark as Resolved
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedReport._id, "dismissed");
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
