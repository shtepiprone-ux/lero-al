# Task 788 — delete the unconsumed `src/components/layout` primitive barrel

**Sprint:** 70 · **Priority:** P2 · **QA profile:** **Q1** · **Filed:** 2026-09-05 · **State:** `REVISION 1 REQUIRED` (orchestrator review 2026-09-05 — see §14)

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception: **no review
ledger**.

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **dead-code deletion + reference census + documentation truth-up**.
This is a deletion task, not a migration. Nothing here is restyled, and no Mantine primitive is created.

## 2. Objective

`src/components/layout/` exports four components — `FilterBar`, `PageShell`, `Section`, `PageHeader` — through a
barrel `index.ts`. **None of them has a production consumer.** They are imported only by their own four Storybook
stories, which also import each other, so the set keeps itself alive in a closed loop. Delete the four components,
their four stories, the barrel, and every reference that asserts them as live.

This task exists because Task 788 was originally scoped as *"migrate `FilterBar` to Mantine"* on a count of 18 raw
Tailwind classes. The count was correct; the premise was not. The consumer trace below was run before scoping, and
it disproved the migration.

## 3. Verified context — measured 2026-09-05, do not re-derive from a document

### 3.1 The set to delete

| Path | Bytes | `'use client'` | Raw Tailwind classes |
|---|---:|---|---:|
| `src/components/layout/FilterBar.tsx` | 5 960 | **yes** | 18 |
| `src/components/layout/PageShell.tsx` | 706 | no | 2 |
| `src/components/layout/Section.tsx` | 800 | no | 3 |
| `src/components/layout/PageHeader.tsx` | 1 150 | no | 6 |
| `src/components/layout/FilterBar.stories.tsx` | 7 893 | — | 9 |
| `src/components/layout/PageShell.stories.tsx` | 4 738 | — | 14 |
| `src/components/layout/Section.stories.tsx` | 4 879 | — | 2 |
| `src/components/layout/PageHeader.stories.tsx` | 8 337 | — | 21 |
| `src/components/layout/index.ts` | 158 | — | — |

None of the four has a `.module.css`; the only module CSS in that directory belongs to `FooterView`, `HeaderView`
and `MobileNavDrawer`, which are **out of scope**.

### 3.2 The consumer trace — this is the whole basis of the task

`FACT`: the only `import { FilterBar }` anywhere in `src/` is `src/components/layout/FilterBar.stories.tsx:7`.
`FACT`: `grep -rn "from '@/components/layout'" src/` returns **zero** matches — nobody imports the barrel.
`FACT`: `PageShell`, `Section` and `PageHeader` are imported only by the four stories in that same directory.
`FACT`: no test references any of the four.

⚠️ **The trap that makes a naive grep say "consumed".** `src/modules/cabinet/components/ListingsTab.tsx:170`
declares a **local constant** with the same name:

```tsx
const FilterBar = (
  <div className="flex items-center gap-1 flex-wrap" role="group" aria-label={t('filter_ALL')}>
```

That is a JSX variable in a live cabinet component. It is **not** this component, it does not import it, and it is
**out of scope** — it is reserved as Task **789**. Any census that counts it as a consumer is wrong; any change to
it is a scope violation.

`src/components/admin/AdminPageShell.stories.tsx` uses a **prop** named `filterBar`/`showFilterBar`. Also unrelated.

### 3.3 What the deletion does *not* touch — measured, so no orphan is possible

| Registry | Entries for the four |
|---|---|
| `scripts/story-coverage-exempt.json` | **0** |
| `scripts/mantine-migration-scope.json` | **0** |
| `scripts/governance/tailwind-entropy.allowlist.json` | **0** |
| `design-tokens-allow` markers in the 8 files | **0** |
| `docs/critical-flow-registry.md` | **0** as a registered flow (the single grep hit is Task 605 prose in the ListingCard row) |
| `docs/component-coverage-matrix.md` | **0** |
| `docs/storybook-governance.md` | **0** |

