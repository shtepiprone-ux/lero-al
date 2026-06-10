# Sprint 35 — Task 414 — Slice 2 of the Global Responsive Rework: overlay/popup §26.2 bottom-sheet compliance (migrate raw `fixed inset-0` modals + manual popup QA)

**Type:** UI / overlay responsive migration (PRODUCT CODE) — Slice 2 of the Task 412 phased plan
**Executor:** Sonnet 4.6
**Status:** OPEN — hand off after the Task 413 / 410 / 411 rendered-proof bundle is committed
**Created by:** orchestrator, 2026-06-08, after Slice 1 (Task 413) approved (matrix 2520/2520 green)
**Reviewer:** Opus 4.7 orchestrator (rendered + manual §26.2 review; does not write product code)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST**, then `docs/design-system.md §26` (esp. §26.2) + §14. For ambiguity, follow **Task 412 P0 Addendum A7**: do not invent; do not halt the whole slice for one surface — mark it OPEN DECISION and continue — halt only if continuing would require an out-of-scope edit or weakening a P0 rule.

---

## What this slice is (and is NOT)

Slice 2 of the §18-compliant plan (`docs/responsive-storybook-inventory.md §5`). It enforces the **§26.2 "all popups = full-width bottom sheet at `<640px`"** contract.

**Critical context the executor MUST internalize before scoping:** the **canonical popup primitives already implement §26.2** — `Dialog`, `Sheet`, `Select`, `Popover`, `Command`, `DropdownMenu` already carry the `max-sm` bottom-anchored / rounded-top / `≤90dvh` / drag-handle treatment (via `mobile-bottom-sheet.ts` helpers + per-primitive `max-sm:` classes, shipped in prior DS sprints). **Do NOT rewrite, refactor, or "improve" the primitives** — verify them, do not touch them. If you believe a primitive is non-compliant, **STOP & ASK** (do not edit it).

So Slice 2 has exactly two kinds of work:

**(A) Migrate the raw `fixed inset-0` overlays that BYPASS the primitives** onto the canonical `Dialog` (or `Sheet side="bottom"`), so they inherit §26.2 for free. The complete enumerated target set (confirmed by `rg "fixed inset-0" src`):
1. `src/components/admin/AdminCurrenciesManager.tsx` — `CurrencyFormDialog` (raw `fixed inset-0 … flex items-center justify-center` centered card). **Migrate → canonical `Dialog`.** (Its detail/delete dialogs are already canonical — leave them.)
2. `src/components/admin/AdminExchangeProvidersManager.tsx` — the raw `fixed inset-0` form dialog (this file already imports `Dialog` for other modals; bring the raw one to the same canonical primitive). **Migrate → canonical `Dialog`.**
3. `src/modules/listings/components/ListingGallery.tsx` — `fixed inset-0 z-toast bg-overlay/95` **fullscreen image lightbox**. **DO NOT migrate to a bottom sheet. This is an OPEN DECISION → STOP & ASK** (see Negative flow). A fullscreen media viewer is a different pattern from a popup bottom sheet; §26.2 may not apply. Recommend to the owner: keep the fullscreen lightbox and record it as an approved §26.2 exception (sibling to the §26.3 map-marker exemption), OR convert to a documented fullscreen `Dialog` variant — owner decides. Do not change it in this task without the owner's pattern decision.

**(B) Manual §26.2 QA pass** on the popup-rendering stories (the ~21 "OPEN DECISION" rows in `docs/responsive-storybook-inventory.md §2`). Because `screenshots:assert` **cannot** machine-verify bottom-sheet compliance (`design-system.md §27.3` — geometry only), each popup's `<640` bottom-sheet rendering is confirmed by **rendered PNG + manual review** against §26.2. Where a popup story renders only a closed trigger (no open panel to photograph), add/adjust an **open-state story variant** so the bottom sheet is actually captured at `<640`. Fix any **consumer** (not primitive) that defeats the primitive's bottom sheet — e.g. a `max-w-*` that leaks below 640, a `layout:'centered'` story, or a hardcoded position override.

**NOT in scope (later slices / out of scope):**
- Primitive internals (verify only — never edit `ui/dialog.tsx`, `ui/sheet.tsx`, `ui/select.tsx`, `ui/popover.tsx`, `ui/command.tsx`, `ui/dropdown-menu.tsx`, `mobile-bottom-sheet.ts`).
- **§26.1 full-width control / action-button** compliance → that is **Slice 4** (admin shell + buttons). Do not pull it in here.
- `tableAt` / data-table work (Slice 1 done; Slice 3 for the rest).
- Public/Listing grid + container audit (Slice 5).
- Harness assertion changes (Slice 6).
- `ListingGallery` behavior beyond the owner's §26.2 pattern decision.

