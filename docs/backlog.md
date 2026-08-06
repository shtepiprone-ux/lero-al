# Project Backlog

> ⚠️ **ACTIVE STATE ONLY (~80 lines).** Closed tasks → [`docs/backlog-archive.md`](backlog-archive.md), one ledger row each. Full detail → `docs/sessions/`. Kickoff detail stays in `tasks/` and is **not** restated here.
> "Last Session" = 2–4 lines. On close, move the task to ONE row at the TOP of the archive ledger. Rules: `docs/ai-behavior.md` → "Backlog & Session Log Rules".

## Last Session (2026-08-05) — 713 implemented, awaiting review; closes Sprint 50 pending approval

- **713 `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — `MobileBottomNavView`/`layout.tsx` de-Tailwind (11 sites, D34 `@layer utilities`); marker count deviation flagged (4 pre-migration → 2 post-migration, see session log §4/§11 and governance §14.9.25). 26/32 md5s hold vs `2026-08-05T17-47`; the other 6 (`uk` only) attributed to pre-existing harness noise with same-tree + historical zero-code-change controls, session log §6b. See `docs/sessions/2026-08-05-task713-mobile-bottom-nav-de-tailwind.md`.
- **710/712 still `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** (unchanged this session) — see Task registry rows.

## Open — needs action

| Item | State | Next step |
|---|---|---|
| **Git** | Work lives on `task/q0-ci-rendered-locale-split`, which `origin` contains. Everything through 709-R is committed and pushed: 707 `736fc0abc` · 708 `16960dc77` · 709+709-R `c1f9461bc` | **`HEAD` is not in `origin/main`** — the run still has to land there. ⚠️ **Do not record divergence counts or tree cleanliness here**: they go stale within one commit. Read them from `git status` / `git rev-list` when needed |
| **Cleanup step 3** | UNBLOCKED (696 = step 1, 701 = step 2, I-D landed in 703 — nothing left unasserted) | Delete the 3 consolidated probes: `task420-qa-grid-step.mjs` · `task668-qa-grid-1440.mjs` · `task668-qa-header-geometry.mjs` — **1084 lines by `wc -l`, 946 non-blank**; the 701 review quotes the former, so say which you mean. **The deletion must also update `check-homepage-grid.mjs`, which names all three in 18 provenance comments**, or the live gate cites deleted paths. Verified 2026-08-01: `scripts/` holds **13** task-numbered probes, **all unwired**; the other 10 are a separate call, incl. **670** (promote to a gate or remove) |
| **661** | AWAITING ORCHESTRATOR REVIEW | Review `sessions/2026-07-23-task661-single-source-brand-color.md` |
| **665** | `PARTIALLY IMPLEMENTED / PARTIALLY VERIFIED` | **Only the §13.7 live-route before/after DOM/computed-style baseline is outstanding** (AC1 — needs a routable dev server + seeded DB; use the §16.1 corrected `classList.contains` locator). Two asks removed as stale 2026-08-01: AC8's unsatisfiable absolute-zero clause was already amended in kickoff §16.4, and the four deletions are already committed in `3be8f4b4a`. Also decide the orphan `listing.fixture.ts` |
| **691** | `KICKOFF FILED`, Q3 — runs under 692 + 693 + 701 protection | `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`. **Precondition:** measure `/[locale]` First Load JS first — **618 kB vs a 185 kB baseline** (671/675 F3) — before adding to that route |

