# Task 782 — canonical Mantine dimension tokens, repo-wide raw-size sweep, and Task 781 review closure

**Sprint:** 69 · **Priority:** P2 · **QA profile:** **Q3** · **Filed:** 2026-09-03 · **State:** KICKOFF FILED

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Task type: **UI / Layout / Component (current Mantine path)** +
**TailAdmin / Styling Governance** + **Storybook / Visual Proof**. Repo-wide token migration with a new detector.

Executor: fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest allowed status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval. No mutating git.

**No review ledger** — D69-3 binds this task too (frontend work; `docs/agent-contract.md` clause 9a).

---

## 2. Objective

Give the project a **canonical Mantine token scale for icon and control dimensions**, convert every raw numeric
dimension in `src/` to it, add the detector that keeps it converted, and close every finding from the Task 781
review — in that order, because the sweep is meaningless without the scale and the scale rots without the detector.

---

## 3. Verified context

Measured 2026-09-03 against `main`. **Re-measure every count at execution (I0 freshness); never quote a number
from this document as a measurement.**

### 3.1 The gap that makes this task necessary

| Fact | Evidence inspected this session |
|---|---|
| Mantine has **no** token scale for a lucide icon's `size` prop | lucide's `size` is a plain SVG dimension; `theme.ts` has no icon entry |
| Mantine's `ThemeIcon` scale tops out at **44px** | `node_modules/@mantine/core/styles/ThemeIcon.css`: `--ti-size-xs 18 · sm 22 · md 28 · lg 34 · xl 44` |
| `ThemeIcon` resolves `size` through `getSize(size, 'ti-size')` | `…/ThemeIcon/ThemeIcon.cjs:34`; `…/core/utils/get-size/get-size.cjs`: a **token string** → `var(--ti-size-{key})`, a **number** → `rem(number)`. So a new key is created by defining the CSS var, not by a `theme.sizes` entry. |
| The project's only icon scale is **legacy Tailwind-era** | `src/app/globals.css:294-296` — `--icon-sm: 0.75rem · --icon-md: 1rem · --icon-lg: 1.5rem`. **D775-C forbids a `--*` legacy token reference inside a migrated file**, so this scale cannot be the answer; it also covers only 12/16/24 while the codebase uses 10·12·14·16·18·20·24·40·48·56·64. |
| The mechanism to use already exists and is already consumed | `theme.ts:265-268` — `other: { touchTarget: '2.75rem', mobileGate: '40em' }`, consumed at `ListingsFilters.tsx:148-149` as `theme.other.touchTarget` via `useMantineTheme()`. **This is `extend`, not `create canonical`.** |
| `theme.other` is **not** type-declared | no `MantineThemeOther` declaration in `theme.ts` (grepped). Mantine's default is `Record<string, any>`, so a typo currently passes `tsc`. The `MantineThemeSizesOverride` block at `theme.ts:9-13` is the precedent for fixing that. |
| **No gate sees any of this** | `npm run check:design-tokens` returned **0 violations** on the current tree (owner-run, native, 2026-09-03) while 129 raw `size={N}` occurrences exist. Its detector covers Tailwind arbitrary `*-[Npx]`, hex/rgb/hsl, and px/rem **strings inside `style` props** — a numeric JSX prop is none of those. |

### 3.2 Census — the sweep's real size

| Measurement | Count | Command |
|---|---:|---|
| Raw numeric `size={N}` occurrences in `src/**/*.tsx` | **129** | `grep -rnoE 'size=\{[0-9]+\}' src --include=*.tsx \| wc -l` |
| Files containing them | **42** | `grep -rlE 'size=\{[0-9]+\}' src --include=*.tsx \| wc -l` |
| …of which are stories or tests | **11** | same, piped through `grep -cE '\.stories\.tsx\|__tests__\|\.test\.tsx'` |
| Raw numeric `miw\|maw\|mih\|mah\|w\|h={N}` occurrences | **30** | `grep -rnoE '\b(miw\|maw\|mih\|mah\|w\|h)=\{[0-9]+\}' src --include=*.tsx \| wc -l` |

