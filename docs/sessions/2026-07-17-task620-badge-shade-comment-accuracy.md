# Task 620 — Correct the `theme.ts` shade-index comments for the five pre-existing badge colors

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_620_BadgeShadeCommentAccuracy.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q0 Docs/Governance

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `green`/`yellow`/`red`/`purple` comments no longer assert index 6 as the rendered Badge light-text value; each states index 7 + true hex | `theme.ts` diff: each tuple's index-6 line now reads "NOT what Badge renders — see index 7" (or, for `purple`, "NOT what Badge renders"); index-7 line names the actual rendered hex (`#027a48`/`#b54708`/`#b42318`/`#6547d6`) |
| R2/AC2 | `green`/`yellow`/`red` light-bg comments state `alpha(index7, 0.1)`, not the solid index-0 hex | Each index-0 line rewritten: `"lightest stop; Badge light bg is alpha(index7, 0.1) — a translucent tint, NOT this solid hex"` |
| R3/AC3 | `purple` comment records `#6547d6` (index 7, approximation) as the rendered Badge stop and `#7a5af8` as the unrendered authoritative index-6 value | `purple` tuple index 6: `"AUTHORITATIVE), but NOT what Badge renders — see index 7"`; index 7: `"approximation — Badge light text / filled / outline actually render THIS"` |
| R4 | `blueLight` gets a one-line clarifying note that Badge reads index 7 (identical value to index 6 here) | `blueLight` index-7 line rewritten: `"UNUSED by Alert...; Badge light/filled/outline DOES read this index...— identical value to index 6 here, so no rendered discrepancy"` |
| R5/AC4 | Zero change to any hex, `colors`, `primaryShade`, component style, story, locale, or other file — comments only | `git diff src/design-system/mantine/theme.ts` inspected line-by-line: every changed line is a `//` comment; every hex literal, the `colors` object (line 148), `primaryShade: 7` (line 147), and all `theme.components` blocks are byte-identical. No other file touched except this session log + backlog. |
| R6/AC5 | Touched file stays UTF-8 no-BOM, mojibake-free, `tsc`-clean; rendered output byte-identical to baseline | `tsc --noEmit` 0 errors; `check:mojibake` 0 artifacts/1777 files; `check:file-integrity` PASS (1 file clean); `screenshots:assert --mantine-only` 925/952 PASS, 0 FAIL, 27 AMBIGUOUS (same baseline as Task 619); Badge story's 16 screenshots individually byte-compared (`cmp`) against the pre-existing 2026-07-17T15-11 run — all 16 `IDENTICAL` |

## Current versus required behavior

**Before:** `theme.ts` comments asserted `green`/`yellow`/`red`/`purple` Badge light text renders the tuple's index-6 stop (e.g. `#039855`, `#d92d20`, `#7a5af8`) and that the light bg is the solid index-0 hex — values Mantine's `primaryShade: 7` (a bare number) never actually produces, since `getPrimaryShade()` returns 7 for every color project-wide (traced in `get-primary-shade.mjs` + `get-css-color-variables.mjs`, confirmed identical to the mechanism the `sale` tuple comment already documents).

**After:** the same five tuples keep every hex byte-identical; their comments now truthfully state Badge (light text/filled/outline) reads index 7, name the true rendered hex per color, and correct the light-bg description to the translucent `alpha(index7, 0.1)` tint. `purple` explicitly separates the unrendered authoritative `#7a5af8` (index 6) from the rendered approximation `#6547d6` (index 7). `blueLight` gets a note that its index-7 value happens to equal index 6, so no rendered discrepancy exists there.

**Negative flows applicability (per kickoff table):** Rendered/visual change — N/A (comment-only, confirmed via byte-identical screenshots). tsc/parse breakage — applicable, 0 errors. Encoding/mojibake — applicable, 0 artifacts. i18n/RLS/validation/concurrent — N/A (no strings, no data path, no runtime code touched).

## Files Changed

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | Corrected shade-index comments on `green`, `yellow`, `red`, `blueLight`, `purple` tuples (and the shared header above `green`) to state index 7 as the actually-rendered Badge stop, per R1–R4. No hex, `colors`, `primaryShade`, or component code changed. |
| `docs/backlog.md` | Concise current-state line (Task 620). |
| `docs/sessions/2026-07-17-task620-badge-shade-comment-accuracy.md` | This session log. |

