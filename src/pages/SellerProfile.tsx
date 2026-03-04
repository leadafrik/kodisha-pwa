import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, ShieldCheck } from "lucide-react";
import UserRatingBadge from "../components/UserRatingBadge";
import UserRatingsList from "../components/UserRatingsList";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { getOptimizedImageUrl } from "../utils/imageOptimization";
import { handleImageError } from "../utils/imageFallback";
import { getUserProfile, UserProfile } from "../services/userService";
import {
  buildMarketplaceCards,
  getMarketplaceCardScore,
  MarketplaceCard,
} from "../utils/marketplaceCards";
import {
  getSellerFollowStats,
  getSellerFollowStatus,
  toggleSellerFollow,
} from "../services/sellerFollowService";

const SellerProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { productListings, serviceListings, loading: listingsLoading } = useProperties();
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [error, setError] = useState<string>("");
  const [followState, setFollowState] = useState({
    isFollowing: false,
    followerCount: 0,
  });
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const loadSeller = async () => {
      if (!userId) {
        setError("Seller not found.");
        setLoadingSeller(false);
        return;
      }

      setLoadingSeller(true);
      setError("");

      try {
        const profile = await getUserProfile(userId);
        setSeller(profile);
      } catch (err: any) {
        setError(err?.message || "Failed to load seller profile.");
        setSeller(null);
      } finally {
        setLoadingSeller(false);
      }
    };

    void loadSeller();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadFollowState = async () => {
      try {
        if (user?._id && String(user._id) !== userId) {
          const data = await getSellerFollowStatus(userId);
          setFollowState({
            isFollowing: !!data.isFollowing,
            followerCount: data.followerCount || 0,
          });
          return;
        }

        const data = await getSellerFollowStats(userId);
        setFollowState({
          isFollowing: false,
          followerCount: data.followerCount || 0,
        });
      } catch {
        setFollowState({ isFollowing: false, followerCount: 0 });
      }
    };

    void loadFollowState();
  }, [user?._id, userId]);

  const sellerListings = useMemo(() => {
    if (!userId) return [];

    return buildMarketplaceCards(productListings as any[], serviceListings as any[])
      .filter((item) => String(item.ownerId || "") === userId)
      .sort((a, b) => {
        const scoreDiff = getMarketplaceCardScore(b) - getMarketplaceCardScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }, [productListings, serviceListings, userId]);

  const listingMix = useMemo(() => {
    return sellerListings.reduce<Record<string, number>>((acc, item) => {
      acc[item.typeLabel] = (acc[item.typeLabel] || 0) + 1;
      return acc;
    }, {});
  }, [sellerListings]);

  if (loadingSeller) {
    return <div className="p-6 text-center text-slate-600">Loading seller profile...</div>;
  }

  if (!seller || error) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Seller profile not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            {error || "This seller may no longer be active on Agrisoko."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/browse")}
            className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Back to browse
          </button>
        </div>
      </div>
    );
  }

  const locationParts = [seller.county, seller.constituency, seller.ward].filter(Boolean);
  const hasListings = sellerListings.length > 0;
  const isOwnProfile = !!user?._id && !!userId && String(user._id) === userId;

  const handleToggleFollow = async () => {
    if (!userId || isOwnProfile) return;
    if (!user?._id) {
      navigate(`/login?next=${encodeURIComponent(`/sellers/${userId}`)}`);
      return;
    }

    setFollowLoading(true);
    try {
      const result = await toggleSellerFollow(userId);
      setFollowState({
        isFollowing: !!result.isFollowing,
        followerCount: result.followerCount || 0,
      });
    } catch (err: any) {
      window.alert(err?.message || "Failed to update seller follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="flex gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
              {seller.profilePicture ? (
                <img
                  src={getOptimizedImageUrl(seller.profilePicture, {
                    width: 200,
                    height: 200,
                    fit: "fill",
                  })}
                  alt={seller.fullName}
                  onError={handleImageError}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-500">
                  {seller.fullName?.charAt(0)?.toUpperCase() || "S"}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">{seller.fullName}</h1>
                {seller.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified seller
                  </span>
                )}
              </div>

              {locationParts.length > 0 && (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {locationParts.join(", ")}
                </p>
              )}

              <div className="mt-3">
                <UserRatingBadge rating={seller.ratings} showCount size="md" verified={!!seller.isVerified} />
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
                Browse this seller&apos;s active Agrisoko listings and recent buyer reviews before you contact them.
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-500">
                {followState.followerCount} follower{followState.followerCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-2xl font-semibold text-slate-900">{sellerListings.length}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active listings</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-2xl font-semibold text-slate-900">{seller.ratings?.count || 0}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reviews</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-2xl font-semibold text-slate-900">{Object.keys(listingMix).length}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Categories</p>
            </div>
          </div>
        </div>

        {!isOwnProfile && (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={followLoading}
              className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
            >
              {followLoading
                ? "Updating..."
                : followState.isFollowing
                ? "Following seller"
                : "Follow seller"}
            </button>
          </div>
        )}

        {Object.keys(listingMix).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(listingMix).map(([label, count]) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {label} - {count}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Listings from this seller</h2>
              <p className="text-sm text-slate-500">Public listings currently live on Agrisoko.</p>
            </div>
          </div>

          {listingsLoading && !hasListings ? (
            <p className="text-sm text-slate-600">Loading listings...</p>
          ) : hasListings ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sellerListings.map((item: MarketplaceCard) => (
                <Link
                  key={item.id}
                  to={`/listings/${item.id}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="h-40 overflow-hidden bg-slate-100">
                    {item.image ? (
                      <img
                        src={getOptimizedImageUrl(item.image, {
                          width: 640,
                          height: 420,
                          fit: "fill",
                        })}
                        alt={item.title}
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                        No image available
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.typeLabel}
                      </span>
                      {item.priceLabel && (
                        <span className="text-sm font-semibold text-emerald-700">{item.priceLabel}</span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="line-clamp-2 text-sm text-slate-600">
                      {item.description || "No description provided."}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.locationLabel || item.county || "Location pending"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              No public listings from this seller right now.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <UserRatingsList userId={userId || ""} maxReviews={6} verified={!!seller.isVerified} />
        </section>
      </div>
    </div>
  );
};

export default SellerProfile;
