# Tailwind Governance — Lero.al
**Phase 3 of Future Maintenance Direction Epic**
Established: 2026-05-18
Status: PERMANENT GOVERNANCE REFERENCE

All future Claude Code UI tasks MUST follow these rules before writing Tailwind classes.
Run `npm run governance:tailwind` to validate compliance.

---

## §1 — UTILITY ORDERING

Class order within a `className` string MUST follow this sequence:

```
1. Layout:          block, flex, grid, inline, hidden
2. Position:        relative, absolute, fixed, sticky
3. Sizing:          w-*, h-*, min-*, max-*
4. Spacing:         p-*, px-*, py-*, m-*, mx-*, my-*, gap-*
5. Typography:      text-*, font-*, leading-*, tracking-*, uppercase
6. Colors:          bg-*, text-*, border-*
7. Borders:         rounded-*, border, border-*
8. Effects:         shadow-*, ring-*, opacity-*
9. Transitions:     transition, duration-*, ease-*
10. Responsive mods: sm:*, md:*, lg:*, xl:*, 2xl:*
11. State mods:     hover:*, focus:*, active:*, disabled:*
12. Arbitrary:      [value] variants last
```

**Rule:** Responsive modifiers must always come AFTER base styles.
**Rule:** State modifiers must always come AFTER responsive modifiers.

---

## §2 — RESPONSIVE MODIFIER ORDERING

Responsive classes MUST follow mobile-first order:
```
base → sm: → md: → lg: → xl: → 2xl:
```

❌ Forbidden: `lg:block md:hidden` (wrong order)
✅ Allowed: `hidden md:hidden lg:block` (correct mobile-first)

Every `2xl:` step MUST have a corresponding base/xl: step.
Never use `2xl:` in isolation without base styling.

---

## §3 — MOBILE-FIRST CLASS COMPOSITION

**Rule:** Base styles ALWAYS apply to the smallest supported viewport (320px).
**Rule:** Scale UP with breakpoint prefixes. Never write desktop-first and override down.

```
✅ text-sm sm:text-base md:text-lg        — mobile-first
❌ text-lg md:text-base sm:text-sm        — desktop-first (forbidden)
```

Touch targets on mobile: all interactive elements reachable by thumb MUST be ≥44px.
Use `size="xl"` on Button, `min-h-[44px]` on other interactive elements.

---

## §4 — SPACING UTILITY COMPOSITION

### Canonical Section Spacing

| Token | Classes | Use |
|---|---|---|
| Tight | `py-8 md:py-12` | Compact sections |
| Standard | `py-12 md:py-16` | Default homepage/listing sections |
| Wide | `py-16 md:py-24` | Hero sections, major CTAs |
| Huge desktop | `2xl:py-20` | Add to standard sections for 1536px+ |

**Forbidden:** `py-7`, `py-9`, `py-10`, `py-11`, `py-13`, `py-14`, `py-15` as section padding.

### Canonical Card Spacing

| Context | Padding | Radius |
|---|---|---|
| Admin card | `p-5` | `rounded-2xl` |
| Listing card | `p-3` | `rounded-xl` |
| Dialog | `p-6` | `rounded-2xl` |
| Form section | `p-4 md:p-6` | `rounded-2xl` |

### Canonical Gap Scale

| Use | Classes |
|---|---|
| Button group | `gap-2` |
| Form fields | `gap-4` |
| Section items | `gap-6` |
| Page sections | `gap-8 md:gap-12` |

---

## §5 — TYPOGRAPHY UTILITY COMPOSITION

Use only the canonical type scale (docs/ui-rules.md §2):

