# Task 599 — Fix authenticated-header hydration mismatch: make NotificationBell SSR-safe (remove `ssr:false`)

Sprint 44 (Epic MM Phase-2) — follow-up bug from the Header Mantine migration.

> **Owner-confirmed root cause + fix direction (2026-07-15).** For AUTHENTICATED users the homepage
> logs a React hydration mismatch on Mantine Menu/Popover `useId` target ids
> (`id="mantine-_R_..._-target"`) on BOTH the `LocaleSwitcher` and `UserMenu` menus. Diagnosed by the
> orchestrator: `NotificationBell` is rendered via `dynamic(..., { ssr:false })`, so it is ABSENT on the
> server but present (as a lazy boundary) on the client. Because the bell is a sibling of LocaleSwitcher
> and UserMenu inside the header's right-cluster `<div>`, this server↔client tree asymmetry offsets
> React 19's `useId` context for the whole cluster → both menus' target ids diverge. `AuthContext`
> already makes `user` SSR-consistent (UserMenu renders on both sides), so the ONLY divergence is the
> `ssr:false` bell. It reproduces only when authenticated (guest = no bell = no mismatch), which is why
> `check:hydration` (guest-only public routes) went green and Task 582 misfiled it as a "stale HMR
> artifact." **Owner decision: SSR-safe bell** — server-render a deterministic static bell shell, drop
> `ssr:false`, load notification data client-side after mount.

## Pre-read (rule-index → UI/layout + DB/query-hook + regression/critical-flow)

