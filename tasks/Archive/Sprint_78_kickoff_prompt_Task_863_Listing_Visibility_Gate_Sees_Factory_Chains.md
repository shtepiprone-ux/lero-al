# Task 863 — `check:listing-visibility` sees a listings predicate chained through a query-builder factory

**Sprint 78** (hosted by discovery, not goal fit; the owner may move it) · **P2** · **Q4** (the gate is the registered
regression command of a critical flow) · Track B (non-UI) · filed 2026-09-20 by Task 847's review · kickoff written
2026-09-27 · **Status: ✅ `APPROVED WITH NOTES` 2026-09-30 (review 1, §17); R8 held — its recorded text is applied
when the registry is next staged clean (§17.2); review ledger
`docs/reviews/2026-09-30-task863-listing-visibility-factory-chains.review-ledger.json`** (revision 1 followed a first run
`BLOCKED — WRITE PATH NOT CLEAN` at I0; see §16)

Executor: run this file through the `execute-task` workflow. Your strongest permitted completion status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. You never approve, and you never emit or run a mutating Git command.

## 1. Mode and task type

- Mode: `TASK DESIGN` → implementation handoff.
- Task type: **Regression / Critical Flow Coverage** (a detector change to the gate registered for "Listing public
  visibility invariant") + governance script. No UI, no visible text, no database.
- Execution state: `from-scratch`.
- GR-1 / GR-3 / GR-3a / GR-3b / GR-3c: **not applicable** — the task changes no visible surface, no Story and no text a
  user sees. Its only runtime artifact is a Node CLI's console output.

## 2. Objective

Make the gate's extractor follow a `from('listings')` builder that is returned by an arrow factory
(`const listingCount = () => db.from('listings')…`) into every place that factory is **called and chained**, so an
inline public-visibility literal written behind the factory fails the gate exactly as it would written directly on
`from('listings')`. State the false-positive boundary first, allowlist the two legitimate hits this exposes on the
current tree, prove the change with a two-armed plant, and lock the new shapes into `--verify-gate`.

## 3. Verified context (measured 2026-09-27 on win32, Node v22.22.3, unless dated otherwise)

### 3.1 The gate

- `scripts/check-listing-visibility.mjs` (364 lines, `git hash-object` = `6f9ecc13e38e43b0c75759e5ea7186ae86681374`).
  `package.json:101-103`: `check:listing-visibility`, `…:report`, `…:verify` (`--verify-gate`). CI runs the first and
  third in `.github/workflows/governance-pr.yml:179,182`. **FACT.**
- `extractListingsQueryBlocks` (`:98-136`) anchors a block on each line matching `from\(\s*['"]listings['"]\s*\)`,
  then adds (1) immediately following lines starting with `.`, and (2) for a line matching
  `(?:const|let)\s+(\w+)\s*=.*from\(…listings…\)` (`:102`), every **later** line matching
  `` (?:^|\b)${varName}\s*(?:=\s*(?:await\s+)?${varName}\s*\.|\.) `` (`:120-122`). That regex matches `q.eq(` and
  `q = q.eq(` but **never** `listingCount().eq(`: the name is followed by `(`, not `.` — the factory is called before
  it is chained. **FACT** (source read in full).
- Write exclusion (`:130-133`) drops the **whole block** when its joined text contains
  `.update(|.insert(|.upsert(|.delete(`. **FACT.**
- `detectVisibilityViolations` (`:144-168`) checks each non-comment block line against `VISIBILITY_PATTERNS`
  (`:68-78`), reports at most one hit per line (`break`, `:161`), and filters through the path+fingerprint
  `ALLOWLIST` (`:49-59`, 6 entries). The stale-entry check (`:317-331`) re-runs `extractListingsQueryBlocks` without
  the allowlist, so **any change to the extractor also changes staleness**. **FACT.**
- The module runs its scan and calls `process.exit` at import time (`:269-364`); it cannot be imported by another
  script as-is. **FACT** (a design-time import attempt would exit the importer; the retained probe mirrors the
  extractor instead).
- `--verify-gate` today: **20 passed, 0 failed** (13 BAD, 3 GOOD, 4 NO-FP). Measured this session. **FACT.**

### 3.2 The gate is red on `main` today, for a different reason (Task 887)

`npm run check:listing-visibility` measured 2026-09-27: exit **1**, one violation —
`src/modules/listings/actions/contactEvents.ts:50  .in('status', ['active', 'sold', 'rented', 'archived'])`. This is
**Task 887**'s scope (reserved, Sprint 78), not this task's. **FACT.** Consequence for this task: the gate's final exit
code depends on whether 887 has landed when you run it. §12 states the observable for both cases; **do not touch
`contactEvents.ts` and do not allowlist its line** — that is 887's decision (consume the helper or allowlist).

### 3.3 Every arrow factory over `from('listings')` in `src/` today

`git grep -nE "(const|let)\s+\w+\s*=\s*(async\s+)?(\([^)]*\)|\w+)\s*=>.*from\(\s*['\"]listings['\"]" -- src` → exactly
three. **FACT.**

| Factory | Declared | Call sites (read) |
|---|---|---|
| `listingCount` | `src/modules/admin/dashboard/queries.ts:156` | `:157` (`statusCount`, dynamic `status`), `:234-237` (inside `applyPublicVisibility` / `applyPublicEligibleButHidden`), **`:241` `countOf(() => listingCount().eq('status', 'active'))`** |
| `ownListings` | `src/modules/cabinet/statistics/data.ts:270` | `:275` (dynamic `status`), `:278-279`, **`:281` `applyPublicVisibility(ownListings()).gte('expires_at', window.startUtc).lt('expires_at', window.endUtc)`**, `:285-286` (`listing_type`) — line numbers re-measured 2026-09-30 after Task 891 (`12ccef6d0`) moved the block from `:342-359`; the text is unchanged |
| `baseQuery` | `src/modules/listings/components/SimilarListings.tsx:185` | `:65` `let q: any = applyPublicVisibility(baseQuery() as any)` — **before** the declaration line; `q` is then chained with `property_type`, `listing_type`, `id` only (`:66-71`) |

No `function`-declaration factory and no multi-line `=>\n  db.from('listings')` factory exists in `src/` today
(`git grep -B1` over `.from('listings')` lines found no `=>`/`return` predecessor). **FACT.**

### 3.4 Reach of the proposed extension — measured, not assumed

`docs/sessions/evidence/task863/design/factory-reach-probe.mjs` (retained; read-only) mirrors the shipped extractor
byte-for-byte in logic, adds the §10.1 rules (call sites searched across the **whole file**, each call line plus its
`.`-continuation lines, plus variables assigned from a factory call), and prints every visibility-pattern line the
shipped extractor does not reach. Output, re-run 2026-09-30 by the reviewer on win32 v22.22.3 over the tree of §3.6
(the retained `…/factory-reach-probe.out.txt` is the 2026-09-27 run and still shows `data.ts:354`; it is superseded):

```
NEW src/modules/admin/dashboard/queries.ts:241  countOf(() => listingCount().eq('status', 'active')),
NEW src/modules/cabinet/statistics/data.ts:281  applyPublicVisibility(ownListings()).gte('expires_at', window.startUtc).lt('expires_at', window.endUtc),
```

**EXECUTED.** Exactly two new hits; both are legitimate, neither is a public list read:

- `queries.ts:241` — ADM-11's raw active count, used **only** for the consistency check (comment `:239-240`); Task
  847's R3/AC4 explicitly allowed exactly this hit (Sprint 78 plan, 847 row).
- `data.ts:281` — AGT-01 "expiring" count: an expiry **window** on a set already restricted by
  `applyPublicVisibility`, not a visibility predicate (comment `:277`).

The probe also shows the derived-variable rule fires twice with no violation: `statusCount ← listingCount()`
(`queries.ts:157`) and `q ← baseQuery()` (`SimilarListings.tsx:65`). This is **design-time evidence of reach only**;
the executor re-measures with the real gate (§10.2 I0 and §12 AC3).

### 3.5 The reserved row's claim, corrected

`docs/backlog-reserved.md`'s 863 row said "the shipped 847 file must clear it". **CONFLICT with §3.4, resolved here:**
once the extractor reaches factories, the shipped `queries.ts` produces **one** hit (`:241`), and it clears only
through an allowlist entry, which R4 specifies. The reserved row's other measurement (a planted factory predicate →
`[]`, the same predicate on `from('listings')` → 2 violations) is consistent with §3.1's source reading and is
re-proved by the executor's plant (R6).

