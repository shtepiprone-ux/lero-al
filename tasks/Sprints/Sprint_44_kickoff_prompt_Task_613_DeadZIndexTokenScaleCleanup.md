# Task 613 — Remove the DEAD `--z-*` Tailwind z-index token scale from `globals.css` (reconcile `ui-rules.md §16/§12`)

## Mode and task type

Implementation task. Type: **dead-CSS / governance cleanup** in a product stylesheet (`src/app/globals.css`) + doc reconciliation. No rendered/behavioral change (the tokens are provably inert). Orchestrator-opened 2026-07-16 from the Task 612 STOP-AND-ASK; LOW priority, non-blocking. Owner steer (2026-07-16): the project is moving off Tailwind onto Mantine — **deprecate the dead scale, do NOT revive it**.

## Objective

Delete the seven dead `--z-*` custom properties from `globals.css`'s `@theme inline` block and correct the misleading comment that claims they "back `z-{name}` utilities", then reconcile `docs/ui-rules.md §16/§12` so the file documents only the ONE real z-index story (numeric core `z-30/z-40/z-50` + the allowlisted `z-[9999]` escape-hatch + Mantine's own managed tiers). Zero pixel change: the tokens generate no utilities and have no consumers, so removing them cannot alter any rendered output.

## Verified context

All facts below were inspected read-only this session (globals.css, greps across `src/`, `ui-rules.md`, `package.json`, the portal test) — not assumed.

- **The dead scale** lives in `src/app/globals.css` inside `@theme inline` (block opens `globals.css:22`), lines **240–251**:
  - `240`: section comment `/* ── 4. Z-index — canonical semantic scale ── */`
  - `241–244`: a comment claiming the tokens back `z-{name}` utilities and citing `ui-rules.md §16` + the `z-[9999]` exception
  - `245–251`: `--z-base:0 · --z-dropdown:10 · --z-sticky:30 · --z-overlay:40 · --z-modal:50 · --z-popover:50 · --z-toast:100`
