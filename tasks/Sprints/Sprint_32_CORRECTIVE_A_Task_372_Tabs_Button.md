### Task 372 — CORRECTIVE A: Tabs underline-as-DEFAULT + Button mobile full-width (primitives + ALL consumers)

> **Execution order (Sprint 32 correctives) — A → B → C → D → E → F, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. F is the FINAL certification sweep (run after A–E all land), never a parallel task. **A is FIRST.**

Type:      corrective bugfix — canonical primitives (owner-rejected 360)
Priority:  CRITICAL
Area:      src/components/ui/tabs.tsx · src/components/ui/button.tsx · ALL Tabs/Button consumers + stories

## Owner rejection context
Task 360 ignored two explicit owner requirements: (1) underline tabs must be the **default** style (it was shipped as
opt-in `variant="underline"`); (2) buttons must adapt full-width on `<640px` for **all text buttons** (it was scoped to
only `size="xl"` and `size="tab"`). Owner: "вже вкотре я кажу про адаптацію кнопок… чому ви ігноруєте мої вимоги?".
Do NOT re-narrow. Do NOT make underline opt-in again.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/design-system.md` (§12b mobile contract) · `docs/ui-rules.md`
(§15/§15a) · `docs/component-rules.md` · `docs/qa-rules.md` · `docs/ai-behavior.md` Note 14/19/20 ·
`docs/storybook-governance.md` §8a/§8b · session log `docs/sessions/2026-06-02-task-360-*`.

## Current broken behavior (file evidence)
- `ui/tabs.tsx`: `default: "bg-muted"` pill/fill is the default; `underline` is opt-in only. Active default tab shows a
  filled pill, not an underline.
- 6 consumers stay on the old style: `src/modules/listings/components/ListingsStatusTabs.tsx`,
  `src/modules/cabinet/components/CabinetShell.tsx`, `src/components/admin/AdminPagesManager.tsx`,
  `src/components/admin/AdminFooterManager.tsx`, `src/components/admin/AdminEmailTemplatesManager.tsx`,
  `src/components/admin/AdminCurrencyTabs.tsx` (+ `AdminPageShell.stories.tsx`).
- `ui/button.tsx:28`: only `xl` (and `tab`) carry `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal
  max-sm:break-words`. `default`, `sm`, `lg`, `xs` text sizes do NOT adapt at `<640px`.

## Required after behavior
**Tabs:**
- Underline is the **DEFAULT** Tabs style: active tab marked by a primary-color underline indicator; inactive tabs have
  no filled pill; hover/focus/keyboard arrow-nav intact; Task 359 mobile full-width + `mobileScroll` + `min-h-11` intact.
- The old pill/fill style is removed UNLESS a specific consumer needs it AND the owner explicitly approves an exception
  (if any consumer looks like it needs the pill, STOP and ASK — do not assume).
- ALL 6 consumers audited and rendered with the new default; no consumer silently keeps the pill style.

**Button:**
- EVERY text button is full-width at `<640px` (`max-sm:w-full`), with `max-sm:whitespace-normal max-sm:break-words` so
  long sq/en/uk/it labels wrap and never clip/overflow; `min-h-11` (≥44px touch) preserved.
- Apply via the size cva so `default`, `sm`, `lg`, `xl`, `tab` text sizes all adapt — OR via a documented mechanism that
  covers every text button. Audit `rg "from '@/components/ui/button'"` and the Button stories.
- Icon-only/compact buttons (`icon`, `icon-*`, `xs` if proven icon-only) stay compact — list each exemption explicitly
  with justification. If a button's intent is ambiguous, STOP and ASK.
- No regression to click/disabled/variant behavior.

## Exact files to inspect
`ui/tabs.tsx`, `ui/tabs.stories.tsx`, the 6 Tabs consumers above, `ui/button.tsx`, `ui/button.stories.tsx`, every Button
consumer surfaced by grep.
## Exact files allowed to edit
`ui/tabs.tsx`, `ui/button.tsx`, `ui/tabs.stories.tsx`, `ui/button.stories.tsx`, the 6 Tabs consumers (ONLY to adopt the
new default), **Button consumers/wrappers — ALLOWED to edit when primitive-level `max-sm:w-full` is blocked by a local
layout/className at the call site** (e.g. a wrapper that forces `w-auto`/fixed width / inline-flex parent that defeats
full-width); edit the minimal call site to let the canonical mobile fragment take effect — do NOT restyle unrelated
layout, `docs/design-system.md`, `docs/ui-rules.md`, `docs/backlog.md`, new session log. NO other runtime files.

## Mandatory Button consumer matrix (amendment 4)
Produce a matrix of EVERY Button usage (from `rg "from '@/components/ui/button'"` + raw audit) classified as:
`text` (must be full-width <640) · `icon-only` (stays compact) · `exempted` (full-width would break layout — requires an
explicit documented reason; STOP & ASK if uncertain). Columns: file:line · size · classification · `<640` result ·
evidence. Any `text` button not full-width at <640 without an `exempted` row = INCOMPLETE.

## Current behavior to preserve
Tabs API (`Tabs/TabsList/TabsTrigger`, `mobileScroll`), Button `variant`/`size` values (no removal/rename), all consumer
business logic, keyboard nav, disabled states.

## Positive flow
1. Any default `<Tabs>` → active tab underlined (primary), inactive plain, no pill. 2. Arrow-key nav moves selection +
focus ring. 3. At 320/375/390 tab list full-width / `mobileScroll`. 4. Any text `<Button>` at <640 → full width, label
wraps if long (uk), ≥44px tall. 5. At ≥640 buttons size to content.

## Negative flow
- Consumer that genuinely needs pill style → NOT silently converted; STOP & ASK (no exception without owner approval).
- Icon-only button at <640 → stays compact (NOT full-width); documented exemption.
- Extra-long unbroken uk token in a button → wraps/breaks, never overflows.
- Disabled tab/button → renders correctly, no interaction.
- uk locale active → no English leak; underline + button wrap correct.

## Acceptance criteria (each visible + file-verifiable, with negative branch)
- AC1 Default `TabsList` (no variant prop) renders underline indicator on active tab and NO filled pill — verifiable at
  `ui/tabs.tsx` default cva + visible in `tabs.stories.tsx` Default story at every breakpoint/locale. Negative: inactive
  tab shows no indicator.
- AC2 All 6 consumers render the new default underline (list each with file:line) — no consumer retains pill unless an
  owner-approved exception is documented. Negative: grep shows no leftover `variant="default"`-pill reliance.
- AC3 Every text Button is `w-full` at <640 across `default/sm/lg/xl/tab` — verifiable at `ui/button.tsx` cva + visible
  in `button.stories.tsx` at 320/375/390 in uk. Negative: icon-only sizes are NOT full-width (documented).
- AC4 Long uk button labels wrap, never clip/overflow at any breakpoint — visible in `LocaleStress`/`Long Locale Label`.
- AC5 Keyboard nav, disabled, click behavior unchanged.
- Grep gate: `rg 'variant="default"' ` across Tabs consumers returns only owner-approved exceptions; no text button size
  lacks `max-sm:w-full` without a documented exemption.

## Out of scope
Dialog/FilterBar/Phone/Select (other correctives); new variants; redesigning consumers' layout beyond adopting defaults.

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · grep gates above ·
AC-by-AC self-audit with file:line · Manual QA matrix.

## Manual QA checklist (OWNER QA REQUIRED for rendered cells)
Locales: sq · en · uk · it (each). Breakpoints: 320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 · 1024 · 1200 · 1440
· 1920 · 2560. uk@320/375/390 mandatory stress (not a substitute for all 4 locales). Verify: default tabs underline; all
6 consumers; every text button full-width <640; no clip; icon buttons compact.

## Final report requirements
Before/after per owner requirement; AC-by-AC table with file:line; consumer inventory (before/after style); Button size
exemption list; grep outputs; validation outputs; Files Changed table. NO `git add`/`commit` — orchestrator emits.
