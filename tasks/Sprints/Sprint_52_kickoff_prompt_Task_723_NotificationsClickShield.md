# Task 723 — Notifications click-shield: unstretch the `bottom-*` containers and add the missing hit-test gate

**Sprint:** 52 — *Gates that stopped checking* (`tasks/Sprints/Sprint_52_Gates_That_Stopped_Checking.md`)
**Severity:** **P0 — live production defect on `lero.al`.** Most homepage buttons and dropdowns are unclickable.
**QA profile:** `Q3 Full Visual Matrix` + a new blocking hit-test gate (see R4).
**Introduced by:** `081c03e7f fix(Task684): offset Mantine notifications to clear the sticky site header` (2026-07-29 17:28).

---

## 1. Pre-read bundle

- `docs/agent-contract.md`
- `docs/qa-profiles.md` (Q3)
- `docs/mantine-responsive-design-system.md` §18 (state selectors cannot live in inline styles/vars)
- `docs/sessions/2026-07-29-task684-notification-header-clearance.md` — the task that introduced this
- `src/design-system/mantine/MantineRootProvider.tsx`
- `scripts/check-stories-rendered.mjs` (gate conventions, `MANTINE_VIEWPORTS`)

Do **not** read the whole `docs/` tree.

---

## 2. Measured current behavior (orchestrator probe, production `https://lero.al/en`, 1920×975, 2026-08-06)

Mantine's `<Notifications>` renders **six** position containers, not one — `top-left`, `top-center`,
`top-right`, `bottom-left`, `bottom-center`, `bottom-right`. All six carry class
`.mantine-Notifications-root` (`.m_b37d9ac7`).

| `data-position` | Rect | computed `top` | computed `bottom` | computed `pointer-events` |
|---|---|---|---|---|
| `top-left` | 440×**0** @ (16, 65) | `65px` | `966px` | `auto` |
| `top-center` | 440×**0** @ (737, 65) | `65px` | `966px` | `auto` |
| `top-right` | 440×**0** @ (1458, 65) | `65px` | `966px` | `auto` |
| `bottom-left` | 440×**950** @ (16, 65) | `65px` | **`16px`** | `auto` |
| `bottom-center` | 440×**950** @ (737, 65) | `65px` | **`16px`** | `auto` |
| `bottom-right` | 440×**950** @ (1458, 65) | `65px` | **`16px`** | `auto` |

**Mechanism, in three facts — each independently verified, none inferred:**

1. Task 684's `top={{ base: 97, sm: 65 }}` is a **component-level** prop. Mantine applies it to the
   root class, unqualified by `[data-position]`, so it reaches **all six** containers — including the
   three that are supposed to be anchored to the bottom.
2. Mantine's own per-position rules are written with `:where()` —
   `.m_b37d9ac7:where([data-position="bottom-left"]) { bottom: var(--mantine-spacing-md) }` — which has
   **specificity 0**. The generated `top` therefore wins without contest, and the three `bottom-*`
   containers end up with **both** edges pinned: `top:65px` + `bottom:16px` ⇒ height stretches to 950px.
3. **No CSS rule anywhere sets `pointer-events` on `.mantine-Notifications-root`.** Enumerated every
   matching rule across all loaded stylesheets: 7 rules match the root selector, `pointer-events` is
   unset in all 7. The container is click-solid by default; Mantine does not ship the usual
   `pointer-events:none` shield on this element.

Consequence: three invisible 440×950 panels at x≈16, 737, 1458 swallow every click beneath them.
`document.elementFromPoint()` at the centre of the homepage "View all" link returns
`div.mantine-Notifications-root`, not the link. Elements *between* the strips still work — hence the
owner's report of "almost all", not "all".

**Before 684** (`<Notifications position="top-right" />`): the `bottom-*` containers had only
`bottom:16px`, height resolved to `auto` = 0, and nothing was shielded. The regression is entirely
attributable to the added `top` prop.

---

## 3. Current behavior to preserve

- **Task 684's actual requirement stands and must not regress.** Toasts must clear the sticky site
  header (`header.site-header`, `sticky top-0 z-30`): offset **97px** below 640 and **65px** at ≥640.
  Those values are measured, documented in `MantineRootProvider.tsx`, and owner-approved (D3).
- `position="top-right"` stays the notification position.
- `--notifications-z-index: 400` and container width `27.5rem` stay as they are.
- `MantineNotificationPattern` and every existing `notifications.show()` caller keep their current API.
  This task changes **placement mechanics only** — no call-site changes.

---

## 4. Required after behavior

**R1 — The three `bottom-*` containers must not be stretched.** Each must resolve to height `0` when
it holds no notification, exactly as it did before `081c03e7f`. The header clearance must apply to the
`top-*` containers **only**.

**R2 — The root must not intercept clicks, ever again.** `.mantine-Notifications-root` gets
`pointer-events: none`; the individual notification element gets `pointer-events: auto` so toasts stay
clickable (close button, action button). This is defence-in-depth: even if a future task re-stretches a
container, it cannot shield the page. **R1 and R2 are both required — do not treat R2 as a substitute
for R1.** A 950px transparent panel is a layout defect whether or not it currently eats clicks.

**R3 — Header clearance preserved.** 97px < 640, 65px ≥ 640, measured on the real rendered toast, not
on the container.

**R4 — A blocking hit-test gate.** No existing gate could have caught this; add one.
`scripts/check-click-shield.mjs` (name is a suggestion, not a requirement) must, against the built app
at each `MANTINE_VIEWPORTS` width:

- collect every `a, button, [role="button"], input, select` with a non-zero rect inside the viewport;
- for each, call `document.elementFromPoint()` at its centre;
- **FAIL** when the returned node is neither the element, nor its descendant, nor its ancestor;
- print the blocked element **and the intercepting element** (tag + class + rect), because "something
  blocks clicks" without naming the blocker is what made this defect survive a month;
- **hard-error on an empty candidate set** — a run that checked 0 elements must not exit 0. This is the
  same empty-set guard `check-stories-rendered.mjs:1334` already applies, and the same failure shape
  Sprint 52 exists to eliminate.

**R5 — Prove the gate catches *this* defect.** Planted-violation round trip: with `081c03e7f`'s
`MantineRootProvider.tsx` restored, the gate must exit non-zero and name
`mantine-Notifications-root` as the interceptor. With the fix applied, exit 0. A gate that has never
failed is not known to work (**D32**).

---

## 5. Implementation notes (non-binding — the executor owns the mechanism)

The obvious repair is to stop using the component-level `top` prop and express the clearance as CSS
scoped to the top containers, e.g. a colocated module rule on
`.mantine-Notifications-root[data-position^="top"]`. Note that Mantine's own rules use `:where()`
(specificity 0), so a plain class selector already wins — no `!important` is needed or wanted.

`pointer-events` must be set from a **stylesheet**, not from `styles={{ root: ... }}`: per §18 the
notification's own `pointer-events:auto` needs to survive alongside it, and inline styles freeze the
cascade for the descendant.

Whatever mechanism is chosen, R1's proof is the measured rect, not the diff.

---

## 6. Positive flow

1. Load `/{locale}` at each `MANTINE_VIEWPORTS` width.
2. All six containers present; the three `bottom-*` measure height `0`.
3. `elementFromPoint` at the centre of every interactive element returns that element or its
   descendant — zero interceptions.
4. Fire `notifications.show()`: the toast appears top-right, its top edge clears the header by 97px
   (<640) / 65px (≥640), and its close button is clickable.

## 7. Negative flows to cover

- **N1** — A toast is on screen: the visible toast is clickable (`pointer-events:auto` reaches it), and
  the empty area of its container is **not** an interception target.
- **N2** — Two or more stacked toasts: the container grows; nothing outside the toasts' own rects
  intercepts.
- **N3** — 320px width, where the header wraps to two rows: clearance is 97px and the toast does not
  overlap the header.
- **N4** — `uk` locale at 320 (longest strings): no horizontal overflow, no new interception.
- **N5** — The mobile bottom nav (`MobileBottomNavView`, `fixed; bottom:0; height:56px`) must remain
  clickable at mobile widths — it sits exactly where the `bottom-*` containers were stretching to.
- **N6** — A route with a genuinely intentional overlay open (modal/drawer): the gate must **not**
  report the modal's own backdrop as a defect. Decide and document the exemption rule; an
  unconditional gate that fires on every modal will be switched off within a week.

## 8. Acceptance criteria

- **AC1** — All three `bottom-*` containers measure height `0` with no notification present, at every
  `MANTINE_VIEWPORTS` width. Evidence: measured rect table, before/after.
- **AC2** — `getComputedStyle('.mantine-Notifications-root').pointerEvents === 'none'` for all six;
  the notification element itself resolves to `auto`.
- **AC3** — Homepage hit-test: **0** interceptions at every width × all 4 locales. Evidence: the R4
  gate's own output, not a screenshot.
- **AC4** — Header clearance measured on the rendered toast: 97px at 320/375, 65px at 390/1024.
- **AC5** — N5 verified explicitly: bottom-nav items hit-test clean at 320/375/390.
- **AC6** — R5 planted-violation round trip: fails before, passes after, names the interceptor.
- **AC7** — `typecheck`, `lint`, `check:design-tokens`, `check:file-integrity`, `check:mojibake`,
  `check:i18n`, `check:hydration` all clean; `check:stories-rendered --mantine-only` exit 0 with no new
  FAIL.

## 9. Verification plan

1. Reproduce first, on the current build, before touching anything — record the six-container table and
   the blocked-element list. **A fix whose "before" was never captured cannot be shown to have worked.**
2. Apply the fix; re-measure the same table.
3. Run the R4 gate; then run the R5 planted-violation round trip.
4. Q3 visual matrix over the homepage at all widths × 4 locales, with a toast on screen and without.
5. Report **measured values**, not "verified". Task 684 shipped with a session log that discussed
   `data-position` four times and still missed this — a description of the containers is not a
   measurement of them.

## 10. Open questions for the owner

- **OQ1** — Hotfix now, or land with the full gate? A minimal one-line revert of the `top` prop restores
  clickability immediately but re-breaks Task 684's header clearance. Recommendation: ship R1+R2+R3
  first as the hotfix, then R4+R5 as the durable half — but that is a release decision, not the
  executor's.
- **OQ2** — Should the R4 gate run against the production URL in CI, or only the local build? Local
  build catches it pre-merge; production catches drift from env/CDN. Recommendation: local build,
  blocking.
- **OQ3** — N6's exemption rule for intentional overlays. Needs an owner decision before the gate can be
  made blocking on routes with modals.

---

## 11. Executor rules

- Status on completion is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval.
- No mutating git. No `git push` in any form.
- Session log: `docs/sessions/2026-08-06-task723-notifications-click-shield.md`.
- Update `docs/backlog.md` (concise state only) and the Sprint 52 plan file.
- If the environment cannot run a required probe, return **missing evidence** with the exact native
  command for the owner — do not substitute confidence for measurement.
