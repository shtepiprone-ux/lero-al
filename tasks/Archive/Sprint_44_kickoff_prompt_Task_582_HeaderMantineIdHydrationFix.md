# Task 582 — Header: fix the Mantine `useId` target-id hydration mismatch (`mantine-_R_…_-target`)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** Bug fix — SSR/client hydration mismatch (critical-flow / clause 15). **Priority: P0 (owner, 2026-07-11).**
**Depends on:** Task 574/575/576/577/581 landed (Header now fully on Mantine overlays).
**Pre-read:** `agent-contract.md`, `backlog.md`, `critical-flow-registry.md` (P1 hydration rows 96–98), `docs/qa-rules.md`
(hydration detector + Actionable Error-Toast), `docs/mantine-responsive-design-system.md` §18 (Mantine theming/SSR
pitfalls), `docs/ui-rules.md`. This is a DB/RLS-free client-hydration bug — no schema/RLS pre-read.

## Why (owner-captured 2026-07-11)

The owner captured a **live console hydration error on every page** (the `Header` renders in
`src/app/[locale]/layout.tsx:49` → so it fires app-wide). React reports a server/client attribute mismatch on the
`MantineDropdownMenu` **Menu/Popover target button** (the `LocaleSwitcher` trigger):

```
<button … aria-haspopup="menu" aria-expanded={false}
+  id="mantine-_R_2kt35rlmlb_-target"   (client)
-  id="mantine-_R_ajkd5rlmlb_-target"   (server)
>
    at LocaleLayout (src/app/[locale]/layout.tsx:49) → <Header />
```

**This is NOT the bug Task 574 fixed.** Task 574 removed the **base-UI** `useId` variant (`id="base-ui-_R_…"`) by
migrating Header/LocaleSwitcher onto Mantine primitives, and the Sprint-44 regression gate only guards the
`base-ui-_R_` pattern. The id now diverging is **Mantine-generated** (`mantine-_R_…_-target`, from Mantine's own
`useId` inside `Menu`/`Popover`). `check:hydration` passed green in the 574 review because its detector matches the
old pattern, not this one — so this class is **currently uncaught by any gate**.

## Root-cause diagnosis FIRST (do this before writing any fix)

The id differing between server and client means the **React tree path to that button differs between SSR and the
first client render**, which shifts Mantine's `useId`. Diagnose the actual trigger — do NOT guess-patch. Investigate,
in order, and record findings in the session log:

