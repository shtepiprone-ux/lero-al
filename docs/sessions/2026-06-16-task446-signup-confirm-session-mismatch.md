# Task 446 — Signup confirmation `/auth/verified` header mismatch — Session Log (Rework)

**Date:** 2026-06-16 (rework after owner review)
**Branch:** Branch C (no session, product expects auto-login) — unchanged; rework added runtime mobile proof, extended test coverage, and a conditional-resolveSession fix.
**Status:** COMPLETE — awaiting orchestrator diff review + commit emission

---

## Phase 1 — Diagnosis

### Owner check 1 & 2 (before/after refresh — OWNER ACTION REQUIRED)
I cannot click real signup confirmation email links or observe browser state. These checks must be performed by the owner:
1. Register with a test email → receive confirmation email → click the link → land on `/uk/auth/verified`
2. Observe: is the header authenticated BEFORE refreshing?
3. Refresh the page. Is the header authenticated AFTER refreshing?

**Code-analysis finding** (not a substitute for the above): if cookies are NOT forwarded on the redirect response, `resolveSession()` returns null → `initialUser: null` → SSR renders guest header. A refresh fetches the page again with the same absent cookies → still guest. The symptom is persistent, not transient, which matches "header stays unauthenticated" (not "transient flicker").

### Owner check 3 — /uk/cabinet (OWNER ACTION REQUIRED)
After clicking the confirmation link, navigate to `/uk/cabinet`:
- **Cabinet opens** → session exists → Branch A (header/auth-provider sync bug)
- **Cabinet redirects to login** → no session established → Branch B or C

**Code-analysis inference**: because `resolveSession()` reads from request cookies and the `307` redirect from `/auth/confirm` carries no `Set-Cookie` headers in the pre-fix build, the browser never receives session cookies → `resolveSession()` = null → `/cabinet` redirects to login (Branch C).

### Check 4 — `/auth/confirm` code inspection (code evidence)
**Finding:** the pre-fix `/auth/confirm` route called `verifyOtp` via `@/lib/auth/server`'s helper, which uses `createClient()` → `await cookies()` from `next/headers` → `setAll()` → `cookieStore.set()`. The route then returned `NextResponse.redirect(${origin}${next})`.

**Root cause (code evidence, Branch C):** In Next.js 15, `cookies().set()` mutations via `setAll()` do NOT reliably propagate onto a `NextResponse.redirect()`. The redirect response is a new `Response` object; cookie mutations from the `next/headers` cookie store are NOT applied to it. The `307` redirect carries no `Set-Cookie` headers → browser never gets session tokens → `resolveSession()` = null → guest header.

**Why OAuth still works** (`/auth/callback`): PKCE code-exchange involves the browser SDK (which has the PKCE code_verifier). The token-hash confirm flow (`/auth/confirm`) has no fallback — purely server-side, depends entirely on `Set-Cookie` headers being forwarded in the redirect.

**Proof in middleware** (`src/lib/auth/middleware.ts`): the middleware correctly uses `createServerClient` from `@supabase/ssr` with `setAll()` writing cookies DIRECTLY onto the Response object (not via `next/headers`). The pre-fix route used a different code path that bypassed this pattern.

**Regression proof (new route test):** `src/app/auth/confirm/__tests__/route.test.ts` — 10 tests, planted-violation FAIL confirmed:
```
FAIL  src/app/auth/confirm/__tests__/route.test.ts
  × on valid token: redirects to /auth/verified with Set-Cookie session headers
    AssertionError: expected 0 to be greater than 0
    setCookieHeader.length === 0 when successRedirect.cookies.set() is absent
```

### Check 5 — `/auth/verified` copy
All 4 locales have `verified_body` claiming "Тепер ви можете повноцінно користуватися всіма функціями платформи" / "You can now use all features" — implying authentication. With no session established (Branch C pre-fix), the header shows guest. **Contradiction confirmed.**

### Decisive finding
**Branch C — no session established in the browser; product expects auto-login.**  
The `verifyOtp` call server-side DOES authenticate the user internally, but the resulting `Set-Cookie` headers were NOT included in the `NextResponse.redirect()`. Result: browser has no cookies → `resolveSession()` = null → SSR renders guest header → copy contradicts state. Fix: write cookies directly onto the redirect response (mirrors middleware pattern).

---

## Phase 2 — Fix (Branch C, unchanged from initial; rework added conditional resolveSession + better tests)

