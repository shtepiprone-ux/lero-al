# Sprint 17 — Task 290 kickoff (Project-wide no-ellipsis UX audit: wrap localized UI text instead of truncating it)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 1** (no scope change — but note this task's scope IS the whole project audit), **clause 2** (do not invent architecture; STOP & ASK), **clause 3** (no silent control removal), **clause 5** (UX flow preservation), **clause 6** (current + after behavior documented).
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 7** (every new/changed user-facing string covers all four locales `sq`/`en`/`uk`/`it` in the same key set; runtime locale switching visually confirmed).
> - `docs/agent-contract.md` **clause 8** (7 breakpoints: 320, 375, 390, 768, 1280, 1440, 2560).
> - `docs/agent-contract.md` **clause 9** (validation before complete: `tsc=0`, build, AC-by-AC self-audit).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. **Sonnet MUST NOT emit `git add` / `git commit` and MUST NOT run git.** The owner runs git in PowerShell; the orchestrator emits the commit commands during review.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — **MIXED task: "UI / layout / component task" bundle (primary) + i18n rules** (this spans public UI, admin tables/filters, and shared primitives). No scope change beyond the truncation audit; STOP & ASK if ambiguous; literal AC; self-validate; every UI surface → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

> **🚧 HARD BLOCKER — this is NOT a single-component fix.** The listing owner contact card
> (`"Дані власника наразі недосту…"`) is only the *visible symptom*. This is a **project-wide
> UX / i18n / responsive audit + remediation task**. A diff that fixes only the contact card is
> INCOMPLETE and will be routed back. See "Mandatory audit" + "Acceptance is failed if…".

---

## Title

Project-wide no-ellipsis UX audit: wrap localized UI text instead of truncating it

## Type

bugfix / UX / i18n / responsive

## Priority

high

## Area

site + admin + shared UI components + localized text rendering

---

## Pre-read (in this order)

