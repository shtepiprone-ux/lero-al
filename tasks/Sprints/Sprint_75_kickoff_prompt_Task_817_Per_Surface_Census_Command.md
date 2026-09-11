# Task 817 — `scripts/check-surface-census.mjs --surface <path>`: GR-1's command exists, and it sees what `check:rendered-scope` cannot

Sprint 75 · **P0** · QA profile **Q4**

## 1. Mode and task type

`IMPLEMENTATION` — governance detector. One new static per-surface census command plus its written false-positive
boundary, proven with a two-armed plant and a differential arm against the existing whole-manifest detector. No
product UI changes, no component migration, no CI wiring.

## 2. Objective

`docs/golden-rules.md` GR-1 carries a `Command` block that the owner's decision 2 (2026-09-11) explicitly refuses to
downgrade:

```powershell
$surface = "src\modules\listings\components\FavoritesShell.tsx"
node.exe scripts\check-surface-census.mjs --surface $surface
```

`FACT` — **that script does not exist.** `scripts/` was listed in full on 2026-09-11: it contains
`check-rendered-scope.mjs` and 60-odd other checks, and no `check-surface-census.mjs`. GR-1 — the rule written after
Task 809 shipped `/favorites` with 53 `className` and two shadcn `Dialog`s on the page — has been receipt-only since
the day it was written, because its own command is a path to a missing file. Task 812's review recorded this verbatim
(kickoff §14.4, AC12): *"`scripts/check-surface-census.mjs` does not exist in `scripts/`, so GR-1's restored command
is not runnable today. That is a real, pre-existing GR-1 defect."*

Build it. After this task, `node.exe scripts\check-surface-census.mjs --surface <path>` censuses **one named surface**
— enrolled or not — emits GR-1's receipt line from measured values, and exits non-zero when a component that surface
renders is unmigrated, still importing a legacy primitive, or an unlisted shared node.

The half `check:rendered-scope` structurally cannot cover is the whole point: it walks **manifest roots**, so a
surface that is not yet enrolled is not walked at all, and neither is anything it renders. That is the exact
pre-enrolment state Task 809 was in when it was designed. §12's plant measures that blindness rather than asserting
it.

## 3. Verified context — read from source on 2026-09-11, not quoted from the backlog

### 3.1 The command that does not exist

`FACT` — `docs/golden-rules.md` GR-1, read in full this session (`:24-35`). Its `Command` block names
`scripts\check-surface-census.mjs --surface $surface`. Its receipt is a fixed string:

> `GR-1 CENSUS COMPLETE — <n> nodes; tier1 <a> migrated+enrolled+story; tier2 <b> imports removed; tier3 <c> listed and filed as <task numbers>.`