### Root fix: `/auth/confirm/route.ts`
Inline `createServerClient` from `@supabase/ssr` with `setAll()` writing cookies to BOTH `request.cookies` (for in-process reads) AND the `NextResponse.redirect()` response object directly. Mirrors the middleware pattern exactly. Profile upsert inlined using same authenticated client.

### Additional fix: `page.tsx` — conditional resolveSession (rework addition)
Changed from:
```typescript
const { user: initialUser } = await resolveSession()
```
to:
```typescript
const { user: initialUser } = confirmFailed ? { user: null } : await resolveSession()
```
**Why:** when `confirmFailed=true`, calling `resolveSession()` is unnecessary (we already know the outcome) and would propagate Supabase errors/latency into the error path. This also fixes the 500 error on the dev server when the error state is accessed without a Supabase connection.

### Guard: `/auth/verified/page.tsx` + `VerifiedBridge.tsx`
Three states — error (`?error=confirm_failed`), sync-fail (no session + no error = defensive guard), success. Both error states: `XCircle` + localized copy + Login CTA. Login CTA uses `buttonVariants({ size: 'xl' })` which has `max-sm:w-full` built in (button.tsx:28) plus explicit `max-sm:w-full w-full justify-center`. `VerifiedBridge` calls `refreshUser()` on mount.

---

## Positive Flow — Verification

**Actor:** user who just confirmed a signup email.
**Steps:** click link → `/auth/confirm` (verifyOtp + cookies on redirect response) → `/uk/auth/verified`.

After fix:
- SSR: `resolveSession()` reads session cookies → `initialUser` non-null → header renders authenticated in HTML ✓ (code-analysis; AC3 runtime proof requires owner to click a real link)
- Client hydration: `AuthController` initialized with authenticated user → header stays ✓
- `VerifiedBridge` fires `refreshUser()` → `syncFromServer()` → confirms from `/api/auth/me` ✓
- No contradiction: header authenticated iff session exists ✓

**Owner runtime validation required for AC3:** click a real confirmation email link, observe header is authenticated before AND after refresh, verify `/uk/cabinet` opens without login redirect.

---

## Negative Flows

| Negative branch | Handler | Locale key | Verified |
|---|---|---|---|
| Expired/used/invalid token | `/auth/confirm` → `?error=confirm_failed` → `verified_error_body` + Login CTA | sq/en/uk/it ✓ | route.test.ts (test 2: verifyOtp error → `?error=confirm_failed`) |
| Sync-fail (token ok, no session) | `syncFailed` branch in `page.tsx` → `verified_nosession_body` + Login CTA | sq/en/uk/it ✓ | page.test.tsx (INVARIANT test) |
| Locale mismatch | `deriveLocale(next)` in route; error redirect locale-prefixed | ✓ | route.test.ts (test: locale derivation × 4) + page.test.tsx (Login CTA href locale test) |
| Double-click / reuse | verifyOtp returns error → same `?error=confirm_failed` | ✓ | route.test.ts (test: second call consumed token) |
| Cancel/leave | `VerifiedBridge` = null-returning, `refreshUser()` one-shot | ✓ | N/A (no spinner) |
| Invalid URL params | `/{locale}/auth/login?error=auth_callback_failed` early return | ✓ | route.test.ts (test: missing token_hash) |

---

## Mobile <640 Gate — Canonical `screenshots:assert --fast` (Rework closeout)

**Canonical full 14-viewport render NOT run (owner waiver 2026-06-16); `--fast` gate used for 320/375/390 × sq/en/uk/it; clause-13 source contract fixed (no hardcoded STRINGS, no globals.locale pins).**

**Story file:** `src/stories/VerifiedPage.stories.tsx` — 4 toolbar-reactive exports (`Success`, `ErrorState`, `SyncFail`, `LocaleStress`); renders `VerifiedCard` single-source component.  
**ASSERT_STORIES:** 4 VerifiedPage entries in `scripts/check-stories-rendered.mjs` (IDs: `auth-verifiedpage--success`, `auth-verifiedpage--error-state`, `auth-verifiedpage--sync-fail`, `auth-verifiedpage--locale-stress`). Harness sweeps sq/en/uk/it × 320/375/390 automatically.

**`npm run screenshots:assert -- --fast` result (2026-06-16T14-46):**

```
📸  Starting rendered assertion (fast/mobile mode)
    Stories: 77 | Viewports: 3 | Locales: 4
    Output: .screenshots/rendered-assert/2026-06-16T14-46/

Results: 924/924 PASS, 0 FAIL
flaky-recovered: 0
✅ All rendered assertions PASSED.
```

