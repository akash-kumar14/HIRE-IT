# Project Progress

Living status board for the AI-powered service marketplace. Every agent or developer updates this file at the end of each task. Read `AGENTS.md` before working.

**Last updated:** 2026-11-19
**Current focus:** M1.4 — Schema: users/sessions/admin/audit/tokens
**Overall status:** Documentation baseline complete; M1.1–M1.3 done; implementation started.

## Milestones

| ID | Milestone | Status | Notes |
|---|---|---|---|
| M1 | Foundation | In progress | M1.1–M1.3 done; M1.4–M1.11 pending |
| M2 | Authentication and authorization | Not started | Phases M2.1–M2.10 |
| M3 | Provider applications and verification | Not started | Phases M3.1–M3.7 |
| M4 | AI-assisted task creation | Not started | Phases M4.1–M4.7 |
| M5 | Matching and offers | Not started | Phases M5.1–M5.8 |
| M6 | Scheduling and communication | Not started | Phases M6.1–M6.6 |
| M7 | Completion, disputes, reviews, support | Not started | Phases M7.1–M7.6 |
| M8 | Financial simulation | Not started | Phases M8.1–M8.6 |
| M9 | Operational readiness | Not started | Phases M9.1–M9.6 |
| M10 | Controlled Agra pilot | Not started | Phases M10.1–M10.5 |

Status values: `Not started`, `In progress`, `Blocked`, `Done`. Phase definitions live in `docs/04-implementation-plan.md` §3.

## Phase plan

One phase = one agent task, sized for roughly 80% of a context window. Mark `[x]` only after tests pass and this file is updated.

### M1 — Foundation
- [x] M1.1 Repository scaffold (Next.js 16 JS/JSX, Tailwind v4, lint, `.env.example`)
- [x] M1.2 Config and API base (env validation, request ID, envelope, health)
- [x] M1.3 Database plumbing (drizzle config, client, schema index, migration command)
- [ ] M1.4 Schema: users/sessions/admin/audit/tokens
- [ ] M1.5 Schema: providers/categories/skills/areas/verification
- [ ] M1.6 Schema: tasks/matching/offers/assignments
- [ ] M1.7 Schema: availability/bookings/completion/messaging/notifications
- [ ] M1.8 Schema: payments/ledger/commission/idempotency/reconciliation
- [ ] M1.9 Schema: reviews/moderation/disputes/support/jobs/AI usage/settings
- [ ] M1.10 Migrations and seed (custom constraint SQL, up/down verified)
- [ ] M1.11 Test and CI harness (Vitest, Playwright placeholder, Actions, build)

### M2 — Authentication and authorization
- [ ] M2.1 Users/sessions data layer and password hashing
- [ ] M2.2 Register/login/logout/me with secure cookies
- [ ] M2.3 Email verification tokens and endpoints
- [ ] M2.4 Password reset (expiry, single use, session revocation)
- [ ] M2.5 Shared DB-backed rate limiting
- [ ] M2.6 Authorization core (status guard, ownership helpers)
- [ ] M2.7 Admin bootstrap and admin profiles
- [ ] M2.8 TOTP MFA enroll/confirm/verify/recovery
- [ ] M2.9 Audit log and account deletion requests
- [ ] M2.10 M2 tests (positive and negative paths)

### M3 — Provider applications and verification
- [ ] M3.1 Categories/skills public reads and admin management
- [ ] M3.2 Provider application submit and status
- [ ] M3.3 Verification requirements and records
- [ ] M3.4 R2 storage adapter (presign, complete, authorized download)
- [ ] M3.5 Admin application review with audited decisions
- [ ] M3.6 Service areas and availability endpoints
- [ ] M3.7 Qualification expiry enforcement and M3 tests

### M4 — AI-assisted task creation
- [ ] M4.1 Gemini adapter (timeout, mock, structured parsing)
- [ ] M4.2 `POST /tasks/interpret` with schema validation
- [ ] M4.3 Task draft create/update/read preserving original text
- [ ] M4.4 State machine and publish with customer approval
- [ ] M4.5 AI usage records, limits, rate limiting
- [ ] M4.6 Correction retry then manual fallback
- [ ] M4.7 M4 tests

### M5 — Matching and offers
- [ ] M5.1 Resolve ADR-113 and implement geo helper
- [ ] M5.2 Hard eligibility filters
- [ ] M5.3 Ranking v1 with score breakdown
- [ ] M5.4 Match runs/candidates and batched notifications
- [ ] M5.5 Offers create/list/read/update/withdraw
- [ ] M5.6 Accept/decline with atomic assignment and idempotency
- [ ] M5.7 Rematch and no-offer path
- [ ] M5.8 M5 tests (eligibility, remote, concurrency, ranking trace)

### M6 — Scheduling and communication
- [ ] M6.1 Weekly availability and exceptions
- [ ] M6.2 Booking create/cancel with DB conflict constraint
- [ ] M6.3 Conversations and messages with participant authorization
- [ ] M6.4 Attachments via R2 with validation
- [ ] M6.5 Notifications and Resend email jobs
- [ ] M6.6 M6 tests

