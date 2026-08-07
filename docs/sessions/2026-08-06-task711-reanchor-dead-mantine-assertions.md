# Task 711 — Re-anchor `fullWidthButtonsAtMobile` / `popupBottomSheetAtMobile`

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

**Mode:** implementation (Sonnet executor, `.claude/skills/execute-task/SKILL.md`).
**Kickoff:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_711_ReAnchor_Dead_Mantine_Assertions.md`.

---

## 1. Files changed

| Path | Reason |
|---|---|
| `scripts/check-stories-rendered.mjs` | Re-anchored `fullWidthButtonsAtMobile` and `popupBottomSheetAtMobile` selectors onto measured Mantine DOM (R2, R3). Zero diff outside these two assertion blocks. |
| `scripts/assertion-liveness-registry.json` | Deleted both `mantine-only` entries for these assertions (R5) — the re-anchoring made them live; `entries: []`. |
| `docs/storybook-governance.md` | New §14.9.27 recording the census, before/after selectors, live counts, R8 finding, and the R5/R7 proofs; annotated the two related §MQ rows. |
| `docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md` | This file. |
| `docs/backlog.md` | Concise state update (see §12 below). |

Reconciled to the pre-write `git status --porcelain` baseline (§8) and the real `git diff --stat`:

```
docs/storybook-governance.md             | 92 +++++++++++++++++++++++++++++++-
scripts/assertion-liveness-registry.json | 17 +-----
scripts/check-stories-rendered.mjs       | 73 ++++++++++++++++---------
3 files changed, 139 insertions(+), 43 deletions(-)
```

**A concurrent, unrelated session's uncommitted work shares this worktree** (Task 723, "notifications
click-shield" — `package.json`, `src/design-system/mantine/MantineRootProvider.tsx`,
`src/design-system/mantine/notification-chrome.css`, `tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`,
plus its own new `scripts/check-click-shield.mjs` and session log). None of it was touched, edited, or
reverted by this task — confirmed by `git diff --stat` on only the files this task owns (above). It is
called out because it explains real operational friction encountered mid-task (§9).

---

## 2. Requirement IDs completed

| ID | AC | Verdict |
|---|---|---|
| R1 | AC1 | ✅ Live census taken at 375px against a freshly built `storybook-static`; raw dump persisted. |
| R2 | AC2 | ✅ `fullWidthButtonsAtMobile` re-anchored; resolves in 383/852 applicable cells (235 true, 148 false). |
| R3 | AC3 | ✅ `popupBottomSheetAtMobile` re-anchored; resolves in 156/852 applicable cells (156 true, 0 false). |
| R4 | AC4 | ✅ Null-contract preserved; `Mantine/Primitives/CopyIdButton/Default` yields `null` for both assertions (uses `UnstyledButton`, not `Button`; renders no popup). |
| R5 | AC5 | ✅ Pre-delete run: exit 1, `STALE-ENTRY` × 2. Post-delete run: exit 0. |
| R6 | AC6 | ✅ Reported below (§5) against both denominators, beside `heroSearchWrapInBand`'s 4/1184. |
| R7 | AC7 | ✅ Four transcripts: plant-button→false, remove-button→true, plant-popup→false, remove-popup→null. `git status` confirms both plants gone. |
| R8 | AC8 | ✅ **Stopped and reported** — 148 unplanted `false` cells found (§6); not fixed, not tolerance-loosened, not re-registered as dead. |
| R9 | AC9 | ✅ Verified by diff/grep AND by hash (`git hash-object` vs `git rev-parse HEAD:<path>`, identical for all three): `scripts/check-assertion-liveness.mjs`, `docs/critical-flow-registry.md`, `.github/workflows/governance-pr.yml` are byte-identical to `HEAD`. Zero hits on `fullWidthControlsAtMobile`, `MANTINE_VIEWPORTS`, `noHorizontalOverflow`, `heroSearchWrapInBand` inside this task's diff to `check-stories-rendered.mjs`. `package.json` shows a diff, but it is Task 723's (§1), not this task's — this task's own diff never touches it. No `src/` change was needed (R1's anchors were all pre-existing DOM; the two `data-testid` additions in `MantineDrawer.tsx`/`responsiveBottomSheet.tsx` cited as precedent already existed before this task and were not added by it). |
| R10 | AC10 | ✅ `npm run build` exit 0. Transcript: `.screenshots/task711-evidence/I8b-build.txt`. |
| R11 | AC11 | ✅ Two counting-gate passes (§13), final one after this log and the backlog update exist. |

---

## 3. Current versus required behavior

**Current (before):** both assertions queried `[data-slot="*"]` shadcn markers that Mantine-scope stories
never render. `checkedAny` was always `false` → both assertions resolved `null` in all 1184 cells (0/852
applicable). Every consumer's `=== false` check passed vacuously; the two registry entries kept this
tracked as `DEAD-KNOWN`.

**Required after (now):** both assertions are anchored on DOM the Mantine scope actually renders
(`.mantine-Button-root` + `.mantine-Button-label`; `.mantine-Drawer-content[role="dialog"]`), proven by a
live census; both resolve in ≥1 cell with their live/applicable ratio reported; a story rendering no such
element (`CopyIdButton`) still yields `null`, never `true`; `check:assertion-liveness` failed `STALE-ENTRY`
for both until the registry entries were deleted, then passed; a planted violation makes each report
`false`, and removing it restores the prior value.

**Applicable negative flows:**

| Branch | Applicable? | Result | Evidence |
|---|---:|---|---|
| Story renders a Mantine text button at <640 | Yes | resolves `true`/`false` | AC2 |
| Story renders an open popup/sheet at <640 | Yes | resolves | AC3 |
| Story renders neither (`CopyIdButton`) | Yes | `null`, never `true` | AC4 |
| Viewport ≥640 | Yes | `null` — unchanged (guard untouched) | — |
| Planted non-full-width button | Yes | `false` | AC7 |
| Planted mis-anchored popup | Yes | `false` | AC7 |
| Registry entries still present after re-anchor | Yes | `STALE-ENTRY`, exit 1 | AC5 |
| Unplanted `false` on a real story | Yes | **stopped and reported**, not fixed | AC8 |
| `fullWidthControlsAtMobile` | No — 722, zero diff here | — | AC9 |

---

## 4. The R1 census

Method: a standalone Playwright probe (temporary, not committed — see §9) started the built
`storybook-static` on a local static server, opened each candidate story at 375×812, clicked the
open-trigger for overlay primitives, and dumped tag/class/`data-*`/geometry for every button and every
element matching a broad "looks like a popup" selector.

Raw dump: `.screenshots/task711-evidence/I2-census-raw-dump.json`.

**Buttons** — `Mantine/Primitives/Button/Default` (16 instances, every documented variant),
`CountButton/Default`, `CopyIdButton/Default`. Every real Mantine `Button` instance carries
`class="… mantine-Button-root …"` (Mantine's `withStaticClasses` static class). The one
`iconOnlyBelow`-collapsed `MantineCountButton` instance (Task 571) renders `mantine-Button-root` but
**no** `mantine-Button-label` child span (its `children` render as `null` when collapsed) — the
DOM-observable substitute for the old `data-icon-only` exclusion.

**Popups** — `Modal/Default`, `Drawer/Default`, `Popover/Default`, `DropdownMenu/Default`,
`Select/Default`, `Patterns/Mantine/DialogDrawerPattern/Default`, `NavigationMenu/Default`,
`UserMenu/Default` were opened via their trigger. In **every** case, the actual open popup shape was
`<section class="… mantine-Drawer-content … mantine-Paper-root" role="dialog" …>` — including `Select`,
whose own `mantine-Select-dropdown`/`mantine-Popover-dropdown` classes stayed at `0×0` (closed) while a
`mantine-Drawer-content[role="dialog"]` opened instead. Source-level confirmation: every pattern in
`src/design-system/mantine/patterns/` (`MantineModal`, `MantineDrawer`, `MantinePopover`,
`MantineDropdownMenu`, `MantineSelect`, `MantineCombobox`, `MantineNavigationMenu`, `MantineTooltip`)
imports and renders the shared `ResponsiveBottomSheet` at `<640`, which hardcodes `position="bottom"`
(`responsiveBottomSheet.tsx:126`); `MantineDialogDrawerPattern` renders `position="bottom"` directly. No
`data-position`/`data-side` attribute is rendered by Mantine's Drawer at all (checked directly on the
`mantine-Drawer-content` element's full attribute list in the dump).

---

## 5. Both selectors, before and after

**`fullWidthButtonsAtMobile`:**

Before (`check-stories-rendered.mjs:1161`, `:1163`):
```js
document.querySelectorAll('[data-slot="button"]:not([data-icon-only])')
// ...
if (el.closest('[data-slot="button-group"]')) continue;
```

After:
```js
document.querySelectorAll('.mantine-Button-root')
// ...
if (el.closest('[role="group"]')) continue;
if (!el.querySelector('.mantine-Button-label')) continue;
```

**`popupBottomSheetAtMobile`:**

Before (`check-stories-rendered.mjs:1185-1192`, six selectors + `data-side="left"` skip):
```js
const selectors = [
  '[data-slot="dialog-content"]', '[data-slot="sheet-content"]', '[data-slot="select-content"]',
  '[data-slot="popover-content"]', '[data-slot="dropdown-menu-content"]',
  '[data-slot="navigation-menu-popup"]',
];
// ...
if (el.getAttribute('data-side') === 'left') continue;
```

After (one selector, no skip — see §6/§9 for why the skip has no live Mantine analog):
```js
document.querySelectorAll('.mantine-Drawer-content[role="dialog"]')
```

Geometry logic (parent-content-width comparison, `offsetWidth <= 1` skip, edge-to-edge + bottom-anchored
tolerance math) is byte-identical to before — only the anchors and the two exclusion conditions changed.

---

## 6. Live counts (R6) and the R8 finding

Manifest: `.screenshots/rendered-assert/2026-08-06T18-02/manifest.json` (1184 cells, 852 applicable
`width < 640`), produced by `npm run screenshots:assert -- --mantine-only` after the re-anchor landed.

| Assertion | live | true | false | live/852 | live/1184 | thin? |
|---|---:|---:|---:|---|---|---|
| `fullWidthButtonsAtMobile` | 383 | 235 | 148 | 45% | 32% | not thin |
| `popupBottomSheetAtMobile` | 156 | 156 | 0 | 18% | 13% | **thin**, but 100% clean |
| `heroSearchWrapInBand` (comparator) | 4 | 4 | 0 | 0.5% | 0.3% | thin (unchanged, out of scope) |

**R8 — an unplanted `false` was found.** `fullWidthButtonsAtMobile` resolves `false` (not merely thin) on
13 distinct enrolled stories, in every locale, at all three mobile widths:

`Mantine/Primitives/Button`, `FilterControls`, `FiltersPanelShell`, `HeroSearch`, `NotificationBellView`
(mobile-390 only); `Patterns/Mantine/FilterSection`, `FormSectionStack`, `HomeSection`,
`HomepageListingGrids`, `ListingContactPattern`, `ListingDetailPattern`, `PageHeaderWithActions`,
`TwoColumnForm`.

A direct geometry probe (`.screenshots/task711-evidence/R8-geometry-probe.json`) measured the mechanism
precisely — it is 100% consistent, not noise:

| Story | Failing button | offsetWidth | parentContentWidth | Parent |
|---|---|---:|---:|---|
| `Patterns/Mantine/TwoColumnForm/Default` | "Cancel" | 182 | 375 | `mantine-Group-root` |
| `Patterns/Mantine/TwoColumnForm/Default` | "Submit" | 182 | 375 | `mantine-Group-root` |
| `Mantine/Primitives/Button/Default` | "Filled" | 73 | 343 | `mantine-Group-root` |
| `Mantine/Primitives/Button/Default` | "Add listing" (`fullWidth`) | 343 | 343 | `mantine-Stack-root` (passes) |
| `Patterns/Mantine/ListingContactPattern/Default` | "Share" | 240 | 286 | `mantine-Group-root` |
| `Patterns/Mantine/ListingContactPattern/Default` | "Call" | 286 | 286 | `mantine-Flex-root` (passes, explicit full-width flex) |

**Every failing button's parent is a Mantine `Group`** (default content-hugging, non-stretch); **every
passing button's parent is a `Stack`** (default `align="stretch"`) or an explicitly full-width `Flex`.
This is a real, measured, systemic fact about how these stories/patterns are composed — not a selector
defect, not noise, not a false positive.

**This is not fixed here, per R8.** No tolerance was loosened, no skip was added, and the finding was not
re-registered as dead. Whether every one of these 13 stories is a genuine agent-contract clause 11
violation (mobile text controls must use the full available width) — or the ~5-week-dead assertion, once
revived, is simply asserting something stricter than several `Group`-paired secondary/tertiary button
patterns (`Cancel`/`Submit`, `Share`/`Report`, filter chips) were ever designed to satisfy — is an
owner/Opus adjudication. **Recommend registering this as a follow-up task** (a natural continuation of
721/722's Sprint 52 gate-repair track) before treating any of these 13 stories' current layout as
approved or as a defect.

---

## 7. The `STALE-ENTRY` arm (R5)

Pre-delete (`.screenshots/task711-evidence/I5-pre-delete-stale-entry.txt`), run against the same manifest
cited in §6:

```
❌ STALE-ENTRY fullWidthButtonsAtMobile — registry (Task 711) claims this is dead for scope="mantine-only",
   but it resolved true/false in 383/1184 cells. Delete this registry entry: …
