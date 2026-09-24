# Task 627 — Triage the pre-existing SB10 ESLint debt (47 problems): authoritative inventory + categorized remediation plan (no source fixes)

- **Task number:** 627
- **Epic:** MM — Mantine/TailAdmin Restyle (`tasks/Epics/Epic_MM_Mantine_UI_Migration.md`)
- **Sprint:** 45 (Mantine-migration governance tail)
- **Parent / origin:** flagged during the Task 625 landing — `npm run lint` reports 47 problems that are all **pre-existing and unrelated** to the 625 diff. This task **scopes and plans** the cleanup. **The actual fixes are a separate follow-up task (628); this task changes no product/story/test source.**

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **Docs / Governance — debt triage & remediation planning.** The deliverable is a documented, categorized inventory and a per-category fix plan, not code changes.
- QA profile: **Q0 Docs/Governance.** Evidence = authoritative regenerated lint output, read-after-write on the inventory doc, reference/contradiction validation. No rendered UI evidence (no UI changes).

## Objective

Produce a single authoritative, categorized inventory of every current `npm run lint` problem, with root cause, correct fix approach, blast radius, and fix ordering per category, so that follow-up Task 628 can execute the cleanup mechanically and safely. Leave the codebase byte-identical (only new/updated docs).

## Verified context

