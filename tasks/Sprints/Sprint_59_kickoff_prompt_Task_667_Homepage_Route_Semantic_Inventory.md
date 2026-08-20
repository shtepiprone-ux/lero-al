# Task 667 — Homepage route semantic inventory (`/[locale]`), DOM-evidenced

> # ⛔ STATUS: `BLOCKED — OWNER DECISION REQUIRED`
>
> **This file is a decision note, not an executable kickoff. It must not be handed to an executor.**
>
> **Revision 6 (2026-08-16).**
>
> | Rev | Change |
> |---|---|
> | 1 | Published as an executable kickoff. Labelled six reviewer recommendations as owner decisions; marked every requirement `Confirmed` before anything ran; split registry updates into the executor's post-implementation write set. |
> | 2 | Downgraded to a decision note per `create-task/SKILL.md` (*"Do not call an exception 'owner-approved' … unless the actual owner decision is quoted … Otherwise stop for `BLOCKED -- OWNER DECISION REQUIRED`"*). Split `Req status` from `Verification` (all `PENDING`). Added classifier arm A3, viewport/portal axes, tracked evidence, conditional final status, worktree precondition. Revision 1's commit handoff withdrawn. |
> | 3 | **D-A resolved by owner decision** (full render chain). Root layout facts added; chain exclusions evidenced; **D-I opened** — the three-way classifier cannot express the non-rendering mount points the root layout introduces. `§5.2` reclassified as an **unverified feasibility hypothesis** requiring preflight **F1**. Appendix A.1/B corrected to stop calling D-A a proposal. Handoff restored per `CLAUDE.md`'s ALWAYS-DO rule. |
> | 4 | **Sequencing reconciled** — revision 3 said "D-I and D-G first" in one place and "F1 first" in another. There is now a single three-phase order (§0.1) and every other section defers to it. **F1 given a pass/fail contract** (§5.2) — named control mount points, three reloads, exact-mapping requirement, and a bounded failure statement that does **not** generalise to "an inventory is impossible". **S8 corrected** to desktop-only: `HeaderView.tsx:156` wraps `UserMenu` in `visibleFrom="md"`, so a mobile user-menu state is not a reachable UI state and must not be recorded as an `inventory-gap`. §0 preamble no longer calls every row a proposal. Sprint-table scope corrected to the full chain. Handoff scoped to the two files actually edited, with an explicit manifest caveat. |
> | 5 | **Phase 1 closed by owner** — D-C and D-H approved, worktree manifest supplied (§12, six entries, zero `src/`). **F1 given an executor and a write set**: proposed **Task 751**, writing only to `docs/reviews/artifacts/task-667/f1/**` — 667 itself is still never handed to an executor. **F1 control table corrected**: the promised-but-absent DOM indices are now a measured run-1 baseline rather than an orchestrator assertion; `MantineRootProvider` (zero host elements) replaced as a control by the host element it places, `.mantine-Notifications-root`; `AppImage`'s expected outer root corrected from `<img>` to the `<div>` at `AppImage.tsx:119`. **Stale sections reconciled** — Appendix A checkpoint 2, the negative-flow row and the ledger now all defer to the one F1 pass/fail contract instead of naming the DevTools hook. Handoff table corrected from `Tracked? yes` to `?? untracked`. |
> | **6** | **D-J approved** — Sprint 59 opened, **F1 filed as Task 751** with its own complete standalone kickoff, 667 stays `reserved`/BLOCKED. F1's full contract moves to that kickoff; §5.2 here is now a pointer, not a duplicate spec — two copies of one contract is how they diverge. **Worktree manifest removed**: the 741/749 archive commit has landed, so `docs/backlog.md` / `docs/backlog-archive.md` are no longer a dirty baseline and are not re-litigated. |
>
> §0 lists exactly what the owner must decide, and §0.1 the order. On approval, regenerate scope, ACs,
> verification plan, report contract and handoff **together** — do not patch this file into an executable one.

**Sprint:** 59 · **Type:** Governance / inventory (read-only; zero product-code change)
**Proposed QA profile:** `Q0 Docs/Governance` + augmentation (§8)

---

## 0. Owner decisions required

**Owner-approved: D-A, D-C, D-H, D-J.** The remaining six — **D-B, D-D, D-E, D-F, D-G, D-I** — are
recommendations with a named recommender and are **not** owner decisions. Do not cite them as authority.

| # | Proposal | Recommender | Why it needs the owner |
|---|---|---|---|
| **D-A** | ✅ **RESOLVED — OWNER DECISION, 2026-08-16.** Owner: *"я обираю повний ланцюг layout-ів + page"*. Boundary = the full render chain `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` → `src/app/[locale]/page.tsx`. Origin tags: **`global shared UI`** · **`locale shared UI`** · **`route body`**. | **Owner** | Settled. Supersedes the two-file boundary in revision 1–2, which omitted the root layout. |
| **D-B** | `PerfDevOverlay` excluded from the production inventory | Reviewer, 2026-08-16 | An exclusion; only the owner may authorize one |
| **D-C** | ✅ **APPROVED — OWNER, 2026-08-16.** *"route-level DOM реального dev-server є доказом mount; Storybook лише supplementary."* **Supersedes the registry's recorded method** for 667 (`backlog.md:45`, "enrolment stays story-first per slice") — story-first **enrolment per migration slice** is untouched | **Owner** | Settled |
| **D-D** | State matrix per §6 | Reviewer + orchestrator | Determines what "complete" means |
| **D-E** | Unraisable state → `inventory-gap`; no import-graph substitute | Reviewer, 2026-08-16 | Determines the failure mode |
| **D-F** | Two steps: static map for coverage only, then DOM for classification | Reviewer, 2026-08-16 | Determines what the static map may be cited for |
| **D-G** | **The `deliberate native wrapper` allowlist and its contents** (§5.3) | Orchestrator — **new, unresolved** | Without an owner-authored list this category is unfalsifiable; every raw element could be called deliberate after the fact. `AppImage` is the only known candidate and even it is not owner-confirmed as intentional. |
| **D-H** | ✅ **APPROVED — OWNER, 2026-08-16.** *"F1 та inventory evidence зберігати tracked у `docs/reviews/artifacts/task-667/`; тільки компактні текстові/JSON/HTML артефакти, без відео."* **Binding constraint:** text / JSON / HTML only, compact; **no video, no screen recordings.** Covers both F1's output and the inventory's | **Owner** | Settled |
| **D-I** | **Disposition for non-rendering mount points** — see §5.5 | Orchestrator — **new, created by D-A** | The three-way classifier assumed visual UI. The root layout mounts `MantineRootProvider`/`ModalsProvider` (providers, zero host elements), `ColorSchemeScript` (an inline `<script>`), two `<link rel=preconnect/dns-prefetch>`, and `SpeedInsights` (third-party, no visible UI). None is `Mantine` / `native wrapper` / `migration candidate` in any useful sense. |
| **D-J** | ✅ **APPROVED — OWNER, 2026-08-16.** *"open Sprint 59 and file separate Task 751 for F1; Task 667 remains `BLOCKED/reserved` until F1."* | **Owner** | Settled — Sprint 59 open, 751 filed, 667 stays blocked |

