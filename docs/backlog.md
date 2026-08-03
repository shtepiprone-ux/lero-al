# Project Backlog

> ⚠️ **ACTIVE STATE ONLY (~80 lines).** Closed tasks → [`docs/backlog-archive.md`](backlog-archive.md), one ledger row each. Full detail → `docs/sessions/`. Kickoff detail stays in `tasks/` and is **not** restated here.
> "Last Session" = 2–4 lines. On close, move the task to ONE row at the TOP of the archive ledger. Rules: `docs/ai-behavior.md` → "Backlog & Session Log Rules".

## Last Session (2026-08-03) — 707 reviewed, two migration axes separated, Sprint 49 opened

- **707 ✅ `APPROVED WITH NOTES`** — reviewer recomputed all 32 `HomepageListingGrids` PNG md5s from both official run dirs (0 mismatches); build `exit 0` owner-native. Six P3s, incl. **N1** (`p-3` hardcodes `0.75rem` where compiled output is `var(--space-3)` — an orchestrator defect in the kickoff, now repo-wide across 673/706/707).
- **Two axes were being conflated** and both records were wrong: this file called `HeroSearch` "clean (0)" (it measured the container `HeroSearch.tsx`, not `HeroSearchView.tsx` = **9** sites) and Sprint 48 claimed the `/[locale]` tree would be utility-free after 707 + Sprint 46 (it ignored **20** sites in `HeroSearchView` + `MobileBottomNavView`). Both corrected below.
- 🔴 **The Task 573 `heroSearchWrapInBand` gate has been dead since Task 652** — it selects `.bg-background` + `.border` + `.shadow-xl`, which 652 replaced with Mantine `bg`/`bd` props, so it returns `null` and the `!== false` hard-fail passes vacuously. Confirmed `null` in **all 40** herosearch cells incl. all 8 `band-700`. → Sprint 49 / **708**.

## Open — needs action

| Item | State | Next step |
|---|---|---|
| **Git** | Work lives on `task/q0-ci-rendered-locale-split`, which `origin` contains. Everything through 705 is committed: 696 `82ece5c53` · 699 `5065a6df1` · 701 `0fb66b643` · 703 `525776a16` · 704+705 `a5eed6542` · docs `72c6e73b4` | **`HEAD` is not in `origin/main`** — the run still has to land there. ⚠️ **Do not record divergence counts or tree cleanliness in this file**: they go stale within one commit. An earlier pass asserted "0 ahead / 0 behind, tree clean" — a reading against the *branch upstream* that was already wrong against `main` (163 ahead) and wrong about the tree. Read them from `git status` / `git rev-list` when you need them |
| **Cleanup step 3** | UNBLOCKED (696 = step 1, 701 = step 2, I-D landed in 703 — nothing left unasserted) | Delete the 3 consolidated probes: `task420-qa-grid-step.mjs` (302) · `task668-qa-grid-1440.mjs` (385) · `task668-qa-header-geometry.mjs` (397) — **1084 lines by `wc -l`, 946 non-blank**; the 701 review quotes the former, so say which you mean. **The deletion must also update `check-homepage-grid.mjs`, which names all three in 18 provenance comments**, or the live gate cites deleted paths. Verified 2026-08-01: `scripts/` holds **13** task-numbered probes, **all unwired** (319, 320, 419, 420, 603, 605, 606, 608, 612, 658, 668×2, 670); the other 10 are a separate call, incl. **670** (promote to a gate or remove) |
| **661** | AWAITING ORCHESTRATOR REVIEW | Review `sessions/2026-07-23-task661-single-source-brand-color.md` |
| **665** | `PARTIALLY IMPLEMENTED / PARTIALLY VERIFIED` | **Only the §13.7 live-route before/after DOM/computed-style baseline is outstanding** (AC1 — needs a routable dev server + seeded DB; use the §16.1 corrected `classList.contains` locator). Two asks removed as stale 2026-08-01: AC8's unsatisfiable absolute-zero clause was **already amended** in kickoff §16.4 and restated in session §13.4, and the four deletions are **already committed** in `3be8f4b4a`. Also decide the orphan `listing.fixture.ts` |
| **691** | `KICKOFF FILED`, Q3 — runs under 692 + 693 + 701 protection | `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`. **Precondition:** measure `/[locale]` First Load JS first — **618 kB vs a 185 kB baseline** (671/675 F3) — before adding to that route |

