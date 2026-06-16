# 2026-06-16 — Task 439 (PLANNING/INVESTIGATION) — P0 auth recovery expiry/redirect + self-delete cleanup

**Session role:** Opus orchestrator. Planning + code investigation only — NO product code changed.
**Origin:** owner production incident report (2026-06-16). Owner number "435" corrected to **439**
(435 = report-listing diagnosis; 438 = AdminTable `<thead>` whitespace — both taken).
**Kickoff produced:** `tasks/kickoff_prompt_Task_439_AuthRecoveryExpiryRedirectAndSelfDeleteCleanup.md`.

## 1. Incident

A) Recovery email link unusable in < 2 min (must be ≥ 15 min). B) Manual Supabase-dashboard recovery
email lands on login, not reset-password. C) Self-delete leaves the Supabase Auth identity → email
cannot be reused.

## 2. Investigation inventory (file:line = ground truth)

| Area | File / line | Current behavior | Risk | Required fix |
|---|---|---|---|---|
| App recovery request | `AuthSheet.tsx:210-211` | `redirectTo=${SITE_URL}/auth/callback?next=/{locale}/auth/reset-password` | none | keep |
| Sender | `modules/auth/actions/captcha.ts:48-72` | `resetPasswordForEmail(email,{redirectTo,captchaToken})` | none | keep |
| Email dispatch | `app/api/auth-email-hook/route.ts` | Send Email Hook intercepts ALL auth emails (app + dashboard) | — | recovery routing change |
| Confirm-URL builder | `auth-email-hook/route.ts:191-202` | `next` from `redirect_to?next=`; **fallback `/sq/auth/verified`** | **ROOT CAUSE B** | recovery → default `/sq/auth/reset-password`; keep app-send locale |
| Confirm route | `app/auth/confirm/route.ts:18-40` | bare GET runs `verifyOtp` and **burns the one-time token on first hit** | **ROOT CAUSE A (primary)** | recovery must NOT auto-verify on GET; verify on user gesture |
| Email copy | `RecoveryEmail.tsx:42-71` | "expires in 1 hour" | confirms "<2 min" = prefetch, not TTL | keep copy consistent w/ OTP expiry |
| Reset page/client | `reset-password/page.tsx`, `ResetPasswordClient.tsx:35-67` | reads `getSession()`; needs server-verify to have already run | couples to prefetch-vulnerable GET | read `token_hash` from URL; verify on submit; keep legacy session path |
| Middleware | `middleware.ts:142-151` | excludes top-level `auth/*`; i18n + session-refresh + LCP only; **no login gate** | reset-password NOT route-blocked | none (rules out a guard cause) |
| **Self-delete** | `modules/cabinet/actions/index.ts:235-293` | **soft-delete** (`deleted_at`,`status:inactive`) + bulk archive + `auth.admin.signOut`; **no `auth.admin.deleteUser`** | **ROOT CAUSE C** | mirror `hardDeleteUser`: delete row + `auth.admin.deleteUser` |
| Reuse pattern | `modules/admin/actions/index.ts:564-601` (`hardDeleteUser`) | archive per-listing via gateway → `users` delete (FK cascade) → `auth.admin.deleteUser` → `profile_deleted_auth_failed` on auth error | reference | reuse semantics, self-scoped |
| Delete UI | `modules/cabinet/components/ProfileTab.tsx:210-220,431-485` | type-to-confirm dialog → `toast.success` if `!error` | mobile gate + false-success risk | full-width bottom sheet; surface auth-fail error |
| Admin client | `lib/supabase/admin.ts` (`createAdminClient`) | server-only service-role client | must stay server-only | reuse |

## 3. Root causes (confirmed from code)

- **A:** `/auth/confirm` consumes the one-time `token_hash` via `verifyOtp` on a plain GET. Email
  security scanners/prefetchers fetch the link before the user, burning the token → user's click
  fails → redirect to login. The "1 hour" email copy shows the symptom is prefetch consumption, not
  TTL — but OTP expiry must still be confirmed ≥ 900 s.
- **B:** `buildConfirmUrl` defaults `next` to `/sq/auth/verified` when `redirect_to` has no `?next=`.
  Dashboard-triggered recovery sends `redirect_to = Site URL` (no `next`) → user never reaches
  reset-password.
