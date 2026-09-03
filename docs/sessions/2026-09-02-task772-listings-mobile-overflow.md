# Task 772 — `ListingsSortBar` mobile overflow: session log

**Date:** 2026-09-02, revised 2026-09-03 (probe corrections + Windows-native re-capture), revised again 2026-09-03
(authenticated validation — see §"Revision — 2026-09-03, part 2").
**Kickoff:** `tasks/Sprints/Sprint_66_kickoff_prompt_Task_772_ListingsSortBar_Mobile_Overflow.md`.
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — see §"Final status" below.
**Status corrected 2026-09-03 by owner decision** (was `BLOCKED`): AC6's first branch is satisfied — the validated
authenticated matrix passes AC2 on all 22 cells — and `BLOCKED` is mandated only by AC6's second branch
(`TASK772_AUTH_STORAGE_STATE` unavailable), which no longer holds. The pre-existing `SaveSearchButton` occlusion is
recorded below as a **non-blocking, out-of-scope finding**, which is what R5 and §3.4 require of it.

## Revision — 2026-09-03, part 2: authenticated validation

The authenticated precondition (R5a/AC6) was met and validated this session. Scope: authenticated validation only —
no new task, no ledger, no scope expansion; the UI fix and shared components were not touched unless the
authenticated run itself showed a concrete defect (it did — reported below, not fixed, per instruction).

### How the session was created, without secrets

