# Project Progress

Living status board for the AI-powered service marketplace. Every agent or developer updates this file at the end of each task. Read `AGENTS.md` before working.

**Last updated:** 2026-11-27
**Current focus:** M3.7 — Qualification expiry enforcement and M3 tests
**Overall status:** Documentation baseline complete; M1 and M2 done; M3.1–M3.6 done; M3.7 remains; M3.8 planned after M3.7.

## Milestones

| ID | Milestone | Status | Notes |
|---|---|---|---|
| M1 | Foundation | Done | M1.1–M1.11 done; CI and test harness in place |
| M2 | Authentication and authorization | Done | M2.1–M2.13 done; admin MFA enforced in UI |
| M3 | Provider applications and verification | In progress | M3.1–M3.6 done; M3.7 remains; M3.8 planned |
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
- [x] M2.1 Users/sessions data layer and password hashing
- [x] M2.2 Register/login/logout/me with secure cookies
- [x] M2.3 Email verification tokens and endpoints
- [x] M2.4 Password reset (expiry, single use, session revocation)
- [x] M2.5 Shared DB-backed rate limiting
- [x] M2.6 Authorization core (status guard, ownership helpers)
- [x] M2.7 Admin bootstrap and admin profiles
- [x] M2.8 TOTP MFA enroll/confirm/verify/recovery
- [x] M2.9 Audit log and account deletion requests
- [x] M2.10 M2 tests (positive and negative paths)
- [x] M2.11 UI shell (route groups, nav, session guard, responsive tokens)
- [x] M2.12 Auth screens (split into M2.12a / M2.12b)
  - [x] M2.12a Login, register, logout, and current profile screens
  - [x] M2.12b Email verification and password reset screens
- [x] M2.13 Admin MFA screens (enroll/confirm/verify/recovery)

