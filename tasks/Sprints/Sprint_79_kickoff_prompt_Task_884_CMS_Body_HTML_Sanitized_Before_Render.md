# Task 884 — a CMS page body is sanitised before it reaches the browser

Sprint 79 · **P1** · QA profile **Q4** (stored-XSS defence on a public route; a new production dependency) ·
**depends on 869** (both edit `CmsPageView`; 869 creates it) · owner actions **O79-6**, **O79-7** ·
**Status: `KICKOFF FILED` 2026-09-25 (revised the same day after a current-state review, §3.6)**

Sprint plan: [`Sprint_79_The_CMS_Pages_Nobody_Can_Read.md`](Sprint_79_The_CMS_Pages_Nobody_Can_Read.md).

**Owner instruction that created it (2026-09-25, verbatim):** *"заведи окрему задачу"*. It answers the orchestrator's
report of the automated security finding on `CmsPageView.tsx` (`dangerouslySetInnerHTML={{ __html: body }}`). This
is the "new number" 869's §3.6 anticipated: *"If the owner later wants defence-in-depth sanitisation, that is a new
number, not this one."*

## 1. Mode and task type

`IMPLEMENTATION`. A server-side HTML sanitiser, one call site, tests, a read-only content census, a dependency
record and doc rows. Bundles: **Regression / Critical Flow Coverage** and the security parts of **DB / Server Action /
RLS** (the trust boundary is a permission).

**No visible chrome change.** `CmsPageView`'s layout, Story title, states and styling stay as 869 leaves them. The only
rendered difference is that disallowed markup is removed from the body. §3.5 classifies GR-0/1/3/3a.

## 2. Objective

1. Every CMS body rendered by `CmsPageView` passes through **one** allowlist sanitiser first. Script, event handlers,
   `javascript:`/`data:` URLs, frames, forms, embedded SVG/MathML and inline `style` are removed. Ordinary rich-text
   markup is kept.
2. A test proves each known payload class is neutralised. A planted regression (the raw body, or `script` allowed)
   makes a test fail.
3. Before deploy, the owner learns whether any live page uses markup the allowlist would strip (O79-6), and whether a
   moderator currently holds `legal.manage` (O79-7).

## 3. Verified context — measured 2026-09-25

### 3.1 The injection site and why it now matters

- **F1 FACT.** `src/modules/cms/components/CmsPageView.tsx` (869, uncommitted at design time) renders
  `<div dangerouslySetInnerHTML={{ __html: body }} />` inside `TypographyStylesProvider`. `body` is the page's
  `content[locale].body` (or the `sq` fallback), passed unmodified by `src/app/[locale]/[slug]/page.tsx:66`. Before
  869, the same raw injection lived in `page.tsx:66`.
- **F2 FACT.** `package.json` (dependencies and devDependencies) holds no sanitiser: filtered for
  `/sanit|purify|xss|markdown|rehype/`, only `jsdom` (dev) matches.
- **F3 FACT — who can author the HTML.** `createPage`, `updatePage` and `deletePage` each start with
  `await assertPermission('legal.manage')` (`src/modules/admin/actions/index.ts:229, 255, 287`).
- **F4 FACT — `legal.manage` is delegable and now effective.**
  - Since Task 871 (approved and deployed 2026-09-25), a moderator's stored `role_permissions` grant is honoured.
  - The owner census that day (`docs/sessions/evidence/task871/20-o80-4-census.txt`) found 1 active moderator with 8
    keys allowed. Which 8 is **UNKNOWN**; O79-7 answers it.
- **F5 INFERENCE (F1, F3, F4).** 869 §3.6 set the trust boundary as *"a `legal.manage` holder may author HTML"*. That
  holder may now be a moderator, not only an admin. A body carrying `<img src=x onerror=…>` or `<script>` would run in
  every visitor's browser on `/{locale}/{slug}`, including an admin's. The browser Supabase client keeps its session
  in cookies that page script can read (`@supabase/ssr` browser client). So a moderator-authored page is a path to an
  admin session. Fail-open today, whatever the live content is.

