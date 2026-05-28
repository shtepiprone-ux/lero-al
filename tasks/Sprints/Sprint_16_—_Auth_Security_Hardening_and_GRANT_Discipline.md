# Sprint 16 — Auth Security Hardening + Public Schema GRANT Discipline

> **Filed by:** Orchestrator (Opus 4.7) on 2026-05-28 — follow-on to Task 271
> (Password UX refactor) and Task 272 (doc-gap closure). Sprint 16 already
> shipped Tasks 271–272; this plan extends the sprint to 6 tasks total by
> adding Tasks 273–276.

## Sprint goal

Close the **frontend security gaps** that currently block the remaining
Supabase Dashboard hardening toggles (per `docs/integrations.md` →
"Supabase Auth Configuration") AND close the **Public Schema GRANT
Discipline** audit deadline (per `docs/rls-rules.md` →
"Public Schema GRANT Discipline" — Supabase enforces on 2026-10-30).

Each frontend task lands the UI surface that unblocks a specific dashboard
toggle. The owner flips the toggle in the dashboard AFTER the corresponding
task ships (and updates the integrations.md table in the same commit per
the "Maintenance rules" subsection of that table).

| # | Task | Frontend surface | Unblocks dashboard toggle |
|---|---|---|---|
| 271 | Password UX refactor | `<PasswordInput>` + `<PasswordRequirementsHint>` (every password field in repo) | "Password requirements: lowercase+uppercase+digits+symbols" ✅ already flipped |
| 272 | Task 268 doc-gap closure | docs only (`rls-rules.md` Option B sub-rationale + session-log SQL final language) | n/a — pure doc hygiene |
| **273** | **Cabinet reauth password change** | New password-change form in `ProfileTab` (cabinet) with `current_password` + `new_password` fields; `signInWithPassword` re-verify before `updateUser({ password })` | "Secure password change" + "Require current password when updating" |
| **274** | **Captcha integration (Cloudflare Turnstile)** | Turnstile widget on signup (`AuthSheet` register flow) + password-reset request (`AuthSheet` forgot-password flow); server-side verification | "Captcha protection" |
| **275** | **Public Schema GRANT Discipline audit (existing tables)** | SQL emission only (no `src/` change): audit every `public.*` table for the GRANT pattern in `rls-rules.md` → "Per-role GRANT discipline"; emit `REVOKE` / `GRANT` adjustments for tables that should be RPC/view-only or that are missing necessary GRANTs | n/a — closes deadline 2026-10-30 |
| **276** | **Password-change notification email** | New `PasswordChangedEmail.tsx` template (sq-only per Task 251); wired into both successful password-change paths (cabinet — Task 273, and reset-password — `ResetPasswordClient.tsx`) | n/a — security best-practice signal to user when their password changes |

## Run order

Independent tasks can run in parallel. Frontend tasks have **owner-action
follow-throughs** (toggle flips and SQL applications) that the owner can
schedule against the Sonnet execution wall-clock.

**Order recommendation for the executor batch:**

1. **Task 275 (SQL audit, no `src/`)** — runs first. Pure investigation +
   SQL emission. Owner can review and apply the emitted SQL in the
   dashboard at their own pace. Does not block any other task.
2. **Task 273 (Cabinet reauth)** — depends only on the existing
   `<PasswordInput>` + `<PasswordRequirementsHint>` primitives (already
   shipped in Task 271). Independent of 274, 275, 276.
3. **Task 276 (Password-change notification email)** — depends on the
   completion of Task 273 to know the cabinet integration point (the new
   `changeCabinetPassword` server action). May run after 273 ships, OR
   in parallel if Sonnet stubs the integration site and Task 273 wires it
   in. Run **after 273** for simplicity — no stubs.
4. **Task 274 (Captcha)** — independent of 273/275/276. Touches
   `AuthSheet.tsx` (signup form + forgot-password form) + server-side
   verification + env config. Run after Sonnet has cleared the password
   work so the Auth surface isn't being co-edited.

