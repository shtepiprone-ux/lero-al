# Task 483 — Epic MM.1 — Migrate `AdminUsersTable` to Mantine (recipe-proving slice)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Type:** Product-surface UI migration (Phase 4). First slice of Epic MM — establishes the legacy→Mantine
> admin-table migration recipe that MM.2+ reuse.
> **Number:** Task 483 (next free after 482). Do NOT renumber.

## 0. Goal + the one rule that matters

Replace the legacy Tailwind/Base-UI rendering of `src/components/admin/AdminUsersTable.tsx` with Mantine, so that
on mobile (<40em) the user list renders as **stacked cards** (no horizontal-scroll table) and on tablet/desktop
as a full Mantine table — via the canonical `MantineAdminSurfacePattern` / `MantineDataTableToCards`.

**This is a UI-only migration. Every server-action call, handler, href, filter, tab, search, and pagination
control MUST be preserved verbatim and keep working.** You are changing *markup*, not *behavior*. Silent removal
of any control = TASK FAILURE (agent-contract clause 3; Note 20; Note 22 Admin Table Preservation).

## 1. Pre-read (rule-index → UI/layout + admin table bundles)

- `docs/agent-contract.md` (clauses 1–15), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — see §5).
- **`docs/mantine-responsive-design-system.md` — FIRST READ** (§7 mobile rules, §12 patterns, §16 future gates).
- `tasks/Epics/Epic_MM_Mantine_UI_Migration.md` (standing rules for every slice).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `docs/ai-behavior.md` → Note 20 (control preservation) + Note 22 (Admin Table Preservation).
- `docs/design-system.md` is LEGACY — read ONLY to understand the current AdminUsersTable behavior you must
  preserve, NOT as a target.

## 2. Current behavior to preserve (inventory it from the real file first)

`AdminUsersTable.tsx` is ~411 lines and ALREADY renders a mobile block + a desktop table block. Before changing
anything, produce a **before/after control inventory** capturing at least (verify against the file — this list
is a floor, not a ceiling):

- Verify / revoke agent toggle → `toggleUserVerified(u.id, …)` + success toast (`verify_success`/`revoke_success`).
- Row link to user detail → `href={/admin/users/${u.id}}`.
- Tabs filter (`all` / agent tabs) → `navigate({ tab… })`.
- Role filter, Status filter, Location-request filter → `navigate({ role/status/location_request… })`.
- Search query (`searchQuery`).
- Pagination prev/next → `navigate({ page… })`, disabled at bounds, `prev_page`/`next_page` labels.
- Status badges, verified-agent indicator, per-row loading state (`withLoading`).
- All `users.*` i18n keys currently used (sq/en/uk/it).

Every item above must exist and work identically after the migration.

## 3. Required after-behavior (Mantine)

- Replace the dual hand-rolled mobile-card + desktop-table markup with **`MantineAdminSurfacePattern`** (which
  internally uses `useMediaQuery('(max-width: 40em)')` → `MantineDataTableToCards`: cards <40em, Mantine
  `Table` ≥40em). Filters/tabs/search/pagination/header live in the pattern's surrounding Mantine layout
  (`MantinePageHeaderWithActions` for the title + "Add"/actions area if applicable; Mantine `Group`/`Stack` for
  filter rows — full-width stacked at <640).
