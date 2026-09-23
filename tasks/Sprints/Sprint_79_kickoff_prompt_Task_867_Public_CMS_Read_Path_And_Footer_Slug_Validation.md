# Task 867 — the public CMS read path (`pages` has no `anon` grant), and the Footer that cannot link to a page it publishes

Sprint 79 · P1 · QA profile **Q4** (RLS/read-path security + server-action validation) · no dependencies ·
owner actions **O79-1 … O79-4** · **Status: 🔁 NEEDS REVISION 2026-09-23 (review 1) — re-enter at §16, READY FOR SONNET**

Sprint plan: [`Sprint_79_The_CMS_Pages_Nobody_Can_Read.md`](Sprint_79_The_CMS_Pages_Nobody_Can_Read.md).

Owner report that opened it (2026-09-21, verbatim): *"Я перевірив продакшн: https://lero.al/en/privacy-policy реально
повертає 404"*; acceptance sentence: *"Адмін створив і опублікував privacy-policy з текстом →
https://lero.al/en/privacy-policy відкривається в інкогніто → Footer з /privacy-policy зберігається → соціальні
посилання з Footer відображаються на сайті."*

## 1. Mode and task type

`IMPLEMENTATION` — a GRANT/RLS change delivered as owner-applied SQL, two server-action validation changes, one
pure-helper change, and tests. **No component, JSX, `className`, style or Storybook change anywhere in this task.**
Bundles: **DB / Server Action / RLS** + **Regression / Critical Flow Coverage** + **Admin Table / Admin Control**
(server-side halves only).

## 2. Objective

1. `public.pages` gets the grant and the row-level policy the public route has needed since 2026-05-30: `anon` and
   `authenticated` may `select` **only** rows with `is_published = true`. Delivered as owner-applied, idempotent SQL
   with its own verify script, following the template in `docs/rls-rules.md` → "Required migration template".
2. Footer link validation stops being a five-entry static list. Shape validation stays client-reachable and pure;
   **existence** is decided on the server against `pages` where `is_published = true`. A locale's social links are no
   longer discarded because a legal link failed validation.
3. `is_published: true` can no longer be written for a page whose Albanian body is empty.
4. The owner's premise that per-locale cache revalidation is missing is **re-measured, not implemented**: `/[locale]/[slug]`
   is a `ƒ` dynamic route, so there is no route cache to invalidate (see R6). The executor confirms or falsifies this
   from its own build output and reports the result; it adds no `revalidatePath` call.

## 3. Verified context — measured 2026-09-21 by the orchestrator (re-measure the live arms at I0)

### 3.1 The 404, and the two tasks that produced it

| # | Fact | Evidence |
|---|---|---|
| F1 | Task 275's grant audit set `public.pages` to `service_role: ALL · anon: none · authenticated: none`, action *"REVOKE ALL FROM anon; REVOKE ALL FROM authenticated"*, rationale *"No public route reads pages directly from DB (admin-managed CMS content)."* | `tasks/Sprints/Sprint_16_task_275_grant_audit.md:52` |
| F2 | That audit was applied to the live database. | `docs/rls-rules.md` → "Existing-table audit": *"Audit run on 2026-05-28 as Task 275 … Owner-applied on 2026-05-28."* |
| F3 | Two days later Task 326A added the public renderer, which reads `pages` with the **anon/session** client. | `src/app/[locale]/[slug]/page.tsx:38-44`; `src/lib/supabase/server.ts:4-9` uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| F4 | 326A's own planning session ordered the check that was never done: *"Public renderer at `[locale]/[slug]` uses anon Supabase client with RLS allowing SELECT only when `is_published = true`. Verify existing `pages` RLS posture."* | `docs/sessions/2026-05-30-task-326-admin-pages-footer-flow-planning.md:196` |
| F5 | The route discards the Supabase `error`, so a `42501` missing-GRANT error and "no such row" both reach the same `notFound()`. | `src/app/[locale]/[slug]/page.tsx:39` (`const { data: page } = …`), `:46` |
| F6 | A missing GRANT is exactly error `42501` on this project's Data API. | `docs/rls-rules.md` → "Public Schema GRANT Discipline": *"PostgREST returns error code `42501` … that error code means 'missing GRANT,' not a code bug."* |
| F7 | The admin sees the same pages because `/admin/pages` reads them with the **service role**, which bypasses both GRANT and RLS. | `src/app/admin/pages/page.tsx:12-16` (`createAdminClient()`); `src/modules/admin/actions/index.ts:233,255,261,270` |
| F8 | `privacy-policy`, `about` and `terms-of-service` are **not** reserved slugs, so the route's reserved-slug guard is not the cause. | `src/lib/reserved-slugs.ts:6-13` |
| F9 | `/[locale]/[slug]` **is** in the production build output and is server-rendered on demand: `├ ƒ /[locale]/[slug]   377 B   185 kB`. The route is not missing from the deployment. | `docs/sessions/evidence/task791/build-rev2.log:27` |
| **F21** | **The inference below is now MEASURED, by the owner, on the live project, 2026-09-21.** An anonymous PostgREST read of `pages` returns **HTTP 401 Unauthorized**; the identical request through the service role returns rows. This is the missing-GRANT signature of F6 observed directly, and it is what `[slug]/page.tsx:39` discards. | Owner-run block, 2026-09-21: `ANON -> The remote server returned an error: (401) Unauthorized.` / `SVC  -> 1 rows` |
| **F22** | **The live `pages` table holds exactly one row.** Whatever that row is, `/about` and `/terms-of-service` cannot both exist, and `privacy-policy` may not exist at all. Its slug, `is_published` and per-locale content lengths are **UNKNOWN** and are I0's first measurement (§10.1). | Same block: `SVC  -> 1 rows` |

