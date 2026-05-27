# Epic FF — UX Reactivity & Toasts v2

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator. Extension of Epic T (Global UX
Polish & Forms) — Task 205 (T.1) was the first toasts audit; FF.2 is the second pass.
**Source notes:** `issues.txt` 2026-05-25 — #30 (changing the user's name in the cabinet does not
update the header until a manual page reload — header is reading stale data); #102 (not every
action button triggers a toast — e.g. some Save buttons do not — second-pass audit + fill).
**Kickoffs:** `Epic_FF_kickoff_prompts.md` (Tasks 248–249).

## Goal

Identity changes (name, avatar, etc.) propagate to every UI surface that displays the identity
without a manual reload (Note 19 — cross-page propagation). Toasts fire on every meaningful user
action (T.1 set the canonical pattern; T.1 closed by Task 205; FF.2 fills the gaps that the audit
missed or that have appeared since).

## Dependencies

- Task 205 (T.1) — action-toasts audit + canonical toast (`docs/sessions/2026-05-24-task-205-
  action-toasts-audit.md`). FF.2 is the v2 audit that picks up "Save" cases T.1 missed.
- Task 185 (P.3) — stale header after self-delete; the AuthController commit pattern is the
  closest existing reactive precedent. FF.1 follows the same kind of approach for name change.
- `src/modules/cabinet/components/ProfileTab.tsx` (the name edit); the header user-chip
  component; the auth context / user state holder (AuthController per Task 185); `docs/state-
  authority.md`.

## Tasks

### Task 248 — FF.1 — Header reactivity on profile name change

**Type:** bug
**Priority:** high
**Area:** cabinet ProfileTab → header user-chip (and any other surface displaying the user name —
sidebar, breadcrumb, etc.)

**Pre-read:** Task 185 session log (stale header after self-delete); `docs/state-authority.md`;
`src/modules/cabinet/components/ProfileTab.tsx`; the header user-chip component (find via grep);
the auth context / user state holder; `docs/ai-behavior.md` Note 19 (cross-page propagation —
identity changes must propagate without manual reload).
**Localization coverage:** sq, en, uk, it (no new strings expected, but verify).
**Responsive coverage:** all 7 breakpoints (header is mobile-affected).

**Goal:** After the user saves a new name in the cabinet Profile tab, the header user-chip
shows the new name immediately — without a manual reload. Same for any other place displaying
the name (sidebar, breadcrumb, "Welcome, <name>" greetings, etc.). The fix is in the auth /
user state authority — the header reads from a reactive source that is updated by the
`updateProfile` action's success path (Note 19 — cross-page reactivity).

**Acceptance criteria:**
- UX-flow trace in the session log: edit name → Save → toast → header shows the new name with
  no manual reload, at all four locales and at 320 / 1280.
- Same for every other surface that renders the user name (grep proof + screenshot/runtime
  note for each).
- `router.refresh()` is fine as part of the fix if that's the canonical approach — but a
  client-only state update that diverges from the server is NOT (No Fake Fixes Policy in
  `docs/ai-behavior.md`).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints.

**Out of scope:** avatar reactivity (file as follow-up if also broken — verify and report in
the session log either way); the full toast audit (FF.2).

### Task 249 — FF.2 — Toasts audit v2 (gaps left after Task 205)

**Type:** UX
**Priority:** medium
**Area:** every user action across the site + admin

**Pre-read:** Task 205 session log (T.1 — 4 toast gaps filled + 6 keys ×4); `docs/ui-rules.md`;
the canonical Toast component (`use-toast` / `Toaster` per shadcn); the action inventory from
the T.1 session log — start there to identify what's NEW since.
**Localization coverage:** sq, en, uk, it (every toast string ×4).
**Responsive coverage:** all 7 breakpoints (toast position + readability).

**Goal:** Some user actions still lack a confirmation/error toast after submit — explicitly
called out in `issues.txt` 2026-05-25 "не після всіх натискань на кнопки 'Зберегти'". Do a
second-pass audit:

1. Walk every "Save"/"Update"/"Delete"/"Send"/"Cancel" surface in the site and admin (use the
   T.1 inventory as the starting list + the per-Epic session logs since 2026-05-24 for new
   surfaces).
2. Identify which surfaces still lack a toast on success and/or error.
3. Add the missing toasts using the canonical Toast; localized strings ×4.

**Acceptance criteria:**
- Inventory table in the session log: every action surface; "had toast before" vs "added toast
  now" columns.
- Every action that mutates server state shows a localized success or error toast.
- No new toast system introduced — only the canonical one.
- Locale parity ×4; 7 breakpoints; control-inventory preserved (Note 20 — adding toasts MUST
  NOT remove any existing controls / buttons).
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** redesigning the toast component itself; toast for read-only views.

## Epic-level acceptance

Identity changes (name etc.) propagate without manual reload; every meaningful action shows a
localized toast; no new toast wrapper; before/after action inventory in the session log.