**Homepage — TWO SEPARATE AXES. Do not conflate them; conflating them produced two false "complete" claims.** ⓐ **Mantine component migration** (raw `<div>` → Mantine primitives): ✅ **COMPLETE** for the whole `/[locale]` tree — closed by Task 650, archive 2026-07-20. Nothing open. ⓑ **De-Tailwind / de-hybrid** (D28 — removing raw utilities from components that are *already* Mantine): ⚠️ **OPEN.** Census by direct `grep -c 'className='`, re-verified 2026-08-05: `MantineListingCardPattern` **28** (→ 691 + 695) · `ListingCard` **8** (→ 702). Done: `FooterView` (673) · `HeaderView` (706) · `FeaturedListingsView`/`LatestListingsView`/`AgentCtaButton` (707) · `PopularLocationsView` (688) · **`HeroSearchView` (709 + 709-R)** · `page.tsx` hero band (**712** — dropped inert `relative`/`z-10`, `container-wide` verbatim) · **`MobileBottomNavView` + `layout.tsx` (713** — closes Sprint 50; 4 pre-migration `design-tokens-allow` markers consolidated to 2 post-migration CSS markers, storybook-governance.md §14.9.25**)**. Genuinely 0: `HeroSearch.tsx` (the container — **the 2026-08-01 trace measured this and mislabelled the pair "clean"; the View had 9**), `HeroSearchFallback`, `HowItWorksSteps`, `ViewAllLink`, `FiltersPanel` (671/675). `MantineHomeSection`'s 2 sites are `cn(styles.…)` + the `container-wide` marker — not utilities. 667 stays the route-level inventory. **Route files:** `page.tsx` ✅ 0 raw utilities (712) · `layout.tsx` ✅ 0 raw utilities (713 — `pb-14`/`md:pb-0` removed, `min-h-[calc(100vh-4rem)]` and its marker byte-identical).

## Pending Action Items (owner)

| Item | Notes |
|---|---|
| 🔐 Re-verify HIBP "leaked password protection" on Supabase Free tier (Auth → Password Security); enable now if available, else at Pro upgrade. | Advisor `auth_leaked_password_protection` WARN. `docs/integrations.md`. |
| 👁️ Eyeball-verify notification localization under `/sq` (data-only fix applied 2026-07-14). | Re-open the bell under `/sq`. |
| 🐞 `/listings` Grid horizontal overflow <640px (FilterBar segmented `flex-1` + `min-w-35` Combobox push `scrollWidth` past the viewport at 320/375/390). | Needs its own task; out of Task 603 scope. |
| 🖋️ Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. | Epic HH blocker. |
| 🗺️ **The Epic MM tracker is ~150 tasks stale and is nominally the migration's source of truth.** Verified 2026-08-01: `docs/mantine-tailadmin-migration-tracker.md` was last touched **2026-07-06** (Task 556), its highest task is **556** while work is at **710**, its "Current pointer" still reads *"NOW — Batch B (Sprint 38, form controls)"*, and **all four slices it names as next are already done**. It also calls Phase 1 COMPLETE and Batch D IN PROGRESS in the same bullet. `tasks/Epics/Epic_MM_Mantine_UI_Migration.md` is worse — untouched since **2026-06-25**, highest task 484. | Decide: refresh both as their own task, or demote them to historical and name a real successor pointer. Own blast radius. |
| ✅ **Ack that 689 is retired.** Verified 2026-08-01: 699 repointed all 5 sites and the only surviving `1.875rem` is the hero triple 689 excluded by design. | Nothing to do — needs your ack only. |
| 🐞 **Pre-existing hydration error, surfaced by the 709-R smoke run:** `<div> cannot be a descendant of <p>` in the FiltersPanel drawer (`DrawerTitle → ModalBaseTitle → Text(component="p") → Group(div)`). Predates 709; **677** already reserves this. | Promote 677 to a real kickoff, or fold into the next FiltersPanel touch. |

## Sprints

**Sprint 46 — ListingCard de-Tailwind + the overlay exit condition** (`tasks/Sprints/Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md`), holding 691 · 694 · 695 · 700 · 702, all carried in from the unsprinted period. 🟠 OPEN, **zero landed tasks**. **D34 now binds it** — every de-Tailwind module here must reproduce its utilities' cascade layer.

**Sprint 49 — HeroSearch: gate integrity, then de-Tailwind** (`tasks/Sprints/Sprint_49_HeroSearch_Gate_And_DeTailwind.md`). 🟠 OPEN — 708 ✅ · 709 + 709-R ✅ · **710 `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, closes the sprint pending approval**. **711 needs a sprint before its kickoff** (open 51 or fold into 50). **Sprint 50** (`tasks/Sprints/Sprint_50_MobileBottomNav_And_AppShell_DeTailwind.md`) — **713 `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, closes the sprint pending approval**.