### 3.2 Other `dangerouslySetInnerHTML` sites (`git grep -n dangerouslySetInnerHTML -- src`, 2026-09-25)

| Site | Content | In scope |
|---|---|---|
| `src/modules/cms/components/CmsPageView.tsx:29` | CMS body | **yes** |
| `src/app/[locale]/[slug]/page.tsx:66` | none after 869 (moved into `CmsPageView`) | I0 re-checks |
| `src/modules/listings/components/SimilarListings.tsx:219-228` | `<script type="speculationrules">` with `JSON.stringify` of server-built listing URLs | no — not CMS content, no author input |

**Writers of the HTML (why render time is the chokepoint).**
- Two components write `pages` through the same server actions: `AdminPagesManager` (`/admin/pages`) and
  `AdminLegalManager` (`src/components/admin/AdminLegalManager.tsx:15,44-45`, mounted by no route today).
- `anon`/`authenticated` hold `SELECT` only on `pages` (867 O79-2, `docs/sessions/evidence/task867/`), so there is
  no direct Data API write.
- Every present and future writer reaches the browser through one reader, `CmsPageView`. That reader is where the
  sanitiser belongs.

### 3.3 Dependency rule

`docs/dependencies.md`: add a package only when the job is not ~10 lines of TS, and record it in "Approved
additions" with its rationale. HTML sanitisation against an adversarial author is not a 10-line problem. Every
hand-rolled regex sanitiser is bypassable (entity-encoded schemes, malformed tags, parser differentials).

**Selected: `sanitize-html` (production) + `@types/sanitize-html` (dev).** Reasons:
- It runs in Node without a DOM, so there is no `jsdom` in the server bundle, unlike `isomorphic-dompurify`.
- It uses an allowlist, is MIT-licensed and widely used.
- `CmsPageView` is a server component, so the package never reaches the client bundle.

This is an orchestrator choice under the documented rule, not an owner exception. If the owner prefers
`isomorphic-dompurify`, R1 swaps the package and nothing else changes.

### 3.4 What authors write

- The editor's body placeholder is `<h2>...</h2><p>...</p>` (`AdminPagesManager.tsx:182`).
- `TypographyStylesProvider` styles headings, paragraphs, lists, links, blockquote, code/pre, tables and `hr`.
- Whether any live page uses `img`, `class`, `style` or other markup outside R2's allowlist is **UNKNOWN**: the
  orchestrator does not query production. O79-6's census answers it before deploy.

### 3.4a The real content shape (869's own fixtures)

`src/stories/patterns/mantine/CmsPageView.stories.tsx:13-55` holds per-locale bodies shaped like live
`pages.content.<locale>` rows:
- `<h2>`, `<p>`, `<ul><li>`;
- internal links (`/en/privacy-policy`, `/sq/politika-e-privatesise`, `/uk/politika-konfidentsiynosti`,
  `/it/informativa-privacy`);
- a fragment link `<a href="#">`;
- a long unbroken URL token.

R2 must return every one of these **byte-identical** (T1b). If it did not, the sanitiser would visibly change the
pages it is meant to protect.

### 3.5 GR classification

**GR-0/GR-1/GR-3/GR-3a: not triggered for chrome.** No component, `className`, style or Story file changes. The
`CmsPageView` edit is one expression inside its existing JSX. Evidence:
- the census for `src/app/[locale]/[slug]/page.tsx` is re-run at I0 and at the end, and must print the same nodes and
  statuses 869 left (AC8);
- `Patterns/Mantine/CmsPageView` keeps its states. Its fixtures' rendered output changes only where a fixture
  contained stripped markup, and AC8's Story build proves it still renders.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.3 | `package.json`: `sanitize-html` in `dependencies`, `@types/sanitize-html` in `devDependencies`, current major, installed with `npm.cmd install` so `package-lock.json` updates. `docs/dependencies.md` → "Approved additions" gets one row: package, version, rationale (§3.3), server-only use, Task 884. | P1 | AC1 | Confirmed |
