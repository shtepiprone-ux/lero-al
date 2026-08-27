# Task 772 — `ListingsSortBar` mobile overflow: bounded layout fix with route-level proof

**Sprint:** 66 · **Priority:** P1 · **Filed:** 2026-08-27 by owner decision · **Status:** `KICKOFF FILED`

## 1. Mode and task type

Implementation task. Type: **legacy-surface responsive layout defect**. Not a migration, not a de-Tailwind, not a
detector task. One surface, one row, mobile widths only.

## 2. Objective

`/listings` must not scroll horizontally below 640px in any of the four locales, with the filters trigger and the
sort control still usable and every interactive control in the sort bar at a rendered height of at least 44px.

The deliverable is **the fix plus the route-level evidence that it worked**, produced by a task-owned probe. Per the
owner decision of 2026-08-27 (`docs/maintenance-playbook.md` §14.3) no route-composition CI gate exists or will be
built, so this task carries its own route evidence and does not cite any component-scoped gate as route proof.

## 3. Verified context

Every line reference below was read in this repository on 2026-08-27. Labels are per `create-task`'s evidence rules.

### 3.1 The surface — `src/modules/listings/components/ListingsSortBar.tsx`

- **FACT** `:46` — root: `<div className="listings-sort-bar flex items-center justify-between gap-3 py-3 border-b">`.
  The class `listings-sort-bar` has **no** CSS rule anywhere in `src/` (grep: the only occurrence is this line); it is
  a hook, not styling.
- **FACT** `:48` — left group: `flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0`. It can shrink.
- **FACT** `:52-56` — `showing_results` is rendered only when `total > 0` and is `hidden sm:block`.
- **FACT** `:60` — right group: `flex items-center gap-2 shrink-0`. **It cannot shrink.**
- **FACT** `:62-65` — mobile filters button: `<Button variant="outline" size="lg" className="md:hidden px-3 rounded-xl relative gap-1.5">`.
- **FACT** `:69` — its text label is `hidden sm:block`, so below 640px the button is icon-only.
- **FACT** `:71` — the active-filter count is an absolutely positioned badge (`-top-1.5 -right-1.5`), outside flow.
- **FACT** `:78-85` — sort control: `<Combobox variant="button" size="sm" className="w-auto min-w-35" />`.
- **FACT** `:88` — the grid/list toggle is `hidden sm:flex`; it does not exist below 640px.

### 3.2 Why the right group cannot shrink — `src/components/ui/button.tsx`

- **FACT** `:27` — `size: lg` = `h-9 gap-1.5 px-2.5 … max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`.
- **INFERENCE (must be measured, not assumed)** — below 640px the filters button therefore resolves to `width: 100%`
  of its flex line inside a `shrink-0` group. That combination is the leading candidate mechanism for the overflow.
  It is a hypothesis until the probe measures the element's rendered width. **Do not write the fix against this
  explanation before the "before" run confirms it** (D37, and the recurring kickoff-fact failure mode in
  `docs/orchestrator-procedures.md`).
- **FACT** `:27` — the same `size: lg` string supplies `max-sm:min-h-11` (44px), so the filters button already meets
  the touch-target floor below 640px. The fix must not remove it.

### 3.3 The sort control — `src/components/shared/Combobox.tsx`

- **FACT** `:185` — `heights = { default: h-11, sm: h-9, xs: h-8 }`; the call site passes `size="sm"`, so the trigger
  renders **`h-9` = 36px at every width**. There is no `max-sm:` height override on the trigger.
  **This is below the 44px floor and is a defect in scope for this task.**
- **FACT** `:242` and `:260` — only the dropdown *options* carry `max-sm:min-h-11`; the trigger does not.
- **FACT** `:190-197` — `triggerBase` composes `w-full … h ts … triggerClassName`.
- **FACT** `:40`, `:79` — `triggerClassName` is a public prop. **A height fix is therefore available at the call site
  with zero blast radius**; changing `Combobox`'s own size map is not.
