# Task 637 — AuthSheet migration Slice 2d (`Alert`): replace the four legacy shadcn `Alert`/`AlertDescription` notices with the canonical Mantine `Alert`, preserving every conditional trigger and localized message byte-for-byte

- **Task number:** 637
- **Epic:** MM — Mantine/TailAdmin Restyle (auth-overlay migration, Slice 2d of the shell-first plan).
- **Parent / origin:** Continues the AuthSheet migration. 633 = Slice 1 (shell), 634 = Slice 2a (Button), 635 = Slice 2b (Input/Label → TextInput), 636 = Slice 2c (PasswordInput). Owner directive 2026-07-20: proceed to the next slice. This slice migrates the inline `Alert` notices. `Combobox`/`LocationCombobox` (Slice 2e — the final AuthSheet slice, which also removes the last `@/components/ui/*` primitives) remains deferred.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine primitive migration of a **Q4 critical-flow** overlay. Presentational-only: the four `Alert`s are conditional error/notice displays fed by unchanged state (`sessionLost`, `errorKey`, `captchaFailed`). No auth logic, error mapping, or conditional-render trigger changes — only the `Alert` component identity and the intended §6l chrome.

## Objective

In `src/modules/auth/components/AuthSheet.tsx`, replace the four legacy shadcn `Alert` (`@/components/ui/alert`) usages — each wrapping an `AlertDescription` — with the canonical Mantine `Alert` (`@mantine/core`), mapping `variant="destructive"` → `color="red"` and the default info banner → `color="blueLight"` per the theme's §6l semantic mapping. Remove the `@/components/ui/alert` import (both `Alert` and `AlertDescription`); the Mantine `Alert` body is its children, so `<AlertDescription>{msg}</AlertDescription>` collapses to `{msg}`. Every alert keeps its exact conditional trigger and localized message.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Tasks 633–636 landed; 636 committed or pending-commit — this slice stacks on the current `AuthSheet.tsx`). Reference alerts by trigger/message (line numbers shift as slices land).

### The four in-scope `Alert` usages

| ID | View | Current | Trigger | Message | Maps to |
|---|---|---|---|---|---|
| A1 | `LoginView` session-lost banner | `<Alert><AlertDescription>{t('session_recovery_message')}</AlertDescription></Alert>` (default variant) | `{sessionLost && (…)}` | `auth.session_recovery_message` | `<Alert color="blueLight">{t('session_recovery_message')}</Alert>` (info — see decision below) |
| A2 | `LoginView` error | `<Alert variant="destructive"><AlertDescription>{t(errorKey…)}</AlertDescription></Alert>` | `{errorKey && (…)}` | localized `errorKey` | `<Alert color="red">{t(errorKey…)}</Alert>` |
| A3 | `ForgotPasswordView` captcha error | `<Alert variant="destructive"><AlertDescription>{t('captcha_error_failed')}</AlertDescription></Alert>` | `{captchaFailed && (…)}` | `auth.captcha_error_failed` | `<Alert color="red">{t('captcha_error_failed')}</Alert>` |
| A4 | `RegisterView` error | `<Alert variant="destructive"><AlertDescription>{t(errorKey…)}</AlertDescription></Alert>` | `{errorKey && (…)}` | localized `errorKey` | `<Alert color="red">{t(errorKey…)}</Alert>` |

None of the four carries a `title`, `icon`, or action — they are description-only notices. So the Mantine mapping is `<Alert color={…}>{message}</Alert>` with no `title`/`icon` prop (Mantine renders the children in the `.mantine-Alert-message` slot).

### Canonical Mantine `Alert` — verified provenance

- **Source / gate:** `import { Alert } from '@mantine/core'`; chrome fully owned by `theme.ts` `Alert` block (~L856, §6l "Alerts", Task 532): `defaultProps { radius:'xl', variant:'light' }`; a `styles` callback keyed on `props.color` (default `'brand'`) sets `root` border = `--mantine-color-${color}-5` (semantic-500), bg = `${color}-0` (semantic-50), radius 12px, padding 16px; `label` (title slot) 14/600/gray-8; `message` (body) 14/gray-5/lh-20; `icon` = semantic-500. **Documented §6l variant mapping:** success→`green`, warning→`yellow`, error→`red`, info→`blueLight`.
- **Canonical story:** `src/stories/mantine/primitives/Alert.stories.tsx` (gated). **First app consumer:** no other `src/**` file consumes `@mantine/core` `Alert` yet — AuthSheet is the first, but the chrome is already canonical/gated via the theme block + story, so this is a **reuse** (no new story, no local styles).
- **Body-text color note (intended §6l consequence):** the legacy destructive alert rendered its description in red (`text-destructive`); the canonical §6l Mantine Alert renders the message in **gray-5** on the red-tinted bg (only border/bg/icon are semantic-red). This is the design-system-correct treatment — verify rendered legibility.

### Legacy `Alert` component (`src/components/ui/alert.tsx`)

`cva` with `variant: default (bg-card/text-card-foreground) | destructive (text-destructive)`, a grid layout, and an `AlertDescription` slot. All four AuthSheet usages are `<Alert variant?><AlertDescription>{localized}</AlertDescription></Alert>` — no icon, no title, no action.

