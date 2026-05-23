# Epic N — kickoff prompts (non-Sprint-9 tasks)

> N.1 (Task 179) and N.3 (Task 180) ship in Sprint 9 — see their individual kickoff files. This file
> holds the remaining task. Shared hard contract for every prompt below: no scope change; no invented
> architecture (stop & ask if ambiguous); literal AC; update docs/backlog.md + docs/sessions/; 0 new
> lint/typecheck errors; governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/
> 1440/2560 where UI; Global Change Verification Rule; commit + single `git add -A` then `git log -1`
> (owner runs git/SQL).

## Task 184 — N.2 — Fix `<html lang>` so the browser stops offering to translate (Note 4)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract: (see top of this file). Additionally: this is the document-language attribute ONLY — not
the string-mixing audit (Task 179) or admin locale persistence (Task 180). No suppressHydrationWarning to
mask a mismatch; no `typeof window` branches (SSR/Hydration rules). If the App-Router approach is
ambiguous, STOP and ask the orchestrator.

Pre-read:
- src/app/layout.tsx (root <html> — currently `<html suppressHydrationWarning ...>` with NO lang)
- src/app/[locale]/layout.tsx (locale is on `<div lang={locale}>` at line ~48, NOT on <html>)
- docs/ai-behavior.md (SSR/Hydration rules)

Problem: browsers decide whether to offer translation from `<html lang>`. The root <html> has no lang and
the active locale is only on an inner <div>, so the browser keeps offering to translate (e.g. to uk).

Scope: set `lang` on the actual <html> element to the active locale (sq/en/uk/it) on every route. Resolve
the constraint that the root layout sits above the `[locale]` segment without hydration hacks (e.g. set it
in the locale layout / via the locale segment). Remove the now-redundant inner `<div lang>` only if the
<html> lang fully replaces it.

Acceptance criteria:
- `<html lang>` equals the active locale on every route.
- Browser no longer auto-prompts to translate when active locale matches content.
- No suppressHydrationWarning added to mask a mismatch; no viewport/typeof window hacks.
- 0 new lint/typecheck errors; npm run build passes.

Out of scope: string-level mixing (Task 179); admin locale persistence (Task 180).
```
