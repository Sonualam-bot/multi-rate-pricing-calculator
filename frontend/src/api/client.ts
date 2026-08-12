/**
 * A relative path, not an absolute backend URL — every request goes
 * through a same-origin /api/* proxy (vercel.json in production,
 * vite.config.ts's dev server proxy locally) instead of hitting the
 * backend's own domain directly. That's what makes the auth cookie
 * first-party from the browser's point of view: it's set by (and sent
 * back to) whatever origin is serving this page, never a different
 * domain, so browsers that block third-party cookies — Chrome Incognito,
 * Safari, Firefox private mode — never even see this as cross-site.
 */
const API_URL = "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? "Something went wrong", res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
