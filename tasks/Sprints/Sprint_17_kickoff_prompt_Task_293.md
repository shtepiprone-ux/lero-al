# Sprint 17 — Task 293 kickoff (CORRECTIVE — close Task 281 auth-session gaps + repair the truncated Task 291 test files)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit`. Sonnet NEVER runs git. The orchestrator (Opus) reviews the real diff and emits explicit-path commit commands; the owner runs them in PowerShell.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read per `docs/rule-index.md` — **"Email / auth lifecycle" + "DB / server action / RLS" + `docs/qa-rules.md` + `docs/state-authority.md`**. No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

> **Security-critical.** Read clause 17 (security forbidden list) BEFORE writing code. You may NOT weaken auth, RLS, admin checks, service-role isolation, or the security guarantees encoded in the auth tests. When in doubt, STOP & ASK.

> **BEFORE YOU WRITE ANY FILE — ANTI-TRUNCATION RULE (this task exists because of it):**
> Task 291 shipped **both** auth test files truncated mid-test (`controller.test.ts`
> ended at line 694 inside a comment; `AuthContext.test.tsx` ended at line 352 inside
> an expression), leaving the suite un-parseable and `tsc`/`lint` red. After EACH file
> you write, you MUST verify it is complete and balanced: last line is the final
> closing `})`, brace/paren counts balance, and `npx tsc --noEmit` reports 0 errors
> for that file. A file that does not parse is an automatic task failure.

---

## Why this task exists (orchestrator review, Opus 4.8, 2026-05-29)

Closure review `docs/sessions/2026-05-29-task-281-291-auth-session-closure-review.md`
found Task 281 + Task 291 are **uncommitted** and **NOT complete**:

- **Task 291 corrupted both auth test files** (truncated writes). `tsc` FAILS (2× TS1005);
  `lint` FAILS (9 errors = 7 pre-existing + 2 new parse errors). The auth suites cannot run.
- **Task 281 literal-AC gaps:** `sanitizeReturnTo` does not reject path-traversal/malformed
  paths and does not reject admin-when-not-admin; the canonical redirect param is `next`
  (kickoff said `returnTo`) — undocumented; middleware does protected redirects **page-level**,
  not in middleware, and the helper lives at `src/lib/auth/middleware.ts` (kickoff named
  `src/lib/supabase/middleware.ts`) — undocumented deviations; `build`/`lint`/QA not proven.

The Task 281 **production code is otherwise sound and safe** (SSR cookie clients via
`@supabase/ssr`; middleware refreshes session per request and excludes `api|auth|admin|static`;
page-level `getUser()` guards that `redirect()` before render with no admin data flash;
`import 'server-only'` on `admin.ts`; `.next/static` service-role grep = 0; `session_recovery_message`
present ×4). So this task is **finish + harden + prove + document**, NOT a rewrite.

```
Hard contract: see top.

Type:        bugfix + security verification + governance cleanup
Priority:    high (blocks Sprint 17 auth commit; tsc/lint red)
Area:        auth / middleware / protected redirects / returnTo sanitization / auth tests / validation evidence

GOAL: Bring the uncommitted Task 281 + 291 batch to a literally-closable state:
(A) repair the two truncated auth test files to GREEN, contract-correct;
(B) close the Task 281 literal AC gaps and explicitly document each accepted
    architecture deviation;
(C) produce REAL validation proof (tsc, lint, build, vitest, service-role grep).
No new auth product behavior; no regression of the Task 281 fix.
```

---

