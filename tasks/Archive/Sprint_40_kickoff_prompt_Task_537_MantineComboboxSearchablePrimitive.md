# Task 537 — Canonical `MantineCombobox` (searchable combobox base) → TailAdmin conformance

> **Sprint 40 / Epic MM · Phase 1 · P1.21 "Command / Combobox base".** New Mantine primitive slice
> (not a conformance correction — the 20 audited primitives are all corrected). This builds the canonical
> responsive **searchable combobox** that will later replace the legacy shadcn `command.tsx` + shared
> `Combobox.tsx`. **Executor: Sonnet 4.6.** Orchestrator (Opus) reviews the real diff + native rendered gate.

---

## 0. Session-start + pre-read (rule-index: mixed **UI/component** + **Storybook** task)

Read, in this order, BEFORE touching code (do not read from memory):

**Always required**
- `docs/agent-contract.md` (P0 clauses 1–16 — every clause is verified against your diff on return).
- `docs/backlog.md` (current state).
- `docs/critical-flow-registry.md` — **scan it.** Note: this task builds a PRIMITIVE + STORY only and migrates
  **no consumer**, so it touches **no** registry flow. Do NOT wire it into HeroSearch/filters/admin here. (When a
  future composite slice swaps a registry-flow control to `MantineCombobox`, THAT task carries clause-15 regression
  coverage — not this one.) State this explicitly in your session log.

**UI/component bundle**
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — **style source of truth (clause 16).** Cite every
  value to a §-row. §6d (form-elements / Select+chevron), §6e (input state matrix: resting/focus/error/disabled — label +
  field + trailing icon together), §6i (canonical responsive Select + dropdown bottom-sheet mechanism), §6l (dropdown/menu
  **item** chrome: 14px / gray-7 / padding ~10×12 / radius lg, + "no results" text). **If the searchable-dropdown's own
  chrome (the in-dropdown search field + the list container + the "no results" empty row) is not already an authoritative
  row, EXTRACT it from the zip into a new `§6x` row BEFORE implementing — do not invent.**
- `docs/mantine-responsive-design-system.md` — **read FIRST for UI.** §7 mobile gate · §8.1 (the `MantineStoryShell`
  requirement, Task 536) · §8.2 (interactive overlays must actually OPEN in the story) · §12 canonical patterns · §18
  Mantine theming/CSS pitfalls (state selectors live in `input-chrome.css`, NOT `theme.ts` inline styles).
- `docs/ui-rules.md` (§0 canonical single-source; §15 control height; §16 z-index; §17 UI pre-flight checklist).
- `docs/component-rules.md` · `docs/qa-rules.md`.

**Storybook bundle**
- `docs/mantine-responsive-design-system.md` §8 (Mantine proof path) + §13 (rebuild plan).
- `docs/storybook-governance.md` (§14 enforced gates, §MQ) · `docs/storybook-visual-snapshots.md`.

**Behavioral source of truth (read — do NOT infer behavior):**
- `src/components/shared/Combobox.tsx` — the legacy component whose behavior `MantineCombobox` must match 1:1.
- `src/design-system/mantine/patterns/MantineSelect.tsx` — the established responsive-trigger + suppress-anchored-
  dropdown-on-mobile + `ResponsiveBottomSheet` pattern you MUST reuse (Task 514 foundation), not re-invent.
- `src/design-system/mantine/patterns/responsiveBottomSheet.tsx` — `useResponsiveDropdown`, `ResponsiveBottomSheet`,
  `DragHandle`, `bottomSheetDrawerStyles` (single source; consume, do not fork).

---

## 1. Why this task

The legacy shared `Combobox.tsx` (cmdk/`command.tsx`-adjacent) is the searchable-select base for ~15 consumers
(LocationCombobox, PropertyTypeCombobox, YearCombobox, PhoneField, HeroSearch, FiltersPanel, and 8 admin managers).
It is still shadcn/Tailwind-styled and pre-dates the Mantine + TailAdmin migration. Per the migration tracker P1.21,
the canonical Mantine primitive must exist and be TailAdmin-correct **before** any of those composites (Phase 2) can be
migrated onto it. This task delivers that primitive + its Storybook proof. It does **not** migrate any consumer.

## 2. Scope

