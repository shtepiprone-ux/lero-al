# Task 461 — Admin report-details: show the reported listing's OWNER (Epic BB)

> **Type:** Admin moderation UI + the admin report query (read-only embed). **NOT** report submission,
> **NOT** DB grants, **NOT** middleware, **NOT** public UI.
> **Origin (owner, 2026-06-18):** after Task 460 fixed report submission, the owner submitted a report and
> opened it in the admin Скарги queue. The "Деталі скарги" dialog shows the **reason**, the **listing**
> (`Оголошення: Test1`), and the **reporter** (`Скаржник: Agrogul`) — but **NOT the owner of the reported
> listing**. A moderator cannot see whose listing is being complained about without clicking through.
> A report targets a *listing*, so "which user the report is against" = the reported listing's **owner**.

## Goal

In the admin report-details dialog, clearly show **both parties**, visually distinct:
- **Скаржник / Reporter** — the user who submitted the report (ALREADY shown — keep unchanged).
- **Власник оголошення / Listing owner** — the owner of the reported listing (**NEW**): display name +
  account-type badge + a link "Відкрити профіль" → `/admin/users/[ownerId]`.

This is **observability only** — no change to report submission, the `reportListingAction`/`updateReportStatusAction`
behavior, DB grants, middleware, or any public surface.

## Pre-read (rule-index → Admin control + UI bundles + always-required)

- `docs/agent-contract.md` (P0 clauses 1–15 — always).
- `docs/backlog.md` (always).
- `docs/critical-flow-registry.md` (always) — the **"Report listing"** row is the touched flow (admin/
  moderation side). Baseline its existing tests GREEN; update the row's coverage note at approval time.
