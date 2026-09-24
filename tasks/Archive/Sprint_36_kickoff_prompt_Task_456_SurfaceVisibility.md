# Kickoff — Task 456 (Epic LV / Sprint 36, LV.3)
## Surface public visibility in cabinet + admin (Visible / Hidden — reason)

> **Executor:** Sonnet 4.6. **Orchestrator reviews the real diff, not the report.**
> **Epic:** `tasks/Epics/Epic_LV_Listing_Public_Visibility_Integrity.md` · **Builds on Task 454** (canonical
> `visibility.ts` policy/predicate) **and Task 455** (the `expired` status + lifecycle reconciliation — already
> committed). **This slice is observability only — it surfaces the truth, it does NOT change any lifecycle,
> status, `expires_at`, or write path.** All P0 contract clauses (1–15) apply. **No git.**

> **Amendment 2026-06-18 (orchestrator sharpening, 4 patches — no scope change):** (1) `reason=expired|no_expiry`
> narrowing is now **REQUIRED** (audit chips link to it) and lives inside the Part A helper signature
> `applyPublicEligibleButHidden(query, { reason })`; (2) audit counts are **three dedicated head/count queries**
> reusing the helper, never the loaded page; (3) changing `visibility`/`reason` **resets `page=1`** while
> preserving `tab`/`status`/`q` (URL round-trips); (4) the regression test must **prove the surface consumes the
> canonical helper** (shared formatter or mocked import), so an inline-re-spelled predicate FAILS — equal-text is
> not enough. Reflected in Parts A/E/F + AC 1/5/7 + Negative flow below.

## Owner decisions (FINAL — 2026-06-18, do not re-litigate)

1. **Admin = filter AND audit panel (both).** Admin Listings gets (a) a **"Public-eligible but hidden"** filter
   AND (b) a **compact audit summary panel** at the top showing the hidden-by-reason counts. The panel does NOT
   replace the table and does NOT remove/alter any existing filter, status filter, search, tabs, or pagination.
   Clicking a count/reason in the panel APPLIES the corresponding filter (safe, URL-param driven).
2. **"Public-eligible but hidden" is a DERIVED VISIBILITY dimension, NOT a status-filter value.** Do NOT add it
   as an option inside the existing `status` filter (that would conflate lifecycle status with derived
   visibility). It is a **separate URL param** (`visibility=hidden_eligible`) applied via a policy-derived query
   fragment — never an inline re-spelled predicate.
3. **Cabinet = problem rows ONLY.** A cabinet listing row shows a **"Hidden — <reason>"** indicator **only when**
   the row is hidden per canonical `isListingPubliclyVisible`. **No permanent "Visible" badge** on normal rows
   (avoid owner-UI noise). Reasons (owner-enumerated): **Hidden — expired**, **Hidden — no expiry**,
   **Hidden — status not public**.
4. **Admin = full diagnostics.** Admin table + detail show the explicit **Visible / Hidden — reason** state on
   **every** row (operator-facing), not only on problem rows.
5. **No new owner action / CTA in this slice.** Do NOT add a "Renew"/re-activate button in cabinet. LV.3 is a
   pure visibility-surfacing slice; any owner-facing renew UX is a separate future task. Renewing remains via the
   existing status control only.
6. **Single source of truth.** Every "is it visible / why hidden" value derives from the LV.1 helper
   (`isListingPubliclyVisible` / the policy map) — **no surface re-spells `status='active' && expires_at>=now()`**
   or any status/expiry literal. The admin filter + panel use a policy-derived fragment added next to
   `applyPublicVisibility` (see Part A).

## Pre-read (rule-index: Admin-table + UI bundle)

`agent-contract.md`, `backlog.md`, `critical-flow-registry.md` (always) · `design-system.md` (§9 admin layout,
§24–§27 responsive/overlay/Storybook contracts, **§26 mobile <640 full-width + bottom-sheet gate**) ·
`ui-rules.md` · `component-rules.md` · `component-governance.md` (§11 canonical `AdminTableRow`) ·
`domain-rules.md` · `qa-rules.md` · `ai-behavior.md` → Note 20 (existing-control preservation) + Note 22 (admin
table preservation) · the LV.1 source `src/modules/listings/lib/visibility.ts` · the Epic/Sprint files.

## Grounding (verified by orchestrator 2026-06-18 — file:line)

