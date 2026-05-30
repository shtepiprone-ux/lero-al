# Sprint 25 — Task 324 kickoff (HIGH: Admin Footer internal-link target validation — guard against /test-style 404s)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **two-layer validation feature** (admin client UX guard + server-side guard) on top of the canonical site_footer system. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20), `docs/component-rules.md`, `docs/data-access-rules.md`, `docs/qa-rules.md`, `docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md` (the canonical footer manager), `tasks/Sprints/Sprint_21_kickoff_prompt_Task_302.md` (the source-of-truth backfill that THIS task is a follow-up to), `docs/sessions/2026-05-30-task-302-footer-source-of-truth.md` (only after Task 302 ships). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 324 is the next free global number after Epic II reservations (303-313 = Epic HH, 316-323 = Epic II). Owner-assigned in `issues2.md` 2026-05-30. **Depends on Task 302 having shipped** (the site_footer rows must exist + UI must read/write them before this validation layer makes sense).

---

```
Type:        feature / UX guard / admin content integrity
Priority:    HIGH — admin can save footer links to non-existing routes, causing public 404
Area:        admin/footer — public footer navigation — internal route/page validation (client + server)
```

## Why this task exists (2026-05-30 owner runtime QA)

Task 302 fixed the Footer source-of-truth mismatch. Owner ran the SQL backfill, admin opens with prefilled DB content, admin saves edits, public footer reflects changes. WORKS — but a new product gap surfaced:

- Admin enters footer link: `label="Тестова"` + `url="/test"` → Save succeeds → public footer shows the link → clicking it → 404 (no `/test` route exists).
- Admin / moderator has no immediate way to know whether an internal page exists.
- Admin / moderator is not guided to create / select the target page before publishing.
- Public users get sent to 404 from a site-wide footer link.

Task 324 closes this gap with a conservative two-layer guard:
1. **Client-side admin UX warning + save-block** for unknown internal links.
2. **Server-side rejection** if client is bypassed.

Plus surfaces a helpful CTA when an existing admin page manager (Legal pages, etc.) is reachable.

## Goal

After this task:
- External links (`https://...`) → save normally (existing `isValidLinkUrl` allows them).
- Internal links matching the canonical known-good route allowlist (`/`, `/listings`, `/listings/create`, `/about`, `/contact`, `/privacy-policy`, `/terms-of-service` — plus any admin-managed dynamic page slugs found via investigation) → save normally.
- Internal links NOT in the allowlist (e.g. `/test`) → save BLOCKED both client + server-side with a localized error toast + inline message; admin sees a CTA suggesting "Choose existing route" / "Open pages manager" (when applicable).
- Existing Task 302 seeded rows continue to work unchanged.
- Footer.tsx fallback chain unchanged (defensive safety).
- Public footer renders unchanged for valid links.

The allowlist is composed by combining:
1. **Static route list** — hardcoded canonical routes: `/`, `/listings`, `/listings/create`, `/about`, `/contact`, `/privacy-policy`, `/terms-of-service`.
2. **Dynamic admin-managed page slugs** — read from `legal_pages` table (or whichever admin-content table exists; investigation confirms). Each `/<slug>` becomes valid if `published=true`.
3. **External `https?://` links** — always pass syntactic validation; not part of internal allowlist.

If no admin-managed page table exists, the static list IS the allowlist; the CTA falls back to a localized "Create page first" message without a route target.

## Current behavior to preserve (Notes 19 + 20 + 23 — edit-flow)

Inventory in session log BEFORE editing:

**Admin Footer surface (preserve all):**
- 4 locale tabs (sq / en / uk / it)
- brand_title field
- tagline field
- nav_section_title field
- nav_links list (add / remove / enable-disable / label / url / save)
- info_section_title field
- info_links list (same)
- social_section_title field
- social_links list (same)
- copyright_template field with {year} token
- Save button per locale tab
- Cancel/Reset behaviour (if any)
- Loading state, success toast, error toast
- All existing locale keys under `admin.footer`

**Public Footer surface (preserve all):**
- DB content used when available; per-field + per-list fallback chain intact
- Locale prefixing for internal links (`/${locale}` prefix added at render)
- External link `target="_blank" rel="noopener noreferrer"` behaviour
- Mobile + responsive layout