### 3.6 Worktree (re-measured 2026-09-30, revision 1; read-only `git --no-optional-locks status --porcelain`)

The 2026-09-27 snapshot (15 Task 854 entries) is superseded: 854 landed jointly with 891 on 2026-09-29. On
2026-09-30 the tree carries **Task 893**'s uncommitted work (admin user profile → Mantine, `NEEDS REVISION` revision 2,
not approved): 26 modified/deleted tracked paths and 11 untracked entries, among them
**`docs/critical-flow-registry.md`**. Every 893 entry is `EXCLUDED AS UNRELATED`; the list is not reproduced here,
because it will drift again — **I0 captures the live one**.

The registry is the only §7 path that 893 touches. Its uncommitted diff changes rows `:46`, `:47`, `:53` and `:62`
only; row `:70` ("Listing public visibility invariant") is byte-identical to `HEAD` (reviewer md5 of `HEAD:…` line 70
= working-tree line 70 = `2710250eecb75430da1f35f9fce2b597`). **FACT.** It is still a mixed path: any commit that stages
it ships 893's unreviewed hunks. §7 item 2 and §10.2 route around it.

The gate scans every `.ts`/`.tsx` under `src/`, **including untracked files**, so 893's files are gate input. Reviewer
run 2026-09-30: gate exit 1 with **only** §3.2's `contactEvents.ts:50` line; the probe prints only §3.4's two `NEW`
lines. 893's files therefore add no violation and no reach. **FACT.**

Hash witnesses (2026-09-30): `scripts/check-listing-visibility.mjs` `6f9ecc13e38e43b0c75759e5ea7186ae86681374`
(unchanged since design), `queries.ts` `d263d56baabdeaee6ecd2c04efa7cbd7bbe81339` (unchanged), `data.ts`
`e43f72c30cfdb0a0d396a893818f7cdeb66e5c11` (changed by Task 891, `12ccef6d0`; tracked, unmodified in the worktree).

### 3.7 Downstream consumers of the gate (whole-repo audit)

`git grep -l "check-listing-visibility\|detectVisibilityViolations"` outside `docs/sessions` and `tasks`:
`package.json`, the script itself, `docs/backlog-archive.md`, `docs/backlog-reserved.md`, one review ledger. No other
script imports the detector. The critical-flow registry row "Listing public visibility invariant"
(`docs/critical-flow-registry.md:70`) names the gate and describes its self-test as "7 bad variants + 3 good + 4
no-false-positive" — **already stale** (today 13/3/4). **FACT.**

### 3.8 Cross-task consequences (state them; do not act on them)

- **855** was folded into 890/891. **891** landed on 2026-09-29 and moved the AGT-01 expiring count from `:354` to
  `:281` without changing its text, so R4's fingerprint still matches. A later edit that rewrites that text makes the
  entry stale, and the gate fails **naming the entry** — the intended behaviour; that task then updates or removes it.
  Record this in the session log.
