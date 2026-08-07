# Sprint 53 — Mobile full-width control remediation

**Opened:** 2026-08-07. **Owner decision:** 2026-08-07 — Task 711's R8 finding needs a home, and no open sprint
fits. Sprint 52 is *Gates that stopped checking* (repairing detectors); this sprint is about **fixing what a
repaired detector found**. Sprint 46 is ListingCard de-Tailwind, Sprint 49 is HeroSearch, Sprint 50 (MobileBottomNav
+ AppShell de-Tailwind) closed with Task 713. Opened per the 2026-08-01 owner rule: no open sprint fits → open the
next one with its own plan file before writing the kickoff.

---

## Goal

Adjudicate and remediate the **13 enrolled Mantine stories** where the re-anchored `fullWidthButtonsAtMobile`
assertion resolves `false` on real, currently-shipped layouts — **148 cells** of the `--mantine-only` matrix,
reproduced natively by the owner on 2026-08-07 (`.screenshots/rendered-assert/2026-08-07T05-24/manifest.json`).

The `--mantine-only` matrix is a hard-blocking CI gate (`.github/workflows/governance-pr.yml:161`, no
`continue-on-error`). It is currently red and **stays red until this sprint closes**. That is the intended state:
Task 711 converted a falsely-green gate into an honestly-red one, and the red is a backlog of real work, not a
defect in the gate.

## Why this is not merely a style question

Task 723's independent click-shield hit-test, run natively by the owner on a production build on 2026-08-07,
found **9 interceptions across 221 checked elements**. Five of the nine are the `HomepageListingGrids` CTA — the
same element, at the same measured width, that `fullWidthButtonsAtMobile` flags:

| Source | Element | Measurement |
|---|---|---|
| 711 `R8-geometry-probe.json` | `"View all"`, parent `mantine-Group-root` | `offsetWidth: 88`, `parentContentWidth: 343`, deficit **255** |
| 723 `check:click-shield`, `/en × mobile-375` | `<a class="… mantine-Button-root …">` `"View all"` | `88x44` @ (271,773) — **blocked by `MobileBottomNavView_navItem`** |

Two gates from two unrelated tasks, one Storybook and one production build, converging on one element. At least
one of the 13 has a functional consequence in shipped code.

## Tasks

| # | State | What |
|---|---|---|
| **724** | `KICKOFF FILED` | Classify all 13 stories into fix / tracked-defect / gate-defect, then remediate the confirmed defects. Starts with `HomepageListingGrids` and tests whether a full-width CTA also clears the click-shield interception. `Sprint_53_kickoff_prompt_Task_724_FullWidthButtons_13Story_Adjudication.md` |

Further tasks are opened from 724's classification output — deliberately not pre-numbered, because which stories
need their own task is 724's R1 deliverable, not a guess made now.

## Preconditions

1. **Task 711 must be reviewed and landed first.** 724 measures against 711's re-anchored assertion; a
   comparator that has not been committed is not a stable baseline (**D32**).
2. Task 711's two open revision items must be closed: the `383 → 384` correction across six documentation sites,
   and the re-captured `I6f` popup-plant transcript. Both are recorded in the 711 review, 2026-08-07.

## Exit criteria

1. Every one of the 13 stories carries exactly one classification with rendered evidence behind it.
2. `npm run screenshots:assert -- --mantine-only` exits **0**, with any residual failure reconciled to a
   signature-pinned `MANTINE_PATTERN_KNOWN_FAILURES` entry naming a real, filed follow-up task.
3. `FULL_WIDTH_TOLERANCE` is unchanged at **8** (`check-stories-rendered.mjs:473`).
4. No story is silenced by a per-story allowlist for a confirmed true positive — owner decision, Task 607 review,
   2026-07-15, restated at `check-stories-rendered.mjs:304-309`.

## Standing constraints

- **`HeroSearch` belongs to Sprint 49**, which is ordered (708 blocks 709). Its failing button's parent is
  `_controls_blflv_68`, a CSS-module class — **not** a Mantine `Group` — so it is not the same defect shape as the
  other twelve. It is excluded from 724 and routed to Sprint 49.
- **`MobileBottomNavView`** is Task 713's landed work (Sprint 50, closed). 724 may measure against it but must not
  edit it; if the interception turns out to require a bottom-nav change, that is a new task.
