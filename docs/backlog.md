# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** Historical ledger → [`docs/backlog-archive.md`](backlog-archive.md); full per-task detail → `docs/sessions/`.
> "Last Session" = 2–4 lines. When a task is reviewed/closed, move it to ONE row at the TOP of the archive ledger. See `docs/ai-behavior.md` → "Backlog & Session Log Rules".
> **CONSOLIDATED 2026-08-01.** The two multi-thousand-word "Last Session" / "Task numbering" paragraphs were split into **17 archive-ledger rows** (662 · 663 · 664 · 666 · 668 · 669 · 671+675 · 681+684 · 685 · 686 · 688 · 690+693 · 692 · 696 · 699 · 701 · 703+704+705), one per closed task, each carrying its own verdict, D/F/M findings and session-log link. Nothing was dropped — only relocated. Only genuinely-open state remains below.

## Last Session (2026-08-01)

- **703 ✅ `APPROVED`** — I-D ported exactly (provenance comment on `task668-qa-grid-1440.mjs:77`, A1 direct-children semantics, I2 confirmed 3/4 **before** the assert existed, 7th `removeChild` plant asserts `skeletonCount=2 expected=3` rather than "any failure"). 260/260 unchanged. **The one deviation is the orchestrator's:** the kickoff's I3 described the cell total growing while A2 forbade a new matrix — the executor followed A2 and flagged the contradiction. Closes 701's F1 `P2`, **unblocks step 3**.
- **704 + 705 ✅ `APPROVED` as one pair** — 704's pulse restored under **D27** (gray-3 `#d0d5dd`) plus the `prefers-reduced-motion` rule Mantine never honoured (**R6**); **704's interim 🛑 `NEEDS REVISION` LIFTED**. Freeze reach `*, *::before, *::after` deliberately **not** narrowed (narrowing would leave other animated stories non-deterministic); the anticipated "missed page-creation site" defect never existed — `check-stories-rendered.mjs` has exactly one, `newPage()`:845 with `emulateMedia`:852. Proof is a falsifiable `getAnimations()` pair (0 → 8 running, opacity 0.45→0.84/600 ms), not a PNG; `skeleton-chrome.css` diff vs `HEAD` = 33/2, D27 fenced.
- Logs (each carries the full review outcome): `…task703-skeleton-count-invariant.md` §11 · `…task704-skeleton-shimmer-amplitude.md` §16 · `…task705-task704-revision-capture-freeze-scope.md` §15 · `…task701-homepage-grid-invariants-gate.md` § "Orchestrator review outcome".

## Open — needs action

**Git state — verified against the repo 2026-08-01, NOT against the session logs.** Branch `task/q0-ci-rendered-locale-split`, upstream `origin/task/q0-ci-rendered-locale-split`, **0 ahead / 0 behind, working tree clean**. Everything through 705 is committed **and pushed to that branch**: 696 `82ece5c53` · 699 `5065a6df1` · 701 `0fb66b643` · 703 `525776a16` · 704+705 `a5eed6542`. **HEAD is NOT contained in `origin/main`** — the whole run still has to land on `main`, which is the one genuinely open git item.
>
> ⚠️ **Correction, 2026-08-01.** An earlier pass of this consolidation recorded 701/703/704/705 as "APPROVED but UNCOMMITTED" because it copied the `uncommitted` wording out of the session logs — which was true when each log was written and stale by the time it was transcribed. `git log` was never consulted. This is the same failure the M1/M2/M4/M5 note below describes: taking the report as the evidence. **Reconcile git state from `git log`/`git status`, never from a session log's own self-description.**

**Owner cleanup sequence — step 3 is UNBLOCKED.** Step 1 (**696**, `@source not "../../scripts"`, 35 dead utilities dropped from prod CSS) and step 2 (**701**, the three grid probes folded into one neutrally-named `check:homepage-grid` gate) are approved. Step 3 = **delete the 3 now-dead probes** (`task420-qa-grid-step.mjs`, `task668-qa-grid-1440.mjs`, `task668-qa-header-geometry.mjs` — 1084 lines, byte-untouched by 701/703) and decide **670**: promote to a gate or remove. The gate that made this safe (I-D) landed in 703, so nothing is left unchecked.

