# Task 758 — Governance hygiene: four debts from the Sprint 60 reviews

**Sprint:** 60 · **Type:** governance/test hygiene · **QA profile:** `Q1 Targeted` · **Status:** KICKOFF FILED

> **Executor:** Sonnet. Four small, independent fixes. None changes rendered product output.
> Each has its own acceptance criterion and its own proof. Do them in the listed order; if any one
> turns out to be larger than described, STOP and report rather than expanding scope
> (agent-contract clause 2).

## Hard prerequisite

**Tasks 752, 752R, 753, 754 and 755 must be committed before this task starts.** Items 2, 3 and 4
edit files those tasks created or last touched (`FilterMultiToggle.tsx`, `FilterRoomsRow.tsx`,
`NotificationItem.module.css`, `MobileNavDrawer.module.css`). Starting before they land makes the
diff unreviewable. Verify with `git log --oneline -6` and STOP if they are absent.

## Pre-read (load ONLY these)

- `docs/agent-contract.md` (clauses 1, 2, 9)
- `scripts/check-stories-rendered.mjs` (lines ~186–200, the assert registry)
- `scripts/check-click-shield.mjs` (header block + the scenario runner)
- `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx`

---

## Item 1 — Delete three stale `notificationcenter` rows from the rendered-assert registry

**Evidence.** `scripts/check-stories-rendered.mjs:196–198` registers
`notifications-notificationcenter--default`, `--mobile-bottom-sheet` and `--empty`, all anchored on
`data-testid="notification-center"`, under the comment `── Notification (3 — Task 424) ──`. **No
story with title `Notifications/NotificationCenter` exists anywhere in `src/`** — verified with
`grep -rln "NotificationCenter" --include=*.stories.tsx src`, which returns only
`NotificationItem.stories.tsx`. The owner's run of `screenshots:assert:fast` on 2026-08-17 produced
**36 failing cells** (3 stories × 4 locales × 3 viewports), every one
`render failure [sb-show-errordisplay]: Couldn't find story matching '…'`.

These are legacy shadcn-era entries whose story file is long gone. They were already broken before
Sprint 60; `--mantine-only` (what CI blocks on) skips them, which is why nobody noticed.

**Decision (orchestrator, 2026-08-17): delete the three rows.** The component they were meant to
cover now has *better* coverage: `Mantine/Primitives/NotificationBellView` is registered in
`MANTINE_OVERLAY_PRIMITIVES`, so the harness scripted-clicks the bell **open** and asserts geometry
against the real `NotificationCenter` + `NotificationItem` — and it passed every enforced-gate cell
in the same run. Re-creating three `Notifications/NotificationCenter` stories would duplicate that
coverage and violate the no-duplicate rule that Task 754 correctly applied.

**Required change.** Remove the three registry entries and their `── Notification (3 — Task 424) ──`
comment. Replace with a one-line comment recording that this surface is covered by
`mantine-primitives-notificationbellview--default` via the opened-popover path, and that Task 758
removed the dead rows.

**Do not** create any new story, and do not touch any other registry row.

---

## Item 2 — Re-anchor `filterLeafComponents.smoke.test.tsx` off the Tailwind class

**Evidence.** That test locates both filter roots with `container.querySelector('.flex-wrap')` at
lines 160, 167, 178 and 185. Because of it, Task 752 had to keep a functionally redundant
`className="flex-wrap"` on `FilterRoomsRow.tsx:16` and inside `FilterMultiToggle.tsx`'s `cn(...)` —
deliberate Tailwind residue inside the sprint whose goal is removing Tailwind residue. The test also
passes for the wrong reason: its subject is ARIA, but its selector is a layout class.

**Required change.** Anchor the four lookups on something stable and semantic. Preferred:
`container.querySelector('[data-testid="filter-chip-row"]')` added to both components' roots, or
reuse of the existing `role`/`aria-label` contract extended to the unnamed case — **executor picks
one and states why**. Then delete the `flex-wrap` compat class from both components along with the
two explanatory comment blocks that justify it.

**Preserve exactly.** The conditional `role="group"` + `aria-label` behaviour on both roots, in both
directions. Task 730 (Sprint 55) is open on chip-row announcement — **no ARIA semantics change**.
The `className` prop must still reach `FilterMultiToggle`'s root in both the `Group` and `Stack`
branches.

---

## Item 3 — Complete the `transition-property` lists in two CSS Modules

**Evidence.** Tailwind v4.3.0 compiles `.transition-colors` to:

```
transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to
```

`src/modules/notifications/components/NotificationItem.module.css` (Task 754) and
`src/components/layout/MobileNavDrawer.module.css` (Task 755) both stop at `stroke`. Visually this
is a no-op — neither element has a gradient — but `getComputedStyle(el).transitionProperty` returns a
different string, so the "0 mismatches" claims in both session logs had a blind spot on the exact
property those modules exist to reproduce.

