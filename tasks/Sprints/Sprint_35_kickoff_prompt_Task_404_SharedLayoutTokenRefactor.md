# Sprint 35 — Task 404 — Token refactor: `src/components/shared/**` + `src/components/layout/**` (Epic JJ Phase 3, area 2 of 4)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> Implements **Epic JJ** Phase 3, area 2. Replaces raw style-value literals in `shared/**` + `layout/**` with design
> tokens / named utilities (policy A). Depends on **Task 403** committed (`51999061a` + `8b0493934`). Unlike 403's pure
> primitives, this area includes **real responsive surfaces** (Combobox mobile bottom-sheet, Header, Footer,
> MobileBottomNav) — so the **mobile <640 full-width gate applies in full**.

```
Type:        UI/styling refactor (shared + layout) — consume-the-tokens (policy A)
Priority:    HIGH — area 2 of 4
Depends on:  403 (committed). Re-run check:design-tokens before/after to prove the SHARED+LAYOUT delta.
Area:        src/components/shared/** + src/components/layout/** (files below) +
             src/app/globals.css (ADD the owner-approved --text-2xs token ONLY) + docs/design-system.md (§22.2 text-2xs) +
             scripts/design-tokens-allowlist.json (Group B) + docs/backlog.md + docs/sessions/.
NON-goal:    admin/** + listing/** + app/** + modules/** (405–406). Any visual redesign. Creating ANY token other than the
             owner-approved --text-2xs (specifically NO --z-max — Q2 declined). Suppressing all text-[10px] blindly.
```

## Standing rules — Task 403 lessons (MANDATORY, verify each)
1. **Browser-computed equality is the PRIMARY inertness proof** — for every Group A swap, before/after `getComputedStyle`
   of the target property (this project) must be identical. Compiled CSS text need not be byte-identical (var-based OK).
2. **Rendered assertions are MANDATORY corroboration, not a replacement** — `npm run screenshots:assert` (full) +
   `screenshots:responsive` must pass; they corroborate, they do not substitute for the computed proof.
3. **Run `npm run check:file-integrity` after ANY manual/PowerShell text edit** (PowerShell `Set-Content` ≠ UTF-8 by
   default; it injected a phantom-NUL false alarm in 403). Confirm 0 NUL / no BOM on every touched file before claiming done.
4. **Task 408 (detector hardening) is a HARD dependency before Task 407** — do not let 407 claim a "strict raw-value gate".
5. **Detector blind spots must not be forgotten for 407** — if 404 encounters a raw form the detector misses
   (negative values, `calc()`, `min()/max()/clamp()`, upward shadows with negative offsets, etc.), **log it explicitly in
   the session note** so Task 408 closes it. A blind-spot value that is "fixed" but invisible to the gate must still be
   recorded (as the 403 `translate-y-[-2.5rem]` case showed).

## Coverage requirements — Localization + Responsive (MANDATORY)

**Localization coverage:**
- This task must preserve behavior and visual layout in **sq / en / uk / it**.
- `uk` at 320/375/390 is a mandatory **stress subset**, NOT a replacement for full locale coverage.
- Do NOT edit `messages/*.json` unless a real regression requires it and the owner approves.

**Responsive coverage:**
- Validate affected shared/layout surfaces at: **320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560**.
- 320/375/390 are the P0 mobile full-width proof points, **not** the whole responsive scope.

## Scope — SHARED (12) + LAYOUT (6) inventory from Task 402, classified

> **The listed `file:line` entries are the known Task 402 baseline, NOT a closed list.** Before editing, re-run
> `check:design-tokens` and reconcile EVERY current unsuppressed hit under `src/components/shared/**` and
> `src/components/layout/**`. If line numbers moved, search by file / path / raw value / class — not by stale line number.
> Do NOT leave any newly discovered SHARED/LAYOUT unsuppressed hit unresolved or undocumented.

