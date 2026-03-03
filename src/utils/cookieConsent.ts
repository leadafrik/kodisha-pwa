export const COOKIE_CONSENT_KEY = "agrisoko_cookie_consent";
export const GOOGLE_ADS_TAG_ID = "AW-17766894151";
export const GOOGLE_ANALYTICS_TAG_ID = "G-HP4LZ027BY";

const GOOGLE_TAG_IDS = [GOOGLE_ADS_TAG_ID, GOOGLE_ANALYTICS_TAG_ID] as const;

export type CookieConsentValue = "accepted" | "rejected";

type GtagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
    __agrisokoGoogleTagsInitialized?: boolean;
  }
}

const getTagScriptSrc = () =>
  `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_TAG_ID}`;

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

  if (window.__agrisokoGoogleTagsInitialized) return;

  window.gtag?.("js", new Date());
  GOOGLE_TAG_IDS.forEach((tagId) => {
    window.gtag?.("config", tagId);
  });
  window.__agrisokoGoogleTagsInitialized = true;
};

const hasTrackingConsent = () => getCookieConsent() === "accepted";

const ensureTrackingReady = () => {
  if (!hasTrackingConsent()) return false;
  enableGoogleAdsTracking();
  return typeof window.gtag === "function";
};

export const trackGooglePageView = ({
  pagePath,
  pageTitle,
}: {
  pagePath: string;
  pageTitle?: string;
}) => {
  if (typeof window === "undefined" || !ensureTrackingReady()) return;

  window.gtag?.("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });
};

export const trackGoogleEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window === "undefined" || !ensureTrackingReady()) return;

  window.gtag?.("event", eventName, {
    ...params,
  });
};
