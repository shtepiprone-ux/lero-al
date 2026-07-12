# Task 580 — `Header` thin-container audit + final parity matrix

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_580_HeaderThinContainer.md`.
Depends on Tasks 575–579 (all landed/approved).

## Why

Closing task for the Header decomposition: confirm `Header.tsx` is genuinely a thin container
(hooks + side effects + composition only, no leftover presentational JSX) and prove end-to-end
parity with the pre-decomposition Header across breakpoints × locales.

## Kickoff/reality discrepancy found (documented, not a code change)

The kickoff (and the Sprint 44 plan's task table) still describes **five** primitives, including a
separate `MobileLocaleSwitcher`. That is stale: Task 577 (owner decision, 2026-07-11, recorded in
`docs/backlog.md`) **deleted** the separate mobile-combobox locale switcher as a redundant parallel
implementation — one canonical adaptive `LocaleSwitcher` now covers all breakpoints. `grep -rn
"MobileLocaleSwitcher" src/` → 0 matches; no such component or story exists, and none should.
This audit therefore verifies the real, current composition: **four** primitives —
`HeaderActions`, `LocaleSwitcher`, `UserMenu`, `MobileNavDrawer` — not five. This is a pre-existing,
owner-authorized re-scope from a prior task, not a decision made in this session.

## Current behavior inventory (before this audit — Note 20/22 style)

`Header.tsx` composition, read from source (`src/components/layout/Header.tsx`):
- Hooks: `useTranslations('common')` (aria label only), `useLocale`, `useRouter`, `useUser`,
  `useState` ×3 (`mobileOpen`, `authOpen`, `authView`).
- Side effects: `AUTH_SHEET_EVENT` window listener (`useEffect`), dynamic `NotificationBell`
  (`ssr:false`).
- Callback builders: `openAuthSheet`, `switchLocale` (calls `setAdminLocale` + `router.push`),
  `handleLogout` (calls `signOut` + `router.push`).
- Renders: header shell (`<header>`/container div — layout skeleton, not an extracted primitive
  concern), Logo `<Link>`, desktop `NavLinks` (module-level, kept there intentionally per the
  in-file comment to avoid a hydration `useId()` fiber-shift regression — this is documented
  existing behavior, not new), `LocaleSwitcher` (one instance), `HeaderActions`, `UserMenu`
  (desktop-only, authenticated), the hamburger `ActionIcon` trigger (container-owned per Task 579's
  STOP-AND-ASK #A resolution — the primitive is controlled and supplies no trigger), `MobileNavDrawer`,
  `AuthSheet`.
- No inline dropdown-menu/drawer-body/overlay JSX remains — all such surfaces were extracted in
  Tasks 575 (`HeaderActions`), 576 (LocaleSwitcher story cleanup), 577 (dedup), 578 (`UserMenu`),
  579 (`MobileNavDrawer`).

## Audit findings

1. **No residual presentational JSX / dead imports / unused locals.** Every import in `Header.tsx`
   is used (verified by inspection + `eslint` clean run, which flags unused vars/imports). The Logo,
   `NavLinks`, header shell wrapper, and hamburger trigger are structural layout/composition
   elements the container is required to hold — none of them are leftover dropdown/drawer/menu
   bodies (those are fully extracted into the four primitives). No code change was required.
2. **Split gate:** all four primitives are prop-driven (verified by reading each: `HeaderActions.tsx`,
   `UserMenu.tsx`, `MobileNavDrawer.tsx`, `LocaleSwitcher.tsx` — no `useUser`/Supabase/network hook
   inside any of them, only `useTranslations`/`useLocale` for i18n). Their stories
   (`src/stories/mantine/primitives/{HeaderActions,UserMenu,MobileNavDrawer,LocaleSwitcher}.stories.tsx`)
   are fixture-only — `grep` for `useUser|Supabase|vi.mock|jest.mock` across all four story files → 0
   matches.
3. **Canonical story location + auto-discovery:** all four story files live in
   `src/stories/mantine/primitives/` with `title: 'Mantine/Primitives/<Name>'` (grep-confirmed).
   Standing `screenshots:assert --mantine-only` sweep (fresh `build-storybook` first) shows all four
   discovered with **16/16 cells each, all `verdict:"pass"`** — see Rendered matrix below.
4. **Exactly one language switcher per breakpoint (Task-574 human-eye cell):** `grep -n
   "LocaleSwitcher" src/components/layout/Header.tsx` → exactly one render
   (`<LocaleSwitcher onSwitch={switchLocale} />`, line 118); the in-file comment documents the
   Task-577 dedup. No separate mobile combobox exists anywhere in `src/`.
5. **Regression (clause 15):** `Header.tsx` + `LocaleSwitcher.tsx` are the exact surfaces named in
   `docs/critical-flow-registry.md` row "Header overlays (locale switch · user menu · mobile drawer)"
   (owner task 574). The registered Logout critical flow's smoke baseline
   (`npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` etc., via `npm run test:auth`)
   is green: **28/28 passed**. No code in this task changed `Header.tsx`, the four primitives, or
   any auth/routing logic, so the existing registry coverage stands unmodified.

## Rendered matrix (clause 12) — `screenshots:assert --mantine-only`, fresh `build-storybook`

Standing enforced sweep, run `2026-07-12T20-20`: **660 total / 634 pass / 0 FAIL / 26 ambiguous**
(pre-existing Combobox/RangeDatePicker/Tabs cells — same 26 as the Task 579 baseline, byte-identical,
zero regression from this audit).

Per-primitive cells (320/375/390 mobile + desktop-1024 × sq/en/uk/it = 16 cells each):

| Primitive | Cells | Verdict |
|---|---|---|
| `Mantine/Primitives/HeaderActions/Default` | 16/16 | pass |
| `Mantine/Primitives/LocaleSwitcher/Default` | 16/16 | pass |
| `Mantine/Primitives/UserMenu/Default` | 16/16 | pass |
| `Mantine/Primitives/MobileNavDrawer/Default` | 16/16 | pass |

uk@320/375/390 (mandatory stress cells) — all 4 primitives PASS at all 3 mobile widths, no clip/
overflow, full-width composition preserved (byte-identical to the 578/579 approved baselines, which
already carried this same evidence — this task changes no code, so the evidence is a re-confirmation,
not new render output).

## Split-gate confirmation

Every smart surface in the Header has its own prop-driven primitive + fixture story; no data/network
hook mock anywhere in the Header story set (verified by grep, item 2 above). Canonical-coverage
confirmation: all **four** (not five — see discrepancy note above) Header primitive stories live in
`src/stories/mantine/primitives/` under `Mantine/Primitives/*` and appear in the standing
`screenshots:assert --mantine-only` auto-discovery sweep, each with its own 16-cell pass record. None
is `Layout/*`/co-located; none relies on a throwaway one-off render script.

## AC-by-AC self-audit

| # | Criterion (from kickoff) | Where verified | Result |
|---|---|---|---|
| 1 | `Header.tsx` contains no presentational overlay/action JSX beyond composing the primitives + `AuthSheet`; holds hooks/side-effects/callbacks only | Source read (`src/components/layout/Header.tsx`) — see "Audit findings" #1 | ✅ (adjusted: 4 primitives, see discrepancy note) |
| 2 | Final parity matrix present with real per-cell evidence, incl. exactly-one-language-switcher-per-breakpoint | Rendered matrix above; grep confirms 1 `LocaleSwitcher` render | ✅ |
| 3 | Split-gate satisfied across the Header surface (all primitives prop-driven + fixture stories, no hook mocks); all primitive stories confirmed in the standing `Mantine/Primitives/*` sweep | grep for hook/network mocks (0 matches) + manifest.json verdict counts (16/16 pass ×4) | ✅ |
| 4 | `tsc=0`/lint/`check:stories`/`screenshots:assert` green; regression (locale/auth/logout/mobile-nav + no hydration id) proven; file-integrity clean | Verification section below | ✅ |

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/layout/Header.tsx src/components/layout/HeaderActions.tsx src/components/layout/UserMenu.tsx src/components/layout/MobileNavDrawer.tsx src/components/shared/LocaleSwitcher.tsx` → clean, no output.
- `npm run check:i18n` → **PASSED**, 2142 keys × 4 locales.
- `npm run check:stories` → **PASSED**, 115 files checked, 0 violations; `storybook.*` 563 keys × 4 locales.
- `npm run check:file-integrity` → **PASSED**, 1/1 file clean (this session log itself is the only new file; no product code touched).
- `npm run test:auth` → **28/28 passed** (Logout critical-flow baseline, registry row, unaffected).
- `npm run build-storybook` → fresh rebuild, 0 errors.
- `npm run screenshots:assert -- --mantine-only` → **660/634/0/26** (manifest.json), all 4 Header primitives 16/16 pass each, byte-identical to Task 579's approved baseline (zero regression).

## Self-validation

`tsc=0 errors · eslint=clean · check:i18n=PASS (2142×4) · check:stories=PASS (115 files/0 viol, 563×4) · check:file-integrity=PASS (1/1) · test:auth=28/28 PASS · build-storybook=0 errors · screenshots:assert --mantine-only=660/634/0/26, all 4 Header primitives 16/16 pass, zero regression vs Task 579 baseline.`

**Verdict: Task 580 confirms `Header.tsx` is already a thin container** (no code change required —
574–579 already left it in the correct shape) and the final rendered parity matrix + split-gate
hold across all four real primitives. The kickoff's "five primitives" wording is stale relative to
Task 577's owner-authorized dedup (documented above, not re-litigated).

## Files Changed

| File | Rationale |
|---|---|
| `docs/sessions/2026-07-12-task580-header-thin-container-audit.md` | **NEW.** This session log — audit findings, rendered matrix, AC self-audit, self-validation. No product code changed; this was a confirm-only audit task. |
