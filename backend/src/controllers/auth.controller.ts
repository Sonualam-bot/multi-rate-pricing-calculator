import { Response } from "express";
import { signupSchema, loginSchema } from "../validation/auth.schema";
import {
  createUser,
  verifyCredentials,
  generateToken,
  getUserById,
  createGuestUser,
} from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../middleware/requireAuth";

/**
 * Thin HTTP layer for auth — parse/validate, call services/auth.service.ts,
 * shape the response. Routed from routes/auth.routes.ts (mounted at /auth).
 */

const COOKIE_NAME = "token";

/**
 * httpOnly/secure/sameSite live here so setAuthCookie and logout's
 * clearCookie both use the exact same values — Express's res.clearCookie()
 * only actually removes a cookie if its options match what res.cookie()
 * set (everything except expires/maxAge); a mismatch here is what let a
 * "logged out" session keep working, since the stale JWT was still sitting
 * in a cookie that was never really cleared.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
    | "none"
    | "lax",
};

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const signup = asyncHandler(async (req, res) => {
  const { email, password } = signupSchema.parse(req.body);
  const user = await createUser(email, password);
  setAuthCookie(res, generateToken(user.id));
  res.status(201).json({ id: user.id, email: user.email });
});

/** No request body — see services/auth.service.ts's createGuestUser() for what it creates. Otherwise identical to signup: issue a cookie, respond with the new user. */
export const guest = asyncHandler(async (_req, res) => {
  const user = await createGuestUser();
  setAuthCookie(res, generateToken(user.id));
  res.status(201).json({ id: user.id, email: user.email });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await verifyCredentials(email, password);
  setAuthCookie(res, generateToken(user.id));
  res.json({ id: user.id, email: user.email });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  res.status(204).send();
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await getUserById(req.userId!);
  res.json({ id: user.id, email: user.email });
});