**Owner rule, 2026-08-01: every task belongs to a sprint.** Kickoffs go to `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md`, never to the root of `tasks/`; if no open sprint fits, open the next one first. Recorded in `CLAUDE.md`, `.claude/skills/create-task/SKILL.md` (blocking pre-check) and `docs/ai-behavior.md`. Binds **706** onward. **Sprint 45** is the after-the-fact name for the unsprinted 621–705 period (`tasks/Sprints/Sprint_45_Unsprinted_Period_621_to_705.md`, 🟢 CLOSED) — one closed unit, kickoff paths unmoved; detail in the archive row of 2026-08-01.

## Task registry — single source for every open number. Last used **713**, NEXT FREE **714**

Closed tasks live in the archive ledger. Numbers owned by an epic are tracked in the Epics table, not duplicated here.

| # | State | What |
|---|---|---|
| 667 | reserved | Route-oriented Mantine inventory; enrolment stays story-first per slice. |
| 676 | reserved (675 §8) | `globals.css` stale hex comments. |
| 677 | reserved (675 §8) | Pre-existing `<div>`-in-`<p>` warning — **re-confirmed live 2026-08-05** in the FiltersPanel drawer (see owner items). |
| 678 | reserved (675 §8) | 14-width matrix enrolment (`MANTINE_VIEWPORTS` is 4 widths, `check-stories-rendered.mjs:392`). Folds in 699's gap: `xxl` ≥1440 unproven for 2 of the 5 heading sites. |
| 679 | reserved (675 §8) | `usePropertyTypes` fallback localization — the cause behind 671/675's `NOT VERIFIABLE` R13. |
| 680 | reserved (675 §8) | `check:locale-leak` lowercase blind spot. |
| 682 | reserved (681) | Drop `sonner` + `next-themes` from `package.json`. |
| 683 | reserved (672) | TailAdmin bottom-nav conformance slice — no reference row exists yet. |
| 687 | reserved | Enrol `Admin/AdminUsersTable` into the `--mantine-only` manifest (+16 cells on a blocking gate → own blast radius). |
| 694 | reserved — Sprint 46 | Alias `--overlay*` → `var(--mantine-color-black/white)` (660/661 convention). Declarations live at `globals.css:76-79` (`@theme inline`) + `:451-452` (`:root`). Runnable now; NOT foldable into 693 — it changes the expression AC1/AC5 compare on. |
| 695 | reserved, blocked on 691 — Sprint 46 | **De-Tailwind exit condition for the overlay pair** — drop the `@theme inline` copy + `--color-overlay*` namespace once the last of the **33** `bg-overlay*`/`text-overlay-foreground*`/`border-overlay-foreground*` utilities across **7** files is gone (`PerfDevOverlay` 11 · `MantineListingCardPattern` 6 · `ListingGallery` 5 · `LightboxView` 4 · `MantineListingGalleryPattern` 3 · `ImageUpload` 3 · `AdminUserAvatar` 1). **Must UPDATE 692's gate, not delete it.** Folds in 692 F1 + 662 F2. |
| 700 | reserved — Sprint 46 | General `@theme`-dependency gate: fail when a `.module.css` consumes an `@theme` var whose last utility consumer disappears. Repo-wide. |
| 702 | reserved — Sprint 46 | `ListingCard.tsx` de-Tailwind (8 sites); marker classes stay verbatim. **D34 applies.** |
| 710 | **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — Sprint 49, Q4, closes the sprint pending approval | Assertion-liveness meta-gate, shipped: `scripts/check-assertion-liveness.mjs` + `check:assertion-liveness`(`:verify`) + 2-entry registry (Task 711, scope `mantine-only`) + R9 structural test + CI wiring + governance §14.9.23. Real manifest: 3 LIVE/2 DEAD-KNOWN/0 DEAD-NEW/0 STALE-ENTRY, exit 0. Detail: `docs/sessions/2026-08-05-task710-assertion-liveness-meta-gate.md`. |
| 711 | reserved, blocked on 710 — **sprint not yet assigned** | Re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto Mantine DOM. One root cause: their candidate selectors are shadcn `data-slot` names (`check-stories-rendered.mjs:1161`, `:1185-1192`) emitted only by `src/components/ui/*`, which Mantine-scope stories never render — the same defect governance §14.9.9 recorded for geometry's `PORTAL_SELECTOR`. Needs a planted proof per assertion. Open Sprint 51 before writing the kickoff (50 closes with 713). |
| 712 | **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — Sprint 51 | `page.tsx:29` de-Tailwind (dropped inert `relative`/`z-10`, A1 measured proof) + `HeroSearch.stories.tsx` cl. 16c parity fix (both stories now render the same `Box` composition production renders). 40/40 herosearch md5s hold vs `2026-08-05T11-33`; `check:assertion-liveness` 3/2/0/0 exit 0. Detail: `docs/sessions/2026-08-05-task712-homepage-route-shell-de-tailwind.md`. |
| 713 | **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`** — Sprint 50, closes the sprint pending approval | `MobileBottomNavView`/`layout.tsx` de-Tailwind, 11 sites, `@layer utilities` (D34). 4 pre-migration `design-tokens-allow` markers consolidated to 2 post-migration CSS markers (detector is Tailwind-syntax-shaped, not value-shaped — governance §14.9.25). 26/32 mobilebottomnavview md5s hold vs `2026-08-05T17-47`, other 6 (`uk` only) = pre-existing harness noise, controls in session log §6b. Detail: `docs/sessions/2026-08-05-task713-mobile-bottom-nav-de-tailwind.md`. |

- **In flight, described once under "Open — needs action":** 661 · 665 (no sprint — both predate the rule) · 691 (Sprint 46).
- **Owned by epics, described once in the Epics table:** 310 · 311 · 313 · 308–309 (HH) · 453 (KK.2) · 463 (BB).
- **Standalone deferred:** **560** admin suspension-as-date-range (DB migration + RLS + server action + admin UI) — **sourced, keep**: split out at `Sprint_41_kickoff_prompt_Task_557_…md:26,:36`, carried at `Sprint_42_Booking_Range_DatePicker.md:28,:79`, DEFERRED in the ledger row of 2026-07-06. Blocked on the owner defining suspension-window semantics · **SaveToCollection dialog → Mantine** (654 follow-up, still shadcn).
- **Not plain numbers:** 622/623 (`Q0R`, `623R` are lettered IDs) · **709-R** (revision of 709, closed with it). **628** reserved for the SB10 lint-debt fix. · **Retired, never reuse:** 465 · 466/467/469–481 · 534 · 597/604 · 655.

**Unnumbered follow-ups:** the `ListingCard`/`HomepageListingGrids` live relative-date fixture will spuriously flag on any Q3 re-capture taken on a different calendar day · add `TextInput/Default`, `MobileBottomNavView` (uk), `PopularLocationsView/Long City Name` (sq@390), `LocationComboboxSubPanel/Default` (en@320, blank-canvas, seen 2026-08-05) to `docs/storybook-governance.md` §8.1 · no regression test for `check:mojibake` (666 F1) · `check-homepage-grid.mjs` lacks `emulateMedia` (704/705 F1 `P3`) — **assessed harmless, do not escalate**: that gate reads layout only, and opacity does not move layout · a backlog/archive hygiene pass is now due whenever a task closes, not batched (this file hit 108 lines against its ~80 target before the 2026-08-05 consolidation).

## Active Epics — open (closed epics → archive)

| Epic | Status | Plan |
|---|---|---|
| **HH — Admin UX System** | OPEN — 310 (P4), 311 (P5 partial), 313 (P6, blocked on owner DB sign-off); 308/309 re-scope onto canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) |
| **KK — Admin Data Freshness** | 452 done. **453 is conditional, not a queue of "remaining managers"** — it opens *only if* 452's investigation exposes a page needing special handling. No such page has been named | [`Epic_KK_…`](../tasks/Epics/Epic_KK_Admin_Data_Freshness.md) |
| **MM — Mantine/TailAdmin Restyle** | IN PROGRESS. **Phase-1 primitives COMPLETE**; Sprints 37–44 landed + pushed, and **the sprint structure ended there — Sprint 44 closed at Task 620, so 621→705 is standalone post-sprint work.** ⚠️ **Do NOT use the tracker as the "what's next" pointer** — see the owner item above | [`Epic_MM_…`](../tasks/Epics/Epic_MM_Mantine_UI_Migration.md) · `docs/mantine-tailadmin-migration-tracker.md` |

## Standing notes

> **Binding decisions** (derivation → ledger rows): **D26** — sub-perceptual delta **≤2/255** is an attribution path (supersedes D17's ≤1/255) only under 4 conjunctive conditions; **not** a general exemption, **not** a ceiling on the §8.1 noise path (`docs/storybook-governance.md` §14.11). · **D19** overlay pair declared in both `@theme inline` and `:root`; the `@theme` copy is transitional, expiry = 694 → 695. · **D25** frozen Storybook preview clock. · **D27** Skeleton `::after` fill = gray-3 `#d0d5dd`, token not hex. · **D28** (2026-08-01) de-hybrid = **mechanism-only, zero visual delta** — utilities → Mantine style props + colocated `.module.css`; authorizes no restyle, token, spacing or typography change. · **D32** a migration may not be proven against a comparator not shown to fail. · **D33** re-anchor a gate onto a de-Tailwind-stable hook, never another utility class. · **D34** (2026-08-05) a D28 module reproduces the utility's cascade **layer** too — wrap in `@layer utilities`; the inverse 602/629/650/651/653/654/656 family stays **unlayered** on purpose, distinguished by intent (a migration reproduces, a cascade-trap fix overrides).

