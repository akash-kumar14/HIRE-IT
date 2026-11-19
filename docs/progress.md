# Project Progress

Living status board for the AI-powered service marketplace. Every agent or developer updates this file at the end of each task. Read `AGENTS.md` before working.

**Last updated:** 2026-11-19
**Current focus:** M2.1 — Users/sessions data layer and password hashing
**Overall status:** Documentation baseline complete; M1.1–M1.11 done; M2.1 next.

## Milestones

| ID | Milestone | Status | Notes |
|---|---|---|---|
| M1 | Foundation | Done | M1.1–M1.11 done; CI and test harness in place |
| M2 | Authentication and authorization | Not started | Phases M2.1–M2.13; UI phases M2.11–M2.13 start after M2.10 |
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
- [x] M1.4 Schema: users/sessions/admin/audit/tokens
- [x] M1.5 Schema: providers/categories/skills/areas/verification
- [x] M1.6 Schema: tasks/matching/offers/assignments
- [x] M1.7 Schema: availability/bookings/completion/messaging/notifications
- [x] M1.8 Schema: payments/ledger/commission/idempotency/reconciliation
- [x] M1.9 Schema: reviews/moderation/disputes/support/jobs/AI usage/settings
- [x] M1.10 Migrations and seed (custom constraint SQL, up/down verified)
- [x] M1.11 Test and CI harness (Vitest, Playwright placeholder, Actions, build)

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
- [ ] M2.11 UI shell (route groups, nav, session guard, responsive tokens)
- [ ] M2.12 Auth screens (register/login/logout/me, verification, reset)
- [ ] M2.13 Admin MFA screens (enroll/confirm/verify/recovery)

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

- `npm audit` reports 0 production vulnerabilities; 4 moderate dev-only advisories (esbuild via `drizzle-kit` / `@esbuild-kit` loader).
- ADR-113 geographic matching choice open (PostGIS vs numeric + haversine).
- Vendor checks pending: Vercel plan, Neon PostGIS availability, Gemini terms/quotas, R2, Resend, Sentry.

## Test status

Test harness is available from M1.11; record runs here:

