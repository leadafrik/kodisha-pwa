import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateBuyerRequest from "../components/CreateBuyerRequest";
import { useAuth } from "../contexts/AuthContext";
import { getMyBulkAccessStatus } from "../services/bulkApplicationsService";

const PostBuyRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const marketType = new URLSearchParams(location.search).get("marketType") === "b2b" ? "b2b" : "standard";
  const isB2B = marketType === "b2b";
  const [accessLoading, setAccessLoading] = useState(isB2B);
  const [hasBulkBuyerAccess, setHasBulkBuyerAccess] = useState(!isB2B);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    if (!isB2B || !user) {
      setAccessLoading(false);
      setHasBulkBuyerAccess(true);
      return;
    }

    let active = true;
    setAccessLoading(true);
    setAccessError("");
    getMyBulkAccessStatus()
      .then((status) => {
        if (!active) return;
        setHasBulkBuyerAccess(Boolean(status?.canPostB2BDemand || status?.isAdmin));
      })
      .catch((err: any) => {
        if (!active) return;
        setHasBulkBuyerAccess(false);
        setAccessError(err?.message || "Unable to verify bulk buyer access.");
      })
      .finally(() => {
        if (active) setAccessLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isB2B, user]);

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
    <div className="ui-page-shell py-10">
      <div className="mx-auto max-w-4xl px-4">
        {accessLoading && (
          <div className="ui-card mb-4 p-4 text-sm text-slate-600">
            Checking bulk buyer access...
          </div>
        )}

        {!accessLoading && isB2B && !hasBulkBuyerAccess && (
          <div className="ui-accent-panel mb-4 p-4 text-[#72281A] shadow-sm">
            <p className="text-sm font-semibold">Bulk buyer approval required before posting B2B demand.</p>
            {accessError && <p className="mt-1 text-xs">{accessError}</p>}
            <button
              type="button"
              onClick={() => navigate("/bulk?role=buyer")}
              className="ui-btn-primary mt-3 rounded-lg px-4 py-2 text-sm"
            >
              Apply as bulk buyer
            </button>
          </div>
        )}

        {!accessLoading && (!isB2B || hasBulkBuyerAccess) && (
          <>
        <div className="ui-card mb-4 flex flex-wrap gap-2 p-4">
          <span className="ui-chip-soft">
            {isB2B ? "Institutional demand" : "Clear request"}
          </span>
          <span className="ui-chip-soft">
            {isB2B ? "Spec + delivery window" : "County helps matching"}
          </span>
          <span className="ui-chip-soft">
            {isB2B ? "Bids and comparisons" : "Budget improves quotes"}
          </span>
        </div>

        <CreateBuyerRequest
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          marketType={marketType}
        />
          </>
        )}
      </div>
    </div>
  );
};

export default PostBuyRequest;
