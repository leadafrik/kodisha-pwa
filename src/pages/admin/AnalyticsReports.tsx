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

type TrafficTrendPoint = {
  date?: string;
  week?: string;
  month?: string;
  uniqueVisitors: number;
  newVisitors?: number;
  pageViews: number;
  ctaClicks: number;
};

type TrafficSummary = {
  overview: {
    uniqueVisitorsToday: number;
    uniqueVisitorsWeek: number;
    uniqueVisitorsMonth: number;
    uniqueVisitorsTotal: number;
    liveListingsNow?: number;
    newVisitorsToday?: number;
    newVisitorsWeek?: number;
    newVisitorsMonth?: number;
  };
  trends: {
    daily: TrafficTrendPoint[];
    weekly: TrafficTrendPoint[];
    monthly: TrafficTrendPoint[];
  };
  topPages: Array<{
    pagePath: string;
    views: number;
    uniqueVisitors: number;
  }>;
  topActions: Array<{
    action: string;
    target?: string;
    clicks: number;
    uniqueVisitors: number;
  }>;
  listingEngagement?: {
    topListings: Array<{
      id: string;
      title: string;
      category: string;
      listingType: string;
      views: number;
      saves: number;
      reachOuts: number;
      score: number;
      listingPath: string;
    }>;
  };
  conversion?: {
    routes?: Array<{
      key: string;
      label: string;
      path: string;
      views: number;
      uniqueVisitors: number;
    }>;
    funnel?: {
      homeUniqueVisitors: number;
      signupUniqueVisitors: number;
      browseUniqueVisitors: number;
      createListingUniqueVisitors: number;
      listingDetailsUniqueVisitors: number;
      homeToSignupRate: number;
      homeToBrowseRate: number;
      signupToCreateListingRate: number;
      browseToDetailsRate: number;
    };
    ctaTargets?: Array<{
      target: string;
      clicks: number;
      uniqueVisitors: number;
    }>;
    primaryCtaSignals?: {
      signUpClicks: number;
      browseClicks: number;
      listNowClicks: number;
      buyRequestClicks: number;
    };
  };
};