### M3 — Provider applications and verification
- [x] M3.1 Categories/skills public reads and admin management
- [x] M3.2 Provider application submit and status
- [x] M3.3 Verification requirements and records
- [x] M3.4 R2 storage adapter (presign, complete, authorized short-lived download)
- [x] M3.5 Admin application review with audited decisions
- [x] M3.6 Service areas and availability endpoints
- [ ] M3.7 Qualification expiry enforcement and M3 tests
- [ ] M3.8 Role dashboard data and forms (planned after M3.7)

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
- `admin.test.js` assumes no pre-existing admin profile; park and restore the local super admin around full integration runs.
- API spec has no service-area endpoint payload schemas; M3.6 endpoints are documented in the M3.6 work log and OpenAPI remains an outstanding item.
- Vendor checks pending: Vercel plan, Neon PostGIS availability, Gemini terms/quotas, R2, Resend, Sentry.
- Integration suite takes about seven to eight minutes against the Neon dev branch; use a 600s command timeout.

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
| 2026-11-20 | `npm ci` with npm 10 (CI parity) | Pass | Clean install succeeds after regenerating `package-lock.json` with npm 10; npm 11 also succeeds |
| 2026-11-20 | Full CI sequence | Pass | `npm run lint`, `npm test`, `npm run test:integration`, Playwright list, and `npm run build` all pass |
| 2026-11-20 | `npm ci` with npm 10 after `bcryptjs` | Pass | Clean install succeeds with the npm 10-generated lockfile |
| 2026-11-20 | `npm test` (M2.1) | Pass | 5 unit test files, 16 tests; password hashing, session tokens, and email normalization covered |
| 2026-11-20 | `npm run test:integration` (M2.1) | Pass | 4 users/sessions tests passed against Neon dev branch; 1 legacy smoke test skipped |
| 2026-11-20 | M2.1 final checks | Pass | `npm run lint`, `npm run test:e2e -- --list`, and `npm run build` pass; integration test timeout raised to 20s for Neon latency |
| 2026-11-20 | `npm test` (M2.2) | Pass | 7 unit test files, 25 tests; validation, session cookies, request envelope, hashing, and tokens covered |
| 2026-11-20 | `npm run test:integration` (M2.2) | Pass | 5 auth route tests passed against Neon dev branch; 4 M2.1 tests passed, 1 legacy smoke test skipped |
| 2026-11-20 | M2.2 production build | Pass | Four new `/api/v1/auth/*` route handlers compile as dynamic routes; Playwright discovery unchanged |
| 2026-11-20 | `npm test` (M2.3) | Pass | 8 unit test files, 30 tests; verification tokens and confirm validation covered |
| 2026-11-20 | `npm run test:integration` (M2.3) | Pass | 3 email verification tests passed against Neon dev branch; 9 earlier integration tests passed, 1 skipped |
| 2026-11-20 | M2.3 production build | Pass | Two new verification routes compile as dynamic routes; Playwright discovery unchanged |
| 2026-11-21 | `npm test` (M2.4) | Pass | 8 unit test files, 34 tests; password reset request/confirm validation covered |
| 2026-11-21 | `npm run test:integration` (M2.4) | Pass | 4 password reset tests passed against Neon dev branch; 12 earlier tests passed, 1 skipped |
| 2026-11-21 | M2.4 production build | Pass | Two new `/api/v1/auth/password-reset*` routes compile as dynamic routes; Playwright discovery unchanged |
| 2026-11-21 | `npx drizzle-kit check` | Pass | Journal and snapshots consistent through `0003_rate_limit_counters` |
| 2026-11-21 | `npm run db:migrate` | Pass | 0003 applied to Neon dev branch; `rate_limit_counters` and indexes created |
| 2026-11-21 | `npm test` (M2.5, parallel run) | Fail | bcrypt unit test timed out at 5s under concurrent lint/drizzle/migration load; no code change |
| 2026-11-21 | `npm test` (M2.5, isolated rerun) | Pass | 9 unit test files, 40 tests |
| 2026-11-21 | `npm run test:integration` (M2.5) | Pass | 3 rate limit tests passed against Neon dev branch; 16 earlier tests passed, 1 skipped |
| 2026-11-21 | M2.5 production build | Pass | Six auth routes compile with rate limiting; Playwright discovery unchanged |
| 2026-11-21 | `npm test` (M2.6) | Pass | 10 unit test files, 45 tests |
| 2026-11-21 | `npm run test:integration` (M2.6) | Pass | 5 authorization guard tests passed against Neon dev branch; 19 earlier tests passed, 1 skipped |
| 2026-11-21 | M2.6 production build | Pass | Auth routes compile with shared session guard; Playwright discovery unchanged |
| 2026-11-21 | `npx drizzle-kit check` | Pass | Journal and snapshots consistent through `0004_admin_super_admin_unique` |
| 2026-11-21 | `npm run db:migrate` | Pass | 0004 applied to Neon dev branch; one-super-admin partial unique index created |
| 2026-11-21 | `npm test` (M2.7) | Pass | 11 unit test files, 49 tests |
| 2026-11-21 | `npm run test:integration` (M2.7, first run) | Fail | Pre-existing rate-limit route test crossed a 15-minute window boundary; no production code change |
| 2026-11-21 | `npm run test:integration` (M2.7, rerun) | Pass | 3 admin tests passed against Neon dev branch; 24 earlier tests passed, 1 skipped |
| 2026-11-21 | `npm run admin:bootstrap` guard check | Pass | Refuses to run without `ADMIN_BOOTSTRAP_CONFIRM=1`; no DB changes |
| 2026-11-21 | M2.7 production build | Pass | Node alias loader and CLI script added; Playwright discovery unchanged |
| 2026-11-21 | `npx drizzle-kit check` | Pass | Journal and snapshots consistent through `0005_session_mfa_verified_at` |
| 2026-11-21 | `npm run db:migrate` | Pass | 0005 applied to Neon dev branch; `user_sessions.mfa_verified_at` added |
| 2026-11-21 | `npm test` (M2.8) | Pass | 12 unit test files, 57 tests |
| 2026-11-21 | `npm run test:integration` (M2.8, first run) | Fail | Admin bootstrap test raced with MFA test inserting a profile; MFA tests exceeded 20s from Neon transaction latency |
| 2026-11-21 | `npm run test:integration` (M2.8, rerun) | Pass | 3 MFA tests passed against Neon dev branch with serial files and 60s MFA timeouts; 27 earlier tests passed, 1 skipped |
| 2026-11-21 | M2.8 production build | Pass | Four MFA routes compile as dynamic routes; Playwright discovery unchanged |
| 2026-11-22 | `npm ci` with npm 10 (CI parity) | Pass (after fix) | Initial failure: lockfile produced by npm 11 lacked nested `esbuild@0.28.2` peer entries required by npm 10; regenerated lock with npm 10 on Node 20 |
| 2026-11-22 | Full CI sequence | Pass | `npm ci` parity, `npm run lint`, `npm test` (12 files / 57 tests), integration in CI-like no-DB env (31 skipped), Playwright list, and `npm run build` all pass |
| 2026-11-22 | `npm test` (M2.9) | Pass | 13 unit test files, 63 tests; deletion validation, public mapping, and audit event fields covered |
| 2026-11-22 | `npm run test:integration` (M2.9, targeted) | Pass | 3 audit/deletion tests passed against Neon dev branch; request uniqueness, status read, and MFA audit covered |
| 2026-11-22 | `npm run test:integration` (M2.9, full suite) | Pass | 33 tests passed, 1 skipped against Neon dev branch; admin/MFA regression paths included |
| 2026-11-22 | M2.9 production build | Pass | Two new `/api/v1/account/deletion-requests*` routes compile as dynamic routes; Playwright discovery unchanged |
| 2026-11-22 | `npm test` (M2.10, first run) | Fail | New handler test used `req-123`, which fails the request ID pattern; no production code change |
| 2026-11-22 | `npm test` (M2.10, rerun) | Pass | 14 unit test files, 67 tests; handler error mapping, MFA rate-limit scopes, and deletion reason validation covered |
| 2026-11-22 | `npm run test:integration` (M2.10, first run) | Fail | New MFA audit test passed a promise from `generate()` instead of awaiting the TOTP string; no production code change |
| 2026-11-22 | `npm run test:integration` (M2.10, targeted) | Pass | 6 M2 negative-path tests passed against Neon dev branch after awaiting TOTP generation |
| 2026-11-22 | `npm run test:integration` (M2.10, full suite) | Pass | 39 tests passed, 1 skipped against Neon dev branch; M2.9 regression paths included |
| 2026-11-22 | M2.10 lint, Playwright list, and production build | Pass | `npm run lint`, `npm run test:e2e -- --list`, and `npm run build` pass; Playwright discovery unchanged |
| 2026-11-23 | `npm run lint` (M2.11) | Pass | 0 errors, 0 warnings |
| 2026-11-23 | `npm test` (M2.11) | Pass | 15 unit test files, 73 tests; shell navigation and session guard mapping covered |
| 2026-11-23 | `npm run test:integration` (M2.11, first run) | Timeout | Hit the 180s command timeout; no code change |
| 2026-11-23 | `npm run test:integration` (M2.11, rerun) | Pass | 39 tests passed, 1 skipped against Neon dev branch in 251.6s with a 600s timeout |
| 2026-11-23 | `npm run build` (M2.11) | Pass | `/dashboard`, `/provider/dashboard`, and `/admin` compile as dynamic routes |
| 2026-11-23 | `npm run test:e2e -- --list` (M2.11) | Pass | 1 Playwright health smoke test discovered; browsers not installed locally |
| 2026-11-23 | `npm run lint` (M2.12a) | Pass | 0 errors, 0 warnings |
| 2026-11-23 | `npm test` (M2.12a) | Pass | 16 unit test files, 78 tests; safe redirect, envelope errors, and JSON posting covered |
| 2026-11-23 | `npm run test:integration` (M2.12a) | Pass | 39 tests passed, 1 skipped against Neon dev branch in 232s with a 600s timeout |
| 2026-11-23 | `npm run build` (M2.12a) | Pass | `/login`, `/register`, `/logout`, and `/me` compile alongside the shell routes |
| 2026-11-23 | `npm run test:e2e -- --list` (M2.12a) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-23 | `npm run lint` (M2.12b) | Pass | 0 errors, 0 warnings |
| 2026-11-23 | `npm test` (M2.12b) | Pass | 16 unit test files, 81 tests; query token parsing covered |
| 2026-11-23 | `npm run test:integration` (M2.12b) | Pass | 39 tests passed, 1 skipped against Neon dev branch in 237s with a 600s timeout |
| 2026-11-23 | `npm run build` (M2.12b) | Pass | `/verify-email`, `/password-reset`, and `/password-reset/confirm` added to the route list |
| 2026-11-23 | `npm run test:e2e -- --list` (M2.12b) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-23 | `npm run lint` (M2.13) | Pass | 0 errors, 0 warnings |
| 2026-11-23 | `npm test` (M2.13) | Pass | 16 unit test files, 83 tests; MFA redirect and admin setup guard covered |
| 2026-11-23 | `npm run test:integration` (M2.13) | Pass | 39 tests passed, 1 skipped against Neon dev branch in 230s with a 600s timeout |
| 2026-11-23 | `npm run build` (M2.13) | Pass | `/mfa/enroll`, `/mfa/verify`, and `/mfa/recovery` added to the route list |
| 2026-11-23 | `npm run test:e2e -- --list` (M2.13) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-25 | `npm run lint` (M2.13 pre-push) | Pass | 0 errors, 0 warnings |
| 2026-11-25 | `npm test` (M2.13 pre-push) | Pass | 16 unit test files, 83 tests |
| 2026-11-25 | `npm run test:integration` (M2.13 pre-push) | Pass | 39 tests passed, 1 skipped against Neon dev branch in 234s with a 600s timeout |
| 2026-11-25 | `npm run build` (M2.13 pre-push) | Pass | Production build succeeds with the three MFA screens |
| 2026-11-25 | `npm run test:e2e -- --list` (M2.13 pre-push) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-25 | `npm run lint` (M3.1) | Pass | 0 errors, 0 warnings |
| 2026-11-25 | `npm test` (M3.1, first run) | Fail | Two new unit assertions expected wrong messages; test-only fixes |
| 2026-11-25 | `npm test` (M3.1, rerun) | Pass | 17 unit test files, 93 tests |
| 2026-11-25 | `npm run test:integration` (M3.1, first run) | Fail | Register assertion expected 200 instead of 201, and the locally bootstrapped super admin blocked `admin.test.js`; test fix plus temporary profile park |
| 2026-11-25 | `npm run test:integration` (M3.1, second run) | Fail | Setup hook hit the default 10s timeout; hook timeout raised to 60s |
| 2026-11-25 | `npm run test:integration` (M3.1, third run) | Fail | Audit actor key was wrong and non-admin code expectation was incorrect; production and test fixes |
| 2026-11-25 | `npm run test:integration` (M3.1, final run) | Pass | 44 tests passed, 1 skipped in 292s with a 600s timeout |
| 2026-11-25 | `npm run build` (M3.1) | Pass | Four new admin/catalog routes compile as dynamic routes |
| 2026-11-25 | `npm run test:e2e -- --list` (M3.1) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-25 | `npm run lint` (M3.2) | Pass | 0 errors, 0 warnings |
| 2026-11-25 | `npm test` (M3.2) | Pass | 18 unit test files, 103 tests |
| 2026-11-25 | `npm run test:integration` (M3.2) | Pass | 49 tests passed, 1 skipped in 309s with a 600s timeout; real super admin parked during the run |
| 2026-11-25 | `npm run build` (M3.2) | Pass | Three new application/profile routes compile as dynamic routes |
| 2026-11-25 | `npm run test:e2e -- --list` (M3.2) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-26 | `npm run lint` (M3.3) | Pass | 0 errors, 0 warnings |
| 2026-11-26 | `npm test` (M3.3, first run) | Fail | Two new unit assertions used the wrong audit field name and regenerated timestamp fixtures; test-only fixes |
| 2026-11-26 | `npm test` (M3.3, rerun) | Pass | 19 unit test files, 114 tests |
| 2026-11-26 | `npm run test:integration` (M3.3, first run) | Fail | `admin.test.js` failed because the local super admin was present; no code change |
| 2026-11-26 | `npm run test:integration` (M3.3, rerun) | Pass | 55 tests passed, 1 skipped in 370s with a 600s timeout; local super admin parked and restored |
| 2026-11-26 | `npm run build` (M3.3) | Pass | Three new public/provider/admin requirement routes compile as dynamic routes |
| 2026-11-26 | `npm run test:e2e -- --list` (M3.3) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-26 | `npm run lint` (M3.4) | Pass | 0 errors, 0 warnings |
| 2026-11-26 | `npm test` (M3.4) | Pass | 20 unit test files, 124 tests |
| 2026-11-26 | `npm run test:integration` (M3.4, first run) | Fail | New download test omitted route context; oversized upload returned 422; `admin.test.js` saw the local super admin |
| 2026-11-26 | `npm run test:integration` (M3.4, rerun) | Pass | 57 tests passed, 1 skipped in 395s with a 600s timeout; local super admin parked and restored |
| 2026-11-26 | `npm run build` (M3.4) | Pass | Three new upload/download routes compile as dynamic routes |
| 2026-11-26 | `npm run test:e2e -- --list` (M3.4) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-26 | `npm run lint` (M3.5) | Pass | 0 errors, 0 warnings |
| 2026-11-26 | `npm test` (M3.5, first run) | Fail | New validation module re-exported `parsePagination` without a local binding; fixed with an explicit import |
| 2026-11-26 | `npm test` (M3.5, rerun) | Pass | 21 unit test files, 131 tests |
| 2026-11-26 | `npx vitest run --config vitest.integration.config.js tests/integration/application-review.test.js` (first run) | Fail | Test passed a token string where a request was expected; test-only fix |
| 2026-11-26 | `npx vitest run --config vitest.integration.config.js tests/integration/application-review.test.js` (rerun) | Pass | 3 review endpoint tests |
| 2026-11-26 | `npm run test:integration` (M3.5) | Pass | 60 tests passed, 1 skipped in 439s with a 600s timeout; local super admin parked and restored |
| 2026-11-26 | `npm run build` (M3.5) | Pass | Four new admin review routes compile as dynamic routes |
| 2026-11-26 | `npm run test:e2e -- --list` (M3.5) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |
| 2026-11-27 | `npm run lint` (M3.6) | Pass | 0 errors, 0 warnings |
| 2026-11-27 | `npm test` (M3.6, first run) | Fail | Fake DB mutation stubs recorded updates only on `returning()`; test-only fixes |
| 2026-11-27 | `npm test` (M3.6, rerun) | Pass | 22 unit test files, 140 tests |
| 2026-11-27 | `npx vitest run --config vitest.integration.config.js tests/integration/provider-settings.test.js` | Pass | 5 provider settings endpoint tests |
| 2026-11-27 | `npm run test:integration` (M3.6) | Pass | 65 tests passed, 1 skipped in 463.7s with a 600s timeout; local super admin parked and restored |
| 2026-11-27 | `npm run build` (M3.6) | Pass | Four new provider service-area/availability routes compile as dynamic routes |
| 2026-11-27 | `npm run test:e2e -- --list` (M3.6) | Pass | 1 Playwright health smoke test discovered; browsers still not installed locally |