> **Recurring orchestrator failure mode — read before writing any kickoff (M1 · M2 · M4 · M5).** Four blocked/revised tasks failed identically: the *fix* was right, the *control* could not detect its own effect. M2 — ACs proved nothing broke but never proved the objective. M4 — the plant's subject had unremovable lifelines, so the negative arm could never return `ABSENT`. M1/M5 — right mechanism, wrong query. **Every kickoff needs a two-armed plant that can demonstrably fail, plus a pre-plant census proving no further lifeline.** Same rule for records: reconcile git state from `git log`/`git status`, never from a session log's self-description. **Corollary added 2026-08-05 (709):** a kickoff's own "measured" facts are not exempt — 709's §3.3 and its AC11 baseline were both stale or wrong, and both were caught by the executor re-measuring rather than trusting the table.

> **No CI gate asserts the Mantine composition of a *route*** (verified 2026-07-26, still true). `--mantine-only` scopes by Storybook title prefix; only `check:story-coverage` reads `mantine-migration-scope.json`, treating anything absent as out of scope. Route-level checks exist (`check-hydration-console`, `check-header-id-parity`, `validate-production-lcp`, `check:homepage-grid`) but none measures markup composition. `15/15` proves coverage of fifteen enrolled components — not the homepage.

> **🟡 Console NOISE (not bugs — do not re-triage as P0):** `[PRED] … preloaded`, `[LCP] … route`, `[Vercel Speed Insights] debug`, "speculation rule set … will be ignored", Turbopack dev-only CSS-chunk/`*.woff2` preload warnings. OpenTelemetry `import-in-the-middle` fixed by Task 450 (`322c5d599`); Cloudinary LCP preload by Task 437. A stale Turbopack HMR cache can emit a one-off `useId` `mantine-_R_…` hydration error that does not survive a clean `next build` — re-verify with `check:hydration` against a fresh server before triaging (Task 582).

