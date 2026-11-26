# Task 1053 — The modules of `src/modules` depend on each other in one direction only, and ESLint refuses a reverse import

Sprint 93. Priority P2. Owner decisions 2026-11-26, translated: O1053-1 "then this must be fixed by checks, so that the structure and
architecture of the project are correct"; O1053-2 "phased, module by module" (the first task is the dependency direction, then one task per
module for its public entry: 1054-1064); O1053-3 "according to development and security best practices of 2026" for the public entry (applied in
1054-1064, not here). Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

`docs/architecture.md:53` names the architecture a modular monolith, but no check holds the modules apart: three pairs of modules import each
other (`cabinet` and `listings`, `cabinet` and `analytics`, `auth` and `notifications`), so they no longer build or change one at a time.
After the task each module sits on one layer of a table in `eslint.config.mjs`, a module imports only modules of a lower layer, the three
reverse imports are gone, and ESLint (pre-commit and CI) refuses a new one.

## Cause

Read at `639929db2`
- `grep -n "import/" eslint.config.mjs` → no output: no `import/*` rule is configured; the only import rule, `no-restricted-imports`
  (`eslint.config.mjs:154-188`), names `next/image` and the icon libraries. `eslint-plugin-import` 2.32.0 and its TypeScript resolver come with
  `eslint-config-next` 16.4.3 and are loaded by `nextVitals` (`eslint.config.mjs:6`, `:83`), so `import/no-restricted-paths` is available.
- The reverse imports this lets through (production files; tests and Stories left out):
  - `src/modules/listings/components/SaveSearchButton.tsx:12` imports `saveSavedSearch` from `@/modules/cabinet/actions`
    (`src/modules/cabinet/actions/index.ts:242-288`), while `cabinet` imports `listings` 14 times (e.g.
    `src/modules/cabinet/components/ListingsTab.tsx:18`). The action already says "listings owns saved_searches"
    (`src/modules/cabinet/actions/index.ts:248`).
  - `src/modules/analytics/activity/read.ts:5` imports the type `AgentOwnerId` from `@/modules/cabinet/statistics/types` (defined at
    `src/modules/cabinet/statistics/types.ts:16`), while `cabinet/statistics` imports `@/modules/analytics/activity/types` 5 times (e.g.
    `src/modules/cabinet/statistics/types.ts:7`).
  - `src/modules/notifications/hooks/useNotifications.ts:5,12` calls `useAuth()` for the user id, while `auth` imports `notifications` twice
    (`src/modules/auth/actions/captcha.ts:12`, `src/modules/auth/actions/recovery.ts:26`). Its one caller is
    `src/modules/notifications/components/NotificationBell.tsx:7`, rendered only by `src/components/layout/Header.tsx:103`, whose `user` is
    `useAuth()`'s (`src/components/layout/Header.tsx:24` → `src/modules/auth/hooks/useUser.ts:4-5`).

Fix: an `import/no-restricted-paths` block in `eslint.config.mjs` built from one exported table `MODULE_LAYERS` (lowest first: `analytics`,
`cms`, `companies`, `currency`, `locations`, `notifications` → `auth`, `contacts` → `listings` → `cabinet` → `admin`): each module's production
files may not import a module of its own or a higher layer. The three reverse imports go: `saveSavedSearch` moves into `listings`, the
`AgentOwnerId` brand moves into `analytics`, and `useNotifications` takes the user id from its caller.

## Scope

- `eslint.config.mjs`: `export const MODULE_LAYERS` and one new config object `task-1053/module-layers` with `files:
  ["src/modules/**/*.{ts,tsx}"]`, `ignores` for `**/__tests__/**`, `**/*.test.{ts,tsx}`, `**/*.stories.{ts,tsx}`, and the rule
  `import/no-restricted-paths` with one zone per module (`target: ./src/modules/<m>`, `from`: every other module of its layer and above), each
  message naming the layer table. No other rule changes.
- `src/modules/listings/actions/savedSearchActions.ts` (new, `'use server'`): `saveSavedSearch` moved byte-for-byte from
  `cabinet/actions/index.ts:242-288`; its session check calls `getUser()` from `@/lib/auth/server` (as `favoriteActions.ts:5`), and the
  canonicalizer is imported statically from `@/modules/listings/lib/savedSearchCanonicalize`.
