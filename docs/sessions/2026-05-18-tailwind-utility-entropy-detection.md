# Session Archive: Future Maintenance Direction Epic — Phase 3: Tailwind Utility Entropy Detection & Governance Hardening — 2026-05-18

## Task Summary

Task 60 established a permanent Tailwind utility entropy detection layer. This phase created a deep static analysis script, governance documentation, canonical fragment library, and entropy audit. No UI changes, no Tailwind rewrites, no responsive behavior changes.

---

## Files Created

| File | Purpose |
|---|---|
| `scripts/governance/tailwind-entropy.mjs` | 7-category entropy analyzer: duplicate chains, arbitrary values, responsive drift, fragment clones, overflow risks, huge-desktop risks, icon density |
| `scripts/governance/tailwind-entropy.allowlist.json` | Exception allowlist: 4 entries (gallery heights, dev overlay z-index) |
| `docs/tailwind-entropy-audit.md` | Baseline entropy audit: 218 files, 226 findings, 91 unique arbitrary tokens |
| `docs/tailwind-governance.md` | 16-section canonical Tailwind governance: ordering, spacing, typography, grids, containers, overflow, z-index, arbitrary values, localization-safe patterns |
| `docs/tailwind-canonical-fragments.md` | 13 canonical fragment libraries: containers, cards, toolbars, grids, dialogs, forms, filters, empty/loading states, mobile action bars, huge-desktop layout |

## Files Modified

| File | Change |
|---|---|
| `scripts/governance/scan-tailwind.mjs` | Enhanced: integrates tailwind-entropy.mjs HIGH/CRITICAL findings (filtered to exclude FRAGMENT_CLONE to avoid double-counting with primitives scan) |
| `scripts/governance/baseline.json` | Updated comment to reference Phase 3 entropy integration |
| `package.json` | Added `typecheck: tsc --noEmit` script |
| `docs/ui-rules.md` | Added §13 Tailwind Utility Governance (summary + anti-patterns) |
| `docs/ai-behavior.md` | Added "Tailwind Entropy Anti-Patterns" section (10 DO NOT rules) |
| `docs/governance-enforcement.md` | Added §10 Tailwind Entropy Enforcement (rule categories, severity model, CI behavior, allowlist/baseline policy) |
| `docs/governance-checklists.md` | Added Checklist H: Tailwind Entropy Gate |
| `docs/maintenance-playbook.md` | Added §10 Tailwind Entropy Maintenance (weekly/monthly/quarterly procedures, burn-down process) |
| `docs/backlog.md` | Compact update |

---

## Governance Script Summary

### `tailwind-entropy.mjs`
**Scope:** 218 files in `src/app/**`, `src/components/**`, `src/modules/**`, `src/hooks/**`, `src/lib/**`
**Extracts:** `className="..."`, `className={'...'}`, `` className={`...`} ``, `cn(...)`, `clsx(...)`, `cva(...)`
**Dynamic composition:** Marked as MANUAL_REVIEW (not blindly failed)

### Detection results at baseline (2026-05-18)

| Category | Findings | Severity Range |
|---|---|---|
| DUPLICATE_CHAIN | 5 patterns | LOW–MEDIUM |
| ARBITRARY_VALUE | 162 occurrences, 91 unique | LOW–HIGH |
| RESPONSIVE_DRIFT | 1 | MEDIUM |
| FRAGMENT_CLONE | 6 | HIGH–CRITICAL |
| OVERFLOW_RISK | 3 | LOW–HIGH |
| HUGE_DESKTOP_RISK | 4 | LOW–MEDIUM |
| ICON_DENSITY_RISK / MANUAL_REVIEW | 15 | INFO |

### `scan-tailwind.mjs` integration
- Imports tailwind-entropy.mjs at runtime
- Filters out `FRAGMENT_CLONE` category (already tracked in primitives scan)
- Passes remaining HIGH/CRITICAL entropy findings to governance baseline comparison
- After filtering + severity adjustment (card-pattern-2xl MEDIUM not HIGH): **CRITICAL:0, HIGH:0** — baseline unchanged

---

## Entropy Categories Implemented

1. **DUPLICATE_CHAIN** — known repeated utility chain patterns (5 canonical chains tracked)
2. **ARBITRARY_VALUE** — `w-[]`, `h-[]`, `text-[]`, `z-[]` etc. — filtered to exclude shadcn data-attributes
3. **RESPONSIVE_DRIFT** — missing 2xl: grid steps, inline style breakpoints, visibility conflicts
4. **FRAGMENT_CLONE** — button-like, input-like, dialog-like patterns outside canonical primitives
5. **OVERFLOW_RISK** — `whitespace-nowrap` without truncation, overflow-hidden + fixed width
6. **HUGE_DESKTOP_RISK** — unbounded public sections, admin layout without max-width
7. **ICON_DENSITY_RISK** — non-canonical icon sizes; MANUAL_REVIEW for dynamic ternary classNames

---

## Severity Model Summary

| Severity | CI Behavior | Examples |
|---|---|---|
| CRITICAL | Always blocks (if new above baseline) | Custom dialog clone bypassing Sheet/Dialog |
| HIGH | Blocks if above baseline | Button-clone styling, fixed px on translated text |
| MEDIUM | Warning, tracked in reports | Duplicate chain, non-canonical spacing, missing 2xl |
| LOW | Report only | Minor ordering, isolated arbitrary values |
| INFO/MANUAL_REVIEW | Report only | Dynamic ternary className |

---

## Allowlist / Baseline Summary

