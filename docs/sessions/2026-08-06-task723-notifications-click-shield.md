# Task 723 — Notifications click-shield: unstretch the `bottom-*` containers and add the missing hit-test gate — session log

**Task path:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_723_NotificationsClickShield.md`
**Status:** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`

---

## 1. Start gate

`git status --porcelain` at session start showed pre-existing uncommitted changes NOT owned by this task, apparently
from a concurrent/prior session working Sprint 52's design-token arc: `scripts/assertion-liveness-registry.json`,
`scripts/check-stories-rendered.mjs` (modified), `.tmp-task711-census.mjs`, `.tmp-task711-geometry-probe.mjs`
(untracked). Confirmed throughout the session by process inspection: a foreign `next dev` process (PID 27484,
started 2026-08-05) and a foreign process bound to port 3001 (PID 32028) were present and left untouched. A further
foreign file, `src/stories/mantine/primitives/CopyIdButton.stories.tsx`, appeared modified mid-session (a Task 711
planted-violation fixture) — also never touched by this task. **None of these paths appear in this task's diff or
Files Changed table below.**

---

## 2. Requirement ledger / current vs. required behavior

Restated from the kickoff (§2–§4): Task 684's `<Notifications position="top-right" top={{ base: 97, sm: 65 }} />`
applied a component-level `top` prop that Mantine emits as a class rule unqualified by `[data-position]`, reaching
all six position containers Mantine always renders (`top-left/center/right`, `bottom-left/center/right`). The three
`bottom-*` containers already carry Mantine's own `bottom: var(--mantine-spacing-md)`
(`:where([data-position='bottom-*'])`, specificity 0), so the added `top` pinned both edges and stretched each to
full viewport height. No stylesheet in the project ever set `pointer-events` on `.mantine-Notifications-root`, so
each stretched container was click-solid by default.

- **R1** — the three `bottom-*` containers must resolve to height 0 with no notification present.
- **R2** — `.mantine-Notifications-root` gets `pointer-events:none`; `.mantine-Notification-root` (the individual
  toast, singular) gets `pointer-events:auto` back. Defence-in-depth, independent of R1.
- **R3** — header clearance (97px `<640`, 65px `≥640`) preserved, measured on the real rendered toast.
- **R4** — new blocking hit-test gate, `scripts/check-click-shield.mjs`.
- **R5** — planted-violation round trip proving the gate catches this exact defect.

---

## 3. Reproduction (I1, before any code change)

Reproduced on a local dev server (`http://localhost:3005/en`) with a temporary Playwright probe (not part of the
diff, deleted before final report): at every `MANTINE_VIEWPORTS` width the three `bottom-*` containers measured
440–358px wide × non-zero height (e.g. `desktop-1024`: `bottom-right` 440×687 @ (568,65)), `pointer-events: auto`,
and `document.elementFromPoint()` at real homepage controls' centres returned
`div.mantine-Notifications-root` instead of the control — byte-for-byte the same mechanism the kickoff's production
probe (§2) describes. 6–11 interceptions per viewport were observed (search inputs, filter/search buttons, the
"View all" link, bottom-nav items, the favorites icon), confirmed again later on a real production build (§6).

---

## 4. Fix

**`src/design-system/mantine/MantineRootProvider.tsx`** — removed the component-level `top={{ base: 97, sm: 65 }}`
prop; `<Notifications position="top-right" />` now carries no placement props.

**`src/design-system/mantine/notification-chrome.css`** — added:

```css
.mantine-Notifications-root[data-position^="top"] { top: 97px; }
@media (min-width: 40em) {
  .mantine-Notifications-root[data-position^="top"] { top: 65px; }
}
.mantine-Notifications-root { pointer-events: none; }
.mantine-Notification-root { pointer-events: auto; }
```