- **893** holds `docs/critical-flow-registry.md` uncommitted (§3.6). R8 is routed by §10.2 step R8.
- **887** decides `contactEvents.ts:50`. Nothing here pre-empts it.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | reserved row; §3.1 | A **factory** is a line matching the existing `assignRe` whose text between `=` and `from(` contains `=>` (arrow; `async` allowed). For each factory name, **every** line in the same file (before or after the declaration, excluding the declaration line) matching `\b<name>\s*\(` is a call site. | P1 | self-test BAD 1–3; plant P1 | Confirmed |
| R2 | §3.1 write-exclusion defect class | Each call site forms **its own** block: the call line plus its immediately following `.`-continuation lines. The write exclusion is evaluated **per call-site block**, so a write through the factory in one place never hides a read with a literal in another. | P1 | self-test BAD 4 + NO-FP 4 | Confirmed |
| R3 | §3.4; existing shape 2 | A variable assigned from a factory call on its call line (`(const\|let) <v>[: type] = …<name>(`) is followed exactly like today's derived variable (`:120-122` regex, whole file). | P2 | self-test BAD 5 | Confirmed |
| R4 | §3.4, §3.5 | `ALLOWLIST` gains exactly two entries, each path + fingerprint + reason: `src/modules/admin/dashboard/queries.ts` / `.eq('status', 'active')` / "ADM-11 consistency check only (Task 847 R3) — raw active head:true count, never displayed, not a public read"; `src/modules/cabinet/statistics/data.ts` / `.gte('expires_at', window.startUtc)` / "AGT-01 expiring window on an applyPublicVisibility set (Task 848) — not a visibility predicate". No other entry is added, removed or edited. | P1 | gate output; diff | Confirmed |
| R5 | reserved row ("state the false-positive boundary first") | These produce **no** hit: a factory call wrapped by a canonical helper with no literal on the chain; a factory chained with a dynamic `status` argument; a factory over another table; a factory call site that writes; a factory declared but never chained with a literal. `head: true` count reads are **not** exempt. | P1 | self-test NO-FP 1–5 + BAD 1 (head:true) | Confirmed |
| R6 | reserved row; Q4 | Two-armed plant on the real `queries.ts`: a genuine factory-chained predicate fails the real gate naming its line; the same file restored clears that line; the pre-plant hash equals the post-restore hash. | P0 | §10.4 P1/P2 | Confirmed |
| R7 | `orchestrator-procedures.md` → "Corollary (Sprint 75)" | Every run (scan, `--report`, `--verify-gate`) prints one scope line naming the shapes covered and the classes it cannot see (§10.3). | P1 | gate output | Confirmed |
| R8 | §3.7; agent-contract 9 | `docs/critical-flow-registry.md:70`'s self-test description states the new BAD/GOOD/NO-FP counts and the factory shape. Nothing else in that row changes. Written by you only if the registry is clean at §10.2 step R8; otherwise delivered as recorded text (AC8 b). | P2 | diff or session-log text | Confirmed |
| R9 | agent-contract 10 | Session log with a "Files Changed" table; `docs/backlog.md` 863 cell updated concisely; `docs/backlog.md` stays ≤ 80 physical lines. | P2 | read-after-write | Confirmed |

## 5. Assumptions and open questions

- **A1 (INFERENCE):** naming call sites across the whole file can over-capture a same-named identifier from another
  scope in the same file. On today's tree it produced no extra hit (§3.4). Accepted as the same trade-off the existing
  shape 2 already makes; stated in the R7 scope line.
- **A2 (INFERENCE):** per-call-site write exclusion is stricter than today's per-block rule for direct chains. It is
  applied **only** to the new factory blocks; shapes 1 and 2 keep their current behaviour (not in scope).
- Open owner questions: **none**. The two allowlist entries use the gate's existing mechanism for justified,
  fingerprinted non-public reads (six such entries exist); no owner-only rule is waived.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (clauses 9, 10, 14, 15) · `docs/rule-index.md` → "Regression /
Critical Flow Coverage" · `docs/qa-profiles.md` (Q4) · `docs/critical-flow-registry.md` row "Listing public visibility
invariant" (`:70`) · `docs/qa-rules.md` · `docs/orchestrator-procedures.md` → "Detector-aware requirements and
migrations", the 818/819 encoding corollary and "Corollary (Sprint 75)" · this kickoff. Nothing else.

## 7. Scope — the exact allowed write set

1. `scripts/check-listing-visibility.mjs` — extractor, allowlist (R4), self-test snippets, scope line.
2. `docs/critical-flow-registry.md` — row `:70` self-test description only (R8), and **only** when the file has no
   uncommitted diff at the R8 step (§10.2). While Task 893's hunks are in it, this path is **read-only** for you and
   R8 is delivered as recorded text instead (§10.2 step R8).
3. `docs/sessions/2026-MM-DD-task863-listing-visibility-factory-chains.md` (new; use the execution date).
4. `docs/sessions/evidence/task863/` — new files only (transcripts, plant witnesses). The `design/` subfolder is
   the orchestrator's and is read-only for you.
5. `docs/backlog.md` — the 863 text inside the reserved-registry row only.

Temporary, restored byte-identical and absent from the final status: `src/modules/admin/dashboard/queries.ts` (plant
P1 only, §10.4).

## 8. Out of scope

- `src/modules/listings/actions/contactEvents.ts` and any allowlist row for it (887).
- Changing shapes 1 and 2's semantics, `VISIBILITY_PATTERNS`, `EXCLUDED_PATH_PATTERNS` or the canonical anchor.
- `function`-declaration factories, cross-module (imported) factories, factories passed as arguments or stored on
  objects: **zero exist today (§3.3)**; they are named blind classes in the R7 line, not implemented.