> **Commit emission policy:** the orchestrator emits explicit-path `git add`/`git commit` per task at review time (never `-A`/`-u`/wildcards, never pre-staged batches); the owner runs them in PowerShell. Reconcile `git status --short` + the real diff + the session log's `Files Changed` table before emitting (STATUS/REPORT MISMATCH gate). Check `.git/index.lock` first; a stale lock blocks the handoff.

> **Acknowledged advisor exceptions** (intentional, no task): `pg_net in public`; `email_change_tokens` RLS-enabled-no-policy — `docs/rls-rules.md`.

> **Standing governance:** `ai-behavior.md` Notes 18–23 + `agent-contract.md` (P0, clauses 1–15) + `rule-index.md` + the Positive/Negative flow rule (`orchestrator-role.md`). Non-optional on every task. **`npm run build` exit 0 mandatory for non-Q0** (`67340ff49`). **Design-system floor:** every task consumes `docs/design-system.md` wherever UI/responsive/overlay is touched; since the Mantine freeze (Task 482) new UI uses Mantine (`docs/mantine-responsive-design-system.md`), and `docs/rule-index.md` sets the per-task pre-read.

## Archive

Closed tasks, sprints and epics → **[`docs/backlog-archive.md`](backlog-archive.md)**, one ledger row each, newest first.
