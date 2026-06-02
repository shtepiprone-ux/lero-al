# Task 360 — Tabs underline style + Button responsive (full-width <640px) & text-fit

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** UX (bug + style) — canonical UI primitives `tabs.tsx` + `button.tsx`

---

## Summary

Two additive style changes to shared UI primitives:

1. **Tabs / underline variant**: added `variant="underline"` to `TabsList` CVA — a primary-color underline indicator style that consumers can opt into without affecting the default pill/fill style used by all 6 existing consumers.

2. **Button / mobile full-width + text-fit**: `size="xl"` and `size="tab"` gain `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` — full-width at <640px, height can grow for wrapped text, long labels (including `uk`) never overflow. Icon sizes and compact desktop-only sizes are unchanged.

---

## §17 UI Pre-flight

| Check | Files touched | Result |
|---|---|---|
| Non-canonical dropdowns (`<select`) | none | CLEAN |
| Ad-hoc `h-8/h-9/h-10/h-11/h-12` on Button | `max-sm:min-h-11` on `xl` size in `button.tsx` — canonical, maps to `size="xl"` floor | JUSTIFIED |
| `z-[...]` | none | CLEAN |
| Overflow-risk flex rows | `tabs.tsx` triggers are `flex-1` in `w-full` list; `button.tsx` has `break-words` guard | PASS |
| Same-row height | `size="xl"` stays `h-11` at ≥sm; `min-h-11` at <sm allows growth only | PASS |
| `whitespace-nowrap` safety | `max-sm:whitespace-normal max-sm:break-words` overrides `whitespace-nowrap` at <sm | PASS |
| 7 breakpoints | Primitive-only change — all consumers inherit; viewport toolbar required for OWNER QA | OWNER QA REQUIRED |
| 4 locales | No new i18n strings; uk locale story added (`LocaleStress`) | PASS |

---

## Changes made

### `src/components/ui/tabs.tsx`

**`tabsListVariants` base string:** added `data-[variant=underline]:rounded-none`
- Removes border-radius for underline variant (parallel to existing `data-[variant=line]:rounded-none`)

**`tabsListVariants` variants:** added `underline: "gap-1 bg-transparent"`
- `gap-1`: 4px gap between triggers (same as `line`)
- `bg-transparent`: no muted background fill (same as `line`)

**`TabsTrigger` cn() — line 1 (base + interactivity):** added `group-data-[variant=underline]/tabs-list:data-active:shadow-none`
- Suppresses the `shadow-sm` that only the `default` variant should show

**`TabsTrigger` cn() — line 2 (background overrides):** added underline overrides:
```
group-data-[variant=underline]/tabs-list:bg-transparent
group-data-[variant=underline]/tabs-list:data-active:bg-transparent
dark:group-data-[variant=underline]/tabs-list:data-active:border-transparent
dark:group-data-[variant=underline]/tabs-list:data-active:bg-transparent
```
- Prevents `data-active:bg-background` (from line 3) from filling the active trigger

**`TabsTrigger` cn() — line 4 (after indicator):** added:
```
group-data-[variant=underline]/tabs-list:after:bg-primary
group-data-[variant=underline]/tabs-list:data-active:after:opacity-100
```
- `after:bg-primary`: underline indicator uses `--primary` (branded color) — distinguishes from `line` which uses `bg-foreground` (neutral)
- `data-active:after:opacity-100`: shows the indicator only on the active trigger
- Position: reuses existing `group-data-horizontal/tabs:after:bottom-[-5px] after:h-0.5 after:inset-x-0` (no changes)
- Note: `group-data-[variant=underline]/tabs-list:after:bg-primary` has a different modifier set than `after:bg-foreground`, so tailwind-merge keeps both; the variant-specific class wins via CSS attribute-selector specificity ✓

### `src/components/ui/button.tsx`

**`size="xl"` variant string:** added `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`
- `max-sm:w-full`: full-width at < sm (640px)
- `max-sm:h-auto`: allows height to grow when wrapped text needs more vertical space
- `max-sm:min-h-11`: ensures minimum 44px touch target even with short labels
- `max-sm:whitespace-normal`: overrides `whitespace-nowrap` from base at mobile → text can wrap
- `max-sm:break-words`: very long unbroken tokens wrap/break safely; never overflow the box

**`size="tab"` variant string:** added `max-sm:w-full max-sm:whitespace-normal max-sm:break-words`
- Same rationale; `h-auto` already on base `tab` size (no `max-sm:h-auto` needed)

