# Task 684 — Task 681 revision: clear the Mantine notification container from the sticky site header (owner decision D3)

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / responsive geometry — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** overlay/mobile protection (cl. 11); rendered-geometry proof; revision of a defect its
  sibling task committed to the branch.
- **Origin:** Task 681's review (orchestrator, 2026-07-29) returned `NEEDS REVISION` on **AC9 only**. 681's own
  rendered proof showed the `top-right` toast overlapping the sticky header in all four locales at 320px. Owner
  decision **D3** (2026-07-29) selects the remedy. This task is the 671→675 pattern: a numbered revision that
  amends the sibling diff in place before either is committed.

> **Read this first.** Task 681 is **already committed on this branch** with its AC9 defect recorded in the commit
> message (owner decision, 2026-07-29 — §3.6). You therefore start from a **clean** worktree, and Task 681's code
> is in `HEAD`, not in your working tree. You are fixing a shipped-to-branch defect, not amending an uncommitted
> sibling diff.

---

## 2. Objective

1. Offset the Mantine notifications container so a fired toast clears the sticky site header instead of painting
   over it, **without changing `position="top-right"`** (D2 stands).
2. Derive the offset from **measured** header geometry, not a chosen number.
3. Re-run Task 681's AC9 capture and turn its failing rect table into a passing one, **persisting the artifacts
   this time** (Task 681 review finding F4).

---

## 3. Verified context

Every fact below was read in the worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-29, with Task
681's changes present in the tree (they have since been committed — §3.6). Nothing here is inferred from a
filename or a prior report.

### 3.1 Owner decisions

| ID | Question put to the owner | Owner ruling |
|---|---|---|
| **D2** (Task 681, standing) | Sonner rendered bottom-right; `MantineRootProvider` is hard-coded `top-right`. | **Keep `top-right`.** Do not introduce a second position. |
| **D3** (this task) | 681's AC9 proof shows the `top-right` toast overlapping the sticky header at 320px in all 4 locales. Remedy? | **Narrow-width `top` offset** on `<Notifications>` so the toast clears the header. Rejected alternatives, recorded: lowering the toast z-index below the header (would clip message text behind the header), and accepting the overlap. |
| **D4** (Task 681, ratified at review) | `VARIANT_COLORS.info` corrected `blue`→`blueLight`. | **Ratified.** No action in this task; recorded so you do not re-litigate it. |

D2 and D3 are the source of truth. **You may not change `position`.**

### 3.2 The measured collision (Task 681 §9, reproduced in the 681 review)

| Locale | Header rect (top/right/bottom/left) | Toast rect | Overlap | Horizontal overflow |
|---|---|---|---|---|
| sq | 0 / 320 / **97** / 0 | 16 / 304 / 76.03 / 16 | YES | No (`scrollWidth` 320 = viewport 320) |
| en | 0 / 320 / **97** / 0 | 16 / 304 / 76.03 / 16 | YES | No |
| uk | 0 / 320 / **97** / 0 | 16 / 304 / 96.05 / 16 | YES | No |
| it | 0 / 320 / **97** / 0 | 16 / 304 / 76.03 / 16 | YES | No |

The sizing is correct; only the vertical placement is wrong. **Do not touch width, `containerWidth`, or
`notification-chrome.css`'s `max-width` rules.**

### 3.3 Why it collides — the three values, each read from source

1. `src/components/layout/HeaderView.tsx:89` —
   `<Box component="header" className="site-header sticky top-0 z-30 w-full border-b …">`. Sticky, at `z-30`.
2. `node_modules/@mantine/notifications/styles.css` — the container class sets
   `position: fixed; z-index: var(--notifications-z-index); max-width: var(--notifications-container-width)`, and
   `:where([data-position='top-right']) { top: var(--mantine-spacing-md); right: var(--mantine-spacing-md); }`.
   `--mantine-spacing-md` is the 16px in the measured rects.
3. `node_modules/@mantine/notifications/lib/Notifications.d.ts` — `zIndex` **default `400`**.

`400 > 30`, so the toast paints over the header. The `top` rule is inside `:where()`, which has **zero
specificity** — any `top` you set will win without `!important`. Prove that with a computed-style read (I3); do not
assume it.

### 3.4 The `Notifications` API surface — read from the shipped `.d.ts`

