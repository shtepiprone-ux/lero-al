# Task 895 — `/{locale}/cabinet` on canonical Mantine (shell, profile, listings, saved searches, recently viewed)

Sprint 84 · **P2** · QA profile **Q4** (legacy public surface → Mantine; carries the critical flows "Self-delete + email
reuse", "Email change", "Archetype B: authenticated self-scoped write", "Phone entry" and the static proof of "Listing
public visibility invariant") · **depends on 893** (hard: `AdminUserAvatarField`) · runs **after 886** (886 edits
`RecentlyViewedSection`/`RecentlyViewedGridView`) · blocks **885** · owner actions **O84-6** (visual matrix + live
checks) and **O84-7** (confirm the 789 fold) · **Status: `KICKOFF FILED` 2026-09-29**

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Reserved
2026-09-27 by 885's design under **D84-1** (*"Migrate first"*); the reserved row moves into Appendix D. Precedents,
read-only: **893** (container/View split at this scale, `AdminUserAvatarField`, phased delivery), **877**.

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration in three phases (A: leaves, B: tabs and shell, C: deletions and registrations). Bundles:
**UI / Layout / Component (current Mantine path)**, **Storybook / Visual Proof**, **Component Catalog / Coverage**,
**Regression / Critical Flow Coverage**.

- **One task, not one per tab.** The reserved row suggested a split "if the census says so". It does not: every tab is
  rendered by `CabinetShell` on the same route, so clause 16d puts all of them in scope of any change to that surface.
  A split would publish a kickoff that excludes rendered components — the exact 809 defect. The phases below give the
  executor the same checkpoints a split would.
- **Task 789 (Sprint 70, reserved) is subsumed.** 789 = "migrate the live filter bar in `ListingsTab.tsx`". That bar is a
  tier-1 part of this surface and is migrated here (R8). Folding a number is registry bookkeeping; the kickoff records
  it and asks the owner to confirm (**O84-7**). Whatever the answer, 16d requires the bar in this task.

## 2. Objective

1. `/{locale}/cabinet` renders the same header card, tabs, profile form, email change, password change, recently
   viewed, danger zone, listings list with filters, and saved searches as today (§3.3–§3.7), composed from canonical
   Mantine primitives and patterns, with every state, server action and toast unchanged.
2. Every visible feature component is either a View with its own Story and manifest entry, or a pure container.
3. The legacy `AdminUserAvatar` and its Story are deleted (893 prepared `AdminUserAvatarField` for this).
4. The census shows only the root `page.tsx` and the container-exempt nodes.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface "src\app\[locale]\cabinet\page.tsx"` (35 nodes)

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/[locale]/cabinet/page.tsx` | 1 (root) | no | no | 0 | 0 | unchanged (data) |
| `modules/cabinet/components/CabinetShell.tsx` (143) | 1 | no | no | 17 | 7 | container + `CabinetShellView` (R10) |
| `modules/cabinet/components/ProfileTab.tsx` (519) | 1 | no | no | 66 | 8 | container + `ProfileTabView` + `ProfileTabDialogsView` (R6, R7) |
| `modules/cabinet/components/ListingsTab.tsx` (409) | 1 | no | legacy `Cabinet/ListingsTab` | 51 | 2 | container + `CabinetListingsView` (R8) |
| `modules/cabinet/components/SavedSearchesTab.tsx` (252) | 1 | no | no | 29 | 3 | container + `SavedSearchesView` (R9) |
| `modules/listings/components/RecentlyViewedSection.tsx` (98) | 1 | no | no | 0 | 0 | pure server container (R4) |
| `modules/listings/components/RecentlyViewedGrid.tsx` (41) | 1 | no | no | 0 | 0 | already a pure container (exempt) |
| `modules/listings/components/ClearRecentlyViewedButton.tsx` (79) | 1 | no | yes (imported by `Mantine/Primitives/RecentlyViewedGridView`) | 6 | 6 | container + `ClearRecentlyViewedButtonView` (R3) |
| `components/admin/AdminUserAvatar.tsx` (232) | 1 | no | legacy `Admin/AdminUserAvatar` | 16 | 1 | replaced by `AdminUserAvatarField` (893), then **deleted** (R12) |
| `components/shared/Combobox.tsx` | 1 | no | no | 21 | 0 | import removed (`MantineSelect`) |
| `modules/cabinet/components/CabinetPasswordSection.tsx` → `CabinetPasswordSectionView` | 1 | no / yes | — / yes | 0 | 0 | reused (already split) |
| `LocationCombobox`, `PhoneField`, `RelativeTime`, `AppImage`, `RecentlyViewedGridView`, `ListingCard` and their patterns | 1 | yes | yes | — | 0 | reused |
| `ui/avatar`, `badge`, `tabs`, `button`, `dialog`, `input`, `label` | 2 | — | — | — | — | imports removed |

**Calibration (FACT, `/admin/currency` after 877):** containers print FAIL (the census cannot see the GR-1 exemption).
Expected FAIL lines after: `page.tsx`, `CabinetShell`, `ProfileTab`, `ListingsTab`, `SavedSearchesTab`,
`RecentlyViewedSection`, `RecentlyViewedGrid`, `ClearRecentlyViewedButton`, `CabinetPasswordSection` — each
`className:0 ui-imports:0`. `AdminUserAvatarField` (893) is a container too and prints FAIL the same way.

### 3.2 Owner decisions

- **D84-1** (2026-09-27): *"Migrate first"*. No 16d exception. No other decision is claimed; §9 changes go to O84-6.

