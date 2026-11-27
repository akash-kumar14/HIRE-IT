import { SummaryCard } from "@/components/dashboard/summary-card.js";
import { getCustomerDashboardData } from "@/lib/ui/dashboard-data.js";
import { requireCustomerSession } from "@/lib/ui/session-guard.js";

export default async function CustomerDashboardPage() {
  const { user } = await requireCustomerSession();
  const { account, categories, categoryCount } = await getCustomerDashboardData(user);

  return (
    <section className="grid gap-8">
      <header className="grid gap-2">
        <p className="text-sm font-medium text-brand">Customer workspace</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Your tasks</h1>
        <p className="max-w-2xl text-ink-muted">
          Task creation, AI-assisted drafts, and provider offers will appear here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Account"
          value={account.fullName}
          note={account.emailVerifiedAt ? "Email verified" : "Email verification pending"}
        />
        <SummaryCard label="Service categories" value={categoryCount} note="Currently active" />
        <SummaryCard label="Tasks" value="Soon" note="AI-assisted drafts arrive in M4" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Account details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Email</dt>
              <dd className="font-medium">{account.email}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Status</dt>
              <dd className="font-medium">
                {account.emailVerifiedAt ? "Verified" : "Verification pending"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Popular categories</h2>
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
        <h2 className="text-xl font-semibold">Offers and bookings</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Matching, offers, and booking history are introduced in M5 and M6. This area is
          intentionally a placeholder until those modules exist.
        </p>
      </section>
    </section>
  );
}
