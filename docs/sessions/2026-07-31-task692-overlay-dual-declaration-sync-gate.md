# Task 692 — Overlay dual-declaration sync gate — session log

**Task path:** `tasks/kickoff_prompt_Task_692_Overlay_Dual_Declaration_Sync_Gate.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Executor:** Sonnet, `.claude/skills/execute-task/SKILL.md`
**Date:** 2026-07-31

---

## 1. Files Changed

| Path | Action | Reason |
|---|---|---|
| `scripts/__tests__/overlay-dual-declaration.test.ts` | **created** | R1–R5 — the gate itself |
| `docs/backlog.md` | **modified** | R10 — concise active-state update, stayed at exactly 80 lines |
| `docs/sessions/2026-07-31-task692-overlay-dual-declaration-sync-gate.md` | **created** | R10 — this session log |

`src/app/globals.css` is **not** in this table — it was read-only throughout (R7), confirmed by md5 below. No `package.json`, `vitest.config.ts`, or `.github/` file was touched (R6).

---

## 2. I0 snapshot and final `git status --porcelain`

**I0 `git status --porcelain`:** empty. §3.7 anticipated either the Task 699 dirty set (9 entries) or an empty status if the owner committed first — the owner had committed, so this run started **clean**, the acceptable alternative.

**I0 md5 witnesses** (the 9 §3.7 paths + `globals.css`, all computed via `md5sum` in Bash to avoid a PowerShell `Test-Path`/`Get-FileHash` bug where `[locale]` in the path is parsed as a wildcard character class and falsely reports the file missing):

| Path | I0 md5 |
|---|---|
| `docs/backlog.md` | `ace9840c3ed1c106d007b27db7ca0cc5` |
| `docs/qa-profiles.md` | `539f94f8649096de08516452c4f9f50f` |
| `docs/storybook-governance.md` | `2f1991980a7304517c1990fea9d56fbd` |
| `src/app/[locale]/page.tsx` | `2e0520ad73111948d7de0c0ae99bf919` |
| `src/components/shared/HowItWorksSteps.tsx` | `8b6142e1f32f0750621d22fa1a18a671` |
| `src/modules/listings/components/FeaturedListingsView.tsx` | `1f78710d27f8b5f9914e652fea53b29c` |
| `src/modules/locations/components/PopularLocationsView.tsx` | `755c4c4044684d05beb48d8e0ad482fc` |
| `docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md` | `4bba4ec2ba7fe61d23e008d8cae900bb` |
| `src/design-system/mantine/typography.ts` | `7f7143814a288527daff5c958b686d70` |
| `src/app/globals.css` | `1f7690d0de50ed658fde83478a9c59f2` |

**Final `git status --porcelain`:**

```
 M docs/backlog.md
