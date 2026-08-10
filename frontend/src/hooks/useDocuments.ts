import { useCallback, useEffect, useState } from "react";
import type { PricingDocument, CreateDocumentInput } from "../types/document";
import * as documentsApi from "../api/documents";

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
      setError(
        err instanceof Error ? err.message : "Failed to load documents",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Prepends the server's response instead of calling refresh() again —
   * one request instead of two. Errors are left to throw so whatever
   * form/button triggered this can catch and display them itself, rather
   * than funneling into the hook's own `error` (that one's for the
   * mount-time fetch, which no specific UI element is watching).
   */
  async function createDocument(input: CreateDocumentInput) {
    const doc = await documentsApi.createDocument(input);
    setDocuments((prev) => [doc, ...prev]);
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
