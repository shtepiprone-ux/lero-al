# Task 418 — Rendered-harness stabilisation (blank-canvas / chunk-load flake elimination)

**Type:** Storybook / visual-snapshot harness (TOOLING — not product code), Slice 6a
**Executor:** Sonnet 4.6
**Kickoff:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_418_RenderedHarnessStabilisation.md`

## 1. Before/after harness behavior

### Before
`scripts/check-stories-rendered.mjs` `runAssert()`:
- Started the in-process static server (`startStaticServer`) with no readiness check — the run began navigating immediately after `server.listen()` resolved.
- For each of the 2520 cells (45 stories × 4 locales × 14 viewports — `--fast` = 45×4×3 = 540), opened a page, navigated to `iframe.html?id=...`, did a fixed `page.waitForTimeout(400)`, then immediately ran the three assertions:
  - (a) no horizontal overflow
  - (b) full-width form controls at `<640`
  - (c) render-failure detection (`pageerror`/`consoleerror`/`sb-show-errordisplay`/blank `#storybook-root`)
- A single failed cell was a single FAIL — no retry, no distinction between "transient render race" and "real defect".
- If port 6008 was already bound, `startStaticServer` rejected with the raw `EADDRINUSE` error and no operator guidance.
- Result: across 3 owner-native runs on Task 417, 5 distinct cells (never repeating) failed with `blank-canvas`/chunk-load `sb-show-errordisplay`, all `≥640`, no `pageErrors`/`consoleErrors` — a render/serve race, not a layout defect, but counted as a hard FAIL.

### After
- **Stable serving:** `startStaticServer` now flags `EADDRINUSE` via `err.portInUse = true`. `runAssert()` catches this and, if the port is occupied by a foreign process, prints a clear operator instruction ("port 6008 in use by a non-harness process; free it and rerun") and exits — it never attempts to kill anything. After the harness's own server starts, `waitForServerReady(baseUrl)` polls `GET /iframe.html` (up to 20×100ms) until the server actually serves content, before any cell is processed.
- **Readiness wait before capture:** new `waitForStoryReady(page, timeoutMs=5000, pollMs=150)` polls (in-page) until either `body` has `sb-show-errordisplay` (error already shown) or `#storybook-root` has children AND a non-zero bounding box. Runs after the existing `goto` + `waitForTimeout(400)`, before the three assertions. Bounded — on timeout, capture proceeds and is assessed normally (may FAIL).
- **Bounded per-cell retry on transient classes only:** new `isTransientFailure(cell)` returns `true` only if:
  - the cell failed, AND
  - there are 0 `pageErrors` and 0 `consoleErrors`, AND
  - `noHorizontalOverflow !== false` and `fullWidthControlsAtMobile !== false` (no real layout/overflow defect), AND
  - either `failReason === 'blank-canvas'`, or `failReason === 'sb-show-errordisplay'` with a message matching the chunk-load/dynamic-import pattern (`Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk`), or a thrown navigation error matching `ERR_NO_BUFFER_SPACE`/`net::ERR_*`.
  - On a transient failure, `runAssert()` re-runs the same cell (re-navigate + re-capture via the extracted `captureCell()`) up to `MAX_ATTEMPTS = 3`, with a `300ms * attempt` backoff between attempts. A cell that still fails after 3 attempts, or fails for a non-transient reason, is FAIL on the first failure (no retry).
- **Transparency:** each cell records `retryCount` (attempts − 1). The summary now prints `flaky-recovered: <n>` (count of cells that passed only after ≥1 retry), followed by a "Recovered cells" list (`story × locale × viewport (retries: N)`) when `n > 0`. The progress glyph for a recovered-pass cell is `~` (vs `✓` for first-try pass, `✗` for FAIL, `E` for thrown error). Failed-cell listing also appends `(after N retries)` when retries occurred.
- **No assertion weakened:** the same three checks (a/b/c) run unchanged inside `captureCell()`; retry only changes *whether a cell gets a second chance to pass*, never *what counts as pass*. A cell with any `pageError`/`consoleError`/overflow/full-width violation is never retried and FAILs immediately.
- **Matrix shape unchanged:** still 45 stories × 4 locales × 14 viewports = 2520 (full mode) / 45×4×3=540 (`--fast`).

## 2. Stability proof — 3× consecutive `npm run screenshots:assert`

All three runs: **2520/2520 PASS, 0 FAIL**.

