# Session Archive: Task 633 — AuthSheet Slice 1: shadcn `Sheet` → canonical `MantineDrawer` — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_633_AuthSheet_ShellMigration_Sheet_to_MantineDrawer.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced the shadcn `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetDescription` overlay shell in
`src/modules/auth/components/AuthSheet.tsx` with the canonical `MantineDrawer`. All 4 auth views (`login`,
`forgot-password`, `register`, `register-agent`) render unchanged inside the new shell — same fields, state,
`handleSubmit`, captcha/phone/company logic. Only the outer shell and the 5 view-wrapper elements' horizontal
padding (neutralized so `MantineDrawer`'s own inset owns it) changed.

**Mid-implementation defect found and fixed (own code, this session):** the kickoff's suggested title
composition (`<Text fw={…}>{titles[view]}</Text>` + a conditional `<Text c="dimmed" size="xs">` subtitle) produced
a real hydration error when exercised end-to-end. `MantineDrawer`'s shared `title` slot nests the passed node
inside an `<h2>` on desktop (Mantine's own `ModalBaseTitle`) and inside an *additional* `<Text>` (`<p>` by
default) on mobile (`ResponsiveBottomSheet`'s own title wrapper) — neither of which every other `MantineDrawer`
consumer had exercised with a composed `ReactNode` title before (`MobileNavDrawer` passes no `title` at all).
Mantine `Text`'s default `component="p"` therefore produced `<p>` nested inside `<p>` (mobile) and block content
inside `<h2>` (desktop), both invalid HTML — confirmed via a live Playwright capture showing a genuine React
`onRecoverableError`-class hydration-mismatch console error the first time the composed title was exercised.
Fixed by setting `component="span"` on both `Text` elements (phrasing content, valid inside both wrapping
contexts) with `style={{ display: 'block' }}` on the subtitle so it still stacks onto its own line. Re-verified via
a fresh live-app Playwright capture across all 4 locales — no hydration console error tied to this title
composition in any of the 64 captured cells (see Validation evidence #6 for the residual, pre-existing, unrelated
dev-mode noise that IS still present).

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Consumed style/token path |
|---|---|---|---|---|
| Auth overlay container (right drawer desktop / bottom sheet mobile) | Opened `MantineDrawer.tsx` (controlled `opened/onClose/title/side/size`) and its precedent consumer `MobileNavDrawer.tsx` (`side="right"`, no `title`); canonical stories `Drawer.stories.tsx`, `MobileNavDrawer.stories.tsx`; also opened `MantineDialogDrawerPattern.tsx` for precedent on composing a stacked `Text`-based title (its own hand-rolled Drawer, `<Text fw={600} size="lg">{title}</Text>` inside a `<Box>`) | `src/design-system/mantine/patterns/MantineDrawer.tsx` | **reuse** — consume `MantineDrawer` directly, no local overlay markup, no copied styles | Wired `opened/onClose/title/side="right"/size="sm"`; title composed with `Text component="span"` (see Summary — the one adjustment needed beyond the kickoff's literal suggestion, made necessary by `MantineDrawer`'s own nesting, not a new local style) |

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `@/components/ui/sheet` fully removed, `MantineDrawer` used | `git diff`; `grep -n "components/ui/sheet" src/modules/auth/components/AuthSheet.tsx` → no match |
| R2/AC2 | `open`/`onOpenChange` ↔ `opened`/`onClose`; view switch renders correctly; `initialView`/`regShared` untouched | Diff: `opened={open} onClose={() => onOpenChange(false)}`; the `useEffect` resetting `view`/`regShared` on `open` is untouched (not in the diff); rendered proof confirms all 4 views open to the correct content |
| R3/AC2 | No field/logic/validation/captcha/phone/company/error/success change — only shell + wrapper padding | `git diff` shows exactly: import swap, 5× `px-4` removed from view-wrapper `className`s, and the shell block replaced — zero lines changed inside any `handleSubmit`, state, or field JSX; 5 regression smokes below stayed green |
| R4/AC3 | `titles[view]` shown per view; `register-agent` sub-description preserved; no new i18n key | Rendered proof: every view shows its title (`Увійти`/`Реєстрація`/`Реєстрація як агент` etc.); `register-agent` cells show `{register_as} {agent}` sub-line under the title; `check:i18n` — 2203/2203 keys, unchanged |
| R5/AC4 | `<640px` → bottom sheet; `≥640px` → right drawer `size="sm"`; no clip/overflow at 320/375/390 incl. `uk@320` | 64-cell live-app Playwright capture (4 views × {320,375,390,desktop-1280} × 4 locales) — mobile cells show the drag-handle bottom sheet, desktop cells show a ~384px right drawer with Mantine's own close (X); visually confirmed no clipping/overflow at every captured cell, including mandatory `uk@320` and `sq@320` |
| R6/AC5 | Named critical-flow smokes + header-hydration-id-parity stay green (unchanged baseline) | All 5 commands below: exit 0, all tests passed (see Validation evidence #5) |
| R7/AC5 | No new legacy `@/components/ui/*` import; typecheck/check:stories/check:i18n/check:mojibake green | `git diff` — only `Text`/`MantineDrawer` imports added, `@/components/ui/sheet` removed, no other `@/components/ui/*` import added; all 4 commands exit 0 (see Validation evidence #1-4) |

## Current versus required behavior

- **Before:** the auth overlay was a shadcn `Sheet` — right-side drawer at all widths, shadcn close button,
  shadcn `SheetHeader`/`SheetTitle`/`SheetDescription` chrome.
- **After:** identical views/fields/logic rendered inside `MantineDrawer` — desktop right drawer (`size="sm"`,
  ~384px), mobile canonical bottom sheet (drag handle, ≤90dvh internal scroll), Mantine title/close chrome;
  `register-agent` sub-description preserved as a stacked `span` under the title; every auth flow behaves exactly
  as before (5 regression smokes green, unchanged).

**Applicable negative flows:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login wrong-creds | Yes (regression) | Registry P0 | Localized error, no session — unchanged | `browser.smoke.test.ts` 4/4 PASS |
| Signup dup-email / weak-pw / captcha-fail | Yes (regression) | Registry P0 | Typed errors — unchanged | `signUpWithCaptcha.smoke.test.ts` 4/4 PASS |
| Recovery neutral success / non-enumeration | Yes (regression) | Registry P0 | Neutral success — unchanged | `requestPasswordReset.smoke.test.ts` 4/4 PASS |
| Phone entry E.164 | Yes (regression) | Registry P0 | Unchanged emit | `PhoneField.smoke.test.tsx` 3/3 PASS |
| Header hydration `useId` parity | Yes | Registry P0 (599/601) | No hydration mismatch | `test:header-hydration-id-parity` 3/3 PASS |
| Locale expansion (title/description sq/uk/it) | Yes | R4 | No clip/overflow at 320, `uk@320` | Rendered `uk@320`/`sq@320`/`en@320`/`it@320` all 4 views, no clipping |
| Mobile bottom-sheet form (intended change) | Yes | R5 | Bottom sheet, drag handle, internal scroll, register-agent form scrolls | Rendered `register-agent__uk__mobile-320.png` — full form + drag handle, no overflow |
| OAuth / magic-link | No (manual-only, exempt) | Registry | Unchanged code path | — |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | Shell swap: `@/components/ui/sheet` imports removed, `Text`(`@mantine/core`)/`MantineDrawer` imports added; the `<Sheet>/<SheetContent>/<SheetHeader>/<SheetTitle>/<SheetDescription>` block replaced by `<MantineDrawer opened onClose title={drawerTitle} side="right" size="sm">`; composed `drawerTitle` node (title + conditional register-agent subtitle, both `Text component="span"` — see Summary for why); 5× `px-4` removed from the LoginView/ForgotPasswordView(×2)/RegisterView(×2) wrapper `className`s so `MantineDrawer`'s own inset owns horizontal padding. No field/state/logic line touched. |

`git status --short` at session end: only `src/modules/auth/components/AuthSheet.tsx` modified (confirmed —
Task 631/632 changes were committed by the owner during this session, so the working tree is otherwise clean).

## Validation evidence

1. `npm.cmd run typecheck` → **0 errors**, run after the final (hydration-fixed) code state.
2. `npm.cmd run check:stories` → **PASSED**, `120 files checked, 0 violations`.
3. `npm.cmd run check:i18n` → **PASSED**, 2203/2203 keys, all 4 locales, no new key.
4. `npm.cmd run check:mojibake` → **PASSED**, `0 artifacts in 1805 files`.
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx.cmd vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → 4/4 PASS.
   - `npx.cmd vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → 4/4 PASS.
   - `npx.cmd vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → 4/4 PASS.
   - `npx.cmd vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → 3/3 PASS.
   - `npm.cmd run test:header-hydration-id-parity` → 3/3 PASS.
6. **Rendered (live-app, owner-precedented ad-hoc Playwright capture — no story renders `AuthSheet`, a
   `'use client'` smart/container component with no presentational split; the same "site-only, no story"
   situation Task 621/630 documented for `next dev`-only overlays):** `npm.cmd run dev` (Turbopack), then a
   Playwright script dispatched the app's own `lero:open-auth-sheet` global event (`src/lib/auth/authSheet.ts`) —
   the same mechanism `MobileBottomNav.tsx`/`MobileNavDrawer.tsx` use in production — to open each of the 4 views
   at `{320,375,390}` (bottom sheet) + `1280` (right drawer) × all 4 locales = **64/64 cells captured**. Visually
   inspected: `register-agent__uk__mobile-320` (drag handle, title+subtitle, all agent fields, back-link, no
   clip), `register-agent__uk__desktop-1280` (right drawer ~384px, Mantine close X, bordered header, title+
   subtitle, captcha widget), `login__uk__mobile-320`, `register__en__desktop-1280`, `forgot-password__uk__mobile-320`
   — all correct, no clipping/overflow, captcha/fields render, mandatory `uk@320`/`sq@320` present among the 64.
   Console/pageerror listener attached for every page load: **zero errors reference `AuthSheet`, `MantineDrawer`,
   `Text`, or the title composition** in any of the 64 cells (confirming the hydration defect found and fixed
   mid-session — see Summary — is resolved). Residual console noise present (unrelated, pre-existing,
   documented): a `mantine-_R_…-target` `useId` hydration-attribute mismatch on the header's `UserMenu`/
   `LocaleSwitcher` `Menu` target and a couple of Mantine inline-style-hash diffs on `AgentCtaButton`/`FooterView`
   — this is the exact documented Task 599-601 "dev-mode Turbopack hydration noise floor is NATIVE, not
   sandbox-only" class of noise (`docs/backlog.md` → "Console NOISE" standing note), on files this task never
   touched (`Header.tsx`, `UserMenu`, `LocaleSwitcher`, `AgentCtaButton.tsx`, `FooterView.tsx` are all outside this
   diff). Screenshots + capture script are session-scratchpad artifacts (not committed); the ad-hoc capture/debug
   scripts (`scripts/_ad-hoc-task633-authsheet-capture.mjs`, `scripts/_ad-hoc-debug633.mjs`) were deleted after use
   — not part of the diff, per the Task 631/621 precedent for ad-hoc verification tooling.
7. `git status --short` / `git diff --stat` → exactly `src/modules/auth/components/AuthSheet.tsx` (+ this session
   log + the `docs/backlog.md` update). No other path touched this session.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Overlay shell (drawer/bottom-sheet chrome, close control, backdrop) | `AuthSheet` → `MantineDrawer` (was `Sheet`/`SheetContent`) | `.mantine-Drawer-*` (was shadcn `data-slot="sheet-content"` etc.) | Canonical `MantineDrawer`/`ResponsiveBottomSheet` — Mantine `Drawer` theme tokens, no local override | **Changed** (intended shell swap, R1/R5) | Diff; rendered proof |
| Title + register-agent subtitle | `drawerTitle` composed node (`Text component="span"`) | none (inline React node passed to `MantineDrawer`'s `title` prop) | `Text` component tokens (`fw`, `size`, `c="dimmed"`), no raw value | **Changed** — new composition, `component="span"` required to avoid invalid nesting inside the shared shell's own `<h2>`/`<Text>` wrappers (see Summary) | Diff; rendered proof; hydration-error-free capture |
| View wrapper horizontal padding (5 sites: LoginView form, ForgotPasswordView form + success, RegisterView form + success) | `<form>`/`<div>` `className` | Tailwind `px-4` utility removed | `MantineDrawer`'s own `contentPadding: 'var(--mantine-spacing-md)'` now owns the inset (Task 567-round-2-precedented mechanism, unmodified) | **Changed (presentational only)** — per kickoff §"Padding ownership" | Diff (5× `px-4` removed, vertical padding untouched) |
| All form fields, labels, buttons, captcha, phone/company sub-fields, error/success screens | `LoginView`/`ForgotPasswordView`/`RegisterView`/`AgentCityField`/`CompanyField` internals | unchanged | unchanged (still shadcn `@/components/ui/*` — later slices) | **Preserved, untouched** | Diff shows zero lines changed inside these functions besides the 5 `px-4` wrapper edits already itemized |
| `theme.ts`, `MantineDrawer.tsx`, `MobileNavDrawer.tsx`, any story, i18n keys | — | — | — | **Out of scope, untouched** | `git diff --stat` |

## Self-review findings

- **Real defect found and fixed in this session's own code:** the kickoff's literal title-composition suggestion
  (plain `<Text>` elements) produced an invalid-HTML/hydration-mismatch defect once actually exercised against
  the live shared `MantineDrawer` shell (both its desktop `<h2>` wrapping and its mobile `ResponsiveBottomSheet`
  `<Text>` wrapping) — a combination no prior `MantineDrawer` consumer had exercised. Root-caused via a live
  Playwright capture showing the exact React hydration-mismatch console error, fixed with `component="span"` +
  `display:block` on the subtitle, and re-verified with a fresh 64-cell capture showing zero further errors tied
  to this component. This is flagged prominently since it deviates from the kickoff's literal code suggestion
  (the kickoff's own text allowed for "verify exact selector with rendered proof; adjust if needed" under
  "Recommended approach", and separately named `MantineDrawer`/`ResponsiveBottomSheet` as out-of-scope for
  editing — the fix stayed entirely inside `AuthSheet.tsx`, no shared-pattern file was touched).
- No other defect found; all 5 critical-flow regression smokes and the hydration-id-parity test are green,
  unchanged.

## Assumptions, deviations, and limitations

- **Deviation from the kickoff's literal "Recommended approach" (self-corrected, documented above):** used
  `Text component="span"` instead of the kickoff's literal `<Text fw={…}>`/`<Text c="dimmed" size="xs">` (which
  default to `component="p"`), because the literal suggestion produces invalid HTML nesting and a real hydration
  error once wired through the shared `MantineDrawer` shell. This is the one adjustment beyond the kickoff text;
  it stays within `AuthSheet.tsx`'s scope and does not touch `MantineDrawer.tsx`/`ResponsiveBottomSheet.tsx`.
- No story exists for `AuthSheet` (it is a `'use client'` container mixing hooks/state/data actions with JSX, not
  split into a presentational primitive — a pre-existing architectural gap, not something this shell-only slice
  was scoped to fix). Rendered proof therefore used the live app via the same global-event trigger mechanism the
  app's own `MobileBottomNav`/`MobileNavDrawer` use in production, following the Task 621/630 ad-hoc-Playwright
  precedent for overlays with no story-render path.
- `.screenshots`/temp capture PNGs and the two ad-hoc scripts are session-scratchpad, not committed (deleted after use).

## Opus handoff

Diff: `src/modules/auth/components/AuthSheet.tsx` only (product code).

Questions/risks for the reviewer to inspect:

1. **Confirm the `component="span"` title-composition fix is an acceptable, in-scope self-correction** of the
   kickoff's literal suggestion (a real hydration defect was found and fixed, not a stylistic preference) —
   the kickoff's own "Recommended approach" section explicitly allows adjusting the exact mechanism if rendered
   proof shows it's needed.
2. Confirm the 64-cell live-app Playwright rendered proof (no story exists for `AuthSheet`) is acceptable Q3-depth
   evidence for this Q4 critical-flow task, consistent with the Task 621/630 precedent for story-less overlays.
3. Confirm this is Slice 1 only — form-primitive slices (`Input`/`Label`/`Button`/`PasswordInput`/`Alert`/nested
   `Combobox`/`LocationCombobox`, still shadcn) remain explicitly open, not touched here.
4. No `theme.ts`/`MantineDrawer.tsx`/`MobileNavDrawer.tsx`/story/i18n-key edit — confirm via `git diff --stat`
   alongside this session's Files Changed table.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
