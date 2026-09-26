# Task 869 — the CMS route stops swallowing its read error, and its view leaves dead Tailwind

Sprint 79 · P1 · QA profile **Q3** (migrated page view + new canonical Mantine Story) · sequenced after **867** ·
owner action **O79-5** · **Status: `PARTIALLY VERIFIED` 2026-09-26 (review 6) — all executor work accepted; approval waits only on the owner's O79-5, §21** (review 5: §20; review 4: §19; review 3: §18; review 2: §17; review 1, 2026-09-25: §16)

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

---

## 16. Revision 1 — review 2026-09-25 (`NEEDS REVISION`)

**The implementation is accepted as it stands.** R1–R8 match the diff:
- both queries bind `error` and log with the R1/R2 prefixes before an unchanged `notFound()` / `return {}`;
- `CmsPageView` is a server component with 0 `className`, `maw="var(--width-content)"`, `TypographyStylesProvider`;
- `--width-content: 48rem` sits beside `--width-page-max`, and the manifest has one added path;
- the Story exports `Default`, `TitleOnly`, `BodyOnly`, `LongTitleWrap`, `RichBody`;
- the R5 suite has both arms (4/4).

Recorded gate results: census after = 2 nodes in the AC2 shape; `check:surface-census:changed`, the story, i18n,
token, integrity and pattern gates, `typecheck`, `lint` and `build` all exit 0. The reviewer measured all six
blobs equal to `13.2-hash-object.log`. Two required artifacts are missing.

| # | Severity | Finding | Evidence |
|---|---|---|---|
| RF1 | P2 | **No session log.** §14 and agent-contract clause 10 require `docs/sessions/2026-09-2?-task869-*.md` with a "Files Changed" table matching the real diff. None exists. | `docs/sessions/` holds no `task869` file; only `docs/sessions/evidence/task869/` |
| RF2 | P2 | **`check:locale-leak` was not run.** AC6 lists it. No evidence file names it, and the §13.2 transcript set omits it. | `docs/sessions/evidence/task869/` (18 logs, none for `locale-leak`) |

### 16.1 Re-entry (evidence only)

**Mode: `remediation`. No source, Story, test, CSS or manifest file may change.** Their hashes must stay equal to
`13.2-hash-object.log`. Any change to them is a new finding.

```powershell
$ev = "docs\sessions\evidence\task869"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r1-platform.log"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\r1-build-storybook.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r1-build-storybook.log"
npm.cmd run check:locale-leak *>&1 | Tee-Object "$ev\r1-check-locale-leak.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r1-check-locale-leak.log"
git --no-optional-locks hash-object "src/app/[locale]/[slug]/page.tsx" src/modules/cms/components/CmsPageView.tsx src/stories/patterns/mantine/CmsPageView.stories.tsx "src/app/[locale]/[slug]/__tests__/page.errors.test.ts" src/app/globals.css scripts/mantine-migration-scope.json | Tee-Object "$ev\r1-hash-object.log"
```

Expected:
- `r1-build-storybook` and `r1-check-locale-leak` end `EXIT_CODE=0`. A locale leak reported for
  `Patterns/Mantine/CmsPageView` is a real finding: report it, do not patch around it.
- `r1-hash-object.log` equals `13.2-hash-object.log` line for line.

Normalise the `Tee-Object` files (UTF-16LE on Windows PowerShell 5.1) to UTF-8 without BOM through Node, line for
line.

**Then write the session log** `docs/sessions/2026-09-25-task869-cms-route-error-surfacing.md` containing:
- the §14 report: R1–R8 with evidence paths;
- a "Files Changed" table matching the real diff (the six files, plus `docs/backlog.md` and the evidence);
- the GR-0/GR-1/GR-2/GR-3/GR-3a receipts;
- the quoted `--width-content` definition line;
- the four R5 test names;
- the O79-5 matrix (§13.3) as owed.

Update the 869 cell of `docs/backlog.md` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (revision 1).

### 16.2 Unchanged by this review

- §3.6 and §8 still hold for 869: the executor does not sanitise the body.
- That work is now **Task 884** (filed 2026-09-25 by owner instruction), which runs after 869 and edits the same
  `CmsPageView` expression.
