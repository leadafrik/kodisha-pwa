import React from "react";
import { useNavigate } from "react-router-dom";
import CreateBuyerRequest from "../components/CreateBuyerRequest";

const PostBuyRequest: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Show success and redirect to browse requests
    navigate("/request", {
      state: { message: "Demand posted successfully!" },
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <CreateBuyerRequest onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Post Demand
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Get stronger offers faster
            </h2>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">1. Specific request</p>
              <p className="mt-1 text-sm text-slate-600">
                Clear quantity and location attract better suppliers.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">2. Verified responses</p>
              <p className="mt-1 text-sm text-slate-600">
                Suppliers can reply via call or in-app chat.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">3. Faster close</p>
              <p className="mt-1 text-sm text-slate-600">
                Better demand detail usually closes faster.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Pro tip</p>
            <p className="mt-1 text-sm text-emerald-800">
              Add budget and county for stronger replies.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PostBuyRequest;
