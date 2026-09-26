# Session Archive: Task 852 — the admin shell leaves Tailwind and shadcn for canonical Mantine — 2026-09-25

Task: `tasks/Archive/Sprint_78_kickoff_prompt_Task_852_Admin_Shell_Mantine.md` (archived 2026-09-26, review 10 APPROVED WITH NOTES)
Sprint 78 · P1 · Q3 · Executor: Sonnet (`claude-sonnet-5`)

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## I0 — before state (measured 2026-09-25)

Platform: `win32 v22.22.3`. `git status --porcelain` at session start showed pre-existing, unrelated
in-progress work from Task 869 (`docs/backlog.md`, `scripts/mantine-migration-scope.json`,
`src/app/[locale]/[slug]/page.tsx`, `src/app/globals.css`, and untracked CMS files/stories) — untouched by
this session.

Pre-edit hashes: `AdminShell.tsx fd068fa2` · `AdminSidebar.tsx 5d25abe4` · `AdminLocaleSwitcher.tsx e9a8864d`
· `AdminMobileHeader.tsx 748c98b8` · `MantineAppShellFoundation.tsx 82fb6150` · `LocaleSwitcher.tsx d5acecfd`
· `theme.ts 431c15d0` · `surface-census-baseline.json df723373`.

Census (`node scripts/check-surface-census.mjs --surface src/components/admin/AdminShell.tsx`) reproduced
§3.2 exactly: 9 nodes, `GR-1 CENSUS BLOCKED` on `AdminShell`/`AdminMobileHeader`/`AdminSidebar`/
`AdminLocaleSwitcher` (tier1-unenrolled-or-unstoried) + `ui/button.tsx`/`ui/sheet.tsx` (tier2-legacy-primitive).

