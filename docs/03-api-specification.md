# SPEC-003 — API Specification

## 1. Conventions

- Base path: `/api/v1`.
- Next.js App Router Route Handlers.
- JSON for normal requests/responses; controlled multipart or presigned uploads for files.
- UUID resource identifiers, ISO 8601 timestamps, integer minor units plus currency.
- Validate all untrusted input; paginate collection endpoints.
- API handlers authenticate/validate and invoke module services; business logic belongs in services.
- Version public contracts where stability is required; avoid needless parallel versions.

Example success (implemented by `src/lib/api/response.js`):
```json
{
  "success": true,
  "data": {"id": "resource-uuid", "status": "published"},
  "meta": {"requestId": "request-uuid"}
}
```

Example error:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "This operation is not allowed in the current state."
  },
  "meta": {"requestId": "request-uuid"}
}
```

Never expose stack traces, database errors, secrets, or private resource details.

## 2. Status codes

| Status | Meaning |
|---|---|
| 200 | Successful read/update |
| 201 | Resource created |
| 202 | Accepted for asynchronous processing |
| 204 | Successful operation, no body |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Authenticated but unauthorized |
| 404 | Not found or intentionally concealed |
| 409 | State conflict, duplicate operation, booking conflict |
| 413 | Request/upload too large |
| 422 | Structurally valid but invalid business input |
| 429 | Rate limit exceeded |
| 500 | Unexpected error |
| 503 | Required service unavailable |

## 3. Authentication and account endpoints

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/auth/register` | Create customer account | Public, rate-limited |
| POST | `/auth/login` | Email/password login | Public, rate-limited |
| POST | `/auth/logout` | End session | Authenticated |
| GET | `/auth/me` | Current user | Authenticated |
| POST | `/auth/email-verification` | Request verification | Authenticated |
| POST | `/auth/email-verification/confirm` | Verify token | Token-protected |
| POST | `/auth/password-reset` | Request reset | Public, rate-limited |
| POST | `/auth/password-reset/confirm` | Reset password | Token-protected |
| POST | `/auth/mfa/enroll` | Begin admin TOTP enrollment | Authorized admin |
| POST | `/auth/mfa/confirm` | Confirm enrollment | Authorized admin |
| POST | `/auth/mfa/verify` | Complete MFA | Admin flow |
| POST | `/auth/mfa/recovery` | Controlled recovery | Recovery flow |
| POST | `/account/deletion-requests` | Request deletion | Authenticated |
| GET | `/account/deletion-requests/current` | Request status | Authenticated |

Authentication is a custom session implementation (`user_sessions`, `bcryptjs`, `otplib`); no third-party auth framework is assumed. Implement and test password storage, reset flows, rate limiting, and full MFA explicitly. Use secure password hashing, generic reset responses, hashed single-use tokens, secure cookies, and session invalidation where appropriate. Email-only recovery must not bypass administrator MFA.

## 4. Users and providers

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET/PATCH | `/users/me` | Read/update own profile | Authenticated |
| GET | `/providers/me` | Own provider profile | Applicant/provider |
| POST | `/provider-applications` | Apply as provider | Verified customer |
| GET | `/provider-applications/me` | Own application status | Applicant |
| PATCH | `/providers/me/availability` | Availability toggle | Provider |
| GET | `/providers/{id}` | Public provider profile | Public-safe fields |
| GET | `/providers/{id}/reviews` | Visible reviews | Public-safe fields |
| POST | `/providers/me/skills` | Request skill association | Provider |
| GET | `/providers/me/verifications` | Own verification status | Provider |

Admin provider endpoints:
- `GET /admin/provider-applications`
- `GET /admin/provider-applications/{id}`
- `POST /admin/provider-applications/{id}/approve`
- `POST /admin/provider-applications/{id}/reject`
- `POST /admin/verifications/{id}/decision`

Record actor, timestamp, decision, reason, and applicable requirements for verification decisions.

Verification expiry uses UTC: `expiresAt <= now` or status `expired` yields effective status `expired` and `isExpired: true`; expired or revoked records do not satisfy a requirement. Enabling availability or replacing weekly slots requires an approved provider profile and no expired verification on that profile; task-specific eligibility remains an M5 hard filter.

## 5. Categories and requirements

