### Task 366 — Private → Agent account upgrade flow (controlled one-way upgrade) + CTA auth-branching + blank-spinner close bug

> **Status: READY (priority: CRITICAL bug).** Produced by the Task 356 Opus planning audit
> (`docs/sessions/2026-06-02-task-356-agent-account-upgrade-flow-opus-planning.md`). Related: Epic B —
> Auth Registration and Agent Onboarding; supersedes the toggle behaviour touched by Task 330.
>
> **You are Sonnet 4.6 executor.** Implement per the literal acceptance criteria below. Do NOT change scope.
> Do NOT invent architecture — if a required decision is missing or ambiguous, **STOP and ASK the orchestrator**.
> Do NOT remove existing profile/auth/admin capabilities. **Single-writer git:** you do NOT run any mutating git;
> end with a "Files Changed" table only — the ORCHESTRATOR (Opus) reads the real diff and emits commit commands.

```
Type:     bugfix + feature (auth / profile / account-type lifecycle)
Priority: critical
Area:     homepage agent CTA · auth registration · profile account-type · account-type persistence · RLS/server guard
```

## Pre-read (mandatory)
1. `docs/agent-contract.md`
2. `docs/backlog.md`
3. `docs/rule-index.md` → **Profile / edit-flow** bundle: `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`, `docs/ai-behavior.md` → Note 23 (Edit-Flow Preservation)
4. `docs/rule-index.md` → **DB / server action / RLS** bundle: `docs/data-access-rules.md`, `docs/rls-rules.md`, `docs/domain-rules.md`, `docs/qa-rules.md`
5. `docs/rule-index.md` → **UI / layout** bundle: `docs/design-system.md`, `docs/ui-rules.md`
6. `docs/ai-behavior.md` → Note 14 (global-change rule), Note 19 (UX flow), Note 20 (control preservation), Note 21 (control relocation)
7. Planning source: `docs/sessions/2026-06-02-task-356-agent-account-upgrade-flow-opus-planning.md`

## Files to inspect (audited — confirm before editing)
- `src/app/[locale]/page.tsx:130-138` — homepage agent CTA (currently `href={/${locale}/auth/register?type=agent}`, no auth branching).
- `src/modules/cabinet/components/ProfileTab.tsx:94,128,166,264-281` — `userType` local-state tab toggle reveals company fields; persists via cabinet action on save.
- `src/modules/cabinet/actions/index.ts:31,59` — profile update action; writes `company_name` when `userType==='agent'`. No dedicated upgrade action, no downgrade guard.
- `src/types/database.ts:2` — `UserType = 'private' | 'agent' | 'developer'`.
- `src/modules/auth/components/AuthSheet.tsx:91-99,759-779` — Sheet `onOpenChange`; register success `onClose()` + `router.push(next)` + `router.refresh()` (suspected blank-spinner-on-close root cause).
- `/auth/register` route (locate; may be a page or intercepting modal) — confirm whether the blank spinner is this route or the AuthSheet.
- Avatar/logo upload pattern (reuse for company logo) — locate the existing avatar upload component/action.

## Root causes (from audit — fix these)
1. CTA never branches on auth state → authenticated private users hit new-user registration.
2. Profile Private→Agent is a local-state UI toggle, not a controlled one-way upgrade; agent can flip back (downgrade) freely; no server guard.
3. No dedicated upgrade route/action; company data persisted as a side-effect of the generic profile save.
4. Close behaviour (`router.push(next)`/`refresh`) suspected to leave a blank page + spinner — Sonnet must reproduce and fix.

## Current behavior to preserve
- Guest agent registration/login (the existing `/auth/register?type=agent` flow) keeps working for **unauthenticated** users.
- Avatar upload, all unrelated profile fields/capabilities, and any existing **admin-only** account/role management remain working.
- Existing `user_type` values and any consumer reading `user_type==='agent'` (e.g. `ListingContact.tsx`) keep working.
- Profile save flow for non-account-type fields unchanged.

## Required after behavior
- **Guest / unauthenticated:** homepage CTA → existing guest agent registration/login; closing it returns to a valid page (no blank/spinner).
- **Authenticated private user:** CTA does NOT open new-user registration; routes to a dedicated **`/[locale]/profile/upgrade-agent`** (or an existing canonical profile/account route — justify the final choice). Page explains the one-way upgrade, has back/cancel, fields: **Company name** (required unless schema proves optional — justify), **Company logo** (optional; reuse avatar upload), **Company city** (required unless schema proves optional — justify), submit "Оновити тип акаунта" (localized).
- **Successful upgrade:** set `user_type='agent'` · persist company data (and create/update company/agency row if the model requires) · redirect to profile · profile shows Agent · success toast if existing UX uses toasts · refreshed profile still shows Agent + company data.
- **Authenticated agent:** homepage CTA does NOT offer register-as-agent again (Opus decision: **hide the CTA** for authenticated agents; if the section needs a button, replace with a cabinet/profile link). Profile shows "Агент"; **completely hides** the "Приватна особа" option (not disabled/read-only); no self-service downgrade.
- **Admin / moderator:** CTA never routes them into agent registration; no accidental conversion to agent.
- **One-way lifecycle:** Private→Agent only via the controlled flow. Agent→Private NOT allowed via profile UI **AND** blocked at the server/action layer (preserve any existing admin-only downgrade workflow).
- **Blank-spinner bug:** closing any registration/upgrade modal/drawer (Esc, backdrop, Cancel, browser back) returns to a valid route; no infinite loading; no stuck intercepted route; no empty page.

