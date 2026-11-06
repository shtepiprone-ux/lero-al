# Kickoff prompt — Task 110 (Sprint 3, mobile drawer padding)

> Copy-paste the block below into Claude Code (Sonnet 4.6). Run this AFTER Task 109 closes.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are continuing Sprint 3 — UI Primitive & Drawer Cleanup.
The previous completed task is Task 109 (primitive debt burn-down).
This task must be documented as Task 110. Preserve global task numbering.

Bug to fix:
In the mobile side drawer (hamburger menu) for unauthenticated users — which shows only nav links + auth buttons — the content has NO horizontal padding and sits flush against the drawer edges.
Root cause (already diagnosed): the drawer content wrapper in src/components/layout/Header.tsx (~line 225) is:
  <div className="flex flex-col gap-6 pt-6">
It sets top padding (pt-6) but no horizontal padding (no px-). SheetContent provides no default horizontal padding — canonical padding lives in SheetHeader/SheetFooter (p-4).

Required pre-read before implementation:
1. Read tasks/Sprints/Sprint_3_—_UI_Primitive_and_Drawer_Cleanup.md — full Task 110 spec.
2. Read docs/backlog.md, docs/ai-behavior.md (Canonical Task Template + UI Governance / spacing rules + Tailwind Entropy Anti-Patterns).
3. Read docs/ui-rules.md §1 (spacing scale, container/padding tokens).
4. Read docs/component-rules.md.
5. Read src/components/layout/Header.tsx — the mobile Sheet drawer (~lines 217–300).
6. Read src/components/ui/sheet.tsx — confirm SheetContent has no default horizontal padding; SheetHeader/SheetFooter carry p-4.
7. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it — longest Ukrainian strings must not overflow once padding is added.

Responsive coverage required:
- 320, 375, 390, 768 (drawer is mobile) + confirm no regression at 1280/1440/2560.

Task scope (Task 110):
1. Add canonical horizontal padding to the drawer content container in Header.tsx. Use the project's canonical drawer/section padding token (match SheetHeader's p-4 → likely px-4). Do NOT introduce an arbitrary value (px-7, px-13 etc. are forbidden by Tailwind entropy rules).
2. Verify BOTH drawer states render correctly:
   - unauthenticated (nav links + Login/Register/Register-as-agent buttons)
   - authenticated (if the same drawer is used for logged-in users)
3. Task 106 added the mobile locale switcher into this header — confirm it still aligns within the new padding.
4. Ensure the whole drawer reads as one consistently padded panel (header area, nav, footer/auth buttons).

Acceptance criteria:
- Drawer content has canonical horizontal padding; nothing flush against edges.
- Consistent padding for both authenticated and unauthenticated states.
- Mobile locale switcher (Task 106) still aligned.
- No arbitrary spacing values — only the canonical scale (docs/ui-rules.md §1).
- All four locales render without overflow at 320/375/390/768.
- 0 new lint errors / 0 new warnings.
- npm run governance:tailwind PASS at baseline; npm run governance:responsive PASS at baseline.
- Session log: docs/sessions/YYYY-MM-DD-task-110-mobile-drawer-padding.md.
- docs/backlog.md updated (Last Session + Session Archive row).
- npm run build is the user's manual step.

Out of scope:
- Primitive substitution (was Task 109).
- AuthSheet internal layout (shipped in Task 108).
- Any drawer redesign beyond the padding fix.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.

After Task 110 closes:
- Create tasks/Sprints/Sprint_3_—_Summary_CLOSED.md and mark the Sprint 3 plan shapka CLOSED.
- Resume Epic B at Task 111 (B.2 — Agent city selection).
```