?? scripts/__tests__/overlay-dual-declaration.test.ts
?? docs/sessions/2026-07-31-task692-overlay-dual-declaration-sync-gate.md
```

**Final md5 for the 9 §3.7 paths** (recomputed after all work, including the four planted-violation edit/restore cycles):

| Path | End md5 | Matches I0? |
|---|---|---|
| `docs/backlog.md` | `3a2a95d57ef08a8cb9a8ecb1dba0a94c` | **No — OWNED, in-scope edit (R10)** |
| `docs/qa-profiles.md` | `539f94f8649096de08516452c4f9f50f` | Yes |
| `docs/storybook-governance.md` | `2f1991980a7304517c1990fea9d56fbd` | Yes |
| `src/app/[locale]/page.tsx` | `2e0520ad73111948d7de0c0ae99bf919` | Yes |
| `src/components/shared/HowItWorksSteps.tsx` | `8b6142e1f32f0750621d22fa1a18a671` | Yes |
| `src/modules/listings/components/FeaturedListingsView.tsx` | `1f78710d27f8b5f9914e652fea53b29c` | Yes |
| `src/modules/locations/components/PopularLocationsView.tsx` | `755c4c4044684d05beb48d8e0ad482fc` | Yes |
| `docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md` | `4bba4ec2ba7fe61d23e008d8cae900bb` | Yes |
| `src/design-system/mantine/typography.ts` | `7f7143814a288527daff5c958b686d70` | Yes |
| `src/app/globals.css` | `1f7690d0de50ed658fde83478a9c59f2` | **Yes — R7 satisfied, byte-identical throughout, including after all 4 planted-violation cycles** |

---

## 3. Requirement / acceptance-criteria evidence

| Req | Acceptance | Evidence |
|---|---|---|
| R1 | AC1 | `extractBlock()` in the test locates `@theme inline {` / `:root {` by string search + brace-depth counting, not line numbers. §5 below shows the full file. |
| R2 | AC1, AC2 | `extractSingleDeclarationValue()` requires exactly one match per block; the two values are compared with `.toBe()`. Verified passing (§3.4) and failing on divergence (control a, §6). Comment-reword control (§6) proves value-only comparison (A1). |
| R3 | AC1, AC2 | `countDeclarations()` on the `:root` block asserts 0 occurrences of `--color-overlay`/`--color-overlay-foreground`. Verified failing on control (d), §6. |
| R4 | AC3 | All four controls run, failed, and restored — verbatim output in §6. |
| R5 | AC4 | Every failure message names `GLOBALS_CSS_PATH`, both block labels, and (for the divergence case) both observed values; the header comment cites Task 693/D19 and the Task 695 update obligation — see the full test file, §5. |
| R6 | AC5 | Final `git status --porcelain` (§2) shows no `package.json`/`vitest.config.ts`/`.github/` entry. Full `npx vitest run` (§4) collects the new file via default globs — it was never named explicitly on that command line. |
| R7 | AC5, AC6 | `globals.css` md5 `1f7690d0de50ed658fde83478a9c59f2` at I0 and at the end (§2), including immediately after every planted-violation edit's restore (§6). |
| R8 | AC5 | §4 — all commands and actual results. |
| R9 | AC6 | §7 manifest — all 9 §3.7 paths reconciled, 8 unchanged + `backlog.md` owned/changed. |
| R10 | AC7 | This log + `docs/backlog.md` updated in place, confirmed at exactly 80 lines (`wc -l` → `80`). |

---

## 4. Validation evidence — every command, actual result

### 4.1 Baseline (I1, on the untouched/clean tree)

| Command | Result |
|---|---|
| `npx vitest run` (×2, to check flake identity) | **1190 tests, 1188 passed, 2 failed** both runs: `date-format-ssr-parity.smoke.test.ts` and `RangeDatePicker.smoke.test.tsx`, both `Test timed out in 5000ms`. Isolated re-run of each file individually: **25/25** and **14/14**, both 100% pass. This is the documented full-run-only timeout pattern from §3.6 (the trio `date-format-ssr-parity`/`RangeDatePicker`/`saveSavedSearch.dedup`) — this run happened to hit two of the three members instead of Task 699's one. Not a regression: reproduced identically before any file in this task was touched. |
| `npm run typecheck` | `tsc --noEmit` — exit 0, no output |
| `npm run check:stories` | ✅ PASSED — 127 files checked, 0 violations |
| `npm run check:story-coverage` | ✅ PASSED — 15/15 manifest entries covered |
| `npm run check:i18n` | ✅ PASSED — en/uk/it all 2215 keys (matches sq), 0 raw-enum leaks |

### 4.2 New gate on the clean tree (I3)

```
npx vitest run scripts/__tests__/overlay-dual-declaration.test.ts

 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al

 Test Files  1 passed (1)
      Tests  2 passed (2)
```

**N = 2** (`it()` blocks). Expected post-task vitest total: 1190 + 2 = 1192.

### 4.3 Wiring check (I5)

`git status --porcelain` after adding the test file: only `?? scripts/__tests__/overlay-dual-declaration.test.ts` (plus the later `docs/backlog.md`/session-log entries) — no `package.json`, `vitest.config.ts`, or `.github/` entry.

Full `npx vitest run` after adding the gate:

```
 Test Files  2 failed | 72 passed (74)
      Tests  2 failed | 1190 passed (1192)
```

74 test files (73 baseline + 1 new), 1192 tests (1190 baseline + 2 new). The 2 failures are the same `date-format-ssr-parity`/`RangeDatePicker` full-run-only timeouts observed in the untouched-tree baseline (§4.1) — no new failure.

### 4.4 Full gate suite (I6)

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0, no output |
| `npm run check:stories` | ✅ PASSED — 127 files checked, 0 violations |
| `npm run check:story-coverage` | ✅ PASSED — 15/15 |
| `npm run check:i18n` | ✅ PASSED — 2215×4, 0 raw-enum leaks |
| `npm run check:design-tokens` | **28 raw style-value violation(s) + 0 stale-marker(s) + 0 missing-reason error(s)** — unchanged from Task 699's post-task baseline; this task changed no style value |

### 4.5 Production build (I7) — hard gate, run last

Full transcript (exit 0):

```
> lero-al@0.1.0 build
> next build

   ▲ Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution):
     · clientTraceMetadata

   Creating an optimized production build ...
 ✓ Compiled successfully in 42s
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/40) ...
   Generating static pages (10/40) 
   Generating static pages (20/40) 
   Generating static pages (30/40) 
 ✓ Generating static pages (40/40)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS  Revalidate  Expire