**Homepage — TWO SEPARATE AXES. Do not conflate them; conflating them is what produced two false "complete" claims.** ⓐ **Mantine component migration** (raw `<div>` → Mantine primitives): ✅ **COMPLETE** for the whole `/[locale]` tree — closed by Task 650 ("Homepage Mantine chrome migration now COMPLETE", archive 2026-07-20). Nothing open on this axis. ⓑ **De-Tailwind / de-hybrid** (D28 — removing raw utilities from components that are *already* Mantine): ⚠️ **OPEN.** Re-censused 2026-08-03 by direct `grep -c 'className='` on every file `page.tsx` reaches: `MantineListingCardPattern` **28** (→ 691 + 695) · `MobileBottomNavView` **11** (→ **709**, Sprint 50 — app-shell, renders on every route) · `HeroSearchView` **9** (→ **709**, Sprint 49) · `ListingCard` **8** (→ 702). Done: `FooterView` (673) · `HeaderView` (706) · `FeaturedListingsView`/`LatestListingsView`/`AgentCtaButton` (707) · `PopularLocationsView` (688). Genuinely 0: `HeroSearch.tsx` (the container — **the 2026-08-01 trace measured this and mislabelled the pair "clean"; the View has 9**), `HeroSearchFallback`, `HowItWorksSteps`, `ViewAllLink`, `FiltersPanel` (671/675). `MantineHomeSection`'s 2 sites are `cn(styles.…)` + the `container-wide` marker — not utilities. 667 stays the route-level inventory.

## Pending Action Items (owner)

| Item | Notes |
|---|---|
| 🔐 Re-verify HIBP "leaked password protection" on Supabase Free tier (Auth → Password Security); enable now if available, else at Pro upgrade. | Advisor `auth_leaked_password_protection` WARN. `docs/integrations.md`. |
| 👁️ Eyeball-verify notification localization under `/sq` (data-only fix applied 2026-07-14). | Re-open the bell under `/sq`. |
| 🐞 `/listings` Grid horizontal overflow <640px (FilterBar segmented `flex-1` + `min-w-35` Combobox push `scrollWidth` past the viewport at 320/375/390). | Needs its own task; out of Task 603 scope. |
| 🖋️ Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. | Epic HH blocker. |
| 🗺️ **The Epic MM tracker is ~150 tasks stale and is nominally the migration's source of truth.** Verified 2026-08-01: `docs/mantine-tailadmin-migration-tracker.md` was last touched **2026-07-06** (Task 556), its highest task is **556** while work is at **705**, its "Current pointer" still reads *"NOW — Batch B (Sprint 38, form controls)"*, and **all four slices it names as next are already done** — DatePicker (557 ✅), PhoneField (556 ✅), FiltersPanel (671/675 ✅), HeroSearch (568/573 ✅). It also calls Phase 1 COMPLETE and Batch D IN PROGRESS in the same bullet. `tasks/Epics/Epic_MM_Mantine_UI_Migration.md` is worse — untouched since **2026-06-25**, highest task 484. | Decide: refresh both as their own task, or demote them to historical and name a real successor pointer. Not fixed here — own blast radius. |
| ✅ **Ack that 689 is retired.** Verified 2026-08-01, not inferred: 699 repointed all 5 sites, `check:design-tokens` reads **28** on a live run, and the only surviving `1.875rem` is the hero triple 689 excluded by design. | Nothing left to do — needs your ack only. |

## Sprints

**Sprint 46 — ListingCard de-Tailwind + the overlay exit condition** (`tasks/Sprints/Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md`), holding 691 · 694 · 695 · 700 · 702, all carried in from the unsprinted period. 🟠 OPEN, **zero landed tasks**.

**Sprint 48 — Homepage tail de-Tailwind** (`tasks/Sprints/Sprint_48_Homepage_Tail_DeTailwind.md`), holding **707**. 🟢 CLOSING 2026-08-03 — 707 `APPROVED WITH NOTES`, pending owner commit. **D31** (fold `AgentCtaButton` into 707) discharged. Sprint 47's **D28** (mechanism-only, zero visual delta, utilities → Mantine props + colocated `.module.css`) stays in force for 49/50. ⚠️ **Its closing claim was false and is retracted**: "after 707 and Sprint 46 land, the whole `/[locale]` tree is Tailwind-utility-free" ignored `HeroSearchView` (9) and `MobileBottomNavView` (11). Sprints 49 + 50 carry those 20 sites.