**In scope (this task):**
1. New canonical `src/design-system/mantine/patterns/MantineCombobox.tsx` — one responsive searchable combobox,
   behavioral parity with `src/components/shared/Combobox.tsx`, TailAdmin-styled, reusing the `responsiveBottomSheet`
   foundation.
2. Export it (+ its prop/option types) from `src/design-system/mantine/patterns/index.ts`.
3. Any TailAdmin chrome that CSS-state selectors require goes in `src/design-system/mantine/input-chrome.css`
   (or a sibling `*-chrome.css`) — **never** `theme.ts` inline `styles` (freezes the cascade; §18). Reuse the existing
   `.mantine-*-input` resting/focus/error/disabled rules where the trigger is a real input.
4. New story `src/stories/mantine/primitives/Combobox.stories.tsx`, title `Mantine/Primitives/Combobox`,
   single `Default` export, `skipCanvas: true` + `layout: 'fullscreen'`, wrapped in **`MantineStoryShell`** (Task 536,
   §8.1), all strings via `storyT()` with `storybook.mantine.combobox_*` keys in **sq/en/uk/it** parity.
5. If a new §6x row is required for the searchable-dropdown chrome, add it to `docs/tailadmin-style-reference.md` first.
6. `docs/mantine-tailadmin-migration-tracker.md` P1.21 row → status update + session log.

**Out of scope (do NOT touch — route any temptation back as a Phase-2 task):**
- Migrating ANY consumer (`LocationCombobox`, `PropertyTypeCombobox`, `YearCombobox`, `PhoneField`, `HeroSearch`,
  `FiltersPanel`, admin managers, `Header`) — Phase 2.
- Deleting/altering the legacy `Combobox.tsx` / `command.tsx` — they stay until their consumers migrate (Phase 6).
- Any `theme.ts` change beyond what is strictly required for the new primitive (and only if unavoidable — prefer CSS).
- Dark mode.

## 3. Current behavior to preserve (from legacy `Combobox.tsx` — the contract `MantineCombobox` must meet)

`MantineCombobox` must be a drop-in-capable replacement, so it must support, at parity:

- **Two variants:** `variant="input"` (searchable text-input trigger; typing filters) and `variant="button"`
  (click-to-open compact trigger; optional in-dropdown search via `searchable`).
- **Options:** `{ value, label, dropdownLabel?, description?, searchText? }[]`; trigger shows `label`, dropdown shows
  `dropdownLabel ?? label`, `description` right-aligned, filter matches label/dropdownLabel/description/searchText via
  the existing `normalizeSearch` (reuse it — do not re-implement diacritic folding).
- **`clearLabel`** — a non-filtered "clear" row pinned at the top; selecting it fires `onChange('')`.
- **Empty state** — filtered list empty → the localized "no results" row (reuse `common.no_results` semantics).
- **`error`** (message below field), **`disabled`** (whole control fades — label + field + chevron together, §6e),
  **`icon`** (leading), **`placeholder`**, controlled `value`/`onChange`.
- **Keyboard + a11y:** `role="combobox"` input / listbox / `role="option"` + `aria-selected`, `aria-expanded`,
  Escape closes, focus returns to trigger; ≥44px option rows on mobile.
- **Responsive P0:** desktop = anchored dropdown (flips up when no room below, clamps to viewport); **<640 = full-width
  edge-to-edge bottom sheet** with drag handle, ≤90dvh internal scroll (via the shared foundation — same as MantineSelect).

## 4. Required after-behavior (`MantineCombobox` contract)

- Built on Mantine + the shared `responsiveBottomSheet` foundation, mirroring `MantineSelect`'s responsive contract:
  desktop anchored dropdown; `<640` suppresses the anchored dropdown and opens the shared `ResponsiveBottomSheet`.
- **TailAdmin chrome (cite each to a §-row):** trigger = §6d/§6e input chrome (h-11/44px, radius lg/8px, border gray-3
  resting → brand-3 focus ring → red-6 error, `shadow-theme-xs`, text gray-8, placeholder gray-4, chevron gray-5);
  dropdown/sheet **items** = §6l (14px, gray-7, padding ~10×12, radius lg, selected = brand tint + check in brand-7);
  in-dropdown search field = §6x (extract if missing); "no results" row = §6l/§6x muted (gray-5) 14px.
