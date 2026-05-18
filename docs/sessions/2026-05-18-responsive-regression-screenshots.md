# Session Archive: Future Maintenance Direction Epic — Phase 5: Responsive Regression Screenshots — 2026-05-18

## Task Summary

Task 62 establishes the responsive regression screenshot foundation for Lero.al.
Built on top of the Phase 4 Storybook infrastructure (Tasks 61, 61.1, 61.2),
Phase 5 adds Playwright-based screenshot capture scripts, canonical viewport/locale matrices,
and governance documentation for visual regression review. No UI changes, no component changes,
no production runtime changes.

---

## Files Created

| File | Purpose |
|---|---|
| `scripts/responsive-screenshots.mjs` | Main screenshot capture script (Playwright + static Storybook server) |
| `docs/responsive-screenshot-governance.md` | Full governance spec for responsive screenshots |
| `docs/responsive-screenshot-matrix.md` | Canonical viewport matrix, locale matrix, story target inventory |
| `docs/sessions/2026-05-18-responsive-regression-screenshots.md` | This session log |

## Files Modified

| File | Change |
|---|---|
| `package.json` | Added `playwright` devDep + `screenshots:responsive`, `screenshots:responsive:storybook`, `governance:screenshots` scripts |
| `package-lock.json` | Updated for `playwright@^1.60.0` |
| `.gitignore` | Added `.screenshots/`, `test-results/`, `playwright-report/`, `playwright/.auth/` |
| `docs/governance-enforcement.md` | Added §8 Responsive Screenshot Governance |
| `docs/governance-checklists.md` | Added Checklist H: Responsive Screenshot Review Gate |
| `docs/maintenance-playbook.md` | Added §12 Responsive Screenshot Review Process |
| `docs/storybook-visual-snapshots.md` | Marked Phase 5 complete, updated capability table |
| `docs/responsive-governance.md` | Added §10 screenshot matrix reference |
| `docs/qa-rules.md` | Added Responsive Screenshot QA section |
| `docs/backlog.md` | Phase 5 closed, session archive row added |

---

## Screenshot Strategy Selected

**Strategy: Storybook-based Playwright local capture.**

- Storybook static output (`storybook-static/`) served by a built-in Node.js HTTP server.
- Playwright Chromium captures screenshots from Storybook story iframe URLs.
- Locale variants accessed via Storybook `globals=locale:XX` URL parameter.
- Viewport variants set via Playwright `setViewportSize`.
- Output: `.screenshots/responsive/YYYY-MM-DD/` (gitignored).

Rationale:
- No live server, database, or auth required.
- Fully deterministic — all stories use fixed fixture data from Phase 4.
- Works offline — no external services.
- Chromatic/Percy deferred to Phase 6 (paid services, out of scope).

---

## Screenshot Capture Summary

| Command | Behavior |
|---|---|
| `npm run screenshots:responsive` | Fast-check matrix: 6 viewports × 4 locales × 21 story targets |
| `npm run screenshots:responsive -- --full` | Full matrix: 15 viewports × 4 locales × 21 story targets |
| `npm run governance:screenshots` | Infrastructure check only — no browser launch, CI-safe |

**Browser requirement:** `npx playwright install chromium` (one-time, not in CI by default).

---

## Viewport Coverage Summary

### Fast-check matrix (6 viewports)
| Viewport | Width | Breakpoint |
|---|---|---|
| `mobile-320` | 320px | Base (narrowest) |
| `mobile-375` | 375px | Base (standard iPhone) |
| `tablet-768` | 768px | `md:` |
| `desktop-1280` | 1280px | `xl:` |
| `desktop-1440` | 1440px | `xl:` wide |
| `huge-2560` | 2560px | `2xl:` |

### Full matrix (15 viewports)
All project-supported breakpoints: 320, 360, 375, 390, 412, 480, 640, 768, 1024, 1280, 1440, 1720, 1920, 2560, 3440px.

---

## Locale Coverage Summary

All four project locales covered in every capture run:

| Locale | Role | Notes |
|---|---|---|
| `en` | Reference baseline | English |
| `sq` | Default app locale | Albanian |
| `uk` | **Primary stress test** | **Ukrainian — longest strings** |
| `it` | Secondary stress test | Italian |