The new validation is PURELY ADDITIVE on the save path:
- One new client-side inline validation message per invalid internal link row
- One new client-side toast on save attempt with at least one invalid link
- One new server-side error code (`invalid_internal_link`)
- One optional CTA component if admin-managed pages exist

No existing field is removed, renamed, or restructured. No locale key is removed.

## Positive flow (happy path)

As an admin at `uk` locale, viewport 1280px:
1. Navigate to `/uk/admin/footer`.
2. All 4 tabs open with prefilled DB content (Task 302 state preserved).
3. Add a new nav_link: `label="Тест"` `url="/test"` → input field shows inline localized warning ("Внутрішня сторінка не існує. Створіть сторінку спочатку або виберіть існуючий маршрут.") under the URL field.
4. Click Save → save BLOCKED, toast shows localized `invalid_internal_link_error`.
5. Change URL to `/about` → inline warning disappears (route is in allowlist).
6. Click Save → success.
7. Open `/uk` (public) → footer shows the new link → clicking it → opens `/uk/about` (existing route).
8. (Optional) Add nav_link with label "Custom legal" + url `/<slug-from-legal-pages>` → inline NO warning (admin-managed page exists) → save succeeds → public footer link works.
9. Switch to `sq` / `en` / `it` tabs → validation works in all 4 locales with localized messages.

## Negative flow (every off-happy-path branch)