- **Zero invented values** (clause 16): every color/px/radius/shadow traces to a token/§-row; `check:design-tokens:strict`
  green + no raw hex/px in the diff.
- **Single source:** one component for all consumers (no "plain vs sheet" fork), all props forwarded, no consumer API
  break vs the legacy prop names where they map cleanly.

## 5. Positive flow (happy path)

**Actor:** a user on a form/filter with a `MantineCombobox` (`variant="input"`, options provided).
1. Resting: trigger renders §6d chrome (gray-3 border, shadow-xs, chevron gray-5), placeholder gray-4. → verify rendered.
2. Focus/type (desktop ≥640): anchored dropdown opens below (or flips above if no room), filtered live by keystroke;
   each option is a §6l row; hovering/selecting fires `onChange(value)`, closes, trigger shows the selected `label`.
3. Focus/tap (mobile <640): anchored dropdown suppressed; the shared `ResponsiveBottomSheet` opens edge-to-edge, drag
   handle centered, options ≥44px, internal scroll ≤90dvh; select → `onChange`, sheet closes, focus returns to trigger.
4. `clearLabel` present → the clear row sits at top, unfiltered; selecting it fires `onChange('')` and closes.
5. `variant="button"` + `searchable`: trigger is the compact button; the search field lives INSIDE the dropdown/sheet
   (§6x chrome); typing filters the list; the trigger label stays put.
**Post-conditions:** controlled `value` updates via `onChange`; no other surface mutated (primitive only).

## 6. Negative flow (every off-happy-path branch — each needs a verifiable line in the diff)

- **Disabled:** trigger shows §6e disabled fade (label + field + chevron ALL at opacity 0.5, `cursor:not-allowed`,
  transparent bg); tapping/typing does NOT open the dropdown/sheet; no focus ring.
- **Error:** `error` set → border red-6, no shadow, ring cleared (`[data-error]`, NOT `data-invalid`); the message renders
  below in red-6/12px; the **label color does NOT turn red** (§6e); text stays gray-8.
- **Empty / no results:** filter yields 0 → localized "no results" row (gray-5), NOT a blank/collapsed popup; sheet/dropdown
  still closes on Esc/backdrop.
- **Dismiss:** Esc closes; backdrop tap closes the mobile sheet; desktop outside-click/blur closes; focus returns to trigger.
- **Long sq/uk/it labels:** wrap (`break-word`/`whitespace-normal`), never clip, no h-scroll at 320 — in both the trigger
  (truncate as legacy does for `button` variant) and the option rows (wrap).
- **Double-open / re-entry:** re-opening resets internal search; no duplicate sheets; no stuck backdrop.
- **SSR/hydration:** first render `isMobile=false`, sheet closed (same caveat as `MantineSelect`) — no hydration mismatch.
- **No options:** empty `options` → immediate "no results" row, no crash.

## 7. 🔴 Mobile <640 full-width gate (clause 11 — MANDATORY)

- Trigger is full-width `<640` (`w={{ base: '100%', sm: 'auto' }}` like `MantineSelect`).
- The popup at `<640` is a **full-width edge-to-edge bottom sheet** (shared `ResponsiveBottomSheet`): bottom-anchored, no
  side margins, rounded top only, drag handle, ≤90dvh internal scroll, ≥44px option rows, closes on backdrop + Esc.
- Labels wrap in all 4 locales; no horizontal scroll at 320. Icon-only exemptions: none expected — if any control is
  icon-only, list it explicitly with justification.
- **If the correct mobile pattern for the `variant="input"` searchable case is genuinely ambiguous (e.g. keyboard +
  bottom-sheet interaction), STOP and ASK — do not guess.**

## 8. 🔴 TailAdmin conformance gate (clause 16 — MANDATORY)

- Every value cited to a `tailadmin-style-reference.md` §-row; extract a new §6x for the searchable-dropdown chrome FIRST
  if no authoritative row exists. Zero invented color/px/radius/shadow.
- Rendered proof **side-by-side with the zip reference** (the `/form-elements` / dropdown reference vs the rendered
  `MantineCombobox`) at 320/375/480 × en/uk + sq/it@320 (**uk@320/375/390 mandatory**) + one ≥640 cell. Border, radius,
  focus ring, shadow, Outfit font, density, item chrome must match. `tsc=0`/gates are BASELINE, never style proof.