Critical combination: `uk` × `mobile-320` — maximum localization + viewport stress.

---

## Huge Desktop Coverage Summary

Phase 5 provides explicit huge desktop coverage:
- `huge-2560` viewport in fast-check matrix
- `system-listinggrid--huge-desktop` story captures at 2560px
- `system-containers--container-wide` story captures at 2560px
- Governance rules added to `governance-enforcement.md §8`

At 2560px, the critical checks are:
1. Listing grid must show 4 columns (`2xl:grid-cols-4`)
2. Containers must be bounded by `.container-wide`
3. Typography must not stretch excessively

---

## Storybook Integration Summary

Phase 5 screenshot capture is entirely Storybook-based:
- Uses `storybook-static/` build output from `npm run build-storybook`
- Accesses story iframes via `/iframe.html?id={story-id}&globals=locale:{locale}`
- No changes to story files — Phase 4 stories are sufficient
- Storybook Next.js 15 compat shim (`prepare-storybook-next15.mjs`) preserved unchanged

---

## CI / Governance Integration Summary

| Check | Mode | CI-safe? |
|---|---|---|
| `npm run governance:screenshots` | Config validation, no browser | ✅ Yes |
| `npm run screenshots:responsive` | Actual capture, needs Chromium | ❌ Manual only (Phase 6 to add CI) |
| `npm run governance` | Unchanged — does NOT include screenshot capture | ✅ Yes (fast) |

`governance:screenshots` is NOT added to `npm run governance` — screenshot capture is too slow
and browser-dependent for the fast governance gate.

---

## Validation Results

| Check | Result |
|---|---|
| `npm run lint` | ⚠️ Pre-existing 163 errors / 11,004 warnings — zero new violations from Task 62 |
| `npm run typecheck` | ✅ PASS |
| `npm run governance` | ✅ All 5 categories PASS (no regressions) |
| `npm run governance:tailwind` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run build-storybook` | ✅ PASS |
| `npm run governance:storybook` | ✅ PASS |
| `npm run governance:screenshots` | ✅ PASS (infrastructure check; browser warning is expected) |

**Lint note:** `scripts/responsive-screenshots.mjs` has zero lint violations (pure `.mjs`, not covered by
the TypeScript ESLint config). No story files or production source files were modified.

---

## Generated Artifact Rules

| Artifact | Location | Committed? |
|---|---|---|
| Screenshots | `.screenshots/responsive/YYYY-MM-DD/` | ❌ Gitignored |
| Storybook build | `storybook-static/` | ❌ Gitignored |
| Playwright report | `playwright-report/` | ❌ Gitignored |
| Playwright test results | `test-results/` | ❌ Gitignored |

---

## Known Limitations / Intentional Deferrals

1. **Browser must be installed manually.** `npx playwright install chromium` is required before
   `screenshots:responsive` can run. Not automated in CI at this phase.

2. **No baseline comparison.** Phase 5 captures screenshots but does not compare them against a
   committed baseline. Manual comparison is required. Automated diffing is Phase 6.

3. **Story IDs may drift.** If Storybook story titles or export names change, the story ID constants
   in `scripts/responsive-screenshots.mjs` must be updated. Failed captures are reported but do not
   stop the script.

4. **Font rendering varies by OS.** Screenshots from macOS, Windows, and Linux will show minor
   font rendering differences. For consistent baseline comparison, use the same OS.

5. **`ultrawide-3440` not in fast-check.** The ultrawide viewport is only in the full matrix
   (`--full` flag) to keep fast-check runtime reasonable.

6. **Visual diffing not automated.** Phase 6 will add `toHaveScreenshot()` or Chromatic integration
   for actual regression detection.

---

## Next Phase Readiness

**Phase 6: Component Cataloging is now unblocked.**

Phase 5 provides:
- Screenshot capture infrastructure for Phase 6 to build on
- Deterministic story fixtures from Phase 4
- Canonical viewport and locale matrices
- Governance documentation and checklists
- `governance:screenshots` CI-safe infrastructure check

Upgrade path to automated visual regression (Phase 6 option):
- Add `toHaveScreenshot()` via `@playwright/test` with committed baselines, OR
- Integrate Chromatic via `@chromatic-com/storybook` for hosted visual diffing
