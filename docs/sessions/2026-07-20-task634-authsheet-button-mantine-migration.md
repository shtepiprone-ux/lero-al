# Session Archive: Task 634 — AuthSheet Slice 2a: legacy shadcn `Button` → canonical Mantine `Button` — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_634_AuthSheet_Slice2a_Button_MantineMigration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced all 11 legacy shadcn `Button` (`@/components/ui/button`) usages in `src/modules/auth/components/AuthSheet.tsx`
(`LoginView`, `ForgotPasswordView`, `RegisterView`, nested `CompanyField`) with the canonical `@mantine/core`
`Button`, per the kickoff's provenanced variant/size/`fullWidth`/`loading` mapping. Every `onClick`/`type`/`disabled`
expression, handler, and piece of state is byte-unchanged — only the Button element itself (variant, size,
`fullWidth`, `loading`, children-wrapping) and the two import lines changed. This is Slice 2a of the AuthSheet
migration (Slice 1 = shell/`MantineDrawer`, Task 633); Slices 2b–2e (`Input`/`Label`, `PasswordInput`, `Alert`,
`Combobox`/`LocationCombobox`) remain open and untouched.

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Consumed shared style/token path |
|---|---|---|---|---|
| All 11 auth-overlay buttons (submit/OAuth/link/logo/create/cancel/agent-CTA) | Opened `src/design-system/mantine/theme.ts` `Button` block (~L252, `defaultProps: {radius:'lg', size:'sm'}`, `vars`/`styles` functions gating `outline`/`default`/`transparent` neutral chrome per Tasks 527/587/589); opened precedent consumers `src/components/shared/AgentCtaButton.tsx` and `src/components/shared/ViewAllLink.tsx` (both `@mantine/core` `Button`, `variant="filled"`/`"transparent"`, `component={Link}` + `styles.root` centering fix); `src/components/layout/HeaderActions.tsx`/`UserMenu.tsx` also consume the same theme-gated `Button` | `@mantine/core` `Button`, chrome owned by `theme.ts` `Button` block | **reuse** — consumers import `{ Button } from '@mantine/core'` directly; no wrapper, no new story, no copied class chain | Theme-owned `defaultProps`/`vars`/`styles` (radius `lg`, size `sm`, §6l neutral `outline`/`default`, §6a-link `transparent` gray-7 text, `minHeight: 2.75rem` universal ≥44px touch target); `fullWidth` prop replaces `className="w-full"`; `loading` prop replaces manual `Loader2` spinner |

No `styles.root` inline-flex/center override was needed (unlike `AgentCtaButton`/`ViewAllLink`): that quirk is
specific to `component={Link}` polymorphic buttons losing centering under the theme's `height:'auto'`; none of the
11 AuthSheet buttons use `component={Link}` (all are native `<button type="submit"|"button">`), and rendered proof
confirms all labels/icons stay centered. B4 ("+ add new company") needed one local `styles={{ inner: { justifyContent:
'flex-start' } }}` override to preserve its left-aligned text-link look inside a `flex-col` (stretch) container —
this is an instance-level layout override of the same kind `ViewAllLink.tsx`/`AgentCtaButton.tsx` already use, not a
new canonical primitive.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `@/components/ui/button` import + all 11 usages removed, replaced by `@mantine/core` `Button` | `git diff`; `grep -n "components/ui/button" AuthSheet.tsx` → no match |
| R2/AC2 | Every `type`/`onClick`/`disabled` expression, all handler/state/validation code unchanged | `git diff` shows only Button-element + import lines changed (32 insertions/29 deletions, single file); all 5 named auth smokes + hydration-parity green |
| R3/AC3 | Provenanced variant map applied; `size="lg"/"xl"` dropped; `fullWidth` replaces `w-full` | `git diff` (see B1–B11 mapping below); `check:stories` Check 14 (Mantine Button off-scale size) — **PASSED, 0 violations** |
| R4/AC4 | B1/B3/B7/B10 show busy state via Mantine `loading` | Rendered: `login__uk__desktop-1280__loading.png` — spinner replaces label, button visibly disabled |
| R5/AC4 | B2 Google icon+label via `leftSection`; B4 left-aligned compact link; B6 stays subtle icon-sized; no lost centering | Rendered: `login__uk__mobile-320`/`desktop-1280` (Google icon+label centered, no `component={Link}` quirk applies); `register-agent__uk__mobile-320` (`+ Додати нову компанію` left-aligned); B6 not directly captured (see Self-review) |
| R6/AC5 | 5 named smokes + `test:header-hydration-id-parity` stay green | All 5 commands below: exit 0, all tests passed |
| R7/AC5 | No new legacy `@/components/ui/*` import; deferred-primitive imports remain; typecheck/check:stories/check:i18n/check:mojibake green | `git diff` import block — only `Button` added to the `@mantine/core` line, `@/components/ui/button` removed; `Input`/`Label`/`PasswordInput`/`PasswordRequirementsHint`/`Alert`/`AlertDescription`/`LocationCombobox`/`Combobox` imports all still present, untouched; all 4 commands exit 0 |

