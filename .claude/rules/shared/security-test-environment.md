# Security test environment and Supabase access

Read with [the testing contract](security-testing.md) and [test quality](security-test-quality.md).

## Existing development database: owner decision 2026-10-17

The owner explicitly permits tests against the EXISTING development Supabase database. A second Supabase account,
project or local stack is not mandatory. Do not block solely because a separate database has not been created.
Record the approved development project identity and scope every test write/cleanup to identifiable synthetic
records for the current run. Preserve existing people, listings, phone numbers and media; their presence does not
make them test fixtures. No full database reset, truncation, policy replacement or deliberate security mutation in
that shared DB. Destructive schema/policy/mutation scenarios require a disposable environment instead.

For shared development DB tests, inspect the actual schema/functions/RLS first and record the schema revision or
fingerprint. Setup must respect current constraints. Baseline and final checks verify unrelated records were not
changed, without copying their private values into artifacts. Real-data extraction is not required for this proof.
A disposable local/hosted test DB remains an option for CI and destructive/concurrent schema experiments.

## Which credentials are sufficient

| Capability | Required access |
|---|---|
| Application REST queries and RPCs | `NEXT_PUBLIC_SUPABASE_URL` plus the relevant API key/session and existing grants. |
| Create scoped test users/fixtures through server APIs | Existing `SUPABASE_SERVICE_ROLE_KEY` with the project URL; use server-side only. |
| Prove ordinary-user RLS | `NEXT_PUBLIC_SUPABASE_ANON_KEY` plus distinct real authenticated test-user sessions; also exercise anon requests. |
| Read RLS/function SQL definitions; run SQL/pgTAP | A PostgreSQL connection such as `DATABASE_URL`, with privileges for the stated operation and the required SQL runner/extensions. |

The owner's three existing variables (project URL, anon key and service-role key) can support API tests. They are
not PostgreSQL connection credentials and do not by themselves expose system-catalog definitions through REST.
Lack of `DATABASE_URL` is not a reason to claim API/RLS behavioral tests are impossible. Conversely, a working REST
query is not proof SQL/schema inspection or pgTAP is available. Diagnose the exact command and missing capability.

Get the PostgreSQL URI from the project's Supabase Dashboard **Connect** dialog. Its database password is distinct
from the API/service-role key; percent-encode reserved password characters. Match the connection method to the
runner's IPv4/IPv6 and session requirements. Do not invent the pooler hostname/username. Management API/account
tokens are not a default prerequisite or a substitute for stating which operation needs access.

A privileged connection may prepare the scoped fixtures. User authorization tests must use real user sessions or
the actual application role/claims, not `postgres` or `service_role` throughout. Label privileged bypass controls.
Missing permissions, extensions, schema definitions, users or runtime are reported by name without secret values;
only the affected proof remains blocked. Continue independent checks with available capabilities.

## Explicit configuration and external effects

Unit/component/application suites deny unexpected outbound requests by default across the HTTP transports their
dependencies use. An unconfigured `vi.fn()` returning undefined is not sufficient: a catch block can hide that
request. Unexpected I/O must be retained as a failing condition. Explicit handlers assert destination, method,
credential scope, body field allowlist and count.

Before integration/browser setup, validate the approved development/test project identity, parsed target URL,
per-run fixture scope and allowed provider account/bucket. Reject ambiguous or production targets. A hostname alone
cannot distinguish projects/accounts. Cleanup may delete only resources the current run owns. Real email/SMS,
payment and media effects use sandbox sinks or explicitly identified test resources. In particular,
`CLOUDINARY_DELETE_MODE=enabled` does not authorize deleting unrelated assets; a logged warning provides no guard.

Load required environment variables explicitly from the owner's approved source; do not auto-discover unrelated
development/production secrets. Sonnet may use the existing development credentials as the owner requested, with
validated target and scoped fixtures. This does not override Codex's prohibition on reading `.env.local`. Unit
suites require no live credentials. Redact values from console, traces, error objects and artifacts; keep them out
of tracked files and prompts. `DATABASE_URL` is server-only and must never use a `NEXT_PUBLIC_` prefix.

Each test resets state and restores spies, timers, environment and handlers. `vi.clearAllMocks()` does not restore
implementations or configuration. Use a fixed clock for expiry and deterministic seeds for generated attacks;
retain counterexamples. No arbitrary sleeps or flaky retries to obtain green. Never depend on file execution order.

Sources checked 2026-10-17:
[PostgreSQL connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres),
[API key capabilities](https://supabase.com/docs/guides/getting-started/api-keys),
[local CLI option](https://supabase.com/docs/guides/local-development/cli/getting-started),
[database testing](https://supabase.com/docs/guides/database/testing).
