# Task 675 — Task 671 revision: canonical micro-heading colour, DOM nesting, and record corrections

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / Design-system token decision — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** Storybook / Visual Proof; **critical-flow regression** (`docs/critical-flow-registry.md`
  row 50); Q0 record correction.
- **Origin:** orchestrator review of Task 671 returned `NEEDS REVISION` (2026-07-28). Task 671's code is
  **not** reverted — it stays in the worktree, uncommitted, and this task amends it in place.

> **Read this first.** Task 671's implementation is sound. Three defects and two record errors were found by
> the review, all of them small and precisely located. Do **not** re-migrate anything, do **not** re-run the
> baseline captures — the review already produced the measured before/after table (§3.2), and it is quoted
> here so you never need to reproduce it.

---

## 2. Objective

Close the five findings that blocked Task 671's approval:

1. **F1 (`P1`)** — all 17 filter-section micro-headings silently changed colour. Establish **one canonical
   colour** for this artifact by owner decision and apply it explicitly.
2. **F6 (`P2`)** — the migrated Drawer title introduced invalid DOM nesting (`<p>` inside `<p>`).
3. **F2 (`P2`)** — the divider's recorded "before" hex is factually wrong in four documents.
4. **F3 (`P2`)** — Task 671's session log reports R7/R8 as closed on evidence that does not meet AC7/AC8.
5. **P3** — `isFirstVisible()` is named the inverse of what it returns.

---

## 3. Verified context

All facts below were measured by the orchestrator during the Task 671 review on 2026-07-28, from the
harness's own persisted captures. **Line numbers are from the current (Task-671-modified) worktree.**

### 3.1 Worktree state — NOT clean, and that is expected

Task 671's nine paths are uncommitted and **must stay** in the worktree. `git status --short` at design time:

```
 M docs/backlog.md
 M docs/critical-flow-registry.md
 M scripts/mantine-migration-scope.json
 M src/components/shared/FiltersPanel.tsx
 M src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx
 M src/design-system/mantine/patterns/index.ts
?? docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md
?? src/design-system/mantine/patterns/MantineFilterSection.tsx
?? src/stories/patterns/mantine/FilterSection.stories.tsx
```

`HEAD` = `438c76c96` `docs(Task671): FiltersPanel de-Tailwind via canonical MantineFilterSection pattern`
(the kickoff file only). Branch `task/q0-ci-rendered-locale-split`, upstream
`origin/task/q0-ci-rendered-locale-split`.

**Mandatory:** re-snapshot `git status --porcelain` before the first write and record it. Every one of the
nine paths above must still be present and attributable to Task 671. If any path is missing or a tenth
appears, **stop and report** — do not reconcile it yourself.

### 3.2 The measured before/after table (do not re-capture)

Source captures, both already on disk:

- **before** — `.screenshots/rendered-assert/2026-07-28T10-16/` (pre-change; byte-identical to `06-44`)
- **after** — `.screenshots/rendered-assert/2026-07-28T13-30/` (post-Task-671)

Reference cell `mantine-primitives-filterspanelshell--default__en__desktop-1024.png`:

| Artifact | Before (measured) | After (measured) | Ruling |
|---|---|---|---|
| Section divider | **`#E5E5E5`** (y=192, y=558) | `#D0D5DD` (y=190, y=565) | D2 — **correct**, hex misrecorded |
| Section label | **`#737373`** (y=100–109) | `#475467` | **D4 — undocumented, this task fixes it** |
| Property-grid gap | 6px | 8px (section height +9px) | D1 — correct |
| Title badge | `<span>` pill | Mantine `Badge` | faithful (≤15 px/row residual) |
| Location label baseline | y=101–109 | y=100–108 | −1px, `lineHeights.xs` 1.5 vs Tailwind 16px |
| Location combobox | y=143–156 | y=141–154 | −2px, same cause |

**`#EBEBEB` does not exist anywhere in the before capture** (0 pixels). The kickoff's D2 and
`globals.css:371`'s comment were both wrong; `--border` → `--neutral-200` renders as `#E5E5E5`.

### 3.3 Blast radius — already established, do not re-derive

