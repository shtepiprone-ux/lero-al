# Task 439 — P0 PRODUCTION INCIDENT: password-recovery link expiry/redirect + self-delete auth cleanup

> **Type:** bugfix / production incident (auth lifecycle)
> **Priority:** 🔴 P0 / critical — runs BEFORE any lower-priority UI/admin backlog.
> **Executor:** Sonnet 4.6. **Orchestrator/reviewer:** Opus (this kickoff).
> **Number note:** the owner reported this as "435", but 435 (report-listing diagnosis) and 438
> (AdminTable `<thead>` whitespace) are already taken — this incident is **Task 439**.

> ## 🔴 OWNER GUARDRAILS (2026-06-16 — read before starting, enforced at review)
> 1. **Task 439 is P0 and MUST be completed before ANY Regression Shield slice** (436/441/442+). The
>    auth-prefetch and email-reuse regression cells stay `pending-439` until this lands.
> 2. **Do NOT close code-only.** Production/staging validation (§10) AND the Supabase owner checklist
>    (§7 — OTP expiry ≥ 900 s, Redirect URLs, Resend link-tracking OFF, Send Email Hook URL) are
>    **blocking** acceptance items. A green `tsc`/`build` does NOT close this task.
> 3. **Do NOT expand the mobile dialog into a broad Dialog-system refactor.** Make ONLY the in-scope
>    reset-password + delete surfaces compliant enough to pass the §9 gate. If full bottom-sheet
>    compliance would require touching the shared `Dialog`/`Sheet` primitive, **STOP and ASK** — do not
>    refactor the shared component under a P0 auth fix.
> 4. **No incidental "while I'm here" fixes.** Touch only the recovery + self-delete surfaces.

---

## 0. Incident summary (owner, 2026-06-16)

Three production auth-lifecycle breakages:

- **A — recovery link dies in < 2 minutes.** Must remain usable **≥ 15 minutes**.
- **B — manual Supabase-dashboard recovery email lands the user on the login page**, not the
  reset-password page.
- **C — self-delete does not remove the Supabase Auth identity**, so the same email can never be
  reused for a future signup.

Owner verdicts (decided 2026-06-16, do NOT re-litigate):
- **A → fix BOTH** Supabase OTP TTL (≥ 900 s) **AND** email-prefetch/scanner token consumption.
  TTL-only is NOT an acceptable closure.
- **C → mirror the existing, proven `hardDeleteUser` semantics** (hard-delete + `auth.admin.deleteUser`).
  No anonymization, no full custom cascade, no new product design.

---

## 1. Pre-read (rule-index: Email/auth lifecycle + DB/server-action)

**Always required:** `docs/agent-contract.md` (clauses 1–14), `docs/backlog.md`.
**Required (email/auth lifecycle):** `docs/env.md`, `docs/domain-rules.md`, `docs/qa-rules.md`, `docs/integrations.md`.
**Required (DB / server-action / RLS):** `docs/data-access-rules.md`, `docs/rls-rules.md`.
**Only if relevant:** `docs/app-lifecycle-contract.md`, `docs/component-rules.md`/`docs/ui-rules.md` (the reset-password page + delete dialog are UI surfaces — read for the mobile <640 gate).

Do not read docs outside this set.

---

## 2. Verified current implementation (Opus investigation — file:line is ground truth)

