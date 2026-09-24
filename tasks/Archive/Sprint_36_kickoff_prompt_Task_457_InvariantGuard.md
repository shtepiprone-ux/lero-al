# Kickoff — Task 457 (Epic LV / Sprint 36, LV.4)
## Invariant guard + regression shield (CI grep-gate + per-status invariant test + registry flip ✅)

> **Executor:** Sonnet 4.6. **Orchestrator reviews the real diff, not the report.**
> **Epic:** `tasks/Epics/Epic_LV_Listing_Public_Visibility_Integrity.md` · **Sprint:** `tasks/Sprints/Sprint_36_Listing_Public_Visibility_Integrity.md`.
> **Builds on Task 454** (canonical `visibility.ts` policy/predicate/fragment + `VISIBILITY_POLICY_ANCHOR`),
> **Task 455** (`expired` status + lifecycle reconciliation — committed), **Task 456** (cabinet/admin surfacing +
> `formatVisibility` + `applyPublicEligibleButHidden` + the 45-test `visibility.test.ts` + the ⏳ registry row).
> **This is the LOCKING slice: tooling + tests + governance ONLY — it adds NO product behavior, NO UI, NO new
> runtime code path.** It must not change any public read result, any query, any lifecycle/status/`expires_at`
> value, or any rendered output. All P0 contract clauses (1–15) apply. **No git.**
> **This slice CLOSES Epic LV** (it is the last of 454→455→456→457).

> **Amendment 2026-06-18 (orchestrator hardening, 5 patches — no scope change):** (1) allowlist must be exact/narrow
> — **whole-file allowlisting forbidden** (except the canonical source + test/story globs), seeded empty on the
> current tree; (2) **stale allowlist entries FAIL** the normal gate, not `--report`-only; (3) detector covers
> **multiple Supabase literal variants** (`.eq`/`.in`/`.match`/`.filter`/`.or`/raw `expires_at`), not just
> `.eq('status','active')`; (4) detector logic is **one pure function** shared by the CI scan AND the self-test;
> (5) self-test exercises **≥3 bad variants + a good + a no-false-positive** snippet. Reflected in Part A/B +
> Negative flow + AC 1/2.

## Goal (one paragraph)

Make the canonical public-visibility predicate **un-bypassable in CI**. After 454 de-duplicated the predicate and
455 fixed the lifecycle, the remaining risk is *regression by new code*: a future PR re-introducing an inline
`.eq('status','active').gte('expires_at', …)` on a public `listings` read, diverging again from
`applyPublicVisibility`. Task 457 adds (a) a blocking `check:listing-visibility` grep-gate that FAILS any such
inline visibility literal outside the canonical module, (b) a per-`ListingStatus` invariant test proving the
query fragment and the badge predicate agree, (c) a gate self-test (planted violation FAILS, proving the gate is
real, CI-safe, no DB/server needed), and (d) flips the `critical-flow-registry` row ⏳→✅.

## Pre-read (rule-index: Regression/critical-flow + Docs/governance bundles)

`agent-contract.md` (clauses 1–15, esp. **15** regression-coverage), `backlog.md`, `critical-flow-registry.md`
(always — this is the row being flipped) · `tasks/Epics/Epic_RS_Regression_Shield.md` (slice contract + DoD for
a gate) · `docs/qa-rules.md` (test/error conventions + "Actionable Error" rule) · `docs/orchestrator-role.md`
("Regression-coverage gate" + "Rendered-evidence" N/A here) · `docs/ai-behavior.md` → Note 14 (global-change /
single-source) · the Epic + Sprint files · the canonical source `src/modules/listings/lib/visibility.ts`.
**No UI/design-system pre-read needed — this slice has NO UI surface (see "Mobile gate" below).**

## Grounding (verified by orchestrator 2026-06-18 — file:line)

