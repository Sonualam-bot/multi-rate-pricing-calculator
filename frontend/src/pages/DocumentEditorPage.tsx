import { Link, useParams } from "react-router-dom";
import { useDocument } from "../hooks/useDocument";
import { DocumentMetaSection } from "../components/DocumentMetaSection";
import { LineItemsSection } from "../components/LineItemsSection";
import { TotalsSummary } from "../components/TotalsSummary";
import { FinalizeButton } from "../components/FinalizeButton";

/**
 * Editor screen for one document, routed at /documents/:id (see App.tsx).
 * Owns nothing beyond the fetch (via hooks/useDocument.ts) and the derived
 * `editable` flag — every actual section (meta, line items, totals,
 * finalize) is its own component so each one's local form/UI state stays
 * scoped to just that piece, the same split DocumentsListPage uses for
 * NewDocumentForm/DocumentRow.
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
  const {
    document,
    loading,
    error,
    updateMeta,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    finalize,
  } = useDocument(id!);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to documents
        </Link>
        {document && (
          <Link
            to={`/documents/${document.id}/print`}
            className="text-sm text-blue-600 hover:underline"
          >
            Print / Save as PDF
          </Link>
        )}
      </div>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && document && (
        <>
          <DocumentMetaSection
            document={document}
            editable={document.status === "draft"}
            onSave={updateMeta}
          />
          <LineItemsSection
            lineItems={document.lineItems}
            editable={document.status === "draft"}
            onAdd={addLineItem}
            onUpdate={updateLineItem}
            onDelete={deleteLineItem}
          />
          <TotalsSummary totals={document.totals} />
          {document.status === "draft" && (
            <FinalizeButton
              lineItemCount={document.lineItems.length}
              onFinalize={finalize}
            />
          )}
        </>
      )}
    </div>
  );
}
