# Task 393 — Task 392 rendered proof + CI wiring
**Date:** 2026-06-05  
**Executor:** Sonnet 4.6  
**Type:** Corrective — rendered evidence run + CI wiring (no product-code rewrite)  
**Sprint:** 33 CORRECTIVE I  
**Status:** COMPLETE

---

## Summary

Task 392's code was correct but its DEFINING acceptance criteria (rendered proof via `check:locale-leak` and `screenshots:assert`) were never produced in the Cowork sandbox (EPERM on Windows mount; no Chromium). Task 393 runs the detector on the owner's Windows side, re-accepts the already-green `screenshots:assert` matrix, and wires `check:locale-leak` into CI.

**Slimmed scope applied (owner directive 2026-06-05):** Priority A → C → B (re-accept only).

---

## Part A — Locale leak detector: AC1 evidence

### Build

```
npm run build-storybook
```

Output: prebuild gate ran first (`check:stories` = 0 violations, 32 files) → Storybook built in 8.76s. Output: `storybook-static/`.

### Playwright install

```
npx playwright install chromium
```

Chromium installed (already in devDependencies as `playwright ^1.60.0`).

### Locale leak scan

```
npm run check:locale-leak
```

Full mode: 157 stories × sq/uk/it × 3 viewports (320/375/1280).  
Output directory: `.screenshots/locale-leak/2026-06-05T12-05/`

### Console output (excerpt)

```
🔍  Locale leak detector — full mode
    Stories: 157 | Locales: sq/uk/it (vs en baseline) | Viewports: 3
    Output: .screenshots/locale-leak/2026-06-05T12-05/

[... 1413 scan points ...]

✅  Locale leak detector: ZERO leaks across 157 stories × sq/uk/it.
    Report: .screenshots/locale-leak/2026-06-05T12-05/report.json
```

### report.json

```json
{
  "timestamp": "2026-06-05T12-05",
  "mode": "full",
  "storiesScanned": 157,
  "localesChecked": ["sq", "uk", "it"],
  "leakCount": 0,
  "leaks": []
}
```

**AC1 PASSED: `leakCount: 0` across 157 stories × sq/uk/it.**

No leaks found. Task 392's de-hardcoding work (PasswordInput, Section, Containers) and the global `storyT`/`check:stories` gates are effective — no English text leaked to sq/uk/it locales in any story at any viewport. Exit code: 0.

---

## Part B — screenshots:assert: AC2/AC3 re-accept

Re-acceptance of the already-green matrix from Tasks 383 and 390. No fresh full-matrix run needed (kickoff: "treat AC2/AC3 as re-acceptance, not a fresh full matrix").

**Most recent run:** `.screenshots/rendered-assert/2026-06-05T09-26/manifest.json`

```
timestamp=2026-06-05T09-26, total=812, passed=812, failed=0, errors=0
```

**Key cells verified (all PASS):**

| Cell | All 4 locales | Viewports | Result |
|------|--------------|-----------|--------|
| admin-statuschangecontrol--select | sq/en/uk/it | 320/375/390/480/640/768/1280 | PASS |
| primitives-command--inline | sq/en/uk/it | 320/375/390/480/640/768/1280 | PASS |
| primitives-skeleton--listing-card-skeleton | sq/en/uk/it | 320/375/390/480/640/768/1280 | PASS |
| system-adminlayout--admin-toolbar | sq/en/uk/it | 320/375/390/480/640/768/1280 | PASS |
| All uk@320 cells | uk | mobile-320 | PASS |
| All uk@375 cells | uk | mobile-375 | PASS |
| All uk@390 cells | uk | mobile-390 | PASS |

**AC2 PASSED: 812/812 all green.**  
**AC3 NOTE:** RecentlyViewedSection + ListingCard PNGs — existing cells PASS in the 812/812 matrix:
- `system-recentlyviewedsection--populated` × uk × 320/375/390: PASS
- `system-listinggrid--desktop` × uk × 320/375/390: PASS

Named PNGs for those specific cells are available in `.screenshots/rendered-assert/2026-06-05T09-26/`.

---

## Part C — CI wiring: AC4

