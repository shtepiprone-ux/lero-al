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
| Toast / Gallery | `z-[100]` | Sonner toasts; ListingGallery full-screen overlay (allowlisted) |
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

## §17 — GLOBAL RETIREMENT READINESS (Task 771)

Read-only Level-4 decision record for Sprint 65. **This section deletes nothing, removes nothing, and authorizes no
removal.** Full command transcripts are retained in `docs/sessions/evidence/task771/`.

### 17.1 Verdict

**`NOT_READY`**

- Audited SHA: `960e78c50` (`docs(task771): correct native evidence commands`, branch `main` → `origin/main`).
- Execution date: 2026-08-27.
- Reason: **B1–B4 measured non-empty at the audited SHA.** No task state or route-certification question enters
  this formula.

### 17.2 Predecessor baseline

The standard output of `git --no-optional-locks status --porcelain` was empty before any Task-771 repository path
was written. `preflight-git.txt` separately retains two harmless stderr warnings about an unreadable user Git ignore
file; no porcelain path was emitted. The audited commit tracks
`scripts/check-homepage-theme-runtime-deps.mjs` and contains `src/app/globals.css:370`'s
`--homepage-runtime-space-0` token, confirming Task 770 is present.

| Exact command | Exit | Evidence |
|---|---:|---|
| `npm.cmd run check:homepage-literal-utilities` | 0 | `preflight-gates.txt` |
| `npm.cmd run check:tailwind-runtime-tokens` | 0 | `preflight-gates.txt` |
| `npm.cmd run check:tailwind-runtime-tokens:verify-gate` | 0 (10/10 assertions) | `preflight-gates.txt` |
| `npm.cmd run check:homepage-theme-runtime-deps` | 0 | `preflight-gates.txt` |
| `npm.cmd run check:homepage-theme-runtime-deps:verify-gate` | 0 (6/6 assertions) | `preflight-gates.txt` |

### 17.3 B1 — build wiring

`src/app/globals.css` has seven compiler directives: `@import` at lines 1–3, `@source` at lines 11, 12 and 25,
and `@custom-variant` at line 27. `postcss.config.mjs` contains only `{"@tailwindcss/postcss": {}}`.
`package.json` retains `tailwindcss ^4`, `@tailwindcss/postcss ^4`, `tw-animate-css ^1.4.0`, `shadcn ^4.3.0`,
`class-variance-authority ^0.7.1`, `clsx ^2.1.1`, and `tailwind-merge ^3.5.0`.

Exact commands:

```powershell
Select-String -Path src/app/globals.css -Pattern '^@(import|source|custom-variant|plugin|config)' | Select-Object LineNumber, Line
Get-Content postcss.config.mjs
Select-String -Path package.json -Pattern 'tailwindcss|@tailwindcss/postcss|tw-animate-css|"shadcn"|class-variance-authority|clsx|tailwind-merge'
```

No drift from kickoff §3.2 B1. Evidence: `b1-build-wiring.txt`.

### 17.4 B2 — `@apply`

`src/app/globals.css` has **10 live `@apply` rules** at lines 612, 616, 629, 635, 640, 641, 642, 651, 655 and
660. The exact search below returns six other source hits, and opening every site confirms each is a comment:
`CaptchaWidget.tsx:32`, `NotificationItem.tsx:214`, `NotificationCenter.tsx:57`,
`PasswordRequirementsHint.tsx:53`, `FooterView.module.css:23`, and `MobileNavDrawer.tsx:52`. There are zero live
rules outside `globals.css`.

```powershell
(Select-String -Path src/app/globals.css -Pattern '@apply').Count
Select-String -Path src/app/globals.css -Pattern '@apply' | Select-Object LineNumber, Line
rg.exe -n '@apply' src --glob '!src/app/globals.css'
```

No drift from kickoff §3.2 B2. Evidence: `b2-apply.txt`.

### 17.5 B3 — the `@theme inline` alias layer

The sanctioned temporary probe reports **185** `@theme inline` names, **111** plain `:root` names, and **zero
overlap**. Eight files retain **18 (file, name) pairs / 27 uses**, including four Storybook uses:

| File | Pairs / uses | Names |
|---|---:|---|
| `src/app/[locale]/listings/[slug]/loading.tsx` | 3 / 3 | `--listing-gallery-h-{mobile,tablet,desktop}` |
| `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` | 3 / 6 | same three |
| `src/modules/listings/components/GalleryStaticFrame.tsx` | 3 / 3 | same three |
| `src/modules/listings/components/ListingGallery.tsx` | 3 / 3 | same three |
| `src/components/shared/PerfDevOverlay.tsx` | 2 / 3 | `--color-status-success`, `--color-status-warning` |
| `src/components/ui/button.tsx` | 1 / 4 | `--radius-md` |
| `src/design-system/mantine/input-chrome.css` | 1 / 1 | `--color-input` |
| `src/stories/mantine/primitives/HeroSearch.stories.tsx` | 2 / 4 | `--space-16`, `--space-24` |
| **Total** | **18 / 27** | |

