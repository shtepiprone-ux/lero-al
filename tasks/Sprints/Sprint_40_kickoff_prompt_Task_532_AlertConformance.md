# Task 532 — Alert primitive → TailAdmin conformance (Sprint 40 · Batch D · P1.15)

**Type:** UI / primitive styling conformance (theme-token + new Storybook story). Mantine = source of truth.
**Sprint:** Sprint 40 (TailAdmin conformance, all primitives) — first Batch D (feedback/misc) slice.
**Governance:** agent-contract clauses 1–16 (esp. 11 mobile full-width, 12 rendered matrix, 13 story gate, 16 TailAdmin style). Per-slice DoD = `tasks/Sprints/Sprint_40_TailAdmin_Conformance_AllPrimitives.md` "Per-slice Definition of Done".

> **This is a PRIMITIVE slice, not a surface migration.** Scope = make the Mantine `Alert` primitive render to the
> TailAdmin `/alerts` reference at the theme level + ship its `Mantine/Primitives/Alert` Storybook story with rendered
> proof. **Do NOT migrate the 5 legacy `@/components/ui/alert` consumers** (AdminEmailTemplatesManager, AuthSheet,
> ResetPasswordClient, CabinetPasswordSection, + its test) — those stay on the shadcn primitive and are Phase 4/5 work,
> out of scope here. Touch only the Mantine theme + the new story + its i18n keys.

## Pre-read (rule-index → UI/layout/component task)

Required, in this order:
1. `docs/tailadmin-style-reference.md` — **§6l "Alerts"** (measured chrome, source of truth) + **§4 color palette** (blue-light scale for the info variant) + §2 type scale. `demo_tailadmin_com.zip` `/alerts.html` markup is the visual reference.
2. `docs/mantine-responsive-design-system.md` — §7 mobile gate, §8 Mantine Storybook proof path, §12 canonical patterns, §16 acceptance gates, **§18 theming pitfalls** (inline `theme.styles` freeze the cascade — anything state/pseudo-dependent goes in a stylesheet, not `theme.ts`).
3. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
4. `docs/storybook-governance.md` §14 + the Task 529 enforced-gate mechanism (your story is auto-discovered by `Mantine/Primitives/*` and must pass `npm run screenshots:assert -- --mantine-only`).
5. Always-required: `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — see "Regression coverage" below).

## Authoritative TailAdmin values (from §6l "Alerts", measured live 2026-07-02 — do NOT invent, do NOT re-measure)

- **Container:** `rounded-xl` = **12px radius** · **1px border `semantic-500`** · **bg `semantic-50`** · padding **16px** (`p-4`).
- **Title:** **14px** (`text-theme-sm`) · **weight 600** · color **gray-800 `#1d2939`** · `margin-bottom: 4px`.
- **Body/message:** **14px** · color **gray-500 `#667085`** · line-height **20px**.
- **Variants (semantic → border-500 / bg-50):** success `#12b76a` / `#ecfdf3` · warning `#f79009` / `#fffaeb` · error `#f04438` / `#fef3f2` · **info (blue-light)** `#0ba5ec` / `#f0f9ff`.
- **blue-light scale (§4, authoritative — currently NOT in `theme.ts`):** 50 `#f0f9ff` · 300 `#7cd4fd` · 400 `#36bffa` · 500 `#0ba5ec` · 600 `#0086c9`.

Every value above is cited; put **zero raw hex/px** in code — use Mantine tokens (`var(--mantine-color-{color}-0)` for the 50 bg, `-5` for the 500 border, `--mantine-color-gray-8` title, `--mantine-color-gray-5` body, `--mantine-radius-xl`, `--mantine-spacing-md`). If any needed value is not expressible as a token, STOP and ASK — do not hardcode.

## Current behavior to preserve

- `theme.ts` currently defines only `Alert: { defaultProps: { radius: 'lg' } }` (8px). Any existing Mantine `<Alert>` render (grep `src` for `<Alert` / `Mantine…Alert` consumers first and list them in the log) must keep working: icon slot, `title`, `children` message, `withCloseButton`/`onClose`, and `color` prop all continue to function. This slice changes only the **visual chrome**, not the Alert API or behavior.
- The 5 legacy `@/components/ui/alert` consumers are untouched and must render byte-identically (you are not editing `alert.tsx`).