**Resolved: D-A, D-C, D-H, D-J** (owner, 2026-08-16) — **Phase 1 is complete.** Remaining open:
**D-B, D-D, D-E, D-F, D-G, D-I** — all Phase 3, all gated behind F1, **none of them owner-approved.**

## 0.1 Sequence — the single authoritative order

Revision 3 asserted two contradictory orders in two places. This section is now the only one; every other
section defers to it and none may restate a different sequence.

| Phase | Gate | Contents | Why here |
|---|---|---|---|
| **1** ✅ **COMPLETE** | Owner | **D-C** ✅ · **D-H** ✅ · **D-J** ✅ — all 2026-08-16. Worktree: no stale manifest is carried; each task measures a fresh baseline (§12) | F1 cannot be honestly executed without them. D-C decides *whether a dev server is the evidence source at all*; D-H decides *where F1's own output is retained*; without the worktree baseline, F1's write set cannot be distinguished from pre-existing changes. |
| **2** ⬅ **NOW** | Feasibility, **not** an owner decision | **F1** (§5.2) — is a sound automatic DOM→owning-component mapping obtainable in this build? Executed under its **own task number** (§5.2 "Who runs F1"), never by handing 667 to an executor | Its outcome determines whether the classifier is specifiable at all. Running it before Phase 3 avoids spending owner decisions on the shape of a mechanism that may not exist. |
| **3** | Owner, **only if F1 passes** | **D-B** · **D-D** · **D-E** · **D-F** · **D-G** · **D-I** → then regenerate 667 as an executable kickoff | D-G and D-I define the classifier's taxonomy; there is no point deciding a taxonomy for a mapping that cannot be produced. |

**F1 is not an owner decision.** It is a measurement. It is gated behind Phase 1 because it consumes what
Phase 1 authorises — the dev server, the evidence location, and a defined worktree baseline.

**D-I exists because of D-A.** Extending the boundary to the root layout pulled in providers, a head script,
two resource hints and a third-party widget — none of which the three-way classifier can express (§5.5).
It is a Phase 3 item, not a Phase 1 one: its answer changes the inventory's shape, not F1's feasibility.

**D-G:** Two of the three categories can be proven from the DOM alone;
`deliberate native wrapper` is a statement of *intent*, and intent is not in the DOM. Until the owner
either supplies the allowlist or rules that the category collapses into `migration candidate` with a
`needs-intent-review` flag, the classifier cannot be built.

**Registry state, to be fixed at approval time — not deferred to the executor.** `docs/backlog.md:33`'s
Sprints section does not list Sprint 59, and `:45` still reads `667 | reserved`. Revision 1 put these in the
executor's post-implementation write set (W2), which contradicted the sprint plan already declaring
`KICKOFF FILED`, and violated the 2026-08-10 fourth-occurrence corollary this file's own ledger cited as
`COMPLIANT`: *enumerate every artifact that names a task's state and change them in the same edit.* The
registry edit belongs to the approval step, before any handoff.

---

## 1. Objective

Produce a semantic inventory of every element the `/[locale]` route **actually mounts** — across the full
render chain `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` → `src/app/[locale]/page.tsx` (D-A, owner) —
each tagged `global shared UI` / `locale shared UI` / `route body` and classified as exactly one of
**`Mantine`**, **`deliberate native wrapper`**, **`migration candidate`**, or the D-I disposition for
non-rendering mount points, with route-level captured DOM as the evidence for every classification.

This task migrates nothing.

**Note on the question being answered.** The title says "route actually mounts", so the boundary is the whole
chain. That is *not* the same question as "what in the homepage **content** is not yet migrated" — that one
would scope to `page.tsx` plus explicitly named page-specific subtrees and would exclude the shared layouts in
writing. The owner chose the former. If the goal later becomes migration scoping rather than route inventory,
the boundary must be re-decided, not silently reused.

---

## 2. Verified context

Every row read from the named file during task design.

### 2.1 The render chain (D-A)

| Segment | Origin tag | Mounts |
|---|---|---|
| `src/app/layout.tsx` | `global shared UI` | `<html lang={locale} …>` (`:37`) · `<head>`: `ColorSchemeScript defaultColorScheme="light"` (`:41`), `<link rel="preconnect">` + `<link rel="dns-prefetch">` to Cloudinary (`:46-47`) · `<body>`: `MantineRootProvider` (`:50`) wrapping children, then `SpeedInsights` (`:53`) |
| `src/design-system/mantine/MantineRootProvider.tsx` | `global shared UI` | `MantineProvider` → `ModalsProvider` → **`<Notifications position="top-right" />`** (`:29-40`) + children |
| `src/app/[locale]/layout.tsx` | `locale shared UI` | `NextIntlClientProvider` → `AuthProvider` → `Header`, `<Box component="main">{children}</Box>`, `Footer`, `MobileBottomNav`, `WebVitalsReporter`, `PerformanceStoreInit`, `PerfDevOverlay` (`:56-66`) |
| `src/app/[locale]/page.tsx` | `route body` | hero + `HeroSearchClient`, `FeaturedListings`, `LatestListings`, `PopularLocations`, `HowItWorksSteps`, `AgentCtaButton` (`:24-90`) |