## Work log

Newest entries at the top. Do not delete history; append corrections instead.

### 2026-11-27 — M3.6 — Service areas and availability endpoints

- Changed: created `feat/m3.6-service-areas-availability` from `origin/main` after M3.5 was merged via PR #32 (`11bbb49`). Added `src/modules/providers/provider-settings.validation.js` and `provider-settings.service.js`, plus GET/POST `/api/v1/providers/me/service-areas`, DELETE `/api/v1/providers/me/service-areas/{id}`, GET/PATCH `/api/v1/providers/me/availability`, and PUT `/api/v1/providers/me/availability/weekly`. Service areas are scoped to the authenticated user's provider profile; a new primary area clears earlier primaries in a transaction and deletes outside the owner's scope return `SERVICE_AREA_NOT_FOUND`. Weekly slots are replaced in one transaction with HH:MM ordering, IANA timezone, and duplicate-window validation. Only approved providers may enable availability or replace weekly slots (`PROVIDER_NOT_APPROVED`, 403); disabling updates only `provider_profiles.is_available`, leaving slots and bookings untouched. Exception endpoints remain in M6.1 per the implementation plan. Added `tests/unit/provider-settings.test.js` and `tests/integration/provider-settings.test.js`. No schema, migration, spec, or ADR changes.
- Tests: lint pass; unit pass after fixing test-only fake DB mutation stubs (22 files / 140 tests); focused integration pass (5 tests); full integration pass (65 passed, 1 skipped in 463.7s with a 600s timeout); build pass with four new dynamic routes; Playwright discovery pass.
- Blockers: none. The full integration run required parking the local super admin again; its profile, MFA credential, and two audit links were snapshotted, restored, and verified field-for-field. The API spec still has no service-area endpoint payload schemas and OpenAPI remains an outstanding item; no ADR change. Committed on `feat/m3.6-service-areas-availability` and pushed to `origin`; no PR or merge was made.
- Next step: M3.7 — Qualification expiry enforcement and M3 tests (documents private, unapproved blocked).

