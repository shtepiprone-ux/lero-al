# Session Log — Task 292: `next/cache` test-environment stub

**Date:** 2026-05-29
**Task:** 292
**Sprint:** 17
**Type:** test infrastructure (NO production change)
**Executor:** Sonnet 4.6

---

## 1. Why this task exists

`applyListingTransition.ts` imports `revalidateTag` + `revalidatePath` from `next/cache` (line 41) and calls them after every successful DB transition (lines 127, 132, 134). Under Vitest (jsdom — no Next.js request scope), these functions throw:

```
Error: Invariant: static generation store missing in revalidateTag site-stats
 ❯ revalidate node_modules/next/src/server/web/spec-extension/revalidate.ts:89
 ❯ executeTransition src/modules/listings/actions/applyListingTransition.ts:127
```

Every test that drives a **successful** transition explodes before returning. 19 tests fail. Permission-denied / invalid-transition / DB-error tests pass because they return BEFORE reaching `revalidateTag`.

The fix mirrors the existing `server-only` stub pattern introduced in Task 290 (`vitest.config.ts` line 18 → `src/tests/server-only-stub.ts`): add a new alias that maps `next/cache` to a no-op stub module.

---

## 2. Investigation Outputs

### §1 — BEFORE state

```
npx vitest run src/modules/listings/actions/applyListingTransition.test.ts

Tests  19 failed | 21 passed (40)
```

All 19 failures share the same root cause: `Invariant: static generation store missing in revalidateTag site-stats`.

### §2 — `next/cache` surface imported across the codebase

```
grep -rIn "from 'next/cache'" src/ --include="*.ts" --include="*.tsx"
```

Unique exports consumed:

| Export | Files |
|--------|-------|
| `revalidateTag` | `applyListingTransition.ts`, `admin/actions/{currencies,propertyTypes,exchangeProviders,index}.ts`, `cabinet/actions/index.ts`, `listings/actions/deleteListing.ts` |
| `revalidatePath` | `applyListingTransition.ts`, many admin, cabinet, listings action files |
| `unstable_cache` | `lib/getExchangeRateServer.ts`, `admin/lib/propertyTypes.ts`, `listings/lib/queries.ts` |

`unstable_noStore` — NOT imported anywhere in the codebase → NOT added to stub.

### §3 — Alias blast-radius check (`unstable_cache`)

`unstable_cache` consumers:
- `src/lib/getExchangeRateServer.ts:159` — `export const getExchangeRates = unstable_cache(...)`
- `src/modules/admin/lib/propertyTypes.ts:8` — `export const getPropertyTypes = unstable_cache(...)`
- `src/modules/listings/lib/queries.ts:99` — `export const getSiteStats = unstable_cache(...)`

Test files in the repo:
```
src/lib/__tests__/cloudinaryDelete.test.ts
src/modules/listings/components/__tests__/FavoriteButton.test.tsx
src/modules/listings/components/__tests__/favoritesShell.liveCounts.test.ts
src/modules/listings/components/__tests__/realtimeRaceGuard.test.ts
src/lib/phone/__tests__/phone.test.ts
src/lib/auth/__tests__/controller.test.ts
src/modules/auth/__tests__/AuthContext.test.tsx
src/modules/listings/actions/applyListingTransition.test.ts
```

**None of these test files import `getExchangeRateServer.ts`, `propertyTypes.ts`, or `queries.ts`.** No test asserts caching behavior (call-count memoization). A pass-through `unstable_cache` is completely safe.

**Conclusion: PRIMARY approach (global alias in `vitest.config.ts`) is safe.**

---

## 3. Approach — PRIMARY (global alias)

Chosen because §3 confirmed no test depends on real `next/cache` caching behavior. All three `unstable_cache` consumers are server-only data-fetching modules not imported by any test file. A global alias is the correct solution — clean, zero per-file boilerplate, exactly mirrors the existing `server-only` pattern.

FALLBACK (per-file `vi.mock`) was NOT used because there is no evidence of caching-behavior assertions in any test.

---

## 4. `next/cache` Stub — Exports and Rationale

**`src/tests/next-cache-stub.ts`:**

```ts
export function revalidateTag(_tag: string): void {}
export function revalidatePath(_path: string, _type?: 'page' | 'layout'): void {}
export function unstable_cache<T>(fn: T): T { return fn }
```

