# Task 549 — Toast / Notification primitive → TailAdmin (Phase 1 · P1.29 — LAST Phase-1 primitive)

> **Sprint 40 / Epic MM — Phase 1 primitive slice. Owner P0, agent-contract clause 16.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine primitive slice (theme defaults + a scoped `notification-chrome.css`
> only if a value is proven not theme-reachable + a static story + rendered proof). Follows the P1.24 (Skeleton) /
> P1.25 (Separator) / P1.26 (ScrollArea) / P1.27 (Slider) precedent: **primitive + story ONLY, zero consumer
> migration** (that is Phase 2). **Status:** OPEN.
> Tracker row: `docs/mantine-tailadmin-migration-tracker.md` P1.29 (`sonner.tsx` → Mantine `Notification` /
> `@mantine/notifications`, ref §5 shadow + the new §6r).
> **This is the last Phase-1 primitive — closing it completes the Phase-1 primitive slice.**

## What this primitive IS (read first — it is NOT an honest-negative like Slider)

The legacy transient toast is **`src/components/ui/sonner.tsx`** (the Sonner `Toaster`, with success/info/warning/
error/loading icon variants). Its Mantine equivalent is the **`@mantine/notifications`** system, which is **already
installed and mounted**: `<Notifications position="top-right" />` sits in `MantineRootProvider.tsx`, and
`@mantine/notifications/styles.css` is imported in `src/app/layout.tsx`. `@mantine/notifications` renders the Mantine
**`Notification`** component — **that `Notification` card is the primitive this task styles to the TailAdmin toast look.**

There is currently **NO `theme.components.Notification` block** (grep-confirmed) — the live notification card renders with
Mantine defaults. The existing demo `MantineNotificationPattern.tsx` fires `notifications.show({ color: 'green'|'red'|
'blue'|'yellow' })` — i.e. **raw Mantine palette names, NOT the §-cited semantic tokens** (`success #12b76a` / `info
#0ba5ec` (blueLight) / `warning #f79009` / `error #f04438`). That is the conformance gap this task closes at the theme
level.

## Scope

Style the canonical Mantine **`Notification`** primitive to the TailAdmin compact-toast look via
`theme.components.Notification` (+ a scoped `notification-chrome.css` ONLY if Step 0 proves a value can't be set via
theme), and add a **static, determinate** `Mantine/Primitives/Notification` story with rendered proof.

**Explicitly OUT of scope (do NOT do any of these — they are Phase 2 or separate tasks):**
- **Do NOT migrate any Sonner consumer.** `grep` finds **36 files** importing `sonner` / calling `toast()` (admin
  managers, cabinet tabs, listing dialogs, auth layouts, …). Migrating them off Sonner onto `notifications.show()` is a
  large Phase-2 effort — this slice touches ZERO of them.
- **Do NOT delete `src/components/ui/sonner.tsx` or remove the `<Toaster>`** from any layout. The live Sonner toast
  system keeps working unchanged this task.
- **Do NOT change the `<Notifications />` provider `position`** (`top-right`) or the `ModalsProvider`/`MantineProvider`
  wiring. If you conclude the mobile bottom-sheet rule (clause 11) requires moving the live portal to a bottom position
  at `<640`, **STOP and ASK** — do not change global overlay positioning by guessing (see the Mobile gate note below).
- **Do NOT restyle other primitives**, shared tokens, `globals.css`, or the semantic color arrays in `theme.ts`
  (§1b success/warning/error/blueLight are already authoritative — consume them, do not edit them).
