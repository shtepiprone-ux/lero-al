# Task 272 — Task 268 doc-gap closure: Option B sub-rationale

**Date:** 2026-05-28  
**Type:** chore (docs hygiene)  
**Executor:** Sonnet 4.6

---

## Context

Task 268 shipped with orchestrator Option B (no `WHERE deleted_at IS NULL`; the `deleted_at` column serves as the public "deleted account" signal for the `ownerDeleted` UI branch). Two documentation gaps remained:

1. `docs/rls-rules.md` → "Acknowledged Advisor Exceptions" row for `public.public_user_profiles` still referenced `WHERE filter` in the Established-by cell and lacked the Option B sub-rationale in the Rationale cell.
2. `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md` → "Emitted SQL" section header + intro paragraph + two SQL comment blocks still contained "PARTIAL / STOP & ASK / DEFERRED" language contradicting the closed `✅ OPTION B` decision recorded elsewhere in the same file.

---

## Required Investigation Results

### §1 — rls-rules.md row BEFORE

```
| `0010_security_definer_view` | `public.public_user_profiles` | Public-facade pattern over the narrowed `users` table. See "Security Definer Views (FORBIDDEN by default)" → exception. Switching to invoker mode would break listing-detail public-profile reads (`users_self_read` permits `auth.uid() = id` only). | Task 266 (creation) → Task 268 (acknowledgement + rationale comment + WHERE filter) |
```

"Option B recorded 2026-05-28" **not present** → edit required.

### §2 — Task 268 session log STOP&ASK/DEFERRED BEFORE

Hits inside the **Emitted SQL** section (those requiring fixes):
- Line 176: `## Emitted SQL (PARTIAL — pending orchestrator decision on condition 3)`
- Line 178: `The WHERE clause is **left out** pending the STOP & ASK resolution. Owner should NOT apply...`
- Line 198: `-- 3. Explicit WHERE filter .... ⚠️ STOP & ASK`
- Line 224: `-- WHERE deleted_at IS NULL: DEFERRED — see STOP & ASK above (condition 3)`

Hits **outside** the Emitted SQL section (intentional history, NOT modified per scope):
- Line 17: `[RESOLVED: Option B]` header
- Lines 54, 65, 68, 136: Owner-Provided Investigation + Consumer Analysis (historical record)
- Line 263: Self-validation mention

### §3 — backlog "Last task number" BEFORE

Line 45: `Last task number: 271. Next: 272.`

---

## BEFORE / AFTER Diffs

### rls-rules.md row

**BEFORE:**
```
| `0010_security_definer_view` | `public.public_user_profiles` | Public-facade pattern over the narrowed `users` table. See "Security Definer Views (FORBIDDEN by default)" → exception. Switching to invoker mode would break listing-detail public-profile reads (`users_self_read` permits `auth.uid() = id` only). | Task 266 (creation) → Task 268 (acknowledgement + rationale comment + WHERE filter) |
```

**AFTER:**
```
| `0010_security_definer_view` | `public.public_user_profiles` | Public-facade pattern over the narrowed `users` table. See "Security Definer Views (FORBIDDEN by default)" → exception. Switching to invoker mode would break listing-detail public-profile reads (`users_self_read` permits `auth.uid() = id` only). Condition 3 (`WHERE` filter) is met IN SPIRIT, not by a literal `WHERE deleted_at IS NULL`: tombstoned rows are intentionally included because the `deleted_at` column is the publicly-visible signal that drives the `ownerDeleted` UI branch on the listing detail page (`ListingContact.tsx:60`). The view's column restriction (no PII) is the access boundary; the row set is intentionally inclusive of tombstoned users. Adding the literal `WHERE` clause would degrade UX without security gain. Orchestrator decision Option B recorded 2026-05-28. | Task 266 (creation) / Task 268 (acknowledgement + rationale comment, no WHERE per Option B) / Task 272 (sub-rationale doc-gap closure) |
```

### Task 268 session log — Emitted SQL section

**BEFORE header + intro:**
```
## Emitted SQL (PARTIAL — pending orchestrator decision on condition 3)

The SQL below adds the rationale comment and makes `security_invoker = false` explicit. The WHERE clause is **left out** pending the STOP & ASK resolution. Owner should NOT apply this until the orchestrator resolves Option A vs B.
```

