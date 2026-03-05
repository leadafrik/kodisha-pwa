import { API_BASE_URL } from "../config/api";

type TrafficEventType = "page_view" | "cta_click";

const VISITOR_ID_KEY = "agrisoko_visitor_id";
const LAST_PAGE_VIEW_KEY = "agrisoko_last_page_view";
const LAST_PAGE_VIEW_TS_KEY = "agrisoko_last_page_view_ts";

const PAGE_VIEW_THROTTLE_MS = 2000;

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

const postTrafficEvent = async (payload: {
  eventType: TrafficEventType;
  pagePath: string;
  action?: string;
  target?: string;
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
  });
};

export const trackTrafficClick = (params: {
  action: string;
  pagePath?: string;
  target?: string;
}) => {
  const pagePath = normalizePath(params.pagePath || window.location.pathname);
  const target = params.target ? normalizePath(params.target) : undefined;

  void postTrafficEvent({
    eventType: "cta_click",
    pagePath,
    action: params.action.trim().slice(0, 120),
    target,
  });
};
