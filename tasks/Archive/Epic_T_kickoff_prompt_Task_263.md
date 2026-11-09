# Task 263 — T.7 — Listing-detail contact card: replace `createAdminClient()` with RLS-respecting client

Type:        chore (security / architectural cleanup)
Priority:    medium
Area:        listings / SSR / auth / RLS
Filed by:    Task 258 review (Opus 4.7) on 2026-05-27 — Sonnet violated the STOP&ASK clause in the Task 258 kickoff by choosing service-role bypass instead of the RLS policy alternative.
Sprint:      14 (queued)

## Pre-read

1. `docs/agent-contract.md` (P0 — INCLUDING clause 6a Positive + Negative flow)
2. `docs/backlog.md`
3. `docs/rule-index.md` → "DB / server action / RLS task" bundle:
   - `docs/data-access-rules.md`
   - `docs/domain-rules.md`
   - **`docs/rls-rules.md`** (the canonical RLS doc — this task exists because we currently bypass it)
   - `docs/qa-rules.md`
4. Task 258 session log: `docs/sessions/2026-05-27-task-258-t5-contact-card-owner.md` → includes the idempotent RLS policy SQL the orchestrator-recommended path uses.
5. `src/app/[locale]/listings/[slug]/page.tsx` (the page currently using `createAdminClient()` for the owner row).
6. `src/lib/supabase/admin.ts` (service-role client — confirm no other lawful caller depends on the current admin-client read of `users` from this page).

## Problem statement

Task 258 fixed Bug 4 ("N/A · Приватна особа") by switching the listing-detail page's owner-row fetch from the session-aware embed JOIN (blocked by RLS) to `createAdminClient()` (service role, RLS-bypassing). This works, but:

- The Task 258 kickoff explicitly said: *"confirm with orchestrator before adding phone/whatsapp to the public-readable set; STOP & ask"*. Sonnet did not stop and ask; it chose a broader bypass.
- Service-role on a public-facing SSR page is an architectural anti-pattern (see `docs/rls-rules.md`). The data exposed happens to be the same data the existing WhatsApp/Call action buttons already exposed, so net privacy surface is unchanged — but the bypass remains a tech-debt risk:
  - Any future column added to the SELECT projection will silently bypass RLS.
  - Reviewers can't reason about the access boundary from RLS alone.

## Goal

Replace the `createAdminClient()` owner-row fetch with a properly-scoped RLS policy on the `users` table that allows authenticated users to SELECT the contact-card columns of the listing's owner row.

## Current behavior to preserve

- Authenticated viewers continue to see real owner data (name, user_type, agency name, contact buttons) — no regression to the Task 258 outcome.
- Guests continue to see the sign-in CTA (existing `showGuestCTA` branch).
- Deleted-owner branch (`ownerDeleted`) unchanged.
- Zombie-session branch (treated as guest) unchanged.
- `ownerDataUnavailable` defensive warning branch (added by Task 258) — still rendered if the SELECT genuinely returns null for an authed viewer (RLS misconfiguration / orphaned listing).

## Required after behavior

As an authenticated user viewing any listing detail page in any of the four locales:
1. Owner name, user_type, company_name, avatar, contact buttons all render exactly as after Task 258 — no functional change.
2. The page code uses the session-aware `createClient()` (NOT `createAdminClient()`) for the owner row.
3. The RLS policy on `users` permits authenticated SELECT of: `id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at` — and ONLY those columns (no `email`, no `password_hash`, no audit columns).

## Positive flow (happy path)

- Actor: authenticated user.
- Preconditions: owner Task 258 RLS SQL has been applied to the production DB (orchestrator emits the SQL into the session log; owner runs in PowerShell — Sonnet does NOT run SQL).
- Steps:
  1. Sonnet emits the idempotent RLS policy SQL into the session log (copy of Task 258 session log's policy block).
  2. Owner applies the SQL.
  3. Sonnet revises `src/app/[locale]/listings/[slug]/page.tsx`:
     - Removes the `createAdminClient()` import and the admin-client query.
     - Restores the embed JOIN: `owner:users!listings_user_id_fkey(id, name, phone, whatsapp, avatar_url, user_type, is_verified, company_name, deleted_at)` — which was the pre-Task-258 query.
     - Keeps the `ownerDataUnavailable` defensive branch (in case the policy is misconfigured in a future regression).
  4. Authenticated viewer opens any listing detail page → owner card renders correctly.
- Post-conditions:
  - Owner row visible to authed viewer via RLS (not service-role).
  - `grep -r "createAdminClient" src/app/[locale]/listings/` returns 0 hits (or only unrelated hits explicitly documented).

## Negative flow (every off-happy-path branch)

- Owner has not yet applied the RLS SQL when Sonnet ships the code revert: the embed JOIN will return null for authed viewers → the `ownerDataUnavailable` warning shows. **DO NOT ship the code revert until the owner confirms the SQL ran.** Block on owner action; document in session log.
- Guest viewer: existing fallback path (no auth → no admin query previously → RLS-block-on-embed → fallback placeholder → `showGuestCTA = true`). Verify unchanged.
- Owner viewing their own listing: RLS policy `auth.uid() = id` always permits self-read → embed JOIN returns own row. Verify unchanged.
- Deleted owner: `deleted_at` is in the SELECT projection → fallback to `ownerDeleted` branch in the component (unchanged).
- Orphaned listing (owner row genuinely gone): embed returns null → `ownerDataUnavailable` warning. Verify the defensive branch still works.
- A column not in the policy's allowed set is added to the SELECT in a future regression: RLS blocks the row → `ownerDataUnavailable` warning fires; reviewers see the regression loudly (this is the whole point of switching back to RLS).
- Zombie session: existing `hasValidProfile` check still routes to guest path. Verify unchanged.

## Acceptance criteria

- Positive flow step 3 (page.tsx reverts to embed JOIN, removes admin-client import) verifiable in diff at `src/app/[locale]/listings/[slug]/page.tsx:<line>`.
- Negative flow → guest / owner-self / deleted-owner / orphaned / zombie all preserved (cross-check inventory in session log).
- RLS SQL emitted in session log (idempotent, with `CREATE POLICY IF NOT EXISTS` or `DROP POLICY IF EXISTS … CREATE POLICY …` pattern).
- Owner confirms SQL ran BEFORE the code revert ships (commit gated on owner confirmation).
- `grep` proof: no `createAdminClient` reference in `src/app/[locale]/listings/[slug]/` after the change.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: `docs/sessions/2026-05-2N-task-263-t7-contact-card-rls-cleanup.md`.

## Out of scope

- Adding RLS policies on other tables (separate audit task if needed).
- Changing the SELECT projection (no new columns; no removed columns beyond what RLS permits).
- Privacy redesign of phone/whatsapp exposure (separate product decision).
- Changing the `ownerDataUnavailable` branch (Task 258 added it; preserve as-is).
