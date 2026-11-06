# Sprint 35 — Task 410 — Admin Storybook render harness (mocked admin state) — makes admin surfaces rendered-assertable

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> **Approach DECIDED by owner (2026-06-08): A — Admin Storybook + mocked admin session/data.** Playwright e2e + seeded
> admin is **OUT of scope** here; register it as a future follow-up ONLY if route-level gaps remain after this harness.
> This task supersedes the Part-2 stub in `Sprint_35_Task_406_proof_addendum_and_Task_410_admin_render_harness.md`.
>
> **Why:** `screenshots:assert` renders **Storybook only**, so the admin surfaces (where Task 406's 49 token hits live, in
> unstoried admin components) cannot be rendered-proven and the mobile <640 gate (clauses 11–12) is unverifiable for admin
> UI. This harness adds Storybook stories with mocked admin state so the existing `screenshots:assert` pipeline produces a
> deterministic `sq/en/uk/it × canonical-breakpoints` matrix for admin components. **It also produces the artifacts that
> close the Task 406 rendered-coverage addendum (renderable subset).**

```
Type:        Tooling / test-harness — Storybook stories + fixtures + mocks ONLY. NOT product code.
Priority:    MEDIUM-HIGH — unblocks rendered proof for admin UI (Task 406 addendum + all future admin UI tasks).
Depends on:  406 token milestone (committed 8209a311c). Independent of 408/407 (no code overlap).
Area:        src/stories/** (new admin stories + fixtures/mocks/decorators) +
             .storybook/** ONLY if a mock provider/decorator must be registered globally (minimal, justified) +
             scripts/** ONLY if generalizing the computed-proof utility is actually needed (see §Computed-proof utility) +
             docs/storybook-governance.md / docs/component-coverage-matrix.md / scripts/story-coverage-exempt.json
             (remove now-storied admin components from the exempt list) + docs/backlog.md + docs/sessions/.
NON-goal:    ANY change to admin product components/routes (src/components/admin/**, src/app/admin/**), to auth, RLS, or
             data access. No Playwright / e2e / real DB / seeded admin. No visual redesign. No new design tokens.
             If an admin component cannot be storied without refactoring product code → STOP & ASK; record as a gap,
             do NOT refactor the component.
```

## What "done" looks like
Every admin component that carried a Task 406 token hit has a Storybook story that:
- renders with **mocked admin session/role + mocked Supabase/data fixtures** (no real network, deterministic),
- is **full-width / `layout:'fullscreen'` via the global `withCanvas` decorator** (NEVER `layout:'centered'|'padded'` — that
  silently defeats `max-sm:w-full`, the Sprint 32 trap, agent-contract clause 13b),
- passes `screenshots:assert` (PNG/JSON) across the canonical breakpoints × `sq/en/uk/it`, **uk@320/375/390 mandatory**,
- passes `check:stories` (no hardcoded strings — all visible text + `aria-label` via `t()`/`storyT()` with full 4-locale
  parity; no `/Ukrainian/` export; one toolbar-reactive `LocaleStress`; no raw `<button>/<input>/<select>/<textarea>`),
- is removed from `scripts/story-coverage-exempt.json` (Task 398 `check:story-coverage` gate now satisfied for it).

## Target admin components (the Task 406 hit surfaces — 16)
`AdminTable` · `AdminCompaniesManager` · `AdminCurrenciesManager` · `AdminEmailTemplatesManager` ·
`AdminExchangeProvidersManager` · `AdminListingsTable` · `AdminLocaleSwitcher` · `AdminMobileHeader` ·
`AdminPropertyTypesManager` · `AdminSettings` · `AdminSidebar` · `AdminSupportManager` · `AdminUserAvatar` ·
`AdminUserProfile` · `AdminUsersTable` · `StatusChangeControl`.

> **Triage first (paste the result in the session log).** For EACH of the 16, classify before building:
> - **(S) Storyable as-is** — pure/presentational or driven by props/context that a decorator can supply → write the story.
> - **(M) Storyable with a mock** — needs session/role/Supabase data → supply via a mock provider/decorator + fixture.
> - **(G) Gap** — server-only RSC or tightly coupled to live data/auth such that it cannot be storied WITHOUT refactoring
>   product code → **STOP & ASK**, record as a Task-410 GAP → candidate for the future Playwright follow-up. Do NOT
>   refactor the component to make it storyable.
> The split (S/M/G counts) is part of the deliverable; G surfaces are an accepted, documented outcome, not a failure.