**Sprint 49 — HeroSearch: gate integrity, then de-Tailwind** (`tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md`), holding **708** → **709** → **710**. 🟠 OPEN, opened 2026-08-03. Ordered, not parallel: **708** repairs the dead `heroSearchWrapInBand` gate and re-anchors it to a de-Tailwind-stable hook; **709** de-Tailwinds `HeroSearchView`'s 9 sites against that now-live comparator; **710** adds the meta-gate that fails when any assertion returns `null` across every one of its target cells — the failure mode that hid 573's death for ~5 weeks. **D32** (2026-08-03): a migration may not be proven against a comparator that has not been shown to fail; 708 blocks 709. **Sprint 50** is reserved for `MobileBottomNavView` (app-shell, the Sprint 47 Header/Footer family, 3 `design-tokens-allow` markers to carry across) — open it with its own plan file before writing that kickoff.

**Owner rule, 2026-08-01: every task belongs to a sprint.** Kickoffs go to `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md`, never to the root of `tasks/`; if no open sprint fits, open the next one first. Recorded in `CLAUDE.md`, `.claude/skills/create-task/SKILL.md` (blocking pre-check) and `docs/ai-behavior.md`. Binds **706** onward.

**Sprint 45 = the unsprinted period, Tasks 621–705** (`tasks/Sprints/Sprint_45_Unsprinted_Period_621_to_705.md`, 🟢 CLOSED, 2026-07-17 → 2026-08-01). Sprints 0–44 were planned up front and ended at Task 620; 621–705 then ran with no sprint above them for ~6 weeks, which is how the migration tracker came to point at slices finished a month earlier. It is recorded as **one closed unit covering all 85 numbers** (66 closed + 19 issued-but-never-executed), with themes inside as a reading aid. An earlier attempt to split it into eight sprints 45–52 was deleted: the ranges **overlapped in 9 places** — 51 sat entirely inside 50 — because only *review* dates exist, not work dates. Kickoff files were **not** moved, so every path reference stays valid.

## Task registry — single source for every open number. Last used **710**, NEXT FREE **711**

Closed tasks are not listed here; they live in the archive ledger. Numbers owned by an epic are tracked in the Epics table below, not duplicated here.

| # | State | What |
|---|---|---|
| 667 | reserved | Route-oriented Mantine inventory; enrolment stays story-first per slice. |
| 676 | reserved (675 §8) | `globals.css` stale hex comments. |
| 677 | reserved (675 §8) | Pre-existing `<div>`-in-`<p>` warning. |
| 678 | reserved (675 §8) | 14-width matrix enrolment (`MANTINE_VIEWPORTS` is 4 widths, `check-stories-rendered.mjs:392`). Folds in 699's gap: `xxl` ≥1440 unproven for 2 of the 5 heading sites. |
| 679 | reserved (675 §8) | `usePropertyTypes` fallback localization — the cause behind 671/675's `NOT VERIFIABLE` R13. |
| 680 | reserved (675 §8) | `check:locale-leak` lowercase blind spot. |
| 682 | reserved (681) | Drop `sonner` + `next-themes` from `package.json`. |
| 683 | reserved (672) | TailAdmin bottom-nav conformance slice — no reference row exists yet. |
| 687 | reserved | Enrol `Admin/AdminUsersTable` into the `--mantine-only` manifest (+16 cells on a blocking gate → own blast radius). |
| 694 | reserved — Sprint 46 | Alias `--overlay*` → `var(--mantine-color-black/white)` (660/661 convention). Declarations live at `globals.css:76-79` (`@theme inline`) + `:451-452` (`:root`) — **not** the `:311-315` this entry cited before 690/693 moved them. Runnable now; NOT foldable into 693 — it changes the expression AC1/AC5 compare on. |
| 695 | reserved, blocked on 691 — Sprint 46 | **De-Tailwind exit condition for the overlay pair** — drop the `@theme inline` copy + `--color-overlay*` namespace once the last of the **33** `bg-overlay*`/`text-overlay-foreground*`/`border-overlay-foreground*` utilities across **7** files is gone (re-counted 2026-08-01: `PerfDevOverlay` 11 · `MantineListingCardPattern` 6 · `ListingGallery` 5 · `LightboxView` 4 · `MantineListingGalleryPattern` 3 · `ImageUpload` 3 · `AdminUserAvatar` 1 — the previous "8 files" and "PerfDevOverlay 10" were both wrong and summed to 32). **Must UPDATE 692's gate, not delete it.** Folds in 692 F1 + 662 F2. |
| 700 | reserved — Sprint 46 | General `@theme`-dependency gate: fail when a `.module.css` consumes an `@theme` var whose last utility consumer disappears. Repo-wide. |
| 702 | reserved — Sprint 46 | `ListingCard.tsx` de-Tailwind (8 sites); marker classes stay verbatim. |
| 707 | **`APPROVED WITH NOTES`** — Sprint 48, reviewed 2026-08-03, pending owner commit | Homepage tail de-Tailwind, 5 sites → 2 colocated modules + lucide `size`. Reviewer recomputed all 32 `HomepageListingGrids` md5s from both official run dirs (0 mismatches); build `exit 0` owner-native. 6 P3s (N1 `p-3`→`var(--space-3)` repo-wide · N2 `:where()` specificity · N3 icon rem→px · N4 noise cell · N6 stale counts, 3rd recurrence). Detail: `sessions/2026-08-03-task707-homepage-tail-de-tailwind.md` §10 |
| 708 | **`KICKOFF FILED`** — Sprint 49, Q4 | **Repair the dead `heroSearchWrapInBand` gate** (`tasks/Sprints/Sprint_49_kickoff_prompt_Task_708_HeroSearchWrapInBand_Gate_Repair.md`). Re-anchor `check-stories-rendered.mjs:1237-1259` off the Tailwind classes 652 deleted onto a de-Tailwind-stable hook, so it survives 709. **Q4 — planted-violation proof mandatory**: the gate must be shown to genuinely FAIL. Blocks 709. |
| 709 | reserved, **blocked on 708** — Sprint 49 | `HeroSearchView` de-Tailwind, **9** sites. Hardest of the D28 set: arbitrary values (`rounded-b-[var(--mantine-radius-lg)]`), `sm:`/`md:` variants, and the 572 `basis/grow/shrink` chain the file's own comment forbids collapsing to `flex-1`. 3 sites pass `className` into child components, not `Box`. |
| 710 | reserved — Sprint 49 | **Meta-gate: an assertion that is `null` in every one of its target cells is a dead gate, not a pass.** Exactly how 573 died unnoticed for ~5 weeks. Same shape applies to `fullWidthControlsAtMobile` / `fullWidthButtonsAtMobile` / `popupBottomSheetAtMobile`, which are also `null`-by-default. |

