# Session Archive: Sprint 1 — Bugfix Continuation & Admin Polish — 2026-05-19

**Status:** SPRINT CLOSED ✅
**Tasks completed:** 91–102 (12 tasks)

---

## Sprint summary

| Task | Title | Type | Files |
|------|-------|------|-------|
| 91 | Fix Italian locale fallback to Ukrainian | Critical bugfix / i18n | `AdminUserAvatar.tsx`, `ProfileTab.tsx` |
| 92 | Verify and complete language-name translations | Bugfix / localization | 4 message files, `LocaleSwitcher.tsx`, `Header.tsx`, `AdminSettings.tsx` |
| 93 | Full site-wide dropdown/popover clipping audit | UI regression | `LocationCombobox.tsx`, `YearCombobox.tsx`, `FiltersPanel.tsx`, `ListingsFilters.tsx`, `component-risk-register.md` |
| 94 | Full mobile spacing & auth UI audit | Responsive UI | 8 files (`LoginForm`, `RegisterForm`, `confirm-email`, `Header`, `FiltersPanel`, `ListingsFilters`, `ListingFormShell`, `ProfileTab`) |
| 95 | Active filter chip: entire button as click target | UX / accessibility | `ActiveFilterChips.tsx` |
| 96 | Replace "Не забувайте" in Premium empty state | Localization bug | 4 message files, `FeaturedListings.tsx` |
| 97 | Fix "Тип" column translation in Listings admin table | Localization bug | `AdminListingsTable.tsx` |
| 98 | Constrain Combobox scrollbar within dropdown bounds | UI bug | `Combobox.tsx`, `LocationCombobox.tsx`, `YearCombobox.tsx` |
| 99 | Replace local Combobox in Admin User form | Component governance | `ProfileTab.tsx` |
| 100 | Admin User form: success toast + disable Save until changed | UX bug | `AdminUserProfile.tsx`, 4 message files |
| 101 | Hide "Переглянути всі" when Premium section is empty | UX bug | `FeaturedListings.tsx`, `page.tsx` |
| 102 | Remove Google Translate API and DeepL API | Chore / cleanup | `providers.ts` |

---

## Final sprint state

- **Lint:** 0 errors / 5 warnings (all pre-existing)
- **TypeScript:** 4 pre-existing test file errors, 0 new
- **Governance — localization:** ✅ PASS at baseline
- **Governance — responsive:** ✅ PASS at baseline
- **Governance — primitives:** MEDIUM M:8→M:1 (improvement), H:+30 pre-existing regression
- **Key counts:** 826 per locale (sq/en/uk/it), all balanced
- **Build:** not run (per policy — user runs manually)

---

## Key technical decisions made in Sprint 1

- **Task 91**: Ukrainian error strings in cabinet/admin actions were not fixed at the action layer; UI components fixed instead (display localized strings from `t(key)` rather than raw server error). Admin action errors remain hardcoded Ukrainian — separate concern.
- **Task 93**: Added `portal` prop to `LocationCombobox` and `YearCombobox` following `Combobox` pattern. Used `portal={true}` at 6 call sites in scroll containers.
- **Task 94**: `h-11 className` on `Button` components = governance violation. Fixed 11 instances. `h-11` on `Input` elements = correct (no size prop system for inputs).
- **Task 98**: Two-layer overflow pattern (outer `overflow-hidden`, inner `overflow-y-auto`) applied to all 3 custom dropdown components. This is the canonical CSS fix for scrollbar-leaks-past-border-radius.
- **Task 99**: `SettlementCombobox` was a 115-line local clone of `LocationCombobox`. Deleted entirely; replaced with canonical `LocationCombobox portal`.
- **Task 101**: "View all" link moved from Server Component (`page.tsx`) to Client Component (`FeaturedListings.tsx`) — the only component with access to the listing count at render time.
