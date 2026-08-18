# Task 757 — `AuthSheet`

**Sprint:** 60 · **Type:** UI mechanism (D28) · **QA profile:** `Q4 Release/Critical Flow` · **Status:** KICKOFF FILED

## Objective

Remove the Tailwind residue from `src/modules/auth/components/AuthSheet.tsx` (844 lines) — the largest
remaining concentration on the homepage, and the only one on a critical flow. **Zero visual delta (D28), zero
behaviour delta.**

**Runs last in Sprint 60. Do not start before Task 756 has been reviewed** — 756 decides how the shared
sub-panel fragment is migrated, and this task follows that decision rather than making its own.

## Why Q4, not Q2

`AuthSheet` is the login / registration / recovery surface, mounted on every page by `Header.tsx:66-75`.
**Name its entry in `docs/critical-flow-registry.md` and produce the automated regression evidence that entry
requires.** If no entry exists, stop and report `BLOCKED` — do not proceed on the assumption that auth is
uncovered.

## What Sprint 60 learned — mandatory, not advisory (added 2026-08-18, after 752-756 landed)

This file is ~161 utilities on a critical flow mounted by `Header.tsx:66-75` on **every page**. Two of the five
completed tasks in this sprint shipped a visual regression of the same kind, and both were caught only in review.
At this file's scale the same mistake is not a 16px nudge — it is an auth surface that silently changes.

### 1. Establish, per utility, whether it currently renders — before replacing it

`@mantine/core/styles.css` ships with **no `@layer` wrapper**; Tailwind utilities live in `@layer utilities`.
Unlayered CSS beats layered CSS regardless of specificity or source order. So **any Tailwind class on a Mantine
component that competes with a declaration Mantine's own root class already sets has never rendered.**

Proven twice this sprint:

| Task | Utility | Mantine root sets | Was it live? | What went wrong |
|---|---|---|---|---|
| 752 | `justify-start` / `text-left` on `Button` | `display:inline-block`, `text-align:center` | **No** | Replaced with `justify="flex-start"`, which *does* work — labels moved 16.1px in the vertical branch |
| 756 | `leading-snug` on `Text` | `line-height: var(--text-lh, …)` | **No** | Moved into a CSS Module — line-height went 20.02px → 19.25px on every listing-card title |

**Required procedure for every utility in your census.** Read the property off the component's own compiled CSS in
`node_modules/@mantine/core/styles/<Component>.css` first. Then:

- Mantine sets that property → the utility is **inert**. **Delete it and substitute nothing.** Record it in the
  census as `inert — removed, never rendered`, naming the Mantine declaration that beat it.
- Mantine does not set it → the utility is **live**. Reproduce it exactly (prop, style, or CSS Module).

`AuthSheet.tsx` imports `Alert`, `Button`, `InputLabel`, `PasswordInput`, `Text` and `TextInput`. Every Tailwind
class sitting on one of those is a candidate. Do not assume; read the CSS.

### 2. Class-derived expectation is not evidence

Task 756's first pass compared the after-state against "what the Tailwind class should produce" and passed a real
regression, because the expectation and the after-state were derived from the same assumption. AC3 here is satisfied
only by a **genuine before/after DOM capture**: check out the pre-migration content, capture, restore, capture again,
diff. Record a `git hash-object` witness before the swap, after the swap, and after the restore, so the restoration
is proven rather than asserted — the protocol in `docs/sessions/evidence/task756/ac3-before-after-witness.log`.

**Retain the artifacts under `docs/sessions/evidence/task757/`.** Four tasks in this sprint captured proof into
scratch directories and deleted it; 756 was the first to keep it. Keep it.

### 3. The shared fragment decision is made — do not re-decide it

Task 756 landed as `29f9b16de`. The canonical component is
`src/design-system/mantine/patterns/MantineAddItemPanel.tsx`, exported from the patterns barrel. It owns **only**
the outer chrome (`border` / `rounded-xl` / `p-3` / `gap-2` / `bg-muted/30`), callers own their fields as children,
and a caller's own leading margin is passed via the optional `mt` prop rather than baked in — `LocationCombobox`
passes `mt={4}` for its former `mt-1`. `bg-muted/30` is reproduced as the literal
`color-mix(in oklab, var(--muted) 30%, transparent)` Tailwind itself compiles, per D35.

`AuthSheet`'s add-company panel used the identical fragment verbatim. Consume the component; do not fork it, do not
re-derive the decision, and do not modify it for this task's convenience — if it genuinely does not fit, STOP and
report rather than editing a component another surface already depends on.

## Exact current state — read 2026-08-16, verify before editing

The file carries ~161 Tailwind utility tokens across ~25 distinct `className` literals. Confirmed samples:

