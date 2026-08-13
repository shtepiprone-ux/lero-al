# Task 748 REWORK — tracked evidence (2026-08-13)

Fixes Task 691's **F-U** defect class, recorded again against Task 748's parent submission: every
path this rework's session log or ledger cites must resolve from a fresh clone, not only from
gitignored `.screenshots/`. Nothing in this folder is gitignored.

Do not edit, move, or supersede `docs/reviews/artifacts/2026-08-13-task748/` — that is the
reviewer's own record for the parent submission, cited by
`docs/reviews/2026-08-13-task748-overlay-utility-exit.review-ledger.json`.

## Files from the parent submission (moved here, RR6)

Everything previously under `.screenshots/task748-overlay/` (gitignored, unresolvable in CI or a
fresh clone) — the I0 census/build/globals.css grep, the D35 compiled-before-side compiler and its
output, the hover-wrapper investigation scripts, the original (now-superseded) synthetic-probe
comparator (`capture-and-compare.mjs` + its plant/real run results), and every gate transcript.
`build-storybook*.txt` were trimmed to their final ~20 lines (the full logs are ~515 KB of Vite
progress-bar noise); the trimmed tail carries the exit code and build summary, which is the
evidentiary content.

**The parent's `capture-and-compare.mjs` is superseded, not deleted** — it is the exact artifact
the REWORK review found insufficient (RR3); it stays as a record of what was tried and why it
could not see F-A/F-B (see the REWORK session log §RR3).

## New files (this REWORK)

| File | What it establishes |
|---|---|
| `twmerge-class-resolution-all18.mjs` / `.txt` | RR4 — extends the reviewer's 9-case witness to all 18 distinct JSX elements (24 utility sites). Confirms exactly 3 elements (the two `PerfDevOverlay` budget rows' over-budget state, and the `ListingGallery` photo-count Button) have a moved effective declaration set; all 15 others are stable. Exit 0 only because the 3 moved elements are the already-known, already-fixed F-A/F-B sites — any other movement fails the script. |
| `real-before-after-comparator.mjs` | RR3 — the real two-phase comparator. BEFORE = a clean I0 export of `d3ffd6d6c` (`git archive` + a node_modules junction, `npm run build-storybook` run natively there); AFTER = this worktree's own `storybook-static`. Part A re-verifies the 3 real story-backed sites via real structurally-resolved elements on both sides (no synthetic probe). Part B carries the two REWORK-required witnesses (`PerfDevOverlay` budget rows forced over-budget; `ListingGallery` photo-count Button rest+hover <768px) via a harness-page technique — a synthetic node carrying the exact verified className string is read against each phase's own real compiled stylesheet, since neither site has a canonical story (`PerfDevOverlay` is dev-only/non-visual, `ListingGallery` has none — the parent's own §3.6 correction). |
| `real-comparator-PLANTED.json` / `real-comparator-result.json` | The plant run (corrupts the AFTER-side/subject measurement of one cell) and the clean run. |

## Base worktree note

The BEFORE phase used `C:\Claude_Code_Projects\lero-al-i0-d3ffd6`, created via `git archive
d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f | tar -x` (read-only export — no `git worktree`/`checkout`/
`stash`, none of which Sonnet may run) into a fresh directory, with `node_modules` linked to this
worktree's own via a directory junction (`package-lock.json` confirmed byte-identical between the
two revisions first). This mirrors Task 691R's owner-created-worktree precedent
(`docs/sessions/2026-08-12-task691R-remediation.md` §"BEFORE phase") without requiring an
owner-run mutating git command, since `git archive` reads the repository without creating a branch,
worktree registration, or touching this worktree's `HEAD`/index at all.

**Owner may remove `C:\Claude_Code_Projects\lero-al-i0-d3ffd6`** once review is complete — it is a
plain directory (not a registered git worktree), so a normal recursive delete is sufficient; no
`git worktree remove` is needed.
