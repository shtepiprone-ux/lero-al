# Task 923 — the rendered state census: every overlay state opened, the app root and every portal root measured

**Sprint 78** · **P1** · QA profile **Q4** (a new blocking gate: planted-failure proof required) · **blocks 859
Revision 15** (kickoff §31 R94) and every visible task whose surface opens an overlay (`BLOCKED — RENDERED STATE
CENSUS (923)`, `.claude/rules/shared/rendered-state-census.md`) · **Status: review 1 `NEEDS REVISION` 2026-10-10 →
Revision 1 = §10 (R10–R14, AC6–AC10); review 2 `NEEDS REVISION` 2026-10-14 → Revision 2 = §11 (R15–R18,
AC11–AC15); review 3 `NEEDS REVISION` 2026-10-14 → Revision 3 = §12 (R19–R21, AC16–AC19); review 4 `NEEDS REVISION`
2026-10-15 → Revision 4 = §13 (R22–R23, AC20–AC22); review 5 `NEEDS REVISION` 2026-10-15 → Revision 5 = §14 (R24–R27,
AC23–AC28); review 6 `NEEDS REVISION` 2026-10-15 → Revision 6 = §15 (R28–R31, AC29–AC33).** Executor: §1–§14 stay
binding; §15 adds to them and wins where they differ.

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
Precedents, read-only: the card-track gate (`scripts/check-card-track-monotonicity.mjs`, a rendered gate on the built
Storybook with a `--verify-gate` self-test, blocking in CI) and 859 review 16's probe
`docs/sessions/evidence/task859/review-16/r16-dialogs.mjs` (diagnosis only — it is the defect this task removes, not a
template to copy unchanged).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode, task type and rule bundle

`IMPLEMENTATION`, governance tooling (a new rendered gate and its registry); no product UI, Story or token changes.
Bundles: **Storybook / Visual Proof**, **Regression / Critical Flow Coverage** (gate with planted-failure proof).
Read: `.claude/rules/shared/role-boundaries.md`, `.claude/rules/shared/rendered-state-census.md` (the contract this
task implements), `.claude/rules/shared/mobile-adaptation-contract.md` ("Required decision and proof"),
`docs/qa-profiles.md`, `docs/storybook-governance.md` §14.9.18 (the retired overlay click list, for contrast only).

## 2. Objective

The owner rejected a task-local fix for a census that could not see dialogs (D1). Build the project-wide contract
`rendered-state-census.md` as executable tooling: a registry of every interaction state that opens a portal, a runner
that opens each state on the built Storybook and measures the app root and every portal root separately, JSONL
evidence per Story × state × root × locale × viewport, and a self-test whose planted violations live only inside a
portal while the app root is green.

## 3. Verified context

Every fact below is a ledger row; nothing else sets scope.

- Mantine renders every overlay into `<div data-portal="true">` under `<body>` (C1). Both GR-3j censuses of 859 read
  `#storybook-root` only (C2): the app root was green (C3) while the ticket sheet header was squeezed (C4) and a picker
  name rendered one letter per line with the id past the screen (C5).
- The repository's only overlay-opening rendered tool is the retired `screenshots:assert` engine (C6); it clicks the
  first button or input of the app root (C7) and measures nothing per portal. It is not revived or extended here.
- A Story can need a click to open its overlay: `Mantine/Primitives/Modal` `Default` shows no dialog on mount (C8).
- CI already builds Storybook and runs rendered gates with a self-test (C9, C10, C11). Playwright and Storybook are
  installed (C12, C13).
