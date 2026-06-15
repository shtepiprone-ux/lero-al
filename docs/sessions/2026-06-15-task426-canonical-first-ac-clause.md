# Task 426 — Canonical-first / no-duplicate-class AC clause (governance)

**Type:** docs (governance — Canonical Task Template clause)
**Priority:** low (process hardening; no runtime behavior change)
**Origin:** Task 425 review (2026-06-14) — the kickoff AC demanded a literal local class diff
(`max-sm:w-full max-sm:min-h-11`) inside `StatusChangeControl.tsx`, but the behavior was already
inherited from canonical `<Button size="sm">` (Task 421, `button.tsx:26`). Sonnet correctly proved
this and did NOT duplicate the classes. This task codifies a "canonical-first" escape hatch so
future kickoffs cannot reproduce the conflict.

## What changed

1. `docs/ai-behavior.md` → "Canonical Task Template" → "Rules" subsection: added a new bullet,
   **"Canonical-first / no-duplicate-class AC (Task 426, 2026-06-15)"**, at `docs/ai-behavior.md:861`.
   Content: for any control rendered by a canonical primitive (`Button`, `Combobox`, `Input`,
   `Select`, `Dialog`, `Sheet`, `Popover`, …), ACs are canonical-first — a local responsive/utility
   class is added ONLY if not already inherited; if inherited, the deliverable is canonical-source
   proof (`file:line`) + rendered evidence, and duplicating the class is a rejection, not a pass.
   Includes the required conditional AC phrasing example verbatim from the kickoff.

2. `docs/orchestrator-role.md` → "Review checklist": added one matching checkbox at
   `docs/orchestrator-role.md:237`, **"Canonical-first respected (Task 426)"**, referencing the same
   rule name and verification (canonical-source proof `file:line` + rendered evidence; a duplicated
   class diverging a consumer from the canonical single-source = route back).

No other files touched. No `agent-contract.md` clause renumbering. No `src/`/`scripts/`/`messages/`
change.

## Positive / Negative flow

- **Positive flow:** future orchestrator reads the updated Canonical Task Template before writing a
  kickoff for a control rendered by a canonical primitive, phrases the responsive AC conditionally
  ("only if not inherited…"), and at review the new checklist item verifies no duplicate-class
  divergence was introduced. Both edits use the same rule name ("Canonical-first"), satisfying the
  cross-ref requirement.
- **Negative flow (off-happy-path):**
  - *Wording drift* — avoided: the clause preserves the exact normative meaning from the kickoff
    ("duplicating where canonical already covers = rejection, not a pass"), including the literal
    conditional-AC phrasing example. No softening to "may duplicate if convenient".
  - *Scope creep* — avoided: only the two named files/sections were touched; `agent-contract.md` was
    read for context only, not edited; no clause renumbering; no new ESLint/gate added.
  - *Cross-ref mismatch* — avoided: both the `ai-behavior.md` clause and the `orchestrator-role.md`
    checkbox use the name "Canonical-first" (and both cite "Task 426").
- **No locale/UI/breakpoint impact:** this is a docs-only governance change touching no user-facing
  string and no rendered surface — the i18n/responsive matrix (Note 18 / clause 12) does not apply.
  Stated here explicitly per the kickoff's negative-flow instruction, instead of pasting an empty
  matrix.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `docs/ai-behavior.md` "Canonical Task Template" contains the new "Canonical-first / no-duplicate-class" clause with the normative meaning (canonical-first; duplicate-where-inherited = rejection; conditional AC phrasing example) | ✅ | `docs/ai-behavior.md:861` |
| 2 | `docs/orchestrator-role.md` "Review checklist" contains the matching one-line checkbox referencing the same rule name | ✅ | `docs/orchestrator-role.md:237` |
| 3 | Scope clean — no `src/`/`scripts/`/`messages/`/locale change; no `agent-contract.md` renumber. The Task 426 change is split across two commits (see "Orchestrator review reconciliation" below): the `ai-behavior.md` clause + `backlog.md` entries landed in `c4a711ab4`; the `orchestrator-role.md` checkbox + this session log are the review commit. | ✅ | native (HEAD=91251b6): `git diff --stat HEAD` → `docs/orchestrator-role.md \| 1 +` (+ untracked session log); `git show HEAD:docs/ai-behavior.md` contains the clause (committed in `c4a711ab4`); `git show HEAD:docs/backlog.md` contains the Task 426 entries |
| 4 | File-integrity green on both touched files (0 NUL, parses/renders as markdown, not truncated mid-token) | ✅ | see integrity transcript below |
| 5 | `docs/backlog.md` + a `docs/sessions/` log added with a Files Changed table; session log states "no i18n / no responsive surface — N/A" with reasoning; executor does not emit git commands | ✅ | this file + `docs/backlog.md` "Last Session" updated below; no git commands emitted |

