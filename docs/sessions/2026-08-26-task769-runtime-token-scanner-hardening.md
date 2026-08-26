# Task 769 — Runtime-token scanner hardening: fail-closed TSX inputs and Mantine theme ownership

**Task path:** `tasks/Sprints/Sprint_65_kickoff_prompt_Task_769_Runtime_Token_Scanner_Hardening.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Executor:** Sonnet, 2026-08-26. Never self-approved; committing and pushing are owner-only.

## 1. §10.0 mandatory first action — pre-edit measurements

All commands run read-only from the project root, before any source edit.

```
node.exe -p process.platform                                          → win32
git --no-optional-locks status --short --branch                       → ## main...origin/main
git --no-optional-locks log -1 --oneline                               → 7bde7242e docs(Task769): file the runtime-token scanner hardening kickoff under D65-F
git diff --quiet 6b43b9676..HEAD -- scripts/check-tailwind-runtime-tokens.mjs   → exit=0 (byte-unchanged since filing)

npm run check:tailwind-runtime-tokens            → exit=0, 25 module-CSS + 2 TSX, 0 found, 0 baseline
node scripts/check-tailwind-runtime-tokens.mjs --report → exit=0, 0 pair(s)/0 use(s) in both origins
npm run check:tailwind-runtime-tokens:verify-gate → exit=0, "4/4 verify-gate assertions behaved as expected (3 plants exited 1, 1 control exited 0)"

TSX_FILES_REL at :186-189 — exactly 'src/app/[locale]/page.tsx', 'src/components/shared/HeroSearchView.tsx'
`if (!existsSync(absPath)) continue;` present at :561
AgentCtaButton.tsx:24 reads var(--button-padding-x); theme.ts:295 declares '--button-padding-x': '1rem'

