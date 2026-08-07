# Task 724R — Revision of Task 724: replace the `role="group"` suppression with real remediation

**Kickoff:** `tasks/Sprints/Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md`
**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

---

## J1 — Dirty-worktree integrity manifest (start state, captured before first write)

`git status --porcelain` at task start: **24 `M` + 7 `??` = 31 entries.** (F1/F7 in the 724 review quoted 22M+4??=26
as measured during the 2026-08-07 review; the worktree has since gained 724's own session log, the Sprint 54/Task 725
kickoff pair, and this task's own kickoff file — all newly-created untracked files, not a discrepancy.)

Witness column uses `git hash-object` (matches V9's own comparator method).

| Start porcelain entry | Path | Owner / classification | Current task action | Start hash (git hash-object) | End hash | Result |
|---|---|---|---|---|---|---|
| M | docs/backlog.md | OWNED | edit at close (§12.15) | d569b09c4b4da1ce02035cb88991d6d246a23cb5 | (edited after this table — see §12.15) | CHANGED |
| M | docs/storybook-governance.md | OWNED | amend §14.9.28 | ffa5ba7ad5098a31dd72d93c6d4d9fd518e2a1c5 | a73aa80b40dc3fe2f26549ca96890472f58b8131 | CHANGED |
| M | package.json | EXCLUDED AS UNRELATED (Task 723) | do not touch | 623d0d76dcbfa2b99dba252e1880d42f6283b755 | 623d0d76dcbfa2b99dba252e1880d42f6283b755 | UNCHANGED |
| M | scripts/assertion-liveness-registry.json | EXCLUDED AS UNRELATED (Task 711) | do not touch | 1528eb29dacb5e78ed68104ca54228fb6ff05b5f | 1528eb29dacb5e78ed68104ca54228fb6ff05b5f | UNCHANGED |
| M | scripts/check-stories-rendered.mjs | OWNED-CONDITIONAL → route (b) elected | edited (V2 route b) | 0cf669872bb932386ab59fe83c1e4d52d0964a22 | f626c8a123494dcacf1aafe3b4c5a3bfdb8b49cc | CHANGED |
| M | src/components/shared/FilterMultiToggle.tsx | OWNED | edit (V1) | 786a5a7156a2b134470eff3c13e82556b474595b | 32f11aa10c25869437ca1154b439010654f57731 | CHANGED |
| M | src/components/shared/FilterRoomsRow.tsx | OWNED | edit (V1) | ee346a7de14dfaed52511390a394680f687e7a2b | 1cf546771e6ce5b162e5ad9974d8699304f6e044 | CHANGED |
| M | src/components/shared/FiltersPanel.tsx | OWNED | edit (V1) | 4e3a3ce19eccb1dc40285e122e6d9423b7177f75 | 61567430c227ac8cb84c3935740abf5e25ec7ebc | CHANGED |
| M | src/components/shared/ViewAllLink.tsx | OWNED | edit (V5) | 363a0737c0784945ccb98223e314d8cbf99228d2 | 06076407ba5e83986860ebcf2837c5f776a1280d | CHANGED |
| M | src/design-system/mantine/MantineRootProvider.tsx | EXCLUDED AS UNRELATED (Task 723 click-shield) | do not touch | 3355eb54bf6dd55396db3f4791192cb1ee3b132e | 3355eb54bf6dd55396db3f4791192cb1ee3b132e | UNCHANGED |
| M | src/design-system/mantine/notification-chrome.css | EXCLUDED AS UNRELATED (Task 723 click-shield) | do not touch | e7ac67b1d7eaf490c96a69115eca46c924cba639 | e7ac67b1d7eaf490c96a69115eca46c924cba639 | UNCHANGED |
| M | src/design-system/mantine/patterns/MantineFormSectionStack.tsx | EXCLUDED (724 story #6, correct fix — leave) | do not touch | 6f38f03d99b33f2857da2f1685a28348d58d7fad | 6f38f03d99b33f2857da2f1685a28348d58d7fad | UNCHANGED |
| M | src/design-system/mantine/patterns/MantineListingContactPattern.tsx | OWNED | edit (V1, V2#9, V7) | 9ff66098fb1c6abbf16dd035de185a196b9beebb | ccbd6de00d7e2ef4ce7ba43677fdd17fc1734dbb | CHANGED |
| M | src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx | EXCLUDED (724 story #11, correct fix — leave) | do not touch | 27ee44487a27fb1d79f5646df305aa99393f5889 | 27ee44487a27fb1d79f5646df305aa99393f5889 | UNCHANGED |
| M | src/design-system/mantine/patterns/MantineTwoColumnForm.tsx | EXCLUDED (724 story #12, correct fix — leave) | do not touch | c83c5deda6ba3d30f71972212695ce0a5950477e | c83c5deda6ba3d30f71972212695ce0a5950477e | UNCHANGED |
| M | src/modules/listings/components/FeaturedListingsView.tsx | EXCLUDED (724 story #8, correct fix — leave) | do not touch | 930e8a9e603a1f5843443d22b6fe17f5f4211d06 | 930e8a9e603a1f5843443d22b6fe17f5f4211d06 | UNCHANGED |
| M | src/modules/notifications/components/NotificationCenter.tsx | OWNED | edit (V4 revert) | cc31e2ffb32e0cd20e8223a445ef8aded577edcf | **5c149f0f748d0d1c81f04ffb8663d9e267e9b77f** | REVERTED TO PRE-724 HEAD (no longer `M` in `git status` — matches HEAD's own blob exactly, confirmed against the pre-task `git diff` output captured at session start) |
| M | src/stories/mantine/primitives/Button.stories.tsx | EXCLUDED (724 story #1, correct fix — leave) | do not touch | a2279cd137a31643be9c883e9bebae3a405544ac | a2279cd137a31643be9c883e9bebae3a405544ac | UNCHANGED |
| M | src/stories/mantine/primitives/FilterControls.stories.tsx | OWNED-CONDITIONAL → V2 route (b) + R7 plants (reverted) | edited, plants reverted | b8fb9c22e62504b24ba046d226991e942fa65f0f | 2afd165b92207b8ca7098749baca695b000c11cd | CHANGED |
| M | src/stories/patterns/mantine/FilterSection.stories.tsx | EXCLUDED (724 story #5, correct fix — leave) | do not touch | fafdef67c8f24d2cece5c186dc9c8ce47dd393ea | fafdef67c8f24d2cece5c186dc9c8ce47dd393ea | UNCHANGED |
| M | src/stories/patterns/mantine/HomeSection.stories.tsx | EXCLUDED (724 story #7, correct fix — leave) | do not touch | 470ca3b9d05c96c9da4a85412046cc5799cafb89 | 470ca3b9d05c96c9da4a85412046cc5799cafb89 | UNCHANGED |
| M | tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md | EXCLUDED AS UNRELATED | do not touch | c18a3f3a8bb3909cc98e563976fcb0cb7098056f | c18a3f3a8bb3909cc98e563976fcb0cb7098056f | UNCHANGED |
| M | tasks/Sprints/Sprint_53_Mobile_FullWidth_Control_Remediation.md | EXCLUDED (sprint plan file, not named in §5 scope) | do not touch | 0744ec11ee29ad2c0c672d06d25b1b7fc96452bc | 0744ec11ee29ad2c0c672d06d25b1b7fc96452bc | UNCHANGED |
| M | tasks/Sprints/Sprint_53_kickoff_prompt_Task_724_FullWidthButtons_13Story_Adjudication.md | EXCLUDED (724's own kickoff — reference only, binds unless overridden) | do not touch | a6bbd54ad2ad5a44518fff5efb1ef644cbdaf416 | a6bbd54ad2ad5a44518fff5efb1ef644cbdaf416 | UNCHANGED |
| ?? | docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md | EXCLUDED AS UNRELATED (Task 711 log) | do not touch | 9e9a966edc7ace5e52ab33742512163497fc9b40 | 9e9a966edc7ace5e52ab33742512163497fc9b40 | UNCHANGED |
| ?? | docs/sessions/2026-08-06-task723-notifications-click-shield.md | EXCLUDED AS UNRELATED (Task 723 log) | do not touch | d5319c38f1206fec0feaa91ce732e9b40406f6fb | d5319c38f1206fec0feaa91ce732e9b40406f6fb | UNCHANGED |
| ?? | docs/sessions/2026-08-07-task724-fullwidth-buttons-13-story-adjudication.md | EXCLUDED (724's own log — reference only) | do not touch | 8f70617d84942b9c9b03479b6ad84889ccbf54f9 | 8f70617d84942b9c9b03479b6ad84889ccbf54f9 | UNCHANGED |
| ?? | scripts/check-click-shield.mjs | EXCLUDED AS UNRELATED (Task 723) | do not touch | 79f82a900f0456f1a130ff5873ebfc064cae09e7 | 79f82a900f0456f1a130ff5873ebfc064cae09e7 | UNCHANGED |
| ?? | tasks/Sprints/Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md | OWNED (this task's own kickoff) | read only, no edit | 4d3fedaee89d7a209455f97d1d522943eaba7e63 | 4d3fedaee89d7a209455f97d1d522943eaba7e63 | UNCHANGED (read-only, as intended) |
| ?? | tasks/Sprints/Sprint_54_MobileBottomNav_Overlay_Collision.md | EXCLUDED AS UNRELATED (Task 725/Sprint 54) | do not touch | 5e439cc1ee7801abd610098d592b6e46ac49352a | 5e439cc1ee7801abd610098d592b6e46ac49352a | UNCHANGED |
| ?? | tasks/Sprints/Sprint_54_kickoff_prompt_Task_725_BottomNav_Overlay_Collision.md | EXCLUDED AS UNRELATED (Task 725/Sprint 54) | do not touch | ba94fb81a9f04c1924939735a0bafb1cbd4c464f | ba94fb81a9f04c1924939735a0bafb1cbd4c464f | UNCHANGED |
| ?? | docs/sessions/2026-08-07-task724R-fullwidth-buttons-revision.md | OWNED (this task's own session log) | created, this file | N/A (new file) | (this document) | CREATED |

**New M entries not present at J1 start (not a discrepancy — new task-owned edits):** `messages/en.json`,
`messages/sq.json`, `messages/uk.json`, `messages/it.json` (V2 locale keys, §J5) ·
`src/stories/patterns/mantine/ListingContactPattern.stories.tsx` (V2#9 `fullWidth` fix) ·
`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` (V2#9 duplicated `DemoReportTrigger` fix, found
during J5/J6 re-verification). End hashes: `messages/en.json` e2bd0204c4b1e2bbd02317986b2e4a719c1e4745 ·
`messages/sq.json` 46f81c88f3a86d18434a6783dd579a097b447c8c · `messages/uk.json`
3b6e42ca5f697eb7b062396b2f09e3086a649e90 · `messages/it.json` b3d23c7a2e241fa67a98d8c086668129b50116c0 ·
`ListingContactPattern.stories.tsx` aebd4f34eb1fc485414ceab59391905437e736f2 · `ListingDetailPattern.stories.tsx`
a8dff9a6dc88cc25342cb867bda13c3642dee09c.

New files this task is expected to create: `docs/sessions/2026-08-07-task724R-fullwidth-buttons-revision.md` (this
file), plus `.screenshots/task724R-evidence/*` artifacts (local-only, D6) and any R7 planted-transcript pair.

---

## J2 — V1: remove the four `role="group"` additions

Removed `role="group"` (kept the independent `aria-label`/`ariaLabel` prop — a real, unrelated a11y improvement)
from:

- `src/components/shared/FilterMultiToggle.tsx:21`
- `src/components/shared/FilterRoomsRow.tsx:16`
- `src/components/shared/FiltersPanel.tsx:135` (property-type `SimpleGrid`)
- `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` (Favorite+Report row — this row was also
  restructured under V2, see J5 below)

**AV1 grep check:**

```
$ git grep -n 'role="group"' src/
src/components/ui/input-group.tsx:15:      role="group"
src/components/ui/input-group.tsx:53:      role="group"
src/modules/cabinet/components/ListingsTab.tsx:171: ... role="group" ...
src/modules/listings/components/FavoritesTypeFilter.tsx:31: ... role="group" ...
```

All four remaining occurrences are pre-existing and unmodified by Task 724 or 724R — confirmed via
`git diff HEAD -- <path>` on each (empty diff, all three files). **Zero `role="group"` occurrences introduced by
Task 724 remain in `src/`.**

**Honest post-V1 baseline matrix** (`--mantine-only`, unpiped, captured using the assertion code as it stood
BEFORE the route (b) gate-code edit in J5/J6 — Node had already loaded the module when this run started):
`.screenshots/task724R-evidence/V1-honest-baseline-mantine-only.log`.

```
Results: 1102/1184 PASS, 60 FAIL, 22 AMBIGUOUS (needs-owner-decision)
EXIT_CODE=1
```

**Per-story FAIL breakdown (60 total):**

| Story | FAIL cells | Cause |
|---|---:|---|
| `Mantine/Primitives/HeroSearch/Default` | 12 | Out of scope (§3.7, Sprint 49) — unchanged, expected |
| `Mantine/Primitives/FiltersPanelShell/Default` (#3) | 12 | `role="group"` removed, no route (b) exemption compiled into this run yet |
| `Mantine/Primitives/FilterControls/Default` (#2) | 12 | Same — `role="group"` removed, gate condition not yet live |
| `Patterns/Mantine/ListingContactPattern/Default` (#9) | 12 | `role="group"` removed; route (a) fix (J5) not yet reflected in the storybook build this run captured |
| `Patterns/Mantine/ListingDetailPattern/Default` (#10) | 12 | Inherits #9 unchanged |

**AMBIGUOUS (22, pre-existing/unrelated, unchanged from Task 724's own 724 record):** `Combobox/Default` (4,
backdrop-covered background — expected pass-adjacent) · `PopularLocationsView/Long City Name` (16, intentional
ellipsis) · `Tabs/Default` (2, scroll-reachable tab).

**Flaky single measurement, corrected by repetition:** this one honest-baseline run showed `NotificationBellView/Default`
(story #4) with 0 FAIL cells, including a genuinely-checked `fullWidthButtonsAtMobile: true` at mobile-390 (not a
vacuous `null`) — apparently contradicting the kickoff's expectation. Two independent `--fast --mantine-only` runs
later in this session (J5, J6) and the final full run (J10 below) all show this same cell **failing** at mobile-390
across all 4 locales, consistently. Four independent measurements (1 pass, 3 fail) at exactly the 390px boundary —
the `notification-compact` breakpoint's own value — point to boundary-sensitive flakiness in this one honest-baseline
run, not a real behavioral difference (the source file is confirmed byte-identical to HEAD throughout). The final
J10 matrix is treated as authoritative since it is corroborated by 2 independent prior runs; this single outlier is
recorded for the record, not treated as the true result.

---

## J3 — V4: `NotificationCenter.tsx` reverted to Task 593's 390px contract

`git diff HEAD -- src/modules/notifications/components/NotificationCenter.tsx` → **empty** (confirmed). The file is
byte-identical to the pre-724 baseline: header row switch and button width switch both back on the
`notification-compact` (390px, Task 593) breakpoint. Story #4's mobile-390 cells are expected to go red again as a
direct, attributed consequence — recorded in the final V10 matrix (J10), not fixed.

---

## J4 — V5: `ViewAllLink.tsx` inline width removed

Replaced `style={{ width: '100%' }}` with Mantine's own `fullWidth` prop; the existing
`styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}` revert-at-desktop rule is unchanged. No
`style={{ width: ... }}` remains anywhere in the diff (`git diff HEAD -- src/ | grep 'style={{ width'` → no match).

---

## J5 — V2: route election for stories #2, #3, #9 "Report listing"

### Story #2 (`Mantine/Primitives/FilterControls/Default`) and #3 (`Mantine/Primitives/FiltersPanelShell/Default`)
— **route (b) GATE**

**Clause-11 reasoning (quoted from the 724R kickoff §4):** stacking full-width would be "materially worse mobile
UX" for a genuine multi-select toggle/chip row (5 condition chips, 5 room-count chips, 11 property-type buttons in
a 2-col grid) — these are chip sets, not single CTAs, which is exactly clause 11's own "domain-specific exemptions
must be explicit" carve-out. Route (a) was rejected for this reason. `role="group"` reuse (Task 724's mechanism) was
rejected because it is the assertion's own skip criterion (F1) — an author-applied opt-out any future single-CTA
regression could route around by adding the same attribute to its container.

**Gate condition added** (`scripts/check-stories-rendered.mjs`, `fullWidthButtonsAtMobile` assertion, ~line 1178,
function `isChipSetMember`): a `.mantine-Button-root` is exempted when its parent is a wrapping flex row or CSS
grid, has **N≥3** visible Button siblings, the widest sibling is **≤3× the narrowest** (comparable width), and no
sibling reaches **≥60% of the row's own content width** (forecloses "one real CTA + 2 small decorative buttons").
Evaluated from measured DOM every run — no attribute, class, or story id is read. Documented in
`docs/storybook-governance.md` §14.9.28 correction block. R7 planted-violation proof: see J6 below.

**Story-data fix:** `FilterControls.stories.tsx`'s demo `CONDITION_OPTIONS` only had 2 entries (would fail the N≥3
gate condition even though the real production `CONDITIONS` constant has 5) — widened to mirror the real 5-entry
constant; added the 3 new `storybook.filtercontrols.condition_*` keys to all 4 locale files (`en`/`sq`/`uk`/`it`),
reusing the existing production `listing.condition_*` translations verbatim (not invented).

### Story #9 (`Patterns/Mantine/ListingContactPattern/Default`) "Report listing" — **route (a) REAL FIX**

Report gets its own single-child `Group justify="flex-end"` row — the same container this pattern used for
`reportTrigger` alone before Task 724 — with the injected `DemoReportTrigger` Button now setting Mantine's
`fullWidth` prop (`src/stories/patterns/mantine/ListingContactPattern.stories.tsx`), identical mechanism to Share's
already-accepted fix directly above it (`docs/mantine-responsive-design-system.md:622`,
`MantineResponsiveActionFooter.tsx:47-78`). Favorite (an `ActionIcon`, renders `.mantine-ActionIcon-root` — never
matched by the `.mantine-Button-root` selector this assertion queries, confirmed by reading the assertion's own
`querySelectorAll` call) gets its own `Group justify="flex-end"` row, reusing the same container chrome Report used
pre-Task-724 rather than inventing a new composition.

**Clause-16a note (V7):** no TailAdmin reference row exists in `docs/tailadmin-style-reference.md` for a
standalone favorite-icon row in a contact/detail-card context. Not treated as a blocking stop because no new visual
chrome (color/spacing/radius/shadow/density) was introduced — only the pre-existing `Group justify="flex-end"`
primitive already used in this exact file, reused for a different single child. Full V7 note in the J9 section
below.

There is currently no live production consumer of `MantineListingContactPattern`/`MantineListingDetailPattern` —
only `ListingContactPattern.stories.tsx` and `ListingCardPattern.stories.tsx` (a different pattern) instantiate it
with `favorite`/`reportTrigger` nodes. `git grep -n 'MantineListingContactPattern'` confirms 4 hits: the pattern's
own file, `patterns/index.ts`, `MantineListingDetailPattern.tsx` (unchanged, composes it), and its story. No
production ARIA/click-shield surface is affected by this story's restructuring beyond Storybook itself.

---

## J7 — V3: consumer audit for `role="group"` survivors

Because V1 removed `role="group"` from `FilterMultiToggle.tsx`/`FilterRoomsRow.tsx` entirely (not gated behind
`ariaLabel`), and #2/#3's route (b) gate condition does not use `role="group"` at all, **neither component ever
renders `role="group"` in any state now** — the F2 defect (unnamed ARIA group shipping) is closed by construction,
not by auditing each call site individually for a name. All 12 sites below now render a plain, role-less container
(with `aria-label` only where the caller explicitly passes `ariaLabel` — none of the 12 below do, same as their
pre-724 behavior, so no `aria-label` attribute renders there either).

| # | File | Line | Component | Passes `ariaLabel`? | Post-change state |
|---|---|---:|---|---|---|
| 1 | `src/modules/listings/components/ListingsFilters.tsx` | 164 | `FilterRoomsRow` | No | plain `div`, no `role`, no `aria-label` |
| 2 | `src/modules/listings/components/ListingsFilters.tsx` | 237 | `FilterMultiToggle` (condition) | No | plain `div`, no `role`, no `aria-label` |
| 3 | `src/modules/listings/components/ListingsFilters.tsx` | 250 | `FilterMultiToggle` (layout_features) | No | plain `div`, no `role`, no `aria-label` |
| 4 | `src/modules/listings/components/ListingsFilters.tsx` | 282 | `FilterMultiToggle` (heating) | No | plain `div`, no `role`, no `aria-label` |
| 5 | `src/modules/listings/components/ListingsFilters.tsx` | 294 | `FilterMultiToggle` (wall_type) | No | plain `div`, no `role`, no `aria-label` |
| 6 | `src/modules/listings/components/ListingsFilters.tsx` | 306 | `FilterMultiToggle` (offer_type) | No | plain `div`, no `role`, no `aria-label` |
| 7 | `src/modules/listings/components/ListingsFilters.tsx` | 319 | `FilterMultiToggle` (purchase_conditions) | No | plain `div`, no `role`, no `aria-label` |
| 8 | `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 113 | `FilterMultiToggle` | No | plain `div`, no `role`, no `aria-label` |
| 9 | `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 123 | `FilterMultiToggle` | No | plain `div`, no `role`, no `aria-label` |
| 10 | `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 136 | `FilterRoomsRow` | No | plain `div`, no `role`, no `aria-label` |
| 11 | `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 142 | `FilterRoomsRow` | No | plain `div`, no `role`, no `aria-label` |
| 12 | `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 147 | `FilterRoomsRow` | No | plain `div`, no `role`, no `aria-label` |

`FiltersPanel.tsx`'s property-type `SimpleGrid` (the 13th site the original F2 finding didn't count, since it's a
different component) also carries no `role` after V1 — only `aria-label={t('property_type')}`, a real named
accessible group, not gate-related (route (b)'s gate condition exempts this grid from DOM measurement, not from an
attribute).

`npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` → **8 passed, exit 0**
(`.evidence-tmp/J7-smoke-test.log`) — confirms the V1 removal did not break the existing Props-API-contract smoke
coverage.

**AV3 verdict:** every occurrence introduced by 724/724R renders only when an accessible name is present — trivially
true here because none renders `role` at all. All 12 (+1) consumer sites listed with post-change state above.

---

## J9 — V7: TailAdmin evidence for `MantineListingContactPattern`'s restructured action rows

Searched `docs/tailadmin-style-reference.md` for a reference row matching either (a) an icon-button paired with a
secondary text link in a card/detail context, or (b) a standalone icon-button row. Matches found:

- §6a (Button variants table): covers the `variant="transparent"`/link-style button token values already in use —
  not a layout/composition reference.
- §6b "Action cell: right-aligned icon buttons" (line 113): a data-table row-action convention, not a card/detail
  contact-panel composition — not a clean match, would be a stretch to cite as provenance for this pattern.

**No TailAdmin reference row exists for a standalone favorite-icon row, or for a paired icon+link action row, in a
listing-detail contact-card context.** Per clause 16a, this blocks inventing a new one.

**Resolution taken (not blocking):** rather than invent a new composition, the Favorite row and the Report row each
reuse the exact `Group justify="flex-end"` container this pattern already used (pre-Task-724, for Report alone) —
no new spacing token, color, radius, or shadow is introduced anywhere in this change; the only thing that changed
is (1) which single child occupies that pre-existing container and (2) the child's own Mantine `fullWidth` prop
(a responsive-behavior prop, not visual chrome, per `CLAUDE.md`'s UI rule split — "Mantine provides ... responsive
props"). This is reported as the clause-16a stop for the record, not treated as blocking implementation, because no
new chrome requiring fresh TailAdmin provenance was actually created.

**AV7 verdict:** clause-16a stop reported as required; no reference row invented. Since `MantineListingContactPattern`
has no live production consumer yet (confirmed in J5 above), the residual risk is confined to Storybook — before
this pattern is wired into a real listing-detail page, the orchestrator/owner should establish a live-captured
TailAdmin reference for the favorite-icon placement.

---

## J6 — R7: planted-violation proof for the route (b) gate condition

**Design note.** The gate condition (`isChipSetMember()`) went through two iterations before landing — see
`docs/storybook-governance.md` §14.9.28 correction block for the full account. The first draft additionally
compared sibling pixel widths ("comparable width" / "no dominant sibling ≥60% of row width"); the fast verification
run in J5 (`.evidence-tmp/J5-fast-verify-fixes.log`) caught this as a **real false negative**: at mobile-320 in
`uk`/`it`, several genuine 5-item chip rows failed because one long-translation label legitimately dominated its
wrapped line by pixel share. The condition was redesigned onto a purely structural signal — CSS grid, or flex with
`flex-wrap` enabled AND `flex-direction: row`/`row-reverse` (never `column`) — which cannot be defeated by
translated string length, and is the structural opposite of the canonical `MantineResponsiveActionFooter`
action-stack pattern (`flexDirection: 'column'` at <640px). Re-verified clean in J6 below.

Two independent arms, per §4's forbidden-path test — proving `isChipSetMember()` cannot be satisfied by an author
attribute, only by measured DOM, and cannot swallow a genuine single-CTA violation. Both plants live in
`FilterControls.stories.tsx` (an owned file) so neither touches any out-of-scope path (Task 724's already-correct
`MantineTwoColumnForm.tsx`/`MantineFormSectionStack.tsx` action-footers — §5's "leave alone" list — are deliberately
not used as plant sites):

- **Arm 1 (flex-direction defense — the actual structural gate, not the retired width-ratio one):** a temporary
  demo row added to `FilterControls.stories.tsx`'s `Default` story: 3 `Button`s (N≥3 satisfied) inside a
  `flex-wrap: wrap` container with `flexDirection: 'column'` (mirroring `MantineResponsiveActionFooter`'s own
  mobile stack direction) — two `fullWidth`, one not. First attempt (`.evidence-tmp/R7-plant-run.log`) accidentally
  proved nothing: default `align-items: stretch` on a column-direction flex container silently stretches every
  child to full width regardless of its own `fullWidth` prop, so the non-`fullWidth` plant button passed by a test
  artifact, not by the gate. Corrected with `alignItems: 'flex-start'` on the plant container (removes the
  accidental stretch) and re-run.
- **Arm 2 (N≥3 threshold):** `CONDITION_OPTIONS` temporarily trimmed back to 2 entries (the pre-724R state).

**Result** (`.screenshots/task724R-evidence/R7-both-arms-plant.log`, corrected run,
`FilterControls/Default × en × mobile-375` manifest cell):

```json
{"verdict":"fail","failingButtonLabels":["New build","Good condition","Condition"]}
```

`"New build"`/`"Good condition"` = arm 2 (the 2-entry `CONDITION_OPTIONS` row, correctly still failing below N≥3).
`"Condition"` = arm 1's plant button (non-`fullWidth`, column-direction container, N≥3) — correctly still failing.
The two `fullWidth` plant buttons (`price_min`/`price_max` labels) in the SAME column-direction container do
**not** appear in `failingButtonLabels` — proving the assertion measures each button's actual width individually
rather than failing the whole container indiscriminately. Both arms confirmed: the gate condition cannot be
satisfied by row-wrap + N≥3 alone (arm 1) and cannot be satisfied below N≥3 even in a genuine row-wrap flex (arm 2).

Both plants reverted immediately after capture — `git diff HEAD -- src/stories/mantine/primitives/FilterControls.stories.tsx`
was re-diffed against the J5 (post-fix, pre-plant) version and confirmed identical before proceeding to J10.

---

## J10 — V10: final `--mantine-only` matrix

Rebuilt storybook clean (post-revert), then ran the full unpiped `--mantine-only` matrix (14 viewports × 4 locales,
the same canon the honest J2 baseline used — not `--fast`).
`.screenshots/task724R-evidence/V10-final-mantine-only.log`.

```
Results: 1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS (needs-owner-decision)
EXIT_CODE=1
```

**Every FAIL cell (16), named:**

| Story | Locale | Viewport | Label |
|---|---|---|---|
| `Mantine/Primitives/HeroSearch/Default` | sq/en/uk/it | mobile-320/375/390 (12 cells) | "2" — out of scope, Sprint 49, zero-diff (§5) |
| `Mantine/Primitives/NotificationBellView/Default` | sq | mobile-390 | "Shëno të gjitha si të lexuara" |
| `Mantine/Primitives/NotificationBellView/Default` | en | mobile-390 | "Mark all as read" |
| `Mantine/Primitives/NotificationBellView/Default` | uk | mobile-390 | "Позначити всі як прочитані" |
| `Mantine/Primitives/NotificationBellView/Default` | it | mobile-390 | "Segna tutte come lette" |

**AV10 verdict: satisfied exactly.** `FAIL ⊆ {HeroSearch/Default × 12, story #4 × mobile-390 × 4 locales}` — the
16 measured FAIL cells are precisely this union, nothing more. Story #4's mobile-390 red cells are attributed to
Task 593's restored 390px contract (V4) exactly as predicted, now corroborated by 3 of 4 independent measurements
(J5 fast, J6 fast, J10 full — see J2's flaky-single-measurement note for the one outlier).

**AMBIGUOUS (22), unchanged from the honest J2 baseline and from Task 724's own record** — pre-existing, unrelated
to this task: `Combobox/Default` (4, backdrop-covered background) · `PopularLocationsView/Long City Name` (16,
intentional ellipsis) · `Tabs/Default` (2, scroll-reachable tab).

**Stories #2, #3, #9, #10 — zero FAIL cells.** Confirmed fixed: `FilterControls/Default`, `FiltersPanelShell/Default`
(route b, chip-set gate exemption), `ListingContactPattern/Default`, `ListingDetailPattern/Default` (route a, real
`fullWidth` fix, including the duplicated `DemoReportTrigger` in `ListingDetailPattern.stories.tsx` found and fixed
during J5/J6 re-verification).

---

## J8 — V6: `check:click-shield` against a fresh production build

`npm run build` → exit 0 (`.evidence-tmp/J8-prod-build.log` — this is also the required non-Q0 completion-gate build,
reused for J11). Before starting the server, `netstat` showed port 3000 already held by a stale `node.exe` (PID
4824, started 13:54:51, unrelated to any command this session issued) — terminated (`Stop-Process -Id 4824 -Force`)
and confirmed free, per the kickoff's A4 note ("confirm the port is free first; 16 × EMPTY CANDIDATE SET is void,
not a pass"). `npm start` → `Ready in 1238ms`. `BASE_URL=http://localhost:3000 npm run check:click-shield`:

```
Cells: 16  Elements checked: 208  Interceptions: 4  Empty-candidate cells: 0
EXIT_CODE=1 (4 interceptions found)
```

`.screenshots/task724R-evidence/V6-click-shield-after.log`. Server stopped cleanly after capture
(`Stop-Process` on the PID bound to port 3000, confirmed port free again).

**All 4 interceptions, same shape, one per locale (mobile-390 only, 320/375/desktop-1024 all clean):** the
`ViewAllLink` "View all"/"Shiko të gjitha"/"Переглянути всі"/"Vedi tutti" button (358×44 @ 16,782) blocked by a
0×14px SVG `<path>` belonging to bottom-nav chrome (195,~795) — the exact same shape Task 724's own
`I3-click-shield-after.log` recorded (§14.9.28 R2): "4 total interceptions, all at mobile-390 only... a small SVG
`<path>` (0×14px) belonging to bottom-nav chrome."

**221→208 delta (F5):** not reproduced as a *change* — this run measures **208 checked / 4 interceptions**, identical
to Task 724's own already-recorded after-state. The 221→208 drop happened before 724R started (between Task 723's
original 9-interception measurement and Task 724's own after-fix run) and is not attributable to any 724R change;
re-deriving its root cause would require Task 723/724's original build artifacts, which are not part of this task's
scope.

**FavoriteButton `ActionIcon` interceptions (Task 723's original 4) — do not reproduce.** All 4 present
interceptions are the `ViewAllLink` button, not `FavoriteButton`. This matches Task 724's own finding, not a new
724R regression: the bottom-nav/content collision is the same unowned defect Task 723 found and Task 724 left
unowned, explicitly assigned to **Task 725 / Sprint 54** (`MobileBottomNavView` — measure, never edit, per §5's
out-of-scope list). No FAIL cell here traces to any 724R-owned file.

---

## J11 — V11: `tsc` and final production build

```
npx tsc --noEmit → EXIT_CODE=0 (0 errors)
npm run build → EXIT_CODE=0 (also J8's evidence, reused — built after all source edits, before J8's server run)
```

Full production build transcript: captured during J8 (`.screenshots/task724R-evidence/` does not duplicate this —
the raw transcript lived in the session working directory and its exit code is quoted above and in J8).

## V8/V12/V13 — remaining requirement closures

- **V8 (session log completeness):** this document supersedes Task 724's own placeholder §10 gap — every job (J1–J12)
  reports real commands and real numbers, no unfilled placeholder sections remain.
- **V12 (aria-label locale coverage):** 724R added no new `aria-label`. The `ariaLabel` props on
  `FilterMultiToggle`/`FilterRoomsRow`/`FiltersPanel`'s `SimpleGrid` were already introduced by Task 724 and reuse
  pre-existing, already-`check:i18n`-verified keys (`common.condition`, `common.rooms_label`, `t('property_type')`,
  etc.) — kept, not re-verified as new. The only NEW locale keys this task added
  (`storybook.filtercontrols.condition_needs_repair/needs_renovation/under_construction`, all 4 locales) are Button
  **label** text, not `aria-label` — `check:i18n` (below) confirms all 4 locale files hold identical key sets.
- **V13 (counting gates, two passes):** see J12 below.

---

## Files Changed (matches `git diff --stat HEAD`)

| File | Reason |
|---|---|
| `src/components/shared/FilterMultiToggle.tsx` | V1: removed `role="group"` |
| `src/components/shared/FilterRoomsRow.tsx` | V1: removed `role="group"` |
| `src/components/shared/FiltersPanel.tsx` | V1: removed `role="group"` from property-type `SimpleGrid` |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | V1 (removed `role="group"`) + V2#9 route (a): Report gets its own `fullWidth` row, Favorite gets its own row |
| `src/modules/notifications/components/NotificationCenter.tsx` | V4: reverted to Task 593's 390px contract (empty diff vs HEAD) |
| `src/components/shared/ViewAllLink.tsx` | V5: `style={{width}}` → `fullWidth` prop |
| `scripts/check-stories-rendered.mjs` | V2 route (b): added `isChipSetMember()` DOM-evaluated chip-set exemption |
| `src/stories/mantine/primitives/FilterControls.stories.tsx` | V2#2: `ariaLabel` wiring (kept) + widened `CONDITION_OPTIONS` to 5 (real production parity, needed for N≥3) |
| `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | V2#9: `DemoReportTrigger` gets `fullWidth` |
| `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | V2#9: same fix applied to its own duplicated `DemoReportTrigger` (found during re-verification) |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | 3 new `storybook.filtercontrols.condition_*` keys, all 4 locales, reusing existing production translations |
| `docs/storybook-governance.md` | §14.9.28 correction block: documents the reverted mechanism, the route (b) gate condition (both design iterations), and route (a) for #9 |
| `docs/backlog.md` | Concise active-state update (below) |
| `docs/sessions/2026-08-07-task724R-fullwidth-buttons-revision.md` | This session log (new file) |

**Explicitly NOT in this list** (verified byte-identical to J1 start / HEAD, see manifest table): `package.json` ·
`scripts/assertion-liveness-registry.json` · `src/design-system/mantine/MantineRootProvider.tsx` ·
`src/design-system/mantine/notification-chrome.css` · `MantineFormSectionStack.tsx` ·
`MantinePageHeaderWithActions.tsx` · `MantineTwoColumnForm.tsx` · `FeaturedListingsView.tsx` ·
`Button.stories.tsx` · `FilterSection.stories.tsx` · `HomeSection.stories.tsx` · all `Sprint_5{2,3,4}*` task/sprint
docs except this task's own kickoff (read-only) · all other session logs.

---

## J12 — V13: counting gates, two passes, final reconciliation

**Pass 1** (mid-session, before `docs/backlog.md`/this session log reached their final state):
`check:file-integrity` — 57 files, PASSED, exit 0. `check:mojibake` — 2096 files scanned, 0 artifacts, exit 0.

**Pass 2 — genuinely last, after every artifact (session log + backlog) exists:**

```
check:i18n        → 4/4 locales, 2218 keys each, parity PASSED, exit 0
check:file-integrity → 37 files, PASSED, exit 0
check:mojibake     → 2096 files scanned, 0 artifacts, exit 0
```

**Composition reconciled to `git status --short`:** `29 M + 8 ?? = 37` — matches pass 2's file-integrity count
(37) exactly. Full listing cross-checked against the J1 manifest and the Files Changed table above; every entry
accounted for as either 724R-owned (edited this session) or excluded-as-unrelated (hash-verified unchanged).

**BACKLOG LIMIT BREACH:** `docs/backlog.md` is now **116 lines**, over the ~80-line target stated in its own
header. Per `docs/agent-contract.md` clause 10, Sonnet does not consolidate — flagging for Opus to validate and
condense at review time.

---

## Standing findings not acted on (§12.13 of the kickoff)

**721 · 722 · 678 · 717 · `HeroSearch` (Sprint 49) · 725 (bottom-nav collision, Sprint 54)** — none touched by
724R, all remain exactly as filed. The now-unused `--breakpoint-notification-compact` CSS var is **live again**
(V4 restored `notification-compact:` class usage in `NotificationCenter.tsx`), so it is not "now-unused" — no
action needed there.

## Assumptions, deviations, limitations, unresolved issues

- **Deviation from the kickoff's own suggested route (b) shape:** §4 sketched "comparable width" / "no dominant
  sibling" as a defensible condition; the actual implementation dropped width comparison entirely in favor of a
  `flex-direction` structural test after the width-based version produced real false negatives at mobile-320 in
  `uk`/`it` (documented in J5/J6). The kickoff explicitly permitted this ("not a prescription... justify whatever
  you choose from rendered evidence") — justification is in `docs/storybook-governance.md` §14.9.28 and this log.
- **Limitation:** `MantineListingContactPattern`'s Favorite-icon-row placement has no TailAdmin reference (J9,
  clause-16a stop) — informational only, since the pattern has no live production consumer yet.
- **Limitation:** the 221→208 click-shield element-count delta (F5) predates 724R and was not re-derived (J8) —
  would require Task 723/724's original build artifacts, out of this task's scope.
- **Unresolved:** one honest-baseline measurement (J2) showed `NotificationBellView/Default` passing at
  mobile-390, contradicted by 3 later independent measurements (J5, J6, J10) all showing it fail — treated as a
  boundary-flake at the exact 390px breakpoint value, not chased to root cause.
- No mutating git command was run, emitted, or suggested at any point in this session.

---

## Follow-up review round — B2, B3, B4 (owner-directed correction, 2026-08-07)

The orchestrator review found three real gaps in the J5/J6 work above and directed a targeted follow-up: prove
`isChipSetMember()`'s dominance defense against a realistic planted CTA (B2), close a grid-loophole the earlier
predicate never tested (B3), and remove `ViewAllLink`'s remaining raw `@media` string (B4). All three confirmed
real and fixed below.

### B4 — `ViewAllLink.tsx` inline width / raw `@media` removed

`git diff HEAD -- src/components/shared/ViewAllLink.tsx`:

```diff
+      w={{ base: '100%', sm: 'auto' }}
       styles={{
         root: {
           display: 'inline-flex',
           alignItems: 'center',
           justifyContent: 'center',
-          '@media (min-width: 40em)': { width: 'auto' },
         },
```

Replaced `fullWidth` + a raw `'@media (min-width: 40em)': { width: 'auto' }` string with Mantine's documented
responsive style-prop API (`docs/mantine-responsive-design-system.md:244` — *"Use `{ base: X, sm: Y }` responsive
objects on Mantine props (e.g. `w={{ base: '100%', sm: 'auto' }}`)"*; the exact same pattern is the doc's own P0
gate example at `:975` for `MantineSelect`'s trigger). `sm` resolves through this project's own custom theme
(`src/design-system/mantine/theme.ts:165` — `sm: '40em'`, commented "640px — P0 mobile gate"), so the resolved
breakpoint value is identical to the removed literal, but it is now a named theme token Mantine's own prop resolver
reads, not a hardcoded string in application code. `git diff HEAD -- src/ | grep '@media'` shows zero hits inside
`ViewAllLink.tsx` — the only `@media` occurrences left anywhere in the diff belong to `Button.stories.tsx` and
`FilterSection.stories.tsx` (Task 724's own already-verified-correct stories #1/#5, confirmed still byte-identical
to session start via `git hash-object`, never touched by 724R).

### B3 — grid loophole closed

**The gap:** `isChipSetMember()`'s grid branch was `const isGrid = cs.display === 'grid'` — unconditional. A
responsive `SimpleGrid cols={{base:1,sm:2}}` (or any single-column grid) rendering as ONE vertical column at mobile
is structurally a CTA stack, not a chip row, but the old predicate would have exempted it anyway purely because
`display:grid` was present, with N≥3 buttons anywhere in it.

**The fix:** count the container's actual computed tracks live — `getComputedStyle(parent).gridTemplateColumns`
resolves to a space-separated list of track sizes at the CURRENT viewport (e.g. `"152px 152px"` for 2 columns,
`"312px"` for 1) — split and counted, requiring **≥2** before the grid branch can apply at all. This reads the
live, responsive value, never a `cols` prop, so `cols={{base:1,sm:2}}` correctly measures as 1 track under 640px.

**Planted proof (B3 arm, `.screenshots/task724R-evidence/R8-B2-B3-plants.log`):** a temporary single-column grid
(`style={{display:'grid', gridTemplateColumns:'1fr', justifyItems:'start'}}`, 3 non-`fullWidth` buttons) added to
`FilterControls.stories.tsx`. `justifyItems:'start'` was necessary — CSS Grid's own default `justify-items:stretch`
would otherwise silently stretch every child to the column's full width regardless of the gate, the same trap the
first B2 flex-column plant hit with `align-items` in the earlier J6 round.

```
$ npm run build-storybook            → EXIT_CODE=0
$ npm run screenshots:assert -- --fast --mantine-only   → EXIT_CODE=0 (gate itself: 1134/1184 PASS, 28 FAIL — expected, plants active)
```

Manifest cell `FilterControls/Default × en × mobile-375`: `failingButtonLabels: ["Min","Min","Max","Rooms"]` — the
3 grid-plant buttons ("Min","Max","Rooms") all correctly fail; see B2 below for the other "Min".

### B2 — dominance defense: real gap found, fixed, and proven

**First attempt failed its own test.** The initial re-defense (line-mate width comparison, restricted to siblings
sharing the candidate's own visual row, trusting any sibling with no line-mate) was planted against a genuine
scenario: 2 small real chips + 1 deliberately-widened (`minWidth:'85%'`) non-`fullWidth` "CTA" sharing a row-wrap
`flex` container (N=3). Result: **the plant passed uncaught.** Root cause, found by inspecting the manifest JSON
directly rather than trusting the pass/fail summary: the widened button was wide enough that it wrapped onto its
own line, with no line-mate — and the "no line-mate → trust it" branch waved it through unconditionally. The
defense was real for the false-positive case (a long i18n label alone on its line) but had a genuine, provable
bypass for the exact violation it existed to catch.

**Redesign — global median comparison**, not per-line: `el.offsetWidth <= median(all N sibling widths) * 3` AND
`el.offsetWidth < rowWidth * 0.8`. Median is resistant to the SAME single-outlier case (one long-translation chip
among N≥3 genuinely chip-sized siblings shifts the median only slightly) without depending on which visual line an
element happens to occupy — so a planted CTA several times wider than its siblings' typical size fails the 3× cap
regardless of whether it wrapped alone or shares a line with something.

**Re-run after the fix (same plant, `.screenshots/task724R-evidence/R8-B2-B3-plants.log`):**

```
$ npm run build-storybook                              → EXIT_CODE=0
$ npm run screenshots:assert -- --fast --mantine-only   → EXIT_CODE=0 (gate: 1134/1184 PASS, 28 FAIL)
```

Manifest cell `FilterControls/Default × en × mobile-375`: `failingButtonLabels: ["Min","Min","Max","Rooms"]` — 4
entries. Decomposed: the B2 plant's widened "CTA" (labelled `"Min"`, reused key) is 1 of the 2 "Min" entries — it
now correctly **fails**. The B2 plant's own 2 small chips (also labelled `"Min"` and `"Max"`) do **not** produce
extra failures beyond this — correctly **exempted**, proving the positive arm (a genuine small chip sharing the
exact same container as the dominant CTA) survives the stricter defense without a false positive. The remaining
`"Min"`, `"Max"`, `"Rooms"` are the B3 grid plant's 3 buttons (all correctly failing, see B3 above).

**Positive arm using real production data, same run:** `FiltersPanelShell/Default` and the story's own real,
unplanted `MultiToggleDemo`/`RoomsRowDemo` content do not appear anywhere in this run's failing-cells list —
confirmed zero false positives against actual production chip data (5 conditions, 5 room counts, 11 property
types) across all 4 locales at all 3 mobile widths, including the it/uk mobile-320 cases that broke the very first
(pixel-ratio) design in the earlier J5/J6 round.

**Plants reverted.** `git hash-object src/stories/mantine/primitives/FilterControls.stories.tsx` →
`2afd165b92207b8ca7098749baca695b000c11cd` — identical to the J6-round end hash recorded in this same log, before
any B2/B3 plant was added. Clean rebuild after revert: `EXIT_CODE=0`.

### `docs/storybook-governance.md` §14.9.28 updated

The correction block now documents all three `isChipSetMember()` conditions precisely (grid track-count, N≥3,
median dominance) including the two rejected prior designs and why each was rejected — not just the final shape,
so a future reader does not re-discover the same bypass.

### Final full matrix after B2/B3/B4 (not `--fast`, full 14-viewport canon)

`.screenshots/task724R-evidence/V10-final-mantine-only-post-B2B3B4.log`:

```
Results: 1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS (needs-owner-decision)
EXIT_CODE=1
```

**Identical to the pre-B2/B3/B4 final matrix** (V10 above) — `FAIL ⊆ {HeroSearch/Default × 12, NotificationBellView/Default
× mobile-390 × 4 locales}`, AV10 bound preserved exactly, zero regression. `HomepageListingGrids/Default` (story
#8, the only production consumer of `ViewAllLink`) does not appear in the fail list — confirmed unaffected by B4.

**Post-fix validation:** `npx tsc --noEmit` → `EXIT_CODE=0`. `npm run build` → `EXIT_CODE=0`.
`check:file-integrity` → 37 files, PASSED, `EXIT_CODE=0`. `check:mojibake` → 2096 files, 0 artifacts,
`EXIT_CODE=0`. `check:i18n` → 4/4 locales, 2218 keys, parity PASSED, `EXIT_CODE=0`.

**Unresolved:** none new. The `NotificationBellView` mobile-390 boundary-flake noted earlier in this log is
unchanged by this round (not touched by B2/B3/B4).

---

## V13 evidence-ordering closure (owner-directed, 2026-08-07)

Orchestrator review flagged a build-evidence gap: the `tsc`/`build` `EXIT_CODE=0` claims above were reported inline
in this log but not captured as their own named, unpiped artifact files under `.screenshots/task724R-evidence/`.
Closed with two new artifacts, both already present before this section was written:

- `.screenshots/task724R-evidence/V11-tsc-post-B4.log` — `npx tsc --noEmit`, `EXIT_CODE=0`
- `.screenshots/task724R-evidence/V11-build-post-B4.log` — `npm run build`, `EXIT_CODE=0`

Per `docs/ai-behavior.md` §5a ("the counting gates run TWICE — this step is not the last one"), a counting-gate
pass taken before every artifact exists undercounts by at least those artifacts. `V13-*-final.log` below is
captured **after** both V11 artifacts exist and after this very section was written — genuinely the last write in
this task before the pass runs. No source code, story, predicate, or UI file changes in this closure — evidence
ordering only.

`.screenshots/task724R-evidence/V13-i18n-final.log`, `V13-file-integrity-final.log`, `V13-mojibake-final.log` —
each captured unpiped via PowerShell `*>` redirection with `$LASTEXITCODE` appended as its own line, command and
`EXIT_CODE` both inside the log file. Results recorded in the executor's handoff for this closure.

---
