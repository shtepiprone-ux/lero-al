---
name: review-task
description: Review a Lero.al implementation as Opus — tools first, then the OWASP diff-based secure code review held against the current Cheat Sheet Series (scripts/quality/owasp.mjs review), and the acceptance criteria; issue the verdict. Do not implement product code during review.
---

# Review a task (Opus)

1. Read the kickoff, `.claude/rules/flow.md` §3 and `.claude/rules/secure-code-review.md`. Refresh the reference:
   `node scripts/quality/owasp.mjs sync` and `node scripts/quality/owasp.mjs check` exit 0 (a sheet changed upstream since
   the kickoff was written is re-read and re-mapped before the review continues).
2. Tools first, on the candidate commit: `node scripts/quality/check-ruleset.mjs` (the `main` ruleset has not drifted),
   CI (`gh pr checks <n>`) or locally `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
   `node scripts/quality/changed-lines-coverage.mjs --base main`, `node scripts/quality/check-files.mjs --all`,
   `node scripts/quality/product-gates.mjs`; then
   `npm audit --omit=dev --audit-level=high`, CodeQL alerts, and the change report
   (`node scripts/quality/change-report.mjs main HEAD`). Live configuration (`secure-code-review.md` §1.5): a diff that
   touches SQL, RLS, grants, a data write, authentication or roles runs `node scripts/quality/db-catalog-audit.mjs`; an
   upload or image path runs `node scripts/quality/cloudinary-config.mjs`. A violation the change creates, or one the
   kickoff says it removes and the tool still reports, is a finding.
3. Read the whole diff, every file, tests and generated files included. The executor's report is a supplier assertion:
   rerun each claim; a claim that does not reproduce is a finding.
4. The six diff-based steps and the checklist of each category the diff touches. Visible UI: the `.claude/rules/shared/`
   UI rules against the actual code and Stories.
5. `node scripts/quality/ac-tests.mjs --base main <kickoff>` exits 0 (every named test exists; every AC new or changed
   against `main` has its test added or changed). Each acceptance criterion: find it in the code and run its test yourself; undo the product change in the working tree
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
8. Quality check of the review: `node scripts/quality/check-files.mjs <kickoff>` and
   `node scripts/quality/owasp.mjs review <kickoff> --base main` exit 0; every `APPROVED WITH NOTES`
   note is fixed now or filed as a numbered task in the same turn (golden rule, `flow.md`: no gap is only reported).
   Before handing the commit to the owner: `node scripts/quality/owasp.mjs gate --base main` exits 0, so the CI task
   gate passes with this review.
9. On approval: give the owner the commit / push / PR commands (where to run them, what they change; no AI attribution),
   naming the sensitive paths the owner must approve. After the merge, check the `main` CI run.