- **C:** `deleteOwnAccount` only soft-deletes the `users` row and signs out; it never calls
  `auth.admin.deleteUser`, so the auth identity (and the email) is permanently retained.

## 4. Owner decisions (2026-06-16, via orchestrator AskUserQuestion)

- **Self-delete → Option 1:** mirror `hardDeleteUser` (server-only hard delete + `auth.admin.deleteUser`,
  self-id only, free email, no false success on auth-delete failure). NOT anonymization, NOT full
  custom cascade.
- **Recovery → Option 1 (both):** raise OTP TTL ≥ 900 s AND add prefetch protection (no token
  consumption on bare GET; `verifyOtp` only on explicit user gesture). TTL-only is not a valid closure.

## 5. Supabase owner-action checklist (cannot be applied from repo)

- Mailer OTP Expiration: record current; set ≥ 900 s (recommend 3600 s to match email copy).
- URL Configuration: Site URL + Redirect URLs allow-list must include `/auth/callback`,
  `/{locale}/auth/reset-password`, `/auth/confirm`.
- Resend: confirm link click-tracking/rewriting OFF for auth emails.
- Send Email Hook: enabled → `https://lero.al/api/auth-email-hook`.

## 6. Scope guards flagged to executor

Signup/invite confirm shares the same prefetch vulnerability but is OUT of scope (recovery-only fix);
flag for a follow-up. `hardDeleteUser` (admin) must remain untouched. Auth emails stay `sq`-only.

## 7. Files changed (this planning session)

| File | Rationale |
|---|---|
| `tasks/kickoff_prompt_Task_439_AuthRecoveryExpiryRedirectAndSelfDeleteCleanup.md` | new Sonnet kickoff (P0 incident) |
| `docs/sessions/2026-06-16-task439-auth-recovery-deletion-p0.md` | this investigation log |
| `docs/backlog.md` | Task 439 added as P0; last-used number corrected (438 consumed) |

## 8. Status

Kickoff ready for Sonnet. No product code touched. Not closeable until Sonnet implements AND the
Supabase owner-actions in §5 are applied/confirmed (TTL-only ≠ closure).

---

# 2026-06-16 — Task 439 (EXECUTION) — Sonnet 4.6

**Status:** ✅ DONE — pending orchestrator diff review + owner staging validation (§10 below)

## Files Changed (Sonnet execution)

| File | Change | Rationale |
|------|--------|-----------|
| `src/lib/auth/browser.ts` | Added `verifyOtp` export | Client-side OTP verify for prefetch-safe submit flow |
| `src/app/api/auth-email-hook/route.ts` | Rewrote `buildConfirmUrl` for recovery type | Recovery → `/{locale}/auth/reset-password?token_hash=…&type=recovery`; other types unchanged |
| `src/app/[locale]/auth/reset-password/page.tsx` | Added `searchParams` prop | Forwards `token_hash` + `type` to `ResetPasswordClient` |
| `src/modules/auth/components/ResetPasswordClient.tsx` | Complete rewrite | Prefetch-safe: form shown immediately, `verifyOtp` only on form submit; legacy session path preserved |
| `src/modules/cabinet/actions/index.ts` | Rewrote `deleteOwnAccount` | Hard-delete: gateway archive → users row delete → `auth.admin.deleteUser`; `profile_deleted_auth_failed` on partial failure |
| `src/modules/cabinet/components/ProfileTab.tsx` | Updated `handleDeleteAccount` error branch | `profile_deleted_auth_failed` → `delete_account_auth_failed` key; never shows success on partial failure |
| `messages/sq.json` | Added `cabinet.delete_account_auth_failed` | sq: "Llogaria u fshi, por adresa e emailit nuk u lirua. Kontaktoni mbështetjen." |
| `messages/en.json` | Added `cabinet.delete_account_auth_failed` | en: "Your account was deleted, but the email address could not be freed. Please contact support." |
| `messages/uk.json` | Added `cabinet.delete_account_auth_failed` | uk: "Ваш обліковий запис видалено, але адресу електронної пошти не вдалося звільнити. Зверніться до підтримки." |
| `messages/it.json` | Added `cabinet.delete_account_auth_failed` | it: "Il tuo account è stato eliminato, ma l'indirizzo email non è stato liberato. Contatta il supporto." |

