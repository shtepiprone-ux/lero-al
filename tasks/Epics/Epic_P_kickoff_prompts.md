# Epic P — kickoff prompts (non-Sprint-9 tasks)

> P.1 (181), P.2 (182), P.4 (183) ship in Sprint 9 — see their individual kickoff files. This file holds
> the remaining task. Shared hard contract: no scope change; no invented architecture (stop & ask if
> ambiguous); literal AC; update docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors;
> governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global
> Change Verification Rule; commit + single `git add -A` then `git log -1` (owner runs git/SQL).

## Task 185 — P.3 — Clear stale profile name in header after self-delete (Note 19)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract: (see top of this file). Additionally: fix via the centralized auth layer — NO forced
reload to clear the header (Auth Lifecycle + No Fake Fixes rules). If Tasks 181/182 already hardened the
AuthContext lifecycle, REUSE that — do not re-patch locally.

Pre-read:
- src/components/layout/Header.tsx (where the profile name renders from auth state)
- src/modules/auth/context/AuthContext.tsx (auth/session state after sign-out/delete)
- the self-delete action in src/modules/cabinet/actions/index.ts (+ its redirect)
- docs/ai-behavior.md (Auth Lifecycle Rules), docs/state-authority.md

Problem: after a user deletes their own account they are redirected to the homepage, but the header still
shows their old profile name (stale auth/session state).

Scope: ensure account deletion clears the client auth state so the header immediately shows the
signed-out state on redirect. Fix deterministically at the auth layer.

Acceptance criteria:
- After self-delete + redirect, the header shows the signed-out state (no stale name), no manual refresh.
- No forced-reload hack; fixed via the centralized auth layer.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: favorite flow (181), contact card (182), canonical URL (183).
```
