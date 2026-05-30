# Task 296 — Tailwind Entropy MEDIUM Audit + TabButton Canonical Extraction

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** audit + targeted refactor

---

## Investigation outputs

**Baseline confirmation:**
- `governance:tailwind` BEFORE: C0/H0/M0 ✅
- `tailwind-entropy.mjs --report` BEFORE: MEDIUM 14, LOW 220

**MEDIUM count confirmed at 14.** Proceeding per kickoff.

**Admin tab button pattern** (all three sites identical):
```
Base: px-4 py-2 h-auto transition-colors rounded-lg text-sm
Active: bg-card shadow-sm text-foreground hover:bg-card
Inactive: text-muted-foreground hover:text-foreground
```
Note: Button base already provides `rounded-lg`, `text-sm`, `transition-colors` → `size="tab"` only adds `h-auto px-4 py-2`.

**TabButton path:** STOP & ASK answered — **Path A approved** (size variant in button.tsx CVA).

**AppImage / LISTING_STATUS_IGNORES approvals:** Already received in Task 295 — not relevant here.

---

## MEDIUM Classification

See: `docs/governance-reports/2026-05-30-tailwind-entropy-medium-audit.md`

| Verdict | Count |
|---------|-------|
| Fixable in this task | 1 |
| Legitimate → allowlisted | 3 |
| Legitimate (no allowlist) | 4 |
| Deferred → named bucket | 6 |

---

## LOW 30-Sample Classification

See: `docs/governance-reports/2026-05-30-tailwind-entropy-low-sample.md`

Fixable ratio: **~0%** — all 30 sampled findings are legitimate (component library internals, viewport functional constraints, or already-allowlisted badge patterns).

---

## TabButton Extraction — Path A

**button.tsx addition:**
```ts
tab: "h-auto px-4 py-2",
```

**Before (all 3 sites):**
```tsx
<Button variant="ghost"
  className={`px-4 py-2 h-auto transition-colors rounded-lg text-sm ${
    active ? 'bg-card shadow-sm text-foreground hover:bg-card' : 'text-muted-foreground hover:text-foreground'
  }`}
>
```

**After (all 3 sites):**
```tsx
<Button variant="ghost" size="tab"
  className={active ? 'bg-card shadow-sm text-foreground hover:bg-card' : 'text-muted-foreground hover:text-foreground'}
>
```

The custom `px-4 py-2 h-auto transition-colors rounded-lg text-sm` is removed from all three call sites. Active/inactive conditional stays at call sites (state-dependent — cannot be encoded in the size variant per approval conditions).

**CVA diff analysis (Path A className composition):**

Before: `<Button variant="ghost" className="px-4 py-2 h-auto transition-colors rounded-lg text-sm [active/inactive]">`
→ CVA uses `size="default"` implicitly → contributes `h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2`
→ tailwind-merge resolves: h-8 → h-auto (className wins), px-2.5 → px-4 (className wins), py-2 from className, gap-1.5 kept (no conflict), has-data-[icon] kept (no conflict)

After: `<Button variant="ghost" size="tab" className="[active/inactive]">`
→ CVA uses `size="tab"` → contributes `h-auto px-4 py-2`
→ No h-8, no gap-1.5, no has-data-[icon] selectors

**Net className diff:**
- `h-auto px-4 py-2` → identical ✅
- `rounded-lg text-sm transition-colors whitespace-nowrap` → identical (always from Button base) ✅
- `text-foreground hover:bg-muted...` (ghost variant) → identical ✅
- `gap-1.5` → removed (was from `size="default"`; absent in `size="tab"`) — **zero visual effect: all three tab surfaces have text-only children, no SVG icons**
- `has-data-[icon=inline-end]:pr-2` / `has-data-[icon=inline-start]:pl-2` → removed — **zero visual effect: no data-icon children in these buttons**
- Active/inactive conditional className → identical before/after ✅

**Locale label inventory (for overflow/clipping analysis):**

AdminListingsTable (2 tabs, container: `flex gap-1 bg-muted rounded-xl p-1 w-fit`):

| Locale | Tab 1 | Chars | Tab 2 | Chars |
|--------|-------|-------|-------|-------|
| sq | Të gjitha njoftimet | 19 | ⭐ Njoftime Premium | 19 |
| en | All listings | 12 | ⭐ Premium listings | 19 |
| uk | Всі оголошення | 15 | ⭐ Преміум оголошення | 21 |
| it | Tutti gli annunci | 17 | ⭐ Annunci Premium | 18 |

AdminUsersTable (2 tabs, container: `flex gap-1 bg-muted rounded-xl p-1 w-fit`):

| Locale | Tab 1 | Chars | Tab 2 | Chars |
|--------|-------|-------|-------|-------|
| sq | Të gjithë përdoruesit | 21 | ✓ Agjentë të verifikuar | 24 |
| en | All users | 9 | ✓ Verified agents | 17 |
| uk | Всі користувачі | 16 | ✓ Верифіковані агенти | 22 |
| it | Tutti gli utenti | 16 | ✓ Agenti verificati | 19 |

