# Session log — Task 851: cron routes answer `GET`, refuse every call without `CRON_SECRET`

Task: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_851_Cron_Routes_Answer_GET.md` · QA profile **Q4** · 2026-09-20 · Sonnet executor
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (owner halves of AC4 / O78-2 pending — see Limitations)

Receipts: `CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` ·
GR-1 / GR-3 / GR-3a / clause 16d: not applicable — no `.tsx`, no visible artifact (kickoff §12). GR-0: no visible UI is
created; no component, Story, style or token is added.

Evidence root: `docs/sessions/evidence/task851/` (each transcript unpiped, `EXIT_CODE=` appended as its own statement).

## I0 (baseline, before any write)

Platform `win32 v22.22.3`. `git status --porcelain` at start: only the pre-existing `M docs/sessions/evidence/task861/storybook-dev.log`.
Route hashes before: inactivity `9b602c936d1a3db77c4d614786579ee2fe565af8`, listings-expiry `0cf03c83a5da86a0eafa1198185a0b4483357c76`,
price-alerts `12e38f42ecf9347edb4cd99973d6536c430b1844`, saved-searches `eef483718bf2a952e003230d1bc11d41b70d91aa`,
listings-expiry test `a45b0513a6ddf4b9fad54744a83c89bd6735fe74`. `src/lib/cron/` did not exist.
§3 re-read: each route exported only `POST` with an inline fail-open `if (cronSecret) { … }`; the visibility-gate fingerprints
(`.eq('status', 'active')`, `.lt('expires_at', now)`, `.is('expires_at', null)`) live in `listings-expiry/route.ts` (`scripts/check-listing-visibility.mjs:53-55`).
Critical-flow baseline `npx vitest run …/listings-expiry/__tests__/route.test.ts`: 5 passed, exit 0 (`baseline-critical-flow.log`).
**O78-2:** the sprint file's answer is still absent (`Sprint_78_…md:139`, no "Owner answer"). Implementation continued; AC4's owner half is pending.

## Current versus required behavior

| | Before | After |
|---|---|---|
| Vercel `GET` | no `GET` export (405 — INFERENCE pending O78-2) | `GET` and `POST` both bound to one `handle` |
| Secret unset/empty | inline check skipped → anyone can trigger | 401 for GET and POST, before any Supabase client is created |
| Wrong / missing bearer | 401 | 401 (same body `{ error: 'unauthorized' }`) |
| Authorized manual `POST` | runs | runs (handler body unchanged) |

Negative flows: secret unset (tested, all four routes, both methods) · wrong secret · missing header · bare secret without `Bearer` (helper test) ·
duplicate Vercel delivery and first-run-after-405: pre-existing / owner decision (R5 report).

## Requirement and acceptance evidence

| ID | Evidence |
|---|---|
| R1 | `src/lib/cron/verifyCronRequest.ts` exports `verifyCronRequest(request): { ok: true } | { ok: false; response: NextResponse }`; `!cronSecret ||` fails closed. `verifyCronRequest.test.ts`: correct (GET+POST), wrong, missing header, bare secret, unset, empty (incl. literal `Bearer `) — 6 tests. |
| R2 | In each route `export async function POST(request)` → `async function handle(request)` whose first statements are `const auth = verifyCronRequest(request); if (!auth.ok) return auth.response`; old inline check removed; `export const GET = handle` / `export const POST = handle`; plus the one import line. Per-route diff below. |
| R3 | `listings-expiry/__tests__/route.test.ts`: `makeRequest` gains a method arg; new GET cases (wrong secret → 401; authorized → same 2 expired / 1 null-expiry / status `expired`); unset-secret → 401 for GET and POST with no update call. The five existing cases are untouched and pass. |
| R4 | `route.auth.test.ts` for inactivity, price-alerts, saved-searches: GET and POST × {wrong secret, no header, unset secret} → 401 and `createAdminClient` not called (the mock throws if called). |
| R5 | `scripts/task-851-first-run-impact.sql` — read-only, one grid, 10 rows, every row cites `route.ts:line`. **Not executed** (no DB access from the executor); owner runs it. |
| R6 | `docs/env.md` `CRON_SECRET` line lists all five routes (four + `/api/cron/listing-activity` from 849) and "Unset or empty = every cron call is refused (401)"; `docs/critical-flow-registry.md:69` route cell = `` `GET\|POST /api/cron/listings-expiry` ``. |
| AC1 | `g3-helper-test.log`: 6/6, exit 0. |
| AC2 | Per-route diff below; `g10-grep-exports.log`: `export const GET = handle` + `export const POST = handle` in all four routes, exit 0. The kickoff's grep pattern also matches `export const` (it lists `(const\|async function)`), so it is not vacuous here: the four routes are tracked files. |
| AC3 | `g4-cron-all.log`: 4 files / 27 tests, exit 0 (`red-before-impl.log`: 16 failed before the implementation, exit 1). **Plant** (`plant-failopen.log`): `!cronSecret ||` → `cronSecret &&` in the helper → 10 failed (both helper unset/empty cases + the unset case for all four routes × GET/POST), exit 1; hash before `1640a31cfae7d12c22038633d876eae011bd15de`, planted `4ad70352d483e211d41b0ce13bba138e7145bed5`, restored `1640a31cfae7d12c22038633d876eae011bd15de` (equal). |
| AC4 | SQL cites file:line on every count (see table); owner run output **pending** (owner-native). |
| AC5 | see R6. |
| AC6 | §13.2 block below, all exit 0. |

### Per-route diff (`git --no-optional-locks diff -- src/app/api/cron/*/route.ts`)

Each route: +1 import (`verifyCronRequest`), the signature `export async function POST` → `async function handle`, the
old inline secret check (5–10 lines) replaced by the two-line helper call, and two appended lines
(`export const GET = handle`, `export const POST = handle`). `inactivity` also loses its `console.error('[cron/inactivity] Unauthorized')`
because that line was inside the removed inline check. **No other line of any handler body changed.** The header doc-comments
(`POST /api/cron/…`) were deliberately left unedited to keep the diff to R2's changes only.

## Validation evidence (§13.2, actual results)

| Command | Exit | Evidence |
|---|---|---|
| `node -p platform` | 0 | `win32 v22.22.3` |
| `npm.cmd run typecheck` | 0 | `g1-typecheck.log` |
| `npm.cmd run lint` | 0 | `g2-lint.log` — warnings exist, none in `src/lib/cron` or `api/cron` (0 lines mention `cron`) |
| `npm.cmd run test -- src/lib/cron/__tests__/verifyCronRequest.test.ts` | 0 | 6 passed (`g3-helper-test.log`) |
| `npx.cmd vitest run src/app/api/cron` | 0 | 4 files / 27 tests (`g4-cron-all.log`) |
| `npx.cmd vitest run …/listings-expiry/__tests__/route.test.ts` | 0 | 9 tests (5 existing + 4 new) (`g5-critical-flow.log`) |
| `npm.cmd run check:listing-visibility` | 0 | `g6-listing-visibility.log` — fingerprints intact |
| `npm.cmd run build` | **0** | `g7-build.log` (final edit precedes it: docs edits were before the gate block; no source edit after) |
| `npm.cmd run check:file-integrity` | 0 | `g8-file-integrity.log` |
| `npm.cmd run check:mojibake` | 0 | `g9-mojibake.log` |
| `git grep -n -E "^export (const\|async function) (GET\|POST)" -- src/app/api/cron` | 0 | 8 hits, 2 per route (`g10-grep-exports.log`) |
| `git diff --stat` / status | — | `g11-diffstat-status.log` |
| `git hash-object …` | — | `g12-hashes.log` |

`GR-2 SCOPE STATED — check:listing-visibility inspects listings-read predicates for inline visibility literals outside its allowlist; it cannot see whether the handler body is textually unchanged; AC2 is closed by the per-route diff, not by the gate.`

Final hashes: `verifyCronRequest.ts` `1640a31cfae7d12c22038633d876eae011bd15de` · inactivity `1ef176278d1597f346e984c9d6396db59dcba327` ·
listings-expiry `6bb22732d29e2cf71de2825b86af91ec90258026` · price-alerts `024af812afe33553af3b5092af2e78c5d17de82f` ·
saved-searches `4bab7353928cfe293c006638b95dfd6a70a6da65` · SQL `58a0279cba97fd11a25ef4d79e63dc325f3be58c`.

## Files Changed

| Path | Reason |
|---|---|
| `src/lib/cron/verifyCronRequest.ts` (new) | R1 fail-closed bearer check |
| `src/lib/cron/__tests__/verifyCronRequest.test.ts` (new) | R1 tests |
| `src/app/api/cron/inactivity/route.ts` | R2 |
| `src/app/api/cron/listings-expiry/route.ts` | R2 |
| `src/app/api/cron/price-alerts/route.ts` | R2 |
| `src/app/api/cron/saved-searches/route.ts` | R2 |
| `src/app/api/cron/listings-expiry/__tests__/route.test.ts` | R3 GET + unset-secret cases |
| `src/app/api/cron/inactivity/__tests__/route.auth.test.ts` (new) | R4 |
| `src/app/api/cron/price-alerts/__tests__/route.auth.test.ts` (new) | R4 |
| `src/app/api/cron/saved-searches/__tests__/route.auth.test.ts` (new) | R4 |
| `scripts/task-851-first-run-impact.sql` (new) | R5 |
| `docs/env.md` | R6 |
| `docs/critical-flow-registry.md` | R6 (row 69 route cell) |
| `docs/backlog.md` | 851 state line (79 lines, no breach) |
| `docs/sessions/2026-09-20-task851-cron-routes-answer-get.md` (new) | this log |
| `docs/sessions/evidence/task851/*` (new) | evidence transcripts |

**Not mine, present in the worktree at handoff:** `.claude/agents/orchestrator.md`, `.claude/hooks/orchestrator-response-gate.ps1`,
`.claude/skills/create-task/SKILL.md`, `.claude/skills/review-task/SKILL.md`, `docs/golden-rules.md` show as modified; they were
clean at session start (only `task861/storybook-dev.log` was) and I did not touch them (policy files are read-only for the executor).
`docs/sessions/evidence/task861/storybook-dev.log` was already modified before this session.

## Assumptions, deviations, limitations

- **O78-2 unanswered.** Whether production returned 405 is still INFERENCE. The task ships either way.
- **SQL not executed** — the executor has no database access; predicates were copied from the route code and the SQL was not parse-checked
  against Postgres. Column/enum types (`users.status`, `listings.status`, `favorite_price_alerts.last_notified_price`) were not verified against
  a live schema. Saved-search *matches* cannot be counted in SQL (filters run in TypeScript): row 6/7 count due searches only.
- **Deviation (bounded):** the helper takes `request: Request` (a `NextRequest` is assignable), so it is reusable from any handler.
- **Deviation:** the header doc-comments still say `POST /api/cron/…`; left unchanged to honour AC2's "only R2's changes". Stale doc text is Opus's call.
- **Behavior change to confirm:** `inactivity` no longer logs `[cron/inactivity] Unauthorized` on a refused call (it sat inside the removed inline check; R1 says "no other behaviour").
- **Deploy caution (kickoff §5):** if `CRON_SECRET` is not set in Production, this task blocks manual `POST` triggers; owner sets it first.
- Lint output contains pre-existing warnings unrelated to this task.

## Opus handoff — inspect

1. Per-route diff vs R2 (only signature, removed inline check, helper call, two exports, one import).
2. Whether dropping `inactivity`'s `console.error` line is acceptable.
3. R5 SQL predicates against the route lines it cites; owner run + O78-2 still owed before deploy (STOP, kickoff §5).
4. The unexpected `.claude/**` + `docs/golden-rules.md` worktree modifications before any approval commit handoff is built.

## Backlog update

`docs/backlog.md` line 51 (the 849–856 row): 851 marked `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, O78-2 pending. Resulting physical line count: **79** (≤ 80, no `BACKLOG LIMIT BREACH`).
