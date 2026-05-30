# Sprint 21 — Task 302 kickoff (Fix Footer Admin source-of-truth mismatch — seed site_footer rows with current public footer content)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off). Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **data-backfill + i18n consistency** bugfix. Pre-read `data-access-rules.md`, `rls-rules.md`, `integrations.md`, `component-rules.md`, `qa-rules.md`, `docs/sessions/2026-05-28-task-247-ee1-footer-admin-manager.md` (Task 247 introduced the site_footer table — this is its follow-up). No scope change; STOP & ASK if ambiguous.

---

```
Type:        bugfix / regression follow-up (data backfill)
Priority:    HIGH — admin shows empty fields while public footer displays content; admin cannot manage live footer
Area:        admin/footer — public footer — site_footer table — messages/{sq,en,uk,it}.json (read-only as seed source)
```

## Why this task exists (2026-05-30 owner observation)

Task 247 introduced the canonical `site_footer` Postgres table (12 columns: locale, brand_title, tagline, nav_section_title, nav_links jsonb, info_section_title, info_links jsonb, social_section_title, social_links jsonb, copyright_template, updated_at, updated_by) + admin manager + per-field fallback chain in the public Footer component. Owner ran the migration script and the backlog records "4 seed rows applied".

Current state (2026-05-30, owner browser verification):
- Public footer renders normal content in `uk` (tagline, nav links, info links, social links, copyright) — but ALL of it is coming from the i18n fallback path (`t('tagline')`, hardcoded `<Link>` fallbacks in `Footer.tsx` lines 87–93 / 107–114 / 136–141).
- Admin → Footer shows **empty fields** for every locale tab.

Root cause (orchestrator inspection of `Footer.tsx`):
- `Footer.tsx` is per-field-fallback: `const tagline = footerData?.tagline || t('tagline')`. If the DB row exists but `tagline` is empty string, fallback to i18n. Same for nav_section_title, info_section_title, social_section_title, copyright_template.
- `Footer.tsx` is also per-list-fallback: `const hasNavLinks = navLinks.length > 0`. If DB `nav_links` is empty array, fallback to hardcoded `<Link>` rendering (home/listings/add_listing for nav, about/contacts/privacy/terms for info, Facebook/Instagram for social).
- The 4 seed rows from Task 247 apparently exist as PLACEHOLDER rows (empty strings + empty arrays), causing the fallback chain to always kick in. The admin opens those placeholder rows, finds them empty, and presents empty fields to the editor.
- Net effect: public users see content (from i18n + hardcoded fallback), admin sees empty fields (from empty DB rows), so admin cannot edit what users see → source-of-truth mismatch.

Fix: write a backfill SQL migration that UPDATEs the 4 `site_footer` rows with the current public-footer content per locale. After this:
- Admin → Footer opens with all fields prefilled with the same content currently visible on the public site.
- Admin can edit + save → public footer reflects the change (existing flow: `revalidatePath('/', 'layout')` already in `upsertFooterContent`).
- i18n + hardcoded fallback remains in `Footer.tsx` ONLY as defensive safety (e.g. catastrophic DB outage); it is no longer the live source of truth.

## Goal

Backfill `site_footer` so all 4 locale rows contain the public footer content currently visible. After this task:

- For each locale (sq/en/uk/it), `site_footer` row has:
  - `brand_title` = current site_name setting value (read from `settings` or fall back to `'Lero.al'`).
  - `tagline` = current value of `messages/{locale}.json` → `nav.tagline`.
  - `nav_section_title` = `nav.navigation` from that locale.
  - `nav_links` = JSON array matching the current hardcoded fallback: `[{id, label: 'home', url: '/', enabled: true, order: 0}, {label: 'listings', url: '/listings', ...}, {label: 'add_listing', url: '/listings/create', ...}]` — with the `label` field set to the LOCALIZED string for that locale (e.g. for `uk`: "Головна", "Оголошення", "Додати оголошення"). See "Required content" below.
  - `info_section_title` = `nav.information`.
  - `info_links` = 4 entries (about, contact, privacy-policy, terms-of-service) with localized labels and locale-agnostic paths (the public Footer prefixes with `/${locale}`).
  - `social_section_title` = `nav.follow_us`.
  - `social_links` = 2 entries (Facebook, Instagram) with current hardcoded URLs.
  - `copyright_template` = `© {year} Lero.al — Të gjitha të drejtat e rezervuara` (sq) and locale equivalents using the existing `nav.all_rights` key — `{year}` token preserved (Footer replaces it at render).
  - `updated_at` = NOW(); `updated_by` = NULL (system seed).