All 1100 common cells between `10-16` and `13-30` were hashed: **1021 identical, 79 changed across 8
stories.** Only `filterspanelshell` (16/16) is a structural change. The other seven are harness noise
(74–485 px, 0.02–0.19%), proven by the same 194-px `button` delta appearing **between two post-change runs**
(`13-30` vs `14-00`). `filtercontrols` and `herosearch--default` are in the identical set — AC8's
preservation clause is verified.

The `avatar × it × mobile-375` FAIL in `13-30` is a one-off capture artifact: that cell is byte-identical
(`1f6177d1…`) in `06-44`, `10-16` **and** `14-00`; only `13-30` differs.

### 3.4 F1 — the colour decision (owner, 2026-07-28)

The artifact is the 12px uppercase micro-heading rendered once per filter section (`LOCATION`,
`PROPERTY TYPE`, `PRICE`, …) — 17 instances.

| | Value | Source |
|---|---|---|
| Pre-671 | `#737373` | Tailwind `text-muted-foreground` → `--muted-foreground` → `--neutral-500` → `oklch(0.556 0 0)`. Legacy shadcn. |
| Task 671 shipped | `#475467` | Mantine `c="dimmed"` → light-scheme `gray.6` (`theme.ts:12`). |
| **Owner ruling** | **`#667085` = `gray.5`** | TailAdmin gray ramp (`theme.ts:11`), the ramp's stated **"secondary text"** stop. |

**Provenance under clause 16a.** `docs/tailadmin-style-reference.md` has a row for a *form* label
(`text-theme-sm font-medium text-gray-700`, 14px) and the general statement "secondary text gray-500"
(`:48`), but **no row for a 12px uppercase micro-heading**. `grep -rn 'tt="uppercase"' src/` returns exactly
one hit — the new `MantineFilterSection.tsx` itself. No precedent existed. The owner therefore established
this row by decision on 2026-07-28; that decision is the source of truth and must not be re-litigated.

**Implementation constraint:** set the colour **explicitly** as `c="gray.5"`. Do **not** use `c="dimmed"` and
do not rely on Mantine's dimmed default resolving to any particular ramp index — pinning it is the point.

`globals.css:336`'s own comment (`/* Muted text #8C8C8C */`) is also stale — the real render is `#737373`.
**Out of scope here** (see §8).

### 3.5 F6 — the DOM nesting defect

`responsiveBottomSheet.tsx:134` wraps the `title` slot in `<Text fw={600} size="sm" c="gray.8">`, which
renders a `<p>`. Task 671 replaced `FiltersPanel`'s `<span className="font-semibold text-base">` with
`<Text fw={600} size="md">` — Mantine `Text` defaults to `component="p"`. React now emits, on the mobile
bottom-sheet path:

```
In HTML, <p> cannot be a descendant of <p>. This will cause a hydration error.
```

Reproduced in the owner's native `vitest` run (2026-07-28) from `heroSearch.smoke.test.tsx` and
`filtersPanelShell.smoke.test.tsx`. `<span>` is phrasing content and was legal; `<p>` is not. **This warning
did not exist before Task 671.**

The companion warning `<div> cannot be a descendant of <p>` (the `Group`) is **pre-existing** — the pre-671
title was also rooted in a `<div className="flex items-center gap-2">`. Out of scope (§8).

Why no gate caught it: `check:hydration` exercises homepage SSR, and the Drawer is closed at first paint, so
this subtree never renders server-side. No production hydration failure results (React builds the DOM via
`createElement`; the HTML parser is not involved), but it is a spec violation and console noise.

### 3.6 F3 — what AC7/AC8 actually required vs. what exists

`MANTINE_VIEWPORTS` (`scripts/check-stories-rendered.mjs:392`) is **deliberately** 4 widths —
`320 / 375 / 390 / 1024` — and `FiltersPanelShell` is not in `ASSERT_STORIES`, so the story never receives
`VIEWPORTS_FULL`'s 14 widths. AC7's matrix was therefore **not producible** by the current harness. That is
an orchestrator task-design defect, not an executor failure.

**Do not enrol these stories in `MANTINE_STORY_EXTRA_VIEWPORTS` or `ASSERT_STORIES` in this task** — widening
the standing gate is its own decision with its own blast radius (§8).