**MEASURED, not inferred (2026-09-21).** F1+F2+F3+F5+F6 predicted that every anonymous request for a published CMS
page returns 404, and F21 confirms the predicted mechanism on the live project: `anon` is refused at the Data API,
the route swallows the refusal, `notFound()` runs. **Branch A of the I0 probe is therefore already selected: R2
applies.** I0 re-runs the probe as **freshness validation** of F21/F22, not as a fresh investigation — the owner may
have applied something between this kickoff and execution. The stop condition is unchanged and still binding: if the
probe now shows `anon` **already** holding `select`, stop and report `TASK SPECIFICATION CONTRADICTION` instead of
applying R2.

**MISSING EVIDENCE — the production HTTP arm did not run.** The owner's third command printed `PROD ->` with no
status: the exception carried no `Response` object, which on Windows PowerShell 5.1 is the TLS-negotiation or
connection-failure shape, not a 404. Per `docs/orchestrator-procedures.md` → "Windows-native execution gate" this is
an **environment screen, not a repository finding**: it neither confirms nor weakens the owner's original report that
the page 404s. The corrected command is in §13.3; the executor must not cite the blank result as evidence in either
direction.

### 3.2 The empty-content branch is a real defect but is **not** the 404 cause

- The route returns `notFound()` only when the resolved locale content **and** the `sq` fallback have an empty title
  **and** an empty body (`[slug]/page.tsx:52-56`). A page with a title and an empty body renders 200.
- Task 326A's backfill copied the legacy `title` column into `content.sq.title`
  (`scripts/task-326-pages-locale-jsonb.sql:7-17`), and the admin editor refuses to save without a non-empty
  `content.sq.title` (`AdminPagesManager.tsx:105`). So the "both empty" branch is not reachable for pages created or
  migrated through the existing paths.
- The archived 326A row records the real state: *"sq.body empty=pre-existing; pages need body fill"*
  (`docs/backlog-archive.md:401`).
- **Consequence for this task:** R5's publish guard is a data-integrity fix the owner asked for, and it is worth
  doing — but the kickoff does not claim it fixes the 404, and neither may the executor.

### 3.3 The Footer half

| # | Fact | Evidence |
|---|---|---|
| F10 | `isValidFooterUrl` accepts exactly five internal paths — `/`, `/contact`, `/favorites`, `/listings`, `/listings/create` — and rejects every other path starting with `/`. | `src/lib/footer-route-allowlist.ts:4-10,28-40` |
| F11 | The file's own comment is stale by fifteen months of route history: *"pages table slugs are excluded: the table exists but no public [locale]/[slug] renderer exists yet."* | `src/lib/footer-route-allowlist.ts:1-3` |
| F12 | The client returns **before** the server call when any enabled link fails that check. | `src/components/admin/AdminFooterManager.tsx:265-268` |
| F13 | The server action rejects the **whole locale payload** — nav, info **and** social links — on the same check. | `src/modules/admin/actions/footer.ts:107-110` |
| F14 | With no saved social links, the public footer renders hardcoded `https://facebook.com` / `https://instagram.com`. | `src/components/layout/Footer.tsx:54-57` |
| F15 | The same file's default info links are `/about`, `/contact`, `/privacy-policy`, `/terms-of-service` — three of the four are links the validator refuses to save. | `src/components/layout/Footer.tsx:47-52` |
| F16 | Footer links are rendered with the locale prefix, so a stored `/privacy-policy` navigates to `/{locale}/privacy-policy`. | `src/components/layout/FooterView.tsx:9-12,24-26` |
| F17 | `validateSlug` is the project's canonical slug validator: non-empty, no `/`, `^[a-z0-9-]+$`, not reserved. | `src/lib/slug-validator.ts:6-13` |
| F18 | There is **no** test file anywhere covering `isValidFooterUrl`, `upsertFooterContent`, `createPage` or `updatePage`. | `git --no-optional-locks grep -l -E "isValidFooterUrl\|upsertFooterContent\|createPage\|updatePage" -- "src/**/__tests__/*" "src/**/*.test.*" "playwright/*"` returns nothing |
| F19 | Both strings the rejection path needs already exist in **all four** locales: `admin.footer.error_invalid_internal_link` (the toast) and `admin.footer.link_url_invalid_internal` (the inline hint). So R4 needs no new key. | `messages/{sq,en,uk,it}.json` → `admin.footer` |
| F20 | The inline hint's second sentence is dated — en: *"Use an existing route or disable this link **until page creation is available**"* — because page creation now exists. Rewording it is **not** this task's (see §8); it is recorded on **868**. | `messages/en.json` → `admin.footer.link_url_invalid_internal` |

### 3.4 Surfaces, GR-1 and the no-markup boundary

Measured 2026-09-21 with `node scripts/check-surface-census.mjs`:

