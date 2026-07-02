# Task 530 — TailAdmin conformance: overlay dropdown chrome (Popover · DropdownMenu · NavigationMenu)

> **Sprint 40 (TailAdmin conformance — ALL primitives). Executor: Sonnet 4.6.**
> **Why this task exists.** The Task 525 rendered audit marked all three overlay-dropdown primitives
> (`Popover`, `DropdownMenu`, `NavigationMenu`) as NEEDS CORRECTION — top finding: **missing
> `shadow-theme-lg`** on the desktop panel, plus the exact dropdown container/item chrome to verify (§6l
> `/dropdowns`). Task 528 corrected Popover **radius** (16→12px) and Modal/Drawer footer gap, but explicitly
> did NOT touch the overlay shadow or item chrome (see `docs/sessions/2026-07-02-task528-*.md` "Not touched",
> line 203–205). This slice closes the overlay-dropdown conformance for all three primitives in one change
> (Note 14 global-change: same finding, same fix, three siblings — fix together, no diverging call sites).
> Governed by **agent-contract clause 16** (TailAdmin style mandatory) + `docs/orchestrator-role.md` →
> "TailAdmin conformance gate". Owner scope decision (2026-07-02): **full dropdown conformance**, not shadow-only.

---

## Pre-read (rule-index → UI / layout / component task)

Always required: `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md`
(scan — this touches overlay styling, not a listed critical flow; confirm no registry flow is affected).

Required (UI):
- 🔴 **`docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — MANDATORY STYLE SOURCE OF TRUTH.** §5
  (shadows) + the `/dropdowns` and `/popovers` rows in §6l. **The exact `shadow-theme-lg` CSS value MUST be an
  authoritative cited value BEFORE it is used — if §5 does not yet carry the literal `box-shadow` string,
  EXTRACT it from the zip's `css/style.css` into a §5 row FIRST.** Zero invented shadow/color/px/radius.
- `docs/mantine-responsive-design-system.md` — §7 mobile gate, §12 canonical patterns, **§18 theming pitfalls
  (esp. §18.1: `theme.components.*.styles` is applied INLINE — relevant if you choose a class-based vs
  token-based shadow fix)**.
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- The existing overlay contract: `tailadmin-style-reference.md §6j` (Task 513 canonical Popover) and the
  `Popover`/`Menu` blocks already in `src/design-system/mantine/theme.ts` (lines ~371–390).

## Scope (do NOT exceed)

**Theme-level TailAdmin conformance for the three overlay-dropdown primitives + the §5 shadow extraction.**
Files expected in scope (confirm — nothing else without asking):
- `src/design-system/mantine/theme.ts` (shadow token / `Popover`+`Menu` chrome).
- `docs/tailadmin-style-reference.md` (§5 `shadow-theme-lg` literal-value extraction, if missing).
- `src/design-system/mantine/input-chrome.css` OR a dropdown CSS file — ONLY if a class-based shadow/chrome
  rule is the cleaner fix (justify in the log).
- `docs/backlog.md` + `docs/sessions/2026-07-02-task530-*.md`.

Do NOT touch the story CONTENT, the mobile bottom-sheet mechanism, or any overlay open/close behavior. If the
correct fix mechanism is genuinely ambiguous (token override vs scoped `styles.dropdown`), see "Required
after-behavior" #2 — it tells you when to STOP and ASK.

## Current behavior to preserve

- **`Popover` / `DropdownMenu` / `NavigationMenu` all open/close correctly** (Tasks 513/515/518): trigger click
  opens; **Esc + backdrop tap close**; focus returns to the trigger; keyboard nav works.
- **🔴 Mobile <640 full-width bottom-sheet (owner P0, clause 11)** for all three: edge-to-edge, bottom-anchored,
  rounded top corners, drag-handle, ≥44px targets, no h-scroll at 320. **This MUST NOT regress** — the shadow
  is a DESKTOP-panel (`≥640` anchored) concern only.
- `theme.ts` current state: `Popover.defaultProps { radius:'xl'(12px), shadow:'lg' }`, `Menu.defaultProps
  { radius:'2xl'(16px), shadow:'lg' }`, plus their `styles.dropdown` border/padding (from Task 527's committed
  code). Popover radius 12px and Menu radius 16px are CORRECT (§6l Addendum, Task 528) — do NOT change them.

## The confirmed delta (root cause — verified in the diff, not assumed)

`Popover.shadow:'lg'` and `Menu.shadow:'lg'` reference **Mantine's DEFAULT `theme.shadows` scale** — `theme.ts`
does **NOT** override `theme.shadows`, so the rendered `box-shadow` is Mantine's built-in `lg`, **not** TailAdmin
`shadow-theme-lg`. That is why the audit reads "missing shadow-theme-lg": a shadow renders, but it is the wrong
value. (Confirmed: `grep "shadows" src/design-system/mantine/theme.ts` returns no scale override.)

## Required after-behavior

1. **Extract first.** If `docs/tailadmin-style-reference.md §5` does not already carry the literal
   `shadow-theme-lg` `box-shadow` string, extract it from `demo_tailadmin_com.zip` `css/style.css` into a §5 row
   and cite it. Every value below traces to a §-row.
2. **Correct shadow, single-source.** The desktop (`≥640`) panels of all three overlays must render EXACTLY the
   TailAdmin `shadow-theme-lg`. **Preferred mechanism: override Mantine `theme.shadows.lg` to the cited TailAdmin
   value** (semantically aligned — `shadow-theme-lg` is "only on dropdowns/popovers/menus", §5 line 53). BEFORE
   choosing this: `grep -rn "shadow=[\"']lg[\"']\|shadow: *['\"]lg" src` for every `shadow="lg"` consumer. If any
   NON-overlay consumer relies on `lg` and would visually regress, do NOT globally override — instead apply the
   value via each overlay's `styles.dropdown.boxShadow` (scoped), and **STOP and ASK the orchestrator** to confirm
   the scoped approach. Either way: no diverging siblings — all three overlays end on the same correct shadow.
3. **Full dropdown chrome conformance (§6l `/dropdowns`), verified side-by-side with the zip for all 3:**
   container 1px border `gray-200 #e4e7ec`, padding 12px, width per §6l; **items** 14px / `gray-700 #344054` /
   padding 8–10px × 12px / radius 8px (`rounded-lg`). Correct any that do not already match; where 527's committed
   code already matches, record "already conformant" with the cited §-row + rendered evidence (canonical-first,
   no duplicate class). Popover container radius stays 12px; Dropdown/Menu stay 16px.
