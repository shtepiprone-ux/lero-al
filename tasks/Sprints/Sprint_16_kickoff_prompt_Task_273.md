# Sprint 16 — Task 273 kickoff (Cabinet password-change form with current-password reauth)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` — for this task: **"Profile / edit-flow task" bundle + "Email / auth lifecycle task" bundle** (mixed). No scope change; STOP & ASK if ambiguous; literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check in `uk` 320px). UI task → ×4 locales (sq/en/uk/it) AND 7 breakpoints (320/375/390/768/1280/1440/2560) REQUIRED. Owner runs git; executor never runs git.

---

## Task 273 — Cabinet password-change form with current-password reauth

```
Hard contract: see top.

Type:        feature (new edit-flow surface)
Priority:    high (unblocks two Supabase Auth toggles: "Secure password change" + "Require current password when updating")
Area:        cabinet / auth / shared UI primitives / i18n

GOAL: Add a "Change password" surface to the cabinet (`ProfileTab`) that
requires the user to enter their CURRENT password before setting a new one.
Wire it to the existing `<PasswordInput>` + `<PasswordRequirementsHint>`
primitives (Task 271). On submit, verify the current password via
`signInWithPassword(email, current_password)`; if OK, call
`updateUser({ password: new_password })`; on success, sign the user out
(forcing re-login on all devices, which invalidates the now-old session
that may have been used to set the new password). This is the frontend
prerequisite for the owner flipping the Supabase Dashboard toggles
"Secure password change" + "Require current password when updating" → ON
(currently OFF interim per `docs/integrations.md` →
"Supabase Auth Configuration").

Strategy decision (orchestrator, 2026-05-28):
- Use the `signInWithPassword(email, current_password)`-verify path
  (NOT the Supabase `auth.reauthenticate()` nonce/OTP-email flow).
- Rationale: simpler UX (one form, no email round-trip; user confirms
  with what they already know — their current password); aligns with
  user expectations from other platforms; does not require the
  `<ReauthEmail>` flow to be activated. `<ReauthEmail>` stays in place
  for the Supabase Send Email Hook contract — Supabase still delivers
  reauth OTPs through our hook when triggered by other auth code paths
  in the future.
- Risk acknowledged: the verify-then-update sequence is two separate
  calls; between them, an attacker on the same session could in theory
  intercept. Mitigation: post-success `signOut({ scope: 'global' })`
  forces re-login on ALL devices, so a stolen session that completed
  the password change still loses access on the next request.

Filed by: orchestrator (Opus 4.7) on 2026-05-28. Direct dependency of
the owner flipping "Secure password change" + "Require current password
when updating" toggles ON in Supabase Dashboard. Filed alongside Task 274
(Captcha) and Task 275 (GRANT audit) as Sprint 16 Auth Security
Hardening batch.

Pre-read (Profile / edit-flow + Email / auth lifecycle bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/ui-rules.md        → typography, spacing, helper-text patterns,
                            button/input rules, icon size scale, 44px
                            touch targets.
- docs/component-rules.md → reusable component standards; design-token
                            usage; locale rules.
- docs/qa-rules.md
- docs/ai-behavior.md → Note 19 (UX Flow Preservation), Note 20
                        (Existing-Control Preservation), Note 23
                        (Edit-Flow Preservation Rule — this is a new
                        editable control on the cabinet profile screen,
                        all 9 components of an edit flow apply:
                        editable input × 2 (current + new), validation,
                        save, loading, success, error, persistence,
                        i18n × 4, mobile usability at 320px).
- docs/integrations.md → "Supabase Auth Configuration" — confirm the
                          current toggle states + the dependent-task row
                          for this task.
- docs/domain-rules.md → cabinet edit-flow conventions.
- tasks/Sprints/Sprint_16_kickoff_prompt_Task_271.md — for the
  `<PasswordInput>` / `<PasswordRequirementsHint>` primitives the new
  form will reuse.
- docs/sessions/2026-05-28-task-271-password-ux-refactor.md — for the
  exported helpers from `<PasswordRequirementsHint>` (e.g. the
  `allPasswordRulesMet` helper used by `ResetPasswordClient.tsx`).
- src/lib/auth/browser.ts — exported `signIn`, `updatePassword`,
  `signOut` helpers.
- src/modules/cabinet/components/ProfileTab.tsx — host surface (the
  new section lands inside this component or alongside it).
- src/modules/cabinet/actions/index.ts — host module for the new server
  action.
- src/modules/auth/components/ResetPasswordClient.tsx — reference for the
  `<PasswordInput>` + `<PasswordRequirementsHint>` integration pattern
  (the cabinet form mirrors this pattern with the addition of a
  `current_password` field above).

Current behavior to preserve:
- `ProfileTab.tsx` currently has NO password-change UI. The recovery
  flow (forgot-password → email link → `ResetPasswordClient.tsx`) is the
  only existing way to change a password. THAT FLOW MUST KEEP WORKING
  UNCHANGED — this task ADDS a second entry point (signed-in user
  changing their password in the cabinet); it does NOT replace the
  recovery flow.
- All other ProfileTab functionality (profile fields, avatar, email
  change, account delete) preserved unchanged. Per Note 20: before/after
  inventory of ProfileTab controls in the session log; nothing else
  changes.
- `updatePassword(password)` helper at `src/lib/auth/browser.ts:50` stays
  as-is. The new flow calls it AFTER the `signInWithPassword` re-verify.
- `signIn(email, password)` helper at `src/lib/auth/browser.ts:22` stays
  as-is. The new flow re-uses it for the re-verify step.
- `signOut(scope?: 'global' | 'local')` helper at
  `src/lib/auth/browser.ts:56` stays as-is. The new flow calls
  `signOut('global')` after a successful password change.
- `<PasswordInput>` and `<PasswordRequirementsHint>` (from Task 271)
  stay as-is — the new form CONSUMES them, does not modify them.
- `AuthSheet.tsx` (login + signup + forgot-password) — do not touch.
- `ResetPasswordClient.tsx` (recovery flow) — do not touch. The recovery
  flow already invalidates the prior session via `await signOut()` at
  line 66 of ResetPasswordClient.tsx; the cabinet flow mirrors this
  behavior but uses `signOut('global')` (explicit scope) for clarity.
- Sidebar / cabinet shell — do not touch. The new form lives INSIDE
  ProfileTab; no new sidebar entry.

Required after behavior:

1. NEW server action `changeCabinetPassword({ currentPassword, newPassword })`
   in `src/modules/cabinet/actions/index.ts` (extending the existing
   actions file — same import/export discipline as the other actions in
   that file):

   Signature & behavior:
   - Accepts `{ currentPassword: string; newPassword: string }`.
   - Returns a typed result: `{ ok: true } | { ok: false; reason: 'invalid_current' | 'weak_password' | 'same_password' | 'rate_limited' | 'session_expired' | 'server_error' }`.
   - Server-side validation:
     - `newPassword` must satisfy ALL 5 rules from `<PasswordRequirementsHint>` (re-use the exported `allPasswordRulesMet` helper — do NOT duplicate the rule list). If not, return `{ ok: false, reason: 'weak_password' }`.
     - `currentPassword` and `newPassword` must NOT be equal. If they are, return `{ ok: false, reason: 'same_password' }`.
   - Identifies the current user via `getServerUser()` (or whatever the
     project's canonical server-side user resolver is — see other
     cabinet actions in the same file). If no user → `{ ok: false, reason: 'session_expired' }`.
   - Re-verifies the current password via a server-side
     `signInWithPassword(user.email, currentPassword)` using a
     short-lived server-side Supabase client. On `error` (invalid creds):
     `{ ok: false, reason: 'invalid_current' }`. On rate-limit-class
     error: `{ ok: false, reason: 'rate_limited' }`.
   - On verify success, calls
     `supabase.auth.updateUser({ password: newPassword })` using the
     authenticated server-side client (NOT the service-role client —
     `updateUser` is auth-scoped). On error → `{ ok: false, reason: 'server_error' }`.
   - On success, returns `{ ok: true }`. Does NOT sign the user out from
     the server side — the client handles that (the client knows the UX
     intent; the server returns the result and leaves cleanup to the
     client transition).
   - Wraps any unexpected exception → `{ ok: false, reason: 'server_error' }`
     and logs a Sentry breadcrumb (use the same Sentry pattern as other
     cabinet actions in the file).

2. NEW client component `<CabinetPasswordSection />` lives at
   `src/modules/cabinet/components/CabinetPasswordSection.tsx`. It is
   imported and rendered INSIDE `ProfileTab.tsx`, AFTER the existing
   profile/email/avatar sections and BEFORE the delete-account section
   (so the destructive action stays at the bottom, per existing visual
   order).

   Layout / fields:
   - Section title `t('cabinet.password_section_title')` ("Change password" / "Змінити пароль" / "Cambia password" / "Ndrysho fjalëkalimin").
   - Field 1: `<Label>` + `<PasswordInput>` for **current password** (`autoComplete="current-password"`, `id="cabinet-current-password"`, `required`).
   - Field 2: `<Label>` + `<PasswordInput>` for **new password** (`autoComplete="new-password"`, `id="cabinet-new-password"`, `required`).
   - `<PasswordRequirementsHint value={newPassword} />` rendered below the new-password input. Reuse the same primitive as Task 271; do NOT duplicate the rule list.
   - Submit `<Button size="xl">` with `disabled = submitting || !allPasswordRulesMet(newPassword) || currentPassword.length === 0`.
   - No `confirm new password` field (Task 271 dropped these globally; same rationale applies here — the eye toggle on `<PasswordInput>` is the typo-prevention mechanism).
   - Inline `<Alert variant="destructive">` for error states; ✅ inline `<Alert variant="success">` (or sonner toast — match the rest of ProfileTab's pattern) for success.

   Behavior:
   - `onSubmit`: calls `changeCabinetPassword({ currentPassword, newPassword })`. On `{ ok: true }`:
     - Show success toast: `t('cabinet.password_changed_success')`.
     - Clear both input fields.
     - Call `signOut('global')` to invalidate ALL sessions (the user is then redirected by the existing AuthController logic to the login screen — preserve the existing redirect; do NOT manually `router.push`).
   - On `{ ok: false, reason: 'invalid_current' }`: focus the current-password input + show inline error `t('cabinet.password_error_invalid_current')`. Do NOT clear the new-password field.
   - On `{ ok: false, reason: 'weak_password' }`: focus the new-password input + show inline error `t('cabinet.password_error_weak')` (defensive — client-side validation should have caught this; this is the server-side last line of defense).
   - On `{ ok: false, reason: 'same_password' }`: focus the new-password input + show inline error `t('cabinet.password_error_same')`.
   - On `{ ok: false, reason: 'rate_limited' }`: show inline error `t('cabinet.password_error_rate_limited')`. Disable submit for 30 seconds (defensive UX — back off).
   - On `{ ok: false, reason: 'session_expired' }`: show inline error `t('cabinet.password_error_session_expired')` and call `signOut('local')` after 2 seconds so the AuthController redirects to login.
   - On `{ ok: false, reason: 'server_error' }`: show inline error `t('cabinet.password_error_server')`. Allow retry.

   Accessibility:
   - `aria-describedby` linking the `<PasswordRequirementsHint>` to the new-password input.
   - Error `<Alert>`s use `role="alert"`.
   - Submit button shows `<Loader2>` during `submitting` (same pattern as `ResetPasswordClient.tsx`).
   - Field labels associated with inputs via `htmlFor` / `id`.

3. New locale keys (×4 locales — sq/en/uk/it, same key set):
   - `cabinet.password_section_title`
   - `cabinet.password_current_label`
   - `cabinet.password_new_label`
   - `cabinet.password_submit`
   - `cabinet.password_changed_success`
   - `cabinet.password_error_invalid_current`
   - `cabinet.password_error_weak` (defensive — should rarely render)
   - `cabinet.password_error_same`
   - `cabinet.password_error_rate_limited`
   - `cabinet.password_error_session_expired`
   - `cabinet.password_error_server`
   - = 11 new keys × 4 locales = 44 entries.
   - Same key set in `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`.
   - Albanian (`sq`) is written first (canonical), then translated to the other three.

4. `ProfileTab.tsx` import + render the new `<CabinetPasswordSection />`
   ONLY — no other change to ProfileTab. Per Note 20: paste a before/after
   inventory of ProfileTab controls in the session log; the after-state
   must include the same fields + the new password section.

5. NO change to the recovery flow (`ResetPasswordClient.tsx`).
6. NO change to `AuthSheet.tsx` (login/signup/forgot-password).
7. NO change to `<PasswordInput>` or `<PasswordRequirementsHint>`.
8. NO change to other cabinet actions in `src/modules/cabinet/actions/index.ts`.

Positive flow (happy path):
- Signed-in user navigates to `/<locale>/cabinet` → ProfileTab is the
  default landing → scrolls down past profile/email/avatar sections →
  sees the new "Change password" section.
- User types their CURRENT password in field 1; types a strong NEW
  password in field 2; the rule hint shows 5/5 ✓; submit button enables.
- User clicks submit → `changeCabinetPassword` is called.
- Server action: looks up user by session; calls
  `signInWithPassword(user.email, currentPassword)` → success; calls
  `updateUser({ password: newPassword })` → success; returns `{ ok: true }`.
- Client: shows success toast; clears both inputs; calls
  `signOut('global')`; AuthController redirects to login.
- User logs back in with new password → confirmed.
- Post-conditions: Supabase Auth audit log shows one
  `signInWithPassword` event + one `updateUser` event + one `signOut`
  event for this user; user's password hash in `auth.users` updated;
  all prior sessions invalidated.

Negative flow (every off-happy-path branch):
- **Empty current-password field** — submit button disabled (`currentPassword.length === 0`); no server call. No toast.
- **Empty new-password field OR rules unmet** — submit button disabled (`!allPasswordRulesMet(newPassword)`); no server call. `<PasswordRequirementsHint>` shows ✗ rows.
- **Invalid current password** — server returns `{ ok: false, reason: 'invalid_current' }` → inline error `t('cabinet.password_error_invalid_current')`; focus moves to current-password input; new-password field NOT cleared (user keeps their typed value).
- **new === current** — client-side guard rejects before submit (defense in depth); server-side `same_password` returned if client-side guard bypassed → inline error `t('cabinet.password_error_same')`.
- **Server returns weak_password** (defensive — client-side guard should have caught; in case of bypass via dev tools) — inline error `t('cabinet.password_error_weak')`; focus moves to new-password input.
- **Rate-limited** (Supabase auth rate limit, e.g. 6+ failed signInWithPassword attempts in 1 hour) — inline error `t('cabinet.password_error_rate_limited')`; submit disabled for 30 seconds; recovery: wait and retry.
- **Session expired** (`getServerUser()` returns null) — inline error `t('cabinet.password_error_session_expired')`; auto-signOut after 2 seconds; AuthController redirects to login.
- **Server error (Supabase 5xx, network error, unexpected exception)** — inline error `t('cabinet.password_error_server')`; allow retry; Sentry breadcrumb logged.
- **Cancel / dismiss** — there is no Cancel button on the section (it's an inline form, not a modal). User can navigate away; if both fields are empty, no warning. If fields contain text and user navigates away, the existing `useUnsavedChangesGuard` (already in ProfileTab) handles the prompt — but ONLY if we mark the password section as having dirty state. **STOP & ASK:** the existing unsaved-changes-guard is wired to the profile fields, not the password fields. Option A: include password dirty-state in the guard (adds noise if user typed and decides not to change). Option B: do NOT include password fields in the guard (matches typical password-change UX where unfilled-but-typed is fine). Default to **Option B** (do NOT include password dirty-state in the guard) unless orchestrator overrides — this matches the recovery flow's behavior (`ResetPasswordClient.tsx` has no unsaved-changes guard either).
- **Double-submit (rapid clicking)** — `submitting` state disables the submit button; only one server call per user gesture.
- **Network offline** — `fetch` rejects in the server action client; client catches → inline error `t('cabinet.password_error_server')`. (Note: server actions in Next.js App Router DO bubble network errors to the client transition; the catch block handles them.)
- **Locale switch mid-typing** — preserve typed values; new locale's strings render. (Same pattern as other ProfileTab fields — no special handling needed; React state persists across locale change.)
- **Wrong user (admin viewing someone else's profile)** — N/A; this section is in the user's own cabinet ProfileTab, not in admin user-edit. Admin user-edit screen has its own separate password-reset path (admin sends recovery email). Do NOT expose `changeCabinetPassword` to admin user-edit.
- **All locales loaded but new key missing** — defensive: i18n returns the key string itself; this fails the runtime locale check; Note 18 self-validation catches it.

Required investigation (paste outputs into the Task 273 session log):

1. Confirm the existing exports in `src/lib/auth/browser.ts`:
   ```
   grep -n "^export function" src/lib/auth/browser.ts
   ```

2. Confirm the existing exports in `src/components/ui/PasswordInput.tsx` + `PasswordRequirementsHint.tsx`:
   ```
   grep -n "^export" src/components/ui/PasswordInput.tsx src/components/ui/PasswordRequirementsHint.tsx
   ```
   Specifically confirm that `allPasswordRulesMet` is exported and consumable from a server action (it should be pure; if it has client-only imports, STOP & ASK for a refactor decision).

3. Confirm the existing cabinet server-side user resolution pattern:
   ```
   grep -n "getServerUser\|getServerSession\|createServerClient" src/modules/cabinet/actions/index.ts
   ```
   Use the SAME pattern as the existing cabinet actions in that file.

4. Confirm ProfileTab inventory (Note 20 before-state):
   ```
   grep -n "^\s*<\(Button\|Input\|Combobox\|Label\|Dialog\|Section\)" src/modules/cabinet/components/ProfileTab.tsx
   ```
   Paste the matched lines as the before-state control inventory.

5. Confirm the existing toast pattern in ProfileTab:
   ```
   grep -n "toast\." src/modules/cabinet/components/ProfileTab.tsx
   ```
   Use the same `sonner` toast API.

6. Confirm autocomplete attribute usage in ResetPasswordClient.tsx (the
   pattern this kickoff mirrors):
   ```
   grep -n "autoComplete" src/modules/auth/components/ResetPasswordClient.tsx
   ```

7. Confirm 4 locale files exist and have a `cabinet` namespace:
   ```
   grep -n "\"cabinet\":" messages/*.json
   ```

Scope (files Sonnet may touch):

1. `src/modules/cabinet/components/CabinetPasswordSection.tsx` — NEW file.
2. `src/modules/cabinet/components/ProfileTab.tsx` — import + render the new section (1-2 line change).
3. `src/modules/cabinet/actions/index.ts` — add `changeCabinetPassword` server action.
4. `messages/sq.json` + `messages/en.json` + `messages/uk.json` + `messages/it.json` — 11 new keys each, same key set.
5. `docs/backlog.md` — standard task-closure update (advance "Last task number" to 273; add Last Session note for Task 273; add Session Archive row).
6. `docs/sessions/2026-05-28-task-273-cabinet-password-change.md` — NEW session log per Task 264 contract.

Out of scope (do NOT touch):
- `<PasswordInput>` or `<PasswordRequirementsHint>` (Task 271 — keep as-is).
- `AuthSheet.tsx` (login/signup/forgot-password — unrelated).
- `ResetPasswordClient.tsx` (recovery flow — keep as-is).
- `src/lib/auth/browser.ts` (helpers — keep as-is; consume them as published).
- Admin user-edit screen (not a cabinet flow).
- Email templates (`PasswordChangedEmail.tsx` will land in Task 276, a separate kickoff).
- Supabase Dashboard toggles (owner action AFTER this task ships).
- Sidebar / CabinetShell (no new sidebar entry).
- Any other ProfileTab control (no refactor / cleanup).

Acceptance criteria (literal):
- `src/modules/cabinet/components/CabinetPasswordSection.tsx` exists, uses `<PasswordInput>` × 2 + `<PasswordRequirementsHint>` × 1, has 11 localized strings, follows the design pattern of `ResetPasswordClient.tsx`.
- `src/modules/cabinet/actions/index.ts` exports `changeCabinetPassword({ currentPassword, newPassword })` with the exact result-type union specified above; uses `signInWithPassword` to re-verify; calls `updateUser({ password })` on success; returns typed errors.
- `src/modules/cabinet/components/ProfileTab.tsx` renders `<CabinetPasswordSection />` between the existing profile fields and the delete-account section.
- Positive flow shippable end-to-end in `uk` at 320px: user types current + new (5/5 rules ✓) → submit → success toast → signOut('global') → redirect to login → re-login with new password works.
- EVERY negative branch listed above has a verifiable line in the diff (handler / guard / toast / early-return / locale key). Orchestrator review WILL reject if any branch is missing.
- 11 new locale keys × 4 locales = 44 entries; same key set in all 4 files; runtime-verified in `uk` (longest strings) and `sq` (canonical).
- Mobile usability at 320px in `uk`: both inputs reachable, eye toggle 44×44, submit button full-width, rule hint readable.
- All 7 breakpoints (320/375/390/768/1280/1440/2560) walked; no overflow, no clipping.
- Note 18 self-validation block in the session log: tsc=0 errors, AC table all green, runtime locale=uk PASS, scope=clean.
- Note 20 before/after control inventory of ProfileTab in the session log.
- Note 23 Edit-Flow Preservation: all 9 components verified (editable input × 2, validation, save, loading, success, error, persistence, i18n × 4, mobile at 320px in `uk`).
- "Files Changed" table per Task 264: lists exactly the 6 paths above (or 9 if locale files split).

Final report required from Sonnet:
1. Files Changed table.
2. Positive-flow runtime trace (screenshot or text walk).
3. Negative-flow audit: one row per branch listed above → file:line of the handler.
4. Locale-key parity audit: 11 keys × 4 locales = 44 entries; paste the per-file key counts.
5. Note 18 self-validation verdict line.
6. Note 20 ProfileTab before/after inventory.
7. Note 23 Edit-Flow Preservation 9-component checklist.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
modify Supabase Dashboard. Do NOT touch any out-of-scope file.
```
