# Task 635 — AuthSheet migration Slice 2b (Input/Label → Mantine `TextInput`): replace the five legacy shadcn `Input` fields and their four paired `Label`s with the canonical Mantine `TextInput`, preserving every field's state, `onChange`, `id`, and validation byte-for-byte

- **Task number:** 635
- **Epic:** MM — Mantine/TailAdmin Restyle (auth-overlay migration, Slice 2b of the shell-first plan).
- **Parent / origin:** Continues the AuthSheet migration. Task 633 = Slice 1 (shell `Sheet`→`MantineDrawer`); Task 634 = Slice 2a (all 11 `Button`→Mantine `Button`). Owner directive 2026-07-20: proceed to Slice 2b. This slice migrates the plain **text inputs** and their labels. `PasswordInput` (Slice 2c), `Combobox`/`LocationCombobox` (Slice 2e), and `Alert` (Slice 2d) are explicitly deferred.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine primitive migration of a **Q4 critical-flow** overlay. The change is structural-presentational: the legacy `<div><Label/><Input/></div>` field pattern collapses into a single Mantine `<TextInput label=…/>`. **No field state, `onChange` body, validation, submit path, or `id` changes.** This is higher-structure-risk than Slice 2a (label+input+wrapper markup merges into one component), so the scope boundary against the deferred primitives is defined field-by-field below.

## Objective

In `src/modules/auth/components/AuthSheet.tsx`, replace the five legacy shadcn `Input` (`@/components/ui/input`) usages with the canonical Mantine `TextInput` (`@mantine/core`), folding each field's paired `Label` (`@/components/ui/label`) into the `TextInput` `label` prop and removing the now-redundant `<div className="flex flex-col gap-1.5">` field wrapper. Remove the `@/components/ui/input` import. **Keep** the `@/components/ui/label` import — five `Label`s belong to still-legacy controls (`PasswordInput` ×2, `Combobox`/`LocationCombobox` ×2, the logo-upload row ×1) and are out of scope for this slice. Every input keeps its exact `value`, `onChange` (including the cross-view `onSharedChange` calls), `type`, `required`, `autoComplete`, `placeholder`, `maxLength`, `autoFocus`, `onKeyDown`, and explicit `id`.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Tasks 633 + 634 are committed; 634's Button diff is committed, so `AuthSheet.tsx` at `HEAD` already has Mantine `Button` and `MantineDrawer`). Line numbers below are the current `HEAD` positions.

### The five in-scope `Input` fields and their `Label` pairing

| ID | Input line | View / region | Current `Input` props | Paired `Label` | `label` source | Notes |
|---|---|---|---|---|---|---|
| F1 | 116 | `LoginView` email | `id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"` | L115 `htmlFor="login-email"` | `t('email')` | wrapper `<div className="flex flex-col gap-1.5">` (L114) removed |
| F2 | 249 | `ForgotPasswordView` email | `id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus` | L248 `htmlFor="forgot-email"` | `t('email')` | keep `autoFocus`; wrapper (L247) removed |
| F3 | 439 | `CompanyField` new-name | `value={newName} onChange={e => setNewName(e.target.value)} placeholder={label} className="h-9 rounded-xl text-sm" maxLength={120} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}` | — (none) | — (placeholder only) | label-less; keep `placeholder`/`maxLength`/`autoFocus`/`onKeyDown`; theme §6e min-height (44px) replaces `h-9` |
| F4 | 661 | `RegisterView` name | `id="reg-name" value={name} onChange={e => { const v = e.target.value; setName(v); onSharedChange?.({ name: v, email, password, phone }) }} required autoComplete="name"` | L660 `htmlFor="reg-name"` | `t('name')` | **preserve the full `onChange` body verbatim** (cross-view shared-state sync) |
| F5 | 672 | `RegisterView` email | `id="reg-email" type="email" value={email} onChange={e => { const v = e.target.value; setEmail(v); onSharedChange?.({ name, email: v, password, phone }) }} required autoComplete="email"` | L671 `htmlFor="reg-email"` | `t('email')` | **preserve the full `onChange` body verbatim** |

All five field wrappers are `<div className="flex flex-col gap-1.5">…</div>`; the parent `<form>` uses `gap-4`, so removing a field's wrapper leaves it as one direct `<form>` child at the same `gap-4` spacing (no visual spacing regression). `onChange` receives the native change event in both legacy `Input` and Mantine `TextInput`, so `e.target.value` is identical — the handler bodies do not change.

### Labels that STAY legacy (out of scope — do not touch, `Label` import remains)