| Area | File / line | Current behavior | Defect |
|---|---|---|---|
| App recovery request | `src/modules/auth/components/AuthSheet.tsx:210-211` | `redirectTo = ${SITE_URL}/auth/callback?next=/${locale}/auth/reset-password` → `requestPasswordResetWithCaptcha` | OK (carries `next`). |
| Recovery sender | `src/modules/auth/actions/captcha.ts:48-72` | `resetPasswordForEmail(email, { redirectTo, captchaToken })` | OK. |
| Email dispatch | `src/app/api/auth-email-hook/route.ts` (Send Email Hook, Task 122) | Intercepts ALL auth emails (app- AND dashboard-triggered); builds link via `buildConfirmUrl` | see below. |
| Confirm-URL builder | `src/app/api/auth-email-hook/route.ts:191-202` | `next` is parsed from `redirect_to`'s `?next=`; **falls back to `/sq/auth/verified`** when absent | **ROOT CAUSE B.** Dashboard recovery's `redirect_to` = Site URL (no `next`) → user is sent to `/sq/auth/verified`, never to reset-password. |
| Confirm route | `src/app/auth/confirm/route.ts:18-40` | Bare **GET** calls `verifyOtp({token_hash, type})` and **consumes the one-time token on first hit**, then redirects to `next` | **ROOT CAUSE A (primary).** Email scanners / prefetchers (Outlook SafeLinks, AV, mail proxies) GET the link before the user → token burned → user's later click → `verifyOtp` fails → redirect to `/{locale}/auth/login?error=auth_callback_failed`. |
| Recovery email copy | `src/modules/notifications/lib/emails/RecoveryEmail.tsx:42-71` | Body says "expires in 1 hour" / "дійсне протягом 1 години" | Confirms the TTL is ~1 h, i.e. the "< 2 min" symptom is **prefetch consumption**, not pure TTL — BUT OTP expiry must still be verified ≥ 900 s in the dashboard. |
| Reset-password page | `src/app/[locale]/auth/reset-password/page.tsx` + `src/modules/auth/components/ResetPasswordClient.tsx` | Client reads `getSession()`; if a session already exists (verifyOtp ran at `/auth/confirm`) shows the new-password form; else `expired`. Calls `updatePassword` → `signOut` | Depends on the prefetch-vulnerable server verify; must move the verify to a **user gesture** (Root Cause A fix). |
| Middleware | `src/middleware.ts:142-151` | matcher excludes top-level `auth/*`; `/{locale}/auth/reset-password` is matched but middleware only does i18n + session-refresh + LCP preload — **no login gate** | Reset-password is NOT middleware-blocked. The "lands on login" symptom is the `next` default (B) + the burned token (A), not a route guard. |
| **Self-delete** | `src/modules/cabinet/actions/index.ts:235-293` (`deleteOwnAccount`) | **Soft-delete only:** sets `users.deleted_at` + `status:'inactive'`, archives listings (bulk), writes status history, `auth.admin.signOut(userId)`. **Never calls `auth.admin.deleteUser`.** | **ROOT CAUSE C.** Auth identity persists → email permanently unusable. |
| Reference pattern (reuse) | `src/modules/admin/actions/index.ts:564-601` (`hardDeleteUser`) | Archives non-terminal listings via `applyListingTransitionByStatus` per-listing → `db.from('users').delete()` (FK cascade) → `db.auth.admin.deleteUser(userId)` → returns `profile_deleted_auth_failed` if auth delete errors | **This is the semantics to mirror for self-delete.** |
| Delete UI | `src/modules/cabinet/components/ProfileTab.tsx:210-220, 431-485` | Confirm dialog (type-to-confirm) → `handleDeleteAccount` → `deleteOwnAccount` → `toast.success` if `!result.error` | Keep the confirm safeguard; verify mobile <640 full-width; ensure auth-delete failure surfaces an error (no false success). |
| Service-role client | `src/lib/supabase/admin.ts` (`createAdminClient`) | Server-only admin client (already used by both delete paths) | Reuse; never import into a client bundle. |

---

## 3. Role / scope contract (P0 — agent-contract.md clauses 1–14)

- **Server-only secrets.** `service_role` / `createAdminClient` stay server-side. Never in a
  `NEXT_PUBLIC_*` var, never imported into a client component or client bundle (clause: security).
- **Self-scope only.** `deleteOwnAccount` resolves the authenticated user and deletes ONLY that
  `user.id`. It MUST NOT accept a `userId` argument or delete any other account. Do not add a public
  endpoint that can delete arbitrary users.
- **No new architecture.** Reuse `hardDeleteUser`'s cleanup/cascade pattern; reuse the existing
  Send Email Hook + `verifyOtp` token-hash flow. If a needed mechanism is genuinely ambiguous,
  **STOP and ASK** — do not invent.
- **No scope creep.** Touch only the recovery + self-delete surfaces. Signup-confirm has the same
  theoretical prefetch risk but is **out of scope** (flag it in the log for a follow-up; do not fix).
