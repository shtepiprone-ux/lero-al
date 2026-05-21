# Kickoff prompt — Task 159 (Sprint 4 — consolidate the two auth flows into one)

> Hand the fenced block below to Claude Code Sonnet 4.6.
> Companion task: Task 158 (country-aware phone validation). Default order: 158 → 159.
> Full task record: `tasks/Sprints/Sprint_4_—_Auth_Phone_Validation_and_Flow_Consolidation.md`.
> This is a dedicated architecture task because the project's Architecture Stability Rules require large
> structural rewrites to live in their own task — do NOT fold it into Task 158.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
The app currently has TWO parallel authentication flows, which breaks the single-source-of-truth
principle. Make the AuthSheet drawer the SINGLE canonical flow and remove the legacy page forms.
Document this as Task 159 — preserve global task numbering. Do NOT change phone-validation rules here;
those are owned by Task 158 (reuse its shared phone module).

The two flows:
1. CANONICAL — AuthSheet side drawer (Task 108 / Epic B.1): src/modules/auth/components/AuthSheet.tsx,
   opened by Header.tsx, MobileBottomNav.tsx, and the global openAuthSheet() event
   (src/lib/auth/authSheet.ts). Views: login | register | register-agent | forgot-password.
2. LEGACY (remove) — page forms:
   /[locale]/auth/login -> LoginFormClient -> LoginForm
   /[locale]/auth/register -> RegisterFormClient -> RegisterForm
   These pages are still live: /auth/login is the redirect() target for every gated route, and the
   homepage agent CTA links to /auth/register?type=agent.

Goal:
Exactly one login UI and one registration UI (AuthSheet). Convert /auth/login and /auth/register so
they open the canonical drawer (preserving the `next` and `?type=agent` params) instead of rendering
their own forms, then delete LoginForm, RegisterForm, LoginFormClient, RegisterFormClient once
unreferenced.

Required pre-read before implementation:
1. docs/backlog.md and docs/ai-behavior.md (Architecture Stability Rules, Domain Integrity Rules,
   Scope Isolation Rules, Shared Component Rules, Navigation Safety Rules, UI Primitive Anti-Patterns,
   Localization Rules).
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
3. docs/architecture.md (module boundaries), docs/ui-rules.md (Sheet/Dialog), docs/analytics-rules.md
   (preserve any login/signup event tracking when re-routing).
4. Inspect: src/lib/auth/authSheet.ts, src/components/layout/Header.tsx,
   src/components/layout/MobileBottomNav.tsx, src/app/[locale]/auth/login/page.tsx,
   src/app/[locale]/auth/register/page.tsx, src/modules/auth/components/{Login,Register}Form*.tsx,
   src/app/[locale]/page.tsx (agent CTA, ~line 131).

Required investigation (enumerate every entry point — confirmed during audit):
- redirect('/auth/login?next=…') callers: admin layout, cabinet page, favorites page,
  listings/create page, listings/[slug]/edit page, auth-callback failure (src/app/auth/callback/route.ts),
  confirm-email page, ResetPasswordClient.
- homepage agent CTA -> /auth/register?type=agent (src/app/[locale]/page.tsx:131).
- Decide how SERVER redirect() callers reach the client-side drawer. Evaluate and document a chosen
  approach, e.g. a thin /auth/login (and /auth/register) page that auto-opens the drawer and preserves
  `next`, with a graceful no-JS fallback; preserve Back/Forward behavior and analytics events.
- Confirm register-agent parity: the homepage ?type=agent CTA must open the drawer's register-agent
  view (which collects city/company — Tasks 112/113).

Implementation:
1. Convert /auth/login and /auth/register to open AuthSheet (preserve `next` and `?type=agent`).
2. Point the homepage agent CTA to openAuthSheet('register-agent') (or the converted route).
3. Delete RegisterForm, LoginForm, RegisterFormClient, LoginFormClient once unreferenced; remove dead
   imports and any now-unused i18n keys (keep all 4 locales balanced).
4. Ensure every redirect() caller lands the user in the drawer flow with the correct post-auth `next`.

Acceptance criteria:
- One login UI and one registration UI (AuthSheet); no LoginForm/RegisterForm remain.
- All entry points (header, mobile nav, homepage agent CTA, all gated-route redirects, confirm-email,
  reset-password) open the canonical drawer with the correct view and preserved next/type.
- No dead routes or broken links; Back/Forward behaves correctly.
- Agent registration from the homepage uses the same validated drawer as the header.
- 0 new lint errors / 0 new warnings; npm run typecheck clean; npm run build passes.
- governance:localization PASS (locales balanced after key removals); responsive PASS at
  320/375/390/768/1280/1440/2560.
- docs/backlog.md updated; session log: docs/sessions/<run-date>-task-159-auth-flow-consolidation.md.
- Commit + push when green.

Out of scope:
- Do NOT change Supabase auth behavior, session handling, or the email/recovery flows (Epic D).
- Do NOT redesign AuthSheet visuals or its views beyond what consolidation requires.
- Do NOT implement SMS/OTP.
- Do NOT alter phone-validation rules — Task 158 owns them; reuse the shared phone module.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.
```