Theme-key probe (AST-free line scan, matches kickoff §10.0):
9 ["--button-bd","--button-bg","--button-color","--button-hover","--button-padding-x","--progress-size","--sc-label-color","--slider-track-bg","--table-border-color"]
```

Every reading matched §3 of the kickoff exactly. No stop condition (§11) fired.

**One documentation defect in the kickoff, noted per §14.7 (not a stop condition):** §10.4 row 4 labels
the dynamic-template-expression case "retained from Task 767," but the shipped `--verify-gate` (confirmed
above and by reading the whole file) runs exactly 3 plants + 1 control — no dynamic-template plant exists
in the self-test today, only the underlying `dynamicViolations` detection mechanism in `scanTsxFile`. §3.1
itself correctly states "3 plants + 1 control." Case 4 was implemented as a genuinely new plant (§10.4's
required behavior — exit 1, dynamic-name violation — is unambiguous and was built regardless of the
"retained" mislabel).

## 2. Requirement ledger, current vs. required behavior

Restated from kickoff §4/§9; unchanged from the kickoff — see the kickoff file for the full table.
Positive flow: R1–R12 all implemented. Negative flow (kickoff §9 applicability table): only
"Validation (missing/unparsable gate input)" and "Validation (extracted set vacuous)" are applicable;
authorization/RLS, offline/network, concurrent-writer, and localization are all N/A for this CLI gate
script, as the kickoff states — no invented branches were added.

## 3. Implementation

**File 1 — `scripts/check-tailwind-runtime-tokens.mjs`:**

- Added `MANTINE_THEME_PATH` / `MANTINE_THEME_PROOF_KEY` constants.
- Added `extractMantineThemeNames(themePath)` — TypeScript-compiler-API walk that finds every
  `PropertyAssignment` named `vars` or `styles`, then collects every string-literal property key
  starting with `--` inside that subtree (`collectCustomPropertyKeys` + `walkForVarsAndStyles`).
  Drops `--mantine-` names (already owned by the prefix rule). Returns `{ fatal }` for a
  missing/unreadable/unparsable file or a set missing the `--button-padding-x` proof key — never an
  empty set and a green run.
- `classifyName` gained a `mantineThemeNames` parameter and the exact required check, in the exact
  required position (per kickoff §10.3's code block, verbatim):
  ```
  if (isKnownExternal(name)) return 'external';
  if (isTailwindPrefixed(name)) return 'tailwind';
  if (tailwindOwnedNames.has(name)) return 'tailwind';
  if (mantineThemeNames.has(name)) return 'external';   // D65-F, new
  if (ownedSet.has(name)) return 'project';
  if (localDeclaredNames.has(name)) return 'project';
  return 'tailwind';
  ```
- `scanModuleCss` and `scanTsxFile` both gained a `mantineThemeNames` parameter, threaded through to
  `classifyName` — this is what makes the exception global (D65-F), not TSX-only.
- `runScan` gained a `themePath` parameter (default: the real `theme.ts`), calls
  `extractMantineThemeNames` and propagates its fatal, and — before the TSX scan loop — resolves every
  entry in `tsxFiles` and returns `{ fatal }` naming every missing repository-relative path if any are
  absent. Deleted the `if (!existsSync(absPath)) continue;` skip inside the TSX loop; `tsxFilesScanned`
  is now an invariant equal to `tsxFiles.length` on any non-fatal run.
- `setupTempTree`/`evaluateTree` gained a `themePath`/`tsxFilesOverride` so every `--verify-gate` case
  points at its own copied `theme.ts` and can override the TSX input list per case; the real `theme.ts`
  is never read by a temp-tree case.
- `--verify-gate` grew from 4 asserted outcomes (`runPlant1/2/3` + `runControl`) to the 10 required by
  kickoff §10.4 (`runCase1`–`runCase10`), each printing its actual exit code and decisive detail; the
  banner/summary text no longer hardcodes "3 plants exit 1, 1 control exits 0."
- Updated the module header comment: bucket count 3 → 4, the Mantine-theme-owned bucket description,
  a new "Task 769" doc section, and the MODES/`--verify-gate` description.

**File 2 — `docs/design-system.md` §23.7 (amended in place, still §23.7, same heading):**

- The "Ownership" bucket list is now four buckets — added bucket 3 (Mantine-theme-owned, cites D65-F
  with its date, lists the nine names, states the exclusion of `--mantine-color-default-border`).
- Added a paragraph documenting the runtime TSX input list as closed/fixed at two files (not a
  route-graph inventory) and the fatal-on-missing-input rule — items 1–2 of kickoff §10.5, which
  Task 767 itself had never documented here (checked: no `TSX_FILES_REL`/`HeroSearchView` mention
  existed in this file before this edit).
- Added the §3.5 comment-stripping boundary paragraph (item 4 of §10.5).

## 4. Requirement / acceptance-criteria evidence

| Req/AC | Status | Evidence |
|---|---|---|
| R1, R2 / AC3 | Met | `evidence/verify-gate.txt` case 5: fatal names `src/components/shared/HeroSearchView.tsx`, exit 1 |
| R3 / AC4 (TSX arm) | Met | `evidence/verify-gate.txt` case 6: AgentCtaButton sole input, exit 0, zero runtime-tsx findings |
| R3 / AC4 (module-css arm, before/after) | Met | `evidence/ac4-progress-size-prepost.txt` — real pre-edit script (extracted via `git show 6b43b9676:...`) exits 1 on the identical `--progress-size` plant; post-edit case 7 exits 0 |
| R4, R5 / AC5 | Met | `evidence/ac5-theme-names.txt` — 9 names, sorted set matches §3.2 exactly, contains proof key, excludes `--mantine-color-default-border` |
| R6 / AC6 | Met | `evidence/ac6-fatal.txt` — missing theme.ts fatal; a stub theme.ts producing a proof-key-less set fatal |
| R7, R8 / AC7, AC8 | Met | `evidence/verify-gate.txt` — 10/10 cases pass; case 8 (negative control) exits 1, proving a `--button-`-prefix shortcut would have been caught; `git status --porcelain` after the run shows no plant left behind |
| R9 / AC9 | Met | `evidence/final-gates.txt` — post-edit `check:tailwind-runtime-tokens`/`--report` identical to the §10.0 pre-edit transcript in every field (25 module-CSS, 2 TSX, 0/0/0, exit 0) |
| R10 / AC10 | Met | `docs/design-system.md` §23.7 amended in place; states all four §10.5 items, lists the nine names, cites D65-F 2026-08-26 |
| R11 | Met | `runScan({ themePath })`; every `--verify-gate` case reads a copied `theme.ts`, confirmed by case 10 deleting the copy without touching the real file |
| R12 / AC11 | Met | this session log, backlog updated, status below |
| AC1 | Met | `git diff --stat`: exactly `docs/design-system.md` + `scripts/check-tailwind-runtime-tokens.mjs` |
| AC2 | Met | `TSX_FILES_REL` unchanged: still exactly the two original entries (not touched by this diff) |

## 5. Validation evidence

All commands run natively, exit codes captured unpiped (`$LASTEXITCODE` appended as its own line in
each transcript file).

| Command | Result | Evidence |
|---|---|---|
| `npm run check:tailwind-runtime-tokens` | exit 0 | `evidence/final-gates.txt` |
| `node scripts/check-tailwind-runtime-tokens.mjs --report` | exit 0 | `evidence/final-gates.txt` |
| `npm run check:tailwind-runtime-tokens:verify-gate` | exit 0, 10/10 | `evidence/verify-gate.txt` |
| `npm run check:design-tokens` | exit 0 | `evidence/final-gates.txt` |
| `npm run check:stories` | exit 0 (129 files, 0 violations) | `evidence/final-gates.txt` |
| `npm run typecheck` | exit 0 | `evidence/final-gates.txt` |
| `npm run build` | exit 0 (Next.js 15.5.18, 40/40 static pages) | `evidence/build.log` |
| `node scripts/check-file-integrity.mjs` | exit 0 (11 files clean) | ran natively, not separately captured |
| `git status --porcelain` (final) | ` M docs/design-system.md`, ` M scripts/check-tailwind-runtime-tokens.mjs`, `?? docs/sessions/evidence/task769/` | below |

No screenshot command was run — Q1 Targeted, no rendered code changed, per kickoff §13.

## 6. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-tailwind-runtime-tokens.mjs` | R1–R8, R11: fail-closed TSX inputs, Mantine-theme AST extractor, classifier bucket 3, 10-case verify-gate, header-comment accuracy |
| `docs/design-system.md` | R10: §23.7 amended with the four-bucket model, the closed-TSX-input/fatal-input rules, and the §3.5 comment-stripping boundary |
| `docs/backlog.md` | Concise state update for Task 769 (still 80 lines, no growth) |
| `docs/sessions/2026-08-26-task769-runtime-token-scanner-hardening.md` | This session log |
| `docs/sessions/evidence/task769/**` | Retained validation transcripts (see §5) |

