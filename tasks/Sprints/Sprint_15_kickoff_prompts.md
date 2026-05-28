# Sprint 15 — kickoff prompts (Tasks 247, 267, 233, 232, 229, 230, 241, 249)

> **Mandatory rules — non-negotiable on every task in this sprint:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255). Every task MUST contain `Positive flow (happy path)` and `Negative flow (every off-happy-path branch)` sections. A diff that ships only the happy path is INCOMPLETE.
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands. The orchestrator (Opus) emits explicit-path commit commands during review.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1-10 + 6a + 10). Pre-read selection per `docs/rule-index.md` task-type bundles — never "read all docs". No scope change; no invented architecture (STOP & ASK if ambiguous); literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check in `uk` 320px); preserve UX flow + existing controls; update `docs/backlog.md` + add session log with Files Changed table; 0 new lint/typecheck errors; `npm run build` passes; locale parity ×4; 7 breakpoints. Owner runs SQL; emit SQL into session log; executor never runs git or SQL.

---

## Task 247 — EE.1 — Footer admin manager

```
Hard contract: see top.

GOAL: Admin (and possibly moderator) can edit the public site footer from /admin. Footer reads
content from DB instead of being hardcoded / i18n-only. Edits cover ×4 locales (sq/en/uk/it)
side by side per section.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "Admin table / admin control task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/component-governance.md §11 (canonical AdminTableRow pattern)
  - docs/domain-rules.md
  - docs/rls-rules.md
  - docs/qa-rules.md
- docs/rule-index.md → "Schema / migration task" bundle (footer table is new):
  - docs/data-access-rules.md
  - docs/architecture.md
- docs/ai-behavior.md → Note 22 (Admin Table Preservation) + Note 18 (self-validation) + Note 14 (Global Change Verification)
- tasks/Epics/Epic_EE_Footer_Admin_Manager.md (epic scope)
- Existing footer component(s): grep `Footer` in src/components/shared/ and src/modules/layout/
- Task 222 session log (V.1 contact-page footer link — must not break)
- Epic K canonical admin table pattern (Tasks 127-130) — reuse the §11 row pattern
- Epic R admin shell + role gate (Tasks 195-202)

Current behavior to preserve:
- Affected surface: public-site footer (rendered on every page); admin shell (sidebar entry).
- Existing controls: every footer link, social link, contact info, copyright/legal text rendered today.
- Existing data: NONE today (hardcoded in component / i18n). Task creates new DB persistence.
- Existing read-only labels: copyright year, etc. — preserved or migrated to DB.
- Existing /contact link (Epic V / Task 222) — must continue to work.

Required after behavior:
1. Admin opens /admin/footer (new route) → sees editable form for every footer section ×4 locales.
2. Admin edits a section → Save → DB persists → public footer immediately reflects the change (revalidatePath).
3. Public footer renders DB content with fallback to current hardcoded content when DB row is empty.
4. All four locales render the localized content.
5. Sidebar entry added in admin: e.g. "Footer" with appropriate icon.

Positive flow (happy path):
- Actor: admin with `footer.manage` permission (or admin role; STOP&ASK if you need to create a new permission key — Epic R / Task 250 defines the canonical permission flow).
- Preconditions: owner ran the new footer table SQL.
- Steps:
  1. Admin clicks "Footer" in sidebar → /admin/footer SSR loads current rows.
  2. Admin edits a column (e.g. social link URL) → Save server action → DB update → revalidatePath('/').
  3. Public footer re-renders with the new content on next nav.
  4. Same for ×4 locales — admin can edit each locale tab.

Negative flow (every off-happy-path branch):
- Non-admin / non-permission user opens /admin/footer: `assertPermission(...)` throws → toast.error(t('footer.error_forbidden')) (new key ×4).
- DB row missing for a section: public footer falls back to a sensible default (hardcoded constant or i18n key — document the fallback policy in the session log).
- DB save fails: toast.error(t('footer.error_transient')) (×4); form preserves user input.
- Owner has NOT applied the new SQL: /admin/footer page returns "table not found" — defensive UI shows "Footer storage not initialized" (new key ×4) instead of crashing.
- Concurrent edit by another admin: realtime/refresh handles next nav; no silent stomping.
- XSS in URL fields: server-side validation rejects `javascript:` / `data:` schemes; toast.error(t('footer.error_invalid_url')) (×4).
- Locale parity check after save: if admin saves sq but leaves en/uk/it empty, fallback to sq for those locales; document policy.
- Cancel/Esc on edit dialog (if dialog-based): no DB write; form state preserved or cleared per canonical pattern.
- Sidebar entry visibility: hide for non-admin (existing role-gate pattern).

Scope:
1. STOP & ASK: decide the persistence model with the orchestrator BEFORE writing code:
   - Option A: single `site_footer` table with JSONB columns per locale (sections + links as JSON arrays).
   - Option B: normalized `footer_sections` + `footer_links` + `footer_translations` tables.
   - Option C: extend existing `site_settings` table (already in schema-drift map).
2. Emit idempotent SQL into session log; owner runs in Supabase SQL Editor; code gated on confirmation.
3. New admin route /admin/footer + new manager component following K.1 §11 canonical pattern.
4. Server actions: getFooter / updateFooter / createFooterRow / deleteFooterRow as needed.
5. Public footer reads from DB with fallback.
6. Sidebar entry under "Footer" with appropriate icon (LucidePanelBottom / similar).
7. Locale keys ×4 for all new UI text.

Acceptance criteria:
- STOP&ASK persistence decision recorded in session log with orchestrator approval.
- Idempotent SQL emitted in session log (gated on owner running it).
- Admin can edit footer end-to-end at /admin/footer in all 4 locales at all 7 breakpoints.
- Public footer renders DB content with documented fallback.
- All negative-flow branches handled with localized toasts.
- Existing /contact link (Task 222) preserved (verify).
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- §17 UI pre-flight output (admin manager).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-247-ee1-footer-admin-manager.md.

Out of scope: redesigning footer layout; adding new footer sections beyond what exists today; multi-region footers.
```

