# Sprint 18 — Task 283 kickoff (Governance debt burn-down — Tailwind entropy)

> **Mandatory rules:** `docs/agent-contract.md` clause 6a (Positive + Negative flow) + clause 10 (Task 264 commit hand-off — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator emits explicit-path commits; owner runs them).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **Tailwind / styling governance** task — pre-read that bundle from `docs/rule-index.md` (`tailwind-governance.md`, `tailwind-canonical-fragments.md`, `tailwind-entropy-audit.md`, `ui-rules.md`, `qa-rules.md`). No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

---

```
Type:        refactor (styling entropy burn-down) — NO behavior change, NO visual redesign
Priority:    HIGH
Area:        Tailwind canonical fragments — button-like clones, section padding, arbitrary font-sizes
```

## Why this task exists (measured, 2026-05-29)

`npm run governance:tailwind` reports **123 total arbitrary values**; this task burns down the
three concrete, prioritized buckets (it does NOT chase all 123 — the rest stay tracked):

| Bucket | Severity | Count | Sites |
|--------|----------|-------|-------|
| Button-like styling outside canonical `Button` (fragment clones) | HIGH | 3 | `AdminListingsTable.tsx:466`, `AdminSettings.tsx:128`, `AdminUsersTable.tsx:98` |
| Non-canonical section padding `py-10` | MEDIUM | 1 | `CollectionsSection.tsx:129` |
| Arbitrary font-size values (`text-[Npx]`) | LOW | ~48 | scattered — full list from the scan |

> **Boundary with Task 282:** 282 converts *raw `<button>` elements* and *custom overlays* to
> canonical primitives. 283 converts *button-LIKE className styling on non-button elements* to the
> canonical `Button` (or a canonical fragment), fixes spacing, and normalizes font-sizes. The two
> task file-lists do NOT overlap. Do NOT touch any file in Task 282's list
> (`AdminDashboardRecentListings`, `AdminUserAvatar`, `MobileBottomNav`, `AdminLegalManager`,
> `AdminLocationsManager`, `AdminPropertyTypesManager`, `FiltersPanel`, `CabinetShell`).

## Goal

1. **HIGH — button-like clones (3):** replace the hand-rolled button styling with the canonical
   `Button` (`@/components/ui/button`) using the correct `variant`/`size`, OR — if it is genuinely
   not a button (e.g. a styled status pill) — extract/use the canonical fragment from
   `docs/tailwind-canonical-fragments.md`. Decide per site; document.
2. **MEDIUM — `py-10` (1):** replace with the canonical section-padding scale
   (`py-8 md:py-12` | `py-12 md:py-16` | `py-16 md:py-24`) — pick the closest existing rhythm on
   that page; document the choice.
3. **LOW — arbitrary font-sizes (~48):** map each `text-[Npx]` to the canonical type scale
   (`docs/ui-rules.md §2`). For any value with NO canonical equivalent that is intentional (e.g. a
   `text-[10px]` micro-label on a badge — which the rules explicitly allow), add an allowlist entry
   in `scripts/governance/tailwind-entropy.allowlist.json` WITH a one-line justification rather than
   forcing a wrong token. Never silence a warning without an allowlist entry + reason.

This is a styling-token normalization task. **No visual redesign, no layout change, no copy change.**
The rendered result must look the same (or canonically-corrected to the nearest token, sub-pixel).

## Current behavior to preserve
- The 3 button-like elements keep their exact onClick/handler, disabled state, label, icon, and
  position. Converting to `Button` must not change what they do — only how they're styled.
- `CollectionsSection` layout/visual rhythm stays effectively identical (nearest canonical padding).
- Every font-size change is visually within ~1–2px of the original (canonical scale), verified in `uk`.

## Positive / Negative flow
This task changes styling, not flow — but the controls it restyles are interactive:
- **Positive:** each restyled button still performs its action (sort/edit/settings save/etc.) exactly as before; the page renders with canonical tokens at all 7 breakpoints in `uk`.
- **Negative:** disabled/loading states preserved; no control becomes unclickable; long `uk` labels still fit (no new truncation — Note: do NOT add `truncate`/`whitespace-nowrap` to translated text per `ai-behavior.md` Tailwind anti-patterns); 320px has no overflow introduced by the change.

## Required investigation (PASTE in the session log)
```
npm run governance:tailwind                 # BEFORE: capture the full report (123 total + the 3 HIGH + py-10 + font-size list)
sed -n '455,475p' src/components/admin/AdminListingsTable.tsx
sed -n '120,135p' src/components/admin/AdminSettings.tsx
sed -n '90,105p'  src/components/admin/AdminUsersTable.tsx
sed -n '120,135p' src/modules/listings/components/CollectionsSection.tsx
# Extract the full arbitrary-font-size list from the scan output and paste it as the work checklist.
cat docs/tailwind-canonical-fragments.md   # canonical fragments to reuse
# (ui-rules.md §2 = canonical type scale)
```

## Scope (files Sonnet may touch)
- `src/components/admin/AdminListingsTable.tsx`, `AdminSettings.tsx`, `AdminUsersTable.tsx` (button-like → `Button`/fragment).
- `src/modules/listings/components/CollectionsSection.tsx` (`py-10` → canonical).
- Each file flagged for an arbitrary font-size (from the scan list) — token swap only.
- `scripts/governance/tailwind-entropy.allowlist.json` (justified allowlist entries only).
- `docs/tailwind-canonical-fragments.md` ONLY if a genuinely new canonical fragment must be documented (justify).
- `docs/backlog.md` (closure) + `docs/sessions/2026-05-29-task-283-governance-burn-down.md` (NEW).

## Out of scope (do NOT touch)
- ALL Task 282 files (raw `<button>` / overlays / tabs) — see boundary above.
- Task 294 filter logic.
- The other ~120 arbitrary values NOT in the three named buckets — leave tracked; do NOT expand scope.
- Any behavior, layout, copy, color, or feature change.

## Acceptance criteria (literal)
- The 3 HIGH button-like clones are gone from `governance:tailwind` (each converted to `Button` or a documented canonical fragment).
- `py-10` at `CollectionsSection.tsx:129` replaced with a canonical scale value; no other padding changed.
- Every targeted arbitrary font-size is either mapped to a canonical token OR allowlisted with a written reason; the scan's font-size bucket drops accordingly.
- `npm run governance:tailwind` AFTER: the 3 HIGH = 0, the `py-10` MEDIUM = 0, font-size bucket reduced to (canonical + allowlisted only) — paste before/after totals.
- No visual regression at 320/375/390/768/1280/1440/2560 in `uk`; no new truncation of translated text.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → 0 new vs Sprint-17 baseline (7/10).
- Note 18 self-validation + AC self-audit + "Files Changed" table (Task 264) in the session log.
- Self-validation verdict: `Self-validation: tsc=0 · build=passes · HIGH-button-like=0 · py-10=0 · font-size bucket reduced · no visual regression · scope=clean · PASS`.

## Final report required
1. Files Changed table. 2. Before/after `governance:tailwind` totals + per-bucket counts. 3. Per HIGH clone: `Button` variant/size chosen or fragment used + why. 4. `py-10` → which canonical value + why. 5. Font-size mapping table (each `text-[Npx]` → canonical token OR allowlist+reason). 6. Breakpoint/locale verification. 7. Confirmation no Task 282 / 294 file was touched.

Do NOT emit git commands. Do NOT run git. Do NOT redesign or change behavior. Do NOT touch Task 282/294 files. Do NOT chase entropy outside the three named buckets.
