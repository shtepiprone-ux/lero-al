# Sprint 17 — Task 288 kickoff (Project-wide i18n hardcode audit + remediation; localized status/enum labels)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 7** (every new/changed user-facing string covers all four locales `sq`/`en`/`uk`/`it` in the same key set; runtime locale switching visually confirmed).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands and MUST NOT run git.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — **"UI / layout / component" + "Admin table / admin control" bundles** (mixed; this audit spans public UI, admin tables, and shared primitives). No scope change; STOP & ASK if ambiguous; literal AC; self-validate; UI task → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

> **This is the THIRD localization task** (after Epic N v2 and Epic A). It is therefore deliberately NOT a one-file fix. It is a **systemic i18n quality task**: audit the whole project, fix the root causes of raw English leakage (especially raw enum rendering), and add a lightweight regression guard. A diff that only patches the notification component is INCOMPLETE and will be routed back.

---

## Scope clarification — this is NOT a notifications-only task (owner directive, 2026-05-29)

This task must audit and remediate localization hardcode across the **entire lero-al product**. The notification popover screenshot is only the owner-provided **proof** of the systemic issue. Sonnet MUST NOT limit the work to:
- notifications;
- listing status notifications;
- the specific "pending → active" string;
- one component;
- one page.

The required scope is **all user-facing and admin-facing UI where text can appear**, including:
- public site;
- admin panel;
- auth flows;
- profile/account flows;
- listing cards;
- listing details;
- contact card;
- favorites;
- collections;
- share flow;
- notification popover;
- notification list/items;
- admin dashboard;
- admin listings;
- admin users;
- admin support/inquiries;
- admin reports/complaints;
- filters;
- tabs;
- badges;
- buttons;
- forms;
- comboboxes;
- dropdowns;
- popovers;
- modals;
- toasts;
- validation errors;
- empty states;
- loading states;
- success/error states;
- aria-label/title/placeholder/tooltip text;
- any component that renders raw backend/API/database enum values.

**The task is INCOMPLETE if only the notification screenshot bug is fixed while other hardcoded or raw-English UI strings remain in reachable product/admin surfaces.** The screenshot fix is necessary but not sufficient; the orchestrator will route the diff back if the audit coverage (inventory table + per-surface classification) does not demonstrate that the whole product was swept.

---

## Task 288 — Project-wide i18n hardcode audit + remediation (localized status/enum labels everywhere)

```
Hard contract: see top.

Type:        bugfix + refactor (i18n quality / systemic)
Priority:    medium (owner-reported; NOT critical — placed in the next free Sprint 17 slot per owner directive 2026-05-29; may slip to Sprint 18 without penalty)
Area:        i18n / messages/*.json / next-intl setup / notifications / listing status & lifecycle / admin tables & surfaces / public listing UI / shared UI primitives (badges, toasts, dialogs, comboboxes, dropdowns, popovers, tables, empty/loading/error states)

Filed by: orchestrator (Opus 4.8) on 2026-05-29 from owner-reported bug
(Albanian locale selected, notification status transition still rendered
as raw English "pending → active"). Root cause already located by the
orchestrator during filing — see "Root cause (confirmed)" below — but
Sonnet must still run the full audit; the notification bug is the
symptom, not the whole task.
```

### Type
bugfix + refactor (systemic i18n quality task — audit AND remediation, not a report).

### Priority
medium. Owner explicitly stated this is **not critical** and may occupy the next free Sprint 17 slot or slip to the next Sprint. Do not treat as a blocker for the remaining Sprint 17 tasks (277/278/279/280).

### Area
i18n message files (`messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`), the `next-intl` setup (`next-intl@^4.9.1`), notification rendering and creation, listing status/lifecycle labels, admin tables and admin surfaces, public listing UI, and shared UI primitives that render labels/badges/buttons/filters/forms/empty-states/tables/modals/toasts/popovers/dropdowns/comboboxes.

### Pre-read (mandatory before any code change — "UI/component" + "Admin table" bundles from `docs/rule-index.md`; do NOT read all docs)

**Always required:**
1. `docs/agent-contract.md`
2. `docs/backlog.md`

