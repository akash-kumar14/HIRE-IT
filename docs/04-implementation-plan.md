# SPEC-004 — Implementation Plan

## 1. Objective

Build the marketplace as a modular monolith using Next.js (App Router, JavaScript/JSX), PostgreSQL, Drizzle ORM, and approved external-service adapters. Work feature by feature; each feature needs acceptance criteria, automated tests, and a review before it is considered done.

## 2. Repository structure

```text
service-marketplace/
├── drizzle/
│   ├── 0000_*.sql
│   ├── 0001_*.sql
│   └── meta/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   ├── (provider)/
│   │   ├── admin/
│   │   └── api/v1/
│   ├── modules/
│   │   ├── auth/ users/ providers/ categories/ tasks/
│   │   ├── matching/ offers/ bookings/ messaging/
│   │   ├── payments/ notifications/ reviews/ disputes/ support/
│   ├── infrastructure/
│   │   ├── ai/ storage/ email/ payments/ jobs/
│   ├── lib/
│   │   ├── api/ config/ db/
│   │   │   └── db/schema/  (users, providers, tasks, bookings,
│   │   │                    messaging, payments, reviews, disputes, jobs)
│   │   └── observability/
│   ├── components/
│   └── styles/
├── tests/unit/
├── tests/integration/
├── tests/e2e/
├── .github/workflows/
├── drizzle.config.js
├── .env.example
├── package.json
└── README.md
```

Schema files are grouped by domain and maintained by the same solo developer. Module conventions, as needed: schemas, service, repository, policy, state machine, and tests. Route handlers should remain thin.

Module conventions, as needed: schemas, service, repository, policy, state machine, and tests. Route handlers should remain thin.

## 3. Milestones and phases

### Task sizing rule

Every phase (e.g. `M2.4`) is one agent task, sized to finish within roughly 80% of a single context window:

- One domain slice, one testable outcome, normally at most ~10 changed files.
- Read only the SPEC sections and existing files the phase needs; do not load the whole repository.
- Finish and verify a phase before starting the next. Do not parallelize phases.
- If a phase exceeds the budget (many files, deep refactor, unclear scope), split it into `M2.4a` / `M2.4b` and record the split in `docs/progress.md`.
- Each phase ends with tests run and a `docs/progress.md` update, even if incomplete.

### M1 — Foundation

Deliver: Next.js JavaScript/JSX scaffold, lint checks, Neon development DB, Drizzle schema/migration/seed, config validation, CI, health check.
Acceptance: clean checkout runs from docs; CI passes; migrations run explicitly; no secrets committed.

Phases:
- `M1.1` Repository scaffold: `package.json`, Next.js 16 App Router JS/JSX, Tailwind v4, base layout, lint script, `.gitignore`, `.env.example`.
- `M1.2` Config and API base: env validation, request ID, response envelope helper, `GET /api/v1/health`.
- `M1.3` Database plumbing: `drizzle.config.js`, DB client, schema index, explicit migration command.
- `M1.4` Schema: users, sessions, admin tables, audit logs, tokens.
- `M1.5` Schema: providers, categories, skills, service areas, verification tables.
- `M1.6` Schema: tasks, requirements, locations, attachments, match runs/candidates, offers, assignments.
- `M1.7` Schema: availability, exceptions, bookings, completion confirmations, messaging, notifications.
- `M1.8` Schema: payments, refunds, payouts, ledger, commission, idempotency, reconciliation.
- `M1.9` Schema: reviews, moderation, disputes, support, jobs, AI usage, settings.
- `M1.10` Migrations and seed: generate SQL, custom constraint SQL, seed categories/skills, verify up/down.
- `M1.11` Test and CI harness: Vitest unit/integration config, Playwright placeholder, GitHub Actions, production build.

### M2 — Authentication and authorization

Deliver: registration, login, custom sessions (`user_sessions`), email verification, reset, account deletion requests, initial super-admin bootstrap, TOTP MFA, policies, audit log, authenticated UI shell, auth screens, and admin MFA screens.
Acceptance: duplicate email blocked; suspended users restricted; admin MFA required; email-only recovery cannot bypass admin MFA; unauthorized access tests pass; reset tokens expire and are single-use; UI uses design tokens and existing endpoints only.

