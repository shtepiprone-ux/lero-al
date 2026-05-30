# Sprint 21 — Task 301 kickoff (TINY PATCH: AdminListingsTable + AdminUsersTable segmented-tab container className wrap/scroll — NOT a fix for broader admin responsive UX)

> **⚠️ SCOPE CORRECTION 2026-05-30 (owner directive, `issues2.md`):** Task 301 is **NOT** an admin responsive-UX fix. Owner runtime QA confirms admin UI/UX problems exist across ALL 7 breakpoints (320/375/390/768/1280/1440/2560) — clipped header buttons, unreadable dashboard cards, table layouts not adapted to modern responsive patterns, merged records without dividers, inconsistent filter/button/tab patterns, broken dashboard grid. **All of that is Epic HH territory (Task 303 audit + Phase 2/3/4 implementation).** Task 301 is permitted ONLY as a localized container-className wrap/scroll patch for two specific segmented-tab bars. The task verdict MUST NOT claim "admin mobile UX fixed", "768+ no UX regression", "responsive system PASS", or "all breakpoints acceptable" — those are Epic HH outcomes, not Task 301 outcomes.

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off). Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **responsive UI bugfix** (admin surface, narrow breakpoints) — pre-read `ui-rules.md` (§6 Containers, §15 Control alignment, §17 UI pre-flight), `tailwind-canonical-fragments.md` §14 (AdminSegmentedTab, added by Task 296), `component-rules.md`, `qa-rules.md`. No scope change; STOP & ASK if ambiguous.

---

```
Type:        bugfix (responsive)
Priority:    MEDIUM (admin-only debt; not customer-facing; surfaced during Task 296 owner browser verify)
Area:        admin segmented-tab bar wrapping/clipping at 320 / 375 / 390
```

## Why this task exists (2026-05-30 orchestrator review of Task 296)

Task 296 extracted the canonical `Button size="tab"` variant and migrated three admin segmented-tab call sites (`AdminListingsTable`, `AdminUsersTable`, `AdminSettings`). The owner browser-verified the diff at all 7 breakpoints and reported:

- ✅ **PASS** at 768 / 1280 / 1440 / 2560 — no regression
- ❌ **FAIL** at 320 / 375 / 390 — tab labels clipped on:
  - `AdminListingsTable` — "Premium listings" (and locale equivalents) truncated/clipped
  - `AdminUsersTable` — "Verified agents" (and locale equivalents) truncated/clipped
  - Header/action area also clips buttons at narrow widths

Code-level analysis confirms the rendered DOM is **byte-identical** before/after Task 296 (same `h-auto px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap` composition; the `gap-1.5` / `has-data-[icon]:px-*` selectors removed by `size="tab"` only apply to icon children, and these tabs are text-only). **The clipping is pre-existing admin mobile debt, not a Task 296 regression.** Task 296 is therefore APPROVED on diff and Task 301 is filed to repair the underlying responsive bug.

This task closes the narrow-breakpoint half of the AdminSegmentedTab pattern. It is intentionally scoped to ONLY the two segmented-tab containers + the header action button row; broader admin narrow-breakpoint debt (filter chips, table column overflow, AdminSettings 5-tab row at 320) is deferred to the **future Admin UX System Epic** (referenced in Task 299 session log).

## Goal

At 320 / 375 / 390 in all four locales (sq / en / uk / it), both `AdminListingsTable` and `AdminUsersTable` segmented-tab bars must render WITHOUT clipping or truncating any tab label. Choose ONE of these strategies (STOP & ASK before committing):

- **Strategy A — Wrap (preferred for label-heavy tabs):** change the container from `flex gap-1 bg-muted rounded-xl p-1 w-fit` to allow wrapping at narrow widths (`w-fit` → `w-full` + `flex-wrap` below `md:`, OR drop `whitespace-nowrap` and rely on flex-shrink). Trade-off: a 2-row tab strip at 320 is taller but readable. Matches AdminSettings's existing `flex-wrap` pattern.
- **Strategy B — Horizontal scroll (preferred if owner wants single-row look preserved):** wrap the container in `overflow-x-auto -mx-4 px-4` so the bar scrolls horizontally at narrow widths. Trade-off: hidden labels are not immediately discoverable; needs a visual scroll affordance.
- **Strategy C — Compact tab labels at narrow widths:** keep the existing layout, but render shortened labels (or hide the star/check icon + abbreviate) below `md:`. Requires new locale keys (×4) — adds scope.

Default suggestion: **Strategy A** (matches AdminSettings; no new locale keys; simplest diff).

Additionally, audit the header/action area on both tables and apply the same wrap/scroll fix if buttons clip. **Do not** redesign the header — only fix the clipping mechanism. If the header clipping is unrelated to the segmented-tab pattern (e.g. a separate primary-action button group), document it in the session log and defer to the Admin UX System Epic.