- **Canonical helper (consume, do NOT duplicate):** `src/modules/listings/lib/visibility.ts` —
  `isListingPubliclyVisible({status, expires_at}) → { visible, reason }`, `HiddenReason ∈ {'status_not_public',
  'expired','no_expiry'}`, `PUBLIC_VISIBLE_STATUSES`, `applyPublicVisibility(query)`. The
  `VISIBILITY_POLICY_ANCHOR` comment is the LV.4 grep anchor — keep new fragments in this file.
- **Admin page query** `src/app/admin/listings/page.tsx:52-60` — SELECT lists `status` but **NOT `expires_at`**;
  filters are `tab` (all/premium, L63), `status` (`.eq('status', …)`, L65), `q` search (L66-82), `page`
  pagination (`.range`, L60). `count: 'exact'` (L58). **All must be preserved.**
- **Admin table** `src/components/admin/AdminListingsTable.tsx` — `AdminListing` interface L82-95 (**no
  `expires_at`**); status badge cell L505-513; mobile `cardRow` subtitle status badge L628-630; preview dialog
  status block L294-319; `filterBar` (Tabs L531 + Search L548 + status `Combobox` L553) L528-563; pagination
  L643-653. `STATUS_BADGE` map L72-80 (already has `expired`).
- **Cabinet select** `src/modules/cabinet/lib/queries.ts:30` `CABINET_LISTING_SELECT` — **no `expires_at`**.
- **Cabinet rows** `src/modules/cabinet/components/ListingsTab.tsx` — status `Badge` render L309-311;
  `CardListingData` type (`src/modules/listings/components/ListingCard.tsx`) is the row shape (**add
  `expires_at`**). Realtime patch contract (L83-105) patches scalar fields present in `CABINET_LISTING_SELECT` —
  adding `expires_at` to the select keeps it consistent.
- **i18n groups:** `listing` + `cabinet` namespaces carry the `status_*` keys; `admin.listings` carries admin
  table labels. New keys go in the matching namespace, with **`sq/en/uk/it` parity**.

## Scope — implement in this ORDER (self-validate each part before the next)

**Part A — policy-derived query fragment for "eligible but hidden" (single source, in `visibility.ts`).**
- Add a pure, policy-derived helper next to `applyPublicVisibility`, with an OPTIONAL reason narrowing built in:
  `applyPublicEligibleButHidden(query, opts?: { reason?: 'expired' | 'no_expiry' })`. With no `reason`, it filters
  to `status IN (public-eligible statuses)` **AND** `(expires_at < now OR expires_at IS NULL)`, derived from
  `PUBLIC_VISIBLE_STATUSES` exactly like `applyPublicVisibility` (no hardcoded `'active'`). When `reason='expired'`
  it further constrains to `expires_at < now`; when `reason='no_expiry'` to `expires_at IS NULL`. **Both reason
  predicates are policy-local to this helper — never re-spelled inline in the page/component.** Any unknown/garbage
  `reason` value is IGNORED (helper behaves as if no reason was passed — see Negative flow). This is the
  *complement within the eligible set* — the set whose status claims it should be public but the predicate hides
  it. Keep it (and the reason predicates) in `visibility.ts` so the LV.4 grep-gate still sees one source.
  Unit-test the unfiltered set AND each reason narrowing against the policy (Part F).
- Note: within the eligible set the only possible reasons are `expired` and `no_expiry` (a non-eligible status
  is `status_not_public` and is by definition NOT in this set). The audit panel reasons are therefore exactly
  those two.

**Part B — data plumbing (add `expires_at` to the two selects + row types).**
- Admin: add `expires_at` to the SELECT in `src/app/admin/listings/page.tsx` and to `AdminListing`
  (`AdminListingsTable.tsx`) as `expires_at: string | null`.
- Cabinet: add `expires_at` to `CABINET_LISTING_SELECT` and to `CardListingData` as `expires_at: string | null`.
- No other column/order/pagination change. Confirm the existing realtime/select row sets are otherwise identical.

