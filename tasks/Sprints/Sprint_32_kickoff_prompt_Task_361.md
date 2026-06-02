### Task 361 — Sheet indentation spacing + Dialog stacking bug + scroll-slider clipping

Type:        bug
Priority:    high
Area:        Overlay primitives — `src/components/ui/sheet.tsx`, `src/components/ui/dialog.tsx` (+ stories)

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/rule-index.md → "Storybook / visual snapshot task": docs/storybook-governance.md,
   docs/storybook-visual-snapshots.md, docs/component-rules.md, docs/qa-rules.md
4. docs/rule-index.md → "UI / layout / component task": docs/design-system.md (§ overlay rules), docs/ui-rules.md (§16 z-index scale)
5. docs/ai-behavior.md → Note 14 (global-change rule) — Sheet/Dialog are shared primitives.
6. Inspect package.json validation scripts.

Localization coverage:
- sq, en, uk, it. Verify overlay content fits at the `uk` worst case. New demo strings (if any) → all four `messages/*.json`.

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560. Sheet/Dialog scroll behaviour is most fragile at 320px in uk.

Current behavior to preserve:
- `src/components/ui/sheet.tsx`: existing `Sheet`/`SheetContent`/`SheetHeader`/`SheetFooter` API and all consumers. Sheet is the canonical drawer (storybook-governance §3) — do NOT replace with custom `div.fixed.inset-0`.
- `src/components/ui/dialog.tsx`: existing `Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter`/close-button API and all consumers. Focus trap / Esc / backdrop-close must remain (storybook-governance §7).
- Existing controls: the `X` close button stays; backdrop + Esc dismissal stays.
- `sheet.stories.tsx` / `dialog.stories.tsx`: scenario-named exports (§8b) preserved.

Bug / Goal:
1. **Sheet** — vertical and horizontal **indentation (padding) styles are incorrect**. Establish correct, consistent inner padding (content + header + footer) per the design-system spacing scale; ensure content does not touch the edges and is consistent across sides.
2. **Dialog (Docs tab)** — **bug:** several dialog boxes render **stacked one above another**; clicking `X` closes the top one and reveals the next, repeatedly. Owner confirmed this is wrong: the Docs/story must show **one dialog at a time** (each example its own isolated story canvas — not all open simultaneously stacked).
3. **Dialog** — the **scroll slider (scrollbar) is not clipped to the container boundaries**; it must stay within the DialogContent rounded bounds (no overflow past the corners/edge).

Required after behavior:
1. **Sheet padding:** `SheetContent` has correct, symmetric vertical/horizontal padding from the canonical spacing scale (no arbitrary `px-[Npx]`); header/body/footer spacing is consistent; verified at 320px uk (content readable, not edge-bleeding) and at desktop.
2. **Dialog single-instance:** In the Dialog story/Docs, only ONE dialog is visible at a time. If the prior story rendered multiple `<Dialog open>` simultaneously, refactor so each example is its own story (or a single toggle), with no stacked overlays. Closing `X` returns to the trigger, not to a hidden second dialog.
3. **Dialog scroll clip:** Long DialogContent scrolls inside the content box; the scrollbar is clipped to the container (e.g. `overflow-y-auto` on a properly-bounded, `overflow-hidden`/rounded container) and never paints outside the rounded border.

Required investigation:
1. Read `src/components/ui/dialog.tsx` + `dialog.stories.tsx` to find WHY dialogs stack — almost certainly multiple `open`/`defaultOpen` examples mounted in one canvas. Identify the exact exports.
2. Read `src/components/ui/sheet.tsx` — locate current padding classes; map to the design-system spacing scale; replace arbitrary/asymmetric values with canonical fragments.
3. Read ui-rules.md §16 (z-index) to confirm overlay stacking/z-index is correct and not the root cause masked by padding.
4. `grep` for consumers of both primitives to confirm no consumer relied on the old padding/stacking.

Acceptance criteria:
- AC1 = Sheet correct symmetric padding (canonical scale) — verifiable at `sheet.tsx`:line.
- AC2 = Dialog shows one dialog at a time; no stacked overlays — verifiable at `dialog.stories.tsx` diff (multiple-open removed) and runtime.
- AC3 = Dialog scrollbar clipped within rounded container — verifiable at `dialog.tsx`:line.
- Positive + Negative flow parity verifiable in diff.
- Existing overlay controls (X, Esc, backdrop, focus trap) preserved.
- 0 new lint/warnings; `tsc --noEmit` → 0; `build-storybook` passes; `check:i18n` PASS.
- 4 locales + 7 breakpoints (rendered = OWNER QA REQUIRED if no browser, §8a).
- design-system.md/ui-rules.md updated with the canonical Sheet padding + Dialog scroll-clip fragment. backlog.md updated. Session log with Note 18 block + §17 UI pre-flight + Files Changed table.
- No `git add`/`git commit` from executor.

Positive flow (happy path):
- Actor: developer in Storybook + user on app.
- Steps: (1) open Sheet story at 320px uk → content padded symmetrically, readable; (2) open a Dialog example → exactly one dialog visible; (3) click `X` → dialog closes, focus returns to trigger, no second dialog appears; (4) open a long-content Dialog → scrolls internally, scrollbar inside rounded bounds; (5) Esc + backdrop also close.
- Success state: all correct; post: no consumer regressed.

Negative flow:
- **Esc / backdrop dismiss:** trigger = Esc or backdrop click → dialog/sheet closes cleanly, focus restored, no leftover overlay. Verify handler present.
- **Very long content (uk):** trigger = overflowing content → internal scroll engages; scrollbar clipped; header/footer remain visible if pinned (or document the scroll model).
- **Multiple triggers in one story:** trigger = user opens example A then B → only the currently-open one shows; no stacking. Verify the story no longer mounts several `open` dialogs at once.
- **Nested/confirm dialog (if a consumer legitimately stacks):** if any real consumer intentionally nests dialogs, do NOT break it — document and preserve; if unclear → STOP & ASK.
- **Empty Sheet/Dialog (no footer):** trigger = no footer slot → padding still correct, no empty-gap artifact.

Out of scope:
- Do NOT change Sheet/Dialog open/close state machinery beyond the stacking fix.
- Do NOT convert Dialog↔Sheet responsive switching here (separate concern).
- Do NOT touch Tabs/Button/FilterBar/Select/Combobox.
