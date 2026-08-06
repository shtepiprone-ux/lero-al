# Task 633 — AuthSheet migration Slice 1 (shell-only): replace the legacy shadcn `Sheet` overlay with the canonical `MantineDrawer`, preserving all four auth views, fields, and submit logic byte-for-byte

- **Task number:** 633
- **Epic:** MM — Mantine/TailAdmin Restyle (auth-overlay migration, Slice 1 of a shell-first plan).
- **Parent / origin:** Header legacy-audit (2026-07-20). After Tasks 629–632 the visible header bar is fully Mantine; the last legacy holdout wired into the header tree is `AuthSheet.tsx` (still shadcn `@/components/ui/*`). Owner chose a **shell-first** slicing: this slice migrates ONLY the overlay container (`Sheet…` → `MantineDrawer`). The per-view form primitives (`Input`/`Label`/`Button`/`PasswordInput`/`Alert`) and all submit logic are explicitly deferred to later slices.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine shell migration of a **Q4 critical-flow** overlay. Shell-only: the auth submit paths, fields, validation, captcha, and view internals do NOT change.

## Objective

In `src/modules/auth/components/AuthSheet.tsx`, replace the shadcn overlay shell (`Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` from `@/components/ui/sheet`) with the canonical `MantineDrawer` (`src/design-system/mantine/patterns`, controlled `opened`/`onClose`, `title`, `side`, `size`). Every view (`LoginView`, `ForgotPasswordView`, `RegisterView` for both `register` and `register-agent`) renders inside the new shell **unchanged** — same fields, same state, same `handleSubmit`, same captcha/phone/company logic. No auth behavior changes. The only user-visible change is the intended, design-system-mandated one: on `<640px` the overlay becomes the canonical bottom sheet (was a right drawer), and the close/title chrome comes from Mantine instead of shadcn.

## Verified context

Inspected on 2026-07-20.

- **Current shell** (`AuthSheet.tsx` L778–826): `<Sheet open onOpenChange><SheetContent side="right" className="w-full sm:max-w-sm flex flex-col overflow-y-auto p-0"><SheetHeader className="px-4 pt-5 pb-2 pr-12"><SheetTitle>{titles[view]}</SheetTitle>{view==='register-agent' && <SheetDescription…>{register_as agent}</SheetDescription>}</SheetHeader><div className="flex-1">{view switch → LoginView | ForgotPasswordView | RegisterView×2}</div></SheetContent></Sheet>`.
  - `titles: Record<AuthView,string>` and the `view` state, `initialView` reset effect, and `regShared` cross-view state all live in the `AuthSheet` parent and are **preserved as-is**.
  - The shadcn `SheetContent` provides its own close button (the `pr-12` reserves space for it).
- **Canonical replacement** `MantineDrawer` (`src/design-system/mantine/patterns/MantineDrawer.tsx`): controlled `opened`/`onClose`; `title?: ReactNode` (bottom-bordered header when present); `side?: 'left'|'right'` (default `'right'`, desktop only); `size?: string` (Mantine token, default `'md'`); `footer?` (unused here); provides its own Mantine close button; on `<640px` renders the shared `ResponsiveBottomSheet` (Task 514 single source); manages internal scroll via a flex-column body (scroll region padding = `var(--mantine-spacing-md)`).
- **Precedent consumer** in the same header tree: `MobileNavDrawer.tsx` already uses `<MantineDrawer opened onClose side="right" size="xs">` — mirror this wiring shape.
- **Padding ownership:** `MantineDrawer` insets its scroll region by `--mantine-spacing-md` (~16px). Each view currently owns `px-4 pb-6` (LoginView/ForgotPasswordView/RegisterView forms) or `px-4 pb-6 pt-2` (success states). To avoid a doubled horizontal inset, the view wrappers' horizontal padding is neutralized as part of this shell swap (presentational only — no field/logic change). This is the one edit permitted inside the view functions.
- **Register-agent description:** `MantineDrawer` exposes only `title` (no separate description slot). Preserve the `register-agent` sub-line (`{register_as} {agent}`) by composing the `title` prop as a stacked node (`<Text fw={…}>{titles[view]}</Text>` + a smaller `<Text c="dimmed" size="xs">` shown only for `register-agent`) OR as the first body element; pick one, document it. No new i18n key (`auth.register_as`, `auth.agent` already exist).
- **Critical-flow registry** (`docs/critical-flow-registry.md`, P0 Auth lifecycle) routes **Login, Signup, Recovery request, Phone entry, and OAuth** through `AuthSheet.tsx`, each with a named vitest smoke. Because this slice does not touch those code paths, the smokes are used as an **unchanged-green regression baseline** (they must still pass, proving no logic regression), not as changed-behavior tests.
- **Hydration:** `AuthSheet` is `'use client'`, mounted by `Header.tsx`, `open=false` on first paint (overlay controlled) — `MantineDrawer` documents no first-paint flash for controlled-closed overlays. The header `useId` parity test (`header-hydration-id-parity`) targets the header right-cluster, not AuthSheet, but is re-run as cheap insurance.

## Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | Shell migration | The shadcn `Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription` imports and usage are fully removed from `AuthSheet.tsx` and replaced by `MantineDrawer`; no `@/components/ui/sheet` reference remains in the file | P0 | `git diff`; grep `@/components/ui/sheet` in `AuthSheet.tsx` → no match |
| R2 | Behavior parity | `open`/`onOpenChange` map to `MantineDrawer` `opened`/`onClose`; the drawer opens, closes on backdrop/Esc/close-button, and the `view` switch renders the correct view; `initialView` reset and `regShared` cross-view persistence unchanged | P0 | Rendered open/close of all 4 views; diff shows parent state untouched |
| R3 | Field/logic freeze | No change to any view's fields, state, validation, `handleSubmit`, captcha, phone, company-create, password-hint, OAuth, error mapping, or success screens — only the outer wrapper padding is neutralized for the new shell | P0 | `git diff` shows only shell + wrapper-padding lines changed inside the view functions; named auth vitest smokes stay green |
| R4 | Title/description parity | `titles[view]` renders as the drawer title for all 4 views; the `register-agent` description is preserved (composed into title or body top); no new i18n key | P0 | Rendered title per view incl. register-agent sub-line; `check:i18n` parity unchanged |
| R5 | Intended mobile change | On `<640px` the overlay renders as the canonical bottom sheet (drag handle, ≤90dvh internal scroll); on `≥640px` a right-side drawer (`side="right"`, `size` chosen to match the legacy `sm:max-w-sm` ≈ 384px, i.e. `size="sm"` unless proof shows otherwise) | P1 | Rendered `320/375/390` (sheet) + a desktop width (drawer) for each view |
| R6 | Critical-flow regression | All auth critical-flow smokes named below stay green (unchanged), proving the shell swap did not regress Login/Signup/Recovery/Phone; header `useId` parity test stays green | P0 | Named vitest commands exit 0 |
| R7 | No legacy leak / gates | No new legacy `@/components/ui/*` import is introduced; `check:stories`, `check:i18n`, `check:mojibake`, `typecheck` all green | P0 | Commands exit 0 |

## Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Auth overlay container (right drawer desktop / bottom sheet mobile) | Opened `MantineDrawer.tsx` (controlled `opened/onClose/title/side/size`, ports legacy `sheet.tsx` behavior onto the Task 514 single source) and its precedent consumer `MobileNavDrawer.tsx` (`side="right"`); canonical stories `Drawer.stories.tsx`, `MobileNavDrawer.stories.tsx` | `src/design-system/mantine/patterns/MantineDrawer.tsx` | **reuse** — consume `MantineDrawer` directly, no local overlay markup, no copied styles | Wire `opened/onClose/title/side/size`; no new story (the Drawer chrome is already canonical/gated) |

## Scope

1. In `AuthSheet.tsx`, remove the `@/components/ui/sheet` imports and the `Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription` markup; render the view switch inside `<MantineDrawer opened={open} onClose={() => onOpenChange(false)} title={…} side="right" size="sm">`.
2. Compose the `title` node so `titles[view]` shows for every view and the `register-agent` description is preserved. Import `MantineDrawer` from `@/design-system/mantine/patterns` (and `Text` from `@mantine/core` if used for the title node).
3. Neutralize the doubled horizontal padding: drop the `px-4` (keep vertical `pb-6`/`pt-2` as needed) from the four view wrappers so the Drawer's own inset owns horizontal padding — presentational only.
4. Produce the Q4 regression + rendered evidence (verification plan).
5. Write the session log + concise `docs/backlog.md` update; note this is Slice 1 of the AuthSheet migration and that form-primitive slices remain open.

## Out of scope

- Any change to auth submit logic, validation, captcha, phone, company-create, password-requirements, OAuth, error mapping, or success-screen copy/flow.
- Migrating the per-view form primitives (`Input`/`Label`/`Button`/`PasswordInput`/`Alert`/nested `Combobox`/`LocationCombobox`) — those are later slices.
- `theme.ts`, `MantineDrawer.tsx` itself, other consumers, `MobileNavDrawer.tsx`, any story, any i18n key.
- Extending `MantineAuthFormPattern` (a separate pattern-first path the owner did not choose for this slice).

## Current and required behavior

- **Current:** the auth overlay is a shadcn `Sheet` — a right-side drawer at all widths, shadcn close button, shadcn header/title/description.
- **Required after:** identical views/fields/logic rendered inside `MantineDrawer` — desktop right drawer (`size="sm"`), mobile canonical bottom sheet, Mantine title/close chrome; `register-agent` description preserved; every auth flow behaves exactly as before.

## Positive and negative flows

