# Task 627 — Triage the pre-existing SB10 ESLint debt (47 problems): authoritative inventory + remediation plan

- **Task path:** `tasks/kickoff_prompt_Task_627_SB10_Lint_Debt_Triage.md`
- **Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## Requirement and acceptance-criteria evidence

| ID | Evidence |
|---|---|
| R1 (AC1) | Regenerated `npm run lint`, verbatim transcript pasted into `docs/sb10-lint-debt-inventory.md` — total confirmed **47 problems (17 errors, 30 warnings)**, matching the transcript's own summary line and independently re-derived by summing the 8 category counts (13+1+1+1+1+25+4+1=47). |
| R2 (AC2) | Every one of the 47 problems categorized into 8 categories (table in the inventory doc); reconciliation sum = 47, zero left uncategorized. |
| R3 (AC2) | Each category has root cause (read + grep-verified, not guessed), fix approach, codemod-or-manual tag, and a risk note — see inventory doc. |
| R4 (AC3) | Inventory doc states a 6-step fix ordering and an explicit proposed Task-628 scope split (in-scope vs. needs-owner-call vs. optional-deferred), plus Category 1's two import-target options with trade-offs (per the kickoff's open question — not decided here). |
| R5 (AC4) | `git status --short` → only `docs/sb10-lint-debt-inventory.md` (new). `git diff --stat -- . ':!docs/**'` → empty. No product/story/test/config source touched. |
| R6 (AC1/AC2) | Every file path + rule ID in the inventory doc is copied verbatim from the regenerated transcript, not from the Task 625 log or memory — cross-checked line-by-line while writing the doc. Two deltas vs. the 625 log's prose summary were found and explicitly flagged (see "Delta" section in the doc), rather than silently reconciled or ignored. |

## Current versus required behavior

**Current (before):** 47 lint problems existed but were only described in the Task 625 session log as a prose
summary (4 loosely-named categories, no per-problem detail, no fix plan) — each future task would have had to
re-discover and re-cross-reference the debt by hand, as Task 625 itself had to.

**Required after (now landed):** one authoritative doc (`docs/sb10-lint-debt-inventory.md`) with the verbatim
current transcript, all 47 problems categorized into 8 precise categories with root cause/fix approach/risk/
codemod-eligibility, a recommended fix ordering, and an explicit Task-628 scope proposal. Source is byte-for-byte
unchanged — this task is triage only.

**Negative flows (applicability table from kickoff):**

| Branch | Applicable? | Result |
|---|---:|---|
| Regenerated lint differs from the 625 log | Yes | Two deltas found and flagged: (1) `RangeDatePicker.stories.tsx` no longer carries the Category-1 renderer-import error (already fixed in a later commit — 13 files now, not 14 as the 625 log implied), still carries the unrelated unescaped-entity error; (2) two categories (`ReportStatus` false-positive, `no-explicit-any` ×25) were not itemized in the 625 log's prose summary at all. Both documented in the inventory's "Delta vs. the Task 625 log" section, using the fresh transcript as authoritative per R6. |
| A new rule category appears | Yes (checked) | All 47 problems fit into 8 clean categories; no leftover/uncategorized problem, no forced-fit — confirmed by the 47-sum reconciliation. |
| Accidental source edit | Yes (guarded) | None occurred — `git status --short` and `git diff --stat` on non-doc paths both confirm zero source drift. |
| Lint cannot run in sandbox | No | `npm run lint` ran successfully in-sandbox; full verbatim transcript captured, no owner-native handoff needed. |
| UI/rendered behavior | No (docs-only) | N/A — no UI change. |

## Files Changed

