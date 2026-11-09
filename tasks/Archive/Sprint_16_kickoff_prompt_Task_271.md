# Sprint 16 — Task 271 kickoff (Password UX refactor: canonical `<PasswordInput>` + live requirements hint + drop confirm-password fields)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` task-type bundles — never "read all docs". No scope change; STOP & ASK if ambiguous; literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check in `uk` 320px). UI task → ×4 locales (sq/en/uk/it) AND 7 breakpoints (320/375/390/768/1280/1440/2560) REQUIRED. Owner runs git; executor never runs git.

> **Scope expansion notice (2026-05-28, owner directive):** the original Task 271
> scope was "add password hint UI". Owner expanded scope on 2026-05-28 to a coherent
> password UX refactor with three coupled changes — the canonical input primitive must
> land FIRST, then the hint is added on top, then confirm-fields are dropped across the
> diff. Splitting these would leave the codebase in an inconsistent state mid-task.
> Reference visual design: `tasks/Sprints/Sprint_16_task_271_password_design_reference.md`.

---

## Task 271 — Password UX refactor

```
Hard contract: see top.

Type:        feature + refactor (UI primitive)
Priority:    high (UX gap + global primitive consolidation)
Area:        auth / cabinet / shared UI primitives / i18n

GOAL: Three coupled UI changes across every password input in the project:

  (a) Add a CANONICAL `<PasswordInput>` primitive with a built-in show/hide-password
      eye toggle. Replace every direct `<Input type="password" />` usage in the project
      with `<PasswordInput>`. The eye toggle is a global UX win — it appears on login,
      signup, password-reset, cabinet password-change, and any other password field.

  (b) Add a `<PasswordRequirementsHint />` live indicator that renders below
      `<PasswordInput>` ONLY in CREATE / CHANGE / RESET contexts (signup, set-new-password,
      cabinet password-change). NOT on login (login does not teach rules). The hint shows
      the 5 rules from the Supabase Auth dashboard config with per-rule ✓ / ✗ live
      indicators that update as the user types.

  (c) DROP confirm-password fields wherever they exist today. The eye-toggle replaces
      the typo-prevention purpose of the confirm field. Owner directive 2026-05-28.

These three changes MUST land in the same diff. Shipping (a) without (b) leaves the hint
gap; shipping (b) without (a) means inconsistent password fields; shipping (a)+(b) without
(c) leaves the confirm field as a vestigial UX with no purpose.

The hint rules MUST match the Supabase dashboard config exactly. The canonical source is
`docs/integrations.md` → "Supabase Auth Configuration (Dashboard settings)". If the
dashboard config later drifts, this hint MUST be updated in the SAME diff as the toggle
flip — hint and dashboard config drift = task failure.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 — direct dependency of the
"Password requirements" dashboard flip to "lower+upper+digits+symbols (recommended)" the
same day. Scope expanded by owner directive same day (drop confirm-password +
global PasswordInput primitive).

Pre-read (UI / layout / component task bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/ui-rules.md        → typography, spacing, helper-text patterns, button/input rules,
                            icon size scale (h-3 / h-3.5 / h-4 / h-5 / h-6).
- docs/component-rules.md → reusable component standards; design-token usage; locale rules.
- docs/component-governance.md → canonical primitive vs shared-ui distinction;
                                 catalog rules.
- docs/governance-checklists.md → Checklist I (new shared component) — likely required.
- docs/qa-rules.md
- docs/integrations.md    → "Supabase Auth Configuration" — THE canonical rule source for
                            password requirements. The hint text MUST match this exactly.
- tasks/Sprints/Sprint_16_task_271_password_design_reference.md — VISUAL DESIGN REFERENCE
  (border states, icon choices, layout, special-character inline listing, eye-toggle
  position, CTA enable/disable). Read this BEFORE designing the component.
- docs/ai-behavior.md → Note 14 (Global Change Verification — applies because this is a
                        repo-wide migration), Note 19 (UX Flow Preservation), Note 20
                        (Existing-Control Preservation — the eye toggle is an ADDITION,
                        but ensure no existing controls are silently dropped).

Current behavior to preserve:
- Existing password input fields keep working: same name, same form integration, same
  Zod schema field, same Server Action signature.
- Existing validation messages keep working (Server Action error codes → toast via `t()`).
- Existing success state (toast, redirect, refresh) preserved.
- Existing form layout (label position, field order, button position) preserved except
  for: (i) confirm-password fields are removed, (ii) hint helper space appears below the
  password input on CREATE / CHANGE / RESET surfaces.
- Existing focus order: removing confirm-password collapses the tab sequence cleanly.
- Existing autocomplete attributes preserved (`new-password` / `current-password` etc.).

Required after behavior:
1. `<PasswordInput>` lives at `src/components/ui/PasswordInput.tsx` (canonical primitive).
   It wraps the existing canonical `<Input>` and adds:
   - `type` toggle between `"password"` (default) and `"text"`.
   - Right-side eye / eye-off button (`Eye` / `EyeOff` from lucide-react).
   - `aria-label` on the toggle button (localized ×4).
   - 44×44 px touch target on the toggle button per `ui-rules.md`.
   - Inherits all existing `<Input>` props (forwardRef, className, value, onChange, etc.).
2. `<PasswordRequirementsHint />` lives at `src/components/ui/PasswordRequirementsHint.tsx`
   (or `src/components/auth/` if the catalog flags it as `shared-ui` not `canonical-primitive`
   — STOP & ASK if the catalog disagrees). It accepts the current input value as a prop
   and renders 5 rule rows with live ✓ / ✗ indicators per the design reference.
3. Every existing `<Input type="password" ... />` in `src/` is replaced with
   `<PasswordInput ... />`. Verified via repo-wide grep: `grep -rn 'type="password"' src/`
   returns ONLY the line inside `PasswordInput.tsx` after the diff.
4. Every existing confirm-password field is removed:
   - Form field removed from the form component.
   - Zod schema's confirm-password key and refinement removed.
   - Server Action's expected payload trimmed if it ever accepted the confirm field.
   - Locale strings for the confirm-field label / error tied only to it are removed from
     all 4 locale files.
5. `<PasswordRequirementsHint />` is rendered below `<PasswordInput>` on:
   - Signup form
   - Password-reset (set-new-password) form
   - Cabinet password-change form
   - Any admin form that CREATES a user with a password (if present — verify via grep).
   NOT rendered on:
   - Login form (no rule teaching needed)
   - Any auth flow that does not create/change/reset a password.
6. Submit button enable / disable state follows the design reference: disabled while ≥1
   rule unmet, enabled when all rules pass (plus any other form-field requirements).
7. ×4 locales for every new string (5 rule labels, 1 helper error message, 2 eye-toggle
   aria-labels = 8 keys total minimum), all four files in same key set, runtime verified.
8. Input border color states (neutral / coral on invalid / green on all-met) follow the
   design reference using existing design tokens — no hardcoded hex.

Positive flow (happy path):
- New user opens signup → focuses password input → sees the 5-rule list with all rows
  in muted/unmet state.
- User types `Sample123!` → as each rule is met, its row flips to ✓ in success color;
  input border turns green; CTA button enables → user submits → existing signup flow
  proceeds.
- Same on set-new-password and cabinet password-change.
- User clicks the eye icon → password unmasks → clicks again → re-masks. The hint list
  is unaffected by the mask state.
- On login: user sees `<PasswordInput>` with eye toggle but NO hint (login is not a
  CREATE flow). Login flow proceeds unchanged.
- All four locales (sq / en / uk / it) render translated rule labels and the eye-toggle
  aria-label correctly when switching locale.

Negative flow (every off-happy-path branch):
- **User pastes a non-compliant password** (e.g. `password`) → some rules show ✗, input
  border coral, helper error text visible, CTA disabled. Server-side reject never
  reached (client-side blocks first).
- **User types compliant password then deletes characters** → rules flip back to unmet
  live; border state and CTA state re-update.
- **Eye-toggle click while submit is in flight** → does not interfere with submission;
  toggle and submit are independent.
- **Browser autofill / password manager fills the field** → `onChange` fires → hint
  updates live to reflect the autofilled value.
- **Locale switch on the page** (Header LocaleSwitcher) → rule labels + eye aria-label
  re-render in the new locale immediately. The special-character parenthetical
  `(!@#$%*=)` stays literal in all locales.
- **320 px in `uk`** (longest strings) → rule rows wrap to a second line gracefully
  without truncation; CTA stays above the fold; eye icon stays inside the input border.
- **2560 px** → form column stays at canonical max-width; input does not stretch the
  whole viewport.
- **Server-side reject after client-side passes** (e.g. future HIBP toggle catches a
  leaked compliant password) → existing error toast still fires; hint stays visible
  alongside the toast.
- **Cabinet password-change flow** specifically: existing rate-limit / wrong-current-password
  / network error states are preserved. The hint is helper-only and does not block
  submission for non-rule-related errors.
- **Admin create-user flow** (if present) — same hint behavior; the admin role context
  does not change the rule set (Supabase enforces the same rules globally).
- **Confirm-password removal regression** — if any existing flow relied on the
  confirm-password value (e.g. compared it server-side), STOP & ASK; do not silently
  drop the comparison. The eye-toggle is the typo-prevention mechanism; no server-side
  comparison is required.
- **Existing tests / Storybook stories** that reference the old `<Input type="password" />`
  pattern — update or remove per Note 14 (Global Change Verification). Do not leave
  test files calling a removed prop / a removed confirm field.

Required investigation (paste outputs into the session log):

1. Inventory every password input across `src/`:
   ```
   grep -rn 'type="password"' src/
   grep -rn "<PasswordInput" src/                    (sanity check: 0 before, ≥1 after)
   grep -rn "<Input[^>]*type={['\"]password['\"]}" src/
   ```
   Build a table in the session log:

   | File path | Surface (signup / login / reset / cabinet / admin / other) | Has confirm field? | Has show/hide? | Has hint today? |
   |---|---|---|---|---|

2. Inventory every confirm-password field:
   ```
   grep -rn "confirmPassword\|confirm_password\|passwordConfirm" src/
   grep -rn "password.*confirm\|confirm.*password" messages/
   ```
   For each, identify: the form component, the Zod schema, the Server Action payload,
   the locale keys tied to the confirm field. Document in the session log under
   "Confirm-password removal inventory".

3. Inventory existing canonical primitive: read `src/components/ui/input.tsx`. Confirm
   it supports `ref`, `className`, and the standard `<input>` props. `<PasswordInput>`
   wraps it — do NOT duplicate input styling logic inside `<PasswordInput>`.

4. Inventory existing auth i18n namespace + keys:
   ```
   grep -rn "useTranslations('auth')" src/
   grep -rn "useTranslations('cabinet')" src/
   ```
   Decide the canonical namespace for the new keys. The 5 rules likely belong under
   `auth.password_rule_*` (or a single multi-line `auth.password_rules`). The eye-toggle
   labels likely belong under `common.show_password` / `common.hide_password` since the
   eye is shared across surfaces. STOP & ASK if existing keys conflict.

5. Decide component category (canonical-primitive vs shared-ui) per
   `component-governance.md`. Run `npm run governance:components` and
   `npm run catalog:components` before AND after the diff per `ai-behavior.md` →
   "Component Catalog Rules". A new canonical primitive requires a Storybook story
   (`PasswordInput.stories.tsx`) per "Storybook Anti-Patterns".

6. Verify Supabase password rules in `docs/integrations.md` → "Supabase Auth Configuration"
   match the planned hint rules exactly. Paste the table snippet into the session log
   for the AC self-audit.

Scope (files Sonnet may touch):
1. New primitive: `src/components/ui/PasswordInput.tsx`.
2. New primitive: `src/components/ui/PasswordRequirementsHint.tsx` (or shared-ui location
   per investigation §5).
3. Storybook story for PasswordInput (and PasswordRequirementsHint if catalog requires).
4. Every file from investigation §1 — replace `<Input type="password" />` with
   `<PasswordInput>`.
5. Every file from investigation §2 — remove confirm-password field, refactor Zod schema,
   refactor Server Action payload if needed, remove orphan locale keys.
6. Add `<PasswordRequirementsHint>` below `<PasswordInput>` on the CREATE / CHANGE /
   RESET surfaces only (signup / set-new-password / cabinet password-change / admin
   create-user if present). NOT on login.
7. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`:
   - Add 5 rule keys (or 1 multi-line key — decide based on existing pattern in §4).
   - Add 1 helper error message key.
   - Add 2 eye-toggle aria-label keys.
   - Remove any confirm-password-specific keys identified in §2.
8. `docs/component-catalog.md` updated via `npm run catalog:components`.
9. `docs/sessions/2026-05-2N-task-271-password-ux-refactor.md` — session log per Task 264
   + Note 18 + Note 14 (global change verification).
10. `docs/backlog.md` — advance "Last task number" to 271; record completion in Sprint 16
    section.

Out of scope (do NOT touch):
- Supabase Auth dashboard config (`integrations.md` table is canonical; do not modify it).
- Password strength meter (zxcvbn-style score) — not requested.
- Captcha integration (separate Sprint 16 candidate task, not filed yet).
- Cabinet reauth form for password change (separate Sprint 16 candidate task, not filed
  yet). Specifically: do NOT add a "current password" input on the cabinet password-change
  form in this task — that is the reauth task's surface.
- HIBP integration / leaked-password client-side check.
- Changing password Zod schema beyond what's needed to: (i) remove confirm-password
  refinement, (ii) match the 5 rules in the hint exactly (if the existing schema is
  looser than the hint, tighten it to match; if stricter, STOP & ASK before loosening).
- The forgot-password REQUEST-LINK form (email-only, no password input) — no hint, no
  eye-toggle on that surface.
- Any unrelated UI cleanup on the affected forms — scope discipline (Note 14 means update
  CONSUMERS, not unrelated polish).
- Any change to login Server Action behavior beyond replacing the input primitive.

Acceptance criteria (literal):
- Investigation §1–§6 complete; outputs in session log.
- `<PasswordInput>` primitive created with eye toggle (44×44 hit target, localized
  aria-label, lucide icons, integrates with existing `<Input>` styling).
- `<PasswordRequirementsHint>` primitive created with 5 live indicators matching design
  reference + dashboard config exactly.
- Every `<Input type="password" />` in `src/` migrated to `<PasswordInput>`. AFTER-grep
  `grep -rn 'type="password"' src/` returns ONLY `PasswordInput.tsx`.
- Every confirm-password field removed (form / schema / Server Action / locale keys);
  AFTER-grep `grep -rn "confirmPassword\|confirm_password\|passwordConfirm" src/`
  returns 0 hits.
- `<PasswordRequirementsHint>` rendered on signup + set-new-password + cabinet
  password-change (+ admin create-user if present); NOT rendered on login or
  forgot-password REQUEST-LINK form.
- CTA disabled state wired up: disabled while ≥1 rule unmet on CREATE / CHANGE / RESET
  surfaces.
- ×4 locale keys added in same key set; runtime locale switching visually confirmed in
  `uk` (longest strings).
- 7 breakpoints render correctly (320 / 375 / 390 / 768 / 1280 / 1440 / 2560). Special
  attention at 320 in `uk`: rule rows wrap gracefully, eye icon inside input, CTA above
  the fold.
- Storybook story for `<PasswordInput>` (and `<PasswordRequirementsHint>` if applicable)
  added per Checklist I.
- Catalog updated (`npm run catalog:components` clean; no new MANUAL_REVIEW flags).
- `npm run governance:components` clean.
- `npm run governance:tailwind` clean.
- AC self-audit table per Note 18.
- "Files Changed" table per Task 264 (expected to be sizable — likely 15–30 files given
  the global migration).
- 0 new lint / typecheck errors. `npm run build` passes.
- `npx tsc --noEmit` → 0 errors.
- `docs/backlog.md` updated.
- Self-validation verdict line:
  `Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS · scope=clean`

Final report required from Sonnet:
1. Files changed (the table — sizable).
2. Surface inventory (§1).
3. Confirm-password removal inventory (§2).
4. Component-category decision (§5) with catalog evidence.
5. Locale namespace decision (§4) with grep evidence.
6. Dashboard config snapshot (§6) confirming hint matches.
7. 7-breakpoint runtime evidence per surface (or per representative surface if the
   pattern is identical) — screenshots OR explicit pass/fail per breakpoint.
8. ×4 locale runtime evidence (`uk` at 320 px is the critical case).
9. AFTER-grep evidence: `grep -rn 'type="password"' src/` returns only `PasswordInput.tsx`;
   `grep -rn "confirmPassword..." src/` returns 0 hits.
10. Confirmation that Supabase Auth dashboard config was NOT modified.
11. Self-validation verdict line.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. The orchestrator will emit
commit commands during review.
```