- **No secret/token logging.** Never log `token_hash`, access/refresh tokens, passwords, or
  `service_role`. The existing hashed-correlation logging in `recovery.ts` is the only pattern.

---

## 4. Required behavior

### 4A. Recovery link lifetime + prefetch safety (Root Cause A)

Required invariant: **a plain GET by an email scanner must NOT consume the one-time recovery token.**
`verifyOtp({type:'recovery'})` runs ONLY after an explicit user gesture.

Required mechanism (owner-decided "both"):
1. **OTP TTL** — verify Supabase **Mailer OTP Expiration ≥ 900 s** (owner dashboard action, §7); keep
   the RecoveryEmail copy consistent with the configured value (currently says "1 hour").
2. **Prefetch-safe verify** — recovery links must land on a **user-intent page** that does NOT verify
   on load. The user clicks/submits, and only then does the app call `verifyOtp({token_hash, type:'recovery'})`.
   Recommended (least new surface): **route recovery links straight to `/{locale}/auth/reset-password?token_hash=…&type=recovery`** and have `ResetPasswordClient`:
   - read `token_hash` + `type` from the URL (do NOT verify on mount);
   - render the new-password form immediately (with the existing password-rules hint);
   - on submit: `verifyOtp({token_hash, type:'recovery'})` → on success the recovery session is
     established → `updateUser({ password })` → success state → `signOut`;
   - if `verifyOtp` errors (already used / expired / invalid) → `expired` state with the
     existing "request a new link" CTA;
   - **legacy compatibility:** if no `token_hash` is in the URL but a session already exists
     (the old `/auth/confirm` server-verified path), the current behavior MUST still work.
   A dedicated interstitial page is acceptable instead, **but only if** you STOP and ASK first — the
   reset-password-folded approach is preferred.
3. **Hook routing change** — `buildConfirmUrl` for `email_action_type === 'recovery'` must point to the
   prefetch-safe page above (carrying `token_hash` + `type=recovery` + locale), NOT to `/auth/confirm`.
   `/auth/confirm` keeps serving `signup/invite/magiclink` unchanged.

### 4B. Both app- and dashboard-triggered recovery land on reset-password (Root Cause B)

- For `recovery`, the hook must default the locale/landing to **`/sq/auth/reset-password`** when
  `redirect_to` carries no usable `next` (the dashboard-send case). When `redirect_to` DOES carry
  `?next=/{locale}/auth/reset-password` (the app-send case), preserve that locale.
- Net: **both** app-generated and Supabase-dashboard-generated recovery emails open the
  reset-password form, never `/auth/verified` and never login.

### 4C. Self-delete frees the email (Root Cause C)

Rewrite `deleteOwnAccount` to mirror `hardDeleteUser` semantics, self-scoped:
1. Resolve the authenticated user (`resolveAuthUser`); `Unauthorized` if none. Self-id only.
2. Archive non-terminal listings using the **same approach as `hardDeleteUser`**
   (`applyListingTransitionByStatus` per-listing through the gateway — not the current bulk update
   that bypasses it).
3. `db.from('users').delete().eq('id', userId)` (FK cascade). On error → return `delete_failed`,
   do NOT proceed to auth deletion.
4. `db.auth.admin.deleteUser(userId)`. On error → return a distinct code (e.g.
   `profile_deleted_auth_failed`) so the UI does NOT show success (email not yet freed).
5. On full success the client signs out and the email is immediately reusable for a new signup.
6. `shouldSoftDelete` must NOT be the final state — the email must be free after this action.

---

## 5. Positive flow (happy path) — implement AND verify each

**P1 — App recovery, end-to-end.** User opens AuthSheet → "Forgot password" → enters email →
captcha → `requestPasswordResetWithCaptcha` → neutral success message (no account-existence leak,
preserve current behavior) → RecoveryEmail arrives → user clicks → lands on
`/{locale}/auth/reset-password` showing the new-password form (NO verify yet) → user enters a
rules-compliant password → submit → `verifyOtp(recovery)` ok → `updateUser` ok → success state →
auto `signOut` → "Go to login" → logs in with the NEW password. Post-conditions: password changed;
`logPasswordRecoveryCompletion` fired; password-changed email sent (existing behavior).

