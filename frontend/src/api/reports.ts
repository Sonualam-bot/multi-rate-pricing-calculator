import { request } from "./client";
import type { ReportSummary } from "../types/report";

export function getSummary(from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return request<ReportSummary>(`/reports/summary?${params.toString()}`);
}
