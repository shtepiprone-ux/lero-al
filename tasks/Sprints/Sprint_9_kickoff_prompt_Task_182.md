# Kickoff prompt — Task 182 (Sprint 9 — P.2: contact card shows "Sign in", not "Account deleted")

> Note 18: a guest sees the "Account deleted" contact card though the owner is active, and it differs by
> browser/OS (a cookie issue). Reproduced from the code: in
> `src/app/[locale]/listings/[slug]/page.tsx` (lines ~223-239), when the owner row can't be read the page
> builds a fallback owner with `deleted_at: isGuest ? null : 'deleted'`. `ListingContact.tsx` (lines
> ~55-60) then shows: `ownerDeleted = !!owner.deleted_at` → "Account deleted"; `showGuestCTA = isGuest &&
> !owner.id && !ownerDeleted` → "Sign in". The bug: a STALE/zombie session makes `authUser` truthy
> (so `isGuest=false`) while RLS still blocks the owner read → fallback sets `deleted_at:'deleted'` →
> false "Account deleted". Fix deterministically at the auth/data layer (NOT manual cookie clearing).
> Shares the AuthContext root cause with Task 181.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: correct the contact-card state for guests/stale sessions. Don't redesign the card
  or the listing page beyond what's needed.
- Do NOT invent architecture. Use the centralized auth layer (validate the session properly). No
  suppressHydrationWarning, no forced reload, no cookie-purge hack (Auth Lifecycle + No Fake Fixes).
- If Task 181 already fixed the AuthContext status lifecycle, REUSE it — do not re-patch locally.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-182-contact-card-account-deleted.md.
- 0 new lint/typecheck errors; governance PASS; all four locales; all 7 breakpoints.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/app/[locale]/listings/[slug]/page.tsx (lines ~211-239: authUser → isGuest; the `ownerRaw ?? {…}`
  fallback that sets `deleted_at: isGuest ? null : 'deleted'`)
- src/modules/listings/components/ListingContact.tsx (lines ~50-60: ownerDeleted / showGuestCTA; the
  card branches at ~117-143 and ~273-288)
- src/modules/auth/context/AuthContext.tsx, src/lib/auth/server.ts (getUser vs getSession)
- docs/ai-behavior.md (Auth Lifecycle + Data Fetching rules), docs/rls-rules.md, docs/state-authority.md

Required investigation:
1. Establish how `authUser` is resolved on the detail page and why a stale/invalid session yields a
   truthy authUser that still can't read the owner row (validate via getUser(), not just a session cookie).
2. Make the viewer be treated as a GUEST when the session is not actually valid for DB reads → so the
   "Sign in to see contacts" card shows, not "Account deleted".
3. Distinguish "owner row genuinely deleted" (real deleted_at) from "couldn't read owner" — do NOT infer
   deletion from a null row. Adjust the fallback so a null owner for an authed-but-unreadable viewer does
   not masquerade as a deleted account.

Acceptance criteria:
- Guests (including the stale-cookie case) see "Sign in to see contacts".
- A genuinely deleted owner still shows the deleted state; an active owner shows contacts to valid authed users.
- Identical behaviour across browsers/OS for the same auth state — no manual cookie clearing required.
- No suppressHydrationWarning / forced reload / cookie purge; fixed at the auth/data layer.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope:
- Favorite flow (Task 181) and post-delete header (Task 185), except the shared AuthContext fix.
```
