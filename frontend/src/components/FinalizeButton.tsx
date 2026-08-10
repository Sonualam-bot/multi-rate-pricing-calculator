import { useState } from "react";
import { ApiError } from "../api/client";

interface Props {
  lineItemCount: number;
  onFinalize: () => Promise<void>;
}

/**
 * One-way action for DocumentEditorPage — finalizeDocument() on the backend
 * has no matching "un-finalize" endpoint, so this always confirms before
 * calling onFinalize, the same guard DocumentRow uses before a delete.
 * Disabled at zero line items because services/document.service.ts's
 * finalizeDocument() throws EmptyDocumentError in that case; disabling here
 * just saves the user a round trip for an outcome the backend already
 * rejects.
 */
export function FinalizeButton({ lineItemCount, onFinalize }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinalize() {
    if (!confirm("Finalize this document? It can no longer be edited after this."))
      return;

    setSubmitting(true);
    setError(null);
    try {
      await onFinalize();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to finalize");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col items-end gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleFinalize}
        disabled={submitting || lineItemCount === 0}
        title={
          lineItemCount === 0
            ? "Add at least one line item before finalizing"
            : undefined
        }
        className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {submitting ? "Finalizing…" : "Finalize document"}
      </button>
    </div>
  );
}