## Validation evidence

- `npx tsc --noEmit -p tsconfig.json` → 0 errors.
- `npm run check:mojibake` → `0 artifacts in 1777 files`.
- `npm run check:file-integrity` → `PASSED — all 1 file(s) clean`.
- `git diff src/design-system/mantine/theme.ts` → 19 insertions / 14 deletions, every hunk a comment line (verified by reading the full diff: no hex literal, no `colors {...}` line, no `primaryShade` line, no `theme.components` block appears in any `+`/`-` line).
- `npm run build-storybook` → `Storybook build completed successfully` (exit 0).
- `npm run screenshots:assert -- --mantine-only` → **925/952 PASS, 0 FAIL, 27 AMBIGUOUS** (`.screenshots/rendered-assert/2026-07-17T16-10/manifest.json` summary), identical totals to the pre-existing Task 617/618/619 baseline. All 27 ambiguous cells are the known pre-existing Combobox/RangeDatePicker/NotificationBellView/Tabs overlay-backdrop/swipe-scroll cells — none touch Badge or any theme-color consumer.
- **Byte-identical proof (beyond "pass"):** all 16 `Mantine/Primitives/Badge/Default` screenshots (4 locales × 4 viewports) individually `cmp`-compared between this run (`2026-07-17T16-10`) and the immediately-prior run (`2026-07-17T15-11`, predating this session's edit) → all 16 `IDENTICAL`, confirming zero pixel change from the comment-only edit.

## Visual source trace

N/A per task scope — this is a comment-only edit inside a `.ts` source file with no rendered/behavioral change; the task's own applicability table marks "Rendered/visual change" as not applicable and requires proving that via a byte-identical baseline instead of a component-trace table. That baseline proof is in Validation evidence above.

## Self-review findings

- Re-read the full diff after editing: confirmed every changed line starts with `//` or is a comment appended after a value literal — no value literal itself was altered anywhere in the five tuples, `colors {...}`, or `primaryShade: 7`.
- Confirmed scope boundary: did not touch the `sale` tuple's comment (left as the accurate reference model, per task's explicit "Out of scope"), even though its own prose ("left untouched here, flagged for the orchestrator rather than silently fixed") is now stale given this task's fix — that staleness is an accepted, task-authorized byproduct of the explicit out-of-scope instruction, not a defect introduced here.
- Did not touch `purple`'s index-0 "approximation (Badge light bg)" comment — the task's Implementation requirements named only the `purple` index-6 line for rewrite; the index-0 line's imprecision (same latent issue as green/yellow/red's former index-0 comments) was left alone to stay strictly inside the task's named scope. Flagging for Opus in case a follow-up wants it aligned too.
- No defects found in the edit itself; typecheck, mojibake, file-integrity, and byte-identical screenshot proof all confirm a pure comment change.

## Assumptions, deviations, and limitations

- No deviations from the kickoff. All five implementation requirements (1–5) were followed exactly as specified, including keeping every hex digit untouched.
- The `purple` index-0 bg comment inconsistency noted above is a pre-existing, out-of-task-scope loose end (not newly introduced), left for a possible future doc-only follow-up.

## Opus handoff

- Evidence locations: `git diff src/design-system/mantine/theme.ts` (full diff in this session); `.screenshots/rendered-assert/2026-07-17T16-10/manifest.json` (925/952 PASS, 0 FAIL, 27 AMBIGUOUS); prior baseline run `.screenshots/rendered-assert/2026-07-17T15-11/` used for the byte-identical Badge-screenshot comparison.
- Primary question for review: confirm the comment wording is accurate and unambiguous per R1–R4, and confirm no hex/`colors`/`primaryShade`/component line was altered (AC4 self-audit above).
- Secondary: the `purple` index-0 bg comment and the now-stale prose in the `sale` comment (both noted above) — decide whether either warrants a follow-up task or is fine as-is.
- Git boundary observed: no mutating git commands run or emitted; all inspection was read-only (`git diff`, `git status` implicitly via the Bash tool's normal operation).

## Backlog update

Concise entry added to `docs/backlog.md` "Last Session" (single line, see diff). `docs/backlog.md` remains far over its stated 80-line active-state limit — **pre-existing `BACKLOG LIMIT BREACH`, not introduced or enlarged materially by this session** (only one short line added); consolidation left for Opus per the executor contract.