The correct action is to make Task 671's session log tell the truth about what was and was not proven.

**Owner visual waiver, 2026-07-28.** The owner reviewed `Mantine/Primitives/FiltersPanelShell` and
`Patterns/Mantine/FilterSection` natively in Storybook at **480 / 560 / 680 / 768** across `sq` / `uk` / `en` /
`it` and confirmed both render correctly. This closes AC7's substantive concern for the widths the harness
never captured — in particular the 640px boundary is confirmed working (480/560 render the column layout in
the bottom sheet; 680/768 render the wrapping row in the desktop Drawer, exactly matching the pre-migration
Tailwind `sm:` behaviour). Record this waiver, with its date and width/locale list, in Task 671's session log.
It is a **waiver of the missing captures**, not a claim that the 14-width matrix was produced.

### 3.7 Known fixture limitation — the property-type grid never renders localized labels

Discovered during the owner's native review (2026-07-28). In every locale, the `FiltersPanelShell` story's
property-type grid renders **raw enum values** — `apartment`, `house`, `room`, `land`, `commercial`, `office`,
`garage`, `parking`, `warehouse`, `other`.

Cause: `FiltersPanel` calls `usePropertyTypes()` internally (no prop seam). Storybook serves no
`/api/property-types`, so the hook's `.catch()` returns `buildFallback()`, which is
`PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.value }))` — the label **is** the raw value
(`src/hooks/usePropertyTypes.ts`). The real localized labels exist in `messages/*.json` and are never reached.

**Why this matters to Task 671:** D1 changed this exact grid's gap 6px → 8px, and R13's stop condition was
"if `gap="xs"` breaks the 2-column grid at 320px **in any locale**, stop". That condition was evaluated
against English enum strings, so it was never genuinely exercisable. Measured risk, for proportion:

| Locale | Longest real label | Chars | Fixture longest |
|---|---|---:|---|
| it | `Appartamento` | 12 | `warehouse` (9) |
| sq | `Apartament` | 10 | `warehouse` (9) |
| en | `Apartment` | 9 | `warehouse` (9) |
| uk | `Квартира` | 8 | `warehouse` (9) |

At 320px the grid column is ≈120px and `Appartamento` needs ≈114px — it fits, but with ~6px of headroom.

**This task does not fix it** (the fix is a production-hook change with six consumers — Task 679, §8). The
requirement here is to **record it as a limitation** so R13's status is honest, not to re-litigate D1.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | §3.4; owner 2026-07-28 | `MantineFilterSection.tsx:33` uses `c="gray.5"` (not `dimmed`), and the rendered label measures `#667085` | P0 | AC1 + AC5 |
| R2 | §3.4; cl. 16a/16b | The colour decision is recorded as **D4** with its provenance (owner decision, TailAdmin "secondary text", no pre-existing micro-heading row) in the component doc block and the session log | P0 | AC2 |
| R3 | §3.5; cl. 14 | The Drawer title renders `<span>`, not `<p>`; the `<p> cannot be a descendant of <p>` warning is **absent** from the vitest stderr | P0 | AC3 |
| R4 | §3.2 | The divider's before-hex reads `#E5E5E5 → #D0D5DD` in Task 671's kickoff §3.4 D2, its session log §8/§9, `docs/backlog.md`, and `docs/critical-flow-registry.md` row 50 | P0 | AC4 |
| R5 | §3.6; cl. 9 | Task 671's session log §5 marks R7 and R8 `PARTIALLY IMPLEMENTED`, states the 4-width limit explicitly, and carries §3.2's measured table, §3.3's blast-radius result, and §3.6's owner visual waiver | P0 | AC6 |
| R5a | §3.7; cl. 9 | Task 671's session log records R13 as `NOT VERIFIABLE` with §3.7's cause and measurement table, replacing the current "stop condition not triggered" claim | P1 | AC6a |
| R6 | P3 finding | `isFirstVisible` is renamed to `withTopDivider`; behaviour unchanged | P1 | AC7 |
| R7 | cl. 3, 4, 5 | Every filter behaviour stays byte-identical; `useHomepageFilters.ts` and all three consumers keep a zero diff | P0 | AC8 |
| R8 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript | P0 | AC9 |
| R9 | cl. 15; registry row 50 | All 4 critical-flow suites stay green at 38/38 | P0 | AC5 |
| R10 | cl. 7 | Zero new i18n keys; `check:i18n` parity unchanged at 2215×4 | P1 | AC10 |