| Date | Command | Result | Notes |
|---|---|---|---|
| 2026-11-18 | `npm run lint` | Pass | 0 errors, 0 warnings |
| 2026-11-18 | `npm run build` | Pass | Next.js 16.4.6; `/api/v1/health` is dynamic (`ƒ`) |
| 2026-11-18 | `next start` + `curl /api/v1/health` | Pass | 200 envelope, `x-request-id` header, client ID honored |
| 2026-11-19 | `npm run lint` | Pass | 0 errors, 0 warnings |
| 2026-11-19 | `npm run build` | Pass | Next.js 16.4.6; `/api/v1/health` still dynamic |
| 2026-11-19 | Node DB client checks | Pass | Missing/invalid `DATABASE_URL` → `ConfigError`; valid URL → lazy singleton, `closeDb()` clears it |
| 2026-11-19 | `drizzle.config.js` import | Pass | Postgres dialect, schema index and `./drizzle` output resolved |
| 2026-11-19 | Schema index import | Pass | 7 tables and 4 enums exported from `src/lib/db/schema/index.js` |
| 2026-11-19 | `drizzle-kit generate` to temp dir | Pass | 7 tables, correct FKs, lowercase-email check, partial unique pending-deletion index; repo migrations untouched |
| 2026-11-19 | Provider schema import | Pass | 14 tables and 6 enums exported from `src/lib/db/schema/index.js` |
| 2026-11-19 | `drizzle-kit generate` (M1.5) to temp dir | Pass | 14 tables, geo ranges, experience/validity checks, composite provider-skill key; repo migrations untouched |
| 2026-11-19 | Task schema import | Pass | 22 tables and 14 enums exported from `src/lib/db/schema/index.js` |
| 2026-11-19 | `drizzle-kit generate` (M1.6) to temp dir | Pass | 22 tables, ADR-112 task enum, canonical-state partial uniques, budget/schedule checks; repo migrations untouched |
| 2026-11-19 | Booking/messaging schema import | Pass | 31 tables and 20 enums exported from `src/lib/db/schema/index.js` |
| 2026-11-19 | `drizzle-kit generate` (M1.7) to temp dir | Pass | 31 tables, one active booking per task, single-use OTP fields, conversation/message constraints; repo migrations untouched |
| 2026-11-19 | Payments schema import | Pass | 40 tables and 29 enums exported from `src/lib/db/schema/index.js` |
| 2026-11-19 | `drizzle-kit generate` (M1.8) to temp dir | Pass | 40 tables, integer minor units, simulator flags, idempotency scope/key uniqueness, commission policy/version; repo migrations untouched |
| 2026-11-19 | Quality/ops schema import | Pass | 51 tables and 42 enums exported from `src/lib/db/schema/index.js` |
| 2026-11-19 | `drizzle-kit generate` (M1.9) to temp dir | Pass | 51 tables, one review per task/participant, one active dispute per task, job idempotency, AI usage metadata; repo migrations untouched |
| 2026-11-19 | `drizzle-kit check` | Pass | Migration journal and snapshots consistent for 0000–0002 |
| 2026-11-19 | `npm run lint` / `npm run build` | Pass | M1.10 migration and seed files do not affect lint or production build |
| 2026-11-19 | Migration up against Neon dev branch | Pass | 51 tables, 42 enums, 3 migration rows, `btree_gist`, 4 custom functions; seed 8 categories / 16 skills / 10 requirements / 4 settings |
| 2026-11-19 | Custom constraint negative checks | Pass | Booking overlap rejected (23P01); unbalanced ledger, ledger update/delete, over-refund, and cumulative over-refund rejected (P0001); valid balanced ledger and refund accepted |
| 2026-11-19 | Migration down against Neon dev branch | Pass | 0 tables, 0 enums, 0 migration rows, `btree_gist` removed, 0 custom functions |
| 2026-11-19 | Migration re-up against Neon dev branch | Pass | `migrations applied successfully!`; final state restored |
| 2026-11-19 | Final M1.10 checks | Pass | `npx drizzle-kit check`, `npm run lint`, and `npm run build` pass after down-migration cleanup edit |
| 2026-11-19 | Pinned test dependencies | Pass | `vitest@4.1.12` and `@playwright/test@1.65.1` installed as exact dev dependencies; lockfile updated |
| 2026-11-19 | `npm test` | Pass | 2 unit test files, 5 tests; request ID and API envelope covered |
| 2026-11-19 | `npm run test:integration` without `DATABASE_URL` | Pass | 1 integration test skipped as designed |
| 2026-11-19 | `npm run test:integration` with `DATABASE_URL` | Pass | 1 integration test passed; `select 1` against Neon dev branch |
| 2026-11-19 | `npm run test:e2e -- --list` | Pass | 1 Playwright health smoke test discovered; browser install deferred |
| 2026-11-19 | M1.11 final checks | Pass | `npm run lint`, `npm test`, `npm run test:integration`, Playwright list, and `npm run build` all pass |

## Work log

Newest entries at the top. Do not delete history; append corrections instead.

### 2026-11-19 — M1.11 — Test and CI harness

- Changed: added exact dev dependencies `vitest@4.1.12` and `@playwright/test@1.65.1`; added `vitest.config.js`, `vitest.integration.config.js`, and `playwright.config.js`; updated `test:integration` to use the integration config; added unit tests for `createRequestId` and the API response envelope, an integration smoke test that skips without `DATABASE_URL`, and a Playwright health smoke test; added `.github/workflows/ci.yml` running `npm ci`, lint, unit tests, integration tests, Playwright discovery, and production build with non-secret dummy env values.
- Tests: `npm run lint` pass; `npm test` pass (2 files / 5 tests); `npm run test:integration` skipped without `DATABASE_URL` and passed with it (1 test); `npm run test:e2e -- --list` discovered 1 test; `npm run build` pass.
- Blockers: none. Playwright browsers are not installed locally; CI runs placeholder discovery only until E2E milestones. `npm audit` still reports 4 moderate dev-only advisories; ADR-113 and vendor checks remain open.
- Next step: M2.1 — add `bcryptjs`, users/sessions data layer, password hashing, and session create/revoke helpers.

### 2026-11-19 — M1.10 — Migrations and seed