`NotificationsProps extends BoxProps, StylesApiProps<NotificationsFactory>, ElementProps<'div'>`. Own props:
`position`, `autoClose`, `transitionDuration`, `containerWidth`, `notificationMaxHeight`, `limit`, `zIndex`,
`portalProps`, `store`, `withinPortal`. CSS variables: `--notifications-z-index`, `--notifications-container-width`
**only** — there is no `--notifications-top`.

**Because it extends `BoxProps`, Mantine's style props apply — including `top`, which accepts a responsive object
(`{ base, sm, … }`).** That is the intended mechanism here: Mantine props for behaviour and responsiveness
(`docs/mantine-responsive-design-system.md`), not a hand-written media query and not a new CSS file.

### 3.5 The header's height is not constant — this is the load-bearing measurement

`HeaderView.tsx:110` —
`<Group unstyled className="container-wide flex flex-wrap min-[390px]:flex-nowrap items-center justify-between gap-2 py-2 min-[390px]:h-16 min-[390px]:py-0">`.

Below **390px** the control cluster wraps to a second row (Task 590, owner 2026-07-13); at ≥390px it is a single
`h-16` (64px) row. So the header is **taller below 390 than above it**, and the 97px measured at 320 is the
wrapped case. **The collision is therefore not confined to 320** — a 64px header still overlaps a toast whose top
edge is 16px. Measure before you decide the breakpoints (I2); do not assume `base`/`sm` is the right split.

### 3.6 Task 681 is committed — you start clean

Owner decision, 2026-07-29: rather than hold Task 681's 45-path diff uncommitted across this task's execution and
review, it was committed to this branch as `fix(Task681): retire Sonner onto Mantine notifications (known AC9
header collision — Task 684)`. The commit message records the unresolved AC9 defect and names this task as its
remedy. The branch is not `main` and nothing has been pushed.

**Consequences that matter to you:**

- `git status --porcelain` at your start must be **empty**. If it is not, **stop and report** (A5); do not
  reconcile foreign paths.
- Task 681's code is in `HEAD`. Read it with `git show`/`git log`, not from the working tree as pending changes.
- There is **no dirty-worktree manifest obligation** in this task. If you have seen
  `docs/orchestrator-dirty-worktree-manifest-template.md` referenced in similar revision tasks, it does not apply
  here — the earlier draft of this kickoff required it and that requirement is **withdrawn**.
- `git log -1 --stat` is a useful orientation read: it shows you exactly the 45 paths whose behaviour you must not
  disturb.

### 3.7 `.git/index.lock` — cleared

A zero-byte `.git/index.lock` was created during the 681 review by a read-only `git status` and was removed
natively by the owner on 2026-07-29 before the Task 681 commit. Nothing to do. **Do not run any mutating Git
command, and do not touch `.git/` for any reason.**

### 3.8 Admin routes have no sticky header

`grep -n "sticky\|top-0" src/components/admin/AdminShell.tsx` → **0 hits**. `<Notifications>` is mounted once in
the root layout (`src/app/layout.tsx` → `MantineRootProvider`), so any offset you set applies to `/admin/*` too,
where there is nothing to clear. That is **acceptable and intended** — a single global container is D2's
"do not introduce a second position" applied to placement generally. Record it as a known consequence in the
session log; do not add an admin-specific branch, a second `<Notifications>`, or a route-conditional offset.

### 3.9 Task 681's AC9 evidence was not persisted

