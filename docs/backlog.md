# Project Backlog

> ⚠️ **ACTIVE STATE ONLY (~80 lines).** Closed tasks/sprints/epics → [`docs/backlog-archive.md`](backlog-archive.md), one ledger row each, newest first. Full detail → `docs/sessions/`. Kickoff detail stays in `tasks/` and is **not** restated here.
> "Last Session" = 2–4 lines. On close, move the task to ONE archive row. Rules: `docs/ai-behavior.md` → "Backlog & Session Log Rules".

## Last Session (2026-08-06) — 719 `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. ⚠️ **BACKLOG LIMIT BREACH** — file is at/over 80 lines; Opus consolidation needed.

- **719**: `shouldSkipLine`'s `.css` skip now consults the CSS-comment-stripped line (blank-only skip) instead of a raw leading-`*` guess; `.ts`/`.tsx` path byte-for-byte unchanged. Dead `:586` duplicate removed in the same edit (R4). 4 planted arms (one per blinded category) fail pre-fix, pass post-fix; 2 new R3 regression arms + §A's 2 pre-existing arms (zero diff) all pass; tree stays 0 findings. §23.6.c A7 retired with closure note, A8 untouched. Suite 94/94, `tsc`=0, `build`=0. Session: `sessions/2026-08-06-task719-skipline-universal-selector.md`. **720 next** (Sprint 52, sequenced).

## Open — needs action

| Item | State | Next step |
|---|---|---|
| **Git** | On `task/q0-ci-rendered-locale-split`, which `origin` contains. **`HEAD` is not in `origin/main`** | ⚠️ **Never record divergence counts or tree cleanliness here** — stale within one commit. Read from `git status` / `git rev-list` |
| **Cleanup step 3** | UNBLOCKED (696 = step 1, 701 = step 2, I-D landed in 703) | Delete 3 consolidated probes: `task420-qa-grid-step.mjs` · `task668-qa-grid-1440.mjs` · `task668-qa-header-geometry.mjs` (**1084 lines by `wc -l`, 946 non-blank** — say which you mean). **Must also update `check-homepage-grid.mjs`, which names all three in 18 provenance comments.** `scripts/` holds **13** task-numbered probes, all unwired; the other 10 are a separate call, incl. **670** |
| **661** | AWAITING ORCHESTRATOR REVIEW | Review `sessions/2026-07-23-task661-single-source-brand-color.md` |
| **665** | `PARTIALLY IMPLEMENTED / PARTIALLY VERIFIED` | **Only §13.7's live-route before/after DOM/computed-style baseline is outstanding** (AC1 — needs a routable dev server + seeded DB; use §16.1's corrected `classList.contains` locator). Also decide the orphan `listing.fixture.ts` |
| **691** | `KICKOFF FILED`, Q3 — under 692 + 693 + 701 protection | `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`. **Precondition measured, decision outstanding:** `/[locale]` First Load JS is **618 kB vs a 185 kB baseline** (671/675 F3), unchanged across the 710/712/713/714 builds — the number exists; the go/no-go does not |

**Homepage — TWO SEPARATE AXES. Do not conflate them; conflating them produced two false "complete" claims.** ⓐ **Mantine component migration**: ✅ **COMPLETE** for the whole `/[locale]` tree — Task 650, re-verified 2026-08-05 (only `AppImage` imports from `components/ui/`, and it is a native `<img>` wrapper, not shadcn). ⓑ **De-Tailwind (D28)**: ⚠️ **OPEN — only the card pair remains**, `MantineListingCardPattern` **28** (→ 691 + 695) and `ListingCard` **8** (→ 702), which the homepage grids render via `ListingCard.tsx:7`. Done: `FooterView` (673) · `HeaderView` (706) · `FeaturedListingsView`/`LatestListingsView`/`AgentCtaButton` (707) · `PopularLocationsView` (688) · `HeroSearchView` (709 + 709-R) · `MobileBottomNavView` (713) · **route files** `page.tsx` (712) and `layout.tsx` (713), both 0 raw utilities. Genuinely 0: `HeroSearch.tsx`, `HeroSearchFallback`, `HowItWorksSteps`, `ViewAllLink`, `FiltersPanel` (671/675), `MantineHomeSection`. 667 stays the route-level inventory.

## Pending Action Items (owner)

