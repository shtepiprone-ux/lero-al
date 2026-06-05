# Epic II — Task 318 kickoff — Notification locale-binding AUDIT (audit/spec only, ZERO product code)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** Conforms to the
> current P0 contract. **AUDIT-ONLY: produces documentation, NO product-code changes.** Re-issue of
> `tasks/Sprints/Sprint_24_kickoff_prompt_Task_318.md`. Surfaces the root cause of the "Скарга на ваш аккаунт"
> Ukrainian-in-sq notification bug. Parallel-safe with Task 316.

```
Type:        audit / spec (no product code)
Priority:    high (Epic II Phase 1 — live wrong-locale defect)
Area:        notification creation → storage → delivery → render paths
Output:      docs/governance-reports/2026-06-XX-notification-locale-audit.md (NEW) — per-path locale-binding map + fix recommendations
```

## Goal
Map every notification path (which DB rows / which actions / which producers emit notifications) and document, for each,
**where the locale is bound** (creation time vs delivery time vs render time) and **whose** locale is used (actor vs
recipient). Identify the root cause of the wrong-locale bug — most likely a notification rendered with the **actor's**
locale (or a cached/default-fallback) instead of the **recipient's** preferred locale. Recommend the fix (implemented
later in Task 319). NO code changes here.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "DB / server action / RLS task" (read-only here) + `docs/ai-behavior.md` i18n rules +
   `docs/state-authority.md` (locale binding vs SSR/render) + `docs/qa-rules.md`.
3. `tasks/Epics/Epic_II_Global_i18n_Hardening.md` (Task 318 spec) + Task 288 (static hardcode) + Task 300 (admin support
   raw-key hotfix) session logs.
4. Read (do NOT edit): the notification module (`src/modules/notifications/*`), `NotificationItem` render component, the
   notification creation server actions, any notification email senders, the `messages/*.json` notification namespace,
   and the DB `notifications` table shape (is there a recipient-locale column?).

## Required investigation
1. Inventory every notification producer (action/queue) → which `notifications` rows it writes.
2. For each path, document: is the visible text stored at creation (frozen string — wrong-locale risk) or a key resolved
   at render? Whose locale resolves it — actor or recipient? Is there caching/default fallback?
3. Reproduce/trace the specific bug: sq recipient seeing uk text ("Скарга на ваш аккаунт…") — pin the exact mechanism.
4. Note whether a `recipient_locale` column (or a recipient-preference lookup at render) is required for the fix.
5. Produce the per-path locale-binding map + concrete fix recommendation (render-time localisation using the recipient's
   preferred locale; key-based storage, not frozen strings).

## Acceptance criteria
- `docs/governance-reports/2026-06-XX-notification-locale-audit.md` exists with: per-path producer→row map, the
  locale-binding point per path (creation/delivery/render + actor-vs-recipient), the root-cause of the wrong-locale bug,
  and the recommended Task 319 fix (incl. any DB column / RLS implication, with proposed EXACT SQL the owner would run —
  but NOT executed here).
- **ZERO product-code changes** (`git diff --stat src messages scripts` empty).
- Clauses 11/12/13 **N/A** (no UI render/story) — state explicitly in the session log.
- `docs/backlog.md` + session log updated; **Files Changed table** (audit doc + session log + backlog); **no git from executor**.

## Out of scope
- Implementing the fix (Task 319). Touching notification render/creation code. Dynamic-key enumeration (Task 316).
- Email template correctness (Task 321). Toast/modal i18n (Task 322).