### 3.3 `CabinetShell.tsx` — behaviour to preserve

`usePresence()`; `avatarUrl` state lifted so the header avatar updates on upload; active tab = `?tab` else `initialTab`;
`setTab` pushes `?tab=` with `scroll: false`; header card: avatar (image or initials of `name`), name `h1` 18px, agent
badge, verified badge `✓ verified`, `member_since: formatDate(created_at)`, `last_seen: formatDate(last_seen_at)` when
present; tabs profile / listings (count) / searches (count) — labels hidden below 640, icons always; tab content
rendered per active tab (`:44-141`).

### 3.4 `ProfileTab.tsx` — behaviour to preserve

State `:84-118`; `isDirty` over seven fields (`:121-132`) feeding `useUnsavedChangesGuard` with the stay/leave dialog
(`:134-138`, `:492-517`); `handleSave` with country-aware phone validation → `updateCabinetProfile` → saved (3 s) / error
line, `refreshUser()`, `router.refresh()` (`:140-181`); email change (`EMAIL_RE`, `initiateEmailChange`, pending notice
with resend, error line; `:183-208`, `:347-392`); `handleDeleteAccount` (`deleteOwnAccount`; `profile_deleted_auth_failed`
→ `delete_account_auth_failed`, never success; success → toast, `signOut` then home; `:210-229`); delete dialog requires
typing `DELETE` (`:450-490`); identity card (avatar, name, private/agent toggle, company when agent); contact
(`PhoneField` ×2); location (`LocationCombobox` with regions); currency select (`ALL`/`EUR`/`USD`/`GBP` +
disclaimer); save row (saved/error line, `save_changes`/`saving`); the `recentlyViewed` slot; `CabinetPasswordSection`;
danger zone.

### 3.5 `ListingsTab.tsx` — behaviour to preserve

`livePatches`/`deletedIds` + `useCabinetListingsRealtime` (live status/visibility patches), `items` derived; filter bar:
visibility group (`ALL`/`VISIBLE`/`HIDDEN`/`ARCHIVED`/`CLOSED`, exclusive, `aria-pressed`, pushes `?filter=` with
`scroll: false`) + independent premium toggle (`?premium=1`); empty states (no filters: onboarding card + "add listing";
filtered: `no_listings_<group>` or `no_listings_PREMIUM` + reset link); rows: thumbnail (`AppImage listing-thumb` or
placeholder), status badge, the `formatVisibility` hidden label, premium badge, type · property type, title link, price,
views, contact count, `RelativeTime`; actions: edit link, delete with inline confirm (check/X, spinner),
`deleteListingAction` → removed locally, error toast `error_deleting` (`:60-409`).

### 3.6 `SavedSearchesTab.tsx` — behaviour to preserve

`FilterSummary` (listing type, property type, price range, rooms, `#locationId`); empty state; delete-all dialog
(count, warning, cancel/delete, pending); rows: icon, name or `unnamed_search`, new-count badge, summary,
`RelativeTime`; notify toggle (`aria-label` `notify_on_email`, `updateSavedSearchNotify`); frequency select when
notifying (`instant`/`daily`/`weekly` → `updateSavedSearchFrequency`, toast `frequency_updated`); open (navigates to the
canonical `/listings` URL, then `updateLastViewed` fire-and-forget, badge cleared optimistically); delete
(`deleteSavedSearch`, error toast) (`:26-252`).

### 3.7 Recently viewed

`RecentlyViewedSection` (server) fetches for the user or the guest cookie and renders `<div data-testid="recently-viewed-section">`
around `RecentlyViewedGrid` with the clear slot; it also exports `RecentlyViewedSkeleton`, used by the listing-detail
page. `RecentlyViewedGridView` already renders `data-testid="recently-viewed-section"` on its own root (`:45`, `:57`),
so the testid is currently doubled. `ClearRecentlyViewedButton`: ghost button → confirm dialog → `clearRecentlyViewed`
→ toast + refresh; error toast (`:18-79`).

### 3.8 Tests, scripts and flows naming these files (FACT)

- `src/modules/listings/lib/__tests__/visibility.test.ts:356-384` reads `ListingsTab.tsx` **by path** (Task 456 static
  proof: imports and calls `formatVisibility`, no inline predicate).
- `scripts/i18n-dynamic-manifest.json` ids `cabinet-status`, `cabinet-filter-visibility` (`ListingsTab.tsx:184`),
  `cabinet-no-listings` (`:250`); `scripts/governance/tailwind-entropy.allowlist.json:68`, `:78` (ProfileTab,
  SavedSearchesTab); legacy Stories `src/modules/cabinet/components/ListingsTab.stories.tsx` (`Cabinet/ListingsTab`) and
  `src/components/admin/AdminUserAvatar.stories.tsx`.
- Critical-flow actions keep their own tests: `src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts`,
  `src/modules/notifications/lib/emails/__tests__/emailChange.test.ts`, the Archetype B guard. No UI test covers the
  cabinet today.

