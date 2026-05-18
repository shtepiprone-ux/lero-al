# Tailwind Utility Entropy Audit — Lero.al
**Phase 3 of Future Maintenance Direction Epic**
Audit date: 2026-05-18
Status: BASELINE AUDIT — establishes governance starting point

This document records the state of Tailwind utility entropy at the time governance was established.
Future audits should compare against these numbers using `npm run governance:tailwind`.

---

## §1 — ENTROPY SUMMARY

| Metric | Value |
|---|---|
| Total files scanned | 218 |
| Files with className | 141 (65%) |
| Unique arbitrary tokens | 91 |
| Total arbitrary occurrences | 162 |
| Duplicated utility chains detected | 5 patterns |
| Fragment clones (button/dialog) | 6 |
| Overflow / truncation risks | 3 |
| Responsive drift findings | 1 |
| Huge desktop risks | 4 |
| Total entropy findings | 226 (all categories) |

### Severity at Baseline (2026-05-18)
| Severity | Count |
|---|---|
| CRITICAL | 3 (custom dialog overlays — also tracked in primitives scan) |
| HIGH | 4 (button/tab clones, overflow+width combos) |
| MEDIUM | 12 |
| LOW | 192 |
| INFO (dynamic review) | 15 |

---

## §2 — DUPLICATED UTILITY FRAGMENT INVENTORY

| Fragment Type | Utility Chain | Occurrences | Files | Severity | Canonical Replacement | Migration Complexity | Regression Risk |
|---|---|---|---|---|---|---|---|
| Admin/content card | `bg-card rounded-2xl border shadow-sm` | 26 | 15+ | MEDIUM | Extract to `.card-content` CSS utility | LOW | LOW |
| Listing card | `bg-card rounded-xl border` | 3 | 3 | MEDIUM | Consistent — acceptable at current scale | LOW | LOW |
| Standard section | `py-12 md:py-16` | 5 | 5 | LOW | Canonical pattern — consider `.section-standard` | LOW | NONE |
| Container (public) | `container mx-auto px-4` | 19 | 9 | MEDIUM | Replace with `.container-wide` on public pages | LOW | LOW |
| Toolbar row | `flex items-center gap-2` | 82 | 40+ | LOW | Common pattern — acceptable | NONE | NONE |

**Key finding:** `bg-card rounded-2xl border shadow-sm` appears 26+ times. This is the strongest candidate for extraction to a CSS utility class (`.card-content`) in `globals.css`. Migration is LOW complexity and LOW regression risk.

---

## §3 — ARBITRARY VALUE INVENTORY

### High-frequency patterns

| Token | Occurrences | Category | Severity | Justification | Action |
|---|---|---|---|---|---|
| `text-[10px]` | 29 | font-size | CANONICAL | Micro label — canonical per ui-rules.md §2 | None |
| `text-[11px]` | 12 | font-size | LOW | Near-canonical — use `text-xs` | LOW: migrate when touching |
| `min-h-[44px]` | 6 | height | CANONICAL | Touch target — canonical per ui-rules.md §8 | None |
| `max-h-[90vh]` | 5 | height | CANONICAL | Modal cap — canonical | None |
| `h-[340px]` | 5 | height | ALLOWLISTED | LCP gallery frame — `app/layout.tsx` CLS prevention | Allowlisted |
| `h-[420px]` | 4 | height | ALLOWLISTED | Gallery container — image-only context | Allowlisted |
| `h-[500px]` | 4 | height | ALLOWLISTED | Gallery full-size — image-only context | Allowlisted |
| `aspect-[4/3]` | 4 | ratio | LOW | Image aspect — acceptable | None |
| `max-w-[200px]` | 3 | width | MEDIUM | May break with long locale text | Review context |
| `max-w-[160px]` | 3 | width | MEDIUM | Same as above | Review context |

### Summary by category
| Category | Count | CANONICAL | ALLOWLISTED | Needs Review |
|---|---|---|---|---|
| Arbitrary font size | 12 | 1 (`text-[10px]`) | 0 | 11 (`text-[11px]` etc.) |
| Arbitrary height | 18 | 1 (`min-h-[44px]`) | 3 (gallery) | 14 |
| Arbitrary width | 9 | 0 | 0 | 9 |
| Arbitrary max-height | 6 | 1 (`max-h-[90vh]`) | 0 | 5 |
| shadcn data-attributes | ~80 | SHADCN INTERNAL | — | 0 |

---

## §4 — RESPONSIVE UTILITY DRIFT INVENTORY

| File | Line | Pattern | Base | sm | md | lg | xl | 2xl | Action |
|---|---|---|---|---|---|---|---|---|---|
| `src/app/admin/page.tsx` | 119 | `xl:grid-cols-6` without 2xl: | ✅ | ✅ | – | ✅ | ✅ | ❌ | Add `2xl:` step for huge desktop |

**Assessment:** Only 1 responsive drift finding in the entire codebase — excellent mobile-first discipline maintained.

