# Closure Review — Task 281 (auth-session persistence) + Task 291 (auth test reconciliation)

**Reviewer:** Opus 4.8 (orchestrator / reviewer)
**Date:** 2026-05-29
**Type:** strict closure review against literal kickoff AC + real repo state
**Outcome (headline):** Task 281 — **REJECT AS INCOMPLETE**. Task 291 — **REJECT AS INCOMPLETE**. Corrective task **293** created.

> Both tasks are **still uncommitted** in the working tree (HEAD = `42489f21a`, the
> Sprint 17 i18n commit). The earlier Sprint 17 commits covered 277–290 only.
> `docs/backlog.md` already claims "Sprint 17 FULLY CLOSED / Task 281 ✅ / Task 291 ✅"
> — that claim is **uncommitted and false**; see findings.

---

## 1. Files inspected
- Kickoffs: `tasks/Sprints/Sprint_17_kickoff_prompt_Task_281.md`, `…_Task_291.md`, `…_Task_292.md`
- Session logs: `docs/sessions/2026-05-29-task-281-auth-session-persistence.md`, `…-task-291-auth-test-reconciliation.md`
- Auth core: `src/lib/auth/controller.ts`, `src/lib/auth/middleware.ts`, `src/lib/auth/browser.ts`
- Supabase clients: `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`; (`src/lib/supabase/middleware.ts` — **empty/non-existent**)
- Middleware entrypoint: `src/middleware.ts`
- returnTo: `src/modules/auth/lib/sanitizeReturnTo.ts`, `AuthRedirect.tsx`, `AuthSheet.tsx`
- Protected pages: `cabinet/page.tsx`, `favorites/page.tsx`, `listings/create/page.tsx`, `listings/[slug]/edit/page.tsx`, `auth/login/page.tsx`, `admin/layout.tsx`
- Tests: `src/lib/auth/__tests__/controller.test.ts`, `src/modules/auth/__tests__/AuthContext.test.tsx`
- Locales: `messages/{sq,en,uk,it}.json`

## 2. Exact commands run (sandbox, read-only git via `--no-optional-locks`)
```
git --no-optional-locks status --short
git --no-optional-locks log --oneline -14
git --no-optional-locks diff HEAD -- src/lib/auth/controller.ts
grep -rIn "createBrowserClient|createServerClient|@supabase/ssr" src/lib/supabase
grep -rIn "returnTo|next=|session=lost" src/app src/modules/auth
cat src/middleware.ts ; cat src/lib/auth/middleware.ts ; cat src/lib/supabase/admin.ts
grep -c session_recovery_message messages/{sq,en,uk,it}.json
npx tsc --noEmit
npm run lint
grep -rl SUPABASE_SERVICE_ROLE .next/static
wc -l (test files) ; git show HEAD:(test files) | wc -l
```

## 3. Validation results (current working tree)
| Gate | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit` | **FAIL (2)** | `controller.test.ts(694,27): TS1005 '}' expected`; `AuthContext.test.tsx(352,27): TS1005 ')' expected` |
| `npm run lint` | **FAIL (9 errors)** | 7 pre-existing + **2 NEW parse errors** (same two truncated files) |
| `npm run build` | **NOT PROVEN** | Not run; blocked — project gate `tsc=0` fails. Existing `.next` build dated 2026-05-29 10:22 (pre-dates final state) |
| auth `vitest` | **FAIL / un-runnable** | Both auth test files are truncated → won't parse → suites cannot execute. (Sandbox also cannot run vitest: missing native `@rollup/rollup-linux-x64-gnu`.) |
| whole `vitest` | **NOT PROVEN** | Same; owner must run after repair |
| `.next/static` service-role grep | **PASS (0 hits)** | `grep -rl SUPABASE_SERVICE_ROLE .next/static` → none |
| locale parity (`session_recovery_message`) | **PASS (4/4)** | present in sq/en/uk/it |

### 3a. ROOT-CAUSE FINDING — Task 291 corrupted both test files
Both files were written **incomplete (truncated mid-test)**:
- `controller.test.ts`: **693 lines** (HEAD: 714). Ends mid-comment `// Drive to terminal u`. Brace balance +2 unclosed. Lost tail = completion of `unauthenticated state always has user === null` + tests `valid state invariant — no authenticated state without a user` + `… no unauthenticated state with a user` + closing braces.
- `AuthContext.test.tsx`: **351 lines** (HEAD: 353). Ends mid-expression `expect(mockUnsubscribe`. Brace balance +2 unclosed. Lost tail = completion of `Supabase subscription is unsubscribed on unmount` + closing braces.