### 2026-11-26 — M3.5 — Admin application review

- Changed: created `feat/m3.5-admin-application-review` from `origin/main` after M3.4 was merged via PR #31 (`7c154e5`). An initial branch from the old M3.4 feature branch was recreated from `origin/main` because no commits existed on it. Added `PROVIDER_APPLICATION_APPROVE` and `PROVIDER_APPLICATION_REJECT` audit actions, `src/modules/providers/application-review.validation.js` and `application-review.service.js`, and four MFA-gated admin routes: list with status filter/pagination, detail with applicant/skills/verification summaries, approve, and reject. Decisions only apply to pending applications, clear availability, set `approvedAt` on approval, and write audit metadata containing the optional note or required rejection reason. Detail exposes document presence but no object key or reviewer ID. Added `tests/unit/application-review.test.js` and `tests/integration/application-review.test.js`. No schema, migration, spec, or ADR changes.
- Tests: lint pass; unit pass (21 files / 131 tests); focused integration pass (3 tests) after fixing a test request helper; full integration pass (60 passed, 1 skipped); build pass with four new dynamic routes; Playwright discovery pass.
- Blockers: none. The full integration run required parking the local super admin again; its profile, MFA credential, and two audit links were snapshotted, restored, and verified. No commit was made on this phase branch.
- Next step: M3.6 — Service areas and availability endpoints.

### 2026-11-26 — M3.4 — R2 storage adapter

- Changed: created `feat/m3.4-r2-storage-adapter` from `origin/main` (`b3a73cd`) carrying the uncommitted M3.8 planning edits. Added `src/lib/db/schema/uploads.js` and migration `drizzle/0006_uneven_the_santerians.sql` plus its down migration; `uploads` records purpose, object key, MIME/size, status, owner, and related entity. Added `STORAGE_DRIVER` to config and `.env.example`, `src/infrastructure/storage/index.js` with manual SigV4 R2 presigning/HEAD checks plus a non-production mock, `src/modules/storage/uploads.validation.js` and `uploads.service.js`, and `POST /api/v1/uploads/presign`, `POST /api/v1/uploads/complete`, `GET /api/v1/files/{id}/download`. Presign is provider-owned and rate-limited; complete verifies object existence and atomically links `documentObjectKey`; download is owner-or-MFA-admin and does not return raw object keys as metadata. Reordered `src/lib/api/handler.js` typed-error mapping so `FILE_TOO_LARGE` keeps its 413 status. Added `tests/unit/storage.test.js` and `tests/integration/uploads.test.js`. No spec or ADR changes.
- Tests: lint pass; unit pass (20 files / 124 tests); integration pass after fixing the test route context and error status mapping (57 passed, 1 skipped); build pass with three new dynamic routes; Playwright discovery pass.
- Blockers: none. The first full integration run failed only in `admin.test.js` because a local super admin already exists; its profile, MFA credential, and two audit links were snapshotted, parked, restored, and verified. No commit was made on this phase branch.
- Next step: M3.5 — Admin application review with audited decisions.

### 2026-11-26 — M3.8 planning — Role dashboard data and forms

- Changed: added `M3.8` to `docs/04-implementation-plan.md` §3 and mirrored the same phase into `docs/ai_service_marketplace_complete_documentation.md`. Updated this file's phase list and M3 milestone note with the planned phase. Scope: customer/provider/admin dashboards consume existing M1–M3 data; provider application and admin category/skill/requirement forms call existing endpoints; tasks, offers, and review queues remain explicit placeholders. No UI code, API endpoints, schema, migration, or ADR changes.
- Tests: not applicable; documentation-only change.
- Blockers: none. M3.8 is queued after M3.7; do not start it before M3.4–M3.7 pass. No new backend endpoints are planned for this phase.
- Next step: continue M3.4 — R2 storage adapter (presign, complete, authorized download).

### 2026-11-26 — M3.3 — Verification requirements and records

- Changed: created `feat/m3.3-verification-records` from `origin/main` after M3.2 was merged via PR #29. Added `src/modules/providers/verification.validation.js` and `verification.service.js`, `GET /api/v1/categories/{id}/requirements` with active-only filtering and pagination, MFA-gated `POST /api/v1/admin/verification-requirements` with duplicate conflict and an audited admin action, and `GET /api/v1/providers/me/verifications` with requirement details and no private document key or reviewer ID. Added `AUDIT_ACTIONS.VERIFICATION_REQUIREMENT_CREATE`. Added `tests/unit/verification.test.js` and `tests/integration/verification.test.js`. No schema, migration, or spec changes.
- Tests: lint pass; unit pass after fixing two assertion mistakes (19 files / 114 tests); integration pass after parking the local super admin (55 passed, 1 skipped); build pass with three new dynamic routes; Playwright discovery pass.
- Blockers: none. The first full integration run failed only in `admin.test.js` because a local super admin already exists; its profile, MFA credential, and two audit links were snapshotted, parked, restored, and verified field-for-field. Committed on `feat/m3.3-verification-records` and pushed to `origin`; no PR or merge was made.
- Next step: M3.4 — R2 storage adapter for presign, complete, and authorized short-lived download.

### 2026-11-25 — M3.2 — Provider application submit and status