### Critical-flow registry (P0 Auth lifecycle)

These alerts DISPLAY the results of Login/Signup/Recovery (error messages, session-recovery notice). The handlers and error mapping are untouched, so the named smokes are an **unchanged-green regression baseline** (same five smokes + `test:header-hydration-id-parity` as Tasks 633–636). The smokes assert the action results (which set `errorKey`), not the Alert rendering; rendered proof covers the visible alert chrome.

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Slice migration | All four `Alert` usages are `@mantine/core` `Alert`; the `@/components/ui/alert` import (`Alert` + `AlertDescription`) is removed; no `@/components/ui/alert` or `AlertDescription` reference remains | P0 | `git diff`; `grep "components/ui/alert\|AlertDescription" AuthSheet.tsx` → no match |
| R2 | Trigger/message parity | Each alert keeps its exact conditional trigger (`sessionLost`/`errorKey`/`captchaFailed`) and localized message (`t(...)`); no state, error-mapping, or conditional-render logic changes | P0 | `git diff` shows only the four Alert elements + import changed; named auth smokes green |
| R3 | Variant→color mapping | The three `variant="destructive"` alerts map to `color="red"`; the default session-lost banner maps to `color="blueLight"` (info); no off-scale/invented color | P0 | `git diff`; rendered proof shows red error chrome + blueLight info chrome |
| R4 | Canonical chrome | Each `Alert` consumes the theme §6l chrome (reuse — no local style copy); the message renders in the Mantine `message` slot (children), no `AlertDescription` wrapper | P1 | Rendered: §6l 12px-radius/1px-border/tinted-bg chrome; diff shows no local Alert styling |
| R5 | Critical-flow regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged) | P0 | Named vitest commands exit 0 |
| R6 | No legacy leak / gates | No new legacy `@/components/ui/*` import; `Label`/`Combobox`/`LocationCombobox`/`PasswordRequirementsHint` imports remain (Slice 2e / retained); `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0; `git diff` import block |

## Assumptions and open questions

- **Session-lost banner color (A1):** the legacy default was visually neutral (`bg-card`); the §6l canonical Alert has no neutral variant, and the documented info mapping is `blueLight`. This kickoff specifies `color="blueLight"` (a session-recovery notice is informational). This is a small intended visual change (neutral → light-blue info tint). If the owner prefers a neutral look, `color="gray"` is the fallback — flag it; otherwise `blueLight` stands. Verify rendered.
- **Destructive body-text color:** red → §6l gray-5 on red-tint bg (see provenance note) — intended, verify legibility.
- No `theme.ts`, `MantineDrawer.tsx`, other consumer, story, or i18n key is touched; no new i18n key.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 7 i18n, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/qa-profiles.md` (Q4) and `docs/critical-flow-registry.md` (P0 Auth lifecycle).
- `docs/mantine-responsive-design-system.md` (§6l Alerts chrome / §4 semantic-color mapping), `docs/tailadmin-style-reference.md`, `docs/component-rules.md` (i18n, no-duplicate).
- Source: `src/modules/auth/components/AuthSheet.tsx` (target); `src/components/ui/alert.tsx` (legacy, variant semantics); `src/design-system/mantine/theme.ts` (`Alert` §6l block); `src/stories/mantine/primitives/Alert.stories.tsx` (canonical story); `package.json`.

## Scope

1. In `AuthSheet.tsx`, remove `import { Alert, AlertDescription } from '@/components/ui/alert'`; add `Alert` to the `@mantine/core` import (already has `Button`, `PasswordInput`, `Text`, `TextInput`).
2. Convert A1–A4: replace `<Alert variant?><AlertDescription>{msg}</AlertDescription></Alert>` with `<Alert color={…}>{msg}</Alert>` (destructive→`red`, default→`blueLight`), preserving the surrounding conditional (`{sessionLost && …}` / `{errorKey && …}` / `{captchaFailed && …}`).
3. Produce the Q4 regression + rendered evidence (verification plan).
4. Write the session log + concise `docs/backlog.md` update; note this is Slice 2d and that Slice 2e (`Combobox`/`LocationCombobox`, the final AuthSheet slice) remains open. If the backlog would exceed 80 lines, flag `BACKLOG LIMIT BREACH` for Opus (predecessor slices 633–635 were archived 2026-07-20; keep the entry to one line).

## Out of scope

- Any change to auth submit logic, validation, captcha, error mapping, conditional-render triggers, or success screens.
- `Combobox`/`LocationCombobox` + their two `Label`s (Slice 2e); the login-password `Label` + logo `Label`; `PasswordRequirementsHint`.
- Removing the `@/components/ui/label` import (still has consumers — Slice 2e territory).
- `theme.ts`, `MantineDrawer.tsx`, stories, i18n keys, adding an alert `title`/`icon` (the notices are description-only).

## Current and required behavior

