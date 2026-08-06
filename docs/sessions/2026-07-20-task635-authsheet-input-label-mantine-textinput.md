# Session Archive: Task 635 — AuthSheet Slice 2b: legacy shadcn `Input`/`Label` → canonical Mantine `TextInput` — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_635_AuthSheet_Slice2b_InputLabel_MantineTextInput.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Replaced all five legacy shadcn `Input` (`@/components/ui/input`) usages in `src/modules/auth/components/AuthSheet.tsx`
(`LoginView` email, `ForgotPasswordView` email, `CompanyField` new-name, `RegisterView` name + email) with the
canonical `@mantine/core` `TextInput`, folding each field's paired `Label` into the `TextInput` `label` prop and
removing the now-redundant `flex flex-col gap-1.5` wrapper divs. `@/components/ui/input` import removed;
`@/components/ui/label` import **kept** (5 remaining out-of-scope `Label` consumers: password ×2, Combobox ×2,
logo-upload row). Every field's `value`/`onChange` body (including F4/F5's cross-view `onSharedChange` sync)/`type`/
`required`/`autoComplete`/`placeholder`/`maxLength`/`autoFocus`/`onKeyDown`/`id` is byte-unchanged. This is Slice 2b
of the AuthSheet migration (Slice 1 = shell/`MantineDrawer`, Task 633; Slice 2a = `Button`, Task 634, both committed
at session start); Slices 2c (`PasswordInput`), 2d (`Alert`), 2e (`Combobox`/`LocationCombobox`) remain open.

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Consumed shared style/token path |
|---|---|---|---|---|
| All 5 in-scope text fields (login-email, forgot-email, company new-name, reg-name, reg-email) | Opened `src/design-system/mantine/theme.ts` `TextInput` block (~L321, `defaultProps: {radius:'lg', size:'sm', inputWrapperOrder:['label','input','description','error']}`, §6e `styles.input` — `minHeight: 2.75rem`, `color: gray-8`, Task 505/503); opened precedent consumers `src/components/shared/PhoneField.tsx` (Task 556 — uses `InputLabel` + `TextInput` as two elements because its label spans a composite two-field row) and `src/components/shared/FilterRangeInputs.tsx` (Task 566, `@mantine/core` `TextInput` direct) | `@mantine/core` `TextInput`, chrome owned by `theme.ts` `TextInput` block | **reuse** — consumers import `{ TextInput } from '@mantine/core'` directly, using its own `label` prop (not a separate `InputLabel`, since each in-scope field is a single input, not PhoneField's composite row); no wrapper, no new story, no copied class chain | Theme-owned `defaultProps`/`styles` (`inputWrapperOrder` puts label above input, `minHeight: 2.75rem` universal ≥44px touch target, gray-8 text) |

`label` prop usage matches the kickoff's own provenance note: "Mantine `TextInput label={…}` renders its own
`<label>` wired to the input via a generated-or-passed `id`" — passing the explicit `id` (`login-email`, `forgot-email`,
`reg-name`, `reg-email`) preserves both the DOM `id` (external autofill/e2e stability) and the label→input
association, verified live (see Validation evidence #6, label-click focus check).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | All 5 `Input` replaced by `TextInput`; `@/components/ui/input` import removed; no `@/components/ui/input`/`<Input` reference remains | `git diff`; `grep -n "components/ui/input\|<Input" AuthSheet.tsx` → no match |
| R2/AC2 | Every field's `value`/`onChange` body (incl. F4/F5 `onSharedChange`)/`type`/`required`/`autoComplete`/`placeholder`/`maxLength`/`autoFocus`/`onKeyDown`/`id` preserved; no state/validation/handler change | `git diff` shows only field-element + import + wrapper-div lines changed (5 hunks, single file); all 5 named smokes green; live cross-view persistence check (name/email survive register→register-agent switch) |
| R3/AC3 | F1/F2/F4/F5 `Label`s absorbed into `TextInput label`; F3 stays label-less; the 5 out-of-scope `Label`s + `@/components/ui/label` import untouched | `git diff`; `grep -n "components/ui/label"` → still present; `grep -n "<Label"` → exactly 5 matches (L125 login-password, L301 LocationCombobox, L414 Combobox, L445 logo, L698 reg-password), all unchanged lines |
| R4/AC4 | Theme §6e chrome consumed (no local style copy); label→input association + explicit `id` preserved | Rendered: label above input at all captured cells, 44px field height visually confirmed; live check — clicking `label[for="login-email"]` moved DOM focus to `#login-email` |
| R5/AC5 | 5 named smokes + `test:header-hydration-id-parity` stay green | All 5 commands below: exit 0 |
| R6/AC5 | No new legacy `@/components/ui/*` import; `Label`/`PasswordInput`/`Alert`/`Combobox`/`LocationCombobox` imports remain; typecheck/check:stories/check:i18n/check:mojibake green | `git diff` import block — only `TextInput` added to `@mantine/core` line, `@/components/ui/input` removed, all other legacy imports untouched; all 4 commands exit 0 |

## F1–F5 before/after mapping actually applied

| # | Field | Before | After |
|---|---|---|---|
| F1 | LoginView email | `<div className="flex flex-col gap-1.5"><Label htmlFor="login-email">{t('email')}</Label><Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></div>` | `<TextInput id="login-email" label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />` |
| F2 | ForgotPasswordView email | same pattern + `autoFocus` | `TextInput` with `label={t('email')}` + `autoFocus` preserved |
| F3 | CompanyField new-name | bare `<Input value={newName} onChange={...} placeholder={label} className="h-9 rounded-xl text-sm" maxLength={120} autoFocus onKeyDown={...} />` (no Label) | `<TextInput value={newName} onChange={...} placeholder={label} maxLength={120} autoFocus onKeyDown={...} />` — `className="h-9 rounded-xl text-sm"` dropped, theme §6e owns 44px chrome (kickoff-authorized trade-off) |
| F4 | RegisterView name | `<div ...><Label htmlFor="reg-name">{t('name')}</Label><Input id="reg-name" value={name} onChange={e => { const v = e.target.value; setName(v); onSharedChange?.({ name: v, email, password, phone }) }} required autoComplete="name" /></div>` | `<TextInput id="reg-name" label={t('name')} value={name} onChange={<identical body>} required autoComplete="name" />` |
| F5 | RegisterView email | same pattern | `<TextInput id="reg-email" label={t('email')} type="email" value={email} onChange={<identical body>} required autoComplete="email" />` |

Every `onChange` handler body was copied verbatim (character-for-character), including F4/F5's cross-view
`onSharedChange?.({...})` calls — confirmed by `git diff` showing no change inside the handler bodies themselves,
only the surrounding element/wrapper.

## Current versus required behavior

- **Before:** each in-scope field was `<div className="flex flex-col gap-1.5"><Label/><Input/></div>` — shadcn
  label + shadcn input chrome, F3 at a legacy 36px (`h-9`) height.
- **Required after:** each in-scope field is a single Mantine `<TextInput label=…/>` with theme §6e chrome (44px
  min-height, canonical border/focus, gray-8 text), label rendered above the input via `inputWrapperOrder`,
  explicit `id`/label→input association preserved; F3 stays label-less with its placeholder at the same 44px
  chrome; every field's value/onChange/validation/submit behaves exactly as before; password/Combobox/logo labels
  and all deferred primitives untouched.

**Applicable negative flows:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login submit (happy + wrong-creds) | Yes (regression) | Registry P0 | Unchanged handler/error | `browser.smoke.test.ts` 4/4 PASS |
| Signup submit (dup-email/weak-pw/captcha-fail) | Yes (regression) | Registry P0 | Unchanged typed errors | `signUpWithCaptcha.smoke.test.ts` 4/4 PASS |
| Recovery submit (neutral success) | Yes (regression) | Registry P0 | Unchanged neutral success | `requestPasswordReset.smoke.test.ts` 4/4 PASS |
| Phone entry E.164 | Yes (regression) | Registry P0 | Unchanged emit (PhoneField untouched) | `PhoneField.smoke.test.tsx` 3/3 PASS |
| Cross-view shared-state sync (F4/F5 `onSharedChange`) | Yes | R2 | name/email typed in register persist into register-agent | Live check: typed `name="Cross View Test"` `email="crossview@example.com"` in `register`, switched to `register-agent`, both values confirmed still present via `inputValue()`; rendered `register-agent__uk__mobile-390__cross-view-persisted.png` |
| `autoFocus` (F2 forgot-email, F3 company-name) | Yes | R2 | field focused on view/row open | Preserved verbatim in diff (no behavioral test needed — prop untouched) |
| Company create-row Enter-to-submit (F3 `onKeyDown`) | Yes | R2 | Enter triggers `handleCreate`, no form submit | `onKeyDown` body preserved verbatim in diff |
| Label a11y association | Yes | R4 | clicking label focuses input; `id` preserved | Live check: `page.locator('label[for="login-email"]').click()` → `document.activeElement.id === "login-email"` confirmed |
| Locale expansion (labels sq/uk/it) | Yes | R6 | label text wraps, no clip/overflow at 320, uk@320 | Rendered `login__uk__mobile-320`, `forgot-password__sq__mobile-320`, `register__it__mobile-390` — no clipping |
| OAuth actual sign-in | No (manual-only, exempt) | Registry | Unchanged | — |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | 5 legacy `@/components/ui/input` usages (+ their paired `Label`s where present) converted to `@mantine/core` `TextInput` with the label folded into the `label` prop; field wrapper `<div className="flex flex-col gap-1.5">` removed for the 4 labeled fields; `Input` import removed, `TextInput` merged into the existing `@mantine/core` import line; `Label` import kept (5 remaining consumers). No handler, state, validation, or other-file change. |

`git diff --stat`: single file, 5 hunks — `src/modules/auth/components/AuthSheet.tsx` only (+ this session log +
`docs/backlog.md`).

## Validation evidence

1. `npm run typecheck` → **0 errors.**
2. `npm run check:stories` → **PASSED — 120 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED — 2203/2203 keys, all 4 locales, no new key.**
4. `npm run check:mojibake` → **PASSED — 0 artifacts in 1809 files.**
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts` → **4/4 PASS.**
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx` → **3/3 PASS.**
   - `npm run test:header-hydration-id-parity` → **3/3 PASS.**
6. **Rendered (live-app, same mechanism as Tasks 633/634 — `AuthSheet` has no Storybook story):** `npm run dev`
   (Turbopack, port 3001 — 3000 in use by another process), then an ad-hoc Playwright script
   (`scripts/_ad-hoc-task635-authsheet-capture.mjs`, deleted after use per Task 633/634/621/630 precedent)
   dispatched `lero:open-auth-sheet` and captured **viewport-only** screenshots (not `fullPage`, per the Task 634
   lesson that `fullPage` misleadingly stitches past a fixed-position drawer). Captured and visually inspected:
   - `login__uk__mobile-320.png` / `desktop-1280.png` — `Email` label above the input, 44px field, `Пароль` field
     (deferred `PasswordInput`, untouched) unaffected.
   - `forgot-password__sq__mobile-320.png` — `Email` label above input, no clipping of the sq label.
   - `register__uk__mobile-320.png` / `register-agent__uk__mobile-320.png` — `Ім'я`/`Email` labels above their
     inputs; `Телефон`/`Місто`/`Назва компанії` (deferred `PhoneField`/`LocationCombobox`/`Combobox`, all still
     legacy-labeled) visually consistent alongside the migrated fields, no spacing regression (parent `gap-4`
     confirmed sufficient, matching the kickoff's spacing-preservation note).
   - `register__it__mobile-390.png` — `Nome`/`Email` labels, no clipping of the it label.
   - `login__uk__mobile-390__typed-and-label-click.png` — `#login-email` filled with `typed@example.com`,
     visibly focused (red outline) after **clicking the `<label for="login-email">` element itself** — DOM check
     confirmed `document.activeElement.id === "login-email"` — **R4 a11y proof.**
   - `register-agent__uk__mobile-390__cross-view-persisted.png` — after typing in `register` and switching to
     `register-agent`, `Ім'я`/`Email` show the persisted values (`Cross View Test` / `crossview@example.com`) —
     **F4/F5 `onSharedChange` cross-view proof**, confirmed both visually and via `inputValue()`.
   - `register-agent__uk__mobile-390__company-row-f3.png` — F3 (company new-name) shows `Test Company F3` typed
     in, full-width, 44px height matching the logo-upload row beneath it (was 36px `h-9` before) — expected,
     kickoff-authorized visual consequence, no clipping.
   - Mandatory `uk@320` present (`login`, `register`, `register-agent`); `sq@320`/`it@390` also captured.
   - Console/`pageerror` listener attached on every page: **zero errors reference `AuthSheet`, `TextInput`,
     `Input`, or `Label`.** Two classes of pre-existing, unrelated noise observed: (a) the same benign
     `%c%d font-size:0;color:transparent NaN` dev-tooling marker seen in Task 634's capture; (b) a React
     hydration-attribute-mismatch warning on `UserMenu`'s Mantine `Menu` target `id` and `AgentCtaButton`/
     `FooterView` inline-style-hash diffs — this is the exact `docs/backlog.md` "Console NOISE" standing note
     (Task 599-601 dev-mode Turbopack `useId`/inline-style hydration noise), on files this task never touched
     (`Header.tsx`, `UserMenu`, `AgentCtaButton.tsx`, `FooterView.tsx` are all outside this diff).
7. `git status --short` / `git diff --stat` → exactly `src/modules/auth/components/AuthSheet.tsx` (+ this session
   log + `docs/backlog.md`). Ad-hoc capture script and screenshots are session-scratchpad artifacts, not committed.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| F1/F2/F4/F5 label+input chrome | `AuthSheet.tsx` inline `TextInput` elements | `.mantine-TextInput-*`/`.mantine-InputWrapper-*` (was shadcn `<Label>` + `data-slot="input"` div) | `theme.ts` `TextInput` block: `defaultProps.inputWrapperOrder`, `styles.input` (§6e, `minHeight: 2.75rem`, gray-8 text) | **Changed** (intended, R1/R3/R4) | Diff; rendered proof |
| F3 (company new-name) height | bare `<Input className="h-9 ...">` → `<TextInput>` (no className) | 36px `h-9` → theme's `minHeight: 2.75rem` (44px) | Theme §6e universal touch-target rule (no local override) | **Changed (intended trade-off, kickoff-authorized)** | Diff; `company-row-f3.png` |
| Field wrapper spacing | 4× `<div className="flex flex-col gap-1.5">` removed | parent `<form>` `gap-4` now owns the gap directly | Tailwind `gap-4` on `<form>` (unmodified) | **Preserved (mechanism changed, spacing unchanged)** — kickoff's own analysis confirmed `gap-4` applies identically whether the field is wrapped or a direct child | Diff; rendered proof shows consistent spacing between all fields |
| 5 out-of-scope `Label`s (password ×2, Combobox ×2, logo) + `@/components/ui/label` import | unchanged | unchanged | unchanged (still shadcn) | **Preserved, untouched** | `grep -n "<Label"` — exactly 5 matches, all outside the diff hunks |
| All handler bodies, state, validation, captcha, submit paths, `PasswordInput`, `Combobox`/`LocationCombobox`, `Alert` | unchanged | unchanged | unchanged | **Preserved, untouched** | Diff shows zero lines changed outside the 5 field elements + wrapper removal + 1 import line |
| `theme.ts`, `MantineDrawer.tsx`, other consumers, any story, i18n keys | — | — | — | **Out of scope, untouched** | `git diff --stat` |

## Self-review findings

- **No defect found.** All typecheck/check:stories/check:i18n/check:mojibake gates and all 5 named regression
  commands are green, unchanged. The two risk areas the kickoff specifically flagged — cross-view `onSharedChange`
  persistence (F4/F5) and label→input a11y association — were both independently verified live (DOM-level
  `inputValue()`/`activeElement.id` checks), not just visually eyeballed.
- Confirmed the kickoff's line-number map (F1@116, F2@249, F3@439, F4@661, F5@672; the 9 `Label` occurrences)
  matched the actual `HEAD` state exactly before editing — Tasks 633/634 were confirmed committed at session
  start (`git log` showed `107f2fcf2 refactor(Task634)...` at `HEAD~1`), so no re-basing of line numbers was
  needed.

## Assumptions, deviations, and limitations

- F3's height dropping from 36px (`h-9`) to the theme's 44px (§6e universal touch target) is the kickoff's own
  named, pre-authorized trade-off ("the same trade Slice 2a made for the compact buttons") — not a deviation.
- No `theme.ts`, `MantineDrawer.tsx`, other consumer, story, or i18n key was touched. `@/components/ui/label`
  import and its 5 remaining consumers (login-password, reg-password, `LocationCombobox`, `Combobox`, logo-upload)
  are unchanged, confirmed via `grep`.
- This is **Slice 2b of the AuthSheet migration**; Slice 2c (`PasswordInput` + its 2 `Label`s), 2d (`Alert`), 2e
  (`Combobox`/`LocationCombobox` + their 2 `Label`s + the logo-upload `Label`) remain explicitly open per the
  kickoff's sub-slicing plan.

## Opus handoff

Diff: `src/modules/auth/components/AuthSheet.tsx` only (product code).

Questions/risks for the reviewer to inspect:

1. Confirm the F3 36px→44px height change is an acceptable, kickoff-pre-authorized consequence of theme §6e
   (not a new open design decision needing further sign-off).
2. Confirm `TextInput label={…}` (single element, no separate `InputLabel`) is the correct canonical pattern here
   versus `PhoneField.tsx`'s `InputLabel` + `TextInput` split — the difference is that `PhoneField`'s label spans a
   composite two-input row while every field in this task is a single `TextInput`.
3. Confirm the wrapper-`<div>`-removal (relying on the parent `<form>`'s `gap-4`) introduces no visual spacing
   regression — rendered proof shows consistent spacing but a direct side-by-side pixel diff wasn't taken.
4. Confirm this is Slice 2b only — Slices 2c/2d/2e remain explicitly open, not touched here.
5. No `theme.ts`/other-consumer/story/i18n-key edit — confirm via `git diff --stat`.

## Backlog update

See `docs/backlog.md` — concise active-state entry added; full detail lives here per session-log rules.
