import { AppShell } from "@/components/app-shell.js";
import { requireProviderSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }) {
  const { user } = await requireProviderSession();

  return (
    <AppShell area="provider" user={user}>
      {children}
    </AppShell>
  );
}
