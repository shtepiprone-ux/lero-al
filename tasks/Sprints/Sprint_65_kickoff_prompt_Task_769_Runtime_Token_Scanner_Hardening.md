# Task 769 — Runtime-token scanner hardening: fail-closed TSX inputs and Mantine theme ownership

**Sprint:** 65 — Homepage finishes the Tailwind exit (`tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md`)
**Status:** `FILED — ready for executor`
**Priority:** P1 · **QA profile:** `Q1 Targeted`
**Supersedes:** `Codex-tasks/Task_769_Runtime_Token_Scanner_Hardening.md` (candidate brief; this kickoff is the executable form and corrects two of its clauses — see §5)

## 0. Owner decision D65-F — DECIDED 2026-08-26

The candidate brief contradicted itself on how far the new Mantine-theme ownership exception reaches: its §1
scoped it to "a scanned TSX style/styles expression", while its §3.2 said to pass the set into "the existing
ownership classifier", which is global. The orchestrator measured the consequence and put it to the owner.
Recorded verbatim, 2026-08-26:

> Глобально в `classifyName`. `theme.ts` є джерелом власності ключа, а не особливістю TSX-синтаксису. Той самий
> `--button-padding-x` не повинен бути external у TSX і Tailwind debt у CSS-модулі. Verify-gate має містити
> окремий module-CSS plant для цього правила.
>
> Усі 9 не-`--mantine-` literal keys. **Уточнюю попередню межу**: після рішення застосовувати виняток глобально,
> обмеження лише vars callbacks вже нелогічне. Два ключі з `styles` також реально оголошені Mantine theme і мають
> ту саму ownership-семантику. Extractor має AST-ом брати лише literal custom-property keys у Mantine `vars` і
> `styles`, не довільні рядки чи коментарі з `theme.ts`. `--mantine-color-default-border` не потрібен у наборі —
> його вже покриває чинне правило префікса.

**Operative form.** The exception is applied in `classifyName`, globally, for every scan arm. Its source set is the
nine non-`--mantine-` literal custom-property keys declared in `theme.ts`'s Mantine `vars` and `styles` objects,
extracted through the TypeScript AST. The second paragraph explicitly refines the first: the interim "only 7 keys
from `vars` callbacks, `styles` keys out of scope" wording is **superseded** and must not be implemented. There is
one active route; §10 is it.

D65-F authorises exactly this. It does not authorise widening `TSX_FILES_REL`, treating arbitrary `style`/`styles`
values as declarations, or any other new ownership source.

## 1. Mode and task type

Implementation task, control/governance category. It changes one gate script and one documentation section. It
changes no rendered code, no Storybook story, no CSS, no token value, no route, and no consumer.

This is the third step of Sprint 65's strict sequence `766 → 767 → 768 → **769** → 770 → 771`. It hardens the
Task-767 detector **before** Task 770 asks that detector to reason about a wider `@theme inline` surface. It is not
a consumer migration, a route inventory, or a Level-3 token task.

## 2. Objective

Close the two P2 defects the Task 767 review recorded against `scripts/check-tailwind-runtime-tokens.mjs`, which
that review's own text directed to be filed together as one narrow scanner-hardening task:

- **F3 — the gate fails open on a missing configured TSX input.** A renamed or deleted entry in `TSX_FILES_REL`
  silently halves the scan denominator and still exits 0.
- **F2 — a Mantine-theme-declared custom property is classified as Tailwind debt.** `classifyName`'s
  bucket-3-by-elimination fallback attributes any name it cannot place to Tailwind; names the project's own Mantine
  theme declares at runtime are placed there wrongly.

Both are one defect surface — the detector's ownership model — and ship together.

## 3. Verified context

Every row below was inspected by the orchestrator on `6b43b9676` (`main`, 2026-08-26) and is `FACT`. Line numbers
are from that revision.

### 3.1 The gate as it ships today

| Fact | Evidence |
|---|---|
| `TSX_FILES_REL` is a closed two-entry list | `scripts/check-tailwind-runtime-tokens.mjs:186-189` → `'src/app/[locale]/page.tsx'`, `'src/components/shared/HeroSearchView.tsx'` |
| A missing configured TSX input is skipped silently | `:561` → `if (!existsSync(absPath)) continue;` inside the `for (const absPath of tsxFiles)` loop |
| A missing `globals.css` is fatal — the asymmetry F3 names | `:525-527` → `return { fatal: \`globals.css not found at ${globalsPath}\` };` |
| A parse failure of `globals.css` is fatal | `:529-531` → `0 owned custom properties parsed … parse failure, not a vacuous pass` |
| Module-CSS inputs are gathered by directory walk, so a rename there never loses coverage | `collectModuleCssFiles(srcDir)` at `:539` |
| The classifier ends in a Tailwind-by-elimination fallback | `:319` `classifyName(name, ownedSet, tailwindOwnedNames, localDeclaredNames = new Set())`; `:325` `return 'tailwind';` |
| TSX findings are classified with an empty local set | `:461` `scanTsxFile(absPath, ownedSet, tailwindOwnedNames)`; `:480` `classifyName(name, ownedSet, tailwindOwnedNames, emptyLocal)` |
| The module header justifies that empty set with "a TSX file declares no CSS custom property of its own" | `:317` (comment block above `classifyName`) |
| `runScan` takes `globalsPath`, `srcDir`, `tsxFiles`, `pathRoot` — and **no** theme path | `:519-524` |
| `--verify-gate` today runs 3 plants + 1 control | `:679-683` header comment; `runVerifyGate` at `:792-807`; banner text `3 plants exit 1, 1 control exits 0` |
| The self-test copies the **whole** `src/` into a fresh temp dir | `setupTempTree` `:685-694` → `cpSync(resolve(ROOT, 'src'), srcDir, { recursive: true })` |
| `evaluateTree` recomputes the verdict and returns `exitCode` without calling `process.exit` | `:702-718` |
| The shipped gate is green | `npm run check:tailwind-runtime-tokens` → exit 0, `scanned 25 src/**/*.module.css file(s) + 2 runtime TSX file(s)`, `Tailwind-owned references found: 0 \| baseline entries: 0` |

### 3.2 The Mantine theme source