- **Canonical module (the ONLY place the visibility literal may live):** `src/modules/listings/lib/visibility.ts`.
  - L8: `// VISIBILITY_POLICY_ANCHOR — do not remove (LV.4 grep-gate keys on this)` — the gate asserts this anchor
    still exists in this file (so the source can't be silently deleted/moved).
  - Exports the predicate + fragments: `isListingPubliclyVisible` (L32), `formatVisibility` (L76),
    `applyPublicVisibility` (L99) — emits `.eq('status', <eligible>)` / `.in('status', …)` + `.gte('expires_at', now)`,
    `applyPublicEligibleButHidden` (L138) — emits `.lt('expires_at', …)` / `.is('expires_at', null)` / `.or(…)`.
    These are the **legitimate, allowlisted** occurrences of the status/expiry literal.
- **Public read sites — already routed through the fragment by Task 454 (gate baseline must be GREEN):**
  `src/app/[locale]/listings/page.tsx:49` (`query = applyPublicVisibility(query)`), plus the 454-refactored
  `src/modules/listings/lib/queries.ts` (×3: `getListings`/`getLatestListings`/`getFeaturedListings`),
  `src/app/api/listings/route.ts`, `src/modules/listings/components/SimilarListings.tsx`, and `getSiteStats`
  (per 454's decision). **None of these should contain an inline `status='active'`/`expires_at` visibility
  literal anymore — confirm the gate reports 0 violations on the current tree before adding the planted test.**
- **Legitimate NON-public `from('listings')` reads/writes that MUST NOT trip the gate** (allowlist or scope out):
  - Admin reads: `src/app/admin/listings/page.tsx` (dynamic `.eq('status', statusParam)` from the filter — NOT a
    literal `'active'`; and the 456 audit panel uses `applyPublicEligibleButHidden`), `src/modules/admin/actions/index.ts`
    (writes: `.update`/`.delete` + moderation reads), `propertyTypes.ts:166`.
  - Cabinet reads: `src/app/[locale]/cabinet/page.tsx:50`, `src/modules/cabinet/components/ListingsTab.tsx` — filter
    via `VALID_VISIBILITY_GROUPS` / `VISIBILITY_DB_STATUSES` (semantic-layer groups), not a public-visibility literal.
  - Lifecycle/write paths: `src/modules/listings/actions/createListing.ts:52` (`expires_at` insert),
    `src/app/api/cron/listings-expiry/route.ts` (455 sweep, engine-driven), re-stamp in the single write path.
  - `recentlyViewedQueries.ts`, listing-detail `[slug]/page.tsx` reads (single-row by id/slug, not a list filter).
  - Unrelated `expires_at` on OTHER tables (email-change tokens `cabinet/actions/index.ts:410`) — different table.
  The gate must target **public LIST reads of the `listings` table that apply a status/expiry visibility literal**,
  not every `expires_at`/`'active'` token. Tests/stories/fixtures are excluded by path.
- **Existing test:** `src/modules/listings/lib/__tests__/visibility.test.ts` (45 tests post-456) already covers
  predicate↔badge equivalence (`formatVisibility`), the `applyPublicVisibility` filter chain, and
  `applyPublicEligibleButHidden` set/reason. LV.4 ADDS the query-fragment⇔predicate cross-invariant + the gate
  self-test (see Part B/C). Do not duplicate what already passes — extend.
- **CI wiring pattern to mirror:** `.github/workflows/governance-pr.yml` — each gate is one blocking step
  (`run: npm run <gate>`). The self-test pattern to copy is `check:hydration:verify` (L99) /
  `check:hydration:admin-config` (L101): a CI-safe self-test that proves the gate detects a known violation with
  NO server, NO DB, NO auth. Allowlist-style gates to mirror: `check:design-tokens` (`--report` /
  `--update-allowlist`), `check:i18n-dynamic` (manifest + baseline + `--report`).

## Scope — implement in this ORDER (self-validate each part before the next)

**Part A — `scripts/check-listing-visibility.mjs` + `npm run check:listing-visibility` (the grep-gate).**
- A read-only Node scanner (no deps beyond what other `check-*.mjs` use) that scans `src/**/*.{ts,tsx}` and FAILS
  (non-zero exit + a clear per-hit `path:line` report) when it finds an **inline public-visibility literal on a
  `listings` read outside the canonical module** — i.e. a Supabase query chain on `from('listings')` (or a query
  derived from it) that applies a literal `status`-`'active'` filter AND/OR an `expires_at` time comparison used
  as a visibility filter instead of calling `applyPublicVisibility` / `applyPublicEligibleButHidden`.
  - **🔴 The detector MUST cover the common Supabase literal variants, not just one style** (otherwise the gate
    blocks one regression spelling and waves the rest through):
    - `.eq('status', 'active')`
    - `.in('status', ['active'])` (and any array literal containing `'active'`)
    - `.match({ status: 'active' })`
    - `.filter('status', 'eq', 'active')`
    - `.or('…')` / `.gte`/`.lt`/`.is` strings containing `status.eq.active` and/or an `expires_at` visibility
      comparison (`expires_at.gte`/`expires_at.lt`/`expires_at.is`)
    - direct `.gte('expires_at', …)` / `.lt('expires_at', …)` / `.is('expires_at', null)` used as a list-visibility filter
  - **Detection may be regex/string-based** (house style — mirror `check-i18n-dynamic.mjs` / `check-design-tokens.mjs`),
    AST only if cleaner. The signature to flag is the status/expiry **visibility-filter literal**, not every
    `'active'`/`expires_at` token (status writes, single-row reads, and other tables are not hits).
  - **🔴 Detector logic lives in ONE pure, exported function** (e.g. `detectVisibilityViolations(source, path)`),
    and BOTH the CI scan (Part A) and the self-test (Part B) call **that same function** — the self-test must NOT
    re-implement a simplified check, or it would prove the wrong code. State this in the session log.
  - **Anchor assertion:** the gate also FAILS if `VISIBILITY_POLICY_ANCHOR` is missing from
    `src/modules/listings/lib/visibility.ts` (guards against the source being deleted/moved so violations "vanish").
  - **🔴 Allowlist must be EXACT and NARROW — whole-file allowlisting is FORBIDDEN.** An in-script `ALLOWLIST`
    array (or a sibling `docs/listing-visibility-allowlist.md` / `.json` — mirror whichever existing gate is
    closest), where each entry pins a **specific hit**: `path` + a **stable line / fingerprint / matched pattern**
    + a one-line reason. Rules:
    - **No whole-file allowlist entries** — the ONLY file-level exclusions permitted are (i) the canonical source
      `src/modules/listings/lib/visibility.ts` (it *is* the predicate) and (ii) the test/story/fixture path globs
      below. Allowlisting an entire real consumer file (e.g. `admin/listings/page.tsx`, `ListingsTab.tsx`) is
      forbidden — a future *different* inline visibility regression in that same file MUST still fail the gate.
    - **Do NOT seed allowlist entries for files that produce no detector hit.** On the current tree the baseline is
      0 violations, so the seeded allowlist should be **empty (or only the canonical-source exclusion)** — the
      legitimate non-public reads in Grounding use dynamic/semantic-group filters that are NOT the literal
      signature and therefore are not hits. Only add an entry if a real, justified hit actually appears.
    - **Stale allowlist entries FAIL the normal gate** (not just `--report`): a deleted/renamed/no-longer-matching
      allowlist entry makes `npm run check:listing-visibility` exit non-zero with a clear message (see Negative flow).
    - **Every allowlist entry carries a one-line reason.** `--report` (list hits, exit 0) and `--update-allowlist`
      modes like `check:design-tokens`. Exclude `**/__tests__/**`, `**/*.test.*`, `**/*.stories.*`, `src/stories/**`.
  - Add `"check:listing-visibility": "node scripts/check-listing-visibility.mjs"` (+ `:report` / `:update-allowlist`
    if you follow that pattern) to `package.json` scripts.
- **Baseline MUST be green on the current tree:** running the gate now (post-454/455/456) reports **0 violations**.
  If it reports any, STOP — either a real un-refactored public read slipped through (open a finding, do NOT
  silently allowlist it) or the detector is too broad (tighten it). Paste the green baseline transcript.

**Part B — gate self-test (CI-safe, proves the gate is real without touching real source).**
- Add a self-test mode/fixture mirroring `check:hydration:verify`: it calls the **same exported
  `detectVisibilityViolations` function** (NOT a separate simplified check) against **multiple in-script known-bad
  fixture strings — at least 3 of the variants** listed in Part A (e.g. `.eq('status','active')`,
  `.in('status',['active'])`, `.match({status:'active'})` / `.or('status.eq.active,…')`) and asserts EACH is
  DETECTED, plus a known-good snippet (`applyPublicVisibility(query)`) asserted to PASS, plus a "should-not-hit"
  snippet (a dynamic `.eq('status', statusParam)` / a status *write*) asserted NOT flagged (no false positive).
  Expose as `check:listing-visibility:verify` (or a `--verify-gate` flag). This is what CI runs to prove the gate
  is not a no-op and not over-broad — **no DB, no server, no auth, no network.**

**Part C — per-`ListingStatus` invariant test (regression shield, clause 15).**
- Extend `src/modules/listings/lib/__tests__/visibility.test.ts` (do NOT create a parallel file) with an
  **invariant** block that, for EVERY `ListingStatus` (all 7: `active|inactive|sold|rented|archived|pending|expired`),
  asserts the **query fragment and the predicate agree**: the set selected by `applyPublicVisibility` (the
  status/expiry filter it emits) is exactly the set for which `isListingPubliclyVisible(...).visible === true`,
  and that `formatVisibility` (the cabinet/admin badge source) reports `visible:true` iff and only iff the public
  predicate would show it — per status, with the expiry sub-cases (future / past / null) for the requires-unexpired
  statuses. An `active`+expired fixture ⇒ `visible:false, reason:'expired'`; `active`+null ⇒ `no_expiry`;
  every non-public status ⇒ `visible:false, reason:'status_not_public'`. (Reuse the existing mock-query harness in
  the file; this is the "predicate == badge, across every status" invariant the Epic DoD names.)
- **Planted-violation #1 (gate):** temporarily add an inline `.eq('status','active').gte('expires_at', new Date()…)`
  to a real public read (e.g. one line in `queries.ts`) → `npm run check:listing-visibility` FAILS with that
  `path:line`; remove → PASS. Paste both transcripts.
- **Planted-violation #2 (invariant test):** temporarily make `PUBLIC_VISIBLE_STATUSES.sold.publicEligible = true`
  (or break `formatVisibility`'s mapping) → the per-status invariant test FAILS (fragment vs badge diverge);
  restore → PASS. Paste both transcripts.

**Part D — wire the gate BLOCKING into CI + flip the registry row.**
- Add a blocking step to `.github/workflows/governance-pr.yml` (in the `governance` job, alongside the other
  `check:*` steps): `- name: Listing public-visibility invariant gate (Epic LV / LV.4)` → `run: npm run check:listing-visibility`,
  and a second step running the self-test `npm run check:listing-visibility:verify`. (Mirror the
  `check:hydration:verify` placement.) If a top-level `npm run governance` aggregate exists and is the canonical
  entry, also register it there — match how `check:design-tokens`/`check:i18n-dynamic` are aggregated.
- Flip `docs/critical-flow-registry.md` "Listing public visibility invariant" row **⏳→✅**: update the Status cell
  to ✅ with the command (`npm run check:listing-visibility` · `npx vitest run …/visibility.test.ts`) and a one-line
  note that the blocking gate + per-status invariant + planted-violation FAIL transcript now exist. Keep the
  coverage note's test count accurate (456 left it at 45 + the LV.4 additions — state the new total).

## 🔴 Mobile <640 full-width gate — NOT APPLICABLE (state this explicitly in the session log)

This slice adds **no UI, no component, no story, no rendered surface** — it is a CI script + a vitest file + a
workflow YAML + a docs row. The mobile full-width gate and the rendered verification matrix (agent-contract
clauses 11–13) therefore **do not apply**. The session log MUST state "No UI surface touched — clauses 11–13 N/A"
explicitly (so the reviewer doesn't route it back for a missing matrix). If, while implementing, you find yourself
editing ANY `.tsx` render output, a story, or a user-facing string — STOP: that is out of scope for LV.4, open a
finding.

## Current behavior to preserve (verify in the diff)

- **Zero behavior change.** No public read returns different rows; no query is altered; no lifecycle/status/
  `expires_at` value is written; no rendered output changes. The only product-source edit permitted is the
  TEMPORARY planted-violation lines, which MUST be reverted before completion (the final diff contains none).
- The existing 45 `visibility.test.ts` tests still pass unchanged; new tests are additive.
- All existing `governance-pr.yml` steps remain; the new steps are added, none removed/reordered destructively.
- The `VISIBILITY_POLICY_ANCHOR` comment and all `visibility.ts` exports remain intact.

## Positive flow (happy path)

- **Actor:** CI on a PR (and a developer running `npm run check:listing-visibility` locally).
- **Steps:** gate scans `src/**` → finds the visibility literal ONLY inside the allowlisted canonical
  `visibility.ts` → reports 0 violations → exits 0. The self-test runs the known-bad fixture → detects it → exits
  0 (proving liveness). The per-status invariant vitest passes for all 7 statuses.
- **Success state:** PR governance job green; registry row shows ✅; Epic LV DoD satisfied. **Post-conditions:**
  no source/behavior change; the predicate is now structurally un-bypassable (a future inline literal fails CI).

## Negative flow (every off-happy-path branch)

- **New inline visibility literal added to a public read (the regression we're blocking):** gate detects it →
  non-zero exit → `path:line` + remediation message ("route this read through `applyPublicVisibility` in
  `visibility.ts`") → CI job FAILS, PR blocked. (Planted-violation #1 proves this.)
- **Canonical source deleted/moved (anchor missing):** gate FAILS on the missing `VISIBILITY_POLICY_ANCHOR` →
  CI blocked (prevents "delete the source so nothing matches" evasion).
- **Legitimate new non-public read** (e.g. a new admin moderation query using a dynamic status param): must NOT
  trip the gate (dynamic `.eq('status', param)` is not the literal signature). If a genuinely-legitimate literal
  case arises, it is added to the allowlist WITH a reason — never blanket-suppressed. If ambiguous → STOP and ASK.
- **Gate becomes a no-op** (regex typo / over-broad exclusion): the self-test (Part B) FAILS because the known-bad
  fixture is no longer detected → CI blocked. This is the guard against a fake-green gate.
- **Invariant broken in policy** (someone flips a status to publicEligible, or breaks `formatVisibility`): the
  per-status invariant test FAILS (Planted-violation #2). 
- **Allowlist drift = normal-gate FAILURE (not a warning):** a deleted/renamed/no-longer-matching allowlist entry
  makes `npm run check:listing-visibility` exit non-zero with a clear message (e.g. "stale allowlist entry
  `<path:fingerprint>` matches nothing — remove it"). It must NOT silently pass and must NOT be downgraded to a
  `--report`-only notice — otherwise the allowlist rots and the gate weakens over time.
- **Non-listings `expires_at` (email tokens, etc.):** never flagged — gate is scoped to public `listings` reads.

## Acceptance criteria (each diff-verifiable, mapped to a flow)

1. `scripts/check-listing-visibility.mjs` + `package.json` `check:listing-visibility` exist; detector logic is one
   pure exported function covering **all the Part A literal variants** (`.eq`/`.in`/`.match`/`.filter`/`.or`/raw
   `expires_at` comparison), flags them on a public `listings` read outside `visibility.ts`, and asserts the
   `VISIBILITY_POLICY_ANCHOR` is present. Allowlist is **exact/narrow (no whole-file entries** except the canonical
   source + test/story globs), each entry pins path+fingerprint+reason, seeded **empty** on the current tree, and
   **stale entries FAIL the gate**. Baseline on the current tree = **0 violations** (transcript pasted).
2. Gate self-test (`check:listing-visibility:verify` or `--verify-gate`) calls the **same** detector function and
   detects **≥3 known-bad variants**, passes a known-good (`applyPublicVisibility`) snippet, and does NOT flag a
   dynamic `.eq('status', param)` / status-write snippet (no false positive) — CI-safe, no DB/server/auth
   (Part B; Negative flow "no-op" + "false positive").
3. Per-`ListingStatus` invariant test added to `visibility.test.ts`: fragment-selected set == predicate-`visible`
   set == `formatVisibility` "visible", across all 7 statuses with future/past/null expiry sub-cases; existing 45
   tests still green (Part C; clause 15).
4. **Two planted-violation transcripts:** (#1) inline literal on a public read → `check:listing-visibility` FAILS
   → revert → PASS; (#2) policy/badge break → invariant test FAILS → revert → PASS. Final diff contains NO planted
   lines (Part C; Negative flow).
5. `governance-pr.yml` runs `check:listing-visibility` AND its self-test as BLOCKING steps; no existing step
   removed; aggregate `governance` entry updated if one is canonical (Part D; Positive flow).
6. `docs/critical-flow-registry.md` "Listing public visibility invariant" row flipped ⏳→✅ with command +
   accurate test count + one-line note; coverage statement matches the real test set (Part D).
7. **Mobile/rendered gate N/A explicitly stated** in the session log (no UI touched); locale parity N/A (no new
   user-facing strings — confirm none added).
8. Self-validation: `tsc --noEmit`=0 · `npm run lint` 0 new · `npx vitest run src/modules/listings/lib/__tests__/visibility.test.ts`
   green · `npm run check:listing-visibility` + `:verify` green · file-integrity transcript (every touched file:
   0 NUL, parses, `node --check` the `.mjs`) · AC-by-AC self-audit citing Positive/Negative flows · "Files
   Changed" table · scope clean (tooling/tests/governance only — zero product-behavior change). **No git emitted.**

## Out of scope (do NOT do here)

- Any product/UI/behavior change, any new public-read refactor (454 already did it — if you find an un-refactored
  one, open a FINDING, don't fix it inline under 457).
- Owner-facing renew CTA (was 456-deferred), `getSiteStats` re-decisions (454), DB-level changes (455).
- Broadening the gate to non-`listings` tables or to write paths.

## Reminder

LV.4 makes the post-454/455/456 result **un-mergeable to regress**. On approval + commit, **Epic LV is CLOSED**
(454 ✅ · 455 ✅ · 456 ✅ · 457 ✅): single predicate, no silent public-eligible-but-hidden state, operator-visible
reasons, and a blocking CI invariant guard with a green registry row. Update `docs/backlog.md` Last Session + add
the session log; the orchestrator emits the commit and the Epic-LV-closed backlog tidy on review.
