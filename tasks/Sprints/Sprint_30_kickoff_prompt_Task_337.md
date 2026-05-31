# Sprint 30 — Task 337 kickoff (Sonnet) — Delete-account warning copy clarity (GATED on Task 336 MVP)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 5, 6, 6a, 7, 8, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. Sonnet MUST NOT run git.
>
> **Numbering:** Task 337 = fourth direct Sonnet task in Sprint 30 (renumbered from old "336"). **Wave 1a — GATED on Task 336 MVP**. NOT parallel-safe with Wave 1 (330 / 334 / 335).
>
> **🚨 GATED on Task 336 MVP:** if Task 336's MVP Sonnet sub-task has not yet shipped + aligned backend behavior with the new copy, Task 337 STOPS and waits. If backend is soft-delete / archive / partial-retention (NOT true permanent deletion), Task 337 reports the mismatch and waits for Task 336 to align OR the owner to provide updated truthful copy.
>
> **Source:** `issues.md` 2026-05-31 — "Clarify irreversible account deletion warning copy and confirmation UX".

```
Type:     UX copy / safety / localization
Priority: medium
Area:     src/modules/cabinet/components/ProfileTab.tsx (delete-account warning section)
          Possible confirmation modal/dialog (find via grep)
          messages/{sq,en,uk,it}.json — cabinet.delete_account_*
```

## Pre-read

1. `docs/agent-contract.md`, `docs/backlog.md`
2. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
3. `docs/ai-behavior.md` → Localization (i18n) Rules + Notes 19 / 20 / 23
4. `tasks/Sprints/Sprint_30_kickoff_prompt_Task_336.md` (the architecture that GATES this task)
5. `docs/account-deletion-and-mailing-contacts-architecture.md` (if Task 336 has produced it — read; this is the contract that defines truthful copy)
6. `src/modules/cabinet/components/ProfileTab.tsx`
7. `src/modules/cabinet/actions/index.ts` (deletion server action — verify actual behavior)
8. `messages/{sq,en,uk,it}.json` — `cabinet.delete_*`

## Owner-reported problem

Current Ukrainian copy: «Видалити акаунт. Ця дія незворотна. Усі ваші оголошення буде заархівовано, і вас буде виведено з системи.»

Ambiguous — does NOT explicitly say account data itself is permanently deleted + non-recoverable.

Owner wants explicit irreversible wording.

## STOP & ASK gate (CRITICAL — do NOT skip)

Before changing ANY copy, Sonnet MUST:
1. Read `tasks/Sprints/Sprint_30_kickoff_prompt_Task_336.md`.
2. Confirm `docs/account-deletion-and-mailing-contacts-architecture.md` exists. If NOT → STOP; wait for Task 336.
3. Verify Task 336 MVP Sonnet sub-task has shipped + backend lifecycle aligns with the new copy.
4. Inspect actual deletion server action and determine truthful behavior (hard delete? soft delete? anonymized? partial retention?).

If actual behavior ≠ owner-requested wording → STOP & REPORT to orchestrator: current backend behavior, current UI copy, recommended accurate wording, files inspected, **no code changes** until mismatch resolved.

## Required after behavior

User opens `/cabinet` → profile → scrolls to delete-account section. Reads truthful copy that accurately describes what happens. Existing confirmation flow (if any) presents matching truthful copy. Destructive button still triggers existing server action.

## Current behavior to preserve (Notes 19 / 20)

- Existing entry point (button) at bottom of `ProfileTab.tsx`.
- Visual distinction as dangerous action (destructive variant / color).
- Existing confirmation flow if any modal exists.
- Existing deletion server action UNCHANGED.
- Listing archive behavior UNCHANGED.
- Auth / session behavior UNCHANGED.
- Password change section above UNCHANGED.
- All other profile fields UNCHANGED.

## Positive flow (happy path) — assuming Task 336 MVP shipped + backend = "permanent deletion + listing archive + session ended"

1. User opens `/cabinet` → profile tab.
2. Scrolls to delete-account section.
3. Reads truthful Ukrainian copy:
   - Title: «Видалити акаунт»
   - Description: «Ця дія незворотна. Ваш акаунт і пов'язані з ним дані буде видалено назавжди без можливості відновлення. Усі ваші оголошення буде заархівовано, а вас буде виведено з системи.»
   - Button: «Видалити акаунт»
4. Equivalent truthful copy in sq/en/it (Sonnet produces semantically equivalent translations using existing namespace pattern).
5. If confirmation modal exists, opens with matching truthful copy:
   - Modal title: «Підтвердьте видалення акаунта»
   - Modal description: «Після видалення акаунта відновити його буде неможливо. Ваші дані буде видалено назавжди, усі оголошення буде заархівовано, а активну сесію буде завершено.»
   - Primary destructive: «Так, видалити акаунт назавжди»
   - Cancel: «Скасувати»
