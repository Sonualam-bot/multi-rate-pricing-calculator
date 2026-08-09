/**
 * Pure money math, nothing else — no Express, no Mongoose, no async.
 * Every cent that ends up on a document passes through calcLine() first.
 * Called from services/document.service.ts (buildLineItem/recalcTotals),
 * and the shapes here are what models/Document.model.ts's line-item schema
 * is built to store — same field names on purpose, no reshaping needed.
 */

export type Discount = { type: "fixed" | "percent"; value: number } | null;

export type LineItemInput = {
  quantity: number;
  unitPriceCents: number;
  discount: Discount;
  taxPercent: number;
};

export type LineResult = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  lineTotalCents: number;
};

/** Fixed discount bigger than the line subtotal — reject, don't clamp. Turned into a 400 by middleware/errorHandler.ts. */
export class InvalidDiscountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDiscountError";
  }
}

function roundCents(value: number): number {
  return Math.round(value);
}

/** subtotal -> discount -> tax -> lineTotal, in that order, for one line item. Rounding (round-half-up) happens after discount and after tax, never before. */
export function calcLine(input: LineItemInput): LineResult {
  const { quantity, unitPriceCents, discount, taxPercent } = input;

  const subtotalCents = quantity * unitPriceCents;

  let discountCents = 0;
  if (discount) {
    discountCents =
      discount.type === "fixed"
        ? discount.value
        : roundCents((subtotalCents * discount.value) / 100);

    if (discountCents > subtotalCents) {
      throw new InvalidDiscountError(
        `Discount (${discountCents} cents) cannot exceed line subtotal (${subtotalCents} cents)`,
      );
    }
  }

  const afterDiscountCents = subtotalCents - discountCents;
  const taxCents = roundCents((afterDiscountCents * taxPercent) / 100);
  const lineTotalCents = afterDiscountCents + taxCents;

  return { subtotalCents, discountCents, taxCents, lineTotalCents };
}

/** Sums already-computed line results — never recalculates a line, just adds up what calcLine() already produced. */
export function calcDocumentTotals(lines: LineResult[]) {
  return lines.reduce(
    (totals, line) => ({
      subtotalCents: totals.subtotalCents + line.subtotalCents,
      discountCents: totals.discountCents + line.discountCents,
      taxCents: totals.taxCents + line.taxCents,
      grandTotalCents: totals.grandTotalCents + line.lineTotalCents,
    }),
    { subtotalCents: 0, discountCents: 0, taxCents: 0, grandTotalCents: 0 },
  );
}