**Required (UI/component + Admin table bundles):**
3. `docs/ai-behavior.md` → "Localization (i18n) Rules" (clause 7 long form), "Canonical Task Template", Note 18 (Pre-Completion Self-Validation), Note 19 (UX Flow Preservation), Note 20 (Existing-Control Preservation), Note 22 (Admin Table Preservation).
4. `docs/ui-rules.md` → no-hardcode UI gate + component-first rule.
5. `docs/component-rules.md` → hardcode restrictions, design-token usage, reusable-component standards.
6. `docs/component-governance.md` → §11 canonical `AdminTableRow` pattern (admin tables touched by this audit).
7. `docs/qa-rules.md` → validation + manual-testing checklist.

**Only if relevant:**
8. `docs/domain-rules.md` → listing status / lifecycle / role definitions (so the audit classifies enums correctly).
9. `docs/responsive-governance.md` → seven canonical breakpoints (text-length changes can break layout).

**Prior session logs for previous i18n/localization tasks (read to avoid re-introducing or re-fighting decided issues):**
10. Closed Epic N v2 + Epic A localization work — locate the session logs/summaries for Tasks **179, 180, 184** (Epic N) and **91, 103–106** (Epic A) via `docs/backlog.md` "Closed sprints & epics" + `tasks/Epics/Epic_N_Localization_Consistency_v2.md` + `tasks/Epics/Epic_A_Localization_and_Locale_Consistency.md`. Read at least the Epic N v2 plan and any `docs/sessions/*localiz*`/`*locale*` logs that exist.

