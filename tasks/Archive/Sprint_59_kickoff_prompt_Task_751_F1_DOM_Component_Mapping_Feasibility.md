# Task 751 — F1: is an automatic DOM→owning-component mapping obtainable in this build?

**Sprint:** 59 · **Type:** Feasibility preflight (measurement; zero product-code change)
**QA profile:** `Q0 Docs/Governance` + augmentation (§9) · **Status:** `KICKOFF FILED`
**Blocks:** Task 667 (its classifier cannot be specified until this returns)

---

## 1. Objective

Determine, by measurement against the running application, whether a **reliable, exact, automatic** mapping
from a DOM node to the **project component that placed it** is obtainable in this build — and if so, by which
mechanism, and within what stability boundary.

**This task produces a finding. It produces no inventory, classifies nothing, and changes no product code.**

### Why it exists

Task 667's classifier presumes such a mapping. Revision 2 of 667's decision note asserted the executor "must
walk the React fiber tree via `__REACT_DEVTOOLS_GLOBAL_HOOK__` (available in the dev build this task already
requires)". **That parenthesis was invented — nothing was tested.**
`__REACT_DEVTOOLS_GLOBAL_HOOK__` is a private DevTools integration point, not a supported public React API:
React checks whether the hook exists and calls into it if something else installed it; it does not create or
guarantee it, and its shape carries no stability guarantee. In a plain Playwright/Chromium run with no
DevTools extension loaded it may simply be absent.

Building 667 on an unmeasured mechanism is how the retracted 2026-08-16 homepage audit happened. This task
measures first.

---

## 2. Owner decisions

Quoted verbatim. **Only these three are owner-approved.**

| # | Decision | Source |
|---|---|---|
| **D-C** | *"route-level DOM реального dev-server є доказом mount; Storybook лише supplementary."* | Owner, 2026-08-16 |
| **D-H** | *"F1 та inventory evidence зберігати tracked у `docs/reviews/artifacts/task-667/`; тільки компактні текстові/JSON/HTML артефакти, без відео."* | Owner, 2026-08-16 |
| **D-J** | *"open Sprint 59 and file separate Task 751 for F1; Task 667 remains `BLOCKED/reserved` until F1."* | Owner, 2026-08-16 |

**Not owner-approved — do not treat as decided, do not rely on, do not cite as authority:**
**D-B** (`PerfDevOverlay` exclusion) · **D-D** (state matrix) · **D-E** (`inventory-gap` failure mode) ·
**D-F** (static map is coverage-only) · **D-G** (`deliberate native wrapper` allowlist) · **D-I**
(disposition for non-rendering mount points). These are orchestrator/reviewer recommendations awaiting the
owner, and they belong to Task 667's Phase 3 — **after** this task returns. Nothing in F1 depends on them.

---

## 3. Verified context

| Fact | Evidence |
|---|---|
| React 19.2.4 · React-DOM 19.2.4 · Next 15.5.18 · `@mantine/core` ^8.3.18 | `package.json` |
| `FooterView` root is `<Box component="footer" className={cn('site-footer', styles.footer)}>` | `src/components/layout/FooterView.tsx:68` |
| `.listing-card` is an existing, gate-consumed locator | `scripts/check-homepage-grid.mjs` (`'.listing-card'` anchor) |
| `AppImage`'s **outer root is a `<div ref={containerRef}>`**; its `<img>` is a child, conditional on `hasImage` | `src/components/ui/AppImage.tsx:119-127` |
| `MantineRootProvider` renders `<Notifications position="top-right" />`; the resulting container class is `.mantine-Notifications-root` | `src/design-system/mantine/MantineRootProvider.tsx:39`, and the Task 723 comment at `:31-38` naming that class |
| `MantineRootProvider` itself emits **zero host elements** — it is `MantineProvider` → `ModalsProvider` → children | `MantineRootProvider.tsx:27-43` |
| `HeroSearchClient` loads `HeroSearch` via `dynamic(..., { ssr: false })`, showing `HeroSearchFallback` until hydrated | `src/components/shared/HeroSearchClient.tsx:6-13` |
| `hero-search-card` / `hero-search-controls` / `hero-search-fallback` are existing `data-testid` values | `src/components/shared/HeroSearchView.tsx`; `scripts/check-stories-rendered.mjs` |

