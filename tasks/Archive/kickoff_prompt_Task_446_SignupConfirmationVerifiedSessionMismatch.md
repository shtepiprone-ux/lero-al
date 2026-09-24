# Task 446 — Signup confirmation lands on `/auth/verified` (success copy) but header stays unauthenticated — DIAGNOSE FIRST, then fix

> **Origin:** discovered during Task 439 final validation (self-delete → same-email re-signup). Re-registering with
> a reused email and clicking the **signup confirmation** email link lands the user on `/uk/auth/verified` showing
> success copy ("Email підтверджено… Тепер ви можете… користуватися всіма функціями"), **but the header still shows
> the unauthenticated state ("Увійти" / "Реєстрація").**
> **This is a NEW, distinct auth-lifecycle defect — NOT part of Task 439.** Task 439's core (recovery prefetch
> safety, dashboard recovery routing, reset submit, self-delete + email-reuse, login-bridge redirects) is already
> validated and closeable. Email reuse and signup confirmation **themselves succeed** — the defect is the
> session/header mismatch after confirmation.

> **🔴 DO NOT decide A vs B upfront (owner directive 2026-06-16).** Do **not** assume signup confirmation is meant to
> auto-login (A) or to verify-only (B). **First diagnose** whether the signup `/auth/confirm` path actually
> establishes a Supabase session/cookies after `verifyOtp`. Only then fix along the branch the evidence proves.

## Goal

Determine, with concrete runtime + code evidence, whether clicking the signup confirmation link establishes an
authenticated Supabase session, and why the header does not reflect it. Then apply the fix dictated by the evidence
(one of the three branches below). Add regression coverage so this exact mismatch cannot silently return.

## Pre-read (rule-index → Email/auth lifecycle + Regression/critical-flow; UI bundle only if the fix touches copy/CTA)

- **Always:** `docs/agent-contract.md` (esp. clauses 7, 11–12, 14, **15**), `docs/backlog.md`, `docs/critical-flow-registry.md` (P0 — Auth lifecycle; the new Signup-confirmation row).
- **Email/auth lifecycle:** `docs/env.md`, `docs/domain-rules.md`, `docs/qa-rules.md`, `docs/integrations.md` (Supabase Auth config); only-if-relevant: `docs/app-lifecycle-contract.md`, `docs/rls-rules.md`.
- **Regression/critical-flow:** `tasks/Epics/Epic_RS_Regression_Shield.md`, `docs/qa-rules.md` (test conventions).
- **Only if the fix is the copy/CTA branch (B):** `docs/ui-rules.md`, `docs/component-rules.md` (+ the Mobile <640 gate below).
- `docs/ai-behavior.md` → self-validation (Note 18), UX-flow preservation (Note 19).
- **Relevant code to inspect (not exhaustive):** `/auth/confirm` route, `/{locale}/auth/verified` page + its copy/CTA, the auth provider / header auth-state source (`AuthProvider` / `resolveSession` / `lib/auth/browser.ts`), and how `ResetPasswordClient` / the recovery work (Task 439) already established the session-on-gesture pattern for comparison.

## Phase 1 — REQUIRED diagnosis (report findings in the session log BEFORE writing any fix)

Run these exact checks and record the result of each (owner-specified):

1. After clicking the signup confirmation link and landing on `/uk/auth/verified`, **refresh the page** — does the header become authenticated after refresh?
2. State explicitly whether the header is authenticated **before** refresh vs **after** refresh.
3. Open `/uk/cabinet` immediately after confirmation (no manual login):
   - **cabinet opens** → a session exists → this is a **header / auth-provider sync** issue (Branch A);
   - **cabinet redirects to login** → **no session was established** (Branch B or C).
4. Inspect the `/auth/confirm` route: the `verifyOtp` response for `type=signup`, whether auth cookies are set on the response, and the redirect behavior (where it sends the user and with what session state).
5. Inspect the `/uk/auth/verified` page copy and its CTA expectations across **all 4 locales** (sq/en/uk/it) — does the copy promise "you can now use all features" while offering no login path?

Record, in the log, the **decisive finding**: does signup `/auth/confirm` establish a session/cookies, yes or no, with the evidence (check 3 + check 4).

## Phase 2 — Fix along the evidence-proven branch (implement ONLY the branch the diagnosis proves)

- **Branch A — session EXISTS but header doesn't reflect it (header/auth-provider sync bug).** Fix the auth state so the header/`AuthProvider` reflects the authenticated session after the confirm → verified redirect **without a manual refresh** (e.g. revalidate session / refresh router / re-sync the client auth context on the verified bridge, mirroring the pattern Task 439 used for the login bridge). The `/auth/verified` success copy stays; it must now be true.
- **Branch B — no session, and verify-only is the intended product behavior.** Correct the `/uk/auth/verified` copy in **all 4 locales** to "Email confirmed — now sign in" (do not claim the user is logged in / "can use all features"), and add a clear **Login CTA** that routes into the auth sheet/login bridge. No auto-login.
- **Branch C — no session, but the product expects auto-login.** Fix the signup `/auth/confirm` flow to establish the session (set cookies / complete the session) so the user is authenticated on landing, then ensure the header reflects it (as Branch A).

> If, after Phase 1, the correct branch is genuinely ambiguous (e.g. session is partially established, or the
> intended product behavior is unclear), **STOP and ASK the orchestrator/owner** — do not guess. Branch selection
> must be justified by the Phase-1 evidence in the session log.