┌ ƒ /                                      379 B         185 kB
├ ƒ /_not-found                          1.16 kB         185 kB
├ ƒ /[locale]                            7.15 kB         618 kB
├ ƒ /[locale]/[slug]                       377 B         185 kB
├ ƒ /[locale]/auth/confirm-email         2.18 kB         192 kB
├ ƒ /[locale]/auth/login                 1.42 kB         265 kB
├ ƒ /[locale]/auth/register              1.41 kB         265 kB
├ ƒ /[locale]/auth/reset-password        6.43 kB         284 kB
├ ƒ /[locale]/auth/verified              2.27 kB         258 kB
├ ƒ /[locale]/cabinet                     149 kB         763 kB
├ ƒ /[locale]/contact                    5.44 kB         230 kB
├ ƒ /[locale]/favorites                  5.25 kB         577 kB
├ ƒ /[locale]/listings                   12.8 kB         585 kB
├ ƒ /[locale]/listings/[slug]              381 B         581 kB
├ ƒ /[locale]/listings/[slug]/edit       2.36 kB         251 kB
├ ƒ /[locale]/listings/create            2.37 kB         251 kB
├ ƒ /admin                               5.02 kB         371 kB
├ ƒ /admin/companies                     6.84 kB         304 kB
├ ƒ /admin/currency                      8.66 kB         300 kB
├ ƒ /admin/email-templates                 10 kB         254 kB
├ ƒ /admin/footer                        6.26 kB         232 kB
├ ƒ /admin/inquiries                       379 B         185 kB
├ ƒ /admin/inquiries/sales                 336 B         368 kB
├ ƒ /admin/inquiries/support               335 B         368 kB
├ ƒ /admin/legal                           379 B         185 kB
├ ƒ /admin/listings                        10 kB         422 kB
├ ƒ /admin/listings/[id]/preview           380 B         581 kB
├ ƒ /admin/locations                     9.92 kB         261 kB
├ ƒ /admin/pages                         10.3 kB         264 kB
├ ƒ /admin/permissions                   8.93 kB         219 kB
├ ƒ /admin/popular-locations             9.23 kB         260 kB
├ ƒ /admin/property-types                7.33 kB         292 kB
├ ƒ /admin/reports                       21.2 kB         287 kB
├ ƒ /admin/settings                      7.58 kB         221 kB
├ ƒ /admin/support                       8.51 kB         408 kB
├ ƒ /admin/users                         5.02 kB         483 kB
├ ƒ /admin/users/[id]                      381 B         599 kB
├ ƒ /admin/users/new                       381 B         599 kB
├ ƒ /api/auth-email-hook                   378 B         185 kB
├ ƒ /api/auth/me                           378 B         185 kB
├ ƒ /api/cron/inactivity                   377 B         185 kB
├ ƒ /api/cron/listings-expiry              378 B         185 kB
├ ƒ /api/cron/price-alerts                 379 B         185 kB
├ ƒ /api/cron/saved-searches               377 B         185 kB
├ ○ /api/exchange-rate                     379 B         185 kB          1h      1y
├ ƒ /api/listings                          377 B         185 kB
├ ƒ /api/listings/[slug]/view              379 B         185 kB
├ ƒ /api/presence                          379 B         185 kB
├ ƒ /api/property-types                    379 B         185 kB
├ ƒ /api/upload-avatar                     378 B         185 kB
├ ƒ /api/upload-company-logo               378 B         185 kB
├ ƒ /api/upload-popular-location-photo     378 B         185 kB
├ ƒ /auth/callback                         378 B         185 kB
└ ƒ /auth/confirm                          378 B         185 kB
+ First Load JS shared by all             184 kB
  ├ chunks/3434-dc006f988405a441.js       126 kB
  ├ chunks/4bd1b696-ad216e4073dcea52.js  54.4 kB
  └ other shared chunks (total)           4.2 kB