- Changed: generated `drizzle/0000_full_schema.sql` from the 51-table schema, added `drizzle/0000_full_schema.down.sql`, added `drizzle/0001_custom_constraints.sql` with booking overlap exclusion, append-only ledger trigger, ledger balance/entry triggers, refund total/currency trigger, and matching `.down.sql`; added `drizzle/0002_seed_data.sql` with deterministic categories, skills, verification requirements, and platform settings plus `drizzle/0002_seed_data.down.sql`. Initialized `drizzle/meta/_journal.json` and snapshots, removed `drizzle/meta/.gitkeep`, and added `DROP EXTENSION IF EXISTS btree_gist` to the custom down migration.
- Tests: `npx drizzle-kit check` pass; `npm run lint` pass; `npm run build` pass. Applied all three migrations to the Neon dev branch: 51 tables, 42 enums, 3 migration rows, `btree_gist`, 4 custom functions, and seed counts 8/16/10/4. Negative checks confirmed booking overlap (23P01), unbalanced ledger, ledger update/delete, and over-refund/cumulative over-refund (P0001) are rejected while valid balanced ledger and refund inserts are accepted. Down migrations removed all tables/enums/migration rows/extension/functions; re-running `npm run db:migrate` restored the final state.
- Security: restored `.env.example` to a blank `DATABASE_URL=` placeholder after a live URL was pasted there; no secret was committed or pushed.
- Blockers: none. Vitest/Playwright are still deferred to M1.11; no automated test file was added.
- Next step: M1.11 — install/configure Vitest, Playwright placeholder, GitHub Actions, and confirm the production build.

### 2026-11-19 — M1.9 — Quality, dispute, support, and operations schema

- Changed: added `src/lib/db/schema/reviews.js` with `reviews`, `review_reports`, `moderation_cases`; added `src/lib/db/schema/disputes.js` with `disputes`, `dispute_evidence`, `dispute_admin_notes`, `support_tickets`, `support_ticket_messages`; added `src/lib/db/schema/jobs.js` with `background_jobs`, `ai_usage_records`, `platform_settings` and related enums. Enforced one review per task/participant, one report per reviewer/review, one active dispute per task, private admin/internal notes, job idempotency keys and lease fields, token/latency usage counters without prompt/response bodies, and public/private platform settings. Re-exported all from `src/lib/db/schema/index.js`.
- Tests: `npm run lint` pass; `npm run build` pass; schema index import reports 51 tables / 42 enums; `drizzle-kit generate` into a temp directory produced correct SQL without writing to `drizzle/`. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: provider-overlap exclusion constraint, append-only ledger trigger, balanced-transaction check, and refund-total cap still require reviewed custom SQL in M1.10; migrations still deferred to M1.10.
- Next step: M1.10 — generate reviewed versioned migrations, add custom SQL constraints, verify up/down against a database, and add seed data.

### 2026-11-19 — M1.8 — Payments, ledger, commission, idempotency, and reconciliation schema

- Changed: added `src/lib/db/schema/payments.js` with `payments`, `refunds`, `payouts`, `commission_calculations`, `ledger_transactions`, `ledger_entries`, `idempotency_records`, `reconciliation_runs`, `reconciliation_exceptions` and financial status enums; used integer minor units plus currency, labeled simulator records as non-real, recorded provider-paid commission rate/amount/policy version, kept ledger entries append-only by design, and added scoped idempotency keys with request fingerprints. Re-exported from `src/lib/db/schema/index.js`.
- Tests: `npm run lint` pass; `npm run build` pass; schema index import reports 40 tables / 29 enums; `drizzle-kit generate` into a temp directory produced correct SQL without writing to `drizzle/`. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: append-only ledger trigger, balanced-transaction check, refund-total cap, and provider-overlap exclusion constraint still require reviewed custom SQL in M1.10; migrations still deferred to M1.10.
- Next step: M1.9 — add `src/lib/db/schema/reviews.js`, `disputes.js`, and `jobs.js` with reviews/moderation/disputes/support/jobs/AI usage/settings tables.

### 2026-11-19 — M1.7 — Scheduling, completion, messaging, and notifications schema

