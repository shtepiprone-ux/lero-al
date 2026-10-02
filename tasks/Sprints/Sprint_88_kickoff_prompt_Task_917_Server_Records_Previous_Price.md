# Task 917 — The server records the previous price when the owner lowers it

**Sprint 88** (`tasks/Sprints/Sprint_88_A_Struck_Price_Means_A_Reduction.md`) · **P1** · **QA profile Q4** · Executor:
Sonnet via `.claude/skills/execute-task/SKILL.md`. Evidence goes to `docs/sessions/evidence/task917/`.

## 1. Mode and task type

`TASK DESIGN` → implementation task. Type: **DB / Server Action** (write-path semantics of `listings.price_old`). No
visible component, Story or style changes. Classification: **data-only**. The UI that reads `price_old` (card badge,
struck price, detail block) is unchanged; it simply starts receiving data.

## 2. Objective

When a listing owner saves a lower price, the server stores the previous price in `listings.price_old`, so the
existing "price reduced" badge and struck old price appear on every listing surface. When the price is raised back
to the old price or above, the server clears `price_old`. The client can no longer write `price_old`.

## 3. Verified context

All facts were measured by Opus on 2026-10-02, working tree, Windows (`node.exe -p process.platform` → `win32`).

| # | Label | Fact | Evidence |
|---|---|---|---|
| F1 | FACT | Listing #22 was updated 2026-10-02 21:39 UTC with `price 1000`, `price_old null`. The owner reported lowering its price and seeing no badge or struck price. | anon REST read `listings?select=public_id,price,price_old,updated_at&order=updated_at.desc` |
| F2 | FACT | No public listing has a non-null `price_old` (`listings?select=public_id&price_old=not.is.null` → `[]`). | same, anon key |
| F3 | FACT | `updateListing` writes `.update(parsed.data)` (the validated form payload), and its pre-read selects only `id, slug, user_id, status`. Nothing compares the new price with the stored one. | `src/modules/listings/actions/updateListing.ts:30-34, 57-63` |
| F4 | FACT | `price_old` is `z.number().positive().optional()` in `listingBaseSchema`. | `src/modules/listings/validations/index.ts:9` |
| F5 | FACT | The only form field for `price_old` is in `steps/StepBasicInfo.tsx:143-155`. No file imports `StepBasicInfo`. Its directory is deleted by **905** (Sprint 86). The live form has no such field. | read-only grep for `StepBasicInfo` and `field_price_old` across `src` |
| F6 | FACT | The edit page loads `price_old` into the form state (`[slug]/edit/page.tsx:32, 86`). The form therefore sends the stored value back unchanged on save. | that file |
| F7 | FACT | `createListing` inserts `{ ...parsed.data, slug, user_id, status, expires_at, views_count }`, so a crafted payload could store a `price_old` at creation. | `src/modules/listings/actions/createListing.ts:38-53` |
| F8 | FACT | The only writers of `listings.price` in `src` are `updateListing` (`.update(parsed.data)`) and `createListing` (insert). `src/modules/admin/actions/index.ts:91` updates only `is_premium` / `premium_until`. | grep of `from('listings')` with `update`/`insert` across `src` |
| F9 | FACT | Display predicates already require a real reduction: card badge `listing.price_old && listing.price < listing.price_old` (`ListingCard.tsx:99`), detail `isPriceReduced` (`[slug]/page.tsx:221`). **912** makes the card's struck price use the same predicate. | those lines |
| F10 | FACT | No SQL migrations are tracked in this repository (`git ls-files` has no `migrations/*.sql`), so a DB trigger cannot be delivered or reviewed here. | `git ls-files` |
| F11 | FACT | The price-alert cron reads `price` and `last_notified_price`, never `price_old`. | `src/app/api/cron/price-alerts/route.ts:62, 80` |
| F12 | FACT | `updateListing.smoke.test.ts` mocks `@/lib/auth/server`, `@/lib/auth/blockCheck`, `@/modules/listings/validations`, `@/i18n/routing` and Cloudinary, and asserts the failure branches (`not_found`, `validation_failed`, update error). | `src/modules/listings/actions/__tests__/updateListing.smoke.test.ts:1-60` |
| F13 | FACT | Worktree at design time: `updateListing.ts`, `createListing.ts`, both smoke tests, `src/modules/listings/domain/` and `docs/domain-rules.md` are clean (no `git status --porcelain` entry). Other paths are dirty with Task 857's admin work; none is in this task's scope. | `git status --porcelain` |