## 7. Assumptions, deviations, limitations

- **A1** confirmed: `typescript@^5` resolves with no new dependency — `extractMantineThemeNames` imports
  nothing beyond the existing `ts` import `scanTsxFile` already uses.
- **A2** confirmed: the nine-name set re-measured identical to §3.2/§10.0 at implementation time
  (`evidence/ac5-theme-names.txt`).
- **Deviation (documentation-only, not a code deviation):** §10.4 case 4 was implemented as a new plant
  rather than a "retained" one — see §1 above. The required observable behavior (exit 1, dynamic-name
  violation, never baseline-suppressible) is met and verified in `evidence/verify-gate.txt`.
- **§3.5 comment-stripping boundary** (kickoff §3.5, §10.5 item 4): now documented in
  `docs/design-system.md` §23.7 — `HeroSearchView.module.css:33`'s `var(--button-padding-x)` inside a
  comment can no longer surface a comment-stripping regression via that name at that site, since the
  name is now `external` regardless. Recorded, not treated as a defect to fix.
- **Pre-existing, out-of-scope:** `node scripts/check-file-integrity.mjs --all` reports 30 stray-BOM
  files under `docs/sessions/evidence/task765/` and one under `task767/`, none touched by this diff and
  predating this session (confirmed: all under directories this task never wrote to, except the BOM my
  own PowerShell `>` redirection introduced into this task's own `task769/*.txt` files, which was found
  and fixed in-session — the default-scope `check:file-integrity` now passes clean on all 11
  git-changed/untracked files this task touches).

## 8. Still-open items not folded into this task (kickoff §5)

Restated as still open, unchanged by this task: Task 767 ledger findings **F5** (JSX spread attributes
are an undocumented blind spot), **F6** (`evaluateTree` reimplements `run()`'s verdict rule), **F7**
(`check:tailwind-runtime-tokens:verify-gate` is registered but appears in no workflow); Task 766 **F1**
(same shape, on the sibling gate). None were touched.

## 9. `git status --porcelain` (final, complete)

```
 M docs/design-system.md
 M scripts/check-tailwind-runtime-tokens.mjs
?? docs/sessions/evidence/task769/
```

(`docs/backlog.md` and this session log are additional record writes made after this status snapshot,
per the standard task-record sequence.)

## 10. Status

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Never self-approved. Sonnet does not run, emit, suggest, or delegate any mutating git command,
including any `git push` form. Review is directed to this file and to `docs/sessions/evidence/task769/`.
