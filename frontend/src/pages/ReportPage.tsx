import { useState } from "react";
import { useReport } from "../hooks/useReport";
import { StatCard } from "../components/StatCard";
import { formatCents } from "../utils/format";

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Summary report screen, routed at /reports (see App.tsx). The date inputs
 * are bound straight to useReport's from/to args, so changing either one
 * triggers an immediate refetch — no separate "Apply" button needed,
 * because hooks/useReport.ts already guards against a stale response for
 * an old range clobbering a fresher one once the range changes again.
 */
export function ReportPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const { summary, loading, error } = useReport(from, to);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Summary report</h1>
      <p className="mt-1 text-sm text-gray-500">
        Finalized documents only — draft totals can still change, so
        they're excluded from this report.
      </p>

      <div className="mt-6 flex items-end gap-4 rounded-lg border bg-white p-4">
        <div>
          <label
            htmlFor="from"
            className="block text-sm font-medium text-gray-700"
          >
            From
          </label>
          <input
            id="from"
            type="date"
            required
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="to"
            className="block text-sm font-medium text-gray-700"
          >
            To
          </label>
          <input
            id="to"
            type="date"
            required
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded border px-3 py-2"
          />
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading…</p>}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && summary && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <StatCard label="Documents" value={String(summary.documentCount)} />
          <StatCard
            label="Total revenue"
            value={formatCents(summary.totalGrandTotalCents)}
          />
          <StatCard
            label="Total tax"
            value={formatCents(summary.totalTaxCents)}
          />
          <StatCard
            label="Total discount"
            value={formatCents(summary.totalDiscountCents)}
          />
        </div>
      )}
    </div>
  );
}