- **FACT** `:317` — the trigger label is `flex-1 min-w-0 truncate`, so the label itself already truncates; the width
  floor comes from `min-w-35` at the call site, not from the label.
- **INFERENCE** — `min-w-35` resolves to `min-width: 8.75rem` (140px) on Tailwind v4's spacing scale. **Confirm from
  the compiled CSS, not from this line.**

### 3.4 The row has a second occupant — `src/modules/listings/components/ListingsShell.tsx`

- **FACT** `:193-206` — the sort bar is not alone: `<div className="flex items-center gap-2">` wraps
  `<div className="flex-1 min-w-0"><ListingsSortBar …/></div>` and, **when a user is authenticated**,
  `{user && <SaveSearchButton />}`.
- **FACT** `src/modules/listings/components/SaveSearchButton.tsx:72-76` — that button is a `Button` with
  `className="gap-1.5 rounded-xl"` and a `hidden sm:inline` label, so it inherits the same `max-sm:w-full` behaviour
  from its size variant.
- **CONFLICT — read this before scoping.** The owner scoped this task to *"only ListingsSortBar mobile layout"*, and
  the measured row contains a sibling that plausibly contributes to the same overflow. **Do not widen scope.**
  Measure **both** authentication states; fix only inside `ListingsSortBar`; if a residual overflow remains in the
  authenticated state and is attributable to `SaveSearchButton`, **report it as a finding with its measurement** and
  leave it unfixed. A finding is the correct output here; a scope widening is not.

### 3.5 Route and locales

- **FACT** — route file `src/app/[locale]/listings/page.tsx`; its content sits in `container-wide` wrappers (`:84`, `:95`).
- **FACT** — `messages/` contains exactly `en.json`, `it.json`, `sq.json`, `uk.json`.
- **FACT** — the sort labels differ substantially in width across locales: `sort_newest` is `Newest first` (en),
  `Më të rejat` (sq), `Спочатку нові` (uk), `Prima i più recenti` (it); `sort_price_desc` is `Prezzo: dal più alto` (it).
  `found_results` is `{count} listings` / `{count} njoftime` / `{count} оголошень` / `{count} annunci`.
- **UNKNOWN** — the actual `scrollWidth` at each width/locale, and whether the defect reproduces at 375 and 390 or
  only at 320. The "before" run establishes this; the kickoff deliberately asserts no number here.

### 3.6 Evidence tooling precedent

- **FACT** — `scripts/task766-route-shell-probe.mjs` is a task-owned Playwright route probe: `BASE_URL` from the
  environment, per-label JSON written under `docs/sessions/evidence/task766/`, **no** `package.json` entry and no CI
  dependency. Its header states why it exists: nothing in `scripts/` renders a real route.
  **772 follows that shape exactly.**

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner, 2026-08-27 | On real `/listings` at 320/375/390 in sq/en/uk/it, `documentElement.scrollWidth <= clientWidth + 2` | P0 | Task probe, post-fix run | Confirmed |
| R2 | Owner, 2026-08-27 | Filters and sort remain usable: the filters trigger opens the sheet; the sort control opens and a selection updates the `sort` query parameter | P0 | Task probe interaction assertions | Confirmed |
| R3 | Owner, 2026-08-27 | Every interactive control in the sort bar renders at height >= 44px at those widths | P0 | Probe `getBoundingClientRect().height` per control | Confirmed |
| R4 | Owner, 2026-08-27 | No unrelated de-Tailwind and no component migration | P0 | Diff inspection at review | Confirmed |
| R5 | §3.4 | Both authentication states are measured; a residual attributable to `SaveSearchButton` is reported, not fixed | P1 | Probe run in both states + completion report | Confirmed |
| R5a | §5 precondition | The authenticated run uses a validated session from `TASK772_AUTH_STORAGE_STATE`; if it is unavailable or invalid, the task records `AUTH_STATE_UNAVAILABLE` and finishes `BLOCKED` rather than claiming AC6 | P0 | AC6 | Confirmed |
| R6 | `docs/qa-profiles.md` Q2 | No regression at 768 / 1024 / one desktop width; the >=640px layout keeps its label text, grid/list toggle and single-row arrangement | P0 | Probe + rendered check at those widths | Confirmed |
| R7 | Repo discipline (D37, orchestrator failure modes) | The "before" run reproduces the defect it claims to fix; non-reproducing cells are recorded, not dropped | P0 | Retained pre/post evidence per cell | Confirmed |
| R8 | `docs/qa-profiles.md` Q1 floor | `npm run build` exits 0; typecheck and mojibake pass | P0 | Retained transcripts | Confirmed |

