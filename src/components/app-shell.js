import Link from "next/link";
import { getShellNavigation } from "@/lib/ui/navigation.js";

export function AppShell({ area = "public", user, children }) {
  const links = getShellNavigation(area);
  const label = user?.fullName ?? user?.email ?? "Guest";

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="text-lg font-semibold text-brand">
            HIRE-IT
          </Link>
          <nav aria-label={`${area} navigation`} className="min-w-0">
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm text-ink-muted sm:text-right">{label}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-ink-muted sm:px-6">
          Agra pilot · Verified providers, task-specific offers.
        </div>
      </footer>
    </div>
  );
}
