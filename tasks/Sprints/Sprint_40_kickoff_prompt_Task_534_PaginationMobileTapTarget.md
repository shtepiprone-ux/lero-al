# Task 534 — Pagination mobile ≥44px tap-target (Sprint 40 Batch D follow-up)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-diff, emit commits).
> **Origin:** owner decision on Task 533 STOP-and-ASK #2/#3 (2026-07-03): the Pagination primitive
> renders at Mantine's stock **32px**, below both TailAdmin §6l (40×40 active / 42px prev-next) and the
> P0 **≥44px** mobile tap-target rule. Owner chose: **force ≥44px on mobile (<640px) only**; keep the
> desktop control size-agnostic so `MantineAdminSurfacePattern`'s responsive `size='sm'|'md'` contract
> (the reason Task 533 stayed size-agnostic) is NOT broken.
>
> **This is a follow-up to Task 533, not a re-open.** Task 533 (chrome conformance) stands on its own and
> is reviewed/committed independently. Do NOT touch Task 533's chrome rules except as noted below.

## Pre-read (rule-index → UI / layout / component task)

Always required: `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — pagination navigation is a listing/browse flow; if a row exists, baseline + cover it; if none, this cosmetic min-size change does not alter navigation behavior — state that explicitly, do not invent a row unless the change touches behavior).

Required (UI): `docs/tailadmin-style-reference.md` §6l (Pagination row — the 40/42px measurements + the source of the ≥44px reconciliation), `docs/mantine-responsive-design-system.md` **§7 (mobile gate) + §18 (theming/CSS pitfalls — state-dependent/breakpoint CSS lives in `pagination-chrome.css`, NOT `theme.components.*.styles`)**, `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Scope (HARD — do not exceed)

**One file expected:** `src/design-system/mantine/pagination-chrome.css`.
Add a `@media (max-width: 639.98px)` block that raises **every** Pagination control — plain number
controls AND the `.mantine-Pagination-edgeControl` (Prev/Next) — to a **minimum 44×44px** touch target
(`min-height`, `min-width`, and matching padding so the number/glyph stays centered and legible). Desktop
(≥640px) rendering is UNCHANGED — the base `.mantine-Pagination-control` rules from Task 533 and the
size-agnostic `theme.components.Pagination` block stay exactly as they are.

- Do NOT set `size=` in `theme.ts` (that would defeat the consumer's responsive `sm`/`md` and re-open the
  exact regression Task 533 avoided).
- Do NOT alter the active-page brand bg / white text, the inactive transparent/gray-700, the edge-control
  white bg + 1px gray-300 border, or any color/radius/font from Task 533. Min-size only, mobile only.
- Keep the `:not([data-active])` / `:not(.mantine-Pagination-edgeControl)` specificity discipline from the
  existing file — your media-query rules must not fight the active-state rule or the edge-control rule
  (re-verify computed styles, per the specificity bug Task 533 already caught).
- If Mantine's `--pagination-control-size` CSS var is the cleaner lever than raw `min-height`/`min-width`,
  you MAY use it **inside the media query only** — but re-verify the rendered box is ≥44px in BOTH axes and
  that the active pill, borders, and gap survive. Cite which mechanism you used and why.

## Mobile <640 full-width gate (clause 11) — explicit ruling for THIS surface