| Label line | Belongs to | Deferred slice |
|---|---|---|
| L128 `htmlFor="login-password"` | `PasswordInput` (login) | 2c |
| L708 `htmlFor="reg-password"` | `PasswordInput` (register) | 2c |
| L306 `<Label>{label}` | `LocationCombobox` | 2e |
| L419 `<Label>{label}` | `Combobox` (company select) | 2e |
| L451 `<Label className="text-xs text-muted-foreground">{t('company_logo')}` | logo-upload row (custom file control, no `TextInput` pair) | later |

The login-password field wrapper (`<div className="flex flex-col gap-1.5"><div className="flex items-center justify-between"><Label/>…forgot-button…</div><PasswordInput/></div>`) stays entirely legacy this slice.

### Canonical Mantine `TextInput` — verified provenance

- **Source / gate:** `import { TextInput } from '@mantine/core'`; chrome owned by `theme.ts` `TextInput` block (~L321, §6e border/focus/error/placeholder/padding + `minHeight: 2.75rem` 44px touch target). No wrapper component; consumers import `@mantine/core` `TextInput` directly.
- **Precedent to mirror (do not re-derive):** **Task 556** (`PhoneField.tsx`: legacy `Input`/`Label` → Mantine `TextInput`/`InputLabel`, all logic byte-identical) and **Task 566** (`FilterRangeInputs.tsx`: legacy `@/components/ui/input` → Mantine `TextInput`, parent-owned parsing byte-identical, zero consumer edits). Both fold the label into the field via the Mantine `label` prop / theme §6e chrome and keep every handler intact.
- **`label` prop + a11y:** Mantine `TextInput label={…}` renders its own `<label>` wired to the input via a generated-or-passed `id`; passing the explicit `id` (e.g. `id="login-email"`) preserves the existing input `id` (external autofill/e2e references stay stable) and the label→input association. No `htmlFor` prop is needed — Mantine handles it.
- **No per-field error prop needed:** none of the five in-scope inputs render a per-field error/`aria-invalid`; auth errors surface via the top-of-form `Alert` (Slice 2d), unchanged. So no `error` prop is introduced.

### Critical-flow registry (P0 Auth lifecycle) — `docs/critical-flow-registry.md`

The `email`/`name`/`newName` inputs feed the same state consumed by the unchanged `signIn`/`signUpWithCaptcha`/`requestPasswordResetWithCaptcha`/company-create handlers. This slice does not touch those handlers, so the named smokes are an **unchanged-green regression baseline** (same five smokes + `test:header-hydration-id-parity` as Tasks 633/634).

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Slice migration | All five `Input` (F1–F5) are replaced by `@mantine/core` `TextInput`; the `@/components/ui/input` import is removed; no `@/components/ui/input` or `<Input` reference remains in the file | P0 | `git diff`; `grep "components/ui/input\|<Input" AuthSheet.tsx` → no match |
| R2 | Behavior parity | Every field keeps its exact `value`, `onChange` body (incl. F4/F5 `onSharedChange` cross-view sync), `type`, `required`, `autoComplete`, `placeholder`, `maxLength`, `autoFocus`, `onKeyDown`, and explicit `id`; no field state, validation, submit, or handler line changes | P0 | `git diff` shows only field-element + import + wrapper-div lines changed; named auth smokes green |
| R3 | Label absorption / scope boundary | The four paired `Label`s (F1/F2/F4/F5) become the `TextInput` `label` prop and their `flex flex-col gap-1.5` wrappers are removed; F3 stays label-less (placeholder); the five out-of-scope `Label`s (password ×2, Combobox ×2, logo) are untouched and the `@/components/ui/label` import REMAINS | P0 | `git diff`; `grep "components/ui/label" AuthSheet.tsx` → still present; the 5 deferred Labels unchanged |
| R4 | Canonical chrome / a11y | Each `TextInput` consumes the theme §6e chrome (reuse — no local style copy); the label→input association and explicit `id` are preserved | P1 | Rendered: label renders above each input, 44px field height, input focus/typing works; diff shows no local input styling |
| R5 | Critical-flow regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged), proving the field swap did not regress Login/Signup/Recovery | P0 | Named vitest commands exit 0 |
| R6 | No legacy leak / gates | No new legacy `@/components/ui/*` import; the `Label`/`PasswordInput`/`Alert`/`Combobox`/`LocationCombobox` imports remain (deferred slices); `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0; `git diff` import block |

## Assumptions and open questions

- **F3 (company new-name) height:** the legacy `className="h-9 rounded-xl text-sm"` (36px) is dropped; the Mantine `TextInput` takes the theme §6e 44px min-height. This is a design-system-compliant consequence (P0 mobile touch target), the same trade Slice 2a made for the compact buttons — assumed acceptable. If the owner wants the create-row input to stay visually 36px, flag it; otherwise the canonical 44px stands.
- **Label import stays:** this slice intentionally does **not** remove `@/components/ui/label` (five Labels remain on deferred controls). The import is removed only in the slice that migrates the last Label consumer (2c/2e).
- No `theme.ts`, `MantineDrawer.tsx`, other consumer, story, or i18n key is touched; no new i18n key (labels reuse existing `t('email')`/`t('name')`/company `label`).

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 4 editable-controls stay editable, 7 i18n, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/qa-profiles.md` (Q4) and `docs/critical-flow-registry.md` (P0 Auth lifecycle rows through `AuthSheet.tsx`).
- `docs/mantine-responsive-design-system.md` (§6e input chrome authority), `docs/tailadmin-style-reference.md` (input visual reference), `docs/component-rules.md` (i18n, no-duplicate, container/presentational).
- Source: `src/modules/auth/components/AuthSheet.tsx` (target); `src/design-system/mantine/theme.ts` (`TextInput` §6e block); precedents `src/components/shared/PhoneField.tsx` (Task 556), `src/components/shared/FilterRangeInputs.tsx` (Task 566); `package.json` (commands).