---

## Pre-read (per `docs/rule-index.md` — UI/layout + admin + Storybook)

**Always required:** `docs/agent-contract.md` (clauses 1–14, esp. clause 11 popup rule), `docs/backlog.md`.
**Required:**
- `docs/design-system.md` — **§26.2** (popup bottom-sheet contract table), **§26.3** (map-marker exemption — the precedent for any approved exception), **§26.4** (icon-only exemptions), **§14** (Dialog/Sheet/dropdown consistency, §14 tablet Dialog→Sheet at 1024), **§24** (no arbitrary-width / masking), **§25** (control preservation), **§27.3/§27.4** (what rendered proof does/doesn't cover; error-screen = FAIL).
- `docs/responsive-storybook-inventory.md` — **§2** (the OPEN DECISION popup rows) + **§5 Slice 2 row** + **§6/§MQ** (manual-QA items).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md`, `docs/qa-rules.md`, `docs/storybook-governance.md` (§MQ).
- **Reference:** the canonical `src/components/ui/dialog.tsx` (the `max-sm` bottom-sheet target the raw modals must match once migrated) + an existing canonical-Dialog consumer (e.g. AdminCompaniesManager's `CompanyFormDialog`, AdminPropertyTypesManager) as the migration template.

Do not read beyond this set.

---

## Current behavior to preserve (control inventory — A4 + Note 22, mandatory in the session log)

For each migrated modal, a **before/after control inventory** proving nothing was lost. The raw `CurrencyFormDialog` and the AdminExchangeProviders form modal must keep, after migration to canonical `Dialog`: every form field, every label/helper/validation message, submit/cancel/destructive actions, the `disabled`/pending (`isPending`) states, toast-on-error, the `onClose`/backdrop/Esc dismissal, and focus return to trigger. **Required after-behavior:** identical fields/actions/validation, now inside the canonical `Dialog` so that at `<640` it renders as the §26.2 bottom sheet (bottom-anchored, edge-to-edge, rounded-top, drag-handle, `≤90dvh` internal scroll) and at `≥640` as the centered desktop dialog. No field removed, no action relocated without a documented new entry point.

---

## Positive flow (happy path)

1. Read the pre-read set + the canonical `Dialog` + a canonical-consumer template.
2. **(A)** Migrate `CurrencyFormDialog` (AdminCurrenciesManager) and the raw form modal in AdminExchangeProvidersManager from `fixed inset-0` to the canonical `Dialog`/`DialogContent` (mirroring `CompanyFormDialog`). Preserve every field/action/validation/state. Remove the hand-rolled backdrop/centering (the primitive supplies it).
3. **(B)** For each popup-rendering story flagged OPEN DECISION in the inventory: ensure an open-state renders at `<640` (add/adjust an open variant where the panel isn't otherwise captured), confirm the primitive's bottom sheet shows (bottom-anchored, edge-to-edge, drag-handle, no `max-w` leak), and fix any **consumer-level** breakage. Do not touch primitives.
4. Keep `sq/en/uk/it` parity for any new/changed string (none expected beyond reusing existing keys).
5. Run the full validation set (below). `screenshots:assert` stays green (no new FAIL, no error screens); the manual §26.2 QA matrix is recorded with rendered-PNG evidence at **uk@320/375/390** for every migrated modal + each popup category.
6. Mark `ListingGallery` as **OPEN DECISION** with the recommendation; do NOT change it.
7. Update `docs/backlog.md` + write the session log (before/after control inventory, manual §26.2 QA matrix with PNG paths, Files-Changed table). Emit NO git commands.

## Negative flow (every off-happy-path branch)

- **`ListingGallery` fullscreen lightbox** → **STOP & ASK** (clause 11 / §26.3 precedent). Do not convert it to a bottom sheet or change its behavior. Complete the rest of the slice (A7); present the owner the two options (keep fullscreen + approved-exception entry, vs. fullscreen `Dialog` variant) with a recommendation. Its resolution is a follow-up, not this diff.
- **A migrated modal would lose a field/action/validation/state** → A4 failure; the canonical `Dialog` version MUST carry all of them. Do not ship a reduced modal.
- **A primitive looks non-compliant** → STOP & ASK; do NOT edit the primitive (out of scope).
- **A popup story can't show its open state** without a structural change beyond a story variant → mark OPEN DECISION, do not force it.
- **A Leaflet/map-marker popup** is encountered (`Map.tsx`) → §26.3 exempt; STOP & ASK before touching.
- **Temptation to fix bottom-sheet width with `max-w-[…]`/arbitrary values or `overflow-hidden`** → forbidden (§24); the primitive already handles width — find the consumer override instead.
- **uk/it long labels** inside a sheet must wrap (`whitespace-normal break-words`, §26.2), never clip or h-scroll at 320.

---

## Mobile <640 §26.2 gate (RENDERED + MANUAL proof required)

Every migrated modal and every in-scope popup, at `<640`, must render as the §26.2 bottom sheet: bottom-anchored, edge-to-edge (no `max-w-*` leak), rounded-top only, slide-up, drag-handle bar, `≤90dvh` + internal scroll, ≥44px items, labels wrap, no h-scroll at 320; closes on backdrop tap + Esc with focus return. At `≥640` the desktop dialog/anchor behavior is restored. Because this is **not machine-verifiable** (§27.3), the session log MUST carry **rendered PNG evidence** (open state) at uk@320/375/390 per migrated modal + per popup category, manually confirmed against §26.2. Icon-only exemptions per §26.4 listed explicitly.

---

## Required validation (paste transcripts in the session log)

- `npx tsc --noEmit` → 0 new errors.
- `npm run lint` → 0 new errors/warnings (note: the pre-existing `AdminTable.stories.tsx:647` unused-disable warning is the registered hygiene item — if trivial to remove while here is fine, otherwise leave it).
- `npm run check:stories` → PASS (no `layout:'centered'/'padded'`, no raw controls, no hardcoded strings; any new open-state story stays canonical).
- `npm run check:i18n` → PASS (4-locale parity).
- `npm run check:story-coverage` → PASS.
- `npm run build-storybook` → builds.
- `npm run screenshots:assert` → `Viewports: 14`, `Locales: 4`; **no regression** (no new FAIL, no error screens) — count ≥ the 2520 baseline (new open-state stories add cells).
- **Manual §26.2 QA matrix** (the actual proof for this slice) in the session log: per migrated modal + per popup category, rendered PNG at uk@320/375/390 showing the bottom sheet; bottom-anchored ✓ edge-to-edge ✓ rounded-top ✓ drag-handle ✓ ≤90dvh scroll ✓ ≥44px items ✓ labels wrap ✓ no h-scroll@320 ✓ closes on backdrop+Esc ✓.
- **File-integrity (clause 14)** on every touched file: 0 NUL, no BOM, `tsc` clean, re-read tails. Paste the GREEN transcript.

---

## Acceptance criteria

- The two raw admin form modals (AdminCurrenciesManager `CurrencyFormDialog`, AdminExchangeProvidersManager) are migrated to the canonical `Dialog`; **0 raw `fixed inset-0` modal overlays remain in those two files**; all fields/actions/validation/states preserved (before/after inventory proves it).
- No primitive file edited; no §26.1 button work; no `tableAt` work; no arbitrary-width/`overflow-hidden`/masking introduced (§24).
- Every in-scope popup renders the §26.2 bottom sheet at `<640` (manual QA matrix with PNG evidence, uk@320/375/390); any consumer-level breakage fixed; icon-only exemptions listed.
- `ListingGallery` is documented as an OPEN DECISION with recommendation; left unchanged.
- `screenshots:assert` shows no regression / no error screens; `tsc=0 new`, `lint=0 new`, `check:stories`/`check:i18n`/`check:story-coverage`/`build-storybook` green; file-integrity GREEN.
- 4-locale parity; no hardcode; no story deleted/duplicated; no governance gate weakened.
- `docs/backlog.md` + session log updated; Files-Changed table matches the real diff. Executor emits NO git commands.

## Final report required from Sonnet

1. Before/after control inventory for each migrated modal.
2. The full raw-`fixed inset-0` enumeration + disposition (2 migrated; ListingGallery = OPEN DECISION).
3. Manual §26.2 QA matrix + sample PNG paths (uk@320/375/390).
4. Consumer-level fixes (if any); confirmation no primitive was edited.
5. Validation + file-integrity transcripts.
6. Files-Changed table.
7. The `ListingGallery` open decision + recommendation for owner.
8. Confirmations: no story deleted/duplicated; no governance gate weakened; no git commands emitted.

## Ordering

1. Land the Task 413/410/411 rendered-proof bundle + the Task 412 docs first.
2. This slice (414) → orchestrator reviews the rendered + **manual §26.2** evidence → owner native gate → commit emission.
3. Owner resolves the `ListingGallery` pattern decision (separate follow-up).
4. Then Slice 3 (admin data surfaces tableAt + tablet 768–1023), Slice 4 (§26.1 shell + action buttons full-width), Slice 5 (public/listing/system), Slice 6 (harness assertion hardening) — per `responsive-storybook-inventory.md §5`, one at a time, owner-approved between each. Then resume Epic JJ 408 → 407.
