# Critical Flow Registry — single source of truth for regression coverage

> **Part of Epic RS — Regression Shield.** This registry enumerates every P0/P1 critical flow in the
> project. **A task that touches any flow listed here is bound by the regression-coverage P0 rule**
> (`docs/agent-contract.md` clause 15): it must add a regression test or update the existing one, and may
> not close without proof the old behavior still works.
>
> **How to use:** find the flow you are about to touch → read its happy + failure path → ensure its
> required regression test exists and passes BEFORE you change anything (record the green baseline) → after
> your change, the same test (updated if behavior legitimately changed) must pass → flip / keep the coverage
> status and paste the command in your session log. If the flow is missing, ADD a row in the same task.
>
> **Coverage status legend:** ✅ covered by an automated regression test · 🟡 partial (gate exists but not
> the full happy+failure assertion) · ❌ no automated coverage yet (manual only) · ⏳ scheduled in a named slice.
>
> **Owner-task** = the task/epic that built or last meaningfully changed the flow (for traceability).

## P0 — Auth lifecycle (Slice 2 / Task 441)

| Flow | Route / component / action | Owner task | Happy path | Failure path | Required regression test | Command | Coverage |
|---|---|---|---|---|---|---|---|
| Login (email/password) | `AuthSheet.tsx` → `signIn` (`lib/auth/browser.ts:22`) | D-series | valid creds → session + redirect | wrong creds → localized error, no session | smoke: login ok + login wrong-creds | `npm run test:e2e -- auth-login` (to be added, Slice 2) | ❌ |
| Signup | `AuthSheet.tsx` → `signUpWithCaptcha` (`auth/actions/captcha.ts:12`) | D.x | valid → confirm email sent | dup email / weak pw / captcha fail → typed error | smoke: signup ok + dup-email fail | Slice 2 | ❌ |
| **Signup confirmation → session/header** | signup confirm link → `/auth/confirm` → `/{locale}/auth/verified` | **446** | confirm link → state CONSISTENT: header authenticated iff session exists, and `/auth/verified` copy matches the real session state (no "you can use all features" while guest) | expired/used token → localized error (`verified_error_title/body`) + Login CTA, no false success; confirm-but-sync-fail → `verified_nosession_body` + Login CTA; double-click → same expired handling | (1) route: Set-Cookie present on success redirect + (2) page: syncFailed guard prevents success copy while guest | `npx vitest run src/app/auth/confirm/__tests__/route.test.ts "src/app/[locale]/auth/verified/__tests__/page.test.tsx"` | ✅ (Task 446 rework: Storybook contract-clean — `VerifiedCard` single-source, no STRINGS hardcode, no locale pin; 15 tests (9 route + 6 page invariant), 2 planted-violation FAILs confirmed; `screenshots:assert --fast` 924/924 PASS sq/en/uk/it × 320/375/390 2026-06-16) |
| Recovery request | `AuthSheet.tsx:210` → `requestPasswordResetWithCaptcha` (`captcha.ts:48`) | 121/122 | email → neutral success (no enumeration) | captcha fail → error; unknown email → still neutral | smoke: request neutral-success + non-enumeration assert | Slice 2 | ❌ |
| Recovery link → reset | hook `buildConfirmUrl` (`auth-email-hook/route.ts:191`) → reset page (`ResetPasswordClient.tsx`) | 224 / **439** | link lands on reset form; set new pw; verify only on user gesture; usable ≥15 min | scanner GET does NOT burn token; expired/used → localized + request-new CTA | smoke: link→reset ok + prefetch-GET-then-reset still works + expired path | Slice 2 (+ Task 439 fix) | ❌ (439 fix **prod-validated 2026-06-16**: scanner-GET 200 no burn, app+dashboard recovery → reset; auto pending Slice 2/441) |
| Logout | `signOut` (`lib/auth/browser.ts:56`) | D-series | session cleared, header reflects guest | — | smoke: logout clears session | Slice 2 | ❌ |
| OAuth (Google) | `signInWithOAuth` + `/auth/callback/route.ts` | D-series | PKCE code → session + profile ensured | code error → locale-aware login redirect | smoke (mock) or documented manual-only if e2e infeasible | Slice 2 | ❌ |
| Magic link | hook `magiclink` → `/auth/confirm` | 122/224 | token-hash verify → session | invalid/expired → login redirect | smoke or documented manual | Slice 2 | ❌ |
| Email change | `initiateEmailChange`/`consumeEmailChangeToken` → `/auth/confirm-email` | custom | token consumed → email updated | expired token → error | smoke: change ok + expired token | Slice 2 | ❌ |
| **Self-delete + email reuse** | `deleteOwnAccount` (`cabinet/actions/index.ts:235`) + `ProfileTab.tsx` | 12-19 / **439** | hard-delete auth user → **same email signs up again** | auth-delete fail → error, NOT success | smoke: delete → signup-with-same-email succeeds; delete auth-fail → no false success | Slice 2 (+ Task 439 fix) | ❌ (439 fix **prod-validated 2026-06-16**: account gone from Auth, same email re-signed up + confirm email received; auto pending Slice 2/441) |