This is the opposite of Task 787, whose deleted file carried four markers and a manifest entry. Here the only
consequences are the Storybook file count, the catalog, and two documents in §3.4.

### 3.4 The live documentation that will become false

**`docs/component-catalog.md`** — four rows and the counters:

- `:90` `| `FilterBar` | APPROVED | ✅ | — | — |`, `:96` `PageHeader`, `:97` `PageShell`, `:98` `Section`
- `:86` section heading `## Layout Components (`src/components/layout/`) (10)`
- `:11-17` summary: total **242**, Storybook stories **47**, locale-aware **107**, client components **156**,
  arbitrary Tailwind **36**, flagged for review **51**

None of the four rows carries 🌐 or ⚠️, and only `FilterBar` carries `'use client'`. The hand-correction is
therefore: total −4, Storybook stories −4, client components −1, section count 10 → 6; **locale-aware, arbitrary
Tailwind and flagged-for-review are unchanged**. Follow the file's own documented hand-correction precedent (its
header already records deferred regeneration for Tasks 672 / 681 / 787); do **not** run `npm run catalog:components`,
which would sweep in unreviewed drift.

**`docs/design-system.md`** — this is the substantive half. The file treats the four as a documented architecture
tier, not as incidental mentions:

- `:145` tier table, row **2. Global layout primitive** — names **PageShell, PageHeader, Section, FilterBar** as
  app-wide structural shells living in `src/components/layout/*`, alongside the admin specialisations
  `AdminPageShell`, `AdminTable`, `AdminCardList`.
- `:197`, `:200`, `:202`, `:228`, `:230`, `:1636` — prescriptive canonical fragments, e.g. *"`FilterBar` outer row:
  `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:max-sm:w-full`"*.
- `:166`, `:401` — descriptive references inside admin and route inventories.
- `:463` — the Phase 1 roadmap: *"Create/normalize global containers + the layout primitives (PageShell, PageHeader,
  Section, FilterBar, ActionBar)"*, immediately followed at `:464` by the owner's own note that **Task 343 was
  FROZEN / rejected for implementation** and Phase 1 was to be delivered as a graduated DS-1..DS-4 queue.

`INFERENCE` (state it, do not silently assume): the public half of tier 2 was documented but never adopted — zero
consumers, and its own roadmap entry records the delivery plan as frozen. The admin half (`AdminPageShell`) **is**
live and stays.

**`docs/responsive-screenshot-matrix.md`** — **40 rows** whose story IDs are `layout-pageshell--*`,
`layout-pageheader--*`, `layout-filterbar--*`, `layout-section--*`, several marked `**CRITICAL**`.

`FACT`: `scripts/responsive-screenshots.mjs` mentions that document only in comments (`:20`, `:21`, `:40`) — it does
**not** parse it. So these rows are documentation, not a machine input, and deleting the stories cannot break
`npm run governance:screenshots` mechanically. They still become 40 false rows naming stories that no longer exist.

**Historical — leave untouched:** `docs/mantine-tailadmin-migration-tracker.md:187` (frozen by owner decision
2026-08-27), every `docs/sessions/**`, `docs/reviews/**`, `docs/backlog-archive.md`, `docs/governance-reports/**`,
`docs/chat-gpt-reports/**`. Also leave the many generic-word hits: `Section` as an English noun in
`docs/admin-ux-rules.md`, `docs/component-governance.md`, `docs/governance-checklists.md`,
`docs/design-system.md:119`, and `Section` imported from `@react-email/components` in the two e-mail templates —
these are **not** this component.

### 3.5 ⚠️ Two lessons this task inherits

**Task 782 F4 / Task 787:** a green gate does not close a deletion. `npm run governance:components` checks three
named files plus doc presence and cannot see a stale catalog row; the 787 census still found 24 live references a
green gate had missed. **Run the census at execution; §3.4 is a starting point, not an authority.**

