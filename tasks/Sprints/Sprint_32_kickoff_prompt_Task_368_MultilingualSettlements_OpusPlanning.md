# Sprint 32 — Task 368 (Opus planning) — Multilingual settlements: 4-locale names (sq/en/uk/it) end-to-end

> **Status: READY (priority: high — supersedes Task 364's `uk/it → name_al` fallback per owner directive 2026-06-03).**
> This is an **Opus architecture/planning** task. It produces a schema+admin+resolution contract and ONE-OR-TWO
> copy-paste-ready Sonnet implementation tasks; it does NOT itself ship product code. Related: Task 364 (settlement
> sq/en localization), `AdminLocationsManager`, Epic (locations/settlements).
>
> Sub-task(s) consume the next free pool number(s) ≥ 369 — assign when written.

```
Type:     architecture / schema / admin / i18n planning
Priority: high
Area:     locations schema · admin locations CRUD · settlement label resolution · search · data backfill
```

## Role contract
You are Opus orchestrator/architect. **Do NOT write product code.** Read/`rg`-search runtime + schema to audit;
writing is allowed ONLY to `docs/**`, `tasks/**`. Forbidden to edit: `src/`, `app/`, `components/`, `modules/`,
migrations, `messages/*.json`, package files. **Git:** Opus runs no mutating git; the owner commits from PowerShell
(single-writer). **Opus runs no git in the Cowork sandbox at all** (2026-06-02 index-corruption incident).

## Owner directive (2026-06-03)
Settlements must be fully localized in **all four** locales (sq/en/uk/it), not fall back to `name_al` for uk/it.
This requires: (1) expand the schema with uk/it names; (2) expand the admin locations UI so each settlement gets a
name in all four locales; (3) backfill names for every existing settlement; (4) resolve labels by active locale
everywhere; (5) search across available names. This **supersedes** Task 364's `uk/it → name_al` interim rule and the
divergent `PopularLocations` resolution (`PopularLocations.tsx:51` currently `uk/it → name_en`).

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/rule-index.md` · `docs/orchestrator-role.md` ·
`docs/data-access-rules.md` · `docs/rls-rules.md` · `docs/domain-rules.md` · `docs/ai-behavior.md` (Note 14 global-change) ·
`docs/architecture.md` · `package.json`. Task 364 session log (`docs/sessions/2026-06-02-task-364-settlement-localization.md`).

## Audit findings to confirm/extend (file:line anchors)
- Schema: `src/types/database.ts:193` `Location` has `name_al`, `name_en: string｜null`, `slug`, `type`, `parent_id`,
  `region_id`, `lat`, `lng`, `image_url`, `is_featured`, `display_order`. **No `name_uk` / `name_it`.**
- Read path: `src/modules/locations/lib/queries.ts:8` `getSearchableLocations()` selects `name_al, name_en, …`;
  hook `src/modules/locations/hooks/useLocations.ts` returns `Location[]`.
- Resolution today: `src/components/shared/LocationCombobox.tsx` `resolveLocationLabel()` (en→name_en, else name_al,
  capitalized) + alt-name in `description` for bi-directional search; `PopularLocations.tsx:51` uses a DIFFERENT rule
  (sq→name_al else name_en) — divergence to unify.
- Admin: `src/components/admin/AdminLocationsManager.tsx`; actions `addLocation` (`src/modules/admin/actions/index.ts:616`),
  update (`:175`), insert (`:163`), delete (`:193`). Quick-add `onAddLocation` (`LocationCombobox.tsx:47`) passes only
  `{ name_al, region_id }`.
- Migration mechanism: standard `supabase/migrations` dir NOT found — **STOP & ASK** the owner where DB migrations live
  before designing the migration step.

## Required Opus investigation output (document before writing the Sonnet task)
1. Exact `locations` table columns + how migrations are applied (confirm with owner).
2. Every settlement-label render/search site (grep `LocationCombobox`, `name_al`, `name_en`, `from('locations')`) — the
   full consumer inventory that must switch to the canonical resolver (Note 14): LocationCombobox, PopularLocations,
   AdminLocationsManager, AdminPopularLocationsManager, listings filters, hero search, profile, auth, etc.
3. Admin CRUD: where create/edit happens; how to add 4 name inputs; whether uk/it required or optional-with-fallback.
4. Backfill strategy: how ~N existing settlements get uk/it names (manual admin entry vs. import vs. transliteration
   seed) — owner decision; the data is NOT inventable by Sonnet.
5. Required-vs-optional policy + fallback chain (recommend: sq→name_al, en→name_en, uk→name_uk, it→name_it, each
   falling back to name_al when null — so the UI never shows blank).

## Required decisions to surface for OWNER REVIEW
- **Migration mechanism + permission** to add `name_uk`, `name_it` columns (nullable).
- **uk/it required or optional?** (Recommend optional-with-fallback so the feature ships before full backfill.)
- **Backfill ownership**: who enters the ~N settlement names in uk/it, and when (gate the resolver switch on backfill %
  or ship with fallback immediately?).
- **Quick-add (`onAddLocation`)**: should it capture 4 names or stay Albanian-only + admin completes later?

## Canonical contract the Sonnet task(s) must encode
- Schema migration: add `name_uk text`, `name_it text` (nullable) to `locations`; update `Location` type + every
  `select('… name_al, name_en …')` to include them.
- ONE canonical `resolveLocationLabel(loc, locale)` (sq/en/uk/it → respective field, fallback chain to name_al),
  capitalized via the canonical `capitalize()` util — **replace** the per-component variants (LocationCombobox +
  PopularLocations + any other site) so all consumers resolve identically (Note 14).
- Search: bi-directional across all populated names via the existing Combobox `description` mechanism (no primitive change).
- Admin: locations create/edit captures all 4 names; quick-add per the owner decision; RLS unchanged.
- i18n: any new UI strings (field labels "Назва (UA)" etc.) localized sq/en/uk/it (settlement DATA is content, not i18n keys).
- Responsive: admin form usable + no overflow at 320/375/390/768/1280/1440/2560 in all locales.

## Required Sonnet task structure (Task 255 rule)
Produce ONE task unless audit proves a safe split (max two: **A** schema migration + type/select + canonical resolver +
consumer unification; **B** admin 4-locale CRUD + quick-add + backfill UX). Each Sonnet task MUST contain explicit
`Positive flow (happy path)` and `Negative flow (every off-happy-path branch)` sections and AC citing both. Negative
flow at minimum: missing uk/it name → fallback to name_al (never blank); admin save with empty required field →
localized validation error, no write; migration applied but old rows null → safe fallback; search with no match →
empty state; permission-denied (non-admin) on locations CRUD → blocked by RLS; locale switch → label updates without
reload; double-submit guard on add/edit.

## Out of scope (Opus must state for Sonnet)
Redesigning the locations/admin layout beyond adding name fields · changing region/parent hierarchy · auto-translation
services · changing unrelated listing/search business logic · DS layout-primitive migration (that is the separate
DS-6/7/8 track).

## Gating note
Per owner DS-ordering (2026-06-03): feature work waits behind full DS-1..DS-8. This task is **schema/admin/data**, not
DS-layout-primitive work — Opus must flag in the produced Sonnet task whether it runs now (DB/admin track) or queues
behind DS route-migration; surface this for OWNER decision in the planning session.

## Required documentation updates (this Opus task)
`docs/backlog.md` (concise entry + link) · new session log `docs/sessions/2026-06-03-task-368-multilingual-settlements-planning.md` ·
the produced Sonnet implementation task file(s) under `tasks/Sprints/`.

## Final report from Opus
1. Confirmed schema + migration mechanism. 2. Full consumer inventory. 3. Required-vs-optional + fallback decision.
4. Backfill plan + owner asks. 5. One task vs split (+justification). 6. The complete Sonnet task(s). 7. Docs changed.
8. Confirmation Opus wrote no product code. 9. Gating recommendation (now vs behind DS).