Distinct `size` values and their frequency (measured): `16`×41 · `14`×27 · `20`×15 · `18`×6 · `12`×6 · `48`×4 ·
`10`×4 · `24`×1 · `40`×1 · `56`×1 · `64`×1.

⚠️ **`={0}` is not a dimension.** `miw={0}`, `gap={0}`, `flex="1 1 auto"` express *flex behavior* (allow shrink
below content), not a design value. They are **out of scope** and must not be tokenized. The same applies to
behavioral CSS with no dimension: `wordBreak`, `whiteSpace`, `overflowY`, `flexShrink`, `cursor`,
`textOverflow`, `marginLeft:'auto'`.

### 3.3 Owner decisions binding this task

| ID | Decision | Source |
|---|---|---|
| **D69-6** | **Every hardcoded design value becomes a canonical Mantine token.** Owner, 2026-09-03: *«всі хардкодні місця мають бути замінені канонічними токенами Mantine!»* | this session |
| **D69-7** | The sweep is **repo-wide in one task**, not scoped to `/listings`. Owner, 2026-09-03, when offered the `/listings`-only and scale-only alternatives: *«Увесь репозиторій в одній задачі»* | this session |
| **D69-8** | `miw={{ sm: 192 }}` on "Показати ще" is **removed**, not tokenized — 192px has no provenance beyond the Tailwind class `min-w-48`. Owner, 2026-09-03: *«Прибрати»*. The resulting content-based desktop width is an accepted, recorded delta. | this session |
| **D69-9** | All Task 781 review findings close **inside this task**. Owner, 2026-09-03: *«в цю задачу ти маєш внести всі проблеми з твого рев'ю, щоб їх закрити однією задачею»* | this session |
| **D69-10** | `npm run screenshots:assert` was **not** required for Task 781's closure; the owner accepted its rendered result visually (*«я візуально все переглянув, мені підходить»*, 2026-09-03). **That waiver does not carry into 782** — 782 changes admin, cabinet, auth and site chrome, which the owner did not review visually. | this session |

D775-A/B/C and D68-2 are inherited from Sprint 69 and bind this task unchanged.

### 3.4 Task 781 review findings this task must close

Full text: the orchestrator review of 2026-09-03 (this session). Severity as assigned there.

| ID | Sev | What |
|---|---|---|
| **F3** | P1 | No canonical story renders the real production action row. `ListingsShellView.stories.tsx:74-75` stubs `filtersSlot={null}` **and** `saveSearchSlot={null}`; `ListingsActionRow.stories.tsx:51-52` hand-duplicates the production `Flex` wrapper from `ListingsShellView.tsx:100-113`. No standalone `SaveSearchButton` story; the opened `MantineModal` (Δ2) has no cell at all. |
| **F4** | P1 | `FilterMultiToggle.tsx` was deleted; live references survive in `docs/critical-flow-registry.md` (active critical-flow row), `docs/component-catalog.md:65`, `docs/component-coverage-matrix.md:117`, `docs/storybook-governance.md` (3). ⚠️ `npm run governance:components` passes (owner-run, 2026-09-03) — it checks only 3 named files plus doc presence and **cannot** see a stale catalog row. A green gate does not close F4. |
| **F5** | P2 | 8th dead probe locator: `scripts/task772-listings-overflow-probe.mjs:118` `sortBarRoot.querySelector('span.font-semibold')`. Verified: `renderedCountText: null` in **44/44** cells of `docs/sessions/evidence/task772/overflow.after.json`. |
| **F6** | P2 | Two unenumerated visual deltas: chip height 28px → 44px on desktop (`theme.ts:337` `Button.styles.root.minHeight:'2.75rem'` is unconditional, replacing `h-7` + `min-h-11 sm:min-h-0`); empty-state vertical padding 96px → 24px (`py-24` → `py="xl"`, `theme.spacing.xl='1.5rem'`). |
| **F7** | P2 | Raw dimensions in migrated files — folded into this task's Phase 2. |
| **F8** | P2 | `market_type` lost deselect-on-reclick (`ListingsFilters.tsx`, `FilterChoiceGroup mode="single"` without `allowDeselect`; `property_type` kept its). Owner-directed, but with no AC, no route-level test, and Sprint 69 exit criterion 3 currently says the opposite. |
| **F9** | P2 | `ListingsShellView.tsx:122` — empty-state `<h3 className="font-semibold text-lg">` became `<Text fw={600} size="lg">`; heading semantics lost, no gate sees it. |
| **F10** | P2 | `SaveSearchButton` is `w={{base:'100%'}}` below 640 while its label stays `visibleFrom="sm"` (`:75`) → a full-width button with no text. The same round decided the opposite for the filters button (§12.5 of the 781 session log). |
| **F11** | P3 | Session-log accuracy: §1 claims "25 tests", actual **12** (`grep -cE '^\s*it\('`); §12.5 claims every ad-hoc `style` object was replaced, but `ListingsSortBar.tsx:64` retains one. |
| **F12** | P3 | The 772 probe records the sort/save rects but asserts nothing about overlap or the 44px floor. The reviewer computed both from retained data (0/22 overlaps, no sub-44px at mobile) — the evidence exists, the control does not. |