- Changed: created `feat/m3.2-provider-applications` from `origin/main` after M3.1 was merged via PR #27. Added `requireVerifiedCustomer()` and `assertVerifiedUser()` to `src/modules/auth/authorization.js`, added `src/modules/providers/provider-applications.validation.js` and `provider-applications.service.js`, and created `POST /api/v1/provider-applications`, `GET /api/v1/provider-applications/me`, and `GET /api/v1/providers/me`. A verified email is required to submit; active applications return `APPLICATION_EXISTS`; rejected applications may resubmit as pending with a fresh timestamp and availability reset; own reads return `PROVIDER_PROFILE_NOT_FOUND` when no profile exists. Added `tests/unit/provider-applications.test.js` and `tests/integration/provider-applications.test.js`. No schema, migration, or spec changes.
- Tests: lint pass; unit pass (18 files / 103 tests); integration pass (49 passed, 1 skipped); build pass with three new dynamic routes; Playwright discovery pass.
- Blockers: none. `admin.test.js` still assumes no pre-existing admin profile, so the local super admin was parked with its MFA credential and restored afterward; decryption, confirmation, and two audit links were verified. No commit was made on this phase branch.
- Next step: M3.3 — verification requirements and provider verification records.

### 2026-11-25 — M3.1 — Categories/skills reads and admin management

- Changed: created `feat/m3.1-categories-skills` from `origin/main` after the M2.13 merge. Added `src/modules/categories/catalog.service.js` and `catalog.validation.js`, public `GET /api/v1/categories` and `GET /api/v1/categories/{id}/skills` with active-only filtering and pagination metadata, and MFA-gated `POST/PATCH /api/v1/admin/categories` and `POST/PATCH /api/v1/admin/skills` with validation, duplicate conflict mapping, 404 handling, deactivation instead of deletion, and audit records. Added `tests/unit/catalog.test.js` and `tests/integration/catalog.test.js`. No schema, migration, or spec changes.
- Tests: lint pass; unit pass after fixing two assertion messages (17 files / 93 tests); integration pass after fixing register status, hook timeout, audit actor key, and non-admin code expectations (44 passed, 1 skipped); build pass with four new dynamic routes; Playwright discovery pass.
- Blockers: none. `admin.test.js` assumes no pre-existing admin profile, so the locally bootstrapped super admin was temporarily parked with its MFA credential and restored afterward; decryption and audit links were verified. Committed on `feat/m3.1-categories-skills` and pushed to `origin`; no PR or merge was made.
- Next step: M3.2 — provider application submit and own-status endpoints.

### 2026-11-23 — M2.13 — Admin MFA screens

- Changed: created `feat/m2.13-admin-mfa-screens` from the pushed M2.12 commit; `origin/main` now contains the M2.11 and M2.12 merge commits. Added `requireAdminSetupSession()` and an `MfaRequiredError` redirect to `/mfa/verify` in `src/lib/ui/session-guard.js`, so the existing MFA-verified admin layout no longer blocks enrollment or verification. Added a Security link to the admin navigation. Created `src/components/admin/mfa-forms.js` with enrollment, authenticator verification, and one-time recovery-code forms over the existing endpoints. Created `src/app/(admin-mfa)/mfa/layout.js` plus `/mfa/verify`, `/mfa/enroll`, and `/mfa/recovery` pages that require an admin profile but not prior MFA. Non-admin users are redirected home and unauthenticated users to `/login`; no email-only recovery path was added. Updated `tests/unit/ui-shell.test.js`. No API routes, schema, spec, or ADR changes.
- Tests: `npm run lint` pass; `npm test` pass (16 files / 83 tests); `npm run test:integration` pass (39 passed, 1 skipped) against Neon dev branch in 230s; `npm run build` pass with `/mfa/enroll`, `/mfa/verify`, and `/mfa/recovery`; `npm run test:e2e -- --list` pass (1 health smoke test, browsers still not installed locally).
- Blockers: none. MFA setup screens require an active admin profile by design. This completes M2. Pre-push checks rerun on 2026-11-25 all passed; `.env.example` `ADMIN_EMAIL` restored to a blank example before commit. Committed on `feat/m2.13-admin-mfa-screens` and pushed to `origin`.
- Next step: M3.1 — public category/skill reads and admin management.

### 2026-11-23 — M2.12b — Auth screens: verification and reset

- Changed: continued on `feat/m2.12a-auth-screens` because M2.12a remained uncommitted. Added shared `src/components/auth/form-ui.js` and `src/components/auth/verification-forms.js` with request/confirm flows for email verification and password reset. Added `src/app/(auth)/verify-email/page.js`, `src/app/(auth)/password-reset/page.js`, and `src/app/(auth)/password-reset/confirm/page.js`, with token-aware confirm screens. Added `readSearchParam()` to `src/lib/ui/auth-forms.js` and coverage in `tests/unit/auth-forms.test.js`. Updated `src/components/auth/account-forms.js` with a password-reset link and `src/app/(customer)/me/page.js` with a verification link for unverified accounts. Reused shared form primitives in the existing account forms. No new API routes or spec decisions were added.
- Tests: `npm run lint` pass; `npm test` pass (16 files / 81 tests); `npm run test:integration` pass (39 passed, 1 skipped) against Neon dev branch in 237s; `npm run build` pass with `/verify-email`, `/password-reset`, and `/password-reset/confirm`; `npm run test:e2e -- --list` pass (1 health smoke test, browsers still not installed locally).
- Blockers: none. The branch still contains uncommitted M2.12a and M2.12b work and depends on `feat/m2.11-ui-shell`; merge M2.11 first. No commit was made on this phase branch.
- Next step: M2.13 — build admin MFA enroll/confirm/verify/recovery screens using the existing endpoints.

### 2026-11-23 — M2.12a — Auth screens: account access

- Changed: created `feat/m2.12a-auth-screens` from `feat/m2.11-ui-shell` because M2.11 has not merged yet, and split M2.12 into M2.12a (account access) and M2.12b (verification/reset) in this file. Added `src/lib/ui/auth-forms.js` with safe `next`-path resolution, API envelope error extraction, and JSON posting. Added `src/components/auth/account-forms.js` with client `LoginForm`, `RegisterForm`, and `LogoutForm` using the existing auth endpoints. Added `src/app/(auth)/layout.js`, `src/app/(auth)/login/page.js`, `src/app/(auth)/register/page.js`, `src/app/(auth)/logout/page.js`, and `src/app/(customer)/me/page.js`. Updated `src/app/page.js` with links to sign in/registration and `src/components/app-shell.js` with a sign-out link for authenticated users. Added `tests/unit/auth-forms.test.js`. No new API routes or spec decisions were added.
- Tests: `npm run lint` pass; `npm test` pass (16 files / 78 tests); `npm run test:integration` pass (39 passed, 1 skipped) against Neon dev branch in 232s; `npm run build` pass with `/login`, `/register`, `/logout`, and `/me`; `npm run test:e2e -- --list` pass (1 health smoke test, browsers still not installed locally).
- Blockers: none. M2.12b screens remain for email verification and password reset. This branch depends on `feat/m2.11-ui-shell`; merge M2.11 first. No commit was made on this phase branch.
- Next step: M2.12b — build email verification request/confirm and password reset request/confirm screens using the existing endpoints.

