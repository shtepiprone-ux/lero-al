# Task 678 — Give the Mantine gate per-story enrolment, then use it to close 699's xxl gap and enrol AdminUsersTable

**Sprint 52 — Gates that stopped checking, position 52.4.** Folds Task **687**.
**Status:** `KICKOFF FILED`. **QA profile:** `Q4` Release/Critical Flow.
**Companions:** `Sprint_52_Task_678_execution_contract.md` · `Sprint_52_Task_678_rule_compliance_ledger.md`.

> **The backlog's framing for this number is retired.** It said "14-width matrix enrolment". Owner decision
> 2026-08-08, after measurement: **do not** expand `MANTINE_VIEWPORTS` globally. §3.1 records why, and §8 puts it
> out of scope. What is left, once that framing is dropped, is a single root cause with three symptoms.

---

## 1. Mode and task type

**Mode:** implementation. **Type:** verification-gate scope mechanism (non-product scripts) + one viewport
addition. `src/` changes only if §7.4's decision requires a story retitle — and that is a decision, not a default.

Sonnet executes via `execute-task` and reports `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.

---

## 2. Objective

Three separate backlog findings reduce to one defect: the Mantine gate decides scope by **title prefix** and has no
way to include a single story. Add per-story enrolment, then spend it on the two things that needed it.

---

## 3. Verified context — measured from the repository 2026-08-08

### 3.1 Why the "14-width" framing is retired — measured, then decided

`MANTINE_VIEWPORTS` (`check-stories-rendered.mjs:392`) is 4 widths. Its own comment says why:

> Deliberately **NOT** the full 14-viewport `VIEWPORTS_FULL` sweep — kept small enough that this phase can run
> **UNCONDITIONALLY** (including under `--fast`), so the gate this task exists to add is never the thing that gets
> skipped for speed.

Measured cost of overriding that: 71 stories × 4 locales × 14 widths + 48 extra-viewport cells = **4024 cells**,
**3.40×** the current 1184. The observed sweep time for 1184 cells is ~30 minutes (Task 722 evidence: storybook
build 09:48 → matrix complete 10:18), so ~**102 minutes per run** on a CI-blocking gate, per PR — which is exactly
the outcome the 4-width choice exists to prevent. **Owner decision 2026-08-08: surgical, not global.**

### 3.2 The root cause

`scripts/lib/mantine-story-scope.mjs` is the single source of truth for canonical-Mantine scope:

```js
export const MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/'];
export function isCanonicalMantineTitle(title) { … prefixes.some(p => title.startsWith(p)) }
```

It is imported by **three** CI gates — `check-stories-rendered.mjs`, `check-locale-leak.mjs`,
`check-story-coverage.mjs`. Scope is prefix-only: **there is no mechanism to enrol one story.** Every finding below
is a consequence.

### 3.3 Symptom 1 — 699's xxl step is unproven

`SECTION_HEADING_FZ = { base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }`
(`src/design-system/mantine/typography.ts`; xxl = **≥1440px**, Mantine's own breakpoint, owner decision 2026-07-28
via Task 669). **5 use sites across 4 files**, measured by `fz={SECTION_HEADING_FZ}` occurrences:

| Consumer | Story title | Cells in the gate | Cells at ≥1440 | Verdict |
|---|---|---:|---:|---|
| `PopularLocationsView` | `Mantine/Primitives/PopularLocationsView` | in scope | **8** | ✅ proven |
| `HowItWorksSteps` | `Mantine/Primitives/HowItWorksSteps` | 16 | **0** | ✗ in scope, never sampled above 1024 |
| `FeaturedListingsView` | `System/FeaturedListings` | **0** | 0 | ✗ out of scope by title |
| `page.tsx` `{tl('latest')}` | `System/LatestListings` | **0** | 0 | ✗ out of scope by title |
| `page.tsx` second site | route file, no story | 0 | 0 | route-level — **667** owns it, out of scope here |

Only 3 stories in the whole manifest reach `wide-1440`: `Patterns/Mantine/HomeSection/Default`,
`Mantine/Primitives/PopularLocationsView/Default`, `.../Long City Name` — all added by Task 669's surgical
mechanism. **The gap has two different causes**, and only one of them is a viewport problem.

### 3.4 Symptom 2 — 687, and the estimate that was an order of magnitude low

`Admin/AdminUsersTable` (`src/components/admin/AdminUsersTable.stories.tsx:16`) is already in the story manifest
(`check-stories-rendered.mjs:159`) but out of `--mantine-only` scope, because `Admin/` is not a prefix.

The backlog estimated "+16 cells on a blocking gate". **Adding `Admin/` to the prefix list enrols 21 stories into
3 gates**, measured 2026-08-08 — `AdminCardList`, `AdminCompaniesManager`, `AdminCurrenciesManager`,
`AdminEmailTemplatesManager`, `AdminExchangeProvidersManager`, `AdminListingsTable`, `AdminLocaleSwitcher`,
`AdminMobileHeader`, `AdminPageShell`, `AdminPermissionsManager`, `AdminPropertyTypesManager`,
`AdminReportsManager`, `AdminSettings`, `AdminSidebar`, `AdminSupportManager`, `AdminTable`, `AdminUserAvatar`,
`AdminUserProfile`, `AdminUsersTable`, `StatusChangeControl`, `StatusChangeHistory`. `System/` is 7 stories on the
same footing.

**Is an admin story even eligible for a *canonical Mantine* gate? Measured, because the answer is not obvious.**
The scope module defines a story as canonical Mantine **iff** its title matches a prefix — so enrolling one asserts
it *is* canonical Mantine, and enrolling a shadcn component would make that assertion false and hand the gate cells
whose Mantine-keyed assertions can only resolve `null`. Counted 2026-08-08 across `src/components/admin/`
(35 components): **29 still import `@/components/ui/` (shadcn); exactly 2 files touch `@mantine/core`, and one of
them is a test.** The single migrated component is **`AdminUsersTable.tsx` itself**, which imports `Avatar`,
`Badge`, `Button`, `Group`, `Stack`, `Tabs`, `Text`, `TextInput`, `ActionIcon`, `Loader`,
`SegmentedControl` and `ScrollArea` from `@mantine/core`, plus `useMediaQuery` and the canonical
`MantineDataTableToCards` pattern.

That is the whole argument for per-story enrolment rather than a prefix, stated as a number: **1 of 21 `Admin/`
stories is eligible.** Adding the prefix would enrol 20 unmigrated shadcn stories into a gate that asserts they are
canonical Mantine — the same "cells that cannot measure anything" defect Sprint 52 exists to end, arriving from the
opposite direction. **Verify this count yourself before enrolling** (R3): if any other `Admin/` story has since
been migrated it is a candidate too, and if `AdminUsersTable` has regressed, enrolling it is wrong.

### 3.5 What 722 changed, and why it matters here

Before Task 722, `fullWidthControlsAtMobile` was vacuously `true` in every cell. **Enrolling stories then would
have manufactured false green.** 722 closed that (Sprint 52.1, approved 2026-08-08), which is precisely why this
task is ordered after it. Consequence: newly-enrolled cells now report honestly, so **expect real failures**, and
treat them per §10.4.

---

## 4. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.2 | A per-story enrolment mechanism exists in `mantine-story-scope.mjs`, alongside the prefix list, not replacing it | P0 | Diff + unit proof | Confirmed |
| R2 | §3.2 | Its effect on **all three** consuming gates is measured before and after, per gate | P0 | Three before/after transcripts | Confirmed |
| R3 | §3.4 | `Admin/AdminUsersTable` is enrolled **without** enrolling the other 20 `Admin/` stories | P0 | Story-count delta | Confirmed |
| R4 | §3.3 | `HowItWorksSteps` gains ≥1440 coverage via the existing `MANTINE_STORY_EXTRA_VIEWPORTS` mechanism (573/616/669 precedent) | P0 | Manifest cells at ≥1440 | Confirmed |
| R5 | §3.3 | The two `System/*` heading consumers are resolved — enrolled, retitled, or reserved with a number and a reason | P1 | Diff or backlog row | Confirmed |
| R6 | Plant | A story that is **not** enrolled stays out of all three gates, proven by a plant | P0 | Transcript | Confirmed |
| R7 | §3.5, 724 | Every newly-failing cell is named and escalated. No tolerance, skip or allowlist is added to make one green | P0 | Session log | Confirmed |
| R8 | §3.1 | `MANTINE_VIEWPORTS` is **unchanged**, witnessed | P0 | Diff | Confirmed |
| R9 | Standing | Final `--mantine-only` result stated against `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS`, with the new denominator and every moved cell attributed | P0 | Final matrix log | Confirmed |
| R10 | Standing | `npx tsc --noEmit` exit 0, `npm run build` exit 0, `check:assertion-liveness` exit 0 | P0 | Transcripts | Confirmed |
| R11 | Standing | Counting gates run last; the backlog baseline is read from `git show HEAD:docs/backlog.md \| wc -l` **before** the first edit | P0 | Two passes | Confirmed |

---

## 5. Assumptions and open questions

- **A1.** Dirty worktree: pre-write `git status --porcelain` snapshot, per-entry classification, before/after
  content witnesses for pre-existing modified paths.
- **A2.** Enrolling `AdminUsersTable` brings it into `check-locale-leak` and `check-story-coverage` as well as the
  rendered gate. **Those two may fail on it.** That is a finding to report, not a reason to abandon R3 — but if
  either fails, stop and report rather than fixing an admin component inside this task.
- **A3.** §3.3's table is a 2026-08-08 snapshot. Re-derive it; if your numbers differ, yours win and the
  difference is reported before any edit.
- **OQ1 — decide and record.** The `System/*` pair (R5): enrolling them is cheap, but `System/` is 7 stories and
  the same per-story mechanism applies. Retitling them to `Mantine/Primitives/*` changes their public Storybook
  identity. Choose with evidence; reserving them under a number is an acceptable third answer.

---

## 6. Pre-read rule bundle

- `CLAUDE.md` · `docs/agent-contract.md` (clause 12 stress cells, clause 16c) · `docs/orchestrator-procedures.md`
  (git policy) · `docs/rule-index.md` · `docs/qa-profiles.md` — the `Q4` row
- `scripts/lib/mantine-story-scope.mjs` — the whole file
- `scripts/check-stories-rendered.mjs` — `:96-115` (`VIEWPORTS_FULL`), `:375-425` (`MANTINE_VIEWPORTS` rationale +
  `MANTINE_STORY_EXTRA_VIEWPORTS`), `:445-460` (discovery)
- `scripts/check-locale-leak.mjs:370-380` · `scripts/check-story-coverage.mjs`
- `docs/storybook-governance.md` — §8.1 and the Task 669 wide-viewport record
- `docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md` — the xxl step's provenance
- `tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md` — §10

---

## 7. Scope

### 7.1 R1 — the mechanism, derived not prescribed

**This kickoff does not specify the mechanism's shape.** What it specifies is the contract: enrolling one story
must not enrol its siblings, the prefix list must keep working unchanged for everything already in scope, and all
three consuming gates must agree on scope — the module's own docstring calls itself "the ONE definition used to
scope every CI-blocking rendered/locale/coverage gate", and a mechanism that only `check-stories-rendered` honours
would break that claim.

### 7.2 R2 — measure three gates, not one

Before and after, per gate: `check:stories:rendered --mantine-only` (cells), `check:locale-leak --mantine-only`
(scoped stories), `check:story-coverage` (the N/N figure). A change you did not measure in all three is a change
you did not measure.

### 7.3 R4 — the viewport half, surgically

`HowItWorksSteps` needs the xxl step sampled. The mechanism already exists and has three precedents. Use it. Do
not touch `MANTINE_VIEWPORTS` (R8).

### 7.4 R5 — the `System/*` pair

Resolve, do not drift past. If enrolment: use R1's mechanism and measure. If retitle: that is an `src/` change with
a public-identity consequence, so say so and evidence it. If reserved: one number, with the reason and the file
list.

### 7.5 R6 — prove the negative

Enrolment is only meaningful if non-enrolment holds. Plant an un-enrolled story and show it appears in none of the
three gates; remove the plant. Restoration is evidenced, not asserted: the file's pre-plant `git hash-object` value
and its absence from `git status --porcelain`, both captured after the final gate run.

---

## 8. Out of scope — explicitly

- **Any change to `MANTINE_VIEWPORTS`.** The global 14-width expansion is retired by owner decision (§3.1). If you
  believe it is still needed, report it as a finding with your own measured cost — do not implement it.
- The 16 pre-existing FAIL cells (`HeroSearch` × 12, `NotificationBellView` × 4) — Sprint 49 and their owners.
- Fixing whatever a newly-enrolled admin story fails on — R7 escalates, this task does not remediate.
- `page.tsx`'s route-level heading site — **667** owns route inventory.
- Anything reserved under 733 or 734, and 727 (parked on OQ2/OQ3).

---

## 9. Current and required behavior

**Current.** Scope is a two-entry prefix list. One story cannot be enrolled without its siblings: `AdminUsersTable`
costs 21 stories, `FeaturedListings` costs 7. `HowItWorksSteps` is in scope but never sampled at the width where
its own heading token changes. The xxl step of a shipped typography token is proven for 1 of its 5 use sites.

**Required.** A story can be enrolled by name. `AdminUsersTable` is in all three gates and its 20 siblings are not.
`HowItWorksSteps` is sampled at ≥1440. The `System/*` pair has a recorded disposition. Every newly-failing cell is
named and escalated, and `MANTINE_VIEWPORTS` is byte-identical.

---

## 10. Implementation requirements

1. The per-story mechanism lives in `mantine-story-scope.mjs` and is exported the way the prefix list is — no gate
   re-implements scope locally.
2. Each enrolled story carries a reason at its enrolment site, naming why it belongs in a canonical-Mantine gate.
3. No prefix is added to `MANTINE_STORY_TITLE_PREFIXES` in this task. Adding one is the blast radius §3.4 measured.
4. **A newly-failing cell is a finding.** Name it, attribute it, escalate it. Do not add a tolerance, skip,
   allowlist or exemption to turn it green — that is 724's defect and this sprint exists to end it.
5. `check:assertion-liveness` must still exit 0 after the denominator changes; a newly-enrolled story that makes an
   assertion dead-everywhere is itself a finding.

---

## 11. Positive and negative flows

**Positive.** `AdminUsersTable` appears in all three gates; the other 20 `Admin/` stories appear in none;
`HowItWorksSteps` reports cells at ≥1440; the matrix total rises by exactly the enrolled cells and every moved
verdict is named.

| Negative flow | Applicable | Why |
|---|---|---|
| Enrolling one story silently enrols its siblings | **Yes** | The measured 21-vs-1 defect |
| A gate is changed without measuring the other two | **Yes** | R2; the module claims to be the one definition |
| Newly-enrolled cells fail and are suppressed | **Yes** | R7/§10.4 — the 724 failure this sprint ends |
| `MANTINE_VIEWPORTS` edited "while we're here" | **Yes** | R8; owner decision §3.1 |
| A newly-enrolled story makes an assertion dead-everywhere | **Yes** | §10.5 — `check:assertion-liveness` would flip DEAD-NEW |
| Plant left in the tree | **Yes** | R6 evidence is mandatory |
| Locale / i18n regression | No | No `messages/*` change; `check:i18n` still run as a guard — but note `check:locale-leak` scope **does** change (R2) |
| Auth / RLS / data-loss | No | Scripts and story scope only |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given the module, then a story can be enrolled by exact title, the prefix list is unchanged, and all three gates resolve scope through the same export.
- **AC2 [R2]** Given before/after runs of all three gates, then each one's scoped count is stated and the delta explained.
- **AC3 [R3]** Given the post-change story list, then `Admin/AdminUsersTable` is in scope and the other 20 `Admin/` stories are not — stated as a count, not a claim.
- **AC4 [R4]** Given the manifest, then `HowItWorksSteps` has cells at ≥1440 and the xxl heading step is observed there.
- **AC5 [R5]** Given the `System/*` pair, then each has a recorded disposition with evidence, or one reserved number covering both.
- **AC6 [R6]** Given the un-enrolled plant, then it appears in none of the three gates; after removal, `git hash-object` equals its pre-plant value and the path is absent from `git status --porcelain`.
- **AC7 [R7]** Given the final matrix, then every cell differing from `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS` is named and attributed, and no cell was made green by a new exemption.
- **AC8 [R8]** Given the diff, then `MANTINE_VIEWPORTS` is byte-identical.
- **AC9 [R10]** `tsc` exit 0, `build` exit 0, `check:assertion-liveness` exit 0.
- **AC10 [R11]** Two counting passes, the second after the session log and backlog row exist; the backlog baseline was read from `git show HEAD:docs/backlog.md | wc -l` before the first edit and is quoted.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** Three CI-blocking gates change scope; the task claims a gate behaviour and
must prove it by plant; the matrix denominator moves.

| # | Command | Expected |
|---|---|---|
| 1 | `git status --porcelain` + `git show HEAD:docs/backlog.md \| wc -l` | A1 manifest + R11 baseline |
| 2 | Three gates, pre-change | R2 "before" |
| 3 | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` | Baseline vs §3.3/§9 |
| 4 | Implement R1, R3, R4 | — |
| 5 | Three gates, post-change | AC2, AC3 |
| 6 | Plant un-enrolled story · three gates · remove · `git hash-object` | AC6 |
| 7 | `npm run build-storybook` + `screenshots:assert -- --mantine-only` (final) | AC7 |
| 8 | `npm run check:assertion-liveness` | exit 0, AC9 |
| 9 | `npx tsc --noEmit` · `npm run check:i18n` | exit 0 |
| 10 | `npm run build` | **exit 0, mandatory** |
| 11 | `check:file-integrity` + `check:mojibake`, twice | AC10 |

A failed or unrun step 10 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Report: changed files with reasons · R1–R11 each with its evidence artifact · every command with its **actual**
result and exit code · evidence root (`.screenshots/task678-evidence/`, local-only per D6) · assumptions,
deviations, limitations · unresolved issues. State the scoped-story count for all three gates before and after, and
the matrix total before and after. Then update `docs/backlog.md` — **replacing** the "Last Session" block, never
appending — and write `docs/sessions/<date>-task678-per-story-gate-enrolment.md`.

---

## 15. Task quality gate

Checked before publication: a fresh Sonnet session can execute this without chat context · every requirement has a
binary AC and a verification method · **the backlog's own framing for this number was tested against the code and
retired by a quoted owner decision rather than implemented on faith** · every count here was measured 2026-08-08 —
21 `Admin/` stories, 7 `System/`, 5 use sites, 4024 cells at 14 widths, ~30 min per current sweep · the mechanism's
shape is deliberately withheld and replaced by the contract it must satisfy · the backlog's "+16 cells" estimate was
checked and found an order of magnitude low, and the corrected figure is in the kickoff · the negative case
(non-enrolment) has its own requirement and plant, not just the positive · newly-failing cells have an explicit
escalate-don't-suppress requirement · the backlog-baseline misreporting that hit 717, 721 and 722 is pre-empted in
R11 with the exact command.
