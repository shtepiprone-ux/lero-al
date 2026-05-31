# Sprint 28 — Task 306-Fix kickoff (Admin shell primitives canonical responsive contract — primitive-level fix; BLOCKS Tasks 308 + 309)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. Sonnet does NOT run `git add` / `git commit`.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **primitive-level responsive-contract fix** following Task 306 owner-QA HOLD/FAIL (2026-05-31). The fix is canonical — it defines the contract every admin route migration (Task 310) must follow. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23), `docs/ui-rules.md` (§7 breakpoints, §15 touch targets, §17 UI pre-flight), `docs/responsive-governance.md` (this task EDITS §"Modal Behavior Philosophy" precedent), `docs/admin-ux-rules.md` (this task EXTENDS — add §14 "Admin canonical responsive contract"), `docs/component-rules.md`, `docs/component-governance.md §1`, `docs/governance-checklists.md` Checklist A + B, `docs/qa-rules.md`, `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md`, `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`, **`docs/sessions/2026-05-31-task-306-admin-shell-primitives.md`** (the pre-fix session log — read for what was shipped before this fix), `src/components/admin/AdminPageShell.tsx`, `src/components/admin/AdminTable.tsx`, `src/components/admin/AdminCardList.tsx`, `src/components/admin/AdminListingsTable.tsx`, `src/components/admin/AdminShell.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/app/globals.css` (`.container-wide` + `.max-w-10xl` + `.admin-table-scroll-wrap`). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 306-Fix corrects Task 306. Replaces Task 306 deliverable contract; does NOT supersede the kickoff (`Sprint_28_kickoff_prompt_Task_306.md`) — that kickoff stays as historical record. Sprint 28 run-order updates: **Task 306 → Task 306-Fix → owner re-QA gate G3' → Tasks 308 + 309**. Tasks 308 + 309 stay BLOCKED until Task 306-Fix PASSes owner re-QA.

---

```
Type:        feature + refactor (canonical responsive contract at primitive level)
Priority:    P0 BLOCKER (Sprint 28 cannot ship without this; Sprint 29 cannot start without this)
Area:        src/components/admin/AdminTable.tsx (responsive internal switch)
             src/components/admin/AdminCardList.tsx (becomes AdminTable's card-mode building block OR stays standalone — decide per scope §1)
             src/components/admin/AdminPageShell.tsx (wide-screen container fix)
             src/components/admin/AdminListingsTable.tsx (re-pilot under new contract — column visibility audit + card-row renderer)
             src/app/globals.css (container width tokens)
             docs/responsive-governance.md (canonical breakpoint verification set expansion)
             docs/admin-ux-rules.md (NEW §14 — admin canonical responsive contract)
             docs/component-catalog.md (entries refreshed)
             messages/{sq,en,uk,it}.json — ZERO new keys (no UI copy change)
```

## Why this task exists

Owner manual QA on 2026-05-31 (after Task 306 self-reported PASS at 7 breakpoints × uk):