- O79-5 (owner visual matrix, §13.3) can run now against the current Story. *(Superseded by §17.2: run it after
  revision 2.)*

---

## 17. Revision 2 — review 2026-09-26 (`NEEDS REVISION`)

§16 is closed for RF1: the session log exists. RF2 is **not** closed, and review 2 found the reason. The route, the
view, the test, the CSS token and the manifest line are still accepted. Their hashes equal `13.2-hash-object.log`:

| File | Hash |
|---|---|
| `page.tsx` | `2ee5e364af8500a41699f0cc3b9b6feba0673514` |
| `CmsPageView.tsx` | `502a624b5e97220c43b5c5d49049a48866ef0148` |
| `page.errors.test.ts` | `bc11d062bb2b72df172d50aa222b6166c8cfcd1b` |
| `globals.css` | `ca6c3182bafa647a9ef631ac57db8787525e4776` |

**Only the Story is wrong.**

| # | Severity | Finding | Evidence |
|---|---|---|---|
| RF3 | P1 | **`RichBody` shows English text in every locale.** Its body is the English-only `RICH_BODY` constant, whatever the toolbar locale is. This breaks R8. §16.1 also said a leak in this Story "is a real finding". | Two independent scans each report **15** leaks in `Patterns/Mantine/CmsPageView/Rich Body`: 5 text nodes (`Section heading`, `A paragraph with`, `First item`, `Second item`, `A long unbroken token: …`) × `sq`/`uk`/`it` at `mobile-320`. The reports are `.screenshots/locale-leak/2026-09-25T21-05/report.json` (mantine-only, full, 236 scanned) and `…/2026-09-25T22-12/report.json` (mantine-only, fast). The source is `CmsPageView.stories.tsx:82-87` (the constant) and `:133-138` (`RichBody` renders it for every locale). |
| RF4 | P1 | **The "zero leaks from `CmsPageView`" claim is false. The run it cites never scanned the Story.** The session log's GR-2 receipt and `13.2-check-locale-leak.log` both make the claim. The later scans report CmsPageView leaks that do not depend on the run, but the cited run has no CmsPageView entry at all. | The cited run (`2026-09-25T18-04/report.json`) scanned 381 stories. It has **no** `CmsPageView` entry. The current `storybook-static/index.json` has 414 stories, including all 5 `patterns-mantine-cmspageview--*` ids. The scan reads its story list from `storybook-static/index.json` (`scripts/check-locale-leak.mjs:341-382`), and `storybook-static` was only rebuilt with the Story at 21:58 by `r1-build-storybook`. `13.2-check-locale-leak.log` is a hand-written summary with mtime 21:52. Review 1 was committed at 21:18, so the file was written after it, yet it is named as a first-pass §13.2 artifact. |
| RF5 | P2 | **No gate block covers the final diff.** The Story changed after the §13.2 block (`bcf08047…` → `7ab94704…`). The session log says `lint` and `typecheck` were re-run in `r1-*.log`, but no `r1-lint.log`, `r1-typecheck.log` or `r1-build.log` exists. `tsconfig.json` includes `**/*.tsx`, so `next build` type-checks the Story, which makes `13.2-build.log` stale. That breaks AC6 and AC8. | `docs/sessions/evidence/task869/` listing; `tsconfig.json` `include` |

**NOTE, not a finding.** §16.1 said the Story must not change, but the r1 rewrite changed it anyway. This revision
now puts that rewrite in scope. The tag helpers (`h2`/`p`/`ul`/`li`/`link`) stop `check-stories.mjs`'s per-line
`jsx-text-literal` scan from seeing any fixture text in this file. That hid RF3's true positives along with the
false ones. **For this Story, the rendered `check:locale-leak` scan is therefore the binding check, not
`check:stories`.** The helpers may stay.

### 17.1 Re-entry (mode: `remediation`)

**Write scope is exactly two things:**

1. `src/stories/patterns/mantine/CmsPageView.stories.tsx`
2. Evidence and state: `docs/sessions/2026-09-25-task869-cms-route-error-surfacing.md`,
   `docs/sessions/evidence/task869/**`, and the 869 cell of `docs/backlog.md`.

