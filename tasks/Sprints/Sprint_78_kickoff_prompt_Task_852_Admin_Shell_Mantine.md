# Task 852 — the admin shell leaves Tailwind and shadcn: `AdminShell`, `AdminSidebar`, `AdminHeader` (was `AdminMobileHeader`), `AdminLocaleSwitcher` on an extended `MantineAppShellFoundation`

Sprint 78 · P1 · QA profile **Q3** (page shell + navigation) · Wave C, before 853 · independent of Wave A/B ·
**Status: 🟡 PARTIALLY VERIFIED 2026-09-26 (review 6 — code and evidence accepted; pending the owner Storybook pass, §21)**

> **Revised 2026-09-25 (864's finding, applied before execution):** every `git grep` command in this file now
> carries `--untracked`. Without it `git grep` reads only the index, so a "prints nothing" check over files this task
> **creates** passes whatever they contain (measured on 848: 0 hits without the flag, 3 with it). `--untracked` also
> searches tracked files, so no check lost coverage.

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). Spec v3.3 §17.1: *"Desktop
від 1280 px: існуюча бічна навігація шириною 240 px, верхня панель висотою 72 px … Не змінювати IA існуючого sidebar
заради Dashboard. 1024–1279 px: sidebar може collapse до icon rail … 768–1023 px: sidebar лише drawer"*. Clause 16d:
`/admin` renders inside this shell, so the shell is in the dashboard's census.

## 1. Mode and task type

`IMPLEMENTATION` — migrate a legacy page shell and navigation to Mantine by extending the existing canonical
`MantineAppShellFoundation`, then compose it. Bundles: **UI / Current Mantine path** + **Storybook / Visual Proof** +
**Admin Table / Admin Control** (navigation preservation).

## 2. Objective

Every admin page renders inside a Mantine `AppShell`. It has a 240px navbar at ≥ 1024px and a drawer below 1024px,
opened by a burger in a 72px top bar present at **all** widths. The navigation IA is unchanged: the same groups,
items, order, active-state logic, locale switcher, "open site" link and logout. The top bar shows the current page
title and, below 1024px, the brand. Four legacy components become Mantine, each with its own Story and a manifest
entry. `MantineAppShellFoundation` gains the slots and tokens it needs, and loses its hardcoded `240`/`60`. The four
legacy Stories that duplicate the new canonical ones are deleted, with every downstream reference updated.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

### 3.1 The shell today

- `src/app/admin/layout.tsx` (server) renders `<AdminShell siteName locale>{children}</AdminShell>` inside
  `NextIntlClientProvider`, after the admin/moderator gate.
- `AdminShell.tsx` (26 ln, `'use client'`): `usePresence()`, `useAdminPageFreshness()`, `mobileOpen` state;
  `div.admin-shell flex min-h-screen bg-muted/30` → `AdminSidebar` + column (`AdminMobileHeader` + `main.flex-1 overflow-auto`).
- `AdminSidebar.tsx` (192 ln):
  - desktop `aside.hidden lg:flex w-60 … sticky`; mobile shadcn `Sheet side="left" w-64`;
  - 4 groups (overview: Dashboard · management: Listings, Users, Support, Inquiries-support, Inquiries-sales, Reports ·
    content: Locations, Popular locations, Companies, Pages, Property types, Currency, Email templates, Footer ·
    system: Settings, Permissions);
  - `isActive` = exact match for `/admin`, `startsWith` otherwise;
  - the header wordmark splits `siteName` on `.` + an "Admin" chip;
  - the footer holds `AdminLocaleSwitcher`, an "open site" link (`target="_blank"`) and a logout `Button`
    (`signOut()` then `router.push('/')`);
  - `data-testid="admin-sidebar"`; 23 `className`; imports shadcn `Button`, `Sheet`, `SheetContent`.
- `AdminMobileHeader.tsx` (~62 ln): `lg:hidden sticky … min-h-14`; a burger shadcn `Button` (`aria-label` from
  `admin.mobile_header.aria_open`); the brand; a `PAGE_TITLES` map keyed by exact pathname (it contains
  `'/admin/pages-admin'`, which is **not** a real route — the route is `/admin/pages`; preserved as-is, see §5);
  `data-testid="admin-mobile-header"`.
- `AdminLocaleSwitcher.tsx` (37 ln): a label + the shared `LocaleSwitcher` with Tailwind `className="w-full
  justify-start gap-1.5"`; `setAdminLocale` + `router.refresh()`; `data-testid="admin-locale-switcher"`.
- `LocaleSwitcher.tsx` (shared, tier 3): props `onSwitch`, `isPending`, `showLabel`, `className`; own canonical Story
  `Mantine/Primitives/LocaleSwitcher`; not in the manifest; also rendered by the public header.

### 3.2 Census (`node.exe scripts\check-surface-census.mjs --surface src\components\admin\AdminShell.tsx`, 2026-09-18)

9 nodes: `AdminShell` (className 3), `AdminMobileHeader` (8, ui-imports 1), `AdminSidebar` (23, ui-imports 3),
`AdminLocaleSwitcher` (4) — all tier 1, `manifest:no story:no`; `ui/button.tsx`, `ui/sheet.tsx` — tier 2;
`LocaleSwitcher` — tier 1 shared, `manifest:no story:yes`; `MantineDropdownMenu`, `responsiveBottomSheet` — enrolled + storied.
Baseline rows keyed `src/app/admin/layout.tsx :: …` (`scripts/surface-census-baseline.json`): the layout itself,
`AdminLocaleSwitcher`, `AdminMobileHeader`, `AdminShell`, `AdminSidebar`, `LocaleSwitcher` (tier1), `ui/button`, `ui/sheet` (tier2).

`GR-1 CENSUS COMPLETE — 9 nodes; tier1 4 migrated+enrolled+story (AdminShell, AdminSidebar, AdminHeader, AdminLocaleSwitcher — this task); tier2 2 imports removed (ui/button, ui/sheet); tier3 1 listed and filed as none (LocaleSwitcher — shared with the public header, has its own canonical Story; extended here with one prop, no migration needed).`

### 3.3 Canonical sources

- `MantineAppShellFoundation.tsx` (110 ln, enrolled, Story `Patterns/Mantine/AppShellFoundation`, **no production
  consumer**):
  - `AppShell header={{ height: 60 }}` and `navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}`;
    both numbers are **raw literals**;
  - `NavLink component="a"` with `styles={{ root: { borderRadius: 'var(--mantine-radius-md)', minHeight: '2.75rem' } }}`
    — raw `2.75rem`;
  - a footer box with a raw `borderTop: '1px solid var(--mantine-color-gray-2)'`.
  These hardcodes are removed here.
- `docs/mantine-responsive-design-system.md:456,462,597,680` names `AdminShell` / `AdminSidebar` →
  `MantineAppShellFoundation` as the planned migration ("Phase 3").
- TailAdmin sidebar reference: `docs/tailadmin-style-reference.md` around line 89 (the "sidebar `menu-item`", live-captured). The executor reads that section before styling nav items.
- Theme: `other.touchTarget '2.75rem'`, `other.borderWidth.hairline '0.0625rem'`, `other.layout` (numbers, px),
  breakpoints `lg 64em`.