## Required after-behavior (action by action)

1. **Add the blue-light color scale to `theme.ts`.** ⚠️ The zip (`css/style.css`) ships blue-light at **only 5 stops** — `--color-blue-light-50/300/400/500/600` — there is **no full 10-stop ramp to extract**, and Alert consumes only index **0** (bg) and **5** (border/icon). So paste this EXACT tuple (do NOT interpolate, do NOT invent the gaps — the unused slots are commented as non-authoritative placeholders, NOT presented as TailAdmin tokens):
   ```ts
   const blueLight: MantineColorsTuple = [
     '#f0f9ff', // 0 — blue-light-50  (§4 AUTHORITATIVE — Alert info bg)
     '#f0f9ff', // 1 — UNUSED (no TailAdmin stop; placeholder = nearest §4 stop, not consumed)
     '#7cd4fd', // 2 — UNUSED (placeholder = nearest §4 stop, not consumed)
     '#7cd4fd', // 3 — blue-light-300 (§4 AUTHORITATIVE)
     '#36bffa', // 4 — blue-light-400 (§4 AUTHORITATIVE)
     '#0ba5ec', // 5 — blue-light-500 (§4 AUTHORITATIVE — Alert info border/icon)
     '#0086c9', // 6 — blue-light-600 (§4 AUTHORITATIVE)
     '#0086c9', // 7 — UNUSED (placeholder = nearest §4 stop, not consumed)
     '#0086c9', // 8 — UNUSED (placeholder = nearest §4 stop, not consumed)
     '#0086c9', // 9 — UNUSED (placeholder = nearest §4 stop, not consumed)
   ]
   ```
   Register it in `colors: { … blueLight }`. Cite §4. (If a future task needs a full conformant blue-light ramp for another consumer, extract it from the LIVE TailAdmin site then — out of scope here.)
2. **Extend the `Alert` component theme block** to the §6l chrome, using a `styles` callback keyed off `props.color` (same pattern as the existing `Button`/`Badge` callbacks so `:hover`/variant resolution is not frozen). **Mantine v8.3.18 Alert Styles API slots (confirmed from `node_modules/@mantine/core/.../Alert.d.ts`):** `root · wrapper · icon · body · title · label · message · closeButton`. Target them as follows — **and confirm each rendered slot in DevTools before finalizing (§18 discipline), because `title` is the title-ROW container and `label` is the title TEXT node** (getting these two backwards is the classic rework; verify which one actually carries the text):
   - `defaultProps`: `radius: 'xl'` (12px — **replaces the current `lg`**), `variant: 'light'`.
   - **`root`:** `borderWidth: '1px'`, `borderStyle: 'solid'`, `borderColor: var(--mantine-color-${color}-5)`, `backgroundColor: var(--mantine-color-${color}-0)`, `padding: var(--mantine-spacing-md)` (16px), `borderRadius: var(--mantine-radius-xl)`. ⚠️ Mantine's `variant="light"` sets its own `--alert-bg`; if the explicit `backgroundColor` is overridden in the render, set the bg through the `--alert-bg` CSS var on `root` instead (or a `:where()`-beating rule in a small `alert-chrome.css`), confirmed via DevTools — NOT inline-frozen. Document which path won.
   - **title text (the `label` slot — confirm in DevTools):** `fontSize: var(--mantine-font-size-sm)` (14px), `fontWeight: 600`, `color: var(--mantine-color-gray-8)`, `marginBottom: '0.25rem'` (4px).
   - **`message` slot (children/body):** `fontSize: var(--mantine-font-size-sm)`, `color: var(--mantine-color-gray-5)`, `lineHeight: '1.25rem'` (20px).
   - **`icon` slot:** `color: var(--mantine-color-${color}-5)` (semantic-500).
   - Map the four TailAdmin variants to `color`: success→`green`, warning→`yellow`, error→`red`, info→`blueLight`. Cite §6l + §4 on each.
   - **STOP-and-ASK triggers:** (a) if the light-variant bg cannot be overridden without an inline freeze AND a scoped stylesheet rule feels out of scope; (b) if `label` vs `title` slot semantics are not resolvable in DevTools. Otherwise proceed.
