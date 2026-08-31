# Task 775 — `/listings` route chrome → `ListingsPageFrame` (Mantine), final current-tree verification

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Sprint 68. Kickoff: `tasks/Sprints/Sprint_68_kickoff_prompt_Task_775_Listings_Route_Frame.md` (Revision 3 —
current-tree verification, no baseline worktree/pre-post comparison/waiver).

This session ran exactly Revision 3 §8's required current-tree checks and inspected the owner-supplied `current`
route-probe run. **No implementation file was touched.** No worktree, baseline, pre/post comparison or waiver was
created. The pagination control was not probed — the current seed data has 2 listings and renders no pagination
component (per instruction and per Revision 3 AC7, which explicitly excludes pagination from Task 775's evaluation).

## Changed files this session

Only evidence and this log:

- `docs/sessions/evidence/task775/checks-20260831/` — 11 required + 3 optional command transcripts (new)
- `docs/backlog.md` — concise status update (Sprint 68 row + Task 775 registry row)
- `docs/sessions/2026-08-31-task775-final-verification.md` — this log (new)

`docs/sessions/evidence/task775/runs/` (containing `task775-final-20260831-01/02/03`) was already present on disk
before this session and was not modified.

## Source-constraint scan (§5) — real output, rebuilt on the final committed tree

Same corpus method as Phase A (`git diff c864431d0`, added lines only, for the tracked files in scope; full content
for the three wholly-new files), extended to the two Revision-3 selector-hook files:

```
--- assertion 1 (must print NOTHING) ---
(no output)
--- assertion 2 (must print exactly 1) ---
1
```

Both pass. The two selector-hook exceptions are each exactly one added attribute, confirmed by direct diff:

- `src/components/shared/Combobox.tsx` — `+ data-value={opt.value}` (one line)
- `src/modules/listings/components/ListingsFilterBar.tsx` — `+ data-testid="task775-advanced-filters"` (one line)

Full changed-file list vs `c864431d0` (`git diff --name-status`) stays within §4 scope: `page.tsx`,
`ListingsPageFrame.tsx`/`.module.css`, `theme.ts`, the story, `scripts/mantine-migration-scope.json`, the four
message files, the probe script, the two selector-hook files, plus `docs/sessions/**`, `docs/backlog.md` and the
kickoff itself. No out-of-scope path.

## Required current-tree checks (§8) — all exit 0

| # | Command | Exit code | Log |
|---|---|---|---|
| 1 | `node --check scripts/task775-listings-frame-route-probe.mjs` | 0 | `docs/sessions/evidence/task775/checks-20260831/01-node-check.log` |
| 2 | `npm.cmd run typecheck` | 0 | `.../02-typecheck.log` |
| 3 | `npm.cmd run check:stories` | 0 | `.../03-check-stories.log` (130 files, 0 violations) |
| 4 | `npm.cmd run check:story-coverage` | 0 | `.../04-check-story-coverage.log` (19/19 manifest entries covered) |
| 5 | `npm.cmd run check:i18n` | 0 | `.../05-check-i18n.log` (2226 keys, parity across 4 locales) |
| 6 | `npm.cmd run check:mojibake` | 0 | `.../06-check-mojibake.log` (0 artifacts, 3449 files) |
| 7 | `npm.cmd run check:file-integrity` | 0 | `.../07-check-file-integrity.log` (16 changed files clean) |
| 8 | `npm.cmd run check:design-tokens:strict` | 0 | `.../08-check-design-tokens-strict.log` (0 violations) |
| 9 | `npm.cmd run governance:tailwind` | 0 | `.../09-governance-tailwind.log` (C0/H10/M0, no regression vs. baseline) |
| 10 | `npm.cmd run build-storybook` | 0 | `.../10-build-storybook.log` |
| 11 | `npm.cmd run build` | 0 | `.../11-build.log` — `/[locale]/listings` still emitted `ƒ` (dynamic) |

`node.exe -p process.platform` → `win32` (confirmed before this session's commands).

## Optional diagnostics (§8) — reported verbatim, not Task-775 gates

| Command | Exit code | Log | Result |
|---|---|---|---|
| `npm.cmd run check:locale-leak:mantine-only` | **1** | `.../opt-01-check-locale-leak.log` | 23 leaks across 4 stories. **One is in Task 775's own story**: `Patterns/Mantine/ListingsPageFrame/Default` → `[it] "Home"`. `messages/it.json:2385` (`storybook.mantine.listings_page_frame_home`) is the literal string `"Home"`, byte-identical to `messages/en.json:2385`, while `uk`/`sq` carry real translations (`Головна`/`Kryefaqja`). Flagged here as a concrete finding for Task 775, not fixed — fixing it would be an implementation change and this session's instruction was verification-only. |
| `npm.cmd test` | **1** | `.../opt-02-test.log` | 4 failed of 1414 (3 test files): `css-var-resolvability` (`scripts/__tests__/`), `task763-*` appImageConfig, `ListingCard.smoke` ×2 (vertical + horizontal archived-badge assertions). |
| `npm.cmd run screenshots:assert -- --mantine-only` | **1** | `.../opt-03-screenshots-assert.log` | 1241/1348 PASS, 80 FAIL, 27 AMBIGUOUS. Grepped for `ListingsPageFrame` in the full log — **zero matches** in either the FAIL or AMBIGUOUS sections. All 80 FAIL are `Patterns/Mantine/AuthSheet/*`; AMBIGUOUS spans `PopularLocationsView`/`Tabs`/`Combobox`/`AdminUsersTable`. |

Real exit codes were captured by appending `$?` inside each log file, not from the backgrounding wrapper's own
report (which read 0 for all three despite two of them exiting 1) — the wrapper's exit reflects the shell chain,
not the piped command, consistent with the documented Task 709 evidence-capture lesson.

## Current route probe (§6) — inspected, not regenerated

Per instruction, the existing run was used as-is:
`docs/sessions/evidence/task775/runs/task775-final-20260831-03/route-probe.current.json`

- `gitCommit`: `95c3ba570a1a2df578a5c3d86990aaaaefb76354` — matches this session's `HEAD` exactly.
- `probeHash`: `8ad9077900274dca638c52c6d8a90e1d1888d5be` — matches `git hash-object scripts/task775-listings-frame-route-probe.mjs` run this session.
- `serverMode`: `development`.
- 28 cells (`en`/`uk` × 14 Q3 widths), 3 interactions (`filters`, `sort`, `statusTab`), **0 `failReason`** anywhere.

### AC3 / AC12 — gutter + spacing variables

| Width | `contentGutter` | `mantineSpacing2xl` | `mantineSpacing3xl` |
|---|---|---|---|
| 1200 | `maxWidth 1408px`, `padding 32px` | `2rem` | `3rem` |
| 1440 | `maxWidth 1408px`, `padding 48px` | `2rem` | `3rem` |

32px = 2rem, 48px = 3rem, both match their recorded variables. AC3/AC12 met.

### AC4 — breadcrumb (1440/en)

`breadcrumbFontSize: 14px`, `linkColor: rgb(102, 112, 133)`, `currentColor: rgb(29, 41, 57)`,
`separatorColor: rgb(152, 162, 179)`, `breadcrumbGap: 6px` — exact match to the required values. AC4 met.

### AC7 — interactions (1440/en)

| Control | Start URL | Result |
|---|---|---|
| Advanced filters | `/en/listings` | `urlAfter` unchanged (`/en/listings`) — sheet-visible postcondition passed in-probe (no `failReason`) |
| Sort | `/en/listings?page=2` | `urlAfter = /en/listings?sort=price_asc` — `sort` set, `page` absent |
| Status tab | `/en/listings` | `urlAfter = /en/listings?tab=closed` |

All three match their required postconditions exactly. AC7 met.

### AC9 — overflow at ≥680px

0 cells with `scrollWidth > clientWidth + 2` at any width ≥680 (`en` and `uk`). AC9 met for the assessed range.

Below 640px, 10 of the 28 cells overflow (320/375/390/480/560 × en/uk), all with the same `overflowCulprit`:
`DIV.relative w-auto min-w-35` — the `ListingsSortBar` sort-combobox wrapper. Per Revision 3 §1/AC9, this is a
**Task-772 finding, not a Task-775 acceptance condition** — recorded here, not waived, not fixed.

### AC11 — frame/breadcrumb still renders

`navFound` is `true` on all 28 cells (0 `false`). This confirms the frame and breadcrumb render on the current
`/en/listings` and `/uk/listings` routes as seeded (2 listings, non-empty, non-error). The current probe run does
not exercise a dedicated zero-row or Supabase-error cell — Revision 3's §6 contract does not require one, and none
was fabricated. AC11 is evidenced for the populated-route case only; not claimed beyond that.

### AC1, AC2, AC5, AC6, AC8, AC10

- AC1/AC2: implementation is unchanged from the already-committed tree; `page.tsx`/`ListingsPageFrame.tsx` were not
  re-inspected line-by-line this session (no edit occurred), but `npm run build` (§8 item 11) confirms
  `/[locale]/listings` compiles and remains dynamic.
- AC5: `check:story-coverage` exit 0, 19/19 covered, confirmed by transcript.
- AC6: `check:i18n` and `check:stories` both exit 0, confirmed by transcript.
- AC8: confirmed above — diff stays within §4, both selector-hook exceptions are one attribute each.
- AC10: all 11 required §8 commands exit 0 (table above); the three optional diagnostics are reported, not gated,
  per Revision 3's explicit AC10 text.

## Findings

- **Optional diagnostic result:** `check:locale-leak:mantine-only` reports `messages/it.json:2385`
  (`storybook.mantine.listings_page_frame_home`) as `[it] "Home"`, byte-identical to the English value. This log does not determine whether that Italian UI label is invalid.
- Below-640 route overflow (10/28 cells) is `ListingsSortBar`'s `min-w-35` wrapper — Task-772 scope, reported not
  fixed, consistent with Revision 3 §1.
- `npm test`'s 4 failures and `screenshots:assert`'s 80 FAIL/27 AMBIGUOUS are reported verbatim per the optional-
  diagnostic contract; they are not Task-775 acceptance gates.

## Backlog

`docs/backlog.md` updated (Sprint 68 row + Task 775 registry row) to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
File is 68 lines total — no `BACKLOG LIMIT BREACH`.
