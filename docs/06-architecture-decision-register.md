# SPEC-006 — Architecture Decision Register

## 1. Purpose and status

This register consolidates the decisions approved during architecture consultation for the AI-powered services marketplace launching in Agra, Uttar Pradesh, India.

- **Approved:** Explicitly selected by the user.
- **Provisional:** Direction selected but compatibility, terms, pricing, or implementation must be verified.
- **Open:** Requires a later decision or implementation-time definition.

## 2. Decision index

The consultation register contains ADR-001 through ADR-109. The following grouped index summarizes the decisions without reproducing every question/option verbatim.

### Architecture and technology
- **ADR-001:** Modular monolith with background jobs.
- **ADR-002:** Solo developer assumption.
- **ADR-003:** JavaScript full-stack.
- **ADR-004:** Vercel app hosting and Neon PostgreSQL; commercial plan must be verified.
- **ADR-005:** Minimize costs during development and launch.
- **ADR-006:** PostgreSQL-backed job queue.
- **ADR-007:** Prisma ORM.
- **ADR-008:** Auth.js selected provisionally; custom security workflows still required.
- **ADR-009:** Private Cloudflare R2 storage.
- **ADR-010:** PostgreSQL polling for messaging.
- **ADR-011–012:** External AI; Gemini initially behind adapter.
- **ADR-016:** Resend for email, subject to current limits/terms.
- **ADR-017:** Audio/video deferred.
- **ADR-018–020:** PostgreSQL scheduling; in-app notifications; weighted matching after hard eligibility filters.
- **ADR-021–022:** Lightweight PWA and feature-based modules.
- **ADR-025–029:** Layered tests; dev/prod environments; structured monitoring; Neon plus independent backups; structured geography.
- **ADR-030–032:** Database-managed categories/skills, category-specific qualifications, fixed initial ranking weights.
- **ADR-045–051:** Incremental schema; one feature end-to-end; tests/review; centralized config; versioned migrations; standard API errors; endpoint-specific shared rate limits.
- **ADR-061–070:** Atomic DB job claiming; concurrency-safe transactions; data minimization; AI fallback/limits/usage ledger; settings/secrets separation; selective API versioning; indexed filtering; UTC and IANA timezone.
- **ADR-071:** PostGIS radius matching in MVP.
- **ADR-097–101:** Controlled CI/CD; independent backups; provisional RPO/RTO; logs/monitoring; critical email alerts.

### Identity, security, privacy
- **ADR-014–015:** Manual provider verification; email OTP for suitable verification/recovery and task-completion OTP as separate purpose.
- **ADR-023–024:** Resource-level authorization; explicit task/payment state machines.
- **ADR-047–054:** Human code review, config/migrations, errors, rate limits, secure uploads, soft deletion, critical journey tests.
- **ADR-059:** Separate User identity, ProviderProfile, and admin permissions.
- **ADR-063:** Data minimization and strict access control.
- **ADR-077–079:** Abuse prevention, severity-based moderation, mandatory admin MFA.
- **ADR-080–082:** Email/password; TOTP required for admins; secure self-service recovery and recovery codes.
- **ADR-083–084:** Unique verified email; manual provider verification and qualification-expiry handling.
- **ADR-095–096:** Prompt injection defenses, schema validation, one constrained retry then manual fallback.
- **ADR-104:** Minimize AI data and disclose processing.
- **ADR-107:** One initial super-admin, then invite-only administrators.
- **ADR-109:** Self-service deletion request with safeguards.

### Marketplace behavior
- **ADR-013, ADR-039, ADR-092:** Simulated payments during development; no live payments in MVP.
- **ADR-033–038:** Budget/quote model; accepted offer locks terms; provider-paid commission; cancellation policy; admin-mediated disputes; mutual reviews.
- **ADR-040–044:** Messaging after offer; in-app plus essential email; batched matching; customer decides when no offers; core marketplace MVP.
- **ADR-057–060:** Relational core with optional non-authoritative JSON metadata; immutable critical history; separate identity/provider; explicit task state machine.
- **ADR-072–076:** Exact location shared only with selected provider when needed; address required when appointment confirmed; if provider unavailable after selection, return to matching; weekly schedule plus exceptions and toggle; faster urgent-task notification batches.
- **ADR-085–090:** Customer completion OTP; non-response escalates to admin rather than auto-completion; structured disputes; standard dispute outcomes; commission rate at completion time.
- **ADR-091:** Append-only ledger.
- **ADR-102:** Provider-neutral payment architecture.
- **ADR-103:** English UI, Hindi/English task input.
- **ADR-105:** Admin-managed support.
- **ADR-106:** Free deployment URL initially; custom domain before public launch.
- **ADR-108:** Structured feedback plus optional comments.

