# Session Archive: Task 636 — AuthSheet Slice 2c: legacy shadcn `PasswordInput` → canonical Mantine `PasswordInput` (Option A) — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_636_AuthSheet_Slice2c_PasswordInput_MantineMigration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced both legacy shadcn `PasswordInput` (`@/components/ui/PasswordInput`) usages in
`src/modules/auth/components/AuthSheet.tsx` (`LoginView` login-password, `RegisterView` reg-password) with the
canonical `@mantine/core` `PasswordInput`. Per the kickoff's owner-resolved decision (**Option A**), the register
field's custom 3-state (`idle`/`error`/`success`) field-border affordance is dropped — the retained
`PasswordRequirementsHint` is now the sole validation-feedback surface. `@/components/ui/PasswordInput` import and
the `PasswordInputState` type removed; `hasPasswordInput`/`passwordInputState` locals removed; `allPasswordMet`
(the submit gate) kept unchanged. Both fields' `value`/`onChange` bodies (incl. P2's cross-view `onSharedChange`
sync)/`required`/`autoComplete`/`id` are byte-unchanged. Show/hide toggle preserved via Mantine's built-in
`visible`/`onVisibilityChange`, wired to a local `passwordVisible` state per view so the toggle's
`visibilityToggleButtonProps` `aria-label` dynamically localizes (`common.show_password`/`hide_password`) exactly
as the legacy component did. This is Slice 2c of the AuthSheet migration (Slices 1/2a/2b — shell, Button,
Input/Label — all committed at session start); Slices 2d (`Alert`), 2e (`Combobox`/`LocationCombobox`) remain open.

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Consumed shared style/token path |
|---|---|---|---|---|
| Both password fields (login-password, reg-password) | Opened `src/design-system/mantine/theme.ts` `PasswordInput` block (~L345, `defaultProps.inputWrapperOrder`, `styles.input` §6e `minHeight: 2.75rem`, gray-8 text — matches `TextInput`); opened canonical story `src/stories/mantine/primitives/PasswordInput.stories.tsx` and precedent consumer `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx` (`PasswordInput label required {...form.getInputProps('password')}` — no success state, error via the `error` prop only, confirming no built-in success-state support); read the legacy `src/components/ui/PasswordInput.tsx` being replaced (custom Eye/EyeOff toggle + `inputState` red/green ring) | `@mantine/core` `PasswordInput`, chrome owned by `theme.ts` `PasswordInput` block | **reuse** — consumers import `{ PasswordInput } from '@mantine/core'` directly; owner-directed **Option A** (drop the field border-state, keep `PasswordRequirementsHint`) rather than adopting `MantineAuthFormPattern` wholesale (deferred) or inventing a local success-state style | Theme-owned `defaultProps`/`styles` (44px touch target, `inputWrapperOrder`); Mantine's built-in `visible`/`onVisibilityChange`/`visibilityToggleButtonProps` API (verified against `node_modules/@mantine/core/lib/components/PasswordInput/PasswordInput.d.ts`) replaces the legacy component's hand-rolled Eye/EyeOff toggle |

No new success/error styling was introduced anywhere — the owner's Option A explicitly forecloses that path; the
only field-level Mantine `styles`/`error` prop usage in this diff is none at all (neither field passes `error`).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Both fields are `@mantine/core` `PasswordInput`; `@/components/ui/PasswordInput` + `PasswordInputState` imports removed | `git diff`; `grep -n "ui/PasswordInput"` → no match |
| R2/AC2 | `value`/`onChange` body (incl. P2 `onSharedChange`)/`required`/`autoComplete`/`id` preserved; `allPasswordMet` gate unchanged; `hasPasswordInput`/`passwordInputState` removed, no other logic change | `git diff` — 5 hunks, only field elements + 2 new `useTranslations('common')`/`passwordVisible` locals + the 2-line local removal; `signUpWithCaptcha.smoke` (weak-pw path) green |
| R3/AC3 | Field border-state dropped; `PasswordRequirementsHint` retained unchanged as sole feedback | `git diff` — no `error`/success prop on either field; live check: `getComputedStyle(#reg-password).borderColor` identical (`rgb(29, 41, 57)`) between a weak (`abc`) and a fully-compliant password — **no red/green differentiation**; hint screenshots show the full ✓/✗ + error-message affordance unchanged |
| R4/AC4 | P2 label folded into `PasswordInput label`; P1 Label + forgot-password row untouched; `@/components/ui/label` import remains | `git diff`; `grep -n "components/ui/label"` → present; P1's `<Label htmlFor="login-password">`/forgot-password `<button>` row is outside every diff hunk |
| R5/AC5 | Working show/hide toggle with localized accessible name; no new i18n key | Live check: `#login-password` `type` `password`→`text` after clicking the toggle; `aria-label` `"Показати пароль"`→`"Приховати пароль"` (uk `common.show_password`/`hide_password`, pre-existing keys) |
| R6/AC6 | 5 named smokes + `test:header-hydration-id-parity` stay green | All 5 commands below: exit 0 |
| R7/AC6 | No new legacy `@/components/ui/*` import; `Label`/`Alert`/`Combobox`/`LocationCombobox`/`PasswordRequirementsHint` imports remain; typecheck/check:stories/check:i18n/check:mojibake green | `git diff` import block — only `PasswordInput` added to `@mantine/core` line; all 4 commands exit 0 |