- **In flight, described once under "Open — needs action":** 661 · 665 (no sprint — both predate the rule) · 691 (Sprint 46). 706 landed `911852104` → archive ledger; 707 approved, row above.
- **Owned by epics, described once in the Epics table:** 310 · 311 · 313 · 308–309 (HH) · 453 (KK.2) · 463 (BB).
- **Standalone deferred:** **560** admin suspension-as-date-range (DB migration + RLS + server action + admin UI) — **sourced, keep**: split out at `Sprint_41_kickoff_prompt_Task_557_…md:26,:36`, carried at `Sprint_42_Booking_Range_DatePicker.md:28,:79`, and recorded DEFERRED in the ledger row of 2026-07-06. Blocked on the owner defining suspension-window semantics · **SaveToCollection dialog → Mantine** (654 follow-up, still shadcn).
- **Not plain numbers:** 622/623 (`Q0R`, `623R` are lettered IDs). **628** reserved for the SB10 lint-debt fix. · **Retired, never reuse:** 465 · 466/467/469–481 · 534 · 597/604 · 655.

**Unnumbered follow-ups:** the `ListingCard`/`HomepageListingGrids` live relative-date fixture will spuriously flag on any Q3 re-capture taken on a different calendar day · add `TextInput/Default`, `MobileBottomNavView` (uk), `PopularLocationsView/Long City Name` (sq@390) to `docs/storybook-governance.md` §8.1 · no regression test for `check:mojibake` (666 F1) · `check-homepage-grid.mjs` lacks `emulateMedia` (704/705 F1 `P3`) — **assessed harmless, do not escalate**: that gate reads layout only, and opacity does not move layout.

## Active Epics — open (closed epics → archive)

> **Removed 2026-08-01 as internally contradictory:** **Epic II** described itself as "implemented + reviewed (316–323), committed + pushed" while sitting in an *open* table — Task 323's ledger row calls the epic fully implemented. **Epic BB / Task 463** was listed as "ON HOLD until Epic MM primitives complete", but `8ff5a0557` is `feat(Task463)` with a full session log, and Task 464 revalidated its visual proof — no source anywhere supports an MM dependency. If 463 still lacks a formal review verdict, file that as a review, not as a blocker.