**Task 787 §3.4 / D70-1:** `/[locale]` is a `ƒ` dynamic route, so `npm run build` never server-renders it. This task
deletes files from `src/components/layout/`, the directory the app shell lives in. A green build is therefore not
evidence that the site still renders — AC6 requires a real request.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | The four components, their four stories and `src/components/layout/index.ts` are deleted. `src/` contains no import of any of them. | P0 | AC1 |
| **R2** | Every live reference in `scripts/` and `docs/` is removed or corrected; every remaining hit is enumerated and classified `live` or `historical`. The `ListingsTab.tsx:170` local constant and the `@react-email/components` `Section` are classified as **not this component**. | P0 | AC2 |
| **R3** | `docs/component-catalog.md` loses the four rows; the section heading and the six summary counters are hand-corrected exactly as §3.4 derives. | P0 | AC3 |
| **R4** | `docs/design-system.md` no longer presents the four as a live tier-2 primitive: tier row `:145` keeps only the admin specialisations, the prescriptive fragments are retired with a dated Task 788 note, and `:463`'s Phase 1 list is marked superseded — citing the already-recorded Task 343 freeze and the Mantine path as current. `AdminPageShell`/`AdminTable`/`AdminCardList` are **preserved**. | P0 | AC4 |
| **R5** | `docs/responsive-screenshot-matrix.md`'s 40 rows for the deleted story IDs are removed, with the section counts the file states for itself recomputed. | P1 | AC5 |
| **R6** | No user-visible change anywhere: nothing rendered these components before or after. | P0 | AC6 |
| **R7** | No new token, marker, allowlist entry, story or component is introduced. `check:design-tokens --scope=mantine` stays 0, and the global finding set is unchanged. | P0 | AC7 |

## 5. Assumptions and open questions

- **Assumption (reversible):** the four are safe to delete because they have no consumer, not because they are
  unwanted. If the owner intends to revive the tier 2 public shells later, the git history is the record; nothing
  here is irreversible.
- **`OWNER DECISION — non-blocking, answer during review.`** Tier 2 in `docs/design-system.md:145` survives this
  task with only its admin members. Should that row be renamed to reflect that the public half is retired, or does
  the owner intend `src/components/layout/*` to be repopulated on the Mantine path? R4 requires only that the
  document stop asserting deleted files as live; it does not require choosing the tier's future. **Do not decide
  this in the executor session.**

## 6. Pre-read rule bundle

`CLAUDE.md` · `docs/agent-contract.md` · `docs/ai-behavior.md` Notes 18–23 · `docs/rule-index.md` →
"Component Catalog / Coverage" and "Docs / Governance / Task Template" · `docs/qa-profiles.md` ·
`docs/component-catalog-governance.md` · `docs/backlog.md`. Do **not** read the legacy Tailwind styling bundle:
nothing is being styled.

## 7. Scope

**Included:** deletion of the four components, the four stories and `index.ts`; the repo-wide reference census;
`docs/component-catalog.md`, `docs/design-system.md`, `docs/responsive-screenshot-matrix.md`; `docs/backlog.md` state
and the session log.

**Excluded:** `src/modules/cabinet/components/ListingsTab.tsx` and its hand-rolled filter bar — **reserved as Task
789**, not to be touched even though it contains raw Tailwind and a same-named local constant · `FooterView`,
`HeaderView`, `MobileNavDrawer` and their module CSS · `AdminPageShell`, `AdminTable`, `AdminCardList` and anything
under `src/components/admin/` · `src/components/ui/*` · every historical document in §3.4 · any new Mantine
component, story, token or theme value.

## 8. Current and required behavior

**Before:** four components and one barrel exist in `src/components/layout/`, are rendered by nothing, and are
described by three documents as a live design-system tier with 40 screenshot-matrix rows and four catalog rows.