### 3.9 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Section cards | `MantineFormSection` (893 R1) | reuse |
| Avatar field | `AdminUserAvatarField` + View (893 R3b), Story `Patterns/Mantine/AdminUserAvatarFieldView` | reuse |
| Header avatar | Mantine `Avatar` (Story `Mantine/Primitives/Avatar`) | reuse |
| Tabs with counts | Mantine `Tabs` (`AdminUsersTable` precedent) | reuse |
| Exclusive filter | `SegmentedControl` in `ScrollArea` (`FavoritesTypeFilter` precedent) | reuse |
| Independent toggle | Mantine `Button` with `aria-pressed` (precedent `MantineDashboardChartLegend.tsx:50`) | reuse |
| Selects | `MantineSelect` | reuse |
| Dialogs | `MantineModal` | reuse |
| Empty states | `MantineEmptyLoadingErrorState` (Story `Patterns/Mantine/EmptyLoadingErrorState`) | reuse |
| Status colours | `LISTING_STATUS_COLOR` (844) | reuse |
| Premium colour | `var(--badge-premium)` (`globals.css:483`, `:592`) | reuse |
| Password section | `CabinetPasswordSection` → View (already migrated) | reuse |
| Page width | 64rem: `adminPageMaxWidth` exists but is admin-named | **extend** `cabinetPageMaxWidth` |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D71-4 | `theme.ts` gains `cabinetPageMaxWidth: '64rem'` (`// 1024px — Task 895: /cabinet frame (legacy max-w-5xl)`) and the four R8 thumbnail keys, 877's value type. | P2 | AC1 | Confirmed |
| **R2** | 893 precedent | **Phase A gate:** `AdminUserAvatarField` exists and 893 is archived. `ProfileTab` renders `AdminUserAvatarField` with the same props it passed to `AdminUserAvatar` (`userId`, `avatarUrl`, `onAvatarChange`, `editable`/size props as 893 defines them). | P0 | AC2 | Confirmed |
| **R3** | §3.7 | `ClearRecentlyViewedButton` (container: `open`, `clearing`, `handleConfirm` unchanged) renders `src/modules/listings/components/ClearRecentlyViewedButtonView.tsx`: `Button variant="subtle" color="gray" size="sm" leftSection={Trash2}` + controlled `MantineModal` (title `recently_viewed_clear_title`, body, footer cancel `variant="default"` + confirm `color="red" loading`). | P1 | AC3 | Confirmed |
| **R4** | §3.7; GR-1 exemption | `RecentlyViewedSection` renders only `<RecentlyViewedGrid …/>` (the duplicate testid wrapper goes; the View keeps it). `RecentlyViewedSkeleton` moves to `RecentlyViewedGridView.tsx` (same export name) and its importers are updated; `Mantine/Primitives/RecentlyViewedGridView` gains a `Skeleton` export. | P1 | AC3 | Confirmed |
| **R5** | §3.4 | `ProfileTab` (container) keeps `:76-229` (state, `isDirty`, guard, `handleSave`, email handlers, `handleDeleteAccount`, `deleteConfirmOk`) unchanged in behaviour; the local `CurrencySelector` goes. Renders only `ProfileTabView` and `ProfileTabDialogsView`. 0 `className`, 0 `ui/*`. | P1 | T1–T6 | Confirmed |
| **R6** | §3.4; GR-0 | `src/modules/cabinet/components/ProfileTabView.tsx`: `Stack gap="xl"`; sections through `MantineFormSection`: **identity** (`AdminUserAvatarField` slot; name `TextInput` with label; user type `SegmentedControl` private/agent, full width; company `TextInput` when agent) · **contact & location** (two `PhoneField`s, `LocationCombobox`, currency `MantineSelect` `ALL`/`EUR`/`USD`/`GBP` labelled `preferred_currency_label`, disclaimer `Text size="xs" c="dimmed"`) · **email** (current address, pending notice + resend `Button variant="subtle"`, or `TextInput type="email"` + `Button variant="outline" loading` `save`; error `Text size="xs" c="red"` with `AlertCircle`). Save row `Group justify="space-between"`: saved (`c="green"`, `CheckCircle2`) or error (`c="red"`) line, `Button size="md" loading` `save_changes` (full width below 640). The `recentlyViewed` slot; `CabinetPasswordSection`; danger zone = `Alert color="red" variant="light" title={t('delete_account')}` holding `delete_account_body` and a `Button color="red" size="sm" leftSection={Trash2}` (no border, `bd` or `style` value written). 0 `className`, 0 `ui/*`, no raw literal. | P1 | AC4 | Confirmed |
| **R7** | §3.4 | `src/modules/cabinet/components/ProfileTabDialogsView.tsx`: two controlled `MantineModal`s — delete (title with `AlertTriangle` in red, body, `TextInput` `ff="monospace" autoComplete="off" placeholder="DELETE"` labelled `delete_account_type_confirm`, error line, footer cancel + `Button color="red" loading disabled={!deleteConfirmOk}`) and unsaved (`AlertTriangle` yellow, `unsaved_body`, stay `variant="default"` + leave `color="red"`). | P1 | T3, T4 | Confirmed |
| **R8** | §3.5; 789 | `ListingsTab` (container) keeps `:60-160` (patches, realtime, filters, `handleDelete`) and renders only `src/modules/cabinet/components/CabinetListingsView.tsx`: filter `Group` (`wrap`): visibility `SegmentedControl` in `ScrollArea` (data = `VALID_VISIBILITY_GROUPS`, labels `filter_<g>`, `aria-label` `filter_ALL`) and a premium `Button size="xs" variant={isPremium ? 'filled' : 'default'} aria-pressed={isPremium}` with `c`/`color` from `var(--badge-premium)` when active; count + "add listing" `Button component={Link}`. Empty states through `MantineEmptyLoadingErrorState` (onboarding with the add action; filtered with the reset action). Rows `Paper withBorder radius="lg" p="sm"`: `Group wrap="nowrap" align="flex-start"`; thumbnail `Box pos="relative"` sized `w={{ base: layout.cabinetThumbWidth, sm: layout.cabinetThumbWidthSm }}` `h={{ base: layout.cabinetThumbHeight, sm: layout.cabinetThumbHeightSm }}` (legacy `w-24 h-20 sm:w-32 sm:h-24`; no existing key matches — measured 2026-09-29: `theme.ts` has `galleryThumb` 44px, `thumbnail` 112px, the AGT-10 40px thumb — so R1 also adds these four `theme.other.layout` keys: `'6rem'`, `'8rem'`, `'5rem'`, `'6rem'`, each commented `Task 895: cabinet listing row thumbnail (legacy …)`), `radius="md"`, `AppImage variant="listing-thumb"` or the placeholder icon; badges (`LISTING_STATUS_COLOR`, the hidden label `Badge color="red" variant="light"` from `formatVisibility`, premium `Badge` in `var(--badge-premium)`), type · property `Text size="xs" c="dimmed"`, title `Anchor component={Link} fw={600} size="sm" lineClamp={2}`, meta `Group gap="md"` (price `fw={600}`, `Eye` views, `Phone` `contact_count`, `RelativeTime`); actions `Stack gap="xs"`: edit `ActionIcon variant="default" component={Link}` (`aria-label` `edit_listing`), delete `ActionIcon variant="default" color="red"` (`aria-label` `delete`) → inline confirm `Group` of two `ActionIcon`s (`loading` on confirm). `formatVisibility` is imported from `@/modules/listings/lib/visibility` and called **in this View**. | P0 | T7–T9, AC5 | Confirmed |
| **R9** | §3.6 | `SavedSearchesTab` (container) keeps `:52-116`; renders only `src/modules/cabinet/components/SavedSearchesView.tsx`: delete-all `Button variant="subtle" color="gray" size="xs" leftSection={Trash}` + `MantineModal` (text, count, cancel + `color="red" loading`); empty state `MantineEmptyLoadingErrorState`; rows `Paper withBorder radius="lg" p="md"` with `ThemeIcon variant="light"` search icon, name `Text fw={500} size="sm" lineClamp={1}`, new-count `Badge size="xs"`, summary `Text size="xs" c="dimmed" lineClamp={1}`, `RelativeTime`; actions `Group gap="xs"` (`wrap`): notify `ActionIcon variant={on ? 'light' : 'default'} aria-pressed={on} aria-label={notify_on_email}`, frequency `MantineSelect size="xs"` when on (no fixed width — the legacy `w-[90px]` goes), open `ActionIcon` (`open_search`), delete `ActionIcon color="red" loading`. `FilterSummary` moves into the View unchanged in output. | P1 | T10, T11 | Confirmed |
| **R10** | §3.3 | `CabinetShell` (container) keeps `usePresence`, `avatarUrl`, `activeTab`, `setTab`, `initials`, `tabs`; renders only `src/modules/cabinet/components/CabinetShellView.tsx`: outer `Box bg="gray.0"`, inner `Box maw={layout.cabinetPageMaxWidth} mx="auto" px="md" py="2xl"`; header `Paper withBorder radius="2xl" p="xl"` with `Group` (column below 640): `Avatar size="xl" radius="xl" src color="brand"` (initials), `Title order={1} fz={{ base: 'lg', sm: 'xl' }}` name, agent `Badge variant="light" color="gray"`, verified `Badge variant="light" color="green"` with the check, `member_since`/`last_seen` `Text size="sm" c="dimmed"` via `formatDate` (unchanged calls — 885 changes the format later); `Tabs value onChange` full-width `Tabs.List grow` with icon `leftSection` and the label `visibleFrom="sm"`, count `Badge size="sm" variant={active ? 'filled' : 'light'}` as `rightSection`; the three tab bodies as slots. | P1 | T12, AC6 | Confirmed |
| **R11** | GR-3, GR-3a, GR-3d, 16c | Stories under `src/stories/patterns/mantine/` (`skipCanvas: true`; page exports in `StoryPageGutter`): `CabinetShellView` (`ProfileTab`, `ListingsTab`, `SearchesTab`, `Agent`, `NoAvatar`), `ProfileTabView` (`Private`, `Agent`, `Dirty`, `Saving`, `Saved`, `Error`, `EmailPending`, `EmailError`), `ProfileTabDialogsView` (`DeleteEmpty`, `DeleteTyped`, `DeleteError`, `Unsaved`), `CabinetListingsView` (`Default`, `Filtered`, `EmptyOnboarding`, `EmptyFiltered`, `DeleteConfirm`, `Premium`), `SavedSearchesView` (`Default`, `NotifyOn`, `Empty`, `DeleteAllOpen`), `ClearRecentlyViewedButtonView` (`Closed`, `ConfirmOpen`, `Clearing`). Fixtures from the legacy `ListingsTab.stories.tsx` and `admin.fixtures.ts`. Every View enrolled. The legacy `Cabinet/ListingsTab` Story is deleted. | P1 | AC7 | Confirmed |
| **R12** | 893 note; clause 9 | Delete `src/components/admin/AdminUserAvatar.tsx` and `AdminUserAvatar.stories.tsx` once `ProfileTab` no longer imports it (`useAdminAvatarUpload.ts` stays for the Field). Update every live reference: `visibility.test.ts:356-384` path → `CabinetListingsView.tsx` (assertions unchanged); `i18n-dynamic-manifest.json` sites → the Views' lines; `tailwind-entropy.allowlist.json:68`, `:78` entries removed if the files no longer carry the class; `check-stories-rendered.mjs` / `story-realmode-allowlist.json` / `responsive-screenshots.mjs` entries for the deleted Stories retargeted or removed. `git grep --untracked -n "AdminUserAvatar\b\|Cabinet/ListingsTab\|cabinet-listingstab"` prints nothing outside history paths (`AdminUserAvatarField` matches are excluded by the word boundary). | P1 | AC8 | Confirmed |
| **R13** | Q4; clause 15 | New `src/modules/cabinet/components/__tests__/cabinet.smoke.test.tsx` (real Mantine + intl render; `@/modules/cabinet/actions`, `@/modules/listings/actions/deleteListing`, `@/modules/listings/actions/recentlyViewedActions`, `@/lib/toast`, `next/navigation`, `AuthContext`, realtime hook mocked): **T1** edit the name, save → `updateCabinetProfile` with the name and the other six fields unchanged; **T2** an invalid national phone → the error toast, no call; **T3** delete account: confirm disabled until `DELETE`; `profile_deleted_auth_failed` shows `delete_account_auth_failed` and **no** success toast; success → toast + `signOut`; **T4** dirty form + navigation → unsaved dialog; stay keeps the page; **T5** email change with a bad address → `error_email_invalid`, no call; valid → pending notice; **T6** every profile control is reachable by its label; **T7** choosing `HIDDEN` pushes `filter=HIDDEN` with `scroll: false`; the premium toggle pushes `premium=1` and exposes `aria-pressed="true"`; **T8** delete confirm → `deleteListingAction(id)`, row gone; error → `error_deleting` toast; **T9** a hidden listing shows its `formatVisibility` label; **T10** saved search notify toggle → `updateSavedSearchNotify(id, true)` and the frequency select appears; **T11** open → navigation to the canonical URL and `updateLastViewed(id)`, badge cleared; **T12** switching tab pushes `tab=searches`. | P0 | AC9 | Confirmed |
| **R14** | GR-1 | FAIL lines after = §3.1 calibration; every new View `manifest:yes story:yes`; no `AdminUserAvatar`, `Combobox` or `ui/*` node; baseline regenerated; removed keys only from this surface and from the listing-detail surface's `RecentlyViewedSection` line if its text changes; no key added. | P0 | AC10 | Confirmed |