## 5. Assumptions and open questions

- **Precondition, binding — the authenticated probe run.** The authenticated cells require
  **`TASK772_AUTH_STORAGE_STATE`**, an environment variable holding the absolute path to a **local, untracked**
  Playwright storage-state JSON carrying a **valid authenticated session** for this environment. It is created by
  the executor outside the repository tree (or under an ignored path), is **never** committed, and **no credential
  is written into any evidence file, transcript or session log**.
  - The probe **must verify the session is actually valid** — load the state, open `/listings`, and confirm the
    authenticated-only affordance (`SaveSearchButton`, `ListingsShell.tsx:205`) is present. A storage state that
    loads without error but no longer authenticates is **invalid**, not usable.
  - **If the variable is unset, the path does not exist, or the session does not validate:** record
    **`AUTH_STATE_UNAVAILABLE`** in the evidence and the session log, naming which of the three conditions failed,
    and finish the task as **`BLOCKED`**. Do **not** report **AC6** as `PASS`, do not infer the authenticated result
    from the anonymous run, and do not substitute a mocked or hand-built session.
  - The anonymous cells are unaffected and are still measured and reported.
- **Assumption** — a seeded database with at least two pages of listings is available. Without it `showing_results`
  never renders (`:52`) and the measurement is not representative. If it is unavailable, publish `BLOCKED`; do not
  measure an empty page and call it a pass.
- **Open question, non-blocking** — whether the correct fix is to drop `shrink-0`, to constrain the filters button's
  `max-sm:w-full` at this call site, to lower or remove `min-w-35` below `sm`, or a combination. **The executor
  chooses after the "before" measurement names the actual contributor.** Any of them is acceptable if it satisfies
  R1-R3 and R6 without touching a shared component's own API.
- **UNKNOWN** — whether `min-w-35` is even reachable below 640px once the button's width behaviour is corrected.

## 6. Pre-read rule bundle

Read exactly these, in this order. Do not read all docs.

1. `docs/agent-contract.md` — P0 invariants.
2. `docs/rule-index.md` — confirm the bundle for a legacy responsive UI fix.
3. `docs/qa-profiles.md` — Q2 definition, viewport policy, negative-flow applicability.
4. `docs/ui-rules.md` and `docs/design-system.md` — this is a **legacy shadcn/Tailwind** surface; legacy rules apply
   and Mantine rules do **not**.
5. `docs/component-rules.md` — container/presentational split and the shared-component boundary (relevant because
   `Combobox` and `Button` are shared and must be changed only from the call site).
6. `docs/responsive-governance.md` — responsive evidence expectations.
7. `docs/i18n-rules.md` — four-locale obligations.
8. `docs/maintenance-playbook.md` §14.3 — task-scoped route evidence; why no global route gate may be claimed.
9. `docs/backlog.md` — current state, and this task's registry row.

## 7. Scope

- `src/modules/listings/components/ListingsSortBar.tsx` — the mobile (`< 640px`) arrangement of its two groups and
  the three controls that exist there.