- **Invalid internal link entered** — inline warning + Save blocked (positive flow #4).
- **External link** — `https://facebook.com` etc. → syntactic validation (existing `isValidLinkUrl`) accepts; no internal-allowlist check; save proceeds.
- **Client bypassed (direct API call to upsertFooterContent with invalid /test)** — server-side validation rejects with `{error: 'invalid_internal_link'}`; no DB write; admin UI surfaces same toast (via existing error pathway).
- **Empty URL** — existing validation (likely accepts; verify). Do not add an "empty URL" check in this task (out of scope; existing behaviour preserved).
- **URL with query string `/listings?premium=true`** — orchestrator-recommended: strip query string when checking allowlist; the base path must be in the allowlist. STOP & ASK if Sonnet finds an edge case.
- **URL with locale prefix `/sq/about`** — orchestrator-recommended: REJECT as invalid (footer URLs must be locale-agnostic; Footer.tsx adds the prefix at render). Document this rule + show localized message "Внутрішні посилання мають бути без префіксу локалі".
- **URL with hash `/about#contact`** — allowed if base path is in allowlist.
- **Disable + save** — toggling a link off should bypass URL validation (an off link is not displayed publicly). Confirm via inventory; orchestrator default is to still validate but soft (warning only, not block).
- **Page manager CTA missing** — if no admin-managed page system exists or is wired, the CTA text is shown without a route target (or is omitted); the warning + save-block still works.

## Required investigation (PASTE in session log)

```
# 1. Confirm Task 302 ship state (SQL applied + rows populated)
# (Manual: owner confirms or Sonnet checks /admin/footer shows non-empty fields)

# 2. Locate existing footer validation helpers
grep -n 'isValidLinkUrl\|validateLinks\|FooterLink' src/modules/admin/actions/footer.ts src/types/database.ts

# 3. Inspect admin Footer manager structure
sed -n '<lines around link list>' src/components/admin/AdminFooterManager.tsx
grep -n 'nav_links\|info_links\|social_links\|url\|label' src/components/admin/AdminFooterManager.tsx | head -30

# 4. Inventory canonical static routes
find src/app/\[locale\] -name 'page.tsx' -not -path '*node_modules*' | head -30
ls src/app/[locale]/

# 5. Inventory admin-managed dynamic page systems
ls src/app/admin/legal/ src/app/admin/pages-admin/ 2>&1
grep -rn 'legal_pages\|static_pages\|cms_pages\|published' src/types/database.ts src/modules/admin/ scripts/schema-drift-check.sql | head -20
# If legal_pages table exists: confirm columns (slug, title, body, published, ...)
grep -n 'legal_pages\|public_pages\|cms_pages' scripts/schema-drift-check.sql | head -10

# 6. Inventory existing admin.footer locale keys
python3 -c "
import json
for loc in ['sq','en','uk','it']:
    with open(f'messages/{loc}.json') as f: data = json.load(f)
    af = data.get('admin', {}).get('footer', {})
    print(f'{loc} admin.footer keys ({len(af)}): {sorted(af.keys())[:30]}')
"

# 7. Look for existing public route resolver if any
grep -rn 'isInternalRoute\|isValidRoute\|routeExists\|resolveRoute' src/ | head -10
```

After investigation, paste:
- Static route list (verified to exist in `src/app/[locale]/`).
- Admin-managed page system: exists or not? Table name + slug column.
- Inventory of existing `admin.footer` locale keys (for parity check when adding new ones).
- Current `isValidLinkUrl` / `validateLinks` behaviour.
- Whether existing `Combobox` could be used as an "internal page picker" UX (orchestrator-recommended for Phase 2, not this task).

## STOP & ASK after investigation

Before writing code:
1. **Admin-managed pages system** — if it exists, propose how to read the published slugs into the allowlist (synchronously at form load OR async-validated on save?). STOP & ASK if multiple options.
2. **Page-manager CTA** — confirm the CTA route. If no manager exists, confirm CTA is text-only.
3. **Disabled-link handling** — confirm soft-warning vs. full-block for `enabled: false` links.
4. **Query-string / hash / trailing-slash normalization** — propose canonical normalization rule; STOP & ASK.
5. **External link allowlist** — should we ALSO validate external `https://` URLs against a domain allowlist (e.g. only `facebook.com` / `instagram.com`)? Default: NO (existing `isValidLinkUrl` is sufficient; out of scope).
6. **Picker UI vs. text input** — orchestrator recommends KEEP text input + add warning (smallest diff). Picker is Phase 2. Confirm.

## Scope (files Sonnet may touch)

- `src/components/admin/AdminFooterManager.tsx` — add client-side inline warning per link row + save-block toast (if any invalid internal link)
- `src/modules/admin/actions/footer.ts` — extend `upsertFooterContent` server validation with `validateInternalLinkPath()` helper + return `'invalid_internal_link'` error code; also extend `validateLinks` OR add separate `validateInternalLinks(links, allowedPaths)` helper
- `src/lib/footer-route-allowlist.ts` (NEW) — canonical helper exporting `getKnownInternalPaths()` returning the static list + optional dynamic published-page slugs
- `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json` — add under `admin.footer`: `link_url_invalid_internal`, `link_url_invalid_external`, `link_url_internal_help`, `open_pages_manager_cta` (if applicable). Total ≈ 3-4 new keys × 4 locales = 12-16 string additions
- `docs/sessions/2026-05-30-task-324-footer-internal-link-validation.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)
- OPTIONAL: `docs/component-rules.md` or `docs/ui-rules.md` (1-paragraph addition documenting the canonical "internal route allowlist" pattern for future reuse)

**MUST NOT touch:**
- `scripts/task-302-site-footer-backfill.sql` (Task 302's SQL — frozen)
- `src/components/layout/Footer.tsx` (public footer fallback chain — frozen; Task 302 + Task 247 territory)
- Any other admin page (legal pages, settings, etc.)
- Any Sprint 21 / 22 / 23 / 24 / 26 file
- Email Templates / Task 315 work
- Public listing pages or routes
- Any DB schema change (no new column; no new table)
- RLS policies
- `next-intl` config
- Canonical primitives (`Combobox`, `Button`, `Dialog`, `Sheet`, `Input`)

Maximum SOURCE-FILE delta: **3** (`AdminFooterManager.tsx` + `actions/footer.ts` + 1 new helper). If you touch more, STOP & ASK.

## Locale coverage (sq/en/uk/it parity)

Add 3-4 new keys to all 4 locale files under `admin.footer` (adjust set to match the actual validation copy needed):

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `link_url_invalid_internal` | Faqja e brendshme nuk ekziston. Krijoni faqen së pari ose zgjidhni një rrugë ekzistuese. | This internal page does not exist. Create the page first or choose an existing route. | Внутрішня сторінка не існує. Створіть сторінку спочатку або виберіть існуючий маршрут. | Questa pagina interna non esiste. Crea prima la pagina o scegli un percorso esistente. |
| `link_url_internal_help` | Përdorni rrugë të brendshme pa prefiks lokaliteti (p.sh. /about, jo /sq/about). | Use internal paths without locale prefix (e.g. /about, not /sq/about). | Використовуйте внутрішні шляхи без префіксу локалі (напр. /about, не /sq/about). | Usa percorsi interni senza prefisso locale (es. /about, non /sq/about). |
| `link_url_invalid_external` | URL e jashtme është e pavlefshme. | External URL is invalid. | Зовнішня URL невалідна. | URL esterno non valido. |
| `open_pages_manager_cta` (optional) | Hap menaxherin e faqeve | Open pages manager | Відкрити менеджер сторінок | Apri il gestore delle pagine |

If Sonnet's investigation finds a different copy phrasing or naming convention already in `admin.footer`, prefer the existing convention + STOP & ASK before deviating.

## Responsive coverage (all 7 breakpoints)

Verify Admin Footer manager at 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 in `uk` (longest validation copy). Specifically:
- Inline warning text wraps and does not clip.
- Save-blocked toast renders within viewport.
- CTA button (if shown) reachable at 320 with 44px touch target.
- Repeat at `sq` / `en` / `it` spot-check.

## Acceptance criteria (literal)

- `src/lib/footer-route-allowlist.ts` exports a canonical `getKnownInternalPaths()` helper returning static routes + optionally admin-managed slugs.
- `src/components/admin/AdminFooterManager.tsx` shows inline localized warning under invalid internal-link URL inputs; blocks Save when at least one invalid internal link exists across any tab.
- `upsertFooterContent` server action validates EVERY internal link against the allowlist; returns `{error: 'invalid_internal_link'}` if any link fails; no DB write on rejection.
- Existing `isValidLinkUrl` (javascript:/data: rejection) preserved unchanged.
- Static routes `/` `/listings` `/listings/create` `/about` `/contact` `/privacy-policy` `/terms-of-service` save successfully.
- External links `https://facebook.com` `https://instagram.com` (and arbitrary `https://`) save successfully.
- `/test`-style invalid internal URLs save BLOCKED both client + server-side; no DB row updated; no public 404.
- All 3-4 new locale keys present in all 4 locale files; same key set; key parity passes.
- If admin-managed pages system exists, published slugs are part of the allowlist; CTA points to the manager route.
- If no admin-managed pages system exists, session log documents this explicitly + CTA is text-only or omitted; "create custom pages" called out as a future CMS task.
- Task 302 seeded rows still save normally (no regression).
- Footer.tsx unchanged (`git diff src/components/layout/Footer.tsx` empty).
- Task 302 SQL script unchanged.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run lint` → 0/0.
- `npm run check:i18n` (if exists) → passes.
- `npm run governance:tailwind` → C0/H0/M0.
- All 7 breakpoints verified in `uk`; spot-check in `sq` / `en` / `it`.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · /admin/footer save-block PASS sq/en/uk/it · 7 breakpoints PASS · existing seeded links PASS · /test BLOCKED client+server · Footer.tsx unchanged · scope=clean · PASS`.

## Out of scope

- Building a new CMS / page-builder feature.
- Auto-creating pages from the footer editor.
- Domain allowlist for external URLs.
- Internal-page picker / Combobox (Phase 2 follow-up).
- Footer visual redesign.
- Email Templates ICU fix (Task 315 separate).
- Admin UX System Epic HH work.
- DB schema changes.
- RLS policy edits.
- Locale prefix handling in URLs (the validation REJECTS locale-prefixed URLs; it does not strip them).

## Final report required

1. Files Changed table.
2. Root cause / UX gap summary.
3. Inventory: static routes confirmed in `src/app/[locale]/`.
4. Inventory: admin-managed pages system (table + slug column + published flag) OR explicit "none found, CTA text-only".
5. Allowlist composition narrative (static + dynamic source).
6. Before/after `/test` behaviour at admin + public surfaces.
7. Confirmation existing seeded links + external links still work.
8. Locale × breakpoint validation matrix.
9. Validation command results (tsc, build, lint, check:i18n, governance:tailwind).
10. AC-by-AC self-audit table.
11. Confirmation Footer.tsx + Task 302 SQL untouched.
12. STOP & ASK transcript + resolutions.

Do NOT emit git commands. Do NOT run git. Do NOT touch Footer.tsx or Task 302 SQL. STOP & ASK on the 6 design points in investigation before editing.
