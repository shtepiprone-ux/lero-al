# Task 634 — AuthSheet migration Slice 2a (Button-only): replace all legacy shadcn `Button` in `AuthSheet.tsx` with the canonical Mantine `Button`, preserving every auth field, state, and submit path byte-for-byte

- **Task number:** 634
- **Epic:** MM — Mantine/TailAdmin Restyle (auth-overlay migration, Slice 2a of the shell-first plan).
- **Parent / origin:** Task 633 (AuthSheet Slice 1) migrated the overlay **shell** (`Sheet` → `MantineDrawer`) and explicitly deferred the per-view **form primitives** (`Button`/`Input`/`Label`/`PasswordInput`/`Alert`/nested `Combobox`/`LocationCombobox`) to later slices. This task is the first form-primitive slice. Owner directive 2026-07-20: continue the AuthSheet migration. Architect decision (see §Assumptions): the deferred primitives are sub-sliced by risk; **`Button` is Slice 2a** because it is the most self-contained (presentational, no field state), the best-precedented (Tasks 556/566/567/568/571/621/630 all did exactly this legacy-`Button` → Mantine-`Button` swap), and has zero open canonical decisions.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine primitive migration of a **Q4 critical-flow** overlay. Presentational-only: the auth submit paths, fields, validation, captcha, phone, company-create, OAuth, and error/success internals do **not** change. Only the `Button` component identity (and its prop surface) changes.

## Objective

In `src/modules/auth/components/AuthSheet.tsx`, replace every usage of the legacy shadcn `Button` (`@/components/ui/button`) — 11 instances across `LoginView`, `ForgotPasswordView`, `RegisterView` (both `register` and `register-agent`), and the nested `CompanyField` — with the canonical Mantine `Button` (`@mantine/core`), using the project's established variant/size mapping. Remove the `@/components/ui/button` import from the file. Every button keeps its exact `onClick`/`type`/`disabled` wiring, its label/icon children, and its position in the JSX; the only user-visible change is the intended design-system one (Mantine Button chrome instead of shadcn Button chrome, already gated by `theme.ts`). No auth behavior changes.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 633's Slice-1 diff is unstaged in the working tree; this task stacks on top of it — the `MantineDrawer` shell and neutralized wrapper padding from 633 are the current in-file state and must be preserved).

### Current legacy `Button` import and the 11 usages

`AuthSheet.tsx:16` — `import { Button } from '@/components/ui/button'`. Every usage below is a legacy shadcn `Button`:

| # | Line | View / region | Current props | Children | `onClick`/`type` | `disabled` |
|---|---|---|---|---|---|---|
| B1 | 147 | LoginView submit | `size="xl" className="w-full"` (default variant) | `{loading ? <Loader2 spin/> : t('login')}` | `type="submit"` | `loading` |
| B2 | 160 | LoginView Google OAuth | `variant="outline" size="xl" className="w-full"` | inline Google `<svg>` (`mr-2 h-4 w-4`) + `Google` | `type="button"` `onClick={handleGoogle}` | — |
| B3 | 269 | ForgotPasswordView submit | `size="xl" className="w-full"` (default) | `{loading ? <Loader2 spin/> : t('send_reset_link')}` (verify exact label in situ) | `type="submit"` | `loading \|\| !captchaToken` |
| B4 | 423 | CompanyField "+ add new" | `variant="link" className="text-xs h-auto p-0 justify-start"` | `+ {addNewLabel}` | `type="button"` `onClick={() => setShowAdd(true)}` | — |
| B5 | 459 | CompanyField logo choose-file | `variant="outline" size="default" className="text-xs rounded-lg"` | `{logoFile ? tc('replace') : tc('choose_file')}` | `type="button"` `onClick={() => logoInputRef.current?.click()}` | — |
| B6 | 469 | CompanyField logo remove | `variant="ghost" size="default" className="text-xs rounded-lg text-muted-foreground"` | `×` | `type="button"` `onClick={…clear logo…}` | — |
| B7 | 503 | CompanyField create-add | `size="sm" className="gap-1.5"` (default) | `{creating && <Loader2 spin/>}{tc('add')}` | `type="button"` `onClick={handleCreate}` | `!newName.trim() \|\| creating` |
| B8 | 513 | CompanyField create-cancel | `variant="ghost" size="sm"` | `{tc('cancel')}` | `type="button"` `onClick={handleCancel}` | — |
| B9 | 631 | RegisterView success close | `size="xl" className="w-full mt-2"` (default) | success CTA label (verify in situ) | `onClick={onClose}` | — |
| B10 | 726 | RegisterView submit | `size="xl" className="w-full"` (default) | `{loading ? <Loader2 spin/> : t('register')}` | `type="submit"` | `loading \|\| !allPasswordMet \|\| !captchaToken` |
| B11 | 743 | RegisterView agent-register | `variant="outline" size="xl" className="w-full"` | `{t('register_agent')}` | `type="button"` `onClick={onAgentRegister}` | — |