- Call-site-only adjustments to the shared `Button`/`Combobox` usage inside that file, including `triggerClassName`.
- One new task-owned probe, `scripts/task772-listings-overflow-probe.mjs`, modelled on
  `scripts/task766-route-shell-probe.mjs`: `BASE_URL` from the environment, per-label JSON evidence under
  `docs/sessions/evidence/task772/`, **no** `package.json` script entry, no CI wiring.

## 8. Out of scope

- `SaveSearchButton`, `ListingsFilters`, the filters sheet contents, `ListingsStatusTabs`, `ActiveFilterChips`.
- `src/components/ui/button.tsx` and `src/components/shared/Combobox.tsx` themselves — no edit to their size maps,
  variants or props. If R3 cannot be met from the call site, publish `BLOCKED` with the measurement rather than
  editing a shared primitive.
- Any de-Tailwind, Mantine migration, token work, or restyle. Visual change is permitted **only** where it is the
  mechanism of the layout fix.
- The desktop layout at >= 640px, other than proving it did not regress.
- Any permanent gate, CI entry, or Storybook story. A story added only to exercise this measurement is a probe, not
  an artifact — see the permanent-story creation gate in `.claude/skills/create-task/SKILL.md`.

## 9. Current and required behavior

**Current, to be measured before it is changed.** Below 640px the sort bar shows a count line, an icon-only filters
trigger and a sort control. The right-hand group is `shrink-0`; the filters `Button` carries `max-sm:w-full`; the sort
wrapper carries `min-w-35`; the sort trigger is 36px tall.

**Required after.** At 320/375/390 in all four locales the document does not scroll horizontally
(`scrollWidth <= clientWidth + 2`); the filters trigger still opens the sheet; the sort control still opens and still
changes `sort`; every interactive control in the bar is at least 44px tall.

**Preserved, must not change.** The active-filter badge stays attached to the filters trigger and still shows the
count. `showing_results` stays hidden below `sm` and visible at and above it. The grid/list toggle stays hidden below
`sm` and unchanged above it. The `listings-sort-bar` class name stays — it is a stable hook; do not re-anchor anything
onto a utility class (**D33**). All localized strings stay untouched; this is a layout fix, not a copy fix.

## 10. Implementation requirements

1. **Measure first.** Run the probe against the unmodified code and retain its output as `before`. It must record,
   per width x locale x auth state: `scrollWidth`, `clientWidth`, the bounding boxes of the sort-bar root, both
   groups and each control, and the identity of the widest overflowing element.
2. **Then fix, minimally**, inside `ListingsSortBar.tsx` only.
3. **Raise the sort trigger to >= 44px below `sm` from the call site** via `triggerClassName`, without changing
   `Combobox`'s size map and without altering its height at or above `sm`.
4. **Re-measure with the same probe** and retain the output as `after`. Same cells, same script, no edits to the
   script between runs; if the script must change, both runs are re-taken.
5. Do not introduce an arbitrary-value utility where a scale value exists; if one is unavoidable, carry the
   `design-tokens-allow:` marker with a reason, as the repository already does elsewhere.
6. Do not add, delete or rename a Storybook story.

## 11. Positive and negative flows

**Positive flow.** A phone-width visitor opens `/listings` in any locale, sees the result count, the filters trigger
and the sort control on one line with no horizontal scroll, taps the filters trigger and the sheet opens, taps the
sort control, picks another option, and the list re-sorts with `?sort=` updated.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form input is added or changed | N/A | — |
| Authorization / RLS | **No** | `/listings` is a public route; this task changes no data access | N/A | — |
| Offline / network | **No** | Existing global behavior unchanged | N/A | — |
| Concurrent writer | **No** | No write path | N/A | — |
| **Authenticated vs anonymous** | **Yes** | `ListingsShell.tsx:205` renders `SaveSearchButton` only for `user` | Anonymous must pass R1 outright. Authenticated is measured; a residual attributable to `SaveSearchButton` is reported as a finding, not fixed | Probe run in both states |
| **Authenticated session unavailable** | **Yes** | §5 precondition | `AUTH_STATE_UNAVAILABLE` recorded with the failing condition; task finishes `BLOCKED`; AC6 never claimed as `PASS` | `auth-state.txt` in the evidence directory |
| **Empty result set (`total === 0`)** | **Yes** | `ListingsSortBar.tsx:52` hides `showing_results` at 0 | No overflow, no layout collapse, count line still rendered | Probe cell with a filter that yields zero results |
| **Singular result (`total === 1`)** | **Yes** | `:50` swaps to `found_results_one` | No overflow; the shorter string must not be the only reason a cell passes | Probe cell at `total === 1` |
| **Longest-label locale** | **Yes** | §3.5 measured `it`/`uk` sort labels as the longest | No overflow with the longest sort option selected, not only the default | Probe selects `sort_price_desc` before measuring one cell per locale |