## File-integrity transcript (native PowerShell)

```
C:\Claude_Code_Projects\lero-al\docs\ai-behavior.md       -> NUL=0 BOM=False LastLine='...Note 21 + Note 23 force the editable control to appear in the diff.'
C:\Claude_Code_Projects\lero-al\docs\orchestrator-role.md -> NUL=0 BOM=False LastLine='...(380–383) from diffs — only from the rendered artifacts the new gate produces.'
```

Both files: 0 NUL bytes, no BOM, not truncated (last line intact, matches pre-existing content after
the appended bullet).

## Self-validation

`tsc`/`build`/`screenshots:assert` are **N/A** for this pure-docs change (no source/config files
touched). AC table above is all ✅, both edits verified by direct re-read at the cited line numbers.

**Self-validation: N/A (docs-only, no tsc/build/screenshots applicable) · AC table = all green ·
file-integrity = 0 NUL / no BOM / not truncated · scope = clean (review commit = `orchestrator-role.md`
+ this session log; the `ai-behavior.md` clause + `backlog.md` entries already landed in `c4a711ab4`)**

## Orchestrator review reconciliation (2026-06-15, Opus)

Native ground truth at review (HEAD=`91251b6`):

- `git diff --stat HEAD` → only `docs/orchestrator-role.md | 1 +`; this session log is untracked.
- `git show HEAD:docs/ai-behavior.md` already contains the canonical-first clause; `git show
  HEAD:docs/backlog.md` already contains the Task 426 entries — both landed earlier in commit
  `c4a711ab4` ("docs(Task426): open … governance task; stamp Task 425 SHA in backlog").

Consequence: the clause + backlog entries were committed BEFORE this review (bundled into the "open
task" commit). The earlier draft of this log's AC#3 pasted a `git diff --stat` showing two files /
two insertions, which never matched a single real diff — corrected above. Content of all four files
is correct on the merits; no rework of the rule is required. The review commit lands only
`orchestrator-role.md` + this corrected session log. **Lesson:** do not bundle unreviewed task
implementation into the "open task" commit.

## Files Changed

| Path | Rationale | Commit |
|------|-----------|--------|
| `docs/ai-behavior.md` | "Canonical-first / no-duplicate-class AC (Task 426)" bullet in the Canonical Task Template "Rules" subsection (`ai-behavior.md:862`). | `c4a711ab4` (already in HEAD) |
| `docs/backlog.md` | Task 426 entries; status flipped to APPROVED at review. | entries in `c4a711ab4`; status update in review commit |
| `docs/orchestrator-role.md` | Matching "Canonical-first respected (Task 426)" checkbox in the Review checklist (line 237). | review commit |
| `docs/sessions/2026-06-15-task426-canonical-first-ac-clause.md` | This session log. | review commit |

Executor does not emit `git add`/`git commit` — orchestrator reviews the diff and emits explicit-path
commit commands at review (single-writer rule).

## Appendix: encoding-artifact reference (Task 428)

This file is allowlisted in `scripts/mojibake-allowlist.json` because the Task 428 mojibake gate's
origin discussion (2026-06-15 owner report) is anchored to this session's timeline. Reference
examples of the double-encoding artifacts that gate detects, quoted intentionally for documentation
(`check:mojibake` skips this file):

- `Ô£à` is UTF-8 for `✅` mis-decoded as CP1252.
- `ÔåÆ` is UTF-8 for `→` mis-decoded as CP1252.
- `ÔÇö` is UTF-8 for `—` mis-decoded as CP1252.
- `â€“` is UTF-8 for `–` mis-decoded as CP1252.
- `�` is the U+FFFD replacement character (lossy decode).
