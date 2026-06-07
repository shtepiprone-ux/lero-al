# Sprint 35 — Task 405 — Token refactor: `src/modules/listings/** + src/app/[locale]/listings/** + src/app/admin/page.tsx` (listing/app) (Epic JJ Phase 3, area 3 of 4)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> Implements **Epic JJ** Phase 3, area 3. Replaces raw style-value literals in the **listing** module and the
> **app listing/admin route** files with design tokens / named utilities / owner-approved **narrowly-scoped semantic
> tokens** (policy A). Depends on **Task 404** committed (shared/** + layout/** token refactor; `--text-2xs` already
> landed). This area includes **real responsive + mobile-critical surfaces** (ListingCard grid, ListingGallery,
> ListingMobileCTA sticky CTA, ListingsFilterBar / ListingsSortBar, ActiveFilterChips) — so the **mobile <640
> full-width gate applies in full**.

```
Type:        UI/styling refactor (listing module + app listing/admin routes) — consume-the-tokens (policy A)
Priority:    HIGH — area 3 of 4
Depends on:  404 (committed). Re-run check:design-tokens before/after to prove the LISTING+APP delta.
Area:        src/modules/listings/** + src/app/[locale]/listings/** + src/app/admin/page.tsx (the APP-area hits below) +
             src/app/globals.css (ADD only the owner-approved narrowly-scoped semantic tokens defined below) +
             docs/design-system.md (token registry) + docs/backlog.md + docs/sessions/.
             scripts/design-tokens-allowlist.json: do NOT add path-level allowlist entries for this task. Any allowlist
             change must be exact-value, minimal, justified, and only if the detector requires it for an approved
             token/suppression pattern (prefer Group A swap / Group E token / Group C exact-value inline suppression first).
             PLUS one explicitly-authorized cross-area micro-fix: src/components/shared/Combobox.tsx (comment §-ref only — see "Authorized carry-forward").
NON-goal:    admin/** components (406), modules/cabinet/** + modules/notifications/** + lib/** + stories/** (406/later).
             Any visual redesign. Creating ANY token beyond the owner-approved narrowly-scoped semantic token set
             defined in Group E (E1 gallery height tokens + E2 actual distinct ListingCard brand shadow tokens)
             (specifically NO generic --gallery-h-*, NO generic --shadow-brand-*, NO --z-max escape hatch).
             Editing src/stories/StoryListingCard.tsx (out of scope — record cross-scope occurrence, do NOT edit).
```

## Standing rules — Task 403/404 lessons (MANDATORY, verify each)
1. **Browser-computed equality is the PRIMARY inertness proof** — for every Group A swap and every new-token consumption,
   before/after `getComputedStyle` of the target property must be identical. Compiled CSS text need not be byte-identical
   (var-based OK).
2. **Rendered assertions are MANDATORY corroboration, not a replacement** — `npm run screenshots:assert` (full) +
   `npm run screenshots:responsive` must pass; they corroborate, they do not substitute for the computed proof.
3. **Run `npm run check:file-integrity` after ANY manual/PowerShell text edit** — confirm 0 NUL / no BOM on every touched
   file before claiming done.
4. **Task 408 (detector hardening) is a HARD dependency before Task 407** — do not let 407 claim a "strict raw-value gate".
5. **Detector blind spots must not be forgotten for 407** — if 405 encounters a raw form the detector misses
   (negative-offset shadows, `calc()`, `min()/max()/clamp()`, var-based arbitrary utilities, etc.), **log it explicitly in
   the session note** so Task 408 closes it. Carry forward the two blind spots already logged in Task 404 (inline
   `zIndex: N` marker-parser limitation; negative-offset upward shadows).
6. **Escalation guardrail honored (Epic JJ).** A bespoke value repeated 3+ times is a **token candidate**, not an
   exception to suppress again. The two 3+ cases in this area (gallery frame heights; ListingCard brand ring) were
   escalated to the owner and RESOLVED below as narrowly-scoped semantic tokens. Do NOT suppress them inline.

## Coverage requirements — Localization + Responsive (MANDATORY)

**Localization coverage:**
- Preserve behavior and visual layout in **sq / en / uk / it**. `uk` at 320/375/390 is a mandatory **stress subset**,
  NOT a replacement for full locale coverage.
- Do NOT edit `messages/*.json` (no new user-facing strings in this task).

**Responsive coverage:**
- Validate affected listing/app surfaces at: **320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560**.
- 320/375/390 are the P0 mobile full-width proof points, **not** the whole responsive scope.

## Scope — LISTING (26) + APP (6) inventory from `check:design-tokens`, classified

> **The listed `file:line` entries are the current baseline, NOT a closed list.** Before editing, re-run
> `check:design-tokens` and reconcile EVERY current unsuppressed hit under `src/modules/listings/**`,
> `src/app/[locale]/listings/**`, and `src/app/admin/page.tsx`. If line numbers moved, search by file / path / raw
> value / class — not by stale line number. Leave no LISTING/APP hit unresolved or undocumented.

### Group A — inert swaps to a spacing-backed named utility (DO; prove computed-identical)
| File:line | Raw | After (inert) | Note |
|---|---|---|---|
| `modules/listings/components/ActiveFilterChips.tsx:191` | `min-h-[44px]` | `min-h-11` | 44px = `--space-11` (touch-target floor) |
| `modules/listings/components/ListingsFilters.tsx:34` | `min-h-[44px]` | `min-h-11` | same |
| `modules/listings/components/ListingCard.tsx:183` | `min-h-[80px]` | `min-h-20` | 80px = 0.25rem×20 = 5rem |
| `modules/listings/components/ListingsSortBar.tsx:84` | `min-w-[140px]` | `min-w-35` | 140px = 0.25rem×35 = 8.75rem |
| `modules/listings/components/ListingFormShell.tsx:404` | `max-h-[32rem]` | `max-h-128` | 32rem = 0.25rem×128 = 512px |

For EACH: render the element, read `getComputedStyle` (min-height / min-width / max-height), confirm identical to the
raw. If a target utility is **not generated** in this project or **not computed-identical**, STOP & ASK (do not assume
Tailwind defaults — `max-w/h-*`/`min-w-*` rely on the dynamic `--spacing` scale; verify each resolves here).

### Group B — z-index swap to the canonical semantic token (DO; rendered layering proof)
| File:line | Raw | After | Note |
|---|---|---|---|
| `modules/listings/components/ListingGallery.tsx:135` | `z-[100]` | `z-toast` | `--z-toast: 100` (design-system §22.3 explicitly names "ListingGallery lightbox") — semantic, computed-identical (100). |

- Computed `z-index` must remain **100**. Provide **rendered layering proof** the lightbox still sits above all product
  overlays (header, sheet/dialog backdrops, combobox bottom-sheet). NO `--z-max`. If lowering causes any stacking
  regression, STOP & ASK (do NOT silently suppress `z-[100]`).

### Group C — off-scale bespoke → exact-value inline suppression (policy A)
| File:line | Raw | Suppress reason (inline `// design-tokens-allow: <value> — <reason>`) |
|---|---|---|
| `modules/listings/components/ListingMobileCTA.tsx:70` | `shadow-[0_-2px_12px_rgba(0,0,0,0.10)]` | bespoke UPWARD sticky-CTA shadow (negative-y offset); no `--shadow-*` token matches upward direction. **Also a detector blind spot** (negative-offset shadow may evade the regex — carry the Task 404/408 blind-spot note). |

> Note: this is the SAME upward-shadow class family as `MobileBottomNav` (Task 404 Group C). It is bespoke and
> single-occurrence in this area → exact-suppress (NOT a token candidate). Confirm via `check:design-tokens` the marker
> suppresses exactly this value (0 stale / 0 missing-reason).

### Group D — `text-[10px]` per-occurrence: swap → `text-2xs` (micro-label) OR exact-suppress (interactive/critical)
`--text-2xs` (0.625rem / line-height 0.75rem) already exists (Task 404, §22.2). Apply the **same Task 404 rules**:
- **Swap → `text-2xs` ONLY** where the usage is genuinely a micro-label (badge, counter, metadata, helper/compact status).
- **Do NOT swap** primary readable copy, form labels, button labels, filter chips, or **mobile-critical interactive
  control text** — exact-suppress those (`// design-tokens-allow: text-[10px] — <reason>`) instead.
- **Inertness proof per swap:** computed `font-size` identical (10px); the introduced `line-height: 0.75rem` documented
  before/after; rendered before/after shows **no visible shift**. Any real vertical-rhythm/clip change → revert that one
  to `text-[10px]` (suppressed) and note it.

Evaluate EACH occurrence; record swapped-vs-suppressed + reason in the per-occurrence log:
| File:line | Likely nature (executor confirms) |
|---|---|
| `modules/listings/components/ImageUpload.tsx:110` | helper/hint micro-text — verify |
| `modules/listings/components/ImageUpload.tsx:167` | helper/hint micro-text — verify |
| `modules/listings/components/ListingCard.tsx:81` | card badge/metadata — verify |
| `modules/listings/components/ListingCard.tsx:194` | card badge/metadata — verify |
| `modules/listings/components/ListingCard.tsx:255` | card badge/metadata — verify |
| `modules/listings/components/ListingCard.tsx:315` | card badge/metadata — verify |
| `modules/listings/components/ListingCard.tsx:388` | card badge/metadata — verify |
| `modules/listings/components/ListingsFilterBar.tsx:128` | filter-bar micro-label — verify (NOT a filter chip's primary label) |
| `modules/listings/components/ListingsSortBar.tsx:71` | sort-bar micro-label — verify |
| `src/app/admin/page.tsx:217` | admin dashboard micro-label — verify |
| `src/app/admin/page.tsx:261` | admin dashboard micro-label — verify |

**Final allowed states:** NO unsuppressed `text-[10px]` may remain in LISTING/APP. Each occurrence ends as exactly ONE
of: (a) swapped to `text-2xs` with proof; (b) kept as `text-[10px]` with exact inline suppression + reason; (c) reported
as a STOP & ASK blocker (then the task is NOT done — never report a false green).

### Group E — OWNER-APPROVED narrowly-scoped semantic tokens (3+ escalation resolutions)

> These tokens are approved for THIS task ONLY for the specific repeated pattern named. They are **narrow semantic
> primitives, NOT generic escape hatches.** Do not apply them to any unrelated surface.

**E1 — Listing gallery frame heights** (resolves the ~12× `h-[340px]/h-[420px]/h-[500px]` repetition).
- Add to `src/app/globals.css` (define once; `:root`/`@theme` as fits the existing token layer):
  - `--listing-gallery-h-mobile: 340px;`
  - `--listing-gallery-h-tablet: 420px;`
  - `--listing-gallery-h-desktop: 500px;`
- Consume in the **listing gallery frame pattern only** via `h-[var(--listing-gallery-h-mobile)]` /
  `sm:h-[var(--listing-gallery-h-tablet)]` / `lg:h-[var(--listing-gallery-h-desktop)]` (preserve the EXACT existing
  breakpoint→height mapping at each call site — read the current responsive classes and mirror them token-for-token).
- Apply ONLY at: `modules/listings/components/GalleryStaticFrame.tsx:32`, `modules/listings/components/ListingGallery.tsx:81`,
  `src/app/[locale]/listings/[slug]/loading.tsx:32`, `src/app/[locale]/listings/[slug]/page.tsx:375`.
- **Do NOT** create generic gallery/image tokens; **do NOT** adopt these on any other gallery/image/card surface unless it
  is literally the same listing gallery frame pattern.
- **Required proof:** (a) computed `height` at each breakpoint resolves to the previous exact px (340/420/500) at every
  call site; (b) rendered proof for the listing gallery AND the loading skeleton at the affected breakpoints (incl. uk);
  (c) document the three tokens in `docs/design-system.md` (semantic layout-token section / under §22 registry).
- **Detector check:** confirm `check:design-tokens` treats `h-[var(--token)]` as a NON-violation (it should — no raw
  px/rem literal). If the detector flags var-based arbitrary utilities, STOP & ASK and log it as a Task 408 blind spot.

**E2 — ListingCard brand-highlight ring/elevation shadows** (resolves the 3+ brand ring repetition).
- The ListingCard brand-highlight states apply a brand-colored ring + elevation (lines ~174 and ~278), e.g.
  ring `0 0 0 1px oklch(0.700 0.162 65 / 0.2)` (identical at both → 3+ with StoryListingCard) plus per-state elevation
  (`0 4px 16px oklch(… / 0.25)` and `0 8px 24px oklch(… / 0.2)`).
- Promote into **narrowly-named semantic shadow tokens** in `src/app/globals.css`, e.g.:
  - `--shadow-listing-card-ring: 0 0 0 1px oklch(0.700 0.162 65 / 0.2);`
  - `--shadow-listing-card-elevation-md: 0 4px 16px oklch(0.700 0.162 65 / 0.25);`
  - `--shadow-listing-card-elevation-lg: 0 8px 24px oklch(0.700 0.162 65 / 0.2);`
  - (Use the EXACT current values — read lines 174/278 first and mirror precisely; adjust token count/names to the
    actual distinct values found. If a value is single-occurrence and you are unsure whether to tokenize or suppress,
    STOP & ASK — owner authorized tokenizing the ListingCard brand ring/elevation pattern, not unrelated shadows.)
- Consume the ListingCard brand shadow as **ONE final `box-shadow` utility per state**, **only in ListingCard
  brand-highlight card states.** **Do NOT stack multiple `shadow-*` utilities on one element expecting them to merge** —
  CSS `box-shadow` is a single property; a second `shadow-*` class OVERWRITES the first, it does not combine ring +
  elevation. If the previous final `box-shadow` contains BOTH ring and elevation, either create/use a **combined** state
  token (e.g. `--shadow-listing-card-brand-md` / `--shadow-listing-card-brand-lg` holding the full `ring, elevation`
  comma-list) or a single var-composed `shadow-[...]` utility — and accept it ONLY if the computed `box-shadow` is
  EXACTLY identical to the pre-refactor value. (The distinct-ring/elevation tokens above are for documentation/reuse;
  the applied utility must still resolve to one identical final `box-shadow`.)
- **No unused documentation-only shadow tokens.** Every new `--shadow-listing-card-*` token must either be directly
  consumed in this task or be part of the single final consumed var-composed shadow value. Prefer the **smallest token
  set** that preserves exact computed `box-shadow` equality.
- **Do NOT** replace the neutral `--shadow-*` tokens; **do NOT** create a generic `--shadow-brand-*`; **do NOT** apply
  to panels, galleries, admin tables, dialogs, or generic cards.
- **Required proof:** (a) before/after computed `box-shadow` is the EXACT same string at each consuming element (the
  combined ring+elevation must render identically — multiple `shadow-*` on one element must reproduce the same final
  computed `box-shadow`); (b) rendered proof for ListingCard normal / hover / featured / brand-highlight states;
  (c) responsive proof across the canonical breakpoints; (d) locale preservation sq/en/uk/it; (e) document the tokens in
  `docs/design-system.md` under the §22.3 shadow/elevation registry, with a note that `StoryListingCard` uses the same
  semantic pattern.
- **StoryListingCard is OUT of scope** for Task 405. Do NOT edit `src/stories/StoryListingCard.tsx`. Record its
  same-pattern ring occurrence (and its `text-[10px]` hits) as a **cross-scope item for Task 406 / the stories task** in
  the session log — do NOT silently widen scope.

## Authorized carry-forward (explicit scope exception — Task 404 review finding)
- `src/components/shared/Combobox.tsx`: the `z-[9999]` inline suppression comment currently cites **"(§22.4)"** but the
  z-index escape-hatch is documented in **§22.3** (Elevation → Z-index). Fix the comment reference **§22.4 → §22.3**.
  This is a **comment-only** change (no code/behavior change), explicitly authorized here so it is not scope creep.
  Verify `check:design-tokens` still suppresses the Combobox `z-[9999]` correctly afterward (0 stale / 0 missing-reason).

## Positive flow
1. Re-run `check:design-tokens`; reconcile the full current LISTING+APP hit list (paste BEFORE).
2. Apply **Group A** inert swaps; produce computed-equality proof for each.
3. Apply **Group B** `z-[100]→z-toast`; produce rendered layering proof (computed z-index = 100).
4. Apply **Group C** exact-value suppression (ListingMobileCTA upward shadow) with reason.
5. **Group D:** per-occurrence evaluate each `text-[10px]` → swap to `text-2xs` (micro-label, with font-size-identical +
   line-height-delta + no-shift proof) OR exact-suppress (interactive/critical) with reason. Record per-occurrence.
6. **Group E (owner-approved tokens):** add E1 gallery-height + E2 ListingCard brand ring/elevation tokens to
   `globals.css`; consume them ONLY at the named call sites; document in `docs/design-system.md`. Produce the required
   computed + rendered proofs (E1 height per breakpoint; E2 exact computed `box-shadow`).
7. Apply the **authorized Combobox §22.4→§22.3 comment fix**.
8. Re-run `npm run check:design-tokens` → LISTING + APP unsuppressed = **0** (paste BEFORE/AFTER); 0 stale / 0
   missing-reason; 0 new violations introduced.
9. `npm run check:file-integrity` (0 NUL/BOM on all touched files), `npx tsc --noEmit` → 0, `npm run lint` → 0 new.
10. `npm run screenshots:assert` + `npm run screenshots:responsive` → pass (corroboration). Produce computed proofs (primary).
11. Update `docs/backlog.md` + session log (Files-Changed table, AC self-audit, computed proofs, rendered corroboration,
    integrity transcript, the four-part token-resolution report, per-occurrence Group-D log, the new Group-E token proofs,
    the StoryListingCard cross-scope note, and any NEW detector blind spots → for Task 408).

## Negative flow (must be proven — per change type, NOT one blanket "identical")
- **Group A swaps:** before/after `getComputedStyle` of the target property must be **identical** at the call site.
- **Group B z-index:** **rendered stacking/layering proof** required; computed z-index stays **100**; lightbox still
  above all product overlays. A regression → STOP & ASK (do not suppress).
- **Group D `text-2xs` swaps:** computed `font-size` stays **10px**; introduced `line-height` delta documented; rendered
  before/after shows **no visible shift**. Any shift/clip → revert that occurrence to suppressed `text-[10px]`.
- **Group E tokens:** (E1) computed `height` at each breakpoint = previous exact px (340/420/500) at every call site;
  (E2) computed `box-shadow` string EXACTLY equal before/after at each consuming element. A non-identical computed value
  = INCOMPLETE.
- **Rendered corroboration (mandatory):** `npm run screenshots:assert` + `npm run screenshots:responsive` pass; for the responsive
  surfaces (ListingCard grid, ListingGallery, ListingMobileCTA, ListingsFilterBar/SortBar, ActiveFilterChips, loading
  skeleton) the after-shots show no layout/clip/overflow change.
- **🔴 Mobile <640 full-width gate (OWNER P0):** ListingMobileCTA (sticky bottom CTA) stays **full-width/full-bleed** at
  <640; ListingsFilterBar/SortBar controls, ActiveFilterChips, and ListingCard grid remain full-width with ≥44px targets
  and wrapping labels — confirm in after-shots at 320/375/390 (uk mandatory). Token swaps must NOT alter any mobile
  layout/stacking. A non-full-width text/container surface at <640 without a documented exemption = REJECT.
- **File integrity:** `check:file-integrity` green on every touched file AFTER all edits (incl. any manual ones).
- **Suppression correctness:** each exact-value marker suppresses only its value; `check:design-tokens` shows 0 stale /
  0 missing-reason.
- **Blind spots logged:** any raw form the detector missed (negative-offset shadow; var-based arbitrary utilities; etc.)
  recorded in the session note as a Task 408 item; carry forward the two Task 404 blind spots.

## Acceptance criteria (machine-proven)
- Group A swapped + computed-identical proof per item; rendered matrix corroborates.
- Group B `z-[100]→z-toast` with computed z-index=100 + rendered layering proof; NO `--z-max`.
- Group C ListingMobileCTA upward shadow exact-value suppressed with reason.
- Group D: every `text-[10px]` in LISTING+APP ends swapped (proof) / exact-suppressed (reason) / reported as blocker;
  per-occurrence log present; font-size-identical + line-height-delta + no-shift proof for each swap; NO swap on
  interactive/mobile-critical text.
- Group E1: three `--listing-gallery-h-*` tokens added + documented; consumed ONLY at the 4 named gallery call sites;
  computed height = exact previous px at every breakpoint/call site; rendered proof (gallery + loading skeleton).
- Group E2: ListingCard brand ring/elevation promoted to narrowly-named `--shadow-listing-card-*` tokens + documented
  (§22.3); consumed ONLY in ListingCard brand-highlight states; computed `box-shadow` exactly identical before/after;
  rendered proof for the card states; StoryListingCard NOT edited but its same-pattern occurrence recorded cross-scope.
- Authorized Combobox §22.4→§22.3 comment fix applied (comment-only); Combobox `z-[9999]` still correctly suppressed.
- `check:design-tokens`: LISTING + APP unsuppressed = 0 (before/after pasted); 0 stale / 0 missing-reason; 0 new violations.
- `tsc=0`, `lint=0 new`, `check:file-integrity` green (post-edit), `npm run screenshots:assert` + `npm run screenshots:responsive` pass.
- Mobile <640 full-width preserved (rendered evidence at 320/375/390, uk mandatory).
- Coverage: sq/en/uk/it preserved (uk@320/375/390 stress subset); full canonical breakpoint set validated;
  `messages/*.json` untouched.
- Four-part token-resolution report present (fixed swaps / tokens-added / path-allowlisted / inline-suppressed),
  headline **"unsuppressed LISTING+APP violations = 0"** (must not imply no bespoke values exist).
- New detector blind spots (if any) logged for Task 408; the two Task 404 blind spots carried forward.
- `docs/backlog.md` + session log updated. **No `git add` / `commit` / `push` from the executor** (Files-Changed table only).

## Pre-read (mandatory — UI/styling bundle, per `docs/rule-index.md`)
- `docs/agent-contract.md` (1–14) · `docs/rule-index.md` · `docs/backlog.md`
- `docs/design-system.md` (§22 token registry incl. §22.2 type / §22.3 elevation+z-index; §12a/§12b mobile contract; §3 viewports) — first
- `docs/ui-rules.md` · `docs/component-rules.md` · `docs/tailwind-governance.md` · `docs/qa-rules.md`
- `scripts/check-design-tokens.mjs` · `scripts/design-tokens-allowlist.json` · the committed Task 403 + Task 404 diffs (pattern reference)

## Out of scope
- admin/** components (49 hits — Task 406), modules/cabinet/** + modules/notifications/** + lib/performance/** +
  src/stories/** (Task 406 / a stories task). Flipping the gate to strict (407). Detector hardening (408).
- Creating any token beyond the owner-approved narrowly-scoped semantic token set defined in Group E (E1 gallery
  height tokens + E2 actual distinct ListingCard brand shadow tokens). Any generic `--gallery-h-*`, `--shadow-brand-*`,
  or `--z-max`. Any visual redesign. Editing StoryListingCard.

> **Note for the orchestrator (Epic-table reconciliation):** `Epic_JJ_…` §Sequencing currently lists 405=admin /
> 406=listing+auth+remaining, but `docs/backlog.md` (authoritative active state) sets 405=listing+app / 406=admin+rest.
> This kickoff follows the backlog. Reconcile the Epic table to match in the next governance edit (with its commit).
