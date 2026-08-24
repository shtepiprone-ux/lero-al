# Sprint 64 — Runtime design tokens that survive Tailwind removal

**Opened:** 2026-08-24 · **Status:** 🟠 OPEN · **Filed from:** Sprint 63's **D63-D** and **D63-F**

---

## 1. The problem this sprint exists for

The repository documents a motion-token scale that **no stylesheet can read**.

Measured 2026-08-24 on `5372e08a5`:

- `--duration-{fast,base,slow}` (`src/app/globals.css:267-269`) and `--ease-{standard,in,out}` (`:273-275`) sit at
  brace-depth 1 inside the `@theme inline` block opened at `:35`. `:root` does not open until `:327`.
- A repository-wide search for `var(--duration-` and `var(--ease-` across `src/` returns **zero** references.

An `@theme inline` entry is a Tailwind theme value. It is emitted only inside Tailwind's compiler-generated theme
layer, and only when the compiled output actually references it. It is not a `:root` custom property, so no CSS
Module and no inline style can read it. That is the cause behind a symptom this project has been paying for
repeatedly: every module that reproduces a duration or an easing curve has had to inline the literal and defend it
with a `design-tokens-allow` marker, because the "token" it should have referenced does not exist at runtime.

Two of those literals are the standing red in `npm run check:design-tokens -- --strict`
(`AppImage.module.css:126` and `:160`) — the finding every Sprint 63 task has had to carry forward.

## 2. Goal

Make the values real `:root` custom properties that survive Tailwind's eventual removal, and demote `@theme inline`
to what it is: an alias layer that lets Tailwind keep generating utilities from the same values.

**Exit criteria**

1. Motion and radius values used by CSS Modules are declared in `:root` in `globals.css`.
2. `@theme inline` keeps its `--duration-*` / `--ease-*` names, aliasing the `:root` values rather than owning them.
3. `npm.cmd run check:design-tokens` exits 0 with **no** `design-tokens-allow` marker and **no** allowlist entry
   added anywhere.
4. `npm.cmd run check:css-vars` exits 0.
5. Every migrated value is proven byte-equal at the rendered layer, before and after, by computed-style capture.

## 3. Binding rules

1. **The control ships before or with the fix.** A gate that turns green must be shown able to turn red on the same
   class of defect, in the same run set.
2. **No author-applied exemption.** `design-tokens-allow` markers and `scripts/design-tokens-allowlist.json` entries
   are not available to close a finding in this sprint. If a value cannot become a token, stop for an owner decision.
3. **No approximation.** A migrated value reproduces the current computed value exactly. `3.40282e38px` is what
   `rounded-full` compiles to; `9999px` is a different value and is not a substitute.
4. **`globals.css` is a project-wide contract.** Any change to it is scoped, measured before and after, and never
   bundled with unrelated work — the reason D63-D put this in its own sprint rather than extending Sprint 63.

## 4. Owner decisions this sprint inherits

- **D63-F — DECIDED 2026-08-24.** No marker, no allowlist. Project-owned runtime tokens in `:root`; `@theme inline`
  becomes an alias layer; `AppImage.module.css` consumes only runtime tokens. Recorded in full in
  `tasks/Sprints/Sprint_63_Homepage_Exits_Tailwind.md`.
- **D63-D — DECIDED 2026-08-24.** Phase 5 does not extend Sprint 63; it is filed here, as Task 765.

Neither decision is reopened by this sprint's tasks. An executor that believes one is wrong stops and reports
`BLOCKED`; it does not amend them.

## 5. Tasks

| # | State | What |
|---|---|---|
| **765** | ✅ APPROVED WITH NOTES (2026-08-24, commit pending) | Materialize the D63-F runtime motion/radius tokens and migrate `AppImage.module.css` onto them. Kickoff: `Sprint_64_kickoff_prompt_Task_765_Runtime_Motion_Radius_Tokens.md` (`REVISION 1.2 — P3″`). R1-R8 + P1/P2 + P3″ + revert proof + `phase7-final-*` evidenced; P3 and P3′ retained as measured-false author premises; the static-deletion blind spot stays routed to 743. **Review verdict: §3.3S's documented input-seam control satisfies rule 1** — ledger `docs/reviews/2026-08-24-task765-runtime-motion-radius-tokens.review-ledger.json`, 10/10 primary `VERIFIED`, 0 open P0/P1/P2, 3 notes (F4/F5/F6). Sessions: `docs/sessions/2026-08-24-task765-runtime-motion-radius-tokens-blocked.md`, `docs/sessions/2026-08-24-task765-revision-1-2-p3doubleprime.md` |

Later candidates, **not** filed and **not** authorized by this sprint: migrating the remaining
`design-tokens-allow` markers elsewhere in `src/`, and retiring `@theme inline` entries that no compiled utility
references. Each needs its own measurement before it becomes a task.

## 6. What this sprint does not touch

Task 764, its review ledger, its evidence set, its source changes and its acceptance criteria are **frozen**. They
are closed and pushed (`3bf769858`, `d652faad9`). No task in this sprint reopens them, re-runs their gates, or
edits their artifacts.