---

## 4. `DOM owner` vs `project placer` — the distinction F1 must measure

These are **two different questions about the same node**, and conflating them is the defect that made
revision 4's control table wrong.

| Term | Definition | Example |
|---|---|---|
| **DOM owner** | The component whose own render call emitted this host element | `.mantine-Notifications-root` → **Mantine's `Notifications`** |
| **Project placer** | The nearest ancestor in the fiber tree that is a *first-party* component under `src/` | `.mantine-Notifications-root` → **`MantineRootProvider`** |

**667 needs the project placer.** An inventory saying "this node belongs to Mantine `Notifications`" is
useless for migration scoping; "this node is here because `MantineRootProvider` put it here" is the answer.

A mechanism that returns only the DOM owner is a **partial pass**: record it as such, state what it cannot
answer, and do not report it as satisfying criterion 1.

Both values must be emitted per control, in separate fields. A mechanism that cannot distinguish them fails
criterion 2 (exactness).

---

## 5. Fixed measurement conditions

All five controls are measured under **one** pinned condition set. Varying any of these invalidates the run.

| Parameter | Value |
|---|---|
| Route | `/sq` (the default locale, per `layout.tsx:34` fallback) |
| Locale | `sq` |
| Viewport | `1440 × 900` — desktop tier, above the `md` breakpoint, so no mobile-branch substitution |
| Hydration | **Fully hydrated.** Wait for the `HeroSearch` dynamic chunk to resolve — `[data-testid="hero-search-card"]` present **and** `[data-testid="hero-search-fallback"]` absent. Measuring the fallback instead of the hydrated component is a failed run, not a result |
| Seed | Fixed seeded dataset (§6) |
| Auth | Anonymous |
| React | 19.2.4, as installed; record the resolved version from the running page, not from `package.json` |

---

## 6. Seeded fixture — locator uniqueness

Revision 4's controls were **not uniquely addressable**: `.listing-card` matches every card on the page, and
"the nested `<div>` inside a listing card" identifies nothing. A control that cannot be addressed
deterministically cannot be reproduced across three reloads.

Seed the database so the homepage renders a **known listing with a fixed slug/id**, referred to below as
`<FIXTURE_SLUG>`, appearing in the *featured* section. Record the actual slug/id in the finding.

Every control locator below must resolve to **exactly one** node. The probe asserts
`document.querySelectorAll(locator).length === 1` for each, **before** any mapping is attempted; a count other
than 1 aborts the run as a fixture defect, never as a mechanism failure.

---

## 7. Control mount points — declared before any mechanism is tried

Choosing controls after seeing results is how a probe agrees with itself.

| # | Locator (must be unique) | Expected **DOM owner** | Expected **project placer** | Chosen because |
|---|---|---|---|---|
| C1 | `.site-footer` | `FooterView` | `FooterView` | `locale shared UI`; project-authored class; single instance; owner ≡ placer (the simple case) |
| C2 | `[data-listing-slug="<FIXTURE_SLUG>"]`, or the seeded card's `.listing-card` disambiguated by slug/id — **the probe must state the exact selector used** | `ListingCard` | `ListingCard` | `route body`, **multi-instance family** — tests disambiguation among siblings |
| C3 | The `<div>` at `AppImage.tsx:119` **within C2's subtree**, addressed relative to C2, not globally | `AppImage` | `AppImage` | The `native wrapper` candidate. **Expected outer root is a `<div>`, not an `<img>`** |
| C4 | `.mantine-Notifications-root` | **Mantine `Notifications`** | **`MantineRootProvider`** | `global shared UI`; the **owner ≠ placer** case — the hardest and the one 667 actually depends on |
| C5 | `[data-testid="hero-search-card"]` | `HeroSearchView` | `HeroSearchView` | `route body`; testid-grounded; also supplies the candidate-(d) measurement; requires the hydrated state (§5) |

**On DOM indices.** No index is declared here. An index cannot be stated truthfully without running the app,
and inventing one would repeat the fabricated parenthesis that created this task. The executor records each
control's concrete DOM path on **run 1**, freezes it as the baseline, and runs 2–3 must reproduce it.

