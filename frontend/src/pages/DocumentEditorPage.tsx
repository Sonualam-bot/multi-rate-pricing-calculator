import { Link, useParams } from "react-router-dom";
import { useDocument } from "../hooks/useDocument";
import { DocumentMetaSection } from "../components/DocumentMetaSection";

/**
 * Editor screen for one document, routed at /documents/:id (see App.tsx).
 * Owns nothing beyond the fetch (via hooks/useDocument.ts) and the derived
 * `editable` flag — every actual section (meta, line items, finalize) is
 * its own component so each one's local form/UI state stays scoped to just
 * that piece, the same split DocumentsListPage uses for NewDocumentForm/
 * DocumentRow. Line items + finalize are a follow-up pass; this page
 * currently only wires up the meta section.
 *
 * The `!loading && !error && document` guard below exists purely for
 * TypeScript: useDocument's `document` is typed `PricingDocument | null`,
 * even though in practice it's only ever null while `loading` is true or
 * `error` is set — both already handled above it. TS can't see that
 * relationship, so the guard is what narrows `document` to non-null before
 * `document.status` is read.
 */
export function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { document, loading, error, updateMeta } = useDocument(id!);

  return (
    <div>
      <Link to="/documents" className="text-sm text-blue-600 hover:underline">
        ← Back to documents
      </Link>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && document && (
        <DocumentMetaSection
          document={document}
          editable={document.status === "draft"}
          onSave={updateMeta}
        />
      )}
    </div>
  );
}
