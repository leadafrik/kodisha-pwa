import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  CirclePlus,
  X,
  ArrowLeft,
  Search,
  MessageCircle,
  ClipboardList,
  Camera,
  Users,
  BadgeCheck,
} from "lucide-react";
import { useFirstVisit } from "../hooks/useFirstVisit";
import { useAuth } from "../contexts/AuthContext";

type Path = "buyer" | "seller" | null;

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BUYER_STEPS: Step[] = [
  {
    icon: <Search className="h-5 w-5 text-[#A0452E]" />,
    title: "Browse listings",
    description:
      "Search by category, keyword, or county to find produce, livestock, inputs, and services.",
  },
  {
    icon: <MessageCircle className="h-5 w-5 text-[#A0452E]" />,
    title: "Contact sellers directly",
    description:
      "No middlemen. Reach sellers via WhatsApp or the platform and agree on price and delivery.",
  },
  {
    icon: <ClipboardList className="h-5 w-5 text-[#A0452E]" />,
    title: "Or post a buy request",
    description:
      "Tell sellers what you need and your budget — let them come to you.",
  },
];

const SELLER_STEPS: Step[] = [
  {
    icon: <Camera className="h-5 w-5 text-[#A0452E]" />,
    title: "Create a free listing",
    description:
      "Add clear photos, a price, quantity, and your county. Takes about two minutes.",
  },
  {
    icon: <Users className="h-5 w-5 text-[#A0452E]" />,
    title: "Buyers contact you",
    description:
      "Interested buyers message you directly. No commissions, no fees to close a deal.",
  },
  {
    icon: <BadgeCheck className="h-5 w-5 text-[#A0452E]" />,
    title: "Build trust with a verified profile",
    description:
      "Complete your profile and verify your ID to get a trust badge and more inquiries.",
  },
];

const WelcomeModal: React.FC = () => {
  const { user } = useAuth();
  const { shouldShow, dismiss } = useFirstVisit();
  const navigate = useNavigate();
  const [path, setPath] = useState<Path>(null);

  if (!shouldShow || !user) return null;

  const firstName = (user.name || "").split(" ")[0] || "there";

  const handleGo = () => {
    dismiss();
    if (path === "buyer") navigate("/browse");
    else navigate("/create-listing");
  };

  const steps = path === "buyer" ? BUYER_STEPS : SELLER_STEPS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-0 sm:items-center sm:p-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Step 1: Choose path ─────────────────────────── */}
        {!path && (
          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A0452E]">
                  Welcome to Agrisoko
                </p>
                <h2 className="mt-1 text-2xl font-bold text-stone-900">
                  Hi {firstName}, what are you here to do?
                </h2>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setPath("buyer")}
                className="flex items-center gap-4 rounded-2xl border-2 border-stone-200 bg-[#FAF7F2] p-4 text-left transition hover:border-[#E8A08E] hover:bg-[#FDF5F3] active:scale-[0.98]"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDF5F3]">
                  <Leaf className="h-6 w-6 text-[#A0452E]" />
                </span>
                <div>
                  <p className="font-semibold text-stone-900">Browse and buy</p>
                  <p className="mt-0.5 text-sm text-stone-600">
                    Find produce, livestock, inputs, and services across Kenya.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPath("seller")}
                className="flex items-center gap-4 rounded-2xl border-2 border-stone-200 bg-[#FAF7F2] p-4 text-left transition hover:border-[#E8A08E] hover:bg-[#FDF5F3] active:scale-[0.98]"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDF5F3]">
                  <CirclePlus className="h-6 w-6 text-[#A0452E]" />
                </span>
                <div>
                  <p className="font-semibold text-stone-900">List my produce</p>
                  <p className="mt-0.5 text-sm text-stone-600">
                    Post a listing and reach verified buyers across Kenya. Free right now.
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-4 w-full text-center text-sm text-stone-500 hover:text-stone-700"
            >
              I'll explore on my own
            </button>
          </div>
        )}

        {/* ── Step 2: How it works ─────────────────────────── */}
        {path && (
          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPath(null)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A0452E]">
              Here's how it works
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-900">
              {path === "buyer"
                ? "Finding what you need"
                : "Getting your first listing live"}
            </h2>

            <ol className="mt-5 space-y-4">
              {steps.map((step, i) => (
                <li key={step.title} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDF5F3]">
                      {step.icon}
                    </span>
                    {i < steps.length - 1 && (
                      <span
                        className="mt-1 w-px bg-stone-100"
                        style={{ minHeight: 16 }}
                      />
                    )}
                  </div>
                  <div className="pb-1 pt-1">
                    <p className="font-semibold text-stone-900">
                      <span className="mr-1.5 text-xs font-bold text-[#A0452E]">
                        {i + 1}.
                      </span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-stone-500">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={handleGo}
              className="mt-6 w-full rounded-xl bg-[#A0452E] py-3 text-sm font-semibold text-white transition hover:bg-[#8B3525] active:scale-[0.98]"
            >
              {path === "buyer"
                ? "Browse listings →"
                : "Create my first listing →"}
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full text-center text-sm text-stone-500 hover:text-stone-700"
            >
              I'll explore on my own
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeModal;