| Surface | Nodes | Result |
|---|---|---|
| `src/app/admin/footer/page.tsx` | 7 | all blocking, all already in `scripts/surface-census-baseline.json` (`page.tsx`, `AdminFooterManager`, `AdminPageHeader` tier-1; `ui/button`, `ui/input`, `ui/label`, `ui/tabs` tier-2) |
| `src/app/[locale]/[slug]/page.tsx` | 1 | `tier1 manifest:no story:no className:3`, baselined |

**This task changes none of those files.** R3/R4 change `src/lib/footer-route-allowlist.ts` (a pure helper, not a
component) and `src/modules/admin/actions/footer.ts` (a `'use server'` module). `AdminFooterManager.tsx` keeps
calling `isValidFooterUrl(url)` with the same signature and renders the same markup; its inline invalid-URL branch
simply stops firing for a shape-valid CMS slug, and the existing localized toast
`admin.footer.error_invalid_internal_link` already covers the server's rejection. That is why GR-1's census does not
put `/admin/footer` in scope here: **no file that renders a visible surface is edited.** The executor must prove that
at the end (AC8), not assert it.

### 3.5 What the owner asked for that this task deliberately does **not** do

- **"задеплоїти/відновити публічний маршрут"** — the route is present in the build output (F9) and is not missing.
  R6 re-measures it; there is nothing to restore.
- **"очищати кеш усіх локалей … revalidatePath('/sq/${slug}')"** — `ƒ` in the route table means server-rendered on
  demand (F9), `next.config.ts` sets no `experimental.staleTimes`, and the route reads `cookies()` through
  `createClient()`, which opts it out of the full route cache. A `revalidatePath` call on a dynamic route would be
  dead code. R6 makes the executor re-derive this from its own build; **if its build reports anything other than `ƒ`
  for `/[locale]/[slug]`, the executor stops and reports rather than guessing.**
- **A specific admin message for the refused publish** — that requires editing `AdminPagesManager.tsx` (367 ln,
  58 `className`, 6 `@/components/ui/*` primitives, unmigrated), which under GR-1/clause 16d would pull the whole
  `/admin/pages` surface into scope. Reserved as **868** and routed to Sprint 78. Until 868 lands, a refused publish
  shows the existing generic `admin.legal.save_error` toast. This limitation is stated in R5 and must be repeated in
  the completion report.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1 F21/F22 | `scripts/task-867-pages-read-probe.mjs` (new): reads `.env.local` **through Node's `fs`** (never PowerShell `Get-Content -Raw`), then performs three read-only queries — `anon` select over `pages`, `anon` select over `pages` filtered to `is_published = true`, and the same select through the service role — printing for each the PostgREST error **code** and message (or `null`) and the row count, and then the §10.1 content census (one line per row: slug, `is_published`, and the four locales' title/body **lengths**). It prints **no key material and no body text**, and performs no write. Re-running it after O79-1 is the before/after pair for AC3. | P0 | AC1 | Confirmed |
| **R2** | `docs/rls-rules.md` template | `scripts/task-867-pages-public-select.sql` (new, owner-applied): idempotent. `grant select on public.pages to anon, authenticated;` and `create policy "pages_select_public" on public.pages for select to anon, authenticated using (is_published = true);` guarded by `drop policy if exists`. It grants **no** `insert/update/delete` to either role and changes no service-role grant. A header comment states the deploy order and cites Task 275 and Task 326A. | P0 | AC2, AC3 | Confirmed |
| **R3** | owner item 5 | `src/lib/footer-route-allowlist.ts`: `isValidFooterUrl` keeps its signature `(url: string) => boolean` and its current verdicts for the empty string, external URLs, locale-prefixed paths and the five static paths; it additionally returns `true` for a **single-segment** path whose slug passes the canonical `validateSlug` (`src/lib/slug-validator.ts`). A multi-segment path that is not one of the static entries still returns `false`. The stale comment at `:1-3` is replaced by one that states the new client/server split. | P0 | AC4 | Confirmed |
| **R4** | owner item 5 | `src/modules/admin/actions/footer.ts` → `upsertFooterContent`: for every **enabled** link whose URL starts with `/` and is not one of `STATIC_INTERNAL_PATHS`, the action resolves the slug against `pages` where `is_published = true` through `createAdminClient()`. Unknown or unpublished slug → the existing `{ error: 'invalid_internal_link' }`. A published slug saves, **together with that locale's social links**. The existing `isValidFooterUrl` shape check runs first; a shape-invalid path is still rejected without a DB call. | P0 | AC5 | Confirmed |
| **R5** | owner item 3 | `src/modules/admin/actions/index.ts`: `createPage` and `updatePage` return a new typed error `'sq_body_required'` when the **effective** post-write state would be `is_published === true` with an empty (whitespace-trimmed) `content.sq.body`. "Effective" means: use `data.content` when the call supplies it; when `is_published: true` arrives without `content`, read the row's stored `content` through `createAdminClient()` first. No write is performed when the guard fires. | P1 | AC6 | Confirmed |
| **R6** | owner item 4 | The executor records `/[locale]/[slug]`'s marker from its **own** `npm run build` route table in the session evidence. If the marker is `ƒ`, it adds **no** `revalidatePath` call anywhere and records the refutation. If the marker is anything else, it stops and reports `TASK SPECIFICATION CONTRADICTION` rather than implementing either branch. | P2 | AC7 | Confirmed |
| **R7** | `docs/rls-rules.md` §RLS-Change Test Requirement | New vitest coverage: `src/lib/__tests__/footer-route-allowlist.test.ts` and `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts`, covering the positive and negative arms of R3, R4 and R5, plus the **write-path actor assertion** that `createPage`/`updatePage`/`deletePage`/`upsertFooterContent` still write through `createAdminClient()` (service role) and not through the user client. | P0 | AC4, AC5, AC6 | Confirmed |
| **R8** | `docs/rls-rules.md` §RLS-Change Test Requirement | `scripts/task-867-verify.sql` (new, owner-run after R2): prints (a) the `pages` grants per grantee from `information_schema.role_table_grants`, (b) the policies on `public.pages` with `roles`, `cmd` and `qual`, (c) a **positive** arm — under `set local role anon`, the count of published rows readable is greater than zero — and (d) a **negative** arm — under the same role, the count of rows with `is_published = false` readable is zero, printed next to the service-role count of draft rows so a vacuous arm is visible. | P0 | AC3 | Confirmed |

