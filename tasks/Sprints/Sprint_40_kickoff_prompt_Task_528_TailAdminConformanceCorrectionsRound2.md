# Task 528 — TailAdmin conformance corrections, ROUND 2 (fixes for the 3 defects Task 527 shipped)

> **Sprint 40 (TailAdmin conformance — ALL primitives). Executor: Sonnet 4.6.**
> **Why this task exists:** Task 527 was REJECTED by the owner on rendered review (2026-07-02). It claimed
> "all gates green / build-storybook compiles clean" but **captured NO rendered screenshots** (admitted in its
> own session log) — so a hard runtime crash and two visible mismatches shipped undetected. `build-storybook`
> compiling is NOT the same as the stories rendering. This round fixes the three confirmed defects and closes
> ONLY on machine-produced rendered evidence (agent-contract clause 12 + 13).

---

## Pre-read (rule-index → UI/layout/component task)

Always required: `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches no registry flow; confirm in the log).
Required (UI):
- 🔴 `docs/tailadmin-style-reference.md` — **§6l is the source of truth**, especially the new **"🔵 Addendum — Overlay footer button-group + Popover radius (measured live 2026-07-02)"** block, plus §6b (Status badge = `text-theme-xs` 12px) and §6e (input/Textarea state matrix).
- `docs/mantine-responsive-design-system.md` — **§18 Mantine theming/CSS pitfalls is MANDATORY** before touching any input/theme styling (the exact class of bug D1 belongs to).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Scope (do NOT exceed)

Only these three defects + the two associated verify-items. **No drive-by refactors, no re-touching primitives Task 527 got right** (border gray-3, label gap 6px, Select color, Button outline chrome, Card border gray-2, Dropdown/Menu shadow-lg, SegmentedControl active-label, Modal radius-8, composition title→body 8px / body→buttons 16px). If anything here is ambiguous → **STOP and ASK the orchestrator**; do not invent.

Files expected in scope (confirm — no others without asking):
- `src/design-system/mantine/theme.ts` (Badge size mapping; Popover radius; Textarea min-height removal)
- `src/design-system/mantine/input-chrome.css` (Textarea 44px min-height via class)
- `src/stories/mantine/primitives/Modal.stories.tsx`, `Drawer.stories.tsx`, `Popover.stories.tsx` (footer/button-group gap 20→12)
- locale files ONLY if a new string is added (none expected)
- `docs/backlog.md` + `docs/sessions/2026-07-02-task528-*.md` (session log + Files Changed table)

---

## Defect D1 (P0 — runtime crash): Textarea story throws

**Current behavior (broken):** the Textarea Default story renders an error overlay:
`Using style.minHeight for <TextareaAutosize/> is not supported. Please use minRows.`
**Root cause:** `theme.ts` → `Textarea.styles.input.minHeight: '2.75rem'`. Mantine `<Textarea>` renders via `TextareaAutosize`, which throws a hard guard on ANY `style.minHeight`. Applying it through `styles.input` (inline) triggers the guard.

**Required after-behavior:** the Textarea achieves the §6e/§6l 44px field height WITHOUT any inline `style.minHeight` on the autosize component, and the story renders with **no error overlay** at every breakpoint × locale.
- Remove `minHeight` from `theme.components.Textarea.styles.input` in `theme.ts` (keep the `color: gray-8`).
- Apply the 44px floor via a CSS class in `input-chrome.css` on `.mantine-Textarea-input` (`min-height: 2.75rem;`) — a class-applied min-height does NOT hit Mantine's JS `style.minHeight` guard (per `mantine-responsive-design-system.md` §18: chrome lives in `input-chrome.css`, not `theme.styles`).
- If the project's Textarea usages rely on `autosize` and a class min-height still visibly conflicts with autosize growth, STOP and ASK before switching to `minRows` (that changes the primitive's default props — needs orchestrator sign-off).

## Defect D2 (Badge oversized / clips): status badge is 14px, must be 12px

**Current behavior:** `theme.components.Badge` maps `size='sm'` → **14px** (`0.875rem`), padding 2×10. Status badges (Active/Pending/Blocked/Archived) render visibly larger than the TailAdmin reference and crowd/clip the pill.
**Source of truth:** §6l Badge row + §6l Addendum (D2) + §6b line 62 (`text-theme-xs`). TailAdmin has TWO badge widths; the **status** usage is the **12px `text-theme-xs`** variant, and §6l itself warns `size='sm'` "must map to the correct one per usage."

**Required after-behavior:** Badge `size='sm'` (the status default) renders at **12px / font-weight 500 / padding 2px × 8–10px / line-height 18px (text-theme-xs)** so it visibly matches the `demo.tailadmin.com/badge` compact status badge with **no vertical clip** and no overflow. The larger 14px variant may remain reachable via `size='md'` if a consumer needs it, but do NOT change any current `size='md'/'lg'/'xl'` consumer's rendered result unless it currently relies on `sm`. Cite every px to §6l/§6b. Do NOT invent a line-height — 18px is `text-theme-xs`'s cited value.

## Defect D3 (overlay footer button-gap wrong): 20px must be 12px + Popover radius 16→12

**Current behavior:** Modal/Drawer/Popover story footers use `gap="lg"` = **20px** between sibling buttons; `theme.ts` Popover `radius:'2xl'` = **16px**.
**Source of truth (measured live 2026-07-02, in the §6l Addendum):** overlay footer button-group = **12px (`gap-3`)**, right-aligned (`justify-end`) on desktop; Popover container radius = **12px (`rounded-xl`)** (dropdowns stay 16px — intentionally different).

**Required after-behavior:**
- Modal + Drawer story footers: change the footer `Flex gap` from `lg` (20px) to **`sm` (12px)** — keep the existing `direction={{base:'column-reverse', sm:'row'}}` and `justify sm:flex-end` (that already matches TailAdmin's desktop right-alignment; the mobile full-width column stays per the mobile gate).
- Popover story: any button-group spacing must be **12px**; the popover content rhythm (title→body 8px, body→buttons 16px) is already correct — do not change it.
- `theme.ts` Popover `radius:'2xl'` → **`xl` (12px)**. Verify against §6j (Task 513 canonical Popover) first — if §6j explicitly fixed a different radius, STOP and ASK. Menu/DropdownMenu stay `2xl` (16px).

---

## Positive flow (happy path) — per changed story

- **Textarea/Default:** open story at each viewport → field renders, ~44px tall resting, no error overlay, autosize still grows on input, label→field 6px, border gray-3, text gray-8.
- **Badge/Default:** open story → status badges (Active/Pending/Blocked/Archived) render compact 12px, text vertically centered, no clip, pill `rounded-full`; "long label / no clip" row wraps/fits without clipping.
- **Modal/Default & Drawer/Default:** click "Open modal"/open drawer → dialog opens; footer shows Cancel + Confirm **12px apart**, right-aligned at ≥640; radius 8px; title→body 8px.
- **Popover/Default:** click trigger → popover opens at ≥640 anchored with **12px radius**, border gray-200; any action buttons 12px apart.

## Negative flow (every off-happy-path branch)

- **Textarea invalid/`error` prop:** error border/text per §6e still applies; no crash; min-height still 44px.
- **Textarea disabled:** label + field + (no icon) dim together per §6e; no crash.
- **Modal/Popover cancel/dismiss:** Esc + backdrop tap + Cancel button all close; focus returns to trigger (unchanged from Task 520/513 — must still work).
- **Modal/Popover disabled trigger:** tap is a no-op, nothing opens (Popover story section 2 must still pass).
- **<640 mobile:** Modal/Drawer/Popover render as full-width bottom sheet (drag handle, ≤90dvh, footer buttons full-width stacked) — the gap change must NOT break the mobile full-width footer. Badge/Textarea no h-scroll at 320.
- **Locale uk/it long labels:** badge labels + modal footer labels wrap, never clip, no h-scroll at 320.

## Mobile <640 full-width gate (P0)

No regression: Modal/Drawer/Popover stay full-width bottom sheets at `<640`; footer buttons stay **full-width stacked** (`w={{base:'100%', sm:'auto'}}` unchanged) — the 20→12px change applies to the **desktop row gap** and the mobile column gap alike (12px column gap is fine). Icon-only Popover trigger (section 3) stays exempt/compact. Verify no text/container surface goes content-width.

## TailAdmin conformance gate (P0, clause 16)

Every value cited to a §-row: D1 → §6e/§6l field height 44px; D2 → §6b/§6l Badge 12px `text-theme-xs`; D3 → §6l Addendum (12px `gap-3`, Popover 12px `rounded-xl`). **Zero invented px/radius/line-height.** Rendered side-by-side vs the zip/live reference required.

## 🔴 Rendered-evidence gate (clause 12 + 13) — THE CLOSING CONDITION

This is the exact gate Task 527 skipped. Task 528 does NOT close without:
1. **Machine-produced rendered artifacts** (`responsive-screenshots --assert` PNG/JSON, or the project's equivalent) for **every changed story** — Textarea, Badge, Modal, Drawer, Popover — at the canonical breakpoints × **sq/en/uk/it**, with **uk@320/375/390 mandatory**.
2. **Explicit proof the Textarea AND Badge stories render with NO error overlay** (the screenshot must show the actual component, not a Storybook error frame).
3. **Gates green in the transcript** — `npm run lint`, `check:stories`, `check:i18n`, `check:design-tokens --strict`, `check:mojibake`, `check:file-integrity`, `tsc --noEmit`=0 — AND a planted-violation FAIL transcript for `check:stories` (proves it's real).
4. A session-log cell marked "no browser access / OWNER QA REQUIRED / NOT CHECKED" is an **auto-reject**. `tsc=0`/`build-storybook` is a baseline, NEVER proof.

## File-integrity gate (clause 14)

Read-back every written file; paste the GREEN integrity transcript (0 NUL, no BOM, `node --check`/`tsc` clean, not truncated) for `theme.ts`, `input-chrome.css`, and each `.stories.tsx`.

## Deliverables

- AC-by-AC self-audit table (every bullet above → file:line OR rendered step → ✅/❌), citing BOTH positive & negative flows by name.
- **"Files Changed" table** — one row per touched path + 1-line rationale.
- Update `docs/backlog.md` Last Session + Task 528 status; add `docs/sessions/2026-07-02-task528-tailadmin-conformance-corrections-round2.md`.
- **Do NOT run git.** Do NOT emit `git add`/`git commit`. The orchestrator emits commit commands after diff + rendered review.

## Acceptance criteria (all must be verifiable in the diff AND the rendered matrix)

1. Textarea story renders with no error overlay at all breakpoints × 4 locales; 44px floor applied via `input-chrome.css`, `theme.ts` Textarea `minHeight` removed. (D1, positive + negative Textarea flows)
2. Badge `size='sm'` = 12px/500/pad 2×8–10/lh 18px; status badges compact, no clip, matches `/badge` reference. (D2)
3. Modal + Drawer footer button gap = 12px; Popover button-group 12px; Popover `theme` radius = 12px (`xl`). (D3)
4. Mobile <640 full-width bottom-sheet + full-width footer buttons preserved; no h-scroll at 320 uk. (mobile gate)
5. Rendered matrix + Textarea/Badge no-error proof + green gates + planted-FAIL transcript present. (clause 12/13 — closing condition)
6. File-integrity transcript green; Files Changed table present; backlog + session log updated; no git run by executor. (clauses 10/14)
