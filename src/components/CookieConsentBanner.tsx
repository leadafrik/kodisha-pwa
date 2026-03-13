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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-md shadow-[0_-16px_40px_rgba(28,25,23,0.12)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-stone-700">
          We use cookies for analytics and advertising to improve Agrisoko. You can accept or reject non-essential cookies.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="ui-btn-ghost px-4 py-2 text-sm"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="ui-btn-primary px-4 py-2 text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