After the backfill runs:
- Admin opens `/sq/admin/footer`, switches between locale tabs — each tab shows full content.
- Editing any field + saving persists; reload shows the saved value.
- Public footer shows the DB content (not the i18n fallback) when DB content is non-empty.
- Footer fallback paths in `Footer.tsx` REMAIN as defensive safety, untouched.

## Current behavior to preserve (Notes 19 + 20 + 22 + 23)

- `site_footer` schema, RLS, indexes — UNCHANGED. This is a data backfill, not a schema migration.
- Admin Footer manager UI (`AdminFooterManager.tsx`) — UNCHANGED. Empty-field rendering becomes irrelevant once rows are populated.
- Public Footer per-field + per-list fallback logic in `Footer.tsx` — **DELIBERATELY UNCHANGED** (defensive safety net per the existing architecture). Do NOT remove the `|| t('...')` fallbacks or the hardcoded `<Link>` fallbacks.
- `getFooterContent`, `getAllFooterContent`, `upsertFooterContent` server actions — UNCHANGED. Save flow already calls `revalidatePath('/', 'layout')`.
- Admin sidebar entry, `/admin/footer` route, admin permission model — UNCHANGED.
- All other admin pages, public pages, locale files — UNCHANGED. The only writeable artifact is a NEW SQL backfill script that the **owner** runs in Supabase SQL editor (executor never runs SQL).
- Fallback chain priority documented at Task 247 (DB > i18n > hardcoded) — UNCHANGED in code; the only change is that DB rows now have real content so the chain stops at DB.

## Positive flow (happy path)

After owner runs the backfill SQL:
1. Admin opens `/sq/admin/footer`.
2. Switches to "Albanian" tab → all fields prefilled: brand_title="Lero.al", tagline="Tregu kryesor i pasurive të paluajtshme në Shqipëri.", nav_section_title="Navigim", 3 nav links visible (Kryefaqja → "/", Njoftime → "/listings", Shto njoftim → "/listings/create"), info_section_title="Informacion", 4 info links, social_section_title="Na ndiqni", 2 social links, copyright "© {year} Lero.al — Të gjitha të drejtat e rezervuara".
3. Switches to "English" tab → all fields prefilled with English equivalents.
4. Switches to "Ukrainian" tab → all fields prefilled with Ukrainian equivalents.
5. Switches to "Italian" tab → all fields prefilled with Italian equivalents.
6. Edits the Albanian tagline to "Tregu nr.1 i pasurive të paluajtshme në Shqipëri.".
7. Clicks Save → success toast in current admin locale.
8. Reloads admin page → edit persists.
9. Opens `/sq` (public home) in a new tab → footer shows new tagline.
10. Opens `/en`, `/uk`, `/it` → those footers are UNCHANGED (single-locale save did not touch other locales).
11. All existing footer links are clickable and resolve to the correct route in the active locale.

## Negative flow (every off-happy-path branch)

