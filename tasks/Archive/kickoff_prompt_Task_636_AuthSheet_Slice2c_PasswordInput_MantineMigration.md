# Task 636 — AuthSheet migration Slice 2c (`PasswordInput`): replace the two legacy shadcn `PasswordInput` fields with the canonical Mantine `PasswordInput`, dropping the redundant custom border-state in favor of the retained `PasswordRequirementsHint` (owner-approved), preserving all password state, submit gating, and captcha logic byte-for-byte

- **Task number:** 636
- **Epic:** MM — Mantine/TailAdmin Restyle (auth-overlay migration, Slice 2c of the shell-first plan).
- **Parent / origin:** Continues the AuthSheet migration. Task 633 = Slice 1 (shell), 634 = Slice 2a (Button), 635 = Slice 2b (Input/Label → TextInput). Owner directive 2026-07-20: proceed to Slice 2c. This slice migrates the two password fields. `Combobox`/`LocationCombobox` (Slice 2e) and `Alert` (Slice 2d) remain deferred.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine primitive migration of a **Q4 critical-flow** overlay. Presentational + one **owner-approved intended UX change** (removal of the redundant password-field border-state — see the Owner decision below). No password state, validation, submit-gating, captcha, or `onChange` logic changes.

## Owner decision (resolved 2026-07-20)

The legacy `PasswordInput` exposes a custom 3-state border via `inputState: 'idle' | 'error' | 'success'` (red ring on invalid, green ring when all rules met). The register field drives it with `passwordInputState = hasPasswordInput ? (allPasswordMet ? 'success' : 'error') : 'idle'`. **The canonical Mantine `PasswordInput` (used by `MantineAuthFormPattern.tsx`) has no `success` state**, and the retained `PasswordRequirementsHint` already conveys success (green ✓ per rule) and error (red `password_requirements_error` message + red ✗) explicitly, making the field border a redundant secondary affordance.

**Owner-chosen resolution: Option A — drop the field border-state, keep the hint.** Migrate to Mantine `PasswordInput` with `label`/`value`/`onChange`/`required` and **no** `error`/success border on the field; `PasswordRequirementsHint` remains the sole validation-feedback affordance. This aligns with the canonical `MantineAuthFormPattern` and removes the `PasswordInputState` coupling entirely. This is an **intended, authorized** visual change (the green/red field ring disappears), not an accidental capability removal (agent-contract clause 3) — the reviewer must treat it as in-scope by owner directive.

## Objective

In `src/modules/auth/components/AuthSheet.tsx`, replace the two legacy shadcn `PasswordInput` (`@/components/ui/PasswordInput`) usages — login-password and reg-password — with the canonical Mantine `PasswordInput` (`@mantine/core`). Remove the `@/components/ui/PasswordInput` import and the now-unused `PasswordInputState` type + `passwordInputState`/`hasPasswordInput` locals. Keep `PasswordRequirementsHint` and `allPasswordRulesMet` (the hint display + the `allPasswordMet` submit gate) exactly as-is. Every password field keeps its `value`, `onChange` (including reg's cross-view `onSharedChange` sync), `required`, `autoComplete`, and explicit `id`. The show/hide toggle is preserved via Mantine's built-in visibility toggle with localized aria labels.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Tasks 633–635 committed; `AuthSheet.tsx` already has Mantine `Button`/`Text`/`TextInput`/`MantineDrawer`). Reference fields by `id`/structure (line numbers shift as slices land).

### The two in-scope `PasswordInput` fields