## 5. Assumptions and open questions

1. **ASSUMED, re-measured at I0:** the live grant state still matches Task 275's applied action (`anon: none`). AC1 is
   the measurement; a contradiction stops the task (§3.1).
2. **ASSUMED:** the owner's `.env.local` and the deployed site point at the same Supabase project
   (`NEXT_PUBLIC_SITE_URL=https://lero.al` sits in the same file as the project URL). The probe therefore describes
   production. If the executor cannot run the probe in its environment, it records `MISSING EVIDENCE` and hands the
   owner §13.3's block; it does **not** proceed to R2 on the inference alone.
3. **UNKNOWN:** whether any `pages` row currently has `is_published = false`. R8's grid (d) prints the service-role
   draft count next to the anon count precisely so an empty negative arm is visible rather than silently vacuous;
   O79-3 supplies a subject when the count is zero.
4. **DECIDED, not open:** the admin-facing message for a refused publish is **868**, not this task (§3.5).

## 6. Pre-read rule bundle

- `docs/golden-rules.md` — **GR-0 in full**, and GR-1 … GR-6.
- `docs/agent-contract.md` — clauses 9, 9a, 10, 14, 15, and **16b–16d in full**.
- `docs/rule-index.md` → "DB / Server Action / RLS" and "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md` — the `Q4` row and "Negative-flow applicability".
- `docs/rls-rules.md` — **"RLS-Change Test Requirement" in full**, "Public Schema GRANT Discipline" (template +
  per-role discipline), "Acknowledged Advisor Exceptions".
- `docs/data-access-rules.md`, `docs/domain-rules.md`, `docs/qa-rules.md`.
- `docs/rls-write-path-manifest.md` — rows 55-57 (`createPage` / `updatePage` / `deletePage`).
- This kickoff's sprint plan.

Do not read the UI bundles: this task changes no visible artifact.

## 7. Scope

Files the executor may create or change:

- `scripts/task-867-pages-read-probe.mjs` *(new)*
- `scripts/task-867-pages-public-select.sql` *(new)*
- `scripts/task-867-verify.sql` *(new)*
- `src/lib/footer-route-allowlist.ts`
- `src/modules/admin/actions/footer.ts`
- `src/modules/admin/actions/index.ts` — the `createPage` / `updatePage` bodies and their error unions only
- `src/lib/__tests__/footer-route-allowlist.test.ts` *(new)*
- `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` *(new)*
- `docs/sessions/2026-09-21-task867-*.md` and `docs/sessions/evidence/task867/**`
- `docs/backlog.md` — the 867 row's state only

## 8. Out of scope

- `src/app/[locale]/[slug]/page.tsx` — **do not edit it.** Its swallowed-error branch (F5) and its Tailwind markup
  are both real debt; editing it would trigger GR-1 for a baselined tier-1 surface. Report it, do not fix it here.
- `src/components/admin/AdminFooterManager.tsx`, `src/components/admin/AdminPagesManager.tsx`,
  `src/components/layout/Footer.tsx`, `src/components/layout/FooterView.tsx` — no edits of any kind.
- `messages/*.json` — this task adds no new user-facing string and **changes no existing one**, including the dated
  wording of `admin.footer.link_url_invalid_internal` (F20). If the executor believes a key is needed, that belief is
  **868**; stop and report rather than adding or rewording one.
- Any `revalidatePath` addition (R6).
- Filling page bodies, or any other content change in the database.
- Referential protection on unpublish/delete of a linked page.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Anonymous `GET /en/privacy-policy` | 404 (owner-measured in production); mechanism per §3.1 | 200 for a published page in each of `sq`/`en`/`uk`/`it`; 404 for a draft or unknown slug |
| Anonymous read of a **draft** page | 404 | 404 — and now guaranteed at the DB layer by `pages_select_public`, not only by the route's `.eq('is_published', true)` |
| Admin `/admin/pages` list and editor | service-role read, unaffected | unchanged |
| Footer Save with a legal link to a published CMS slug | blocked in the browser before any request (F12) | saved; the link and that locale's social links persist |
| Footer Save with a link to an unknown or unpublished slug | blocked in the browser | reaches the server, rejected with the existing `invalid_internal_link` error and its existing localized toast |
| Footer Save with a locale-prefixed path (`/en/about`) or a deep path | rejected | rejected — unchanged |
| Public footer with no saved social links | hardcoded Facebook/Instagram fallback (F14) | unchanged fallback; it simply stops being what the site shows once a save succeeds |
| Publishing a page with an empty `sq` body | allowed | refused with `sq_body_required`; the admin sees the existing generic save-error toast until 868 |
| Page write client | service role (F7) | unchanged — asserted by R7 |