`src/design-system/mantine/theme.ts` declares **ten** distinct literal custom-property keys. Measured by AST-free
line scan with enclosing-key resolution, then confirmed by reading each site:

| Key | Sites | Enclosing Mantine key |
|---|---|---|
| `--button-color` | `:288`, `:293` | `vars` |
| `--button-bg` | `:292` | `vars` |
| `--button-bd` | `:294` | `vars` |
| `--button-padding-x` | `:295` | `vars` |
| `--button-hover` | `:296` | `vars` |
| `--progress-size` | `:594` | `vars` |
| `--slider-track-bg` | `:708`, `:712` | `vars` |
| `--sc-label-color` | `:445` | `styles` |
| `--table-border-color` | `:801` | `styles` |
| `--mantine-color-default-border` | `:488`, `:495` | `styles` — **excluded**, already covered by the `--mantine-` prefix rule (`EXTERNAL_PREFIXES`, `:191`) |

**The required set is the nine non-`--mantine-` keys.** Seven come from `vars`, two from `styles`. D65-F makes both
kinds members.

### 3.3 Why this is a real misclassification, not a hypothetical

`FACT`, measured 2026-08-26: **none** of the nine names is declared in `src/app/globals.css`, and none is declared
in `node_modules/tailwindcss/theme.css` or `index.css`.

```
--progress-size        globals.css_decls=0  tailwind_decls=[none]
--button-padding-x     globals.css_decls=0  tailwind_decls=[none]
--button-padding-y     globals.css_decls=0  tailwind_decls=[none]   ← declared NOWHERE, incl. theme.ts
--slider-track-bg      globals.css_decls=0  tailwind_decls=[none]
--sc-label-color       globals.css_decls=0  tailwind_decls=[none]
--table-border-color   globals.css_decls=0  tailwind_decls=[none]
```

`INFERENCE` from those facts plus `:319-325`: every one of the nine reaches `classifyName`'s bucket-3 fallback
today and is classified `tailwind`. The fix therefore genuinely moves them from `tailwind` to `external`; it is not
a no-op dressed as a repair.

### 3.4 The F2 proof site

`src/components/shared/AgentCtaButton.tsx:24` reads `paddingInlineStart: 'var(--button-padding-x)'` inside a
`styles={{ root: { … } }}` expression. `src/design-system/mantine/theme.ts:295` declares
`'--button-padding-x': '1rem'` inside the Button component's `vars` callback. `AgentCtaButton` is imported at
`src/app/[locale]/page.tsx:10` and rendered at `:82`, so it is in the Homepage render graph — but it is **not** in
`TSX_FILES_REL`, which is why the shipped scan reports 0 findings today.

`AgentCtaButton` is a negative control supplied explicitly to `runScan` inside a temp copy. It is **not** added to
the scanner's input list by this task.

### 3.5 One measured boundary the fix creates

`src/components/shared/HeroSearchView.module.css:33` contains the text `var(--button-padding-x)` inside a `/* … */`
documentation block (inspected: the line begins ` * ` within a block comment opened above `:29`). The scanner strips
CSS comments before scanning, so it is invisible today.

`INFERENCE`: after this task, that name is `external` anyway. A future regression in comment stripping would
therefore no longer be caught by *this* name at *this* site. The loss is real but small — comment stripping is
independently exercised by every other name in the corpus — and it must be recorded in §23.7 rather than left
undocumented. It is not a reason to narrow D65-F.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Task 767 ledger F3 | Every entry in `TSX_FILES_REL` is resolved and asserted to exist **before** any TSX file is scanned. If one or more are absent, `runScan` returns `{ fatal }` naming every missing path in repository-relative form. | P0 | AC3, AC7 case 5 | Confirmed |
| R2 | Task 767 ledger F3 | Default, `--report` and `--verify-gate` all convert that fatal into a non-zero process exit. No mode may print the fatal and exit 0. | P0 | AC3 | Confirmed |
| R3 | Task 767 ledger F2 + D65-F | `classifyName` classifies a name declared by the project's Mantine theme as `external`, **before** the bucket-3 Tailwind-by-elimination fallback, in every scan arm. | P0 | AC4, AC7 cases 6-8 | Confirmed |
| R4 | D65-F | The Mantine-theme name set is extracted from `src/design-system/mantine/theme.ts` through the TypeScript compiler API, taking only literal custom-property keys inside Mantine `vars` and `styles` objects. Arbitrary strings, comments, computed keys and template literals are not members. | P0 | AC4, AC5 | Confirmed |
| R5 | D65-F | The extracted set equals exactly the nine names of §3.2 on the current tree. It contains `--button-padding-x` (the proof key). It does not contain `--mantine-color-default-border`. | P0 | AC5 | Confirmed |
| R6 | Sprint 65 §3 rule 1 | A missing, unreadable or unparsable `theme.ts` is fatal. An extracted set that does not contain the proof key is fatal. Neither may degrade to an empty set and a green run. | P0 | AC6, AC7 case 10 | Confirmed |
| R7 | Sprint 65 §3 rule 1 | `--verify-gate` asserts all ten outcomes of §10.4 in copied trees, each with its actual exit code and decisive file/line/property or fatal message printed. No plant touches the real worktree. | P0 | AC7 | Confirmed |
| R8 | Sprint 65 §3 rule 2 | No `design-tokens-allow:` marker, allowlist row, baseline row, prefix shortcut or skip marker is added. The Mantine set is evidence-derived from `theme.ts`, not enumerated by hand and not matched by a `--button-`-style prefix. | P0 | AC8, AC7 case 8 | Confirmed |
| R9 | Task 767 acceptance | The shipped scan's observable output is unchanged on the current tree: exit 0, 25 module-CSS files, exactly 2 runtime TSX files, 0 references found, 0 baseline entries, 0 stale, 0 dynamic violations. | P1 | AC9 | Confirmed |
| R10 | Agent contract §6 | `docs/design-system.md` §23.7 states the closed TSX input boundary, the fatal missing-input rule, the Mantine theme-vars ownership source with its nine names, and the §3.5 comment-stripping boundary. | P1 | AC10 | Confirmed |
| R11 | `create-task` skill | `runScan` accepts the theme path as a parameter so the self-test can point every case at its own copied `theme.ts`. The real `theme.ts` is never read by a temp-tree case. | P1 | AC7 cases 6-8, 10 | Confirmed |
| R12 | Agent contract §10 | Session log, concise backlog state, and a `Files Changed` table matching the real diff. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Never self-approve. | P1 | AC11 | Confirmed |