### Group A — inert swaps to a spacing-backed named utility (DO; prove computed-identical)
| File:line | Raw | After (inert) | Note |
|---|---|---|---|
| `shared/FilterMultiToggle.tsx:26` | `min-h-[44px]` | `min-h-11` | 44px = `--space-11` (touch-target floor) |
| `shared/FilterToggleGroup.tsx:27,39` | `min-h-[44px]` ×2 | `min-h-11` | same |
| `layout/Header.tsx:191` | `max-w-[120px]` | `max-w-30` | 120px = spacing-30 (0.25rem×30 = 7.5rem) |
| `layout/Footer.tsx:72` | `max-w-[220px]` | `max-w-55` | 220px = spacing-55 (13.75rem) |

For EACH: render the element, read `getComputedStyle` (min-height / max-width), confirm identical to the raw. If
`min-h-11` / `max-w-30` / `max-w-55` is **not generated** in this project or **not computed-identical**, STOP & ASK
(do not assume Tailwind defaults — `max-w-*` relies on the dynamic `--spacing` scale, verify it resolves here).

### Group B — path-allowlist (dev-only / not production UI)
| File | Proposed allowlist reason | Confirm first |
|---|---|---|
| `shared/PerfDevOverlay.tsx` (`z-[9999]`, `text-[10px]`) | Dev-only performance diagnostic overlay, not shipped/rendered in production UI | **STOP & ASK / verify** it is genuinely dev-gated (not rendered in prod) before allowlisting the whole file. If it IS user-visible, treat its `z-[9999]`/`text-[10px]` under the Owner-Decision values below instead. |

**PerfDevOverlay dev-only proof (required IN THE SESSION LOG before path-allowlisting):**
- where it is imported / rendered;
- the exact dev/prod gating condition (env flag / `NODE_ENV` / mount guard);
- confirmation that it is NOT reachable in production UI.
If this cannot be proven, **do NOT path-allowlist the file** — handle its `z-[9999]` / `text-[10px]` under the normal rules (z-9999 exception / Group D).

### Group C — off-scale bespoke → exact-value inline suppression (policy A)
| File:line | Raw | Suppress reason (inline `// design-tokens-allow: <value> — <reason>`) |
|---|---|---|
| `shared/DatePicker.tsx:101` | `w-[272px]` | calendar grid fixed width; off-scale (no spacing token = 272px) |
| `shared/HeroSearchClient.tsx:10` | `h-[76px]` | hero search bar fixed height; off-scale |
| `layout/MobileBottomNav.tsx:27` | `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]` | bespoke UPWARD nav shadow (negative-y); no `--shadow-*` token matches. **Also a detector blind spot** (negative-offset shadow may evade the regex — log for Task 408). |

### Group D — `text-[10px]` → owner-APPROVED token promotion `text-2xs` (Q1 RESOLVED: add token)
Owner approved adding a **narrowly-scoped micro-label** token (NOT a general body size):
- Add to `globals.css` `@theme`: `--text-2xs: 0.625rem;` (10px) and `--text-2xs--line-height: 0.75rem;` (12px). Document in `§22.2`.
- **Swap `text-[10px]` → `text-2xs` ONLY where the usage is genuinely a micro-label** (badge, metadata, helper/counter,
  compact status text, dev/perf label). **Do NOT swap** for primary readable copy, form labels, button labels, filter
  chips, navigation labels, or any mobile-critical interactive control text — UNLESS the existing usage is explicitly
  verified decorative/secondary AND does not regress readability or the ≥44px touch-target rule. If an occurrence is
  ambiguous or interactive-critical, **leave it as `text-[10px]` and STOP & ASK** (do not force the swap, do not suppress-all).
- In 404 scope, evaluate each: `shared/FiltersPanel:410`, `shared/HeroSearch:132`, `layout/MobileBottomNav:46,80,87`
  (PerfDevOverlay:47 is covered by the Group B dev-only allowlist). Record per-occurrence: swapped vs left-as-is + why.
- **⚠️ Inertness nuance (MUST handle):** `text-[10px]` sets font-size ONLY; `text-2xs` ALSO sets `line-height: 0.75rem`
  (the paired token). So the swap is **font-size-inert but introduces a line-height** the raw did not set. Proof required:
  (a) computed `font-size` identical (10px) for each swap; (b) the introduced `line-height` documented (before vs after);
  (c) rendered before/after shows **no visible shift** for each swapped micro-label (single-line labels: typically none).
  Any occurrence showing a real vertical-rhythm/clip change → revert that one to `text-[10px]` and STOP & ASK. This is an
  owner-approved token promotion, proven by font-size equality + rendered no-shift (not pure computed equality).
