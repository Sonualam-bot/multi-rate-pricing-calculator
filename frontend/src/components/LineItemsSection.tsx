import { useState } from "react";
import type { LineItem, LineItemInput } from "../types/document";
import { LineItemRow } from "./LineItemRow";
import { LineItemForm } from "./LineItemForm";

interface Props {
  lineItems: LineItem[];
  editable: boolean;
  onAdd: (input: LineItemInput) => Promise<void>;
  onUpdate: (lineItemId: string, input: LineItemInput) => Promise<void>;
  onDelete: (lineItemId: string) => Promise<void>;
}

/**
 * Line items table for DocumentEditorPage, plus the add-new-item form.
 * Doesn't touch document.totals — that's TotalsSummary's job, rendered as
 * a sibling in DocumentEditorPage rather than nested here, since totals
 * are computed server-side from all line items (calc/calc.ts), not
 * derived from this component's own lineItems prop.
 */
export function LineItemsSection({
  lineItems,
  editable,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="mt-6 rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Line items</h2>
        {editable && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            {showAddForm ? "Cancel" : "Add line item"}
          </button>
        )}
      </div>

      {showAddForm && (
        <LineItemForm
          onSubmit={onAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {lineItems.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No line items yet.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium">Unit price</th>
              <th className="py-2 font-medium">Discount</th>
              <th className="py-2 font-medium">Tax %</th>
              <th className="py-2 font-medium">Subtotal</th>
              <th className="py-2 font-medium">Discount</th>
              <th className="py-2 font-medium">Tax</th>
              <th className="py-2 font-medium">Total</th>
              {editable && <th className="py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <LineItemRow
                key={item.id}
                lineItem={item}
                editable={editable}
                onUpdate={(input) => onUpdate(item.id, input)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
