# Sprint 18 — Design System Lockdown + Governance Burn-down + Filter Consistency

> **Theme:** stop the entropy. Sprint 18 pulls the three reinforcing "stop local one-off
> UI / inconsistent state" tasks together: primitive lockdown (282), Tailwind/entropy
> burn-down (283), and the canonical multi-select filter model + correct active-filter
> counter (294). All three converge on a single principle — **one canonical implementation
> per pattern, no local clones, no per-component divergence.**

> **Filed by:** orchestrator (Opus 4.8) on 2026-05-29, after the Sprint 17 auth batch was
> reviewed + approved. Sprint composition confirmed by owner (282 + 283 + 294).

> **Mandatory rules (every task in this sprint):** `docs/agent-contract.md` clause 6a
> (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a
> "Files Changed" table, NEVER emits `git add`/`git commit`, NEVER runs git; the
> orchestrator emits explicit-path commits during review; the owner runs them in PowerShell).

---

## Why this sprint exists (real, measured state — not abstract)

Captured 2026-05-29 from `npm run governance:primitives` + `npm run governance:tailwind`:

| Scan | Count | What it is |
|------|-------|-----------|
| Primitives — raw `<button>` (app code) | 4 | `AdminDashboardRecentListings.tsx:47,64`, `AdminUserAvatar.tsx:174`, `MobileBottomNav.tsx:77` |
| Primitives — custom `div.fixed.inset-0` overlay | 5 | `AdminLegalManager.tsx:54`, `AdminLocationsManager.tsx:92`, `AdminPropertyTypesManager.tsx:104,198`, `FiltersPanel.tsx:106` |
| Primitives — `role="tab"` (non-shadcn) | 1 | `CabinetShell.tsx:108` |
| Tailwind — button-like fragment clones | 3 | `AdminListingsTable.tsx:466`, `AdminSettings.tsx:128`, `AdminUsersTable.tsx:98` |
| Tailwind — non-canonical section padding (`py-10`) | 1 | `CollectionsSection.tsx:129` |
| Tailwind — arbitrary font-size values | ~48 | scattered (LOW) |
| Tailwind — total arbitrary values | 123 | overall entropy surface |

Plus a measured product-state inconsistency (owner-reported, confirmed in code at
`src/modules/listings/domain/filterEngine.ts`): `condition` (Стан) and `offerType`
(Тип пропозиції) are **single-select scalars** while `purchaseConditions` / `layoutFeatures`
/ `rooms` are **arrays**; and `countActiveFilters()` counts every array as **1 per section**,
not per selected value — so the active-filter badge is wrong.

---

## Tasks in this sprint

| Task | Title | Priority | Kickoff |
|------|-------|----------|---------|
| **282** | Design System Lockdown — primitive substitution + enforcement | CRITICAL | [`Sprint_18_kickoff_prompt_Task_282.md`](Sprint_18_kickoff_prompt_Task_282.md) |
| **283** | Governance debt burn-down — Tailwind entropy (button-like clones, `py-10`, arbitrary font-sizes) | HIGH | [`Sprint_18_kickoff_prompt_Task_283.md`](Sprint_18_kickoff_prompt_Task_283.md) |
| **294** | Global multi-select filters + correct active-filter counter | HIGH | [`Sprint_18_kickoff_prompt_Task_294.md`](Sprint_18_kickoff_prompt_Task_294.md) |

## Sequencing + boundary (avoid the two design tasks colliding on the same files)

1. **282 first.** It owns *structural primitive substitution* — raw `<button>` → `Button`,
   custom `div.fixed.inset-0` overlays → shadcn `Sheet`/`Dialog`, `role="tab"` → shadcn `Tabs`.
   It establishes the canonical surface 283 then cleans the styling on.
2. **283 second.** It owns *Tailwind utility entropy* — button-LIKE `className` styling on
   non-button elements (fragment clones), non-canonical spacing, arbitrary font-sizes. It must
   NOT touch the raw-`<button>`/overlay/tab files 282 owns (listed explicitly in each kickoff's
   Out-of-scope), and 282 must NOT touch 283's font-size/`py-10` debt.
3. **294 is independent** of 282/283 in file scope (it lives in `filterEngine.ts` + the filter
   components/hooks/tests) and can run in parallel — EXCEPT `FiltersPanel.tsx` appears in BOTH
   282 (its `div.fixed.inset-0` overlay → `Sheet`) and 294 (its filter chips). Run **282's
   `FiltersPanel` overlay fix before 294 touches `FiltersPanel`**, or hand 294 the post-282
   tree. The kickoffs note this overlap explicitly.

Each task gets its own diff review + commit hand-off. Together they take the measured
governance debt toward zero and make the filter model consistent site-wide + admin.