### 3.4 Legacy Stories that become duplicates, and their references

- `src/components/admin/AdminSidebar.stories.tsx` (`Admin/AdminSidebar`), `AdminMobileHeader.stories.tsx`
  (`Admin/AdminMobileHeader`), `AdminLocaleSwitcher.stories.tsx` (`Admin/AdminLocaleSwitcher`), and
  `src/stories/AdminLayout.stories.tsx` (`System/AdminLayout`, a shadcn demo that does not import `AdminShell`).
- References found by `git grep`: `scripts/check-stories-rendered.mjs:146` (anchor for `admin-adminmobileheader--default`,
  testid `admin-mobile-header`); `docs/responsive-storybook-inventory.md` (lines 52-55, 72, 134-139, 154, 183-188,
  329-346, 371); `docs/component-coverage-matrix.md:59`; `docs/responsive-screenshot-matrix.md:133`;
  `docs/mantine-responsive-design-system.md:510`. Owner rule (memory, 2026-09-17): a legacy Story that duplicates a
  canonical one is deleted and its missing states are folded into the canonical Story. The Story is never re-titled
  or enrolled as it is.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | hardcode rule | `theme.other.layout` gains `appShellNavbarWidth: 240`, `appShellHeaderHeight: 60`, `adminTopBarHeight: 72` (spec §17.1), each with a comment and an augmentation type. `MantineAppShellFoundation` consumes them and `theme.other.touchTarget` / `borderWidth.hairline` instead of every literal listed in §3.3. | P1 | AC1 | Confirmed |
| **R2** | extend canonical | `MantineAppShellFoundation` gains optional props `headerHeight?: number` (default `appShellHeaderHeight`), `navbarBreakpoint?: MantineBreakpoint` (default `'sm'`), `headerContent?: ReactNode`, `navbarContent?: ReactNode`, `mainBg?: MantineColor`, `opened?`/`onToggle?` (controlled mode). If `navbarContent` is absent it renders today's `navItems` behaviour, so its Story's existing state still works. Its Story gains a state that uses the slots. | P1 | AC2, AC6 | Confirmed |
| **R3** | spec §17.1, preserve | `AdminShell` = `MantineAppShellFoundation` with `headerHeight={adminTopBarHeight}`, `navbarBreakpoint="lg"`, `headerContent={<AdminHeader …/>}`, `navbarContent={<AdminSidebar …/>}`, `mainBg="gray.0"`. It keeps `usePresence()` and `useAdminPageFreshness()`. Drawer below 1024px; fixed 240px navbar at ≥ 1024px. `children` render in `AppShell.Main` unchanged. | P0 | AC3, AC7 | Confirmed |
| **R4** | IA preservation (agent-contract 3, 5; spec §17.1) | `AdminSidebar` renders the **same** 4 groups, 17 items, labels (`admin.sidebar.*`), hrefs, lucide icons and order as §3.1. `isActive` logic is unchanged. Items are Mantine `NavLink component={Link}` (min height `touchTarget`; active = theme brand treatment, per the TailAdmin sidebar reference). The wordmark + "Admin" badge (Mantine `Badge`), the footer with `AdminLocaleSwitcher`, the "open site" `NavLink` (`target="_blank"`) and logout (same `signOut()` + `router.push('/')`) are kept. Selecting an item closes the drawer below `lg`. `data-testid="admin-sidebar"` is kept on the root. | P0 | AC3, AC4 | Confirmed |
| **R5** | spec §17.1 | `AdminHeader.tsx` (new name; `AdminMobileHeader.tsx` is deleted — rename audit, R8): Mantine `Group h="100%"` with `Burger hiddenFrom="lg"` (`aria-label` = `admin.mobile_header.aria_open`, which is kept), the brand `hiddenFrom="lg"`, and the page title from the **same** `PAGE_TITLES` map, right-aligned and truncated with `title` for long values. `data-testid="admin-header"`. Rendered at all widths inside the 72px top bar. | P1 | AC3, AC4 | Confirmed |
| **R6** | tier 3 extension | `LocaleSwitcher` gains `fullWidth?: boolean` (forwarded to its Mantine trigger `Button`); its canonical Story gets a `fullWidth` state. `AdminLocaleSwitcher` renders `Stack gap="xs"` + a label `Text size="xs" fw={600} c="gray.5" tt="uppercase"` + `<LocaleSwitcher fullWidth showLabel …/>`, with no `className`. Behaviour (`setAdminLocale`, `router.refresh()`, pending guard) unchanged; `data-testid` kept. | P1 | AC4 | Confirmed |
| **R7** | 16c, GR-3, GR-3a | Own Stories: `Patterns/Mantine/AdminShell` (dashboard route active, drawer closed/open), `Patterns/Mantine/AdminSidebar` (an active item per group; long `uk` labels), `Patterns/Mantine/AdminHeader` (known and unknown path), `Patterns/Mantine/AdminLocaleSwitcher` (idle, pending). They use the Storybook Next.js navigation parameters (`parameters.nextjs.navigation.pathname`) for the active state, with the router mocked. The four files are enrolled. | P1 | AC5 | Confirmed |
| **R8** | clause 9 (delete/rename audit), owner story rule | The four legacy Stories of §3.4 are deleted. `scripts/check-stories-rendered.mjs:146` points at `patterns-mantine-adminheader--default` with testid `admin-header`, or the entry is removed if the canonical Story is covered by the `--mantine-only` discovery. The executor reads the script and records which. The docs references in §3.4 are updated (inventory rows removed or replaced; `mantine-responsive-design-system.md:510` marked migrated by 852). A final `git grep` finds no reference to the deleted story IDs or files. | P1 | AC8 | Confirmed |
| **R9** | baselines | After the edits, `node.exe scripts\check-surface-census-changed.mjs --base HEAD --update-baseline` removes exactly the `src/app/admin/layout.tsx :: …` rows for `AdminLocaleSwitcher`, `AdminMobileHeader`, `AdminShell`, `AdminSidebar`, `ui/button`, `ui/sheet`. The layout's own root row and `LocaleSwitcher`'s row stay. Any other change → `BLOCKED`. Never hand-edit. | P1 | AC9 | Confirmed |
| **R10** | hardcode | No `className=`, Tailwind utility, `@/components/ui/*`, raw px/rem/hex/rgb in `AdminShell.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminLocaleSwitcher.tsx`, `MantineAppShellFoundation.tsx`. | P0 | AC1 | Confirmed |

## 5. Assumptions and open questions

- **1024–1279 icon rail:** the spec says the sidebar "**may**" collapse to an icon rail. This task keeps the full
  240px navbar from `lg` up, which is simpler and preserves the IA. INFERENCE, reversible.