**`<Notifications>` is mounted at the root on every page** (`MantineRootProvider.tsx:39`). Revision 2's
two-file boundary would have missed it entirely — and its container is the same
`.mantine-Notifications-root` implicated in the Task 723 P0 click-shield that shipped live. It must appear in
the inventory as a `global shared UI` row even when no notification is showing.

### 2.2 Segment files deliberately excluded from the chain

Verified by listing `src/app/` and `src/app/[locale]/`: **no** `loading.tsx`, `error.tsx`, `not-found.tsx`,
`template.tsx`, `default.tsx`, and **no parallel-route slot directories** exist in either segment. They
therefore cannot enter the chain and are excluded by absence, not by assumption.

`src/app/global-error.tsx` **does** exist but is out of the normal chain: it renders its own `<html>`/`<body>`
and *replaces* the root layout when a root-level error is thrown (`global-error.tsx:17-19`). No state in §6
activates it. **Excluded in writing.** Should the owner later want error-state inventory, that is a separate
matrix and a separate task — not an addition to this one.

### 2.3 Other verified facts

| Fact | Evidence |
|---|---|
| `[locale]/layout.tsx` mounts `Header`, `Footer`, `MobileBottomNav`, `WebVitalsReporter`, `PerformanceStoreInit`, `PerfDevOverlay` around `{children}` | `src/app/[locale]/layout.tsx:56-66` |
| `MantineRootProvider` is `'use client'` — the single client boundary for the whole app | `src/design-system/mantine/MantineRootProvider.tsx:1,13-16` |
| Root layout resolves locale from `X-NEXT-INTL-LOCALE`, falling back to the `admin-locale` cookie then `'sq'`; it drives `<html lang>` | `src/app/layout.tsx:31-37` |
| Theme is light-only by owner requirement — `defaultColorScheme="light"` in both the script and the provider | `src/app/layout.tsx:41`; `MantineRootProvider.tsx:18-21,29` |
| `Header` statically mounts `AuthSheet` (`authSheetSlot`) and, gated on `user`, `NotificationBell` | `src/components/layout/Header.tsx:9,11,63,65-75` |
| `PerfDevOverlay` returns `null` outside development via a build-time constant | `src/components/shared/PerfDevOverlay.tsx:11-16` |
| `PopularLocations` owns its section wrapper and returns `null` with no featured locations — the whole section disappears | `src/app/[locale]/page.tsx:57-58`; `src/modules/locations/components/PopularLocations.tsx` |
| `HeroSearchClient` loads `HeroSearch` via `dynamic(..., { ssr: false })` with `HeroSearchFallback` as loading state | `src/components/shared/HeroSearchClient.tsx:6-13` |
| **`MantineDrawer` renders a structurally different tree on mobile** — `if (isMobile) return <ResponsiveBottomSheet>`, else the desktop `Drawer` | `src/design-system/mantine/patterns/MantineDrawer.tsx:125-134` |
| Mantine overlays portal by default (`withinPortal` defaults `true`), so overlay DOM lands outside the app root | `src/design-system/mantine/patterns/MantineCombobox.tsx:166` |
| Mantine emits `mantine-<Component>-<slot>` classes; existing gates already assert on them | `scripts/check-stories-rendered.mjs` (`mantine-Card-root`, `mantine-Button-root`, `mantine-Overlay-root`, `mantine-Select-input`, `mantine-Drawer-body`) |
| No CI gate asserts the Mantine composition of a route | `docs/backlog.md:67` |
| A dev server + seeded DB is not currently known to be raisable here | `docs/backlog.md` — 665 is `PARTIALLY VERIFIED` awaiting exactly that |

---

## 3. Scope

**In scope:** read-only DOM capture of `/[locale]` across §6; the inventory at `docs/homepage-route-inventory.md`;
tracked evidence under `docs/reviews/artifacts/task-667/` (pending D-H); the registry updates in §7.

**Out of scope, must not change:** any `src/` path · any story, permanent or extended · any migration, restyle
or token change · `mantine-migration-scope.json` · the 10 baselined `governance:tailwind` HIGH findings.

---

## 4. Requirement ledger

Two distinct columns, because revision 1 conflated them: **Req status** = is this a settled requirement;
**Verification** = has it been demonstrated. Every verification cell is `PENDING` — this note has executed nothing.