**Part C — cabinet "Hidden — reason" indicator (problem rows only).**
- In `ListingsTab.tsx`, next to the status `Badge` (L309), compute
  `const v = isListingPubliclyVisible({ status, expires_at: listing.expires_at })`. Render the indicator **only
  when `v.visible === false`** — a small outline badge/chip: `Hidden — {reason label}` using a 4-locale key per
  reason. Do NOT render anything when `v.visible === true` (no "Visible" badge — owner decision #3).
- Reasons → keys (cabinet namespace): `visibility_hidden_expired`, `visibility_hidden_no_expiry`,
  `visibility_hidden_status_not_public`, plus a generic prefix `visibility_hidden_label` ("Hidden") if useful.
- Indicator is **inline text/badge only — NO tooltip/popover/overlay** (keeps the mobile bottom-sheet rule out
  of scope). Label wraps (`whitespace-normal break-words`), no clip, no h-scroll at 320.

**Part D — admin per-row + detail Visible/Hidden diagnostics (every row).**
- Add a `visibility` cell/indicator to `AdminListingsTable` (desktop status column area + the mobile `cardRow`
  subtitle) showing, for **every** row, `Visible` or `Hidden — {reason}` from `isListingPubliclyVisible`. Place
  it adjacent to the status badge; do not remove or relocate the existing status badge (Note 20).
- Add the same Visible/Hidden — reason line to the **preview dialog** key-details block (near the `col_status`
  cell, L294-302).
- Keys (admin.listings namespace): `visibility_label` ("Public visibility"), `visibility_visible` ("Visible"),
  `visibility_hidden_expired`, `visibility_hidden_no_expiry`, `visibility_hidden_status_not_public`. 4-locale
  parity.

**Part E — admin "public-eligible but hidden" filter + audit panel.**
- **Filter (separate dimension):** new URL param `visibility=hidden_eligible`. In
  `src/app/admin/listings/page.tsx`, when present, apply `applyPublicEligibleButHidden(query)` (Part A) IN
  ADDITION to the existing `status`/`tab`/`q` filters — it must compose, not replace them. Add a control to
  `filterBar` to toggle this view (a `Combobox` or a labelled toggle Button) — a NEW control beside the existing
  Search + status `Combobox`, never replacing them.
- **Reason narrowing is REQUIRED, not optional** (the audit-panel reason chips link to it, so it MUST actually
  filter): `reason=expired|no_expiry`, valid only alongside `visibility=hidden_eligible`. Implement it ONLY by
  passing `reason` into the Part A helper — `applyPublicEligibleButHidden(query, { reason })` — never by
  re-spelling the predicate in the page/component. An unknown/garbage `reason` value is ignored (helper falls
  back to the full `hidden_eligible` set; never throw — see Negative flow).
- **Page reset on filter change (MANDATORY):** when the UI/panel changes `visibility` or `reason`, reset `page`
  to `1` while PRESERVING `tab`, `status`, and `q` (otherwise a stale `page=8` can render an empty result over a
  non-empty filtered set). Clearing `visibility` likewise drops `reason` and resets `page=1`. Back/forward and
  refresh must still round-trip the EXACT URL state (`tab`/`status`/`q`/`visibility`/`reason`/`page`).
- **Audit panel:** a compact summary block rendered ABOVE the table (inside `AdminPageShell` header area or
  directly above `AdminTable`), showing the total "public-eligible but hidden" count and the per-reason split
  (`expired`, `no_expiry`). Counts come from **three dedicated head/count queries** — total `hidden_eligible`,
  `expired`, and `no_expiry` — each built by reusing the Part A helper (`applyPublicEligibleButHidden(query)`,
  `…(query, { reason: 'expired' })`, `…(query, { reason: 'no_expiry' })`) as a `count: 'exact', head: true`
  read. **Do NOT derive the audit counts from the loaded 25-row page**, and do NOT re-spell the count predicates
  inline. Clicking the total applies `?visibility=hidden_eligible`; clicking a reason applies
  `?visibility=hidden_eligible&reason=<r>` (both reset `page=1` per the rule above). The panel must NOT replace
  the table and must NOT remove existing filters/search/pagination.
- Empty/zero state: when the count is 0, the panel shows a neutral "no hidden public-eligible listings" line
  (4-locale) — it does not vanish silently (so operators trust it ran).

**Part F — i18n + regression + verification.**
- Add every new key to `messages/{sq,en,uk,it}.json` in the correct namespace with **key-set parity**.
- **Regression (clause 15):** add a vitest test asserting the surfaced indicator text maps to
  `isListingPubliclyVisible` for representative rows: `active`+future → visible (no cabinet badge / admin
  "Visible"); `active`+past → `Hidden — expired`; `active`+`null` → `Hidden — no expiry`; `sold`/`archived` →
  cabinet `Hidden — status not public` / admin `Hidden — status not public`. Add a test that
  `applyPublicEligibleButHidden` selects exactly the eligible+lapsed/NULL set per the policy, AND that each
  `reason` narrowing (`expired`, `no_expiry`) selects exactly its subset (and that an unknown reason falls back
  to the full set).
- **The test must PROVE the surface CONSUMES the canonical helper, not merely that it produces equal text.** Route
  the surface label through a small shared formatter that wraps `isListingPubliclyVisible` (e.g. a
  `formatVisibility(listing) → { visible, reason, labelKey }` in/next to `visibility.ts`), and assert the
  component renders that helper's output — OR spy on / mock the `isListingPubliclyVisible` import and assert the
  component called it for the row. A test that only compares the rendered string to a hand-written expected value
  would still pass against an inline-re-spelled predicate, so it does NOT satisfy this AC. Extend the
  `Listing public visibility invariant` row in `docs/critical-flow-registry.md` to cover this badge↔predicate
  equivalence AND the "UI consumes the canonical helper" guarantee.
- **Planted-violation (must FAIL):** (a) hardcode the badge to always "Visible", AND (b) re-spell the predicate
  inline in the surface instead of calling the helper — BOTH variants must make the test FAIL (the mock/spy or
  shared-formatter assertion is what catches the inline re-spell); restore → PASS. Paste both transcripts.

## 🔴 Mobile <640 full-width gate (agent-contract clauses 11–12) — per surface, MANDATORY

Name + treat each touched surface; rendered matrix required in the session log (breakpoints × `sq/en/uk/it`,
**uk@320/375/390 mandatory**):
- **Cabinet "Hidden — reason" chip** (`ListingsTab` row): inline badge, label **wraps** (`whitespace-normal
  break-words`), never clips/overflows, no h-scroll at 320; not a control (no 44px rule) but must not break the
  row layout at 320 in any locale.
- **Admin per-row Visible/Hidden indicator** (status column + `cardRow` subtitle): same wrap rules; the mobile
  card subtitle row stays readable at 320, badges wrap to a new line rather than overflow.
- **Admin filter control** (new visibility toggle/Combobox in `filterBar`): **`max-sm:w-full`**, **≥44px**
  touch target (`min-h-11`), label wraps; sits full-width below 640 alongside the existing controls (do NOT
  regress the existing Search/status `Combobox` — if they are already content-width, leave them; only the new
  control must satisfy the gate, and note any pre-existing non-full-width control rather than silently reworking
  it).
- **Audit panel**: full-width container at `max-sm`; the clickable count/reason buttons are **`max-sm:w-full`**,
  **≥44px**, labels wrap; the panel stacks vertically at 320 with no h-scroll.
- **Preview dialog visibility row**: a static text line only — it wraps and does not break the dialog. **The
  AdminListings `Dialog`'s own <640 bottom-sheet conversion is OUT OF SCOPE for 456** (pre-existing
  `max-w-md`/`max-w-sm` centered dialog); do NOT silently rework the dialog container here — if the owner wants
  it converted, that is a separate task. Flag it in the session log as a known pre-existing item, do not change it.