**Not in scope / not a legacy `Button`:** the raw `<button className="text-primary underline …" onClick={onLogin}>` at `AuthSheet.tsx:732` is a native HTML `<button>`, **not** a `@/components/ui/button` import. It is a text link, not a design-system Button. Leave it untouched (it is neither an `@/components/ui/*` primitive nor named in this slice). Migrating inline text links is out of scope for every form-primitive slice.

### Canonical Mantine `Button` — verified provenance

- **Source / gate:** consumers import `{ Button } from '@mantine/core'` directly; there is no wrapper component. The canonical chrome is owned by `theme.ts` (`Button` block, ~L252): `defaultProps: { radius: 'lg', size: 'sm' }` (14px / TailAdmin `text-sm`), with `vars`-level neutral chrome for `variant="outline"`/`"default"` (§6l white / gray-7 text / gray-2 border / gray-0 hover, Tasks 527/589) and `variant="transparent"` §6a-link gray-7 resting text (Task 587). Precedent consumers in the header tree already use it: `HeaderActions.tsx`, `UserMenu.tsx` (`@mantine/core` `Button`).
- **`size="xl"`/`"lg"` are BANNED (Task 520).** `check:stories` Check 14 flags off-scale `size="lg"|"xl"`. The canonical replacement for a legacy full-width `size="xl"` button is **theme default size + `fullWidth`** — this is exactly what Task 567 did ("`size="lg"`/`"xl"` … dropped … in favor of the theme default + `fullWidth`") for the FiltersPanel footer/market-type buttons. There is therefore **no open canonical decision** here.
- **Legacy → Mantine variant map (provenanced):**
  - default (primary submit) → Mantine default `filled` (pass no `variant`).
  - `variant="outline"` → Mantine `variant="default"` (§6l neutral secondary; Task 589 established `default`≡`outline` neutral chrome).
  - `variant="ghost"` → Mantine `variant="subtle"`.
  - `variant="link"` → Mantine `variant="transparent"` (§6a-link, gray-7 resting; Tasks 587/630).
  - `className="w-full"` → `fullWidth` prop (drop the Tailwind class).
  - manual `{loading ? <Loader2 .../> : label}` submit spinner → Mantine built-in **`loading={loading}`** prop + plain label child (removes the manual `Loader2` for B1/B3/B10; the `creating` spinner on B7 → `loading={creating}`). `Loader2` import stays only if still referenced elsewhere; otherwise remove it too (grep before deleting the import).

### Precedent migrations to mirror (do not re-derive)

- **Task 556** (`PhoneField`) and **Task 566/567** (FiltersPanel leaf + shell): legacy `@/components/ui/button`/`input` → Mantine `Button`/`TextInput`, **all logic byte-identical, zero consumer edits**, RTL smoke + planted-violation proof.
- **Task 621** (`AgentCtaButton`) and **Task 630** (`ViewAllLink`): legacy Button → Mantine `Button` with `variant`/`leftSection`/`fullWidth`/`size` mapping and the §6a/§6l chrome; both fixed the `styles.root` inline-flex centering quirk (`component={Link}` / `height:'auto'`), a **known** class of Button-migration defect to watch for on any button whose content must stay vertically centered.

### Critical-flow registry (P0 Auth lifecycle) — `docs/critical-flow-registry.md`

