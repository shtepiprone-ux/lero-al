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
| **R4** | An allowlist file carries the tier-3 exclusions. Every entry requires a **reason string** and an **owning task number**; an entry missing either is itself an error. An entry that no longer matches any real edge is reported as **stale** and fails the gate, in the same shape `check-design-tokens.mjs` already uses for stale markers. | **P0** | AC4, AC5 |
| **R5** | The detector prints its own scope alongside its result — how many enrolled roots it walked, how many edges it resolved, and how many local imports it skipped as non-rendered — so a green line states what it actually inspected. This is Sprint 75's exit criterion 5 in miniature. | P1 | AC6 |
| **R6** | The check is wired into `package.json` and runs in the same CI job as `check:story-coverage`, before `build-storybook`. A detector that is not wired is a proof, not a gate — the defect already recorded against `scripts/task808-key-warning-probe.mjs`. | **P0** | AC7 |
| **R7** | Two-armed plant, both arms retained: with `CollectionsSection.tsx` removed from the manifest the gate exits non-zero and names the `FavoritesShell → CollectionsSection` edge; with it restored the gate exits 0, and the manifest's `git hash-object` is identical before the plant and after the restore. | **P0** | AC8 |
| **R8** | `docs/golden-rules.md`'s enforcement table is updated: GR-1 and GR-3 move from receipt-only to enforced by this command, and the "812 — not yet built" sentence is replaced by what actually landed. `docs/storybook-governance.md` §15 gains the new gate beside §15's existing description. | P1 | AC9 |
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
- **AC4 [R4]** — Given an allowlist containing `AppImage`, `ListingFeatureIcon` and `FavoriteButton` with reasons and
  owner **813**, then those three are not reported, and the scope line counts them as allowlisted.
- **AC5 [R4]** — Given one allowlist entry pointed at a path no enrolled file renders, then the gate fails with a
  stale-entry message naming it. Restore and re-run clean.
- **AC6 [R5]** — The gate's output states, on a passing run, the number of enrolled roots walked, edges resolved,
  non-rendered local imports skipped, allowlisted edges, and the classes it cannot see (dynamic import / `React.lazy`).
- **AC7 [R6]** — `npm run check:rendered-scope` exists in `package.json` and the CI governance job runs it; quote the
  workflow diff hunk.
- **AC8 [R7]** — Both plant arms retained under `docs/sessions/evidence/task812/`, with the manifest's
  `git hash-object` identical before the plant and after the restore.
- **AC9 [R8]** — `docs/golden-rules.md`'s enforcement table names this command for GR-1 and GR-3 and no longer says
  812 is unbuilt; `docs/storybook-governance.md` §15 describes the new gate.
- **AC10 [R9]** — `npm run check:story-coverage` still prints **38 covered / 0 unproven**, exit 0, on the restored
  tree. Quote it.

**GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.** AC10's `38/0` is a
reproduction of a measured current value on an unchanged tree, not a target a correct implementation could violate.

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
`check:rendered-scope` exit 0 with its scope line · `check:stories` 0 violations · `build` exit 0 · both hygiene
gates clean. **The last two are not optional and are not omitted from this block** — the previous two passes on Task
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

## 13. Git handoff — task design (owner-run, do not execute)

```powershell
git add "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "tasks/Sprints/Sprint_75_kickoff_prompt_Task_812_Rendered_But_Unenrolled_Component_Detector.md" "docs/backlog.md"
git commit -m "docs(Task812): Sprint 75 opened - the gates that report green on what they cannot see; 812 kickoff filed"
```
