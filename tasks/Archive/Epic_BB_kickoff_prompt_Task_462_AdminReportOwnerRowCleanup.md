# Task 462 — Hotfix: clean admin report-details owner row (remove badge + raw i18n key)

> **Epic BB — Listing Inquiries: Report & Message.** Thread: 435 diag → 458 Fix B → 459 Fix A → 460 grants → **461 owner row** → **462 (this) owner-row cleanup**.
> Executor: **Sonnet 4.6**. Orchestrator (Opus) reviews the real diff + emits the commit. **Do not run git yourself.**
> This is a **UI-only hotfix**. The full admin report-management feature (reopen / change status / close / **hard delete**) is a SEPARATE task — **Task 463** — do NOT start it here.

## Context / problem

After Task 461 live validation, the admin report-details dialog (`ReportDetailDialog` inside `AdminReportsManager.tsx`) renders a **raw i18n key** in the owner row: `Admin.Users.Profile_types.Private`. Root cause: the dialog calls `tu(\`profile_types.${...}\`)` against the `admin.users` namespace, which is **not supplied to this admin page's client i18n provider**, so next-intl prints the raw key path. A raw key must never be visible to an admin.

**Owner decision:** remove the account-type badge from the report-details owner row entirely (it is not needed in this compact dialog). This deletes the failing `admin.users` lookup at the source — no provider change required.

## Pre-read (load ONLY these — `docs/rule-index.md` → "Admin control / UI" + always-required)

- `docs/agent-contract.md` (clauses 1–15)
- `docs/backlog.md`
- `docs/critical-flow-registry.md` → **"Report listing" row** (this dialog is part of that flow; clause 15 regression-coverage applies — UPDATE the existing `AdminReportsManager.smoke.test.tsx` coverage, do not drop it)
- `docs/design-system.md` → **§26 (mobile <640 full-width + bottom-sheet gate)**
- `docs/ui-rules.md`
- `docs/component-rules.md`
- `docs/qa-rules.md`
- `docs/ai-behavior.md` → Note 22 "Admin Table Preservation Rule", Note 18 (self-validation), Note 19 (UX flow), Note 20 (control preservation)

## Scope

**Allowed (only these files):**
- `src/components/admin/AdminReportsManager.tsx`
- `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx`
- `src/components/admin/AdminReportsManager.stories.tsx`
- `docs/backlog.md` / `docs/sessions/` / `docs/critical-flow-registry.md` (process: session log + registry coverage note). **Do not emit git commands** — orchestrator commits.

> ⚠️ **Keep the `Badge` import.** Only the owner-row badge is removed. `Badge` is still used by the Status rows (`AdminReportsManager.tsx` L106 detail + L331 table). Do NOT delete the `import { Badge }` line — that breaks the build.

**Do NOT touch:** report submission (`reportListingAction`), the `updateReportStatusAction` server action, the query embed (the `owner:users!...` embed from Task 461 stays), DB / RLS / grants, middleware, public listing UI, admin users profile UI, **the public listing-report SUBMISSION dialog (`ReportListingDialog` + `reportListingAction`)** — note this is NOT the same as `ReportDetailDialog` inside `AdminReportsManager.tsx`, which IS the file you edit. **No new admin management actions** — that is Task 463.

## Current behavior to preserve

The `ReportDetailDialog` owner row (`AdminReportsManager.tsx` ~L135–154) currently renders, when `report.listing?.owner` is present:
1. label `t('col_owner')` ("Власник оголошення");
2. owner display name (`report.listing.owner.name ?? '—'`);
3. **an account-type `Badge`** built from `tu(\`profile_types.${clampUserType(owner.user_type)}\`)` ← **the source of the raw key — to be removed**;
4. an in-app `next/link` to `/admin/users/[ownerId]` with text `t('open_profile')`, `min-h-11`.