- **Current:** four inline shadcn `Alert`s (1 default session-lost notice, 3 destructive error notices), each wrapping an `AlertDescription` with a localized message.
- **Required after:** four Mantine `Alert`s with theme §6l chrome (12px radius, 1px semantic border, semantic-50 tint) — errors `color="red"`, session-lost `color="blueLight"`; the localized message renders as the Alert body; every conditional trigger and message identical to before; every auth flow behaves exactly as before.

## Positive and negative flows

**Positive:** trigger each notice via its existing condition — a lost session shows the blueLight recovery banner; a failed login/register shows the red error alert with the localized `errorKey` message; a forgot-password captcha failure shows the red captcha error — each rendered with §6l chrome, same text, same placement.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login wrong-creds → error alert (A2) | **Yes (regression)** | Registry P0 | `errorKey` set (unchanged) → red alert shows localized message | `browser.smoke` green + rendered A2 |
| Signup error → error alert (A4) | **Yes (regression)** | Registry P0 | `errorKey` set (unchanged) → red alert | `signUpWithCaptcha.smoke` green + rendered A4 |
| Recovery captcha fail → captcha alert (A3) | **Yes (regression)** | Registry P0 | `captchaFailed` (unchanged) → red alert | `requestPasswordReset.smoke` green + rendered A3 |
| Session-lost banner (A1) | **Yes** | R3 | blueLight info alert with recovery message | Rendered A1 (trigger `sessionLost`) |
| Destructive body legibility (§6l) | **Yes** | R4 | gray-5 message on red-tint bg legible | Rendered A2/A4 |
| Locale expansion (messages sq/uk/it) | **Yes** | R6 | message wraps, no clip/overflow at 320, uk@320 | Rendered `uk@320` |
| Phone entry / OAuth | No (untouched / manual-only) | Registry | Unchanged | — |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then all four alerts render `@mantine/core` `Alert` and `AuthSheet.tsx` has no `@/components/ui/alert` or `AlertDescription` reference.
- `AC2 [R2]` Given each alert, when compared to `HEAD`, then its conditional trigger and localized message are unchanged and no state/error-mapping logic changed.
- `AC3 [R3]` Given a login/register/captcha error, when rendered, then the alert shows §6l red chrome; given `sessionLost`, then the banner shows §6l blueLight chrome.
- `AC4 [R4]` Given each alert, when rendered at 320/375/390 + desktop, then it shows §6l chrome (12px radius, 1px semantic border, tinted bg) with the message legible; no local Alert styling in the diff.
- `AC5 [R5,R6]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new legacy `@/components/ui/*` import exists (Label/Combobox/PasswordRequirementsHint imports remain).

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle entry point). Presentational-only; the auth smokes are an unchanged-green regression baseline; rendered evidence at Q3 depth for the alerts. Record actual output for each:

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
6. **Rendered:** the error/notice states — `login` (force an `errorKey` → A2, and `sessionLost` → A1), `forgot-password` (captcha fail → A3), `register` (force `errorKey` → A4) × `{320,375,390}` + one desktop width × the 4 locales at 320, `uk@320` mandatory. `AuthSheet` has no Storybook story — use the live-app Playwright capture via `lero:open-auth-sheet` (Tasks 633–636 precedent); force each alert's condition (e.g. submit invalid creds / dispatch with the session-lost flag). Confirm: §6l red chrome on A2/A3/A4, blueLight chrome on A1, localized message legible, no clip/overflow at uk@320. Capture at minimum a red error alert and the blueLight session-lost banner at `uk@320`.
7. `git status --short` / `git diff --stat` → only `AuthSheet.tsx` (+ session log + `docs/backlog.md`). Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task637-authsheet-alert-mantine-migration.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R6 each with evidence; the A1–A4 before/after mapping (variant→color); typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green); the rendered cells (locations) incl. a red error alert + the blueLight session-lost banner + `uk@320`; the canonical decision (reuse `@mantine/core` `Alert`, theme §6l, first consumer, no new story); explicit confirmation that no auth logic/trigger/error-mapping, `theme.ts`, other consumer, story, or i18n key was touched, that the `@/components/ui/label`/`Combobox`/`LocationCombobox`/`PasswordRequirementsHint` imports remain, and that this is Slice 2d (Slice 2e `Combobox`/`LocationCombobox` remains open). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the four alerts by trigger/message, the variant→color mapping, the `AlertDescription`→children collapse, the import boundary, the canonical §6l precedent + story, and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are named as an unchanged-green regression baseline. ✅
- Scope protects every auth behavior and names what must not change (triggers, error mapping, deferred `Combobox`/Labels, theme, stories, i18n keys). ✅
- Current/legacy boundary explicit; canonical UI decision = **reuse** `@mantine/core` `Alert` (theme §6l gated + canonical story, first consumer), no new story, no local styles, provenanced variant→color mapping. ✅
- The two small intended §6l visual consequences (info-banner color, destructive body-text color) are surfaced with an owner fallback, not guessed silently. ✅
- Negative flows selected by applicability (error/notice renders per trigger + legibility + locale in; phone/OAuth out). ✅
- Sub-slicing recorded; Slice 2e (the final AuthSheet slice) left explicitly open. ✅