### Stack reconciliation (v1.1)
- **ADR-110 (supersedes ADR-003, ADR-007):** Implementation language is JavaScript/JSX (not TypeScript), and the ORM is Drizzle (not Prisma). Newer Next.js major versions are adopted as released; the current baseline is Next.js 16, not 15.
- **ADR-111 (supersedes ADR-008):** Authentication is a custom email/password session implementation using hashed passwords (`bcryptjs`), `user_sessions`, and TOTP (`otplib`). Auth.js is not part of the baseline.
- **ADR-112:** Canonical task states are `draft`, `published`, `matching`, `offers_received`, `assigned`, `in_progress`, `completed`, `disputed`, `cancelled`. The earlier `provider_selected` and `completion_submitted` names are retired.
- **ADR-113:** Geographic matching remains an open decision between (a) PostGIS geometry columns with GiST indexes and (b) numeric latitude/longitude with application-level haversine filtering. Both are documented; implementation choice is deferred pending Neon PostGIS verification.
- **ADR-114:** API responses use `{ success, data, meta }` for success and `{ success, error }` for failures, including a `meta.requestId` correlation identifier.

## 3. Initial matching weights

These are provisional product hypotheses, not validated outcomes:
- Skill relevance: 35%
- Relevant experience: 20%
- Availability: 15%
- Budget compatibility: 15%
- Ratings/completed work: 10%
- Location/service-area suitability: 5%

Hard eligibility is applied before ranking. Remote tasks have no distance penalty; new providers should not be unfairly penalized for lacking reviews. Track acceptance, response, completion, cancellation, dispute, and satisfaction metrics before tuning.

## 4. Provisional vendor and technical checks

| Area | Selected direction | Verify before production |
|---|---|---|
| Vercel | App hosting | Commercial-plan eligibility, execution/scheduling limits |
| Neon | PostgreSQL | Connection limits, recovery retention, PostGIS availability/capability |
| Drizzle | ORM/migrations | Current version, PostGIS integration, custom SQL needs |
| Custom session auth | `bcryptjs` + `user_sessions` + `otplib` | Password hashing, session design, MFA and recovery implementation |
| Gemini | AI | Pricing/quotas, data-use and retention terms, structured output |
| R2 | Object storage | Pricing/limits, signed URLs, private configuration |
| Resend | Email | Domain verification, limits, terms |
| Sentry candidate | Error tracking | Pricing, retention, data-processing terms |
| Rate limiting | Shared DB-backed initial implementation | Concurrency and performance under load |
| Payments | Simulator/provider-neutral interface | Future provider eligibility, marketplace flows, fees, legal/regulatory requirements |

## 5. Outstanding implementation and policy details

1. Exact task, booking, offer, dispute, and review deadlines.
2. Final Drizzle fields, enums, constraints, deletion rules, and migration order.
3. Matching batch timing and ranking calibration.
4. Upload limits, allowlisted file types, malware-scanning approach.
5. Retention periods for identity documents, messages, audit and financial records.
6. Final notification templates and preferences.
7. Administrator permission matrix and bootstrap runbook.
8. Endpoint payload schemas and generated OpenAPI spec.
9. Production budget and hosting/service plan.
10. Applicable privacy, consumer, tax, payment, and cyber-incident obligations.
11. Geographic matching implementation: PostGIS geometry vs numeric coordinates with haversine (ADR-113), pending Neon PostGIS verification.

Resolve each item before the dependent feature or launch milestone; not every item blocks initial repository setup.

## 6. Required implementation order

1. Repository, environment, CI, database, migrations.
2. Authentication, authorization, admin MFA, audit logging.
3. Provider applications, categories, skills, verification.
4. AI-assisted task creation and approval.
5. Matching, offers, provider selection.
6. Scheduling, messaging, attachments.
7. Completion, disputes, reviews, support.
8. Payment simulator, commission, ledger, reconciliation.
9. Monitoring, backups/restoration, security review.
10. Controlled Agra pilot and launch readiness.

## 7. Final principles

- Backend is authoritative for permissions and business rules.
- AI cannot authorize users, bypass qualifications, or make financial decisions.
- State transitions are validated and concurrency-safe.
- Financial history is preserved and corrected through explicit compensating entries.
- External integrations use adapters.
- Jobs are durable, retryable, and idempotent.
- Private documents and precise addresses remain access-controlled.
- Every feature has acceptance criteria, tests, and review.
- Commercial launch is gated on operational readiness and applicable compliance checks.
