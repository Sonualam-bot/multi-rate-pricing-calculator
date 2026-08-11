import { useCallback, useEffect, useState } from "react";
import type { PricingDocument, CreateDocumentInput } from "../types/document";
import * as documentsApi from "../api/documents";
import { ApiError } from "../api/client";

/**
 * Owns the documents-list screen's server state — fetches the list on
 * mount and exposes create/delete so the page never calls api/documents.ts
 * directly. Mirrors backend/src/services/document.service.ts's role: the
 * one layer between the UI and the data-access calls.
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<PricingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Wrapped in useCallback so its identity is stable across renders — the
   * effect below depends on it, and without that stability the effect
   * would re-fire every render instead of just once on mount.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.listDocuments();
      setDocuments(docs);
    } catch (err) {
      /**
       * ApiError-aware, not a bare `instanceof Error` check — a network
       * failure (backend unreachable) throws a raw fetch TypeError, and
       * without this check its message ("Failed to fetch") would leak
       * straight into the UI instead of this readable fallback. The
       * mutators below (createDocument/deleteDocument) already do this;
       * this was the one place still using the looser check.
       */
      setError(
        err instanceof ApiError ? err.message : "Failed to load documents",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount is the documented React pattern (react.dev/learn/you-might-not-need-an-effect#fetching-data); this rule flags it as a false positive.
    refresh();
  }, [refresh]);

  /**
   * Inserts the server's response instead of calling refresh() again —
   * one request instead of two — but re-sorts by issueDate to match
   * services/document.service.ts's listDocuments() (sorted issueDate
   * desc), since a backdated document isn't necessarily the newest by
   * that key even though it was just created. Errors are left to throw
   * so whatever form/button triggered this can catch and display them
   * itself, rather than funneling into the hook's own `error` (that
   * one's for the mount-time fetch, which no specific UI element is
   * watching).
   */
  async function createDocument(input: CreateDocumentInput) {
    const doc = await documentsApi.createDocument(input);
    setDocuments((prev) =>
      [doc, ...prev].sort(
        (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
      ),
    );
    return doc;
  }

  /** Same throw-don't-swallow reasoning as createDocument above. */
  async function deleteDocument(id: string) {
    await documentsApi.deleteDocument(id);
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }

  return {
    documents,
    loading,
    error,
    createDocument,
    deleteDocument,
    refresh,
  };
}