The attribute selector (specificity 0,2,0) beats Mantine's own `:where()` per-position rules (specificity 0) without
`!important`, and is scoped to `[data-position^="top"]` so the `bottom-*` containers never receive a `top` value —
R1's actual mechanism. `notification-chrome.css` is under the `src/design-system/mantine` path-level allowlist in
`scripts/design-tokens-allowlist.json`, so the raw `97px`/`65px`/`40em` values need no `design-tokens-allow` marker
(consistent with the file's pre-existing `340px`/`#98A2B3`).

**`scripts/check-click-shield.mjs`** (new) — R4's gate. **`package.json`** — registers
`check:click-shield` / `check:click-shield:verify`.

---

## 5. Canonical UI decision record

| Visible artifact | Search | Disposition | Consumed source |
|---|---|---|---|
| Notifications position-container placement/pointer-events | Read `MantineRootProvider.tsx`, `notification-chrome.css`, Task 684's session log, `node_modules/@mantine/notifications` compiled CSS/`.mjs` for the exact selectors/specificity in play | **extend** — the canonical owner is the existing `notification-chrome.css` stylesheet (Task 550/684's established mechanism for this component); no new primitive, no local/component style | `src/design-system/mantine/notification-chrome.css`, imported by both `src/app/layout.tsx` and `.storybook/preview.tsx` |

