# Task 661 — Single-source brand color → true `#EC5447` everywhere (web CSS-var scale + emails)

## 1. Mode and task type

- **Mode:** Implementation kickoff for a fresh Sonnet session. Execute via `.claude/skills/execute-task/SKILL.md`.
- **Task type:** UI + design-system architecture — current Mantine path, plus email (server-rendered HTML). **App-wide primary-color change + single-source-of-truth refactor.** High blast radius.
- **QA profile:** `Q3 Full Visual Matrix` for Part A (app-wide visible primary shift on CSS-var surfaces); `Q2` targeted render for Part B (emails). Justified in §13.

## 2. Objective

Resolve the brand-color split that Task 660 documented and give the owner a **single knob**:

1. **One canonical source of truth** for the brand scale. The `brand` `MantineColorsTuple` in `src/design-system/mantine/theme.ts` (index 7 = `#EC5447`) becomes THE source. Extract it (with named exports) into `src/design-system/brand.ts` so non-Mantine consumers (emails) import the exact same values.
2. **Web CSS-var scale derives from it.** Replace the hand-authored `oklch(...)` `--brand-*` values in `globals.css` with **aliases to Mantine's generated `--mantine-color-brand-*` variables**, so `--brand-700` renders the true **`#EC5447`** instead of today's drifted **`#D25656`**. This is an intentional, **app-wide visible change**: every CSS-var/Tailwind brand surface (`--primary`, prices, focus ring, sidebar-active, charts, the Task-659 hero) brightens from `#D25656` → `#EC5447`. Mantine surfaces (`color="brand"`) are already `#EC5447` and **do not change**.
3. **Emails tie to the same source.** `BRAND_ACCENT`/`BRAND_AA` import from `brand.ts`; the raw hardcoded `#EC5447` hexes in the email HTML builders are replaced with those constants. Email clients cannot consume CSS variables, so emails bake the hex at render — but sourced from the one file, so changing it + rebuild propagates to emails too.

**Net result the owner asked for:** editing the `brand` tuple in one file changes the color across the entire web app (Mantine + CSS vars, light) and — on rebuild — the emails.

**This is not a redesign of components.** No component markup/logic changes. Only the color *plumbing* and the resulting rendered brand hue change.

## 3. Verified context

All facts inspected this session.

- **Mantine v8.3.18** (`package.json`). `MantineProvider theme={theme} defaultColorScheme="light"` in `src/design-system/mantine/MantineRootProvider.tsx`; **no `CSSVariablesResolver`** today. Mantine generates `--mantine-color-brand-0..9` from `theme.colors.brand` at runtime (injected into `<head>`, SSR-safe).
- **Canonical Mantine tuple** (`theme.ts` lines 5–16), the intended brand: `#FDEEED, #FBDDDA, #F9CCC8, #F7BBB5, #F6AAA3, #F2877E, #F0766C, #EC5447(7=primary), #BD4339(8=hover), #8E322B(9)`. `primaryShade: 7` (bare number → same index light+dark). These render the true declared brand.
- **globals.css hand-authored oklch scale** (light, lines 302–313; the drift source): `--brand-50 … --brand-950`, each an `oklch()` with an (often wrong) hex comment. **Task 660 finding, orchestrator-reproduced:** `--brand-700 = oklch(0.614 0.158 23)` actually renders **`#D25656`** (not `#EC5447`); the whole scale renders duller than the tuple. Extra shades with **no Mantine index:** `--brand-850` (`oklch(0.497 0.155 23)`) and `--brand-950` (`oklch(0.132 0.022 23)` ≈ `#180807`, near-black — not a red tint).
- **Dark block** (`.dark`, lines ~429–472): overrides `--brand-700: oklch(0.648 0.200 22)` (renders `#F04C54`), `--brand-800`, `--brand-50`, plus hardcoded non-brand `oklch` literals `--accent`/`--accent-foreground`/`--destructive`/`--chart-4` (Task 660 finding — not wired to `--brand-*`). **Dark mode has no reachable UI toggle** (no `useMantineColorScheme`/`setColorScheme`/scheme-toggle component found; provider is `defaultColorScheme="light"`). Treat the dark brand overrides as **dormant** (executor must confirm no toggle exists).
- **`@theme` bridge** (globals.css lines 45–49): `--color-brand-50/100/700/800/950: var(--brand-*)` → Tailwind `*-brand-*` utilities inherit the CSS-var value.
- **Semantic tokens consuming `var(--brand-700)`** (light+dark), all shift `#D25656→#EC5447` after the fix: `--primary`, `--primary-hover`(→800), `--ring`, `--price-color`, `--price-reduced`, `--badge-reduced`, `--sidebar-primary`, `--sidebar-ring`, `--chart-1`; alpha: `--accent`(→brand-50 light) / `--accent-foreground`(→800); `--destructive`(→900), `--chart-4`(→900).
- **UI never hardcodes brand hex** — components use `color="brand"` or the CSS vars (verified: no `#EC5447`/`rgb(236,84,71)` in component `.tsx`). **Only emails hardcode:**
  - `src/modules/notifications/lib/emails/BaseEmail.tsx` — `export const BRAND_ACCENT = '#EC5447'`, `BRAND_AA = '#BD4339'` (consumed by several `*Email.tsx`).
  - `src/app/api/auth-email-hook/route.ts` — raw `#EC5447` ×4 in an HTML string (NOT using the constant).
  - `src/modules/notifications/lib/emails/contactInquiry.ts` — raw `#EC5447` ×2 (NOT using the constant).
