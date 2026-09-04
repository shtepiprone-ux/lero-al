# Task 787 — global header Mantine migration, bottom-bar removal, and guest gating

**Sprint:** 70 (new) · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-04 · **State:** `KICKOFF FILED`

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception: **no review
ledger**.

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **site-chrome migration + navigation consolidation + auth-gated
visibility**, across the header chain rendered on every `/[locale]` page.

## 2. Objective — three owner requirements

1. **Migrate the header chain to Mantine globally.** Remove the remaining Tailwind `className` usage from the
   header/nav components in favour of Mantine primitives and the canonical theme.
2. **Delete the fixed mobile bottom bar.** On mobile, navigation lives in the burger menu only.
3. **Hide "Add listing" and "Favorites" from unauthenticated users, everywhere** — mobile *and* desktop
   (owner decision, 2026-09-04).

**Owner's mobile top bar contract, verbatim (2026-09-04):** *"Лого + бургер + сповіщення (видима для
авторизованих користувачів) + Обране (має знаходитись не по центру плашки, а біля бургер кнопки)."*

So the mobile top bar keeps: **logo** (left) and, grouped **beside the burger** (right): **notifications**
(authenticated only), **Favorites** (authenticated only — guests never see it per requirement 3), **burger**.
Favorites must **not** be centred in the bar.

## 3. Verified context — read at source before this kickoff, do not re-derive

### 3.1 The header chain as it stands

| File | Lines | Component kind | `className=` | Role |
|---|---|---|---|---|
| `src/components/layout/Header.tsx` | 76 | **client** | 0 | container; owns `useUser()`, passes `isAuthenticated={!!user}` |
| `src/components/layout/HeaderView.tsx` | 199 | **client** | **10** | the bar: logo, desktop nav (`visibleFrom="md"`), right cluster |
| `src/components/layout/HeaderActions.tsx` | 63 | **client** | 0 | already Mantine; favourites + notification slot + guest login/register |
| `src/components/layout/MobileNavDrawer.tsx` | 140 | **client** | **6** | the burger menu |
| `src/components/layout/MobileBottomNav.tsx` | 29 | **client** | 0 | container for the bar being deleted |
| `src/components/layout/MobileBottomNavView.tsx` | 94 | **client** | **11** | the bar being deleted |

Both `<Header />` and `<MobileBottomNav />` are rendered by **`src/app/[locale]/layout.tsx`** (lines 49 and 55).

`FACT`: every file in the chain is already a **client** component. `layout.tsx` is a **Server Component** — see §3.4.

### 3.2 Requirement 3 is already satisfied in one place and violated in two

- **`MobileNavDrawer` already gates correctly.** Its authenticated branch holds profile / my-listings / favorites /
  add-listing; its guest branch holds login / register / register-agent. **Do not "fix" it** — verify and leave.
- **`MobileBottomNavView` violates it**: the add-listing FAB (`:46-53`) renders with **no** `isAuthenticated`
  guard, and favourites renders for guests via `onRequireAuth`. Requirement 2 deletes this file, so requirement 3
  is satisfied here by deletion, not by editing.
- **`HeaderActions` violates it on desktop**: `:26` is `isAuthenticated ? <favourites link> : <guest branch>`, and
  the guest branch currently shows a Favorites heart that opens the auth sheet. Per the owner's "скрізь", **that
  guest heart is removed.** Guests keep login/register only.

### 3.3 ⚠️ The bottom bar's height is load-bearing in three other files

`globals.css:141` reads `--space-14: 3.5rem; /* 56px — bottom-nav height */`. The bar is
`position: fixed; bottom: 0; height: var(--homepage-runtime-space-14)`, and
`MobileBottomNavView.module.css:48-51` states the coupling explicitly: *"the bar-height / clearance-padding
coupling … equal by construction, confirmed I1: bar height 56px == `--space-14`"*.

**Two consumers reserve that 56px and must be updated in the same change, or every mobile page keeps 56px of dead
space at the bottom:**

| File | Line | Current |
|---|---|---|
| `src/app/[locale]/layout.tsx` | 51 | `<Box component="main" mih="calc(100vh - 4rem)" pb={{ base: 'var(--homepage-runtime-space-14)', md: 0 }}>` |
| `src/components/layout/FooterView.module.css` | 35 | `padding-bottom: var(--homepage-runtime-space-14)` (with `md` → 0 at `:38-42`) |

