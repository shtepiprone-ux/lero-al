### Task 384 — CORRECTIVE E (follow-up): wire `check:stories` + rendered-assert into CI (durable "hardcode never again")

> # 🔴 WHY. Task 380 delivered the gates and wired `check:stories` into `prebuild-storybook`/`prestorybook` (local
> enforcement). But they are NOT in any `.github` CI workflow — only `governance-pr.yml` runs on PRs, and it does
> NOT call `check:stories` or the rendered assert. So a PR that reintroduces hardcode / `layout:'centered'` / a
> `Ukrainian*` story passes CI as long as it skips `build-storybook`. This closes that hole. Orchestrator review:
> `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md` (FU-1).

Type:      corrective CI/governance wiring (follow-up to Task 380)
Priority:  HIGH (durability of the Sprint 33 enforcement)
Area:      `.github/workflows/governance-pr.yml` · (optionally `.github/workflows/governance-scheduled.yml`) ·
           `docs/storybook-governance.md` (§11 CI integration + §14.3)

## Required pre-read
`docs/agent-contract.md` (clause 13) · `docs/backlog.md` · `docs/storybook-governance.md` (§11 + §14) ·
`.github/workflows/governance-pr.yml` · `.github/workflows/governance-scheduled.yml` · `package.json` (scripts
`check:stories`, `check:i18n`, `screenshots:assert`, `screenshots:assert:fast`, `governance:screenshots:assert`).

## Current broken behavior (file evidence)
- `package.json`: `check:stories` runs only inside `prestorybook`/`prebuild-storybook`; `screenshots:assert` is a
  standalone script never invoked by CI.
- `.github/workflows/governance-pr.yml` steps: `lint`, `governance:primitives/ssr/responsive/tailwind/localization`,
  `governance` — **no `check:stories`, no `check:i18n` as a hard step, no rendered assert.**

## Required after behavior
1. **Add a blocking `check:stories` step** to `governance-pr.yml` (fails the PR on any story-gate violation).
2. **Add a blocking `check:i18n` step** (locale-parity, incl. `storybook.*`) if not already enforced as hard-fail.
3. **Add the rendered assert** to CI as a gating step: build Storybook once, then run
   `npm run screenshots:assert` (full) — or `screenshots:assert:fast` if full-matrix runtime is prohibitive on the
   runner — with `npx playwright install --with-deps chromium` in the job. The assert must FAIL the job on any
   `noHorizontalOverflow:false` / `fullWidthControlsAtMobile:false` cell. If Storybook build + Playwright is too
   slow for the main PR job, put the rendered assert in a dedicated labelled/parallel job (mirroring the existing
   `needs-storybook-check` pattern) but it MUST be required-to-merge, not optional.
4. Update `docs/storybook-governance.md` §11 to list the new CI steps and state that `check:stories` +
   rendered-assert are required PR gates (cross-ref §14.3).

## Exact files allowed to edit
`.github/workflows/governance-pr.yml`, `.github/workflows/governance-scheduled.yml` (only if adding the
weekly rendered-assert), `docs/storybook-governance.md`, `docs/backlog.md`, new session log. NO product code, NO
story edits, NO gate-script logic changes (those are owned by Task 380 — if the script needs a `--ci` flag, STOP&ASK).

## Current behavior to preserve
Existing governance steps keep running and keep failing on their own violations; runtime of the main governance
job stays reasonable (heavy rendered assert may live in a parallel required job).

## Positive flow
A PR with clean stories → CI runs `check:stories` (0 violations), `check:i18n` (parity), build-storybook, rendered
assert (all cells pass) → green. Merge allowed.

## Negative flow (must be demonstrated in the session log)
- A PR that adds `layout:'centered'` to a story → the `check:stories` CI step FAILs the job (show the step + the
  expected non-zero exit; a local `npm run check:stories` reproduction transcript is acceptable proof).
- A PR that makes a text control non-full-width at <640 → the rendered-assert CI step FAILs (local
  `screenshots:assert` reproduction transcript acceptable).
- A PR removing a uk `storybook.*` key → `check:i18n`/`check:stories` FAILs.

## Acceptance criteria
- AC1 `governance-pr.yml` contains a blocking `check:stories` step — file:line.
- AC2 `governance-pr.yml` contains a blocking `check:i18n` step — file:line.
- AC3 The rendered assert runs in CI as a required-to-merge step/job (Playwright install + build-storybook +
  `screenshots:assert[:fast]`), failing on any false assertion — file:line + the job/branch-protection note.
- AC4 Negative-flow: at least one planted violation is shown failing the corresponding CI step (local reproduction
  transcript with non-zero exit is acceptable evidence).
- AC5 `docs/storybook-governance.md` §11 updated to document the required PR gates.

## Out of scope
Gate-script logic (Task 380); widening the assert story set (Task 385); any product/story change.

## Required validation
`npm run check:stories` · `npm run check:i18n` · a YAML lint/parse of the workflow (e.g. `actionlint` if available,
else a careful manual parse) · the planted-violation reproduction transcript · AC self-audit.

## Required Sonnet evidence format
Sprint 33 standard: command transcripts with exit codes are the proof; a green/red CI run screenshot or a local
reproduction of each gate failing is required. Report = AC table (file:line + evidence) + command transcript +
negative-flow transcripts + STOP&ASK log + Files Changed table. NO `git add`/`commit` — orchestrator emits after review.
