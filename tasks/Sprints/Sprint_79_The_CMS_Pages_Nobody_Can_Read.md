# Sprint 79 — the CMS pages the site publishes, and nobody outside the admin can read

**Opened:** 2026-09-21 · **Status:** 🟠 **OPEN** · **Landed tasks:** 1 (867) · **Kickoffs filed:** 3 (867, 869, 884) · **Reserved:** 0 (868 kickoff filed in Sprint 78, 2026-09-25)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner report, 2026-09-21** (production observation, quoted): *"Я перевірив продакшн:
> https://lero.al/en/privacy-policy реально повертає 404"* … *"Footer: це підтверджений дефект. Він має жорсткий
> список лише статичних маршрутів і не визнає опубліковані CMS-slug-и. Через /about, /privacy-policy,
> /terms-of-service кнопка Save зупиняється ще до запиту на сервер. Тому разом із ними не зберігаються й соціальні
> посилання."*
>
> The owner's acceptance sentence, verbatim, is this sprint's exit criterion: *"Адмін створив і опублікував
> privacy-policy з текстом → https://lero.al/en/privacy-policy відкривається в інкогніто → Footer з /privacy-policy
> зберігається → соціальні посилання з Footer відображаються на сайті."*

## The defect, and why it is one sprint and not four

Two tasks, two days apart, left the CMS half-connected, and nothing since has read the seam:

- **2026-05-28 — Task 275** (grant-discipline audit, owner-applied the same day) set `public.pages` to
  `service_role: ALL · anon: none · authenticated: none`, with the rationale *"No public route reads pages directly
  from DB (admin-managed CMS content)."* — `tasks/Sprints/Sprint_16_task_275_grant_audit.md:52`.
