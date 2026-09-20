# Session log — Task 848: agent statistics data layer

Task: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_848_Agent_Statistics_Data_Layer.md` · QA profile **Q4** · 2026-09-20 · Sonnet executor
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Receipts: `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` ·
GR-1 / GR-3 / GR-3a / clause 16d: not applicable — the scope has no `.tsx` and no visible artifact (kickoff §12).

## I0 (baseline, before any write)

Platform `win32 v22.22.3`. `git status --porcelain`: only the pre-existing `M docs/sessions/evidence/task861/storybook-dev.log`.
`visibility.test.ts` 66/66 exit 0; `check:listing-visibility` PASSED, 0 violations (`i0-*.txt`). Cited lines re-read:
`getUser()` `src/lib/auth/server.ts:18`, `CABINET_LISTING_SELECT` `queries.ts:29-30`, `applyPublicVisibility` `visibility.ts:99`,
`applyPublicEligibleButHidden` `:138`, `period.ts` exports, `blockResult.ts`. `VALID_VISIBILITY_GROUPS` = ALL, VISIBLE, HIDDEN, ARCHIVED, CLOSED.

**AGT-01 / AGT-02 target mapping** (`hrefs.ts`, existing filters only): pending → HIDDEN · inactive → HIDDEN · hidden (AGT-01) → VISIBLE ·
expiring → VISIBLE · visible → VISIBLE · sold / rented → CLOSED · all → ALL; all under `/{locale}/cabinet?tab=listings&filter=<group>`.

## Requirement and acceptance evidence

| ID | Evidence |
|---|---|
| R1 | `access.ts`; `access.test.ts` — guest → `unauthenticated`; `user`/`admin`/`moderator` → `not_agent`; `agent` → `{kind:'ok', ownerId: <session id>}`; lookup error / missing row / throw → `not_agent`. The only `AgentOwnerId` cast is in `access.ts`. |
| R2 | `data.ts` — listings `.eq('user_id', ownerId)`, inquiries `.eq('listing_owner_id', ownerId)`; `AgentStatisticsInput.ownerId: AgentOwnerId`, no other identity input. Test "every query … is constrained by the owner id". |
| R3 | Listings via the user client; inquiries via the service-role client in `readOwnInquiriesViaServiceRole` only, ids selected only. Test asserts client-per-table and no personal column. |
| R4 | `buildBlock` fails the block alone, logs `[AgentStatistics] <block> failed`; tests: failing inquiry count, hidden count, null count, cover query, thrown query, row-limit. |
| R5 | Tirane bounds from `period.ts` only; tests for the `today+8` window (now = 2026-09-18 22:30 UTC) and both AGT-05 periods. |
| R6 | 3 test files, **49 tests**. |
| AC1 | `access.test.ts` green (`final-tests.txt`). |
| AC2 | `final-tests.txt` 49/49, exit 0. Plant: owner `eq` removed from the AGT-05 count query → `plant.txt`: 1 failed ("listing_inquiries id has eq(listing_owner_id, owner): expected false to be true"), exit 1. `git hash-object data.ts` before `afd8c6302ee99d5961361f718b199d1fc6d644c4`, after revert `afd8c6302ee99d5961361f718b199d1fc6d644c4`, `diff -q` against the pre-plant copy = IDENTICAL. |
| AC3 | `final-greps-hashes.txt`: `createAdminClient` hits = `data.ts:144-145` (inside `readOwnInquiriesViaServiceRole`) + `data.test.ts:54` (the mock definition, a test file); second grep prints nothing (exit 1). |
| AC4 | Empty (exit 1). |
| AC5 | Empty (exit 1). |
| AC6 | typecheck, lint (0 errors, 79 pre-existing warnings, none in `cabinet/statistics`), tests, visibility regression 66/66, `check:listing-visibility`, `test:rls-guards` 15/15, `check:file-integrity`, `check:mojibake`, `npm run build` — all exit 0 (`final-*.txt`). |

## Files Changed

| Path | Reason |
|---|---|
| `src/modules/cabinet/statistics/types.ts` (new) | `AgentOwnerId` brand, access union, block shapes, `Agt10Table`, input. |
| `src/modules/cabinet/statistics/access.ts` (new) | `getAgentStatisticsAccess()`, `role = 'agent'` gate. |
| `src/modules/cabinet/statistics/data.ts` (new) | `getAgentStatisticsData()` — AGT-01/02/05/10 as `BlockResult`s. |
| `src/modules/cabinet/statistics/hrefs.ts` (new) | Card targets onto existing cabinet filters. |
| `src/modules/cabinet/statistics/__tests__/access.test.ts`, `data.test.ts`, `hrefs.test.ts` (new) | R1, R2–R6, hrefs. |
| `docs/backlog.md` | 848 state on its existing row (79 lines, no growth). |
| `docs/sessions/evidence/task848/*` (new) | Command transcripts, unpiped, each with `EXIT=`. |
| `docs/sessions/2026-09-20-task848-agent-statistics-data-layer.md` (new) | This log. |

`docs/sessions/evidence/task861/storybook-dev.log` was already modified before this session and is not part of this task.

## Deviations, assumptions, limitations

- **AGT-10 filters, sort and paging run over the owner's light rows in memory**, not in SQL. The visibility filter must come from `isListingPubliclyVisible` (no complement helper exists and a second SQL predicate would fork the invariant), and a sort by `form_inquiries` needs every listing's count. Covers and (for non-inquiry sorts) inquiry counts are then read for the page's ids only — no N+1. The owner's listing read and the per-listing inquiry read are capped at 1000 rows (PostgREST's limit); reaching it fails AGT-10 with `query_failed` instead of paging a truncated set.
- Supabase has no `GROUP BY`, so the "one grouped query" is one id-only read aggregated in the module.
- `getAgentStatisticsAccess()` returns `not_agent` when the role cannot be read (deny), with a logged code; the three-kind union has no error member.
- `today+7` comes from `listDates` (a hand-built `Period` whose `to` is unused), then `resolvePeriod` + `periodUtcBounds`; `period.ts` exports no forward day-add. A `addDays` export would be cleaner — left for Opus, `period.ts` is 846's approved file.
- The service-role module is loaded lazily and memoised (`serviceRoleModule`) so the AC3 grep hits sit inside the one function; a plain `import` line would sit outside it. Vitest applied the mock to only one of two concurrent bare dynamic imports, hence the memo.
- `countOf` / `rowsOf` / `buildBlock` / `unwrap` are private copies of 847's helpers (847's are not exported and its files were out of scope) — a candidate for a shared extraction.
- Live RLS state of `listing_inquiries` was not readable here; still UNKNOWN, R3 does not depend on it. No RLS/SQL change.
- One command of mine (`git add -N`) was denied by the harness — mutating git is owner-only; it did not run, and no mutating git was used.

## Opus handoff

Inspect: `data.ts` `readAgt10` (in-memory paging decision) and `readOwnInquiriesViaServiceRole`; `data.test.ts` isolation test and `plant.txt`; the `today+8` window test; `hrefs.ts` mapping. Owner visual review: none (no visible artifact). Live two-agent isolation proof stays with 854.
