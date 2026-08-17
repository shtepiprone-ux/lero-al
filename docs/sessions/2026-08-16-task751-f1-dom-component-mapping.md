# Session log — Task 751 (F1, Sprint 59)

**Task:** `tasks/Sprints/Sprint_59_kickoff_prompt_Task_751_F1_DOM_Component_Mapping_Feasibility.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** `Q0 Docs/Governance` (write set is docs/artifacts only, zero `src/` paths — `npm run build` not required)

## Requirement and acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | Uniqueness asserted before mapping, counts recorded | `docs/reviews/artifacts/task-667/f1/run-1.json` `.controls.C{1..5}.matchCount` (all 1) and `C2_unscoped_matchCount`=2, `C4_unscoped_matchCount`=6 (fixture defects, re-scoped per §11) |
| AC2 | Both DOM owner and project placer reported per control, C4 shows them distinct | FINDING.md "AC2" table; run JSON `domOwner` / `projectPlacerViaNameAllowlist` fields |
| AC3 | 3 reloads identical to run-1 baseline | Verified via a diff script comparing `domPath`/`domOwner`/both placer fields across `run-1.json`/`run-2.json`/`run-3.json` — all identical |
| AC4 | All 4 mechanisms verdicted with reasons | FINDING.md "AC4" — M-a REJECTED, M-b PARTIAL PASS (with 2 sub-mechanisms detailed), M-c evaluated on paper only, M-d measured/disqualified |
| AC5 | `data-testid` uncovered fraction as a number | 0.9976442873969376 (847/849), identical across all 3 runs |
| AC6 | Stability boundary named | FINDING.md "AC6" — per-mechanism binding and break condition |
| AC7 | Conditions + `<FIXTURE_SLUG>` recorded | FINDING.md "Measurement conditions" table; slug `11-mr7ucly4` |
| AC8 | Final `git status --porcelain` has no `src/`/story/click-shield-fixture entries beyond baseline | See "Validation evidence" below |
| AC9 | Bounded-meaning statement verbatim, no closure/re-scope proposed | FINDING.md "Result" and "AC9" sections quote §8 verbatim |
| AC10 | No video/screen-recording artifact | `docs/reviews/artifacts/task-667/f1/` contains only `probe.mjs` + 3 `run-N.json` + `FINDING.md` |

## Current versus required behavior

Current (pre-task): Task 667's decision note asserted, without measurement, that a fiber-tree walk via
`__REACT_DEVTOOLS_GLOBAL_HOOK__` would supply a reliable DOM→project-placer mapping. No prior task had run
any mechanism against the real app. Required (this task): measure, not assume — run 4 candidate mechanisms
against 5 fixed controls, 3 reloads, and report a bounded pass/fail finding. Delivered as above. No negative
flow beyond the four applicable ones in the kickoff §11 (dev-server-unraisable, non-unique-locator,
un-hydrated-page, all-mechanisms-fail) — all four were exercised in practice: dev server raised successfully;
two locators were initially non-unique and were fixed as fixture defects (not reported as mechanism results);
hydration gate passed on first poll every run; all four mechanisms did in fact fail, and that result is
reported per the kickoff's explicit instruction, not converted into `BLOCKED`.

## Files Changed

| Path | Reason |
|---|---|
| `docs/reviews/artifacts/task-667/f1/probe.mjs` | new — Playwright probe measuring C1-C5 against the running dev server (M-a/M-b/M-d in-page; M-c paper-only per task) |
| `docs/reviews/artifacts/task-667/f1/run-1.json` | new — frozen baseline run |
| `docs/reviews/artifacts/task-667/f1/run-2.json` | new — reload 2 |
| `docs/reviews/artifacts/task-667/f1/run-3.json` | new — reload 3 |
| `docs/reviews/artifacts/task-667/f1/FINDING.md` | new — the finding (W1) |
| `docs/backlog.md` | 751 registry row → actual final status; Last Session updated |
| `tasks/Sprints/Sprint_59_Route_Level_Inventory_Before_Any_Migration_Claim.md` | Tasks table → same status as backlog |
| `docs/sessions/2026-08-16-task751-f1-dom-component-mapping.md` | new — this session log |

## Validation evidence

- Fresh baseline (§10, before any change): `git status --porcelain` → only the two pre-existing
  `.click-shield-ci-fixture.*` untracked files (owner-flagged pre-existing, unrelated).
- Dev server: `npm run dev` (Turbopack) raised locally; polled `curl http://localhost:3000/sq` until HTTP 200
  (ready in ~1s); stopped after the 3 probe runs completed (confirmed subsequent `curl` connection-refused).