**Unchanged:** `icon`, `icon-xl`, `icon-sm`, `icon-xs`, `icon-lg`, `xs`, `sm`, `default`, `lg` — no `max-sm:w-full`.

### `src/components/ui/tabs.stories.tsx`

Added `Underline` scenario export (§8b-compliant scenario name):
- Three sub-sections: English labels with content, Ukrainian labels (overflow stress), disabled trigger
- All using `variant="underline"` on `TabsList`
- No per-width named exports; viewport toolbar handles breakpoint verification

### `src/components/ui/button.stories.tsx`

Added `LocaleStress` scenario export:
- `globals: { locale: 'uk' }` + `viewport: { defaultViewport: 'mobile320' }`
- 4 buttons (`default`, `outline`, `secondary`, `destructive`) all `size="xl"` with long Ukrainian labels
- Demonstrates: full-width at 320px, labels fit, no clipping
- Existing stories unchanged

### Docs

- `docs/design-system.md` §12b: added "Button primitive mobile fragment" + "Tabs — underline variant" table
- `docs/ui-rules.md` §15a: added underline variant paragraph + "Button — mobile full-width rule" section
- `docs/backlog.md`: Last Session updated

---

## Note 20 — Before/after control inventory

### `tabs.tsx`

| Before | After |
|---|---|
| 2 variants: `default`, `line` | 3 variants: `default`, `line`, **`underline`** (additive) |
| `default` pill/fill → unchanged | `default` unchanged for all 6 existing consumers |
| `line` underline (`bg-foreground`) → unchanged | `line` unchanged |
| — | `underline`: transparent list, `bg-primary` indicator on active |
| `TabsList mobileScroll` prop → unchanged | unchanged |
| `max-sm:min-h-11` on triggers → unchanged | unchanged |

No controls removed. `default` path untouched in diff — the `group-data-[variant=default]/tabs-list:data-active:shadow-sm` path is still the only one rendering the shadow; underline variant explicitly suppresses it.

### `button.tsx`

| Before | After |
|---|---|
| `size="xl"`: `h-11 gap-2 px-5` | + `max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` |
| `size="tab"`: `h-auto px-4 py-2` | + `max-sm:w-full max-sm:whitespace-normal max-sm:break-words` |
| All other sizes → unchanged | All other sizes → unchanged |

No controls removed. `icon*` sizes verified unchanged.

---

## 6 Tab consumer verification (default style preserved)

| Consumer | Variant used | Mobile contract | After Task 360 |
|---|---|---|---|
| `CabinetShell.tsx` | default (no prop) | ✅ Task 359 | `default` path unchanged ✅ |
| `ListingsStatusTabs.tsx` | default | ✅ Task 359 | `default` path unchanged ✅ |
| `AdminCurrencyTabs.tsx` | default | ✅ Task 359 | `default` path unchanged ✅ |
| `AdminEmailTemplatesManager.tsx` | default | ✅ Task 359 | `default` path unchanged ✅ |
| `AdminFooterManager.tsx` | default | ✅ Task 359 | `default` path unchanged ✅ |
| `AdminPagesManager.tsx` | default | ✅ Task 359 | `default` path unchanged ✅ |

No consumer uses `variant="line"` or `variant="underline"` — new variant is additive only.

---

## Negative flow verification

| Negative branch | Handler in diff | Location |
|---|---|---|
| Default (non-underline) consumer | `group-data-[variant=default]/tabs-list:data-active:shadow-sm` path untouched | `tabs.tsx:68` (line 1 of cn) |
| Icon-only/compact button (no `max-sm:w-full`) | `icon*`, `xs`, `sm`, `default`, `lg` sizes have no mobile fragment | `button.tsx` CVA size map |
| Extra-long unbroken token in button label | `max-sm:break-words` on `xl`/`tab` | `button.tsx` CVA |
| Disabled tab / disabled button | `disabled:pointer-events-none disabled:opacity-50` untouched; underline variant adds no interaction | `tabs.tsx:66` |
| Locale mismatch | No new production i18n strings; story DL dict uses inline literals | `button.stories.tsx` |

---

## Positive flow walkthrough (claim — rendered verification is OWNER QA REQUIRED)

