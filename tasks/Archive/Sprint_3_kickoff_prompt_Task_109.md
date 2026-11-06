# Kickoff prompt — Task 109 (Sprint 3, primitive debt burn-down)

> Copy-paste the block below into Claude Code (Sonnet 4.6). Run this BEFORE Task 110.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are starting Sprint 3 — UI Primitive & Drawer Cleanup.
The previous completed task is Task 108 (Epic B.1 — side popup auth flow).
This task must be documented as Task 109. Preserve global task numbering.

Why this task:
`npm run governance:primitives` has been FAILING on every UI task because of a pre-existing High-tier debt:
  current C0/H87/M1  vs  baseline C0/H57/M8  → REGRESSION (H:+30)
This +30 has persisted since Sprint 1 (Task 94). No recent task introduced new violations — the debt was simply never paid down. Task 109 closes it so the gate stops failing on unrelated work.

Required pre-read before implementation:
1. Read tasks/Sprints/Sprint_3_—_UI_Primitive_and_Drawer_Cleanup.md — full Task 109 spec.
2. Read docs/backlog.md — Carry-over section (H:+30 description).
3. Read docs/ai-behavior.md, especially:
   - Canonical Task Template
   - UI Primitive Anti-Patterns
   - AI Governance Enforcement Rules → Canonical Usage Enforcement
   - Scope Isolation Rules
4. Read docs/component-governance.md, docs/governance-enforcement.md (§3), docs/governance-checklists.md.
5. Read docs/ui-rules.md (canonical Button sizes/variants, Sheet/Dialog usage).
6. Read docs/component-risk-register.md.
7. Read scripts/governance/ to understand how primitives C/H/M are computed and where the baseline lives.
8. Run `npm run governance:primitives` and read the FULL violation list (not a truncated tail).
9. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it
- Every `<button>` converted to `Button` must keep its `t()` label — verify no string lost.
- Run `npm run governance:localization` after — key counts must stay 870 per locale.

Responsive coverage required:
- 320, 375, 390, 768, 1280, 1440, 2560
- Converting raw buttons/overlays to canonical Button/Sheet/Dialog must NOT change layout at any breakpoint. Spot-check each migrated component.

Task scope (Task 109):
1. From the live governance run, enumerate every High violation (file:line). Known set includes (verify against live run, it may differ):
   - src/modules/listings/components/ListingGallery.tsx
   - src/modules/listings/components/ListingsFilters.tsx
   - src/modules/listings/components/ListingsStatusTabs.tsx
   - src/modules/listings/components/SaveSearchButton.tsx (custom fixed overlay → Sheet/Dialog)
   - src/modules/listings/components/form/EnumSelectorField.tsx
   - src/modules/listings/components/form/RoomsSelectorField.tsx
   - src/modules/listings/components/steps/StepBasicInfo.tsx (×3)
   - src/modules/listings/components/steps/StepDetails.tsx (×2)
   - src/modules/notifications/components/NotificationBell.tsx
   - src/modules/notifications/components/NotificationCenter.tsx
   - src/components/admin/AdminMobileHeader.tsx
   - (plus remaining hits to reach +30 — enumerate from live run)
2. For each: raw-button → `Button` with correct size/variant (icon-only → size="icon"/"icon-sm"; inline text link → variant="link"; mobile-reachable → ≥44px touch target). Custom overlay → `Sheet` (drawer) or `Dialog` (modal).
3. Migrate in clusters; re-run governance:primitives after each cluster to confirm the count drops.
4. Special case — src/modules/auth/components/AuthSheet.tsx lines ~127 and ~267: raw <button type="button"> used as inline text links. Either convert to Button variant="link" (if inline flow is preserved) OR add an allowlist entry with justification. Document the choice in the session log.
5. Once at target, update the governance baseline ONLY if the new floor is genuinely lower; document the new numbers.

Acceptance criteria:
- npm run governance:primitives → no REGRESSION vs baseline; target C0/H≤57/M≤8 or better.
- AuthSheet inline buttons resolved (converted or allowlisted with justification).
- Every converted button keeps its localized label; governance:localization PASS (870 keys per locale).
- No layout regression at any of the 7 breakpoints.
- 0 new lint errors / 0 new warnings.
- docs/component-risk-register.md updated.
- Session log: docs/sessions/YYYY-MM-DD-task-109-primitive-debt-burndown.md.
- docs/backlog.md updated (Last Session + Session Archive row + REMOVE the H:+30 carry-over once closed).
- npm run build is the user's manual step.

Out of scope:
- Mobile drawer padding (that's Task 110 — do NOT do it here).
- Any restyling beyond primitive substitution.
- Admin table row pattern (Epic K).

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 110 in this run.
```
