# Sprint 31 — Task 354-Fix kickoff (Sonnet) — Rendered-Storybook QA failure → GLOBAL mobile-control / Storybook-localization / filter-state / no-raw-enum Design-System corrective (NO route migration)

> **Status: READY. Owner priority #1.** Task 354 passed code-level gates but **owner-rendered Storybook
> QA FAILED**: the rendered UI still has **design-system** failures (not isolated component bugs). Task
> 354 is therefore **NOT approved**. Task 354 is **UNCOMMITTED**, so this corrective runs **on top of the
> current Task 354 working tree** — preserve Task 354's valid changes, do not revert them. The combined
> result is reviewed as **Task 354-Fix**.
>
> **You are Sonnet 4.6, the executor.** Implement the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. Do NOT migrate admin/app routes. Do NOT replace Storybook config. If
> anything is ambiguous or a required decision is missing, **STOP and ASK the orchestrator** — do not
> improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) reads the real diff and emits commit commands. (agent-contract clause 10.)

```
Type:     corrective / GLOBAL Design-System hardening (rendered-QA failure remediation; NO route migration)
Priority: CRITICAL (owner first-priority; blocks approval of Task 354)
Area:     Global DS mobile-control contract · Storybook localization · filter active-state · no raw enum/status labels · no-overflow
Builds on: the uncommitted Task 354 working tree (preserve its Combobox/Select viewport-clamp work and its valid changes)

Critical owner directive: this is NOT a narrow patch to one story. It must ESTABLISH and ENFORCE global
DS rules for mobile controls, localized Storybook fixtures, filter state, and no raw enum/status labels.
```

## Role contract

You are **Sonnet 4.6, the executor**. You correct a **rendered** design-system failure across DS
primitives and their Storybook fixtures, and you codify the governing DS rules in `/docs`. You do **not**
migrate or redesign any admin/public route, do **not** touch DB/RLS/auth, do **not** rewrite Storybook
config, do **not** delete existing controls, and do **not** run git. Outside-allowlist = scope violation
= STOP & ASK. Opus reviews the real diff and emits git commands.

## Confirmed root causes (verified by orchestrator audit, 2026-06-01 — anchored to real code)

Full audit table: `docs/sessions/2026-06-01-task-354-fix-orchestration-and-348-350-qa-deferral.md`.
Summary you must fix:

1. **Raw enum/status labels** — `src/components/admin/StatusChangeHistory.tsx`:
   `const label = (s) => labelFormatter ? labelFormatter(s) : s` (identity default). Normal stories
   (`Single`, `Multiple`, `Multiple_Mobile320`) pass raw codes (`open`, `in_progress`, `resolved`) with
   **no** `labelFormatter` → the raw enum renders as `open → in_progress`. uk stories smuggle localized
   strings into the `fromStatus`/`toStatus` **data** fields (fixture hack). StatusChangeControl has the
   analogous raw-key risk (Task 354 addressed its stories; re-verify it is not regressed).
2. **Mixed-language normal stories** — PageShell / PageHeader / FilterBar story fixtures hardcode English
   scaffolding ("Search results", "Page content area", "Available Listings", "Browse available
   properties", "New Listing", "Listings") while the locale toolbar is uk/it.
3. **Filter count vs state mismatch** — `src/components/layout/FilterBar.stories.tsx` `FilterChips`
   renders N generic `Button size="sm" variant="outline"` chips with **no** active/selected state, while
   `activeCount` is a disconnected number. "Filters 2" but the sheet shows 5–6 identical chips with no
   active-vs-available distinction.
4. **Sub-44 mobile controls / chip-text-bigger-than-chip** — `src/components/ui/button.tsx`: `sm`=h-7
   (28px), `default`=h-8 (32px), `lg`=h-9 (36px) are all sub-44; only `xl`=h-11 (44px), `icon-xl`=44px
   meet the floor. FilterChips use `size="sm"` (28px) as tappable mobile controls; chip text
   `text-[0.8rem]` ≈ the 28px pill height.
5. **Mobile actions not full-width/stacked** — `src/components/layout/ActionBar.tsx` stacks `flex-col`
   `<md` but children are not `w-full`; `src/components/layout/PageHeader.tsx` action slot is `shrink-0`
   (content-width) on mobile → small "New Listing" pill.
6. **Inconsistent control heights on a shared surface** — chips/buttons not height-paired with
   Input/Combobox/Select triggers in the affected stories (`ui-rules.md §15` not represented in fixtures).

## Pre-read (load ONLY these — `docs/rule-index.md`: "UI / layout / component" + "Storybook / visual snapshot")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:** `docs/design-system.md` (esp. **§3** 14-width × 4-locale canon, **§6** typography/wrapping,
**§11** filters/actions, **§12** forms/touch-target ≥44px, **§19–§21** PASS/FAIL), `docs/ui-rules.md`
(esp. **§3** button sizes, **§8** touch targets, **§15** control-height alignment, **§16** z-index,
**§17** UI pre-flight), `docs/component-rules.md`, `docs/qa-rules.md`.
**Required (Storybook):** `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`.
**Required (this corrective):** `docs/rule-index.md`, `docs/component-governance.md`, `docs/ai-behavior.md`,
`docs/responsive-screenshot-matrix.md`, **the current Task 354 session log**
(`docs/sessions/2026-06-01-task-354-admin-ds-overflow-row-actions-hardening.md`), **the current Task 354
changed files** (`git status --short` + read each), and **the orchestrator audit**
(`docs/sessions/2026-06-01-task-354-fix-orchestration-and-348-350-qa-deferral.md`).
**Then inspect** the ALLOWED-to-touch files below and discover exact line-level usages with the audit
commands in the Validation section.