| ID | View | Current structure | Props | Label handling | State/hint |
|---|---|---|---|---|---|
| P1 | `LoginView` password | `<div className="flex flex-col gap-1.5"><div className="flex items-center justify-between"><Label htmlFor="login-password">{t('password')}</Label><button …forgot-password…/></div><PasswordInput id="login-password" …/></div>` | `id="login-password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"` (no `inputState`, idle) | **Label + forgot-password button row STAYS** (the label shares a `justify-between` row with the forgot link — Mantine's `label` prop can't host that cleanly); the legacy `<Label htmlFor="login-password">` remains and associates to the Mantine input via `id="login-password"` | no state, no hint |
| P2 | `RegisterView` password | `<div className="flex flex-col gap-1.5"><Label htmlFor="reg-password">{t('password')}</Label><PasswordInput id="reg-password" … inputState={passwordInputState}/><PasswordRequirementsHint value={password}/></div>` | `id="reg-password" value={password} onChange={e => { const v = e.target.value; setPassword(v); onSharedChange?.({ name, email, password: v, phone }) }} required autoComplete="new-password"` + `inputState={passwordInputState}` | fold `<Label htmlFor="reg-password">{t('password')}</Label>` into Mantine `PasswordInput label={t('password')}` | **drop `inputState`** (Option A); **keep the wrapper `<div className="flex flex-col gap-1.5">`** so the Mantine `PasswordInput` + the unchanged `<PasswordRequirementsHint value={password}/>` stay tightly grouped |

### State locals to remove / keep (`RegisterView`, current L568–570)

```
const hasPasswordInput = password.length > 0                                             // REMOVE (only feeds passwordInputState)
const allPasswordMet = allPasswordRulesMet(password)                                     // KEEP — submit gate: disabled={loading || !allPasswordMet || !captchaToken}
const passwordInputState: PasswordInputState = hasPasswordInput ? (allPasswordMet ? 'success' : 'error') : 'idle'  // REMOVE
```

`allPasswordMet` MUST stay — it gates the register submit button (weak-password block, a Signup critical-flow guard covered by `signUpWithCaptcha.smoke`). Only `hasPasswordInput` and `passwordInputState` are removed.

### Legacy `PasswordInput` component (`src/components/ui/PasswordInput.tsx`)

Wraps the legacy `Input` with a custom Eye/EyeOff show/hide toggle (localized `common.show_password`/`common.hide_password` aria-labels) and the `inputState` border rings. Mantine `PasswordInput` provides its **own built-in visibility toggle** — to preserve the localized accessible name, pass `visibilityToggleButtonProps={{ 'aria-label': visible ? t('hide_password') : t('show_password') }}` is not directly available (Mantine controls `visible` internally); instead pass a static localized `aria-label` via `visibilityToggleButtonProps={{ 'aria-label': tc('show_password') }}` (or wire `visible`/`onVisibilityChange` controlled if a dynamic label is required — verify rendered a11y and pick the simpler correct option). The `common` namespace already has both keys (no new i18n key).

### Canonical Mantine `PasswordInput` — verified provenance

- **Source / gate:** `import { PasswordInput } from '@mantine/core'`; chrome owned by `theme.ts` `PasswordInput` block (~L345): `defaultProps { radius:'lg', size:'sm', inputWrapperOrder:['label','input','description','error'] }`, `styles.input { minHeight:'2.75rem', color: gray-8 }`; border/focus/error chrome via `input-chrome.css` (§6e, Task 505).
- **Canonical story:** `src/stories/mantine/primitives/PasswordInput.stories.tsx` (gated). **Precedent consumer:** `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx` (Mantine `PasswordInput label required {...form.getInputProps('password')}` — no success state; error via the `error` prop only). This slice does **not** adopt `MantineAuthFormPattern` wholesale (owner deferred that pattern-first path); it reuses the `PasswordInput` primitive directly, mirroring the pattern's prop usage minus the `error` prop (Option A).

### Critical-flow registry (P0 Auth lifecycle)

