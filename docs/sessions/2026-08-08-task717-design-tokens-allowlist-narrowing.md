# Task 717 — replace the `src/design-system/mantine` blanket allowlist key with scoped, reasoned ones

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **Sprint 52.2.** **QA profile:** `Q1` Targeted.
**Kickoff:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_717_DesignTokens_Allowlist_Narrowing.md` +
`Sprint_52_Task_717_execution_contract.md` + `Sprint_52_Task_717_rule_compliance_ledger.md`.
**Evidence root:** `.screenshots/task717-evidence/`.

---

## 1. Current vs required behavior

**Current (before this task).** `scripts/design-tokens-allowlist.json`'s first key was the bare directory
`"src/design-system/mantine"`, exempting all 46 `.ts`/`.tsx`/`.css` files under it from `check:design-tokens`
regardless of whether the stated reason (createTheme() input requirements + pattern-inline-style affordances)
actually described what each file contained.

**Required (after this task).** The blanket key is gone. Every one of the 15 files that actually carried a
detectable literal has either an exact-file-path scoped key (11 files) or per-line `design-tokens-allow:` markers
(4 files), each reason naming the specific thing it exempts. Anything genuinely tokenizable but left unfixed is
reserved under a new backlog number (**734**), not silently exempted. The gate still exits 0, but a literal planted
in a now-unexempted file is caught.

---

## 2. Requirement and acceptance-criteria evidence

| # | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Baseline re-derived with the detector's own exports | `I1-census.json` — **206 total / 15 files / 46 scanned**, exact match to kickoff §3.2, no discrepancy |
| R2/AC2 | All 206 classified into 3 classes | `I3-classification.md` — **141 createTheme() input / 40 non-tokenized affordance / 25 genuine N1**, sums to 206 |
| R3/AC3 | Bare-directory key gone, replacement keys are exact file paths with accurate reasons | `scripts/design-tokens-allowlist.json` diff — 11 new exact-file keys, `"src/design-system/mantine"` removed |
| R4/AC4 | Everything else carries a per-line marker with a real reason | 44 markers across 4 files; final gate reports `0 stale-marker(s)`, `0 missing-reason error(s)` (`K6a-final-strict.log`) |
| R5/AC5 | Plant proven in both directions | `K2-plant-fail.log` (fails, names `slider-chrome.css:24` and `#ff00ff`) + `K3-restore.txt` (hash `42adc4198f4ed6eaa295d4a6b9251bc0afac0b6c` matches pre-plant, path absent from `git status --porcelain`) |
| R6/AC6 | `check:design-tokens:strict` exits 0 at the end | `K6a-final-strict.log` — exit 0, 0/0/0/0 |
| R7/AC7 | Filtered diff (excl. comment-only/JSON/the one R9 line) is empty | `K5-filtered-diff.txt` — `FILTERED_DIFF_EMPTY: true` |
| R8/AC8 | Every genuine N1 reserved under one new number, none remediated | Task **734** filed in `docs/backlog.md`; `I3-classification.md` class-C table lists all 25 with file/line |
| R9/AC9 | Loose-matcher count re-measured, removed only if 0 | `K4-matcher.log` — 0 both before and after; third condition removed from `isAllowlisted` |
| R10/AC10 | `tsc`/`build` exit 0 | `K6b-tsc.log` exit 0; `K6d-build.log` exit 0 |
| R11/AC11 | Counting gates run twice, second after session log + backlog exist | `K6e-integrity-pass1.log`/`K6f-mojibake-pass1.log` (pre-log) + `K6g-integrity-pass2.log`/`K6h-mojibake-pass2.log` (post-log), both green |

---

## 3. Files Changed

