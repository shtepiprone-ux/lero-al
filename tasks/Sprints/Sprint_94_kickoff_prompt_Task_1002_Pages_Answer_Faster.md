# Task 1002 — Pages answer faster: functions next to the database, a loading state on every click, and no unused text or prefetch storm

Sprint 94. Priority P1. Owner decision: owner list item 29 (2026-11-19, translated): "Optimisation must be set up, because
pages on the site and in the admin now respond very slowly. Find out the cause and fix it." Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

Measured 2026-11-19 on production: a page needs 0.2-0.5 s on the server against 0.04 s for a static file, a click shows
nothing until that answer arrives, every page carries the whole text catalogue of its language (the admin and Storybook
texts included), and the first click in the users table starts 31 server renders at once. After the task: functions run
in the database's region, a click shows the canonical loading state at once, each layout sends the browser only the texts
its client code uses, row links of the admin tables do not prefetch, and the 2026-11-19 measurement repeated after the
merge shows each change.

## Cause

Read at `dc5e3af66`
- Functions run in Frankfurt and the database in London: `curl -s -o /dev/null -D - https://lero.al/uk | grep -i x-vercel-id` → `X-Vercel-Id: fra1::fra1::…`; `grep -o "aws-[0-9]-[a-z0-9-]*\.pooler" .env.local` → `aws-1-eu-west-2.pooler`; `vercel.json` sets no region. Each page reads the database several times in sequence, starting with the proxy's Auth call on every request (`src/lib/auth/middleware.ts:50`). Measured with `node perf-server.mjs` (whole HTML received, five runs, medians) → static file 42 ms; guest `/uk` 259, `/uk/listings` 338, `/uk/about` 202; agent `/uk` 343, `/uk/cabinet` 405; admin `/admin` 484, `/admin/users` 396, `/admin/listings` 418 ms.
- Two routes have a loading boundary (`find src/app -name loading.tsx` → `src/app/[locale]/favorites/loading.tsx`, `src/app/[locale]/listings/[slug]/loading.tsx`), so every other click keeps the old page on screen until the server answers.
- Both layouts hand the whole catalogue to the browser: `src/app/[locale]/layout.tsx:38,46`, `src/app/admin/layout.tsx:50,53`. The `storybook` namespace is read only by Stories (`grep -rln "useTranslations('storybook" src` outside `src/stories` → nothing), and the public tree reads one `admin` sub-namespace (`src/modules/listings/components/ListingFormShellView.tsx:95`). Measured: `curl -s --compressed https://lero.al/uk | wc -c` → `299422`, and the admin-only key `users_new_btn` is in that home page.
- The users table renders six links per user row with the default prefetch (`src/components/admin/AdminUsersTableView.tsx:140`, `:215`, `:288`, `:311`, `:361`; `src/components/admin/AdminSupportView.tsx:105`). Measured with `node perf-roles.mjs` as `HYDRATION_ADMIN`: the first sidebar click to `/admin/users` → `rsc requests 31`, `click→idle 1643 ms`; the next clicks 270-510 ms.

