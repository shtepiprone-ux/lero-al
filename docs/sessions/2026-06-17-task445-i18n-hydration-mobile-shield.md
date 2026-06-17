# Task 445 — Regression Shield Slice 6: i18n / hydration / mobile contract (PREVENTION ONLY)

**Date:** 2026-06-17
**Type:** Regression Shield — PREVENTION ONLY (no product code changes)
**Status:** IMPLEMENTED — awaiting orchestrator review

## Summary

Built four deterministic regression gates for the i18n/hydration/mobile class:
- **G1** — Date-format SSR/CSR parity vitest (25 tests)
- **G2** — i18n render-parity vitest (8 tests)
- **G3** — Hydration self-test confirmed blocking in CI
- **G4** — Mobile no-overflow story coverage confirmed (77 stories)

Wired `test:i18n-hydration` (G1+G2) and `check:i18n` as new blocking CI steps in `governance-pr.yml`.

## Investigation notes (AC13)

### Date-format surfaces
`src/lib/formatters.ts` exports 3 date formatters:
- `formatDate(dateStr, locale)` — `DD.MM.YYYY` style, locale-aware, NO TZ pin
- `formatDateTime(dateStr, locale)` — date+time with `timeZone: 'UTC'` pin (the SSR/CSR parity contract)
- `formatListingDate(dateStr, locale)` — compact `Jan 15, 2026` style, NO TZ pin

All require explicit locale. `formatDateTime` is the one that caused the Task 434 hydration mismatch — its `timeZone: 'UTC'` pin is the parity contract. Critical consumers: `AdminUserProfile.tsx`, `StatusChangeHistory.tsx`, `AdminUsersTable.tsx`, listing cards.

### i18n render target
No critical component renders cleanly in jsdom without DB/server-action dependencies. Used option 3: a test-only harness component inside the test file that pulls real message keys from 8 namespaces (`nav`, `listing`, `auth`, `common`, `cabinet`, `admin.sidebar`, `notifications`, `contact`) through `NextIntlClientProvider`. This is a test artifact, not product code. Registry row notes "runtime message-provider parity covered" — does NOT imply every key route was rendered in jsdom.

Note: `admin` namespace keys are all nested objects (not strings), so the harness uses `admin.sidebar` as the nested namespace path.

### Hydration public routes
`check:hydration:verify` (server-less planted-violation self-test) already present as a blocking CI step in `governance-pr.yml` line 89-90 (added by Task 436). Self-test output:
```
✅ GATE IS FUNCTIONAL — planted violation was correctly detected.
   The gate will FAIL on real hydration mismatches in the Next.js app.
```

Live `check:hydration` command: `BASE_URL=http://localhost:3000 npm run check:hydration` with `HYDRATION_LISTING_PATH=/en/listings/<real-slug>`. This is owner-run because it needs a live runtime (no booted-Next CI step per owner 2026-06-17 scope decision). Owner-run evidence to be provided when stable local runtime + real slug available.

### Mobile overflow story coverage
`screenshots:assert` covers 77 stories across 14 viewports × 4 locales (uk@320/375/390 mandatory). Critical admin/user/listing surfaces confirmed in the story set:
- `AdminUserProfile/Default` (admin-adminuserprofile--default)
- `AdminUsersTable/Default` (admin-adminuserstable--default)
- `AdminListingsTable/Default` (admin-adminlistingstable--default)
- `ListingDetailView` — 12 explicit mobile variant stories (Public/StaffPreview × 320/375/390)
- `ListingFormShellView/Owner` and `/Staff`
- All overlay primitives (Dialog, Select, Popover, DropdownMenu, Command, Sheet, NavigationMenu)
- NotificationCenter (including MobileBottomSheet variant)

Coverage is comprehensive. No new stories were added (existing gate, not a new deterministic gate built in this task).

### 6b boundary
The admin live-route hydration row (`/en/admin/users/[id]`) requires an authenticated admin runtime (real auth cookies + real user UUID via `HYDRATION_ADMIN_USER_ID` + `HYDRATION_GATE_COOKIES`). This is NOT stably buildable as a deterministic CI gate — intentionally deferred to Slice 6b. Registry row kept at 🟡 with honest deferral note.