## B1–B11 before/after mapping actually applied

| # | Line region | Before | After |
|---|---|---|---|
| B1 | LoginView submit | `size="xl" className="w-full" disabled={loading}` + manual `Loader2` ternary | `fullWidth loading={loading} disabled={loading}`, plain `{t('login')}` child |
| B2 | LoginView Google OAuth | `variant="outline" size="xl" className="w-full"` + inline `<svg mr-2 .../>` child | `variant="default" fullWidth`, svg moved to `leftSection` (margin dropped, Mantine section gap owns spacing) |
| B3 | ForgotPasswordView submit | `size="xl" className="w-full" disabled={loading \|\| !captchaToken}` + manual spinner | `fullWidth loading={loading} disabled={loading \|\| !captchaToken}`, plain label |
| B4 | CompanyField "+ add new" | `variant="link" className="text-xs h-auto p-0 justify-start"` | `variant="transparent" styles={{inner:{justifyContent:'flex-start'}}}` |
| B5 | CompanyField logo choose-file | `variant="outline" size="default" className="text-xs rounded-lg"` | `variant="default" size="xs"` |
| B6 | CompanyField logo remove | `variant="ghost" size="default" className="text-xs rounded-lg text-muted-foreground"` | `variant="subtle" size="xs"` |
| B7 | CompanyField create-add | `size="sm" className="gap-1.5"` + manual `{creating && <Loader2/>}` | `size="sm" loading={creating}` (disabled expression unchanged), plain label |
| B8 | CompanyField create-cancel | `variant="ghost" size="sm"` | `variant="subtle" size="sm"` |
| B9 | RegisterView success close | `size="xl" className="w-full mt-2"` | `fullWidth className="mt-2"` (margin utility kept — no theme conflict) |
| B10 | RegisterView submit | `size="xl" className="w-full" disabled={loading \|\| !allPasswordMet \|\| !captchaToken}` + manual spinner | `fullWidth loading={loading} disabled={loading \|\| !allPasswordMet \|\| !captchaToken}`, plain label |
| B11 | RegisterView agent-register | `variant="outline" size="xl" className="w-full"` | `variant="default" fullWidth` |

`disabled` expressions were kept **verbatim** everywhere (not replaced by `loading` alone) so the non-loading gates
(`!captchaToken`, `!allPasswordMet`, `!newName.trim()`) stay enforced independently of the busy state — `loading` is
additive, matching R2's "no disabled semantics change."

## Current versus required behavior

- **Before:** every button in the auth overlay was a legacy shadcn `Button` — shadcn chrome, `size="xl"` off-scale,
  `w-full`/`variant="outline"|"ghost"|"link"`, manual `Loader2` submit spinner.
- **After:** identical views/fields/logic; every button is a canonical Mantine `Button` with theme-owned chrome —
  `filled` primary submits (`fullWidth`, `loading` on busy), `variant="default"` neutral secondary (Google/agent),
  `variant="subtle"` ghost (cancel/remove), `variant="transparent"` link ("+ add new"); no off-scale size; every
  `onClick`/`type`/`disabled`/label/icon preserved.