- **Backfill script run twice** — must be idempotent. Use `INSERT … ON CONFLICT (locale) DO UPDATE SET …` semantics, BUT only update rows where the current value is empty (defensive: don't overwrite owner-edited content). The script must document its idempotency strategy in a SQL comment.
- **Admin has already edited a locale before backfill runs** — the backfill must NOT overwrite owner-edited content. Strategy: `UPDATE … SET col = COALESCE(NULLIF(col, ''), seed_value)` per text field; for jsonb arrays, only seed if the existing column is `NULL` or `'[]'::jsonb`. Paste the exact SQL conditional in the session log.
- **Some locale rows missing entirely** — `INSERT … ON CONFLICT (locale) DO NOTHING` for the row, then a follow-up `UPDATE … WHERE` conditional fill. Or use `INSERT … ON CONFLICT (locale) DO UPDATE SET col = CASE WHEN … END` in a single statement.
- **Save fails (transient DB error)** — existing `upsertFooterContent` already returns `{error:'transient'}` and admin already shows a toast. Untouched.
- **URL validation fails** for one of the seed links (e.g. javascript:): existing `validateLinks` rejects. Use only safe `/` paths and `https://` URLs in the seed.
- **revalidatePath does not refresh** — already correct (`'/', 'layout'`) per Task 247.
- **Empty admin field after backfill** — should not happen; if it does, the backfill is broken. Session log must include a SELECT-after-backfill output proving all 4 rows have non-empty text columns + non-empty jsonb arrays.
- **i18n fallback silently used after backfill** — the `Footer.tsx` fallback chain still works defensively. If the DB row's `tagline` is somehow empty after backfill, the public footer falls back to `t('tagline')`. This is intentional safety net; the bug is broken backfill, not broken fallback.

## Required investigation (PASTE in session log BEFORE writing the SQL)

```
# Confirm site_footer exists and has 4 rows (owner must run; Sonnet pastes expected output)
# Owner-runnable in Supabase SQL editor:
SELECT locale, char_length(brand_title) AS brand_len,
       char_length(tagline) AS tagline_len,
       jsonb_array_length(nav_links) AS nav_count,
       jsonb_array_length(info_links) AS info_count,
       jsonb_array_length(social_links) AS social_count,
       updated_at
FROM site_footer ORDER BY locale;
# Expected current state: 4 rows, all *_len = 0 and *_count = 0 (the bug).

# Confirm i18n seed source
grep -n '"tagline":\|"navigation":\|"information":\|"follow_us":\|"all_rights":\|"home":\|"listings":\|"add_listing":\|"about":\|"contacts":\|"privacy":\|"terms":' messages/sq.json | head -20
# Repeat for en/uk/it.

# Confirm canonical brand
grep -n 'site_name\|Lero\.al' src/modules/admin/lib/settings.ts src/components/layout/Footer.tsx | head -10

# Confirm Footer fallback paths (the source of truth for nav/info/social hrefs to encode in seed):
sed -n '85,145p' src/components/layout/Footer.tsx
```

After investigation, paste the captured i18n values + canonical brand value + fallback paths into the session log so the seed SQL is reproducible.

## Required content (the seed values to UPSERT)

Use these literal strings. Do NOT translate via auto-translator — these are pulled from the current public footer's i18n source.

### Per-locale text values
| Field | sq | en | uk | it |
|---|---|---|---|---|
| brand_title | Lero.al | Lero.al | Lero.al | Lero.al |
| tagline | Tregu kryesor i pasurive të paluajtshme në Shqipëri. | The leading real estate marketplace in Albania. | Провідний маркетплейс нерухомості в Албанії. | Il principale marketplace immobiliare in Albania. |
| nav_section_title | Navigim | Navigation | Навігація | Navigazione |
| info_section_title | Informacion | Information | Інформація | Informazioni |
| social_section_title | Na ndiqni | Follow us | Ми в соцмережах | Seguici |
| copyright_template | © {year} Lero.al — Të gjitha të drejtat e rezervuara | © {year} Lero.al — All rights reserved | © {year} Lero.al — Всі права захищені | © {year} Lero.al — Tutti i diritti riservati |

### Per-locale link arrays

`nav_links` — 3 entries per locale, URLs are locale-relative paths (Footer prefixes `/${locale}`):

| order | url | sq label | en label | uk label | it label |
|---|---|---|---|---|---|
| 0 | / | Kryefaqja | Home | Головна | Home |
| 1 | /listings | Njoftime | Listings | Оголошення | Annunci |
| 2 | /listings/create | Shto njoftim | Add listing | Додати оголошення | Aggiungi annuncio |

(If the current i18n keys for `home` / `listings` / `add_listing` already exist under `nav.*`, USE the existing values verbatim from `messages/<locale>.json` — paste the grep output in the session log. The owner can correct any mismatch in admin afterwards.)

`info_links` — 4 entries per locale:

| order | url | sq label | en label | uk label | it label |
|---|---|---|---|---|---|
| 0 | /about | Rreth nesh | About | Про нас | Chi siamo |
| 1 | /contact | Kontakte | Contacts | Контакти | Contatti |
| 2 | /privacy-policy | Politika e privatësisë | Privacy policy | Політика конфіденційності | Informativa sulla privacy |
| 3 | /terms-of-service | Kushtet e shërbimit | Terms of service | Умови використання | Termini di servizio |

Same rule: prefer existing `messages/<locale>.json` → `nav.about` / `nav.contacts` / `nav.privacy` / `nav.terms` values verbatim if present.

`social_links` — 2 entries per locale (URL is global; label is the platform name, locale-independent):

| order | url | label |
|---|---|---|
| 0 | https://facebook.com | Facebook |
| 1 | https://instagram.com | Instagram |

Each link object must follow the existing `FooterLink` type schema (typically `{ id, label, url, enabled, order }` — confirm exact schema by reading `src/types/database.ts` for `FooterLink`). Generate stable `id`s using `gen_random_uuid()` or a deterministic seed string (e.g. `"nav-0"` / `"info-1"` / `"social-0"`). Document the choice in the session log.

## Scope (files Sonnet may touch)

- `scripts/task-302-site-footer-backfill.sql` (NEW) — idempotent backfill SQL the owner runs in Supabase SQL editor
- `docs/sessions/2026-05-30-task-302-footer-source-of-truth.md` (NEW)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- `src/components/layout/Footer.tsx` (fallback chain deliberately preserved)
- `src/components/admin/AdminFooterManager.tsx` (UI works once rows are populated)
- `src/modules/admin/actions/footer.ts` (server actions correct as-is)
- `src/types/database.ts` (schema unchanged)
- `src/app/[locale]/layout.tsx` (Footer import unchanged)
- Any locale JSON file (the i18n is the SEED SOURCE — read only, no edits)
- Any other admin component
- RLS policies, indexes, additional columns

Maximum SOURCE-FILE delta: **0** (zero source files touched). Only deliverable is the SQL script + docs. If you find yourself editing src/, STOP & ASK.

## Acceptance criteria (literal)

- `scripts/task-302-site-footer-backfill.sql` exists, is idempotent (runs safely twice without overwriting owner edits), and conditionally fills empty text columns + empty jsonb arrays for all 4 locales.
- The SQL header comment explains: purpose, idempotency strategy, owner-edit preservation rule, how to verify before/after.
- The SQL emits a verification `SELECT` block at the end that the owner can paste-and-run after the UPDATE to confirm all 4 rows have non-empty content + correct jsonb array lengths.
- Per-locale text values match the table above (or the verbatim `messages/<locale>.json` values if the grep showed the canonical strings differ).
- nav_links / info_links / social_links arrays have the correct length per locale (3 / 4 / 2 respectively).
- After owner runs the script, `/sq/admin/footer` opens with all fields prefilled (verified by owner; report in session log as "owner-runtime PENDING — script ready").
- No source files changed (`git diff -- src` empty).
- No locale file changes (`git diff -- messages/` empty).
- `npx tsc --noEmit` → 0 errors (sanity — no source changes means baseline preserved).
- `npm run build` → passes.
- `npm run lint` → 0/0 (Task 295 baseline preserved).
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · SQL=idempotent · seed=4 locales × text+links · src diff=empty · owner-SQL-execution PENDING · PASS`.

## Out of scope

- Footer visual redesign — DO NOT touch CSS, grid, gap, breakpoint logic in `Footer.tsx`.
- Admin Footer Manager visual redesign — DO NOT touch `AdminFooterManager.tsx`.
- Removing the per-field / per-list fallback chain from `Footer.tsx` — DO NOT (defensive safety).
- Adding new footer sections (newsletter signup, language switcher, etc.).
- Renaming admin sidebar / menu items.
- Schema changes (new columns, RLS edits, new tables).
- Migrating other admin-managed content (settings, email templates, locations, etc.) — separate work.
- Public site responsive fixes (Public Site Responsive Epic).
- Validating other locales beyond sq/en/uk/it.
- Touching Task 296 / 295 / 294 / 300 / 301 files.
- Executor running SQL — single-writer rule, owner runs SQL in Supabase editor.

## Final report required

1. Files Changed table (1 SQL script + session log + backlog).
2. Pasted i18n source values from `messages/{sq,en,uk,it}.json` (grep output).
3. Verbatim text of the SQL script (header + body + verification block).
4. Idempotency strategy paragraph (how the script avoids overwriting owner edits).
5. FooterLink schema captured from `src/types/database.ts` and link `id` generation strategy.
6. Locale × field matrix confirming all 8 fields are present per locale.
7. Owner-runnable verification query.
8. AC-by-AC self-audit table.
9. Confirmation no source / locale file was edited.

Do NOT emit git commands. Do NOT run git. Do NOT run SQL. STOP & ASK if any seed value cannot be sourced from existing i18n keys.