**AFTER:**
```
## Emitted SQL (FINAL — Option B applied; owner-applied 2026-05-28)

The SQL below adds the rationale comment and makes `security_invoker = false` explicit. NO literal WHERE clause — Option B (per orchestrator 2026-05-28); the deleted_at column is the publicly-visible signal for the ownerDeleted UI branch. Owner applied this on 2026-05-28.
```

**BEFORE SQL comment block (condition 3):**
```
-- 3. Explicit WHERE filter ......................................... ⚠️ STOP & ASK
--    WHERE deleted_at IS NULL would break the ownerDeleted UI branch
--    (ListingContact.tsx:60 checks owner.deleted_at for "account deleted" state).
--    Orchestrator must resolve before applying. See Task 268 session log.
```

**AFTER:**
```
-- 3. Explicit WHERE filter ......................................... ✅ MET IN SPIRIT (Option B)
--    No literal WHERE clause — tombstoned rows kept for ownerDeleted UI branch.
--    Sub-rationale documented in rls-rules.md "Acknowledged Advisor Exceptions".
```

**BEFORE trailing SQL comment:**
```
-- WHERE deleted_at IS NULL: DEFERRED — see STOP & ASK above (condition 3)
```

**AFTER:**
```
-- (intentionally no WHERE — see rationale comment above; tombstoned rows kept for ownerDeleted UI)
```

---

## AFTER-Grep Evidence

`grep "STOP & ASK\|DEFERRED" docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md`

Remaining hits (all outside Emitted SQL section — intentional history):
- Line 17: `[RESOLVED: Option B]` header
- Line 54: Owner-Provided Investigation — "Not a STOP & ASK — file as cleanup" (past tense)
- Line 65: Owner-Provided Investigation — mentions old SQL comment text in description
- Line 68: Owner-Provided Investigation — historical status at time of first apply
- Line 136: Consumer Analysis — "STOP & ASK condition met" (historical record)
- Line 263: Self-validation — "Option B resolves the STOP & ASK"

**No hits inside the Emitted SQL section.** ✅

`grep -c "Option B recorded 2026-05-28" docs/rls-rules.md` → **1** ✅

---

## Production View NOT Modified

No SQL emitted. No SQL pasted. Production view `public.public_user_profiles` is already correct (Option B, no WHERE clause, rationale comment present in DDL from Task 268 owner-apply 2026-05-28).

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `docs/rls-rules.md` | Appended Option B sub-rationale to `public.public_user_profiles` row Rationale cell; updated Established-by cell | Gap 1: sub-rationale missing |
| `docs/sessions/2026-05-28-task-268-public-user-profiles-security-advisor.md` | Updated Emitted SQL section header + intro paragraph + 2 SQL comment blocks | Gap 2: stale STOP&ASK/DEFERRED language |
| `docs/sessions/2026-05-28-task-272-task-268-doc-gap-closure.md` | New session log | Task 264 contract |
| `docs/backlog.md` | Task 272 closure note + counter advance | Task 264 contract |

---

## Self-Validation (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors (no src/ touched) |
| Build | N/A — docs only |
| Locale parity | N/A — no user-facing text changes |
| 7 breakpoints | N/A — no UI changes |
| Production view modified | ✅ NOT modified |
| src/ files modified | ✅ NONE |
| Exactly 4 files changed | ✅ rls-rules.md + task-268 session log + task-272 session log + backlog |
| rls-rules.md row: Option B text appended | ✅ |
| rls-rules.md Established-by: updated to triplet | ✅ |
| Task 268 session log: Emitted SQL header fixed | ✅ FINAL |
| Task 268 session log: intro paragraph fixed | ✅ |
| Task 268 session log: condition-3 comment fixed | ✅ MET IN SPIRIT |
| Task 268 session log: trailing DEFERRED line fixed | ✅ |
| AFTER-grep: no STOP&ASK/DEFERRED in Emitted SQL section | ✅ |
| AFTER-grep: "Option B recorded 2026-05-28" → count=1 | ✅ |
| **Self-validation verdict** | `tsc=0 errors (no src/ touched) · build=N/A (docs only) · AC table=all green · runtime locale=N/A · scope=clean` |
