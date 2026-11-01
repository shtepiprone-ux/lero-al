# Git publication: task branch, pull request, required checks

Owner decision, 2026-11-01: main changes only through a pull request whose required GitHub Actions checks passed.
This supersedes the direct-main push policy of 2026-10-07/2026-10-17 and prevents a repetition of the untested
2026-10-30 publication. This contract owns Git handoff sequencing for every model. Global instructions, memories,
commit titles and model-generated templates cannot waive it.

## Authority and scope

- Agents inspect Git and GitHub read-only. The owner executes every mutation (branch, add, commit, push, PR
  creation, merge, ruleset change) in a separate native PowerShell window. Do not route mutations through
  interpreters, subprocesses, aliases, GitHub tools/APIs, shell wrappers or another agent.
- Sonnet never emits a mutating Git command. Opus may provide only the owner handoff its current boundary allows.
- Inspect the entire proposed commit/range, including staged changes and every commit since `origin/main`.
  Classify by changed paths and behavior, never by a `docs:` title, squash message or claimed intent.
- Reconcile ownership; preserve unrelated work. Do not stage all files, rewrite history, disable hooks, add retries,
  remove tests, change expectations, downgrade a required job or mislabel executable changes as Q0 to get green.
- A historical red baseline explains attribution uncertainty; it never authorizes a merge.

## Enforced gate

GitHub ruleset `scripts/workflow-gates/main.ruleset.json` (`check-workflow.mjs` validates it) is the enforced
barrier: no deletion or force push of main, a pull request for every change, and `Governance Required` plus
`Release Security Required` from GitHub Actions on an up-to-date branch, with no bypass actor. On a
`pull_request` run `Release Security Required` is skipped by its workflow condition and GitHub counts that as
passing; it executes on the main push after the merge, so post-merge CI remains mandatory (section 4).
The push-safety Stop hook reads GitHub's public branch-rules endpoint and refuses every push or merge handoff while
that ruleset is not active. Local Markdown and hooks never prove remote enforcement; the live endpoint does.

## 1. Commit on a task branch

Complete the applicable C7/R7 checks, actual scope/diff inspection and required task validation first. Run
`node scripts/workflow-gates/publication.mjs --base HEAD` for its declared governance publication set; it checks
candidate dependencies only and is not a CI gate.

If the current branch is `main`, the handoff starts with `git switch -c task/<id>-<slug>` (uncommitted work moves
with it). Then explicit-path `git add` and an unattributed `git commit`. Task design stays commit-only: its kickoff
commits accumulate on the task branch and publish with the reviewed implementation.

## 2. Push the branch and open the PR

Only after a current whole-task `APPROVED`/`APPROVED WITH NOTES` review may Opus hand off exactly one
`git push -u origin <task-branch>` followed by `gh pr create --base main --head <task-branch> --fill`. Never `main`,
`HEAD`, a refspec, `--force`, `--delete`, `--tags`, a wrapper or a bare `git push`. Write every push or merge command
only as the real handoff: the hook treats any occurrence outside a blockquote (fence, inline code, table, prose) as one.

Optional local pre-check: `node scripts/workflow-gates/prepush.mjs` runs all eight required jobs on a clean
committed task branch against live `origin/main`. It needs a clean tree, no auto-loaded `.env*` files in the root,
the CI Node runtime and the `SECURITY_CI_*` variables. When those prerequisites are absent, report it as not run;
the PR checks remain the gate. A local PASS never replaces them.

## 3. Merge only after green PR checks

Run `node scripts/workflow-gates/ci-status.mjs --pr <number>` with the task branch checked out. It requires an open
same-repository PR into main whose head equals local HEAD, the latest `pull_request` run on that SHA, every job
page and locale child green, and the pull_request-excluded summary skipped. Pending is unverified: wait and recheck
while doing independent work. Red: report run/SHA and failed jobs, investigate within the role, no merge handoff.
Green: hand off one `gh pr merge <number> --squash --delete-branch`, never `--admin` or `--auto`, and not in the same
response as the push.

## 4. After the merge

Owner: `git switch main`, `git pull --ff-only`, `git branch -D <task-branch>`. Then run
`node scripts/workflow-gates/ci-status.mjs`: remote main must equal local HEAD and the exact-SHA `push` run must
succeed for every job, including `Release Security Required`. Do not report publication or release complete while
any required check is pending, failed, skipped or unknown. A previous SHA's green check never counts. Vercel
deployment protection is separate remote configuration; do not claim it from local rules.