## P1/P2 before/after mapping actually applied

| # | Field | Before | After |
|---|---|---|---|
| P1 | LoginView password | `<PasswordInput id="login-password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />` inside the unchanged `Label`+forgot-password row | `<PasswordInput id="login-password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" visible={passwordVisible} onVisibilityChange={setPasswordVisible} visibilityToggleButtonProps={{'aria-label': passwordVisible ? tc('hide_password') : tc('show_password')}} />` — Label/forgot-password row byte-unchanged |
| P2 | RegisterView password | `<Label htmlFor="reg-password">{t('password')}</Label><PasswordInput id="reg-password" value={password} onChange={<body>} required autoComplete="new-password" inputState={passwordInputState} /><PasswordRequirementsHint value={password} />` | `<PasswordInput id="reg-password" label={t('password')} value={password} onChange={<identical body>} required autoComplete="new-password" visible={passwordVisible} onVisibilityChange={setPasswordVisible} visibilityToggleButtonProps={{...}} /><PasswordRequirementsHint value={password} />` — `inputState` dropped, wrapper `<div className="flex flex-col gap-1.5">` kept, hint untouched |

Removed locals (`RegisterView`): `hasPasswordInput` (`password.length > 0`) and `passwordInputState` (the
3-state derivation) — both existed only to feed the now-removed `inputState` prop. **Kept**: `allPasswordMet =
allPasswordRulesMet(password)`, still gating `disabled={loading || !allPasswordMet || !captchaToken}` on the
submit button, unchanged.

## Current versus required behavior

- **Before:** both password fields were legacy shadcn `PasswordInput` — custom Eye/EyeOff toggle, register field
  additionally showed a red/green border ring driven by `inputState`.
- **Required after:** both are Mantine `PasswordInput` with theme §6e chrome (44px, built-in visibility toggle,
  dynamically localized aria-label); **no field border-state** (owner Option A) — `PasswordRequirementsHint`
  alone conveys register validation feedback; login's Label + forgot-password row and every handler/state/gate
  behave exactly as before.

**Applicable negative flows:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login submit (happy + wrong-creds) | Yes (regression) | Registry P0 | Unchanged handler/error | `browser.smoke.test.ts` 4/4 PASS |
| Signup weak-pw block (submit gate) | Yes (regression) | Registry P0 | Submit stays disabled until `allPasswordMet` | `signUpWithCaptcha.smoke.test.ts` 4/4 PASS; live: `Зареєструватись` visibly disabled/grayed while password is `abc` |
| Signup dup-email/captcha-fail | Yes (regression) | Registry P0 | Unchanged typed errors | `signUpWithCaptcha.smoke.test.ts` 4/4 PASS |
| Recovery / Phone (untouched fields) | Yes (regression) | Registry P0 | Unchanged | `requestPasswordReset.smoke.test.ts` 4/4 PASS; `PhoneField.smoke.test.tsx` 3/3 PASS |
| Cross-view sync (register password `onSharedChange`) | Yes | R2 | password persists register↔register-agent switch | Live: typed `CrossViewPw1!` in `register`, switched to `register-agent`, `inputValue()` confirmed unchanged; rendered `register-agent__uk__mobile-390__password-persisted.png` |
| Show/hide toggle + aria | Yes | R5 | toggle reveals/masks; localized accessible name | Live: `type` `password`→`text`; `aria-label` uk `"Показати пароль"`→`"Приховати пароль"`; rendered `login__uk__mobile-390__password-revealed.png` |
| Register hint feedback (post border-removal) | Yes | R3 | hint still shows per-rule ✓/✗ + error message; no field ring | Rendered `register__uk__mobile-390__password-partial.png` (4× ✗ + 1× ✓ + error message) and `-complete.png` (5× ✓); computed `borderColor` identical between both |
| Locale expansion (label/toggle sq/uk/it) | Yes | R7 | label + hint wrap/localize, no clip at 320, uk@320 | Rendered `register__sq__mobile-320.png`, `register__it__mobile-390.png`, mandatory `uk@320` (`login`, `register`) |
| OAuth actual sign-in | No (manual-only, exempt) | Registry | Unchanged | — |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | Both legacy `@/components/ui/PasswordInput` usages converted to `@mantine/core` `PasswordInput`; `PasswordInputState` type import removed; `hasPasswordInput`/`passwordInputState` locals removed (owner Option A), `allPasswordMet` kept; P2's `Label` folded into the `PasswordInput` `label` prop; both fields wired with a local `passwordVisible` state + `visible`/`onVisibilityChange`/`visibilityToggleButtonProps` for a dynamically localized show/hide toggle; `useTranslations('common')` added to `LoginView`/`RegisterView` for the toggle's aria strings. No handler, `allPasswordMet` gate, captcha, or other-file change. |

