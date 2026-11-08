# Secure code review

How Opus reviews every change (and how any session reviews code it did not write). Source: OWASP Secure Code Review
Cheat Sheet (hybrid: a diff-based review of every change, a baseline review of the whole code base at project
initiation, for legacy code and after an incident), Secure Coding with AI, Verifying Third Party Agent Execution
Evidence, with the checks of the sheets named per category. Apply only the categories the diff touches; "more of the
same" in an existing, already-reviewed pattern needs no new threat analysis (Attack Surface Analysis).

## 1. Tools first

1. CI of the candidate: every job of `ci.yml` (`gh pr checks <n>`). A red job is a finding unless it is red on `main`
   for the same cause.
2. CodeQL alerts of the PR and `npm audit --omit=dev`: triage each one (real / false positive with the reason).
3. The CI change report (`node scripts/quality/change-report.mjs main HEAD`): every sensitive path, deleted or weakened
   test and new dependency it lists is answered in the review.
4. The diff itself: `git diff main...HEAD --stat`, then **every** file, generated and test files included. Never approve
   from the report or the PR description: the executor's report is a supplier assertion; each claim it makes (command,
   exit code, test count, deliberate break) is rerun by the reviewer on the candidate commit, and a claim that cannot be
   reproduced is a finding.
5. Live configuration. The diff never shows the database or an external service, and the repository holds no complete
   schema, so the review reads them: `node scripts/quality/db-catalog-audit.mjs` (read-only; RLS on every table,
   RESTRICTIVE block policies, definer functions pinned and allow-listed, no `anon` writes, a moderator write policy
   checks a permission key, users server-only columns not session-writable, public listing reads bounded by expiry,
   owner status changes guarded, bucket limits) when the change touches SQL, RLS, grants, a data write, authentication or
   roles; `node scripts/quality/cloudinary-config.mjs` when it touches uploads or images. Both exit 1 while a known
   violation is open (Tasks 956, 957): the review answers the invariants the change touches.
6. The reference itself (owner request 2026-11-07). `node scripts/quality/owasp.mjs sync` and `check`: the registry of
   every sheet of https://cheatsheetseries.owasp.org/index.html with its content hash, and the mapping of each sheet to
   this project (`docs/security/owasp/controls.json`: applies or why not, triggers, verbatim requirements, and the control
   file with the evidence text that implements each, or the open task that will). A sheet changed upstream fails until
   it is re-read; a control whose evidence text disappears fails until it is re-checked. Then
   `node scripts/quality/owasp.mjs review <kickoff> --base main` and the task's OWASP review record: a protection the
   diff should have and lacks is a finding, also when the kickoff did not ask for it.
7. Baseline review (project start, legacy code, after an incident, or when the owner asks for the whole project):
   `node scripts/quality/audit-coverage.mjs` lists every tracked file by lane with its checks and reading rule; the
   ledger of what was read, and how, is written next to the findings (`docs/security/audit-2026-11-06/coverage.md`).

## 2. Six steps (diff-based review)

1. **Impact on existing controls** — does the change weaken an auth check, an RLS policy, a validation, an escaping, a
   header, a test?
2. **New attack vectors** — new entry points, parameters, outbound calls, file handling, HTML sinks.
3. **Modified trust boundaries** — client ↔ server, server ↔ database (service role vs. user session), app ↔ third party.
4. **New integrations** — new packages (exist on npm, maintained, not brand-new, no install script), new APIs, new
   webhooks.
5. **No security regression** — deleted or weakened tests, assertions or rules; changed lockfile, CI or agent config.
6. **Relevant patterns** — the category checklists below.

## 3. Checklists

**Authorization** (Authorization, IDOR, Next.js, Business Logic)
- [ ] Every Server Action and Route Handler checks the caller itself; middleware/proxy or UI hiding is never the only check.
- [ ] Identity comes from the verified session (`supabase.auth.getUser()`), never from a request field (`user_id`, `role`).
- [ ] The object is loaded through a query scoped to the caller, or ownership is checked after the fetch — for read,
      update, delete and export alike. Not found and forbidden answer the same where existence is sensitive.
- [ ] Deny by default; RLS enabled on every table the change touches, and the service role is used only where a user
      session cannot do the job, after an explicit authorization check.
- [ ] Storage objects and signed URLs follow the same rule as their rows.
- [ ] An application-only guard has a database twin: a permission key, rank rule or status rule checked in a Server
      Action is also enforced by the policy or trigger of the table it writes (a session can call PostgREST directly);
      `db-catalog-audit.mjs` I5 and I8 check the known cases.
- [ ] Multi-step flows keep state on the server; check-then-act is atomic (conditional update with affected-row check,
      constraint, or transaction).

**Input and output** (Input Validation, Mass Assignment, XSS, Injection, Prototype Pollution, JS/TS Security)
- [ ] Every input crossing a trust boundary is parsed by a schema (zod) with an allowlist: unknown keys stripped/refused,
      lengths and ranges bounded, size limited before parsing.
- [ ] No `...body` spread into an insert/update; server-controlled fields (role, owner, status, price) are never bindable.
- [ ] Queries use the Supabase client or parameters; no SQL built from strings; identifiers come from an allowlist.
- [ ] No `dangerouslySetInnerHTML` without a sanitizer named at the call site; URLs rendered from data allow only
      `http(s)`; no `eval`/`new Function`/string timers (ESLint enforces).
- [ ] Untrusted keys never written with `obj[key] =` on a plain object; no recursive merge of request data.

