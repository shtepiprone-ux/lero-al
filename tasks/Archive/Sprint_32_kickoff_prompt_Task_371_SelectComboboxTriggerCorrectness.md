### Task 371 — Select & Combobox trigger correctness: value→label display + left-align consistency

> **Status: READY (priority: high — owner rendered-QA in real stories, 2026-06-03).** Primitive-level fix with
> cross-consumer impact. **You are Sonnet 4.6 executor.** Do NOT change scope. Do NOT alter `variant`/`size` APIs or
> remove props. If a fix would change a public API or a consumer's behavior, STOP and ASK first (Note 14 — every
> consumer must keep working). Single-writer git: no `git add`/`commit`; end with a "Files Changed" table.

```
Type:     bugfix (canonical UI primitives — display correctness + alignment)
Priority: high
Area:     src/components/ui/select.tsx · src/components/shared/Combobox.tsx · all Select/Combobox consumers
```

## Pre-read (mandatory)
1. `docs/agent-contract.md`
2. `docs/backlog.md`
3. `docs/rule-index.md` → **UI / layout** bundle: `docs/design-system.md`, `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
4. `docs/ai-behavior.md` → **Note 14 (global-change rule)** — these are shared primitives; audit and verify EVERY consumer.
5. `docs/component-governance.md` (canonical component single-source) + `docs/storybook-governance.md` §8a.
6. Task 364 session log (settlement capitalization context).

## Defect 1 — Select trigger shows raw `value`, not the selected option's label
**Owner QA (real stories, not Docs):**
- `Select` "Long Label Locale Stress": trigger shows `in_progress` (raw value) while the dropdown shows the localized
  label "В обробці — …".
- `Select` "Default": trigger shows `tirana` (lowercase value) while the item is "Tirana".
**Root cause:** `src/components/ui/select.tsx` `SelectValue` renders `<SelectPrimitive.Value/>` with no value→label
resolution. Base-UI `Select.Value` then displays the raw `value`. So every consumer that relies on `<SelectValue/>` to
show the selection sees the untranslated, un-capitalized value.
**Fix:** make the canonical `Select` resolve and display the **selected option's label** (Base-UI pattern: pass `items`
to `Select.Root`, or a render function on `Select.Value` — choose ONE canonical approach and document it in
design-system.md/ui-rules.md). The trigger must show the human label (localized + capitalized as authored), never the
raw `value`. Placeholder behavior (when nothing selected) unchanged.
**Note 14 — audit ALL `Select` consumers** (`rg "from '@/components/ui/select'"` / `<SelectValue`): every one must still
show the correct label after the change. If a consumer used `SelectValue` differently, fix it consistently — do NOT
leave diverging call sites.

## Defect 2 — Combobox button-variant trigger text appears centered in some instances
**Owner QA (real stories, not Docs):** `StatusChangeControl` select variant (which renders `<Combobox variant="button" size="sm">`)
shows the selected label ("New") **centered**; the owner reports some select/combobox triggers are centered while others
are left-aligned — inconsistent.
**Investigation required:** the canonical `Combobox` button trigger span is `flex-1 min-w-0 truncate` (reads as
left-aligned), yet it renders centered in `StatusChangeControl` and the `Combobox` stories. **Reproduce in the running
Storybook**, find the actual cause (CSS cascade, a centering class, a wrapper, a flex quirk, or a `size="sm"` path), and
fix it so the selected label/placeholder is **left-aligned** in ALL Combobox button-variant instances.
**Consistency goal:** every Select and Combobox trigger across the app reads left-aligned (label left, chevron right) —
no centered trigger text anywhere. Audit and unify (Note 14).
**Files:** `src/components/shared/Combobox.tsx` (+ any consumer that overrides alignment); verify `StatusChangeControl`
select variant + `Combobox` stories ("Button Variant", "Long Label Locale Stress") + `LocationCombobox`.

## Current behavior to preserve
- `Select`/`Combobox` `variant` + `size` APIs unchanged; no prop removed/renamed.
- Dropdown item rendering, search (Combobox input variant), keyboard nav, disabled, portal, mobile full-width (Task 359),
  `LocationCombobox` capitalize + bi-directional search (Task 364), `StatusChangeControl` select/workflow variants — all preserved.

## Positive flow
1. Select with a chosen value → trigger shows the localized, capitalized **label** (e.g. "В обробці…", "Tirana"), not the raw value.
2. Locale switch (uk) → Select trigger label updates to the localized string.
3. Combobox button trigger (StatusChangeControl, LocationCombobox) → selected label is **left-aligned**, chevron right.
4. All select/combobox triggers read consistently left-aligned at every breakpoint.

## Negative flow
- Select with nothing selected → placeholder shown (muted), left-aligned, not raw value.
- Long label (uk) → truncates/wraps per the canonical fragment, never overflows; still left-aligned.
- Disabled select/combobox → renders correctly, no interaction.
- A consumer that passed a custom `SelectValue` child → still works (audit; STOP&ASK if ambiguous).
- Combobox input variant (search) → unchanged (this fix targets button-variant alignment + Select value display).

## Acceptance criteria
- AC1 `Select` trigger displays the selected option's label (localized + capitalized), never the raw value — verifiable at `select.tsx`:line + `Select` stories ("Default", "Long Label Locale Stress").
- AC2 Every `Select` consumer audited and still shows correct labels (Note 14) — list them in the log.
- AC3 Combobox button-variant trigger text left-aligned in ALL instances (StatusChangeControl, LocationCombobox, Combobox stories) — root cause documented + fixed at `Combobox.tsx`:line.
- AC4 No centered select/combobox trigger text anywhere; APIs unchanged; no consumer regressed.
- AC5 design-system.md + ui-rules.md document the canonical Select label-resolution + trigger left-align rule.
- Positive + Negative flow parity in the diff; 0 new lint/tsc; `build-storybook` passes; `check:i18n` PASS; Note 18 self-validation + Files Changed table.
- Rendered cells = OWNER QA REQUIRED (§8a).

## Out of scope
- The four fixes in Task 369 (FilterBar/PhoneField/AdminTable/locale-pin).
- RecentlyViewedSection parity (Task 370).
- Adding new variants/sizes; redesigning the dropdown; settlement multilingual schema (Task 368).