Leave `--space-14` itself defined — other things may use it — but **re-verify** and update its comment if it stops
being the bottom-nav height. Measure both consumers rendered before and after.

### 3.4 ⚠️ The failure that took production down today — do not repeat it

Task 784 added `useMantineTheme()` to `FooterView.tsx`, a **Server Component**. Calling a React hook during the
Server Components render threw on **every** `/[locale]` request and took `lero.al` down. **Every gate passed:**
`/[locale]` is a `ƒ` dynamic route so `next build` never rendered it; `tsc` types hooks as valid anywhere; `eslint`
has no such rule; and Storybook renders every component as a client component, so 31 browser checks were green.

This task edits `layout.tsx` — **a Server Component** — and the whole chain it renders. Therefore:

- **Never add a hook to a file without `'use client'`.** For theme values in a Server Component use the direct
  `import { theme } from '@/design-system/mantine/theme'` and `theme.other!.…`, the pattern
  `PopularLocationsView.tsx` uses and documents.
- **A green `npm run build` does not cover `/[locale]`.** §7 therefore requires a real `next start` request.

Task **786** (reserved) will build the detector for this class; until it exists, §7's smoke request is the control.

### 3.5 ⚠️ Deleting a component leaves live references that no gate sees

Task 782's **F4**: `FilterMultiToggle.tsx` was deleted and live references survived in
`docs/critical-flow-registry.md`, `docs/component-catalog.md`, `docs/component-coverage-matrix.md` and
`docs/storybook-governance.md` — and **`npm run governance:components` passed anyway**, because it checks only
three named files plus doc presence and cannot see a stale catalog row. **A green gate does not close this.**

`MobileBottomNav`/`MobileBottomNavView` is referenced by at least: `scripts/mantine-migration-scope.json`
(manifest entry), `src/stories/mantine/primitives/MobileBottomNavView.stories.tsx` (canonical story),
`src/components/layout/__tests__/mobileBottomNav.smoke.test.tsx`, `docs/component-catalog.md`,
`docs/component-coverage-matrix.md`, `docs/component-risk-register.md`, `docs/design-system.md`,
`docs/mantine-responsive-design-system.md`, `docs/storybook-governance.md`, `docs/ui-audit.md`,
`docs/performance.md`. **Re-run the census at execution; this list is a starting point, not an authority.**

Its `.module.css` also carries `design-tokens-allow` markers (`z-index: 30`, three `box-shadow` components).
Deleting the file deletes the markers — confirm `check:design-tokens` reports **zero stale markers** afterwards.

## 4. Scope

**Included:** the six files in §3.1; `src/app/[locale]/layout.tsx`'s render and clearance padding;
`FooterView.module.css`'s clearance; deletion of the bottom-nav files, its story, its smoke test and every stale
reference; the canonical Mantine stories for the migrated header/drawer; manifest and catalog/coverage updates.

**Excluded:** `AdminMobileHeader`/`AdminPageHeader` and everything under `/admin`; `MantinePageHeaderWithActions`
(a page-title block, not site chrome); the auth sheet's own contents; routes, queries, server actions; the deferred
bare-pattern gutters; any new theme value, breakpoint or token — the header's needs are already expressible.

## 5. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | The header chain carries **zero** Tailwind `className` dimension/layout utilities; layout comes from Mantine primitives and existing theme contracts. Module CSS may remain only where it already exists and is not a dimension literal. | P0 | AC1 |
| **R2** | The fixed mobile bottom bar is **deleted** — component, view, module CSS, story, smoke test, manifest entry — and no live reference to it remains anywhere in `src/`, `scripts/` or `docs/`. | P0 | AC2 |
| **R3** | Both 56px clearance reservations (§3.3) are removed together with the bar; no mobile page gains or keeps dead bottom space. | P0 | AC3 |
| **R4** | On mobile the top bar shows **logo** plus, grouped **beside the burger**: notifications (authenticated only), Favorites (authenticated only), burger. Favorites is **not** centred. All navigation destinations remain reachable from the burger menu. | P0 | AC4 |
| **R5** | **Guests never see "Add listing" or "Favorites"** — mobile or desktop. `HeaderActions`' guest Favorites heart is removed; guests keep login/register. `MobileNavDrawer`'s existing gating is preserved unchanged. | P0 | AC5 |
| **R6** | No hook is called in any file lacking `'use client'`. `layout.tsx` remains a Server Component. | P0 | AC6 |
| **R7** | No new theme value, breakpoint, token, `design-tokens-allow` marker or allowlist entry; scoped detector stays 0 and the global finding set is unchanged except for findings **removed** with the deleted file. | P0 | AC7 |
| **R8** | Authenticated navigation loses nothing: every destination reachable before (home, listings, favorites, profile, my listings, add listing, logout) is still reachable on mobile. | P0 | AC8 |