| Item | Notes |
|---|---|
| 🔐 Re-verify HIBP "leaked password protection" on Supabase Free tier (Auth → Password Security). | Advisor `auth_leaked_password_protection` WARN. `docs/integrations.md`. |
| 👁️ Eyeball-verify notification localization under `/sq` (data-only fix 2026-07-14). | Re-open the bell under `/sq`. |
| 🐞 `/listings` Grid horizontal overflow <640px (FilterBar segmented `flex-1` + `min-w-35` Combobox push `scrollWidth` past the viewport at 320/375/390). | Needs its own task; out of Task 603 scope. |
| 🖋️ Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. | Epic HH blocker. |
| 🗺️ **The Epic MM tracker is ~160 tasks stale and is nominally the migration's source of truth.** `docs/mantine-tailadmin-migration-tracker.md` last touched **2026-07-06** (Task 556), highest task **556** while work is at **716**; its "Current pointer" and all four "next" slices are already done. `tasks/Epics/Epic_MM_Mantine_UI_Migration.md` is worse — untouched since **2026-06-25**, highest task 484. | Decide: refresh both as their own task, or demote them to historical and name a real successor pointer. Own blast radius. |
| 🐞 **Pre-existing `<div>`-in-`<p>` hydration error** in the FiltersPanel drawer (`DrawerTitle → ModalBaseTitle → Text(component="p") → Group(div)`), re-confirmed live 2026-08-05. **677** reserves it. | Promote 677 to a kickoff, or fold into the next FiltersPanel touch. |
| ✅ **Ack that 689 is retired** — 699 repointed all 5 sites; the only surviving `1.875rem` is the hero triple 689 excluded by design. | Needs your ack only. |

## Sprints