No other file may change. `page.tsx`, `CmsPageView.tsx`, `page.errors.test.ts` and `globals.css` must keep the hashes
in the table above.

**Shared-file warning.** `scripts/mantine-migration-scope.json` and `docs/backlog.md` also hold uncommitted Task 852
hunks from a concurrent session. Do not touch 852's lines. Prove 869's manifest line by content, not by the file hash
(see the `r2-manifest-diff.log` expectation in S2).

**S1 — Story fix (RF3).**

- Every Story whose visible text depends on the locale must take that text from the toolbar locale's `FIXTURES` entry.
- Move the rich-body content into each locale entry, e.g. a `richBody` field built with the same helpers. It must keep
  the §11 elements: `h2`, `p`, `ul`, `a`, and one long unbroken token.
- `RichBody` renders `fixture.richBody`.
- The long token may stay a URL. Its label text is localised like every other string.
- `LongTitleWrap` stays the fixed `uk` title (§13.3 cell 4).
- Do not add an entry to `check-locale-leak.mjs`'s `PER_STORY_TOKENS`, or to any other allowlist. Do not change any
  detector. If a leak remains that only an allowlist would silence, stop and report `BLOCKED` with the token.

**S2 — final gate block, one pass, after S1.** Run from the project root in Windows PowerShell. Each command writes
to its own `r2-*.log` and appends its own `EXIT_CODE`. Normalise the `Tee-Object` files to UTF-8 without BOM through
Node, as in §16.1.

```powershell
$ev = "docs\sessions\evidence\task869"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\r2-platform.log"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\r2-typecheck.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-typecheck.log"
npm.cmd run lint *>&1 | Tee-Object "$ev\r2-lint.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-lint.log"
npm.cmd run test -- "src/app/[locale]/[slug]/__tests__/page.errors.test.ts" *>&1 | Tee-Object "$ev\r2-test.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-test.log"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\r2-check-design-tokens.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-design-tokens.log"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\r2-check-story-coverage.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-story-coverage.log"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\r2-check-rendered-scope.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-rendered-scope.log"
npm.cmd run check:pattern-enrolment *>&1 | Tee-Object "$ev\r2-check-pattern-enrolment.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-pattern-enrolment.log"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\r2-check-i18n.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-i18n.log"
npm.cmd run check:i18n-hardcode *>&1 | Tee-Object "$ev\r2-check-i18n-hardcode.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-i18n-hardcode.log"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\r2-check-file-integrity.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-file-integrity.log"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\r2-check-mojibake.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-mojibake.log"
node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx" *>&1 | Tee-Object "$ev\r2-census.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-census.log"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\r2-build-storybook.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-build-storybook.log"
node.exe -e "const r=require('./storybook-static/index.json');const ids=Object.keys(r.entries).filter(k=>k.startsWith('patterns-mantine-cmspageview--')&&r.entries[k].type==='story');console.log('cms stories in index:',ids.length);ids.forEach(i=>console.log(i))" *>&1 | Tee-Object "$ev\r2-index-cms.log"
npm.cmd run check:locale-leak:mantine-only *>&1 | Tee-Object "$ev\r2-check-locale-leak.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-check-locale-leak.log"
node.exe -e "const fs=require('fs'),p='.screenshots/locale-leak';const d=fs.readdirSync(p).sort().pop();const r=JSON.parse(fs.readFileSync(p+'/'+d+'/report.json','utf8'));const c=r.leaks.filter(l=>l.storyLabel.startsWith('Patterns/Mantine/CmsPageView/'));console.log('report',d,'mode',r.mode,'mantineOnly',r.mantineOnly,'scanned',r.storiesScanned,'leakCount',r.leakCount,'cmsLeaks',c.length);c.forEach(l=>console.log(l.storyLabel,l.locale,l.viewport,l.token))" *>&1 | Tee-Object "$ev\r2-locale-leak-cms.log"
npm.cmd run build *>&1 | Tee-Object "$ev\r2-build.log"; "EXIT_CODE=$LASTEXITCODE" | Tee-Object -Append "$ev\r2-build.log"
git --no-optional-locks hash-object "src/app/[locale]/[slug]/page.tsx" src/modules/cms/components/CmsPageView.tsx src/stories/patterns/mantine/CmsPageView.stories.tsx "src/app/[locale]/[slug]/__tests__/page.errors.test.ts" src/app/globals.css | Tee-Object "$ev\r2-hash-object.log"
git --no-optional-locks diff -U0 -- scripts/mantine-migration-scope.json | Tee-Object "$ev\r2-manifest-diff.log"
git --no-optional-locks status --short | Tee-Object "$ev\r2-git-status.log"
```

