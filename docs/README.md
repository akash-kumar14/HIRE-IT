# AI-Powered Service Marketplace — Documentation Package

**Package:** Architecture baseline v1.0  
**Product:** AI-powered two-sided services marketplace  
**Initial geography:** Agra, Uttar Pradesh, India  
**Status:** Architecture sections approved; implementation and vendor verification pending.

## Contents

1. [SPEC-001 — Architecture Specification](01-architecture-specification.md)
2. [SPEC-002 — Database Design](02-database-design.md)
3. [SPEC-003 — API Specification](03-api-specification.md)
4. [SPEC-004 — Implementation Plan](04-implementation-plan.md)
5. [SPEC-005 — Security, Privacy, and Operations](05-security-privacy-operations.md)
6. [SPEC-006 — Architecture Decision Register](06-architecture-decision-register.md)
7. [Project Progress](progress.md) — living status board, updated after every task

## Project team

This project is built by a single developer working with an AI coding assistant. There is no team, no co-developers, and no separate work-division plan. All modules and schema files are owned by the same developer; the ownership labels in SPEC-002 are organizational hints only, not assignments to different people. Milestones are sequenced for one person working feature by feature, so expect the implementation to progress incrementally rather than in parallel.

## How to use this package

- Treat the approved architecture decisions as the baseline for implementation.
- Treat vendor-specific versions, plan limits, pricing, and integrations as verification tasks until checked against current official documentation.
- Build one feature end-to-end at a time, with acceptance criteria and automated tests.
- Do not enable real-money payments until provider eligibility, applicable requirements, and launch readiness have been reviewed.
- Update the decision register when a decision changes.

## Document status

These documents are a design baseline, not a completed or tested codebase. Exact Drizzle models, executable SQL migrations, endpoint payload schemas, dependency versions, and deployment configuration remain implementation tasks. The `src/` tree is JavaScript/JSX with Drizzle ORM; the core specifications below have been reconciled to that stack.

## Common architectural decisions

- Modular monolith with background jobs.
- Next.js (App Router, JavaScript/JSX) + Tailwind CSS v4.
- PostgreSQL on Neon, accessed through Drizzle ORM.
- Geographic radius matching (PostGIS geometry or numeric coordinates with haversine), subject to an open ADR and deployment compatibility verification.
- Private Cloudflare R2 object storage.
- Google Gemini behind an AI adapter.
- Resend for email, subject to current limits and terms.
- PostgreSQL-backed jobs, notifications, and polling-based messaging.
- Payment simulator and provider-neutral payment interface.
- Mandatory TOTP MFA for administrators.
- English interface; Hindi and English task descriptions.
- Controlled Agra pilot before broader expansion.