| File | Reason |
|---|---|
| `scripts/design-tokens-allowlist.json` | Removed the bare-directory key; added 11 exact-file scoped keys (`theme.ts`, `typography.ts`, `notification-chrome.css`, `pagination-chrome.css`, `scrollarea-chrome.css`, `skeleton-chrome.css`, `MantineAppShellFoundation.tsx`, `MantineCombobox.tsx`, `MantineSelect.tsx`, `RangeDatePicker.tsx`, `MantineResponsiveActionFooter.tsx`) |
| `scripts/check-design-tokens.mjs` | R9 — removed `isAllowlisted`'s unbounded third matcher condition (re-measured 0 files depend on it), with an explanatory comment |
| `src/design-system/mantine/input-chrome.css` | 23 `design-tokens-allow` markers added (comment-only) |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | 13 `design-tokens-allow` markers added (comment-only) |
| `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` | 4 `design-tokens-allow` markers added (comment-only) |
| `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` | 4 `design-tokens-allow` markers added (comment-only) |
| `docs/backlog.md` | Task 717 state updated, Task 734 reservation filed, task registry counter advanced to 735 |
| `.screenshots/task717-evidence/*` | Checkpoint evidence artifacts (this task's own, counted in AC11's integrity/mojibake denominator both passes) |
| `docs/sessions/2026-08-08-task717-design-tokens-allowlist-narrowing.md` | This session log |

No production source file outside the design-tokens-allowlist mechanism was touched; `src/design-system/mantine/slider-chrome.css` was temporarily modified for the R5 plant and restored byte-identical (hash-verified, §2 R5 row) — it carries **no diff** in the final tree.

---

## 4. Validation evidence

| # | Command | Result |
|---|---|---|
| 0 | `git status --porcelain` (pre-write) | Clean — no dirty-worktree manifest needed (`J0-status.txt`) |
| 1 | Census via detector's own exports, empty allowlist | 206/15/46 — exact match (`I1-census.json`) |
| 2 | `npm run check:design-tokens:strict` (pre-edit) | exit 0, 0 violations — green only because of the blanket (`I2-preedit-strict.log`) |
| 3 | Classification | `I3-classification.md` — 141/40/25 = 206 |
| 4 | Allowlist + marker diff | `K1-scope-diff.txt` (see `git diff` — no key is a directory) |
| 5 | Plant · `check:design-tokens:strict` | **fails**, names `slider-chrome.css:24`, `#ff00ff` (`K2-plant-fail.log`, exit 1) |
| 6 | Remove plant · hash · status | hash matches pre-plant, path absent from porcelain (`K3-restore.txt`) |
| 7 | Loose-matcher re-measurement | 0 (`K4-matcher.log`); third condition removed |
| 7b | `npx vitest run scripts/__tests__/check-design-tokens.test.ts` | 98/98 passed — matcher change did not break existing detector tests |
| 6 (final) | `npm run check:design-tokens:strict` | exit 0, 0/0/0/0 (`K6a-final-strict.log`) |
| 7 (AC7) | Filtered diff (excl. comment-only/JSON) | **empty** (`K5-filtered-diff.txt`) |
| 8 | `npx tsc --noEmit` | exit 0 (`K6b-tsc.log`) |
| 9 | `npm run check:i18n` | exit 0, 2218/2218/2218/2218 keys, 0 raw-enum leaks (`K6c-i18n.log`) |
| 10 | `npm run build` | **exit 0**, production build succeeded (`K6d-build.log`) |
| 11a | `check:file-integrity` (pass 1, pre-log) | exit 0, 19 files clean (`K6e-integrity-pass1.log`) |
| 11b | `check:mojibake` (pass 1, pre-log) | exit 0, 0 artifacts / 2125 files (`K6f-mojibake-pass1.log`) |
| 11c | `check:file-integrity` (pass 2, post-log) | exit 0, 23 files clean (`K6g-integrity-pass2.log`) |
| 11d | `check:mojibake` (pass 2, post-log) | exit 0, 0 artifacts / 2128 files (`K6h-mojibake-pass2.log`) |

Pass-2 file counts (19→23 integrity, 2125→2128 mojibake) grew by exactly the session-log + backlog-update +
evidence-directory files added between the two passes — reconciled against `git status --porcelain` at pass 2:
7 modified + 2 untracked entries (`docs/sessions/2026-08-08-task717-*.md` and `docs/sessions/evidence/`). **Relocated at review (2026-08-08):** the evidence directory was moved to `.screenshots/task717-evidence/` to match D6 and every prior task; `docs/sessions/evidence/` no longer exists, so the final tracked set is 7 modified + 1 untracked.

---

## 5. Implementation validation notes