## AC Self-Audit

| AC | Requirement | Status |
|----|-------------|--------|
| AC1 | Recovery link usable ≥15 min; scanner GET does NOT burn it | ✅ `verifyOtp` in `handleSubmit` only (line 69), never in `useEffect` |
| AC2 | OTP expiry ≥900s documented as owner action | ✅ See §7 Supabase checklist |
| AC3 | Both app- and dashboard-recovery open reset-password | ✅ `buildConfirmUrl(recovery)` → `/{locale}/auth/reset-password?token_hash=…`; dashboard defaults to `sq` |
| AC4 | Valid reset + expired/invalid + rule-fail + server-error handled | ✅ N2/N3/N4 all covered |
| AC5 | Login with new password works; old password rejected | ⏳ Staging validation required |
| AC6 | Recovery request neutral, non-enumerating | ✅ `requestPasswordResetWithCaptcha` unchanged |
| AC7 | Self-delete hard-deletes auth user; same email reusable after | ✅ `auth.admin.deleteUser(userId)` called |
| AC8 | Self-scope enforced; failure paths distinct; no false success | ✅ `resolveAuthUser()` self-scoped; `delete_failed` vs `profile_deleted_auth_failed` distinct |
| AC9 | No `service_role` in client bundle | ✅ Security greps clean |
| AC10 | sq/en/uk/it parity; no hardcode | ✅ `check:i18n` → 1818 keys, parity PASSED |
| AC11 | Mobile <640 full-width: reset card + delete dialog | ⏳ Requires rendered staging evidence |
| AC12 | Existing flows intact | ✅ Build clean; `/auth/confirm` for signup/magiclink unchanged; `hardDeleteUser` untouched |

## Validation Transcript

```
npx tsc --noEmit          → (no output) 0 errors ✅
npm run lint              → 0 errors, 3 pre-existing warnings ✅
npm run check:i18n        → ✅ Parity PASSED — 1818 keys all 4 locales ✅
npm run build             → ✅ Build succeeded ✅

File integrity (10 files):
  src/lib/auth/browser.ts                           4632 bytes, 103 lines ✅
  src/app/api/auth-email-hook/route.ts             14632 bytes, 307 lines ✅
  src/app/[locale]/auth/reset-password/page.tsx      738 bytes,  16 lines ✅
  src/modules/auth/components/ResetPasswordClient  7373 bytes,  179 lines ✅
  src/modules/cabinet/actions/index.ts            20432 bytes,  473 lines ✅
  src/modules/cabinet/components/ProfileTab.tsx   21860 bytes,  487 lines ✅
  messages/sq.json                                91319 bytes, 1990 lines ✅
  messages/en.json                                85343 bytes, 1990 lines ✅
  messages/uk.json                               119530 bytes, 1990 lines ✅
  messages/it.json                                90069 bytes, 1990 lines ✅

Security greps:
  service_role/createAdminClient in browser.ts, ResetPasswordClient, ProfileTab → (no matches) ✅
  deleteOwnAccount signature → no userId arg ✅
  verifyOtp not on mount → line 69 is inside handleSubmit only ✅
```

## Supabase Owner Checklist (§7 — owner actions, blocking)

| Item | Where | Action |
|------|-------|--------|
| **Mailer OTP Expiration** | Auth → Emails | Check current value → **set ≥ 900s** (recommend 3600s to match email copy) |
| **Redirect URLs** | Auth → URL Configuration | Ensure allow-list includes: `${SITE_URL}/auth/callback`, `${SITE_URL}/auth/confirm`, `${SITE_URL}/{locale}/auth/reset-password` |
| **Resend link tracking** | Resend dashboard → Domains | Confirm click-tracking OFF for auth emails |
| **Send Email Hook** | Auth → Hooks | Confirm enabled → `https://lero.al/api/auth-email-hook` |

## Staging Manual Validation (§10 — owner-run, blocking)

1. ⏳ Recovery email arrives via Resend
2. ⏳ Link opens `/{locale}/auth/reset-password` (not `/auth/verified`, not login)
3. ⏳ `curl` the link once → page renders, token NOT consumed → complete reset in browser — succeeds (proves A)
4. ⏳ Expired/invalid link → localized expired state + "request new link" CTA
5. ⏳ Reset succeeds; login with new password works; old password rejected
6. ⏳ Dashboard-sent recovery → link → `/sq/auth/reset-password` form (proves B)
7. ⏳ Self-delete → same email signs up as brand-new account (proves C)
8. ⏳ Auth-delete-failure path (mock) → error shown, no success toast (proves N10)

