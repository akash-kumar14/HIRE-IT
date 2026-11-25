import { AppShell } from "@/components/app-shell.js";
import { requireAdminSetupSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function MfaLayout({ children }) {
  const { user } = await requireAdminSetupSession();

  return (
    <AppShell area="admin" user={user}>
      {children}
    </AppShell>
  );
}