| ID | Source | Observable requirement | Pri | Verification method | Req status | Verification |
|---|---|---|---|---|---|---|
| R1 | **D-A (owner)** | Every row carries `origin ∈ {global shared UI, locale shared UI, route body}`; all three values are represented | P0 | Inspection | **CONFIRMED — owner, 2026-08-16** | `PENDING` |
| R1b | **D-A (owner)** | The inventory enumerates the full chain `app/layout.tsx` → `app/[locale]/layout.tsx` → `app/[locale]/page.tsx`, and states in writing that `loading`/`error`/`not-found`/`template`/`default`/parallel slots are absent from both segments and that `global-error.tsx` is out of chain | P0 | Inspection vs §2.2 | **CONFIRMED — owner, 2026-08-16** | `PENDING` |
| R2 | D-B | `PerfDevOverlay` in the exclusions section only, never a row | P0 | Inspection + grep | **Proposed (D-B)** | `PENDING` |
| R3 | D-C, D-H | Every classification cites a **tracked** capture artifact + selector + predicate version | P0 | Inspection; artifact resolves in-repo | **Proposed (D-C/D-H)** | `PENDING` |
| R4 | D-D | Every §6 cell captured or gapped | P0 | Artifact presence | **Proposed (D-D)** | `PENDING` |
| R5 | Failure-mode rule | Classifier proven **three-armed** (§5.4) before any capture is classified | P0 | Retained transcripts | Confirmed (project rule) | `PENDING — must be EXECUTED` |
| R6 | D-E | Unraisable state → `inventory-gap` + reason; no import-graph fill; status capped | P0 | Inspection | **Proposed (D-E)** | `PENDING` |
| R7 | D-F | Static map labelled coverage-only, states in-file it yields no classification | P1 | Inspection | **Proposed (D-F)** | `PENDING` |
| R8 | Sprint 59 exit | Names the detector that would assert route composition, or why none is worth building | P1 | Inspection | Confirmed (sprint goal) | `PENDING` |
| R9 | §3 | Final write set has zero `src/` and zero story paths | P0 | `git status --porcelain` | Confirmed | `PENDING` |
| R10 | — | Each row records **confirm** or **contradict** vs `backlog.md:20` under one evidence standard | P1 | Inspection | Confirmed | `PENDING` |
| R11 | D-G | Every `deliberate native wrapper` row cites the owner-authored allowlist entry authorizing it | P0 | Inspection | **BLOCKED (D-G)** | `PENDING` |
| R12 | D-I | Every non-rendering mount point (provider, head script, resource hint, third-party) is recorded under the D-I disposition and excluded from any migration count | P0 | Inspection: no `<link>`/`<script>`/provider row carries `migration candidate` | **BLOCKED (D-I)** | `PENDING` |
| R13 | D-A | `<Notifications>` (`MantineRootProvider.tsx:39`) appears as a `global shared UI` row even with no notification showing | P1 | Inspection + capture selector | **CONFIRMED — owner, 2026-08-16** | `PENDING` |

---

## 5. The classifier — specification

Revision 1 said "define a predicate" and proved two of three categories. That is the substantive gap; this
section is the fix.

### 5.1 Unit of inventory

The unit is a **mount point**: an ordered pair *(project component, its outermost rendered DOM element)*.
Not "an element" — a DOM tree has thousands and most are Mantine internals. Not "a component" — one
component may mount several disjoint roots (portalled overlay + inline trigger), and those must be separable.

A component with two roots yields two rows, distinguished by an `instance` discriminator.

### 5.2 Resolving DOM → source component

Class names cannot do this: CSS-module hashes are opaque and `mantine-*` classes name the Mantine component,
not the project component that used it.

#### ⚠️ F1 — unverified feasibility hypothesis, blocking

Revision 2 stated that the executor "must walk the React fiber tree via `__REACT_DEVTOOLS_GLOBAL_HOOK__`
(available in the dev build this task already requires)". **That parenthesis was invented.** Nothing was
tested. `__REACT_DEVTOOLS_GLOBAL_HOOK__` is a private DevTools integration point, not a supported public
React API: React only *checks whether* the hook exists and calls into it if something else installed it — it
does not create or guarantee it, and its shape is not covered by any stability guarantee. In a plain
Playwright/Chromium run with no DevTools extension loaded, it may simply be absent.

So §5.2 is a **hypothesis**, and preflight **F1** must settle it — Phase 2 per §0.1, before the classifier is
specified and before Phase 3's owner decisions are requested.

#### F1 contract

#### F1 is now Task 751 — the contract lives there

**Owner decision D-J (2026-08-16)** moved F1 into its own filed task:
`tasks/Sprints/Sprint_59_kickoff_prompt_Task_751_F1_DOM_Component_Mapping_Feasibility.md`.

**That kickoff is the single authoritative F1 contract.** This section is a pointer, not a second copy —
two copies of one contract is how they diverge, and this document has already produced that defect twice.

Summary only, for reading continuity:

| | |
|---|---|
| Question | Is an automatic DOM→**project placer** mapping obtainable in this build? |
| Executor | Sonnet, from Task 751's kickoff. **Task 667 is never handed to an executor** (D-J) |
| Write set | `docs/reviews/artifacts/task-667/f1/**` + 751's own registry rows. Zero `src/`, zero inventory rows |
| Authorised by | D-H (evidence location) and D-C (dev-server DOM as evidence) |
| Key distinction | **DOM owner** ≠ **project placer**. `.mantine-Notifications-root` is *owned* by Mantine `Notifications` and *placed* by `MantineRootProvider`. 667 needs the placer |
| Controls | Five, bound to a seeded fixture slug with a uniqueness assertion, on `/sq` at 1440×900, fully hydrated |
| Mechanisms | DevTools hook · `__reactFiber$*` expandos · build-time attribute (paper only — writes `src/`) · `data-testid` coverage |

667's own write set (§7) stays executor-owned and is not opened by F1.

#### What an F1 failure does and does not mean

**Means, exactly:** *in this build, a reliable automatic DOM→component mapping was not demonstrated.*

**Does not mean** that an inventory is impossible, that Sprint 59 closes, or that Task 667 is unachievable.
A bounded negative result is a finding about a mechanism, not a verdict on the goal — generalising it would
repeat the retracted audit's core error in the opposite direction. On F1 failure the orchestrator returns to
the owner with the measurement and candidate alternatives (including (c), which needs its own decision);
**closing or re-scoping Sprint 59 requires a separate owner decision** and may not be inferred from F1.

**No fallback to class-name matching under any outcome.** That is what produced the retracted audit; F1
failing does not resurrect it.

Once a mechanism passes, record the exact traversal code and its version hash in the retained evidence; a
different traversal is a different predicate and invalidates every row produced by the previous one.

### 5.3 Classification rule

For each mount point, in this order — first match wins:

1. **`Mantine`** — the outermost element carries a `mantine-<Component>-<slot>` class, **or** its fiber parent
   chain reaches a `@mantine/core` component with no intervening raw host element emitted by the project
   component.
2. **`deliberate native wrapper`** — the outermost element is a raw host element emitted directly by the
   project component, **and** that component appears in the owner-authored wrapper allowlist (**D-G**), with
   the allowlist's stated reason copied into the row.
3. **`migration candidate`** — everything else: a raw host element emitted by a project component, not
   Mantine-owned, not allowlisted.