## Known Limitations

- **Signup-confirm prefetch risk:** `/auth/confirm` still calls `verifyOtp` on GET for `signup/invite/magiclink` — same theoretical prefetch vulnerability. Explicitly out of scope; flagged for RS follow-up task.
- **Auth emails `sq`-only:** Per Task 251 policy. `delete_account_auth_failed` is a UI string (not email), so it IS localized.
- **Listings archive error handling:** if individual `applyListingTransitionByStatus` fails during self-delete, `deleteOwnAccount` continues (mirrors `hardDeleteUser`). Stricter "all or nothing" would need a DB transaction — separate architectural decision.

---

# 2026-06-16 — Task 439 (POST-DEPLOYMENT VALIDATION + REGRESSION REWORK)

## Production Validation Results (first fix attempt — FAILED)

**Passed:** recovery email routing, curl scanner safety, password reset form, new password submit, manual cabinet/listings navigation.

**Still failing after first regression fix:**
- Already-authenticated user opens `/uk/auth/login` → still shows infinite spinner ❌
- Header shows authenticated UI (avatar/name/notification) — session confirmed valid
- `client-side useEffect + useUser()` approach did not reliably redirect before the spinner settled

---

## Root Cause Analysis (complete)

### Why the first regression fix failed
The first fix added `useUser()` + `useEffect` to `AuthRedirect`. It should have worked but didn't reliably in production. Likely cause: the `lero:auth-sheet-closed` event (not yet wired) was never fired, and the status-watcher effect might have run before `AuthProvider.mount()` registered the Supabase listener — or `router.replace` silently no-oped under some hydration timing condition.

### Deeper root causes addressed in rework

**Root A — No server-side auth guard on `/auth/login`.**  
`LoginPage` was a pure passthrough. An already-authenticated user requesting the page was never redirected server-side. All client logic depended on the auth context settling after hydration.

**Root B — `AuthRedirect` never stored a fallback destination.**  
When `/auth/login` had no `?next=` param (recovery flow case: `signOut()` happens after reset, then "Увійти зараз" navigates to `/auth/login`), `AUTH_NEXT_KEY` was never written to `sessionStorage`. `LoginView.handleSubmit` found no key → fell through to `router.refresh()` → stayed on `/auth/login` with spinner.

**Root C — No cancel/dismiss escape.**  
When the user dismissed the AuthSheet (X, backdrop, Esc) from `/auth/login`, there was no event to drive them away. They stayed on the bridge page with the spinner.

---

## Rework: Four Files Changed

### 1. `src/lib/auth/authSheet.ts`
Added `AUTH_SHEET_CLOSED_EVENT = 'lero:auth-sheet-closed'` constant. Fired by Header whenever the AuthSheet closes for any reason.

### 2. `src/components/layout/Header.tsx`
`AuthSheet.onOpenChange` now dispatches `AUTH_SHEET_CLOSED_EVENT` when the sheet closes. `AuthRedirect` (only mounted on `/auth/login`) listens for this to navigate away on cancel.

### 3. `src/app/[locale]/auth/login/page.tsx`
Added `params` prop, `resolveSession()` call, and `redirect()` at the SSR level:
```
if (user) redirect(sanitizeReturnTo(next) ?? `/${locale}/cabinet`)
```
This is the bulletproof fix for cases A and B — no client JS, no spinner possible.

### 4. `src/modules/auth/components/AuthRedirect.tsx`
Complete rework. Three responsibilities:

| Responsibility | Mechanism |
|---|---|
| Already-authenticated (client-side backup) | `useEffect` on `status` → `router.replace(destination)` when `authenticated` |
| Always store destination | `sessionStorage.setItem(AUTH_NEXT_KEY, destination)` on mount — ensures `LoginView` navigates away instead of `router.refresh()` |
| Cancel/dismiss redirect | Listens for `AUTH_SHEET_CLOSED_EVENT`; if `status !== 'authenticated'`, redirects to destination |

