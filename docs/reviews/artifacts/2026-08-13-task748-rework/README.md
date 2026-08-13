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
| `twmerge-class-resolution-all18.mjs` / `.txt` | RR4 — extends the reviewer's 9-case witness to all 18 distinct JSX elements (24 utility sites). Confirms exactly 1 element (`E12`, the `ListingGallery` photo-count Button) has a moved effective declaration set; all 19 others (including `E6b`/`E7b`, the `PerfDevOverlay` budget rows' over-budget state) are stable. Exit 0 only because that 1 moved element matches its own declared expected signature — a different delta, or a delta at any other site, fails the script (REWORK2/RW1/RW2, see below). |
| `rw1-gate-blindness-probe.mjs` / `.txt` | REWORK2/AC1 — the fixed gate's own equivalent of the round-2 reviewer's `g1-gate-blindness-probe.mjs` (byte-identical `CASES`/detector to `twmerge-class-resolution-all18.mjs`, with only `E6b`/`E7b`'s RR1 fix reverted). Proves the fixed gate reddens on the exact revert that the round-1 gate silently forgave: exit 1, 2 unexpected. |
| `real-before-after-comparator.mjs` | RR3 — the real two-phase comparator. BEFORE = a clean I0 export of `d3ffd6d6c` (`git archive`, resolved relative to the repo root — see below); AFTER = this worktree's own `storybook-static`. Part A re-verifies the 3 real story-backed sites via real structurally-resolved elements on both sides (no synthetic probe). Part B carries the two REWORK-required witnesses (`PerfDevOverlay` budget rows forced over-budget; `ListingGallery` photo-count Button rest+hover <768px) via a harness-page technique — a synthetic node carrying a `cn()`-computed className string is read against each phase's own real compiled stylesheet (`PerfDevOverlay` is dev-only/non-visual, `ListingGallery` has no story — the parent's own §3.6 correction), plus an injected `--mantine-color-brand-9` runtime variable and a fail-closed unstyled-control comparison on every Part B cell (REWORK2/RW3-RW5, see below). |
| `real-comparator-PLANTED.json` / `real-comparator-result.json` | The plant run (corrupts the AFTER-side/subject measurement of one cell) and the clean run — both re-run against the REWORK2-fixed comparator. |
| `real-comparator-OMIT-MANTINE-VARS.json` | REWORK2/AC3 — `--omit-mantine-vars` run: disables the injected `--mantine-color-brand-9`, reproducing the original unresolved-property condition, to prove the independent fail-closed control check reddens on its own. |

### REWORK2 fixes to the two scripts above (round 3, narrow)

- **RW1/RW2 (findings G1, G2)** — `twmerge-class-resolution-all18.mjs`'s regression gate previously
  whitelisted `E6`/`E7`/`E12` by matching the case id string, unconditional on the actual delta, so a
  full revert of the RR1 fix still exited 0 (G1); it also flagged `E6b`/`E7b` as a moved declaration
  set even though their before/after strings are byte-identical, because it never checked whether
  `after` still carried a module class (G2). Fixed by keying each known site on its own expected
  delta *signature* (module-class presence + the exact utilities allowed to newly survive) instead of
  the case id — see the script's own header comment for the full method. A latent, unrelated bug
  found while fixing this (the missing `E7` placeholder silently deleting `E18` via a `splice(-1, ...)`
  on a failed `findIndex`) is fixed in the same pass; `E18` now runs.
- **RW3 (finding G3, P0)** — the two `PerfDevOverlay` Part B cells measured `rgb(0, 0, 0)` on both
  sides because `--mantine-color-brand-9` is injected by `MantineProvider` at runtime and was absent
  from the static harness, so the comparator scored a shared UA fallback as agreement. Fixed two ways:
  the harness stylesheet now defines `--mantine-color-brand-9: #8E322B` (`src/design-system/brand.ts`
  brand[9]; the app is light-only, so this is a static constant, not a per-theme placeholder), and
  every Part B cell independently measures an unstyled control element and reports `UNRESOLVED`
  (a failure) if the probe doesn't differ from it — so an unresolved custom property can never again
  be scored as a match, regardless of which property triggers it.
- **RW4 (finding G4)** — the Part B `ListingGallery` BEFORE className was a hand-typed fixture that
  claimed to be "verified byte-identical" to `twmerge-class-resolution-all18.mjs`'s output but wasn't
  (real tailwind-merge deletes `text-foreground`/`hover:bg-muted` from it). Fixed by computing it with
  the same `cn()` call at runtime instead of typing it, so the claim is now true by construction.
- **RW5 (finding G5)** — `BEFORE_STATIC` and the I0 `.next/static/css` path were hardcoded absolute
  machine-local paths (`C:/Claude_Code_Projects/lero-al-i0-d3ffd6/...`). Fixed: the I0 export path is
  now resolved relative to the repo root (a sibling directory, overridable via
  `LERO_I0_EXPORT_DIR`), and the script exits with a clear message naming the required revision and
  the `git archive` command to build it if the export is missing, instead of a bare `ENOENT`.

## Base worktree note

The BEFORE phase used `C:\Claude_Code_Projects\lero-al-i0-d3ffd6`, created via `git archive
d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f | tar -x` (read-only export — no `git worktree`/`checkout`/
`stash`, none of which Sonnet may run) into a fresh directory, with `node_modules` linked to this
worktree's own via a directory junction (`package-lock.json` confirmed byte-identical between the
two revisions first). This mirrors Task 691R's owner-created-worktree precedent
(`docs/sessions/2026-08-12-task691R-remediation.md` §"BEFORE phase") without requiring an
owner-run mutating git command, since `git archive` reads the repository without creating a branch,
worktree registration, or touching this worktree's `HEAD`/index at all.

**REWORK2/RW5:** `real-before-after-comparator.mjs` no longer hardcodes this path. It resolves the
I0 export as a sibling directory next to the repo root by default (exactly the location above),
overridable via `LERO_I0_EXPORT_DIR`, and exits with an actionable message naming revision
`d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f` and the `git archive` command above if the export is
missing at that location — no absolute machine-local path remains in the script.

**Owner may remove `C:\Claude_Code_Projects\lero-al-i0-d3ffd6`** once review is complete — it is a
plain directory (not a registered git worktree), so a normal recursive delete is sufficient; no
`git worktree remove` is needed.
