# Epic P — Favorites, Guest-Auth & Account Lifecycle

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator.
**Source notes:** issues.txt #17 (guest "Add to favorites" just toggles active instead of opening auth), #18 (guest sees "Account deleted" contact card instead of "Sign in to see contacts"; cross-browser/cookie inconsistency), #19 (after self-delete, header still shows the old profile name), #16 (generated links use localhost instead of lero.al).
**Kickoffs:** P.1 (Task 181), P.2 (Task 182), P.4 (Task 183) are in **Sprint 9** (individual kickoffs); P.3 (Task 185) is in `Epic_P_kickoff_prompts.md`.

> The unifying theme is **deterministic auth/session state**. Notes 17, 18 and 19 are all symptoms of
> the viewer's auth status not resolving cleanly (zombie/stale session cookies producing a truthy
> `authUser` that can't actually read DB rows). Per docs/ai-behavior.md "Auth Lifecycle Rules", these
> must be fixed at the centralized auth layer — NOT with forced reloads or manual cookie clearing.

## Goal

Guests are reliably recognised as guests and routed into the auth flow; the listing contact card shows
the correct state; deleting your account fully clears your identity in the UI; and every generated link
points to lero.al.

## Dependencies

- `src/modules/auth/context/AuthContext.tsx` + `status` lifecycle; `src/lib/auth/*`;
  `src/modules/listings/components/FavoriteButton.tsx` (already has a guest guard keyed on
  `status === 'unauthenticated'`); `src/lib/auth/authSheet.ts` (`openAuthSheet`);
  `src/modules/listings/components/ListingContact.tsx`; `src/app/[locale]/listings/[slug]/page.tsx`.

## Tasks

### Task 181 — P.1 — Guest "Add to favorites" opens the auth flow (Note 17)

**Type:** bug
**Priority:** critical
**Area:** every favorite entry point + AuthContext status lifecycle

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (Auth Lifecycle + Global Change Verification rules)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/state-authority.md
4. `src/modules/listings/components/FavoriteButton.tsx`, `src/modules/auth/context/AuthContext.tsx`,
   `src/lib/auth/authSheet.ts`, and every FavoriteButton consumer (`ListingCard.tsx`, `ListingContact.tsx`,
   `FavoritesShell.tsx`, `ListingsShell.tsx`)

**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** When a guest clicks "Add to favorites", the auth flow (AuthSheet) must open. Today
`FavoriteButton` only opens it when `status === 'unauthenticated'`; for guests the click visibly does
nothing (the heart just shows its active/focus state). Root-cause why `status` isn't resolving to
`unauthenticated` for guests (likely stuck `loading`), fix it at the AuthContext layer, and verify the
behaviour at EVERY favorite entry point (Global Change Verification Rule).

**Acceptance criteria:**
- Guest click on ANY favorite control opens AuthSheet (`login`), at every entry point — not just one.
- `useAuth().status` deterministically resolves to `unauthenticated` for guests.
- No fake fix (no forced reload / cookie purge); root cause addressed at the auth layer.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the contact card (P.2) and post-delete header (P.3), except where they share the
AuthContext root cause — if so, note it and coordinate.

### Task 182 — P.2 — Contact card shows "Sign in", not "Account deleted" (Note 18)

**Type:** bug
**Priority:** critical
**Area:** listing detail owner resolution + ListingContact card states

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (Auth Lifecycle + Data Fetching rules)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/state-authority.md, Task 84 session log (listing contact card for guests)
4. `src/app/[locale]/listings/[slug]/page.tsx` (lines ~223–239: the `ownerRaw ?? {…}` fallback that sets
   `deleted_at: isGuest ? null : 'deleted'`), `src/modules/listings/components/ListingContact.tsx`
   (`ownerDeleted` / `showGuestCTA` logic, lines ~55–60)

**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560.

**Goal:** A guest must see the "Sign in to see contacts" card, never "Account deleted". Root cause: when
the owner row can't be read AND the viewer is treated as authenticated (a stale session makes `authUser`
truthy while RLS still blocks the read), the page's fallback sets `deleted_at:'deleted'` → wrong card.
The cross-browser/cross-OS inconsistency the owner sees is exactly this zombie-session case. Fix
deterministically: validate the session (`getUser`) so a non-readable session is treated as guest, and
distinguish "owner row genuinely deleted" from "couldn't read owner" instead of inferring deletion from
a null row.

**Acceptance criteria:**
- Guest (incl. stale-cookie case) sees "Sign in to see contacts"; a genuinely deleted owner still shows
  the deleted state; an active owner shows contacts to authed users.
- Behaviour identical across browsers/OS for the same auth state (no manual cookie clearing needed).
- No `suppressHydrationWarning`/forced reload/cookie purge hacks; fixed at the auth/data layer.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** favorite flow (P.1) and header (P.3) except shared root cause.

### Task 183 — P.4 — Canonical lero.al URL for all generated links (Note 16)

**Type:** bug
**Priority:** high
**Area:** auth email redirects + any generated absolute link

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md
2. Always-governed: **docs/env.md** ("Canonical site URL rule"), docs/rls-rules.md, docs/component-rules.md
3. docs/integrations.md
4. `src/modules/auth/components/AuthSheet.tsx` (lines ~86, ~183, ~534 use `window.location.origin`);
   confirm the rest of the app already uses `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'`

**Localization coverage:** N/A (URLs, not visible text) — but keep the `/${locale}/…` path segments.
**Responsive coverage:** N/A.

**Goal:** Every absolute link (confirmation/recovery emails, OAuth `redirectTo`, `emailRedirectTo`,
share links) must be built from the canonical `NEXT_PUBLIC_SITE_URL`, never `window.location.origin`
(which becomes `localhost`/preview hosts → broken email links). Introduce/confirm one shared
site-URL helper and replace the `window.location.origin` usages in `AuthSheet`.

**Acceptance criteria:**
- No `window.location.origin` remains in any auth/email/share link path (grep proves it).
- Confirmation/recovery/OAuth links resolve to `https://lero.al/...` in all environments.
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** redesigning the email templates; the unsaved-changes same-origin guard (legitimately
uses `window.location.origin`).

### Task 185 — P.3 — Clear stale profile name in header after self-delete (Note 19)

**Type:** bug
**Priority:** medium
**Area:** header auth state after account deletion

**Pre-read:** `src/components/layout/Header.tsx`, `src/modules/auth/context/AuthContext.tsx`,
account-deletion action (`src/modules/cabinet/actions/index.ts`), Epic D / account-lifecycle session logs;
docs/ai-behavior.md (Auth Lifecycle rules).
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** After a user deletes their own account they are redirected to the homepage, but the header
still shows their old profile name. Clear the auth/session state deterministically so the header
reflects the signed-out state immediately after deletion.

**Acceptance criteria:**
- After self-delete + redirect, the header shows the signed-out state (no stale name) with no manual
  refresh.
- Fixed via the centralized auth layer (no forced reload hack).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** favorites (P.1), contact card (P.2), URL (P.4).

## Epic-level acceptance

Guests are reliably routed to auth; the contact card never falsely says "Account deleted"; self-delete
clears the header identity; and every generated link points to lero.al.
