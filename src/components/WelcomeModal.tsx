import React from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, CirclePlus, X } from "lucide-react";
import { useFirstVisit } from "../hooks/useFirstVisit";
import { useAuth } from "../contexts/AuthContext";

const WelcomeModal: React.FC = () => {
  const { user } = useAuth();
  const { shouldShow, dismiss } = useFirstVisit();
  const navigate = useNavigate();

  if (!shouldShow || !user) return null;

  const firstName = (user.name || "").split(" ")[0] || "there";

  const handleBrowse = () => {
    dismiss();
    navigate("/browse");
  };

  const handleSell = () => {
    dismiss();
    navigate("/create-listing");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 p-0 sm:items-center sm:p-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
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

        {/* Choice cards */}
        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleBrowse}
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
            onClick={handleSell}
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
    </div>
  );
};

export default WelcomeModal;