## 5. Assumptions and open questions

**Corrections this kickoff makes to the candidate brief** (`Codex-tasks/Task_769_Runtime_Token_Scanner_Hardening.md`):

1. Its §1/§3.2 contradiction on the exception's reach is resolved by **D65-F**: global in `classifyName`.
2. Its "under Mantine vars object/callback returns" wording yields seven keys and silently drops
   `--sc-label-color` and `--table-border-color`. D65-F's second paragraph supersedes it: **nine** keys, `vars`
   **and** `styles`. An executor implementing the brief's literal wording would fail AC5.
3. Its §4 table lists seven verify-gate outcomes. D65-F adds a module-CSS plant; Sprint 65 §3 rules 1-2 require the
   two further controls of §10.4 cases 8 and 10. The required count is **ten**.

**Assumptions** (labelled; each is cheap to reverse):

- `A1` — `typescript@^5` is a resolvable dependency and `scanTsxFile` already imports the compiler API, so reading
  `theme.ts` through the same API adds no new dependency. `FACT` for the dependency (`package.json`), `INFERENCE`
  for "no new dependency" until the executor's §10.0 run confirms the import resolves.
- `A2` — the nine-name set is stable for the duration of this task. It is re-measured in §10.0; drift is a stop
  condition (§11.1), not licence to widen.

**Open questions:** None. `UNKNOWN`: none. `CONFLICT`: none — the brief's internal contradiction is closed by D65-F.

**Not folded in, deliberately.** Task 767 ledger findings F5 (JSX spread attributes are an undocumented blind spot),
F6 (`evaluateTree` reimplements `run()`'s verdict rule), F7 (`check:tailwind-runtime-tokens:verify-gate` is
registered but appears in no workflow) and Task 766 F1 (same shape, on the sibling gate) remain **open and
unnumbered**. `Codex-tasks/README.md` routes the CI-wiring pair to a separate implementation task. F5 and F6 are
scanner-internal and would be reasonable to fold, but neither is authorised by D65-F and neither is required to make
F2/F3 safe. The executor must not fix them opportunistically; the reviewer must not treat their absence as a defect.

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read "all docs".

1. `docs/agent-contract.md` — P0 invariants 1, 2, 9, 10, 14.
2. `docs/rule-index.md` → "Always Required" and "Docs / Governance / Task Template".
3. `docs/qa-profiles.md` → the `Q1 Targeted` row and "Approval impact".
4. `docs/backlog.md` — current state and the 769 registry row.
5. `tasks/Sprints/Sprint_65_Homepage_Finishes_The_Tailwind_Exit.md` — §2 goal and exit criteria, §3 binding rules
   1 and 2, §5 decisions D65-A and D65-F, §8 what the sprint does not authorise.
6. `docs/reviews/2026-08-26-task767-homepage-runtime-token-exit.review-ledger.json` — findings F2, F3 verbatim;
   they are the source of this task's requirements.
7. `docs/design-system.md` §23.7 (lines 1197-1377) — the section this task amends.
8. `scripts/check-tailwind-runtime-tokens.mjs` — the whole file, header comment included.

Not required, and not to be treated as authority over this kickoff:
`Codex-tasks/Task_769_Runtime_Token_Scanner_Hardening.md` (superseded candidate; see §5).

## 7. Scope

Exactly two files may change:

| Path | Permitted change |
|---|---|
| `scripts/check-tailwind-runtime-tokens.mjs` | §10.1, §10.2, §10.3, §10.4 and the header-comment updates §10.5 requires |
| `docs/design-system.md` | §23.7 only, per R10 |

Plus the three records every task writes: the session log under `docs/sessions/`, its evidence directory, and the
concise `docs/backlog.md` state line.

## 8. Out of scope

Do not change, for any reason, including "while I was there":

- `TSX_FILES_REL` — its two entries are the fixed input list. Widening it is a **new owner decision**, not a fix.
- `src/design-system/mantine/theme.ts`, `src/components/shared/AgentCtaButton.tsx`, or any other consumer.
- `src/app/globals.css`, any token value, any `@theme inline` declaration, any Tailwind alias.
- `tailwind-runtime-token-baseline.json` — it is empty and must stay empty.
- `package.json` (no new script, no dependency), `.github/workflows/**` (F7/766-F1 are a separate task), any
  Storybook source or story, any screenshot policy or command.
- The module-CSS directory walk, the `--mantine-`/`--tw-` prefix rules, the Tailwind `theme.css`/`index.css`
  ownership source, deprecated-block stripping, project-owned resolution from `globals.css`, or module-local CSS
  declaration handling. All keep their current behaviour exactly.
- Task 767 ledger findings F5, F6, F7 and Task 766 F1 (§5).

No screenshot command is run for this task. It changes no rendered code.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Missing configured TSX input | skipped; `tsxFilesScanned` silently drops to 1; exit 0 | `{ fatal }` naming every missing repo-relative path; non-zero exit in all three modes |
| Missing `globals.css` | `{ fatal }` | unchanged |
| Missing/unparsable `theme.ts` | not read at all | `{ fatal }` |
| Extracted Mantine set missing the proof key | n/a | `{ fatal }` |
| `--button-padding-x` read from a scanned TSX file | classified `tailwind` (bucket 3) | classified `external` |
| `--progress-size` read from a scanned `.module.css` | classified `tailwind` (bucket 3) → new debt, exit 1 | classified `external` → no finding, exit 0 |
| `--button-padding-y` read from a scanned `.module.css` | classified `tailwind` → new debt, exit 1 | **unchanged** — still new debt, exit 1 |
| Shipped scan on the current tree | exit 0, 25 module-CSS + 2 TSX, 0 found, 0 baseline, 0 stale, 0 dynamic | byte-identical |
| `--verify-gate` | 3 plants + 1 control | 10 asserted outcomes (§10.4) |