- **Final allowed states (reconciles "leave + STOP&ASK" with "unsuppressed = 0"):** NO final state may contain an
  **unsuppressed** `text-[10px]` in SHARED/LAYOUT. Each occurrence must end as exactly ONE of:
  (a) swapped to `text-2xs` with the required proof; (b) kept as `text-[10px]` with an **exact inline suppression +
  documented reason**; (c) **reported as a blocker (STOP & ASK) WITHOUT claiming acceptance**. "Acceptance = unsuppressed
  SHARED+LAYOUT = 0" is met only by (a)/(b); (c) means the task is NOT done — never report a false green.
- **MobileBottomNav protection:** for `layout/MobileBottomNav`, treat navigation item **labels as interactive /
  mobile-critical by default** — do NOT swap nav labels to `text-2xs` unless that occurrence is proven decorative /
  secondary (not the primary nav label). Badges / counters / helper metadata MAY use `text-2xs` if the proof passes.
  (Explicit guard against swapping nav labels just to turn the gate green.)

### `z-[9999]` / `zIndex: 9999` (Q2 RESOLVED: do NOT add a token — keep as justified exception)
Owner declined a general `--z-max` (avoid legitimizing an "emergency z" everyone reaches for). Handle as:
- **`shared/Combobox.tsx:135,159,169` (inline `zIndex: 9999`):** FIRST attempt to bring the popup DOWN to an existing
  semantic layer (`z-popover`/`z-modal` = 50) — IF and only if rendered proof shows the mobile bottom-sheet still layers
  correctly above all product overlays (test combobox-inside-dialog, backdrop, nested popups). **If any stacking
  regression**, keep `zIndex: 9999` and add an exact-value inline suppression: `// design-tokens-allow: zIndex: 9999 —
  exceptional overlay escape-hatch for the mobile bottom-sheet portal; not a reusable layer (§22.4)`. Provide the rendered
  layering proof either way. (Expectation: the bottom-sheet likely must stay 9999 to sit above z-50 dialogs — but verify.)
  - **Classify each of the 3 occurrences (135/159/169) SEPARATELY — do NOT blanket-lower all three.** For each, the proof
    must cover BOTH the **desktop dropdown** behavior AND the **mobile bottom-sheet** behavior. Lower an occurrence to a
    canonical layer only if THAT occurrence is proven safe at both; otherwise suppress THAT occurrence with reason.
- **`shared/PerfDevOverlay.tsx:43` (`z-[9999]`):** covered by the Group B dev-only path-allowlist (no change).
- **Do NOT create `--z-max`.** Keep normal product overlays on the canonical z scale (dropdown/sticky/overlay/modal/popover/toast).

## Positive flow
1. Apply **Group A** swaps; produce the computed-equality proof for each.
2. Confirm **PerfDevOverlay** dev-only → add Group B path-allowlist entry (or reclassify per Owner Decision if prod-visible).
3. Apply **Group C** exact-value suppressions with reasons.
4. **Group D:** add the `--text-2xs` (+ `--text-2xs--line-height`) token to `globals.css` + `§22.2`; swap eligible micro-label
   `text-[10px]`→`text-2xs` (per-occurrence judgement + the exclusion list); leave/STOP&ASK the ambiguous/interactive ones.
   **z 9999:** try to lower Combobox to `z-popover`/`z-modal` (rendered layering proof) else suppress `zIndex: 9999` with reason.
5. Re-run `npm run check:design-tokens` → SHARED + LAYOUT areas drop to **0 unsuppressed**; paste before/after.
6. `npm run check:file-integrity` (0 NUL/BOM on all touched files), `npx tsc --noEmit` → 0, `npm run lint` → 0 new.
7. `npm run screenshots:assert` + `screenshots:responsive` → pass (corroboration). Produce computed proofs (primary).
8. Update `docs/backlog.md` + session log (Files-Changed table, AC self-audit, computed proofs, rendered corroboration,
   integrity transcript, the four-part token-resolution report, and any NEW detector blind spots found → for Task 408).

