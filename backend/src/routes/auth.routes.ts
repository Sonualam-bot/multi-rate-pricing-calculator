import { Router } from "express";
import { signup, login, logout } from "../controllers/auth.controller";

/**
 * Wiring only — no requireAuth here, these are the endpoints that create
 * the session in the first place. See controllers/auth.controller.ts.
 */
const router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
