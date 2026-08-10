/**
 * Money is integer cents everywhere in this app, end to end — see
 * backend/src/calc/calc.ts. Division by 100 only ever happens here, at
 * the point of display, never anywhere calculations happen.
 */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
