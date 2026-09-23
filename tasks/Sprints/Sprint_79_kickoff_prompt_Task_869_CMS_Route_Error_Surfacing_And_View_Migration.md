# Task 869 — the CMS route stops swallowing its read error, and its view leaves dead Tailwind

Sprint 79 · P1 · QA profile **Q3** (migrated page view + new canonical Mantine Story) · sequenced after **867** ·
owner action **O79-5** · **Status: 📝 KICKOFF FILED 2026-09-23 — READY FOR SONNET**

Sprint plan: [`Sprint_79_The_CMS_Pages_Nobody_Can_Read.md`](Sprint_79_The_CMS_Pages_Nobody_Can_Read.md).

Filed by owner instruction, 2026-09-23, verbatim: *"Так треба одразу завести під цю прогалину задачу!"* — issued
after the orchestrator reported that Task 867 leaves `src/app/[locale]/[slug]/page.tsx:39`'s swallowed error in
place and that no number had been filed for it. **That instruction is also this task's authorization to reverse the
Sprint 79 plan's "Explicitly not in this sprint" line about migrating this route**, which was written on 2026-09-21
under the true-at-the-time premise that no Sprint 79 task edits this file. 869 edits it, so GR-1 applies and the
migration comes with it.

## 1. Mode and task type

`IMPLEMENTATION` — error surfacing in one route file, a container/presentational split, a Mantine migration of the
extracted view, one new canonical Story, one manifest enrolment, one registered CSS token, and tests.

Bundles: **UI / Layout / Component** + **Storybook / Visual Proof** + **Regression / Critical Flow Coverage**.

## 2. Objective

1. `src/app/[locale]/[slug]/page.tsx` stops discarding the Supabase `error` object. A missing-GRANT `42501`, a
   transport failure and "no such published page" stop being the same observable event. Both queries in the file are
   covered — the page query **and** `generateMetadata`'s, which Task 867's F5 did not name.
2. The route's rendered markup moves out of the route file into `CmsPageView`, a native-Mantine presentational
   component with its own canonical Story and manifest entry, so the surface that GR-1 reports as
   `tier1-unenrolled-or-unstoried` stops being edited blind.
3. The CMS body stops being styled by three Tailwind classes that **resolve to nothing**: `@tailwindcss/typography`
   is not installed and `globals.css` loads no `@plugin` for it, so `prose prose-neutral dark:prose-invert` at
   `[slug]/page.tsx:65` has produced zero styles since Task 326A shipped. Mantine's `TypographyStylesProvider`
   replaces them.
4. A two-armed regression test makes the distinction in (1) observable: a PostgREST error logs **and** 404s; a
   genuinely missing row 404s and logs **nothing**. Without both arms the fix is unfalsifiable.

## 3. Verified context — measured 2026-09-23 by the orchestrator

### 3.1 The swallowed error, and the second one nobody has named

| # | Fact | Evidence |
|---|---|---|
| **G1** | The page query destructures `data` only: `const { data: page } = await supabase.from('pages')…` — the `error` member is never bound, so `42501`, a network failure and "no row" all arrive at `if (!page) notFound()` as the same value. | `src/app/[locale]/[slug]/page.tsx:39-46` |
| **G2** | **`generateMetadata` repeats the identical defect on its own separate query.** Task 867's F5 named `:39` only. This is a second, independent swallow in the same file, on the code path that produces the `<title>`. | `src/app/[locale]/[slug]/page.tsx:15-21` |
| **G3** | The project already has a canonical idiom for exactly this: log with a route-identifying prefix and a context object, then continue to `notFound()`. Two independent route precedents. | `src/app/admin/users/[id]/page.tsx:34` — `if (userError) console.error('AdminUserProfilePage: user query failed', { error: userError, id })` followed by `:35 if (!user) notFound()`; `src/app/[locale]/listings/page.tsx:75-77` — `if (error) { console.error('Failed to fetch listings', { error, searchParams: sp }) }` |
| **G4** | The same idiom is used by the page **write** path, so the read path is the outlier, not the innovation. | `src/modules/admin/actions/index.ts:238` (`console.error('createPage failed', { error })`), `:262` (`updatePage failed`), `:271` (`deletePage failed`) |
| **G5** | There is **no** logger module in the project: no `src/lib/logger*`, no Sentry, no `captureException`. `console.error` is the whole observability surface. | `ls src/lib` (no logger entry); `grep -rln "captureException\|Sentry" src/lib src/modules` → `performance/reporter.ts`, `supabase/client.ts`, `auth/actions/recovery.ts`, none of them a logger |
| **G6** | No `page.tsx` route in this repository has ever had a test. Only API routes do. So R5 establishes a pattern, and §10.4 names the exact proven mock idiom it must copy rather than invent. | `grep -rln "from '@/app/" src --include=*.test.ts*` → nothing; `find src/app -name "*.test.*"` → seven `api/**/route*.test.ts` files only |
| **G7** | The mock idiom R5 copies is proven and already asserts this exact class of property. Test 5 of that file is *"A refresh-row insert that fails after a good recompute is reported, never swallowed."* | `src/app/api/cron/listing-activity/__tests__/route.test.ts:1-40` (`vi.hoisted` state + `vi.mock('@/lib/supabase/admin')` returning a chainable fake) |