- The detector's non-`cssOnly` patterns (hex/color-function) are **not** CSS-comment-aware — only the `cssOnly`
  shorthand/single-value patterns strip `/* */` before matching. This produced 9 false-positive "violations" that
  were actually hex values documented inside comments, with the live declaration already using a Mantine CSS
  variable (`input-chrome.css` ×5, `notification-chrome.css` ×1, `scrollarea-chrome.css` ×1, `skeleton-chrome.css`
  ×2). Not a detector bug this task is in scope to fix (Implementation requirement #5 forbids retuning detection);
  handled via markers/scoped-key reasons naming the false-positive mechanism explicitly.
- OQ1 deviation: `input-chrome.css` needed 23 per-line markers (exceeds the "~15 ⇒ probably a tokenization job"
  soft threshold), but was NOT given a file-level "reserved" key, because 16 of its 23 findings are legitimately
  non-tokenizable (comment-text, touch-target convention, no border/ring-width token) and only 7 are genuine N1 — a
  wholesale "reserved" reason would have misrepresented the 16 legitimate ones. Flagged for orchestrator review
  (`I3-classification.md` §"OQ1 note").
- `typography.ts` and `MantineResponsiveActionFooter.tsx` were given file-level "RESERVED for Task 734" scoped
  keys rather than per-line markers, since each is 100% genuine-N1 and homogeneous — the direct OQ1 scenario.
- No rendered value was changed anywhere. Every edit to a production source file is a comment addition; proven by
  the empty filtered diff (`K5-filtered-diff.txt`), not asserted.

---

## 6. Assumptions, deviations, limitations

- **A1** (dirty-worktree manifest): worktree was clean at session start; no pre-existing modified paths to
  classify.
- **A2** (theme.ts's 141 are createTheme() inputs): verified by reading the whole file — every literal sits inside
  the single `createTheme({...})` call or a color tuple consumed by it (lines 154–925 / 5–152).
- **OQ1**: resolved as documented above — per-line markers over a file-level reserve for `input-chrome.css`,
  judgment call flagged for review.
- Temporary helper scripts (`scripts/_task717-census.mjs`, `_task717-apply-markers.mjs`,
  `_task717-matcher-check.mjs`, `_task717-filtered-diff.mjs`) were created and deleted within this session; none
  remain in the final tree (confirmed by `git status --porcelain`).
- **BACKLOG LIMIT BREACH**: `docs/backlog.md` was already 91 physical lines before this session (over the 80-line
  target) and is now 100 after this task's minimal current-state entries (one "Last Session" block + one task
  registry row split into two). Per the executor protocol this is flagged for Opus consolidation, not resolved
  here.

---

## 7. Opus handoff — questions and risks to inspect

1. **OQ1 deviation** (per-line markers vs. file-level reserve for `input-chrome.css`, 23 markers) — verify the
   70/30 legitimate/genuine-N1 split justifies not using a wholesale "reserved" key.
2. **Class-B borderline calls** worth independent verification: `MantineListingCardPattern.module.css:57`
   (`transform: translateY(-2px)`, classified non-tokenized — no negation convention found) and the two
   `borderRadius: '9999px'` pill-radius instances (`RangeDatePicker.tsx`, drag-handle files) classified
   non-tokenized on the basis that no live `var(--mantine-radius-pill)` usage exists anywhere in `src/` yet.
3. **`MantineResponsiveActionFooter.tsx`'s `zIndex: 100`** classified genuine N1 (bypasses `--z-sticky`) rather
   than non-tokenized — this is the one judgment call most likely to be contested, since sticky footers inside a
   Drawer/Modal footer might legitimately need to clear more than `z-sticky`'s value 30.
4. **BACKLOG LIMIT BREACH** — `docs/backlog.md` at 100 lines needs Opus consolidation.
5. Verify `slider-chrome.css` carries zero diff in the final tree (plant was fully reverted, hash-checked).

---

## 8. Backlog update

`docs/backlog.md` updated: new "Last Session (2026-08-08) — 717" block (7 lines), task registry row 717 updated
in place, new row 734 added, counter advanced to "Last used 734, NEXT FREE 735", Sprint 52 summary line updated.
Resulting physical line count: **100** (pre-existing breach, not created by this task — see §6).
**BACKLOG LIMIT BREACH** flagged for Opus consolidation.