Rule 2 is the only one that consults a human-authored list, and that is deliberate: it is the only category
that asserts *intent*. **Until D-G is resolved, rule 2 is unreachable and every non-Mantine mount point
falls to rule 3** — which would overstate the migration backlog. This is why D-G blocks.

### 5.4 Three-armed proof, required before any real classification (R5)

| Arm | Input | Required output | Fails if |
|---|---|---|---|
| A1 | A known-Mantine mount point (e.g. a `mantine-Card-root`-bearing node) | `Mantine` | returns anything else |
| A2 | A known raw-host mount point present in the allowlist | `deliberate native wrapper` **citing the allowlist entry** | returns `Mantine` or `migration candidate`, or cites nothing |
| A3 | The **same** node as A2, with its allowlist entry removed from the probe input | `migration candidate` | still returns `native wrapper` → the allowlist is not load-bearing and rule 2 is decorative |

A3 is the arm revision 1 lacked. Without it, rule 2 could pass every input and nobody would notice —
the "check that could not have come out wrong" failure this project has recorded seven times.

All three transcripts are retained artifacts, not report prose.

### 5.5 Non-rendering mount points — the gap D-A created (D-I)

The three-way rule presumes a mount point has a host element that could plausibly be migrated. The full
chain contains four kinds that do not:

| Kind | Instances in this chain | Why the three-way rule fails |
|---|---|---|
| **Provider, zero host elements** | `MantineRootProvider`, `MantineProvider`, `ModalsProvider`, `NextIntlClientProvider`, `AuthProvider` | No DOM node to classify. Already Mantine or already correct; "migration candidate" is meaningless |
| **Head script** | `ColorSchemeScript` (`layout.tsx:41`) | It *is* a Mantine component, but it emits an inline `<script>`, not UI. Tagging it `Mantine` puts a script in a UI inventory |
| **Head resource hint** | `<link rel="preconnect">`, `<link rel="dns-prefetch">` (`:46-47`) | Raw host elements emitted by a project file → rule 3 would call them `migration candidate`. Migrating a `<link>` to Mantine is nonsense |
| **Third-party non-UI** | `SpeedInsights` (`:53`) | Not ours to migrate |

Two candidate dispositions for the owner:

- **(i)** A fourth value **`non-rendering / out of taxonomy`**, recorded in the inventory with its kind, so
  the chain is provably fully enumerated but these rows never enter a migration count.
- **(ii)** An explicit pre-filter: mount points with no host element, or whose only host elements are inside
  `<head>`, are excluded before classification and listed in a separate "chain completeness" appendix.

**Recommendation: (i).** Option (ii) reintroduces exactly the failure this task exists to fix — a boundary
drawn so that whatever is inconvenient falls outside it, with no record that it was ever considered. Under
(i), `<link rel="preconnect">` is visible in the inventory *and* provably not a migration candidate.

Until D-I is decided, rule 3 would sweep the two `<link>` elements into `migration candidate` and the
inventory would be wrong on its first page.

---

## 6. State matrix

Revision 1's S1–S5 assumed one viewport and no interactive layout states. `MantineDrawer.tsx:125-134` renders
a different component tree on mobile, so **viewport is a required axis, not a refinement**.

Capture the **entire `document`** — `<html>` attributes, `<head>` **and** `<body>` — not the app root. Three
independent reasons, each verified: Mantine overlays portal outside the app root (`MantineCombobox.tsx:166`);
`ColorSchemeScript` and both resource hints exist only in `<head>` (`layout.tsx:41,46-47`); and `<html lang>`
is set by the root layout (`:37`) and is itself a chain-owned mount point.

Record for every capture: viewport, locale, auth state, hydration state, and predicate version.

`.mantine-Notifications-root` must be located in every capture, whether or not a notification is displayed
(`MantineRootProvider.tsx:39`).

Breakpoint: the executor must **read** the threshold `useResponsiveDropdown` uses and cite it. Do not assume 640.

| # | State | Viewports | Notes |
|---|---|---|---|
| S1 | Anonymous homepage, sections loaded | mobile + desktop | Seeded: ≥1 featured listing, ≥1 latest, ≥1 featured location |
| S2 | `HeroSearchFallback` — pre-hydration | mobile + desktop | Capture **deliberately**, by throttling or intercepting the dynamic chunk. Not "whichever we happened to get" |
| S3 | `HeroSearch` — hydrated | mobile + desktop | Must be a separate artifact from S2 |
| S4 | `AuthSheet` open | mobile + desktop | Different tree per viewport if it routes through `MantineDrawer` — verify, don't assume |
| S5 | Authenticated homepage | mobile + desktop | Read-only session; no product write |
| S6 | Notification centre open | mobile + desktop | From S5 |
| S7 | **Mobile navigation drawer open** | mobile only | `MobileNavDrawer` → `MantineDrawer` mobile branch |
| S8 | **User menu open** | **desktop only** | `UserMenu` → `MantineDropdownMenu`; portalled. **Desktop-only by design:** `HeaderView.tsx:156` wraps it in `<Group unstyled visibleFrom="md">`, so no mobile user-menu state exists to capture. This is **not** an `inventory-gap` — a state that the UI does not offer is out of the matrix, not missing from it. The mobile equivalent is S7's nav drawer |
| S9 | Empty states | desktop | Zero featured locations (`PopularLocations` → `null`, section absent), zero featured listings, zero latest |

S9's absent section is **designed behavior** (`page.tsx:57-58`), not a finding. A capture that reports it as a
missing element is wrong.

Any cell not raisable → `inventory-gap` row with the blocking reason (R6). No import-graph substitute.

---

## 7. Final write set