## Current behavior to preserve (Notes 19 + 20 + 22 — admin tables)

Before editing, inventory in the session log:

**AdminListingsTable surface:**
- Page header + primary actions (whatever exists today)
- Segmented tab bar — 2 tabs: `all listings` + `⭐ Premium listings` (in locale equivalents)
- Filter bar (Combobox status filter, search, sort)
- Table columns + row click + row actions
- Pagination
- Empty state, loading state

**AdminUsersTable surface:**
- Page header + primary actions
- Segmented tab bar — 2 tabs: `all users` + `✓ Verified agents` (in locale equivalents)
- Filter bar (role filter, status filter, search)
- Table columns + row click + row actions
- Pagination
- Empty state, loading state

After the change, every existing admin control on both tables must remain reachable. The fix is to the wrap/scroll mechanism of the segmented-tab container only. No row-action change. No filter change. No column change. No copy change unless Strategy C is chosen — and Strategy C requires explicit orchestrator approval before adding new locale keys.

The `Button` `size="tab"` variant (added by Task 296 to `src/components/ui/button.tsx`) MUST remain untouched. The fix lives in the parent container className of the tab bar, not in the tab button itself.

## Positive flow (happy path)

As an admin at `uk` locale, viewport 320px (Chrome DevTools / iPhone SE):
1. Navigate to `/uk/admin/listings`.
2. The segmented-tab bar renders both tabs ("Всі оголошення" + "⭐ Преміум оголошення") fully visible — no clipping, no truncation.
3. Click "⭐ Преміум оголошення" → URL updates to `?tab=premium` → table re-renders with premium-only listings (existing behavior).
4. Repeat at 375 and 390 — same result.
5. Repeat at `sq` / `en` / `it` — same result (longest label in `uk` already covered above).
6. Navigate to `/uk/admin/users` → repeat steps 2–5 for "Всі користувачі" + "✓ Верифіковані агенти".

## Negative flow (every off-happy-path branch)

- **Locale switch mid-session** — switching locale at 320 must not reintroduce clipping for any locale.
- **Tab click below clipping threshold** — even at 320, the entire tab is tappable (touch target ≥ 44px height OR the existing tab height, whichever is taller); no dead-zone.
- **Window resize across breakpoint** — resizing from 320 → 768 must transition smoothly (no overlap, no overflow flash).
- **Header buttons unchanged** — if the header action area still clips at 320 after the tab fix AND the clipping mechanism is unrelated to the tab pattern, document and DEFER to Admin UX System Epic. Do not "fix" unrelated header buttons in this task — that is scope creep.
- **No regression at 768 / 1280 / 1440 / 2560** — the existing single-row, w-fit pill-style layout must remain at `md:` and above. Strategy A's `flex-wrap` must be conditional (`md:flex-nowrap`) OR irrelevant at wider widths because both tabs fit on one row.
- **AdminSettings untouched** — AdminSettings already uses `flex-wrap` and was reported PASS at all breakpoints; do not change it.

## Required investigation (PASTE in session log)

```
# Confirm Task 296 baseline is intact:
grep -n 'size="tab"' src/components/admin/AdminListingsTable.tsx src/components/admin/AdminUsersTable.tsx src/components/admin/AdminSettings.tsx
# Inventory current container className:
sed -n '<lines around tab bar>' src/components/admin/AdminListingsTable.tsx
sed -n '<lines around tab bar>' src/components/admin/AdminUsersTable.tsx
sed -n '<lines around tab bar>' src/components/admin/AdminSettings.tsx
# Render the page in dev mode at 320 / 375 / 390 in uk, en, sq, it — confirm the clipping reproduces:
#   /uk/admin/listings, /uk/admin/users (and the other 3 locales)
# Confirm at 768 / 1280 / 1440 / 2560 the layout is still single-row + w-fit pill — STRATEGY MUST NOT REGRESS WIDER VIEWPORTS
# Inspect header/action row separately — is its clipping caused by the tab bar (overflow inheritance) or a separate row?
```

## Scope (files Sonnet may touch)

- `src/components/admin/AdminListingsTable.tsx` — segmented-tab container className only (parent of the two `<Button size="tab">` calls)
- `src/components/admin/AdminUsersTable.tsx` — same
- `docs/tailwind-canonical-fragments.md` — update §14 with the responsive-wrap rule (one-paragraph addition)
- `docs/backlog.md` (closure entry)
- `docs/sessions/2026-05-30-task-301-admin-tab-narrow-breakpoint.md` (NEW; adjust date to actual run date if Sonnet runs later, but task number must stay 301)

