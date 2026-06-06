# Sprint 35 — Task 403 — Token refactor: `src/components/ui/**` (Epic JJ Phase 3, area 1 of 4)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> Implements **Epic JJ** Phase 3, first of four area-refactors. Replaces raw style-value literals in
> `src/components/ui/**` with design tokens / named utilities from `docs/design-system.md §22`. Depends on **Task 402**
> (detector + inventory) committed. This task is **visually inert** — every change must compile to the SAME pixels;
> proven by a rendered before/after matrix, NOT by reasoning or `tsc=0`.

```
Type:        UI/styling refactor (primitives) — consume-the-tokens
Priority:    HIGH — first consumer area; sets the pattern for 404–406
Depends on:  402 (check:design-tokens inventory). Re-run it to measure the ui-area count drop.
Area:        src/components/ui/** (Group A/B/C files) + scripts/check-design-tokens.mjs (Part 0 suppression) +
             scripts/design-tokens-allowlist.json (Group B) + docs/design-system.md §23.2 (suppression doc) +
             docs/backlog.md + docs/sessions/. No other src dirs.
NON-goal:    Refactoring shared/layout/admin/listing/etc. (404–406). Changing any visual value (except the owner-approved
             50ms duration harmonization). Adding new design tokens (policy A = allowlist, not new tokens).
```

## Scope — the exact UI-area inventory from Task 402 (20 items), classified

> The orchestrator pre-classified every item. Do NOT invent mappings — apply Group A, allowlist Group B, and apply the
> **owner-confirmed policy (A)** resolution for Group C (recorded below). No remaining STOP&ASK for the classification itself
> (but STOP&ASK still applies to any Group A utility that fails the project-local computed-value check).

### Group A — inert swaps to a named utility/token (DO these; zero visual change)
| File:line | Current (raw) | After (inert) | Why inert |
|---|---|---|---|
| `badge.tsx:8` | `focus-visible:ring-[3px]` | `focus-visible:ring-3` | Tailwind `ring-3` = 3px (named utility) |
| `scroll-area.tsx:21` | `ring-[3px]` | `ring-3` | same — 3px named utility |
| `sheet.tsx:58` | `translate-y-[2.5rem]` ×2 | `translate-y-10` | `2.5rem` = `--spacing-10` = `translate-y-10` |
| `sheet.tsx:58` | `translate-x-[2.5rem]` | `translate-x-10` | same |
| `sheet.tsx:58` | `translate-x-[-2.5rem]` | `-translate-x-10` | negative spacing-10 |
| `dropdown-menu.tsx:154` | `min-w-[96px]` | `min-w-24` | `96px` = `--spacing-24` (6rem) |
| `switch.tsx:19` | `w-[32px]` | `w-8` | `32px` = `--spacing-8` (2rem) |
| `switch.tsx:19` | `w-[24px]` | `w-6` | `24px` = `--spacing-6` (1.5rem) |
| `switch.tsx:19` | `h-[14px]` | `h-3.5` | `14px` = `--spacing-3.5` (0.875rem) |

**Project-local utility verification (MANDATORY before swapping — do NOT assume Tailwind defaults).** This project
overrides parts of the Tailwind theme (`@theme` in `globals.css`), so a "named utility" may be re-valued or not
generated at all. For EVERY Group A swap, the **browser-computed target property value must be identical in this
project**. Compiled CSS declarations are supporting evidence only; CSS text does NOT need to be byte-identical if Tailwind
emits equivalent variable-based declarations (e.g. `var(--spacing-10)` vs `2.5rem`). **If the browser-computed target
value differs, STOP & ASK.**
- Render the element with the raw value and with the named utility (`ring-3`, `translate-y-10`, `min-w-24`, `w-8`, `w-6`,
  `h-3.5`) and read `getComputedStyle(...)` for the affected property (ring width / translate / min-width / width /
  height). The computed values must match exactly. Paste the before/after computed values.