| Run | Result | flaky-recovered | Recovered cells |
|---|---|---|---|
| 1 | 2520/2520 PASS, 0 FAIL | 1 | `AdminSupportManager/Default × en × desktop-1440` (retries: 1) |
| 2 | 2520/2520 PASS, 0 FAIL | 2 | `Combobox/ButtonVariant × uk × tablet-768` (retries: 1); `AdminCompaniesManager/Default × en × mobile-375` (retries: 1) |
| 3 | 2520/2520 PASS, 0 FAIL | 2 | `Tabs/Default × sq × tablet-768` (retries: 1); `AdminSupportManager/Default × en × canonical-560` (retries: 1) |

Observations:
- All recoveries happened on retry 1 (no cell ever needed all 3 attempts).
- Different cells recovered each run — confirming these are exactly the class of transient blank-canvas/chunk-load races described in the kickoff's evidence table (Task 417: `Input/Default×sq×desktop-1024`, `AdminSidebar/Desktop×it×huge-2560`, `AdminExchangeProvidersManager/Default×en×desktop-1024`, `AdminPageShell/Default×sq×desktop-1440`, `AdminTable/Default×sq×canonical-1200` — all `≥640`, no pageErrors/consoleErrors, never repeating).
- The retry mechanism converts these into transparent `~` recoveries instead of hard FAILs, while the run-level result is now deterministically **2520/2520, 0 FAIL** across all three runs.

## 3. Negative-flow proof (gate is not a no-op)

**Plants (temporary, both reverted before this session ended):**
- `src/components/ui/badge.stories.tsx` `Default` story: wrapped the `<Badge>` in `<div style={{ width: '2000px', maxWidth: 'none' }}>` — guarantees real `<640` horizontal overflow.
- `src/components/ui/checkbox.stories.tsx` `Default` story: `render: () => { throw new Error('TASK418_PLANTED_RENDER_ERROR') }` — guarantees a real render-failure (`sb-show-errordisplay`).

After `npm run build-storybook` (succeeded), ran `npm run screenshots:assert:fast` (45×4×3 = 540 cells):

```
Results: 516/540 PASS, 24 FAIL
flaky-recovered: 0

❌ Failed cells:
  Badge/Default × sq × mobile-320
    ✗ horizontal overflow detected
  Badge/Default × sq × mobile-375
    ✗ horizontal overflow detected
  Badge/Default × sq × mobile-390
    ✗ horizontal overflow detected
  Badge/Default × en × mobile-320 / mobile-375 / mobile-390   (same: horizontal overflow detected)
  Badge/Default × uk × mobile-320 / mobile-375 / mobile-390   (same)
  Badge/Default × it × mobile-320 / mobile-375 / mobile-390   (same)
  Checkbox/Default × sq × mobile-320
    ✗ render failure [sb-show-errordisplay]: TASK418_PLANTED_RENDER_ERROR
  Checkbox/Default × sq × mobile-375 / mobile-390   (same)
  Checkbox/Default × en × mobile-320 / mobile-375 / mobile-390   (same)
  Checkbox/Default × uk × mobile-320 / mobile-375 / mobile-390   (same)
  Checkbox/Default × it × mobile-320 / mobile-375 / mobile-390   (same)
```

- All 12 `Badge/Default` cells (sq/en/uk/it × mobile-320/375/390) FAIL deterministically with "horizontal overflow detected".
- All 12 `Checkbox/Default` cells (sq/en/uk/it × mobile-320/375/390) FAIL deterministically with "render failure [sb-show-errordisplay]: TASK418_PLANTED_RENDER_ERROR".
- `flaky-recovered: 0` — neither defect was retried into a false pass. The overflow assertion (`noHorizontalOverflow === false`) and the non-transient `sb-show-errordisplay` (message does not match the chunk-load pattern) both fail `isTransientFailure()`, so retry never engages.

**Revert:** both story files restored to their original content (verified via `git diff --stat` = empty for both files — byte-identical to HEAD). Ran `npm run build-storybook` again (succeeded, 20.93s) and `npm run screenshots:assert:fast`:

```
Results: 540/540 PASS, 0 FAIL
flaky-recovered: 1
  Recovered cells (passed only after retry):
    Combobox/ButtonVariant × uk × mobile-320 (retries: 1)

✅ All rendered assertions PASSED.
```