No visible chrome/typography/spacing changed — this is a placement-mechanics-only fix (kickoff §3, "no call-site
changes"), so no TailAdmin side-by-side was required.

---

## 6. Validation evidence

All rect/hit-test evidence below was captured against a **real local production build** (`npm run build` →
`npm start`, port 3006) unless noted; the dev-mode debug-toast harness (§6.4) is the one exception, per its own
note.

### 6.1 — R5 planted-violation round trip (production build, real app code, not a synthetic self-test)

**Before** (both files reverted to the exact `081c03e7f`/pre-Task-723 content — confirmed zero `git diff` against
`HEAD`, since neither file's fix was ever committed): fresh `npm run build` (exit 0) → `npm start` (port 3006) →
`node scripts/check-click-shield.mjs --route=/en`:

```
Cells: 4  Elements checked: 55  Interceptions: 36  Empty-candidate cells: 0
❌ 36 click-shield interception(s) found
```

33 of 36 interceptions name `div.mantine-Notifications-root` as the interceptor (the remaining 3, all at
`mobile-390`, name a different element — see §7). Exit code non-zero. **Matches R5's "before" requirement exactly.**

**After** (fix restored, fresh `npm run build`, exit 0, `npm start` port 3006, gate re-run across all 4 locales):
**zero** of the 221 checked elements across 16 cells are intercepted by `mantine-Notifications-root` — the specific
regression this task fixes is eliminated with **0 exceptions**. (The run's overall exit code is still 1 for an
unrelated reason — §7.)

### 6.2 — AC1: bottom-* container geometry, all 16 cells (4 `MANTINE_VIEWPORTS` × 4 locales)

Every `bottom-{left,center,right}` container: `height: 0`, `pointer-events: none`, at every width/locale, no
notification present. Every `top-{left,center,right}` container: `height: 0` (idle) with `top: 97px` (`<640`) or
`top: 65px` (`≥640`), `pointer-events: none`. Full 16-cell JSON captured; representative rows:

| Width | Locale | `bottom-right` height | `bottom-right` computed top/bottom | `top-right` computed top |
|---:|---|---:|---|---|
| 320 | sq/en/uk/it | 0 | `796px` / `16px` | `97px` |
| 375 | sq/en/uk/it | 0 | `796px` / `16px` | `97px` |
| 390 | sq/en/uk/it | 0 | `828px` / `16px` | `97px` |
| 1024 | sq/en/uk/it | 0 | `752px` / `16px` | `65px` |

Identical across all 4 locales at every width — no locale-dependent divergence. **AC1 MET.**

### 6.3 — AC2: pointer-events, all 6 containers × 16 cells

`getComputedStyle('.mantine-Notifications-root').pointerEvents === 'none'` for all six position containers, at
every cell (96 container reads total, 0 exceptions). **AC2 MET.**

### 6.4 — AC4: header clearance on the real rendered toast (dev-mode harness, R3)

Firing a real toast requires an authenticated `toast.error()` call site; no seeded test session was available in
this environment. Reproduced Task 684 §5's exact methodology: a temporary 1×1px invisible trigger
(`src/components/shared/_Task723DebugToastTrigger.tsx`) wired into `src/app/layout.tsx`, calling the real, shipped
`toast.error()` adapter (`src/lib/toast.ts`) — no debug-only toast path. **Both files were fully reverted before this
report**; final `git diff` against `layout.tsx` is empty (verified below).

16-cell capture (all `MANTINE_VIEWPORTS` × all 4 locales), on a clean dev server:

| Width | `header.bottom` | `toast.top` | overlap | `computedTop` | `scrollWidth===innerWidth` | close-button hit-testable |
|---:|---:|---:|---|---|---|---|
| 320 | 97 | 97 | No | `97px` | Yes | Yes |
| 375 | 97 | 97 | No | `97px` | Yes | Yes |
| 390 | 65 | 97 | No (over-cleared, Task 684 D3-ratified band) | `97px` | Yes | Yes |
| 1024 | 65 | 65 | No | `65px` | Yes | Yes |

All 16 cells identical in shape across `sq`/`en`/`uk`/`it`. Values are byte-identical to Task 684's originally
shipped/approved offsets — this task changes placement **mechanism**, not the offset schedule. **AC4/R3 MET,** and
N1 (visible toast stays clickable) confirmed via the close-button hit-test column.

Harness removal proof:

```
$ git diff -- src/app/layout.tsx
(empty)
$ git status --porcelain -- src/components/shared/
(empty — _Task723DebugToastTrigger.tsx never committed, deleted before this report)
```

### 6.5 — AC3 / AC5: homepage hit-test, all 16 cells, production build

```
Cells: 16  Elements checked: 221  Interceptions: 9  Empty-candidate cells: 0
```

**0 of the 9 residual interceptions name `mantine-Notifications-root`** (confirmed by inspecting every interceptor
in the run's own output — all 9 are `MobileBottomNavView_navItem*` or a `span.navItemLabel`, never the Notifications
class). `desktop-1024` is clean at all 4 locales (0/4). `mobile-320` is clean at 3/4 locales. **AC5 is independently
confirmed**: the bottom nav's own items (Home/Listings/Add listing/Favorites/Login) are never themselves reported as
*blocked* in any of the 16 cells — only two other elements ("View all", the favorites heart icon) are blocked, and
never by a nav item. See §7 for the residual finding and why AC3 is not 100% green.

### 6.6 — Gate self-test (R4, R5 mechanism proof, CI-safe)

`npm run check:click-shield:verify`:

```
✅ Planted shield (transparent div over a button): checked=1, violations=1 (expected >0)
✅ Clean page (no shield): checked=1, violations=0 (expected 0)
✅ N6 exemption (mantine-Overlay-root shield): checked=1, violations=0 (expected 0)
✅ GATE IS FUNCTIONAL
```

### 6.7 — Standard gates

| Command | Result |
|---|---|
| `npm run build` (final, clean tree, fresh `.next`) | **exit 0** — `Compiled successfully`, 40/40 pages, matches baseline |
| `npm run typecheck` | **exit 0** |
| `npm run lint` | **exit 0** — 0 errors, 55 pre-existing warnings (none in touched files) |
| `npm run check:design-tokens` | **exit 0** — 0 violations |
| `npm run check:file-integrity` | **exit 0** — 9/9 git-changed files clean |
| `npm run check:mojibake` | **exit 0** — 0 artifacts / 2087 files |
| `npm run check:i18n` | **exit 0** — 2215×4 keys, parity clean, no new strings (placement-only change) |
| `BASE_URL=http://localhost:3005 npm run check:hydration` (fresh `next dev`) | **exit 0** — 4 PASS, 0 FAIL, 3 SKIP (no seeded session/listing, documented gap). First attempt against a server that had been running through several restarts showed 1 transient FAIL on `Listings list (en)`; killed the server, cleaned `.next`, restarted fresh, reran clean — the exact documented precedent in `docs/sessions/2026-07-27-task670-hero-fallback-mantine-geometry.md` ("stale Turbopack HMR cache", Task 582), not a regression. |
| `npm run screenshots:assert -- --mantine-only` | Completed with **1002/1184 PASS, 160 FAIL, 22 AMBIGUOUS**. **Root-caused, not attributable to this diff** — see §8. The 22 AMBIGUOUS count matches Task 684's documented pre-existing baseline exactly. |

---

## 7. New finding — pre-existing, out-of-scope defect exposed by this fix

The more thorough hit-testing this task adds surfaces a **second, unrelated, pre-existing** click/visual collision:
at `mobile-375`/`mobile-390` (and `it@320`, where longer localized text shifts layout), the homepage's
"Featured → View all" link (and, at 390, the favorites heart icon) sits in the exact document-flow position the
fixed `MobileBottomNavView` (`position:fixed; bottom:0; height:56px; z-30`) occupies at scroll position 0. The nav
bar, being fixed and opaque, paints over and intercepts clicks on that content — confirmed both in the hit-test gate
output (interceptor is a real `MobileBottomNavView` DOM node, never `.mantine-Notifications-root`) and visually (an
outlined-element screenshot at that viewport shows the link fully hidden behind the nav bar).

**This is not caused by this task's diff.** Proof: the §6.1 "before" round trip (both files reverted to the
pre-Task-723, `081c03e7f` state) shows the *same* non-notifications interceptor already present at `mobile-390`
(3 of the 36 "before" interceptions name a `span.navItemLabel`, not `mantine-Notifications-root`) — it existed
before this task and was simply invisible to every prior gate (and largely masked by the notifications shield
itself, which sat on top of everything and intercepted first).

**Consequence for AC3.** AC3 ("0 interceptions at every width × all 4 locales") is not fully satisfied — 9 of 221
checked elements are blocked, 100% of them by this separate defect, 0% by anything this task owns or changed. Per
agent-contract clause 1 (scope stays bounded; no drive-by fixes), this was **not** fixed in this task. Recommend a
follow-up task (new number) to either add bottom-padding/scroll-margin clearance for content near the fixed nav's
footprint, or re-flow the "Featured" section header. Flagged to the orchestrator as an open question, not resolved
here.

---

## 8. `check:stories-rendered --mantine-only` — 160 FAIL, root-caused to a concurrent session's uncommitted state, not this diff

**Harness instability getting a run to complete at all** (unrelated root cause from §8.1 below): the first several
attempts truncated mid-run with no clean exit, each leaving an orphaned static file server bound to port 6008 (the
harness's own `finally`-block cleanup never ran because the process was cut off before reaching it — confirmed via
`netstat`/`Get-CimInstance` process inspection). Consistent with this sandbox's resource pressure from the repeated
`npm run build`/`next start`/`next dev` cycles this task's own R5 round trip required (§6.1), each retry killed only
the orphaned static-server process and re-ran the same command; the run that finally completed is the one analyzed
below.

**The completed run's result (1002/1184 PASS, 160 FAIL, 22 AMBIGUOUS) is root-caused to a concurrent session's
uncommitted, in-progress work — not to this task's diff.** Read (read-only `git diff`, never modified):
`scripts/check-stories-rendered.mjs` has uncommitted changes re-anchoring the `fullWidthButtonsAtMobile` and
`popupBottomSheetAtMobile` assertions from dead shadcn `[data-slot="…"]` selectors (which this Mantine-only gate
could never match — 0/852 applicable cells, per Sprint 52's own Task 711 entry) onto real, live Mantine selectors
(`.mantine-Button-root`, `.mantine-Drawer-content[role="dialog"]`). This is Task 711's own in-progress work,
described in `tasks/Sprints/Sprint_52_kickoff_prompt_Task_711_ReAnchor_Dead_Mantine_Assertions.md` and Sprint 52's
plan file (§1 above already flagged this file as foreign/untouched). Two direct consequences, both confirmed by
reading the failing-cell list:

1. **`fullWidthButtonsAtMobile` is now genuinely live for the first time** (it checked nothing before, per Task
   711's own measured 0/852). It is now catching real button-width conditions across many unrelated primitives
   (`Button/Default`, `FilterControls/Default`, `NotificationBellView/Default`'s "Mark all as read" button, etc.) —
   pre-existing conditions this gate was structurally blind to until this uncommitted change, not new breakage.
2. **`src/stories/mantine/primitives/CopyIdButton.stories.tsx`** (also foreign, §1) still contains Task 711's own
   `TASK 711 PLANTED VIOLATION` fixture — a deliberately mis-anchored `mantine-Drawer-content[role="dialog"]` div,
   not yet reverted by that session — which alone accounts for 12 of the 160 FAILs
   (`CopyIdButton/Default × {sq,en,uk,it} × {320,375,390}`).

**None of the 160 failing cells involve `.mantine-Notifications-root` or `.mantine-Notification-root`** (grepped the
full failing-cell list for `Notification`; the 4 hits are all `NotificationBellView`'s unrelated "Mark all as read"
button, caught by the same re-anchor in point 1). This diff cannot structurally reach any of the failing stories —
none of them render `<Notifications>`/`<Notification>`, and `notification-chrome.css`'s new rules only target those
two classes. **This gate could not be run to a clean/attributable result in this working tree**; a re-run once the
concurrent Task 711 session's changes are committed or reverted is the correct next evidence, not something this
task can produce by editing another task's uncommitted files. The 22 AMBIGUOUS count matches Task 684's documented
pre-existing baseline exactly, corroborating that this is a scoped, understood cause and not general environment
corruption.

---

## 9. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility/token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Toast header clearance (97px/65px) | `<Notifications>` position container | `.mantine-Notifications-root[data-position^="top"]` | `notification-chrome.css` (new rule) | **Change mechanism, preserve value** | §6.4 16-cell table |
| `bottom-*` container stretch | `<Notifications>` position container | `.mantine-Notifications-root[data-position="bottom-*"]` | Mantine's own `:where()` rule, now unopposed | **Change** (regression removed) | §6.2 16-cell table |
| Toast/close-button clickability | `<Notification>` (individual) | `.mantine-Notification-root`, `.mantine-Notification-closeButton` | `notification-chrome.css` (existing rule, `pointer-events:auto` added) | **Preserve** (must stay clickable) | §6.4 close-button column |
| Toast chrome (accent bar, max-width, close-button color) | `<Notification>` | `.mantine-Notification-root::before`, `.mantine-Notification-closeButton` | `notification-chrome.css` (pre-existing, untouched) | **Preserve, out of scope** | Diff shows these rules byte-unchanged |
| `position="top-right"`, z-index, container width | `<Notifications>` | component props / `--notifications-z-index` | Mantine defaults, untouched | **Preserve** | `git diff` shows no prop changes beyond `top` removal |

---

## 10. Files Changed

| Path | Action | Reason |
|---|---|---|
| `src/design-system/mantine/MantineRootProvider.tsx` | modify | Remove the component-level `top` prop that leaked onto all six position containers (R1's root cause). |
| `src/design-system/mantine/notification-chrome.css` | modify | Add the `[data-position^="top"]`-scoped offset (R1/R3) + the `pointer-events` shield pair (R2). |
| `scripts/check-click-shield.mjs` | **create** | R4 — the new blocking hit-test gate. |
| `package.json` | modify | Register `check:click-shield` / `check:click-shield:verify`. |
| `docs/backlog.md` | modify | Concise state update (§12 below). |
| `tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md` | modify | Register Task 723 (was absent from the table). |
| `docs/sessions/2026-08-06-task723-notifications-click-shield.md` | **create** | This session log. |

No other path is touched. `src/app/layout.tsx` and `src/components/shared/_Task723DebugToastTrigger.tsx` were
temporarily used for the §6.4 harness and fully reverted/deleted before this report (§6.4 proof).

---

## 11. Acceptance-criteria self-audit

| AC | Status | Evidence |
|---|---|---|
| AC1 — `bottom-*` height 0, all cells | **MET** | §6.2 |
| AC2 — `pointer-events`, all 6 containers | **MET** | §6.3 |
| AC3 — 0 interceptions, all cells | **NOT MET** (0 caused by this task; 9/221 caused by a separate, pre-existing, out-of-scope defect) | §6.5, §7 |
| AC4 — header clearance on real toast | **MET** | §6.4 |
| AC5 — bottom-nav items hit-test clean | **MET** | §6.5 |
| AC6 — R5 planted-violation round trip | **MET** | §6.1 |
| AC7 — standing gates clean | **PARTIALLY MET** — typecheck/lint/design-tokens/file-integrity/mojibake/i18n/hydration all clean; `check:stories-rendered --mantine-only` produced 160 FAIL, **0 attributable to this diff** (root-caused to a concurrent session's uncommitted changes, §8) | §6.7, §8 |

---

## 12. Backlog update

`docs/backlog.md`: added a concise `723` registry row and updated the "Last Session" line in place (edited, not
appended — the file was already at 85 physical lines, over the ~80 soft limit, before this task touched it).
**Resulting physical line count: see the file** — **`BACKLOG LIMIT BREACH`**: the file was already over budget
before this session; this task's one required registry row keeps it there. Flagging for orchestrator consolidation,
not resolved here.

---

## 13. Assumptions, deviations, and limitations

- **Not fixed, flagged instead (§7):** the `MobileBottomNavView`/"Featured → View all" collision at
  `mobile-375`/`390` (+`it@320`). Genuinely pre-existing (proven present in the §6.1 "before" state too), out of
  this task's owned scope.
- **R4's gate is homepage-general, not Notifications-specific by construction** (per the kickoff's own wording) — it
  therefore also caught §7's unrelated defect. This is evidence the gate works, not a gate defect.
- **N6 (intentional-overlay exemption)** is implemented (`.mantine-Overlay-root` ancestor check, proven in the
  self-test, §6.6) but not exercised against a real modal-bearing route — AC3's scope is homepage-only, no modal
  open by default. OQ3 (whether the gate becomes CI-blocking on modal routes) remains an open owner policy question,
  unchanged from the kickoff.
- **AC4's toast trigger required a temporary harness** (§6.4) since no authenticated session was available in this
  sandbox to exercise a real `toast.error()` call site without one. Fully reverted; proof included.
- **`check:hydration` and `check:stories-rendered --mantine-only`** both needed a clean-restart retry once each
  during this session, matching pre-existing, previously-documented sandbox precedents (`docs/sessions/2026-07-27-
  task670-…md` for hydration; §8 above for the rendered-assert harness instability). Neither retry changed the
  underlying evidence, both re-runs are recorded rather than the first attempt being silently discarded.
- **A concurrent, unrelated session appears to be active in this same working tree** (§1, §8) — its uncommitted
  changes (`check-stories-rendered.mjs`, `assertion-liveness-registry.json`, `CopyIdButton.stories.tsx`,
  `.tmp-task711-*`) were left completely untouched and do not appear in this task's diff.

---

## 14. Opus handoff

**Evidence locations:** this session log (all tables inline); `.screenshots/rendered-assert/` (multiple timestamped
runs, the clean completed one is the most recent); build/gate transcripts were captured to the session's scratchpad
during execution and are summarized in §6 (not persisted to the repo — same convention as prior sessions' `.next`/
build logs).

**Questions/risks for the reviewer:**

1. **AC3's partial status (§7).** Confirm the root-cause isolation (0/9 residual interceptions attributable to this
   diff) is convincing, and decide whether a follow-up task should be opened now or deferred.
2. **AC7's `--mantine-only` gap (§8).** Confirm the root-cause isolation (0/160 FAILs attributable to this diff,
   traced to Task 711's uncommitted re-anchor of `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` plus an
   unreverted planted-violation fixture in `CopyIdButton.stories.tsx`, neither touched by this task) is convincing.
   A clean re-run is recommended once that concurrent work is committed or reverted — this task cannot produce it
   by editing another task's uncommitted files.
3. **Backlog limit breach (§12)** — the file was already over ~80 lines before this task; needs orchestrator
   consolidation.
4. **The concurrent-session observation (§1, §8, §13)** — confirm no interference occurred with that other work;
   this task never touched its files, but both sessions shared the same `.next` build cache and port ranges during
   execution.
5. **OQ1/OQ2/OQ3 from the kickoff** remain open owner decisions (hotfix-now-vs-full-gate is moot since both landed
   together in this one task; CI scope for the gate; N6's blocking-on-modal-routes policy).
