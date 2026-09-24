# Task 812 — A component rendered by an enrolled component, but not itself enrolled, fails the gate

Sprint 75 · **P0** · QA profile **Q4**

## 1. Mode and task type

`IMPLEMENTATION` — governance detector. New static check plus its false-positive boundary, proven with a two-armed
plant. No product UI changes.

## 2. Objective

`check:story-coverage` validates that every component **already in** `scripts/mantine-migration-scope.json` has a
canonical Mantine Story importing it. A component that is **not** in the manifest is never inspected and never
blocks. That is the gate's design, it is correct, and it is also the hole Task 809 fell through: `/favorites` shipped
with `CollectionsSection`, `SaveToCollectionButton` and `FavoritesTypeFilter` rendered on the page, unmigrated,
unenrolled and unstoried, while the gate printed **34/34 green**.

Make that case fail. After this task, a component that an enrolled component **renders** and that is itself neither
enrolled nor deliberately excused causes a non-zero exit, with the offending edge named.

## 3. Verified context — read from source on 2026-09-11, not quoted from the backlog

### 3.1 The gate as it exists

`FACT` — `scripts/check-story-coverage.mjs`, read in full this session. It parses every `src/**/*.stories.tsx` with
the TypeScript AST, keeps those whose `meta.title` satisfies `isCanonicalMantineTitle`
(`scripts/lib/mantine-story-scope.mjs`), resolves each such story's import specifiers to repo-relative paths, and
compares that set against the manifest. Its own header states the blind spot verbatim:

> "component NOT in manifest → out of scope, never checked, never blocking."

`FACT` — the gate already contains the two pieces this task needs, and they must be **reused, not rewritten**:

| Existing function | What it does | Why it matters here |
|---|---|---|
| `resolveImportSpecifier(fromFile, spec)` | resolves `@/*` and relative specifiers, probing `''`, `.tsx`, `.ts`, `/index.tsx`, `/index.ts`; returns a repo-relative POSIX path or `null` for an external package | the exact resolver the new walk needs; extract it to `scripts/lib/` rather than duplicating it |
| `extractImportSpecifiers(sourceFile)` | every `import … from '<spec>'` specifier via AST | same |

`FACT` — `scripts/mantine-migration-scope.json` is a flat JSON array of **38** repo-relative component paths, ending
with the four Task 809 added (`FavoritesShell`, `MantineEmptyLoadingErrorState`, `CollectionsSection`,
`SaveToCollectionButton`, `FavoritesTypeFilter`). The gate currently reports 38 covered / 0 unproven, exit 0.

### 3.2 The rule this detector enforces

`docs/agent-contract.md` **16d**, and its three tiers. The detector implements the census the clause already demands
be run by hand:

- **tier 1** — a feature component rendered by an in-scope surface. Must be migrated, enrolled and storied. **This is
  what the detector flags.**
- **tier 2** — a legacy primitive under `@/components/ui/*` that an enrolled component still imports. The surface must
  stop importing it. **Also flagged**, under its own reason code, because the fix is different (remove the import,
  not enrol the file).
- **tier 3** — a shared component owned by another surface, rendered here but not this task's to migrate. **Must not
  be flagged**, and must not be silently ignored either: it belongs in the allowlist with a reason and the task
  number that owns it.

### 3.3 The plant the backlog names is stale — re-derive it

`CONTRADICTION`, and the executor must not copy it forward. `docs/backlog.md`'s **812** row says the two-armed plant
is *"enrolling `FavoritesShell` while `CollectionsSection` stays out must FAIL, and enrolling both must clear."* That
was true when the row was written. **Task 809 enrolled all four, so that plant can no longer fire.** The runnable
equivalent on the current tree is §10.3's: temporarily **remove** `CollectionsSection.tsx` from the manifest while
`FavoritesShell.tsx` stays in, which reproduces the exact pre-809 topology on a data file that is trivially
restorable with a hash witness.

## 4. Requirements

| ID | Requirement | P | Verified by |
|---|---|---|---|
| **R1** | A detector walks the **enrolled subgraph**: starting from every manifest path, parse the file, resolve each local import, and recurse into resolved files that are themselves enrolled. Every resolved local file at the frontier — imported by an enrolled file, not itself enrolled — is a candidate. | **P0** | AC1 |
| **R2** | A candidate is reported **only if it is actually rendered** by the importing file — its imported local binding appears as a JSX opening-element tag name in that file. A type-only import, a hook, a util, a constant, a context object or a value imported but never placed in JSX is not a rendered component and must not be reported. | **P0** | AC2, AC3 |
| **R3** | Findings carry a reason code: `tier1-unenrolled` for a local feature component, `tier2-legacy-primitive` for anything resolving under `src/components/ui/`. The two are printed separately, because the corrections differ. | P1 | AC1 |
| **R4** | An allowlist file carries the tier-3 exclusions. Every entry requires a **reason string** and an **owning task number**; an entry missing either is itself an error. An entry that no longer matches any real edge is reported as **stale** and fails the gate, in the same shape `check-design-tokens.mjs` already uses for stale markers. **Amended by Revision 1 → R10: tier-3 only — a `src/components/ui/*` path is tier 2 and must be rejected as an invalid entry, never honoured.** | **P0** | AC4-R, AC5, AC11 |
| **R5** | The detector prints its own scope alongside its result — how many enrolled roots it walked, how many edges it resolved, and how many local imports it skipped as non-rendered — so a green line states what it actually inspected. This is Sprint 75's exit criterion 5 in miniature. | P1 | AC6 |
| **R6** | The check is wired into `package.json` and runs in the same CI job as `check:story-coverage`, before `build-storybook`. A detector that is not wired is a proof, not a gate — the defect already recorded against `scripts/task808-key-warning-probe.mjs`. **`package.json` half landed in Revision 0; the CI half is held behind owner decision 3 (§14.6) and executed by Revision 1 → R14.** | **P0** | AC7-R |
| **R7** | Two-armed plant, both arms retained: with `CollectionsSection.tsx` removed from the manifest the gate exits non-zero and names the `FavoritesShell → CollectionsSection` edge; with it restored the gate exits 0, and the manifest's `git hash-object` is identical before the plant and after the restore. **`GR-4 VIOLATION, mine — "with it restored the gate exits 0" is an absolute a correct implementation cannot satisfy on a tree carrying 53 other unresolved edges. Superseded by Revision 1 → R11.`** | **P0** | ~~AC8~~ → AC8-R |
| **R8** | `docs/golden-rules.md`'s **`Enforcement status` table only** is updated: GR-1 and GR-3 move from receipt-only to enforced by this command, and the "812 — not yet built" sentence is replaced by what actually landed. `docs/storybook-governance.md` §15 gains the new gate beside §15's existing description. **This never authorized editing GR-1's `Command` block or any other rule body — that file's own header reserves rule-body changes to a dated owner decision. Revision 0 rewrote it anyway; Revision 1 → R12 corrects that.** | P1 | AC9, AC12 |
| **R9** | `check:story-coverage` itself is **not modified in behaviour**. If the shared resolver is extracted to `scripts/lib/`, that file keeps importing it and its output stays byte-identical for an unchanged tree. | **P0** | AC10 |