- Compiled-CSS declarations (the emitted rule for the raw vs the named utility) may accompany this as supporting evidence,
  but equivalence is judged on the **browser-computed value**, not CSS text equality.
- If the named utility is **not generated** in this project, or its browser-computed value is **not identical**, do **NOT**
  swap that item — **STOP & ASK**. Do not fall back to assuming the Tailwind default.
- Preserve every surrounding `data-[size=…]`/`data-[side=…]`/variant prefix verbatim.

**Proof hierarchy (Group A):** primary inertness proof = browser-computed target-property equality (above); corroboration
+ regression proof = the full rendered before/after matrix (Negative flow). The matrix is NOT downgraded — it remains a
mandatory governance/regression gate across all canonical breakpoints × locales.

### Group B — allowlist (genuinely NOT CSS-tokenizable; add to `scripts/design-tokens-allowlist.json` with justification)
| File:line | Raw | Why it cannot be a token |
|---|---|---|
| `appImageConfig.ts:104,162` | `sizes: '96px'` / `'80px'` | This is the Next/Image **`sizes`** media-descriptor string — the browser needs a concrete CSS length to pick a source; `var(--…)` is invalid there. |
| `appImageConfig.ts:219` | `#e2e8f0` | Color inside a standalone inline **SVG data-URI** blur placeholder — a self-contained SVG string, no access to CSS custom properties. |

Add a single allowlist entry `"src/components/ui/appImageConfig.ts": "Next/Image sizes media-descriptor strings + inline SVG blur placeholder color — neither can reference CSS custom properties"`. Re-run `check:design-tokens` to confirm the file drops out of the report.

### Group C — OFF-SCALE values — RESOLVED via owner policy (A): allowlist bespoke + harmonize duration
Suppressions use the **exact-value** inline marker `// design-tokens-allow: <exact raw value> — <reason>` (see Part 0).
The marker suppresses ONLY the named value on that line; any OTHER raw value on the same line is still reported.

| File:line | Raw | Resolution |
|---|---|---|
| `navigation-menu.tsx:88,112,119` | `duration-[0.35s]` ×3 | **Motion harmonization → `duration-300`** (`--duration-slow`; same element already uses `duration-300`). This is **NOT pixel-identical** — it is an owner-approved timing change (350ms→300ms). Prove via computed `transition-duration` evidence (see negative flow), not screenshots. |
| `checkbox.tsx:13` | `rounded-[4px]` | **Suppress:** `// design-tokens-allow: rounded-[4px] — 4px corner on a 16px box; no scale radius token (radius-sm = 7.2px here)` |
| `tabs.tsx:30` | `p-[3px]` | **Suppress:** `// design-tokens-allow: p-[3px] — tablist inset; off-scale (space-0.5=2px, space-1=4px)` |
| `button.tsx:26` | `text-[0.8rem]` | **Suppress:** `// design-tokens-allow: text-[0.8rem] — 12.8px on size=sm button; off-scale (xs=12px, sm=14px)` |
| `switch.tsx:19` | `h-[18.4px]` | **Suppress:** `// design-tokens-allow: h-[18.4px] — switch default track height; no scale token` (the other raws on this line are Group-A swaps, fixed first; the marker suppresses ONLY `h-[18.4px]`) |

> Note: `navigation-menu.tsx` also carries `ease-[cubic-bezier(0.22,1,0.36,1)]` — NOT detected by the gate (no easing
> rule in 402) and OUT of scope for 403. Do not touch it.

## Part 0 — EXACT-VALUE suppression (detector enhancement, required by policy A)
The 402 allowlist is **path-level** (whole file). Policy A needs **exact-value** exemption — NOT line-level. A line-level
"skip every match on a line containing the marker" is unsafe: a real raw value sitting next to a suppressed one would be
silently hidden. Add **exact-value inline suppression** to `scripts/check-design-tokens.mjs`, documented in
`docs/design-system.md §23.2`:

