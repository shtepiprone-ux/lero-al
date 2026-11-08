# Task 953 — The five React Compiler lint rules are on, and their 55 findings are fixed

Sprint 93. Priority P1. Owner decision through Opus, 2026-11-06: the five rules stay off in Task 952 and come back here,
before PR #19 merges (`docs/backlog.md`, Sprint 93 row). Implementer: Sonnet, on `governance/reset-2026-11-06`, after Task
952 is committed. Reviewer: Opus. Human owner of the change: the owner.

## Goal

`eslint-config-next@16` brings `eslint-plugin-react-hooks@7.1.1` with five rules that had 55 findings in 39 files, so
Task 952 switched them off in one block (`eslint.config.mjs`, `task-952/react-hooks-v7-compiler-rules-off`). The list is
`docs/sessions/2026-11-06-task952-react-hooks-v7-findings.json`: `set-state-in-effect` 39, `refs` 10, `purity` 2,
`incompatible-library` 3, `immutability` 1. A rule that is off finds nothing, so a render that reads a ref, a clock read
during render and a state set in an effect pass review today. After the task all five are errors, no finding is left and
no behaviour changes.

## Scope

- Every file of the findings list, fixed at the cause, one rule at a time:
  - `purity`: `src/app/[locale]/listings/[slug]/page.tsx:272`, `src/app/admin/listings/[id]/preview/page.tsx:76`. These
    two can hide a security decision (an expiry compared with the clock); the value moves out of render and keeps
    its meaning.
  - `immutability`: `src/app/[locale]/favorites/page.tsx:58`.
  - `refs` (10): `src/hooks/useSwipeTrackSync.ts`, `src/modules/auth/context/AuthContext.tsx`,
    `src/modules/cabinet/hooks/useCabinetListingsRealtime.ts`, `src/modules/listings/components/ImageUpload.tsx`,
    `src/modules/listings/components/ListingInquiryDialog.tsx`, `src/modules/listings/hooks/useFavoritesRealtime.ts`.
    The "latest value in a ref" pattern moves into an effect or `useEffectEvent`.
  - `set-state-in-effect` (39): derive during render, key the component, or read through `useSyncExternalStore`
    (`src/hooks/useIsMobile.ts`). The fix for a data-loading effect is moving its synchronous part (`setLoading(true)`)
    to the event or the initial state.
  - `incompatible-library` (3): `src/components/admin/AdminUserCreate.tsx:129`, `src/components/admin/AdminUserProfile.tsx:173`,
    `src/modules/contacts/components/ContactForm.tsx:38` (`react-hook-form` `watch`): `useWatch` in its place.
- `eslint.config.mjs`: the named block keeps only `rules-of-hooks` and `exhaustive-deps`; the five rules become `"error"`.
- `src/__tests__/eslintConfig.test.ts`: its second test asserts that no `react-hooks/` rule is off.
- Remove the findings file when the rules are on; it has no reader after that.
- No `eslint-disable` of these rules. A finding that truly cannot be fixed stops the task and is reported to Opus.
- Dependencies: none. Out of scope: turning on the React Compiler itself, any visible change.

## Attack surface

Unchanged: no entry point, session, data flow or permission changes. `AuthContext.tsx` and the two pages of `purity`
change only where a value is computed; their existing tests keep passing unchanged.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- Authentication: not applicable — `AuthContext.tsx` changes where a ref is written, not how a session is checked.
- Authentication_Patterns: not applicable — no authentication code is added; the same Supabase client is used.
- Authorization: not applicable — the changed pages keep their server guards; only a value moves out of render.
- Authorization_Decisions_And_Output_Handling: not applicable — no access decision or returned field changes in this task.
- Authorization_Patterns: not applicable — no guard moves; the preview page keeps its staff check.
- Authorization_Regression_Testing: not applicable — no permission changes; the existing action tests run unchanged.
- Authorization_Testing_Automation: not applicable — the matrix is Task 950; no authorization rule changes here.
- Cookie_Theft_Mitigation: not applicable — no cookie is read, written or changed by these lint fixes.
- Credential_Stuffing_Prevention: not applicable — the sign-in flow keeps its captcha and calls; `AuthSheet.tsx` changes state timing only.
- Cross_Site_Scripting_Prevention: not applicable — no output path changes; the pages keep rendering text through React.
- DOM_based_XSS_Prevention: not applicable — no sink, `eval` or computed URL is added by these fixes.
- Denial_of_Service: not applicable — no limit or expensive path changes; `ImageUpload.tsx` changes only a ref update.
- File_Upload: not applicable — the upload contract stays as Task 952 left it; signed uploads are Task 957.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL run on every changed file, and the five rules become errors — AC1, AC4.
- Multifactor_Authentication: not applicable — no sign-in factor changes; staff MFA is Task 960.
- Nextjs_Security: "Rendering the form only on a protected page does not authenticate the action request." — no Server Action changes; `serverEntryGuards.test.ts` runs unchanged — AC4.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input; Opus reruns each command — AC4.
- Session_Management: not applicable — the session refresh and its cookies are untouched; `AuthContext.tsx` only reads the user.
- User_Privacy_Protection: not applicable — no personal data flow changes; only render timing changes.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC4.
- WebSocket_Security: not applicable — the realtime hooks keep their channels and filters; only a ref update moves.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no `innerHTML` is added; lint (react/no-danger) fails on one — AC1, AC4.

## UI

No visible change. A visual difference in Storybook or the click-shield run is a stop-and-report.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The five rules are errors and lint passes — test: `src/__tests__/eslintConfig.test.ts` (no `react-hooks/` rule is
  off, the five are severity 2) and `npm run lint`.
- AC2 No suppression hides a finding — test: `src/__tests__/eslintConfig.test.ts`, new case: no file under `src/` has an
  `eslint-disable` comment that names one of the five rules.
- AC3 Each changed hook and component behaves as before — test: `src/__tests__/reactHooksV7Behaviour.test.tsx` (new) or
  the file's own `__tests__/` test, for every file of the findings list that has none: the behaviour the finding touched,
  passing on the unchanged code and on the fixed code. The `purity` pair: `src/app/[locale]/listings/[slug]/__tests__/closedListing.security.test.ts`
  gains a case with a mocked clock on either side of the expiry.
- AC4 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `npm run build`, `npm run build-storybook`,
  `node scripts/quality/changed-lines-coverage.mjs --base main` and `node scripts/quality/check-files.mjs --worktree`
  exit 0.
- AC5 `node scripts/quality/product-gates.mjs` has no new failure compared with before (lists before and after).

## Route

1. Tests first: AC3 on the unchanged code, green; they pin today's behaviour. AC1 and AC2 fail until the end.
2. Turn the rules on one at a time, in the order of Scope; fix that rule's findings; run lint and the tests of those files.
3. Remove the findings file. Run AC4 and AC5.
4. Report: each command, exit code and relevant output, one line per finding (file, rule, the fix, its test), and the
   deliberate break of AC1 and AC2. Build with `SENTRY_AUTH_TOKEN=` empty.

## Review