## Scope

1. In `AuthSheet.tsx`, remove `import { Input } from '@/components/ui/input'`; ensure `TextInput` is imported from `@mantine/core` (merge into the existing `@mantine/core` import that already brings in `Button`, `Text`).
2. Convert F1, F2, F4, F5: replace the `<div className="flex flex-col gap-1.5"><Label htmlFor=…>{…}</Label><Input …/></div>` block with a single `<TextInput id=… label={…} …/>` carrying every original `Input` prop (verbatim `onChange` body) plus the label text from the removed `Label`.
3. Convert F3: replace the bare `<Input …/>` in the company create-row with `<TextInput …/>` keeping `value`/`onChange`/`placeholder`/`maxLength`/`autoFocus`/`onKeyDown`; drop the legacy `className="h-9 rounded-xl text-sm"` (theme §6e owns chrome).
4. Leave the five out-of-scope `Label`s and the `@/components/ui/label` import in place.
5. Produce the Q4 regression + rendered evidence (verification plan).
6. Write the session log + concise `docs/backlog.md` update; note this is Slice 2b and that Slices 2c (`PasswordInput`), 2d (`Alert`), 2e (`Combobox`/`LocationCombobox`) remain open.

## Out of scope

- Any change to auth submit logic, validation, captcha, phone, company-create handlers, OAuth, error mapping, or success screens.
- `PasswordInput` + its two `Label`s (Slice 2c); `Combobox`/`LocationCombobox` + their two `Label`s (Slice 2e); the logo-upload `Label` and file-upload control; `Alert`/`AlertDescription` (Slice 2d).
- Removing the `@/components/ui/label` import (still has consumers).
- The native `<button>` links (forgot-password, back-to-standard, login) and the `PhoneField` (already Mantine).
- `theme.ts`, `MantineDrawer.tsx`, other consumers, any story, any i18n key.

## Current and required behavior

- **Current:** each in-scope field is a legacy `<div className="flex flex-col gap-1.5"><Label/><Input/></div>` — shadcn label + shadcn input chrome.
- **Required after:** each in-scope field is a single Mantine `<TextInput label=…/>` with theme §6e chrome (44px min-height, canonical border/focus), the label above the input, explicit `id` and label→input association preserved; the company new-name field a label-less `TextInput` with its placeholder; every field's value/onChange/validation/submit behaves exactly as before; password/Combobox/logo labels and all deferred primitives untouched.

## Positive and negative flows

**Positive:** open login/forgot/register → each text field renders label-above-input with Mantine chrome → typing updates the same state (`email`/`name`/`newName`), F4/F5 still sync cross-view via `onSharedChange` → submit succeeds/fails with the same localized results as before → company create-row name input accepts text, Enter still triggers `handleCreate`.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login submit (happy + wrong-creds) | **Yes (regression)** | Registry P0 | Unchanged handler/error | `browser.smoke` green |
| Signup submit (dup-email / weak-pw / captcha-fail) | **Yes (regression)** | Registry P0 | Unchanged typed errors | `signUpWithCaptcha.smoke` green |
| Recovery submit (neutral success / non-enumeration) | **Yes (regression)** | Registry P0 | Unchanged neutral success | `requestPasswordReset.smoke` green |
| Phone entry E.164 (register form) | **Yes (regression)** | Registry P0 | Unchanged emit (PhoneField untouched) | `PhoneField.smoke` green |
| Cross-view shared-state sync (F4/F5 `onSharedChange`) | **Yes** | R2 | name/email typed in register persist across register↔register-agent switch | Rendered: type in register, switch to agent, value persists |
| `autoFocus` (F2 forgot-email, F3 company-name) | **Yes** | R2 | field focused on view/row open | Rendered forgot-password + company create-row |
| Company create-row Enter-to-submit (F3 `onKeyDown`) | **Yes** | R2 | Enter triggers `handleCreate`, no form submit | Rendered/smoke unaffected |
| Label a11y association | **Yes** | R4 | clicking label focuses input; `id` preserved | Rendered / DOM inspection |
| Locale expansion (labels sq/uk/it) | **Yes** | R6 | label text wraps, no clip/overflow at 320, uk@320 | Rendered `uk@320` |
| OAuth actual sign-in | No (manual-only, exempt) | Registry | Unchanged | — |