- Fixture: read-only anon-key query confirmed the only `is_premium` listing (`11-mr7ucly4`) had expired;
  flagged to the owner (live-DB risk) via `AskUserQuestion` before any write; owner chose "extend the expired
  listing, then revert." Service-role-key update → verified via a second anon-key read using the app's exact
  `getFeaturedListings()` filter chain that the listing now qualifies → 3 probe runs → service-role-key revert
  to the exact original `expires_at` → verified by reading the row back.
- Probe runs: `BASE_URL=http://localhost:3000 FIXTURE_SLUG=11-mr7ucly4 node docs/reviews/artifacts/task-667/f1/probe.mjs --run={1,2,3}` — all 3 exited 0, all 5 controls resolved to `matchCount: 1` on the scoped locators (see FINDING.md "Control locators actually used" for the two scoping fixes and why the bare locators were fixture defects, not mechanism failures).
- Reproducibility: node script diffing `run-1.json` against `run-2.json`/`run-3.json` on `domPath`,
  `domOwner`, `projectPlacerViaDebugSource`, `projectPlacerViaNameAllowlist` per control — all identical
  across all 3 runs (console output recorded in this session; not re-persisted as a separate artifact per D-H
  "compact" guidance — the 3 run JSONs themselves are the retained evidence).
- `node scripts/check-file-integrity.mjs docs/reviews/artifacts/task-667/f1/FINDING.md` → `PASSED — all 7 file(s) clean`, exit 0.
- `node scripts/check-mojibake.mjs` → `0 artifacts in 2837 files`, exit 0.
- Final `git status --porcelain`:
  ```
  ?? .click-shield-ci-fixture.stderr.log
  ?? .click-shield-ci-fixture.stdout.log
  ?? docs/reviews/artifacts/task-667/
  ```
  No `src/` path, no story path — both pre-existing click-shield-fixture entries match the §10 baseline
  exactly; the only new entry is the in-scope `docs/reviews/artifacts/task-667/` directory (AC8 satisfied).
  (`docs/backlog.md`, the Sprint 59 file, and this session log are additional tracked-file modifications made
  after this status snapshot, per the task's own required write set W3-W5.)
- `npm run build` not run — `Q0 Docs/Governance` profile, zero `src/` paths in the diff, per §9.

## Visual source trace

Not applicable — no UI markup/style was changed; this task is a measurement probe against the existing,
unmodified app.

## Canonical UI decision record

Not applicable — no visible UI artifact was changed.

## Implementation validation notes

- The two non-unique bare locators (`C2`, `C4`) were real, reproducible fixture-defect discoveries, not probe
  bugs: the sole `is_premium` listing legitimately appears in both the Featured and Latest grids simultaneously,
  and Mantine's `<Notifications>` unconditionally renders all six position containers. Both are documented in
  FINDING.md with the exact scoped selector used and the file/line justifying it.
- The central technical finding (M-b silently mis-resolving `FooterView` because it is a Server Component with
  no client-side fiber) was verified by direct inspection of the full `C1.fiberChain` in `run-1.json`, not
  inferred — `FooterView` is confirmed absent from the chain entirely, and `MantineRootProvider` is confirmed
  present at chain index 31 with no other allowlist name in between.
- No defect required a code fix; this task changes no product code.

## Assumptions, deviations, and limitations

- **Deviation (owner-approved):** fixture provisioning was "extend then revert an existing listing's
  `expires_at`" rather than a fresh DB seed, because the project's Supabase instance backs the live `lero.al`
  site and inserting/mutating rows unilaterally was judged too risky to do without asking. Reverted and
  verified.
- **Limitation:** React version for AC7 was confirmed via `node_modules/react(-dom)/package.json` (the exact
  installed/resolved version the dev server serves) rather than an in-page runtime read, because no working
  in-page version-introspection surface was found (`M-a`'s hook has zero registered renderers). Disclosed in
  FINDING.md, not asserted as a page-side read.
- **Limitation:** `domOwner.typeName` is unresolved (`(object type: [object Object])`) for a few anonymous
  `forwardRef`/Context-provider fibers in the raw chain output — cosmetic, does not affect any AC or the
  pass/fail verdict.
- No `BACKLOG LIMIT BREACH` — `docs/backlog.md` is 73 lines pre-edit; net change is a like-for-like row/line
  replacement, not new lines.

## Opus handoff

Evidence locations: `docs/reviews/artifacts/task-667/f1/FINDING.md` (the finding), `run-1.json`/`run-2.json`/`run-3.json` (per-run raw data incl. full fiber chains), `probe.mjs` (retained probe source). No open questions beyond what FINDING.md's "Assumptions, deviations, and limitations" section already states. The fixture-provisioning deviation (owner-approved live-DB extend/revert) is the one item most worth an independent look, since it is a real external mutation outside the git-tracked write set.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
