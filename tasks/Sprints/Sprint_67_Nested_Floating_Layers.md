# Sprint 67 — Nested floating layers, and the gate that cannot see them

**Opened:** 2026-08-27 · **Status:** 🟠 **OPEN** · **Landed tasks:** 2 (**773** · **774**)

> **Opened by owner instruction, 2026-08-27** — *"Якщо ця задача потребує мінімального коду - зроби це сам."*
> That instruction is the explicit owner authorization required by `docs/orchestrator-role.md` → Role
> (*"Opus does not write product code in `src/` … unless the owner explicitly asks"*). It is scoped to Task 773 and
> does not generalize. The 2026-08-01 owner rule forbids a kickoff without a sprint and no open sprint fits, so this
> file, the kickoff, and `docs/backlog.md`'s Sprints section + registry row were written in the **same edit**, per the
> 2026-08-10 fourth-occurrence corollary.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 773? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Different surface; **D28** binds it to zero visual delta. |
| **55** | ARIA semantics no gate sees | **No.** Closest in *spirit* (a defect class no gate sees), but its subject is roles and accessible names. 773 changes neither. Its exit criterion 4 — *name the detector that would have caught these* — is answered here for a different defect class, and 55 must not absorb that. |
| **56** | Raw enum leaks and the blind detector | **No.** Localization subject. |
| **57** | Delete what no longer earns its place | **No.** Pure removal. |
| **61** | The projection layer no gate reads | **No.** Markdown/ledger projection. |
| **62** | Tailwind runtime tokens outlive Tailwind | **No.** Token emission; 773 touches no token. |
| **66** | `/listings` mobile overflow | **No.** Route-level mobile geometry on a legacy surface. 773 is a Mantine primitive composition defect, breakpoint-independent. |

No open sprint fits. Opened 67 rather than attaching 773 to the nearest number.

## Goal

**A Mantine floating layer nested inside another Mantine floating layer must not dismiss its parent when it is used.**

The narrower point this sprint exists to prove is the second half of its title. The defect in 773 was invisible to
**20 passing RTL tests** across three suites — and not because those tests forgot to click the month dropdown. They
**cannot** see it:

- Every suite renders under `MantineProvider env="test"`. Mantine's `OptionalPortal` short-circuits on exactly that
  value (`env === "test" || !withinPortal` → children inline). Under `env="test"` **`withinPortal` is a no-op**, the
  nested option list is already a DOM descendant of its parent dropdown, and the defect cannot exist.
- Drop `env="test"` and the portals become real, but every jsdom rect is `0×0`, so the popover's `hideDetached`
  middleware marks the reference hidden and click-outside stops firing at all — a `mousedown` on `document.body` no
  longer closes the calendar. The symptom is unobservable from the other side too.

So the RTL layer is **structurally blind to portal-nesting defects**, in both configurations, for every Mantine
overlay in the codebase — not just this one. 773 lands a containment-level regression test that is the strongest
claim jsdom can make. Naming the detector that would catch the *behavior* is this sprint's transferable output.

## Tasks

| # | Title | State |
|---|---|---|
| **773** | `RangeDatePicker` in-calendar month/year selectors dismiss the calendar | **GATE GREEN — AWAITING OWNER VERDICT** |
| **774** | Those same selectors render their labels wrapped mid-token (`202`/`6`) — pre-existing, surfaced by 773 | **GATE GREEN — AWAITING OWNER VERDICT** |

## Exit criteria

1. ~~773's fix is verified in a **real browser**, not only by DOM containment.~~ **MET (774's session, 2026-08-27):** Playwright/Chromium against the real component, real mouse press — **12/12 cells, 0 failures** across `sq/en/uk/it` × `641/1024/1440`, month and year. Transcript: `docs/sessions/evidence/task774/browser-proof-773-calendar-stays-open.txt`. **The route pass is now done too** — owner screenshot, uk, inside the real Advanced-filters drawer: the year list opens over the calendar and the calendar is not dismissed. Criterion fully met, component AND route.
2. The blind spot above is recorded where the next person writing a Mantine overlay test will read it —
   `docs/mantine-responsive-design-system.md`, alongside the Task 553/554 "a green matrix is NOT proof" entry.
3. Either name the detector that would have caught the user-visible behavior, or record in writing why none is worth
   building. **The candidate is now a working artifact, not a proposal:** 774's session built a Vite + Playwright
   harness that mounts the real `RangeDatePicker` under the real theme and CSS and measures it in Chromium — it
   caught 774 and proved 773. Landing it as a task-owned probe (the `scripts/task766-route-shell-probe.mjs`
   pattern) is an owner call, because it adds a Vite entry point the repo does not otherwise have. **It answers
   BOTH failure modes this sprint found:** portal nesting (invisible to jsdom because `env="test"` inlines
   portals) and layout wrapping (invisible to jsdom because there is no layout engine at all).
4. Audit the other `MantineCombobox` / `MantineSelect` / `MantineDropdownMenu` render sites for the same nesting —
   any combobox inside a popover, drawer or menu has the same latent defect. **Not yet done; 773 was bounded to the
   owner-reported surface and deliberately did not sweep.**