---

## Task 267 — CC.3 — Phone test coverage: 9-digit cases in `normalizeNational()`

```
Hard contract: see top.

GOAL: Existing `phone.test.ts` tests `normalizeNational('69 123 456')` (8-digit Albanian landline format). After Task 244 (CC.1) the placeholder shows 9-digit Albanian mobile format (`'691 234 567'`). Add 9-digit test cases ALONGSIDE the existing 8-digit ones — do NOT remove 8-digit (it remains valid for landlines).

Filed by: orchestrator (Opus 4.7) on 2026-05-28 — follow-up question from owner about test coverage after Task 244 placeholder change.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "UI / layout / component task" bundle:
  - docs/qa-rules.md
- src/lib/phone/normalizeNational.ts (the function under test)
- src/lib/phone/__tests__/phone.test.ts (the existing tests)
- Task 158/170/187/188 session logs (libphonenumber-js + PhoneField history)
- Task 244 session log (placeholder change rationale)

Current behavior to preserve:
- All existing tests pass.
- `normalizeNational()` behavior unchanged (this task only adds test coverage; it does NOT change the function).

Required after behavior:
- `phone.test.ts` has additional test cases for 9-digit Albanian mobile inputs (`'691 234 567'`, `'+355 69 1234567'`, etc.).
- Tests confirm `normalizeNational()` correctly normalizes 9-digit mobile inputs to the expected canonical form.
- All existing 8-digit landline tests still pass.

Positive flow (happy path):
- Run `npm run test` → all phone tests pass, including new 9-digit cases.

Negative flow (every off-happy-path branch):
- 9-digit input that's NOT a valid Albanian mobile prefix (e.g. `'100 000 000'`): test verifies it's rejected/normalized as documented.
- 10-digit input (too long): test verifies behavior matches existing 8/9-digit convention.
- Empty / whitespace input: test verifies existing behavior.
- Mixed format (`'+355 691 234 567'`, `'00355691234567'`): test verifies canonical normalization.

Scope:
1. Read existing `phone.test.ts` to identify the 8-digit test patterns.
2. Add ≥ 4 new test cases for 9-digit Albanian mobile formats:
   - `'691 234 567'` (with spaces, matching the placeholder)
   - `'691234567'` (no spaces)
   - `'+355 691 234 567'` (E.164 with country code)
   - `'00355691234567'` (international dial prefix)
3. Verify each test asserts the expected canonical output.
4. Run `npm run test` — all pass.

Acceptance criteria:
- ≥ 4 new 9-digit test cases added to `phone.test.ts`.
- All existing tests still pass (no removals).
- Test descriptions clearly indicate "Albanian mobile (9-digit)" vs "Albanian landline (8-digit)".
- `npm run test` → all phone tests pass.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- 0 new lint/typecheck errors.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-267-cc3-phone-test-9digit.md.

Out of scope: changing `normalizeNational()` behavior; changing phone validation rules; UI changes (Task 244 already done).
```