**P2 — Dashboard recovery.** Admin sends recovery from Supabase dashboard → user clicks → lands on
`/sq/auth/reset-password` form (NOT `/auth/verified`, NOT login) → completes reset as P1.

**P3 — Link still valid after ≥ 15 min.** With OTP expiry ≥ 900 s and prefetch-safe verify, a link
clicked 15 min after issuance still reaches the form and completes (scanner GET in between does NOT
burn it). Post-condition: reset succeeds.

**P4 — Self-delete.** Cabinet → Profile → "Delete account" → confirm dialog (type-to-confirm) →
`deleteOwnAccount` → listings archived, `users` row deleted, `auth.admin.deleteUser` ok →
`toast.success(delete_account_success)` → signed out → redirected. Post-condition: same email
signs up successfully as a brand-new account.

## 6. Negative flow (every branch — each needs a verifiable handler/guard + locale key)

- **N1 — scanner prefetch GET** on the recovery link → page renders, token NOT consumed, no
  `verifyOtp` call (the whole point of A). Verifiable: no verify on mount.
- **N2 — expired/used/invalid token** at submit → `expired` state, localized message +
  "request new link" CTA; no password change. (`reset_password_expired_*` keys exist.)
- **N3 — password fails rules** → submit disabled / inline hint; no `verifyOtp`, no `updateUser`.
- **N4 — `updateUser` server error** (after a valid verify) → `reset_password_error_generic`,
  form stays usable; no false success.
- **N5 — double-submit** on reset → guard (`submitting`) prevents a second `verifyOtp` on the
  one-time token.
- **N6 — recovery request for unknown email** → still neutral success (no enumeration; preserve).
- **N7 — self-delete unauthorized** (no session) → `Unauthorized`, nothing deleted.
- **N8 — listings archive fails** during self-delete → mirror `hardDeleteUser` behavior; do not
  leave a half-deleted account silently — log + surface per the admin pattern.
- **N9 — `users` row delete fails** → return `delete_failed`, do NOT call `auth.admin.deleteUser`,
  UI shows error (no success toast).
- **N10 — `auth.admin.deleteUser` fails** → return `profile_deleted_auth_failed`; UI shows an
  actionable localized error (email not yet freed); NEVER a success toast.
- **N11 — self-delete double-submit** → dialog confirm guarded against re-entry.
- **N12 — locale mismatch** on the reset page → strings resolve in the active locale; dashboard
  default `sq` renders correctly.

---

## 7. Supabase dashboard / config — OWNER ACTIONS (Sonnet documents exact values; cannot self-apply)

Sonnet has no production dashboard access — produce an explicit owner checklist with current→required:

- **Authentication → Emails / Providers → Mailer OTP Expiration:** record current value; **set ≥ 900 s**
  (recommend 3600 s to match the "1 hour" email copy). If raised above the email copy, update copy.
- **Authentication → URL Configuration → Site URL + Redirect URLs:** record current values; ensure the
  redirect allow-list contains the reset-password / callback paths the app uses
  (`${SITE_URL}/auth/callback`, `${SITE_URL}/{locale}/auth/reset-password`, `${SITE_URL}/auth/confirm`).
- **Email provider (Resend) link tracking:** confirm click-tracking/link-rewriting is OFF for auth
  emails (rewritten links can pre-consume or break the token).
- **Send Email Hook:** confirm it is enabled and pointing at `https://lero.al/api/auth-email-hook`
  (so dashboard-triggered recovery also flows through the branded/prefetch-safe path).

The task is NOT closeable on code alone if these production values remain inconsistent — record them
in the session log and flag the owner-run items.

---

## 8. Localization (clause 7) — sq · en · uk · it parity

All new/changed user-facing strings need full 4-locale parity. Likely keys (reuse existing where
present): reset-password title/new-label/submit/verifying, `reset_password_expired_*`,
`reset_password_request_new`, `reset_password_success_*`, `reset_password_error_generic`,
`delete_account_success`, and a NEW delete auth-failure key (e.g. `delete_account_auth_failed`).
No hardcoded UI strings. Auth EMAILS remain `sq`-only (Task 251 policy) — do not localize the email.

## 9. Mobile <640 full-width gate (clause 11 — OWNER P0)

