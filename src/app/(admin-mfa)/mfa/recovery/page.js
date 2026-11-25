import { MfaRecoveryForm } from "@/components/admin/mfa-forms.js";
import { requireAdminSetupSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function MfaRecoveryPage() {
  const { credential } = await requireAdminSetupSession();

  return (
    <section className="mx-auto max-w-2xl">
      <MfaRecoveryForm enrolled={Boolean(credential?.confirmedAt)} />
    </section>
  );
}
