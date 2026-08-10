import { useCallback, useEffect, useState } from "react";
import type {
  PricingDocument,
  UpdateDocumentMetaInput,
  LineItemInput,
} from "../types/document";
import * as documentsApi from "../api/documents";

/**
 * Owns one document's server state for the editor screen — fetch on
 * mount/id-change, plus a mutator per api/documents.ts write endpoint.
 * Every mutator just replaces state with the server's response instead of
 * recomputing anything locally: backend/src/services/document.service.ts
 * is the only place totals get calculated, so the UI only ever displays
 * what the server already computed, never its own copy of that math.
 */
export function useDocument(id: string) {
  const [document, setDocument] = useState<PricingDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Depends on `id`, not just mount — refresh() gets a new identity when
   * id changes, which the effect below picks up, so navigating from one
   * document's editor straight to another's re-fetches instead of
   * showing stale data under the new URL.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doc = await documentsApi.getDocument(id);
      setDocument(doc);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load document",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/id-change is the documented React pattern (react.dev/learn/you-might-not-need-an-effect#fetching-data); this rule flags it as a false positive.
    refresh();
  }, [refresh]);

  /** See validation/document.schema.ts's updateDocumentMetaSchema for what's editable. */
  async function updateMeta(updates: UpdateDocumentMetaInput) {
    setDocument(await documentsApi.updateDocumentMeta(id, updates));
  }

  /** Backend rejects this with DocumentNotEditableError once finalized — see assertEditable() in document.service.ts. */
  async function addLineItem(input: LineItemInput) {
    setDocument(await documentsApi.addLineItem(id, input));
  }

  async function updateLineItem(lineItemId: string, input: LineItemInput) {
    setDocument(await documentsApi.updateLineItem(id, lineItemId, input));
  }

  async function deleteLineItem(lineItemId: string) {
    setDocument(await documentsApi.deleteLineItem(id, lineItemId));
  }

  /** One-way: finalizeDocument() on the backend has no matching "un-finalize". */
  async function finalize() {
    setDocument(await documentsApi.finalizeDocument(id));
  }

  return {
    document,
    loading,
    error,
    refresh,
    updateMeta,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    finalize,
  };
}