## Required behavior to PRESERVE (do not regress)
- localStorage/sessionStorage/cache-only clearing must NOT log out a user with valid cookies.
- Full Site-Data + cookie deletion → clean re-auth UX with the localized `session_recovery_message` banner.
- Explicit logout remains final (`signOut('global')`, `signing_out` guard).
- Admin data must never flash before the SSR role check (`admin/layout.tsx` guard order).
- Auth callback/confirm routes (`/auth/callback`, `/auth/confirm`) must NOT be redirected away (matcher already excludes `/auth/*`).
- login / register / password-reset / email-verification / email-change flows keep working.
- The new `SIGNED_OUT → syncFromServer()` controller contract (Task 281) stays; the "stale result cannot re-authenticate" version-guard stays.
- No RLS weakening; no service-role in browser; no backup refresh tokens in browser storage; no fingerprinting/device tracking; no Supabase dashboard changes; no email-template changes.

## Mandatory current-state inventory (PASTE in session log before changes)
```
git --no-optional-locks status --short
wc -l src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx
git --no-optional-locks show HEAD:src/lib/auth/__tests__/controller.test.ts | sed -n '688,714p'
git --no-optional-locks show HEAD:src/modules/auth/__tests__/AuthContext.test.tsx | sed -n '344,353p'
sed -n '154,189p' src/lib/auth/controller.ts        # the SIGNED_OUT contract (read-only)
cat src/modules/auth/lib/sanitizeReturnTo.ts
grep -rIn "returnTo\|next=\|sanitizeReturnTo\|session=lost" src/app src/modules/auth --include="*.ts" --include="*.tsx" | grep -v ".test."
cat src/middleware.ts ; cat src/lib/auth/middleware.ts
grep -rIn "SUPABASE_SERVICE_ROLE\|createAdminClient" src --include="*.ts" --include="*.tsx"
```

---

## PART A — Repair the truncated Task 291 test files (HIGHEST PRIORITY)

Context: the working-tree files are cut off; HEAD (committed) versions are complete
and valid. The lost tails (from the review) are:

`controller.test.ts` (currently 693 lines; ends mid-comment `// Drive to terminal u`):
- Finish the test `unauthenticated state always has user === null` under the NEW async
  contract: mock `/api/auth/me` → `okResponse(null)`, fire `SIGNED_OUT`, then `await
  vi.waitFor(...)` until the controller settles, and assert the **terminal** state is
  `unauthenticated` with `user === null` (do NOT assert it synchronously — SIGNED_OUT
  now goes through `refreshing` first).
- Restore the remaining two tests that were lost (adapt to the new contract; keep the
  invariant style — they use `if (status === …)` guards so they remain safe):
  `valid state invariant — no authenticated state without a user` and
  `valid state invariant — no unauthenticated state with a user`.
- Close the `describe(...)` and any open blocks. Final line must be `})`.

`AuthContext.test.tsx` (currently 351 lines; ends mid-expression `expect(mockUnsubscribe`):
- Finish `Supabase subscription is unsubscribed on unmount`:
  `expect(mockUnsubscribe).not.toHaveBeenCalled(); unmount(); expect(mockUnsubscribe).toHaveBeenCalledTimes(1)`.
- Close the `describe(...)`. Final line must be `})`.

Also re-verify the 6 + 1 reconciled tests from the Task 291 kickoff are present and
correct (Task 291's intent is unchanged — see `tasks/Sprints/Sprint_17_kickoff_prompt_Task_291.md`
for the per-test contract). In particular the security test
`SIGNED_OUT aborts any in-flight sync so the stale result cannot re-authenticate`
must still PROVE the version-guard (stale fetch with a user must NOT produce
`authenticated`).

Part-A acceptance:
- Both files parse: `npx tsc --noEmit` → 0 errors.
- `npx vitest run src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx` → **0 failures**.
- No test skipped/deleted/weakened; security tests still fail if their guarantee is violated.
- No production file touched in Part A (`controller.ts` etc. unchanged).

## PART B — Close Task 281 literal AC gaps + document deviations