- **Main background** `gray.0` (#f9fafb, TailAdmin gray-50) replaces `bg-muted/30`. The owner matrix confirms.
- **`PAGE_TITLES` keeps `'/admin/pages-admin'`** exactly. Fixing it to `/admin/pages` is a one-line, visible behaviour
  change (the title appears on that page). It is allowed **only** as a separate note to the owner in the report,
  not in this diff.
- Existing admin pages keep their own Tailwind page containers (`p-6 lg:p-8 max-w-…`). The owner matrix checks that
  none of them breaks inside `AppShell.Main` (sample: dashboard, listings, users, settings).
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (3, 5, 7, 9, 11, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` (AppShell rows) · `docs/tailadmin-style-reference.md` (sidebar
`menu-item`, ~line 89; §6) · `docs/component-rules.md` · `docs/admin-ux-rules.md` · `docs/ai-behavior.md` Note 22 ·
`docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md`.

## 7. Scope

- **Created:** `src/components/admin/AdminHeader.tsx` · `src/stories/patterns/mantine/AdminShell.stories.tsx` ·
  `…/AdminSidebar.stories.tsx` · `…/AdminHeader.stories.tsx` · `…/AdminLocaleSwitcher.stories.tsx`.
- **Edited:** `src/components/admin/AdminShell.tsx` · `AdminSidebar.tsx` · `AdminLocaleSwitcher.tsx` ·
  `src/components/shared/LocaleSwitcher.tsx` (one prop) · `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx`
  (one state) · `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` ·
  `src/stories/patterns/mantine/AppShellFoundation.stories.tsx` (one state) · `src/design-system/mantine/theme.ts` ·
  `scripts/mantine-migration-scope.json` (4) · `scripts/check-stories-rendered.mjs` (R8) ·
  `scripts/surface-census-baseline.json` (writer only) · the docs of §3.4 · `messages/*.json` (story strings only) ·
  `docs/backlog.md` (852 line).
- **Deleted:** `src/components/admin/AdminMobileHeader.tsx` · the four legacy Stories of §3.4.

## 8. Out of scope

Admin page bodies (their own migrations) · `src/app/admin/layout.tsx` (unchanged: it still renders `AdminShell`) ·
the dashboard (853) · `src/components/ui/*` files · the public header's use of `LocaleSwitcher` (it keeps rendering
without `fullWidth`).

## 9. Current and required behavior

**Before.** ≥ 1024px: a Tailwind sidebar, no top bar. < 1024px: a 56px Tailwind top bar + a shadcn `Sheet` drawer.
**After.** At all widths, a 72px Mantine top bar with the page title. ≥ 1024px: a fixed 240px Mantine navbar.
< 1024px: a burger opens the Mantine drawer. Same items, same routes, same active logic, same locale switching and
logout.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes of every edited file; re-run §3.2's census; re-run §3.4's greps;
   list the 17 nav items (label key, href, icon) from `AdminSidebar.tsx` into the session log (**before-inventory**).
2. UTF-8-safe edits only.
3. Tokens (R1) → foundation extension + its Story state (R2) → `AdminLocaleSwitcher` + the `LocaleSwitcher` prop (R6) →
   `AdminSidebar` (R4) → `AdminHeader` (R5) → `AdminShell` (R3) → Stories (R7) → enrolment → legacy Story deletion and
   reference audit (R8) → baseline writer (R9).
4. **After-inventory:** re-list the 17 items from the new `AdminSidebar.tsx`; diff against the before-inventory; it
   must be identical in label key, href, icon and order.
5. Live check (dev server, staff session; if none is available, say so and hand the tuples to the owner): open
   `/admin`, `/admin/listings`, `/admin/users`, `/admin/settings` at 1440 and 390; drawer open/close; one nav click
   per group; locale switch; logout.

## 11. Positive and negative flows

**Positive.** A moderator on a 390px phone opens `/admin`. The top bar shows the burger, the brand and "Dashboard".
They tap the burger, pick "Reports", the drawer closes, and `/admin/reports` loads with "Reports" in the top bar.

| Negative flow | Applicable | Expected |
|---|---|---|
| Unknown admin path | Yes | Title falls back to `'Admin'` (as today). |
| Locale switch pending | Yes | Switcher disabled / pending indicator; second click ignored (as today). |
| Logout API failure | Yes | Local session cleared, redirect `/` (as today). |
| Long `uk` labels | Yes | Nav labels truncate inside 240px; top-bar title truncates with a `title` attribute. |
| Keyboard | Yes | Burger, nav links, switcher, logout reachable; drawer traps focus while open and Esc closes it. **Corrected 2026-09-26 (review 1):** Mantine `AppShell.Navbar` provides neither — measured, Esc left the open navbar at `transform: none`. This behaviour must be built; see §16 R12. |
| 1024–1279 | Yes | Full navbar (§5). |
| Authorization | No (preserved) | Layout gate unchanged. |

## 12. Acceptance criteria

- **AC1 [R1, R10]** — Given
  `git --no-optional-locks grep --untracked -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|[0-9.]+rem|rgba?\(|width: 240|height: 60" -- src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx src/design-system/mantine/patterns/MantineAppShellFoundation.tsx`,
  when run, then it prints nothing; `check:design-tokens:strict` and `check:enrolled-tailwind` exit 0.
- **AC2 [R2]** — Given `Patterns/Mantine/AppShellFoundation`, when both its original state and the new slot state are
  rendered, then both show a header, a navbar and main content (the original is unchanged apart from token-sourced
  sizes).
- **AC3 [R3–R5]** — Given the live app or `Patterns/Mantine/AdminShell` at 1440, when measured, then the navbar
  `width` = 240px and the header `height` = 72px; at 390, the navbar is hidden until the burger is pressed, then it is
  visible and closes after a nav click. Quote computed values.
- **AC4 [R4, R6]** — Given §10.4's before/after inventories, when diffed, then they are identical; the three
  `data-testid`s (`admin-sidebar`, `admin-header`, `admin-locale-switcher`) exist in the DOM.
- **AC5 [R7]** — Given `check:story-coverage`, `check:pattern-enrolment` and the census of `AdminShell.tsx`, when run,
  then they exit 0, and the census shows the four components `manifest:yes story:yes`, no tier-2 node.
- **AC6 [R2]** — Given `MantineAppShellFoundation`'s Story file, when read, then it imports the component directly and
  has no locale- or width-named export.
- **AC7 [R3]** — Given `npm.cmd run test:admin-freshness`, when run, then it passes (the freshness hook is still wired).
- **AC8 [R8]** — Given
  `git --no-optional-locks grep --untracked -n -E "admin-adminsidebar|admin-adminmobileheader|admin-adminlocaleswitcher|system-adminlayout|AdminMobileHeader|AdminLayout\.stories" -- src scripts docs .storybook`,
  when run, then it prints nothing except historical session logs under `docs/sessions/` (excluded by listing them
  explicitly in the report).
- **AC9 [R9]** — Given `git --no-optional-locks diff -- scripts/surface-census-baseline.json`, when read, then exactly the
  six named rows are removed and none added; `node.exe scripts\check-surface-census-changed.mjs --base HEAD` exits 0.
- **AC10** — Given the owner matrix §13.3, when reviewed, then each tuple is accepted or returned with a concrete defect.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC1 empty grep on five named files; AC4 inventory identity is the IA-preservation rule; AC9's six rows are the writer's deterministic set.`

`GR-3a STORY PREFLIGHT — AdminShell/AdminSidebar/AdminHeader/AdminLocaleSwitcher × default/active/drawer/pending; canonical candidates: NONE among canonical titles (Admin/AdminSidebar, Admin/AdminMobileHeader, Admin/AdminLocaleSwitcher and System/AdminLayout are legacy titles; per the owner's 2026-09-17 rule they are deleted, not enrolled; their states are folded into the new canonical Stories); direct-import evidence: legacy only (AdminSidebar.stories.tsx, AdminMobileHeader.stories.tsx, AdminLocaleSwitcher.stories.tsx); toolbar coverage: locale=toolbar, viewport=toolbar (Task 799 caveat); decision: CREATE (4) + EXTEND (Patterns/Mantine/AppShellFoundation, Mantine/Primitives/LocaleSwitcher); rationale: migrated production shell with no canonical proof.`

`GR-3 STORY PROVEN — AdminShell ← src/stories/patterns/mantine/AdminShell.stories.tsx; AdminSidebar ← …/AdminSidebar.stories.tsx; AdminHeader ← …/AdminHeader.stories.tsx; AdminLocaleSwitcher ← …/AdminLocaleSwitcher.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — page shell + navigation. Admin pages load in the registered hydration row ("Admin users list loads",
`docs/critical-flow-registry.md:45`); its gate is run when a staff session exists.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task852/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test:admin-freshness
npm.cmd run test:admin
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\components\admin\AdminShell.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|[0-9.]+rem|rgba?\(|width: 240|height: 60" -- src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx src/design-system/mantine/patterns/MantineAppShellFoundation.tsx
git --no-optional-locks grep --untracked -n -E "admin-adminsidebar|admin-adminmobileheader|admin-adminlocaleswitcher|system-adminlayout|AdminMobileHeader|AdminLayout\.stories" -- src scripts docs .storybook
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx src/design-system/mantine/patterns/MantineAppShellFoundation.tsx src/components/shared/LocaleSwitcher.tsx src/design-system/mantine/theme.ts scripts/surface-census-baseline.json
```

Expected: every `npm`/`node` command exits 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak
lines for story IDs `patterns-mantine-admin*`; quote the grep. The first `git grep` prints nothing; the second prints
only `docs/sessions/**` history, listed in the report.

Owner-native, when a staff session exists (from the project root, dev server running on port 3000):

```powershell
$env:BASE_URL = "http://localhost:3000"
npm.cmd run check:hydration -- --with-admin
```

Expected exit 0; return the summary line.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Stories: until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize the window. Live
app: the owner's browser, signed in as staff.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `/admin` (live) | default | 1440 | en | 240px navbar, 72px top bar with "Dashboard", TailAdmin menu-item look, active item highlighted |
| 2 | `/admin/listings` (live) | default | 1280 | sq | page body unchanged inside the new shell |
| 3 | `/admin/users` (live) | default | 1024 | it | navbar visible; no overlap with content |
| 4 | `/admin` (live) | drawer open | 768 | uk | burger opens drawer; all 17 items; Esc closes |
| 5 | `/admin/settings` (live) | drawer closed | 390 | uk | top bar: burger + brand + title; no overflow |
| 6 | `Patterns/Mantine/AdminSidebar` | Default | 320 | uk | long labels truncate; footer: language, open site, logout |
| 7 | `Patterns/Mantine/AdminLocaleSwitcher` | pending | 1440 | en | pending state visible; full-width trigger |

### 13.4 Evidence the executor hands over

§13.2 transcripts · before/after nav inventories · AC3 computed sizes · the R8 reference-audit list · the writer
transcript · §10.5 live-check notes (or "no staff session available") · owner matrix.

## 14. Completion report contract

Files with hashes (created / edited / deleted) · R1–R10 · AC1–AC10 with quotes · commands with exit codes · I0 census ·
GR-1/GR-3/GR-3a receipts · the `pages-admin` note for the owner · assumptions · deviations · limitations · owner
matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval,
no mutating git. Update the 852 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| IA preserved? | R4 + AC4 inventory diff. |
| Canonical source extended, not duplicated? | R2 extends the existing, unconsumed foundation; its hardcodes are removed. |
| Legacy duplicate Stories? | Deleted with a full reference audit (R8, AC8) — owner rule 2026-09-17. |
| GR-1 / 16d | §3.2 receipt; tier-3 `LocaleSwitcher` listed and extended, not skipped. |
| GR-2 | Coverage gate + census rows (AC5) + baseline diff (AC9). |
| Commands in blocks | §13.2 (two blocks: executor, owner-native). |

## 16. Review 1 — NEEDS REVISION (2026-09-26): re-entry

**Re-entry mode: `remediation`.** Code for R1–R3, R5–R7, R9 and R10 is accepted as written apart from the changes
below. Do **not** re-run the R9 baseline writer: the six-row removal in `scripts/surface-census-baseline.json` is
accepted (re-run only the read-only `--base HEAD` check). Do not touch Task 869's paths (`src/modules/cms/**`,
`src/app/[locale]/[slug]/**`, `src/app/globals.css`, `CmsPageView.stories.tsx`, `docs/sessions/*task869*`). Evidence
root: `docs/sessions/evidence/task852/` (create it — it does not exist).

### 16.1 Findings the revision must close

Reviewer measurements, taken on win32 / Node v22.22.3 with Playwright against `storybook-static` (story
`patterns-mantine-adminshell--default` / `--drawer-open`):

| # | Sev | Finding | Measured evidence |
|---|---|---|---|
| F1 | **P0** | The sidebar footer (language switcher, "open site", logout) is **unreachable** at every measured viewport. `AppShell.Navbar` is `position: fixed` with `height: calc(100dvh - header)` and no overflow rule, and `AdminSidebar` dropped the old `nav … overflow-y-auto`. Violates agent-contract clause 3 and R4. | 1440×900: navbar `clientHeight` 828, `scrollHeight` 1198, `overflow-y: visible`; logout `top` **1214** > `innerHeight` 900. 1280×720: navbar 648, logout top 1214. 390×844 (drawer open): navbar 772, logout top 1214. |
| F2 | **P1** | The §11 keyboard row (applicable) is not implemented and was not reported: Esc does not close the drawer and focus is not trapped. The shadcn `Sheet` did both. | 390×844: burger click → `transform: none`; `Escape` → still `none`. The session log has no keyboard evidence. |
| F3 | **P2** | Every admin page body gains 16px padding. `MantineAppShellFoundation` hard-sets `padding="md"`; the old `main` had none, and admin pages bring their own `p-6 lg:p-8`. Contradicts R3 ("`children` render … unchanged"). | `AppShell.Main` `padding-left` = **256px** at 1440 (240 + 16) and **16px** at 390. |
| F4 | **P2** | `AdminShell` `DrawerOpen` never opens outside `en`. Its `play` looks for `/open menu/i`, but the burger label is localised. The story's state is unproven in 3 of 4 locales. | `--drawer-open` at uk: burger label "Відкрити меню", navbar `transform: matrix(1,0,0,1,-390,0)`. |
| F5 | **P2** | GR-0: new inline style object `style={{ textDecoration: 'none' }}` on the `AdminSidebar` wordmark link. The old wordmark link also closed the drawer (`onClick={onClose}`); the new one does not. | `src/components/admin/AdminSidebar.tsx`, wordmark `Text component={Link}`. |
| F6 | **P2** | R8 is not implemented for `docs/responsive-storybook-inventory.md`, which §3.4 names. The file's own status line is "CANONICAL INVENTORY — update when stories are added/removed", and Task 788 already struck deleted Layout stories in it. The session log reclassified it as "frozen historical". | AC8 grep: 21 hits remain in that file. |
| F7 | **P1** | Required evidence is missing or stale. There is no `docs/sessions/evidence/task852/` and no retained §13.2 transcript (build included), only prose summaries. The session log has no **Files Changed** table (clause 10, §14). `storybook-static` was built at 2026-09-25 23:05:17, but `MantineAppShellFoundation.tsx` was last written at 23:09:04, so the AC2/AC3 rendered evidence predates the final source. | `docs/sessions/evidence/` has no `task852`; file mtimes. |

Non-blocking, no action required: `AdminLocaleSwitcher.pendingOverride` is a story-only prop on a production
component. It stays for this task. A container/View split is the canonical long-term shape, and 877 or a later task
may take it.

### 16.2 Added requirements

| ID | Closes | Observable requirement | P |
|---|---|---|---|
| **R11** | F1 | The `AdminSidebar` wordmark and nav groups sit inside a Mantine `ScrollArea` that takes the remaining height (style props `flex={1}` `mih={0}`, no `style` object). The footer `Stack` (switcher, open site, logout) is **outside** the `ScrollArea`, so it stays visible. The navbar itself no longer overflows. | P0 |
| **R12** | F2 | `MantineAppShellFoundation` (the canonical owner, so every consumer gets it) behaves as follows below `navbarBreakpoint` while `opened`. `Escape` closes the navbar: `useHotkeys` from `@mantine/hooks`, calling the same toggle/close path as the burger. Focus moves into the navbar and stays trapped there: Mantine `FocusTrap` with `active` = opened **and** below the breakpoint. On close, focus returns to the burger (`useFocusReturn`). At or above the breakpoint, nothing is trapped and Esc does nothing. `Patterns/Mantine/AppShellFoundation` keeps working. | P1 |
| **R13** | F3 | `MantineAppShellFoundation` gains `padding?: AppShellProps['padding']` (default `'md'`, so its Story is unchanged). `AdminShell` passes `padding={0}`. | P2 |
| **R14** | F4 | `AdminShell` `DrawerOpen`'s `play` finds the burger by its localised name, `storyT(<locale from globals>, 'admin.mobile_header.aria_open')`, not an English regex. | P2 |
| **R15** | F5 | The wordmark is a Mantine `Anchor component={Link} href="/admin" underline="never"` with the same `c`/`fw`/`size`, and `onClick={onNavigate}`. There is no `style=` in any of the four admin files. | P2 |
| **R16** | F6 | `docs/responsive-storybook-inventory.md`: every row or anchor naming a deleted story (`admin-adminsidebar`, `admin-adminmobileheader`, `admin-adminlocaleswitcher`, `system-adminlayout`, `AdminMobileHeader`, `AdminLayout.stories`) is struck or annotated "deleted — Task 852 (2026-09-25), successor `Patterns/Mantine/<X>`". Follow the file's own Task 788 precedent: strike, keep history, one note line. The AC8 exception list in the session log is reduced to dated snapshots and one-off scripts: `docs/governance-reports/**`, `docs/reviews/artifacts/**`, `docs/backlog-archive.md`, `docs/backlog-reserved.md`, `docs/critical-flow-registry.md`, `scripts/task419-qa-shell-fullwidth.mjs`, and the `mantine-responsive-design-system.md:510` deletion record. | P2 |
| **R17** | F7 | All evidence is retained under `docs/sessions/evidence/task852/`. That means every §13.2 command's full output with its exit code (tee each one to its own `.log`), `build-storybook` and `build` run **after** the last source edit, and the R11–R14 probe output. The session log gains a **Files Changed** table covering every path in `git status` that this task touched: created, edited or deleted, with a final `git hash-object` for each. Include the paths edited outside §7 (the doc and script reference-hygiene edits, `messages/uk.json` `item_footer`, `scripts/check-locale-leak.mjs`). Mark `scripts/mantine-migration-scope.json` as **shared with Task 869**: its `CmsPageView.tsx` line is 869's. | P1 |

### 16.3 Added acceptance criteria

Measure with a Playwright probe against a **fresh** `storybook-static` (built after the last source edit). Save the
probe as `docs/sessions/evidence/task852/probe-shell.mjs`, never under `scripts/`, and its output as `probe-shell.json`.

- **AC11 [R11]**: at 1440×900, 1280×720 and 1024×768 (`--default`), and at 390×844 with the burger opened, the last
  `button`/`a` inside `[data-testid="admin-sidebar"]` (logout) has `getBoundingClientRect().bottom ≤ innerHeight`.
  The `.mantine-AppShell-navbar` has `scrollHeight ≤ clientHeight + 1`. The nav `ScrollArea` viewport scrolls
  (`scrollHeight > clientHeight`) at 1280×720. Quote the numbers.
- **AC12 [R12]**: at 390×844, after the burger is clicked, `document.activeElement` is inside the navbar. Tabbing
  25 times keeps it there. `Escape` returns the navbar to `transform: matrix(1, 0, 0, 1, -390, 0)` and moves focus
  back to the burger. At 1440×900, `Escape` leaves the navbar at `transform: none`, and focus is not trapped (Tab
  reaches `AppShell.Main` content). Quote each value.
- **AC13 [R13]**: `AppShell.Main` computed `padding-left` = `240px` at 1440 and `0px` at 390, and `padding-top` =
  `72px` at both. `Patterns/Mantine/AppShellFoundation` `Default` still has a non-zero padding (`md`).
- **AC14 [R14]**: `patterns-mantine-adminshell--drawer-open` with `globals=locale:<l>` for each of sq/en/uk/it
  gives navbar `transform: none` after the play function. That is 4 values.
- **AC15 [R15]**: `git --no-optional-locks grep --untracked -n "style=" -- src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx`
  prints nothing, and AC1's grep still prints nothing.
- **AC16 [R16]**: AC8's grep, with its output filtered to exclude the paths listed in R16, prints nothing.
- **AC17 [R17]**: `docs/sessions/evidence/task852/` contains one `.log` per §13.2 command and the probe files. The
  `build.log` and `build-storybook.log` mtimes are later than every changed source file's mtime (quote both). The
  session log's Files Changed table matches `git status --short` for this task's paths, one row each.

AC1–AC10 stay binding. Re-quote AC3 from the fresh build; the old measurement is superseded.

### 16.4 Order

R13 + R12 (foundation, and its Story if a state is needed to show the trap: no new export unless required) → R11 +
R15 (`AdminSidebar`) → R14 (story) → R16 (doc) → `build-storybook` → probe (AC3, AC11–AC14) → the full §13.2 block,
teed into the evidence root (`npm.cmd run check:locale-leak:mantine-only -- --fast` may replace the full run; it scans
`mobile-320`, where the Footer leak appeared. It must still report zero `patterns-mantine-admin*` leaks; quote the
report path) → Files Changed table → the 852 backlog line → status.

`GR-4 AC AUDIT — 17 criteria; each states an observable property; absolutes: AC1/AC15 empty grep on five/four named files (a correct implementation has no match); AC16 grep with a named exclusion list.`

## 17. Review 2 — PARTIALLY VERIFIED (2026-09-26)

F1–F7 are closed on inspected code and retained evidence (`docs/sessions/evidence/task852/`, `probe-shell.log`:
AC11–AC14 pass on a Storybook built after the last source edit, and `24-build.log` exits 0). No executor action is
owed.

**Open: AC10, the owner Storybook pass.** On 2026-09-26 the owner chose to review the Stories himself instead of a
full `check:locale-leak` run. The executor's leak scan covered only the 12 `Patterns/Mantine/Admin*` stories. The
changed `mantine-primitives-localeswitcher--default` (`fullWidth` state) and
`patterns-mantine-appshellfoundation--with-slots` were not scanned, so the owner's sq/uk/it look covers them. When
every Story below is accepted, the next review approves and archives. A returned Story reopens the task with the
concrete defect.

| Story ID | Locales | Widths | Owner checks |
|---|---|---|---|
| `patterns-mantine-adminshell--default` | en, uk | 1440, 1024 | 240px navbar, 72px top bar with the title; logout visible without scrolling; nav scrolls inside |
| `patterns-mantine-adminshell--drawer-open` | sq, uk | 390 | drawer open; Esc closes it; footer visible |
| `patterns-mantine-adminsidebar--default` · `--management-active` · `--content-active` · `--system-active` | uk | 320 | active item highlighted; long labels truncate; footer: language, open site, logout |
| `patterns-mantine-adminheader--default` · `--unknown-path` · `--drawer-open` | sq, it | 390, 1440 | burger + brand below 1024; title right-aligned; fallback "Admin" |
| `patterns-mantine-adminlocaleswitcher--idle` · `--pending` | en, uk | 1440 | label, full-width trigger, spinner when pending |
| `mantine-primitives-localeswitcher--default` | sq, uk, it | 390, 1440 | `fullWidth` state; no English text outside the language names |
| `patterns-mantine-appshellfoundation--default` · `--with-slots` | sq, uk, it | 390, 1440 | both render header + navbar + main; no English text |

Live `/admin` rows 1–5 of §13.3 and `check:hydration -- --with-admin` stay owner-native when a staff session
exists; they do not block approval on this owner decision.

Non-blocking P3 notes, carried to the archive row at approval:

1. Esc inside the language bottom sheet (opened from the drawer at 390) closes both the sheet and the drawer
   (reviewer probe).
2. `AdminLocaleSwitcher.pendingOverride` is a story-only prop (§16.1).
3. `docs/sessions/evidence/task852/17-ac8-grep.log` is 3.2 MB of raw grep output. The filtered file is the
   evidence, so the owner may drop the raw one before committing.

## 18. Review 3 — NEEDS REVISION (2026-09-26): the owner returned `Patterns/Mantine/AdminShell`

**Owner return, 2026-09-26, verbatim:** *"я не приймаю якість patterns-mantine-adminshell бо там не задається ширина
екрану через меню Storybook"*. In the screenshot, the Storybook viewport toolbar is greyed out at "Desktop 1440px"
on `AdminShell` `Default`.

**Cause, measured.** Three exports pin the viewport with a story-level `globals`, which locks the toolbar:
- `src/stories/patterns/mantine/AdminShell.stories.tsx:28`, `Default`: `globals: { viewport: { value: 'desktop1440' … } }`;
- `AdminShell.stories.tsx:40`, `DrawerOpen`: `mobile390`;
- `src/stories/patterns/mantine/AdminHeader.stories.tsx:35`, `DrawerOpen`: `mobile390`.

This breaks the canonical Mantine Story shape: locale and breakpoints come from the toolbar, never a pin
(`docs/storybook-governance.md:15`, `:136`, `:211-212`; owner rule 2026-09-17). It also contradicts this kickoff's own
GR-3a receipt (`viewport=toolbar`). Reviews 1 and 2 missed it; `check:stories` does not detect a `globals.viewport` pin.

**Re-entry mode: `remediation`.** Everything else from §16/§17 stands. Do not touch Task 869's paths.

| ID | Observable requirement | P |
|---|---|---|
| **R18** | Delete every `globals: { viewport … }` from `AdminShell.stories.tsx` (`Default`, `DrawerOpen`) and `AdminHeader.stories.tsx` (`DrawerOpen`). Width is chosen only with the toolbar. | P1 |
| **R19** | `AdminShell` `DrawerOpen`'s `play` clicks the burger **only when it is accessible**: use `canvas.queryByRole('button', { name: storyT(l, 'admin.mobile_header.aria_open') })` and do nothing when it is `null`. At ≥ 1024 the burger is `hiddenFrom="lg"` and the navbar is already visible, so the story shows the shell with no interaction error. Below 1024 it opens the drawer, as today. Note in the story comment: "open state below 1024 (toolbar width); at ≥ 1024 the navbar is permanent". | P1 |

- **AC18 [R18]**: `git --no-optional-locks grep --untracked -n -E "globals:|viewport" -- src/stories/patterns/mantine/AdminShell.stories.tsx src/stories/patterns/mantine/AdminHeader.stories.tsx src/stories/patterns/mantine/AdminSidebar.stories.tsx src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx`
  prints only the `globals?.locale` reads (`context?.globals?.locale`, the `play` destructuring). Quote every printed line.
- **AC19 [R19]**: `probe-shell.mjs` is re-run against a fresh `storybook-static` with the page viewport set by
  Playwright (never a pin). It gives:
  - `patterns-mantine-adminshell--drawer-open` at 390×844: navbar `transform: none` in sq/en/uk/it;
  - at 1440×900: navbar `transform: none`, and the play function throws no error — collect `page.on('pageerror')`
    and console errors and print the count, which must be 0;
  - AC11–AC13 still pass.

  Keep the old output as `probe-shell.review2.json` (superseded) and write the new run to `probe-shell.json`.
- **AC20**: `npm.cmd run check:stories`, `npm.cmd run build-storybook` and `npm.cmd run typecheck` exit 0, teed into the
  evidence root as `25-…`, `26-…` and `27-…` `.log`. Stories changed, not source, so `npm run build` is not re-run.
  Its `24-build.log` stays current because no `src/components` or `src/design-system` file changes.
- **AC21 (owner)**: the owner re-opens `Patterns/Mantine/AdminShell` `Default` and `Drawer Open`, and
  `Patterns/Mantine/AdminHeader` `Drawer Open`. The toolbar sets the width at 390, 1024 and 1440, and they accept.
  Then the owner continues the §17 list.

Order: R18 → R19 → `build-storybook` → probe → gates → session log (a "Review 3 re-entry" section plus a Files
Changed row per edited file with its hash) → the 852 backlog line → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

`GR-4 AC AUDIT — 4 new criteria; each states an observable property; absolutes: AC18 grep with the permitted-line class named; AC19 zero page errors is the defect's own signal.`

## 19. Review 4 — NEEDS REVISION (2026-09-26): owner matrix, four Stories returned

R18/R19 are accepted: the viewport pins are gone and `play` no longer throws.

**Owner matrix, 2026-09-26, verbatim.**

*Accepted:* `patterns-mantine-adminshell--default`, `--drawer-open`; `patterns-mantine-adminheader--default`,
`--unknown-path`, `--drawer-open`.

*Returned:*
- adminsidebar ×4 — *"хардкод, немає адаптивності на мобільних екранах! Не приймаю!"*
- adminlocaleswitcher idle/pending — *"не адаптивна кнопка на мобільних екранах. Хардкод. Не приймаю!"*
- primitives-localeswitcher fullWidth — *"хардкодна, не адаптивна кнопка. Не приймаю!"*
- appshellfoundation default/with-slots — *"чому в header заголовок "Admin" не відцентрований по вертикалі? Не приймаю!"*

**This task binds the new golden rule GR-3b** (`docs/golden-rules.md`, owner rule 2026-09-26, written from these
returns): a Story reproduces the production width contract and never fixes one.

| # | Returned Story | Cause (source) | Production contract |
|---|---|---|---|
| O1 | `Patterns/Mantine/AdminSidebar` (4) | Decorator `Box maw={theme.other.layout.appShellNavbarWidth} h="100vh" style={{ borderRight: … }}`: capped at 240px at every width, plus an inline style object. | `AdminShell` puts the sidebar in `AppShell.Navbar` with `navbarBreakpoint="lg"`, so it is **full viewport width below 1024** (measured 390 at 390×844, review 1) and 240px at ≥ 1024. |
| O2 | `Patterns/Mantine/AdminLocaleSwitcher` (2) | Decorator `Box maw={theme.other.layout.appShellNavbarWidth} p="sm"`: the full-width trigger can never exceed 240 − padding. | Same parent: the sidebar footer, full width below 1024. |
| O3 | `Mantine/Primitives/LocaleSwitcher` (`fullWidth` block) | `<Stack w={theme.other.layout.appShellNavbarWidth}>`: a fixed 240px column. The caption also carries a task reference ("(Task 852, admin sidebar footer)") in UI copy. | `fullWidth` means "fills its container". The demo container must be fluid. |
| O4 | `Patterns/Mantine/AppShellFoundation` (`Default`, `WithSlots`) | `WithSlots` header slot = `<div style={{ padding: '0 1rem' }}>` is not a full-height, centred row, so "Admin" sits at the top of the header. The navbar slot is `<div style={{ padding: '0.5rem' }}>`, and the shared `makeArgs.children` is `<div style={{ padding: '2rem' }}>`, both inline styles. | A header slot fills the header height and centres vertically, like `AdminHeader`'s `Group h="100%"`. |

**Re-entry mode: `remediation`.** Change only the four Story files, the four `locale_switcher_fullwidth_caption`
values, and the `headerContent` JSDoc line in `MantineAppShellFoundation.tsx`. Production components are unchanged.
Do not touch Task 869's paths.

| ID | Closes | Observable requirement | P |
|---|---|---|---|
| **R20** | O1 | `AdminSidebar.stories.tsx` decorator: `Box w={{ base: '100%', lg: theme.other.layout.appShellNavbarWidth }} h="100dvh"`, with a comment citing `AdminShell.tsx`'s `navbarBreakpoint="lg"`. There is no `maw`, no `style` and no border. | P1 |
| **R21** | O2 | `AdminLocaleSwitcher.stories.tsx` decorator: the same responsive `w` object plus `p="sm"`, with the same citation. There is no `maw`. | P1 |
| **R22** | O3 | `LocaleSwitcher.stories.tsx`: the `fullWidth` demo's wrapper has no width at all (fluid). `locale_switcher_fullwidth_caption` in sq/en/uk/it drops the parenthesised task reference, e.g. en `"fullWidth — trigger fills its container"`. | P1 |
| **R23** | O4 | `AppShellFoundation.stories.tsx`: the header slot is `<Group h="100%" px="md"><Text fw={600}>…</Text></Group>`, the navbar slot is `<Box p="xs"><Text>…</Text></Box>`, and `makeArgs.children` is `<Box p="xl">…</Box>`. There is no `style=` anywhere in the file. `MantineAppShellFoundation`'s `headerContent` JSDoc adds: "must fill the header height and centre vertically (e.g. `Group h="100%"`)". | P1 |

Acceptance criteria. Probe: extend `probe-shell.mjs` into `probe-stories.mjs` in the evidence root. It runs against a
fresh `storybook-static`, with the Playwright page viewport set per width, and saves its output as
`probe-stories.json`.

- **AC22 [R20]**: `patterns-mantine-adminsidebar--default`. At 320/390 the `[data-testid="admin-sidebar"]` width is the
  viewport width (± scrollbar), and at 1024/1440 it is 240. `document.documentElement.scrollWidth ≤ innerWidth` at all four.
- **AC23 [R21]**: `patterns-mantine-adminlocaleswitcher--idle`. At 320/390 the trigger `button` width is viewport width
  − 2 × `sm` spacing (± 1). At 1024/1440 it is 240 − 2 × `sm`. No overflow.
- **AC24 [R22]**: `mantine-primitives-localeswitcher--default`. At 320/390/1024/1440 the `fullWidth` trigger width
  equals its parent `Stack`'s content width (± 1), which grows with the viewport. The caption contains no "Task".
- **AC25 [R23]**: `patterns-mantine-appshellfoundation--with-slots` and `--default`. At 390 and 1440,
  `|slot text centreY − AppShell.Header centreY| ≤ 1px`. In `Default` the siteName `Text` is centred the same way.
- **AC26 [GR-3b]**: one `GR-3b STORY RESPONSIVE CHECK` receipt per Story file changed in this task:
  AdminShell, AdminSidebar, AdminHeader, AdminLocaleSwitcher, AppShellFoundation, and Primitives/LocaleSwitcher.
  The six receipts go in the session log, with the numbers from `probe-stories.json`.
- **AC27**: `git --no-optional-locks grep --untracked -n -E "style=|maw=|globals: \{ ?viewport" -- src/stories/patterns/mantine/AdminShell.stories.tsx src/stories/patterns/mantine/AdminSidebar.stories.tsx src/stories/patterns/mantine/AdminHeader.stories.tsx src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx src/stories/patterns/mantine/AppShellFoundation.stories.tsx`
  prints nothing. In `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx`, the `fullWidth` block has no
  `w=`; quote the block.
- **AC28**: `check:i18n`, `check:stories`, `typecheck` and `build-storybook` exit 0, teed as `28-…`–`31-…` `.log`.
- **AC29 (owner)**: the owner re-opens the four returned groups through the toolbar at 320/390/1024/1440 and accepts.
  The §17 row for `check:locale-leak` is covered by this look.

Order: R20 → R21 → R22 → R23 → `build-storybook` → probe → gates → session log (a "Review 4 re-entry" section,
GR-3b receipts, a Files Changed row with a hash per edited file) → the 852 backlog line → status.

`GR-4 AC AUDIT — 8 new criteria; each states an observable property; absolutes: AC27 empty grep on five named files (a correct story has none of the three forms).`

## 20. Review 5 — NEEDS REVISION (2026-09-26): the executor's AC23/AC24 contradiction, resolved

**Accepted:** R20, R22's Story change, and R23. The reviewer re-measured on `storybook-static` built at 10:28, after
the last Story edit at 10:26 (uk):
- `adminsidebar--default`: 390 at 390, 240 at 1440, no overflow;
- `appshellfoundation--with-slots`: header centre Δ 0.5px at both widths.

**The contradiction is real, and it is a kickoff defect, not an executor defect.** R6 only told the executor to
forward `fullWidth` to the trigger `Button`. But on the ≥ 640 path, `MantineDropdownMenu.tsx:90-93` wraps the trigger
in `Box style={{ alignSelf: 'flex-start' }}`, so `fullWidth` has no effect at 640 and above. That holds in
production too, not only in the Story. Reviewer measurement, `adminlocaleswitcher--idle`, uk:
- at 390, box 366 and trigger 366;
- at 1440, box 216 and trigger **148**.

**Decision (orchestrator; derivable, so not an owner call).** Option (a), accepting a content-width trigger, is
rejected, for three reasons:
- the pre-migration `AdminLocaleSwitcher` trigger was `className="w-full justify-start …"` at **every** width
  (`HEAD:src/components/admin/AdminLocaleSwitcher.tsx:33`), and R6 plus agent-contract clause 5 preserve it;
- the owner returned exactly this: *"не адаптивна кнопка"*;
- GR-3b forbids fixing it in the Story.

The fix belongs in the canonical owner of the wrapper: **EXTEND `MantineDropdownMenu`**. This is in scope now
because `LocaleSwitcher` → `MantineDropdownMenu` is in this surface's census (§3.2, tier 1). No follow-up task.

**Re-entry mode: `remediation`.** Change only the files named below. `UserMenu` and every other `MantineDropdownMenu`
consumer must render byte-identically in behaviour: the default is unchanged. Do not touch Task 869's paths,
`src/design-system/mantine/typography-chrome.css` included.

| ID | Observable requirement | P |
|---|---|---|
| **R24** | `MantineDropdownMenu` gains `fullWidthTrigger?: boolean` (default `false`), with JSDoc. When it is `true`: the desktop (≥ 640) wrapper is a `Box w="100%"` with **no** `alignSelf: 'flex-start'`, so the trigger fills its container; the mobile path is unchanged (it already stretches). When it is `false` the output is identical to today. No new `style` object: the existing `alignSelf` style stays only on the default branch, and the new branch uses the Mantine style prop `w`. | P1 |
| **R25** | `LocaleSwitcher` passes `fullWidthTrigger={fullWidth}` to `MantineDropdownMenu`, next to the existing `Button fullWidth={fullWidth}`. The public header's `LocaleSwitcher` (no `fullWidth`) is unchanged. | P1 |
| **R26** | `src/stories/mantine/primitives/DropdownMenu.stories.tsx` (canonical Story of `MantineDropdownMenu`, EXTEND, GR-3a) gains one state block: a text trigger `Button fullWidth` with `fullWidthTrigger` inside a fluid `Stack`, with a locale-backed caption in sq/en/uk/it (`storybook.mantine.dm_fullwidth_trigger_caption`, the Story's existing `dm_` key prefix). No new export and no fixed-width wrapper (GR-3b). | P1 |

Acceptance criteria (probe `probe-stories.mjs` extended; fresh `storybook-static`; uk):

- **AC30 [R24, R25]**: `adminlocaleswitcher--idle`: trigger width = box width − 2 × `sm` (± 1) at 320, 390, 1024 and
  1440. `mantine-primitives-localeswitcher--default` `fullWidth` block: trigger width = parent `Stack` width (± 1) at
  all four. The ≥ 640 cells open the anchored `Menu` on click, and the < 640 cells open the bottom sheet.
- **AC31 [R24]**: the default-branch trigger (`mantine-primitives-dropdownmenu--default`'s first trigger and
  `mantine-primitives-usermenu--*`) has the same `getBoundingClientRect().width` at 1440 as on the pre-change build.
  Record the before value from the current `storybook-static` **before** editing, and the after value from the new
  build.
- **AC32 [R26]**: the new DropdownMenu state's trigger fills its fluid parent at 390 and 1440, with a
  `GR-3b STORY RESPONSIVE CHECK` receipt. `check:i18n`, `check:stories`, `check:story-coverage`, `typecheck`,
  `lint`, `build-storybook` and `npm run build` exit 0 (production code changed), teed as `32-…` onward.
- **AC33**: the GR-3b receipts for `adminlocaleswitcher--idle` and `mantine-primitives-localeswitcher--default` are
  re-issued with the new numbers. No `CONTRADICTED` cell remains.
- **AC34 (owner)**: the owner re-opens the four §19 groups plus `Mantine/Primitives/DropdownMenu` at 320/390/1024/1440
  and accepts.

Order: AC31 "before" measurement → R24 → R25 → R26 → `build-storybook` → probe → gates → session log ("Review 5
re-entry", Files Changed rows with hashes for the three files) → the 852 backlog line → status.

`GR-4 AC AUDIT — 5 new criteria; each states an observable property; absolutes: AC31 width identity on the default branch is the no-regression property itself.`

## 21. Review 6 — PARTIALLY VERIFIED (2026-09-26): pending the owner pass (AC34)

R24–R26 are accepted. Evidence:
- `33-build-storybook-review5.log` (10:52) and `37-build-review5.log` (10:57), both after the last source edit
  (10:50), both exit 0.
- `typecheck` re-run by the reviewer: exit 0.
- Reviewer measurement, uk: `adminlocaleswitcher--idle` trigger/box 366/366 at 390 (bottom sheet opens) and
  216/216 at 1440 (anchored `Menu` opens); the new `dropdownmenu--default` block 358/358 and 1342/1342; no overflow.
- AC31 before/after: the default-branch triggers are unchanged (51.30 / 166.48 / 166.48).

**Open, owner only (AC34 plus the §17 remainder).** Re-open these at 320/390/1024/1440 through the toolbar, in sq/uk/it:
- `patterns-mantine-adminsidebar--default`, `--management-active`, `--content-active`, `--system-active`;
- `patterns-mantine-adminlocaleswitcher--idle`, `--pending`;
- `mantine-primitives-localeswitcher--default`;
- `patterns-mantine-appshellfoundation--default`, `--with-slots`;
- `mantine-primitives-dropdownmenu--default` (the last block).

This look also stands in for `check:locale-leak`, which the owner declined. When every Story is accepted, the next
review approves and archives.

P3 notes, carried to the archive row:

4. `MantineDropdownMenu`'s two desktop branches repeat the identical `Menu` block; only the wrapper differs. A later
   touch may collapse them into one branch with conditional wrapper props.
5. `typecheck` for review 5 was not retained as a log. The reviewer re-ran it (exit 0), and `next build`'s type check
   also passed.