Login, Signup, Recovery request, Phone entry route through `AuthSheet.tsx`; OAuth (Google, B2) and Magic link are **documented manual-only / exempt**. This slice touches the submit **buttons** of Login/Signup/Recovery and the OAuth trigger button, but not their handlers — so the named smokes are an **unchanged-green regression baseline** (they must still pass, proving no logic regression), not changed-behavior tests. Same five smokes + header-hydration parity as Task 633.

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Slice migration | The `@/components/ui/button` import and all 11 legacy `Button` usages are removed from `AuthSheet.tsx` and replaced by `@mantine/core` `Button`; no `@/components/ui/button` reference remains in the file | P0 | `git diff`; `grep "components/ui/button" AuthSheet.tsx` → no match |
| R2 | Behavior parity | Every button keeps its exact `type`, `onClick`, `disabled` semantics, and children (label + icon); no `handleSubmit`, `handleGoogle`, `handleCreate`, `handleCancel`, `onClose`, `onAgentRegister`, `onLogin`, captcha/password/company state, or validation line changes | P0 | `git diff` shows only Button-element + import lines changed; named auth smokes stay green |
| R3 | Variant/size mapping | Each button uses the provenanced mapping: default→`filled`, `outline`→`variant="default"`, `ghost`→`variant="subtle"`, `link`→`variant="transparent"`; `size="xl"`/`"lg"` dropped (theme default) with `fullWidth` replacing `w-full`; no off-scale size remains | P0 | `git diff`; `check:stories` Check 14 exit 0 (no `size="lg"\|"xl"`) |
| R4 | Loading affordance | The three submit buttons (B1/B3/B10) and the company-create button (B7) show their busy state via Mantine `loading`; the visible spinner-on-submit affordance is preserved | P1 | Rendered proof of a submit button in `loading` state; smokes green |
| R5 | Icon/link fidelity | B2's Google `<svg>` renders via `leftSection` (or preserved inline) with the "Google" label; B4's "+ add new" transparent link keeps its left-aligned, compact look; B6's `×` remove control stays a subtle icon-sized control; no button loses vertical centering (Task 621/630 `styles.root` quirk) | P1 | Rendered proof of LoginView (Google), CompanyField add/create rows |
| R6 | Critical-flow regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged), proving the Button swap did not regress Login/Signup/Recovery/Phone | P0 | Named vitest commands exit 0 |
| R7 | No legacy leak / gates | No new legacy `@/components/ui/*` import is introduced; `Input`/`Label`/`PasswordInput`/`Alert`/`Combobox`/`LocationCombobox` imports remain (deferred slices); `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0; `git diff` import block |

## Assumptions and open questions

- **Architect decision — sub-slicing (surfaced for owner override):** the owner's "form primitives" scope (`Input`/`Label`/`Button`/`PasswordInput`/`Alert`/`Combobox`/`LocationCombobox`) is **not** migrated in one task. Doing all five primitives across four auth views in a single Q4 critical-flow change is non-atomic and hard to review safely. This task is **Slice 2a = Button-only**. Planned subsequent slices (each its own kickoff): **2b** `Input`+`Label` → Mantine `TextInput`/`InputLabel` (Task 556/566 precedent; higher risk — merges label+input+error markup); **2c** `PasswordInput`+`PasswordRequirementsHint` (custom state integration); **2d** `Alert`/`AlertDescription` → Mantine `Alert` (error/success display); **2e** `Combobox`/`LocationCombobox` composites. If the owner wants a larger bite, say so and this task will be re-scoped before execution.
- **Loading-prop adoption (B1/B3/B7/B10):** replacing the manual `Loader2` spinner with Mantine's `loading` prop is the canonical, idiomatic mapping and removes a manual icon. Assumed acceptable. If the owner prefers a strict "preserve the `{loading ? <Loader2/> : label}` child verbatim inside the Mantine Button" freeze, note it — the migration works both ways; the kickoff mandates the `loading` prop as the canonical choice with rendered proof.
- **Exact labels for B3 (send-reset) and B9 (success close)** are the existing `t(...)` keys already in the file — preserve verbatim; do not introduce or rename i18n keys.
- No `theme.ts`, `MantineDrawer.tsx`, other consumer, story, or i18n key is touched.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 4 editable-controls, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/qa-profiles.md` (Q4) and `docs/critical-flow-registry.md` (P0 Auth lifecycle rows through `AuthSheet.tsx`).
- `docs/mantine-responsive-design-system.md` (§6a/§6l Button chrome authority), `docs/tailadmin-style-reference.md` (Button visual reference), `docs/component-rules.md` (i18n, no-duplicate, container/presentational).
- Source: `src/modules/auth/components/AuthSheet.tsx` (target); `src/design-system/mantine/theme.ts` (`Button` block, canonical chrome); precedents `src/components/shared/AgentCtaButton.tsx`, `src/components/shared/ViewAllLink.tsx`, `src/components/layout/HeaderActions.tsx`; `package.json` (commands).

