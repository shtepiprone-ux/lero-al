# Task 638 — AuthSheet migration Slice 2e (final): replace the legacy `Combobox` (company-select) with the canonical `MantineCombobox`, and the four remaining shadcn `Label`s with Mantine `InputLabel`, clearing every base `@/components/ui/*` primitive from `AuthSheet.tsx`

- **Task number:** 638
- **Epic:** MM — Mantine/TailAdmin Restyle (auth-overlay migration, **Slice 2e — the final slice**).
- **Parent / origin:** Completes the AuthSheet migration. 633 = shell, 634 = Button, 635 = Input/Label→TextInput, 636 = PasswordInput, 637 = Alert. Owner directive 2026-07-20: finish AuthSheet. This slice migrates the last legacy base primitives: the company-select `Combobox` and the four remaining `Label`s.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine primitive migration of a **Q4 critical-flow** overlay. Two concerns: (1) a **composite swap** — legacy `@/components/shared/Combobox` → canonical `MantineCombobox` (the one interaction-bearing change, needs rendered proof); (2) four **mechanical label swaps** — `@/components/ui/label` `Label` → `@mantine/core` `InputLabel`. No field state, `onChange`, `companyId` selection, or validation logic changes.

## Objective

In `src/modules/auth/components/AuthSheet.tsx`: (1) replace the legacy `Combobox` (company-select in `CompanyField`) with the canonical `MantineCombobox` (`@/design-system/mantine/patterns`), preserving the company `options`, `value`/`onChange`, placeholder, and searchable behavior; (2) replace the four remaining shadcn `Label` usages with Mantine `InputLabel` (`@mantine/core`). Remove the `@/components/shared/Combobox` and `@/components/ui/label` imports. After this slice, the **only** remaining `@/components/ui/*` import in `AuthSheet.tsx` is `PasswordRequirementsHint` (a domain display component, explicitly out of scope).

## Verified context

Inspected on 2026-07-20 against `HEAD` (Tasks 633–637 landed). Reference by structure/id (line numbers shift).

### Concern 1 — legacy `Combobox` → `MantineCombobox` (company-select, `CompanyField`)

Current usage:
```
<div className="flex flex-col gap-1.5">
  <Label>{label}</Label>
  <Combobox options={options} value={companyId} onChange={onCompanyId} placeholder={selectPlaceholder} variant="input" portal />
</div>
```
- `options` (built in `CompanyField`): `companies.map(c => ({ value: c.id, label: c.name, description: c.logo_url ? '📷' : undefined }))`.
- Legacy `Combobox` is `@/components/shared/Combobox` (legacy composite: `createPortal` + `@/components/ui/mobile-bottom-sheet`, hand-rolled dropdown).
- **Canonical replacement `MantineCombobox`** (`@/design-system/mantine/patterns/MantineCombobox.tsx`): props `options: MantineComboboxOption[]`, `value`, `onChange`, `placeholder?`, `variant?: 'input' | 'button'` (`'input'` = searchable text-input trigger, typing filters), `error?`, `searchable?`, `clearable?`, `ariaLabel?`, `triggerWidth?`, `inputMode?`. **No `portal` prop** — `MantineCombobox` always portals its dropdown/sheet (desktop dropdown + mobile bottom sheet), so `portal` is dropped.
- **`MantineComboboxOption`** = `{ value: string; label: string; dropdownLabel?; description?; searchText? }` — the company `options` shape (`value`/`label`/`description`) maps **1:1**; the `📷` logo indicator is preserved as the row's right-aligned `description`. No option-shape change needed.
- **Mapping:** `<Combobox … variant="input" portal/>` → `<MantineCombobox options={options} value={companyId} onChange={onCompanyId} placeholder={selectPlaceholder} variant="input"/>` (drop `portal`). `companyId` state and `onCompanyId` handler are unchanged.
- **`MantineCombobox` renders no field label** — the company field's label stays an external element (migrated to `InputLabel`, Concern 2).
- **Precedent consumers** (mirror the wiring): `PropertyTypeCombobox.tsx`, `YearCombobox.tsx`, `PhoneField.tsx` (Task 556), and `LocationCombobox.tsx` itself all consume `MantineCombobox` directly.

### Concern 2 — the four remaining `Label` → Mantine `InputLabel`

`@/components/ui/label` (`Label`) has exactly four consumers left in `AuthSheet.tsx`; all become `@mantine/core` `InputLabel`:

