# Orchestrator Session — Task 354-Fix formation + DS-3/DS-4/DS-5 (Tasks 348–350) OWNER QA deferral

**Date:** 2026-06-01
**Session type:** Orchestration / governance (Opus 4.7 — orchestrator/architect/reviewer)
**Author:** Opus orchestrator. No production code touched. Filesystem-only writes (no git).
**Outputs:**
- `tasks/Sprints/Sprint_31_kickoff_prompt_Task_354-Fix_RenderedStorybookMobileControlLocalizationDSContract.md` (NEW — Sonnet corrective kickoff).
- This orchestrator decision log.

---

## Decision 1 — Defer the full rendered OWNER QA gate for DS-3/DS-4/DS-5 (Tasks 348/349/350)

**Decision (owner directive, 2026-06-01):** Defer the full rendered `OWNER QA REQUIRED` 14×4 pass
for the DS foundation primitives (Task 348 ActionBar / Task 349 FilterBar / Task 350 Storybook-proof
hardening) **until the current Design System hardening sequence is complete.**

**Reason:** the DS primitives are still actively being fixed/hardened (Task 354 is uncommitted and
Task 354-Fix is now queued on top of the same working tree). Running a 14×4 rendered QA pass now would
be premature and would have to be repeated after the DS changes land. Rendered QA is most valuable once
the primitive surface has stabilised.

**Standing instructions captured:**
- **Do NOT open follow-up tasks for Tasks 348, 349, 350.** Their code-level work stands; only the
  rendered visual certification is deferred.
- Keep the **`OWNER QA REQUIRED`** item documented as a **final foundation certification gate** — a
  single rendered 14-width × 4-locale visual pass over the stabilised DS primitives — **NOT** as a
  blocker for continuing work.
- This gate **does not block** the Sprint 31 run order: **Task 354 → Task 354-Fix → Task 355 → Task 356**
  and the remaining DS hardening proceed without waiting on it.
- The certification gate is satisfied **once** after the DS hardening sequence completes (including
  Task 354-Fix), in one consolidated rendered pass, rather than per-task now.

**Status of the gate:** OPEN — final foundation certification gate. Owner runs it after DS hardening
completes. Not a blocker. Not converted into follow-up tasks.

---

## Decision 2 — Task 354 rendered QA failure → Task 354-Fix (NOT an approval of Task 354)

**Context.** Task 354 passed code-level gates (`tsc` = 0 · `build` ✅ · `lint` 0/0 new · `check:i18n`
PASS · `build-storybook` ✅) and is **UNCOMMITTED** with `OWNER QA REQUIRED`. Owner-rendered Storybook
QA then surfaced **design-system** failures (not isolated component bugs). Code-level approval was
therefore **premature**. Task 354 is **NOT approved**.

**Routing.** Task 354 is uncommitted, so the corrective is routed as **Task 354-Fix on top of the
current working tree** (per `orchestrator-role.md` "Current status" rule). The combined result is
reviewable as Task 354-Fix; Task 354's valid changes must be preserved, not reverted.

### Orchestrator audit — confirmed root causes (anchored to real code, 2026-06-01)

| # | Failure (owner rendered evidence) | Root cause in code | Class |
|---|---|---|---|
| 1 | StatusChangeHistory shows raw `open → in_progress`, `in_progress → resolved` | `StatusChangeHistory.tsx`: `const label = (s) => labelFormatter ? labelFormatter(s) : s` — identity default. Normal stories (`Single`/`Multiple`/`Multiple_Mobile320`) pass raw enum codes with **no** `labelFormatter` → raw enum renders. uk stories smuggle localized strings into the `fromStatus`/`toStatus` data fields (a fixture hack). | component runtime + story fixture + missing DS rule |
| 2 | Mixed-language stories: uk/it stories show English "Search results", "Page content area", "Available Listings", "Browse available properties", "New Listing", "Listings" | PageShell/PageHeader/FilterBar story fixtures hardcode English scaffolding copy while the locale toolbar is set to uk/it. | story fixture + missing DS rule |
| 3 | "Filters 2" trigger but the opened sheet shows 5–6 identical chips with no active/available distinction | `FilterBar.stories.tsx` `FilterChips` renders N generic `Button size="sm" variant="outline"` chips with **no** selected/active state; `activeCount` is a disconnected number. The FilterBar primitive has no active-vs-available chip-state concept. | story fixture + missing DS contract |
| 4 | Mobile chips/buttons too small at 320/375/390; chip text looks as large as its container | `button.tsx` sizes: `sm`=h-7 (28px), `default`=h-8 (32px), `lg`=h-9 (36px) — sub-44. FilterChips use `size="sm"` (28px) as tappable mobile controls inside the Sheet; chip text `text-[0.8rem]` ≈ the 28px pill height. | missing DS mobile-control contract (primitive + story) |
| 5 | Mobile primary/secondary actions not consistently full-width/stacked (small "New Listing" pill) | `ActionBar.tsx` stacks `flex-col` `<md` but children are not `w-full`; `PageHeader.tsx` action slot is `shrink-0` (content-width) on mobile. | layout primitive + story fixture |
| 6 | Button/chip heights don't match text-field heights on a shared surface | No enforced one-row-one-height pairing between chips/buttons and Input/Combobox/Select triggers in the affected stories (`ui-rules.md §15` not represented in DS fixtures). | missing DS rule + story |

**Classification verdict:** failures are **all of the above** — component runtime issues **and** story
fixture issues **and** missing DS governance rules. The corrective therefore establishes **global DS
contracts** (mobile control touch-target/stacking, filter active-state, no raw enum labels, no
mixed-language normal stories) — it is not a one-off patch to a single story.

### Scope authorisation note (Task 350 freeze, conditionally lifted)

Task 354 froze the Tier-2 layout primitives (`PageShell/Section/PageHeader/ActionBar/FilterBar.tsx`).
For **Task 354-Fix the owner has explicitly authorised** touching `ActionBar.tsx`, `PageHeader.tsx`,
`FilterBar.tsx`, and `button.tsx` — **but ONLY if** the mobile-control / stacking / filter-state /
touch-target contract genuinely belongs in that primitive (proven, not assumed). A layout-primitive
runtime change that is not provably the source of the failure remains out of scope → STOP & ASK.
`src/app/**` and `src/modules/**` route adoption stays out of scope (no proof yet that a primitive
cannot be fixed without route changes).

**Verdict:** Task 354 NOT approved. Task 354-Fix kickoff written and handed off to Sonnet 4.6. Awaiting
executor diff for review.