B1. **`sanitizeReturnTo` hardening** (`src/modules/auth/lib/sanitizeReturnTo.ts`):
   - In addition to the current rejects (empty, `//`, URL scheme, non-`/`), REJECT:
     - path-traversal: any segment equal to `..` (raw `/..`, `/../`, trailing `/..`,
       and percent-encoded `%2e%2e` / `..%2f` — decode-then-check or pattern-match both forms);
     - malformed: control chars, backslashes `\`, whitespace-only, or strings that do not
       resolve to a clean absolute same-origin path.
   - Keep returning `null` on rejection (callers already fall back to a safe default).
   - Decide admin-path handling — pick ONE and document it in the session log:
     - **(Recommended) Document the layered guard as canonical:** `sanitizeReturnTo` stays
       path-safety only; admin authorization is enforced by `admin/layout.tsx` SSR role
       check (already redirects non-admin to `/${locale}` before render). Add a clear
       comment + a one-line note in `docs/state-authority.md` (or `docs/architecture.md`)
       that admin authorization is a destination-guard, not a returnTo-time check.
     - OR implement returnTo-time rejection of admin paths for non-admins (only if you can
       do it without client-side trust and without duplicating role logic — STOP & ASK
       before adding any role lookup into the sanitizer).

B2. **Canonical redirect param decision** — the app uses `next` consistently (callbacks +
   all 5 protected redirects + `AuthRedirect`). Keep `next` as canonical and DOCUMENT it
   (session log + a one-line note in `docs/architecture.md` or `docs/state-authority.md`:
   "canonical post-login redirect param = `next`; `returnTo` is not used"). Do NOT do a
   churny rename to `returnTo`. Ensure every consumer + the sanitizer + tests use `next`.

B3. **Middleware / protected-redirect architecture exception** — document that protected
   redirects are **page-level SSR guards** (each protected page calls `getUser()` and
   `redirect(.../auth/login?next=…&session=lost)` before render), NOT middleware redirects,
   and that middleware's role is session refresh only. Prove coverage: list every Task-281
   protected route and show its SSR guard (`cabinet`, `favorites`, `listings/create`,
   `listings/[slug]/edit`, `admin/layout`). Note that `admin/*` is matcher-excluded from
   middleware refresh (admin relies on the layout SSR guard + cookie refresh from other
   traffic) — state whether this is acceptable; STOP & ASK if you think admin needs its
   own refresh. Add the exception to `docs/state-authority.md` (SSR vs client authority)
   pending orchestrator approval — flag it for review, do not silently rewrite docs policy.

B4. **Middleware helper location** — the session-refresh helper is `src/lib/auth/middleware.ts`
   (kickoff named `src/lib/supabase/middleware.ts`, which is empty). Either (recommended)
   document `src/lib/auth/middleware.ts` as the accepted canonical location, or relocate +
   update the import in `src/middleware.ts`. Do NOT create a second copy. If documenting,
   delete/confirm-absent the empty `src/lib/supabase/middleware.ts` placeholder if one exists.

B5. **Service-role bundle proof** — run a fresh build and grep:
   `npm run build` then `grep -r "SUPABASE_SERVICE_ROLE" .next/static -l` → expect 0 hits.
   Paste both outputs. Confirm `import 'server-only'` remains on `src/lib/supabase/admin.ts`.

## PART C — Validation proof (paste REAL outputs, not "expected")
- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → 7 known pre-existing errors only (3× `PasswordInput.stories`, 2× `contacts/actions` direct-status-write, 2× `tel:` `window.location.href`); **0 new**.
- `npm run build` → passes (paste tail).
- `npx vitest run src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx` → 0 failures.
- `npx vitest run` (whole suite) → no NEW failures vs the documented baseline. Baseline note: the **19** `applyListingTransition.test.ts` `revalidateTag` failures are a known test-env issue owned by **Task 292** — they may remain; report the exact count + file. If Task 292 has already landed, expect 0.
- `grep -r "SUPABASE_SERVICE_ROLE" .next/static -l` → 0 hits.

---

## Scope (files Sonnet may touch)
- `src/lib/auth/__tests__/controller.test.ts` — repair (Part A).
- `src/modules/auth/__tests__/AuthContext.test.tsx` — repair (Part A).
- `src/modules/auth/lib/sanitizeReturnTo.ts` — hardening (B1).
- `src/middleware.ts` — ONLY if B4 chooses relocation (import update). Otherwise untouched.
- `docs/state-authority.md` and/or `docs/architecture.md` — add the documented exceptions (B2/B3/B4). Keep additions minimal and flag for orchestrator approval.
- `docs/backlog.md` — closure update (correct the false "291 ✅ / FULLY CLOSED" line; reflect 293).
- `docs/sessions/2026-05-29-task-293-auth-closure-correction.md` — NEW session log per Task 264.
- (If B1 adds sanitizer behavior, you MAY add/extend a `sanitizeReturnTo` unit test — NEW `src/modules/auth/lib/__tests__/sanitizeReturnTo.test.ts` — covering external, `//`, `javascript:`, `data:`, `/..`, `%2e%2e`, backslash, valid path. Recommended.)

## Out of scope (do NOT touch)
- `src/lib/auth/controller.ts` and all other production auth runtime (the Task 281 behavior stays; STOP & ASK if you believe a change is needed).
- Supabase dashboard, RLS policies, email templates, Send Email Hook, Resend.
- CAPTCHA (274), phone combobox (280), admin navigation redesign, listing/favorites/WhatsApp features.
- **Task 292** `revalidateTag` test-env stub (separate kickoff already filed).
- New remember-me / backup refresh tokens; fingerprinting / device tracking.

## Acceptance criteria (literal)
- Both auth test files parse and the auth suites are GREEN (0 failures); no test skipped/deleted/weakened; the "stale result cannot re-authenticate" guarantee is still proven.
- `sanitizeReturnTo` rejects: empty, `//`, `javascript:`/`data:`/other schemes, non-`/`, **path-traversal (`/..`, `/../`, `%2e%2e`, `..%2f`)**, backslashes, control/whitespace-only. Returns `null` on reject.
- Admin-path-after-login handling is EITHER returnTo-time rejection OR explicitly documented as the canonical layout-guard (with the layout guard verified to redirect non-admins before render).
- Canonical redirect param (`next`) documented; all consumers + tests consistent.
- Middleware behavior proven: refresh per request; `/auth/*` callback routes excluded; protected redirects documented as page-level with full coverage list.
- Helper location (`src/lib/auth/middleware.ts`) documented or relocated; no duplicate helper.
- `npx tsc --noEmit` → 0. `npm run lint` → 0 new (7 known). `npm run build` → passes. Auth vitest → 0 failures. Whole vitest → no new failures (19 `revalidateTag`/Task-292 documented). `.next/static` service-role grep → 0 hits.
- Preserved behaviors (localStorage-only stays logged in; full-deletion clean re-auth + banner; logout final; no admin flash; callback routes intact; login/register/reset/verify/email-change work) — verified by code-path reasoning + the green tests; document each.
- Session log includes: current-state inventory, Files Changed table, AC self-audit table, Note 18 self-validation verdict line, and per-deviation documentation (B2/B3/B4) + the admin-path decision (B1).
- `docs/backlog.md` corrected (no false "FULLY CLOSED" until this lands).
- NO `git add` / `git commit` emitted by Sonnet.

## Self-validation verdict line (required, literal real values):
`Self-validation: tsc=0 · lint=0-new(7 known) · build=passes · auth-vitest=green · whole-vitest new=0 (19 revalidateTag=Task292) · service-role grep=0 · scope=clean · PASS`

Do NOT emit git commands. Do NOT run git. Do NOT change `controller.ts` or other
production auth runtime (STOP & ASK). Do NOT weaken any test or security guarantee.
Do NOT touch out-of-scope files. Do NOT ship a truncated file — verify completeness
after every write.
