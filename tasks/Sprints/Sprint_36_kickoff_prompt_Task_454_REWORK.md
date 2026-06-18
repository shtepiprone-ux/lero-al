# Kickoff — Task 454 REWORK (Epic LV / Sprint 36, LV.1)
## Close the single-source-of-truth gaps before Task 454 is approvable

> **Executor:** Sonnet 4.6. **Status of base task:** implemented, **NOT approved** — routed back after
> orchestrator diff review (2026-06-18). The architecture is right; four concrete defects block approval.
> **Do not re-architect.** Keep everything that works; fix exactly the items below. Original kickoff:
> `tasks/Sprints/Sprint_36_kickoff_prompt_Task_454.md` (all its contract clauses still apply — read it first).
> **Still in force:** no write-path changes (`status`/`expires_at` writes are LV.2); equivalent filter chain
> (assert builder calls + returned rows, not raw SQL strings); literal `'active'` only in the policy/tests.

## Verified-good (do NOT touch)

- `src/modules/listings/lib/visibility.ts` — `PUBLIC_VISIBLE_STATUSES`, `isListingPubliclyVisible`,
  `HiddenReason`, `VISIBILITY_POLICY_ANCHOR`. Keep as the canonical module.
- `queries.ts` public reads (`getFeaturedListings`/`getLatestListings`/`getListings`) routed through
  `applyPublicVisibility`. No write-path calls present — keep it that way.
- The vitest status-coverage suite (all 6 statuses) — extend, don't rewrite.
- `data-access-rules.md` rule — keep.

---

## Blocker 1 (MUST FIX) — audit script duplicates the canonical policy

`scripts/audit-listing-visibility.mjs` contains `// Mirror the canonical policy from …visibility.ts` plus its
own `PUBLIC_VISIBLE_STATUSES` and its own `classifyHiddenReason`. This is a **second source of truth** — the
exact divergence class Task 454 was created to eliminate. Today it matches; the moment LV.2/LV.3 edit the
policy and miss the mirror, the audit silently lies.

**Required fix (preferred):** the audit script **imports the canonical policy + predicate** instead of
mirroring them. Options, pick the one that keeps the runner simple and `tsc`/lint green:
- Extract the pure, runtime-safe policy + `isListingPubliclyVisible` into a module the audit `.mjs` can import
  directly (e.g. keep them dependency-free in `visibility.ts` and import via a build step / `tsx` runner, or
  factor a `visibility.policy.mjs`/`.ts` that both `visibility.ts` and the script import). The script must call
  the **canonical** `isListingPubliclyVisible`/policy to classify rows — no local copy of the rule.

**Minimum acceptable fallback (only if a shared import is genuinely infeasible with the current runner, and you
STOP and ASK first):** keep the runner self-contained BUT add a hard test that **fails on drift** — it imports
the canonical `PUBLIC_VISIBLE_STATUSES` and asserts the script's mirror is deep-equal, and asserts the script's
`classifyHiddenReason` agrees with `isListingPubliclyVisible` across all 6 statuses × {unexpired, expired,
null-expiry}. A silent mirror with no drift-guard is **not** acceptable.

**AC1:** no second definition of the visibility rule can drift from `visibility.ts` — either the script imports
the canonical source, or a test provably fails if the mirror diverges. Verifiable at file:line.

---

## Blocker 2 (MUST FIX) — `applyPublicVisibility` is not actually future-proof for mixed policy

Current logic:
```
const anyRequiresUnexpired = eligibleStatuses.some(s => …requiresUnexpired)
…
if (anyRequiresUnexpired) q = q.gte('expires_at', now)   // applied to the WHOLE query
```
If a future policy marks two statuses public-eligible with **different** `requiresUnexpired`
(e.g. `active:{…unexpired:true}` + `reserved:{…unexpired:false}`), this applies `expires_at>=now()` to **all**
eligible rows — so `reserved` rows are wrongly expiry-gated in the DB query while `isListingPubliclyVisible`
would consider them visible. That re-introduces the predicate-vs-query divergence this Epic forbids. The code
*looks* general but isn't.

