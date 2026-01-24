import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  FileText,
  Shield,
  BarChart3,
  Lock,
  FileEdit,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { adminApiRequest } from "../../config/api";

type AdminUserSummary = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  accountStatus?: string;
  verification?: { idVerified?: boolean };
  ratings?: { average?: number };
};

type AdminReportSummary = {
  _id: string;
  reason: string;
  status: string;
  createdAt: string;
  reportingUser?: { fullName: string; email?: string };
  reportedUser?: { fullName: string; email?: string };
};

const AdminDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const adminRoles = ["admin", "super_admin", "moderator"];
  const isAdmin = adminRoles.includes(user?.role ?? "");
  const [refreshKey, setRefreshKey] = useState(0);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState("");
  const [recentUsers, setRecentUsers] = useState<AdminUserSummary[]>([]);
  const [recentReports, setRecentReports] = useState<AdminReportSummary[]>([]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    const loadSnapshot = async () => {
      setSnapshotLoading(true);
      setSnapshotError("");

      try {
        const [usersData, reportsData] = await Promise.all([
          adminApiRequest("/admin/users/search?limit=6&page=1&sortBy=createdAt"),
          adminApiRequest("/reports?status=pending&limit=6&page=1"),
        ]);

        if (!active) return;

        setRecentUsers(Array.isArray(usersData?.data) ? usersData.data : []);
        setRecentReports(Array.isArray(reportsData?.data) ? reportsData.data : []);
      } catch (error: any) {
        if (!active) return;
        setSnapshotError(error?.message || "Unable to load admin snapshot.");
      } finally {
        if (active) setSnapshotLoading(false);
      }
    };

    loadSnapshot();

    return () => {
      active = false;
    };
  }, [isAdmin, refreshKey]);

  const handleQuickSuspend = async (userId: string, currentStatus?: string) => {
    setSnapshotError("");
    try {
      if (currentStatus === "suspended") {
        await adminApiRequest(`/admin/users/${userId}/unsuspend`, { method: "PUT" });
      } else {
        const reason = window.prompt("Suspension reason:");
        if (!reason || !reason.trim()) return;
        await adminApiRequest(`/admin/users/${userId}/suspend`, {
          method: "PUT",
          body: JSON.stringify({ reason: reason.trim() }),
        });
      }
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      setSnapshotError(error?.message || "Unable to update user status.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Access Restricted</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Admin access only</h1>
          <p className="mt-3 text-sm text-slate-600">
            This dashboard is available to verified admin roles. If you believe this is a mistake,
            refresh your session or contact support.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => refreshUser()}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Refresh Session
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Newsreader:wght@400;600&display=swap');
        :root {
          --ink: #0f172a;
          --muted: #475569;
          --panel: #ffffff;
          --border: #e2e8f0;
          --accent: #0f766e;
          --accent-2: #0ea5a4;
        }
        .admin-shell { font-family: "Space Grotesk", "Segoe UI", sans-serif; }
        .admin-title { font-family: "Newsreader", "Georgia", serif; }
        .fade-in { animation: fadeIn 0.6s ease both; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="admin-shell">
        <div className="relative overflow-hidden">
          <div className="absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-28 left-[-4rem] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="max-w-7xl mx-auto px-6 pt-12 pb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 fade-in">
                <p className="text-xs uppercase tracking-[0.4em] text-emerald-700 font-semibold">Admin Console</p>
                <h1 className="admin-title text-4xl md:text-5xl text-slate-900">Admin Dashboard</h1>
                <p className="text-base text-slate-600 max-w-2xl">
                  Central control for platform trust, user safety, and fraud prevention across the marketplace.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    Role: {user?.role ?? "admin"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
                    Access active
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user?.role === "super_admin" && (
                  <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Super Admin Access
                  </span>
                )}
                <button
                  onClick={() => refreshUser()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Refresh user role and permissions"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-16">
          <section className="mt-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Operations</p>
                <h2 className="admin-title text-3xl text-slate-900 mt-2">Core controls</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">Last sync: now</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold">Secure</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                to="/admin/users"
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Priority</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">User Management</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Search, monitor, suspend, and manage user accounts with fraud flagging.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Search by name, email, phone</li>
                  <li>- View verification status</li>
                  <li>- Suspend or unsuspend accounts</li>
                  <li>- Flag for fraud</li>
                </ul>
              </Link>

              <Link
                to="/admin/reports-management"
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Urgent</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Reports Management</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Review, investigate, and resolve fraud and policy violation reports.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Filter by status</li>
                  <li>- Investigate cases</li>
                  <li>- Document resolutions</li>
                  <li>- Track outcomes</li>
                </ul>
              </Link>

              <Link
                to="/admin/profile-verification"
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Verification
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Profile Verification</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Verify identities and review documents for compliance.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Verify ID documents</li>
                  <li>- Check selfies</li>
                  <li>- Review business docs</li>
                  <li>- Approve or reject profiles</li>
                </ul>
              </Link>

              <Link
                to="/admin/moderation"
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Content</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Content Moderation</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Review listings and user-generated content to keep the platform safe.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>- Flag inappropriate content</li>
                  <li>- Delete violations</li>
                  <li>- View content reports</li>
                  <li>- Track moderation history</li>
                </ul>
              </Link>

              {user?.role === "super_admin" && (
                <Link
                  to="/admin/content-editor"
                  className="group rounded-3xl border border-emerald-300 bg-emerald-50/60 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileEdit size={24} />
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Super Admin
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Website Content Editor</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Edit public-facing copy and CTAs without redeploying.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    <li>- Update hero headlines</li>
                    <li>- Manage page descriptions</li>
                    <li>- Control CTA buttons</li>
                    <li>- Publish instantly</li>
                  </ul>
                </Link>
              )}

              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-slate-500">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <BarChart3 size={24} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Coming soon</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-700">Listing Management</h3>
                <p className="mt-2 text-sm text-slate-500">Manage listings, pricing, and promotions.</p>
              </div>

              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-slate-500">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Lock size={24} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Coming soon</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-700">Analytics and Reports</h3>
                <p className="mt-2 text-sm text-slate-500">Track trends, performance, and fraud signals.</p>
              </div>
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Users</p>
                  <h3 className="admin-title text-2xl text-slate-900 mt-2">Latest users</h3>
                </div>
                <Link
                  to="/admin/users"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all
                </Link>
              </div>

              {snapshotError && (
                <p className="mt-4 text-sm text-rose-600">{snapshotError}</p>
              )}

              {snapshotLoading ? (
                <p className="mt-6 text-sm text-slate-500">Loading user snapshot...</p>
              ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">User</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Rating</th>
                        <th className="px-4 py-3 text-left font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentUsers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-slate-500" colSpan={4}>
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        recentUsers.map((profile) => {
                          const isSuspended = profile.accountStatus === "suspended";
                          const rating =
                            typeof profile.ratings?.average === "number"
                              ? profile.ratings.average.toFixed(1)
                              : "--";
                          return (
                            <tr key={profile._id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-slate-900">{profile.fullName}</p>
                                <p className="text-xs text-slate-500">{profile.email || "No email"}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    isSuspended
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {isSuspended ? "Suspended" : "Active"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{rating}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleQuickSuspend(profile._id, profile.accountStatus)}
                                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                                >
                                  {isSuspended ? "Unsuspend" : "Suspend"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reports</p>
                  <h3 className="admin-title text-2xl text-slate-900 mt-2">Pending reports</h3>
                </div>
                <Link
                  to="/admin/reports-management"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Review all
                </Link>
              </div>

              {snapshotLoading ? (
                <p className="mt-6 text-sm text-slate-500">Loading report snapshot...</p>
              ) : (
                <div className="mt-6 space-y-3">
                  {recentReports.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      No pending reports.
                    </div>
                  ) : (
                    recentReports.map((report) => (
                      <div
                        key={report._id}
                        className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">{report.reason}</p>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            {report.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Reported: {report.reportedUser?.fullName || "Unknown"} | Reporter:{" "}
                          {report.reportingUser?.fullName || "Unknown"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="admin-title text-2xl text-slate-900">Quick actions</h3>
              <p className="mt-2 text-sm text-slate-600">Jump to the most time-sensitive queues.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-700">Reports</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Review reports</p>
                  <p className="mt-2 text-xs text-slate-600">Pending cases need a decision.</p>
                  <Link
                    to="/admin/reports-management"
                    className="mt-4 inline-flex items-center text-sm font-semibold text-rose-700 hover:text-rose-800"
                  >
                    Open queue
                  </Link>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Verification</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Check profiles</p>
                  <p className="mt-2 text-xs text-slate-600">Users awaiting ID review.</p>
                  <Link
                    to="/admin/profile-verification"
                    className="mt-4 inline-flex items-center text-sm font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Review now
                  </Link>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-sky-700">Security</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Monitor users</p>
                  <p className="mt-2 text-xs text-slate-600">Flag suspicious activity early.</p>
                  <Link
                    to="/admin/users"
                    className="mt-4 inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-800"
                  >
                    View users
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="admin-title text-2xl text-slate-900">Fraud prevention playbook</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li><span className="font-semibold text-slate-800">Document everything:</span> Keep detailed records of actions taken.</li>
                <li><span className="font-semibold text-slate-800">Investigate thoroughly:</span> Flag first, suspend after evidence.</li>
                <li><span className="font-semibold text-slate-800">Communicate clearly:</span> Provide a reason and next steps.</li>
                <li><span className="font-semibold text-slate-800">Recognize patterns:</span> Similar reports can indicate organized fraud.</li>
                <li><span className="font-semibold text-slate-800">Protect privacy:</span> Never share user data with others.</li>
                <li><span className="font-semibold text-slate-800">Stay updated:</span> Review new fraud techniques regularly.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