## 5. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated)** — the detector is a **new script** (`scripts/check-rendered-scope.mjs`,
  `npm run check:rendered-scope`) rather than a new arm inside `check-story-coverage.mjs`. Reason: the two ask
  different questions (enrolled-has-story vs rendered-is-enrolled), they fail for different reasons, and R9 requires
  the existing gate's output to stay unchanged. Rejected alternative: a `--rendered-scope` flag on the existing
  script, which would couple two failure modes into one exit code.
- **`ASSUMPTION` (reversible, stated)** — the allowlist lives at `scripts/rendered-scope-allowlist.json` as an array
  of `{ path, reason, owner }` objects. Reason: it mirrors the manifest's own hand-maintained, owner-decided shape
  and keeps the two files legible side by side.
- **`UNKNOWN`, and R1's walk is what resolves it** — how many frontier edges exist today across all 38 roots. The
  executor must **measure it first** (§10.1) and report the number before writing the allowlist. Do not assume it is
  only the three tier-3 nodes Task 809 filed as **813**; other enrolled surfaces have their own frontiers.
- **`CONFLICT` to surface, not to resolve alone** — if the measured frontier is large enough that an honest allowlist
  would run to dozens of entries, that is an owner decision about migration sequencing, not an executor judgement.
  Report the census and stop for `BLOCKED — OWNER DECISION REQUIRED` rather than allowlisting in bulk to make the
  gate green.
- **Out of scope:** migrating any component the detector flags · changing `scripts/mantine-migration-scope.json`'s
  membership (except the reversible plant) · the other Sprint 75 tasks · `check-stories-rendered.mjs` ·
  `check-locale-leak.mjs`.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` clauses **9, 13, 16c, 16d in full** · `docs/qa-profiles.md` (Q4) ·
`docs/storybook-governance.md` §15 · `scripts/check-story-coverage.mjs` in full ·
`scripts/lib/mantine-story-scope.mjs` · `scripts/check-design-tokens.mjs` — its stale-marker and missing-reason
handling is the house pattern R4 must follow · this kickoff.

## 7. Current and required behavior

**Before:** `npm run check:story-coverage` exits 0 whenever every manifest entry has a story. A component rendered on
a migrated surface but absent from the manifest is invisible to every gate in the repository.

**After:** `npm run check:rendered-scope` walks the enrolled subgraph and exits non-zero when an enrolled component
renders a local component that is neither enrolled nor allowlisted with a reason and an owner. `check:story-coverage`
behaves exactly as before.

## 8. Positive and negative flows

**Positive:** a developer migrates a surface, enrols it, and forgets one of the components it renders → the new gate
fails in CI, naming the importing file, the rendered component and the tier.

| Negative flow | Applicable | Expected behavior |
|---|---|---|
| Type-only import (`import type { CardListingData }`) | Yes | not reported — R2 |
| Hook / util / constant / context imported and used, never in JSX | Yes | not reported — R2 |
| Component imported and rendered only inside a `.stories.tsx` file | Yes | not reported — stories are not production render paths; the walk starts at manifest roots, which are production components |
| A tier-3 shared component with a valid allowlist entry | Yes | not reported, and counted in the printed scope line |
| An allowlist entry whose edge no longer exists | Yes | **stale** → gate fails |
| An allowlist entry with an empty `reason` or no `owner` | Yes | → gate fails |
| A component re-exported through a barrel (`index.ts`) | **Yes — verify, do not assume** | the resolver already probes `/index.tsx`; confirm whether a barrel hop hides the real file, and say which it reports. Task 809's own `MantineEmptyLoadingErrorState` read as unproven for exactly this reason until its story import was changed from the barrel to the direct path |
| A dynamic import or `React.lazy` | Yes | out of this detector's reach — state it in the printed scope line rather than pretending coverage |
| Circular imports between two enrolled components | Yes | the walk must terminate; keep a visited set |

## 9. Acceptance criteria

- **AC1 [R1, R3]** — Given the current tree with `CollectionsSection.tsx` removed from the manifest, when
  `npm run check:rendered-scope` runs, then it exits non-zero and its output names
  `src/modules/listings/components/FavoritesShell.tsx` → `src/modules/listings/components/CollectionsSection.tsx`
  with reason `tier1-unenrolled`. Quote the line.
- **AC2 [R2]** — Given `FavoritesShell.tsx`, which imports `useFavoritesRealtime`, `useExchangeRate`, `useAuth`,
  `theme` and `type CollectionWithCount` alongside its rendered children, then none of those five appears in the
  output at any severity. Quote the skipped-import count from the scope line and state which of the five it covers.
- **AC3 [R2]** — Given a deliberate probe: add a type-only import of an unenrolled local component to one enrolled
  file, run the gate, observe it is **not** reported; remove the probe and restore the file byte-identically, quoting
  its `git hash-object` before and after and its absence from `git status --porcelain`.
- **AC4 [R4]** — ~~Given an allowlist containing `AppImage`, `ListingFeatureIcon` and `FavoriteButton` with reasons and
  owner **813**, then those three are not reported, and the scope line counts them as allowlisted.~~ **Superseded by AC4-R
  (§14.4). `src/components/ui/AppImage.tsx` is a tier-2 legacy primitive, not a tier-3 shared component; naming it here
  was a task-design defect that put an always-in-scope obligation behind a reason string.**
- **AC5 [R4]** — Given one allowlist entry pointed at a path no enrolled file renders, then the gate fails with a
  stale-entry message naming it. Restore and re-run clean.
- **AC6 [R5]** — The gate's output states, on a passing run, the number of enrolled roots walked, edges resolved,
  non-rendered local imports skipped, allowlisted edges, and the classes it cannot see (dynamic import / `React.lazy`).
- **AC7 [R6]** — `npm run check:rendered-scope` exists in `package.json` and the CI governance job runs it; quote the
  workflow diff hunk.
- **AC8 [R7]** — ~~Both plant arms retained under `docs/sessions/evidence/task812/`, with the manifest's
  `git hash-object` identical before the plant and after the restore.~~ **Superseded by AC8-R (§14.4) — the retained
  restored arm exits 1, and a single retained hash cannot witness "identical before and after".**
- **AC9 [R8]** — `docs/golden-rules.md`'s enforcement table names this command for GR-1 and GR-3 and no longer says
  812 is unbuilt; `docs/storybook-governance.md` §15 describes the new gate.
- **AC10 [R9]** — `npm run check:story-coverage` still prints **38 covered / 0 unproven**, exit 0, on the restored
  tree. Quote it.

**GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.** AC10's `38/0` is a
reproduction of a measured current value on an unchanged tree, not a target a correct implementation could violate.

> **RETRACTED 2026-09-11 by the Revision 0 review — this audit was wrong.** AC8's "the gate exits 0" *is* an absolute,
> and the measured tree makes it unsatisfiable. See §14.2 defect 2 and the corrected audit in §14.4. This is the fifth
> recorded instance of a kickoff's own measured/derived claim being the defect; the receipt was emitted and false,
> which is exactly what `docs/golden-rules.md`'s preamble warns a self-reported receipt can be.

## 10. Verification plan

### 10.1 Measure the frontier first, before writing any allowlist

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
node.exe scripts\check-rendered-scope.mjs --report
```