**Zero-host-element components** (`MantineRootProvider`, `MantineProvider`, `ModalsProvider`,
`NextIntlClientProvider`, `AuthProvider`) are **deliberately not controls**: with no host element there is no
DOM node to map, so they cannot test a DOM→component mechanism. Their taxonomy is 667's D-I question, not
this task's.

---

## 8. Candidate mechanisms

Evaluate each; record chosen or rejected **with the reason**, for all four, even after one passes.

| ID | Mechanism | Note |
|---|---|---|
| M-a | `__REACT_DEVTOOLS_GLOBAL_HOOK__` | Record whether it exists at all before attempting use |
| M-b | React internal expando keys on host nodes — `__reactFiber$*` / `__reactProps$*` | Private; record the exact key pattern observed at runtime |
| M-c | Build-time transform emitting a source-identifying attribute | **Would write to `src/` → out of this task's write set and needs its own owner decision.** Evaluate on paper only; do not implement |
| M-d | Existing `data-testid` coverage | Measure and report the **uncovered fraction as a number** |

### Pass criteria — all four, or F1 fails

1. All five controls resolve from their declared locator to their declared **project placer**, and C4's
   **DOM owner** is additionally reported and distinct.
2. Mapping is **exact and automatic** — no manual inspection, no human disambiguation, no "obviously this one".
3. All three reloads produce identical placers, identical owners, and identical DOM paths against the run-1
   frozen baseline.
4. The stability boundary is stated: which React version the mechanism binds to and what upgrade breaks it.

**M-d specifically:** any uncovered fraction, however small, disqualifies `data-testid` as the **sole**
mechanism for a complete inventory. It may still serve as a corroborating second signal — say which.

### What a failure means, exactly

*"In this build, no reliable automatic DOM→component mapping was demonstrated."*

It does **not** mean an inventory is impossible, that Sprint 59 closes, or that 667 is unachievable.
Generalising a bounded negative result into a verdict on the goal is the retracted audit's error with the sign
flipped. On failure, return the measurement and the candidate alternatives (including M-c, which needs its own
owner decision). **Closing or re-scoping Sprint 59 or Task 667 requires a separate owner decision and may not
be inferred from this result.**

**No fallback to class-name matching under any outcome.** Class-name matching produced the retracted audit;
F1 failing does not resurrect it.

---

## 9. Scope, write set, QA

**In scope:** a probe run against the seeded dev server under §5; the finding and its artifacts.

**Write set — exact and complete:**

| # | Path | Change |
|---|---|---|
| W1 | `docs/reviews/artifacts/task-667/f1/FINDING.md` | new — the finding |
| W2 | `docs/reviews/artifacts/task-667/f1/**` | new — probe source, per-control per-run mapping results (JSON), the run-1 frozen baseline. **Text / JSON / HTML only, compact. No video, no screen recordings** (D-H) |
| W3 | `docs/backlog.md` | 751 row → actual final status; Last Session 2–4 lines |
| W4 | `tasks/Sprints/Sprint_59_Route_Level_Inventory_Before_Any_Migration_Claim.md` | Tasks table → the **same** status as W3 |
| W5 | `docs/sessions/2026-08-__-task751-f1-dom-component-mapping.md` | new — session log |