Before-inventory (17 items, `AdminSidebar.tsx`'s `GROUPS`): overview → Dashboard (`/admin`); management →
Listings, Users, Support, Inquiries-support (`/admin/inquiries/support`), Inquiries-sales
(`/admin/inquiries/sales`), Reports; content → Locations, Popular locations, Companies, Pages, Property
types, Currency, Email templates, Footer; system → Settings, Permissions. Same order in both label key and
icon as measured after.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1 [AC1] | `theme.other.layout` gains `appShellNavbarWidth: 240`, `appShellHeaderHeight: 60`, `adminTopBarHeight: 72`; `MantineAppShellFoundation` consumes them + `touchTarget`/`borderWidth.hairline` | `src/design-system/mantine/theme.ts` (augmentation + values); `MantineAppShellFoundation.tsx` — `header={{ height: headerHeight ?? theme.other.layout.appShellHeaderHeight }}`, `navbar={{ width: theme.other.layout.appShellNavbarWidth, … }}`, NavLink `minHeight: theme.other.touchTarget`, footer `borderTop: \`${theme.other.borderWidth.hairline} solid …\`` | ✅ |
| R2 [AC2, AC6] | `MantineAppShellFoundation` gains `headerHeight?`, `navbarBreakpoint?`, `headerContent?`, `navbarContent?`, `mainBg?`, `opened?`/`onToggle?`; default behaviour unchanged when slots absent; Story gains a slotted state | `MantineAppShellFoundation.tsx` (props + fallback rendering); `AppShellFoundation.stories.tsx` `Default` (unchanged) + new `WithSlots` export | ✅ |
| R3 [AC3, AC7] | `AdminShell` = foundation with `headerHeight={adminTopBarHeight}`, `navbarBreakpoint="lg"`, `headerContent`/`navbarContent`, `mainBg="gray.0"`; keeps `usePresence()`/`useAdminPageFreshness()` | `src/components/admin/AdminShell.tsx` (full file, 28 ln) | ✅ |
| R4 [AC3, AC4] | `AdminSidebar` — same 4 groups/17 items/labels/hrefs/icons/order/`isActive`; Mantine `NavLink component={Link}`; wordmark+badge, footer (locale switcher, open-site, logout) kept; closes drawer on select; `data-testid="admin-sidebar"` kept | `src/components/admin/AdminSidebar.tsx` (full file); after-inventory below is byte-identical to before-inventory | ✅ |
| R5 [AC3, AC4] | `AdminHeader.tsx` (new name, `AdminMobileHeader.tsx` deleted): `Group h="100%"` + `Burger hiddenFrom="lg"` (aria kept) + brand `hiddenFrom="lg"` + `PAGE_TITLES` title, truncated with `title` attr; `data-testid="admin-header"`; rendered at all widths | `src/components/admin/AdminHeader.tsx` (full file, new) | ✅ |
| R6 [AC4] | `LocaleSwitcher` gains `fullWidth?`; its Story gets a `fullWidth` state; `AdminLocaleSwitcher` renders `Stack gap="xs"` + label `Text` + `<LocaleSwitcher fullWidth showLabel …/>`, no `className`; behaviour/testid unchanged | `src/components/shared/LocaleSwitcher.tsx`; `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` (new "fullWidth" state, 4-locale caption key added); `src/components/admin/AdminLocaleSwitcher.tsx` (full file) | ✅ |
| R7 [AC5] | Own canonical Stories for all four, using `nextjs.navigation.pathname` for active-state, no play-fn for pathname-driven states | `src/stories/patterns/mantine/AdminShell.stories.tsx`, `AdminSidebar.stories.tsx`, `AdminHeader.stories.tsx`, `AdminLocaleSwitcher.stories.tsx`; enrolled in `scripts/mantine-migration-scope.json` | ✅ |
| R8 [AC8] | Legacy Stories deleted; references audited; `check-stories-rendered.mjs:146` handled per its own instruction | See "R8 — delete/reference audit" below | ✅ (with disclosed historical exclusions) |
| R9 [AC9] | Baseline writer removes exactly the 6 named rows | `node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline` — diff quoted below | ✅ |
| R10 [AC1] | No `className=`/Tailwind/`components/ui/`/raw px·rem·hex·rgb in the 5 named files | AC1 grep (below) — empty | ✅ |

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none.` (restated from the kickoff.)

`GR-1 CENSUS COMPLETE — 8 nodes; tier1 8 migrated+enrolled+story (AdminShell, AdminHeader, AdminSidebar, AdminLocaleSwitcher, MantineAppShellFoundation, LocaleSwitcher, MantineDropdownMenu, responsiveBottomSheet); tier2 0 imports removed (ui/button, ui/sheet — both gone); tier3 0 listed and filed as none.` (post-edit census dropped from 9 to 8 nodes: `AdminMobileHeader` is deleted, not renamed-in-place, so its old node disappears and `AdminHeader` is a new node in the same slot.)

`GR-3 STORY PROVEN — AdminShell ← src/stories/patterns/mantine/AdminShell.stories.tsx; AdminSidebar ← …/AdminSidebar.stories.tsx; AdminHeader ← …/AdminHeader.stories.tsx; AdminLocaleSwitcher ← …/AdminLocaleSwitcher.stories.tsx`

`GR-3a STORY PREFLIGHT — AdminShell/AdminSidebar/AdminHeader/AdminLocaleSwitcher × default/active/drawer/pending; canonical candidates: NONE among canonical titles (the four legacy `Admin/*` + `System/AdminLayout` titles were legacy, deleted not enrolled per owner rule 2026-09-17); direct-import evidence: legacy only, now deleted; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE (4) + EXTEND (Patterns/Mantine/AppShellFoundation `WithSlots`, Mantine/Primitives/LocaleSwitcher `fullWidth`); rationale: migrated production shell with no canonical proof.`

### AC1 — hardcode grep (empty)

```
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|[0-9.]+rem|rgba?\(|width: 240|height: 60" -- src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx src/design-system/mantine/patterns/MantineAppShellFoundation.tsx
```
Exit 1 (no match) — prints nothing.

### AC3 — live-captured computed values (Playwright against the built `storybook-static`, `patterns-mantine-adminshell--default`)

- **1440×900:** `mantine-AppShell-navbar` `getBoundingClientRect().width` = **240**; `mantine-AppShell-header`
  `getBoundingClientRect().height` = **72**. Three `data-testid`s (`admin-sidebar`, `admin-header`,
  `admin-locale-switcher`) present.
- **390×844:** navbar `computedStyle.transform` = `matrix(1,0,0,1,-390,0)` (off-canvas, hidden); header height
  still 72; burger `aria-label="Open menu"` present. Clicking the burger sets `transform: none` (drawer
  visible, full 390 width). Clicking the `/admin/listings` nav link both navigates (mocked router) and
  resets `transform` back to `matrix(1,0,0,1,-390,0)` — the drawer closes on nav-select, live-verified, not
  just read from source.

### AC4 — after-inventory (`AdminSidebar.tsx`, post-edit)

Re-listed 17 items — identical label key, href, icon and order to the I0 before-inventory (see grep above):
`item_dashboard/admin/LayoutDashboard`, `item_listings//admin/listings/ListChecks`,
`item_users//admin/users/Users`, `item_support//admin/support/MessageSquare`,
`item_inquiries_support//admin/inquiries/support/LifeBuoy`,
`item_inquiries_sales//admin/inquiries/sales/TrendingUp`, `item_reports//admin/reports/Flag`,
`item_locations//admin/locations/MapPin`, `item_popular_locations//admin/popular-locations/Star`,
`item_companies//admin/companies/Briefcase`, `item_pages//admin/pages/FileText`,
`item_property_types//admin/property-types/Building2`, `item_currency//admin/currency/CircleDollarSign`,
`item_email_templates//admin/email-templates/Mail`, `item_footer//admin/footer/PanelBottom`,
`item_settings//admin/settings/Settings`, `item_permissions//admin/permissions/ShieldCheck`. Diff: none.

### AC5, AC6 — coverage/enrolment gates and Story-file inspection

`check:story-coverage` → 106/106 enrolled components covered, 0 unproven. `check:pattern-enrolment` → 52
pattern files, 106 manifest entries, PASS. `AppShellFoundation.stories.tsx` — both `Default` and `WithSlots`
import `MantineAppShellFoundation` directly (no locale-/width-named export).

### AC7 — `test:admin-freshness`

`vitest run src/hooks/__tests__/useAdminPageFreshness.test.ts` — 6/6 passed (the hook is unchanged; `AdminShell`
still calls it unconditionally).

### R8 — delete/reference audit

Deleted: `src/components/admin/AdminMobileHeader.tsx`, `AdminMobileHeader.stories.tsx`,
`AdminSidebar.stories.tsx`, `AdminLocaleSwitcher.stories.tsx`, `src/stories/AdminLayout.stories.tsx`.

`scripts/check-stories-rendered.mjs` (a **retired** script — `screenshots:assert`/`screenshots:assert:*`/
`governance:screenshots:assert` are all owner-retired 2026-09-03, never run by CI or the executor; updated
for reference hygiene only, not functional correctness): the `admin-adminmobileheader--default` row is
replaced with `patterns-mantine-adminheader--default` (testid `admin-header`, per R8's own instruction); the
`admin-adminlocaleswitcher--default` and `admin-adminsidebar--mobile-drawer-open` rows and the
`system-adminlayout--admin-toolbar` row are removed (no direct successor: the locale switcher's new
canonical id lives at `patterns-mantine-adminlocaleswitcher--idle`; the sidebar no longer owns its own
mobile-drawer state — that now belongs to `AdminShell`'s `DrawerOpen` story; `System/AdminLayout` was an
unrelated shadcn demo with no Mantine successor). The matching `STORY_VIEWPORT_RANGE` entries and two
`scripts/story-realmode-allowlist.json` entries pointing at the deleted files were removed the same way.

Live (non-retired) references fixed: `scripts/responsive-screenshots.mjs` (removed the `system-adminlayout`
screenshot target row), `scripts/governance/component-catalog.mjs` (removed the matching doc-generator
output line), `scripts/governance/tailwind-entropy.allowlist.json` (removed the dead
`AdminMobileHeader.tsx` allowlist entry — the new `AdminHeader.tsx` has zero `className`),
`docs/component-catalog.md` / `docs/component-risk-register.md` / `docs/mantine-tailadmin-migration-tracker.md`
/ `docs/mantine-responsive-design-system.md` / `docs/component-coverage-matrix.md` /
`docs/responsive-screenshot-matrix.md` / `docs/storybook-governance.md` (rows renamed/updated/removed to
match; each edit is a one-line hand-correction in the same style these docs already use for prior
component renames/deletions, e.g. Task 787/788/873's precedent in `component-catalog.md`'s own changelog
line — never a full unreviewed regeneration).

**Disclosed AC8 exception (deviation, reported not silently accepted):** AC8's own grep still prints
non-empty outside `docs/sessions/**` against files this task did not edit. All of them are frozen
historical records, not live state — the same category `docs/sessions/**` is already excluded for:
`docs/backlog-archive.md` (historical ledger, `CLAUDE.md`'s own description), `docs/backlog-reserved.md`
(a reserved task's own citation of a pre-existing z-index convention example), `docs/critical-flow-registry.md`
(a dense historical narrative of Task 464/467's retired screenshot-assert harness build, dated 2026-06-22/23),
`docs/governance-reports/**` (dated weekly snapshots + one dated 2026-05-30 audit report),
`docs/reviews/artifacts/**` (frozen per-task review evidence transcripts/logs/built-static-assets from three
already-closed tasks), `docs/responsive-storybook-inventory.md` (a frozen full-sweep audit record from
Task 419/383, itself for the now-retired `screenshots:assert` harness), and `scripts/task419-qa-shell-fullwidth.mjs`
(a one-off, never-wired-to-any-npm-script QA script from that same closed task). One additional,
unavoidable exception: `docs/mantine-responsive-design-system.md`'s own "Removed — Task 852 …" row for
`src/stories/AdminLayout.stories.tsx` necessarily names that exact deleted filename in its **Source**
column — the identical convention already used one row below it for three prior Task-827 deletions
(`FeaturedListings.stories.tsx`, `RecentlyViewedSection.stories.tsx`, `SimilarListings.stories.tsx`); removing
the filename would make the deletion record itself wrong. Recommend Opus confirm this reading is acceptable;
none of these files are read by any executed gate.

### R9 — baseline writer (AC9)

```
node scripts/check-surface-census-changed.mjs --base HEAD --update-baseline
```
Diff (`git diff -- scripts/surface-census-baseline.json`) removes exactly the six rows the task names —
`src/app/admin/layout.tsx :: AdminLocaleSwitcher.tsx`, `:: AdminMobileHeader.tsx`, `:: AdminShell.tsx`,
`:: AdminSidebar.tsx`, `:: ui/button.tsx`, `:: ui/sheet.tsx` — and adds none. Re-run without
`--update-baseline`: `PASS check:surface-census:changed` (exit 0; "1 block baselined" is Task 869's
pre-existing, unrelated debt, not new).

## §13.2 final gate block — commands and results

```
node -p "process.platform + ' ' + process.version"        → win32 v22.22.3
npm run typecheck                                          → 0 errors
npm run lint                                                → 0 errors, 84 pre-existing warnings (none in touched files)
npm run check:i18n                                          → 2380/2380/2380/2380 keys, parity PASSED
npm run test:admin-freshness                                → 6/6 passed
npm run test:admin                                          → 5 files / 32 tests passed
npm run check:stories                                       → 171 files, 0 violations (after fixing 1 hardcoded-English-text
                                                                finding in AdminShell.stories.tsx and 2 stale-allowlist entries)
npm run check:story-coverage                                → 106/106 covered, 0 unproven
npm run check:pattern-enrolment                              → 52 pattern files, 106 manifest entries, PASS
npm run check:design-tokens:strict                           → 0 violations (after replacing two `gap={4}` literals
                                                                with the theme's own `gap="tight"` (4px) spacing key)
npm run check:enrolled-tailwind                              → 2 enrolled files have baselined findings (unrelated to
                                                                this task); PASS — matches versioned baseline exactly
npm run check:rendered-scope                                 → 22 baselined edges, 0 new, 0 stale — PASS
node scripts/check-surface-census-changed.mjs --base HEAD    → PASS, exit 0
node scripts/check-surface-census.mjs --surface src/components/admin/AdminShell.tsx → GR-1 CENSUS COMPLETE, 8/8 tier1
npm run build-storybook                                      → built in 28.33s, 0 errors
npm run check:locale-leak:mantine-only                       → see "Locale-leak finding and fix" below
npm run build                                                → ✓ compiled, 40/40 static pages, exit 0
npm run check:file-integrity                                 → 80 files clean (after the two locale-leak fix edits)
npm run check:mojibake                                       → PASSED, 0 artifacts in 6945 files (after the fix edits)
```

### Locale-leak finding and fix (self-discovered, not in the original AC list)

The first full run (`.screenshots/locale-leak/2026-09-25T21-05/report.json`, 236 stories × sq/uk/it ×
320/375/1280, `leakCount: 202`) found **18 genuine leak lines under the new canonical admin story IDs**
(`patterns-mantine-adminshell--default`, `--drawer-open`, `patterns-mantine-adminsidebar--default`,
`--management-active`, `--content-active`, `--system-active`), all the same token: `"Footer"` at
`mobile-320`, sq/uk/it. This contradicts the kickoff's own §13.2 expectation ("zero leak lines for story
IDs `patterns-mantine-admin*`").

Root cause: `admin.sidebar.item_footer` (the `/admin/footer` nav item label) was **never translated** —
`messages/{sq,uk,it}.json` all said `"Footer"` verbatim, unchanged by this task (same `t('item_footer')`
call as the pre-migration `AdminSidebar.tsx`). It was invisible to `--mantine-only` before this task only
because the legacy `Admin/AdminSidebar` story title didn't match the Mantine-only title filter — creating
the new canonical `Patterns/Mantine/AdminSidebar`/`AdminShell` stories is what first exposed it to this gate.

Investigated further before fixing: `messages/{sq,it}.json` already use "Footer" as a **deliberate,
established loanword** in multiple other keys in the same admin surface (`admin.footer.tab_footer`,
`admin.footer.save_success` = "Footer u ruajt"/"Footer salvato", `admin.settings.field_site_name_hint`).
`messages/uk.json`, however, already has a **real** translation for the same concept at
`admin.footer.tab_footer: "Футер"` — `item_footer` alone was the gap.

Fix (two edits, both in the `item_footer`/`Footer`-role scope this task's own R7 Story work exposed):
1. `messages/uk.json:698` — `item_footer` changed from `"Footer"` to `"Футер"`, matching uk's own
   already-established `tab_footer` translation (a real content fix, not a loanword mask).
2. `scripts/check-locale-leak.mjs` `PER_STORY_TOKENS` — added `'patterns-mantine-adminshell': ['Footer']`
   and `'patterns-mantine-adminsidebar': ['Footer']`, matching this file's own documented convention
   (Task 624: verified-not-guessed loanword, cited to the exact messages/*.json lines above) for sq/it,
   where "Footer" is the deliberate, consistent existing choice.

Re-run (fast mode, 1 viewport, to keep verification time reasonable — same story/locale coverage):
`.screenshots/locale-leak/2026-09-25T22-12/report.json`, `leakCount: 181`, **zero** entries for any
`patterns-mantine-admin*` story ID (grep-verified). The remaining 181 leaks are all pre-existing,
unrelated components (`Admin/AdminUsersTable`, `CollectionsSection`, `CountButton`, `FavoriteButton`,
`FilterControls`, `ListingFeatureIcon`, `AuthSheet`, `CmsPageView`, `DashboardWorkList`, `ListingCardTrack`,
`ListingDetailView`, `ListingsPageFrame`, `SaveSearchButton`) — none touched by this task, matching the
kickoff's own "known red, Task 836" framing for the gate as a whole.

Re-verified after the fix: `check:i18n` (2380/2380/2380/2380, parity still holds — a value change, not a
key change), `check:stories` (171 files, 0 violations — Check 8's uk.json Cyrillic check still passes),
`check:file-integrity` (80 files clean), `check:mojibake` (0 artifacts, 6945 files).

Two of `git --no-optional-locks grep --untracked` checks: AC1 → empty (above). AC8 → see the disclosed
exception list above.

`git --no-optional-locks diff --stat` — 35 files changed, 308 insertions(+), 636 deletions(-) (includes
Task 869's own 4 pre-existing unrelated files, untouched by this session).

Final hashes: `AdminShell.tsx b33a9386` · `AdminSidebar.tsx 04cd70f5` · `AdminHeader.tsx dab879a2` (new) ·
`AdminLocaleSwitcher.tsx f6f76fa9` · `MantineAppShellFoundation.tsx b30870fc` · `LocaleSwitcher.tsx 329513ba`
· `theme.ts ea8f48b7` · `surface-census-baseline.json e6b895d4` · `messages/uk.json 0a8a2059` (locale-leak
fix) · `check-locale-leak.mjs 7c31fa36` (locale-leak fix).

## Live-app check (§10.5)

No staff/admin session is available in this sandbox (no Supabase credentials for an authenticated
moderator/admin account), so `/admin` itself could not be exercised directly. In its place, the built
`storybook-static` output was served locally and driven with Playwright (no auth required) — see AC3 above
for the real, live-captured computed-style and interaction evidence (navbar 240px / header 72px at 1440,
off-canvas at 390, burger opens it, nav-click closes it). This is real rendered-DOM evidence, not a read of
the source, but it is not a substitute for the owner's own live-app pass at §13.3.

## Owner visual review (§13.3) — not performed by the executor

Per workflow, Storybook/owner-native visual QA is the owner's own pass, not the executor's. The seven owner
matrix rows from the kickoff stand as written; rows 1–5 (the live `/admin` routes) additionally have no
staff session available in this sandbox.

## Assumptions, deviations, limitations

- Both INFERENCEs from the kickoff §5 stood: the sidebar keeps a full 240px rail at ≥`lg` (no icon rail), and
  `gray.0` is the new `AppShell.Main` background.
- `PAGE_TITLES` keeps `'/admin/pages-admin'` exactly, per the kickoff's explicit instruction — flagged here for
  the owner, not fixed in this diff.
- **New, task-authorized extension beyond R6's literal wording:** `AdminLocaleSwitcher` gained an optional
  `pendingOverride?: boolean` prop. R7 requires a canonical "pending" Story state, but the component's real
  pending state is driven by `useTransition` wrapping a genuine `'use server'` Supabase-backed action
  (`setAdminLocale`) that cannot safely be invoked from a Storybook story. `pendingOverride` forces the visual
  without touching the real transition; it is never passed in production (`AdminSidebar` renders
  `<AdminLocaleSwitcher />` with no props). Same file already in R6's edit scope.
- **NavLink hover treatment:** `docs/tailadmin-style-reference.md`'s §6a-link note (cited by R4) documents "no
  hover/press background fill" for the sidebar `menu-item` role, established for the new `transparent` Button
  variant. `AdminSidebar`'s `NavLink` items keep Mantine's own native subtle hover affordance rather than
  suppressing it with bespoke CSS, since R4 only names the *active* treatment ("theme brand treatment, per the
  TailAdmin sidebar reference") and doesn't extend that Button-variant note to NavLink specifically. Flagged
  as an INFERENCE, not silently decided — owner can direct a follow-up if the hover-suppression should extend
  here too.
- **Long-uk-label truncation (§11):** the truncation mechanism (`Text truncate="end"`) is wired and correct,
  but live-measured against the current `uk.json` strings, no nav label is actually long enough to visually
  overflow 240px (widest measured: "Налаштування сайту", fits). Not a defect — recorded honestly rather than
  claimed as visually proven.
- `check:locale-leak:mantine-only` genuinely takes ~40–55 minutes wall-clock for a full run in this sandbox
  (236 stories × 3 locales × 3 viewports via a headless browser) — see "Locale-leak finding and fix" above
  for the one real, self-discovered admin-scoped finding and its fix. The gate as a whole stays red (181
  pre-existing, unrelated leaks) exactly as the kickoff's own §13.2 note predicted (Task 836).
- `messages/uk.json`'s `item_footer` value change and the two `scripts/check-locale-leak.mjs` allowlist
  entries (see above) are new edits beyond §7's listed scope, made to close the locale-leak finding R7's
  own Story work exposed — both are inside the same `item_footer`/"Footer"-label surface R4/R6 already
  touch, not an unrelated expansion.
- Two unrelated stray Node processes (a leftover `check-locale-leak` port-6009 preview server, and a
  `serve`/`http-server` instance this session started for AC3's live measurement) were stopped as part of
  this session's own cleanup; neither belonged to Task 869's uncommitted work, which was left untouched.

No mutating git command was run. No self-approval. `docs/backlog.md`'s 852 line updated with this status.

---

## Re-entry (review 1 remediation, R11–R17) — 2026-09-26

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

Re-entry mode: `remediation`. Evidence root created: `docs/sessions/evidence/task852/` (did not exist).
Task 869's paths were not touched (verified by `git status` before and after — the 5 CMS/`[slug]`/`globals.css`
paths named in §16 are unchanged by this session).

### Findings closed

| # | Finding | Fix | Evidence |
|---|---|---|---|
| F1 | Sidebar footer unreachable (navbar overflow, no scroll) | `AdminSidebar.tsx`: wordmark + nav groups wrapped in a Mantine `ScrollArea flex={1} mih={0}`; footer `Stack` stays outside it | AC11 — see below |
| F2 | No Esc/focus-trap on the mobile drawer | `MantineAppShellFoundation.tsx`: `FocusTrap active={opened && belowNavbarBreakpoint}` around the navbar content, `useHotkeys([['Escape', …]])`, `useFocusReturn` | AC12 — see below |
| F3 | +16px page padding vs. the old `main` | `MantineAppShellFoundation` gains a `padding` prop (default `'md'`, unchanged for existing consumers); `AdminShell` passes `padding={0}` | AC13 — see below |
| F4 | `DrawerOpen` story never opens outside `en` (English-only regex on a localised burger label) | `AdminShell.stories.tsx`: `play` now resolves the burger's accessible name via `storyT(locale, 'admin.mobile_header.aria_open')` | AC14 — see below |
| F5 | Inline `style={{ textDecoration: 'none' }}` on the wordmark; wordmark didn't close the drawer | `AdminSidebar.tsx`: wordmark is now `Anchor component={Link} href="/admin" underline="never" … onClick={onNavigate}` (canonical pattern already used at `src/components/layout/HeaderView.tsx:112`) | AC15 — see below |
| F6 | R8 not implemented for `docs/responsive-storybook-inventory.md` (21 unstruck hits) | Every row/prose/code-block mention of the four retired story IDs (and the two literal component-name strings the AC8 regex also matches) rewritten or replaced with a `RETIRED-852`/paraphrased marker; a Task-852 note added above §1 | AC16/AC8 — see below |
| F7 | Missing/stale evidence, no Files Changed table, stale `storybook-static` vs. source mtimes | This section: retained `.log` per §13.2 command + probe transcripts under `docs/sessions/evidence/task852/`; `build`/`build-storybook` re-run after the final source edit; Files Changed table below | See "Evidence retained" and "Files Changed" below |

### R11–R15 — code changes

- **`src/design-system/mantine/patterns/MantineAppShellFoundation.tsx`** (R12, R13): added `padding` prop
  (`AppShellProps['padding']`, default `'md'`); computed `belowNavbarBreakpoint` via `useMediaQuery` at the
  same `getBreakpointValue(navbarBreakpoint, theme.breakpoints) - 0.1` threshold Mantine's own
  `collapsed.mobile` CSS uses (`assign-navbar-variables.mjs`), so the trap's on/off boundary matches the
  navbar's own visual collapse boundary exactly; wrapped the navbar's rendered content in
  `<FocusTrap active={opened && belowNavbarBreakpoint}><Box h="100%">…</Box></FocusTrap>`; added
  `useFocusReturn({ opened: trapActive })` (returns focus to the burger automatically ~10ms after `opened`
  flips false — no manual "return focus" call needed) and
  `useHotkeys([['Escape', () => { if (trapActive) toggle() }]])`.
- **`src/components/admin/AdminShell.tsx`** (R13): passes `padding={0}` to the foundation.
- **`src/components/admin/AdminSidebar.tsx`** (R11, R15): wordmark+nav-groups `Stack` now wrapped in
  `<ScrollArea flex={1} mih={0} type="auto">`; the footer `Stack` (locale switcher, open-site, logout) is a
  sibling after the `ScrollArea`, not inside it, so it always stays visible; wordmark changed from a `Text
  component={Link} style={{ textDecoration: 'none' }}` to `Anchor component={Link} href="/admin"
  underline="never" … onClick={onNavigate}` — closes the drawer on click like every other nav control now.
- **`src/stories/patterns/mantine/AdminShell.stories.tsx`** (R14): `DrawerOpen`'s `play` reads `globals.locale`
  and resolves the burger's accessible name with `storyT(locale, 'admin.mobile_header.aria_open')` (the same
  message key `AdminHeader.tsx`'s real `tm('aria_open')` call resolves at runtime), instead of the fixed
  English regex `/open menu/i`.

GR-0 canonical-reuse preflight for each: `ScrollArea`, `FocusTrap`, `useHotkeys`, `useFocusReturn` and
`Anchor` are all consumed directly from `@mantine/core`/`@mantine/hooks` with no local wrapper — `REUSE`.
`ScrollArea` matches the project's own existing pattern at
`src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:135`; `Anchor component={Link}
underline="never"` matches `src/components/layout/HeaderView.tsx:112`. No new hardcoded visual value was
introduced (AC1/AC15 below are empty).

`GR-0 CANONICAL REUSE PREFLIGHT — request: ScrollArea/FocusTrap/useHotkeys/useFocusReturn/Anchor (behavior additions to the existing canonical AdminSidebar/MantineAppShellFoundation); semantic queries: "ScrollArea overflow", "FocusTrap trap focus", "Anchor Link underline"; inspected candidates: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:135 (ScrollArea), src/components/layout/HeaderView.tsx:112 (Anchor+Link+underline), src/stories/mantine/primitives/ScrollArea.stories.tsx; decision: REUSE (all five, native Mantine, no wrapper); selected canonical owner: @mantine/core, @mantine/hooks; Mantine/TailAdmin token path: theme.breakpoints (via getBreakpointValue), no new token needed; new hardcoded visual values: NONE; rationale: every added behavior is a stock Mantine primitive/hook consumed the same way the codebase already consumes them elsewhere.`

### R16 — `docs/responsive-storybook-inventory.md`

Every table row, prose sentence and monospace code-block line naming one of the four retired IDs
(`admin-adminlocaleswitcher--default`, `admin-adminmobileheader--default`, `admin-adminsidebar--desktop`,
`admin-adminsidebar--mobile-drawer-open`, `system-adminlayout--admin-toolbar`, and their `--locale-stress`/
variant siblings) or the two literal component-name strings the AC8/AC16 regex also matches
(`AdminMobileHeader`, `AdminLayout.stories`) was rewritten: table rows struck with a `RETIRED (Task 852,
2026-09-25)` note naming the Mantine successor (never restating the literal old ID); prose replaced
`AdminMobileHeader` with "the admin mobile-header component (renamed `AdminHeader`)"; the frozen §7
generated-ID code blocks (a literal 2026-06-08 build snapshot, otherwise never re-touched by Task 788/827's
own precedent) got a one-line note above §7 and each retired ID replaced with a `RETIRED-852-<role>` marker
of the same shape, not a deletion of the row/column layout. Category counts in §3 updated (Admin 19→16 files/
21→17 IDs/18→14 PASS/14→10 OPEN DECISION; System 5→4/5→4/5→4/1→0; Total 39→35/41→36/38→33/21→16). This
reduces the AC8/AC16 exception surface for this file to **zero** — see AC16 below.

### AC1/AC15 — hardcode/style grep (empty)

```
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|[0-9.]+rem|rgba?\(|width: 240|height: 60" -- src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx src/design-system/mantine/patterns/MantineAppShellFoundation.tsx
→ exit 1 (no match)
git --no-optional-locks grep --untracked -n "style=" -- src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminHeader.tsx src/components/admin/AdminLocaleSwitcher.tsx
→ exit 1 (no match)
```

### AC16/AC8 — retired-ID grep, filtered

```
git --no-optional-locks grep --untracked -n -E "admin-adminsidebar|admin-adminmobileheader|admin-adminlocaleswitcher|system-adminlayout|AdminMobileHeader|AdminLayout\.stories" -- src scripts docs .storybook
```

3367 raw lines. `docs/responsive-storybook-inventory.md`: **0** (was 21). Filtering the raw output to exclude
`docs/sessions/**` (AC8's own built-in "historical session logs" exclusion — the majority of the 3367 lines:
every past task's retained `build-storybook` transcript that pre-dates this task's deletions, e.g.
`docs/sessions/evidence/task758/*.json`, `docs/sessions/evidence/task8xx/*-build-storybook.txt`,
`docs/sessions/task467-*.log`, and this file's own §16 §"Locale-leak…" history above) plus the exact R16
exception list (`docs/governance-reports/**`, `docs/reviews/artifacts/**`, `docs/backlog-archive.md`,
`docs/backlog-reserved.md`, `docs/critical-flow-registry.md`, `scripts/task419-qa-shell-fullwidth.mjs`, and
`docs/mantine-responsive-design-system.md:510` — verified that file has exactly that one matching line, the
deletion record itself) leaves **0** remaining lines. Full raw grep and the filtered result are both retained
at `docs/sessions/evidence/task852/17-ac8-grep.log` / `17-ac8-grep-filtered.log`.

### AC11–AC14 — Playwright probe (`docs/sessions/evidence/task852/probe-shell.mjs`)

Run against a `storybook-static` built after the final source edit (`build-storybook.log` mtime
2026-09-26 09:28 > every changed source file's mtime, latest 08:52). Full transcript: `probe-shell.log`;
raw measurements: `probe-shell.json`.

- **AC11** — 1440×900 / 1280×720 / 1024×768 (`--default`) and 390×844 (burger opened): navbar
  `scrollHeight` == `clientHeight` at every width (828/828, 648/648, 696/696, 772/772 — was overflowing
  before this fix, per F1's measured 1198/828 etc.); logout `getBoundingClientRect().bottom` ≤ `innerHeight`
  at every width (876≤900, 696≤720, 744≤768, 820≤844); the nav `ScrollArea` viewport scrolls at 1280×720
  (`scrollHeight` 980 > `clientHeight` 418). **PASS.**
- **AC12** — 390×844: after the burger opens, `document.activeElement` is inside the navbar; 25 Tabs later
  it is still inside the navbar (never escaped); `Escape` returns the navbar to
  `transform: matrix(1, 0, 0, 1, -390, 0)` and moves focus back to the burger
  (`document.activeElement === burgerEl`). 1440×900: `Escape` leaves the navbar at `transform: none`
  (unchanged — it was never collapsed there); Tab (up to 40 presses) eventually moves focus out of the
  navbar entirely — the Default story's `Main` content is a static caption with no focusable element of its
  own, so "left the navbar" (not "landed inside `Main`") is the observable proxy this probe uses for
  "the trap is inactive": a real `FocusTrap` never lets Tab leave its container, so reaching this state
  proves none is engaged above the breakpoint. **PASS.**
- **AC13** — `AdminShell`: `AppShell.Main` `padding-left` = `240px` at 1440, `0px` at 390 (both open and
  closed); `padding-top` = `72px` at both 1440 and 390. `Patterns/Mantine/AppShellFoundation` `Default`
  (no `padding` prop passed, default `'md'`): `padding-left` = `256px` (240 navbar-offset + 16 `md` — still
  non-zero). **PASS.**
- **AC14** — `patterns-mantine-adminshell--drawer-open` with `globals=locale:<l>` for sq/en/uk/it: navbar
  `transform` = `none` (open) in **all four** locales (previously only `en` opened; uk measured
  `matrix(1,0,0,1,-390,0)` — closed — in F4). **PASS.**

### Evidence retained (`docs/sessions/evidence/task852/`)

`01`–`21`: one `.log`/`.json` per §13.2 command, each teed with its own real, unpiped exit code appended as
`EXIT_CODE=<n>` on its own line. `22-check-locale-leak-fast-admin-scope.log`: the admin-scoped substitute run
(see next section). `23-files-changed-hash-object.log`: `git hash-object` for every path this task touched.
`24-build.log`: the final production build. `build-storybook.log`: the final Storybook build.
`probe-shell.mjs`/`.log`/`.json`: the AC11–AC14 probe and its output.

| # | Command | Result |
|---|---|---|
| 01 | `node -p "process.platform + ' ' + process.version"` | `win32 v22.22.3` |
| 02 | `npm run typecheck` | 0 errors, exit 0 |
| 03 | `npm run lint` | 0 errors / 86 pre-existing warnings, exit 0 |
| 04 | `npm run check:i18n` | 2380/2380/2380/2380 parity, exit 0 |
| 05 | `npm run test:admin-freshness` | 6/6 passed, exit 0 |
| 06 | `npm run test:admin` | 5 files / 32 tests passed, exit 0 |
| 07 | `npm run check:stories` | 171 files, 0 violations, exit 0 |
| 08 | `npm run check:story-coverage` | 106/106 covered, 0 unproven, exit 0 |
| 09 | `npm run check:pattern-enrolment` | 52 pattern files / 106 manifest entries, PASS, exit 0 |
| 10 | `npm run check:design-tokens:strict` | 0 violations, exit 0 |
| 11 | `npm run check:enrolled-tailwind` | 2 pre-existing baselined findings (unrelated), PASS, exit 0 |
| 12 | `npm run check:rendered-scope` | 22 baselined edges, 0 new, 0 stale, PASS, exit 0 |
| 13 | `node scripts/check-surface-census-changed.mjs --base HEAD` | PASS, exit 0 |
| 14 | `node scripts/check-surface-census.mjs --surface src/components/admin/AdminShell.tsx` | `GR-1 CENSUS COMPLETE — 8 nodes; tier1 8`, exit 0 |
| — | `npm run build-storybook` | built in 22.73s, exit 0 |
| 22 | `check:locale-leak:mantine-only --fast` | see below |
| 24 | `npm run build` | ✓ compiled, exit 0 |
| 20 | `npm run check:file-integrity` | 121 files clean, exit 0 |
| 21 | `npm run check:mojibake` | 0 artifacts / 6987 files, exit 0 |
| 15 | AC1 grep | empty, exit 1 (no match) |
| 16 | AC15 grep | empty, exit 1 (no match) |
| 17 | AC8/AC16 grep (+ filtered) | 3367 raw → 0 filtered |
| 18 | `git diff --stat` | 35 files, 381(+)/675(−) |
| 19/23 | `git hash-object` | see Files Changed table below |

**`check:locale-leak:mantine-only` — infra note.** Both `npm.cmd run check:locale-leak:mantine-only` (with or
without `-- --fast`) and a first direct-`node` full-scope attempt left a **real, still-running orphaned**
`node scripts/check-locale-leak.mjs` process bound to its hardcoded port 6009 after the wrapping shell
command itself had already returned/reported "completed" — three separate times in this session (PIDs
30460, 30140, 32208, 14764; each `taskkill /F` confirmed via `Get-CimInstance Win32_Process` before killing
so as not to touch an unrelated process). This is the same class of "stray Node process" the review-1
session's own record already disclosed for this identical script. The full 236-story × 3-locale scan itself
never completed cleanly in this sandbox across four attempts. **Substitute evidence, per §16.4's own
allowance** ("`--fast` may replace the full run … must still report zero `patterns-mantine-admin*` leaks;
quote the report path"): ran `node.exe scripts/check-locale-leak.mjs --mantine-only --fast` directly (bypassing
the `npm.cmd` wrapper, which is what let a real child survive the wrapper's own reported exit) against a
`storybook-static/index.json` temporarily filtered, in place, to the 12 `Patterns/Mantine/Admin*` entries
(`AdminHeader` ×3, `AdminLocaleSwitcher` ×2, `AdminShell` ×2, `AdminSidebar` ×4, `AdminSurfacePattern` ×1 —
`storybook-static/` is gitignored, disposable, and was rebuilt in full immediately after via
`npm run build-storybook`, restoring the canonical complete artifact for the probe/AC11–14 run above):

```
🔍  Locale leak detector — fast mode (mantine-only)
Mantine selected: 12; non-Mantine excluded: 0
    Stories: 12 scanned (0 multi-locale demo stories excluded) | Locales: sq/uk/it | Viewports: 1
✅  Locale leak detector: ZERO leaks across 12 stories × sq/uk/it.
    Report: .screenshots/locale-leak/2026-09-26T07-26/report.json
EXIT_CODE=0
```

Zero `patterns-mantine-admin*` leaks confirmed, report path quoted, evidence at
`docs/sessions/evidence/task852/22-check-locale-leak-fast-admin-scope.log`. The full-repo run stays
`PARTIALLY VERIFIED` for this task — infra flake, not a product defect (no admin-surface code changed by
this task touches locale rendering beyond what AC14/the admin-scoped run already proves); flagging for Opus
rather than silently substituting.

### Files Changed (this session's own edits only — full task diff is the git-status list below)

| File | Change | Final `git hash-object` |
|---|---|---|
| `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` | edited (R12, R13) | `aa176801` |
| `src/components/admin/AdminShell.tsx` | edited (R13) | `a915b3c8` |
| `src/components/admin/AdminSidebar.tsx` | edited (R11, R15) | `75cffd57` |
| `src/stories/patterns/mantine/AdminShell.stories.tsx` | edited (R14) | `7a557948` |
| `docs/responsive-storybook-inventory.md` | edited (R16) | `d947bb1e` |
| `docs/sessions/evidence/task852/` | created (R17 — probe + 21 `.log`/`.json` transcripts) | n/a (directory) |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | edited (this section) | `cfae4336` |

### Files Changed — full task-to-date diff (`git status --short`, Task 869's excluded paths omitted)

| File | State | Final `git hash-object` |
|---|---|---|
| `docs/component-catalog.md` | M (review 1) | `77c588ba` |
| `docs/component-coverage-matrix.md` | M (review 1) | `c641fb20` |
| `docs/component-risk-register.md` | M (review 1) | `292bf31b` |
| `docs/mantine-responsive-design-system.md` | M (review 1) | `9e73e95f` |
| `docs/mantine-tailadmin-migration-tracker.md` | M (review 1) | `2ef888a8` |
| `docs/responsive-screenshot-matrix.md` | M (review 1) | `524f1fa1` |
| `docs/responsive-storybook-inventory.md` | M (review 1 + **this session, R16**) | `d947bb1e` |
| `docs/storybook-governance.md` | M (review 1) | `49b064cb` |
| `messages/en.json` | M (review 1) | `c2e24678` |
| `messages/it.json` | M (review 1) | `31214e7a` |
| `messages/sq.json` | M (review 1) | `e12f3a1e` |
| `messages/uk.json` | M (review 1 — `item_footer` fix) | `0a8a2059` |
| `scripts/check-locale-leak.mjs` | M (review 1 — `PER_STORY_TOKENS`) | `7c31fa36` |
| `scripts/check-stories-rendered.mjs` | M (review 1) | `05e6e512` |
| `scripts/governance/component-catalog.mjs` | M (review 1) | `8beca5bb` |
| `scripts/governance/tailwind-entropy.allowlist.json` | M (review 1) | `0769328f` |
| `scripts/mantine-migration-scope.json` | M (review 1 — shared with Task 869; only the four admin pattern entries are this task's) | `66660dab` |
| `scripts/responsive-screenshots.mjs` | M (review 1) | `f702ca8a` |
| `scripts/story-realmode-allowlist.json` | M (review 1) | `47f340aa` |
| `scripts/surface-census-baseline.json` | M (review 1 — R9 writer; not re-run this session per §16's instruction) | `e6b895d4` |
| `src/components/admin/AdminLocaleSwitcher.stories.tsx` | D (review 1) | — deleted |
| `src/components/admin/AdminLocaleSwitcher.tsx` | M (review 1) | `f6f76fa9` |
| `src/components/admin/AdminMobileHeader.stories.tsx` | D (review 1) | — deleted |
| `src/components/admin/AdminMobileHeader.tsx` | D (review 1) | — deleted |
| `src/components/admin/AdminShell.tsx` | M (review 1 + **this session, R13**) | `a915b3c8` |
| `src/components/admin/AdminSidebar.stories.tsx` | D (review 1) | — deleted |
| `src/components/admin/AdminSidebar.tsx` | M (review 1 + **this session, R11/R15**) | `75cffd57` |
| `src/components/shared/LocaleSwitcher.tsx` | M (review 1) | `329513ba` |
| `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` | M (review 1 + **this session, R12/R13**) | `aa176801` |
| `src/design-system/mantine/theme.ts` | M (review 1) | `ea8f48b7` |
| `src/stories/AdminLayout.stories.tsx` | D (review 1) | — deleted |
| `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` | M (review 1) | `3d190051` |
| `src/stories/patterns/mantine/AppShellFoundation.stories.tsx` | M (review 1) | `61adc71e` |
| `src/components/admin/AdminHeader.tsx` | ?? new (review 1) | `dab879a2` |
| `src/stories/patterns/mantine/AdminHeader.stories.tsx` | ?? new (review 1) | `913c50a7` |
| `src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx` | ?? new (review 1) | `1eaace74` |
| `src/stories/patterns/mantine/AdminShell.stories.tsx` | ?? new (review 1 + **this session, R14**) | `7a557948` |
| `src/stories/patterns/mantine/AdminSidebar.stories.tsx` | ?? new (review 1) | `850a62db` |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | ?? new (review 1 + **this session**) | `cfae4336` |
| `docs/sessions/evidence/task852/` | ?? new (**this session, R17**) | n/a (directory, ~24 files) |

---

## Review 3 re-entry (owner return — viewport pin) — 2026-09-26

**Owner return, verbatim:** *"я не приймаю якість patterns-mantine-adminshell бо там не задається ширина
екрану через меню Storybook"* — the Storybook viewport toolbar was greyed out on `AdminShell` `Default`
because three story exports pinned `globals: { viewport: {...} } }`, overriding the toolbar (contradicts
`docs/storybook-governance.md`'s toolbar-only viewport rule and this kickoff's own `viewport=toolbar` GR-3a
receipt). §16/§17's own findings and evidence stand; only R18/R19 are new.

By owner instruction this round: `check:locale-leak` was **not** run — the owner will check it directly.

### R18 — remove every `globals: { viewport … }` pin

- `src/stories/patterns/mantine/AdminShell.stories.tsx`: removed the pin from `Default`
  (`desktop1440`) and `DrawerOpen` (`mobile390`).
- `src/stories/patterns/mantine/AdminHeader.stories.tsx`: removed the pin from `DrawerOpen`
  (`mobile390`).

**AC18** — `git --no-optional-locks grep --untracked -n -E "globals:|viewport" -- src/stories/patterns/mantine/AdminShell.stories.tsx src/stories/patterns/mantine/AdminHeader.stories.tsx src/stories/patterns/mantine/AdminSidebar.stories.tsx src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx`
prints exactly two lines, both comment prose (not a `globals: { viewport … }` pin, and not matched by the
`globals:`-with-colon alternative either — neither reads `context?.globals?.locale`/the `play` destructuring,
which simply don't contain the literal substrings `globals:` or `viewport`):

```
src/stories/patterns/mantine/AdminShell.stories.tsx:50:    // Task 852 R19 (review 3) — width now comes only from the toolbar (R18 removed the viewport
src/stories/patterns/mantine/AdminSidebar.stories.tsx:9:// reachable without a play-function interaction. Locale/viewport (uk long-label stress, 320px)
```

Neither line is a viewport pin or a locale/globals read; both are pre-existing/new comment prose. No code line
matches. **PASS.**

### R19 — `DrawerOpen`'s `play` no-ops when the burger isn't accessible

`AdminShell.stories.tsx` `DrawerOpen`'s `play` now uses `canvas.queryByRole('button', { name: … })` and
returns immediately when it is `null`, instead of `findByRole` (which would time out and throw once the
story can render at >= 1024px, where the burger is `hiddenFrom="lg"` and excluded from the accessibility
tree). Comment updated per the kickoff's exact wording ("open state below 1024 (toolbar width); at >= 1024
the navbar is permanent").

**AC19** — `probe-shell.mjs` re-run against a `storybook-static` rebuilt after this edit, with every viewport
set only by Playwright (never a story pin):

```
[AC14] patterns-mantine-adminshell--drawer-open locale=sq -> navbar transform=none
[AC14] patterns-mantine-adminshell--drawer-open locale=en -> navbar transform=none
[AC14] patterns-mantine-adminshell--drawer-open locale=uk -> navbar transform=none
[AC14] patterns-mantine-adminshell--drawer-open locale=it -> navbar transform=none
[AC19] patterns-mantine-adminshell--drawer-open 1440x900 (no viewport pin) -> navbar transform=none pageErrors=0 consoleErrors=0
All probe-shell.mjs assertions passed (AC3/AC11/AC12/AC13/AC14/AC19).
EXIT_CODE=0
```

390×844 still opens in all four locales; 1440×900 renders with the navbar permanently visible
(`transform: none`), and the now-safe `play()` throws **zero** page errors and **zero** console errors
(`page.on('pageerror')`/`console` listeners attached before navigation). AC11–AC13 re-verified in the same
run (unchanged numbers from the review-1 remediation above). Previous run preserved as
`docs/sessions/evidence/task852/probe-shell.review2.json`; this run overwrote `probe-shell.json`.

### AC20 — gates

| Command | Result | Evidence |
|---|---|---|
| `npm run check:stories` | 171 files, 0 violations, exit 0 | `docs/sessions/evidence/task852/25-check-stories-review3.log` |
| `npm run build-storybook` | built, exit 0 | `docs/sessions/evidence/task852/26-build-storybook-review3.log` |
| `npm run typecheck` | 0 errors, exit 0 | `docs/sessions/evidence/task852/27-typecheck-review3.log` |

`npm run build` was not re-run — only `.stories.tsx` files changed, no `src/components` or
`src/design-system` file did, so `24-build.log` (review-1 remediation) stays current. `check:file-integrity`
(137 files, PASS) and `check:mojibake` (0 artifacts, 7002 files, PASS) re-verified after this edit.

### AC21 (owner) — not performed by the executor

Per §18, the owner re-opens the three named Stories with the toolbar now unlocked and continues the §17 list.

### Files Changed (review 3 re-entry)

| File | Change | Final `git hash-object` |
|---|---|---|
| `src/stories/patterns/mantine/AdminShell.stories.tsx` | edited (R18, R19) | `d4f3f570` |
| `src/stories/patterns/mantine/AdminHeader.stories.tsx` | edited (R18) | `db51b544` |
| `docs/sessions/evidence/task852/probe-shell.mjs` | edited (AC19 probe extension) | `7cfe7a6a` |
| `docs/sessions/evidence/task852/probe-shell.json` | overwritten (new run) | n/a (data) |
| `docs/sessions/evidence/task852/probe-shell.review2.json` | created (prior run preserved) | n/a (data) |
| `docs/sessions/evidence/task852/25-check-stories-review3.log` · `26-build-storybook-review3.log` · `27-typecheck-review3.log` | created | n/a (logs) |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | edited (this section) | — (see below) |
| `docs/backlog.md` | edited (852 line) | — (see below) |

`check:locale-leak` intentionally **not** run this round — owner instruction, verbatim: *"не запускай locale
leak під час виконання задачі, я сам потім перевірю все"*.

---

## Review 4 re-entry (owner matrix, GR-3b) — 2026-09-26

R18/R19 accepted. **Owner matrix, verbatim:** accepted `patterns-mantine-adminshell--default`/`--drawer-open` and
`patterns-mantine-adminheader--default`/`--unknown-path`/`--drawer-open`; returned `Patterns/Mantine/AdminSidebar`
(×4 — *"хардкод, немає адаптивності на мобільних екранах! Не приймаю!"*), `Patterns/Mantine/AdminLocaleSwitcher`
(idle/pending — *"не адаптивна кнопка на мобільних екранах. Хардкод. Не приймаю!"*),
`Mantine/Primitives/LocaleSwitcher` `fullWidth` (*"хардкодна, не адаптивна кнопка. Не приймаю!"*), and
`Patterns/Mantine/AppShellFoundation` `default`/`with-slots` (*"чому в header заголовок … не відцентрований по
вертикалі? Не приймаю!"*). This return became golden rule **GR-3b** (`docs/golden-rules.md:144`): a Story
reproduces the production width contract and never fixes one.

By owner instruction this round: `check:locale-leak` was again **not** run.

### R20–R23 — code changes (Story files + one JSDoc line; production components otherwise unchanged)

- **`AdminSidebar.stories.tsx`** (R20): decorator `Box maw={appShellNavbarWidth} h="100vh" style={{ borderRight: … }}`
  → `Box w={{ base: '100%', lg: theme.other.layout.appShellNavbarWidth }} h="100dvh"`, citing `AdminShell.tsx`'s
  `navbarBreakpoint="lg"` parent contract in the header comment. No `maw`, no `style`, no border.
- **`AdminLocaleSwitcher.stories.tsx`** (R21): same fix — `Box maw={appShellNavbarWidth} p="sm"` →
  `Box w={{ base: '100%', lg: appShellNavbarWidth }} p="sm"`, same parent citation. No `maw`.
- **`LocaleSwitcher.stories.tsx`** (R22): the `fullWidth` demo's `<Stack w={appShellNavbarWidth}>` wrapper lost its
  `w` entirely (now `<Stack>`, fluid) — dropped the now-unused `useMantineTheme` import/call. Caption key
  `locale_switcher_fullwidth_caption` in `en`/`it`/`sq`/`uk` had its parenthesised task reference removed (e.g. en:
  `"fullWidth — trigger fills its container (Task 852, admin sidebar footer)"` → `"fullWidth — trigger fills its
  container"`), leaving the rest of each locale's translation intact.
- **`AppShellFoundation.stories.tsx`** (R23): `WithSlots`'s `headerContent={<div style={{ padding: '0 1rem' }}>…}`
  → `<Group h="100%" px="md"><Text fw={600}>…</Text></Group>` (fills the header height, centres vertically, same
  contract `AdminHeader.tsx` follows); `navbarContent={<div style={{ padding: '0.5rem' }}>…}` → `<Box p="xs"><Text>…</Text></Box>`;
  the shared `makeArgs.children` `<div style={{ padding: '2rem' }}>` → `<Box p="xl">…</Box>`. No `style=` anywhere
  in the file.
- **`MantineAppShellFoundation.tsx`**: `headerContent` JSDoc gained one line: "Task 852 R23/GR-3b: must fill the
  header height and centre vertically (e.g. `Group h="100%"`)." No behavioural change.

GR-0: every replacement is a native Mantine responsive prop/primitive (`w={{ base, lg }}`, `Group h="100%"`,
`Box p=`) already used the same way elsewhere in this task's own code (`AdminShell.tsx`'s `navbarBreakpoint`,
`AdminHeader.tsx`'s `Group h="100%"`) — `REUSE`, no new pattern created.

### AC27 — style/maw/viewport-pin grep (five Story files)

```
git --no-optional-locks grep --untracked -n -E "style=|maw=|globals: \{ ?viewport" -- src/stories/patterns/mantine/AdminShell.stories.tsx src/stories/patterns/mantine/AdminSidebar.stories.tsx src/stories/patterns/mantine/AdminHeader.stories.tsx src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx src/stories/patterns/mantine/AppShellFoundation.stories.tsx
→ exit 1 (no match)
```

`LocaleSwitcher.stories.tsx`'s `fullWidth` block, quoted (no `w=`):

```tsx
<Stack gap="xs">
  <Text size="xs" c="gray.5" fw={500}>
    {t('locale_switcher_fullwidth_caption')}
  </Text>
  <Stack>
    <LocaleSwitcher onSwitch={() => {}} showLabel fullWidth />
  </Stack>
</Stack>
```

### AC22, AC25 — pass; AC23, AC24 — **contradicted at desktop widths, root cause identified, not fixed (out of scope)**

Probe: `docs/sessions/evidence/task852/probe-stories.mjs`, run against a `storybook-static` rebuilt after R20–R23
(`30-build-storybook-review4.log`, exit 0). Full transcript/data: `probe-stories.log` / `probe-stories.json`.

- **AC22 [R20] — PASS.** `patterns-mantine-adminsidebar--default`: sidebar width = viewport width at 320/390
  (320/390, exact) and 240 at 1024/1440 (exact). `scrollWidth` never exceeds `innerWidth` at any of the four
  widths — no horizontal overflow.
- **AC25 [R23] — PASS.** Both `with-slots` and `default`, at 390 and 1440: header-centre-Y to slot-text-centre-Y
  delta = 0.5px / 0.51px (≤ 1px in all four cells).
- **AC23 [R21] — measured, CONTRADICTED at 1024/1440.** `patterns-mantine-adminlocaleswitcher--idle`: 320px
  buttonWidth 296 (expected 296, exact); 390px 366 (expected 366, exact); **1024px and 1440px both measured
  115.859375px (expected 216)** — identical at both desktop widths, i.e. **not** scaling with the container at
  all.
- **AC24 [R22] — measured, CONTRADICTED at 1024/1440.** `mantine-primitives-localeswitcher--default`: 320px
  288/288 (button/parent-Stack, exact match); 390px 358/358 (exact); **1024px 117.984 vs. parent 926, 1440px
  117.984 vs. parent 1342** — the exact same fixed ~118px regardless of container, the same signature as AC23.

**Root cause, read at the source, not inferred:** `src/design-system/mantine/patterns/MantineDropdownMenu.tsx:90-93`
(unchanged by this or any prior Task 852 remediation):

```tsx
) : (
  /* Desktop: alignSelf:flex-start prevents a Stack align="stretch" parent from
     over-stretching the trigger — trigger renders at natural content width. */
  <Box style={{ alignSelf: 'flex-start' }}>
    <Menu disabled={disabled}>
      <Menu.Target>{trigger}</Menu.Target>
```

`LocaleSwitcher`'s trigger `Button fullWidth={fullWidth}` is `MantineDropdownMenu`'s `trigger` prop. Below the
responsive-dropdown's own `isMobile` boundary (`<640`, unrelated to `lg`/1024) the trigger renders inside a flex
column with `align-items: stretch` and genuinely fills its container (matches AC23/AC24's 320/390 cells exactly).
At or above that boundary (`≥640` — true at both 1024 and 1440, this task's two "desktop" probe widths), the
desktop branch deliberately wraps the same trigger in `alignSelf: 'flex-start'`, by design, predating every Task
852 revision — its own comment states the intent is to **stop** a `Stack align="stretch"` ancestor (exactly what
`AdminLocaleSwitcher.tsx`'s footer `Stack` and the primitives demo's `Stack` both are) from over-stretching the
trigger. `fullWidth` on the inner `Button` therefore has no effect once wrapped this way — the trigger always
renders at its own natural content width (~116-118px for "EN" + a chevron, independent of container) on desktop,
by the shared component's existing, intentional contract.

**This is not a defect this remediation introduced, and it is not fixable inside this round's stated scope**
("Production components are unchanged" — §19's own re-entry-mode line; `MantineDropdownMenu.tsx` is a shared
canonical pattern consumed by more than this task's surfaces). Both Story decorators (`AdminSidebar`,
`AdminLocaleSwitcher`) now correctly reproduce their real parent's width contract exactly as R20/R21 specify — the
*container* is genuinely fluid/responsive. What AC23/AC24 additionally assumed — that the *inner trigger* would
visibly stretch to fill that container at desktop widths too — does not hold for any `MantineDropdownMenu`-based
trigger with `fullWidth`, by that component's own long-standing, deliberate design. Per GR-3b's own stated
principle ("a Story reproduces the production width contract and never fixes one"), reproducing this real,
existing compact-desktop-trigger behavior in the Story is the *correct* GR-3b outcome, not a violation of it —
faking a wider trigger in the Story to satisfy AC23/AC24's literal numbers would itself be exactly the kind of
Story-side "fix" GR-3b forbids.

**`TASK SPECIFICATION CONTRADICTION` — reported, not silently resolved either way.** AC23/AC24's desktop-width
targets (240/1024/1440-scaled trigger width) do not match real, verified, pre-existing production behavior in a
component this round may not change. Recommend Opus choose one of: (a) accept the Stories as now faithfully
showing this real compact-desktop-trigger behavior and revise AC23/AC24's desktop cells to that measured
~116-118px content width (no further Story change needed); or (b) file a follow-up task giving
`MantineDropdownMenu`/`LocaleSwitcher` an explicit opt-in to stretch the desktop trigger too (a `stretchTrigger`-
style prop on the shared pattern, not a Story-local hack), if a genuinely full-width desktop dropdown trigger is
wanted somewhere. Not decided here — production components are out of this round's scope by its own instruction.

### GR-3b receipts (AC26)

```
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminshell--default: 320 320/320 · 390 390/390 · 1024 1024/1024 · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminheader--default: 320 320/320 · 390 390/390 · 1024 1024/1024 · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminsidebar--default: 320 320/320 · 390 390/390 · 1024 240/240 · 1440 240/240; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminlocaleswitcher--idle: 320 296/296(box−2sm) · 390 366/366 · 1024 115.86/216(box−2sm, CONTRADICTED — see AC23 above, root cause MantineDropdownMenu.tsx:90-93, not this Story) · 1440 115.86/216(same); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — mantine-primitives-localeswitcher--default (fullWidth block): 320 288/288 · 390 358/358 · 1024 117.98/926(CONTRADICTED, same root cause) · 1440 117.98/1342(same); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-appshellfoundation--with-slots/--default: header-slot vertical-centre delta 390px 0.50-0.51px · 1440px 0.50-0.51px (≤1px both); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
```

Every receipt's own three "NONE" fields are true for the *Story* (AC27's empty grep proves it structurally); the
two flagged CONTRADICTED cells are about the wrapped production trigger's own width, not a Story-side fixed
container, style object, or pin.

### AC28 — gates

| Command | Result | Evidence |
|---|---|---|
| `npm run check:i18n` | 2380/2380/2380/2380 parity, exit 0 | `28-check-i18n-review4.log` |
| `npm run check:stories` | 171 files, 0 violations, exit 0 | `29-check-stories-review4.log` |
| `npm run build-storybook` | built, exit 0 | `30-build-storybook-review4.log` |
| `npm run typecheck` | 0 errors, exit 0 | `31-typecheck-review4.log` |

`check:file-integrity` (152 files, PASS) and `check:mojibake` (0 artifacts, 7009 files, PASS) re-verified after
these edits. `check:locale-leak` intentionally **not** run this round — owner instruction, verbatim (repeated):
*"не запускай Locale leak, я сам перевірю все."*

### AC29 (owner) — not performed by the executor

Per §19, the owner re-opens the four returned groups through the toolbar at 320/390/1024/1440. Given the AC23/AC24
contradiction above, the owner's visual pass on `AdminLocaleSwitcher`/`Primitives/LocaleSwitcher` at 1024/1440
will show the same compact trigger the production app itself renders there — genuinely reproduced, not hidden;
Opus's disposition on the contradiction should inform what "accept" means for those two cells specifically.

### Files Changed (review 4 re-entry)

| File | Change | Final `git hash-object` |
|---|---|---|
| `src/stories/patterns/mantine/AdminSidebar.stories.tsx` | edited (R20) | `13be2bf4` |
| `src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx` | edited (R21) | `6606102a` |
| `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` | edited (R22) | `e24352de` |
| `src/stories/patterns/mantine/AppShellFoundation.stories.tsx` | edited (R23) | `4fa277fd` |
| `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` | edited (R23, JSDoc only) | `e707c10c` |
| `messages/en.json` | edited (R22 caption) | `3e2f90d1` |
| `messages/it.json` | edited (R22 caption) | `6638e9ac` |
| `messages/sq.json` | edited (R22 caption) | `014dac62` |
| `messages/uk.json` | edited (R22 caption) | `81657c1b` |
| `docs/sessions/evidence/task852/probe-stories.mjs` · `.log` · `.json` | created | `82ac9486` (script) |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | edited (this section) | n/a — self-referential (hashing the file changes its own hash); `87fb1793` is its hash immediately before this row was added |
| `docs/backlog.md` | edited (852 line) | `80b4973e` |

---

## Review 5 re-entry (contradiction resolved — `MantineDropdownMenu` extended) — 2026-09-26

R20, R22's Story change, and R23 accepted by re-measurement. **The orchestrator resolved the review-4
`TASK SPECIFICATION CONTRADICTION`** (not an owner call — derivable): rejected accepting the compact
desktop trigger, because the pre-migration `AdminLocaleSwitcher` trigger was full-width at every width
(`className="w-full justify-start …"`, preserved behaviour per agent-contract clause 5) and the owner's own
return said exactly *"не адаптивна кнопка"*. Decision: extend the canonical owner, `MantineDropdownMenu`,
since `LocaleSwitcher → MantineDropdownMenu` is already in this surface's census (tier 1) — no follow-up
task, in scope now.

By owner instruction this round (repeated verbatim): *"не запускай Locale leak, я сам перевірю все"* —
`check:locale-leak` again not run.

### AC31 "before" measurement (done first, per the kickoff's own required order)

Measured on the **pre-R24** `storybook-static` (built 10:42, i.e. after review 4's final Story edit, before
any change this round) at 1440×900, locale uk:

| Story | Trigger | Width (px) |
|---|---|---|
| `mantine-primitives-dropdownmenu--default` | first trigger, text "Дії" (`dm_trigger`) | 51.296875 |
| `mantine-primitives-usermenu--default` | first trigger, text "AKAlba Krasniqi" | 166.484375 |
| `mantine-primitives-usermenu--signing-out` | first (only) trigger, same text | 166.484375 |

Saved as `docs/sessions/evidence/task852/ac31-before.json`; the two lookup scripts used to find the correct
button (the "first non-zero-width real trigger" — the DOM also contains hidden Storybook docs-block
placeholder buttons at width 0, and, for `usermenu--default`, subsequent same-width buttons are open-menu
items, not triggers) are kept as `ac31-before-dropdownmenu.mjs` / `ac31-before-usermenu.mjs`.

### R24–R26 — code changes

- **`src/design-system/mantine/patterns/MantineDropdownMenu.tsx`** (R24): new prop `fullWidthTrigger?: boolean`
  (default `false`, documented). The desktop (`!isMobile`) branch now has two arms: when `fullWidthTrigger` is
  true, `<Box w="100%">` (a Mantine style prop, no `style=` object) wraps `Menu`/`Menu.Target`; the existing,
  untouched `<Box style={{ alignSelf: 'flex-start' }}>` arm stays for the `false` (default) case. The mobile
  branch is completely unchanged.
- **`src/components/shared/LocaleSwitcher.tsx`** (R25): `MantineDropdownMenu` now also receives
  `fullWidthTrigger={fullWidth}`, next to the existing `Button fullWidth={fullWidth}` on the trigger. The
  public header's call (no `fullWidth` passed) gets `fullWidthTrigger={undefined}` → defaults to `false` —
  byte-identical to before.
- **`src/stories/mantine/primitives/DropdownMenu.stories.tsx`** (R26, GR-3a EXTEND — canonical Story of
  `MantineDropdownMenu`, not a new file): one new state block (5th), a text trigger `Button fullWidth` with
  `MantineDropdownMenu fullWidthTrigger`, inside a plain `<Stack>` (fluid, no width prop — GR-3b). Caption key
  `storybook.mantine.dm_fullwidth_trigger_caption` added to `messages/{sq,en,uk,it}.json` (2381 keys now,
  parity holds).

GR-0: `Box w="100%"` reuses the exact Mantine style-prop pattern the same file's own mobile branch and every
other `w={...}` usage in this task already use — `EXTEND` the canonical `MantineDropdownMenu` pattern itself
(the only correct disposition per the review-5 decision above), no new component, no local style object.

### AC30–AC33 — probe (`probe-stories.mjs`, extended)

Re-run against a `storybook-static` rebuilt after R24–R26 (`33-build-storybook-review5.log`, exit 0). Full
transcript/data: `probe-stories.log` / `probe-stories.json`.

- **AC30 [R24, R25] — PASS.** `adminlocaleswitcher--idle`, uk: 320px 296/296, 390px 366/366, **1024px
  216/216, 1440px 216/216** (was 115.86 before this fix — now exact). Clicking the trigger opens the bottom
  sheet at 320/390 and the anchored `.mantine-Menu-dropdown` at 1024/1440, in every case.
  `mantine-primitives-localeswitcher--default` `fullWidth` block: 320px 288/288, 390px 358/358, **1024px
  926/926, 1440px 1342/1342** (was 117.98 vs. 926/1342 before — now exact).
- **AC31 [R24] — PASS, zero regression.** All three default-branch triggers measure the *exact same* width
  before and after, at 1440: `dropdownmenu--default` 51.296875 → 51.296875; `usermenu--default` 166.484375 →
  166.484375; `usermenu--signing-out` 166.484375 → 166.484375.
- **AC32 [R26] — PASS.** The new `fullWidthTrigger` state's trigger matches its fluid parent `Stack` exactly:
  390px 358/358, 1440px 1342/1342 (same numbers as the primitives `LocaleSwitcher` fullWidth block, as
  expected — same underlying mechanism).
- **AC33 — no `CONTRADICTED` cell remains.** Both flagged review-4 receipts are re-issued below with the new,
  matching numbers.

### GR-3b receipts, re-issued (AC33)

```
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminlocaleswitcher--idle: 320 296/296(box−2sm) · 390 366/366 · 1024 216/216(box−2sm) · 1440 216/216(same); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — mantine-primitives-localeswitcher--default (fullWidth block): 320 288/288 · 390 358/358 · 1024 926/926 · 1440 1342/1342; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — mantine-primitives-dropdownmenu--default (fullWidthTrigger state): 390 358/358 · 1440 1342/1342; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
```

### AC32 gates

| Command | Result | Evidence |
|---|---|---|
| `npm run check:i18n` | 2381/2381/2381/2381 parity, exit 0 | `34-check-i18n-review5.log` |
| `npm run check:stories` | 171 files, 0 violations, exit 0 | `35-check-stories-review5.log` |
| `npm run check:story-coverage` | 106/106 covered, exit 0 | `36-check-story-coverage-review5.log` |
| `npm run typecheck` | 0 errors, exit 0 | (console, re-verified clean before R24-R26 commit) |
| `npm run lint` | 0 errors / 88 warnings, none in touched files, exit 0 | `32-lint-review5.log` |
| `npm run build-storybook` | built, exit 0 | `33-build-storybook-review5.log` |
| `npm run build` | production code changed this round — exit 0 | `37-build-review5.log` |

`check:file-integrity` (177 files, PASS) and `check:mojibake` (0 artifacts, 7038 files, PASS) re-verified.
No `style=`/`maw=` was added to `MantineDropdownMenu.tsx` — the pre-existing occurrences (default branch's
`alignSelf`, the mobile bottom-sheet's item rows) are untouched; the new `fullWidthTrigger` branch uses only
the Mantine `w` prop.

### AC34 (owner) — not performed by the executor

Per §20, the owner re-opens the four §19 groups plus `Mantine/Primitives/DropdownMenu` at 320/390/1024/1440.
The AC23/AC24/AC30 numbers should now match visually — no compact desktop trigger remains on either
`AdminLocaleSwitcher` or the primitives demo.

### Files Changed (review 5 re-entry)

| File | Change | Final `git hash-object` |
|---|---|---|
| `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` | edited (R24) | `94c5dc06` |
| `src/components/shared/LocaleSwitcher.tsx` | edited (R25) | `a4e6063f` |
| `src/stories/mantine/primitives/DropdownMenu.stories.tsx` | edited (R26) | `26c17c97` |
| `messages/en.json` | edited (R26 caption key) | `3dff8f8c` |
| `messages/it.json` | edited (R26 caption key) | `cdde3199` |
| `messages/sq.json` | edited (R26 caption key) | `78001fa0` |
| `messages/uk.json` | edited (R26 caption key) | `3d23ae14` |
| `docs/sessions/evidence/task852/probe-stories.mjs` | edited (AC30-33 extension) | `dd94e1fa` |
| `docs/sessions/evidence/task852/ac31-before.json` · `ac31-before-dropdownmenu.mjs` · `ac31-before-usermenu.mjs` | created | `45988b05` (json) |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | edited (this section) | — self-referential |
| `docs/backlog.md` | edited (852 line) | — (see backlog.md itself) |

---

## Review 7 re-entry (D852-1: 640-1023 is a drawer, not the mobile layout) — 2026-09-26

**Review 6 (`PARTIALLY VERIFIED`) accepted R24-R26** on independent re-measurement; only AC34 (the owner
pass) was outstanding.

**Owner matrix, review 7.** Accepted: `mantine-primitives-localeswitcher--default`,
`patterns-mantine-appshellfoundation--default`/`--with-slots`, `mantine-primitives-dropdownmenu--default`.
**Returned:** `patterns-mantine-adminsidebar--*` (×4) and `patterns-mantine-adminlocaleswitcher--idle`/
`--pending` — *"Чому сайдбар перебудовується на мобільну версію вже після 1024px? Що це за нове правило?
Це пряме порушення!"*.

**Cause, read at the source (orchestrator defect, not the executor's):** no project rule asked for a
full-width sidebar at 640–1023; the project's own mobile boundary is `sm` = 640. The full width came from
Mantine's own `AppShell.Navbar` mechanics — below `navbar.breakpoint`, an open navbar is forced to
`--app-shell-navbar-width: 100%` regardless of any other breakpoint. R3/R20 adopted that without checking it
against the 640 boundary; the pre-migration drawer was a 256px shadcn `Sheet`, never full width.

**Owner decision D852-1 (chosen verbatim: "Drawer 240px (Recommended)"):**

```
<640      burger → drawer 100% (мобільна)
640–1023  burger → drawer 240px поверх контенту
≥1024     постійний сайдбар 240px
```

By owner instruction, `check:locale-leak` again not run this round.

### R27–R31 — code changes

- **`src/design-system/mantine/patterns/MantineAppShellFoundation.tsx`** (R27, R28, R29): below
  `navbarBreakpoint`, navigation now renders inside a Mantine core `Drawer` (`position="left"`,
  `padding="sm"`, `withCloseButton`, `closeButtonProps={{ 'aria-label': drawerCloseLabel }}`) instead of
  `AppShell.Navbar`. `AppShell.Navbar`'s `collapsed.mobile` is now hardcoded `true` (always collapsed below
  the breakpoint, regardless of `opened`) rather than `!opened`. `Drawer`'s `size` is
  `useMatches({ base: '100%', sm: rem(theme.other.layout.appShellNavbarWidth) })`: 100% below 640, 240px from
  640 up to `navbarBreakpoint`. **R28 (no duplicate mount):** `navContent` is a single JSX value computed
  once; `AppShell.Navbar` renders it only when `!belowNavbarBreakpoint`, and the whole `<Drawer>` element is
  only present in the tree at all when `belowNavbarBreakpoint` — never both simultaneously, so
  `[data-testid="admin-sidebar"]` (or any `navbarContent`) exists exactly once regardless of open/closed/width
  (AC37). The `Drawer` uses `keepMounted` so that single instance survives open/close toggles instead of
  unmounting every time. **R29:** `FocusTrap`, `useHotkeys('Escape')` and `useFocusReturn` are removed
  entirely — `Drawer`'s `ModalBase` defaults (`trapFocus`, `closeOnEscape`, `closeOnClickOutside`,
  `returnFocus`, all `true`) provide the same guarantees natively (AC36 confirms this, including two behaviours
  the hand-built trap never had: overlay-click-to-close and nav-link-click-to-close, both native to `Drawer`).
  New prop `drawerCloseLabel?: string` (JSDoc'd) for the close button's accessible name.
- **`src/components/admin/AdminShell.tsx`**: adds `useTranslations('admin.sidebar')` and passes
  `drawerCloseLabel={t('aria_close')}` (an existing 4-locale key, unchanged).
- **`src/stories/patterns/mantine/AdminSidebar.stories.tsx`** and
  **`…/AdminLocaleSwitcher.stories.tsx`** (R30, GR-3b): decorator `w={{ base: '100%', lg: … }}` →
  `w={{ base: '100%', sm: … }}` — no `lg` key any more, since the sidebar is 240px wide from `sm` (640) up
  either way (drawer 640–1023, fixed navbar ≥1024), matching D852-1/R27 exactly. Comments updated to cite
  D852-1/R27 instead of the retired `navbarBreakpoint="lg"`-only framing.
- **R31 (verification only, no code change needed):** `AdminSidebar.tsx`'s `onNavigate` prop (unchanged) still
  closes the drawer on nav-link click — confirmed by AC36's nav-click-close check. `AdminShell.stories.tsx`
  `DrawerOpen`'s `play` (from review 3, `queryByRole`-based, already safe when the burger is inaccessible)
  needed no change. `AppShellFoundation.stories.tsx` `Default`/`WithSlots` (default `navbarBreakpoint="sm"`,
  unchanged) now get the real `Drawer` below 640 — confirmed unaffected by AC30-32's already-passing numbers.

GR-0: `Drawer` is consumed directly from `@mantine/core`, the same way `Menu`/`FocusTrap`/every other Mantine
overlay primitive already is in this codebase — `REUSE`, no new pattern, no wrapper.

### AC39 — no hand-built trap remains

```
git --no-optional-locks grep --untracked -n -E "FocusTrap|useHotkeys|useFocusReturn" -- src/design-system/mantine/patterns/MantineAppShellFoundation.tsx
→ exit 1 (no match)
```

AC1's hardcode grep (unchanged 5-file target) also still prints nothing.

### AC35–AC38 — probe (`probe-drawer.mjs`, new)

Run against a `storybook-static` rebuilt after R27–R31 (`38-build-storybook-review7.log`, exit 0). Full
transcript/data: `probe-drawer.log` / `probe-drawer.json`.

- **AC35 [R27] — PASS.** `.mantine-Drawer-content` width: 390px → 390 (exact), 768px → 240 (exact),
  960px → 240 (exact); overlay visible at all three; `AppShell.Main` `padding-left` = `0px` at all three
  (content not pushed). At 1024px and 1440px: `.mantine-Drawer-content` is **not in the DOM at all**
  (`drawerContentInDom=false` — the `<Drawer>` element itself is unmounted above the breakpoint, not merely
  hidden); the burger is not visible; the fixed navbar measures 240px.
- **AC36 [R27, R29] — PASS.** At 390 and 768, after a real click on the burger: focus lands inside
  `.mantine-Drawer-content`; 25 Tabs never move it out. `Escape` closes the drawer and returns focus to the
  burger. At 768, a mouse click on the overlay outside the 240px panel (760,450) closes it. At 390, clicking a
  nav link inside the drawer closes it. The close button's `aria-label` is exactly `"Закрити меню"` at both
  widths, matching `admin.sidebar.aria_close`'s uk value.

  **One measurement note, resolved, not a defect:** the probe originally drove this scenario through the
  `--drawer-open` Story's own `play()` (testing-library's `userEvent.click`), and at 390px specifically —
  not 768px — focus stayed on the burger instead of auto-moving into the drawer, even after a 2-second wait;
  Tab still worked correctly (moved focus into the drawer, trap intact) once pressed. Re-tested with a **real**
  `page.click()` on the burger (bypassing the Story's synthetic click) at both widths: auto-focus-on-open
  worked correctly at both 390 and 768. This is a testing-library synthetic-event artifact in how the probe
  drove the interaction, not a Mantine or product defect — the probe now uses a real click.
- **AC37 [R28] — PASS.** `[data-testid="admin-sidebar"]` count is exactly `1` in all five measured cases:
  390 closed, 390 open, 768 closed, 768 open, and 1440 (fixed, always "closed" in the drawer sense).
- **AC38 [R30] — PASS, GR-3b receipts re-issued below.** `adminsidebar--default`: 320/390 match the viewport
  exactly, 240 at 768/1024/1440 (exact). `adminlocaleswitcher--idle`: 296/366 at 320/390 (box − 2×sm, exact),
  **216 at 768, 1024 and 1440** (was the review-4/5 boundary at `lg`; now the boundary is `sm`, so 768 also
  gets the 240-box/216-trigger value). No horizontal overflow (`scrollWidth ≤ innerWidth`) at any of the five
  widths for either Story.

### GR-3b receipts (AC38)

```
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminsidebar--default: 320 320/320 · 390 390/390 · 768 240/240 · 1024 240/240 · 1440 240/240; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminlocaleswitcher--idle: 320 296/296(box−2sm) · 390 366/366 · 768 216/216(box−2sm) · 1024 216/216 · 1440 216/216; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminshell--default/--drawer-open: 390 drawer 390/viewport 390 · 768 drawer 240/viewport 768 (overlay, Main padding-left 0px — not pushed) · 960 drawer 240/viewport 960 · 1024 fixed-navbar 240/viewport 1024 (no drawer in DOM) · 1440 fixed-navbar 240/viewport 1440 (no drawer in DOM); overflow: none; fixed-width containers: NONE (the 240px at >=1024 is the intentional permanent sidebar per D852-1, not a Story-side fix); style objects: NONE; viewport pins: NONE.
```

### AC40 — gates

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck` | 0 errors, exit 0 | (re-verified clean, console) |
| `npm run lint` | 0 errors / 89 warnings, none in touched files, exit 0 | `39-lint-review7.log` |
| `npm run check:i18n` | 2381/2381/2381/2381 parity, exit 0 | `40-check-i18n-review7.log` |
| `npm run check:stories` | 171 files, 0 violations, exit 0 | `41-check-stories-review7.log` |
| `npm run check:story-coverage` | 106/106 covered, exit 0 | `42-check-story-coverage-review7.log` |
| `npm run test:admin-freshness` | 6/6 passed, exit 0 | `43-test-admin-freshness-review7.log` |
| `npm run build-storybook` | built, exit 0 | `38-build-storybook-review7.log` |
| `npm run build` | production code changed this round — exit 0 | `44-build-review7.log` |

`check:file-integrity` (199 files, PASS) and `check:mojibake` (0 artifacts, 7058 files, PASS) re-verified.

### AC41 (owner) — not performed by the executor

Per §22, the owner re-opens `patterns-mantine-adminsidebar--*`, `patterns-mantine-adminlocaleswitcher--*`,
`patterns-mantine-adminshell--default` and `--drawer-open` at 320/390/768/1024/1440 and accepts. The sidebar
should now show a 240px overlay drawer (not full width) at 640–1023, matching D852-1.

### Files Changed (review 7 re-entry)

| File | Change | Final `git hash-object` |
|---|---|---|
| `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` | edited (R27, R28, R29) | `1ca661a7` |
| `src/components/admin/AdminShell.tsx` | edited (drawerCloseLabel) | `a367402d` |
| `src/stories/patterns/mantine/AdminSidebar.stories.tsx` | edited (R30) | `e9cba727` |
| `src/stories/patterns/mantine/AdminLocaleSwitcher.stories.tsx` | edited (R30) | `ff955780` |
| `docs/sessions/evidence/task852/probe-drawer.mjs` · `.log` · `.json` | created | `4a17742b` (script) |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | edited (this section) | — self-referential |
| `docs/backlog.md` | edited (852 line) | — (see backlog.md itself) |

## Status (superseded by Review 8 below): `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (review 7)

No mutating git command was run. No self-approval. `docs/backlog.md`'s 852 line updated with this status.

---

## Review 8 re-entry (2026-09-26) — G1/G2: the drawer body must bound `AdminSidebar`

**Re-entry mode: `remediation`**, per kickoff §23. Accepted from review 8: R27–R31 (unchanged). Findings closed
here: **G1** (the drawer body has no bounded height, so the whole drawer scrolls and logout falls below the
fold) and **G2** (GR-0 missed the canonical `MantineDrawer.tsx`, which already solved this exact problem in
Task 567 Fix 4).

### GR-0 CANONICAL REUSE PREFLIGHT (R33)

`GR-0 CANONICAL REUSE PREFLIGHT — request: bounded-height body for the below-breakpoint navigation Drawer (R27's core `@mantine/core` Drawer); semantic queries: "drawer flex column body", "drawer scroll bounded footer", "MantineDrawer", "MobileNavDrawer", "DialogDrawerPattern"; inspected candidates: src/design-system/mantine/patterns/MantineDrawer.tsx (Story Mantine/Primitives/Drawer — Task 567 Fix 4's content/body flex-column split, already solves this exact class of defect for its own consumers), src/components/layout/MobileNavDrawer.tsx (consumes MantineDrawer, not core Drawer — not a fit, it becomes the bottom sheet below 640 and D852-1 requires a plain left Drawer there instead), src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx (a Dialog/Drawer choice pattern, not a bounded-body rule — no relevant export); decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/MantineDrawer.tsx (its Task 567 Fix 4 rule, exported as the named constant `drawerFlexColumnStyles` so `MantineAppShellFoundation`'s own core `Drawer` can consume the identical rule without copying it); Mantine/TailAdmin token path: n/a (structural flex-column CSS, no new visual token); new hardcoded visual values: NONE; rationale: `MantineDrawer` itself is not reusable whole here (it switches to `ResponsiveBottomSheet` below 640, and D852-1 needs a 100%-wide left Drawer there instead, plus its body already wraps children in its own scroll region, which would nest a second scroll around AdminSidebar's own ScrollArea) — the fix therefore extends its canonical owner by exporting the shared rule, not by re-deriving it or copying it into MantineAppShellFoundation.tsx.`

### R32 — implementation

- **`src/design-system/mantine/patterns/MantineDrawer.tsx`**: exports a new named constant
  `drawerFlexColumnStyles = { content: { display:'flex', flexDirection:'column', overflow:'hidden' }, body: { flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' } }` (`body` carries no `padding`, so a
  consumer's own padding stays in control). `MantineDrawer`'s own `Drawer` `styles` now reads
  `content: drawerFlexColumnStyles.content` and `body: { ...drawerFlexColumnStyles.body, padding: 0 }` — its own
  `padding: 0` override and title-only header border are unchanged, so its rendered output is byte-identical
  (proven by AC43 below).
- **`src/design-system/mantine/patterns/MantineAppShellFoundation.tsx`**: imports `drawerFlexColumnStyles` from
  `./MantineDrawer` and passes it as the below-breakpoint core `Drawer`'s `styles` prop (`styles={drawerFlexColumnStyles}`).
  `padding="sm"` stays on the `Drawer` itself (unchanged), so the body still gets Mantine's own `sm` inset —
  `drawerFlexColumnStyles.body` carries no `padding`, so it never overrides that prop. Result: the `Drawer` body is
  now a bounded flex column, so `navContent`'s (`AdminSidebar`'s) `h="100%"` resolves against a real height instead
  of growing to full content height. `AdminSidebar.tsx` itself is unchanged, per R32's own text.

### Owner-reported addendum (outside R32/R33, fixed in the same pass)

Mid-session, the owner reported live: *"у AdminSidebar Story я бачу хардкод, ти не витримуєш стилі відступів від
країв екранів!"* ("I see hardcode in the AdminSidebar Story, you don't maintain the edge-spacing styles"). Verified:
`src/stories/patterns/mantine/AdminSidebar.stories.tsx`'s decorator wrapped `AdminSidebar` in a bare `Box` with
**no padding**, while in *both* production paths `AdminSidebar` (`navbarContent`/`navContent`) is mounted directly
inside a padded parent — `AppShell.Navbar p="sm"` at/above the breakpoint, `Drawer padding="sm"` below it
(`MantineAppShellFoundation.tsx`). The sibling `AdminLocaleSwitcher.stories.tsx` decorator already carries `p="sm"`
for the identical reason (R21, review 5) — this file had it omitted. Fix: added `p="sm"` to the decorator `Box`
(no `style=`, no raw px — a Mantine spacing-token prop, matching the sibling file exactly).

**Consequence, verified, not silently absorbed:** this makes `[data-testid="admin-sidebar"]`'s own rendered width
216px at ≥768 (240 box − 2×12px `sm` padding), not 240px as `AC22`/`AC38`'s original wording assumed — the same
formula `adminlocaleswitcher--idle` already used and passed before this fix (`boxWidth − 2×SM_PX`). The pre-fix
sidebar Story reproduced 240px only because its decorator's missing padding accidentally matched AC22/AC38's literal
number, not because that number reflected the true production contract. `probe-drawer.mjs`'s AC38 sidebar-width
formula is updated to match (now `boxWidth − 2×SM_PX`, identical to the localeswitcher block), and the corrected
values are measured below. **This supersedes AC22's/§19 R20's literal "240" for the sidebar element's own width**;
the navbar/drawer *container* is still exactly 240 — only the padded child element inside it is 216. Flagged for
Opus to formalize (this is derivable from the existing, already-accepted AdminLocaleSwitcher precedent, the same
class of correction review 5 made for the DropdownMenu trigger — not a new design decision).

### AC42 — the drawer body bounds the sidebar; logout stays visible

Probe: `probe-drawer.mjs`, extended (real `page.click()` on the burger, `patterns-mantine-adminshell--default`).
Fresh `storybook-static` built at `46-build-storybook-review8.log` (2026-09-26 14:0x, after the last source edit).
Full transcript: `probe-drawer.log`; data: `probe-drawer.json`; the review-7 output is retained as
`probe-drawer.review7.json`.

| Size | logout `bottom` | `innerHeight` | `.mantine-Drawer-content` client/scroll | close-button `top` | nav `ScrollArea` viewport client/scroll |
|---|---|---|---|---|---|
| 390×844 | 820 | 844 | 844 / 844 | 18 | 566 / 980 (scrolls) |
| 768×1024 | 1000 | 1024 | 1024 / 1024 | 18 | 746 / 980 |
| 768×600 | 576 | 600 | 600 / 600 | 18 | 322 / 980 (scrolls) |
| 960×540 | 516 | 540 | 540 / 540 | 18 | 262 / 980 |

Logout `bottom ≤ innerHeight` at all four sizes (was 1234 at every size before the fix, per review 8's own
measurement). `.mantine-Drawer-content` `scrollHeight ≤ clientHeight + 1` at all four (the drawer itself no longer
scrolls — only the nav `ScrollArea` viewport does). Close button `top ≥ 0` at all four. At 390×844 and 768×600 the
nav `ScrollArea` viewport scrolls (`scrollHeight 980 > clientHeight`), confirming G1's fix routes scrolling to the
nav region, not the whole drawer.

### AC43 — no regression on `MantineDrawer`'s existing consumers

"Before" values captured by `docs/sessions/evidence/task852/ac43-before-probe.mjs` against the storybook-static
build that predates this session's edit (`storybook-static` built 2026-09-26 13:40, review-7's own build — read
directly, not rebuilt, to guarantee it precedes R32). Saved as `ac43-before.json`. "After" values captured by the
same measurement, folded into `probe-drawer.mjs`, against the fresh post-edit build.

| Story | Field | Before | After | Identical |
|---|---|---|---|---|
| `mantine-primitives-drawer--default` | content `display`/`flex-direction`/`overflow-y` | flex / column / hidden | flex / column / hidden | ✅ |
| | body `flex-grow`/`min-height`/`padding-top`/`overflow-y` | 1 / 0px / 0px / hidden | 1 / 0px / 0px / hidden | ✅ |
| | header `border-bottom-width` | 1px | 1px | ✅ |
| `mantine-primitives-mobilenavdrawer--default` | content `display`/`flex-direction`/`overflow-y` | flex / column / hidden | flex / column / hidden | ✅ |
| | body `flex-grow`/`min-height`/`padding-top`/`overflow-y` | 1 / 0px / 0px / hidden | 1 / 0px / 0px / hidden | ✅ |
| | header `border-bottom-width` | 0px | 0px | ✅ |

Every value is byte-identical before/after — `MantineDrawer`'s own consumers (its own Story and `MobileNavDrawer`)
render exactly as before.

### AC44 — AC35–AC38 re-run, all pass; GR-3b receipt re-issued

Re-run inside the same `probe-drawer.mjs` invocation (see `probe-drawer.log`/`.json`). AC35 (drawer width/overlay/
Main padding-left), AC36 (focus trap/Esc/overlay-click/nav-click/close-label) and AC37 (exactly one
`admin-sidebar`) are unchanged from review 8's own passing values. AC38 now reflects the padding fix above:

```
[AC38] adminsidebar--default 320px -> sidebarWidth=296 expected=296
[AC38] adminsidebar--default 390px -> sidebarWidth=366 expected=366
[AC38] adminsidebar--default 768px -> sidebarWidth=216 expected=216
[AC38] adminsidebar--default 1024px -> sidebarWidth=216 expected=216
[AC38] adminsidebar--default 1440px -> sidebarWidth=216 expected=216
```

(identical to `adminlocaleswitcher--idle`'s own 296/366/216/216/216 — the two footer siblings now measure the same,
confirming the padding fix is coherent). No horizontal overflow at any width.

```
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminshell--default/--drawer-open: 390 drawer 390/viewport 390 (logout bottom 820/844) · 768 drawer 240/viewport 768 (logout bottom 1000/1024, and 576/600 at 768×600) · 960 drawer 240/viewport 960 (logout bottom 516/540) · 1024 fixed-navbar 240/viewport 1024 (no drawer in DOM) · 1440 fixed-navbar 240/viewport 1440 (no drawer in DOM); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.
GR-3b STORY RESPONSIVE CHECK — patterns-mantine-adminsidebar--default: 320 296/296 · 390 366/366 · 768 216/216 · 1024 216/216 · 1440 216/216; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE. (Corrected from review-7's 320/390/240/240/240 — the decorator's missing `p="sm"` is fixed; see the owner-reported addendum above.)
```

### AC45 — gates

| Command | Result | Evidence |
|---|---|---|
| `npm run typecheck` | 0 errors, exit 0 | `45-typecheck-review8.log` |
| `npm run lint` | 0 errors / 91 warnings, none in touched files, exit 0 | `47-lint-review8.log` |
| `npm run check:stories` | 171 files, 0 violations, exit 0 | `48-check-stories-review8.log` |
| `npm run check:story-coverage` | 106/106 covered, exit 0 | `49-check-story-coverage-review8.log` |
| `npm run check:pattern-enrolment` | 52 pattern files, all enrolled, exit 0 | `50-check-pattern-enrolment-review8.log` |
| `npm run test:admin-freshness` | 6/6 passed, exit 0 | `51-test-admin-freshness-review8.log` |
| `npm run build-storybook` | built, exit 0 | `46-build-storybook-review8.log` |
| `npm run build` | production code changed this round — exit 0 | `52-build-review8.log` |

Read-only `hash-object` of the two AC45-named files plus the Story fix: `55-hash-object-review8.log`
(`MantineDrawer.tsx fc7c8f96`, `MantineAppShellFoundation.tsx 978c29ac`, `AdminSidebar.stories.tsx fa4c2bde`).

AC1's hardcode grep (5 named files) prints nothing (`53-ac1-grep-review8.log`, exit 1/no-match). AC39's grep
(`FocusTrap|useHotkeys|useFocusReturn` in `MantineAppShellFoundation.tsx`) prints nothing (`54-ac39-grep-review8.log`,
exit 1/no-match) — R29's removal from review 7 was not reintroduced. AC27's grep re-verified clean after the
`AdminSidebar.stories.tsx` addendum edit (`56-ac27-grep-recheck.log`, exit 1/no-match — `p="sm"` is a Mantine prop,
not `style=`/`maw=`/a viewport pin). GR-1 census re-run: `57-check-surface-census-review8.log` — 8 nodes, all
tier1, `manifest:yes story:yes` (matches review 8's own count exactly).

### AC41 (owner) — not performed by the executor

Unchanged from review 8: the owner checks that logout is visible without scrolling in the open drawer at 390 and
768, plus the remaining §17/§19/§21/§22 owner-matrix items. The `AdminSidebar` Stories the owner is about to re-open
now also carry the `p="sm"` edge-spacing fix from the addendum above — worth a fresh look at the same widths.

### Files Changed (review 8 re-entry)

| File | Change | Final `git hash-object` |
|---|---|---|
| `src/design-system/mantine/patterns/MantineDrawer.tsx` | edited (R32 — exports `drawerFlexColumnStyles`) | `fc7c8f96` |
| `src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` | edited (R32 — consumes the shared constant) | `978c29ac` |
| `src/stories/patterns/mantine/AdminSidebar.stories.tsx` | edited (owner-reported addendum — `p="sm"`) | `fa4c2bde` |
| `docs/sessions/evidence/task852/ac43-before-probe.mjs` · `ac43-before.json` | created (AC43 "before" capture) | n/a (evidence) |
| `docs/sessions/evidence/task852/probe-drawer.mjs` | edited (AC38 formula fix, AC42/AC43 added) | n/a (evidence, superseding script) |
| `docs/sessions/evidence/task852/probe-drawer.json` · `.log` | overwritten (fresh run) | n/a (evidence) |
| `docs/sessions/evidence/task852/probe-drawer.review7.json` | created (review-7 output preserved) | n/a (evidence) |
| `docs/sessions/evidence/task852/45-*.log` … `57-*.log` | created (AC45 gate transcripts) | n/a (evidence) |
| `docs/sessions/2026-09-25-task852-admin-shell-mantine.md` | edited (this section) | — self-referential |
| `docs/backlog.md` | edited (852 line) | — (see backlog.md itself) |

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

No mutating git command was run. No self-approval. `docs/backlog.md`'s 852 line updated with this status.

---

## Status (superseded by Review 5 above): `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (review 5)

No mutating git command was run. No self-approval. `docs/backlog.md`'s 852 line updated with this status.

---

## Status (superseded by Review 5 above): `PARTIALLY IMPLEMENTED`

R20/R22/R23 fully close their findings (AC22, AC24's mobile cells, AC25, AC27, AC28 all pass). R21's Story-file
change (AC23) is implemented exactly as specified and correctly reproduces the real production width contract,
but AC23's own desktop-width numeric target — and AC24's equivalent desktop cells — are contradicted by verified,
pre-existing, out-of-scope production behavior in `MantineDropdownMenu.tsx`, documented above under "root cause."
This is reported as a `TASK SPECIFICATION CONTRADICTION`, not silently resolved: no production file was changed to
force a match, and no Story was given a fake width to paper over it. Awaiting Opus's disposition on AC23/AC24's
desktop cells before this can move to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

No mutating git command was run. No self-approval. `docs/backlog.md`'s 852 line updated with this status.
