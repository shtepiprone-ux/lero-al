---
name: review-task
description: Review a Lero.al implementation as Opus — tools first, then the OWASP diff-based secure code review held against the current Cheat Sheet Series (scripts/quality/owasp.mjs review), and the acceptance criteria; issue the verdict. Do not implement product code during review.
---

# Review a task (Opus)

1. Read the kickoff, `.claude/rules/flow.md` §3 and `.claude/rules/secure-code-review.md`. Refresh the reference after
   the three passes of step 2 (a session that changes nothing counts its runs from its first command, so a run before
   the passes breaks them): `node scripts/quality/owasp.mjs sync` and `node scripts/quality/owasp.mjs check` exit 0 (a
   sheet changed upstream since the kickoff was written is re-read and re-mapped before the review continues; the
   remap is a change and starts the passes again). What this writes stays within the review's read set:
   `docs/security/owasp/sheets.json` is a generated file (`read-coverage.mjs` takes the session's own `owasp.mjs check`
   as its proof), and `controls.json` is read only by the objects the remap changed.
2. Before any command off the read-only allow-list, the self-review of `flow.md` §2 step 4: every file of the revision
   read in full, every changed line checked, three clean passes in a row, and
   `node scripts/quality/read-coverage.mjs --review <the commit the revision started from>` exits 0 (the review runs in
   a session of its own; the commit is an ancestor of HEAD); a hunk no Scope item needs is a finding, and so is a change that does not remove the kickoff's "## Cause".
   The implementer's `read-coverage.mjs` output is checked: missing or exit 1 is a finding; when the implementer's
   record is on this machine (`<session id>.jsonl` under any `~/.claude*/projects/<project>/`: each account has its own
   config folder; searched only with a read-only `find` or `ls`, as any other command naming a projects folder of a
   config folder touches the reviewer's own record), rerun it with `--transcript <record> --review <the same commit>` on a tree equal to the candidate
   commit (the reviewer's own uncommitted edits set aside first), and read every command
   that session ran and every script it wrote or ran (in its record and its subagents'): the tool sees an Edit or Write
   of the record and a command naming it, not a program that writes it, so a write to the session record found there
   is a finding (owner, O956-3; `flow.md` §3).
   Tools first, on the candidate files: `node scripts/quality/check-ruleset.mjs` (the `main` ruleset has not drifted),
   `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/changed-lines-coverage.mjs
   --base main`, `node scripts/quality/check-files.mjs --worktree` and `node scripts/quality/change-report.mjs main HEAD`.
   Every other job (product gates, `npm audit`, SBOM, CodeQL, gitleaks, zizmor, the browser and `security-ci` jobs) is
   read on the pull request with `gh pr checks <n>`; a failure there is fixed in the same pull request, also after an
   approved verdict. Live configuration (`secure-code-review.md` §1.5): a diff that
   touches SQL, RLS, grants, a data write, authentication or roles runs `node scripts/quality/db-catalog-audit.mjs`; an
   upload or image path runs `node scripts/quality/cloudinary-config.mjs`. A violation the change creates, or one the
   kickoff says it removes and the tool still reports, is a finding.
3. Read the whole diff: every file of the read set as `read-coverage.mjs` defines it, tests included; a generated file
   through the tools it names (`package-lock.json`: `change-report.mjs --lockfile-age`, `install-scripts.test.mjs`,
   `npm audit`; `docs/security/owasp/sheets.json`: `owasp.mjs check`). The rest of the branch was read by the earlier
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
