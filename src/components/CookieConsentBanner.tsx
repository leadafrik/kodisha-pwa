import React, { useEffect, useState } from "react";
import {
  enableGoogleAdsTracking,
  getCookieConsent,
  setCookieConsent,
} from "../utils/cookieConsent";

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === "accepted") {
      enableGoogleAdsTracking();
      setVisible(false);
      return;
    }

    if (consent === "rejected") {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, []);

  const handleAccept = () => {
    setCookieConsent("accepted");
    enableGoogleAdsTracking();
    setVisible(false);
  };

  const handleReject = () => {
    setCookieConsent("rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-2xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-700">
          We use cookies for analytics and advertising to improve Agrisoko. You can accept or reject non-essential cookies.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;

