import type { Totals } from "../types/document";
import { formatCents } from "../utils/format";

interface Props {
  totals: Totals;
}

/**
 * Pure display of document.totals for DocumentEditorPage — no state, no
 * fetching. Deliberately a sibling of LineItemsSection rather than nested
 * inside it: these numbers come from the server's persisted totals field
 * (see backend/src/calc/calc.ts's calcDocumentTotals), not from summing
 * line items client-side, so this component has nothing to do with the
 * lineItems array at all.
 */
export function TotalsSummary({ totals }: Props) {
  return (
    <div className="mt-6 ml-auto w-full max-w-xs rounded-lg border bg-white p-4">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Subtotal</dt>
          <dd>{formatCents(totals.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Discount</dt>
          <dd>−{formatCents(totals.discountCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Tax</dt>
          <dd>{formatCents(totals.taxCents)}</dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatCents(totals.grandTotalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