## 6. Acceptance criteria

- **AC1** — `grep -rnE 'className=' ` across the five surviving chain files returns only module-CSS references, none carrying a dimension literal; `check:design-tokens --scope=mantine` → 0.
- **AC2** — the four bottom-nav files are gone; `grep -rn "MobileBottomNav" src/ scripts/ docs/` returns only historical session-log/archive prose, never a live import, manifest entry, catalog row, coverage row or governance row. **Enumerate every hit and classify each as historical or live.**
- **AC3** — rendered proof at 375: total document height has no unexplained 56px tail; `layout.tsx`'s `main` and the footer both measured before and after, with the delta equal to the removed reservation.
- **AC4** — rendered proof at 375 and 768 for an **authenticated** fixture: logo at the row start; notifications, Favorites and burger adjacent at the row end, with Favorites' right edge within one gap of the burger's left edge (assert the measured gap, don't eyeball it).
- **AC5** — rendered proof at 375 and 1280 for a **guest** fixture: zero elements with the add-listing or favourites accessible name anywhere in the header chain; login/register still present. Repeat for the drawer opened.
- **AC6** — every file touched either carries `'use client'` or calls no hook; verified by grep, plus AC9's live request.
- **AC7** — `theme.ts` untouched; no marker/allowlist text added; `check:design-tokens` global finding set differs from Task 784's baseline **only** by findings inside the deleted file, each named.
- **AC8** — the drawer is opened in a rendered test and every destination in §3.2's authenticated list is present and links to the right href.
- **AC9** — **`npm run build` then `npm run start`, then a real request to `/sq` and `/sq/listings`, both returning 200 with the header present in the HTML.** This is the control §3.4 exists for; a green build alone does **not** satisfy it.

## 7. Verification plan — Windows-native PowerShell only

```powershell
node.exe -p process.platform
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run governance:components
npx.cmd vitest run src/components/layout/__tests__
npm.cmd run build-storybook
node scripts/task787-header-evidence.mjs
npm.cmd run build
npm.cmd run start        # then request /sq and /sq/listings — AC9
```

Build the evidence script on the shape of `scripts/task785-inert-media-evidence.mjs`: static server over
`storybook-static`, named per-check records, expectations read from `theme.ts` at runtime, `results.json` plus
screenshots retained under `docs/sessions/evidence/task787/`. Record working directory, exact command and real
exit code for each (read `EXIT_CODE` from inside the log, never a wrapper's).

**`OWNER VISUAL QA REQUIRED`** — this changes site chrome on every page, for two different auth states:

| Story / surface | State | Locale | Viewport |
|---|---|---|---|
| Header + drawer | guest | en, uk | 375, 768, 1280 |
| Header + drawer | authenticated | en, uk | 375, 768, 1280 |
| Any page bottom (clearance) | either | en | 375 |

## 8. Completion report contract

Files changed and **files deleted** · requirement IDs · the §3.5 reference census with each hit classified ·
before/after clearance measurements · commands run with real exit codes · the AC9 request transcripts ·
`results.json` · assumptions · deviations · known limitations · anything left open.

## 9. Task quality gate

| Question | Required answer |
|---|---|
| Can this pass while `/[locale]` is broken? | **No** — AC9 requires a real request, because today's outage proved a green build cannot see that route. |
| Can a hook reach a Server Component? | No — R6/AC6, plus §3.4's named pattern for theme values. |
| Does deleting the bar leave dead space? | No — R3/AC3 names both clearance consumers and measures them. |
| Does deleting the bar leave stale references? | No — AC2 requires an enumerated census, per 782's F4 where a green gate missed exactly this. |
| Is the guest change complete? | Yes — R5 covers mobile *and* desktop, per the owner's "скрізь". |
| Does an authenticated user lose a destination? | No — R8/AC8 asserts each one in the opened drawer. |