### 2026-11-23 — M2.11 — UI shell

- Changed: created `feat/m2.11-ui-shell` from `origin/main`. Added `src/components/app-shell.js` with a shared responsive header/nav/main/footer using existing CSS design tokens, and `src/lib/ui/navigation.js` with per-area links. Added `src/lib/ui/session-guard.js` with an async cookie adapter over the existing auth services; customer/provider layouts require an active session and the admin layout requires an MFA-verified admin profile, redirecting unauthenticated visitors to `/login` and other authorization failures to `/`. Added `src/app/(customer)/layout.js`, `src/app/(customer)/dashboard/page.js`, `src/app/(provider)/layout.js`, `src/app/(provider)/provider/dashboard/page.js`, `src/app/admin/layout.js`, and `src/app/admin/page.js`. Added `tests/unit/ui-shell.test.js` for nav config, redirect mapping, and anonymous guard redirect. No auth screens or spec decisions were added.
- Tests: `npm run lint` pass; `npm test` pass (15 files / 73 tests); `npm run test:integration` first run timed out at 180s with no code change, rerun pass (39 passed, 1 skipped) against Neon dev branch in 251.6s with a 600s timeout; `npm run build` pass with `/dashboard`, `/provider/dashboard`, and `/admin` dynamic; `npm run test:e2e -- --list` pass (1 health smoke test, browsers still not installed locally).
- Blockers: none. The `(auth)` route group remains empty until M2.12; the guard redirects to `/login`, which will be implemented in that phase. Admin MFA enrollment screens remain M2.13. No commit was made on this phase branch.
- Next step: M2.12 — build auth screens for register/login/logout/me, email verification, and password reset using the existing endpoints.

### 2026-11-22 — M2.10 — M2 positive and negative tests

- Changed: created `feat/m2.10-m2-tests` from `origin/main` after M2.9 was merged. Added `tests/unit/handler.test.js` for 422 validation, duplicate-email 409 mapping, typed authorization error pass-through, and 500 sanitization; added MFA scopes to `tests/unit/rate-limit.test.js`; added deletion reason type/whitespace cases to `tests/unit/audit-deletion.test.js`. Added `tests/integration/m2-negative-paths.test.js` covering non-admin MFA route rejection, account-status checks before MFA setup, failed/successful MFA verify audit behavior, unauthenticated deletion endpoints, cross-user deletion status isolation, reason-free audit metadata, duplicate deletion no extra audit, and denied admin invitation with no audit row. No production code changed.
- Tests: `npm run lint` pass; `npm test` pass after rerun (14 files / 67 tests); targeted `npm run test:integration` pass (6 negative-path tests); full `npm run test:integration` pass (39 tests passed, 1 skipped) against Neon dev branch; `npm run test:e2e -- --list` pass; `npm run build` pass. First unit run failed because the test request ID was shorter than the configured 8-character minimum; first integration run failed because TOTP generation was not awaited. Both were test-only fixes.
- Blockers: none. CI still has no `DATABASE_URL`, so integration tests remain skipped there by design; local Neon runs cover the DB paths.
- Next step: M2.11 — build the UI shell with route groups, navigation, session guard, and responsive design tokens.

### 2026-11-22 — M2.9 — Audit log and account deletion requests

- Changed: created `feat/m2.9-audit-deletion` from `origin/main` after M2.8 was merged. Added `src/modules/audit/audit.service.js` with a shared `recordAuditEvent` and an admin-actor helper, plus action constants for admin bootstrap/invite, MFA enroll/confirm/verify/recovery, and deletion requests. Added `src/modules/users/deletion.service.js` with one-pending-request enforcement, public status mapping, and an atomic audit write. Added `POST /api/v1/account/deletion-requests` (201, optional trimmed reason, 409 `DELETION_REQUEST_PENDING`) and `GET /api/v1/account/deletion-requests/current` (latest request or `null`). Wrote audit events inside the existing admin bootstrap/invite and MFA service transactions; no secrets, codes, or reason text enter audit metadata. Extended auth validation with an optional JSON body and deletion reason rules. No schema or migration change was needed; the M1.4 tables already exist.
- Tests: `npm run lint` pass; `npm test` pass (13 files / 63 tests); targeted `npm run test:integration` pass (3 audit/deletion tests); full `npm run test:integration` pass (33 tests passed, 1 skipped) against Neon dev branch; `npm run test:e2e -- --list` pass; `npm run build` pass.
- Blockers: none. Audit events for MFA and admin actions are written with a nullable `request_id` because services do not receive HTTP context; deletion-request events include the request ID. No admin audit-read endpoint exists because the API specification defines none; no account data is deleted by the request, only queued for later review. Historical M2.8 note saying MFA is unaudited is superseded by this phase.
- Next step: M2.10 — expand M2 positive/negative tests across authorization, recovery, deletion, and audit paths.

### 2026-11-22 — M2.8 merge — CI dependency error

- Changed: regenerated `package-lock.json` with npm 10 on Node 20 after adding `otplib`; added the nested `vitest/node_modules/esbuild@0.28.2` and `@esbuild/*` peer entries that npm 11 omitted. No application code changed. Recorded that the local `main` ref was stale (at `cbd9e76`) while `origin/main` included M2.2–M2.7; compared against `origin/main` instead.
- Tests: `npm ci --dry-run` with npm 10 / Node 20 pass after fix (failed before with `Missing: esbuild@0.28.2 from lock file`); `npm run lint` pass; `npm test` pass (12 files / 57 tests); `npm run test:integration` pass in a CI-like copy without `.env` (31 DB tests skipped); `npm run test:e2e -- --list` pass; `npm run build` pass.
- Blockers: none for CI install. Local integration runs are slow because the untracked `.env` points at Neon; CI has no `DATABASE_URL` and skips them by design. Regenerate this lockfile with npm 10 (or run `npm ci` on Node 20) whenever dependencies change, since npm 11 writes an npm 10-incompatible lock tree.
- Next step: push the regenerated `package-lock.json` to the M2.8 PR, rerun `ci/verify`, then merge and start M2.9 — audit logging and account deletion requests.