1. **`useUser()` / `initialUser` in `Header` (prime suspect).** `Header` renders conditional, `useId`-consuming
   Mantine subtrees gated on `user`: the desktop user menu `{user && <MantineDropdownMenu … />}` (line ~154) and the
   `notificationSlot={user ? <NotificationBell /> : undefined}` passed to `HeaderActions`. If `user` is truthy on the
   server render but not on the first client render (or vice-versa) — i.e. `AuthProvider`'s `initialUser` does not
   match what `useUser()` returns on the client's first paint — the rendered tree count/shape differs and every
   subsequent Mantine `useId` (including the `LocaleSwitcher`'s Menu target) shifts. Confirm what `useUser()` returns
   on the server vs the client's first render for both logged-in and logged-out sessions.
2. **`NotificationBell` `dynamic(… , { ssr:false })` slot.** Confirm whether the `ssr:false` boundary changes the
   child count between the server HTML and the first client render in a way that shifts sibling `useId`s. (A correct
   `ssr:false` renders nothing on the server AND nothing on the first client render, then swaps in — verify this is
   actually the case here and not the source of the shift.)
3. **`useResponsiveDropdown()` / `useMediaQuery` in `MantineDropdownMenu`.** It documents `getInitialValueInEffect=true`
   so `isMobile=false` on SSR and on the first client render (consistent). Confirm this is genuinely stable and not
   re-evaluating during hydration.
4. **Mantine `useId` across the RSC/client boundary generally.** Verify the app has a single, correctly-mounted
   `MantineProvider` above `Header` and that no double provider / duplicated React tree is producing divergent ids.

Write the confirmed root cause into the session log BEFORE the fix. **If the true cause lies outside
`Header.tsx` / `LocaleSwitcher.tsx` / `HeaderActions.tsx` / `MantineDropdownMenu.tsx` /
`responsiveBottomSheet.tsx` / the `useUser`/`AuthProvider` client-init path — or if the minimal fix would change a
primitive's public API or architecture — STOP and ASK the orchestrator. Do not invent architecture (clause 2).**

## Files likely in scope (confirm via diagnosis; do not exceed without STOP-AND-ASK)

- `src/components/layout/Header.tsx` and/or `src/modules/auth/**` (`useUser`/`AuthProvider` initial-value path) — the
  most probable fix site (make the server render and the first client render produce an identical tree; e.g. render
  the `user`-gated subtrees from an SSR-stable initial value so no post-hydration count shift occurs).
- `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` — ONLY if the diagnosis proves the primitive itself is
  the source; if so, the fix must be behavior-preserving and its public API unchanged (STOP-AND-ASK if the API must
  change).
- `scripts/check-hydration*.mjs` + `docs/critical-flow-registry.md` — regression coverage (below), REQUIRED.

**MUST NOT touch:** locale JSON, routing, RLS/DB, any surface unrelated to the diagnosed cause.

## Current behavior to PRESERVE / required after-behavior

- **Preserve:** every Header behavior unchanged — locale switch (`switchLocale` → `setAdminLocale` + `router.push`),
  desktop user menu items + order + admin role-gate + new-tab, mobile hamburger drawer + all its actions,
  `HeaderActions` favorites/auth, `NotificationBell` gating, the one-switcher-per-breakpoint result of Task 577, the
  full-width bottom-sheet behavior of every overlay at <640, and TailAdmin chrome (clause 16 — zero style drift).
- **Required after:** **zero hydration console errors on `/{locale}` for all 4 locales, both logged-in and
  logged-out**, specifically no `mantine-_R_…_-target` (nor `base-ui-_R_`) id mismatch on the `LocaleSwitcher` /
  user-menu triggers. The rendered output is byte-identical; only the id-stability defect is removed.

## Positive / Negative flow

- **Positive:** load `/{locale}` (each of sq/en/uk/it) as a guest and as a logged-in user → console shows **0
  hydration violations**; the `LocaleSwitcher` trigger, desktop user menu, and mobile hamburger all still open and
  operate exactly as before; locale switch still routes and re-renders.
- **Negative:** confirm the fix does not merely suppress the console message while leaving a real DOM divergence —
  the server HTML `id` and the hydrated client `id` for the target button must be **identical**, verified in the
  regression test. Logged-out vs logged-in must both be clean (the `user`-gated branch is the suspected trigger).
  No new flash, no layout shift, no double-render of the menu.

## Regression coverage (clause 15 — MANDATORY, this touches a critical flow)

This bug is exactly the class Epic RS exists for (silent hydration regression while `tsc`/`build`/`lint` are green).

- **Baseline (bug reproduced):** add/extend an automated hydration check that loads the `Header` route(s) and FAILS on
  the current `mantine-_R_…` target-id mismatch. Record the RED baseline (the failing transcript) BEFORE the fix.
- **Extend the detector:** `check:hydration` currently matches `base-ui-_R_`. Extend it to also catch the
  **`mantine-_R_…_-target`** (and, more robustly, React's generic hydration-mismatch console signature) so this class
  can never pass silently again. Keep the existing `base-ui-_R_` coverage.
- **Green after fix:** the same check PASSES post-fix for all 4 locales × {guest, logged-in}.
- **Planted-violation proof:** show the extended gate FAILS on a deliberately re-introduced mismatch (transcript),
  proving it is not a no-op. Revert the plant.
- **Registry:** update the `docs/critical-flow-registry.md` "P1 — i18n / hydration / mobile contract" Header row
  (added by Task 574) — record this `mantine-_R_` variant, the new detector pattern, and the coverage status.

## Gates

- **File-integrity (clause 14):** every touched file 0 NUL / no BOM / parses / not truncated — paste the green
  transcript. Orchestrator re-verifies natively.
- `tsc=0`, `eslint` clean on touched files, `check:stories` + `check:i18n` unchanged/green.
- **Rendered:** the visible Header is unchanged, so the standing `screenshots:assert -- --mantine-only` must stay
  byte-identical to the Task-577 baseline (628/602/0/26) — prove zero regression. Mobile <640 full-width (clause 11)
  and TailAdmin (clause 16) unchanged. A full render matrix is not the core proof here — **the hydration transcript
  (RED→GREEN + planted FAIL) is** (clauses 12/13 satisfied by the unchanged baseline + the hydration gate).
- **No `git add`/`git commit` by Sonnet.** Session log includes: confirmed root cause, Files-Changed table, AC
  self-audit, the RED-baseline + GREEN-after + planted-FAIL hydration transcripts.

## Acceptance criteria

1. The confirmed root cause of the `mantine-_R_…_-target` server/client id mismatch is documented in the session log
   (which hook/tree divergence, proven — not hypothesised). *(session log)*
2. The fix makes the server render and the first client render produce an identical tree so the Mantine `useId`
   target id is stable; `/{locale}` (sq/en/uk/it) × {guest, logged-in} shows **0 hydration console errors**. *(hydration transcript)*
3. All Header behavior preserved (locale switch, user menu, hamburger, favorites/auth, one-switcher-per-breakpoint,
   <640 bottom sheets, TailAdmin chrome) — rendered output unchanged; `screenshots:assert -- --mantine-only`
   byte-identical to the 577 baseline. *(render + diff)*
4. `check:hydration` extended to catch the `mantine-_R_` / generic hydration-mismatch class (existing `base-ui-_R_`
   coverage kept); RED baseline recorded, GREEN after fix, planted-violation FAIL transcript present; registry row
   updated. *(transcripts + registry diff)*
5. `tsc=0`/lint/`check:stories`/`check:i18n` green; file-integrity clean; Files-Changed table + AC self-audit in the
   session log; NO `git add`/`git commit` emitted by Sonnet. *(transcripts)*