| **R2** | §3.1, §3.4 | New `src/modules/cms/lib/sanitizeCmsHtml.ts` exporting `sanitizeCmsHtml(html: string \| null \| undefined): string` and the frozen options object `CMS_HTML_ALLOWLIST`:<br>• **tags:** `h1`–`h6`, `p`, `br`, `hr`, `strong`, `b`, `em`, `i`, `u`, `s`, `blockquote`, `ul`, `ol`, `li`, `a`, `code`, `pre`, `table`, `thead`, `tbody`, `tr`, `th`, `td`;<br>• **attributes:** `a` → `href`, `title`, `target`, `rel`; `th`/`td` → `colspan`, `rowspan`; nothing else, so there is no `style`, `class`, `id` or `on*`;<br>• **schemes:** `http`, `https`, `mailto`, `tel`, applied to `href`; relative URLs kept; protocol-relative (`//host`) refused;<br>• **content:** non-allowlisted tags are discarded but their text is kept, except `script`, `style`, `textarea`, `noscript`, `iframe`, `object`, `embed`, `svg`, `math`, `form`, whose content goes too;<br>• **links:** `target` limited to `_blank`; every `a[target=_blank]` gets `rel="noopener noreferrer"`.<br>`null`/`undefined`/`''` → `''`. The function is pure and idempotent. | P0 | AC2, AC3 | Confirmed |
| **R3** | F1 | `CmsPageView` renders `dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(body) }}`. This is the only change to the file; props, Story, layout and the `body &&` guard stay as 869 left them. After the change, `git grep -n "dangerouslySetInnerHTML" -- src/modules/cms src/app` shows exactly this one site. | P0 | AC4 | Confirmed |
| **R4** | Q4 | Tests:<br>• **T1** `src/modules/cms/lib/__tests__/sanitizeCmsHtml.test.ts`, a payload table. **Removed:** `<script>alert(1)</script>` (tag and text); `<img src=x onerror=alert(1)>`; `<svg onload=alert(1)>`; `<iframe src="https://x">`; `<a href="javascript:alert(1)">`; `<a href="JaVaScRiPt:alert(1)">`; `<a href="&#106;avascript:alert(1)">`; `<a href="data:text/html,…">`; `<a href="//evil.example">`; `<p onclick="x" style="color:red">` (both attributes); `<form><input></form>`; `<style>p{}</style>`. **Kept:** `<h2>`, `<p>`, `<strong>`, `<ul><li>`, `<a href="https://lero.al">`, `<a href="/sq/contact">`, `<a href="#">`, `<a href="#section">`, `<a href="mailto:a@b.c">`, `<table><tr><td colspan="2">`.<br>• **T1b:** every `pageBody` fixture in `CmsPageView.stories.tsx` satisfies `sanitizeCmsHtml(x) === x`. That covers the four locales and the rich-body fixture, imported from the Story module or copied verbatim with a comment naming the source line. `target="_blank"` gains `rel="noopener noreferrer"`. `sanitizeCmsHtml(sanitizeCmsHtml(x)) === sanitizeCmsHtml(x)` over the whole table, and `null` → `''`.<br>• **T2** `src/modules/cms/components/__tests__/CmsPageView.sanitize.test.tsx`: render `CmsPageView` with `renderToStaticMarkup` inside `<MantineProvider theme={theme}>`, with the `matchMedia` stub (as in `src/design-system/mantine/__tests__/theme.d69-18.test.tsx:35-79`), with a body holding a script and an `onerror` image → the markup contains neither `<script` nor `onerror`, and still contains the payload's surrounding `<p>` text.<br>• 869's route test `src/app/[locale]/[slug]/__tests__/page.errors.test.ts` passes unchanged. | P0 | AC5, AC6 | Confirmed |
| **R5** | §3.4 | `scripts/task-884-cms-html-census.sql`: read-only, **one statement, one grid**, owner-run. One row per `pages` row × locale with a non-empty body, as `(slug, locale, is_published, flags, stripped_tags)`:<br>• `flags` is a comma list of which patterns occur: `script`, `on_handler`, `javascript_url`, `data_url`, `iframe_or_embed`, `style_attr`, `class_attr`, `id_attr`, `img`, `svg`, `form`;<br>• `stripped_tags` is the distinct, sorted, lower-cased list of tag names in the body that are **not** in R2's allowlist (from `regexp_matches(body, '<\s*([a-zA-Z][a-zA-Z0-9]*)', 'g')`), i.e. exactly what the sanitiser would remove.<br>Slugs only, no body text. Slugs only, no body text. A final `(count)` row gives the number of flagged rows. | P1 | AC7 | Confirmed |
| **R6** | clause 15 | `docs/critical-flow-registry.md` gains one row, **"CMS page body sanitised before render"**: `CmsPageView` → `sanitizeCmsHtml`, the T1/T2 command, Task 884. `docs/rls-rules.md` is not touched. The 869 kickoff §3.6 is not edited (archived history); the registry row cites it. | P2 | AC8 | Confirmed |

