# Kickoff prompt — Task 111 (Sprint 3, tailwind entropy burn-down)

> Copy-paste the block below into Claude Code (Sonnet 4.6). Run AFTER Task 110 closes.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are finishing Sprint 3 — UI Primitive & Drawer Cleanup.
Previous completed tasks: Task 109 (primitive debt burn-down), Task 110 (mobile drawer padding).
This task must be documented as Task 111. Preserve global task numbering.

Why this task:
A `governance:tailwind` audit on 2026-05-19 found 58 entropy findings (0 Critical / 0 High / 15 Medium / 43 Low). The audit also CONFIRMED that spacing (gap-*/p-*/pt-*) is healthy — there is NO spacing-rename work to do. The real debt is: arbitrary font sizes (typography), hardcoded background colors, and a few non-canonical `py-10` section paddings.

Required pre-read before implementation:
1. Read tasks/Sprints/Sprint_3_—_UI_Primitive_and_Drawer_Cleanup.md — full Task 111 spec with the file list.
2. Read docs/backlog.md, docs/ai-behavior.md (Canonical Task Template, Tailwind Entropy Anti-Patterns, UI Governance Anti-Patterns → Typography/Spacing, Scope Isolation Rules).
3. Read docs/ui-rules.md §1 (spacing scale), §2 (type scale), semantic color tokens.
4. Read docs/tailwind-canonical-fragments.md.
5. Read scripts/governance/ — how governance:tailwind computes C/H/M and where the baseline + allowlist live (scripts/governance/tailwind-entropy.allowlist.json).
6. Run `npm run governance:tailwind` and read the FULL list (live output may differ from the snapshot in the task spec).
7. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it — no string changes expected; run governance:localization after to confirm key counts unchanged (870 per locale).

Responsive coverage required:
- 320, 375, 390, 768, 1280, 1440, 2560 — type-scale and padding changes must not regress any breakpoint. Spot-check ListingCard especially (6 font-size hits).

Task scope (Task 111) — three categories:

A. Section padding py-10 → canonical (3 MEDIUM):
   - src/components/admin/AdminLocationsManager.tsx:284
   - src/components/admin/AdminUsersTable.tsx:115
   - src/modules/notifications/components/NotificationCenter.tsx:49
   Replace with py-8/md:py-12, py-12/md:py-16, or py-16/md:py-24 per section role.

B. Hardcoded background color → semantic token (6 MEDIUM):
   - src/components/admin/AdminLocationsManager.tsx:91
   - src/components/admin/AdminPropertyTypesManager.tsx:103, :192
   - src/components/admin/AdminUserAvatar.tsx:169
   - src/components/shared/FiltersPanel.tsx:98
   - src/stories/ListingGrid.stories.tsx:44
   Use bg-card / bg-background / bg-muted (pick by component intent).

C. Arbitrary font size → canonical type scale (43 LOW):
   Spread across AdminMobileHeader, AdminSettings, AdminSidebar, AdminUserAvatar, AdminUsersTable, MobileBottomNav, DatePicker, FiltersPanel, HeroSearch, PerfDevOverlay, CabinetShell, ListingsTab, ProfileTab, SavedSearchesTab, ImageUpload, ListingCard (×6), ListingDescriptionTranslator, ListingsFilters, ListingsSortBar, NotificationBell, NotificationItem, ListingGrid.stories.
   Map to text-xs … text-2xl.

IMPORTANT — do NOT blindly convert:
- text-[10px] is ALLOWED for badges and micro-labels (docs/ai-behavior.md). Keep them; if the scanner flags a legitimate badge/micro-label, add an allowlist entry in scripts/governance/tailwind-entropy.allowlist.json WITH justification rather than forcing a wrong size.
- PerfDevOverlay.tsx is a dev-only debug overlay — check whether it's in governance scope; if dev-only, it likely belongs in the allowlist, not "fixed".
- Story files (*.stories.tsx) — follow project convention: either migrate or allowlist.

Required investigation:
1. From the live run, list every finding (file:line + category).
2. Per font-size hit: real arbitrary value to map, or legitimate badge/micro-label/dev-overlay to allowlist? Decide + document.
3. Per color hit: correct semantic token by component intent (card vs muted vs background).
4. Per py-10: canonical section padding matching the section's role.
5. Re-run governance:tailwind after each cluster to confirm the count drops.

Acceptance criteria:
- npm run governance:tailwind → at or below baseline (0C/0H; MEDIUM and LOW reduced). Document final numbers.
- Every legitimate exception kept-and-allowlisted (with justification) or correctly migrated — none blindly broken.
- No visual regression at any of the 7 breakpoints (spot-check ListingCard).
- All four locales unchanged; governance:localization PASS (870 keys per locale).
- 0 new lint errors / 0 new warnings.
- Session log: docs/sessions/YYYY-MM-DD-task-111-tailwind-entropy-burndown.md.
- docs/backlog.md updated (Last Session + Session Archive row).
- npm run build is the user's manual step.

Out of scope:
- Spacing rename to xs/md/xl — explicitly NOT doing this (audit confirmed spacing is healthy).
- Primitive substitution (Task 109) and drawer padding (Task 110) — already done.
- Any component restructuring beyond token/scale substitutions.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.

After Task 111 closes:
- Create tasks/Sprints/Sprint_3_—_Summary_CLOSED.md and mark the Sprint 3 plan shapka CLOSED.
- Resume Epic B at Task 112 (B.2 — Agent city selection) — use tasks/Epics/Epic_B_kickoff_prompt_Task_112.md.
```
