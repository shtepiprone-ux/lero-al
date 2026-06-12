# Task 418 REWORK — Clean teardown on FAIL + per-page leak fix (rendered harness)

**Kickoff:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_418_REWORK_TeardownAndPageLeak.md`
**Scope:** `scripts/check-stories-rendered.mjs` only (TOOLING, not product code). Fixes 2 P1
resource-lifecycle defects found in the orchestrator's diff review of Task 418 (Slice 6a).

## 1. Fixes applied

### P1-a — FAIL path now runs `finally` (teardown)
`runAssert()`'s failed-cells branch previously called `process.exit(1)` **inside the `try`**,
which terminates the process synchronously and skips the pending `} finally { await
browser?.close(); server?.close(); }`. Replaced with:

```js
process.exitCode = 1;
return;
```

`return` inside a `try` still runs `finally` before the function returns, so `browser?.close()`
and `server?.close()` now execute on every FAIL run, while the process still exits non-zero
(`process.exitCode = 1`).

Remaining `process.exit(1)` calls (storybook-static missing, playwright import failure,
port-6008-in-use fail-fast) all occur **before** `server`/`browser` are created — nothing to
tear down yet, so they are unchanged (explicitly acceptable per the kickoff's negative-flow note).

### P1-b — `captureCell()` always closes its page
Hoisted `let page;` above the `try`, removed the in-`try` `await page.close()`, and added:

```js
} finally {
  await page?.close().catch(() => {});
}
```

The page is now closed on the happy path, on any thrown exception (e.g. `goto` timeout /
`net::ERR_*`), and on a render-fail-but-no-throw path — exactly once, never leaking.

### P2 comments (no behavior change)
- `waitForStoryReady`: comment acknowledging readiness = non-empty `#storybook-root` + non-zero
  bbox (or error display), not a `storyRendered` event / non-uniform-pixel check (P2-a,
  acknowledged debt per kickoff wording).
- `waitForServerReady`: comment acknowledging the readiness ping only checks `/iframe.html`, not
  a specific JS chunk (P2-b, acknowledged debt).

## 2. Validation

- `node --check scripts/check-stories-rendered.mjs` → clean.
- `npx tsc --noEmit` → 0 errors (0 new).
- `npm run lint` → 0 errors (0 new).
- `npm run build-storybook` → succeeded both before and after the negative-flow plant/revert.

### Determinism — 3 consecutive `npm run screenshots:assert` (2520 cells each)

```
Run 1: Results: 2520/2520 PASS, 0 FAIL   flaky-recovered: 0
Run 2: Results: 2520/2520 PASS, 0 FAIL   flaky-recovered: 1
Run 3: Results: 2520/2520 PASS, 0 FAIL   flaky-recovered: 3
```

All three runs: `✅ All rendered assertions PASSED.` Matrix shape unchanged (45×14×4 = 2520).
After each run: `netstat -ano | grep LISTENING | grep 6008` → no match (port released); no
orphaned chromium/node processes (`ps aux` clean).

### FAIL-path teardown proof (item 6)

Planted a real `<640` overflow in `src/components/ui/badge.stories.tsx` (`Default` story
wrapped in `<div style={{ width: '2000px', maxWidth: 'none' }}>`), rebuilt Storybook, and ran a
badge-only `--fast` assertion (12 cells = Badge/Default × sq/en/uk/it × mobile-320/375/390):

```
✗✗✗✗✗✗✗✗✗✗✗✗

Results: 0/12 PASS, 12 FAIL
flaky-recovered: 0
❌ Failed cells:
  Badge/Default × sq/en/uk/it × mobile-320/375/390
    ✗ horizontal overflow detected
EXITCODE=1
```

After the run: `netstat -ano | grep LISTENING | grep 6008` → no match (port released, was held
during the run); `ps aux | grep -i -E "chrom|node"` → no orphaned processes. **FAIL run exits
non-zero AND tears down browser + server.**

Reverted the plant (`git diff --stat src/components/ui/badge.stories.tsx` → empty, byte-identical
to HEAD). Rebuilt Storybook (succeeded) and re-ran badge-only `--fast`:

```
✓✓✓✓✓✓✓✓✓✓✓✓
Results: 12/12 PASS, 0 FAIL   flaky-recovered: 0
EXITCODE=0
```