Login and Signup route through these password fields. The handlers, `allPasswordMet` gate, and captcha are untouched, so the named smokes are an **unchanged-green regression baseline** (same five smokes + `test:header-hydration-id-parity` as Tasks 633–635). `signUpWithCaptcha.smoke` covers the weak-password path — it must stay green, proving the submit gate still blocks weak passwords after the `inputState` removal.

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Slice migration | Both `PasswordInput` (P1, P2) are `@mantine/core` `PasswordInput`; the `@/components/ui/PasswordInput` import and the `PasswordInputState` type import are removed; no `@/components/ui/PasswordInput` reference remains | P0 | `git diff`; `grep "ui/PasswordInput\b" AuthSheet.tsx` → no match |
| R2 | Behavior parity | Both fields keep `value`, `onChange` body (incl. P2 `onSharedChange`), `required`, `autoComplete`, and explicit `id`; `allPasswordMet` submit gate unchanged; `hasPasswordInput`/`passwordInputState` removed with no other logic change; captcha/handlers untouched | P0 | `git diff`; named auth smokes green (esp. `signUpWithCaptcha.smoke` weak-pw) |
| R3 | Owner decision (Option A) | The field border-state is dropped (no `error`/success ring on the Mantine field); `PasswordRequirementsHint value={password}` is retained unchanged in the register field as the sole validation-feedback affordance | P0 | `git diff` shows no `error=`/success style on the fields; hint present |
| R4 | Label boundary | P2's `<Label htmlFor="reg-password">` is folded into `PasswordInput label={t('password')}`; P1's Label + forgot-password button row is preserved (legacy `Label` stays, associates via `id`); the `@/components/ui/label` import REMAINS (login-password + Combobox ×2 + logo consumers) | P0 | `git diff`; `grep "components/ui/label" AuthSheet.tsx` → present; P1 label row unchanged |
| R5 | Show/hide + a11y | Each field has a working show/hide toggle (Mantine built-in) with a localized accessible name (`common.show_password`/`hide_password`); no new i18n key | P1 | Rendered: toggle reveals/masks; DOM/aria inspection of the toggle button |
| R6 | Critical-flow regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged) | P0 | Named vitest commands exit 0 |
| R7 | No legacy leak / gates | No new legacy `@/components/ui/*` import; `Label`/`Alert`/`Combobox`/`LocationCombobox`/`PasswordRequirementsHint` imports remain (deferred/retained); `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0; `git diff` import block |

## Assumptions and open questions

- **Owner decision Option A is settled** (drop border-state, keep hint) — no open canonical decision remains.
- **Visibility-toggle aria label:** preserve a localized accessible name; if a dynamic show/hide label requires controlling Mantine's `visible` state, the executor may wire the controlled `visible`/`onVisibilityChange` props, but the simplest correct option that keeps an accessible localized name is acceptable — verify via rendered a11y.
- `PasswordRequirementsHint` (`@/components/ui/PasswordRequirementsHint`) is a separate legacy display component that is **retained as-is** this slice (not migrated); `allPasswordRulesMet` continues to feed `allPasswordMet`.
- No `theme.ts`, `MantineDrawer.tsx`, `MantineAuthFormPattern.tsx`, other consumer, story, or i18n key is touched.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable — note the owner-authorized border-state removal, 4 editable-controls, 7 i18n, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/qa-profiles.md` (Q4) and `docs/critical-flow-registry.md` (P0 Auth lifecycle — Login, Signup).
- `docs/mantine-responsive-design-system.md` (§6e input chrome), `docs/tailadmin-style-reference.md`, `docs/component-rules.md` (i18n, no-duplicate).
- Source: `src/modules/auth/components/AuthSheet.tsx` (target); `src/components/ui/PasswordInput.tsx` (legacy, for the toggle/state semantics being replaced); `src/design-system/mantine/theme.ts` (`PasswordInput` §6e block); `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx` + `src/stories/mantine/primitives/PasswordInput.stories.tsx` (canonical precedent); `package.json`.

## Scope

