---
name: review-task
description: Review a Lero.al implementation as Opus — tools first, then the OWASP diff-based secure code review held against the current Cheat Sheet Series (scripts/quality/owasp.mjs review), and the acceptance criteria; issue the verdict. Do not implement product code during review.
---

# Review a task (Opus)

1. Read the kickoff, `.claude/rules/flow.md` §3 and `.claude/rules/secure-code-review.md`. Refresh the reference:
   `node scripts/quality/owasp.mjs sync` and `node scripts/quality/owasp.mjs check` exit 0 (a sheet changed upstream since
   the kickoff was written is re-read and re-mapped before the review continues).
2. Tools first, on the candidate files: `node scripts/quality/check-ruleset.mjs` (the `main` ruleset has not drifted)
   and `node scripts/quality/ci-local.mjs` (every CI job the way CI runs it: lint, types, all tests with coverage,
   changed lines, every file, product gates, `npm audit`, SBOM, CodeQL, gitleaks, zizmor, Storybook, homepage grid,
   locale leak, the change report and the OWASP gate; the `security-ci` jobs are CI-only and their result is read with
   `node scripts/quality/pipeline.mjs ci-status <pr>`). A partial set of tools is not this step. Live configuration (`secure-code-review.md` §1.5): a diff that
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
8. Quality check of the review, step by step and never in part (`flow.md`, completeness rule and Pipeline), once the
   review, its verdict and the OWASP record are written: `node scripts/quality/pipeline.mjs run review <kickoff>` exits
   0. Its steps, in order: `owasp-sync`, `owasp-check`, `ruleset`, `claims` (the CI-claim corpus is current: new replies
   harvested, none unlabeled, every `ci` one caught; quick, so before the long run), `ci-local`, `ac-tests`,
   `kickoff-tests`, `owasp-review`, `kickoff-files`, `verdict` (a verdict line and the record exist) and `owasp-gate`
   (the CI task gate passes with this review). Under a `NEEDS REVISION` verdict the phase runs `ci-local` with
   `--hold owasp-gate` and skips `owasp-gate`, because the gate needs an approved task (`flow.md`, Pipeline). Every `APPROVED WITH NOTES` note is fixed now or filed as a numbered task in the same turn
   (golden rule, `flow.md`: no gap is only reported). The Stop hook refuses a verdict without this complete phase.
9. On approval: `node scripts/quality/pipeline.mjs run handoff` exits 0 on exactly the files to commit (steps
   `ruleset`, `claims`, `ci-local`, `owasp-gate`); then give the owner the commit / push / PR commands (where to run
   them, what they change; no AI attribution; a `git add` naming every changed file), naming the sensitive paths the
   owner must approve.
10. After the push: `node scripts/quality/pipeline.mjs ci-status <pr>` until every check concluded; every statement
    about the PR's CI, and every reply of a turn that looked at CI, quotes its last line. A failure is opened to its log
    line and closed by the golden rule. After the merge, check the `main` CI run the same way.
11. Every line of the review and of the reply that states a result names its source: `[CI: PR #<n>]` with this
    turn's `ci-status` line, `[локально: \`<command>\`]` for a command this turn ran, or `[pipeline: <phase>]`
    (`scripts/quality/provenance.mjs`; the Stop hook refuses a result without a backed source).
12. The `claims` step fails on an unlabeled reply: read it (`node scripts/quality/claims.mjs list unlabeled`) and judge
    it with `claims.mjs label <id> <ci|none|ambiguous> <reason>`. A `ci` reply the detector misses: add its wording to
    `claims.test.mjs` first (red), then widen `mentionsCi` in `claims.mjs` until it passes.