If Sonnet has spare cycles between 273 and 274, it can pick up 276 in
between (it's the smallest scope).

## Owner actions (after each task ships)

| After task | Owner action | Where |
|---|---|---|
| 273 | Flip "Secure password change" + "Require current password when updating" → ON in Supabase Dashboard → Authentication → Sign In / Providers. Update `docs/integrations.md` → "Supabase Auth Configuration" table cells from "OFF (interim)" → "ON". | Dashboard + `docs/integrations.md` row update (same commit). |
| 274 | Set env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` in Vercel/Cloudflare environment variables. Flip "Captcha protection" → ON in Supabase Dashboard. Update `docs/integrations.md` table cell. | Vercel/Cloudflare env panel + Supabase Dashboard + `docs/integrations.md`. |
| 275 | Apply the emitted SQL in Supabase SQL editor (one statement at a time, in the documented order). Re-run `npm run check:schema-drift` to confirm 0 rows post-apply. | Supabase SQL editor + drift check. |
| 276 | None (sq-only email template auto-wired through `send.ts` and existing Resend domain). Optionally verify by triggering a password reset on staging and confirming the new "your password was changed" email arrives. | Local/staging smoke test. |

## Governance gates (apply to every kickoff in this sprint)

Each kickoff includes the standard P0 contract (`docs/agent-contract.md`):

- **Clause 6a** — Positive flow + Negative flow MUST both be implemented; orchestrator rejects on review if any negative branch from the kickoff is missing in the diff.
- **Clause 10** — Sonnet writes a "Files Changed" table in the session log; **the orchestrator** (Opus) emits commit commands during review.
- **Note 14 (Global Change)** — any change to a shared primitive must update all consumers (e.g. Task 274 captcha hook applies to every captcha-protected endpoint, not just one).
- **Note 18 (Pre-Completion Self-Validation)** — `tsc=0`, AC-by-AC table, runtime walk at `uk` 320px, scope=clean.
- **Note 19 (UX Flow Preservation)** — entry points, sibling controls, every empty/loading/error/success/cancel state preserved.
- **Note 20 (Existing-Control Preservation)** — no silent control removal; before/after inventory for any surface touched.
- **Note 21 (Control Relocation)** — applies to Task 273 (the cabinet password-change form is a NEW editable control, not a relocation, but the rule guards against accidentally removing the recovery-flow path).
- **Note 23 (Edit-Flow Preservation)** — applies to Task 273 (cabinet password-change is an edit flow; validation + save + loading + success + error + persistence + i18n + mobile all required).

## Out of scope for Sprint 16

- **HIBP "Prevent use of leaked passwords"** — owner-action only (re-verify Free-tier availability; no Sonnet kickoff needed). Tracked under `docs/backlog.md` → "Pending Action Items".
- **Sprint 16 product-UX candidates** (W.4, Z.1, CC.2, BB.2, Y.2-Y.3, DD.1): explicitly deferred to **Sprint 17**. This sprint is intentionally security-themed.
- **Refactor of `<ReauthEmail>` template** — only relevant if we switch from the `signInWithPassword`-verify approach to the Supabase `reauthenticate()` nonce flow. Task 273 chooses the simpler `signInWithPassword`-verify path (see Task 273 kickoff "Strategy decision" section). `<ReauthEmail>` stays in place for the Supabase Send Email Hook contract.

## Sprint exit criteria

- 4/4 tasks (273-276) shipped + orchestrator-approved on diff.
- Supabase Dashboard toggles flipped: "Secure password change" + "Require current password when updating" + "Captcha protection" → ON.
- `docs/integrations.md` → "Supabase Auth Configuration" table updated to reflect the new toggle states.
- `docs/rls-rules.md` → "Public Schema GRANT Discipline" deadline cleared (audit run + SQL applied + drift check 0 rows).
- `docs/backlog.md` updated with closure rows for 273-276 and Sprint 16 marked CLOSED ✅.

## File index

- Kickoffs (one file per task, per orchestrator hand-off rule):
  - `tasks/Sprints/Sprint_16_kickoff_prompt_Task_273.md`
  - `tasks/Sprints/Sprint_16_kickoff_prompt_Task_274.md`
  - `tasks/Sprints/Sprint_16_kickoff_prompt_Task_275.md`
  - `tasks/Sprints/Sprint_16_kickoff_prompt_Task_276.md`
- Already shipped:
  - `tasks/Sprints/Sprint_16_kickoff_prompt_Task_271.md` ✅
  - `tasks/Sprints/Sprint_16_kickoff_prompt_Task_272.md` ✅
  - `tasks/Sprints/Sprint_16_task_271_password_design_reference.md` ✅
