# Task 266 — T.8 — Narrow the `users` RLS authenticated-read policy (security follow-up)

Type:        chore (security / architectural refinement)
Priority:    medium (privacy surface; not immediately exploitable but should be addressed)
Area:        users / RLS / privacy
Filed by:    Task 263 review (Opus 4.7) on 2026-05-28 — Task 263 closed by applying a `USING (true)` policy on `users` to allow the deleted-owner UI branch to read `deleted_at`. The policy is broader than the listing-detail use case requires; this task narrows it.
Sprint:      14 (or 15)

## Pre-read

1. `docs/agent-contract.md` (P0 — INCLUDING clause 6a Positive + Negative flow + clause 10 Files Changed)
2. `docs/backlog.md`
3. `docs/rule-index.md` → "DB / server action / RLS task" bundle:
   - `docs/data-access-rules.md`
   - `docs/domain-rules.md`
   - **`docs/rls-rules.md`** (the canonical RLS doc — this task narrows a policy added in Task 263)
   - `docs/qa-rules.md`
4. Task 258 + Task 263 session logs (the full history of the listing-detail RLS path).
5. `src/app/[locale]/listings/[slug]/page.tsx` (the consumer of the embed JOIN).
6. Grep `select('*').from('users')` + `from('users').select(` to inventory every authenticated-client read of `users` across the app — these are the call sites the current policy exposes.
7. `src/lib/supabase/admin.ts` (service-role client — service-role bypasses RLS, so admin actions are unaffected by either policy).

## Problem statement

Task 263 fixed Bug 4 long-term by removing the `createAdminClient()` bypass from the listing-detail page and applying an RLS policy on `public.users`. The chosen policy after Sonnet's STOP&ASK escalation was:

```sql
CREATE POLICY "authenticated users can read active user profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);
```

`USING (true)` was chosen so that the `ownerDeleted` UI branch in `ListingContact.tsx` continues to work (the code needs to read `deleted_at` to render the "account deleted" card; the narrower `USING (deleted_at IS NULL)` would hide deleted rows entirely).

**Limitation:** RLS policies authorize ROWS, not COLUMNS. With `USING (true)`, any authenticated user can SELECT any column of any users row from the session-aware client — including potentially sensitive columns like `email`, `phone`, `whatsapp` — IF a client-side query asks for them. The current listing-detail projection limits to `id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at`, but other code paths elsewhere in the app are NOT constrained by RLS.

This is not immediately exploitable in shipped UI (no other page exposes `users.*` via the session-aware client beyond the listing detail). It IS a future-proofing concern.

## Current behavior to preserve

- Task 263 outcome unchanged: authenticated viewers on listing detail see real owner data (name, user_type, agency name, contact buttons) via the embed JOIN; deleted-owner UI branch renders correctly; `ownerDataUnavailable` defensive branch retained.
- Guest viewers: existing showGuestCTA branch unchanged.
- Owner self-view: unchanged.
- Service-role admin queries: unaffected (RLS bypassed by service-role).
- No regression to Task 256 (admin email reply), Task 255 (admin reply history), Task 258 (contact card), or Task 263 outcome.

## Required after behavior

Choose ONE of three implementation strategies WITH the orchestrator before writing code (STOP & ASK):

**Strategy A — Database view + narrower RLS.** Create a view `public_user_profiles` exposing only `id, name, avatar_url, user_type, is_verified, company_name, deleted_at` (NOT email, phone, whatsapp). RLS policy on the view (or on the underlying table scoped via the view). Listing-detail page selects from the view. Phone/WhatsApp are conditionally fetched in a separate RLS-protected call when the user clicks WhatsApp/Call. Existing `USING (true)` policy on `users` is dropped or narrowed.

**Strategy B — Column-level RLS via policy-aware function.** Create a SECURITY DEFINER function `get_public_user_profile(target_user_id uuid)` that returns the safe column set. RLS on `users` narrowed to `USING (auth.uid() = id)` (self-read only). Listing-detail page calls the function instead of the embed JOIN.

**Strategy C — Preserve `USING (true)` but explicitly document.** Add `docs/rls-rules.md` entry naming `users` as a public-read table with a documented safe-column policy enforced at the application layer; add a CI / lint check that rejects any new authenticated-client `from('users').select('*')` or any SELECT that names disallowed columns (email, phone, whatsapp without justification). Strategy C is the LEAST architectural change but pushes enforcement to lint, not RLS.

After the chosen strategy is implemented:
1. Owner runs the new RLS / view / function SQL emitted by Sonnet.
2. Listing-detail page renders identically to Task 263 outcome.
3. Grep proof: no authenticated-client query exposes email / phone / whatsapp outside the documented safe surfaces.
4. `npx tsc --noEmit` → 0 errors.

## Positive flow (happy path)

- Actor: authenticated user (post-Strategy implementation).
- Steps (Strategy A example):
  1. User opens any listing detail page → SSR runs embed JOIN against `public_user_profiles` view.
  2. View exposes only safe columns → RLS on view permits authenticated SELECT.
  3. Listing detail renders identically to Task 263 outcome.
  4. User clicks WhatsApp button → a separate server action looks up phone via a tighter RLS path.

## Negative flow (every off-happy-path branch)

- Strategy A: view doesn't expose `deleted_at` → `ownerDeleted` branch breaks. Verify the view DOES expose `deleted_at`.
- Strategy A: view RLS too narrow → embed JOIN returns null for some authed viewers → `ownerDataUnavailable` warning shown (false positive). Verify policy permits all authed viewers.
- Strategy B: SECURITY DEFINER function has a typo → wrong rows returned. Test thoroughly.
- Strategy C: lint rule misses a new code path → drift. Verify the rule is comprehensive.
- Owner has NOT run the new SQL before the code revert ships: the listing-detail page breaks. **Gate the code revert on owner-confirmed SQL** (same pattern as Task 263).
- Deleted owner: must still produce a visible "account deleted" card (test the chosen strategy preserves this).
- Service-role admin paths: unchanged (RLS bypassed).
- Existing Resend / email helpers that look up user data: must be audited — they currently use service-role; verify they continue to work.

## Acceptance criteria

- Chosen strategy (A/B/C) documented in session log with orchestrator approval BEFORE code is written.
- Positive flow step 3 (listing detail renders identically to Task 263) verifiable in runtime check.
- Negative flow → deleted-owner UI branch still works (test).
- Negative flow → orphaned listing still produces `ownerDataUnavailable` warning.
- Grep proof: no new authenticated-client query exposes email/phone/whatsapp outside Strategy-approved surfaces.
- Old `USING (true)` policy DROPPED (or replaced per the chosen strategy).
- `npx tsc --noEmit` → 0 errors; `npm run build` → passes.
- "Files Changed" table in session log per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: `docs/sessions/2026-05-2N-task-266-t8-users-rls-narrowing.md`.

## Out of scope

- Changing the listing-detail contact card UI (Task 258 outcome preserved).
- Changing the `createAdminClient()` policy for other surfaces (this task only touches the post-Task-263 RLS on `users`).
- Designing a comprehensive RBAC overhaul (Epic R already covers permissions).
- Changing phone/whatsapp privacy stance for listing owners (separate product decision).