## 5. Assumptions and open questions

1. **Content loss is possible and is surfaced, not assumed away.** If O79-6 shows a **published** page using a
   stripped feature (`img`, `class`, `style`), the reviewer puts that list to the owner **before approval**. The
   options are to widen R2's allowlist by the named, safe attributes (for example `img` with `src`/`alt` limited to
   `https`), or to accept the stripping. The executor does not widen the allowlist on its own.
2. **Sanitise at render, not at write.** Render-time sanitising covers content already stored, and it cannot be
   skipped by a future write path. Write-time sanitising would silently rewrite authors' input. Out of scope (§8).
3. **Heading anchors.** R2 drops `id`, so an in-page anchor such as `<h2 id="privacy">` + `<a href="#privacy">`
   would stop jumping. O79-6 reports `id_attr`. If a published page uses it, the §5.1 owner decision covers allowing
   `id` on `h1`–`h6` only.
4. **869 must land first.** If `CmsPageView` does not exist, or 869 is not archived, at I0, stop with
   `PREMISE DRIFT — 869`.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-2, GR-4, GR-5, GR-6. Read GR-0/1/3/3a far enough to confirm §3.5.
- `docs/agent-contract.md`: clauses 1, 2, 3, 9, 10, 14, 15.
- `docs/rule-index.md`: "Regression / Critical Flow Coverage", "DB / Server Action / RLS".
- `docs/qa-profiles.md`: `Q4`. `docs/dependencies.md`. `docs/qa-rules.md`.
- The archived 869 kickoff §3.6 and R3, read-only.
- `docs/orchestrator-procedures.md` → the 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `package.json`, `package-lock.json` (R1 only)
2. `docs/dependencies.md` (one row)
3. `src/modules/cms/lib/sanitizeCmsHtml.ts` (new)
4. `src/modules/cms/components/CmsPageView.tsx` (the one expression, R3)
5. `src/modules/cms/lib/__tests__/sanitizeCmsHtml.test.ts`, `src/modules/cms/components/__tests__/CmsPageView.sanitize.test.tsx` (new)
6. `scripts/task-884-cms-html-census.sql` (new)
7. `docs/critical-flow-registry.md` (one row)
8. `docs/sessions/2026-09-2?-task884-cms-html-sanitize.md`, `docs/sessions/evidence/task884/*`
9. `docs/backlog.md`: the 884 registry cell only

## 8. Out of scope

- Sanitising at write time (`createPage` / `updatePage`), and any change to `legal.manage` or `role_permissions`.
- `SimilarListings.tsx`'s speculation-rules script (§3.2).
- A Content-Security-Policy header. It is a separate, site-wide change and would be its own number if the owner wants
  one.
- Editing live page content; the owner does that in `/admin/pages` if O79-6 calls for it.

## 9. Current and required behavior

| Input in a page body | Current | Required after |
|---|---|---|
| `<h2>`, `<p>`, lists, links, tables, code | rendered | **rendered unchanged** |
| `<script>…</script>` | inserted; not executed by `innerHTML` in React, but present in the SSR HTML and executed by the browser on first load | **removed with its content** |
| `onerror=` / `onclick=` / any `on*` attribute | kept → executes | **removed** |
| `javascript:` / `data:` / `//host` in `href` | kept | **`href` removed** |
| `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<form>` | kept | **removed** |
| `style=` / `class=` | kept | **removed** (O79-6 reports if any live page relies on it) |
| `target="_blank"` link | as authored | gains `rel="noopener noreferrer"` |

