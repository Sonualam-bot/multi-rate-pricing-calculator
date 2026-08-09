import mongoose from "mongoose";
import { PricingDocument } from "../models/Document.model";

/**
 * Summary aggregation for controllers/report.controller.ts. Finalized docs
 * only — see README for why (draft totals can still change, finalized
 * ones can't). Sums the `totals` field models/Document.model.ts already
 * has persisted; nothing here recomputes a single line item.
 */
export async function getSummaryReport(userId: string, from: Date, to: Date) {
  /**
   * Push `to` to end-of-day so a date-only "to" filter (midnight UTC)
   * still includes documents issued later that same day.
   */
  const toEndOfDay = new Date(to);
  toEndOfDay.setUTCHours(23, 59, 59, 999);

  const [result] = await PricingDocument.aggregate([
    {
      $match: {
        /**
         * aggregate() skips Mongoose's usual query casting — find()/findOne()
         * convert a string owner to ObjectId automatically, this doesn't.
         * Without the explicit cast this silently matches zero documents.
         */
        owner: new mongoose.Types.ObjectId(userId),
        status: "finalized",
        issueDate: { $gte: from, $lte: toEndOfDay },
      },
    },
    {
      $group: {
        _id: null,
        documentCount: { $sum: 1 },
        totalGrandTotalCents: { $sum: "$totals.grandTotalCents" },
        totalTaxCents: { $sum: "$totals.taxCents" },
        totalDiscountCents: { $sum: "$totals.discountCents" },
      },
    },
  ]);

  return {
    documentCount: result?.documentCount ?? 0,
    totalGrandTotalCents: result?.totalGrandTotalCents ?? 0,
    totalTaxCents: result?.totalTaxCents ?? 0,
    totalDiscountCents: result?.totalDiscountCents ?? 0,
  };
}
