-- ============================================================
-- Task 302 — site_footer backfill v2 (UPDATE-only, idempotent)
-- ============================================================
-- PURPOSE:
--   Fill the 4 existing site_footer rows (sq / en / uk / it) that
--   Task 247 seeded as empty placeholders. After running, the
--   Admin → Footer editor shows prefilled content and the public
--   footer reads from DB instead of the i18n fallback chain.
--
-- WHY v2 (first script failed):
--   v1 used INSERT … ON CONFLICT (locale) DO NOTHING followed by
--   separate UPDATEs. If locale lacks a UNIQUE or PRIMARY KEY
--   constraint, PostgreSQL raises an error on the ON CONFLICT clause,
--   aborts the whole transaction, and the UPDATEs never run.
--   v2 removes the INSERT entirely — the rows already exist — and
--   uses direct UPDATEs only. No ON CONFLICT, no transaction risk.
--
-- IDEMPOTENCY:
--   Text fields:  COALESCE(NULLIF(col, ''), seed)
--     → fills if current value is NULL or empty string; skip otherwise.
--   jsonb arrays: CASE WHEN col IS NULL OR col = '[]'::jsonb THEN seed ELSE col END
--     → fills if NULL or empty array; skip otherwise.
--   updated_at always set to NOW() so you can verify the run.
--
-- OWNER-EDIT PRESERVATION:
--   Any field already saved by the admin editor will NOT be overwritten.
--   Running this script twice is safe.
--
-- PREREQUISITE:
--   The 4 rows must exist. If you see 0 rows updated for a locale,
--   run this first (once only):
--     INSERT INTO site_footer (locale) VALUES ('sq'),('en'),('uk'),('it');
--   (Then re-run this script.)
--
-- VERIFICATION (run the SELECT at the bottom after the UPDATEs):
--   Expected: brand_len > 0, tagline_len > 0, copyright_len > 0,
--             nav_count = 3, info_count = 4, social_count = 2
--             for all 4 locale rows.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Albanian (sq)
-- ─────────────────────────────────────────────────────────────
UPDATE site_footer SET
  brand_title          = COALESCE(NULLIF(brand_title, ''),          'Lero.al'),
  tagline              = COALESCE(NULLIF(tagline, ''),              'Tregu kryesor i pasurive të paluajtshme në Shqipëri.'),
  nav_section_title    = COALESCE(NULLIF(nav_section_title, ''),    'Navigim'),
  nav_links            = CASE WHEN nav_links IS NULL OR nav_links = '[]'::jsonb THEN
    '[{"id":"nav-0","label":"Kryefaqja","url":"/","enabled":true,"order":0},
      {"id":"nav-1","label":"Njoftime","url":"/listings","enabled":true,"order":1},
      {"id":"nav-2","label":"Shto njoftim","url":"/listings/create","enabled":true,"order":2}]'::jsonb
    ELSE nav_links END,
  info_section_title   = COALESCE(NULLIF(info_section_title, ''),   'Informacion'),
  info_links           = CASE WHEN info_links IS NULL OR info_links = '[]'::jsonb THEN
    '[{"id":"info-0","label":"Rreth nesh","url":"/about","enabled":true,"order":0},
      {"id":"info-1","label":"Kontakt","url":"/contact","enabled":true,"order":1},
      {"id":"info-2","label":"Politika e privatësisë","url":"/privacy-policy","enabled":true,"order":2},
      {"id":"info-3","label":"Kushtet e shërbimit","url":"/terms-of-service","enabled":true,"order":3}]'::jsonb
    ELSE info_links END,
  social_section_title = COALESCE(NULLIF(social_section_title, ''), 'Na ndiqni'),
  social_links         = CASE WHEN social_links IS NULL OR social_links = '[]'::jsonb THEN
    '[{"id":"social-0","label":"Facebook","url":"https://facebook.com","enabled":true,"order":0},
      {"id":"social-1","label":"Instagram","url":"https://instagram.com","enabled":true,"order":1}]'::jsonb
    ELSE social_links END,
  copyright_template   = COALESCE(NULLIF(copyright_template, ''),   '© {year} Lero.al — Të gjitha të drejtat e rezervuara'),
  updated_at           = NOW()
