import Link from "next/link";

export function ProviderOnboardingCard() {
  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-brand">Provider onboarding</p>
        <h2 className="text-xl font-semibold">Offer your services</h2>
        <p className="text-sm text-ink-muted">
          Apply with the name customers will see. Admin review is required before
          your profile can accept work.
        </p>
      </div>
      <Link
        href="/provider/apply"
        className="mt-5 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-surface"
      >
        Become a provider
      </Link>
    </section>
  );
}
