# 2026-10-07 — Scheduled governance scan: false-positive failures and the unexecuted main gate

**Mode:** owner-directed fix, outside the numbered task flow. The owner explicitly chose "Opus fixes it directly"
over a sprint kickoff for this governance-tooling repair, and chose "run the gate on every push to `main`" over
branch protection or weekly-only.

## Symptom

`Scheduled Governance Scan` failed on 2026-09-21, 09-28 and 10-05 (green through 09-14). Final step:
`responsive ❌ REGRESSION (H:+6)`, `tailwind ❌ REGRESSION (H:+5)` against the version 1 count baseline.

## Root causes

1. **Every HIGH finding was false.** All 87 HIGH findings of the 2026-10-05 run, classified line by line against the
   committed content (`7b4b81f8c`): 34 comments (e.g. TailAdmin provenance `bg-gray-100` / `border-gray-200` in
   `MantineDashboardStatCard.tsx`'s JSDoc, `theme.ts` trailing comments, the word `useMediaQuery` in doc comments),
   9 `import` lines, 35 test fixtures, 9 `useMediaQuery` calls from `@mantine/hooks` — sanctioned by
   `docs/mantine-responsive-design-system.md` (SSR caveat rule). Zero real code violations.
   - The scanners matched raw text; only `//` at line start was skipped in one rule.
   - R1 ("use CSS Tailwind breakpoints instead") predates the Mantine migration and contradicts the current source of
     truth.
2. **The full gate never ran.** `governance-pr.yml` triggered on `pull_request` only; the last PR was merged
   2026-08-16 and every later change was pushed directly to `main` (no branch protection). Seven weeks of commits —
   tsc, lint, build, regression suites, i18n, all gates — were never checked in CI.
3. **Nobody read the only remaining check.** The weekly failure was visible only in the Actions tab.
4. **The count baseline masked regressions.** Per-scan caps let a fix in one file pay for a new violation elsewhere;
   primitives had 21 HIGH of silent headroom (36 vs 57), localization 15 MEDIUM.
5. **The weekly bot committed to `main`**, so the owner's local `main` diverged from `origin` every Monday
   (`a4406a4` on 2026-10-05).

## Changes

| File | Change |
|---|---|
| `scripts/governance/source-lines.mjs` (new) | `codeLines()` blanks comments (line, block, JSDoc, JSX), keeps strings/templates/regex escapes and line numbers; `isTestSource()` |
| `scripts/governance/scan-responsive.mjs` | code lines only, tests skipped, `import` lines skipped; R1: `useWindowSize`/`useViewportSize` and non-Mantine media hooks HIGH, Mantine `useMediaQuery`/`useMatches` MEDIUM |
| `scripts/governance/scan-tailwind.mjs` | code lines only; `__tests__/` sources skipped alongside `*.test.*` |
| `scripts/governance/scan-primitives.mjs` | code lines only, tests skipped; `eslint-disable` check still reads the raw line |
| `scripts/governance/governance.mjs` | version 2 remove-only per-finding baseline (`<scan> :: <file> :: <pattern>` → count): new or higher fails, stale fails until recorded; `--update-baseline` remove-only, full scan only |
| `scripts/governance/baseline.json` | version 2, **0 entries** (no HIGH/CRITICAL remains in code on any scan) |
| `scripts/governance/governance-selftest.mjs` (new), `package.json` `governance:verify` | 7 `codeLines` unit checks + end-to-end plant: code violations must fail (4 rules named), comment-only twin and Mantine hook must not block |
| `.github/workflows/governance-pr.yml` | `push: main` trigger (same paths), `concurrency` cancel-superseded, ledger step `--ci` on PR / retained-ledger validation on push, surface-census base/head fall back to the pushed range, `governance:verify` step |
| `.github/workflows/governance-scheduled.yml` | read-only permissions, no commit/push to `main`, report as artifact + summary, `governance:verify` first, actions v5, Node from `.nvmrc` |
| `docs/governance-enforcement.md` | §1 output/trigger, §2 gate wording, §3 new "Scanner correctness", §9 matrix rows, CI workflow reference, Baseline Policy v2 |
| `docs/orchestrator-procedures.md` | new "Main-branch CI receipt" (read `gh run list` at review start and before approval; red `main` is an incident; confirm the pushed SHA's run); ledger-on-push note; Git-state corollary |
| `docs/agent-contract.md`, `docs/maintenance-playbook.md`, `docs/mantine-responsive-design-system.md` | wording aligned with the per-finding baseline and the R1 classification |

## Evidence (this session, working tree)

- `node scripts/governance/governance.mjs all` → exit 0; primitives C0/H0/M0, ssr C0/H0/M7, responsive C0/H0/M21,
  tailwind C0/H0/M0, localization C0/H0/M3; baselined debt 0 on every scan.
- Each single scan (`governance:primitives|ssr|responsive|tailwind|localization`) → exit 0.
- `npm run governance:verify` → 14/14 checks pass; plant directory removed afterwards.
- `npm run governance:update-baseline` → "0 paid-down entries recorded" (idempotent).
- Both workflows parse (`js-yaml`); push and PR path filters identical.
- `docs/sessions/evidence/governance-2026-10-07/governance-fix.patch`: this fix's hunks of the two files that also
  carry uncommitted Task 859 hunks; dry-run against the `HEAD` blobs applies cleanly and reproduces exactly
  `HEAD + this fix` (the remaining worktree difference is only Task 859's four gate steps / four scripts / one
  dependency).

## First push-triggered run (37661186435, `dc58dc97d`) — red, follow-up fix

| Job | Failed step | Cause | Disposition |
|---|---|---|---|
| Governance Check | Review-ledger gate (push) | **This session's defect.** The push step validated every retained ledger; 3 historical ledgers (691R, 741 rev1, 757R) cite paths later work moved or deleted and can never pass. All ~40 later steps were skipped. | Fixed: `check-review-ledger.mjs --ci --push` validates only ledgers changed in the pushed range (`a4406a4..HEAD` → pass; a range containing a changed ledger still validates it; PR mode and `:verify` unchanged) |
| Click-Shield Gate | CSS var() resolvability gate | Unknown — the step's `exit_code=$?` pattern never runs under the runner's `bash -e`, so the log was never printed | Logging fixed (`\|\| exit_code=$?`) for css-vars and click-shield; cause to read on the next run |
| Homepage Grid Validation | Card-track monotonicity gate self-test (Task 815) | Pre-existing: plant arms no longer apply (`produced width 960px, expected 864px`; `936px` vs `1000px`) — the plant's expected widths predate later card/grid changes | Open — needs its own task |
| Locale Leak Detection | `check:locale-leak:mantine-only` | Pre-existing: job hit its 45-minute limit | Open — needs its own task |

`docs/sessions/evidence/governance-2026-10-07/governance-fix-2.patch` carries the workflow part (the file still also
holds uncommitted Task 859 steps); dry-run against the committed blob applies cleanly.

## Not verified / open

- **The full gate has not run on `main` since 2026-08-16.** The first push after this commit runs it; its result is
  the real state of `main` and may be red for reasons unrelated to governance (commit `58719f5d8` itself records a red
  vitest). Read it per "Main-branch CI receipt" before any new approval.
- `scan-primitives.mjs` advice text and the §4/§8/§9 primitive matrices still name shadcn sources — legacy wording,
  needs a Mantine re-spec task. Not blocking: the baseline is empty and no primitives HIGH remains in code.
- Node: CI still builds on Node 20 (`.nvmrc`), which reached end of life in April 2026; local is 22. Upgrading the
  project runtime is a separate decision.