### Mobile <640 full-width product gate
**N/A** — no rendered product UI is modified in this task (tests + gates + docs only). The mobile-overflow ASSERTION (verifying existing surfaces) is in scope; changing any surface is not.

## G1 — Date-format SSR/CSR parity

**File:** `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` (25 tests)

Tests:
- `formatDate` literal byte assertions for sq/en/uk/it with `2026-06-15T12:00:00.000Z` (midday — same date in all practical TZs)
- `formatDateTime` literal byte assertions for sq/en/uk/it with `2026-01-01T00:30:00.000Z` (near day boundary, TZ-pinned to UTC)
- `formatListingDate` literal byte assertions for sq/en/uk/it with `2026-06-15T12:00:00.000Z`
- `formatDateTime` TZ-invariance via child process: spawns `TZ=UTC` and `TZ=America/New_York` child Node processes, asserts byte-identical output
- Edge cases: null/undefined/invalid/empty → `'—'` for all 3 formatters (12 tests)

### G1 planted-violation proof

Removed `timeZone: 'UTC'` from `formatDateTime` in `src/lib/formatters.ts`:
```
5 failed | 20 passed (25)

FAIL  formatDateTime — literal byte assertions per locale
  sq: expected '01.01.2026, 03:30 p.d.' to be '01.01.2026, 12:30 p.d.'
  en: expected '01/01/2026, 03:30 AM' to be '01/01/2026, 12:30 AM'
  uk: expected '01.01.2026, 03:30' to be '01.01.2026, 00:30'
  it: expected '01/01/2026, 03:30' to be '01/01/2026, 00:30'

FAIL  formatDateTime — TZ-invariance (child process)
  expected '01.01.2026, 12:30 p.d.' to be '31.12.2025, 07:30 m.d.'
```

Restored → 25/25 green.

## G2 — i18n render parity

**File:** `src/i18n/__tests__/i18n-render-parity.smoke.test.tsx` (8 tests)

Tests per locale (sq/en/uk/it):
1. Renders without MISSING_MESSAGE errors (console.error + console.warn spy)
2. No raw translation key leaks into rendered text (per-span data-key → text content assertion)

Harness exercises 19 keys from 8 namespaces: `nav` (4), `listing` (2), `auth` (2), `common` (3), `cabinet` (2), `admin.sidebar` (2), `notifications` (2), `contact` (2).

### G2 planted-violation proof

Renamed `nav.home` → `nav.home_BROKEN` in `messages/sq.json`:
```
3 failed | 5 passed (8)

FAIL  locale: sq > renders without MISSING_MESSAGE errors
  expected [] to equal [
    "Error: MISSING_MESSAGE: Could not resolve `nav.home` in messages for locale `sq`.",
    "Error: MISSING_MESSAGE: Could not resolve `nav.home` in messages for locale `sq`.",
  ]
```

Restored → 8/8 green.

## G3 — Hydration self-test (EXISTING — confirmed blocking)

`npm run check:hydration:verify` already present as a blocking step in `governance-pr.yml` line 89-90 ("Hydration gate self-test"). Transcript:
```
✅ GATE IS FUNCTIONAL — planted violation was correctly detected.
   The gate will FAIL on real hydration mismatches in the Next.js app.
```

No change needed. G3 is the built-in planted violation — it self-tests.

## G4 — Mobile overflow (EXISTING — confirmed coverage)

`screenshots:assert` covers 77 stories × 14 viewports × 4 locales (uk@320/375/390 mandatory). Critical surfaces confirmed present (see investigation notes above). No new stories were added. No NEW G4 planted violation was performed because G4 is an existing gate, not a new deterministic gate built in this task.

## Gate wiring

- Added `"test:i18n-hydration"` script to `package.json` (runs G1+G2 vitest files)
- Added two new blocking CI steps in `governance-pr.yml`:
  1. "i18n/hydration regression guard (Epic RS Slice 6)" — `npm run test:i18n-hydration`
  2. "Static i18n parity gate (sq/en/uk/it key-set match)" — `npm run check:i18n`
- Confirmed `check:hydration:verify` already blocking (line 89-90)