**Owner decisions (Sprint 88 plan, quoted there verbatim):** **D88-2** automatic, server-side, no form field; **D88-3**
keep the highest earlier price.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| R1 | D88-2 | A pure function `computeNextPriceOld` in `src/modules/listings/domain/priceOld.ts` implements the rule in §10.1 and nothing else (no I/O). | P0 | unit test, every row of §10.2 | Confirmed |
| R2 | D88-2 | `updateListing` reads the stored `price, price_old, currency` before the write and stores `price_old = computeNextPriceOld(...)`. A `price_old` in the client payload never reaches the database. | P0 | smoke test asserts the `.update()` argument | Confirmed |
| R3 | D88-2 | `createListing` always inserts `price_old: null`, whatever the payload carries. | P1 | smoke test asserts the `.insert()` argument | Confirmed |
| R4 | D88-3 | Several reductions keep the highest earlier price (120 000 → 100 000 → 90 000 stores 120 000). | P0 | §10.2 rows 2, 3 | Confirmed |
| R5 | D88-2 | Raising the price to the stored old price or above clears `price_old`. A partial raise that stays below it keeps it. | P0 | §10.2 rows 4, 5, 6 | Confirmed |
| R6 | Assumption A1 | A currency change clears `price_old`. | P1 | §10.2 row 7 | Assumed (A1) |
| R7 | Rule hygiene | `docs/domain-rules.md` states that `price_old` is server-owned and how it is computed, next to the existing badge/price lines (`:171-172`). | P2 | doc diff | Confirmed |
| R8 | Existing behaviour | Every existing `updateListing` / `createListing` branch keeps its result and error code (unauthenticated, blocked, not_found, permission, validation_failed, update/insert error, image handling, revalidation). | P0 | both smoke suites green, unchanged assertions | Confirmed |

## 5. Assumptions and open questions

- **A1 (reversible):** a currency change clears `price_old`. A struck price in another currency is not "the owner lowered
  the price" (the Sprint 88 owner wording), and the two amounts cannot be compared without an exchange rate. One line
  of §10.1 to change if the owner disagrees.
- **A2:** stale `price_old` values on non-public listings (`UNKNOWN` whether any exist) normalize on their next save
  through the same rule. No backfill.
- **UNKNOWN — direct REST writes.** RLS lets an owner update their own row. A crafted Supabase REST call can still set
  `price_old` directly, bypassing the action. That was already true before this task. Closing it needs a DB trigger or
  a column grant, and this repository tracks no migrations (F10). This is out of scope and recorded as a limitation;
  the owner decides whether to file it.
- **Concurrency:** two simultaneous saves of the same listing could both read the same stored price. Not handled:
  last write wins, as for every other field today.

## 6. Pre-read rule bundle

1. `docs/golden-rules.md` (GR-0…GR-6; this task emits GR-2 and GR-4 receipts and states that GR-1/GR-3 do not apply)
2. `docs/agent-contract.md`
3. `docs/data-access-rules.md`
4. `docs/rls-rules.md`
5. `docs/domain-rules.md` (§ badges/price, `:165-180`)
6. `docs/qa-rules.md`
7. `docs/qa-profiles.md` (Q4)
8. `docs/critical-flow-registry.md` rows "Listings display — price + date formatting" (`:62`) and "Listing card
   rendering" (`:63`)
9. This kickoff and the Sprint 88 plan.

## 7. Scope

- `src/modules/listings/domain/priceOld.ts` (new) and `src/modules/listings/domain/priceOld.test.ts` (new)
- `src/modules/listings/actions/updateListing.ts`
- `src/modules/listings/actions/createListing.ts`
- `src/modules/listings/actions/__tests__/updateListing.smoke.test.ts`
- `src/modules/listings/actions/__tests__/createListing.smoke.test.ts`
- `docs/domain-rules.md` (R7)
- `docs/backlog.md` (task state line only) and `docs/sessions/2026-MM-DD-task917-server-records-previous-price.md`

## 8. Out of scope

- Any UI file, Story or style. The card/detail/contact display is **912** (Sprint 88) and the card redesign is **918**
  (Sprint 89).
- `steps/StepBasicInfo.tsx` and the rest of `steps/`: deleted by **905**. Do not edit them.
- `listingSchema` / `step1Schema` / `ListingFormData`: `price_old` stays in the schema so the edit form still parses.
  The server ignores the value instead (R2).
- A DB trigger, migration or RLS change (F10, §5 UNKNOWN).
- The price-alert cron (F11).

## 9. Current and required behavior

