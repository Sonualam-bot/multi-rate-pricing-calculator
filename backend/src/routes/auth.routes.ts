import { Router } from "express";
import { signup, login, logout, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

/**
 * Wiring only. signup/login/logout skip requireAuth — they're what create
 * the session in the first place. /me needs it, since it reads one. See
 * controllers/auth.controller.ts.
 */
const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