- **320 / 375 / 390:** horizontal scroll exists, but the table behaves like a clipped desktop table — NOT a mobile-first admin surface.
- **480:** root cause visible — `<table class="min-w-[640px]">` overflows the viewport (`min-w-[640px]` is hardcoded in `AdminTable.tsx` line 63).
- **1024:** table is still not adapted after the sidebar appears (sidebar 240px + main = 784px; current column-visibility tokens don't hide enough to fit comfortably).
- **2560 (and by extension 1920):** admin table/content does not use large-screen space — `AdminPageShell` uses `.container-wide` (`max-width: 88rem` = 1408px); at 2560 with 240px sidebar that leaves ~912px of unused margin.

Owner directive (2026-05-31): **this is the canonical style for ALL admin pages**. The problem is universal — every admin route (21 routes / 16 managers) suffers identical defects because they either don't yet use the primitives (pre-migration) OR they will when Task 310 migrates them but the primitives themselves are broken. **Fix the primitives canonically, prove the contract on the listings pilot at the new breakpoint set, document it in `admin-ux-rules.md §14` so Task 310's mechanical migration sweep is safe.**

## Current state to preserve (Notes 19/20/21/22/23)

Task 306 shipped (current `dev` state) is FUNCTIONALLY correct — primitives compile, types match, AdminListingsTable renders, no regressions in row actions / status transitions / dialogs / pagination / locale strings. **This fix changes ONLY the responsive contract** of `AdminTable` + `AdminPageShell` + the listings pilot's column-visibility configuration. Preserve:

- AdminListingsTable's filter/sort/search/row-action/status-transition/pagination logic verbatim.
- All locale keys; ZERO new strings.
- Dialog usages (PremiumDialog, ListingPreviewDialog) — out of scope (handled by Task 329, Sprint 29).
- AdminPageHeader.tsx — still exists; superseded marker stays.
- Storybook stories for AdminPageShell / AdminTable / AdminCardList — must be UPDATED to reflect new contract, NOT deleted.

## Orchestrator decision (2026-05-31) — strategy locked

**Strategy A: AdminTable internally switches between table and card rendering at `lg:` (1024px). Single primitive, automatic switch, configurable card-row renderer per consumer.**

Rejected alternatives:
- **B: separate primitives (AdminTable + AdminCardList) chosen per-consumer** — pushes the responsive decision down to every consumer; high defect rate; the very pattern that produced Task 306 FAIL (consumer chose table, no card path). Rejected.
- **C: keep AdminTable scroll-only, document that consumers wrap with `<AdminCardList>` themselves** — same defect mode as B. Rejected.
- **D: use JS viewport detection to switch** — violates `docs/responsive-governance.md §"Toolbar Behavior"` rule 4 ("CSS-driven responsiveness only; no JS viewport detection during render"). Rejected.

Strategy A means: `AdminTable` renders BOTH a `<table>` (hidden on `<lg:`) AND a stacked `<AdminCardList>` (hidden on `lg:+`). CSS hides the inactive one. SSR-safe; zero hydration mismatch; consumers pass column definitions ONCE and (optionally) a `cardRow` renderer that gets the same Row data — if `cardRow` is omitted, the primitive synthesizes a default card from the `columns` definition (title = first non-sticky cell; body = remaining `visibility: 'always' | 'sm' | 'md'` cells; ignored = `visibility: 'lg' | 'xl'`).

The canonical switch breakpoint is **`lg:` (1024px)** — matches the bottom-sheet modal decision in Task 329 / Epic Z.2 for cross-system consistency.

## Scope (literal)

### 1. `AdminTable` internal responsive switch — `src/components/admin/AdminTable.tsx`

**Add to `AdminTableColumn<Row>`:** nothing. The existing `visibility` field stays as-is (`'always' | 'sm' | 'md' | 'lg' | 'xl'`).

**Add to `AdminTableProps<Row>`:**

```ts
cardRow?: (row: Row) => {
  title: ReactNode          // primary label (e.g. listing title + sticky info)
  subtitle?: ReactNode      // secondary label (e.g. price + status badge)
  meta?: ReactNode          // tertiary text (e.g. agent + date)
  trailing?: ReactNode      // right-side affordance (e.g. action menu)
}
// if omitted, primitive synthesizes from columns
```

**Render contract:**

- `<table>` element: wrap in `<div class="hidden lg:block admin-table-scroll-wrap …">` — visible only at `lg:` and above.
- Card list: render `<AdminCardList … class="lg:hidden">` — visible only at `<lg:`.
- Both lists consume the same `rows` array; `loading` / `errorState` / `emptyState` props apply to both modes.
- **Remove the hardcoded `min-w-[640px]`** on `<table>` — no longer needed because at `<lg:` we render cards, and at `lg:+` we have ≥784px of main area (sidebar 240 + content). Replace with `min-w-full` (i.e. drop the constraint; let columns dictate width inside the `overflow-x-auto` wrapper). If columns still overflow at exactly 1024 → keep horizontal scroll within the wrapper (acceptable fallback at lg edge).
- `onRowClick` works in both modes.
- `rowClassName` works in both modes.
- `ariaLabel` applies to the live container.
- Sticky header + sticky first column rules unchanged at `lg:+`.

**Default `cardRow` synthesis** (when consumer omits the prop):

```ts
const stickyCol = columns[stickyColumnIndex ?? 0]
const otherAlways = columns.filter((c, i) => i !== stickyColumnIndex && (c.visibility ?? 'always') === 'always')
const mdVisible = columns.filter(c => c.visibility === 'sm' || c.visibility === 'md')
return {
  title: stickyCol.cell(row),
  subtitle: otherAlways.slice(0, 2).map(c => c.cell(row)),
  meta: [...otherAlways.slice(2), ...mdVisible].map(c => c.cell(row)),
}
```

Synthesis is a safety net. The listings pilot in scope §4 MUST pass an explicit `cardRow` — synthesis is the contract default for surfaces that consume `AdminTable` without a tailored card design (Task 310 migration sweep relies on this).

### 2. `AdminCardList` — keep as standalone primitive, internally used by AdminTable

**Do NOT delete `AdminCardList`.** It stays as a public primitive because:

- AdminTable composes it internally (card mode).
- Future surfaces with non-tabular data may consume it directly.
- Component catalog entry stays CANONICAL.

**Minor API tightening:** add a `compact?: boolean` prop. When `true`, card padding shrinks (`p-3` vs `p-4`) and meta lines collapse (`gap-1` vs `gap-2`). AdminTable's card mode uses `compact={false}` by default.

The `card` prop type changes from `(row: Row) => ReactNode` to:

```ts
card: (row: Row) => {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  trailing?: ReactNode
} | ReactNode    // backwards-compatible: legacy ReactNode still works
```

**Backwards compat:** existing direct AdminCardList consumers (none today — Task 310 will introduce them) continue to work with raw `ReactNode`. New AdminTable internal usage uses the structured shape.

**STOP & ASK trigger:** if changing the `card` prop type creates a TypeScript breaking change in any current consumer, STOP and report. (Today there are zero direct consumers — this should be a safe addition.)

### 3. `AdminPageShell` — wide-screen container fix — `src/components/admin/AdminPageShell.tsx` + `src/app/globals.css`

**Problem:** `.container-wide` caps at 88rem (1408px). At 1920 / 2560 admin content has large empty margins.

**Fix:** introduce `.container-admin` (new utility class, additive — does NOT modify `.container-wide` which is used by public site pages):

```css
.container-admin {
  width: 100%;
  max-width: 100%;             /* full-width up to 2xl */
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}
@media (min-width: 640px)  { .container-admin { padding-left: 1.5rem; padding-right: 1.5rem; } }
@media (min-width: 1024px) { .container-admin { padding-left: 2rem;   padding-right: 2rem;   } }
@media (min-width: 1536px) {
  .container-admin {
    max-width: 112rem;          /* 1792px — matches .max-w-10xl tagged "admin shell" */
    padding-left: 3rem;
    padding-right: 3rem;
  }
}
```

`AdminPageShell` swaps `className="container-wide"` → `className="container-admin"`.

Behavior:
- 320 → 1535px: full available main area (sidebar already constrains left side from `lg:`).
- 1536px (`2xl:`) and above: cap at 1792px so on 2560 viewports + 240px sidebar, content uses 1792 of the 2320px available main area (about 264px of margin per side at 2560). Acceptable — uses majority of large-screen space without stretching text columns to absurdity.

**STOP & ASK trigger:** if `globals.css` already has a conflicting class or if Tailwind's JIT does not pick up the new utility, STOP. Do not rename existing classes.

### 4. AdminListingsTable column-visibility audit + `cardRow` renderer — `src/components/admin/AdminListingsTable.tsx`

Current column visibility (per pre-fix code):

| Column | Current | Verified at 1024 main=784px? |
|--------|---------|------------------------------|
| `id` | `'sm'` (visible 640+) | likely too wide for 1024 |
| `listing` (sticky) | `'always'` | OK |
| `type` | `'md'` (visible 768+) | borderline at 1024 |
| `price` | `'always'` | OK |
| `status` | `'always'` | OK |
| `agent` | `'lg'` (visible 1024+) | tight at 1024 |
| `date` | `'xl'` (visible 1280+) | OK (hidden at 1024) |

Required changes:

- `id`: bump to `'xl'` (only show at wide). Internal IDs are debugging affordance, not core data — hide on tablet.
- `type`: keep `'md'` BUT verify cell content (translated property-type name) fits in ~120px at 1024 in uk locale; if not, bump to `'lg'`.
- `agent`: keep `'lg'`.
- `date`: keep `'xl'`.

After audit:
- `<lg:` → card mode (AdminTable internal switch handles this).
- `lg:` (1024-1279) shows: listing(sticky) + price + status + agent + type(if fits) = 4-5 columns.
- `xl:` (1280-1535) shows: listing + id + type + price + status + agent + date = 7 columns.
- `2xl:` (1536+) shows: same 7 columns; container expands to 1792px max.

**Pass an explicit `cardRow` to AdminTable** in the listings pilot:

```tsx
cardRow={(listing) => ({
  title: (
    <div className="flex items-center gap-3 min-w-0">
      <ListingThumb listing={listing} />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{listing.title}</p>
        <p className="text-xs text-muted-foreground truncate">{listing.address}</p>
      </div>
    </div>
  ),
  subtitle: (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-semibold">{formatPrice(listing.price, listing.currency)}</span>
      <StatusBadge status={listing.status} />
    </div>
  ),
  meta: (
    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      <span>{propertyTypeLabel(listing.type)}</span>
      {listing.agent && <span>· {listing.agent.name}</span>}
      <span>· {formatDate(listing.created_at)}</span>
    </div>
  ),
  trailing: <ListingRowActions listing={listing} /* same actions as table row */ />,
})}
```

`ListingRowActions` exists as a unit of work — extract it from the current table `cell` if needed so the same actions render in both card and table modes. If extraction is non-trivial → STOP and ask before refactoring across 200+ LOC.

### 5. Canonical breakpoint verification set expansion — `docs/responsive-governance.md`

Current canon: 320/375/390/768/1280/1440/2560 (7 widths).

**New canon: 320/375/390/768/1024/1280/1440/1920/2560 (9 widths).**

Rationale:
- 1024 = `lg:` — the canonical switch point (sidebar appears, table↔card flip). Owner manual QA found defects here. Must be in canon.
- 1920 = common widescreen monitor. Owner manual QA found wide-screen waste here. Must be in canon.

**Edit `docs/responsive-governance.md` §1 "Canonical breakpoints"** — add a "Verification widths" subsection separate from the Tailwind breakpoint tokens:

> Tailwind breakpoint TOKENS remain `sm: md: lg: xl: 2xl:` (no change). VERIFICATION widths (the widths every UI task must screenshot at) expand from 7 to 9: 320, 375, 390, 768, **1024**, 1280, 1440, **1920**, 2560. 1024 catches the sidebar/main geometry flip; 1920 catches widescreen waste. UI pre-flight (§17 of `docs/ui-rules.md`) and admin task QA gates use the 9-width canon as of 2026-05-31.

**Edit `docs/ui-rules.md` §17 item 6** — replace the 7-width list with the 9-width list. Update language accordingly.

### 6. NEW `docs/admin-ux-rules.md §14` — Admin canonical responsive contract

Add a new section after §13:

```md
## 14. Admin canonical responsive contract (Task 306-Fix, 2026-05-31)

This contract applies to EVERY admin route. Task 310 migration sweep enforces it across the
remaining ~12 admin pages.

### 14.1 Container

- All admin pages MUST wrap their content in `<AdminPageShell>`.
- `<AdminPageShell>` uses the new `.container-admin` utility (full-width up to 2xl, capped at
  1792px at 2xl+). DO NOT use `.container-wide` (that's for public site pages).
- AdminPageShell header pattern: title + optional countBadge + optional subtitle + actions
  (right-aligned at md+, stacked at <md). Filter bar slot below header.

### 14.2 Data display

- Tabular data: use `<AdminTable>`. The primitive internally renders a card list at `<lg:` and a
  table at `lg:+`. Consumers MUST supply `columns` and SHOULD supply `cardRow` (a structured
  title/subtitle/meta/trailing renderer). If `cardRow` is omitted, the primitive synthesizes from
  `columns` (best-effort default — surfaces with non-trivial row visuals must pass `cardRow`).
- Non-tabular row data: use `<AdminCardList>` directly.
- DO NOT render raw `<table>` outside `<AdminTable>` in admin routes.
- DO NOT render ad-hoc `<div>` rows that visually imitate cards outside `<AdminCardList>`.

### 14.3 Switch breakpoint

- The canonical table↔card switch is at `lg:` (1024px). Matches the Dialog → bottom-sheet
  switch in Task 329 / Epic Z.2. Below `lg:` → cards (mobile + tablet). At `lg:+` → table
  (desktop). No per-surface override unless STOP & ASK with the orchestrator.

### 14.4 Column visibility

- Mandatory visibility budget per breakpoint (suggested defaults; surfaces tune per their data
  shape):
  - `'always'`: 2–3 columns (sticky first + 1–2 critical data points like price/status).
  - `'sm'`: low-priority columns (e.g. property type, role). Visible 640+.
  - `'md'`: tablet-only columns. Visible 768+.
  - `'lg'`: desktop columns (e.g. agent, owner). Visible 1024+.
  - `'xl'`: wide-desktop columns (e.g. internal IDs, timestamps). Visible 1280+.
- Sticky first column at `lg:` only (no sticky on cards; cards already have natural
  hierarchy via title/subtitle/meta).

### 14.5 Wide-screen behavior (1440 / 1920 / 2560)

- AdminPageShell content uses full main area up to `2xl:`. At `2xl:+` (1536+) caps at 1792px
  (`max-w-10xl`).
- Table columns SHOULD show full set at `xl:` (1280+). Wider screens do not gain more columns
  unless data shape requires (rare).
- DO NOT introduce `2xl:grid-cols-N` for admin tables — they already use available space via
  natural column widths.

### 14.6 Verification gate

- Every admin task touching a route MUST verify at the 9-width canon × 4 locales (sq/en/uk/it).
- Screenshots strongly preferred per width; per-width pass/fail notes mandatory in the session
  log.
- Failure at any width × locale = task is NOT complete (STOP & ASK rather than ship defect).
```

### 7. Storybook updates — `src/components/admin/AdminTable.stories.tsx` + `AdminCardList.stories.tsx`

- Add a "Responsive switch" story to `AdminTable.stories.tsx` showing the same data rendered as cards at `<lg:` viewport and as table at `lg:+`.
- Update existing AdminTable stories to verify they render at the 9 canonical widths × uk locale at minimum.
- Update `AdminCardList.stories.tsx` to reflect the new `card` prop shape (structured object vs ReactNode).
- DO NOT delete existing stories.

### 8. Zero locale work

No new keys. `npm run check:i18n` MUST pass with the same key count as pre-fix (1430 keys per Task 307 log). Record before/after in session log.

---

## Out of scope (HARD — Sonnet MUST NOT touch)

- **Migrating the remaining ~12 admin routes** (locations, popular-locations, companies, property-types, currencies, email-templates, footer, pages, settings, permissions, dashboard, reports) — that's **Task 310** (Epic HH Phase 4). Task 306-Fix only proves the contract on the **listings pilot**. The contract documented in §14 is the spec Task 310 mechanically applies.
- **AdminInquiriesManager / AdminSupportManager / AdminListingsTable StatusChangeControl integration** — that's Tasks 308 + 309 (which start AFTER Task 306-Fix PASSes owner re-QA).
- **AdminUsersTable migration** — Task 308's scope (shell migration). Task 306-Fix does NOT preempt it.
- **Modal bottom-sheet behavior** — Task 329 in Sprint 29.
- **Adding new props to AdminPageShell** beyond container class swap.
- **Introducing JS viewport detection** anywhere.
- **Renaming or removing `.container-wide`** (still used by public site pages).
- **Touching `messages/*.json`** (no new strings).
- **Touching `scripts/`, `supabase/`, `next.config.ts`.**

---

## STOP & ASK triggers (escalate to orchestrator before deciding)

1. **`card` prop type change in AdminCardList breaks a TypeScript consumer** — current consumer count is zero, but verify with `grep` before changing. If non-zero → STOP.
2. **`ListingRowActions` extraction from AdminListingsTable cell exceeds ~200 LOC** or requires touching server actions — STOP. We can pass actions inline in `cardRow` without extraction.
3. **`.container-admin` utility class collides with existing class or doesn't get picked up by Tailwind JIT** — STOP.
4. **Sticky header at `lg:` clips when AdminMobileHeader is replaced by AdminShell main scroll** — STOP. Document the geometry conflict.
5. **Any breakpoint × locale combination in the 9-width × 4-locale matrix fails** — STOP and report rather than ship the defect. The point of this task is to get the canon right; if the canon is wrong, do not paper over.
6. **Owner-flagged AdminUsersTable / AdminSupportManager / AdminInquiriesManager break visually after this primitive change** — STOP. Task 306-Fix should NOT regress them (they haven't been migrated to AdminTable yet — they should be unaffected). If they regress, it means the primitive change leaked through `globals.css` somehow.

---

## Acceptance criteria

- `src/components/admin/AdminTable.tsx` updated: internal table↔card switch at `lg:`, `min-w-[640px]` removed, `cardRow` prop added with synthesis fallback.
- `src/components/admin/AdminCardList.tsx` updated: structured `card` shape supported alongside legacy ReactNode.
- `src/components/admin/AdminPageShell.tsx` updated: uses `.container-admin` (new utility).
- `src/app/globals.css` updated: new `.container-admin` utility class added; `.container-wide` UNCHANGED; `.admin-table-scroll-wrap::after` gradient UNCHANGED.
- `src/components/admin/AdminListingsTable.tsx` updated: column-visibility audit applied; explicit `cardRow` prop passed to AdminTable.
- `docs/responsive-governance.md` updated: 9-width verification canon documented in §1.
- `docs/ui-rules.md` §17 item 6 updated: 9-width list.
- `docs/admin-ux-rules.md` updated: NEW §14 with subsections 14.1–14.6 (verbatim from scope §6).
- Storybook stories updated per scope §7.
- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 0 errors / 0 warnings.
- `npm run build` → succeeds.
- `npm run check:i18n` → passes; key count unchanged.
- `npm run governance:components` → no new MANUAL_REVIEW flags.
- **9-width × 4-locale verification matrix in session log** — AdminListingsTable pilot screenshots at 320, 375, 390, 768, 1024, 1280, 1440, 1920, 2560 × sq, en, uk, it. Pass/fail per cell. Failure at ANY cell = task incomplete (per §14.6).
- **Files Changed table** in the session log per `docs/agent-contract.md` clause 10.
- Session log at `docs/sessions/2026-05-31-task-306-fix-admin-responsive-contract.md`.
- `docs/backlog.md` Last Session block updated (2–4 lines).

---

## Files expected to change (Sonnet completes the "Files Changed" table from real diff)

| File | Expected change |
|------|-----------------|
| `src/components/admin/AdminTable.tsx` | Internal lg:-switch; remove min-w-[640px]; add cardRow prop + synthesis |
| `src/components/admin/AdminCardList.tsx` | Structured card prop shape + compact flag; backwards-compat with ReactNode |
| `src/components/admin/AdminPageShell.tsx` | container-wide → container-admin |
| `src/app/globals.css` | Add .container-admin utility (additive) |
| `src/components/admin/AdminListingsTable.tsx` | Column visibility audit + explicit cardRow renderer |
| `src/components/admin/AdminTable.stories.tsx` | Add responsive switch story; update existing |
| `src/components/admin/AdminCardList.stories.tsx` | Reflect structured card shape |
| `docs/responsive-governance.md` | 9-width verification canon |
| `docs/ui-rules.md` | §17 item 6 update |
| `docs/admin-ux-rules.md` | NEW §14 (admin canonical responsive contract) |
| `docs/component-catalog.md` | Refresh AdminTable + AdminCardList entries |
| `docs/sessions/2026-05-31-task-306-fix-admin-responsive-contract.md` | NEW — session log + 9×4 verification matrix |
| `docs/backlog.md` | Last Session entry |

No SQL. No locale file edits. No new components beyond the contract refinement. No new scripts.

---

## Review hook (for the orchestrator — Opus 4.7)

After Sonnet reports completion, Opus reads the real diff and verifies:

1. `AdminTable.tsx` actually renders BOTH paths (`<table>` with `hidden lg:block` + `<AdminCardList>` with `lg:hidden`) — grep for the responsive class pair.
2. `min-w-[640px]` is GONE from `AdminTable.tsx` (grep proof).
3. `.container-admin` exists in `globals.css` and `AdminPageShell.tsx` uses it (grep proof).
4. AdminListingsTable column visibility map matches the spec in scope §4.
5. `docs/admin-ux-rules.md §14` is present with all 6 subsections.
6. 9-width verification table in session log: 36 cells (9 × 4 locales) all marked PASS, OR failures clearly flagged with STOP&ASK escalation.
7. Files Changed table count matches diff.
8. No scope creep (no Task 310 work — no AdminUsersTable / AdminSupportManager / AdminInquiriesManager migration; no AdminCurrenciesManager / AdminExchangeProvidersManager / etc. touched).
9. Owner re-QA gate G3' (manual screenshots at 9 widths × 4 locales) — owner runs in PowerShell against dev build before approval.

If PASS, Opus emits explicit-path commit commands:

```
git add src/components/admin/AdminTable.tsx src/components/admin/AdminCardList.tsx src/components/admin/AdminPageShell.tsx src/components/admin/AdminListingsTable.tsx src/app/globals.css
git commit -m "fix(Task306Fix): admin responsive contract — primitive-level lg:-switch + wide-screen container"

git add src/components/admin/AdminTable.stories.tsx src/components/admin/AdminCardList.stories.tsx
git commit -m "chore(Task306Fix): storybook stories reflect responsive contract"

git add docs/responsive-governance.md docs/ui-rules.md docs/admin-ux-rules.md docs/component-catalog.md
git commit -m "docs(Task306Fix): 9-width verification canon + admin-ux-rules §14 canonical responsive contract"

git add docs/sessions/2026-05-31-task-306-fix-admin-responsive-contract.md docs/backlog.md
git commit -m "chore(Task306Fix): session log + backlog"
```

---

## Sprint 28 run-order update (orchestrator-managed)

```
327 ‖ 328  →  306  →  [Task 306-Fix]  →  owner re-QA gate G3'  →  307  →  308 ‖ 309
```

Task 307 PASSED owner gate G4 (per backlog Tasks 306 + 307 entry); however Task 308 references the AdminTable primitive that Task 306-Fix changes. **Task 308 stays BLOCKED until Task 306-Fix ships.** Task 309 also depends on the canonical responsive contract for `AdminSupportManager` migration; **Task 309 stays BLOCKED until Task 306-Fix ships.**

Sprint 29 (Task 329 + 326B + 326C) start condition is unchanged: "Sprint 28 closes." Sprint 28 closes after 308 + 309 PASS owner QA, which now waits on Task 306-Fix → 308 → 309 sequence.

---

## Sonnet handoff contract reminder

You are the executor. Do not invent architecture. Do not introduce new primitives beyond what scope §1–§7 lists. Do not migrate admin routes beyond AdminListingsTable. Do not run `git add` or `git commit`. Update `docs/backlog.md` Last Session + open the session log + emit the Files Changed table from the REAL diff. On any STOP&ASK trigger above, halt and report. The verification matrix is the gate: 9 × 4 = 36 cells, all PASS or task incomplete.
