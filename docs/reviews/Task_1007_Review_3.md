# Task 1007 — Review 3

Kickoff: [Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1007_A_Moderator_Opens_Only_The_Admin_Pages_Switched_On.md) · OWASP record: [Task_1007.json](../security/owasp/reviews/Task_1007.json) · Previous: [Review 2](Task_1007_Review_2.md)

Review 3 of pull request #70 at dd2a28ba5 (checklist V14, the red CI) — NEEDS REVISION
Scope: the CI run 45366677787 of pull request #70; the five commits are signed (`gh api repos/:owner/:repo/pulls/70/commits`: `verified=true`, `valid`).
Tools (2026-11-24): `gh pr checks 70` → `CI Required` fail; red: "Lint, types and product checks", "Unit and component tests", "Click-shield"; green:
Authorization regression (AC3 `[SEC-1007-PAGE-SWITCH]` included), Change report, CodeQL, Dependency audit, OWASP task gate, SBOM, Secret scan, Storybook build,
Homepage grid, Locale leak 1-6, zizmor, Vercel. Each red job read with `gh run view 45366677787 --job <id> --log-failed`.
Findings: Critical 0, High 0, Medium 2 (F2, F3), Low 1 (F4, fixed by Opus in this review)
Overall risk: no product defect; the gate tools see two places the change reaches that the kickoff did not name (the Click-shield walk and a coverage
line), and five kickoffs of other tasks cite a commit GitHub no longer holds.

## Findings

F2 — the changed line of `AdminShell` runs in no test
Severity: Medium      Category: Tests (`quality-gates.md` §8)      CWE: none
Location: src/components/admin/AdminShell.tsx:27
Description: the line that hands `allowedPaths` to `AdminSidebar` is a changed product line; `AdminSidebar.pages.test.tsx` renders the sidebar alone and
replaces `AdminShell` with a double in its layout cases, so no test renders the shell.
Impact: "Unit and component tests" fails: "src/components/admin/AdminShell.tsx: none of 1 changed executable line(s) runs in a test (lines 27)"
(`changed-lines-coverage.mjs`, 206/222 lines covered overall).
Recommendation: a test renders the real `AdminShell` with `allowedPaths` (for example `['/admin/listings']`) and asserts that the sidebar shows only the
allowed item; the presence and freshness hooks may be doubles.
Status: Revision 2 R2-1.

F3 — the Click-shield walk still expects every admin page for a moderator
Severity: Medium      Category: Tests (the CI walk of signed-in pages)      CWE: none
Location: scripts/check-signed-in-pages.mjs:68, :78, :79 (the route table `:64-85`)
Description: the walk's route table gives a moderator `STAFF_ONLY` (the page) on every admin route but Permissions. Since Task 1007 a moderator gets
`notFound()` on Footer (O1007-1) and on any page whose switch is off; the switches are role-wide rows of the live project, so the walk's moderator results
follow them: `page.popular_locations` and `page.property_types` are off (the owner's switches, Review 2 "After the apply").
Impact: "Click-shield" fails 6 of 216 rows: "FAIL moderator /admin/footer", "/admin/popular-locations", "/admin/property-types" at 1280 and 390,
"status 404 where the page was expected".
Recommendation: `/admin/footer` takes `ADMIN_ONLY`. For every row of a page key (the paths of `ADMIN_PAGES`, the `/admin/inquiries` and `/admin/legal`
redirects included), the moderator's expected result follows that key's switch, read from `role_permissions` with the service role just before the
moderator visits the row (the walk never writes a switch: the rows are role-wide and the walk reads only): on → the expectation of today; off →
`NOT_FOUND`; `/admin` → the landing of `src/app/admin/page.tsx:29-44` (the dashboard with `page.dashboard`, else the redirect to the first page switched on
other than the dashboard, else the page with the no-pages state). The key list comes from `ADMIN_PAGES`, not a copy. Cases in
`scripts/__tests__/check-signed-in-pages.test.ts`: Footer is not found for a moderator; a key switched off gives `NOT_FOUND` and a 200 on it fails; the
three landing outcomes. Reading per row keeps a switch toggled by the Authorization regression job (AC3 switches `page.users` off and on) from
turning into a wrong expectation for a whole run.
Status: Revision 2 R2-2.

F4 — five kickoffs of other tasks read their sources at a commit GitHub no longer holds
Severity: Low      Category: Agent and tool output (`check-files.mjs`)      CWE: none
Location: the "Read at" line of the kickoffs of Tasks 959 (`:43`), 985 (`:17`), 1006 (`:30`), 1008 (`:16`), 989 (`:23`)
Description: `1d625874c` was a commit of a branch merged by squash as #49 (`213103f0a`); the merged branches were deleted on GitHub on 2026-11-24, so CI
(`fetch-depth: 0`) no longer has it (`git log --all` does not reach it; locally it is a dangling object). Not caused by Task 1007; it fails every pull
request and the next `main` run.
Impact: "Lint, types and product checks" fails: `check-files.mjs --all` → "1d625874c is not a commit of this repository" in 5 files.
Recommendation and fix: each line now reads `213103f0a` (on `main`: `git merge-base --is-ancestor 213103f0a main`); `git diff --stat 1d625874c 213103f0a
-- src supabase scripts` is empty, so every cited source line is the same; `check-files.mjs` on the five files → exit 0.
Status: fixed by Opus in this review (documentation, uncommitted; it goes into the pull request with Revision 2).

## Notes

- AC3 (`[SEC-1007-PAGE-SWITCH]`) passed on the real database in the Authorization regression job: the switch is the administrator's, each change writes
  its event with the actor, a moderator is refused, an unknown key is `validation`.
- The Change report, the OWASP task gate (Review 2 `APPROVED` with its record) and CodeQL passed.

## Revision 2 (Sonnet; only these items)

- R2-1 (F2) a test renders `AdminShell` with `allowedPaths`; only the allowed sidebar items show.
- R2-2 (F3) `scripts/check-signed-in-pages.mjs`: Footer `ADMIN_ONLY`; a moderator's expectation on the rows of a page key follows the live switch, read
  just before the visit; cases in `scripts/__tests__/check-signed-in-pages.test.ts`.

Open parts, in order: Revision 2 (Sonnet) → Review 4 → the commit and push to pull request #70 (H) → `gh pr checks 70` → the merge → the moderator check of
Route step 5 → the archive (H7).