---

## 5. Assumptions and open questions

- **A1.** `gray.5` = `#667085` is index 5 of the `gray` tuple at `theme.ts:11`. Confirm by reading the tuple
  before writing; if the index does not resolve to `#667085`, **stop** — do not substitute a nearby stop.
- **A2.** Changing the label colour changes rendered pixels, so the 16 `FiltersPanelShell` cells and the 16
  `FilterSection` cells **will** differ from `13-30`. That is expected; AC5 requires re-capture and a
  three-way comparison, not an unchanged result.

**Open questions — none.** F1's colour is an owner decision (§3.4); F2's hex is measured (§3.2); F3's scope
boundary is set (§3.6).

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 3, 4, 5, 7, 9, 12, 14, 15, 16, 16a, 16b, 16c.
2. `docs/rule-index.md`
3. `docs/qa-profiles.md` — the **Q4** row.
4. `docs/backlog.md`
5. `docs/critical-flow-registry.md` — row 50.
6. `docs/tailadmin-style-reference.md` — `:24` (theme-xs), `:48` (text-colour statement), `:79` (Label row).
7. `docs/mantine-responsive-design-system.md`
8. `tasks/kickoff_prompt_Task_671_FiltersPanel_DeTailwind_Canonical_FilterSection.md` — §3.4 D2 and §10 I4.
9. `docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md` — §5, §8, §9, §12.

**Source pre-read**

10. `src/design-system/mantine/patterns/MantineFilterSection.tsx` — all 41 lines.
11. `src/design-system/mantine/theme.ts` — lines 4–16 (gray tuple).
12. `src/components/shared/FiltersPanel.tsx` — the title slot and the `isFirstVisible` helper.
13. `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` — lines 118–160.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/patterns/MantineFilterSection.tsx` | modify | `c="dimmed"` → `c="gray.5"`; extend the doc block with the D4 provenance (R1, R2). |
| `src/components/shared/FiltersPanel.tsx` | modify | Title `<Text component="span">` (R3); rename `isFirstVisible` → `withTopDivider` (R6). Nothing else. |
| `src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx` | modify | Add **one** test asserting the title renders a non-`<p>` element (R3). Existing 18 assertions untouched. |
| `tasks/kickoff_prompt_Task_671_FiltersPanel_DeTailwind_Canonical_FilterSection.md` | modify | §3.4 D2 hex correction only (R4). Do not restructure the file. |
| `docs/sessions/2026-07-28-task671-filterspanel-detailwind-filtersection.md` | modify | R4 + R5: hex corrections, §5 R7/R8 downgrades, §3.2 table, §3.3 blast-radius, D4 record. |
| `docs/critical-flow-registry.md` | modify | Row 50 hex correction + this task's evidence. **Row 50 only.** |
| `docs/backlog.md` | modify | Correct the 671 hex; add a concise 675 entry. Keep ≤80 lines — the file is **at** 80 now, so consolidate 671's over-long line rather than appending a second wall of text. |
| `docs/sessions/2026-07-28-task675-*.md` | **create** | Session log with a `Files Changed` table matching the real diff. |

---

## 8. Out of scope

- **Re-migrating anything from Task 671.** The pattern, the manifest append, the 17 call sites, the story,
  and the D3 derivation are all approved in substance. Touch only what §7 lists.
- **`globals.css` stale hex comments** (`:336` `#8C8C8C`, `:371` `#EBEBEB` — both wrong). Real, and the root
  cause of F2, but a shared legacy file with its own blast radius. **Reserve Task 676.**
- **The pre-existing `<div>` in `<p>` warning** from `responsiveBottomSheet.tsx`'s title `Text`. Predates
  Task 671, lives in a load-bearing shared pattern. **Reserve Task 677.**
