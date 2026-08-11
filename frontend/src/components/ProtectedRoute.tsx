import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConnectionError } from "./ConnectionError";

/**
 * Layout route with no path of its own — gates every route nested under
 * it in App.tsx. Waits out AuthContext's `loading` before deciding, so a
 * genuinely logged-in visitor never flashes through /login on reload.
 * Checks `connectionError` before `user`: if /auth/me never reached the
 * backend, that's "server's down," not "please log in" — falling through
 * to the `!user` check below would redirect to /login in that case too,
 * which is misleading for someone who was already logged in.
 */
export function ProtectedRoute() {
  const { user, loading, connectionError } = useAuth();

  if (loading) return null;
  if (connectionError) return <ConnectionError />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
