# Sprint 77 — the full test suite is red, and no gate runs it (widened 2026-09-18: the unsprinted reserved work)

**Opened:** 2026-09-18 · **Status:** 🟠 **OPEN** · **Landed tasks:** 1 (790 R1) · **Active tasks:** 0 · **Reserved:** 7 (790 rest · 786 · 799 · 800 · 798 · 801 · 802)

> **Opened by owner instruction, 2026-09-18:** *"напиши задачу для Sonnet в рамках Task 790, як revision 1, щоб
> Sonnet виправила тест, після виправлень нехай запустить тести"*.
>
> Task 790 was reserved on 2026-09-05 by 788's review **without a sprint** (the backlog row carried none, and
> Sprint 70's own Tasks table never listed it). The 2026-08-01 owner rule forbids a kickoff without a sprint, and no
> open sprint's goal fits (table below), so this sprint was opened in the same edit as 790's first kickoff.

> **Goal widened by owner decision, 2026-09-18.** Asked to give a sprint to the six reserved numbers that never had
> one, the owner answered: *"Якщо ці задачі дійсно ще актуальні, тоді треба створити спринт і внести ці всі задачі
> у спринт."* When a new Sprint 78 was being drafted, the owner said *"зачекай плодити спрінти, 77 спрінт пустий"*,
> and then chose **"Розширити мету Sprint 77"** over three alternatives (a new Sprint 78; 786 and 799 only; leave
> them unsprinted). **786, 798, 799, 800, 801 and 802 are therefore hosted here by owner decision, not by goal fit.**
> The goal-fit table below was written for 790 alone and applies only to 790. 801/802's backlog note ("needs its own
> sprint", "not Sprint 71") is superseded by this decision. The Sprint 78 draft was withdrawn uncommitted.

## Why not an existing sprint — checked before opening this one (790 only)

| Sprint | Its goal | Fits 790? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — a UI migration; 790 changes no visible artifact. |
| **55** | ARIA semantics no gate sees | No — accessibility semantics, not test-suite health. |
| **56 · 57** | Raw enum leaks / delete what no longer earns its place | No — 56 is a locale-leak detector; 57 is pure removal proven inert. |
| **61 · 62** | Projection layer no gate reads / Tailwind runtime tokens | No — both are specific gate families, not the unit-test suite. |
| **68 · 69** | `/listings` leaves Tailwind | No — surface migration. |
| **70** | The site chrome leaves Tailwind | **Closest, and still no.** 790 was *filed* by 788 in this sprint and its first failure sits in `FooterView.tsx`, but the defect is a test assertion, not chrome, and 790's other failures (`ListingCard.smoke`, an evidence-folder test) have nothing to do with the header/footer. |
| **71 · 72 · 73 · 74** | Listing-detail de-Tailwind / similar listings / sold reachability / card width | No — surface or feature work. |

## Goal

`npm run test` (`vitest run`) — the whole suite — **exits 0, deterministically**, with every failure resolved by an
explicit per-failure decision: the **test** was wrong, or the **source** was wrong. Then decide, in writing, whether
the full suite joins the standing gate set, so a red suite can never again sit unnoticed across a dozen tasks (the
`footerGridGap` failure appears as `×` in retained transcripts of 775, 782, 788, 791, 797, 803, 807–810, 813, 822,
825 and 842 — every one waved it through as "known-red").

The narrower point: **a source-text assertion is a detector, and a detector has blind spots.** 790 R1 is the proof
case — a substring check that a type-only `!` defeats (false red), sitting beside an entry that passes on a comment
(false green).

**Widened goal (owner decision, 2026-09-18).** The sprint also closes the reserved work that no sprint owned:

- **786** — a React hook in a Server Component took `lero.al` down, and no gate can see it.
- **799** — the Storybook viewport switcher never resized the preview, so every owner width review happened blind.
- **800** — the listing-detail Story proves only the guest state.
- **798** — Leaflet's chrome is English on every locale.
- **801 → 802** — the owner-requested listing-feedback feature. It is feature work hosted here by that decision, not
  a blind-spot fix.

### Relevance check — each number re-measured on 2026-09-18 before enrolment

