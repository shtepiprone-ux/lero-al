# Task 1033 — The notifications channel is never checked as an anonymous visitor

Sprint 94. Priority P3. Owner's Supabase log excerpt of 2026-11-24: "invalid column for filter user_id" (`P0001`, level error) at 17:16:38,
17:16:50, 17:17:58 and twice at 17:25:35 UTC. Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

Around a sign-in and a sign-out the database logs an error for the notifications Realtime channel, because Realtime checks the channel's filter
with the anonymous role, which may not read `notifications.user_id`. After the task a sign-out removes the user's channels before the session
ends, and the notifications channel joins only once the Realtime client carries the user's token.

## Cause

Read at `f36b68bad`
- Realtime checks a filter with the role in the subscriber's claims: `realtime.subscription_check_filters` raises `invalid column for filter %` when `has_column_privilege(<claims role>, entity, column, 'SELECT')` is false (function source read 2026-11-24); `anon` may not read `notifications.user_id` (`has_column_privilege('anon', 'public.notifications', 'user_id', 'select')` → false), unlike `favorites` and `listings` (→ true). The notifications channel filters on it (`src/modules/notifications/hooks/useNotifications.ts:96-103`).
- On a sign-out supabase-js (2.105.4) sets the Realtime token to the anonymous key, and Realtime pushes it to every joined channel: `grep -n "realtime.setAuth()" node_modules/@supabase/supabase-js/dist/index.cjs` → `566: this.realtime.setAuth();` (the `SIGNED_OUT` branch); `grep -n "CHANNEL_EVENTS.access_token" node_modules/@supabase/realtime-js/dist/main/RealtimeClient.js` → `512: channel.channelAdapter.push(constants_1.CHANNEL_EVENTS.access_token, {` (inside `this.channels.forEach`). The hook removes its channel only after React renders the signed-out state (`src/modules/notifications/hooks/useNotifications.ts:119`). Every app sign-out goes through `signOut` (`src/lib/auth/browser.ts:60-62`: the auth controller `src/lib/auth/controller.ts:29`, the admin sidebar, the password reset and the cabinet).
- A channel joins with the token the Realtime client holds at that moment: `grep -n "accessTokenPayload.access_token = this.socket.accessTokenValue" node_modules/@supabase/realtime-js/dist/main/RealtimeChannel.js` → `135: accessTokenPayload.access_token = this.socket.accessTokenValue;`; the client sets the user's token asynchronously (on `SIGNED_IN`), while the hook subscribes as soon as it knows the user id (`src/modules/notifications/hooks/useNotifications.ts:84-103`). INFERENCE: the two errors at 17:25:35 (a sign-in at 17:25:21-24, edge log) are such joins.

Fix: `signOut` removes every Realtime channel before `auth.signOut`; the notifications hook awaits `supabase.realtime.setAuth()` before it subscribes, and subscribes nothing if it was cleaned up meanwhile.

## Scope

- `src/lib/auth/browser.ts` `signOut` (`:60-62`): `await createClient().removeAllChannels()` first (a failure there is ignored and the sign-out still runs), then `auth.signOut(...)` as today.
- `src/modules/notifications/hooks/useNotifications.ts`, the Realtime effect (`:84-121`): `await supabase.realtime.setAuth()` before building and subscribing the channel; if the effect was cleaned up during the await, no channel is created.
- Dependencies: none.
- Out of scope: a sign-out the app does not start (an expired refresh token, another tab): Realtime still re-checks then; the favorites and cabinet-listings channels (their `user_id` is readable by `anon`, no error); grants (`anon` keeps no access to `notifications`).
- Kept as on `main` (checklist A2): the sign-out result, scopes and redirects; the notifications list, counts, refetch on reconnect and on visibility; the channel name, event and filter.

## Attack surface

Changed: the sign-out procedure (sessions).
1. **What are we working on?** `signOut` (any signed-in user) and the notifications channel of the signed-in user.
2. **What can go wrong?** T1 I/D: a user-scoped channel stays joined across a sign-out and is re-checked as `anon` → mitigate: channels are removed before the session ends → AC1. T2 D: a failure removing channels blocks the sign-out → mitigate: the failure is ignored and `auth.signOut` still runs → AC1.
3. Each mitigation is an acceptance criterion with a test that fails when it is removed.

## OWASP

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — T1 and T2 of "## Attack surface" — AC1.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — the sign-out procedure and one Realtime channel, named above — AC1, AC2.
- Authentication: not applicable — no credential, password or sign-in rule changes in this task.
- Authentication_Patterns: not applicable — Supabase Auth stays the only mechanism; its calls are unchanged.
- Authorization: not applicable — no grant, policy or role check changes; `anon` keeps no access.
- Bot_Management_and_Anti-Automation: not applicable — no limit or automation control is touched here.
- Cookie_Theft_Mitigation: not applicable — no cookie is set, read or changed by the task.
- Credential_Stuffing_Prevention: not applicable — the sign-in path and its CAPTCHA are unchanged.
- Denial_of_Service: not applicable — one awaited call before a subscription; no new request path.
- JavaScript_and_TypeScript_Security: not applicable — no merge, regular expression or dynamic code added.
- Multi_Tenant_Security: not applicable — the channel's user filter and RLS stay as they are.
- OAuth2: not applicable — Google sign-in and its tokens are untouched by the task.
- Multifactor_Authentication: not applicable — the factors of sign-in are unchanged by the task.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this diff — AC3.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — T1 and T2 are AC1 — AC1.
- Session_Management: not applicable — session creation, renewal and the server-side sign-out are unchanged; only the Realtime channels close first.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1.
- Unvalidated_Redirects_and_Forwards: not applicable — the sign-out redirects are unchanged; no target from input.
- WebSocket_Security: "When users log out, close all their WebSocket connections immediately." — `signOut` removes every Realtime channel before the session ends — AC1.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the Cause is read from the database function and the installed library, not assumed — AC1, AC2.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the tests and breaks — AC1, AC2.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A sign-out removes the Realtime channels first — test: `src/lib/auth/__tests__/browser.smoke.test.ts` (extended): `signOut()` and `signOut('local')` call `removeAllChannels` before `auth.signOut` (call order recorded); a rejecting `removeAllChannels` still calls `auth.signOut` and returns its result.
- AC2 The notifications channel joins with the user's token — test: `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` (extended): `realtime.setAuth` resolves before `channel(...).subscribe` is called; an unmount while `setAuth` is pending creates no channel.
- AC3 The CI jobs pass — test: `gh pr checks <n>` after every check has concluded (checklist A5).

## Route

1. Work on the branch the owner created from `main` (checklist H1); its first commit carries this kickoff and the archive of Task 1035 (Opus's).
2. Tests first (AC1, AC2); save each failing output.
3. `browser.ts` and the hook.
4. Run: `npm test -- src/lib/auth/__tests__/browser.smoke.test.ts src/lib/auth/__tests__/browserAuth.security.test.ts src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts`. Deliberate breaks: `removeAllChannels` after `auth.signOut` → AC1 fails; subscribe without awaiting `setAuth` → AC2 fails; each restored. CI on GitHub only (`gh pr checks <n>`).
5. Report: each command, exit code, relevant output, each break and its result. After the merge Opus signs in and out on `localhost:3000` and the owner exports the Postgres log of that minute: no "invalid column for filter".

## Review