ƒ Middleware                              165 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

54 routes in the table (counted). Exit 0.

### 4.6 Encoding gates (I8, after records exist)

Run after this session log and the `docs/backlog.md` edit both existed on disk (§4.7).

---

## 5. The test file, in full

```ts
// @vitest-environment node
/**
 * Overlay dual-declaration sync gate (Task 692, R1–R5; escalated by the Task 693 review, F1).
 *
 * `--overlay`/`--overlay-foreground` are deliberately declared twice in `src/app/globals.css` —
 * once inside `@theme inline` (so Tailwind can statically resolve the value and composite the
 * alpha-blended static fallback tier for every `bg-overlay/*`/`text-overlay-foreground/*` opacity
 * utility) and once inside `:root` (so the variables are emitted unconditionally for non-Tailwind
 * consumers such as `LightboxView.tsx`'s inline style and `MantineListingGalleryPattern.tsx`'s
 * `c=` prop, independent of whether any Tailwind utility survives the source scan). Task 690
 * deleted the `@theme` copy and silently degraded the fallback tier; Task 693 restored the pair
 * but the invariant was protected by a code comment only. This gate makes it machine-enforced: it
 * fails the instant the two copies diverge in value, either copy is removed, or `--color-overlay*`
 * — which must stay `@theme`-only (Task 693 R2) — leaks into `:root`.
 *
 * NOTE for Task 695: once the last `bg-overlay*`/`text-overlay-foreground*` Tailwind utility is
 * migrated away, the `@theme` copy of `--overlay`/`--overlay-foreground` becomes legitimately
 * deletable. When that happens, UPDATE this gate to match the new single-declaration invariant —
 * do not delete it outright, or a resurrected `@theme` copy (or a `:root` copy left behind) would
 * again go unguarded.
 *
 * Run: npx vitest run scripts/__tests__/overlay-dual-declaration.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const GLOBALS_CSS_PATH = join(ROOT, 'src', 'app', 'globals.css')

function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS_PATH, 'utf8')
}

/**
 * Locates `openingLine {` and returns the text between it and its matching closing `}`, found by
 * brace-depth counting rather than a hard-coded line range (Task 692 A2) — the extraction must
 * keep working after an unrelated edit shifts every line number in the file.
 */
function extractBlock(content: string, openingLine: string, blockLabel: string): string {
  const openIndex = content.indexOf(`${openingLine} {`)
  if (openIndex === -1) {
    throw new Error(`${GLOBALS_CSS_PATH}: could not find opening line "${openingLine} {" for ${blockLabel}`)
  }
  const bodyStart = openIndex + openingLine.length + 2
  let depth = 1
  let i = bodyStart
  while (depth > 0) {
    if (i >= content.length) {
      throw new Error(`${GLOBALS_CSS_PATH}: ${blockLabel} starting at "${openingLine} {" never closes`)
    }
    if (content[i] === '{') depth++
    else if (content[i] === '}') depth--
    i++
  }
  return content.slice(bodyStart, i - 1)
}

/**
 * Returns the trimmed value of `varName: value;` inside `block`, requiring exactly one
 * declaration. Comparison is on the value only, not the trailing comment or column alignment
 * (Task 692 A1) — a reworded comment is not a regression, a changed value is.
 */