In scope UI: the **reset-password card** and the **delete-account confirm dialog** (`ProfileTab.tsx`).
- Reset-password: inputs + the submit `Button` full-width at `max-sm` (no clip/overflow at 320; labels
  wrap across sq/en/uk/it).
- Delete dialog: must be **usable and not broken** at <640 (no horizontal overflow at 320/375/390, ≥44px
  targets, labels wrap, closes on backdrop + Esc). **Scope guard (owner P0):** if the shared `Dialog`/
  `Sheet` primitive ALREADY renders as the canonical full-width bottom sheet at <640, the delete dialog
  inherits it — do nothing extra. If it does NOT, do the **minimum** to make THIS dialog pass the gate;
  **do NOT refactor the shared Dialog/Sheet system** for this P0 — if full bottom-sheet compliance would
  require changing the shared primitive, **STOP and ASK** (open a separate DS task). The P0 bar is
  "reset-password usable + delete dialog not broken on mobile", not a Dialog-system rework.

---

## 10. Required validation (before "complete")

**Static:** `npx tsc --noEmit` (0), `npm run lint` (0 new), `npm run check:i18n`, `npm run build`,
file-integrity per clause 14 (0 NUL / parse-OK / not truncated — paste the green transcript), plus any
existing auth/cabinet tests (`src/lib/auth/__tests__`, `src/modules/auth/__tests__`).

**Security greps (paste output):** no `service_role` / `createAdminClient` in any client file; no
`NEXT_PUBLIC_*` service-role; no token/password logging added; `deleteOwnAccount` takes no `userId` arg.

**Manual / staging (disposable, NON-production account):**
1. recovery email arrives; 2. link opens reset-password (not login/verified); 3. simulate a scanner GET
on the link (e.g. `curl` the URL once) THEN complete reset in the browser — must still succeed (proves
A); 4. expired/invalid link → localized error; 5. reset succeeds; 6. login with new password works;
7. old password fails; 8. dashboard-sent recovery lands on reset-password; 9. self-delete succeeds;
10. **same email signs up again** after deletion; 11. auth-delete-failure path shows error, not success.

**Rendered matrix (clause 12)** for the two in-scope UI surfaces: breakpoints × sq/en/uk/it,
**uk@320/375/390 mandatory**, with real per-cell evidence (full-width <640, label wrap, no h-scroll).

---

## 11. Acceptance criteria (each maps to a flow above + a diff line)

- AC1 (A/P3/N1) recovery link usable ≥ 15 min; scanner GET does not burn it; verify only on user gesture.
- AC2 (A) OTP expiry ≥ 900 s documented as owner action with current→required values.
- AC3 (B/P1/P2) both app- and dashboard-recovery open reset-password, never login/verified.
- AC4 (P1/N2/N3/N4) valid reset updates password; expired/invalid + rule-fail + server-error handled.
- AC5 (P1) login with new password works; old password rejected.
- AC6 (N6) recovery request preserves neutral, non-enumerating response.
- AC7 (C/P4) self-delete hard-deletes auth user via server-only admin path; same email reusable after.
- AC8 (N7/N9/N10) self-scope enforced; failure paths return distinct errors; **no false success** when
  `auth.admin.deleteUser` fails.
- AC9 no `service_role` in client bundle / `NEXT_PUBLIC`.
- AC10 sq/en/uk/it parity for all new/changed strings; no hardcode.
- AC11 mobile <640 full-width: reset card + delete dialog (bottom sheet) — rendered matrix present.
- AC12 existing flows intact: login, signup, logout, magiclink, email-change, app-recovery, admin
  user management (`hardDeleteUser` untouched), protected routes, locale routing.

---

## 12. Deliverables on return (Sonnet)

1. The diff implementing 4A/4B/4C + UI gate. 2. `docs/sessions/2026-06-16-task439-*.md` with: Files
Changed table (one row/path + rationale), AC-by-AC self-audit, positive+negative flow trace, security
greps, validation transcript, rendered matrix, the §7 Supabase owner checklist, known limitations
(signup-confirm prefetch risk flagged). 3. Update `docs/backlog.md` Task 439 line. **Do NOT emit
`git add`/`git commit`** — the orchestrator emits commits at review.
