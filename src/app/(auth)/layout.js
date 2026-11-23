import { AppShell } from "@/components/app-shell.js";

export default function AuthLayout({ children }) {
  return (
    <AppShell area="auth">
      <div className="mx-auto max-w-md">{children}</div>
    </AppShell>
  );
}