- **`MANTINE_STORY_EXTRA_VIEWPORTS` / `ASSERT_STORIES` enrolment** to reach AC7's 14-width matrix (§3.6).
  **Reserve Task 678.**
- **`usePropertyTypes`'s `buildFallback()` shipping raw English enum values to all four locales** (§3.7).
  This is a real production defect, not only a fixture artifact: if `/api/property-types` fails, every locale
  renders `apartment`/`warehouse` although `messages/*.json` holds `Apartament`/`Квартира`/`Appartamento`.
  Six production consumers (`AdminListingsTable`, `useHomepageFilters`, `ActiveFilterChips`,
  `FavoritesTypeFilter`, `StepBasicInfo`, `useListingsUrlFilters`) — too wide for this task.
  **Reserve Task 679.** Fixing it also makes §3.7's fixture render localized labels for free, which is what
  finally makes R13 exercisable — so 679 should re-run the 320px grid check for all four locales.
- **`check:locale-leak`'s lowercase blind spot.** `isEnglishish()` (`scripts/check-locale-leak.mjs:215`)
  returns `false` unless the token matches `/^[A-Z]/`, so the ten lowercase enum values above went unreported
  in `sq`/`uk`/`it` even though the scanner actively scans this story (it carries a `PER_STORY_TOKENS` entry
  for it). This is the exact class of leak raw-DB/fallback values produce. **Reserve Task 680.**
- **`c="dimmed"`'s other 15 consumers.** This task pins one artifact, not a global sweep.
- **`useHomepageFilters.ts`, the leaf components, `MantineDrawer`, `HeroSearchView`/`HeroSearch`/`page.tsx`,
  `theme.ts`, `ListingsFilters.tsx`** — zero diff, as in Task 671.

---

## 9. Current and required behavior

**Current (post-671, pre-675):** section labels render `#475467`; the Drawer title renders a `<p>` inside the
bottom sheet's own `<p>`; the divider helper is named `isFirstVisible` but returns `true` when the section is
**not** first.

**Required after:** labels render `#667085`; the title renders a `<span>`; the helper is `withTopDivider`.
Every other rendered pixel, every handler, and the D1/D2/D3 outcomes are unchanged.

---

## 10. Implementation requirements

**I1 — the colour.** `c="gray.5"` on the label `Text`. Nothing else in the component changes: `size="xs"`,
`fw={600}`, `tt="uppercase"`, `letterSpacing: '0.05em'`, `p="lg"`, `mb="sm"` and the `gray-3` divider all
stay exactly as Task 671 shipped them.

**I2 — the D4 record.** Extend `MantineFilterSection.tsx`'s doc block with a short block naming: the owner
decision and its date, the value `gray.5` = `#667085`, why it is not `dimmed` (unpinned; resolves to gray-6),
and why clause 16a applies (no TailAdmin row for a 12px uppercase micro-heading; `tt="uppercase"` had exactly
one hit in `src/`). Keep it to the same register as the existing D2 comment — a few lines, not an essay.

**I3 — the title element.** `<Text component="span" fw={600} size="md">`. Verify by inspection that this
changes the element only: Mantine `Text` applies identical `--text-fz`/`--text-lh` regardless of `component`.

**I4 — the rename.** `isFirstVisible` → `withTopDivider`, at its declaration and all 17 call sites. The
expression `key !== firstVisibleSection` is **correct** — do not invert it while renaming. Run the suite
immediately after; a green run with an inverted predicate is impossible because AC5(a) asserts both states.

**I5 — the new test.** One test in the existing `describe` for the title, asserting the accessible title text
is **not** inside a `<p>` (e.g. `.closest('p')` is null on the title node, or `tagName === 'SPAN'`). It must
fail if `component="span"` is dropped — prove that with a planted violation (I6).

**I6 — planted-violation proof (Q4).** Remove `component="span"`, show the new test exits non-zero **and**
the `<p> cannot be a descendant of <p>` stderr returns, revert, show green, confirm the plant is absent from
the final `git status`.

**I7 — record corrections are edits, not rewrites.** For R4/R5, change the specific sentences. Do not
regenerate Task 671's session log or reflow its tables; a reviewer must be able to diff it cleanly.

---