function extractSingleDeclarationValue(block: string, varName: string, blockLabel: string): string {
  const re = new RegExp(`^\\s*${varName}:\\s*([^;]+);`, 'gm')
  const matches = [...block.matchAll(re)]
  if (matches.length !== 1) {
    throw new Error(
      `${GLOBALS_CSS_PATH}: expected exactly one "${varName}" declaration inside ${blockLabel}, found ` +
        `${matches.length}.`
    )
  }
  return matches[0]![1]!.trim()
}

function countDeclarations(block: string, varName: string): number {
  const re = new RegExp(`^\\s*${varName}:`, 'gm')
  return [...block.matchAll(re)].length
}

describe('overlay dual-declaration sync gate (Task 692, R1–R3)', () => {
  it('--overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root', () => {
    const content = readGlobalsCss()
    const themeBlock = extractBlock(content, '@theme inline', '@theme inline')
    const rootBlock = extractBlock(content, ':root', ':root')

    const themeOverlay = extractSingleDeclarationValue(themeBlock, '--overlay', '@theme inline')
    const rootOverlay = extractSingleDeclarationValue(rootBlock, '--overlay', ':root')
    expect(
      themeOverlay,
      `${GLOBALS_CSS_PATH}: --overlay diverged between the two declarations — ` +
        `@theme inline='${themeOverlay}' vs :root='${rootOverlay}'. These must stay value-identical ` +
        `(Task 693/D19); see the comments above each block for why the pair is duplicated.`
    ).toBe(rootOverlay)

    const themeOverlayFg = extractSingleDeclarationValue(themeBlock, '--overlay-foreground', '@theme inline')
    const rootOverlayFg = extractSingleDeclarationValue(rootBlock, '--overlay-foreground', ':root')
    expect(
      themeOverlayFg,
      `${GLOBALS_CSS_PATH}: --overlay-foreground diverged between the two declarations — ` +
        `@theme inline='${themeOverlayFg}' vs :root='${rootOverlayFg}'. These must stay value-identical ` +
        `(Task 693/D19); see the comments above each block for why the pair is duplicated.`
    ).toBe(rootOverlayFg)
  })

  it('--color-overlay and --color-overlay-foreground stay @theme-only and are never duplicated into :root', () => {
    const content = readGlobalsCss()
    const rootBlock = extractBlock(content, ':root', ':root')

    const colorOverlayInRoot = countDeclarations(rootBlock, '--color-overlay')
    expect(
      colorOverlayInRoot,
      `${GLOBALS_CSS_PATH}: --color-overlay must stay @theme-only (Task 693 R2) but was found ` +
        `${colorOverlayInRoot} time(s) inside :root.`
    ).toBe(0)

    const colorOverlayFgInRoot = countDeclarations(rootBlock, '--color-overlay-foreground')
    expect(
      colorOverlayFgInRoot,
      `${GLOBALS_CSS_PATH}: --color-overlay-foreground must stay @theme-only (Task 693 R2) but was found ` +
        `${colorOverlayFgInRoot} time(s) inside :root.`
    ).toBe(0)
  })
})
```

---

## 6. Planted-violation proof (R4) — all four controls, verbatim

Every restore below was applied via the `Edit` tool with an exact revert of the planted text (not `git checkout --`, which is a mutating git command — see §8 deviation), then verified against the I0 md5.

### Control (a) — change the `:root` copy's value only (`oklch(0 0 0)` → `oklch(0.1 0 0)`)

**Planted output — FAIL, verbatim:**

```
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al

 ❯ scripts/__tests__/overlay-dual-declaration.test.ts (2 tests | 1 failed) 8ms
     × --overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root 6ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  scripts/__tests__/overlay-dual-declaration.test.ts > overlay dual-declaration sync gate (Task 692, R1–R3) > --overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root
AssertionError: C:\Claude_Code_Projects\lero-al\src\app\globals.css: --overlay diverged between the two declarations — @theme inline='oklch(0 0 0)' vs :root='oklch(0.1 0 0)'. These must stay value-identical (Task 693/D19); see the comments above each block for why the pair is duplicated.: expected 'oklch(0 0 0)' to be 'oklch(0.1 0 0)' // Object.is equality

