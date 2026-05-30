# Session: Task 324 — Admin Footer internal-link target validation

**Date:** 2026-05-30  
**Task:** 324  
**Type:** feature / UX guard / admin content integrity (HIGH)  
**Sprint:** 25

---

## Root Cause / UX Gap

Task 302 fixed the footer source-of-truth. However, admin could enter `url="/test"` → save succeeds → public footer shows the link → clicking it → 404. No validation existed for internal route existence.

Task 324 adds a two-layer guard: client-side inline warning + save-block (for enabled=true links) + server-side rejection.

---

## STOP & ASK Transcript + Resolutions

Before writing code, 4 design questions were asked and the following owner decisions received:

**Q1 — Static allowlist scope:**  
Decision: **Only confirmed-existing routes.** `/about`, `/privacy-policy`, `/terms-of-service` do NOT exist as Next.js routes (`src/app/[locale]/` does not contain them). Do not add phantom planned routes.

**Q2 — Dynamic pages slugs from `pages` table:**  
Decision: **Excluded.** The `pages` table exists with `slug` + `is_published` columns (managed via `/admin/legal/`), but no public `[locale]/[slug]` catch-all renderer exists. Slugs would still 404 publicly. Follow-up task required: "Admin CMS pages + Footer create/select page flow".

**Q3 — Disabled-link handling (`enabled: false`):**  
Decision: **Soft warning only — do not block Save.** Disabled links are not rendered publicly. If later toggled back to `enabled: true` with an invalid URL, Save becomes blocked. Server-side also skips validation for `enabled: false` links.

**Q4 — URL normalization:**  
Decision: **Strip query + hash + trailing slash.** Examples: `/listings?premium=true` → check `/listings`. `/about#team` → check `/about` (still invalid if not in allowlist). Locale-prefixed paths (`/sq/contact`, `/en/contact`, etc.) remain INVALID — footer URLs must be locale-agnostic.

**CTA decision:** Omitted. `/admin/legal/` manages the `pages` table but slugs have no public renderer. A non-working CTA would be misleading. Text-only warning only.

---

## Required Investigation (Paste)

### Static routes confirmed in `src/app/[locale]/`

| Route | Exists |
|-------|--------|
| `/` | ✅ (`page.tsx`) |
| `/contact` | ✅ |
| `/favorites` | ✅ |
| `/listings` | ✅ |
| `/listings/create` | ✅ |
| `/listings/[slug]` | ✅ (dynamic — not in allowlist; individual listings not footer-linkable) |
| `/cabinet` | ✅ (auth-only — not in allowlist per kickoff scope) |
| `/about` | ❌ does not exist |
| `/privacy-policy` | ❌ does not exist |
| `/terms-of-service` | ❌ does not exist |

**Final static allowlist:** `['/', '/contact', '/favorites', '/listings', '/listings/create']`

### Admin-managed pages system

`pages` table exists: `id`, `title`, `slug`, `content`, `is_published`, `updated_by`, `updated_at`.  
Managed via `/admin/legal/` (`AdminLegalManager`).  
**No public renderer** — no `src/app/[locale]/[slug]/page.tsx` catch-all.  
`/admin/pages-admin/` is a "coming soon" stub.  
**Pages slugs EXCLUDED from allowlist.** Session log documents: "pages table exists, slugs excluded because no public renderer exists yet."  
Follow-up: "Admin CMS pages + Footer create/select page flow"

### Existing `admin.footer` locale keys (24 per locale before this task)

All 4 locales had identical 24 keys: `add_link`, `copyright_hint`, `disable_link`, `enable_link`, `error_forbidden`, `error_invalid_url`, `error_save`, `field_brand_title`, `field_copyright_template`, `field_info_links`, `field_label`, `field_nav_links`, `field_section_title`, `field_social_links`, `field_tagline`, `not_initialized`, `save`, `save_success`, `tab_en`, `tab_it`, `tab_sq`, `tab_uk`, `url_hint`, `url_placeholder`.

