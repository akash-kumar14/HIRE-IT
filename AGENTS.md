# AGENTS.md — AI Agent Guide

Instructions for any AI agent (or human) working on this project. Read this file first, then `docs/progress.md`, then the relevant SPEC document.

## 1. Project

AI-powered two-sided services marketplace. Customers describe needs in natural language, receive AI-assisted task structuring, discover verified providers, compare offers, and manage work to completion. Providers apply, get verified, publish skills/availability, receive opportunities, and submit offers.

- Initial market: Agra, Uttar Pradesh, India.
- Build mode: solo developer + AI assistant. No team, no work division.
- Status: documentation-only baseline. No application code exists yet.

## 2. Source of truth

Read in this order:

1. `docs/progress.md` — current state, next task, test results.
2. `AGENTS.md` — this file (conventions and workflow).
3. `docs/README.md` — package index.
4. `docs/01-architecture-specification.md` — requirements, modules, request flow.
5. `docs/02-database-design.md` — schema groups, integrity rules, state machine.
6. `docs/03-api-specification.md` — endpoints, response envelope, status codes.
7. `docs/04-implementation-plan.md` — milestones M1–M10, DoD.
8. `docs/05-security-privacy-operations.md` — security/privacy/ops rules.
9. `docs/06-architecture-decision-register.md` — ADRs; check before contradicting a decision.
10. `docs/ai_service_marketplace_complete_documentation.md` — generated copy of SPEC-001…006. Do not edit directly; edit the source SPEC file and mirror the change.

If docs and code disagree, docs win until an ADR is updated.

## 3. Stack (non-negotiable baseline)

- Next.js 16 App Router, **JavaScript/JSX only** (no TypeScript), Tailwind CSS v4.
- PostgreSQL on Neon, Drizzle ORM, versioned SQL migrations in `drizzle/`.
- Vercel hosting; Cloudflare R2 private storage; Google Gemini behind an adapter; Resend email.
- Custom email/password sessions (`bcryptjs`, `user_sessions`) + TOTP (`otplib`) for admins.
- PostgreSQL-backed background jobs, notifications, polling-based messaging.
- Payment simulator behind a provider-neutral interface. No real money in MVP.
- Geographic matching: PostGIS **or** numeric lat/lng + haversine — open decision, ADR-113.

Do not introduce TypeScript, Prisma, Auth.js, microservices, or a live payment provider without an explicit ADR update.

## 4. Planned structure

```text
src/app/            route groups: (auth) (customer) (provider) admin api/v1
src/modules/        auth users providers categories tasks matching offers bookings
                    messaging payments notifications reviews disputes support
src/infrastructure/ ai storage email payments jobs
src/lib/            api config db/schema observability
src/components/     shared UI
drizzle/            migrations (explicit, never on app startup)
tests/              unit integration e2e
docs/               specifications + progress.md
```

Route handlers stay thin: validate/authenticate, then call a module service. Business logic belongs in services.

## 5. Coding conventions

- UUID business IDs; `timestamptz` in UTC; money as integer minor units + currency code.
- Table names snake_case; Drizzle exports camelCase.
- No hardcoded colors in CSS. Define design tokens as CSS variables (e.g. `--color-*` in the global stylesheet) and reference them from Tailwind/theme or component CSS. Raw hex/rgb/hsl values belong only in the token definitions, never in components or page styles.
- One Drizzle schema file per domain in `src/lib/db/schema/`.
- API envelope: success `{ success: true, data, meta: { requestId } }`; error `{ success: false, error: { code, message }, meta }`.
- Task states (ADR-112): `draft → published → matching → offers_received → assigned → in_progress → completed`, plus `disputed`, `cancelled`. Invalid transition → `INVALID_STATE_TRANSITION` (409).
- Backend is authoritative: AI cannot authorize users, bypass qualifications, or change financial state.
- Never log passwords, OTPs, tokens, full private messages, precise addresses, or verification documents.
- Files/addresses are private by default; short-lived signed URLs only after authorization.
- Ledger entries are append-only; corrections use compensating entries; use idempotency records.
- Do not add comments unless they explain non-obvious intent; match surrounding style.
- No secrets in the repo. Use `.env.example` for names/descriptions only.

## 6. Required workflow for every task

Work in phases, not whole milestones. Each phase (e.g. `M2.4`) is sized to fit in roughly 80% of one context window: one domain slice, one testable outcome, ~10 files max. Phase definitions are in `docs/04-implementation-plan.md` §3 and mirrored as checkboxes in `docs/progress.md`.

Finish all phases of a milestone before starting the next one. M2 UI phases (`M2.11`–`M2.13`) start only after `M2.10` passes; do not pull UI work forward.

1. Read `docs/progress.md` and the SPEC sections relevant to the current phase only.
2. Check ADRs before choosing an approach; do not silently override an approved decision.
3. Implement that one phase; if it outgrows the context budget, split it (`M2.4a`/`M2.4b`) and record the split in `docs/progress.md`.
4. **Test the change** (see section 7).
5. Update `docs/progress.md` (see section 8). This is mandatory, even when the task is incomplete or tests fail.
6. If a decision changes, update the SPEC and ADR register (and mirror into the generated complete-documentation file).

Never mark work complete without running the available checks. If a check cannot run, record why in `docs/progress.md`.

## 7. Testing

No app scaffold exists yet. Once `package.json` exists, use its scripts, in this order:

```bash
npm run lint              # formatting/lint
npm test                  # unit tests (Vitest)
npm run test:integration  # DB/transaction/job tests (needs Postgres)
npm run build             # production build
npm run test:e2e          # Playwright critical journeys (before release)
```

Rules:

- Prefer the repo's actual script names; read `package.json` rather than assuming.
- If a script is missing, run the closest available check (e.g. `npm run build`) and note the gap.
- Never weaken or delete a test to make a change pass.
- New behavior needs tests: unit for business rules/state transitions/ranking/calculations; integration for constraints, transactions, jobs; E2E for customer/provider/admin journeys.
- Security-sensitive work must include authorization and negative-path tests.
- Record every test run and its result in `docs/progress.md`.

## 8. Progress file protocol

`docs/progress.md` is the living status board. Update it at the end of every task:

- Set `Last updated` to the current date.
- Tick the completed phase checkbox (`- [x] M2.4 ...`) and move `Current focus` to the next phase.
- Update the milestone table status (`Not started`, `In progress`, `Blocked`, `Done`) and note partial progress.
- Append a Work log entry with: date, phase ID, what changed (with file paths), tests run + outcome, blockers, and the exact next step.
- Add anything discovered that affects future work (open decisions, missing vendor checks, known defects).
- Keep entries short and factual. Do not delete history; append or correct it.

## 9. Guardrails

- Do not enable real-money payments, payouts, or public admin registration.
- Do not run production migrations automatically on app startup.
- Do not commit secrets, credentials, or `.env` files.
- Do not skip authentication, authorization, qualification, or rate-limit checks for convenience.
- Do not edit generated docs directly; edit the source and mirror.
- Do not expand scope beyond the current milestone without recording the reason.
