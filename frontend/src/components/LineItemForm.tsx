import { useState } from "react";
import type { FormEvent } from "react";
import type {
  LineItem,
  LineItemInput,
  DiscountType,
} from "../types/document";
import { ApiError } from "../api/client";

interface Props {
  initial?: LineItem;
  onSubmit: (input: LineItemInput) => Promise<void>;
  onCancel: () => void;
}

type FormDiscountType = "none" | DiscountType;

/**
 * Shared by LineItemsSection (add-new) and LineItemRow (edit-in-place) —
 * one form, two callers, so the dollars<->cents conversion logic below
 * only has to exist once. `initial` is what tells the two apart: undefined
 * means a blank add-mode form, a LineItem means every field gets seeded
 * from that row for editing. The caller decides which write happens by
 * passing onSubmit as either addLineItem or updateLineItem (see
 * hooks/useDocument.ts) — this component doesn't know or care which.
 */
export function LineItemForm({ initial, onSubmit, onCancel }: Props) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState(
    initial ? (initial.unitPriceCents / 100).toFixed(2) : "",
  );
  const [discountType, setDiscountType] = useState<FormDiscountType>(
    initial?.discount?.type ?? "none",
  );
  /**
   * Fixed discounts are cents on the wire, so this is seeded as a dollar
   * string exactly like `unitPrice` above. Percent discounts are already
   * a plain 0-100 number on the wire (validation/document.schema.ts caps
   * it at .max(100)), so that branch needs no conversion at all.
   */
  const [discountValue, setDiscountValue] = useState(() => {
    if (!initial?.discount) return "";
    return initial.discount.type === "fixed"
      ? (initial.discount.value / 100).toFixed(2)
      : String(initial.discount.value);
  });
  const [taxPercent, setTaxPercent] = useState(
    String(initial?.taxPercent ?? 0),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * The reverse of how the fields above were seeded: dollar strings back
   * to integer cents, "none" back to a null discount. This is the only
   * place in the form that does cents math — every input above it works
   * in the dollar-string values the fields actually hold.
   */
  function buildInput(): LineItemInput {
    return {
      description,
      quantity: parseInt(quantity, 10),
      unitPriceCents: Math.round(parseFloat(unitPrice) * 100),
      discount:
        discountType === "none"
          ? null
          : {
              type: discountType,
              value:
                discountType === "fixed"
                  ? Math.round(parseFloat(discountValue) * 100)
                  : parseFloat(discountValue),
            },
      taxPercent: parseFloat(taxPercent) || 0,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(buildInput());
      onCancel();
    } catch (err) {
      /**
       * Covers backend/src/calc/calc.ts's InvalidDiscountError (400, a
       * fixed discount bigger than the line's subtotal) the same way
       * every other ApiError is surfaced here — no special-casing needed,
       * the message already comes through readable.
       */
      setError(
        err instanceof ApiError ? err.message : "Failed to save line item",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 rounded-lg border bg-gray-50 p-4"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <input
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            required
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="unitPrice"
            className="block text-sm font-medium text-gray-700"
          >
            Unit price ($)
          </label>
          <input
            id="unitPrice"
            type="number"
            required
            min={0}
            step={0.01}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="taxPercent"
            className="block text-sm font-medium text-gray-700"
          >
            Tax %
          </label>
          <input
            id="taxPercent"
            type="number"
            required
            min={0}
            max={100}
            step={0.01}
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="discountType"
            className="block text-sm font-medium text-gray-700"
          >
            Discount
          </label>
          <select
            id="discountType"
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value as FormDiscountType)
            }
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="none">None</option>
            <option value="fixed">Fixed ($)</option>
            <option value="percent">Percent (%)</option>
          </select>
        </div>
      </div>

      {discountType !== "none" && (
        <div className="w-1/4">
          <label
            htmlFor="discountValue"
            className="block text-sm font-medium text-gray-700"
          >
            {discountType === "fixed" ? "Discount ($)" : "Discount (%)"}
          </label>
          <input
            id="discountValue"
            type="number"
            required
            min={0}
            max={discountType === "percent" ? 100 : undefined}
            step={0.01}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm text-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