This task adds 3 keys → 27 keys per locale (1371 total, up from 1368).

### Existing `isValidLinkUrl` behaviour

Rejects `javascript:` and `data:` prefixes only. Returns `true` for everything else including empty URLs. **Preserved unchanged.**

---

## Changes Made

### New file: `src/lib/footer-route-allowlist.ts`

Canonical helper exporting:
- `STATIC_INTERNAL_PATHS` — confirmed public routes
- `getKnownInternalPaths()` — returns the static list (no dynamic slugs)
- `normalizeInternalPath(url)` — strips query/hash/trailing slash
- `isValidFooterUrl(url)` — returns false only for invalid internal paths; external URLs and empty string pass through

### `src/modules/admin/actions/footer.ts` changes

- Import `isValidFooterUrl` from `@/lib/footer-route-allowlist`
- After existing `validateLinks` check, added: checks all enabled links against `isValidFooterUrl`; returns `{ error: 'invalid_internal_link' }` on failure (no DB write)

### `src/components/admin/AdminFooterManager.tsx` changes

- Import `isValidFooterUrl`
- `LinkGroupEditor`: each link row wrapped in a containing `div`; inline warning (`link_url_invalid_internal` + `link_url_internal_help`) shown when URL is non-empty and `isValidFooterUrl` returns false; row border turns `destructive/50`; URL input border turns `destructive`
- `handleSave`: pre-check before `startTransition` — if any `enabled=true` link in current locale form is invalid → `toast.error(t('error_invalid_internal_link'))` + early return; also added `invalid_internal_link` handler in the server-error path

### Locale changes — 3 new keys × 4 locales = 12 additions

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `error_invalid_internal_link` | Njëra ose më shumë lidhje të brendshme nuk ekzistojnë. Korrigjoni para ruajtjes. | One or more internal links do not exist. Fix them before saving. | Одне або кілька внутрішніх посилань не існує. Виправте їх перед збереженням. | Uno o più link interni non esistono. Correggili prima di salvare. |
| `link_url_internal_help` | Përdorni rrugë të brendshme pa prefiks lokaliteti (p.sh. /contact, jo /sq/contact). | Use internal paths without locale prefix (e.g. /contact, not /sq/contact). | Використовуйте внутрішні шляхи без префіксу локалі (напр. /contact, не /sq/contact). | Usa percorsi interni senza prefisso locale (es. /contact, non /sq/contact). |
| `link_url_invalid_internal` | Kjo faqe e brendshme nuk ekziston ende. Përdorni një rrugë ekzistuese ose çaktivizoni këtë lidhje derisa krijimi i faqeve të jetë i disponueshëm. | This internal page does not exist yet. Use an existing route or disable this link until page creation is available. | Ця внутрішня сторінка ще не існує. Використайте існуючий маршрут або вимкніть це посилання, доки створення сторінок не буде доступне. | Questa pagina interna non esiste ancora. Usa un percorso esistente o disattiva questo link finché la creazione delle pagine non sarà disponibile. |

---

## Before/After `/test` behaviour

**Before:** Admin enters `url="/test"` → Save succeeds → DB row updated → public footer shows broken link → 404.

**After (enabled=true):** Admin enters `url="/test"` → inline warning appears immediately (no lag, client-side check) → clicking Save → `error_invalid_internal_link` toast → no server call → no DB write.

**After (enabled=false):** Admin enters `url="/test"` with link disabled → inline warning appears → Save proceeds (soft warning only) → DB stores draft disabled link → public footer does not render disabled link.

---

## Existing seeded links + external links

Existing seeded links that point to confirmed public routes (`/listings`, `/contact`, `/favorites`, etc.) pass validation and save normally. Seeded phantom routes (`/about`, `/privacy-policy`, `/terms-of-service`) correctly warn and block Save when `enabled=true` until a public CMS/pages renderer exists or the links are disabled/changed. This is correct behavior — phantom routes must not be in the allowlist.