### 2026-11-21 — M2.8 — Admin TOTP MFA

- Changed: added `otplib` dependency, migration `drizzle/0005_session_mfa_verified_at.sql` with a reviewed `.down.sql`, and `src/modules/auth/mfa-crypto.js` (AES-256-GCM secret encryption keyed from `SESSION_SECRET`, SHA-256 recovery-code hashes, one-time code formatting). Added `src/modules/auth/mfa.service.js` with enroll/confirm/verify/recover, encrypted secret storage, single-use recovery codes, and transactional updates to `admin_mfa_credentials`, `admin_profiles`, and `user_sessions`. Added `MfaRequiredError`, `assertMfaEnrolled`, and `assertMfaVerified` to the authorization core, plus `requireMfaAdminProfile` for future admin endpoints; `requireAdminProfile` remains for MFA setup. Added `POST /auth/mfa/enroll`, `/confirm`, `/verify`, and `/recovery` with validation and rate limits. Password reset still revokes all sessions, so a new email/password session cannot access admin endpoints until TOTP or a recovery code is supplied.
- Tests: `npx drizzle-kit check` pass; `npm run db:migrate` pass on Neon dev branch; `npm run lint` pass; `npm test` pass (12 files / 57 tests); `npm run test:integration` pass after rerun (30 tests passed, 1 skipped); `npm run test:e2e -- --list` pass; `npm run build` pass.
- Blockers: none. The first integration run failed because integration files ran in parallel against shared global state (single super-admin constraint) and because Neon transaction latency exceeded the 20s default; integration files now run serially and the three MFA tests allow 60s. `SESSION_SECRET` is absent from the local `.env`, so MFA tests use a test-only value; production env validation already requires it. No audit log is written for MFA yet (M2.9).
- Next step: M2.9 — audit logging for privileged actions and account deletion request endpoints.

### 2026-11-21 — M2.7 — Admin bootstrap and profiles

- Changed: added partial unique index `admin_profiles_single_super_admin_unique` in `src/lib/db/schema/users.js` and migration `drizzle/0004_admin_super_admin_unique.sql` with a reviewed `.down.sql`. Added `src/modules/admin/admin.service.js` with `bootstrapInitialSuperAdmin` (requires an existing active, verified user; refuses when any admin profile exists), `inviteAdmin` (super-admin-only, creates regular admins only), typed errors, and public profile mapping. Added `assertAdmin`/`assertSuperAdmin` to `src/modules/auth/authorization.js` and `requireAdminProfile` in `src/modules/admin/admin-authorization.js`. Added `scripts/bootstrap-admin.js` plus a small `@/` alias resolver so the CLI can import app modules, with `admin:bootstrap` in `package.json` and operator-only variables in `.env.example`. No public admin-creation endpoint was added. Fixed a pre-existing flaky rate-limit integration test by pinning `Date` during the 429 case.
- Tests: `npx drizzle-kit check` pass; `npm run db:migrate` pass on Neon dev branch; `npm run lint` pass; `npm test` pass (11 files / 49 tests); `npm run test:integration` pass after rerun (27 tests passed, 1 skipped); CLI guard check pass; `npm run test:e2e -- --list` pass; `npm run build` pass.
- Blockers: none. The first integration run failed because the rate-limit 429 test crossed a fixed-window boundary; the test now pins the clock. Admin MFA enforcement is deferred to M2.8; until then `requireAdminProfile` checks account status and admin role only. Additional admins are created only through the service by an existing super admin; no invite-token/email flow exists yet.
- Next step: M2.8 — TOTP MFA enroll/confirm/verify/recovery codes, with no email-only bypass.

### 2026-11-21 — M2.6 — Authorization core

- Changed: added `inspectSession` in `src/modules/auth/auth.service.js` so a valid session reports `active`, `suspended`, `deleted`, `missing`, or `anonymous` while `getCurrentSession` keeps its existing active-only contract. Added `src/modules/auth/authorization.js` with `AuthorizationError`, `AuthenticationError`, `AccountStatusError`, `ForbiddenError`, `requireAuthenticatedUser`, `assertOwnedBy`, `assertCustomerOwnsTask`, and `assertProviderOwnsOffer`. `src/lib/api/handler.js` now maps typed authorization errors to their statuses. `GET /auth/me` and `POST /auth/email-verification` use the shared guard instead of local session checks; logout remains intentionally available to any valid session holder. Updated the existing suspended-user route test to expect 403 `ACCOUNT_SUSPENDED` instead of 401.
- Tests: `npm run lint` pass; `npm test` pass (10 files / 45 tests); `npm run test:integration` pass (24 tests passed, 1 skipped); `npm run test:e2e -- --list` pass; `npm run build` pass.
- Blockers: none. Deleted accounts return 403 `ACCOUNT_UNAVAILABLE`; suspended accounts return 403 `ACCOUNT_SUSPENDED`; missing/invalid sessions still return 401. Admin permission checks are deferred to M2.7, and task/offer participation checks beyond direct ownership to M5.
- Next step: M2.7 — controlled super-admin bootstrap, invite-only admin profiles, and admin authorization checks.

### 2026-11-21 — M2.5 — Shared DB-backed rate limiting

- Changed: added `src/lib/db/schema/rate-limits.js` with `rate_limit_counters` (scope, subject, `window_start`, count, unique index on all three plus a window-start index), re-exported from the schema index, and generated `drizzle/0003_rate_limit_counters.sql` with a reviewed `.down.sql`. Added `src/lib/api/rate-limit.js` with endpoint-specific limits, fixed-window math, atomic `ON CONFLICT` increments, client-IP extraction, and `RateLimitError`; `handler.js` maps it to a sanitized 429 with `Retry-After`. Wired per-subject and per-IP checks into register, login, password-reset request/confirm, and email-verification request/confirm routes. Added unit tests for windows, evaluation, IP parsing, config, and errors plus integration tests for counter semantics, route 429, and validation bypass.
- Tests: `npx drizzle-kit check` pass; `npm run db:migrate` pass on Neon dev branch; `npm run lint` pass; `npm test` pass when isolated (9 files / 40 tests — one bcrypt test timed out in a parallel run from load, no code change); `npm run test:integration` pass (19 tests passed, 1 skipped); `npm run test:e2e -- --list` pass; `npm run build` pass.
- Blockers: none. Counters are fixed-window and need periodic cleanup (deferred to M9 job work); OTP/MFA endpoints do not exist yet and will reuse this middleware in M2.8/M7.1. Down migration SQL was authored and reviewed but not executed against the shared dev branch.
- Next step: M2.6 — build the authorization core (account-status guard and resource-ownership helpers) with policy tests.