## 10. Implementation requirements

1. **I0 content census — the first measurement, before any code.** The probe of R1 also prints, through the service
   role, one line per `pages` row: `slug`, `is_published`, and the **character length** of `content.<locale>.title`
   and `content.<locale>.body` for each of the four locales. Never the body text itself. This exists because the live
   table held **one** row on 2026-09-21 (F22), so the executor must know which slugs actually exist before it writes
   a test fixture or reads the acceptance criteria as satisfiable. Record the census verbatim in the session
   evidence. It changes no requirement — R2…R7 are independent of how many rows exist — but a completion report that
   does not carry it is incomplete.
2. **Order.** I0 census + probe (R1) → R3/R4/R5/R7 code and tests → §13.2 gate → report. R2's SQL is **written** by
   the executor but applied by the owner (O79-1); the task does not wait for it to be applied before reporting.
3. **The probe reads `.env.local` with Node `fs`.** `docs/orchestrator-procedures.md` → the 818/816 corollary: a
   BOM-less UTF-8 file round-tripped through PowerShell `Get-Content -Raw` is silently mojibaked. The probe prints no
   key, no bearer token and no URL fragment beyond the project host.
4. **Canonical reuse (GR-0).** R3's new arm calls `validateSlug` from `src/lib/slug-validator.ts`; it does not
   re-implement the slug regex, the reserved-slug list or a locale-prefix list. R4 reuses the existing
   `'invalid_internal_link'` error code and its existing localized messages; no new error string reaches the UI.
5. **No new visual value, no new component, no new Story, no new locale key.** If the work appears to need one, stop.
6. **R4's DB call is batched.** Collect the distinct candidate slugs of one payload, resolve them with a single
   `.in('slug', slugs).eq('is_published', true)` query, and compare sets. Do not issue one query per link.
7. **R5's guard must not change the success path.** A published page with a non-empty `sq` body, and every draft save,
   behave exactly as today.
8. **Failure behaviour of R4's lookup.** If the `pages` query itself errors, return the existing transient error
   (`{ error: 'transient' }`) and log it. Do **not** fall through to a successful save and do not treat a DB error as
   "slug not found".
9. **Encoding and integrity.** Every new file is UTF-8 without BOM; `check:file-integrity` and `check:mojibake` are
   part of the gate block.

## 11. Positive and negative flows

**Positive.** The owner publishes `privacy-policy` with Albanian text. After O79-1, an anonymous visitor opens
`https://lero.al/en/privacy-policy` and gets 200 with the page title and body. In `/admin/footer` the admin adds an
info link `/privacy-policy` and a social link, presses Save, and both persist; the public footer renders the saved
social links instead of the Facebook/Instagram fallback.

| Negative flow | Applicable | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| Anonymous read of a **draft** page | **Yes** | R2/R8 | Zero rows under `role anon` | AC3 grid (d) |
| Anonymous read of an unknown slug | **Yes** | route (unchanged) | 404 | AC9 owner step |
| `anon` attempts `insert`/`update`/`delete` on `pages` | **Yes** | R2 grants `select` only | No privilege granted; AC2 quotes the SQL, AC3 grid (a) shows the grant set | AC2, AC3 |
| Footer link to an **unpublished** slug | **Yes** | R4 | `invalid_internal_link`; nothing in that locale is saved | AC5 |
| Footer link to a **nonexistent** slug | **Yes** | R4 | `invalid_internal_link` | AC5 |
| Footer link that is **disabled** but has a bad URL | **Yes** | existing `l.enabled` filter | Ignored; save succeeds | AC5 |
| Footer link with a locale prefix (`/en/about`) | **Yes** | R3 (preserved) | Rejected | AC4 |
| Footer link to a reserved slug (`/listings`, `/auth`) | **Yes** | R3 via `validateSlug` | `/listings` stays valid (static entry); `/auth` is rejected | AC4 |
| `pages` lookup errors during a Footer save | **Yes** | R4 §10.8 | `transient`, logged, no save | AC5 |
| Publish with an empty `sq` body, `content` supplied | **Yes** | R5 | `sq_body_required`, no write | AC6 |
| Publish with an empty `sq` body, `content` **not** supplied | **Yes** | R5 | Stored content is read first; same refusal | AC6 |
| Save as **draft** with an empty `sq` body | **Yes** | R5 | Allowed, unchanged | AC6 |
| Concurrent writer | No | Single admin surface, service-role writes, no observed contention | N/A | — |
| Offline/network | No | Existing global behaviour unchanged | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `node.exe scripts\task-867-pages-read-probe.mjs` run from the project root, when its output is
  read, then it reports, for each of the three queries, an error code (or `null`) and a row count, **and** the §10.1
  content census for every row; the transcript is saved under `docs/sessions/evidence/task867/`. The report states
  which of the two branches the measurement selected: `anon` denied (proceed with R2, the branch F21 already
  selected) or `anon` already permitted (`TASK SPECIFICATION CONTRADICTION`), and it states whether the census still
  shows the single row of F22 or something else.
