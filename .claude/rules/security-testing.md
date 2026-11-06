# Security testing

Source: OWASP Authorization Regression Testing, Authorization Testing Automation, Next.js Security ("test controls by
calling entry points directly"; "fail when a new entry point is unclassified"), Business Logic Security, Secure Coding
with AI (security-critical tests are reviewed by a human).

## Required tests for a changed attack surface

For every entry point the change adds or alters (Server Action, Route Handler, RLS policy, Storage policy):

| Actor | Expected |
|---|---|
| Anonymous | denied (401/redirect/RLS returns nothing) |
| Signed-in user who does not own the object (horizontal) | denied, and the object is unchanged |
| Owner / permitted role | allowed, with exactly the intended effect |
| Lower role on an admin or moderator function (vertical) | denied |
| Malformed or oversized input, extra fields (`role`, `owner_id`, `status`) | refused by the schema; nothing written |

The test calls the entry point directly (import the Server Action or call the handler), not through the UI.
A business invariant also gets a repeat/skip/out-of-order case, and a race case where state is read and then written
(two concurrent calls; the invariant holds afterwards). A rate-limited action gets a case for the limit.

## Authorization matrix

The authorization rules live in one machine-readable matrix: actor × resource × action → allow | deny, each row naming
the test tag that proves it. A test enumerates the entry points of the code base (Server Actions, Route Handlers, RLS
policies) and fails when one is not in the matrix, so a new entry point cannot ship unclassified. Task 950 builds the
matrix and the enumeration test from a baseline review of every entry point; until it lands, each task's kickoff lists
its rows.

## Where the tests live

- Unit level, mocked Supabase: `src/**/__tests__/*.security.test.ts` — fast, run by `npm test` and by the agent loop.
- Real boundary, real Auth and RLS on the approved development project: `src/**/*.integration.test.ts`, run by
  `npm run test:security-integration` and by the CI `authz` job. An RLS or Storage policy change always has a
  real-boundary test; a mocked database cannot prove a policy.
- Tag names: `SEC-<task>-<WHAT>-ALLOW` / `-DENY`, so the kickoff, the matrix, the test and the review point at the same
  case.

## A test proves something only if it can fail

Before the review, the implementer removes the control once (comment out the check, locally, not committed) and shows
the test failing, then restores it. The report contains the failing output. The reviewer repeats it for at least one
case per entry point.

## Test changes

Deleting a test, weakening an assertion, or adding a mock that bypasses the checked code needs the reason in the
kickoff. The CI change report lists deleted test files, fewer cases or assertions and new `skip`/`only`/`todo`; the
reviewer reads every changed test file and answers each listed item.