### Page-leak proof (item 7)

Temporarily (in-memory only, fully reverted before completion):
- Restricted `LOCALES` to `['en']` and `ASSERT_STORIES` to `Badge/Default` only.
- Pointed `storyUrl` at a closed port (`http://127.0.0.1:1/...`) to force every `page.goto` to
  throw `net::ERR_UNSAFE_PORT` (matches `TRANSIENT_NETWORK_PATTERN` → `isTransientFailure()` ==
  true → retried up to `MAX_ATTEMPTS = 3`).
- Logged `browser.contexts()[0].pages().length` after every `captureCell()` call.

Result (3 cells × 3 attempts each = 9 captureCell calls):

```
    [proof] attempt=1 error=page.goto: net::ERR_UNSAFE_PORT at http: openPages=0
    [proof] attempt=2 error=page.goto: net::ERR_UNSAFE_PORT at http: openPages=0
    [proof] attempt=3 error=page.goto: net::ERR_UNSAFE_PORT at http: openPages=0
E   (...repeated for all 3 cells, all 9 attempts...)

Results: 0/3 PASS, 3 FAIL   flaky-recovered: 0
EXITCODE=1
```

`openPages=0` after **every** attempt, including every retried attempt — `captureCell()`'s
`finally { await page?.close().catch(() => {}); }` closes the page on each throw before the
retry re-navigates. No accumulation under retry.

All temporary instrumentation (`LOCALES` restriction, `ASSERT_STORIES` restriction, bad-port
`storyUrl`, `[proof]` console.log) reverted. `git diff scripts/check-stories-rendered.mjs` shows
no leftover TEMP/proof markers (`grep -n -i "TEMP\|ORIGINAL LIST"` → 0 matches that aren't
pre-existing code).

## 3. File-integrity (clause 14)

- `scripts/check-stories-rendered.mjs`: `node --check` → clean; 0 NUL bytes; no BOM; tail
  re-read confirms the file ends with its intended final token (`await runAssert(); }`).
- `src/components/ui/badge.stories.tsx`: 0 NUL bytes; `git diff --stat` → empty (0 net change).

## 4. AC self-audit

- ✅ FAIL runs exit non-zero **and** close browser + static server — port 6008 released, no
  orphaned Chromium (FAIL-path proof above).
- ✅ `captureCell()` closes its page on success, throw, and render-fail — page-leak proof shows
  `openPages=0` across all 9 attempts including retries.
- ✅ Determinism unchanged: 3 consecutive runs = 2520/2520, 0 FAIL; no assertion weakened; matrix
  shape unchanged (45×14×4 = 2520).
- ✅ P2-a/P2-b acknowledged via inline comments; no behavior change (confirmed by 2520/2520 ×3).
- ✅ `tsc=0 new`, `lint=0 new`, `build-storybook` builds (×3 across the session), file-integrity
  GREEN.
- ✅ `docs/backlog.md` updated; this session log added. Net diff = `scripts/check-stories-rendered.mjs`
  only (`badge.stories.tsx` reverted to 0 diff).

**Self-validation: PASS.** No git commands emitted (single-writer rule — orchestrator emits
commit commands at review).

## 5. Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-stories-rendered.mjs` | FAIL branch: `process.exit(1)` → `process.exitCode = 1; return;` so `finally` runs teardown on FAIL (P1-a). `captureCell()`: hoisted `let page;`, added `finally { await page?.close().catch(() => {}); }` so the page is always closed incl. on throw/retry (P1-b). Added 2 P2 acknowledgement comments (`waitForStoryReady`, `waitForServerReady`) — no behavior change. | Implements both required lifecycle fixes from the REWORK kickoff; P2 items acknowledged per kickoff wording. |
| `src/components/ui/badge.stories.tsx` | Temporarily modified (planted `<640` overflow for the FAIL-path proof) then fully reverted — **0 net diff**. | Negative-flow proof step 6 (real overflow must FAIL deterministically and tear down cleanly). |
| `docs/backlog.md` | Last-Session entry added for this REWORK. | Standing backlog-update rule. |

Net tracked diff = `scripts/check-stories-rendered.mjs` + `docs/backlog.md`.