- **AC2 [R2]** — Given `scripts/task-867-pages-public-select.sql`, when read, then it contains the `select`-only grant
  for `anon` and `authenticated`, a `drop policy if exists` followed by `create policy "pages_select_public" … for
  select to anon, authenticated using (is_published = true)`, no `insert`/`update`/`delete` grant to either role, and
  a header naming Task 275, Task 326A and the deploy order. Quote each statement in the report.
- **AC3 [R2, R8]** — Given the owner's run of `scripts/task-867-verify.sql` after O79-1, when its grids are read, then
  (a) lists `select` for `anon` and `authenticated` on `public.pages` and no other privilege for those two roles,
  (b) lists `pages_select_public` with `cmd = SELECT` and a qualifier referencing `is_published`, (c) the anon-role
  count of published rows is greater than zero, and (d) the anon-role count of draft rows is zero **next to** a
  non-zero service-role draft count. Owner-native (§13.3).
- **AC4 [R3, R7]** — Given `npm.cmd run test -- src/lib/__tests__/footer-route-allowlist.test.ts`, when run, then every
  case passes, including: the five static paths valid; `''` and `https://…` valid; `/en/about`, `/sq`, `/it/x`
  invalid; `/privacy-policy`, `/about`, `/terms-of-service` valid; `/auth` invalid; `/some/deep/path` invalid;
  `/Privacy-Policy` and `/privacy_policy` invalid.
- **AC5 [R4, R7]** — Given the action suite, when run, then: a payload whose only internal link is a published slug
  saves and its `social_links` reach the upsert; the same payload with an unpublished slug returns
  `invalid_internal_link` and performs no upsert; a disabled bad link does not block the save; a `pages` lookup error
  returns `transient` with no upsert; and the upsert is issued through the service-role client.
- **AC6 [R5, R7]** — Given the same suite, when run, then `createPage` and `updatePage` return `sq_body_required` and
  perform no write for a publish with an empty `sq` body in both the content-supplied and content-omitted forms; a
  draft save with an empty body succeeds; and a publish with a non-empty body succeeds.
- **AC7 [R6]** — Given the executor's own `npm run build` route table, when read, then the report quotes the marker
  printed for `/[locale]/[slug]` and states the resulting decision, and `git --no-optional-locks diff` contains no
  added `revalidatePath` call.
- **AC8 [scope]** — Given `git --no-optional-locks diff --stat`, when read, then the changed paths are the ones listed
  in §7 and none of the §8 paths appears; and `node.exe scripts\check-surface-census-changed.mjs --base HEAD` exits 0
  with no new blocking node.
- **AC9 [owner]** — Given **O79-0 completed** and O79-4 run after deployment, when the owner opens
  `https://lero.al/en/privacy-policy` in a private window and repeats it for `/sq/`, `/uk/` and `/it/`, then each
  published page responds 200, and a slug that is not published responds 404. Owner-native (§13.3). **This criterion
  is not satisfiable while the page it names does not exist** (F22): an unmet AC9 whose cause is a missing row is an
  owner content precondition, not an implementation defect, and the review must classify it that way.
- **AC10** — Given the §13.2 gate block, when run, then every `npm`/`node` command in it exits 0.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: none. AC8's "none of the §8 paths appears" is the scope boundary itself, read from the diff, not a byte-level claim.`

`GR-1 CENSUS COMPLETE — 0 nodes in scope; this task edits no file that renders a visible surface (§3.4 measured both candidate surfaces: /admin/footer 7 nodes, /[locale]/[slug] 1 node — all already baselined, none edited). tier1 0 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed.`

`GR-3 / GR-3a — not applicable: no visible component changes and no Story-related write occurs. Any Story need discovered mid-task is a STOP, not a write.`

`GR-2 SCOPE STATED — check:surface-census:changed inspects only surfaces reachable from this diff's changed files and only compares against scripts/surface-census-baseline.json; it cannot see whether a DB policy exists. AC3's live grant/policy criterion is closed by the owner-run SQL grids, never by a green gate.`

## 13. QA profile and verification plan

**`Q4`** — a GRANT/RLS change on a public table plus server-action validation. Requires the positive and negative
permission arms (AC3, AC5, AC6), the write-path actor assertion (R7), the final zero-exit build, and owner-native DB
and production evidence (AC3, AC9). `docs/critical-flow-registry.md` has **no** row for CMS pages or Footer links
(searched `pages`, `footer`, `slug`), so no registry regression suite applies; the new tests are this task's coverage.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task867/`. Capture every transcript **unpiped**, redirecting to
a file and appending `$LASTEXITCODE` as its own statement.

