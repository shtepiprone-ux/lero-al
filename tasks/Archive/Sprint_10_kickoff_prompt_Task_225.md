# Sprint 10 — kickoff prompt — Task 225 (follow-up to Task 224)

> Shared hard contract: You are Claude Code Sonnet 4.6 working in `lero-al`. No scope change; no
> invented architecture — if anything is ambiguous, STOP and ask the orchestrator. Literal AC only.
> Update `docs/backlog.md` + add a `docs/sessions/` log. 0 new lint/typecheck errors; `npm run build`
> passes; governance PASS. Locale parity sq/en/uk/it (every new string ×4). For the touched UI, verify
> the new alert string does not overflow at 320px in `uk` (longest copy). Owner runs git: end with a
> single ready-to-run `git add <paths>` + `git commit` block as PLAIN TEXT — the OWNER runs it in
> PowerShell; you NEVER run git yourself.

---

## Task 225 — Surface the localized `auth_callback_failed` error in the login drawer

```
Hard contract: see top. This is the localization/UX follow-up the orchestrator opened when reviewing
Task 224. Task 224 fixed the 404 (P0) and now redirects every auth-confirm/callback failure to
`/${locale}/auth/login?error=auth_callback_failed`. PROBLEM: that `?error=` param is silently dropped —
the login page never reads it, so a user whose confirmation/recovery/magic-link link fails just sees the
login drawer with NO explanation. Fix = thread the error code through to the existing AuthSheet error
Alert and add ONE localized string in all four locales.

Root cause (verified against the working tree):
- `src/app/auth/confirm/route.ts:25` and `src/app/auth/callback/route.ts:32` already redirect failures to
  `${origin}/${locale}/auth/login?error=auth_callback_failed` — correct, locale-aware. (Do NOT change these.)
- `src/app/[locale]/auth/login/page.tsx` reads ONLY `next` from searchParams and renders
  `<AuthRedirect view="login" next={next} />` — it never reads `error`.
- `src/modules/auth/components/AuthRedirect.tsx` takes `{ view, next }` and calls `openAuthSheet(view)` —
  no error is forwarded.
- `src/lib/auth/authSheet.ts` `openAuthSheet(view)` dispatches `CustomEvent(AUTH_SHEET_EVENT, { detail:
  { view } })` — the event detail carries no error.
- `src/modules/auth/components/AuthSheet.tsx` LoginView already has the full localized error mechanism:
  `useTranslations('auth')` (L61), `const [errorKey, setErrorKey] = useState<string|null>(null)` (L65),
  and renders `t(errorKey)` inside an Alert (L94–96). The Epic A error-code contract + `mapAuthError`
  (L39–47) is the canonical pattern — REUSE it; do not invent a parallel one.
- `messages/{sq,en,uk,it}.json` → `auth` namespace holds the `error_*` keys (e.g.
  `error_invalid_credentials`, `error_generic`). There is currently NO `error_auth_callback_failed` key.

Pre-read (read fully before editing):
- src/app/[locale]/auth/login/page.tsx
- src/modules/auth/components/AuthRedirect.tsx
- src/lib/auth/authSheet.ts
- src/components/layout/Header.tsx  (owns AuthSheet state; listens to AUTH_SHEET_EVENT — find the
  listener that maps the event detail into AuthSheet props/state)
- src/modules/auth/components/AuthSheet.tsx  (LoginView errorKey state L65 + Alert L94–96; mapAuthError L39)
- messages/en.json `auth` namespace (around L292 `error_invalid_credentials`) + sq/uk/it equivalents
- src/app/auth/confirm/route.ts, src/app/auth/callback/route.ts (read-only — confirm the emitted ?error=)
- docs/ui-rules.md, docs/component-rules.md, Task 224 session log

Scope (chosen approach — implement exactly this; STOP and ask only if a step proves infeasible):
1. `login/page.tsx`: read `error` from searchParams (widen the Props type to
   `Promise<{ next?: string; error?: string }>`); pass it to `<AuthRedirect ... error={error} />`.
2. Map the URL error CODE → a stable i18n KEY (do NOT pass raw URL codes to `t()`). Add a tiny lookup
   (mirror `mapAuthError`'s "code → stable key" shape) so future codes are easy to add. For now:
   `auth_callback_failed` → `error_auth_callback_failed`; any unknown code → `error_generic`.
   Put this mapper wherever the existing auth error-key contract lives (next to `mapAuthError` or a small
   helper) — single source, no duplication.
3. Thread the mapped key through the existing drawer pipeline:
   - `AuthRedirect.tsx`: accept an optional `errorKey?: string` prop and forward it.
   - `authSheet.ts`: extend `openAuthSheet(view, errorKey?)` and the `AUTH_SHEET_EVENT` detail to
     `{ view; errorKey?: string }` (keep the existing single-arg calls working — `errorKey` optional).
   - `Header.tsx`: in the AUTH_SHEET_EVENT listener, read `detail.errorKey` and pass it into AuthSheet.
   - `AuthSheet.tsx` LoginView: seed the existing `errorKey` state from the incoming prop on open (only
     for `view === 'login'`); the existing Alert (L94–96) then renders `t(errorKey)` with zero new UI.
   If extending the shared `AUTH_SHEET_EVENT` detail or Header state turns out to require a risky change
   to other AuthSheet consumers, STOP and ask before proceeding.
4. Add `error_auth_callback_failed` to the `auth` namespace in ALL FOUR locale files (same key, 4×).
   Suggested copy (adjust wording if a better house-style exists, keep meaning):
     - en: "Email confirmation failed or the link has expired. Please sign in or request a new link."
     - sq: "Konfirmimi i emailit dështoi ose lidhja ka skaduar. Ju lutemi hyni ose kërkoni një lidhje të re."
     - uk: "Не вдалося підтвердити email або термін дії посилання минув. Будь ласка, увійдіть або запросіть нове посилання."
     - it: "Conferma email non riuscita o il link è scaduto. Accedi o richiedi un nuovo link."
5. Do NOT touch the two route files, the email hook, or the `verifyOtp`/`ensureUserProfile` logic from
   Task 224. Do NOT change the happy-path success URL.

Acceptance criteria:
- Visiting `/${locale}/auth/login?error=auth_callback_failed` opens the login drawer with the localized
  failure message visible in the existing Alert, in all four locales.
- The raw code `auth_callback_failed` is never shown to the user (it is mapped to a translation key);
  an unknown `?error=` code falls back to `error_generic`, never a crash or a raw string.
- A normal `/${locale}/auth/login` (no `?error=`) opens the drawer with NO error Alert (no regression).
- `error_auth_callback_failed` exists in sq/en/uk/it with the same key; the message does not overflow /
  clip the Alert at 320px in `uk`.
- 0 new lint/typecheck errors; `npm run build` passes; backlog + session log updated.
- End with a single ready-to-run `git add <paths>` + `git commit -m "feat(Task225): ..."` block as plain
  text covering exactly the changed files. Do NOT run git yourself.

Out of scope: redesigning AuthSheet or the Alert; changing Task 224's routes/hook; surfacing errors for
register/forgot-password views (login only); any other Sprint 10 task.
```