`git diff --stat`: single file — `src/modules/auth/components/AuthSheet.tsx` only (+ this session log +
`docs/backlog.md`).

## Validation evidence

1. `npm run typecheck` → **0 errors.**
2. `npm run check:stories` → **PASSED — 120 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED — 2203/2203 keys, all 4 locales, no new key** (reused existing `common.show_password`/`common.hide_password`).
4. `npm run check:mojibake` → **PASSED — 0 artifacts in 1811 files.**
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → **4/4 PASS** (weak-password submit-gate path unaffected).
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → **3/3 PASS.**
   - `npm run test:header-hydration-id-parity` → **3/3 PASS.**
6. **Rendered (live-app, same mechanism as Tasks 633–635):** `npm run dev` (Turbopack, port 3001), then an ad-hoc
   Playwright script (`scripts/_ad-hoc-task636-authsheet-capture.mjs`, deleted after use) dispatched
   `lero:open-auth-sheet` and captured **viewport-only** screenshots plus live DOM checks. Captured and verified:
   - `login__uk__mobile-320.png` / `desktop-1280.png` — `Пароль` label + forgot-password row unchanged, Mantine
     password chrome with the eye toggle icon.
   - `login__uk__mobile-390__password-masked.png` / `-revealed.png` — filled `MySecret123!`, toggle click:
     `getAttribute('type')` `password`→`text` confirmed programmatically; `aria-label`
     `"Показати пароль"`→`"Приховати пароль"` confirmed programmatically — **R5 proof.**
   - `register__uk__mobile-390__password-partial.png` (password `abc`) — hint shows the red error message +
     4× red ✗ + 1× green ✓ (lowercase rule met), field shows only the standard focus outline (same color as the
     complete-password screenshot, confirmed via `getComputedStyle().borderColor` equality) — **no error ring.**
   - `register__uk__mobile-390__password-complete.png` (password `Abc123!@#Strong`) — hint shows 5× green ✓, same
     neutral field border as the partial-password screenshot — **R3/Option-A proof: field border-state does not
     differentiate valid/invalid, hint is the sole feedback channel.**
   - `register-agent__uk__mobile-390__password-persisted.png` — after typing in `register` and switching to
     `register-agent`, `#reg-password`'s `inputValue()` confirmed still `"CrossViewPw1!"` — **cross-view sync
     proof.**
   - `register__sq__mobile-320.png`, `register__it__mobile-390.png` — label/hint render correctly in sq/it, no
     clipping. Mandatory `uk@320` present (`login`, `register`).
   - Console/`pageerror` listener attached on every page: **zero errors reference `AuthSheet`, `PasswordInput`,
     or `PasswordRequirementsHint`.** The only noise was the same two pre-documented, unrelated classes seen in
     Tasks 634/635 (benign `%c%d font-size:0;color:transparent NaN` dev-tooling marker; the `docs/backlog.md`
     "Console NOISE" `UserMenu`/`AgentCtaButton`/`FooterView` hydration-attribute noise, on files this task never
     touched).
7. `git status --short` / `git diff --stat` → exactly `src/modules/auth/components/AuthSheet.tsx` (+ this session
   log + `docs/backlog.md`). Ad-hoc capture script and screenshots are session-scratchpad artifacts, not committed.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Password field chrome (both fields) | `AuthSheet.tsx` inline `PasswordInput` elements | `.mantine-PasswordInput-*` (was shadcn `data-slot="password-input"` div + `Input`) | `theme.ts` `PasswordInput` block (§6e, `minHeight: 2.75rem`, `inputWrapperOrder`) | **Changed** (intended, R1) | Diff; rendered proof |