**Applicable negative flows:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login submit (happy + wrong-creds) | Yes (regression) | Registry P0 | Unchanged handler/error | `browser.smoke.test.ts` 4/4 PASS |
| Signup submit (dup-email/weak-pw/captcha-fail) | Yes (regression) | Registry P0 | Unchanged typed errors | `signUpWithCaptcha.smoke.test.ts` 4/4 PASS |
| Recovery submit (neutral success) | Yes (regression) | Registry P0 | Unchanged neutral success | `requestPasswordReset.smoke.test.ts` 4/4 PASS |
| Phone entry E.164 | Yes (regression) | Registry P0 | Unchanged emit | `PhoneField.smoke.test.tsx` 3/3 PASS |
| Submit-button disabled gates (`!captchaToken`, `!allPasswordMet`) | Yes | R2/R4 | Non-interactive until gates met; `loading` while submitting | Rendered `forgot-password__sq__mobile-320` (disabled, no captcha yet), `register__it__mobile-390` (disabled submit, empty form), `login__uk__desktop-1280__loading` (loading spinner) |
| Company create sub-flow (add/cancel/logo choose) | Yes | R2/R5 | Buttons fire unchanged handlers; layout intact | Rendered `register-agent__uk__mobile-390__company-row-filled` |
| Button vertical-centering / `leftSection` icon | Yes | R5 | No lost centering | Rendered `login__uk__mobile-320`/`desktop-1280` — Google icon+label aligned |
| Header hydration `useId` parity | Yes | Registry P0 (599/601) | No hydration mismatch | `test:header-hydration-id-parity` 3/3 PASS |
| Locale expansion (button labels sq/uk/it) | Yes | R7 | No clip/overflow at 320 | Rendered `login__uk__mobile-320`, `forgot-password__sq__mobile-320`, `register__it__mobile-390` — no clipping, uk/sq/it labels wrap/fit |
| OAuth (Google) actual sign-in | No (manual-only, exempt) | Registry | Unchanged handler | — |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | All 11 legacy `@/components/ui/button` usages converted to `@mantine/core` `Button` per the provenanced variant/size/`fullWidth`/`loading` mapping; `Loader2` import removed (all 4 usages were the manual submit spinners now replaced by Mantine's `loading` prop); `Button` merged into the existing `@mantine/core` import line. No handler, state, validation, or other-file change. |

`git diff --stat`: `1 file changed, 32 insertions(+), 29 deletions(-)` — `src/modules/auth/components/AuthSheet.tsx`
only (+ this session log + `docs/backlog.md`).

## Validation evidence

1. `npm run typecheck` → **0 errors**.
2. `npm run check:stories` → **PASSED — 120 files checked, 0 violations** (Check 14, Mantine Button off-scale
   `size="lg"|"xl"`, included and green).
3. `npm run check:i18n` → **PASSED — 2203/2203 keys, all 4 locales, no new key.**
4. `npm run check:mojibake` → **PASSED — 0 artifacts in 1807 files.**
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → **3/3 PASS.**
   - `npm run test:header-hydration-id-parity` → **3/3 PASS.**
6. **Rendered (live-app, same mechanism as Task 633 — `AuthSheet` has no Storybook story, a `'use client'`
   container mixing hooks/actions/JSX):** `npm run dev` (Turbopack, port 3001 — 3000 was in use by another
   process), then an ad-hoc Playwright script (`scripts/_ad-hoc-task634-authsheet-capture.mjs`, deleted after use
   per Task 633/621/630 precedent) dispatched the app's own `lero:open-auth-sheet` global event
   (`src/lib/auth/authSheet.ts`) to open each view and captured **viewport-only** screenshots (not `fullPage` —
   an initial `fullPage:true` attempt let underlying homepage content show through below the fixed-position
   drawer/bottom-sheet, a Playwright stitching artifact with fixed elements, not a real bug; corrected to
   viewport-only for accurate proof). Captured and visually inspected:
   - `login__uk__mobile-320.png` — bottom sheet: filled red `Увійти` submit (fullWidth), `АБО` divider, white
     bordered `G Google` button (fullWidth, icon+label centered via `leftSection`), register text-link untouched.
   - `login__uk__desktop-1280.png` — right drawer (~380px), same buttons, Mantine close `×`.
   - `login__uk__desktop-1280__loading.png` — email/password filled, submit clicked, network call held open:
     submit button shows the Mantine spinner overlay in place of the label, visibly non-interactive — **R4
     loading-affordance proof.**
   - `register-agent__uk__mobile-320.png` — full agent form, `+ Додати нову компанію` link left-aligned/compact
     (B4), password requirement checklist, submit button visibly disabled (gates not met).
   - `register-agent__uk__mobile-390__company-row-filled.png` — company row expanded: name filled, logo
     placeholder + `Обрати файл` button (B5, compact `xs`/`default`), `Додати` (B7, filled `sm`) and `Скасувати`
     (B8, `subtle` `sm`) stacked full-width at <640px (unchanged `sm:flex-row` Tailwind responsive behavior) — no
     clipping, touch targets visually ≥44px (theme's universal `minHeight: 2.75rem`).
   - `forgot-password__sq__mobile-320.png` — submit button rendered **disabled/grayed** (`!captchaToken` gate,
     B3), no clipping of the sq label.
   - `register__it__mobile-390.png` — `Nome`/password-requirements render correctly, submit disabled (empty
     form), `Registrati come agente` (B11, `variant="default"` fullWidth) at the bottom, no clipping of the it
     label.
   - Mandatory `uk@320` present (`login`, `register-agent`); `sq@320` and `it@390` also captured for locale-width
     coverage per R7.
   - Console/`pageerror` listener attached on every page: **zero errors reference `AuthSheet`, `Button`, or any
     Button-related markup.** The only console output captured across all 9 cells was a benign
     `%c%d font-size:0;color:transparent NaN` pattern (a known non-visible dev-tooling console marker, unrelated
     to any component this task touched — same class of documented dev-mode noise as the `docs/backlog.md`
     "Console NOISE" standing note).
7. `git status --short` / `git diff --stat` → exactly `src/modules/auth/components/AuthSheet.tsx` (+ this session
   log + `docs/backlog.md`). Ad-hoc capture script and screenshots are session-scratchpad artifacts, not committed.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| All 11 button chromes (fill/outline/ghost/link → filled/default/subtle/transparent) | `AuthSheet.tsx` inline `Button` elements | `.mantine-Button-*` (was shadcn `data-slot="button"` classes) | `theme.ts` `Button` block: `defaultProps` (radius `lg`, size `sm`), `vars`/`styles` functions (§6l neutral outline/default, §6a-link transparent, universal `minHeight: 2.75rem`) | **Changed** (intended, R1/R3) | Diff; rendered proof |
| Submit-button busy affordance | manual `{loading ? <Loader2/> : label}` → Mantine `loading` prop | n/a → Mantine's built-in loader overlay | Mantine `Button` `loading` prop (no local override) | **Changed** (intended, R4) | Diff; `login__uk__desktop-1280__loading.png` |
| B4 left-alignment | `className="... justify-start"` → `styles={{inner:{justifyContent:'flex-start'}}}` | Tailwind utility → Mantine instance style | Instance-level override (same pattern as `ViewAllLink.tsx`'s `styles.label`), not a new canonical primitive | **Changed (mechanism), preserved (visual)** | Diff; `register-agent__uk__mobile-320.png` |
| All form fields, labels, captcha, phone/company sub-field internals, error/success screen text | `LoginView`/`ForgotPasswordView`/`RegisterView`/`AgentCityField`/`CompanyField` internals | unchanged | unchanged (still shadcn `@/components/ui/*` — Slices 2b–2e) | **Preserved, untouched** | Diff shows zero lines changed outside the 11 Button elements + 2 import lines |
| `theme.ts`, `MantineDrawer.tsx`, `AgentCtaButton.tsx`, `ViewAllLink.tsx`, other consumers, any story, i18n keys | — | — | — | **Out of scope, untouched** | `git diff --stat` |

## Self-review findings

- **No defect found** in the implementation itself; all typecheck/check:stories/check:i18n/check:mojibake gates
  and all 5 named regression commands are green, unchanged.
- **Evidence gap, honestly flagged (not a defect):** B6 (logo-remove `×`, `variant="subtle" size="xs"`) was not
  directly captured in a rendered cell — reaching it requires the browser's native file picker to actually select
  a logo file, which the ad-hoc script did not automate. The same `variant="subtle"` is proven correct via B8
  (`Скасувати`, rendered in `company-row-filled.png`) and the same `size="xs"` is proven correct via B5 (`Обрати
  файл`, same screenshot) — B6 is the union of both, already independently verified, but not itself pixel-proven.
  Similarly, B9 (`RegisterView` success-screen close button) was not captured — reaching the `success` state
  requires a full live signup past the real Cloudflare Turnstile captcha widget, which cannot be scripted. B9 uses
  the same `fullWidth` + default-filled mapping already proven correct via B1/B3/B10 in this same session.
- Playwright `fullPage: true` screenshots initially produced a misleading capture (page content visible below the
  fixed-position drawer/bottom-sheet) — identified as a known Playwright/fixed-element stitching limitation, not
  a real rendering bug, and corrected by switching to viewport-only screenshots for all subsequent captures.

## Assumptions, deviations, and limitations

- Adopted the kickoff's explicitly-canonical `loading`-prop mapping for B1/B3/B7/B10 (removing the manual
  `Loader2` spinner) rather than the kickoff's alternative "freeze the ternary verbatim inside Mantine `Button`"
  option — this was the kickoff's own stated default ("the migration works both ways; the kickoff mandates the
  `loading` prop as the canonical choice"), confirmed correct by rendered proof.
- `disabled` expressions were preserved byte-identical (not collapsed into `loading` alone) specifically so the
  non-loading gates (`captchaToken`, `allPasswordMet`, `newName.trim()`) keep functioning independently — this is
  an implementation-safety choice, not a kickoff-specified requirement, and is called out for reviewer attention.
- B6 and B9 rendered proof gap — see Self-review above.
- No `theme.ts`, `MantineDrawer.tsx`, other consumer, story, or i18n key was touched. Deferred primitives
  (`Input`/`Label`/`PasswordInput`/`PasswordRequirementsHint`/`Alert`/`AlertDescription`/`Combobox`/
  `LocationCombobox`) remain shadcn, untouched, imports intact — confirmed via `git diff` import block.
- This is **Slice 2a of the AuthSheet migration**; Slices 2b (`Input`/`Label`), 2c (`PasswordInput`/hint), 2d
  (`Alert`), 2e (`Combobox`/`LocationCombobox`) remain explicitly open per the kickoff's sub-slicing plan.

## Opus handoff

Diff: `src/modules/auth/components/AuthSheet.tsx` only (product code).

Questions/risks for the reviewer to inspect:

1. Confirm the B6/B9 rendered-proof gap (Self-review) is an acceptable Q4 evidence limitation given both button's
   variant/size combinations are independently proven elsewhere in the same session, or require a follow-up capture.
2. Confirm keeping `disabled={...}` expressions byte-identical alongside the new `loading` prop (rather than any
   simplification) is the correct read of R2's "no disabled semantics change."
3. Confirm the B4 `styles={{inner:{justifyContent:'flex-start'}}}` instance override is acceptable under the
   canonical-reuse disposition (same class of override as `ViewAllLink.tsx`'s `styles.label`), not a new local
   style requiring a shared-source registration.
4. Confirm this is Slice 2a only — Slices 2b–2e (`Input`/`Label`/`PasswordInput`/`Alert`/`Combobox`/
   `LocationCombobox`) remain explicitly open, not touched here.
5. No `theme.ts`/other-consumer/story/i18n-key edit — confirm via `git diff --stat`.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