If any surface's correct mobile pattern is genuinely ambiguous, **STOP and ASK — do not guess.**

## Current behavior to preserve (Note 20 + Note 22 — verify in the diff)

- Admin: Tabs (all/premium), status `Combobox` filter, search input, pagination, row preview dialog, status
  actions, premium dialog, delete, copy-id, sticky column, archived row graying — **all unchanged and working**.
- Cabinet: visibility-group filter chips, premium toggle, add-listing CTA, edit/delete row actions, realtime
  patches, empty states — **all unchanged and working**. The new indicator is **additive** only.
- No public read path, no write path, no lifecycle/status/`expires_at` mutation is touched in this slice.

## Positive flow (happy path)

- **Cabinet:** owner opens cabinet → a listing that is `active` but `expires_at` lapsed (or NULL) renders a
  `Hidden — expired` / `Hidden — no expiry` chip next to its "Active" status badge → owner immediately
  understands why it is not public. A normal visible `active` listing shows **no** extra chip.
- **Admin diagnostics:** moderator opens Admin Listings → every row shows `Visible` or `Hidden — reason`. The
  audit panel shows e.g. "Public-eligible but hidden: 3 (expired 2 · no expiry 1)". Moderator clicks "expired"
  → table filters via `?visibility=hidden_eligible&reason=expired` (status/search/tab still composable) → only
  those rows remain, pagination/count reflect the filtered set.
- **Detail:** opening a listing's preview dialog shows the Visible/Hidden — reason line beside its status.

## Negative flow (every off-happy-path branch)

