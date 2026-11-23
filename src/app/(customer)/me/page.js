import Link from "next/link";
import { requireCustomerSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireCustomerSession();
  const verification = user.emailVerifiedAt ? "Verified" : "Not verified";

  return (
    <section className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-brand">Account</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Your profile</h1>
        <p className="text-ink-muted">Details stored with your HIRE-IT account.</p>
      </div>
      <dl className="grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Full name</dt>
          <dd className="mt-1 font-medium">{user.fullName}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Email</dt>
          <dd className="mt-1 font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Phone</dt>
          <dd className="mt-1 font-medium">{user.phone ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Email verification</dt>
          <dd className="mt-1 font-medium">
            {verification}
            {user.emailVerifiedAt ? null : (
              <Link href="/verify-email" className="ml-2 text-brand">
                Verify now
              </Link>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Account status</dt>
          <dd className="mt-1 font-medium">{user.status}</dd>
        </div>
      </dl>
    </section>
  );
}