**After:** they do not exist. `src/components/layout/` holds only the live chain — `Header`, `HeaderView`,
`HeaderActions`, `MobileNavDrawer`, `UserMenu`, `Footer`, `FooterView` and their module CSS. No document asserts a
deleted file as live. Every rendered surface of the site is byte-identical, because none of them ever rendered.

## 9. Positive and negative flows

**Positive flow:** delete the nine files → run the census → correct the three documents and the catalog counters →
gates green → a real request to `/sq` and `/sq/listings` still returns 200 with the header and footer present.

| Branch | Applicable? | Expected | Why |
|---|---:|---|---|
| Missing/invalid input | No | — | No runtime input; no code path is executed by anything |
| Authorization / RLS | No | — | No route, action or policy touched |
| Offline / network | No | — | — |
| Concurrent writer | No | — | No data model touched |
| Locale expansion | No | — | None of the four calls `useTranslations`; no message key is removed |
| Small viewport | No | — | Nothing renders them; §3.2 is the evidence, not an assumption |
| Changed consumer | **Yes** | Zero consumers exist, so no consumer can break — but the census must prove the set is closed, including the `ListingsTab` same-name trap | This is the one branch that can actually fail |
| Repeated execution | No | — | Deletion is idempotent |

## 10. Acceptance criteria

- **AC1 [R1]** — Given the nine paths in §3.1, when the task is complete, then all nine are deleted and
  `grep -rn "FilterBar\|PageShell\|PageHeader" src/ --include=*.tsx --include=*.ts` returns no import of any of them
  and no reference other than the `ListingsTab.tsx:170` local constant, which is named and classified.
- **AC2 [R2]** — Given a repo-wide grep across `src/`, `scripts/` and `docs/`, when every hit is enumerated, then
  each is classified `live — fixed` or `historical — untouched`, with the four generic-word/foreign-`Section`
  classes named explicitly. **Enumerate every hit; a summary count is not a census.**
- **AC3 [R3]** — Given `docs/component-catalog.md`, when the four rows are removed, then the heading reads `(6)` and
  the counters read total **238**, Storybook stories **43**, client components **155**, with locale-aware **107**,
  arbitrary Tailwind **36** and flagged **51** unchanged. State each delta and its reason.
- **AC4 [R4]** — Given `docs/design-system.md`, when tier 2 and the prescriptive fragments are corrected, then no
  line presents a deleted file as a live primitive, `AdminPageShell`/`AdminTable`/`AdminCardList` still appear, and
  `:463` carries a dated Task 788 note citing the existing Task 343 freeze. Quote each edited line before and after.
- **AC5 [R5]** — Given `docs/responsive-screenshot-matrix.md`, when the 40 rows are removed, then a grep for
  `layout-pageshell|layout-pageheader|layout-filterbar|layout-section` returns 0, and any self-stated row count in
  that file is recomputed and quoted.
- **AC6 [R6]** — Given `npm run build` exit 0 **and** `npm run start`, when `/sq` and `/sq/listings` are requested,
  then both return 200 with `site-header` and `site-footer` present in the HTML. A green build alone does **not**
  satisfy this (D70-1).
- **AC7 [R7]** — Given `node scripts/check-design-tokens.mjs --strict --scope=mantine`, then 0 violations and
  0 stale markers; and the unscoped `npm run check:design-tokens` finding set is diffed against
  `docs/sessions/evidence/task787/gate-design-tokens-unscoped.log` and differs only by findings inside deleted
  files, each named. `theme.ts` and `scripts/mantine-migration-scope.json` are untouched.
- **AC8 [R1]** — Given `npm run check:stories`, then the checked-file count drops **139 → 135** and violations stay
  0; `npm run check:story-coverage` stays 26/26; `npm run governance:components` stays green.

## 11. QA profile and verification plan