### 3.5 What is verified and must NOT be re-done

Task 781's migration itself is sound: R1-R4 `VERIFIED`, AC6/AC7/AC10/AC14 `VERIFIED`, manifest 22→27,
`check:story-coverage` 27/27, `npm run build` exit 0 and `check:design-tokens` 0 (owner-run native, 2026-09-03).
Do not re-migrate `ListingsStatusTabs`, `ActiveFilterChips`, `ListingsSortBar`, `SaveSearchButton` or
`ListingsShellView`. This task edits them only where §3.4 names a finding or §3.2 names a raw dimension.

---

## 4. Requirements

| ID | Source | Observable requirement | Pri | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D69-6 | A canonical Mantine dimension scale exists in `theme.other`, type-declared through `MantineThemeOther` so a wrong key fails `tsc` | P0 | AC1 | Confirmed |
| **R2** | D69-6 · §3.1 | `ThemeIcon` gains project keys above Mantine's 44px ceiling through Mantine's own `--ti-size-*` mechanism — no raw number at any call site | P0 | AC2 | Confirmed |
| **R3** | D69-6/D69-7 | Every raw numeric `size={N}` and dimension prop in `src/**/*.tsx` consumes a token; `={0}` and behavioral CSS are excluded | P0 | AC3 | Confirmed |
| **R4** | §3.1 | A detector fails on a raw numeric dimension prop and is proven by a two-armed plant | P0 | AC4 | Confirmed |
| **R5** | D69-8 | `miw={{ sm: 192 }}` removed from "Показати ще" | P1 | AC5 | Confirmed |
| **R6** | F3 · `create-task/SKILL.md` UI-hierarchy gate | Every changed visible component has a standalone canonical story proving its states before any composition story; the composition story consumes the real production source | P0 | AC6 | Confirmed |
| **R7** | F4 · clause 9 | No active document or allowlist names the deleted `FilterMultiToggle` | P1 | AC7 | Confirmed |
| **R8** | F5 | The 8th dead locator is retargeted and re-run; `renderedCountText` is non-null | P1 | AC8 | Confirmed |
| **R9** | F6 | Both unenumerated deltas are recorded with rendered before/after | P1 | AC9 | Confirmed |
| **R10** | F8 | The `market_type` contract change is recorded in the sprint file and covered by a test | P1 | AC10 | Confirmed |
| **R11** | F9 | Empty-state heading semantics restored | P2 | AC11 | Confirmed |
| **R12** | F10 | The save-search trigger is not a full-width unlabelled button | P2 | AC12 | Confirmed |
| **R13** | F11/F12 | Session-log figures corrected; the probe asserts overlap and the 44px floor | P3 | AC13 | Confirmed |
| **R14** | clause 9 · D68-2 · D69-10 | `npm run build` exit 0 and a **full** differential rendered matrix on the final diff | P0 | AC14 | Confirmed |
| **R15** | clause 3/5 | No control, state branch, URL contract or server action changes anywhere in the sweep | P0 | AC15 | Confirmed |