1. In `AuthSheet.tsx`, remove `import { PasswordInput, type PasswordInputState } from '@/components/ui/PasswordInput'`; add `PasswordInput` to the `@mantine/core` import (already has `Button`, `Text`, `TextInput`).
2. P1 (login): swap the inner `<PasswordInput …/>` for a Mantine `<PasswordInput …/>` carrying the same `id`/`value`/`onChange`/`required`/`autoComplete="current-password"` (no `label` prop — the external Label row stays); add the localized visibility-toggle aria. Leave the `<Label htmlFor="login-password">` + forgot-password button row untouched.
3. P2 (register): fold the `<Label htmlFor="reg-password">{t('password')}</Label>` into `PasswordInput label={t('password')}`; drop `inputState`; keep the wrapper `<div className="flex flex-col gap-1.5">` holding the Mantine `PasswordInput` + the unchanged `<PasswordRequirementsHint value={password}/>`; preserve `id`/`value`/`onChange` body/`required`/`autoComplete="new-password"`; add the localized visibility-toggle aria.
4. Remove the now-unused `hasPasswordInput` and `passwordInputState` locals; keep `allPasswordMet`.
5. Produce the Q4 regression + rendered evidence (verification plan).
6. Write the session log + concise `docs/backlog.md` update; note this is Slice 2c, the owner-approved border-state removal, and that Slices 2d (`Alert`), 2e (`Combobox`/`LocationCombobox`) remain open.

## Out of scope

- Any change to password state, `allPasswordMet` gate, validation, captcha, submit handlers, OAuth, error mapping, success screens, or the `PasswordRequirementsHint` component/`allPasswordRulesMet` logic.
- `Combobox`/`LocationCombobox` + their two `Label`s (Slice 2e); `Alert`/`AlertDescription` (Slice 2d); the logo-upload `Label`.
- Removing the `@/components/ui/label` or `@/components/ui/PasswordRequirementsHint` imports (still have consumers).
- Adopting `MantineAuthFormPattern` (owner-deferred pattern-first path).
- `theme.ts`, `MantineDrawer.tsx`, stories, i18n keys.

## Current and required behavior

- **Current:** both password fields are legacy shadcn `PasswordInput` (custom Eye/EyeOff toggle, `inputState` red/green border); register field shows `inputState` + the hint.
- **Required after:** both are Mantine `PasswordInput` with theme §6e chrome (44px, built-in visibility toggle, localized aria), the register field's label folded into the `label` prop; **no field border-state** (owner Option A); the register `PasswordRequirementsHint` retained and unchanged; every password value/onChange/`allPasswordMet` submit-gate/captcha behaves exactly as before; login label + forgot-password row preserved.

## Positive and negative flows

**Positive:** open login/register → password field renders with Mantine chrome + show/hide toggle → typing updates `password` (register also syncs cross-view via `onSharedChange`) → register hint updates per rule (green ✓ / red ✗ + error message) → submit stays disabled until `allPasswordMet` (+ captcha) → login/signup succeed/fail with the same localized results.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login submit (happy + wrong-creds) | **Yes (regression)** | Registry P0 | Unchanged handler/error | `browser.smoke` green |
| Signup weak-pw block (submit gate) | **Yes (regression)** | Registry P0 | Submit disabled until `allPasswordMet`; weak pw → `signup_failed` unchanged | `signUpWithCaptcha.smoke` green |
| Signup dup-email / captcha-fail | **Yes (regression)** | Registry P0 | Unchanged typed errors | `signUpWithCaptcha.smoke` green |
| Recovery / Phone (untouched fields) | **Yes (regression)** | Registry P0 | Unchanged | `requestPasswordReset.smoke` / `PhoneField.smoke` green |
| Cross-view sync (register password `onSharedChange`) | **Yes** | R2 | password persists register↔register-agent switch | Rendered: type pw, switch, value persists |
| Show/hide toggle + aria | **Yes** | R5 | toggle reveals/masks; localized accessible name | Rendered + DOM/aria inspection |
| Register hint feedback (post border-removal) | **Yes** | R3 | hint still shows per-rule ✓/✗ + error message; no field ring | Rendered register with partial/complete pw |
| Locale expansion (label/toggle sq/uk/it) | **Yes** | R7 | label + aria wrap/localize, no clip at 320, uk@320 | Rendered `uk@320` |
| OAuth actual sign-in | No (manual-only, exempt) | Registry | Unchanged | — |

## Acceptance criteria

