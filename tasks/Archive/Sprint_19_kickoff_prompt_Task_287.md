# Sprint 19 — Task 287 kickoff (Promote user email into the profile identity card)

> **Mandatory rules:** `docs/agent-contract.md` clause 6a (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator emits explicit-path commits; owner runs them).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **profile / edit-flow** task — pre-read that bundle from `docs/rule-index.md` (`ui-rules.md`, `component-rules.md`, `qa-rules.md`, `ai-behavior.md` Note 23 Edit-Flow Preservation). No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

---

```
Type:        UX (identity surfacing) — small, isolated
Priority:    MEDIUM
Area:        cabinet profile — identity card header
```

## Why this task exists
`src/modules/cabinet/components/ProfileTab.tsx` already receives an `email` prop and already has a
full email-change flow (the `email_current_label` block + `initiateEmailChange` /
`resendEmailVerification` / `pending_email` handling lower in the form). What is missing: the user's
email is NOT shown in the **identity card header** (the avatar + name block at the top of the
profile). The owner wants email promoted into that identity card so the user sees their account
identity (avatar, name, email) together at a glance.

## Goal
Display the user's current email (read-only) in the profile identity-card header, next to / under
the name, using the existing `email` prop. This is a **read-only display** in the header — the
EDITABLE email-change control stays exactly where it is today (Note 23: read-only display is fine
because the editable control remains reachable in the same screen). Do NOT duplicate or move the
email-change flow.

## Current behavior to preserve (Note 23)
- The existing email-change section (`email_current_label`, change form, `pending_email` banner,
  resend verification) stays 100% intact and in place — this task does not touch its logic.
- Avatar upload/change (`AdminUserAvatar` / `onAvatarChange`), name editing, phone, location,
  currency, password section, delete-account — all unchanged.
- If `email` is null/undefined (edge case), the identity card must not render an empty/broken line.

## Positive flow (happy path)
User opens `/[locale]/cabinet` → Profile tab. The identity card header shows: avatar, display name,
and **email** (read-only, e.g. a muted line under the name). Scrolling down, the existing
email-change control still works (change → verification email → `pending_email` banner).

## Negative flow (implement + verify each)
- **No email present** (`email` null) → the email line is omitted entirely (no empty label, no "null").
- **Pending email change active** → the identity card shows the CURRENT (verified) email; the
  pending-change banner remains the source of truth for the in-progress change (do not show the
  unverified pending address as the identity).
- **Long email + long `uk` name at 320px** → wraps/truncates gracefully per the no-ellipsis rule
  (do NOT add `truncate` to the email if it hides information; allow wrap). Verify 320/375/390.
- **Locale switch** → any new label (e.g. an "Email" caption if added) is localized in all four files.

## Required investigation (PASTE in the session log)
```
sed -n '320,360p' src/modules/cabinet/components/ProfileTab.tsx     # the identity header + existing email block
grep -n "email\|AdminUserAvatar\|identity\|name" src/modules/cabinet/components/ProfileTab.tsx
grep -rn "email_label\|email_current_label" messages/sq.json messages/en.json messages/uk.json messages/it.json
```
Identify the exact header JSX block (avatar + name) to add the email line to, and confirm whether a
new locale key is needed (reuse `email_label` / an existing key if suitable; add a key in all four
files only if none fits).

## Scope (files Sonnet may touch)
- `src/modules/cabinet/components/ProfileTab.tsx` (add read-only email to the identity header).
- `messages/{sq,en,uk,it}.json` — ONLY if a new label key is required (all four, same key set).
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-287-profile-email-identity.md` (NEW).

## Out of scope (do NOT touch)
- The email-change flow logic / server actions (`initiateEmailChange`, `resendEmailVerification`).
- Avatar, name, phone, location, currency, password, delete-account controls.
- Admin user profile (`AdminUserProfile.tsx`) — this task is the cabinet self-profile only.
- Any redesign beyond adding the email line to the identity card.

## Acceptance criteria (literal)
- The profile identity card header shows the user's current email (read-only) when present; omitted cleanly when absent.
- The existing email-change control + pending-email banner are unchanged and still reachable on the same screen (Note 23).
- Any new label is localized in sq/en/uk/it (same key set); no hardcoded text.
- Renders correctly at 320/375/390/768/1280/1440/2560 in `uk` (long email + long name wrap, no ellipsis hiding the address).
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0 new vs baseline.
- Note 18 self-validation + AC self-audit + "Files Changed" table (Task 264) in the session log.
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · email in identity card · change-flow intact · locales=4 · breakpoints=7 · scope=clean · PASS`.

## Final report required
1. Files Changed table. 2. Where the email line was added (file:line). 3. Confirmation email-change flow untouched + still reachable. 4. New locale keys (if any) ×4. 5. Null-email + pending-email behavior. 6. Breakpoint/locale verification.

Do NOT emit git commands. Do NOT run git. Do NOT touch the email-change logic or admin profile. STOP & ASK if the identity-card structure is unclear.
