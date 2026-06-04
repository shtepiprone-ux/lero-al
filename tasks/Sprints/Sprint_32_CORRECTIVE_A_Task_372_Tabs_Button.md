### Task 372 — CORRECTIVE A: Tabs underline-as-DEFAULT + Button mobile full-width (primitives + ALL consumers)

> # 🔴 OWNER-REJECTED v1 (2026-06-03) — HARD RE-DO v2 REQUIRED. Owner: "задачу 372 я не приймаю, що задача, що
> виконання — все дуже низької якості." The v1 pass proved nothing on <640 (screenshots were ≥640 only) and audited only
> ~10 of ~350 Button call sites. This block SUPERSEDES the soft parts of v1. Read `docs/agent-contract.md` clauses 11–12 FIRST.
>
> ## 🔴 Hard requirements added in v2
> 1. **EVERY text Button is full-width at <640** (`max-sm:w-full`, `min-h-11` ≥44px, `whitespace-normal break-words`) —
>    via the size cva (single source). Icon-only/compact = the ONLY exemptions, each listed with justification.
> 2. **COMPLETE Button consumer matrix — SINGLE OWNER = TASK 372. Do it HERE, in full, not deferred.** This task is the
>    SOLE owner of the complete Button consumer matrix (owner decision 2026-06-03 — resolves the 372↔377 ownership
>    conflict). Audit EVERY usage from `rg "from '@/components/ui/button'"` (import sites) AND `rg '<Button'` (~350 JSX
>    usages — recount at execution). Columns: file:line · size · classification (text / icon-only / exempted) · `<640`
>    result · evidence. Pay special attention to call sites whose local className can DEFEAT `max-sm:w-full` (`w-auto`,
>    `w-fit`, `w-[...]`, `sm:w-*` leaking <640, `min-w-[...]`, `flex-1`, inline-flex parent) — for each such text button,
>    prove it is actually full-width at <640 in the rendered app; minimal call-site edits to unblock the fragment are
>    ALLOWED HERE (nothing else). Any text button not full-width at <640 without an `exempted` row = INCOMPLETE.
>    **Task 377 does NOT re-build this matrix and has NO runtime-edit carve-out — it only RE-CERTIFIES 372's matrix
>    (re-runs the grep + rendered spot-checks). The complete matrix and every call-site fix live HERE in 372.**
> 3. **Tabs underline is the default** (v1 did this correctly — keep) AND **the two `variant="line"` consumers are
>    converted to the default primary-underline HERE — Task 378 is now FOLDED INTO this task (owner decision
>    2026-06-03) and is SUPERSEDED.** Concretely: in `src/modules/listings/components/ListingsStatusTabs.tsx` and
>    `src/components/admin/AdminCurrencyTabs.tsx`, REMOVE the `variant="line"` prop so the primitive default (`underline`,
>    primary-color `after:bg-primary`) applies — do NOT pass `variant="underline"` explicitly, do NOT add a new prop
>    (removing the prop is the canonical inherit, matching the other 4 consumers). `AdminCurrencyTabs` keeps its
>    `className="w-fit"`; `ListingsStatusTabs` keeps `className="listings-status-tabs"`. The `line` CVA variant itself is
>    NOT removed (out of scope) — only these two call sites stop using it. This is folded into AC2 below. Grep gate:
>    `rg 'variant="line"' src` returns NO `<TabsList>` hits (only the CVA definition / stories `underline` remain).
> 4. **🔴 Rendered verification matrix (clause 12) — REQUIRED to close.** rows = 320·375·390·480·560·680·768·810·960·1024·
>    1200·1440·1920·2560, columns = sq·en·uk·it. <640 cells confirm: every text Button full-width · label wraps · ≥44px ·
>    no clip/overflow. ≥640 cells confirm content-width. uk@320/375/390 MANDATORY stress cells with screenshots/notes.
>    The `Long Locale Label` + `All Sizes` + `Mobile Safe` stories MUST be checked at uk@320/375/390. ⛔ tsc=0/build=✅
>    does NOT close this task — only the rendered matrix + complete consumer matrix do.