## 11. Positive and negative flows

### Positive flow

Homepage `/{locale}`, user opens the filters panel: 17 sections render with `#667085` micro-headings, the
first **visible** section still draws no top rule, later sections draw the `#D0D5DD` rule, the title reads
`Advanced filters` + count badge with no DOM-nesting warning on either the desktop Drawer or the mobile
bottom-sheet path.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | The wrappers accept no input | N/A | — |
| Authorization / RLS | **No** | Public route, local draft state | N/A | — |
| `shows()`-gated empty set | **Yes** | `shows()` predicates | First visible section still undivided after the rename | existing AC5(b) |
| `contentReady === false` | **Yes** | `useIdleMount` | Empty body, no orphan divider | existing AC5(c) |
| Mobile bottom sheet (<640) | **Yes** | `responsiveBottomSheet` | Title renders, **no** `<p>`-in-`<p>` warning | AC3 + I6 |
| Locale expansion (uk/it) | **Yes** | cl. 7, 11 | `#667085` labels wrap, never clip, at 320px | AC5 |
| Contrast | **Yes** | cl. 11 | `#667085` on white = 5.9:1, ≥ WCAG AA for 12px text. State the measured ratio. | AC1 |
| Duplicate action / concurrent writer | **No** | Local draft state | N/A | — |
| RTL text direction | **No** | No RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — `grep -n 'c="' src/design-system/mantine/patterns/MantineFilterSection.tsx` shows `c="gray.5"`
  and **no** `c="dimmed"`. State the `gray` tuple index 5 value read from `theme.ts` and the computed contrast
  ratio on white.

- **AC2 [R2]** — The D4 provenance block exists in the component doc block **and** in the Task 671 session
  log's §8/§9 rows for "Section label", each naming the owner decision, the date, and the clause 16a basis.

- **AC3 [R3]** — The vitest stderr for the 4 suites contains **zero** occurrences of
  `<p> cannot be a descendant of <p>`. Quote the grep. The pre-existing
  `<div> cannot be a descendant of <p>` may remain — state that it does, and that it is Task 677.

- **AC4 [R4]** — `grep -rn 'EBEBEB' tasks/ docs/` returns **0** hits in Task 671's kickoff, its session log,
  `docs/backlog.md`, and `docs/critical-flow-registry.md`. Each now reads `#E5E5E5 → #D0D5DD`.