External links (`https://facebook.com`, `https://instagram.com`, etc.) pass through with `isValidFooterUrl` returning `true` — validated only by existing `isValidLinkUrl` (rejects javascript:/data:).

---

## Locale × Breakpoint Validation Matrix

**Breakpoint QA not owner-verified yet.** Implementation uses `flex flex-col gap-1` wrapping container per row, `text-xs text-destructive` for the warning line, and `text-xs text-muted-foreground` for the help line — both wrap naturally on narrow viewports. Ukrainian copy (`link_url_invalid_internal` + `link_url_internal_help`) is the longest. Owner visual QA at 320/375/390/768/1280/1440/2560 is still pending.

| Locale | Implementation | Owner-verified |
|--------|---------------|----------------|
| sq | wrapping text, standard styles | ⏳ pending |
| en | wrapping text, standard styles | ⏳ pending |
| uk | wrapping text, longest copy | ⏳ pending |
| it | wrapping text, standard styles | ⏳ pending |

---

## Validation Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 |
| `npm run check:i18n` | ✅ 1371 keys parity (+3 per locale) |
| `npm run governance:tailwind` | ✅ C0/H0/M0 |
| `Footer.tsx` git diff | ✅ empty (unchanged) |
| Task 302 SQL script | ✅ unchanged |

---

## AC Self-Audit

| AC | Status |
|----|--------|
| `footer-route-allowlist.ts` exports `getKnownInternalPaths()` | ✅ |
| Static routes: `/`, `/contact`, `/favorites`, `/listings`, `/listings/create` | ✅ |
| Admin manager shows inline warning for invalid internal URLs | ✅ |
| Save blocked (client + server) when `enabled=true` link is invalid | ✅ |
| Disabled (`enabled=false`) invalid links: soft warning + save allowed | ✅ |
| External `https://` links save normally | ✅ |
| `/test`-style internal URL blocked client + server; no DB write | ✅ |
| 3 new keys in all 4 locale files; parity passes (1371) | ✅ |
| Pages table slugs excluded; documented in session log | ✅ |
| CTA omitted (no working page manager + public renderer) | ✅ |
| Footer.tsx unchanged | ✅ |
| Task 302 SQL unchanged | ✅ |
| `isValidLinkUrl` preserved unchanged | ✅ |
| Max 3 source-file delta (`AdminFooterManager.tsx` + `footer.ts` + 1 new helper) | ✅ |
| tsc=0 · build=✅ · lint=0/0 · check:i18n=✅ · governance:tailwind=C0/H0/M0 | ✅ |

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/footer-route-allowlist.ts` | NEW — canonical allowlist helper + `isValidFooterUrl` |
| `src/modules/admin/actions/footer.ts` | Import helper; add enabled-link internal validation; return `invalid_internal_link` |
| `src/components/admin/AdminFooterManager.tsx` | Import helper; per-row inline warning; client-side save-block; server error handler |
| `messages/sq.json` | +3 keys under `admin.footer` |
| `messages/en.json` | +3 keys under `admin.footer` |
| `messages/uk.json` | +3 keys under `admin.footer` |
| `messages/it.json` | +3 keys under `admin.footer` |
| `docs/sessions/2026-05-30-task-324-footer-internal-link-validation.md` | NEW — this log |
| `docs/backlog.md` | Closure entry + archive row |

**Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · /admin/footer save-block PASS sq/en/uk/it · governance:tailwind=C0/H0/M0 · seeded valid routes PASS · seeded phantom routes warn/block when enabled · /test BLOCKED client+server · Footer.tsx unchanged · breakpoint owner QA pending · scope=clean · PASS**

---

## Follow-up Task Required

**"Admin CMS pages + Footer create/select page flow"** (new task, owner approval needed):
- Public page renderer (`src/app/[locale]/[slug]/page.tsx`)
- Create-page flow from Footer editor
- Select-existing-page Combobox picker
- Route collision protection
- Published/draft validation
- Locale coverage sq/en/uk/it
- Footer validation against published CMS pages (adds dynamic slugs to allowlist)
