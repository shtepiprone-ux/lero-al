# Sprint 49 — HeroSearch: gate integrity, then de-Tailwind

**Opened:** 2026-08-03. **Status:** 🟠 OPEN. **Epic:** MM Phase-2.
**Predecessors:** Sprint 47 (layout shell, ✅ closed) · Sprint 48 (homepage tail, 🟢 closing with 707).

---

## 1. Why this sprint exists

Sprint 48's closing note claimed that after 707 and Sprint 46 landed, the whole `/[locale]` tree would be
Tailwind-utility-free at component level. **That claim was false.** A direct re-census on 2026-08-03 —
`grep -c 'className='` on every file `src/app/[locale]/page.tsx` reaches — found **20** utility sites in two
surfaces that no sprint owned:

| Surface | Sites | Why it was missed |
|---|---:|---|
| `src/components/shared/HeroSearchView.tsx` | **9** | The 2026-08-01 homepage trace measured `HeroSearch.tsx` — the thin container Task 568 split out, which genuinely has 0 — and recorded the pair as "clean". The **View** holds all the JSX. |
| `src/components/layout/MobileBottomNavView.tsx` | **11** | App-shell, not homepage content; it renders on every route via `layout.tsx:53`, so a homepage-scoped trace never reached it. |

This sprint takes the first. **Sprint 50** takes the second — it belongs to the Sprint 47 Header/Footer app-shell
family, and it carries three `design-tokens-allow` markers that must move with their justifications.

## 2. The blocking discovery — the comparator is dead

While building the verified context for the migration kickoff, the gate that was supposed to protect it was found
**non-asserting**.

`scripts/check-stories-rendered.mjs:1245-1247` locates the hero search card as:

```js
const card = Array.from(document.querySelectorAll('#storybook-root .bg-background'))
  .find((el) => el.classList.contains('border') && el.classList.contains('shadow-xl'));
const container = card?.querySelector(':scope > .flex.flex-wrap');
if (!container) return null;
```

**Task 652 deleted all three of those classes.** `HeroSearchView.tsx:91-94` now carries Mantine `bg="gray.1"` and
`bd="1px solid var(--mantine-color-gray-2)"` style props instead; the gate's own comment still quotes the
pre-652 string `"bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3"`. So `card` is `undefined`,
the function returns `null`, and every consumer of the result is written as `!== false`:

- `:680` — `if (cell.assertions.heroSearchWrapInBand === false) return false;`
- `:1276` — `const hardPass = … && heroSearchWrapInBand !== false && …`

`null` therefore passes vacuously.

**Measured, not inferred.** In the official run `.screenshots/rendered-assert/2026-08-03T15-13/manifest.json`,
`heroSearchWrapInBand` is `null` in **all 40** `herosearch` cells, including **all 8** `band-700` cells
(`--default` and `--fallback` × sq/en/uk/it) where it is the only cell set that can produce a verdict at all.
The extra viewport itself still works — `MANTINE_STORY_EXTRA_VIEWPORTS.HeroSearch` at `:406` is correctly keyed off
the discovered `componentName` — only the DOM assertion inside it is dead. It has been dead since Task 652.

## 3. Owner decisions

| ID | Ruling | Scope |
|---|---|---|
| **D32** (2026-08-03) | **A migration may not be proven against a comparator that has not been shown to fail.** 708 repairs and proves the gate; only then may 709 migrate against it. This is the AC11 doctrine (`blind comparator ⇒ BLOCKED, not IMPLEMENTED`) applied to a standing gate rather than a per-task plant. | Binds 708 → 709 |
| **D33** (2026-08-03) | **Re-anchor, do not re-classify.** The repaired gate must select on a hook that survives de-Tailwinding. Re-anchoring it onto any other Tailwind class would only move the same time-bomb. | Binds 708 |
| **D28** (2026-08-01, Sprint 47) | Mechanism-only, zero visual delta. Utilities → Mantine style props where a prop exists, colocated `.module.css` otherwise. | Binds 709 |
| **D6** (Task 684) | `.screenshots/` evidence is local-only per `.gitignore:55`. Reference by path. | Evidence handling |
| **D26** (`docs/storybook-governance.md` §14.11) | The rendered-matrix comparator and its sub-perceptual tolerance. Do not invent a per-task pixel tolerance. | Binds 709 |