- **Marker format:** `design-tokens-allow: <exact raw value> — <reason>` (typically inside a `//` comment on the same
  physical line as the match, e.g. `// design-tokens-allow: rounded-[4px] — 4px corner, no scale token`).
- **Suppression semantics:** a detected match `M` on line `L` is suppressed **only if** line `L` contains a marker whose
  `<exact raw value>` **string-equals `M`** (exact, case-sensitive match of the raw token, e.g. `rounded-[4px]`). The
  scanner MUST still report **every other** raw value on line `L` that has no matching marker. Wording to use (do not use
  the false "one marker = one value"):
  > "One marker suppresses one exact value string on that physical line. Distinct raw values on the same line need
  > distinct markers. Duplicate occurrences of the same exact value on the same line are suppressed together; split the
  > line if occurrence-level control is needed."
- **Duplicate-value edge (document in Part 0 AND `docs/design-system.md §23.2`):**
  > "If the same exact raw value appears multiple times on the same physical line, one
  > `design-tokens-allow: <exact raw value> — <reason>` marker suppresses all occurrences of that exact value on that line.
  > If only one occurrence should be suppressed, split the class/value string so the occurrences live on separate physical
  > lines before adding the marker."
  This is acceptable for Task 403 (the Group C suppressed values are unique per line), but it MUST be documented for 404–406.
- **Reason is REQUIRED:** a marker with a missing or empty `<reason>` (nothing after `—`/`-`) is an **error** — the
  scanner reports it as a violation in BOTH report and strict modes (exit 1 in strict; surfaced + fails AC in report).
  It must NOT be a harmless warning. (This keeps every suppression justified.)
