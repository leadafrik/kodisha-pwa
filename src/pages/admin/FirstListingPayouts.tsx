import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { adminApiRequest } from "../../config/api";

interface BonusUser {
  _id: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  county?: string;
  firstListingBonus: {
    eligible: boolean;
    paid: boolean;
    paidAt?: string;
    mpesaRef?: string;
  };
  verification?: {
    idVerified?: boolean;
  };
  listingCount?: number;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const FirstListingPayouts: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<BonusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"unpaid" | "paid">("unpaid");

  // Mark-paid modal state
  const [markingUser, setMarkingUser] = useState<BonusUser | null>(null);
  const [mpesaRef, setMpesaRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin" || user?.role === "moderator";

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApiRequest(
        `/api/admin/bonuses/first-listing?paid=${tab === "paid"}`
      );
      setItems(Array.isArray(data.users) ? data.users : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load payouts.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleMarkPaid = async () => {
    if (!markingUser || !mpesaRef.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await adminApiRequest(
        `/api/admin/bonuses/first-listing/${markingUser._id}/mark-paid`,
        { method: "POST", body: JSON.stringify({ mpesaRef: mpesaRef.trim() }) }
      );
      setMarkingUser(null);
      setMpesaRef("");
      void loadItems();
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to mark as paid.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A0452E]">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              KES 50 first-listing payouts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Users who are ID-verified and have exactly one active listing approved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {(["unpaid", "paid"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                tab === t
                  ? "bg-[#A0452E] text-white shadow"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "unpaid" ? "Pending payout" : "Paid"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#A0452E]" />
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <CheckCircle size={36} className="mx-auto text-emerald-400" />
            <p className="mt-4 font-semibold text-slate-700">
              {tab === "unpaid" ? "No pending payouts" : "No paid records yet"}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">County</th>
                  <th className="px-5 py-3 text-left">Verified</th>
                  {tab === "paid" && <th className="px-5 py-3 text-left">M-Pesa ref</th>}
                  {tab === "paid" && <th className="px-5 py-3 text-left">Paid on</th>}
                  {tab === "unpaid" && <th className="px-5 py-3 text-left">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {u.fullName || u.name || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{u.phone || "—"}</td>
                    <td className="px-5 py-4 text-slate-600 capitalize">{u.county || "—"}</td>
                    <td className="px-5 py-4">
                      {u.verification?.idVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                          Unverified
                        </span>
                      )}
                    </td>
                    {tab === "paid" && (
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {u.firstListingBonus.mpesaRef || "—"}
                      </td>
                    )}
                    {tab === "paid" && (
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(u.firstListingBonus.paidAt)}
                      </td>
                    )}
                    {tab === "unpaid" && (
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setMarkingUser(u);
                            setMpesaRef("");
                            setSubmitError("");
                          }}
                          className="rounded-lg bg-[#A0452E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8B3525] transition"
                        >
                          Mark paid
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
              {items.length} {items.length === 1 ? "record" : "records"}
            </div>
          </div>
        )}
      </div>

      {/* Mark-paid modal */}
      {markingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMarkingUser(null)}
            aria-label="Close"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A0452E]">
              Mark as paid
            </p>
            <h2 className="mt-2 text-lg font-bold text-slate-900">
              {markingUser.fullName || markingUser.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Phone: {markingUser.phone || "—"}
            </p>
            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                M-Pesa confirmation code
              </span>
              <input
                type="text"
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                placeholder="e.g. QGL2XK7B90"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-[#A0452E] focus:outline-none focus:ring-2 focus:ring-[#A0452E]/20"
              />
            </label>
            {submitError && (
              <p className="mt-3 text-xs text-red-600">{submitError}</p>
            )}
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={!mpesaRef.trim() || submitting}
              className="mt-5 w-full rounded-xl bg-[#A0452E] py-3 text-sm font-semibold text-white transition hover:bg-[#8B3525] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Confirm payment →"}
            </button>
            <button
              type="button"
              onClick={() => setMarkingUser(null)}
              className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstListingPayouts;
