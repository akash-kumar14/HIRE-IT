import { SummaryCard } from "@/components/dashboard/summary-card.js";
import { getAdminDashboardData } from "@/lib/ui/dashboard-data.js";

export default async function AdminOverviewPage() {
  const { pendingApplications, pendingCount, categories, categoryCount } =
    await getAdminDashboardData();

  return (
    <section className="grid gap-8">
      <header className="grid gap-2">
        <p className="text-sm font-medium text-brand">Admin workspace</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Operations overview</h1>
        <p className="max-w-2xl text-ink-muted">
          Provider reviews, disputes, and reconciliation will appear here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Pending reviews"
          value={pendingCount}
          note="Provider applications awaiting decision"
        />
        <SummaryCard label="Active categories" value={categoryCount} />
        <SummaryCard label="Tasks" value="Soon" note="AI-assisted drafts arrive in M4" />
        <SummaryCard label="Disputes" value="Soon" note="Introduced in M7" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Pending provider reviews</h2>
          {pendingApplications.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No applications are pending.</p>
          ) : (
            <ul className="mt-4 grid gap-3 text-sm">
              {pendingApplications.map((application) => (
                <li key={application.id} className="border-b border-border pb-2 last:border-b-0">
                  <span className="font-medium">
                    {application.displayName ?? application.applicant.fullName}
                  </span>
                  <span className="block text-ink-muted">{application.applicant.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Active categories</h2>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No active categories yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 text-sm">
              {categories.map((category) => (
                <li key={category.id} className="border-b border-border pb-2 last:border-b-0">
                  <span className="font-medium">{category.name}</span>
                  {category.description ? (
                    <span className="block text-ink-muted">{category.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Management forms</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Category, skill, and verification requirement forms are added in M3.8c. They will use
          the existing admin endpoints.
        </p>
      </section>
    </section>
  );
}