**Awaiting orchestrator review:** **661** (single-source brand color — `src/design-system/brand.ts`, `--brand-*` aliasing, 6 email files; log `docs/sessions/2026-07-23-task661-single-source-brand-color.md`) · **665** `PARTIALLY IMPLEMENTED / PARTIALLY VERIFIED` — Container/View split for the 4 listing grids; **still missing** the §13.7 pre/after live-route byte-identical DOM/computed-style baseline (AC1/AC8 — needs a routable dev server + seeded DB, unavailable in the sandbox; use the §16.1 corrected `classList.contains` locator), and §16.4's AC8 "0 FAIL … and the RVS cell" clause is **unsatisfiable** (RVS/Populated is 12/12 FAIL in the pre-change baseline too) and needs amending. `check:mojibake` unblocked by 666; still needs the owner to stage the deletions.

**Active queue:** **691** `KICKOFF FILED` (Q3, `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`) — executes under protection now that 692 + 693 + 701 landed. **Scope SPLIT: 691 = `MantineListingCardPattern.tsx` only (25 `className` sites); `ListingCard.tsx` (8 sites) is 702.** The cut is at the file boundary precisely because the two communicate through 3 `className` string contracts (card root, FavoriteButton `shrink-0 -mt-0.5 -mr-1`, `overlay.className`) — slicing here changes them in neither task. **`.listing-card` is load-bearing**: it anchors 4 stories in `check-stories-rendered.mjs` **and** is the grid locator in `check:homepage-grid`, and it is emitted by `ListingCard.tsx`, which 691 may not touch (md5-witnessed). Landing zone exists (`MantineListingCardPattern.module.css`, Task 602) — Mantine's `Card` CSS is **unlayered** and always beats Tailwind's `@layer utilities`, so extend that module, never `!important`/layer-override. Overlay chips → `var(--overlay*)`. Comparator = the D26 rendered matrix **plus** `check:homepage-grid`, both required. **Check F3 first: `/[locale]` ships 618 kB First Load JS vs a 185 kB baseline** (671/675 review) — measure before 691 adds to that route.

**Homepage → Mantine, honest status.** Band/hero chrome ✅ COMPLETE (646/647/648–649/650 + 653/654). Full render tree **NOT** complete — the earlier "100% Mantine" claim was retracted by the 2026-07-26 audit. Remaining: **673** `HeaderView`/`FooterView` (hybrid: real Mantine API + Tailwind visuals; `HeaderView` also `unstyled` everywhere per Task 629) — **unblocked**, owner ruled 2026-07-29 that "migrated" = **mechanism-only, as in 672** (raw elements → Mantine primitives, visuals preserved until a TailAdmin row exists; none exists for header/footer, grep-confirmed). **667** = route-oriented inventory only; manifest enrolment happens story-first inside each slice, since `check:story-coverage` fails any component enrolled without a `Mantine/Primitives/*` or `Patterns/Mantine/*` story.

> **Governance note (verified 2026-07-26, still true):** no CI gate asserts the Mantine composition of a *route*. `--mantine-only` scopes by **Storybook title prefix** (`scripts/lib/mantine-story-scope.mjs`), never by manifest; only `check:story-coverage` reads `mantine-migration-scope.json` and treats anything absent from it as out of scope. Route-oriented checks exist (`check-hydration-console.mjs`, `check-header-id-parity`, `validate-production-lcp`, and now `check:homepage-grid`) but none measures markup composition. `15/15` proves coverage of fifteen enrolled components — not the homepage.