**Out of scope, must not change:** any `src/` path (this alone rules out implementing M-c) · any story ·
`docs/homepage-route-inventory.md` (that is 667's deliverable) · Task 667's registry row · any inventory row
of any kind · `mantine-migration-scope.json`.

**QA profile `Q0 Docs/Governance`** — the write set is docs and artifacts; zero `src/` paths, so
`npm run build` is not required. **Augmentation:** the per-control per-run results and the run-1 baseline are
retained artifacts, not report prose; the finding names every rejected mechanism with its reason.

If any `src/` path enters the diff, the profile is void → `BLOCKED`, never self-promotion to Q1.

---

## 10. Worktree baseline

**Take a fresh native `git status --porcelain` immediately before starting.** Do not reuse any baseline quoted
in a document, including this one — the 741/749 archive commit has already landed since the last measurement,
and **freshness is not accuracy**.

Known at filing time: the archive commit for Tasks 741 and 749 is **complete and committed**;
`docs/backlog.md` and `docs/backlog-archive.md` are **not** pending changes and must not be treated as a dirty
baseline. The `.click-shield-ci-fixture.stderr.log` / `.stdout.log` files are pre-existing untracked CI-fixture
output, unrelated to this task, and must never be staged.

---

## 11. Negative-flow applicability

| Branch | Applicable? | Source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form or action touched | N/A | — |
| Authorization/RLS | No | Anonymous route only (§5) | N/A | — |
| Offline/network | No | Local controlled dev server | N/A | — |
| Concurrent writer | No | Read-only against a seeded snapshot | N/A | — |
| **Dev server unraisable** | **Yes** | D-C | `BLOCKED`. No static-analysis substitute | Report |
| **A control locator is not unique** | **Yes** | §6 | Abort as a **fixture defect**; fix the seed and re-run. Never recorded as a mechanism failure | Probe output showing the match count |
| **Page measured un-hydrated** | **Yes** | §5 | Failed run, discard and re-run. Never reported as a C5 result | Probe assertion on fallback absence |
| **All four mechanisms fail** | **Yes** | §8 | Return the measurement; do not close Sprint 59 or 667 | `FINDING.md` |

---

## 12. Acceptance criteria

- **AC1** — before any mapping, each of C1–C5 asserted `querySelectorAll(locator).length === 1`, with the counts recorded.
- **AC2** — for every control, both **DOM owner** and **project placer** are reported in separate fields; C4 shows them as **different** values (`Notifications` vs `MantineRootProvider`).
- **AC3** — three reloads produced identical placers, owners and DOM paths against the run-1 frozen baseline, all retained per-run.
- **AC4** — all four candidate mechanisms M-a…M-d appear in the finding with an explicit chosen/rejected verdict and reason, including those not reached after an earlier pass.
- **AC5** — M-d's uncovered `data-testid` fraction is reported as a number.
- **AC6** — the stability boundary names the React version bound and what upgrade breaks the mechanism.
- **AC7** — measurement conditions (§5) and the actual `<FIXTURE_SLUG>` are recorded in the finding.
- **AC8** — `git status --porcelain`, minus the §10 fresh baseline, contains no `src/` path, no story path, and no `.click-shield-ci-fixture.*` entry.
- **AC9** — the finding states the bounded meaning of its result verbatim per §8, and proposes **no** closure or re-scope of Sprint 59 or Task 667.
- **AC10** — no artifact under W2 is a video or screen recording (D-H).

---

## 13. Verification plan

1. Fresh native `git status --porcelain`; record as the baseline (§10).
2. Seed the fixture (§6); record `<FIXTURE_SLUG>`.
3. Raise the dev server (D-C). Failure → `BLOCKED`.
4. Navigate to `/sq` at 1440×900; assert hydrated state (§5).
5. Assert locator uniqueness for C1–C5 (AC1). Any count ≠ 1 → fix the seed, restart from step 2.
6. Run 1: record placers, owners and DOM paths; freeze as baseline.
7. Runs 2 and 3: reload independently; compare against the frozen baseline.
8. Evaluate M-a…M-d; record verdicts and reasons for all four.
9. Write `FINDING.md`; retain per-run JSON.
10. `git status --porcelain` → retain for AC8.
11. `node scripts/check-file-integrity.mjs`, `node scripts/check-mojibake.mjs` on touched markdown.
12. W3/W4 with the **actual** status; write W5.

---

## 14. Completion-report contract

Changed files (exact paths); commands run with their **actual** output; `<FIXTURE_SLUG>` and all §5
conditions; per-control per-run results; the run-1 baseline; verdicts and reasons for all four mechanisms;
the measured `data-testid` uncovered fraction; the stability boundary; assumptions; deviations; limitations;
unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never
self-approve.** A mechanism failure is a valid `IMPLEMENTED` outcome — F1's deliverable is the measurement,
not a passing mechanism. Do **not** report `BLOCKED` merely because every mechanism failed; that is a result.

---

## 15. Handoff

Execute from this saved file, not from chat. Read `.claude/skills/execute-task/SKILL.md` plus the pre-read
bundle: `docs/agent-contract.md`, `docs/qa-profiles.md`, and the source files cited in §3. Do not read the
full docs tree. Do **not** read or act on Task 667's decision note beyond its §5.2 — 667 stays `BLOCKED`
(D-J) and its six open recommendations are not yours to apply.

Do **not** use the retracted 2026-08-16 Opus homepage audit or its `.artifacts/_to_delete/` probe as an input.