| # | Still needed? | Evidence (read-only, 2026-09-18) |
|---|---|---|
| **786** | **Yes** | No script under `scripts/` detects a React hook in a Server Component, and `eslint.config.mjs` has no such rule. |
| **798** | **Yes** | `src/components/shared/Map.tsx:27-32` configures only `zoomControl` and the OSM `attribution`, with no localized Leaflet strings. The only related allowlist entry is `/^OpenStreetMap$/` (`scripts/check-hardcoded-i18n.mjs:87`). |
| **799** | **Yes** (by record) | Task 825's kickoff (2026-09-16) still says the toolbar does not resize the preview. `.storybook/` is unchanged since `ac9d01a99` (2026-09-03), before 799 was filed. Not reproduced live in this check. |
| **800** | **Yes** | `ListingDetailView.stories.tsx:164/187/199` still sets `isGuest: true` in every state. Fixtures still point at `https://example.com/*` (`:84-86`). No shared view-model builder exists in `src/`. |
| **801** | **Yes** | No rating or feedback schema, action or component exists: `git grep` for `listing_ratings`/`listing_feedback`/`rating_reason` returns 0 hits. |
| **802** | **Yes** | Depends on 801's schema, which does not exist yet. |

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from the kickoff.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **790 · R1** | `theme.d69-18` contract check tolerates TypeScript non-null assertions — `FooterView` `footerGridGap` false red | **P1** | **Q1** | ✅ **ARCHIVED** 2026-09-18 — `APPROVED`, review 2 (evidence-only Revision 1) → [`Sprint_77_kickoff_prompt_Task_790_R1_…`](Sprint_77_kickoff_prompt_Task_790_R1_FooterView_Non_Null_Source_Assertion.md) |
| **790 · rest** | Every other full-suite failure, per-failure test-vs-source decision; the comment-only `theme.breakpoints.lg` needle; the non-deterministic group; the standing-gate decision | **P1** | TBD | reserved — kickoff not yet written. Scope in `docs/backlog.md` → registry row **790**. |
| **786** | Detector: a React hook called in a Server Component fails a gate (two-armed plant) | **P1** | Q1 (gate) | reserved — kickoff not yet written |
| **799** | Storybook viewport switcher resizes the preview (two-armed reflow check) | **P1** | TBD | reserved — kickoff not yet written |
| **800** | One listing-detail view-model builder shared by both routes and the Story; Story states for the real production variants; local fixture images | **P1** | TBD | reserved — kickoff not yet written |
| **798** | Leaflet control/attribution chrome: localize, or accept per string as a documented third-party exception | **P3** | TBD | reserved — kickoff not yet written |
| **801** | Public listing-feedback blocks on `/[locale]/listings/[slug]` + data model + RLS | TBD | Q4 (RLS/write path) | reserved — kickoff not yet written |
| **802** | Admin ratings popup and ratings page, with status | TBD | TBD | reserved — **blocked on 801** |

## Execution order

**790 R1 first.** It is independent of every other failure (one test file, no source change) and removes the one
failure every task has been citing as "known-red", so later slices start from a smaller, honest baseline. The rest
of 790 is written only after R1 lands, against a fresh full-suite measurement — never against counts in this file.

For the widened scope:

- **786** goes first. It guards against a repeat production outage.
- **799** comes before any task here that needs an owner visual matrix. Until it lands, owner visual QA uses the
  browser window or DevTools device mode, never the toolbar.
- **800** comes after 799.
- **798** must never run at the same time as **839** (Sprint 71, `Map` leaves Tailwind): both edit
  `src/components/shared/Map.tsx`. Land 839 first, or fold 798 into 839 by owner decision.
- **801 → 802**: 802 cannot start before 801's schema is approved.

The 790 slices are independent of all of these.

## Preconditions

- Native Windows PowerShell; `node.exe -p process.platform` returns `win32`.
- `npm run build` can run locally (every non-Q0 task carries it).

## Exit criteria

1. `npm run test` exits 0 on **three consecutive runs** with no source change between them.
2. Every failure that existed at the sprint's opening has a recorded disposition — *test wrong* or *source wrong* —
   in a session log, with its fix.
3. No test was deleted, skipped (`.skip`, `.todo`, `it.fails`) or loosened to reach criterion 1 without an owner
   decision quoted with its date.
4. The standing-gate decision for the full suite is recorded in `docs/binding-decisions.md` or as an owner row.
5. Each of 786, 798, 799, 800, 801 and 802 is either archived with an approved review, or re-dispositioned by an
   owner decision quoted with its date.
6. **786** and **799** each ship with a two-armed proof: the check fails on a planted defect and passes once the plant
   is removed.
7. **801** ships its RLS with automated evidence for both paths: an anonymous or unauthorized write is rejected, and
   an authorized write succeeds.
