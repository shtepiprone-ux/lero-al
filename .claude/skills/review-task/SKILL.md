---
name: review-task
description: Review a Lero.al implementation as Opus — tools first, then the OWASP diff-based secure code review held against the current Cheat Sheet Series (scripts/quality/owasp.mjs review), and the acceptance criteria; issue the verdict. Do not implement product code during review.
---

# Review a task (Opus)

1. Read the kickoff, `.claude/rules/flow.md` §3 and `.claude/rules/secure-code-review.md`. Refresh the reference:
   `node scripts/quality/owasp.mjs sync` and `node scripts/quality/owasp.mjs check` exit 0 (a sheet changed upstream
   since the kickoff was written is re-read and re-mapped before the review continues; the remap is a change and starts
   the passes again).
2. Before any test or gate, the self-review of `flow.md` §2 step 4: every file of the revision read in full, every
   changed line checked, three clean passes in a row; a hunk no Scope item needs is a finding, and so is a change that
   does not remove the kickoff's "## Cause".
   Tools first, on the candidate files: `node scripts/quality/check-ruleset.mjs` (the `main` ruleset has not drifted),
   then the CI-parity rule of `flow.md`: read `.github/workflows/ci.yml` now and run every `run:` step of every job that
   needs no secret and no live project, exactly as written (`BASE_SHA=origin/main`, `HEAD_SHA=HEAD`), installing with
   the npm of the job's `node-version` (`npx --yes npm@10.9.8 ci` for Node 22.22.3), never a subset or other flags.
   After GitHub has run a commit, a red job is fixed at its cause and only its steps run again. Only the jobs that need secrets
   or GitHub (`authz`, the rest of `click-shield`, `codeql`, `secrets`, `workflows`) are read on the pull request with
   `gh pr checks <n>` and stay `UNKNOWN` until then; a failure there is fixed in the same pull request, also after an
   approved verdict. Live configuration (`secure-code-review.md` §1.5): a diff that
   touches SQL, RLS, grants, a data write, authentication or roles runs `node scripts/quality/db-catalog-audit.mjs`; an
   upload or image path runs `node scripts/quality/cloudinary-config.mjs`. A violation the change creates, or one the
   kickoff says it removes and the tool still reports, is a finding.
3. Read the whole diff: every file that differs from the commit the revision started from, tests included; a generated
   file through the tool that checks it (`package-lock.json`: `change-report.mjs --lockfile-age`,
   `install-scripts.test.mjs`, `npm audit`; `docs/security/owasp/sheets.json`: `owasp.mjs check`; `supabase/catalog.json`:
   `db-catalog-audit.mjs --snapshot supabase/catalog.json`). The rest of the branch was read by the earlier
   reviews in the kickoff's "## Review" (`secure-code-review.md` §1.4). The executor's report is a supplier assertion:
   rerun each claim; a claim that does not reproduce is a finding, and so is an unlabelled assumption in the report or
   in a file (`flow.md`, facts rule). A recommendation to the owner cites what was read (the code of the form or page).
4. The six diff-based steps and the checklist of each category the diff touches. Visible UI: the `.claude/rules/shared/`
   UI rules against the actual code and Stories.
5. Each acceptance criterion: find it in the code and run its test yourself; undo the product change in the working tree
   once and confirm the test fails, then restore (`.claude/rules/quality-gates.md` §8). A criterion changed by a revision
   has a changed test. Security tests: confirm at least one case per entry point fails without the control (deliberate
   break, restored afterwards).
6. OWASP: `node scripts/quality/owasp.mjs review <kickoff> --base main` lists every sheet of the kickoff's "## OWASP"
   and every sheet the actual diff triggers (a diff can reach further than its design). For each, read the requirement in
   the sheet text and check the diff against it; write `docs/security/owasp/reviews/Task_<n>.json` (`kickoff-template.md`): `met` with the quote and the
   evidence you ran, `finding F<n>`, or `not applicable` with a reason. A protection the diff should have and lacks is a
   finding, also when the kickoff did not ask for it.
7. Write the review summary and the findings (templates in `secure-code-review.md`) into the kickoff's "Review" section.
   `NEEDS REVISION` at most twice per task; after the second, report to the owner with a proposed scope cut.
8. Quality check of the review, never in part (`flow.md` §3), once the review, its verdict and the OWASP record are
   written: `node scripts/quality/check-files.mjs <kickoff>` and `node scripts/quality/owasp.mjs review <kickoff> --base
   main` exit 0; on approval `node scripts/quality/owasp.mjs gate --base main` exits 0 (the CI task gate passes with
   this review). Every `APPROVED WITH NOTES` note is fixed now or filed as a numbered task in the same turn (golden
   rule, `flow.md`: no gap is only reported).
9. On approval: give the owner the commit / push / PR commands (where to run them, what they change; no AI
   attribution; a `git add` naming every changed file), naming the sensitive paths the owner must approve.
10. After the push: `gh pr checks <n>` until every check has concluded; a run in progress is reported as in progress.
    A failure is opened to its log line (`gh run view <id> --log-failed`) and fixed in the same pull request, also
    after an approved verdict. After the merge, check the `main` CI run the same way.