1. `docs/agent-contract.md`
2. `docs/rule-index.md`
3. `docs/backlog.md`
4. `docs/ai-behavior.md` (Notes 18, 19, 20 — preservation core)
5. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md` (UI bundle)
6. `docs/responsive-governance.md` + `docs/responsive-screenshot-governance.md` (breakpoints / verification)
7. `docs/component-governance.md` (shared-primitive + `AdminTableRow` patterns — fix shared, not local)
8. `docs/tailwind-governance.md` + `docs/tailwind-canonical-fragments.md` (canonical class fragments; no new arbitrary styles)
9. i18n / localization rules referenced from `docs/ai-behavior.md` → "Localization (i18n) Rules"
10. `src/modules/listings/components/ListingContact.tsx` (the known offender — see "Known required fix")
11. Shared UI primitives: `src/components/ui/*` (Card, Button, Badge, Table, Dialog, Combobox, Tooltip if present), `src/components/shared/*`, `src/components/layout/*`
12. Admin layout/table/filter components: `src/components/admin/*`, `src/app/admin/*`
13. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`

---

## Problem statement

The UI can silently truncate localized user-facing text. Confirmed example: the listing owner contact
card renders the full sentence `listing.owner_name_unavailable` inside a `<p className="… truncate">`
(`src/modules/listings/components/ListingContact.tsx` line ~125, and again at line ~292). Tailwind
`truncate` = `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`, so the Ukrainian string
`"Дані власника наразі недоступні."` is cut to `"Дані власника наразі недосту…"`. This is bad UX and
i18n-hostile: `sq`/`en`/`uk`/`it` phrases have different lengths, so a width that fits English will cut
Ukrainian/Italian. The user must be able to read the full text without hovering or guessing.

**This is a systemic pattern, not a one-off.** An orchestrator pre-scan found ~51 `truncate`, ~15
`line-clamp`, ~10 `whitespace-nowrap`, plus `text-ellipsis`/`overflow-hidden`/CSS-`clamp` usages spread
across admin (11 files), listings, shared primitives, cabinet, locations, layout, and more.

## Goal

Audit the entire project and remove **unsafe** truncation of user-facing UI copy, replacing it with
wrapping behavior that preserves readability across all locales and breakpoints. Fix the known owner
contact card issue **and every similar occurrence** found during the audit. Retain truncation only for
legitimately compact technical/data values, and only when the full value stays accessible.

---

## Mandatory audit (run, classify, report)

> **Repo layout note:** in `lero-al` everything lives under `src/` (there is no top-level `app/`,
> `components/`, `modules/`, or `lib/`). Use the corrected paths below.

**PowerShell (owner environment):**
```
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js,*.css,*.scss,*.module.css,*.module.scss -Path src | Select-String -Pattern "truncate|text-ellipsis|line-clamp|overflow-hidden|whitespace-nowrap|text-overflow|ellipsis|nowrap|LineClamp|clamp"
```

**Git Bash / Linux:**
```
grep -RInE "truncate|text-ellipsis|line-clamp|overflow-hidden|whitespace-nowrap|text-overflow|ellipsis|nowrap|LineClamp|clamp" src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.css" --include="*.scss" --include="*.module.css" --include="*.module.scss"
```

Classify **every** finding into exactly one group:

1. **Must fix now** — localized / user-facing UI text that can be cut.
2. **Allowed only with accessible full text** — dense data tables, technical IDs, URLs, emails,
   filenames, internal identifiers, or intentionally compact metadata.
3. **False positive** — `overflow-hidden` used for layout/clip/rounded-corner/gallery effects, or CSS
   `clamp()` used for fluid font-sizing — does NOT cut readable UI text.

For every **group 2** case, the full value MUST stay available via one of:
- visible full text in an expanded / mobile layout;
- a canonical tooltip/popover **if the project already has one** (do not invent a new one);
- table-cell wrapping on mobile;
- accessible `title`/`aria-label` **plus** enough visible context (NOT as the sole fix for normal labels);
- explicit justification documented in the session log.
> Wrapping on focus/hover alone is NOT acceptable. `aria-label`/`title` alone is NOT acceptable for
> normal labels/headings/descriptions — those require visible wrapping.

---

## Default fix rules

- User-facing labels, headings, descriptions, button text, menu text, empty states, form labels,
  helper text, card titles, card descriptions, dialog text, filter labels, navigation labels, and
  localized status text **must wrap**.
- Do NOT use ellipsis for normal localized UI copy.
- Prefer `whitespace-normal`, `break-words` / `[overflow-wrap:anywhere]` where needed, `min-w-0`
  (to let flex children shrink+wrap), `flex-wrap`, grid `minmax()` fixes, and `h-auto` behavior.
- Do NOT create layout shifts that break cards or buttons.
- Do NOT hide full text behind hover-only behavior on mobile.
- Do NOT "fix only Ukrainian" — validate `sq`/`en`/`uk`/`it` because all four differ in length.
- Do NOT hardcode shorter labels or abbreviations to avoid wrapping. Do NOT replace translations with
  abbreviations unless the locale file already intentionally uses one AND the owner approved it.
- Do NOT remove existing UI controls while changing layout.
- Do NOT create local duplicate components when a **shared** component should be fixed.
- Do NOT introduce a new visual style — preserve the existing design system; only allow text to wrap.

---

## Known required fix

`src/modules/listings/components/ListingContact.tsx` — remove the `truncate` that cuts
`owner_name_unavailable` (lines ~125 and ~292; also audit the `truncate` on the actual owner name in
the same blocks). The full localized phrase must wrap and remain readable at **320 / 375 / 390** px.
The contact card must remain visually clean, and the price, login prompt, login button, share button,
and all other existing controls must remain reachable and not overlap.

> Decide deliberately: the owner *name* line may keep a bounded clamp ONLY if (a) it is a real name
> (not the unavailable sentence) AND (b) the full name stays accessible. The `owner_name_unavailable`
> sentence must always wrap. Document the decision in the session log.

---

## Project-wide required areas (audit each; site and admin verified SEPARATELY)

Public listing detail page · listing cards · owner/contact cards · homepage sections · listings page
filters · favorites page · profile/cabinet pages · auth pages · admin dashboard · admin listings ·
admin users · admin reports/complaints · admin support/requests · admin settings/content pages ·
shared UI primitives (`src/components/ui/*`) · shared admin table/filter components · mobile navigation ·
sidebars and menus · dialogs, popovers, dropdowns, comboboxes, toasts, empty states, badges, buttons.

---

## Localization coverage

Verify `sq` / `en` / `uk` / `it`. No hardcoded shortened fallback text. If locale strings are missing
or inconsistent, document them and fix **only** if directly required for the truncation issue. Do NOT
perform a general translation rewrite unless a string is directly involved in truncation or is missing.

## Responsive coverage

Verify 320, 375, 390, 768, 1280, 1440, 2560 — especially the mobile widths (320/375/390) where
truncation is most visible.

## Accessibility requirements

- Full user-facing text readable without hover.
- Mobile users must not lose access to full text.
- Compact table/technical values that keep truncation must expose the full value accessibly.
- `aria-label`/`title` must NOT be the only fix for normal labels/headings/descriptions — visible
  wrapping is required for normal UI copy.

## Design-system requirement

If repeated truncation originates in a shared component, fix the **shared component** (one change, many
call-sites) rather than patching each usage. If a local component duplicates shared behavior, document
it and either align it with the shared component or justify why not. No new visual style.

---

## Positive flow (happy path)

A localized phrase longer than its container (e.g. the `uk`/`it` owner-unavailable sentence, or a long
admin filter label) wraps to multiple lines and is fully readable at every breakpoint in every locale,
with the surrounding layout intact and all controls reachable.

## Negative flow (every off-happy-path branch — clause 6a)

- **Very long single token** (URL/email/no-spaces string in a group-2 cell): does not blow out the
  layout — uses `break-words`/`anywhere` or accessible full-value reveal; documented.
- **Narrowest viewport (320px):** wrapped text does not overlap adjacent controls or overflow the card.
- **Widest viewport (2560px):** wrapping change does not leave awkward gaps or break the grid.
- **Locale switch at fixed width:** switching `sq↔en↔uk↔it` never re-introduces an ellipsis cut.
- **Empty / fallback state** (e.g. `owner_name_unavailable`, empty-state copy): wraps, never cut.
- **Group-2 retained truncation:** full value still accessible (verified), justification logged.
- **RTL/long compound words:** `break-words` applied where a single long word would still overflow.

---

## Required validation (run and report; document any that cannot run)

```
npm run lint
npm run build
# existing tests, if present:
npm test            # or the project's standard test command (e.g. npx vitest run)
# governance scan, if present:
npm run governance  # or the project's standard governance command
```
Plus:
- the truncation grep/search results **before and after** the changes (counts + diff of remaining hits);
- manual responsive verification of the known contact card at 320 / 375 / 390;
- spot-check of site and admin surfaces in `sq` / `en` / `uk` / `it`.

> If a script name above does not exist, check `package.json` `scripts` and run the project's actual
> equivalent; record what you ran. `npx tsc --noEmit` must be 0 errors regardless (clause 9).

---

## Audit matrix (REQUIRED in the session log — acceptance fails without it)

One row per matched occurrence:

| File path | Component / module / page | Matched pattern | Classification (1/2/3) | Action taken | Reason if retained | Localization risk | Responsive risk |
|---|---|---|---|---|---|---|---|

---

## Acceptance criteria (orchestrator verifies against the diff, not the report)

- [ ] Known owner contact card truncation fixed; `"Дані власника наразі недоступні."` (and `sq`/`en`/`it` equivalents) wrap fully at 320/375/390; layout clean; all controls reachable.
- [ ] Project-wide audit for `truncate`/`nowrap`/`ellipsis`/`line-clamp`/`overflow-hidden`/`clamp` completed; **audit matrix present** in the session log.
- [ ] Every group-1 (unsafe user-facing) truncation fixed to wrap.
- [ ] Every group-2 retained truncation documented with justification AND accessible full-text behavior.
- [ ] `sq`/`en`/`uk`/`it` verified; 320/375/390/768/1280/1440/2560 verified; **site and admin verified separately**.
- [ ] No user-facing localized label, heading, helper text, button label, card title/description, dialog text, menu item, empty state, or form label is silently cut with ellipsis.
- [ ] No existing controls silently removed (Note 20).
- [ ] No new hardcoded shorter text / abbreviations introduced.
- [ ] No new duplicate local UI primitive introduced where a shared primitive exists; shared fixes preferred.
- [ ] No new lint/build/governance issues; `tsc=0`; build clean.
- [ ] Positive + every negative flow implemented and cited by name in the AC self-audit table.
- [ ] `docs/backlog.md` updated; `docs/sessions/` log added (audit matrix, files changed, retained exceptions, validation, before/after).
- [ ] Session log contains NO `git add` / `git commit`; executor did NOT run git.

---

## Out of scope

- Do NOT redesign the whole UI; do NOT rewrite all translations globally.
- Do NOT change business logic, auth logic, or analytics logic.
- Do NOT change database / RLS / migrations unless unexpectedly required AND approved (STOP & ASK).
- Do NOT add new product features.
- Do NOT remove existing buttons, links, filters, actions, or controls.
- Do NOT make tables unusably wide to avoid wrapping.
- Do NOT solve the issue by shortening text artificially.

---

## Final report required from Sonnet (in the session log)

1. Task number and title.
2. Root cause of the owner contact card truncation.
3. Audit commands used.
4. Files changed.
5. Unsafe truncation findings fixed.
6. Retained truncation cases and why they are acceptable (with accessible full-text mechanism).
7. Localization verification summary for `sq`/`en`/`uk`/`it`.
8. Responsive verification summary for 320/375/390/768/1280/1440/2560.
9. Validation results (lint/build/tests/governance + before/after grep counts).
10. Confirmation that no controls were removed.
11. Confirmation that no shorter hardcoded text was introduced.
12. (Owner git commands are emitted by the ORCHESTRATOR during review — do NOT include `git add`/`commit` in your report; provide the Files Changed table instead.)

---

## Acceptance is FAILED if

- the report does not include the audit matrix;
- any user-facing localized phrase can still be silently cut with ellipsis;
- any normal UI label/heading/description/button/card/dialog/menu/form text is still truncated instead of wrapped;
- Sonnet fixes only the known screenshot issue;
- Sonnet does not verify site and admin separately;
- Sonnet does not verify `sq`/`en`/`uk`/`it`;
- Sonnet does not verify 320/375/390 mobile widths at minimum;
- Sonnet leaves retained truncation cases without justification AND accessible full-text behavior.

---

## Files likely in scope (audit determines the final set)

Known: `src/modules/listings/components/ListingContact.tsx`. Audit-driven: `src/components/ui/*`,
`src/components/shared/*`, `src/components/layout/*`, `src/components/admin/*`, `src/app/admin/*`,
`src/modules/listings/components/*`, `src/modules/cabinet/components/*`,
`src/modules/locations/components/*`, and any other file the grep surfaces — plus `messages/*.json`
only if a string directly involved in truncation is missing/inconsistent. If the audit points to a file
type or area not anticipated here, proceed (the audit is the scope) but log it; STOP & ASK only if a fix
would require changing business/auth/analytics/DB logic.
