# SPEC-005 — Security, Privacy, and Operations

## 1. Objectives

Protect accounts, credentials, verification documents, precise addresses, task conversations, dispute evidence, financial records, and administrative privileges. Security is enforced server-side and, where practical, by database constraints.

## 2. Identity and access

- Email/password with secure password hashing.
- Verify email before protected marketplace activities.
- Rate-limit login, registration, reset, and OTP endpoints.
- Store recovery tokens hashed, expiring, single-use.
- Revoke relevant sessions after password changes, compromise, or account disablement.
- Secure cookies, HTTPS, and appropriate CSRF protections.
- Provision one initial super-admin through a controlled bootstrap; no public admin registration.
- Require TOTP MFA for every admin; invite additional admins.
- Keep recovery codes and audited recovery that cannot bypass MFA.
- Check authentication, account status, permission, resource ownership/participation, state, and qualification eligibility for every protected operation.

## 3. Privacy and data handling

### Minimize data
- Send only necessary task data to AI.
- Never send passwords, auth tokens, or private verification documents to AI.
- Keep precise addresses out of AI requests unless strictly necessary.
- Do not log OTPs, secrets, identity documents, full messages, or full prompts/responses by default.
- Preserve original task description separately from AI interpretation.

### Location
- Use coordinates internally for matching.
- Show approximate service areas publicly.
- Reveal precise address only to the selected provider when needed for a confirmed appointment.
- Protect precise location through resource-level authorization.
- Do not put precise locations in public URLs or unnecessary analytics.

### Files
- Private object-storage buckets.
- Server-generated object keys.
- Validate file type/content/size and uploader authorization.
- Short-lived signed URLs after authorization.
- Consider malware scanning.
- Never serve private evidence or verification documents from public static directories.

### Retention and deletion
- Support self-service account deletion requests.
- Revoke access appropriately.
- Preserve records only as necessary for legitimate operational/legal purposes.
- Define retention by data category.
- Delete/anonymize when permitted and required.
- Soft deletion is not equivalent to permanent erasure.

## 4. AI security and reliability

Treat user input and uploaded text as untrusted. Validate output against schemas and business rules. Allow one constrained correction retry, then manual fallback. Customer approval is required before publication. AI cannot make authorization, qualification, payment, or dispute decisions. Apply timeouts, token/request limits, usage tracking, and rate limiting. Verify provider data-use and retention terms before sending personal data.

## 5. Financial security

- Integer minor units and explicit currency.
- Record commission rate, amount, currency, timestamp, and policy version.
- Append-only ledger and compensating entries.
- Transactions and idempotency for financial operations.
- Reconcile payment/refund/commission/payout records.
- Report exceptions; do not silently alter ledger to pass reconciliation.
- Keep payment credentials server-side.
- Label simulator records as non-real.
- Real payments remain gated on provider eligibility and readiness review.

## 6. Application and database security

Validate all input; use parameterized access through Drizzle/approved interfaces; least-privilege credentials; separate dev/prod secrets; versioned migrations; explicit permissions; shared rate limiting; and sanitized standardized errors.

## 7. Logging and monitoring

Record correlation IDs, errors/latency, authz failures, sensitive admin actions, job retries, AI usage/errors, payment simulation/reconciliation exceptions, and backup results. Do not log passwords, OTPs, secrets, full private messages, or unnecessary PII.

Alert on app/DB unavailability, stuck jobs, backup failure, suspected compromise, financial exceptions, and unexpected error/service failures. Critical alerts must not depend solely on the failing component.

## 8. Background jobs

Atomically claim jobs; bounded retries/backoff; recover abandoned leases; idempotent side effects; separate durable business changes from external side effects; alert on stuck jobs. Jobs are not the financial source of truth.

## 9. Backups and disaster recovery

Provisional targets:
- RPO: up to one hour of data loss.
- RTO: restore essential service within four hours.

Verify provider capabilities; schedule encrypted logical backups; store them separately with restricted access; define retention; test restoration; document recovery; alert on missed backups. R2 objects require a separate recovery plan.

## 10. Incident response

1. Detect/classify.
2. Contain.
3. Preserve evidence/logs.
4. Revoke compromised credentials/sessions.
5. Assess affected systems/data/users.
6. Restore secure service.
7. Notify users/authorities where required.
8. Document root cause and corrective actions.

Review applicable Indian cyber-incident reporting and log-retention requirements before launch. Consult the current CERT-In directions: https://www.cert-in.org.in/Directions70B.jsp

## 11. Deployment controls

Separate environments and secrets; CI lint/type/tests/build; review before merging; explicit migrations; post-deploy health checks; rollback/forward-fix procedure; verify hosting plan before commercial use; review current provider limits, terms, retention, and pricing.

## 12. Indian privacy/compliance readiness

Before public launch, assess:
- Applicability and commencement dates of the Digital Personal Data Protection Act and Rules.
- Privacy notice, purposes, consent or other applicable legal bases.
- Personal-data requests and account deletion.
- Retention, safeguards, and breach response.
- Consumer and marketplace obligations.
- Tax, invoicing, and commission treatment.
- Payment-provider eligibility and financial requirements.
- Cyber-incident reporting and log retention.

This is an engineering checklist, not legal advice. Obtain professional review before commercial launch or real-money transactions. Official reference: https://www.meity.gov.in/

## 13. Launch checklist

Do not launch publicly until admin MFA/recovery, resource authorization, private files/addresses, AI minimization/fallback, financial idempotency/reconciliation, backup restore, monitoring/alerts, support/disputes, vendor terms, and applicable compliance obligations have been tested/reviewed.
