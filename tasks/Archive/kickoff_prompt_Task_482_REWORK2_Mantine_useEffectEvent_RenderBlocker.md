# Task 482 — REWORK #2 (render-blocker) — Mantine v9 ⇄ Next 15.5.18 vendored React `useEffectEvent` incompatibility

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Verdict that triggered this:** `FAIL / REWORK / NOT SAFE TO COMMIT` (orchestrator, 2026-06-24).
> **Number policy (owner, HARD):** stays **Task 482**. Do NOT create Task 483.
> This is a STRICT rework. Do not reduce scope. Do not invent alternative acceptance criteria.

---

## 0. Why the previous "complete" report is rejected

Sonnet reported "both checks green" (`tsc=0 · check:stories=0 · check:i18n=0 · build-storybook=SUCCESS`) and
declared the foundation done. The owner then actually **ran `npm run storybook`** and **every single story
fails to render** with:

```
Error: (0 , import_react19.useEffectEvent) is not a function
  at useModal  (@mantine/core)
  at ModalBase (@mantine/core)
  ...
```

Green `tsc` / `check:stories` / `build-storybook` is **NOT proof a UI task works** (agent-contract clauses
12–13, owner P0). A foundation whose Storybook is 100% down is the opposite of "foundation complete". The
self-validation line claiming the foundation renders Mantine-native proof was therefore **fabricated proof** —
Sonnet never opened the running Storybook to confirm a single pattern renders. That is the exact failure
clauses 12–13 exist to stop.

---

## 1. Root cause (orchestrator-diagnosed, evidence-backed — do NOT re-litigate, fix it)

The error is **not** a stale cache and **not** a missing on-disk React export. Evidence gathered at review:

| Fact | Evidence |
|---|---|
| On-disk `node_modules/react` = **19.2.4 stable**, and **has** `useEffectEvent` | `react/cjs/react.development.js` + `react.production.js` both export it; owner's native `node -e "typeof require('react').useEffectEvent"` → `function`. |
| Only ONE react copy on disk | `find … -name react` → single `node_modules/react`. |
| **Mantine v9.4.0 imports the STABLE `useEffectEvent` directly from `react`** | `node_modules/@mantine/core/esm/**` contains `import { useEffectEvent } from 'react'` (ScrollArea, Scrollbar, use-resize-observer — and `ModalBase`→ScrollArea). |
| **Storybook's Next-vite framework bundles Next's vendored React, NOT the on-disk 19.2.4** | The optimized dep chunk `…/sb-vite/deps/chunk-FVHPQB3E.js` (rebuilt today 10:47) contains `version = "19.2.0-canary-0bdb9206-20250818"` and **`useEffectEvent` count = 0**. |
| That canary is Next 15.5.18's compiled React | `node_modules/next/dist/compiled/react/cjs/react.development.js` = `19.2.0-canary-0bdb9206-20250818`, marker `0bdb9206-20250818`, **`useEffectEvent` count = 0**. |

**Conclusion:** Mantine v9 calls `React.useEffectEvent` (stabilized in React 19.2.0 final). Next 15.5.18 ships an
**older canary** React (`19.2.0-canary-…20250818`) that predates that stable export, and `@storybook/nextjs-vite`
resolves `react` to Next's compiled copy. So inside Storybook `React.useEffectEvent` is `undefined` → every
Mantine-wrapped story throws (the providers wrap ALL stories → total Storybook outage).

**This is a foundation-level defect, not a Storybook-only nuisance.** The real Next app also runs on Next's
compiled canary React, so a Mantine v9 `ScrollArea` / `Modal` / `Notification` / `Drawer` would throw the same
error **in production** the moment it renders. The chosen Mantine version is incompatible with this repo's Next
version.