❌ STALE-ENTRY popupBottomSheetAtMobile — … resolved true/false in 156/1184 cells. Delete …

Results: 3 LIVE / 0 DEAD-KNOWN / 0 DEAD-NEW / 2 STALE-ENTRY
EXIT_CODE=1
```

Registry diff: both `mantine-only` entries deleted from `scripts/assertion-liveness-registry.json`
(`entries: []`).

Post-delete (`.screenshots/task711-evidence/I5-post-delete.txt`):

```
Results: 5 LIVE / 0 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY
EXIT_CODE=0
```

---

## 8. The four planted transcripts and cleanup proof

All plants were temporary edits to existing Mantine stories, reverted before this session ends.

1. **Plant, buttons** — `src/stories/mantine/primitives/CountButton.stories.tsx`: added `w={100}` to the
   first `MantineCountButton` instance (otherwise full-width via its `Stack` parent).
   `.screenshots/task711-evidence/I6b-plant-button-matrix.txt` → manifest
   `2026-08-06T18-42`: `fullWidthButtonsAtMobile` = `false` × 12 (all locales × 3 mobile widths),
   `failingButtonLabels: ["Apply filters3"]` (label + count concatenated, confirming the exact planted
   instance was caught).
2. **Remove, buttons** — prop reverted; `git diff` on the file empty before rebuild.
   `.screenshots/task711-evidence/I6d-remove-button-matrix.txt` → manifest `2026-08-06T19-13`:
   `fullWidthButtonsAtMobile` = `true` × 12 — restored.
3. **Plant, popups** — `src/stories/mantine/primitives/CopyIdButton.stories.tsx`: added a raw
   `<div className="mantine-Drawer-content" role="dialog" style={{position:'fixed', left:20, top:20,
   width:100, height:50}}>` (real class + role, deliberately not edge-to-edge/bottom-anchored).
   `.screenshots/task711-evidence/I6f-plant-popup-matrix.txt` → manifest `2026-08-06T20-17`:
   `popupBottomSheetAtMobile` = `false` × 12, `failingPopupSlots: ["mantine-Drawer-content[role=\"dialog\"]"]`.
   **Capture note:** local port/process contention (§9) meant the raw stdout transcript for this specific
   run under-captured (the file shows a truncated early attempt); the cited manifest was independently
   re-verified by direct query (`node -e "…JSON.parse(readFileSync(…manifest.json))…"`, output pasted into
   the working session) rather than trusted from the transcript file alone.
4. **Remove, popups** — the injected `div` deleted; `git diff` on both story files empty.
   `.screenshots/task711-evidence/I6h-remove-popup-matrix.txt` (complete, 37KB, full run summary) → manifest
   `2026-08-06T21-25`: `popupBottomSheetAtMobile` = `null` × 12 — restored, and
   `fullWidthButtonsAtMobile` on `CountButton/Default` = `true` × 12 (both restorations verified in the
   same clean run).

`git status --porcelain` after all four plants, checked immediately before writing this log, shows no
diff on either story file (§1's file list has no `src/stories/**` entry) — the plants are gone.

---

## 9. Assumptions, deviations, and limitations

- **Local harness instability, root-caused.** Multiple `screenshots:assert -- --mantine-only` invocations
  during evidence capture crashed partway through or refused to start (`Port 6008 is already in use`).
  Root cause, confirmed via `Get-CimInstance Win32_Process`/`Get-NetTCPConnection`: (a) this worktree had
  a **second, concurrent, unrelated Sonnet session** actively implementing Task 723 at the same time
  (confirmed by its uncommitted diff, §1), which was very likely also driving Storybook/Playwright/dev
  processes and contending for the same machine's resources and/or port 6008; (b) at least one of this
  task's own harness invocations left an orphaned static-server child holding port 6008 after an earlier
  crash, blocking the next attempt until identified and terminated. Every cited manifest below was
  independently re-verified by direct query after the run reported completion — the numbers in §5–§8 are
  not taken on faith from a possibly-incomplete stdout capture alone.
- **The census script was temporary, not committed.** A one-off Playwright probe (`.tmp-task711-*.mjs` in
  the repo root during the session) was used for R1's census and the R8 geometry probe, then deleted
  before this log was written — it is not part of the diff and was never intended to be (R1's census
  requirement is about the DUMP being persisted and cited, not the probe script itself living in `scripts/`).
- **No `data-testid` addition was needed.** §3.6 of the kickoff flagged this as unproven either way; R1's
  census found `.mantine-Button-root`/`.mantine-Drawer-content[role="dialog"]` already sufficient and
  stable, so A2's fallback path was not exercised.
- **The `data-side="left"` skip has no re-created analog** (§5, §6 census) — every Mantine-scope popup at
  `<640` in this codebase is bottom-anchored by design (`ResponsiveBottomSheet` hardcodes
  `position="bottom"`); Mantine renders no position-indicating attribute to skip on even if one were
  needed. Documented in §14.9.27 rather than invented.
- **R8's 13-story finding is the single largest unresolved item from this task** — see §6's recommendation
  to register a follow-up task before the layout of any of those 13 stories is treated as either approved
  or defective.

---

## 10. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (pre-write) | clean | — |
| 2 | `npm run check:assertion-liveness` (baseline) | exit 0, 3 LIVE / 2 DEAD-KNOWN | `I1-baseline-liveness.txt` |
| 3 | `npm run build-storybook` (fresh, pre-census) | exit 0 | `I2-build-storybook.txt` |
| 4 | Census probe | exit 0 | `I2-census-raw-dump.json` |
| 5 | `npm run screenshots:assert -- --mantine-only` (post-re-anchor) | exit 1 (148 real fails, §6) | `I4-matrix-run.txt` |
| 6 | `npm run check:assertion-liveness` (pre-registry-edit) | **exit 1**, STALE-ENTRY × 2 | `I5-pre-delete-stale-entry.txt` |
| 7 | `npm run check:assertion-liveness` (post-registry-edit) | exit 0 | `I5-post-delete.txt` |
| 8 | Plant/remove × 2 (build-storybook + screenshots:assert × 4) | see §8 | `I6a`–`I6h` |
| 9 | Geometry probe (R8) | exit 0 | `R8-geometry-probe.json` |
| 10 | `npx tsc --noEmit` | **exit 0** | `I8a-tsc.txt` |
| 11 | `npm run build` | **exit 0** | `I8b-build.txt` |
| 12 | `npm run check:file-integrity` (pass 1) | exit 0, 12 files clean | `I9a-pass1-file-integrity.txt` |
| 13 | `npm run check:mojibake` (pass 1) | exit 0, 0 artifacts / 2088 files | `I9a-pass1-mojibake.txt` |
| 14 | `npm run check:file-integrity` (pass 2, final) | see §13 | `I9b-pass2-file-integrity.txt` |
| 15 | `npm run check:mojibake` (pass 2, final) | see §13 | `I9b-pass2-mojibake.txt` |

---

## 11. Evidence locations

All under `.screenshots/task711-evidence/` (local-only, D6):
`I1-baseline-liveness.txt` · `I2-build-storybook.txt` · `I2-census-raw-dump.json` ·
`I2-census-stderr.txt` · `I4-matrix-run.txt` · `I5-pre-delete-stale-entry.txt` · `I5-post-delete.txt` ·
`I6a`–`I6h` (build + matrix transcripts for both plants) · `R8-geometry-probe.json` ·
`R8-geometry-probe-stderr.txt` · `I8a-tsc.txt` · `I8b-build.txt` · `I9a-pass1-file-integrity.txt` ·
`I9a-pass1-mojibake.txt` · `I9b-pass2-file-integrity.txt` · `I9b-pass2-mojibake.txt`.

Manifests cited (under `.screenshots/rendered-assert/`): `2026-08-06T18-02` (main post-re-anchor run, §6),
`2026-08-06T18-42`/`19-13` (button plant/remove), `2026-08-06T20-17`/`21-25` (popup plant/remove).

---

## 12. Backlog update

Concise entry added to `docs/backlog.md`'s "Last Session" line and the task registry row for **711**,
merged on top of the current backlog state (which already carries Task 723's concurrent entry — not
touched or reordered by this task).

---

## 13. Counting gates — both passes

**Pass 1** (§10, rows 12–13), taken before this log and the backlog update existed: 12 git-changed/untracked
files, 0 integrity failures; 2088 text files scanned, 0 mojibake artifacts.

**Pass 2** (final, after this log and the backlog update exist): 11 git-changed/untracked files, 0
integrity failures (`I9b-pass2-file-integrity.txt`); 2089 text files scanned (+1 vs pass 1 — this log),
0 mojibake artifacts (`I9b-pass2-mojibake.txt`). Reconciled to `git status --porcelain`: 8 modified + 3
untracked = 11 entries, matching file-integrity's "11 file(s)" exactly. Of those 11, this task owns 4
(`scripts/check-stories-rendered.mjs`, `scripts/assertion-liveness-registry.json`,
`docs/storybook-governance.md`, this session log) plus its `docs/backlog.md` edit; the other 6 are Task
723's concurrent, untouched work (§1, §9).

**`BACKLOG LIMIT BREACH`.** `docs/backlog.md` is **96 lines** (target ~80). It was already 91 lines
before this task touched it (Task 723's concurrent "Last Session" entry + registry row); this task's
edit added a net 5 lines (updating stale 711 references in place, not appending new history). Sonnet is
not widening the file further per protocol — flagging for Opus to validate and consolidate at review
(likely by archiving the now-closed design-token-arc mentions or condensing the two concurrent "Last
Session" entries once both tasks are reviewed).

---

## 14. Standing findings not acted on (out of this task's scope)

- **721** — the four 710-review findings (`[no-boolean-assertions]` exit-2 arm, `ORPHAN-ENTRY` exit-1 arm,
  `LIVE-THIN` threshold, doc-citation fixes). **This task's §6 numbers are 721's required input** —
  `fullWidthButtonsAtMobile` at 45%/32%, `popupBottomSheetAtMobile` at 18%/13%, both non-trivial ratios for
  setting a `LIVE-THIN` threshold.
- **722** — `fullWidthControlsAtMobile`'s vacuous-true defect (§3.5 of the kickoff). Zero diff here,
  confirmed (§1, R9).
- **678** — `MANTINE_VIEWPORTS` 4-width matrix, not widened here.
- **717** — `design-tokens-allowlist.json`'s Mantine directory exemption, not touched here.
- **§23.6.c A8** — not applicable to this task's scope.
- **New — the R8 finding (§6)**: 13 stories where `fullWidthButtonsAtMobile` resolves `false` on real,
  currently-shipped layouts. Recommend a dedicated follow-up task (owner/Opus to assign a number) before
  any of these is treated as approved or as a confirmed defect.
