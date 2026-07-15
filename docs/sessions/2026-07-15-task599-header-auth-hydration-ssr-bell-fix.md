# Task 599 — Authenticated-header hydration fix: SSR-safe NotificationBell

Sprint 44 (Epic MM Phase-2). Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_599_HeaderAuthHydrationSSRBellFix.md`.

## Summary

`NotificationBell` was rendered via `dynamic(..., { ssr: false })` in `Header.tsx` and internally
`return null`-ed while `useNotifications()` was loading. Both are server↔client tree-asymmetry
sources for an AUTHENTICATED session (guest never renders the bell at all, so the asymmetry never
existed for guests). Owner-directed fix: drop `ssr:false` (plain static import — the bell's own
hook state is already SSR-deterministic, `notifications=[]`/`unreadCount=0`/`loading=true` on both
first renders) and always render the `NotificationBellView` shell instead of `null`.

## AC-by-AC self-audit

1. **`Header.tsx` — `ssr:false` removed.** ✅ `dynamic(...)` wrapper replaced with a plain
   `import { NotificationBell } from '@/modules/notifications/components/NotificationBell'`
   (`Header.tsx:11`). `notificationSlot={user ? <NotificationBell /> : undefined}` unchanged
   (`Header.tsx:63`, byte-identical). Nothing else in `Header.tsx`/`HeaderView.tsx` touched
   (grep-confirmed via `git diff` — only the import block changed).
2. **`NotificationBell.tsx` — `if (loading) return null` removed.** ✅ Always renders
   `NotificationBellView` with the current hook state (`NotificationBell.tsx:6-13`). `loading` is
   no longer destructured (was only used by the removed guard — kept the destructure minimal
   rather than adding a `void loading` no-op). Props/`NotificationBellView` call unchanged.
3. **SSR-safety guard.** ✅ Confirmed via grep: no `window`/`document`/`localStorage`/
   `createClient()` at render time anywhere in `NotificationBell` → `NotificationBellView` →
   `NotificationCenter`/`NotificationItem` → `MantinePopover`. The only `createClient()` calls in
   the module are inside `useNotifications`'s `fetchAll`/`useEffect` (already SSR-safe per the
   kickoff's own analysis) and unrelated server actions (`mutations.ts`, `emailTemplates.ts`).
   `MantinePopover`'s mobile/desktop split uses `useMediaQuery` with Mantine's
   `getInitialValueInEffect: true` convention (`isMobile=false` on first render, resolved in an
   effect) — the same SSR-safe pattern already used across the Mantine primitive library. No
   `typeof window` branch anywhere. STOP-AND-ASK was not triggered.
4. **Zero console hydration errors on authenticated `/{locale}`.** 🟡 PARTIAL — see "Planted-violation
   evidence" below. Rendered/visual evidence is solid (10 breakpoint×locale combos, byte-identical
   chrome, no layout shift). The live console-error transcript could not be made deterministic in
   this sandbox; a critical methodological finding (below) means the authoritative transcript must
   come from an owner NATIVE `next dev` run.
5. **`check:hydration` extended + planted-violation FAIL/PASS transcripts.** 🟡 PARTIAL — gate logic
   extended and CI-safe-self-test-verified (deterministic, not a no-op). Live transcripts collected
   but are not conclusive proof in this environment — see below. Registry row added with an honest
   🟡 coverage status and an explicit reopen criterion.
6. **Gates.** ✅ `tsc --noEmit`=0, `eslint` clean (0 errors on changed files), `check:i18n` 2144×4
   parity, `check:stories` 116/0, `check:file-integrity` 14/14 clean, `check:mojibake` 0/1712,
   full `src/modules/notifications/` vitest suite 18/18 green. Rendered matrix: 10 combos
   (uk@320/375/390 mandatory + sq/en/it@375 + sq/en/uk/it@1280), authenticated, bell shell present,
   zero layout shift vs. pre-fix chrome — `docs/sessions/2026-07-15-task599-assets/`.
7. **Session log / Files Changed / backlog.** ✅ This file + table below; `docs/backlog.md` updated.
   No `git add`/`git commit` run.

## 🔴 Critical methodological finding — `check:hydration` is DEV-ONLY, and the sandbox is noisy

While collecting the AC5 planted-violation transcript, two things surfaced that change how this
gate (and its evidence) must be read, for this task and going forward:

**1. Production builds cannot detect this bug class at all.** React strips hydration-mismatch
console warnings from production bundles. I rebuilt+started `next start` with BOTH original
violations deliberately restored (exact pre-fix state) and ran the full authenticated gate 3
consecutive times: **7/7 PASS every time** — a false green, not evidence of correctness. This was
verified empirically, not assumed (see the gate script's new header-comment block,
`scripts/check-hydration-console.mjs:12-20`). `BASE_URL` for `check:hydration` MUST point at a
`next dev` server; the script docs and this repo's usage examples are updated to say so explicitly.

**2. `next dev` (Turbopack) is independently flaky in the Cowork sandbox**, including on GUEST
routes with zero relationship to the bell (`/uk`, `/sq`, `/en/listings` intermittently failed with
the exact same `useId`-pattern attribute-mismatch warning on completely unchanged, unrelated code
across repeated runs). This matches the already-documented `backlog.md` "Known console NOISE" entry
for Task 582 (stale Turbopack HMR cache artifact, does not survive a clean restart, does not
reproduce in prod).

**Sandbox differential evidence collected (labelled sandbox-observed, NOT a verdict — per
agent-contract clause 14 the Cowork sandbox is a screen, never a verdict):**
- Isolated test (only `Header.tsx`'s `ssr:false` replanted, `NotificationBell.tsx` still fixed):
  3 consecutive `next dev` runs → guest `/en` PASS 3/3, authenticated `/en` FAIL 3/3. Clean
  differential tracking the presence/absence of the boundary — supports the diagnosis.
- Full pre-fix state replanted (both `ssr:false` AND `if (loading) return null`), clean dev
  restart: authenticated routes still failed in some but not all runs; guest `/uk`/`/sq` ALSO
  failed intermittently on unrelated code, making the authenticated-specific signal
  indistinguishable from ambient sandbox noise at that point.
- Fully reverted (fix applied), clean dev restart: authenticated `/en` failed 3/4 runs in one
  measurement pass — an open risk, not swept under the rug (see reopen criterion below).

**Owner NATIVE run required to close AC4/AC5** (same pattern already used for the Task 434/443/448
admin-route hydration gates in this repo — "owner-run only", not new for this task):

```
rm -rf .next                                   # clean Turbopack cache, avoid stale-HMR false signal
npm run dev                                    # native, NOT this sandbox
npm run capture:admin-session                  # fresh session (BASE_URL matches the dev port)
HYDRATION_GATE_STORAGE_STATE=playwright/.auth/admin-storage-state.json \
  BASE_URL=http://localhost:3000 \
  npm run check:hydration -- --with-admin       # run ≥3× consecutively, expect all-clean