**Profile: `Q1 Targeted`.** Justified, not assumed: `docs/qa-profiles.md` routes a task to Q2+ by *user-visible and
layout risk*, and §3.2 proves the components have no rendered surface — there is nothing whose appearance can
change, and four stories are removed rather than changed. The rule *"a logic-only task that touches a UI file does
not automatically become Q3"* applies directly.

**No `OWNER VISUAL QA REQUIRED` matrix.** Q2–Q4 require one for every *changed or newly created* visible Storybook
artifact; this task creates none and changes none. Deleted stories have nothing to review. This classification is a
claim under the story-first gate and must be re-checked at execution: **if any of the four turns out to have a
production consumer after all, stop and report `BLOCKED` — do not migrate it and do not delete it.**

```powershell
node.exe -p process.platform            # win32
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories               # expect 135 files, 0 violations
npm.cmd run check:story-coverage        # expect 26/26
npm.cmd run governance:components
node.exe scripts\check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run start                       # then request /sq and /sq/listings — AC6
npm.cmd run check:file-integrity        # last — final path set
npm.cmd run check:mojibake              # last — final path set
```

**Transcript rule — this bit is not optional, it cost Task 787 a round trip.** Do **not** pipe a native command
through `Tee-Object`: in Windows PowerShell 5.1 it writes UTF-16LE, which `check:file-integrity` rejects as NUL
bytes and `check:mojibake` reads as U+FFFD, and `2>&1 |` bakes PowerShell's `NativeCommandError` wrapper into the
log. Capture with `& cmd.exe /c "<command> 2>&1"`, write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))`, and append
`EXIT_CODE=$LASTEXITCODE` **inside** the file. Retain every transcript under `docs/sessions/evidence/task788/`.
Record working directory, exact command and the real exit code read from inside the log, never from a wrapper.

## 12. Completion report contract

Files deleted and files changed · requirement IDs completed · the §3.4 reference census with **every** hit
classified · the catalog counter deltas with the reason for each · the before/after quote of every edited
`design-system.md` line · the `responsive-screenshot-matrix.md` grep result · commands run with real exit codes and
their transcript paths · the AC6 request results · assumptions · deviations · known limitations · anything left
open. Status must be `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 13. Task quality gate

| Question | Required answer |
|---|---|
| Could this delete something that is actually rendered? | No — §3.2 traces every import; AC1 re-runs the trace, and the task orders a `BLOCKED` stop if a consumer appears |
| Does a same-named local constant get mistaken for a consumer? | No — `ListingsTab.tsx:170` is named, quoted and excluded, and reserved as 789 |
| Can a green gate hide a stale reference? | No — AC2 requires an enumerated census, per 782's F4 and 787's 24 missed hits |
| Can this pass while `/[locale]` is broken? | No — AC6 requires a real request, per D70-1 |
| Is the QA profile justified rather than assumed? | Yes — §11 derives Q1 from the no-rendered-surface proof and orders a stop if that proof fails |
| Does the task invent an owner decision? | No — the tier-2 future is raised as an explicit open question and left to the owner |
| Does it touch the live cabinet bar? | No — explicitly out of scope, reserved as 789 |

---

## 14. Revision 1 — orchestrator review verdict (2026-09-05)

**Decision: `NEEDS REVISION`.** Reviewed against the real diff, all 13 retained transcripts, the two AC6 HTML
responses, and an independent re-run of the reference census.

Read this before touching anything. **The deletion is correct and is not being redone.** R1, R3, R4, R5, R6 and R7
are `VERIFIED`; AC1, AC3, AC4, AC5, AC6, AC7 and AC8 are `VERIFIED`. Revision 1 exists because the census contains
one false classification, and the `Files Changed` table is two rows short.

### 14.1 Closed by the review — do NOT redo any of this

