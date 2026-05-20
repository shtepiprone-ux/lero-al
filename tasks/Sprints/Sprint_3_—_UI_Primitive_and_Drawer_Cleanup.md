# Sprint 3 — UI Primitive & Drawer Cleanup

**Status:** CLOSED
**Opened on:** 2026-05-19
**Closed on:** 2026-05-20
**Numbering:** Task 109 → Task 110 → Task 111 (global numbering continues from Epic B.1 Task 108)
**Closure summary:** [Sprint_3_—_Summary_CLOSED.md](Sprint_3_—_Summary_CLOSED.md)

This sprint clears the long-standing `governance:primitives` High-tier debt (carried since Sprint 1) so the governance gate stops failing on every UI task, and fixes the non-canonical mobile drawer padding discovered during the Task 108 review.

Both tasks follow the **Canonical Task Template** in `docs/ai-behavior.md`.

---

## Task 109 — Primitive debt burn-down (close `governance:primitives` H:+30)

**Type:** Refactor / governance debt
**Priority:** High
**Area:** Project-wide raw `<button>` and custom fixed-overlay usages

**Pre-read (mandatory):**
1. `docs/backlog.md` — Carry-over section (the H:+30 description).
2. `docs/ai-behavior.md` — especially:
   - Canonical Task Template
   - UI Primitive Anti-Patterns
   - AI Governance Enforcement Rules → Canonical Usage Enforcement (Button / Sheet / Dialog)
   - Scope Isolation Rules
3. `docs/component-governance.md`, `docs/governance-enforcement.md` (§3 escalation), `docs/governance-checklists.md`.
4. `docs/ui-rules.md` (canonical Button sizes, Sheet/Dialog usage).
5. `docs/component-risk-register.md` (existing known risks).
6. `scripts/governance/` — understand how `governance:primitives` computes C/H/M and where the baseline is stored.
7. Run `npm run governance:primitives` and read the full violation list (do NOT rely on a truncated view).

**Localization coverage:** sq, en, uk, it — any `<button>` converted to `Button` must keep its `t()` label; verify no string is lost. Run `governance:localization` after.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 — converting raw buttons/overlays to canonical `Button`/`Sheet`/`Dialog` must not change layout at any breakpoint.

**Goal:**
Migrate the ~30 High-tier violations (raw `<button>` elements + custom `fixed inset-0` overlays) to canonical primitives so `governance:primitives` returns to **C0/H≤57/M≤8 or better** — i.e. no REGRESSION vs the original baseline. The known violation set at sprint start (from the full governance run) includes (non-exhaustive):
- `src/modules/listings/components/ListingGallery.tsx`
- `src/modules/listings/components/ListingsFilters.tsx`
- `src/modules/listings/components/ListingsStatusTabs.tsx`
- `src/modules/listings/components/SaveSearchButton.tsx` (custom fixed overlay → Sheet/Dialog)
- `src/modules/listings/components/form/EnumSelectorField.tsx`
- `src/modules/listings/components/form/RoomsSelectorField.tsx`
- `src/modules/listings/components/steps/StepBasicInfo.tsx` (×3)
- `src/modules/listings/components/steps/StepDetails.tsx` (×2)
- `src/modules/notifications/components/NotificationBell.tsx`
- `src/modules/notifications/components/NotificationCenter.tsx`
- `src/components/admin/AdminMobileHeader.tsx`
- (plus the remaining hits to reach the full +30 — enumerate from the live run)

**Special case — intentional inline link-buttons:**
`src/modules/auth/components/AuthSheet.tsx` lines ~127 and ~267 use raw `<button type="button">` as inline text links ("no account? Register" / "have account? Login"). These are NOT currently flagged by the scanner. Decide explicitly:
- (a) convert to `Button variant="link"` if it preserves inline text flow, OR
- (b) add an allowlist entry (with justification) in the governance config.
Document the decision. Do not leave them as undocumented raw buttons.

**Required investigation:**
1. From the live `governance:primitives` run, list every High violation with file:line.
2. For each: classify as raw-button → `Button` (pick correct `size`/`variant`) or custom-overlay → `Sheet`/`Dialog`.
3. Migrate incrementally; re-run `governance:primitives` after each cluster to confirm count drops.
4. Watch for icon-only buttons (use `size="icon"` / `size="icon-sm"`), inline link buttons (variant="link"), and touch-target rules (≥44px on mobile-reachable).
5. After reaching the target, update the governance baseline if (and only if) the new floor is genuinely lower; document the new baseline numbers.