**Required change.** Append `--tw-gradient-from, --tw-gradient-via, --tw-gradient-to` to the
`transition-property` declaration in both files, so each is a literal match for what Tailwind emits.
Do not change `transition-timing-function` or `transition-duration` — those already resolve to
identical computed values (`cubic-bezier(.4,0,.2,1)` and `.15s`) and their shorter `var()` form is
correct.

---

## Item 4 — Add a dev-server preflight to `check:click-shield`

**Evidence.** The gate is designed for a local **production** build — `governance-pr.yml:285-395`
runs `npm run build` → `npm start` → `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield`,
with `CLICK_SHIELD_CI_FIXTURE=1`. Run against `npm run dev` instead, it reports **30 interceptions**,
every one attributing the block to `<nextjs-portal>` at `0x0` — the Next.js DevTools overlay, which
exists only in dev. The failures land on components the runner never touched, so the output reads as
"you broke the app" when nothing is wrong. `grep -n "nextjs-portal" scripts/check-click-shield.mjs`
returns nothing: there is no guard today.

**Required change.** Before the first scenario, probe the target for a dev-only marker
(`document.querySelector('nextjs-portal')` is sufficient and is what was actually observed). If
present, exit non-zero **immediately** with a message naming the cause and the correct invocation —
production build, `npm start`, `CLICK_SHIELD_CI_FIXTURE=1`. Do not allowlist or filter the
interceptions: a dev-server run must refuse to produce a verdict at all, never a filtered one. This
is the same principle the modal scenario already applies ("a zero-violation result here would mean
nothing", Task 727 A2).

---

## Out of scope

Any product restyle · any ARIA change · the 84 `Planted/*` failures (the gate's own self-test
fixtures, behaving correctly) · the ~97 catalogued admin/RVS geometry defects recorded in
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` · Tasks 756 and 757.

## Acceptance criteria

- **AC1** — the three `notificationcenter` rows are gone; a rebuilt Storybook plus
  `npm run screenshots:assert:fast` shows those 36 cells absent from the results entirely (not
  passing — absent), with the total cell count dropping by exactly 36. No other cell changes verdict.
- **AC2** — `filterLeafComponents.smoke.test.tsx` no longer contains `.flex-wrap`; its 10 tests still
  pass; `grep -rn "flex-wrap" src/components/shared/FilterRoomsRow.tsx src/components/shared/FilterMultiToggle.tsx`
  returns nothing. Report which anchor was chosen and why.
- **AC3** — both CSS Modules' `transition-property` strings are a literal match for the compiled
  `.transition-colors` value. Prove with a `getComputedStyle` reading of one live element per file,
  before and after, showing the string change and no other property moving.
- **AC4** — planted-failure proof for the click-shield preflight: run it against `npm run dev` and
  show it exits non-zero with the new message and **zero scenarios executed**; then run it against
  `npm run build` + `npm start` (with `CLICK_SHIELD_CI_FIXTURE=1`) and show it proceeds normally.
  A gate that only passes is not evidence — the refusal path is the point.
- **AC5** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `check:mojibake`,
  `check:stories`, `npm run build` all exit 0, plus `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx`.
- **AC6** — no rendered product change. The `Mantine/Primitives/FilterControls` cells must be
  byte-identical before and after item 2, since removing a redundant class must not move a pixel.

## QA profile

`Q1 Targeted`. Nothing here alters rendered output; AC6 is the guard on that claim, and AC1/AC4 are
gate-behaviour proofs rather than visual ones. If item 2's anchor change turns out to require a DOM
attribute on a rendered root, AC6 becomes the binding evidence — capture it, do not reason about it.

## Verification plan

Item order 1 → 2 → 3 → 4. `npm run typecheck` → targeted `vitest` → `npm run build-storybook` →
`npm run screenshots:assert:fast` (AC1 + AC6) → computed-style witness (AC3) → both click-shield runs
(AC4) → `check:design-tokens` → `check:i18n` → `check:mojibake` → `check:stories` → `npm run build`.

**Retain the evidence** under `docs/sessions/evidence/task758/` — manifests, the two click-shield
transcripts, and the computed-style readings. Four consecutive Sprint 60 tasks captured proof into
scratch directories and deleted it; that stops here.

Note that `check:design-tokens --strict` may still fail on `MantineCopyIdButton.module.css` if Task
756 is still uncommitted. That is not yours — report its exit code honestly and state the violations
are out of scope.

## Report contract

Changed files with line numbers. For item 1, the before/after cell counts. For item 2, the chosen
anchor and its justification. For item 3, the computed-style strings. For item 4, both transcripts.
Commands run with actual output and exit codes.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.

## Sprint fit (recorded for the owner)

Items 2 and 3 are debts created by Sprint 60's own tasks, so they belong here. Item 1 was exposed by
Sprint 60 review work but is pure removal, which is Sprint 57's goal — filed here because it is three
lines and splitting it costs more than it saves. **Item 4 fits no open sprint's goal**; it is filed
here for convenience and the owner should move it if that reads as scope drift.