---

## 5. Assumptions and open questions

- **A1** — `theme.components.ThemeIcon.vars` returning a custom `--ti-size-*` on `root` resolves correctly, because
  the built-in resolver sets `--ti-size: var(--ti-size-{key})` on the **same element** and `theme.ts`'s own
  Task 587/589 notes establish that theme `vars` merge with (not replace) the built-in resolver. **This is an
  assumption about a mechanism, and Phase 1's AC2 requires a computed-style proof before any consumer is
  converted.** If it does not hold, stop and report — do not fall back to a raw number.
- **A2** — the legacy `--icon-sm/md/lg` in `globals.css:294-296` becomes dead for migrated surfaces once R3 lands.
  Deleting it is **out of scope** (it may still have legacy consumers); the task only stops adding new ones.
- **A3** — test files that assert a pixel number are asserting behavior, not styling; they keep their literals.

**Open questions:** none. Every fork was closed by D69-6 → D69-10.

---

## 6. Pre-read rule bundle

**Always required:** `docs/agent-contract.md` (clauses 1, 3, 5, 6a, 7, 9, 11, 12, 13, 14, 15, 16, 16a, 16b, 16c) ·
`docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` · `docs/critical-flow-registry.md`.

**Current Mantine path:** `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/component-rules.md` · `docs/qa-rules.md` · `docs/ui-rules.md` (routing notes only).

**Governance:** `docs/tailwind-governance.md` · `docs/design-system.md` §22-§23 (token tiers, and the
⚠️ "a documented token is not an implemented token" banner) · `docs/storybook-governance.md` §14.2, §15 ·
`docs/component-catalog-governance.md`.

**Sprint/decision context:** `tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md` ·
`tasks/Sprints/Sprint_69_kickoff_prompt_Task_781_…md` · `docs/sessions/2026-09-03-task781-…md` ·
`docs/binding-decisions.md` (D27, D28) · `.claude/skills/create-task/SKILL.md` → "UI hierarchy — canonical story
before consumer composition".

**Source pre-read:** `src/design-system/mantine/theme.ts` (`other` :265, `MantineThemeSizesOverride` :9,
`Button` :274, `Badge` :479, `ThemeIcon` — absent) · `node_modules/@mantine/core/styles/ThemeIcon.css` ·
`node_modules/@mantine/core/cjs/core/utils/get-size/get-size.cjs` · `src/app/globals.css:290-300` ·
`src/modules/listings/components/ListingsFilters.tsx:140-160` (the `theme.other.touchTarget` precedent) ·
`scripts/check-design-tokens.mjs` (the detector you will extend) · the five Task 781 components and their stories.

---

## 6a. Canonical UI decision record

| Visible artifact | Searches and inspected paths | Canonical source | Disposition | Required implementation and registration |
|---|---|---|---|---|
| Icon dimensions (129 sites) | `theme.ts` grepped for an icon scale → absent; `globals.css:294-296` legacy `--icon-*` found but barred by D775-C; `theme.other` found at `:265` and already consumed at `ListingsFilters.tsx:148` | `theme.other` | **extend** | add the icon scale to `theme.other`, declare `MantineThemeOther`, prove in a canonical story |
| `ThemeIcon` above 44px (3 sites: 48 · 56 · 64) | Mantine `--ti-size-*` scale read from source; `theme.components.ThemeIcon` absent | Mantine's own `--ti-size-*` | **extend** | project keys via `theme.components.ThemeIcon.vars`, proven by computed style |
| Control min-width 192px | no spacing token ≥48px; no TailAdmin row | — | **remove** (D69-8) | delete the prop |
| Action row composition | `ListingsShellView.stories.tsx` and `ListingsActionRow.stories.tsx` both read | `ListingsShellView` | **fix composition** | the shell story renders the real `SaveSearchButton`; the row story stops duplicating the production wrapper |
| `SaveSearchButton` open modal / pending | no standalone story exists | `MantineModal` (already canonical) | **create canonical story** | in-scope production consumer exists → required, no separate authorization needed (`create-task/SKILL.md`, amended 2026-09-03) |
| Empty state | `MantineEmptyLoadingErrorState.tsx:84-86` read — `state='empty'` renders `Center py="xl"` + `ThemeIcon` + title + description, i.e. the same shape `ListingsShellView` hand-composed | `MantineEmptyLoadingErrorState` | **reuse, or documented composition** | consume the pattern; if its API cannot express the emoji tile, record exactly why in the session log — kickoff 781 §6a asked for this and it was not answered |

