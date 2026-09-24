# Task 642 — Remove the `📷` emoji logo-indicator from the company-select dropdown in `CompanyField` (`AuthSheet.tsx`): drop the `description` from the `options` mapping so the dropdown shows only the company name

- **Task number:** 642
- **Epic:** none (AuthSheet company-field follow-up — final item of the 639–643 cluster).
- **Parent / origin:** During the Task 640 review the owner saw the company dropdown row for a logo'd company show a `📷` emoji (the "has a logo" indicator). Owner directive (2026-07-20): "давай тоді взагалі приберемо і емодзі з дропдауну, залишаємо лише назву компанії." Real logo thumbnails are wanted eventually but are a **separate, larger** task (extending the canonical `MantineCombobox` with an image slot + Storybook proof + consumer regression) — explicitly deferred. This task only removes the emoji.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** trivial presentational change — remove one property from a client-side `options` mapping in `CompanyField` (`AuthSheet.tsx`). No i18n, no server, no state, no behavior change. Touches the Q4 auth-critical overlay, so the named auth smokes are an unchanged-green regression baseline.

## Objective

In `src/modules/auth/components/AuthSheet.tsx` `CompanyField`, remove the `description: c.logo_url ? '📷' : undefined` line from the company `options` mapping so each dropdown/sheet row renders only the company `label` (name) with no `📷` indicator. Nothing else changes.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Tasks 639/640/643 committed; Task 641 index applied). Reference by structure/id (line numbers shift).

### Current `options` mapping — `CompanyField` (`AuthSheet.tsx`)

```ts
const options = companies.map(c => ({
  value: c.id,
  label: c.name,
  description: c.logo_url ? '📷' : undefined,
}))
```

- `options` feeds `<MantineCombobox options={options} … />` (migrated in Task 638). `MantineComboboxOption` = `{ value; label; dropdownLabel?; description?; searchText? }` — `description` is **optional**, rendered as right-aligned secondary row text (`MantineCombobox.tsx` renders `{opt.description && <Text …>{opt.description}</Text>}`). Removing it means rows render with `label` only; no other option consumes `description` here.
- The `📷` was the only use of `description` in this mapping. `c.logo_url` is otherwise still used by the logo-upload sub-flow and is **not** removed from the data — only its emoji projection into the dropdown row is removed.
- No i18n key is involved (`📷` is a literal emoji, not a translated string). No `searchText` was set, so filtering (by `label`) is unchanged.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner directive | The `description: c.logo_url ? '📷' : undefined` property is removed from the `options` mapping; each option is now `{ value: c.id, label: c.name }`; the dropdown/sheet rows show the company name only, no `📷` | P0 | `git diff`; rendered — company dropdown shows names, no emoji | Confirmed |
| R2 | Behavior parity | No change to `companies`/`useCompanies`, `c.logo_url` data, the create/duplicate/Select sub-flow, `companyId`/`onCompanyId`, filtering, or any other field; only the `description` line is deleted | P0 | `git diff` shows exactly the one deleted line; named auth smokes green | Confirmed |
| R3 | Regression | All five named auth smokes + `test:header-hydration-id-parity` stay green (unchanged) | P0 | Named vitest commands exit 0 | Confirmed |
| R4 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green; no i18n key change | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Deletion, not blanking:** remove the `description` line entirely (do not set it to `undefined` explicitly or leave a dangling key). The resulting option object is `{ value: c.id, label: c.name }`.
- **`c.logo_url` stays in the data model** — only its emoji rendering in the dropdown is removed. The logo-upload sub-flow, `company_logo_url`, and future logo-thumbnail work are untouched.
- **Real logo thumbnails are explicitly out of scope** — a future task will extend `MantineCombobox` with an image slot (Storybook proof + regression across `LocationCombobox`/`PhoneField`/etc.). Do not add any image rendering here.
- **No mojibake concern from removing an emoji** — deleting the `📷` literal cannot introduce mojibake; `check:mojibake` should stay green.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 9 validation evidence, 14 file integrity, 15 critical-flow regression).
- `docs/rule-index.md` (current-Mantine auth-overlay UI routing).
- `docs/qa-profiles.md` (Q4 — auth-critical overlay) and `docs/critical-flow-registry.md` (P0 Auth lifecycle — agent Signup).
- Source: `src/modules/auth/components/AuthSheet.tsx` `CompanyField` (target); `src/design-system/mantine/patterns/MantineCombobox.tsx` (`description` is optional — context, not changed).

## Scope

1. In `AuthSheet.tsx` `CompanyField`, delete the `description: c.logo_url ? '📷' : undefined,` line from the `options` mapping.
2. Produce the Q4 regression + rendered evidence (verification plan).
3. Write the session log + a concise `docs/backlog.md` active-state entry; note this closes the AuthSheet company-field follow-up cluster (639–643 + 642). Keep the file ≤80 lines; flag `BACKLOG LIMIT BREACH` if needed.

