import React, { useMemo, useState } from "react";
import { Sparkles, Ticket, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertyContext";
import {
  isRaffleCampaignActive,
  raffleCampaignConfig,
} from "../config/raffleCampaign";

const TARGET_LISTINGS = 3000;

type Winner = {
  place: string;
  prize: number;
  entry: number;
};

const prizes: Winner[] = [
  { place: "Grand prize", prize: 20000, entry: 0 },
  { place: "Runner-up", prize: 10000, entry: 0 },
  { place: "Third place", prize: 5000, entry: 0 },
];

const getOwnerId = (item: any) =>
  String(item?.owner?._id || item?.ownerId || item?.owner || "");

const isVisibleStatus = (status: any) => {
  const normalized = String(status || "").toLowerCase();
  if (!normalized) return true;
  return ![
    "draft",
    "rejected",
    "deleted",
    "removed",
    "archived",
    "inactive",
    "delisted",
  ].includes(normalized);
};

const RaffleCampaign: React.FC = () => {
  const { user } = useAuth();
  const { properties, productListings, serviceListings } = useProperties();
  const campaignActive = isRaffleCampaignActive();

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const endDateLabel = raffleCampaignConfig.endAt
    ? raffleCampaignConfig.endAt.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const userId = String(user?.id || user?._id || "");

  const listingCount = useMemo(() => {
    const liveProducts = (productListings || []).filter((p: any) =>
      isVisibleStatus(p?.publishStatus || p?.status)
    ).length;

    const liveServices = (serviceListings || []).filter((s: any) => {
      if (!isVisibleStatus(s?.publishStatus || s?.status)) return false;
      if (s?.isDeleted === true || s?.deletedAt) return false;
      return true;
    }).length;

    const liveLand = (properties || []).filter((l: any) =>
      isVisibleStatus(l?.publishStatus || l?.status)
    ).length;

    return liveProducts + liveServices + liveLand;
  }, [productListings, properties, serviceListings]);

  const userHasListing = useMemo(() => {
    if (!userId) return false;
    const inProducts = (productListings || []).some((item: any) => getOwnerId(item) === userId);
    if (inProducts) return true;
    const inServices = (serviceListings || []).some((item: any) => getOwnerId(item) === userId);
    if (inServices) return true;
    return (properties || []).some((item: any) => getOwnerId(item) === userId);
  }, [productListings, properties, serviceListings, userId]);

  const percent = Math.min(
    100,
    Math.round((Math.max(0, listingCount) / TARGET_LISTINGS) * 100)
  );
  const remaining = Math.max(0, TARGET_LISTINGS - listingCount);

  const userVerified =
    !!user &&
    (user.verificationStatus === "verified" || user.isVerified === true);
  const readyForEntry = !!user && userVerified && userHasListing;

  const inviteCode = String(user?.id || user?._id || "");
  const entryMultiplier = inviteCode ? 2 : 1;
  const entryMessage = readyForEntry
    ? `You're in with ${entryMultiplier} raffle entr${
        entryMultiplier > 1 ? "ies" : "y"
      }.`
    : "Sign up, verify, and post at least one listing to enter automatically.";

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyFeedback("Invite code copied.");
    } catch {
      setCopyFeedback("Copy manually from your profile ID.");
    }
    window.setTimeout(() => setCopyFeedback(null), 2500);
  };

  if (!campaignActive) return null;

  return (
    <section
      id="raffle-campaign"
      className="rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-lg space-y-6"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Live Raffle
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Win KSh 20,000 as we hit 3,000 listings
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Sign up, get verified, and list. Qualified users enter automatically. Invite a friend
            using your code to unlock double entries when they verify and list.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Progress</p>
          <p className="text-lg font-semibold text-slate-900">{percent}% of 3,000</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-300 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{listingCount.toLocaleString()} / 3,000 listed</span>
          <span>{remaining > 0 ? `${remaining.toLocaleString()} left` : "Target reached"}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["1. Sign up", "2. Get verified", "3. Post a listing"].map((step) => (
          <div
            key={step}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Ticket className="h-4 w-4" />
            <span>Entry status</span>
          </div>
          <p className="mt-2 text-sm text-slate-700">{entryMessage}</p>
          <p className="mt-1 text-xs text-slate-500">
            You receive an email confirmation once your account qualifies.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Invite code
          </p>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <input
              readOnly
              value={inviteCode}
              placeholder="Log in to get your code"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!inviteCode}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white ${
                inviteCode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300"
              }`}
            >
              Copy
            </button>
          </div>
          {copyFeedback && <p className="text-xs text-emerald-700">{copyFeedback}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {prizes.map((prize) => (
          <div
            key={prize.place}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{prize.place}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{prize.prize.toLocaleString()} KSh</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">Draw status</p>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {listingCount >= TARGET_LISTINGS ? "Ready for draw" : "In progress"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          The raffle ends when we hit 3,000 listings{endDateLabel ? ` or on ${endDateLabel}` : ""}.
        </p>
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          Winners are selected after target completion and announced publicly on Agrisoko channels.
        </div>
      </div>
    </section>
  );
};

export default RaffleCampaign;
