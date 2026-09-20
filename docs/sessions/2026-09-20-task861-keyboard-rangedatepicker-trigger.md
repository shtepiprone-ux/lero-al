# Task 861 — `RangeDatePicker` trigger becomes a semantic button (keyboard-operable)

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (re-entry at kickoff §16, see "Revision 1" at the end). The sections above are the FIRST run (`PARTIALLY IMPLEMENTED`, `BLOCKED — CLAUSE 16d`), kept as history; where they disagree with Revision 1, Revision 1 wins.

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_861_Keyboard_Operable_RangeDatePicker_Trigger.md`
Evidence root: `docs/sessions/evidence/task861/` (final gate transcripts in `final/`, `00-SUMMARY.txt`)

## Process notes (disclosed)

- `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` The kickoff file was
  opened one step before those two files were read (the user's message carried the path and I read it in the same turn
  as loading the skill). No source read, no write and no plan followed until both were open and the receipt was emitted.
- **A planted-violation script aborted mid-plant.** The first `plant.ps1` ran with `$ErrorActionPreference='Stop'`; the
  red test run wrote to stderr, PowerShell threw, and `RangeDatePicker.tsx` was left in the planted state. I noticed on
  the failed exit, restored it from the scratchpad backup and verified the hash (`370b1042…`, = the fixed file) before
  doing anything else, then re-ran the plant with `try/finally`. The kept transcripts are from the second, clean run.
- A Storybook dev server was started by this session on :6006 for the Playwright measurements and stopped afterwards.
- `check:file-integrity` first failed (31 files) because PowerShell `*>` wrote **BOMs into this task's own evidence
  files**. I printed a scope manifest (37 files, all under `docs/sessions/evidence/task861/`), stripped the BOMs, and
  re-captured gate 18 through Bash → real `EXIT_CODE=0`. No file outside the evidence folder was touched.
- No mutating git was run or suggested.

## I0 (§10 step 1) — `docs/sessions/evidence/task861/I0-*.txt`

`win32 v22.22.3`. Worktree started dirty with Task 846 (10 `M`, 10 untracked — `I0-status-porcelain.txt`). `git
hash-object` of every §7 file: `I0-hashes.txt`.

**§3.1 re-measured: confirmed** — trigger was `<TextInput readOnly>`; `MantinePopover` opens on `onClick` only; no key
handler in either file. **§3.2 re-measured: confirmed** — `MantineCombobox` `variant="button"` uses
`Combobox.Target targetType="button"`; untouched.

**Kickoff facts that did NOT hold on re-measure:**

1. §9 "The trigger advertises no popup: no `aria-haspopup`, no `aria-expanded`" is **false on desktop**. `Popover.Target`
   (`withRoles` defaults `true`) already put `aria-haspopup="dialog"` + `aria-expanded` on the trigger — the BEFORE
   capture shows both. It was missing only on the `<640` path (no `Popover.Target` there).
2. §3.3's census (6 nodes, "all tier1 migrated+story") **omitted two nodes the bell renders** — see the 16d section.

## Requirement / acceptance evidence

| ID | Result | Evidence |
|---|---|---|
| R1 fix at trigger, no key handler on popover | **Done.** `MantinePopover` has no `onKeyDown/Up`; trigger is `<button type="button">`. | diff; `grep onKey` empty |
| R2 Enter + Space open, both paths | **Done** | jsdom `RangeDatePicker.smoke` keyboard arms ×2 paths; **real Chromium** `playwright-keyboard-RangeDatePicker.txt` (1280 en, 390 uk) |
| R3 focus in on open; Escape/Apply/Cancel/Confirm return focus to trigger | **Done** | jsdom arms; Playwright (`focus returned to the trigger`, `focus back on the trigger after commit`, staged-Escape) |
| R4 `aria-haspopup`/`aria-expanded`, both paths | **Done for `RangeDatePicker`/any element trigger. NOT done for the bell's `ActionIcon`** — see 16d. | `MantinePopover.smoke` ×2 paths; Playwright |
| R4a enrol `NotificationBellView` | **NOT DONE — reverted, `BLOCKED — CLAUSE 16d`** | below |
| R5 critical flow preserved | **Done** | 4 files, 59/59 pass; AC4 below |
| R6 chrome unchanged | **Done, with one intended delta** (cursor) | AC5 |
| R7 two-armed plant | **Done** | AC6 |
| R8 story extended, not duplicated | **Done** | AC7 |
| R9 zero change to 846 | **Done for the AC8 paths; ONE selector edit in 846's Story — deviation D1** | AC8 |

| AC | Result | Evidence |
|---|---|---|
| AC1 | **PASS.** Rendered `outerHTML` (real Chromium): `<button class="m_8fb7ebe7 mantine-Input-input mantine-TextInput-input" data-variant="default" type="button" aria-haspopup="dialog" aria-expanded="false" …>` | `AC5-computed-AFTER.json` (`empty.outerHTML`), Playwright `trigger is <button type="button">` |
| AC2 | **PASS** Escape / Apply / Cancel / Confirm each assert `document.activeElement === trigger` | `green-critical-flow.txt`, `final/04`; Playwright |
| AC3 | **PASS for `RangeDatePicker`** (`false`→`true`, `aria-haspopup="dialog"` both states, both paths). **Bell: NOT MET** (16d). | `MantinePopover.smoke` `element trigger…`, `RangeDatePicker.smoke` |
| AC3a | **NOT MET — BLOCKED 16d.** `final/15-census-NotificationBellView.txt` exit 1: `GR-1 CENSUS BLOCKED — NotificationCenter.tsx, NotificationItem.tsx`. | below |
| AC4 | **PASS.** Pre-existing tests: 14+6+14+2 = 36 at HEAD → all still pass; total in the four files now 59 (+23 new). Changed lines of pre-existing tests are **selectors only** — `AC4-changed-lines-existing-tests.txt` (15 lines). One assertion was *re-expressed* because an `<input>` has `.value/.placeholder` and a `<button>` does not: `expect(input.value).toBe('')` + `expect(input.placeholder).toBe('Select dates')` → `expect(trigger.textContent).toBe('Select dates')` + `not.toMatch(/\d{2}\.\d{2}\.\d{4}/)`. Same expectation (no date, placeholder shown), flagged for Opus. | `final/04` |
| AC5 | **PASS** — clear-X is a sibling (`wrapperChildren: [DIV, BUTTON, DIV]`, `button button` absent, jsdom asserts `trigger.contains(clear) === false`). Computed `border-radius 8px`, `height 44px`, `padding-inline 34px/34px` (value) and `34px/16px` (empty), `text-align left`, `font-size 14px`, `color rgb(29,41,57)`, `border-color rgb(208,213,221)`, `box 480×44` — **all identical BEFORE/AFTER**; placeholder text `rgb(152,162,179)` identical. **Differs: `cursor` `text` → `pointer`** (see D3). | `AC5-computed-BEFORE.json` / `-AFTER.json` |
| AC6 | **PASS** | below |
| AC7 | **PARTIAL.** `check:stories`, `check:story-coverage`, `check:pattern-enrolment`, `check:design-tokens:strict`, `check:enrolled-tailwind`, `check:rendered-scope`, `check:i18n` all exit 0. **The hardcode grep is NOT empty:** 4 hits on `MantinePopover.tsx` — header-comment lines `≥640px`/`<640px`/`16px` — **present at HEAD, none from this diff** (`git show HEAD:… | grep` returns the same 4; diff-added lines matching: none). `RangeDatePicker.tsx` `className=` count is still 2. | `final/20` |
| AC8 | **PASS** in real Chromium, keyboard only — see below | `playwright-keyboard-846-CustomRangeTooLong.txt` |
| AC9 | owner matrix below | — |

### AC6 — planted violation (R7)

Plant = revert **only** the trigger to the original `<TextInput readOnly value placeholder …/>`; nothing else.

```
hash BEFORE plant  (fixed):            370b1042f1e4df13c8a0cd3807fb39baa3ba58fd   (RangeDatePicker.tsx)
hash DURING plant (reverted trigger):  d6dbe0019bfe92020f963b3ff3d4103151b83c84
hash AFTER restore (fixed):            370b1042f1e4df13c8a0cd3807fb39baa3ba58fd   restored byte-identical: True
```
RED (`plant-RED-keyboard-RangeDatePicker.txt`): `Tests 16 failed | 15 passed (31)`, `EXIT_CODE=1`.
GREEN (`plant-GREEN-keyboard-RangeDatePicker.txt`): `Tests 31 passed (31)`, `EXIT_CODE=0`.
The natural pre-fix red run (`red-keyboard-RangeDatePicker.txt`, before any product edit) fails for the right reason:
`expected 'INPUT' to be 'BUTTON'`, `expected null to be truthy` (surface never opens), `expected null to be 'dialog'`.
`RangeDatePicker.tsx` later gained the placeholder `c="gray.4"` and a comment edit (final hash `a5db824e…`); the plant
hashes above are for the file as it stood when the plant ran.
The `MantinePopover` ARIA/focus arms have no separate plant (R7 asks for the trigger only).

### AC8 — Task 846's `CustomRangeTooLong` flow, keyboard only, real Chromium

`playwright-keyboard-846-CustomRangeTooLong.txt`: Tab → segmented control → ArrowRight ×2 (Custom) → Tab → trigger →
**Enter opens** → Tab to header `Previous`, Enter ×4 → Tab to a day, Enter (start 2026-03-01) → Shift+Tab to `Next`,
Enter ×4 → Tab to a day, Enter (end 2026-07-01, 122 days) → Tab to `Apply`, Enter → `role="alert"` reads "The period can
be at most 90 days." → surface closed, focus on the trigger → **0 Storybook action events** for the whole flow, then a
**positive control** (a valid keyboard range) produces `["onChange"]`, proving the counter is live.
Porcelain: no path under `src/design-system/mantine/patterns/MantineDashboard*` or `src/lib/dashboard/` was written by
this session (their mtimes, 08:44–08:52 and earlier, all predate it). **Deviation D1** touches a different path.

## Clause 16d / GR-1 — `BLOCKED — CLAUSE 16d` on the bell

`node.exe scripts\check-surface-census.mjs --surface src\modules\notifications\components\NotificationBellView.tsx`
(`final/15-…`) lists 5 nodes; two fail:

| Node | className | `@/components/ui/*` | manifest | Story imports **it** |
|---|---|---|---|---|
| `NotificationCenter.tsx` (the popup content) | 1 (+ a CSS module) | 0 | **no** | **no** |
| `NotificationItem.tsx` (rendered per row) | 1 | 0 | **no** | **no** |

Kickoff §3.3 counted "6 nodes, all migrated + story" and listed the bell as `className:0`, `manifest: NO`, story yes —
it never followed the bell's popup content. Enrolling the bell (R4a) is what makes the census **and**
`check:rendered-scope` (blocking, CI) red; I ran it: `check:rendered-scope` **exit 1** with the bell enrolled, exit 0
with the entry removed. AC3a and AC7 (`check:rendered-scope` exit 0) are therefore **mutually unsatisfiable inside this
kickoff's scope**: closing them requires migrating `NotificationCenter` + `NotificationItem` and giving each its own
Story — work the kickoff does not contain and I will not narrow around. So the bell's `ActionIcon` ARIA edit, the
manifest entry, and the bell test I had written were all **reverted**; `NotificationBellView.tsx` and
`scripts/mantine-migration-scope.json` are byte-identical to I0 (`9cd2e6ba…`, `d7c103e8…`).
The two nodes are already baselined tier-3 debt under `src/app/[locale]/layout.tsx` in
`scripts/surface-census-baseline.json`; a bell-rooted census is a new key.

`GR-1 CENSUS COMPLETE` for `RangeDatePicker.tsx` — 4 nodes; tier1 4 migrated+enrolled+story; tier2 0; tier3 0 listed and filed as none.
`GR-1 CENSUS COMPLETE` for `MantinePopover.tsx` — 2 nodes; tier1 2 migrated+enrolled+story; tier2 0; tier3 0 listed and filed as none.
`GR-1 CENSUS BLOCKED` for `NotificationBellView.tsx` — `NotificationCenter.tsx`, `NotificationItem.tsx` (above). **Not filed as tasks — that is Opus's call.**
`GR-2 SCOPE STATED — check:pattern-enrolment inspects only src/design-system/mantine/patterns/; it cannot see NotificationBellView; this is why the kickoff's census read green. check:story-coverage reads exit 0 with the bell enrolled and cannot see NotificationCenter/NotificationItem either; the criterion is closed by the surface census, not by either gate.`

## Deviations

- **D1 — a Task 846 file was edited (R9 says zero).** `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx`
  selected the trigger with `canvasElement.querySelector('input[readonly]')` (lines 71 and 99). The semantic-button fix
  makes that `null`, which would fail `CustomOpen` and `CustomRangeTooLong`. I changed exactly those two selectors to
  `button[aria-haspopup="dialog"]` (+ the comment). Hash `67498c24…` → `afeb0f89…` (`846-story-hash-BEFORE-selector-edit.txt`).
  Not under either AC8 path. **Opus to rule** — revert it and re-scope, or accept.
- **D2 — `TextInput` with `component="button"`, not `InputBase`.** The kickoff allows either. `InputBase` renders with
  `__staticSelector="InputBase"`, so the theme's `TextInput` defaults and `input-chrome.css` (keyed on
  `.mantine-TextInput-input`) stopped applying: measured **36px tall, black text, gray-5 border, 12px padding** vs 44px /
  gray-8 / gray-3 / 16px. `TextInput` renders `InputBase` with a caller-overridable `component`, so
  `<TextInput {...({ component: 'button' } as object)} type="button">` keeps every rule. `component` is not in
  `TextInput`'s public types → one narrow cast, commented in the source.
- **D3 — `pointer` prop.** Added so the button shows a pointer cursor on its input area. Measured `cursor` `text` →
  `pointer` (the only R6 delta). The existing `style={{ cursor: 'pointer' }}` was kept.
- **D4 — placeholder colour.** A button has no `::placeholder`; `Input.Placeholder` defaulted to `#667085`, not the
  `gray-4` (`rgb(152,162,179)`) that `input-chrome.css` gives an input. Fixed with the existing token via
  `<Input.Placeholder c="gray.4">` — no new value. AFTER measures `rgb(152,162,179)` = BEFORE.
- **D5 — `trapFocus` + `returnFocus` on every `MantinePopover` desktop consumer.** The dropdown is portaled, so a
  keyboard user cannot Tab into it without the trap. It applies to all consumers (the bell's popup now takes focus on
  open and returns it to the bell). Opus should confirm that is intended for the bell.
- **D6 — additive `trigger` render-function API** `({ opened }) => ReactNode` in `MantinePopover`. It exists so a
  wrapped trigger (the bell's `Indicator`) can put ARIA on its inner button. **With the bell reverted it has no
  production caller** (tested in `MantinePopover.smoke` only). Left in so the bell half can land without another
  popover change; Opus may prefer it removed.
- **D7 — element-trigger ARIA is also cloned on the mobile path** (`MantinePopover`). For the bell that puts
  `aria-haspopup`/`aria-expanded` on the `Indicator` root `div` at `<640` (on desktop `Popover.Target` already did
  exactly this). Harmless for `RangeDatePicker` (the target *is* the button); a generic-`div` ARIA attribute for the bell.
- **D8 — clear-X stays `tabIndex={-1}`** (kickoff §11 asked to record it). Keyboard users reach the clear action only by
  pointer today; not changed.

## Observations for Opus (not changed — calendar body is out of scope, §8)

- On the `<640` sheet the `Confirm` button follows the whole scrolling month list in tab order: a keyboard user has to
  Tab through every enabled day cell to reach it (~hundreds of stops; the Playwright run needed a 900-Tab budget).
  `Escape` cancels, so the flow is completable but slow.
- The header `Next` button becomes `disabled` at the `maxDate` boundary; a focused button that turns disabled drops
  focus to `document.body` (seen in the 846 flow at yesterday's month). Tab re-enters via the focus trap.

## Files Changed

| Path | Reason | Hash |
|---|---|---|
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | trigger → semantic button (R1/R6) | `a5db824e…` (was `88f69f2b…`) |
| `src/design-system/mantine/patterns/MantinePopover.tsx` | ARIA on both paths, `trapFocus`/`returnFocus`, render-function trigger (R3/R4) — no key handler | `e6795753…` (was `097d6fe1…`) |
| `src/stories/mantine/primitives/RangeDatePicker.stories.tsx` | force-open click selector; closed/expanded captions (R8) | `4874fcab…` (was `a24423cb…`) |
| `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx` | keyboard arms ×2 paths; selector refactor; 1 re-expressed assertion | `d4462ac8…` (was `4730a1c7…`) |
| `src/design-system/mantine/patterns/__tests__/MantinePopover.smoke.test.tsx` | ARIA / focus-return / no-double-toggle / disabled arms ×2 paths | `ef769410…` (was `37481c74…`) |
| `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | selector only: `getByDisplayValue` → `getByRole('button')` | `ac3a4b83…` (was `98471ec0…`) |
| `src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx` | selector only: `input` → `.mantine-Input-input` | `fbf3a9fe…` (was `95d84c00…`) |
| `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx` | **D1** — 2 selectors (Task 846 file) | `afeb0f89…` (was `67498c24…`) |
| `docs/backlog.md` | 861 row updated in place (80 lines before and after) | `ecb6e228…` |
| `docs/sessions/2026-09-20-task861-keyboard-rangedatepicker-trigger.md`, `docs/sessions/evidence/task861/**` | this log + evidence | — |

Byte-identical to I0: `NotificationBellView.tsx` `9cd2e6ba…`, `scripts/mantine-migration-scope.json` `d7c103e8…`.
Not written by this session (Task 846 / others, dirty at start): everything else in `git status --porcelain`.

## Validation evidence — `final/00-SUMMARY.txt` (each transcript unpiped, `EXIT_CODE` appended)

`typecheck 0 · lint 0 · check:i18n 0 · critical-flow tests 0 (4 files, 59/59) · src/modules/notifications 0 (3 files, 9/9)
· test:i18n-hydration 0 (33/33) · check:stories 0 · check:story-coverage 0 · check:pattern-enrolment 0 ·
check:design-tokens:strict 0 · check:enrolled-tailwind 0 · check:rendered-scope 0 · census RangeDatePicker 0 · census
MantinePopover 0 · **census NotificationBellView 1** · build-storybook 0 · **build 0** · check:file-integrity 0
(re-captured after stripping own-evidence BOMs) · check:mojibake 0 · hardcode grep: exit 0 with 4 pre-existing comment hits.`
`check:locale-leak:mantine-only` not run (known red, Task 836; no Story page added).

## Visual source trace / canonical UI decision record

| Artifact | Markup / class | Token path | Change |
|---|---|---|---|
| trigger chrome (radius, height, padding, border, text colour, focus/disabled) | `.mantine-Input-input.mantine-TextInput-input` | theme `TextInput` defaults + `input-chrome.css` (§6d/§6e) | **preserve** — measured identical |
| trigger element / cursor | `<input readOnly>` → `<button type="button">`; cursor `text`→`pointer` | Mantine `pointer` prop | change (D3) |
| placeholder | `::placeholder` → `Input.Placeholder c="gray.4"` | `--mantine-color-gray-4` | preserve (measured) |
| calendar icon / clear-X | `leftSection` / `rightSection` | `theme.other.iconSize` | preserve — untouched |
| calendar body, popover surface, bottom sheet | — | — | out of scope, untouched |

`GR-0 CANONICAL REUSE PREFLIGHT — request: keyboard-operable trigger for RangeDatePicker; semantic queries: readOnly trigger popover keyboard, Combobox.Target targetType button, Input component button, InputBase/TextInput chrome selector; inspected candidates: src/design-system/mantine/patterns/MantineCombobox.tsx (Story Mantine/Primitives/MantineCombobox), MantinePopover.tsx, RangeDatePicker.tsx (Mantine/Primitives/RangeDatePicker), node_modules Popover/PopoverTarget.mjs, TextInput.mjs, use-combobox-target-props.mjs; decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/RangeDatePicker.tsx + MantinePopover.tsx; Mantine/TailAdmin token path: theme.ts TextInput defaults + input-chrome.css (unchanged), tokens gray.4; new hardcoded visual values: NONE; rationale: fix at the trigger element, reuse the theme/CSS chrome via TextInput's runtime-polymorphic component.`
`GR-3 STORY PROVEN — RangeDatePicker ← src/stories/mantine/primitives/RangeDatePicker.stories.tsx (imports it by name); MantinePopover ← same story via RangeDatePicker and src/stories/mantine/primitives/Popover.stories.tsx.`
`GR-3a STORY PREFLIGHT — RangeDatePicker × closed/expanded trigger; canonical candidates: Mantine/Primitives/RangeDatePicker; direct-import evidence: RangeDatePicker.stories.tsx:8; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND; target: Mantine/Primitives/RangeDatePicker; rationale: existing canonical Story renders the real component; no new page/title/export.`

## Assumptions / limitations

- jsdom has no `@testing-library/user-event` here, so the jsdom arms **model** the browser's activation behaviour
  (`Enter` keydown / `Space` keyup → click on a `<button>`, nothing on `<input readonly>`). The genuine keyboard proof is
  the real-Chromium Playwright transcripts; both are kept.
- The AC6 plant covers `RangeDatePicker`'s trigger only (R7). `MantinePopover`'s arms were red-checked indirectly via the
  `RangeDatePicker` red run, not planted separately.
- `RangeDatePicker` has no `disabled` prop, so the "trigger disabled" negative flow is proven at `MantinePopover` level
  with a disabled native trigger, not on `RangeDatePicker`.
- R8's "open/expanded" state already existed as the Story's forced-open row; I extended captions and fixed the click
  selector rather than adding an export.

## OWNER VISUAL QA REQUIRED (§13.3) — none marked passed/failed by me

| # | Story | State | Width | Locale |
|---|---|---|---|---|
| 1 | `Mantine/Primitives/RangeDatePicker` | closed trigger, value set | 1280 | en |
| 2 | same | open, keyboard-driven (Enter → Escape; focus ring back on trigger) | 1280 | sq |
| 3 | same | closed + open | 390 / 320 | uk |
| 4 | `Patterns/Mantine/DashboardPeriodControl` → `CustomRangeTooLong` | keyboard-only, end to end | 1280 | it |

## Opus handoff — questions to inspect

1. **16d bell decision** — migrate `NotificationCenter` + `NotificationItem` (+ Stories + enrolment) inside 861, or split R4-bell/R4a/AC3a into a new task and amend 861's kickoff. Until then AC3a/AC7 cannot both hold.
2. D1 (846 Story selectors), D2 (`TextInput` cast), D5 (global `trapFocus`/`returnFocus`), D6 (unused render-function API), D7.
3. AC4's one re-expressed assertion (placeholder test).
4. The two calendar-body focus observations above — whether either needs a numbered task.
5. Task 846's own Story and tests were not re-run beyond `check:stories`/`build-storybook`; the AC8 flow was proven in a real browser.

## Backlog update

`docs/backlog.md` 861 row rewritten in place: 80 lines before and after — no `BACKLOG LIMIT BREACH` added by this session
(the file sits at the 80-line limit; Opus to consolidate on review).


---

# Revision 1 — re-entry at kickoff §16 (2026-09-20)

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` (emitted before any source read or write; the kickoff had been opened one step earlier, as in the first run — disclosed, no write preceded the gate.)

Evidence root: `docs/sessions/evidence/task861/final-r1/` (every transcript captured unpiped with its own `EXIT_CODE=` line). Red arm of the new tests: `docs/sessions/evidence/task861/r1-red-popover-bell-ARIA.txt` (5 failed / 12 passed, right reason: `expected true to be false`, `expected null to be 'dialog'`).

## Receipts

- `GR-0 CANONICAL REUSE PREFLIGHT` — emitted in-session for the notification migration: decision COMPOSE (`Divider`/`Stack`/`Group`/`Text`/`Box`), owners `NotificationCenter.tsx` / `NotificationItem.tsx`, token path `Divider` gray.2 (`theme.ts:1254`) + `--motion-duration-base` / `--motion-ease-standard`; new hardcoded visual values: NONE (the two `color-mix(... var(--primary) 5%/10% ...)` expressions are relocated **unchanged** from the deleted CSS module — see D9).
- `GR-3a STORY PREFLIGHT` ×2 — `NotificationItem` EXTEND/migrate (existing direct-import Story `NotificationItem.stories.tsx:2`, non-canonical title); `NotificationCenter` CREATE (zero direct-import Stories, colocated included).
- `GR-1 CENSUS COMPLETE` — `NotificationBellView.tsx`: 5 nodes; tier1 5 migrated+enrolled+story; tier2 0; tier3 0 listed and filed as none (`final-r1/15-…`, exit 0). `NotificationCenter.tsx`: 2 nodes, all tier1 (`15b-…`, exit 0). `RangeDatePicker.tsx` 4/4, `MantinePopover.tsx` 2/2 (exit 0).
- `GR-2 SCOPE STATED — check:pattern-enrolment inspects only src/design-system/mantine/patterns/ and cannot see src/modules/notifications/; check:story-coverage inspects only enrolled components; the notification criteria are closed by the surface census (AC3a), the direct-import Story grep, and the rendered-DOM measurements, not by either gate.`
- `GR-3 STORY PROVEN` — `NotificationItem` ← `src/stories/mantine/primitives/NotificationItem.stories.tsx`; `NotificationCenter` ← `src/stories/mantine/primitives/NotificationCenter.stories.tsx`; `NotificationBellView` ← its existing Story; `RangeDatePicker` ← its existing Story (each imports the component by name).

## Requirement / acceptance evidence (Revision 1)

| ID | Result | Evidence |
|---|---|---|
| R4 / F2 | **Done.** `MantinePopover` clones `aria-haspopup`/`aria-expanded` only when the trigger is a native button (`type === 'button'`, `props.component === 'button'`, or Mantine `Button`/`ActionIcon`/`UnstyledButton`); `Popover.Target`'s own roles are switched off (`withRoles={buttonTrigger}`) for a wrapper/render-function trigger. `RangeDatePicker`'s trigger is detected via its `component: 'button'`. | `MantinePopover.tsx`; tests below |
| R4b | **Done.** Bell trigger is now a render function; the inner `ActionIcon` carries `aria-haspopup="dialog"` + live `aria-expanded`. The render-function API now has its production caller. | `NotificationBellView.tsx` |
| R4a | **Done.** Three manifest entries: bell, `NotificationCenter`, `NotificationItem` (95 entries). | `scripts/mantine-migration-scope.json`; `08-story-coverage` |
| R4c | **Done.** 0 `className` in both files; `NotificationCenter.module.css` **and** `NotificationItem.module.css` deleted; separators are canonical `Divider`; hover via `useHover` + `bg`; both Stories below. | grep, porcelain |
| AC3 | PASS (`RangeDatePicker.smoke` element-trigger arms, unchanged, 61/61). | `04-critical-flow-tests` |
| AC3b | **PASS.** Wrapper `<div>` trigger: no `aria-haspopup`/`aria-expanded` closed or open (`MantinePopover.smoke`, both paths). Real bell: `<button>` carries `aria-haspopup="dialog"`, `aria-expanded` `false`→`true`; the `Indicator` wrapper carries neither (`NotificationBellView.smoke`, both paths; and real Chromium `23-browser-measurements.json`: `bellParentHasAria:false`, `before.parentAria:null`). | `04`, `05`, `23` |
| AC3a | **PASS.** `check:story-coverage` 95 covered / 0 unproven, exit 0; `check:rendered-scope` exit 0; bell census exit **0**, every node `manifest:yes story:yes className:0` (5 nodes: bell, `MantinePopover`, `NotificationCenter`, `responsiveBottomSheet`, `NotificationItem`). | `08`, `12`, `15`, `15b` |
| AC3c | **PASS.** No `className=` in either file (grep count 0/0); `NotificationCenter.module.css` gone; exactly one Story imports each (`NotificationItem` → `src/stories/mantine/primitives/NotificationItem.stories.tsx`, title `Mantine/Primitives/NotificationItem`; `NotificationCenter` → `…/NotificationCenter.stories.tsx`, title `Mantine/Primitives/NotificationCenter`); porcelain shows ` D src/modules/notifications/components/NotificationItem.stories.tsx` (deleted; only the new file remains). | `27-status-porcelain` |
| AC4 | PASS. Critical-flow four files **61/61** (was 59; +2 = the new wrapper-trigger arm × 2 paths); no assertion weakened, no pre-existing test edited this run. One timeout under load on the first run — see Limitations. | `04` |
| AC5 / F3 | **Resolved.** Measured element named: `span[class*="InputPlaceholder"]` (`mantine-InputPlaceholder-root`); computed `color` `rgb(152, 162, 179)` in en/sq/uk/it at 1280 and 320 — equals `AC5-computed-BEFORE.json`. The first-run artifact's `placeholderColorEmpty` (`rgb(29,41,57)`) read the button, not the span; it is superseded, not edited. | `24-F3-F5-…json` |
| F5 (a) | No horizontal overflow at 320 in any of the 4 locales (`hScroll:false`, trigger `288×44`, `overflowsX:false`). | `24` |
| F5 (b) | Bell focus trap asserted: opening moves focus into the panel, `Escape` returns it to the bell button (`NotificationBellView.smoke`; Chromium `focusInsidePanel:true`, `afterEscape.focusOnBell:true`). | `05`, `23` |
| AC7 | **PASS.** `check:stories` 169 files 0 violations, `check:story-coverage`, `check:pattern-enrolment`, `check:design-tokens:strict`, `check:enrolled-tailwind`, `check:rendered-scope`, `check:i18n` (2369 keys parity) all exit 0. Hardcode grep vs `HEAD`: every worktree match (13 lines) is a header comment that is **also present at `HEAD`**; the three code matches at `HEAD` (`className={styles.list}`, `className={cn(`, `borderBottom: '1px solid…'`) are gone; no new match. `RangeDatePicker.tsx` `className=` count still 2. | `26-hardcode-grep-WORKTREE/HEAD` |
| AC8 | Re-verified after the popover change in real Chromium: 846 `CustomRangeTooLong` trigger opens on `Enter`, `Escape` returns focus, at 1280 and 390 (`25-keyboard-after-popover-change.txt`). The full 120-day keyboard flow was proven in the first run (`playwright-keyboard-846-CustomRangeTooLong.txt`) and **not** re-driven end to end this run. No path under `MantineDashboard*` / `src/lib/dashboard/` is newer than `I0-hashes.txt`. | `25` |
| R7 / AC6 | Unchanged: `RangeDatePicker.tsx` hash `a5db824e…` is identical to the first run's final value, so the plant transcripts (`plant-RED` 16 failed / `plant-GREEN` 31 passed) still describe this file. The new `MantinePopover`/bell arms have their own red run (`r1-red-…`). | — |
| AC9 | Owner matrix below. | — |

Final gate block (`final-r1/`): typecheck 0 · lint 0 (0 errors, 79 pre-existing warnings) · check:i18n 0 · critical-flow tests 0 (61/61) · `src/modules/notifications` tests 0 (12/12) · test:i18n-hydration 0 · check:stories 0 · check:story-coverage 0 · check:pattern-enrolment 0 · check:design-tokens:strict 0 · check:enrolled-tailwind 0 · check:rendered-scope 0 · census RangeDatePicker / MantinePopover / NotificationBellView / NotificationCenter 0 · build-storybook 0 · build 0 · check:file-integrity 0 · check:mojibake 0 · `check:surface-census:changed --base HEAD` 0 (after the baseline update below).

## Downstream references found and closed (skill step 9)

- `scripts/surface-census-baseline.json` carried three now-paid-off rows for `NotificationBellView`/`NotificationCenter`/`NotificationItem`; `check:surface-census:changed --base HEAD` failed with `3 stale baseline entr(ies)` (`20-…`, exit 1). Ran the gate's own `--update-baseline`: exactly 9 lines deleted (`git diff`: the three rows only; hash `2e38cc51…` → `04c3c5278…`), then the gate exits **0** (`20b-…`). This file is a CI baseline, not policy; no tier-2 row was touched.
- `scripts/governance/tailwind-entropy.allowlist.json` still lists a `text-[10px]` exemption for `NotificationItem.tsx`; that class was already absent before this task (the file was Mantine-migrated in Task 762) — **not changed, noted for Opus**.
- `scripts/check-stories-rendered.mjs:190-195` comment says the bell Story covers `NotificationCenter`/`NotificationItem`; still true, and the two new Stories are not registered in that rendered-geometry list (see Limitations).

## Files Changed (Revision 1 delta; the first run's files are in the section above)

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantinePopover.tsx` | F2/R4b: native-button-only ARIA clone, `withRoles={buttonTrigger}`, doc comments |
| `src/modules/notifications/components/NotificationBellView.tsx` | R4b: render-function trigger, ARIA on the inner `ActionIcon` |
| `src/modules/notifications/components/NotificationCenter.tsx` | R4c: `className`+module removed, `Divider`s, `Box` list |
| `src/modules/notifications/components/NotificationItem.tsx` | R4c: `cn()`/module removed, `bg`/`opacity`/`useHover` |
| `src/modules/notifications/components/NotificationCenter.module.css`, `…/NotificationItem.module.css` | **deleted** (R4c; GR-0 — not a canonical style source) |
| `src/modules/notifications/components/NotificationItem.stories.tsx` | **deleted** — migrated to the canonical path (GR-3a) |
| `src/stories/mantine/primitives/NotificationItem.stories.tsx` | new canonical location, 3 scenarios kept as sections, no viewport pins |
| `src/stories/mantine/primitives/NotificationCenter.stories.tsx` | new direct-import Story (unread / all-read / empty) |
| `src/stories/fixtures/notifications.fixture.ts` | shared locale-aware fixture (`notificationRows(locale)`), moved from the old Story |
| `messages/{en,sq,uk,it}.json` | one key `storybook.notifications.legacy_status_title` (lint §14.2 forbids a raw prose title in a fixture) |
| `scripts/mantine-migration-scope.json` | R4a: +3 entries |
| `scripts/surface-census-baseline.json` | −3 paid-off rows (gate's own `--update-baseline`) |
| `src/design-system/mantine/patterns/__tests__/MantinePopover.smoke.test.tsx` | +1 arm (wrapper trigger carries no ARIA), both paths |
| `src/modules/notifications/components/__tests__/NotificationBellView.smoke.test.tsx` | new: bell ARIA (both paths) + focus trap/return |
| `docs/backlog.md` | 861 row rewritten in place (80 → 80 lines) |
| `docs/sessions/…task861….md`, `docs/sessions/evidence/task861/final-r1/**`, `…/r1-red-popover-bell-ARIA.txt` | this log and evidence |

Dirty-worktree reconciliation: every Task 846 path (`MantineDashboardGrid/Header/PeriodControl.tsx`, `src/lib/dashboard/`, the 846 Stories/fixture/log/evidence) is unchanged since `I0-hashes.txt` (`find -newer` empty) apart from the two ratified Story selector lines (D1, §16.9). `package.json`/`package-lock.json` were dirty at session start and are now clean — the owner committed them (`035c26712`); not touched by this session.

## Deviations / assumptions / limitations (Revision 1)

- **D9 — two `color-mix()` literals live in `NotificationItem.tsx`.** The unread tint (5%) and hover tint (10%) were the deleted CSS module's rules; there is no Mantine prop for a `:hover` state and no theme token for a 5%/10% primary tint. I kept the values **unchanged** as constants passed to `bg` (the same expression the file already used for `c=`), with hover driven by `useHover`. Opus to rule: keep, or create a theme token. Measured: unread `oklab(0.649 0.167 0.09 / 0.05)`, hover `/ 0.1`.
- **D10 — measurable deltas to §13.3 tuples 5–7 to look at:** (a) row transition `150ms` → `200ms` (`--motion-duration-base`; no token is 150ms); (b) the separators are now `Divider` gray.2 (`#e4e7ec`) instead of `var(--border)` (`#EBEBEB`) — one shade apart, header underline included. Neither was measured against a pre-change capture (the pre-861 panel cannot be rendered without reverting).
- **D11 — `NotificationItem.module.css` was also deleted** (the kickoff names only `NotificationCenter.module.css`); it held the same class of rules and R4c/GR-0 forbid a CSS module as a style source, and the file's `className` had no other source.
- **D12 — story exports.** The three old exports (`AllCases`, `PriceChangeUnread`, `SavedSearchMatchUnread`) became three labelled sections of one `Default` (canonical shape, no state-named page); story ids change accordingly.
- **D13 — `MantinePopover` classification.** A trigger is "a native button" if `type==='button'`, `props.component==='button'`, or a Mantine `Button`/`ActionIcon`/`UnstyledButton`. Any other component passed as an *element* trigger (unknown custom wrapper) no longer receives ARIA — none exists in production (census: two consumers).
- **Limitation — load-induced timeout.** Two other node processes (Storybook `:6006` pid 13968 since 10:58, `next dev` `:3000` pid 28320 since 11:53) were running and are not mine; while they ran, `RangeDatePicker.smoke` took 47 s and its `<640` "Confirm commits…" case exceeded vitest's 5 s default twice (6.4 s / 6.5 s, an unchanged test on an unchanged file, hash `a5db824e…`). The required command was then re-run once the machine was quieter and passed 61/61. I did not touch those processes or the timeout.
- **Limitation — rendered-geometry registry.** I did not run `check:stories-rendered` (needs a live Storybook run against its own registry); the two new Stories are not added to `scripts/check-stories-rendered.mjs`. Opus to say whether that is required.
- **Limitation — no before/after computed-style diff for the notification panel** (only after-values: `23-browser-measurements.json`, screenshots `shot-*.png`).
- The Storybook dev server used for the measurements belongs to the owner's session (not started or stopped by me).

## OWNER VISUAL QA REQUIRED (§13.3) — none marked passed/failed by me

Rows 1–4 as in the section above. Additional for this revision:

| # | Story | State | Width | Locale |
|---|---|---|---|---|
| 5 | `Mantine/Primitives/NotificationBellView` | **open** panel | 1280 | en |
| 6 | same | **open** panel | 390 / 320 | uk |
| 7 | `Mantine/Primitives/NotificationItem` (all three sections) and `Mantine/Primitives/NotificationCenter` (unread / all-read / empty) | all scenarios | 1280 / 390 | sq |

Screenshots for the owner's convenience (not verdicts): `final-r1/shot-bell-open-*.png`, `shot-item-*.png`, `shot-center-*.png`.

## Opus handoff — questions for the separate reviewer

1. D9 (literal `color-mix` in `NotificationItem`), D10 (150→200 ms, `Divider` shade), D11 (second CSS module deleted).
2. D13's native-button heuristic in `MantinePopover`, and whether the bell's inherited desktop `trapFocus`/`returnFocus` is intended (asserted by a test now).
3. The `scripts/surface-census-baseline.json` edit (paid-off debt only) — confirm scope.
4. Stale `tailwind-entropy.allowlist.json` entry and the un-registered rendered-geometry Stories (Limitations).
5. AC8's full 120-day flow was not re-driven after the popover change (only open/close/focus re-verified).

## Backlog update

`docs/backlog.md` 861 row rewritten in place: **80 lines before and after** — no `BACKLOG LIMIT BREACH` added by this session (Opus to consolidate on review).

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`


---

# Revision 2 — re-entry at kickoff §17.2 (review 2, F7), 2026-09-20

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` (both read in this session before the kickoff's §17 was opened). This revision adds no UI, component or Story, so no GR-0 / GR-3a search receipt applies.

Scope per §17.4: start at §17.2, change nothing else. The only file touched is `scripts/task319-qa-notification-templates.mjs`, plus `docs/backlog.md` and this log. Evidence root: `docs/sessions/evidence/task861/final-r2/` (each transcript captured unpiped, own `EXIT_CODE=` line).

## Frozen-state check

`git --no-optional-locks status --porcelain` before the change is byte-identical to `final-r1/27-status-porcelain.txt` (`final-r2/01-…`, `PORCELAIN IDENTICAL`). After the change the only difference is one added line: ` D scripts/task319-qa-notification-templates.mjs` (`final-r2/10-…`). Every Task 846 path is untouched.

## F7 — decision: **delete** the script (not re-point)

Hash before: `935e775e3c7e50fbfb9d521e74f4a3ff717f615e` (`02-script-hash-BEFORE.txt`). Removed with a plain filesystem `rm`; no git command was run.

Why deletion, not the one-line re-point:

1. **A re-point is not a one-line change.** Line 38 (`STORY_ID`) was the visible binding, but the script also selects its rows with `document.querySelector('.divide-y')` — the Tailwind class of the retired story wrapper — and asserts `rows.length === 8`. The migrated Story (`mantine-primitives-notificationitem--default`) has no `.divide-y` and three sections; changing only `STORY_ID` would make all 28 cells fail on `nonEmpty` (0 rows), a false failure. A correct version means rewriting its row selection and expectations, i.e. a new script.
2. **Its kind is retired.** It is a one-off Playwright screenshot-and-assert capture over a 7-viewport × 4-locale grid built for Task 319's own evidence — the automated-visual class the owner retired on 2026-09-03; viewport and locale are now toolbar-driven plus owner review.
3. **Its checks are already covered.** The canonical Story renders all 8 producer/legacy rows; the real-Chromium run of this task measured `rowsRendered: 14` and `hScroll: false` at 1280 / 390 / 320 (`final-r1/23-browser-measurements.json`).
4. **No live consumer — proved.** `final-r2/04-deletion-proof-greps.txt`: no hit in `package.json`, `.github/`, or other `scripts/` files; no `package.json` script name mentions it; the only non-historical mentions are the Task 861 backlog row and Sprint 78 plan row (this task itself). `storybook-static/index.json` confirms the old id `notifications-notificationitem--all-cases` is absent and the new id is present, so the script was already un-runnable as written.

## AC10 — the five §17.2 commands (all `final-r2/`)

| # | Command | Result |
|---|---|---|
| 1 | `git --no-optional-locks grep -n -E "notifications-notificationitem\|Notifications/NotificationItem\|task319-qa-notification-templates"` | exit 0 (matches exist). **No hit under `src/` or `scripts/`.** See "Deviation from the kickoff's stated expectation" below. (`05-…`) |
| 2 | `node.exe scripts\check-surface-census.mjs --surface …\NotificationBellView.tsx` | exit **0** — `GR-1 CENSUS COMPLETE — 5 nodes; tier1 5 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.` (`06-…`) |
| 3 | `npm.cmd run check:stories` | exit **0** — 169 files, 0 violations (`07-…`) |
| 4 | `npm.cmd run check:story-coverage` | exit **0** — PASSED (`08-…`) |
| 5 | `npm.cmd run check:file-integrity` | exit **0** — all 197 files clean (`09-…`) |

`GR-2 SCOPE STATED — the five gates above inspect enrolled components, stories, and file integrity; none of them runs or parses scripts/task319-qa-notification-templates.mjs (that is why every earlier gate stayed green while it pointed at a deleted Story). F7 is closed by the removal itself plus the reference grep (`05-…`, `04-…`), not by any gate's exit code.`

`npm run build` was **not** re-run, deliberately and as §17.2 asks to be stated: the only source file changed is `scripts/*.mjs`, which no bundle imports; `final-r1/17-build.txt` (`EXIT_CODE=0`) is unchanged and still current for every file under `src/`.

## Deviation from the kickoff's stated expectation (for Opus)

§17.2 expected the first command to return "only prose/comment references inside `src/stories/**` and this kickoff". Measured result: **zero hits in `src/stories/**`** (and none in `src/` or `scripts/` at all); the hits are prose/logs/artifacts in `docs/reviews/`, `docs/sessions/`, `docs/sessions/evidence/`, `tasks/` and `docs/backlog.md`. That satisfies the intent (no live binding in product or tooling code) but not the literal wording, so it is reported rather than rounded.

**One executable binding to the old Story id remains, in frozen historical evidence:** `docs/sessions/evidence/task758/task758-item3-qa-transition-property.mjs:57` — `{ key: 'notificationItem', storyId: 'notifications-notificationitem--all-cases', … }`. It is a Task 758 evidence script (an already-run record), not wired into `package.json`, CI or any runbook, and it sits outside §17.4's single permitted file, so I did not touch it. Other `storyId` hits are recorded JSON results (`task762*/computed-*.json`) and logs — data, not bindings. **Opus to rule:** leave as a frozen record (my recommendation, consistent with §17.3 item 7's treatment of stale-but-historical entries), or re-point/annotate it in a follow-up.

## Files Changed (Revision 2 delta)

| Path | Reason |
|---|---|
| `scripts/task319-qa-notification-templates.mjs` | **deleted** — F7; superseded by the canonical Story, no live consumer |
| `docs/backlog.md` | 861 row rewritten in place (80 → 80 lines) |
| `docs/sessions/2026-09-20-task861-keyboard-rangedatepicker-trigger.md` | this section |
| `docs/sessions/evidence/task861/final-r2/**` | transcripts and proofs |

Not touched (verified): everything else in the worktree, including all Task 846 paths, `src/`, `messages/`, `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`.

## Not re-run, on purpose (§17.4)

The full §13.2 block; `npm run build`; the Playwright measurements; F6 (§17.1, already applied to the kickoff); every ruling in §17.3; `check:stories-rendered` (retired `screenshots:assert`, §17.3 item 6).

## Owner-owed — unchanged

AC9's keyboard half: tuples **2**, **3 (keyboard)** and **4** (hands-on: opens with no pointer, focus ring returns to the trigger on `Escape`, 846's `CustomRangeTooLong` completes keyboard-only). Visual half accepted by the owner 2026-09-20 (§17.5). I mark nothing here as passed or failed on the owner's behalf.

## Opus handoff — questions for the reviewer

1. Deletion vs re-point for F7 — reasons 1–4 above; confirm the choice.
2. The literal-vs-intent gap in AC10's first command, and the one remaining executable binding in frozen Task 758 evidence.
3. `docs/backlog.md` is at the 80-line limit (80 before and after); no `BACKLOG LIMIT BREACH` added by this session.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