## Negative flow (must be proven)
- **Computed equality (primary):** before/after `getComputedStyle` per Group A swap (+ per token-swap if Q1/Q2 add tokens),
  identical. A swap without this is INCOMPLETE.
- **Rendered corroboration (mandatory):** `screenshots:assert` + `screenshots:responsive` pass; for the responsive
  surfaces (Combobox bottom-sheet, Header, Footer, MobileBottomNav) the after-shots show no layout/clip/overflow change.
- **🔴 Mobile <640 full-width gate (OWNER P0):** Combobox's mobile **full-width bottom-sheet**, Header, Footer, and
  MobileBottomNav must remain full-width/full-bleed at <640 with ≥44px targets and wrapping labels — confirm in the
  after-shots at 320/375/390 (uk mandatory). A z-index change to Combobox must NOT alter the bottom-sheet stacking.
- **File integrity:** `check:file-integrity` green on every touched file AFTER all edits (incl. any manual ones).
- **Suppression correctness:** each exact-value marker suppresses only its value; `check:design-tokens` shows 0 stale /
  0 missing-reason.
- **Blind spots logged:** any raw form the detector missed (e.g. the negative-offset MobileBottomNav shadow) is recorded
  in the session note as a Task 408 item.

## Acceptance criteria (machine-proven)
- Group A swapped + computed-identical proof per item; rendered matrix corroborates.
- PerfDevOverlay handled (allowlist if dev-only confirmed, else per Owner Decision).
- Group C exact-value suppressed with reasons.
- **Group D (`text-2xs`):** token added to `globals.css` + `§22.2`; eligible micro-label swaps done (per-occurrence log of
  swapped vs left + why); font-size computed-identical + line-height delta documented + rendered no-shift per swap;
  no swap on interactive/mobile-critical text.
- **z 9999:** Combobox either lowered to a canonical layer (rendered layering proof) or `zIndex: 9999` exact-value
  suppressed with reason; NO `--z-max` token created; PerfDevOverlay dev-only allowlisted.
- `check:design-tokens`: SHARED + LAYOUT unsuppressed = 0 (before/after pasted); 0 stale / 0 missing-reason; 0 new violations.
- `tsc=0`, `lint=0 new`, `check:file-integrity` green (post-edit), screenshots:assert + responsive pass.
- Mobile <640 full-width preserved (rendered evidence at 320/375/390, uk mandatory).
- **Coverage requirements met:** sq/en/uk/it preserved (uk@320/375/390 is the stress subset, not the whole scope); the
  full canonical breakpoint set validated (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560); `messages/*.json`
  untouched unless an owner-approved regression fix required it.
- **No unsuppressed `text-[10px]` remains in SHARED/LAYOUT** — every occurrence is swapped (proof) / exact-suppressed (reason) / reported as a blocker; MobileBottomNav nav labels NOT swapped unless proven decorative.
- Four-part token-resolution report present (fixed swaps / token-added-if-approved / path-allowlisted / inline-suppressed),
  headline **"unsuppressed SHARED+LAYOUT violations = 0"** (must not imply no bespoke values exist).
- New detector blind spots (if any) logged for Task 408.
- `docs/backlog.md` + session log updated. **No `git add`/`commit` from the executor.**

## Pre-read (mandatory — UI/styling bundle)
- `docs/agent-contract.md` (1–14) · `docs/backlog.md`
- `docs/design-system.md` (§22 token registry incl. §22.2 type / §22.4 z-index; §12a/§12b mobile contract; §3 viewports) — first
- `docs/ui-rules.md` · `docs/component-rules.md` · `docs/tailwind-governance.md` · `docs/qa-rules.md`
- `scripts/check-design-tokens.mjs` · `scripts/design-tokens-allowlist.json` · the committed Task 403 diff (pattern reference)

## Out of scope
- admin/** + listing/** + app/** + modules/** (405–406). Flipping the gate to strict (407). Detector hardening (408).
- Creating tokens not explicitly approved in the Owner Decisions. Any visual redesign.