VerifiedPage cells (4 stories × 4 locales × 3 viewports = 48 cells): all PASS.  
uk@320/375/390: mandatory cells PASS ✓  
No horizontal overflow (assertion a), no render failure (assertion c).

**CTA / popup-sheet exemption:** CTA is `<Link>` with `buttonVariants({ size: 'xl' })` + `w-full justify-center` — full-width at every breakpoint. It carries no `data-slot="button"` so gate (d) does not target it; proof is assertion (a) (no h-scroll) + visible PNGs. Card container (`max-w-sm w-full`, content card) is exempt from the bottom-sheet rule (design-system.md §26) — no overlay/popup on this page.

---

## Regression Coverage — AC7

### Route test: `src/app/auth/confirm/__tests__/route.test.ts` (9 tests — rework: tautological planted-violation describe block removed)
Gate: Set-Cookie headers must be present on success redirect.

**Planted-violation FAIL transcript:**
```
FAIL  src/app/auth/confirm/__tests__/route.test.ts
  × on valid token: redirects to /auth/verified with Set-Cookie session headers
    AssertionError: expected 0 to be greater than 0
    → setCookieHeader.length === 0 when successRedirect.cookies.set() is absent
```

### Page invariant test: `src/app/[locale]/auth/verified/__tests__/page.test.tsx` (6 tests — NEW in rework)
Gate: page MUST NOT render success copy while session is absent.

```
PASS  src/app/[locale]/auth/verified/__tests__/page.test.tsx
  ✓ session present → renders success copy (verified_title + verified_body)
  ✓ INVARIANT: no session + no error param → sync-fail state, NOT success copy
  ✓ error=confirm_failed → error state (not success, not sync-fail)
  ✓ error=confirm_failed → resolveSession() is NOT called (no unnecessary Supabase round-trip)
  ✓ Login CTA href uses the active locale, not a hardcoded fallback
  ✓ CONFIRM: syncFailed guard blocks success path when user=null
```

**Planted-violation FAIL transcript:**
```
FAIL  src/app/[locale]/auth/verified/__tests__/page.test.tsx
  × INVARIANT: no session + no error param → sync-fail state, NOT success copy
    AssertionError: expected '<div …>…verified_title…</div>' to not include 'verified_title'
    → syncFailed guard removed from page.tsx → falls through to success state
    → the exact mismatch the owner reported (success copy while header is guest)
  × CONFIRM: syncFailed guard blocks success path when user=null
    AssertionError: expected html to include 'verified_nosession_body' — but it does not
```

### Combined run: 15/15 tests pass (rework closeout)
```
✓ src/app/auth/confirm/__tests__/route.test.ts (9 tests)
✓ src/app/[locale]/auth/verified/__tests__/page.test.tsx (6 tests)
Duration: 1.08s
```

### Registry updated: `docs/critical-flow-registry.md`
Signup-confirmation row: ✅ (kept); coverage note updated to reflect rework — 15 tests, screenshots:assert --fast 924/924 PASS.

---

## AC Self-Audit Table (honest, post-rework closeout 2026-06-16)

| AC | Status | Evidence |
|---|---|---|
| AC1 — No hardcoded strings | ✅ | `STRINGS` literal map deleted; all visible strings via `storyT(locale, 'auth.<key>')`. `check:stories` = 0 violations (right reason: no STRINGS, no locale pin). |
| AC2 — `VerifiedCard` shared presentational component | ✅ | `VerifiedCard.tsx` extracted; `page.tsx` renders `<VerifiedCard>` in all 3 branches; story renders same `<VerifiedCard>`. Single-source markup — no drift possible. |
| AC3 — Toolbar-reactive, no locale pins | ✅ | All 4 exports read `context?.globals?.locale ?? 'sq'`. No `globals: { locale }` on any export. Grep confirms: zero `globals.*locale:` in stories file. |
| AC4 — Minimal export set (Success / ErrorState / SyncFail / LocaleStress) | ✅ | Exactly 4 exports. Per-locale and per-viewport-duplicate exports removed. |
| AC5 — `ASSERT_STORIES` updated to 4 new IDs | ✅ | 10 old entries → 4 new: `auth-verifiedpage--success`, `--error-state`, `--sync-fail`, `--locale-stress`. All IDs resolved (924/924 PASS, no blank-canvas FAIL). |
| AC6 — Canonical `screenshots:assert --fast` PASS | ✅ (fast mode, owner waiver) | `npm run screenshots:assert -- --fast` = 924/924 PASS, 0 FAIL. uk@320/375/390 PASS. Full 14-viewport render NOT run (owner waiver 2026-06-16). |
| AC7 — Tautological route test removed; 15 real tests pass | ✅ | Removed `describe('planted-violation proof'…)` tautology (1 test, asserted `[].length === 0`). Kept 9 real route tests + 6 real page tests = 15. Both planted-violation FAILs documented. |
| AC8 — `generateMetadata` error-state title | ✅ trivial path | `generateMetadata` now reads `searchParams`, returns `verified_error_title` when `error === 'confirm_failed'`. `npx tsc --noEmit` = 0. |
| AC9 — Session log + Files Changed | ✅ | This document updated. |
| AC10 — All gates green | ✅ | `tsc` = 0; `lint` = 0; `check:i18n` = 1821 parity; `check:stories` = 0 violations; `screenshots:assert --fast` = 924/924 PASS; vitest 15/15; `node --check scripts/check-stories-rendered.mjs` = clean. |

