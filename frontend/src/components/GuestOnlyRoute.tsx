import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Inverse of ProtectedRoute — gates /login and /signup in App.tsx so an
 * already-authenticated visitor who navigates there bounces to
 * /documents instead of seeing the form again.
 */
export function GuestOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/documents" replace />;

  return <Outlet />;
}
