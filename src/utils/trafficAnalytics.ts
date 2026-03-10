import { API_BASE_URL } from "../config/api";

type TrafficEventType = "page_view" | "cta_click";
type TrafficAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPath?: string;
  referrerHost?: string;
};

const VISITOR_ID_KEY = "agrisoko_visitor_id";
const LAST_PAGE_VIEW_KEY = "agrisoko_last_page_view";
const LAST_PAGE_VIEW_TS_KEY = "agrisoko_last_page_view_ts";
const ATTRIBUTION_KEY = "agrisoko_traffic_attribution";

const PAGE_VIEW_THROTTLE_MS = 2000;
const METADATA_MAX_LENGTH = 120;

const makeVisitorId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getOrCreateVisitorId = () => {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const created = makeVisitorId();
  localStorage.setItem(VISITOR_ID_KEY, created);
  return created;
};

const normalizePath = (value?: string) => {
  if (!value) return "/";
  const path = value.split("?")[0].split("#")[0];
  return path.startsWith("/") ? path : "/";
};

const clampMetaValue = (value: string, max = METADATA_MAX_LENGTH) =>
  value.trim().slice(0, max);

const sanitizeMetaValue = (value?: string | null) => {
  if (!value || typeof value !== "string") return "";
  return clampMetaValue(value);
};

const readStoredAttribution = (): TrafficAttribution => {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TrafficAttribution;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
};

const readAttributionFromUrl = (): Partial<TrafficAttribution> => {
  const params = new URLSearchParams(window.location.search || "");
  const utmSource = sanitizeMetaValue(params.get("utm_source"));
  const utmMedium = sanitizeMetaValue(params.get("utm_medium"));
  const utmCampaign = sanitizeMetaValue(params.get("utm_campaign"));
  const utmTerm = sanitizeMetaValue(params.get("utm_term"));
  const utmContent = sanitizeMetaValue(params.get("utm_content"));
  const hasUtm =
    !!utmSource || !!utmMedium || !!utmCampaign || !!utmTerm || !!utmContent;

  if (!hasUtm) return {};

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    landingPath: normalizePath(window.location.pathname),
  };
};

const getReferrerHost = () => {
  try {
    if (!document.referrer) return "";
    const refUrl = new URL(document.referrer);
    if (refUrl.origin === window.location.origin) return "";
    return sanitizeMetaValue(refUrl.hostname);
  } catch {
    return "";
  }
};

const getTrafficAttribution = (): TrafficAttribution => {
  const fromUrl = readAttributionFromUrl();
  const stored = readStoredAttribution();

  const merged: TrafficAttribution = {
    ...stored,
    ...fromUrl,
  };

  if (Object.keys(fromUrl).length > 0) {
    try {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(merged));
    } catch {
      // Ignore localStorage errors.
    }
  }

  const referrerHost = getReferrerHost();
  if (referrerHost && !merged.referrerHost) {
    merged.referrerHost = referrerHost;
  }

  return merged;
};

const postTrafficEvent = async (payload: {
  eventType: TrafficEventType;
  pagePath: string;
  action?: string;
  target?: string;
  metadata?: TrafficAttribution;
}) => {
  try {
    const visitorId = getOrCreateVisitorId();
    await fetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        ...payload,
      }),
    });
  } catch {
    // Ignore analytics errors.
  }
};

export const trackTrafficPageView = (pagePath: string) => {
  const normalizedPage = normalizePath(pagePath);
  const metadata = getTrafficAttribution();

  const lastPage = sessionStorage.getItem(LAST_PAGE_VIEW_KEY);
  const lastTs = Number(sessionStorage.getItem(LAST_PAGE_VIEW_TS_KEY) || 0);
  const now = Date.now();
  if (lastPage === normalizedPage && Number.isFinite(lastTs) && now - lastTs < PAGE_VIEW_THROTTLE_MS) {
    return;
  }

  sessionStorage.setItem(LAST_PAGE_VIEW_KEY, normalizedPage);
  sessionStorage.setItem(LAST_PAGE_VIEW_TS_KEY, String(now));

  void postTrafficEvent({
    eventType: "page_view",
    pagePath: normalizedPage,
    metadata,
  });
};

export const trackTrafficClick = (params: {
  action: string;
  pagePath?: string;
  target?: string;
}) => {
  const pagePath = normalizePath(params.pagePath || window.location.pathname);
  const target = params.target ? normalizePath(params.target) : undefined;
  const metadata = getTrafficAttribution();

  void postTrafficEvent({
    eventType: "cta_click",
    pagePath,
    action: params.action.trim().slice(0, 120),
    target,
    metadata,
  });
};
