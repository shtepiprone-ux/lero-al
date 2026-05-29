# Sprint 18 — Task 282 kickoff (Design System Lockdown — primitive substitution + enforcement)

> **Mandatory rules — non-negotiable:**
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log, MUST NOT emit `git add`/`git commit`, NEVER runs git. The orchestrator (Opus) reviews the real diff and emits explicit-path commit commands; the owner runs them in PowerShell.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **UI / component** task — pre-read the UI bundle from `docs/rule-index.md`. No scope change; STOP & ASK if ambiguous; literal AC; self-validate (Note 18).

---

```
Type:        refactor (UI primitive lockdown) — NO behavior change, NO visual redesign
Priority:    CRITICAL
Area:        design system — canonical primitives (Button / Sheet / Dialog / Tabs) across admin + layout + shared
```

## Why this task exists (measured, 2026-05-29)

`npm run governance:primitives` reports **13 violations**; the app-code subset this task must
eliminate is **10** (the AuthContext test-file `<button>` at line 296 is a test fixture — leave it,
or add an allowlist entry, do NOT rewrite the test). The project already ships canonical primitives
(`@/components/ui/button`, shadcn `Sheet`, `Dialog`, `Tabs`); these files predate or bypassed them.

| # | Violation | File:line | Canonical replacement |
|---|-----------|-----------|----------------------|
| 1 | Raw `<button>` | `src/components/admin/AdminDashboardRecentListings.tsx:47` | `Button` (`@/components/ui/button`) |
| 2 | Raw `<button>` | `src/components/admin/AdminDashboardRecentListings.tsx:64` | `Button` |
| 3 | Raw `<button>` | `src/components/admin/AdminUserAvatar.tsx:174` | `Button` (likely `variant="ghost" size="icon"`) |
| 4 | Raw `<button>` | `src/components/layout/MobileBottomNav.tsx:77` | `Button` (preserve nav semantics; `asChild` + `Link` if it navigates) |
| 5 | Custom `div.fixed.inset-0` overlay | `src/components/admin/AdminLegalManager.tsx:54` | shadcn `Dialog` (modal) |
| 6 | Custom `div.fixed.inset-0` overlay | `src/components/admin/AdminLocationsManager.tsx:92` | `Dialog` |
| 7 | Custom `div.fixed.inset-0` overlay | `src/components/admin/AdminPropertyTypesManager.tsx:104` | `Dialog` |
| 8 | Custom `div.fixed.inset-0` overlay | `src/components/admin/AdminPropertyTypesManager.tsx:198` | `Dialog` |
| 9 | Custom `div.fixed.inset-0` overlay | `src/components/shared/FiltersPanel.tsx:106` | shadcn `Sheet` (mobile filter drawer) |
| 10 | `role="tab"` (hand-rolled tabs) | `src/modules/cabinet/components/CabinetShell.tsx:108` | shadcn `Tabs`/`TabsList`/`TabsTrigger` |

