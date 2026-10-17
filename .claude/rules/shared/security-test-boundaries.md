# Security cases at frontend, server and database boundaries

Read with [the testing contract](security-testing.md) and [quality rules](security-test-quality.md). Select actual
surfaces from source. Every product task needs frontend AND server coverage; this catalogue adds applicable threats.

## Actor and resource matrix

For each exposed operation, enumerate anonymous, owner A, unrelated user B, agent, moderator with/without the
permission, admin, blocked/suspended/deleted account and expired/revoked session. Include cross-company access where
applicable. Expected access comes from product/role rules; admin status does not authorize returning credentials.

Exercise direct requests and actual actions as well as UI controls. Change resource IDs, nested owner IDs and
privileged fields independently. A hidden/disabled button proves presentation only. Check allowlisted output fields,
object/field ownership, unchanged victim records and zero forbidden effects for every relevant denial.

## Frontend and data disclosure

- Render real profile, listing, support and admin consumers with synthetic victim-only markers. Verify allowed
  fields and actions, hostile text/HTML/URLs, error states, duplicate submission and optimistic rollback. Preserve
  legitimate Unicode/i18n input; rejecting ordinary non-Latin names is not an injection defense.
- Assert request destinations and body fields: no passwords, tokens, private profile/payment fields or privileged
  flags to analytics, unrelated providers, URLs or public APIs. Assert public UI receives only its declared DTO.
- For sensitive flows, inspect HTTP bodies, headers, raw SSR/RSC payloads and hydrated DOM, not only visible text.
  Data hidden by CSS or omitted from one component can still be disclosed in the response.
- Browser checks cover real dangerous-link/HTML contexts, CSP, applicable CSRF/Origin rules, CORS and security cookie
  attributes. DOM emulation and source regexes alone cannot prove browser enforcement. Verify allowed same-origin
  traffic still works; missing Origin behavior must follow the actual endpoint contract.
- Log in as A, obtain private data, sign out/switch to B, navigate/back/refresh/prefetch; B must not receive A's data
  from HTTP caches, Next caches, client state, storage or browser restoration. Confirm authenticated responses use
  their intended caching policy in the running app. Cache stubs are not evidence of cross-session isolation.
- Inspect the built client dependency graph/bundles with synthetic secret sentinels for forbidden server imports or
  secret values. `server-only` aliases to no-ops and secret-like variable-name scans cannot prove this boundary.

## Server, auth and account lifecycle

- Test actual exported Server Actions and route handlers. Session-derived identity and authorization must precede
  sensitive reads/writes, and guard results must control execution. Check forged role/actor/owner/permission input,
  unexpected fields, null/wrong types, bounded sizes, malformed encodings and PostgREST filter injection at the
  actual input boundary. Test exact safe output as well as unchanged protected state.
- Test missing/invalid/expired credentials, blocked accounts, permission revocation, database/auth-provider errors
  and thrown dependencies. Deny privileged operations when access cannot be established; do not turn dependency
  failure into a successful or empty-but-authorized response. Error messages follow existing public error contracts.
- Signup/profile/admin update must reject or discard role, verification, owner, premium and protected status fields
  from unauthorized input. Keep privileged and self-service allowed-column contracts separate.
- Password/email recovery, OAuth/callbacks and one-time links cover trusted destinations, enumeration-safe public
  responses where required, expiry boundaries, wrong recipient, replay and concurrent consumption. Verify a valid
  recovery/control still succeeds and secrets do not enter logs, responses or unrelated URLs.
- Test rate-limit and anti-automation decisions on auth, contact, uploads, public writes and expensive operations:
  boundary counts/time windows, identity/IP provenance, concurrent requests and provider outages. Client-side
  throttling does not prove a server limit. A blocked request must not trigger an external paid operation.

## Database, RLS, grants, RPC and concurrency

Use the approved development DB on scoped synthetic fixtures, or a reproducible disposable schema, under
[environment rules](security-test-environment.md). Label mocked guards separately from PostgreSQL enforcement.
Assert `anon`/`authenticated` table and column grants,
RLS enablement, USING and WITH CHECK behavior for SELECT/INSERT/UPDATE/DELETE, and denied owner/role reassignment.
Verify unauthorized SELECT returns no victim data, including projections, joins, views, counts and RPC results.

Check each exposed function's execute grants, invoker/definer mode, fixed safe search path, qualified object access
and actor/field checks. Verify views use the intended invoker policy and no privileged RPC bypasses object access.
Include real application-action/API positive tests: SQL alone does not prove the application chose the right client.

When used, test private Storage object read/list/write/delete and signed-URL expiry/scope; test Realtime channels
for cross-user disclosure before and after membership/session changes. Table RLS results do not establish these
separate service policies. Public listing images and public contact fields follow explicit publication rules.

Use two actual concurrent transactions/requests for token single-use, premium activation, quota/rate limits and
ownership changes where atomicity matters. Assert unique durable outcomes and safe retry/recovery after partial
failure; `Promise.all` over a synchronous in-memory fake cannot prove database locking or constraints.

## Uploads, outbound fetches and notifications

Exercise MIME/content mismatch, limits before expensive processing, invalid images, path traversal, ownership,
signed upload grants, tampered/expired/replayed grants and cross-user media deletion. Test actual decoding/adapter
contracts where relied upon. Private outbound fetches must not follow attacker-controlled targets into internal
services or leak credentials across redirects; use controlled local targets, never real internal network probes.

Email/notification tests assert recipient ownership, authorization, exact public fields and no tokens/raw passwords
in logs. Test templates in their real output context, including HTML/attribute/URL injection and recipient/header
manipulation. An arbitrary `userId` plus caller-controlled body must not create a privileged mail/notification relay.

## Logging, monitoring and CI artifacts

Inject distinct synthetic secrets/PII into request bodies, URLs, headers, dependency errors and provider payloads.
Observe console, structured logger/Sentry adapters, analytics, traces and test artifacts; verify forbidden markers
are absent and permitted diagnostic code/event/correlation fields remain. Never compare only a sanitized message
while ignoring its attached context/stack. Audit failure paths as well as success paths.

Release evidence also needs applicable dependency/secret/SAST scans, deployed configuration checks and authorized
staging DAST/manual review. Unit coverage gives no universal security guarantee; missing runtime proof stays unverified.

Sources checked 2026-10-17:
[OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html),
[OWASP logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Supabase testing](https://supabase.com/docs/guides/local-development/testing/overview),
[Next.js data security](https://nextjs.org/docs/15/app/guides/data-security).