- `AC1 [R1]` Given the diff, when inspected, then both password fields render `@mantine/core` `PasswordInput` and `AuthSheet.tsx` has no `@/components/ui/PasswordInput` or `PasswordInputState` reference.
- `AC2 [R2]` Given each field, when compared to `HEAD`, then `value`/`onChange` body/`required`/`autoComplete`/`id` are preserved, `allPasswordMet` and the submit gate are unchanged, and `hasPasswordInput`/`passwordInputState` are removed with no other logic change.
- `AC3 [R3]` Given the register field, when rendered with partial then complete input, then there is no red/green field border, and `PasswordRequirementsHint` shows the per-rule ✓/✗ and the error message as before.
- `AC4 [R4]` Given the diff, then P2's label renders via the `PasswordInput` `label` prop, P1's Label + forgot-password row is unchanged, and the `@/components/ui/label` import remains.
- `AC5 [R5]` Given each field, when rendered, then the show/hide toggle masks/reveals the value and exposes a localized accessible name; no new i18n key.
- `AC6 [R6,R7]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new legacy `@/components/ui/*` import exists (Label/Alert/Combobox/PasswordRequirementsHint imports remain).

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle entry point). Presentational + owner-approved UX change; the auth smokes are an unchanged-green regression baseline; rendered evidence at Q3 depth for the two fields. Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity (no new key).
4. `npm run check:mojibake` → 0 artifacts.
5. **Critical-flow regression (must stay green, unchanged):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts`
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx`
   - `npm run test:header-hydration-id-parity`
6. **Rendered:** `login` + `register`/`register-agent` (the password-bearing views) × `{320,375,390}` + one desktop width × the 4 locales at 320, `uk@320` mandatory. `AuthSheet` has no Storybook story — use the live-app Playwright capture via `lero:open-auth-sheet` (Tasks 633–635 precedent). Confirm: Mantine password chrome (44px), show/hide toggle masks/reveals + localized aria, register hint renders + updates per-rule with NO field border-state, cross-view password persistence, submit disabled until `allPasswordMet`, login label + forgot-password row intact, no clip/overflow at uk@320. Capture at minimum `login__uk__mobile-320` (toggle) and `register__uk__mobile-320` (hint, no border, label folded).
7. `git status --short` / `git diff --stat` → only `AuthSheet.tsx` (+ session log + `docs/backlog.md`). Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task636-authsheet-passwordinput-mantine-migration.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R7 each with evidence; the P1/P2 before/after mapping; the removed locals (`hasPasswordInput`/`passwordInputState`) and retained `allPasswordMet`; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green, esp. weak-pw block); the rendered cells (locations) incl. the toggle + the register hint-without-border + cross-view persistence + `uk@320`; the canonical decision (reuse `@mantine/core` `PasswordInput`; Option A border-state drop per owner); explicit confirmation that no password logic/`allPasswordMet` gate/captcha/handler/`id`, `theme.ts`, `PasswordRequirementsHint`, other consumer, story, or i18n key was touched, that the `@/components/ui/label` + `PasswordRequirementsHint` imports remain, and that this is Slice 2c (2d `Alert`, 2e `Combobox`/`LocationCombobox` remain open). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: both fields by `id`/structure, exact props and `onChange` bodies, the label handling per field (P2 folded, P1 row preserved), the state-local cleanup (remove `hasPasswordInput`/`passwordInputState`, keep `allPasswordMet`), the import boundary, the visibility-toggle a11y requirement, the owner Option-A decision, the canonical precedent, and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the weak-password submit gate is explicitly named as a preserved critical-flow guard. ✅
- Scope protects every auth behavior and names what must not change (handlers, `allPasswordMet` gate, captcha, hint, deferred primitives + their Labels, PhoneField, theme, stories, i18n keys). ✅
- The one visible UX change (border-state removal) is an explicit **owner decision (Option A)**, documented so the reviewer treats it as in-scope, not a clause-3 regression. ✅
- Canonical UI decision = **reuse** `@mantine/core` `PasswordInput` (theme §6e gated, canonical story + `MantineAuthFormPattern` precedent), no new story, no copied local styles, no success-state improvisation. ✅
- Negative flows selected by applicability (auth regressions + weak-pw gate + cross-view sync + toggle a11y + hint feedback + locale in; OAuth out with reason). ✅
- Sub-slicing recorded; Slices 2d–2e left explicitly open. ✅