**Locale + i18n infrastructure (read all before touching):**
11. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` (top-level namespaces today: `nav`, `listing`, `auth`, `common`, `cabinet`, `home`, `favorites`, `collections`, `admin`, `notifications`, `saved_search`, `contact`).
12. `next-intl` setup: locate and read the request config, routing/middleware locale utilities, and the `NextIntlClientProvider` wiring. Run the investigation greps below to find exact paths (do NOT assume — `next-intl@4` uses `src/i18n/*` or a `request.ts`/`routing.ts`; confirm).
13. `src/components/shared/LocaleSwitcher.tsx` and `src/components/admin/AdminLocaleSwitcher.tsx`, `src/lib/admin/getAdminLocale.ts`, `src/modules/admin/actions/locale.ts`, `src/modules/notifications/lib/emails/resolveUserLocale.ts`.

**Notification + status surfaces (the screenshot bug lives here):**
14. `src/modules/notifications/components/NotificationItem.tsx`, `NotificationCenter.tsx`, `NotificationBell.tsx`, `src/modules/notifications/hooks/useNotifications.ts`, `src/modules/notifications/lib/mutations.ts`.
15. `src/modules/listings/actions/applyListingTransition.ts` (**confirmed root cause line — see below**), `src/modules/listings/domain/listingSemanticHelpers.ts`, `listingSemanticLayer.ts`.
16. Listing status renderers: `src/app/[locale]/listings/[slug]/page.tsx`, `.../[slug]/edit/page.tsx`, `src/modules/cabinet/components/ListingsTab.tsx`, `src/components/admin/AdminListingsTable.tsx`, `src/components/admin/AdminDashboardRecentListings.tsx`, `src/components/admin/AdminUserProfile.tsx`.
17. Shared primitives that render labels: `src/components/ui/badge*.tsx`, button/dialog/toast/combobox/dropdown/popover/table primitives under `src/components/ui/`.

### Localization coverage
- **All four locales: `sq`, `en`, `uk`, `it`** — mandatory and equal. **Albanian (`sq`) is NOT a secondary locale; it receives the same quality bar as English.**
- Every user-facing string introduced or touched by this fix MUST exist in all four `messages/*.json` files under the same key path.
- Non-English locales MUST NEVER display raw English enum values. The forbidden raw-leak list (when a non-`en` locale is active): `pending`, `active`, `inactive`, `archived`, `sold`, `draft`, `rejected`, `approved`, `featured`, `premium`, `free`, `pro`, `expert`, `loading`, `error`, `save`, `cancel`, `edit`, `delete`, `share`, `submit`, `close`, `open`, `view`, `status`, `message`, `notification`, `collection`, `report`, `support`, `user`, `listing`.
- Raw database/API enum values MUST NEVER be rendered directly in the UI. Every enum displayed to a user or admin passes through a **localized label mapper** or a translation key.
- Runtime locale switching must be **visually confirmed** in all four locales (matching key counts is NOT sufficient — clause 7).

### Responsive coverage
- Verify at all seven canonical breakpoints: **320, 375, 390, 768, 1280, 1440, 2560.**
- Because localized strings change text length, verify that localized text does not overflow buttons/badges, break popovers, wrap incorrectly, or make admin tables unusable on mobile. Walk the worst-case length locale (usually `uk` or `it`) at 320px for every surface touched.

### Role contract
- You are the **Sonnet 4.6 executor**. The orchestrator (Opus) reviews the real diff, not your report.
- No scope change. STOP & ASK if anything is ambiguous (e.g. an enum that may be user-generated vs system). Do not invent architecture.
- Do not remove existing controls or flows (Notes 19/20/22).
- Update `docs/backlog.md` + add a session log under `docs/sessions/`. Include a **"Files Changed" table**. Do NOT emit or run git — the orchestrator emits commit commands during review (Task 264).

### Problem
The owner selected Albanian (`sq`) in the UI. The notification popover **title** is localized ("Njoftimet"), and the notification item content is partially localized, **but the status transition renders as raw English enum values: "pending → active".** This proves that some dynamic values / status labels / notification bodies / enum labels / fallback strings bypass the i18n system. Because this is the third localization task, the fix must eliminate the **root-cause patterns** project-wide, not just this one string.

#### Root cause (confirmed by orchestrator during filing — Sonnet must verify, then fix the general pattern)
`src/modules/listings/actions/applyListingTransition.ts` (~line 114-120) creates the `listing_status_change` notification with:
```ts
createNotification({
  ...
  type: 'listing_status_change',
  body: `${currentStatus} → ${transition.nextStatus}`,   // ← raw English enum codes baked into the stored string
  ...
})
```
The stored `body` is then rendered verbatim in `src/modules/notifications/components/NotificationItem.tsx` (`{notification.body}`). The notification is written ONCE (at transition time) but viewed LATER in the recipient's CURRENTLY-selected locale — so baking any locale's words into the stored row is wrong. Meanwhile localized status labels **already exist** in the message files: `listing.status_pending` ("Under review"), `listing.status_active` ("Active"), `listing.status_inactive`, `listing.status_sold`, `listing.status_rented`, `listing.status_archived` (and a `cabinet.status_*` parallel set). The fix is to **store structured/enum metadata** (old + new status codes) and **render localized labels at display time**, not to bake a string at write time, and to apply the same principle wherever else raw enums are rendered.

### Goal
Audit the entire project for hardcoded / fallback / incomplete / incorrectly localized UI text and raw enum rendering, then **fix the confirmed issues in scope** — including the screenshot bug — so that:
1. No supported locale ever shows a raw English enum where a localized label is expected.
2. The notification status transition renders localized old/new status labels per the active locale.
3. Every touched user-facing string exists in all four locales.
4. A lightweight regression guard prevents future locale-key drift and (where practical) raw-enum leakage.

### Positive flow (happy path)
As a user with locale `sq` selected:
1. An admin transitions one of my listings `pending → active`.
2. I open the notification popover.
3. The popover title shows "Njoftimet" (already correct).
4. The status-change notification body shows **localized Albanian status labels** for both the old and new status (e.g. the `sq` values of `listing.status_pending` and `listing.status_active`), with the design-approved arrow separator between them if retained.
5. Switching the UI to `uk` and re-opening the popover shows the SAME notification with **Ukrainian** status labels (because labels are resolved at render time, not baked at write time).
6. Same for `it` (Italian labels) and `en` (English labels).

### Negative flow (every off-happy-path branch)
- **`en` locale active** — status labels render in English (the only locale where English status words are correct). Verify this is via the localized key, not a raw enum coincidence.
- **Unknown / unmapped enum value** (e.g. a status code with no label key) — render a safe, explicitly-handled fallback (e.g. the raw code wrapped so it is visibly identifiable) AND log/flag it; do NOT crash and do NOT silently show a blank. STOP & ASK if you find an enum with no existing label key and it is unclear which key to add.
- **Legacy notification rows** already stored with the old baked English `body` (e.g. `"pending → active"`) — define and implement a render-time strategy: detect the legacy `"X → Y"` pattern and re-map the recognized enum tokens to localized labels at display time; if a token is unrecognized, fall back safely. Document this in the session log. (Do NOT run a data migration / DB write to rewrite historical rows unless the orchestrator approves — see Out of scope.)
- **Locale switch while popover open** — labels update on next render in the new locale.
- **User-generated content** (listing titles, names, messages, descriptions, city names entered by users) — MUST remain untranslated and unaltered. Do not route UGC through the label mapper.
- **Missing key in one locale** — must be caught by the new validation guard and fixed before completion (no `en`-only keys).
- **Empty notification list / loading / error states** — render localized empty/loading/error text (verify these are keyed, not hardcoded).

### Required investigation (PASTE outputs in the session log)

> Run the audit commands, then **classify every match** (see classification rule below). Do NOT blindly edit every match.

**1. Confirm the next-intl setup + locale list (do not assume paths):**
```
grep -rIn "next-intl\|NextIntlClientProvider\|getRequestConfig\|defineRouting\|createNavigation\|locales\s*[:=]" src/ next.config.ts middleware.ts 2>/dev/null --include="*.ts" --include="*.tsx"
```

**2. Confirm the screenshot root cause + find sibling raw-enum interpolations:**
```
grep -rIn "→\| -> \|\${.*[Ss]tatus}\|\${.*[Ss]tate}\|currentStatus\|nextStatus\|\.status\b" src/modules/notifications src/modules/listings 2>/dev/null --include="*.ts" --include="*.tsx"
```

**3. Find all `createNotification` call-sites (any baked-English body/title is suspect):**
```
grep -rIn "createNotification\|body:\s*\`\|title:\s*\`\|body:\s*'\|body:\s*\"" src/ 2>/dev/null --include="*.ts" --include="*.tsx"
```

**4. Locate existing localized status/enum label keys (reuse — do NOT duplicate):**
```
grep -rIn "status_\|_status\|role_\|plan_\|type_\|filter_status\|status_label" messages/en.json
```

**Git Bash audit commands (run, then classify — do NOT change every match):**
```bash
for d in app src components lib modules; do [ -d "src/$d" ] && grep -RInE "pending|active|inactive|archived|sold|draft|rejected|approved|featured|premium|free|pro|expert|Loading|Error|Save|Cancel|Edit|Delete|Share|Submit|Close|Open|View|Status|Message|Notification|Collection|Report|Support|User|Listing" "src/$d"; [ -d "$d" ] && grep -RInE "pending|active|inactive|archived|sold|draft|rejected|approved|featured|premium|free|pro|expert|Loading|Error|Save|Cancel|Edit|Delete|Share|Submit|Close|Open|View|Status|Message|Notification|Collection|Report|Support|User|Listing" "$d"; done
for d in app src components lib modules; do [ -d "src/$d" ] && grep -RInE "aria-label=|title=|placeholder=|toast\.|throw new Error|setError|description:|label:|empty|loading|success|failed|status" "src/$d"; done
for d in app src components lib modules; do [ -d "src/$d" ] && grep -RInE ">\s*[A-Za-z][A-Za-z0-9 ,.!?'’()/&+-]{2,}\s*<" "src/$d"; done
```

**PowerShell audit commands (owner/Windows-side equivalents; adapt `-Path` to where `app/src/components/lib/modules` actually live — in this repo source is under `src/`):**
```powershell
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Path src -ErrorAction SilentlyContinue | Select-String -Pattern 'pending|active|inactive|archived|sold|draft|rejected|approved|featured|premium|free|pro|expert|Loading|Error|Save|Cancel|Edit|Delete|Share|Submit|Close|Open|View|Status|Message|Notification|Collection|Report|Support|User|Listing' | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Path src -ErrorAction SilentlyContinue | Select-String -Pattern 'aria-label=|title=|placeholder=|toast\.|throw new Error|setError|description:|label:|empty|loading|success|failed|status' | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Path src -ErrorAction SilentlyContinue | Select-String -Pattern '>\s*[A-Za-z][A-Za-z0-9 ,.!?''’()/&+-]{2,}\s*<' | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
```

**Classification rule (mandatory — every match falls into exactly one bucket):**
- **(A) user-facing hardcode that must be fixed** → replace with an i18n key (×4 locales).
- **(B) user-generated content that must NOT be translated** → leave as-is (listing titles/descriptions/names/messages/city names).
- **(C) internal code identifier** (enum literal in logic, object key, type, DB column, route segment) → leave as-is; do NOT translate.
- **(D) acceptable technical/currency/acronym string** (`EUR`, `ALL`, `URL`, `ID`, `WhatsApp`, etc.) → leave as-is.
- **(E) test/mock/dev-only string** → leave as-is.
- **(F) false positive** → record and leave as-is.

### Implementation requirements
1. **No direct rendering of backend enum values in UI.** Every enum shown to a user/admin passes through a localized label mapper or a translation key.
2. **Fix the screenshot bug at the root, not in the component as a one-off:**
   - Change `applyListingTransition.ts` notification creation so it stops baking English words into `body`. Store the old + new status **codes** as structured data the renderer can localize (e.g. a small JSON payload / dedicated columns / a parseable token format — pick the approach that fits the existing `notifications` schema; if a schema change is needed, STOP & ASK and document the proposed migration for orchestrator + owner approval — see Out of scope clause on schema).
   - In `NotificationItem.tsx` (and any other notification renderer), resolve `listing_status_change` old/new values to **localized labels** at render time using the existing `listing.status_*` keys (or a shared helper — see #3). Keep the design-approved arrow separator if retained; localize the values around it.
   - Handle legacy rows (negative-flow item above) at render time.
3. **Centralize repeated status/enum label mappings** into shared, imported helpers rather than duplicating local one-off maps. Create/extend a single canonical localized-label helper for repeated domain enums:
   - listing status (`pending`/`active`/`inactive`/`sold`/`rented`/`archived` …)
   - user role / user status
   - report status
   - support ticket / inquiry status
   - plan / subscription labels (`free`/`pro`/`expert`/`premium`)
   - notification event types (reuse the existing `notifications.type_*` keys)
   - listing lifecycle transitions
   If a canonical helper already exists (e.g. in `listingSemanticHelpers.ts`), extend it; do NOT add a parallel one. Do NOT duplicate a local status map that already has a canonical source — import the canonical one.
4. **All notification old/new values** that represent known enums must be localized.
5. **All admin filters / tabs / buttons / badges** use i18n keys.
6. **All public listing cards / details / contact / favorites / collections / share UI** use i18n keys.
7. **All toast / modal / empty / loading / error / success messages** touched by the audit use i18n keys.
8. **All placeholders, aria-labels, title attributes, tooltips, combobox labels, dropdown labels** touched by the audit use i18n keys.
9. **Locale keys are added to `sq`/`en`/`uk`/`it` together** in this task (no `en`-only additions).
10. **If a string is intentionally NOT translated**, document why in the session log (bucket B/C/D/E/F).
11. **Regression guard:** if the project has no i18n key-parity check, add a lightweight, non-invasive script (e.g. `scripts/check-i18n-parity.mjs` wired as an `npm run check:i18n` script in `package.json`) that:
    - verifies the four locale files have identical key sets (reports missing/extra keys per locale);
    - fails (non-zero exit) on any divergence;
    - (best-effort, where practical) flags known raw status-enum strings appearing in JSX render paths.
    Mirror the existing `check:schema-drift` script style if one exists. Do NOT add heavy tooling or new runtime dependencies.

### Specific areas Sonnet MUST inspect (audit coverage — classify + fix in-scope issues in each)
- header / language switcher / account menu / notification popover
- notification list + notification item rendering (the bug surface)
- listing card
- listing details page
- contact card
- favorites page
- collection save flow
- share flow
- auth pages
- profile pages
- user dashboard (cabinet)
- admin dashboard
- admin listings table
- admin users table
- admin reports / complaints
- admin support / inquiries
- admin settings / content pages
- filters + tabs on public and admin pages
- reusable Button / Dialog / Toast / Combobox / Dropdown / Popover / Badge / Table primitives
- validation + error messages
- empty / loading / success states

### Required inventory table (MUST appear in the `docs/sessions/` log)
| Area | Files inspected | Issue type | Example found | Fixed? | Notes |
|---|---|---|---|---|---|

`Issue type` MUST use exactly these categories:
`JSX hardcoded text` · `hardcoded attribute text` · `hardcoded toast/dialog text` · `raw enum rendered in UI` · `missing locale key` · `fallback English in non-English locale` · `inconsistent translation` · `duplicated local translation map` · `acceptable false positive`.

### Out of scope (do NOT touch)
- Changing product behavior unrelated to localization.
- **Changing the database schema** — unless the localized fix for the notification payload genuinely requires it; in that case STOP & ASK, propose the migration, and proceed only with documented orchestrator + owner approval. Prefer a no-schema-change approach (structured token in existing `body`/metadata) first.
- Running a data migration to rewrite historical notification rows (handle legacy rows at render time instead) — unless explicitly approved.
- Changing route structure or locale slugs / supported-locale list.
- Changing listing lifecycle LOGIC (only its label rendering).
- Changing auth / session logic.
- Redesigning any UI.
- Replacing or upgrading the i18n library (`next-intl`).
- Translating user-generated listing titles / descriptions / names / messages.
- Translating currency codes (`EUR`, `ALL`) or proper names (user names, city names, property titles, owner-entered content).
- Hiding untranslated text instead of fixing it.
- The in-flight Sprint 17 surfaces owned by other tasks: WhatsApp CTA (277), premium filter (278), favorite heart sync (279), phone combobox (280), auth session model (281) — do not refactor their logic; you MAY fix a hardcoded string they render only if it is not part of their open diff (coordinate via STOP & ASK if overlap is unclear).

### Acceptance criteria (literal)
- The screenshot bug is fixed: with `sq` active, the notification no longer shows "pending → active" as raw English; it shows localized Albanian status labels for old + new values.
- No known raw listing-status enum is rendered directly in the UI in any locale (verified on the listed surfaces).
- All strings fixed by this task have keys in `sq`/`en`/`uk`/`it` (same key path in all four).
- No missing translation keys across `sq`/`en`/`uk`/`it` for any key touched by this task (proven by the new `check:i18n` guard).
- User-facing hardcoded English found by the audit is either fixed or documented as an acceptable false positive (bucket F) with reasoning.
- Notification status transitions use localized labels for old and new values (resolved at render time; legacy rows handled).
- Admin status badges / tabs / filters use localized labels.
- Public listing status labels use localized labels.
- Toasts / dialogs / empty / loading / error states touched by the task use i18n keys.
- Placeholder / aria / title / tooltip text touched by the task uses i18n keys.
- No user-generated content is incorrectly translated.
- Repeated enum label maps are centralized/imported, not duplicated.
- Layout remains usable at 320/375/390/768/1280/1440/2560 in all four locales (worst-case length locale walked at 320px).
- Existing controls/flows preserved (Notes 19/20/22); no silent removals.
- 0 new lint errors / 0 new warnings.
- `npx tsc --noEmit` → 0 errors. `npm run build` passes.
- `docs/backlog.md` updated; session log added under `docs/sessions/` with the inventory table + Note 18 self-validation block + "Files Changed" table.
- New `check:i18n` guard added (if none existed) and passing.

### Required validation (run, or document why impossible)
```
npm run lint
npx tsc --noEmit
npm run build
npm run check:i18n        # the new/existing locale-parity guard
npm run check:schema-drift   # only if a schema change was approved; otherwise note "no schema change"
```
Also run any existing project validation for typecheck / tests / governance scan that `package.json` exposes (inspect `package.json` scripts first and list which you ran). If a test runner exists (`vitest` is configured — `vitest.config.ts`), run the relevant suites.

**Targeted manual QA in ALL FOUR locales (`sq`/`en`/`uk`/`it`)** — minimum pages/flows:
- notification popover with a listing status-change notification (the bug surface) — confirm localized old/new labels in each locale + locale switch updates labels;
- listing details page;
- listing card / listing list;
- favorites / collections flow;
- admin listings table;
- admin reports / support area;
- profile / account (cabinet) area.

### Final report requirements (in the session log)
1. Files changed (the "Files Changed" table — one row per path + 1-line rationale).
2. Translation keys added/changed, grouped by locale (`sq`/`en`/`uk`/`it`) with parity confirmation.
3. Inventory of inspected areas (the inventory table above).
4. List of confirmed hardcoded/fallback strings fixed.
5. List of raw-enum render paths fixed.
6. List of false positives intentionally left unchanged and why (buckets B/C/D/E/F).
7. Confirmation that the screenshot bug is fixed (with before/after).
8. Confirmation that `sq`/`en`/`uk`/`it` were all covered.
9. Responsive verification notes for all seven breakpoints (worst-case locale at 320px).
10. Validation commands and their results.
11. Any remaining risks (e.g. legacy notification rows, enums deferred to a follow-up).
12. Self-validation verdict line: `Self-validation: tsc=0 · build=passes · lint=clean · check:i18n=pass · AC table=all green · runtime locales sq/en/uk/it=PASS · scope=clean`.

> **Do NOT** emit `git add` / `git commit` commands. Do NOT run git. Do NOT change the i18n library, route structure, locale list, or DB schema (without approval). Do NOT translate user-generated content or currency codes. Do NOT hide untranslated text. Do NOT touch the open diffs of Tasks 277-281. STOP & ASK on any ambiguity (especially unmapped enums or a required schema change).
```