### 3.2 The three Tailwind classes that style nothing — measured, not assumed

| # | Fact | Evidence |
|---|---|---|
| **G8** | `@tailwindcss/typography` is **not a dependency**. The only Tailwind-family packages installed are `tailwindcss@^4`, `@tailwindcss/postcss@^4` and `tailwind-merge@^3.5.0`. | `package.json` — `dependencies` + `devDependencies` filtered for `/tailwind\|prose\|typograph/i` |
| **G9** | Tailwind v4 loads plugins through an explicit `@plugin` directive in the stylesheet. `globals.css` has **none**; its only top-level directives are `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`. | `src/app/globals.css:1-3`; `grep -n "^@plugin\|@config" src/app/globals.css` → no match |
| **G10** | **Therefore `prose prose-neutral dark:prose-invert` at `[slug]/page.tsx:65` emits no CSS at all.** Every published CMS body has rendered as unstyled browser-default HTML since 2026-05-30. This is not cosmetic debt that can wait: the moment O79-0 supplies content and O79-1 opens the grant, this is what the public sees. | G8 + G9 |
| **G11** | `TypographyStylesProvider` — Mantine's native mechanism for third-party/CMS HTML — is used **nowhere** in the project, and Mantine is `^8.3.18`, where it ships in `@mantine/core`. | `grep -rln "TypographyStylesProvider" src` → no match; `package.json` → `"@mantine/core": "^8.3.18"` |

### 3.3 GR-1 census — why the migration is not optional scope

Run natively 2026-09-23, `win32`, Node `v22.22.3`:

```
node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx"
```

```
NODES (1):
    src/app/[locale]/[slug]/page.tsx  tier:tier1  manifest:no  story:no  className:3  ui-imports:0  parent:(root surface)
FAIL  src/app/[locale]/[slug]/page.tsx  [tier1-unenrolled-or-unstoried]
GR-1 CENSUS BLOCKED — src/app/[locale]/[slug]/page.tsx
```

Exit code **1**.

| # | Fact | Evidence |
|---|---|---|
| **G12** | The surface is one node — itself — and it is `manifest:no story:no`. Editing it is editing an unmigrated, unstoried tier-1 surface, which is what GR-1 and clause 16d govern. | census above |
| **G13** | Its block is already in the CI baseline, so `check:surface-census:changed` stays green either way. **The baseline suppresses the CI failure; it does not satisfy the rule.** GR-2 applies: a baselined block is not evidence of compliance. | `scripts/surface-census-baseline.json:4` — `"src/app/[locale]/[slug]/page.tsx :: src/app/[locale]/[slug]/page.tsx :: tier1-unenrolled-or-unstoried"` |
| **G14** | **No `src/app/**` route file is enrolled anywhere in the manifest.** The project-wide shape is: the route file stays baselined debt, and the *view* it renders is the enrolled, storied artifact. | `scripts/mantine-migration-scope.json` is a flat array of 95 paths; filtering it for `src/app` returns **zero** entries |
| **G15** | The precedent is exact and adjacent. `src/app/[locale]/listings/[slug]/page.tsx` censuses as `tier1 manifest:no story:no className:0` while its child `ListingDetailView.tsx` is `manifest:yes story:yes`; the Story imports the real exported body component. | census of that surface (37 nodes); `src/stories/patterns/mantine/ListingDetailView.stories.tsx:5-8` imports `ListingDetailViewBody` |