## Positive flow (happy path)

- **Actor:** a user who just confirmed a (possibly reused) email via the signup confirmation link.
- **Steps:** click confirmation link → land on `/{locale}/auth/verified`.
- **Required after-behavior (per branch):**
  - Branch A/C: header shows authenticated state (avatar/account menu, not "Увійти"/"Реєстрація") **without manual refresh**; `/cabinet` is reachable without a login redirect.
  - Branch B: header correctly shows guest; the verified page copy says "Email confirmed — now sign in" and a Login CTA opens the auth flow; after login the user is authenticated.
- **Post-conditions:** no contradictory state (page never claims "you can use all features" while the user is a guest); `sq/en/uk/it` copy consistent with the actual session state.

## Negative flow (every off-happy-path branch)

- **Expired / already-used confirmation token** → localized error (4 locales) + a clear recovery CTA (resend confirmation or go to login); NOT a false "verified/success" state, NOT a silent dead-end.
- **Invalid / tampered token_hash** → localized error, no session established, no false success.
- **Confirm succeeds but session sync fails (Branch A/C edge):** the page must not show authenticated-success copy while the header is guest — show a deterministic state (either retry/refresh affordance or a Login CTA), with a locale key. No silent contradiction.
- **Locale mismatch:** the verified page and any CTA must render in the active locale; no `sq`-only fallback leaking into `uk`.
- **Double-click / re-open of an already-consumed link** → same expired/used handling, idempotent, no crash.
- **Cancel/leave:** navigating away from `/auth/verified` leaves the user in a consistent state (guest stays guest, authenticated stays authenticated), no spinner loop (cf. the Task 439 login-bridge spinner regression).

## 🔴 Mobile <640 full-width gate (ONLY if Branch B / any copy/CTA UI is touched — OWNER P0)

If the fix adds/changes a Login CTA or any control on `/auth/verified`: the CTA Button MUST be `max-sm:w-full`
(full-width edge-to-edge below 640), ≥44px touch target, labels wrap in sq/en/uk/it (no clip, no h-scroll at 320).
Any popup the CTA opens (auth sheet) must already follow the full-width bottom-sheet contract (clause 11). If the
fix is Branch A/C (no new UI control), state "no UI surface added — mobile gate N/A" explicitly. If a copy/CTA
pattern is ambiguous, STOP and ASK.

## 🔴 Regression coverage (agent-contract clause 15 — MANDATORY)

This task touches the **Signup confirmation** flow in `docs/critical-flow-registry.md` (P0 — Auth lifecycle).
- Establish/record the baseline: what coverage exists today (currently ❌ / pending Slice 2).
- Add (or, if Task 441 has landed, update) a regression test asserting: after signup confirmation, the resulting
  state is **consistent** — header authenticated iff a session exists, and the `/auth/verified` copy matches the
  session state (no "you can use all features" while guest). Cover the chosen branch's invariant + one failure path
  (expired/used token).
- The test must FAIL on a planted violation (e.g. force the verified page to claim success while the session is
  absent) — paste the FAIL transcript. A no-op gate is a task failure.
- Update the registry row's coverage status + command. **Do not close without automated proof the corrected
  behavior holds.** Coordinate with Task 441 (Slice 2 auth smoke) — this row may be consumed there, but the fix +
  its dedicated regression assertion live in this task.

## Out of scope

No redesign of the auth sheet / login flow beyond what the proven branch requires. No changes to Task 439's
recovery/self-delete/login-bridge code (validated, closed). No unrelated refactor. Do not implement two branches —
implement the one the diagnosis proves.

## Acceptance criteria

- **AC1** — Phase-1 diagnosis complete in the session log: all 5 owner checks answered with evidence; decisive finding (session established yes/no) stated with check-3 + check-4 evidence.
- **AC2** — Exactly ONE branch (A/B/C) implemented, justified by the AC1 evidence; branch choice cited in the log.
- **AC3** — Positive flow verified at runtime in `uk`: no contradiction between header state and `/auth/verified` copy; (A/C) header authenticated without manual refresh / (B) guest + working Login CTA.
- **AC4** — Every negative branch above has a verifiable handler/guard/locale key in the diff (expired/used token, invalid token, sync-fail, locale mismatch, double-click, cancel/no-spinner-loop).
- **AC5** — Locale parity: any new/changed string present in `sq/en/uk/it` (same key set), runtime-confirmed.
- **AC6** — (If UI/copy/CTA touched) Mobile <640 full-width gate satisfied with the rendered verification matrix (breakpoints × sq/en/uk/it, uk@320/375/390 mandatory); else explicit "no UI surface added — N/A".
- **AC7** — Regression test added/updated for the Signup-confirmation flow; planted-violation FAIL transcript present; `docs/critical-flow-registry.md` row updated (status + command).
- **AC8** — File-integrity (clause 14) green on every touched file; `npx tsc --noEmit` 0 errors; `npm run lint` 0 new; `npm run check:i18n` parity; `npm run build` if non-trivial.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run check:i18n`, the new/updated regression test, and (if UI) the
  responsive-screenshot matrix — all green, transcripts in the session log.
- Provide the session log under `docs/sessions/` with the AC-by-AC self-audit table (cite Positive + Negative
  flows by name) and a **"Files Changed" table** (one row per touched path + 1-line rationale).
- **Do NOT run git** — the orchestrator (Opus) reviews the real diff and emits the commit commands. The executor
  never runs `git add`/`git commit`.
