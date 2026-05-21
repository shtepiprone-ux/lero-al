# Kickoff prompt — Task 157 (Recovery security logging — forensic IP / user-agent capture)

> Follow-up to Task 121 (Epic D.4 — password recovery). Deferred enhancement identified during the Task 121 quality review (2026-05-21).
> Current state: `src/modules/auth/actions/recovery.ts` logs the recovery request with a timestamp only, and completion with `userId` + timestamp. This is neutral-by-design (no email enumeration) but has NO source IP / user-agent, so it is weak as a forensic / audit trail.

---

```
You are Claude Code working in the `lero-al` project.

Context:
Task 121 (Epic D.4) built the password recovery flow. Its security logging
(src/modules/auth/actions/recovery.ts) currently records only a timestamp on
request, and userId + timestamp on completion. That was intentional to avoid
email enumeration, but it provides no forensic value (no source IP, no
user-agent, no correlation id). This task adds that WITHOUT reintroducing an
enumeration leak.

Required pre-read:
1. src/modules/auth/actions/recovery.ts (current logging)
2. src/modules/auth/components/AuthSheet.tsx (ForgotPasswordView -> logPasswordRecoveryRequest)
3. src/modules/auth/components/ResetPasswordClient.tsx (-> logPasswordRecoveryCompletion)
4. docs/rls-rules.md, docs/data-access-rules.md (logging / PII handling)
5. docs/ai-behavior.md (Canonical Task Template, Auth Lifecycle Rules)
6. docs/integrations.md (Sentry / observability)

Scope (Task 157):
1. In the recovery logging server actions, capture request metadata server-side
   via next/headers headers() - source IP (x-forwarded-for / x-real-ip) and
   user-agent - and include them in the structured log.
2. Add a per-request correlation id so the request and completion log lines can
   be tied together.
3. Keep the forgot-password response NEUTRAL - the log must never reveal whether
   the submitted email exists. Do NOT log the raw email (hash it if correlation
   by email is required, per docs/rls-rules.md).
4. Decide + document the sink: structured console (Vercel / Sentry) vs a dedicated
   security_events table. If a table is chosen, add the migration + RLS
   (admin-read only, no public access) per docs/rls-rules.md.
5. Confirm + document Supabase's built-in recovery rate limit; only add an
   app-level rate-limit signal if the built-in is insufficient (the D.4
   acceptance criteria mention a rate limit).

Acceptance criteria:
- Recovery request + completion logs include IP + user-agent + correlation id.
- No email enumeration: identical neutral response; no raw email in logs.
- PII handling documented (rls-rules / data-access-rules); any new table has RLS.
- 0 new lint / typecheck errors; governance gates PASS.
- Session log + docs/backlog.md updated.

Out of scope:
- Changing the recovery UX or email templates (done in Task 121).
- D.6 Send Email Hook work (Task 122).

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.
```