## Mocking strategy (deterministic, no real network)
- **Session/role:** a decorator (or per-story param) supplying a mocked admin session/user with the role the component
  expects. If components read session via a hook/context, wrap with a mock provider; if via props, pass fixtures.
- **Data:** typed fixtures for the lists/records each manager renders (companies, currencies, email templates, exchange
  providers, listings, property types, users, support tickets, user profile). Keep fixtures SMALL but representative
  (include the edge content that exercises the swapped utilities: long names → truncation `max-w-*`; badges/counters →
  `text-2xs`; sticky table columns → `z-[1]/z-[2]`; textareas → `min-h-*`).
- **No hardcoded strings (clause 13):** fixture display strings and story copy come from `t()`/`storyT()` against a
  namespace with full `sq/en/uk/it` parity. IDs/emails/dates that are inherently data may be literal fixture values, but
  any USER-FACING label/aria string must be translatable. If a realistic fixture needs a localized label set, add the keys
  with 4-locale parity.
- **Determinism:** no `Date.now()`/random in fixtures (freeze dates); same render every run so `screenshots:assert` is
  stable.

## Coverage requirements (MANDATORY)
- Matrix per storied admin surface: `sq/en/uk/it` × `320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560`.
  **uk@320/375/390 are mandatory stress cells.** Produced by `screenshots:assert` (whatever viewport subset it renders) +
  supplemental shots if assert's viewport set is reduced.
- **Mobile <640 full-width gate is the headline deliverable:** the stories must make it *visible and assertable* that admin
  toolbars/tables/managers, `AdminSidebar`, `AdminMobileHeader`, `StatusChangeControl` controls are **full-width at <640**
  with ≥44px targets and wrapping labels — i.e. `withCanvas`/`fullscreen`, never `centered`. A story that renders the admin
  surface content-width/centered at <640 defeats the purpose and is a FAIL.

## Computed-proof utility (`scripts/task404-computed-proof.mjs`) — conditional
- The untracked `scripts/task404-computed-proof.mjs` does `getComputedStyle` proof via the live dev server. **Use it in
  Task 410 ONLY if the harness/proof pipeline actually needs computed-style evidence beyond the rendered PNGs.** If used:
  **rename/generalize** it to a neutral reusable tool (e.g. `scripts/computed-style-proof.mjs`), strip the task404-specific
  framing, document its use-case in a header + `docs/`, and commit it as a `chore`/tooling addition (NOT as a
  task404-specific script).
- If Task 410 does NOT need it, **leave it untracked** — do not commit it here; its disposition is a separate later chore.

## Positive flow
1. Triage the 16 admin components into S/M/G (paste the table). For G, STOP & ASK + record the gap; proceed with S+M.
2. Build a reusable **mock admin provider/decorator** + typed fixtures (localized labels via `t()`/`storyT()`).
3. Write one story per S/M component using the global `withCanvas` (`layout:'fullscreen'`) + a single `LocaleStress`
   (toolbar-reactive locale, NOT a pinned `globals:{locale:'uk'}`); seed edge content that exercises the 406 swaps.
4. Remove each newly-storied component from `scripts/story-coverage-exempt.json`.
5. Run `npm run check:stories` (green: no hardcode, no centered layout, no `/Ukrainian/`, no raw elements),
   `npm run check:story-coverage` (green: storied components no longer exempt), `npm run check:i18n` (4-locale parity).
6. Run `npm run screenshots:assert` → 0-FAIL including the new admin stories; capture the uk@320/375/390 + a ≥1024 desktop
   cells per admin surface (these are the artifacts that close the Task 406 rendered-coverage addendum, renderable subset).
7. `npx tsc --noEmit` → 0; `npm run lint` → 0 new; NATIVE `check:file-integrity` on all touched files (0 NUL/no BOM —
   remember the sandbox mount produces phantom NUL; native is authoritative).
8. (If used) generalize the computed-proof script per §Computed-proof utility.
9. Update `docs/backlog.md` + session log: S/M/G triage table, the new stories list, exempt-list removals, the gate
   transcripts, the `screenshots:assert` result, the admin rendered matrix (with the 406-addendum cells called out), and
   any G gaps registered for the future Playwright follow-up. **No `git add`/`commit` from the executor** (Files-Changed
   table only; orchestrator emits commits at review).