- `src/modules/cabinet/actions/index.ts`: `saveSavedSearch` removed (`:242-288`); nothing else.
- `src/modules/listings/components/SaveSearchButton.tsx:12`: imports `saveSavedSearch` from `@/modules/listings/actions/savedSearchActions`.
- `src/modules/analytics/activity/types.ts`: `export type AgentOwnerId` (the text of `cabinet/statistics/types.ts:16` and its comment).
- `src/modules/cabinet/statistics/types.ts:16`: becomes `export type { AgentOwnerId } from '@/modules/analytics/activity/types'`, so its
  importers stay as they are.
- `src/modules/analytics/activity/read.ts:5`: imports `AgentOwnerId` from `./types`.
- `src/modules/notifications/hooks/useNotifications.ts:5,11-13`: `useNotifications(userId: string | null)`; the `useAuth` import goes.
- `src/modules/notifications/components/NotificationBell.tsx:6-7`: `NotificationBell({ userId }: { userId: string | null })` passes it on.
- `src/components/layout/Header.tsx:103`: `<NotificationBell userId={user?.id ?? null} />` (`user`, not `headerUser`: the hook keeps reading
  the live session, as `useAuth()` did).
- Tests (only their import paths and the call's argument): `cabinet/actions/__tests__/cabinetActions.security.test.ts:55`,
  `cabinetSessions.security.test.ts:63` and `saveSavedSearch.dedup.test.ts:53,69` import `saveSavedSearch` from the new file;
  `listings/components/__tests__/listingsMigratedControls.smoke.test.tsx:48` mocks the new path;
  `notifications/hooks/__tests__/useNotifications.smoke.test.ts` and `src/__tests__/reactHooksV7Behaviour.test.tsx:355-412` call
  `useNotifications(<the mocked user's id>)` and drop their `AuthContext` mock; `src/components/layout/__tests__/header-hydration-id-parity.test.tsx:144`
  renders `<NotificationBell userId="…" />`. New cases in `src/__tests__/eslintConfig.test.ts` and `src/components/layout/__tests__/Header.signOut.test.tsx`.
- Dependencies: none (`eslint-plugin-import` 2.32.0 is already installed through `eslint-config-next` 16.4.3).
- Out of scope: the public entry of each module and the deep imports into module internals (1054-1064, O1053-2); `src/components/admin/**`
  (1064, the `admin` module's task); file-level cycles inside one module; tests and Stories crossing modules.
- Kept as on `main` (checklist A2): `saveSavedSearch` keeps its arguments, answers (`unauthorized`, `already_exists`, `save_failed`, `{ id }`),
  dedup by hash, 100-character name, the 23505 branch and `revalidatePath('/cabinet')`; `SaveSearchButton` keeps its dialog, texts, toasts and
  pending state; `useNotifications` keeps its query, page size, realtime channel, recovery, the reset on sign-out and the dropped stale answer;
  the bell shows only for a signed-in header as today; `AgentOwnerId` keeps its brand and its one cast in `cabinet/statistics/access.ts:21`.

## Attack surface

1. **What are we working on?** One Server Action, `saveSavedSearch` (signed-in user, own rows of `saved_searches` through the RLS client),
   moves to another `'use server'` file; ESLint configuration (a gate) gains a rule. No new entry point, role, data or flow.
2. **What can go wrong?** Elevation of privilege: the moved action loses its session check or its directive, and becomes callable without a
   session. Tampering: the name bound or the dedup hash is lost in the move. Information disclosure: the bell keeps the previous user's
   notifications because the user id passed in no longer follows sign-out. A gate weakened: the new block replaces an existing rule key.
3. **Mitigations:** the action is moved unchanged, its guard is found by `serverEntryGuards.test.ts`, and its existing security tests run
   against the new file (AC3); the hook's sign-out tests keep their assertions and the header passes the live user (AC4); the new block uses
   only the new key `import/no-restricted-paths`, and the existing `eslintConfig.test.ts` cases still pass (AC1).
4. Authorization matrix: unchanged; `saveSavedSearch` stays anonymous → `unauthorized`, signed-in → own row (`cabinetActions.security.test.ts`).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-26, upstream `6b409f08d753`).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — the threat model names a call of the moved action without a session and a bell left with another user's rows — AC3, AC4.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the one moved Server Action and the changed lint gate; no entry point is added — AC1, AC3.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — the moved action still reads the session itself on every call — AC3.
- Authorization_Decisions_And_Output_Handling: not applicable — the move keeps the action's single session check and adds no decision.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the check stays inside the action, next to the insert into the caller's own rows — AC3.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — a move can drop the guard; `serverEntryGuards.test.ts` scans the new file and fails without `getUser()` — AC3.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the anonymous and signed-in cases of `cabinetActions.security.test.ts` run against the moved action — AC3.
- Bot_Management_and_Anti-Automation: not applicable — no anonymous entry point is added or changed by this task.
- Content_Security_Policy: not applicable — a type moves between two files; no header or script source changes.
- Credential_Stuffing_Prevention: not applicable — no login, password or account step is touched here.
- Cross_Site_Scripting_Prevention: not applicable — `SaveSearchButton` changes one import line; nothing it renders changes.
- Cryptographic_Storage: not applicable — the dedup hash function is moved with its caller, not changed.
- DOM_based_XSS_Prevention: not applicable — no client sink is added; the button changes only an import path.
- Database_Security: not applicable — the action keeps the caller's RLS client and the same table and columns.
- Denial_of_Service: not applicable — no new request path, loop or input size is introduced here.
- GraphQL: not applicable — the project has no GraphQL endpoint and this task adds none.
- Input_Validation: "Validate on the server even when the browser checks the same fields." — the 100-character name bound and the canonical filters move with the action unchanged — AC3.
- Insecure_Direct_Object_Reference_Prevention: "implement access control checks for each object that users try to access" — `user_id` still comes from the session, never from the arguments — AC3.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — the rule uses directory zones, no regular expression; the existing security rules stay on every file — AC1.
- Key_Management: not applicable — no key is read, created or used by the moved code.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the insert keeps its five named fields; no argument object is spread into it — AC3.
- Multi_Tenant_Security: "Do Not Use an RLS-Bypassing Role for Tenant-Scoped Request Paths" — the moved action keeps `createClient()` (RLS), never the admin client — AC3.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — the new `'use server'` file is scanned as an entry point and its export is guarded — AC3.
- Prototype_Pollution_Prevention: not applicable — no merge or set-by-path helper is added or changed.
- Query_Parameterization: not applicable — the query builder calls move unchanged; no SQL text is written.
- React_Security: "For protected operations, enforce authentication and authorization inside the function." — the session check is the first line of the moved action — AC3.
- SQL_Injection_Prevention: not applicable — no SQL string is built; the query builder calls are unchanged.
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — the review reads the moved action against `main`'s text line by line and the new lint block against the existing rule keys — AC1, AC3.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; `eslint-plugin-import` is the installed 2.32.0 — AC6.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC3 and AC4.
- Third_Party_Javascript_Management: not applicable — no third-party script is loaded or changed by this task.
- Threat_Modeling: "Do not add techniques only to make the model appear comprehensive." — the model lists only the moved action, the bell's user id and the lint gate — AC1, AC3, AC4.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the Route's tests and reads CI itself — AC6.
- WebSocket_Security: "Don't assume WebSocket connection equals unlimited access. Check authorization for each action" — the realtime channel stays filtered to the id the hook is given, and that id is the live session's — AC4.
- Web_Cache_Security: not applicable — `revalidatePath('/cabinet')` moves unchanged; no cache key or header changes.
- Web_Frontend_Security: not applicable — no markup, sink or browser storage is changed here.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 For a production file of each module, `import/no-restricted-paths` is an error; linting the text `import { saveSavedSearch } from
  '@/modules/cabinet/actions'` as `src/modules/listings/components/X.tsx`, `import type { AgentOwnerId } from '@/modules/cabinet/statistics/types'`
  as `src/modules/analytics/activity/X.ts` and `import { useAuth } from '@/modules/auth/context/AuthContext'` as
  `src/modules/notifications/hooks/X.ts` gives that rule's error; `import { ListingCard } from '@/modules/listings/components/ListingCard'` as
  `src/modules/cabinet/components/X.tsx` gives none; the `react-hooks` cases and `no-restricted-imports` still hold — test:
  `src/__tests__/eslintConfig.test.ts` (changed).
- AC2 `MODULE_LAYERS` names every folder of `src/modules` except `__tests__` exactly once, so a new module cannot be left without a layer —
  test: `src/__tests__/eslintConfig.test.ts` (changed).
- AC3 `saveSavedSearch` lives only in `src/modules/listings/actions/savedSearchActions.ts`, is found guarded by the scanner, and keeps every
  answer — test: `src/__tests__/security/serverEntryGuards.test.ts`, `src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts`,
  `cabinetSessions.security.test.ts`, `saveSavedSearch.dedup.test.ts`, `src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx`.
- AC4 While the header holds the signed-out user (`isSigningOut`), the bell is rendered with `userId` `null`, and `useNotifications(null)`
  empties the list — test: `src/components/layout/__tests__/Header.signOut.test.tsx` (new case),
  `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts`.
- AC5 No production file of `src/modules` imports a module of its own or a higher layer — test: the CI job "Lint, types and product checks"
  (ESLint over the tree), read with `gh pr checks <n>`.
- AC6 CI passes — test: `gh pr checks <n>` after every check concluded.

## Route

1. Work on the branch the owner created from `main` (checklist H1).
2. Tests first (AC1-AC4); save each failing output.
3. `eslint.config.mjs`, `savedSearchActions.ts`, `cabinet/actions/index.ts`, `SaveSearchButton.tsx`, the two `types.ts`, `read.ts`,
   `useNotifications.ts`, `NotificationBell.tsx`, `Header.tsx`, then the test files of the Scope.
4. Run: `npm run typecheck`; ESLint on the changed code files (the pre-commit hook's command); `npm test --` with the files found
   2026-11-26 at `639929db2` by import of every changed module (checklist D10):
   src/__tests__/eslintConfig.test.ts src/__tests__/reactHooksV7Behaviour.test.tsx src/__tests__/reactHooksV7Components.test.tsx
   src/__tests__/security/publicListingsTag.test.ts src/__tests__/security/serverEntryGuards.test.ts src/app/admin/__tests__/dashboardLanding.test.tsx
   src/components/admin/__tests__/AdminUserProfile.bounds.security.test.tsx src/components/layout/__tests__/Header.google.security.test.tsx
   src/components/layout/__tests__/Header.signOut.test.tsx src/components/layout/__tests__/header-hydration-id-parity.test.tsx
   src/components/layout/__tests__/headerFooterContainers.test.tsx src/components/layout/__tests__/sessionEnded.security.test.tsx
   src/lib/account/deleteAccount.security.test.ts src/modules/__tests__/noDbMessage.security.test.ts src/modules/__tests__/rls-write-guards.smoke.test.ts
   src/modules/admin/actions/__tests__/profileBounds.security.test.ts src/modules/analytics/activity/__tests__/read.test.ts
   src/modules/analytics/activity/__tests__/readEdges.test.ts src/modules/auth/components/__tests__/staleSession.security.test.tsx
   src/modules/cabinet/actions/__tests__/cabinetActions.security.test.ts src/modules/cabinet/actions/__tests__/cabinetFailures.security.test.ts
   src/modules/cabinet/actions/__tests__/cabinetSessions.security.test.ts src/modules/cabinet/actions/__tests__/changePassword.security.test.ts
   src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts src/modules/cabinet/actions/__tests__/emailChange.security.test.ts
   src/modules/cabinet/actions/__tests__/reauth.security.test.ts src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts
   src/modules/cabinet/actions/__tests__/reauthLimit.security.test.ts src/modules/cabinet/actions/__tests__/saveSavedSearch.dedup.test.ts
   src/modules/cabinet/components/__tests__/CabinetEmailChangeSection.security.test.tsx
   src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx
   src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx
   src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx
   src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx
   src/modules/cabinet/statistics/__tests__/activitySeriesFrom.test.ts src/modules/cabinet/statistics/__tests__/activityState.test.ts
   src/modules/cabinet/statistics/__tests__/data.test.ts src/modules/cabinet/statistics/__tests__/fixtureConsistency.test.ts
   src/modules/cabinet/statistics/__tests__/topListings.test.ts src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx
   src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts;
   `node --test scripts/quality/agent-settings.test.mjs scripts/quality/change-report.test.mjs`;
   `npm run test:security-integration -- src/lib/account/deleteAccount.integration.test.ts`. Deliberate breaks: the zone of `listings`
   removed → AC1 fails; `notifications` left out of `MODULE_LAYERS` → AC2 fails; `getUser()` removed from `saveSavedSearch` →
   `serverEntryGuards.test.ts` fails; `Header` passing `headerUser?.id` → AC4 fails; each restored. CI runs only on GitHub and is read with
   `gh pr checks <n>` (A5).
5. Report: each command, exit code, relevant output; each new test's failing run before the change; each break's output.

## Review