## Owner evidence to address (from rendered Storybook screenshots)

- StatusChangeHistory exposes raw `open → in_progress`, `in_progress → resolved` instead of localized
  human-readable labels.
- Ukrainian/Italian stories show English strings ("Search results", "Page content area", "Available
  Listings", "Browse available properties", "New Listing").
- Filter trigger "Фільтри 2" / "Filters 2" opens a sheet whose chips do not distinguish the 2 **active**
  from the merely **available**.
- Button/chip heights do not match text-field heights.
- Mobile buttons/chips too small at 320/375/390; not safe finger touch targets; some chips smaller than
  their own text.
- On narrow screens primary/secondary actions are not consistently full-width / stacked.
- This is a **global** DS problem, not a one-off Task 354 issue.

---

## Mandatory scope (literal) — establish + enforce GLOBAL DS contracts

### A. Global mobile-control contract
- Every interactive mobile control has a minimum practical touch target of **44px height**.
- At 320/375/390, primary and secondary action buttons in DS primitives become **full-width or stacked**
  unless a documented exception applies.
- Chips/filter buttons must NOT be tiny pills on mobile when used as tappable controls.
- Button/chip **text must never look larger than its container**.
- Text inputs, Combobox triggers, Select triggers, Buttons, and filter chips have **consistent
  height/rhythm** within the same UI row/surface (`ui-rules.md §15` "one row, one height").
- On mobile, controls that cannot fit one row **wrap or stack predictably** with **no horizontal overflow**.

### B. Filter count + filter sheet contract
- The filter trigger count represents **active** filters, not available options.
- "Filters 2" ⇒ the opened sheet clearly shows **exactly 2 active filters** as selected/active.
- Available options may also be shown, but **active vs available is visually unambiguous**.
- Reset/clear reflects the actual active filter count.
- Storybook FilterBar fixtures must NOT use random mismatched state. Include positive AND negative
  examples: **0 active**, **2 active**, **many available but only 2 active**, **reset interaction** (if supported).

### C. Localization contract for Storybook
- Normal UX stories never mix languages. A uk story uses uk copy for **all** visible labels, headings,
  placeholders, button labels, helper text, empty states, and sheet content. Same for sq/en/it.
- English fallback is NOT acceptable in a locale-specific normal story.
- Any deliberately mixed/raw/fallback story must be **explicitly named** as a stress/fallback story
  (e.g. `*_RawKeyStress`, `*_MixedFallbackStress`) and must NOT be the default/normal QA story.
- All user-visible text added/corrected is covered in sq/en/uk/it **or** supplied as complete
  per-locale story fixtures where runtime i18n is not wired into that story.

### D. Status label contract
- StatusChangeHistory and StatusChangeControl never expose raw technical enum/status values in normal UI
  (`open`, `in_progress`, `resolved`, `closed`, `pending`, `active`, `inactive`, `sold`, `rented`,
  `archived`, …).
- Arrow transitions use localized labels on **both** sides, e.g. "Відкрито → В роботі", not
  "open → in_progress".
- Unknown status code ⇒ a **documented, visibly-safe fallback** (e.g. a humanized Title-Cased token), NOT
  a raw snake_case key leak in normal stories.
- Storybook includes status-transition stress cases for sq/en/uk/it.
- **Implementation guidance (stay in scope):** prefer (a) normal stories pass a localized `labelFormatter`
  fixture per locale, AND (b) make the primitive's default rendering **safe** — when no formatter is
  supplied it must NOT print a raw snake_case enum; use a documented humanizing fallback. If a fully
  localized default status map would require new key architecture or editing `src/app`/`src/modules`
  consumers → **STOP & ASK** (do not migrate routes; do not invent a key namespace silently).

### E. No-overflow / no-ellipsis DS contract
- Default for user-facing/admin text is **wrap**, not truncate. Truncation only where the full value is
  accessible via `title`/`aria-label`/tooltip or an existing accepted pattern.
- At 320/375/390, no component creates horizontal page overflow.
- Long uk/it labels are treated as stress cases.
- Dropdowns/sheets/popovers are viewport-bounded (preserve Task 354's Combobox/Select clamp work).

### F. Global Storybook rendered QA matrix (direct stories, not only indirect)
Add/adjust **direct** rendered stories for the affected DS primitives:
- **StatusChangeHistory:** en/sq/uk/it normal transition stories; mobile 320/375/390; no raw enum values.
- **FilterBar (current filter primitive):** 0 active; 2 active; many available with 2 active; mobile
  320/375/390; sheet open at 320/390; sq/en/uk/it copies or locale-specific fixtures.
- **ActionBar / PageHeader / button groups:** mobile 320/375/390 stacked/full-width actions; long uk
  title/action labels; primary + secondary + destructive combinations.
- **Button / chip / filter-chip primitive (if one exists):** minimum touch target; height/rhythm equalized
  with text inputs; long labels at 320/375/390.
- **Combobox and Select:** keep Task 354 viewport-clamp fixes; add direct stories for trigger + open
  dropdown at 320/375/390/480; sq/en/uk/it long labels where relevant.

> Note on B/D: the FilterBar **primitive** treats `filters` as an opaque node and exposes `activeCount`
> (it does not own chip selection). The active/available distinction is therefore primarily a **story
> fixture + chip presentation** contract. Only change `FilterBar.tsx` itself if the active-count/sheet
> contract genuinely cannot be made unambiguous at the fixture/chip level — and document why. Otherwise
> STOP & ASK before editing the primitive.

---

## Allowed file areas (edit ONLY these; the "ONLY if" guards are mandatory)

```
src/components/admin/StatusChangeHistory.tsx        (safe default label rendering — no raw enum leak; PRESERVE semantics/props)
src/components/admin/StatusChangeHistory.stories.tsx (localized labelFormatter fixtures; en/sq/uk/it; mobile 320/375/390; no raw enum)
src/components/admin/StatusChangeControl.tsx         (ONLY if raw enum/status can still leak from the component itself)
src/components/admin/StatusChangeControl.stories.tsx (localized fixtures; status-transition stress sq/en/uk/it; no raw keys)
src/components/layout/ActionBar.tsx                  (ONLY if the mobile stacking / full-width / touch-target contract belongs here)
src/components/layout/ActionBar.stories.tsx          (mobile stacked/full-width; long uk labels; primary+secondary+destructive)
src/components/layout/PageHeader.tsx                 (ONLY if PageHeader action layout is the source of the mobile failure)
src/components/layout/PageHeader.stories.tsx         (localized; mobile action layout; long uk title)
src/components/layout/FilterBar.tsx                  (ONLY if the filter trigger/sheet/chip active-state contract cannot be fixed at fixture level)
src/components/layout/FilterBar.stories.tsx          (active-vs-available chips; 0/2/many-with-2-active; reset; sq/en/uk/it; mobile + sheet-open)
src/components/ui/button.tsx                         (ONLY if the base touch-target/height contract is globally wrong — additive size/variant, no breaking change)
src/components/ui/select.tsx                         (PRESERVE Task 354 clamp; only direct-story/touch-target reinforcement)
src/components/ui/select.stories.tsx                 (direct trigger + open dropdown at 320/375/390/480; sq/en/uk/it long labels)
src/components/shared/Combobox.tsx                   (PRESERVE Task 354 clamp; only if a touch-target/height contract genuinely belongs here)
src/components/shared/Combobox.stories.tsx           (direct trigger + open dropdown at 320/375/390/480; sq/en/uk/it long labels)
messages/sq.json · messages/en.json · messages/uk.json · messages/it.json  (ONLY for genuinely missing real keys — add to ALL FOUR, keep parity)
docs/design-system.md                (ADD canonical "Mobile Control Touch Target and Stacking Contract")
docs/ui-rules.md                     ("No raw enum/status labels in UI" + "No mixed-language normal Storybook stories")
docs/component-rules.md              (component-level reflection of the above if behavior contracts change)
docs/component-governance.md         (if a global control-state/no-raw-enum governance rule is codified)
docs/storybook-governance.md         (rendered-QA rules: build-storybook is NOT visual approval)
docs/responsive-screenshot-matrix.md (register the new required DS rendered stories)
docs/component-catalog.md            (ONLY if a component behavior contract changed)
docs/backlog.md                      (UPDATE — Last Session, 2–4 lines)
docs/sessions/2026-06-01-task-354-fix-rendered-storybook-mobile-control-localization-ds-contract.md  (NEW — session log)
```

> **Scope authorisation (Task 350 freeze, conditionally lifted by owner for THIS task only):**
> `ActionBar.tsx`, `PageHeader.tsx`, `FilterBar.tsx`, `button.tsx` are editable **ONLY IF** you can prove
> the mobile-control / stacking / filter-state / touch-target contract genuinely belongs in that primitive
> (state the proof in the session log). A layout-primitive runtime change that is not provably the source
> of the failure = STOP & ASK. Prefer fixing at the story-fixture / consumer level; touch the primitive
> only when the defect is structurally inside it.

## Forbidden file areas (STOP & ASK if any seems required)

```
src/app/**                          (route adoption out of scope; READ-only for the empty-diff proof)
src/modules/**                      (out of scope; READ-only for the empty-diff proof)
database migrations / SQL scripts · Supabase / RLS / auth logic
package dependency upgrades (package.json / package-lock.json)
unrelated admin route migrations · unrelated refactors
replacing/rewriting the whole Storybook config (.storybook/main.ts, preview.tsx preset list, locale toolbar)
DELETING existing controls instead of fixing their layout/state
```

## Current behavior to PRESERVE

Task 354's valid changes (Combobox/Select viewport-clamp; StatusChangeControl `label` fixtures;
AdminTable/AdminCardList story fixes; the +3 `admin.common.status_control` keys); Task 350 layout
primitive **logic/structure** (you may add the mobile-control contract but must not break existing
desktop layout, props, or composition APIs); StatusChangeControl transition logic; StatusChangeHistory
props (`events`, `labelFormatter`, `emptyKey`) and semantics; Button/Badge/Combobox/Select canonical
roles + keyboard/focus/aria; Storybook viewport presets + locale toolbar; messages key parity;
lint/build/i18n baselines. **No existing interactive control may be silently removed** (Note 20).

## Localization coverage

Locales **sq / en / uk / it** (uk = primary stress, longest labels). No normal story exposes a raw key
or raw enum as user-facing copy. No normal story mixes languages. New labels → all four files with
parity; existing keys → reuse. `check:i18n` must pass.

## Responsive coverage — required widths

Canonical DS widths (`design-system.md §3`): **320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 ·
1024 · 1200 · 1440 · 1920 · 2560**, plus the always-cited contract subset **320 / 375 / 390 / 768 /
1280 / 1440 / 2560**. **Also explicitly inspect owner-observed 360 / 412** for controls/popovers/sheets.

## Positive flow (happy path) — required (Task 255 rule)

**Actor:** owner/designer doing rendered Storybook DS QA. **Preconditions:** Storybook built on the Task
354 working tree; viewport presets + locale toolbar intact; sq/en/uk/it messages loaded.

1. Owner opens StatusChangeHistory normal stories (en/sq/uk/it, 320/375/390) → both sides of every
   transition are **localized human-readable labels**; no `open`/`in_progress`/`resolved` raw enum.
2. Owner opens FilterBar stories → trigger count = number of **active** filters; opening the sheet shows
   exactly that many chips as **active/selected**, visually distinct from available chips; reset reflects
   the active count; 0-active shows no badge/reset.
3. Owner opens a uk (and it) story for PageShell/PageHeader/FilterBar → **all** visible copy is in that
   locale; no English scaffolding remains.
4. Owner opens ActionBar/PageHeader action-group stories at 320/375/390 → primary/secondary/destructive
   actions are **full-width or stacked**, ≥44px tall, no horizontal overflow; long uk labels wrap.
5. Owner opens Combobox/Select + chip stories at 320/375/390/480 → trigger/chip/input heights match on a
   shared surface; dropdown stays viewport-bounded; long uk labels fit/wrap.
6. Owner toggles sq/en/uk/it across the required widths → stable layout, no raw enum/key, no mixed
   language, no overflow, no sub-44 tappable control.

**Post-conditions:** direct regression stories exist for every owner-evidence case; `check:i18n` parity
holds; `tsc`/`build`/`lint` clean; `build-storybook` exits 0; no Task 350 primitive **logic** regressed;
no `src/app`/`src/modules`/DB/package diff.

## Negative flow (every off-happy-path branch) — required (Task 255 rule)

- **No formatter supplied to StatusChangeHistory/Control** → component renders a **safe humanized
  fallback**, never a raw snake_case enum.
- **Unknown/unmapped status code** → documented visibly-safe fallback; no raw key leak in normal stories.
- **A retained raw/mixed story** → explicitly named `*_RawKeyStress` / `*_MixedFallbackStress`; never the default.
- **0 active filters** → no count badge, no reset; sheet shows only available chips, none marked active.
- **Many available, 2 active** → exactly 2 chips marked active; the rest clearly available; trigger says 2.
- **Long uk/it label** → wraps; truncation only with `title`/`aria-label`/tooltip; no mid-card clip from missing `min-w-0`.
- **Narrow 320/360/375/390/412/480** → no content escapes its container; no dropdown/popover horizontal
  page overflow; popover max-width viewport-bounded; long unbroken strings break safely.
- **Mobile action row can't fit** → wraps or stacks; never horizontal-scrolls a toolbar.
- **Combobox/Select interaction** → keyboard nav, focus, selected state, aria semantics NOT broken by any
  height/wrap/touch-target change.
- **Desktop regression risk** → mobile/touch-target changes must NOT break desktop/tablet layout or the
  existing primitive APIs.
- **Scope-escape** → if a fix appears to need `src/app`/`src/modules`/DB/new-key-architecture/package
  upgrade/Storybook-config rewrite/control deletion → STOP & ASK; do not proceed.

## Acceptance criteria (literal — each maps to a flow above)

1. No normal Storybook story shows raw enum/status values (`open`, `in_progress`, `resolved`, `closed`,
   `pending`, `active`, `sold`, `rented`, …) as user-facing labels.
2. Status transition labels are localized in sq/en/uk/it (both arrow sides).
3. Normal locale-specific stories contain no mixed English fallback text unless the story is explicitly
   named a fallback/raw-key stress story.
4. Filter trigger active count matches the selected/active state shown inside the sheet.
5. Available filter options and active filters are visually distinguishable.
6. Mobile interactive controls at 320/375/390 have safe touch-target height (≥44px) and readable label size
   (text never larger than its container).
7. Mobile action groups stack or become full-width where needed; no horizontal overflow.
8. Button/chip/input/select/combobox heights are visually consistent within the same DS surface (`§15`).
9. No horizontal overflow at 320/375/390.
10. Long uk and it labels do not break layout.
11. Existing keyboard/focus/ARIA behavior for Button, Select, Combobox, and sheets/popovers is preserved.
12. Task 354 Combobox/Select viewport-clamp work is not regressed.
13. Task 350 / Task 354 existing valid improvements are preserved.
14. All new/changed user-facing labels exist in all four locale files OR are supplied through complete
    per-locale story fixtures.
15. `check:i18n` passes; `build-storybook` passes.
16. Rendered Storybook QA is marked **PASS only with actual rendered screenshot inspection**; otherwise
    **OWNER QA REQUIRED** must remain (per-cell in the matrix).

## Required validation (run & report the exact command used)

- `git status --short`
- `npm run typecheck` (or `npx tsc --noEmit`) → 0 errors
- `npm run build`
- `npm run lint` → 0 new errors/warnings
- `npm run check:i18n` → parity PASS
- `npm run build-storybook` (bounded smoke build; must exit 0; do NOT leave `storybook dev` running)
- **rg audits (paste results):**
  - raw enum in normal stories/components:
    `rg -n "\b(open|in_progress|resolved|closed|pending|active|inactive|sold|rented|archived)\b\s*(→|->|=>)" src/components -g "*.tsx"`
    and `rg -n "fromStatus:|toStatus:|labelKey:" src/components -g "*.stories.tsx"`
  - mixed-language placeholders in locale-specific stories:
    `rg -n "Search results|Page content area|Available Listings|Browse available properties|New Listing|Listings" src/components -g "*.stories.tsx"`
  - truncate/line-clamp/whitespace-nowrap in touched DS components (justify each retained hit):
    `rg -n "truncate|line-clamp|whitespace-nowrap|text-ellipsis" src/components/admin src/components/layout src/components/ui src/components/shared -g "*.tsx"`
  - touch-target audit on chips/buttons in touched stories:
    `rg -n "size=\"sm\"|size=\"default\"|size=\"lg\"|h-7|h-8|h-9" src/components/layout/FilterBar.stories.tsx src/components/layout/ActionBar.stories.tsx`
- `git diff -- src/app src/modules` → MUST be empty
- `git diff -- <database migration / SQL paths>` → MUST be empty
- `git diff -- package.json package-lock.json` → MUST be empty (no dependency changes are expected or allowed here)

## Required rendered QA matrix (in the final report)

Explicit matrix, PASS / OWNER QA REQUIRED per cell:
- **StatusChangeHistory:** 320 / 375 / 390 / 768 / 1280 × sq / en / uk / it
- **FilterBar / filter sheet:** 320 / 375 / 390 / 768 / 1280 × sq / en / uk / it (plus 0-active / 2-active / many-with-2-active / sheet-open@320 / sheet-open@390)
- **ActionBar / PageHeader action groups:** 320 / 375 / 390 / 768 / 1280 × sq / en / uk / it
- **Button / chip / input rhythm stories:** 320 / 375 / 390 × sq / en / uk / it
- **Combobox / Select trigger + open dropdown:** 320 / 375 / 390 / 480 × sq / en / uk / it

**Do NOT claim rendered PASS unless you actually rendered the story / captured a screenshot. If you only
prepared fixtures/code, mark OWNER QA REQUIRED.**

## Required docs updates

- `docs/design-system.md` — add a canonical **"Mobile Control Touch Target and Stacking Contract"**
  (≥44px; full-width/stacked at 320/375/390; chip ≠ tiny pill; text ≤ container; one-row-one-height with
  inputs/triggers).
- `docs/ui-rules.md` — add **"No raw enum/status labels in UI"** and **"No mixed-language normal Storybook
  stories"**.
- `docs/storybook-governance.md` — add rendered-QA rules: **`build-storybook` is NOT visual approval**;
  rendered PASS requires actual screenshot inspection else OWNER QA REQUIRED.
- `docs/responsive-screenshot-matrix.md` — register the new required DS rendered stories.
- `docs/component-catalog.md` — ONLY if a component behavior contract changed.
- `docs/backlog.md` — Last Session, 2–4 lines.
- NEW session log: `docs/sessions/2026-06-01-task-354-fix-rendered-storybook-mobile-control-localization-ds-contract.md`.

## STOP & ASK conditions

A localized default status map requires new key architecture or editing `src/app`/`src/modules`
consumers · the filter active-vs-available contract genuinely cannot be made unambiguous at the
fixture/chip level and needs a breaking FilterBar API change · the touch-target floor needs a breaking
`button.tsx` API change rather than an additive size/variant · any `src/app`/`src/modules`/DB/SQL change
seems required · a package upgrade seems required · a Storybook-config rewrite seems required · fixing
layout would require deleting an existing control · scope exceeds a primitive/story DS hardening pass.

## Final report required (no git commands from you)

- **Files Changed** table (Path / Change / Rationale).
- **Root cause** list.
- **Before/after behavior** summary.
- Confirmation of **no `src/app` and no `src/modules`** edits.
- Confirmation of **no DB / package** changes.
- Confirmation that existing **Task 354** valid changes were preserved (esp. Combobox/Select clamp).
- Confirmation that **status labels are localized** and no raw enum labels appear in normal UX.
- Confirmation that **filter count/state** is consistent (trigger count = active count shown).
- Confirmation that **mobile controls meet the touch-target/stacking contract**.
- **Validation command results** (exact commands + outcomes).
- **Rendered QA matrix** with PASS / OWNER QA REQUIRED per cell.
- For any primitive runtime edit (`ActionBar`/`PageHeader`/`FilterBar`/`button`): the **proof** that the
  contract belongs in that primitive.
- **No `git add` / `git commit` / `git push`.** End with the Files Changed table; Opus emits commits.
