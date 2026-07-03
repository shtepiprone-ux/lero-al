# Task 539 — Canonical `MantineProgress` (progress bar) → TailAdmin conformance

> **Sprint 40 / Epic MM · Phase 1 · P1.23 "Progress".** New Mantine primitive slice (Batch D, feedback/misc).
> Delivers the canonical TailAdmin-correct progress bar + its Storybook proof. **Executor: Sonnet 4.6.**
> Orchestrator (Opus) reviews the real diff + native rendered gate.

---

## 0. Session-start + pre-read (rule-index: **UI/component** + **Storybook** task)

Read, in this order, BEFORE touching code (do not read from memory):

**Always required**
- `docs/agent-contract.md` (P0 clauses 1–16 — every clause is verified against your diff on return).
- `docs/backlog.md` (current state).
- `docs/critical-flow-registry.md` — **scan it.** This task builds a PRIMITIVE + STORY only and migrates **no
  consumer** (legacy `progress.tsx` currently has ZERO consumers — verified by grep), so it touches **no** registry
  flow. Do NOT wire it into any surface here. **State this explicitly in your session log.**

**UI/component bundle**
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — **style source of truth (clause 16).** The
  authoritative measured row is **"Progress (`/progress-bar`, measured)"**: track bg **gray-200 `#e4e7ec`**, fill
  **brand**, `rounded-full` (pill), track heights **8 / 12 / 16 / 20px** (sm/md/lg/xl), fill height = track height.
  Cite THIS row for every value. If you judge the paragraph insufficient as an authoritative row, **extract a formal
  `§6x` Progress row from the zip FIRST** — do not invent px/colors.
- `docs/mantine-responsive-design-system.md` — **read FIRST for UI.** §7 mobile gate · §8.1 (`MantineStoryShell`
  requirement, Task 536) · §8.2 · §12 canonical patterns · §18 theming/CSS pitfalls (state selectors live in a
  `*-chrome.css`, NOT `theme.ts` inline styles).
- `docs/ui-rules.md` (§0 canonical single-source; §15 control height; §17 UI pre-flight checklist).
- `docs/component-rules.md` · `docs/qa-rules.md`.

**Storybook bundle**
- `docs/mantine-responsive-design-system.md` §8 (Mantine proof path) + §13 (rebuild plan).
- `docs/storybook-governance.md` (§14 enforced gates, §MQ) · `docs/storybook-visual-snapshots.md`.