| Role | Classes |
|---|---|
| Page H1 | `text-2xl sm:text-3xl font-bold` |
| Hero | `text-3xl sm:text-4xl md:text-5xl font-bold leading-tight` |
| Section H2 | `text-xl sm:text-2xl font-bold` |
| Subsection H3 | `text-lg font-semibold` |
| Label H4 | `text-sm font-semibold` |
| Group label | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` |
| Body | `text-sm leading-relaxed` |
| Caption | `text-xs text-muted-foreground` |
| Micro | `text-[10px]` |

**Rule:** `text-[10px]` is canonical for badges and micro-labels ONLY.
**Rule:** `text-[11px]` is non-canonical — use `text-xs` instead.
**Forbidden:** Arbitrary font sizes (`text-[14px]`, `text-[16px]`, etc.) — use named scale.

---

## §6 — GRID UTILITY COMPOSITION

### Listing Card Grids (canonical)
```
grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
```

**Rule:** ALL listing card grids MUST include `2xl:grid-cols-4`.
**Rule:** NEVER stop a listing grid at `xl:grid-cols-3` without a `2xl:` step.

### Admin Grids (canonical)
```
grid grid-cols-1 lg:grid-cols-2          — admin cards
grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6  — admin stats
```

### Responsive Stack
```
flex flex-col md:flex-row gap-4         — vertical → horizontal
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  — minimal responsive grid
```

---

## §7 — FLEX UTILITY COMPOSITION

### Toolbar (canonical)
```
flex items-center gap-2                  — standard toolbar
flex items-center justify-between        — spaced toolbar
flex items-center flex-wrap gap-2        — wrapping toolbar (locale-safe)
```

**Rule:** Toolbars with translatable labels MUST use `flex-wrap` at mobile widths.

### Content Row
```
flex items-start gap-3                   — icon + text row
flex items-center gap-1.5               — compact meta row
```

---

## §8 — CONTAINER UTILITY USAGE

| Container | Classes | Max Width | Use |
|---|---|---|---|
| Public wide | `.container-wide` | 88rem (1408px) | Public pages, listings |
| Public standard | `max-w-5xl mx-auto px-4` | ~64rem | Cabinet, auth |
| Admin | `max-w-6xl mx-auto` | ~72rem | Admin content |
| Section inner | `max-w-3xl mx-auto` | ~48rem | Centered content |

**Rule:** Every public page wrapper MUST have a max-width constraint.
**Rule:** `.container-wide` is preferred for public pages (better huge-desktop behavior).
**Forbidden:** `container mx-auto px-4` alone on public pages — use `.container-wide`.
**Forbidden:** Unbounded `w-full` wrappers on public pages at 2xl.

---

## §9 — OVERFLOW UTILITY USAGE

```
✅ overflow-hidden — for rounded corners on cards/images
✅ overflow-y-auto — for scrollable sidebars, modals
✅ overflow-x-auto — for tables on mobile
✅ truncate        — for single-line text that must not wrap
✅ line-clamp-2    — for card titles (2-line truncation)
✅ overflow-hidden + truncate — combined for locale-safe overflow
```

**Forbidden:**
```
❌ overflow-hidden to mask layout bugs (use proper layout instead)
❌ whitespace-nowrap alone without overflow-hidden + truncate
❌ overflow-hidden + fixed px width on translated text
```

---

## §10 — VISIBILITY UTILITY USAGE

```
✅ hidden lg:flex     — desktop-only element
✅ lg:hidden          — mobile-only element
✅ hidden md:block    — tablet+ element
```

**Rule:** Visibility utilities must follow mobile-first order (hide first, show later).
**Rule:** Never create duplicate render trees (render mobile + desktop versions simultaneously) for heavy components.
**Allowed:** Duplicate render for lightweight elements (icon vs text label).

---

## §11 — Z-INDEX UTILITY USAGE

Canonical z-index scale:

| Layer | Value | Use |
|---|---|---|
| Dropdown | `z-10` | Combobox, select dropdown |
| Sticky | `z-20` | Sticky headers, toolbar |
| Modal overlay | `z-40` | Dialog/Sheet backdrop |
| Modal content | `z-50` | Dialog/Sheet content |
| Toast | `z-[100]` | Sonner toasts |
| Dev overlay | `z-[9999]` | PerfDevOverlay (dev-only, allowlisted) |

**Forbidden:** Arbitrary z-index values not in this scale without allowlist entry.
**Forbidden:** Emergency `z-[999]` without documented reason.

---

## §12 — ARBITRARY VALUE RESTRICTIONS

**Allowed arbitrary values (canonical):**
- `min-h-[44px]` — touch target enforcement
- `max-h-[90vh]` — modal height cap
- `text-[10px]` — micro labels (canonical)
- Gallery heights: `h-[340px]`, `h-[420px]`, `h-[500px]` (allowlisted — image containers only)

**Forbidden:**
- `text-[11px]`, `text-[13px]`, `text-[15px]` — use named scale
- `w-[Npx]` on elements containing translated text (locale risk)
- `max-w-[Npx]` — use canonical max-w-* tokens
- Any arbitrary value not in `tailwind-entropy.allowlist.json` for HIGH/CRITICAL risk areas

**Process for new arbitrary values:**
1. Can a canonical token replace it? If yes, use that.
2. If genuinely needed, add to `scripts/governance/tailwind-entropy.allowlist.json`.
3. Include: rule, file, pattern, reason, reviewer, expires date.

---

## §13 — HUGE DESKTOP UTILITY COMPOSITION

At 1536px+ (2xl:) the following MUST be true:

- All public listing pages: `.container-wide` bounds content at 88rem
- All listing card grids: `2xl:grid-cols-4` column step
- Section padding: `2xl:py-20` (optional but recommended for new sections)
- Section headings: `2xl:text-3xl` (optional but recommended for new H2s)
- Admin: content bounded by `max-w-[1800px]` or `max-w-screen-2xl`

**Whitespace wasteland definition:** Content occupies < 40% of horizontal space at 2560px.
Any public page causing a whitespace wasteland is a HIGH governance violation.

---

## §14 — LOCALIZATION-SAFE UTILITY COMPOSITION

All layouts MUST work for sq, en, uk, it. Ukrainian has the longest strings.

**Rules:**
- NEVER use fixed `w-[Npx]` on elements containing translatable text
- NEVER use `whitespace-nowrap` on button labels, nav items, or action labels
- ALWAYS use `flex-wrap` on toolbars that contain translatable content
- ALWAYS test with Ukrainian (uk) after any layout change
- For text that MUST be single-line: use `truncate` (implies overflow-hidden)

**Safe patterns:**
```
✅ flex flex-wrap gap-2          — locale-safe toolbar
✅ min-w-0 truncate              — locale-safe text truncation
✅ max-w-[200px] overflow-hidden truncate  — fixed width with safe truncation
```

**Unsafe patterns:**
```
❌ w-[180px]                     — breaks if label grows 30%
❌ whitespace-nowrap             — overflows at narrow viewports / long locales
❌ min-w-[120px] (on nav items)  — breaks Ukrainian navigation
```

---

## §15 — ICON / CONTROL DENSITY

Canonical icon sizes (lucide-react):

| Role | Class | px |
|---|---|---|
| Standard UI | `h-4 w-4` | 16px |
| Metadata | `h-3.5 w-3.5` | 14px |
| Tiny | `h-3 w-3` | 12px |
| Prominent | `h-5 w-5` | 20px |
| Section | `h-6 w-6` | 24px |
| Hero/CTA | `h-12 w-12` | 48px |

**Rule:** Inside `Button`: NEVER set `h-*` directly — CVA handles sizing automatically.
**Rule:** `shrink-0` is required on all icons in flex containers.
**Rule:** Icon-only buttons: `size="icon"` (40px desktop), `size="icon-xl"` (44px mobile).

---

## §16 — ALLOWLIST POLICY

File: `scripts/governance/tailwind-entropy.allowlist.json`

Every allowlist entry MUST include:
- `rule` — which governance rule is being excepted
- `file` — relative path to the file
- `pattern` — the specific Tailwind class pattern
- `reason` — why this exception is needed
- `reviewer` — who approved it
- `expires` — review date (max 6 months)
- `severity` — severity level if the exception were removed
- `why_safe` — why this exception is safe despite the rule

**Forbidden:**
- Blanket allowlisting entire directories
- Allowlisting without `reason` and `expires`
- Permanent allowlisting without review date
- Suppressing CRITICAL findings without explicit written justification

**Review cadence:** Quarterly — check all allowlist entries against current state.
