# Task 969 — A render-wait timeout of the locale-leak detector names where the render stood, and its cause is removed

Sprint 93 (governance reset). Priority P2. Owner decision D2 (2026-11-06): "Quality must cover all files in the project,
without exceptions"; golden rule (2026-11-07): a gap found is closed, not reported. Found in the Task 967 review 1
(2026-11-09). Revision 1 (2026-11-12, Opus, from the handoff run of PR #30): the homepage grid gate has the same
wait defect (Goal, last paragraph; AC5, AC6).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

`scripts/check-locale-leak.mjs` (`collectStoryTokens`, `:458-461`) waits 15 s for
`window.__STORYBOOK_PREVIEW__.currentRender` to reach `finished` or `errored` for the Story's id; on a timeout the tuple's
reason is Playwright's own line, `page.waitForFunction: Timeout 15000ms exceeded.`, which says nothing about where the
render stood. Locally the wait times out on Stories that render alone:
- Task 967 review 1 (Opus, 2026-11-09), six shards run one after another on one build: shard 5/6 exit 1, 717/720,
  `mantine-primitives-modal--delete-confirm-typed` at `mobile-375`/`en` (report
  `.screenshots/locale-leak/2026-11-09T18-45-24-449Z-shard-5-6/report.json`). The Story has no play
  (`src/stories/mantine/primitives/Modal.stories.tsx:338-348`); `--story=… --widths=375` exits 0 three times out of three.
- Task 967 executor (2026-11-09), two shards at a time: the same timeout on `listingsshellview--default` (375, en),
  `adminpageframe--page` (1280, sq), `mantinefilterchips--one`, `checkbox--default`,
  `dashboardsemidonut--one-segment-hidden`; each passed when run alone. The executor's explanation (two browsers
  competing) did not hold: the review run had one browser.
In CI the six shards are separate runners (`.github/workflows/ci.yml:367-370`) and the last three PR runs passed all 18
shard jobs (`gh run view 42646784033`, `42627624502`, `42619953805`), so the flake shows on local runs, where agents
measure their acceptance criteria (Task 967 AC3). The cause is unknown.

After the task a timeout's reason names the render's id and phase at the moment of the timeout, the timeouts of two
local serial runs are listed with their phase, and the cause is removed at its owner, so the six shards pass serially
on one build without a timeout.

The homepage grid gate judges a Story after a fixed pause: `navigateAndCheck` (`scripts/check-homepage-grid.mjs:531-534`)
waits for `networkidle`, then 400 ms, then fails the cell as `blank-canvas` when `#storybook-root` has no child
(`:183`). On 2026-11-12 the handoff run of PR #30, a documentation-only change, stopped there: 115/116,
`I-F Page cap @ en@2560 - render: blank-canvas` (`ci-local` log `homepage-grid--08.log`). A render that finishes after
the pause fails a gate whose subject did not change. No test covers `navigateAndCheck`.

## Scope

- `scripts/check-locale-leak.mjs` (`collectStoryTokens`): when the render wait rejects with a timeout, read
  `currentRender?.id`, `currentRender?.phase` and `document.readyState` in the page and throw
  `Story render wait timed out (render <id|none>, phase <phase|none>, document <readyState>)`. The wait is still never
  retried (Task 939 F4, `scripts/__tests__/check-locale-leak.test.ts` "never retries the 15 s render wait"), and the
  15 s budget does not change in this step.
- `scripts/__tests__/check-locale-leak.test.ts`: the fake page answers the state read; the timeout case asserts the new
  reason and still no retry.
- Measure: build Storybook once, run the six shards one after another twice; list every timeout with its Story, width,
  locale and the phase from the new reason. Then **stop and report the list to Opus**, as Task 968 did: the fix depends
  on the phase (a phase that never advances is a Story, component or Storybook defect fixed at its owner; a render
  that finishes late is a wait-budget question). Opus writes the fix and its test into this kickoff as a revision.