- `npm run lint` maps to `eslint` (verified in `package.json` scripts).
- The Task 625 session log (`docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`, evidence #8) recorded the debt as **47 problems (17 errors, 30 warnings)**, all outside the 625 diff, in these categories:
  1. **`storybook/no-renderer-packages` errors** — ~14 primitive story files importing `@storybook/react` directly: `Alert`, `Avatar`, `Badge`, `Card`, `Notification`, `Pagination`, `Progress`, `RangeDatePicker`, `ScrollArea`, `SegmentedControl`, `Separator`, `Skeleton`, `Slider`, `Tabs` (`*.stories.tsx`). Pre-existing SB10-migration gap (framework import path changed in the Storybook 10 migration).
  2. **Empty-interface error** — one occurrence in `src/components/.../MantineSelect.tsx` (an empty interface / empty object type).
  3. **`@ts-ignore` vs `@ts-expect-error` error + unused-var warnings** — in test files.
  4. **`react/no-unescaped-entities` error** — in `RangeDatePicker.stories.tsx`.
- The exact per-file counts in that session log are a **documented starting point, not authoritative** — lint output may have shifted. The executor MUST regenerate the definitive list first (step 1) and reconcile any delta against the categories above.
- Storybook version is **10.4.2** (seen in the Task 625 `build-storybook` output), so category 1 is a genuine SB10 import-path migration, not a lint misconfiguration.

## Requirements

| ID | Source | Requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | This task | Regenerate the authoritative `npm run lint` output and record the exact total (errors/warnings) and every rule ID + file | P0 | Pasted lint transcript in the inventory doc | Confirmed |
| R2 | This task | Categorize every problem by ESLint rule + root cause; no problem left uncategorized | P0 | Inventory doc table | Confirmed |
| R3 | This task | For each category: correct fix approach, whether it is a blanket codemod or manual, blast radius, and any risk (e.g. behavior change, type-safety) | P0 | Inventory doc | Confirmed |
| R4 | This task | Recommend a fix ordering and a proposed Task-628 scope split (what 628 should and should not touch) | P1 | Inventory doc | Confirmed |
| R5 | Boundary | No product, story, or test source is modified in this task; only new/updated docs (+ backlog) | P0 | `git status` shows only docs | Confirmed |
| R6 | Accuracy | Every file path and rule ID in the inventory is copied from the regenerated lint output, not from the 625 log or memory | P0 | Cross-check vs transcript | Confirmed |

## Assumptions and open questions

- **Assumption (reversible):** the four categories above still cover 100% of the output. If the regenerated run surfaces a new category, add it and flag the delta explicitly in the doc — do not force it into an existing bucket.
- **Open question for the owner (record, do not decide):** category 1's fix — should the SB10 story imports move to the framework package (`@storybook/react-vite` or the project's configured framework) or to a shared story-helper re-export? Present both options with trade-offs in the doc; the owner/Task 628 chooses. Do not implement either here.
- **Assumption:** the `storybook/no-renderer-packages` rule is intentionally enabled (SB10 governance), so the fix is to correct the imports, not to disable the rule. If evidence suggests the rule is misconfigured for this repo, note it as an option but do not change ESLint config in this task.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope-bounded, 14 file integrity).
- `docs/qa-profiles.md` (Q0).
- `docs/storybook-governance.md` (SB10 story conventions / import rules).
- `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md` (evidence #8 — the starting inventory).
- `package.json` (the `lint` script + Storybook/ESLint deps) and `eslint.config.*` (to name the exact rule sources).
- `docs/ai-behavior.md` (session-log + backlog rules).

## Scope

1. Regenerate `npm run lint`, capture the full output verbatim.
2. Create `docs/sb10-lint-debt-inventory.md` (or, if a governance-debt doc already exists, extend it — check first) containing: the verbatim total, a per-problem table (rule ID · file · error/warning · root cause · fix approach · codemod-or-manual · risk), a per-category summary, the recommended fix ordering, and the proposed Task-628 scope split.
3. Add a concise `docs/backlog.md` entry registering the debt + this triage + the planned Task 628 fix.

## Out of scope

- **Any source fix.** Do not edit story imports, `MantineSelect.tsx`, test files, or `RangeDatePicker.stories.tsx`. That is Task 628.
- ESLint / Storybook **config** changes (rule enable/disable, framework config). Options may be documented; nothing is changed.
- `eslint --fix` runs against tracked files. (You may run `eslint --fix-dry-run` or inspect autofixability and record it, but must not write the fixes.)
- Product behavior, UI, i18n, the locale-leak gate (Task 626), and `governance-pr.yml`.

## Current and required behavior

- **Current:** 47 lint problems are known to exist but are undocumented as a unit; each future task re-discovers them and cross-references scope by hand (as Task 625 had to).
- **Required after:** one authoritative, categorized inventory + remediation plan exists and is registered in the backlog, so Task 628 can fix the debt in scoped batches with no re-discovery. Source is unchanged.

## Positive and negative flows

**Positive:** run lint → capture output → categorize every problem → write the inventory doc with fix plan + Task-628 split → register in backlog → `git status` shows only docs.

**Negative-flow applicability table:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Regenerated lint differs from the 625 log | **Yes** | R1/R6 | Use the fresh output as source of truth; flag the delta | Transcript vs doc |
| A new rule category appears | **Yes** | Assumption | Add a category; do not force-fit | Doc |
| Accidental source edit | **Yes** | R5 boundary | `git status` must show only docs; revert any stray change | `git status` |
| Lint cannot run in sandbox (timeout) | **Yes** | Environment | Provide owner-native `npm run lint` handoff + expected format; mark the doc's counts provisional until the owner pastes the run | Handoff |
| UI/rendered behavior | No (docs-only) | — | N/A | N/A |

## Acceptance criteria

- `AC1 [R1,R6]` Given `npm run lint`, when run, then the inventory doc contains the verbatim total (errors/warnings) and every problem's rule ID + file path copied from that run.
- `AC2 [R2,R3]` Given every problem, when categorized, then each has a root cause, a fix approach, a codemod-or-manual tag, and a risk note; zero problems are uncategorized.
- `AC3 [R4]` Given the categories, when planned, then the doc states a fix ordering and an explicit proposed Task-628 scope (what to fix, what to leave, and the category-1 import-target options with trade-offs).
- `AC4 [R5]` Given the final tree, when `git status --short` is inspected, then only `docs/sb10-lint-debt-inventory.md` (new), `docs/backlog.md`, and the session log appear — no source file.

## QA profile and verification plan

**Profile: Q0 Docs/Governance.** Record actual output for each:

1. `npm run lint` (verbatim; *owner-native if it exceeds the sandbox window — provide the command and expected `✖ N problems (E errors, W warnings)` summary line for the owner to paste back*) — AC1.
2. Read-after-write on `docs/sb10-lint-debt-inventory.md`; confirm every rule ID + file matches the transcript — AC1/AC2/R6.
3. Markdown structure/reference check: internal links resolve, no broken references — Q0 evidence.
4. `git status --short` → only the two/three doc paths — AC4.
5. `git diff --stat` on any non-doc path → **empty** (proves R5).

## Completion report contract

Write `docs/sessions/2026-07-19-task627-sb10-lint-debt-triage.md` + a concise `docs/backlog.md` update registering the debt, this triage, and the planned Task 628 fix (keep the file ≤80 lines). Include: the verbatim lint total; a Files Changed table (docs only); R1–R6 each with evidence; the category breakdown; the proposed Task-628 scope; explicit confirmation that no source was touched (`git diff --stat` on non-doc paths empty). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the starting inventory, the doc structure, and the docs-only boundary are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope explicitly forbids source edits and config changes and defers fixes to Task 628. ✅
- The task does not claim a lint count as final — it requires regeneration and treats the 625 log as a provisional starting point. ✅
- Negative flows are selected by applicability, including the sandbox-timeout owner-native path and the accidental-edit guard. ✅
- Every cited file/command was inspected or is required to be regenerated before use. ✅