- **2026-05-30 — Task 326A** shipped exactly such a route: `src/app/[locale]/[slug]/page.tsx` reads `pages` through
  the **anon/session** client (`createClient()` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Its planning session had already
  written the instruction — *"Verify existing `pages` RLS posture"*
  (`docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md:196`) — and it was never carried out.
- The route discards the Supabase error object (`const { data: page } = …`, `[slug]/page.tsx:39`), so a missing-GRANT
  `42501` is indistinguishable from "no such page": both fall into `notFound()`. The 404 is silent by construction.

The Footer half is the same seam from the other side. `src/lib/footer-route-allowlist.ts:1-3` carries the comment
*"pages table slugs are excluded: the table exists but no public [locale]/[slug] renderer exists yet"* — written
before 326A, never revisited after it. Its five-entry static list is consulted twice (`AdminFooterManager.tsx:265`
before the request is sent, `footer.ts:108` on the server), and because `upsertFooterContent` validates **one
locale's whole payload**, a single rejected legal link also blocks that locale's social links — which is why
`Footer.tsx:54-57`'s hardcoded `https://facebook.com` / `https://instagram.com` fallback is what the live site
renders. The same file's `infoLinks` fallback (`:47-52`) ships `/about`, `/privacy-policy` and `/terms-of-service`:
**the app's own defaults are links its own admin validator refuses to save.**

One sprint, because fixing either half alone leaves the owner's acceptance sentence false.

**Measured on the live project by the owner, 2026-09-21 — the diagnosis above is confirmed, not inferred.** An
anonymous PostgREST read of `pages` returns **HTTP 401 Unauthorized** while the identical service-role read returns
rows: the missing-GRANT signature, observed directly, and exactly what `[slug]/page.tsx:39` throws away. The same run
returned a second fact nobody had asked for: **the table holds exactly one row**, so the pages the acceptance
sentence names largely do not exist yet. That is content, not code — it becomes **O79-0**, and it is why an unmet
AC9 is not automatically an implementation defect. The third arm of that run, the production HTTP status, did not
execute (a PowerShell 5.1 TLS/connection failure printed a blank status); it is recorded as **MISSING EVIDENCE**,
and the corrected command ships in the kickoff's §13.3.

## Why a new sprint — goal fit checked against every open sprint

| Sprint | Its goal | Fits? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — one card family. |
| **55 · 56 · 57** | ARIA semantics / raw enum leaks / deleting unused code | No — detector and removal families. |
| **61 · 62** | Projection layer no gate reads / Tailwind runtime tokens | No — gate families. |
| **69** | `/listings` finishes the Mantine migration | No — a migration goal on another route. |
| **70** | The site chrome leaves Tailwind, and the mobile bar goes away | **Closest on the Footer half, and still no.** 70's goal sentence is a **de-Tailwind migration** of header/footer chrome; 867 changes no markup at all and touches no Footer component. |
| **71 · 72 · 74** | Listing-detail de-Tailwind / similar listings / one card width | No — listing surfaces. |
| **73** | A sold listing is reachable by link but never listed | **Closest in kind, and still no.** 73 is public reachability too, but its subject is listing **status** visibility and it is explicitly scope-locked to `PUBLIC_VISIBLE_STATUSES` and the listings RLS layer (D73-1…D73-3). `pages` is a different table, a different actor gap (a missing GRANT, not a predicate) and a different route. |
| **77** | The full test suite is red, and no gate runs it | No — test-suite health; the owner widened it for six named reserved numbers only. |
| **78** | Admin and agent dashboards rebuilt on canonical Mantine | No — a dashboard rebuild from spec v3.3. **868 is routed there, not here**, because it is an admin-surface migration. |

## Goal

1. An anonymous visitor can read a **published** CMS page at `/{locale}/{slug}` in all four locales, and **cannot**
   read a draft one. The guarantee lives in a DB policy, not in application code alone.
2. The Footer admin can save an internal link to any published CMS page, and saving legal links stops silently
   discarding that locale's social links.
3. `is_published = true` can no longer be written for a page with an empty Albanian body.
4. **The next failure on this read path is visible.** The route stops discarding the Supabase error object, so an
   infrastructure refusal and "no such page" stop being the same event — and the page it renders stops depending on
   three Tailwind `prose` classes that emit no CSS, because the plugin behind them was never installed.

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from a kickoff header.

| # | Title | Priority | QA | Depends on | State |
|---|---|---|---|---|---|
| **867** | The `pages` public read path (GRANT + `pages_select_public` policy, owner-applied SQL), Footer link validation against published slugs, and the empty-body publish guard | **P1** | **Q4** | — | ✅ `APPROVED WITH NOTES` 2026-09-23 (review 2; archived — P3: the executor attempted and suggested a mutating `git checkout`; ledger `docs/reviews/2026-09-23-task867-cms-read-path-footer-slug-validation.review-ledger.json`) → [`…Task_867…`](../Archive/Sprint_79_kickoff_prompt_Task_867_Public_CMS_Read_Path_And_Footer_Slug_Validation.md) |
| **869** | The CMS route stops swallowing its read error (both queries — the page query **and** `generateMetadata`'s, which 867's F5 did not name), its view moves into `CmsPageView` with a canonical Mantine Story and manifest entry, and the three dead `prose` classes go — `@tailwindcss/typography` is not installed and `globals.css` loads no `@plugin`, so they have emitted zero CSS since 326A | **P1** | **Q3** | 867 (sequencing, not function) | `NEEDS REVISION` 2026-09-25 (review 1: code accepted; missing session log and `check:locale-leak` run — evidence-only re-entry, kickoff §16; O79-5 can run now) → [`…Task_869…`](Sprint_79_kickoff_prompt_Task_869_CMS_Route_Error_Surfacing_And_View_Migration.md) |
| **868** | `/admin/pages` tells the admin *why* a publish was refused — the specific `sq_body_required` message, which requires the GR-1 census and Mantine migration of `/admin/pages` (6 nodes; `AdminPagesManager` 367 ln / 58 `className` / 6 shadcn primitives) | P3 | Q3 | 867 | 📝 `KICKOFF FILED` 2026-09-25 **in Sprint 78** (routed by goal fit; runs after 877) → [`…Task_868…`](Sprint_78_kickoff_prompt_Task_868_Admin_Pages_On_Mantine_With_Publish_Refusal_Reason.md) |
| **884** | A CMS page body is sanitised before render: one allowlist sanitiser (`sanitize-html`, server-side) at the single injection site `CmsPageView`; payload tests + plants; owner content census before approval. Filed 2026-09-25 by owner instruction (*"заведи окрему задачу"*) after the automated security review flagged `dangerouslySetInnerHTML` — the "new number" 869 §3.6 anticipated; urgent because 871 made a moderator's `legal.manage` effective | **P1** | Q4 | **869** | 📝 `KICKOFF FILED` 2026-09-25 → [`…Task_884…`](Sprint_79_kickoff_prompt_Task_884_CMS_Body_HTML_Sanitized_Before_Render.md) |

## Owner actions this sprint needs

| ID | Action |
|---|---|
| **O79-0** | **Content precondition, measured 2026-09-21: the live `pages` table holds exactly one row.** Create or fill and publish the pages the acceptance sentence names — `privacy-policy` first — with Albanian text in `/admin/pages`. Without this, O79-4 has nothing to open and the Footer's existence check will correctly refuse the link. |
| **O79-1** | ✅ **Applied 2026-09-23** ("Success. No rows returned"). Anon read measured after: 3 rows, no error; prod /en /sq /uk /it privacy-policy 200, unknown slug 404 → `docs/sessions/evidence/task867/review1-post-o79-1.txt`. |
| **O79-2** | Run `scripts/task-867-verify.sql` and return its grids (grant, policy, positive arm, negative arm). ✅ **Closed 2026-09-23 — AC3 VERIFIED:** (a) anon/authenticated SELECT only (after the §16.7 revoke), (b) `pages_select_public` + admin policy only (legacy duplicate dropped), (c) anon 3 published, (d) 0 of 1 draft. O79-3 done, probe page deleted. |
| **O79-3** | Create and then delete a throwaway **draft** page with slug `rls-probe-867` in `/admin/pages`, so the negative arm has a subject — required only if `scripts/task-867-verify.sql` reports zero draft rows. |
| **O79-4** | After the approved review is deployed: open `https://lero.al/en/privacy-policy` in a private window, save a Footer legal link to `/privacy-policy`, and confirm the saved social links render. |
| **O79-5** | Task 869's `OWNER VISUAL QA REQUIRED` matrix: open `Patterns/Mantine/CmsPageView` in Storybook and record accepted / returned for each state × locale × viewport tuple listed in that kickoff's §13.3. No automated screenshot verdict substitutes for it. |
| **O79-7** | **Now, before any 884 code lands:** as admin, open `/admin/permissions` and report whether moderators hold `legal.manage`; if a moderator does not need it, switch it off until 884 is deployed (884 kickoff §13.3). |
| **O79-6** | Task 884, after its executor reports and before approval: run `scripts/task-884-cms-html-census.sql` (one grid) and return it. A flagged **published** row is an owner decision (widen the allowlist or accept stripping, 884 §5.1). After deploy: open two published CMS pages in a private window and confirm the formatting is unchanged. |

## Explicitly not in this sprint

- ~~**Migrating `src/app/[locale]/[slug]/page.tsx` to Mantine.**~~ **SUPERSEDED 2026-09-23 by owner instruction**
  (*"Так треба одразу завести під цю прогалину задачу!"*), which filed **869** for the swallowed read error in that
  same file. The exclusion was written on 2026-09-21 under a premise that was true then and is false now: *"867 does
  not change that file, so GR-1 is not triggered."* 867 still does not change it — **869 does**, so GR-1 applies and
  the migration travels with the error fix. The 2026-09-21 measurement stands and is carried into 869 §3.3
  (1 node, `tier1`, `manifest:no story:no className:3`, baselined in `scripts/surface-census-baseline.json`),
  re-run on 2026-09-23 with the identical result.
- **Referential protection when a linked page is later unpublished or deleted** (Task 326B's original plan: block
  delete/unpublish/slug-change while the Footer references the slug). 867 validates at save time only. Unnumbered
  follow-up candidate; it becomes a task when the owner schedules it.
- **Filling the empty bodies of the existing legal pages.** That is content, not code — the 2026-05-30 archive row
  for 326A already records *"sq.body empty=pre-existing; pages need body fill"*.

## Exit criteria

1. `scripts/task-867-verify.sql`, run by the owner after O79-1, shows `anon` holding `select` on `public.pages`, a
   published row readable as `anon`, and a draft row **not** readable as `anon`.
2. `https://lero.al/en/privacy-policy` returns 200 in a private window (O79-4) — **after O79-0**, since the page it
   names did not exist on 2026-09-21. A 404 whose cause is a missing row closes nothing and blames nothing.
3. A Footer legal link to a published CMS slug saves, and that locale's social links persist and render.
4. `createPage` / `updatePage` refuse `is_published: true` with an empty `content.sq.body`, proven by unit tests.
5. `npm run build` exits 0 and the full §13.2 gate block of Task 867 is green.
6. A `42501` on the CMS read path is distinguishable from "no such page": Task 869's two-armed test proves the error
   arm logs once and the genuine-miss arm logs zero times, and the surface census for
   `src/app/[locale]/[slug]/page.tsx` prints two nodes with `CmsPageView` at `manifest:yes story:yes`.