| Situation | Current | Required |
|---|---|---|
| Owner lowers price 100 000 → 90 000 | `price_old` unchanged (null) → no badge, no struck price | `price_old = 100 000` → badge + struck old price (existing UI) |
| Lowered again 90 000 → 80 000 | — | `price_old` stays 100 000 (D88-3) |
| Raised to 95 000 (still below 100 000) | — | `price_old` stays 100 000 |
| Raised to 100 000 or more | — | `price_old = null` |
| Price unchanged, other fields edited | `price_old` written back from the form | `price_old` recomputed from the stored row: unchanged when still valid, null when the stored value was not above the price |
| Currency changed | — | `price_old = null` (A1) |
| Client sends `price_old` | stored | ignored |
| Create | payload `price_old` stored | `price_old = null` |

**Preserve:** every return value, error code, `console.error` call, permission check, image replacement and Cloudinary
cleanup, and every `revalidatePath` call in both actions.

## 10. Implementation requirements

### 10.1 The rule

```ts
export interface PriceOldInput {
  prev: { price: number; priceOld: number | null; currency: string }
  next: { price: number; currency: string }
}
export function computeNextPriceOld({ prev, next }: PriceOldInput): number | null
```

1. If `next.currency !== prev.currency` → `null` (A1).
2. `ceiling = Math.max(prev.price, prev.priceOld ?? 0)`.
3. If `next.price < ceiling` → `ceiling`; otherwise → `null`.

This one rule covers a first reduction, repeated reductions (D88-3), a partial raise, a full raise, an unchanged price,
and stale legacy values (`priceOld <= price`).

### 10.2 Rule table: `priceOld.test.ts` asserts every row

| # | prev.price | prev.priceOld | next.price | currency change | Expected |
|---|---|---|---|---|---|
| 1 | 100000 | null | 90000 | no | 100000 |
| 2 | 90000 | 100000 | 80000 | no | 100000 |
| 3 | 100000 | 120000 | 90000 | no | 120000 |
| 4 | 90000 | 100000 | 95000 | no | 100000 |
| 5 | 90000 | 100000 | 100000 | no | null |
| 6 | 90000 | 100000 | 110000 | no | null |
| 7 | 90000 | 100000 | 80000 | yes | null |
| 8 | 100000 | null | 100000 | no | null |
| 9 | 100000 | null | 110000 | no | null |
| 10 | 100000 | 80000 (stale) | 100000 | no | null |
| 11 | 100000 | 100000 (stale) | 90000 | no | 100000 |

### 10.3 Wiring

- `updateListing.ts`: widen the existing pre-read select to `id, slug, user_id, status, price, price_old, currency`.
  After `listingSchema.safeParse` succeeds, write
  `{ ...parsed.data, price_old: computeNextPriceOld({ prev: { price: existing.price, priceOld: existing.price_old, currency: existing.currency }, next: { price: parsed.data.price, currency: parsed.data.currency } }) }`.
  Use **no second query**; the existing pre-read is the source.
- `createListing.ts`: insert `price_old: null` after the spread, so the payload cannot override it.
- Types come from `src/types/database.ts`; no `any`.
- `docs/domain-rules.md`: under the existing price line (`:172`), add: "`price_old` is server-owned. `updateListing`
  sets it with `computeNextPriceOld` (`src/modules/listings/domain/priceOld.ts`): the highest earlier price while the
  current price is below it, null after a raise to or above it or a currency change; create stores null; a client value
  is ignored (Sprint 88 D88-2/D88-3, Task 917)."

### 10.4 Tests

- `priceOld.test.ts`: the 11 rows of §10.2, as `it.each`.
- `updateListing.smoke.test.ts`: add cases that assert the argument passed to `.update()`:
  - (a) stored 100000/null, payload price 90000 → `price_old: 100000`;
  - (b) payload carries `price_old: 5` with an unchanged price → `price_old: null`;
  - (c) currency change → `price_old: null`.

  Keep every existing assertion unchanged.
- `createListing.smoke.test.ts`: add a case where the payload has `price_old: 123456` and assert that the `.insert()`
  argument has `price_old: null`.
- **Two-armed proof.** Run the new smoke cases against the unchanged actions first and save the red output to
  `docs/sessions/evidence/task917/01-red.txt`. Run them again after the change and save the green output to
  `02-green.txt`.

## 11. Positive and negative flows

