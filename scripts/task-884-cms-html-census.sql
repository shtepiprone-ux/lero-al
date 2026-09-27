-- Task 884 (R5) — O79-6 census: does any live `pages` row use markup sanitizeCmsHtml.ts would strip?
-- Read-only. One statement, one grid. Run in Supabase Dashboard -> SQL Editor.
--
-- One row per `pages` row x locale with a non-empty body, as (slug, locale, is_published, flags,
-- stripped_tags):
--   - flags: a comma list of which risky patterns occur in the stored text — script, on_handler,
--     javascript_url, data_url, iframe_or_embed, style_attr, class_attr, id_attr, img, svg, form.
--     This is a text-pattern screen over the stored JSON, not a parse of the rendered HTML — it can
--     over-report (e.g. the literal word "onclick" inside plain prose). It is a screen for the
--     owner's O79-6 review, not a verdict.
--   - stripped_tags: the distinct, sorted, lower-cased tag names present in the body that are NOT in
--     src/modules/cms/lib/sanitizeCmsHtml.ts's R2 allowlist (h1-h6, p, br, hr, strong, b, em, i, u, s,
--     blockquote, ul, ol, li, a, code, pre, table, thead, tbody, tr, th, td) — i.e. exactly what the
--     sanitiser would remove from that row today.
-- A final ('(count)') row gives the number of rows that carry any flag or stripped tag. 0 means no
-- live page relies on markup the sanitiser would strip. Slugs only, no body text is selected.

with locale_bodies as (
  select
    p.slug,
    loc.locale,
    p.is_published,
    coalesce(p.content -> loc.locale ->> 'body', '') as body
  from pages p
  cross join (values ('sq'), ('en'), ('uk'), ('it')) as loc(locale)
  where coalesce(p.content -> loc.locale ->> 'body', '') <> ''
),
found_tags as (
  select
    lb.slug,
    lb.locale,
    lb.is_published,
    lb.body,
    array_remove(array_agg(distinct lower(m[1])), null) as tags
  from locale_bodies lb
  left join lateral regexp_matches(lb.body, '<\s*([a-zA-Z][a-zA-Z0-9]*)', 'g') as m on true
  group by lb.slug, lb.locale, lb.is_published, lb.body
),
scored as (
  select
    ft.slug,
    ft.locale,
    ft.is_published,
    (
      select string_agg(pattern, ',' order by pattern)
      from (
        values
          ('script', ft.body ~* '<\s*script\b'),
          ('on_handler', ft.body ~* '\son[a-z]+\s*='),
          ('javascript_url', ft.body ~* 'javascript\s*:'),
          ('data_url', ft.body ~* 'data\s*:'),
          ('iframe_or_embed', ft.body ~* '<\s*(iframe|embed)\b'),
          ('style_attr', ft.body ~* '\sstyle\s*='),
          ('class_attr', ft.body ~* '\sclass\s*='),
          ('id_attr', ft.body ~* '\sid\s*='),
          ('img', ft.body ~* '<\s*img\b'),
          ('svg', ft.body ~* '<\s*svg\b'),
          ('form', ft.body ~* '<\s*form\b')
      ) as pats(pattern, hit)
      where hit
    ) as flags,
    (
      select array_agg(tag order by tag)
      from unnest(ft.tags) as tag
      where tag not in (
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
        'blockquote', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      )
    ) as stripped_tags
  from found_tags ft
)
select
  slug,
  locale,
  is_published::text as is_published,
  coalesce(flags, '') as flags,
  coalesce(array_to_string(stripped_tags, ','), '') as stripped_tags
from scored
union all
select
  '(count)' as slug,
  null as locale,
  null as is_published,
  null as flags,
  count(*)::text as stripped_tags
from scored
where coalesce(flags, '') <> '' or stripped_tags is not null;
