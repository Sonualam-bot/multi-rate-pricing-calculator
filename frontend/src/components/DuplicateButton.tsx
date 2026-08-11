import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as documentsApi from "../api/documents";
import { ApiError } from "../api/client";

interface Props {
  documentId: string;
}

/**
 * Structurally different from FinalizeButton: that one mutates the
 * current document and reports the result back through useDocument's
 * state, but duplicating creates an entirely different document with its
 * own id, so there's no "current document state" to update — this owns
 * its API call and navigation directly instead of taking an onX callback
 * prop from the page. Works regardless of draft/finalized status, so it's
 * always rendered, unlike FinalizeButton which only shows up on drafts.
 */
export function DuplicateButton({ documentId }: Props) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Resets `submitting` in a `finally`, not just the catch branch: /documents/:id
   * and /documents/:newId are the same route (App.tsx), just a different
   * `:id` param, so navigating there re-renders this component in place
   * instead of unmounting it — without the `finally`, a successful
   * duplicate would leave the button stuck on "Duplicating…" forever,
   * since nothing else was resetting the flag back to false.
   */
  async function handleDuplicate() {
    setSubmitting(true);
    setError(null);
    try {
      const copy = await documentsApi.duplicateDocument(documentId);
      navigate(`/documents/${copy.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to duplicate");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleDuplicate}
        disabled={submitting}
        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      >
        {submitting ? "Duplicating…" : "Duplicate"}
      </button>
    </div>
  );
}