4. **Mobile <640 unchanged.** The shadow applies to the desktop anchored panel; the `<640` full-width bottom-sheet
   is edge-to-edge and MUST keep its existing treatment. Confirm the shadow change does not leak a floating-panel
   shadow onto the bottom-sheet in a way that breaks the edge-to-edge contract; if the bottom-sheet should keep or
   drop the shadow and the design is ambiguous, STOP and ASK.

## Positive flow (happy path) — per overlay (Popover, DropdownMenu, NavigationMenu)

- Actor opens the overlay (trigger click) at ≥640 → panel anchors to the trigger and renders the **correct
  `shadow-theme-lg`**, 1px `gray-200` border, correct radius (Popover 12px / Menu 16px), 12px padding; menu items
  render 14px / `gray-700` / 8px radius / correct padding. Keyboard nav + focus-return intact. Post-condition: no
  console error, no layout shift.

## Negative flow (every off-happy-path branch)

- **Cancel/dismiss:** Esc AND backdrop tap close the panel; focus returns to the trigger; no residual shadow/overlay.
- **Empty menu / no items:** panel still renders correct chrome, no crash.
- **Disabled trigger:** click is a no-op; panel does not open.
- **<640 bottom-sheet:** opens as full-width edge-to-edge bottom sheet (drag handle, ≥44px targets), NO horizontal
  scroll at 320, long `uk`/`it` item labels wrap (`whitespace-normal break-words`), never clip.