### M7 — Completion, disputes, reviews, support
- [ ] M7.1 Completion OTP (expiry, single use, rate limits)
- [ ] M7.2 Reminder/escalation jobs
- [ ] M7.3 Disputes with evidence and admin resolution
- [ ] M7.4 Mutual reviews, reports, moderation
- [ ] M7.5 Support tickets
- [ ] M7.6 M7 tests

### M8 — Financial simulation
- [ ] M8.1 Payment adapter interface and simulator
- [ ] M8.2 Payment/refund records with idempotency
- [ ] M8.3 Ledger and commission calculation
- [ ] M8.4 Payout simulation
- [ ] M8.5 Reconciliation runs and exceptions
- [ ] M8.6 M8 tests

### M9 — Operational readiness
- [ ] M9.1 Structured logging and redaction
- [ ] M9.2 Health checks and job monitoring
- [ ] M9.3 Backup script and restore drill
- [ ] M9.4 CI/CD and migration runbook
- [ ] M9.5 Security/privacy review
- [ ] M9.6 Operational drills

### M10 — Controlled Agra pilot
- [ ] M10.1 Pilot seed data
- [ ] M10.2 Critical E2E journeys
- [ ] M10.3 Monitoring dashboards and alerts
- [ ] M10.4 Support/incident runbook and feedback
- [ ] M10.5 Launch readiness review (payments simulated)

## Current blockers

- Test harness not installed yet (Vitest/Playwright) — planned in M1.11.
- `npm audit` reports 0 production vulnerabilities; 4 moderate dev-only advisories (esbuild via `drizzle-kit` / `@esbuild-kit` loader).
- ADR-113 geographic matching choice open (PostGIS vs numeric + haversine).
- Vendor checks pending: Vercel plan, Neon PostGIS availability, Gemini terms/quotas, R2, Resend, Sentry.

## Test status

No test suite exists yet. Once `package.json` is added, record runs here:

| Date | Command | Result | Notes |
|---|---|---|---|
| 2026-11-18 | `npm run lint` | Pass | 0 errors, 0 warnings |
| 2026-11-18 | `npm run build` | Pass | Next.js 16.4.6; `/api/v1/health` is dynamic (`ƒ`) |
| 2026-11-18 | `next start` + `curl /api/v1/health` | Pass | 200 envelope, `x-request-id` header, client ID honored |
| 2026-11-19 | `npm run lint` | Pass | 0 errors, 0 warnings |
| 2026-11-19 | `npm run build` | Pass | Next.js 16.4.6; `/api/v1/health` still dynamic |
| 2026-11-19 | Node DB client checks | Pass | Missing/invalid `DATABASE_URL` → `ConfigError`; valid URL → lazy singleton, `closeDb()` clears it |
| 2026-11-19 | `drizzle.config.js` import | Pass | Postgres dialect, schema index and `./drizzle` output resolved |

## Work log

Newest entries at the top. Do not delete history; append corrections instead.

### 2026-11-19 — M1.3 — Database plumbing

- Changed: added `@neondatabase/serverless`, `drizzle-orm`, `ws`, `drizzle-kit`, and `dotenv` (`package.json`, `package-lock.json`); added `src/lib/db/client.js` with lazy `getDb()` singleton, `closeDb()`, `DATABASE_URL` validation through `ConfigError`, and a `ws` fallback for Node 20; added empty `src/lib/db/schema/index.js` placeholder for M1.4+ domain schemas; `drizzle.config.js` loads `.env` via `dotenv/config`. Existing `npm run db:generate` / `npm run db:migrate` are the explicit migration commands.
- Tests: `npm run lint` pass; `npm run build` pass; direct Node checks pass for missing/invalid/valid `DATABASE_URL`, singleton reuse, and Drizzle config loading. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: no live Neon `DATABASE_URL`, so no migration was applied; 4 moderate dev-only npm advisories remain.
- Next step: M1.4 — add `src/lib/db/schema/users.js` with users, sessions, admin, audit, and token tables.

### 2026-11-18 — M1.2 — Config and API base

- Added `src/lib/config/env.js`: dependency-free env validation (`validateEnv`, `getEnv`, `ConfigError`); production requires `APP_URL`, `DATABASE_URL`, `SESSION_SECRET`; all other values validated only when present.
- Added `src/lib/api/request-id.js`: reuses a valid incoming `x-request-id` or generates a UUID.
- Added `src/lib/api/response.js`: `successResponse` / `errorResponse` matching the SPEC-003 envelope and setting `x-request-id` plus `cache-control: no-store`.
- Added `src/app/api/v1/health/route.js`: dynamic `GET /api/v1/health` returning `{ status, configuration, timestamp }` without exposing secrets.
- Tests: `npm run lint` pass; `npm run build` pass; production server + `curl` confirmed 200 envelope and request-ID behavior. Health reports `configuration: "incomplete"` locally because no `.env` is set (expected).
- Next step: M1.3 — `drizzle.config.js` verification, DB client, schema index, explicit migration command.