**No `create canonical` primitive is authorized.** Every row above reuses or extends an existing source. If
implementation finds a genuinely missing primitive, establish the smallest native Mantine pattern and its
standalone story first — do **not** stop for a visual decision and do **not** improvise a local style
(`create-task/SKILL.md` → Resolution rule).

---

## 7. Scope — five gated phases

Each phase completes and its gates pass before the next begins. Each records its own before/after census.

### 7.1 Phase 1 — the canonical scale (no consumer changes)
`src/design-system/mantine/theme.ts` · a new `src/stories/mantine/primitives/DimensionTokens.stories.tsx`.
Add the icon scale to `theme.other` (name the keys from the measured value set: 10·12·14·16·18·20·24), add the
`ThemeIcon` keys above 44px (48·56·64) through `theme.components.ThemeIcon.vars`, and declare `MantineThemeOther`
so a wrong key fails `tsc`. The story renders every key at its rendered size with its name — this is the
standalone proof the UI-hierarchy gate requires **before** any consumer is touched.

### 7.2 Phase 2 — the sweep
All 42 files from §3.2. Convert every raw numeric `size={N}` and dimension prop to a token. **Do not touch**
`={0}`, flex ratios, or behavioral CSS. Remove `miw={{ sm: 192 }}` (D69-8). Where a measured value has no key,
add the key in Phase 1's scale rather than leaving a number — and say so in the session log.

### 7.3 Phase 3 — the detector
Extend `scripts/check-design-tokens.mjs` with a category that flags a raw numeric dimension/size prop in
`src/**/*.tsx`, excluding `={0}`, `__tests__`, and any path the current allowlist already excludes. **Prove it
with a two-armed plant:** re-introduce one converted value → the gate must exit non-zero and name that exact
file and line; revert → exit 0. Retain both transcripts. A gate that cannot demonstrably fail is not evidence.

### 7.4 Phase 4 — Task 781 review findings
F3 · F4 · F5 · F6 · F8 · F9 · F10 · F11 · F12 per §3.4. F7 is already covered by Phase 2.

### 7.5 Phase 5 — full rendered acceptance
Baseline **B** is captured **before Phase 1's first edit** and never overwritten (this is the literal D68-2
artifact Task 781 could not produce; there is no excuse this time — capture it first).

---

## 8. Out of scope

- Deleting `--icon-sm/md/lg` from `globals.css` (A2) or any other `globals.css` edit.
- Re-migrating any Task 781 component beyond the findings in §3.4.
- `src/components/shared/Combobox.tsx`, `ListingsShell.tsx`, and every contract listed in Sprint 69 exit criterion 3.
- Numeric literals inside `__tests__`/`*.test.tsx` that assert behavior (A3).
- The reserved detector-gap family 738 · 743 · 745 · 746 · 750. If this task's evidence reproduces one, record it
  in the session log — **do not file, number or fix it.**
- **No `docs/reviews/*.review-ledger.json`** (D69-3).

---

## 9. Current and required behavior

**Preserved exactly.** Every rendered dimension is unchanged unless §11 enumerates it: a token replacing `16`
must resolve to 16px. Every control, state branch, URL contract, server action, toast branch and story fixture
behaves as before. Task 781's own C1-C19 preservation list stays in force. `ListingsShell.tsx` stays at zero diff.

