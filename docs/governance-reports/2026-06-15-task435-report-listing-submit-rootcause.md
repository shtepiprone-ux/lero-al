# Hypothesis-Ranked Diagnosis — Task 435: Report-listing submit failure (pending owner discriminators D1/D2/D3)

**Date:** 2026-06-18 (diagnosed) · **Reported:** 2026-06-15  
**Symptom:** "Report this listing" dialog → Submit → generic toast "Failed to submit report. Please try again."  
**Error signature (browser console):** `Fetch failed loading: POST "http://localhost:3000/uk/listings/<slug>"` at `reportListing.ts:23`

## Evidence layers

### E1 — Browser console (owner-provided, 2026-06-15)
```
reportListing.ts:23 Fetch failed loading: POST "http://localhost:3000/uk/listings/<slug>".
  (anonymous) @ fetch.ts:86
  fetchServerAction @ server-action-reducer.ts:92
  (anonymous) @ reportListing.ts:23
  handleSubmit @ ListingReportDialog.tsx:53
```
This is a **transport-layer failure** — the POST never received a valid RSC response. An RLS denial would return HTTP 200 with `{ error: 'save_failed' }` and a clean error toast.

### E2 — Server-action response
Not captured (the POST itself fails/aborts before a typed response is returned). The `result.error` branch that fires is the `startTransition` catch-all, not one of the named branches (unauthorized/blocked/save_failed).

### E3 — Server terminal
Not captured by the owner at report time. The kickoff notes heavy `[Fast Refresh] rebuilding` around the failure, consistent with a dev-only stale-action-ID scenario.

## Primary probable cause (pending D1/D2/D3 confirmation)

**Hypothesis 1 (co-primary with Hypothesis 3) — Middleware intercepts server-action POST on localized routes.**

The `next-intl/middleware` (`createMiddleware(routing)` in `src/middleware.ts:6`) runs on **every request** matched by the middleware config, including POST requests. The matcher pattern `/((?!api|auth|admin|_next/static|...).*)`  matches `/{locale}/listings/{slug}` for ALL HTTP methods.

When a server action fires, Next.js sends a POST to the current page URL (e.g. `POST /uk/listings/my-listing`) with special headers (`Next-Action`, `Next-Router-State-Tree`). The `next-intl/middleware` processes this POST as a locale-routing request — it may rewrite/redirect the response, corrupting the RSC action payload that Next.js expects. This is a documented footgun with `next-intl` middleware and server actions.

**Code path:**
1. `ListingReportDialog.tsx:53` → `startTransition(() => reportListingAction(...))`
2. Next.js dispatches `POST /uk/listings/<slug>` with `Next-Action` header
3. `src/middleware.ts:9` → `refreshSession(request)` (runs, returns cookies)
4. `src/middleware.ts:11` → **`handleI18nRouting(request)`** ← processes the POST as a navigation request
5. The response returned by `handleI18nRouting` is a locale-routing response (potentially a redirect/rewrite), NOT the RSC server-action response Next.js expects
6. → `Fetch failed loading: POST` in the browser

**Why the inquiry action MAY work (D3 discriminator, untested):** `submitListingInquiry` (`src/modules/listings/actions/submitListingInquiry.ts`) is the same pattern — a `'use server'` action called from the same page. If it also fails, this confirms the middleware-wide hypothesis. If it works, there's an action-specific difference (but both use `startTransition` → identical dispatch path). *This discriminator was not captured in the report.*

**Co-primary: Hypothesis 3 — Dev-only stale action ID.** The heavy `[Fast Refresh] rebuilding` logs in the owner's console make this at least co-primary. When `next dev` hot-reloads, pages rendered before a recompile can POST a server-action ID the new bundle no longer recognizes → 500. This would NOT reproduce under `npm run build && npm start`. *Discriminator D2 was not captured.*

**D1 (server terminal) is the single decisive artifact** that distinguishes hyp 1 from hyp 3: a redirect/rewrite in the terminal → hyp 1; a "no server action found" 500 stack → hyp 3; no terminal output at all → middleware consumed the POST silently.