**Required fix — pick ONE, and state which in the session log:**
1. **Support mixed policy correctly** via OR-groups: rows are visible if
   `(status IN <unexpired-required> AND expires_at>=now()) OR (status IN <no-expiry-required>)`. Implement with
   Supabase `.or(...)` so the DB query matches `isListingPubliclyVisible` for ANY policy shape. Add tests for a
   synthetic mixed policy proving query rows == predicate result.
2. **Explicitly refuse mixed policy until LV.2/LV.4** — if the eligible set contains differing `requiresUnexpired`
   values, `applyPublicVisibility` throws a clear error (and a test asserts: today's single-policy works; a
   synthetic mixed policy throws). This keeps the helper honest rather than silently wrong.

Either is acceptable; silent over-application is not. (Option 2 is smaller and fine for now — your call, but
record it.)

**AC2:** for any policy shape, the DB filter chain and `isListingPubliclyVisible` agree — proven by a test that
constructs a mixed policy (real correctness OR explicit throw). Verifiable at file:line.

---

## Fix 3 (MUST RECORD) — `getSiteStats` is a real, intended behavior change

`getSiteStats` now counts only publicly-visible listings (routed through `applyPublicVisibility`); it previously
counted `status='active'` with no expiry filter, so the homepage headline could drop. The original kickoff said:
do not make a silent headline-number change without an explicit decision. The product direction (truthful count)
is accepted by the owner — but it must be **on record**, not implied by a code comment.

**AC3:** the session log contains an explicit line:
`getSiteStats alignment = intended visible behavior correction, accepted by owner/orchestrator 2026-06-18
(homepage count now reflects actually-visible listings; prior count overstated by active-but-expired rows).`
No code change required beyond what exists; this is a recorded-decision AC.

---

## Fix 4 (MUST COMPLETE deliverable) — actual audit result, or a documented reason it couldn't run

The kickoff requires the audit-report **path + row count** in the session log. The report currently documents the
script but not a run result.

**AC4:** either (a) run `node scripts/audit-listing-visibility.mjs` (or the chosen runner) and paste the
generated report path + totals (`total eligible`, `hidden`, by-reason breakdown) into the session log and commit
the generated report under `docs/governance-reports/`; OR (b) if `.env.local` / service-role is unavailable in
your environment, state that explicitly and record the **expected** report path
(`docs/governance-reports/<YYYY-MM-DD>-public-eligible-but-hidden-listings.md`) and the exact command the owner
must run. Do not leave it ambiguous.

---

## Guardrails (unchanged from base task)

- **No write-path changes.** No `status`/`expires_at`/insert/update/delete. Confirm `queries.ts` and any touched
  file still have zero write calls (grep transcript in the log).
- **No behavior change to public reads** beyond the accepted `getSiteStats` alignment. The
  `getListings`/`getLatestListings`/`getFeaturedListings` row sets, ordering, pagination, columns, and error
  propagation stay identical (assert on builder calls + rows).
- All 6 statuses still covered; extend tests, don't shrink them.

## Self-validation before "complete"

`npx tsc --noEmit`=0 · `npm run build` if non-trivial · the visibility test suite green (incl. the new drift-guard
and mixed-policy tests) · file-integrity transcript (clause 14) · AC1–AC4 self-audit table each → file:line or
recorded-decision line · updated "Files Changed" table · grep transcript proving no write-path call. **Do NOT run
git** — the orchestrator emits commits after re-review.

## Acceptance summary (orchestrator will verify each against the real diff)

1. **AC1** — audit no longer has an independent policy copy that can drift (canonical import OR enforced drift-guard test).
2. **AC2** — `applyPublicVisibility` matches `isListingPubliclyVisible` for any policy shape (mixed-policy OR-groups OR explicit throw), proven by test.
3. **AC3** — `getSiteStats` behavior change explicitly accepted + recorded in the session log.
4. **AC4** — audit run result (path + counts) in the log, or a documented can't-run reason + expected path + command.
5. Scope unchanged: no write path; public-read row sets unchanged except accepted `getSiteStats`; 6-status coverage intact.
6. **Reminder:** this task is still LV.1 only — it does NOT fix the production bug; Epic LV stays incomplete until LV.2 + LV.3 + LV.4.