**Required after.** `theme.other` carries the typed scale; `ThemeIcon` accepts project keys; `src/**/*.tsx`
contains no raw numeric dimension prop outside the documented exclusions; the detector fails on a planted one;
every finding in §3.4 is closed; and the full differential rendered matrix shows no new failing cell.

---

## 10. Implementation requirements

1. **Token first, consumer second.** Phase 1's story is the proof; no consumer conversion before AC2 passes.
2. **A number is never a fallback.** If a key is missing, add it to the scale. If the `ThemeIcon` mechanism does
   not work as A1 assumes, stop and report `BLOCKED` — do not leave a raw number with a comment.
3. **The scale is named by role, not by pixel.** Do not create a key called `16`. Use the semantic names already
   implied by the codebase's own usage clusters (16 = standard UI icon, 12 = badge/tiny, 24 = decorative), and
   cite `globals.css:294-296`'s own role comments as the provenance for those three.
4. **Type safety is part of R1.** Without the `MantineThemeOther` declaration a typo resolves to `undefined` and
   silently renders a default-sized icon — exactly the failure this task exists to prevent.
5. **Mantine tokens only** (D775-C). No `--icon-*`, no `--space-*`, no raw px/rem, no new CSS module.
6. **Story-first hierarchy** (`create-task/SKILL.md`): component story → composition story → route. A composition
   story may not duplicate a child's markup or visual rules.
7. **Preserve the four semantic hooks** and every `data-testid` the probes now depend on.
8. **Encoding** (clause 14): UTF-8 without BOM, no mojibake.

---

## 11. Positive and negative flows

### Positive flow
A converted icon renders at the identical pixel size it had before; a `ThemeIcon` at a project key renders a
square of exactly that dimension; the detector exits 0 on the converted tree and non-zero on a planted number;
every Task 781 story cell still passes and the new stories pass.

### Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Missing/typo token key | **Yes** | R1 | `tsc` fails — never a silently default-sized icon | planted typo, `npm run typecheck` non-zero |
| `ThemeIcon` var mechanism fails | **Yes** | A1 | `BLOCKED`, not a raw-number fallback | computed-style capture in AC2 |
| Detector false positive on `={0}` | **Yes** | §3.2 | `miw={0}` and flex ratios are not flagged | a case in the plant |
| Detector blind to the real form | **Yes** | R4 | the two-armed plant proves it fires | retained transcripts |
| Empty state with `tab='closed'` | **Yes** | Task 781 C15 | no description, correct title | story cell + RTL |
| Save-search: duplicate / error / pending | **Yes** | Task 781 C10/C12 | unchanged branches, now with story cells (F3) | RTL + new story |
| `market_type` re-click | **Yes** | F8 | does **not** deselect; `property_type` still does | new RTL test |
| Authorization / RLS | **No** | no read/write path changes | N/A | — |
| Offline / network | **No** | no network layer change | N/A | — |
| Concurrent writer | **No** | no data model change | N/A | — |

### Enumerated accepted deltas — show these, never claim neutrality
- **Δ4** (F6) — filter-chip height 28px → 44px on desktop.
- **Δ5** (F6) — empty-state vertical padding 96px → 24px.
- **Δ6** (D69-8) — "Показати ще" desktop width becomes content-based.
- **Δ7** — any rounding introduced when a measured value maps to a scale key. **A Δ7 entry with a non-zero pixel
  difference is a finding, not an accepted delta** — the scale must contain the exact value instead.
Δ1-Δ3 remain Task 781's and are re-shown under AC9.

---

## 12. Acceptance criteria

- **AC1 [R1]** — `theme.other` carries the icon scale, `MantineThemeOther` is declared, and a planted wrong key
  makes `npm run typecheck` exit non-zero (transcript retained; reverted afterwards).
- **AC2 [R2]** — a `ThemeIcon` at each new project key reports a computed `width` **and** `height` exactly equal
  to the intended value, captured from a real render. No call site passes a number.