When `owner` is null → `t('owner_not_found')`, no link. All OTHER rows (Status, Reason, Listing, Reporter, Comment, Date) and the action buttons (review/dismiss/resolve/close) MUST remain byte-for-byte unchanged.

## Required after-behavior (exact)

Owner row, owner present:

```
Label:  t('col_owner')           ← "Власник оголошення" (unchanged)
Value row (single flex row):
  <owner name>            ← left edge
  t('open_profile') link → /admin/users/[ownerId]   ← right edge
```

1. **Remove** the account-type `Badge` and its `tu('profile_types.*')` call from the owner row.
2. **Remove** the now-unused `const tu = useTranslations('admin.users')` (L72).
3. **Remove** `clampUserType()` and the `KNOWN_USER_TYPES` const (L44–47) — they become unused. Confirm no other reference remains (grep).
4. Owner name left, profile link right, attached to opposite edges: the value row uses `flex items-center justify-between gap-2 flex-wrap`. The link must NOT drop to its own line except when 320px wrapping forces it (`flex-wrap`).
5. Preserve the profile link exactly: internal `next/link`, `href={\`/admin/users/${report.listing.owner.id}\`}`, accessible name `t('open_profile')`, touch target `min-h-11` (≥44px).
6. Preserve the null fallbacks: `owner` null → `t('owner_not_found')`, no link, no crash; `listing` null → fallback, no crash.
7. No raw `profile_types` / `admin.users.*` string can appear anywhere in this dialog after the change.

## Positive flow (happy path)

- Actor: admin/moderator viewing `/admin/reports`. Precondition: at least one report with a present listing owner.
- Step 1: click a report row → `ReportDetailDialog` opens.
- Step 2: owner row shows owner name on the left and "Відкрити профіль" / "Open profile" on the right, edge-to-edge, no badge.
- Step 3: click the profile link → navigates in-app to `/admin/users/[ownerId]`.
- Success state: no raw `Admin.Users.Profile_types.*` text anywhere; reporter row still distinct from owner row.

## Negative flow (every off-happy-path branch)

- **owner null (deleted user):** owner row shows `t('owner_not_found')`; NO profile link; no badge; no crash.
- **listing null:** owner row shows the `owner_not_found` fallback; no crash.
- **unknown/odd `user_type`:** irrelevant now (badge removed) — but must NOT reintroduce any `profile_types` lookup or raw key for any `user_type` value.
- **long owner name @320 (uk/sq):** name wraps / link drops below via `flex-wrap`; no horizontal overflow at 320px; link stays ≥44px tappable.
- **dialog dismiss (Esc / backdrop):** closes, focus returns to the trigger row (unchanged Dialog behavior).

## Mobile <640 full-width gate (OWNER P0)

- The dialog CONTAINER is the canonical `Dialog` (already full-width bottom-sheet at <640 per §26 — **do not modify the container**).
- The owner **value row** must be full-width within the dialog content and must NOT clip or h-scroll at 320px in any of sq/en/uk/it. Long labels/names wrap (`whitespace-normal break-words` / `flex-wrap`), never clip.
- Touch target: the profile link keeps `min-h-11` (≥44px).
- Exempt controls: none new. No icon-only additions.

## Regression coverage (clause 15 — "Report listing" critical flow)

UPDATE `AdminReportsManager.smoke.test.tsx` (baseline: the 4 Task-461 tests currently pass — record that). The owner-present test must now assert:
- shows owner name (`Owner Person`);
- shows the profile link with `href="/admin/users/u-owner"` (owner id, NOT reporter id);
- reporter row still distinct (`Reporter Person`, `col_reporter`);
- **does NOT** render any string containing `profile_types`;
- **does NOT** render the account-type badge (the `data-testid="badge"` for the owner row is gone; the Status badge elsewhere may remain — assert specifically that no `profile_types*` text exists rather than asserting zero badges globally).