**Negative flow:** the only branching this task introduces is fail-closed input validation. The applicability table:

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation (missing/unparsable gate input) | **Yes** | `runScan` input contract, `:525-531` precedent | `{ fatal }` + non-zero exit in every mode | AC3, AC6, AC7 cases 5 and 10 |
| Validation (extracted set vacuous) | **Yes** | R6 | `{ fatal }`, never an empty set and a green run | AC6, AC7 case 10 |
| Authorization / RLS | No | No route, action, or data access in a CLI gate script | N/A | — |
| Offline / network | No | The script reads only local files and `node_modules` | N/A | — |
| Concurrent writer | No | Read-only single-pass scan; the only writes are into `mkdtemp` copies torn down in `finally` | N/A | — |
| Localization | No | No user-facing string; console output is developer-facing English, as the whole `scripts/` tree already is | N/A | — |

## 10. Implementation requirements

### 10.0 Mandatory first action — prove the tree and re-measure, before any source edit

Run these read-only, from the project root, and paste every result into the session log:

```powershell
node.exe -p process.platform
git --no-optional-locks status --short --branch
git --no-optional-locks log -1 --oneline
git --no-optional-locks diff --quiet 6b43b9676..HEAD -- scripts/check-tailwind-runtime-tokens.mjs; "scanner unchanged since 769 filing: exit=$LASTEXITCODE"

npm.cmd run check:tailwind-runtime-tokens;             "exit=$LASTEXITCODE"
node.exe scripts/check-tailwind-runtime-tokens.mjs --report; "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens:verify-gate; "exit=$LASTEXITCODE"

rg -n 'TSX_FILES_REL|existsSync\(absPath\)|export function classifyName|emptyLocal|export function runScan|function setupTempTree' scripts/check-tailwind-runtime-tokens.mjs
rg -n -- '--button-padding-x' src/components/shared/AgentCtaButton.tsx src/design-system/mantine/theme.ts
node.exe -e "const fs=require('fs');const L=fs.readFileSync('src/design-system/mantine/theme.ts','utf8').split(/\r?\n/);const s=new Set();L.forEach(l=>{for(const m of l.matchAll(/'(--[a-z0-9-]+)'\s*:/g))s.add(m[1])});const a=[...s].filter(n=>!n.startsWith('--mantine-')).sort();console.log(a.length, JSON.stringify(a))"
```

**Expected (§3), exactly:**

- platform `win32`; branch `## main...origin/main`; `HEAD` at or after `6b43b9676`; the scanner byte-unchanged since filing (exit 0).
- `check:tailwind-runtime-tokens` exit 0 — `25 src/**/*.module.css file(s) + 2 runtime TSX file(s)`,
  `Tailwind-owned references found: 0 | baseline entries: 0`, `0 new debt, 0 stale baseline entries, 0 dynamic-name violations`.
- `--report` exit 0 — `module-css: 0 pair(s) / 0 use(s)`, `runtime-tsx: 0 pair(s) / 0 use(s)`, `TOTAL: 0 pair(s) / 0 use(s)`.
- `--verify-gate` exit 0 — `4/4 verify-gate assertions behaved as expected (3 plants exited 1, 1 control exited 0)`.
- `TSX_FILES_REL` at `:186-189` with exactly two entries; `if (!existsSync(absPath)) continue;` still present.
- `AgentCtaButton.tsx:24` reads `var(--button-padding-x)`; `theme.ts:295` declares it.
- The theme key probe prints **`9`** and exactly:
  `["--button-bd","--button-bg","--button-color","--button-hover","--button-padding-x","--progress-size","--sc-label-color","--slider-track-bg","--table-border-color"]`

Any deviation is a stop condition (§11). Do not turn a count drift into a broader scan.

### 10.1 Fail closed on configured TSX inputs (R1, R2)

In `runScan`, **before** the TSX scan loop, resolve every configured input and collect the missing ones:

- If any are absent, `return { fatal: … }` naming **every** missing path, repository-relative, forward-slashed —
  not just the first.
- Delete `if (!existsSync(absPath)) continue;`. The loop no longer needs it; leaving it is a silent second skip path.
- `tsxFilesScanned` must remain an invariant equal to `tsxFiles.length` on a successful run, not informational
  decoration. The success banner keeps printing `+ N runtime TSX file(s)`.

Default mode, `--report` and `--verify-gate` must each convert a `fatal` into a non-zero exit. Inspect all three
call sites; `--report` currently ends in `process.exit(0)` (`:675`) and must not reach that line on a fatal result.

The module-CSS directory walk is unchanged. Do not add a filesystem manifest, an allowlist, a baseline row, or a
skip marker.

### 10.2 Extract the Mantine theme ownership set (R4, R5, R6, R11)

Add a module constant for the theme path (`src/design-system/mantine/theme.ts`) and a function that returns
`{ names: Set<string> }` or `{ fatal }`:

- Read the file through the **TypeScript compiler API** — the same `typescript` import `scanTsxFile` already uses.
  Do not regex the source.
- Walk the AST for object-literal property assignments whose **key is a string literal beginning with `--`**, and
  whose enclosing Mantine component entry reaches them through a `vars` or a `styles` member. Both an object literal
  and an arrow-function return body count; `vars` is written as a callback in this file and `styles` as an object.
- A computed key, a template-literal key, an identifier key, or a `--` string appearing anywhere other than as such
  a property key is **not** a member. A `--` string inside a comment is not a member.
- Drop names matching the existing `EXTERNAL_PREFIXES` (`--mantine-`) — they are already external by prefix and
  do not need a second authority.
- `fatal` if the file is missing, unreadable, or fails to parse; `fatal` if the resulting set does not contain
  `--button-padding-x`. An empty or proof-key-less set is a parse failure, not a vacuous pass — the same fail-closed
  shape `globals.css` already has at `:529-531`.

Thread the resulting set into `runScan` as a new optional parameter (default: the real theme path) so every
`--verify-gate` case can point at **its own copied** `theme.ts`. No temp-tree case may read the real file.

### 10.3 Apply the set in the classifier (R3)

Extend `classifyName` with the Mantine-theme name set and test it **before** the bucket-3 fallback:

```
if (isKnownExternal(name)) return 'external';
if (isTailwindPrefixed(name)) return 'tailwind';
if (tailwindOwnedNames.has(name)) return 'tailwind';
if (mantineThemeNames.has(name)) return 'external';   // ← D65-F, new
if (ownedSet.has(name)) return 'project';
if (localDeclaredNames.has(name)) return 'project';
return 'tailwind';
```

