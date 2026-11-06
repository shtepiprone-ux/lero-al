# Sprint 34 — Task 394 (PREREQUISITE #0) — Upgrade Storybook to latest stable + retire the <640 workarounds + re-prove every gate

> **🔴 BLOCKS ALL OTHER SPRINT 34 TASKS (308/309/237/238/243/316/317/318/246/310/311/313).** Every later task relies on
> the Storybook gates (`check:stories`, `check:locale-leak`, `screenshots:assert`) as their ONLY accepted rendered proof
> (agent-contract clause 13). Those gates run against a BUILT Storybook; a stale major + hand-rolled <640 hacks make the
> proof unreliable. This task must ship + be approved BEFORE any other task starts.
>
> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–13) FIRST.** No scope change;
> STOP & ASK if ambiguous. This is a **tooling/dependency + Storybook task**, NOT a product-code task — but its definition
> of done is **machine-proven**, not "it builds".

```
Type:        chore (dependency/tooling upgrade) + Storybook governance
Priority:    CRITICAL (prerequisite gate)
Current:     storybook 8.6.18 · @storybook/addon-essentials 8.6.14 · @storybook/experimental-nextjs-vite 8.6.18
Target:      latest STABLE Storybook major (run `npx storybook@latest upgrade`; PIN + document whatever it resolves to —
             likely 9.x). Migrate addon-essentials → the SB9 addon model; experimental-nextjs-vite → the stable framework pkg.
Area:        .storybook/main.ts, .storybook/preview.tsx, .storybook/preview-head.html, package.json,
             scripts/check-stories.mjs, scripts/check-stories-rendered.mjs (screenshots:assert), scripts/check-locale-leak.mjs
```

## Why this task exists
We run Storybook **8.6** and built hand-rolled workarounds ("костилі") so `<640px` stories render correctly — chiefly the
custom `VIEWPORTS` preset map + the `withCanvas` gutter decorator in `.storybook/preview.tsx`. The newer Storybook major
restructures the viewport addon (`addon-essentials` is split; viewport/controls/actions move; a `globals`-based viewport
API replaces `parameters.viewport.defaultViewport`) and stabilises the Next-vite framework (`experimental-nextjs-vite` →
stable). Upgrading lets us **retire the genuine hacks** and run on supported APIs — but the upgrade also risks breaking the
three machine gates (which parse `storybook-static`, the story index, and iframe URLs via Playwright). So the task is:
upgrade → re-evaluate each <640 workaround (remove the now-unnecessary, keep + document the canonical) → **re-prove every
gate green AND still-failing-on-a-planted-violation**.

## Pre-read (mandatory)
1. `docs/agent-contract.md` (1–13) · `docs/backlog.md`
2. `docs/rule-index.md` → "Storybook / visual snapshot task" bundle (`storybook-governance.md`,
   `storybook-visual-snapshots.md`, `component-rules.md`, `qa-rules.md`) + `docs/dependencies.md` (dependency policy /
   approved-package rules) + `docs/responsive-screenshot-governance.md` + `docs/responsive-screenshot-matrix.md`.
3. `docs/storybook-governance.md` **§14 (all subsections, incl. §14.1 canvas, §14.5–§14.8 gates + the locale-leak CI gate
   from Task 393)** — the gate contract you must keep green.
4. Read before editing: `.storybook/main.ts`, `.storybook/preview.tsx` (the `VIEWPORTS` map + `withCanvas` + `withTheme` +
   `globalTypes` + `viewport` parameter), `.storybook/preview-head.html`; `scripts/check-stories.mjs`,
   `scripts/check-stories-rendered.mjs`, `scripts/check-locale-leak.mjs` (how they locate stories + drive the built SB).
5. The official Storybook migration guide for the target major (run `npx storybook@latest upgrade`, which applies codemods;
   review every automrod change in the diff — do NOT accept blindly).
6. `package.json` scripts (`storybook`, `build-storybook`, `check:stories`, `check:locale-leak`, `screenshots:assert`,
   `prebuild-storybook`).