**Deferred / on hold:** **560** admin suspension-as-date-range (DB/RLS/server action) · **463** (Epic BB) full admin report management — ON HOLD until Epic MM primitives complete (`tasks/Epics/Epic_BB_kickoff_prompt_Task_463_AdminReportFullManagement.md`) · **Epic HH** 310 (P4), 311 (P5 partial), 313 (P6, blocked on owner DB sign-off), 308/309 re-scope onto canonical primitives · **453** (Epic KK.2) remaining admin-manager freshness · **SaveToCollection dialog → Mantine** (654 follow-up — collections `Dialog`/`Input`/in-dialog `Button`s still shadcn).

## Pending Action Items (owner)

| Item | Notes |
|---|---|
| 🔐 Re-verify HIBP "leaked password protection" availability on Supabase Free tier (Auth → Password Security); enable now if available, else at Pro upgrade. | Security Advisor `auth_leaked_password_protection` WARN. `docs/integrations.md`. |
| 👁️ Eyeball-verify notification localization under `/sq` (data-only fix applied 2026-07-14; creation code already correct). | Re-open the bell under `/sq`. |
| 🐞 `/listings` Grid horizontal overflow <640px (FilterBar segmented `flex-1` + `min-w-35` Combobox push `scrollWidth` past the viewport at 320/375/390). Needs its own task. | Traced via DOM offender scan; out of Task 603 scope. |
| 🖋️ Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. | Epic HH blocker. |
| ❓ **Confirm 689 is closed by 699.** 689 was reserved as "tokenise the section-heading `fz` triple project-wide", census corrected to 5 lines / 4 files; **699 repointed exactly those 5 sites** and `check:design-tokens` went 43→28. If nothing else is in scope, retire 689 rather than leave it reserved. | Owner call — not self-resolved. |

## Task numbering — last used **705**, NEXT FREE **706**