**Expected output (the ACs in S3 bind on these):**

- **Commands that must exit 0.** `typecheck`, `lint`, `test` (4/4), every `check:*` except `locale-leak`,
  `build-storybook` and `build` each end `EXIT_CODE=0`.
- **Census.** `r2-census.log` shows the AC2 shape: 2 nodes, and exit 1 is expected for the baselined route block.
- **Index.** `r2-index-cms.log` prints `cms stories in index: 5`.
- **Locale-leak report.**
  - The `report` directory named in `r2-locale-leak-cms.log` must equal the `Output:` directory printed in
    `r2-check-locale-leak.log`. If a concurrent session wrote a newer report in between, the directories will not
    match: re-run the last two commands.
  - Its `cmsLeaks` must be **0**.
  - The aggregate `EXIT_CODE` of `check:locale-leak:mantine-only` is recorded, not required to be 0. The repo-wide red
    is pre-existing (Task 836). This is the scoped reading of AC6's `check:locale-leak` clause.
- **Hashes.** `r2-hash-object.log`'s lines 1, 2, 4 and 5 equal the table in §17. Line 3 is the new Story hash.
- **Manifest diff.** `r2-manifest-diff.log` contains exactly one `+  "src/modules/cms/components/CmsPageView.tsx",`
  line. Any other `+` lines there are 852's; name them as such.

**S3 — acceptance for this revision.**

- **AC6-r2.** `r2-locale-leak-cms.log` shows `cmsLeaks 0`, from a report whose directory matches the run's `Output:`
  line, taken after `r2-index-cms.log` showed 5 CmsPageView stories.
- **AC8-r2.** `r2-build.log` ends `EXIT_CODE=0` in the same pass as `r2-hash-object.log`.

**S4 — session log and state.**

1. Correct the session log. Mark `13.2-check-locale-leak.log`, `r1-check-locale-leak.log` and every `r1-*` gate log
   as **superseded by `r2-*`**.
2. Delete the "0 attributable" claim and the GR-2 receipt built on it.
3. Write a new `GR-2 SCOPE STATED` receipt. It must name the index check as the evidence that the scan saw the Story.
4. Update the "Files Changed" table.
5. Record the Story hash change and RF3's fix.
6. Set the 869 cell of `docs/backlog.md` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (revision 2).

### 17.2 Unchanged by this review

- R1–R7 and AC1–AC3, AC5 and AC7 stay accepted on the hashes above.
- AC4 is still the owner's O79-5 matrix (§13.3). **Run O79-5 after revision 2**, because the `RichBody` content changes.
- §3.6 and §8 still hold. Sanitisation is Task 884.
- **Note for the approval handoff (Opus).** `scripts/mantine-migration-scope.json` and `docs/backlog.md` are shared with
  Task 852's uncommitted work. The approval handoff must reconcile them hunk by hunk, or run after 852 is committed.

---

## 18. Review 3 — 2026-09-26 (`PARTIALLY VERIFIED`)

**No executor action remains.** RF3 and RF5 are closed:
- `CmsPageView.stories.tsx` (hash `8c5f731a28647e69f0e46e5c63857b48deaa26cd`) keys `richBody` per locale in `FIXTURES`,
  and `RichBody` renders `fixture.richBody`;
