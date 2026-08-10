import type { DocumentStatus } from "../types/document";

const STYLES: Record<DocumentStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  finalized: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