- **Interactive cells:** `MantineDataTableToCards` today takes `columns/rows` with simple `label:value` cells.
  The user list needs interactive cells (verify/revoke button, detail link, status badge). **Extend the canonical
  pattern** to accept rich cell content (e.g. `TableColumn.render?: (row) => ReactNode` and/or a `rowHref`/
  `actions` slot) in `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (+ `MantineAdminSurfacePattern`),
  update its `Patterns/Mantine/DataTableToCards` + `AdminSurfacePattern` stories to prove the new affordance, and
  consume it from AdminUsersTable. **Do NOT fork the layout inline in AdminUsersTable.** If the required
  extension is non-trivial/ambiguous → STOP & ASK before inventing an API.
- Mobile <640: filter chips/tabs/search/pagination controls full-width, ≥44px touch targets, labels wrap
  (sq/en/uk/it), no horizontal scroll at 320. Cards show every column as label:value.
- Buttons/inputs/selects use Mantine primitives (or the theme defaults from `theme.ts`), not `@/components/ui/*`.

## 4. Storybook (replace the legacy story, don't just add one)

- `AdminUsersTable.stories.tsx` currently proves the legacy component. Migrate it: the story renders the
  **migrated** AdminUsersTable through the Mantine proof path — `parameters.skipCanvas: true`, one `Default`
  export, toolbar-driven viewport + locale, Light-only, strings via `storyT`/`storybook.*` i18n (4-locale
  parity). No per-viewport/per-locale/`Dark`/`LongUk`/`Pass`/`Fail` exports (Task 482 model). Update
  `scripts/story-realmode-allowlist.json` if the checker needs it; no broad allowlisting.
- The legacy story is **replaced**, not left alongside — this slice removes the Tailwind story for this surface.

## 5. Regression coverage (clause 15)

Scan `docs/critical-flow-registry.md`. The user-management actions reachable from this surface
(`toggleUserVerified`; navigation to `/admin/users/[id]`; the admin-users-list-loads / detail-loads rows) are
registry-tracked. Because this is UI-only:

- Baseline any existing AdminUsersTable / admin-users test green BEFORE the change (record it).
- Add/extend an RTL smoke proving the migrated component still: calls `toggleUserVerified` with the same args on
  verify/revoke; renders the detail `href`; fires `navigate(...)` for tab/role/status/pagination; renders cards
  at narrow width and table at wide (jsdom matchMedia mock). Planted-violation (e.g. drop the verify handler) →
  test FAILS.
- Do NOT change `toggleUserVerified` or any server action. If the registry lacks a row for the verify/revoke
  table action, ADD one (route/action, happy + forbidden, the test, the command).

## 6. Positive & Negative flows

**Positive:** admin opens `/admin/users` → list renders (cards <40em / table ≥40em) → filters/tabs/search/
pagination work and preserve URL params → verify/revoke toggles agent status with success toast → row click
navigates to detail. All four locales render translated strings; 320/375/390/768/1024/1440/1920 all adapt.

**Negative (each must have a verifiable handler in the diff):** verify/revoke server error → existing error
path/toast preserved (no silent success); empty list → Mantine empty state (not a broken table); loading →
per-row/page loading preserved; pagination at bounds → buttons disabled; permission-denied/unauthorized on the
action → unchanged behavior; locale switch → no layout break/overflow at uk@320; double-click verify →
existing `withLoading` guard preserved.

## 7. Mobile <640 full-width gate (P0 — name each surface)

Filter tabs row, role/status/location filter chips, search field, pagination row, and any header action button:
all **full-width / stacked** at `max-sm`, ≥44px, labels wrap. Cards edge-to-edge. The table at <40em must NOT
appear (cards replace it) — **zero horizontal scroll at 320** is the acceptance signal that fixes the owner's
reported defect. Only icon-only controls are exempt (list them).

## 8. Rendered evidence (clause 12/13 — the gate Task 482 rework #1 failed)

Required: screenshots proving **adaptation**, not just "no error": AdminUsersTable at 320 = stacked cards (no
h-scroll), at 768 = table, at 1440 = full table; × en/uk (sq/it at 320 mandatory stress). Use the
`screenshots:assert`/Playwright path against `storybook-static`. A green `tsc`/`build-storybook` is NOT proof.
Owner will visually confirm 320 cards + no h-scroll.

## 9. Validation

`npm run typecheck` (0) · `npm run lint` (0 new) · `npm run check:i18n` (green) · `npm run check:stories`
(green) · the new/extended RTL smoke green + planted-violation FAIL transcript · rendered screenshot matrix ·
file-integrity (0 NUL, parses, not truncated). Paste transcripts in the session log.

## 10. Hard contract / out of scope

- Scope = AdminUsersTable surface + the `MantineDataTableToCards`/`AdminSurfacePattern` extension it needs + its
  story + its test. **Do NOT migrate other admin tables/managers** (those are MM.2+). Do NOT touch DB/RLS/
  permissions/server actions/auth. Base UI + Tailwind stay installed (legacy).
- Consume canonical Mantine patterns; no inline layout fork; no Tailwind breakpoint classes / `.container-wide`
  as responsive logic.
- Self-validate before "complete" (clause 9): tsc=0, AC-by-AC table, before/after control inventory, rendered
  matrix, final self-validation line. **Do NOT claim complete from compile gates alone — open Storybook and
  confirm the cards render at 320.**
- Files Changed table in the session log. Do NOT run `git add`/`git commit` (orchestrator emits at review).
- If anything is ambiguous (esp. the pattern API extension) → STOP & ASK, do not invent.

## 11. Acceptance criteria (all true)

1. AdminUsersTable renders via Mantine (`AdminSurfacePattern`/`DataTableToCards`), no `@/components/ui/*` in it.
2. <40em = stacked cards, **zero horizontal scroll at 320**; ≥40em = Mantine table.
3. Every legacy control preserved + working (before/after inventory proves it); no server-action change.
4. `DataTableToCards`/`AdminSurfacePattern` extended canonically for interactive cells (+ its story updated).
5. Legacy `AdminUsersTable.stories.tsx` replaced with the Mantine-proof model (Default-only, toolbar-driven,
   4-locale, skipCanvas).
6. RTL regression smoke green + planted-violation FAIL; registry updated; no action behavior changed.
7. Mobile <640 full-width gate satisfied (all named controls).
8. Rendered screenshot matrix proves adaptation at 320/768/1440 × en/uk (+sq/it@320).
9. tsc=0 · lint=0-new · check:i18n green · check:stories green · file-integrity clean.
10. No out-of-scope surface migrated; no DB/RLS/permission/auth change.