| # | Location | Current | → |
|---|---|---|---|
| L1 | login-password (flex-between row with the forgot-password button) | `<Label htmlFor="login-password">{t('password')}</Label>` | `<InputLabel htmlFor="login-password">{t('password')}</InputLabel>` — keep the surrounding `<div className="flex items-center justify-between">…forgot button…</div>` row intact |
| L2 | `LocationField` (location select) | `<Label>{label}</Label>` | `<InputLabel>{label}</InputLabel>` |
| L3 | `CompanyField` (company select) | `<Label>{label}</Label>` | `<InputLabel>{label}</InputLabel>` |
| L4 | logo-upload row | `<Label className="text-xs text-muted-foreground">{t('company_logo')}</Label>` | `<InputLabel className="text-xs text-muted-foreground">{t('company_logo')}</InputLabel>` — verify the §6e InputLabel default doesn't override the compact `text-xs` intent; if it does, use `<Text component="label" size="xs" c="dimmed">` instead |

**Precedent:** `PhoneField.tsx` (Task 556) imports and uses `InputLabel` from `@mantine/core`. `InputLabel` renders a `<label>` and accepts `htmlFor`/`className`/children.

### Not in scope / already Mantine

- **`LocationCombobox`** (`@/components/shared/LocationCombobox`) is **already Mantine** (built on `MantineCombobox` + `@mantine/core`; its `portal` prop is a documented API-compat no-op). AuthSheet's `LocationCombobox` usage is left as-is — only its external `Label` (L2) is migrated.
- **`PasswordRequirementsHint`** (`@/components/ui/PasswordRequirementsHint` + `allPasswordRulesMet`) — a domain display component (password-rules checklist), not a base primitive. Left as-is; a possible future cleanup, not this slice. It is the sole `@/components/ui/*` import that remains after this task.
- The legacy `Combobox` component file itself (other app consumers keep it) — only AuthSheet's usage is swapped.

### Critical-flow registry (P0 Auth lifecycle)

The company-select feeds `companyId` used in agent registration (Signup). The submit handler, `companyId` state, and `onCompanyId` are untouched, so the named smokes are an **unchanged-green regression baseline** (same five smokes + `test:header-hydration-id-parity` as Tasks 633–637).

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Composite swap | The company-select renders `MantineCombobox` (not legacy `Combobox`); the `@/components/shared/Combobox` import is removed; `options`/`value={companyId}`/`onChange={onCompanyId}`/`placeholder`/`variant="input"` preserved, `portal` dropped; the `📷` logo indicator preserved via `description` | P0 | `git diff`; `grep "shared/Combobox\b" AuthSheet.tsx` → no match; rendered company dropdown |
| R2 | Label swap | All four `Label`s become `@mantine/core` `InputLabel`; the `@/components/ui/label` import is removed; `htmlFor` (L1) and `className` (L4) preserved; the login-password label+forgot-button row intact | P0 | `git diff`; `grep "components/ui/label\|<Label\b" AuthSheet.tsx` → no match |
| R3 | Behavior parity | No change to `companyId`/`onCompanyId`, company-create sub-flow, location selection, password/forgot logic, or any field state/validation; label→control association preserved | P0 | `git diff` shows only the swapped elements + imports; named auth smokes green |
| R4 | Canonical chrome | `MantineCombobox` (theme/§6e) and `InputLabel` (§6e) consumed directly, no copied local styles; searchable company select + mobile bottom-sheet behave per the canonical primitive | P1 | Rendered: company select opens (desktop dropdown + mobile sheet), typing filters, selection sets the field; InputLabels render above their controls |
| R5 | Full primitive clearance | After this slice, `AuthSheet.tsx` has no `@/components/ui/{button,input,label,alert,PasswordInput}` or `@/components/shared/Combobox` import; only `@/components/ui/PasswordRequirementsHint` remains (out of scope) | P0 | `grep "@/components/ui/\|shared/Combobox" AuthSheet.tsx` → only `PasswordRequirementsHint` |
| R6 | Critical-flow regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged) | P0 | Named vitest commands exit 0 |
| R7 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green; no new i18n key | P0 | Commands exit 0 |

## Assumptions and open questions

