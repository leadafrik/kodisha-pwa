export const COOKIE_CONSENT_KEY = "agrisoko_cookie_consent";
export const GOOGLE_ADS_TAG_ID = "AW-17766894151";

export type CookieConsentValue = "accepted" | "rejected";

type GtagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
    __agrisokoAdsInitialized?: boolean;
  }
}

const getTagScriptSrc = () =>
  `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`;

const ensureGtagStub = () => {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (typeof window.gtag !== "function") {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }
};

const ensureGoogleTagScript = () => {
  const src = getTagScriptSrc();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

export const getCookieConsent = (): CookieConsentValue | null => {
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  return stored === "accepted" || stored === "rejected" ? stored : null;
};

export const setCookieConsent = (value: CookieConsentValue) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
};

export const enableGoogleAdsTracking = () => {
  ensureGtagStub();
  ensureGoogleTagScript();

  if (window.__agrisokoAdsInitialized) return;

  window.gtag?.("js", new Date());
  window.gtag?.("config", GOOGLE_ADS_TAG_ID);
  window.__agrisokoAdsInitialized = true;
};

