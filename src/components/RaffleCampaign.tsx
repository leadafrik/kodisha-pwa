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

type RaffleStatus = {
  inviteCode: string;
  entered: boolean;
  totalEntries: number;
  referralBonusEntries: number;
  referralQualifiedCount: number;
  eligibility?: {
    verified: boolean;
    hasListing: boolean;
    eligible: boolean;
  };
};

const prizes: Winner[] = [
  { place: "Grand prize", prize: 20000, entry: 0 },
  { place: "Runner-up", prize: 10000, entry: 0 },
  { place: "Third place", prize: 5000, entry: 0 },
];

const formatNumber = (value: number) => value.toLocaleString("en-US");

const RaffleCampaign: React.FC = () => {
  const { user } = useAuth();
  const campaignActive = isRaffleCampaignActive();
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [status, setStatus] = useState<RaffleStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  const endDateLabel = raffleCampaignConfig.endAt
    ? raffleCampaignConfig.endAt.toLocaleDateString()
    : null;

  const inviteCode = useMemo(() => {
    const fromStatus = status?.inviteCode?.trim() || "";
    if (fromStatus) return fromStatus;
    const fromUser = (user?.referralCode || "").trim();
    if (fromUser) return fromUser;
    const fallback = String(user?.id || user?._id || "").trim();
    return fallback;
  }, [status?.inviteCode, user?.referralCode, user?.id, user?._id]);

  const remaining = useMemo(() => {
    if (listingCount === null) return TARGET_LISTINGS;
    return Math.max(0, TARGET_LISTINGS - listingCount);
  }, [listingCount]);

  const percent = useMemo(() => {
    if (!listingCount) return 0;
    return Math.min(100, Math.round((listingCount / TARGET_LISTINGS) * 100));
  }, [listingCount]);

  const entryMessage = useMemo(() => {
    if (!user) {
      return "Sign in, get verified, and post one listing to join automatically.";
    }
    if (status?.entered) {
      return `You are entered with ${status.totalEntries} raffle ${
        status.totalEntries === 1 ? "entry" : "entries"
      }.`;
    }
    if (status?.eligibility?.verified && !status?.eligibility?.hasListing) {
      return "You are verified. Post one listing to enter instantly.";
    }
    if (!status?.eligibility?.verified && status?.eligibility?.hasListing) {
      return "You already listed. Complete verification to unlock your entry.";
    }
    return "Complete signup, verification, and one listing to enter.";
  }, [status, user]);

  useEffect(() => {
    if (!campaignActive) {
      setLoading(false);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await apiRequest(API_ENDPOINTS.unifiedListings.countActive);
        const count =
          data?.data?.activeListings ??
          data?.activeListings ??
          (typeof data === "number" ? data : 0);
        setListingCount(count);
      } catch (err) {
        console.error("Raffle count error", err);
        setError("Unable to load raffle progress right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
    const interval = window.setInterval(fetchCount, 60_000);
    return () => window.clearInterval(interval);
  }, [campaignActive]);

  useEffect(() => {
    if (!campaignActive || !user) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const response: any = await apiRequest(API_ENDPOINTS.raffle.me);
        const payload = response?.data || response;
        if (!cancelled) {
          setStatus({
            inviteCode: String(payload?.inviteCode || ""),
            entered: !!payload?.entered,
            totalEntries: Number(payload?.totalEntries || 0),
            referralBonusEntries: Number(payload?.referralBonusEntries || 0),
            referralQualifiedCount: Number(payload?.referralQualifiedCount || 0),
            eligibility: payload?.eligibility,
          });
        }
      } catch (err) {
        console.error("Raffle status error", err);
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = window.setInterval(fetchStatus, 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [campaignActive, user]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyFeedback("Invite code copied.");
    } catch {
      setCopyFeedback("Copy manually (Ctrl+C).");
    }
    window.setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleSpin = () => {
    if (!listingCount || listingCount < TARGET_LISTINGS) return;
    setIsSpinning(true);
    setTimeout(() => {
      const picks = new Set<number>();
      while (picks.size < 3) {
        const pick = Math.floor(Math.random() * Math.max(1, listingCount)) + 1;
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

  if (!campaignActive) return null;

  return (
    <>
      <a
        href="#raffle-campaign"
        className="fixed left-1/2 -translate-x-1/2 bottom-20 sm:bottom-7 z-50 inline-flex max-w-[94vw] items-center justify-center gap-2 rounded-full border-2 border-amber-300 bg-amber-400 px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-[0.08em] text-slate-900 shadow-2xl transition hover:bg-amber-300 animate-pulse"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
        </span>
        Raffle Live - Tap to Join
      </a>

      <section
        id="raffle-campaign"
        className="scroll-mt-24 relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-lime-50 to-emerald-50 p-6 shadow-[0_18px_60px_-24px_rgba(16,185,129,0.8)] fade-up space-y-6"
      >
        <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-amber-200/55 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />

        <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Raffle 3,000 listings target
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">
              Win KSh 20,000 - Built on trust
            </h2>
            <p className="mt-2 text-sm text-slate-700 max-w-2xl">
              Verified users who post at least one listing are entered automatically. Invite
              others using your code and gain extra entries once they sign up, verify, and list.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Progress</p>
            <p className="text-lg font-bold text-slate-900">
              {loading ? "--" : `${percent}%`} of 3,000
            </p>
          </div>
        </div>

        <div className="relative space-y-2">
          <div className="relative h-3 rounded-full bg-white/80 border border-emerald-100 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              {loading
                ? "Counting active listings..."
                : `${formatNumber(listingCount ?? 0)} / ${TARGET_LISTINGS.toLocaleString()} listed`}
            </span>
            <span>{remaining > 0 ? `${remaining.toLocaleString()} left` : "Target reached"}</span>
          </div>
          {error && <p className="text-xs text-rose-700">{error}</p>}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {["1. Sign up", "2. Verify ID + selfie", "3. Post one listing"].map((text) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-3 rounded-2xl border border-dashed border-emerald-300 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Ticket className="h-4 w-4" />
              <span>Entry status</span>
            </div>
            <p className="text-sm text-slate-700">{entryMessage}</p>
            {user && (
              <p className="text-xs text-slate-600">
                {statusLoading ? "Refreshing your raffle status..." : `Email: ${user.email || "No email on file"}`}
              </p>
            )}
            {status?.entered && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Total entries: <strong>{status.totalEntries}</strong>
                {status.referralBonusEntries > 0
                  ? ` (${status.referralBonusEntries} referral bonus)`
                  : ""}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Invite code
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="text"
                value={inviteCode}
                readOnly
                placeholder={user ? "Generating..." : "Sign in to get your code"}
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white ${
                  inviteCode
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Copy
              </button>
            </div>
            {copyFeedback && <p className="text-xs text-emerald-700">{copyFeedback}</p>}
            <p className="text-xs text-slate-600">
              Share this code. When your invitee signs up, gets verified, and lists, you receive
              extra raffle entries.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {prizes.map((prize, index) => (
            <div
              key={prize.place}
              className="rounded-2xl border border-amber-200 bg-white/90 p-4 text-center text-sm font-semibold text-slate-700"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {index === 0 ? "Champion" : index === 1 ? "Runner-up" : "Third"}
              </div>
              <div className="text-2xl font-black text-slate-900">
                {prize.prize.toLocaleString()} KSh
              </div>
              <div className="text-xs text-slate-500">{prize.place}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/85 p-5">
          <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-700" />
              <span>Draw status</span>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
              {listingCount && listingCount >= TARGET_LISTINGS
                ? "Ready for draw"
                : "Building the pool"}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            The raffle ends automatically once we hit {TARGET_LISTINGS.toLocaleString()} listings
            {endDateLabel ? ` or on ${endDateLabel}` : ""}. Winners are announced publicly and by
            email.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSpin}
              disabled={(listingCount ?? 0) < TARGET_LISTINGS || isSpinning}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                (listingCount ?? 0) >= TARGET_LISTINGS
                  ? "bg-emerald-700 hover:bg-emerald-800"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              <Zap className="h-4 w-4" />
              {isSpinning ? "Spinning..." : "Spin to reveal winners"}
            </button>
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
    </>
  );
};

export default RaffleCampaign;