| # | Path | Change | When |
|---|---|---|---|
| **A1** | `docs/backlog.md` | Add Sprint 59 to the Sprints section; 667 row `reserved` → `KICKOFF FILED`; `:45` method line updated per D-C | **At owner approval, by the orchestrator** — not by the executor |
| **A2** | `tasks/Sprints/Sprint_59_…md` | Tasks table → `KICKOFF FILED` | At owner approval |
| W1 | `docs/homepage-route-inventory.md` | new — the deliverable | Executor |
| W2 | `docs/reviews/artifacts/task-667/**` | new — tracked captures, predicate source + version, three R5 transcripts | Executor (pending D-H) |
| W3 | `docs/backlog.md` | 667 row → **the actual final status**: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only if every §6 cell was captured; `PARTIALLY IMPLEMENTED` if any `inventory-gap` exists; `BLOCKED` if §5.2 or the dev server failed. Last Session 2–4 lines | Executor |
| W4 | `tasks/Sprints/Sprint_59_…md` | Tasks table → the **same** status as W3 | Executor |
| W5 | `docs/sessions/2026-08-__-task667-homepage-route-inventory.md` | new — session log | Executor |

W3/W4 must agree. Revision 1 hard-coded `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` in the write set while
R6/AC3 required `PARTIALLY IMPLEMENTED` on any gap — a kickoff that instructed the executor to contradict its
own acceptance criteria.

---

## 8. QA profile

`Q0 Docs/Governance` — the write set is docs and task files; zero `src/` paths, so the profile's own rule
("no product validation unless a referenced command is changed") means `npm run build` is not required.

**Augmentation (additive; the floor is never weakened):** R5's three transcripts; every capture retained
**tracked** and referenced by repo-relative path; contradiction scan against `docs/backlog.md:20/:45`,
`docs/mantine-tailadmin-migration-tracker.md`, `docs/component-coverage-matrix.md`.

If any `src/` path enters the diff, the profile selection is void → `BLOCKED`, never self-promotion to Q1.

---

## 9. Negative-flow applicability

| Branch | Applicable? | Source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form/action change; capture is read-only | N/A | — |
| Authorization/RLS | **Yes** | S5–S8 need a session | Normal auth path; RLS unchanged; zero writes | Transcript showing no mutating request |
| Offline/network | No | Local controlled dev server | N/A | — |
| Concurrent writer | No | Read-only against a seeded snapshot | N/A | — |
| **State unraisable** | **Yes** | D-E | `inventory-gap` + reason; status capped | Deliverable + W3/W4 |
| **F1 finds no sound mechanism** | **Yes** | §5.2 | Stop at Phase 2 and return the measurement. **Not** triggered by the DevTools hook alone being absent — the hook is one of four candidates, and expando keys, a build-time attribute, or `data-testid` may each still pass. Only *all four* failing the pass criteria is this branch. No class-name fallback. Does not close Sprint 59 | F1 `FINDING.md` |

---

## 10. Acceptance criteria

- **AC1 [R1,R1b,R2]** — every row carries `origin ∈ {global shared UI, locale shared UI, route body}` and all three values appear; the deliverable states the §2.2 chain exclusions (`loading`/`error`/`not-found`/`template`/`default`/parallel absent; `global-error.tsx` out of chain); `PerfDevOverlay` appears in no row and is named in exclusions with its `NODE_ENV` evidence.
- **AC2 [R3]** — every row's evidence resolves to a **tracked** artifact path + selector + predicate version; no row's sole evidence is a story, an import, or a source read.
- **AC3 [R4,R6]** — every §6 cell is a retained artifact or an `inventory-gap` row naming the blocker; if any gap exists, W3/W4 read `PARTIALLY IMPLEMENTED`. **S8 mobile is not a cell** and must not appear as a gap (§6).
- **AC4 [R5]** — arms A1, A2 **and A3** each ran and produced the required output, with transcripts retained. Two arms is a fail.
- **AC5 [R7]** — the static-map section is labelled coverage-only and says in-file it yields no classification.
- **AC6 [R8]** — a closing section names the route-composition detector, or records why none is worth building.
- **AC7 [R9]** — `git status --porcelain`, minus the **freshly measured** §12 baseline, contains no `src/` path, no `*.stories.tsx` path, and no `.click-shield-ci-fixture.*` entry.
- **AC8 [R10]** — confirmations of `backlog.md:20` are recorded to the same standard as contradictions, and the doc says both were representable.
- **AC9 [R11]** — every `deliberate native wrapper` row cites its owner-authored allowlist entry and reason. Zero such rows is valid **only** if D-G resolved to collapsing the category.
- **AC10 [R12]** — no `<link>`, `<script>`, or zero-host-element provider row carries `migration candidate`; each is recorded under the D-I disposition with its kind.
- **AC11 [R13]** — `.mantine-Notifications-root` is present as a `global shared UI` row, with a capture selector, in a state where no notification is displayed.

---

## 11. Verification plan

Order is fixed by §0.1. Phase 1 items are owner preconditions, not executor steps.

1. Confirm worktree state (§12) and record it. *(Phase 1 output)*
2. Raise dev server + seeded DB. Failure → `BLOCKED`; no static substitute. *(Phase 1, D-C)*
3. **Run F1 to its pass criteria (§5.2).** Fail → stop and return the measurement to the owner; do **not**
   proceed to Phase 3, and do **not** conclude the inventory is impossible. *(Phase 2)*
4. Build the probe; run R5 arms A1/A2/A3; retain transcripts. Only then proceed. *(Phase 3)*
5. Capture S1–S9 across both viewport tiers, whole `document`, metadata per §6.
6. Write `docs/homepage-route-inventory.md`.
7. Contradiction scan (§8).
8. `git status --porcelain` → retain for AC7.
9. `node scripts/check-file-integrity.mjs`, `node scripts/check-mojibake.mjs` on touched markdown.
10. W3/W4 with the **actual** status; write W5.

---

## 12. Worktree precondition

**No baseline is quoted here, deliberately.** The 741/749 archive commit landed on 2026-08-16, after the last
measurement, so any manifest written into this file would already be stale — and `docs/backlog.md` /
`docs/backlog-archive.md` are **committed**, not pending. They are settled and must not be re-litigated as a
dirty baseline by any task in this sprint.

**Take a fresh native `git status --porcelain` immediately before 667 starts** and use only the genuine
remaining user-owned paths. The orchestrator does not measure this itself: `docs/backlog.md`'s Git row records
that a bridge session running plain `git status` leaves an `index.lock` the sandbox cannot unlink, blocking
the owner's next `git add`.