## Acceptance criteria

- `AC1 [R1]` Given the diff, when inspected, then all five fields render `@mantine/core` `TextInput` and `AuthSheet.tsx` contains no `@/components/ui/input` or `<Input` reference.
- `AC2 [R2]` Given each field, when compared to `HEAD`, then only the field element + its wrapper `<div>`/`<Label>` + the `Input` import changed; every `value`/`onChange` body/`type`/`required`/`autoComplete`/`placeholder`/`maxLength`/`autoFocus`/`onKeyDown`/`id` is preserved, and no state/validation/handler code changed.
- `AC3 [R3]` Given the four paired fields, when rendered, then the label appears above the input via the `TextInput` `label` prop; the five out-of-scope `Label`s and the `@/components/ui/label` import remain present and unchanged.
- `AC4 [R4]` Given each `TextInput`, when rendered at 320/375/390 + desktop, then it shows theme §6e chrome at 44px height, focus/typing works, and clicking the label focuses the input; no local input styling in the diff.
- `AC5 [R5,R6]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new legacy `@/components/ui/*` import exists (Label/PasswordInput/Alert/Combobox imports remain).

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle entry point). The change is structural-presentational, so the auth smokes are an unchanged-green regression baseline; rendered evidence is at Q3 matrix depth for the fields. Record actual output for each:

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
6. **Rendered:** the three text-input-bearing forms (`login`, `forgot-password`, `register`/`register-agent` incl. the expanded company create-row) × `{320,375,390}` + one desktop width × the 4 locales at 320, `uk@320` mandatory. `AuthSheet` has no Storybook story — use the same live-app Playwright capture via `lero:open-auth-sheet` that Tasks 633/634 used. Confirm per field: label above input, 44px chrome, typing updates value, F2/F3 autofocus, F4/F5 cross-view persistence, label-click focuses input, no clip/overflow with long uk/it labels. Capture at minimum `login__uk__mobile-320`, `register__uk__mobile-320` (name+email), and the register-agent company create-row.
7. `git status --short` / `git diff --stat` → only `AuthSheet.tsx` (+ session log + `docs/backlog.md`). Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task635-authsheet-input-label-mantine-textinput.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R6 each with evidence; the F1–F5 before/after mapping; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green); the rendered cells (locations) incl. cross-view persistence + `uk@320`; the canonical decision (reuse `@mantine/core` `TextInput`, theme §6e, no new story); explicit confirmation that no auth logic/field/handler/`id`, `theme.ts`, other consumer, story, or i18n key was touched, that the `@/components/ui/label` import and the five deferred `Label`s remain, and that this is Slice 2b (2c `PasswordInput`, 2d `Alert`, 2e `Combobox`/`LocationCombobox` remain open). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the five in-scope fields with line numbers, exact props and `onChange` bodies, the label-pairing map, the five out-of-scope Labels, the wrapper-removal instruction, the `Input`-import-out / `Label`-import-stays boundary, the canonical `TextInput` precedent, and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are named as an unchanged-green regression baseline. ✅
- Scope protects every auth behavior and names exactly what must not change (handlers, state, `id`s, validation, the deferred primitives and their Labels, the native `<button>` links, PhoneField, theme, stories, i18n keys). ✅
- Current/legacy boundary explicit; canonical UI decision = **reuse** `@mantine/core` `TextInput` (theme §6e gated), no new story, no copied local styles. ✅
- Scope boundary against Slices 2c/2d/2e is field-by-field explicit (which Label pairs with which control). ✅
- Negative flows selected by applicability (auth regressions + cross-view sync + autofocus + Enter-submit + a11y + locale in; OAuth out with reason). ✅
- Sub-slicing recorded; Slices 2c–2e left explicitly open. ✅