## Negative flow (must be handled, not skipped)
- **Component needs real session/RSC/live data and can't be mocked without product-code changes** → STOP & ASK; register
  as a GAP (future Playwright follow-up). Do NOT refactor the admin component to force storyability.
- **Mock introduces a hardcoded user-facing string** → `check:stories` FAILS → fix by routing through `t()`/`storyT()`
  with 4-locale parity (do not weaken/relax the gate).
- **Locale not actually switching** (pinned/`/Ukrainian/` export) → `check:stories` FAILS → use one toolbar-reactive
  `LocaleStress`.
- **Story renders centered/content-width at <640** (`layout:'centered'|'padded'` or a fixed-width wrapper) → defeats the
  mobile gate → FAIL; switch to `withCanvas`/`fullscreen`.
- **`screenshots:assert` FAILs** (overflow at 320, clipped label, non-full-width control) → if the fixture/story is at
  fault, fix the story; if it reflects a REAL defect in the committed admin component, STOP & ASK and open a separate fix
  task — do NOT edit the committed Task 406 code inside this harness task.
- **Non-deterministic render** (dates/random) → freeze fixtures so assert is stable.

## Acceptance criteria (machine-proven)
- S/M/G triage table present for all 16; every S/M component has a story; every G gap documented + registered as the
  Playwright follow-up candidate (STOP & ASK recorded).
- Every new admin story uses `withCanvas`/`layout:'fullscreen'`, one `LocaleStress`, no `/Ukrainian/`, no raw elements,
  no hardcoded user-facing strings (4-locale parity) — proven by green `check:stories` + `check:i18n`.
- Storied components removed from `scripts/story-coverage-exempt.json`; `check:story-coverage` green.
- `screenshots:assert` 0-FAIL including new admin stories; uk@320/375/390 + ≥1024 desktop cells captured per admin
  surface; mobile <640 full-width visibly confirmed in the PNGs (not centered).
- The Task 406 rendered-coverage addendum (renderable subset) is satisfiable from these artifacts — explicitly cross-list
  which 406 admin surfaces are now rendered-proven vs still GAP.
- `tsc=0`, `lint=0 new`, NATIVE `check:file-integrity` green; NO change to any admin product component/route/auth/RLS/data.
- (If computed-proof script used) generalized + documented + committed as chore; else left untracked, uncommitted.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff.

## Pre-read (mandatory — Storybook + Admin bundles, per `docs/rule-index.md`)
- `docs/agent-contract.md` (1–14) · `docs/rule-index.md` · `docs/backlog.md`
- `docs/storybook-governance.md` (§14 no-hardcode + `withCanvas`/fullscreen + LocaleStress) · `docs/storybook-visual-snapshots.md`
- `docs/responsive-screenshot-governance.md` · `docs/responsive-screenshot-matrix.md`
- `docs/component-governance.md` (§11 canonical `AdminTableRow`) · `docs/component-rules.md` · `docs/component-coverage-matrix.md`
- `docs/design-system.md` (§12a/§12b mobile contract; §9 admin layout) · `docs/qa-rules.md`
- `scripts/check-stories.mjs` · `scripts/check-story-coverage.mjs` · `scripts/story-coverage-exempt.json` ·
  `scripts/check-stories-rendered.mjs` (`screenshots:assert`) · existing `src/stories/StoryListingCard.tsx` + the
  committed Task 406 admin diffs (pattern reference) · `scripts/task404-computed-proof.mjs` (only if generalizing)

## Out of scope
- Playwright / e2e / seeded test admin / real DB (future follow-up ONLY for route-level gaps that remain after this
  harness). Any change to admin product components, routes, auth, RLS, data access. New design tokens. Visual redesign.
  Detector hardening (Task 408) / strict flip (Task 407). Re-editing the committed Task 406 refactor.

> **Sequencing.** Owner directive 2026-06-08: **410 first, then 408.** After 410 lands, the JJ critical path resumes at
> **408 → 407**; the Task 406 rendered addendum is produced from 410's artifacts (renderable subset), gaps → Playwright
> follow-up.
