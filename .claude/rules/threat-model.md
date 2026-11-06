# Threat model — only when the attack surface changes

Source: OWASP Threat Modeling, Attack Surface Analysis, Abuse Case, Secure Product Design, Business Logic Security.
"Do not add techniques only to make the model appear comprehensive." A change that fits an existing, reviewed pattern
("more of the same") needs no threat model.

## When it is required (attack-surface change)

The change adds, removes or alters at least one of:
- authentication, sessions, password or e-mail change, account deletion, OAuth;
- authorization: roles, admin or moderator functions, RLS policies, service-role use, ownership rules;
- an entry point: page with private data, Server Action, Route Handler, API route, webhook, cron, Storage bucket or policy;
- a cache that holds private data, or what a cache key contains;
- secrets, keys, tokens, signed URLs;
- file upload, redirects with a target from input, server-side requests to a URL from input;
- a fundamental change of how input is validated or output is encoded;
- a business invariant (limits, prices, status transitions, one-of rules);
- a new dependency, or CI / agent / MCP configuration.

## What to write (in the kickoff, at most ~30 lines)

1. **What are we working on?** The entry points and data flows touched, who can reach them (anonymous, signed-in user,
   owner of the object, agent, moderator, admin), and which trust boundary they cross.
2. **What can go wrong?** Walk STRIDE over those flows and list only real threats: Spoofing, Tampering, Repudiation,
   Information disclosure, Denial of service, Elevation of privilege. Add abuse cases for the business rules: repeat a
   step, skip a step, change the order, race two requests, pass a negative or huge value, act on another user's object.
3. **What are we going to do about it?** Each threat gets one response:
   - **Mitigate** — name the control and where it runs (server, database, edge);
   - **Eliminate** — remove the feature or the entry point;
   - **Transfer** — a named third party carries it (Supabase Auth rate limits, Vercel firewall), with the setting that
     proves it;
   - **Accept** — only with a dated owner decision and the residual risk in one sentence.
   Each mitigation becomes an acceptance criterion; a mitigation that cannot be tested is not a mitigation.
4. **Did we do a good enough job?** Each mitigation has a test from `security-testing.md` that fails when the control is
   removed; each abuse case has a test or is answered by a mitigation that has one.

Example row: `T2 — E: a signed-in agent creates a company for another agent through the Server Action → mitigate: the
action derives the creator from the session and RLS checks created_by = auth.uid() → AC4, test SEC-926-OTHER-AGENT-DENY`.