WHERE locale = 'sq';

-- ─────────────────────────────────────────────────────────────
-- English (en)
-- ─────────────────────────────────────────────────────────────
UPDATE site_footer SET
  brand_title          = COALESCE(NULLIF(brand_title, ''),          'Lero.al'),
  tagline              = COALESCE(NULLIF(tagline, ''),              'The leading real estate marketplace in Albania.'),
  nav_section_title    = COALESCE(NULLIF(nav_section_title, ''),    'Navigation'),
  nav_links            = CASE WHEN nav_links IS NULL OR nav_links = '[]'::jsonb THEN
    '[{"id":"nav-0","label":"Home","url":"/","enabled":true,"order":0},
      {"id":"nav-1","label":"Listings","url":"/listings","enabled":true,"order":1},
      {"id":"nav-2","label":"Add listing","url":"/listings/create","enabled":true,"order":2}]'::jsonb
    ELSE nav_links END,
  info_section_title   = COALESCE(NULLIF(info_section_title, ''),   'Information'),
  info_links           = CASE WHEN info_links IS NULL OR info_links = '[]'::jsonb THEN
    '[{"id":"info-0","label":"About us","url":"/about","enabled":true,"order":0},
      {"id":"info-1","label":"Contact","url":"/contact","enabled":true,"order":1},
      {"id":"info-2","label":"Privacy policy","url":"/privacy-policy","enabled":true,"order":2},
      {"id":"info-3","label":"Terms of service","url":"/terms-of-service","enabled":true,"order":3}]'::jsonb
    ELSE info_links END,
  social_section_title = COALESCE(NULLIF(social_section_title, ''), 'Follow us'),
  social_links         = CASE WHEN social_links IS NULL OR social_links = '[]'::jsonb THEN
    '[{"id":"social-0","label":"Facebook","url":"https://facebook.com","enabled":true,"order":0},
      {"id":"social-1","label":"Instagram","url":"https://instagram.com","enabled":true,"order":1}]'::jsonb
    ELSE social_links END,
  copyright_template   = COALESCE(NULLIF(copyright_template, ''),   '© {year} Lero.al — All rights reserved'),
  updated_at           = NOW()
WHERE locale = 'en';

-- ─────────────────────────────────────────────────────────────
-- Ukrainian (uk)
-- ─────────────────────────────────────────────────────────────
UPDATE site_footer SET
  brand_title          = COALESCE(NULLIF(brand_title, ''),          'Lero.al'),
  tagline              = COALESCE(NULLIF(tagline, ''),              'Провідний маркетплейс нерухомості в Албанії.'),
  nav_section_title    = COALESCE(NULLIF(nav_section_title, ''),    'Навігація'),
  nav_links            = CASE WHEN nav_links IS NULL OR nav_links = '[]'::jsonb THEN
    '[{"id":"nav-0","label":"Головна","url":"/","enabled":true,"order":0},
      {"id":"nav-1","label":"Оголошення","url":"/listings","enabled":true,"order":1},
      {"id":"nav-2","label":"Додати оголошення","url":"/listings/create","enabled":true,"order":2}]'::jsonb
    ELSE nav_links END,
  info_section_title   = COALESCE(NULLIF(info_section_title, ''),   'Інформація'),
  info_links           = CASE WHEN info_links IS NULL OR info_links = '[]'::jsonb THEN
    '[{"id":"info-0","label":"Про нас","url":"/about","enabled":true,"order":0},
      {"id":"info-1","label":"Контакти","url":"/contact","enabled":true,"order":1},
      {"id":"info-2","label":"Політика конфіденційності","url":"/privacy-policy","enabled":true,"order":2},
      {"id":"info-3","label":"Умови обслуговування","url":"/terms-of-service","enabled":true,"order":3}]'::jsonb
    ELSE info_links END,
  social_section_title = COALESCE(NULLIF(social_section_title, ''), 'Ми в соцмережах'),
  social_links         = CASE WHEN social_links IS NULL OR social_links = '[]'::jsonb THEN
    '[{"id":"social-0","label":"Facebook","url":"https://facebook.com","enabled":true,"order":0},
      {"id":"social-1","label":"Instagram","url":"https://instagram.com","enabled":true,"order":1}]'::jsonb
    ELSE social_links END,
  copyright_template   = COALESCE(NULLIF(copyright_template, ''),   '© {year} Lero.al — Всі права захищені'),
  updated_at           = NOW()
