import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Layout route with no path of its own — gates every route nested under
 * it in App.tsx. Waits out AuthContext's `loading` before deciding, so a
 * genuinely logged-in visitor never flashes through /login on reload.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