- `GET /categories`
- `GET /categories/{id}/skills`
- `GET /categories/{id}/requirements`
- `POST /admin/categories`
- `PATCH /admin/categories/{id}`
- `POST /admin/skills`
- `POST /admin/verification-requirements`

Prefer deactivation to deletion for referenced categories/skills.

## 6. Tasks

- `POST /tasks/interpret`
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/{id}`
- `PATCH /tasks/{id}`
- `POST /tasks/{id}/publish`
- `POST /tasks/{id}/cancel`
- `GET /tasks/{id}/matches`
- `POST /tasks/{id}/rematch`
- `POST /tasks/{id}/completion`
- `POST /tasks/{id}/completion/confirm`

Preserve original task description; validate AI output; keep authoritative fields relational; require customer approval before publication; support manual fallback. AI cannot change permissions, eligibility, or financial state.

## 7. Offers and assignments

- `POST /tasks/{id}/offers`
- `GET /tasks/{id}/offers`
- `GET /offers/{id}`
- `PATCH /offers/{id}`
- `POST /offers/{id}/withdraw`
- `POST /offers/{id}/accept`
- `POST /offers/{id}/decline`

Offer acceptance must transactionally validate task state, offer ownership, provider approval/qualification, assignment uniqueness, and agreed terms. Use idempotency keys.

## 8. Availability and bookings

- `GET /providers/me/availability`
- `PUT /providers/me/availability/weekly`
- `POST /providers/me/availability/exceptions`
- `DELETE /providers/me/availability/exceptions/{id}`
- `POST /tasks/{id}/booking`
- `GET /tasks/{id}/booking`
- `POST /bookings/{id}/cancel`

Use explicit timezone semantics and UTC storage. Prevent concurrent booking conflicts at the database level.

## 9. Messaging and files

- `GET /tasks/{id}/messages`
- `POST /tasks/{id}/messages`
- `POST /uploads/presign`
- `POST /uploads/complete`
- `GET /files/{id}/download`

Messaging is available after a provider submits an offer. Check participant authorization for each message and file. Use server-generated object keys, content and size validation, private storage, short-lived signed URLs, and malware-scanning consideration.

## 10. Notifications and support

- `GET /notifications`
- `POST /notifications/{id}/read`
- `POST /support/tickets`
- `GET /support/tickets`
- `GET /support/tickets/{id}`
- `POST /support/tickets/{id}/messages`
- `GET /admin/support/tickets`
- `PATCH /admin/support/tickets/{id}`

Notification delivery is asynchronous and must not undo committed business operations.

## 11. Reviews and disputes

- `POST /tasks/{id}/reviews`
- `GET /tasks/{id}/reviews`
- `POST /reviews/{id}/reports`
- `POST /tasks/{id}/disputes`
- `GET /disputes/{id}`
- `POST /disputes/{id}/evidence`
- `GET /admin/disputes`
- `POST /admin/disputes/{id}/resolution`

Only eligible participants can review. Private admin notes are excluded from participant responses. Refunds or financial adjustments after dispute resolution are separate explicit operations.

## 12. Payments and reconciliation

- `POST /tasks/{id}/payments/simulate` — development/test workflow only.
- `GET /payments/{id}`
- `POST /payments/{id}/refunds`
- `GET /admin/financial/reconciliation-runs`
- `POST /admin/financial/reconciliation-runs`
- `GET /admin/financial/reconciliation-exceptions`

Do not expose a public operation that lets users manufacture successful simulated transactions. Real provider routes/webhooks are specified after vendor selection; future webhooks must authenticate the provider and process idempotently.

## 13. Authorization, idempotency, and rate limiting

Every endpoint must check authentication, account status, permission, resource ownership/participation, state, and relevant provider qualifications.

For financially or operationally harmful duplicate actions, store operation scope, idempotency key, request fingerprint, status, and result. Return original result on valid retry; reject same key with different payload.

Use shared rate-limit state across instances. Apply endpoint-specific limits to login, recovery, OTP, AI, uploads, and messaging.

## 14. Acceptance criteria

- Every endpoint has request/response schemas and an access policy.
- State changes validate transitions.
- Resource-level authorization is tested.
- Critical operations are retry-safe and concurrency-safe.
- Errors are standardized and sanitized.
- Rate limits use shared state.
- Integration tests cover positive and negative paths.
- OpenAPI documentation is generated or maintained alongside endpoint schemas.