- **AC3 [R3]** — `grep -rnoE 'size=\{[0-9]+\}' src --include=*.tsx` and the dimension-prop grep from §3.2 both
  return **0** outside the documented exclusions. Report raw before/after counts, not just the exit code.
- **AC4 [R4]** — the new detector category exits non-zero naming the exact file and line for the planted value,
  and exits 0 after revert. Both transcripts retained. `={0}` is in the plant and is **not** flagged.
- **AC5 [R5]** — `miw` is absent from the "Показати ще" button.
- **AC6 [R6]** — `ListingsShellView.stories.tsx` renders the real `SaveSearchButton`; `ListingsActionRow.stories.tsx`
  no longer duplicates the production wrapper (consumed or deleted); a standalone `SaveSearchButton` story exists
  with **open modal** and **pending** cells. `npm run check:story-coverage` exits 0.
- **AC7 [R7]** — `FilterMultiToggle` appears in **no** active document or allowlist: `docs/critical-flow-registry.md`,
  `docs/component-catalog.md`, `docs/component-coverage-matrix.md`, `docs/storybook-governance.md`,
  `scripts/story-coverage-exempt.json`. Historical session logs, archives and `docs/reviews/artifacts/**` are
  **not** touched. `npm run governance:components` exits 0 — and the session log states plainly that this gate
  cannot see a stale row, so the grep is the real evidence.
- **AC8 [R8]** — the 772 probe's count-text locator is retargeted; `renderedCountText` is non-null in every cell
  of a fresh run.
- **AC9 [R9]** — Δ1-Δ7 each have a before/after rendered capture at a named viewport and locale.
- **AC10 [R10]** — Sprint 69's exit criterion 3 carries the recorded `market_type` decision, and an RTL test
  asserts that re-clicking the active `market_type` does not clear it while `property_type` still does.
- **AC11 [R11]** — the empty-state title renders as a heading element.
- **AC12 [R12]** — below 640px the save-search trigger either shows its label or is not full-width; state which
  and why.
- **AC13 [R13]** — the 781 session log's two wrong figures are corrected in place with a dated note; the 772 probe
  asserts sort/save rect non-overlap and the 44px floor, and fails closed on violation.
- **AC14 [R14]** — `npm run build` exit 0 (native Windows, `platform=win32` receipt); baseline **B** captured
  before Phase 1's first edit; final **P** satisfies `P \ B = ∅` as normalized cell identities with a PASS on
  every new cell and explicit arithmetic. **D69-10: the Task 781 visual waiver does not apply here.**
- **AC15 [R15]** — `git diff` shows no change to any URL-building expression, server action, hook, or control
  outside the findings in §3.4; `ListingsShell.tsx` is untouched.

---

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** The sweep touches admin, cabinet, auth, header/footer and listing surfaces,
and it changes a **theme-level** contract — the widest blast radius in this sprint. `Q2` cannot cover it.

**Critical-flow registry:** F4 edits an active row, and Phase 2 touches components named in
`Listings filter controls — leaf sub-components + shell (Mantine)`. Re-run its named suites as regression.

**Windows-native gate (P0):** every command in native PowerShell (`npm.cmd`/`npx.cmd`), `node.exe -p
process.platform` → `win32` recorded per session, with Node version, cwd, exact command and real exit code.

```powershell
node.exe -p process.platform          # win32, first, every session

# Phase 0 — baseline B, BEFORE the first edit. Never overwrite it.
npm.cmd run build-storybook
npm.cmd run screenshots:assert        # retain the full transcript as B

# Per phase
npm.cmd run typecheck
npm.cmd run check:design-tokens
npm.cmd run check:stories
npm.cmd run check:story-coverage

# Phase 3 plant (two arms, both retained)
npm.cmd run check:design-tokens       # planted  -> expect non-zero + exact file:line
npm.cmd run check:design-tokens       # reverted -> expect 0

# Final, on the complete diff
npm.cmd run check:i18n
npm.cmd run check:mojibake
npm.cmd run check:file-integrity
npm.cmd run lint
npx.cmd vitest run
npx.cmd vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx
npx.cmd vitest run src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx
npm.cmd run build-storybook
npm.cmd run screenshots:assert        # this is P — reconcile against B per AC14
npm.cmd run typecheck
npm.cmd run build                     # HARD GATE — exit 0 required

# Route evidence (running server + valid storage state)
node.exe scripts/task772-listings-overflow-probe.mjs after
node.exe scripts/task775-listings-frame-route-probe.mjs current <runId>
```

