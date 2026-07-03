# Mantine + TailAdmin Migration Tracker — whole-project UI restyle (owner P0, 2026-06-25)

> **Goal (owner directive 2026-06-25):** EVERY component and element across the WHOLE project styled to the
> TailAdmin reference — not one Story. Done **step by step, component by component**, structured and balanced.
> **Ground truth:** `demo_tailadmin_com.zip` (repo root, gitignored) + `docs/tailadmin-style-reference.md`
> (§6/§6b/§6c/§6d) + `docs/mantine-responsive-design-system.md`. Brand stays `#EC5447`.

## Why this order (root-cause fix)
Surfaces (AdminUsersTable etc.) kept failing review because we styled the SURFACE before its PRIMITIVES were
TailAdmin-correct at the theme level. Fix the primitives first → most surfaces inherit correct styling for free,
and surface slices become small. **No surface slice starts until the primitives it consumes are ✅.**

## Per-slice Definition of Done (the gate — applies to EVERY slice below)
1. Migrated to Mantine primitive(s); legacy `@/components/ui/*` (shadcn) import removed from that surface.
2. Exact TailAdmin values applied from `tailadmin-style-reference.md` §X (cite the section) — zero invented px/colors.
3. Story uses the Mantine proof path AND renders inside the **canonical responsive page gutter** (NOT `skipCanvas`
   full-bleed; full-bleed only for bottom-sheet popups).
4. **Rendered proof matrix** attached: 320/375/480 × en/uk + sq/it@320 (uk@320/375/390 mandatory). No clip/overflow,
   no h-scroll@320, controls full-width `<640`.
5. **🔴 ZERO HARDCODE (owner P0, 2026-06-25).** No raw values anywhere in the slice:
   - **No raw colors** (hex/rgb/hsl/named) — only theme tokens (`c="gray.7"`, `var(--mantine-color-*)`, brand).
   - **No raw spacing/size px** for gap/padding/margin/radius — only Mantine tokens (`gap="sm"`, `radius="2xl"`).
     Sole exemptions: touch-target `mih="2.75rem"`, `minWidth:0`/`flexShrink:0` helpers, `gap={2}` micro-gap — each must be justified.
   - **No hardcoded user-facing strings** — every visible string + `aria-label`/`title` via `t()` with sq/en/uk/it parity.
   - **No raw `<button>/<input>/<select>/<textarea>`** — canonical Mantine primitives only.
   Enforced by `check:design-tokens` (raw values) + `check:i18n` (strings) + ESLint; orchestrator also greps the diff
   for raw hex / raw px / string literals. Any hardcode = REJECT the slice.
6. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`. (Gates do NOT prove visuals.)
7. No control/behavior regression (Note 19/20). Locale parity sq/en/uk/it.
8. **Orchestrator reviews the rendered story SIDE-BY-SIDE with the archive** before approve. tsc/green ≠ approval.

Status legend: ⬜ todo · 🟡 in progress · ✅ done · ➖ n/a

---

## PHASE 0 — Foundation (reference + theme)
| Item | Ref | Status |
|---|---|---|
| TailAdmin reference doc §6/§6b/§6c/§6d | — | ✅ (6c/6d added 2026-06-25) |
| Theme tokens (color/spacing/radius/type/density) | §1–§5 | ✅ Task 484 |
| Component theme defaults (Button/Input/Card/Table/Badge…) | §6 | 🟡 verify each in Phase 1 |

## PHASE 1 — Mantine primitive set → TailAdmin (do FIRST; everything depends on these)
One slice per primitive: theme defaults + thin wrapper (if needed) + story + rendered proof. Maps legacy
`src/components/ui/*` → Mantine.

| # | Primitive | Legacy file | Ref § | Status |
|---|---|---|---|---|
| P1.01 | Button (+variants, ≥44px) | button.tsx | §6 Button | 🟡 Sprint 38 (T493) |
| P1.02 | TextInput + input-group | input.tsx, input-group.tsx | §6 Input, §6c | 🟡 Sprint 38 (T494) |
| P1.03 | Select (appearance-none, chevron) | select.tsx | §6d Select | 🟡 Sprint 38 (T495) |
| P1.04 | Textarea | textarea.tsx | §6 Input | 🟡 Sprint 38 (T496) |
| P1.05 | Checkbox | checkbox.tsx | §6d Checkbox | 🟡 Sprint 38 (T497) |
| P1.06 | Radio / RadioGroup | radio-group.tsx | §6d (radio) | 🟡 Sprint 38 (T498) |
| P1.07 | Switch (toggle) | switch.tsx | §6d Switch | 🟡 Sprint 38 (T499) |
| P1.08 | Badge (pill, semantic) | badge.tsx | §6 Badge | ✅ Task 486 |
| P1.09 | Card / Paper (2xl, flat) | card.tsx | §6 Card | ✅ Task 487 |
| P1.10 | Table (CRM card-wrapped) | table.tsx | §6b | ✅ Task 488 |
| P1.11 | Tabs (brand, not stretched) | tabs.tsx | §6c | ✅ Task 489 |
| P1.12 | SegmentedControl (filters) | — (new) | §6c | ✅ Task 490 |
| P1.13 | Pagination (§6l chrome + `MantinePagination` single-line shed-to-fit) | pagination.tsx | §6l Pagination | 🟢 Task 533 (chrome, pending its own review) + Task 535 (shed-to-fit + ≥44px mobile) ✅ APPROVED 2026-07-03 (535 native-verified) |
| P1.14 | Avatar + AppImage | avatar.tsx, AppImage.tsx | §6b avatar | ✅ Task 491 |
| P1.15 | Alert | alert.tsx | §6d (semantic-50 bg) | ✅ Task 532 |
| P1.16 | Dialog / Modal (bottom-sheet <640) | dialog.tsx → MantineModal.tsx | §11 mobile gate | ✅ Task 519 |
| P1.17 | Sheet / Drawer (bottom-sheet) | sheet.tsx → MantineDrawer.tsx | §11 | ✅ Task 523 |
| P1.18 | Popover | popover.tsx → MantinePopover.tsx | §6d + P0 bottom-sheet <640 | ✅ Task 513 |
| P1.19 | DropdownMenu | dropdown-menu.tsx → MantineDropdownMenu.tsx | §6d + P0 bottom-sheet <640 | ✅ Task 515 |
| P1.20 | NavigationMenu | navigation-menu.tsx → MantineNavigationMenu.tsx | §6c/§6d + P0 bottom-sheet <640 | ✅ Task 518 |
| P1.21 | Command / Combobox base | command.tsx | §6d | ⬜ |
| P1.22 | Tooltip | (in ui) → MantineTooltip.tsx | §6k (extracted from live demo) | ✅ Task 524 |
| P1.23 | Progress | progress.tsx | §6 | ⬜ |
| P1.24 | Skeleton | skeleton.tsx | §5/§6 | ⬜ |
| P1.25 | Separator | separator.tsx | §6 | ⬜ |
| P1.26 | ScrollArea | scroll-area.tsx | §6 | ⬜ |
| P1.27 | Slider | slider.tsx | §6 | ⬜ |
| P1.28 | Label | label.tsx | §6 Label | 🟡 Sprint 38 (T501) |
| P1.29 | Toast (sonner) | sonner.tsx | §5 shadow | ⬜ |
| P1.30 | PasswordInput + RequirementsHint | PasswordInput.tsx, PasswordRequirementsHint.tsx | §6 Input | 🟡 Sprint 38 (T500) |

## PHASE 2 — Shared composites (21) — after the primitives they use are ✅
Combobox · LocationCombobox · PropertyTypeCombobox · YearCombobox · DatePicker · PhoneField · AvatarCropModal ·
FilterMultiToggle · FilterRangeInputs · FilterRoomsRow · FilterToggleGroup · FiltersPanel · HeroSearch ·
HeroSearchClient · LocaleSwitcher · Map · MapWrapper · RelativeTime · (PerfDevOverlay/WebVitalsReporter/
PerformanceStoreInit = ➖ non-visual).

## PHASE 3 — Layout (7)
Header · Footer · FilterBar · MobileBottomNav · PageHeader · PageShell · Section.

## PHASE 4 — Admin surfaces (35) — one slice each
AdminShell · AdminSidebar · AdminMobileHeader · AdminPageShell · AdminPageHeader · AdminEditLayout · AdminTable ·
AdminCardList · AdminInput · AdminSearchInput · AdminUserAvatar · AdminUsersTable (🟡 Task 485 — close AFTER its
primitives) · AdminUserProfile · AdminUserCreate · AdminListingsTable · AdminDashboardRecentListings ·
AdminCompaniesManager · AdminCurrenciesManager · AdminCurrencyTabs · AdminExchangeProvidersManager ·
AdminEmailTemplatesManager · AdminFooterManager · AdminInquiriesManager · AdminLegalManager · AdminLocationsManager ·
AdminPopularLocationsManager · AdminPagesManager · AdminPermissionsManager · AdminPropertyTypesManager ·
AdminReportsManager · AdminSettings · AdminSupportManager · AdminLocaleSwitcher · StatusChangeControl ·
StatusChangeHistory.

## PHASE 5 — Public / app surfaces (`src/app`, ~45) — listing, auth, profile, search, legal, etc.
Inventory per route group to be expanded when Phase 4 nears done.

## PHASE 6 — Remove legacy shadcn `src/components/ui/*`
Once a primitive has zero remaining `@/components/ui/*` consumers, delete the legacy file + its stories.
Track via `grep -rl "@/components/ui/<name>" src`.

---

## Current pointer
- **DONE — Batch A (AdminUsersTable dependency set):** P1.08 Badge ✅ · P1.09 Card ✅ · P1.10 Table ✅ · P1.11 Tabs ✅ ·
  P1.12 SegmentedControl ✅ · P1.14 Avatar ✅ (Tasks 486–491, Sprint 37). Plus Task 492 = project font→Outfit + TailAdmin
  type scale + control density (sm/14px/44px) across the theme.
- **NOW — Batch B (Sprint 38, form controls):** P1.01 Button (493) · P1.02 TextInput (494) · P1.03 Select (495) ·
  P1.04 Textarea (496) · P1.05 Checkbox (497) · P1.06 Radio (498) · P1.07 Switch (499) · P1.30 PasswordInput (500) ·
  P1.28 Label (501). Plan: `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md`. Run order 493→501→494→496→500→495→497→498→499.
- **Batch C (overlays) — ✅ COMPLETE:** P1.18 Popover ✅ Task 513 · P1.19 DropdownMenu ✅ Task 515 · P1.20 NavigationMenu
  ✅ Task 518 · P1.16 Modal ✅ Task 519 · P1.17 Drawer ✅ Task 523 · P1.22 Tooltip ✅ Task 524. **Batch D (feedback/misc) — IN PROGRESS:**
  P1.15 Alert ✅ Task 532 · P1.13 Pagination ✅ Task 533 (chrome) + Task 535 (single-line shed-to-fit, ≥44px mobile — supersedes Task 534). Remaining ⬜: P1.21 Command · P1.23 Progress ·
  P1.24 Skeleton · P1.25 Separator · P1.26 ScrollArea · P1.27 Slider · P1.29 Toast.
- Each slice ships one component with the DoD gate above; ~5–8 slices per sprint to stay balanced.

## Audit status (Task 525 — rendered conformance audit vs `demo_tailadmin_com.zip`, 2026-07-02)

Full detail + rendered evidence: `docs/sessions/2026-07-02-task525-tailadmin-conformance-audit.md`. Audit-only — zero primitive/theme/story code changed.

| Primitive | Verdict | Top finding |
|---|---|---|
| Button | NEEDS CORRECTION | `variant="default"` border/text/shadow diverge from §6 secondary-button spec |
| TextInput | NEEDS CORRECTION (minor) | resting shadow = Mantine's own "xs" formula, not TailAdmin's simpler `shadow-theme-xs` |
| Textarea | 🔴 NEEDS CORRECTION (P0) | resting min-height 36px, below the 44px touch-target gate |
| Select | NEEDS CORRECTION | missing `color:gray-8` override → black resting text + red error text + wrong disabled shade |
| PasswordInput | PASS (resting; not fully re-swept) | matches TextInput pattern |
| Label | PASS | fw600 is a documented owner override, not a defect |
| Checkbox | ✅ PASS | 16px box/geometry question from §6f now CONFIRMED correct |
| Radio | ✅ PASS | 16px geometry question from §6g now CONFIRMED correct |
| Switch | PASS-AS-APPROVED | track color/density already flagged as owner-decision-pending (§6h) |
| Badge | NEEDS CORRECTION | fontSize renders 10px vs cited 12px (`text-theme-xs`) |
| Card | NEEDS CORRECTION | border renders gray-300, not the intended gray-100 override |
| Table | ✅ PASS | header/body chrome exact (thead bg confirmed after a selector-scoping fix) |
| Tabs | PASS-WITH-KNOWN-GAP | active/inactive text-color parity already documented as deferred |
| SegmentedControl | NEEDS CORRECTION | active-label CSS var not reaching the render (renders black, not gray-900) |
| Avatar | ✅ PASS | pill radius + 40px "standard" size confirmed |
| Popover | NEEDS CORRECTION | desktop dropdown has no shadow (`shadow-theme-lg` cited) |
| DropdownMenu | NEEDS CORRECTION | same missing-shadow finding as Popover |
| NavigationMenu | NEEDS CORRECTION | same missing-shadow finding as Popover |
| Modal | NEEDS DECISION | desktop radius (6px) inconsistent with the theme's own stated 8px default |
| Drawer | ✅ PASS | 0px radius correct for a flush side panel; shadow not yet cited (doc gap, not a defect) |
| Tooltip | ✅ PASS (pre-existing) | §6k extracted + owner-approved in Tasks 524/526, not re-audited |

**Priority-ordered correction queue:** Textarea min-height (P0) → Popover/Menu shadow-lg (3 primitives) → Card border → Select color parity → SegmentedControl active-label var → Button secondary chrome → Badge fontSize → input-family padding → Modal radius decision. Full citations + measured values in the audit doc.
