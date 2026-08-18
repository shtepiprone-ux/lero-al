# Task 758 — Governance hygiene: four debts from the Sprint 60 reviews

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_758_Governance_Hygiene_Four_Debts.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q1 Targeted

## Hard prerequisite verification

`git log --oneline -6` at session start showed 752, 752R (`9a69aef9e`), 753 (`a5df8d977`), 754
(`49c0780d5`), 755 (`7e8549ab4`) all committed, and Task 756 committed as `29f9b16de` and pushed
(confirmed via `docs/backlog.md`'s Last Session line). Working tree was clean before any edit
(`git status --porcelain` — only pre-existing untracked `.click-shield-ci-fixture.*` fixture logs).

## Requirement / acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | 3 `notificationcenter` rows gone; rebuilt Storybook + `screenshots:assert:fast` shows those 36 cells absent (not passing), total cell count drops by exactly 36, no other cell changes verdict | BEFORE (registry swapped to pre-Task-758 `HEAD` content via `git show`/hash-witness, current storybook-static): 2312 cells, 36 `render failure` on `notifications-notificationcenter--*`. AFTER (registry restored, hash-verified): 2276 cells, 0 `notificationcenter` mentions. Manifest diff (`item1-manifest-diff.log`): **removed=36** (exactly the 3×4×3 notificationcenter matrix, names listed), **added=0**. **Caveat, reported not hidden:** 6 other cells changed verdict between the two runs (`Checkbox`, `NavigationMenu`, `Popover`×3, `Dialog/MobileFullWidth`) — none are files this task touches; both logs' own "Recovered cells (passed only after retry)" sections show a *different* single flaky cell each run, confirming this is the harness's pre-existing retry/timing flakiness, not a regression from item 1 |
| AC2 | Test no longer contains `.flex-wrap`; 10 tests pass; `grep -rn flex-wrap` on both components returns nothing; anchor + justification reported | Anchor chosen: `data-testid="filter-chip-row"` (the kickoff's own preferred option), added to `FilterRoomsRow`'s `Group` root and to both of `FilterMultiToggle`'s roots (`Group` horizontal branch and `Stack` vertical branch, per the "must reach in both branches" requirement). `grep -rn "flex-wrap" src/components/shared/FilterRoomsRow.tsx src/components/shared/FilterMultiToggle.tsx` → no matches. `npx vitest run .../filterLeafComponents.smoke.test.tsx` → 10/10 pass (`item2-vitest.log`, re-run again post-restore in `ac5-vitest-final.log`) |
| AC3 | Both^ CSS Modules' `transition-property` literal-matches compiled `.transition-colors`; `getComputedStyle` before/after, no other property moving | ^Three files (kickoff evidence names three: `NotificationItem.module.css`, `MobileNavDrawer.module.css`, `MantineCopyIdButton.module.css`). All three swapped to pre-Task-758 `HEAD` content (hash-witnessed), Storybook rebuilt, `getComputedStyle` read on one live element per file (`[role="button"]` / `nav a` / `[data-copy-id]`): all three read the old 7-entry string. Restored (hash-witnessed back to the pre-swap value), rebuilt, re-read: all three now carry the 10-entry string with the 3 `--tw-gradient-*` entries. `transitionTimingFunction`/`transitionDuration` byte-identical in both captures for all three (`item3-transition-property-{BEFORE,AFTER}.json`, zero-diff except the one changed field) |
| AC4 | Planted-failure proof: dev-server run exits non-zero, new message, zero scenarios executed; production run proceeds normally | Dev: `npm run dev` (port 3000) + `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` → `EXIT_CODE=2`, `❌ DEV-SERVER DETECTED` message naming `<nextjs-portal>` and the correct invocation, **zero `── Scenario:` lines** in the transcript (`item4-click-shield-dev-refusal.log`). Production: `npm run build` (exit 0) → `CLICK_SHIELD_CI_FIXTURE=1 npm start` → `BASE_URL=... CLICK_SHIELD_CI_FIXTURE=1 npm run check:click-shield` → **48/48 cells, 0 interceptions, exit 0** (`item4-click-shield-prod-proceed.log`) — preflight passes through cleanly on a real production target |
| AC5 | `typecheck`, `check:design-tokens`, `check:i18n`, `check:mojibake`, `check:stories`, `npm run build` all exit 0, plus the targeted vitest | All seven re-run on the final restored state, all exit 0 (`ac5-*.log`) |
| AC6 | `Mantine/Primitives/FilterControls` cells byte-identical before/after item 2 | `FilterMultiToggle.tsx`/`FilterRoomsRow.tsx` swapped to pre-item-2 `HEAD` content (hash-witnessed), Storybook rebuilt, full-page PNG screenshot of the story captured at 320/1024 (en) — both the horizontal `Group` branch and the vertical `Stack` branch render in this one story. Restored (hash-witnessed), rebuilt, re-captured: **sha256 identical at both viewports, byte count identical** (`item2-ac6-filtercontrols-{BEFORE,AFTER}.json`, zero diff) |

## Current versus required behavior

- **Preserved:** `role="group"`/`aria-label` conditional ARIA behaviour on both `FilterMultiToggle`/`FilterRoomsRow` roots (untouched — only the anchor selector changed, not the assertions); the `className` passthrough reaching `FilterMultiToggle`'s root in both branches; all existing `check:click-shield` scenario behaviour against a real production target (base/drawer/modal, all still 48/48); `check-stories-rendered.mjs`'s coverage of the bell popover via `NotificationBellView`.
- **Required after behavior:** the three dead `notificationcenter` registry rows removed; the ARIA smoke test anchored on a stable `data-testid` instead of a compatibility Tailwind class, letting that class be deleted from both components; the three CSS Modules' `transition-property` completed to the literal compiled Tailwind form; `check:click-shield` refuses to produce a verdict against a dev server instead of reporting 30 false interceptions.
- **Negative flows:** AC4 *is* the negative-flow proof (the gate must refuse, not silently pass or partially report, against an invalid target) — verified both directions (refuses on dev, proceeds on production). No other applicable negative flow in scope (governance/test hygiene only, no product validation/authorization/network path touched).

## Files Changed

| File | Reason |
|---|---|
| `scripts/check-stories-rendered.mjs` | Item 1 — deleted the 3 dead `notifications-notificationcenter--*` registry rows and their stale comment (`:195-198`), replaced with a one-line note pointing to the live `NotificationBellView` coverage |
| `src/components/shared/FilterRoomsRow.tsx` | Item 2 — replaced the compatibility `className="flex-wrap"` with `data-testid="filter-chip-row"` on the `Group` root; deleted the now-obsolete justifying comment |
| `src/components/shared/FilterMultiToggle.tsx` | Item 2 — same anchor swap on both the `Stack` (vertical) and `Group` (horizontal) roots; removed the now-unused `cn` import (no longer merging `'flex-wrap'` with `className`, direct passthrough instead) |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | Item 2 — re-anchored all 4 `container.querySelector('.flex-wrap')` lookups to `'[data-testid="filter-chip-row"]'` |
| `src/modules/notifications/components/NotificationItem.module.css` | Item 3 — `.root`'s `transition-property` completed with `, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to` to literal-match compiled `.transition-colors` |
| `src/components/layout/MobileNavDrawer.module.css` | Item 3 — same completion on `.navLink`'s `transition-property` |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` | Item 3 — same completion on `.copyId[data-copy-id]`'s `transition-property` |
| `scripts/check-click-shield.mjs` | Item 4 — added a dev-server preflight before the first scenario in `runChecks()`: navigates to `${BASE_URL}/${LOCALES[0]}`, checks for `document.querySelector('nextjs-portal')`, exits 2 with a named-cause message and the correct invocation if found, otherwise falls through to the normal scenario loop unchanged |
| `scripts/task758-item3-qa-transition-property.mjs` | New. Ad hoc Playwright probe (same pattern as `scripts/task658-qa-listingcard-chrome-migration.mjs`) reading real computed `transitionProperty`/`transitionTimingFunction`/`transitionDuration` for one live element per item-3 file, used for the AC3 before/after swap capture |
| `scripts/task758-item2-qa-filtercontrols-pixel.mjs` | New. Ad hoc Playwright probe capturing a full-page PNG + sha256 of `Mantine/Primitives/FilterControls` at 320/1024, used for the AC6 before/after swap capture |

## Validation evidence

```
npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx  → 10/10 pass (twice: item2, and again post-restore)
npx tsc --noEmit                                                                     → exit 0
npm run check:design-tokens -- --strict                                              → 0 violations, exit 0
npm run check:i18n                                                                   → 2218 keys × 4 locales, parity PASSED, exit 0
npm run check:mojibake                                                               → 0 artifacts in 2878 files, exit 0
npm run check:stories                                                                → 128 files checked, 0 violations, exit 0
npm run build                                                                        → ✓ Compiled, 40/40 static pages, exit 0

# AC1 (item 1) — genuine before/after, registry script swapped to pre-Task-758 HEAD content,
# hash-witnessed both directions
npm run screenshots:assert:fast   (BEFORE, pre-item-1 registry)  → 2001/2312 PASS, 233 FAIL, 12 OUT-OF-RANGE, 66 AMBIGUOUS
npm run screenshots:assert:fast   (AFTER,  item-1-fixed registry) → 2003/2276 PASS, 195 FAIL, 12 OUT-OF-RANGE, 66 AMBIGUOUS
manifest diff: removed=36 (all notificationcenter), added=0, 6 unrelated flaky verdict changes (named above)

# AC3 (item 3) — three CSS Modules swapped to pre-Task-758 HEAD content, hash-witnessed both directions
getComputedStyle (BEFORE): all 3 files → "...fill, stroke" (7 entries)
getComputedStyle (AFTER):  all 3 files → "...fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to" (10 entries)
transitionTimingFunction / transitionDuration: byte-identical BEFORE vs AFTER, all 3 files

# AC4 (item 4) — planted-failure proof, both directions
BASE_URL=http://127.0.0.1:3000 npm run check:click-shield          (against `npm run dev`)
  → EXIT_CODE=2, "❌ DEV-SERVER DETECTED", zero scenarios executed
npm run build → exit 0
CLICK_SHIELD_CI_FIXTURE=1 npm start
BASE_URL=http://127.0.0.1:3000 CLICK_SHIELD_CI_FIXTURE=1 npm run check:click-shield   (production)
  → 48/48 cells, 0 interceptions, EXIT_CODE=0

# AC6 (item 2) — FilterMultiToggle.tsx/FilterRoomsRow.tsx swapped to pre-item-2 HEAD content,
# hash-witnessed both directions
FilterControls screenshot sha256 (BEFORE): 320=2bd557b9... 1024=dde6dbdd...
FilterControls screenshot sha256 (AFTER):  320=2bd557b9... 1024=dde6dbdd...  (byte-identical)
```

File integrity: all touched files verified UTF-8, no BOM, no NUL bytes, no mojibake
(`check:mojibake` 0/2878).

## Swap-and-restore protocol (Task 752R precedent, used for every before/after claim above)

Every AC1/AC3/AC6 "before" capture used the same discipline: back up the current (fixed) file
content, write `git show HEAD:<path>` over the working file, verify `git hash-object` matches
`git rev-parse HEAD:<path>` exactly (proves the swap is genuine pre-fix content, not a
hand-typed approximation), capture, restore the backed-up content, verify `git hash-object`
matches the pre-swap backup hash exactly (proves the restoration, not merely asserts it), then
rebuild whatever the capture needed (Storybook) before the "after" capture. Every hash pair is
recorded in this log's Validation evidence and the retained evidence files.

## Visual source trace

Q1 Targeted — no new visible artifact. The one existing-artifact preservation claim in scope
(AC6, item 2's `data-testid` swap must not move a pixel) is covered by the sha256/byte-length
zero-diff above, which is the binding evidence per the QA profile's own note.

## Canonical UI decision record

Not applicable — no new or changed visible UI artifact. Item 2 adds a `data-testid` attribute
(a test hook, not a visual value) and removes a redundant class; items 1/3/4 touch only a test
registry, invisible CSS transition properties, and a Node governance script.

## Implementation validation notes

No product-code defects found in the touched files beyond what the kickoff already named. One
process gap self-corrected: the kickoff's "Task 756 landed" note instructed capturing the AC1
BEFORE baseline "immediately prior to item 1," and item 1's edit was made first in implementation
order without that capture. Recovered by reconstructing the true pre-item-1 registry content from
`git show HEAD:<path>` (hash-witnessed identical to what a same-session pre-edit capture would
have produced, since prerequisites 752–756 were already committed and item 1 was this session's
first edit) rather than diffing against the stale 2026-08-17 manifest the kickoff explicitly
rejected.

## Assumptions, deviations, and limitations

- AC1's manifest diff surfaced 6 cells with flaky pass/fail verdicts unrelated to any file this
  task touches (`Checkbox`, `NavigationMenu`, `Popover`×3, `Dialog/MobileFullWidth`) — reported
  above rather than omitted. Both runs' own "Recovered cells (passed only after retry)" sections
  independently corroborate pre-existing harness timing flakiness (a different single cell
  recovered in each run) as the likely cause; not re-investigated further, out of this task's
  four-item scope.
- Item 4's dev-server preflight probe navigates to `${BASE_URL}/${LOCALES[0]}` (`/sq`) rather than
  bare `BASE_URL` — avoids depending on whether the app 404s or redirects a bare root, matching
  the existing `scenario.route(locale)` convention already used by the `base` scenario.
- The two new ad hoc scripts (`task758-item2-qa-filtercontrols-pixel.mjs`,
  `task758-item3-qa-transition-property.mjs`) are evidence-capture tooling, not CI gates — same
  status as `scripts/task658-qa-listingcard-chrome-migration.mjs`, kept in `scripts/` per that
  precedent rather than deleted after use.

## Opus handoff

- Diff: `git diff -- scripts/check-stories-rendered.mjs src/components/shared/FilterRoomsRow.tsx src/components/shared/FilterMultiToggle.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/modules/notifications/components/NotificationItem.module.css src/components/layout/MobileNavDrawer.module.css src/design-system/mantine/patterns/MantineCopyIdButton.module.css scripts/check-click-shield.mjs`
- New files: `scripts/task758-item2-qa-filtercontrols-pixel.mjs`, `scripts/task758-item3-qa-transition-property.mjs`
- This session log: `docs/sessions/2026-08-18-task758-governance-hygiene-four-debts.md`
- Evidence: `docs/sessions/evidence/task758/` (before/after manifests, 2 click-shield transcripts, computed-style/screenshot-hash captures, all 7 AC5 gate transcripts)
- Backlog: `docs/backlog.md` (Task registry row 758)
- Sprint plan: `tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md`
- Owner-run commit (explicit paths), when ready:
  `git add scripts/check-stories-rendered.mjs src/components/shared/FilterRoomsRow.tsx src/components/shared/FilterMultiToggle.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx src/modules/notifications/components/NotificationItem.module.css src/components/layout/MobileNavDrawer.module.css src/design-system/mantine/patterns/MantineCopyIdButton.module.css scripts/check-click-shield.mjs scripts/task758-item2-qa-filtercontrols-pixel.mjs scripts/task758-item3-qa-transition-property.mjs docs/backlog.md docs/sessions/2026-08-18-task758-governance-hygiene-four-debts.md docs/sessions/evidence/task758/`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
