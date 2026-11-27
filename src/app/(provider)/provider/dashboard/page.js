import { SummaryCard } from "@/components/dashboard/summary-card.js";
import { getProviderDashboardData } from "@/lib/ui/dashboard-data.js";
import { requireProviderSession } from "@/lib/ui/session-guard.js";

const STATUS_LABELS = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

function verificationLabel(verification) {
  if (verification.isExpired) return "Expired";
  return verification.status.charAt(0).toUpperCase() + verification.status.slice(1);
}

export default async function ProviderDashboardPage() {
  const { user } = await requireProviderSession();
  const data = await getProviderDashboardData(user);

  if (!data.hasProfile) {
    return (
      <section className="grid gap-8">
        <header className="grid gap-2">
          <p className="text-sm font-medium text-brand">Provider workspace</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Opportunities</h1>
          <p className="max-w-2xl text-ink-muted">
            Verification, service areas, and relevant tasks will appear here.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Application" value="Not started" note="Use the provider form" />
          <SummaryCard label="Verification" value="Pending" note="Starts after application" />
          <SummaryCard label="Tasks" value="Soon" note="Matching arrives in M5" />
        </div>
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Get started</h2>
          <p className="mt-3 text-sm text-ink-muted">
            The provider application form is added in M3.8b. It will submit through the existing
            provider application endpoint.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className="grid gap-8">
      <header className="grid gap-2">
        <p className="text-sm font-medium text-brand">Provider workspace</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          {data.profile.displayName ?? "Your opportunities"}
        </h1>
        <p className="max-w-2xl text-ink-muted">
          Verification, service areas, and relevant tasks will appear here.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Application"
          value={STATUS_LABELS[data.profile.status] ?? data.profile.status}
        />
        <SummaryCard
          label="Availability"
          value={data.isAvailable ? "On" : "Off"}
          note={`${data.weeklySlots.length} weekly slots`}
        />
        <SummaryCard label="Service areas" value={data.serviceAreaCount} />
        <SummaryCard
          label="Expired qualifications"
          value={data.expiredVerificationCount}
          note="Expired records restrict availability"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Verifications</h2>
          {data.verifications.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No verification records yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 text-sm">
              {data.verifications.map((verification) => (
                <li
                  key={verification.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0"
                >
                  <span className="font-medium">{verification.requirement.name}</span>
                  <span
                    className={
                      verification.isExpired
                        ? "rounded-full border border-danger px-2 py-1 text-xs text-danger"
                        : "rounded-full border border-border px-2 py-1 text-xs text-ink-muted"
                    }
                  >
                    {verificationLabel(verification)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Service areas</h2>
          {data.serviceAreas.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No service areas added yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 text-sm">
              {data.serviceAreas.map((area) => (
                <li key={area.id} className="border-b border-border pb-2 last:border-b-0">
                  <span className="font-medium">{area.label}</span>
                  {area.isPrimary ? (
                    <span className="ml-2 text-xs text-brand">Primary</span>
                  ) : null}
                  <span className="block text-ink-muted">
                    {area.radiusMeters} m radius
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Relevant tasks</h2>
        <p className="mt-3 text-sm text-ink-muted">
          Task matching and offers are introduced in M5. Availability and qualifications are
          already enforced by the backend.
        </p>
      </section>
    </section>
  );
}