- `scripts/check-homepage-grid.mjs`: `navigateAndCheck` (exported for the test) waits for
  `window.__STORYBOOK_PREVIEW__.currentRender` of the Story id to reach `finished` or `errored`, within the same 15 s
  budget and never retried, instead of the 400 ms pause; a timeout fails the cell with
  `render wait timed out (render <id|none>, phase <phase|none>, document <readyState>)`; a finished render with an
  empty `#storybook-root` still fails as `blank-canvas`. New test `scripts/__tests__/check-homepage-grid.test.ts` with a
  fake page, as the locale-leak test does.
- Out of scope: product code (a product cause is reported, Opus files it), CI workflow, `scripts/quality/**`, the
  transport retry.
- Dependencies: none.

## Attack surface

Unchanged: a local and CI Storybook gate script; the new reason reads two Storybook fields and `document.readyState`
from the page it already drives; no product code, request path or data changes.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (a13983001cb3, mapping of 2026-11-09).

- CI_CD_Security: not applicable — the workflow is cited as a fact only; no job, permission or ruleset changes.
- Cross_Site_Scripting_Prevention: not applicable — `Modal.stories.tsx` is cited as evidence; no Story or render output changes.
- DOM_based_XSS_Prevention: not applicable — no Story or component changes; the detector reads two fields in its own page.
- GitHub_Actions_Security: not applicable — `ci.yml` is cited as a fact; no workflow or action reference changes.
- Injection_Prevention: not applicable — the detector's flags and its URL building are unchanged; only an error reason changes.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the new reason is built from fixed text and two page fields, with no new regex; lint and CodeQL run on it — AC4.
- OS_Command_Injection_Defense: not applicable — no process is started or changed; the detector's runs keep their fixed flags.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's timeout list is input: Opus reads every listed report before writing the fix — AC3.
- Software_Supply_Chain_Security: not applicable — no dependency, lockfile or workflow pin changes in this task.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — Opus reruns AC1, AC2 and at least one AC3 shard in review — AC1, AC2, AC3.
- Web_Frontend_Security: not applicable — no front-end file changes; `Modal.stories.tsx` is cited as evidence only.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A render-wait timeout names the render's id and phase — test: `scripts/__tests__/check-locale-leak.test.ts`
  (the timeout case: the reason contains `render <id>` and `phase <phase>`; red today, the reason is Playwright's line).
- AC2 The timeout is still never retried and the page is closed — test: `scripts/__tests__/check-locale-leak.test.ts`,
  "never retries the 15 s render wait" (one `goto`, one page, no retry, every page closed).
- AC3 Every timeout of two local serial runs is listed with its phase — test: six
  `node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=N/6` runs, one after another, twice on
  one build; each `report.json` path, exit code and every `errors[]` entry are in the report.
- AC5 The homepage grid gate judges a Story only after its render finished, and a render that never finishes names its
  phase — test: `scripts/__tests__/check-homepage-grid.test.ts` (a render that finishes after 400 ms passes; a
  timeout names `render <id>` and `phase <phase>`; a finished empty root is `blank-canvas`; one `goto`, no retry).
- AC6 The homepage grid gate passes three times in a row on one Storybook build — test: `npm run check:homepage-grid`,
  three runs, each exit 0, outputs in the report.
- AC4 The whole change passes the project gates — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `node scripts/quality/changed-lines-coverage.mjs --base main`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main <kickoff>` exit 0.

## Route

1. Write the AC1 test; run it red (`npx vitest run scripts/__tests__/check-locale-leak.test.ts`). Change the reason;
   run it green with AC2.
2. `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build-storybook`; run AC3 (one shard at a time,
   no other browser or build running).
3. Write the AC5 test; run it red (`npx vitest run scripts/__tests__/check-homepage-grid.test.ts`); change
   `navigateAndCheck`; run it green; run AC6 on the build of step 2.
4. Run AC4. Report each command, exit code and the relevant lines, and the AC3 list and the AC6 outputs. Stop: Opus writes the
   locale-leak fix.

## Review