Pagination number/prev-next items are **individual compact controls in a horizontal group**, not a single
text control or a popup. The clause-11 "full-width per control" rule does **NOT** mean each pagination
number stretches edge-to-edge — that would be nonsensical. The applicable clause-11 obligations here are:
**(a) ≥44px touch targets on every item (this task's whole point),** and **(b) the group wraps without
horizontal scroll at 320px** in all four locales. Treat per-item full-width as a **documented compact-control
exemption** (analogous to the icon-only exemption) and write that one-line justification into the session log.
**If, when you render it, the ≥44px items cause horizontal overflow at 320px that wrapping does not resolve
cleanly — STOP and ASK the orchestrator; do not invent a scroll container or shrink below 44px.**

## TailAdmin conformance (clause 16)

Cite `docs/tailadmin-style-reference.md` §6l. Note in the session log that mobile ≥44px is *more*
conformant than the prior 32px (§6l reference is 40/42px); desktop remains size-agnostic by explicit
owner/kickoff mandate (consumer-preservation), which is a documented, intentional divergence from the
§6l fixed 40/42 — not an invented value. Zero new colors/px/radius/shadow beyond the 44px min-size.

## Positive flow (happy path)

- **Actor:** any user on a paginated surface (e.g. admin list, search results) at <640px.
- **Preconditions:** a Pagination control is rendered with ≥2 pages.
- **Steps → system response:**
  1. User loads the page at 320/375/390px → every pagination item (numbers, `…`, Prev, Next) renders at
     ≥44×44px; active page keeps the brand pill + white text; inactive stay transparent/gray-700; Prev/Next
     keep white bg + 1px gray-300 border.
  2. User taps a page number → navigation works exactly as before (no behavior change; this is a size-only
     change). Active pill moves to the tapped page.
  3. User taps Prev/Next → same pre-existing behavior.
- **Success state:** all items are comfortably tappable (≥44px), no clipped glyphs, gap preserved (§6l 8px).
- **Post-conditions:** none beyond navigation that already existed. No DB/network/route change introduced.

## Negative flow (every off-happy-path branch)

- **Desktop ≥640px:** the media query MUST NOT apply — control size stays exactly as Task 533 shipped
  (size-agnostic; consumer `sm`/`md` intact). Verify at 768/1280/1440/2560 that nothing grew to 44px.
- **Disabled Prev/Next (first/last page):** `[data-disabled]` edge control still renders at ≥44px, still
  visually disabled, no hover bg — unchanged behavior, just bigger. No new interactivity.
- **`…` (dots) control:** if Mantine renders a non-interactive dots element, it should not be forced to a
  44px *touch* target if it is not tappable — match its height to the row so alignment holds, and note
  whether Mantine makes it a control or a plain span. Do not invent a click handler.
- **Long-locale / narrow (uk@320):** items wrap without horizontal scroll; no glyph clip. If unavoidable
  overflow appears → STOP and ASK (see gate above).
- **RTL / none applicable** — locales are sq/en/uk/it (all LTR); state N/A.

## Acceptance criteria (each maps to a flow + is diff/render-verifiable)

1. `pagination-chrome.css` gains a single `@media (max-width:639.98px)` block forcing every control
   (numbers + `.mantine-Pagination-edgeControl`) to ≥44×44px — *Positive flow step 1*, verifiable at
   `pagination-chrome.css:line`.
2. Desktop unchanged — no size rule outside the media query; `theme.ts` untouched — *Negative flow desktop*,
   verifiable by absence of any `theme.ts` change in the diff + the media-query bound.
3. Active/inactive/edge chrome from Task 533 preserved (no color/border/radius/gap change) — *Positive flow
   step 1*, verifiable in diff (only min-size/padding added).
4. **Rendered verification matrix** in the session log: breakpoints × sq/en/uk/it, with
   **uk@320/375/390 mandatory** stress cells, each cell showing computed item box ≥44px at <640 and the
   prior size at ≥640, no h-scroll at 320, gap intact. Machine-produced (`responsive-screenshots --assert`
   or the Mantine proof path) — self-reported PASS cells are auto-reject.
5. All gates green in the transcript AND a planted-violation FAIL transcript (e.g. temporarily lower the
   min to 20px → the ≥44px assertion FAILS; revert → PASS) proving the check is real.
6. File-integrity (clause 14) green transcript for the touched file; `tsc --noEmit`=0; `check:stories`,
   `check:i18n`, `check:mojibake`, `check:design-tokens:strict`, `check:file-integrity` all green.
7. Session log has the AC-by-AC self-audit table (citing Positive + Negative flows by name), the compact-
   control full-width exemption justification, the "Files Changed" table (1 row + rationale), and the
   self-validation verdict line. **No `git add`/`git commit` emitted by Sonnet** — orchestrator emits at review.

## STOP-and-ASK triggers (do not guess)

- If ≥44px items overflow at 320px in any locale and wrapping doesn't cleanly resolve it.
- If forcing 44px requires touching `theme.ts` `size` (it should not) — stop, because that risks the
  consumer `sm`/`md` regression Task 533 explicitly avoided.
- If the `…` dots element's correct treatment is ambiguous (tappable vs decorative).