- Overlay owners are registered as the `overlay-and-disclosure` family (C14); the touch token is 44px (C15).
- Legacy components are migrated, not instrumented (C16): the registry covers `Mantine/Primitives/*` and
  `Patterns/Mantine/*` Stories only.

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | Mantine's Portal marks its node with data-portal="true". | source: `node_modules/@mantine/core/esm/components/Portal/Portal.mjs:20-20`; observed: `node.setAttribute("data-portal", "true");` |
| C2 | FACT | The 859 GR-3j census reads only the Storybook root. | source: `docs/sessions/evidence/task859/review-15/r15-mobile.mjs:33-33`; observed: `const root = document.querySelector('#storybook-root') ?? document.body` |
| C3 | FACT | The record-card app roots were green in review 16. | source: `docs/sessions/evidence/task859/review-16/r16-summary.txt:5-5`; observed: `record cards: label and value on one line 0` |
| C4 | FACT | The ticket sheet header was squeezed inside a portal. | source: `docs/sessions/evidence/task859/review-16/r16-summary.txt:13-13`; observed: `ticketdetaildialogview--support 320 en 86<88` |
| C5 | FACT | A picker name was 0px wide on 12 lines and the id ran past the screen inside a portal. | source: `docs/sessions/evidence/task859/review-16/r16-summary.txt:17-17`; observed: `320 uk Blerina Hoxha: nameW=0 lines=12 rightW=445 spillOpt=153 spillVp=153` |
| C6 | FACT | screenshots:assert is retired as QA evidence. | source: `docs/qa-profiles.md:24-24`; observed: `and all of its aliases are retired as QA evidence` |
| C7 | FACT | The retired engine opens an overlay by clicking the first button or input of the app root. | source: `scripts/check-stories-rendered.mjs:927-927`; observed: `page.locator('#storybook-root button, #storybook-root input').first()` |
| C8 | FACT | The Modal primitive's Default Story shows no dialog on mount. | source: `docs/sessions/evidence/task859/review-16/r16-dialogs.jsonl:1-1`; observed: `"id":"mantine-primitives-modal--default","w":320,"loc":"sq","dialogs":0` |
| C9 | FACT | CI builds Storybook in the rendered-gate job. | source: `.github/workflows/governance-pr.yml:308-308`; observed: `run: npm run build-storybook` |
| C10 | FACT | CI runs the card-track gate and its self-test after the build. | source: `.github/workflows/governance-pr.yml:311-314`; observed: `run: npm run check:card-track-monotonicity:verify` |
| C11 | FACT | The card-track gate exposes a --verify-gate self-test script. | source: `package.json:118-119`; observed: `node scripts/check-card-track-monotonicity.mjs --verify-gate` |
| C12 | FACT | Playwright is installed. | source: `package.json:211-211`; observed: `"playwright": "^1.60.0",` |
| C13 | FACT | Storybook 10 is installed. | source: `package.json:214-214`; observed: `"storybook": "^10.4.2",` |
| C14 | FACT | The overlay owners are registered as one component family. | source: `scripts/mobile-adaptation-patterns.json:131-131`; observed: `"id": "overlay-and-disclosure",` |
| C15 | FACT | The touch-target token is 44px. | source: `src/design-system/mantine/theme.ts:739-739`; observed: `touchTarget: '2.75rem',` |
| C16 | FACT | The owner ruled that legacy components are migrated, not instrumented. | source: `docs/backlog-archive.md:68-68`; observed: `legacy components are migrated, not instrumented` |
| C17 | FACT | The contract names the registry file. | source: `.claude/rules/shared/rendered-state-census.md:19-19`; observed: `scripts/rendered-interaction-states.json` |
| C18 | FACT | The contract measures the app root and each portal root separately. | source: `.claude/rules/shared/rendered-state-census.md:26-26`; observed: `Separate targets** — the app root` |
| C19 | FACT | The contract counts a word split across lines as cut text. | source: `.claude/rules/shared/rendered-state-census.md:30-30`; observed: `a word split across lines because its box is` |
| C20 | FACT | The contract requires planted violations inside a portal root. | source: `.claude/rules/shared/rendered-state-census.md:42-42`; observed: `overflow only inside a portal root` |
| C21 | FACT | Since Revision 1 a negative margin exempts at most its own size (review 1 finding 2; the unbounded form is shown by C23). | source: `scripts/rendered-state-census/in-page.mjs:170-170`; observed: `const overBeyond = (over, margin) => over > 0.5 && !(margin < 0 && over <= -margin + 0.5);` |
| C22 | FACT | Since Revision 1 a table-box parent exempts its child unless it is a control or media in a fixed-layout table cell (review 1 finding 2). | source: `scripts/rendered-state-census/in-page.mjs:297-297`; observed: `const tableExempt = tableBox && !(pcs.display === 'table-cell' && fixedLayoutTable(parent) && isMediaOrControl(e));` |
| C23 | FACT | A planted negative-margin element overflowing its parent inside a portal is green. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:3-3`; observed: `FIXTURE neg-margin: app green` |
| C24 | FACT | A page scrollable to 616px at a 390px viewport is green. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:4-4`; observed: `[page scrollWidth 616 clientWidth 390]` |
| C25 | FACT | Since Revision 1 a width outside a state's `widths` runs a range job instead of being skipped (review 1 finding 3; the skip is shown by C26, C27). | source: `scripts/check-rendered-state-census.mjs:179-179`; observed: `runRangeJob(page, ctx, state, locale, width, { inRangeWidth, siblings })` |
| C26 | FACT | A state registered `widths: {min: 1440}` opens at 1024. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:6-6`; observed: `widths {"min":1440} trigger BUTTON "AKAlba Krasniqi" -> 320:absent 390:absent 639:absent 640:absent 1024:OPENS` |
| C27 | FACT | 41 sampled `widths` states open at a width the runner skips. | source: `docs/sessions/evidence/task923/review-1/rv-probe.txt:46-46`; observed: `states whose same-named trigger opens a portal at a skipped width: 41` |
| C28 | FACT | The theme's breakpoints include `sm` 640, `lg` 1024 and `xxl` 1440. | source: `src/design-system/mantine/theme.ts:637-641`; observed: `lg: '64em',   // 1024px — desktop` |
| C29 | FACT | Since Revision 1 a not-applicable dismissal returns its reason for the row's `notApplicable` (review 1 finding 5). | source: `scripts/rendered-state-census/runner.mjs:360-360`; observed: `a bottom sheet renders no close control of its own` |
| C30 | FACT | Since Revision 1 discovery click-checks every in-scope Story, registered or not (review 1 finding 4; the miss is shown by C31). | source: `scripts/rendered-state-census/discover.mjs:180-180`; observed: `const clickJobs = stories.map((story) => ({` |
| C31 | FACT | A registered Story has triggers that open a portal with no registry row. | source: `docs/sessions/evidence/task923/review-1/rv-probe2.txt:4-4`; observed: `UNREGISTERED patterns-mantine-admindashboardview--adm-09-zero @390: button "AKModern Apartment in Tirana C" opens 1 portal(s)` |
| C32 | FACT | Since Revision 1 the discovery candidate list has no cap (review 1 finding 4). | source: `scripts/rendered-state-census/in-page.mjs:546-546`; observed: `NO cap: discovery clicks every one (Task 923 R14)` |
| C33 | FACT | The self-test behaves as stated at review. | source: `docs/sessions/evidence/task923/review-1/rv-verify.txt:19-19`; observed: `verify-gate: every case behaves as stated.` |
| C34 | FACT | The AC4 targets fail on the portal root only at review: 24 of 48 rows fail. | source: `docs/sessions/evidence/task923/review-1/rv-ac4.txt:5-5`; observed: `rows 48 (failing 24)` |
| C35 | FACT | Since Revision 2 `component-overflow` measures absolutely positioned, fixed and transformed content (review 2 finding 1; the skip it replaced is shown by C36, C37). | source: `scripts/rendered-state-census/in-page.mjs:229-229`; observed: `if (holdsContent(e) && !e.matches(OVERLAY_PANEL)) {` |
| C36 | FACT | A planted absolutely positioned text past the dialog box is green on its portal root. | source: `docs/sessions/evidence/task923/review-2/rv2-exemption-probe.txt:7-7`; observed: `rv2-abs-past-dialog portal:0 GREEN` |
| C37 | FACT | A planted transformed text past the dialog box is green on its portal root. | source: `docs/sessions/evidence/task923/review-2/rv2-exemption-probe.txt:9-9`; observed: `rv2-transform-past-dialog portal:0 GREEN` |
| C38 | FACT | The planted text paints 22px past the dialog box, inside the viewport. | source: `docs/sessions/evidence/task923/review-2/rv2-exemption-probe.txt:10-10`; observed: `dialog x 16..310; planted text x 212..332` |
| C39 | FACT | An open click has one 4 s attempt and no retry. | source: `scripts/rendered-state-census/runner.mjs:295-295`; observed: `if (open.kind === 'click') await loc.click({ timeout: 4000 });` |
| C40 | FACT | The final full run has two open failures at 639. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:5-5`; observed: `"open-failed @639":2` |
| C41 | FACT | The executor could not reproduce the 639 open failures in isolation. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:211-211`; observed: `not reproducible` |
| C42 | FACT | A whole first full run of Revision 1 was lost to network suspension. | source: `docs/sessions/2026-10-10-task923-rendered-state-census.md:200-200`; observed: `951 of its rows are` |
| C43 | FACT | The theme's mobile gate is 40em (640px). | source: `src/design-system/mantine/theme.ts:740-740`; observed: `mobileGate: '40em',` |
| C44 | FACT | `AdminListingsView` switches to compact with an inclusive max-width of the gate. | source: `src/components/admin/AdminListingsView.tsx:82-82`; observed: `(max-width: ${theme.other.mobileGate})` |
| C45 | FACT | `RangeDatePicker` switches to compact with an inclusive `max-width: 40em`. | source: `src/design-system/mantine/patterns/RangeDatePicker.tsx:922-922`; observed: `useMediaQuery('(max-width: 40em)')` |
| C46 | FACT | The canonical bottom sheet switches with the same inclusive query. | source: `src/design-system/mantine/patterns/responsiveBottomSheet.tsx:52-52`; observed: `(max-width: ${theme.other.mobileGate})` |
| C47 | FACT | The AppShell owner already uses an exclusive max-width (minus 0.1px). | source: `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx:96-96`; observed: `(max-width: ${collapseBreakpointPx - 0.1}px)` |
| C48 | FACT | The mobile contract requires the compact composition below 640px. | source: `.claude/rules/shared/mobile-adaptation-contract.md:23-23`; observed: `the compact composition is required **below` |
| C49 | FACT | The final full run has 44 `widths-mismatch` cells, all at 640. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:5-5`; observed: `"widths-mismatch @640":44` |
| C50 | FACT | Since Revision 2 discovery keeps the result of every candidate click (review 2 finding 5; the unrecorded count it replaced is shown by C51). | source: `scripts/rendered-state-census/discover.mjs:108-108`; observed: `const clicked = await clickPath(page, c.sel);` |
| C51 | FACT | 148 of 4 236 discovery candidates cannot be operated at first load. | source: `docs/sessions/evidence/task923/review-2/rv2-unclickable-probe.txt:4-4`; observed: `candidates 4236; not operable at first load 148` |
| C52 | FACT | Only one of them is in a Story with no mount row. | source: `docs/sessions/evidence/task923/review-2/rv2-unclickable-probe.txt:5-5`; observed: `of which in Stories with no mount row: 1` |
| C53 | FACT | One Story renders the Storybook error display on the final build. | source: `docs/sessions/evidence/task923/r2-81-discover.txt:42-42`; observed: `dashboardperiodcontrol--custom-range-too-long` |
| C54 | FACT | That Story throws its play-function exceptions. | source: `src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx:90-90`; observed: `parameters: { throwPlayFunctionExceptions: true },` |
| C55 | FACT | The Revision 1 self-test reproduces at review 2. | source: `docs/sessions/evidence/task923/review-2/rv2-verify.txt:41-41`; observed: `verify-gate: every case behaves as stated.` |
| C56 | FACT | Every full-run row carries every rule key and `notApplicable`, and the rows are unique. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:4-4`; observed: `rows missing a rule key 0; rows without notApplicable 0; unique 22738` |
| C57 | FACT | AC4's picker target fails on its portal root while its app root passes. | source: `docs/sessions/evidence/task923/review-2/rv2-rows-check.txt:8-8`; observed: `failing 4 [word-split, viewport-overflow, component-overflow]; app rows failing 0 of 8` |
| C58 | FACT | A hover over the sampled non-candidate elements opens no portal. | source: `docs/sessions/evidence/task923/review-2/rv2-hover-probe.txt:7-7`; observed: `0 open a portal` |
| C59 | FACT | The 26 overlay-importing Stories without a row were all clicked through, and none opens a portal. | source: `docs/sessions/evidence/task923/r2-81-discover.txt:13-13`; observed: `26 of the 26 Stories that import an overlay component and have no row render no trigger that opens a portal` |
| C60 | FACT | A positioned or transformed element is measured against its clipping ancestor or overlay panel (R15); before R19 that path had no clipped-away bound. | source: `scripts/rendered-state-census/in-page.mjs:230-230`; observed: `const bound = positionedBound(e, root);` |
| C61 | FACT | The in-flow path exempts an element wholly outside a clipping ancestor only on a scroll region or a transformed track (R11). | source: `scripts/rendered-state-census/in-page.mjs:285-285`; observed: `region or the element rides a transformed track (a carousel slide)` |
| C62 | FACT | 504 positioned details of the Revision 2 full run are gallery-track elements wholly outside their frame. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-classes.txt:4-4`; observed: `504 gallery-track wholly-out div` |
| C63 | FACT | The lightbox's off-frame slide holds no text and no control, only media. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-probe.txt:4-4`; observed: `wholly=true coversXY=false text=false controls=0 media=true` |
| C64 | FACT | 268 positioned details are the card image layer covering its frame. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-classes.txt:5-5`; observed: `268 image-layer covers img` |
| C65 | FACT | The image layer covers its frame on both axes and holds no text. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-probe.txt:12-12`; observed: `wholly=false coversXY=true text=false controls=0 media=true` |
| C66 | FACT | The listing image scales on hover by product design. | source: `src/design-system/media/AppImage.module.css:61-61`; observed: `hoverClass: 'group-hover:scale-105'` |
| C67 | FACT | At 320 the Leaflet popup close control lies wholly outside the map that clips it. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-classes.txt:8-8`; observed: `(absolute) x 284..308 past div.listing-map 37..283` |
| C68 | FACT | That close control is an interactive element with text. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-probe.txt:9-9`; observed: `a.leaflet-popup-close-button wholly=true coversXY=false text=true controls=1` |
| C69 | FACT | At 1024 the dashboard chart extends past its card. | source: `docs/sessions/evidence/task923/review-3/rv3-d16-classes.txt:3-3`; observed: `(transformed) x 791.7..1011.7 past div.m_e615b15f 771.7..998.7` |
| C70 | FACT | One error-screen cell of the Revision 2 full run is outside 925. | source: `docs/sessions/evidence/task923/review-3/rv3-rows-check.txt:11-11`; observed: `error-screen @390 mantine-primitives-headerview--signing-out~notifications it` |
| C71 | FACT | A Story whose render does not finish in 20 s fails the load with a render-timeout reason. | source: `scripts/rendered-state-census/runner.mjs:237-237`; observed: `render did not reach finished/errored within 20s` |
| C72 | FACT | The R16 transient class retries a load failure on a navigation error; before R20 it named nothing else. | source: `scripts/rendered-state-census/runner.mjs:605-605`; observed: `for (const d of r.rules['error-screen']) if (/^navigation failed` |
| C73 | FACT | The same cell run alone has no error-screen. | source: `docs/sessions/evidence/task923/r3-85-stray-cell-rerun.txt:40-40`; observed: `portal:0 :: text-clamp, text-hidden (1 cell(s))` |
| C74 | FACT | The Revision 2 self-test reproduces at review 3. | source: `docs/sessions/evidence/task923/review-3/rv3-verify.txt:47-47`; observed: `verify-gate: every case behaves as stated.` |
| C75 | FACT | The Revision 2 mutation proof proves 9 of 9 bounds. | source: `docs/sessions/evidence/task923/r3-50-bound-mutations.txt:14-14`; observed: `9 of 9 proved.` |
| C76 | FACT | Every Revision 2 full-run row carries every rule key and `notApplicable`, and the rows are unique. | source: `docs/sessions/evidence/task923/review-3/rv3-rows-check.txt:3-3`; observed: `rows missing a rule key 0; rows without notApplicable 0; unique 22739` |
| C77 | FACT | Every retried job of the Revision 2 full run is at 640. | source: `docs/sessions/evidence/task923/review-3/rv3-rows-check.txt:9-9`; observed: `retried jobs not at 640 0` |
| C78 | FACT | R15 raised the component-overflow rows from 873 to 1181. | source: `docs/sessions/evidence/task923/r3-84-component-overflow-change.txt:11-11`; observed: `873 -> 1181 (+308)` |
| C79 | FACT | Discovery records found, clicked and not-operable candidates. | source: `docs/sessions/evidence/task923/r3-81-discover.txt:44-44`; observed: `found 4245, clicked 4091, not operable 154` |
| C80 | FACT | In the detail pattern at 320 the track's own box lies wholly outside its frame; its 6 off-screen slides are hidden, untabbable and textless, and the slide in the frame is the named, tabbable one. | source: `docs/sessions/evidence/task923/review-4/rv4-gallery-summary.txt:2-2`; observed: `slides wholly outside 6, of them aria-hidden+tabindex=-1+no text 6; slides inside 1, tabbable and named` |
| C81 | FACT | R19(a) as built in Revision 3 rejected a slide when any descendant is a control, wherever that descendant lies (R22 replaced it; the Revision 4 mutation proof restores that text). | source: `docs/sessions/evidence/task923/r5-50-bound-mutations.mjs:55-56`; observed: `!e.querySelector(BOUND_CONTROL)` |
| C82 | FACT | The gallery takes every slide but the visible one out of the tab order and hides it from assistive technology. | source: `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:104-106`; observed: `tabIndex={isVisible ? undefined : -1}` |
| C83 | FACT | The WAI-ARIA carousel pattern calls a slide that is only placed off-screen incorrectly hidden. | source: `docs/sessions/evidence/task923/review-4/rv4-gr7.md:10-10`; observed: `incorrectly hidden, e.g., displayed off-screen` |
| C84 | FACT | Below 640 the gallery photo counter lies wholly below the frame that clips it. | source: `docs/sessions/evidence/task923/review-4/rv4-gallery-summary.txt:3-3`; observed: `y 444..470 bound y 104..444; computed top 340px bottom -26px` |
| C85 | FACT | From 640 the counter sits on the frame's top edge with no inset. | source: `docs/sessions/evidence/task923/review-4/rv4-gallery-summary.txt:11-11`; observed: `y 104..130 bound y 104..524; computed top 0px` |
| C86 | FACT | The counter is placed with string inset style props. | source: `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:128-128`; observed: `bottom="xs" left="xs"` |
| C87 | FACT | Mantine's inset style props are size props. | source: `node_modules/@mantine/core/esm/core/Box/style-props/style-props-data.mjs:48-48`; observed: `bottom: { type: "size", property: "bottom" }` |
| C88 | FACT | Mantine's size resolver passes a string through unchanged, so `xs` is not a theme spacing value there. | source: `node_modules/@mantine/core/esm/core/Box/style-props/resolvers/size-resolver/size-resolver.mjs:11-11`; observed: `return value;` |
| C89 | FACT | 859 R58 requires the gallery counter placed by a Box with theme spacing. | source: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_859_Admin_Support_Unassigned_Landing_On_Mantine.md:1972-1972`; observed: `with theme spacing` |
| C90 | FACT | The gallery pattern Story, loaded after another Story in the same page, shows a hidden, untabbable slide in its frame while the named, tabbable slide is off-screen. | source: `docs/sessions/evidence/task923/review-4/rv4-gallery-sync.txt:7-7`; observed: `slide in the frame #2 (aria-hidden true, tabindex -1); named tabbable slide #1 at x -272..16; in sync false` |
| C91 | FACT | Loaded first in its page, the same Story is in sync. | source: `docs/sessions/evidence/task923/review-4/rv4-gallery-scroll.txt:3-3`; observed: `slide in the frame #1; named tabbable slide #1` |
| C92 | FACT | Revision 3 leaves 312 gallery-track details. | source: `docs/sessions/evidence/task923/r4-70-d16-classes.txt:4-4`; observed: `312 gallery-track wholly-out div` |
| C93 | FACT | The Revision 3 self-test reproduces at review 4. | source: `docs/sessions/evidence/task923/review-4/rv4-verify.txt:52-52`; observed: `verify-gate: every case behaves as stated.` |
| C94 | FACT | The Revision 3 mutation proof reproduces 13 of 13. | source: `docs/sessions/evidence/task923/review-4/rv4-bound-mutations.txt:16-16`; observed: `13 of 13 proved.` |
| C95 | FACT | Every gate-level cell of the Revision 3 full run is a 640 cell or the 925 cell. | source: `docs/sessions/evidence/task923/review-4/rv4-rows-check.txt:4-4`; observed: `not at 640 and not custom-range-too-long: []` |
| C96 | FACT | The whole vitest suite is green at review 4. | source: `docs/sessions/evidence/task923/review-4/rv4-vitest-all-2.txt:7-7`; observed: `2573 passed (2573)` |
| C97 | FACT | The executor's first whole-suite run failed 9 tests. | source: `docs/sessions/evidence/task923/r4-91-vitest-all-1.txt:190-190`; observed: `2564 passed (2573)` |
| C98 | FACT | R22's slide exemption is in the delivered code. | source: `scripts/rendered-state-census/in-page.mjs:259-259`; observed: `const exemptSlide = slideShape && !slideBreak;` |
| C99 | FACT | The Revision 4 self-test reproduces at review 5. | source: `docs/sessions/evidence/task923/review-5/rv5-01-verify.txt:55-55`; observed: `verify-gate: every case behaves as stated.` |
| C100 | FACT | The Revision 4 mutation proof reproduces 15 of 15. | source: `docs/sessions/evidence/task923/review-5/rv5-02-mutations.txt:18-18`; observed: `15 of 15 proved.` |
| C101 | FACT | The R22 PASS case asserts one rule only; its portal root still fails `action-covered`. | source: `docs/sessions/evidence/task923/review-5/rv5-01-verify.txt:49-49`; observed: `other rules observed, not asserted (portal:0: action-covered)` |
| C102 | FACT | The `action-covered` report itself has no condition for a control that is clipped away, hidden from assistive technology and out of the tab order; until R24 nothing before it had one either. | source: `scripts/rendered-state-census/in-page.mjs:434-434`; observed: `if (!ok) add('action-covered',` |
| C103 | FACT | The `action-hidden` report has no such condition either; R24 adds the skip before both. | source: `scripts/rendered-state-census/in-page.mjs:419-419`; observed: `if (!region && !(outsideY && !outsideX && pageScrollable)) add('action-hidden',` |
| C104 | FACT | The gallery's off-screen slides are out of the tab order. | source: `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:105-106`; observed: `tabIndex={isVisible ? undefined : -1}` |
| C105 | FACT | The gallery's slides are in-flow, non-shrinking children of the transformed track. | source: `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:103-103`; observed: `className="block h-full shrink-0"` |
| C106 | FACT | On the faithful synced gallery shape, the delivered code fails `component-overflow` on the visible slide (inside the frame, past its displaced track box) and the action rules on the hidden slides. | source: `docs/sessions/evidence/task923/review-5/rv5-11-probe.txt:5-5`; observed: `component-overflow [button "" x 212..332 past div 92..212] ; action-hidden [button "" centre 392,183.6 outside the 390x844 viewport` |
| C107 | FACT | The in-flow path measures an element against its parent's box. | source: `scripts/rendered-state-census/in-page.mjs:308-308`; observed: `past ${describe(parent)} ${px(left)}..${px(right)}` |
| C108 | FACT | The in-flow clipped-away exemption covers only an element wholly outside its clipping ancestor. | source: `scripts/rendered-state-census/in-page.mjs:294-294`; observed: `clippedAway = wholly && (` |
| C109 | FACT | Two full runs on code that differs only by R22 disagree in 69 rows. | source: `docs/sessions/evidence/task923/r5-85-row-diff.txt:7-7`; observed: `rows in both whose failing-rule set differs: 69` |
| C110 | FACT | Three narrowed AuthSheet runs with no other load disagree on `focus-trap`. | source: `docs/sessions/evidence/task923/review-5/rv5-41-trap-compare.txt:12-12`; observed: `DIFF register-agent en 640 trap=g open=g` |
| C111 | FACT | The trap loop presses each key and then reads the focus; until R26 (b) it read it at once. | source: `scripts/rendered-state-census/runner.mjs:581-581`; observed: `await page.keyboard.press(key);` |
| C112 | FACT | Read at once after each Tab, the AuthSheet focus is on `body` at the fourth press. | source: `docs/sessions/evidence/task923/review-5/rv5-42-trap-probe.txt:2-2`; observed: `pause 0 load true tabbables 13: LEAK` |
| C113 | FACT | With a 300 ms pause after each Tab, the same sheet keeps the focus. | source: `docs/sessions/evidence/task923/review-5/rv5-42-trap-probe.txt:7-7`; observed: `pause 300 load true tabbables 13: kept` |
| C114 | FACT | `waitStable` no longer counts infinite animations since R26 (a); before R26 it counted every running animation, and review 5 measured with that count (C115–C117). | source: `scripts/rendered-state-census/runner.mjs:258-258`; observed: `an infinite one, a loader, never settles and is not counted` |
| C115 | FACT | On ListingContactPattern "write on WhatsApp", `waitStable` returns only at its 4 s bound, and the notification has closed itself 1 s later. | source: `docs/sessions/evidence/task923/review-5/rv5-46-toast-probe.txt:2-2`; observed: `run 0 waitStable returned at 4030ms: notification 984..1324; 1s later none` |
| C116 | FACT | The animations that keep running there are infinite. | source: `docs/sessions/evidence/task923/review-5/rv5-47-anim-probe.txt:3-3`; observed: `CSSAnimation:m_f8e89c4b iterations=Infinity` |
| C117 | FACT | Three narrowed ListingContactPattern runs disagree on `dismiss-close-control`. | source: `docs/sessions/evidence/task923/review-5/rv5-44-misc-compare.txt:99-99`; observed: `DIFF patterns-mantine-listingcontactpattern--default~write-on-whatsapp portal:0 uk 639 :: dismiss-close-control,focus-trigger,target-small` |
| C118 | FACT | The AdminShell drawer opened on mount sometimes leaves the focus on the app's menu button. | source: `docs/sessions/evidence/task923/review-5/rv5-45-focusopen-probe.txt:4-4`; observed: `focus OUTSIDE button.mantine-focus-auto[Open menu]` |
| C119 | FACT | Sampled for 1.5 s, that outcome does not change: the focus stays outside the drawer. | source: `docs/sessions/evidence/task923/review-5/rv5-45-focusopen-probe.txt:5-5`; observed: `1369:1/0/out 1430:1/0/out 1492:1/0/out` |
| C120 | FACT | The whole suite is red at review 5, first run. | source: `docs/sessions/evidence/task923/review-5/rv5-20-vitest-all-1.txt:411-411`; observed: `Tests  24 failed` |
| C121 | FACT | The whole suite is red at review 5, second run. | source: `docs/sessions/evidence/task923/review-5/rv5-20-vitest-all-2.txt:375-375`; observed: `Tests  22 failed` |
| C122 | FACT | The eight files that failed in the second run pass when run alone. | source: `docs/sessions/evidence/task923/review-5/rv5-21-vitest-failed-isolated.txt:7-7`; observed: `Tests  108 passed (108)` |
| C123 | FACT | The Q1 gates ask for targeted tests of the touched area. | source: `docs/qa-profiles.md:13-13`; observed: `Targeted tests or commands for the touched area` |
| C124 | FACT | `check-mojibake.mjs` lists files through `spawnSync` with no `maxBuffer` option. | source: `scripts/check-mojibake.mjs:138-139`; observed: `cwd: ROOT, encoding: 'utf8',` |
| C125 | FACT | The listing is larger than the 1 MiB default, and the unmodified command exits 1. | source: `docs/sessions/evidence/task923/review-5/rv5-60-mojibake.txt:7-8`; observed: `listing bytes: 1056579 (maxBuffer default 1048576)` |
| C126 | FACT | CI runs `check:mojibake`. | source: `.github/workflows/governance-pr.yml:164-164`; observed: `run: npm run check:mojibake` |
| C127 | FACT | A rule's printed details are capped, with a tail for the rest. | source: `scripts/rendered-state-census/in-page.mjs:446-446`; observed: `more (${counts[key]} in total)` |
| C128 | FACT | The Revision 4 full run has one unique row per cell and every rule key. | source: `docs/sessions/evidence/task923/review-5/rv5-52-ac21-checks.txt:1-1`; observed: `"rows":22740,"unique":22740,"ruleKeys":20,"missing":0` |
| C129 | FACT | Review 6 reproduces the Revision 5 self-test. | source: `docs/sessions/evidence/task923/review-6/rv6-01-verify.txt:63-63`; observed: `verify-gate: every case behaves as stated.` |
| C130 | FACT | Review 6 reproduces the Revision 5 mutation proof. | source: `docs/sessions/evidence/task923/review-6/rv6-02-mutations.txt:34-34`; observed: `21 of 21 proved.` |
| C131 | FACT | Review 6 reproduces AC25: the narrowed misc runs differ only where AC25 allows. | source: `docs/sessions/evidence/task923/review-6/rv6-44-misc-compare.txt:106-106`; observed: `differences NOT allowed (AC25: stop as BLOCKED): 0` |
| C132 | FACT | Between the Revision 4 and Revision 5 full runs, rows change verdict on `dismiss-outside` alone, in both directions. | source: `docs/sessions/evidence/task923/review-6/rv6-11-verdict-flips.txt:3-4`; observed: `6 +dismiss-outside` |
| C133 | FACT | Run alone three times, the Stories of the rows that turned red show no dismissal violation. | source: `docs/sessions/evidence/task923/review-6/rv6-52-dismiss-isolation-counts.txt:1-3`; observed: `rows with a dismiss violation 0` |
| C134 | FACT | Through the gate's own `dismissCheck`, the menu closes in about 310ms at CPU 1x. | source: `docs/sessions/evidence/task923/review-6/rv6-51-dismiss-throttle-probe.txt:2-2`; observed: `gate CLOSED in 313ms` |
| C135 | FACT | At CPU 8x the same close takes over a second. | source: `docs/sessions/evidence/task923/review-6/rv6-51-dismiss-throttle-probe.txt:13-13`; observed: `gate CLOSED in 1306ms` |
| C136 | FACT | Since R28 `dismissCheck` gives the overlay 5 000ms to close; before R28 it gave 1 000ms (the "still visible 1000ms" details of `r6-full`). | source: `scripts/rendered-state-census/runner.mjs:253-253`; observed: `export const DISMISS_BOUND_MS = 5000;` |
| C137 | FACT | The Revision 5 full run used 10 workers. | source: `docs/sessions/evidence/task923/r6-82-full-run.txt:9-9`; observed: `10 worker(s)` |
| C138 | FACT | The whole-registry CI step turns blocking once a full run is green. | source: `.claude/rules/shared/rendered-state-census.md:62-62`; observed: `CI step over the whole registry turns blocking the day its full run is green` |
| C139 | FACT | Since R29 a retried job keeps the second attempt's rows only; before R29 a retry copied the first attempt's violations into them. | source: `scripts/rendered-state-census/runner.mjs:630-630`; observed: `return { rows: second, page: next };` |
| C140 | FACT | An attempt whose open failed still measures the app root. | source: `scripts/rendered-state-census/runner.mjs:431-431`; observed: `if (first.stage === 'open') app.rules['open-failed'].push(first.reason);` |
| C141 | FACT | The app root is treated as inert only when the state really opened. | source: `scripts/rendered-state-census/runner.mjs:435-435`; observed: `const appInert = first.stage === 'ok' && count > 0` |
| C142 | FACT | In the Revision 4 full run, 16 retried rows record a rule as not measured and violated at once. | source: `docs/sessions/evidence/task923/review-6/rv6-10-na-vs-violation.txt:2-3`; observed: `{ retry: 16 }` |
| C143 | FACT | Since R30 the R24 skip count is its own key `skippedActions`; before R30 it was written as a not-applicable reason. | source: `scripts/rendered-state-census/runner.mjs:124-124`; observed: `row.skippedActions += skipped ?? 0;` |
| C144 | FACT | In the Revision 5 full run, 64 rows that were not retried record a rule as not applicable and violated at once. | source: `docs/sessions/evidence/task923/review-6/rv6-10-na-vs-violation.txt:11-12`; observed: `{ 'no-retry': 64 }` |
| C145 | FACT | Review 6 reproduces AC27 on a listing over 1 MiB. | source: `docs/sessions/evidence/task923/review-6/rv6-20-mojibake.txt:2-2`; observed: `listing bytes 1063514` |
| C146 | FACT | Since R29 no root of the first attempt is carried into the retried result; before R29 a root measured only by the first attempt was kept. | source: `scripts/rendered-state-census/runner.mjs:615-615`; observed: `no rule, no root - is carried into the result` |
| C147 | FACT | The self-test has a case whose first load fails to open and is retried. | source: `scripts/rendered-state-census/verify.mjs:107-107`; observed: `{ name: 'open-flaky-once', flaky: true, retry: true` |
| C148 | FACT | Since R29 the unit test asserts that a retry replaces the first attempt; before R29 it asserted that the first attempt's measured violation was kept. | source: `scripts/__tests__/rendered-state-census.test.ts:241-241`; observed: `a retry replaces the first attempt: nothing it measured on a page that never opened is carried over (R29)` |
| C149 | FACT | Every dashboard chart is loaded lazily, in the browser only. | source: `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx:14-14`; observed: `const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })` |
| C150 | FACT | Since R31 `waitStable` also needs an unchanged layout signature and no same-origin request in flight; before R31 it settled on the portal count and the finite animations only. | source: `scripts/rendered-state-census/runner.mjs:279-279`; observed: `s.sig === last.sig && s.running === 0 && inflight === 0` |
| C151 | FACT | With the chart chunk on time, the gate measures the chart's three overflow details. | source: `docs/sessions/evidence/task923/review-6/rv6-57-chart-chunk-delay-probe.txt:2-2`; observed: `chart details at return 3, 3s later 3; layout unchanged` |
| C152 | FACT | With the chart chunk 2 000ms late, `waitStable` returns before the chart is mounted, and the page changes after the measurement. | source: `docs/sessions/evidence/task923/review-6/rv6-57-chart-chunk-delay-probe.txt:7-7`; observed: `chart details at return 0, 3s later 3; layout CHANGED (756/5397334 -> 1145/8138249)` |
| C153 | FACT | Chart rows lost their chart detail between full runs on unchanged chart code. | source: `docs/sessions/evidence/task923/r6-72-chart-row-diff.txt:8-8`; observed: `9 x chart / chart / no-chart` |
| C154 | FACT | Since R31 the open action runs after a settle; before R31 it ran as soon as the load ended. | source: `scripts/rendered-state-census/runner.mjs:310-310`; observed: `await waitStable(page, null); // R31: what the page loads late has arrived before anything is opened` |
| C155 | FACT | The static server splits the query off a request before it serves the file (since R31 it reads `__census_delay` from that query). | source: `scripts/rendered-state-census/runner.mjs:48-48`; observed: `const [rawPath, query = ''] = (req.url ?? '/').split('?');` |
| C156 | FACT | The self-test has a case with an infinite CSS loader and a toast that closes itself. | source: `scripts/rendered-state-census/verify.mjs:104-104`; observed: `{ name: 'infinite-spinner-toast', fail: {}, green: ['app', 'portal:0'] }` |
| C157 | FACT | Reusing one page across the Story's jobs does not change the chart detail; the page holds no storage. | source: `docs/sessions/evidence/task923/review-6/rv6-55-reused-page-probe.txt:4-4`; observed: `chart details 3; failing text-clamp+text-ellipsis+text-hidden+component-overflow; localStorage []; sessionStorage []` |
| C158 | FACT | At review 7 the 69 files hashed at the end of Revision 6 are unchanged: the check printed no mismatch. | source: `docs/sessions/evidence/task923/review-7/rv7-01-hashes.txt:2-2`; observed: `checked 69` |
| C159 | FACT | The Revision 6 self-test reproduces at review 7. | source: `docs/sessions/evidence/task923/review-7/rv7-20-verify.txt:68-68`; observed: `verify-gate: every case behaves as stated.` |
| C160 | FACT | The Revision 6 mutation proof reproduces at review 7. | source: `docs/sessions/evidence/task923/review-7/rv7-21-mutations.txt:41-41`; observed: `26 of 26 proved.` |
| C161 | FACT | The two full runs of Revision 6 differ in 4 rows that AC32 does not allow. | source: `docs/sessions/evidence/task923/r7-84-determinism-a-b.txt:22747-22747`; observed: `differences NOT allowed (AC32: isolate three times, sample, record, report PARTIALLY IMPLEMENTED): 4` |
| C162 | FACT | Run a measured the activity-error app root on an unstyled page: the burger button is 16x6. | source: `docs/sessions/evidence/task923/r7-full-a/rows.jsonl:4509-4509`; observed: `16x6 < 44px` |
| C163 | FACT | In the same run-a row the open action opened no portal. | source: `docs/sessions/evidence/task923/r7-full-a/rows.jsonl:4509-4509`; observed: `declared 1 portal root(s), found 0` |
| C164 | FACT | Aborting the Storybook stylesheet reproduces that row: settle bound hit, no portal, the same failing rules. | source: `docs/sessions/evidence/task923/review-7/rv7-10-differing-cells-cause-probe.txt:4-4`; observed: `A iframe-css-aborted: settle {"ms":8009,"bounded":true}` |
| C165 | FACT | Answering the Storybook stylesheet 404 reproduces it as well. | source: `docs/sessions/evidence/task923/review-7/rv7-10-differing-cells-cause-probe.txt:5-5`; observed: `A iframe-css-404: settle {"ms":8081,"bounded":true}` |
| C166 | FACT | The unstyled signature is in one row of run a and in no row of run b or of the Revision 5 run. | source: `docs/sessions/evidence/task923/review-7/rv7-13-unstyled-signature-count.txt:2-4`; observed: `r7-full-b rows with a 16x6 target: 0` |
| C167 | FACT | Before R32 (the code inspected at review 7, hashes C158) `loadTarget` never checked a subresource. | source: `docs/sessions/evidence/task923/review-7/rv7-00-review.md:30-30`; observed: `never checks a subresource` |
| C168 | FACT | Before R32 the static server answered 404 to every error, a read error included, and logged nothing. | source: `docs/sessions/evidence/task923/review-7/rv7-00-review.md:30-31`; observed: `the static server answers 404 to **every** read error` |
| C169 | FACT | Since R32 the transient class of `error-screen` also takes a resource failure; before R32 it covered navigation errors and render timeouts only (C72). | source: `scripts/rendered-state-census/runner.mjs:602-602`; observed: `export const RESOURCE_FAILED = /^resource failed: /;` |
| C170 | FACT | Every job of the pool runs through `runWithRetry`. | source: `scripts/rendered-state-census/runner.mjs:646-646`; observed: `await runWithRetry(job.run, page, freshPage)` |
| C171 | FACT | Over all 260 Stories the only same-origin failures are 107 fetch requests; no script, stylesheet or document fails. | source: `docs/sessions/evidence/task923/review-7/rv7-12-same-origin-failure-sweep.txt:88-88`; observed: `failures by resource type {"fetch":107}` |
| C172 | FACT | The listing map opens its popup in the Leaflet import callback. | source: `src/components/shared/Map.tsx:35-35`; observed: `bindPopup(title).openPopup()` |
| C173 | FACT | The map's stylesheet is a cross-origin link rendered by the same component. | source: `src/components/shared/Map.tsx:48-48`; observed: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` |
| C174 | FACT | At CPU 1x Leaflet writes the popup width 301px while the popup is still static (its stylesheet not applied). | source: `docs/sessions/evidence/task923/review-7/rv7-11-leaflet-popup-width-probe.txt:3-3`; observed: `"width":"301px","mapWidth":316,"popupPosition":"static"` |
| C175 | FACT | At CPU 4x the stylesheet applies first and the popup width is 248px. | source: `docs/sessions/evidence/task923/review-7/rv7-11-leaflet-popup-width-probe.txt:6-6`; observed: `"width":"248px","mapWidth":316,"popupPosition":"absolute"` |
| C176 | FACT | After the settle the popup box is the same 3 000ms later. | source: `docs/sessions/evidence/task923/r7-65-leaflet-popup-settle-probe.txt:4-6`; observed: `unchanged` |
| C177 | FACT | The share button flips its tooltip label back 2 000ms after the click. | source: `src/modules/listings/components/ListingShareButton.tsx:32-32`; observed: `setTimeout(() => setCopied(false), 2000)` |
| C178 | FACT | Escape 2 007ms after the click closes the share tooltip, which then comes back on its own. | source: `docs/sessions/evidence/task923/review-7/rv7-10-differing-cells-cause-probe.txt:9-9`; observed: `first seen closed 123ms later, reopened true` |
| C179 | FACT | Escape 2 103ms after the click closes it for good. | source: `docs/sessions/evidence/task923/review-7/rv7-10-differing-cells-cause-probe.txt:10-10`; observed: `reopened false, portals at 5000ms 0` |
| C180 | FACT | In run a the share tooltip never closed on Escape. | source: `docs/sessions/evidence/task923/r7-full-a/rows.jsonl:17705-17705`; observed: `"dismissMs":{"escape":null,"outside":177}` |
| C181 | FACT | In run b the same tooltip closed on Escape in 183ms. | source: `docs/sessions/evidence/task923/r7-full-b/rows.jsonl:17706-17706`; observed: `"dismissMs":{"escape":183,"outside":162}` |
| C182 | FACT | Run b's all-photos sq 390 app row fails on the Leaflet popup. | source: `docs/sessions/evidence/task923/r7-full-b/rows.jsonl:17653-17653`; observed: `div.leaflet-popup` |
| C183 | FACT | Between the two Revision 6 full runs only three of the 260 Stories have a differing row: `admindashboardview--activity-error`, `adminshell--drawer-open` and `listingdetailview--archived-listing`. | source: `docs/sessions/evidence/task923/review-7/rv7-14-differing-stories.txt:3-6`; observed: `Stories with a differing row: 3 of 260` |
| D1 | OWNER DECISION | The census of overlays is a project-wide contract with a registry, separate portal targets, full metrics, a Story × state × root × locale × viewport record and a planted portal-only violation. | owner: 2026-10-10; decision: `R94 буде достатнім лише якщо він робить це загальним контрактом, а не латкою Task 859` |
| D2 | OWNER DECISION | Revision 6 keeps a full run, and its kickoff must let the executor find every defect without obstruction. | owner: 2026-10-15; decision: `нехай буде повний прогін, просто треба зробити якісний kickoff, щоб Sonnet все зробила вірно, щоб нічого їй не заважало, нехай знаходить всі помилки. Задача має бути виконана якісно!` |
| D3 | OWNER DECISION | The executor runs the census in parts, looks at each result and fixes what it finds at once, instead of a new revision per cause. | owner: 2026-10-16; decision: `я пропоную, щоб Sonnet почергово робила прогони, наприклад якимись шматками, дивилась результат і одразу його виправляла, і так далі.` |
| D4 | OWNER DECISION | The parts are single Stories: run Story by Story and fix the problem places. | owner: 2026-10-16; decision: `можна зробити так, щоб Sonnet робила від Story до Story прогони і виправляла проблемині місця` |
| D5 | OWNER DECISION | No long runs that buy nothing: the task is done in small parts. | owner: 2026-10-16; decision: `нащо так робити? Ми витрачаємо купу часу на ці прогони. Необхідно виконувати задачу маленькими частинами.` |