| Export | Why included | Implementation |
|--------|-------------|----------------|
| `revalidateTag(tag: string)` | Used in `applyListingTransition.ts:127` and many admin/cabinet action files | No-op — cache invalidation is meaningless in jsdom |
| `revalidatePath(path: string, type?)` | Used in `applyListingTransition.ts:132,134` and many action files | No-op — same rationale |
| `unstable_cache<T>(fn: T): T` | Used in `getExchangeRateServer.ts`, `propertyTypes.ts`, `queries.ts` | Pass-through — callers get the raw function (no memoization in tests; no Next.js cache anyway) |
| `unstable_noStore` | NOT consumed anywhere → NOT added | — |

**`vitest.config.ts`** — added one alias line immediately below the existing `server-only` alias:
```ts
// next/cache functions require a Next.js request scope missing in jsdom — stub to no-ops
'next/cache': path.resolve(__dirname, './src/tests/next-cache-stub.ts'),
```

---

## 5. Results

### Target file

```
npx vitest run src/modules/listings/actions/applyListingTransition.test.ts

Test Files  1 passed (1)
      Tests  40 passed (40)     ← was 19 failed | 21 passed
```

19 previously-failing success-path tests now pass. All pass by exercising the REAL success path (mock DB returns `{ error: null }` via `_db` injection; `revalidateTag`/`revalidatePath` are called but are no-ops). Zero tests skipped, deleted, or weakened.

### Whole suite (baseline includes Task 291 — already merged)

```
npx vitest run

Test Files  12 passed (12)
      Tests  344 passed (344)   ← was 19 failed | 325 passed (344)
```

**0 failures** — the suite is fully green for the first time in Sprint 17.

Before/after summary:

| Baseline | Failures | Passing |
|----------|----------|---------|
| Before Task 291 | 26 | 318 |
| After Task 291 | 19 (`applyListingTransition` only) | 325 |
| After Task 292 (this) | **0** | **344** |

---

## 6. Production Code — Confirmation Unchanged

`applyListingTransition.ts` was NOT touched. The alias is resolved at Vitest config level only — production builds continue to import the real `next/cache` from `node_modules`.

---

## 7. Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/tests/next-cache-stub.ts` | NEW — 3 no-op exports (`revalidateTag`, `revalidatePath`, `unstable_cache` pass-through) | Test-env stub for `next/cache` request-scope side-effects |
| `vitest.config.ts` | Added one `resolve.alias` entry + comment | Maps `next/cache` to stub in jsdom env, mirrors `server-only` pattern |
| `docs/backlog.md` | Task 292 ✅ standard closure | Task 264 contract |
| `docs/sessions/2026-05-29-task-292-next-cache-test-stub.md` | NEW — this file | Task 264 contract |

No `src/` production code changed. `applyListingTransition.ts` is byte-identical.

---

## 8. AC Self-Audit (Note 18)

| AC | Status |
|----|--------|
| `applyListingTransition.test.ts` → 0 failures (40/40 pass) | ✅ |
| Whole-suite → 0 failures (344/344 pass) | ✅ baseline includes Task 291 |
| 19 tests pass by exercising REAL success path | ✅ `_db` injection returns `{ error: null }`; revalidate calls are no-ops |
| None skipped, deleted, or weakened | ✅ confirmed — grep for `it.skip` / `xit` in test file = 0 hits |
| NO production file changed | ✅ only `src/tests/` + `vitest.config.ts` + docs |
| `applyListingTransition.ts` byte-identical | ✅ |
| Stub exports match codebase consumption (no extras) | ✅ `unstable_noStore` NOT included — nothing imports it |
| `npx tsc --noEmit` → 0 errors | ✅ |
| `npm run lint` → no NEW errors | ✅ 7 errors / 10 warnings — exactly pre-existing baseline |
| PRIMARY approach justified via §3 evidence | ✅ no test imports `unstable_cache` consumers |
| Note 18 self-validation block | ✅ |
| "Files Changed" table per Task 264 | ✅ |
| locale / breakpoints | N/A — test infra only |

**Self-validation: `tsc=0 errors · applyListingTransition suite green (40/40) · whole-suite failures=0 (with T291) · production untouched · scope=test-infra+docs · PASS`**