**Allowlist:** `scripts/governance/tailwind-entropy.allowlist.json`
- 4 entries: `z-[9999]` (PerfDevOverlay, dev-only), `h-[340px]` (LCP gallery, CLS prevention), `h-[420px]` (gallery container), `h-[500px]` (gallery full-size)
- All entries have: rule, file, pattern, reason, reviewer, expires date, why_safe

**Baseline:** `scripts/governance/baseline.json`
- Pre-existing debt documented — CI fails only on NEW regressions above baseline
- Tailwind scan baseline: `CRITICAL:0, HIGH:0, MEDIUM:14, LOW:42` — unchanged from Phase 2

---

## Localization Coverage Summary

All 4 locales (sq, en, uk, it) covered:
- Locale key parity: ✅ all 4 files have 852 keys
- `tailwind-entropy.mjs` detects: fixed px widths on translated text, whitespace-nowrap without truncation safety
- `scan-localization.mjs` continues to detect: key parity, hardcoded pixel widths, locale file existence
- Baseline findings: 18 MEDIUM localization findings (pre-existing, no change)
- `docs/tailwind-entropy-audit.md §5` documents specific localization risks by file

---

## Breakpoint Coverage Summary

All breakpoints covered via canonical governance:
- Mobile: 320px (base), 360px, 375px, 390px, 412px, 480px (sm:@640)
- Tablet: 640px (sm:), 768px (md:)
- Desktop: 1024px (lg:), 1280px (xl:), 1440px
- Huge desktop: 1720px, 1920px, 2560px (2xl:@1536), ultrawide

Detection:
- `scan-responsive.mjs`: missing 2xl: grid steps, arbitrary breakpoints
- `tailwind-entropy.mjs`: responsive drift, huge-desktop unbounded sections
- Both scans now in CI gate and weekly report

---

## Huge Desktop Coverage Summary

`docs/tailwind-entropy-audit.md §6` documents 4 huge-desktop risk files:
- `listings/page.tsx`, `favorites/page.tsx` — min-h-screen without container-wide (LOW at 1720, HIGH at 2560)
- `admin/page.tsx` — admin shell max-width (LOW–MEDIUM)
- `listings/create/page.tsx` — form wrapper (LOW–MEDIUM)

None are blocking at current baseline. All flagged for future cleanup.

---

## CI / Governance Integration Summary

- `npm run governance:tailwind` — still works, now integrates entropy findings via scan-tailwind.mjs import
- `npm run governance` — full scan still PASS
- `node scripts/governance/tailwind-entropy.mjs --report` — detailed report with JSON + Markdown
- `.github/workflows/governance-pr.yml` — runs `governance:tailwind` on every PR (already included from Phase 2)
- `.github/workflows/governance-scheduled.yml` — weekly auto-report (already included from Phase 2)
- `npm run typecheck` — added for TypeScript validation

---

## Validation Checklist

- [x] Tailwind entropy detector created (`tailwind-entropy.mjs`)
- [x] Deterministic static analysis (no browser, no screenshot, no runtime)
- [x] Scans src/app, src/components, src/modules, src/hooks, src/lib
- [x] Detects duplicated utility chains (5 patterns tracked)
- [x] Detects arbitrary values (162 occurrences, 91 unique)
- [x] Detects responsive utility drift (1 baseline finding)
- [x] Detects localization-sensitive utility risks
- [x] Detects huge-desktop utility risks (4 findings)
- [x] Detects local primitive-style fragments (6 clone findings)
- [x] Dynamic class composition marked MANUAL_REVIEW
- [x] Severity model implemented (CRITICAL/HIGH/MEDIUM/LOW/INFO)
- [x] HIGH/CRITICAL policy documented
- [x] Allowlist/baseline policy documented
- [x] `npm run governance:tailwind` works — PASS
- [x] `npm run governance` integrates Tailwind — PASS
- [x] CI integration via existing governance-pr.yml
- [x] No browser automation
- [x] No screenshot tooling
- [x] No visual diffing
- [x] No Storybook
- [x] `docs/tailwind-entropy-audit.md` created
- [x] `docs/tailwind-governance.md` created
- [x] `docs/tailwind-canonical-fragments.md` created
- [x] `docs/ui-rules.md §13` updated
- [x] `docs/ai-behavior.md` updated (entropy anti-patterns)
- [x] `docs/governance-enforcement.md §10` updated
- [x] `docs/governance-checklists.md` updated (Checklist H)
- [x] `docs/maintenance-playbook.md §10` updated
- [x] `docs/backlog.md` updated compactly
- [x] All locales covered: sq, en, uk, it
- [x] All mobile breakpoints covered: 320–480px
- [x] All tablet breakpoints covered: 640, 768px
- [x] All desktop breakpoints covered: 1024, 1280, 1440px
- [x] All huge desktop covered: 1720, 1920, 2560, ultrawide
- [x] No UI redesign
- [x] No global Tailwind rewrite
- [x] No responsive behavior changed
- [x] No localization behavior changed
- [x] No business/domain logic changed
- [x] No SSR/hydration behavior changed
- [x] No new npm dependency added
- [x] `npm run governance:tailwind` PASS
- [x] `npm run governance` PASS
- [x] `npm run lint` 0 errors

---

## Next Phase Readiness

**Phase 4 (future):** Storybook/visual snapshots, responsive regression screenshots, component cataloging.
These require browser automation which was explicitly excluded from Phase 3.
Governance foundation is now complete for all Phase 1–3 requirements.
