import { useEffect, useState } from "react";
import type { ReportSummary } from "../types/report";
import * as reportsApi from "../api/reports";

/**
 * Read-only — no mutators, unlike useDocuments/useDocument, because the
 * report page never writes anything. Refetches from
 * backend/src/services/report.service.ts's aggregation whenever the
 * from/to range changes.
 */
export function useReport(from: string, to: string) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Guards against a stale response overwriting a fresher one: if `from`/
     * `to` change again before this request resolves, the cleanup below
     * flips `cancelled` and this effect's own .then/.catch/.finally become
     * no-ops, so only the latest range's request can ever update state.
     */
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error on range-change is the documented React fetch-in-effect pattern; this rule flags it as a false positive.
    setLoading(true);
    setError(null);

    reportsApi
      .getSummary(from, to)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load report",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return { summary, loading, error };
}
