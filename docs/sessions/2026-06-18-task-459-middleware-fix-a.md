# Session — Task 459: Report-listing middleware Fix A — NOT APPLIED

**Date:** 2026-06-18  
**Epic:** BB · **Type:** Middleware / server-action transport investigation  
**Executor:** Sonnet 4.6  
**Decision:** Fix A NOT applied. Hypothesis 1 not confirmed by synthetic dev D1-Network probe. Full interactive D1/D2/D3 was not available in the executor environment, so no production middleware change is justified.

## Phase 0 — Discriminator capture

### D1 — Server terminal
Not captured interactively (no browser + authenticated session available in executor environment).

### D1-Network — Synthetic curl probe on running dev server (partial substitute for interactive D1-Network)

Started `npm run dev` on port 3099. Sent three requests to `/uk/listings/test-slug` with a synthetic action ID:

**POST with `Next-Action` header (simulated server-action):**
```
HTTP/1.1 404 Not Found
set-cookie: NEXT_LOCALE=uk; Path=/; SameSite=lax
x-nextjs-action-not-found: 1
content-type: text/plain
Body: "Server action not found."
```
- **No `Location` header** — no redirect.
- **No `x-middleware-redirect`** — no middleware redirect.
- **No `x-middleware-rewrite`** — no middleware rewrite.
- The middleware passed the POST through to Next.js, which returned `x-nextjs-action-not-found` because the probe used a synthetic action ID. `NEXT_LOCALE=uk` cookie set (confirming `refreshSession` + i18n ran).

**POST with `Next-Action` to `/sq/` (different locale):**
```
HTTP/1.1 404 Not Found
set-cookie: NEXT_LOCALE=sq; Path=/; SameSite=lax
x-nextjs-action-not-found: 1
```
No locale redirect on the action POST, even with a different locale prefix.

**POST without `Next-Action` (regular form POST):**
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```
Normal page render through `handleI18nRouting` — correct behavior.

**Limitation:** This probe used a synthetic action ID, not a real server-action dispatch from a rendered page. It confirms the middleware does not add redirect/rewrite headers to POST+Next-Action requests, but does not fully replicate the owner's original failure conditions (authenticated user, real action ID, potentially after a hot-reload).

### D2 — Production build
Not tested. The executor environment could not run an interactive browser session to reproduce the failure under `npm run build && npm start`.

### D3 — Sibling action
Not tested interactively. Requires browser + authenticated session to compare report vs inquiry action behavior on the same page.

## Classification

**Hypothesis 1 (middleware corruption): NOT CONFIRMED.** The synthetic D1-Network probe showed no middleware redirect/rewrite for POST+Next-Action. The `next-intl/middleware` v4.12.0 `handleI18nRouting` passed the POST through cleanly in all three probes. However, this does not fully rule out Hypothesis 1 under conditions not covered by the probe (e.g. a real action dispatch after hot-reload, an authenticated session with specific cookie state).

**Hypothesis 3 (dev-only stale action ID): MOST CONSISTENT with available evidence.** The owner's `[Fast Refresh] rebuilding` logs + the `Fetch failed loading: POST` error signature are consistent with a stale action ID after hot-reload. The `x-nextjs-action-not-found: 1` response in the probe demonstrates the exact mechanism Next.js uses when an action ID is unknown. However, this is not fully proven because production build (D2) and interactive sibling-action (D3) checks were not captured.

**Conclusion:** The synthetic probe showed no middleware redirect/rewrite for POST+Next-Action; therefore no production middleware change is justified. The original failure remains most consistent with a dev-only stale action ID, but this is not fully proven because production build and interactive sibling-action checks were not captured. Fix B (Task 458) already ships per-branch user-actionable error toasts, so the user experience is addressed regardless of transport outcome.

## Mobile <640 gate — EXEMPT

Middleware-only task; no rendered surface, no UI change, no dialog, no control.

## Verification

- Baseline report-listing tests: 16/16 GREEN
- `tsc --noEmit`: 0 errors
- No `middleware.ts` edit
- No middleware test added

## AC self-audit

| AC | Status | Evidence |
|---|---|---|
| AC1 | Partial | D1-Network synthetic probe captured; D1 terminal / D2 prod / D3 sibling not captured (environment limitation); decision = Fix A not applied — no prod evidence for middleware corruption |
| AC2 | N/A | Fix A not applied |
| AC3 | N/A | No middleware test added |
| AC5 | ✅ | tsc=0; baseline 16/16 GREEN |
| AC6 | ✅ | Mobile gate exemption stated |
| AC7 | ✅ | Registry updated; session log written |

## Files Changed

| Path | Rationale |
|---|---|
| `docs/critical-flow-registry.md` | Registry row: Task 459 resolution |
| `docs/sessions/2026-06-18-task-459-middleware-fix-a.md` | This session log |
