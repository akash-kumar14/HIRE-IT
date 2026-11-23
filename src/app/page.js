import Link from "next/link";
import { AppShell } from "@/components/app-shell.js";

const LINK_CLASS =
  "inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-surface";
const SECONDARY_LINK_CLASS =
  "inline-flex rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink";

export default function HomePage() {
  return (
    <AppShell area="public">
      <section className="mx-auto grid max-w-3xl gap-6 py-10 sm:py-16">
        <p className="text-sm font-medium text-brand">HIRE-IT</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          AI-assisted services marketplace
        </h1>
        <p className="text-lg text-ink-muted">
          Agra pilot build. Customers describe a task, verified providers send
          offers.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className={LINK_CLASS}>
            Create account
          </Link>
          <Link href="/login" className={SECONDARY_LINK_CLASS}>
            Sign in
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