- **Why they are dead:** Tailwind v4 generates `z-*` utilities only from the `--z-index-*` namespace. `--z-*` is NOT that namespace, and there is no `@utility`/`.z-toast{}` rule anywhere in `src/**/*.css`. So `z-toast`/`z-sticky`/`z-dropdown`/`z-overlay`/`z-modal`/`z-popover`/`z-base` match no rule → compute `z-index: auto`. (Independently confirmed already: `ListingGallery.portal.smoke.test.tsx`'s header comment records the empirical `getComputedStyle(...).zIndex === "auto"` scan + zero compiled `.z-toast/.z-sticky/.z-overlay` rules.)
- **Blast radius is effectively zero (verified 2026-07-17):**
  - `grep -rnoE 'var\(--z-[a-z]+\)' src/ app/` → **0 matches**. No CSS/inline `var(--z-*)` consumer exists — nothing breaks when the tokens are deleted.
  - The only `z-popover` / `z-modal` textual hits in product code are **inside a comment** on `src/components/shared/Combobox.tsx:207` (the real class there is the preserved `z-[9999]` escape-hatch: `portal && 'z-[9999]'`, with `// design-tokens-allow: z-[9999] — … above z-modal/z-popover (50) … (§22.3)`). No live `z-{name}` utility class is applied to any element.
  - `src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx` references `z-toast`/`z-sticky`/`z-overlay` **only in explanatory comments**; its fake chrome uses a REAL inline `style={{ zIndex: 30 }}` — it does not depend on the tokens.
  - The former real consumer (`ListingGallery.tsx` `z-toast`) was removed by **Task 612** (lightbox → Mantine `fullScreen Modal`).
- **The docs already describe the REAL system numerically:** `docs/ui-rules.md §16` (`ui-rules.md:599+`) and the `§12` governance table (`:477`) both state "Chrome `z-30` · scrim `z-40` · floating `z-50`" using core numeric utilities — which are standard Tailwind, unaffected by removing `--z-*`. The dead `--z-*` block was a parallel, never-wired semantic layer.
- **Governance gate:** `npm run check:design-tokens` (`scripts/check-design-tokens.mjs`, `package.json:63`) detects raw z-index literals and honors `// design-tokens-allow:` markers + `scripts/design-tokens-allowlist.json`. It must stay green; the `z-[9999]` markers in `Combobox.tsx`/`PerfDevOverlay.tsx` are preserved.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Task 612 STOP-AND-ASK + owner steer | The seven dead `--z-*` declarations are removed from `globals.css` (§4 z-index block), and the comment no longer claims a working `z-{name}` named scale. | P1 | Source diff (`globals.css`) | Confirmed |
| R2 | Verified context | Removal is provably consumer-free: a grep transcript shows 0 `var(--z-*)` consumers and 0 live `z-{name}` utility classes in `src/` (comment-only mentions excluded). | P1 | Grep transcript + diff | Confirmed |
| R3 | ui-rules §16/§12 | `docs/ui-rules.md` §16 and the §12 table document only the real z-index story (core `z-30/40/50` + `z-[9999]` allowlisted escape-hatch + Mantine managed tiers); no `--z-*`/`z-toast` claim of a working named scale remains. | P1 | Doc diff | Confirmed |
| R4 | agent-contract §1 scope | NO rendered/behavioral change: no product `.tsx` element loses/gains a working z-index; the `z-[9999]` escape-hatch and numeric `z-30/40/50` usages are byte-identical. | P0 | Grep + rendered baseline | Confirmed |
| R5 | qa-rules §14 | `check:design-tokens` stays green (allowlist/markers untouched or reconciled with before/after if it referenced `--z-*`); touched files UTF-8 no-BOM, mojibake-free; `tsc`/`eslint`/build clean; portal smoke test stays green. | P1 | Named commands below | Confirmed |

## Assumptions and open questions

- **Assumption (grep-gated, not blind):** re-running the R2 grep at execution still yields 0 live consumers. If a real `z-{name}` utility class or `var(--z-*)` consumer HAS appeared since 2026-07-17, do NOT blind-delete — migrate that consumer to a working core `z-30/40/50` class (matching its §16 tier) in the same task, or **STOP-AND-ASK** if its tier is ambiguous (e.g. it must beat a Mantine overlay).
- **Open (minor):** the `ListingGallery.portal.smoke.test.tsx` comments describe the `--z-*` scale as still-existing. Updating those historical comments is OPTIONAL doc-sync (they explain WHY Task 612 migrated); leave them unless trivially clarified. Not an acceptance gate.
- No owner decision blocks execution.

## Pre-read rule bundle

- **Always:** `docs/agent-contract.md` (§1 scope, §14 file integrity), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — z-index cleanup is not a listed critical flow; confirm none).
- **Required:** `docs/ui-rules.md` §12 + §16 (the sections you reconcile), `docs/qa-profiles.md` (Q1), `docs/qa-rules.md` (§14 encoding/file-integrity + the design-token gate).
- **Read first, in full:** `src/app/globals.css` §4 z-index block (lines ~240–251) and its surrounding `@theme inline` structure — you are deleting inside it, not restructuring it.
- Do NOT read the full docs set. Do NOT add a `--z-index-*` namespace or any `@utility` block.

## Scope

- `src/app/globals.css` — remove the dead `--z-*` declarations (`245–251`) and rewrite the `240–244` comment so it no longer claims a working named scale (a one-line breadcrumb pointing to `ui-rules.md §16` for the real numeric scale + the `z-[9999]` escape-hatch is fine; do not leave a comment that implies `z-toast` etc. work).
- `docs/ui-rules.md` — §16 + the §12 table: ensure they document only the real z-index story; remove any implication that the `--z-*` named tokens/utilities exist or are authoritative.
- `docs/backlog.md` (concise current-state line marking 613) + a session log under `docs/sessions/`.
- ONLY if the R2 grep finds a genuine live consumer: that `src/**` file, migrated to a working class (one change per consumer, no behavior change).

## Out of scope

- No `--z-index-*` namespace, no `@utility` resurrection, no reviving the token scale in any form (explicitly rejected by the owner).
- No change to the numeric `z-30/z-40/z-50` utilities, the `z-[9999]` escape-hatch (`Combobox.tsx:207`, `PerfDevOverlay.tsx:43`), or any Mantine overlay z-index tier.
- No Task 612 lightbox change (already migrated). No conversion of anything to Mantine.
- No rewrite of `ListingGallery.portal.smoke.test.tsx` logic (optional comment-sync only, non-gating).
- No i18n key, no breakpoint, no chrome, no dependency, no rendered pixel change.

