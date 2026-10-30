# Security test environment and Supabase access

Read with [the testing contract](security-testing.md) and [test quality](security-test-quality.md).

## Existing development database: owner decision 2026-10-17

Owner clarification, 2026-10-17: the EXISTING approved development Supabase database may be used for tests and
reviewed, owner-approved corrective migrations. A second Supabase account, project or local stack is not mandatory.
Do not require a separate environment solely because an approved fix creates, changes or replaces schema objects,
RLS policies, grants, triggers or functions.

### Corrective migrations

A corrective migration repairs the intended application behavior or access controls. Before applying it, validate
the approved development project identity, inspect and record the current schema/functions/RLS revision or
fingerprint, and review the exact SQL, intended effects, write scope and rollback or recovery plan. Apply it under
the task-approved migration authority, then verify the real application/database paths and unrelated-data
preservation. This environment permission does not approve a particular SQL draft or waive task scope, review,
credentials, migration authority or evidence requirements.

### Test setup and deliberate security mutations

Scope test writes and cleanup to identifiable synthetic records owned by the current run. Preserve existing
people, listings, phone numbers and media; their presence does not make them test fixtures. Test setup must respect
current constraints. Do not reset or truncate the shared database, damage unrelated data, or deliberately weaken,
remove or replace its protections to plant a vulnerability for a negative or sensitivity test. Destructive
schema/policy experiments and deliberate security-weakening mutations require an isolated disposable environment.
This restriction applies to those experiments; it is not a blanket ban on reviewed corrective migrations.

After an approved corrective migration, normal integration/API/RLS regression checks may use this same development
database with scoped synthetic fixtures and verified cleanup. Baseline and final checks verify unrelated records
were not changed, without copying their private values into artifacts. Real-data extraction is not required.
If one test requires a disposable environment, identify that exact test and reason; continue independent checks
and approved corrective work that do not require it.

### One project before launch: owner decision 2026-10-21

Owner decision (Task 923, D67): "The whole project is still in development, so for now we can do everything on
production. There are no real users; every user in the database is a test user." The project has one Supabase
project (D66), so it is both production and the approved development database above. Until launch it is the approved test target: the
identity check (`SECURITY_TEST_TARGET=development` plus its recorded ref) accepts it, and its keys are the approved
development credentials. All other rules here still apply. The exception ends at launch: before a real person can
sign up, tests move to a separate project, this section is removed, and production targets are rejected again.

Owner decision (Task 923, D91, 2026-10-28), extending D67: "That is not a problem: right now the site is closed to
the world, nobody knows anything about it. So for now everything may be tested on the real database. When I release
the project to the world, then everything will have branches and separate databases." Until launch, the sensitivity
proof of a critical database case may break that case's protection on this project. This is an exception to
"Test setup and deliberate security mutations" above. The break may remove, disable or replace the one trigger,
policy, grant or function the case names. It is allowed only under all of these conditions:
- a scripted harness applies the break through `DATABASE_URL`, one break at a time;
- it records the catalog fingerprint of the touched objects before the break;
- it restores them in `finally`, and an identical fingerprint after the restore is part of the case's artifact;
- it acts only on the run's synthetic fixtures.
A failed restore or a fingerprint mismatch stops the run and is reported at once. Nothing is broken by hand. The
exception ends with D67's at launch.

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
per-run fixture scope and allowed provider account/bucket. Reject ambiguous or production targets, except under
"One project before launch" above. A hostname alone cannot distinguish projects/accounts. Cleanup may delete only
resources the current run owns. Real email/SMS, payment and media effects use sandbox sinks or explicitly identified
test resources. In particular,
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
