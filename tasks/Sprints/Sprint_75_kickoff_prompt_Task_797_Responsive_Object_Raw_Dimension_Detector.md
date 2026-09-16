# Task 797 — `check:design-tokens` sees a raw dimension written in Mantine's responsive object form

Sprint 75 · P2 · QA profile **Q4** (was `Q2` in the reservation — a detector arm is a gate claim and needs planted
proof)

**Status: ✅ `APPROVED WITH NOTES`** 2026-09-16 (Opus implementation review; ledger `docs/reviews/2026-09-16-task797-responsive-object-raw-dimension-detector.review-ledger.json`; P3 notes → Task **830**). Filed 2026-09-16. **Sequenced after Task 822's approved commit**: both edit
`scripts/check-design-tokens.mjs`, its test file, `src/design-system/mantine/theme.ts` and `PhoneField.tsx`.

## 1. Mode and task type

`IMPLEMENTATION` — governance detector arm plus the value-preserving tokenization of the sites the new arm exposes.

## 2. Objective

`raw-dimension-prop` matches `prop={<number>}` and `prop="<n>rem"`; `raw-inline-dimension` keys on CSS property
names. Mantine's responsive form `prop={{ base: 176, md: 80 }}` matches neither, so raw px/rem values written that
way pass `check:design-tokens:strict` at exit 0. Add an arm that sees them, state and prove its false-positive
boundary, and tokenize the sites it finds so the strict gate stays green.

## 3. Verified context — measured 2026-09-16

### 3.1 The blind spot, in source

`FACT` — `scripts/check-design-tokens.mjs:270-277`: the numeric arm's regex ends `=\{-?(?:\d+\.\d+|\d+|\.\d+)\}` — one
brace, one literal. `:278-285`: the unit arm requires `=(["'])…(?:px|rem|em)…\1` — a quoted string directly after `=`.
`:286-300`: the inline arm's property alternation is CSS names (`width`, `marginTop`…), not breakpoint keys.
An expression beginning `={{` can satisfy none of the three.

`FACT` — reservation (`docs/backlog-reserved.md:16`): Task 791 landed `pb={{ base: 176, md: 80, lg: 32 }}` in
`ListingDetailView.tsx` at `0 violations, exit 0`. That expression **no longer exists** (`grep -n "pb={{"` on the file
returns nothing), so it survives only as a test fixture.

### 3.2 Current population (`docs/sessions/evidence/task797/design/01_responsive-object-raw-dimension-scan.txt`)

`FACT` — a scan of production `.tsx` (stories and tests excluded) for `<dimension prop>={{…}}` with a non-zero bare
number or a quoted `px|rem|em` value found **3 hits in 3 files**:

| Site | Expression | Code or comment |
|---|---|---|
| `src/components/shared/HeroSearchFallback.tsx:24` | `h={{ base: 279, sm: 175, md: 123 }}` | **code** |
| `src/components/shared/PhoneField.tsx:164` | `triggerWidth={{ base: '7rem', sm: '7rem' }}` + a `design-tokens-allow: : '7rem'` marker citing Task 556 STOP-AND-ASK #1 | **code** |
| `src/design-system/mantine/patterns/MantineAuthFormPattern.tsx:29` | `Paper maw={{ base: '100%', sm: 400 }}` | **JSDoc comment** — the code at `:78` already reads `theme.other.layout.authFormMaxWidth` |

`FACT` — 81 `={{ base…` responsive-object props exist in production `.tsx`; all but the 2 code sites above use tokens,
`0`, percentages or non-dimension props.

`FACT` — `offset={{`, `span={{`, `order={{` occur **0** times in production `src/` (`git grep`). `offset` is in the
single-brace arm's prop list (Popover's px offset), but in object form it is `Grid.Col`'s column offset — a count.

### 3.3 Where the values already live

`FACT` — `theme.ts:136-160` documents every `theme.other.layout` role with its exact source; `boxSize.thumbnail` is
`'7rem'` (`:480`) but means a thumbnail, not a country trigger; no role holds 279/175/123.

### 3.4 Test harness and CI