## Required investigation — inventory the <640 "костилі" BEFORE changing anything
List in the session log every `<640`-specific workaround and classify each as **REMOVE (newer SB handles it natively)** /
**KEEP-CANONICAL (intentional, mirrors the real app — document why it is NOT a hack)** / **REPLACE (migrate to the new SB
API)**. At minimum cover:
- The custom `VIEWPORTS` map + `parameters.viewport.defaultViewport` (SB9 uses a `viewport` globals API + `INITIAL_VIEWPORTS`
  / `MINIMAL_VIEWPORTS`) — migrate to the supported API; keep the project's exact 320/360/375/390/412/480/640/768/… widths.
- The `withCanvas` `.container-wide py-6` decorator — this MIRRORS the real app gutter so `max-sm:w-full` fills `<640`
  edge-to-edge. It is **canonical, not a hack** (design-system.md §4/§14.1). KEEP it, but re-verify it still produces the
  correct <640 edge-to-edge fill under the new SB layout engine. If the new SB changes the iframe sizing so the gutter
  double-applies or mis-applies, fix to the canonical result.
- `addon-essentials` → the SB9 split (docs/viewport/controls/actions). `experimental-nextjs-vite` → stable framework pkg.
- Any `parameters.layout` usage forbidden by clause 13 (must stay absent).

## Acceptance criteria (machine-proven — tsc/build is NEVER proof)
- Storybook upgraded to the pinned latest-stable major; `package.json` + lockfile updated; the resolved version recorded in
  the session log + `docs/storybook-governance.md`. `npm run storybook` (dev) and `npm run build-storybook` both succeed.
- Every <640 workaround classified (REMOVE/KEEP-CANONICAL/REPLACE) with the action taken; genuine hacks removed; the
  canonical gutter kept + re-verified.
- **All three gates GREEN on the new build, in the transcript:** `npm run check:stories` (0 violations), `npm run
  check:locale-leak` (`leakCount: 0`), `npm run screenshots:assert` (all green; uk@320/375/390 present). Any script that
  parsed SB8-specific `storybook-static` internals (story index format, iframe URL) is updated for the new major.
- **Negative-flow proof for EACH gate** (proves they still bite): plant one violation (a hardcoded English string in a
  story; a non-full-width <640 control; a removed locale key) → show each gate FAILS → revert. Paste transcripts.
- **Full rendered conformance re-run** proving no `<640` regression from the upgrade: the `screenshots:assert` PNG/JSON
  matrix across sq/en/uk/it, uk@320/375/390 mandatory — equal to or better than the pre-upgrade baseline (812/812 ref).
- The 4-locale + theme toolbar globals still work; `check:i18n` parity unchanged.
- `tsc=0`, `lint=0`. `docs/storybook-governance.md` updated (new version + any API migration notes + the workaround
  disposition table). `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table**; **no `git add`/`commit` from
  executor** (orchestrator emits commits after diff + rendered-artifact review).

## Negative / risk handling (call out, do not silently absorb)
- If the upgrade codemod rewrites story files or configs in ways that touch product behaviour or violate clause 13, STOP &
  ASK — do not accept automod blindly.
- If a gate cannot be made green because the new SB changed an internal the script depends on, FIX the script (documented),
  do NOT weaken/disable the gate. A disabled gate = task INCOMPLETE.
- If the canonical `withCanvas` gutter cannot reproduce the <640 edge-to-edge fill on the new engine, STOP & ASK before
  inventing a new workaround.
- Cowork sandbox cannot build Storybook (EPERM on the Windows mount; no chromium) — the rendered gates run on the **owner's
  Windows side**, same as Task 393. The session log attaches the machine artifacts from that run.

## Out of scope
- Any product-code change (`src/**`, `messages/**` beyond a planted-then-reverted test key). Any of the 11 follow-on tasks.
- Adding new stories or new components. Restyling components. Changing the canonical breakpoint set or the gate contracts
  (only migrate their implementation to the new SB major; the rules in storybook-governance §14 stay).
