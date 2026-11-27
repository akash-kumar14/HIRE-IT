export function SummaryCard({ label, value, note }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {note ? <p className="mt-2 text-sm text-ink-muted">{note}</p> : null}
    </section>
  );
}