Placement is load-bearing and must be exactly as shown. It sits **after** both Tailwind authorities so a real
Tailwind name can never be exempted by also appearing in `theme.ts`, and **before** the elimination fallback, which
is the whole defect. Every existing branch keeps its current behaviour and order.

Both call sites pass the set: `scanModuleCss` (`:403`) and `scanTsxFile` (`:480`). D65-F requires both — this is
what makes the exception global rather than TSX-only. `scanTsxFile` keeps passing `emptyLocal` as
`localDeclaredNames`; that parameter is unrelated and unchanged.

### 10.4 Required self-test expansion (R7, R8)

Every plant is written into its own fresh `mkdtempSync` copy and torn down in `finally`. No plant, rename or delete
may touch the real worktree. `setupTempTree` already copies all of `src/`, so `theme.ts` and `AgentCtaButton.tsx`
are present in every copy.

The final `--verify-gate` must assert **ten** independently reported outcomes:

| # | Copied-tree operation | Required result | Why it is required |
|---:|---|---|---|
| 1 | existing static `var(--container-3xl)` plant in a copied configured TSX input | exit 1; runtime-tsx new debt | retained from Task 767 |
| 2 | existing `FooterView.module.css` `var(--text-sm)` plant | exit 1; module-css new debt | retained from Task 767 |
| 3 | existing synthetic baseline row | exit 1; stale baseline | retained from Task 767 |
| 4 | dynamic template-expression custom-property name in a copied configured input | exit 1; dynamic-name violation | retained from Task 767 |
| 5 | **delete one copied configured TSX input**, `TSX_FILES_REL` untouched | exit 1; fatal naming the missing repo-relative path | R1/R2 — the F3 defect |
| 6 | copied `AgentCtaButton.tsx` supplied as the **only** TSX input, against the copied `theme.ts` | exit 0; zero runtime-tsx findings; `--button-padding-x` absent from `found` | R3 — the F2 defect, TSX arm |
| 7 | **module-CSS plant** — insert `var(--progress-size)` into a copied `.module.css` | exit 0; zero findings | **D65-F** — proves the exception is global. §3.3 measured that this plant exits **1** on the pre-edit script, so this is a before/after control, not a tautology |
| 8 | **module-CSS negative control** — insert `var(--button-padding-y)` into a copied `.module.css` | exit 1; module-css new debt | Sprint 65 §3 rule 2 — `--button-padding-y` is declared nowhere (§3.3). A `--button-`-prefix shortcut would pass case 7 and **fail** this one, which is exactly how an author-applied exemption is caught |
| 9 | unmodified copy, shipped baseline | exit 0; exactly two TSX inputs scanned | retained control |
| 10 | copied `theme.ts` deleted | exit 1; fatal naming the theme source | R6 — the ownership source is mandatory, not best-effort |

For every outcome print the **actual** exit code and the decisive file/line/property or fatal message. Update the
banner and the summary line, which today hardcode `3 plants exit 1, 1 control exits 0`.

Cases 7 and 8 together are the proof that the Mantine set is evidence-derived. Neither alone is sufficient: 7 alone
passes for a prefix hack, 8 alone passes for doing nothing.

### 10.5 Documentation (R10)

Amend `docs/design-system.md` §23.7 (lines 1197-1377) in place. Do not create a new section and do not renumber.
It must state, as durable rules rather than task history:

1. The runtime TSX input list is **closed and fixed** at two files, and is not a route-graph inventory.
2. A missing configured input is **fatal**; the gate makes no claim about unlisted runtime TSX files.
3. `src/design-system/mantine/theme.ts` is an **ownership source**: its literal `vars`/`styles` custom-property
   keys are external, applied globally in `classifyName`. List the nine names. Cite D65-F with its date.
4. The §3.5 boundary: a `theme.ts`-declared name can no longer surface a comment-stripping regression at
   `HeroSearchView.module.css:33`.

Update the script's own header comment where it now misstates behaviour — specifically the "a TSX file declares no
CSS custom property of its own" justification at `:317` and the three-bucket description at `:44-64`, which after
this task has a fourth ownership authority.

## 11. Stop conditions

Stop and report without editing source if any holds:

1. §10.0's readings differ from §3 in any particular — the two-entry list, the `existsSync` skip, the classifier
   order, the nine-name set, or any expected exit code.
2. The Mantine key probe returns a count other than 9, or a set that does not contain `--button-padding-x`.
3. Closing either defect appears to require changing `theme.ts`, `AgentCtaButton.tsx`, `TSX_FILES_REL`, `globals.css`,
   the baseline, `package.json`, or any consumer. D65-F authorises two files; a third is a new owner decision.
4. A general `style`/`styles` exemption looks necessary. It is explicitly refused: a `style`/`styles` expression may
   read a real Tailwind name and must not become an implicit exemption.
5. The shipped scan's output changes on the current tree in any field (R9). The hardening must be provably inert
   there; a changed count means the classifier moved something it should not have.
6. Task 768 is not in `main`, or `docs/backlog.md` carries no registry row for 769.
7. Any `--verify-gate` case cannot be made to produce its required result without weakening another case.

## 12. Acceptance criteria

- **AC1 [R1-R11]** — Given the final `git diff --stat`, then exactly two non-record files appear:
  `scripts/check-tailwind-runtime-tokens.mjs` and `docs/design-system.md`. The full diff of the script is pasted.
- **AC2 [R9]** — Given `rg -n 'TSX_FILES_REL' -A4 scripts/check-tailwind-runtime-tokens.mjs` after the edit, then
  the list still holds exactly `src/app/[locale]/page.tsx` and `src/components/shared/HeroSearchView.tsx`.
- **AC3 [R1, R2]** — Given a temp copy with one configured TSX input deleted, then `runScan` returns `fatal` naming
  that path, and each of the three modes exits non-zero. Evidence: `--verify-gate` case 5 output plus a pasted
  direct invocation showing the fatal string and `$LASTEXITCODE`. A fatal printed with exit 0 in any mode fails AC3.
- **AC4 [R3, R4]** — Given a temp copy whose only TSX input is `AgentCtaButton.tsx`, then the run exits 0 and
  `--button-padding-x` appears in no finding. Given a temp copy with `var(--progress-size)` planted in a
  `.module.css`, then the run exits 0 and reports no finding — **and** the same plant against the pre-edit script is
  shown exiting 1, so the change of behaviour is demonstrated, not asserted.
