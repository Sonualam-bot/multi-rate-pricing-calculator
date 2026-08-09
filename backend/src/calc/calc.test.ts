import { describe, it, expect } from "vitest";
import { calcLine, calcDocumentTotals, InvalidDiscountError } from "./calc";

describe("calcLine", () => {
  it("computes Widget A: qty2 x $100, 10% discount, 5% tax", () => {
    const result = calcLine({
      quantity: 2,
      unitPriceCents: 10000,
      discount: { type: "percent", value: 10 },
      taxPercent: 5,
    });
    expect(result).toEqual({
      subtotalCents: 20000,
      discountCents: 2000,
      taxCents: 900,
      lineTotalCents: 18900,
    });
  });

  it("computes Widget B: qty1 x $50, no discount, 5% tax", () => {
    const result = calcLine({
      quantity: 1,
      unitPriceCents: 5000,
      discount: null,
      taxPercent: 5,
    });
    expect(result).toEqual({
      subtotalCents: 5000,
      discountCents: 0,
      taxCents: 250,
      lineTotalCents: 5250,
    });
  });

  it("computes Service fee: qty1 x $200, $20 fixed discount, no tax", () => {
    const result = calcLine({
      quantity: 1,
      unitPriceCents: 20000,
      discount: { type: "fixed", value: 2000 },
      taxPercent: 0,
    });
    expect(result).toEqual({
      subtotalCents: 20000,
      discountCents: 2000,
      taxCents: 0,
      lineTotalCents: 18000,
    });
  });

  it("throws when fixed discount exceeds subtotal", () => {
    expect(() =>
      calcLine({
        quantity: 1,
        unitPriceCents: 1000,
        discount: { type: "fixed", value: 1500 },
        taxPercent: 0,
      }),
    ).toThrow(InvalidDiscountError);
  });
});

describe("calcDocumentTotals", () => {
  it("sums the sample document to match the PDF totals", () => {
    const widgetA = calcLine({
      quantity: 2,
      unitPriceCents: 10000,
      discount: { type: "percent", value: 10 },
      taxPercent: 5,
    });
    const widgetB = calcLine({
      quantity: 1,
      unitPriceCents: 5000,
      discount: null,
      taxPercent: 5,
    });
    const serviceFee = calcLine({
      quantity: 1,
      unitPriceCents: 20000,
      discount: { type: "fixed", value: 2000 },
      taxPercent: 0,
    });

    const totals = calcDocumentTotals([widgetA, widgetB, serviceFee]);

    expect(totals).toEqual({
      subtotalCents: 45000,
      discountCents: 4000,
      taxCents: 1150,
      grandTotalCents: 42150,
    });
  });
});