Keep the owner-null test (`owner_not_found`, no profile link) and listing-null test (fallback, no crash). The "unknown user_type → private label" test (Task 461) must be **replaced** (the badge/label no longer exists) with an assertion that an unknown `user_type` produces **no raw key and no crash**, link still present.

**🔴 Planted-violation transcript is MANDATORY (clause 15 gate, not a "note").** Temporarily re-introduce the badge `tu(\`profile_types.${...}\`)` in the owner row, run the smoke test, and confirm the "no `profile_types` text" assertion **FAILS**; then revert and confirm it **PASSES**. Paste the FAIL→PASS transcript into the session log (same as Task 461's `planted reporter-id-in-owner-link FAIL→PASS`). A regression test that does not demonstrably fail on the planted violation is a no-op gate and the task is INCOMPLETE.

> ⚠️ **The planted violation must COMPILE and RENDER the raw `profile_types.*` text — the FAIL must come from the smoke assertion, NOT from a TypeScript/build error.** Re-add whatever the badge needs (`tu`, `clampUserType`) so the component renders the raw key, then prove the assertion catches it. A red test caused by a missing symbol / tsc failure does NOT count as the required planted-violation FAIL.

Update the `docs/critical-flow-registry.md` "Report listing" row coverage cell to note Task 462 (badge removed; no-raw-key assertion added).

## Rendered evidence (clause 12/13 — mandatory, UI task)

- Stories: keep the 4 toolbar-reactive `DialogOwnerRow_*` stories. Re-run `npm run screenshots:assert` (or `screenshots:assert --fast`) and paste the PASS matrix; **uk@320/375/390 mandatory**. Each cell confirms: owner name left + profile link right, no badge, no raw `profile_types` key, no h-scroll at 320, link ≥44px.
- Paste the rendered verification matrix (breakpoints × sq/en/uk/it) into the session log.

## Acceptance criteria (each must map to a flow + be verifiable in the diff)

1. Raw `Admin.Users.Profile_types.Private` (and any `profile_types.*` text) no longer appears in the report-details dialog — *Positive step 2; regression "no profile_types text" assertion @ test file:line*.
2. Account-type badge removed from the owner row; `tu`/`clampUserType`/`KNOWN_USER_TYPES` removed and unreferenced — *diff @ AdminReportsManager.tsx:line*. **Grep-clean proof (paste transcript):** `grep -nE "profile_types|useTranslations\('admin\.users'\)|clampUserType|KNOWN_USER_TYPES" src/components/admin/AdminReportsManager.tsx` returns **no matches**. (The `Badge` import stays — Status rows still use it.)
3. Owner row = name left + profile link right via `justify-between` + `flex-wrap`; link → `/admin/users/[ownerId]`, `min-h-11` — *Positive step 2–3; diff:line*.
4. owner-null → `owner_not_found`, no link, no crash; listing-null → fallback, no crash — *Negative branches; regression tests:line*.
5. Reporter row and all other rows/actions unchanged (before/after control inventory in the log) — *Note 20*.
6. No production behavior change outside this dialog.
7. Gates green: `npx tsc --noEmit` = 0; `npm run check:i18n`; `npm run check:stories`; `npx vitest run src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx`; `npm run screenshots:assert` (uk@320/375/390). File-integrity (clause 14): 0 NUL / parses / not truncated on every touched file — paste the green transcript.
8. **Planted-violation FAIL→PASS transcript present in the session log** (clause 15): re-introduced badge `tu('profile_types.*')` makes the "no `profile_types` text" smoke assertion FAIL; revert → PASS. A "note" is not sufficient — the transcript is the proof.

## Hard contract (verified against the diff on return)

No scope change; no invented architecture (stop & ask); literal AC; self-validation block + AC-by-AC table in the session log; UX flow + control-preservation inventory; **"Files Changed" table** (one row per path + rationale); do NOT emit `git add`/`git commit`. Both positive AND negative flows implemented. Mobile <640 gate satisfied with rendered proof.
