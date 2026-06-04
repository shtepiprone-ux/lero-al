### Task 378 — CORRECTIVE A2: two `variant="line"` Tabs consumers → default primary-underline (owner decision 2026-06-03)

> # 🔴🔴 SUPERSEDED 2026-06-03 — DO NOT EXECUTE STANDALONE. FOLDED INTO TASK 372.
> Owner decision 2026-06-03: this change is now **part of Task 372** (requirement 3 + AC2b). Task 372 removes the
> `variant="line"` prop from `ListingsStatusTabs.tsx` and `AdminCurrencyTabs.tsx` as part of its Tabs work, so a separate
> task would duplicate the same diff and risk divergent reports. **Sonnet must NOT pick up this file as an independent
> task.** It is retained only as the historical record of the conversion spec; the live requirement, ACs, grep gate and
> evidence format all live in `Sprint_32_CORRECTIVE_A_Task_372_Tabs_Button.md`. The commit for these two files is emitted
> by the orchestrator as part of the Task 372 commit batch.
>
> ---
> *(Original spec below, for reference only — now folded into Task 372.)*
>
> **Follow-up to Task 372 (CORRECTIVE A).** Orchestrator diff-review of 372 found two Tabs consumers still on
> `variant="line"` (foreground-color underline), which diverges from the owner-mandated **primary-color underline default**.
> **Owner decision 2026-06-03: convert both to the default primary-underline.** ~~This task is NOT gated by the A→F
> sequence~~ — now folded into Task 372; see the banner above.

Type:      corrective bugfix — close Task 372 AC2 gap
Priority:  HIGH
Area:      `src/modules/listings/components/ListingsStatusTabs.tsx` · `src/components/admin/AdminCurrencyTabs.tsx`

## Why
Task 372 made `underline` (primary-color indicator) the default `TabsList` style. The 4 no-variant consumers adopted it
automatically. But two consumers explicitly pass `variant="line"`, which renders a **foreground-color** underline
(`after:bg-foreground`), NOT the **primary-color** underline (`after:bg-primary`) the owner mandated as the new default.
Owner has decided both must use the default primary-underline.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/sessions/2026-06-03-task-372-tabs-underline-default-button-all-text-sizes.md`
· `src/components/ui/tabs.tsx` (to confirm `line` vs `underline` after-color difference at the CVA).

## Current broken behavior (file evidence)
- `src/modules/listings/components/ListingsStatusTabs.tsx:31` — `<TabsList variant="line">` → active tab shows a
  foreground-color underline, not the primary-color default.
- `src/components/admin/AdminCurrencyTabs.tsx:19` — `<TabsList variant="line" className="w-fit">` → same divergence.

## Required after behavior
- Both consumers render the **default** underline (primary-color indicator) — i.e. remove the `variant="line"` prop so the
  primitive default (`underline`) applies. Do NOT pass `variant="underline"` explicitly and do NOT introduce a new prop —
  removing the prop is the canonical way to inherit the default (matches the other 4 consumers).
- `AdminCurrencyTabs` keeps its existing `className="w-fit"` and all other props/structure untouched.
- `ListingsStatusTabs` keeps `className="listings-status-tabs"` on `<Tabs>` and all other props/structure untouched.
- No other consumer touched. The `line` CVA variant itself is NOT removed (out of scope) — only these two call sites stop
  using it.

## Exact files allowed to edit
`src/modules/listings/components/ListingsStatusTabs.tsx`, `src/components/admin/AdminCurrencyTabs.tsx`,
`docs/backlog.md`, new session log under `docs/sessions/`. NO other runtime files. NO primitive change. NO doc-rule change.

## Current behavior to preserve
Tab values/labels, `value`/`defaultValue`/`onValueChange` wiring, `TabsContent` panels, keyboard nav, all business logic.
ONLY the active-indicator color changes (foreground → primary).

## Positive flow (happy path)
1. Open the listings cabinet (ListingsStatusTabs) → "active"/"closed" tabs; the selected tab shows a **primary-color**
   underline, inactive tab no indicator. 2. Switch tabs → indicator moves, panel content swaps, focus ring intact.
3. Open admin currency screen (AdminCurrencyTabs) → "currencies"/"providers" tabs with primary-color underline; `w-fit`
   width preserved. 4. At 320/375/390 the tab lists keep the Task 359 mobile full-width / min-h-11 behavior.

## Negative flow (every off-happy-path branch)
- Inactive tab → no underline indicator (opacity-0), no leftover foreground-color line.
- Disabled tab (if any) → renders disabled, no interaction, no indicator.
- uk locale active → tab labels localized, no English leak, primary underline correct.
- Narrow viewport (320) → no overflow/clip; AdminCurrencyTabs `w-fit` still does not force horizontal overflow.
- No regression: removing `variant="line"` must not change tab list spacing in a way that clips labels — verify the
  `gap`/padding still reads correctly (both `line` and `underline` CVA branches use `gap-1 bg-transparent`, so spacing is
  identical; confirm visually).

## Acceptance criteria (each file-verifiable, with negative branch)
- AC1 `ListingsStatusTabs.tsx` no longer passes `variant="line"`; renders default underline — verifiable at the edited
  line (prop removed). Negative: inactive tab shows no indicator.
- AC2 `AdminCurrencyTabs.tsx` no longer passes `variant="line"`; `className="w-fit"` retained; renders default underline.
  Negative: `w-fit` preserved, no overflow at 320.
- AC3 Grep gate: `rg 'variant="line"' src` returns NO `<TabsList>` hits (only the CVA definition / stories `underline`
  remain) — paste output. Negative: no other consumer accidentally edited (`git diff --stat` shows exactly the two files +
  docs/session).
- AC4 Keyboard nav, disabled, click, panel-swap unchanged across both consumers.

## Out of scope
Removing the `line` CVA variant; touching the other 4 Tabs consumers; any Button work; any primitive/doc-rule change.

## Required validation
`npx tsc --noEmit` (0 errors) · `npm run lint` (0 new) · `npm run check:i18n` (PASS, no key change expected) ·
`npm run build-storybook` (✅) · the AC3 grep gate (paste output) · AC-by-AC self-audit with file:line · runtime QA at
uk 320px on both surfaces.

## Final report requirements
Before/after per consumer (line→default); AC-by-AC table with file:line; grep output; `git diff --stat`; validation
outputs; Files Changed table. NO `git add`/`commit` — orchestrator emits after diff review.