This is the single biggest blocker: the suite Task 291 was supposed to make green is now **un-parseable**.

---

## 4. Task 281 — AC-by-AC
| # | AC (literal) | Repo evidence | Status | Corrective action |
|---|---|---|---|---|
|1|Canonical browser/server/middleware/admin clients|`client.ts`=`createBrowserClient`; `server.ts`=`createServerClient`; `admin.ts`=service-role + `import 'server-only'`; middleware helper at **`src/lib/auth/middleware.ts`** (kickoff named `src/lib/supabase/middleware.ts`, which is empty)|**PARTIAL** (deviation: helper location)|Document accepted location OR relocate|
|2|`@supabase/ssr` cookie session in use|Confirmed in client/server/middleware|**PASS**|—|
|3|localStorage-only dependency removed|Cookie-based `createBrowserClient`; controller `SIGNED_OUT → syncFromServer()` defers to server cookie truth|**PASS**|—|
|4|Middleware refreshes session per request; matcher excludes static/auth-callback/public|`refreshSession()` calls `getUser()` per request, propagates refreshed cookies; matcher excludes `api\|auth\|admin\|_next/*\|images`|**PASS** (refresh + exclusions). NOTE: `admin` also excluded → admin routes not middleware-refreshed (relies on layout SSR)|Document; verify acceptable|
|5/6|Protected routes redirect to login w/ safe returnTo (in middleware)|**No redirect logic in middleware.** All protected redirects are **page-level SSR guards** (`getUser()` → `redirect(...?next=…&session=lost)`)|**DEVIATION** (page-level, not middleware)|Document architecture exception + prove coverage|
|7|`returnTo` sanitization: reject external, protocol-relative, javascript:, data:, **malformed/path-traversal**, **admin-when-not-admin**|`sanitizeReturnTo` rejects empty, `//`, URL schemes, non-`/`. Does **NOT** reject path-traversal (`/../`) or admin-when-not-admin (delegated to admin layout role guard)|**PARTIAL / literal FAIL**|Add path-traversal/malformed rejection; decide admin-path handling (reject or document layout-guard as canonical)|
|8|Canonical redirect param|App uses **`next=`** everywhere (callbacks + all 5 protected redirects + `AuthRedirect`); kickoff said `returnTo`|**DEVIATION** (consistent `next`)|Document `next` as canonical, OR normalize to `returnTo`|
|9|No service-role key in browser bundle (post-build grep 0)|0 hits in `.next/static`; `import 'server-only'` guard on `admin.ts`|**PASS**|Re-run grep on a fresh build for the record|
|10|`tsc=0`|2 syntax errors (from 291's truncated files)|**FAIL**|Repair test files|
|11|No new lint errors|+2 new parse errors|**FAIL**|Repair test files|
|12|`npm run build` passes|Not run; blocked|**NOT PROVEN**|Run + paste|
|13|1 new locale key ×4|`session_recovery_message` ×4|**PASS**|—|
|14|QA A–G (refresh / admin / localStorage-only / full-deletion / logout / callback / favorites)|Code paths implemented & plausibly correct; **no runtime evidence**|**NOT PROVEN**|Manual QA or documented reasoning|
|15|7 breakpoints for login banner|Banner wired (`AuthSheet` `session_recovery_message`); no responsive evidence|**NOT PROVEN**|Walk or document|
|16|Inventory + Files Changed + self-validation in log|Present in 281 log (claims)|**PASS (doc)**|—|

**Production-code quality note:** the Task 281 *implementation* (SSR cookie clients, middleware session refresh, page-level guards with no admin data flash, `server-only` admin guard, localized session-lost banner) is **largely sound and safe**. The blockers are (a) the broken test files from 291 sharing this uncommitted batch, (b) the literal `sanitizeReturnTo` gap, and (c) unproven build/QA + undocumented deviations.

## 5. Task 291 — AC-by-AC
| # | AC (literal) | Repo evidence | Status |
|---|---|---|---|
|1|auth suites → 0 failures|Files truncated → cannot parse/run|**FAIL**|
|2|whole-suite: 7 fixed, 19 `revalidateTag` unchanged, 0 net-new|Not achieved; +2 parse errors introduced|**FAIL**|
|3|security tests still fail-if-violated|N/A — broken|**FAIL**|
|4|no production file changed|`controller.ts` diff = only the 281 SIGNED_OUT hunk; only `controller.test.ts` + `AuthContext.test.tsx` + `backlog.md` + session log changed|**PASS**|
|5|`tsc=0`|FAIL (2 errors)|**FAIL**|
|6|no new lint errors|FAIL (+2 parse errors)|**FAIL**|
|7|self-validation / Files Changed table|Log present, but its green claims contradict reality|**FAIL (false-positive log)**|

---

## 6. Explicit decisions
- **Task 281: REJECT AS INCOMPLETE.** Production code is close, but literal AC #7 (sanitizeReturnTo) is unmet, deviations (#1 helper location, #5/6 middleware redirects, #8 `next` param) are undocumented, and the tree fails `tsc`/`lint` and lacks build/QA proof. → corrective Task 293.
- **Task 291: REJECT AS INCOMPLETE.** Core deliverable (green auth suite) is corrupted (both files truncated). The only thing it got right is "no production change". → corrective Task 293 (Part A).

## 7. Security assessment
- **localStorage-only cleanup:** SAFE & correct in design — `SIGNED_OUT → syncFromServer()` re-derives truth from the server cookie session; spurious SIGNED_OUT (localStorage cleared, cookies valid) → stays authenticated. (Runtime unproven.)
- **Full cookie deletion:** SAFE — page-level `getUser()` returns null → `redirect(login?next=…&session=lost)` → localized banner. No silent persistence.
- **Explicit logout finality:** SAFE — `signOut()` runs `coreSignOut('global')`, guarded by `signing_out` status so events can't re-auth mid-flight.
- **Stale result cannot re-authenticate:** PRESERVED in production (`++version` + `inflight.abort()` inside `syncFromServer`); the *test* that proves it is currently truncated and must be restored.
- **Admin route protection:** SAFE — `admin/layout.tsx` does SSR `getUser()` + DB role check and `redirect()` BEFORE rendering children; non-admin (incl. via `next=/admin`) is bounced to `/${locale}`. No admin data flash.
- **Service-role bundle safety:** SAFE — `import 'server-only'` on `admin.ts`; `.next/static` grep = 0 hits.

## 8. Middleware assessment
- Refresh per request: **YES** (`refreshSession` → `getUser()` → cookie propagation).
- Auth callback routes excluded: **YES** (`/auth/*` excluded by matcher; locale-prefixed `/[locale]/auth/login` is NOT excluded so it still gets i18n/refresh — correct).
- Protected redirects: **page-level**, NOT in middleware.
- Matches kickoff literally: **NO** (kickoff wanted middleware-level protected redirects + `src/lib/supabase/middleware.ts`).
- Acceptable? **Yes, with documentation.** Page-level SSR guards are a valid App-Router pattern and here they redirect before render (no flash). Requires: (a) documented architecture exception, (b) proof every Task-281 protected route is guarded, (c) confirmation middleware still refreshes + excludes callback/static/public (it does). One open item to note: `admin/*` is matcher-excluded so admin routes are not middleware-refreshed (admin relies on layout SSR + non-admin app traffic refreshing cookies) — acceptable but should be documented.

## 9. Redirect / sanitization assessment
- Param in use: **`next`** (consistent across callbacks + all protected redirects + AuthRedirect). Canonical-by-usage, deviates from kickoff `returnTo`.
- Rejected today: external (scheme), protocol-relative (`//`), `javascript:`/`data:` (scheme), non-`/`. **PASS** for these.
- **NOT rejected:** path-traversal (`/../`, `/sq/../../x`), other malformed paths. **Literal FAIL.**
- Admin-when-not-admin: **not rejected in `sanitizeReturnTo`**; mitigated by admin layout role guard after redirect. Safe outcome, literal deviation.

## 10. Validation summary
tsc **FAIL(2)** · lint **FAIL(9; +2 new)** · build **NOT PROVEN** · auth vitest **un-runnable** · whole vitest **NOT PROVEN** · service-role grep **PASS(0)** · locale parity **PASS(4/4)**.

## 11. Final verdict
**Sprint 17 auth closure is NOT complete.** Do **not** commit the 281/291 batch as-is and do **not** trust the backlog "FULLY CLOSED" line. Corrective **Task 293** must (A) repair the two truncated test files to a green, contract-correct state, and (B) close the 281 literal gaps + document the accepted deviations + produce real validation proof. The `revalidateTag` test-env follow-up remains separate **Task 292** (kickoff already filed, untracked).

## 12. Corrective task
Created: `tasks/Sprints/Sprint_17_kickoff_prompt_Task_293.md` (Task 293).
Numbering: 292 is reserved for the already-filed `revalidateTag` test-env stub kickoff (untracked); this closure correction is **293**.
