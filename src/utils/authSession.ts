const ACCESS_TOKEN_KEY = "kodisha_token";
const ADMIN_TOKEN_KEY = "kodisha_admin_token";
const LEGACY_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "kodisha_refresh_token";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "kodisha_token_expires_at";

type SessionPayload = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  isAdmin?: boolean;
};

const hasWindow = () => typeof window !== "undefined";

export const getStoredAccessToken = (): string | null => {
  if (!hasWindow()) return null;
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY)
  );
};

export const getStoredRefreshToken = (): string | null => {
  if (!hasWindow()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredAccessTokenExpiry = (): number | null => {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isAccessTokenExpiringSoon = (bufferMs = 60_000): boolean => {
  const expiry = getStoredAccessTokenExpiry();
  if (!expiry) return false;
  return Date.now() >= expiry - bufferMs;
};

export const storeAuthSession = ({
  token,
  accessToken,
  refreshToken,
  expiresIn,
  isAdmin = false,
}: SessionPayload): void => {
  if (!hasWindow()) return;

  const resolvedAccessToken = accessToken || token;
  if (resolvedAccessToken) {
    if (isAdmin) {
      localStorage.setItem(ADMIN_TOKEN_KEY, resolvedAccessToken);
    } else {
      localStorage.setItem(ACCESS_TOKEN_KEY, resolvedAccessToken);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  if (refreshToken && !isAdmin) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    localStorage.setItem(
      ACCESS_TOKEN_EXPIRES_AT_KEY,
      String(Date.now() + expiresIn * 1000)
    );
  }
};

export const clearAuthSession = (): void => {
  if (!hasWindow()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem("kodisha_user");
};