- **AC5 [R5]** — Given the extractor run against the real `theme.ts`, then it returns exactly the nine names of
  §3.2, contains `--button-padding-x`, and does not contain `--mantine-color-default-border`. The sorted set is
  pasted.
- **AC6 [R6]** — Given a temp copy with `theme.ts` deleted, then the run returns `fatal` and exits 1. Given a
  `theme.ts` whose parse yields a set without `--button-padding-x`, then the run returns `fatal`. Both are pasted.
- **AC7 [R7]** — Given `npm run check:tailwind-runtime-tokens:verify-gate`, then all **ten** §10.4 outcomes are
  asserted and behave as required, the banner and summary state ten, `$LASTEXITCODE` is 0, and each case prints its
  actual exit code and decisive detail. `git status --porcelain` after the run shows no plant left behind.
- **AC8 [R8]** — Given the final diff, then it contains no `design-tokens-allow:` marker, no allowlist, no baseline
  row, no hand-enumerated name list, and no `--button-`-style prefix rule. `--verify-gate` case 8 exits 1, proving
  a prefix shortcut would have been caught.
- **AC9 [R9]** — Given `npm run check:tailwind-runtime-tokens` and `--report` on the current tree after the edit,
  then both exit 0 with `25` module-CSS files, `2` runtime TSX files, `0 pair(s) / 0 use(s)` in both origins,
  `0` baseline entries, `0` stale, `0` dynamic violations — every field identical to the §10.0 pre-edit run. Both
  transcripts are pasted side by side.
- **AC10 [R10]** — Given `docs/design-system.md` §23.7, then it states all four items of §10.5, lists the nine
  names, cites D65-F with its date, and the section is amended in place (still §23.7, still starting at the same
  heading).