- **Locale mismatch:** all item strings resolve in sq/en/uk/it (parity); no raw literals.
- **Role/permission-gated items** (if any consumer passes them): unaffected by the styling change.

## Mobile <640 full-width gate (OWNER P0, clause 11) — MANDATORY

All three overlays remain **full-width bottom sheets at `<640`** (edge-to-edge, bottom-anchored, rounded-top,
drag-handle, ≥44px targets, labels wrap, no h-scroll@320). This task changes only the **desktop panel shadow/chrome**
and MUST NOT alter the `<640` bottom-sheet. No text/container surface may become non-full-width at `<640`.

## TailAdmin conformance gate (OWNER P0, clause 16) — MANDATORY

- Every value cited to a `tailadmin-style-reference.md` §-row (§5 shadow-theme-lg — extract first if missing; §6l
  dropdown container/item chrome; §6j Popover). ZERO invented shadow/color/px/radius.
- **Rendered proof SIDE-BY-SIDE with the zip** (the actual TailAdmin `/dropdowns` + `/popovers` panel next to the
  rendered Mantine overlay) at 320/375/480 × en/uk + sq/it@320 (**uk@320/375/390 mandatory**) **plus one ≥640 cell
  — the ≥640 cell is where the `shadow-theme-lg` is proven** (shadow is a desktop-panel concern). Border color,
  radius, shadow, padding, Outfit font, item density must visibly match. `tsc=0`/gates are BASELINE, never style proof.

## Rendered gate (Task 529 — now available) + its limitation

Run `npm run build-storybook && npm run screenshots:assert -- --mantine-only` — the three overlays are auto-discovered
and asserted in the OPENED state. **But per `storybook-governance.md §14.9.7 this is a crash-and-geometry gate — it
does NOT catch shadow/radius/border style deltas.** So the gate proves "opens without crash + no geometry defect";
the **TailAdmin shadow/chrome match is proven ONLY by the side-by-side rendered review above.** Both are required.

## Validation before claiming complete (clauses 9, 12, 13, 14, 16)

- `npx tsc --noEmit` = 0.
- `npm run check:stories`, `npm run check:i18n` (sq/en/uk/it parity), `npm run check:design-tokens:strict`
  (**0 unsuppressed raw shadow/hex/px** — the extracted shadow lives as a token, not a raw literal at a consumer),
  `npm run check:mojibake`, `npm run check:file-integrity` — all green; paste the transcript.
- `npm run screenshots:assert -- --mantine-only` green (baseline).
- **Rendered side-by-side matrix attached** (breakpoints × locales, ≥640 shadow cell) — the closing style proof.
- AC-by-AC self-audit table citing the Positive + Negative flows by name; Files Changed table (one row/path +
  rationale); update `docs/backlog.md` + add `docs/sessions/2026-07-02-task530-*.md`.
- **Do NOT run git. Do NOT emit `git add`/`git commit`** — the orchestrator commits after diff + rendered review.

## Acceptance criteria

1. `shadow-theme-lg` literal value is an authoritative §5 row (extracted from the zip if it was not already). (after-behavior 1)
2. All three overlay desktop panels render EXACTLY that `shadow-theme-lg`; single-source (theme token override) OR
   scoped-with-STOP-and-ASK justification; no `shadow="lg"` sibling regressed (grep evidence in log). (after-behavior 2)
3. Dropdown container + item chrome (border gray-200, radius, 12px padding, item 14px/gray-700/8px-radius/padding)
   verified side-by-side vs §6l for all three; corrections cited, already-conformant items recorded canonical-first. (after-behavior 3)
4. Mobile <640 full-width bottom-sheet for all three UNCHANGED (clause 11); no h-scroll@320; uk/it labels wrap. (after-behavior 4 + mobile gate)
5. Rendered side-by-side proof vs the zip at the required breakpoints × locales incl. the ≥640 shadow cell; `--mantine-only`
   gate green as baseline. (TailAdmin gate + clause 12/13)
6. Positive + every Negative branch verifiable in the diff/render; gates green; Files Changed table; backlog + session
   log updated; no git run by executor. (clauses 6a, 9, 10, 14)