Fix: `vercel.json` pins the functions to `lhr1` (London, the database's region); a canonical loading state for the public and admin segments; each layout passes a picked catalogue; row links do not prefetch.

## Scope

- `vercel.json`: `"regions": ["lhr1"]`; the crons keep their paths and times.
- `src/app/[locale]/loading.tsx`, `src/app/admin/loading.tsx` (new): REUSE `MantineEmptyLoadingErrorState state="loading"` (`src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx:58`) inside the layout's content area; the two existing loading files stay (Task 1004 moves both off Tailwind).
- `src/i18n/clientMessages.ts` (new): `publicClientMessages(messages)` drops `storybook` and every `admin` key but `admin.common.status_control`; `adminClientMessages(messages)` drops `storybook`. The two layouts pass their result to `NextIntlClientProvider`. Server translations keep the full catalogue.
- The six links above: `prefetch={false}`.
- Out of scope: the proxy's Auth call (it refreshes the session; changing it is a separate security decision); the database queries of each page (re-measured after this task; a page still above 300 ms server time after the merge gets its own numbered task in the same turn).

## Attack surface

Changed: the region where every server function runs, and which texts reach the browser.
1. **What are we working on?** `vercel.json` (deployment region, every route, the crons included); the two layouts'
   client catalogue.
2. **What can go wrong?**
   - T1 D: a client component loses a namespace and shows raw keys → mitigate: a test reads every client
     `useTranslations` namespace and requires it in the picked catalogue → AC2.
   - T2 I: texts of staff screens reach every visitor → mitigate: the public catalogue drops the `admin` namespace;
     this removes the exposure → AC2.
   - T3 D: the new region misses a project variable → accept: variables belong to the project, not to a region, and
     the region stores no data; the after-merge check (Route 5) confirms every role signs in and reads.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: unchanged.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the region change and the catalogue sent to the browser — AC1, AC2.
- Authorization: not applicable — no access rule changes; the admin loading state renders inside the admin layout, after its viewer check, and shows no data.
- Authorization_Decisions_And_Output_Handling: not applicable — no authorization decision or output filter changes.
- Authorization_Patterns: not applicable — every page keeps its own check (Task 923 R68 (a)).
- Authorization_Regression_Testing: not applicable — no rule changes; the staff page test runs in AC6.
- Authorization_Testing_Automation: not applicable — the authorization matrix gains no row.
- Cross_Site_Scripting_Prevention: not applicable — the loading files render a fixed component with no input.
- DOM_based_XSS_Prevention: not applicable — no sink and no input.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — the pick reads the server's own catalogue with fixed keys, no input — AC2.
- Nextjs_Security: "Do not pass ORM records, session objects, or configuration merely because they are available." — each layout passes only the texts its client code reads; staff texts leave the public pages — AC2.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC6.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC2.
- Serverless_FaaS_Security: "Enforce authentication and authorization on all triggers (API Gateway, Pub/Sub, S3, IoT)." — the crons and routes keep their own checks in the new region; AC1 pins the cron list unchanged — AC1.
- Subdomain_Takeover_Prevention: not applicable — no domain, alias or DNS record changes.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results and Opus repeats the production measurement — AC6.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the loading files and the pick add no HTML sink — AC3.

## UI

GR-0 queries: "loading state of a page", "skeleton". Inspected: `MantineEmptyLoadingErrorState` (Story
`Patterns/Mantine/EmptyLoadingErrorState`, `loading` state), `Mantine/Primitives/Skeleton`. Decision: REUSE
`MantineEmptyLoadingErrorState` in the two new `loading.tsx` files. Reference research (GR-7): inherited canonical design —
owner decision 2026-10-20 (`Patterns/Mantine/EmptyLoadingErrorState`, state `loading`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/app/[locale]/loading.tsx and src/app/admin/loading.tsx — the loading state inside the content area of the site and the admin
- Component families: structural-layout-and-feedback
- Pattern IDs: linear-flow
- Standards: w3c-reflow, w3c-meaningful-sequence, apple-hig-layout, android-adapt-layouts, android-layout-basics
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the inherited loading state at the full content width; 640px transition unchanged
- Mobile order: header (layout) → loading state → footer (layout)
- Required-content treatment: the state's own label wraps at full width and is announced; nothing else is shown
- Story and verification: EmptyLoadingErrorState loading at 320px, 639px and 640px × sq, en, uk, it; the two routes on a real click at 320px and 1440px

## Acceptance criteria

- AC1 Functions run next to the database — test: `src/__tests__/deploymentRegion.test.ts` (new): `vercel.json` `regions` is `["lhr1"]` and the crons are unchanged; after the merge `curl -s -D - https://lero.al/uk` shows `::lhr1::` (Route 5).
- AC2 The browser gets only the texts its code reads — test: `src/i18n/__tests__/clientMessages.test.ts` (new): every namespace that a `'use client'` file outside `src/stories` reads with `useTranslations` is in the catalogue of its layout (admin files: the admin one; the rest: the public one); `storybook` is in neither; the public one holds no `admin` key but `admin.common.status_control`; `src/app/[locale]/__tests__/layoutMessages.test.tsx` (new): both layouts pass the picked catalogue.
- AC3 A click shows the loading state at once — test: `src/app/__tests__/loadingBoundaries.test.tsx` (new): both `loading.tsx` render `MantineEmptyLoadingErrorState` with `state="loading"`.
- AC4 Row links do not prefetch — test: `src/components/admin/__tests__/adminRowLinksPrefetch.test.ts` (new): every `href={`/admin/<section>/${…}`}` link under `src/components/admin` and `src/modules/admin` carries `prefetch={false}`.
- AC5 The Stories and four languages hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs`, `node scripts/quality/locale-safety.mjs` and the locale-leak browser job of `ci.yml`.
- AC6 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Branch from `main`. Read `vercel.json`, both layouts, `src/i18n/request.ts`, `MantineEmptyLoadingErrorState`, the two table views.
2. Tests first (AC1-AC4); save each failing output.
3. The region, the two loading files, the catalogue pick, the six links. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; one deliberate break of the catalogue pick (pass the full catalogue), restored.
5. Report: each command, exit code, relevant output. After the merge Opus reruns `perf-server.mjs` and `perf-roles.mjs` (guest, `HYDRATION_AGENT1`, `HYDRATION_ADMIN`) and writes both tables, before and after, into this kickoff; a page still above 300 ms server time gets a numbered task with its own cause.

## Review