## Current and required behavior

**Current:** `globals.css` `@theme inline` declares a seven-stop `--z-*` semantic z-index scale that Tailwind v4 never compiles into utilities, so `z-toast`/`z-sticky`/etc. silently resolve to `z-index: auto`. A comment asserts these tokens "back `z-{name}` utilities" — false. The real, working layering is entirely numeric (`z-30/40/50`, `ui-rules.md §16`) plus the allowlisted `z-[9999]`. The dead tokens mislead future work (they were the root cause the Task 612 lightbox bug hid behind).

**Required:** the dead `--z-*` declarations are gone and the comment corrected; `ui-rules.md §16/§12` state only the real numeric + escape-hatch story. Every rendered surface is byte-identical (nothing consumed the tokens). `check:design-tokens` and all standing gates stay green.

## Implementation requirements

1. Re-run and paste the two grep gates FIRST (before editing): (a) `grep -rnE '\bz-(toast|sticky|modal|overlay|popover|dropdown|base)\b' src --include=*.tsx --include=*.ts` and manually exclude comment-only/test-comment hits; (b) `grep -rnoE 'var\(--z-[a-z]+\)' src app`. Confirm 0 live consumers. If any real consumer exists, migrate it per Assumptions or STOP-AND-ASK.
2. Delete `globals.css:245–251` (the seven `--z-*` declarations) and rewrite the `240–244` comment so no reader believes a `z-{name}` named scale works; keep a short breadcrumb to `ui-rules.md §16`. Do not touch anything else in `@theme inline`.
3. Reconcile `docs/ui-rules.md` §16 + the §12 table to the single real story (core `z-30/40/50` + `z-[9999]` allowlisted + Mantine tiers); remove any `--z-*`/`z-toast`-implies-a-working-utility wording.
4. If `scripts/check-design-tokens.mjs` / `scripts/design-tokens-allowlist.json` references `--z-*`, reconcile it in the same change and paste before/after; otherwise confirm it does not.
5. Keep every hex/token/other rule in `globals.css` and every numeric/`z-[9999]` usage byte-identical. Update `docs/backlog.md` (concise) + write the session log. Do NOT run or emit mutating git.

## Positive and negative flows

**Positive:** grep proves 0 live consumers → dead `--z-*` deleted + comment corrected → `ui-rules.md §16/§12` reconciled → `tsc`/`eslint`/`check:design-tokens`/`check:file-integrity`/`check:mojibake` green → the `ListingGallery.portal.smoke.test.tsx` guard stays green → rendered baseline byte-identical (dead CSS removed changes no pixel).

| Branch | Applicable? | Reason | Expected | Evidence |
|---|---:|---|---|---|
| A live `z-{name}` utility class still applied in `src/**` | Yes (grep-gated) | must not silently break layering | migrate to working `z-30/40/50` (or STOP-AND-ASK if tier ambiguous) | R2 grep + per-consumer diff |
| A `var(--z-*)` CSS/inline consumer exists | Yes (grep-gated) | deleting the token would break it | keep only that token + document, or migrate consumer | `var(--z-` grep |
| `check:design-tokens` references `--z-*` | Yes | gate could go red on removal | reconcile gate/allowlist same change, before/after | gate transcript |
| Rendered/visual change | No | tokens generate no utilities, 0 consumers | baseline byte-identical | `screenshots:assert --mantine-only` |
| i18n / RLS / data path | No | no strings, no data, no runtime logic | N/A | — |

## Acceptance criteria