**Always:** `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (this task ADDS a row — see Regression coverage).
**UI:** `docs/mantine-responsive-design-system.md` (§18 theming pitfalls), `docs/tailadmin-style-reference.md` (bell chrome must be unchanged), `docs/ui-rules.md`, `docs/qa-rules.md`.
**Regression:** `tasks/Epics/Epic_RS_Regression_Shield.md`, `docs/agent-contract.md` clause 15.
**State:** `docs/state-authority.md` (SSR vs client authority — the bell shell is SSR authority; notification data is client authority).

## Current state (verified by orchestrator, HEAD d947b147a)

- `src/components/layout/Header.tsx`:
  ```js
  const NotificationBell = dynamic(
    () => import('@/modules/notifications/components/NotificationBell').then(m => m.NotificationBell),
    { ssr: false },
  )
  ...
  notificationSlot={user ? <NotificationBell /> : undefined}
  ```
- `src/modules/notifications/components/NotificationBell.tsx`:
  ```js
  export function NotificationBell() {
    const { notifications, unreadCount, loading, refetch } = useNotifications()
    if (loading) return null                 // ← also a server/client divergence source
    return <NotificationBellView notifications={notifications} unreadCount={unreadCount} onRead={refetch} />
  }
  ```
- `src/modules/notifications/hooks/useNotifications.ts` — **confirmed SSR-safe already:** initial state
  is deterministic (`notifications=[]`, `unreadCount=0`, `loading=true`); ALL Supabase browser-client /
  Realtime / `window` access is inside `useEffect`/`fetchAll` (never at render). No `localStorage` seed.
  → It returns the SAME initial value on the server and on the client's first (hydration) render.
- `NotificationBellView` — the presentational primitive (Mantine `Indicator inline` + `ActionIcon`/
  `MantinePopover`); renders a badge only when `unreadCount > 0` (Task 592). With `unreadCount=0` the
  Indicator is `disabled` (no badge). Do NOT change its public API or chrome.

## Implementation (literal)

### 1. `NotificationBell.tsx` — render a deterministic shell instead of `null`
- Remove `if (loading) return null`. Always render `NotificationBellView` with the current hook state.
  During loading (server render + client hydration) the state is `notifications=[]`, `unreadCount=0`,
  so the shell is: bell `ActionIcon`, NO badge — identical on server and client. After the client-side
  `fetchAll()` resolves (post-hydration state update) it re-renders with real data (normal update, NOT a
  hydration error).
- Do not otherwise change the component's props or the `NotificationBellView` call.

### 2. `Header.tsx` — drop `ssr:false`
- Replace the `dynamic(..., { ssr:false })` wrapper with a normal static import of `NotificationBell`
  (it is already a `'use client'` component and now SSR-safe). If you prefer to keep code-splitting, you
  MAY use `dynamic(..., { ssr: true })`, but a plain import is simplest and removes the lazy boundary
  entirely — **preferred**. The lazy boundary is the asymmetry; it MUST be gone from the server↔client
  delta either way.
- Keep `notificationSlot={user ? <NotificationBell /> : undefined}` exactly as-is (`user` is
  SSR-consistent via AuthContext; do NOT change the auth gating).
- Do NOT touch any other part of `Header.tsx` / `HeaderView.tsx` (LocaleSwitcher, UserMenu, hamburger,
  AuthSheet, the `min-[390px]` wrap — all byte-identical).

### 3. SSR-safety guard check (MANDATORY before claiming complete)
- Confirm `NotificationBell` + `NotificationBellView` + everything they import render on the server with
  NO `window`/`document`/`localStorage`/browser-supabase access at render time (only in effects). If any
  render-time browser access exists, STOP and ASK — do not add a `typeof window` branch (that is itself a
  hydration-divergence source).

## Positive flow (happy path)
Actor: authenticated visitor. Loads `/{locale}`.
1. Server renders the header: LocaleSwitcher + UserMenu + **NotificationBell shell** (bell icon, no badge, `unreadCount=0`, `loading` state).
2. Client hydrates the IDENTICAL shell — no `useId` divergence, **no console hydration error** on LocaleSwitcher or UserMenu target ids.
3. After mount, `useNotifications` `fetchAll()` resolves; the bell re-renders with real `unreadCount`/list via a state update (post-hydration — not a hydration error). Realtime subscription attaches.
4. Success state: header identical server↔client at hydration; notifications populate a beat later; opening the bell works as before.
Post-conditions: zero console errors at load for an authenticated session on every locale; LocaleSwitcher/UserMenu `useId` target ids identical in server HTML and hydrated DOM.

## Negative flow (every off-happy-path branch)
- **Guest (unauthenticated):** `user=null` → `notificationSlot=undefined` → no bell on server AND client → tree identical → no error. (Unchanged; verify it stays clean.)
- **`useNotifications` returns empty / error (no rows, RLS deny, network fail):** `data ?? []` → shell stays (bell, no badge); no crash, no console error. Verify.
- **`loading` still true at hydration:** shell renders (bell, no badge) on both sides → match. (This is the fix — must NOT be `null` anymore.)
- **Realtime update arrives:** `fetchAll()` re-runs post-hydration → badge/count update via state; no hydration error (client-only update).
- **Notifications with locale-formatted dates once populated:** rendering happens only AFTER mount (client), never in the SSR shell (empty list) → no SSR/CSR date-format divergence introduced.
- **SSR crash from render-time browser access:** must be impossible — see step 3 guard. If found, STOP and ASK.

## Mobile <640 full-width gate (clause 11)
No new interactive surface is added; the bell trigger is an **icon-only `ActionIcon`** — documented
icon-only exemption from the full-width rule (unchanged from current). The bottom-sheet notification
panel behavior (`NotificationBellView`/`MantinePopover`) is unchanged. Provide rendered proof the header
is visually byte-identical to before at the canonical breakpoints × sq/en/uk/it (**uk@320/375/390
mandatory**), authenticated, with the bell shell present — no layout shift vs the pre-fix render.

## TailAdmin conformance (clause 16)
Zero chrome change — the bell shell reuses the existing `NotificationBellView` trigger exactly. Do NOT
introduce any new color/px/radius/shadow. Rendered side-by-side (before/after) must show an identical
bell button.

## Regression coverage (clause 15) — MANDATORY, this is the gap that hid the bug
The existing `scripts/check-hydration-console.mjs` only navigates PUBLIC routes as a GUEST (`/en`,
`/en/listings`, `/sq`, `/uk`) and authenticated coverage exists ONLY for `/admin/*`. The authenticated
PUBLIC homepage header — the exact failing state — has NO coverage. Close it:
1. **Extend `planRoutes`/`runChecks`** so that WHEN a session is provided (`HYDRATION_GATE_STORAGE_STATE`
   / `HYDRATION_GATE_COOKIES`), the gate ALSO navigates `/en` (and `/uk`) **authenticated** — i.e. an
   authenticated-homepage route that renders the bell + UserMenu. Keep the existing guest navigation too
   (both states matter). Mark the authenticated-homepage route `notRealCoverage` when no session is set
   (never a false PASS), mirroring the admin-route gating already in the file.
2. **Planted-violation proof (both directions):** temporarily restore `ssr:false` (or `if (loading)
   return null`) → run the gate against an authenticated homepage session → it MUST FAIL with the
   `useId`/hydration pattern → revert → re-run → PASS. Paste both transcripts. A no-op gate is a task
   failure.
3. **Add a `docs/critical-flow-registry.md` row:** "Authenticated header hydration — NotificationBell
   SSR shell (no `ssr:false`)", route `/{locale}` authenticated, happy = no console hydration error,
   failure = `ssr:false`/`return null` reintroduced, covered by `check:hydration -- --with-admin` (or the
   new authenticated-homepage flag) with the planted-violation transcript. Set coverage status.
4. `useNotifications` already has hook-level coverage (Task 596 — `.select()` columns); do NOT duplicate.

## Acceptance criteria (each verifiable in the diff)
1. `Header.tsx` — `dynamic(..., { ssr:false })` for NotificationBell removed (plain import or `ssr:true`); `notificationSlot={user ? <NotificationBell/> : undefined}` unchanged; nothing else in Header/HeaderView changed. (file:line)
2. `NotificationBell.tsx` — `if (loading) return null` removed; always renders `NotificationBellView` (empty shell during loading). (file:line)
3. `useNotifications` / `NotificationBellView` — unchanged public API; confirmed no render-time browser access (SSR-safe).
4. Authenticated `/{locale}` produces ZERO console hydration errors; LocaleSwitcher + UserMenu `useId` target ids identical server HTML ↔ hydrated DOM — rendered/console evidence in the session log.
5. `check:hydration` extended to cover an authenticated homepage; planted-violation FAIL transcript + reverted PASS transcript both pasted; `critical-flow-registry.md` row added with coverage status.
6. Gates: `tsc --noEmit`=0, eslint clean, `check:i18n`, `check:stories`, `check:file-integrity`, `check:mojibake` green; full `src/modules/notifications/` suite green. Rendered matrix (breakpoints × sq/en/uk/it, uk@320/375/390) of the AUTHENTICATED header showing the bell shell + no layout shift.
7. Session log: AC-by-AC self-audit table, "Files Changed" table (one row per touched path), UX flow trace, before/after control inventory (bell/LocaleSwitcher/UserMenu all preserved). `docs/backlog.md` updated. NO `git add`/`git commit` (orchestrator emits at review, single-writer).

## Hard contract
No scope change beyond the files above; do NOT restyle the bell or touch LocaleSwitcher/UserMenu/
hamburger/AuthSheet; do NOT add a `typeof window` branch or any non-deterministic render-time value;
if any deleted symbol/behavior turns out to have another consumer or the SSR-safety guard fails, STOP
and ASK; self-validate before "complete"; "Files Changed" table required; executor emits NO git.