- the Story has no decorator, `style` object, fixed-width container or `globals.viewport` pin (GR-3b);
- the §17.1 S2 block is present as `r2-*.log`: `typecheck`, `lint`, `test` 4/4, `build-storybook` and `build` all exit 0;
- `r2-index-cms.log` lists 5 CmsPageView stories;
- `r2-hash-object.log` lines 1, 2, 4 and 5 equal the §17 table;
- `r2-manifest-diff.log` has exactly one 869 line (the other four `+` lines are 852's).

`check:i18n-hardcode` exit 1 is not 869's. Both new findings are 852's `AdminHeader.tsx:53` and `AdminSidebar.tsx:92`.

**AC6-r2 — owner decision, 2026-09-26, verbatim:** *"зупини check:locale-leak:mantine-only , я сам візуально
перевірю все."*

The official scan never produced a report: six executor attempts, and one reviewer run stopped by the owner. By this
decision, the owner's O79-5 visual pass replaces that scan as the evidence for AC6-r2. So O79-5 (§13.3) now also covers
this cell:

6. `RichBody` × `sq` / `uk` / `it` × 320. Record **accepted** if no English fixture text is shown, or **returned**
   with the exact English string seen.

**Approval condition.** The owner records O79-5 as accepted for every §13.3 tuple and for cell 6 above. Opus then
approves without a further executor pass.

**P3 for the approval closure.** The session log still carries the revision-1 GR-2 receipt ("0 matches") without a
superseded mark. It also records the status as `PARTIALLY IMPLEMENTED`, while the executor's report said
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Opus corrects both in the approval closure.

*(Superseded by §19. O79-5 was returned, so the approval condition above no longer applies.)*

---

## 19. Revision 3 — review 4, 2026-09-26 (`NEEDS REVISION`, owner returned O79-5)

**Owner verdict, 2026-09-26, verbatim:** *"не приймаю. Шрифти не адаптивні, на мобільних екранах вони просто
величезні. Це тупо хардкод!"*

The route, test, CSS token and manifest line stay accepted, and so does the Story. **Only the view's typography is
wrong.**

| # | Severity | Finding | Evidence |
|---|---|---|---|
| RF6 | P1 | **The page title has one fixed size at every width.** `<Title order={1} size="h3">` resolves to `var(--mantine-h3-font-size)`, which is 30px at 320px. | `CmsPageView.tsx:23`; `theme.ts:583` (`h3: 1.875rem`), a single value with no breakpoint |
| RF7 | P1 | **The rich-text headings use the fixed theme scale, and a body heading is larger than the page title at every width.** Mantine's Typography CSS sets `h2 { font-size: var(--mantine-h2-font-size) }`. That is 36px at 320px and at 1440px, while the page title is 30px. | `node_modules/@mantine/core/styles/Typography.css` (`.m_d08caa0 :where(h2)`); `theme.ts:582` (`h2: 2.25rem`) |
| RF8 | P1 (orchestrator) | **The kickoff never specified a type scale.** §3.4's token path and §10.5's "zero raw visual values" covered spacing and width only, so the executor followed the kickoff exactly. This rule gap is now closed by **GR-3c** (`docs/golden-rules.md`), and its gate is in `create-task`, `execute-task` and `review-task`. | §3.4, §10.5 of this file |

### 19.1 Type-scale table (GR-3c) — binding

Every size here is an **existing theme key**, and no new value is introduced. Pixel sizes: `md` 16, `h6` 18, `h5` 20,
`h4` 24, `h3` 30 (`theme.ts:581-586`, `:634-640`). Breakpoints: `sm` 40em = 640px, `md` 48em = 768px
(`theme.ts:566-567`).

| Element | Role | base (<640) | sm (640–767) | md+ (≥768) | Provenance |
|---|---|---|---|---|---|
| Page title (`Title order={1}`) | page title | `h5` 20 | `h4` 24 | `h3` 30 | legacy `docs/ui-rules.md` "Responsive Typography Rules" (`text-xl sm:text-2xl`, 20→24); the ≥768 size keeps the current desktop 30px; same 20/24/30 steps as the owner-accepted `SECTION_HEADING_FZ` (Task 699) |
| Rich-text `h1`, `h2` | rich-text heading | `h6` 18 | `h5` 20 | `h4` 24 | GR-3c: always one rung below the page title |
| Rich-text `h3` | rich-text heading | `md` 16 | `h6` 18 | `h5` 20 | one rung below `h2` |
| Rich-text `h4`, `h5`, `h6` | rich-text heading | `md` 16 | `md` 16 | `h6` 18 | one rung below `h3`, floored at body size |
| Rich-text `p`, `li`, `a` | body | `md` 16 | `md` 16 | `md` 16 | Typography default; unchanged |

Each font-size is paired with the **same rung's** line-height: `var(--mantine-hN-line-height)` for an `hN` rung, and
`var(--mantine-line-height-md)` for `md`. Font weights are unchanged.

*These rich-text rungs are the orchestrator's choice from existing theme keys, under GR-3c's limits. The owner
confirms them at O79-5.*

### 19.2 Re-entry (mode: `remediation`)

**Write scope is exactly these files:**

1. `src/modules/cms/components/CmsPageView.tsx`: the title becomes `<Title order={1} fz={{ base: 'h5', sm: 'h4', md: 'h3' }} mb="xl">`. `size="h3"` is removed. Nothing else changes.
2. `src/design-system/mantine/typography-chrome.css` *(new)*: the canonical responsive rich-text scale of §19.1.
   - Selectors: `.mantine-Typography-root :where(h1, h2)`, `:where(h3)` and `:where(h4, h5, h6)`, with the base rung
     first and then `@media (min-width: 40em)` and `@media (min-width: 48em)`. That is the same media-query form as
     `notification-chrome.css:31`.
   - Values are `var(--mantine-…)` references only, never px/rem.
   - Header comment: cite GR-3c and this §19.1.
   - Do **not** redefine the `--mantine-hN-*` custom properties themselves. A remap on the same element would resolve
     against itself, so set `font-size`/`line-height` on the descendant selectors instead.
3. `src/app/layout.tsx`: one `import '@/design-system/mantine/typography-chrome.css'` line, after the existing chrome
   imports (`:9-15`) and after `@mantine/core/styles.css`.
4. `.storybook/preview.tsx`: the same import beside the other chrome imports (`:13-18`).
5. Evidence and state: the session log, `docs/sessions/evidence/task869/r3-*`, and the 869 cell of `docs/backlog.md`.

**Must stay unchanged** (hashes as in §17 and §18): `page.tsx` `2ee5e364…`, `page.errors.test.ts` `bc11d062…`,
`globals.css` `ca6c3182…`, and `CmsPageView.stories.tsx` `8c5f731a…`.

**Stop conditions:**
- **I0: verify the static class.** Open `Patterns/Mantine/CmsPageView--rich-body` and confirm that the body wrapper
  element carries `mantine-Typography-root`. If it does not, report `TASK SPECIFICATION CONTRADICTION` with the class
  it does carry, and stop.
- **Allowlists.** If `check:design-tokens` flags the new file, stop with `BLOCKED` and quote the finding. Do not add
  an allowlist entry.
- **Other consumers.** If any other `TypographyStylesProvider` / `Typography` consumer exists (`grep -rn "Typography" src --include=*.tsx`),
  list it. Do not change it. The scale applies to it too, which is intended.

### 19.3 Final gate block (one pass, after 19.2)

Run it as in §17.1 S2 (Windows PowerShell, `Tee-Object`, `EXIT_CODE` appended, then normalised to UTF-8 without BOM
through Node), with these changes:
- use the `r3-` log prefix;
- add `src/design-system/mantine/typography-chrome.css`, `src/app/layout.tsx` and `.storybook/preview.tsx` to the
  `hash-object` line;
- drop the two locale-leak commands. Owner decision, 2026-09-26: *"я сам візуально перевірю все"*, recorded in §18.

After `build-storybook`, measure computed font sizes. Use a throwaway Playwright probe under the gitignored
`.artifacts/` folder, against `storybook-static`, and never commit it. For the `en` locale, cover:
- `default`, `rich-body` and `title-only` at 320, 390, 768 and 1440;
- `long-title-wrap` at 320.

At each tuple, record `getComputedStyle(el).fontSize` for the title `h1` and for the body `h2`, `p` and `li`. Write
it to `r3-type-measure.log`, one line per tuple.

### 19.4 Acceptance for this revision

- **AC9 [RF6, RF7] — the measured values match the §19.1 table exactly.**
  - `r3-type-measure.log` shows a title of 20px at 320 and 390, and 30px at 768 and 1440.
  - It shows a body `h2` of 18px at 320 and 390, and 24px at 768 and 1440.
  - `p` and `li` are 16px everywhere.
  - At every tuple, the body `h2` is smaller than the title.
- **AC10 [RF6].** `CmsPageView.tsx` has no static `size=`/`fz=` on the title. `typography-chrome.css` contains no
  px/rem literal outside comments.
- **AC8-r3.** `r3-build.log` and `r3-build-storybook.log` end with `EXIT_CODE=0`, in the same pass as
  `r3-hash-object.log`.
- Every other `r3-` gate exits 0, with one exception. `check:i18n-hardcode` may exit 1 only for findings outside 869's
  files; name each of those findings.
- **Receipts.** Emit `GR-3c TYPE RESPONSIVE CHECK` for `default`, `rich-body`, `title-only` and `long-title-wrap`.
  Emit `GR-3b STORY RESPONSIVE CHECK` for the Story. Emit `GR-0` for the new CSS file, with decision `EXTEND`: the
  canonical owner is the design-system chrome-CSS family.
- **Session log.** Record revision 3, and fix the two §18 P3 items: mark the old GR-2 receipt as superseded, and make
  the status line match the handoff. Set the 869 cell of `docs/backlog.md` to
  `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (revision 3).

**Then O79-5 runs again**, with the full §13.3 matrix plus §18 cell 6. *(Superseded by §20: run it after revision 4.)*

---

## 20. Revision 4 — review 5, 2026-09-26 (`NEEDS REVISION`)

**Revision 3 is accepted.** These match §19:
- `CmsPageView.tsx:23` has `fz={{ base: 'h5', sm: 'h4', md: 'h3' }}`;
- `typography-chrome.css` implements §19.1 using `var(--mantine-…)` references only;
- `layout.tsx` and `preview.tsx` each gain exactly one import line, loaded after `@mantine/core/styles.css`;
- the hashes of `page.tsx`, the test, `globals.css` and the Story are unchanged.

The reviewer's own `getComputedStyle` measurement matches §19.1 in every band, including 640px, which
`r3-type-measure.log` did not cover:

| Width | Title | Rich-text `h2` | `p` |
|---|---|---|---|
| 320 | 20px | 18px | 16px |
| 640 | 24px | 20px | 16px |
| 1440 | 30px | 24px | 16px |

The same values hold for `rich-body` in `en` and `uk`, and for `default` in `sq`.

| # | Severity | Finding | Evidence |
|---|---|---|---|
| RF9 | P1 | **A long unbroken token in the CMS body scrolls the whole page horizontally, at every width.** In `RichBody`, the 120-character URL does not wrap and runs out of its `<p>`. This breaks the §11 negative flow (*"Wraps inside the measure; no horizontal page scroll at 320px"*) and AC4. Real CMS content with a long URL does the same on the public route. | Reviewer probe against `storybook-static`, `rich-body`, `en`/`uk`: `document.documentElement.scrollWidth` is **1260** at a 320 viewport and **1580** at 1440. No element box exceeds the viewport, so the overflow is inline text. `default`/`sq`: no overflow. Neither Mantine's `Typography.css` nor `typography-chrome.css` sets `overflow-wrap`/`word-break`. |
| RF10 | P2 | **The GR-3b receipt omits the overflow measurement GR-3b requires.** It checks the Story source (no decorator, style or pin) but records no `overflow` result per width. The session log lists the unwrapped token as a known limitation *"left for O79-5 to judge"*. GR-3b requires the executor to measure and report `overflow: none`, not defer it to the owner. | session log, the `GR-3b STORY RESPONSIVE CHECK` line and the "Assumptions, deviations, and limitations" bullet on `LongTitleWrap`/`RichBody`; `docs/golden-rules.md` GR-3b |
| RF11 | P2 (orchestrator) | **The kickoff made the fix impossible.** §8 forbade *"any replacement typography CSS"*, while §11 required the token to wrap. That was a scope contradiction in the kickoff. Since §19, 869 owns `typography-chrome.css`, the canonical rich-text chrome, so the wrapping rule belongs there. | §8, §11 of this file |

### 20.1 Re-entry (mode: `remediation`)

**§8 is amended for one declaration.** The canonical rich-text chrome may carry the body's wrapping rule. §8's ban on
`@tailwindcss/typography`, `@plugin` and any other replacement typography CSS still holds.

**Write scope is exactly this:**
1. `src/design-system/mantine/typography-chrome.css`: add one rule before the heading rules, with a comment that cites
   §11 and this §20:

   ```css
   .mantine-Typography-root {
     overflow-wrap: anywhere;
   }
   ```

   Use `anywhere`, not `break-word`. `anywhere` also lowers the min-content width, so the body cannot force its
   container wider in a flex or grid parent. No other declaration changes.
2. Evidence and state: the session log, `docs/sessions/evidence/task869/r4-*`, and the 869 cell of `docs/backlog.md`.

**Must stay unchanged:**

| File | Hash |
|---|---|
| `page.tsx` | `2ee5e364…` |
| `CmsPageView.tsx` | `6863f474…` |
| `CmsPageView.stories.tsx` | `8c5f731a…` |
| `page.errors.test.ts` | `bc11d062…` |
| `globals.css` | `ca6c3182…` |
| `layout.tsx` | `48cc96e7…` |
| `.storybook/preview.tsx` | `f066f692…` |

### 20.2 Final gate block (one pass, after 20.1)

Run it as in §17.1 S2 (Windows PowerShell, `Tee-Object`, `EXIT_CODE` appended, normalised to UTF-8 without BOM
through Node), using the `r4-` log prefix and only these commands:
- `check:design-tokens`, `check:file-integrity`, `check:mojibake`, `build-storybook` and `build`;
- `git hash-object` of the eight files in 20.1;
- `git --no-optional-locks status --short`.

Then extend the throwaway `.artifacts/` probe to write `r4-measure.log`, one line per tuple:
- **Stories:** all 5 `patterns-mantine-cmspageview--*`.
- **Locales:** `en` and `uk`.
- **Widths:** 320, 390, 640, 768, 1024 and 1440.
- **Record, per tuple:**
  - `document.documentElement.scrollWidth` and `innerWidth`;
  - the title's computed `fontSize`;
  - the body `h2`, `p` and `li` computed `fontSize`.

### 20.3 Acceptance for this revision

- **AC11 [RF9].** `r4-measure.log` shows `scrollWidth <= innerWidth` at every tuple, including `rich-body` at 320.
- **AC12 [§19.1].** In the same log, every font size equals §19.1. The 640 tuples show title 24px and body `h2` 20px.
- **AC8-r4.** `r4-build.log` and `r4-build-storybook.log` end with `EXIT_CODE=0`, in the same pass as
  `r4-hash-object.log`. The other hashes equal the table in 20.1.
- **Receipts.**
  - `GR-3b STORY RESPONSIVE CHECK` for each of the 5 Stories, with the **measured** `overflow` at 320/390/1024/1440
    (RF10).
  - `GR-3c TYPE RESPONSIVE CHECK` for each of the 5 Stories.
- **Session log.** Record revision 4. Delete the "left for O79-5" limitation bullet and replace it with the measured
  result. Set the 869 cell of `docs/backlog.md` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (revision 4).

**Then O79-5 runs**: the §13.3 matrix plus §18 cell 6.

---

## 21. Review 6 — 2026-09-26 (`PARTIALLY VERIFIED`)

**No executor action remains.** RF9 and RF10 are closed:
- `typography-chrome.css` (hash `b29d2ad4…`) adds only `.mantine-Typography-root { overflow-wrap: anywhere; }`;
- the seven other hashes equal the table in §20.1;
- `r4-*`: `check:design-tokens`, `check:file-integrity`, `check:mojibake`, `build-storybook` and `build` all exit 0;
- `r4-measure.log` has 60 tuples, with `scrollWidth == innerWidth` in every one, and every size equals §19.1;
- the session log carries measured GR-3b/GR-3c receipts.

The reviewer's own probe, on `rich-body` in `en` and `sq` at 320 / 640 / 1440, measured no overflow. Font sizes:

| Width | Title | Body `h2` | `p` |
|---|---|---|---|
| 320 | 20px | 18px | 16px |
| 640 | 24px | 20px | 16px |
| 1440 | 30px | 24px | 16px |

**Approval condition.** The owner records O79-5 as accepted for the §13.3 matrix plus §18 cell 6. Opus then approves and archives with no further executor pass. The §18 P3 session-log items were fixed in revision 3.
