import Link from "next/link";
import { MfaEnrollmentForm } from "@/components/admin/mfa-forms.js";
import { FormCard, FormNotice } from "@/components/auth/form-ui.js";
import { requireAdminSetupSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function MfaEnrollPage() {
  const { credential } = await requireAdminSetupSession();

  if (credential?.confirmedAt) {
    return (
      <section className="mx-auto max-w-2xl">
        <FormCard
          title="MFA already enrolled"
          description="This admin already has an active authenticator credential."
          footer={
            <Link href="/mfa/verify" className="font-medium text-brand">
              Back to security
            </Link>
          }
        >
          <FormNotice>
            Use your authenticator or a recovery code to verify this session.
          </FormNotice>
        </FormCard>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl">
      <MfaEnrollmentForm />
    </section>
  );
}
