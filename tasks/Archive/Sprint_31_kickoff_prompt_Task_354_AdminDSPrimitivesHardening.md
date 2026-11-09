# Sprint 31 — Task 354 kickoff (Sonnet) — Admin DS primitives: overflow, row-actions & Storybook i18n hardening (NO route migration)

> **Status: READY (owner priority #1 of the 2026-06-01 batch).** This is a **narrow corrective
> hardening pass** on admin/design-system primitives (AdminTable, AdminCardList, StatusChangeControl,
> StatusChangeHistory, Combobox/Select) and their Storybook stories. It is **distinct from Task 350**
> (which hardened the Tier-2 LAYOUT primitives PageShell/Section/PageHeader/ActionBar/FilterBar).
> Task 350 layout primitive runtime files are **FROZEN** for this task.
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. Do NOT expand into admin route migration. Do NOT unfreeze Sprint 28.
> If anything is ambiguous or a required decision is missing, **STOP and ASK the orchestrator** — do not
> improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End your session
> with a "Files Changed" table only; the ORCHESTRATOR (Opus) reads the real diff and emits commit
> commands during review. (agent-contract clause 10.)

```
Type:     corrective / design-system hardening (NO new primitives, NO route migration)
Priority: CRITICAL (owner first-priority)
Area:     Admin responsive primitives / Storybook / i18n / overflow UX
Phase:    admin-primitive corrective slice (sits beside the DS foundation queue; does NOT touch
          Task 350 layout primitives — see docs/sessions/2026-06-01-task-350-ds5-storybook-proof-hardening.md)

Area (ALLOWED to touch):
  src/components/admin/AdminTable.tsx               (primitive — small prop-level addition only IF needed for accessible row actions)
  src/components/admin/AdminTable.stories.tsx       (UPDATE — real localized / long-string stress fixtures; no raw "...")
  src/components/admin/AdminCardList.tsx            (mobile card layout: min-w-0, labeled/grouped fields, safe wrap)
  src/components/admin/AdminCardList.stories.tsx    (UPDATE)
  src/components/admin/StatusChangeControl.tsx      (overflow containment, max-width/wrap; PRESERVE transition logic)
  src/components/admin/StatusChangeControl.stories.tsx (UPDATE — human-readable labels, not raw keys; see root cause below)
  src/components/admin/StatusChangeHistory.tsx      (wrap/align at 320 if affected; PRESERVE rendering semantics)
  src/components/admin/StatusChangeHistory.stories.tsx (UPDATE)
  src/components/shared/Combobox.tsx                (option/trigger wrap + viewport-bounded popover — ONLY if responsible for clipping)
  src/components/ui/select.tsx                      (same — ONLY if responsible)
  messages/sq.json · messages/en.json · messages/uk.json · messages/it.json (ONLY if raw keys are caused by genuinely missing real translations — add to ALL FOUR, keep parity)
  docs/component-catalog.md          (UPDATE if component canonical behavior changes)
  docs/admin-ux-rules.md             (UPDATE if this establishes the canonical mobile row-action / card / no-overflow contract)
  docs/ui-rules.md OR docs/component-governance.md (UPDATE if a global no-raw-ellipsis / no-overflow primitive rule is codified)
  docs/responsive-screenshot-matrix.md (UPDATE if new/renamed Storybook regression targets are registered)
  docs/backlog.md                    (UPDATE — Last Session block, 2–4 lines)
  docs/sessions/2026-06-01-task-354-admin-ds-overflow-row-actions-hardening.md (NEW — session log + Files Changed table + owner evidence summary + QA matrix)

Area (FORBIDDEN to EDIT/WRITE — STOP & ASK if any seems required):
  src/components/layout/PageShell.tsx · Section.tsx · PageHeader.tsx · ActionBar.tsx · FilterBar.tsx  (Task 350 layout primitive RUNTIME — FROZEN)
  src/app/**  ·  src/modules/**   (forbidden to EDIT. READING / `rg`-searching them is allowed ONLY where the
                                   validation/audit commands require proving no route/module diff — e.g.
                                   `git diff -- src/app src/modules` must come back EMPTY. No write, ever.)
  database migrations · SQL scripts · Supabase / RLS / auth logic
  unrelated primitive rewrites · package dependency upgrades
  Storybook major config rewrites · visual-regression service setup (Chromatic/Percy)
  .storybook/preview.tsx preset list / locale toolbar (PRESERVE Task 350 viewport presets + locale toolbar)
```

## Role contract

You are **Sonnet 4.6, the executor**. You harden admin/design-system primitives so Storybook stops showing
broken UX (raw `...` as a fake action, raw i18n keys as visible copy, content escaping card bounds on narrow
widths, merged role/email lines, mis-clipped Ukrainian text). You do **not** migrate or redesign any admin
route, do **not** touch Task 350 layout primitive runtime files, do **not** touch DB/RLS/auth, and do **not**
run git. Outside-allowlist = scope violation = STOP & ASK. Opus reviews the real diff and emits git commands.

## Confirmed root cause (verified by orchestrator audit, 2026-06-01)

`src/components/admin/StatusChangeControl.stories.tsx` (≈ lines 87–99) passes **raw i18n keys as labels**:
`{ code: 'open', labelKey: 'support_status_open', ... }`, `support_status_in_progress`, `support_status_resolved`,
`support_status_closed`, etc. If the Storybook story/provider does not resolve these through the real translation
function with messages loaded, the raw key string renders as user-facing copy. **Decide the fix per the
STOP & ASK rule below:** prefer making stories pass real localized / human-readable fixtures (or wiring the real
`t()` + provider/messages) over leaking keys. Only add keys to `messages/*.json` if the raw key appears because a
**real, missing** translation key is referenced in production/app code — and then add it to **all four** locales
with parity.

## Pre-read (load ONLY these — per `docs/rule-index.md`: "Admin table / admin control" + "Storybook / visual snapshot")

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required (admin control):** `docs/design-system.md` (esp. §3 the 14-width × 4-locale canon; §9 admin layout, §10
`tableAt`), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md` (canonical `AdminTableRow`
§11), `docs/domain-rules.md`, `docs/rls-rules.md`, `docs/qa-rules.md`, `docs/ai-behavior.md` → Note 22 "Admin Table
Preservation Rule".
**Required (Storybook):** `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`.
**Only if relevant:** `docs/admin-ux-rules.md`, `docs/responsive-screenshot-matrix.md`, `docs/component-catalog.md`,
`docs/governance-checklists.md`, `package.json`, `.storybook/preview.tsx`, `.storybook/main.ts`.
**Then inspect** the ALLOWED-to-touch component + story files above before editing. Discover exact line-level
usages with the search commands below.

## Owner evidence to address (from screenshots)

1. **AdminTable → mobile 320 scroll affordance:** raw `...` appears as text beside status badges; Role + email
   visually merge; mobile card does not clearly present Name / State / Role / Email / Phone / Location.
2. **AdminTable → Ukrainian long strings:** listing text cut as `Оголошення про продаж...`; truncation
   unbalanced / too early; no way to access full text; ellipsis substitutes for a real responsive text contract.
3. **AdminTable → responsive switch mobile/tablet/desktop:** raw `...` appears in different positions across
   320 / 390 / 1024; desktop/tablet action column looks like random trailing punctuation; switch behavior does
   not define where actions live.
4. **StatusChangeControl → select / workflow states:** raw keys `support_status_*` / `admin.common.status_control.*`
   appear in visible UI; labels clipped; at 320/360/390/412 some controls overflow outside the card; options/rows
   need a consistent wrapping + max-width rule.
5. **Combobox / Select Ukrainian locale:** dropdown/option/trigger text clipped; long labels don't wrap/fit
   within popover/trigger; technical keys must not leak into normal UX stories.

## AdminTable preservation inventory (MANDATORY — do BEFORE editing; `ai-behavior.md` Note 22)

Before touching AdminTable / AdminCardList, record a before/after inventory in the session log of every existing
behavior, and confirm each remains reachable after your change (unless the owner explicitly authorised removal):
columns (count + content) · row click behavior (navigation/selection) · row actions · inline controls (toggles,
status switchers, badges-as-controls) · filters · search · pagination · sort (header sort + URL state) · empty
state · loading state · mobile/card layout. **Every existing admin action must remain reachable after the change.**
Silent removal of any of these is a P0 regression → STOP & ASK (or, if discovered mid-task, document and route back).
This is a story/primitive hardening pass — none of these behaviors should change; the inventory proves it.

## Required scope (literal)

1. **Audit** — run and report findings from:
   - `rg "\"\.\.\.\"|>\.\.\.<|\.\.\." src/components src/modules .storybook -g "*.tsx" -g "*.ts"`
   - `rg "admin\.common\.status_control|support_status_|listing_status_|role_" src/components src/modules messages -g "*.tsx" -g "*.ts" -g "*.json"`
   - `rg "truncate|line-clamp|whitespace-nowrap|overflow-hidden|text-ellipsis|min-w-0|max-w" src/components/admin src/components/ui src/components/shared -g "*.tsx"`
   - `rg "AdminTable|AdminCardList|StatusChangeControl|StatusChangeHistory|Combobox|Select" src/components -g "*.tsx"`
2. **AdminTable row actions** — remove raw textual `...` from normal row/cell/card rendering. If row actions
   exist, render a canonical accessible affordance (existing Button/icon/menu primitive) with a localized
   `aria-label` ("Дії"/"Actions"/equivalent existing key). If they don't exist, render nothing. **Do not invent
   a new action-menu system if one already exists. If a dropdown-menu primitive is required but absent → STOP & ASK.**
3. **AdminTable / AdminCardList mobile cards** — intentionally designed cards, not squeezed columns; clear
   label/value pairs or visual grouping; every row/card uses `min-w-0` + safe wrapping; email/long names/locations/
   listing titles/roles/status must not merge into one ambiguous line; stable action affordance (top-right icon
   button OR footer action row OR explicit text button). **320px is the hard gate.**
4. **Long-text / ellipsis policy** — default = wrap user-facing/admin text. Avoid `truncate` for names/titles/
   status labels unless there is a documented accessible full-text fallback (`title`/`aria-label`/tooltip or an
   accepted existing pattern). Where desktop-cell truncation is unavoidable: balanced width, full text accessible,
   no too-early clip from missing `min-w-0`/flex, no arbitrary mid-card clipping.
5. **Combobox / Select** — options don't clip raw text; option rows wrap for long labels; trigger selected value
   doesn't overflow; popover/dropdown respects viewport width (no horizontal overflow at 320/360/375/390/412/480;
   max-width viewport-bounded; long words break safely in stress stories). **Do not break keyboard nav, focus,
   selected state, or aria semantics.** Only touch these files if they are genuinely responsible for the clipping.
6. **StatusChangeControl** — normal stories show human-readable localized labels, not raw keys (see root cause).
   Select & workflow variants stay within card bounds at all narrow widths; note/history/buttons/status rows/option
   buttons must not overflow; disabled/loading/error states remain correct. **PRESERVE status-transition logic.**
7. **StatusChangeHistory** (if affected) — rows wrap/align at 320; actor / prev→new status / note / date don't
   force horizontal overflow; dates align right only when width allows else stack/wrap; no raw keys in normal stories.
8. **Storybook story cleanup** — real QA fixtures: realistic localized labels, explicit long-string stress cases,
   no accidental raw keys, no placeholder `...` as normal UI. A retained raw-key stress story must be explicitly
   named `RawKeyStress` and not be the default. Add/adjust regression stories for: AdminTable mobile 320 card;
   AdminTable Ukrainian long strings; AdminTable responsive switch; StatusChangeControl select basic; workflow
   ticket statuses; workflow with required note; StatusChangeControl mobile 320; Combobox/Select Ukrainian long
   labels. **Do not bloat with duplicates.**
9. **Docs** — update only what is needed (see allowlist) + backlog Last Session + the NEW session log.

## Current behavior to PRESERVE

Task 350 committed & not reopened; PageShell/Section/PageHeader/ActionBar/FilterBar runtime unchanged; existing
AdminTable API (except a small additive prop for accessible row actions); StatusChangeControl transition logic;
StatusChangeHistory semantics; Button/Badge/Combobox/Select canonical roles; admin route behavior; Task 350
Storybook viewport presets; Storybook locale toolbar; messages key parity; lint/build/i18n baselines.

## Localization coverage

Locales **sq / en / uk / it** (Ukrainian = primary stress locale, longest labels). No normal story exposes raw
keys as user-facing labels. New labels → add to all four files with parity; existing keys → reuse. `check:i18n`
must pass. Do not fix only English or only Ukrainian.

## Responsive coverage — the 14 canonical DS widths (`docs/design-system.md` §3)

320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 · 1024 · 1200 · 1440 · 1920 · 2560.
**Also explicitly inspect the owner-reported failure widths 360 and 412.**

Minimum Storybook/manual QA matrix:
- AdminTable: 320 / 390 / 560 / 768 / 1024 / 1200 × sq/en/uk/it
- StatusChangeControl: 320 / 360 / 390 / 412 / 480 / 560 / 768 / 1024 × sq/en/uk/it
- Combobox/Select long labels: 320 / 360 / 390 / 412 / 480 / 560 × sq/en/uk/it
- StatusChangeHistory: 320 / 390 / 480 / 768 / 1024 × sq/en/uk/it

## Positive flow (happy path) — required (Task 255 rule)

**Actor:** owner/designer doing Storybook design-system QA. **Preconditions:** Storybook built; Task 350 viewport
presets + locale toolbar intact; messages sq/en/uk/it loaded.

1. Owner opens the AdminTable mobile (320) and desktop stories → row actions are EITHER absent (when no actions
   exist) OR a clear accessible action control (icon button/menu with localized `aria-label`); no raw `...`.
2. Owner opens AdminTable Ukrainian long-string stories → text wraps, or truncates only with a documented full-text
   fallback (`title`/`aria-label`/tooltip); never randomly cut; role+email never merge into one line.
3. Owner opens StatusChangeControl select / workflow / required-note / mobile-320 stories → labels are
   human-readable & localized; status rows/options/buttons/note/history stay inside the card at 320/360/390/412/480.
4. Owner opens Combobox/Select Ukrainian long-label stories → option + trigger text fits/wraps within bounds;
   dropdown stays inside the viewport (no horizontal overflow) at 320/360/375/390/412/480.
5. Owner opens StatusChangeHistory mobile stories → actor / prev→new status / note / date wrap & align at 320.
6. Owner toggles sq/en/uk/it and steps across all 14 widths (+360/+412) → stable layout, no raw keys, no overflow.

**Post-conditions:** updated/added regression stories exist for every owner-evidence case; `check:i18n` parity
holds; `tsc`/`build`/`lint` clean; Storybook starts; no Task 350 layout primitive runtime file changed; no
`src/app` / `src/modules` diff.

## Negative flow (every off-happy-path branch) — required (Task 255 rule)

- **No real row actions exist for a table** → render NOTHING in the action slot (never `...`, never placeholder text).
- **Action control present** → must expose accessible text/`aria-label`; keyboard focus + activation work; not a bare `<div>`.
- **Very long Ukrainian/Albanian/Italian label** → wraps; if truncation is intentional, full text reachable via
  `title`/`aria-label`/tooltip; no mid-card arbitrary clip from a missing `min-w-0`.
- **Missing/raw i18n key in a normal story** → must NOT render the raw key as user copy; fixed by passing real
  localized/human-readable fixtures (or wiring real `t()`+messages). A retained raw-key story must be named
  `RawKeyStress` and never be the default. Only add keys to `messages/*.json` if a REAL missing key is referenced in
  production code → add to all four locales with parity.
- **Narrow viewport 320/360/390/412/480** → no component content escapes its card/container; no dropdown/popover
  creates horizontal page overflow; popover max-width is viewport-bounded; long unbroken strings break safely.
- **Disabled / loading / error StatusChangeControl state** → remains visually correct, keeps focus visibility + aria.
- **Combobox/Select interaction** → keyboard navigation, focus states, selected state, and aria semantics are NOT
  broken by any wrapping/max-width change.
- **Desktop regression risk** → fixing mobile cards must NOT break desktop/tablet table behavior.
- **Scope-escape** → if a fix appears to need `src/app`/`src/modules`/DB/Task-350-primitive/new-menu-primitive/
  package-upgrade → STOP & ASK; do not proceed.

## Acceptance criteria (literal — each maps to Positive or Negative flow above)

- AdminTable no longer renders raw `...` as normal UI. *(Negative: no-real-action → render nothing)*
- AdminTable mobile cards have readable labeled / clearly grouped fields; role+email do not merge.
- AdminTable desktop/tablet action affordance is stable and accessible (or absent when no actions exist).
- AdminTable Ukrainian long strings do not produce broken mid-card clipping; full text reachable when truncated.
- StatusChangeControl normal stories no longer show raw `admin.common.status_control.*` / `support_status_*` keys.
- StatusChangeControl select/workflow variants do not overflow their card at 320/360/390/412/480.
- Combobox/Select option text wraps or fits within bounds at mobile widths; no popover horizontal overflow.
- StatusChangeHistory remains readable on mobile if touched.
- All changes covered by Storybook stories; all four locales covered; all 14 widths + 360/412 considered.
- No Task 350 layout primitive runtime change; no route adoption; no DB change; no package upgrade; no key-parity drift.
- `tsc` passes; `build` passes; `lint` reports 0 new errors/warnings; `check:i18n` passes; Storybook starts.
- Session log includes owner-evidence summary, root causes, Files Changed table, validation results, remaining owner QA notes.

## Out of scope

Admin route migration; unfreezing Sprint 28; Task 350 primitive changes; new dropdown/menu system (unless STOP & ASK
approved); production data-contract changes; DB/SQL/RLS/auth; package upgrades; Chromatic/Percy setup; redesigning
admin tables wholesale.

## Required validation commands (run & report exact command used)

- `git status --short`
- `git diff -- src/components/layout/PageShell.tsx src/components/layout/Section.tsx src/components/layout/PageHeader.tsx src/components/layout/ActionBar.tsx src/components/layout/FilterBar.tsx` (must be empty)
- `git diff -- src/app src/modules` (must be empty)
- the **four** `rg` audit commands above (`...` literal · status-control/raw-key · truncate/overflow utility · component names)
- `npm run typecheck` · `npm run build` · `npm run lint` · `npm run check:i18n`
- **Storybook validation:** prefer `npm run build-storybook` (or `npm run governance:storybook` — `storybook build --quiet`) as a **bounded smoke build** that must exit 0. Do NOT leave `storybook dev` running. Rendered visual PASS may only be claimed if you actually captured screenshots; otherwise mark **OWNER QA REQUIRED**.

## Storybook QA report required

Compact matrix with PASS / FAIL / OWNER QA REQUIRED for the four component matrices above × sq/en/uk/it.
**Do not claim rendered visual PASS unless you actually rendered the story or captured a screenshot. If you only
prepared fixtures/code, mark OWNER QA REQUIRED.**

## STOP & ASK conditions

Fixing row actions needs a new dropdown/menu primitive · raw keys are caused by missing Storybook locale-provider
architecture affecting all stories · Combobox/Select overflow fix needs a breaking API change · AdminTable mobile
card fix needs a production data-contract change · any `src/app` or `src/modules` file seems required · any DB/SQL
change seems required · any Task 350 layout primitive runtime file seems required · a package upgrade seems
required · scope exceeds a narrow primitive/story hardening pass.

## Final report required (no git commands from you)

Short summary · root-cause list · Files Changed table (Path / Change / Rationale) · confirmation raw `...` gone
from normal AdminTable UI · confirmation raw status-control keys gone from normal stories · confirmation
Combobox/Select/StatusChangeControl no longer overflow in targeted stories · confirmation all four locales
considered · confirmation all required widths considered · confirmation Task 350 layout primitive runtime files
unchanged · confirmation no route adoption · validation results · remaining owner QA notes.