WHERE locale = 'uk';

-- ─────────────────────────────────────────────────────────────
-- Italian (it)
-- ─────────────────────────────────────────────────────────────
UPDATE site_footer SET
  brand_title          = COALESCE(NULLIF(brand_title, ''),          'Lero.al'),
  tagline              = COALESCE(NULLIF(tagline, ''),              'Il principale marketplace immobiliare in Albania.'),
  nav_section_title    = COALESCE(NULLIF(nav_section_title, ''),    'Navigazione'),
  nav_links            = CASE WHEN nav_links IS NULL OR nav_links = '[]'::jsonb THEN
    '[{"id":"nav-0","label":"Home","url":"/","enabled":true,"order":0},
      {"id":"nav-1","label":"Annunci","url":"/listings","enabled":true,"order":1},
      {"id":"nav-2","label":"Aggiungi annuncio","url":"/listings/create","enabled":true,"order":2}]'::jsonb
    ELSE nav_links END,
  info_section_title   = COALESCE(NULLIF(info_section_title, ''),   'Informazioni'),
  info_links           = CASE WHEN info_links IS NULL OR info_links = '[]'::jsonb THEN
    '[{"id":"info-0","label":"Chi siamo","url":"/about","enabled":true,"order":0},
      {"id":"info-1","label":"Contatti","url":"/contact","enabled":true,"order":1},
      {"id":"info-2","label":"Informativa sulla privacy","url":"/privacy-policy","enabled":true,"order":2},
      {"id":"info-3","label":"Termini di servizio","url":"/terms-of-service","enabled":true,"order":3}]'::jsonb
    ELSE info_links END,
  social_section_title = COALESCE(NULLIF(social_section_title, ''), 'Seguici'),
  social_links         = CASE WHEN social_links IS NULL OR social_links = '[]'::jsonb THEN
    '[{"id":"social-0","label":"Facebook","url":"https://facebook.com","enabled":true,"order":0},
      {"id":"social-1","label":"Instagram","url":"https://instagram.com","enabled":true,"order":1}]'::jsonb
    ELSE social_links END,
  copyright_template   = COALESCE(NULLIF(copyright_template, ''),   '© {year} Lero.al — Tutti i diritti riservati'),
  updated_at           = NOW()
WHERE locale = 'it';

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION — run after UPDATEs to confirm success.
-- Expected: brand_len > 0, tagline_len > 0, copyright_len > 0,
--           nav_count = 3, info_count = 4, social_count = 2
--           for all 4 rows. updated_at should be today.
-- ─────────────────────────────────────────────────────────────
SELECT
  locale,
  char_length(brand_title)         AS brand_len,
  char_length(tagline)             AS tagline_len,
  char_length(copyright_template)  AS copyright_len,
  jsonb_array_length(nav_links)    AS nav_count,
  jsonb_array_length(info_links)   AS info_count,
  jsonb_array_length(social_links) AS social_count,
  updated_at::date                 AS updated_date
FROM site_footer
ORDER BY locale;
