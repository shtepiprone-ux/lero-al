# Task 539 (Scope B + C) — SegmentedControl §6c fix + full 25-primitive TailAdmin delta audit

**Executor:** Sonnet. **Type:** UI / primitive chrome conformance (`theme.ts` + `input-chrome.css`) — NOT product
code. **Status:** IMPLEMENTED, pending orchestrator review — **still HELD** (Scope A/Progress was already done in
a prior session; this session closes Scope B and completes Scope C). Kickoff:
`tasks/Sprints/Sprint_40_kickoff_prompt_Task_539_MantinePrimitiveStoriesTailAdminConformanceAudit.md`.

## Pre-read confirmation

Read in full: `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md`
(scanned — no product critical-flow row references any primitive's chrome; primitive-chrome conformance touches
no registry flow, confirmed), `docs/tailadmin-style-reference.md` (ALL §1–§7 rows, including every §6x
sub-section), `docs/mantine-responsive-design-system.md` §18 (theming pitfalls — read in full before touching any
theme/CSS), `src/design-system/mantine/theme.ts` (full 618-line file), `src/design-system/mantine/input-chrome.css`
(full 309-line file, pre-this-session).

## Scope B — SegmentedControl §6c fix (CLOSED)

**Root cause (confirmed via `@mantine/core/styles/SegmentedControl.css` + `SegmentedControl.mjs` source, not
assumed):** Mantine's stylesheet sets inactive-label color = `gray-7` and hover color = `black`, both via
`:where()` (zero-specificity) rules on the hashed class. `theme.ts`'s inline `styles.label` (§18.1: inline styles
cannot express state selectors) could only ever reach the ACTIVE state via the `--sc-label-color` CSS variable
(already wired + already had an explicit `[data-active]` CSS rule from Task 527 fix #10) — inactive/hover were
structurally unreachable from `theme.ts` alone, which is why they were left as a documented deferral since the
Task 489 era.

**Fix — `src/design-system/mantine/input-chrome.css`** (new rules, stable-class selectors, higher specificity +
later source order than Mantine's `:where()` rules):
```css
.mantine-SegmentedControl-label:not([data-active]) { color: var(--mantine-color-gray-5); }
@media (hover: hover) {
  .mantine-SegmentedControl-label:not([data-active]):not([data-disabled]):not([data-read-only]):hover {
    color: var(--mantine-color-gray-7);
  }
}
.mantine-SegmentedControl-label::before { border-radius: var(--mantine-radius-md); }
```
Plus **item geometry** (`theme.ts`, flat/state-independent properties — allowed inline per §18.1 rule 1):
`styles.indicator.borderRadius` + `styles.label.borderRadius` = `var(--mantine-radius-md)` (6px, §6c
`rounded-md`, distinct from the container's 8px `rounded-lg`) and `styles.label.paddingInline` = `0.75rem` (12px,
§6c `px-3`). The indicator (`FloatingIndicator`, the visible moving pill) is a DOM **sibling** of the labels, not
a descendant — confirmed via `SegmentedControl.mjs` source — so its radius needed its own inline-style target,
not just the label's.

**Rendered proof (computed-style measurement via Playwright, `mantine-primitives-segmentedcontrol--default`,
1024px, en):**

| Item | `data-active` | Computed `color` | Expected (§6c) | Match |
|---|---|---|---|---|
| All / Active (active pill) | `true` | `rgb(16, 24, 40)` | gray-900 `#101828` | ✅ exact |
| Administrator / Blocked / Pending / Sold (inactive) | `null` | `rgb(102, 112, 133)` | gray-500 `#667085` | ✅ exact |
| Administrator (hover, `page.hover()`) | `null` | `rgb(52, 64, 84)` | gray-700 `#344054` | ✅ exact |
| All items | — | `borderRadius: 6px` | `rounded-md` 6px | ✅ exact |
| All items | — | `paddingLeft/Right: 12px / 12px` | `px-3` 12px | ✅ exact |

Screenshot: `docs/sessions/assets/task539/segmentedcontrol__en__1024.png`.

## Scope C — full 25-primitive delta audit

The kickoff lists "the 23" but names 25 primitives; audited all 25 story files under `Mantine/Primitives/*`. Method
per primitive: cross-referenced the primitive's `theme.ts`/`input-chrome.css`/pattern-component implementation
(with its cited Task # and §-row) against the corresponding `tailadmin-style-reference.md` row, then spot-verified
a subset by reading the actual story/pattern source or rendered screenshot where the citation trail was thin.

| Primitive | §-row | Rendered/implemented value | Reference value | Match? | Evidence |
|---|---|---|---|---|---|
| Alert | §6l Alerts | radius 12px, border+bg semantic, 16px padding, title 14/600/gray-8, body 14/gray-5/lh20 | same | ✅ | `theme.ts:551–580`, Task 532 |
| Avatar | §6/§6l Avatars | radius pill, size consumer-set | `rounded-full`, sizes consumer-set | ✅ | `theme.ts:338–340`; status-dot feature N/A — no story/consumer needs it, not a divergence |
| Badge | §6b/§6l Addendum D2 | 12px/500/padding 2×8/lh18 (status default) | `text-theme-xs` 12px variant | ✅ | `theme.ts:349–367`, Task 527/528 |
| Button | §6/§6l Buttons, §-density-correction | radius 8px, size sm(14px)+44px min-height, fw500, gap 8px | same (density-correction-approved) | ✅ | `theme.ts:193–221`, Task 492/502/527 |
| Card | §6l Cards | radius 16px, border gray-2, NO shadow (no `shadow` prop passed in story) | flat border, no shadow | ✅ | `theme.ts:372–377` + `Card.stories.tsx` (no shadow prop) + confirmed Mantine's own `Card.css` has no default shadow rule |
| Checkbox | §6f | box 16px/radius4, gray-3 border, brand-7 checked, full state matrix | same | ✅ | `theme.ts:261–269` + `input-chrome.css:162–205`, Task 497/508 |
| Combobox | Task 537 §-cite | dropdown 16px/`2xl`, gray-2 border, 12px pad, shadow-lg; search field = §6e input chrome | same | ✅ | `theme.ts:442–456` + `input-chrome.css:72–102` |
| Drawer | canonical (Task 523) | bottom-sheet chrome, header title→body 8px | §6l composition | ✅ | `theme.ts:396–402`, `MantineDrawer.tsx` |
| DropdownMenu | via Menu block | 16px/`2xl` container, gray-2 border, 12px pad, shadow-lg, item 14/gray-7/~10×12/radius-lg | §6l Dropdowns | ✅ | `theme.ts:420–434`, Task 515/528 |
| Label | §6/§18.5 | 14px/fw600(owner override)/gray-7, mb 6px, no asterisk | §6 + owner fw600 override | ✅ | `theme.ts:294–312` (InputWrapper), Task 503 |
| Modal | §6l Modals | radius 8px, header→body 8px, footer gap 12px | same | ✅ | `theme.ts:390–395`, Task 519–521/527 |
| NavigationMenu | via Menu block | same as DropdownMenu | §6l Dropdowns | ✅ | `theme.ts:420–434`, Task 518/528 |
| Pagination | §6l Pagination | gap 8px, radius 8px, brand active fill, edge-control border gray-3 | same | ✅ | `theme.ts:599–616` + `pagination-chrome.css`, Task 533/535 |
| PasswordInput | §6e | outer-box border/shadow/error, reveal toggle dims with field | full state matrix | ✅ | `theme.ts:246–256` + `input-chrome.css:35–51`, Task 505 |
| Popover | §6l Addendum D3 | radius 12px (`xl`), gray-2 border, 12px pad, shadow-lg | same (corrects Task 527's wrong 16px) | ✅ | `theme.ts:411–419`, Task 513/528 |
| Progress | §6/§6l Progress | radius pill, size-scale 8/12/16/20px, brand fill, gray-2 track | same | ✅ (Scope A, done + render-verified prior session — unchanged this session) | `theme.ts:471–488` |
| Radio | §6g | circle 16px/full, gray-3 border, brand-7 checked, full state matrix | same | ✅ | `theme.ts:270–278` + `input-chrome.css:207–249`, Task 498/508 |
| **SegmentedControl** | **§6c** | **was: inactive gray-7 (wrong) / hover black (wrong) / item radius 8px (wrong, shared w/ container) / item padding 10px (wrong, Mantine default)** | inactive gray-5, hover gray-7, item radius 6px, item padding 12px | **❌→✅ FIXED this session (Scope B)** | See Scope B section above — all 5 values now measured-exact |
| Select | §6d/§6i (`MantineSelect`) | h44, border gray-3, radius 8px, focus ring brand, bottom-sheet <640 | same | ✅ | `theme.ts:257–260` + `input-chrome.css:53–70`, Task 509/510 |
| Switch | §6h | track gray/brand, thumb white, full state matrix | same | ✅ | `theme.ts:279–287` + `input-chrome.css:251–298`, Task 499/508 |
| Table | §6b | 24×12 CRM density, th 12/500/gray-5, td 14/gray-7, row divider gray-1, hover gray-0 | same | ✅ | `theme.ts:504–527`, Task 488 |
| **Tabs** | **§6c/§6l** | **was: no text-color rule at all (Mantine default variant) — inactive/active both render ambient/inherited color, only the underline border distinguishes state** | inactive gray-5, active brand text (per theme.ts's own pre-existing deferral comment) | **❌→✅ text-color FIXED this session (Scope C finding)**; **variant (underline vs §6l's cited "NOT underline… segmented style") → STOP-AND-ASK, see below, NOT changed** | `input-chrome.css` new rules; computed `rgb(236,84,71)` active / `rgb(102,112,133)` inactive — both exact |
| TextInput | §6e | h44, border gray-3, radius 8px, focus/error/disabled full matrix | same | ✅ | `theme.ts:222–232` + `input-chrome.css:4–33,104–160`, Task 505/527/528 |
| Textarea | §6e | same as TextInput + min-height via CSS class (autosize guard workaround) | same | ✅ | `theme.ts:233–245` + `input-chrome.css`, Task 505/527/528 |
| Tooltip | §6k (live-extracted) | radius 8px, padding 8×14, dark bg gray-8/white text, shadow-md, wrap not nowrap (owner override) | same | ✅ | `MantineTooltip.tsx` (cites §6k directly in-file), Task 524/526 |

**23 vs 25 discrepancy:** the kickoff's prose says "the 23" but its own enumerated list names 25 primitives
(Alert…Combobox). Audited all 25 story files that actually exist under `Mantine/Primitives/*` — no primitive was
skipped.

## STOP-AND-ASK (per kickoff instruction — logged, NOT resolved unilaterally)

**Tabs: Mantine default (underline) variant vs. §6l's literal "canonical tab bar is the segmented style … NOT
underline (`border-b-2`) tabs."** `docs/tailadmin-style-reference.md` §6l states this twice (§6c line 110 and §6l
line 430–433, both measured from the live TailAdmin `/tabs` page), unambiguously describing TailAdmin's own "Tabs"
concept as the SAME pill/segmented look as `SegmentedControl` — not an underline bar. Our `Tabs.stories.tsx`
currently uses Mantine's **default variant** (underline), which is the pattern the reference explicitly says
TailAdmin does NOT use.

**Why I did not silently redesign it:** `theme.ts`'s own pre-existing comment on this exact primitive
(pre-dating this session) frames the gap narrowly as a "text-color" deferral, not a variant/architecture problem
— implying a prior task (Task 489-era) already made a deliberate call to keep the underline look for genuine
multi-panel Tabs (as opposed to two-way switches, which §6c separately maps to `SegmentedControl`). Re-deriving
the tab BAR's fundamental visual identity (a much larger, more visible change than a color fix) is exactly the
kind of judgment call the kickoff's STOP-AND-ASK clause exists for — I fixed the narrow, unambiguous, already-
flagged text-color gap (inactive gray-5 / active brand, using the exact same technical method as the
SegmentedControl fix), and left the underline-vs-pill question open for the owner rather than guessing. **Paused:
no further Tabs variant work until answered.**

## Rendered-evidence gate (clauses 12/13)

**Clean run** (`npm run build-storybook` then `npm run screenshots:assert -- --mantine-only`), reproduced 3×
after the SegmentedControl + Tabs fixes:

```
Results: 381/400 PASS, 16 FAIL, 3 AMBIGUOUS (needs-owner-decision)
  loader-only: 16   (100% Mantine/Primitives/Progress/Default, Scope A — pre-existing, untouched this session)
  ambiguous-overlap: 3   (100% Mantine/Primitives/Tabs/Default × sq/uk/it × mobile-320 — known swipe-scroll pattern, unrelated to the text-color fix)
Manifest: .screenshots/rendered-assert/2026-07-04T07-12/manifest.json
```
One intermediate run hit a single flaky `open-trigger-click-failed`/`blank-screenshot` cell on
`Modal/Default × sq × mobile-320` (a click-timeout, not a real regression — Modal was not touched this session);
re-ran once more and it cleared, back to the identical 381/400 baseline. `offscreenControl`/`outsideContainer`/
`elementOverlap`/`textClipped`/`unstyledRender` all = 0 across every run — zero geometry regressions from either
fix.

**Planted-violation FAIL transcripts (two, per clause 12/13 + an interesting gate-limitation finding):**

1. **SegmentedControl-local plant (did NOT trigger a failure):** temporarily added `minWidth: '30rem'` to
   `theme.ts`'s `SegmentedControl.styles.label`. Rebuilt, reran → **0/16 SegmentedControl cells failed.**
   Root cause: `SegmentedControl.stories.tsx` wraps every control in `<ScrollArea type="auto" scrollbars="x"
   scrollbarSize={0}>` (the swipe-scroll-on-overflow pattern) — this reproduces the **exact, already-tracked
   Task 538 gate limitation** (`docs/backlog.md`: "`geometry-integrity.mjs`'s `offscreen-control` check
   downgrades any element inside an `overflow-x:auto` ancestor away from a hard FAIL"). Confirms Task 538's
   finding rather than introducing new gate work — no action taken here; Task 538 already owns the gate fix.
2. **Shell-level plant (proven method, genuinely FAILed):** reused the Task 536/540-proven `miw={{ base: 900,
   sm: 0 }}` on `_MantineStoryShell`'s middle `Box`. Rebuilt, reran → **96/400 PASS, 304 FAIL,
   `offscreenControl: 204`** — mass overflow correctly caught across nearly every story × mobile viewport ×
   locale. Reverted immediately, rebuilt, reran — confirmed back to the clean 381/400 baseline (twice).

Evidence: `docs/sessions/assets/task539/planted-violation/fail-transcript-manifest.json` (the 304-FAIL shell-plant
manifest) + representative screenshot `mantine-primitives-segmentedcontrol--default__uk__mobile-320.png`.

## Gates (clause 9/13/14)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors (checked after implementing, after each plant/revert, and finally) |
| `npm run check:stories` | ✅ 99 files checked, 0 violations |
| `npm run check:i18n` | ✅ all 4 locales, 2082 keys, parity + no raw-enum leaks |
| `npm run check:mojibake` | ✅ 0 artifacts / 1548 files |
| `npm run check:design-tokens -- --strict` | ✅ 0 violations (both new CSS rules use `var(--mantine-color-*)`/`var(--mantine-radius-*)` tokens, zero raw hex/px) |
| `npm run check:file-integrity` | ✅ 21/21 files clean (final run) |
| `npm run build-storybook` | ✅ built clean (6 separate builds across implement/plant/revert cycles, all succeeded) |
| `npm run screenshots:assert -- --mantine-only` | 381/400 PASS, reproduced 3× (1 transient Modal-click flake cleared on re-run) |

## Regression coverage (clause 15)

Confirmed via `docs/critical-flow-registry.md` scan: no row references `SegmentedControl`/`Tabs`/primitive-chrome
files. No product critical-flow test required — the rendered gate is the coverage per the kickoff.

## Files Changed

| Path | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | `SegmentedControl.styles`: added `indicator.borderRadius` + `label.borderRadius`/`label.paddingInline` (§6c item radius 6px + padding 12px, flat properties, inline-safe per §18.1); updated the block comment to record the Task 539 Scope B closure. |
| `src/design-system/mantine/input-chrome.css` | New rules: SegmentedControl inactive (`gray-5`) + hover (`gray-7`) label color + `::before` pseudo radius (closes the Task 489-era deferral); Tabs inactive (`gray-5`) + active (`brand-7`) tab color (new Scope C finding, closes the matching self-documented gap). |
| `docs/backlog.md` | Last Session + Task 539/Sprint-40 status updated to IMPLEMENTED/pending-review, STOP-AND-ASK noted. |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by the required `screenshots:assert -- --mantine-only` run (script unconditionally overwrites this file every run) — not a manual edit. |
| `docs/sessions/2026-07-04-task539-segmentedcontrol-tabs-conformance-audit.md` | This session log. |
| `docs/sessions/assets/task539/segmentedcontrol__en__1024.png`, `tabs__en__1024.png` | Rendered proof of the SegmentedControl + Tabs fixes. |
| `docs/sessions/assets/task539/planted-violation/*` | Planted-violation FAIL manifest (304/400 FAIL) + representative screenshot proving the rendered gate genuinely catches width/overflow regressions in this diff's surface. |

**Not touched this session (pre-existing, from the earlier Progress/Scope-A session — left exactly as found):**
`src/design-system/mantine/patterns/MantineProgress.tsx`, `src/stories/mantine/primitives/Progress.stories.tsx`,
`src/design-system/mantine/patterns/index.ts`, `messages/{en,it,sq,uk}.json`,
`docs/mantine-tailadmin-migration-tracker.md`, `docs/sessions/2026-07-03-task539-mantine-progress-primitive.md`,
`docs/sessions/assets/task539/` (pre-existing Progress screenshots — new files added alongside, none removed).
`src/stories/mantine/_MantineStoryShell.tsx` was planted-and-reverted for the gate-proof — final diff against
`HEAD` is byte-identical (confirmed via `git status`, no changes shown). **Do NOT run git** — this task is HELD;
the orchestrator reviews the real diff and emits commit commands after the owner answers the Tabs STOP-AND-ASK.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | SegmentedControl §6c deferrals closed (inactive gray.5, hover gray.7, active gray.9, radius/padding/border/shadow verified); rendered proof side-by-side with the zip | ✅ | Scope B section; computed-style table, all 5 values exact |
| 2 | Delta table present for all 23 [25] primitives with per-attribute comparison + cited reference values; every mismatch fixed, every match recorded | ✅ | Scope C table above |
| 3 | Every fixed value cites a §-row / zip token; any new value extracted first. Zero invented numbers | ✅ | Every new CSS/theme value cites §6c or reuses an existing token; zero raw hex/px (design-tokens gate confirms) |
| 4 | Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation FAIL transcript attached; all light gates green | ✅ | 381/400 reproduced 3×; two planted-violation transcripts (one a gate-limitation finding, one a genuine catch); all gates green |
| 5 | No control/state section removed; Progress (Scope A) unchanged; no per-story chrome override; all consumers updated (Note 14) | ✅ | Progress untouched (verified via git status — no diff on Progress files); fixes live in `theme.ts`/`input-chrome.css` single source, not per-story; both SegmentedControl and Tabs consumers automatically pick up the fix (no per-story changes needed) |
| 6 | Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. Do NOT run git | ✅ | This file |

**Partial/open item:** the Tabs underline-vs-segmented-variant question is explicitly NOT resolved (STOP-AND-ASK,
logged above) — this is a deliberate, instructed pause, not an oversight. The task remains HELD until the owner
answers it (in addition to the standing orchestrator-review requirement).

## File-integrity gate (clause 14) — final transcript

```
> npx tsc --noEmit
(0 errors)

> npm run check:file-integrity
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 21 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 21 file(s) clean
```

**Self-validation: PASS (with one open STOP-AND-ASK, as instructed).** SegmentedControl §6c deferral fully closed
with exact computed-style proof (5/5 values match). Scope C audit covered all 25 (not just 23) primitive stories,
finding and closing one additional deferral (Tabs text color) using the identical, already-proven technical
method. One genuine ambiguity (Tabs underline-vs-pill variant) was surfaced to the owner rather than resolved by
guessing, per the kickoff's own STOP-AND-ASK instruction — this is the correct outcome for that finding, not an
incomplete task. Rendered assert 381/400 PASS reproduced 3× with zero new failures attributable to this diff (the
16+3 failing/ambiguous cells are pre-existing and out of scope). Two planted-violation runs: one revealed a
genuine (already-tracked, Task 538) gate limitation rather than a new defect; the other used the proven method
and genuinely caught a mass violation, then was cleanly reverted. All light gates
(`tsc`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens --strict`, `check:file-integrity`)
green. No git run by the executor. Task remains HELD pending orchestrator review + the owner's STOP-AND-ASK
answer.
