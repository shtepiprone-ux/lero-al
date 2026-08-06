# Task 660 — Brand-color `oklch`(globals.css) ↔ hex(theme.ts) drift audit (read-only, report-only)

## 1. Mode and task type

- **Mode:** Implementation kickoff for a fresh Sonnet session. Execute via `.claude/skills/execute-task/SKILL.md`.
- **Task type:** **Governance / investigation — read-only.** Produces one Markdown audit report. **No source, token, comment, or style change.**
- **QA profile:** `Q0` (justified in §13). No runtime, visual, or behavioral change; deliverable is a document whose computations are independently reproducible.

## 2. Objective

The project has **two divergent definitions of the brand color** that have silently drifted:

- **Mantine theme palette** (`src/design-system/mantine/theme.ts`): `brand[7] = '#EC5447'` (a literal hex). Everything using `color="brand"` / `variant="filled"` / `var(--mantine-color-brand-7)` renders **#EC5447** — the design-system-declared brand.
- **CSS custom property** (`src/app/globals.css`): `--brand-700: oklch(0.614 0.158 23)` renders **#D25656** (verified by three independent methods in Task 659, and a fourth by the orchestrator). Everything using `var(--primary)`/`var(--brand-700)`/`bg-primary` and the derived tokens (`--ring`, `--price-color`, `--sidebar-primary`, `--chart-1`, …) — **including the Task 659 hero** — renders the off-brand **#D25656**.

So Mantine-palette surfaces and CSS-variable surfaces render **two different "brand" reds** on the same pages. `theme.ts`'s own header comment ("Brand color scale derived from globals.css oklch palette (EC5447 primary)") shows the drift was unintended.

**Produce a definitive audit** that (a) computes the *actual* rendered color of every `--brand-*` oklch shade (light **and** dark) and compares it to both its own hex comment and the `theme.ts` hex tuple; (b) enumerates every consuming token and representative product surface, classifying each as CSS-var-path (currently off-brand) or Mantine-palette-path (on-brand); (c) quantifies the blast radius of correcting the oklch scale to the declared brand; (d) gives a recommendation and the exact owner decision required. **Change nothing else** — this task deliberately does not edit any token, comment, or component (owner chose "audit-first"; the actual correction is a separate, decided-from-this-report task).

## 3. Verified context

All facts below were inspected this session.

**`src/app/globals.css` — light brand scale (`:root`), with self-comments:**

```
305  --brand-200: oklch(0.895 0.031 20);   /* #F9CCC8 */
306  --brand-300: oklch(0.858 0.042 21);   /* #F7BBB5 */
307  --brand-400: oklch(0.820 0.054 21);   /* #F6AAA3 */
308  --brand-500: oklch(0.745 0.078 22);   /* #F2877E */
309  --brand-600: oklch(0.707 0.093 22);   /* #F0766C */
310  --brand-700: oklch(0.614 0.158 23);   /* #EC5447 — primary */   ← renders #D25656 (verified)
311  --brand-800: oklch(0.541 0.168 23);   /* #BD4339 — hover */
312  --brand-850: oklch(0.497 0.155 23);   /* #A53B32 */
313  --brand-900: oklch(0.452 0.142 23);   /* #8E322B */
314  --brand-950: oklch(0.132 0.022 23);   /* #180807 */
```
(`--brand-50`/`--brand-100` are defined just above line 305 — include them; read the few lines above 305 to capture their exact oklch.)

**`src/app/globals.css` — dark brand overrides (`.dark`/dark block):**

```
430  --brand-50:  oklch(0.220 0 0);        /* Accent hover bg on dark */
431  --brand-700: oklch(0.648 0.200 22);   /* Brighter #EC5447 on dark */   ← audit actual
432  --brand-800: oklch(0.700 0.190 22);   /* Hover — lighter on dark */
```

**`src/design-system/mantine/theme.ts` — hex `brand` tuple (lines 5–16):**

```
brand[0..9] = #FDEEED, #FBDDDA, #F9CCC8, #F7BBB5, #F6AAA3, #F2877E, #F0766C, #EC5447(=7 primary), #BD4339(=8 hover), #8E322B(=9)
```
Header comment (line 3): "Brand color scale derived from globals.css oklch palette (EC5447 primary)". Note the tuple has **no `850` shade**; globals.css does (`--brand-850`). `primaryShade: 7`.

