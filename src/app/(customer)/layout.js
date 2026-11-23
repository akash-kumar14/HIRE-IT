import { AppShell } from "@/components/app-shell.js";
import { requireCustomerSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }) {
  const { user } = await requireCustomerSession();

  return (
    <AppShell area="customer" user={user}>
      {children}
    </AppShell>
  );
}