## Scope

1. In `AuthSheet.tsx`, remove `import { Button } from '@/components/ui/button'` and add `import { Button } from '@mantine/core'` (merge into the existing `@mantine/core` import line that already brings in `Text`).
2. Convert the 11 `Button` elements (B1–B11) per the mapping table in §Verified context and R3: variant map, drop `size="xl"/"lg"`/`size="default"`/`size="sm"` in favor of the theme default (add `fullWidth` where `w-full` was present), translate remaining layout classes (`mt-2`, left-align for B4, `rounded-lg`) to Mantine props/`styles`/wrapper as needed, and adopt `loading` for B1/B3/B7/B10.
3. For B2, render the Google `<svg>` via `leftSection`; for B4 keep the compact left-aligned transparent link; verify B5/B6/B7/B8 within the company-create row keep their layout and touch targets.
4. Remove the now-unused `Loader2` import **only if** grep confirms no remaining reference in the file.
5. Produce the Q4 regression + rendered evidence (verification plan).
6. Write the session log + concise `docs/backlog.md` update; note this is Slice 2a of the AuthSheet migration and that Slices 2b–2e (Input/Label, PasswordInput/Hint, Alert, Combobox/LocationCombobox) remain open.

## Out of scope

- Any change to auth submit logic, validation, captcha, phone, company-create, password-requirements, OAuth handlers, error mapping, or success-screen copy/flow.
- Migrating `Input`/`Label`/`PasswordInput`/`PasswordRequirementsHint`/`Alert`/`Combobox`/`LocationCombobox` — those are Slices 2b–2e.
- The native `<button>` text link at L732 (`onLogin`) — not a design-system primitive.
- `theme.ts`, `MantineDrawer.tsx`, `ResponsiveBottomSheet`, other consumers, any story, any i18n key.
- Any new i18n key or label rewrite.

## Current and required behavior

- **Current:** the auth overlay renders inside `MantineDrawer` (Task 633) but every button is a legacy shadcn `Button` — shadcn chrome, `size="xl"` off-scale, `w-full`/`variant="outline"|"ghost"|"link"`, manual `Loader2` submit spinner.
- **Required after:** identical views/fields/logic; every button is a canonical Mantine `Button` with theme-owned chrome — `filled` primary submits (`fullWidth`, `loading` on busy), `variant="default"` neutral secondary (Google/agent), `variant="subtle"` ghost (cancel/remove), `variant="transparent"` link ("+ add new"); no off-scale size; every `onClick`/`type`/`disabled`/label/icon preserved; every auth flow behaves exactly as before.

## Positive and negative flows

**Positive:** open the header login/register trigger → drawer opens → in each view the buttons render with Mantine chrome → submit buttons show `loading` while the async action runs and are disabled by their existing gates (captcha/password) → OAuth/agent/cancel/add buttons fire their exact handlers → all auth flows succeed/fail with the same localized results as before.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login submit (happy + wrong-creds) | **Yes (regression)** | Registry P0 | Unchanged handler, localized error, no session | `browser.smoke` green |
| Signup submit (dup-email / weak-pw / captcha-fail) | **Yes (regression)** | Registry P0 | Unchanged typed errors | `signUpWithCaptcha.smoke` green |
| Recovery submit (neutral success / non-enumeration) | **Yes (regression)** | Registry P0 | Unchanged neutral success | `requestPasswordReset.smoke` green |
| Phone entry E.164 (register form) | **Yes (regression)** | Registry P0 | Unchanged emit | `PhoneField.smoke` green |
| Submit-button disabled gates (`!captchaToken`, `!allPasswordMet`) | **Yes** | R2/R4 | Button non-interactive until gates met; `loading` while submitting | Rendered + smokes |
| Company create sub-flow (add/cancel/logo choose/remove) | **Yes** | R2/R5 | Buttons fire `handleCreate`/`handleCancel`/logo handlers unchanged; `loading={creating}` on add | Rendered register-agent company row |
| Button vertical-centering / `leftSection` icon | **Yes** | R5 | No lost centering (Task 621/630 quirk); Google svg + label aligned | Rendered LoginView |
| Header hydration `useId` parity | **Yes** | Registry P0 (599/601) | No hydration mismatch | `test:header-hydration-id-parity` green |
| Locale expansion (button labels sq/uk/it) | **Yes** | R7 | No clip/overflow at 320, uk@320; long labels wrap | Rendered `uk@320` all views |
| OAuth (Google) actual sign-in | No (manual-only, exempt) | Registry | Unchanged handler, manual-only | — |