**Semantic tokens consuming `var(--brand-700)` (light + dark) — all currently render the CSS-var color (#D25656 in light), NOT Mantine `brand-7`:**

`--primary` (340/434), `--primary-hover`→brand-800 (342/436), `--ring` (359/449), `--price-color` (363/452), `--price-reduced` (364/453), `--badge-reduced` (367/456), `--sidebar-primary` (384/465), `--sidebar-ring` (389/470), `--chart-1` (392/472); plus `--accent`→brand-50 (349), `--accent-foreground`→brand-800 (350), `--destructive`→brand-900 (353), `--chart-4`→brand-900 (395). `@theme` bridge: `--color-brand-700: var(--brand-700)` (47) → Tailwind `*-brand-700`/`bg-primary` utilities all inherit the CSS-var (off-brand) value.

**Design-system declared brand = #EC5447 (authoritative):** `docs/mantine-responsive-design-system.md:131` ("Brand color stays `#EC5447`", decision 2026-06-25) and `:135` ("Brand primary color | `#EC5447` (shade 7)"); `docs/mantine-tailadmin-migration-tracker.md:6`; email `BRAND_ACCENT = '#EC5447'` (`docs/integrations.md:190/280`). Older component tasks measured Mantine `brand-7` = `rgb(236,84,71)` = #EC5447 (e.g. task533 pagination, task497/498/499, task548 slider).

**Verified computation (orchestrator, reproducible):** `oklch(0.614 0.158 23)` → OKLab→linear-sRGB→gamma → `rgb(210,86,86)` = **#D25656**; white-on-#D25656 contrast = **4.03:1**. Method: standard OKLab matrix (see any sRGB/OKLab reference); the executor must reproduce this and extend it to every shade.

**Existing report location/precedent:** `docs/governance-reports/` (e.g. `2026-06-19-task467-storybook-visual-defect-inventory.md`). New report goes here.

## 4. Requirements (ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Objective | For **every** `--brand-*` shade in globals.css (light + dark), compute the actual rendered sRGB hex from its `oklch(...)` via a from-spec conversion; tabulate: shade, oklch, self-comment hex, **actual hex**, `theme.ts` hex, match? (ΔE or hex-equal). | P0 | Report table + reproducible script output | Confirmed |
| R2 | Objective | Classify each shade's drift: exact-match / minor (<2 ΔE) / material (≥2 ΔE), with brand-700 (light) and brand-700 (dark) explicitly called out. | P0 | Report | Confirmed |
| R3 | Objective | Enumerate every semantic token + `@theme` bridge consuming each `--brand-*` (from §3 list, verified against the file), and for each name representative product surfaces and whether it renders via **CSS-var path** (off-brand today) or **Mantine-palette path** (`#EC5447`). | P0 | Report table | Confirmed |
| R4 | Objective | Quantify the **blast radius** of correcting the globals.css oklch scale so `--brand-*` renders the `theme.ts` hex values: list which surfaces would shift and the per-shade visual delta (esp. `--primary`/hero/prices/ring/sidebar/charts). Note light **and** dark. | P0 | Report | Confirmed |
| R5 | Objective | Give a clear **recommendation** and the exact **owner decision** required (e.g. "replace the oklch scale with values that render the theme.ts hexes" vs "converge theme.ts onto the oklch values" vs "leave split"), including whether the `#EC5447` self-comments are then correct or stale. | P0 | Report §recommendation | Confirmed |
| R6 | Owner (this task) | **No change** to any token value, comment, component, or style. Deliverable is the report file only. | P0 | `git diff` shows only the new report (+ backlog/session log) | Confirmed |
| R7 | Rule | The report must not assert any surface, token, or measured value it did not inspect/compute; separate verified facts from inference. | P0 | Review | Confirmed |

## 5. Assumptions and open questions

- **A1.** The correction itself is **out of scope** (owner chose audit-first). This task only informs it. Do not edit `globals.css`/`theme.ts`.
- **A2.** Emails intentionally hardcode `#EC5447` and are correct; they are context, not a target to change.
- **OQ (for the report to surface, not resolve):** does the owner want the CSS oklch scale corrected to the declared `#EC5447` brand (app-wide visual shift, Q3/Q4 follow-up), or to accept the rendered values? The report presents the data; the owner decides in the follow-up.

## 6. Pre-read rule bundle (for the executor)

1. `docs/agent-contract.md` (esp. §1 scope, §2 no invented facts, §10 backlog/session evidence).
2. `.claude/skills/execute-task/SKILL.md`.
3. `docs/qa-profiles.md` → `Q0` row.
4. This task's §3 (verified line numbers, tokens, hex tuple — use as the inspection map; re-open the exact lines to confirm before tabulating).
5. `src/app/globals.css` brand + semantic-token blocks; `src/design-system/mantine/theme.ts` brand tuple.

Do not read the whole `docs/` tree.

## 7. Scope

- Read `globals.css` and `theme.ts`; compute conversions; write **one** report at `docs/governance-reports/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md`.
- Update `docs/backlog.md` concise state + write the session log.

## 8. Out of scope

- **Any** edit to `globals.css`, `theme.ts`, components, or the `#EC5447`/`#D25656` comments.
- Any visual change, any product-surface edit, email templates, the Task 659 hero.
- Implementing the correction (separate follow-up decided from this report).

## 9. Current and required behavior

| Aspect | Current | Required after |
|---|---|---|
| Brand color source of truth | Split: `theme.ts` hex `#EC5447` vs `globals.css` oklch rendering `#D25656`; drift undocumented. | **Unchanged in code**; drift fully **documented + quantified** in one report with a recommendation. |
| Product rendering | Unchanged. | **Unchanged** (read-only task). |

## 10. Implementation requirements

- **Conversion method:** for each shade, convert `oklch(L C H)` → OKLab → linear sRGB (standard OKLab matrices) → gamma-encode → 8-bit hex; clamp out-of-gamut and note if clamping occurred (a clamped/out-of-gamut oklch is itself a finding). Provide the numbers, not just a verdict. A throwaway Node/Python script may be used to generate the table; **do not commit** it (paste its output into the report/session log).
- **Cross-check** each computed hex against (a) the shade's own `/* #... */` comment and (b) the `theme.ts` tuple entry of the same index. Flag every mismatch.
- **Consumer map (R3):** build the table from the §3 token list, but re-grep `var(--brand-` and `--color-brand-` in `globals.css` to ensure completeness (light + dark); for "Mantine-palette path" cite `color="brand"`/`variant="filled"`/`var(--mantine-color-brand-*)` usage generically (representative examples suffice — a full component census is not required, but say so).
- **Blast-radius (R4):** for the recommended correction, state per-token before/after hex and name the visible surfaces (prices, active states, ring/focus, hero, sidebar active, charts). Cover dark mode.
- **Recommendation (R5):** concrete, with the owner decision framed as a choice. Note the follow-up would be Q3/Q4 (app-wide primary shift) if the oklch scale is corrected.
- **Report structure:** Summary → Per-shade conversion table (light) → Per-shade table (dark) → Consumer/surface map → Blast-radius of correction → Recommendation + owner decision → Appendix (conversion script output).

## 11. Positive and negative flows

**Positive flow:** Reviewer opens the report → sees every brand shade's oklch, comment-hex, actual-hex, theme-hex, and match verdict → sees which tokens/surfaces render off-brand today → sees the cost of the fix → has a clear recommendation and one decision to make.

**Negative-flow applicability:**

| Branch | Applicable? | Handling |
|---|---|---|
| Out-of-gamut / clamped oklch shade | Yes | Report must detect and flag clamping (affects whether a "true" hex even exists). |
| Dark-mode shades differ from light | Yes | Separate dark table (R1/R4). |
| A shade actually matches its comment | Yes | Mark as exact-match (not everything is drifted — report the truth). |
| Runtime/UX/RLS/i18n flows | No | Read-only doc task; none touched. |

## 12. Acceptance criteria

- **AC1 [R1]** Given the report, when read, then every globals.css `--brand-*` shade (light + dark, incl. 50/100/850) has a row with oklch, self-comment hex, computed actual hex, theme.ts hex, and a match verdict; the computation is reproducible (appendix output present).
- **AC2 [R2]** Given brand-700 light, then the report states actual = `#D25656` (≠ comment `#EC5447`), contrast-white 4.03:1, and classifies it material; brand-700 dark is computed and classified.
- **AC3 [R3]** Given the consumer map, then every `var(--brand-700)`/`--color-brand-*` consumer from globals.css is listed with its render path (CSS-var vs Mantine-palette) and a representative surface.
- **AC4 [R4]** Given the blast-radius section, then the report names, per token, the before/after hex and affected surfaces if the oklch scale is corrected to the theme.ts hexes, for light and dark.
- **AC5 [R5]** Given the recommendation, then it states a concrete path and the exact owner decision, and whether the `#EC5447` comments become correct or should change.
- **AC6 [R6]** Given `git diff`, then only the new report + `docs/backlog.md` + the session log changed — zero edits to `globals.css`, `theme.ts`, or any component.
- **AC7 [R7]** Given any claim in the report, then it is either a computed value (shown) or an inspected fact (cited), with inference marked as such.

## 13. QA profile and verification plan

**Profile: `Q0`** — no runtime/visual/behavioral change; deliverable is a document. Per `docs/qa-profiles.md`, Q0 does not require the `npm run build` gate (no code change).

Verification steps (executor pastes actual output):

1. `git diff --name-only` → only the report, `docs/backlog.md`, and the session log (AC6). Explicitly confirm `globals.css` and `theme.ts` are **unmodified**.
2. Reproduce the conversion for **all** shades; paste the script/interpreter output; confirm brand-700 light = `#D25656` and it matches the Task 659 finding (AC1/AC2).
3. Spot-check ≥2 shades that the report claims *do* match their comment (proving the audit isn't uniformly "all wrong").
4. Self-audit each AC → satisfied.

No build, no screenshots, no locale matrix (nothing user-visible changes).

## 14. Completion report contract (for Sonnet)

Report must include: changed files (the new governance report + `docs/backlog.md` concise line + `docs/sessions/2026-07-22-task660-…md` with a Files-Changed table = real diff); completed R1–R7 with per-AC self-audit; the conversion script output (pasted, script not committed); confirmation `globals.css`/`theme.ts` untouched; assumptions; limitations (e.g. "Mantine-palette consumer census is representative, not exhaustive — stated"); unresolved = the owner decision in R5/OQ. **Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` — never self-approval.** Backlog ≤80 lines (flag `BACKLOG LIMIT BREACH` if it can't be — it is already at the cap, so a minimal in-place edit is expected). No mutating git.

## 15. Task quality gate (author self-check — all pass)

- Fresh Sonnet can execute from this file alone: **yes** (exact line numbers, tokens, tuple, and the verified conversion method are inline).
- Every requirement has a binary AC + verification: **yes** (R1–R7 → AC1–AC7).
- Scope protects existing behavior / names what must not change: **yes** (§8; zero value/comment/component edits; read-only).
- UI boundary / QA profile / locale / Storybook: **N/A by design** — no visual change; Q0; stated explicitly (a logic/doc-only task does not become Q3 per qa-profiles.md §23).
- Visual source-map / canonical-UI record: **N/A** — no artifact is changed; the report *documents* colors rather than altering them (reason stated).
- Negative flows selected by applicability: **yes** (§11; out-of-gamut, dark, exact-match, N/A runtime).
- No uninspected claim: **yes** — §3 values were read from the files this session; the executor must re-confirm before tabulating (R7).
- Gates prove the deliverable: **yes** — reproducible conversion + diff-scope check are the real proof, not procedure.
- Assumptions/decisions visible: **yes** (§5 OQ carried into R5).

---

**Task path:** `tasks/kickoff_prompt_Task_660_Brand_Color_OKLCH_Hex_Drift_Audit.md`
**QA profile:** `Q0` (read-only report; no build/visual gate)
**Remaining owner decision (surfaced by the report, not resolved here):** whether to correct the globals.css oklch brand scale to the declared `#EC5447` brand (app-wide primary shift → Q3/Q4 follow-up) or accept the rendered `#D25656` and reconcile comments. This audit produces the data for that call.