`PerfDevOverlay.tsx` remains D65-A-pending and out of scope. `HeroSearch.stories.tsx` remains the deliberate
Task-770 divergence; it is recorded here, not repaired.

```powershell
node.exe $env:TEMP\task771-theme-inline-census.mjs (Get-Location).Path
```

No drift from kickoff §3.2 B3. Evidence: `b3-theme-inline-census.txt`, `b3-probe-source.mjs.txt`.

### 17.6 B4 — the utility-class consumer surface (census, not certification)

| Measure | Kickoff value | Measured value | Drift |
|---|---:|---:|---|
| Files containing a literal `className="` | 152 | 152 | none |
| Lines containing a literal `className="` | 2350 | 2350 | none |
| Files referencing `@/components/ui/` (stories excluded) | 102 | 102 | none |
| Files referencing `@/components/ui/` (stories included) | 110 | 110 | none |
| Files in `src/components/ui/` | 49 (45 `.tsx`, 3 `.ts`, 1 `.css`) | 49 (45 `.tsx`, 3 `.ts`, 1 `.css`) | none |

```powershell
rg.exe -l 'className="' src -g '*.tsx' -g '!*.stories.tsx' | Measure-Object -Line
rg.exe 'className="' src -g '*.tsx' -g '!*.stories.tsx' | Measure-Object -Line
rg.exe -l '@/components/ui/' src -g '!*.stories.*' | Measure-Object -Line
rg.exe -l '@/components/ui/' src | Measure-Object -Line
(Get-ChildItem src/components/ui -File | Measure-Object).Count
rg.exe -l 'className="' src -g '*.tsx' -g '!*.stories.tsx'
```

Distribution by top-level area (152 files): `modules/listings` 48 · `components/admin` 33 · `app/admin` 17 ·
`components/ui` 14 · `components/shared` 12 · `app/[locale]` 11 · `modules/cabinet` 5 ·
`design-system/mantine` 4 · `components/layout` 4 · `modules/auth` 2 · `modules/contacts` 1 ·
`components/listing` 1.

Amendment 2 replaces the invalid `npx.cmd rg` invocation with native `rg.exe`; no substitute script is used. The
two earlier `-2` counts were caused by a narrowed `.tsx`-only substitute and the earlier `+25` counted occurrences,
not lines. **The bound, stated verbatim:** this is an order-of-magnitude census of literal `className` strings. It
does **not** classify each string as a Tailwind utility, does not distinguish a live route from dead code, and is
**not** a route certification. Its only claim is that the utility-class consumer surface outside the Homepage is
large and unmeasured — which is sufficient to refuse `READY`, and insufficient to schedule the work.

The `app/[locale]` 11-vs-0 asymmetry is not a contradiction: the Homepage gate guards three files, while this
census counts a directory. Evidence: `b4-utility-census.txt`.

### 17.7 Accepted limitation — no route-composition CI certification

No route-composition CI certification exists, and none will be built on the unsupported React DOM→component mapping.
Per the owner decision of 2026-08-27, Sprint 59 closed as mechanism rejected and Task 667 is retired; see
`docs/maintenance-playbook.md` §14.3 and the 2026-08-27 `docs/backlog-archive.md` row.

This is an **accepted limitation**, not a blocker and not a task state; it does not enter the §17.1 formula.
Task 771 preserves D65-C's non-duplication boundary: it does not certify a route or create a replacement route
task. The replacement control is **task-scoped real-route evidence**: a route-critical kickoff names the route, locales,
viewports and measured property, and its executor produces that evidence. Never cite a permanent global CI claim
for route composition or present a component-scoped gate as route certification.

### 17.8 Gate bounds

| Gate | Actual scope | What it cannot say |
|---|---|---|
| `check:homepage-literal-utilities` | 3 guarded files | Nothing about the other 149 B4 files |
| `check:tailwind-runtime-tokens` | 25 `src/**/*.module.css` files and 2 fixed runtime TSX files | Nothing about unlisted TSX or route coverage |
| `check:homepage-theme-runtime-deps` | 12 migration inputs and 1 expected-zero input | Nothing about the 8 B3 files |

`governance:tailwind` is not retirement evidence. Its ten HIGH findings are comment sites: `theme.ts` lines 282,
296, 400, 607, 632, 633, 828, 843 and 844, plus `MantineDataTableToCards.tsx:250`. It was not run by this task.

### 17.9 Conditions for a future `READY` audit

1. A disposition exists for all 185 `@theme inline`-only names.
2. The ten live `@apply` rules are removed or re-homed to compiler-independent CSS.
3. A decided answer exists for the 18 residual reads, including D65-A.
4. An evidenced classification exists for the B4 literal-`className` surface.

Route-composition certification is an accepted limitation, not a condition. *None of these is authorized, scheduled
or numbered by Task 771.*

### 17.10 What this record does not authorize

No `@import`, `@apply`, `@source`, `@custom-variant`, dependency, PostCSS-plugin, token or story change is
authorized by this record; nothing here certifies a route; a future audit is re-designed against its own baseline,
not against these numbers.
