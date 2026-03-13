import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Flag,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS, adminApiRequest, apiRequest } from "../../config/api";
import { buildMarketplaceCards, MarketplaceCard } from "../../utils/marketplaceCards";
import { normalizeKenyanPhone } from "../../utils/phone";
import { getUserProfile, UserProfile } from "../../services/userService";

type AdminUserDetail = {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  verification?: { idVerified?: boolean; selfieVerified?: boolean };
  fraudFlags?: number;
  accountStatus?: string;
  createdAt?: string;
  ratings?: { average?: number; count?: number };
  listings?: Array<{ _id: string; title?: string; status?: string; createdAt?: string }>;
};

type BuyerRequestRecord = {
  _id: string;
  title?: string;
  productType?: string;
  category?: string;
  county?: string;
  status?: string;
  createdAt?: string;
};

type ReportRecord = {
  _id: string;
  reason?: string;
  status?: string;
  createdAt?: string;
  reportingUser?: { fullName?: string; email?: string };
  reportedUser?: { fullName?: string; email?: string };
};

type ActivityItem = {
  id: string;
  type: "listing" | "request" | "report";
  title: string;
  meta: string;
  createdAt: Date;
};

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const buildLocation = (profile?: UserProfile | null) =>
  [profile?.town, profile?.ward, profile?.constituency, profile?.county].filter(Boolean).join(", ");

const AdminUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [listingCards, setListingCards] = useState<MarketplaceCard[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequestRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState<{ average?: number; count?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          adminUserResponse,
          reportsResponse,
          profileResponse,
          ratingsResponse,
          buyerRequestsResponse,
          productsResponse,
          equipmentResponse,
          professionalResponse,
          inputsResponse,
        ] = await Promise.all([
          adminApiRequest(`/admin/users/${userId}`),
          adminApiRequest(`/admin/users/${userId}/reports`).catch(() => ({ data: [] })),
          getUserProfile(userId).catch(() => null),
          apiRequest(API_ENDPOINTS.ratings.getUserRatings(userId)).catch(() => ({ ratings: [], average: 0, count: 0 })),
          apiRequest(`${API_BASE_URL}/buyer-requests/user/${userId}`).catch(() => ({ data: [] })),
          apiRequest(API_ENDPOINTS.services.products.list).catch(() => ({ data: [] })),
          apiRequest(API_ENDPOINTS.services.equipment.list).catch(() => ({ data: [] })),
          apiRequest(API_ENDPOINTS.services.professional.list).catch(() => ({ data: [] })),
          apiRequest(API_ENDPOINTS.services.agrovets.list).catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        const adminUser = adminUserResponse?.data || null;
        const reportsData = toArray(reportsResponse?.data) as ReportRecord[];
        const buyerRequestData = toArray(buyerRequestsResponse?.data) as BuyerRequestRecord[];
        const productData = toArray(productsResponse?.data);
        const equipmentData = toArray(equipmentResponse?.data);
        const professionalData = toArray(professionalResponse?.data);
        const inputData = (toArray(inputsResponse?.data) as any[]).map((item) => ({ ...item, type: "agrovet" }));
        const ratingAggregate = ratingsResponse?.data?.aggregate || {};

        const sellerListings = buildMarketplaceCards(productData, [
          ...equipmentData,
          ...professionalData,
          ...inputData,
        ]).filter((item) => String(item.ownerId || "") === userId);

        setUser(adminUser);
        setPublicProfile(profileResponse);
        setListingCards(sellerListings);
        setBuyerRequests(buyerRequestData);
        setReports(reportsData);
        setRatingsSummary({
          average: ratingAggregate.average ?? adminUser?.ratings?.average,
          count: ratingAggregate.count ?? adminUser?.ratings?.count,
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load user profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const activity = useMemo<ActivityItem[]>(() => {
    const listingActivity = listingCards.map((listing) => ({
      id: `listing-${listing.id}`,
      type: "listing" as const,
      title: listing.title,
      meta: `Listing - ${listing.typeLabel}${listing.county ? ` - ${listing.county}` : ""}`,
      createdAt: listing.createdAt || new Date(0),
    }));

    const requestActivity = buyerRequests.map((request) => ({
      id: `request-${request._id}`,
      type: "request" as const,
      title: request.title || request.productType || "Buyer request",
      meta: `Buy request - ${request.category || "Uncategorized"}${request.county ? ` - ${request.county}` : ""}`,
      createdAt: request.createdAt ? new Date(request.createdAt) : new Date(0),
    }));

    const reportActivity = reports.map((report) => ({
      id: `report-${report._id}`,
      type: "report" as const,
      title: report.reason || "User report",
      meta: `Report - ${report.status || "pending"}`,
      createdAt: report.createdAt ? new Date(report.createdAt) : new Date(0),
    }));

    return [...listingActivity, ...requestActivity, ...reportActivity]
      .filter((item) => !Number.isNaN(item.createdAt.getTime()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 12);
  }, [buyerRequests, listingCards, reports]);

  if (loading) {
    return (
      <div className="ui-page-shell py-10">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-medium text-stone-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="ui-page-shell py-10">
        <div className="ui-card mx-auto max-w-4xl border-red-200 px-6 py-6">
          <p className="text-lg font-semibold text-red-700">Unable to load user profile</p>
          <p className="mt-2 text-sm text-stone-600">{error || "User not found."}</p>
          <button type="button" onClick={() => navigate("/admin/users")} className="ui-btn-primary mt-4 gap-2 px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to user management
          </button>
        </div>
      </div>
    );
  }

  const isVerified = !!user.verification?.idVerified;
  const locationLabel = buildLocation(publicProfile);
  const normalizedPhone = normalizeKenyanPhone(user.phone || publicProfile?.phone || "");

  return (
    <div className="ui-page-shell py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate("/admin/users")} className="ui-btn-ghost gap-2 px-4 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to user management
          </button>
          <Link to={`/sellers/${user._id}`} target="_blank" rel="noreferrer" className="ui-btn-secondary gap-2 px-4 py-2 text-sm">
            View public seller profile
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <section className="ui-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="ui-section-kicker">User profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-stone-900">{user.fullName}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${isVerified ? "bg-[#FDF5F3] text-[#A0452E]" : "bg-amber-100 text-amber-800"}`}>
                  {isVerified ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {isVerified ? "Verified" : "Unverified"}
                </span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${user.accountStatus === "suspended" ? "bg-red-100 text-red-800" : "bg-stone-100 text-stone-700"}`}>
                  {user.accountStatus === "suspended" ? <Lock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {user.accountStatus === "suspended" ? "Suspended" : "Active"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 font-semibold text-stone-700">
                  <Flag className="h-4 w-4" />
                  {user.fraudFlags || 0} fraud flags
                </span>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-stone-600 sm:text-right">
              <p className="inline-flex items-center gap-2 sm:justify-end">
                <Mail className="h-4 w-4" />
                {user.email || "No email"}
              </p>
              <p className="inline-flex items-center gap-2 sm:justify-end">
                <Phone className="h-4 w-4" />
                {normalizedPhone || "No phone"}
              </p>
              <p>{locationLabel || "Location not set"}</p>
              <p>Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="ui-card-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Active listings</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{listingCards.length}</p>
          </div>
          <div className="ui-card-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Buy requests</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{buyerRequests.length}</p>
          </div>
          <div className="ui-card-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Reports</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{reports.length}</p>
          </div>
          <div className="ui-card-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Rating</p>
            <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-stone-900">
              <Star className="h-5 w-5 text-amber-500" />
              {typeof ratingsSummary?.average === "number" ? ratingsSummary.average.toFixed(1) : "-"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {ratingsSummary?.count || 0} review{ratingsSummary?.count === 1 ? "" : "s"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="ui-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ui-section-kicker">Listings</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">Current public inventory</h2>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {listingCards.length === 0 ? (
                  <p className="text-sm text-stone-500">No public listings found for this user.</p>
                ) : (
                  listingCards.map((listing) => (
                    <div key={listing.id} className="ui-card-soft p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-stone-900">{listing.title}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            {listing.typeLabel}{listing.county ? ` - ${listing.county}` : ""}
                          </p>
                          {listing.priceLabel && <p className="mt-2 text-sm font-semibold text-[#A0452E]">{listing.priceLabel}</p>}
                        </div>
                        <Link to={`/listings/${listing.id}`} target="_blank" rel="noreferrer" className="ui-btn-ghost gap-2 px-3 py-2 text-sm">
                          Open listing
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Buyer requests</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Requests posted by this user</h2>

              <div className="mt-4 space-y-3">
                {buyerRequests.length === 0 ? (
                  <p className="text-sm text-stone-500">No buyer requests found.</p>
                ) : (
                  buyerRequests.map((request) => (
                    <div key={request._id} className="ui-card-soft p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-stone-900">{request.title || request.productType || "Buyer request"}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            {request.category || "Uncategorized"}
                            {request.county ? ` - ${request.county}` : ""}
                            {request.status ? ` - ${request.status}` : ""}
                          </p>
                        </div>
                        <Link to={`/request/${request._id}`} target="_blank" rel="noreferrer" className="ui-btn-ghost gap-2 px-3 py-2 text-sm">
                          Open request
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="ui-card p-5">
              <p className="ui-section-kicker">Activity</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Recent account activity</h2>

              <div className="mt-4 space-y-3">
                {activity.length === 0 ? (
                  <p className="text-sm text-stone-500">No recent activity found.</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="ui-card-soft p-4">
                      <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                      <p className="mt-1 text-xs text-stone-500">{item.meta}</p>
                      <p className="mt-2 text-xs text-stone-400">{item.createdAt.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="ui-card p-5">
              <p className="ui-section-kicker">Reports</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">Fraud and moderation history</h2>

              <div className="mt-4 space-y-3">
                {reports.length === 0 ? (
                  <p className="text-sm text-stone-500">No reports found for this user.</p>
                ) : (
                  reports.slice(0, 10).map((report) => (
                    <div key={report._id} className="ui-card-soft p-4">
                      <p className="text-sm font-semibold text-stone-900">{report.reason || "User report"}</p>
                      <p className="mt-1 text-xs text-stone-500">Status: {report.status || "pending"}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Reporter: {report.reportingUser?.fullName || report.reportingUser?.email || "Unknown"}
                      </p>
                      <p className="mt-2 text-xs text-stone-400">{formatDate(report.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminUserProfile;
