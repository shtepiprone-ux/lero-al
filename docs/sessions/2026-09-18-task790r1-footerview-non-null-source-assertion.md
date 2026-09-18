# Task 790 · Revision 1 — `theme.d69-18` contract check tolerates TypeScript non-null assertions

**Executor:** Sonnet · **Date:** 2026-09-18 · **Kickoff:** [`Sprint_77_kickoff_prompt_Task_790_R1_FooterView_Non_Null_Source_Assertion.md`](../../tasks/Sprints/Sprint_77_kickoff_prompt_Task_790_R1_FooterView_Non_Null_Source_Assertion.md)

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Revision 1)**

## Files changed

| Path | Change |
|---|---|
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` | Added `normalise()` helper (module-level, next to `readSource`) that strips a type-only `!` sitting between an identifier character/`)`/`]` and a following `.`; added its own 8-assertion `describe` block; wired it into the contract loop (`normalise(readSource(file))`) and into the compactTrigger negative check (after comment stripping, before `not.toContain`); updated the header doc comment's point 4(a) to state the normalisation step. Raw-dimension `describe` unchanged — still scans raw `readSource(file)`. |
| `docs/backlog.md` | Row 790: `R1` state cell changed from `📝 KICKOFF FILED` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; Sprint 77 summary sentence updated to match. |
| `tasks/Sprints/Sprint_77_The_Full_Test_Suite_Nobody_Runs.md` | Tasks table, `790 · R1` row: State cell changed to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. |
| `docs/sessions/2026-09-18-task790r1-footerview-non-null-source-assertion.md` | This session log. |
| `docs/sessions/evidence/task790/r1/*` | New evidence transcripts (25 files, listed below). |

`src/components/layout/FooterView.tsx` was temporarily touched by the §10.4 absence-arm probe and restored byte-identical (hash witness below). It is absent from the final `git status --porcelain`.

## Requirements completed

| Req | Proven by | Evidence |
|---|---|---|
| R1 | AC1 | `13-targeted-final.txt` — `FooterView.tsx resolves theme.other.layout.footerGridGap` passes; 0 failed in the file. |
| R2 | AC2 | `13-targeted-final.txt` — all 8 normaliser fixture assertions pass (part of the 63 total). |
| R3 | AC3 | `07-probe-plant.txt`, `09-probe-red-run.txt`, `10-probe-restore.txt`, `08-hash-footer-mid-probe.txt`, `11-hash-footer-post-restore.txt`, `12-git-status-footer-post-restore.txt`. |
| R4 | AC4 | Diff inspected: no `mustContain`/`file`/`contract` value changed; `CONTRACT_CONSUMERS` still has 22 entries; raw-dimension `describe` (now at the same relative position) still calls `scanContent(readSource(file), …)` on unnormalised text; no `.skip`/`.todo`/`it.fails`/`.only` anywhere in the file. |
| R5 | AC5 | Compactrigger check now applies `normalise()` after comment stripping; `13-targeted-final.txt` shows it still passes on the unchanged `MantineTooltip.tsx`. |
| R6 | AC6 | `21-git-status-final.txt` — only the test file and the new evidence directory are listed; no path under `src/` other than the test file. |
| R7 | AC7 | `05-full-suite-i0.txt` (I0 set) vs `14-full-suite-final.txt` (final set) — see "Full suite" below. |
| R8 | AC8 | `15-typecheck.txt`, `16-eslint.txt`, `17-mojibake.txt`, `18-build.txt` — all exit 0. |
| R9 | AC9 | This log's Files Changed table matches `21-git-status-final.txt`; `docs/backlog.md` row 790 and the Sprint 77 `790 · R1` row both now state `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; `docs/backlog.md` is 76 lines (baseline `git show HEAD:docs/backlog.md \| wc -l` = 76, unchanged by this edit). |

## Commands run

All transcripts under `docs/sessions/evidence/task790/r1/` are UTF-8 without BOM **after Revision 1's BOM strip** (see "Revision 1" below — 15 of the original 23 transcripts started with a BOM). Platform, Node version and working directory are recorded once, in `00-platform.txt`. Each transcript's exact command and actual exit code (captured unpiped, exit code appended as its own statement) is recorded in the table below.

| # | Command | Exit | Evidence |
|---|---|---|---|
| I0.1 | `node.exe -p "process.platform + ' ' + process.version"` / `Get-Location` | — | `00-platform.txt` → `win32 v22.22.3`, `C:\Claude_Code_Projects\lero-al` |
| I0.2 | `git --no-optional-locks status --porcelain` (before edit) | 0 | `01-git-status-i0.txt` → clean except the new evidence dir |
| I0.3 | `git hash-object` test file (before edit) | — | `02-hash-test-i0.txt` → `0e23936a3bdd34f8527d3db61ef085575d1a0d5b` |
| I0.4 | `git hash-object` `FooterView.tsx` (before edit) | — | `03-hash-footer-i0.txt` → `69994cd60804ece41c6927ed8b01e66461b88cba` |
| I0.5 | `npx.cmd vitest run <test file>` (before edit) | 1 | `04-targeted-i0.txt` → 1 failed / 54 passed (55) |
| I0.6 | `npx.cmd vitest run` (before edit) | 1 | `05-full-suite-i0.txt` → 3 failed files / 4 failed tests / 86 passed files / 1638 passed tests (89/1642) — this is the I0 failing set |
| 10.4.1 | plant script (Node, `fs.copyFileSync` backup + guarded replace) | 0 | `07-probe-plant.txt` |
| 10.4.2 | `git hash-object` `FooterView.tsx` (mid-probe) | — | `08-hash-footer-mid-probe.txt` → `d930af04be7b5ab714b408788914d925c9fe146d` (differs from I0, as expected) |
| 10.4.3 | `npx.cmd vitest run <test file> -t "FooterView.tsx resolves"` (planted) | 1 | `09-probe-red-run.txt` → 1 failed (the `footerGridGap` test), exactly as required |
| 10.4.4 | restore script (Node, `fs.copyFileSync` from backup) | 0 | `10-probe-restore.txt` |
| 10.4.5 | `git hash-object` `FooterView.tsx` (post-restore) | — | `11-hash-footer-post-restore.txt` → `69994cd60804ece41c6927ed8b01e66461b88cba` (equals pre-probe hash) |
| 10.4.6 | `git status --porcelain -- FooterView.tsx` (post-restore) | 0 | `12-git-status-footer-post-restore.txt` → empty |
| 13.2.1 | `npx.cmd vitest run <test file>` (final) | 0 | `13-targeted-final.txt` → 0 failed / 63 passed |
| 13.2.2 | `npx.cmd vitest run` (final) | 1 | `14-full-suite-final.txt` → 2 failed files / 3 failed tests / 87 passed files / 1647 passed tests (89/1650) |
| 13.2.3 | `npm.cmd run typecheck` | 0 | `15-typecheck.txt` |
| 13.2.4 | `npx.cmd eslint <test file>` | 0 | `16-eslint.txt` |
| 13.2.5 | `npm.cmd run check:mojibake` | 0 | `17-mojibake.txt` → 0 artifacts in 5854 files |
| 13.2.6 | `npm.cmd run build` | 0 | `18-build.txt` |
| 13.2.7 | `git hash-object` test file (final) | — | `19-hash-test-final.txt` → `dc744262ef46d8263dfead87de9657a22791991e` (differs from I0, as expected) |
| 13.2.8 | `git hash-object` `FooterView.tsx` (final) | — | `20-hash-footer-final.txt` → `69994cd60804ece41c6927ed8b01e66461b88cba` (equals I0) |
| 13.2.9 | `git --no-optional-locks status --porcelain` (final) | 0 | `21-git-status-final.txt` → test file modified + new evidence dir only |
| 13.2.10 | `npm.cmd run check:mojibake` (re-run after `docs/backlog.md`, the Sprint file, and this session log were written) | 0 | `22-mojibake-final-all-files.txt` → 0 artifacts in 5860 files |

## Targeted results

`theme.d69-18.test.tsx`: **before** 1 failed / 54 passed (55) → **after** 0 failed / 63 passed (63). 63 = 55 + 8 new normaliser fixture assertions, matching the required total.

## Full suite

**I0 failing set** (4 full test names, from `05-full-suite-i0.txt`):

1. `src/design-system/mantine/__tests__/theme.d69-18.test.tsx > D69-18 §13 consumers — each resolves its named contract (mechanical source check) > src/components/layout/FooterView.tsx resolves theme.other.layout.footerGridGap`
2. `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts > Task 763 — appImageConfig CSS Module wiring > BLOCKED: listing.hoverClass is still the literal Tailwind string (documented, not an oversight)`
3. `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx > ListingCard — vertical branch (Mantine pattern, default) > archived listing renders the archived badge + dimmed card (Task 605 — pattern-owned badges/isArchived)`
4. `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx > ListingCard — horizontal branch (List view, MantineListingCardPattern layout="list", Task 608) > archived listing renders the archived badge + dimmed card`

**Final failing set** (3 full test names, from `14-full-suite-final.txt`): items 2–4 above, unchanged. Item 1 (`FooterView … footerGridGap`) is gone.

**Difference:** exactly item 1 removed; no other change, no new failure. No `UNATTRIBUTED` entries — every failure in the final set was already in the I0 set, so no isolation re-run branch applies this run. (§3.8 non-determinism did not manifest in either run; the failing sets were stable across I0 and final.)

## Probe

- Pre-probe hash: `69994cd60804ece41c6927ed8b01e66461b88cba`
- Mid-probe hash (after plant): `d930af04be7b5ab714b408788914d925c9fe146d`
- Post-restore hash: `69994cd60804ece41c6927ed8b01e66461b88cba` (equals pre-probe)
- Red run transcript: `docs/sessions/evidence/task790/r1/09-probe-red-run.txt`

## Revision 1 (2026-09-18) — evidence-only, per kickoff §16

Review 1 returned `NEEDS REVISION` with two findings against this log and its evidence folder; the implementation
(AC1–AC7) was not reopened.

- **F1 — 15 of the 23 original evidence transcripts started with a UTF-8 BOM (`EF BB BF`)**, which `check:mojibake`
  does not detect. Manifest (15 paths), hashed before and after the strip via Node I/O (`fs.readFileSync` /
  `fs.writeFileSync`, never `Get-Content -Raw`):

  | Path | Hash before | Hash after |
  |---|---|---|
  | `00-platform.txt` | `c56aa1aab6fd677dbc98e31d3926d06c720f3ae6` | `1a5ea695144bf566fa8b17c4829378921a615bbc` |
  | `01-git-status-i0.txt` | `961efe72bdf8526185252645a6c03fd832bfae10` | `3afb07f05591855c0f03ad25f5f76b0801cc0846` |
  | `02-hash-test-i0.txt` | `4923f7b669067c6f8a883da63150b4cce00bbdcd` | `078c7159873f350b2f73eb15e51446fb342d5113` |
  | `03-hash-footer-i0.txt` | `2806b8aa3bd12396d28d2b917236b63cce766052` | `115ba5bec4046510354dc9c0faf09ad89c8bf091` |
  | `04-targeted-i0.txt` | `f28fb4bbdfd71d8561a7ce66569180f3d9445eaf` | `f95e47f0735f514ae7b3ba036239eb9905e05beb` |
  | `05-full-suite-i0.txt` | `38c6b44707c4ec19c4566a5ff35b15c8ed89b53c` | `0ce349fde6366f5a493671b9ccafd2f99c5a28fd` |
  | `06-targeted-after-fix.txt` | `9dca107c9b37f2135f493b8f0f1f86fc0fbf8d4b` | `da11963f4b3e0239b9f24ce53418cf4666f6fb07` |
  | `09-probe-red-run.txt` | `917a0c006ec244829600dd9e395be7be4dab166c` | `f2945045a8647476001ada9079094f3c01cc70bd` |
  | `13-targeted-final.txt` | `ee692e836690774bf936a7cea08d93fa9481d5f9` | `f9ff2d53a194667d0db977015566456dfa0deca1` |
  | `14-full-suite-final.txt` | `3fa1eb7bf3156b091e7fb35f88ec1e5ae9e8bdee` | `82776d1afad21a374e77b9f3b264b0cfaac84501` |
  | `15-typecheck.txt` | `0cb2d3c549160e941adf9661a85686255ef98e76` | `cdd337bc5ed6ed5ba6af438eed9e539efb7f7080` |
  | `16-eslint.txt` | `739e71f8a37f915c57810f74c4b3e3f899471241` | `3799c07fb06236e49d68dc576974267f756761dc` |
  | `17-mojibake.txt` | `ddc248ce9e20635fdb653a743747a51a2db66517` | `462d2471b8239e5b25d0343a1f71cf224f792e75` |
  | `18-build.txt` | `b88572b3f21067e53407494743ad2089a006ce82` | `22001798198c2a1abaa59e4e3777836798213582` |
  | `22-mojibake-final-all-files.txt` | `008798ccc3dda48e3a3b12186b1e824b63740901` | `9e115648c4a87f052da44e7193cc94ed1c4cea87` |

  Preflight confirmed all 15 paths existed and started with `EF BB BF` before any write; the script would have
  printed `SCOPE GUARD FAILED` and written nothing otherwise. For each path the post-strip content was asserted
  equal to the pre-strip content with exactly the first 3 bytes removed. No file outside this manifest was written.
  Strip transcript: `docs/sessions/evidence/task790/r1/24-rev1-bom-strip.txt`.

- **F2 — this log's own claims were contradicted by the evidence.** Corrected: the "Commands run" intro sentence
  (previously claimed every transcript was already BOM-free and self-header-carrying) and the evidence-file count
  (previously stated "21 files"; the folder actually held 23 files at review time, now 25 after this revision's own
  two new transcripts — `23-rev1-bom-and-mojibake.txt` and `24-rev1-bom-strip.txt`).

- **Verification** (§16.4), re-run natively in PowerShell after the strip (the earlier attempt to run it through a
  Node `child_process` wrapper mis-invoked `npm.cmd` and is not the evidence of record): `BOM files: 0` (27 files
  scanned: the evidence folder + this log + the test file), `check:mojibake` exit 0, test file hash
  `dc744262ef46d8263dfead87de9657a22791991e` (unchanged from AC1–AC7's final state), `git status --porcelain` lists
  only this task's write set. Evidence: `docs/sessions/evidence/task790/r1/23-rev1-bom-and-mojibake.txt`.

- No `src/` file was edited, and no capture (`vitest`, `typecheck`, `eslint`, `build`) was re-run, per §16's
  instruction — the test file's hash witness above proves the implementation is unchanged from review 1's basis.
- `docs/backlog.md` row 790 and the Sprint 77 `790 · R1` row are updated to
  `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (Revision 1)`. `docs/backlog.md` remains at 76 lines.

## Assumptions, deviations, limitations, unresolved issues

- No deviation from the kickoff. The regex `/(?<=[\w)\]])!(?=\.)/g` named in §10.2 was used verbatim.
- The comment-only `theme.breakpoints.lg` match for `MantineListingContactPattern` (§3.10) is **untouched** by this revision and still owned by 790's remaining scope — the raw-dimension `describe` and the contract loop's needle list were not changed to strip comments, per §8's out-of-scope list.
- Optional-chaining support was not added (out of scope, §5/§8).
- The non-deterministic failure group (§3.8) did not appear in either the I0 or final full-suite run; both runs were stable at their respective counts.
- `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts`, `ListingCard.smoke.test.tsx` ×2 archived-badge failures, and the full-suite standing-gate decision remain in 790's reserved remaining scope, untouched here.
- No mutating git command was run, suggested or emitted.