const formatPercent = (value: number | undefined) => `${Number(value || 0).toFixed(1)}%`;
const humanizeAction = (value: string) =>
  value
    .replace(/^funnel_/, "")
    .replace(/^link_click/, "link click")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const AnalyticsReports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficSummary | null>(null);
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
        const [dashboardRes, reportsRes, flaggedRes, verificationRes, trafficRes] = await Promise.all([
          adminApiRequest("/admin/dashboard"),
          adminApiRequest("/reports?status=pending&limit=5&page=1"),
          adminApiRequest("/admin/users/search?status=flagged&limit=1&page=1"),
          adminApiRequest("/verification/pending?limit=200&status=pending"),
          adminApiRequest("/analytics/admin/summary"),
        ]);

        setStats(dashboardRes?.data || null);
        setPendingReports(reportsRes?.data || []);
        setFlaggedCount(flaggedRes?.pagination?.total || 0);
        setPendingVerificationCount(verificationRes?.total || 0);
        setTraffic(trafficRes?.data || null);
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
  const nonZeroBreakdownItems = breakdownItems.filter(
    (item) => item.total > 0 || item.pending > 0 || item.verified > 0
  );

  const funnel = traffic?.conversion?.funnel;
  const primarySignals = traffic?.conversion?.primaryCtaSignals;
  const conversionRoutes = traffic?.conversion?.routes || [];
  const conversionTargets = traffic?.conversion?.ctaTargets || [];
  const funnelActions =
    traffic?.topActions?.filter((action) => action.action.startsWith("funnel_")) || [];
  const genericActions =
    traffic?.topActions?.filter((action) => !action.action.startsWith("funnel_")) || [];

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

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Unique devices today</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.uniqueVisitorsToday ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Unique devices this week</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.uniqueVisitorsWeek ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Unique devices this month</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.uniqueVisitorsMonth ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Unique devices total</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.uniqueVisitorsTotal ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">New devices today</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.newVisitorsToday ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">New devices this week</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.newVisitorsWeek ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">New devices this month</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.newVisitorsMonth ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live listings now</p>
                <p className="text-3xl font-semibold mt-3">{traffic?.overview?.liveListingsNow ?? 0}</p>
              </div>
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

            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Conversion focus (account to list to browse)</h2>
              <p className="text-sm text-slate-600 mt-1">
                Signals showing how users move from discovery into account creation and listing intent.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Home to sign up rate</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatPercent(funnel?.homeToSignupRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {funnel?.signupUniqueVisitors || 0} signup visitors from {funnel?.homeUniqueVisitors || 0} home visitors
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Home to browse rate</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatPercent(funnel?.homeToBrowseRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {funnel?.browseUniqueVisitors || 0} browse visitors
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Signup to create listing</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatPercent(funnel?.signupToCreateListingRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {funnel?.createListingUniqueVisitors || 0} reached listing page
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Browse to listing details</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatPercent(funnel?.browseToDetailsRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {funnel?.listingDetailsUniqueVisitors || 0} visited listing detail pages
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Daily visitor trend</h2>
                <p className="text-sm text-slate-500 mt-1">Last 30 days</p>
                {traffic?.trends?.daily?.length ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600 max-h-64 overflow-y-auto pr-1">
                    {traffic.trends.daily.map((point) => (
                      <div
                        key={point.date}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2"
                      >
                        <span>{point.date}</span>
                        <span className="font-semibold text-slate-800">
                          {point.uniqueVisitors} unique / {point.newVisitors || 0} new / {point.pageViews} views
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No visitor trend data yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Where users go most</h2>
                <p className="text-sm text-slate-500 mt-1">Top pages by views</p>
                {traffic?.topPages?.length ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {traffic.topPages.slice(0, 8).map((page) => (
                      <div
                        key={page.pagePath}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2"
                      >
                        <span className="truncate pr-3 font-medium text-slate-800">{page.pagePath}</span>
                        <span className="whitespace-nowrap text-xs text-slate-500">
                          {page.views} views / {page.uniqueVisitors} unique
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No page data yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Listing mix</h2>
                <p className="text-sm text-slate-500 mt-1">Totals by category</p>
                {nonZeroBreakdownItems.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No breakdown data yet.</p>
                ) : (
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {nonZeroBreakdownItems.map((item) => (
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
                <h2 className="text-xl font-semibold text-slate-900">Most clicked actions</h2>
                <p className="text-sm text-slate-500 mt-1">Top click interactions</p>
                {traffic?.topActions?.length || conversionTargets.length ? (
                  <div className="mt-4 space-y-4">
                    {conversionTargets.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Top targets
                        </p>
                        <div className="mt-2 space-y-2">
                          {conversionTargets.slice(0, 6).map((target) => (
                            <div
                              key={target.target}
                              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                            >
                              <p className="font-semibold text-slate-900">{target.target}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {target.clicks} clicks | {target.uniqueVisitors} unique visitors
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {funnelActions.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Funnel signals
                        </p>
                        <div className="mt-2 space-y-2">
                          {funnelActions.slice(0, 8).map((action, index) => (
                            <div
                              key={`${action.action}-${action.target || "none"}-${index}`}
                              className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm"
                            >
                              <p className="font-semibold text-slate-900">
                                {humanizeAction(action.action)}
                                {action.target ? ` to ${action.target}` : ""}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {action.clicks} clicks | {action.uniqueVisitors} unique visitors
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {genericActions.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Top generic actions
                        </p>
                        <div className="mt-2 space-y-2">
                          {genericActions.slice(0, 6).map((action, index) => (
                            <div
                              key={`${action.action}-${action.target || "none"}-${index}`}
                              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                            >
                              <p className="font-semibold text-slate-900">
                                {humanizeAction(action.action)}
                                {action.target ? ` to ${action.target}` : ""}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {action.clicks} clicks | {action.uniqueVisitors} unique visitors
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No click data yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Primary CTA signal counts</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Click totals for the core growth actions.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Sign up clicks</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{primarySignals?.signUpClicks ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Browse clicks</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{primarySignals?.browseClicks ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">List CTA clicks</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{primarySignals?.listNowClicks ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Buy request clicks</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{primarySignals?.buyRequestClicks ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Route conversion map</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Unique visitors and views on key conversion routes.
                </p>
                {conversionRoutes.length ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600 max-h-64 overflow-y-auto pr-1">
                    {conversionRoutes.map((route) => (
                      <div
                        key={route.key}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2"
                      >
                        <span className="font-medium text-slate-800">{route.label}</span>
                        <span className="text-xs text-slate-500">
                          {route.uniqueVisitors} unique | {route.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No conversion route data yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Weekly trend</h2>
                <p className="text-sm text-slate-500 mt-1">Last 12 weeks</p>
                {traffic?.trends?.weekly?.length ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600 max-h-56 overflow-y-auto pr-1">
                    {traffic.trends.weekly.map((point) => (
                      <div
                        key={point.week}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2"
                      >
                        <span>{point.week}</span>
                        <span className="font-semibold text-slate-800">{point.uniqueVisitors} unique</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No weekly trend data yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Monthly trend</h2>
                <p className="text-sm text-slate-500 mt-1">Last 12 months</p>
                {traffic?.trends?.monthly?.length ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-600 max-h-56 overflow-y-auto pr-1">
                    {traffic.trends.monthly.map((point) => (
                      <div
                        key={point.month}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2"
                      >
                        <span>{point.month}</span>
                        <span className="font-semibold text-slate-800">{point.uniqueVisitors} unique</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No monthly trend data yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Live listing engagement</h2>
              <p className="text-sm text-slate-500 mt-1">
                Views, saves, and reach-outs for listings currently visible to the public.
              </p>
              {traffic?.listingEngagement?.topListings?.length ? (
                <div className="mt-4 space-y-3">
                  {traffic.listingEngagement.topListings.map((listing, index) => (
                    <div
                      key={`${listing.id}-${index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{listing.title}</p>
                        <Link
                          to={listing.listingPath}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          Open listing
                        </Link>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {listing.category} | {listing.listingType}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        {listing.views} views | {listing.saves} saves | {listing.reachOuts} reach-outs
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No live listing engagement data yet.</p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
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
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsReports;