681 used a temporary debug component + a temporary layout import, captured with Playwright, then deleted both. The
review accepted the method and flagged the discarded artifacts as finding **F4**. This task **reuses the method and
keeps the output** (I4).

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D3, §3.4 | `src/design-system/mantine/MantineRootProvider.tsx`'s `<Notifications>` gains a responsive `top` style prop derived from measured header geometry. `position="top-right"` is **unchanged**. No new CSS file, no `!important`, no media query written by hand, no second `<Notifications>`. | P0 | AC1 |
| R2 | §3.5, cl. 11 | The offset value(s) are **derived from the I2 measurement table**, not chosen. Every breakpoint at which the header can overlap the toast is covered, including ≥390 if the measurement shows it. | P0 | AC2 |
| R3 | §3.3 | A computed-style read proves the new `top` actually wins over the package's `:where([data-position='top-right'])` rule at every measured width. | P0 | AC3 |
| R4 | D3, R9 of Task 681, cl. 11 | A live 320×{sq,en,uk,it} capture shows `toast.top ≥ header.bottom` — Task 681's failing AC9 table becomes a passing one — with **no horizontal overflow introduced** (`scrollWidth === innerWidth`). Repeat at every width in the I2 table. | P0 | AC4 |
| R5 | §3.9, 681 review F4 | The rect data and screenshots are **persisted** under `.screenshots/task684-ac9/` and referenced by path in the session log. | P1 | AC5 |
| R6 | §3.6 | The worktree starts clean and the final diff contains **only** this task's scoped paths (§7) — no Task 681 path is re-touched, reverted, or re-staged. | P0 | AC6 |
| R7 | cl. 12, 13 | `screenshots:assert -- --mantine-only` shows **0 FAIL** and a full-manifest cross-story comparison naming every changed cell. `<Notifications>` renders no static Storybook cell, so the expectation is **zero** changed cells; any change is a finding to investigate, not to wave through. | P0 | AC7 |
| R8 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript. | P0 | AC8 |
| R9 | cl. 15, §3.8 of Task 681 | The three critical-flow registry suites still pass unchanged; Task 681's adapter test still passes 4/4. | P0 | AC9 |
| R10 | cl. 7, 14 | Zero new i18n keys (parity stays 2215×4); `check:design-tokens` gains no violation in any touched file and stays at `0 stale-marker(s)`; `check:file-integrity` / `check:mojibake` exit 0. | P1 | AC10 |

---

## 5. Assumptions and open questions

- **A1 — the header measurement is a gate, not a formality.** If the measured `.site-header` height at any width
  in the I2 table differs from §3.2/§3.5's expectations (97px at 320; 64px single-row at ≥390), **report the real
  numbers and proceed from them** — the offset is derived from what you measure, not from this document.
- **A2 — do not introduce a token or CSS variable for header height.** None exists today
  (`grep -rn "header-height\|headerHeight" src/` → 0 hits). Creating one is a cross-cutting design decision with
  its own blast radius; it is **out of scope** (§8). Use measured px in the responsive `top` prop and cite the
  measurement in a code comment.
- **A3 — the toast's own height is irrelevant to the fix.** The collision is `toast.top < header.bottom`. The uk
  variant is taller (3-line wrap, §3.2) but that extends downward, away from the header. Do not size the offset
  against toast height.
- **A4 — `zIndex` stays at its `400` default.** D3 explicitly rejected the z-index remedy. Do not pass `zIndex`.
- **A5 — the worktree starts CLEAN (§3.6).** Snapshot `git status --porcelain` before your first write and record
  it; expect zero entries. If it is not empty, **stop and report**; do not reconcile foreign paths and do not run
  mutating Git.
- **A6 — this is a real visual change and it is authorized.** Toasts will sit lower on every route. That is the
  point of D3; it is not a regression to be minimised.

**Open questions — none.** D2/D3/D4 are decided; the mechanism is fixed by §3.4; the values come from I2.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 3, 5, 7, 9, 11, 12, 13, 14, 15, 16.
2. `docs/rule-index.md` — "Current Mantine path".
3. `docs/qa-profiles.md` — the **Q4** row, the **Q3** row it inherits, and the viewport policy.
4. `docs/mantine-responsive-design-system.md` — responsive style props; the **unlayered-CSS** rule (Tasks 629/650/651).
5. `docs/tailadmin-style-reference.md` — **§6r-LIVE at `:872` only**. This task changes **placement**, not chrome;
   §6r-LIVE specifies no page-level offset, so cl. 16 is satisfied by leaving the chrome untouched.
6. `docs/qa-rules.md`
7. `docs/critical-flow-registry.md` — lines 43, 45, 61.
8. `docs/backlog.md` — the numbering line and the 80-line limit (**it is currently at exactly 80 — you have no
   headroom; edit the 681/684 line in place, do not append a new one**).

**Source pre-read**

9. `src/design-system/mantine/MantineRootProvider.tsx` — all lines.
10. `src/components/layout/HeaderView.tsx` — lines 85–115 (the sticky wrapper and the wrapping `Group`).
11. `node_modules/@mantine/notifications/lib/Notifications.d.ts` — the full `NotificationsProps` interface.
12. `node_modules/@mantine/notifications/styles.css` — the container rules quoted in §3.3.
13. `src/design-system/mantine/notification-chrome.css` — all lines, to confirm you are not duplicating its
    responsive `max-width` work.