- Any edit to `queries.ts`, `data.ts` or `SimilarListings.tsx` beyond the restored plant.
- Every path in the I0 start snapshot that is not a §7 path (on 2026-09-30: all of Task 893's), and every
  uncommitted hunk of `docs/critical-flow-registry.md` outside row `:70`.

## 9. Current and required behavior

| | Current (preserve unless listed) | Required after |
|---|---|---|
| Direct chain on `from('listings')` with a literal | fails | unchanged |
| Derived variable `q = q.eq('status','active')` | fails | unchanged |
| `listingCount().eq('status','active')` behind an arrow factory | **passes silently** | fails, naming the line |
| Same, on a `.`-continuation line after the factory call | passes silently | fails |
| Factory wrapped by `applyPublicVisibility(...)` with no literal | passes | passes |
| Dynamic `.eq('status', status)` through a factory | passes | passes |
| Other-table factory with `.gte('expires_at', …)` | passes | passes |
| The six existing allowlist entries | not stale | not stale (the stale check uses the new extractor) |
| `--verify-gate` | 20/0 | old 20 unchanged + the §10.3 additions, 0 failed |
| Console output | no scope statement | one scope line per run (R7) |
| `contactEvents.ts:50` | reported | still reported until 887 lands |

## 10. Implementation requirements

### 10.1 Detector change (R1–R3, R5)

Inside `extractListingsQueryBlocks`, after the existing shape-2 handling for a `from('listings')` line:

1. If the `assignRe` match's text between `=` and `from(` contains `=>`, the captured name is a **factory**.
2. For every line `k` in the file with `k !== i` matching `new RegExp('\\b' + name + '\\s*\\(')`: build a block of
   line `k` plus the immediately following lines matching `/^\s*\./`. Apply `WRITE_METHODS` to **this** block's
   joined text; push it only when that test is false.
3. If line `k` also matches `(?:const|let)\s+(\w+)[^=]*=.*\b<name>\s*\(`, follow that variable name through the whole
   file with the same regex shape as `:120-122` and add its matching lines to that call-site block (then apply 2's
   write test).
4. Keep the function pure and shared by scan, stale check and self-test (one detector, `:9-10`).

Escape nothing by hand into a new regex from user source: factory names come from `\w+`, so they are
regex-safe. Read and write the script through the Edit tool or Node only (818/819 corollary).

### 10.2 Order

I0 → §10.3 self-test snippets first (they must **fail** on the unmodified extractor — record it) → §10.1 → R4
allowlist → R7 scope line → §10.4 plant → step R8 (below) → §13.2 gate block → session log → backlog cell.

**I0 — before any write:**

1. `node.exe -p "process.platform + ' ' + process.version"` → must print `win32`.
2. Capture `git --no-optional-locks status --porcelain` into `docs/sessions/evidence/task863/00-start-status.txt` and
   the SHA-256 of **every entry of that capture** (files: `Get-FileHash`; directories: hash of each file inside) into
   `00-start-manifest.txt`. Then:
   - If `scripts/check-listing-visibility.mjs` or `docs/backlog.md` is modified, a `docs/sessions/*task863*` log
     already exists, or `docs/sessions/evidence/task863/` holds anything besides `design/`, **STOP — `BLOCKED — WRITE PATH NOT CLEAN`**.
   - `docs/critical-flow-registry.md` is **not** a STOP by itself (revision 1). Record in `00-start-manifest.txt`
     whether it is modified, and compare line 70 with `HEAD`:
     `node.exe -e "const cp=require('child_process'),fs=require('fs');const h=cp.execSync('git show HEAD:docs/critical-flow-registry.md').toString().split(/\r?\n/)[69];const w=fs.readFileSync('docs/critical-flow-registry.md','utf8').split(/\r?\n/)[69];console.log(h===w?'ROW70 = HEAD':'ROW70 DIFFERS')"`.
     `ROW70 DIFFERS` → **STOP — `BLOCKED — REGISTRY ROW 70 ALREADY EDITED`**. `ROW70 = HEAD` → continue.
   - `git hash-object` of `queries.ts` and `data.ts` must equal §3.6's 2026-09-30 witnesses; any other value → record
     it and re-read §3.3's line numbers before continuing (do not STOP; §10.4 P0 and I0 step 4 re-measure).
3. Run the gate and self-test unchanged; save both transcripts. Expected today: gate exit 1 with **only** the §3.2
   line (or exit 0 if 887 has landed); self-test 20/0. Any other violation → **STOP** and report it; do not
   allowlist it.
4. Re-run `node.exe docs/sessions/evidence/task863/design/factory-reach-probe.mjs` and save its output as
   `00-probe.txt`. If it prints any `NEW` line other than the two in §3.4 (`queries.ts:241`, `data.ts:281` — compare
   path **and** text; a pure line-number move with identical text is recorded, not a STOP), **STOP —
   `BLOCKED — FACTORY REACH CHANGED`**, list the lines, and allowlist nothing.

**Step R8 — registry, decided at the moment you reach it (revision 1):**

- Run `git --no-optional-locks diff --quiet -- docs/critical-flow-registry.md` and record the exit code.
- **Exit 0 (file clean — Task 893 has landed or its registry change was dropped):** edit row 70's self-test description
  as R8 states. Nothing else in the file.
- **Exit 1 (another task's hunks are present):** do **not** write the file. In the session log add a section
  `## R8 — registry text held (docs/critical-flow-registry.md carries another task's uncommitted hunks)` containing
  the exact current substring of row 70 to replace (today: `7 bad variants + 3 good + 4 no-false-positive`) and the
  exact replacement string, with the counts taken from your final AC1 transcript and the factory shape named. Report
  R8 as `HELD — TEXT RECORDED` in the completion report. This is **not** a deviation and does not lower your status.
  The reviewer applies the recorded text (§12 AC8).

### 10.3 Self-test additions and the scope line

Add to the existing arrays (labels are yours; each snippet's shape is fixed):

| Array | # | Snippet shape | Expected |
|---|---|---|---|
| BAD | 1 | `const listingCount = () => db.from('listings').select('id', { count: 'exact', head: true })` + `const n = await countOf(() => listingCount().eq('status', 'active'))` | detected |
| BAD | 2 | `const base = () => supabase.from('listings').select('*')` + `const { data } = await base()` + next line `  .gte('expires_at', now)` | detected |
| BAD | 3 | `const byOwner = (id) => db.from('listings').select('id').eq('user_id', id)` + `const { data } = await byOwner(uid).in('status', ['active'])` | detected |
| BAD | 4 | factory; one call site `base().update({ status: 'x' }).eq('id', id)`; another `base().eq('status', 'active')` | detected (write in one call site does not hide the other) |
| BAD | 5 | factory; `let q = base()`; `q = q.lt('expires_at', now)` | detected |
| NO-FP | 1 | factory; `countOf(() => applyPublicVisibility(listingCount()))` | clean |
| NO-FP | 2 | factory; `listingCount().eq('status', status)` | clean |
| NO-FP | 3 | `const tokens = () => db.from('email_change_tokens').select('*')` + `tokens().gte('expires_at', now)` | clean |
| NO-FP | 4 | factory; `base().update({ status: 'active' }).eq('id', id)` | clean |
| NO-FP | 5 | factory declared, never called | clean |

Before §10.1, BAD 1–5 must be **MISSED** by the shipped extractor (record the transcript: this is the failing arm of
the self-test itself). After §10.1, all pass.

Scope line (R7), printed first on every run, one line, wording yours, content fixed: it inspects `from('listings')`
blocks in `src/**/*.{ts,tsx}` minus the excluded paths — direct chains, derived variables, and same-file arrow
factories (call sites, their continuation lines, variables assigned from them); it **cannot** see factories declared
with `function`, factories whose `from('listings')` is on a later line than the declaration, factories imported from
another module, passed as arguments or stored on objects, or predicates built with dynamic strings.

### 10.4 Plant — two-armed, hash-witnessed, restored through Node

- P0: `git hash-object src/modules/admin/dashboard/queries.ts` → must equal §3.6's witness (or record the new value if
  a later commit changed it, and re-read `:234-241`).
- P1 (fail arm): through Node, replace line 237's text
  `countOf(() => applyPublicEligibleButHidden(listingCount(), { reason: 'no_expiry' })),` with
  `countOf(() => listingCount().in('status', ['active', 'pending'])),`. Run the gate: it must exit 1 and report
  `src/modules/admin/dashboard/queries.ts:237`.
- P2 (restore): write the P0 bytes back through Node; `git hash-object` must equal P0; run the gate: `:237` absent.

> **Why P1 uses `.in(...)` and not `.eq('status', 'active')` — found at design, stated so it is not discovered
> mid-task.** `isAllowlisted` (`:61-64`) matches by path + substring, not by line. After R4, any line in `queries.ts`
> containing `.eq('status', 'active')` is allowlisted, so a plant with that literal would pass for the wrong reason and
> prove nothing. The `.in(...)` literal is not fingerprinted in that file. Record in the session log that
> path+substring allowlisting cannot tell two identical literals in one file apart — a pre-existing property of the
> gate, **not** changed here.

- P3 (stale arm, after R4 is written): record `git hash-object scripts/check-listing-visibility.mjs`; through Node,
  change only the R4 `data.ts` fingerprint string to `.gte('expires_at', window.startUtcX)`; run the gate (expect the
  entry listed as stale, exit 1); write the recorded bytes back through Node; the hash must equal the recorded value.
  The script's final content is whatever §10.1–§10.3 produce, never the P3 text.

Save every transcript and all hashes under `docs/sessions/evidence/task863/`. `queries.ts` must be absent from the
final `git status --porcelain`.

## 11. Positive and negative flows

**Positive flow.** A developer writes `listingCount().in('status', ['active'])` behind a factory in a public read → CI
`check:listing-visibility` exits 1 naming the file and line → they route it through `applyPublicVisibility`.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Planted factory violation | Yes | R1, R6 | gate exit 1, line named | P1 |
| Restore clears | Yes | R6 | line absent, hash equal | P2 |
| Legitimate non-public factory reads | Yes | R4 | allowlisted, not stale | AC3 |
| Write through a factory | Yes | R2, R5 | not flagged; does not hide a read | BAD 4, NO-FP 4 |
| Stale allowlist after a later edit | Yes | existing `:317-331` | gate fails naming the entry | AC5 (P3) |
| Unrelated red (887) | Yes | §3.2 | reported, untouched | AC4 |
| Authorization/RLS, network, concurrency | No | — | a static CLI | — |

## 12. Acceptance criteria

- **AC1 [R1, R3, R5]** Given the §10.3 snippets, when `npm.cmd run check:listing-visibility:verify` runs on the final
  script, then every original snippet still passes, all ten new snippets produce their expected result, and the
  summary reports 0 failed; the pre-change transcript shows BAD 1–5 as `MISSED`.
- **AC2 [R2]** Given BAD 4 and NO-FP 4, when the self-test runs, then the read with a literal is detected and the
  write-only call site is clean.
- **AC3 [R4]** Given the final tree, when the gate runs, then neither `queries.ts:241` nor `data.ts:281` is reported,
  the allowlist line reads 8 entries, 0 stale, and the diff adds exactly the two R4 entries.
- **AC4 [R4, §3.2]** Given the final tree, when the gate runs, then its violation list is empty if 887 has landed and
  otherwise contains exactly the `contactEvents.ts:50` line; the recorded exit code matches that case (0 or 1).
- **AC5 [R4]** Given plant P3 (§10.4) — the R4 `data.ts` fingerprint temporarily changed to text that line 281 does
  not contain — when the gate runs, then it lists that entry under "Stale allowlist entries" and exits 1; after the
  restore, `git hash-object scripts/check-listing-visibility.mjs` equals the pre-P3 value.
- **AC6 [R6]** Given P0–P2, when the gate runs after P1, then it exits 1 naming `src/modules/admin/dashboard/queries.ts:237`;
  after P2 that line is absent, `git hash-object` equals P0, and `queries.ts` is absent from `git status --porcelain`.
- **AC7 [R7]** Given each of the three modes, when run, then the scope line is printed once, before any result.
- **AC8 [R8, R9]** Given the final docs, when read back, then either (a) the registry was clean at step R8 and row
  70's self-test counts equal AC1's printed counts with no other registry hunk from this task, or (b) it was not, the
  file carries no change from this task, and the session log's `## R8 — registry text held …` section gives the exact
  old substring (present verbatim in row 70) and a replacement whose counts equal AC1's; plus the session log's Files
  Changed table equals the real diff of §7's paths, and `docs/backlog.md` is ≤ 80 physical lines. In case (b) the
  reviewer applies the recorded replacement to row 70 at 863's closure if the registry is clean by then; otherwise
  the closure files it as an active item applied in the first approved commit that stages the registry. R8 is closed
  only when row 70 carries the text.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: none.`

`GR-2 SCOPE STATED — check:listing-visibility inspects from('listings') blocks in non-excluded src files through direct chains, derived variables and (after this task) same-file arrow factories; it cannot see function-declared, multi-line, imported or argument-passed factories, or dynamic predicate strings; AC1–AC6 are closed by the self-test transcript, the gate transcripts and the hash-witnessed plant, never by a green line alone.`

## 13. QA profile and verification plan

**Q4** — the gate is the registered regression command for "Listing public visibility invariant". Evidence: regression
baseline (I0 3), changed-behavior test (self-test before/after), planted-violation failure proof (P1/P2), and
Windows-native transcripts. No owner-native step: the task has no live system. CI (`governance-pr.yml:179,182`) runs
both commands on the PR.

### 13.1 Re-entry

`from-scratch`. On a revision, never re-run I0's baseline over the preserved `00-*` files.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task863"
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run check:listing-visibility:verify *> "$ev\20-verify-final.txt"; "verify exit=$LASTEXITCODE"
npm.cmd run check:listing-visibility *> "$ev\21-gate-final.txt"; "gate exit=$LASTEXITCODE"
npm.cmd run check:listing-visibility:report *> "$ev\22-report-final.txt"; "report exit=$LASTEXITCODE"
npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts *> "$ev\23-visibility-vitest.txt"; "vitest exit=$LASTEXITCODE"
npm.cmd run typecheck *> "$ev\24-typecheck.txt"; "typecheck exit=$LASTEXITCODE"
npm.cmd run lint *> "$ev\25-lint.txt"; "lint exit=$LASTEXITCODE"
npm.cmd run check:file-integrity *> "$ev\26-file-integrity.txt"; "file-integrity exit=$LASTEXITCODE"
npm.cmd run check:mojibake *> "$ev\27-mojibake.txt"; "mojibake exit=$LASTEXITCODE"
npm.cmd run build *> "$ev\28-build.txt"; "build exit=$LASTEXITCODE"
git hash-object scripts\check-listing-visibility.mjs docs\critical-flow-registry.md src\modules\admin\dashboard\queries.ts src\modules\cabinet\statistics\data.ts
git --no-optional-locks status --porcelain
```

Expected: platform `win32`; verify exit 0; gate exit per AC4; report exit 0; vitest exit 0 (66 tests today — report
the real count); typecheck, lint, file-integrity, mojibake and build exit 0; `queries.ts` and `data.ts` hashes equal
their `00-start-manifest.txt` values; `docs/critical-flow-registry.md`'s hash equals its manifest value in case AC8(b);
porcelain = the I0 start snapshot plus only §7's paths. Return every transcript path and the printed exit codes. If a script name
above does not exist in `package.json`, report it as missing evidence — do not substitute another command.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Include: changed files;
requirement IDs completed; each command with its real exit code and transcript path; the I0 manifest and its end
comparison (a changed manifest hash is reported `CHANGED — NOT ATTRIBUTED`, never explained away); the self-test before/after
counts; P0/P2 hashes; the step R8 `diff --quiet` exit code and R8's state (`APPLIED` or `HELD — TEXT RECORDED`);
assumptions, deviations, limitations (including the substring-allowlist property of §10.4) and unresolved issues. Update the 863 cell of `docs/backlog.md` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (≤ 2
lines of text) and write the session log. No Git commands.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh session without chat context | yes — every file, line, regex and snippet is in this file |
| Every requirement has an AC and a verification | R1–R9 → AC1–AC8 |
| Current behavior preserved and named | §9 |
| Detector feasibility proven before publication | §3.4 probe (EXECUTED); §10.4 allowlist interaction found at design, not left to the executor |
| Two-armed plant that can demonstrably fail | P1 uses a literal R4 does not fingerprint |
| Dirty worktree handled | I0 2 live manifest, step R8, AC6/AC8/§13.2 comparator |
| Unrelated red gate not absorbed | §3.2, AC4, §8 |
| Owner decisions needed | none |

## 16. Revision 1 — 2026-09-30 (review of the first run's `BLOCKED` report)

The first executor run stopped correctly at I0 step 2 and wrote nothing: `docs/critical-flow-registry.md`, a §7 path,
carried Task 893's uncommitted edits to rows `:46`, `:47`, `:53` and `:62`. The reviewer confirmed that and found a
second stale fact the run never reached: Task 891 (`12ccef6d0`, 2026-09-29) moved `data.ts`'s AGT-01 expiring count
from `:354` to `:281`, so I0 step 4 as written would have stopped on `FACTORY REACH CHANGED`.

The executor's options 1 and 3 are not used. Option 1 (commit 893 first) is not available: 893 is `NEEDS REVISION`,
and an implementation is committed only after an approved review. Option 3 (edit row 70 over 893's diff) would make
the registry a mixed path, and any approved commit staging it would ship 893's unreviewed hunks to `main`. Option 2 is
adopted in a form that does not wait for 893.

Amended: header status · §3.3 (`ownListings` lines) · §3.4 (probe re-run, `data.ts:281`) · §3.6 (worktree, hash
witnesses) · §3.8 (855/891, 893) · §7 item 2 · §8 · §10.2 order, I0 steps 2 and 4, new step R8 · §12 AC3, AC5, AC8 ·
§13.2 expected · §14 · Appendix C. **Re-entry:** `from-scratch`. The first run produced no evidence files, so there is
nothing to preserve.

## 17. Review 1 — 2026-09-30 — ✅ `APPROVED WITH NOTES`

### 17.1 Reviewer evidence (win32, Node v22.22.3)

The reviewer re-ran the checks on the final tree and got the following results.

- **Hashes:** `git hash-object` gives script `f5d50aab7f9c423c07a3e8394dddc96666e44dec` (equal to the P3 witness),
  `queries.ts` `d263d56b…` and `data.ts` `e43f72c3…`, both unchanged.
- **Self-test and gate:** `--verify-gate` passes 30/0. The gate exits 1 with only `contactEvents.ts:50` (AC4) and
  prints `Allowlist: 8 entries, 0 stale.`
- **Registry:** the row-70 comparator prints `ROW70 = HEAD`. The recorded old substring occurs exactly once in the file.
  The registry diff contains only 893's hunks (`:46-47`, `:53`, `:62`).

The reviewer also ran an adversarial probe on a scratch copy of the detector, cut before the scan section:

- A factory write that carries a literal stays excluded.
- A call inside a multi-line arrow argument, a derived variable reassigned inside `if`, and an `async` factory are all
  detected.
- `database()` is not taken for a call of `base`.
- A non-factory `map((id) => …from('listings'))` produces no block and no crash.

Findings. Neither is blocking, and both are carried as one unnumbered follow-up in `docs/backlog.md`:

- **N1 (P3).** NO-FP 4 (`base().update({ status: 'active' }).eq('id', id)`) carries no visibility literal. It
  therefore passes whether or not the per-call-site write exclusion exists. The snippet shape is this kickoff's
  (§10.3), not the executor's. The exclusion works (probe case A), but no self-test arm locks it.
- **N2 (P3).** If one file declares two arrow factories with the same name, every call site is reported once per
  declaration, so it appears twice. This over-reports and never misses. No such file exists today.

The `Allowlist: N entries, K stale.` line that failing runs now print is an addition the executor disclosed. It is
accepted, and it is what evidences AC3 while 887 keeps the gate red.

### 17.2 R8 — carried, not closed

At closure, `docs/critical-flow-registry.md` still carries Task 893's uncommitted hunks, and 893 is awaiting review.
Under AC8(b), R8 is carried as an active item on 893's `docs/backlog.md` row. It must be applied in the first approved
commit that stages the registry. The step is to replace, in row 70,
`gate self-test (7 bad variants + 3 good + 4 no-false-positive)` with the replacement recorded verbatim in
`docs/sessions/2026-09-30-task863-listing-visibility-factory-chains.md` §6 (18 / 3 / 9, plus the factory shape).

## Appendix A — Evidence preflight (task design)

| Claim | Evidence | Classification |
|---|---|---|
| Extractor cannot follow a called factory | `check-listing-visibility.mjs:98-136` read in full | VERIFIED |
| Gate red today on 887's line only | gate run 2026-09-27, exit 1 | VERIFIED (EXECUTED) |
| Self-test 20/0 today | `--verify-gate` run 2026-09-27 | VERIFIED (EXECUTED) |
| Exactly three arrow factories in `src/` | `git grep` §3.3 | VERIFIED |
| Extension adds exactly two hits | retained probe, §3.4 | VERIFIED (EXECUTED, mirror of the extractor) — re-measured with the real gate at AC3 |
| Allowlist is path+substring, not line | `:61-64` | VERIFIED; its consequence for P1 recorded in §10.4 |
| Registry self-test counts stale | `critical-flow-registry.md:70` vs today's 13/3/4 | VERIFIED (re-read 2026-09-30: row 70 still says "7 bad variants + 3 good + 4 no-false-positive") |
| `data.ts` fingerprint survives Task 891 | `data.ts:281` holds `.gte('expires_at', window.startUtc)`; probe re-run 2026-09-30 | VERIFIED (EXECUTED) |
| Registry held by 893 only outside row 70 | `git diff -U0` hunks `:46-47`, `:53`, `:62`; row-70 comparator prints `ROW70 = HEAD` | VERIFIED (EXECUTED 2026-09-30) |
| Falsification attempted | a write in one call site hiding another (BAD 4); a call site above the declaration (`SimilarListings.tsx:65`, reached by the probe) | EXECUTED (probe) / ANALYTICAL (BAD 4 until the executor runs it) |

## Appendix B — Rule-compliance ledger

| Rule | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `qa-profiles.md` Q4 | critical-flow gate | baseline + changed-behavior + planted failure | I0 3, AC1, AC6 | COMPLIANT |
| `agent-contract.md` 9 | non-Q0 | final `npm run build` exit 0 | §13.2 | COMPLIANT |
| `agent-contract.md` 14 | touched text files | UTF-8 no BOM, Node/Edit writes | §10.1, §10.4 | COMPLIANT |
| `agent-contract.md` 15 | critical flow | automated regression proof | AC1, AC6 | COMPLIANT |
| `orchestrator-procedures.md` detector-aware | detector change | feasibility proven before publishing | §3.4 | COMPLIANT |
| Corollary (Sprint 75) | narrowed detector | print blind classes every run | R7, AC7 | COMPLIANT |
| 818/819 encoding corollary | plant/restore | Node I/O + hash witness | §10.4, AC6 | COMPLIANT |
| Probe/permanent-artifact rule | plant in production file | restoration evidence required | AC6 | COMPLIANT |
| GR-1/3/3a/3b/3c | visible UI only | — | §1: no visible surface | NOT APPLICABLE |
| `critical-flow-registry.md` | row describes the gate | keep it true | R8 | COMPLIANT |

## Appendix C — Execution contract

| Field | Value |
|---|---|
| Active route | one: extend the extractor + two fingerprinted allowlist entries |
| Decision source | this kickoff; no owner decision required |
| Starting worktree | dirty with manifest (§3.6, I0 2); the registry may be held by another task (step R8) |
| Final write set | §7 items 1–5 |

| # | Checkpoint | Producer / artifact | Comparator and failure |
|---|---|---|---|
| 0 | I0 | `00-*` files | non-`win32`, a dirty §7 path other than the registry, `ROW70 DIFFERS`, extra violation or extra probe hit → `BLOCKED` |
| 1 | Self-test arms first | verify transcript before §10.1 | BAD 1–5 not `MISSED` → the snippet is wrong; fix the snippet |
| 2 | Detector | verify transcript after | any failure → `PARTIALLY IMPLEMENTED` |
| 3 | Allowlist | gate transcript | an R4 line still reported, or any stale entry → fix before continuing |
| 4 | Plants | P0–P3 transcripts + hashes | P1 or P3 not failing, or a restore hash ≠ its pre-plant hash → `BLOCKED` |
| 5 | Final gates | §13.2 | any non-zero exit other than AC4's 887 case → `PARTIALLY IMPLEMENTED` |
| 6 | Manifest end | end hashes vs `00-start-manifest.txt` | any change → `CHANGED — NOT ATTRIBUTED`, reported |

| Counterexample | Result |
|---|---|
| Extra required path | none — 887's line is excluded by AC4 |
| Valid empty vs missing baseline | the 887-landed case (exit 0) is a valid state, distinct from a missing transcript |
| New gate no-op | BAD 1–5 must be `MISSED` before the change (checkpoint 1) |
| Task-created artifact scanned | evidence files live under `docs/`, outside the `src/` scan root |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-27)

Moved out of `docs/backlog-reserved.md` when this kickoff was written, per the reserved-number preflight. §3.5 corrects its claim that the shipped 847 file clears the extended gate without an allowlist entry.

| # | State | What |
|---|---|---|
| **863** | reserved 2026-09-20 — **Sprint 78** (hosted by discovery, not goal fit; the owner may move it), **P2**, filed by Task 847's review | **`check:listing-visibility` cannot see a listings predicate that is chained through a query-builder factory, and Task 847 is the first module written that way.** The gate is the registered regression command for the critical flow "Listing public visibility invariant" (`docs/critical-flow-registry.md`). Measured 2026-09-20 with the gate's **own** exported detector (`detectVisibilityViolations`, `scripts/check-listing-visibility.mjs:145`), run against the real `src/modules/admin/dashboard/queries.ts` on win32/Node 22.22.3: the shipped file → `[]`; the same file with a genuine inline public-visibility predicate planted through the factory (`countOf(() => listingCount().eq('status','active').gte('expires_at', …))`) → **still `[]`**; the identical predicate written directly on `from('listings')` → **2 violations** (`.eq('status','active')` and `.gte('expires_at', …)`). Cause: `extractListingsQueryBlocks` (`:104`) anchors a block on the line containing `from('listings')` and then follows only (a) continuation lines starting with `.`, or (b) a derived **variable**, via `` `(?:^|\b)${varName}\s*(?:=\s*(?:await\s+)?${varName}\s*\.|\.)` `` (`:122`) — which matches `q.eq(` but never `listingCount().eq(`, because the factory is *called* before it is chained. Any `const x = () => db.from('listings')…` factory is therefore outside the gate's reach. **847 itself is correct** (ADM-08/09/11 take their predicate only from the canonical helpers; its `queries.ts:241` raw-active count is the one hit R3/AC4 explicitly allows, for the ADM-11 consistency check), so this is a **detector** defect, not an implementation defect — the same family as **743**, **797** and **700**'s F1: the rule that makes a gate precise is the rule that makes it blind. Deliverable: extend the block extractor to arrow/function factories that return a `from('listings')` builder, **state the false-positive boundary first** (a factory that is never chained with a visibility literal must not fire; `head:true` count queries are still reads and must be covered), and prove it with a two-armed plant — the planted factory predicate above must fail the gate, and the shipped 847 file must clear it. Add the passing arm to `--verify-gate`'s `BAD_SNIPPETS`/good-snippet sets so the coverage cannot regress silently. **Re-measure at execution; do not cite these counts.** |
