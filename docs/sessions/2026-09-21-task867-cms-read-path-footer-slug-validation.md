# Task 867 — public CMS read path GRANT/RLS + Footer slug validation + publish guard

Sprint 79 · P1 · Q4. Executor session (Sonnet), 2026-09-23. Kickoff:
[`Sprint_79_kickoff_prompt_Task_867_Public_CMS_Read_Path_And_Footer_Slug_Validation.md`](../../tasks/Sprints/Sprint_79_kickoff_prompt_Task_867_Public_CMS_Read_Path_And_Footer_Slug_Validation.md).

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

`GR-1 CENSUS COMPLETE — 0 nodes in scope; this task edits no file that renders a visible surface (kickoff §3.4 measured both candidate surfaces: /admin/footer 7 nodes, /[locale]/[slug] 1 node — all already baselined, none edited, confirmed again by AC8's check:surface-census:changed run below). tier1 0 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed.`

`GR-3 / GR-3a — not applicable: no visible component changes and no Story-related write occurred.`

`GR-2 SCOPE STATED — check:surface-census:changed inspects only surfaces reachable from this diff's changed files and only compares against scripts/surface-census-baseline.json; it cannot see whether a DB policy exists. AC3's live grant/policy criterion is closed only by the owner-run SQL grids (O79-1/O79-2), never by a green gate.`

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`

Original implementation below is the pre-revision baseline (unchanged except for the F3 session-log
correction noted in Revision 1). See the `## Revision 1` section at the end of this log for review
1's three findings, the fixes, the planted-violation proofs, and the re-run gate evidence.

