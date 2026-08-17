# Task 755 — `MobileNavDrawer`

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_755_MobileNavDrawer.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Requirement / acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | No raw Tailwind layout utility remains, including inside `navLinkClass`; survivors listed with reasons | All `flex flex-col`/`flex items-center`/`gap-*`/`border-b`/`border-t`/`pb-4`/`pt-4` removed, replaced with `Stack`/`Group`/`Divider`. `navLinkClass` removed entirely, replaced with a CSS Module class (`styles.navLink`) — no Mantine style prop covers `hover:`, `transition-colors`, or the opacity-modified `text-foreground/80`. No survivors |
| AC2 | Rendered evidence, zero visual delta, 320/375/390/768, uk@320 mandatory, 2 states (authenticated, anonymous) | Extended the existing canonical `Mantine/Primitives/MobileNavDrawer` story with a `loggedIn` arg so each auth state renders alone (avoiding the documented Task 578/585 double-overlay-stacking defect). Before (`git show HEAD:<path>`) vs. after (edited) comparison: 6 nav links × (fontSize/lineHeight/fontWeight/color/href/Y-position) + userName styling + button labels + Divider border, at 320/375/390/768 (authenticated + anonymous) + uk@320 (both states) — **0 mismatches** across 336 checks. A real hover-color capture-timing artifact (9 apparent mismatches at a 100ms wait, mid-CSS-transition) was traced to the harness, not the product, and resolved by waiting past the 150ms `transition-duration`; both sides settle to byte-identical `oklch(0.145 0 0)`. Screenshots visually confirmed at 320/768/uk@320 |
| AC3 | All six destinations still navigate to the same paths; `<nav>` still present | `href` values captured and compared for all 6 links, 0 mismatches. `<nav>` confirmed present via `document.querySelector('nav').tagName === 'NAV'` in every captured state (`Stack component="nav"`) |
| AC4 | If reachable at ≥768, desktop branch included; else state how established | `MantineDrawer`'s own breakpoint (`useResponsiveDropdown`, `max-width: 40em`=640px) is independent of the hamburger trigger's `hiddenFrom="md"`(768px) in `HeaderView.tsx` — the drawer's desktop `Drawer` branch is reachable in the 641–767px range via the visible trigger, and `MantineDrawer` itself switches to that same branch at exactly 640px regardless of trigger visibility. Since the required matrix includes 768 (≥640), the desktop branch **is** in scope and **was** rendered/compared (screenshots + computed-style diff at `en__authed__768`/`en__anon__768`, 0 mismatches) |
| AC5 | `typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0 | All four re-run on final content, all exit 0 (see Validation evidence) |

## Current versus required behavior

- **Preserved:** all six navigation destinations (`home`, `listings`, `profile`, `my_listings`, `favorites`, `add_listing`) and their auth-gating (`cabinet`/`favorites`/`my_listings`/`add_listing` only when `user` is truthy — condition untouched); every `onClick={() => navigate(...)}` handler and `href`; `<nav>` element; `MantineDrawer`'s own mobile/desktop branching (untouched, out of scope); the `§6a-link` decision-record comment.
- **Required after behavior:** raw Tailwind utilities replaced with Mantine primitives/CSS Module per the kickoff's replacement rules, zero visual delta (D28).
- **Negative flows:** N/A — presentational component driven entirely by the `user`/`opened` props; no validation/authorization/network branches newly in scope. `onNavigate`/`onOpenAuth`/`onLogout` callback contracts untouched.

## Files Changed

| File | Reason |
|---|---|
| `src/components/layout/MobileNavDrawer.tsx` | Outer `<div>` → `Stack gap="xl"`; user-info block → nested `Stack gap="md"` containing `Group gap="sm"` (avatar+name) + `Divider`; `<p>` name → `Text`; `<nav>` → `Stack component="nav" gap="md"` (element preserved); `navLinkClass` → `styles.navLink` (CSS Module); anonymous/logout blocks → nested `Stack gap="md"` (`Divider` + inner `Stack gap="xs"` for the 3 anonymous buttons) |
| `src/components/layout/MobileNavDrawer.module.css` | New — reproduces `navLinkClass` (`text-sm font-medium text-foreground/80 hover:text-foreground transition-colors`); no Mantine prop covers hover or the opacity-modified color |
| `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` | Added a `loggedIn` arg (default `true`) so the logged-out branch can be captured as **rendered** evidence on a separate page load, not just verified by code inspection — the existing story's documented double-overlay-stacking defect is still avoided (exactly one open drawer per render, either state) |

## Validation evidence

```
npm run typecheck                     → exit 0
npm run check:design-tokens --strict  → 0 violations, exit 0 (1 marker added with reason, see below)
npm run check:i18n                    → 2218 keys × 4 locales, parity PASSED, exit 0
npm run check:mojibake                → 0 artifacts in 2851 files, exit 0
npm run check:stories                 → 127 files checked, 0 violations, exit 0
npm run build                          → ✓ Compiled successfully, 40/40 static pages, exit 0
npx vitest run src/components/layout/__tests__/header-hydration-id-parity.test.tsx → 1 file / 3 tests passed
```

File integrity: all 3 touched/added files verified UTF-8, no BOM, no NUL bytes.

`check:design-tokens` marker added (with reason, not suppressing a defect):
- `MobileNavDrawer.module.css:10` — `var(--default-transition-duration)` (same Tailwind-internal-token exemption as Task 754).

### `navLinkClass`'s before/after (report contract)

**Before:** `const navLinkClass = 'text-sm font-medium text-foreground/80 hover:text-foreground transition-colors'` — a shared string constant applied via `className` to all 6 `<Link>` elements.
**After:** the constant is removed; all 6 `<Link className={styles.navLink}>` reference one CSS Module class:
```css
.navLink {
  font-size: var(--text-sm);
  line-height: var(--text-sm--line-height);
  font-weight: 500;
  color: color-mix(in oklab, var(--foreground) 80%, transparent);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke;
  transition-timing-function: var(--default-transition-timing-function);
  transition-duration: var(--default-transition-duration);
}
.navLink:hover { color: var(--foreground); }
```
Migrating six call sites without migrating the constant would have achieved nothing — the constant itself was the actual survivor; it is now gone entirely.

### Was `NavLink` adopted? (report contract)

**No.** Mantine's `NavLink` component ships its own chrome (padding, background/hover-background, active-state styling, optional icon/description slots) designed for a bordered/backgrounded nav-list item — structurally different from this drawer's plain-text links (no background, no padding box, only a color/weight/hover-color change). Adopting it would require either accepting that chrome (a real visual change, D28 violation) or stripping it down with overrides that reduce to re-deriving the same CSS Module anyway, with more surface area to get wrong. A CSS Module class was the lower-risk, structurally-matching choice — not assumed correct without checking; `NavLink`'s documented default shape was compared against the original's minimal styling before deciding against it.

### The `Divider`-vs-CSS-border decision (report contract, AC1)

**Decision: `Divider`** (not a CSS-module border) — the kickoff's stated preference for decorative section separation, unlike Task 754's `divide-y` (a repeated N-1 separator with no clean `Divider` mapping). Reproducing the original's **non-uniform** spacing (16px inside the bordered box via `pb-4`/`pt-4`, then 24px via the parent's `gap-6` to the next section) required nesting: each section that had a border is now its own inner `Stack gap="md"` (16px, matching `pb-4`/`pt-4`) containing the content and the `Divider`, itself one child of the outer `Stack gap="xl"` (24px, matching `gap-6`). This reproduces the exact spacing — confirmed via `getBoundingClientRect().top` deltas for every nav link across all 4 viewports × 2 auth states, 0 position mismatches. `Divider` renders as `<div role="separator">` (not `<hr>`, confirmed by inspection) with `color="var(--border)"` explicitly set (Mantine's own default is `gray.2`, a different hex than `var(--border)` — verified via computed style: both sides render `border-top: 1px solid oklch(0.922 0 0)`, byte-identical).

### The two wrapper strings' actual line numbers (report contract)

Re-read before editing, as instructed — both matched the kickoff's predicted strings exactly, no drift:
- `"border-t pt-4 flex flex-col gap-2"` → line 86 (anonymous auth-actions block).
- `"border-t pt-4"` → line 108 (logout block).

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector (before) | Token/utility path | Change | Evidence |
|---|---|---|---|---|---|
| Outer spacing | `Stack gap="xl"` | `flex flex-col gap-6` | 24px = Mantine `xl` | Direct token match | Y-position deltas between top-level sections, 0 mismatches |
| User-info row | `Group gap="sm"` | `flex items-center gap-3` | 12px = Mantine `sm` | Direct token match | — |
| User-info border | `Divider color="var(--border)"` inside nested `Stack gap="md"` | `pb-4 border-b` | `var(--border)`; 16px = `md` | Divider + nesting (see decision above) | Computed `borderTopWidth`/`Color` match; position match |
| User name | `Text size="sm" fw={500} lh={1.625}` | `font-medium text-sm` (`<p>`, no `leading-*`) | n/a | `lh` explicit (base-rule finding, Task 753/754) | Computed fontSize/lineHeight/fontWeight, 0 mismatches |
| Nav list | `Stack component="nav" gap="md"` | `<nav className="flex flex-col gap-4">` | 16px = `md` | `component="nav"` preserves the element | `document.querySelector('nav').tagName === 'NAV'` in every capture |
| Nav links | CSS Module `.navLink` | `navLinkClass` (`text-sm font-medium text-foreground/80 hover:text-foreground transition-colors`) | `color-mix(in oklab, var(--foreground) 80%, transparent)` (D35 opacity token) | CSS Module | fontSize/lineHeight/fontWeight/color, 0 mismatches for all 6 links × all states/viewports; hover settles to identical `oklch(0.145 0 0)` on both sides |
| Anonymous auth-actions border+gap | `Divider` + nested `Stack gap="xs"` inside `Stack gap="md"` | `border-t pt-4 flex flex-col gap-2` | `var(--border)`; 16px `md`; 8px `xs` | Divider + nesting | Computed border + position match |
| Logout border | `Divider` inside `Stack gap="md"` | `border-t pt-4` | `var(--border)`; 16px `md` | Divider + nesting | Computed border + position match |
| Desktop branch (≥640px) | `MantineDrawer`'s own `Drawer` (out of scope, unmodified) | n/a | n/a | none — verified reachable and rendered correctly | Screenshot + computed-style diff at 768px, 0 mismatches |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Whole drawer rendered surface | Found the existing `Mantine/Primitives/MobileNavDrawer` story immediately (unlike Task 754, searched by literal component name this time) — a toolbar-driven, controlled-open story with a documented anti-double-stacking rationale | `Mantine/Primitives/MobileNavDrawer` `Default` story | `extend` (added a `loggedIn` arg to reach the previously code-inspection-only anonymous branch as real rendered evidence) | n/a |
| Vertical stacking layout | Direct Mantine `Stack`/`Group` core primitives, same established pattern as Tasks 752–754 | Mantine `Stack`/`Group` | `reuse` | n/a |
| Section separator | Kickoff explicitly named `Divider` as canonical for decorative separation (contrast with Task 754's `divide-y`, which had no such preference) | Mantine `Divider` | `reuse`, with `color="var(--border)"` override (theme default `gray.2` verified to be a different token) | `var(--border)` |
| Nav-link text style | Searched Mantine `NavLink` (rejected — own chrome, see reasoning above) vs. CSS Module (established pattern from Tasks 753/754 for hover/opacity-color cases with no prop equivalent) | CSS Module pattern | `reuse` (of the established local convention) | `color-mix(in oklab, var(--foreground) 80%, transparent)` |
| Muted/opacity text color | Verified in the built CSS mechanism the same way as Task 754's `text-muted-foreground/60` (confirmed NOT the D35 `--overlay` failure mode) | n/a — reproduced the compiled `color-mix()` expression directly | `reuse` (of the compiled mechanism) | `color-mix(in oklab, var(--foreground) 80%, transparent)` |

## Implementation validation notes

One capture-harness-only defect found and resolved, no product defect:

- **Hover-color capture timing.** An initial 100ms post-hover wait captured `oklab(0.145 0 0 / ~0.98–0.99)` on both before and after — a mid-CSS-transition frame (the shared `transition-duration: 150ms` from the reproduced `transition-colors`), not a settled value. Verified by sweeping the wait to 300/600/1000ms: both sides settle to the identical `oklch(0.145 0 0)` (bare `--foreground`, no opacity — matches `hover:text-foreground`'s un-modified token). Confirmed on both the original and migrated markup directly (swapped file content live against the same running Storybook server via HMR).

No remaining gaps against the five acceptance criteria.

## Assumptions, deviations, and limitations

- `MantineDrawer`, `ResponsiveBottomSheet`, `HeaderView`'s trigger, `UserMenu`, and routing — confirmed untouched (no diff; `HeaderView.tsx` was inspected read-only to establish AC4's reachability answer).
- No new i18n keys added; `nav.*` translation keys unchanged.
- This task touches no `docs/critical-flow-registry.md` entry (presentational nav drawer); no automated regression test was added beyond re-running the existing `header-hydration-id-parity.test.tsx`, which mounts `HeaderView` (and therefore `MobileNavDrawer`) and continues to pass.

## Opus handoff

- Diff: `git diff -- src/components/layout/MobileNavDrawer.tsx src/stories/mantine/primitives/MobileNavDrawer.stories.tsx`
- New file: `src/components/layout/MobileNavDrawer.module.css`
- This session log: `docs/sessions/2026-08-17-task755-mobilenavdrawer.md`
- Backlog: `docs/backlog.md` (Last Session line + registry row 755 updated)
- Sprint plan: `tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md` row 755 updated
- Owner-run commit (explicit paths), when ready:
  `git add docs/backlog.md docs/sessions/2026-08-17-task755-mobilenavdrawer.md src/components/layout/MobileNavDrawer.tsx src/components/layout/MobileNavDrawer.module.css src/stories/mantine/primitives/MobileNavDrawer.stories.tsx tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