---

## Task 233 — W.6 — Double vertical gap between filter bar and status tabs

```
Hard contract: see top.

BUG: vertical gap between `.listings-filter-bar` and `.listings-status-tabs` on /listings is too small — the bar visually presses against the tabs. Double it using the canonical spacing scale.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "Tailwind / styling governance task" bundle:
  - docs/tailwind-governance.md
  - docs/tailwind-canonical-fragments.md
  - docs/ui-rules.md §1 (canonical spacing scale)
  - docs/qa-rules.md
- src/modules/listings/components/ListingsFilterBar.tsx
- src/modules/listings/components/ListingsStatusTabs.tsx
- Whatever wrapper layout file contains both (likely the /listings page or a shell component)

Current behavior to preserve:
- All controls on filter bar — preserved.
- All status tabs — preserved.
- Mobile / desktop layouts — preserved except for the gap.

Required after behavior:
- Vertical gap between filter bar and status tabs is doubled (or matches canonical scale per §1).
- No arbitrary `py-N` values — use canonical Tailwind classes per the spacing scale.
- Visually verified at all 7 breakpoints.

Positive flow:
- /listings renders → filter bar at top → larger gap → status tabs → listings grid below.

Negative flow:
- Mobile (320px): gap remains proportional, doesn't waste vertical space.
- Wide desktop (2560px): gap doesn't look excessive.
- Locale switch: gap is locale-independent (no text inside gap).
- Other surfaces using these classes: grep to confirm no collateral impact.

Scope:
1. Find current gap value (Tailwind class like `mt-2` or `gap-2`).
2. Double it to next canonical scale value (e.g. `mt-2` → `mt-4`).
3. Verify at 7 breakpoints in `uk` (longest locale).
4. Grep for other consumers of the same wrapper / no collateral changes.

Acceptance criteria:
- Gap doubled using canonical spacing scale.
- §17 UI pre-flight at all 7 breakpoints.
- 0 new lint/typecheck errors.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-233-w6-filter-bar-tabs-gap.md.

Out of scope: changing tab styles; changing filter bar styles; touching other spacing on the page.
```

---

## Task 232 — W.5 — Toolbar horizontal clipping fix + canonical adaptive form

```
Hard contract: see top.

BUG: `.listings-filter-bar` currently uses `flex-nowrap overflow-x-auto` which clips controls horizontally. Bring every control on the page to canonical adaptive form per `docs/ui-rules.md §15–§17`. Mobile-first; verify at 320 / 375 / 390 / 768 / 1280 / 1440 / 2560.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "UI / layout / component task" bundle:
  - docs/ui-rules.md (especially §15 control heights + §16 z-index + §17 UI pre-flight)
  - docs/component-rules.md
  - docs/qa-rules.md
  - docs/tailwind-governance.md
- docs/responsive-governance.md
- src/modules/listings/components/ListingsFilterBar.tsx
- src/modules/listings/components/ListingsFilters.tsx (siblings — Note 14 single-source check)
- src/modules/filters/components/FiltersPanel.tsx (homepage drawer sibling)

Current behavior to preserve:
- All filter controls remain functional and reachable.
- Existing canonical Combobox / Button primitives preserved.
- All 4 locales render without text clipping.

Required after behavior:
- `.listings-filter-bar` does NOT clip horizontally at any of the 7 breakpoints.
- Controls wrap to multiple rows on narrow widths (320/375/390 px) instead of clipping.
- Desktop (1280+) layout unchanged.
- All controls use canonical heights / spacing per §15.

Positive flow:
- Resize browser from 320px to 2560px → controls wrap naturally, no horizontal scrollbar appears.
- All locales: longest strings (`uk` / `it`) render without truncation.

Negative flow:
- Very narrow viewport (< 320px): page should still be usable; no overflow on body.
- Large viewport (2560px): controls don't stretch absurdly wide; max-width constraint applied.
- Touch targets: every clickable control ≥ 44px height on mobile (per §15).
- Combobox dropdowns: still positioned correctly (no z-index regression).
- Long property-type names in `uk`: don't clip in the Combobox trigger.

Scope:
1. Identify the current `flex-nowrap overflow-x-auto` site.
2. Replace with `flex flex-wrap gap-N` (canonical) + appropriate breakpoint guards.
3. Audit every child control: height / padding per §15.
4. Test at 7 breakpoints in `uk` (longest locale).
5. Verify no z-index regression on Combobox popouts.

Acceptance criteria:
- 0 horizontal clipping at any breakpoint (verified at 7 widths).
- All control heights canonical per §15.
- §17 UI pre-flight output in session log.
- Locale parity ×4 (no text changes; just confirm no regressions).
- 0 new lint/typecheck errors.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-232-w5-toolbar-overflow-canonical.md.

Out of scope: redesigning the filter bar layout; adding new controls; touching the drawer (separate W.4 task).
```

