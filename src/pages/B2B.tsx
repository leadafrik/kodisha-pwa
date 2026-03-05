import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, ClipboardList } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const B2B: React.FC = () => {
  const { user } = useAuth();
  const applyLink = user
    ? "/bulk"
    : `/login?mode=signup&next=${encodeURIComponent("/bulk")}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
            <Building2 className="h-4 w-4" />
            Agrisoko B2B
          </div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Institutional procurement, demand-first
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-600">
            Built for restaurants, schools, processors, and distributors. Buyers post
            clear demand. Sellers submit offers. You close with verifiable profiles.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to={applyLink}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Apply for bulk access
            </Link>
            <Link
              to={user ? "/bulk/orders" : "/bulk"}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Open bulk order board
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-3 text-lg font-semibold">1. Post requirements</h2>
            <p className="mt-1 text-sm text-slate-600">
              Quantity, quality specs, county, delivery window, and budget.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-3 text-lg font-semibold">2. Compare offers</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review supplier responses and negotiate directly in chat.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ArrowRight className="h-5 w-5 text-emerald-700" />
            <h2 className="mt-3 text-lg font-semibold">3. Close faster</h2>
            <p className="mt-1 text-sm text-slate-600">
              Accept the right offer and execute with tracked follow-up.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default B2B;