## Acceptance criteria

- `AC1 [R1]` Given the diff, when inspected, then `AuthSheet.tsx` imports `Button` from `@mantine/core`, contains no `@/components/ui/button` reference, and all 11 buttons are Mantine.
- `AC2 [R2]` Given each button, when compared to `HEAD`, then only the Button element (variant/size/`fullWidth`/`loading`/children-wrapping) and imports changed; every `onClick`/`type`/`disabled` expression and all handler/state/validation code is unchanged.
- `AC3 [R3]` Given the diff, when `check:stories` runs, then Check 14 passes (no `size="lg"|"xl"`) and each button uses the mapped variant.
- `AC4 [R4,R5]` Given a submit in progress, when rendered, then the button shows the Mantine `loading` spinner and is disabled; given LoginView and the company-create row, when rendered, then the Google button shows its icon+label and the add/cancel/remove buttons keep layout and ≥44px mobile touch targets.
- `AC5 [R6,R7]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new legacy `@/components/ui/*` import exists (deferred-primitive imports for Input/Label/PasswordInput/Alert/Combobox remain).

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (the file is a P0 auth-lifecycle entry point). The change is presentational-only, so the auth smokes serve as an unchanged-green regression baseline; rendered evidence is at Q3 matrix depth for the buttons. Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0 (incl. Check 14 off-scale-size gate).
3. `npm run check:i18n` → unchanged parity (no new key).
4. `npm run check:mojibake` → 0 artifacts.
5. **Critical-flow regression (must stay green, unchanged):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts`
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx`
   - `npm run test:header-hydration-id-parity`
6. **Rendered:** all 4 views (`login`, `forgot-password`, `register`, `register-agent`) × `{320,375,390}` (bottom sheet) + one desktop width (right drawer) × the 4 locales at 320, `uk@320` mandatory. Confirm per view: each button renders with the mapped Mantine variant/chrome, `fullWidth` submit buttons span the form, a submit button captured in `loading` state, the Google button icon+label aligned, the register-agent company-create row (add/cancel/logo choose/remove) laid out with ≥44px touch targets, no clip/overflow, long uk/it labels wrap. `AuthSheet` has no Storybook story (unsplit container) — use the same live-app Playwright capture via the app's own `lero:open-auth-sheet` event that Task 633 used (documented Task 621/630 story-less-overlay precedent). Capture at minimum: `login__uk__mobile-320` (Google + submit), `register-agent__uk__mobile-320` (company row + agent button), and a desktop drawer cell showing a `loading` submit.
7. `git status --short` / `git diff --stat` → only `AuthSheet.tsx` (+ session log + `docs/backlog.md`). Classify any harness side-effect as `EXCLUDED AS UNRELATED`; do not fold in.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task634-authsheet-button-mantine-migration.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R7 each with evidence; the B1–B11 before/after mapping actually applied; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green); the rendered cells (locations) incl. a `loading`-state submit + the register-agent company row + `uk@320`; the canonical decision (reuse `@mantine/core` `Button`, theme-owned chrome, no new story); explicit confirmation that no auth logic/field/handler, `theme.ts`, other consumer, story, or i18n key was touched, that the deferred primitives (Input/Label/PasswordInput/Alert/Combobox/LocationCombobox) remain, and that this is Slice 2a (2b–2e remain open). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the exact import line, all 11 button sites with line numbers, current props, children, handlers, and the provenanced variant/size/`fullWidth`/`loading` mapping, plus the field/logic freeze and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are named as an unchanged-green regression baseline. ✅
- Scope protects every auth behavior and names what must not change (handlers, state, captcha, phone, company-create, OAuth, theme, other consumers, stories, i18n keys, the deferred primitives, the native `<button>` link). ✅
- Current/legacy boundary explicit (current Mantine Button, theme-owned chrome); `size="xl"` ban resolved by provenance (Task 520/567), so no open canonical decision. ✅
- Canonical UI decision = **reuse** `@mantine/core` `Button` (theme-gated), no new story, no copied local styles. ✅
- Negative flows selected by applicability (auth regressions + disabled gates + company sub-flow + centering/icon + hydration + locale in; OAuth actual sign-in out with reason). ✅
- Sub-slicing recorded; Slices 2b–2e left explicitly open; owner-override invited. ✅