## 12. Acceptance criteria

- **AC1 [R1, R7]** — *Given* the unmodified code, *when* the probe runs at 320/375/390 x sq/en/uk/it, *then* its
  `before` evidence is retained and identifies which cells overflow and by how much; a cell that does not overflow is
  recorded as `no-defect`, not omitted.
- **AC2 [R1]** — *Given* the fixed code, *when* the same probe runs over the same cells, *then* every cell reports
  `documentElement.scrollWidth <= documentElement.clientWidth + 2` in the anonymous state.
- **AC3 [R2]** — *Given* a phone-width `/listings`, *when* the probe activates the filters trigger, *then* the filters
  sheet becomes visible; *when* it opens the sort control and selects a different option, *then* the URL's `sort`
  parameter equals the selected value.
- **AC4 [R3]** — *Given* the fixed code at 320/375/390, *when* the probe measures each interactive control in the sort
  bar, *then* every measured height is `>= 44`.
- **AC5 [R6]** — *Given* the fixed code at 768/1024/1440, *when* the layout is rendered, *then* the sort-bar text
  label, `showing_results` and the grid/list toggle are present and the bar remains a single row — unchanged from
  `before` at those widths.
- **AC6 [R5, R5a]** — *Given* a session validated from `TASK772_AUTH_STORAGE_STATE`, *when* the probe runs the AC2
  cells in the authenticated state, *then* either they all pass, or the completion report names the residual, its
  measured contribution and the element responsible, with **no** change to `SaveSearchButton`.
  *Given* `TASK772_AUTH_STORAGE_STATE` unset, missing, or holding a session that does not validate, *when* the
  authenticated run is attempted, *then* the evidence and session log record **`AUTH_STATE_UNAVAILABLE`** with the
  failing condition named, the task finishes **`BLOCKED`**, and **AC6 is not reported as `PASS` by any other route**
  — not from the anonymous run, not from a mocked session, not by inspection.
- **AC7 [R4]** — *Given* the final diff, *when* it is inspected, *then* the only changed product file is
  `src/modules/listings/components/ListingsSortBar.tsx`, plus the new probe and its evidence; no shared primitive,
  no message file, no unrelated utility conversion.
- **AC8 [R8]** — *Given* the completed work, *when* `npm run build` runs, *then* it exits 0, and the transcript is
  retained. A failed or unrun build permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 13. QA profile and verification plan

**Profile: `Q2 Standard UI`** (`docs/qa-profiles.md`). It applies because this touches an existing legacy surface and
creates no primitive, overlay, table strategy or page shell, and migrates nothing. It is not `Q3`: no Mantine
primitive, no Storybook governance, no TailAdmin conformance slice.

**Widths and locales.** The owner's floor is **320 · 375 · 390 x sq/en/uk/it** on the real route — mandatory. Q2's
regression widths **768 · 1024 · 1440** are added, with all four locales at 320 and at 1440, and `uk@320` explicitly
required by the profile. Any cell not run is named in the report.

**Commands and evidence.**

