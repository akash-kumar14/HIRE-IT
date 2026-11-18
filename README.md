# HIRE-IT — AI-Powered Service Marketplace

Two-sided services marketplace launching in Agra, Uttar Pradesh, India. Customers describe needs in natural language, get AI-assisted task structuring, discover verified providers, compare offers, and manage work to completion. Providers apply, get verified, publish skills and availability, and submit offers.

## Stack

- Next.js 16 App Router, JavaScript/JSX only, Tailwind CSS v4
- PostgreSQL on Neon with Drizzle ORM and versioned migrations
- Vercel hosting, Cloudflare R2 private storage, Google Gemini, Resend
- Custom email/password sessions with TOTP MFA for admins
- Simulated payments behind a provider-neutral interface

## Status

Foundation in progress (M1). Next.js 16 App Router with Tailwind v4 is scaffolded; database, auth, and marketplace features are not implemented yet.

## Working on this project

Read `AGENTS.md` first, then `docs/progress.md`. Work one phase at a time (see `docs/04-implementation-plan.md` §3) and update the progress file when done.

## Documentation

Start at `docs/README.md`. Key documents:

- `docs/01-architecture-specification.md`
- `docs/02-database-design.md`
- `docs/03-api-specification.md`
- `docs/04-implementation-plan.md`
- `docs/05-security-privacy-operations.md`
- `docs/06-architecture-decision-register.md`
- `docs/progress.md`