**Hole in Hypothesis 1:** if the request URL already carries the correct locale prefix (e.g. `/uk/listings/...` and the detected locale is `uk`), `handleI18nRouting` typically returns a pass-through `next()` response, NOT a redirect. Middleware corruption is only decisive if D1 shows a redirect/rewrite response or no terminal stack at all. If D1 shows a clean 500 with a stale-action-ID error, hyp 3 is the primary.

**DEMOTED: Hypothesis 4 — RLS.** Task 270 (2026-05-28) confirmed the `listing_reports_insert_own` policy is correctly `TO authenticated WITH CHECK (auth.uid() = user_id)`. The action passes `user_id: user.id` from `getUser()`. This policy is correct and would produce `{ error: 'save_failed' }` + HTTP 200, NOT "Fetch failed loading: POST".

## Affected files / DB objects

| File / Object | Role in the bug |
|---|---|
| `src/middleware.ts:6-11` | `handleI18nRouting(request)` runs on server-action POSTs — the probable cause |
| `src/modules/listings/components/ListingReportDialog.tsx:51-66` | `handleSubmit` collapses all non-`already_reported` errors into one catch-all toast (AC6 UX finding) |
| `src/modules/listings/actions/reportListing.ts` | The action itself is correct — the failure is upstream (middleware) |
| `listing_reports` table + `listing_reports_insert_own` policy | Verified correct (Task 270) — NOT the cause |

## Recommended fix (NOT applied — describe only)

### Fix A — Middleware: skip server-action POSTs
In `src/middleware.ts`, detect server-action POSTs by the `Next-Action` header and skip `handleI18nRouting` for them (only run `refreshSession`):

```typescript
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionResponse = await refreshSession(request)

  // Server-action POSTs carry the Next-Action header — locale routing
  // must NOT process them (it corrupts the RSC action response).
  const isServerAction = request.method === 'POST' && request.headers.has('Next-Action')
  const response = isServerAction
    ? NextResponse.next({ request })
    : handleI18nRouting(request)

  for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
    response.cookies.set(name, value, options)
  }
  return response
}
```

### Fix B — UX messaging: per-branch error toasts (AC6)
`ListingReportDialog.handleSubmit` currently collapses EVERY non-`already_reported` error into one unhelpful `report_error` toast. The follow-up fix must add a per-branch, user-actionable, 4-locale (sq/en/uk/it) message map:

| Error branch | Current toast | Recommended toast |
|---|---|---|
| `unauthorized` | "Failed to submit report. Please try again." | "Sign in to report this listing" (sq/en/uk/it) |
| `account_blocked` | same | "Your account is restricted. Contact support." (sq/en/uk/it) |
| `account_suspended` | same | "Your account is temporarily suspended." (sq/en/uk/it) |
| `save_failed` (server) | same | "Problem on our side — please try again later." (sq/en/uk/it) |
| `invalid_reason` | same | Should never surface (guard in UI) — keep generic |
| Transport failure (no result) | JS exception, no toast | "Connection error — please try again." (sq/en/uk/it) |

### Fix C — Follow-up task MUST capture D1/D2/D3 before applying or approving Fix A
The follow-up FIX task's first steps (not a blocker to opening it, but a blocker to merging):
1. **(D1)** Capture server terminal output at Submit click time — the single decisive artifact.
2. **(D2)** Test under `npm run build && npm start` — dev-only ⇒ hyp 3 primary, Fix A is hardening.
3. **(D3)** Test the sibling "Send message" inquiry action on the same page — BOTH fail ⇒ middleware-wide.

## Owner discriminators still needed

- **(D1) Server terminal output** at the moment of Submit — confirms whether the POST reaches the action at all or dies in middleware.
- **(D2) Production build test** — `npm run build && npm start` → if it works, hypothesis 3 (dev-only) is the primary and Fix A is a bonus hardening.
- **(D3) Sibling action** — does "Send message" (listing inquiry) also fail? If yes → middleware-wide. If no → action-specific.
