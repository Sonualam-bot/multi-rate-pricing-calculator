import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDocument } from "../hooks/useDocument";
import { StatusBadge } from "../components/StatusBadge";
import { TotalsSummary } from "../components/TotalsSummary";
import { formatCents, formatDate } from "../utils/format";

/**
 * Standalone printable view, routed at /documents/:id/print (see App.tsx).
 * Sits directly under ProtectedRoute rather than nested inside Layout, so
 * it renders without the app's nav bar — that's what keeps a printed page
 * to just the document itself instead of the whole app chrome. Read-only
 * by construction rather than by a hidden-when-not-editable prop: there
 * are no edit/delete handlers anywhere on this page at all, since it
 * never has a reason to mutate anything. The "Print / Save as PDF" button
 * and back link both carry `print:hidden` so they vanish from the actual
 * printed/PDF output, leaving only the document content behind.
 */
export function PrintDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { document, loading, error } = useDocument(id!);

  /**
   * Browsers use the page's <title> as both the print-preview header and
   * the default filename when saving as PDF — index.html's is the
   * app-wide "Multi-Rate Pricing Calculator", which would make every
   * saved bill suggest the same filename. Swapping it to this document's
   * own title while the page is open gives each printout a distinct,
   * meaningful name, then restores the original on unmount so navigating
   * back to the app doesn't leave the tab title stuck on an old bill.
   * Reached via `window.document` rather than the bare global, since
   * `document` in this file already refers to useDocument()'s fetched
   * PricingDocument, not the DOM document.
   */
  useEffect(() => {
    if (!document) return;
    const previousTitle = window.document.title;
    window.document.title = `${document.title} — Bill`;
    return () => {
      window.document.title = previousTitle;
    };
  }, [document]);

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading…</p>;
  if (error) return <p className="p-8 text-sm text-red-600">{error}</p>;
  if (!document) return null;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          to={`/documents/${document.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to document
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{document.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{document.customer}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={document.status} />
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(document.issueDate)}
          </p>
        </div>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 font-medium">Qty</th>
            <th className="py-2 font-medium">Unit price</th>
            <th className="py-2 font-medium">Discount</th>
            <th className="py-2 font-medium">Tax %</th>
            <th className="py-2 text-right font-medium">Line total</th>
          </tr>
        </thead>
        <tbody>
          {document.lineItems.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="py-2">{item.description}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2">{formatCents(item.unitPriceCents)}</td>
              <td className="py-2">
                {item.discount === null
                  ? "—"
                  : item.discount.type === "fixed"
                    ? `${formatCents(item.discount.value)} off`
                    : `${item.discount.value}% off`}
              </td>
              <td className="py-2">{item.taxPercent}%</td>
              <td className="py-2 text-right">
                {formatCents(item.lineTotalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <TotalsSummary totals={document.totals} />
    </div>
  );
}