### 2026-11-18 — M1.1 — Initialized repository and pushed to GitHub

- Initialized a standalone git repository in `HIRE-IT` (the project was nested inside the `/Users/mac` repo) with `main` as the default branch.
- Committed the documentation baseline and scaffold (58 files), added remote `https://github.com/akash-kumar14/HIRE-IT.git`, pushed `main`.
- Tests: no code changes; previous `npm run lint` and `npm run build` results still apply.
- Next step: M1.2 — env validation, request ID, API response envelope helper, `GET /api/v1/health`.

### 2026-11-18 — M1.1 — Remove stale `.gitkeep` files

- Deleted `.gitkeep` from non-empty folders: `src/styles/` (has `globals.css`) and `drizzle/` (contains `meta/`). Kept `.gitkeep` only in the 34 truly empty directories.
- Tests: none needed (placeholder cleanup); `npm run lint` and `npm run build` unaffected.
- Next step: M1.2 — env validation, request ID, API response envelope helper, `GET /api/v1/health`.

### 2026-11-18 — M1.1 — Repository scaffold complete

- Installed dependencies: `next@16.4.6`, `react@19.3.1`, `react-dom@19.3.1`, `tailwindcss@4.3.5`, `@tailwindcss/postcss`, `eslint@9`, `eslint-config-next@16.4.6` (`package.json`, `package-lock.json`).
- Added app/config files: `next.config.js`, `postcss.config.mjs`, `eslint.config.mjs` (flat config), `jsconfig.json` (`@/*` → `src/*`), `src/app/layout.js`, `src/app/page.js`, `src/styles/globals.css`.
- Design tokens defined as CSS variables in `globals.css` (`--surface`, `--ink`, `--brand`, etc.) and exposed to Tailwind via `@theme inline`; no raw colors in components.
- Set `"type": "module"` in `package.json` to remove the ESM warning from `next.config.js`.
- Tests: `npm run lint` pass; `npm run build` pass (Next.js 16.4.6, routes `/` and `/_not-found`). Vitest/Playwright not installed yet (M1.11).
- Audit: production dependencies 0 vulnerabilities; 14 high-severity dev-only advisories in the typescript-eslint chain pulled by `eslint-config-next`.
- Next step: M1.2 — env validation, request ID, API response envelope helper, `GET /api/v1/health`.

### 2026-11-18 — M1.1 — Project skeleton created

- Created the folder structure from `docs/04-implementation-plan.md` §2: `src/app` route groups, `src/modules/*`, `src/infrastructure/*`, `src/lib/*`, `src/components`, `src/styles`, `drizzle/`, `tests/{unit,integration,e2e}`, `.github/workflows` (empty dirs keep `.gitkeep`).
- Added root files: `package.json` (scripts only, no dependencies yet), `.gitignore`, `.env.example` (names only), `drizzle.config.js`, `README.md`.
- Not done yet: dependency install, Next.js `layout.js`/`page.js`, Tailwind v4 setup, lint/test configs. M1.1 remains open.
- Tests: none available (no dependencies installed).
- Next step: finish M1.1 by installing dependencies and adding the minimal Next.js + Tailwind app, then run `npm run build`.

### 2026-11-18 — Planning — CSS color token convention

- Added a convention to `AGENTS.md`: no hardcoded colors in CSS; define `--color-*` design tokens as CSS variables and reference them from Tailwind/theme and component CSS.
- Tests: none available (docs-only repository).
- Next step: M1.1 repository scaffold (define the initial token set in the global stylesheet).

### 2026-11-18 — Planning — Milestones split into phases

- Split M1–M10 into 72 agent-sized phases in `docs/04-implementation-plan.md` §3 (task sizing rule, ~10 files / ~80% context per phase) and mirrored the change in the generated documentation file.
- Added phase checkboxes and statuses to this file; `Current focus` is now the phase ID (`M1.1`).
- Updated `AGENTS.md` workflow: one phase per task, split phases that outgrow the budget, tick the phase checkbox on completion.
- Tests: none available (docs-only repository).
- Next step: M1.1 repository scaffold.

### 2026-11-18 — Documentation baseline

- Reconciled docs to JavaScript/JSX + Drizzle stack; ADR-003 now says JavaScript full-stack.
- Removed team/work-division assumptions: README, SPEC-001, SPEC-002, SPEC-004, SPEC-005, SPEC-006, package manifest now describe a solo developer + AI assistant.
- Added `AGENTS.md` (agent context, conventions, mandatory testing and progress-update workflow).
- Added `docs/progress.md` (this file).
- Tests: none available (docs-only repository).
- Next step: create the M1 scaffold (`package.json`, Next.js 16 App Router JS/JSX, Tailwind v4, Drizzle config, `.env.example`, lint/test scripts) and record results here.

## Entry template

```markdown
### YYYY-MM-DD — <phase ID, e.g. M2.4> — <short title>

- Changed: <what and why, with file paths>
- Tests: <commands run> → <pass/fail/skipped + reason>
- Blockers: <none or details>
- Next step: <single concrete next action>
```
