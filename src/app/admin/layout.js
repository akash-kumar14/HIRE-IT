import { AppShell } from "@/components/app-shell.js";
import { requireAdminSession } from "@/lib/ui/session-guard.js";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const { user } = await requireAdminSession();

  return (
    <AppShell area="admin" user={user}>
      {children}
    </AppShell>
  );
}