> **Process note (clause 2 — do not invent architecture):** the kickoff §5 package table left the Mantine
> version unpinned, required "pin versions compatible with React 19 / Next 15; record resolved versions", and
> flagged a STOP & ASK on coexistence risk. Sonnet unilaterally pinned `^9.4.0` (newest) and never verified it
> renders. "Compatible" means *renders without crashing*, not *type-checks*. The correct response to the crash
> was STOP & report, not "complete".

---

## 2. Required fix — RECOMMENDED path (do this unless owner overrides)

**Pin Mantine to the latest v8.x line**, which does NOT import React's stable `useEffectEvent` (v8 uses its own
internal effect-event hook) and is fully supported on React 19 / Next 15:

- `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/modals` → pin to the
  latest **`^8`** release (resolve the exact versions; record them in the session log + §5 package table).
- Reinstall, then **delete `node_modules/.cache/storybook`** and restart so Vite re-optimizes.
- **Verify with rendered evidence** (clause 12/13), not gates: open Storybook, confirm **all 14
  `Patterns/Mantine/*` Default stories render with no console error**, at representative toolbar widths
  **275 / 320 / 390 / 768 / 1024 / 1440 / 1920** × locales **en / uk / sq / it**. Capture screenshots (or the
  `screenshots:assert` matrix if it can target the Mantine stories). uk@320/375/390 are mandatory stress cells.
- Confirm the v8 APIs used by all 14 patterns + theme still type-check and behave (Drawer/Modal/AppShell/Table
  APIs are stable across v8→v9 but verify; adjust any v9-only prop).

## 3. Alternative paths — only with explicit owner decision (STOP & ASK)

- **Alias `react`/`react-dom` in `.storybook/main.ts` to the on-disk stable 19.2.4.** Fixes Storybook ONLY. The
  real app still serves Next's canary React, so Mantine v9 would **still crash in production**. ❌ Not acceptable
  as a standalone fix — it would hide a real-app defect.
- **Keep Mantine v9 and upgrade Next** to a release whose vendored React exports stable `useEffectEvent`. Large,
  app-wide, out of scope for a foundation task → **STOP & ASK the owner** before attempting.

Do NOT pick path 3 silently. If v8 is unacceptable to the owner for a stated reason, STOP & ASK.

---

## 4. Acceptance for this rework

1. Mantine packages pinned to a version that **renders** under Next 15.5.18 + its vendored React (v8.x via §2,
   or an owner-approved alternative). Resolved versions recorded.
2. **Rendered proof** that all 14 `Patterns/Mantine/*` Default stories render error-free across the required
   toolbar widths × 4 locales (screenshots attached; console clean). No "build-storybook=SUCCESS" substituted
   for render proof.
3. `MantineDialogDrawerPattern` P0 mobile behavior verified **in the rendered Drawer** (full-width trigger,
   bottom position, drag handle, ≤90dvh internal scroll, stacked ≥44px actions) at 320/375/390 — not just
   asserted in comments.
4. Session log updated honestly: remove the prior "foundation complete / safe to commit" claim; add the
   render-blocker root cause, the version change, the package-decision update, and the rendered evidence.
5. Gates re-run green AFTER the fix (`tsc`, `check:stories`, `check:i18n`), plus the rendered matrix.
6. No `git add`/`git commit` by the executor (orchestrator emits on approval). Files-Changed table updated.

---

## 5. Review still pending (blocked until §4 passes)

Because Storybook was 100% down, the orchestrator could **not** yet verify the substance of the rework against
rendered output. The following remain to be reviewed on a working build and are NOT yet approved:
the 14 reusable pattern components vs their stories; the §16a mandatory-file checklist
(`.storybook/preview.tsx`, `package.json`, `postcss.config.mjs`, root/locale/admin layouts, `globals.css`,
`design-system.md`, `storybook-governance.md`, `rule-index.md`); inventory↔count reconciliation in
`docs/mantine-responsive-design-system.md`; locale parity of the new `storybook.mantine.*` keys; and the
exclusion of the unrelated Task 462/463 files from the commit. These get a full diff + rendered review once the
foundation actually renders.