| # | Status | What |
|---|---|---|
| 667 | reserved | Route-oriented Mantine inventory (no manifest enrolment — story-first, per slice). |
| 673 | reserved, **unblocked** | `HeaderView`/`FooterView` de-hybrid; "migrated" = mechanism-only (owner 2026-07-29). |
| 676 | reserved (675 §8) | `globals.css` stale hex comments. |
| 677 | reserved (675 §8) | Pre-existing `<div>`-in-`<p>` warning. |
| 678 | reserved (675 §8) | 14-width matrix enrolment — `MANTINE_VIEWPORTS` is only 4 widths (`check-stories-rendered.mjs:392`). **Fold in 699's gap:** `HowItWorksSteps/Default` + `HomepageListingGrids/Default` top out at 1024, so `xxl` ≥1440 is unproven for 2 of the 5 heading sites. |
| 679 | reserved (675 §8) | `usePropertyTypes` fallback localization — the cause behind 671/675's `NOT VERIFIABLE` R13. |
| 680 | reserved (675 §8) | `check:locale-leak` lowercase blind spot. |
| 682 | reserved (681) | Drop `sonner` + `next-themes` from `package.json` — the sole `src/` consumer died with 681. |
| 683 | reserved (672) | TailAdmin bottom-nav conformance slice — no reference row exists yet. |
| 687 | reserved | Enrol `Admin/AdminUsersTable` into the `--mantine-only` rendered manifest (+16 cells on a hard-blocking gate → own blast radius). |
| 689 | reserved | Section-heading `fz` tokenisation — **likely closed by 699**, see the owner item above. |
| 691 | **KICKOFF FILED, Q3** | `MantineListingCardPattern.tsx` de-Tailwind, 25 sites. See "Active queue". |
| 694 | reserved | Alias `--overlay`/`--overlay-foreground` → `var(--mantine-color-black/white)` per the 660/661 no-second-hand-authored-source convention (`globals.css:311-315`); Mantine already emits both (bundle-verified). Runnable now, but NOT foldable into 693 — it changes the value expression AC1/AC5 compare on. |
| 695 | reserved | **De-Tailwind exit condition for the overlay pair:** delete the `@theme inline` `--overlay*` copy **and** the `--color-overlay*` namespace once the last `bg-overlay*`/`text-overlay-foreground*` utility is gone (33 today across 8 files: `MantineListingCardPattern` 6, `PerfDevOverlay` 10, `ListingGallery` 5, `LightboxView` 4, `MantineListingGalleryPattern` 3, `ImageUpload` 3, `AdminUserAvatar` 1). **Must UPDATE 692's gate, not delete it.** Also folds in 692's F1 `P3` (brace counting doesn't skip comments) and 662's F2 `P3` (`MantineHomeSection.tsx` still imports `cn()`). Blocked on 691 + the remaining slices — must not become an implicit "someday". |
| 700 | reserved | The **general** `@theme`-dependency gate: fail when any `.module.css` consumes an `@theme` var whose last Tailwind-utility consumer disappears. Repository-wide scan, own blast radius. |
| 702 | reserved | `ListingCard.tsx` de-Tailwind (8 sites: icon sizing + `shadow-sm`); marker classes stay verbatim. |
| 706 | **next free** | — |

**Follow-up candidates (flagged in review, no number yet):** `check-homepage-grid.mjs` calls `emulateMedia` at none of its 3 page-creation sites (704/705 F1 `P3`) — **assessed harmless, do not escalate**: that gate measures layout only (`gridTemplateColumns`, `gap`, child count, `scrollWidth`, header geometry) and an opacity animation does not move layout; the sole theoretical vector, a `transition` on a layout property caught mid-flight, pre-dates 705. Fold it in at the next touch of the file, for consistency not correctness · the `ListingCard`/`HomepageListingGrids` **live relative-date fixture** ("Jul 27"→"Jul 28") will spuriously flag on every future Q3 re-capture taken on a different calendar day · add `TextInput/Default`, `MobileBottomNavView` (uk) and `PopularLocationsView/Long City Name` (sq@390) to the `docs/storybook-governance.md` §8.1 noise catalog · no regression test exists for `check:mojibake` (666 F1 `P3`).

## Reserved / deferred / retired

- Reserved (epics): 310, 311, 313 (Epic HH), 453 (Epic KK.2).
- Deferred (no #): **I.3** listing-status helper API `(status) → (listing)` — `docs/domain-rules.md` → "Future ListingStateMachine evolution trigger".
- Not plain numbers: **622/623** — `Q0R` and `623R` are lettered IDs outside the numeric sequence. **628** reserved for the SB10 lint-debt fix (627 follow-up).
- Retired (never reuse): 465 (uk→ua migration, cancelled); 466/467/469–481 (legacy-primitive layout, superseded by the Mantine migration); 534 (superseded+closed by 535); 597/604 (superseded by 598/605); 655 (incorrectly-created task-design defect, no code shipped — superseded+reverted by 656).

## Active Epics — open (closed epics → archive)

| Epic | Status | Plan |
|---|---|---|
| **HH — Admin UX System** | OPEN — 310 (P4), 311 (P5 partial), 313 (P6, blocked on owner DB sign-off); 308/309 re-scope onto canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) |
| **BB — Listing Inquiries: Report & Message** | ⏸️ ON HOLD — Task 463 held until Epic MM primitives complete; earlier BB tasks (242/243/430/435/458–462) done | [`Epic_BB_…`](../tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md) |
| **II — Global i18n Hardening** | Implemented + reviewed (316–323); committed + pushed | [`Epic_II_…`](../tasks/Epics/Epic_II_Global_i18n_Hardening.md) |
| **KK — Admin Data Freshness** | 452 (KK.1) done; 453 (KK.2) reserved for remaining managers | [`Epic_KK_…`](../tasks/Epics/Epic_KK_Admin_Data_Freshness.md) |
| **MM — Mantine/TailAdmin Restyle** | IN PROGRESS — Sprints 37–44 landed + pushed (form controls, overlays, TailAdmin conformance, Combobox/DatePicker family, Header/app-shell decomposition, listing card/detail). Next primitives per tracker | [`Epic_MM_…`](../tasks/Epics/Epic_MM_Mantine_UI_Migration.md) · tracker `docs/mantine-tailadmin-migration-tracker.md` |

## Standing notes

> **Standing decisions currently binding (full derivation in the ledger rows):** **D26** (2026-07-31, `docs/storybook-governance.md` §14.11) — a sub-perceptual rasterisation delta **≤2/255** is a standing attribution path, **superseding D17's ≤1/255**, only under 4 conjunctive conditions (full attribution · 0 FAIL + 0 verdict changes · identical assertion payloads after stripping random Mantine IDs · a same-tree stability control). It is **not** a general exemption for visual changes and **not** a ceiling on the separate §8.1 documented-noise path. **D19** — the overlay pair is declared in **both** `@theme inline` and `:root`; the `@theme` copy is **transitional with a named expiry** (694 → 695). **D25** — the frozen Storybook preview clock. **D27** — Skeleton `::after` fill = gray-3 `#d0d5dd`, token not hex.
>
> **Recurring orchestrator failure mode, worth re-reading before writing any kickoff (M1 · M2 · M4 · M5):** four separate blocked/revised tasks all failed the same way — the *fix* was right and the *control* was incapable of detecting its own effect. M2: an AC set that proved nothing broke but never proved the objective. M4: a plant whose subject had unremovable lifelines, so the negative arm could never return `ABSENT`. M1/M5: the right mechanism queried the wrong way (a value quoted in the evidence block and then contradicted; the CSS *variable name* grepped instead of the *utility candidate*). Every kickoff needs a **two-armed plant that can demonstrably fail**, and a **pre-plant census proving no further lifeline**.

> **Frozen/deferred (reviewed 2026-06-05):** Sprint 28 admin-mobile 308/309 must be re-scoped onto the DS + canonical primitives before resuming; Epic HH P4/P5/P6 per the table above; I.3 deferred (valid). Every open task consumes the global Design System (`docs/design-system.md`, Task 340) wherever UI/responsive/overlay is touched, and since the Mantine freeze (Task 482) new UI uses Mantine (`docs/mantine-responsive-design-system.md`); `docs/rule-index.md` sets the per-task pre-read.

> **🟡 Console NOISE (not bugs — do not re-triage as P0):** `[PRED] … preloaded`, `[LCP] … route`, `[Vercel Speed Insights] debug`, "speculation rule set … will be ignored", Turbopack dev-only CSS-chunk/`*.woff2` preload warnings — all dev/debug artifacts, gone in prod. OpenTelemetry `import-in-the-middle` resolved by Task 450 (`322c5d599`); Cloudinary LCP "preloaded but not used" by Task 437. A stale Turbopack `next dev` HMR cache can emit a one-off React `useId` `mantine-_R_…-target` hydration error that does NOT survive a clean `next build` + fresh dev restart and does NOT reproduce in prod — re-verify with `check:hydration` against a freshly restarted server before triaging any `_R_` id mismatch as a code bug (Task 582).

> **Commit emission policy:** the orchestrator emits explicit-path `git add`/`git commit` per task at review time (never `-A`/`-u`/wildcards, never pre-staged batches); the owner runs them in PowerShell. Before emitting, reconcile `git status --short` + the real diff + the session `Files Changed` table (STATUS/REPORT MISMATCH gate). Each commit is reconstructable from the session log.

> **Acknowledged advisor exceptions** (intentional, no task): `pg_net in public` (deferred); `email_change_tokens` RLS-enabled-no-policy — see `docs/rls-rules.md` → "Acknowledged Advisor Exceptions".

> **Standing governance:** `ai-behavior.md` Notes 18–23 + `agent-contract.md` (P0, clauses 1–15) + `rule-index.md` (task-type pre-reads) + the Positive/Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task. **`npm run build` exit 0 is mandatory for non-Q0** (`67340ff49`).

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)** — one ledger row per closed task, newest first.
