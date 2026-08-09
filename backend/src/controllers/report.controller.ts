import { Response } from "express";
import { AuthedRequest } from "../middleware/requireAuth";
import { reportQuerySchema } from "../validation/report.schema";
import { getSummaryReport } from "../services/report.service";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Thin HTTP layer for the report endpoint — the aggregation itself is in
 * services/report.service.ts. Routed from routes/report.routes.ts
 * (mounted at /reports).
 */
export const summary = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { from, to } = reportQuerySchema.parse(req.query);
  const result = await getSummaryReport(req.userId!, from, to);
  res.json(result);
});
