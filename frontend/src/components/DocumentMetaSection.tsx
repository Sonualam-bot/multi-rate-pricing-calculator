import { useState } from "react";
import type { FormEvent } from "react";
import type {
  PricingDocument,
  UpdateDocumentMetaInput,
} from "../types/document";
import { ApiError } from "../api/client";
import { formatDate } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface Props {
  document: PricingDocument;
  editable: boolean;
  onSave: (updates: UpdateDocumentMetaInput) => Promise<void>;
}

/**
 * Title/customer/issueDate block for DocumentEditorPage. Two modes: a
 * read-only view (always shown) and an edit form (only reachable when
 * `editable` is true, i.e. document.status === "draft" — the page computes
 * that flag once from document.status and passes it down, rather than this
 * component re-deriving it). Same show/hide-form pattern DocumentsListPage
 * uses for NewDocumentForm.
 */
export function DocumentMetaSection({ document, editable, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [customer, setCustomer] = useState(document.customer);
  const [issueDate, setIssueDate] = useState(document.issueDate.slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Re-seeds the three input fields from the current `document` prop before
   * switching into edit mode. Without this, opening the form a second time
   * (e.g. after already saving once) would show whatever was left over in
   * state from the previous edit instead of the document's current values.
   */
  function startEditing() {
    setTitle(document.title);
    setCustomer(document.customer);
    setIssueDate(document.issueDate.slice(0, 10));
    setError(null);
    setEditing(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSave({ title, customer, issueDate });
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{document.title}</h1>
              <StatusBadge status={document.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {document.customer} · {formatDate(document.issueDate)}
            </p>
          </div>
          {editable && (
            <button
              onClick={startEditing}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-3 rounded-lg border bg-white p-4"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="customer"
            className="block text-sm font-medium text-gray-700"
          >
            Customer
          </label>
          <input
            id="customer"
            required
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="issueDate"
            className="block text-sm font-medium text-gray-700"
          >
            Issue date
          </label>
          <input
            id="issueDate"
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
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
