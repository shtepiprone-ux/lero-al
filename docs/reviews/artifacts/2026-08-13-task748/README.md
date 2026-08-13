# Task 748 — orchestrator review evidence (2026-08-13)

Prepared in a non-ignored location for tracking. This directory is currently uncommitted and must
be staged with the review package before any fresh-clone claim. Task 691's review recorded defect **F-U**: an active ledger cited
`.screenshots/**`, excluded by `.gitignore:55`, so every cited path was unresolvable in CI or a
fresh clone. Nothing in this folder is gitignored, and nothing here cites a path inside a
regenerated build directory as its only home.

Reviewer: Opus orchestrator review of Task 748. Subject tree: the **uncommitted** Task 748 change
set on `task/q0-ci-rendered-locale-split`, base `d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f`.

| Artifact | What it establishes | Re-run |
|---|---|---|
| `census-final-reviewer.txt` | §13's census command, re-run by the reviewer: `TOTAL 0`. AC1 holds. | the §13 one-liner, verbatim |
| `globals-css-diff.txt` | `git diff src/app/globals.css` — 0 bytes. AC6 holds. | `git --no-optional-locks diff src/app/globals.css` |
| `bundle-layer-and-offsets.txt` | Tailwind utilities are inside `@layer utilities`; `.text-overlay-foreground` is gone from the bundle; the only surviving overlay utilities are `.bg-overlay` and the two-tier `.bg-overlay\/95`. Confirms AC1 at bundle level and R11-as-expanded. | see header of the file |
| `emitted-module-chunk-ListingGallery.css` | The real emitted CSS-module chunk. **No `@layer`** — module rules are unlayered and therefore beat every Tailwind utility regardless of specificity or source order. This is the load-bearing fact under F-A and F-B. | copied from `.next/static/css/` after `npm run build`; the content hash in the filename is volatile, the content is not |
| `twmerge-class-resolution.mjs` / `.txt` | `cn()` is `twMerge(clsx(...))`. Prints, per site, which classes actually survive before and after. 3 of 9 sites move; the 6 controls do not. | `node docs/reviews/artifacts/2026-08-13-task748/twmerge-class-resolution.mjs` |
| `cascade-repro.mjs` / `.txt` | Real-browser computed styles for the two moved sites plus a control. Fail-closed: exits 1 on any mismatch. 10/10 matched. | `node …/cascade-repro.mjs [--chromium <path>]` |
| `live-color-overlay-refs.txt` | **7** live, non-comment `var(--color-overlay*)` references remain in `src/**`. These, not the two comment strings, are what still blocks 695's namespace deletion. | see header of the file |

## Not re-run by the reviewer

`npx vitest` cannot execute from the reviewer's bridge VM: `node_modules` holds Windows-built
rollup bindings and the bridge is Linux (`MODULE_NOT_FOUND` on `rollup/dist/native.js`). The
1347/1347 suite and the 4/4 `ListingGallery.portal.smoke.test.tsx` result are therefore carried
from the executor's report, not independently verified. Same class of limitation as the one
recorded for Task 700. `npm run typecheck` **was** re-run here and is clean.

## Ledger gate

`npm run check:review-ledger -- --file docs/reviews/2026-08-13-task748-overlay-utility-exit.review-ledger.json`
→ **PASSED**, exit 0, recorded in the ledger's own `review.ledgerGate`.

The repo-wide `npm run check:review-ledger` (no `--file`) cannot run from the reviewer's Linux
bridge: the Task 691R ledger uses `semanticCheck.mode: EXACT_GENERATED`, whose validator arm shells
out to the Tailwind compiler, which fails with `MODULE_NOT_FOUND` on `lightningcss/node/index.js` —
the same Windows-binary/Linux-bridge mismatch that blocks `vitest` here. The two
`.SUPERSEDED.json` failures in that run are downstream of 691R being judged invalid in it. This is
an environment limitation of the review run, not a repo regression, and the owner should re-run the
repo-wide gate natively before landing anything.

## Correction, round 2 (2026-08-13)

`cascade-repro.mjs` defines `--destructive: oklch(.58 .22 27)` in its own `:root`. That is a
**placeholder**, not this project's value, and the file now says so. The real chain is
`globals.css:411 --destructive: var(--brand-900)` -> `:365 --brand-900: var(--mantine-color-brand-9)`,
injected by MantineProvider at runtime and **absent from `.next/static/css`** (real value `#8E322B`).
F-A is a delta claim and the delta stands on any stand-in red — but `oklch(0.58 0.22 27)` must not be
cited as the app's production destructive colour, and a harness page without Mantine's runtime
variables will report `rgb(0, 0, 0)` for that row, which is an artefact of the harness rather than a
value the app renders.