| Item | Evidence the reviewer inspected |
|---|---|
| The nine deletions | `git status` shows 9 `D` entries; an independent grep of `src/` finds no import of any of the four — only the `ListingsTab.tsx:170` local constant, correctly named and excluded |
| **The three references this kickoff's own §3.3 missed** | `check-stories-rendered.mjs:159-163` (4 dead `ASSERT_STORIES` anchors), `check-locale-leak.mjs:168` (orphaned `'layout-filterbar': ['Studio']` key in a **live** gate), `storybook-governance.md:442` (required sweep-scope list). All three are real, all three are correctly fixed. See §14.3 — these are defects in this kickoff, not in the execution |
| AC3 counters | 238 / 43 / 107 / 155 / 36 / 51 and heading `(6)` — recomputed independently by the reviewer, matches §3.4's derivation exactly |
| AC4 | `design-system.md:145` keeps `AdminPageShell`/`AdminTable`/`AdminCardList` and dates the public-half deletion; §11.1 `RETIRED`; `:226`/`:228` fragments retired; `:463` `Superseded` citing the pre-existing Task 343 freeze. `:166`/`:399` left descriptive, as this kickoff classified them |
| AC5 | grep for `layout-pageshell\|layout-pageheader\|layout-filterbar\|layout-section` in the matrix → **0** |
| AC6 | `10-ac6-server-requests.log` plus the two retained HTML bodies; the reviewer independently confirmed `site-header` and `site-footer` present in both, 200/200 on port 3789 |
| AC7 / AC8 | scoped design-tokens 0/0; unscoped exit 1 with only the scanned-file count moving 455→450 and zero violation-line deltas; `check:stories` 135/0; `check:story-coverage` 26/26; `governance:components` green |
| Transcript hygiene | 13 logs, UTF-8 no-BOM, 0 NUL, 0 U+FFFD, `EXIT_CODE` in-file. The Task 787 `Tee-Object`/UTF-16 trap was avoided |
| The five red vitest tests | **Not caused by this task, and proved so rather than argued.** `FooterView.tsx` is byte-identical in `HEAD` and the worktree; its last change is `34faa47a9` (the Task 784 outage hotfix). `globals.css` last changed in `1b72b26e2` (787); `MantineListingCardPattern.tsx` in `7dd23e90b` (784). Filed as Task **790** — see §14.3 |

### 14.2 Required corrections

**R1.1 · `P1` · `docs/ui-rules.md:545-552` — a live prescriptive section for the deleted component.**

The census row in session-log §2 groups ten files into one line and asserts *"none are this component"*. That is
false for `docs/ui-rules.md`, which carries:

```
### FilterBar canonical alignment (Task 362, 2026-06-02)
FilterBar outer container: `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start [&>*]:max-sm:w-full`
… FilterBar filter cluster … Consumer's `filters` prop …
FilterBar Sheet body: NO own `p-*` on the inner filter area div …
```

Four prescriptive rules naming the deleted component's outer container, filter cluster, its `filters` prop and its
`Sheet` body. The enclosing heading is `## §15a — MOBILE CONTROL & TAB STACKING CONTRACT`, an active section, not a
retired one; `docs/rule-index.md` lists `ui-rules.md` as a live pre-read at `:41`, `:56` and `:203`; and the `Sheet`
rule is unmistakably about this component, whose own `FilterBar.tsx:3` comment recorded that it owned the Sheet
open-state. This is the same defect class R4 closed in `design-system.md`, in the legacy-path document.

- **Resolution:** retire the section in place using the treatment already applied in `design-system.md` §11.1/§12a —
  replace the four prescriptive lines with a dated `RETIRED (Task 788, 2026-09-05)` note that names the deletion and
  states the fragments no longer bind. Leave the rest of §15a untouched. Then give `ui-rules.md` its own census row
  marked `live — fixed` and remove it from the ten-file blanket row.
- **Verification:** `grep -n "FilterBar outer container:" docs/ui-rules.md` → 0 matches; `grep -n "### FilterBar
  canonical alignment" docs/ui-rules.md` → the heading carrying a `RETIRED` marker; session-log §2 shows a per-file
  row for `ui-rules.md`.