## 4. Tasks

| # | Title | State | Depends on |
|---|---|---|---|
| **708** | Repair the `heroSearchWrapInBand` gate and re-anchor it de-Tailwind-stably | `KICKOFF FILED` — `Sprint_49_kickoff_prompt_Task_708_HeroSearchWrapInBand_Gate_Repair.md` | — |
| **709** | `HeroSearchView` de-Tailwind — 9 sites → colocated `.module.css` | reserved, **blocked on 708** | 708 |
| **710** | Meta-gate: an assertion `null` across every one of its target cells is a dead gate | reserved | may run in parallel with 709 |

**708 is Q4** — it changes a gate, so `docs/qa-profiles.md` requires planted-violation proof that the gate genuinely
fails. A repaired gate that has not been shown to fail is the same defect in a new place.

**709 is the hardest task in the D28 set.** Named here so its kickoff cannot understate it: arbitrary-value utilities
(`rounded-b-[var(--mantine-radius-lg)]`, `sm:rounded-tr-[…]`), `sm:`/`md:` responsive variants that must be
reproduced as `@media(min-width:40rem)` / `@media(min-width:48rem)` exactly, the Task 572 `basis`/`grow`/`shrink`
chain whose own source comment forbids collapsing it to `flex-1`, and **3 of the 9 sites pass `className` into child
components** (`PropertyTypeCombobox`, `LocationCombobox`, `MantineCountButton`) rather than onto a Mantine `Box`.
`PropertyTypeCombobox.tsx:36` additionally carries a Tailwind **default fallback** (`className ?? 'sm:w-48 shrink-0'`)
that survives in that out-of-scope file either way.

## 5. Preconditions

- 707 committed by the owner (Sprint 48 closes).
- No work in this sprint starts from a dirty worktree without a reconciled manifest.
- `storybook-static/` is rebuilt before any capture — the compiled Tailwind output in
  `storybook-static/assets/iframe-*.css` is the authority for every "what does this utility actually compile to"
  question in 709, and a stale bundle silently answers the wrong question.

## 6. Exit criteria

1. `heroSearchWrapInBand` returns a real boolean in the 8 `band-700` cells, and a planted violation makes
   `npm run screenshots:assert -- --mantine-only` genuinely FAIL (708).
2. `HeroSearchView.tsx` greps **0** Tailwind utilities; every surviving `className` is `styles.*` or the verbatim
   `hero-search` marker; all 40 herosearch cells hold their pre-task PNG md5 and verdict (709).
3. A dead assertion cannot pass silently again (710).
4. `check:design-tokens` unchanged at **23** across all three tasks.

## 7. Carried-forward corrections from the 707 review

Fold these into every kickoff in this sprint; they are cheap to state and each one has already cost a review cycle.

- **N1 — do not hardcode a token's resolved value.** Read the compiled utility from the built CSS and reproduce its
  *declaration*. `p-3` compiles to `padding:var(--space-3)`, not `padding:0.75rem`. Verified 2026-08-03 against
  `storybook-static/assets/iframe-DnJgGJJb.css`: `--spacing`, `--container-3xl`, `--space-0/2/3/6` and
  `--mantine-radius-lg` are **all emitted** and therefore consumable from a CSS module — unlike `--radius-xl`, which
  lives in `@theme inline` and is not emitted. Check emission per token; do not generalise either way.
- **N2 — reproduce specificity, not just value.** Tailwind wraps sibling-margin and several other rules in
  `:where(...)` (specificity 0,0,0). A module rule that drops the `:where()` wins fights the original lost.
- **N6 — run the counting gates last.** `check:file-integrity` and `check:mojibake` scan git-changed + untracked
  files; running them before the session log and backlog row exist reports a stale denominator. Third recurrence at
  707; a fourth is a P2.
