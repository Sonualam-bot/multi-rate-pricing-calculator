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

export class InvalidDiscountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDiscountError";
  }
}

function roundCents(value: number): number {
  return Math.round(value);
}

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
