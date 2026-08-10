import { useState } from "react";
import { Link } from "react-router-dom";
import type { PricingDocument } from "../types/document";
import { StatusBadge } from "./StatusBadge";
import { formatCents, formatDate } from "../utils/format";
import { ApiError } from "../api/client";

interface Props {
  document: PricingDocument;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentRow({ document, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${document.title}"? This can't be undone.`)) return;

    setDeleting(true);
    setError(null);
    try {
      await onDelete(document.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-3">
        <Link to={`/documents/${document.id}`} className="text-blue-600 hover:underline">
          {document.title}
        </Link>
      </td>
      <td className="py-3">{document.customer}</td>
      <td className="py-3">{formatDate(document.issueDate)}</td>
      <td className="py-3">
        <StatusBadge status={document.status} />
      </td>
      <td className="py-3">{formatCents(document.totals.grandTotalCents)}</td>
      <td className="py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-600 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