- **Task 659 hero** uses `bg="var(--primary)"` → will shift `#D25656→#EC5447` (a further-verified consequence, in-scope-expected).

## 4. Requirements (ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner | A single canonical brand source (`src/design-system/brand.ts`) exports the brand tuple + named `PRIMARY`/`HOVER` (and any values emails need); `theme.ts` imports it (no duplicate literal). | P0 | Inspection; grep no second brand-hex literal | Confirmed |
| R2 | Owner | `globals.css` `--brand-N` (light) derive from `var(--mantine-color-brand-N)` for N with a Mantine index (50→0 … 900→9); no hand-authored brand `oklch` remains for those shades. | P0 | Inspection + computed style | Confirmed |
| R3 | Owner | After R2, `--brand-700` and `--primary` render **`#EC5447`** (computed), matching Mantine `color="brand"`; the `#D25656` drift is gone app-wide. | P0 | Computed-style probe on real surfaces | Confirmed |
| R4 | Owner | Editing the tuple in `brand.ts` changes both Mantine and CSS-var surfaces (light) with no other edit — demonstrated. | P0 | Executor changes the value in a scratch build, shows both paths move, reverts | Confirmed |
| R5 | Owner | Emails render the brand from the canonical source: `BRAND_ACCENT`/`BRAND_AA` import from `brand.ts`; raw `#EC5447` in `auth-email-hook/route.ts` (×4) and `contactInquiry.ts` (×2) replaced with the constant. No raw brand hex remains in email code. | P0 | grep `#EC5447` in `src/**` = only `brand.ts`; email render | Confirmed |
| R6 | Rule (scope) | No component markup/logic change; no non-brand token changed; the near-black `--brand-950` and orphan `--brand-850` handled per §10 (not silently broken). | P0 | Diff review | Confirmed |
| R7 | Rule (agent-contract §7) | No user-facing string / i18n change. | P1 | Diff | Confirmed |
| R8 | Rule (agent-contract §9) | `tsc` clean; `npm run build` exit 0. | P0 | Transcripts | Confirmed |
| R9 | Owner (660 follow-through) | The stale `#EC5447` comment on the old `--brand-700` line (and siblings) is removed/corrected as part of replacing those lines. | P2 | Diff | Confirmed |

## 5. Assumptions and open questions (defaults chosen; executor may return `BLOCKED` if a default proves wrong)