Expected: "oklch(0.1 0 0)"
Received: "oklch(0 0 0)"

 ❯ scripts/__tests__/overlay-dual-declaration.test.ts:97:7

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Duration  263ms
```

Restored; md5 after restore: `1f7690d0de50ed658fde83478a9c59f2` (= I0). Re-run: **2 passed (2)**.

### Control (b) — delete the `:root` pair entirely

**Planted output — FAIL, verbatim:**

```
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al

 ❯ scripts/__tests__/overlay-dual-declaration.test.ts (2 tests | 1 failed) 6ms
     × --overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  scripts/__tests__/overlay-dual-declaration.test.ts > overlay dual-declaration sync gate (Task 692, R1–R3) > --overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root
Error: C:\Claude_Code_Projects\lero-al\src\app\globals.css: expected exactly one "--overlay" declaration inside :root, found 0.
 ❯ extractSingleDeclarationValue scripts/__tests__/overlay-dual-declaration.test.ts:71:11
 ❯ scripts/__tests__/overlay-dual-declaration.test.ts:91:25

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Duration  259ms
```

Restored; md5 after restore: `1f7690d0de50ed658fde83478a9c59f2` (= I0). Re-run: **2 passed (2)**.

### Control (c) — delete the `@theme inline` pair (leaving `--color-overlay*` intact)

**Planted output — FAIL, verbatim:**

```
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al

 ❯ scripts/__tests__/overlay-dual-declaration.test.ts (2 tests | 1 failed) 5ms
     × --overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  scripts/__tests__/overlay-dual-declaration.test.ts > overlay dual-declaration sync gate (Task 692, R1–R3) > --overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root
Error: C:\Claude_Code_Projects\lero-al\src\app\globals.css: expected exactly one "--overlay" declaration inside @theme inline, found 0.
 ❯ extractSingleDeclarationValue scripts/__tests__/overlay-dual-declaration.test.ts:71:11
 ❯ scripts/__tests__/overlay-dual-declaration.test.ts:90:26

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Duration  277ms
```

Restored; md5 after restore: `1f7690d0de50ed658fde83478a9c59f2` (= I0). Re-run: **2 passed (2)**.

### Control (d) — add `--color-overlay: var(--overlay)` to `:root`

**Planted output — FAIL, verbatim:**

```
 RUN  v4.1.6 C:/Claude_Code_Projects/lero-al

 ❯ scripts/__tests__/overlay-dual-declaration.test.ts (2 tests | 1 failed) 8ms
     × --color-overlay and --color-overlay-foreground stay @theme-only and are never duplicated into :root 4ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  scripts/__tests__/overlay-dual-declaration.test.ts > overlay dual-declaration sync gate (Task 692, R1–R3) > --color-overlay and --color-overlay-foreground stay @theme-only and are never duplicated into :root
AssertionError: C:\Claude_Code_Projects\lero-al\src\app\globals.css: --color-overlay must stay @theme-only (Task 693 R2) but was found 1 time(s) inside :root.: expected 1 to be +0 // Object.is equality

- Expected
+ Received

