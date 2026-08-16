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
- **AC5** — the shared fragment is migrated exactly as Task 756's report specifies; the report quotes that decision.
- **AC6** — all three auth flows completed end to end manually, with the transcript recorded; no console error introduced.
- **AC7** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `check:locale-leak`, `npm run build` all exit 0.
- **AC8** — no string content changed; `check:i18n` key parity unchanged.

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
