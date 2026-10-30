# Task 923 — review 24: Opus's SQL review of hardening v7.1 (2026-10-21)

Reviewed files (`docs/sessions/evidence/task923/db-catalog/`), hashes recomputed by Opus (`rv24-01-sha256.txt`):

| File | SHA-256 |
|---|---|
| `proposed-hardening.sql` (v7.1, 512 lines) | `8c8bcb3d6b02b260e70a0fd8b48c56908aaf2604bc37d21a36654abd9d2651c6` |
| `proposed-hardening-rollback.sql` (v7.1, 191 lines) | `fd1f13fca69f84493e391049a8261e6e6fbcb4627f8be31e9f9fa8c24abdfc88` |

Method. Review 23 (`review-23/rv23-02-sql-review.md`) reviewed every statement of v7 (`a8b0ae69…455e438` / `52bd460f…813db5`).
The executor kept byte-exact copies of those two files (`*.v7.sql.bak`, the reviewed hashes, `rv24-01`). Opus read the full
`diff -u` of each pair itself, so every statement that is not in the diff is the statement review 23 approved or decided.

## The diff, hunk by hunk

| Region | Change | Verdict |
|---|---|---|
| Header, lines 1–100 | v7.1 line; line 8 names hardening v8 as the home of R69, R73 (a), R75 (c) (f), R78 (a), R79 (b); S1–S5 listed; the S64 row and the STILL OPEN / D-quota block removed; change 8 reduced to "DELETED"; change 12 records Opus's decision on the currency fail-safe; item 6 and item 8 record Opus's decisions; change 16 says the file's own grants and that the real grantees are checked after the apply (S5); D49 and D58 added to the owner-decision line | as R82 (c) requires |
| Section 7 (`get_listing_owner_contact`), 405–420 | the quota table, its index, its RLS/revoke, `owner_contact_daily_limit()`, the three variables and the counting branch are removed. Kept: `auth.uid()` null → 42501 `unauthenticated`; `caller_is_active()` false → 42501 `account_blocked`; the existence test and the returned select both read `l.status = 'active' and u.deleted_at is null`. neither v7 nor v7.1 has a grant or revoke line for this function, so `create or replace` keeps its audited ACL | as R82 (b) requires |
| Section 8, 422–425 | both functions, their revokes and grants removed; a comment remains | as R82 (a) requires |
| Preflight (176–182) | unchanged: still refuses when `owner_contact_access`, `caller_access_state()` or `restore_inactive_account()` exists | as R82 (a) requires |
| Rollback header and line 87 | names v7.1; the four v7-only objects are dropped with `if exists` (59–60, 107–108), after the audited contact body is restored (88) | as R82 (b) requires |

Statement count: 71 − 11 (5 in section 7, 6 in section 8) = 60; PL/pgSQL bodies 13 − 1 = 12. Grammar reproduced (`rv24-02`).

## Counterexamples tried

- **Self-restore after the apply.** Nothing in the apply text creates or grants a restore path. `rls-harness` N07/N08 on the real
  database answer PGRST202 and the accounts stay marked. Before the apply this check cannot tell v7 from v7.1 (the executor says so,
  report item 4), so `SEC-DB-X-NO-SELF-RESTORE` after the apply remains required.
- **A slug the guard refuses.** `generateSlug` keeps only `[a-z0-9_\s-]` after its filter, turns `[\s_]+` into `-`, collapses `-{2,}`,
  trims both ends, cuts at 80 and trims again, and uses `listing` for an empty base. The result is `base(≤80) + '-' + base36 time (8)`,
  at most 89 characters and plain by construction. The only listing INSERT in `src` besides `createListing` is
  `src/tests/integration/fixtures.ts`, which writes through `service_role`; the guard returns early for that role.
- **Grants of `reauth_failures`.** The file revokes everything from `public, anon, authenticated` and grants `service_role` select,
  insert and delete. Supabase's default privileges can leave `service_role` more than that. `service_role` bypasses RLS anyway, and
  V753 expects only the owner and `service_role`, so this is not a defect (S5 as decided).

## Findings

| ID | Severity | Location | Observation | Resolution |
|---|---|---|---|---|
| T1 | P3 | `proposed-hardening-rollback.sql:87` | The comment says the quota drops are "above and below"; both are below (107–108). | A comment only. It does not change behaviour and is not worth a new SHA; fix it in v8's rollback. |
| T2 | P3 | `r19-02-v7-logic.txt:28` (P10), `r19-06-rls-harness.txt:207` (V753) | Harness labels still say "R64 (a) BLOCKED … the draft's fail-safe" and "v7 is not applied". | Evidence wording only; correct when the harnesses are next edited (post-apply run). |
| T3 | P3 — Opus's ambiguity | kickoff §34.3 R82 | "Change 7" in R82 means section `-- ── 7.` (owner contact), while the header's "change 7" is file storage. The executor read it correctly (report §1, INFERENCE). | No action; later kickoffs name the section heading. |
| T4 | P2 — Opus's design gap | kickoff §34.4 AC82; contract case `SEC-X-SRV-SLUG-PLAIN` (layer `server`) | R82 (d) changes a server action, and `shared/security-testing.md` requires a test of its real frontend consumer. AC82 names none for listing creation. | The post-apply revision (which has to add `listingSlugGuard.integration.test.ts` and the `accessHardening` cases anyway) adds a frontend case on the real `ListingFormShell` create path. It does not block the SHA approval. |

## Verdict on the SQL

**v7.1 is approvable from Opus's side.** S1, S2 (the rule kept, the generator fixed), S3, S4 and S5 of review 23 are closed in the
text. No new P0–P2 is found in either file. The owner may approve exactly
`8c8bcb3d6b02b260e70a0fd8b48c56908aaf2604bc37d21a36654abd9d2651c6` (apply) and
`fd1f13fca69f84493e391049a8261e6e6fbcb4627f8be31e9f9fa8c24abdfc88` (rollback).

Release order (§34.4, unchanged): (1) deploy `generateSlug`, (2) apply v7.1, (3) deploy the cabinet code of R66 (d) and R81 (b).
The cabinet code refuses every password change, e-mail change and account deletion until `public.reauth_failures` exists (§33).
