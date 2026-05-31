-- Task 326A: Extend pages.content to per-locale JSONB shape
-- Safe to run multiple times (idempotent WHERE clause).
-- Owner runs once in Supabase SQL Editor.

-- Backfill existing single-locale rows into new per-locale shape.
-- Preserves legacy title + content.body in sq; en/uk/it start empty.
UPDATE pages
SET content = jsonb_build_object(
  'sq', jsonb_build_object(
    'title', COALESCE(title, ''),
    'body',  COALESCE(content->>'body', '')
  ),
  'en', jsonb_build_object('title', '', 'body', ''),
  'uk', jsonb_build_object('title', '', 'body', ''),
  'it', jsonb_build_object('title', '', 'body', '')
)
WHERE NOT (content ? 'sq' AND content ? 'en' AND content ? 'uk' AND content ? 'it');

-- Verify: all rows should now have the per-locale shape.
SELECT id, slug, title, is_published,
       content->'sq'->>'title' AS sq_title,
       content->'en'->>'title' AS en_title,
       jsonb_pretty(content) AS content_shape
FROM pages
ORDER BY updated_at DESC;