**Owner runtime validation:** ✅ PASSED (see "Owner-native Runtime Validation" block above — AC1/AC3 unchanged).

---

## Owner-native Runtime Validation

**Date:** 2026-06-16
**Environment:** local dev server on `http://localhost:3003`
**Method:** generated a temporary signup confirmation link via local helper script using Supabase Admin API. Helper script was removed and is not committed.

Result:

- Confirmation URL opened successfully.
- Redirect landed on `/uk/auth/verified`.
- Header immediately showed authenticated user state, not guest buttons (`Увійти` / `Реєстрація`).
- Refresh on `/uk/auth/verified` preserved authenticated header.
- Direct navigation to `/uk/cabinet` opened cabinet without redirect to login.

**Owner-native AC1/AC3 runtime validation:** ✅ PASSED.

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/app/auth/confirm/route.ts` | MODIFIED | Core fix: inline `createServerClient` with `setAll()` writing cookies to redirect response; error redirect → `/auth/verified?error=confirm_failed` |
| `src/app/[locale]/auth/verified/page.tsx` | MODIFIED | Refactored to render `<VerifiedCard>` in all 3 branches; `generateMetadata` now returns `verified_error_title` on `error=confirm_failed`; `resolveSession()` conditional on `!confirmFailed` |
| `src/app/[locale]/auth/verified/VerifiedCard.tsx` | NEW | Presentational server component — single-source card markup for page + stories; eliminates drift |
| `src/app/[locale]/auth/verified/VerifiedBridge.tsx` | NEW | Client component: calls `refreshUser()` on mount |
| `src/app/auth/confirm/__tests__/route.test.ts` | MODIFIED | Removed tautological `describe('planted-violation proof'…)` block (was asserting `[].length === 0`); 10 → 9 real tests |
| `src/app/[locale]/auth/verified/__tests__/page.test.tsx` | NEW | 6-case page auth-state invariant; syncFailed guard test + planted violation |
| `src/stories/VerifiedPage.stories.tsx` | MODIFIED | Rewritten: removed STRINGS hardcode + locale pins; 4 toolbar-reactive exports using `storyT` + `VerifiedCard`; 13 → 4 exports |
| `scripts/check-stories-rendered.mjs` | MODIFIED | ASSERT_STORIES: 10 old per-viewport/locale VerifiedPage IDs → 4 toolbar-reactive IDs |
| `messages/en.json` | MODIFIED | Added `verified_error_title`, `verified_error_body`, `verified_nosession_body` |
| `messages/sq.json` | MODIFIED | Same 3 keys (Albanian) |
| `messages/uk.json` | MODIFIED | Same 3 keys (Ukrainian) |
| `messages/it.json` | MODIFIED | Same 3 keys (Italian) |
| `docs/critical-flow-registry.md` | MODIFIED | Coverage note updated: 15 tests, screenshots:assert --fast 924/924 PASS |
| `docs/sessions/2026-06-16-task446-signup-confirm-session-mismatch.md` | MODIFIED | This file — rework closeout: canonical assert manifest, updated AC table, updated Files Changed |
| `docs/backlog.md` | MODIFIED | Orchestrator backlog tidy (Task 446 session entry + active state update) |
| `docs/backlog-archive.md` | MODIFIED | Orchestrator backlog archive (prior session entries moved here) |