**The other nine files in that blanket row are genuinely clean** — the reviewer re-ran the census independently and
only `ui-rules.md` and `docs/critical-flow-registry.md` still match, the latter being Task-605 prose in the
`ListingCard` row. Do not re-audit the other eight; do correct the row so it no longer asserts a negative it did not
check per file.

**R1.2 · `P3` · session log §4 `Files Changed` — two rows short.**

The table lists 17 paths; `git status` holds 19. Missing: this session log itself, and
`docs/sessions/evidence/task788/` (13 transcripts + the 2 AC6 HTML bodies). `docs/backlog.md` is already listed.

- **Resolution:** add the two rows.
- **Verification:** the set of unique paths in §4 equals the set from `git --no-optional-locks status --short`.

### 14.3 Recorded by this revision

- **Two defects in this kickoff, charged to the orchestrator, not the executor.** §3.3 asserted `0` entries in
  `docs/storybook-governance.md` — measured with a backticked pattern that cannot match the file's unbackticked
  prose list; and §3.3 never grepped `scripts/*.mjs` for the four component names at all, only three JSON registries
  by path. Two of the three missed references followed directly. **The pattern was narrower than the claim it was
  supporting** — the eighth recorded instance of "a kickoff's own measured facts are not exempt", and the reason
  §3.5's order to re-run the census at execution is what saved this task.
- **Task 790 reserved (P1), filed before this verdict was written.** The full `npm run test` suite is red — 5
  failures across 4 files, all older than 788. The named one: `theme.d69-18.test.tsx:257-259` expects
  `FooterView.tsx` to contain the literal `theme.other.layout.footerGridGap`, while the Task 784 hotfix wrote
  `theme.other!.layout!.footerGridGap`; the sibling runtime assertion at `:134` still passes, so the contract is
  intact and only the mechanical source check is wrong. Root cause of the blindness: **no verification plan in this
  project runs the full suite** — 787 ran `vitest run src/components/layout/__tests__` only, and its review accepted
  that. 790 decides, per failure, whether the test or the source is wrong, and whether the full suite joins the
  standing gate set. **Out of scope for 788.**
- **`NOTE`** — the chat summary said *"All required gates pass with exit 0"* without mentioning `13-vitest.log`'s
  exit 1. The session log discloses it fully and asks for attribution review, so the record is honest; future
  summaries should name every non-zero exit alongside the log that holds it.
- **`NOTE`** — `docs/responsive-storybook-inventory.md` was corrected although §3.4 never named it. Classified as
  **in scope by consequence of R2**, not a scope violation; the §7 dated machine dump was correctly left historical.

### 14.4 Verification plan for Revision 1 — Windows-native PowerShell only

Two text edits, no product code, no deletion. Do **not** re-run the full gate set.

```powershell
node.exe -p process.platform          # win32
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Capture with `& cmd.exe /c "<command> 2>&1"` and write with
`[System.IO.File]::WriteAllLines(path, lines, (New-Object System.Text.UTF8Encoding($false)))`, appending
`EXIT_CODE=$LASTEXITCODE` inside the file. Never pipe a native command through `Tee-Object` — it writes UTF-16LE,
which `check:file-integrity` rejects as NUL bytes. Retain both transcripts under `docs/sessions/evidence/task788/`.

### 14.5 Completion report contract for Revision 1

Files changed · the corrected `ui-rules.md` section quoted before and after · the corrected §2 census row for
`ui-rules.md` · the completed §4 table · the two command exit codes · anything left open. Strongest permitted result
remains `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`.

### 14.6 Explicitly out of scope for Revision 1

`src/**` entirely · the nine deletions and every already-corrected document · the eight other files in the blanket
census row · Task **790**'s red suite · `docs/backlog.md`, the sprint Tasks table and this kickoff's `State` header
(orchestrator-owned).
