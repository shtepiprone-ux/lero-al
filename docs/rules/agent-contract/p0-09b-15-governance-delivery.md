9b. **Governance regressions and violations are fail-closed release blockers.** For every implementation task that
    changes a file scanned by governance, the executor must establish the starting governance state before the first
    relevant write and run the full final gate after the last relevant write:

    ```powershell
    npm.cmd run governance
    ```

    The completion report records the exact command, platform, exit code, per-scanner HIGH/CRITICAL counts, and the
    applicable baseline comparison. A non-zero result, a HIGH/CRITICAL finding not in the per-finding baseline, a
    stale baseline entry, or a required scan that
    was not run means the task is not complete: fix the increment in the same task, or return `PARTIALLY IMPLEMENTED`
    / `BLOCKED`. A planned migration, an expected weekly scan, an assertion that a finding is pre-existing, or a
    future cleanup task never converts a failing governance result into a completion claim.

    A dirty starting worktree or a pre-existing failing gate does not erase this duty. Record the initial result and
    retain final same-worktree or exact-commit CI evidence that the task added no governed regression; where that
    attribution cannot be proved, stop for review instead of claiming a green result. Never raise
    `scripts/governance/baseline.json`, add a broad allowlist, or append an inline comment merely to make a scanner
    pass. A narrow exception is valid only when the scanner enforces it mechanically and it carries the owner's
    written decision, a precise path/rule scope, a safety rationale, an expiry, and a test that proves the exception
    cannot mask other findings. If the scanner has no such mechanism, the task remains blocked until the violation is
    fixed or the governance tooling is changed and reviewed as its own scoped task.

10. **Session evidence, backlog, and git ownership stay accurate.** Every completed implementation task updates
    `docs/backlog.md` with concise current task state and adds a session log under `docs/sessions/` with a
    "Files Changed" table matching the real diff. Sonnet does not add detailed history to the backlog and flags a
    `BACKLOG LIMIT BREACH` when it cannot keep the file at or below 80 lines. Opus validates Sonnet's backlog/session
    evidence against the real diff, then corrects or consolidates the backlog as needed. Before `APPROVED` or
    `APPROVED WITH NOTES`, Opus alone removes closed or confirmed stale closed/superseded items from active backlog
    state and adds concise `docs/backlog-archive.md` ledger rows; any surviving owner follow-up is a separate active
    item. Agents may use read-only git
    for inspection. Mutating git is owner-only and native PowerShell only. Sonnet neither runs, emits, suggests, nor
    delegates mutating git commands, including any `git push` form, and it cannot approve its own task. Opus alone
    may issue an approval verdict after review; it may emit explicit-path commit commands after verified task design
    or approved review, and a push command only after an approved review, using the single handoff protocol in
    `docs/orchestrator-procedures.md`. Every permitted commit handoff is an unattributed owner commit: neither
    `Co-Authored-By` nor any other AI/agent credit or `--author` is allowed in its command or message.

11. **Mobile and overlay behavior remain protected.** For in-scope UI below 640px, text controls use the full
    available width, mobile-reachable controls provide adequate touch targets, labels wrap without horizontal
    overflow, and popups follow the current Mantine or legacy bottom-sheet contract for that surface. Icon-only or
    domain-specific exemptions must be explicit.

12. **Rendered evidence follows risk.** UI compilation is only a baseline. Q2 requires targeted rendered evidence;
    Q3/Q4 visual work requires the full proof path and locale/viewport matrix defined by `docs/qa-profiles.md` and
    the relevant UI document. Missing required rendered evidence blocks approval.

13. **Storybook and no-hardcode gates remain enforceable.** Work touching stories, story-rendered primitives, or
    visual governance must follow the current Mantine or legacy Storybook proof path, use locale-backed visible
    strings, avoid forbidden raw controls, and provide machine-produced evidence when Q3/Q4 requires it. A green
    typecheck or Storybook build is not rendered proof.

14. **File integrity and encoding must be protected.** Touched text/source files remain UTF-8 without BOM, without
    NUL bytes, parseable where applicable, complete, and free of mojibake. Use owner-native or CI evidence as the
    authority when a sandbox read looks suspicious; a sandbox anomaly is a screen, not a verdict. A mechanical write
    to more than one file requires an explicit relative-path manifest, enforced before every write; a bare directory
    or recursive glob is never a write scope. The task must state any permitted directory root, extensions,
    exclusions, and expected count. A manifest/count mismatch is `SCOPE GUARD FAILED`, with no write performed.

15. **Critical flows require regression proof.** If a task touches a flow in `docs/critical-flow-registry.md`, it
    must establish the existing baseline, preserve or add automated coverage for the changed behavior, and record
    the command/evidence. Manual checking alone is not enough for critical-flow closure.