- **OQ1 — `--brand-850` (orphan).** No consumer was found (only defined). **Default:** if the executor's grep confirms zero consumers, **delete it**; if a consumer exists, derive it via `color-mix(in srgb, var(--mantine-color-brand-8), var(--mantine-color-brand-9))` (or nearest) and document. Do not leave a hand-authored oklch that re-introduces drift.
- **OQ2 — `--brand-950` (`#180807`, near-black).** This is **not a red tint** of the brand; it reads as near-black (old hero gradient stop, now removed by Task 659). **Default:** keep it **hand-defined as-is** (it is a neutral-ish anchor, not part of the tuple), but add a comment that it is intentionally NOT tuple-derived. Executor maps its live consumers first (`--color-brand-950` → any `*-brand-950` utility); if none, propose removal as a note (do not remove without evidence).
- **OQ3 — `--accent` alpha (light `oklch(--brand-50-ish)`, dark `oklch(0.614 0.158 23 / 15%)`).** **Default:** light `--accent`→`var(--mantine-color-brand-0)`; the dark 15%-alpha tint → `color-mix(in srgb, var(--mantine-color-brand-7) 15%, transparent)`. Keep the *rendered* intent (subtle brand tint), now source-linked.
- **OQ4 — Dark brand fork.** Dark mode is dormant (no toggle). **Default:** align the dark `--brand-*` overrides to the same `var(--mantine-color-brand-*)` source (dropping the divergent brightening); zero visible impact expected because dark is unreachable. If the executor finds a real dark toggle, **stop** and return `BLOCKED` (preserving the intentional dark-brightening needs a Mantine dark-shade/`virtualColor` design decision — owner call).
- **OQ5 — Email "auto-change" limit.** Email clients don't support CSS `var()`; emails bake the hex at render from the imported constant. This is the honest maximum of "tied to brand" for email — surfaced so the owner knows a color change requires a rebuild/redeploy to reach emails (not a live runtime change). Not a blocker.
- **A1.** Other theme color scales (`success`/`warning`/`error`/violet) are **out of scope** — only `brand`.

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` (§1 scope, §9 build gate, §10 evidence).
2. `.claude/skills/execute-task/SKILL.md`.
3. `docs/qa-profiles.md` → `Q3` + `Q2`.
4. `docs/governance-reports/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md` (the audit this implements).
5. `docs/mantine-responsive-design-system.md` (§ brand color = `#EC5447`, `primaryShade:7`) + `docs/design-system.md` (token model).
6. This task's §3 (verified line numbers/consumers/tuple).
7. `src/design-system/mantine/theme.ts` (brand tuple), `src/app/globals.css` (brand + `.dark` + `@theme` blocks), `MantineRootProvider.tsx`, the three email files.

## 7. Scope

- **Part A (web single-source):** create `src/design-system/brand.ts` (canonical tuple + named exports); `theme.ts` imports it; rewrite `globals.css` `--brand-*` (light + dormant dark) to alias `var(--mantine-color-brand-*)`; handle 850/950/accent per §5; correct/remove the stale hex comments.
- **Part B (emails):** `BRAND_ACCENT`/`BRAND_AA` in `BaseEmail.tsx` import from `brand.ts`; replace raw `#EC5447` in `auth-email-hook/route.ts` (×4) and `contactInquiry.ts` (×2) with the constant.
- Update `docs/backlog.md` (concise) + session log. Optionally add a small guard note; a CI sync-gate is **out of scope** here (see §8, spawn candidate).

## 8. Out of scope

