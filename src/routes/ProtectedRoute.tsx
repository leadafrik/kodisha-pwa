import React, { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredAccessToken, getStoredRefreshToken } from "../utils/authSession";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const location = useLocation();
  if (!token && !refreshToken) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