| Path | Reason |
|---|---|
| `docs/sb10-lint-debt-inventory.md` | New — the authoritative categorized inventory + remediation plan (this task's deliverable). |
| `docs/sessions/2026-07-19-task627-sb10-lint-debt-triage.md` | This session log. |
| `docs/backlog.md` | Concise state registration (Task 627 line updated from "KICKOFF READY" to implemented, with a compressed result summary). |

No product, story, test, or ESLint-config file was touched.

## Validation evidence

**1. `npm run lint`** — full verbatim transcript captured and pasted into `docs/sb10-lint-debt-inventory.md`
(reproduced there in full, not re-pasted here to avoid duplication). Summary line:

```
✖ 47 problems (17 errors, 30 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

**2. Read-after-write on `docs/sb10-lint-debt-inventory.md`** — every rule ID and file path in the category tables
was cross-checked character-by-character against the pasted transcript while writing the doc (not copied from the
625 log). Category-count reconciliation (13+1+1+1+1+25+4+1=47) independently confirms nothing was dropped or
double-counted.

**3. Existing-doc check (kickoff's "check first" instruction):** read `docs/eslint-debt-taxonomy.md` in full. It
documents a **closed, unrelated** sprint (Tasks 65–71 + 295, closed 2026-05-30 at 0 errors/0 warnings, root cause:
`storybook-static/**` not excluded from lint scanning). None of the current 47 problems' root causes overlap with
that sprint's categories (that sprint never dealt with `storybook/no-renderer-packages`, since SB10's renderer-
package rule postdates it). Decision: created the new `docs/sb10-lint-debt-inventory.md` file per the kickoff's
primary instruction, rather than extending the closed taxonomy doc, and cross-referenced the relationship
explicitly at the top of the new doc so neither reader mistakes one sprint's status for the other's.

**4. Autofixability check (read-only):** `npx eslint --fix-dry-run --format json .` run and inspected (no `--fix`
flag, no write). Per-file `fixableErrorCount`/`fixableWarningCount` summed to 0/0 across all 47 problems — none
have a rule-level ESLint autofixer. Recorded in the doc's "Autofixability" section, reconciled against the plain-
text summary's "1 warning potentially fixable" (identified as the Category 8 unused-disable-directive, a built-in
disable-directive cleanup rather than a rule-based JSON-reported autofix).

**5. `git status --short`:**

```
?? docs/sb10-lint-debt-inventory.md
```

**6. `git diff --stat -- . ':!docs/**'`** (R5/AC4 — non-doc paths) → empty output. Confirms zero source-file drift.

## Self-review findings

- No defects found in the deliverable itself. Two genuine deltas against the Task 625 log's prose summary were
  found and are documented as findings, not silently corrected — this is the expected/required outcome of R6, not
  a self-review defect.
- Self-caught scope risk: initially considered folding this into `docs/eslint-debt-taxonomy.md` (the kickoff's
  "extend if a governance-debt doc already exists" clause), but on reading that doc fully, it represents a closed
  sprint with an unrelated root cause and a "0/0, COMPLETE" closure claim — merging would have made a false-status
  claim ambiguous (is the sprint reopened? is this new debt part of the old one?). Chose the new dedicated file
  instead and recorded the reasoning inline in both docs' cross-reference, rather than silently picking one
  interpretation.
- Category 5 (`ReportStatus` false-positive in `AdminReportsManager.tsx`) surfaced during root-cause investigation
  and was not in the 625 log at all — verified by reading the file (line 38: `status: ReportStatus`, a distinct
  type from `ListingStatus`) and confirming the `no-restricted-syntax` B1 selector matches on the literal string
  `'pending'` regardless of variable type. This is flagged as needing an explicit owner/config decision
  (`LISTING_STATUS_IGNORES` extension vs. a domain-helper), not silently assumed safe to add to a mechanical batch.

## Assumptions, deviations, and limitations

- No deviations from the kickoff's scope — no source, story, test, or config file was edited; only new/updated
  docs.
- The kickoff's "Assumption (reversible): the four categories above still cover 100%" was found to need revision —
  the regenerated run surfaces 8 categories (splitting the 625 log's coarse "unused-var warnings in test files"
  into three separate identifiers, and adding the two wholly-new categories). Per the kickoff's own instruction
  ("If the regenerated run surfaces a new category, add it and flag the delta explicitly"), this was done rather
  than force-fit into the original four.
- Category 3's fix (`@ts-ignore`→`@ts-expect-error`) carries a documented contingent risk (possible "unused
  expect-error directive" after the swap) that Task 628 must verify with `tsc --noEmit`, not assume as a pure
  no-op — flagged explicitly in the inventory rather than presented as risk-free.

## Opus handoff

- Full inventory: `docs/sb10-lint-debt-inventory.md`.
- Please re-verify: (a) the 8-category reconciliation sums to 47; (b) Category 5's flagged config-decision
  requirement is preserved as a gate before Task 628 touches `AdminReportsManager.tsx` (do not let it get bundled
  into a "mechanical batch" without the owner's explicit `LISTING_STATUS_IGNORES` call); (c) `git status --short`
  shows only the one new doc file, confirming R5's docs-only boundary held.
- Open question for the owner (per kickoff, recorded not decided): Category 1's fix — direct import-path change
  (Option A, strongly precedented by the 56 other story files already using it) vs. a new shared story-helper
  re-export (Option B, no current precedent). Recommend Option A based on the evidence, but this is the owner's/
  Task 628's call, not made here.

## Backlog update

`docs/backlog.md` Task 627 line changed from "📝 KICKOFF READY — not executed" to
"✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW" with a compressed category-count summary and a pointer to this
session log. File is 72 physical lines (within the ≤80 hard limit) — no `BACKLOG LIMIT BREACH`.
