interface Props {
  label: string;
  value: string;
}

/** Small labeled number tile used by ReportPage for each summary figure. */
export function StatCard({ label, value }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