`FACT` — `scripts/__tests__/check-design-tokens.test.ts:784-840` covers `raw-dimension-prop` with `scanContent`
fixtures, including a two-armed planted/reverted test (`:824-829`). CI runs `npm run check:design-tokens:strict` in the
`governance` job (`.github/workflows/governance-pr.yml:149`) and the vitest suite there.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1 | New regular category `raw-dimension-responsive-prop`, `tsxOnly`, blocking in `--strict` like every other regular category. It matches `<prop>={{ <body> }}` where `<prop>` is the single-brace arm's prop list **minus `offset`**, and reports one finding per object entry whose value is a non-zero bare number or a quoted string containing a `px`/`rem`/`em` number. | **P0** | AC1, AC2 | Confirmed |
| **R2** | reservation, §3.2 | False-positive boundary, each a test: token strings (`'md'`), `0`, percentages (`'100%'`), `theme.*`/identifier values, `span`/`order`/`offset`/`cols` object props, and **comments** (JSDoc and JSX) never fire. A body containing a nested `{` is **not skipped silently**: it produces a finding with rawValue `<prop>: unparsed-object` so the gap is visible, not hidden. | **P0** | AC2 | Confirmed |
| **R3** | marker contract `:746-760` | The finding's `rawValue` is `<prop>.<key>: <value>` exactly as written (e.g. `h.base: 279`, `triggerWidth.sm: '7rem'`), and a same-line `design-tokens-allow: <that string> — <reason>` suppresses exactly that entry. For a multi-line object the finding's line is the entry's own line. | **P0** | AC2 | Confirmed |
| **R4** | reservation | Two-armed plant as tests: `pb={{ base: 176, md: 80, lg: 32 }}` → exactly 3 findings; `pb={{ base: 'md', lg: 0 }}` → 0. | **P0** | AC2 | Confirmed |
| **R5** | §3.2, §3.3 | The two code sites are tokenized, value-preserving, with **no marker**: `HeroSearchFallback` `h` reads a new role `theme.other.layout.heroSearchFallbackHeight = { base: 279, sm: 175, md: 123 }`; `PhoneField` `triggerWidth` reads a new role `theme.other.boxSize.phoneCountryTrigger = '7rem'` at both keys, and its now-unneeded marker is removed. Each role is typed in the `theme.other` augmentation with a comment citing its exact source, in the style of `theme.ts:139-160`. | **P0** | AC3 | Confirmed |
| **R6** | §3.2 | The `MantineAuthFormPattern.tsx:29` JSDoc is not changed (it is a comment and R2 proves it is ignored). | P2 | AC2 | Confirmed |
| **R7** | GR-2 | `docs/design-system.md` §23 records the new category, its prop list, its boundary (R2) and what it still cannot see: a value built by a variable or function call, a spread object, a responsive object passed through a non-listed prop name. | P1 | AC4 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` (reversible) — Mantine converts `h={{ base: 279 }}` and `h={{ base: theme.other.layout.heroSearchFallbackHeight.base }}` to the same CSS (both numbers, same `rem()` conversion). R5 passes the same numbers, so AC3's static equality holds by construction; the HeroSearch Story is re-rendered anyway (AC3).
- Stop: if §13.1's census finds a code site beyond the two in §3.2, add it to R5 only when an existing role holds the exact value **with matching meaning**; otherwise stop with `BLOCKED` and the site list — do not invent a role name not written in this kickoff.
- No owner decision: the reservation fixed the boundary requirement; the `7rem` value keeps Task 556's owner-specified width, only its source moves.

## 6. Pre-read rule bundle

`scripts/check-design-tokens.mjs:1-100, 255-300, 640-800` · `scripts/__tests__/check-design-tokens.test.ts:780-960` ·
`src/design-system/mantine/theme.ts:80-170, 470-525` · `docs/design-system.md` §22-§23 · `docs/golden-rules.md` GR-2 ·
`docs/agent-contract.md` clauses 9, 13, 14 · `docs/qa-profiles.md` (Q4) · `docs/orchestrator-procedures.md` →
"A documented token is not an implemented token" · `src/components/shared/HeroSearchFallback.tsx` ·
`src/components/shared/PhoneField.tsx:150-170` · this kickoff.

## 7. Scope

- **Edited:** `scripts/check-design-tokens.mjs` · `scripts/__tests__/check-design-tokens.test.ts` ·
  `src/design-system/mantine/theme.ts` (+2 roles, typed) · `src/components/shared/HeroSearchFallback.tsx` ·
  `src/components/shared/PhoneField.tsx` (`triggerWidth` line, its marker, and the `useMantineTheme` import/call) · `docs/design-system.md` (§23 entry) ·
  `docs/backlog.md`.
- **Written:** `docs/sessions/evidence/task797/*` (not `design/`) · session log.

## 8. Out of scope

Every other detector arm and category · `scripts/design-tokens-allowlist.json` · the JSDoc at
`MantineAuthFormPattern.tsx:29` · any value change · Task 822's sites.

## 9. Current and required behavior

**Before.** `h={{ base: 279 }}` ships at `0 violations`. **After.** It fails `--strict` naming `h.base: 279`; the two
real sites read theme roles; the gate is green on the real tree; the boundary cases are tested.

## 10. Implementation requirements

1. Order: §13.1 census → tests for R1-R4 written and **failing** against the unmodified detector (retain that run) →
   arm → tests passing → R5 → R7 → §13.2.
2. Parse the object body with a small bracket-aware scanner over the comment-stripped content the other `tsxOnly`
   arms already use (`stripJsxComments`, `:652`), not a single regex across lines.
3. Roles are consumed as `theme.other.…` through `useMantineTheme()`, the route `HeroSearchFallback.tsx:21` already
   uses; `PhoneField.tsx` does not call `useMantineTheme()` today (`Select-String` finds no hit) — add it, the same import
   `HeroSearchFallback.tsx` uses.
4. Node UTF-8 I/O for every read-back; transcripts unpiped with exit code appended; final block records hashes.

## 11. Positive and negative flows

**Positive.** A contributor writes `mt={{ base: 12, md: 24 }}`; `--strict` fails naming `mt.base: 12` and `mt.md: 24`.

| Negative flow | Applicable | Expected |
|---|---:|---|
| Token/zero/percent/identifier values | Yes | no finding — R2 test |
| `span`/`order`/`offset`/`cols` object props | Yes | no finding — R2 test |
| Expression inside a comment | Yes | no finding — R2 test, and the real `MantineAuthFormPattern.tsx:29` |
| Nested object body | Yes | `unparsed-object` finding — R2 test |
| Marker for one entry of three | Yes | only that entry suppressed — R3 test |
| Multi-line object | Yes | finding on the entry's line — R3 test |

## 12. Acceptance criteria

- **AC1 [R1]** — Against the unmodified detector, the new R1-R4 tests fail (retained transcript); after the arm, they
  pass. Quote both vitest summaries.
- **AC2 [R2, R3, R4, R6]** — The test file contains one named test per R2 boundary case, the R3 marker and multi-line
  cases, and the R4 two-armed plant; `npx vitest run scripts/__tests__/check-design-tokens.test.ts` exits 0. Quote the
  test names and the summary.
- **AC3 [R5]** — `npm run check:design-tokens:strict` names no `raw-dimension-responsive-prop` finding;
  `Select-String` finds both role definitions in `theme.ts` with the exact values; `git diff` of the two components
  shows only the value expression (and PhoneField's removed marker). The HeroSearch Story's fallback Skeleton heights
  at 390/640/1440 are equal before and after (`getBoundingClientRect().height`). Quote all.
- **AC4 [R7]** — `docs/design-system.md` §23 entry quoted.

**GR-4 AC AUDIT — 4 criteria; each states an observable property; absolutes: none beyond this task's defined
scope.**

## 13. QA profile and verification plan

**`Q4`** — a detector arm is a gate claim: planted failure proof (AC1, R4). Value-preserving product edits get the
targeted rendered check in AC3; no owner visual matrix because no value changes.

### 13.1 Census and failing tests

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks log -1 --oneline -- scripts/check-design-tokens.mjs
node.exe docs\sessions\evidence\task797\design\90_797_scan.mjs
npm.cmd run check:design-tokens:strict
```

Expected: `win32`; the last detector commit is Task 822's; the scan reproduces §3.2 (3 hits, 2 code); strict at the
state 822 left (exit 0 if 822 closed its set). Then write the tests and run
`npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts` **before** changing the detector — expected non-zero.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
npm.cmd run check:design-tokens:strict
npm.cmd run typecheck
npm.cmd run lint
npx.cmd vitest run src/design-system/mantine/__tests__
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks hash-object scripts/check-design-tokens.mjs scripts/__tests__/check-design-tokens.test.ts src/design-system/mantine/theme.ts src/components/shared/HeroSearchFallback.tsx src/components/shared/PhoneField.tsx docs/design-system.md docs/backlog.md
```

Expected: every command exit 0.

## 14. Completion report contract

Files and hashes · R1-R7 · census · failing-then-passing test transcripts · strict output · AC3 measurements ·
§23 quote · commands with exit codes and paths · assumptions · deviations · limitations. Status per the execute-task
contract. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why a new category, not widening `raw-dimension-prop`? | Its rawValue format (`prop.key: value`) differs, and markers match rawValue byte-for-byte (`:746-760`). |
| Why exclude `offset` here but not in the single-brace arm? | Object form is `Grid.Col`'s column count; single-brace is Popover's px (§3.2). Zero current object-form uses, so the exclusion hides nothing today — and it is printed in §23. |
| Why tokenize instead of marking? | `agent-contract` 16b: a marker is not a canonical style source. Both values have a clear semantic owner. |
| Why after 822? | Same four files; 822 also adds `theme.other.layout` roles. |
| GR-1 / 16d? | Not applicable: no visible change (AC3). |

## Appendix — execution contract

| Checkpoint | Producer | Comparator / failure |
|---|---|---|
| 0 census | scan + strict transcripts | extra code site with no named role → `BLOCKED` |
| 1 red tests | vitest before the arm | exit 0 → tests do not exercise the arm → fix tests |
| 2 arm | vitest after | any failure → not done |
| 3 tokenize | strict + role grep | a responsive finding remains → not done |
| 4 final | §13.2 | any non-zero → not `IMPLEMENTED` |