3. **Create the story** `src/stories/mantine/primitives/Alert.stories.tsx` on the **Mantine proof path** (Task 482/529): `title: 'Mantine/Primitives/Alert'`, **exactly ONE `Default` export**, `parameters.skipCanvas` per the other primitive stories, toolbar-driven viewport + locale (no per-viewport/per-locale/`Ukrainian*`/`Pass`/`Fail` exports, no `globals.locale` pin). The Default renders all four variants (success/warning/error/info) each with title + body, one with `withCloseButton`, one icon-less, and a long-content cell — every visible string + `aria-label`/`title` via `storyT()` against a `storybook.mantine.alert` namespace. No raw `<div>` chrome, no raw strings.
4. **Add i18n keys** for the story's strings to all four locales `sq`/`en`/`uk`/`it` in the same key set (namespace `storybook.mantine.alert.*`). Runtime locale switch must visibly change the rendered text (verify, don't just count keys).
5. **No other primitive/theme block touched.** Only: `theme.ts` (`blueLight` + `Alert` block), the new story, the new i18n keys, and — only if step 2 proves a `:where()`-beating rule is required — a minimal scoped Alert stylesheet rule (documented).

## Positive flow (happy path)

Actor: any surface (or the Storybook Default) rendering `<Alert color=… title=… withCloseButton?>…</Alert>`.
1. Success Alert renders: 12px radius, 1px `#12b76a` border, `#ecfdf3` bg, 16px padding, title 14/600/gray-800 with 4px gap to a 14px/gray-500/20lh body. → matches `/alerts` success card.
2. Warning / error / info render the same geometry with their semantic border-500/bg-50 pair (info via the new `blueLight` scale). Post-condition: all four visually match the zip `/alerts` at the sampled cells.
3. `withCloseButton` Alert shows the close control; clicking it fires `onClose` and the consumer dismisses it (behavior unchanged from Mantine default — verify the button still appears and is ≥44px tappable on mobile).
4. Icon-less Alert renders with body flush-left (no reserved icon gutter), still correct padding.

## Negative flow (every off-happy-path branch)

- **Empty/absent message** (`children` empty, title only): renders title block only, container padding intact, no layout collapse. No error thrown.
- **Long localized title + body (sq/en/uk/it):** text **wraps** (`white-space: normal`, `word-break`), never clips or overflows; **no horizontal scroll at 320** in any locale (uk longest — mandatory check).
- **`withCloseButton` on mobile <640:** close target ≥44px, does not overlap wrapped title; Alert container is **full-width edge-to-edge** at `max-sm` (feedback banners are full-width by nature — confirm no side-margin/centered-card and no h-scroll@320).
- **Unknown/невідомий `color`** (a color with no `-0`/`-5` token): must not crash; falls back to a neutral render (document what it does — do not silently emit `var(--mantine-color-undefined-5)`). If Mantine can't express a safe fallback, STOP and ASK.
- **No icon / no title / no close** combinations each render without error.
- **Locale mismatch:** switching locale in the toolbar re-renders every string; `check:i18n` parity 4/4 across `storybook.mantine.alert.*`.

## Mobile <640 full-width gate (agent-contract clause 11)

- The Alert **container is full-width edge-to-edge at `<640`** (not a centered/max-width card). Title/body **wrap** (sq/en/uk/it); close button (when present) stays ≥44px and does not clip. **No horizontal scroll at 320** in any locale. Icon and close button are the only compact controls (icon-only close is the documented exemption). Verify all of this **rendered**, not asserted.

## TailAdmin conformance gate (agent-contract clause 16)