Two constants that hold regardless of when the baseline is taken:

- `.click-shield-ci-fixture.stderr.log` / `.stdout.log` are pre-existing untracked CI-fixture output,
  unrelated to this sprint, and must **never** be staged by any task in it.
- **Freshness is not accuracy.** A baseline quoted from a document — including this one — is not a
  measurement. Re-run it.

---

## 13. Completion-report contract

Changed files (exact paths); requirement IDs completed and not, with reasons; every command with its **actual**
output; artifact locations; the three R5 transcripts; predicate version; per-cell capture-or-gap status for all
of S1–S9; assumptions; deviations; limitations; unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.
A gap is never reported as a completion.

---

## Appendix A — Executable task contract

**A.1 Active route.** Task 667. Route: DOM-first inventory of the full render chain.

| Field | Value |
|---|---|
| Boundary | **SETTLED** — D-A, owner 2026-08-16, quoted in §0. `app/layout.tsx` → `app/[locale]/layout.tsx` → `app/[locale]/page.tsx` |
| Evidence source / location | **SETTLED** — D-C and D-H, owner 2026-08-16, quoted in §0 |
| Decision source for the rest | **None yet.** D-B, D-D, D-E, D-F, D-G, D-I are proposals (all Phase 3) |
| Blocked decisions | **D-B, D-D, D-E, D-F, D-G, D-I.** D-G and D-I hardest — the classifier cannot be specified without either |
| Blocked feasibility | **F1** (§5.2) — an automatic DOM→owning-component mapping is a hypothesis across four candidate mechanisms, not a verified capability. Runs as proposed **Task 751** |
| Starting worktree mode | **dirty, with owner-supplied manifest (§12)** |
| Allowed final write set | A1–A2 (orchestrator, at approval) + W1–W5 (executor) |

Per the template, an unresolved owner decision yields a blocked decision note, not an executable task; this
file is that note. **D-A being settled does not unblock it** — one resolved decision out of nine is not a route.

**A.2 Checkpoint matrix**

| # | Preconditions | Writes allowed | Observable result | Producer / artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | worktree state per §12 supplied | none | baseline `--porcelain` set recorded | git (owner-native) | unsupplied → cannot start |
| 1 | C0 | none | route 200, non-empty `document` | probe | unreachable → `BLOCKED`, no static fallback |
| 2 | C1 | F1 write set (`docs/reviews/artifacts/task-667/f1/**`) | **F1 passes all four criteria in §5.2** across its four candidate mechanisms — not "the fiber hook resolves". Any one mechanism satisfying all four is a pass | F1 probe (Task 751) | fails → stop at Phase 2, return the measurement to the owner. **No class-name fallback.** Not a verdict that the inventory is impossible |
| 3 | C2 | evidence dir | A1→`Mantine`, A2→`native wrapper` w/ citation, A3→`migration candidate` | probe, 3 transcripts | any arm wrong → predicate rejected before use |
| 4 | C3 | evidence dir | S1–S9 × viewport tiers captured, whole `document`, metadata complete | probe | missing cell → `inventory-gap`, status capped |
| 5 | C4 | W1 | every row: origin + tracked evidence path + classification + predicate version | author | any missing → fail |
| 6 | C5 | none | contradiction scan across 4 docs recorded | author | undisclosed disagreement → fail |
| 7 | C6 | W2–W5 | `--porcelain` minus C0 baseline = W1–W5 only | git | any `src/` or story path → `BLOCKED`, profile void |

**A.3 Counterexample trace**

| Claim | Counterexample | Required outcome | Result |
|---|---|---|---|
| Classifier arm 1 | known-Mantine node → non-`Mantine` | predicate rejected | **must be EXECUTED** |
| Classifier arm 2 | allowlisted node → not `native wrapper`, or uncited | predicate rejected | **must be EXECUTED** |
| Classifier arm 3 | allowlist entry removed, node still `native wrapper` | rule 2 proven decorative → rejected | **must be EXECUTED** |
| Evidence durability | reviewer opens a cited artifact path | resolves in-repo (tracked) | ANALYTICAL |
| Status coherence | a gap exists | W3/W4 both read `PARTIALLY IMPLEMENTED` | ANALYTICAL |
| Empty state | `PopularLocations` absent at S9 | recorded as designed, not a finding | ANALYTICAL |
| Write set | an `src/` edit becomes necessary | `BLOCKED`, not widened scope | ANALYTICAL |

**A.4 Publication gate.** The author may not approve this. It is `BLOCKED` pending §0 and may not be executed.

---

## Appendix B — Rule-compliance ledger