**Acceptance criteria:**
- `npm run governance:primitives` → no REGRESSION vs baseline; ideally C0/H≤57/M≤8.
- AuthSheet inline buttons resolved (converted or allowlisted with justification).
- Every converted button keeps its localized label; `governance:localization` PASS (key counts unchanged).
- No layout regression at any of the 7 breakpoints (spot-check the migrated components).
- 0 new lint errors / 0 new warnings.
- `docs/component-risk-register.md` updated with what was migrated.
- Session log: `docs/sessions/YYYY-MM-DD-task-109-primitive-debt-burndown.md`.
- `docs/backlog.md` updated (Last Session + Session Archive row + remove the H:+30 carry-over once closed).

**Out of scope:**
- Mobile drawer padding (Task 110).
- Restyling beyond primitive substitution.
- Admin table row pattern (Epic K).

---

## Task 110 — Fix non-canonical mobile drawer padding (unauthenticated menu)

**Type:** Responsive UI bug
**Priority:** Medium-High
**Area:** `src/components/layout/Header.tsx` mobile Sheet drawer, canonical spacing

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md` (Canonical Task Template + UI Governance / spacing rules).
2. `docs/ui-rules.md` (§1 spacing scale, container/padding tokens).
3. `docs/component-rules.md`.
4. `src/components/layout/Header.tsx` — the mobile `Sheet` (lines ~217–300).
5. `src/components/ui/sheet.tsx` — note `SheetContent` has NO horizontal padding by default; `SheetHeader`/`SheetFooter` carry `p-4`.

**Localization coverage:** sq, en, uk, it (longest Ukrainian strings must not overflow once padding is added).
**Responsive coverage:** 320, 375, 390, 768 (drawer is mobile-only; verify it is hidden/replaced at ≥768 if applicable) — plus confirm no regression at 1280/1440/2560.

**Bug:**
In the mobile side drawer (hamburger menu) for unauthenticated users — which shows only nav links + auth buttons — the content has **no horizontal padding** and sits flush against the drawer edges. Root cause: the drawer content wrapper at `Header.tsx` ~line 225 is `<div className="flex flex-col gap-6 pt-6">` — it sets top padding but no `px-`. `SheetContent` provides no default horizontal padding.

**Required investigation:**
1. Inspect the drawer content container in `Header.tsx` (~lines 224–300).
2. Apply canonical horizontal padding (use the project's canonical drawer/section padding token — check what other Sheets use; likely `px-4` to match `SheetHeader`'s `p-4`). Do NOT introduce an arbitrary `px-7`/`px-13` value (forbidden by Tailwind entropy rules).
3. Verify both states render correctly: unauthenticated (nav + auth buttons) AND authenticated (if the same drawer is used). Note: Task 106 added the mobile locale switcher into this header — confirm it still aligns.
4. Confirm consistency with the canonical `SheetHeader`/`SheetFooter` padding so the whole drawer reads as one padded panel.

**Acceptance criteria:**
- Drawer content has canonical horizontal padding; nothing flush against edges.
- Consistent padding for both authenticated and unauthenticated drawer states.
- Mobile locale switcher (Task 106) still aligned within the new padding.
- No arbitrary spacing values — only the canonical scale (`docs/ui-rules.md §1`).
- All four locales render without overflow at 320/375/390/768.
- 0 new lint errors / 0 new warnings; `governance:tailwind` and `governance:responsive` PASS at baseline.
- Session log: `docs/sessions/YYYY-MM-DD-task-110-mobile-drawer-padding.md`.
- `docs/backlog.md` updated (Last Session + Session Archive row).

**Out of scope:**
- Primitive substitution (Task 109).
- AuthSheet internal layout (already shipped in Task 108).
- Redesigning the drawer beyond the padding fix.

---

## Task 111 — Tailwind entropy burn-down (typography + colors + section padding)

**Type:** Refactor / governance debt
**Priority:** Medium
**Area:** Project-wide arbitrary font sizes, hardcoded background colors, non-canonical section padding

**Pre-read (mandatory):**
1. `docs/backlog.md`, `docs/ai-behavior.md` — especially:
   - Canonical Task Template
   - Tailwind Entropy Anti-Patterns
   - UI Governance Anti-Patterns → Typography / Spacing
   - Scope Isolation Rules
2. `docs/ui-rules.md` — §1 spacing scale, §2 type scale, semantic color tokens.
3. `docs/tailwind-canonical-fragments.md`.
4. `scripts/governance/` — how `governance:tailwind` computes C/H/M and where the baseline + allowlist live (`scripts/governance/tailwind-entropy.allowlist.json`).
5. Run `npm run governance:tailwind` and read the FULL list (live output may differ from the snapshot below).

**Localization coverage:** sq, en, uk, it — no string changes expected, but run `governance:localization` after to confirm nothing broke (key counts unchanged).
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 — type-scale and padding changes must not regress any breakpoint.

**Goal:**
Bring the 58 tailwind-entropy findings (audit 2026-05-19: 0C / 0H / 15M / 43L) down to baseline or better, WITHOUT blindly rewriting legitimate exceptions.

**Findings snapshot (verify against live run):**

*Section padding `py-10` → canonical (3 × MEDIUM):*
- `src/components/admin/AdminLocationsManager.tsx:284`
- `src/components/admin/AdminUsersTable.tsx:115`
- `src/modules/notifications/components/NotificationCenter.tsx:49`
→ replace with `py-8 md:py-12` / `py-12 md:py-16` / `py-16 md:py-24` per context.

*Hardcoded background color → semantic token (6 × MEDIUM):*
- `src/components/admin/AdminLocationsManager.tsx:91`
- `src/components/admin/AdminPropertyTypesManager.tsx:103`, `:192`
- `src/components/admin/AdminUserAvatar.tsx:169`
- `src/components/shared/FiltersPanel.tsx:98`
- `src/stories/ListingGrid.stories.tsx:44`
→ use `bg-card` / `bg-background` / `bg-muted`.

*Arbitrary font size → canonical type scale (43 × LOW):*
- spread across `AdminMobileHeader`, `AdminSettings`, `AdminSidebar`, `AdminUserAvatar`, `AdminUsersTable`, `MobileBottomNav`, `DatePicker`, `FiltersPanel`, `HeroSearch`, `PerfDevOverlay`, `CabinetShell`, `ListingsTab`, `ProfileTab`, `SavedSearchesTab`, `ImageUpload`, `ListingCard` (×6), `ListingDescriptionTranslator`, `ListingsFilters`, `ListingsSortBar`, `NotificationBell`, `NotificationItem`, `ListingGrid.stories`.
→ map to `text-xs … text-2xl`.

**IMPORTANT — do not blindly convert:**
- `text-[10px]` is explicitly ALLOWED for badges and micro-labels (per `docs/ai-behavior.md`). Keep those; if the scanner flags a legitimate badge/micro-label, add an allowlist entry in `scripts/governance/tailwind-entropy.allowlist.json` with justification instead of forcing a wrong size.
- `PerfDevOverlay.tsx` is a dev-only debug overlay — confirm whether it's in governance scope; if it's dev-only it may belong in the allowlist rather than being "fixed".
- Story files (`*.stories.tsx`) — decide per project convention whether stories must follow the type scale or can be allowlisted.

**Required investigation:**
1. From the live run, list every finding (file:line + category).
2. For each font-size hit: is it a real arbitrary value to map onto the scale, or a legitimate badge/micro-label/dev-overlay to allowlist? Decide and document.
3. For each color hit: replace with the correct semantic token (check the surrounding component's intent — card vs muted vs background).
4. For each `py-10`: pick the canonical section padding that matches the section's role.
5. Re-run `governance:tailwind` after each cluster.

**Acceptance criteria:**
- `npm run governance:tailwind` → at or below baseline (target 0C/0H, MEDIUM and LOW reduced; document final numbers).
- Every legitimate exception (badges, micro-labels, dev overlay, stories) is either kept-and-allowlisted (with justification) or correctly migrated — none blindly broken.
- No visual regression at any of the 7 breakpoints (spot-check migrated components, especially `ListingCard`).
- All four locales render unchanged; `governance:localization` PASS.
- 0 new lint errors / 0 new warnings.
- Session log: `docs/sessions/YYYY-MM-DD-task-111-tailwind-entropy-burndown.md`.
- `docs/backlog.md` updated (Last Session + Session Archive row).

**Out of scope:**
- Spacing rename to `xs/md/xl` — explicitly NOT doing this; the audit confirmed spacing is healthy.
- Primitive substitution (Task 109) and drawer padding (Task 110).
- Any component restructuring beyond the token/scale substitutions.

---

## Sprint 3 — overall acceptance

- Task 109 closes the H:+30 primitive debt → governance gate no longer reports REGRESSION on unrelated UI work.
- Task 110 brings the mobile drawer to canonical padding.
- Task 111 reduces tailwind-entropy (typography + colors + `py-10`) to baseline or better, preserving legitimate exceptions via the allowlist.
- `docs/backlog.md` updated; the H:+30 carry-over removed once Task 109 closes.
- After all three close, create `Sprint_3_—_Summary_CLOSED.md` and resume Epic B at Task 112 (B.2 — Agent city selection).