**Consequence:** 869 extracts the view, enrols and stories **the view**, and leaves the route file as a
zero-`className` data container. After this task the route node still censuses `manifest:no story:no className:0`
and **keeps** its existing baseline row — the same terminal state as every other route in the repository. The new
node must be `manifest:yes story:yes`, adding no baseline row.

### 3.4 Canonical sources — GR-0 and GR-3a preflights, run at design time

`GR-0 CANONICAL REUSE PREFLIGHT — request: a presentational view for a public CMS page (page container + title + CMS rich-text body); semantic queries: rich text, prose, article, typography styles, dangerouslySetInnerHTML, page frame, content shell, page container, legal page; inspected candidates: src/design-system/mantine/patterns/ (full directory listing — nearest are MantineHomeSection.tsx, MantinePageHeaderWithActions.tsx, MantineAdminSurfacePattern.tsx, MantineAppShellFoundation.tsx, none renders rich text or a reading-measure content column), src/modules/listings/components/ListingsPageFrame.tsx (server component, Mantine-only, enrolled + storied — inspected in full: it is /listings route chrome built around a required Breadcrumbs trio, homeHref/homeLabel/currentLabel/breadcrumbAriaLabel, and a 1408px page-max band; a CMS legal page has no breadcrumb trail and a 768px reading measure, so reuse would mean passing invented crumbs and overriding its width), src/modules/listings/components/ListingDetailView.tsx (listing domain), whole-repo search for TypographyStylesProvider (zero hits) and for prose/dangerouslySetInnerHTML consumers (only the route itself, theme.ts's unrelated prose width token, SimilarListings.tsx, a story fixture); decision: CREATE; selected canonical owner: src/modules/cms/components/CmsPageView.tsx (new, smallest native-Mantine shared source, its direct canonical Story created in the same task before the route consumes it); Mantine/TailAdmin token path: src/design-system/mantine/theme.ts:675 (other.width.content = '48rem' / 768px) published as --width-content, theme.ts:544-554 spacing scale (md=16px, 2xl=32px, 3xl=48px), theme.ts:519 breakpoints.md = 48em = 768px, and @mantine/core TypographyStylesProvider driven by the project MantineProvider theme; new hardcoded visual values: NONE; rationale: no inspected candidate renders CMS rich text or a reading-measure content column, and every value the new component consumes already exists in the theme with its own provenance — nothing is re-picked.`

`GR-3a STORY PREFLIGHT — production component: CmsPageView × requested states (title+body, title-only, body-only, long-locale title wrap, rich body); canonical candidates: NONE; direct-import evidence: NONE — grep of src/stories/**/*.stories.tsx for cms/legal/privacy/terms returns only FooterView.stories.tsx and ListingDetailView.stories.tsx, neither of which imports any CMS page component; toolbar coverage: locale=Storybook locale toolbar (storyT, src/stories/_storyI18n.ts), viewport=Storybook viewport toolbar; decision: CREATE; target: NONE; rationale: the component does not exist yet and no canonical Story renders CMS page content in any composition.`

### 3.5 The token the server component needs, and why it is published rather than invented

| # | Fact | Evidence |
|---|---|---|
| **G16** | The current width is `max-w-3xl` = 48rem = 768px, and that exact value already exists in the Mantine theme with a matching rendered role: `content: '48rem', // 768px`. | `src/app/[locale]/[slug]/page.tsx:59`; `src/design-system/mantine/theme.ts:675` |
| **G17** | `theme.other.*` is read through `useMantineTheme()`, a hook — client components only (`AdminUsersTable.tsx:146-168` is the consumption precedent and is a client component). `CmsPageView` must stay a **server** component, so it cannot read `other.width.content` directly. | as cited |
| **G18** | The project has no `cssVariablesResolver`, so nothing auto-publishes `theme.other.*` as a CSS custom property. | `grep -rn "cssVariablesResolver" src` → no match |
| **G19** | The established fix for exactly this is a registered CSS custom property in `globals.css` consumed as `maw="var(--…)"` by a server component — shipped and approved as Task 775. | `src/app/globals.css:299` (`--width-page-max: 88rem;`) consumed at `src/modules/listings/components/ListingsPageFrame.tsx` (`maw="var(--width-page-max)"`) |
| **G20** | No existing custom property carries 768px in a reusable role. `--homepage-runtime-search-max-width: 48rem` is the same value in a **different** rendered role (homepage search field), and `theme.ts`'s own rule 3 — *"Same value as `thumbnail`, distinct rendered role"* — forbids collapsing two roles onto one token. | `src/app/globals.css:362`; `src/design-system/mantine/theme.ts:660-662` |