- 0
+ 1

 ❯ scripts/__tests__/overlay-dual-declaration.test.ts:118:7

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Duration  265ms
```

Restored; md5 after restore: `1f7690d0de50ed658fde83478a9c59f2` (= I0). Re-run: **2 passed (2)**.

### Bonus must-PASS control (AC2 brittleness proof, not required by R4 but demonstrated for evidence)

Reworded the `:root` `--overlay` trailing comment only (value untouched): re-run **2 passed (2)** — proves A1 (value-only comparison, not raw-byte). Restored; md5 after restore: `1f7690d0de50ed658fde83478a9c59f2` (= I0).

---

## 7. Dirty-worktree closure manifest (R9)

I0 `git status --porcelain` was **empty** (owner had committed Task 699 before this task started) — the acceptable alternative state under §3.7. No porcelain rows to reconcile. The 9 named paths were nonetheless witnessed by md5 at I0 and again at the end, per §3.7's instruction to prove this task touched none of them regardless of porcelain state:

| Path | Owner/classification | Current task action | Integrity witness | I0 value | End value | Result |
|---|---|---|---|---|---|---|
| `docs/backlog.md` | OWNED (§7 scope) | edit | md5 | `ace9840c…` | `3a2a95d5…` | **CHANGED — expected, in-scope** |
| `docs/qa-profiles.md` | EXCLUDED AS UNRELATED | do not touch | md5 | `539f94f8…` | `539f94f8…` | UNCHANGED |
| `docs/storybook-governance.md` | EXCLUDED AS UNRELATED | do not touch | md5 | `2f199198…` | `2f199198…` | UNCHANGED |
| `src/app/[locale]/page.tsx` | EXCLUDED AS UNRELATED | do not touch | md5 | `2e0520ad…` | `2e0520ad…` | UNCHANGED |
| `src/components/shared/HowItWorksSteps.tsx` | EXCLUDED AS UNRELATED | do not touch | md5 | `8b6142e1…` | `8b6142e1…` | UNCHANGED |
| `src/modules/listings/components/FeaturedListingsView.tsx` | EXCLUDED AS UNRELATED | do not touch | md5 | `1f78710d…` | `1f78710d…` | UNCHANGED |
| `src/modules/locations/components/PopularLocationsView.tsx` | EXCLUDED AS UNRELATED | do not touch | md5 | `755c4c40…` | `755c4c40…` | UNCHANGED |
| `docs/sessions/2026-07-31-task699-section-heading-fz-tokenisation.md` | EXCLUDED AS UNRELATED | do not touch | md5 | `4bba4ec2…` | `4bba4ec2…` | UNCHANGED |
| `src/design-system/mantine/typography.ts` | EXCLUDED AS UNRELATED | do not touch | md5 | `7f714381…` | `7f714381…` | UNCHANGED |
| `src/app/globals.css` (R7, not a §3.7 path but the same discipline applies) | EXCLUDED — read-only in this task | do not touch (including through all 4 plant/restore cycles) | md5 | `1f7690d0…` | `1f7690d0…` | **UNCHANGED — R7 satisfied** |

---

## 8. Deviations

1. **Restore mechanism for the 4 planted controls used the `Edit` tool, not `git checkout -- src/app/globals.css`, as §10 I4 literally suggested.** `git checkout` is a mutating git command; per `CLAUDE.md`'s git policy and the executor skill, Sonnet must not run, emit, or suggest any mutating git command, including `checkout`. The Bash tool call attempting `git checkout -- "src/app/globals.css"` was in fact denied by the permission layer, confirming the boundary. The task itself names the alternative explicitly ("or, if the file is dirty for an unrelated reason at that moment, via a recorded md5-verified restore") — used that path for every one of the 4 controls, with an exact-text `Edit` revert and an md5 check after every restore, not only at the end. Reason: git-policy compliance, not a shortcut — the evidentiary bar (md5-verified restore) was met identically.
2. **Added a fifth, non-required demonstration** (comment-only reword, §6 "Bonus") beyond the four mandated controls, to give the reviewer direct evidence for AC2's brittleness claim rather than asking them to trust the design rationale alone. Reason: strengthens R5/AC2 evidence at negligible cost; does not touch scope.

---

## 9. Limitations

- This gate asserts the **source-level** invariant (the two `globals.css` declarations), not the **built CSS**. It would not catch a Tailwind version upgrade that changes how the static-fallback tier is composited, or any other mechanism that stops relying on `@theme` static resolution while leaving the source declaration pair intact. §3.2's shipped-bundle evidence is the *motivation*; this test does not re-derive it on every run (A4 — building inside a test is out of scope and would couple `npm test` to a prior `npm run build`).
- It covers **only** the `--overlay`/`--overlay-foreground`/`--color-overlay*` pair. The general class of "a `.module.css` or Tailwind utility depends on an `@theme` variable whose last utility consumer can disappear" is **Task 700**, explicitly out of scope here (§8).
- **Task 695** will legitimately delete the `@theme` copy of `--overlay`/`--overlay-foreground` once the last `bg-overlay*`/`text-overlay-foreground*` utility is migrated away. This gate's first `it()` will then fail permanently (0 declarations instead of 1) until Task 695 updates it — this is intentional and documented in the test's own header comment, not a defect to fix now.