> **Sequencing note (FiltersPanel):** violation #9 (`FiltersPanel.tsx:106`) overlaps Task 294
> (which edits FiltersPanel's filter chips). Do the overlay→`Sheet` conversion here; Task 294
> will build on the post-282 tree. If 294 has already landed when you run, re-confirm the line.

## Goal

Replace each of the 10 app-code violations with the canonical primitive, **preserving exact
current behavior, every control, and visual parity**. This is a substitution + lockdown task,
NOT a redesign. Then re-run the scan to prove the app-code count is 0 (the test-fixture line is
the only acceptable remaining hit, allowlisted).

## Current behavior to preserve (Note 19 + 20 — inventory EACH surface in the session log)

For every file above, BEFORE editing, inventory in the session log: every interactive control on
the surface, its handler, the server action/route it calls, its success/error/loading state, and
its mobile (320px `uk`) behavior. AFTER editing, re-list and prove nothing was dropped. Specifically:

- **`MobileBottomNav`** — every nav item must still navigate to the same route, keep its active
  state, icon, label, and 44px touch target.
- **The four admin overlays (Legal / Locations / PropertyTypes ×2)** — every field, the
  create/edit/delete actions, validation, save behavior, the close/cancel/backdrop/Esc paths, and
  the success/error toasts must all still work. `Dialog` must close on Esc + backdrop + Cancel
  (Note 19 "cancel/dismiss" branch). Do NOT lose the existing form state or submit handler.
- **`CabinetShell` tabs** — every tab that exists today must remain, in the same order, with the
  same panel content, keyboard accessibility, and deep-link/active behavior. shadcn `Tabs` must
  preserve any URL/query sync the hand-rolled version had.
- **`AdminUserAvatar` / `AdminDashboardRecentListings` buttons** — same onClick, same disabled
  states, same icon/label.

## Positive flow (per converted surface — happy path)

Actor: admin (admin surfaces) / any user (MobileBottomNav, CabinetShell). On the surface:
1. The control renders identically (canonical primitive, same label/icon/size/variant).
2. Activating it triggers the SAME handler / navigation / dialog-open as before.
3. For dialogs: open → fill → save → success toast → dialog closes → list refreshes.
4. For tabs: click a tab → its panel shows → active style updates → (deep link if present) updates.
5. Post-condition: identical to pre-282 (same DB writes, same navigation target, same refresh).

## Negative flow (every off-happy-path branch — implement + verify each)

- **Dialog cancel/dismiss:** Esc, backdrop click, and Cancel button all close the dialog with NO
  mutation (no DB write, no toast-success). Currently the hand-rolled overlay handles this; the
  `Dialog` migration must keep it.
- **Validation error:** invalid field → inline/toast error, dialog stays open, no write.
- **Server error / 500:** error toast (existing locale key), dialog stays open, recover by retry.
- **Loading/pending:** save button shows pending state, no double-submit (preserve any existing guard).
- **Tab with no content / empty state:** unchanged from today.
- **Mobile 320px `uk`:** dialog/sheet/tab/button all usable, no overflow, 44px targets.

## Required investigation (PASTE outputs in the session log)

```
npm run governance:primitives        # capture the BEFORE list (13) verbatim
sed -n '40,75p' src/components/admin/AdminDashboardRecentListings.tsx
sed -n '40,120p' src/components/admin/AdminLegalManager.tsx
sed -n '80,140p' src/components/admin/AdminLocationsManager.tsx
sed -n '95,210p' src/components/admin/AdminPropertyTypesManager.tsx
sed -n '95,130p' src/components/shared/FiltersPanel.tsx
sed -n '95,140p' src/modules/cabinet/components/CabinetShell.tsx
sed -n '160,185p' src/components/admin/AdminUserAvatar.tsx
sed -n '65,90p'  src/components/layout/MobileBottomNav.tsx
grep -rn "Dialog\|Sheet\|Tabs" src/components/ui/        # confirm canonical primitives' APIs
```
Then, for each overlay, decide `Dialog` vs `Sheet`: modal create/edit forms → `Dialog`; the
mobile filter drawer (`FiltersPanel`) → `Sheet`. Document the choice per file.

## Scope (files Sonnet may touch)
- The 8 component files listed (rows 1–10 above).
- `scripts/governance/*.allowlist*` ONLY if needed to allowlist the AuthContext test fixture
  (`AuthContext.test.tsx:296`) — document why; do NOT rewrite the test.
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-282-design-system-lockdown.md` (NEW).
- A Storybook story ONLY if a converted component becomes a new `shared-ui`/`canonical` entry
  (unlikely — these are usages, not new primitives).

## Out of scope (do NOT touch)
- **Task 283's files:** `AdminListingsTable.tsx:466`, `AdminSettings.tsx:128`, `AdminUsersTable.tsx:98`
  (button-LIKE className clones — those are 283's), the `py-10` in `CollectionsSection.tsx:129`, and
  any arbitrary font-size cleanup. Leave all Tailwind-entropy debt to Task 283.
- The AuthContext **test** `<button>` (test fixture — allowlist, do not convert).
- Any visual redesign, spacing change, color change, copy change, or new feature.
- Filter selection logic / counting (Task 294).
- Production auth, RLS, server actions' business logic.

## Acceptance criteria (literal)
- `npm run governance:primitives` → app-code violations = **0** (only the allowlisted test fixture may remain; state the exact remaining line).
- Each of the 10 conversions uses the canonical primitive (`Button` / `Dialog` / `Sheet` / `Tabs`), no raw `<button>`, no `div.fixed.inset-0`, no `role="tab"` left in those files.
- Every existing control on each surface is preserved (before/after inventory in the log — Note 20); every dialog closes on Esc + backdrop + Cancel with no mutation (Note 19 cancel branch).
- No visual regression: converted controls match prior size/variant/label/icon; verified at 320/375/390/768/1280/1440/2560 in `uk`.
- All four locales render (sq/en/uk/it) — no new hardcoded strings; reuse existing keys.
- `npx tsc --noEmit` → 0 errors. `npm run build` → passes. `npm run lint` → 0 new errors/warnings vs the documented Sprint-17 baseline (7 errors / 10 warnings).
- `npm run governance:report` (or `governance:primitives`) AFTER, pasted, showing the drop.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table (Task 264) in the session log.
- Self-validation verdict line: `Self-validation: tsc=0 · build=passes · primitives app-violations=0 · controls preserved · locales=4 · breakpoints=7 · scope=clean · PASS`.

## Final report required
1. Files Changed table. 2. Before/after `governance:primitives` counts. 3. Per-file: primitive chosen + why (Dialog vs Sheet). 4. Before/after control inventory per surface (nothing dropped). 5. Cancel/dismiss + error + loading branch evidence. 6. Locale + breakpoint verification. 7. Confirmation 283's files + font-size debt were NOT touched.

Do NOT emit git commands. Do NOT run git. Do NOT redesign. Do NOT touch Task 283 / 294 files. STOP & ASK if any conversion would change behavior you cannot preserve.