**MUST NOT touch:**
- `src/components/ui/button.tsx` (Task 296 canonical variant — off-limits)
- `src/components/admin/AdminSettings.tsx` (already passes — out of scope)
- Any row action, filter, column, sort, pagination, header copy
- Any locale file (unless Strategy C is chosen with explicit orchestrator approval)
- The `tailwind-entropy.allowlist.json` (Task 296 entries stay)
- Any other admin file (AdminInquiriesManager, AdminReportsManager, AdminSupportManager, etc.) — defer to Admin UX System Epic

Maximum SOURCE-FILE delta: **2** (`AdminListingsTable.tsx` + `AdminUsersTable.tsx`). If you find yourself touching more, STOP & ASK.

## Acceptance criteria (literal)

- AdminListingsTable segmented-tab bar renders without clipping/truncation at 320 / 375 / 390 in `uk` and `sq` (longest labels). Verified in running app, narrative + DOM evidence in session log.
- AdminUsersTable segmented-tab bar renders without clipping/truncation at 320 / 375 / 390 in `uk` and `sq`.
- At 768 / 1280 / 1440 / 2560, both tab bars retain the existing single-row w-fit pill-container appearance — no visual regression vs Task 296's APPROVED state.
- AdminSettings unchanged (`git diff` shows no edit).
- `Button` `size="tab"` CVA variant unchanged (`git diff src/components/ui/button.tsx` shows no edit).
- No new locale keys (unless Strategy C is approved by orchestrator before implementation).
- No row action / filter / column / sort / pagination / header copy change.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run lint` → no NEW errors / no NEW warnings vs Task 295/296 baseline.
- `npm run governance:tailwind` → still C0/H0/M0 (no regression).
- All four locales verified at runtime at 320px (`uk` longest, but check all four).
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line (post-correction 2026-05-30): `Self-validation: tsc=0 · build=passes · governance:tailwind=C0/H0/M0 · tab-container wrap/scroll patch applied · narrow tab labels no longer clipped at 320/375/390 in sq/en/uk/it · md+ className restored byte-identical · BROADER ADMIN RESPONSIVE UX FAIL ACROSS ALL 7 BREAKPOINTS — Epic HH Task 303 audit + Phase 2/3/4 implementation required · scope=clean (2 source files only) · Task 301 verdict = NARROW PATCH ONLY · PASS-of-scope NOT PASS-of-admin-UX`.

### Owner QA observations (CONFIRMED, not theoretical — `issues2.md` 2026-05-30)

These are NOT Task 301 work. They are documented here so Sonnet does NOT silently broaden scope. Each goes to Epic HH:

1. Header / action buttons clipped or visually broken at multiple breakpoints (CONFIRMED, was previously only theoretical).
2. Dashboard cards poorly adapted; data unreadable.
3. Tables not adapted to modern responsive UI/UX patterns.
4. Some records visually merge together — no clear dividers / spacing / separate card blocks.
5. Admin pages use inconsistent responsive models (squeezed tables, uncontrolled clipping, weak card separation, inconsistent filter / button / tab patterns, broken dashboard grid).
6. Issue spans the entire admin panel, not only AdminListingsTable / AdminUsersTable.
7. Email Templates shows mixed localization → validation gates do not catch semantic locale / runtime issues (now Task 315 in Sprint 25).

**Sonnet must paste this exact section into the session log under "Owner QA — out-of-scope evidence for Epic HH" so the diff cannot be confused with admin-UX claims.**

## STOP & ASK decision points

Before writing any code:
1. **Strategy A vs B vs C?** Default is A (wrap). Confirm with orchestrator.
2. **Header/action area clipping** — if it reproduces and is unrelated to the tab bar mechanism, confirm with orchestrator to DEFER to Admin UX System Epic.

After investigation, paste the chosen strategy + rationale in the session log BEFORE editing.

## Out of scope (do NOT touch — deferred to Admin UX System Epic)

- AdminInquiriesManager / AdminReportsManager / AdminSupportManager narrow-breakpoint layout
- AdminSupportManager raw translation key + overflow at narrow breakpoints (Task 296 session log observation)
- Admin filter chip widths / sort affordances (Task 299 evaluation referenced this as Admin UX System gap)
- Admin table column overflow at narrow widths
- Header/action area redesign (only fix clipping if mechanism is tab-bar related)
- Any architectural change to admin table shell, sidebar, breadcrumb, or page layout

## Final report required

1. Files Changed table. 2. Strategy chosen + 1-paragraph rationale (after STOP & ASK). 3. Before/after className for both segmented-tab containers. 4. 320 × 4 locale runtime narrative per table (PASS/FAIL per cell). 5. 768+ regression-check narrative. 6. Header/action area finding (deferred or fixed). 7. Confirmation `Button size="tab"` + AdminSettings + Task 296 allowlist entries untouched.

Do NOT emit git commands. Do NOT run git. Do NOT broaden scope to other admin tables. STOP & ASK on strategy choice before editing.