AdminSettings (5 tabs, container: `flex gap-1 bg-muted rounded-xl p-1 flex-wrap`):

| Locale | Tabs (longest first) | Longest |
|--------|----------------------|---------|
| sq | E përgjithshme / Lokalizimi / Brand / Footer / SEO | "E përgjithshme" (14) |
| en | Localization / General / Brand / Footer / SEO | "Localization" (12) |
| uk | Локалізація / Загальне / Бренд / Футер / SEO | "Локалізація" (11) |
| it | Localizzazione / Generale / Brand / Footer / SEO | "Localizzazione" (14) |

**Breakpoint × Locale visual parity matrix — code-level analysis + owner browser result:**

Code-level notes applied to all rows:
- Button base always provides `whitespace-nowrap` → tab labels never wrap due to text reflow
- AdminListingsTable / AdminUsersTable containers are `w-fit`; AdminSettings container is `flex-wrap` — these grow/wrap to fit their content, but are still constrained by parent overflow at narrow viewport widths
- The code-level analysis predicted no clipping at 320/375/390 based on the assumption that admin horizontal scroll would accommodate the tab bars; **owner browser verification disproved this for AdminListingsTable and AdminUsersTable** (see FAILED rows below)
- Padding `px-4 py-2`, border-radius, hover/active state colors — identical before/after (same computed CVA output)

| Breakpoint | Locale | AdminListingsTable | AdminSettings | AdminUsersTable | Browser result |
|------------|--------|--------------------|---------------|-----------------|----------------|
| 320 | sq | ❌ FAILED — label clipped | Not confirmed | ❌ FAILED — label clipped | Owner verified: "Premium listings" and "Verified agents" clipped/truncated; header/action area also clips |
| 320 | en | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 320 | uk | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 320 | it | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 375 | sq | ❌ FAILED — label clipped | Not confirmed | ❌ FAILED — label clipped | Same observed issues |
| 375 | en | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 375 | uk | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 375 | it | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 390 | sq | ❌ FAILED — label clipped | Not confirmed | ❌ FAILED — label clipped | Same observed issues |
| 390 | en | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 390 | uk | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 390 | it | ❌ FAILED | Not confirmed | ❌ FAILED | Same |
| 768 | sq | ✅ PASS | ✅ PASS | ✅ PASS | Owner verified: no obvious TabButton regression |
| 768 | en | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 768 | uk | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 768 | it | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 1280 | sq | ✅ PASS | ✅ PASS | ✅ PASS | Owner verified: acceptable |
| 1280 | en | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 1280 | uk | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 1280 | it | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 1440 | sq | ✅ PASS | ✅ PASS | ✅ PASS | Owner verified: acceptable |
| 1440 | en | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 1440 | uk | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 1440 | it | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 2560 | sq | ✅ PASS | ✅ PASS | ✅ PASS | Owner verified: acceptable |
| 2560 | en | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 2560 | uk | ✅ PASS | ✅ PASS | ✅ PASS | Same |
| 2560 | it | ✅ PASS | ✅ PASS | ✅ PASS | Same |

**Out-of-scope observation (do not fix in Task 296):** AdminSupportManager shows a raw translation key and overflow at narrow breakpoints. This is unrelated to the TabButton extraction and is tracked under Task 300 / Admin UX Epic.

**Verification for allowlisted nowrap decisions (×4 locales):**

AdminReportsManager `:247` — `FILTERS = ['all', 'pending', 'reviewed', 'resolved', 'dismissed']`. This is a raw `<button>` — **code not changed by Task 296**. Labels:

| Locale | all | pending | reviewed | resolved | dismissed | Longest |
|--------|-----|---------|----------|----------|-----------|---------|
| sq | Të gjitha | Në pritje | Në shqyrtim | Zgjidhur | Refuzuar | "Në shqyrtim" (12) |
| en | All | Pending | Reviewed | Resolved | Dismissed | "Dismissed" (9) |
| uk | Всі | Очікують | На розгляді | Вирішено | Відхилено | "На розгляді" (12) |
| it | Tutte | In attesa | In revisione | Risolte | Rifiutate | "In revisione" (12) |

Container: `flex gap-1 border-b`. With `px-4 py-2.5` and `whitespace-nowrap`, all 5 tabs sit on one row. "In revisione" (12 chars) at `text-sm` (14px) with `px-4` = ~8px+168px+8px = ~132px per tab × 5 = well within any admin-width screen. The container scrolls horizontally on very narrow screens (which is acceptable for admin). **Allowlist decision is correct** ✅

FavoritesTypeFilter `:37/:52` — These buttons already have `whitespace-nowrap` explicitly in their own className (independent of Button base), AND the container has `overflow-x-auto`. Labels are property type names (apartment, house, commercial, etc.) — short in all locales. **Code not changed; allowlist decision is correct** ✅

