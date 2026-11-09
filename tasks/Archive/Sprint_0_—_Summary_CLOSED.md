# Sprint 0 — Critical Bugfix / Regression Stabilization

**Status:** CLOSED ✅ (partial — see Carry-over below)
**Closed on:** 2026-05-19
**Original plan:** `Sprint_0_—_Critical_Bugfix_-_Regression_Stabilization.txt` (do not edit — kept for historical reference)

---

## Completed tasks

| Task | Title | Commit |
|---|---|---|
| Task 84 | Fix listing contact card for guest users | `66bb5f76b` |
| Task 85 | Replace hardcoded Ukrainian call label with i18n | `8164c0ea5` |
| Task 86 | Normalize currency codes in price formatter (ALL → "ALL", not "Всього") | `8c8500a58` |
| Task 87 | Fix Ukrainian localization typos ("язик" → "мова") | `fc75200f0` |
| Task 88 | Redirect guests to login on favorite click | `0342d5404` |
| Task 89 | Prevent admin dropdown clipping in form cards (partial — admin only) | `f58bbd2ae` |
| Task 90 | Improve mobile auth button touch targets (partial — touch targets only) | `1488a1038` |

## Carry-over to Sprint 1

These items from the original Sprint 0 plan were NOT completed and have moved to Sprint 1 with fresh global Task numbers (91+):

- **Italian locale fallback to Ukrainian** — never started (was Sprint 0 Task 0.2 in ChatGPT's plan).
- **Verify "Шкіп" → "албанська"** — needs explicit verification that Task 87 covered language-name translations, not only generic typos.
- **Full dropdown clipping audit (site-wide)** — Task 89 only touched admin form cards. Public site, modals, drawers, mobile layouts not yet audited.
- **Full mobile spacing + auth UI audit** — Task 90 only fixed touch targets. Component spacing, button styling parity with the rest of UI not yet completed.
- **Active filter chip click target** — entire chip should be clickable, not only the small `×` icon.

See `Sprint_1_—_Bugfix_Continuation_and_Admin_Polish.md` for the canonical task entries (with full Pre-read, Localization coverage, and Responsive coverage blocks).

## Lessons

- Numbering is global and continuous (Task 84 → 85 → … → 90), NOT per-sprint. Sprint 1 starts at Task 91.
- The `Sprint_0_…txt` template (Pre-read + Localization coverage + Responsive coverage) is now codified as the **Canonical Task Template** in `docs/ai-behavior.md` — every future task must follow it.
- A partial fix that closes the obvious symptom but leaves the broader audit incomplete (Tasks 89, 90) should be tagged "partial" in the commit/session log, with the remaining scope explicitly carried over.
