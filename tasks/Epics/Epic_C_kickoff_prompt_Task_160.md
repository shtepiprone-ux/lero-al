# Kickoff prompt — Task 160 (C.5 follow-up — real block / suspension enforcement)

> Follow-up to Task 126. Review (2026-05-21): blocking is enforced ONLY in `createListing`; `suspended_until` is stored + shown but never enforced (no time-based logic, no auto-lift).

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: do NOT change scope; do NOT add new architecture; execute AC literally;
update docs/backlog.md + add docs/sessions/<date>-task-160-*.md.

Pre-read: docs/rls-rules.md, docs/data-access-rules.md, docs/ai-behavior.md,
src/modules/listings/actions/createListing.ts, src/middleware.ts, src/lib/auth/server.ts,
src/modules/admin/actions/index.ts (updateUserProfileFull).

Scope:
1. One canonical "is user currently blocked?" helper: blocked when status='blocked'
   OR (suspended_until IS NOT NULL AND now < suspended_until).
2. Enforce on every authenticated write (create/edit listing, send message, etc.) server-side.
3. Decide + implement session behavior for a blocked user (sign-out / blocked state) in one place.
4. suspended_until auto-lifts once it passes (no manual admin step).
5. Localized blocked/suspended messages sq/en/uk/it (all 4 message files).

Acceptance criteria:
- Blocked user cannot create/edit listings or message (server-enforced).
- suspended_until enforced + auto-lifts. One canonical helper; no duplicated status logic.
- 4 locales; governance + locale parity PASS; 0 new lint/typecheck errors. Session log + backlog updated.
Out of scope: redesigning Task 126 admin UI; appeals/payments.
```