**Sprint 46 — ListingCard de-Tailwind + overlay exit** (`tasks/Sprints/Sprint_46_…md`): 691 · 694 · 695 · 700 · 702. 🟠 OPEN, **zero landed tasks**. **D34 binds it.**
**Sprint 52 — Gates that stopped checking** (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`): 714 ✅ · **715 ✅** · **716 ✅** · **718 ✅** · **718R ✅** (`98bec3fa9`) · **719 AWAITING REVIEW** → **720** (next) · 711 · **717** reserved. **Order: 714 → 716 → 715 → 718 → 718R → 719 → 720.** 🟠 OPEN.
🟢 **CLOSED → archive:** Sprint 45 (the unsprinted 621–705 period) · 46–48 · **49** (708 · 709 + 709-R · 710) · **50** (713) · **51** (712).

**Owner rule, 2026-08-01: every task belongs to a sprint.** Kickoffs go to `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md`, never the root of `tasks/`; if no open sprint fits, open the next one first — recorded in `CLAUDE.md`, `.claude/skills/create-task/SKILL.md` (blocking pre-check) and `docs/ai-behavior.md`. Binds **706** onward.

## Task registry — single source for every open number. Last used **720**, NEXT FREE **721**

| # | State | What |
|---|---|---|
| 667 | reserved | Route-oriented Mantine inventory; enrolment stays story-first per slice. |
| 675 §8 family | reserved | **676** `globals.css` stale hex comments · **677** the `<div>`-in-`<p>` FiltersPanel warning (owner item) · **679** `usePropertyTypes` fallback localization, the cause behind 671/675's `NOT VERIFIABLE` R13 · **680** `check:locale-leak` lowercase blind spot. |
| 678 | reserved (675 §8) | 14-width matrix enrolment (`MANTINE_VIEWPORTS` is 4 widths, `check-stories-rendered.mjs:392`). Folds in 699's gap: `xxl` ≥1440 unproven for 2 of the 5 heading sites. |
| 682 · 683 | reserved | **682** drop `sonner` + `next-themes` from `package.json` (681) · **683** TailAdmin bottom-nav conformance slice, no reference row exists yet (672). |
| 687 | reserved | Enrol `Admin/AdminUsersTable` into the `--mantine-only` manifest (+16 cells on a blocking gate → own blast radius). |
| 694 | reserved — Sprint 46 | Alias `--overlay*` → `var(--mantine-color-black/white)` (660/661 convention). Declarations at `globals.css:76-79` + `:451-452`. Runnable now; NOT foldable into 693. |
| 695 | reserved, blocked on 691 — Sprint 46 | **De-Tailwind exit condition for the overlay pair** — drop the `@theme inline` copy + `--color-overlay*` namespace once the last of **33** overlay utilities across **7** files is gone (`PerfDevOverlay` 11 · `MantineListingCardPattern` 6 · `ListingGallery` 5 · `LightboxView` 4 · `MantineListingGalleryPattern` 3 · `ImageUpload` 3 · `AdminUserAvatar` 1). **Must UPDATE 692's gate, not delete it.** Folds in 692 F1 + 662 F2. |
| 700 | reserved — Sprint 46 | General `@theme`-dependency gate: fail when a `.module.css` consumes an `@theme` var whose last utility consumer disappears. Repo-wide. |
| 702 | reserved — Sprint 46 | `ListingCard.tsx` de-Tailwind (8 sites); marker classes stay verbatim. **D34 applies.** |
| 711 | reserved — Sprint 52 | Re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto Mantine DOM; their selectors are shadcn `data-slot` names (`check-stories-rendered.mjs:1161`, `:1185-1192`) Mantine never renders — the §14.9.9 `PORTAL_SELECTOR` defect again. Planted proof per assertion. **Must fold in four 710-review findings:** `[no-boolean-assertions]` exit-2 arm · `ORPHAN-ENTRY` exit-1 arm · the `critical-flow-registry` row-50 + `2026-08-0X` citation fixes · a `LIVE-THIN` threshold (`heroSearchWrapInBand` resolves in only 4/1184 cells). |
| 719 | **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** — Sprint 52 | `shouldSkipLine`'s `.css` skip now consults the CSS-comment-stripped line (blank-only), fixing the cross-category leading-`*` blind spot; `.ts`/`.tsx` unchanged; dead `:586` removed; §23.6.c A7 retired. Session: `sessions/2026-08-06-task719-skipline-universal-selector.md`. |
| 720 | **KICKOFF FILED**, sequenced after 719 — Sprint 52 | `extractCssCustomPropertyDefinitions:574`'s `/^…/gm` registers at most **one** declaration per line and only as the first token: `.x { --local: 1px; width: var(--local); }` is a **false positive**, `'--Foo: 1px; --foo: 2px'` → `['--Foo']` only. Exposure **0**; fails **loud**, not silent. Naive `^`-removal **rejected** — it reads decl-shaped literals in `content` strings / data URIs as definitions, converting a loud false positive into a silent false negative; declaration-aware quote/paren-tracking scan required. Case-sensitivity preserved. `Sprint_52_kickoff_prompt_Task_720_…md`. |
| 717 | reserved — Sprint 52 | Narrow the `src/design-system/mantine` path allowlist (`scripts/design-tokens-allowlist.json:2`), which exempts the WHOLE directory (incl. `MantineListingCardPattern.module.css`) from token enforcement though its stated reason is only about `theme.ts`'s raw-value requirement. Own blast radius — deliberately deferred by 715 (§3.6). |

- **Described once elsewhere:** 661 · 665 · 691 (above) · 310 · 311 · 313 · 308–309 (HH) · 453 (KK.2) · 463 (BB) in Epics.
- **Standalone deferred:** **560** admin suspension-as-date-range — **sourced, keep** (split out at `Sprint_41_kickoff_prompt_Task_557_…md:26,:36`, DEFERRED 2026-07-06), blocked on the owner defining suspension-window semantics · **SaveToCollection dialog → Mantine** (654 follow-up, still shadcn).
- **Not plain numbers:** 622/623 (`Q0R`, `623R`) · **709-R** (closed with 709) · **628** SB10 lint-debt. **Retired, never reuse:** 465 · 466/467/469–481 · 534 · 597/604 · 655.

**Unnumbered follow-ups:** the `ListingCard`/`HomepageListingGrids` live relative-date fixture spuriously flags on any Q3 re-capture taken on a different calendar day · add `TextInput/Default`, `PopularLocationsView/Long City Name` (sq@390), `LocationComboboxSubPanel/Default` (en@320) to `storybook-governance.md` §8.1 — **`MobileBottomNavView` (uk) is already listed there**, confirmed 2026-08-06 · no regression test for `check:mojibake` (666 F1) · `check-homepage-grid.mjs` lacks `emulateMedia` (704/705 F1 `P3`) — **assessed harmless, do not escalate**.

## Active Epics

**HH — Admin UX System** 🟠 310 (P4) · 311 (P5 partial) · 313 (P6, blocked on owner DB sign-off); 308/309 re-scope onto canonical primitives → [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md)
**KK — Admin Data Freshness** 🟠 452 done. **453 is conditional** — it opens *only if* 452's investigation exposes a page needing special handling; no such page has been named → [`Epic_KK_…`](../tasks/Epics/Epic_KK_Admin_Data_Freshness.md)
**MM — Mantine/TailAdmin Restyle** 🟠 Phase-1 primitives COMPLETE; Sprints 37–44 landed, the structure lapsed, resumed at 46. ⚠️ **Do NOT use the tracker as the "what's next" pointer** (owner item above) → [`Epic_MM_…`](../tasks/Epics/Epic_MM_Mantine_UI_Migration.md)

## Standing notes

> **Binding decisions:** **D19** overlay pair declared in both `@theme inline` and `:root`; the `@theme` copy is transitional, expiry = 694 → 695. · **D25** frozen Storybook preview clock. · **D26** sub-perceptual delta **≤2/255** is an attribution path under 4 conjunctive conditions only (`storybook-governance.md` §14.11). · **D27** Skeleton `::after` fill = gray-3 `#d0d5dd`, token not hex. · **D28** (2026-08-01) de-hybrid = **mechanism-only, zero visual delta**; authorizes no restyle, token, spacing or typography change. · **D32** a migration may not be proven against a comparator not shown to fail. · **D33** re-anchor a gate onto a de-Tailwind-stable hook, never another utility class. · **D34** (2026-08-05) a D28 module reproduces the utility's cascade **layer** — wrap in `@layer utilities`; the inverse 602/629/650/651/653/654/656 family stays **unlayered** on purpose (a migration reproduces; a cascade-trap fix overrides).

> **Recurring orchestrator failure mode — read before writing any kickoff (M1 · M2 · M4 · M5).** Four blocked/revised tasks failed identically: the *fix* was right, the *control* could not detect its own effect. **Every kickoff needs a two-armed plant that can demonstrably fail, plus a pre-plant census proving no further lifeline.** Reconcile git state from `git log`/`git status`, never a session log's self-description. **Corollary (709):** a kickoff's own "measured" facts are not exempt. **Corollary (710–714, 2026-08-06):** four consecutive kickoffs shipped a factual defect the executor had to correct — a stale line reference, a `grep` that counted `.split(` as a test, a crude literal census, and a requirement that was *unsatisfiable* because the detector could not see the target syntax. **Measure with the real tool, not an ad-hoc grep**; see `orchestrator-procedures.md` → "Detector-aware requirements and migrations" (`6c3a2054e`).

> **No CI gate asserts the Mantine composition of a *route*** (2026-07-26, still true). `--mantine-only` scopes by Storybook title prefix; only `check:story-coverage` reads `mantine-migration-scope.json`, treating anything absent as out of scope. `15/15` proves coverage of fifteen enrolled components — not the homepage.

> **🟡 Console NOISE (not bugs — do not re-triage as P0):** `[PRED] … preloaded`, `[LCP] … route`, `[Vercel Speed Insights] debug`, "speculation rule set … will be ignored", Turbopack dev-only CSS-chunk/`*.woff2` preload warnings. OpenTelemetry `import-in-the-middle` fixed by Task 450; Cloudinary LCP preload by Task 437. A stale Turbopack HMR cache can emit a one-off `useId` hydration error that does not survive a clean `next build` (Task 582). **Advisor exceptions** (intentional, no task): `pg_net in public`; `email_change_tokens` RLS-enabled-no-policy — `docs/rls-rules.md`.

> **Commit emission policy:** the orchestrator emits explicit-path `git add`/`git commit` per task at review time (never `-A`/`-u`/wildcards, never pre-staged batches); the owner runs them in PowerShell. Reconcile `git status --short` + the real diff + the session log's `Files Changed` table first. Check `.git/index.lock`; a stale lock blocks the handoff.

> **Standing governance:** `ai-behavior.md` Notes 18–23 + `agent-contract.md` (P0, clauses 1–15) + `rule-index.md` + the Positive/Negative flow rule. Non-optional on every task. **`npm run build` exit 0 mandatory for non-Q0.** **Design-system floor:** every task consumes `docs/design-system.md` wherever UI/responsive/overlay is touched; new UI uses Mantine (`docs/mantine-responsive-design-system.md`), and `docs/rule-index.md` sets the per-task pre-read.