## Positive flow (happy path)
- **Authenticated private user:** (1) on homepage clicks agent CTA → routes to `/[locale]/profile/upgrade-agent` (NOT registration); (2) sees title + one-way-upgrade explanation + back/cancel + company name/logo/city fields; (3) fills required fields, submits; (4) system sets `user_type='agent'`, persists company data, shows success toast; (5) redirects to profile showing "Агент"; (6) after manual refresh profile still shows Agent + company data; "Приватна особа" option is hidden.
- **Guest:** CTA → existing guest agent registration/login; on close returns to homepage intact.
- **Authenticated agent:** CTA hidden/replaced; profile shows "Агент" only, no "Приватна особа" option.
- **Admin/moderator:** CTA does not route into agent registration; role unchanged.

## Negative flow (every off-happy-path branch)
- **Cancel/dismiss** of upgrade page or any registration/upgrade modal-drawer (Esc, backdrop, Cancel button, browser back): returns to a valid route (profile or homepage), **NEVER** a blank page with spinner; no `user_type` change; no company write.
- **Validation error** (missing required company name/city): localized inline error (locale key), no account change, no redirect; user corrects and resubmits.
- **Server error / 500** during upgrade: no partial upgrade (account type unchanged OR fully rolled back), localized error message, user can retry.
- **Permission-denied / unauthenticated** hitting `/profile/upgrade-agent` directly: redirect to login/guest flow; no upgrade.
- **Double-submit:** submit guard (disabled button / pending state) prevents duplicate upgrade.
- **Agent self-downgrade attempt:** no visible downgrade control in profile (UI guard) AND a direct/manual action call is rejected by the server/action guard (unless an existing admin-only workflow supports it — preserve it).
- **Admin/moderator** never converted to agent by any of these paths.
- **Locale mismatch:** no English leak into sq/uk/it; all labels/errors/toasts/helper text localized.
- **Expired session** mid-flow: routed to login, no partial write.

## Acceptance criteria (literal — each maps to a flow + verifiable at file:line)
- AC1 CTA auth-branching for guest/private/agent/admin (page.tsx) — Positive flow per state.
- AC2 Authenticated private CTA routes to dedicated upgrade flow, NOT new-user registration.
- AC3 Upgrade page: explanation + back/cancel + company name/logo(optional, reused upload)/city per final schema decision.
- AC4 Successful upgrade persists `user_type='agent'` + company data; redirect to profile; profile + refreshed profile show Agent; toast if UX uses toasts.
- AC5 After upgrade "Приватна особа" option completely hidden for agents; profile no longer exposes Agent as a simple tab/toggle revealing fields.
- AC6 Agent cannot self-downgrade via profile UI (UI guard) AND server/action guard prevents agent→private downgrade via direct calls (preserve existing admin-only workflow).
- AC7 Closing registration/upgrade modal/drawer never leaves a blank page with spinner; browser back returns to a valid state (negative flow → cancel/dismiss verifiable at the close handler).
- AC8 All new strings localized sq/en/uk/it (same key set); UI works at 320/375/390/768/1280/1440/2560 with no overflow/clip/hidden submit-back in any locale; usable upload control on mobile.
- AC9 Existing guest registration, avatar upload, unrelated profile fields, and admin-only role management remain working (Note 19/20).
- Positive + Negative flow parity: every branch above verifiable in the diff.

## Out of scope
Paid plans · agent subscription billing · agent verification/review workflow (unless already present and required for persistence) · redesigning the whole profile page · redesigning global auth · removing guest registration · Agent→Private downgrade from profile · changing admin/moderator permissions beyond preventing accidental agent-registration routing · rewriting avatar upload architecture (reuse it) · unrelated homepage sections.

## Validation (run or document why impossible)
`npx tsc --noEmit` → 0 · `npm run lint` → 0 new · `npm run build` · `npm run check:i18n` PASS · relevant unit/integration tests if present · manual QA for guest/private/agent/admin-moderator · manual QA for close-drawer + browser-back · manual QA sq/en/uk/it · manual responsive QA at the 7 breakpoints. Provide: Files Changed table · root-cause summary · before/after behavior · Note 18 self-validation block · AC-by-AC self-audit citing both flows.

## Split note
Opus audit concluded ONE task (this 366). If during implementation Sonnet finds the routing/spinner bugfix must ship independently of the upgrade page for safety, STOP and ASK before splitting (max split = 366A routing/modal/spinner + auth branching; 366B upgrade page + one-way lifecycle).