## 9. Rendered evidence + gates (clause 12 + 13 — the only accepted proof)

- The story is auto-discovered by the Task 529 enforced gate (`Mantine/Primitives/*`), so `npm run screenshots:assert
  -- --mantine-only` will assert it across 14 viewports × 4 locales, and the 7→? overlay-open set now includes the
  Combobox (§8.2: the story MUST render the dropdown/sheet actually OPEN for at least one section so the gate exercises it).
- Paste the GREEN native transcript for: `npx tsc --noEmit` · `npm run check:stories` (incl. `storybook.mantine.combobox_*`
  parity 4×) · `npm run check:i18n` · `npm run check:design-tokens:strict` · `npm run check:mojibake` ·
  `npm run check:file-integrity` · `npm run build-storybook` · `npm run screenshots:assert -- --mantine-only`.
- **Planted-violation proof (clause 13):** plant a real overflow/mismatch (e.g. force an option row to `min-width:900px`
  or the trigger off-token), show the gate FAILs (transcript), then revert to green. A plant that yields 0 FAIL is a
  gate-limitation finding — record it honestly (do not hide it), and plant a second, harder violation that DOES fail.

## 10. Hard contract (verified against your diff on return)

- No scope change; no consumer migration; no invented architecture — **if a design choice below is ambiguous, STOP and ASK.**
- Self-validate before "complete": `tsc=0`, AC-by-AC self-audit table (cite both §5 and §6 flows by name → file:line),
  read-back every written file (clause 14: 0 NUL / no BOM / not truncated / parses).
- Preserve UX + existing controls (Notes 19/20) — N/A for consumers here (none touched); the primitive itself must expose
  every capability listed in §3.
- Locale parity sq/en/uk/it for all new keys. Update `docs/backlog.md` + a session log under `docs/sessions/` with a
  **"Files Changed" table** (one row per path + rationale). **Do NOT run git / emit `git add`/`git commit`** — the
  orchestrator emits commits after diff review (single-writer rule).

## 11. 🛑 STOP-and-ASK triggers (do not invent — ask the orchestrator/owner)

1. **Mantine base choice:** whether to build on Mantine's low-level `Combobox` primitive vs `Select`-searchable vs a
   custom trigger+`ResponsiveBottomSheet` (as `MantineSelect` does). If the `MantineSelect` pattern does not extend
   cleanly to in-dropdown search, STOP and ASK before forking a new approach.
2. **`portal` mode** (legacy prop for rendering inside overflow:hidden tables): include now, or defer to a follow-up? If
   deferring, the primitive must still not clip inside a scroll container — ask if unsure.
3. **`variant="input"` mobile keyboard vs bottom-sheet** interaction pattern (§7) if it is not obvious from `MantineSelect`.
4. **Searchable-dropdown §6x chrome** — if the zip has no authoritative source for the in-dropdown search field, ask
   whether to reuse the §6d input chrome verbatim or extract a distinct row.

## 12. Acceptance criteria (each must be verifiable in the diff / rendered gate)

1. `MantineCombobox.tsx` created + exported; behavioral parity with legacy `Combobox.tsx` per §3 (or explicitly-approved
   deferrals from §11).  → file:line + AC table.
2. TailAdmin chrome, every value cited to a §-row; new §6x added first if needed; zero invented values (§8).
3. Positive flow §5 steps 1–5 all rendered-verified (desktop anchored + mobile sheet).  → screenshots.
4. Negative flow §6 every branch has a code line + rendered evidence (disabled/error/empty/dismiss/long-label/SSR).
5. Mobile <640 full-width gate §7 satisfied (trigger full-width; sheet edge-to-edge; ≥44px; labels wrap; no h-scroll@320).
6. Story wrapped in `MantineStoryShell`, single `Default`, `storyT()` only, `combobox_*` keys 4× parity; renders OPEN.
7. All gates green natively (§9) + planted-violation FAIL transcript.
8. Session log: AC-by-AC self-audit, rendered matrix (uk@320/375/390), Files Changed table, self-validation line;
   no git run. `docs/mantine-tailadmin-migration-tracker.md` P1.21 row updated.

---

**Kickoff written by orchestrator (Opus), 2026-07-03. Sonnet reads this file directly — do not wait for a chat paste.**