## 10. Implementation requirements

### 10.1 I0

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()"` → must start `win32`.
2. `git --no-optional-locks status --porcelain` → `01-status-before.txt`, plus the hash of each modified path.
3. **869 gate:** 869 is archived in `docs/backlog-archive.md`, and `CmsPageView.tsx` exists with the §3.1 line. Quote
   it. Otherwise stop with `PREMISE DRIFT — 869`.
4. Re-run `git grep -n dangerouslySetInnerHTML -- src` → `02-sites-before.txt`. A new site with author input is a
   STOP (`UNLISTED INJECTION SITE`).
5. Census baseline: `node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx"` →
   `03-census-before.txt`.

### 10.2 Order

I0 → R1 install → T1 written first and run red (no module yet) → R2 → T1 green → T2 red against the raw view → R3 →
T2 green → plants → R5 → R6 → gates → report.

### 10.3 Plants (each evidence file holds the planted file's hash before the plant and after the restore)

| Plant | Edit | Must fail | Evidence |
|---|---|---|---|
| **P1** (R3) | `CmsPageView` back to `{ __html: body }` | T2 | `05-plant-p1.txt` |
| **P2** (R2) | add `'script'` to the allowed tags | T1's script row | `06-plant-p2.txt` |
| **P3** (R2) | drop `allowedSchemes` (library default) | T1's `data:` or protocol-relative rows, whichever the default admits (the file records which) | `07-plant-p3.txt` |

## 11. Positive and negative flows

**Positive.** An author publishes a page with headings, paragraphs, a list and a link. A visitor sees it formatted
exactly as before.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Malicious body (script / handler / URL scheme / frame) | **Yes** | R2, R3 | neutralised | T1, T2, P1–P3 |
| Legitimate rich text | **Yes** | R2 | unchanged | T1 "kept" rows; T1b fixture round-trip; O79-6 |
| Live content relying on stripped markup | **Yes** | §5.1 | reported to the owner before approval | O79-6 |
| Empty / missing body | **Yes** | R2 | `''`; the `body &&` guard unchanged | T1 `null` row, 869 tests |
| Moderator authorship | **Yes** | F4 | a moderator can no longer inject script | T1/T2; O79-7 |
| Locale / viewport | No | no chrome change (§3.5) | — | — |

## 12. Acceptance criteria

- **AC1 [R1]** Given `package.json` and `package-lock.json`, `sanitize-html` is a dependency and its types a
  devDependency. `docs/dependencies.md` has the R1 row. `npm.cmd ls sanitize-html` exits 0.
- **AC2 [R2]** Given `sanitizeCmsHtml.ts`, its options match R2's allowlist field by field (the reviewer reads
  `CMS_HTML_ALLOWLIST`), and `null`/`undefined`/`''` return `''`.
- **AC3 [R2, R4]** Given T1, every "removed" payload is absent from the output, every "kept" fragment is present,
  every Story fixture body round-trips byte-identical (T1b),
  `target="_blank"` carries `rel="noopener noreferrer"`, and the function is idempotent over the table.
- **AC4 [R3]** Given `git diff src/modules/cms/components/CmsPageView.tsx`, the only change is the `__html`
  expression (plus its import). Given `04-sites-after.txt`, `CmsPageView.tsx` is the only CMS/app site.
- **AC5 [R4]** Given T2, the rendered markup has no `<script` and no `onerror`, and keeps the surrounding text.
- **AC6 [R3, R4]** Given `05`–`07`, each plant fails its named test and passes after restore with equal hashes.
  869's route tests pass unchanged.
- **AC7 [R5]** Given the census file, it is one statement with no write keyword (`08-census-single-statement.txt`),
  and it selects slug, locale, `is_published`, `flags` and `stripped_tags` only (no body text).
