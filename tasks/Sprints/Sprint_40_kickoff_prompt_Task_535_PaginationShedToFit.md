# Task 535 — Pagination: single-line shed-to-fit (ResizeObserver) + ≥44px tap target

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-diff, emit commits).
> **Origin:** owner directives 2026-07-03 — (1) "пагінація не може переходити на інший рядок, вона завжди
> має бути на одному рядку; якщо не влазить — прибрати зайві елементи (сусідні сторінки, потім останню
> сторінку)"; (2) mechanism chosen = **dynamic shed-to-fit via ResizeObserver**; (3) ≥44px mobile tap target
> (the earlier Task 534 decision).
> **SUPERSEDES Task 534** — its ≥44px requirement is folded here, because control size and the shed algorithm
> are one coherent behavior of one component (wider ≥44px controls overflow sooner, so the shed logic needs
> that exact width). Do NOT execute Task 534 separately; mark it superseded.
> **Type:** UI / custom Mantine component / responsive. **Chrome is already correct (Task 533) — DO NOT restyle.**
> This task changes LAYOUT (single-line, shed-to-fit) + SIZE (≥44px mobile), not colors/borders/radius.

## Current state (verified 2026-07-03)

- The only consumer is `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` (L111–120):
  `<Pagination total={totalPages} value={currentPage} onChange={onPageChange} color="brand" size={isMobile ? 'sm' : 'md'} />`
  inside `<Group justify={isMobile ? 'center' : 'flex-end'}>`.
- Mantine's stock `<Pagination>` renders its controls in an internal `Group` that **wraps by default** → at 320px
  the cluster spills onto a 2nd line (owner screenshot: `10 >` wraps). This wrap is the defect.
- Chrome comes from Task 533: `theme.components.Pagination/PaginationNext/PaginationPrevious` + `pagination-chrome.css`
  (active `#EC5447`/white, edge white/gray-300 border, inactive transparent/gray-700, 8px radius, gap 8px). **Reuse
  as-is. Do NOT touch these chrome rules.**
- Control renders at 32px stock (size-agnostic) — below the ≥44px P0 mobile tap target (this task fixes it on mobile).

## Required after-behavior — a canonical shed-to-fit Pagination

Create a canonical wrapper primitive (suggested `MantinePagination`, in
`src/design-system/mantine/patterns/` next to the other Mantine patterns; final name at your discretion but
document it). It composes **`Pagination.Root`** (NOT the all-in-one `<Pagination>`) so you control exactly which
items render, and exposes the SAME prop surface the consumer already passes:
`{ total, value, onChange, color?, size?, ... }`. Then swap the consumer from `<Pagination>` → `<MantinePagination>`
(same props) — this is the only consumer edit.

### Rule 1 — NEVER wrap, NEVER horizontal-scroll
- The controls row is `flex-nowrap` and its container is `overflow: hidden` (no scrollbar). It must be
  physically impossible to reach a 2nd line or an h-scroll at ANY width ≥ the 320px floor.

### Rule 2 — dynamic shed-to-fit (ResizeObserver)
- A `ResizeObserver` on the container measures available inner width. Measure one rendered control's real width
  (including gap) rather than hardcoding — item width depends on size (≥44px mobile / consumer size desktop) and
  on the widest visible page-number's digit count (e.g. `10`, `250`). Prev + Next are always present and reserved
  in the budget first.
- Compute the largest visible set that fits, then render exactly that set via `Pagination.Root` children
  (`Pagination.Previous`, computed `Pagination.Control` items + `Pagination.Dots`, `Pagination.Next`) — so the
  shed can be **asymmetric** (Mantine's stock `boundaries` is symmetric and cannot "keep first, drop last"; that
  is why `Pagination.Root` composition is required, not just lowering the `siblings`/`boundaries` numeric props).

### Rule 3 — shed PRIORITY ladder (apply in order until it fits)
1. Reduce **siblings** (pages either side of current) from the desktop default down to 0.
2. Drop the **trailing (last-page) boundary + its dots** — keep leading first-page + dots + current.
3. Drop the **leading (first-page) boundary + its dots** if it still overflows.
4. **Floor (never shed):** `Prev · current · Next`. current is always shown; Prev/Next always present (disabled at
   the boundaries, per Mantine). If even the floor cannot fit at 320 with long numbers → STOP and ASK (do not add
   an h-scroll or shrink below the ≥44px tap target to force it).