**Behavioral / convention source of truth (read — do NOT infer):**
- `src/components/ui/progress.tsx` — the legacy base-ui component whose behavior `MantineProgress` must match.
- `src/design-system/mantine/patterns/index.ts` — export convention.
- **An existing NON-overlay Mantine primitive story — e.g. `src/stories/mantine/primitives/Alert.stories.tsx`
  (Task 532) or `Pagination.stories.tsx` (Task 533)** — for the exact `meta`/decorator/canvas convention a
  non-overlay primitive uses. **Do NOT copy the Combobox/overlay story's `skipCanvas:true`** — Progress is not an
  overlay (see §6 + STOP-and-ASK #3).

---

## 1. Why this task

Per the migration tracker P1.23, the canonical Mantine Progress primitive must exist and be TailAdmin-correct before
any future consumer uses it (Phase 2). The legacy `src/components/ui/progress.tsx` is shadcn/base-ui-styled, pre-dates
the migration, and has **no current consumers**. This task delivers the primitive + its Storybook proof. It migrates
**no** consumer and deletes **no** legacy file.

## 2. Scope

**In scope (this task):**
1. New canonical `src/design-system/mantine/patterns/MantineProgress.tsx` — one progress bar built on Mantine's
   `Progress` component, behavioral parity with `src/components/ui/progress.tsx`, TailAdmin-styled.
2. Export it (+ its prop types) from `src/design-system/mantine/patterns/index.ts`.
3. TailAdmin chrome via `theme.ts` `Progress` component defaults where possible (track color, fill color, radius,
   size→height). If a CSS-state selector is genuinely unavoidable, it goes in a `*-chrome.css` — **never** `theme.ts`
   inline `styles` (§18). (Progress is display-only; you likely need NO state-selector CSS — prefer theme + props.)
4. New story `src/stories/mantine/primitives/Progress.stories.tsx`, title `Mantine/Primitives/Progress`, single
   `Default` export, wrapped in **`MantineStoryShell`**, all strings via `storyT()` with `storybook.mantine.progress_*`
   keys in **sq/en/uk/it** parity. **Canvas convention = the NON-overlay primitive pattern** (see STOP-and-ASK #3).
5. If a new `§6x` row is required for the Progress chrome, add it to `docs/tailadmin-style-reference.md` first.
6. `docs/mantine-tailadmin-migration-tracker.md` P1.23 row → status update + session log.

**Out of scope (do NOT touch — route any temptation back as a later task):**
- Migrating ANY consumer (there are none) or wiring Progress into any surface — Phase 2+.
- Deleting/altering the legacy `progress.tsx` — it stays until Phase 6.
- Any `theme.ts` change beyond the new `Progress` block.
- Dark mode. Semantic-color variants and indeterminate mode unless owner-approved (STOP-and-ASK #1/#2).

## 3. Current behavior to preserve (from legacy `progress.tsx` — the contract to meet)

- **`value`** (0–100) controlled; a **track** + a **fill/indicator** that grows to `value%`, with a transition on the
  fill (`transition-all` in legacy).
- **Pill track** (`rounded-full`), fill spans full track height.
- **Optional label** (legacy `ProgressLabel`: 14px / medium) and **optional value display** (legacy `ProgressValue`:
  right-aligned, muted, `tabular-nums`) shown **above** the bar in a wrapping row.
- Legacy track height is `h-1` (4px) with no size variants. Because the legacy component is **unused**, adopt
  TailAdmin's measured size scale instead — this is an intentional TailAdmin alignment, NOT a regression (state so).

## 4. Required after-behavior (`MantineProgress` contract)

- Built on Mantine `Progress` (use `Progress.Root`/`Progress.Section`/`Progress.Label` only if the compound is needed;
  the legacy label/value sit ABOVE the bar, so a thin wrapper rendering a label row (label left, value right) above a
  `<Progress>` is the parity-preserving shape — do not force the label inside the bar).
- **Props (minimum):** `value: number`; `size?: 'sm' | 'md' | 'lg' | 'xl'` → **8 / 12 / 16 / 20px** track+fill height
  (default `'md'` = 12px); `label?: ReactNode`; `valueLabel?: ReactNode` (or `showValue?: boolean` rendering `${value}%`
  right-aligned, `tabular-nums`); `aria-label` for a11y when there is no visible `label`.
- **TailAdmin chrome (cite the §6 Progress row):** track **gray-200 `#e4e7ec`**, fill **brand** (`#EC5447`), radius
  **pill** (`rounded-full`), height per `size` (8/12/16/20). **Zero invented values** — `check:design-tokens:strict`
  green + no raw hex/px in the diff.
- **a11y:** `role="progressbar"` with `aria-valuenow/valuemin/valuemax` (Mantine provides); when no visible label,
  `aria-label` is required.
- **Single source:** one component; no "plain vs labelled" fork.

## 5. Positive flow (happy path)

**Actor:** a surface rendering `<MantineProgress value={X} />`.
1. Resting: gray-200 pill track, brand fill to `X%`, height per `size`. → verify rendered.
2. With `label` + value: label left, value right, in a row above the bar; both update with `value`. → verify rendered.
3. Sizes `sm/md/lg/xl` render **8/12/16/20px** track+fill respectively. → verify rendered (one story section each).
4. Changing `value` animates the fill (transition parity). → verify (static screenshots at two values are sufficient).
**Post-conditions:** display-only; no other surface mutated (primitive only).

## 6. Negative flow (every off-happy-path branch — each needs a verifiable line in the diff)

- **`value={0}`** → empty track, no visible fill, no crash.
- **`value={100}`** → track fully filled.
- **Out-of-range** (`value > 100` or `value < 0`) → **clamped** to `[0,100]` (confirm Mantine clamps; if not, clamp in
  the wrapper). No overflow past the track.
- **No visible label** (`label` omitted) → bar only, **`aria-label` required** (a11y guard).
- **Long `sq`/`uk`/`it` label** → wraps (`break-word`/`whitespace-normal`), never clips, **no h-scroll at 320** in
  both the label row and the bar.
- **SSR/hydration** → fully deterministic: `value` comes from props, there is **no** client-only/`isMobile` branch, so
  no hydration mismatch (simpler than the overlay primitives — confirm no `useEffect`-gated first render).

## 7. 🔴 Mobile <640 gate (clause 11)

- The track is **full-width** (`w="100%"`) at every width, including `<640`. Label row wraps in all 4 locales; value
  stays visible; **no horizontal scroll at 320**.
- **Popup/bottom-sheet rule is N/A here** — Progress is a non-interactive DISPLAY element, not an overlay/popup and not
  a focusable control. **Document this exemption explicitly** in the session log (this is the "icon-only/compact /
  non-UI exemption" analogue): no touch-target rule, no bottom sheet, no full-width Button rule applies.

## 8. 🔴 TailAdmin conformance gate (clause 16)

- Every value cited to the §6 Progress row (or a newly-extracted `§6x`). Zero invented color/px/radius.
- Rendered proof **side-by-side with the zip `/progress-bar` reference** at 320/375/480 × en/uk + sq/it@320
  (**uk@320/375/390 mandatory**) + one ≥640 cell. Track color (gray-200), fill (brand), pill radius, and the 8/12/16/20
  heights must match. `tsc=0`/gates are BASELINE, never style proof.

## 9. Rendered evidence + gates (clause 12 + 13 — the only accepted proof)

- The story is auto-discovered by the Task 529 enforced gate (`Mantine/Primitives/*`), so `npm run screenshots:assert
  -- --mantine-only` asserts it across 14 viewports × 4 locales. **Progress is NOT an overlay — do NOT add it to
  `MANTINE_OVERLAY_PRIMITIVES`** (no scripted-open needed; it renders in place).
- Paste the GREEN native transcript for: `npx tsc --noEmit` · `npm run check:stories` (incl. `storybook.mantine.
  progress_*` parity 4×) · `npm run check:i18n` · `npm run check:design-tokens:strict` · `npm run check:mojibake` ·
  `npm run check:file-integrity` · `npm run build-storybook` · `npm run screenshots:assert -- --mantine-only`.
- **Planted-violation proof (clause 13):** plant a real overflow (e.g. a long label with `whiteSpace:'nowrap'`, or a
  fixed `miw` on the label row), show the gate FAILs at 320 (transcript), then revert to green. **Note:** unlike Task
  537, Progress has no `ResponsiveBottomSheet`/Drawer, so a document-level plant WILL FAIL correctly — the Task 538
  in-sheet gate blind spot does not apply here. If a plant unexpectedly yields 0 FAIL, record it honestly and plant a
  harder one.

## 10. Hard contract (verified against your diff on return)

- No scope change; no consumer migration; no invented architecture — **if a design choice below is ambiguous, STOP and
  ASK the orchestrator/owner.**
- Self-validate before "complete": `tsc=0`, AC-by-AC self-audit table (cite §5 and §6 flows by name → file:line),
  read-back every written file (clause 14: 0 NUL / no BOM / not truncated / parses).
- Locale parity sq/en/uk/it for all new keys. Update `docs/backlog.md` + a session log under `docs/sessions/` with a
  **"Files Changed" table** (one row per path + rationale). **Do NOT run git / emit `git add`/`git commit`** — the
  orchestrator emits commits after diff review (single-writer rule).

## 11. 🛑 STOP-and-ASK triggers (do not invent — ask)

1. **Semantic-color variants** (success/warning/error fill): the legacy is brand-only and the §6 row says "fill brand".
   Default to **brand-only** — do NOT add semantic colors unless the owner confirms they're wanted now.
2. **Indeterminate / loading mode:** legacy requires a numeric `value` and has no indeterminate state. Default to
   **numeric value required, indeterminate deferred** — ask before adding an animated indeterminate variant.
3. **Story canvas convention:** Progress is non-overlay, so per tracker DoD #3 it renders inside the canonical page
   gutter, NOT `skipCanvas` full-bleed. Match an existing NON-overlay primitive story (`Alert`/`Pagination`). **If the
   Mantine proof-path doc and that reference story disagree on `skipCanvas`/`layout`, STOP and ASK** — do not guess.
4. **§6x extraction:** if the measured §6 Progress paragraph is not an acceptable authoritative row for citation,
   extract a formal `§6x` row from the zip FIRST.

## 12. Acceptance criteria (each must be verifiable in the diff / rendered gate)

1. `MantineProgress.tsx` created + exported; behavioral parity with legacy `progress.tsx` per §3 (value, track+brand
   fill, pill, optional label + value, size scale). → file:line + AC table.
2. TailAdmin chrome, every value cited to the §6 Progress row (or new §6x); zero invented values (§8).
3. Positive flow §5 steps 1–4 all rendered-verified (resting, label+value, 4 sizes, transition). → screenshots.
4. Negative flow §6 every branch has a code line + rendered evidence (0 / 100 / clamp / no-label+aria / long-label
   wrap / SSR-deterministic).
5. Mobile <640 gate §7 satisfied (track full-width; label wraps; no h-scroll@320); popup exemption documented.
6. Story wrapped in `MantineStoryShell`, single `Default`, `storyT()` only, `progress_*` keys 4× parity; non-overlay
   canvas convention; NOT added to `MANTINE_OVERLAY_PRIMITIVES`.
7. All gates green natively (§9) + planted-violation FAIL transcript.
8. Session log: AC-by-AC self-audit (cites §5 + §6), rendered matrix (uk@320/375/390), Files Changed table,
   self-validation line; no git run. `docs/mantine-tailadmin-migration-tracker.md` P1.23 row updated.

---

**Kickoff written by orchestrator (Opus), 2026-07-03. Sonnet reads this file directly — do not wait for a chat paste.**