---

## Task 229 — W.2 — One global "Reset filters" on /listings

```
Hard contract: see top.

BUG: /listings currently ships TWO separate "Reset filters" buttons. Collapse into ONE global reset that ALSO clears: the sale/rent/all segmented toggle, the "All types" property-type Combobox, and the location chip.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 14 (Global Change Verification) + Note 20 (Existing-Control Preservation)
- src/modules/listings/components/ListingsFilterBar.tsx
- src/modules/listings/components/ListingsFilters.tsx (drawer reset; one of the two existing buttons)
- src/lib/filters/filterEngine.ts (`parseSearchParams`, URL serialization)

Current behavior to preserve:
- Every filter section reachable.
- Apply / Cancel in drawer unchanged.
- URL routing on reset behaves correctly (push to /listings without any search params).

Required after behavior:
- ONE global "Reset filters" button on /listings (location TBD with orchestrator if ambiguous — likely top-right of the filter bar OR within the drawer footer).
- Clicking it clears: sale/rent/all segmented toggle, property-type Combobox, location chip, all drawer fields, sort, search query.
- URL navigates to clean /listings.
- Old second reset button removed (Note 20 — explicit removal, documented in session log).

Positive flow:
- User sets multiple filters → clicks "Reset filters" → URL clears → all controls revert to default → listings query re-runs without filters.

Negative flow:
- Already-clean state: button is disabled OR no-op (decide with orchestrator).
- Single filter active: still resets all controls.
- Drawer-open state: drawer closes after reset OR stays open with all fields cleared (decide).
- URL has unknown params (not user-set): cleaned along with everything else.
- Browser back: returns to filtered state (history preserved).

Scope:
1. Identify both existing reset buttons; document locations in session log.
2. Pick a single canonical location (orchestrator STOP&ASK if no obvious choice).
3. Wire reset to a SINGLE handler that clears every filter source.
4. Remove the second button per Note 20 (documented removal).
5. Verify on /listings + homepage drawer (Note 14 — same logic applies to both surfaces if they share it).

Acceptance criteria:
- Single reset button visible on /listings.
- Resets every filter type (verified in session log inventory).
- Removed button explicitly listed in Note 20 control inventory.
- §17 UI pre-flight output.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-229-w2-single-global-reset.md.

Out of scope: redesigning the filter bar; changing what reset clears beyond the listed items.
```

---

## Task 230 — W.3 — Add `area_asc` sort option