A failed or unrun `npm run build` permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 14. Completion report contract

Session log `docs/sessions/2026-09-XX-task782-canonical-mantine-dimension-tokens.md` must carry:

1. **Files Changed** matching the real diff exactly.
2. **R1-R15** each `DONE`/`PARTIAL`/`NOT DONE` with an evidence pointer.
3. **AC1-AC15** self-audit with observed results, never a bare checkmark.
4. **Per-phase census** — raw before/after counts with the exact command that produced each.
5. **The scale table** — every key, its value, its provenance, and the number of call sites converted to it.
6. **Phase 3 plant** — both transcripts, the exact planted line, and the `={0}` non-flag case.
7. **AC14 reconciliation** — B and P cell-identity sets, `P \ B`, `B \ P`, new-cell list, explicit arithmetic.
8. **Δ1-Δ7** with before/after captures.
9. **F3-F12 closure table** — one row per finding, what changed, what proves it.
10. **Assumptions, deviations, limitations, unresolved issues.**
11. `docs/backlog.md` updated; baseline taken from `git --no-optional-locks show HEAD:docs/backlog.md` **before**
    editing.

Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never
self-approve. Never run, emit or suggest a mutating git command. **No review ledger.**

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no hidden chat context | **Yes** — §6 pre-read, §7 files, §13 commands, §3.2 reproducible census commands |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1-R15 ↔ AC1-AC15 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, §9, AC15, and §3.2's explicit `={0}`/behavioral-CSS exclusion |
| UI publication checks | **Yes** — §6a decision record with `extend`/`reuse`/`remove` only; §3.1 proves the absence that justifies the extension |
| Story creation gate | **Yes** — every new story has a named in-scope production consumer (`SaveSearchButton`, the token scale itself); the amended `create-task/SKILL.md` makes these required, not owner-authorized; no gate probe is published as permanent markup |
| Negative flows by applicability | **Yes** — §11, three marked `No` with reasons |
| No uninspected claim | **Yes** — every §3 fact was read this session; A1-A3 are labelled assumptions and A1 is gated by AC2 |
| Absence claims have a full trace | **Yes** — "no Mantine icon token" rests on reading `get-size.cjs`, `ThemeIcon.css`, `theme.ts` and `globals.css`, not a grep; "no gate sees it" rests on the owner's own native `check:design-tokens` run returning 0 against a measured 129 |
| Gates prove changed behavior, not procedure | **Yes** — AC2 computed style, AC4 two-armed plant with a false-positive case, AC7 names the gate's own blindness |
| Owner exceptions traceable | **Yes** — D69-6…D69-10 quote the owner verbatim with dates |
| Exactly one active route | **Yes** — D69-7 and D69-8 close the two forks; no alternative is left to the executor |
| Checkpoints have producer, output, comparator, failure behavior | **Yes** — AC4 plant, AC14 B/P set comparator, AC1 typo arm |
| Baseline accounts for task-created artifacts and order | **Yes** — B before Phase 1's first edit; new story cells named as task-created in AC14 |
| No `Confirmed` fact whose first verification is deferred | **Yes** — §3 measured this session; A1 is explicitly an assumption with a blocking proof gate |
| Dirty worktree | **Applies** — the tree currently carries Task 781's uncommitted diff. **782 must not start until 781 is committed**, or it must complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every pre-existing entry |

---

## 16. Handoff

Execute this file under `.claude/skills/execute-task/SKILL.md`, phases in order, gates between them.
**Precondition: Task 781's diff is committed first** — otherwise B is not a clean baseline and the two tasks'
changes cannot be told apart. Report per §14.
