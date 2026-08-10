import { useState } from "react";
import { useDocuments } from "../hooks/useDocuments";
import { NewDocumentForm } from "../components/NewDocumentForm";
import { DocumentRow } from "../components/DocumentRow";

export function DocumentsListPage() {
  const { documents, loading, error, createDocument, deleteDocument } =
    useDocuments();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          {showForm ? "Cancel" : "New Document"}
        </button>
      </div>

      {showForm && (
        <NewDocumentForm
          createDocument={createDocument}
          onCancel={() => setShowForm(false)}
        />
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Customer</th>
              <th className="py-2 font-medium">Issue date</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <DocumentRow key={doc.id} document={doc} onDelete={deleteDocument} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
