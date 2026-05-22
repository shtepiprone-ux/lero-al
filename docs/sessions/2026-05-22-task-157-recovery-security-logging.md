# Session Archive: Task 157 — Recovery Security Logging — 2026-05-22

## Task

**Task 157 — D.4 follow-up — Forensic IP / user-agent + correlation ID in recovery logs**
Type: Security hardening | No new UI; no new DB table.

## Changes

### `src/modules/auth/actions/recovery.ts`

**Before:** both log functions only recorded timestamp (request) or userId+timestamp (completion).

**After:** both record:
```
{
  correlationId: "<16-char sha256 hex of salt:email>",
  ip:            "<x-forwarded-for or x-real-ip, 'unknown' if absent>",
  ua:            "<user-agent, truncated to 200 chars>",
  timestamp:     "<ISO 8601>",
  // + userId in completion only
}
```

### Correlation ID design

**One-way hash of the email** (SHA-256 + `LOG_CORRELATION_SALT` env var):
- Stable across request and completion — links the two events.
- Raw email is **never** logged — prevents enumeration / correlation attacks.
- Salt prevents rainbow table reversal.
- 16-char hex prefix: sufficient for correlation, insufficient for reversal.

**Why not a random UUID per call:**
A random UUID can't link request→completion (different page loads, different sessions).
The email hash is the only stable identifier available without PII exposure.

### Callers updated

| File | Change |
|---|---|
| `AuthSheet.tsx` ForgotPasswordView | `logPasswordRecoveryRequest()` → `logPasswordRecoveryRequest(email)` |
| `ResetPasswordClient.tsx` | Added `userEmail` state from session; `logPasswordRecoveryCompletion(userId)` → `logPasswordRecoveryCompletion(userId, userEmail ?? '')` |

### `docs/env.md`

Added `LOG_CORRELATION_SALT` — server-only random salt for the email hash.
Generate: `openssl rand -hex 24`. Falls back to `'lero-al'` if absent (weaker; set in production).

## Decisions documented

### Sink: structured console (Vercel + Sentry)

No `security_events` DB table added. Rationale:
- Vercel log drain + Sentry already in place; no additional infrastructure needed.
- A DB table would require: schema migration, RLS (admin-read-only), data retention policy.
- These are deferred to a future audit-log system design task if structured forensic querying is required.

### Supabase rate limit: sufficient

Supabase applies a built-in recovery email rate limit (Dashboard → Auth → Rate Limits; default ≈ 3/hour/user). No app-level rate-limit signal needed at this stage. If this proves insufficient, add a Redis-backed rate limiter in the recovery flow (deferred).

### No email enumeration

`logPasswordRecoveryRequest(email)` is called INSIDE `Promise.all([requestPasswordReset, logRecovery])`. The neutral response ("email sent" regardless of whether the account exists) is unchanged. The hash never appears in HTTP responses.

## Acceptance criteria

- [x] IP + user-agent + correlationId in both log events.
- [x] Raw email never logged; hash-only correlation.
- [x] Neutral response preserved (no enumeration change).
- [x] `LOG_CORRELATION_SALT` documented in `docs/env.md`.
- [x] Supabase rate limit documented (sufficient; no app-layer needed).
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 new warnings.