### 13.2 Final gate block (executor)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
node.exe scripts\task-867-pages-read-probe.mjs
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/lib/__tests__/footer-route-allowlist.test.ts
npm.cmd run test -- src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts
npm.cmd run test:admin
npm.cmd run test:rls-guards
node.exe scripts\check-surface-census-changed.mjs --base HEAD
npm.cmd run check:i18n
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks grep -n "revalidatePath" -- src/modules/admin/actions/index.ts src/modules/admin/actions/footer.ts
git --no-optional-locks hash-object src/lib/footer-route-allowlist.ts src/modules/admin/actions/footer.ts src/modules/admin/actions/index.ts scripts/task-867-pages-read-probe.mjs scripts/task-867-pages-public-select.sql scripts/task-867-verify.sql
```

Expected: `win32` on the first line; every `npm`/`node` command exits 0; the probe prints three result lines and no
key material; the `revalidatePath` grep lists the two files' **pre-existing** calls (both files carry many unrelated
ones — the earlier wording here, "only the pages/settings/layout calls", was wrong and is withdrawn by review 1); AC7 is
closed by the added-line check in §16.4, not by that listing; `diff --stat` lists only §7 paths.
Record the `/[locale]/[slug]` line of the build's route table verbatim (AC7).

### 13.3 Owner-native steps, in order

```powershell
$slug = "privacy-policy"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$probe = "docs\sessions\evidence\task867\owner-probe.txt"
node.exe scripts\task-867-pages-read-probe.mjs > $probe
"EXIT_CODE=$LASTEXITCODE" | Add-Content $probe
try { "PROD -> " + (Invoke-WebRequest -Uri "https://lero.al/en/$slug" -UseBasicParsing).StatusCode } catch { "PROD -> status=" + $_.Exception.Response.StatusCode.value__ + " | msg=" + $_.Exception.Message }
```

Expected: the probe file records the anon result (an error code such as `42501`, or a row count) beside the
service-role row count and the content census; `PROD` prints `status=404` before O79-1 and `200` after the fix is
deployed. **The `Tls12` line and the `msg=` tail exist because the owner's 2026-09-21 run printed an empty status**
(§3.1, MISSING EVIDENCE): a blank `status=` with a populated `msg=` is a connection/TLS failure, not a 404, and must
be reported as such rather than recorded as a result.

Then, in order, and not as commands:

1. **O79-0 — the content precondition.** The live table held **one** row on 2026-09-21 (F22). Before O79-4 can mean
   anything, the pages the acceptance sentence names must exist **and carry Albanian text**: create or fill
   `privacy-policy` (and `about` / `terms-of-service` if they are wanted) in `/admin/pages` and publish them. This is
   content, not code, and after R5 lands an empty Albanian body will be refused at save time.
2. **O79-1** — paste `scripts/task-867-pages-public-select.sql` into the Supabase SQL editor, run it, return the output.
3. **O79-2** — run `scripts/task-867-verify.sql`, return all four grids.
4. **O79-3** — only if grid (d)'s service-role draft count is `0`: create a page with slug `rls-probe-867`, leave it
   **Draft**, re-run `scripts/task-867-verify.sql`, return the grids, then delete the page.
5. **O79-4** — after the approved review is deployed: open `https://lero.al/en/privacy-policy`, `/sq/…`, `/uk/…` and
   `/it/…` in a private window; then in `/admin/footer` save an info link `/privacy-policy` together with a social
   link, and confirm on the public site that the saved social links replaced the Facebook/Instagram fallback.

## 14. Completion report contract

Files changed with `git hash-object` values · R1–R8 status · AC1–AC10 (AC3 and AC9 owner-native, marked pending) ·
every command with its actual exit code · the probe's branch decision (§3.1) · the quoted `/[locale]/[slug]` build
route-table line (AC7) · the statement that no `messages/*.json` key, component, Story or `revalidatePath` call was
added · the 868 limitation restated (§3.5) · assumptions · deviations · limitations · unresolved issues.

Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval,
no review, no mutating git. Update the 867 row of `docs/backlog.md` with concise state only, and write
`docs/sessions/2026-09-21-task867-*.md` with a "Files Changed" table matching the real diff.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Can a fresh Sonnet session execute this without chat context? | Yes — §3 carries every measured fact with its file:line, §7/§8 bound the diff, §13 carries every command. |
| Is the root cause asserted or measured? | Asserted as an **inference** from F1–F6 and measured at I0 by AC1; a contradicting measurement stops the task. |
| Does any requirement claim the 404 is caused by empty content? | No — §3.2 refutes it explicitly, and R5 is scoped as a separate data-integrity fix. |
| Is an owner premise contradicted? | Two: the "missing route" (F9) and the per-locale revalidation (R6). Both are stated, not silently dropped. |
| Visible change? | None. §3.4 measures both candidate surfaces; AC8 proves the diff stayed out of them. |
| RLS-change test requirement satisfied? | Write-path inventory §3.1 F7 + `docs/rls-write-path-manifest.md:55-57`; positive/negative permission arms AC3/AC5/AC6; actor matrix §11; runtime proof through the real action code in R7. |
| Could a green CI gate be mistaken for policy proof? | No — the `GR-2 SCOPE STATED` receipt in §12 says what the gates cannot see. |
| Every owner command in a block? | Yes — §13.2 and §13.3; the non-command steps are numbered beneath them. |

## 16. Revision 1 — review 1, 2026-09-23 (`NEEDS REVISION`)

**Re-entry mode: `remediation`.** Start at §16.4. Keep every evidence file in `docs/sessions/evidence/task867/`
(`00`–`15`): they are the pre-revision baseline, **do not overwrite them**. Write revision evidence as
`r1-NN-*.txt` in the same folder. The probe (R1/AC1), R2/R8 SQL, R3 helper, R5 guard, and the
`footer-route-allowlist` test are **accepted and must not change**. `r1-*` evidence supersedes `02`–`15` only for the
AC10 gate block.

### 16.1 F1 — P2 — R4's service-role lookup runs before the admin check (R4, R7, AC5)