**Positive:** the owner edits listing #22, lowers the price and saves. The stored row now has `price_old = previous
price`. On `/listings` the card shows the "Ціну знижено" badge and the struck old price (once 912 has landed, the card's
struck price uses the same predicate; the badge does not need 912).

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | Yes | `listingSchema` | Unchanged: invalid payload → `validation_failed`, nothing written | existing smoke case stays green |
| Authorization/RLS | Yes (preserve) | `checkEditPermission` | Unchanged: denied edits return before any write | existing smoke cases |
| Listing not found | Yes (preserve) | pre-read | Unchanged `not_found` | existing smoke case |
| DB update error | Yes (preserve) | `updateListing` | Unchanged error return + `console.error` | existing smoke case |
| Client-sent `price_old` | Yes | R2/R3 | Ignored | §10.4 (b) and the create case |
| Offline/network | No | global network layer | Unchanged | — |
| Concurrent writer | No | §5 | Last write wins, as today | — |

## 12. Acceptance criteria

- **AC1 [R1, R4, R5, R6]** Given each row of §10.2, when `computeNextPriceOld` runs, then it returns that row's
  expected value.
- **AC2 [R2]** Given a stored listing at 100000 with `price_old` null, when `updateListing` saves price 90000, then the
  `.update()` argument carries `price_old: 100000`.
- **AC3 [R2]** Given a payload carrying `price_old: 5` with an unchanged price, when `updateListing` saves, then the
  `.update()` argument carries `price_old: null`.
- **AC4 [R3]** Given a create payload carrying `price_old`, when `createListing` inserts, then the `.insert()` argument
  carries `price_old: null`.
- **AC5 [R8]** Given the pre-existing smoke assertions of both actions, when the suites run, then each still passes
  with its assertion text unchanged.
- **AC6 [R2, R4]** Given the two-armed proof, when the new smoke cases run against the pre-change actions, then at
  least one fails; after the change, all pass.
- **AC7 [R7]** Given `docs/domain-rules.md`, when read, then it states the server-owned rule with a pointer to
  `priceOld.ts`.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none.`

## 13. QA profile and verification plan

**Q4.** It is a write path whose output feeds two critical-flow rows (`docs/critical-flow-registry.md:62-63`). There
is no rendered change, so no Storybook matrix and no `OWNER VISUAL QA REQUIRED` tuple. The owner's live check is
§13.2.

### 13.1 Executor gate block (one pass, transcripts to `docs/sessions/evidence/task917/`)

```powershell
node.exe -p process.platform
node.exe --version
npx.cmd vitest run src/modules/listings/domain/priceOld.test.ts src/modules/listings/actions/__tests__/updateListing.smoke.test.ts src/modules/listings/actions/__tests__/createListing.smoke.test.ts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:listing-visibility
npm.cmd run build
git hash-object src/modules/listings/domain/priceOld.ts src/modules/listings/domain/priceOld.test.ts src/modules/listings/actions/updateListing.ts src/modules/listings/actions/createListing.ts src/modules/listings/actions/__tests__/updateListing.smoke.test.ts src/modules/listings/actions/__tests__/createListing.smoke.test.ts docs/domain-rules.md
```

Expected:
- `win32`;
- vitest exits 0 with the 11 rule rows and the new smoke cases listed;
- `typecheck`, `lint` and `build` exit 0;
- `check:listing-visibility` has the same result as its pre-change run on this tree (`GR-2`: it inspects visibility
  predicates, not `price_old`; its result is recorded, not used to close an AC).

The hashes tie the transcript to the shipped files. **A failed or unrun build permits only `PARTIALLY IMPLEMENTED` or
`BLOCKED`.**

### 13.2 Owner live check (after deploy)

1. Sign in as the owner of listing #22, open its edit form, lower the price and save.
2. Open `/uk/listings`. The card shows the "Ціну знижено" badge and the old price struck.
3. Edit again and raise the price to the old value or higher. The badge and the struck price disappear.

## 14. Completion report contract

Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED` (never self-approved). The
report lists:
- files changed;
- R/AC IDs completed;
- every command with its real exit code;
- the evidence paths (`01-red.txt`, `02-green.txt`, the §13.1 transcript);
- assumptions, deviations, limitations and unresolved issues.

Update `docs/backlog.md` with one concise state line, and write the session log with a "Files Changed" table matching
the real diff. No git commands.

## 15. Task quality gate

- A fresh Sonnet can execute it from this file and the Sprint 88 plan; every path and line was opened by Opus on
  2026-10-02.
- The single writer claim (F8) is backed by a whole-`src` grep. The F5 absence claim is backed by a whole-`src` import
  search.
- One route; no owner decision is open for execution. A1 is labelled and reversible.
- Two-armed proof required (AC6).
- `GR-1` / `GR-3*`: not applicable. No visible component, Story or style changes (§1). The card census for the
  later visual work is in 918.
- `GR-2 SCOPE STATED — check:listing-visibility inspects listing visibility predicates; it cannot see price_old
  semantics; the criteria are closed by priceOld.test.ts and the two smoke suites.`
