import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, Ticket, CheckCircle2, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest, API_ENDPOINTS } from "../config/api";
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

const formatNumber = (value: number) => value.toLocaleString("en-US");

const prizes: Winner[] = [
  { place: "Grand prize", prize: 20000, entry: 0 },
  { place: "Runner-up", prize: 10000, entry: 0 },
  { place: "Third place", prize: 5000, entry: 0 },
];

const RaffleCampaign: React.FC = () => {
  const { user } = useAuth();
  const campaignActive = isRaffleCampaignActive();
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>(
    () => user?.id || user?._id || ""
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const endDateLabel = raffleCampaignConfig.endAt
    ? raffleCampaignConfig.endAt.toLocaleDateString()
    : null;

  useEffect(() => {
    setInviteCode(user?.id || user?._id || "");
  }, [user?.id, user?._id]);

  const remaining = useMemo(() => {
    if (listingCount === null) return TARGET_LISTINGS;
    return Math.max(0, TARGET_LISTINGS - listingCount);
  }, [listingCount]);

  const percent = useMemo(() => {
    if (!listingCount) return 0;
    return Math.min(100, Math.round((listingCount / TARGET_LISTINGS) * 100));
  }, [listingCount]);

  const readyForEntry =
    !!user && user.verificationStatus === "verified" && listingCount !== null;
  const entryMultiplier = inviteCode.trim() ? 2 : 1;
  const entryMessage = readyForEntry
    ? `You're in with ${entryMultiplier} raffle entry${entryMultiplier > 1 ? "ies" : ""}.`
    : "Sign up, verify, then list to join automatically.";

  useEffect(() => {
    if (!campaignActive) {
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await apiRequest(
          API_ENDPOINTS.unifiedListings.countActive
        );
        const count =
          data?.data?.activeListings ??
          data?.activeListings ??
          (typeof data === "number" ? data : 0);
        setListingCount(count);
      } catch (err) {
        console.error("Raffle count error", err);
        setError("Can't load raffle progress right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
    const interval = window.setInterval(fetchCount, 60_000);
    return () => window.clearInterval(interval);
  }, [campaignActive]);

  const handleCopyCode = async () => {
    if (!inviteCode.trim()) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyFeedback("Invite code copied!");
    } catch {
      setCopyFeedback("Copy from your keyboard (Ctrl+C).");
    }
    window.setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleSpin = () => {
    if (!listingCount || listingCount < TARGET_LISTINGS) return;
    setIsSpinning(true);
    setTimeout(() => {
      const picks = new Set<number>();
      const maxEntries = listingCount;
      while (picks.size < 3) {
        const pick = Math.floor(Math.random() * Math.max(1, maxEntries)) + 1;
        picks.add(pick);
      }
      const drawn = Array.from(picks).map((entry, index) => ({
        ...prizes[index],
        entry,
      }));
      setWinners(drawn);
      setIsSpinning(false);
    }, 1300);
  };

  if (!campaignActive) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg fade-up space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Raffle: 3K listings
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Claim your chance at KSh 20,000
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Verified sellers who list join automatically. Invite a friend with your code and
            they push you to double entries. The draw ends once we hit 3,000 listings.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Progress
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {loading ? "--" : `${percent}%`} of 3,000
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            {loading
              ? "Counting listings..."
              : `${formatNumber(listingCount ?? 0)} / ${TARGET_LISTINGS.toLocaleString()} listed`}
          </span>
          <span>{remaining > 0 ? `${remaining.toLocaleString()} left` : "Target reached!"}</span>
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[user ? "1. Sign up" : "1. Create your account", "2. Get verified", "3. List anything"].map(
          (text, index) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{text}</span>
            </div>
          )
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Ticket className="h-4 w-4" />
            <span>Raffle entry status</span>
          </div>
          <p className="text-sm text-slate-600">{entryMessage}</p>
          <p className="text-xs text-slate-500">
            You will receive an email at{" "}
            <strong className="text-slate-900">{user?.email || "your inbox"}</strong> once you qualify.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Invite code
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Give this to a friend"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Copy
            </button>
          </div>
          {copyFeedback && (
            <p className="text-xs text-emerald-600">{copyFeedback}</p>
          )}
          <p className="text-xs text-slate-500">
            When someone signs up with your invite code, is verified, and lists, you earn
            double entries and a thank-you email.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {prizes.map((prize, index) => (
          <div
            key={prize.place}
            className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm font-semibold text-slate-700"
          >
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {index === 0 ? "Champion" : index === 1 ? "Runner-up" : "Third"}
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {prize.prize.toLocaleString()} KSh
            </div>
            <div className="text-xs text-slate-500">{prize.place}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span>Draw status</span>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
            {listingCount && listingCount >= TARGET_LISTINGS
              ? "Ready for draw"
              : "Still building the pool"}
          </span>
        </div>
        <p className="text-sm text-slate-600">
          The raffle ends automatically once the platform hits {TARGET_LISTINGS.toLocaleString()} listings
          {endDateLabel ? ` or on ${endDateLabel}` : ""}. Winners receive confirmation emails.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSpin}
            disabled={(listingCount ?? 0) < TARGET_LISTINGS || isSpinning}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
              (listingCount ?? 0) >= TARGET_LISTINGS
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            <Zap className="h-4 w-4" />
            {isSpinning ? "Spinning..." : "Spin to reveal winners"}
          </button>
          <p className="text-xs text-slate-500">
            The spinner chooses random entries — once drawn, we share winners publicly and by email.
          </p>
        </div>
        {winners.length > 0 && (
          <ul className="space-y-2 text-xs text-slate-700">
            {winners.map((winner) => (
              <li key={winner.place} className="flex items-center justify-between">
                <span>{winner.place}</span>
                <span>Entry #{formatNumber(winner.entry)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default RaffleCampaign;