Phases:
- `M2.1` Users/sessions data layer: password hashing (`bcryptjs`), session create/revoke helpers, unique normalized email.
- `M2.2` Register, login, logout, `GET /auth/me` with secure cookies.
- `M2.3` Email verification: hashed single-use tokens, request/confirm endpoints, email job stub.
- `M2.4` Password reset: generic responses, expiry, single use, session revocation on change.
- `M2.5` Shared DB-backed rate limiting middleware for login/register/reset/OTP.
- `M2.6` Authorization core: account-status guard, resource-ownership helpers, policy tests.
- `M2.7` Admin bootstrap and admin profiles: controlled initial super-admin, invite-only creation.
- `M2.8` TOTP MFA: enroll, confirm, verify, recovery codes; email recovery cannot bypass MFA.
- `M2.9` Audit log and account deletion requests (create + current status).
- `M2.10` M2 test suite: positive and negative authorization/recovery paths.
- `M2.11` UI shell: customer/provider/admin route groups, shared navigation, session guard, responsive layout using design tokens.
- `M2.12` Auth screens: register, login, logout, current profile, email verification request/confirm, password reset request/confirm.
- `M2.13` Admin MFA screens: enroll, confirm, verify, recovery codes; admin-only access and no email-only bypass.

### M3 — Provider applications and verification

Deliver: applications, profiles, skills/categories, qualification requirements, private evidence uploads, admin decisions, service areas, availability.
Acceptance: unapproved providers cannot accept tasks; qualifications enforced; documents private; expired qualifications restrict affected capabilities; decisions audited.

Phases:
- `M3.1` Categories/skills: public reads, admin create/update, deactivation instead of deletion.
- `M3.2` Provider application submit and own-status endpoints.
- `M3.3` Verification requirements and provider verification records.
- `M3.4` R2 storage adapter: presign, complete, authorized short-lived download.
- `M3.5` Admin application review: list/detail/approve/reject with audited reasons.
- `M3.6` Service areas and availability toggle/weekly schedule endpoints.
- `M3.7` Qualification expiry enforcement and M3 tests (documents private, unapproved blocked).

### M4 — AI-assisted task creation

Deliver: Gemini adapter, task form, strict output validation, usage tracking, limits, customer approval, manual fallback.
Acceptance: Hindi/English descriptions; preserve original; no publication without approval; one constrained correction retry then fallback; AI cannot override business rules; bounded usage.

Phases:
- `M4.1` Gemini adapter: provider-neutral interface, timeout, mock, structured output parsing.
- `M4.2` `POST /tasks/interpret`: prompt, schema validation, reject invalid shapes.
- `M4.3` Task draft create/update/read; store original description separately from interpretation.
- `M4.4` State machine service and publish flow with mandatory customer approval.
- `M4.5` AI usage records, per-user limits, rate limiting.
- `M4.6` One constrained correction retry, then manual fallback path.
- `M4.7` M4 tests: Hindi/English input, invalid AI output, no publish without approval.

### M5 — Matching and offers

Deliver: eligibility filters, geographic matching (ADR-113), versioned ranking, batched notifications, offers, selection, atomic assignment.
Acceptance: ineligible providers excluded; remote tasks have no distance penalty; location privacy; concurrent acceptance safe; no-offer scenario preserves customer control; ranking traceable.

Phases:
- `M5.1` Resolve ADR-113 (PostGIS vs numeric + haversine) with Neon verification; implement geo query helper.
- `M5.2` Hard eligibility filters: approval, skills, qualification, service area.
- `M5.3` Ranking v1 with stored weights and per-candidate score breakdown.
- `M5.4` Match runs/candidates persistence and batched notification job.
- `M5.5` Offers create/list/read/update/withdraw with authorization.
- `M5.6` Accept/decline: transactional assignment, idempotency, concurrency-safe.
- `M5.7` Rematch and no-offer customer-control path.
- `M5.8` M5 tests: eligibility exclusion, remote no penalty, concurrent acceptance, ranking trace.

Initial provisional ranking weights:
- Skill relevance: 35%
- Relevant experience: 20%
- Availability: 15%
- Budget compatibility: 15%
- Ratings/completed work: 10%
- Location/service-area suitability: 5%

Treat these as hypotheses. Keep hard eligibility separate, avoid unfairly penalizing new providers, and measure real outcomes before tuning.

### M6 — Scheduling and communication

Deliver: weekly availability, exceptions, toggle, booking, task messaging, private attachments, notifications.
Acceptance: no overlapping confirmed bookings; exceptions override recurring schedule; disabling availability does not cancel existing bookings; messaging/files authorized; email failures don't undo business operations.