- Any component markup/logic; any non-brand color scale; any i18n string.
- Building the automated ΔE **sync-check CI gate** (a good follow-up so future edits can't drift again) — **note as a spawn candidate**, do not build here.
- Changing email layout/content beyond the color-constant swap.
- Introducing a runtime dark-mode toggle or redesigning dark shades (blocked-path per OQ4).
- Removing `--brand-950` without consumer evidence (OQ2).

## 9. Current and required behavior

| Aspect | Current | Required after |
|---|---|---|
| Brand source of truth | Two independent scales (theme.ts hex `#EC5447` vs globals.css oklch `#D25656`) + hardcoded email hexes → drift. | **One** source (`brand.ts`); Mantine + CSS vars + emails all derive from it. |
| CSS-var brand surfaces (`--primary`/prices/ring/sidebar/charts/hero) | Render `#D25656` (duller). | Render **`#EC5447`** (true brand), matching Mantine. |
| Mantine `color="brand"` surfaces | `#EC5447`. | **Unchanged** `#EC5447`. |
| Emails | `#EC5447` (partly constant, partly raw hardcode). | `#EC5447` from the shared constant everywhere; no raw hex. |
| Changing the brand later | Edit ~4 places, keep in sync manually. | Edit **one** file (`brand.ts`); rebuild for emails. |
| i18n / components | — | **Unchanged.** |

## 10. Implementation requirements

**Mechanism (validate FIRST — see §13 step 1):** Mantine v8 emits `--mantine-color-brand-0..9` globally. In `globals.css`, set `--brand-50: var(--mantine-color-brand-0)` … `--brand-900: var(--mantine-color-brand-9)` (map: 50→0, 100→1, 200→2, 300→3, 400→4, 500→5, 600→6, 700→7, 800→8, 900→9). The existing `@theme` bridge (`--color-brand-*: var(--brand-*)`) then carries the corrected value to Tailwind utilities unchanged. Confirm the alias resolves to `#EC5447` for brand-7 via a computed-style probe on a real element **before** rewriting the whole block; if Mantine's vars are not present when globals.css evaluates (they are injected in `<head>`), return `BLOCKED` with evidence.

- **Canonical `brand.ts`:** export the `MantineColorsTuple` (moved verbatim from theme.ts, values unchanged — `#EC5447` etc.) plus `export const BRAND_PRIMARY = brand[7]`, `BRAND_HOVER = brand[8]` (names emails use). `theme.ts` imports `brand` from it. Zero value change to Mantine output.
- **globals.css light:** replace the 10 hand-authored `--brand-50..900` oklch lines with the alias lines; remove the now-false hex comments (R9). Handle `--brand-850`/`--brand-950` per OQ1/OQ2, `--accent` per OQ3.
- **globals.css dark:** replace the `--brand-*` overrides with the same aliases (OQ4 default), or leave a single comment that dark is dormant-and-source-aligned.
- **Emails:** import + substitute per R5. Keep `BRAND_AA`/`#BD4339` = `brand[8]`.
- **Do not** touch success/warning/error/violet scales or any semantic token *names* — only the brand values they point at move.

**Canonical UI decision record:**

| Visible artifact | Inspected | Canonical source | Disposition | Token/registration |
|---|---|---|---|---|
| All CSS-var brand surfaces | globals.css `--brand-*` → `@theme` → utilities/semantic tokens | Mantine `--mantine-color-brand-*` (from `brand.ts` tuple) | **reuse (re-point to single source)** | no new token; `brand.ts` is the source |
| Mantine `color="brand"` surfaces | theme.ts tuple | same tuple via `brand.ts` | **reuse (unchanged output)** | — |
| Email accent | `BaseEmail`/hook/contactInquiry | `brand.ts` `BRAND_PRIMARY` | **reuse** | shared constant import |

## 11. Positive and negative flows

**Positive flow:** Owner edits `brand.ts` `brand[7]` → Mantine surfaces and (via the aliases) all CSS-var surfaces change together in the web app; a rebuild bakes the new hex into emails. In this task specifically, no edit to the value is needed (it is already `#EC5447`) — the *plumbing* change makes the CSS-var surfaces render `#EC5447` instead of `#D25656`.

**Negative-flow applicability:**

| Branch | Applicable? | Handling |
|---|---|---|
| Mantine CSS var absent at globals.css eval (SSR/first paint) | Yes | Validate in step 1; `BLOCKED` if it doesn't resolve. |
| `--brand-850` orphan / `--brand-950` near-black | Yes | OQ1/OQ2 — map consumers, don't silently break. |
| Dark mode reachable after all | Yes | OQ4 — `BLOCKED` for owner dark-shade decision. |
| Alpha tint `--accent` loses translucency | Yes | OQ3 — `color-mix` preserves 15%. |
| Email client ignores the color | No | Baked hex, unchanged mechanism; only the source moved. |
| i18n / auth / RLS | No | Untouched. |

## 12. Acceptance criteria

- **AC1 [R1]** `src/design-system/brand.ts` exists and is the only brand-tuple literal; `theme.ts` imports it; `grep` finds no second brand-hex definition in `src/**` except `brand.ts` (and the derived email constants importing it).
- **AC2 [R2/R3]** Computed style on a real CSS-var surface (e.g. a price / the hero / `:root`) resolves `--brand-700` and `--primary` to `#EC5447` (`rgb(236,84,71)`); no `#D25656` remains on any brand surface; Mantine `color="brand"` still `#EC5447`.
- **AC3 [R4]** In a scratch build, changing `brand[7]` to a probe color moves BOTH a Mantine surface and a CSS-var surface; reverted before completion (show the probe evidence).
- **AC4 [R5]** `grep -i '#EC5447'` over `src/**` returns only `brand.ts` (source) — none in `BaseEmail.tsx` body, `auth-email-hook/route.ts`, or `contactInquiry.ts` (all via the constant); at least one email renders the accent from the constant (render check).
- **AC5 [R6]** Diff shows no component markup/logic change and no non-brand token value change; `--brand-850`/`--brand-950`/`--accent` handled per §5 with consumer evidence.
- **AC6 [R7]** No `t(...)`/locale change.
- **AC7 [R8]** `tsc` clean; `npm run build` exit 0 (transcript).
- **AC8 [R9]** The stale `#EC5447` comment on the old `--brand-700` oklch line (and sibling wrong comments) no longer exists.

## 13. QA profile and verification plan

**Part A — `Q3 Full Visual Matrix`** (app-wide primary shift). **Part B — `Q2`** (email render).

1. **Feasibility gate (do first):** prove `--brand-700: var(--mantine-color-brand-7)` computes to `#EC5447` on a rendered element in `next dev`; paste the computed value. Abort→`BLOCKED` if not.
2. `npx tsc --noEmit` → 0.
3. **Web visual matrix:** render representative CSS-var-brand surfaces on the app route(s) — homepage hero (Task 659), a listing **price**, a focus **ring** (`:focus-visible`), sidebar-active (admin), a chart if reachable — across the Q3 viewport set and 4 locales (sq/en/uk/it); confirm `#EC5447` and no regressions. Confirm Mantine surfaces (buttons/badges/pagination) are visually unchanged. Capture before/after for the hero + price (the clearest `#D25656→#EC5447` shift).
4. **Storybook regression:** `npm run screenshots:assert -- --mantine-only` — Mantine stories should be unchanged (they already used `#EC5447`); 0 FAIL, note any AMBIGUOUS as pre-existing.
5. `check:i18n` / mojibake / `check:stories` per standing gates (reviewer-reproducible).
6. **Email render (Q2):** render one templated email (e.g. via the existing email dev/preview path or a unit render) and one `auth-email-hook` output; confirm the accent is `#EC5447` sourced from the constant. `grep` proof per AC4.
7. **R4 single-knob demo:** temporary probe-color change → both paths move → revert (paste evidence).
8. **Hard gate:** `npm run build` → exit 0 (transcript).

## 14. Completion report contract

Changed files (expected: `brand.ts` new; `theme.ts`; `globals.css`; `BaseEmail.tsx`; `auth-email-hook/route.ts`; `contactInquiry.ts`; `docs/backlog.md`; session log with a Files-Changed table = real diff). Completed R1–R9 + per-AC self-audit. All commands with **actual** output (feasibility probe, tsc, visual matrix, screenshots:assert, email render, grep proofs, single-knob demo, build exit code). Evidence locations. Assumptions taken (OQ defaults) + any `BLOCKED` path hit. Limitations (e.g. email bakes hex; dark dormant). **Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval.** Backlog ≤80 lines. No mutating git.

## 15. Task quality gate (author self-check — all pass)

- Fresh Sonnet can execute from this file alone: **yes** (mechanism, exact files/lines/consumers, tuple, defaults, and a feasibility gate are inline).
- Every requirement has a binary AC + verification: **yes** (R1–R9 → AC1–AC8 + plan).
- Scope protects existing behavior / names what must not change: **yes** (§8; components, non-brand scales, i18n, dark-redesign, CI-gate all excluded).
- Current/legacy boundary, QA profile (Q3+Q2), locales, Storybook obligation explicit: **yes**.
- Each changed brand surface traced to inspected tokens/consumers; the intended visible delta (`#D25656→#EC5447` on CSS-var path) is named precisely, and the unchanged Mantine path is distinguished: **yes** (§3/§10).
- Canonical UI decision record present, all `reuse` (re-point to single source), no new token invented: **yes**.
- The one real architecture risk (Mantine var availability at globals.css eval) is gated before the bulk change: **yes** (§13 step 1).
- Negative flows by applicability: **yes** (§11; incl. dark/orphan-shade/alpha `BLOCKED`/derive paths).
- No uninspected claim (files, consumers, tuple, email hardcodes all inspected this session): **yes**.
- Gates prove the change (computed `#EC5447`, single-knob demo, email grep, build) not mere procedure: **yes**.
- Assumptions/decisions visible: **yes** (OQ1–OQ5).

---

**Task path:** `tasks/kickoff_prompt_Task_661_SingleSource_Brand_EC5447_Web_And_Emails.md`
**QA profile:** `Q3` (web) + `Q2` (email)
**Owner decisions surfaced (defaults chosen, no block unless a default proves wrong):** OQ1 `--brand-850` orphan (delete-if-unused), OQ2 `--brand-950` near-black (keep, non-tuple), OQ3 `--accent` alpha via `color-mix`, OQ4 dark dormant → source-aligned (BLOCK if a dark toggle exists), OQ5 emails bake-on-rebuild (mechanism limit). Follow-up spawn candidate: a ΔE **sync-check CI gate** so the source and any future mirror can't drift again.