- Every value traces to **§6l Alerts** or **§4** (blue-light) — cite the §-row in each comment; zero invented color/px/radius. `check:design-tokens:strict` green + no raw hex/px in the diff (orchestrator will grep).
- **Rendered proof SIDE-BY-SIDE with the zip `/alerts`** at **320/375/480 × en/uk + sq/it@320 (uk@320/375/390 mandatory) + one ≥640 cell**, all four variants. Border color, radius (12px), bg tint, title/body type + color, and padding must visibly match. `tsc=0`/gate-green is **baseline, never style proof**.

## Regression coverage (agent-contract clause 15)

Scan `docs/critical-flow-registry.md`: this slice changes only the Mantine `Alert` theme chrome + a new story + story-only i18n keys, and does **not** touch any registered auth/listing/admin/RLS flow (the auth reset-password surfaces keep using the legacy `alert.tsx`, untouched). State this explicitly in the session log. No new regression test is required beyond the **enforced rendered gate** (Task 529) auto-covering `Mantine/Primitives/Alert`; confirm the story is discovered and passes, and paste the gate transcript.

## Acceptance criteria (each maps to a flow + a verifiable file:line / rendered cell)

1. `theme.ts` `blueLight` tuple added from §4 and registered in `colors` — Positive flow step 2 (info). Verifiable at `theme.ts` colors block.
2. `Alert` theme block = §6l chrome (radius `xl`/12px, 1px border semantic-500, bg semantic-50, padding 16px, title 14/600/gray-8/mb-4, body 14/gray-5/lh-20, icon semantic-5) via a `props.color` styles callback — Positive steps 1–2. Verifiable at `theme.ts` `Alert:` block (+ any documented scoped CSS rule).
3. `src/stories/mantine/primitives/Alert.stories.tsx` on the Mantine proof path, single `Default`, all four variants + close + icon-less + long-content, all strings via `storyT()` — Positive steps 1–4 + Negative long-content/empty. Verifiable in the story file.
4. i18n `storybook.mantine.alert.*` present in `sq/en/uk/it`, same key set, runtime-switch verified — Negative "locale mismatch". Verifiable in the four locale files + `check:i18n` transcript.
5. Mobile <640 full-width + no h-scroll@320 (uk) + wrap — Negative mobile branch. Verifiable in the rendered matrix (uk@320/375/390 cells).
6. Rendered side-by-side vs zip `/alerts` for all four variants at the required cells — clause 16. Verifiable in the attached PNG matrix.
7. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens:strict`, `check:mojibake`, `check:file-integrity`, and `screenshots:assert -- --mantine-only` (Alert story PASS, 0 FAIL) — with a planted-violation FAIL transcript proving the gate is real. Files Changed table + session log + `docs/backlog.md` update present. No `git add`/`git commit` run by the executor.

## Hard contract (verified against the diff on return)

No scope change (primitive + story + story-i18n only; NO consumer migration, NO `alert.tsx` edit). No invented architecture — STOP and ASK on the `color`-fallback and the light-variant-bg selector question if either is ambiguous. Literal ACs. Self-validate before "complete" (Note 18: AC-by-AC table, tsc=0, self-diff review, runtime uk@320 walk). Preserve UX flow + existing controls (Notes 19/20). File-integrity clean (clause 14): read back every written file, 0 NUL / no BOM / not truncated, paste the green transcript. Session log with a **Files Changed** table (one row per path + rationale). **Executor emits NO `git add`/`git commit`** — the orchestrator emits explicit-path commit commands at review.

## Expected Files Changed

- `src/design-system/mantine/theme.ts` — `blueLight` tuple + registration; `Alert` block → §6l chrome.
- `src/stories/mantine/primitives/Alert.stories.tsx` — NEW, Mantine proof-path story.
- `messages/sq.json` · `messages/en.json` · `messages/uk.json` · `messages/it.json` — `storybook.mantine.alert.*` keys (confirm the actual locale-file paths/structure before editing).
- (only if required by step 2) a minimal scoped Alert CSS rule — documented.
- `docs/backlog.md` + `docs/sessions/2026-07-03-task532-alert-conformance.md` (+ `docs/sessions/assets/task532/` rendered PNGs).