- **AC11 [R12]** — Given the session log, then it carries a `Files Changed` table matching the real diff, the §10.0
  and final measurements, every gate exit code, the §5 not-folded-in list restated as still-open, and status
  `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 13. QA profile and verification plan

**`Q1 Targeted`.** Non-UI code in an internal governance script. It changes no rendered code, no story, no CSS, no
token value and no route, so `docs/qa-profiles.md`'s Q2/Q3 rendered requirements do not attach. Q1 still requires
typecheck and the final zero-exit production build.

**Do not run any screenshot command for this task.** `Codex-tasks/README.md`'s Mantine-only screenshot default
applies to tasks that change rendered Homepage code; this one does not.

Run each, capture `$LASTEXITCODE` immediately (a pipeline swallows it), and retain the transcript under
`docs/sessions/evidence/task769/`:

```powershell
npm.cmd run check:tailwind-runtime-tokens;             "exit=$LASTEXITCODE"
node.exe scripts/check-tailwind-runtime-tokens.mjs --report; "exit=$LASTEXITCODE"
npm.cmd run check:tailwind-runtime-tokens:verify-gate; "exit=$LASTEXITCODE"
npm.cmd run check:design-tokens;                       "exit=$LASTEXITCODE"
npm.cmd run check:stories;                             "exit=$LASTEXITCODE"
npm.cmd run typecheck;                                 "exit=$LASTEXITCODE"
npm.cmd run build;                                     "exit=$LASTEXITCODE"
git --no-optional-locks status --porcelain
```

All must exit 0. `build` is the agent-contract §9 hard gate: a failed, unrun or stale build permits only
`PARTIALLY IMPLEMENTED` or `BLOCKED`.

Retain additionally: the AC4 pre-edit-vs-post-edit `--progress-size` comparison, the AC5 sorted nine-name set, the
AC6 two fatal transcripts, and the full `--verify-gate` ten-case output.

## 14. Completion report contract

State, in the session log and the completion message:

1. Changed files, with reasons, matching the real diff.
2. Requirement IDs completed (R1-R12) and each AC's status with its evidence path.
3. The §10.0 pre-edit measurements and the final post-edit measurements, side by side for AC9.
4. Every command run with its **actual** exit code — never a summary adjective.
5. The full `--verify-gate` ten-case output.
6. Evidence locations under `docs/sessions/evidence/task769/`.
7. Assumptions, deviations, known limitations — including the §3.5 comment-stripping boundary — and unresolved issues.
8. The §5 not-folded-in list (767 F5, F6, F7; 766 F1) restated as still open.
9. `git status --porcelain` — the **real, complete** output, not a trimmed paste.
10. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

**Never self-approve. Committing and pushing are owner-only.** Do not run, emit, suggest, or delegate any mutating
git command, including any `git push` form. Direct the review to this file and to the retained evidence.

## 15. Task quality gate

Checked by the orchestrator before publication:

- A fresh Sonnet session can execute this with no hidden chat context. ✔
- Every primary requirement (R1-R8) has at least one binary AC and one verification method. ✔
- Scope names what must not change (§8), including the four deliberately un-folded findings. ✔
- Not a UI task: no canonical UI decision record, no Storybook story added or extended, no screenshot path. ✔
- Negative flows selected by applicability (§9), not copied as a checklist. ✔
- No command, file, line, story or behaviour is claimed that was not inspected on `6b43b9676`. ✔
- The requested control proves the changed behaviour: cases 5, 7, 8 and 10 are new and each fails on the pre-edit
  script or on a plausible wrong implementation. ✔
- The owner exception (D65-F) is quoted verbatim with its date and scope; this task is not its own authorization. ✔
- Exactly one active route: D65-F's refined form. The superseded vars-only wording is named and excluded. ✔
- Every checkpoint names a producer, a persisted artifact and a comparator with fail-closed semantics (§10.4, §13). ✔
- Dynamic state tested both empty and non-empty: the extracted set is asserted at nine **and** fatal at zero
  (AC5, AC6); the missing-input set is asserted at zero **and** non-zero (AC7 cases 5, 9). ✔
- Every material absence claim (`--button-padding-y` declared nowhere; the nine names absent from `globals.css` and
  Tailwind's stylesheets) was measured, not inferred (§3.3). ✔
- The worktree is clean at filing; no dirty-worktree manifest is required. ✔

---

## Appendix A — Executable task contract (`docs/orchestrator-execution-contract-template.md`, completed)

### A.1 One active execution route

| Field | Value |
|---|---|
| Task | 769 — Runtime-token scanner hardening: fail-closed TSX inputs and Mantine theme ownership |
| Active route / owner decision | D65-F, refined form: exception applied globally in `classifyName`; source set = nine non-`--mantine-` literal keys from `theme.ts` `vars` **and** `styles` |
| Decision source, date, scope | Owner, 2026-08-26, quoted verbatim in §0. Scope: `scripts/check-tailwind-runtime-tokens.mjs` + `docs/design-system.md` §23.7 only |
| Starting worktree mode | clean isolated — `main` @ `6b43b9676`, `git status --porcelain` empty at filing |
| Exact allowed final write set | `scripts/check-tailwind-runtime-tokens.mjs`, `docs/design-system.md`, `docs/sessions/2026-…-task769-….md`, `docs/sessions/evidence/task769/**`, `docs/backlog.md` |
| Blocked rule or decision, if any | None. The brief's §1/§3.2 contradiction and its vars-only wording are both closed by D65-F |

The superseded vars-only route is recorded in §5 as *excluded*, not offered as an alternative. There is one route.

### A.2 Checkpoint matrix

| # | Preconditions and preserved inputs | Writes allowed | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---:|---|---|---|---|---|
| 0 | clean tree at/after `6b43b9676` | none | §10.0 expected readings, incl. the nine-name probe printing `9` | §10.0 commands → `evidence/task769/preflight.txt` | Any field differing from §3 → stop (§11.1/§11.2); no source edit occurs |
| 1 | checkpoint 0 clean | script only | missing-input path returns `fatal`, all three modes non-zero | `runScan` + direct invocation → `evidence/task769/ac3-fatal.txt` | A fatal printed with exit 0 in any mode fails AC3 |
| 2 | checkpoint 1 | script only | extractor returns exactly the nine names | extractor → `evidence/task769/ac5-theme-names.txt` | Count ≠ 9, or proof key absent → `fatal` by R6, task fails AC5 |
| 3 | checkpoint 2 | script only | `--progress-size` module-CSS plant: exit 1 pre-edit, exit 0 post-edit | two runs → `evidence/task769/ac4-progress-size-prepost.txt` | Equal exit codes in both phases → the change is inert, AC4 fails |
| 4 | checkpoint 3 | script only | `--button-padding-y` module-CSS plant exits 1 | `--verify-gate` case 8 → `evidence/task769/verify-gate.txt` | Exit 0 → a prefix shortcut was implemented, AC8 fails |
| 5 | checkpoints 1-4 | script only | all ten §10.4 outcomes as required, banner states ten | `--verify-gate` → `evidence/task769/verify-gate.txt` | Any case off → non-zero exit; `git status --porcelain` must show no plant left behind |
| 6 | checkpoint 5 green | docs only | §23.7 states all four §10.5 items and the nine names | manual edit → `docs/design-system.md` | AC10 read-after-write; section still §23.7 at the same heading |
| 7 | checkpoints 0-6 | none | shipped scan byte-identical to checkpoint 0 | §13 commands → `evidence/task769/final-gates.txt` | Any field differing from checkpoint 0 → stop condition §11.5 |
| 8 | checkpoint 7 | records only | build exit 0 | `npm run build` → `evidence/task769/build.log` | Non-zero or unrun → `PARTIALLY IMPLEMENTED`/`BLOCKED` only (agent contract §9) |

**Dynamic state, both directions.** Extracted set: asserted non-empty at exactly 9 (checkpoint 2, AC5) **and**
fatal at empty/proof-key-less (AC6). Missing-input set: asserted empty on a good tree (case 9) **and** non-empty on
a deleted input (case 5). A valid zero state — zero findings, zero baseline rows — is the expected green result and
must not be rejected as a missing artifact; that is what checkpoint 7 asserts.

**Task-created artifacts.** Every plant lives inside a `mkdtempSync` copy torn down in `finally` and can never enter
the real scan corpus, baseline, or status set. `docs/sessions/evidence/task769/**` is created after checkpoint 0, so
it cannot affect any measurement; no scanned glob reaches `docs/`.

### A.3 Required counterexample trace

| Contract claim | Counterexample | Evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | Brief's vars-only route would produce a 7-name set | §3.2 measured 9 keys, 2 of them under `styles` | superseded by D65-F, excluded in §5 | `EXECUTED` — key contexts read at `:288-296, 445, 594, 708, 801` |
| Stateful baseline / manifest | valid empty baseline vs missing baseline | baseline is `[]` today and must stay `[]`; case 3 plants a synthetic row | distinct fail-closed outcomes | `EXECUTED` — case 3 retained from Task 767, exits 1 |
| Status or diff assertion | a plant left behind in the real worktree | `git status --porcelain` after `--verify-gate` | comparator rejects any new path | `EXECUTED` — `setupTempTree` writes only under `mkdtempSync`, read at `:685-694` |
| New gate behaviour | prefix shortcut on `--button-` passes the positive plant | `--button-padding-y` declared in no source (§3.3) | case 8 exits 1 and catches it | `EXECUTED` — declaration absence measured against `globals.css` and Tailwind's `theme.css`/`index.css` |
| New gate behaviour | the fix is inert and proves nothing | `--progress-size` declared nowhere → bucket-3 today | case 7 must flip exit 1 → exit 0 | `EXECUTED` — absence measured; flip is required evidence, not assumed |
| Task-created artifact ordering | evidence dir counted into the scan | scan globs are `src/**/*.module.css` + two TSX paths | `docs/` is unreachable by any glob | `ANALYTICAL` — read from `collectModuleCssFiles(srcDir)` at `:539` and `TSX_FILES_REL` at `:186` |

### A.4 Publication and review gate

This contract was rebuilt from the final text of §§7-13 after the last revision, not from a revision summary. The
author of this kickoff does not approve its execution: Sonnet returns `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
and Opus reviews against the retained evidence.