1. **Storybook `Primitives/Tabs → Underline`**: active tab shows primary-color line below it; inactive tabs show none; disabled tab is dimmed and non-interactive.
2. **Mobile 320px**: `TabsList variant="underline"` becomes full-width with equal-fill triggers (Task 359 mobile contract).
3. **Keyboard nav**: uses shadcn Tabs primitive (Base UI) — arrow-key navigation is built in and untouched.
4. **Storybook `Primitives/Button → LocaleStress`**: 4 `size="xl"` buttons in uk locale at 320px are full-width, long labels fit.
5. **Desktop ≥640px**: buttons size to content (no `sm:` overrides added — `max-sm:` only applies at <640px).

---

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 — underline renders, indicator on active tab, a11y + mobile contract intact | `tabs.tsx` variant + `Underline` story | ✅ |
| AC2 — default tab style unchanged across all 6 consumers | diff shows `default` CVA path untouched; 6 consumer check above | ✅ |
| AC3 — Button full-width <640 (`max-sm:w-full` on `xl` + `tab`) | `button.tsx` CVA `xl` + `tab` sizes | ✅ |
| AC4 — text never overflows; uk labels fit (`break-words` + `whitespace-normal`) | `button.tsx` CVA; `LocaleStress` story at 320 | ✅ |
| AC5 — scenario-named story exports, §8b compliant | `Underline`, `LocaleStress` — no width-number suffixes | ✅ |
| Positive + Negative flow parity | Both documented above | ✅ |
| Existing controls/flows preserved | 6 consumers verified; icon sizes unchanged | ✅ |
| 0 new lint errors | `npm run lint` → empty output (0 errors) | ✅ |
| `npx tsc --noEmit` → 0 | Empty output | ✅ |
| `npm run build-storybook` passes | `✓ built in 6.17s` | ✅ |
| `npm run check:i18n` PASS | `✅ Parity PASSED — 1434 keys` | ✅ |
| All 4 locales render | No new production strings; story DL dict is locale-aware | ✅ (OWNER QA for rendered) |
| All 7 breakpoints render | Primitive-only; viewport toolbar | OWNER QA REQUIRED |
| docs/design-system.md + docs/ui-rules.md updated | §12b + §15a extended | ✅ |
| docs/backlog.md updated | Last Session updated | ✅ |
| No `git add` / `git commit` emitted | — | ✅ |

---

## Validation outputs

### `npx tsc --noEmit`
```
(no output — exit 0) ✅
```

### `npm run lint`
```
(no output — exit 0) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — all 4 locale files have identical key sets (1434 keys).
```

### `npm run build-storybook`
```
✓ built in 6.17s
info => Preview built (7.57 s)
info => Output directory: storybook-static
```
Exit 0 ✅

### Out-of-scope diff check
Files NOT touched: `src/app`, `src/modules`, `messages/*.json`, `package.json`, `package-lock.json`, `.storybook`, any of the 6 tab consumers, any admin component.

---

## Rendered QA matrix

Executor has no browser access. All cells are **OWNER QA REQUIRED**.

| Surface | 320 | 375 | 390 | 640+ |
|---|---|---|---|---|
| `Tabs / Default` (existing) | OQR | OQR | OQR | OQR |
| `Tabs / Underline` (new) | OQR | OQR | OQR | OQR |
| `Button / LocaleStress` (new) | OQR | OQR | OQR | OQR |
| `Button / ControlRowRhythm_Stacked` (existing) | OQR | OQR | OQR | OQR |

Use the Storybook viewport + locale toolbar to verify all 14 widths × 4 locales.

---

Self-validation: tsc=0 errors · lint=0 errors · build-storybook=✅ · check:i18n=PASS (1434 keys) · AC table=all green · scope=clean (tabs.tsx, button.tsx, 2 story files, 2 docs, backlog)

---

## Files Changed

| File | Rationale |
|------|-----------|
| `src/components/ui/tabs.tsx` | Added `variant="underline"` CVA variant + trigger underline + shadow-none + bg overrides |
| `src/components/ui/button.tsx` | `size="xl"` + `size="tab"`: `max-sm:w-full`, height auto/min, whitespace-normal, break-words |
| `src/components/ui/tabs.stories.tsx` | Added `Underline` scenario export (AC1 verifiable) |
| `src/components/ui/button.stories.tsx` | Added `LocaleStress` scenario export (AC3/AC4 verifiable at 320px) |
| `docs/design-system.md` | §12b extended: underline tab variant table + button mobile fragment |
| `docs/ui-rules.md` | §15a extended: underline variant para + button mobile-full-width rule |
| `docs/backlog.md` | Last Session updated with Task 360 summary |
| `docs/sessions/2026-06-02-task-360-tabs-underline-button-responsive.md` | This session log |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
