# Task 510 — Canonical responsive Select: fold the responsive switch into ONE Select, remove the duplicate wrapper

> **Type:** UI / component + Storybook (Mantine foundation, Batch C).
> **Origin:** owner review of Task 509 (2026-06-28). At a `<640` Storybook width the `Select` story
> renders **two different behaviors at the same breakpoint**: sections 1–4 use the raw `@mantine/core`
> `Select` (anchored mini-dropdown — a P0 mobile violation), sections 5–7 use `MantineBottomSheetSelect`
> (correct bottom sheet). The owner asked: *"навіщо дві поведінки Select, де є bottom sheet і звичайна
> поведінка випадаючого списку?"* — there must be **ONE** Select that is responsive by default, not a
> plain Select sitting next to a separate bottom-sheet wrapper.
>
> **Executor = Sonnet 4.6.** Read the hard contract (`docs/agent-contract.md` clauses 1–15) and execute
> the acceptance criteria **literally**. If anything below is ambiguous, **STOP and ASK the orchestrator** —
> do not invent scope. Do NOT run git; produce a "Files Changed" table and let the orchestrator emit commits.

---

## Pre-read (rule-index: UI/component + Storybook)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches no registry flow; if you find one, follow clause 15).

**Required (UI/component):**
- `docs/mantine-responsive-design-system.md` — **FIRST.** §7 mobile gate, §12 canonical patterns, §18 theming/CSS pitfalls, **§19 (the canonical dropdown→bottom-sheet pattern added by Task 509 — you are updating this).**
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`

**Required (Storybook):**
- `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md` (Mantine proof path: `skipCanvas:true`, `storybook.mantine.*` namespace, **Default-only, toolbar-driven viewport/locale**).

**Read the Task 509 output you are correcting:**
- `src/design-system/mantine/patterns/MantineBottomSheetSelect.tsx`
- `src/design-system/mantine/patterns/index.ts`
- `src/stories/mantine/primitives/Select.stories.tsx`
- `docs/sessions/2026-06-28-task509-bottom-sheet-foundation.md`

---

## The architectural decision (already made — implement it, do not redesign)

There must be exactly **ONE** canonical Select component the app and stories import. It is **responsive by
default**: anchored dropdown at ≥640px, full-width bottom sheet at <640px. There is no separate "plain
Select" vs "bottom-sheet Select" choice.

Concretely:

1. **Rename `MantineBottomSheetSelect` → `MantineSelect`** (the canonical Select primitive). The component
   body is already correct (Task 509) — it renders a plain `<Select>` on desktop and the P0 Drawer at <640.
   Keep that logic; only the **name** changes to signal "this IS the Select", plus the doc-comment is updated
   to drop "BottomSheet" framing ("P0-compliant responsive Select" instead). File may be renamed to
   `MantineSelect.tsx` OR kept as-is with the export renamed — your choice, but the **public export name MUST
   be `MantineSelect`** and there must be no remaining `MantineBottomSheetSelect` export.
2. **Keep the reusable foundation exports unchanged in name and behavior:** `useResponsiveDropdown()` and
   `bottomSheetDrawerStyles` MUST remain exported (Batch C overlays — Menu/Popover/Combobox/NavigationMenu —
   consume them per backlog Task 509). Do NOT remove or rename these two. Only the Select wrapper's name changes.
3. **The base `@mantine/core` `Select` is NOT used directly in stories anymore.** The themed-`Select` chrome
   (gray-2 border / shadow-xs / brand focus / 44px / disabled fade — §6d/§6e) is preserved because
   `MantineSelect` renders that same themed `<Select>` internally on both paths.

> **Why not push the switch into the Mantine theme so even a raw `<Select>` is responsive?** Because the
> bottom sheet needs extra DOM (a `Drawer` + a rendered option list) that `theme.components.Select` styling
> cannot inject. A wrapper component is the only correct home for the switch. That wrapper, named
> `MantineSelect`, becomes the single canonical Select. (If you believe a theme-only path is viable, STOP and
> ASK — do not implement a second mechanism.)

---

## Current behavior to preserve

- **Desktop (≥640px):** `MantineSelect` renders a standard themed `<Select>` — anchored dropdown, §6d resting
  chrome, §6e disabled fade (label + field + chevron all dim together), error red-6 border, brand focus ring.
  Byte-for-byte the same as today's desktop Select. **No API change** — all `SelectProps` forwarded.
- **Mobile (<640px):** tapping the trigger opens the P0 bottom sheet (edge-to-edge, rounded top corners,
  drag handle, ≤90dvh internal scroll, ≥44px option rows, long labels wrap, selected row shows check +
  brand-7, closes on backdrop tap + Esc, focus returns to trigger). Disabled trigger does NOT open the sheet.
- **`useResponsiveDropdown()` + `bottomSheetDrawerStyles`** keep their current signatures and output.

## Required after-behavior

- A single `MantineSelect` export is the canonical Select; `MantineBottomSheetSelect` no longer exists as a
  name anywhere in `src/` (component, barrel, stories, docs).
- **`Select.stories.tsx` (Mantine/Primitives/Select → Default) uses `MantineSelect` in EVERY section** — no
  section imports the raw `@mantine/core` `Select` as the rendered control. (`@mantine/core` may still be
  imported for layout primitives `Box`/`Stack`/`Text`, and for the `SelectProps`/`ComboboxData` types — not
  for the rendered Select.)
- **Result at the same breakpoint = ONE behavior, everywhere:** at the `<640` toolbar width every section's
  control is a bottom sheet; at ≥640 every section's control is an anchored dropdown. The story no longer
  contradicts itself across sections.
- Section captions are rewritten so none claims a permanent "anchored dropdown" or implies two separate
  components. Each caption describes the **state** being shown (resting / open / error / disabled / long-uk
  stress) and notes "responsive: anchored ≥640, bottom sheet <640" once, generically.
- The 7 states still demonstrated (do not drop coverage): resting, open, error, disabled, long-uk option
  stress, and the disabled-does-not-open-sheet negative case. Consolidate sections only if every state above
  remains visible; do not silently remove a state.
- Docs updated: `docs/mantine-responsive-design-system.md` §19 reflects the canonical name `MantineSelect`
  (single responsive component; no "two behaviors") and `docs/tailadmin-style-reference.md` §6i pointer
  updated to the new name.

---

## Positive flow (happy path)

**Actor:** any consumer / a Storybook viewer. **Precondition:** `Select` story open at `Mantine/Primitives/Select → Default`.

1. Viewer sets the Storybook toolbar to a **≥640** width (e.g. 768). **System:** every section renders
   `MantineSelect` as a themed anchored Select. Clicking a trigger opens the anchored dropdown under the
   field; choosing an option fires `onChange` and closes the dropdown. State sections render correctly
   (resting chrome, pre-opened dropdown, red-6 error, disabled fade).
2. Viewer switches the toolbar to **<640** (320 / 375 / 390). **System:** every section's trigger, when
   tapped, opens the P0 bottom sheet (edge-to-edge, drag handle, rounded top, internal scroll). Selecting an
   option closes the sheet and fires the same `onChange`. **Across all sections the behavior is identical —
   no anchored mini-dropdown appears at <640 in any section.**
3. Viewer switches the toolbar **locale** (sq/en/uk/it). **System:** all labels, placeholders, descriptions,
   option labels, the long-uk stress option, and the section captions update from `t()`/`storyT()` — no
   hardcoded literals, full 4-locale parity.
4. **Success state / post-conditions:** one canonical `MantineSelect` exported; `check:stories` passes;
   rendered matrix shows full-width bottom sheet at <640 for every section; foundation hook + styles still
   exported and importable.

## Negative flow (every off-happy-path branch)

- **Disabled trigger tapped (<640):** sheet does NOT open; trigger shows §6e disabled fade (label + field +
  chevron all at opacity 0.5); no focus ring; tap is a no-op. Verifiable in the disabled section at <640.
- **Disabled option row tapped inside the sheet:** row is faded (opacity 0.5) and tapping it does NOT select
  or close (the existing `if (!item.disabled)` guard must remain).
- **Backdrop tap / Esc while sheet open:** sheet closes, nothing selected, `onChange` NOT fired, focus
  returns to the trigger (`returnFocus`).
- **Empty `data`:** sheet body shows the placeholder text (existing empty-state branch), no crash, no option rows.
- **Long uk/sq/it option label (the stress option):** wraps inside the sheet row (`whitespace:normal`,
  `wordBreak:break-word`), never clips, no horizontal scroll at 320; in the anchored desktop dropdown it also
  does not clip.
- **SSR / first render:** `isMobile` is `false` on first paint (documented Mantine `getInitialValueInEffect`
  caveat); the Drawer is closed on SSR so there is no flash; both paths render the same themed trigger.
- **Locale with longest captions (uk):** section captions and labels wrap, no clip, no h-scroll at 320.
- **No consumer left importing the old name:** a repo grep for `MantineBottomSheetSelect` returns ZERO hits
  after the change (component, barrel, stories, docs, sessions other than historical 509 log). If a product
  consumer is found (enumerate via grep natively — sandbox grep is unreliable), update it to `MantineSelect`
  in the same task; if updating it is non-trivial / out of this scope, STOP and ASK before proceeding.

---

## 🔴 Mobile <640 full-width gate (OWNER P0 — mandatory)

In scope: the `MantineSelect` trigger and its bottom sheet.
- Trigger: `w={{ base: '100%', sm: 'auto' }}` (already present) — full-width at <640. Keep it.
- Sheet: full-width edge-to-edge (no side margins, no `sm:max-w-*` leaking below 640), rounded TOP corners
  only, drag handle, slide-up, ≤90dvh internal scroll, ≥44px option rows (`mih:2.75rem`), labels wrap, no
  h-scroll at 320, closes on backdrop tap + Esc, focus returns to trigger.
- No icon-only exemptions in this task. The map-marker exemption is not in scope.

---

## Acceptance criteria (each maps to a flow / gate — verify in the diff)

1. **AC1 (after-behavior):** single `MantineSelect` export exists; `MantineBottomSheetSelect` removed
   everywhere in `src/` + `docs/` (except the historical 509 session log). Grep proof in the session log.
   → maps to Positive flow steps 1–2 + Negative "no consumer left".
2. **AC2 (foundation preserved):** `useResponsiveDropdown` and `bottomSheetDrawerStyles` still exported from
   the barrel with unchanged signatures (file:line). → reusable foundation.
3. **AC3 (story single-behavior):** `Select.stories.tsx` renders `MantineSelect` in every section; no raw
   `@mantine/core` `Select` rendered; at <640 every section is a bottom sheet, at ≥640 every section is
   anchored. → Positive flow steps 1–2. Verifiable at file:line + rendered matrix.
4. **AC4 (states preserved):** resting / open / error / disabled / long-uk / disabled-no-open-sheet all still
   demonstrated; before/after section inventory in the session log shows nothing silently dropped (clause 3 /
   Note 20). → Negative flow disabled + empty + long-uk branches.
5. **AC5 (i18n parity):** every visible string (incl. rewritten captions) from `t()`/`storyT()` with
   `sq/en/uk/it` parity; `check:i18n` green; no hardcoded literal (clause 13 / `check:stories`). → Positive
   flow step 3.
6. **AC6 (docs):** §19 in `mantine-responsive-design-system.md` + §6i pointer in `tailadmin-style-reference.md`
   updated to `MantineSelect`, no "two behaviors" wording. → after-behavior.
7. **AC7 (negative flows in diff):** disabled-no-open, disabled-option-row guard, backdrop/Esc close +
   returnFocus, empty-data placeholder, long-label wrap each verifiable at file:line. → Negative flow.
8. **AC8 (file integrity, clause 14):** every touched file 0 NUL bytes, no BOM, `.json` parses, `.tsx`
   compiles, not truncated; green integrity transcript pasted in the session log.
9. **AC9 (rendered evidence, clause 12):** rendered matrix — breakpoints × sq/en/uk/it, **uk@320/375/390
   mandatory** — proving every section is a full-width bottom sheet at <640 and anchored at ≥640, no clip,
   no h-scroll at 320. `responsive-screenshots --assert` (or the Mantine proof path) artifacts attached.
   tsc/build green is NOT proof.
10. **AC10 (gates):** `npx tsc --noEmit` 0 errors; `npm run check:stories`, `check:i18n`,
    `check:design-tokens`, `check:mojibake` all 0 violations; AC-by-AC self-audit table + final
    "Self-validation: …" line in the session log.

---

## Hard contract reminders (clauses 1–15)

- No scope change beyond the canonical-Select consolidation + story + docs. No drive-by refactors.
- Do NOT invent a second responsive mechanism or a theme-only path — STOP and ASK if tempted.
- Do NOT remove the foundation hook/styles or any demonstrated state.
- Do NOT emit `git add` / `git commit`. Include a **"Files Changed" table** (one row per path + 1-line
  rationale) in the session log; the orchestrator emits commits after diff review.
- Update `docs/backlog.md` "Last Session" (2–4 lines) + add `docs/sessions/2026-06-28-task510-canonical-responsive-select.md`.
- Read-after-write every file; paste the green integrity transcript.

## Files expected to change (executor confirms exact set)

- `src/design-system/mantine/patterns/MantineBottomSheetSelect.tsx` → renamed/retitled to `MantineSelect` (export `MantineSelect`).
- `src/design-system/mantine/patterns/index.ts` — export `MantineSelect` (+ `MantineSelectProps`); keep `useResponsiveDropdown`/`bottomSheetDrawerStyles`.
- `src/stories/mantine/primitives/Select.stories.tsx` — all sections use `MantineSelect`; captions rewritten.
- `messages/{sq,en,uk,it}.json` — caption/key adjustments if section text changes (keep 4-locale parity).
- `docs/mantine-responsive-design-system.md` (§19), `docs/tailadmin-style-reference.md` (§6i).
- `docs/backlog.md` (Last Session), `docs/sessions/2026-06-28-task510-canonical-responsive-select.md` (new).