1. `npx tsc --noEmit` (or the repository's typecheck script) — retained transcript.
2. `node scripts/task772-listings-overflow-probe.mjs before` and `… after`, each against a running server with
   `BASE_URL` set; per-label JSON under `docs/sessions/evidence/task772/`, never overwritten. The authenticated pass
   additionally requires `TASK772_AUTH_STORAGE_STATE` (§5); the probe validates the session before measuring and
   writes `auth-state.txt` recording `AUTH_STATE_VALID` or `AUTH_STATE_UNAVAILABLE` with the failing condition.
   **No credential, token or cookie value is written to any evidence file.**
3. `npm run check:mojibake` — the repository requires it for touched text files.
4. `npm run build` — exit 0, transcript retained (AC8).
5. Rendered evidence for AC5 at 768/1024/1440 from the same probe run.

**What may not be cited as proof.** No Storybook matrix result and no component-scoped gate may be presented as
route evidence for R1-R3 (`docs/maintenance-playbook.md` §14.3). The probe's own output is the proof.

## 14. Completion report contract

Report, in `docs/sessions/2026-08-<dd>-task772-listings-mobile-overflow.md`:

- Changed files with a one-line reason each.
- Requirement IDs completed, and any left open with the reason.
- Every command run with its **actual** exit code and result — not a description of what it should have produced.
- Evidence locations for the `before` and `after` probe runs, per width x locale x auth state.
- The measured mechanism: which element actually caused the overflow, stated against the `before` numbers, and
  whether it matched §3.2's hypothesis. **If it did not, say so plainly** — the hypothesis is not the finding.
- The authenticated-state result and any `SaveSearchButton` residual, as a finding — or `AUTH_STATE_UNAVAILABLE` and a `BLOCKED` status if the precondition in §5 was not met. Never both.
- Assumptions, deviations, limitations, unresolved issues.
- Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
  **Never self-approve**; Sonnet has no approval authority.
- Update `docs/backlog.md`'s Task 772 registry row and the Sprint 66 Tasks table **in the same edit** as the session
  log — both, not one (the 2026-08-10 fourth-occurrence corollary).

## 15. Task quality gate

- A fresh Sonnet session can execute this without chat context — the surface, the line references, the probe
  precedent, the widths, the locales and the report path are all named here. ✅
- Every P0 requirement has a binary acceptance criterion and a verification method. ✅
- Scope names what must not change, including the two shared primitives and the sibling button. ✅
- Negative flows are selected by applicability, not copied: four branches marked `No` with their reason, four real
  branches marked `Yes`. ✅
- No command, file, story or behavior is claimed here that was not inspected on 2026-08-27; the one mechanism this
  kickoff finds plausible is labelled **INFERENCE** and the task is required to measure it before relying on it. ✅
- The control can fail: AC1 requires the `before` run to reproduce the defect, and R7 forbids dropping a
  non-reproducing cell. ✅
- No permanent Storybook artifact is created or extended. ✅
- No owner exception is claimed; the owner decision quoted in §2 and §3.4 is the 2026-08-27 decision pass recorded in
  `docs/backlog-archive.md`. ✅

---

**FACTS** — §3.1-§3.6, each with its file and line, read 2026-08-27.
**INFERENCES** — the `max-sm:w-full` overflow mechanism (§3.2) and `min-w-35` = 140px (§3.3); both must be measured.
**UNKNOWNS** — actual `scrollWidth` per cell; whether 375/390 reproduce; whether `SaveSearchButton` contributes.
**CONFLICTS** — §3.4: the owner's "ListingsSortBar only" scope versus a shared row that contains a sibling button.
Resolved without an owner round trip by measuring both states, fixing only in scope, and reporting the residual.

**Task path:** `tasks/Sprints/Sprint_66_kickoff_prompt_Task_772_ListingsSortBar_Mobile_Overflow.md`
**QA profile:** `Q2 Standard UI`
**Owner decision still needed:** none to start. One may follow: if the authenticated state still overflows because of
`SaveSearchButton`, that is a new number, and the owner decides whether to file it.
