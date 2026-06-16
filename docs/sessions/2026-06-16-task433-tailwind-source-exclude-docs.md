# Task 433 — Exclude `docs/` and `tasks/` from Tailwind content scanning (build-break fix)

**Applied by:** Opus orchestrator, with explicit owner authorization for `src/app/globals.css` this session
(2026-06-16). **Type:** Tailwind source-scope config — single CSS file. **Status:** REACTIVATED (see below) → fixed.

## Why Task 433 was reactivated

Task 433 had been recorded on **2026-06-15** as *"⏸️ DEFERRED / NON-REPRODUCIBLE — owner native check: `npm run dev`
starts clean … no globals.css/Tailwind compile error — do NOT patch globals.css or Tailwind config."*

That note was accurate for 06-15 but became **stale**. On **2026-06-16**, after a clean restart (`.next` cleared),
the owner reproduced a hard build break:

```
./src/app/globals.css:1938:41  Parsing CSS source code failed
  > 1938 |     border-radius: min/calc(var(--radius...), ...);
Unexpected token Delim('.')
```

Root cause: Tailwind v4 automatic content detection scans the whole project (including `.md`), and three
documentation files contain Tailwind arbitrary-value **examples written as prose pseudo-code** with a literal `...`:

- `docs/design-system.md:793`
- `docs/sessions/2026-06-13-task408-design-token-detector-hardening.md:142`
- `docs/sessions/2026-06-15-task427-admin-owner-full-edit-and-status-access.md:219`  ← landed **after** the 06-15
  non-repro check, which is why the break only reproduced on 06-16.

The scanner extracted `rounded-[min/calc(var(--radius...),...)]` as a real class candidate and emitted invalid CSS
(`border-radius: min/calc(var(--radius...), ...)`), failing the build at the generated `globals.css:1938`. Clearing
`.next` did **not** help — the candidate is re-scanned on every build. The real `rounded-[min(var(--radius-md),10px)]`
classes in `button.tsx` are unaffected.

The owner authorized the `globals.css` change for this session and confirmed the fix resolves the live break, which
supersedes the 06-15 "do not patch" directive.

## Fix (strictly scoped — Tailwind source exclusion only, no config refactor)

Added two exclusions to `src/app/globals.css` immediately after the existing `@import` block:

```css
@source not "../../docs";
@source not "../../tasks";
```

`@source not` paths are relative to the CSS file; from `src/app/` these resolve to repo-root `docs/` and `tasks/`.
Nothing in `docs/` or `tasks/` is ever rendered, so excluding them drops **no real utility** (utilities used by the
app live in `src/`, which remains scanned). This is the durable fix: it prevents all current and future doc/task
class-example leakage in one place. No Tailwind config file and no other CSS rule was touched.

## Verification

- Owner native (2026-06-16): after the fix + `Remove-Item -Recurse -Force .next` + `npm run dev`, the dev server
  boots clean and the admin pages render — no `globals.css:1938` error.
- No missing-utility symptoms (elements remain fully styled; a missing utility would render *unstyled* elements, not
  the observed styled-but-overflowing layout). The remaining admin-profile <640 horizontal-overflow is a separate,
  pre-existing DS-migration gap → **Task 439** (not this task).

## Scope boundaries (per owner directive, 2026-06-16)

NOT part of this task / commit: Task 434 date-format hydration work (`AdminUserProfile.tsx`, `src/lib/formatters.ts`),
the AdminTable `<thead>` whitespace hydration fix (separate **Task 438**), the Task 427 kickoff, and the prior
uncommitted `docs/backlog.md` edits.

## Files Changed

| File | Change |
|---|---|
| `src/app/globals.css` | Added `@source not "../../docs"; @source not "../../tasks";` (+ explanatory comment) after the `@import` block. |
| `docs/sessions/2026-06-16-task433-tailwind-source-exclude-docs.md` | New session log (this file). |

> `docs/backlog.md` reactivation of Task 433 is handled by the orchestrator natively against confirmed content
> (the sandbox mount served inconsistent `backlog.md` snapshots this session), separately from this commit.