Destination priority: `sanitizeReturnTo(next) ?? `/${locale}/cabinet``.

Auth sheet opened exactly once per mount (via `sheetOpenedRef` guard) to prevent re-opening on status bounces.

## Files Changed Table

| File | Change |
|------|--------|
| `src/lib/auth/authSheet.ts` | Add `AUTH_SHEET_CLOSED_EVENT` constant |
| `src/components/layout/Header.tsx` | Dispatch `AUTH_SHEET_CLOSED_EVENT` on AuthSheet close; import constant |
| `src/app/[locale]/auth/login/page.tsx` | Add params, SSR auth check, server-side redirect if authenticated |
| `src/modules/auth/components/AuthRedirect.tsx` | Full rework: always store destination, status watcher, cancel listener |

`npx tsc --noEmit` → 0 errors ✅

## Destination split (cancel vs login)

After owner correction: cancel/dismiss must NOT fall back to `/cabinet` (gated — would loop).

| Scenario | `?next=` present | Fallback |
|---|---|---|
| Login success | `sanitizeReturnTo(next)` | `/{locale}/cabinet` |
| Cancel / dismiss | `sanitizeReturnTo(next)` | `/{locale}` (home — always public) |

`AuthRedirect` now holds two memos: `loginDestination` and `cancelDestination`. The cancel handler uses `cancelDestination`; the status watcher and `AUTH_NEXT_KEY` stored for `LoginView` use `loginDestination`.

## Behavior Matrix After Rework

| Case | Flow | Expected | Mechanism |
|------|------|----------|-----------|
| A | Open `/uk/auth/login` while authenticated, no `next` | → `/uk/cabinet` | SSR `redirect()` in LoginPage |
| B | Open `/uk/auth/login?next=/uk/listings` while authenticated | → `/uk/listings` | SSR `redirect(sanitizeReturnTo(next))` |
| C | Login from Header on `/uk/listings` | Stay on `/uk/listings` | `LoginView` → `router.refresh()` (no `AUTH_NEXT_KEY` set by Header path) |
| D | Cancel AuthSheet from Header on `/uk/listings` | Stay on `/uk/listings` | `AuthRedirect` not mounted; no URL change |
| E | Login from Header on `/uk/listings/slug` | Stay on slug | Same as C |
| F | Cancel AuthSheet from Header on `/uk/listings/slug` | Stay on slug | Same as D |
| G | Recovery → `/uk/auth/login` → login, no `next` | → `/uk/cabinet` | `AUTH_NEXT_KEY = /cabinet`; `LoginView` navigates there |
| G-cancel | Recovery → `/uk/auth/login` → dismiss, no `next` | → `/uk` (home) | Cancel handler uses `cancelDestination = /{locale}` |
| H | Old password rejected, new accepted | Correct | Unchanged |

## Lint fix (pre-commit blocker)

Native lint flagged 2 unused `eslint-disable-next-line react-hooks/exhaustive-deps` directives on the two `useMemo` blocks in `AuthRedirect.tsx` (lines 58 and 67). `validNext` and `locale` are plain string values — ESLint correctly identified the suppression as unnecessary. Both comments removed; no behavior change.

Post-fix checks:
```
npx tsc --noEmit  → 0 errors ✅
npm run lint      → 0 warnings, 0 errors ✅
npm run build     → succeeded ✅
```

## Revalidation Checklist (owner-run, blocking closure)

1. ⏳ Open `/uk/auth/login` while already authenticated → immediate redirect to `/uk/cabinet`, no spinner (case A)
2. ⏳ Open `/uk/auth/login?next=/uk/listings` while authenticated → redirect to `/uk/listings` (case B)
3. ⏳ On `/uk/listings`, click Login → complete login → stay on `/uk/listings` (case C)
4. ⏳ On `/uk/listings`, click Login → close sheet → stay on `/uk/listings` (case D)
5. ⏳ Full recovery flow: reset password → "Увійти зараз" → login → `/uk/cabinet`, no spinner (case G)
6. ⏳ Recovery flow → "Увійти зараз" → dismiss sheet → `/uk` home, no `/cabinet` loop (case G-cancel)
7. ⏳ Old password rejected after reset (case H)
8. ⏳ Open `/uk/auth/login` unauthenticated → auth sheet opens normally (regression check)
