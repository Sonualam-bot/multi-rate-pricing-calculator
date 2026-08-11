import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import * as controller from "../controllers/document.controller";

/**
 * Every route below requires a valid session — see middleware/requireAuth.ts
 * for what that guards, and controllers/document.controller.ts for the
 * actual handlers.
 */
const router = Router();
router.use(requireAuth);

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.patch("/:id", controller.updateMeta);
router.delete("/:id", controller.remove);

router.post("/:id/line-items", controller.addLineItem);
router.patch("/:id/line-items/:lineItemId", controller.updateLineItem);
router.delete("/:id/line-items/:lineItemId", controller.removeLineItem);
router.post("/:id/finalize", controller.finalize);
router.post("/:id/duplicate", controller.duplicate);

export default router;