## Out of scope

- Real logo thumbnails / any image rendering in the dropdown (future `MantineCombobox` extension task).
- Any change to `c.logo_url` data, the logo-upload sub-flow, the create/duplicate/Select logic, `MantineCombobox.tsx`, `LocationCombobox`, other consumers, `theme.ts`, stories, or i18n.

## Current and required behavior

- **Current:** company dropdown/sheet rows show the company name plus a right-aligned `📷` for companies that have a `logo_url`.
- **Required after:** rows show the company name only; no `📷`. Selecting, filtering, creating, duplicate-detection, and every other behavior are unchanged.

## Positive and negative flows

**Positive:** open agent registration → open the company select → each row shows only the company name (no `📷`) → typing filters by name (unchanged) → selecting sets `companyId` (unchanged) → create/duplicate/Select sub-flow unchanged.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Company row with a logo | **Yes** | R1 | shows name only, no `📷` | Rendered: open dropdown, logo'd company row has no emoji |
| Company row without a logo | **Yes** | R1 | shows name only (unchanged from before, which also had no emoji) | Rendered |
| Filter by typing | **Yes (regression)** | R2 | filters by `label` as before | Rendered/behavioral |
| Select a company | **Yes (regression)** | R2 | `onCompanyId` sets the value as before | Rendered/behavioral |
| Create / duplicate / Select-existing sub-flow | **Yes (regression)** | R2 | unchanged (Tasks 639/640) | Named smokes / code inspection |
| Signup + other auth flows | **Yes (regression)** | Registry P0 | unchanged | Named auth smokes green |
| Locale/viewport matrix | No | one-line presentational removal, no string/layout change | targeted rendered proof only |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then the `description` line is removed and each option is `{ value: c.id, label: c.name }`; the rendered company dropdown/sheet shows names only with no `📷`.
- `AC2 [R2]` Given the change, then `companies`/`useCompanies`/`c.logo_url` data, the create/duplicate/Select sub-flow, filtering, and `companyId`/`onCompanyId` are unchanged; the diff is exactly the one deleted line.
- `AC3 [R3,R4]` Given the repo after the change, when the named auth smokes + header-hydration-id-parity + typecheck + check:stories + check:i18n + check:mojibake run, then all exit 0 and no i18n key changed.

## QA profile and verification plan

**Profile: Q4 Release/Critical Flow** (P0 auth-lifecycle overlay), though the change is a one-line presentational removal — the auth smokes are an unchanged-green regression baseline and a light rendered check confirms the emoji is gone. Record actual output for each:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity (no key change).
4. `npm run check:mojibake` → 0 artifacts.
5. **Critical-flow regression (unchanged-green baseline):**
   - `npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts`
   - `npx vitest run src/modules/auth/actions/__tests__/requestPasswordReset.smoke.test.ts`
   - `npx vitest run src/components/shared/__tests__/PhoneField.smoke.test.tsx`
   - `npm run test:header-hydration-id-parity`
6. **Rendered (live app):** open the agent-registration AuthSheet (`lero:open-auth-sheet`, prior precedent), open the company select with at least one logo'd company present, and confirm the row shows the name only with no `📷`; confirm filtering + selecting still work. If the sandbox cannot drive the live app, record it as missing evidence with the exact owner-native command + expected result and request the owner's quick visual confirmation (a company row without the emoji). One width is sufficient (no locale matrix — nothing localized changed).
7. `git status --short` / `git diff --stat` → only `src/modules/auth/components/AuthSheet.tsx`, `docs/backlog.md`, and the new session log. Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

If a required check cannot run in the sandbox, record it as missing evidence with the exact owner-native PowerShell command (`npm.cmd` / `npx.cmd`) + expected result; never substitute a confidence claim.

## Completion report contract

Write `docs/sessions/2026-07-20-task642-companyfield-drop-emoji-indicator.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff (one file, one deleted line); R1–R4 with evidence; typecheck/check:stories/check:i18n/mojibake results; the five regression commands' output; the rendered proof (company row without `📷`); explicit confirmation that `c.logo_url` data, the logo-upload/create/duplicate/Select sub-flow, `MantineCombobox`, and i18n were NOT touched; and a note that this closes the 639–643/642 AuthSheet company-field cluster. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the exact line to delete, the resulting option shape, the `MantineComboboxOption.description`-is-optional context, the out-of-scope siblings (real thumbnails, logo data), and the Q4 regression + light rendered matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the auth smokes are named as an unchanged-green baseline. ✅
- Scope protects `c.logo_url` data and every other behavior; names what must not change. ✅
- No i18n change (the `📷` is a literal emoji, not a key). ✅
- Negative flows selected by applicability (logo/no-logo row / filter / select / sub-flow / signup regression in; locale matrix out). ✅