```
"absolute inset-0 flex items-center"
"bg-popover px-2 text-muted-foreground"
"border rounded-xl p-3 flex flex-col gap-2 bg-muted/30"     ← the shared fragment, see below
"border-t pt-4"
"flex flex-col gap-1"          "flex flex-col gap-1.5"
"flex flex-col gap-4 pb-6"     "flex flex-col items-center gap-4 pb-6 pt-2 text-center"
"flex flex-col sm:flex-row gap-2 pt-1"
"flex flex-col sm:flex-row sm:items-center gap-2"
"flex items-center gap-2"      "flex items-center justify-between"
"font-semibold text-lg"
"h-12 w-12 text-status-success shrink-0"
"h-4 w-4 shrink-0"             "h-4 w-4 text-muted-foreground"
"h-9 w-9 rounded-lg border bg-card flex items-center justify-center shrink-0"
"h-9 w-9 rounded-lg object-contain border bg-card shrink-0"
"hidden"    "mt-2"    "my-3"    "relative"
"relative flex justify-center text-xs uppercase"
"text-[10px] text-muted-foreground"
"text-center text-sm text-muted-foreground"
```

**Enumerate the file yourself before editing.** This list was read on 2026-08-16 and is a starting inventory,
not a complete or current one. Produce your own census and state its count.

## Known specifics

- **The shared fragment** `"border rounded-xl p-3 flex flex-col gap-2 bg-muted/30"` also exists in
  `LocationCombobox.tsx`. Task 756 owns the decision — shared primitive, or identical migration in both.
  **Read 756's report and follow it.** Do not migrate this fragment a second, different way.
- `"absolute inset-0 flex items-center"` + `"relative flex justify-center text-xs uppercase"` +
  `"bg-popover px-2 text-muted-foreground"` together form an **"or" separator** (a centred label over a rule).
  Mantine `Divider` with `label` and `labelPosition="center"` is the canonical equivalent — prove it renders
  identically before adopting; three utilities collapsing into one component is exactly where a silent visual
  delta hides.
- `"h-9 w-9 rounded-lg border bg-card …"` (twice) is a 36px provider-logo tile, once as a container and once
  as an `<img>` with `object-contain`. Keep both variants' rendered geometry.
- `text-[10px]` is an **arbitrary value** that `check:design-tokens` sees. Confirm its current
  `design-tokens-allow:` marker status and keep the gate green.
- `"hidden"` — find what it hides and why before removing it; it may be a deliberate a11y or layout device.
- `PasswordRequirementsHint` is imported at `:16` and is migrated by **Task 753**. Its export
  `allPasswordRulesMet` is unchanged; this task consumes it as-is.

## Preserve exactly

- Every auth flow: login · registration · password recovery · the view switching driven by `initialView`.
- `AUTH_SHEET_EVENT` / `AUTH_SHEET_CLOSED_EVENT` wiring (`Header.tsx:26-35, 66-75`) and `onOpenChange`.
- Captcha integration (`CaptchaWidget`, migrated by 753) and `PhoneField` (touched by 752) — consume both
  as-is; do not re-migrate them here.
- Every validation message, every `t()` key, every `aria-*` attribute, every `data-testid`.
- Error and loading states for all three flows.

## Out of scope

`Header.tsx` · `CaptchaWidget` · `PasswordRequirementsHint` · `PhoneField` · any auth **logic**, validation
rule, or Supabase call · any string change.

## Acceptance criteria

- **AC1** — the executor's own census of Tailwind utilities in this file is stated before and after; every survivor is listed with its reason.
- **AC2** — the `critical-flow-registry.md` entry is named and its required automated regression evidence produced and passing.
- **AC3** — rendered evidence, zero visual delta, at 320 / 375 / 390 / 480 / 768 / 1024 / 1440, all four locales at 320 and at the desktop width, `uk@320` mandatory — for **each** of: login · registration · recovery · the success state · at least one validation-error state.
- **AC4** — the "or" separator renders identically before and after, shown side by side.
- **AC5** — the add-company panel consumes `MantineAddItemPanel` from the patterns barrel unmodified; the report
  quotes Task 756's decision and states which props were used.
- **AC6** — all three auth flows completed end to end manually, with the transcript recorded; no console error introduced.
- **AC7** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `check:locale-leak`, `npm run build` all exit 0.
- **AC8** — no string content changed; `check:i18n` key parity unchanged.
- **AC9** — the census in AC1 classifies **every** utility that sat on a Mantine component as `live` or `inert`,
  each with the Mantine declaration consulted. Every `inert` one is deleted with nothing substituted. A utility
  replaced by a working prop without this classification is a failed AC, even if the render happens to match.

## Verification plan

Census before → migrate → census after → `npm run typecheck` → `check:design-tokens` → `check:i18n` →
`check:locale-leak` → the critical-flow regression evidence per AC2 → rendered matrix per AC3/AC4 → manual
end-to-end of all three flows per AC6 → `npm run build` (exit 0 mandatory).

## Report contract

Before/after utility census with counts; changed lines; the separator evidence; the quoted 756 decision and
how it was applied; the critical-flow entry name and its evidence location; commands with actual output;
rendered evidence locations for every AC3 combination; the manual flow transcript; every utility kept with the
reason.

**This is a 844-line file on a critical flow.** `PARTIALLY IMPLEMENTED` with a clean, reviewable subset is a
better outcome than a complete pass with thin evidence. Say what you did not finish.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