**Authentication and sessions** (Authentication, Session Management, Forgot Password, OAuth2, JWT)
- [ ] Login, sign-up and reset answer the same for existing and unknown accounts.
- [ ] Reset and confirmation links are single-use, time-limited, built from a fixed base URL (never the Host header),
      and not consumed by a GET that a mail scanner can make.
- [ ] Password change and account deletion require re-authentication; sessions end server-side on sign-out and after a
      password change.
- [ ] OAuth/OIDC: PKCE or nonce verified; redirect URIs exact-match; tokens verified (issuer, audience, expiry) before use.

**Requests and redirects** (CSRF, SSRF, Unvalidated Redirects, Webhook)
- [ ] No state change on GET. Server Actions keep Next.js's origin check; custom POST handlers check `Origin`.
- [ ] Redirect targets are local paths or an allowlist; `next`/`returnTo` parameters are validated.
- [ ] Server-side fetches never take a full URL from the user; hosts come from an allowlist; redirects are not followed blindly.
- [ ] Webhooks verify the signature over the raw body with a constant-time compare and are idempotent.

**Next.js entry points** (Next.js Security)
- [ ] Every new or changed entry point is classified: page, Server Action (a client-callable POST, whatever imports it),
      Route Handler, middleware, cron, webhook; with its audience (anonymous, user, owner, moderator, admin).
- [ ] Modules with secrets or privileged clients import `server-only`; nothing privileged is imported by a Client Component.
- [ ] Each cached response or `unstable_cache`/`fetch` cache has a stated audience; per-user data is never cached
      under a shared key; revalidation cannot be triggered by an unauthorized caller.
- [ ] `next.config.ts`, middleware, headers, rewrites and image remote patterns are reviewed as security code.

**Business logic** (Business Logic Security, Abuse Case)
- [ ] The invariants the change relies on (one company per agent, price ≥ 0, status transitions, ownership) are written
      down and enforced on the server or in the database, each with a test.
- [ ] Repeat, skip-a-step, out-of-order and concurrent requests cannot break an invariant (race test where state is
      read then written).
- [ ] An abusable action (sign-up, contact, report, upload, e-mail send) has a per-actor rate limit.

**JavaScript and TypeScript** (JavaScript and TypeScript Security)
- [ ] No regular expression with nested or overlapping quantifiers on untrusted input (ReDoS); input length is bounded
      before matching.
- [ ] `postMessage` receivers check `event.origin` against an allowlist; senders name the target origin.
- [ ] No `any` or non-null assertion hides an unchecked value from a trust boundary; it is parsed by a schema instead.

**Data exposure, errors, logging** (Next.js, Error Handling, Logging, Secrets Management)
- [ ] Data sent to Client Components is an explicit DTO with only the fields the viewer may see.
- [ ] `NEXT_PUBLIC_` only for values that are public; no secret reaches the client bundle or a log.
- [ ] Errors to the client are generic; Supabase error objects are not echoed; details go to the server log.
- [ ] Security events (auth failures, authorization denials) are logged without passwords, tokens or full bodies.
- [ ] Cached responses never mix users: no user data in a cache keyed without the user.

**Files** (File Upload)
- [ ] Type checked by content, not by name or client `Content-Type`; size limited on the server; stored name generated
      by the server; the uploader's permission on the target object checked.

**Dependencies and configuration** (NPM, Supply Chain, CI/CD, GitHub Actions, HTTP Headers, CSP)
- [ ] New package: exists, maintained, not published days ago, no unexpected install script; lockfile changed only by it.
- [ ] Workflow changes keep `permissions: {}`, SHA-pinned actions, no `pull_request_target`, no secret at job level
      without need.
- [ ] Security headers and CSP are not weakened (`frame-ancestors`, `nosniff`, `Referrer-Policy`, no `unsafe-eval`).

**Agent and tool output** (Secure Coding with AI, AI Agent Security)
- [ ] No invisible, bidi or zero-width character in the diff (`check-files.mjs` enforces; confirm it ran).
- [ ] Rules, skills, hooks, settings and CI changes are listed and explicitly approved by the owner.
- [ ] Out-of-scope changes are refused, not reviewed in passing.

**Tests** (Secure Coding with AI)
- [ ] No test or assertion deleted or weakened without the reason in the kickoff; no new mock that makes a security test
      prove nothing.
- [ ] A changed attack surface has the negative tests of `security-testing.md`, and they fail when the check is removed.
- [ ] Every acceptance criterion has its automated test, the test fails without the change, and a criterion changed by
      a revision has a changed test (`quality-gates.md` §8); changed-line coverage passes.

## 4. Finding template

```
F<n> — <title>
Severity: Critical | High | Medium | Low      Category: <checklist category>      CWE: <id if known>
Location: <path:line>
Description: <what the code does wrong>
Impact: <who can do what to whom because of it>
Reproduction: <concrete input or state → wrong result; the command or test that shows it>
Recommendation: <the change that removes the cause>
References: <OWASP sheet, CWE, rule file>
Status: open | fixed in <commit> | task <n> | accepted by the owner on <date>
```

## 5. Review summary (top of the kickoff's "Review" section)

```
Review <n> of <commit sha> — <verdict>
Scope: <files and entry points reviewed; baseline or diff>
Tools: <CI run link or local commands with exit codes; CodeQL and audit triage>
Findings: Critical <n>, High <n>, Medium <n>, Low <n>
Overall risk: <one sentence>
```

Severity: Critical — anonymous access to other users' data or to admin actions, secret exposure, remote code execution.
High — authenticated cross-user access, privilege escalation, stored XSS, auth bypass. Medium — limited exposure or a
missing defence-in-depth control. Low — hardening.