- **Marker for a value not present on the line** (stale/typo'd `<exact raw value>`) → report it as a stale-marker
  violation (so suppressions can't drift). Place the marker on the SAME physical line as the value; if the class string
  wraps across lines, STOP & ASK.
- This change is in-scope for 403 ONLY because Group C needs it; do not otherwise alter the detector's detection rules.

## Positive flow
1. **Part 0:** add the **exact-value** `design-tokens-allow: <value> — <reason>` suppression to `scripts/check-design-tokens.mjs`
   (reason required = error if missing; same-line other values still reported) + document in `§23.2`.
2. Apply all **Group A** swaps — but FIRST run the project-local utility verification (compiled CSS, computed-identical);
   STOP & ASK on any non-generated / non-identical utility.
3. Add the **Group B** path-level allowlist entry for `appImageConfig.ts`; re-run `check:design-tokens` → file gone from report.
4. **Group C:** harmonize `navigation-menu.tsx` `duration-[0.35s]`→`duration-300` (×3); add the four **exact-value**
   `// design-tokens-allow: <value> — <reason>` markers (checkbox/tabs/button/switch) exactly as written in the Group C table.
5. Re-run `npm run check:design-tokens` → **unsuppressed UI violations = 0** (Group A fixed, B path-allowlisted, C
   suppressed/harmonized). Paste before/after.
6. `npm run check:file-integrity`, `npx tsc --noEmit` → 0, `npm run lint` → 0 new, `node --check scripts/check-design-tokens.mjs`.
7. Update `docs/backlog.md` + session log (Files-Changed table, AC self-audit, integrity transcript, rendered matrix, the
   computed `transition-duration` before/after evidence, and the **token-resolution report** from "Final report semantics").

## Negative flow (must be proven)
- **Canonical rendered matrix (mandatory corroboration + regression gate):** rendered before/after screenshots of every
  touched primitive's EXISTING story at the **full lero-al breakpoint set — 320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 ·
  960 · 1024 · 1200 · 1440 · 1920 · 2560 × sq/en/uk/it** (uk@320/375/390 mandatory stress cells). Before = current `HEAD`;
  after = the diff. Each pair MUST be **pixel-identical** for Group A swaps. A single differing pair = the swap was not
  inert → fix or route that item to STOP & ASK. This gate is NOT downgraded by the computed proof below — it is required in
  full. `tsc=0`/build-pass is NOT accepted as proof (clause 12/13).
- **Group A primary inertness proof — browser-computed target-property equality:** for each Group A swap, the before/after
  `getComputedStyle` value of the affected property (this project) must be identical (see "Project-local utility
  verification"). This is the PRIMARY proof; the rendered matrix is its corroboration. A swap without the computed-equality
  proof is INCOMPLETE.
- **Group C duration — computed timing evidence (NOT screenshots):** static screenshots cannot prove timing. **Primary
  proof = computed `transition-duration`** of the affected `navigation-menu` element **before** (`HEAD`: 350ms) and
  **after** (`300ms`), confirming the ONLY change is `350ms → 300ms`. **Screenshots here prove only the absence of
  layout/color/transform-position regression**, not the timing. `transition-property` and all other computed styles must
  be unchanged.
- **Exact-value suppression probe (Part 0):** on a single planted test line containing TWO raws — one with a matching
  `design-tokens-allow: <value> — <reason>` marker and one WITHOUT — prove the scanner suppresses ONLY the marked value
  and STILL reports the unmarked one. Also prove a marker with an empty reason → exit 1 (strict) / fails AC (report), and
  a marker naming a value not on the line → reported as stale. Delete the probe (ask owner to delete if mount blocks rm).
- **No control/variant lost:** every `data-[size=…]`, `data-[side=…]`, `max-sm:*`, `focus-visible:*`, `aria-invalid:*`
  prefix on each touched class string is preserved (before/after class inventory in the log).
- **Mobile <640 full-width gate:** these primitives (button/tabs/sheet) already carry `max-sm:w-full` / full-bleed
  sheet rules — confirm the refactor does NOT drop or alter them; show the <640 frame still full-width in the after-shots.
- **Gate still green:** `check:design-tokens` shows **unsuppressed UI violations = 0** with NO new violations anywhere.

## Acceptance criteria (machine-proven)
- **Part 0 (exact-value suppression):** detector suppresses a match ONLY when a same-line marker's `<exact raw value>`
  string-equals it; every OTHER same-line raw is still reported; a missing/empty `<reason>` is an **error** (exit 1 strict
  / fails AC in report, NOT a warning); a marker naming an absent value is reported as stale. `§23.2` documents it;
  `node --check` passes; the suppression probe (two raws, one marked) proves selective suppression + the no-reason failure.
- **Group A:** all items swapped to the exact named utility; diff shows each; PRIMARY proof = **browser-computed
  target-property equality** (before/after `getComputedStyle`, this project) in the log for each; corroborated by the
  pixel-identical rendered matrix. Compiled-CSS text need not be byte-identical (var-based declarations OK) as long as the
  computed value matches. Any non-generated / non-computed-identical utility was NOT swapped and was STOP&ASK'd instead.
- **Group B:** path-allowlist entry added with justification; `check:design-tokens` confirms `appImageConfig.ts` drops out.
- **Group C:** `duration-[0.35s]`→`duration-300` (×3) in nav-menu with **computed `transition-duration` before/after
  evidence** showing the ONLY change is 350ms→300ms (layout/color/position unchanged); the four bespoke values carry the
  exact-value `// design-tokens-allow: <value> — <reason>` markers and no longer appear unsuppressed.
- **Final token-resolution report present** (see "Final report semantics") — it must state **"unsuppressed UI violations = 0"**
  and itemise fixed swaps / harmonized duration / path-allowlisted files / inline-suppressed exact values with reasons.
  It must NOT claim or imply "no bespoke values exist".
- `check:design-tokens` **unsuppressed UI violations = 0** (before/after pasted); 0 new violations anywhere in `src/**`.
- `tsc=0`, `lint=0 new`, `check:file-integrity` green; **rendered matrix present at the full set 320·375·390·480·560·680·
  768·810·960·1024·1200·1440·1920·2560 × sq/en/uk/it** (uk@320/375/390 mandatory).
- Mobile <640 full-width preserved on button/tabs/sheet (rendered evidence).
- `docs/backlog.md` + session log updated (Files-Changed table matches the real diff).
- **No `git add`/`commit` from the executor** — orchestrator emits commits on review.

## Final report semantics (MANDATORY in the session log)
The "UI count = 0" is about UNSUPPRESSED violations — it must NOT be presented as "the UI area has no raw/bespoke values".
The session log MUST include a four-part token-resolution report:
1. **Fixed exact-token swaps** — each Group A item: raw → named utility + computed-value proof.
2. **Duration harmonized** — the 3 nav-menu values 350ms→300ms, with computed-timing evidence (owner-approved change).
3. **Path-allowlisted files** — `appImageConfig.ts` (+ reason).
4. **Inline-suppressed exact values** — the 4 bespoke values, each with its `<exact value> — <reason>` (these REMAIN in
   the code by design).
Headline line required verbatim: **"unsuppressed UI violations = 0 (4 bespoke values remain, inline-suppressed with reasons; 1 file path-allowlisted)"**.

## Epic JJ / Task 407 strict semantics (record verbatim in the session note; carry forward to 404–407)
Policy A means the final strict state is NOT "zero raw values exist". The canonical success definition for Epic JJ /
Task 407 is **"zero unjustified / unsuppressed raw style-value violations"**:
- Strict-mode success = **0 unsuppressed violations**.
- Path-allowlisted and inline-suppressed values are allowed **only with explicit justification**.
- Reports must **never imply that no bespoke raw values exist** if suppressed values remain.

**Escalation guardrail (404–407):** if the **same** bespoke off-scale value is inline-suppressed **3+ times** across areas
403–406, it must be **escalated as a token-candidate** for owner/orchestrator review instead of being repeatedly
suppressed. **Do NOT create any new token inside Task 403** — only document this guardrail and carry it forward to
404–407.

## Pre-read (mandatory — UI/styling bundle)
- `docs/agent-contract.md` (1–14) · `docs/backlog.md`
- `docs/design-system.md` (§22 token registry — the swap targets; §15 control heights; §3 viewports) — read FIRST
- `docs/ui-rules.md` · `docs/component-rules.md` · `docs/tailwind-governance.md` · `docs/qa-rules.md`
- `scripts/check-design-tokens.mjs` (the gate you must move the needle on) · `scripts/design-tokens-allowlist.json`

## Storybook safety rule (MANDATORY)
- Do **NOT** create, duplicate, rename, or edit any Storybook story (`*.stories.tsx`) in this task. Use the **existing**
  stories only to produce the rendered matrix.
- If a touched renderable primitive has **no existing story coverage**, do NOT scaffold one — **document the coverage gap
  in the session log and STOP & ASK**. (Story creation is governed by Task 398's `new:story` flow, not this refactor.)
- The rendered matrix is captured from existing stories; a primitive with no story whose refactor therefore cannot be
  visually proven must be flagged, not silently swapped.

## Out of scope
- shared/layout/admin/listing/app/modules areas (404–406). Adding easing detection (later). Any visual redesign.
- Touching `ease-[…]` in navigation-menu. Flipping the gate to strict (407). Creating/editing any Storybook story.

---

## ⛳ OWNER DECISION — RESOLVED 2026-06-06: policy (A)

**Allowlist bespoke off-scale values (value-level, via Part 0 inline suppression) + harmonize `duration-[0.35s]`→`duration-300`.**
Applies to Group C here AND to off-scale items in 404–406. The token *scale* stays clean; genuinely bespoke
primitive-internal pixels are suppressed inline with a justification; the one duration is harmonized (50ms, near-inert,
proven in the rendered matrix). Group C above is finalized accordingly — no remaining STOP&ASK for this task.