```
Hard contract: see top.

BUG: sort Combobox on /listings is missing the "Area: ascending" option. The canonical sort catalog must include it. ×4 locales.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- src/lib/filters/filterEngine.ts (`VALID_SORTS` constant + sort routing)
- src/modules/listings/components/ListingsFilterBar.tsx (sort Combobox)
- messages/{sq,en,uk,it}.json (sort label keys)

Current behavior to preserve:
- All existing sort options (price asc/desc, date newest/oldest, area desc, etc.) — preserved.
- Sort routing through `filterEngine.ts` and the listings query — unchanged for existing options.

Required after behavior:
- `area_asc` added to the canonical sort catalog.
- Sort Combobox shows it as an option in all 4 locales.
- Selecting it sorts listings by `area_gross` ascending.
- URL param routing: `?sort=area_asc` → query applies `ORDER BY area_gross ASC NULLS LAST`.

Positive flow:
- User opens sort Combobox → sees "Area: ascending" / "Площа: за зростанням" → selects → listings re-order ascending by area.

Negative flow:
- URL `?sort=area_asc` with no listings: empty state preserved.
- URL `?sort=area_asc` for listings without `area_gross` set: NULLS LAST keeps them at the bottom.
- Locale switch: label re-renders in new locale.
- Existing `area_desc` continues to work (regression check).
- Invalid `?sort=xyz` URL: existing `VALID_SORTS` allowlist drops it (no regression).

Scope:
1. Add `area_asc` to `VALID_SORTS` in filterEngine.ts.
2. Add routing in the query builder: `q = q.order('area_gross', { ascending: true, nullsFirst: false })`.
3. Add `area_asc` to sort Combobox options in ListingsFilterBar.tsx.
4. Add locale keys for the new label ×4 (e.g. `sort.area_asc`).
5. Verify URL ↔ Combobox state sync.

Acceptance criteria:
- `area_asc` selectable in sort Combobox in all 4 locales.
- Listings sort ascending by area when selected.
- URL routing works both ways (Combobox → URL, URL → Combobox).
- Existing sort options preserved (regression check).
- §17 UI pre-flight output.
- 0 new lint/typecheck errors; `npm run build` passes.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-230-w3-area-asc-sort.md.

Out of scope: changing other sort options; refactoring the Combobox component.
```

---

## Task 241 — AA.1 — Currency picker moves from filters → user profile

```
Hard contract: see top.

GOAL: User's preferred display currency lives ONLY in cabinet → Profile tab. Applies globally on every page that renders a price. Currency selector is REMOVED from the homepage filter drawer (`FiltersPanel`) and the `/listings` filter bar / drawer. Profile clearly communicates: "FX rate is approximate, sourced from iliria98.com, may differ from final price".

Pre-read (in addition to the shared header):
- docs/rule-index.md → "Profile / edit-flow task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
  - docs/state-authority.md
  - docs/ai-behavior.md → Note 23 (Edit-Flow Preservation Rule)
- Tasks 175/176/177/178/214/215 session logs (Epic M closed; iliria98 canonical FX source, multi-currency cards, currency catalog)
- Task 216 session log (preferred_currency catalog-driven)
- src/modules/cabinet/components/ProfileTab.tsx (where the currency picker moves TO)
- src/components/shared/FiltersPanel.tsx (homepage drawer — currency picker comes FROM)
- src/modules/listings/components/ListingsFilters.tsx + ListingsFilterBar.tsx (/listings — currency picker comes FROM)
- src/hooks/useExchangeRate.ts (existing FX hook)
- Task 178 session log (currency selector → canonical Combobox — preserve the Combobox itself)

Current behavior to preserve:
- Every price-rendering surface (cards, detail page, contact card) renders in the user's selected currency.
- iliria98.com is the canonical FX source.
- per-m² price uses the same currency + rate (Task 176).
- Multi-currency cards (Task 215).
- preferred_currency catalog-driven (Task 216).

**Edit-Flow Preservation Rule (Note 23):** preferred_currency field MUST remain editable in ProfileTab. Save persists to DB. After save, every price-rendering surface across the app shows the new currency without manual reload.

Required after behavior:
1. ProfileTab has a Currency Combobox (canonical, from Task 178). Default value = user's current `preferred_currency`.
2. Below it: text label "Курс приблизний (≈), джерело: iliria98.com — може відрізнятися від фінальної ціни." (sq/en/uk/it).
3. Saving the currency updates `users.preferred_currency` in DB.
4. Every surface that previously read `preferred_currency` from filter state now reads from auth context / user state (already correct per Task 215 + Task 216; this task just removes the filter-panel duplicate).
5. Filter panels no longer show a currency selector.
6. After save, header re-renders prices in new currency without manual reload (Task 248 / FF.1 pattern — use AuthController.refresh()).

Positive flow:
- User opens ProfileTab → sees Currency Combobox → selects EUR → Save → toast.success → header re-renders → all visible prices switch to EUR → preferred_currency persists after reload.

Negative flow:
- Currency selection invalid (not in catalog): existing validation guard (Task 216) — toast.error.
- DB save fails: toast.error(t('profile.save_error')); form state preserved.
- Network offline: toast.error; preserve form values.
- Filter panels still rendering currency selector after change: Note 20 violation; grep audit confirms removal.
- Mobile (320px): ProfileTab layout doesn't break with the added Combobox.
- AA.1 description ("≈ rate from iliria98") missing in one locale: locale parity check.

Scope:
1. Move Currency Combobox from `FiltersPanel.tsx` + `ListingsFilters.tsx` + `ListingsFilterBar.tsx` TO `ProfileTab.tsx`.
2. Remove filter-panel currency selector code (Note 20 — explicit removal, documented inventory).
3. Add the ≈/iliria98 description text below the Combobox in ProfileTab.
4. Wire save to the existing profile update server action.
5. After save, call `refreshUser()` (Task 248 pattern) so header re-renders.
6. Locale keys ×4 for the description text + any new labels.
7. Verify every price-rendering surface still reads correct currency.

Acceptance criteria:
- Currency Combobox visible in ProfileTab; removed from 3 filter sites.
- Note 20 control-inventory documenting the removal.
- Description text in 4 locales.
- Header reactivity works (Task 248 pattern).
- Edit-Flow Preservation Rule honored.
- §17 UI pre-flight output.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-241-aa1-currency-in-profile.md.

Out of scope: changing FX source (iliria98 canonical, Task 175); changing rate fetching logic; changing card-level currency rendering (Task 215).
```