**Consequence:** R4 registers `--width-content: 48rem` beside `--width-page-max`, with a comment citing
`theme.ts:675`. The value is **published, not chosen** — it is the token that already governs this width.

### 3.6 Discovered, measured, and deliberately not filed

`[slug]/page.tsx:66` renders the CMS body through `dangerouslySetInnerHTML`, and **no sanitizer is installed**
(`package.json` filtered for `/saniti|dompurify|xss/i` → nothing). This is **not** an unguarded injection path:
every write to `pages` goes through `createPage` / `updatePage` / `deletePage`, and all three open with
`await assertPermission('legal.manage')` (`src/modules/admin/actions/index.ts:228, 250, 269`), a privileged staff
permission. The trust boundary is therefore "a `legal.manage` holder may author HTML", which is the normal contract
for a CMS rich-text field. **Recorded here as a measured fact; no task number is filed and the executor changes
nothing about it.** If the owner later wants defence-in-depth sanitisation, that is a new number, not this one.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | G1, G3 | `CmsSlugPage` binds `error` from the `pages` query. When `error` is truthy it calls `console.error('CmsSlugPage: pages query failed', { error, slug, locale })` and then proceeds to the existing `notFound()`. The rendered outcome for every input is **unchanged**; only the log is added. The message string is a literal, never a translated key. | P0 | AC1, AC5 | Confirmed |
| **R2** | G2, G3 | `generateMetadata` binds `error` from its own query and logs `console.error('CmsSlugPage.generateMetadata: pages query failed', { error, slug, locale })` before its existing `return {}`. Its return value is unchanged for every input. | P0 | AC1, AC5 | Confirmed |
| **R3** | G12-G15 | New `src/modules/cms/components/CmsPageView.tsx` — a **server** component (no `'use client'`, no function props), exporting `CmsPageView` and its props type. Props are plain data: `title: string \| null \| undefined`, `body: string \| null \| undefined`. It renders the `<main>` landmark, the title, and the body, and contains **zero** `className` attributes, zero `style` objects, zero raw px/rem/hex values. The route imports it and renders it; the route file's own `className` count becomes **0**. | P0 | AC2, AC3, AC6 | Confirmed |
| **R4** | G16-G20 | `src/app/globals.css` gains `--width-content: 48rem;` immediately beside `--width-page-max` (`:299`), with a comment naming its provenance (`theme.ts:675 other.width.content`, 768px, the migration of this route's `max-w-3xl`). `CmsPageView` consumes it as `maw="var(--width-content)"`. No other custom property is added, renamed or removed. | P0 | AC3, AC6 | Confirmed |
| **R5** | G6, G7 | New `src/app/[locale]/[slug]/__tests__/page.errors.test.ts`, copying the `vi.hoisted` + `vi.mock` idiom of `src/app/api/cron/listing-activity/__tests__/route.test.ts`. **Two arms, both required:** (a) the query resolves `{ data: null, error: { code: '42501', message: … } }` → `console.error` is called **once** with the R1 message and `notFound` is called; (b) the query resolves `{ data: null, error: null }` → `notFound` is called and `console.error` is **not** called. Arm (b) is what makes arm (a) meaningful; a suite with only (a) fails this requirement. Both arms are repeated for `generateMetadata` (R2). | P0 | AC5 | Confirmed |
| **R6** | G10, G11 | The CMS body renders inside `TypographyStylesProvider` from `@mantine/core`. The three dead classes (`prose prose-neutral dark:prose-invert`) are **deleted**, not translated into anything. No replacement typography rule, CSS module, or class is authored anywhere. | P0 | AC3, AC4, AC6 | Confirmed |
| **R7** | GR-1, GR-3 | `src/modules/cms/components/CmsPageView.tsx` is added to `scripts/mantine-migration-scope.json`, and `src/stories/patterns/mantine/CmsPageView.stories.tsx` (title `Patterns/Mantine/CmsPageView`) imports it **directly** and proves the states of §11. `scripts/surface-census-baseline.json` is **not** edited: the route node's existing block stays, and the new node must add none. | P0 | AC2, AC6 | Confirmed |
| **R8** | §3.4 | No new locale key, no changed locale string, no new visible copy. The Story's locale-dependent text comes from `storyT` (`src/stories/_storyI18n.ts`) or from local fixtures identified as fixtures; it never hardcodes a locale string in the component. | P1 | AC4, AC6 | Confirmed |

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: none.`

## 5. Assumptions and open questions

1. **ASSUMED, re-checked at I0:** the census, the baseline row, the manifest's zero `src/app` entries and the absent
   typography plugin are as measured on 2026-09-23. I0 re-runs the census and the two greps; a contradiction is
   `TASK SPECIFICATION CONTRADICTION`, reported, not worked around.
2. **DECIDED, one active route — an infrastructure error still renders 404, it is merely no longer silent.** The
   alternative (throw, so `global-error.tsx` renders a 500) changes the public HTTP contract of a live route and
   would turn a transient DB blip into a 500 on a legal page. Both route precedents (G3) log and continue. **The
   executor implements the logging route only** and does not add a throw, a rethrow, or an error boundary.
   *Owner note, non-blocking:* if you want a read failure to be a 500 rather than a 404, say so and 869 is amended;
   nothing in this task forecloses it.
3. **DECIDED, not open:** sanitising the CMS body is out (§3.6, trust boundary is `legal.manage`).
4. **UNKNOWN until I0:** whether the live `pages` table has a row with a non-empty body to look at. It held exactly
   one row on 2026-09-21 (867 F22). This affects only the owner's O79-5 visual pass, never the Story, which uses
   fixtures.

## 6. Pre-read rule bundle

- `docs/golden-rules.md` — **GR-0, GR-1, GR-2, GR-3, GR-3a in full**, plus GR-4…GR-6.
- `docs/agent-contract.md` — clauses 9, 10, 11, 14, 16, 16a, **16b, 16c, 16d in full**.
- `docs/rule-index.md` → "UI / Layout / Component", "Storybook / Visual Proof", "Regression / Critical Flow Coverage".
- `docs/qa-profiles.md` — the `Q3` row, "UI evidence routing", "Viewport policy".
- `docs/mantine-responsive-design-system.md` — responsive props and the token path.
- `docs/tailadmin-style-reference.md` — the typography rows at `:409-:421` for the title/body contract.
- `docs/component-rules.md` — the container/presentational split.
- `docs/storybook-governance.md` — canonical title scope and the toolbar locale/viewport mechanism.
- This kickoff's sprint plan, and Task 867's kickoff §3.1 (F5) for the defect's history.

Do not read the DB/RLS bundle: 869 changes no query predicate, no policy and no grant.

## 7. Scope

Files the executor may create or change:

- `src/app/[locale]/[slug]/page.tsx` — error binding + logging (R1, R2) and the view extraction (R3); nothing else
- `src/modules/cms/components/CmsPageView.tsx` *(new)*
- `src/stories/patterns/mantine/CmsPageView.stories.tsx` *(new)*
- `src/app/[locale]/[slug]/__tests__/page.errors.test.ts` *(new)*
- `src/app/globals.css` — the single `--width-content` line and its comment (R4)
- `scripts/mantine-migration-scope.json` — one added path (R7)
- `docs/sessions/2026-09-2*-task869-*.md` and `docs/sessions/evidence/task869/**`
- `docs/backlog.md` — the 869 row's state only

## 8. Out of scope

- `scripts/surface-census-baseline.json` — **do not edit it.** The route node's block is still correct after this
  task (G14/G15: route files are never enrolled), and the new node must produce no block at all. An edit here is a
  finding, not a fix.
- The `pages` grant, the `pages_select_public` policy, the Footer allowlist, `upsertFooterContent`, and the
  `sq_body_required` guard — all of these are **867**. Do not touch them.
- Sanitising `dangerouslySetInnerHTML` (§3.6).
- Adding `@tailwindcss/typography`, an `@plugin` directive, or any replacement typography CSS. The classes are
  deleted; nothing takes their place except `TypographyStylesProvider`.
- Any other `--width-*`, `--bp-*` or theme token; any change to `.container-wide` / `.container-admin`.
- `messages/*.json` — no key is added, removed or reworded.
- Throwing, rethrowing, or adding an error boundary (§5.2).

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Published page, happy path | 200 with title + body | 200 with title + body — visually equivalent layout at the same 768px measure, now theme-driven |
| CMS body styling | `prose prose-neutral dark:prose-invert` emit **no CSS** (G8-G10); body renders browser-default | `TypographyStylesProvider`, styled from the project theme |
| `pages` query returns `42501` | `notFound()`, nothing logged anywhere | `console.error('CmsSlugPage: pages query failed', { error, slug, locale })`, then `notFound()` — same HTTP outcome, no longer silent |
| `generateMetadata` query errors | `return {}`, nothing logged | logged with its own prefix, then `return {}` |
| Genuinely missing / unpublished / reserved slug | `notFound()` | `notFound()` with **no** error log — unchanged, and now provably distinct |
| Invalid locale segment | `notFound()` | unchanged |
| `sq` fallback both-empty branch | `notFound()` | unchanged |
| Route file `className` count | 3 | 0 |
| GR-1 census of the surface | 1 node, `manifest:no story:no className:3`, FAIL (baselined) | 2 nodes: the route `manifest:no story:no className:0` (same baselined block), `CmsPageView` `manifest:yes story:yes` and no new block |

## 10. Implementation requirements

1. **I0, before any write.** Re-run the §3.3 census; re-run the `@plugin` and `typography` greps; confirm
   `scripts/mantine-migration-scope.json` still has zero `src/app` entries. Record all four in the session evidence.
   A contradiction stops the task.
2. **Order — the hierarchy is blocking (16c).** `CmsPageView` and its Story are created and proven **before** the
   route consumes it. Do not edit `page.tsx`'s markup first and retrofit a Story.
3. **The split is data-only.** `CmsPageView` receives strings. Locale resolution, the `sq` fallback, the
   both-empty check and every `notFound()` decision stay in the route. The component makes no branch that decides
   whether a page exists.
4. **R5's mock idiom is copied, not invented.** Read `src/app/api/cron/listing-activity/__tests__/route.test.ts`
   first. Mock `@/lib/supabase/server`'s `createClient`, `next/navigation`'s `notFound`, and `next-intl/server`'s
   `setRequestLocale`. Spy on `console.error`; assert call **count**, not only truthiness, so arm (b) can fail.
5. **Zero raw visual values.** Every spacing value is a theme scale token (`md` = 16px, `2xl` = 32px, `3xl` = 48px,
   `theme.ts:544-554`), the width is `var(--width-content)` (R4), and the `md` responsive step is Mantine's
   `breakpoints.md = 48em = 768px` (`theme.ts:519`) — the same 768px Tailwind's `md:` used, so `py-8 md:py-12`
   becomes `py={{ base: '2xl', md: '3xl' }}` with no change in behaviour. If a value appears to need a number, stop.
6. **Encoding.** New files are UTF-8 without BOM. Never round-trip a source file through PowerShell
   `Get-Content -Raw` without `-Encoding utf8`; use Node `fs` for any read-modify-write.
7. **No probe Stories.** The Story documents the real production component's states. Do not add markup that exists
   only to make a gate fire.

## 11. Positive and negative flows

**Positive.** A published page with an Albanian title and body is requested anonymously at `/en/<slug>`. The route
reads it, passes two strings to `CmsPageView`, and the page renders at a 768px measure with theme-driven typography.
Nothing is logged. In Storybook, `Patterns/Mantine/CmsPageView` renders the same component across the locale and
viewport toolbars.

Story states (R7): title + body · title only · body only · a long-locale (`uk`) title that must wrap · a body
containing `h2`, `p`, `ul`, `a` and a long unbroken string.

| Negative flow | Applicable | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| `pages` query returns `42501` | **Yes** | R1 | One `console.error` with the R1 message, then 404 | AC5 arm (a) |
| `pages` query returns a transport error | **Yes** | R1 | Same as above — the log carries the code, the route does not branch on it | AC5 arm (a) |
| Query succeeds, no row | **Yes** | R1/R5 | 404, **zero** `console.error` calls | AC5 arm (b) |
| `generateMetadata` query errors | **Yes** | R2 | One `console.error` with its own prefix, then `{}` | AC5 |
| Reserved slug | **Yes** | existing guard, unchanged | 404 before any query; no log | AC5 |
| Invalid locale segment | **Yes** | existing guard, unchanged | 404 | AC5 |
| `content` is null / both-empty `sq` fallback | **Yes** | existing guards, unchanged | 404, no log (not an error) | AC5 |
| Body with a very long unbroken token | **Yes** | R6 Story state | Wraps inside the measure; no horizontal page scroll at 320px | AC4 |
| Validation | No | The route validates nothing; 867 owns write-side validation | N/A | — |
| Authorization/RLS | No | 869 changes no predicate, grant or policy | N/A | — |
| Concurrent writer | No | Read-only route | N/A | — |
| Offline/network | No | Covered by the transport-error row above | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — Given `git --no-optional-locks diff -- "src/app/[locale]/[slug]/page.tsx"`, when read, then both
  queries bind `error`, each has exactly one `console.error` call with the message string named in R1/R2 and a
  context object containing `error`, `slug` and `locale`, and no `notFound()` / `return {}` decision in the file has
  changed.
- **AC2 [R3, R7]** — Given `node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx"`,
  when run, then it prints **2 nodes**; the route node reads `manifest:no story:no className:0`; the `CmsPageView`
  node reads `manifest:yes story:yes`; and `node.exe scripts\check-surface-census-changed.mjs --base HEAD` exits 0
  with no new blocking node and no baseline edit in the diff.
- **AC3 [R3, R4, R6]** — Given `src/modules/cms/components/CmsPageView.tsx`, when read, then it contains zero
  `className` attributes, zero `style` objects and zero raw px/rem/hex visual literals; its max width is
  `var(--width-content)`; and `Select-String -Path src\app\globals.css -Pattern '^\s*--width-content\s*:'` returns
  exactly one matched line, quoted in the report.
- **AC4 [R6, R8]** — Given the Storybook build and the owner matrix of §13.3, when the `Patterns/Mantine/CmsPageView`
  states are opened, then each of the five states renders at every required width with no horizontal page scroll at
  320px, and the body's `h2`/`p`/`ul`/`a` are visibly styled rather than browser-default. Owner-recorded.
- **AC5 [R1, R2, R5]** — Given `npm.cmd run test -- "src/app/[locale]/[slug]/__tests__/page.errors.test.ts"`, when
  run, then every case passes, **including the arm that asserts `console.error` was called zero times for a genuine
  miss**. Quote the per-test names in the report.
- **AC6 [R3, R4, R6, R7, R8]** — Given the §13.2 gate block, when run, then `check:design-tokens`,
  `check:story-coverage`, `check:rendered-scope`, `check:pattern-enrolment`, `check:i18n`, `check:i18n-hardcode`,
  `check:locale-leak`, `check:file-integrity`, `check:mojibake`, `typecheck` and `lint` each exit 0, and
  `check:story-coverage` reports `CmsPageView` as covered by its own Story.
- **AC7 [scope]** — Given `git --no-optional-locks diff --stat`, when read, then the changed paths are exactly those
  listed in §7, none of the §8 paths appears, and `messages/` and `scripts/surface-census-baseline.json` are absent.
- **AC8 [R1…R8]** — Given `npm run build`, when run for the final diff, then it exits 0 and its transcript is
  retained under `docs/sessions/evidence/task869/`, together with `git hash-object` of every changed file captured in
  the same pass.

## 13. QA profile and verification plan

**Q3 Full Visual Matrix.** Selected because R3/R6 migrate a page view and R7 creates a new canonical Mantine Story —
`docs/qa-profiles.md` names "New or migrated Mantine primitive, … page shell" as the `Q3` trigger. Not `Q4`: 869
changes no grant, policy, predicate or write path, and touches no `docs/critical-flow-registry.md` row.

### 13.1 I0 — measurement before any write

```powershell
node.exe -p process.platform
node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx"
Select-String -Path src\app\globals.css -Pattern '^@plugin'
Select-String -Path package.json -Pattern 'typography'
node.exe -e "const m=require('./scripts/mantine-migration-scope.json');console.log('src/app entries:',m.filter(p=>p.startsWith('src/app')).length)"
```

Expected: `win32`; `GR-1 CENSUS BLOCKED` with 1 node `className:3`; no `@plugin` match; no `typography` dependency
match; `src/app entries: 0`. Return all five outputs. Any deviation → `TASK SPECIFICATION CONTRADICTION`, stop.

### 13.2 Final gate block

```powershell
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- "src/app/[locale]/[slug]/__tests__/page.errors.test.ts"
npm.cmd run check:design-tokens
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:pattern-enrolment
npm.cmd run check:i18n
npm.cmd run check:i18n-hardcode
npm.cmd run check:locale-leak
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx"
node.exe scripts\check-surface-census-changed.mjs --base HEAD
npm.cmd run build
git --no-optional-locks hash-object "src/app/[locale]/[slug]/page.tsx" src/modules/cms/components/CmsPageView.tsx src/stories/patterns/mantine/CmsPageView.stories.tsx "src/app/[locale]/[slug]/__tests__/page.errors.test.ts" src/app/globals.css scripts/mantine-migration-scope.json
git --no-optional-locks diff --stat
```

Every command exits 0; the census prints 2 nodes in the AC2 shape; `build` exits 0. Return the full transcript and
the hash list. A failed or unrun `build` permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

### 13.3 OWNER VISUAL QA REQUIRED — O79-5

```powershell
npm.cmd run storybook
```

Then, in the browser, open `Patterns/Mantine/CmsPageView` and record **accepted** or **returned with a concrete
visual defect** for each tuple:

1. `Default` (title + body) × `sq` / `en` / `uk` / `it` × 320 / 390 / 768 / 1440
2. `TitleOnly` × `en` × 320 / 1440
3. `BodyOnly` × `en` × 320 / 1440
4. `LongTitleWrap` × `uk` × **320** (mandatory cell)
5. `RichBody` (h2/p/ul/a + long unbroken token) × `en` × 320 / 768 / 1440

No automated screenshot verdict substitutes for this review (`screenshots:assert` is retired, owner decision
2026-09-03).

## 14. Completion report contract

Report, in this order: changed files (a table matching the real diff); requirement IDs completed; every command of
§13.1 and §13.2 with its **actual** exit code and the quoted lines the ACs name; the two census outputs before and
after; the quoted `--width-content` definition line; the per-test names of the R5 suite including the zero-call arm;
the `git hash-object` list; assumptions; deviations; known limitations; unresolved issues; and the evidence paths
under `docs/sessions/evidence/task869/`.

Emit, in the report, the `GR-0`, `GR-1`, `GR-2`, `GR-3`, `GR-3a` receipts for the work as executed.

Status must be `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval,
no review verdict, no mutating git. Update the 869 row of `docs/backlog.md` with concise state only, and write the
session log under `docs/sessions/`.

## 15. Task quality gate

- Executable by a fresh Sonnet session with no chat context: yes — every fact carries a path and a line, and every
  command is a paste-ready block.
- Every requirement has a binary AC and a verification method: yes (R1→AC1/AC5, R2→AC1/AC5, R3→AC2/AC3/AC6,
  R4→AC3/AC6, R5→AC5, R6→AC3/AC4/AC6, R7→AC2/AC6, R8→AC4/AC6; all → AC7/AC8).
- Scope protects existing behavior and names what must not change: §8 and the §9 table, which pins every
  `notFound()` decision as unchanged.
- No absolute acceptance criterion: confirmed by the `GR-4 AC AUDIT` receipt in §4.
- No uninspected claim: every fact in §3 was read in this session; the census and the platform check were run
  natively on `win32`, Node `v22.22.3`.
- Exactly one active route; the 500-vs-404 alternative is recorded as a non-blocking owner note, not a second branch
  for Sonnet (§5.2).
- Storybook gate: `CREATE` with a zero-candidate `GR-3a` receipt; the Story is permanent and documents a real
  in-scope production consumer, not a gate probe.
- Sprint assignment: Sprint 79, the sprint whose own plan text names this defect (*"The 404 is silent by
  construction"*); the plan's "Explicitly not in this sprint" line is amended in the same edit as this kickoff.

---

**FACTS:** G1-G20 above, each with a path and line, measured 2026-09-23 in this session.
**INFERENCES:** that the migration is forced rather than chosen (G12+G13+G14 → editing the file requires GR-1
compliance, and the baseline suppresses only the CI signal); that `py-8 md:py-12` → `py={{ base: '2xl', md: '3xl' }}`
is behaviour-identical (theme `md` = 48em = Tailwind `md` = 768px, and the two spacing tokens equal 32/48px).
**UNKNOWNS:** whether the live table yet holds a page with a non-empty body for the owner's O79-5 pass (867's O79-0).
**CONFLICTS:** None.

Task path: `tasks/Sprints/Sprint_79_kickoff_prompt_Task_869_CMS_Route_Error_Surfacing_And_View_Migration.md`
QA profile: `Q3`. Ambiguous or conflicting requirements: none. Owner decision still needed: none blocking — only the
non-blocking 500-vs-404 note in §5.2.