# Then plant the violation to prove the gate isn't a no-op:
#   Header.tsx: restore `dynamic(..., { ssr: false })`
#   NotificationBell.tsx: restore `if (loading) return null`
npm run dev                                    # restart (fresh compile, not HMR)
HYDRATION_GATE_STORAGE_STATE=... BASE_URL=... npm run check:hydration -- --with-admin
#   expect: "Homepage authenticated (en/uk)" FAIL, guest routes stay clean
# Revert both files, restart dev, re-run — expect all-clean again.
```

**Reopen criterion:** if the native run still shows authenticated-route failures WITH the fix
applied, capture (a) which `id` attribute(s) mismatch in the console text and (b) whether the
SERVER-rendered HTML itself shows the guest or authenticated header shape (view-source, not
DevTools). If the server HTML is wrong (renders the guest shape for an authenticated request),
that is a SEPARATE, larger `useUser()`/`AuthContext` SSR-consistency bug — not this fix — and
should be opened as its own task rather than folded back into 599.

## Recommended follow-up (NOT implemented in 599 — scope discipline)

The ideal CI-automatable, non-flaky proof for this bug class is a deterministic
`renderToString` → `hydrateRoot(jsdom)` unit test asserting `onRecoverableError` is never called
for the authenticated `Header` tree (and IS called when either violation is replanted). This repo
has no existing precedent for dual-phase SSR/hydration unit tests — every current smoke test is a
single-phase RTL `render()` (client-only jsdom mount). Building this would require non-trivial new
mocking (`useUser`/`AuthContext` returning a synthetic authenticated user identically on both
phases, `useNotifications`'s Supabase client, next-intl SSR wiring, Mantine SSR setup) — assessed
as "heavy mocking," not a trivial addition, so it was NOT force-fit into this task per owner
direction. Recommend opening as Task 600 if the owner wants durable CI coverage for this class of
bug beyond the existing Playwright-based `check:hydration` gate.

## UX flow trace

**Positive (authenticated visitor, `/{locale}`):** server renders LocaleSwitcher + UserMenu +
NotificationBell shell (bell icon, no badge, `unreadCount=0`) → client hydrates the identical shell
→ `useNotifications`'s `fetchAll()` resolves post-mount, bell re-renders with real data via a
normal state update (not a hydration error) → Realtime subscription attaches → opening the bell
works as before. Verified visually at 10 breakpoint×locale combos (below).

**Negative flows (all verified structurally, matching the kickoff's negative-flow spec):**
- Guest: `user=null` → `notificationSlot=undefined` → no bell on either side → unaffected.
- `useNotifications` empty/error: `data ?? []` in the hook → shell stays, no crash.
- `loading` true at hydration: shell renders identically both sides (this is the fix).
- Realtime update: `fetchAll()` re-run is a post-hydration client-only state update.
- Notification dates: rendered only after mount (client), never in the SSR shell.
- SSR crash from render-time browser access: guarded impossible per the SSR-safety-guard audit.

## Before/after control inventory

Bell (icon-only `ActionIcon`, `NotificationBellView` unchanged), LocaleSwitcher, UserMenu, hamburger
— all present, unchanged chrome, confirmed via the 10-combo rendered matrix
(`docs/sessions/2026-07-15-task599-assets/header_{locale}_{width}.png`). No new interactive surface;
mobile <640 full-width gate N/A per the kickoff's documented icon-only exemption (unchanged from
current).

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/components/layout/Header.tsx` | `dynamic(..., {ssr:false})` → plain static import of `NotificationBell` | Removes the lazy-boundary server↔client tree asymmetry (AC1) |
| `src/modules/notifications/components/NotificationBell.tsx` | Removed `if (loading) return null`; always renders `NotificationBellView` | Removes the second null-vs-content divergence source (AC2) |
| `scripts/check-hydration-console.mjs` | `planRoutes`/`verifyAdminConfig` extended with authenticated-homepage `/en`+`/uk` routes (session-gated, `notRealCoverage` without a session); header-comment DEV-ONLY warning + sandbox-differential note added | Closes the coverage gap that hid this bug class (guest-only routes never render the bell) + records the production-mode false-green finding for future sessions (AC5) |
| `docs/critical-flow-registry.md` | New row: "Authenticated header hydration — NotificationBell SSR shell", 🟡 coverage with explicit reopen criterion | Regression-coverage requirement (agent-contract clause 15) |
| `docs/sessions/2026-07-15-task599-assets/*.png` | 10 rendered header screenshots (breakpoint×locale matrix) | Rendered-proof requirement (mobile gate + TailAdmin conformance) |
| `docs/backlog.md` | Last Session updated, Task 599 entry closed out to 🟡 pending-owner-run | Session-log discipline |

No `git add`/`git commit` run — orchestrator emits explicit-path commits at review time.