`FACT` — `docs/golden-rules.md:92`'s `Enforcement status` row states GR-1 is **not enforced**, that blocking
enforcement is gated on **817** and **818**, and that *"GR-1's `Command` block above is unchanged and is not
`check:rendered-scope` — the two are complementary, not substitutes (decision 2's binding consequence)."*

`FACT` — `package.json`, read this session: no `check:surface-census` entry exists. `check:rendered-scope` and
`check:rendered-scope:report` were added by Task 812 at `:71-72`.

### 3.2 What `check:rendered-scope` does and does not cover

`FACT` — `scripts/check-rendered-scope.mjs`, read in full this session. Its walk is:

```
for (const manifestPath of manifest) { … }
```

Every root is a `scripts/mantine-migration-scope.json` entry. Its frontier is "imported by an enrolled file, not
itself enrolled". Consequences this task depends on, all read from the source, none inferred:

| Property | Where | Why 817 exists |
|---|---|---|
| roots = manifest entries only | `:208` | an **unenrolled** surface is never a root, so nothing it renders is ever examined |
| tier2 = `finalPath.startsWith('src/components/ui/')` | `:206`, `:244` | 817 reuses this exact prefix rule; it is not re-derived |
| tier3 = a `scripts/rendered-scope-allowlist.json` entry with `reason` **and** `owner`, never a tier-2 path | `:250`, `:266-279` | 817 reuses the same allowlist file and the same R10 tier-2 rejection |
| rendered = the import's local binding appears as a JSX opening/self-closing tag root | `:104-121`, `:228` | 817 reuses this definition of "renders" verbatim |
| single-hop `index.ts(x)` barrel unwrap | `:131-160` | same behaviour required, same limitation reported |
| out of reach | `:290` | dynamic `import()` and `React.lazy()` — printed, not silently treated as covered |

`FACT` — the two shared helpers already live in `scripts/lib/import-resolver.mjs`
(`extractImportSpecifiers`, `resolveImportSpecifier(root, fromFile, spec)`), extracted by Task 812 precisely so a
second consumer would not duplicate them. `scripts/lib/mantine-story-scope.mjs` exports
`isCanonicalMantineTitle(title)` and `MANTINE_STORY_TITLE_PREFIXES`, and its own header states that neither the
prefix list nor the enrolment mechanism may be re-implemented in any consumer.

### 3.3 The current data files

`FACT` — `scripts/mantine-migration-scope.json`: a flat array of **38** repo-relative paths, the last five added by
Task 809 (`FavoritesShell`, `MantineEmptyLoadingErrorState`, `CollectionsSection`, `SaveToCollectionButton`,
`FavoritesTypeFilter`).

`FACT` — `scripts/rendered-scope-allowlist.json`: **13** entries — 2 with `owner` `"813"`
(`ListingFeatureIcon`, `FavoriteButton`) and 11 with `owner` `"816"` (the shared
`src/design-system/mantine/patterns/*` cluster). No `src/components/ui/*` path is present; Task 812's R10 removed
`AppImage` and made a tier-2 path an invalid entry rather than a stale one.

`FACT` — Sprint 75's preconditions, and Task 812's `R1_final_story-coverage.txt` as quoted in its approved review:
`check:story-coverage` prints **38 covered / 0 unproven**, exit 0. Every manifest entry — `FavoritesShell.tsx` and
`CollectionsSection.tsx` among them — is therefore imported by at least one canonical Mantine story.

### 3.4 The surface decision 2 names

`FACT` — `src/modules/listings/components/FavoritesShell.tsx`, read in full this session. Its local component
imports are exactly seven, all of them currently enrolled:

| Local import | Rendered as JSX | In manifest |
|---|---|---|
| `MantineListingCardTrack` (`:9`) | yes (`:204`) | yes |
| `MantineEmptyLoadingErrorState` (`:10`) | yes (`:146`, `:164`, `:191`) | yes |
| `ListingCard` (`:11`) | yes (`:206`) | yes |
| `FavoritesTypeFilter` (`:12`) | yes (`:183`) | yes |
| `ListingsPagination` (`:13`) | yes (`:218`) | yes |
| `CollectionsSection` (`:14`) | yes (`:180`) | yes |
| `SaveToCollectionButton` (`:15`) | yes (`:214`) | yes |

`FACT` — it also imports five non-rendered locals that a correct census must **not** report: `theme` (`:8`),
`useFavoritesRealtime` (`:16`), `useExchangeRate` (`:17`), `useAuth` (`:18`), and the type-only
`CollectionWithCount` (`:19`). `CardListingData` (`:11`) is an inline `type` specifier on a value import — the same
shape `check-rendered-scope.mjs:94` already handles through `el.isTypeOnly`.

`INFERENCE`, to be re-measured at execution, not asserted as a result — a **transitive** census from
`FavoritesShell.tsx` will reach `src/components/ui/AppImage.tsx` through `ListingCard`, because Task 812's owner
decision 1 records `ListingCard -> AppImage` as one of the three live tier-2 edges. If so, **a clean-tree census of
`FavoritesShell` exits non-zero, and that is the correct result** — the tier-2 debt is real, it is not 817's to fix,
and no acceptance criterion below asserts a zero exit on the current tree. This is Task 812's AC8 lesson (`GR-4`)
applied before the fact rather than after it.

### 3.5 Two stale records this task corrects on sight, and does not copy forward

1. `CONFLICT` — `tasks/Sprints/Sprint_75_…md`'s **execution-order line** reads `812 → 815 → 797 → 743`; its own
   Tasks table and `docs/backlog.md`'s Sprint 75 row both carry **816 · 817 · 818**, filed after that line was
   written, with order `812 → 817 → 818 → 816 → 815 → 797 → 743`. The Tasks table is the single state source
   (`orchestrator-procedures.md` → recurring failure modes, the 702 corollary); the order line is stale and is
   corrected in this task design's state update, not by the executor.
2. `CONFLICT` to surface, **not** for this task to resolve — `docs/backlog.md`'s **813** row lists
   `AppImage (src/components/ui/AppImage.tsx)` as a **tier-3** node. Owner decision 1 (2026-09-11) says
   *"AppImage and PasswordRequirementsHint remain tier 2"*, and `scripts/rendered-scope-allowlist.json` no longer
   contains it. 813's kickoff must reconcile this before it is written. 817 neither allowlists `AppImage` nor
   migrates it.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner decision 2 | `scripts/check-surface-census.mjs` exists and accepts `--surface <repo-relative-or-absolute path>`. Invocation is byte-compatible with GR-1's `Command` block as written. A missing, unreadable, or non-`.tsx`/`.ts` `--surface` value exits **2** with a message naming the path — never a silent pass. | **P0** | AC1, AC11 | Confirmed |
| **R2** | `agent-contract` 16d | The census starts at the named surface **whether or not it is in the manifest**, and walks **transitively** through tier-1 nodes with a visited set (cycle-safe). It does **not** recurse into a tier-2 or tier-3 node: 16d's census is transitive, its scope is not. | **P0** | AC2, AC6 | Confirmed |
| **R3** | `check-rendered-scope.mjs:104-121`, `:228` | A node is counted only when it is **rendered**: a non-type-only import whose local binding appears as a JSX opening/self-closing tag root in the importing file. Hooks, utils, constants, contexts, theme objects and type-only imports are never nodes. | **P0** | AC3 | Confirmed |
| **R4** | `agent-contract` 16d tiers | Every node is classified into exactly one tier: **tier2** = resolves under `src/components/ui/`; **tier3** = a valid `scripts/rendered-scope-allowlist.json` entry (`reason` + `owner`, never a tier-2 path); **tier1** = everything else. The same allowlist file and the same tier-2 rejection rule as `check-rendered-scope.mjs` — no second allowlist, no new suppression mechanism. | **P0** | AC4, AC5 | Confirmed |
| **R5** | GR-1's three facts | Each node prints, on one line: path · tier · `manifest:<yes\|no>` · `story:<yes\|no>` · `className:<count>` · `ui-imports:<count>` · the parent that renders it. `story:yes` means a **canonical Mantine story imports that exact path** — never its parent (GR-3). `className` is counted as JSX attributes named `className` via the TypeScript AST, and the script states that counting rule in its own output. | **P0** | AC6, AC7 | Confirmed |
| **R6** | GR-1 receipt | On a run where every node is accounted for, the script prints GR-1's receipt line verbatim with measured values. On a run where any node blocks, it prints `GR-1 CENSUS BLOCKED — …` naming every blocking node, and the string `GR-1 CENSUS COMPLETE` **does not appear anywhere in that run's output**. A red tree may never emit a green receipt. | **P0** | AC8, AC9 | Confirmed |
| **R7** | 16d, GR-1 | Blocking conditions, each with its own `FAIL` block and its own correction sentence: a **tier-1** node that is not both in the manifest **and** imported by a canonical Mantine story of its own; any **tier-2** edge; a tier-3 entry that is malformed or invalid under R4. Exit **1**. | **P0** | AC4, AC5, AC8 | Confirmed |
| **R8** | Sprint 75 exit 5, GR-2 | The script prints its own scope on **every** run, pass or fail: nodes visited, edges resolved, non-rendered imports skipped, tier-3 nodes excluded with their owning tasks, barrel hops unwrapped and not unwrapped, and the literal sentence naming what it cannot see — dynamic `import()`, `React.lazy()`, and components rendered only from a `.stories.tsx` file. | P1 | AC7 | Confirmed |
| **R9** | Task 812 R9 precedent | `scripts/lib/import-resolver.mjs` and `scripts/lib/mantine-story-scope.mjs` are **imported**, never re-implemented. `scripts/check-rendered-scope.mjs` and `scripts/check-story-coverage.mjs` are **not modified in behaviour**: after this task, `npm run check:story-coverage` and `npm run check:rendered-scope` produce the same counts and the same exit codes as the pre-change tree on an unchanged working tree. | **P0** | AC12 | Confirmed |
| **R10** | 812 R6 / task808 precedent | `package.json` gains `"check:surface-census": "node scripts/check-surface-census.mjs"` so the tool is discoverable and invocable by Tasks 816 and 818. GR-1's `Command` block in `docs/golden-rules.md` is **not touched** — decision 2's binding consequence — and stays the documented invocation. | P1 | AC13, AC14 | Confirmed |
| **R11** | Owner decision 2 | Two-armed plant against `FavoritesShell`, both arms retained, plus a **differential** arm proving the blind spot: in the planted state `check:rendered-scope` names `CollectionsSection` **zero** times while the surface census names it. Assertions are on **named node lines**, never on an exit code. | **P0** | AC9, AC10 | Confirmed |
| **R12** | Sprint 75 exit 4 | The false-positive boundary is written down, not only coded: a new subsection beside `docs/storybook-governance.md` §15.5 states what the census deliberately does not flag, the mechanism that excludes each class, and the task that owns whatever is excluded. | P1 | AC15 | Confirmed |
| **R13** | 812 R18, `golden-rules.md:92` | No artifact this task writes or edits claims GR-1 or GR-3 is **enforced**, blocking, or complete. `docs/golden-rules.md`'s `Enforcement status` table may record only that GR-1's command now exists and what it checks; the CI-blocking gate remains **Task 818**. | **P0** | AC14 | Confirmed |

## 5. Assumptions and open questions

- **`ASSUMPTION` (reversible, stated)** — the census is a **new script**, not a flag on `check-rendered-scope.mjs`.
  Reason: they answer different questions from different roots (one surface, walked transitively vs the whole
  manifest, walked one hop past the frontier), they fail for different reasons, and R9 requires the existing gate's
  output to be untouched. Rejected alternative: `check-rendered-scope.mjs --surface <path>`, which couples two exit
  codes and puts GR-1's per-surface receipt behind a gate whose own row says it is not GR-1's command.
- **`ASSUMPTION` (reversible, stated)** — a tier-1 node fails unless it is **both** enrolled **and** storied. GR-1's
  receipt clause is `tier1 <a> migrated+enrolled+story`; a node with a story but no manifest entry cannot honestly be
  counted under it. Rejected alternative: 16d's literal "no manifest entry **and** no Story of its own" as the
  failure condition, which would let a half-registered node pass while the receipt claims it is enrolled.
- **`ASSUMPTION` (reversible, stated)** — the surface itself is node #1 of its own census and is subject to the same
  tier-1 rule. Reason: an unenrolled, unstoried surface is exactly what a task designed against it must fix; exempting
  the subject would reproduce the 809 exclusion one level up. The `--report` mode prints it either way.
- **`UNKNOWN`, and §13.1 is what resolves it** — the size and shape of `FavoritesShell`'s transitive node set, and
  whether the `ListingCard → AppImage` tier-2 edge is the only blocking node on the clean tree. **Measure it first
  and report it before writing any acceptance-criterion value.**
- **`UNKNOWN`, and §13.3 step 1 is what resolves it** — whether any manifest root other than `FavoritesShell.tsx`
  renders `CollectionsSection.tsx`. The plant's differential arm depends on the answer. If another root does, name
  it, de-enrol it too or pick a different node, and say which — do **not** run the plant as written and report a
  result it cannot produce. This is Task 812 §3.3's lesson: the previous task's stated plant had gone stale and was
  copied forward once already.
- **`CONFLICT` to surface, not to resolve alone** — if §13.1 shows the clean-tree census of `FavoritesShell` blocking
  on more than the tier-2 `AppImage` edge, report the full node table and stop for
  `BLOCKED — OWNER DECISION REQUIRED` before allowlisting anything. Adding an allowlist entry to make this task's own
  demo green is the bulk-exemption failure Task 812's R10 exists to stop, and owner decision 1 forbids allowlisting
  any non-pattern tier-1 path.

## 6. Pre-read rule bundle

`docs/golden-rules.md` **in full**, including its header and GR-1's `Command` block · `docs/agent-contract.md`
clauses **9, 13, 16c, 16d in full** (16d's three tiers verbatim) · `docs/qa-profiles.md` (Q4) ·
`scripts/check-rendered-scope.mjs` **in full** · `scripts/lib/import-resolver.mjs` ·
`scripts/lib/mantine-story-scope.mjs` · `scripts/check-story-coverage.mjs` §§ title extraction and story discovery ·
`scripts/rendered-scope-allowlist.json` · `scripts/mantine-migration-scope.json` ·
`docs/storybook-governance.md` §15 and §15.5 · `tasks/Sprints/Sprint_75_…md` §14.6.3 (decision 2, verbatim) ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_812_…md` §§3, 10.3, 14.1, 14.4 (AC8-R and AC11 are the plant and
allowlist patterns this task follows) · this kickoff.

Do not read the rest of `docs/`.

## 7. Scope

- **New:** `scripts/check-surface-census.mjs`.
- **Edited:** `package.json` (one script entry) · `docs/storybook-governance.md` (one new subsection beside §15.5) ·
  `docs/golden-rules.md` **`Enforcement status` table only**, GR-1 and GR-3 rows, within R13's limits.
- **Touched reversibly and restored with witnesses:** `scripts/mantine-migration-scope.json` (the plant only).
- **Written:** `docs/sessions/evidence/task817/*` · `docs/sessions/2026-09-11-task817-per-surface-census-command.md` ·
  the concise `docs/backlog.md` state line.

## 8. Out of scope

Migrating, enrolling or storying **any** component the census flags — including `AppImage` · adding, removing or
editing any `scripts/rendered-scope-allowlist.json` entry · adding any entry to
`scripts/mantine-migration-scope.json` (the plant removes and restores; it never adds) · changing
`check-rendered-scope.mjs`, `check-story-coverage.mjs`, `check-stories-rendered.mjs` or `check-locale-leak.mjs` ·
**any** CI workflow change, including making anything blocking — that is Task **818** · editing GR-1's or GR-3's
rule bodies or `Command` blocks · Tasks 813, 815, 816, 818 · any file under `src/`.

## 9. Current and required behavior

**Before.** `docs/golden-rules.md` GR-1 instructs every task design, execution and review that touches a visible
surface to run `node.exe scripts\check-surface-census.mjs --surface $surface` and emit its receipt. The file does not
exist, so the command fails with a Node module-not-found error and the receipt has been written by hand since the day
the rule was created. `check:rendered-scope` covers the enrolled subgraph only and its own row says it is not GR-1's
command.

**After.** The command runs. Given any surface path it prints a per-node census, the GR-1 receipt line when the
census is clean, `GR-1 CENSUS BLOCKED` plus the offending nodes when it is not, and its own scope and blind spots on
every run. `check:story-coverage` and `check:rendered-scope` behave exactly as before.

## 10. Implementation requirements

1. **Resolution and rendering semantics are imported, not re-derived.** `resolveImportSpecifier` and
   `extractImportSpecifiers` come from `scripts/lib/import-resolver.mjs`; `isCanonicalMantineTitle` comes from
   `scripts/lib/mantine-story-scope.mjs`. The JSX-tag-root extraction, the single-hop barrel unwrap and the
   `TIER2_PREFIX` rule are the ones `check-rendered-scope.mjs` already implements — copy the semantics exactly, and
   if a helper is extracted to `scripts/lib/` to avoid a literal duplicate, R9's no-behaviour-change assertion binds
   both consumers.
2. **Story ownership is per path.** Build the canonical-story import index the same way `check-story-coverage.mjs`
   does — parse `src/**/*.stories.ts(x)`, keep those whose `meta.title` satisfies `isCanonicalMantineTitle`, resolve
   their import specifiers — and set `story:yes` only when the resolved set contains the node's **own** path. A story
   that imports the node's parent is not evidence for the node; that is GR-3, and it is the distinction this column
   exists to make machine-checkable.
3. **`className` counting is AST-based and self-declared.** Count `JsxAttribute` nodes whose name is `className`.
   Print the counting rule in the scope block, because a `Select-String` count of the same file can legitimately
   differ (string occurrences in comments, `cn(...)` helpers) and two incomparable numbers must not be silently
   compared across documents.
4. **Exit codes are one question each.** `0` — census complete, receipt printed. `1` — at least one blocking node,
   `GR-1 CENSUS BLOCKED` printed with every offender named. `2` — the invocation itself is unusable (missing
   `--surface`, path absent, path outside the repo, unparseable root). A `--report` flag prints the full node table
   and always exits `0`, matching `check:story-coverage:report` and `check:rendered-scope:report`.
5. **Determinism.** Node order is stable across runs — sort by depth, then path — so two transcripts of the same tree
   are diffable.
6. **Transcripts are written BOM-free.** Use
   `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or PowerShell 7's
   `-Encoding utf8NoBOM`. A plain `>` redirect writes a BOM and `check-file-integrity.mjs` rejects a `.txt` carrying
   one — that exact omission was the open P2 on Task 809's Revision 6.

## 11. Positive and negative flows

**Positive.** An orchestrator designs a task against a surface that is not yet enrolled, runs
`node.exe scripts\check-surface-census.mjs --surface <that file>`, and receives the complete node list with each
node's enrolment and story status — the census GR-1 has always demanded and never been able to produce.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| `--surface` omitted, or the path does not exist | Yes | exit **2**, message naming the flag or the path; no partial census, no receipt |
| `--surface` points at a file outside the repo root | Yes | exit **2** |
| Type-only import (`import type { CollectionWithCount }`) | Yes | not a node — R3 |
| Inline type specifier on a value import (`import { X, type Y }`) | Yes | `Y` is not a node; `X` is, if rendered — the `el.isTypeOnly` path |
| Hook / util / constant / theme object imported and used, never in JSX | Yes | not a node — R3; counted in the skipped total |
| A component rendered only from a `.stories.tsx` file | Yes | not a node — stories are not production render paths; stated in the printed blind-spot sentence |
| Circular import between two rendered components | Yes | visited set terminates the walk; each node appears once |
| A tier-3 node with a valid allowlist entry | Yes | printed with its owning task, **not** blocking, **not** recursed into |
| A tier-2 `@/components/ui/*` node | Yes | blocking, own `FAIL` block, correction is "stop importing it" — never "enrol it" |
| An allowlist entry pointed at a `src/components/ui/*` path | Yes | invalid entry, blocking, reported as **invalid** and never as *stale* — the R10/AC11 rule `check-rendered-scope.mjs:266-279` already implements |
| Dynamic `import()` / `React.lazy()` | Yes | out of reach; named in the blind-spot sentence rather than treated as covered |
| A node reached only through a barrel the unwrapper cannot resolve | Yes | reported at the barrel file itself, counted separately, exactly as `check-rendered-scope.mjs:238-240` does |
| Authorization / RLS / network / concurrent writer | **No** | this task adds a static script; it reads files and touches no runtime, data or auth path |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the exact GR-1 `Command` block copied out of `docs/golden-rules.md` unchanged, when it is run
  from the project root, then it executes the new script and prints a census. Quote the command as pasted and the
  first ten lines of output. A run that requires editing the block to work fails this criterion.
- **AC2 [R2]** — Given `--surface src/modules/listings/components/FavoritesShell.tsx` on the clean tree, then the
  node table contains all seven components §3.4 lists, each with the parent that renders it, **and** at least one
  node at depth ≥ 2 reached through one of them. Quote the table.
- **AC3 [R3]** — Given the same run, then `theme`, `useFavoritesRealtime`, `useExchangeRate`, `useAuth`,
  `CollectionWithCount` and `CardListingData` appear in **no** node row at any tier. Quote the skipped-import total
  from the scope block and state which of the six it accounts for.
- **AC4 [R4, R7]** — Given the same run, then every node carries exactly one tier; every tier-3 node names its owning
  task number taken from `scripts/rendered-scope-allowlist.json`; and no tier-3 or tier-2 node has children in the
  table. Quote one tier-3 row with its owner.
- **AC5 [R4, R7]** — Given a temporary probe adding `{"path":"src/components/ui/AppImage.tsx","reason":"probe","owner":"813"}`
  to `scripts/rendered-scope-allowlist.json`, then the census prints an **invalid-entry** `FAIL` naming that path
  **and** still reports the `AppImage` edge under tier 2 in the same transcript. Remove the probe and retain **one**
  witness transcript carrying the allowlist's `git hash-object` before, the same value after, and an explicit
  `git --no-optional-locks status --porcelain -- scripts/rendered-scope-allowlist.json` output.
- **AC6 [R2, R5]** — Given `--surface` pointed at a surface this session measured as **unenrolled** — take the path
  from `npm run check:rendered-scope:report`'s `tier1-unenrolled` block, quote the path and why you chose it — then
  the census still runs, node #1 is that surface, and its row reads `manifest:no`. This is the pre-enrolment case
  decision 2 names.
- **AC7 [R5, R8]** — Given any run, then the scope block states nodes visited, edges resolved, non-rendered imports
  skipped, tier-3 nodes excluded, barrel hops unwrapped and not unwrapped, the `className` counting rule, and one
  sentence naming dynamic `import()`, `React.lazy()` and story-only renders as classes it cannot see. Quote the block.
- **AC8 [R6, R7]** — Given a run with at least one blocking node, then its output contains
  `GR-1 CENSUS BLOCKED — ` followed by every blocking node, the exit code is **1**, and a search of that transcript
  for the literal string `GR-1 CENSUS COMPLETE` returns **zero** occurrences. Quote the search and its result.
- **AC9 [R6, R11]** — Given plant arm 1 — `"src/modules/listings/components/FavoritesShell.tsx"` **and**
  `"src/modules/listings/components/CollectionsSection.tsx"` removed from `scripts/mantine-migration-scope.json` —
  then the census of `FavoritesShell.tsx` still lists `CollectionsSection.tsx` as a node, its row reads
  `manifest:no`, and it is named in the `GR-1 CENSUS BLOCKED` line. Quote the node row and the blocked line.
- **AC10 [R11]** — In that same planted state, then `npm run check:rendered-scope:report` contains **zero**
  occurrences of `CollectionsSection`, and `npm run check:story-coverage` exits **0** with `0 unproven`. Quote the
  two searches and the coverage line. Then restore both manifest entries and retain **one** witness transcript
  carrying the manifest's `git hash-object` before the plant, the same value after the restore, and an explicit
  `git --no-optional-locks status --porcelain -- scripts/mantine-migration-scope.json` output; in the restored
  census, the `CollectionsSection … manifest:no` row is absent. **Do not assert either arm's exit code** — the
  tier-2 frontier is unresolved and both arms may legitimately be `1`.
- **AC11 [R1]** — Given `node.exe scripts\check-surface-census.mjs` with no arguments, and again with
  `--surface src\does\not\exist.tsx`, then each exits **2** and names the flag or the path. Quote both.
- **AC12 [R9]** — Given the final tree, then `npm run check:story-coverage` prints the same covered/unproven counts
  and the same exit code as the pre-change tree, and `npm run check:rendered-scope:report` prints the same
  `tier1-unenrolled`, `tier2-legacy-primitive` and `allowlisted` counts as the pre-change tree. Capture both **before
  writing any code** as the comparison baseline, and quote both pairs side by side.
- **AC13 [R10]** — Given `package.json` after the change, then it contains exactly one new entry,
  `"check:surface-census"`, and `npm run check:surface-census -- --surface src/modules/listings/components/FavoritesShell.tsx`
  produces the same census as AC2's direct invocation. Quote the diff hunk.
- **AC14 [R10, R13]** — Given `docs/golden-rules.md` read after the change, then GR-1's `Command` block is
  byte-identical to its pre-change content; the `Enforcement status` GR-1 and GR-3 rows record only that the
  per-surface command now exists and what it checks; and neither row claims GR-1 or GR-3 is enforced, blocking, or
  that Task 818's condition is met. Quote both rows and the unchanged `Command` block.
- **AC15 [R12]** — Given `docs/storybook-governance.md` after the change, then a subsection beside §15.5 names the
  new command, its three tiers, its exit codes, and each class it deliberately does not flag together with the
  mechanism that excludes it and the task that owns the excluded work. Quote the subsection heading and the
  blind-spot list.

**GR-4 AC AUDIT — 15 criteria; each states an observable property; absolutes: none.** AC8's and AC10's "zero
occurrences" are scoped to one named string inside one named retained transcript, which is an observable property of
that artifact rather than a global invariant a correct implementation could violate; AC12's and AC14's equality
claims are scoped to two named files this task deliberately does not change in behaviour, captured as a measured
before/after pair rather than as a target value. **No criterion asserts an exit code for a plant arm, and none
asserts that `check:surface-census` exits 0 on the current tree** — §3.4 states why that would be unsatisfiable, and
Task 812's AC8 is the recorded instance of getting it wrong.

## 13. QA profile and verification plan

**`Q4 Release/Critical Flow`** — `docs/qa-profiles.md` requires planted-violation failure proof whenever a task
claims a gate, and this task supplies the command a receipt-enforced golden rule cites. No rendered UI changes, so no
visual matrix and no `OWNER VISUAL QA REQUIRED` matrix applies. `docs/critical-flow-registry.md` scanned: this task
changes only `scripts/`, `package.json` and `docs/`, touches no route, action, RLS policy or auth path, and therefore
matches no registry entry.

### 13.1 Baseline first — measure before writing code

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task817"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --short
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope:report
git hash-object scripts/mantine-migration-scope.json
git hash-object scripts/rendered-scope-allowlist.json
```

Expected: `win32`; the Node version; the current worktree state; `check:story-coverage` at its current
covered/unproven counts, exit 0; the full `check:rendered-scope` frontier report with its three counts, exit 0; two
40-character hashes. **Return all of it before writing a line of the script** — it is AC12's baseline and the plant's
restore witness, and it cannot be reconstructed afterwards.

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe --check scripts\check-surface-census.mjs
npm.cmd run typecheck
npx.cmd eslint scripts/check-surface-census.mjs scripts/check-rendered-scope.mjs scripts/check-story-coverage.mjs
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:stories
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: `--check` silent exit 0 · typecheck 0 · eslint 0 errors · `check:story-coverage` identical to §13.1's
baseline · `check:rendered-scope` identical counts to §13.1's baseline (its **exit code is 1** on this tree and that
is correct — assert the counts, not the code) · `check:stories` 0 violations · `build` **exit 0**, which
`agent-contract` clause 9 makes mandatory for every non-Q0 task · both hygiene gates clean. **The last two are in
this block deliberately:** leaving `check:file-integrity` and `check:mojibake` out of the command block produced a
defect on each of Task 809's last two passes, and the second one was still open when Sprint 75 opened.

### 13.3 The two-armed plant and its differential arm

**Step 1 — prove the plant can still fire before running it.**

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-ChildItem -Recurse src -Include *.tsx,*.ts | Select-String -Pattern 'components/CollectionsSection' 
```

Expected: the importing files. **If any file other than `src/modules/listings/components/FavoritesShell.tsx` and a
`.stories.tsx` is listed and is itself in the manifest, the plant as written cannot produce AC10's zero-occurrence
result.** Name that file, de-enrol it in arm 1 as well, and say so in the report — do not run the plant and report a
result it cannot produce.

**Step 2 — arm 1.** Record `git hash-object scripts/mantine-migration-scope.json`. Remove
`"src/modules/listings/components/FavoritesShell.tsx"` and `"src/modules/listings/components/CollectionsSection.tsx"`
from the array, then:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$surface = "src\modules\listings\components\FavoritesShell.tsx"
node.exe scripts\check-surface-census.mjs --surface $surface
npm.cmd run check:rendered-scope:report
npm.cmd run check:story-coverage
```

Expected: the census still lists `CollectionsSection.tsx` with `manifest:no` and names it in `GR-1 CENSUS BLOCKED`;
the `check:rendered-scope` report contains **zero** `CollectionsSection` occurrences; `check:story-coverage` exits 0
with `0 unproven`. That triple **is** the blind spot decision 2 describes, measured rather than asserted.

**Step 3 — arm 2.** Restore both entries, then:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$surface = "src\modules\listings\components\FavoritesShell.tsx"
git hash-object scripts/mantine-migration-scope.json
git --no-optional-locks status --porcelain -- scripts/mantine-migration-scope.json
node.exe scripts\check-surface-census.mjs --surface $surface
```

Expected: the hash equals step 2's recorded value; the porcelain output is empty; the restored census contains no
`CollectionsSection … manifest:no` row. **One** transcript carries the before hash, the after hash and the porcelain
line together — Task 812's R11 finding was that two single-valued hash files cannot witness "identical before and
after".

**Step 4 — the AC5 allowlist probe**, run and restored under the same one-transcript witness rule.

All transcripts go to `docs/sessions/evidence/task817/`, BOM-free per §10.6.

### 13.4 Owner-native rule

Every command above runs in native Windows PowerShell. A result from WSL, a Linux VM or a mounted Linux view is an
environment screen, not evidence (`orchestrator-role.md` → Windows-native validation rule); record it as
`MISSING EVIDENCE` with the exact native command instead of reporting it as a result.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's full baseline with both hashes · AC1's pasted GR-1 command and
its output · AC2's node table · AC3's skipped-import accounting for the named six · AC4's tier-3 row with its owner ·
AC5's invalid-entry `FAIL` and its restore witness · AC6's chosen unenrolled surface, why it was chosen, and its
`manifest:no` row · AC7's scope block · AC8's zero-occurrence search for `GR-1 CENSUS COMPLETE` · AC9's planted node
row and blocked line · AC10's two searches, the coverage line and the single restore witness · AC11's two exit-2
messages · AC12's before/after pairs for both existing gates · AC13's `package.json` hunk · AC14's quoted rows and
the byte-identity check on GR-1's `Command` block · AC15's subsection · every command with its real exit code and
transcript path · assumptions · deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` —
`BLOCKED — OWNER DECISION REQUIRED` if §5's `CONFLICT` fires. Sonnet does not self-approve, does not run, emit or
suggest any mutating git command, and updates `docs/backlog.md` with concise current state only.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Can a fresh Sonnet session execute this without chat context? | Yes — every command is in a paste-ready block, every value it must measure is named, and the two facts it must not assume are marked `UNKNOWN` with the command that resolves each. |
| Does this task migrate or enrol anything it flags? | **No.** It measures. `AppImage` stays tier 2 and unmigrated; 813 owns it, and §3.5 records that the backlog's 813 row still miscalls it tier 3. |
| Could the gate be satisfied by weakening it? | Yes, by allowlisting the tier-2 edge to make the demo green — which is why §8 forbids touching the allowlist, R4 reuses `check-rendered-scope.mjs`'s tier-2 rejection, and §5's `CONFLICT` routes a large frontier to the owner. |
| Does it claim GR-1 or GR-3 is enforced? | **No** — R13/AC14. `docs/golden-rules.md:92` gates enforcement on 817 **and** 818; this task lands only the command. |
| Is the stated plant proven able to fire before it is run? | Yes — §13.3 step 1, written because Task 812's inherited plant had already gone stale once. |
| Are the hygiene gates in the command block? | Yes — §13.2, after two consecutive Task 809 passes where their omission from the block produced the defect. |
| Does any AC assert an exit code the current tree cannot produce? | **No** — §12's audit and §3.4 state why, before the fact. |
| Is `check:story-coverage`'s and `check:rendered-scope`'s behaviour protected? | Yes — R9/AC12, with the baseline captured before any code is written. |

## 16. Git handoff — task design (owner-run, do not execute)

Read-only `git status --short` could not be run from this session: the desktop bridge's Linux workspace fails to
start after the 2026-09-08 Windows update, so this block is built from the paths this task design actually wrote.
Check `git status` before pasting.

If `.git/index.lock` exists and no Git process is running, delete that exact file, confirm it is gone, and re-run
`git status --short` before staging.

```powershell
git add "tasks/Sprints/Sprint_75_kickoff_prompt_Task_817_Per_Surface_Census_Command.md" "tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md" "docs/backlog.md"
git commit -m "docs(Task817): kickoff filed - per-surface census command for GR-1; Sprint 75 execution order corrected"
```

No `git push` — a task-design handoff is never authorization for one.