## 5. Assumptions and open questions

1. **893 is a precondition** (`AdminUserAvatarField`, `MantineFormSection`). Otherwise `PREMISE DRIFT — 893`.
2. **886 before 895.** If 886 has not landed, R4's move still happens; report `CROSS-TASK NOTE — 886` (886 edits the
   same two files).
3. Visual changes (O84-6): section cards follow TailAdmin §6l; the gray page background no longer stretches to the
   viewport height (legacy `min-h-screen` has no token); filter pills become a segmented control; list rows, dialogs,
   selects on canonical Mantine; the frequency select loses its fixed 90px width; the header avatar and title sizes
   follow theme keys.
4. **O84-7** — the owner confirms that 789 is folded into 895 (never reused). Until then the backlog marks 789
   "subsumed by 895, fold pending owner".
5. Open owner questions blocking execution: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (all, incl. the container and provider exemptions) · `docs/agent-contract.md` 1, 3–7, 9–16d ·
`docs/rule-index.md` → the §1 bundles · `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md`
§6l · `docs/component-rules.md` · `docs/qa-profiles.md` Q4 · `docs/critical-flow-registry.md` rows "Email change",
"Self-delete + email reuse", "Phone entry", "Listing public visibility invariant", "Archetype B" · the executed 893
kickoff, read-only · 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/modules/cabinet/components/CabinetShell.tsx`, `ProfileTab.tsx`, `ListingsTab.tsx`, `SavedSearchesTab.tsx` (containers);
   new `CabinetShellView.tsx`, `ProfileTabView.tsx`, `ProfileTabDialogsView.tsx`, `CabinetListingsView.tsx`, `SavedSearchesView.tsx`
2. `src/modules/listings/components/RecentlyViewedSection.tsx`, `RecentlyViewedGridView.tsx` (skeleton move),
   `ClearRecentlyViewedButton.tsx`; new `ClearRecentlyViewedButtonView.tsx`; importers of `RecentlyViewedSkeleton` (import path only)
3. deleted `src/components/admin/AdminUserAvatar.tsx`, `src/components/admin/AdminUserAvatar.stories.tsx`,
   `src/modules/cabinet/components/ListingsTab.stories.tsx`
4. `src/design-system/mantine/theme.ts` (R1: five keys and their type lines)
5. new Stories (six files, R11); `src/stories/mantine/primitives/RecentlyViewedGridView.stories.tsx` (`Skeleton` export);
   `src/stories/fixtures/admin.fixtures.ts` (additions only)
6. new `src/modules/cabinet/components/__tests__/cabinet.smoke.test.tsx`; `src/modules/listings/lib/__tests__/visibility.test.ts` (path constant)
7. `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/i18n-dynamic-manifest.json`,
   `scripts/governance/tailwind-entropy.allowlist.json`, `scripts/check-stories-rendered.mjs`, `scripts/story-realmode-allowlist.json`,
   `scripts/responsive-screenshots.mjs` (entries for deleted Stories only); catalog files if required
8. `docs/critical-flow-registry.md` rows "Self-delete + email reuse" and "Listing public visibility invariant" (append the
   T3 and path-move notes)
9. `docs/sessions/<date>-task895-cabinet-mantine.md`, `docs/sessions/evidence/task895/*`; `docs/backlog.md` 895 cell

## 8. Out of scope

- `src/modules/cabinet/actions/**`, `useCabinetListingsRealtime`, `usePresence`, queries in `page.tsx`, the database.
- `/cabinet/statistics` (891, done). `CabinetPasswordSection`/View (already migrated; reused unchanged).
- `LocationCombobox`, `PhoneField`, `Combobox.tsx`. The 24-hour clock and `en` day-first (885).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| Every action, validation, toast, guard, realtime patch, URL write | §3.3–§3.7 | **unchanged** (T1–T12) |
| Chrome | Tailwind cards, pills, shadcn dialogs/tabs/avatar | canonical Mantine (**changed**, O84-6) |
| Page background height | `min-h-screen` | content height (**changed**) |
| Controls' accessible names | several unlabelled | every control labelled (**improved**, T6) |
| Duplicate `recently-viewed-section` testid | doubled | once (**fixed**) |
| Legacy `AdminUserAvatar` | used by `ProfileTab` | deleted |

## 10. Implementation requirements

### 10.1 I0

1. `win32` platform line; status + hashes → `docs/sessions/evidence/task895/01-*`; a §7 path modified by other work →
   `BLOCKED — SHARED PATH`.
2. **893 gate:** `AdminUserAvatarField.tsx`, `MantineFormSection` export, 893 archived — quote them; else `PREMISE DRIFT — 893`.
3. Census → `02` (35 nodes expected); a node absent from §3.1 → session log; unmigrated and uncovered → `BLOCKED — CLAUSE 16d`.
4. `grep -rn "AdminUserAvatar\b\|RecentlyViewedSkeleton" src` → `03`; an `AdminUserAvatar` consumer other than
   `ProfileTab` stops R12 (`PREMISE DRIFT`).
5. Baselines → `04`: `npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts`.
6. GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → **Phase A** R1 → R3 (+ Story) → R4 (+ `Skeleton` export) → R2 → **Phase B** R7, R6 (+ Stories) → R5 → R8 (+ Story)
→ R9 (+ Story) → R10 (+ Story) → R13 → plants → **Phase C** R12 → R14 → gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | `ProfileTab` shows the success toast on `profile_deleted_auth_failed` | T3 |
| **P2** | the delete confirm is enabled without `DELETE` | T3 |
| **P3** | `CabinetListingsView` drops `aria-pressed` from the premium toggle | T7 |
| **P4** | `CabinetListingsView` stops calling `formatVisibility` (hard-codes "visible") | T9 and the Task 456 static proof |
| **P5** | re-add `import { Badge } from '@/components/ui/badge'` in `CabinetShellView` | census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** A signed-in agent opens `/sq/cabinet`, changes phone and city, saves (header name refreshes), starts
an email change, switches to "Listings", filters "hidden", deletes one listing, switches to "Searches", turns on email
notifications weekly, opens a search.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Invalid phone | Yes | toast, no write | T2 |
| Save error | Yes | error line | code unchanged (R5) |
| Email invalid / server error / pending / resend | Yes | as today | T5, `EmailPending`/`EmailError` Stories |
| Self-delete auth failure | Yes | never success | T3 (critical flow) |
| Unsaved changes | Yes | dialog | T4 |
| Listing delete error | Yes | toast | T8 |
| Realtime status patch | Yes | row updates | code unchanged (R8) |
| No listings / filtered empty | Yes | two empty states | Stories |
| Guest | No | `page.tsx` redirects before render | — |
| Mobile < 640 | Yes | icon-only tabs, full-width controls, bottom sheets, ≥ 44px targets | GR-3b receipts |

## 12. Acceptance criteria

- **AC1 [R1]** Given `theme.ts`, then `cabinetPageMaxWidth` is defined; the line is quoted.
- **AC2 [R2]** Given `ProfileTab.tsx`, then it imports `AdminUserAvatarField` and not `AdminUserAvatar`.
- **AC3 [R3, R4]** Given `ClearRecentlyViewedButton` and `RecentlyViewedSection`, then each renders only its View/child;
  `RecentlyViewedSkeleton` is exported from `RecentlyViewedGridView.tsx`, its importers compile, and the
  `recently-viewed-section` testid appears once in a rendered `RecentlyViewedGridView` Story.
- **AC4 [R5–R7]** Given the profile container and Views, then the container renders only its two Views with 0
  `className`/`ui/*`, and the Views hold no `className`, `style`, `ui/*` import or raw literal.
- **AC5 [R8]** Given `CabinetListingsView.tsx`, then it imports and calls `formatVisibility` and holds no inline
  status/expiry predicate (the Task 456 test, re-pointed, passes).
- **AC6 [R9, R10]** Given the saved-searches and shell containers/Views, then the same container/View properties as AC4 hold.
- **AC7 [R11]** Given the six Story files and the extended primitive Story, then each imports its component, carries
  R11's exports without a written gutter or viewport pin, and `check:story-coverage` exits 0 with every View enrolled.
- **AC8 [R12]** Given the tree, then the three deleted files are gone and the R12 grep prints nothing outside history paths.
- **AC9 [R13]** Given T1–T12 on the final tree, then all pass; P1–P4 each fail and pass after restore with equal hashes;
  `deleteOwnAccount.smoke` and `visibility.test.ts` pass.
- **AC10 [R14, all]** Given `11-census-after.txt`, then the FAIL lines are exactly the §3.1 calibration set (plus
  `AdminUserAvatarField`'s container line if the census reaches it); `npm.cmd run build` exits 0; `typecheck`, `lint`,
  `check:story-coverage`, `check:rendered-scope`, `check:surface-census:changed`, `check:i18n`, `check:i18n-dynamic`,
  `check:listing-visibility` (as in `04`'s era), `check:file-integrity`, `check:mojibake`, `build-storybook` exit 0.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC8's empty grep over live paths (deletion audit, --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| User name | page title | 18px | 20px | 20px | 20px | `fz={{ base: 'lg', sm: 'xl' }}` | legacy `text-lg`; below 24px |
| Section titles | section heading | 16px | 16px | 16px | 16px | `MantineFormSection` `md` | TailAdmin §6l |
| Listing title, fields, body | body | 14px | 14px | 14px | 14px | `sm` | legacy `text-sm` |
| Meta, badges, hints | small | 12px | 12px | 12px | 12px | `xs` | legacy `text-xs` |
| Empty-state title | section heading | per `MantineEmptyLoadingErrorState` | | | | pattern-owned | pattern |

No element reaches 24px; no child heading exceeds the page title.

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

Parent: `CabinetShellView`'s inner `Box` (`maw` cap, fluid). All Stories fluid. GR-3d per owner-matrix Story:
`CabinetShellView`, `ProfileTabView`, `CabinetListingsView`, `SavedSearchesView`, `ClearRecentlyViewedButtonView` —
**wrap in this task**; `ProfileTabDialogsView` — **n/a: overlay-only**; `Mantine/Primitives/RecentlyViewedGridView` —
**n/a: MantineStoryShell primitive** (measure only); `Patterns/Mantine/AdminUserAvatarFieldView`,
`Patterns/Mantine/CabinetPasswordSectionView` (blast radius) — **profile present** or **wrap in this task** if the
executor finds a `skipCanvas` export without `StoryPageGutter` (GR-3d: in scope to fix here).

## 13. QA profile and verification plan

**Q4** — a public, authenticated surface carrying four critical flows migrates; their actions' tests stay, and a new
real-render smoke test covers the UI wiring the flows depend on.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task895"
$surface = "src\app\[locale]\cabinet\page.tsx"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface $surface *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run src/modules/cabinet/components/__tests__/cabinet.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts src/modules/notifications/lib/emails/__tests__/emailChange.test.ts *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\10b-listing-visibility.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\17b-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\17c-i18n.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\17d-i18n-dynamic.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks grep --untracked -n -E "AdminUserAvatar\b|Cabinet/ListingsTab|cabinet-listingstab" -- . ":!docs/sessions/**" ":!tasks/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM; hashes → `22-hash-object.txt`. Expected:
`win32`; the calibration FAIL set only; all exits 0 except `10b` as in `04`'s era; `20b` empty.

### 13.2 Receipts (executor)

GR-3b / GR-3c / GR-3d per export at 320/390/1024/1440 (type 768/1440): widths, overflow, name/section/body font sizes;
edge gap 16/16/32/32 for every page Story.

### 13.3 `OWNER VISUAL QA REQUIRED` — O84-6

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/CabinetShellView` | `ProfileTab`, `ListingsTab`, `Agent` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/ProfileTabView` | `Private`, `Agent`, `EmailPending`, `Error` | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/ProfileTabDialogsView` | `DeleteTyped`, `Unsaved` | `sq` | 390, 1440 | 4 |
| `Patterns/Mantine/CabinetListingsView` | `Default`, `Filtered`, `EmptyOnboarding`, `DeleteConfirm` | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/SavedSearchesView` | `Default`, `NotifyOn`, `DeleteAllOpen` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/ClearRecentlyViewedButtonView` | `ConfirmOpen` | `sq` | 390, 1440 | 2 |
| `Patterns/Mantine/CabinetShellView` `ProfileTab` | — | `en`, `it` | 1024 | 2 |

64 tuples. After the deploy, on lero.al with a **test** account: save a profile change; start and cancel an email
change; filter listings; toggle a saved-search notification; clear recently viewed. Do **not** run the self-delete on a
real account.

## 14. Completion report contract

Status per `execute-task`, never self-approved. Files (changed, new, deleted) with hashes; R1–R14 and AC1–AC10 with
evidence; every exit code; the 893 gate quotes; census before/after; GR-0, GR-1, GR-3 per View, GR-3a, GR-3b, GR-3c,
GR-3d receipts; plants with hash pairs; any 886 cross-task note; limitations; O84-6 owed; O84-7 stated. Update the 895
cell of `docs/backlog.md`; session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes (§3.3–§3.7 carry the behaviour) |
| One active route | yes (phases, Appendix C) |
| Every requirement has an AC | R1→AC1 · R2→AC2 · R3/R4→AC3 · R5–R7→AC4 · R8→AC5 · R9/R10→AC6 · R11→AC7 · R12→AC8 · R13→AC9 · R14→AC10 |
| Critical flows keep automated proof | action tests unchanged; T1–T9 add the UI wiring; the Task 456 static proof re-pointed |
| Path-reading test hazard | named (§3.8, R12) |
| Folded number | 789 recorded, owner confirmation O84-7 |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Section cards | `MantineFormSection` | 893 | **reuse** | — |
| Avatar field / header avatar | `AdminUserAvatarField`, `Avatar` | 893 / primitive | **reuse** | — |
| Tabs, segmented filter, toggle | `Tabs`, `SegmentedControl`, `Button aria-pressed` | primitives | **reuse** | — |
| Selects, inputs, modals, alerts | `MantineSelect`, `TextInput`, `MantineModal`, `Alert` | primitives | **reuse** | — |
| Empty states | `MantineEmptyLoadingErrorState` | pattern | **reuse** | — |
| Status / premium colours | `LISTING_STATUS_COLOR`, `--badge-premium` | 844, globals | **reuse** | — |
| Page width | `adminPageMaxWidth` (admin-named) | `theme.other.layout` | **extend** `cabinetPageMaxWidth` | — |
| The screens | — | seven new Views | **compose** | own Stories, manifest |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /cabinet (shell, profile, dialogs, listings, saved searches, clear-recently-viewed Views; page frame); semantic queries: form section card, avatar upload field, tabs with counts, segmented filter, pressed toggle, select, modal confirm, empty state, listing status colour, premium colour, list row card, page width; inspected candidates: MantineFormSection (Patterns/Mantine/FormSectionStack), AdminUserAvatarField (Patterns/Mantine/AdminUserAvatarFieldView), Avatar, Tabs, SegmentedControl, FavoritesTypeFilter, MantineDashboardChartLegend (aria-pressed), MantineSelect, MantineModal, Alert, MantineEmptyLoadingErrorState (Patterns/Mantine/EmptyLoadingErrorState), LISTING_STATUS_COLOR, --badge-premium, CabinetPasswordSectionView, adminPageMaxWidth; decision: REUSE + COMPOSE (seven Views with own Stories) + EXTEND (cabinetPageMaxWidth + four cabinetThumb* keys); selected canonical owner: patterns/*, listingStatusTone.ts, theme.other.layout; Mantine/TailAdmin token path: spacing md/lg/xl/2xl, fz lg/xl/md/sm/xs, iconSize, touchTarget, TailAdmin §6l; new hardcoded visual values: NONE; rationale: every value exists in the theme or a canonical owner.`

`GR-3a STORY PREFLIGHT — CabinetShellView / ProfileTabView / ProfileTabDialogsView / CabinetListingsView / SavedSearchesView / ClearRecentlyViewedButtonView × R11 states; canonical candidates: NONE (Cabinet/ListingsTab renders the legacy tab; Mantine/Primitives/RecentlyViewedGridView renders the clear button only as a slot, not its dialog states); direct-import evidence: NONE for the Views; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE (six) + EXTEND (RecentlyViewedGridView × Skeleton); target: mantine-primitives-recentlyviewedgridview; rationale: new Views; legacy Story deleted.`

`GR-1 CENSUS COMPLETE — 35 nodes today; after: tier1 7 Views migrated+enrolled+story + container-exempt (CabinetShell, ProfileTab, ListingsTab, SavedSearchesTab, RecentlyViewedSection, RecentlyViewedGrid, ClearRecentlyViewedButton, CabinetPasswordSection, AdminUserAvatarField); AdminUserAvatar deleted; Combobox import removed; tier2 7 imports removed; tier3 LocationCombobox, PhoneField, RelativeTime, AppImage, ListingCard and its patterns listed (all enrolled with Stories) — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 35 nodes | 2026-09-29 run | VERIFIED |
| Behaviour tables | the four tab/shell files read (shell and listings in full; profile and searches by section) | VERIFIED |
| Path-reading test | `visibility.test.ts:356-384` | VERIFIED |
| Duplicate testid | `RecentlyViewedSection.tsx` + `RecentlyViewedGridView.tsx:45,:57` | VERIFIED |
| `AdminUserAvatarField` exists | file present in the 893 working tree | VERIFIED as present; landed state at I0 |
| 789 overlaps | backlog registry row 789 | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | whole surface, one task | COMPLIANT |
| GR-0 | reuse/compose/extend | COMPLIANT |
| GR-3 / 3a / 16c | own Stories; legacy deleted | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| clause 9 | deletions + reference audit | COMPLIANT (R12) |
| clause 15 | critical-flow proofs kept and extended | COMPLIANT (R13) |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | 893 landed; paths clean; consumers as expected | `PREMISE DRIFT — 893` / `BLOCKED` |
| 1 | Phase A leaves + Stories | receipts missing → `BLOCKED` |
| 2 | Phase B Views, containers, T1–T12 | a behaviour test fails → fix before plants |
| 3 | Plants P1–P5 | a plant passes → test defect |
| 4 | Phase C deletions, references, baseline | a live reference remains → fix |
| 5 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 6 | O84-6 | returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **895** | reserved 2026-09-27 — **Sprint 84**, P2, filed by 885's design (D84-1), after **893** | **`/{locale}/cabinet` on canonical Mantine.** Census 2026-09-27 on `src/app/[locale]/cabinet/page.tsx`, unmigrated tier-1 nodes: `CabinetShell` (17 `className`), `ListingsTab` (51), `ProfileTab` (66), `SavedSearchesTab` (29), `RecentlyViewedSection` (0, unstoried), `RecentlyViewedGrid` (0, unstoried), `ClearRecentlyViewedButton` (6, has a Story, not enrolled), plus `AdminUserAvatar` (switch `ProfileTab` to 893's `AdminUserAvatarField`, then delete the legacy file and its `Admin/AdminUserAvatar` Story) and `Combobox` (import removed via `MantineSelect`). Tier-2 to drop: `ui/avatar`, `badge`, `tabs`, `button`, `dialog`, `input`, `label`. `ProfileTab` holds the self-delete and email-change entry points (critical flows "Self-delete + email reuse", "Email change") → **Q4**. Likely more than one kickoff: split per tab if the census says so. Blocks **885** (`Member since` / `Last seen` dates). |