| Rule and clause | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `create-task/SKILL.md` — owner-authorization quoting | Rev. 1 labelled proposals as owner decisions. **D-A now carries a real owner decision with date, scope and verbatim quote**; D-B…D-I remain proposals and are labelled as such | Stop for `BLOCKED — OWNER DECISION REQUIRED` on the unresolved set | §0, header, A.1 | `COMPLIANT` (rev. 3) |
| `create-task/SKILL.md` — unresolved decision → blocked note, not multi-route task | **D-B…D-I** open (D-A resolved) | Publish a decision note | This file | `COMPLIANT` |
| `CLAUDE.md` — ALWAYS-DO: every response creating/editing a task/docs artifact ends with an explicit-path owner-run `git add` + `git commit` handoff | Rev. 3 edits two artifacts | Emit the commit handoff for exactly the touched files | §Handoff | `COMPLIANT` (rev. 3) — **rev. 2 breached this**: it wrote `Handoff: None` while this same ledger row claimed compliance. The rule has no `BLOCKED` exception; `CLAUDE.md`'s git policy gates **push** on `APPROVED`, never **commit** |
| Corollary 2026-08-10 (4th occurrence) — one edit changes every artifact naming a task's state | Rev. 1 split registry updates into executor W2 while the sprint file already said `KICKOFF FILED` | Registry + sprint table updated together, at approval | §0, write set A1–A2 | `COMPLIANT` (rev. 2) |
| Recurring failure mode — two-armed plant that can demonstrably fail | Task introduces a classifier | Proof before use | §5.4 three arms, A.3 | `COMPLIANT` |
| `CLAUDE.md` — every task belongs to a sprint | 667 | Kickoff under `tasks/Sprints/…` | This path; goal-fit table in the plan file | `COMPLIANT` |
| `CLAUDE.md` — mutating git is owner-only | This note creates files | Explicit-path owner-run handoff | §Handoff | `COMPLIANT` |
| `docs/qa-profiles.md` — name one profile | Governance task | Profile + why + evidence | §8 | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` — visual source map / canonical UI decision record | No changed visible artifact; zero `src/` writes | — | §3 | `NOT APPLICABLE` |
| `docs/critical-flow-registry.md` — critical flows need regression evidence | S4–S8 traverse auth surfaces | Applies to *changed* flows; none changed, no writes | §6 read-only, §9 | `NOT APPLICABLE` |
| D28 — mechanism-only | No migration performed | — | §3 | `NOT APPLICABLE` |
| D37 — a passing re-run does not retro-explain a failing one | Captures may be flaky | Final run binds; first artifact retained `UNATTRIBUTED` | §6, §13 | `COMPLIANT` |
| Dirty-worktree manifest protocol | Worktree state was unknown | (a) clean or (b) manifest before handoff | §12 — **owner supplied the manifest baseline, 2026-08-16** | `COMPLIANT` (rev. 5) |
| `create-task/SKILL.md` — "Do not invent … commands … or existing behavior" | Rev. 2 asserted the DevTools hook was "available in the dev build" untested; rev. 4 promised per-control DOM indices and supplied none | Either verify or label it a hypothesis; never assert an unmeasured value | §5.2 — hook is one of four candidates; indices are a measured run-1 output, not a declaration | `COMPLIANT` (rev. 5) |
| D-C / D-H — evidence source and location | F1 and the inventory both need them | Owner ruling before F1 can run | §0 — **both APPROVED, owner 2026-08-16** | `COMPLIANT` (rev. 5) |

**Blocked rows, current state — Phase 1 cleared:**

| Row | Phase | Status |
|---|---|---|
| D-C · D-H · worktree | 1 | ✅ **CLEARED** — owner, 2026-08-16 |
| **F1** feasibility (§5.2) | 2 | ⬅ **BLOCKING NOW** — a measurement, not a decision; runs as proposed Task 751 |
| **D-G** via R11 · **D-I** via R12 · D-B · D-D · D-E · D-F | 3 | **BLOCKED**, gated behind F1 |

Per the ledger's own rule, publication of 667 as an executable task is forbidden until every row clears.
Phase 1 clearing does **not** unblock 667 — it unblocks F1.

---

## Handoff

**No executor handoff.** This file is `BLOCKED — OWNER DECISION REQUIRED` and must not be given to an executor.

**Owner-run commit handoff — required by `CLAUDE.md`'s ALWAYS-DO rule** (every response creating or editing a
task/docs artifact ends with the explicit-path `git add` + `git commit` for exactly the files touched). Revision 2
wrote `Handoff: None` and breached it. The rule admits no `BLOCKED` exception, and the git policy gates **push**
on an `APPROVED` review — never **commit**. Committing a note whose own status line reads `BLOCKED` records the
blocker in history; it does not open Sprint 59 and does not move 667 out of `reserved`.

**Files this session wrote into the repo — the complete list:**

| Path | Git state |
|---|---|
| `tasks/Sprints/Sprint_59_kickoff_prompt_Task_667_Homepage_Route_Semantic_Inventory.md` | **`??` untracked — pending owner commit** |
| `tasks/Sprints/Sprint_59_Route_Level_Inventory_Before_Any_Migration_Claim.md` | **`??` untracked — pending owner commit** |
| `.artifacts/_to_delete/homepage-detailwind-census.mjs` | **untrackable** — `/.artifacts/` is gitignored |
| `.artifacts/_to_delete/homepage-detailwind-census.json` | **untrackable** — same |

Both Sprint files show as `??` in the owner's own `git status --porcelain` (§12). Revision 4's table said
`Tracked? yes`, which was wrong — they are not tracked until the commit below runs.

The two `.artifacts/` files are the retracted probe and its stale output, moved to `_to_delete/` for the owner
to remove (`rm` is not available across the bridge). They cannot enter a commit.

```powershell
git add "tasks/Sprints/Sprint_59_kickoff_prompt_Task_667_Homepage_Route_Semantic_Inventory.md" "tasks/Sprints/Sprint_59_Route_Level_Inventory_Before_Any_Migration_Claim.md"
git commit -m "docs(tasks): file Task 667 decision note (BLOCKED) + Sprint 59 proposal; D-A resolved, D-B..D-I and F1 open"
```

**Scope of "exactly the files touched" — now measured, not asserted.** The owner's native
`git status --porcelain` (§12) shows six entries. Two are these files. The other four —
`docs/backlog.md`, `docs/backlog-archive.md` and two `.click-shield-ci-fixture.*` logs — are **pre-existing
and not this session's work**; the explicit-path `git add` above deliberately excludes them.

`docs/backlog.md` being already modified is the reason this commit must stay explicit-path: a `git add -A`
here would sweep an unrelated in-flight backlog edit into a commit whose message claims to file a decision
note.

`docs/backlog.md` is deliberately **not** in this commit: 667 is not `KICKOFF FILED`, so registering Sprint 59
or changing 667's `reserved` row would make the registry assert a state that does not exist.

**Phase 1 is complete** (D-C ✅, D-H ✅, worktree manifest ✅ — all owner, 2026-08-16). Next step is
**Phase 2**: file and run **F1** as proposed **Task 751**, scoped to §5.2 alone, writing only to
`docs/reviews/artifacts/task-667/f1/**`. D-B, D-D, D-E, D-F, D-G and D-I stay unasked until F1 returns.