**Note:** The admin stats grid (`xl:grid-cols-6`) intentionally doesn't have a 2xl: step because 6 columns is already the maximum density. The baseline accepts this as MEDIUM (no blocking).

---

## §5 — LOCALIZATION RISK INVENTORY

| File | Line | Pattern | Locales | Risk Type | Severity | Action |
|---|---|---|---|---|---|---|
| `src/components/layout/Header.tsx` | 129 | `max-w-[160px]` | sq, uk | Width may clip nav label | MEDIUM | Use `max-w-xs` or remove constraint |
| `src/components/layout/Footer.tsx` | 25 | `max-w-[200px]` | uk | Fixed width on footer column | MEDIUM | Use `max-w-sm` or `w-full` |
| `src/components/shared/DatePicker.tsx` | 101 | `w-[280px]` | uk | Calendar popup fixed width | LOW | Calendar UI — acceptable |
| Various admin | multiple | `max-w-[Npx]` | uk | Dialog/table fixed widths | MEDIUM | Review with Ukrainian locale |

**All 4 locales (sq, en, uk, it) validated:**
- Key count parity: ✅ all 4 files have 852 keys
- Ukrainian is the highest-risk locale (longest strings)
- No missing locale files

---

## §6 — HUGE DESKTOP RISK INVENTORY

| File | Pattern | 1720px Risk | 1920px Risk | 2560px Risk | Ultrawide Risk | Action |
|---|---|---|---|---|---|---|
| `src/app/[locale]/listings/page.tsx` | `min-h-screen` wrapper without `.container-wide` | LOW | MEDIUM | HIGH | HIGH | Add `.container-wide` to content wrapper |
| `src/app/[locale]/favorites/page.tsx` | Same as above | LOW | MEDIUM | HIGH | HIGH | Same fix |
| `src/app/admin/page.tsx` | Admin shell without max-width | LOW | LOW | MEDIUM | MEDIUM | Add `max-w-[1800px]` to admin shell |
| `src/app/[locale]/listings/create/page.tsx` | `min-h-screen bg-muted/30` without container | LOW | LOW | MEDIUM | MEDIUM | Add `container-wide` to form |

**Note:** Homepage, listing detail, cabinet, auth are properly bounded. Listings/favorites pages use `min-h-screen` at the root but listing grid has `container-wide` — the risk is in the background color stretching, not content. LOW priority.

---

## §7 — MANUAL REVIEW INVENTORY (Dynamic Class Composition)

| File | Line | Pattern | Reason | Action |
|---|---|---|---|---|
| `src/components/admin/AdminListingsTable.tsx` | 206 | Ternary className `px-4 py-2 rounded-lg text-sm font-medium` | Dynamic active state | Migrate to shadcn Tabs |
| `src/components/admin/AdminSettings.tsx` | 126 | Same pattern | Dynamic tab state | Migrate to shadcn Tabs |
| `src/components/admin/AdminUsersTable.tsx` | 93 | Same pattern | Dynamic tab state | Migrate to shadcn Tabs |
| `src/modules/listings/components/ListingsShell.tsx` | multiple | Dynamic grid class | View toggle (list/grid) | Acceptable — documented |
| Various | multiple | `cn(...)` with variables | Standard cn() composition | Acceptable pattern |

**Assessment:** Dynamic classes are primarily from tab button patterns (3 files) that should be migrated to shadcn Tabs (tracked in component-governance.md §2). All other dynamic compositions are acceptable.

---

## §8 — GOVERNANCE STATUS

### Current Blockers (CI-blocking)
None — all existing findings are within baseline.

### Priority 1 (Fix in next cleanup sprint)
| Finding | Severity | Files | Effort |
|---|---|---|---|
| Local tab buttons (px-4 py-2 rounded-lg font-medium) | HIGH (fragment clone) | 3 | MEDIUM |
| Custom dialog overlays | HIGH→CRITICAL | 3 | MEDIUM |

### Priority 2 (Medium-term)
| Finding | Severity | Files | Effort |
|---|---|---|---|
| `container mx-auto px-4` on public pages | MEDIUM | 9 | LOW |
| `bg-card rounded-2xl border shadow-sm` extraction | MEDIUM | 15+ | LOW |

### Priority 3 (Opportunistic)
| Finding | Severity | Notes |
|---|---|---|
| `text-[11px]` → `text-xs` | LOW | 12 occurrences, trivial to fix |
| `max-w-[Npx]` localization review | MEDIUM | 9 admin files |

---

## §9 — TOOLING REFERENCE

| Command | Purpose |
|---|---|
| `npm run governance:tailwind` | CI gate — baseline comparison, fails on regression |
| `node scripts/governance/tailwind-entropy.mjs` | Deep analysis — 7 categories, 226 findings |
| `node scripts/governance/tailwind-entropy.mjs --report` | Full analysis + JSON + Markdown report |
| `npm run governance:report` | Full governance scan including Tailwind, writes weekly report |

**Allowlist:** `scripts/governance/tailwind-entropy.allowlist.json` — 4 documented exceptions (gallery heights, dev overlay z-index).
