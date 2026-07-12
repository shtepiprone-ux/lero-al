# Task 585 — `UserMenu` story: open only the admin fixture on desktop (clean, non-overlapping rendered proof)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** Storybook / visual-snapshot (STORY-ONLY — no product code, no behavior change).
**Depends on:** Task 578 implementation (in working tree, not yet committed). **Plan:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.

## Why (orchestrator finding on the 578 review, 2026-07-12)

`UserMenu.stories.tsx`'s `play` function opens BOTH fixtures on desktop (clicks the regular *Alba Krasniqi*
trigger, then the admin *Driton Berisha* trigger). Because each fixture is an independent uncontrolled
`MantineDropdownMenu`, on desktop both anchored dropdowns stay open at once and **visually overlap** — the
admin menu renders on top of the still-open regular menu, occluding the regular menu's items
(confirmed by opening `.screenshots/rendered-assert/2026-07-11T22-03/mantine-primitives-usermenu--default__en__desktop-1024.png`).

This also makes the 578 session log's rendered-evidence claim inaccurate: it states "the regular fixture's
trigger visible-**but-closed**" while the pixel shows it **open and overlapped**. The geometry gate passed
the cell (it is blind to anchored-dropdown overlap on desktop — same class of miss as the mobile
bottom-sheet overlap that WAS caught), so the misleading proof slipped through.

Fix: on desktop, open **only the admin fixture** — leaving the regular trigger closed and fully visible.
This makes the desktop render clean and non-overlapping AND makes the existing 578 log description true
(admin open, regular closed). Mobile already returns early and is unchanged.

## Files in scope

- `src/stories/mantine/primitives/UserMenu.stories.tsx` — **ONLY code file.** Edit the `play` function: remove
  the regular (*Alba Krasniqi*) trigger click; open only the admin (*Driton Berisha*) trigger on desktop. Keep the
  `if (window.innerWidth < 640) return` mobile guard exactly as-is.
- `docs/sessions/2026-07-11-task585-usermenu-story-desktop-single-open.md` — **NEW** session log.
- `docs/backlog.md` — update (orchestrator will also touch this at review).

**MUST NOT touch:** `UserMenu.tsx`, `Header.tsx`, `messages/*.json`, `MantineDropdownMenu`, the story's `render`
body / fixtures / title / `MantineStoryShell` / captions. This is a two-line change inside `play` only.

## Current behavior to PRESERVE (exact)

- Story title `Mantine/Primitives/UserMenu`, single `Default`, `MantineStoryShell`, regular + admin fixtures,
  `storyT` captions — all unchanged.
- Mobile `<640`: `play` returns early → both triggers closed, full-width chrome proof — unchanged.
- The admin dropdown's open-state proof (5-item order: Profile · My listings · Add listing · Dashboard · Logout;
  Dashboard brand-colored; destructive Logout) — still shown, just now WITHOUT the overlapping regular menu.

## Required after behavior

`play` (desktop only, guard unchanged):

```ts
play: async ({ canvasElement }) => {
  if (window.innerWidth < 640) return
  const canvas = within(canvasElement)
  // Open ONLY the admin fixture — two independent uncontrolled MantineDropdownMenus both left
  // open overlap on desktop (Task 585). The admin menu is the differentiating proof (Dashboard
  // item); the regular fixture's trigger stays closed and fully visible. The regular menu's
  // no-Admin-item role gate is a plain `role === 'admin'|'moderator'` conditional in
  // UserMenu.tsx, verified by code inspection (not by a second open dropdown).
  const adminTrigger = await canvas.findByRole('button', { name: /Driton Berisha/ })
  await userEvent.click(adminTrigger)
},
```

Result on desktop: admin dropdown open (correct 5-item order, no occlusion), regular *Alba Krasniqi* trigger
closed and fully visible, **no overlap**.

## Positive flow (happy path)

- **Actor:** Storybook `--mantine-only` render harness at a desktop width (≥640).
- 1. `Default` renders both fixtures (triggers). 2. `play` runs, clicks only the admin trigger. 3. Admin dropdown
  opens near its trigger; regular trigger remains closed and unobscured.
- **Success:** desktop screenshot shows exactly ONE open menu (admin, full 5 items) with no dropdown overlapping
  the regular fixture; the 578 log's "regular closed, admin open" description is now literally true.

## Negative flow (every off-happy-path branch)

- **Mobile `<640`:** `play` returns early → both triggers closed, full-width, no clip/h-scroll — byte-identical to 578.
- **Regular fixture's role gate (no Admin item):** NOT proven by a second open dropdown anymore; proven by
  `UserMenu.tsx`'s `role === 'admin' || role === 'moderator'` conditional (code inspection). If you believe a
  rendered proof of the closed-regular-menu contents is required, **STOP and ASK** — do not add a second open
  dropdown back (that reintroduces the overlap) and do not fork `MantineDropdownMenu`.
- **Trigger not found / userEvent timing:** `findByRole` awaits the trigger; no change to that pattern.

## Mobile <640 full-width gate (agent-contract clause 11)

Unchanged by this task — the mobile guard already keeps both triggers full-width and closed. Verify no
horizontal scroll at 320 in all four locales still holds after the change.

## Acceptance criteria (each maps to a flow; verifiable in the diff)

1. `play` opens ONLY the admin (*Driton Berisha*) trigger on desktop; the regular (*Alba Krasniqi*) click is
   removed; the `window.innerWidth < 640` guard is unchanged. *(diff)*
2. **§18.9 human-visual proof (mandatory):** desktop `en`/`uk` @1024 render shows the admin dropdown open with the
   correct 5-item order (Dashboard present, brand-colored) AND the regular trigger closed + fully visible + **no
   overlap**. Session log records the human-inspected result. *(render)*
3. Mobile uk@320/375/390 both triggers closed, full-width, captions wrap, no clip/h-scroll — unchanged. *(render)*
4. No product code touched: `UserMenu.tsx`, `Header.tsx`, `messages/*.json` byte-identical (grep/diff-confirmed);
   story `render`/fixtures/title/captions unchanged — only the `play` body differs. *(diff)*
5. Gates green: `npx tsc --noEmit`=0, `npm run lint` 0 new, `check:stories`, `check:i18n`, `check:file-integrity`,
   `screenshots:assert -- --mantine-only` with **no regression vs the 644/618/0/26 baseline** (cell count unchanged
   — the `UserMenu` cells stay pass; the desktop cells now render a single non-overlapping open menu). *(transcript)*
6. `docs/backlog.md` + `docs/sessions/2026-07-11-task585-usermenu-story-desktop-single-open.md` updated with a Files
   Changed table. **Executor emits NO `git add`/`git commit`** (orchestrator emits at review).

## Pre-read (rule-index → "Storybook / visual snapshot task")

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` — always-required.
- `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof rules) + **§18.9** (internal-spacing /
  human-visual iron rule — geometry gate is BLIND to overlap; PASS count is NOT proof).
- `docs/storybook-governance.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `docs/critical-flow-registry.md` — scan: story-only `play` change, no product flow touched; no registry row applies.

## Hard contract (verified against the diff on return)

No scope change (story `play` only); no product code; no invented architecture (if a rendered proof of the
closed-regular menu's contents seems required → STOP and ASK, do NOT reopen the overlap or fork the primitive);
literal AC; self-validation block + AC-by-AC table; §18.9 human-visual proof in the log; single-file code scope;
Files Changed table; executor never runs git.
