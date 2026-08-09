import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { summary } from "../controllers/report.controller";

/** Same requireAuth guard as document.routes.ts — report is per-user too. */
const router = Router();
router.use(requireAuth);
router.get("/summary", summary);

export default router;