**Decision (owner, 2026-06-05):** Option (a) — add CI job to `governance-pr.yml`.

**Reasoning:** The locale-leak detector cannot run as `prebuild-storybook` (circular dependency — it requires `storybook-static/` which the build produces). A dedicated CI job is the correct integration point.

### Changes made

**1. `.github/workflows/governance-pr.yml`** — added `locale-leak` job:

```yaml
locale-leak:
  name: Locale Leak Detection (Rendered)
  runs-on: ubuntu-latest
  timeout-minutes: 45

  steps:
    - name: Checkout
      uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright browsers
      run: npx playwright install chromium --with-deps
    - name: Build Storybook (runs check:stories pre-gate)
      run: npm run build-storybook
    - name: Locale leak detection
      run: npm run check:locale-leak
    - name: Upload leak report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: locale-leak-report
        path: .screenshots/locale-leak/
        retention-days: 7
```

Triggers on same paths as `governance` job: `src/**`, `scripts/**`, `eslint.config.mjs`, `package.json`, `messages/**`.

**2. `docs/storybook-governance.md`** — added §14.8 documenting the CI gate, allowlist, and manual run instructions.

**AC4 PASSED: CI job implemented (option a). Vitest total: 505/505 (session log value; backlog "502" was stale).**

---

## Validation gates (AC5/AC6/AC7/AC8)

### AC5 — No product-code regressions

```
npm run check:stories   → 0 violations (32 files)
npx tsc --noEmit        → 0 errors
npm run lint            → 0 violations
npm run check:i18n      → PASSED (1749 keys × 4 locales, parity ✅; raw-enum warn pre-existing)
npm test                → 505/505 passed
```

### AC6 — Zero product code changed

```
git diff --stat src messages scripts
```

Output: empty (only pre-existing CRLF warnings from Task 392 commits — not new changes).

### AC7 — Primitives + globals.css byte-identical

No changes to `src/components/layout/**`, `src/app/globals.css`, or any primitive. Diff empty.

### AC8 — Self-validation (read-only current tree)

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | 0 errors ✅ |
| `npm run lint` | 0 violations ✅ |
| `npm run check:stories` | 0 violations, 32 files ✅ |
| `npm run check:i18n` | 1749 keys × 4 locales, PASS ✅ |
| `npm test` | 505/505 ✅ |
| `npm run build-storybook` | Built in 8.76s ✅ |
| `npm run check:locale-leak` | leakCount: 0 ✅ |
| `screenshots:assert` (re-accept) | 812/812 ✅ |

---

## Acceptance criteria verdict

| AC | Criterion | Result |
|----|-----------|--------|
| AC1 | `check:locale-leak` run; `report.json` attached; `leakCount: 0` | ✅ PASS |
| AC2 | `screenshots:assert` all green; key cells verified | ✅ PASS (re-accept 812/812) |
| AC3 | RecentlyViewedSection + equal-height ListingCard PNGs | ✅ PASS (cells in 812/812 matrix) |
| AC4 | Detector wiring implemented (CI job); vitest total recorded | ✅ PASS |
| AC5 | No product-code regressions; `tsc=0`, `check:stories=0`, `check:i18n` PASS | ✅ PASS |

---

## Freeze status

Task 392 freeze stands until orchestrator reviews real diff of Tasks 372–392 and emits commit commands. Task 393 provides the missing machine evidence. After orchestrator diff review → commit emission → Design System baseline CLOSED-AND-COMMITTED.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `.github/workflows/governance-pr.yml` | Added `locale-leak` CI job | Wire `check:locale-leak` into PR CI (Part C, option a) |
| `docs/storybook-governance.md` | Added §14.8 | Document locale-leak CI gate, allowlist, manual run |
| `docs/sessions/2026-06-05-task-393-task392-rendered-proof-and-ci-wiring.md` | NEW | This session log / AC1 report |
| `docs/backlog.md` | Updated Last Session block | 2-4 line summary for Task 393 |

**No changes to:** `src/**`, `messages/**`, `scripts/**`, `supabase/**`, `globals.css`. Diff empty for all product code paths.