Expected: `win32`; the Node version; a full listing of every frontier edge with its tier, and the totals from R5.
**Return that listing before proceeding** — it is the input to the §5 `CONFLICT` decision.

### 10.2 Gates

```powershell
npm.cmd run typecheck
npx.cmd eslint scripts/check-rendered-scope.mjs scripts/check-story-coverage.mjs
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: typecheck 0 · eslint 0 errors · `check:story-coverage` **38 covered / 0 unproven** exit 0 ·
~~`check:rendered-scope` exit 0 with its scope line~~ **corrected 2026-09-11: `check:rendered-scope` exits **1** on the
current tree and that is the correct result — the 53 unresolved frontier edges (50 tier-1 + 3 tier-2, measured
`R1_final_gate.txt`) are real. Assert the scope line and the
tier counts, never the exit code, until owner decision 3 (§14.6) resolves the 53-edge frontier** · `check:stories` 0
violations · `build` exit 0 · both hygiene gates clean. **The last two are not optional and are not omitted from this block** — the previous two passes on Task
809 each left a hygiene gate out of the command block and each produced a defect that reached the reviewer.

### 10.3 Two-armed plant

```powershell
git hash-object scripts/mantine-migration-scope.json
```

1. Record that hash. Remove `"src/modules/listings/components/CollectionsSection.tsx"` from the manifest array.
2. `npm.cmd run check:rendered-scope` → must exit non-zero and name the `FavoritesShell → CollectionsSection` edge.
3. Restore the entry.
4. `git hash-object scripts/mantine-migration-scope.json` → must equal step 1's value; `git status --porcelain` must
   not list the manifest.
5. `npm.cmd run check:rendered-scope` → exit 0.

Retain every transcript under `docs/sessions/evidence/task812/`. Write transcripts **without a BOM** — use
`[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or PowerShell 7's
`-Encoding utf8NoBOM`; a plain `>` redirect writes a BOM and `check:file-integrity` rejects `.txt` files that carry
one.

### 10.4 QA profile

**`Q4 Release/Critical Flow`**, because R6 puts a new blocking gate into CI and `docs/qa-profiles.md` requires
planted-violation failure proof for any claimed gate. No rendered UI changes, so no visual matrix and no owner visual
QA is required for this task.

## 11. Completion report contract

Files changed · requirement IDs completed · §10.1's full frontier listing with the totals · the AC1 failure line
quoted · AC2's skipped-import accounting · AC3's and AC8's hashes and `git status --porcelain` results · AC5's stale
message · AC6's scope line · AC7's workflow hunk · AC10's `38/0` · every command with its real exit code and
transcript path · assumptions · deviations · limitations. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED` — and `BLOCKED — OWNER DECISION REQUIRED` if §5's `CONFLICT` fires.

## 12. Task quality gate

| Question | Required answer |
|---|---|
| Does this task migrate anything it flags? | **No.** It measures and reports. Migrations are separate numbered tasks — **813** already owns the three tier-3 nodes. |
| Is the backlog's stated plant used as written? | **No — it is stale and §3.3 says why.** Task 809 enrolled all four components, so the original plant cannot fire; §10.3 reproduces the same topology by removing one manifest entry. |
| Could this gate be satisfied by weakening it? | Yes, by bulk-allowlisting — which is why R4 requires a reason and an owner per entry, fails on a stale entry, and §5 sends a large frontier to the owner instead of the allowlist. |
| Does it change `check:story-coverage`'s behaviour? | No — R9/AC10. A shared resolver may be extracted; the output must stay identical. |
| Are the hygiene gates in the command block? | Yes — §10.2, deliberately, after two consecutive Task 809 passes where their omission from my own block produced a defect. |

## 13. Git handoff — task design, Revision 0 (owner-run, do not execute) — **already committed**

```powershell
git add "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "tasks/Archive/Sprint_75_kickoff_prompt_Task_812_Rendered_But_Unenrolled_Component_Detector.md" "docs/backlog.md"
git commit -m "docs(Task812): Sprint 75 opened - the gates that report green on what they cannot see; 812 kickoff filed"
```

Revision 1's own handoff is §15.

---

## 14. Revision 1 — 2026-09-11

Task 812 state: **`APPROVED`** (Opus, 2026-09-11). **R1-R20 verified.** R20 was closed by the owner directly:
`docs/golden-rules.md:92` now reads "13 allowlist entries … 11 shared `design-system/mantine/patterns/*` paths (owner
decision 1, Task 816) and 2 Task 813 feature paths. Together they cover 27 rendered edges; the pattern cluster accounts
for 11 paths and 23 edges", which reconciles line-for-line with the allowlist file (13 entries, 11 + 2) and with
`R2_final_report.txt`'s `Allowlisted edges (tier3, owner-filed): 27` / `allowlisted (27)`. GR-1's `Command` block is
byte-identical and no other row changed. Archived in `docs/backlog-archive.md` on 2026-09-11; Tasks **816**, **817**
and **818** carry the work this task deliberately did not close.
A sixth task-design defect was found while recording those decisions: §14.6's own pattern-cluster census was wrong.
See §14.2 defect 6.

### 14.1 Re-entry mode and preserved artifacts

**Re-entry mode: `remediation`.** Do not rebuild the detector, re-extract `scripts/lib/import-resolver.mjs`, re-run
the resolver refactor of `scripts/check-story-coverage.mjs`, or re-derive the frontier as a fresh measurement.

**Forbidden re-runs — these files must not be overwritten, they are the only record of a state that no longer
exists:**

| Artifact | Why it is irreplaceable |
|---|---|
| `docs/sessions/evidence/task812/10.1_report.txt` | the frontier as measured **before any allowlist existed**: `tier1-unenrolled (54)`, `tier2-legacy-primitive (3)`, `Allowlisted edges … 0` |
| `docs/sessions/evidence/task812/AC1_plant_arm1.txt` | the original arm-1 fire |
| `docs/sessions/evidence/task812/AC1_plant_arm2_restored_report.txt` | the original restored-arm report |
| `docs/sessions/evidence/task812/AC3_probe_report.txt` | the type-only probe run, edges `253` / skipped `156` |
| `docs/sessions/evidence/task812/AC4_gate_with_allowlist.txt` | the **defective** state (`tier2-legacy-primitive (1)`) that the R10 finding rests on; deleting it destroys the proof that the defect was real |

Every Revision 1 transcript is written under `docs/sessions/evidence/task812/` with an `R1_` prefix, BOM-free.

**Superseded within Revision 1, recorded so no later session cites a stale reading.** Revision 1 ran in two passes
(R10-R12, then R13/R15) and the second pass reused the `R1_final_*` names. `R1_final_gate.txt` was 7 915 bytes at the
first pass and is 7 994 bytes now; only the current set — captured on the post-R13 tree — is AC14 evidence. The
first-pass artifacts that keep their own names (`R1_10.1_report_corrected_allowlist.txt`, `R1_tier2_invalid_probe.txt`,
`R1_AC5_reprobe.txt`, `R1_AC1_manifest_witness.txt`, `R1_AC3_favoritesshell_witness.txt`) are **not** superseded: they
carry AC4-R, AC11 and AC8-R and must not be overwritten either.

### 14.2 Confirmed defects from the Revision 0 review

1. **The allowlist accepted a tier-2 path.** `scripts/rendered-scope-allowlist.json` carried
   `src/components/ui/AppImage.tsx` with owner `813`. `agent-contract` **16d** tier 2 says the surface must *stop
   importing* a `@/components/ui/*` primitive — an obligation that is always in scope and that no reason string may
   excuse. Measured effect: `tier2-legacy-primitive` read **1** in `AC4_gate_with_allowlist.txt` against **3** in the
   unallowlisted census. Origin: the Revision 0 kickoff's own AC4 named `AppImage` as a tier-3 seed. My defect.
   → **R10 / AC4-R / AC11**.
2. **R7 asserted an absolute.** "with it restored the gate exits 0" cannot hold on a tree carrying 53 other
   unresolved edges, and `AC1_plant_arm2_restored_gate.txt` ends `EXIT_CODE=1`. Both arms additionally print
   `FAIL 50 tier1-unenrolled`, so neither the exit code nor the counts discriminate — only the named edge does.
   `GR-4` violation in my own kickoff. → **R11 / AC8-R**.
3. **Restore witnesses were single-valued.** `AC1_plant_restore_hash.txt` and `AC3_restore_hash.txt` each held one
   40-character hash and no `git status --porcelain` output, so "identical before and after" was asserted, not
   witnessed. → **R11 / AC8-R**.
4. **R8's scope was not stated, and `docs/golden-rules.md`'s rule body was rewritten.** R8 authorized the
   `Enforcement status` table; Revision 0 also replaced GR-1's **`Command`** block with the whole-manifest walk. That
   walk covers only enrolled roots, so a surface mid-migration — the Task 809 topology GR-1 exists for — is never
   censused by it, and it emits edge counts rather than the per-surface tier1/tier2/tier3 node counts GR-1's receipt
   line requires. The file's header reserves rule-body changes to an owner decision quoted with its date.
   → **R12 / AC12**.
5. **R6's CI instruction is internally unsatisfiable** — see §14.5. Discovered while writing this revision.
6. **§14.6's own census of the pattern cluster was wrong — the seventh time a kickoff's own measured fact has been
   the defect.** It said "10 of the 50 `tier1-unenrolled` edges" and then listed 10 component **names**, conflating
   paths with edges and omitting `MantinePagination` entirely. Re-measured from `R1_final_report.txt` on 2026-09-11:
   **11 paths across 23 edges.** The owner caught it and supplied the correct list before selecting option 1a.
   Corrected in §14.6; the per-path edge counts are now printed so the next reader cannot repeat the conflation.
7. **The same paths-vs-edges conflation was then reproduced inside `docs/golden-rules.md` by R19 — third occurrence
   in this task, and this time in the receipt-enforced file.** The GR-1 `Enforcement status` row reads "13 of the
   measured edges (the shared `design-system/mantine/patterns/*` cluster, owner decision 1, Task 816) are
   allowlisted". **13 is the allowlist's *entry* count** (11 owned by 816 plus the 2 pre-existing owned by 813), not
   an edge count, and it attributes all 13 to the pattern cluster. The measured figures are: 11 pattern paths, 23
   pattern edges, **27 allowlisted edges in total** — which is what the gate's own scope line prints. Everything else
   in that row is accurate. → **R20 / AC18**.

### 14.3 Revision 1 requirements

| ID | Requirement | P | State | Verified by |
|---|---|---|---|---|
| **R10** | The allowlist is a **tier-3 mechanism only**. An entry whose `path` starts with `src/components/ui/` is an **invalid entry**: the gate prints it in its own `FAIL` block, exits non-zero, and **does not honour it** — the edge is still counted and printed under `tier2-legacy-primitive`. An invalid entry is reported as invalid, never as *stale*. `src/components/ui/AppImage.tsx` is removed from `scripts/rendered-scope-allowlist.json`. | **P0** | **DONE** | AC4-R, AC11 |
| **R11** | The two-armed plant asserts the **clearing of one named edge**, never an exit code: `src/modules/listings/components/FavoritesShell.tsx -> src/modules/listings/components/CollectionsSection.tsx  [tier1-unenrolled]` is present in the de-enrolled arm and absent from the restored arm. Each restore witness is **one** retained transcript carrying the `git hash-object` value before, the same value after, and the explicit `git status --porcelain -- <path>` output. Binds the manifest plant and the `FavoritesShell.tsx` type-only probe alike. | **P0** | **DONE** | AC8-R |
| **R12** | `docs/golden-rules.md` GR-1's **`Command`** block is restored verbatim to its pre-812 per-surface form. Only the `Enforcement status` table and the closing paragraph — R8's real scope — may carry 812's result. | **P0** | **DONE** | AC12 |
| **R13** | `scripts/check-rendered-scope.mjs` drops the two imports it never uses (`statSync` at `:41`, `extractImportSpecifiers` at `:45`). The phrase "one entry per edge" is corrected in both places it appears — `scripts/check-rendered-scope.mjs:21` and `docs/storybook-governance.md:2501` — to the implemented semantics: the allowlist is **keyed by path**, so one entry excuses every call site of that component and remains non-stale while any single edge to it survives. | P1 | **DONE** 2026-09-11 | AC13 |
| **R14** | `check:rendered-scope` is placed in `.github/workflows/governance-pr.yml` in the form §14.6.4 selected: a step in the **`governance`** job, immediately after `npm run check:story-coverage`, with step-level `continue-on-error: true`, the script's real exit code preserved and its full report printed in the job log. §14.5 states the placement conflict this resolves. | **P0** | **DONE** 2026-09-11 | AC7-R |
| **R16** | Eleven **literal** allowlist entries are added to `scripts/rendered-scope-allowlist.json`, one per path in §14.6.1's table, each with a durable `reason` and `owner` `"816"`. No glob, prefix, directory rule, or new suppression mechanism in `check-rendered-scope.mjs` — the detector's logic is not touched. No non-pattern tier-1 path and no tier-2 `src/components/ui/*` path is added. | **P0** | **DONE** 2026-09-11 | AC15 |
| **R17** | After R16, the measured census is `tier1-unenrolled` **27** across the 20 non-pattern paths §14.6.2 lists, `tier2-legacy-primitive` **3**, `Allowlisted edges (tier3, owner-filed)` **27**, and `check:rendered-scope` still exits **1**. R10/AC11's tier-2 rejection still fires. | **P0** | **DONE** 2026-09-11 | AC15, AC16 |
| **R18** | No artifact this task writes or edits states or implies that GR-1 or GR-3 is enforced, that R6's blocking condition is met, or that `check:rendered-scope` is GR-1's compliance command. `docs/golden-rules.md` GR-1's `Command` block is not touched again (§14.6.3). | **P0** | **DONE** 2026-09-11 | AC17 |
| **R20** | `docs/golden-rules.md`'s GR-1 `Enforcement status` row states allowlist figures that match the gate's own scope line: **11** pattern paths / **23** pattern edges owned by Task 816, and **27** allowlisted edges in total across 13 entries. No sentence in that row equates an entry count with an edge count. Nothing else in the row or in the file changes, and GR-1's `Command` block stays untouched. | **P0** | **DONE** 2026-09-11 — closed by the owner directly | AC18 |
| **R19** | `docs/golden-rules.md`'s **`Enforcement status` table only** — R8's authorized scope, and nothing else in that file — is corrected: the GR-1 row no longer says CI wiring is `BLOCKED — OWNER DECISION REQUIRED pending a sequencing call`, and instead records the 2026-09-11 decision, the advisory `continue-on-error` step, that GR-1 and GR-3 remain **receipt-only / not enforced**, and that enforcement is gated on Tasks 817 and 818. | P1 | **DONE** 2026-09-11 | AC17 |
| **R15** | The Revision 1 gate evidence is completed on the final tree. `scripts/check-rendered-scope.mjs` changed after Revision 0's build transcript was captured, so that transcript is stale for this diff: `agent-contract` clause **9** requires a current `npm run build` exit 0, and no `R1_` build or eslint transcript exists. Re-run the full §10.2 block with `R1_final_` names. | **P0** | **DONE** 2026-09-11 | AC14 |

### 14.4 Revision 1 acceptance criteria

- **AC4-R [R4, R10]** — Given `scripts/rendered-scope-allowlist.json` holding exactly
  `src/modules/listings/components/ListingFeatureIcon.tsx` and `src/modules/listings/components/FavoriteButton.tsx`,
  each with a non-empty `reason` and `owner` `813`, when `node.exe scripts\check-rendered-scope.mjs --report` runs,
  then neither path appears in a tier block, the scope line reads `Allowlisted edges (tier3, owner-filed): 4`, and
  the report prints `tier1-unenrolled (50)` and `tier2-legacy-primitive (3)`.
  **Status: `VERIFIED`** — `R1_10.1_report_corrected_allowlist.txt`, `EXIT_CODE=0`.
- **AC11 [R10]** — Given `{"path": "src/components/ui/AppImage.tsx", "reason": "…", "owner": "813"}` present in the
  allowlist, when `npm run check:rendered-scope` runs, then **both** of the following hold in the same transcript:
  it prints `FAIL  1 invalid rendered-scope-allowlist.json entry(ies) — a src/components/ui/* (tier-2) path is never
  a valid allowlist entry:` naming that path, **and** the `tier2-legacy-primitive` block still reports **3** edges.
  Refusing the entry without still reporting its edges fails this criterion, and so does reporting the entry as
  *stale*. Remove the entry and re-run.
  **Status: `VERIFIED`** — `R1_tier2_invalid_probe.txt` lines 10 and 68, `EXIT_CODE=1`.
- **AC8-R [R7, R11]** — Given one retained transcript per restore, then: the manifest witness carries
  `9fdc9303c89d98d5e82f28e5ededb16f803924a3` before the plant and after the restore, an explicit empty
  `git status --porcelain -- scripts/mantine-migration-scope.json`, the planted
  `FavoritesShell.tsx -> CollectionsSection.tsx` edge in arm 1, and **zero** occurrences of that edge in arm 2; and
  the probe witness carries `087c45c5886c2d46645aef11f9ece4fe14a4a3f0` before and after with its own empty porcelain
  line. **Do not assert either arm's exit code** — both are 1 while the frontier is unresolved.
  **Status: `VERIFIED`** — `R1_AC1_manifest_witness.txt`, `R1_AC3_favoritesshell_witness.txt`.
- **AC12 [R8, R12]** — Given `docs/golden-rules.md` read after the change, then GR-1's `Command` block is the
  per-surface form (`$surface = "…"` plus `node.exe scripts\check-surface-census.mjs --surface $surface`) and no
  longer the whole-manifest walk, while the `Enforcement status` GR-1 row still names `check:rendered-scope` and its
  actual state. **Status: `VERIFIED`** — `docs/golden-rules.md:24-29` and `:92`.
  **Consequence this revision records rather than hides:** `scripts/check-surface-census.mjs` does not exist in
  `scripts/`, so GR-1's restored command is not runnable today. That is a real, pre-existing GR-1 defect, it is
  §14.6 decision 2, and it is not resolved by reverting the block.
- **AC13 [R13]** — Given `node.exe --check scripts/check-rendered-scope.mjs` and a read of that file's header and of
  `docs/storybook-governance.md` §15.5, then no unused import remains and neither text claims "one entry per edge";
  both state path-keying and its consequence for staleness.
  **Status: `VERIFIED`** — `scripts/check-rendered-scope.mjs:43,47` now import only `{ readFileSync, existsSync }` and
  `{ resolveImportSpecifier as resolveImportSpecifierShared }`; `grep "statSync|extractImportSpecifiers"` returns zero
  hits, and `grep "one entry per edge"` returns zero hits across both files. The script header (`:20-27`) and
  `docs/storybook-governance.md:2501` both now read "keyed by component path, not by edge — one entry excuses every
  importing/rendering call site of that component, and stays non-stale as long as at least one such edge still
  exists", and §15.5 additionally states the tier-3-only rule as its own failure category.
  **`NOTE` on the parse check:** no standalone `node --check` transcript was retained. The property is closed twice
  over instead — `R1_final_file-integrity.txt` passes 59 files through `check-file-integrity.mjs`'s own `node --check`
  arm (the changed script among them), and `R1_final_gate.txt` shows the script executing, which an unparseable file
  cannot do. Accepted as equivalent evidence; a future criterion of this shape should name the closing artifact rather
  than the command.
- **AC7-R [R6, R14]** — Given `.github/workflows/governance-pr.yml` read after the change, then the `governance` job
  contains a step running `npm run check:rendered-scope` positioned immediately after the
  `run: npm run check:story-coverage` step, carrying `continue-on-error: true` **on the step**, with no `|| true`, no
  `exit 0`, no `set +e` and no other wrapper between the runner and the script. Quote the hunk together with the job
  name and the two neighbouring steps. A silent omission fails this criterion; that is the
  `scripts/task808-key-warning-probe.mjs` defect R6 was written against.
  **Status: `VERIFIED`** — `.github/workflows/governance-pr.yml:121-123`, inside the `governance` job, directly after
  the `Story coverage gate` step at `:118-119`: `run: npm run check:rendered-scope` with `continue-on-error: true` on
  the step and no wrapper of any kind.
- **AC15 [R16, R17]** — Given `scripts/rendered-scope-allowlist.json` after the change, then it holds exactly 13
  entries: the 2 existing `owner 813` entries unchanged, plus the 11 of §14.6.1, each with a non-empty `reason` and
  `owner` `"816"`, and every `path` matching §14.6.1's table character for character. `git diff` on
  `scripts/check-rendered-scope.mjs` is **empty** for this requirement — the detector is not modified. Then
  `npm run check:rendered-scope:report` prints `tier1-unenrolled (27)`, `tier2-legacy-primitive (3)` and
  `allowlisted (27)`, and lists no `src/design-system/mantine/patterns/` path under `tier1-unenrolled`.
  **Status: `VERIFIED`** — the allowlist holds 13 entries, 11 with `owner "816"` and the 2 pre-existing `813` ones, no
  glob or wildcard in any `path`, no `src/components/ui/` path; `R2_final_report.txt` prints exactly those three counts
  and its `tier1-unenrolled` block contains **zero** `design-system/mantine/patterns/` lines;
  `scripts/check-rendered-scope.mjs` is unmodified (mtime unchanged since the R13 pass) and its only path-prefix rule
  is still the pre-existing `TIER2_PREFIX`.
- **AC16 [R17, R10]** — Given the post-R16 tree, when the AC11 probe is repeated — `src/components/ui/AppImage.tsx`
  temporarily added to the allowlist — then the gate still prints the invalid-entry `FAIL` naming that path **and**
  still reports `tier2-legacy-primitive` **3**; and `npm run check:rendered-scope` still exits **1** on the clean
  post-R16 tree, because the 27 non-pattern tier-1 edges and 3 tier-2 edges remain. Remove the probe entry and re-run.
  **Status: `VERIFIED`** — `R2_AC16_reprobe.txt`: `FAIL  1 invalid rendered-scope-allowlist.json entry(ies)` naming
  `src/components/ui/AppImage.tsx` at line 10, `FAIL  3 tier2-legacy-primitive import(s)` at line 45, `EXIT_CODE=1`;
  the clean post-R16 run (`R2_final_gate.txt`) is `27 / 3`, `EXIT_CODE=1`.
- **AC17 [R18, R19]** — Given `docs/golden-rules.md` read after the change, then its GR-1 `Command` block is
  byte-identical to its pre-change content, its `Enforcement status` GR-1 row records the 2026-09-11 advisory decision
  and names Tasks 817 and 818 as the enforcement gate, and the words "enforced" / "blocking" appear nowhere in that
  row as a claim about GR-1 or GR-3's current state; and `grep -rn "R6 .*complete\|GR-1 .*enforced\|GR-3 .*enforced"`
  across the files this task changed returns no such claim.
  **Status: `VERIFIED`** — GR-1's `Command` block at `docs/golden-rules.md:24-29` is byte-identical to its pre-change
  content; the `Enforcement status` GR-1 row records the advisory decision and names Tasks 817 and 818 as the gate;
  the GR-3 row reads "not enforced — gated on Tasks 817 and 818". The executor disclosed that the literal grep matches
  five lines: all five are negations ("still receipt-only, not enforced", "not yet blocking", "no artifact may describe
  this as … enforced"), none an affirmative claim. Disclosure accepted; the criterion's observable property holds.
- **AC14 [R15]** — Given the final Revision 1 tree, then `R1_final_typecheck.txt`, `R1_final_eslint.txt`,
  `R1_final_story-coverage.txt`, `R1_final_gate.txt`, `R1_final_stories.txt`, `R1_final_build.txt`,
  `R1_final_file-integrity.txt` and `R1_final_mojibake.txt` all exist, are BOM-free, and record `win32`, the Node
  version, the exact command and the real exit code; `build` exits 0; `check:story-coverage` prints
  `38 covered / 0 unproven` exit 0; `check:rendered-scope` exits 1 with `tier1-unenrolled (50)` and
  `tier2-legacy-primitive (3)`.
  **Status: `VERIFIED`** — all eight exist plus `R1_final_env.txt`, `R1_final_report.txt` and
  `R1_final_git_status.txt`; every one is BOM-free (byte-checked, not inferred from `check:file-integrity`);
  `R1_final_env.txt` records `win32` / `v22.22.3`; transcripts carry `C:\Claude_Code_Projects\lero-al\…` paths and an
  explicit `EXIT_CODE=` line. Results: typecheck 0 · eslint `0 errors, 3 warnings` (the repo-wide `scripts/` ignore
  pattern) exit 0 · `check:story-coverage` `38 covered / 0 unproven` exit 0 · `check:rendered-scope` exit 1 with
  `tier1-unenrolled (50)`, `tier2-legacy-primitive (3)`, `Allowlisted edges … 4` — unchanged by R13, which is the
  correct outcome for a wording-and-imports fix · `check:stories` 144 files / 0 violations · `build`
  `✓ Compiled successfully in 60s`, exit 0 · `check:file-integrity` 59 files clean · `check:mojibake` 0 artifacts in
  4258 files.
- **AC18 [R20]** — Given `docs/golden-rules.md`'s GR-1 `Enforcement status` row read after the change, then it names
  **11** paths and **23** edges for the Task 816 pattern cluster and **27** allowlisted edges in total, the number
  `13` appears only if explicitly labelled as allowlist *entries*, and the figures reconcile line-for-line with
  `docs/sessions/evidence/task812/R2_final_report.txt`'s `Allowlisted edges (tier3, owner-filed): 27` and
  `allowlisted (27)`. GR-1's `Command` block is byte-identical and no other row changes. Quote the corrected sentence
  and the scope line it reconciles with.
  **Status: `VERIFIED`** — `docs/golden-rules.md:92` read 2026-09-11 after the owner's own fix; figures reconcile with
  `scripts/rendered-scope-allowlist.json` (13 entries: 11 owner `816`, 2 owner `813`) and with
  `R2_final_report.txt`'s `Allowlisted edges (tier3, owner-filed): 27` and `allowlisted (27)`; GR-1's `Command` block
  byte-identical at `:24-29`.
- **AC10 carried forward unchanged** and re-proven by AC14's `R1_final_story-coverage.txt`.

**GR-4 AC AUDIT — 12 criteria (AC4-R, AC11, AC8-R, AC12, AC13, AC14, AC7-R, AC15, AC16, AC17, AC18, and AC10
carried forward); each states an observable property; absolutes: none.** AC15's "`git diff` is empty for
`scripts/check-rendered-scope.mjs`" is scoped to one named file that this requirement deliberately does not touch, so
it is an assertion about this change's boundary, not a global invariant a correct implementation could violate;
AC17's "byte-identical" is scoped the same way to a block §14.6.3 forbids editing. AC8-R's "zero occurrences" is scoped to one named edge string in one named transcript,
which is an observable property of that artifact, not a global invariant a correct implementation could violate.

### 14.5 The CI placement conflict R14 must resolve

`FACT`, read from `.github/workflows/governance-pr.yml` on 2026-09-11: R6's wording — *"runs in the same CI job as
`check:story-coverage`, before `build-storybook`"* — names two different jobs and cannot be satisfied as one
instruction.

| Job | Line | Relevant step |
|---|---|---|
| `governance` (`Governance Check`) | `:119` | `run: npm run check:story-coverage` — this job never runs `build-storybook` |
| `homepage-grid` (`Homepage Grid Validation`) | `:175` | `run: npm run build-storybook` |
| `locale-leak` (`Locale Leak Detection`) | `:205` | `run: npm run build-storybook` |

`check:rendered-scope` is a static AST walk: it needs no Storybook build and no browser, so `governance` beside
`check:story-coverage` is the placement that matches its cost and its subject. R6's "before `build-storybook`" clause
is dropped as a task-design error, not silently reinterpreted. R14 implements the `governance` placement **in the
mode §14.6 decision 3 selects**; it does not choose the mode.

### 14.6 OWNER DECISIONS - ANSWERED 2026-09-11

This section was `STOP - OWNER DECISION REQUIRED`. All three decisions were answered by the owner on **2026-09-11**
and are quoted verbatim below; the same text is recorded in
`tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md` per `agent-contract` 16d, which
requires the sprint file to carry the dated decision. No option here may be widened, narrowed or re-selected by an
executor or a reviewer.

#### 14.6.1 The corrected pattern-cluster census — measured, not quoted

`FACT`, re-measured from `docs/sessions/evidence/task812/R1_final_report.txt` on 2026-09-11. The earlier text in this
section said "10 edges" and listed 10 names; both were wrong. **11 target paths across 23 rendered edges**, and this
table is the authoritative list decision 1 binds:

| # | Target path | Rendered edges |
|---|---|---|
| 1 | `src/design-system/mantine/patterns/MantineCombobox.tsx` | 4 |
| 2 | `src/design-system/mantine/patterns/MantineCopyIdButton.tsx` | 1 |
| 3 | `src/design-system/mantine/patterns/MantineCountButton.tsx` | 4 |
| 4 | `src/design-system/mantine/patterns/MantineDrawer.tsx` | 4 |
| 5 | `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` | 1 |
| 6 | `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | 1 |
| 7 | `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | 1 |
| 8 | `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | 1 |
| 9 | `src/design-system/mantine/patterns/MantineModal.tsx` | 3 |
| 10 | `src/design-system/mantine/patterns/MantinePagination.tsx` | 1 |
| 11 | `src/design-system/mantine/patterns/RangeDatePicker.tsx` | 2 |
| | **Total** | **23** |

**Freshness rule:** this is a measured value that can drift. Re-run `npm run check:rendered-scope:report` at execution
and reconcile against this table before writing the allowlist. If a path has appeared or disappeared, stop and report
it — do not silently widen the list, because decision 1 binds *these* paths.

#### 14.6.2 Decision 1 — 1a, systematic tier-3 for the shared Mantine-pattern cluster

> **Decision 1 — select 1a, systematic tier-3 for the shared Mantine-pattern cluster.**
>
> The current live census, not the stale "10 edges" text in §14.6, is authoritative. Correct §14.6 first: it currently
> contains 11 pattern target paths across 23 rendered edges:
> MantineCombobox, MantineCopyIdButton, MantineCountButton, MantineDrawer,
> MantineDropdownMenu, MantineListingCardPattern, MantineListingContactPattern,
> MantineListingDetailPattern, MantineModal, MantinePagination, RangeDatePicker.
>
> These are shared design-system components with canonical Stories; classify them as tier 3. Add one literal allowlist
> entry per path — no directory rule, glob, prefix suppression, or broad exemption. Each entry needs a durable reason
> and owner Task 816. File Task 816 in the same state update as the design-system-pattern ownership/audit task. It owns
> future changes to this path list and must re-measure it whenever a listed pattern changes.
>
> This does not authorize allowlisting any non-pattern tier-1 target or any tier-2 `src/components/ui/*` path.
> AppImage and PasswordRequirementsHint remain tier 2.

Binding consequences, stated so they cannot be read loosely:

- **Eleven literal `{ "path": …, "reason": …, "owner": "816" }` entries.** No glob, no prefix, no directory rule, no
  new suppression mechanism in `check-rendered-scope.mjs`. A code change that makes the detector treat
  `src/design-system/mantine/patterns/` as a class is **out of scope and forbidden** — it would recreate the
  broad-exemption failure R10 exists to stop.
- **The 20 non-pattern tier-1 paths stay tier 1** (27 edges): `CaptchaWidget`, `FilterChoiceGroup`,
  `FilterRangeInputs`, `FilterRoomsRow`, `LocaleSwitcher`, `MapWrapper`, `PhoneField`, `PropertyTypeCombobox`,
  `ViewAllLink`, `YearCombobox`, `GalleryIsland`, `GalleryStaticFrame`, `ListingInquiryDialog`, `ListingReportDialog`,
  `ListingShareButton`, `ListingsActionRow`, `RecentlyViewedSection`, `RecentlyViewedTracker`, `SimilarListings`,
  `ViewTracker`. None of them may be allowlisted by this task.
- **The 3 tier-2 edges stay tier 2** and are untouched: `ListingCard -> AppImage`,
  `PopularLocationsView -> AppImage`, `AuthSheet -> PasswordRequirementsHint`. R10/AC11 continue to reject any attempt
  to allowlist them.
- **Ownership of the remaining tier-1/tier-2 frontier is not settled by this decision.** The owner assigned Task 816
  to the pattern cluster only. The 20 non-pattern tier-1 paths and the 3 tier-2 edges remain unowned frontier and are
  what Task 818 must either clear or baseline (§14.6.4).

#### 14.6.3 Decision 2 — 2a, build the real per-surface GR-1 command

> **Decision 2 — select 2a, build the real per-surface GR-1 command.**
>
> File Task 817 to implement `scripts/check-surface-census.mjs --surface <path>`. It must produce GR-1's per-surface
> receipt for an enrolled or unenrolled surface, so it detects the exact pre-enrolment blind spot that
> `check:rendered-scope` cannot see. It needs a two-armed plant and must run against FavoritesShell.
>
> Do not replace GR-1 with the whole-manifest walk and do not downgrade it to the manual Select-String procedure.
> Until Task 817 is approved, GR-1 remains receipt-only; Task 812's whole-manifest detector is complementary, not its
> replacement.

Binding consequence for this task: `docs/golden-rules.md` GR-1's **`Command`** block stays exactly as R12 restored it.
Task 812 may not touch it again, and no text in this repository may describe `check:rendered-scope` as GR-1's
compliance command.

#### 14.6.4 Decision 3 — 3a, temporary advisory rollout with a mandatory enforcement exit

> **Decision 3 — select 3a as a temporary, observable rollout with a mandatory enforcement exit.**
>
> Wire `npm run check:rendered-scope` into the existing `governance` job immediately after `check:story-coverage`,
> with step-level `continue-on-error: true`. Preserve the script's real exit code and print its full report in the job
> log. It is advisory visibility only: do not mark GR-1/GR-3 enforced and do not claim R6's original blocking
> condition is complete.
>
> In the same response, file Task 818 to make the rollout blocking safely: it must either reduce the reviewed frontier
> to zero or add a versioned, path-level fail-on-new baseline comparator with a planted new-edge proof. On Task 818
> approval, remove `continue-on-error` and make the governance step blocking/required. The advisory mode has no
> indefinite exemption.

Binding consequences:

- The step goes in the `governance` job (`.github/workflows/governance-pr.yml`), immediately after the
  `npm run check:story-coverage` step. §14.5 explains why `governance` and not a `build-storybook` job.
- `continue-on-error: true` is set **at step level only**. Do not set it on the job, and do not add `|| true`,
  `exit 0`, or any wrapper that hides the script's real exit code — the decision requires the real code preserved and
  the full report printed.
- Advisory means advisory: R6's original blocking condition is **not** complete, and no artifact may say GR-1 or GR-3
  is enforced. R19 fixes the one place that currently implies otherwise.
- The advisory mode expires on Task 818's approval; 818 is filed now, not later.

#### 14.6.5 Tasks filed by these decisions

Filed in the same state update as this revision — `docs/backlog.md` and the Sprint 75 Tasks table. Each needs its own
kickoff before execution; none of them is executable from this file.

| Task | Owner decision | Scope as the owner stated it |
|---|---|---|
| **816** | 1 | Design-system-pattern ownership/audit. Owns the 11-path list in §14.6.1 and re-measures it whenever a listed pattern changes. |
| **817** | 2 | Implement `scripts/check-surface-census.mjs --surface <path>` producing GR-1's per-surface receipt for an enrolled **or unenrolled** surface; two-armed plant; runs against `FavoritesShell`. |
| **818** | 3 | Make the advisory rollout blocking: reduce the reviewed frontier to zero, **or** add a versioned path-level fail-on-new baseline comparator with a planted new-edge proof; then remove `continue-on-error`. |

### 14.7 Revision 1 verification plan

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --short
node.exe --check scripts/check-rendered-scope.mjs
npm.cmd run typecheck
npx.cmd eslint scripts/check-rendered-scope.mjs scripts/check-story-coverage.mjs scripts/lib/import-resolver.mjs
npm.cmd run check:story-coverage
node.exe scripts\check-rendered-scope.mjs --report
npm.cmd run check:rendered-scope
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected **before R16** (the state R13/R15 left, already captured in `R1_final_*`): `win32` · `v22.22.3` ·
`--check` silent, exit 0 · typecheck 0 · eslint 0 errors · coverage `38 covered / 0 unproven` exit 0 · the report
prints `tier1-unenrolled (50)`, `tier2-legacy-primitive (3)`, `Allowlisted edges (tier3, owner-filed): 4`, exit 0 ·
`check:rendered-scope` **exit 1** · `check:stories` 0 violations · `build` exit 0 · both hygiene gates clean.

Expected **after R16/R14** — re-run the same block and retain it as `R2_final_<check>.txt`, do not overwrite the
`R1_final_*` set: the report prints `tier1-unenrolled (27)`, `tier2-legacy-primitive (3)`,
`Allowlisted edges (tier3, owner-filed): 27`, exit 0; `check:rendered-scope` still **exit 1**; every other result
unchanged. `git status --short` lists the Task 812 artifacts plus the pre-existing paths named in §14.8 and, newly,
`.github/workflows/governance-pr.yml` and `scripts/rendered-scope-allowlist.json`.

Retain each transcript as `docs/sessions/evidence/task812/R1_final_<check>.txt`, BOM-free, written with
`[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or PowerShell 7's `-Encoding utf8NoBOM`.
A plain `>` redirect writes a BOM and `check:file-integrity` rejects it.

### 14.8 Revision 1 completion report contract

Everything §11 requires, plus, and replacing §11's references to the superseded AC4 and AC8:

- AC15's allowlist diff — 13 entries, the 11 new ones quoted — and the `git diff --stat scripts/check-rendered-scope.mjs` empty result;
- AC15/AC16's post-R16 census line (`27 / 3 / 27`) and the repeated AC11 probe transcript;
- AC17's GR-1 `Command`-block byte-identity check and the corrected `Enforcement status` row quoted;
- AC13's two corrected texts quoted, and `node.exe --check` exit code;
- AC7-R's workflow hunk **with its job name and the two neighbouring steps**;
- AC14's eight `R1_final_*` transcript paths with their real exit codes, the `build` exit 0 line included, plus the
  `R2_final_*` re-run set;
- confirmation that the five §14.1 artifacts are unmodified —
  `git status --porcelain -- docs/sessions/evidence/task812/` naming no `M` on any of them;
- for any §14.6 option selected, the verbatim dated decision text as it was copied into the sprint file.

**Pre-existing and out of scope, left untouched** — already modified before this task began and unrelated to it:
`docs/component-catalog.md`, `docs/performance.md`, `src/components/ui/AppImage.tsx`, `src/lib/imageDelivery.ts`,
`src/modules/listings/components/RecentlyViewedSection.tsx`. `src/components/ui/AppImage.tsx` being dirty is **not**
licence to migrate it: R10 removes its allowlist entry and touches nothing else.

Status on completion: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` when R20 lands (R14 and R16-R19 are already
verified); `PARTIALLY IMPLEMENTED` when it does not. `BLOCKED` is not available — §14.6 is answered
and every remaining requirement is executable from this file. Do not self-approve; Opus alone issues the verdict.

### 14.9 Revision 1 pre-read bundle

`docs/golden-rules.md` in full, including its header and GR-1's `Command` block · `docs/agent-contract.md` clauses
**9** and **16d** tiers 1-3 · `scripts/check-rendered-scope.mjs` in full · `scripts/rendered-scope-allowlist.json` ·
`docs/storybook-governance.md` §15.5 · `.github/workflows/governance-pr.yml` jobs `governance`, `homepage-grid`,
`locale-leak` · `docs/sessions/evidence/task812/R1_final_report.txt` — the census §14.6.1 is measured from ·
`docs/sessions/2026-09-11-task812-rendered-but-unenrolled-component-detector.md` · §§13-15 of this kickoff, §14.6 in
full.

## 15. Git handoff — Revision 1 orchestration (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's shell cannot mount the
repository after the 2026-09-08 Windows update, so this block is built from the paths this revision wrote. Check
`git status` before pasting.

```powershell
git add "tasks/Archive/Sprint_75_kickoff_prompt_Task_812_Rendered_But_Unenrolled_Component_Detector.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task812): third-pass review - R10-R19 verified, R20 filed for the golden-rules allowlist count; GR-5 synced"
```

This stages orchestration artifacts only — no `scripts/`, no `docs/sessions/`, no implementation path. No `git push`:
`NEEDS REVISION` is not an approved implementation review. A later session that relies on this commit must read
`git show <verified-commit>:tasks/Archive/Sprint_75_kickoff_prompt_Task_812_Rendered_But_Unenrolled_Component_Detector.md`
before treating §§14-15 as persisted.