- **AC5 [R1, R9]** — `npx vitest run` over the 4 critical-flow suites exits 0 at **39/39** (38 + the AC3
  test). Then rebuild Storybook and run `npm run screenshots:assert -- --mantine-only`: `FiltersPanelShell`
  and `Patterns/Mantine/FilterSection` both 16/16 PASS, total FAIL 0 (or, if `avatar × it × mobile-375`
  reappears, cite §3.3's byte-identity proof rather than re-investigating). Then measure the label colour in
  the new capture at the §3.2 reference cell and confirm **`#667085`**.

- **AC6 [R5]** — Task 671's session log §5 shows R7 and R8 as `PARTIALLY IMPLEMENTED` with the 4-width limit
  stated, and carries §3.2's measured table, §3.3's blast-radius result, and §3.6's owner visual waiver
  (date + the 480/560/680/768 × 4-locale list) verbatim.

- **AC6a [R5a]** — Task 671's session log's R13 row reads `NOT VERIFIABLE`, quotes §3.7's cause
  (`buildFallback()` → `label: pt.value`) and its 4-row measurement table, and names Task 679 as the closure
  path. The current wording "stop condition not triggered — no reflow/clip/overflow at 320px in any locale"
  must be gone: `grep -n "stop condition not triggered" docs/sessions/2026-07-28-task671-*.md` → 0 hits.

- **AC7 [R6]** — `grep -rn 'isFirstVisible' src/` returns **0** hits; `withTopDivider` appears once at its
  declaration and 17 times at call sites.

- **AC8 [R7]** — `git diff --stat` shows `useHomepageFilters.ts`, `HeroSearchView.tsx`, `HeroSearch.tsx`,
  `page.tsx`, `MantineDrawer.tsx`, `responsiveBottomSheet.tsx`, `theme.ts` and `ListingsFilters.tsx` absent.

- **AC9 [R8]** — `npm run build` exits 0, 40/40 pages, fresh post-change transcript.

- **AC10 [R10]** — `npm run check:i18n` exits 0, 2215×4, no new keys. `npm run check:design-tokens` shows the
  same 44-violation set with 0 in touched files. `npm run check:file-integrity` and `npm run check:mojibake`
  exit 0.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release / Critical Flow`** — `FiltersPanel.tsx` shell is named in registry row 50, and this task
changes its rendered output. Q4's planted-violation requirement is satisfied by I6.

The visual matrix is **explicitly the 4-width `--mantine-only` set** (320/375/390/1024 × sq/en/uk/it), not
the 14-width canon — §3.6 records why, and closing that gap is Task 678. Do not report this limit as
satisfied coverage; report it as the documented scope of this task's proof.

### 13.2 Order of operations

1. `git status --porcelain` — confirm Task 671's nine paths, record the snapshot.
2. Read `theme.ts`'s gray tuple; confirm index 5 = `#667085` (A1 stop condition).
3. Apply I1 + I2 + I3 + I4.
4. Add the I5 test; run I6's planted-violation proof.
5. Apply I7's record corrections (R4, R5).
6. Rebuild Storybook; run the §13.3 gates.
7. Measure the label colour in the fresh capture; complete AC5.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run typecheck` | 0 |
| `npx vitest run` (4 critical-flow suites) | 0, **39/39**, no `<p>`-in-`<p>` in stderr |
| *(planted-violation run)* | non-zero, names the title test |
| `npm run check:stories` | 0 |
| `npm run check:story-coverage` | 0, 13/13 |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | both task stories 16/16 |
| `npm run check:design-tokens` | same 44-violation set, 0 in touched files |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 |
| `npm run build` | **0 — hard gate** |

`check:hydration` is **not** required: this task changes no SSR-rendered subtree (§3.5). State that reasoning
rather than running it and reporting a vacuous pass.

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-28-task675-task671-revision-label-color-dom-nesting.md`:

1. `Files Changed` table matching the real `git diff` — **distinguishing this task's edits from Task 671's
   pre-existing uncommitted changes**, since both sets are in the worktree simultaneously.
2. R1–R10 mapped to AC1–AC10 with evidence.
3. Every command with its **actual** exit code.
4. The measured label colour from the fresh capture (`#667085` expected) and the contrast ratio.
5. The I6 planted-violation transcript with revert confirmation.
6. The AC3 stderr grep.
7. Deviations, each with a reason.
8. Limitations — including the 4-width matrix scope (§13.1) and the three reserved follow-ups (676/677/678).

Backlog: correct Task 671's hex, add a concise Task 675 entry, keep the file ≤80 lines by consolidating
Task 671's over-long row.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
Sonnet does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_675_Task671_Revision_Canonical_Label_Color_DOM_Nesting.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every hex, path, line number, command and owner decision is inline |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC10 |
| Scope names what must not change | **Yes** — §8; four follow-ups reserved by number rather than absorbed |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4; §3.4 D4 with clause 16a provenance |
| Canonical-source search performed before proposing a style | **Yes** — §3.4: TailAdmin rows inspected, `tt="uppercase"` grep = 1 hit, no precedent → owner decision |
| Owner-only exceptions traceable | **Yes** — one owner decision (2026-07-28, `gray.5`). No others authorized |
| Baselines account for task-created artifacts | **Yes** — §3.2/§3.3 measured by the reviewer and quoted, so no baseline needs re-running |
| Dirty-worktree handling | **Yes** — §3.1 enumerates the nine expected paths and sets a stop condition for a tenth |
| Gates prove the changed behavior | **Yes** — AC3's stderr grep + AC5's pixel measurement + I6's planted violation |
| Single active owner route | **Yes** — one route; the only fork is A1's `theme.ts` stop condition |

**Known-risk note for the reviewer.** The likeliest defect here is I4: renaming `isFirstVisible` to
`withTopDivider` while accidentally inverting the predicate. AC5(a)/(b) from Task 671 already assert both
divider states, so an inversion cannot pass — but check the diff, not the report.