| Register field border-state (red/green ring) | `inputState` prop (legacy) → **removed entirely** | `border-destructive`/`border-status-success` Tailwind classes → none | N/A — owner Option A, no replacement styling | **Removed (owner-authorized intended change, R3)** | Diff; live `borderColor` equality check; rendered partial/complete screenshots |
| Show/hide toggle | hand-rolled `<button>` + Eye/EyeOff (legacy) → Mantine built-in toggle | `.mantine-PasswordInput-visibilityToggle` | Mantine's own `visible`/`onVisibilityChange`/`visibilityToggleButtonProps` API (no local icon/button markup) | **Changed (mechanism), preserved (localized a11y + reveal/mask behavior)** | Diff; live `type`/`aria-label` toggle check |
| `PasswordRequirementsHint` (register) | unchanged | unchanged | unchanged (still `@/components/ui/PasswordRequirementsHint`, retained per kickoff) | **Preserved, untouched** | Diff — `<PasswordRequirementsHint value={password} />` line identical to `HEAD` |
| P1 Label + forgot-password row | unchanged | unchanged | unchanged (still `@/components/ui/label` + native `<button>`) | **Preserved, untouched** | Diff — outside every hunk |
| 4 out-of-scope `Label`s (Combobox ×2, logo, `AgentCityField`) + `@/components/ui/label` import | unchanged | unchanged | unchanged | **Preserved, untouched** | `grep -n "<Label"` — 4 matches remain (down from 5 in Task 635, since P1's `login-password` Label was already counted there and stays; P2's `reg-password` Label is the one folded away this slice) |
| `theme.ts`, `MantineDrawer.tsx`, `MantineAuthFormPattern.tsx`, other consumers, any story, i18n keys | — | — | — | **Out of scope, untouched** | `git diff --stat` |

## Self-review findings

- **No defect found.** All typecheck/check:stories/check:i18n/check:mojibake gates and all 5 named regression
  commands are green, unchanged — including `signUpWithCaptcha.smoke`, which specifically exercises the weak-
  password submit-gate path that continues to rely on the retained `allPasswordMet` local.
- The kickoff flagged the visibility-toggle aria-label as an open implementation choice (static vs. controlled
  dynamic label). Chose the **controlled** path (`visible`/`onVisibilityChange` + dynamic
  `visibilityToggleButtonProps`) to preserve the legacy component's exact dynamic-label behavior rather than the
  simpler static-label option — verified correct via live DOM checks (`aria-label` actually flips between the two
  localized strings on click, not just present once).
- Confirmed the border-state removal produces **identical** computed `border-color` between a weak and a fully-
  valid password (not just "visually similar") — this was checked via `getComputedStyle()`, not eyeballing alone,
  to give the reviewer a stronger AC3 proof than a screenshot comparison.

## Assumptions, deviations, and limitations

- Option A (drop border-state, keep hint) is the owner's own resolved decision in the kickoff — implemented
  exactly as specified, not treated as an open question.
- No `theme.ts`, `MantineDrawer.tsx`, `MantineAuthFormPattern.tsx`, other consumer, story, or i18n key was
  touched. `@/components/ui/label` and `@/components/ui/PasswordRequirementsHint` imports and their remaining
  consumers are unchanged, confirmed via `grep`.
- This is **Slice 2c of the AuthSheet migration**; Slice 2d (`Alert`/`AlertDescription`), 2e (`Combobox`/
  `LocationCombobox` + their Labels + the logo-upload Label) remain explicitly open per the kickoff's sub-slicing
  plan.

## Opus handoff

Diff: `src/modules/auth/components/AuthSheet.tsx` only (product code).

Questions/risks for the reviewer to inspect:

1. Confirm the owner's Option A (field border-state removal) is being correctly treated as an in-scope, intended
   visual change per the kickoff's explicit resolution — not flagged as a clause-3 capability regression.
2. Confirm the controlled `visible`/`onVisibilityChange` approach (vs. a simpler static aria-label) is the
   preferred implementation — it exactly preserves the legacy dynamic-label behavior at the cost of one extra
   `useState` per view.
3. Confirm removing only `hasPasswordInput`/`passwordInputState` (keeping `allPasswordMet`) is the correct,
   minimal local-state cleanup per R2/AC2.
4. Confirm this is Slice 2c only — Slices 2d/2e remain explicitly open, not touched here.
5. No `theme.ts`/`MantineAuthFormPattern.tsx`/other-consumer/story/i18n-key edit — confirm via `git diff --stat`.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