## Mobile adaptation record
- Scope: none

(Tooling only: the task writes no product UI, Story, token or style. It measures GR-3j; it does not change a
presentation.)

## 4. Scope and out of scope

**In scope (the exact write set):**
`scripts/check-rendered-state-census.mjs` (runner, CLI, self-test) and, if it is split, modules under
`scripts/rendered-state-census/`; `scripts/rendered-interaction-states.json` (registry);
`scripts/__fixtures__/rendered-state-census/*.html` (self-test fixtures); `scripts/__tests__/rendered-state-census.test.ts`
(registry validator unit tests); `package.json` (three script entries only); evidence `docs/sessions/evidence/task923/*`;
the session log `docs/sessions/2026-10-10-task923-rendered-state-census.md`; the 923 backlog cell.

**Out of scope:** any product source, Story, fixture, theme or token file (an overlay that cannot be opened without
editing its Story is reported, not repaired); `scripts/check-stories-rendered.mjs` and every retired alias (C6);
legacy Stories (C16); the CI workflow and the policy documents (Opus adds the CI steps and the governance doc rows at
review closure, §9); fixing any violation the gate finds (each is owned by a numbered task, R9).

## 5. Current and required behaviour

| | Current | Required |
|---|---|---|
| Overlay states | opened ad hoc by task probes, often not at all | every opening state registered and opened by the gate |
| Roots measured | `#storybook-root` only (C2) | the app root and each `[data-portal="true"]` root, separately |
| Text | clamp / ellipsis / overflow in the app root | the same per root, plus a word split across lines (C19) |
| Proof of the gate | none | planted portal-only violations fail while the app root is green |

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C1; C8; C14; C16; C17; D1] | **Registry** `scripts/rendered-interaction-states.json`: `{ "version": 1, "states": [...] }`; each state `{ id, story, open, portals, focus, dismiss, trigger?, closeSelector?, reason?, ownerDecision? }`. `story` = a Storybook id whose title starts `Mantine/Primitives/` or `Patterns/Mantine/`; `open` = `{ "kind": "mount" }`, `{ "kind": "click", "selector": "<css inside #storybook-root>" }` or `{ "kind": "keys", "selector": "…", "keys": ["ArrowDown"] }`; `portals` ≥ 1; `focus` = `trap` (Modal, Drawer, bottom sheet), `trigger` (focus stays on the trigger: Combobox / Select dropdown, Tooltip) or `inside` (Menu); `dismiss` ⊆ `escape`, `close-control`, `outside` — empty only with a `reason` (e.g. a View Story whose `onClose` is a no-op); `trigger` = the selector focus returns to (absent for `mount`). `id` unique; the validator rejects an unknown key, a duplicate id, a Story id absent from the build index and an out-of-scope title. | P1 | AC2 |
| R2 [C1; C14; C16; D1] | **Discovery** `--discover` on the built Storybook: every in-scope Story opened closed at 390 / en; reports (a) a Story that shows a `[data-portal="true"]` root on mount with no `mount` row, (b) an in-scope Story whose `importPath` file imports `Modal`, `Drawer`, `Popover`, `Menu`, `Combobox`, `Select`, `Tooltip` or `HoverCard` from `@mantine/core`, or any member of the `overlay-and-disclosure` family, `MantineCombobox`, `MantineSelect` or `RangeDatePicker`, with no row. The executor populates the registry until both lists are empty, reading each Story's source for its real triggers. | P1 | AC2 |
| R3 [C9; C12; C13; C18; D1] | **Runner** `check-rendered-state-census.mjs`: serves `storybook-static` read-only; for each registry state × locale × viewport (default widths 320 / 390 / 639 / 640 / 1440, locales sq / en / uk / it; `--stories <id,…>`, `--widths`, `--locales` narrow a run for a task) opens the state through its `open` action (never by editing a Story), asserts exactly `portals` new `[data-portal="true"]` roots with visible content, then measures the app root and each portal root as separate targets (the metrics of the next row); also sweeps every in-scope Story closed at 390 / en for an unregistered portal. Exit 1 on any violation, any open failure or any unregistered portal; exit 0 only when every job passes. | P1 | AC3 |
| R4 [C15; C18; C19; D1] | **Metrics per target**, each a named rule: `text-clamp` (computed `-webkit-line-clamp` ≠ none on a visible text element); `text-ellipsis` (`text-overflow: ellipsis` with hidden/clip overflow and `white-space: nowrap`, or active overflow); `text-hidden` (hidden/clip overflow with scroll size > client size + 0.5); `word-split` (a text element narrower than its longest word, measured with the element's computed font); `viewport-overflow` (page horizontal scroll, or the target's box past the viewport); `component-overflow` (an element whose box extends past its nearest clipping or target ancestor by > 0.5px, inside no scroll region that contains it); `action-hidden` / `action-covered` (a button, link with an icon, input, select or `[role=button]` outside the viewport and every scroll region, or not the hit element at its centre); `target-small` (below 768px: an action's smaller side < 44px, inline text links excluded); `focus-*` (`trap` / `inside`: on open the active element is inside the portal root, and for `trap` 1 + n Tab and Shift+Tab presses keep it inside; `trigger`: it stays on the trigger); `dismiss-*` (per declared mechanism: the portal content is hidden within 1 s and, for `trap` / `inside` with a `trigger`, focus returns to it). | P1 | AC3, AC4 |
| R5 [D1] | **Evidence**: one JSONL row per Story × state × root × locale × viewport: `{ story, state, root: "app" \| "portal:<n>", locale, width, rules: { <rule>: [<detail>] }, pass }`; a summary file with per-rule and per-Story × state counts. Paths from `--out`. | P1 | AC3 |
| R6 [C10; C11; C20; D1] | **Self-test** `--verify-gate` runs the same measuring code on `scripts/__fixtures__/rendered-state-census/*.html` served locally (no Storybook build), each with an inline registry: `clean` passes; `portal-overflow-only`, `portal-clamp-only`, `portal-word-split-only` (app root green in each) fail with `component-overflow` / `viewport-overflow`, `text-clamp`, `word-split`; `app-root-only` fails; `unregistered-portal` and `registered-opens-nothing` fail; `focus-escapes-trap` and `escape-does-not-close` fail with their focus / dismiss rule. The output names every case and its rule; exit 0 only when every case behaves as stated. | P1 | AC1 |
| R7 [C11] | **Scripts** in `package.json`: `check:rendered-state-census`, `check:rendered-state-census:verify`, `check:rendered-state-census:discover`. | P2 | AC5 |
| R8 [D1] | **Unit tests** `scripts/__tests__/rendered-state-census.test.ts` for the registry validator: a valid registry passes; a duplicate id, an unknown key, an out-of-scope title, an empty `dismiss` without `reason`, `portals: 0` each fail with its message. | P2 | AC5 |
| R9 [C4; C5; D1] | **First full run and owners**: the full registry on the final build; every violation listed by Story × state × root × rule with its owner — 859 §31 (its sheet-header, dialog-title and combobox-option requirements), 921, 922, or "new — Opus to file". The run is expected to exit 1; the report is the deliverable, never a reason to weaken a rule. | P1 | AC4 |

## Acceptance criteria

- **AC1 [R6; C20; D1].** `npm run check:rendered-state-census:verify` exit 0; the transcript lists `clean` PASS and each of the eight planted cases FAIL with the rule named in R6.
- **AC2 [R1; R2; C17].** `npm run check:rendered-state-census:discover` on the final build: 0 Stories with an unregistered mount portal, 0 overlay-importing in-scope Stories without a row; the registry validator accepts the saved registry; the registry row count and the per-family counts are in the report.
- **AC3 [R3; R4; R5; C18].** The full run on the final build writes one JSONL row per Story × state × root × locale × viewport (row count = the product the summary prints), every row carries every R4 rule key, 0 jobs fail to open.
- **AC4 [R4; R9; C4; C5].** In the first full run, `patterns-mantine-ticketdetaildialogview--support` at 320 / 390 reports a violation on its portal root, `patterns-mantine-userpickerfieldview--results` at 320 reports `word-split` and `viewport-overflow` on its portal root while its app root passes, `patterns-mantine-listingpreviewdialogview--active` at 320 reports `text-clamp` on its portal root; every violation is listed with an owner.
- **AC5 [R7; R8; C11].** The three scripts exist; vitest twice green (the new test file included); `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity`, `check:mojibake` exit 0.

## 6. Flows

**Positive:** build Storybook → `--discover` (empty) → full run → JSONL + summary → `--verify-gate` green.

| Branch | Applicable? | Expected behaviour | Evidence |
|---|---:|---|---|
| A click selector matches nothing | Yes | the job fails `open-failed` with the selector | AC3 / R6 |
| A state opens more or fewer portals than declared | Yes | the job fails `portal-count` | R6 `registered-opens-nothing` |
| A Story errors on render | Yes | the job fails `error-screen` | AC3 |
| No `storybook-static` | Yes | exit 1 with "build Storybook first" | transcript |
| Validation / authorization / network / concurrent writer | No | tooling on a static build | — |

## 7. QA profile and verification

**Q4.** In order, each after the last write (`r1-60-hashes-end.txt`): `npm run build-storybook`;
`check:rendered-state-census:discover`; `check:rendered-state-census -- --out docs/sessions/evidence/task923/full`;
`check:rendered-state-census:verify`; vitest twice; `typecheck`; `lint`; `build`; `check:file-integrity`;
`check:mojibake`; `git status --porcelain` before and after. Each transcript ends with `EXIT_CODE=`. Platform line
(`win32`, Node version) first. Runtime of the full run is recorded (CI job budget).

## 8. Completion report

Session log with: I0 hashes; the registry summary; R1–R9 → evidence; AC1–AC5 with transcripts; the first-run
violation table with owners; deviations; a `Files Changed` table. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR
REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No Git. A Story that cannot be opened without editing it, or a rule
that cannot be measured as written, is a stop and report, not a local reinterpretation.

## 9. Opus at review closure (not the executor)

Add to `.github/workflows/governance-pr.yml`, in the job that builds Storybook (C9): `check:rendered-state-census:verify`
blocking at once; `check:rendered-state-census` blocking the day the full run is green (until then the first-run
violations are owned tasks, and the contract's per-task rule applies). Add the gate to `docs/storybook-governance.md`
and `docs/rules/golden/enforcement-status.md`.

## 10. Revision 1 — review 1, 2026-10-10 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-1/` (native Windows, Node v22.22.3). The self-test and AC4
reproduce (C33, C34). The gate still passes four kinds of violation, which R4 and the contract require it to catch.

**Findings.**

1. **P1, R4 viewport-overflow.** The page's own horizontal scroll is never measured, and the target root's own box
   is skipped. A page scrollable to 616px at 390 passes (C24).
2. **P1, R4 component-overflow, deviation D5.** The exemptions have no bound. Any negative margin exempts its side
   whatever the overflow (C21), and any child of a table box is skipped (C22). A 140px planted overflow passes (C23).
   Without a bound, an exemption works as an allowlist written into the metric.
3. **P1, R3, deviation D2.** `widths` bounds come from the five probe widths, not from the component's switch, and
   the runner skips a state outside them without checking anything (C25). 41 of 41 sampled `min: 1440` states open
   at 1024 (C26, C27), so a task run at 768 or 1024 would never measure them.
4. **P1, R2, deviation D3.** Discovery only click-checks Stories that have no row at all (C30), and stops after 12
   candidates (C32). A registered Story has row triggers that open an unregistered portal (C31). Registry
   completeness is therefore unproven, and the generator that produced it is not in the repository.
5. **P2, R5, deviation D4.** A "not applicable" dismissal or focus check leaves no trace in its row (C29), so the
   evidence cannot be audited.

**Opus rulings on the deviations.** D1 (ordering): recorded; in this revision the GR-7 receipt and ledger come
before the first write. D2 (`widths`): kept, but bounded by R12. D3: replaced by R14. D4: accepted as Mantine's
native behaviour (a `Modal` / `Drawer` traps focus, and the app behind it is inert), on condition of R13. D5:
accepted only within R11. D6 (structural selectors): accepted; a broken selector fails `open-failed`. D7 (CI scope):
Opus decides at closure (§9). D8: matches R3.

**Write set.** As §4, plus the new fixtures under `scripts/__fixtures__/rendered-state-census/` and the evidence
directory `docs/sessions/evidence/task923/r2-*`. Out of scope: as §4. The review probes and fixtures in
`review-1/` are diagnosis only and stay unchanged.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R10 [C24; D1] | **viewport-overflow measures the page.** In every job, the app row fails `viewport-overflow` when `document.documentElement.scrollWidth > clientWidth + 0.5` after the open action, and names the deepest element that causes it. The target root's own box is measured like its descendants. The off-canvas exemption covers only a closed `position: fixed` panel. An in-flow transformed element past the edge fails (it scrolls the page). | P1 | AC6 |
| R11 [C21; C22; C23; D1] | **Every component-overflow exemption has a bound and a proof.** A negative margin exempts at most its own size: an overflow larger than the margin's absolute size plus 0.5px fails. A table-box parent is not exempt: a non-text child past the padding box of a cell in a `table-layout: fixed` table fails. Every remaining exemption from deviation D5 (clipped-away slide, `text-hidden` inner box, off-canvas, hidden-away, stacked dialog) gets a pair of self-test fixtures: the benign layout passes, and the same shape with a real violation fails. | P1 | AC6 |
| R12 [C25; C26; C27; C28] | **`widths` is a real switch and is checked.** Each `min` is a theme breakpoint in px and each `max` is a theme breakpoint minus 1 (`theme.ts` `breakpoints`, C28); the validator receives the breakpoint list and rejects any other value. In the full run, each `widths` state is also measured at its in-range bound (`min`, or `max`). At the first out-of-range width (`min − 1`, `max + 1`), and at every requested width outside the range, the runner fails `widths-mismatch` if a visible app-root element with the trigger's role and accessible name opens a portal, unless another row of the same Story covers that width. The trigger's role and name are captured at an in-range width. `widths-mismatch` becomes a rule key of every row. | P1 | AC7 |
| R13 [C29; D1] | **Not-applicable is evidence.** Every row carries `notApplicable: { <rule>: "<reason>" }` for each D4 skip: close-control on a sheet without one, outside on a full-bleed overlay, focus return to a trigger that cannot take focus, focus mode overridden to `trap` by a modal presentation, and app actions not measured behind a modal. The summary prints the n/a count per rule, and lists every Story × state × width where neither `close-control` nor `outside` applies (no pointer dismissal). That list is a report for Opus, not a new violation rule. | P2 | AC8 |
| R14 [C30; C31; C32; D1] | **Discovery proves completeness.** `--discover` clicks every candidate trigger (no cap) of every in-scope Story, registered or not, at 390, at 1440 and at each `widths` bound of the Story's rows. It lists (c) every candidate that opens a portal and is not the trigger of an in-range row of that Story at that width, and exits 1 unless (a), (b) and (c) are all empty. The executor registers rows until all three lists are empty. | P1 | AC9 |

- **AC6 [R10; R11; C23; C24].** `npm run check:rendered-state-census:verify` exits 0. Its transcript shows the nine R6 cases as stated, plus:
  - `page-scroll-only` fails `viewport-overflow` on the app root;
  - `neg-margin-overflow` fails `component-overflow` on `portal:0` while the app root is green;
  - its benign twin, a `margin: 0 -16px` full-bleed divider, passes;
  - `table-cell-overflow` fails `component-overflow`;
  - `widths-contradicted` fails `widths-mismatch`;
  - every R11 exemption pair behaves as stated.
- **AC7 [R12; C26; C27; C28].** The validator accepts the registry with the theme breakpoint list. Every `widths` bound is a breakpoint, or a breakpoint minus 1. The full run has 0 `widths-mismatch` and lists each `widths` state at its in-range bound. The 75 former `min: 1440` rows carry the switch that the R12 check confirms.
- **AC8 [R13; C29].** Every row of `full/rows.jsonl` has `notApplicable`. The summary prints the n/a counts per rule and the no-pointer-dismissal list.
- **AC9 [R14; C31; C32].** `npm run check:rendered-state-census:discover` exits 0 with (a), (b) and (c) all 0. The `admindashboardview` recent-listing triggers of C31 and the `adminuserprofileview--create` input of the same probe file have rows, and the report gives the row count, per-family counts and runtime.
- **AC10 [R10; R11; R12; R13; R14; C34].** The full run is repeated on the final build; AC3 and AC4 still hold. A new owner table is written, with the same counts in the session log and in its evidence file. Vitest passes twice. `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity` and `check:mojibake` exit 0.

**Verification order:** as §7, with evidence prefix `r2-`. The session log gets a `# Revision 1` section: R10–R14 →
evidence, AC6–AC10 with transcripts, the new owner table, and deviations. Strongest status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`.

## 11. Revision 2 — review 2, 2026-10-14 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-2/` (native Windows, Node v22.22.3). Verified: R10–R14 are in
the code; the self-test reproduces with 30 cases (C55); every full-run row carries all 20 rule keys and
`notApplicable` (C56); AC4 holds (C57); the end hashes match the files. The executor reported `PARTIALLY
IMPLEMENTED` correctly: AC3 and AC7 are not 0.

**Findings.**

1. **P1, R4 / R11.** `component-overflow` skips every absolutely positioned, fixed or transformed element (C35). This
   exemption was never declared in D5 and has no bound. Text planted 22px past a dialog's box inside a portal is green,
   whether it is positioned (C36) or transformed (C37, C38). This is the same defect class as review 1 finding 2: an
   exemption with no bound works as an allowlist written into the metric.
2. **P1, R3, gate determinism.** An open click gets one 4 s attempt (C39). The final run has two open failures at 639
   that do not reproduce in isolation (C40, C41), and a whole first run was lost to a network suspension (C42). A
   blocking CI gate that fails on a transient is not usable, and "run it again" is not a rule.
3. **Ruling, not an executor defect: the 640 cells are a product off-by-one.** The canonical owners switch to compact
   with an inclusive `max-width` of the 40em gate (C43–C46). At exactly 640 that query still matches, while the
   contract requires compact only below 640 (C48). The AppShell owner already uses the exclusive form (C47). The
   registry keeps the contract ranges. A tolerance in R12 would be an allowlist, which the contract forbids, so D14 is
   upheld. The cells (C49, `r2-85-width-640-findings.txt` lines 3–6 and 9–11) are owned by new task **924**.
4. **Ruling: the error screen** of `dashboardperiodcontrol--custom-range-too-long` (C53) is a Story whose play
   function throws (C54). It predates 923 and is owned by new task **925**.
5. **P3, R14.** Discovery skips a candidate it cannot click without recording it (C50). 148 of 4 236 candidates are
   not operable (C51). 147 are under an overlay their Story opens on mount, and one is in a Story with no mount row
   (C52). The completeness claim holds, but the evidence cannot show it.

**Opus rulings on the deviations.** D9, discovery (b): accepted. The 26 Stories were all clicked through and none
opens a portal (C59), and a hover over non-candidate elements opened nothing in the sample (C58). D10 (bisect
overrides), D11 (stricter bounds), D12 (sibling = the sibling's own trigger) and D13 (bound cells only in a full run):
accepted. D14: upheld, owned by 924. D15: replaced by R16. D7 (CI scope, worker count): decided at closure (§9). Until
the full run is green, CI adds only `check:rendered-state-census:verify` as blocking (the contract's rule), so neither
the runtime nor the worker count blocks this revision. The executor's backlog cell said `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW` while its log said `PARTIALLY IMPLEMENTED`; Opus corrected the cell.

**Write set.** As §10. New fixtures go under `scripts/__fixtures__/rendered-state-census/`; the review fixtures in
`review-2/fixtures/` may serve as their basis. Evidence prefix `r3-`; the first-pass directory `r3-sample6/` is left
untouched. `review-1/` and `review-2/` are diagnosis only and stay unchanged. Out of scope: as §4, and the product
fixes of 924 and 925.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R15 [C35; C36; C37; C38; D1] | **`component-overflow` measures positioned and transformed content.** An absolutely positioned, fixed or transformed element that holds content is no longer skipped. Its bound is its nearest ancestor inside the target that either clips its overflow (`overflow` other than `visible`) or is an overlay panel (`[role=dialog]`, `[role=listbox]`, `[role=menu]`, `[role=tooltip]`, `.mantine-Modal-content`, `.mantine-Drawer-content`, `.mantine-Popover-dropdown`, `.mantine-Combobox-dropdown`, `.mantine-Menu-dropdown`, `.mantine-Tooltip-tooltip`). It fails when its box extends past that ancestor's padding box by more than 0.5px. An element with no such ancestor (the panel itself, or the full-viewport wrapper that holds the panel) is left to `viewport-overflow`. Self-test pairs: `abs-past-panel` fails `component-overflow` on `portal:0` with the app root green, and its twin `abs-badge-inside` (a badge offset over its avatar's edge, inside the panel) passes; `transform-past-panel` fails the same way, and its twin `transform-inside` passes. The mutation proof gains both new bounds. | P1 | AC11 |
| R16 [C39; C40; C41; C42] | **One recorded retry for a transient.** A job is run once more, on a fresh page, when its load fails with a navigation error (`net::ERR_*`, `navigation failed`) or its open action times out. The row then carries `retry: "<first failure>"`; rows without a retry carry no `retry` key. The summary prints the retry count and lists each retried Story × state × locale × width. A second failure is the violation, as before. No measured rule is retried, and a retry never clears a violation of a measured rule. Self-test: `open-flaky-once` (its trigger is absent on the first load and present on the next one; the executor chooses the mechanism, and the self-test resets it) passes with `retry` recorded; `open-never` (its selector matches nothing) still fails `open-failed`. | P1 | AC12 |
| R17 [C50; C51; C52] | **Discovery records what it cannot operate.** For each Story × width, `--discover` counts the candidates found, clicked and not operable, with Playwright's reason. The report prints the three totals and lists every non-operable candidate, marking those in a Story with no `mount` row at that width. The list is informational, not a fourth failing list; `discover.json` holds it. | P3 | AC13 |
| R18 [C43; C44; C45; C46; C48; C49; C53; C54] | **Product findings have owners.** The owner table and its evidence file map every 640 cell of `r2-85-width-640-findings.txt` lines 3–6 and 9–11 to **924**, and the `custom-range-too-long` error screen to **925**. The registry keeps the contract ranges (`max: 639` / `min: 640`); no tolerance, no width override. | P2 | AC14 |

- **AC11 [R15; C36; C37].** `npm run check:rendered-state-census:verify` exits 0 with every Revision 1 case as stated,
  plus `abs-past-panel` FAIL and `transform-past-panel` FAIL, each on `component-overflow` at `portal:0` with the app
  root green, and their twins `abs-badge-inside` PASS and `transform-inside` PASS. The mutation proof shows the two new
  bounds load-bearing, so 9 of 9 are proved.
- **AC12 [R16; C39; C40].** The same transcript shows `open-flaky-once` PASS with `retry` recorded and `open-never`
  FAIL with `open-failed`. The full run's `summary.txt` prints the retry count and its list.
- **AC13 [R17; C51].** `npm run check:rendered-state-census:discover` exits 0 with (a), (b) and (c) all 0. It prints
  the found / clicked / not-operable totals and the not-operable list.
- **AC14 [R15; R16; R18; C49; C53; C56; C57].** The full run is repeated on the final build. Every row carries all 20
  rule keys and `notApplicable`. AC4 still holds. Every `open-failed`, `portal-count` and `widths-mismatch` cell is at
  640, on a state of `r2-85-width-640-findings.txt` lines 3–6 or 9–11 (924). Every `error-screen` cell is
  `custom-range-too-long` (925). There are 0 such cells anywhere else, in particular at 639. This replaces the literal
  "0" of AC3 and AC7 until 924 and 925 land. A new owner table names 924 and 925 and reports the `component-overflow`
  change against Revision 1 per component, with the same counts in the session log and its evidence file.
- **AC15 [R15; R16; R17].** Vitest passes twice (the new file and the whole suite). `typecheck`, `lint`, `build`,
  `build-storybook`, `check:file-integrity` and `check:mojibake` exit 0. `git status --porcelain` is captured before
  and after.

**Verification order:** as §7, with evidence prefix `r3-`. The session log gets a `# Revision 2` section: R15–R18 →
evidence, AC11–AC15 with transcripts, the new owner table, and deviations. Strongest status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`.

## 12. Revision 3 — review 3, 2026-10-14 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-3/` (native Windows, Node v22.22.3). Verified: R15–R18 are in
the code. The self-test reproduces with 38 cases (C74), and the mutation proof is 9 of 9 (C75). Every full-run row
carries all 20 rule keys and `notApplicable` (C76). AC4 holds. Every retried job is a 640 cell owned by 924 (C77).
Discovery prints its totals and the not-operable list (C79). The executor reported `PARTIALLY IMPLEMENTED` correctly.
Both open points come from the Revision 2 text, not from the executor.

**Findings.**

1. **P1, R15 (kickoff defect).** The positioned path has no clipped-away bound (C60), unlike the in-flow path (C61).
   Two classes of by-design content therefore fail `component-overflow`:
   - 504 details: gallery and lightbox slides translated wholly outside their frame, holding only media (C62, C63);
   - 268 details: the hover-zoomed card image layer, which covers its clipping frame on both axes (C64, C65, C66).

   A gate that fails on them can never turn green, and these details would be filed as defects against 9 components.
   Two other classes are real defects and stay failing:
   - the Leaflet popup is wider than the map, and its close control is clipped away (C67, C68);
   - the dashboard chart extends past its card (C69).
2. **P2, R16 / AC14.** A render timeout is not in the transient class (C71, C72). One `error-screen` cell outside 925
   (C70) does not occur when that cell runs alone (C73). The gate is therefore still not deterministic under load.

**Opus rulings.** D16: R19 below adds two bounds. The Leaflet and chart classes stay under "new — Opus to file"
and are filed at closure. Executor question 2: R20 below. Executor question 3 (CI scope): §9 and §11 stand. At closure,
CI adds `check:rendered-state-census:verify` as blocking. The full run becomes blocking the day it is green. Until
then, a task runs `--stories` on its own rows (the contract's per-task rule). The 3 910 s runtime blocks nothing.
D17 (the `stacked-dialogs` fixture height), D18, D19, D20 and D21 are accepted. R17 note: a forced click on the six
non-operable `recentlyviewedgridview--populated` buttons opens no portal (`review-3/rv3-r17-probe.txt`), so no new
requirement follows.

**Write set.** As §11. Evidence prefix `r4-`. `review-3/` is diagnosis only and stays unchanged. Out of scope: as §11.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R19 [C60; C61; C62; C63; C64; C65; C66; C67; C68; C69; D1] | **Two bounded exemptions for positioned content, nothing else.** A positioned or transformed element is exempt from `component-overflow` only in one of two cases. Both cases require the R15 bound to clip (`overflow` other than `visible`). An overlay panel that does not clip is never such a bound. (a) **Clipped-away slide:** the element lies wholly outside the bound on the overflowing axis. A transformed element lies between it and the bound (the element itself included). The element holds no text, and neither it nor any descendant matches `button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])`. (b) **Media crop:** the element is an `img`, `video`, `picture` or `canvas` that holds no text. Its box covers the bound's padding box on both axes, within 0.5px. Every other positioned overflow fails as in R15, including an `svg`, a text block or a control. New self-test fixtures, each a portal dialog whose app root is green: `positioned-slide-away` (media-only slide translated wholly out of an `overflow: hidden` frame on a transformed track) PASS; `positioned-slide-away-control` (the same shape, but the slide holds a text button) FAIL `component-overflow` on `portal:0`; `media-cover-zoom` (an `inset: 0` image at `scale(1.1)` in an `overflow: hidden` frame) PASS; `media-shifted-past-frame` (an image the size of its frame, translated 30px, so it no longer covers the frame) FAIL; `text-scaled-past-frame` (a text block at `scale(1.1)` in the same frame) FAIL. The mutation proof adds four cases. Remove (a), and `positioned-slide-away` fails. Drop (a)'s no-text/no-control condition, and `positioned-slide-away-control` goes green. Remove (b), and `media-cover-zoom` fails. Drop (b)'s cover condition, and `media-shifted-past-frame` goes green. | P1 | AC16 |
| R20 [C70; C71; C72; C73] | **A render timeout is transient.** A first attempt that fails because its render does not reach `finished` / `errored` in time (C71) is retried once on a fresh page under R16, and its rows carry `retry` in the same way. A render that ends `errored`, or that shows the Storybook error display, is never retried. Unit tests: (i) a job whose first attempt fails with the render-timeout reason and whose second attempt is green ends green with `retry` recorded; (ii) a job that fails with `render errored, sb-show-errordisplay=true` is run once only and has no `retry` key; (iii) a render timeout on both attempts still fails `error-screen`. | P2 | AC17 |
| R21 [C62; C64; C67; C69; C78] | **Owner table after R19.** The new owner table lists the Leaflet popup (`listingdetailview`) and the dashboard chart (`admindashboardview`, `dashboardsemidonut`) as their own rows under "new — Opus to file", naming the class. The component-overflow change against Revision 2 is reported per component. | P2 | AC18 |

- **AC16 [R19; C62; C63; C64; C65].** `npm run check:rendered-state-census:verify` exits 0, with the 38 Revision 2 cases
  as stated plus the five R19 cases as stated. The mutation proof shows 13 of 13 proved.
- **AC17 [R20; C71; C72].** The new unit tests (i)–(iii) pass, within the new test file run twice.
- **AC18 [R19; R20; R21; C70; C76; C77].** The full run is repeated on the final build. Every row carries all 20 rule
  keys and `notApplicable`, and AC4 still holds. The AC14 cell rule holds with 0 exceptions: every `open-failed`,
  `portal-count` and `widths-mismatch` cell is a 924 cell at 640, and every `error-screen` cell is
  `custom-range-too-long` (925). A copy of `review-3/rv3-d16-classes.mjs` saved as `r4-…` with only its input path
  changed to the new `rows.jsonl` prints 0
  `gallery-track` and 0 `image-layer` details. Its `leaflet` and `chart` lines equal `rv3-d16-classes.txt` lines 2–3
  and 6–8, or each difference is explained row by row in the evidence file. The summary lists every retried job.
- **AC19 [R19; R20].** Vitest passes twice (the new file and the whole suite). `typecheck`, `lint`, `build`,
  `build-storybook`, `check:file-integrity` and `check:mojibake` exit 0. `git status --porcelain` is captured before
  and after.

**Verification order:** as §7, with evidence prefix `r4-`. The session log gets a `# Revision 3` section: R19–R21 →
evidence, AC16–AC19 with transcripts, the new owner table, and deviations. Strongest status: `IMPLEMENTED - AWAITING
ORCHESTRATOR REVIEW`.

## 13. Revision 4 — review 4, 2026-10-15 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-4/` (native Windows, Node v22.22.3). Verified on the delivered
files (hashes equal `r4-87-hashes-end.txt`): R19 and R20 are in the code as written. The self-test reproduces with 43
cases (C93), and the mutation proof is 13 of 13 (C94). Every gate-level cell is a 924 cell at 640 or the 925 cell (C95).
AC4 holds. The whole suite is green twice (C96); the executor's red first run (C97) was a load flake in two unrelated
auth smoke files. The executor was right to leave R19 unchanged, and right to report `PARTIALLY IMPLEMENTED`.
One correction to its D22: in `listingdetailpattern`, the named, tabbable slide is the one inside the frame (C80).

**Findings.** The 312 `gallery-track` details (C92) fall into three classes:

1. **P1, R19(a) (kickoff defect).** R19(a) checks the whole element, not only what lies outside the frame (C81).
   144 `listingdetailpattern` details fail for this reason alone. The track's own box is translated wholly out of the
   frame, but its visible slide is inside it. The off-screen slides are hidden from assistive technology, out of the
   tab order and textless (C80, C82). The WAI-ARIA carousel pattern accepts exactly this. What it calls "incorrectly
   hidden" is a slide that is only moved off-screen (C83).
2. **P1, product (owner 859 R58).** In 156 details, the gallery "n / N" counter lies wholly below its clipping frame
   below 640 (C84). From 640 it sits flush on the frame's top edge (C85). The cause is `bottom="xs" left="xs"` (C86).
   Mantine's inset props are size props that pass a string through (C87, C88), so neither value takes effect, and
   R58's "theme spacing" (C89) is not met. The gate is right: these details are 859's to fix.
3. **P2, product (new).** In the gallery pattern Story, loaded after another Story in the same page, the frame shows
   a hidden, untabbable slide while the named, tabbable slide is off-screen (C90). Loaded first, the Story is in sync
   (C91). That covers 12 track details. This is the carousel defect named in C83, and it must stay failing.

**Opus rulings.** D22: R22 below replaces R19(a)'s control clause. Executor question 1: R22 and R23. Executor
question 2: the Leaflet popup, the dashboard chart and the gallery desync are filed at closure. The counter goes to 859
R58, not to a new number. Executor question 3, CI scope: §9, §11 and §12 stand.

**Write set.** As §12, plus three fixtures. Evidence prefix `r5-`. `review-4/` is diagnosis only and stays unchanged.
Out of scope: as §12. That includes the gallery pattern, its Story and 859's files.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R22 [C80; C81; C82; C83; C90; D1] | **(a) judges only what lies outside the bound.** R19(a)'s clause "holds no text, and neither it nor any descendant matches …" is replaced. The new test covers the element and every descendant whose box is not wholly inside the bound's padding box (within 0.5px; zero-size boxes are ignored). None of them may have a non-whitespace text node of its own. Any of them that matches `BOUND_CONTROL` must be out of the tab order (`tabindex="-1"`, `disabled`, or inside `[inert]`) and also hidden from assistive technology (`aria-hidden="true"` on itself or an ancestor, or inside `[inert]`). A descendant wholly inside the bound is visible content, and its own paths measure it. R19(a)'s other conditions and R19(b) are unchanged. A failing detail ends with ` holds <describe(D)> "<text or aria-label>"`, naming the first descendant that breaks the rule. New self-test fixtures, each a portal dialog whose app root is green: `track-active-slide-inside` PASS. In it, a transformed track's own box is translated wholly out of an `overflow: hidden` frame. Its in-frame slide is a named, tabbable `button` holding an `img`. Its off-screen slides are `button aria-hidden="true" tabindex="-1"` holding an `img`. `track-offscreen-slide-tabbable` FAIL `component-overflow` on `portal:0`, with `holds button`. It has the same shape, but the named, tabbable slide is off-screen and the in-frame slide is hidden and untabbable (the C90 shape). `track-offscreen-slide-aria-only` FAIL `component-overflow`. It is the PASS shape, except that one off-screen slide is `aria-hidden="true"` without `tabindex="-1"`. The mutation proof adds two cases. Check the whole element again (the R19 text), and `track-active-slide-inside` fails. Accept any off-screen control, and `track-offscreen-slide-tabbable` goes green. The 13 earlier cases still hold. | P1 | AC20 |
| R23 [C84; C85; C86; C87; C88; C89; C90; C91; C92] | **Owner table after R22.** The gallery counter class (`listingdetailpattern`, `listinggallerypattern`: the "n / N" counter is clipped away below 640 and has no inset from 640) is owned by **859 R58**, not "new". The gallery desync (`listinggallerypattern`: a hidden slide in the frame while the named, tabbable slide is off-screen, depending on load order) is its own row under "new — Opus to file". The Leaflet and chart rows stay as R21. The `component-overflow` change against Revision 3 is reported per component. | P2 | AC21 |

- **AC20 [R22; C80; C90].** `npm run check:rendered-state-census:verify` exits 0. The 43 Revision 3 cases behave as
  stated, plus the three R22 cases as stated. The mutation proof shows 15 of 15 proved.
- **AC21 [R22; R23; C84; C90; C92; C95].** The full run is repeated on the final build. Every check of AC18 still
  holds, except its `gallery-track` clause, which is replaced as follows. Save a copy of `r4-70-d16-classes.mjs` as
  `r5-…`, with only its input path changed. It prints 0 `image-layer` details, and its `leaflet` and `chart` lines
  equal `rv3-d16-classes.txt` lines 2–3 and 6–8. Any difference is explained row by row. Each remaining
  `gallery-track` detail is one of two kinds: (i) a y-axis `"<n> / <N>"` counter detail (859 R58), or (ii) a track
  detail whose `holds` names a tabbable, named slide `button`. The evidence file counts (i) and (ii) by Story, and
  prints 0 track details of any other kind. The summary lists every retried job.
- **AC22 [R22].** The new test file passes twice. The whole suite has two consecutive green runs. Any red run is kept
  and reported with its failing files. `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity` and
  `check:mojibake` exit 0. `git status --porcelain` is captured before and after.

**Verification order:** as §7, with evidence prefix `r5-`. The session log gets a `# Revision 4` section with R22–R23
mapped to evidence, AC20–AC22 with transcripts, the new owner table, and deviations. Strongest status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 14. Revision 5 — review 5, 2026-10-15 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-5/` (native Windows, Node v22.22.3). Verified on the delivered
files (56 of 56 hashes equal `r5-87-hashes-end.txt`): R22 is in the code as written (C98). The self-test reproduces with
46 cases (C99), and the mutation proof is 15 of 15 (C100). The full run has one row per cell and every rule key (C128).
Its gate-level cells are 924's at 640 and the 925 cell, and its gallery classes reproduce. R23's owner table is
accepted. The executor was right to leave the action rules, the mojibake script and the test timeouts alone, and right
to report `PARTIALLY IMPLEMENTED`.

**Findings.**

1. **P1, R22 (kickoff defect): the action rules.** The R22 PASS case is green only because it asserts one rule, through
   the new `greenRules` key. Its portal root still fails `action-covered` (C101). Neither action rule has a bound for a
   control that is clipped away, hidden from assistive technology and out of the tab order (C102, C103). The gallery's
   off-screen slides are exactly that (C104). A correct carousel can therefore never be green.
2. **P1 (kickoff defect): the in-flow track.** The gallery's slides are in-flow children of the transformed track
   (C105). On that shape, the visible slide, inside the frame, fails `component-overflow` against its displaced track
   box (C106, C107). The in-flow clipped-away exemption covers only slides wholly outside the frame (C108). This is the
   executor's D27.
3. **P1: the verdict is not deterministic.** Two full runs disagree in 69 rows (C109). Narrowed runs with no other load
   disagree too (C110, C117). Three causes:
   - (a) The trap loop reads the focus at once after each key press (C111). At the fourth Tab, the AuthSheet focus is
     briefly on `body` (C112); after a pause it is in the sheet (C113). The gate reports a leak that no keyboard user
     meets.
   - (b) `waitStable` counts infinite animations (C114). A Story with a loader never settles, so the gate always waits
     out the 4 s bound. A notification that closes itself is then measured while it leaves (C115, C116, C117).
   - (c) The AdminShell drawer opened on mount sometimes keeps the focus on the app's menu button (C118). That outcome
     is stable (C119). This is a product race, not a measuring one, and the gate is right to report it.
4. **P2, tooling: `check:mojibake` crashes before it scans** (C124, C125). CI runs it (C126). The crash reaches CI when
   the tracked listing passes 1 MiB. 923's code does not cause it; 923's evidence is what tips this checkout over.
5. **P3, AC22 whole suite.** It is red twice at review 5 too (C120, C121). The failing files pass alone (C122), and none
   of them is in 923's write set. Q4 asks for the Q1 targeted tests plus a regression baseline (C123). AC22's two
   consecutive green whole-suite runs asked more than the profile, and the suite's load timeouts are not 923's to fix.
6. **Note, D28.** Printed details are capped (C127), so a class count over a capped row is incomplete. AC24 closes this
   for the gallery rows.

**Opus rulings.** D26 → R24, and `greenRules` is removed. D27 → R25. D29 is accepted. D30 → AC28. D31 → R27. D32 → R26;
the chart difference is checked again in AC26. Executor question 4 (CI scope): §9, §11 and §12 stand. Filed at closure
under new numbers: the Leaflet popup, the dashboard chart, the gallery desync, the AdminShell drawer's initial-focus race
(C118), and the whole-suite smoke-test timeouts (C120–C122).

**Write set.** As §13, plus six fixtures and `scripts/check-mojibake.mjs` (R27 only). `runner.mjs` is already in
scope (§4). Evidence prefix `r6-`. `review-5/` is diagnosis only and stays unchanged. Out of scope: as §13, plus the
AdminShell, AuthSheet and ListingContactPattern sources and Stories.

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R24 [C101; C102; C103; C104; C106; D1] | **An action rule skips a clipped-away, hidden, untabbable control, and nothing else.** `action-hidden`, `action-covered` and `target-small` skip an action only when both of these hold. (i) It is out of the tab order and hidden from assistive technology (R22's `outOfTabOrder` and `hiddenFromAT`). (ii) Inside the target there is an ancestor whose computed `overflow-x` or `overflow-y` is not `visible`, and the action's box lies wholly outside that ancestor's padding box on one axis (within 0.5px). The `greenRules` case key is removed from `verify.mjs`, so every PASS case asserts every rule of every root. `track-active-slide-inside` is PASS on every rule of every root. `track-offscreen-slide-aria-only` is FAIL `component-overflow` **and** `action-covered` on `portal:0`. New fixture `visible-hidden-control-covered` is a portal dialog with a green app root. In an `overflow: hidden` frame, a `button aria-hidden="true" tabindex="-1"` lies wholly inside the frame, and an absolutely positioned sibling covers its centre. It is FAIL `action-covered` on `portal:0`. Two mutations: drop (ii), and `visible-hidden-control-covered` goes green on `action-covered`; drop (i), and `track-offscreen-slide-aria-only` goes green on `action-covered`. | P1 | AC23, AC24 |
| R25 [C105; C106; C107; C108; D1] | **An in-flow slide of a transformed track is judged against the frame.** In the in-flow path, an element whose parent has a computed `transform` other than `none` is not measured against that parent when its box lies wholly inside the padding box of its nearest clipping ancestor (`nearestClipper`), within 0.5px on both axes. Everything else is unchanged: an element wholly outside keeps the R11 clipped-away rule, and every other in-flow element is measured against its parent. New fixtures, each a portal dialog with a green app root: `track-flex-synced` PASS on every rule of every root. It has the shape of `review-5/fixtures/rv5-flex-track-synced.html`: a `display: flex` track at `translateX(-120px)` in a 120×80 `overflow: hidden` frame, holding three `flex: 0 0 120px` slide buttons, each with an `img`; the middle one is named and tabbable, the other two are `aria-hidden="true" tabindex="-1"`. `track-flex-slide-straddles` FAIL `component-overflow` on `portal:0`: the same, with the track at `translateX(-60px)`, so the named slide lies half outside the frame. `inflow-past-untransformed-parent` FAIL `component-overflow` on `portal:0`: a 200px text block in a 120px parent without a transform, inside a 300px `overflow: hidden` box. Two mutations: drop "wholly inside the clipper", and `track-flex-slide-straddles` goes green; drop "parent transformed", and `inflow-past-untransformed-parent` goes green. | P1 | AC23, AC24 |
| R26 [C109; C110; C111; C112; C113; C114; C115; C116; C117; C118; C119; D1] | **Measure the settled state.** (a) `waitStable` counts only running animations whose effect timing has a finite `iterations`; an infinite animation (a loader) never holds it. (b) Every focus read waits for the focus to settle: after each Tab / Shift+Tab press of the trap loop, after open (`focus-open`, `focus-trigger`) and after a dismissal (focus return). The focus is polled every 50ms until the same element is active on 3 consecutive polls, bounded at 1 000ms, and the settled element (at the bound, the last read) is judged. (c) Nothing else changes: no retry is added, and the 1s dismissal bound stays. New fixtures: `infinite-spinner-toast` PASS on every root. Its app root holds an infinite CSS animation; a click opens a non-modal toast portal (`focus: trigger`, `dismiss: ["close-control"]`) that closes itself 2 500ms after it opens. `trap-transient-body-focus` PASS. It is a modal dialog whose second button, the first time it takes focus, is removed and inserted again 80ms later and focused, so the focus is on `body` for 80ms. `focus-escapes-trap` stays FAIL. Two mutations: count infinite animations again, and `infinite-spinner-toast` fails; read the focus at once, and `trap-transient-body-focus` fails `focus-trap`. The AdminShell drawer's race (C118) is a product defect and stays reported; R26 must not hide it. | P1 | AC23, AC25, AC26 |
| R27 [C124; C125; C126] | **`check-mojibake.mjs` lists any repository size.** Its one `spawnSync` call gets `maxBuffer: 64 * 1024 * 1024`. Its failure message names `r.error?.code`, so an `ENOBUFS` is named and never shows as an empty stderr. Nothing else in the file changes. | P2 | AC27 |

- **AC23 [R24; R25; R26; C101].** `npm run check:rendered-state-census:verify` exits 0 with 52 cases: the 46 of Revision 4
  plus `visible-hidden-control-covered`, `track-flex-synced`, `track-flex-slide-straddles`,
  `inflow-past-untransformed-parent`, `infinite-spinner-toast` and `trap-transient-body-focus`, each as stated in R24–R26.
  `track-active-slide-inside` and `track-flex-synced` are green on every rule of every root. A search for `greenRules`
  under `scripts/rendered-state-census/` finds nothing. The mutation proof (`r6-50-…`, a copy of `r5-50-…` with the six
  new mutations) shows 21 of 21 proved.
- **AC24 [R24; R25; C104; C105; C127].** Run `--stories patterns-mantine-listingdetailpattern--default,patterns-mantine-listinggallerypattern--default`
  at the default widths and locales on the final build. A copy of `r5-71-gallery-classes.mjs` saved as `r6-71-…`, with
  only its input path changed, prints 0 in-flow slide details. Every `component-overflow` detail is (i) a counter
  (859 R58) or (ii) a desync track detail, and 0 are of any other kind. The script also prints the number of these rows
  whose `component-overflow` list has a tail; it must be 0. The per-width counts of `action-hidden`, `action-covered`
  and `target-small` in these rows are printed next to `r5-full`'s, and every remaining detail has an owner in the
  owner table.
- **AC25 [R26; C110; C117; C118].** Run the two narrowed configurations of review 5 three times each on the final build:
  (1) as `review-5/rv5-40-authsheet-1.txt` (4 AuthSheet Stories; widths 320, 390, 640, 1440; locales en, uk;
  `--no-closed`); (2) as `review-5/rv5-43-misc-1.txt` (`adminshell--drawer-open`, `listingcontactpattern--default`;
  widths 320, 390, 639, 640, 1440; all four locales; `--no-closed`). A comparison, per row, of the failing-rule set
  across the three runs prints every difference. The only difference allowed is `focus-open` on
  `patterns-mantine-adminshell--drawer-open` rows (C118). A copy of `review-5/rv5-46-toast-probe.mjs` saved as `r6-…`
  shows `waitStable` returning in under 4 000ms. Any other difference stops the task as `BLOCKED`, with a sampling probe
  of that cell like `rv5-45` / `rv5-46`. It is not a reason for another code change.
- **AC26 [R9; R24; R25; R26; C109; C128].** The full run is repeated on the final build. One row per cell; every row has
  all 20 rule keys and `notApplicable`; AC4 holds; every gate-level cell is a 924 cell at 640 or the 925 cell. A copy of
  `r5-70-d16-classes.mjs` saved as `r6-…`, with only its input path changed, prints 0 `image-layer` details, and its
  `leaflet` lines equal `rv3-d16-classes.txt` lines 6–8. Its `chart` lines equal lines 2–3, or each difference is
  explained row by row. A row diff against `r5-full` prints the changes per rule and component, and attributes each one
  to R24, R25, R26 (a) or R26 (b) by its detail, or lists it. The summary lists every retried job and the runtime. The
  owner table is R23's, plus "new — Opus to file: AdminShell drawer initial-focus race". The in-flow slide row is gone.
- **AC27 [R27; C124; C125].** On this checkout, the unmodified command `npm run check:mojibake` exits 0, and the
  transcript prints the listing's byte count, which is over 1 048 576. A planted untracked file
  `docs/sessions/evidence/task923/r6-planted-mojibake.md` holding the mojibake form of an en dash (U+00E2 U+20AC U+201C,
  written by a script, never typed into a tracked document) makes it exit 1 and name that file. After the file
  is deleted, it exits 0 again. Each of the three transcripts ends with `EXIT_CODE=`.
- **AC28 [R24; R25; R26; R27; C120; C121; C122; C123].** The new test file passes twice. `npm test` (the whole suite) is
  run once and kept. If it is red, the evidence lists each failing file and shows that a search of its imports finds
  no write-set path (`rendered-state-census`, `check-mojibake`), and a run of those files alone is green. `typecheck`,
  `lint`, `build`, `build-storybook` and `check:file-integrity` exit 0. `git status --porcelain` is captured before
  and after.

**Verification order:** as §7, with evidence prefix `r6-`, and `check:mojibake` as AC27. The session log gets a
`# Revision 5` section with R24–R27 mapped to evidence, AC23–AC28 with transcripts, the owner table and deviations.
Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 15. Revision 6 — review 6, 2026-10-15 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-6/` (native Windows, Node v22.22.3; record `rv6-00-review.md`).
Verified on the delivered files (62 of 62 hashes equal `r6-87-hashes-end.txt`): R24–R27 are in the code as written. The
self-test reproduces with 52 cases (C129), the mutation proof is 21 of 21 (C130), AC25 reproduces (C131), and AC27
reproduces on a listing over 1 MiB (C145). Every AC23–AC28 holds as written, and the executor's status was right.
D33, D35, D37 and D38 are accepted; D34 and D36 are answered by the findings below. The code of R24–R27 stays.

**Owner decision D2 (2026-10-15).** Revision 6 keeps the full run, and this section is written so that the executor
can finish it without being stopped by the kickoff and finds every defect. Revision 6 therefore removes **every** known
source of a verdict that changes between identical runs in one revision, and proves it by two full runs that agree.

### 15.1 Findings — why the verdict still moves

1. **P1 (§14 R26 (c)): dismissal is judged on speed.** Rows change verdict on `dismiss-outside` alone, in both
   directions (C132). Run alone, the same Stories show no dismissal violation (C133). The overlay always closes: in about
   310ms at CPU 1x (C134), over a second at 8x (C135). The 1 000ms bound (C136) under 10 workers (C137) judges the
   machine's load. Such a verdict can never be the blocking whole-registry step (C138).
2. **P1 (new, §3 `waitStable`): the gate measures a page that is still loading.** Every dashboard chart arrives through
   a lazy, browser-only import (C149). `waitStable` looks only at the portal count and the finite animations (C150), and
   the open action runs as soon as the load ends (C154). With the chart chunk on time, the gate measures the chart's
   three overflow details (C151). With the chunk 2 000ms late — what 10 workers on one local server do — `waitStable`
   returns first, the chart is not there yet, and the page grows from 756 to 1 145 elements after the measurement
   (C152). This is the cause of the chart rows that lose their detail between runs (C153, the executor's D34); page
   reuse and storage are ruled out (C157).
3. **P2 (§11 R16): a retry merges a different page into the row.** A retry copies the first attempt's violations and
   roots into the result (C139, C146). The first attempt never reached the state: its open failed (C140), so its app
   root was measured on the closed, non-inert page (C141). 16 rows of the Revision 4 full run say "not measured" and
   carry violations at once (C142). The unit test pins that behaviour (C148). This is the executor's D36 (ii).
4. **P3: the R24 skip count is written as a not-applicable reason** (C143), on rows that still have violations of the
   same rule (C144).

### 15.2 Write set and out of scope

Write set: `scripts/rendered-state-census/runner.mjs`, `scripts/rendered-state-census/in-page.mjs`,
`scripts/rendered-state-census/verify.mjs`, six new fixtures under `scripts/__fixtures__/rendered-state-census/`
(`slow-close`, `open-flaky-once-closed-violation`, `late-fetch-overflow`, `late-fetch-inside`, `raf-grow-overflow`,
`raf-grow-inside`), and in `scripts/__tests__/rendered-state-census.test.ts` only the test of C148 (R29). Evidence prefix
`r7-`; `review-6/` is diagnosis only and stays unchanged. Out of scope and unchanged: `check-mojibake.mjs`, the registry
`scripts/rendered-interaction-states.json`, `scripts/check-rendered-state-census.mjs`, `discover.mjs`, `registry.mjs`,
`theme-breakpoints.mjs`, `package.json`, CI, policy, `.claude/**`, every product source and Story. A product defect the
gate finds is reported in the owner table, never fixed here.

### 15.3 Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R28 [C132; C133; C134; C135; C136; C137; C138; D1; D2] | **A dismissal is judged on whether the overlay closes, not how fast.** After the dismissal action, `dismissCheck` polls the visible portal count every 50ms until it is 0, bounded at **5 000ms** (was 1 000ms). A failure reads `<rule>: the portal is still visible 5000ms after the dismissal`. Every row carries `dismissMs`: an object from each dismissal mechanism that ran on that row to its measured close time in ms, or `null` when the overlay did not close (`{}` on a row where none ran). Nothing else changes: the focus return still uses `settleFocus`, and no retry is added. New fixture `slow-close`, a portal dialog with a green app root (`focus: trap`, `dismiss: ["escape", "close-control", "outside"]`): each mechanism closes it 1 500ms after the event, and the portal stays visible until then. It is PASS on every rule of every root, and its `dismissMs` is at least 1 500 for each of the three mechanisms. `escape-does-not-close` stays FAIL `dismiss-escape`, with the 5 000ms detail. Mutation: the bound back to 1 000ms, and `slow-close` fails `dismiss-escape`. | P1 | AC29, AC30, AC32 |
| R29 [C139; C140; C141; C146; C147; C148] | **A retry replaces the first attempt.** When `runWithRetry` retries a job, the job's rows are the second attempt's rows only: no rule and no root of the first attempt is copied in (the merges of C139 and C146 are removed). Every row still records `retry` with the first failure, and a second failure is still the violation. R16's sentence "a retry never clears a violation of a measured rule" is replaced by **"a job is retried only for a load or open failure, never because a measured rule failed"**; `transientReason` is unchanged. The unit test of C148 is rewritten to the new rule: a first attempt with `open-failed` and `text-clamp`, then a clean second attempt, ends with no `text-clamp`, `pass: true`, and `retry` recorded. New fixture `open-flaky-once-closed-violation`: like `open-flaky-once` (the trigger is absent on the first load only), and the app root also holds a visible 20×20 button; the state is a modal dialog, so while it is open the app root's actions are not measured. It is PASS on every rule of every root, `retry` is recorded on every row, and the app row has no `target-small` detail. Mutation: the first-attempt merge put back, and the case fails `target-small` on `app`. | P2 | AC29, AC32 |
| R30 [C143; C144] | **The R24 skip count is its own key.** Every row carries `skippedActions`, a number (0 when nothing was skipped). `markSkippedActions` writes it there and no longer writes `notApplicable`. `notApplicable` keeps only the reasons why a rule was not measured on that row. In `verify.mjs`, `track-flex-synced` asserts `skippedActions` ≥ 1 on `portal:0` and no `action-*` key in that row's `notApplicable`. | P3 | AC29, AC32 |
| R31 [C149; C150; C151; C152; C153; C154; C155; C156; C157; D2] | **The gate measures a settled page.** One settle function (`waitStable`, extended) is used after the load and **before the open action** (new), after the open action (as now), when a dismissal check reopens the state (as now), and in the closed sweep (as now). The page is settled when, on **3 consecutive polls 100ms apart**, all of these hold: (a) the visible portal count is unchanged (and equals the expected count where one is given), as now; (b) no finite animation runs, as now (R26 (a)); (c) **no request from the page to the page's own origin is in flight** — counted on the Node side from the page's `request`, `requestfinished` and `requestfailed` events; a request to another origin (map tiles) is not counted; (d) **the layout signature is unchanged**: computed in `in-page.mjs` over `#storybook-root` and every visible portal root, it is the number of elements whose box is not empty plus a sum over their boxes rounded to whole pixels (left, top, width, height); an element that runs an infinite animation, and everything inside it, is left out, so a loader never holds the page. The bound is **8 000ms** (was 4 000ms). Every row records `settle: { ms, bounded }` for the settle before its measurement (`bounded: true` when the bound was hit; the page is then measured as it is). The summary prints the number of jobs that hit the bound, listed by Story × state. For the self-test, the static server delays a response by `<n>`ms when the request URL carries `__census_delay=<n>`; it still serves the file named by the path (C155). New fixtures, each a portal dialog with a green app root: `late-fetch-overflow` — on open, the dialog fetches `clean.html?__census_delay=1500`, and when the fetch ends it appends a 300px block inside a 200px `overflow: visible` box: FAIL `component-overflow` on `portal:0`. `late-fetch-inside` — the same with a 150px block: PASS on every rule of every root. `raf-grow-overflow` — on open, a block grows by `requestAnimationFrame` from 0 to 300px wide over 1 200ms inside a 200px box: FAIL `component-overflow` on `portal:0`. `raf-grow-inside` — the same, growing to 150px: PASS. `infinite-spinner-toast` (C156) stays PASS. Three mutations: drop (c), and `late-fetch-overflow` goes green; drop (d), and `raf-grow-overflow` goes green; drop the infinite-animation exclusion of (d), and `infinite-spinner-toast` fails. | P1 | AC29, AC31, AC32 |

### 15.4 Acceptance criteria

- **AC29 [R28; R29; R30; R31; C129; C130].** `npm run check:rendered-state-census:verify` exits 0 with **58 cases**: the 52
  of Revision 5 plus `slow-close`, `open-flaky-once-closed-violation`, `late-fetch-overflow`, `late-fetch-inside`,
  `raf-grow-overflow` and `raf-grow-inside`, each as stated in R28–R31. The mutation proof `r7-50-…` is a copy of
  `r6-50-…` with five new mutations (R28, R29, and the three of R31); it prints **26 of 26 proved**. How to mutate
  `runner.mjs` (R28, R29, R31 (c)): copy it into a directory made with `fs.mkdtempSync(path.join(os.tmpdir(), 'census-'))`,
  replace its relative imports `./in-page.mjs` and `./registry.mjs` by the `pathToFileURL(...).href` of the repository
  files, apply the one edit, and `import()` the copy; a mutation never writes a repository file. `in-page.mjs` is mutated
  as `r6-50-…` already does it.
- **AC30 [R28; C134; C135].** A copy of `review-6/rv6-51-dismiss-throttle-probe.mjs` saved as `r7-51-…`, with only its
  comment changed, run on `patterns-mantine-adminuserstable--default~en-english` uk 1024: 12 of 12 trials `CLOSED` with
  no detail, at 1x, 4x and 8x.
- **AC31 [R31; C151; C152].** A copy of `review-6/rv6-57-chart-chunk-delay-probe.mjs` saved as `r7-57-…`, with only its
  comment changed, run on `patterns-mantine-admindashboardview--default~en-english` uk 1024 with delays 0 and 2000:
  **8 of 8 trials print `chart details at return 3` and `layout unchanged`**.
- **AC32 [R9; R28; R29; R30; R31; C118; C132; C137; C142; C144; C153; D2].** **Two full runs** on the final build, one
  after the other, 10 workers each (`--jobs 10`), into `r7-full-a/` and `r7-full-b/`. For each run:
  - AC26's checks hold: one row per cell; every row has all 20 rule keys, `notApplicable`, `skippedActions`, `dismissMs`
    and `settle`; AC4 holds; every gate-level cell is a 924 cell at 640 or the 925 cell; 0 `image-layer` details;
  - a copy of `review-6/rv6-10-na-vs-violation.mjs` saved as `r7-10-…` prints **0 rows with a rule both not applicable
    and violated**;
  - the summary lists every retried job, every job that hit the settle bound, and the runtime.

  **Determinism, between `r7-full-a` and `r7-full-b`.** A copy of `review-6/rv6-11-verdict-flips.mjs` saved as
  `r7-11-…`, plus a per-row comparison of the failing-rule sets (a copy of `r6-61-narrowed-compare.mjs` saved as `r7-61-…`
  and changed only to take two run directories instead of three), prints every row that differs. **The only difference allowed is `focus-open` on
  `patterns-mantine-adminshell--drawer-open` rows (C118, a product race).** For every other differing row, run its
  Story × state alone three times (`--stories <story> --widths <width> --locales <locale> --no-closed`) and keep the
  output; if it still moves, sample it with a copy of `rv6-53-chart-settle-probe.mjs` (load, settle, measure, wait
  3 000ms, measure again). Record each such row in the session log with that evidence and the class you see. Do **not**
  change code outside R28–R31 for it, and do not stop: finish every other AC first, then report it (strongest status
  `PARTIALLY IMPLEMENTED`).

  **Against `r6-full`, for information.** A copy of `r6-85-row-diff.mjs` with its input paths changed prints the changes
  of `r7-full-a` per rule and component, attributed by detail to R28 (a `dismiss-*` detail "still visible 1000ms" gone),
  R29 (the `r6-full` row carries `retry`), R31 (a chart or other detail that `r6-full` lacked and `r4-full` had), or
  listed. The `chart` lines of a copy of `r5-70-d16-classes.mjs` on `r7-full-a` should be back to `rv3-d16-classes.txt`
  lines 2–3 (40 + 48); a difference is listed row by row. The owner table is Revision 5's; any dismissal violation that
  remains gets an owner row.
- **AC33 [R28; R29; R30; R31].** The new test file passes twice. `npm test` (the whole suite) is run once and kept, with
  AC28's treatment if it is red. `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity` and
  `check:mojibake` exit 0. `git status --porcelain` is captured before and after.

### 15.5 How to run it so nothing gets in the way

1. Order: I0 and hashes → R29, R30, R28, R31 with their fixtures → AC29 (self-test, then mutations) → `build-storybook`
   → AC30, AC31 → `r7-full-a` → `r7-full-b` → the AC32 scripts → AC33 → session log.
2. Run each full run with `run_in_background`. While a full run or the self-test is running, run **nothing else** that
   loads the machine or writes the same evidence (no vitest, build, second census, probe). One writer per evidence file
   (the D37 overlap must not recur).
3. Every transcript starts with the platform line and the command and ends with `EXIT_CODE=`. A census run exits 1
   because of product findings; that is expected and is not a failure of the AC.
4. A new full run takes longer than Revision 5's 10 503s because pages now settle; report both runtimes.
5. Keep the exported names and arguments of `startStaticServer`, `storybookContext`, `newMeasuringPage`, `loadStory`,
   `waitStable(page, expected, timeout)`, `openAction`, `dismissCheck` and `runStateJob`: the review-6 probes import
   them and must run unchanged against the new code (AC30, AC31). A page made by `newMeasuringPage` carries the
   request counter of R31 (c) itself, so a probe needs no extra setup.
6. If an AC is not met, keep going through the rest and report each unmet AC with its evidence. A gap in this kickoff
   is reported as a question for Opus in the session log, never solved by a change outside §15.2.

**Verification order:** as §15.5, evidence prefix `r7-`. The session log gets a `# Revision 6` section with R28–R31
mapped to evidence, AC29–AC33 with transcripts, the determinism table, the owner table and deviations. Strongest status:
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 16. Revision 7 — review 7, 2026-10-16 (`NEEDS REVISION`)

Review evidence: `docs/sessions/evidence/task923/review-7/` (native Windows, Node v22.22.3; record `rv7-00-review.md`). Verified on the
delivered files (69 of 69 hashes equal `r7-87-hashes-end.txt`, C158): R28–R31 are in the code as written; the self-test (C159) and the
mutation proof (C160) reproduce; the determinism comparison reproduces its 4 rows that AC32 does not allow (C161). AC29, AC30, AC31 and AC33
hold; AC32 does not, and the executor's status `PARTIALLY IMPLEMENTED` was right. D39, D40, D41, D44 and D45 are accepted; D42 and D43 are
answered by the findings below. The code of R28–R31 stays.

**Owner decisions D3 and D4 (2026-10-16).** A cause found by a run no longer waits for a new revision. The executor runs the registry
Story by Story, and fixes each gate defect where it finds it, under the fix contract of R33; a product race is classified and goes to the
owner table. Revision 7 therefore ends with every Story checked on the final code, not with a list of new causes for Revision 8.
**Owner decision D5 (2026-10-16), same day:** small parts, no runs that buy nothing. Only three Stories differed between the two Revision 6
full runs (C183); the other 257 agreed, so R33 runs those three only, and the one final full run is compared with `r7-full-b` — the second
run of an identical pair is no longer made. The Story pairs `r8-story/001…` already made by the first R33 loop stay as evidence; that loop
is not continued.

### 16.1 Findings — the three cells

1. **P1 (new): a same-origin stylesheet that fails is not seen, and the gate measures the broken page.** Run a's
   `admindashboardview--activity-error~about-visible-listings` uk 320 row is the row of a page without its stylesheet (C162) whose open
   opened nothing (C163). Aborting the Storybook stylesheet, or answering it 404, reproduces the row (C164, C165). The signature is in one row
   of run a and in none of run b or of the Revision 5 run (C166). `loadTarget` never checks a subresource (C167), the static server answers
   404 to every error and logs nothing (C168), and such a failure is not in the transient class (C169), so it became a set of product
   violations. Across all 260 Stories no same-origin script, stylesheet or document fails; 107 same-origin `fetch` requests (`/api/*`) answer
   404 on every load (C171), so `fetch` must stay out of the rule. This answers D43 (first cell).
2. **P2 product race, not a gate defect: the Leaflet popup.** The listing map opens its popup in the Leaflet import callback (C172) while its
   stylesheet is a cross-origin link of the same component (C173). When the chunk wins, Leaflet sizes the popup before its stylesheet applies
   and keeps 301px (C174); when the stylesheet wins, 248px (C175). The settled page never changes afterwards (C176), so no settle condition can
   see it (answers D42: no settle extension). The verdict of `listingdetailview` app rows at the widths where 248px fits and 301px does not
   follows this race (C182). It goes to the owner table.
3. **P2 product race, not a gate defect: the share tooltip.** The share button flips its tooltip label back 2 000ms after the click (C177).
   Escape before the flip closes the tooltip, which then reappears on its own (C178); Escape after it closes it for good (C179). Run a's
   Escape fell next to the flip and never saw it closed (C180); run b's came early and saw it closed (C181). It goes to the owner table
   (answers D43, second cell).

### 16.2 Write set and out of scope

Write set: `scripts/rendered-state-census/runner.mjs`, `scripts/rendered-state-census/verify.mjs`, four new fixture files under
`scripts/__fixtures__/rendered-state-census/` (`census-target.css`, `stylesheet-fails-once.html`, `stylesheet-missing.html`,
`fetch-404-benign.html`), and in `scripts/__tests__/rendered-state-census.test.ts` one new test (R32 (c)). **For the fixes of R33** the
gate write set is `runner.mjs`, `in-page.mjs`, `verify.mjs`, new or changed files under `scripts/__fixtures__/rendered-state-census/` and
new tests in `scripts/__tests__/rendered-state-census.test.ts`; nothing else. Evidence prefix `r8-`; `review-7/` is diagnosis only and stays
unchanged. Out of scope and unchanged: `check-mojibake.mjs`, the registry
`scripts/rendered-interaction-states.json`, `scripts/check-rendered-state-census.mjs`, `discover.mjs`, `registry.mjs`,
`theme-breakpoints.mjs`, `package.json`, CI, policy, `.claude/**`, every product source and Story (`Map.tsx` and `ListingShareButton.tsx`
included: their races go to the owner table, they are not fixed here).

### 16.3 Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R32 [C162; C163; C164; C165; C166; C167; C168; C169; C170; C171; D2] | **A failed same-origin document, script or stylesheet is a load failure, never a page to measure.** (a) The request tracker of R31 (c) also records, since the last main-frame navigation, every request to the page's own origin whose `resourceType()` is `document`, `script` or `stylesheet` and that fails (`requestfailed`, with `failure().errorText`) or is answered with a status of 400 or more (`response` event). No other type is recorded (`fetch` above all, C171), and no cross-origin request. (b) `loadTarget` returns `{ ok: false, reason }` when, after `document.fonts.ready`, one is recorded; `loadAndOpen` returns `{ stage: 'load', reason }` when one is recorded after its post-open settle (a chunk the open loaded). The reason is `resource failed: <type> <pathname+query> (status <n>[, <code>])` or `resource failed: <type> <pathname+query> (<errorText>)` for the first recorded one, followed by `, +<k> more` when there are more. The state, closed and range jobs all get it through `loadTarget`; `runStateJob` already writes a `load` stage as `error-screen`. (c) `transientReason` returns an `error-screen` detail that starts with `resource failed: `: the job is retried once on a fresh page (R16 / R29, C170); a second failure is the violation. (d) The static server answers 404 only when the path is outside the root or the file does not exist (`ENOENT`, `ENOTDIR`, `EISDIR`); every other error is answered 503 with the header `x-census-error: <error code>`, and the tracker writes that code into the reason (`status 503, EBUSY`). For the self-test, a request URL that carries `__census_status=<n>` with `n` from 500 to 599 is answered `n` with `x-census-error: CENSUS_STATUS` (no file is read). (e) Fixtures: `census-target.css` holds the one rule that `stylesheet-fails-once` moves out of `clean`'s `<style>`: `button { min-width: 44px; min-height: 44px; font: inherit; }`. `stylesheet-fails-once` is `clean` without that rule, so every button of its dialog is below 44px without the stylesheet; an inline script in `<head>` writes, with `document.write`, `<link rel="stylesheet" href="census-target.css?__census_status=503">` on the first load of the case and `<link rel="stylesheet" href="census-target.css">` on every later load (the case is `flaky: true`, as `open-flaky-once`): PASS on every rule of every root, `retry` recorded on every row with a `resource failed: stylesheet /census-target.css?__census_status=503 (status 503, CENSUS_STATUS)` first failure. `stylesheet-missing` is `clean` plus `<link rel="stylesheet" href="census-missing.css">` (no such file): FAIL `error-screen` on `app` with the detail `/^resource failed: stylesheet \/census-missing\.css \(status 404\)/`, `retry` recorded. `fetch-404-benign` is `clean` plus a script that fetches `census-missing-api.json` on load: PASS on every rule of every root, no `retry` key. (f) Three mutations of `runner.mjs`, applied as AC29 says (a temporary copy, never the repository file): drop (b), and `stylesheet-fails-once` fails `target-small` on `portal:0`; drop (c), and `stylesheet-fails-once` fails `error-screen` on `app`; record `fetch` in (a), and `fetch-404-benign` fails `error-screen` on `app`. | P1 | AC34, AC35, AC36 |
| R33 [C161; C164; C165; C174; C175; C178; C179; C183; D2; D3; D4; D5] | **Story by Story, fixed on the way — only where a verdict moved.** After R32, each Story of C183 (and later each Story the final full run finds, AC36) is run twice, one run after the other: `node scripts/check-rendered-state-census.mjs --stories <story id> --jobs 10 --out docs/sessions/evidence/task923/r8-story/<name>-a` and the same into `<name>-b` (`r8-60-story-loop.mjs --only <nnn>` may be used). `r8-61` compares the pair. A differing row outside the allowed classes of AC36 is diagnosed (its Story × state alone three times, `--stories <story> --widths <width> --locales <locale> --no-closed`, then a probe in the manner of `review-7/rv7-10-…` / `rv7-11-…`) and ends in exactly one outcome: **(i) gate defect** — the measurement varies while the page does not: fixed under the fix contract below, then `check:rendered-state-census:verify` and the mutation proof re-run green, then the Story's pair is run again; **(ii) product race** — a probe with the gate code unchanged shows the product's own settled page differ between two conditions (CPU throttle, a delayed resource, the time of an action against a product timer), as C174 / C175 and C178 / C179 do: one narrowly named class (Story id pattern, root, rule, detail pattern) is added to `r8-61`'s allowed list with that probe as its evidence, and the owner table gets a row; the gate is not changed for it; **(iii) unresolved** — no cause after the isolation and the probe, or 3 fix attempts on one Story: recorded with its evidence, and the loop goes on to the next Story (it never stops on it). **Fix contract** — a fix (1) stays in the gate write set of §16.2 and keeps the exported names and arguments of §15.5 (5); (2) never makes a rule measure less: no threshold, bound or exemption widened without a fixture pair proving the benign shape green and the violating shape red, no element or rule left out, no allowlist, baseline or suppression in the gate, no retry because a measured rule failed (R29); (3) comes with a fixture that reproduces the defect (it behaves wrongly without the fix and as stated with it), added to `verify.mjs`, and a mutation that reverts the fix and makes that fixture fail, added to the mutation proof; (4) is one row of the session log's iteration table: Story, row, cause, outcome (i) / (ii) / (iii), files changed, fixture, mutation, evidence paths. | P1 | AC36 |

### 16.4 Acceptance criteria

- **AC34 [R32; C159; C160].** `npm run check:rendered-state-census:verify` exits 0 with **61 cases**: the 58 of Revision 6 plus
  `stylesheet-fails-once`, `stylesheet-missing` and `fetch-404-benign`, each as stated in R32 (e). The mutation proof `r8-50-…` is a copy of
  `r7-50-…` with the three mutations of R32 (f) added; it prints **29 of 29 proved**. The new test of R32 (c) — `transientReason` returns
  `resource failed: stylesheet /x.css (status 503, EBUSY)` from an `error-screen` row, and still returns `null` for a row whose only
  `error-screen` detail is `render errored, sb-show-errordisplay=true` — passes in the test file.
- **AC35 [R32; C164; C165].** A copy of `review-7/rv7-10-differing-cells-cause-probe.mjs` saved as `r8-51-…`, with its comment changed and its
  A line also printing the `error-screen` detail, prints for `A iframe-css-aborted` and `A iframe-css-404` the line `app: error-screen(1)` and
  no other rule, each detail starting `resource failed: stylesheet /assets/iframe-`; `A normal` is unchanged (`app: text-clamp(7)+text-ellipsis(3) | portal:0: green`).
  The B and C lines are evidence only (product races).
- **AC36 [R9; R28; R29; R30; R31; R32; R33; C118; C161; C172; C173; C174; C175; C176; C177; C178; C179; C180; C181; C182; C183; D2; D3; D4; D5].**
  **The comparator.** A copy of `r7-61-narrowed-compare.mjs` saved as `r8-61-…` takes two run directories and prints every row that differs.
  Its allowed list starts with exactly these three classes; it grows only by R33 outcome (ii), one named class per probe:
  1. `focus-open` on `patterns-mantine-adminshell--drawer-open` rows (C118, a product race);
  2. the Leaflet popup race (C172–C176, C182): on an `app` row of a `patterns-mantine-listingdetailview--` Story, a difference only in
     `component-overflow` and/or `text-hidden`, where every detail of those rules in the run that has them contains `leaflet-popup` or
     `listing-map`;
  3. the share tooltip race (C177–C181): on a `portal:0` row of a state whose id ends `~share-listing`, a difference only in `dismiss-escape`,
     whose detail is `dismiss-escape: the portal is still visible 5000ms after the dismissal`.
  A job retried for `resource failed:` and recovered has no allowance: its rows must equal the other run's.
  **The Story loop (R33).** Each of the three Stories of C183 has a pair `r8-story/<name>-a` / `-b`, the last pair after its last fix,
  compared by `r8-61`: it agrees, or each of its differing rows is outcome (ii) or (iii) in the iteration table. The session log lists
  every retry whose first failure starts `resource failed:`, with its status and code.
  **The final full run.** After the last fix, one full run on the final build, 10 workers (`--jobs 10`), into `r8-full/`. AC32's checks
  hold on it (copies of `r7-84-ac32-checks.mjs` and `r7-10-na-vs-violation.mjs` saved as `r8-84-…` and `r8-10-…`, input path only), and its
  summary lists every retried job with its first failure. `r8-61` compares `r8-full` with `r7-full-b`; a difference that a recovered
  `resource failed:` retry explains is listed as such. Each other differing row is handled as in R33 on its Story only; when that brings a
  fix, that Story's pair is run again and the self-test and mutation proof re-run (the full run is not repeated).
  **Status.** No row is outcome (iii): `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Any row is (iii): `PARTIALLY IMPLEMENTED`, with each
  such row and its evidence. Every gate fix of the loop is counted in AC34's case count and mutation count, which grow beyond 61 and 29 by
  one fixture and one mutation per fix. **Against `r7-full-b`, for information:** a copy of `r7-85-row-diff.mjs` with its input paths changed
  prints the changes of `r8-full` per rule and component.
- **AC37 [R32].** The test file passes twice. `npm test` (the whole suite) is run once and kept, with AC28's treatment if it is red.
  `typecheck`, `lint`, `build`, `build-storybook`, `check:file-integrity` and `check:mojibake` exit 0. `git status --porcelain` is captured
  before and after.

### 16.5 How to run it so nothing gets in the way

1. Order: I0 and hashes → R32 (a)–(d), then its fixtures (e) → AC34 (self-test, then mutations, then the test file) → `build-storybook` →
   AC35 → R33 on the three Stories of C183 (about 5 minutes) → the final full run `r8-full`, the only long run → the AC36 scripts → AC37 →
   session log.
2. Every rule of §15.5 (2)–(6) applies unchanged, with the prefix `r8-` and the review-7 probe (AC35) in place of the review-6 ones; the exported
   names and arguments listed there stay as they are. In the loop, one thing runs at a time: a Story's run, a fix, the self-test, the mutation
   proof. A fix to the gate code needs no `build-storybook` (the Storybook build is product output and does not change).
3. Keep going. A Story whose cause is not found is outcome (iii) and the loop moves on; the loop and the final full run are never stopped for
   one Story. A defect that only a file outside the gate write set could fix is outcome (iii) with that file named, never a change to it.
4. The owner table is Revision 6's (`r7-86-…`), recomputed on `r8-full`, plus a row for every R33 outcome (ii), and these two: **the Leaflet popup race** (`src/components/shared/Map.tsx`: the popup is sized
   before its cross-origin stylesheet applies, and 301px is wider than the map at 390) and **the share tooltip that reappears after Escape**
   (`ListingShareButton`: the 2 000ms label reset reopens a dismissed tooltip under a resting pointer). Opus files them, with the rows marked
   "new" in Revision 6, at closure (§9).

**Verification order:** as §16.5, evidence prefix `r8-`. The session log gets a `# Revision 7` section with R32 and R33 mapped to evidence,
AC34–AC37 with transcripts, the iteration table, the final comparison, the owner table and deviations. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## Rule-compliance ledger

| Rule | How this task complies |
|---|---|
| Owner decision D1 | registry, open every state, separate portal targets, full metrics, Story × state × root × locale × viewport evidence, planted portal-only violations (R1–R6) |
| GR-3j / `rendered-state-census.md` | the gate is its executable form; it changes no presentation |
| Retired `screenshots:assert` (C6) | not revived, not extended, not cited as evidence |
| Legacy not instrumented (C16) | in-scope titles only |
| No baseline / allowlist | none; a differing Story × state needs a dated owner decision in its row |
| Role boundaries | CI and policy edits are Opus's at closure (§9) |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70, C71, C72, C73, C74, C75, C76, C77, C78, C79, C80, C81, C82, C83, C84, C85, C86, C87, C88, C89, C90, C91, C92, C93, C94, C95, C96, C97, C98, C99, C100, C101, C102, C103, C104, C105, C106, C107, C108, C109, C110, C111, C112, C113, C114, C115, C116, C117, C118, C119, C120, C121, C122, C123, C124, C125, C126, C127, C128, C129, C130, C131, C132, C133, C134, C135, C136, C137, C138, C139, C140, C141, C142, C143, C144, C145, C146, C147, C148, C149, C150, C151, C152, C153, C154, C155, C156, C157, C158, C159, C160, C161, C162, C163, C164, C165, C166, C167, C168, C169, C170, C171, C172, C173, C174, C175, C176, C177, C178, C179, C180, C181, C182, C183; owner decisions: D1, D2, D3, D4, D5; blocked claims: NONE.
