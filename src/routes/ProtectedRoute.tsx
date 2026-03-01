import React, { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getStoredAccessToken, getStoredRefreshToken } from "../utils/authSession";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  if (!token && !refreshToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