The 24 previously-failing `Badge/Default`/`Checkbox/Default` cells are green after revert; one unrelated transient cell (`Combobox/ButtonVariant × uk × mobile-320`) was recovered via retry, consistent with the 3× full-run stability proof.

## 4. Validation transcripts

```
$ node --check scripts/check-stories-rendered.mjs
mjs OK   (no output = clean)

$ npx tsc --noEmit
(0 errors)

$ npm run lint
> lero-al@0.1.0 lint
> eslint
(0 errors / 0 warnings)

$ npm run build-storybook
...
Vite ✓ built in 20.93s
Output directory: C:/Claude_Code_Projects/lero-al/storybook-static
Storybook build completed successfully
(pre-existing >500kB chunk-size warnings only — unrelated to this task)
```

## 5. File-integrity (clause 14)

| File | NUL bytes | BOM | node --check / tsc |
|---|---|---|---|
| `scripts/check-stories-rendered.mjs` | 0 | none | `node --check` clean |
| `src/components/ui/badge.stories.tsx` | 0 | none | covered by `tsc --noEmit` (0 errors); `git diff` empty (byte-identical to HEAD, fully reverted) |
| `src/components/ui/checkbox.stories.tsx` | 0 | none | covered by `tsc --noEmit` (0 errors); `git diff` empty (byte-identical to HEAD, fully reverted) |

(`node --check` does not apply to `.tsx`; `tsc --noEmit` over the whole project is the equivalent parse-clean check, and ran 0-errors above.)

## 6. Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-stories-rendered.mjs` | Added `waitForServerReady`, `sleep`, `waitForStoryReady`, `isTransientFailure`, `TRANSIENT_FETCH_PATTERN`/`TRANSIENT_NETWORK_PATTERN`; extracted per-cell logic into `captureCell()`; `startStaticServer` now flags `EADDRINUSE` via `err.portInUse`; `runAssert()` calls `waitForServerReady`, fails fast with operator instruction on foreign port-6008 occupant, retries transient-only failures up to `MAX_ATTEMPTS=3` with backoff, tracks `retryCount`/`flaky-recovered`, prints recovered-cells summary | Implements the 4 required harness changes (retry-on-transient, readiness wait, stable-serve readiness/port-safety, flaky-recovered transparency) per kickoff scope |
| `src/components/ui/badge.stories.tsx` | Temporarily modified (planted `<640` overflow) then fully reverted — **0 net diff** | Negative-flow proof step 5 (real overflow must still FAIL after retries) |
| `src/components/ui/checkbox.stories.tsx` | Temporarily modified (planted render-error throw) then fully reverted — **0 net diff** | Negative-flow proof step 5 (real render error must still FAIL after retries) |

Net tracked diff = `scripts/check-stories-rendered.mjs` only.

## 7. AC self-audit

- ✅ `screenshots:assert` deterministic: 3 consecutive runs = 2520/2520, 0 FAIL, with `flaky-recovered` 1/2/2 (transient cells recovered via bounded per-cell retry + readiness wait).
- ✅ Real defects still FAIL: negative-flow proof — planted `<640` overflow (12/12 cells) and planted render error (12/12 cells) both FAIL deterministically after retries (`flaky-recovered: 0` for that run); both green after revert.
- ✅ Harness only — no product/story/locale/design-system changes in the final diff (story-file edits fully reverted, `git diff --stat` empty for both); matrix shape unchanged (45×14×4 = 2520, `--fast` = 45×4×3 = 540); no assertion (a/b/c) weakened — retry gates strictly on transient-no-error classes.
- ✅ `tsc=0 new`, `lint=0 new`, `build-storybook` builds, file-integrity GREEN (0 NUL, no BOM, `node --check`/`tsc` clean).
- ✅ `docs/backlog.md` + this session log updated; Files-Changed table matches the real diff.
- ✅ No git commands emitted (single-writer rule — orchestrator emits commit commands at review).

## Confirmations

- **Harness-only:** the only net change is `scripts/check-stories-rendered.mjs`.
- **No assertion weakened:** overflow / full-width-controls / render-failure checks (a/b/c) are unchanged; retry only gives a transient-classified failure a bounded second chance, never changes pass/fail criteria.
- **Matrix shape unchanged:** 45 stories × 14 viewports × 4 locales = 2520 (full); 45 × 3 (mobile viewports) × 4 = 540 (`--fast`).
- **No git commands emitted** by the executor.
