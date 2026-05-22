# Session Archive: Task 161 — Email Template Delete = Admin-Only — 2026-05-22

## Task

**Task 161 — D.2 follow-up — email_templates DELETE must be admin-only**
Type: Security fix | 0 new UI.

## Problem

`deleteEmailTemplateGroupAction` and `deleteEmailTemplateLocaleAction` called
`assertAdminOrModerator()` — allowing moderators to delete templates.
Policy from Task 123: SELECT/INSERT/UPDATE = admin+moderator; DELETE = **admin only**.
Actions use `createAdminClient()` (service-role, bypasses RLS) → in-code check is the actual gate.

## Fix

Added `assertAdmin()` helper (checks `role === 'admin'` only).
Both delete actions now call `assertAdmin()` instead of `assertAdminOrModerator()`.

```typescript
// Before (wrong):
const auth = await assertAdminOrModerator()
if ('error' in auth && !auth.user) return { error: auth.error }

// After (correct):
const auth = await assertAdmin()
if ('error' in auth) return { error: auth.error }
```

Note: the condition simplification (`if ('error' in auth)`) is also correct because
`assertAdmin()` returns either `{ error: ... }` or `{ user }` — no intermediate states.

## RLS matrix confirmed

`email_templates` table policies from Task 123 (documented in `docs/integrations.md`):

| Operation | Admin | Moderator |
|---|---|---|
| SELECT | ✅ | ✅ |
| INSERT | ✅ | ✅ |
| UPDATE | ✅ | ✅ |
| DELETE | ✅ | ❌ |

RLS SQL exists (applied in Supabase during Task 123). In-code `assertAdmin()` is the primary
gate since actions use `createAdminClient()`. RLS is defense-in-depth for any future
user-scoped code paths.

## Files changed

| File | Change |
|---|---|
| `src/modules/notifications/actions/emailTemplates.ts` | Added `assertAdmin()`; delete actions use it |
| `docs/integrations.md` | Added RLS matrix table + SQL for `email_templates` |

## Acceptance criteria

- [x] Moderator cannot delete templates; admin can.
- [x] RLS matrix documented in `docs/integrations.md` with SQL.
- [x] `npm run typecheck` → 0 new errors; `npm run lint` → 0 warnings.