Phases:
- `M6.1` Weekly availability and exceptions endpoints; disable toggle preserves bookings.
- `M6.2` Booking create/cancel with timezone handling and DB conflict constraint.
- `M6.3` Conversations and messages with participant authorization.
- `M6.4` Message/task attachments via R2 adapter with size/type validation.
- `M6.5` In-app notifications and Resend email adapter with retryable jobs.
- `M6.6` M6 tests: overlap rejection, exceptions, authorization, email failure isolation.

### M7 — Completion, disputes, reviews, support

Deliver: completion OTP, reminders/escalation, dispute evidence and admin decisions, mutual reviews, moderation, support tickets.
Acceptance: OTP expires/single-use/rate-limited; unconfirmed work escalated, not auto-completed; disputes follow workflow; reviews restricted to eligible participants; duplicates prevented; sensitive actions audited.

Phases:
- `M7.1` Completion OTP: issue, confirm, expiry, single use, rate limits.
- `M7.2` Reminder/escalation jobs; never auto-complete unconfirmed work.
- `M7.3` Disputes: create, evidence upload, admin review/resolution records.
- `M7.4` Mutual reviews, duplicate prevention, review reports and moderation cases.
- `M7.5` Support tickets and admin ticket handling.
- `M7.6` M7 tests: OTP edge cases, eligibility, duplicates, audit coverage.

### M8 — Financial simulation

Deliver: provider-neutral interface, simulator, append-only ledger, commission, refunds/payout simulation, idempotency, reconciliation.
Acceptance: integer minor units; no duplicate financial effect; ledger balanced; compensating entries; commission policy recorded; exceptions surfaced; simulator explicitly non-real.

Phases:
- `M8.1` Payment adapter interface and simulator implementation, labeled non-real.
- `M8.2` Payment/refund records with idempotency keys and request fingerprints.
- `M8.3` Double-entry ledger and commission calculation with recorded policy version.
- `M8.4` Payout simulation.
- `M8.5` Reconciliation runs and exception reporting.
- `M8.6` M8 tests: balance, immutability, duplicate keys, compensating entries.

### M9 — Operational readiness

Deliver: logs/error tracking, health checks, job monitoring, independent backups, restore tests, CI/CD, security/privacy review.
Acceptance: no sensitive logs; safe retries; restoration demonstrated; explicit migrations; critical alerts work; rollback/recovery documented.

Phases:
- `M9.1` Structured logging, correlation IDs, error tracking hook, log redaction checks.
- `M9.2` Health checks and job worker monitoring (claim, lease, stuck-job alerts).
- `M9.3` Encrypted backup script, retention, and documented restore drill.
- `M9.4` CI/CD pipeline and explicit production migration runbook.
- `M9.5` Security/privacy review against SPEC-005 with fixes recorded.
- `M9.6` Operational drills: retry safety, restore, rollback.

### M10 — Controlled Agra pilot

Deliver: invited cohort, verified providers, support and dispute handling, monitoring, metrics, feedback.
Acceptance: critical E2E journeys pass; no unresolved critical security defects; backup/incident process tested; support staffed; simulated payments until separate real-payment readiness approval.

Phases:
- `M10.1` Pilot seed data: categories, verified providers, service areas.
- `M10.2` Critical E2E journeys: customer, provider, admin.
- `M10.3` Monitoring dashboards and alert verification.
- `M10.4` Support/incident runbook and structured feedback collection.
- `M10.5` Launch readiness review; real payments remain disabled.

## 4. CI/CD

Run formatting/lint, type checks, unit tests, relevant PostgreSQL integration tests, production build, and security-sensitive tests. Require review before merging. Run critical E2E tests before production. Use expand-and-contract migrations where needed; do not run production migrations on app startup.

## 5. Environment configuration

Separate development and production settings and credentials. Validate required variables. `.env.example` contains names/descriptions only. Keep secrets in deployment secret settings; never expose credentials through public browser variables.

## 6. Testing

- Unit: business rules, ranking, state transitions, calculations.
- Integration: DB constraints, transactions, jobs, persistence.
- E2E: customer, provider, admin journeys.
- Security: authorization, rate limits, uploads, account recovery.
- Resilience: retries, timeouts, duplicate requests, external-service failures.
- Financial: ledger balance, idempotency, refunds, reconciliation.

Vitest and Playwright are proposed; pin compatible versions during setup.

## 7. Definition of done

A feature is complete only when requirements and acceptance criteria pass; authorization, validation, and errors are implemented; migrations and tests are versioned; sensitive actions are auditable; logs avoid secrets/PII; docs are updated; and the implementation has been reviewed.