14. `docs/sessions/2026-07-29-task681-sonner-retire-mantine-notifications.md` — §9 (the AC9 method you are reusing).

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/MantineRootProvider.tsx` | modify | R1 — the responsive `top` prop. **This is the only `src/` file this task changes.** |
| `.screenshots/task684-ac9/` | **create** | R5 — persisted rect JSON + screenshots. |
| `docs/backlog.md` | modify | Update the existing 681/684 line in place. **Stay ≤80 lines.** |
| `docs/sessions/2026-07-29-task684-notification-header-clearance.md` | **create** | Session log with a `Files Changed` table matching the real diff, plus the start/end porcelain snapshots. |

---

## 8. Out of scope

- **`position`** — stays `top-right` per D2.
- **`zIndex`** — stays default per D3/A4.
- **A header-height token or CSS variable** — per A2.
- **`src/design-system/mantine/theme.ts`, `notification-chrome.css`, `notificationVariants.ts`, `src/lib/toast.ts`** —
  all four are correct as shipped by Task 681. If something looks wrong, **report it, do not edit it**.
- **`MantineNotificationPattern.tsx:81`'s `<Button color="blue">`** — the same unregistered-colour defect D4
  corrected in the variant map, flagged as P3 at the 681 review. **Task 685 is reserved for it.** It renders a
  static Storybook cell, so fixing it here would inject an authorized visual delta into the very manifest
  comparison that must prove this task changed no cell (R7). Leave it alone.
- **Any of Task 681's other 45 paths**, its call sites, its adapter, or its deleted `sonner.tsx`.
- **`package.json` / lockfile** — Task 682 reserved.
- **Any mutating Git command**, including clearing `.git/index.lock` (§3.7).

---

## 9. Current and required behavior

**Current.** `MantineRootProvider.tsx:31` renders `<Notifications position="top-right" />` with no offset, so the
package's `:where([data-position='top-right'])` rule places the container at `top: 16px` at every width, `z-index:
400`. `HeaderView`'s `.site-header` is `sticky top-0 z-30` and occupies 0–97px at 320px (two wrapped rows below
390px, single 64px row at ≥390). Every one of Task 681's 169 toasts therefore paints over the header on the public
routes, in all four locales — proven by 681 §9 and reproduced at review.

**Required after.** The same single `<Notifications position="top-right" />` container carries a responsive `top`
offset derived from measured header geometry, so a fired toast's top edge sits at or below the header's bottom
edge at every measured width and locale. Chrome is untouched: white, 6px radius, 4px semantic bottom accent,
`shadow-theme-sm`, 40×40 tinted badge, ≤340px cap ≥640 / full-width below. No horizontal overflow is introduced.
`/admin/*` toasts sit at the same offset with no header to clear (§3.8, recorded, not branched).

---

## 10. Implementation requirements

**I0 — clean-start protocol (do this before any write).** `git status --porcelain`; expect **zero** entries, and
record the empty snapshot. Confirm Task 681 is in `HEAD` with `git log -1 --stat` and quote the commit subject.
Any non-empty start state → **stop and report** (A5).

**I1 — reproduce the failure first.** Rebuild Task 681 §9's harness: a temporary client component that calls the
real shipped `toast.error(...)` with an existing i18n key, plus a temporary import/render in `[locale]/layout.tsx`.
Capture the **before** rect table at 320×{sq,en,uk,it} and confirm you reproduce the overlap in §3.2. **A fix whose
"before" state you never reproduced is not a proven fix.**

**I2 — measure the header, then derive the offset.** With the harness still in place, read
`document.querySelector('header.site-header').getBoundingClientRect()` at **320 / 375 / 390 / 1024** ×
{sq,en,uk,it} — the `MANTINE_VIEWPORTS` set (`scripts/check-stories-rendered.mjs:392`). Record all 16 heights.
Take the **maximum** header height within each breakpoint band you intend to use, and derive
`top = maxHeaderHeight` for that band (the container's own 16px inset is replaced by your value, not added to it —
verify which, empirically, in I3). Publish the derivation arithmetic in the session log.

Choose breakpoint bands from the **measurement**, not from habit: §3.5 predicts a taller header below 390 and 64px
above it, which likely means **two** bands, and it likely means a non-zero offset at ≥640 as well. If your
measurement shows the header overlaps at every width, apply the offset at every width and **say so** — D3's words
were "narrow-width", but its intent is header clearance, and an offset that stops at `sm` while the header still
collides at 1024 would satisfy the phrasing and fail the purpose. Report that as an explicit extension of D3 for
ratification at review.

**I3 — implement, then prove the cascade.** Add the responsive `top` style prop to the existing `<Notifications>`
element. Then read `getComputedStyle(container).top` at every width and confirm it equals your intended value and
**not** `16px` — this is the AC3 proof that Mantine's style prop beat the package's `:where()` rule. If it did not
win, **stop and report**; do not reach for `!important`, a new CSS file, or `classNames`.

**I4 — the after capture, persisted.** Re-run I1's capture. For every cell record `header.bottom`, `toast.top`,
the delta, and `scrollWidth === innerWidth`. Write the rect JSON and the PNGs to `.screenshots/task684-ac9/` and
**commit them to the working tree** (they are task artifacts, not scaffolding). Then remove the temporary debug
component and revert the temporary layout import, and prove the revert with a `git diff` read of
`[locale]/layout.tsx` showing it back at its exact Task 681 post-I7 state.

**I5 — gates.** §13.3, in order. `npm run build` runs **last**, on the tree with the harness already removed.

**I6 — records.** Session log per §14. Update `docs/backlog.md`'s existing 681/684 line **in place**; the file is
at exactly 80 lines and must not grow.

**I7 — order of operations.** I0 → I1 → I2 → I3 → I4 → I5 → I6.

---

## 11. Positive and negative flows

### Positive flow

A guest on `/{locale}/listings/{slug}` at 320px submits the report dialog; the dialog closes and one red-accented
toast slides in at the top-right, full-width inside its 16px inset, its top edge at or below the header's bottom
edge, header logo and controls fully visible and clickable, auto-dismissing after 4s.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Header taller below 390 (wrapped cluster)** | **Yes** | §3.5 | offset covers the wrapped height; no overlap at 320/375 | AC2, AC4 |
| **Header single-row ≥390** | **Yes** | §3.5 | offset still clears 64px; no overlap at 390/1024 | AC2, AC4 |
| **Locale expansion (sq/uk/it)** | **Yes** | cl. 7 | longer uk/it strings grow the toast **downward** only; header clearance unaffected | AC4 all 4 locales |
| **Small viewport (<640)** | **Yes** | cl. 11 | toast stays full-width inside its inset; `scrollWidth === innerWidth` | AC4 |
| **`/admin/*` (no sticky header)** | **Yes** | §3.8 | same offset applies; toast simply sits lower; nothing breaks | session-log record + AC8 build |
| **Multiple stacked toasts** | **Yes** | Mantine `limit` default 5 | the **first** toast's top edge is the constraint; stacking grows downward | AC4 (measure the first) |
| Validation / authorization / RLS | No | No data path; placement-only change | N/A | — |
| Missing / failed data | No | No fetch added | N/A | — |
| RTL | No | No RTL locale in the project | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final diff, *then* `MantineRootProvider.tsx` is the only changed `src/` file; its
  `<Notifications>` still reads `position="top-right"`; a responsive `top` style prop is present; and
  `grep -n "zIndex\|!important\|@media" <file>` returns **0 hits**.
- **AC2 [R2]** — *Given* the session log, *then* the 16-cell header-height measurement table is present, and the
  arithmetic from `max(headerHeight)` per band to the shipped `top` value(s) is shown. No value appears in the code
  that is absent from that table.
- **AC3 [R3]** — *Given* a live capture, *then* `getComputedStyle(container).top` equals the derived value and not
  `16px`, at every width in the I2 table. Quote the readings.
- **AC4 [R4]** — *Given* a live capture at 320/375/390/1024 × {sq,en,uk,it}, *then* every cell shows
  `toast.top ≥ header.bottom` and `scrollWidth === innerWidth`. Present it as the same-shaped table as Task 681
  §9 so the before/after is directly comparable. Quote the method and route.
- **AC5 [R5]** — *Given* the final tree, *then* `.screenshots/task684-ac9/` contains the rect JSON and one PNG per
  captured cell, and the session log references them by path.
- **AC6 [R6]** — *Given* the starting `git status --porcelain`, *then* it is empty and quoted in the log; *and*
  the final `git status --porcelain` contains **only** the §7 paths — no Task 681 path reappears as modified,
  reverted, or deleted. Quote both snapshots.
- **AC7 [R7]** — *Given* a fresh `build-storybook` and a `--mantine-only` capture, *then* 0 FAIL, every
  `AMBIGUOUS` classified, and a full-manifest cross-story comparison against the pre-change run naming **every**
  changed cell. Expectation is **0 changed cells**; if any cell changed, investigate and explain it — a
  `<Notifications>` offset should not reach any static Story.
- **AC8 [R8]** — `npm run build` exits 0 on a fresh post-change transcript. Report the page count printed and
  **quote the transcript tail**; do not cite `.next/BUILD_ID`.
- **AC9 [R9]** — `npx vitest run src/lib/__tests__/toast.smoke.test.ts` exits 0 at 4/4, and the three registry
  commands from §13.3 exit 0 at their pre-existing counts (41/41 combined, measured at the 681 review).
- **AC10 [R10]** — `check:i18n` exits 0 at 2215×4 with no new keys; `check:design-tokens` shows no new violation
  in any touched file (quote before/after totals **and** the `stale-marker` count — the current baseline is
  **44 violations / 0 stale-marker**); `check:file-integrity` and `check:mojibake` exit 0.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, inherited from Task 681: this task changes the placement of the container that
the three `docs/critical-flow-registry.md` toast rows (`:43`, `:45`, `:61`) dispatch into, on every route. Q4
inherits Q3's visual obligations and Q1's gates including the zero-exit build.

**Planted-violation clause.** This task adds no new automated gate — its proof is a rendered measurement, and I1's
reproduce-the-failure-first step **is** the failure proof: you demonstrate the same harness reporting overlap
before and clearance after. Record both tables. If you cannot reproduce the "before" overlap, the "after"
clearance proves nothing — **stop and report**.

**Declared proof path.** `MANTINE_VIEWPORTS` (320/375/390/1024) × sq/en/uk/it on the live route. The remaining
canonical widths are **not** captured; that boundary is Task 678's scope and must be reported as a boundary, never
as satisfied full-matrix coverage.

**TailAdmin side-by-side:** **not required.** §6r-LIVE specifies toast chrome, not page placement, and this task
changes no chrome value. Confirm in the log that `theme.ts` and `notification-chrome.css` are absent from the diff.

### 13.2 Worktree

Start state expected **clean** — Task 681 is committed (§3.6). Snapshot `git status --porcelain` before the first
write and record the empty result. If it is not clean, **stop and report**; do not reconcile foreign paths. No
dirty-worktree manifest is required.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run typecheck` | 0 |
| `npx vitest run src/lib/__tests__/toast.smoke.test.ts` | 0 — 4/4 |
| `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` | 0 — 41/41 combined |
| `npx vitest run` (full suite) | 0 new failures attributable to this diff; report any pre-existing full-run-only timeout with its isolated re-run (the documented set is `date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`) |
| `npm run check:stories` | 0 |
| `npm run check:story-coverage` | 0, total unchanged at 15/15 |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL; classify every `AMBIGUOUS` (current baseline 22, all pre-existing); full-manifest comparison naming every changed cell |
| `npm run check:design-tokens` | no new violation in touched files; **44 / 0 stale-marker** |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 |
| `BASE_URL=http://localhost:3000 npm run check:hydration` | required — `[locale]/layout.tsx` is temporarily touched by the harness and must be proven reverted. Task 681 documented that `next dev` emits a Turbopack HMR flake here (backlog standing note, Task 582); re-verify against `npm start` if dev is noisy, and say which you used |
| `npm run build` | **0 — hard gate**, transcript tail quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-29-task684-notification-header-clearance.md`:

1. `Files Changed` table matching the real `git diff`, **scoped to this task's paths only** — Task 681's paths are
   in `HEAD` and must not appear.
2. The empty start snapshot and the final `git status --porcelain` (I0/AC6), both quoted.
3. R1–R10 mapped to AC1–AC10 with evidence.
4. The I2 header-measurement table (16 cells) and the offset derivation arithmetic.
5. The I1 **before** and I4 **after** rect tables, same shape, directly comparable to Task 681 §9.
6. The AC3 computed-style readings.
7. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim.
8. The `--mantine-only` totals with every `AMBIGUOUS` classified and the full-manifest cross-story comparison.
9. Proof that the temporary harness is gone and `[locale]/layout.tsx` is back to its Task 681 state.
10. Deviations, each with a reason.
11. Limitations — at minimum: the declared 4-width proof path (§13.1); that `/admin/*` inherits the offset with no
    header to clear (§3.8); that `MantineNotificationPattern.tsx:81`'s `color="blue"` remains (Task 685); and that
    `sonner`/`next-themes` remain in `package.json` (Task 682).

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command — including clearing
`.git/index.lock` (§3.7).

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_684_Task681_Revision_Notification_Header_Clearance.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Toast container vertical placement | `<Notifications top={{…}} />` | Mantine style prop → generated class | overrides the package's zero-specificity `:where([data-position='top-right']) { top: var(--mantine-spacing-md) }` | **changed — D3** | AC3, AC4 |
| Toast container horizontal placement | same | `:where([data-position='top-right'])` `right` | unchanged package rule | **reuse, untouched** | §3.3 |
| Toast surface, radius, accent, shadow, badge, close | Mantine `Notification` | `theme.ts` `components.Notification` + `notification-chrome.css` | §6r-LIVE | **reuse existing, not in diff** | §13.1 |
| Responsive max-width (full-width <640, 340px ≥640) | `.mantine-Notification-root` | `notification-chrome.css` `@media (min-width: 40em)` | §6r-LIVE | **reuse existing, not in diff** | §3.2 (no overflow) |
| Toast stacking z-order vs header | container | `--notifications-z-index` default 400 vs header `z-30` | Mantine default | **unchanged — D3 rejected the z-index remedy** | A4 |

## 16. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path |
|---|---|---|---|---|
| Toast container placement | read `MantineRootProvider.tsx` in full; `Notifications.d.ts` `NotificationsProps`; `@mantine/notifications/styles.css` container rules; `grep -rn "header-height\|headerHeight" src/` → 0 | **No Story renders `<Notifications>`** — it is a portal container mounted once in the root layout; the canonical `Mantine/Primitives/Notification` Story deliberately renders static `<Notification>` elements instead (Task 681 §3.6a) | **reuse the single existing mount; change one style prop** — no new component, no second container | Mantine style prop on the existing element; no new token (A2), no new CSS file |
| Header geometry | read `HeaderView.tsx:85–115`; `grep -n "sticky\|top-0" src/components/admin/AdminShell.tsx` → 0 | `HeaderView` (hybrid surface, Task 673 pending) | **read-only input** — measured, never edited | none |

**Clause 16a is not triggered:** no new visual value is invented. The offset is a measurement of an existing
rendered surface, and cl. 16's TailAdmin obligation attaches to chrome, which this task does not touch.

## 17. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | One-prop fix on a shipped defect | Exactly one `src/` file changed; no Task 681 path re-touched | AC1, AC6 | required |
| cl. 3 / cl. 5 (capabilities and flows intact) | 169 toast surfaces | Same variants, same copy, same firing conditions; placement only | AC9 | required |
| cl. 7 (four locales) | Placement affects all locales | Zero new keys; all 4 locales captured | AC4, AC10 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript quoted | AC8 | required |
| cl. 11 (mobile/overlay protection) | **The defect being fixed** | No header collision, no horizontal overflow, below 640 and above | AC4 | required |
| cl. 12 (rendered evidence follows risk) | Q4/Q3 | Live-route capture, machine-produced, **persisted** | AC4, AC5 | required |
| cl. 13 (Storybook gates) | No Story renders the container | Gates stay green; manifest unchanged | AC7 | required |
| cl. 14 (file integrity) | Files created + modified | UTF-8 no BOM, no mojibake | AC10 | required |
| cl. 15 (critical flows) | Registry rows `:43`, `:45`, `:61` dispatch through this container | Existing baseline preserved; the three registry commands re-run | AC9 | required |
| cl. 16 (TailAdmin visual source) | Chrome **not** in scope | `theme.ts` / `notification-chrome.css` absent from diff | §13.1 | required |
| cl. 10 (git ownership) | Task 681 already committed | Clean start; diff limited to §7 paths; no mutating Git by the executor | AC6 | required |

## 18. Execution contract

| Field | Value |
|---|---|
| Task | 684 |
| Active route / owner decision | Single route: responsive `top` style prop on the existing `<Notifications position="top-right" />`, value derived from measured header geometry (owner D3, 2026-07-29; D2 standing) |
| Decision source, date, scope | Owner, 2026-07-29 at the Task 681 review; scope = vertical placement only; **no** position change, **no** z-index change, **no** chrome change |
| Starting worktree mode | **clean** — Task 681 is committed to the branch (§3.6); §13.2 sets the stop condition |
| Producer of each checkpoint | clean-start snapshot → reproduce-before capture → header measurement → offset derivation → prop implementation → computed-style proof → after capture (persisted) → gates → build → records |
| Persisted result | start/end porcelain snapshots; before/after rect tables; `.screenshots/task684-ac9/` JSON + PNGs; computed-style readings; `--mantine-only` manifest; build transcript tail; session log |
| Comparator | AC4's `toast.top ≥ header.bottom` per cell vs Task 681 §9's failing table; AC3's computed `top` ≠ `16px`; AC6's start-empty / end-scoped porcelain pair; AC7's zero changed cells |
| Failure path | Non-empty start state → stop (A5); cannot reproduce the "before" overlap → stop, the fix is unproven (§13.1); style prop does not beat `:where()` → stop, do **not** use `!important` (I3); measurement shows collision above `sm` → apply the offset there too and flag as a D3 extension for ratification (I2) |
| Zero/empty input case | A toast fired while the page is scrolled: the header is `sticky top-0`, so its rect stays at `top: 0` — measure in the scrolled state too and confirm the relationship holds |
| Task-created artifacts in baselines | `.screenshots/task684-ac9/` is task-created and has **no** pre-change baseline; it is evidence, not a regression surface. The `--mantine-only` manifest **does** have a baseline (`2026-07-29T06-49`, Task 681's post-change run) — compare against that one, not against `2026-07-28T20-40` |

## 19. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, count, command, measured value and both owner rulings are inline |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC10 |
| Scope names what must not change | **Yes** — §8, incl. `position`, `zIndex`, `theme.ts`, the sibling 681 paths, and the `blue` Button reserved to Task 685 |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4 (inherited, with the registry rows that trigger it); §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; the search found that **no** Story renders the container, which is why the disposition is "change one prop on the single existing mount" |
| Owner-only exceptions traceable | **Yes** — D2 standing, D3 new, D4 recorded-not-actioned, each with question, ruling, date and scope (§3.1) |
| Baselines account for task-created artifacts | **Yes** — §18 row 9 names the correct manifest baseline and marks the new capture directory as evidence |
| Worktree handling | **Yes** — clean start asserted with a stop condition (§3.6, §13.2, A5); the earlier draft's dirty-manifest obligation is withdrawn and marked as such, not silently deleted |
| Gates prove the changed behavior | **Yes** — AC4 measures rects rather than eyeballing; I1 requires reproducing the failure before claiming the fix; AC3 proves the cascade rather than assuming it; AC6 proves the sibling diff was not disturbed |
| Single active owner route | **Yes** — the only forks are A5's non-empty-start stop, I3's cascade stop, and I2's report-and-extend path |
| API claims verified, not assumed | **Yes** — §3.4 reads the installed `Notifications.d.ts`; §3.3 quotes the installed package CSS and the `zIndex` default; §3.5 quotes the real `HeaderView` className; §3.8 is a grep result |

**Known-risk note for the reviewer.** Five likely defects. First, **treating D3's "narrow-width" phrasing as
permission to fix only `base`** while the header still collides at 390 and 1024 — I2 forces the measurement and
AC4 captures all four widths. Second, **reaching for `!important` or a new CSS file** when the style prop appears
not to apply — I3 makes that a stop, because the package rule is inside a zero-specificity `:where()` and a
failure there means something else is wrong. Third, **claiming the fix without reproducing the failure** — I1 and
§13.1 make the "before" table mandatory; an "after" table alone proves nothing. Fourth, **collateral edits to Task
681's now-committed files** — AC6's start-empty / end-scoped porcelain pair is the detector; any 681 path
reappearing in `git status` is a finding regardless of intent. Fifth, **discarding the AC9 artifacts again**
(Task 681 review finding F4) — AC5 requires them on disk under `.screenshots/task684-ac9/`.