### Rule 4 — SSR-safe, grow-not-shrink (no hydration mismatch, no wrapped first paint)
- Server render and the FIRST client render (pre-measurement) MUST be identical → initialise to a **conservative
  minimal set** that is guaranteed never to wrap at 320px (e.g. siblings=0, boundaries=1 → `Prev · 1 · … · current
  · … · last · Next`, ~7 controls). Then the `ResizeObserver`/`useLayoutEffect` **grows** the visible set to fill
  wider containers. Growing (not shrinking) from the SSR default guarantees the first paint never wraps even
  before JS runs, and avoids a hydration mismatch. A minimal post-mount adjustment to add items on wide screens is
  acceptable; a wrapped or overflowing first paint is NOT.
- With JS disabled entirely, the conservative default renders and still never wraps.

### Rule 5 — ≥44px mobile tap target (folds Task 534)
- Below 640px every pagination control (numbers + Prev/Next + the visible dots container's clickable siblings)
  is **≥44×44px**. Desktop (≥640) stays governed by the consumer's `size` prop (size-agnostic) — same
  owner decision as Task 534 (mobile-only floor, do NOT hard-pin desktop size and regress the consumer). Prefer a
  `@media (max-width:639.98px)` min-size in `pagination-chrome.css` (matching how 533 scoped chrome) over a
  `theme.ts` `size` change. Re-verify the ≥44px items feed into the shed budget (bigger items → fewer fit).

## Scope (files expected)

- NEW `src/design-system/mantine/patterns/MantinePagination.tsx` — the shed-to-fit component.
- `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` — swap `<Pagination>` → `<MantinePagination>`
  (import change + element swap; keep the `Group justify` wrapper and all props).
- `src/design-system/mantine/pagination-chrome.css` — add the `@media (max-width:639.98px)` ≥44px min-size block
  (Task 534's content, folded). No other chrome change.
- `src/stories/mantine/primitives/Pagination.stories.tsx` — update so clusters render via `MantinePagination`;
  the mobile-compact cluster must now demonstrate **single-line, no-wrap, no h-scroll** at 320; add a "very long
  total (e.g. 250)" cluster to exercise the shed ladder. Keep the Mantine proof path + localized aria.
- Possibly `messages/{sq,en,uk,it}.json` — ONLY if you introduce any new visible/aria string (e.g. a "page X of Y"
  is NOT required here; keep the existing `storybook.mantine.pagination_*` aria keys). Maintain 4-locale parity.
- `docs/mantine-tailadmin-migration-tracker.md` (P1.13 status), `docs/backlog.md` (orchestrator handles), session log.

Do NOT touch the Task 533 chrome rules, other theme blocks, or `pagination.tsx` (legacy shadcn).

## Positive flow (happy path)

- **Actor:** admin user on a paginated surface, any of 7 breakpoints × 4 locales.
- **Steps → expected:**
  1. Page loads → pagination renders on ONE line, no wrap, no h-scroll, at every width incl. 320px.
  2. Wide desktop → full set (siblings + both boundaries) shown, right-aligned as today.
  3. As width shrinks → items shed in the Rule-3 order; current page, Prev, Next always remain; active pill +
     chrome (§6l) unchanged.
  4. Tap a number / Prev / Next → `onChange(page)` fires exactly as before (behavior identical to stock).
  5. Mobile <640 → every control ≥44×44px; row centered (existing `Group justify="center"`).
- **Success:** single line at all widths; `onChange` parity; §6l chrome intact; ≥44px mobile.

## Negative flow (every off-happy-path branch)

- **Overflow at 320 with long numbers (e.g. total=250, current=137):** shed ladder reduces to the floor; if the
  floor still overflows → STOP and ASK (no h-scroll, no sub-44px shrink).
- **single page (total=1):** renders Prev·1·Next, both edges disabled, no crash, one line.
- **boundary pages (current=1 / current=last):** Prev/Next disabled respectively; still one line; shed unaffected.
- **Rapid resize / container animation:** ResizeObserver debounced enough to avoid thrash; no infinite
  measure→render→measure loop (guard: only re-render when the computed visible set actually changes).
- **JS disabled / pre-hydration:** conservative default renders, never wraps (Rule 4).
- **Locale switch (sq/en/uk/it):** aria strings update; no layout break; long-locale does not force a wrap
  (numbers are locale-invariant, but verify).
- **onChange undefined (story/no-op):** no crash.

## Acceptance criteria (render- or diff-verifiable)

1. `MantinePagination` built on `Pagination.Root`, `flex-nowrap` + `overflow:hidden`, never wraps/scrolls —
   *Positive 1*, diff + rendered.
2. ResizeObserver measures width and sheds per the Rule-3 ladder (siblings → trailing boundary → leading
   boundary → floor), asymmetric via composed children — *Positive 3 / Negative overflow*, diff.
3. SSR-safe conservative default + grow-on-measure; no hydration warning; no wrapped first paint — *Rule 4*,
   diff + a note/console-clean transcript.
4. ≥44px on every control at <640; desktop size-agnostic (no `theme.ts` `size` pin) — *Positive 5*, diff + computed.
5. Consumer swapped to `MantinePagination`, props preserved, `onChange`/`value` behavior identical —
   *Positive 4*, diff (`MantineAdminSurfacePattern.tsx`).
6. §6l chrome UNCHANGED (no color/border/radius/gap edit) — diff shows only layout/size additions.
7. **Rendered matrix**: 320/375/390/768/1280/1440/2560 × sq/en/uk/it, uk@320/375/390 mandatory, each cell proving
   single-line + no h-scroll + ≥44px(<640); plus a long-total (250) cell exercising the shed ladder. Machine-
   produced (`responsive-screenshots --assert` / `--mantine-only`) — self-reported = auto-reject.
8. Planted-violation FAIL transcript that is REAL (e.g. force `flex-wrap:wrap` or disable the shed → gate FAILs
   with wrap/overflow at 320; revert → green). The Task 533 log noted the stock Group wraps — the new gate must
   catch a wrap, unlike before.
9. **Regression (clause 15):** admin-table paging is a real nav flow — scan `docs/critical-flow-registry.md`; add
   a test (or extend one) proving `onChange`/`value` still navigate AND an assertion the row never wraps/overflows
   at 320. If no registry row exists, add one (this task adds real logic, unlike chrome-only Task 533). CI-runnable;
   FAILs on a planted violation.
10. Gates green: `tsc=0`, `check:stories`, `check:i18n` (4-locale parity), `check:design-tokens:strict`,
    `check:mojibake`, `check:file-integrity`, `build-storybook`, `screenshots:assert --mantine-only`.
11. Session log: AC-by-AC audit citing Positive+Negative flows; before/after control inventory; Files-Changed
    table; self-validation verdict. **No `git add`/`git commit` by Sonnet** — orchestrator emits at review.

## Pre-read (rule-index → UI/layout/component task)

Always: `docs/agent-contract.md` (1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (paging flow).
UI: `docs/mantine-responsive-design-system.md` (§7 mobile gate, §12 canonical patterns, §18 CSS pitfalls — the
≥44px min-size belongs in `pagination-chrome.css`, not `theme.styles`), `docs/tailadmin-style-reference.md` §6l
(chrome is already correct — cite to confirm no drift), `docs/ui-rules.md`, `docs/component-rules.md`,
`docs/qa-rules.md`, `docs/state-authority.md` (SSR-vs-client authority for the ResizeObserver measurement).
Mantine: `Pagination.Root` compound API (`Pagination.Previous/Next/Items/Control/Dots`) + `ResizeObserver`/
`use-resize-observer` hook.

## STOP-and-ASK triggers (do not guess)

- Floor (`Prev·current·Next`) cannot fit at 320 with the longest numbers even at min size.
- Asymmetric shed needs a Mantine internal not exposed by `Pagination.Root` (e.g. custom dots placement).
- Any need to change §6l chrome or the consumer's prop surface to make the layout work.
- Whether a "page X of Y" compact textual fallback is wanted below some width (owner picked ResizeObserver shed,
  NOT the compact-text option — do not add it unasked).