- **Company option `description` (`📷`):** `MantineComboboxOption` supports `description` (right-aligned row text), so the logo indicator is preserved unchanged. If rendered proof shows it visually off in the Mantine row, keep it as `description` (canonical) — do not invent styling.
- **Logo `InputLabel` compactness (L4):** if Mantine's §6e `InputLabel` default overrides the legacy `text-xs text-muted-foreground` compact look, use `<Text component="label" size="xs" c="dimmed">` instead (both remove the `Label` import) — verify rendered.
- **`MantineCombobox` searchable behavior:** `variant="input"` gives a searchable trigger (typing filters companies) — this matches the legacy `Combobox variant="input"`. Confirm the company list filters and selects identically; no behavior redesign.
- No `theme.ts`, `MantineCombobox.tsx`, `LocationCombobox.tsx`, `PasswordRequirementsHint`, other consumer, story, or i18n key is touched; no new i18n key.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 4 editable-controls, 7 i18n, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/qa-profiles.md` (Q4) and `docs/critical-flow-registry.md` (P0 Auth lifecycle — Signup).
- `docs/mantine-responsive-design-system.md` (§6e input/label + Combobox/overlay chrome), `docs/tailadmin-style-reference.md`, `docs/component-rules.md` (i18n, no-duplicate, container/presentational).
- Source: `src/modules/auth/components/AuthSheet.tsx` (target); `src/design-system/mantine/patterns/MantineCombobox.tsx` (canonical, `MantineComboboxOption` shape); precedents `src/components/shared/PropertyTypeCombobox.tsx`, `src/components/shared/YearCombobox.tsx`, `src/components/shared/PhoneField.tsx` (InputLabel + MantineCombobox); `src/components/shared/LocationCombobox.tsx` (already-Mantine, not migrated); `package.json`.

## Scope

1. In `AuthSheet.tsx`, remove `import { Combobox } from '@/components/shared/Combobox'` and `import { Label } from '@/components/ui/label'`; add `MantineCombobox` to the `@/design-system/mantine/patterns` import (already imports `MantineDrawer`) and `InputLabel` to the `@mantine/core` import (already imports `Alert`, `Button`, `PasswordInput`, `Text`, `TextInput`).
2. Swap the company-select `<Combobox … variant="input" portal/>` → `<MantineCombobox … variant="input"/>` (drop `portal`), preserving `options`/`value`/`onChange`/`placeholder`.
3. Swap the four `<Label…>` → `<InputLabel…>` (L1–L4), preserving `htmlFor`/`className`/children and the login-password row layout.
4. Produce the Q4 regression + rendered evidence (verification plan).
5. Write the session log + concise `docs/backlog.md` update; note this is Slice 2e — **the final AuthSheet slice** — and that AuthSheet is now free of base `@/components/ui/*` primitives (only the domain `PasswordRequirementsHint` remains). Flag `BACKLOG LIMIT BREACH` if the entry would exceed 80 lines (predecessor slices are archived).

## Out of scope

- Any change to `companyId`/`onCompanyId`/company-create handlers, location selection, password/forgot logic, submit, validation, captcha, OAuth, or success screens.
- `LocationCombobox` (already Mantine), `PasswordRequirementsHint` (domain component), the legacy `Combobox` component file (other consumers), `MantineCombobox.tsx` itself.
- The native `<button>` links; `PhoneField` (already Mantine); `theme.ts`, `MantineDrawer.tsx`, stories, i18n keys.

## Current and required behavior

- **Current:** company-select is the legacy `Combobox`; four field labels are shadcn `Label`.
- **Required after:** company-select is `MantineCombobox` (searchable trigger, canonical desktop dropdown + mobile bottom sheet, `📷`-in-`description` preserved); all four labels are Mantine `InputLabel` (§6e chrome); `companyId` selection, company-create sub-flow, location selection, and the login-password label+forgot-button row all behave exactly as before; `AuthSheet.tsx` no longer imports any base `@/components/ui/*` primitive (only `PasswordRequirementsHint`).

## Positive and negative flows

**Positive:** open agent-registration → the company `InputLabel` renders above a `MantineCombobox` → click/type to filter companies (desktop dropdown; mobile bottom sheet) → select a company → `companyId` set via `onCompanyId` (unchanged) → "+ add new" company-create sub-flow still works → location field and login-password label render via `InputLabel` → all auth flows behave as before.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Signup submit (agent, company selected) | **Yes (regression)** | Registry P0 | `companyId` unchanged → signup behaves as before | `signUpWithCaptcha.smoke` green |
| Company select: open/filter/select (desktop + mobile) | **Yes** | R1/R4 | dropdown/sheet opens, typing filters, selection sets field, `📷` shown for logo'd companies | Rendered desktop dropdown + mobile sheet |
| Company "+ add new" sub-flow | **Yes** | R3 | create-row still opens/creates/cancels unchanged | Rendered register-agent company create-row |
| Location select (LocationCombobox, unchanged) | **Yes** | R3 | still selects; only its label swapped to InputLabel | Rendered location field |
| login-password label + forgot-button row | **Yes** | R2 | InputLabel + forgot button on one row, label focuses password input | Rendered login |
| Other auth flows (login/recovery/phone) | **Yes (regression)** | Registry P0 | unchanged | `browser`/`requestPasswordReset`/`PhoneField` smokes green |
| Locale expansion (labels + company placeholder sq/uk/it) | **Yes** | R7 | labels/placeholder wrap, no clip/overflow at 320, uk@320 | Rendered `uk@320` |
| OAuth actual sign-in | No (manual-only) | Registry | unchanged | — |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then the company-select renders `MantineCombobox` (no `portal`), `AuthSheet.tsx` has no `@/components/shared/Combobox` reference, and the company `options` (incl. `description`) are passed unchanged.
- `AC2 [R2]` Given the diff, then all four labels render `@mantine/core` `InputLabel`, there is no `@/components/ui/label` or `<Label` reference, and the login-password label+forgot-button row is preserved.
- `AC3 [R3]` Given each control, when compared to `HEAD`, then `companyId`/`onCompanyId`, company-create, location selection, and password/forgot logic are unchanged.
- `AC4 [R4]` Given the company select at 320/375/390 + desktop, then it opens (mobile bottom sheet / desktop dropdown), typing filters, selection sets the field, `📷` shows for logo'd companies, and each InputLabel renders above its control; no local styling in the diff.
- `AC5 [R5]` Given `AuthSheet.tsx` after the change, then `grep "@/components/ui/\|shared/Combobox"` returns only `@/components/ui/PasswordRequirementsHint`.
- `AC6 [R6,R7]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new i18n key exists.

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle entry point). The composite swap is interaction-bearing (rendered proof required); the auth smokes are an unchanged-green regression baseline. Record actual output for each:

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
6. **Rendered:** `register-agent` (company select + location + labels) and `login` (login-password InputLabel row) × `{320,375,390}` + one desktop width × the 4 locales at 320, `uk@320` mandatory. `AuthSheet` has no Storybook story — use the live-app Playwright capture via `lero:open-auth-sheet` (Tasks 633–637 precedent). **Interaction proof for the company select:** open it at a mobile width (bottom sheet) and desktop (dropdown), type to filter, select a company, confirm `companyId` set and `📷` shown for a logo'd company. Confirm each InputLabel renders above its control, the login-password label+forgot-button row is intact, and no clip/overflow at uk@320. Capture at minimum the open company select (mobile sheet + desktop dropdown) and the register-agent labels at `uk@320`.
7. `git status --short` / `git diff --stat` → only `AuthSheet.tsx` (+ session log + `docs/backlog.md`). Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task638-authsheet-combobox-inputlabel-mantine-migration.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R7 each with evidence; the Combobox→MantineCombobox mapping (incl. `portal` drop + `📷` `description` preservation) and the L1–L4 label mapping; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green); the rendered cells (locations) incl. the open company select (mobile sheet + desktop dropdown) + a filter/select interaction + `uk@320`; the canonical decision (reuse `MantineCombobox` + `InputLabel`, no new story); explicit confirmation that no `companyId`/handler/location/password logic, `theme.ts`, `MantineCombobox`, `LocationCombobox`, `PasswordRequirementsHint`, other consumer, story, or i18n key was touched; and the **primitive-clearance proof** (`grep "@/components/ui/\|shared/Combobox" AuthSheet.tsx` → only `PasswordRequirementsHint`), marking AuthSheet's base-primitive migration complete. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the company-select usage + its `options` shape + the `MantineCombobox` API/mapping (drop `portal`, `description` preserved), the four labels with locations/attributes, the import boundary (remove `Combobox` + `Label`, keep `PasswordRequirementsHint`), the canonical precedents, and the Q4 regression + rendered/interaction matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are named as an unchanged-green regression baseline. ✅
- Scope protects every auth behavior and names what must not change (companyId/handlers, location select, company-create, password/forgot row, LocationCombobox, PasswordRequirementsHint, theme, stories, i18n keys). ✅
- Canonical UI decision = **reuse** `MantineCombobox` + `InputLabel` (both gated/precedented), no new story, no copied local styles; `MantineComboboxOption` shape verified to map 1:1 (incl. `description`). ✅
- The already-Mantine `LocationCombobox` is correctly excluded (only its label migrated); the interaction-bearing composite swap is flagged for rendered proof, distinct from the mechanical label swaps. ✅
- Negative flows selected by applicability (signup regression + company open/filter/select desktop+mobile + create sub-flow + location + login-password row + locale in; OAuth out). ✅
- Final-slice completion criterion (primitive-clearance grep) is an explicit acceptance check. ✅
