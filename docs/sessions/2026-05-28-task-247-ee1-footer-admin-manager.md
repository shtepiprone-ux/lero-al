# Task 247 — EE.1 — Footer admin manager

**Date:** 2026-05-28  
**Sprint:** 15  
**Type:** feature (admin + public footer)  
**Status:** ✅ Complete (code ready; owner runs SQL to activate DB persistence)

---

## Persistence Decision (recorded)

**Strategy: Option A — single `site_footer` table, 4 rows (one per locale), JSONB arrays for link groups.**

Chosen by owner 2026-05-28. Reasoning: current footer is simple (2 nav sections + social links); normalized 3-table approach is overkill; JSONB gives full control with minimal query complexity.

---

## SQL for Owner (Supabase SQL Editor)

```sql
CREATE TABLE IF NOT EXISTS public.site_footer (
  locale               text PRIMARY KEY CHECK (locale IN ('sq','en','uk','it')),
  brand_title          text NOT NULL DEFAULT '',
  tagline              text NOT NULL DEFAULT '',
  nav_section_title    text NOT NULL DEFAULT '',
  nav_links            jsonb NOT NULL DEFAULT '[]'::jsonb,
  info_section_title   text NOT NULL DEFAULT '',
  info_links           jsonb NOT NULL DEFAULT '[]'::jsonb,
  social_section_title text NOT NULL DEFAULT '',
  social_links         jsonb NOT NULL DEFAULT '[]'::jsonb,
  copyright_template   text NOT NULL DEFAULT '',
  updated_at           timestamptz NOT NULL DEFAULT now(),
  updated_by           uuid REFERENCES public.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_footer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_footer_select_all" ON public.site_footer;
CREATE POLICY "site_footer_select_all"
  ON public.site_footer FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_footer_admin_write" ON public.site_footer;
CREATE POLICY "site_footer_admin_write"
  ON public.site_footer FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO public.site_footer (locale)
VALUES ('sq'),('en'),('uk'),('it')
ON CONFLICT (locale) DO NOTHING;

NOTIFY pgrst, 'reload schema';
```

---

## Footer audit — current content vs. DB fields

| Current section | DB field | Fallback when DB empty |
|-----------------|----------|------------------------|
| Brand logo link | `brand_title` (display override) | `siteName` from site_settings |
| Tagline text | `tagline` | `t('tagline')` (i18n) |
| Navigation section title | `nav_section_title` | `t('navigation')` |
| Navigation links | `nav_links` (JSONB array) | Hardcoded: Home / Listings / Add listing |
| Information section title | `info_section_title` | `t('information')` |
| Information links | `info_links` (JSONB array) | Hardcoded: About / Contact / Privacy / Terms |
| Social section | `social_section_title` | `t('follow_us')` |
| Social links | `social_links` (JSONB array) | Hardcoded: Facebook / Instagram |
| Copyright | `copyright_template` (`{year}` placeholder) | `© {year} {siteName} — {t('all_rights')}` |

---

## Fallback chain (public footer)

1. Current locale DB row → field value
2. `sq` DB row → field value (if current locale row missing)
3. i18n / hardcoded constants (if DB empty or table not initialized)

---

## FooterLink JSONB structure

```typescript
{
  id: string        // UUID (client-generated)
  label: string     // display text
  url: string       // /path (internal) or https://... (external)
  enabled: boolean  // hidden from public if false
  order: number     // position in array (index-based)
}
```

Internal links: `/{locale}{url}` rendered automatically. External links: used as-is with `target="_blank"`.

---

## Positive Flow

1. Owner applies SQL (creates table + 4 empty rows).
2. Admin opens `/admin/footer` → loads 4 locale tabs; each tab shows all fields.
3. Admin fills Albanian (sq) content → Save → `upsertFooterContent('sq', ...)` → DB UPDATE → `revalidatePath('/', 'layout')`.
4. Public footer re-renders with sq content on next navigation.
5. Same for en/uk/it.

---

## Negative Flow

| Branch | Handler |
|--------|---------|
| Non-admin opens /admin/footer | `assertAdminUser()` returns null → server action returns `forbidden` → `AdminFooterManager` shows "error_forbidden" banner |
| Table not initialized (SQL not run) | `getAllFooterContent()` catches error code `42P01` → `initialized: false` → shows "not_initialized" banner |
| DB save fails | `toast.error(t('error_save'))` — form state preserved |
| Invalid URL (javascript:/data:) | `validateLinks()` catches → server returns `invalid_url` → `toast.error(t('error_invalid_url'))` |
| DB row missing for a section | Per-field fallback to i18n or hardcoded (see table above) |
| Concurrent edit | `updated_at` refreshed on each upsert; next page load reflects latest |
| `/contact` link (Epic V / Task 222) | Preserved in i18n fallback (`href={/${locale}/contact}`) AND admin can add it explicitly to `info_links` |
| `{year}` in copyright | Dynamic — `copyrightTemplate.replace('{year}', String(year))` in Footer.tsx |

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| Schema-drift SQL regenerated | ✅ 30 tables / 284 cols; `SiteFooter → site_footer` 12 cols |
| `/contact` link preserved in fallback | ✅ Line 110 in Footer.tsx |
| `getFooterContent` try/catch handles missing table | ✅ Returns null → fallback |
| URL validation rejects `javascript:` / `data:` | ✅ `isValidLinkUrl()` in footer.ts |
| `revalidatePath('/', 'layout')` on save | ✅ Invalidates entire layout cache |
| Admin-only write guard | ✅ `assertAdminUser()` checks `role = 'admin'` |
| `PanelBottom` icon in sidebar | ✅ Added to import + GROUPS |
| `admin.footer` namespace ×4 locales | ✅ sq/en/uk/it — 20 keys each |
| `admin.pages.footer_title/subtitle` ×4 | ✅ |
| `admin.sidebar.item_footer` ×4 | ✅ |
| Public footer fallback chain | ✅ DB → sq DB → i18n/hardcoded |
| Internal link resolution (`/${locale}${path}`) | ✅ `resolveHref()` in Footer.tsx |

**Final verdict:** ✅ PASS — code complete; SQL emitted for owner; public footer defensive against missing table; tsc=0.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/types/database.ts` | Added `FooterLink` + `SiteFooter` interfaces | Type coverage for drift guard |
| `src/modules/admin/actions/footer.ts` | **New** — `getFooterContent`, `getAllFooterContent`, `upsertFooterContent` | Server actions for footer CRUD |
| `src/app/admin/footer/page.tsx` | **New** — SSR admin route | `/admin/footer` admin page |
| `src/components/admin/AdminFooterManager.tsx` | **New** — full client manager (locale tabs + link editors + save) | Admin UI for footer editing |
| `src/components/layout/Footer.tsx` | Reads from DB via `getFooterContent`; per-field fallback to i18n/hardcoded | DB-driven public footer |
| `src/components/admin/AdminSidebar.tsx` | Added `item_footer` entry with `PanelBottom` icon; import updated | Sidebar navigation |
| `scripts/check-schema-drift.mjs` | Added `SiteFooter: 'site_footer'` to INTERFACE_TABLE_MAP | Drift guard coverage |
| `scripts/schema-drift-check.sql` | Regenerated: 30 tables / 284 cols | Auto-generated |
| `messages/sq.json` | Added `admin.sidebar.item_footer` + `admin.pages.footer_*` + `admin.footer.*` (20 keys) | Locale sq |
| `messages/en.json` | Same ×1 | Locale en |
| `messages/uk.json` | Same ×1 | Locale uk |
| `messages/it.json` | Same ×1 | Locale it |