- **AC1 [R2]** Given the two grep gates run at execution, when inspected, then they show 0 live `z-{name}` utility consumers and 0 `var(--z-*)` consumers in `src/` (comment/test-comment hits excluded), OR each live consumer is listed and migrated. *(transcript)*
- **AC2 [R1]** Given `globals.css` after the change, when the §4 z-index block is read, then the seven `--z-*` declarations are gone and no comment claims a working `z-{name}` named scale. *(file:line)*
- **AC3 [R3]** Given `docs/ui-rules.md` §16 + §12, when read, then they document only core `z-30/40/50` + `z-[9999]` + Mantine tiers; no wording implies the `--z-*` named utilities exist/are authoritative. *(file:line)*
- **AC4 [R4]** Given `screenshots:assert --mantine-only` (or a before/after spot-render of one overlay-heavy page), when compared to the pre-change baseline, then it is byte-identical / 0 new FAIL. *(evidence)*
- **AC5 [R5]** `check:design-tokens` green (allowlist/markers intact or reconciled with before/after); `npx tsc --noEmit`=0; `eslint` clean on touched files; `check:file-integrity`+`check:mojibake` clean; the `ListingGallery.portal.smoke.test.tsx` guard passes. *(transcripts)*

## QA profile and verification plan

**Profile: Q1 Targeted.** Rationale: touches a product stylesheet (`globals.css`) and a doc, but the removed tokens are provably inert (0 consumers, generate no utilities), so there is no rendered UI behavior to change — `docs/qa-profiles.md` allows `Q1` approval without rendered screenshots when no rendered behavior changed. The grep-gate (R2) is the primary proof; a rendered baseline is belt-and-suspenders. This is NOT a Q2 UI change (no surface is modified) and NOT Q0 (a product CSS file, not docs-only).

Commands / evidence:
- Grep gates (AC1): the two greps above, pasted with comment/test hits annotated as excluded.
- `npx tsc --noEmit` → 0 errors. `npx eslint src/app/globals.css docs/ui-rules.md` (or the repo's lint entry for touched files) → clean.
- `npm run check:design-tokens` → green (paste; if the allowlist referenced `--z-*`, paste before/after).
- `npm run check:file-integrity` + `npm run check:mojibake` → clean.
- `npx vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx` → green (proves the Task 612 stacking guard is unaffected).
- `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` → 0 new FAIL, byte-identical baseline (AC4). If the built-Storybook run is unavailable in the executor environment, record it as an owner-native handoff with the exact command + expected 0-FAIL/byte-identical result — do not substitute a confidence claim.

## Completion report contract

Sonnet must report: both grep transcripts (with the comment/test exclusions annotated), the exact `globals.css` hunk removed (line-level diff), the `ui-rules.md §16/§12` diff, every command run with actual output, confirmation that no numeric/`z-[9999]` usage or other `globals.css` rule changed, and the `screenshots:assert` result (or owner-native handoff for it). Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (never self-approved). Update `docs/backlog.md` (concise, mark 613) + write the session log at `docs/sessions/`. Emit NO git. Direct handoff: execute from this saved task path per the `execute-task` workflow.

## Task quality gate

- Executable by a fresh Sonnet session without chat context: yes (exact files, line ranges, pre-verified grep expectations, per-branch instructions, named commands).
- Every primary requirement has a binary AC + verification method: yes (R1→AC2, R2→AC1, R3→AC3, R4→AC4, R5→AC5).
- Scope names what must NOT change (numeric utilities, `z-[9999]`, Mantine tiers, other `globals.css` rules, the lightbox): yes.
- Current/legacy boundary: no UI surface changed → no visual matrix; Q1 justified with a concrete no-rendered-change reason (0 consumers, provably-dead tokens), not a promotion.
- Negative flows selected by applicability (live consumer / `var()` consumer / gate-config), not a generic checklist: yes.
- No uninspected command/file/behavior claimed: all citations (`globals.css:240–251`, grep results, `ui-rules.md §16/§12`, `check:design-tokens`, the portal test) verified this session.
- Assumptions + the grep-gated re-verification and STOP-AND-ASK triggers are visible to the executor: yes.

---

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_613_DeadZIndexTokenScaleCleanup.md`
**QA profile:** Q1 Targeted
**Ambiguous/conflicting requirements:** none (dead-token removal, owner-confirmed deprecate-don't-revive).
**Owner decisions still needed:** none — proceed; STOP-AND-ASK only if the execution-time grep surprisingly finds a live `z-{name}`/`var(--z-*)` consumer with an ambiguous tier.