- **AC8 [R6, §3.5]** Given `docs/critical-flow-registry.md`, it has the one new row. The `[slug]` census after
  (`09-census-after.txt`) prints the same nodes and statuses as `03`. `build-storybook` exits 0.
- **AC9 [all]** `npm.cmd run build` exits 0 on the final tree; `typecheck`, `lint`, `check:file-integrity` and
  `check:mojibake` exit 0.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none.` (AC4's "only change" is scoped to
one file's diff, which is the deliverable itself.)

## 13. QA profile and verification plan

**Q4.** Reasons: a stored-XSS defence on a public route that admins also visit, plus a production dependency.
Required evidence: red-then-green tests, planted failures, the build, and owner-native checks (O79-6 census before
approval, O79-7 permission check now, a live check after deploy).

### 13.1 Re-entry

From scratch, after 869 is archived.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Plants first, by hand. Then:

```powershell
$ev = "docs\sessions\evidence\task884"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\04-platform.txt"
git --no-optional-locks grep -n dangerouslySetInnerHTML -- src | Tee-Object "$ev\04-sites-after.txt"
node.exe -e "const fs=require('fs');const s=fs.readFileSync('scripts/task-884-cms-html-census.sql','utf8').replace(/--.*$/gm,'').replace(/'(?:[^']|'')*'/g,'');const n=(s.match(/;/g)||[]).length;const bad=s.match(/\b(insert|update|delete|grant|revoke|alter|create|drop|truncate)\b/gi);console.log('semicolons='+n,'endsWithSemicolon='+/;\s*$/.test(s),'writeKeywords='+(bad?bad.join(','):'none'))" | Tee-Object "$ev\08-census-single-statement.txt"
node.exe scripts\check-surface-census.mjs --surface "src/app/[locale]/[slug]/page.tsx" *>&1 | Tee-Object "$ev\09-census-after.txt"
npx.cmd vitest run src/modules/cms "src/app/[locale]/[slug]" *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd ls sanitize-html *>&1 | Tee-Object "$ev\11-npm-ls.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\14-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\15-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\16-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\17-build.txt"
git --no-optional-locks hash-object src\modules\cms\lib\sanitizeCmsHtml.ts src\modules\cms\components\CmsPageView.tsx src\modules\cms\lib\__tests__\sanitizeCmsHtml.test.ts src\modules\cms\components\__tests__\CmsPageView.sanitize.test.tsx scripts\task-884-cms-html-census.sql package.json package-lock.json docs\dependencies.md docs\critical-flow-registry.md | Tee-Object "$ev\18-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\19-status-after.txt"
```

Record `EXIT_CODE=$LASTEXITCODE` after each command. Normalise every `Tee-Object` file (UTF-16LE on Windows
PowerShell 5.1) to UTF-8 without BOM through Node, line for line, before `check:file-integrity`. Stop any running
Next server before either build.

Expected:
- `04-platform` starts with `win32`.
- `04-sites-after` lists `CmsPageView.tsx` and `SimilarListings.tsx` only.
- `08`: `semicolons=1 endsWithSemicolon=true writeKeywords=none`.
- `09` equals `03` in nodes and statuses.
- `10`–`17`: exit 0.
- `19`: no path outside §7.

### 13.3 Owner-native steps

```powershell
Get-Content -Raw -Encoding utf8 scripts\task-884-cms-html-census.sql | Set-Clipboard
```

1. **O79-7 — now, before any code lands.** As admin, open `/admin/permissions` and check whether moderators hold
   `legal.manage`. If a moderator does not need it, switch it off until 884 is deployed. Report the state.
2. **O79-6 — after the executor reports, before approval.** In the Supabase SQL Editor, clear the editor, paste the
   copied census, and Run. Return the grid. `(count)` = 0 means no live page relies on stripped markup. A **published**
   row with a non-empty `stripped_tags`, or with `style_attr`/`class_attr`/`id_attr`, goes to the owner decision in
   §5.1.
3. **After deploy.** Open two published CMS pages in a private window and confirm headings, lists and links look as
   before.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

- the changed files with their `18-hash-object.txt` values;
- the requirement IDs completed;
- the installed `sanitize-html` version;
- every command in §10.1, §10.3 and §13.2 with its real exit code;
- T1/T2 red and green transcripts;
- the plant table with its hash pairs (P3 names which default the plant exposed);
- assumptions, deviations and limitations;
- O79-6 and O79-7 stated as owed.

Sonnet updates the 884 cell of `docs/backlog.md` (state only), writes the session log with a "Files Changed" table,
and emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes: the site, the allowlist, the payload table, the plants and the owner steps are in this file |
| One active route | Yes: render-time allowlist sanitiser at the single injection site |
| Every requirement has a binary AC | R1→AC1 · R2→AC2/AC3 · R3→AC4 · R4→AC3/AC5/AC6 · R5→AC7 · R6→AC8 · all→AC9 |
| Two-armed control | T1/T2 red first; P1–P3 |
| Detector blind spot stated | T1 covers the listed payload classes, not every parser differential; the library's allowlist model is the defence, and T1 guards the configuration. The census (R5) matches patterns in stored JSON text, not rendered HTML, so it can over-report (`on_handler` inside plain text). It is a screen for the owner, not a verdict |
| Material absence claims traced | "No sanitiser installed": the `package.json` filter (F2). "One CMS injection site": `git grep` (§3.2), re-run at I0 |
| Dirty worktree handled | 869's work is uncommitted at design time; I0 requires 869 archived first, then snapshots |
| Owner exception claimed | None. The dependency is chosen under `docs/dependencies.md`; the owner may swap it (§3.3) |

---

## Appendix A — Evidence preflight (task design)

| Claim | Source inspected | Status |
|---|---|---|
| Raw CMS body is injected | `CmsPageView.tsx:29` (worktree), `page.tsx:66` | VERIFIED |
| Writers need `legal.manage` | `actions/index.ts:229,255,287` | VERIFIED |
| Moderator grants now apply | 871 approval + O80-4 census | VERIFIED |
| Which moderator keys are on | — | UNKNOWN → O79-7 |
| Live content uses stripped markup | — | UNKNOWN → O79-6 |
| No sanitiser in dependencies | `package.json` filter | VERIFIED |
| Dependency rule | `docs/dependencies.md:1-7` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Evidence | Result |
|---|---|---|---|
| `docs/dependencies.md` | rationale row for a new package | R1 | COMPLIANT |
| agent-contract 9 | build exit 0 | `17-build.txt` | COMPLIANT |
| agent-contract 14 | UTF-8, Node I/O, hashes | §10.3, §13.2 | COMPLIANT |
| agent-contract 15 | regression row + command | R6 | COMPLIANT |
| Q4 | baseline, changed-behaviour test, plants, owner-native | I0, T1/T2, P1–P3, O79-6/7 | COMPLIANT |
| GR-0/1/3/3a | — | NOT APPLICABLE for chrome (§3.5); census before/after as proof | NOT APPLICABLE |

## Appendix C — Execution contract

| # | Checkpoint | Producer → artifact | Failure |
|---|---|---|---|
| 0 | 869 archived, view present | I0.3 | `PREMISE DRIFT — 869` |
| 1 | Injection-site census | I0.4 → `02` | an unlisted author-input site → STOP |
| 2 | Red-first | T1 before R2, T2 before R3 | a test green before its fix → the test cannot see the defect |
| 3 | Plants | `05`–`07` | a plant passes → test defect |
| 4 | Gates | §13.2 | non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | Owner census | O79-6 | a flagged published row → owner decision before approval |

### 3.6 Revision note (2026-09-25, same day)

The owner asked for a check against the current functionality before the kickoff is committed. That check added:
- the second writer (`AdminLegalManager`) and the no-direct-write fact (§3.2);
- the real content shape and the T1b round-trip (§3.4a);
- heading anchors as an explicit decision point (§5.3);
- `stripped_tags` and `id_attr` in the census (R5);
- the concrete Mantine test harness and the 869 test file name (R4).

The route, the allowlist core, the plants and the gates are unchanged.
