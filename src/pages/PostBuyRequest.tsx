import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateBuyerRequest from "../components/CreateBuyerRequest";

const PostBuyRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const marketType = new URLSearchParams(location.search).get("marketType") === "b2b" ? "b2b" : "standard";
  const isB2B = marketType === "b2b";

  const handleSuccess = () => {
    // Show success and redirect to browse requests
    navigate("/request", {
      state: { message: isB2B ? "B2B demand posted successfully!" : "Demand posted successfully!" },
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {isB2B ? "Institutional demand" : "Clear request"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {isB2B ? "Spec + delivery window" : "County helps matching"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {isB2B ? "Bids and comparisons" : "Budget improves quotes"}
          </span>
        </div>

        <CreateBuyerRequest
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          marketType={marketType}
        />
      </div>
    </div>
  );
};

export default PostBuyRequest;