---

## Task 249 — FF.2 — Toast audit v2

```
Hard contract: see top.

GOAL: Second-pass action-toasts audit. Task 205 (T.1) was the first pass. FF.2 fills gaps T.1 missed — Save buttons / row actions / lifecycle actions that don't trigger a toast on success or failure.

Pre-read (in addition to the shared header):
- docs/rule-index.md → "UI / layout / component task" bundle:
  - docs/ui-rules.md
  - docs/component-rules.md
  - docs/qa-rules.md
- docs/ai-behavior.md → Note 14 (Global Change Verification — fix at canonical primitive)
- Task 205 session log (T.1 first pass — what was already covered)
- Sonner toast usage across the codebase (grep `toast.success` / `toast.error` / `toast.info` / `toast.warning`)
- All "Save" / "Submit" / row-action / destructive-action sites — audit table in session log

Current behavior to preserve:
- All existing toasts unchanged.
- Sonner pattern unchanged.
- All action handlers unchanged in functional behavior (only adding toast calls if missing).

Required after behavior:
- Every meaningful user action (Save, Submit, Delete, Toggle, Activate, Archive, etc.) on every surface triggers a toast on success AND on failure.
- Audit table in session log: action × surface × pre-state (had toast / missing) × post-state.
- New locale keys ×4 for any toast text added.

Positive flow:
- User clicks any action → toast appears (success or error).
- Audit table shows 0 missing post-fix.

Negative flow:
- Already-toasted actions: NO duplicate toast added (Note 14 — single source).
- Background actions (analytics, prefetch, etc.): NOT toasted (out of scope; document).
- Concurrent actions: each gets its own toast (no race).
- Long-running actions: loading state preceded by toast OR spinner (canonical pattern from T.1).
- Error toasts: localized; show actionable message (not raw error.message).

Scope:
1. Grep audit: every onClick handler that calls a server action.
2. Cross-check with T.1 (Task 205) audit list.
3. Identify missing toasts.
4. For each gap: add appropriate `toast.success(t(...))` / `toast.error(t(...))` using the canonical pattern.
5. Audit table in session log: BEFORE × AFTER per surface.
6. Locale keys ×4 for new toast strings.

Acceptance criteria:
- Audit table shows 0 missing toasts post-fix.
- No duplicates added (grep proof).
- Locale parity ×4 for new keys.
- §17 UI pre-flight output (toast positioning unchanged — Sonner global).
- 0 new lint/typecheck errors; `npm run build` passes.
- "Files Changed" table per Task 264.
- Self-validation block per Note 18.
- docs/backlog.md updated; session log: docs/sessions/2026-05-2N-task-249-ff2-toast-audit-v2.md.

Out of scope: redesigning Sonner / toast styling; changing toast positioning; changing the canonical pattern from T.1.
```
