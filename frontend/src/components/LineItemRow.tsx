import { useState } from "react";
import type { LineItem, LineItemInput } from "../types/document";
import { LineItemForm } from "./LineItemForm";
import { formatCents } from "../utils/format";
import { ApiError } from "../api/client";

interface Props {
  lineItem: LineItem;
  editable: boolean;
  onUpdate: (input: LineItemInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

/**
 * One row in LineItemsSection's table. Mirrors DocumentRow's shape: its
 * own local editing/deleting/error state scoped to just this row, so
 * acting on one line item never blocks or hides errors for the others in
 * the table.
 */
export function LineItemRow({
  lineItem,
  editable,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${lineItem.description}"?`)) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  /**
   * colSpan matches LineItemsSection's header column count, which itself
   * varies with `editable` (the actions column only exists when true) —
   * has to stay in sync with that header or the edit-mode row would either
   * overflow or leave a gap.
   */
  if (editing) {
    return (
      <tr>
        <td colSpan={editable ? 10 : 9}>
          <LineItemForm
            initial={lineItem}
            onSubmit={onUpdate}
            onCancel={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-3">{lineItem.description}</td>
      <td className="py-3">{lineItem.quantity}</td>
      <td className="py-3">{formatCents(lineItem.unitPriceCents)}</td>
      <td className="py-3">
        {lineItem.discount === null
          ? "—"
          : lineItem.discount.type === "fixed"
            ? `${formatCents(lineItem.discount.value)} off`
            : `${lineItem.discount.value}% off`}
      </td>
      <td className="py-3">{lineItem.taxPercent}%</td>
      <td className="py-3">{formatCents(lineItem.subtotalCents)}</td>
      <td className="py-3">{formatCents(lineItem.discountCents)}</td>
      <td className="py-3">{formatCents(lineItem.taxCents)}</td>
      <td className="py-3 font-medium">
        {formatCents(lineItem.lineTotalCents)}
      </td>
      {editable && (
        <td className="py-3 text-right whitespace-nowrap">
          <button
            onClick={() => setEditing(true)}
            className="mr-3 text-sm text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </td>
      )}
    </tr>
  );
}