> **Execution order (Sprint 32 correctives) — REVISED 2026-06-03 (owner): `372 (incl. folded 378) → 373 → 379 → 374 → 375 → 376 → 377`, strictly sequential.** (379 runs BEFORE 374 because it changes Select/Combobox/Popover/Dropdown primitives that 376/377 later certify.) Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. **377 is the FINAL certification sweep** (runs only after 372–376 AND 379 all land), never a parallel task. **372 is FIRST, and now ABSORBS Task 378 (the two `variant="line"` consumers) — see requirement 3 below.**

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

**`size="xs"` is NOT automatically exempt (clarification 2026-06-03).** Any `xs` Button with VISIBLE TEXT must be
classified as `text` (full-width <640) or `exempted` with a rendered reason — it does NOT get a compact pass merely for
being `xs`. Only an `xs` Button that is genuinely icon-only may stay compact. The matrix must show each `xs` call site's
classification and `<640` result individually.

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
- AC2b (folded Task 378) `ListingsStatusTabs.tsx` and `AdminCurrencyTabs.tsx` no longer pass `variant="line"`; both render
  the primary-color underline default; `AdminCurrencyTabs` `w-fit` and `ListingsStatusTabs` `listings-status-tabs` class
  retained. Grep gate: `rg 'variant="line"' src` returns NO `<TabsList>` hits. Negative: inactive tab shows no indicator;
  no overflow at 320; no other consumer edited.
- AC3 Every text Button is `w-full` at <640 across `default/sm/lg/xl/tab` — AND any `xs` Button carrying visible text
  (xs is NOT auto-exempt; see the consumer-matrix clause) — verifiable at `ui/button.tsx` cva + visible in
  `button.stories.tsx` at 320/375/390 in uk. Negative: only genuinely icon-only buttons (any size, incl. icon-only `xs`)
  are NOT full-width, each documented.
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

## Required Sonnet evidence format (MANDATORY — applies to this and every Sprint 32 corrective)
Sonnet must NOT mark any rendered/manual QA cell PASS unless Sonnet PERSONALLY rendered or inspected that cell.
"OWNER QA REQUIRED" means the owner MAY ADDITIONALLY audit — it does NOT replace Sonnet's own evidence. A cell that was
not checked = `NOT CHECKED`, and the task is then INCOMPLETE. `tsc`/`lint`/`build-storybook` are baseline checks only;
they do NOT replace rendered/manual verification, and "it compiles" never counts as PASS.
The final report MUST include:
1. **AC self-audit table** — AC# · requirement · implementation evidence (file:line) · verification evidence (command
   output / rendered matrix cell / grep output / test result) · status `PASS` / `FAIL` / `NOT CHECKED`.
2. **Command transcript** — for each required command: exact command · exit code · short result. If a command was not
   run, state the explicit reason. "Not run" NEVER counts as PASS.
3. **Grep gates** — paste the exact grep command and its RAW output; write `(no output)` if empty; for any false
   positives, provide a triage table separating real hits from documentation/comment/string mentions.
4. **Rendered evidence matrix** (whenever UI is involved) — per surface/story: locale (sq/en/uk/it) · viewport
   (320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560) · interaction performed · expected result · observed
   result · evidence reference (screenshot path / story URL / exact written observation) · status `PASS`/`FAIL`/`NOT
   CHECKED`. **uk@320/375/390 are mandatory cells.**
5. **Tests** — test file · cases added/updated · command run · pass/fail · failure output if any.
6. **STOP&ASK log** — every ambiguity found · whether work stopped · what was left unchanged because it was out of scope.
A task is INCOMPLETE if any required AC or any required rendered cell is marked `NOT CHECKED`.

## Final report requirements
Before/after per owner requirement; AC-by-AC table with file:line; consumer inventory (before/after style); Button size
exemption list; grep outputs; validation outputs; Files Changed table. NO `git add`/`commit` — orchestrator emits.