- Changed: added `src/lib/db/schema/bookings.js` with `provider_availability`, `availability_exceptions`, `bookings`, `completion_confirmations` and enums for booking/role states; stored IANA timezone context, prevented multiple active bookings per task, and added hashed single-use completion OTP fields with expiry/attempts. Added `src/lib/db/schema/messaging.js` with `conversations`, `messages`, `message_attachments`, `notifications`, `email_deliveries` and enums for message/notification/email states; enforced unique task-provider conversations, private object keys, non-empty messages, and async email delivery tracking. Re-exported both from `src/lib/db/schema/index.js`.
- Tests: `npm run lint` pass; `npm run build` pass; schema index import reports 31 tables / 20 enums; `drizzle-kit generate` into a temp directory produced correct SQL without writing to `drizzle/`. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: provider-overlap exclusion constraint from SPEC-002 §5 cannot be expressed by Drizzle and is still deferred to M1.10 custom SQL; migrations still deferred to M1.10.
- Next step: M1.8 — add `src/lib/db/schema/payments.js` with payments/refunds/payouts/ledger/commission/idempotency/reconciliation tables.

### 2026-11-19 — M1.6 — Task, matching, and offer schema

- Changed: added `src/lib/db/schema/tasks.js` with `tasks`, `task_requirements`, `task_locations`, `task_attachments`, `match_runs`, `match_candidates`, `offers`, `task_assignments` and enums for ADR-112 task states, mode, requirement/location types, match/offer/assignment statuses; preserved original description separately, kept relational authoritative fields plus non-authoritative JSON, enforced one active assignment and one submitted offer per provider/task, and added location privacy via `revealed_at`; re-exported from `src/lib/db/schema/index.js`.
- Tests: `npm run lint` pass; `npm run build` pass; schema index import reports 22 tables / 14 enums; `drizzle-kit generate` into a temp directory produced correct SQL without writing to `drizzle/`. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: migrations still deferred to M1.10; authoritative state-transition service arrives in M4.4.
- Next step: M1.7 — add `src/lib/db/schema/bookings.js` with availability, exceptions, bookings, completion confirmations, messaging, and notifications.

### 2026-11-19 — M1.5 — Provider and verification schema

- Changed: added `src/lib/db/schema/providers.js` with `service_categories`, `provider_profiles`, `skills`, `provider_skills`, `provider_service_areas`, `verification_requirements`, `provider_verifications` plus provider-status and verification-status enums; enforced deactivation-friendly category/skill references, private document object keys, numeric lat/lng with range checks, non-negative experience, and validity-period checks; re-exported from `src/lib/db/schema/index.js`.
- Tests: `npm run lint` pass; `npm run build` pass; schema index import reports 14 tables / 6 enums; `drizzle-kit generate` into a temp directory produced correct SQL without writing to `drizzle/`. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: ADR-113 geo implementation still open (numeric coordinates used for now); migrations still deferred to M1.10.
- Next step: M1.6 — add `src/lib/db/schema/tasks.js` with tasks, requirements, locations, attachments, match runs/candidates, offers, and assignments.

### 2026-11-19 — Documentation — M2 UI phases scheduled

- Changed: added `M2.11`–`M2.13` to `docs/04-implementation-plan.md` §3 and mirrored them in `docs/ai_service_marketplace_complete_documentation.md`; mirrored checkboxes and the M2 milestone note in `docs/progress.md`; added a sequencing rule to `AGENTS.md` §6.
- Tests: docs-only change; `git diff --check` pass and phase IDs cross-checked. No code checks needed.
- Blockers: none; `docs:build` script still missing, so generated documentation was mirrored manually.
- Next step: continue M1.5; start `M2.11` only after `M2.10` passes.

### 2026-11-19 — M1.4 — Users and access schema

- Changed: added `src/lib/db/schema/users.js` with `users`, `user_sessions`, `admin_profiles`, `admin_mfa_credentials`, `audit_logs`, `verification_tokens`, `account_deletion_requests` and enums for user status, admin role, token type, deletion status; enforced unique normalized email, hashed session/token uniqueness, one pending deletion request per user, and audit history preservation via `set null` FKs; re-exported the file from `src/lib/db/schema/index.js`.
- Tests: `npm run lint` pass; `npm run build` pass; schema index import reports 7 tables / 4 enums; `drizzle-kit generate` into a temp directory produced correct SQL (check constraints, partial unique index, FKs) without writing to `drizzle/`. Vitest/Playwright still absent (M1.11), so no automated test file was added.
- Blockers: migrations still deferred to M1.10; audit-log append-only enforcement still needs custom SQL/trigger in M1.10.
- Next step: M1.5 — add `src/lib/db/schema/providers.js` with categories, skills, provider profiles, skills, service areas, and verification tables.

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