| Epic | Status | Plan |
|---|---|---|
| **HH — Admin UX System** | OPEN — 310 (P4), 311 (P5 partial), 313 (P6, blocked on owner DB sign-off); 308/309 re-scope onto canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) |
| **KK — Admin Data Freshness** | 452 done. **453 is conditional, not a queue of "remaining managers"** — per the epic it opens *only if* 452's investigation exposes a page needing special handling (a client-local list with no prop re-sync, or a surface genuinely needing realtime). No such page has been named | [`Epic_KK_…`](../tasks/Epics/Epic_KK_Admin_Data_Freshness.md) |
| **MM — Mantine/TailAdmin Restyle** | IN PROGRESS. **Phase-1 primitives COMPLETE**; Sprints 37–44 landed + pushed, and **the sprint structure ended there — Sprint 44 closed at Task 620, so everything 621→705 is standalone post-sprint work.** ⚠️ **Do NOT use the tracker as the "what's next" pointer** — see the owner item above | [`Epic_MM_…`](../tasks/Epics/Epic_MM_Mantine_UI_Migration.md) · `docs/mantine-tailadmin-migration-tracker.md` |

## Standing notes

> **Binding decisions** (derivation → ledger rows): **D26** — sub-perceptual delta **≤2/255** is an attribution path (supersedes D17's ≤1/255) only under 4 conjunctive conditions; **not** a general exemption, **not** a ceiling on the §8.1 noise path. `docs/storybook-governance.md` §14.11. · **D19** — overlay pair declared in both `@theme inline` and `:root`; the `@theme` copy is transitional, expiry = 694 → 695. · **D25** frozen Storybook preview clock. · **D27** Skeleton `::after` fill = gray-3 `#d0d5dd`, token not hex. · **D28** (2026-08-01) layout-shell de-hybrid = **mechanism-only, zero visual delta** — keep `unstyled`, utilities → Mantine style props + colocated `.module.css` (the 688 D16 pattern); authorizes no restyle, token, spacing or typography change. Binds 673 + 706. · **D29** (2026-08-01) 673 splits footer-first; `HeaderView` = 706.

> **Recurring orchestrator failure mode — read before writing any kickoff (M1 · M2 · M4 · M5).** Four blocked/revised tasks failed identically: the *fix* was right, the *control* could not detect its own effect. M2 — ACs proved nothing broke but never proved the objective. M4 — the plant's subject had unremovable lifelines, so the negative arm could never return `ABSENT`. M1/M5 — right mechanism, wrong query. **Every kickoff needs a two-armed plant that can demonstrably fail, plus a pre-plant census proving no further lifeline.** Same rule for records: reconcile git state from `git log`/`git status`, never from a session log's own self-description.

> **No CI gate asserts the Mantine composition of a *route*** (verified 2026-07-26, still true). `--mantine-only` scopes by Storybook title prefix (`scripts/lib/mantine-story-scope.mjs`); only `check:story-coverage` reads `mantine-migration-scope.json`, treating anything absent as out of scope. Route-level checks exist (`check-hydration-console`, `check-header-id-parity`, `validate-production-lcp`, `check:homepage-grid`) but none measures markup composition. `15/15` proves coverage of fifteen enrolled components — not the homepage.

> **Design-system floor:** every open task consumes `docs/design-system.md` wherever UI/responsive/overlay is touched, and since the Mantine freeze (Task 482) new UI uses Mantine (`docs/mantine-responsive-design-system.md`). `docs/rule-index.md` sets the per-task pre-read. (Epic status is the Epics table's job, not this note's.)

> **🟡 Console NOISE (not bugs — do not re-triage as P0):** `[PRED] … preloaded`, `[LCP] … route`, `[Vercel Speed Insights] debug`, "speculation rule set … will be ignored", Turbopack dev-only CSS-chunk/`*.woff2` preload warnings. OpenTelemetry `import-in-the-middle` fixed by Task 450 (`322c5d599`); Cloudinary LCP preload by Task 437. A stale Turbopack HMR cache can emit a one-off `useId` `mantine-_R_…` hydration error that does not survive a clean `next build` and does not reproduce in prod — re-verify with `check:hydration` against a fresh server before triaging (Task 582).

> **Commit emission policy:** the orchestrator emits explicit-path `git add`/`git commit` per task at review time (never `-A`/`-u`/wildcards, never pre-staged batches); the owner runs them in PowerShell. Reconcile `git status --short` + the real diff + the session log's `Files Changed` table before emitting (STATUS/REPORT MISMATCH gate).

> **Acknowledged advisor exceptions** (intentional, no task): `pg_net in public`; `email_change_tokens` RLS-enabled-no-policy — `docs/rls-rules.md`.

> **Standing governance:** `ai-behavior.md` Notes 18–23 + `agent-contract.md` (P0, clauses 1–15) + `rule-index.md` + the Positive/Negative flow rule (`orchestrator-role.md`). Non-optional on every task. **`npm run build` exit 0 mandatory for non-Q0** (`67340ff49`).

## Archive

Closed tasks, sprints and epics → **[`docs/backlog-archive.md`](backlog-archive.md)**, one ledger row each, newest first.