## Appendix B — Unwaivable rule-compliance ledger (`docs/orchestrator-rule-compliance-ledger-template.md`, completed)

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `agent-contract.md` §1 Scope stays bounded | Task edits a shared gate script | "Change only what the task requires. No drive-by refactors" | §8 out-of-scope list; AC1 two-file diff | `COMPLIANT` |
| `agent-contract.md` §2 No invented architecture or facts | Task asserts classifier order and a nine-name set | "If a required decision is missing … stop and ask" | D65-F obtained before publication (§0); every §3 row inspected on `6b43b9676` | `COMPLIANT` |
| `agent-contract.md` §9 Validation evidence is mandatory | Non-Q0 task | "final `npm run build` result with exit code 0" | §13 command list; checkpoint 8 | `COMPLIANT` |
| `agent-contract.md` §10 Session evidence, backlog, git ownership | Task writes records | Sonnet writes log + concise backlog; "does not run, emit, or suggest mutating git" | §14 items 1, 9, 10 and its closing paragraph | `COMPLIANT` |
| `agent-contract.md` §14 File integrity and encoding | Task edits `.mjs` and `.md` | "UTF-8 without BOM … parseable where applicable" | `check:stories`, `typecheck`, `build` in §13 | `COMPLIANT` |
| `agent-contract.md` §6a Positive and applicable negative flows | Every task | applicability table, no invented branches | §9 negative-flow table, 3 `Yes`/4 `No` with sources | `COMPLIANT` |
| `agent-contract.md` §16c Canonical Mantine Story source-of-truth | — | binds tasks changing a *visible Mantine-migrated artifact* | `NOT APPLICABLE` — the diff touches one CLI gate script and one docs section; no rendered artifact, story, or component is changed (§7, §8) | `NOT APPLICABLE` |
| `agent-contract.md` §7 Localization four locales | — | binds *new or changed user-facing strings* | `NOT APPLICABLE` — the only new strings are developer-facing CLI fatals, consistent with the whole `scripts/` tree | `NOT APPLICABLE` |
| `agent-contract.md` §15 Critical flows | — | binds tasks touching `docs/critical-flow-registry.md` | `NOT APPLICABLE` — scanned: the registry names no gate script and no Homepage token surface reached by this diff | `NOT APPLICABLE` |
| Sprint 65 §3 rule 1 — the control ships before or with the fix | Task modifies a detector | "Every new or modified detector needs two actually-executed failing plants, a restored tree, and a clean re-run. A comment, a regex over comments, or a self-authored marker is not a control." | §10.4 cases 5, 8 and 10 are three new **failing** plants; case 7 is a new passing control with a measured pre-edit failure; case 9 is the clean re-run; teardown in `finally` + `git status --porcelain` in AC7 | `COMPLIANT` |
| Sprint 65 §3 rule 2 — no author-applied exemption | Task adds an ownership authority | "No new `design-tokens-allow:` marker, no allowlist row, no baseline row may be added to turn a gate green." | AC8; the set is AST-derived from `theme.ts` (§10.2), never enumerated; case 8 catches a prefix shortcut | `COMPLIANT` |
| Sprint 65 §3 rule 3 — mechanism only, never restyle | Task changes no rendered output | D28 rendered equivalence | `NOT APPLICABLE` — no rendered code changes; R9/AC9 additionally prove the shipped scan output is byte-identical | `NOT APPLICABLE` |
| Sprint 65 §3 rule 4 — new runtime values live in `:root` | Task declares no runtime value | — | `NOT APPLICABLE` — no custom property is declared or changed; `globals.css` is out of scope (§8) | `NOT APPLICABLE` |
| Sprint 65 §3 rule 5 — `globals.css` is high-risk after Task 765 | — | a change to it is never combined with AppImage/hover/global-removal work | `NOT APPLICABLE` — `globals.css` is not in the write set (§7) | `NOT APPLICABLE` |
| Sprint 65 §3 rule 6 — no new permanent Storybook stories to satisfy a detector | Task expands a detector's self-test | "Use an existing story, or a reversible probe whose restoration is proven" | Every plant is a temp-copy probe under `mkdtempSync`, torn down in `finally`; no story is added, extended or touched. AC7 asserts a clean `git status --porcelain` after the run | `COMPLIANT` |
| Sprint 65 §8 — what the sprint does not authorize | Task is inside Sprint 65 | no `@import`/`@apply`/`@source` removal, no route certification | §8 of this kickoff forbids every listed item; §10.5 item 2 requires the gate to state it makes no claim about unlisted runtime TSX files | `COMPLIANT` |
| `orchestrator-procedures.md` "Detector-aware requirements and migrations" | Task changes what a detector observes | "record the detector blind spot explicitly" | §3.5 measured and §10.5 item 4 requires it documented in §23.7 | `COMPLIANT` |
| `orchestrator-procedures.md` "A documented token is not an implemented token — grep the definition" | Task names nine custom properties | "prove the custom property is *defined*, not merely *tabled*. Quote the matched definition line" | §3.2 quotes each key's declaration site and line in `theme.ts`; §3.3 records the measured **absence** from `globals.css` and Tailwind's stylesheets | `COMPLIANT` |
| `orchestrator-procedures.md` baselines/assertions — "New regression harnesses must fail closed for missing baseline cells, infra failures" | Task hardens exactly that | fail-closed on missing input | R1, R2, R6; cases 5 and 10 | `COMPLIANT` |
| `orchestrator-procedures.md` baselines/assertions — "Distinguish an executed falsification from an analytical counterfactual" | Appendix A.3 makes claims | call a branch `fired` only when a run exercised it | A.3 marks five rows `EXECUTED` with the inspected line, one `ANALYTICAL` with its source branch named | `COMPLIANT` |
| `orchestrator-procedures.md` Git policy | Task design changed artifacts | commit handoff allowed after verified task design; **push only after approved review**; explicit paths; no `git add -A` | The handoff below lists explicit paths and emits **no** `git push` | `COMPLIANT` |
| `qa-profiles.md` selection rule | Every kickoff | "Every kickoff and review must name one QA profile" | §13 names `Q1 Targeted` with its justification and the build gate | `COMPLIANT` |
| `create-task` permanent-story creation gate | Task adds no story markup | probe over permanent artifact | `NOT APPLICABLE` — no Storybook artifact is added or extended; the plants are temp-copy probes outside the repository | `NOT APPLICABLE` |

Every applicable row is `COMPLIANT`; every `NOT APPLICABLE` row carries a concrete source-based reason. No row is
`BLOCKED`. Publication is permitted.