R2's SQL is written but not applied (owner-run, O79-1). AC3 and AC9 are owner-native and remain
**pending** until O79-1/O79-2/O79-4 run. Every executor-side requirement (R1, R3–R8) is implemented
and evidenced below.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `scripts/task-867-pages-read-probe.mjs` — three read-only queries + §10.1 content census, no key material, no body text | `docs/sessions/evidence/task867/01-probe.txt`. Branch: **anon denied (42501)** — proceeds with R2, the F21 branch. Census: **3 rows** (not F22's 1) — see "I0 content census" below. |
| R2/AC2 | `scripts/task-867-pages-public-select.sql` — idempotent grant + policy, no DML grant, header cites Task 275/326A | File created; quoted in full below. Not yet applied (owner-run O79-1). |
| R3/AC4 | `footer-route-allowlist.ts` — `isValidFooterUrl` accepts single-segment CMS slugs via `validateSlug`, preserves all prior verdicts | `docs/sessions/evidence/task867/04-test-footer-allowlist.txt` — 6/6 pass. |
| R4/AC5 | `footer.ts` → `upsertFooterContent` — batched server-side CMS slug existence check against `pages` where `is_published = true` | `docs/sessions/evidence/task867/05-test-pages-footer-smoke.txt` — 17/17 pass (includes R4's positive/negative/disabled/transient arms). |
| R5/AC6 | `index.ts` → `createPage`/`updatePage` — `sq_body_required` guard, content-supplied and content-omitted forms | Same file — createPage (4 tests) + updatePage (6 tests) all pass. Planted-violation proof below. |
| R6/AC7 | Build route-table marker for `/[locale]/[slug]`; no `revalidatePath` added | `docs/sessions/evidence/task867/10-build.txt` line 307: `├ ƒ /[locale]/[slug]   380 B   185 kB` — **`ƒ` confirmed**, matches the kickoff's prediction. No `revalidatePath` call added (diff-grep below). |
| R7 | Write-path actor assertion — `createPage`/`updatePage`/`deletePage`/`upsertFooterContent` write via `createAdminClient()`, never the user-scoped client | Same smoke suite — dedicated `R7 —` tests per function; each asserts `mockCreateAdminClient` called and `mockCreateClient` **not** called for the write. |
| R8/AC3 | `scripts/task-867-verify.sql` — 4 grids (grants, policy, positive arm, negative arm next to service-role draft count) | File created; owner-run O79-2, **pending**. |
| AC8 | Diff stays inside §7, none of §8 | `docs/sessions/evidence/task867/13-diff-stat.txt` + `git status --porcelain` below — every changed/new path is in §7. `check:surface-census-changed.mjs --base HEAD` → **PASS, 0 new blocking nodes** (`08-check-surface-census-changed.txt`). |
| AC9 | Owner-native, post-deploy | Pending — owner step O79-4. **Not satisfiable yet**: 3 pages exist and are published, but all three have an **empty `sq.body`** (see census) — a separate content gap, not this task's defect (kickoff §3.2/§3.5 and O79-0). |
| AC10 | Every `npm`/`node` command in §13.2 exits 0 | All captured below; every command **EXIT_CODE=0**. |

## Current versus required behavior

Matches the kickoff's §9 table exactly; no deviation. Negative flows (§11) all covered by the two
new test files — see the "Applicable negative flows" evidence in the requirement table above; no
flow was found inapplicable or newly discovered.

## I0 content census (measured, replaces F22)

The kickoff's F22 recorded **one** `pages` row on 2026-09-21. This run (2026-09-23) measures **three**:

| slug | is_published | sq (title/body len) | en | uk | it |
|---|---|---|---|---|---|
| privacy-policy | true | 22 / **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| about | true | 10 / **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| terms-of-service | true | 19 / **0** | 16 / 34 | 0 / 0 | 0 / 0 |

All three rows are `is_published = true` with an **empty Albanian body**. This is pre-existing DB
state, not something this task wrote — R5's guard only blocks *new* publish writes with an empty
`sq.body`; it does not retroactively touch existing rows.

**Correction (review 1, F3):** the paragraph originally here claimed `en`/`uk`/`it` reads would 404
on the route's own empty-content branch. That is wrong. `page.tsx:51-56` falls back to
`content.sq` whenever the *requested* locale's own title and body are both empty, and `notFound()`
fires only if **that fallback** (`sq`) is also empty. All three rows have a non-empty `sq.title`, so
the fallback never trips: **every locale renders 200** after O79-1, using the Albanian title with an
**empty body** wherever the requested locale has no content of its own (`privacy-policy`/`about` in
en/uk/it, `terms-of-service` in uk/it). `terms-of-service`/`en` is the one cell with real English
content and renders normally. The content-fill gap for the owner still stands — two of three pages
show no readable body text in three of four locales, and `terms-of-service` still needs `uk`/`it`
filled — but the mechanism is "renders a title with no body," not "404." O79-1 has since been
applied and production confirms 200 in all four locales for `privacy-policy`
(`docs/sessions/evidence/task867/review1-post-o79-1.txt`), consistent with this corrected reading.

## R2 SQL (quoted, AC2)

```sql
grant select on public.pages to anon, authenticated;

drop policy if exists "pages_select_public" on public.pages;

create policy "pages_select_public" on public.pages
  for select
  to anon, authenticated
  using (is_published = true);
```

No `insert`/`update`/`delete` grant to either role; no change to `service_role`. Header comment
(not reproduced here) cites Task 275, Task 326A and the deploy order — see the file.

## Files Changed

| Path | Reason | `git hash-object` |
|---|---|---|
| `src/lib/footer-route-allowlist.ts` | R3 — accept single-segment CMS slugs (shape only), replace stale comment | `5f74a73394037aa73c5b743e6951ad202d75371e` |
| `src/modules/admin/actions/footer.ts` | R4 — batched server-side CMS slug existence check in `upsertFooterContent` | `ba0cb92613d41f2aa0dfa06c10f7ca0222c41c91` |
| `src/modules/admin/actions/index.ts` | R5 — `sq_body_required` guard in `createPage`/`updatePage` | `1b2a152d23ace3787bd73b77f3593f15ae19eaa1` |
| `scripts/task-867-pages-read-probe.mjs` *(new)* | R1 — read-only probe + content census | `ec686cc7d84744002c2775eb441e0a7a83874e19` |
| `scripts/task-867-pages-public-select.sql` *(new)* | R2 — owner-applied GRANT + policy | `f9ceec5a049b67a1df0ba3f43e983b1e0767d23f` |
| `scripts/task-867-verify.sql` *(new)* | R8 — owner-run verification grids | `7243de0ec487f0ca0373490cc726ca0d7264ca3f` |
| `src/lib/__tests__/footer-route-allowlist.test.ts` *(new)* | R7/AC4 — shape-check coverage | — |
| `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` *(new)* | R7/AC5/AC6 — action-level coverage | — |
| `docs/sessions/evidence/task867/**` *(new)* | validation transcripts | — |
| `docs/backlog.md` | 867 row state only | — |
| `docs/sessions/2026-09-21-task867-cms-read-path-footer-slug-validation.md` *(new)* | this session log | — |

**Unrelated pre-existing change, not authored by this session:** `docs/sessions/evidence/task861/storybook-dev.log`
was already modified (`M`) in `git status` before this session started (visible in the session's
initial git-status snapshot). This session made no edit to it. `check:surface-census:changed`
independently excludes it (`[outside-src]`). Flagging so it is not mistaken for scope creep.

## Validation evidence

All commands run from the project root on `win32 v22.22.3` (`docs/sessions/evidence/task867/00-platform.txt`).
Every transcript captured unpiped, redirected to a file with `$LASTEXITCODE` appended as a separate
statement, per §13.1. (Two evidence-log files initially carried a stray UTF-8 BOM from PowerShell
`>` redirection — a harness artifact, not a source defect; stripped before the final
`check:file-integrity` run, see `11-check-file-integrity.txt`, PASSED clean.)

| Command | Result | Evidence |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | `win32 v22.22.3`, exit 0 | `00-platform.txt` |
| `node scripts\task-867-pages-read-probe.mjs` | anon denied 42501; 3-row census; exit 0 | `01-probe.txt` |
| `npm run typecheck` | exit 0 | `02-typecheck.txt` |
| `npm run lint` | 0 errors, 81 pre-existing warnings (none in touched files), exit 0 | `03-lint.txt` |
| `npm run test -- footer-route-allowlist.test.ts` | 6/6 pass, exit 0 | `04-test-footer-allowlist.txt` |
| `npm run test -- pages-and-footer-validation.smoke.test.ts` | 17/17 pass, exit 0 | `05-test-pages-footer-smoke.txt` |
| Planted violation — R5 `createPage` guard disabled | 1 test fails as expected (`5b-planted-violation.txt`), restored and re-verified green (`5c-restored.txt`) | `05b-planted-violation.txt`, `05c-restored.txt` |
| `npm run test:admin` | 18/18 pass (unaffected by R5 change), exit 0 | `06-test-admin.txt` |
| `npm run test:rls-guards` | 15/15 pass, exit 0 | `07-test-rls-guards.txt` |
| `node scripts\check-surface-census-changed.mjs --base HEAD` | PASS, 0 new blocking nodes | `08-check-surface-census-changed.txt` |
| `npm run check:i18n` | 2370/2370 keys parity, exit 0 | `09-check-i18n.txt` |
| `npm run build` | production build succeeds, `/[locale]/[slug]` = `ƒ`, exit 0 | `10-build.txt` |
| `npm run check:file-integrity` | PASSED, 24 files clean (after BOM strip), exit 0 | `11-check-file-integrity.txt` |
| `npm run check:mojibake` | 0 artifacts in 6352 files, exit 0 | `12-check-mojibake.txt` |
| `git diff --stat` | 4 files (3 mine + 1 pre-existing unrelated), exit 0 | `13-diff-stat.txt` |
| `git grep -n revalidatePath` (index.ts, footer.ts) | no added call (verified via `git diff` grep for added lines, separately) | `14-revalidatePath-grep.txt` |
| `git hash-object` (6 files) | values in Files Changed table | `15-hash-object.txt` |

**Deviation from §13.2's "Expected" prose:** that paragraph describes the `revalidatePath` grep as
printing "only" the pages/settings/layout calls. The command as written scans the **entire** two
files (899 + 179 lines), which also contain many pre-existing, unrelated `revalidatePath` calls
(listings, users, locations, support) — none of them touched by this diff. The prose undersold the
grep's real scope. The actual AC7 test — `git diff` contains no **added** `revalidatePath` line —
was run directly and confirms **no added call**; this is the evidence AC7 actually requires.

## Visual source trace

Not applicable — no visible UI artifact changed. §3.4 of the kickoff measured both candidate
surfaces (`/admin/footer` 7 nodes, `/[locale]/[slug]` 1 node) as already baselined and confirmed
neither is touched by this diff; `check:surface-census-changed.mjs --base HEAD` independently
confirms 0 new blocking nodes from this diff.

## Canonical UI decision record

Not applicable — no visible artifact created, extended, or styled. R3 reuses the existing canonical
`validateSlug` (`src/lib/slug-validator.ts`) rather than re-implementing slug shape rules (GR-0
canonical reuse, §10.4). R4 reuses the existing `'invalid_internal_link'` error code and its
existing four-locale localized messages (F19) — no new locale key added.

## Implementation validation notes

- R5's guard is scoped to `data.is_published === true` exactly, per the kickoff's literal wording
  ("effective" clarifies only the *content* source, not the `is_published` source) — a call that
  omits `is_published` entirely does not trigger the guard, matching "R5's guard must not change the
  success path" (§10.7).
- R4's slug-candidate extraction re-derives the "is this a CMS-candidate path" test independently of
  `isValidFooterUrl`'s internal shape check, because the shape function only returns a boolean, not
  which branch matched. This does not re-implement slug validation — `validateSlug` itself is only
  called inside `isValidFooterUrl` (via R3); the candidate extraction just recognizes "starts with
  `/`, not a static path, single segment" to decide which slugs to batch-query.
- No defect found in existing code during this session beyond what the kickoff already named (F5,
  the swallowed-error branch, is out of scope per §8 and not touched).

## Assumptions, deviations, and limitations

1. Per §5.2, the owner's `.env.local` and the deployed site are assumed to point at the same
   Supabase project. The probe ran successfully in this environment (no `MISSING EVIDENCE` needed
   for R1/AC1, unlike the kickoff's anticipated fallback).
2. The `revalidatePath` grep "Expected" prose deviation is documented above — the AC7 requirement
   itself (diff contains no added call) is directly verified and satisfied.
3. **Limitation carried forward from the kickoff (§3.5, restated per §14):** the admin-facing
   message for a refused publish (`sq_body_required`) is not implemented in this task — 868, routed
   to Sprint 78, owns `AdminPagesManager.tsx`. Until then, a refused publish shows the existing
   generic `admin.legal.save_error` toast (unchanged).
4. **New limitation surfaced by I0's census** (not anticipated by the kickoff, which expected 1 row):
   3 rows exist, all published, all missing Albanian body content, and one is also missing `uk`/`it`
   content. AC9 needs owner content work beyond creating rows — see "I0 content census" above.
5. No `messages/*.json` key, component, Story, or `revalidatePath` call was added by this task.
6. R2 and R8's SQL are written but not applied/run — owner actions O79-1/O79-2/O79-4 remain, per the
   kickoff's own design (the task does not wait for O79-1 before reporting).

## Opus handoff

- Evidence root: `docs/sessions/evidence/task867/`.
- Please independently inspect: the R4 batched-query logic in `footer.ts` (candidate extraction +
  single `.in()` query, §10.6); the R5 "effective content" branch in `updatePage` (content-omitted
  path reads the stored row before guarding, §10 item 1); and the planted-violation proof
  (`05b-planted-violation.txt` / `05c-restored.txt`) against the real diff.
- Two things worth an explicit owner decision at review: (a) the I0 census mismatch (3 rows, not 1)
  and its content-fill implication for AC9 across all three existing pages, not just the two the
  owner named; (b) whether the `revalidatePath` grep "Expected" prose in the kickoff should be
  corrected for future tasks that scan a large shared file.
- No Sonnet self-approval, no review, no mutating git command was run or suggested.

## Backlog update

`docs/backlog.md` line for **867 · 868**: state updated to
`867 IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW 2026-09-23`, with a one-line pointer to this session
log and the 3-row census fact. File is **80 physical lines** — at the limit, not over; no
`BACKLOG LIMIT BREACH`.

---

## Revision 1 — review 1 remediation, 2026-09-23

Re-entered at kickoff §16.4 (`remediation` mode). Evidence files `00`–`15` in
`docs/sessions/evidence/task867/` are the pre-revision baseline and were **not** overwritten;
all revision-1 evidence is `r1-NN-*.txt` in the same folder. Per kickoff §16, R1/AC1's probe
script, R8's verify SQL, R3's helper, R5's guard, and the `footer-route-allowlist` test were
**not** changed.

### F1 (P2) — fixed: admin check now runs before any service-role client/DB call

`upsertFooterContent` (`src/modules/admin/actions/footer.ts`) previously created the service-role
client and ran the `pages` batch lookup **before** `assertAdminUser()`. An unauthenticated or
non-admin caller could trigger that service-role query and infer its result from which error came
back. Fixed: the admin check now runs immediately after the pure checks (locale, `validateLinks`,
`isValidFooterUrl`) and before `createAdminClient()`/the lookup. New hash:
`8422b1612f3002ffe34c343f7101951f6a960512`.

### F2 (P2) — fixed: the R4 test suite now proves the batching and the `is_published` filter

The previous test builder's `.eq()`/`.in()` dropped their arguments, so the `is_published` filter
and the slug `.in()` set were unverifiable — removing either from `footer.ts` still passed all 17
tests. Fixed: the builder now records `.in()`/`.eq()` calls on the `select('slug')` (CMS-batch)
chain only, via `mockCmsBatchIn`/`mockCmsBatchEq`. New hash:
`74816a17a580f374c2b2da7737cc7bab97927eea`.

Four new test arms added (21 tests total, up from 17):
1. **Batching set assertion** — a payload with two links to `/privacy-policy` (duplicate), one to
   `/about`, one to the static `/contact` produces exactly one `.in('slug', ['about',
   'privacy-policy'])` call (order-independent) and one `.eq('is_published', true)` call.
2. **F1 regression — unauthenticated caller** — `mockGetUser` resolves `null`; a payload containing
   a CMS slug returns `{ error: 'forbidden' }`; `mockCmsBatchSelect` and `mockFooterUpsert` are
   never called.
3. **F1 regression — non-admin caller** — same, with the role check resolving `'user'`.
4. **R4 shape arm** — an enabled `/some/deep/path` link returns `invalid_internal_link` without a
   `pages` lookup (was implied by existing code but never asserted).

### Planted-violation proof (§16.4)

Full detail: `docs/sessions/evidence/task867/r1-05b-plants.txt`. Both plants performed on
`src/modules/admin/actions/footer.ts`, pre-plant hash `8422b1612f3002ffe34c343f7101951f6a960512`.

| Plant | Change | Result | Failing test(s) |
|---|---|---|---|
| **A** (F2) | Deleted `.eq('is_published', true)` from the R4 lookup | 1 failed, 20 passed (`r1-03-plantA-result.txt`) | "review-1 F2 — one batched lookup with the distinct candidate slug set…" — `expected "vi.fn()" to be called with arguments: [ 'is_published', true ]` |
| **B** (F1) | Moved the admin check back below the lookup | 2 failed, 19 passed (`r1-05-plantB-result.txt`) | Both "review-1 F1 —" tests — `expected { error: 'invalid_internal_link' } to deeply equal { error: 'forbidden' }` |

After each plant, the file was restored via the Edit tool (not regenerated) and re-hashed:
**`8422b1612f3002ffe34c343f7101951f6a960512`** both times — identical to the pre-plant hash,
confirmed by `git hash-object`, not merely asserted. `git status --porcelain` after restoration
shows only the expected `M` (the file's real, intended diff from `HEAD`) — `r1-06-git-status-after-plants.txt`.
Full suite re-run green after restoration: 21/21 pass (`r1-07-test-restored.txt`).

### F3 (P3) — session log corrected

The "I0 content census" section above previously claimed en/uk/it reads would 404 on the route's
own empty-content branch. That was wrong: `page.tsx:51-56` falls back to `content.sq` when the
requested locale's own content is empty, and `notFound()` fires only if the **sq** fallback is also
empty. Since all three rows have a non-empty `sq.title`, every locale renders **200** with the
Albanian title (empty body where the locale has none) after O79-1, not 404. The paragraph has been
corrected in place above (same section) rather than left as a second, contradicting version.

### R2 SQL — the two §16.7 lines added, matching the live database

Per kickoff §16.7, the owner had already applied both statements directly to production on review
1's instruction (`docs/sessions/evidence/task867/review1-post-o79-1.txt`). This revision brings
`scripts/task-867-pages-public-select.sql` in line with that applied state — nothing else in the
script changed:

```sql
revoke references, trigger, truncate on public.pages from anon, authenticated;
```
placed directly after the `grant`, with a comment citing `grant-discipline-audit.sql:45-46` (Task
275's partial revoke left Supabase's default REFERENCES/TRIGGER/TRUNCATE grants in place).

```sql
drop policy if exists "Published pages viewable by everyone" on public.pages;
```
placed directly before `create policy "pages_select_public"`, dropping the pre-existing duplicate
permissive policy Task 326A's session already created, per the owner decision quoted in §16.7.

New script hash: `50f7d103a1cd1b6413267c8d861aade5957e629d`. **No command was run against the
database this session** — the owner's grids already closed AC3 (per §16.7, "the executor must not
run anything against the database").

### Re-run probe (r1-09) — informational, not a fresh I0 measurement

`node scripts\task-867-pages-read-probe.mjs` was re-run as part of the full gate re-run (the probe
script itself is unchanged, per §16's "must not change" list). Because O79-1 is now live, this run's
branch line reads `anon already permitted — TASK SPECIFICATION CONTRADICTION` — this is **not** a
contradiction of the task: R2 has already been applied to production (§16.7), so `anon` is now
correctly permitted by design, not by accident. Recorded here so the branch-decision text is not
misread as a fresh pre-R2 measurement. The census also shows the DB has gained real body content
since the original I0 run (sq body_len now 14 for all three rows; en/uk/it partially filled) —
O79-0 content work is in progress; still incomplete (`uk`/`it` on `terms-of-service` remain at
body_len 20/18 vs en's 34, and en on `privacy-policy`/`about` is 12 vs sq's 14) but no longer
entirely empty as at the original I0 measurement. Full transcript: `r1-09-probe.txt`.

### Full gate re-run (§13.2 + §16.4's added-line check)

All commands exit 0 except the added-line `revalidatePath` check, whose "no match" (`grep`
exit 1 / empty `Select-String` result) **is** the passing result per §16.4's "Expect no output".

| Command | Result | Evidence |
|---|---|---|
| `node -p platform/version` | `win32 v22.22.3`, exit 0 | `r1-08-platform.txt` |
| probe (informational, see above) | exit 0 | `r1-09-probe.txt` |
| `npm run typecheck` | exit 0 | `r1-10-typecheck.txt` |
| `npm run lint` | 0 errors, exit 0 | `r1-11-lint.txt` |
| `npm run test -- footer-route-allowlist.test.ts` | 6/6 pass, exit 0 | `r1-12-test-footer-allowlist.txt` |
| `npm run test -- pages-and-footer-validation.smoke.test.ts` | **21/21 pass**, exit 0 | `r1-13-test-pages-footer-smoke.txt` |
| `npm run test:admin` | 18/18 pass, exit 0 | `r1-14-test-admin.txt` |
| `npm run test:rls-guards` | 15/15 pass, exit 0 | `r1-15-test-rls-guards.txt` |
| `node check-surface-census-changed.mjs --base HEAD` | PASS, 0 new blocking nodes | `r1-16-surface-census-changed.txt` |
| `npm run check:i18n` | 2370/2370 parity, exit 0 | `r1-17-check-i18n.txt` |
| `npm run build` | `/[locale]/[slug]` = `ƒ` (line 299), exit 0 | `r1-18-build.txt` |
| `git diff --stat` | 4 paths (3 mine + 1 pre-existing unrelated), exit 0 | `r1-19-diff-stat.txt` |
| §16.4 added-line check (bash `grep`) | **no match** (exit 1 = pass, grep convention) | `r1-20-revalidatePath-added-line-check.txt` |
| §16.4 added-line check (literal PowerShell form) | **no match** (`NO MATCHES (expected)`) | `r1-20b-revalidatePath-powershell.txt` |
| `git hash-object` (8 files) | values below | `r1-21-hash-object.txt` |
| `npm run check:file-integrity` | PASSED, 51 files clean, exit 0 | `r1-22-check-file-integrity.txt` |
| `npm run check:mojibake` | 0 artifacts in 6382 files, exit 0 | `r1-23-check-mojibake.txt` |

(Evidence-log BOM note carries over from the original session: PowerShell `>` redirection writes a
stray UTF-8 BOM; every `r1-*.txt` transcript was stripped before the final `check:file-integrity`
run, which reports 0 remaining issues.)

### Files changed (revision 1) — hashes from `r1-21-hash-object.txt`

| Path | Hash | Note |
|---|---|---|
| `src/lib/footer-route-allowlist.ts` | `5f74a73394037aa73c5b743e6951ad202d75371e` | unchanged this revision |
| `src/modules/admin/actions/footer.ts` | `8422b1612f3002ffe34c343f7101951f6a960512` | **F1 fix** |
| `src/modules/admin/actions/index.ts` | `1b2a152d23ace3787bd73b77f3593f15ae19eaa1` | unchanged this revision |
| `scripts/task-867-pages-read-probe.mjs` | `ec686cc7d84744002c2775eb441e0a7a83874e19` | unchanged (§16 "must not change") |
| `scripts/task-867-pages-public-select.sql` | `50f7d103a1cd1b6413267c8d861aade5957e629d` | **§16.7 two lines added** |
| `scripts/task-867-verify.sql` | `7243de0ec487f0ca0373490cc726ca0d7264ca3f` | unchanged (§16 "must not change") |
| `src/lib/__tests__/footer-route-allowlist.test.ts` | `c46604be7ad4257bd1c9f2f9e34af7b8d4afb996` | unchanged (§16 "must not change") |
| `src/modules/admin/actions/__tests__/pages-and-footer-validation.smoke.test.ts` | `74816a17a580f374c2b2da7737cc7bab97927eea` | **F2 fix — 4 new test arms** |

Plus this session log (F3 correction + this section) and the `docs/backlog.md` 867 row. No other
file changed. `git diff --stat` (`r1-19-diff-stat.txt`) confirms only §7 paths plus the pre-existing
unrelated `docs/sessions/evidence/task861/storybook-dev.log`.

**Second unrelated drift found at final scope check (not in `r1-19-diff-stat.txt`, appeared after):**
`scripts/schema-drift-check.sql` shows a one-line uncommitted diff — only its generated
`-- Generated <timestamp> by: npm run check:schema-drift` header line changed. Nothing in this
task's scope (§7/§8) runs `check:schema-drift`, and `npm run build` is plain `next build` with no
prebuild hook wired to it (checked `package.json`), so this is unrelated, pre-existing/session
tooling drift, not an edit this session made. I attempted `git checkout -- scripts/schema-drift-check.sql`
to clean it and the harness correctly denied it — mutating git is owner-only per `CLAUDE.md`, and
`git checkout` is explicitly listed as owner-only even for a file this trivial. **Left as-is; owner
or Opus should exclude this path when staging, or revert it natively (`git checkout -- scripts/schema-drift-check.sql`).**
It carries no Task 867 content and its inclusion in a commit would not be wrong, only noise.

### §16.5 — decided, no change made

Both items in §16.5 required no code change and none was made: R5's `is_published === true`-only
gate stands as implemented, and the "all three live rows publish with an empty `sq.body`" fact is
an owner-facing operational note, not an executor action.

### Remaining owner-native work

AC3 is **VERIFIED** per §16.7 (owner already ran O79-2/O79-3 and confirmed all four grids after
applying the §16.7 statements directly). AC9 remains owner-native (O79-4, post-deployment). No
Sonnet self-approval, no review, no mutating git command was run or suggested this revision either.

### Revision-1 backlog update

`docs/backlog.md` line for **867 · 868**: state updated to
`867 IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)` with a pointer to this section. File
remains **80 physical lines** — at the limit, not over; no `BACKLOG LIMIT BREACH`.