## P0 — Admin lifecycle (Slice 4 / Task 443)

| Flow | Route / component / action | Owner task | Happy path | Failure path | Required regression test | Command | Coverage |
|---|---|---|---|---|---|---|---|
| Admin users list loads | `/admin/users` | HH | list renders, no console/hydration error | — | smoke + hydration gate | Slice 1 (436) / Slice 4 | 🟡 (436) |
| Admin user detail loads | `/admin/users/[id]` (`AdminUserProfile.tsx`) | 434 | renders, no hydration/date-format mismatch | — | hydration gate on this exact route | `screenshots:assert` + new hydration gate (436) | 🟡 (436) |
| User status / role / account-type change | `modules/admin/actions/index.ts` | 427 | change persists + history row written | permission denied → error | smoke: change writes `user_status_history` + RLS neg | Slice 4 | ❌ |
| Clear history (success) | `clear_user_history()` RPC (`admin/actions`) | 246 | rows cleared, audited | — | smoke success | Slice 1/4 | 🟡 |
| Clear history (no-op race) | same | 432 | `{cleared:0}` → neutral info toast | — | smoke: no-op neutral toast | Slice 1/4 | 🟡 |
| Hard-delete user (admin) | `hardDeleteUser` (`admin/actions/index.ts:564`) | — | listings archived → row deleted → `auth.admin.deleteUser` | auth fail → `profile_deleted_auth_failed` | smoke: delete + email-free; auth-fail path | Slice 4 | ❌ |

## P0/P1 — Listings lifecycle (Slice 3 / Task 442)

| Flow | Route / component / action | Owner task | Happy path | Failure path | Required regression test | Command | Coverage |
|---|---|---|---|---|---|---|---|
| Create listing | listing form → create action | Y | valid → listing created (pending/active) | validation error → typed | smoke: create ok + validation fail | Slice 3 | ❌ |
| Edit listing | edit side-panel (`Task 238`) | Y/238 | edit persists; dirty-state save | save error → typed | smoke: edit ok | Slice 3 | ❌ |
| Status change | `applyListingTransitionByStatus` / `StatusChangeControl` | 427/I | allowed transition persists | illegal transition blocked | smoke: legal + illegal transition | Slice 3 | ❌ |
| Report listing | `reportListing.ts` → report dialog | 243/BB / **435** | submit success | transport/RLS fail → **diagnosable** typed error (not generic dead-end) | smoke: report ok + failure is diagnosable | Slice 1 (436) / Slice 3 | 🟡 (436) |
| Inquiry / send message | `submitListingInquiry` + `ListingInquiryDialog` | 243 | sent → owner email; rate-limited | email transient → partial-success UX | smoke: inquiry ok + rate-limit | Slice 3 | ❌ |

## P0 — Server-action / RLS write paths (Slice 5 / Task 444)

| Flow | Route / component / action | Owner task | Happy path | Failure path | Required regression test | Command | Coverage |
|---|---|---|---|---|---|---|---|
| Every write action (insert/update/delete) touching an RLS table | all server actions in `modules/**/actions` | 270/444 | legitimate actor writes | illegitimate actor blocked by RLS | positive + negative permission test; actor matrix anon/user/owner/admin/service_role | Slice 5 | ❌ |

> This is the exact gap that let Task 270's RLS change break the report flow (Task 435) with no test
> catching it. Slice 5 makes positive+negative permission coverage mandatory for write paths.

## P1 — i18n / hydration / mobile contract (Slice 6 / Task 445)

| Flow | Route / component / action | Owner task | Happy path | Failure path | Required regression test | Command | Coverage |
|---|---|---|---|---|---|---|---|
| i18n parity on key routes | sq/en/uk/it | II | all keys present, render correct | missing key / leak | `check:i18n` + runtime render | `npm run check:i18n` | ✅ (parity) / 🟡 (runtime) |
| Hydration / invalid-HTML / console errors | key admin/user/listing routes | 434/436 | zero hydration/console errors | mismatch/invalid nesting → gate FAILS | console-error gate on tested routes | new gate (436), expanded (445) | 🟡 (436) |
| Date-format SSR/CSR match | `AdminUserProfile` + any `Intl` render | 434 | server-preformatted = client | sq ICU divergence → gate FAILS | hydration gate incl. date-format route | Slice 6 | 🟡 |
| Mobile no-overflow at 320/375/390 | critical admin/user/listing routes | DS/JJ | no horizontal scroll, full-width <640 | overflow → gate FAILS | responsive assert on critical routes (uk@320 mandatory) | `npm run screenshots:assert` (extend) | 🟡 |

## Maintenance rule

Every bug fixed anywhere in the project, after the fix, adds a regression test to the relevant row here
(coverage → ✅) so it cannot silently return. Every new critical flow built gets a row at creation time.
