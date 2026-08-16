# Task 755 — `MobileNavDrawer`

**Sprint:** 60 · **Type:** UI mechanism (D28) · **QA profile:** `Q2 Standard UI` · **Status:** KICKOFF FILED

## Objective

Remove the Tailwind layout utilities from `src/components/layout/MobileNavDrawer.tsx` (126 lines). It already
uses `MantineDrawer`; the drawer's *contents* are still raw Tailwind. **Zero visual delta (D28).**

## Exact current state — read 2026-08-16, verify before editing

| Line | Current |
|---|---|
| 43 | `<div className="flex flex-col gap-6">` |
| 45 | `<div className="flex items-center gap-3 pb-4 border-b">` |
| 48 | `<p className="font-medium text-sm">{user.name}</p>` |
| 53 | `<nav className="flex flex-col gap-4">` |
| 54, 57, 62, 67, 72, 77 | `className={navLinkClass}` on six `Link` / button elements |

Plus two further wrappers reported at design time as `"border-t pt-4 flex flex-col gap-2"` and
`"border-t pt-4"` — **locate their current line numbers before editing; do not trust these strings without
re-reading the file.**

`navLinkClass` is a shared local constant applied to all six navigation items. **Read its definition first** —
migrating six call sites without migrating the constant achieves nothing.

## Replacement rules

- `flex flex-col gap-N` → `<Stack gap=…>`; `flex items-center gap-3` → `<Group gap=…>`. px-equal:
  `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px, `gap-6` = 24px, `pb-4`/`pt-4` = 16px.
- `border-b` / `border-t` → Mantine `Divider`, **or** a CSS-module border rule. `Divider` adds a DOM node;
  if you use it, prove equivalence in the rendered matrix. If the border is decorative separation between
  sections, `Divider` is the canonical choice.
- `navLinkClass` → a CSS module class, or Mantine `NavLink` if — and only if — it renders identically.
  **`NavLink` brings its own chrome; do not adopt it on the assumption that it matches.** Measure.
- `<nav>` (`:53`) must remain a `<nav>` element. Use `component="nav"` on a Mantine wrapper.

## Preserve exactly

- The **six** navigation destinations and their conditional rendering. Some are auth-gated (`cabinet`,
  `favorites`); the gating condition is untouched.
- Every `onClick={() => navigate(...)}` handler and every `href`.
- `MantineDrawer`'s mobile branch: `MantineDrawer.tsx:125-134` returns `ResponsiveBottomSheet` when
  `isMobile`, a **structurally different tree** from the desktop `Drawer`. This component is mobile-only in
  practice, so the bottom-sheet branch is the one that matters — but do not assume the desktop branch is
  unreachable. Render both if the drawer can open above the breakpoint.

## Out of scope

`MantineDrawer` itself · `ResponsiveBottomSheet` · `HeaderView`'s trigger · `UserMenu` (752) · routing.

## Acceptance criteria

- **AC1** — no raw Tailwind layout utility remains in the file, including inside `navLinkClass`; survivors listed with reasons.
- **AC2** — rendered evidence, zero visual delta, at 320 / 375 / 390 / 768, `uk@320` mandatory, in **two** states: authenticated (all six items) and anonymous (the gated ones absent).
- **AC3** — all six destinations still navigate to the same paths; `<nav>` still present in the rendered DOM.
- **AC4** — if the drawer is reachable at ≥768, the desktop branch is included in the matrix; if it is not, the report states how that was established.
- **AC5** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0.

## Report contract

Changed files with line numbers; `navLinkClass`'s before/after; whether `NavLink` was adopted and the
evidence; the `Divider`-vs-CSS-border decision; the two wrapper strings' actual line numbers as found;
commands with actual output; rendered evidence for both auth states.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
