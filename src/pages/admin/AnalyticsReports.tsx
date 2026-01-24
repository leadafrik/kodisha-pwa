import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiRequest } from "../../config/api";

type DashboardStats = {
  totalListings: number;
  pendingListings: number;
  verifiedListings: number;
  totalUsers: number;
  breakdown?: Record<string, { total: number; pending: number; verified: number }>;
};

type ReportSummary = {
  _id: string;
  reason: string;
  status: string;
  createdAt: string;
};

const AnalyticsReports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingReports, setPendingReports] = useState<ReportSummary[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const [dashboardRes, reportsRes, flaggedRes, verificationRes] = await Promise.all([
          adminApiRequest("/admin/dashboard"),
          adminApiRequest("/reports?status=pending&limit=5&page=1"),
          adminApiRequest("/admin/users/search?status=flagged&limit=1&page=1"),
          adminApiRequest("/verification/pending?limit=200&status=pending"),
        ]);

        setStats(dashboardRes?.data || null);
        setPendingReports(reportsRes?.data || []);
        setFlaggedCount(flaggedRes?.pagination?.total || 0);
        setPendingVerificationCount(verificationRes?.total || 0);
      } catch (err: any) {
        setError(err?.message || "Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const breakdownItems = stats?.breakdown
    ? Object.entries(stats.breakdown).map(([key, value]) => ({
        key,
        total: value.total,
        pending: value.pending,
        verified: value.verified,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Analytics</p>
            <h1 className="text-4xl font-bold mt-2">Analytics and Reports</h1>
            <p className="text-slate-600 mt-2">
              Track marketplace performance, moderation load, and fraud signals.
            </p>
          </div>
          <Link
            to="/admin"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Back to dashboard
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-sm text-slate-500">Loading analytics...</div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Users</p>
                <p className="text-3xl font-semibold mt-3">{stats?.totalUsers ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Listings</p>
                <p className="text-3xl font-semibold mt-3">{stats?.totalListings ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pending reviews</p>
                <p className="text-3xl font-semibold mt-3">{stats?.pendingListings ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Verified listings</p>
                <p className="text-3xl font-semibold mt-3">{stats?.verifiedListings ?? 0}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pending reports</p>
                <p className="text-3xl font-semibold mt-3">{pendingReports.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Flagged users</p>
                <p className="text-3xl font-semibold mt-3">{flaggedCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Pending verifications</p>
                <p className="text-3xl font-semibold mt-3">{pendingVerificationCount}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Listing mix</h2>
                <p className="text-sm text-slate-500 mt-1">Totals by category</p>
                {breakdownItems.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No breakdown data yet.</p>
                ) : (
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {breakdownItems.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2"
                      >
                        <span className="capitalize">{item.key.replace("_", " ")}</span>
                        <span>Total {item.total} | Pending {item.pending} | Verified {item.verified}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Latest reports</h2>
                <p className="text-sm text-slate-500 mt-1">Most recent pending issues</p>
                {pendingReports.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No pending reports.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pendingReports.map((report) => (
                      <div
                        key={report._id}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                      >
                        <p className="font-semibold text-slate-900">{report.reason}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(report.createdAt).toLocaleDateString()} | {report.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsReports;