## Owner-run LIVE evidence (NOT a CI step)

These are owner-run because they need a live runtime, per the 2026-06-17 scope decision:

**Public-route hydration:** Owner-run command:
```
BASE_URL=http://localhost:3000 HYDRATION_LISTING_PATH=/en/listings/<real-slug> npm run check:hydration
```
Evidence to be pasted by owner when stable local runtime + real listing slug available. Registry row marked 🟡 — flips to ✅ when owner pastes PASS results.

**Mobile route overflow:** Live-route overflow evidence at 320/375/390 is owner-run and not yet provided. `npm run screenshots:assert` / `screenshots:assert:fast` is **Storybook story-level** evidence (77 stories × viewports × locales), NOT live-route evidence. The mobile registry row ✅ is based on deterministic story coverage only. If live-route overflow evidence is required for full ✅, it remains owner-pending:
```
# Owner inspects critical live routes at 320/375/390 (uk@320 mandatory) for horizontal scroll
```

## Self-validation (AC10/AC11/AC12)

- `npx tsc --noEmit` = 0 errors
- `npm run lint` = clean
- `npm run test:i18n-hydration` = 33 tests passed (25 G1 + 8 G2)
- `npm run check:hydration:verify` = GATE IS FUNCTIONAL
- `npm run check:i18n` = ✅ Parity PASSED (1821 keys × 4 locales)
- `npm run check:file-integrity:all` = all 960 files clean

## AC-by-AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — G1 vitest (date-format SSR/CSR parity) | DONE | 25 tests: literal-byte + TZ-invariance + edge cases |
| AC2 — G2 vitest (i18n render parity) | DONE | 8 tests: 4 locales × (MISSING_MESSAGE + raw-key leak) |
| AC3 — `check:hydration:verify` blocking in CI | DONE | Already present at governance-pr.yml line 89-90 |
| AC4 — `test:i18n-hydration` script + CI wiring + `check:i18n` confirmed blocking | DONE | package.json + governance-pr.yml updated |
| AC5 — Planted-violation transcripts (G1, G2, G3) | DONE | G1: 5/25 FAIL; G2: 3/8 FAIL; G3: built-in self-test |
| AC6 — Owner-run LIVE evidence documented | PARTIAL / OWNER-PENDING | Exact commands documented; public hydration PASS evidence pending owner-run `BASE_URL=http://localhost:3000 HYDRATION_LISTING_PATH=/en/listings/<real-slug> npm run check:hydration`; mobile live-route overflow evidence also owner-pending (story-level coverage confirmed, not live routes) |
| AC7 — Registry P1 rows updated per scope decision | DONE | i18n ✅, hydration-self-test ✅, public hydration 🟡 (owner-run evidence pending), admin hydration 🟡 (6b), date-format ✅, mobile ✅ (deterministic story-level; live-route overflow owner-pending) |
| AC8 — Mobile-overflow coverage confirmed | DONE | 77 Storybook stories covering all critical surfaces, uk@320/375/390 present; this is story-level (deterministic), not live-route evidence |
| AC9 — No product/message/formatter change | DONE | Only test files, package.json, CI, registry, docs |
| AC10 — `npx tsc --noEmit` clean | DONE | 0 errors |
| AC11 — `npm run lint` clean | DONE | No warnings |
| AC12 — `npm run check:file-integrity:all` clean | DONE | 960 files clean |
| AC13 — Investigation notes in session log | DONE | See investigation section above |

## Files Changed

| Path | Why |
|------|-----|
| `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` | NEW — G1 date-format SSR/CSR parity guard (25 tests) |
| `src/i18n/__tests__/i18n-render-parity.smoke.test.tsx` | NEW — G2 i18n render-parity smoke (8 tests) |
| `package.json` | Added `test:i18n-hydration` script |
| `.github/workflows/governance-pr.yml` | Added blocking `test:i18n-hydration` + `check:i18n` CI steps |
| `docs/critical-flow-registry.md` | P1 rows updated per owner scope decision |
| `docs/backlog.md` | Task 445 status → IMPLEMENTED |
| `docs/sessions/2026-06-17-task445-i18n-hydration-mobile-shield.md` | This session log |
