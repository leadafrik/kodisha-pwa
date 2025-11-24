import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }: any) {
  const adminToken = localStorage.getItem("kodisha_admin_token");
  const userToken = localStorage.getItem("kodisha_token");
  const token = adminToken || userToken;

  if (!token) {
    return <Navigate to="/admin-login?next=/admin" replace />;
  }

  return children;
}