**Positive:** open the header login/register trigger → drawer opens with the correct `initialView` → switch views (login↔register↔register-agent↔forgot) → fields, captcha, phone, company-create, password-hint all work as before → submit succeeds/fails with the same localized results → close via backdrop/Esc/X or on success.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Login wrong-creds | **Yes (regression)** | Registry P0 | Localized error, no session — unchanged | `browser.smoke` green |
| Signup dup-email / weak-pw / captcha-fail | **Yes (regression)** | Registry P0 | Typed errors — unchanged | `signUpWithCaptcha.smoke` green |
| Recovery neutral success / non-enumeration | **Yes (regression)** | Registry P0 | Neutral success — unchanged | `requestPasswordReset.smoke` green |
| Phone entry E.164 | **Yes (regression)** | Registry P0 | Unchanged emit | `PhoneField.smoke` green |
| Header hydration `useId` parity | **Yes** | Registry P0 (599/601) | No hydration mismatch | `test:header-hydration-id-parity` green |
| Locale expansion (title/description sq/uk/it) | **Yes** | R4 | No clip/overflow at 320, uk@320 | Rendered `uk@320` all views |
| Mobile bottom-sheet form (intended change) | **Yes** | R5 | Bottom sheet, drag handle, internal scroll, tall register form scrolls | Rendered 320/375/390 |
| OAuth / magic-link | No (manual-only, exempt) | Registry | Unchanged code path, manual-only | — |

## Acceptance criteria

- `AC1 [R1]` Given the diff, when inspected, then `AuthSheet.tsx` imports and renders `MantineDrawer` and contains no `@/components/ui/sheet` reference.
- `AC2 [R2,R3]` Given each of the 4 views, when opened, then it renders inside `MantineDrawer` with its fields/logic unchanged; the diff inside the view functions is limited to wrapper padding.
- `AC3 [R4]` Given each view (incl. register-agent), when opened, then the drawer title shows `titles[view]` and the register-agent sub-description is present; `check:i18n` parity unchanged (no new key).
- `AC4 [R5]` Given `<640px`, when opened, then the overlay is the bottom sheet; given `≥640px`, a right drawer ~384px wide; all 4 views render without clip/overflow at 320/375/390 incl. uk@320.
- `AC5 [R6,R7]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no new legacy `@/components/ui/*` import exists.

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (the file is a P0 auth-lifecycle entry point). The changed behavior is shell-only, so the auth smokes serve as an unchanged-green regression baseline; rendered evidence is at Q3 matrix depth for the overlay. Record actual output for each:

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
6. **Rendered:** all 4 views (`login`, `forgot-password`, `register`, `register-agent`) × `{320,375,390}` (bottom sheet) + one desktop width (right drawer) × the 4 locales at 320, `uk@320` mandatory. Confirm: correct title/description, fields present and unchanged, no clip/overflow, mobile bottom-sheet vs desktop drawer forms both correct, tall register-agent form scrolls internally. Capture the register-agent `uk@320` sheet + a desktop drawer cell at minimum.
7. `git status --short` / `git diff --stat` → only `AuthSheet.tsx` (+ session log + `docs/backlog.md`). Classify any harness side-effect (e.g. the auto-regenerated `docs/governance-reports/2026-06-19-task467-*.md`) as `EXCLUDED AS UNRELATED`; do not fold in.

If a required check cannot run in the sandbox (native binary / browser build / timeout), record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim. Q4 cannot be approved without the named regression evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task633-authsheet-shell-mantinedrawer.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R7 each with evidence; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' actual output (all green); the rendered cells (locations) incl. register-agent `uk@320` + a desktop drawer cell; the canonical decision (reuse `MantineDrawer`); explicit confirmation that no auth logic/field, `theme.ts`, other consumer, story, or i18n key was touched, and that this is Slice 1 (form-primitive slices remain open). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 14 file integrity, 15 planted-violation for critical flows).
- `docs/rule-index.md` (current-Mantine UI routing).
- `docs/qa-profiles.md` (Q4) and `docs/critical-flow-registry.md` (P0 Auth lifecycle rows through `AuthSheet.tsx`).
- `docs/mantine-responsive-design-system.md` (overlay/responsive authority), `docs/tailadmin-style-reference.md` (chrome) as needed.
- `docs/component-rules.md` (i18n, no-duplicate, container/presentational).
- Source: `src/modules/auth/components/AuthSheet.tsx` (target), `src/design-system/mantine/patterns/MantineDrawer.tsx` (shell), `src/components/layout/MobileNavDrawer.tsx` (precedent), `src/design-system/mantine/patterns/index.ts` (barrel), `package.json` (commands).

## Task quality gate

- A fresh Sonnet session can execute this without chat context: exact current shell markup + the 4 views, the canonical replacement + its API + a precedent consumer, the padding-ownership and register-agent-description handling, the field/logic freeze, and the Q4 regression + rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the critical-flow smokes are named as an unchanged-green regression baseline. ✅
- Scope protects every auth behavior and names what must not change (submit logic, fields, captcha, phone, company-create, OAuth, theme, other consumers, stories, i18n keys). ✅
- Current/legacy boundary explicit (current Mantine shell); Q4 profile + critical-flow evidence + intended mobile change stated. ✅
- Negative flows selected by applicability (auth regressions + hydration + locale + mobile sheet in; OAuth/magic-link out with reason). ✅
- Shell-first slicing recorded; downstream form-primitive slices left explicitly open. ✅