- `docs/design-system.md` — **§9 admin layout + §26 overlays / mobile <640 full-width bottom-sheet** (the
  dialog must stay a full-width bottom sheet at <640).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md` (canonical `Badge`/`Dialog`/
  admin patterns — reuse, do not clone).
- `docs/domain-rules.md` (listing ownership / user-type semantics).
- `docs/rls-rules.md` — confirm the admin reports query already runs via `createAdminClient()` (service_role)
  so **no new grant/RLS change is needed**; do NOT add one.
- `docs/qa-rules.md` (test/error-handling conventions).
- `docs/ai-behavior.md` → **Note 22 "Admin Table Preservation Rule"** + Note 20 (control preservation).

## Hard contract (P0 — verified against the diff on return)

- **Do NOT change scope** beyond: the admin reports query embed (`src/app/admin/reports/page.tsx`), the
  `ReportRow` type + the `ReportDetailDialog` in `src/components/admin/AdminReportsManager.tsx`, the
  `admin.reports` locale keys (all 4 locales), the regression test, registry row, session log, backlog.
- **Allowed ONLY if needed for AC6 rendered evidence:** extend an EXISTING `AdminReportsManager` story/test
  fixture, or add a minimal admin-reports rendered harness under the established stories/tests location. Do
  NOT add product code that exists only for verification, and do NOT introduce a new harness pattern if one
  already exists for admin components.
- **Do NOT touch** `reportListing.ts` action behavior, `ListingReportDialog.tsx` (the public submit dialog),
  `middleware.ts`, DB grants/migrations, or any public listing UI.
- **Do NOT remove or restyle** the existing Reporter (`Скаржник`), Listing, Reason, Status, Comment, Date
  rows or the action buttons (control-preservation, Note 20/22). You are ADDING one row, not restructuring.
- **Do NOT invent architecture.** If the listing→owner FK embed is ambiguous, or if there is no existing
  canonical account-type badge to reuse, **STOP and ASK** — do not improvise.
- No `git add` / `git commit` — the orchestrator emits commits after diff review.
- Read-after-write + clause-14 integrity check on every touched file; paste the green transcript.

---

## 🔴 PHASE 0 — audit BEFORE coding (paste findings into the session log)

1. **The owner embed.** `src/app/admin/reports/page.tsx` currently selects
   `listing:listings(id, title, slug), reporter:users!listing_reports_user_id_fkey(id, name)`.
   Determine the exact FK from `listings` → `users` (the listing owner column — likely `listings.user_id`)
   and the correct PostgREST embed syntax to add the owner **nested inside the listing embed**, e.g.
   `listing:listings(id, title, slug, owner:users(id, name, <account-type col>))` — using an explicit
   FK hint (`owner:users!<constraint_name>(...)`) if the implicit embed is ambiguous. Confirm the real
   constraint name; do not guess it. **Fetch only `id`, `name`, and the account-type column** — do NOT fetch
   the permission `role` column (see Clarification 2).
2. **Account-type vs role.** Inspect the `users` table columns and the existing **/admin/users** UI. The
   public listing card shows the owner's account type ("Приватна особа" = private person). Identify the
   column that drives that badge (e.g. `user_type`/`account_type` with private/agent/company) **and** the
   permission `role` column. The owner wants the **account-type badge** (private person / agent / company) —
   the same classification shown publicly — NOT the admin permission role. If the admin user list already
   renders a canonical **account-type** `Badge`, **reuse that exact component/variant mapping**
   (canonical-first, Note 14 / Task 426); do NOT reuse the permission-role badge mapping for this row. If the
   schema has only a permission `role` and no account-type column, STOP and ASK (default assumption to state
   in the log: account type = private / agent / company, matching the public card).
3. **Deleted/missing owner.** Determine when `listing.owner` can be null: listing soft-deleted, owner user
   deleted, or embed returns null. The dialog MUST NOT crash or render an empty row — see fallback below.
4. **Mobile bottom-sheet.** Confirm the canonical `Dialog` (used here with `<DialogContent className="max-w-md">`)
   already renders as a **full-width bottom sheet at <640** (design-system §26.2 / Task 243/424 precedent).
   If it does, you only need the new row to comply (wrap, no overflow, ≥44px link target). If the dialog is
   NOT already a compliant bottom sheet at <640, **STOP and ASK** — fixing the dialog's whole mobile pattern
   is out of this task's scope.

---

## Required after-behavior (what to build)

### Data (`src/app/admin/reports/page.tsx`)

Extend the existing embed to include the listing owner (nested in the `listing` embed), fetching ONLY the
owner `id`, `name`, and the account-type column required for the public/private/agent/company badge. **Do NOT
fetch or render the permission `role`** unless Phase 0 proves the existing canonical account-type helper
strictly requires it internally — and never *show* permission role in the report dialog. No other query
change. Still via `createAdminClient()`.

### Type (`AdminReportsManager.tsx` → `ReportRow`)

Add the owner to the listing shape, nullable end-to-end:
```ts
listing: {
  id: string
  title: string
  slug: string
  owner: { id: string; name: string | null; /* account-type field only — NO permission role */ } | null
} | null
```
(Exact field names per Phase 0. The owner shape carries `id`, `name`, and the account-type column only.)

### Dialog (`ReportDetailDialog`)

Add a **"Власник оголошення / Listing owner"** row, placed **directly after the Listing row and before the
Reporter row** (group: what was reported → who owns it → who reported it). The row shows:
- the owner's **display name** (fallback to a neutral placeholder if `name` is null but the user exists);
- the **account-type badge** (reuse the canonical `Badge` + the same variant/label mapping as /admin/users);
- a link **"Відкрити профіль" → `/admin/users/[ownerId]`** (internal `next/link`, NOT `target="_blank"` —
  it's an in-app admin route; ≥44px touch target, label wraps).

Keep the existing **Reporter** row exactly as-is (`Скаржник` → `report.reporter?.name ?? t('anonymous')`).
The two rows must be unambiguously labelled so reporter ≠ owner.

### Fallback (deleted / missing owner)

If `report.listing?.owner` is null (owner deleted, listing removed, or embed null): render the owner row with
a neutral fallback label — **"Власник не знайдений" / "Owner not found"** (new locale key) — **no profile
link, no badge, no crash, no empty field.** If the whole `listing` is null, the owner row shows the same
fallback (consistent with the existing Listing row's `—` handling).

## Localization

Add to the **`admin.reports`** namespace in **all four locales** (`sq`/`en`/`uk`/`it`), same key set, with
per-locale rendered evidence (the AC6 matrix cells satisfy this — a separate runtime harness is not required;
matching key counts alone is NOT sufficient):
- `col_owner` — "Власник оголошення" / "Listing owner" / sq / it.
- `owner_not_found` — "Власник не знайдений" / "Owner not found" / sq / it.
- `open_profile` — "Відкрити профіль" / "Open profile" / sq / it. **Localization reuse rule:** if a generic
  admin "Open profile" key already exists AND is already used by admin components, reuse it; otherwise add
  `admin.reports.open_profile` in all four locales. **Do NOT introduce a second/different translation
  namespace inside `AdminReportsManager`** unless that is already an established pattern there.
Account-type badge labels: reuse the EXISTING /admin/users **account-type** label keys only — do NOT
duplicate them and do NOT pull in permission-role labels.

## 🔴 Mobile <640 full-width gate (OWNER P0)

Surface in scope: the **report-details Dialog** (`ReportDetailDialog`). Required `max-sm` behavior: the
dialog stays a **full-width edge-to-edge bottom sheet** at <640 (rounded top corners, slide-up, drag handle,
≤90dvh internal scroll, closes on backdrop tap + Esc) — this is provided by the canonical `Dialog`; confirm
it (Phase 0 §4) and do NOT regress it. The NEW owner row specifically: label + name + badge + "Відкрити
профіль" link must **wrap** (sq/en/uk/it long labels), never clip or cause horizontal scroll at 320; the
profile link is a ≥44px touch target. No new exemptions. If the dialog is not already a compliant bottom
sheet, STOP and ASK (do not silently restructure it).

## 🔴 Regression coverage (agent-contract clause 15 — critical-flow-registry "Report listing")

1. **Baseline:** run the existing report-listing tests GREEN and record it —
   `npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx`
   plus any existing `AdminReportsManager` test.
2. **Add an RTL smoke** for `ReportDetailDialog` (or extend an existing admin-reports test) asserting the
   CHANGED behavior:
   - owner present → the dialog shows the owner row with the owner's name, the account-type badge, and a
     link **with accessible name `open_profile` / "Відкрити профіль"** whose `href` is
     `/admin/users/<ownerId>`; AND the Reporter row still shows the reporter's name (the two are distinct,
     not conflated). (Assert by the link's accessible name, NOT `queryAllByRole('link')` — the dialog also
     contains the Listing link, which must not be mistaken for the profile link.)
   - owner null (deleted/missing) → the dialog shows the `owner_not_found` fallback and renders **no link
     with accessible name `open_profile`**, and does not crash.
   - (cheap, if the fixture allows) owner with null/unknown account-type → renders without crashing, using
     the /admin/users default badge fallback, profile link still present.
3. **Planted-violation proof:** break the owner mapping (e.g. point the link at the reporter id, or drop the
   null-guard) and show the new test FAILS; restore → PASS. Paste both transcripts.
4. Update the registry "Report listing" row coverage note with the new test + command at approval time.

## Positive flow (happy path)

Admin/moderator opens `/admin/reports` → clicks a report row → "Деталі скарги" dialog opens → sees Reason,
Listing (link), **Власник оголошення: `<owner name>` + account-type badge + "Відкрити профіль" →
`/admin/users/<ownerId>`**, Скаржник (reporter), Comment, Date, action buttons → clicking "Відкрити профіль"
navigates in-app to the owner's admin profile. Post-conditions: no change to report status/data from merely
viewing; the moderation actions (review/dismiss/resolve) behave exactly as before.

## Negative flow (every off-happy-path branch — each needs a verifiable line + locale key)

- **owner deleted / missing** — owner row shows `owner_not_found`, no link, no badge, no crash.
- **listing null** — owner row shows the same fallback; existing Listing row `—` behavior preserved.
- **owner name null but user exists** — show the account-type badge + profile link with a neutral name
  placeholder (do not render an empty clickable).
- **owner account-type null / unknown** — owner exists but the account-type column is null or an unexpected
  value → reuse the EXISTING /admin/users fallback behavior for account-type badges (e.g. its default/unknown
  variant); do NOT crash and do NOT substitute the permission role. The profile link still renders.
- **reporter anonymous (existing)** — Reporter row still shows `t('anonymous')`; UNCHANGED.
- **dialog cancel / Esc / backdrop** — closes, no mutation (unchanged).
- **locale switch (sq/en/uk/it)** — both labels localize; no clip/overflow at 320.
- **non-admin access** — unchanged: the `/admin` route guard already governs access; this task adds no new
  data exposure beyond what the admin client already returns.

## Acceptance criteria

- **AC1** — Phase 0 audit pasted into the session log: the real `listings`→`users` owner FK + embed syntax,
  the account-type column + the canonical badge component reused, the null-owner conditions, and the bottom-
  sheet confirmation (or a STOP-and-ASK).
- **AC2** — Query embed adds the listing owner via `createAdminClient()` only; no other query change, **no DB
  grant/RLS change**. Verifiable at `src/app/admin/reports/page.tsx` file:line.
- **AC3** — `ReportRow` carries a nullable owner; `ReportDetailDialog` shows the **Власник оголошення** row
  (name + account-type badge + in-app `/admin/users/[ownerId]` link) directly after Listing, before
  Reporter; the existing Reporter/Listing/Reason/Status/Comment/Date rows + action buttons are unchanged
  (before/after control inventory in the log). Verifiable at file:line.
- **AC4** — Deleted/missing owner → `owner_not_found` fallback, no link, no crash (verifiable in the diff +
  the negative test).
- **AC5** — New keys (`col_owner`, `owner_not_found`, and `open_profile` if not already present) in **all
  four** locales, same key set, runtime locale-switch confirmed; account-type labels reuse existing keys.
- **AC6** — Rendered verification matrix (breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**): dialog
  stays full-width bottom sheet at <640; the owner row (label + name + badge + link) wraps, no clip/overflow
  at 320; profile link ≥44px.
- **AC7** — Regression: baseline GREEN recorded; new RTL smoke (owner present → name+badge+correct href +
  reporter still distinct; owner null → fallback + no link); planted-violation FAIL + restored PASS
  transcripts; registry row updated.
- **AC8** — `npx tsc --noEmit` = 0 errors; `check:i18n` + relevant admin/listings gates green; clause-14
  file-integrity transcript green. AC-by-AC self-audit table + "Files Changed" table in the session log,
  citing the Positive + Negative flows by name.
- **AC9** — `docs/backlog.md` (Task 461 status) updated + session log under `docs/sessions/`. No
  `git add`/`git commit`.

## Deliverable

Owner-visibility row in the admin report-details dialog (name + account-type badge + in-app profile link),
distinct from the reporter, with a deleted-owner fallback; the query embed; 4-locale keys; RTL regression
with planted-violation proof; rendered matrix; registry row update; session log + Files Changed table;
backlog update. No report-submit / DB-grant / middleware / public-UI changes. Stop-and-ask outcomes (if any)
recorded for the orchestrator.

---

## Clarifications before execution (TAKE PRECEDENCE over any conflicting wording above)

1. **Two distinct users — never conflate them.** `Скаржник` (reporter) = who filed the report;
   `Власник оголошення` (listing owner) = whose listing was reported. They are different users and different
   rows. The link target for the owner row is the OWNER's id (`/admin/users/<ownerId>`), not the reporter's.
2. **Account-type badge, not permission role.** Show the private-person / agent / company classification (the
   same one shown on the public listing card), reusing the existing canonical badge. If the schema only has a
   permission `role` and no account-type, STOP and ASK before substituting role.
3. **No email / no PII expansion.** Do NOT add the owner's email or phone to this dialog — the profile link is
   the path to contact details. Keep the dialog a compact moderation summary, not a full user card.
4. **No new data exposure.** The query already uses the admin (service_role) client; you are only projecting
   one more embedded relation that admins are already entitled to see. Do NOT add any grant, policy, or
   public-facing change.

---

## 🔁 REWORK 1 (orchestrator review, 2026-06-18) — NOT APPROVED, route back

Diff-verified on the real files (`page.tsx:18`, `AdminReportsManager.tsx:130-149`, the smoke test, all 4
message files, the canonical helper `AdminUserProfile.tsx:128-134`). The core change is sound — embed added,
owner row placed between Listing and Reporter, in-app `/admin/users/[ownerId]` link uses the OWNER id (not
the reporter), null-owner + null-listing fallbacks present, existing rows/actions preserved, 4-locale keys
present (1849 parity), no DB grant / RLS / middleware / public-UI change. But it cannot be approved:

### 🔴 Blocker 1 (sufficient on its own) — AC6 rendered matrix was deferred to the owner
The session log states: *"Rendered matrix deferred to owner (no Storybook story for AdminReportsManager
exists — pre-existing gap)."* This is an **auto-reject** under agent-contract clause 12 + orchestrator-role
"Mobile <640 full-width gate" + CLAUDE.md OWNER P0 — a UI task whose log lacks the rendered matrix is
INCOMPLETE; `tsc=0`/tests-green is explicitly NOT proof. The kickoff (Hard contract §2 + AC6) **already
authorised** adding a minimal admin-reports rendered harness/test fixture for exactly this — so "no story
exists" is not a valid deferral.
**Fix:** add/extend a minimal established rendered harness/story/fixture for `AdminReportsManager` →
`ReportDetailDialog` and provide the matrix: **sq/en/uk/it × mobile widths, uk@320/375/390 mandatory**, with
per-cell evidence that (a) the dialog stays a full-width edge-to-edge bottom sheet at <640, (b) the owner row
(label + name + badge + "Відкрити профіль") wraps with no clip / no horizontal scroll at 320, (c) the profile
link is a ≥44px touch target.

### 🟠 Blocker 2 (must fix, hardening) — account-type badge built by raw string interpolation
`AdminReportsManager.tsx:137` builds the key directly:
`tu(\`profile_types.${report.listing.owner.user_type || 'private'}\`)`.
**Correction to the first-pass note:** the `|| 'private'` default is NOT a mislabel — the canonical
`/admin/users` helper `profileTypeFromUser` (`AdminUserProfile.tsx:128-134`) *also* returns `'private'` for any
null/unknown non-privileged `user_type`, so null/empty renders the SAME label as `/admin/users`. The real,
narrower defect: an **unexpected non-empty** `user_type` (anything outside `private|agent|developer`) yields
`profile_types.<unknown>` → a missing-translation at runtime, because the code interpolates instead of
**whitelisting** like the canonical helper. The kickoff's negative-flow ("owner account-type null / unknown →
reuse the EXISTING /admin/users fallback") requires the canonical clamp, not a raw passthrough.
**Fix:** clamp `user_type` to the known set with a `'private'` fallback (matching `profileTypeFromUser`'s
default) before building the key — e.g. `const ownerType = (['private','agent','developer'] as const).includes(ut) ? ut : 'private'`
— so an unexpected/null value can never produce a missing key. Do NOT fetch or substitute the permission
`role` (Clarification 2 still holds).

### 🟡 Test gap (bundle into the rework) — badge label not asserted; null/unknown branch untested
The owner-present smoke asserts name + `col_owner` + `open_profile` + href + reporter, but never asserts the
**account-type badge label** (with the key-returning mock the fixture's `user_type:'agent'` should surface
`profile_types.agent`). AC7's "(cheap, if the fixture allows) null/unknown account-type" branch is also not
covered.
**Fix:** (1) assert the badge label in the owner-present test (`expect(text).toContain('profile_types.agent')`);
(2) add a fixture with `user_type` null/unknown → asserts no crash, profile link still present, falls back to
the `private` label; (3) keep the existing owner-null + listing-null tests. Re-run baseline + restored suite,
re-confirm the planted-violation FAIL→PASS, and paste both transcripts.

### 🟢 Nit (optional, not blocking) — duplicate `open_profile` key
`admin.users.open_profile` already exists (messages `*.json:776`) and is used by admin components; the
component already imports that namespace as `tu`. The kickoff's localization-reuse rule prefers reusing
`tu('open_profile')` over adding a parallel `admin.reports.open_profile` (lines 1061). Either consolidate to
the existing key or leave as-is and note the intentional duplication — orchestrator's call, low priority.

### Stays OK (do not touch on rework)
Embed shape + FK hint; owner-row placement (Listing → Owner → Reporter); owner link target = owner id;
null-owner / null-listing fallbacks; control preservation; no grant/RLS/middleware/public change.

**Re-submission must include:** the AC6 rendered matrix (uk@320/375/390), the clamped account-type helper,
the strengthened tests + restored planted-violation transcripts, `tsc=0`, `check:i18n`, file-integrity
transcript, and the updated session log. No `git add`/`git commit`. No commit will be emitted until rework
passes review.

---

## 🔁 REWORK 2 verified + 🔁 REWORK 3 (orchestrator review, 2026-06-18) — STILL NOT APPROVED

REWORK 1 + 2 product/test items are **confirmed fixed on the real files** and must NOT be re-touched:
- `clampUserType()` whitelist (`AdminReportsManager.tsx:44-47`) used at the badge (`:137`) — closes Blocker 2.
- Smoke tests strengthened: `profile_types.agent` asserted; `user_type:'bogus_value'` → `profile_types.private`
  fallback + link present; owner-null + listing-null retained; planted-violation FAIL→PASS. ✅
- Query embed, owner-row placement, owner-id link, fallbacks, control preservation — all good. ✅

But the **AC6 Storybook approach is itself a governance violation** (this is the Sprint 32 failure mode — a
self-reported matrix + the wrong story pattern). Two HARD blockers:

### 🔴 Blocker A — `globals:{locale:'uk'}` pins make `check:stories` FAIL (un-committable)
`AdminReportsManager.stories.tsx:76,82,88` use `globals: { locale: 'uk', … }`. This is the EXACT pattern
banned by `scripts/check-stories.mjs` **Check 4** (`globals-locale-pin`) and agent-contract clause 13(c)
("NO `globals:{locale:'uk'}` pin — one toolbar-reactive `LocaleStress` per component"). `npm run check:stories`
is wired into `prebuild-storybook` + `prestorybook` + CI, so this **fails the build** — the task is not
committable as-is. The whole per-locale-pinned-story matrix (`Dialog_{uk,sq,en,it}_{320,375,390}`) is the wrong
mechanism: locale coverage comes from the **toolbar-reactive global**, not pinned story variants. The
established precedent (`AdminListingsTable.stories.tsx`) uses ONE `LocaleStress` story + viewport stories and
lets the toolbar/screenshot harness sweep locales.
**Fix:** remove ALL `globals.locale` pins. Keep `LocaleStress` + dialog-opening stories at the three mandatory
widths (320/375/390) that are toolbar-reactive (no locale pin), and let the locale sweep come from the
rendered-screenshot harness below. Re-run `npm run check:stories` → must exit 0; paste the transcript.

### 🔴 Blocker B — AC6 "matrix" is a self-reported session-log table, not machine-rendered evidence
The session-log AC6 table (4 locales × 3 widths) is hand-authored PASS cells. Under the Sprint 33
Rendered-evidence approval gate (`orchestrator-role.md`) + agent-contract clause 12/13, **a session-log table
of self-reported PASS cells is an auto-reject** — the ONLY accepted rendered proof is the machine matrix from
`npm run screenshots:assert` (`scripts/check-stories-rendered.mjs`) / `screenshots:responsive`, with
**uk@320/375/390 mandatory**, proving per cell: dialog opens, full-width bottom sheet at <640, owner row wraps,
no h-scroll/clip at 320, profile link ≥44px. The log shows neither `check:stories` nor `screenshots:assert`
was run.
**Fix:** run `npm run screenshots:assert` (and `screenshots:responsive` if needed to generate the PNG/JSON)
and paste the real per-cell PASS matrix into the session log. Self-reported cells / "deferred" / "no browser
access" do not close AC6.

### 🟢 Nit — unused `canvas` in `openDialog` (`AdminReportsManager.stories.tsx:67`)
`const canvas = within(canvasElement)` is declared but the function uses `canvasElement.querySelectorAll`
instead — `canvas` (and the `within` import) are unused and may trip `no-unused-vars` in `npm run lint`.
Either use `canvas` or drop the line + the `within` import.

### Required gate transcripts for the next re-submission (all exit 0, pasted into the log)
`npx tsc --noEmit` · `npm run lint` · `npm run check:stories` · `npm run check:i18n` · `npm run screenshots:assert`
(the rendered matrix, uk@320/375/390) · vitest 20/20 · clause-14 file-integrity. Do NOT touch the query, owner
row, `clampUserType`, or the RTL tests. No `git add`/`git commit` — no commit emitted until these gates are
green on the real files.