- The existing `MantineNotificationPattern.tsx` + `src/stories/patterns/mantine/NotificationPattern.stories.tsx` are a
  **Patterns/** layer surface — leave them in place; do not delete or rewrite them. (You MAY note in the session log
  that their raw `green/red/blue/yellow` mapping is a Phase-2 conformance follow-up, but do not fix it here.)

## 🔴 Step 0 — FORMALIZE the reference into a new §6r row FIRST (clause 16 — no invented values)

Unlike Slider (§6q honest-negative), TailAdmin **DOES ship a Notifications/Toast reference.** It is currently recorded
as PROSE in the "UI Elements sweep" block of `docs/tailadmin-style-reference.md` (the `**Notifications / Toast
(/notifications, measured)**` paragraph, ~line 454):
- notification **card**: `rounded-xl` (12px), 1px border gray-200 `#e4e7ec`, bg white, padding **20px** (`p-5`), body
  14px / gray-500 `#667085`;
- **compact toast** (the transient variant this primitive targets): white bg, **`rounded-md` (6px)**, padding **12px**
  (`p-3`), **`gap-3`**, **semantic LEFT accent** (success `#12b76a` / info `#0ba5ec` / warning `#f79009` / error
  `#f04438`), **max-width ~340px**.

Promote this into a **new numbered `## 6r.` row** (next after §6q) in `docs/tailadmin-style-reference.md`, following the
§6n–§6q format. Before writing it, **re-confirm each value against `demo_tailadmin_com.zip`** — the `/notifications`
page HTML/markup + `css/style.css` (grep for `notification`, `toast`, `ri-` icon classes, the semantic accent classes).
Record in §6r, each value cited to its zip source (or, for anything the zip genuinely lacks, an explicit reuse of an
already-cited §1b semantic token — say so, exactly as §6q did). Cover:
- **Card chrome** — bg (white), radius (compact = 6px `rounded-md`; confirm the compact vs full-card split), border
  (1px gray-200 or borderless for the accent variant — confirm), **shadow** (tracker says "§5 shadow" — cite the exact
  §5 `shadow-theme-*` token the toast uses), padding (`p-3` compact / `p-5` card), `gap-3`, **max-width ~340px**.
- **Semantic left accent** — the 4px left border color per variant, mapped to the §1b tokens: success `#12b76a` /
  info `#0ba5ec` (blueLight-500) / warning `#f79009` / error `#f04438`. **Reuse the exact same variant→color mechanism
  the already-approved Alert primitive uses (§6l / Task 532** — the `props.color` `styles` callback with
  `var(--mantine-color-${color}-5)` etc.). Do NOT invent a new mapping and do NOT use raw `green/red/blue/yellow`; cite
  §6l and keep Notification consistent with Alert.
- **Text** — title weight/size, message 14px / gray-500, icon color = semantic-500 (confirm against §6r/§6l).
- **Close button** — if the toast has a dismiss "×", cite its size/color (gray-400/500) from the zip or the §6e icon
  convention; state it.

- **🔴 Mechanism (resolve in Step 0, record in §6r + `storybook-governance.md §14.9.17`):** determine which §6r values
  are reachable via `theme.components.Notification` (`defaultProps.radius`/`withBorder` + a `styles`/`vars` callback on
  the `root`/`icon`/`title`/`description`/`closeButton` slots, driven by `props.color` exactly like the Alert §6l
  block) versus a scoped `notification-chrome.css`. **Try theme FIRST** (`mantine-responsive-design-system.md` §18 + the
  Alert/Progress/Slider precedent). Fall back to `notification-chrome.css` ONLY for values proven not theme-reachable
  (e.g. a state-dependent structural rule, or the `max-width`/left-accent if the `styles` callback can't reach it) —
  document the proof against Mantine's compiled `Notification.mjs` / `Notification.module.css`, exactly as Task 545
  (Divider) / 546 (ScrollArea) / 548 (Slider `slider-chrome.css`) did. If you add `notification-chrome.css`, wire it in
  BOTH `src/app/layout.tsx` AND `.storybook/preview.tsx` (source-order, after the last existing `*-chrome.css` import),
  exactly as `slider-chrome.css` was wired.

Every value in the implementation must trace to §6r — zero invented color/px/radius/shadow.

## Required after-behavior

- **`theme.ts` `Notification` block per §6r, `var(--mantine-*)` tokens only** — radius (6px `rounded-md`), the semantic
  left accent per `props.color` (via the §6l Alert-style `styles` callback → `var(--mantine-color-${color}-5)`),
  padding/gap, shadow (§5 token), `max-width` (see the Mobile gate for the `<640` override), title/message/icon text
  chrome. Document any zero-override decision (like Progress/Slider did). Do NOT re-implement behavior Mantine already
  gives (auto-close timer, enter/leave transition, stacking) — theme the chrome only.
- **`Mantine/Primitives/Notification` story** (`skipCanvas: true` + `layout: 'fullscreen'`, `MantineStoryShell`):
  - **🔴 STATIC / DETERMINATE — render `<Notification>` primitives INLINE. Do NOT call the imperative
    `notifications.show()` / `notifications` API in the story.** A live toast is a portal with an auto-close timer and an
    enter/leave animation → it is NOT byte-stable and the rendered gate compares geometry. Import `Notification` from
    `@mantine/core` and render one card per state directly inside a `Stack`, each with a fixed `title`/children and a
    fixed `color`, so every cell is deterministic (same discipline as Slider's fixed `defaultValue`).
  - **States** (one `Notification` each): **success** (`color="green"`/the §6l success mapping), **info**, **warning**,
    **error**, and a **neutral/default** (no color). Include a **loading** variant only if the §6r/Sonner parity needs
    it (Sonner had a `loading` spinner icon) — if shown, use a static (non-spinning) icon so the cell is byte-stable, or
    omit and note it. Show the semantic left accent + icon + title + message on each.
  - **🔴 i18n:** every visible title/message/aria string MUST come from `storyT()` against `storybook.mantine.*` with
    full **sq/en/uk/it** parity (canonical sibling-primitive pattern). Do NOT hardcode English. Add the new keys to all
    four `messages/{sq,en,uk,it}.json` with an identical key set.
- **`LOADER_ALLOWLIST` — VERIFY empirically, do not assume.** A static `Notification` render should trip NONE of
  `waitForStoryReady`'s loader signals. Confirm on the built story (like Tasks 544/545/546/548). If no signal fires
  (expected), `LOADER_ALLOWLIST` stays UNCHANGED and you record the verified finding in `storybook-governance.md
  §14.9.17`. If a signal fires (e.g. a `loading` variant's spinner class), STOP and ASK — do NOT copy a prior finding
  forward. (If you include a static loading icon, prove it does not trip the allowlist.)
- **Consumer audit (migrate none):** in the session log, state the Sonner consumer count (`grep -rl` from `sonner` /
  `toast(` — expected ~36) and confirm this slice migrates **zero**. Confirm the only current consumer of the Mantine
  `Notification`/`notifications` path is `MantineNotificationPattern.tsx` (demo) — and that the new `theme.components.
  Notification` default does not visually break its rendered pattern story (re-run that story's cells; if the theme
  default changes its appearance, note it — a demo-pattern restyle is acceptable and expected, a *broken* render is not).

## Mobile <640 full-width gate (clause 11)

- The **static story cards** render inside `MantineStoryShell` (full-width container). Each `Notification` MUST be
  **full-width edge-to-edge at `<640`** (no fixed px width clipping at 320) and capped at the §6r **~340px max-width at
  `≥640`**. Implement this as a **responsive `max-width`** (`max-width: none` / `100%` below 640, `340px` at ≥640) so it
  satisfies clause 11 without a fixed narrow card on mobile. Confirm no document h-scroll at 320 in any locale.
- **Live-portal positioning is a STOP-AND-ASK, not a guess.** Clause 11 says all popups become full-width bottom sheets
  at `<640`. The live `<Notifications />` portal is `top-right`. Changing its mobile position/anchoring is a **global
  provider behavior change** and is OUT of this slice's scope. Theme the CARD to be full-width-capable at `<640` (above);
  if the owner wants the live mobile portal re-anchored to a full-width bottom stack, that is a **separate follow-up
  task** — note it in the session log; do NOT change `MantineRootProvider` here.
- Long uk/it titles/messages wrap (`whitespace-normal break-words`), never clip; **no document h-scroll at 320** in any
  locale. Close-button touch target ≥44px if a "×" is present (or document a compact-control exemption per clause 11).

## Positive + Negative flow

- **Positive:** `Mantine/Primitives/Notification` at `≥640` and `320` × sq/en/uk/it renders the success / info /
  warning / error / neutral cards with the §6r radius (6px), semantic left accent (§6l token per variant), shadow (§5),
  padding/gap, and text chrome — visibly matching the TailAdmin `/notifications` reference side-by-side with the zip.
  Each card is full-width at `<640`, ≤340px at `≥640`.
- **Negative flow (every branch):**
  - **(a) long uk/it title + message @320/375/390** — card full-width, text wraps, NO document h-scroll, accent + icon
    stay aligned; nothing clips.
  - **(b) no-color / neutral variant** — renders with the default (no semantic accent) chrome, no thrown error, no
    stray colored border.
  - **(c) loading variant (if included)** — static icon, byte-stable, does NOT trip `LOADER_ALLOWLIST`; if it would,
    STOP and ASK.
  - **(d) close button (if present)** — ≥44px hit target or documented compact exemption; visible dismiss affordance.
  - **(e) No regression:** the new `theme.components.Notification` default must not leak into any other component; no
    shared token/var/semantic array modified; `globals.css` untouched; the live Sonner `<Toaster>` and all 36 Sonner
    consumers are unchanged (theme-only + new-file change); the `MantineNotificationPattern` demo still renders (restyle
    OK, breakage not).

## Pre-read (rule-index → UI / layout / component + Storybook)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (**scan** — this slice
  is theme-only on the Mantine `Notification` primitive and touches ZERO Sonner consumers, so no registered toast/auth/
  report flow is modified; confirm and state it explicitly).
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — formalize the §6r Notification/Toast row FIRST
  (Step 0); read **§6l Alert (Task 532)** as the authoritative semantic-variant→color mechanism to mirror, and the
  existing `**Notifications / Toast**` prose (~line 454) as the measured starting values.
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12 (canonical patterns), §16 (acceptance gates),
  §18 (theming pitfalls — `theme.styles` inline vs a `*-chrome.css` file; the `props.color` `styles` callback pattern).
- `docs/storybook-governance.md` §14 (+ §14.9 for the loader-allowlist verification record; note §14.9.13 "check the
  compiled source per component" lesson).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — new Notification story, all cells resolved, uk@320/375/390 clean,
  **no document h-scroll**, no new FAIL elsewhere; rendered side-by-side with the §6r reference. Attach the manifest.
- Planted-violation FAIL transcript (prove the gate still catches a real defect on this surface — e.g. a forced
  over-wide `min-width: 900px` on a card, or a stripped accent — then revert clean and reconfirm the baseline byte-for-
  byte, exactly as Task 548 did).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green (paste transcripts).
- Regression (clause 15): confirm no `critical-flow-registry.md` flow touched — state it.

## Acceptance criteria

1. New `docs/tailadmin-style-reference.md §6r` Notification/Toast row FORMALIZED FIRST from the existing measured prose +
   re-confirmed against the zip (card bg/radius/border/shadow/padding/gap/max-width; semantic left accent per variant
   mapped to §1b tokens via the §6l Alert mechanism; text + icon + close chrome) + the theme-vs-`notification-chrome.css`
   mechanism decision recorded (in §6r + `storybook-governance.md §14.9.17`); every implementation value cited to §6r /
   §6l / §1b — zero invented color/px/radius/shadow (clause 16).
2. `theme.ts` `Notification` block (theme `defaultProps` + `props.color` `styles`/`vars` callback preferred;
   `notification-chrome.css` only with proof, wired into BOTH `layout.tsx` + `preview.tsx`) + a **static/determinate**
   `Mantine/Primitives/Notification` story (success/info/warning/error/neutral [+ static loading if parity-needed],
   `storyT` i18n parity) render matching §6r at ≥640 and 320 × sq/en/uk/it, cards full-width at `<640` and ≤340px at
   `≥640`, NO document h-scroll at 320. Semantic accent uses the §6l token mechanism, NOT raw green/red/blue/yellow.
3. `LOADER_ALLOWLIST` verified empirically — UNCHANGED if no signal fires (expected), documented in
   `storybook-governance.md §14.9.17` with rendered proof. No assumption copied from a prior task.
4. Consumer audit in the session log: Sonner consumer count stated (~36), migrate ZERO; `sonner.tsx` + `<Toaster>` left
   in place; `<Notifications/>` provider position UNCHANGED (mobile re-anchor deferred as a noted follow-up, not done
   here); `MantineNotificationPattern` demo still renders (restyle OK). No other primitive regressed; no shared token/var
   /semantic array or `globals.css` modified.
5. Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation transcript; all light gates green. Close-button
   compact-control mobile exemption documented explicitly if applicable (clause 11).
6. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix, then emits the explicit-path commit (`src/design-system/mantine/theme.ts` [+ `notification-chrome.css`
+ its two import lines in `src/app/layout.tsx` and `.storybook/preview.tsx` — only if justified] + the new
`src/stories/mantine/primitives/Notification.stories.tsx` + `scripts/check-stories-rendered.mjs` ONLY if the allowlist
changed + `docs/tailadmin-style-reference.md` + `docs/storybook-governance.md` + the new i18n keys in all four
`messages/{sq,en,uk,it}.json` + session log + `docs/mantine-tailadmin-migration-tracker.md` (P1.29 ⬜→🟡) + `docs/
backlog.md` + `docs/backlog-archive.md`). Owner runs it in PowerShell after the native gate.