- **Visible listing (cabinet):** `isListingPubliclyVisible.visible === true` → **no** chip rendered (owner
  decision #3); nothing added to the row.
- **`expires_at` missing from a row (data path):** if a row somehow lacks `expires_at`, the helper treats `null`
  as `no_expiry` (hidden) — never throw, never blank the row.
- **Admin filter with zero matches:** `visibility=hidden_eligible` yields 0 rows → table shows its existing
  empty state; the audit panel shows the neutral "0 hidden" line; existing filters remain intact and clearable.
- **Filter composition:** `visibility=hidden_eligible` + an active `status` filter that excludes all eligible
  statuses → 0 rows, no error; clearing `visibility` restores the prior view. The `visibility` param must round-trip
  in the URL (back/forward, refresh) like the existing params.
- **Reason param tampering** (`reason=garbage`): ignore unknown reason, fall back to the full
  `hidden_eligible` set; never throw.
- **Locale switch:** all new strings switch live across `sq/en/uk/it`; no raw key leak; labels wrap, no clip.
- **No regression to existing filters:** applying/clearing the new control never drops `tab`, `status`, or `q`
  unexpectedly (preserve params the same way `navigate()` already does). Changing `visibility`/`reason` resets
  `page=1` BY DESIGN (so a stale page index can't show an empty page over a non-empty filtered set); clearing
  `visibility` also clears `reason` and resets `page=1`. All other param changes preserve `page` as today.

## Acceptance criteria (each diff-verifiable, mapped to a flow)

1. `applyPublicEligibleButHidden(query, opts?: { reason?: 'expired' | 'no_expiry' })` added to `visibility.ts`,
   policy-derived (no hardcoded `'active'`/expiry literal), with both reason predicates policy-local to the helper
   and unknown reasons ignored; unit-tested against `PUBLIC_VISIBLE_STATUSES` for the unfiltered set AND each
   reason narrowing (Part A + F).
2. `expires_at` plumbed into admin SELECT + `AdminListing` and cabinet `CABINET_LISTING_SELECT` + `CardListingData`;
   no other column/order/pagination change (Part B).
3. Cabinet rows render `Hidden — reason` **only** when `isListingPubliclyVisible.visible === false`; no "Visible"
   badge on visible rows; reasons cover expired / no_expiry / status_not_public; inline (no overlay), wraps
   (Part C; Positive + Negative flows).
4. Admin table (status column + mobile `cardRow`) and preview dialog show `Visible / Hidden — reason` for every
   row from the canonical helper (Part D).
5. Admin gains the `visibility=hidden_eligible` filter (separate dimension, composes with status/tab/q) with
   REQUIRED `reason=expired|no_expiry` narrowing driven only through the Part A helper (unknown reason ignored),
   and changing `visibility`/`reason` resets `page=1` while preserving `tab`/`status`/`q` (URL round-trips on
   back/forward/refresh); plus the compact audit panel whose per-reason counts come from THREE dedicated
   head/count queries (total · expired · no_expiry, each via the helper, never from the loaded page);
   click-to-filter; neutral zero state; existing filters/search/pagination/controls all preserved (Part E;
   Note 20/22).
6. All new strings present in `sq/en/uk/it` with key-set parity; every touched surface passes the Mobile <640
   full-width gate with a **rendered verification matrix** (uk@320/375/390 mandatory) in the session log (Part F;
   clauses 11–12).
7. **Regression (clause 15):** badge↔predicate equivalence test + `applyPublicEligibleButHidden` set/reason test
   green on current behavior, AND the test PROVES the surface consumes the canonical helper (shared
   `formatVisibility` wrapper or mocked/spied `isListingPubliclyVisible` import — equal-text-only does not
   qualify); `critical-flow-registry` row extended to cover both; BOTH planted-violation variants (hardcoded
   "Visible" AND inline-re-spelled predicate) FAIL — transcripts present.
8. Self-validation: `tsc --noEmit`=0 · `npm run build` · full AC self-audit citing Positive/Negative flows ·
   file-integrity transcript · "Files Changed" table · scope clean (observability only — no write/lifecycle/public-read
   change). No git emitted.

## Out of scope (later slices / separate tasks)

- Owner-facing **Renew/re-activate CTA** in cabinet → explicitly deferred (owner decision #5).
- CI invariant grep-gate `check:listing-visibility` + registry flip ✅ + planted-violation gate → **LV.4 (457)**.
- Converting the AdminListings `Dialog` to a <640 full-width bottom sheet → separate (pre-existing), do NOT
  rework here.

## Reminder

LV.3 makes the (now structurally-fixed, post-455) visibility state **observable** to owners and operators. The
Epic closes only with **LV.4 (457)** — the CI invariant guard + registry flip. Do not close Epic LV here.
