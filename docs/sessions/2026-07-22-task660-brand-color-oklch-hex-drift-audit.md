# Session log — Task 660: Brand-color oklch↔hex drift audit

**Task path:** `tasks/kickoff_prompt_Task_660_Brand_Color_OKLCH_Hex_Drift_Audit.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** `Q0` (read-only governance report; no product-code, token, or style change)

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Every `--brand-*` shade (light+dark, incl. 50/100/850/950) tabulated: oklch, self-comment hex, actual computed hex, theme.ts hex, match verdict; reproducible. | Report §3 (light, 12 rows), §4 (dark, 3 overrides + 9 inherited), §8 appendix (full script stdout). |
| R2/AC2 | brand-700 light: actual `#D25656` (≠ `#EC5447`), contrast-white 4.03:1, classified material; brand-700 dark computed + classified. | Report §3 row brand-700 (ΔE 17.05, "Material — confirms Task 659"); §8 contrast line `4.03:1`; §4 row brand-700 (`#F04C54`, ΔE 9.10 vs EC5447, "Material — directionally correct"). |
| R3/AC3 | Every `var(--brand-700)`/`--color-brand-*` consumer listed with render path + representative surface. | Report §5a (14-row CSS-var-path table, re-grepped, found one addition beyond the task's §3 list — the 5-entry `@theme` bridge) + §5b (Mantine-path representative surfaces). |
| R4/AC4 | Blast radius: per-token before/after hex + affected surfaces if oklch scale corrected to theme.ts hexes, light+dark. | Report §6 (light before/after table; dark section explains why "match theme.ts" is not single-valued for dark and frames the two sub-options). |
| R5/AC5 | Concrete recommendation + exact owner decision; states whether `#EC5447` comments become correct/stale. | Report §7: recommends correcting the oklch scale to theme.ts hexes; states the `#EC5447`-family comments are already correct targets (only the oklch numbers are wrong); frames the 3-way owner decision. |
| R6/AC6 | No edit to any token/comment/component value; deliverable is the report only. | `git diff --stat -- src/app/globals.css src/design-system/mantine/theme.ts` → empty (zero changes). See Validation evidence below for full diff scope. |
| R7/AC7 | Every claim is a computed value or a cited inspected fact; inference marked. | All hex/ΔE/contrast values are script outputs (§8); all line-number/token claims re-inspected this session (see Files Changed / current-behavior section); the dark-mode design-intent-fork and hardcoded-literal findings are explicitly labeled "verified fact" with the exact lines read (globals.css:441/442/444/475, theme.ts:34/150-152). |

## Current versus required behavior

| Aspect | Current | Required after |
|---|---|---|
| Brand color source of truth | Split: `theme.ts` hex `#EC5447` vs `globals.css` oklch rendering `#D25656` (light) / `#F04C54` (dark); drift undocumented. | Unchanged in code; drift fully documented + quantified in one report with a recommendation. |
| Product rendering | Unchanged. | Unchanged (read-only task). |

Negative flows (per task §11): out-of-gamut/clamped shade — checked, none found (§3/§4, all `outOfGamut=false`);
dark-mode shades differing from light — separate dark table produced (§4), including the 9 shades that silently
inherit light-mode oklch; "a shade actually matches its comment" — explicitly checked and found **not** to occur at
the report's own exact-match threshold; documented honestly rather than fabricating a match (§3 "Honesty check").

## Files Changed

| Path | Reason |
|---|---|
| `docs/governance-reports/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md` | New — the required deliverable (R1–R7). |
| `docs/backlog.md` | Added a concise Last Session entry for Task 660 and bumped "last used" task number to 660 (file already over the 80-line cap before this edit — `BACKLOG LIMIT BREACH` continues to apply, flagged below). |
| `docs/sessions/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md` | New — this session log. |

**Pre-existing, unrelated modifications present in the working tree before this session started (not touched by this
task, listed here for transparency since `git status` shows them):** `.claude/hooks/sonnet-executor-bootstrap.ps1`
and `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` were already modified at
session start (per the initial `git status` snapshot). Neither was read, edited, or relied upon by this task.

`src/app/globals.css` and `src/design-system/mantine/theme.ts`: **confirmed zero diff** (`git diff --stat` empty for
both paths) — satisfies R6/AC6.

## Validation evidence

1. `git diff --name-only` (after this task's edits): `.claude/hooks/sonnet-executor-bootstrap.ps1` (pre-existing,
   unrelated), `docs/backlog.md` (this task), `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`
   (pre-existing, unrelated). New untracked file:
   `docs/governance-reports/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md`. `git diff --stat -- src/app/globals.css src/design-system/mantine/theme.ts`
   → empty output, confirming both files are untouched (AC6).
2. Conversion reproduced for all 12 light shades + 3 dark overrides via a throwaway Node script (OKLab↔linear-sRGB
   per Björn Ottosson's published matrices, gamma-encoded, CIE76 ΔE via sRGB→XYZ(D65)→Lab). brand-700 light computed
   as `#D25656`, contrast-white `4.03:1` — both match the orchestrator's independently-verified Task 659 finding
   exactly, validating the method before extending it. Full stdout pasted into report §8. Script not committed (ran
   from the scratch directory only).
3. Spot-check of "closest to matching" shades (per task verification step 3): `brand-50` (ΔE 2.15) and `brand-950`
   (ΔE 3.48) are the two lowest-drift shades in the scale — cited explicitly in report §3 as the closest pair,
   rather than asserting a false exact-match where the computed data shows none exists. This is stated transparently
   in the report rather than forcing the verification step's premise.
4. Self-audit: all seven ACs mapped above with report section citations; no AC left unaddressed.

No build, no screenshots, no locale matrix — correct for `Q0` per `docs/qa-profiles.md` (no runtime/visual/behavioral
change).

## Visual source trace / canonical UI decision record

Not applicable — no visible UI artifact was changed. The report documents existing rendered colors; it does not alter
any component, class, token, or Story.

## Self-review findings

- No exact hex match exists anywhere in the scale (contrary to the task's framing that assumed some shades would
  "actually match their comment") — reported honestly with the closest pair identified instead of an invented match.
- Found and reported a fact beyond the task's §3 list: the `@theme inline` bridge exposes 5 `--color-brand-*`
  utilities (50/100/700/800/950), not just `700`.
- Found and reported that 4 dark-mode tokens (`--accent`, `--accent-foreground`, `--destructive`, `--chart-4`) are
  hardcoded `oklch(...)` literals in `.dark`, not `var(--brand-*)` references — a correction to the brand scale would
  silently skip them.
- Found and reported that `theme.ts`'s `primaryShade: 7` (a bare number, not a per-scheme object) makes the Mantine
  palette path render the same flat `#EC5447` in both light and dark, whereas the CSS-var path deliberately
  brightens brand-700 for dark — a real design-intent fork that any correction plan must resolve, not just a
  magnitude difference.
- No defects were "fixed" — this is a read-only audit task; all of the above are report findings, not code changes.

## Assumptions, deviations, and limitations

- A1/A2 honored: correction itself out of scope; email hardcodes treated as context, not a target.
- Mantine-palette consumer list (§5b) is representative, not exhaustive — stated explicitly in the report per the
  task's own allowance.
- The dark-mode white-text contrast figure (3.58:1) was computed as a natural extension of the required pipeline but
  was not an explicit AC — included for completeness and flagged as such in the report.
- §6's dark-mode "flatten vs recalibrate" sub-decision is intentionally left open for the owner; no target dark-mode
  contrast value was computed since that would presuppose a chosen correction path.
- Task's own §3 cited globals.css light-block line numbers as 305–314; on inspection the actual current lines are
  302–313 (content otherwise matches exactly — likely minor line drift from an earlier edit). Report uses the
  re-verified current line numbers throughout.

## Opus handoff

Evidence locations: `docs/governance-reports/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md` (the
deliverable), this session log, `docs/backlog.md` diff.

Questions/risks for the reviewer to inspect:
1. Confirm the CIE76 ΔE method and classification bands (§2/§3) are an acceptable operationalization of the task's
   "ΔE or hex-equal" instruction, given that literal application puts every shade in "material" and none in "minor."
2. Confirm the dark-mode design-intent-fork finding (§4/§6 — Mantine flat vs CSS-var deliberate brightening) is
   framed usefully for the eventual correction task, and that the 4 non-wired dark hardcodes (§5a) are an acceptable
   scope note rather than something this task should have gone further to resolve.
3. `BACKLOG LIMIT BREACH` continues (file was already over 80 lines before this task's minimal addition) — flagged
   for Opus consolidation at review, per the task's own anticipation of this in §14.

## Backlog update

Added a concise `660` entry to "Last Session" and updated "Task numbering — last used" from 659 to 660 in
`docs/backlog.md`. Resulting file is further over the pre-existing 80-line cap (already breached before this
session). `BACKLOG LIMIT BREACH` — flagged for orchestrator consolidation, consistent with the task's own §14
anticipation ("it is already at the cap, so a minimal in-place edit is expected").