### 2026-11-21 — M2.4 — Password reset

- Changed: added `POST /api/v1/auth/password-reset` (public, generic `202`) and `POST /api/v1/auth/password-reset/confirm` (token + new password). Added `src/modules/auth/password-reset.service.js` (1-hour hashed single-use tokens, prior-token invalidation, transactional consume + password hash update + `revokeAllUserSessions`), extended `auth.validation.js` and `handler.js` (`INVALID_PASSWORD_RESET_TOKEN` → generic `400`), and added a `sendPasswordResetEmail` stub that never logs or returns the token. Added unit validation tests and integration tests for unknown/suspended emails, hashed storage, expiry, reuse, session revocation, and old-password rejection.
- Tests: `npm run lint` pass; `npm test` pass (8 files / 34 tests); `npm run test:integration` pass locally with Neon (16 tests passed, 1 skipped); `npm run test:e2e -- --list` pass (1 test); `npm run build` pass with two new dynamic reset routes.
- Blockers: none. Email delivery is still a stub; rate limiting is deferred to M2.5; CI still skips integration tests because it has no Postgres service. Password reset does not alter admin MFA credentials, so MFA remains mandatory once M2.8 lands.
- Next step: M2.5 — implement shared DB-backed rate limiting middleware for login/register/reset/OTP.

### 2026-11-20 — M2.3 — Email verification tokens and endpoints

- Changed: added `POST /api/v1/auth/email-verification` (authenticated, generic `202`) and `POST /api/v1/auth/email-verification/confirm` (token in JSON body). Added `src/modules/auth/verification-token.js` (32-byte URL-safe token plus SHA-256 hash), `src/modules/auth/verification.service.js` (24-hour expiry, hashed single-use storage, old-token invalidation, atomic consume, `emailVerifiedAt` update), and `src/infrastructure/email/stub.js` (no-op delivery stub that never logs or returns the token). Extended `auth.validation.js` for confirm tokens and `handler.js` to map `INVALID_VERIFICATION_TOKEN` to a generic `400`. Added unit tests for token generation/validation and integration tests for hashed storage, one-time use, expiry, malformed tokens, and unauthenticated requests.
- Tests: `npm run lint` pass; `npm test` pass (8 files / 30 tests); `npm run test:integration` pass locally with Neon (12 tests passed, 1 skipped); `npm run test:e2e -- --list` pass (1 test); `npm run build` pass with two new dynamic verification routes.
- Blockers: none. The email sender is a stub; Resend/email delivery wiring remains for later infrastructure work. Rate limiting is deferred to M2.5, and CI still skips integration tests because it has no Postgres service.
- Next step: M2.4 — implement generic password reset request/confirm with hashed single-use tokens and session revocation on password change.

### 2026-11-20 — M2.2 — Auth endpoints and secure cookies

- Changed: added `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me` route handlers. Added `src/modules/auth/auth.validation.js` (JSON body and field validation), `src/modules/auth/auth.service.js` (registration, login, current-session lookup, logout, generic invalid-credentials handling, suspended/deleted user rejection), `src/modules/auth/session-cookie.js` (HTTP-only `lax` cookie with `secure` in production and 7-day max age), and `src/lib/api/handler.js` (request ID plus validation/auth/duplicate error mapping to the API envelope). Added `toPublicUser` to `src/modules/users/users.service.js` so password hashes are never serialized. Added unit tests for validation/cookies and integration tests for register → me → logout, login success/failure, duplicate/invalid payloads, suspended users, and unauthenticated logout.
- Tests: `npm run lint` pass; `npm test` pass (7 files / 25 tests); `npm run test:integration` pass locally with Neon (9 tests passed, 1 skipped); `npm run test:e2e -- --list` pass (1 test); `npm run build` pass with four new dynamic auth routes.
- Blockers: none. Rate limiting is deferred to M2.5, email verification to M2.3, and CSRF hardening beyond `SameSite=Lax` to later security work. CI still skips integration tests because it has no Postgres service; they were run locally against the Neon dev branch.
- Next step: M2.3 — add hashed single-use email verification tokens and request/confirm endpoints.

### 2026-11-20 — M2.1 — Users and sessions data layer

- Changed: added exact `bcryptjs@3.0.3` dependency and regenerated `package-lock.json` with npm 10. Added `src/modules/auth/password.js` (bcrypt cost 12, plaintext never stored), `src/modules/auth/session-token.js` (32-byte URL-safe token plus SHA-256 hash), `src/modules/auth/sessions.service.js` (create/find/touch/revoke helpers with 7-day TTL), and `src/modules/users/users.service.js` (normalized email, create/find/update helpers, `DuplicateEmailError` that unwraps Drizzle query errors). Added unit tests for password/token/email helpers and integration tests for duplicate email prevention, password rotation, session lookup, revocation, and expiry. Removed the unused dummy `DATABASE_URL` from `.github/workflows/ci.yml` after the merged lockfile fix exposed a second CI failure in integration tests; raised the integration test timeout to 20s in `vitest.integration.config.js`.
- Tests: `npm ci` with npm 10 pass; `npm run lint` pass; `npm test` pass (5 files / 16 tests); `npm run test:integration` pass locally with Neon (4 tests, 1 skipped); `npm run test:e2e -- --list` pass (1 test); `npm run build` pass.
- Blockers: none. CI has no Postgres service, so integration tests skip there; they are run locally against the Neon dev branch until M9.4 adds a real CI database. No secrets were added; `.env` remains ignored.
- Next step: M2.2 — implement register, login, logout, and `GET /auth/me` with secure HTTP-only cookies using these helpers.

### 2026-11-20 — M1.11 — Fix CI `npm ci` failure

- Changed: regenerated `package-lock.json` with `npm@10.9.3` (`npx npm@10.9.3 install --package-lock-only --ignore-scripts`). The npm 11-generated lockfile placed `esbuild@0.28.2` under `tsx`, while Node 20 CI (npm 10) resolves it under `vitest`, so `npm ci` failed with `EUSAGE: Missing: esbuild@0.28.2 from lock file` and all later steps were skipped.
- Tests: reproduced with `npx npm@10.9.3 ci` before the fix (failure) and after (pass); `npm ci` with npm 11 also passes; `npm run lint`, `npm test`, `npm run test:integration`, `npm run test:e2e -- --list`, and `npm run build` all pass after the fix.
- Blockers: none. CI check logs could not be downloaded without repo admin rights; failure step was identified from the public Actions jobs API.
- Next step: push the regenerated lockfile to the PR branch and rerun the `CI / verify (pull_request)` check, then merge and continue with M2.1.

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
