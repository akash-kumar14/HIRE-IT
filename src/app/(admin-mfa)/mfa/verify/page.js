import Link from "next/link";
import { MfaVerifyForm } from "@/components/admin/mfa-forms.js";
import { FormCard, FormNotice } from "@/components/auth/form-ui.js";
import { requireAdminSetupSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function MfaVerifyPage() {
  const { credential, session } = await requireAdminSetupSession();
  const enrolled = Boolean(credential?.confirmedAt);
  const verified = Boolean(session?.mfaVerifiedAt);

  return (
    <section className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-brand">Admin security</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Multi-factor authentication
        </h1>
        <p className="text-ink-muted">
          Complete MFA before accessing admin operations.
        </p>
      </div>
      <dl className="grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">Enrollment</dt>
          <dd className="mt-1 font-medium">{enrolled ? "Enrolled" : "Not enrolled"}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">Current session</dt>
          <dd className="mt-1 font-medium">{verified ? "Verified" : "Not verified"}</dd>
        </div>
      </dl>
      {verified ? (
        <FormCard
          title="MFA complete"
          description="This session is cleared for admin work."
          footer={
            <Link href="/admin" className="font-medium text-brand">
              Open admin workspace
            </Link>
          }
        >
          <FormNotice>
            Multi-factor authentication has already been completed for this session.
          </FormNotice>
        </FormCard>
      ) : (
        <MfaVerifyForm enrolled={enrolled} />
      )}
    </section>
  );
}