6. Cancel → modal closes; no action taken.
7. Primary destructive → existing server action runs (Task 336 MVP behavior); listing archived; auth+profile removed; session ended; redirect per existing pattern.

## Negative flow (every off-happy-path branch)

| Branch | Trigger | Expected response | What is NOT done | Locale key |
|---|---|---|---|---|
| Task 336 MVP not shipped | Gate check fails | **STOP — report mismatch to orchestrator** | No code changes | n/a |
| Backend ≠ copy (e.g. soft-delete) | Investigation reveals retention | **STOP — report; do NOT ship false copy** | No code changes | n/a |
| Confirmation modal does not exist | Task 336 MVP did not add one | Update warning text only; document "add modal" as recommended follow-up | Do NOT invent new modal in this task | n/a |
| Cancel action | User dismisses modal via Esc / backdrop / Cancel button | Modal closes; user stays in profile; no server call | No DB write | existing cancel keys |
| Server 500 on delete | After confirm | Existing toast / error handling | No copy change | existing |
| Long string overflow at 320px in `uk` | Truthful description longer than current | Layout reflows; no horizontal scroll; warning stays readable | NO truncate; NO `whitespace-nowrap` | visual only |
| Long string at 320px in `it` (typically longest) | Italian copy expansion | Reflow; modal footer not clipped | NO ellipsis | visual only |
| Locale switch mid-page | User toggles locale | New copy renders in target locale immediately | n/a | n/a |

## Required investigation

1. Read `src/modules/cabinet/components/ProfileTab.tsx`.
2. Find deletion server action: `rg -n "deleteAccount|deleteUser|Видалити акаунт" src/modules`.
3. Identify confirmation modal (if any); find component + keys.
4. List all locale keys currently used.
5. Inspect actual deletion server action — what does it actually do?
6. Run:
   ```
   rg -n "Видалити акаунт|delete account|account deletion|deleteAccount|archive.*listing|archived|незворотна|irreversible" src messages docs
   rg -n "profile|settings|account|password|danger|destructive|confirm" src/components src/app src/modules messages
   ```

## Implementation requirements

- Edit ONLY locale keys + (only if new key needed) ProfileTab / modal component to reference new key.
- Do NOT change deletion permissions, backend behavior, listing archive logic, or auth/session logic.
- Do NOT remove any control: warning + button + (existing) modal must remain functional.
- If no confirmation modal exists, do NOT add one in this task — document as recommended follow-up.
- Use existing `cabinet.delete_*` namespace; reuse existing keys where possible; add new keys only when required.

## Acceptance criteria

- Task 336 gate verified: backend behavior matches new copy OR STOP & REPORT issued.
- Delete-account warning explicitly states what happens to account, data, listings, session.
- If deletion is permanent → copy says "deleted forever / cannot be restored".
- If flow is not truly permanent → copy accurately describes real behavior (and Task 336 MVP must have shipped).
- All affected strings localized sq/en/uk/it.
- No hardcoded user-facing strings introduced.
- Warning text wraps correctly at all 14 canonical widths × 4 locales.
- Delete section remains visually distinct (destructive variant preserved).
- Existing confirmation flow (if any) remains functional.
- Existing delete action reachable.
- Password change UI unchanged.
- 0 new lint errors / 0 new warnings; `pnpm tsc --noEmit` → 0 errors; `pnpm build` passes.
- `docs/backlog.md` + `docs/sessions/2026-05-31-task-337-delete-account-copy-clarity.md` updated; Files Changed table; Note 18 self-validation block.

## Out of scope

- Do NOT redesign profile / settings page.
- Do NOT change backend deletion behavior (Task 336 owns that).
- Do NOT add GDPR export/delete architecture (Task 336 + future tasks).
- Do NOT add admin account-deletion controls.
- Do NOT add new account-recovery features.
- Do NOT change listing archive logic.
- Do NOT change auth/session logic.
- Do NOT edit unrelated locale namespaces.
- Do NOT fix unrelated responsive issues.

## Validation

```
pnpm tsc --noEmit
pnpm build
pnpm lint
```

## Manual QA

- Open `/cabinet` → profile → delete-account section.
- Verify warning in sq/en/uk/it.
- Verify all 14 canonical widths (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560).
- If confirmation modal exists, verify title/description/buttons in sq/en/uk/it.
- Verify long warning text wraps without overflow.
- Verify destructive button retains full-area click target (Task 339 cross-ref).
- Verify password change form above unaffected.

## Final report

Files Changed table; Task 336 gate verification result; current backend deletion behavior; current copy → new copy for sq/en/uk/it; confirmation backend matches copy; confirmation password change UI unchanged; confirmation delete action still reachable; confirmation sq/en/uk/it + 14 widths verified; validation; backlog + session log paths; Note 18 self-validation verdict.