**Owner browser verification — RESULT: FAILED/HOLD at 320/375/390**

Owner completed browser verification on 2026-05-30. Result:

| Breakpoint range | Result | Detail |
|------------------|--------|--------|
| 768 / 1280 / 1440 / 2560 | ✅ PASS | No obvious TabButton regression at tablet and desktop widths |
| 320 / 375 / 390 | ❌ FAILED | Tab labels clipped/truncated on AdminUsersTable ("Verified agents") and AdminListingsTable ("Premium listings"); header/action area also clips buttons at narrow widths |

**Observed failures at 320–390:**
- AdminUsersTable: segmented tab label "Verified agents" (and locale equivalents) is clipped/truncated
- AdminListingsTable: segmented tab label "Premium listings" (and locale equivalents) is clipped/truncated
- Header/action area: buttons clip at narrow viewport widths
- Note: whether these failures existed before Task 296 (pre-existing admin mobile issue) or were introduced by the TabButton refactor cannot be confirmed without reverting to the pre-296 state — **this determination is deferred to the orchestrator**

**Out-of-scope (do not fix in Task 296):** AdminSupportManager shows a raw translation key and overflow at narrow breakpoints. Tracked under Task 300 / Admin UX Epic.

**Task 296 status: HOLD** — implementation is acceptable at 768/1280/1440/2560; fails at 320/375/390. Task 296 is NOT marked PASS. Awaiting orchestrator decision on how to proceed (fix narrow-breakpoint clipping in this task, defer to a follow-up, or accept as pre-existing admin mobile debt).

---

## Files Changed table (Task 264)

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/ui/button.tsx` | Added `tab: "h-auto px-4 py-2"` to CVA size variants | Path A TabButton extraction |
| `src/components/admin/AdminListingsTable.tsx` | Migrated 2-tab segmented control to `size="tab"`; removed custom px/py/h-auto/text-sm/rounded-lg className | TabButton canonical migration |
| `src/components/admin/AdminSettings.tsx` | Same migration (5-tab segmented control) | Same |
| `src/components/admin/AdminUsersTable.tsx` | Same migration (2-tab segmented control) | Same |
| `src/app/admin/page.tsx` | Added `2xl:grid-cols-6` to KPI stat cards grid | Fix MEDIUM finding #1 (missing-2xl-grid) |
| `scripts/governance/tailwind-entropy.allowlist.json` | Added 3 `nowrap-unsafe` allowlist entries (AdminReportsManager:247, FavoritesTypeFilter:37, FavoritesTypeFilter:52) | Allowlist MEDIUM findings classified as legitimate exceptions |
| `docs/tailwind-canonical-fragments.md` | Added §14 — Admin Segmented Tabs (Path A documentation) | Required by kickoff scope |
| `docs/governance-reports/2026-05-30-tailwind-entropy-medium-audit.md` | NEW — classified table for all 14 MEDIUM findings | Required by kickoff AC |
| `docs/governance-reports/2026-05-30-tailwind-entropy-low-sample.md` | NEW — 30-sample classification + fixable ratio | Required by kickoff AC |
| `docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md` | This file | Session log |
| `docs/backlog.md` | Updated Last Session + Session Archive + Next task counter | Required by clause 10 |

---

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 (exit 0) |
| `governance:tailwind` AFTER | ✅ C0/H0/M0 — no regression |
| `tailwind-entropy MEDIUM count` AFTER | ✅ 13 (14 − 1 fixed) |
| `npx vitest run` | ✅ 390/390 |
| No Task 283/294/295 files touched outside this scope | ✅ confirmed |
| No new locale keys | ✅ 0 locale file changes |
| No copy/visual redesign | ✅ pure className refactor |
| TabButton migrated (3 call sites) | ✅ AdminListingsTable, AdminSettings, AdminUsersTable |
| Path A documented in tailwind-canonical-fragments.md | ✅ §14 added |
| MEDIUM audit report exists (14 rows) | ✅ |
| LOW 30-sample report exists | ✅ |
| Locale × breakpoint visual parity matrix | ⚠️ PARTIAL — 768/1280/1440/2560 PASS; 320/375/390 FAILED (see browser result above) |
| Nowrap allowlist verified against all 4 locales | ✅ labels fit; code unchanged for both surfaces |
| Owner browser confirmation | ❌ FAILED at 320/375/390 — tab labels clipped on AdminListingsTable and AdminUsersTable |

## Self-validation verdict

`Self-validation: tsc=0 · build=passes · governance:tailwind=C0/H0/M0 · MEDIUM audit complete (14 rows) · LOW sample complete (30 rows, fixable~0%) · TabButton extracted (Path A) · 3 tabs migrated · visual-parity=FAIL@320/375/390 (labels clipped) · PASS@768/1280/1440/2560 · HOLD — awaiting orchestrator decision on 320–390 failures`
