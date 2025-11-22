import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: any) {
  const token = localStorage.getItem("kodisha_admin_token");

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}