- **Observed:** `src/modules/admin/actions/footer.ts` → `upsertFooterContent` now calls `createAdminClient()` and runs
  `db.from('pages').select('slug').in(…).eq('is_published', true)` **before** `assertAdminUser()`. Before this diff,
  that function did only pure validation before the admin check, and created the service-role client after it.
- **Impact:** a `'use server'` export can be called by anyone. An unauthenticated or non-admin caller can now make the
  server run a service-role query and read the result from the response: `forbidden` = every slug is published,
  `invalid_internal_link` = at least one is not, `transient` = the lookup failed. The data exposed is low-sensitivity
  (published slugs are public once R2 is applied), but it breaks the project's order of admin check first, then the
  service role (every `index.ts` page action; the Task 851 precedent asserts 401 **before** `createAdminClient`).
- **Required:** move `const actorId = await assertAdminUser(); if (!actorId) return { error: 'forbidden' }` so it runs
  **after** the pure checks (locale, `validateLinks`, `isValidFooterUrl`) and **before** `createAdminClient()` and the
  `pages` lookup. Keep the lookup's behaviour otherwise unchanged (batched, `transient` on error, reject the whole
  locale payload).

### 16.2 F2 — P2 — R4's test cannot see its published-only filter (R4, R7, AC5)

- **Observed:** in `pages-and-footer-validation.smoke.test.ts`, `makePagesBuilder()` defines `eq() { return builder }`
  and `in() { return builder }`, so both drop their arguments, and `mockCmsBatchSelect` returns fixture rows
  regardless. The "unpublished slug" case only sets `data: []`. If `.eq('is_published', true)` or the `.in('slug', …)`
  set were removed from `footer.ts`, all 17 tests would still pass. The only planted-violation proof (`05b`) covers
  R5, not R4.
- **Required:** record the builder's `in` and `eq` calls on the `select('slug')` chain, then add these assertions:
  1. The positive case asserts `in` was called **once** with `('slug', <the distinct candidate slugs>)` **and**
     `eq` with `('is_published', true)`. A payload with two enabled links to `/privacy-policy`, one to `/about`, and
     one to the static `/contact` must produce exactly one lookup, with the set `['privacy-policy', 'about']` in any
     order. This proves §10.6's batching and that static paths are excluded.
  2. **New F1 arm:** with `mockGetUser` resolving `null`, and separately with the role `'user'`, a payload that
     contains a CMS slug returns `{ error: 'forbidden' }`, `mockCmsBatchSelect` is **not** called, and
     `mockFooterUpsert` is **not** called.
  3. **New R4 shape arm:** an enabled link `/some/deep/path` returns `invalid_internal_link` with
     `mockCmsBatchSelect` **not** called. R4 says "a shape-invalid path is still rejected without a DB call", and no
     test currently asserts it.

### 16.3 F3 — P3 — the session log misstates what the route does for en/uk/it (record accuracy)

`docs/sessions/2026-09-21-task867-cms-read-path-footer-slug-validation.md` → "I0 content census" says that en/uk/it
reads "would 404 on their own empty-content branch". That contradicts `src/app/[locale]/[slug]/page.tsx:51-56`: when
the locale's title and body are both empty, `rendered = content.sq`, and `notFound()` fires only if the **sq** title
and body are both empty too. All three live rows have a non-empty `sq.title`, so after O79-1 every locale returns
**200 with the Albanian title and an empty body**, not 404. Correct that paragraph. The content-fill point for the
owner still stands, but the reason is "renders a title with no body", not "404".

### 16.4 Planted-violation proof and gate block (AC5, AC10)

Every plant: take a `git hash-object` before the plant, plant, run, restore through Node `fs` (never
`Get-Content -Raw`), then take a `git hash-object` after. The after hash must equal the before hash. Record all of it
in `r1-05b-plants.txt`.

- **Plant A (F2):** delete `.eq('is_published', true)` from the R4 lookup. At least one R4 test must fail.
- **Plant B (F1):** move `assertAdminUser()` back below the lookup. The §16.2 item 2 test must fail.

Then run the §13.2 gate block again, with each output redirected to `r1-NN-*.txt`. Replace the `revalidatePath`
listing with this added-line check. Expect **no output**:

```powershell
git --no-optional-locks diff -U0 -- src | Select-String -Pattern '^\+.*revalidatePath'
```

### 16.5 Decided — no change owed

- **R5 when `is_published` is omitted.** The executor gated R5 on `data.is_published === true` only. That matches
  Objective 3 ("`is_published: true` can no longer be written…"). `AdminPagesManager.tsx:120-121` always sends
  `is_published`, so an update without it is reachable only by calling the action directly as an admin with
  `legal.manage`. Accepted as is. Do not widen R5.
- **Operational consequence, for the owner, not the executor:** all three live rows are published with an empty
  `sq.body` (I0 census, `01-probe.txt`). Once this ships, saving any of them from `/admin/pages` while it stays
  **Published** is refused (generic `admin.legal.save_error` toast until 868) until its Albanian body is filled.
  O79-0 covers this.

### 16.6 Completion report for revision 1

Report: the new `footer.ts` hash and test-file hash; the three new/changed test arms by name; Plant A and Plant B,
each with its failing test name and its before/after hash pair; the `r1-*` gate block exit codes; the corrected
session-log paragraph. Add a `## Revision 1` section to the same session log. Do not create a new log. Set the 867
backlog row to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`. Scope stays §7. No other file may change.