Reused the existing precedent tool `scripts/capture-admin-session.mjs` (Task 451, unmodified) — a real Supabase Auth
login via Playwright against the running server, using `HYDRATION_ADMIN_EMAIL` / `HYDRATION_ADMIN_PASSWORD` from
`.env.local`. Output: `playwright/.auth/admin-storage-state.json`, a path covered by `.gitignore:58` (verified via
`git check-ignore -v playwright/.auth/admin-storage-state.json` → matched). The capture transcript
(`native/capture-admin-session.full.log`) records only the masked email (`agr***`, the script's own masking) and
`1 auth cookie(s) captured`; no password, token, or cookie value appears in any retained file — verified by grepping
every `native/*.log` and both `overflow.*.json` files for `password`/cookie-name patterns/JWT prefixes (`eyJ`), all
clean. `TASK772_AUTH_STORAGE_STATE` was set to the absolute path of that file for the rest of this session; it is
never written into any repo file.

### Native commands, transcripts, exit codes

| Step | Command | Exit code | Transcript |
|---|---|---|---|
| Platform/version header | `node.exe -p process.platform` / `-v` | n/a (info) | `platform=win32`, `node_version=v22.22.3`, recorded at the top of every transcript below |
| Build (unfixed code, infra for auth before-run) | `npm.cmd run build` | 0 | `native/build-before-auth.full.log` |
| Real login session capture | `npm.cmd run capture:admin-session` | 0 | `native/capture-admin-session.full.log` |
| Explicit storage-state validity check | one-off Playwright script waiting for `SaveSearchButton` attachment (deleted after use) | 0 (`SaveSearchButton ATTACHED`) | `native/auth-state-verify.full.log` |
| Probe, authenticated before-run (unfixed code) | `node.exe scripts/task772-listings-overflow-probe.mjs before` | 0 | `native/probe-before-auth.full.log` + `overflow.before.json` |
| Build (fixed code, for auth after-run) | `npm.cmd run build` | 0 | `native/build-after-auth.full.log` |
| Probe, authenticated after-run (fixed code) | `node.exe scripts/task772-listings-overflow-probe.mjs after` | 0 | `native/probe-after-auth.full.log` + `overflow.after.json` |
| Occlusion diagnostic (see below) | one-off Playwright script (`elementFromPoint`, deleted after use) | 0 | `native/auth-savesearchbutton-occlusion-diagnostic.full.log` |

The unmodified-code state for the before-run was restored the same way as in part 1: direct two-line `Edit` back to
the original, verified byte-identical to `git show HEAD:<path>` via `diff`. After the before-run, the fix was
reapplied and re-verified byte-identical to the intended two-line diff (`diff` output retained in this turn's tool
transcript) before the after-run and its build.

### Authenticated matrix results

| Run | Cells measured | `scrollWidth` overflow | Notes |
|---|---|---|---|
| `before` (unfixed) | 22 | 9 | `overflow.before.json.authCells` — same 22 cells as `buildCoreCells()` |
| `after` (fixed) | 22 | 0 | `overflow.after.json.authCells` |

Every authenticated cell records `saveSearchButtonAttached: true` and a `saveSearchButton.rect` (non-null, non-zero
in every mobile/longest-label cell). By the literal `documentElement.scrollWidth <= clientWidth + 2` metric (AC2),
all 22 `after` cells pass.

### `SaveSearchButton` residual — confirmed, pre-existing, not caused by this fix

**This is not page-level `scrollWidth` overflow — `overflow.after.json` reports `overflow: false` on every
authenticated cell.** It is a separate, independently confirmed defect at 320/375/390px (all 4 locales, both default
and longest-label cells — 16/16 mobile-width authenticated cells in both `before` and `after`):

- `sortBarRoot.rect.width` measures **`0`** in all 16 cells, in both runs. `.listings-sort-bar`'s parent wrapper
  (`ListingsShellView.tsx`'s `<div className="flex-1 min-w-0">`) collapses to zero width because its sibling
  `SaveSearchButton` (`size="lg"`, carrying the same `max-sm:w-full` as the filters button did before this fix — see
  `SaveSearchButton.tsx:71`) claims nearly the entire row (measured 288-382px depending on locale/width).
- `SaveSearchButton`'s own rect geometrically **overlaps** the sort bar's `rightGroup` (filters button + sort
  Combobox) in every one of these 16 cells — e.g. at 320×en: `rightGroup=[28,218]`,
  `saveSearchButton=[24,312]`.
- **Playwright's own actionability check refuses to screenshot `.listings-sort-bar`** (`element is not visible` —
  a 0-width element fails Playwright's visibility test), independently corroborating the collapse.
- A full-viewport screenshot (`native/auth-320-full-viewport.png`) shows the sort bar's filters button and "Newest
  first" combobox rendering normally, with **no visible bookmark icon anywhere in the row**. A highlighted screenshot
  (`native/auth-320-highlighted.png`, `SaveSearchButton` outlined 4px red via `el.style.outline`) shows its 288px-wide
  box exactly encompasses the filters+combobox pill — confirming the overlap, not just explaining an absence.
- **Root cause, confirmed via `elementFromPoint` at the bookmark icon's own coordinates**
  (`native/auth-savesearchbutton-occlusion-diagnostic.full.log`): the icon itself is `opacity: 1`, `visibility:
  visible`, `display: block` — genuinely rendered — but `document.elementFromPoint()` at its exact center returns the
  sort Combobox's label `<span class="flex-1 min-w-0 truncate">`, not the icon or its button. Per the CSS 2.1 painting
  order (Appendix E), non-positioned in-flow content (`SaveSearchButton`, `position: static`) paints in an *earlier*
  group than positioned content with `z-index: auto` (the Combobox's own wrapper is `position: relative` —
  `Combobox.tsx:278`), **regardless of DOM order**. `SaveSearchButton` is later in the DOM (`ListingsShellView.tsx:105`
  vs. the sort bar at `:94-103`) but paints *underneath* the Combobox because the Combobox is positioned and it
  isn't. The practical effect: `SaveSearchButton` is attached, computed-visible, and occupies real layout space, but
  is **fully occluded and untappable** at these widths for an authenticated user.
- **Confirmed pre-existing, not introduced by this fix**: the exact same `sortBarRoot.width: 0`, the exact same
  `rightGroup`/`saveSearchButton` coordinates, and the exact same overlap are present in **both** `before.json` and
  `after.json` — this fix's two-line diff changes only the filters button's width behavior and the sort trigger's
  height; it does not touch `SaveSearchButton`, its row, or the flex context that collapses around it. The mechanism
  is entirely `SaveSearchButton`'s own `max-sm:w-full` (out of scope — kickoff §8) interacting with the Combobox's
  `position: relative` (also out of scope — a shared primitive).
- **Not fixed, per instruction and per scope.** `SaveSearchButton.tsx`, `Combobox.tsx`, and `ListingsShellView.tsx`
  are unchanged.

At 768/1024/1440px (all 4 locales, authenticated), no overlap and no collapse:
`sortBarRoot.rect.width` is non-zero (579-1172px depending on width/locale) and `saveSearchButton` sits cleanly to
the right of `rightGroup` with a gap, in both runs — the defect is confined to the mobile widths where
`max-sm:w-full` is active.

---

> ## RECONSTRUCTED SECTION — 2026-09-03, by the reviewer (Opus)
>
> **What happened.** While applying the owner-authorized status/Files-Changed corrections, the reviewer's edit script
> matched `## Final status` inside the earlier heading `### Final status decision` and truncated this file from 369
> to 139 lines. The loss was the reviewer's, not the executor's. The file is untracked, so no Git copy existed, and
> no editor or OS backup was reachable.
>
> **Everything below this banner is reconstructed by the reviewer from the retained primary artifacts** — the two
> probe JSONs, the fifteen `native/*.full.log` transcripts, the three screenshots, and the real diff — each of which
> the reviewer had already opened and verified independently across three review rounds. **No primary evidence was
> lost or altered:** all 22 files under `docs/sessions/evidence/task772/` are intact, and both JSONs still carry
> `cells: 22` and `authCells: 22`.
>
> **Reconstruction fidelity, stated honestly:**
> - Sections rebuilt from artifacts, values re-read at reconstruction time: `Files Changed`, `Requirement and
>   acceptance-criteria evidence`, `Current versus required behavior`, `Validation evidence`, `Authenticated-state
>   result`, `Assumptions/deviations/limitations`.
> - Sections restored from the reviewer's verbatim reads of this file in earlier rounds: `Measured mechanism`,
>   `Interaction cell wait condition`, `Visual source trace`, `Canonical UI decision record`, `Implementation
>   validation notes`.
> - **Not recoverable and not invented:** the narrative detail of the 2026-09-03 probe-correction pass. Correction
>   rows 4 and 5 survive verbatim below; rows 1-3 are lost. The prose account of the transient `ChunkLoadError` /
>   stale `next start` process is also lost. Nothing has been substituted for them.

## Revision — 2026-09-03: probe corrections and Windows-native re-capture

The probe was corrected and both phases were re-captured natively. **Two of the five correction rows survive
verbatim; rows 1-3 were lost in the reviewer's truncation and are deliberately not reconstructed from memory.**

| # | Defect in the pre-fix probe | Correction |
|---|---|---|
| 1-3 | **LOST** — not reconstructed. The corrected probe is the authoritative record of its own behavior. | — |
| 4 | `SaveSearchButton`'s own rect was never captured, so a residual authenticated-only overflow could never be attributed to it | `measureSortBar()` now takes a selector param and returns `saveSearchButton: { rect, found }`. Selector: `button:has(svg.lucide-bookmark)` — locale-independent (lucide-react stamps `lucide-<icon-name>` on every icon's `<svg>` regardless of the translated label; verified in `node_modules/lucide-react/dist/esm/createLucideIcon.mjs`), since `SaveSearchButton.tsx` carries no test id and is out of scope to add one (kickoff §8) |
| 5 | Exit code only checked `result.cells` — a hard failure in the interaction cell, negative-flow cells, or (new) authenticated cells never flipped it | `main()` now computes `hardFail` from `anonFailedCells`, `authFailedCells`, `negativeFlowFailedCells` (excluding documented `skipped` entries), and `interactionFailed` (derived from `ok`/`error`/`filtersDrawerOpened`/`sortUrlUpdated`) |

`renderedCountText` was also added on every cell, so the `total === 0` / `total === 1` negative-flow cells carry
their rendered proof (`"0 listings"` / `"1 listing"`) in the JSON rather than as an unretained claim.

## Pre-dispatch precondition check (§5.0)

**Superseded 2026-09-03 part 2.** The first pass found `TASK772_AUTH_STORAGE_STATE` empty and proceeded with the
anonymous scope per §5.0's dispatch-disposition table. The variable was subsequently set to a real, validated
session and the authenticated matrix ran in full; see §"Revision — 2026-09-03, part 2" above. The final
`authState.status` is `AUTH_STATE_VALID` in **both** `overflow.before.json` and `overflow.after.json`.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/listings/components/ListingsSortBar.tsx` | Two call-site-only Tailwind class additions: `max-sm:w-auto` on the mobile filters `Button` (cancels the inherited `max-sm:w-full` from `size="lg"`, the measured overflow mechanism) and `triggerClassName="max-sm:min-h-11"` on the sort `Combobox` (raises its 36px trigger to the 44px touch-target floor below `sm`, per `docs/design-system.md` §12a's height ladder). No other line in the file changed. |
| `scripts/task772-listings-overflow-probe.mjs` | New task-owned Playwright route probe, modelled on `scripts/task766-route-shell-probe.mjs`. Not wired into `package.json` or CI. Revised 2026-09-03 — see §"Revision — 2026-09-03". |
| `docs/sessions/evidence/task772/overflow.before.json`, `overflow.after.json`, `auth-state.before.txt`, `auth-state.after.txt` | Retained probe evidence, both phases; each JSON carries `cells` (22 anonymous) and `authCells` (22 authenticated) from the same run. Re-captured 2026-09-03 against the corrected script. |
| `docs/sessions/evidence/task772/native/*.full.log`, `*.png` | Fifteen Windows-native transcripts (PowerShell, `node.exe` / `npm.cmd` / `npx.cmd`) plus three screenshots. Every log opens with `platform=win32`, `node_version=v22.22.3`, `cwd=C:\Claude_Code_Projects\lero-al`, the exact command, and closes with `exit_code=`. Full retained output, not a paraphrase. |
| `docs/backlog.md` | Task 772 registry row, the Sprints-section line and the Pending-Action row moved to the final state. Line count unchanged at 68 (limit 80). |
| `tasks/Sprints/Sprint_66_Listings_Mobile_Overflow.md` | Sprint 66 Tasks table — the sprint's single state source — moved to the final state in the same edit as this log and `docs/backlog.md` (the 2026-08-10 fourth-occurrence corollary). |
| `docs/sessions/2026-09-02-task772-listings-mobile-overflow.md` | This session log — the task's completion report and index to the evidence. |
| `playwright/.auth/admin-storage-state.json` | **Not committed** — git-ignored (`.gitignore:58`). Created by the existing `scripts/capture-admin-session.mjs` via a real login; no credential value is written into this repository. Listed for completeness only. |

## Requirement and acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R1 / AC2 | **PASS** | `overflow.after.json`: 0/22 `cells` and 0/22 `authCells` report `overflow: true`. Comparator in the probe is `scrollWidth > clientWidth + 2`, exactly AC2's metric. |
| R2 / AC3 | **PASS** | `overflow.after.json.interaction`: `ok: true`, `filtersDrawerOpened: true`, `sortUrlUpdated: true`, `finalUrl: http://127.0.0.1:3000/en/listings?sort=price_asc`. Asserted on the Mantine drawer content element per kickoff §3.7. |
| R3 / AC4 | **PASS** | 16/16 anonymous **and** 16/16 authenticated mobile-width cells report `filtersButton.rect.height = 44` and `sortComboboxTrigger.rect.height = 44`. |
| R4 / AC7 | **PASS** | Real diff is two lines in `ListingsSortBar.tsx`. `SaveSearchButton.tsx`, `Combobox.tsx`, `ListingsShellView.tsx` and `src/components/ui/button.tsx` are unmodified (`git status --porcelain`). The two temporary diagnostic scripts were removed; `scripts/capture-admin-session.mjs` is a pre-existing tracked tool. |
| R5 / R5a / **AC6** | **PASS — first branch** | `authState.status: AUTH_STATE_VALID` in both phases, `storageStatePath` = git-ignored `playwright\.auth\admin-storage-state.json`. All 22 `authCells` pass AC2's metric, satisfying AC6's *"either they all pass"* branch. The `SaveSearchButton` residual is reported below as a finding, unfixed, per R5. |
| R6 / AC5 / AC5a | **PASS** | All 6 desktop-regression cells are byte-identical between `before` and `after`; `filtersButton.rect` is `0x0` (absent, `md:hidden` intact) and `gridListToggle.rect.width = 64` at every one. |
| R7 / AC1 | **PASS** | `overflow.before.json`: 16 of 22 core cells overflow (all 320/375/390 x 4-locale default cells, plus all 4 longest-label cells) — all at `overflowBy: 132`. The 6 desktop-regression core cells do not overflow. **Correction (2026-09-03):** both negative-flow cells (`negative-flow-total-0`, `negative-flow-total-1`, both at 375xen) also overflowed in `before`, at the same `overflowBy: 132` — an earlier draft of this row incorrectly stated they did not. The authenticated `before` matrix reproduces independently: 9/22 cells, `overflowBy` between 11 and 72 depending on locale and width. No cell was dropped; every measured cell is present in the JSON, overflowing or not. |
| R8 / AC8 | **PASS** | `native/build-final.full.log`: `npm.cmd run build`, `platform=win32`, `exit_code=0`, on the final fixed-code diff. |

## Current versus required behavior

**Current (measured, `before`).** Anonymous: at 320/375/390px in all four locales `documentElement.scrollWidth`
exceeds `clientWidth` by a constant **132px**, independent of viewport width and locale. The widest overflowing
element in every overflowing cell is the sort `Combobox`'s own wrapper (`div.relative.w-auto.min-w-35`, 140px),
rendering **outside** the right-hand group's box. Authenticated: 9 of 22 cells overflow, by 11-72px — a different
profile, because `SaveSearchButton` changes the row's flex arithmetic.

**Required (measured, `after`).** Identical cells, `overflow: false` in all 22 anonymous **and** all 22
authenticated cells. Filters trigger and sort control remain usable (interaction cell). Every interactive mobile
control is at least 44px. Desktop 768/1024/1440 byte-identical to `before`.

**Negative flows applicable per §11:**

| Branch | Result |
|---|---|
| Authenticated vs anonymous | Both measured, both PASS at the AC2 metric. The `SaveSearchButton` residual is reported below, not fixed. |
| Authenticated session unavailable | No longer applicable — `AUTH_STATE_VALID` in both phases. Retained for the record: the first pass recorded `AUTH_STATE_UNAVAILABLE` with its failing condition named. |
| `total === 0` | `?price_min=40001` (one above the seed data's measured max price of 40000, read live). `overflow: false`; `renderedCountText: "0 listings"` retained in the JSON. |
| `total === 1` | The two seed listings tie on price, so the cell discriminates on `property_type=house`. `overflow: false`; `renderedCountText: "1 listing"` — the singular `found_results_one` string, retained in the JSON rather than asserted. |
| Longest-label locale | `sort=price_desc` selected before measuring, one cell per locale at 320px: all 4 `overflow: false` in `after`, all 4 `overflow: true` in `before`. |

## Measured mechanism (§14, kickoff §3.2)

The §3.2 hypothesis **matched**. The mobile filters `Button` (`size="lg"`) carries `max-sm:w-full` from its shared
variant, and below 640px it resolves to `width: 100%` inside the `shrink-0` right-hand group. The `before` JSON shows
the concrete effect: the group's own box collapses to exactly the button's rendered width (190px in the 320px cell),
and the sibling `Combobox` (140px, from `min-w-35`) renders starting immediately after that box — past the group's
right edge and past the viewport — rather than being included in the group's layout box or shrunk. The overflow
amount (132px in every anonymous mobile cell) is a function of the combobox's own width and gap, not of the
viewport — consistent with a fixed-size element rendering outside flow rather than a proportionally-scaling one.

**Fix applied:** cancel `max-sm:w-full` on the filters button via `max-sm:w-auto` in its own `className` (the button
is icon-only below 640px — its label is already `hidden sm:block` — so it never needed full width there). This is a
call-site-only override; `src/components/ui/button.tsx`'s size map is untouched, so every other `size="lg"` consumer
keeps its existing mobile full-width behavior. Verified via `tailwind-merge` (`cn()` in `src/lib/utils.ts`): a later
`max-sm:w-auto` in the passed `className` deterministically wins over the earlier `max-sm:w-full` supplied by the
CVA variant, while `max-sm:h-auto` and `max-sm:min-h-11` from the same variant survive as different utility groups.

The 44px sort-trigger fix (R3) is a separate, independent change (`triggerClassName="max-sm:min-h-11"`) — CSS
`min-height` wins over a smaller `height` regardless of source order, so `h-9` (36px, from `Combobox`'s own
`size="sm"` map, untouched) and `max-sm:min-h-11` (44px floor, call-site only) coexist exactly the same way
`button.tsx`'s own `size="lg"` already combines `h-9` with `max-sm:min-h-11`. Confirmed by the desktop cells, where
`sortComboboxTrigger.rect.height` stays **36** in both phases — the floor applies only below `sm`.

## Authenticated-state result

`AUTH_STATE_VALID` in both phases, from a real login captured by the pre-existing
`scripts/capture-admin-session.mjs` (`native/capture-admin-session.full.log`, exit 0) into the git-ignored
`playwright/.auth/`. Session validity was confirmed independently before measuring
(`native/auth-state-verify.full.log`: `SaveSearchButton ATTACHED — storage state is valid`, exit 0).

The authenticated matrix ran the same 22 cells in both phases: **9/22 overflowing in `before`, 0/22 in `after`.**
Every authenticated cell records `saveSearchButtonAttached: true` (22/22 in both phases), so the dynamic
`ssr: false` component was attached before measurement in every cell and no cell is an anonymous layout carrying an
authenticated label.

The `SaveSearchButton` occlusion residual is documented in full in §"`SaveSearchButton` residual" above, with its
geometry, screenshots and `elementFromPoint` root cause. It is not page-level `scrollWidth` overflow, it is
byte-identical in `before` and `after`, and it is left unfixed per scope.

## Interaction cell wait condition (§3.7, §14)

A fixed **500ms** post-load delay was used before interacting with the filters trigger, to let `MantineDrawer`'s
`isMobile` `useEffect` (`useMediaQuery('(max-width: 40em)')`, resolved post-hydration) settle before the drawer could
be opened. This is stated as the exact wait condition used, not as proof one was necessary in every case; it is
recorded in the artifact itself as `interaction.waitConditionUsed`. The interaction cell passed on both the `before`
and `after` runs, opening the bottom-sheet form rather than the desktop side-drawer branch.

For the authenticated cells the wait condition is an 8-second `waitFor({ state: 'attached' })` on the
`SaveSearchButton` node (`button:has(svg.lucide-bookmark)`) before measuring.

## Validation evidence

All fifteen transcripts are under `docs/sessions/evidence/task772/native/`. Every one opens with `platform=win32`,
`node_version=v22.22.3`, `cwd=C:\Claude_Code_Projects\lero-al` and the exact command, and closes with `exit_code=`.

| Transcript | Command | Exit | Purpose |
|---|---|---:|---|
| `typecheck-final.full.log` | `npx.cmd tsc --noEmit` | 0 | final fixed-code state |
| `build-final.full.log` | `npm.cmd run build` | 0 | **AC8 / R8 evidence**, final fixed-code diff |
| `build-before.full.log` | `npm.cmd run build` | 0 | infra build on UNFIXED code, for the anonymous before-probe |
| `build-before-auth.full.log` | `npm.cmd run build` | 0 | infra build on UNFIXED code, for the authenticated before-probe |
| `build-after-auth.full.log` | `npm.cmd run build` | 0 | final fixed code, for the authenticated after-probe |
| `mojibake-final.full.log` | `npm.cmd run check:mojibake` | 0 | after all task772 evidence files existed |
| `mojibake-postdocs.full.log` | `npm.cmd run check:mojibake` | 0 | after session log / backlog / Sprint 66 edits |
| `mojibake-final-auth.full.log` | `npm.cmd run check:mojibake` | 0 | authoritative final pass (0 artifacts in 3644 files) |
| `probe-before.full.log` | `node.exe scripts/task772-listings-overflow-probe.mjs before` | 0 | anonymous before |
| `probe-after.full.log` | `node.exe scripts/task772-listings-overflow-probe.mjs after` | 0 | anonymous after |
| `probe-before-auth.full.log` | `node.exe scripts/task772-listings-overflow-probe.mjs before` | 0 | UNFIXED code, authenticated before |
| `probe-after-auth.full.log` | `node.exe scripts/task772-listings-overflow-probe.mjs after` | 0 | FIXED code, authenticated after |
| `capture-admin-session.full.log` | `npm.cmd run capture:admin-session` | 0 | real login, output to git-ignored path |
| `auth-state-verify.full.log` | `node.exe scripts/task772-verify-auth-state-tmp.mjs` | 0 | storage-state validity, temp script since removed |
| `auth-savesearchbutton-occlusion-diagnostic.full.log` | `node.exe scripts/task772-inspect-auth-tmp.mjs` | 0 | `elementFromPoint` root cause, temp script since removed |

Screenshots: `native/auth-320-full-viewport.png`, `native/auth-320-highlighted.png`, `native/auth-320-page-top.png`.

All server evidence is from `next start` (production), never `next dev` — the probe fails closed on
`<nextjs-portal>` detection, and `devServerDetected: false` is recorded on every cell of every phase. Zero cells in
either phase carry a `failReason`.

**What may not be cited as proof.** No Storybook matrix result and no component-scoped gate is presented as route
evidence for R1-R3 (`docs/maintenance-playbook.md` §14.3). The probe's own output is the proof.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility/cascade/token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Mobile filters trigger width below 640px | `ListingsSortBar.tsx:62-67` `<Button>` | `size="lg"` variant → `max-sm:w-full`; call-site `max-sm:w-auto` added | `src/components/ui/button.tsx:27` (`size.lg`, untouched) + call-site override | **Change** (call-site only) | `overflow.before.json` / `overflow.after.json`, `filtersButton.rect` |
| Sort trigger height below 640px | `ListingsSortBar.tsx:78-86` `<Combobox triggerClassName>` | `size="sm"` → `h-9`; call-site `triggerClassName="max-sm:min-h-11"` added | `src/components/shared/Combobox.tsx:185` (`heights.sm`, untouched) + call-site override | **Change** (call-site only) | `overflow.after.json`, `sortComboboxTrigger.rect.height = 44` on all mobile cells |
| Active-filter badge | `ListingsSortBar.tsx:70-74` | `absolute -top-1.5 -right-1.5 ...` | unchanged | **Preserve** | Not touched — same lines before/after |
| `showing_results` visibility | `ListingsSortBar.tsx:52-56` | `hidden sm:block` | unchanged | **Preserve** | Not touched |
| Grid/list toggle | `ListingsSortBar.tsx:88-105` | `hidden sm:flex` | unchanged | **Preserve** | Desktop cells: `gridListToggle.rect.width = 64`, identical before/after |
| `listings-sort-bar` class hook | `ListingsSortBar.tsx:46` | unchanged (D33) | n/a | **Preserve** | Not touched |

## Canonical UI decision record

Both changes are `className` / `triggerClassName` overrides at an existing call site of already-canonical shared
primitives (`Button`, `Combobox`) — disposition **`reuse`** for both. Per `docs/design-system.md` §12a's height
ladder (`Combobox`/`Select`/`Input` `size="sm"` = 36px, "never the primary tappable control at `<sm`") and the
existing `max-sm:min-h-11` pattern already used by `button.tsx`'s own size map, `max-sm:min-h-11` on the trigger is
the canonical mobile-safe correction, applied at the call site per the task's explicit instruction (§10.3: no edit
to `Combobox`'s own size map). No new visual value, token or primitive was created; nothing required registration;
no Storybook story was added, extended or removed.

## Implementation validation notes

- The §3.2 mechanism hypothesis was confirmed by direct measurement, not assumed — see "Measured mechanism".
- No shared primitive (`button.tsx`, `Combobox.tsx`) was edited, per scope.
- No Storybook story was added, changed or removed.
- No de-Tailwind or unrelated utility conversion occurred in `ListingsSortBar.tsx`.
- Both changes use scale values; no arbitrary-value utility was introduced, so no `design-tokens-allow:` marker was
  needed.

## Assumptions, deviations, limitations

- The `total === 1` negative-flow cell discriminates on `property_type` rather than `price_min` because the two seed
  listings tie on price (both 40000 ALL) — a fact about the current seed data, not a task deviation; recorded in
  `overflow.after.json.negativeFlow[*].seedDataFilters`.
- The interaction cell's `isMobile`-settle wait is a fixed 500ms delay, not an event-based wait (no observable DOM
  signal exists for "the `useMediaQuery` effect has committed" short of the drawer's own open state, which is what is
  being asserted).
- No cell was measured in the 640-767px band. The fix cannot affect it (`max-sm:` applies only below 640px), so this
  is unmeasured residual risk outside the task's scope, not a regression of this change.
- The probe's `saveSearchButton` attach-timeout branch sets `saveSearchButtonAttached: false` without a `failReason`,
  so it does not reach the exit-code gate. It never fired here (`true` in 22/22 cells of both phases), so the
  retained evidence is unaffected. **Owner decision 2026-09-03: P3 probe improvement, not a condition of accepting
  this task.**
- This log's reconstruction limits are stated in the banner above.

## Final status

**`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — corrected 2026-09-03 from `BLOCKED`, by owner decision.

| Criterion | Result |
|---|---|
| Anonymous matrix | 16/22 → **0/22** overflow |
| Authenticated matrix, real validated storage state | 9/22 → **0/22** overflow |
| `npm.cmd run build` · `npx.cmd tsc --noEmit` · `npm.cmd run check:mojibake` | `exit_code=0` each, `platform=win32` |
| Scope | two call-site lines in `ListingsSortBar.tsx`; no shared primitive touched |
| Touch targets | 44px on both mobile controls, 16/16 anonymous **and** 16/16 authenticated cells |

**Why this is not `BLOCKED`.** AC6 reads: *"either they all pass, or the completion report names the residual…"*.
All 22 authenticated cells pass AC2's metric, so AC6's first branch is satisfied. `BLOCKED` is mandated only by
AC6's second branch — `TASK772_AUTH_STORAGE_STATE` unset, missing, or not validating — which no longer applies. The
earlier `BLOCKED` came from reading "overflow" substantively rather than as AC2's metric; that reading was referred
to the owner as a judgment call, and the owner decided it.

**`SaveSearchButton` occlusion — non-blocking, out-of-scope finding.** Pre-existing and unrelated to this fix:
`rightGroup` `[28, 218]` and `saveSearchButton` `[24, 312]` are byte-identical in `before` and `after` across all 16
authenticated mobile cells, and `sortBarRoot.rect.width` is `0` in both. The mechanism is `SaveSearchButton`'s own
`max-sm:w-full` collapsing `ListingsShellView`'s `flex-1 min-w-0` wrapper, plus CSS 2.1 Appendix E painting order
against a positioned sibling. **Owner decision, 2026-09-03: recorded here as a finding only — no new task number is
created or reserved, and `SaveSearchButton.tsx`, `Combobox.tsx` and `ListingsShellView.tsx` are not to be changed.**
All three remain unmodified.

**Review ledger.** Not required and not created: `8e4503a36` (*"docs: exempt frontend reviews from ledger
requirement"*) exempts frontend implementation work — components, pages, styles, browser-visible behavior — in
`docs/agent-contract.md`, `docs/orchestrator-procedures.md` and `docs/orchestrator-role.md`. The reviewed diff,
evidence, findings and decision are recorded here and in the review response instead.

Sonnet has no approval authority; this status is not a self-approval. Orchestrator review of this record was
completed on 2026-09-03 with decision **`APPROVED`**.
