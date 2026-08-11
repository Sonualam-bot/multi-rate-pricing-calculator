/**
 * Shown by ProtectedRoute when AuthContext's initial /auth/me call never
 * reached the backend at all — distinct from a real 401 (which redirects
 * to /login instead). Conflating the two would tell an already-logged-in
 * user their session expired when the actual problem is the backend being
 * unreachable, which is exactly what used to happen before this existed.
 */
export function ConnectionError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
      <p className="text-lg font-semibold text-gray-800">
        Can&apos;t reach the server
      </p>
      <p className="max-w-sm text-sm text-gray-500">
        The app couldn&apos;t connect to the backend. Check that it&apos;s
        running, then try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-1 rounded bg-blue-600 px-4 py-2 text-sm text-white"
      >
        Retry
      </button>
    </div>
  );
}
