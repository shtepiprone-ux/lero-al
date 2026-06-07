# Sprint 35 — Task 406 proof addendum + Task 410 (admin render/auth harness)

> **Context.** Task 406 (token refactor, area 4/4) **token/hardcode milestone is APPROVED + COMMITTED** — the diff is
> native-confirmed truly inert (value→token swaps + exact-value suppression comments only; no control/function removed;
> NUL=0, `tsc=0`, `check:design-tokens` strict = 0 whole-tree). What is **NOT** proven is **rendered coverage of the admin
> surfaces**: `screenshots:assert 812/812` covers **Storybook only**, and the 49 admin hits live in **unstoried admin
> routes**. The report's "inert swaps only" is reasoning, not rendered evidence. This file defines (1) the proof addendum
> required to close 406's rendered coverage, and (2) Task 410, the harness that makes unstoried admin routes renderable.
>
> **Do NOT re-open / re-edit the committed 406 code.** This is proof + tooling only. If a rendered spot-check reveals a
> real visual regression, STOP & ASK and open a separate fix task — do not silently amend the committed refactor.

---

## Part 1 — Task 406 rendered-coverage proof addendum (executor: Sonnet)

Deliver an addendum appended to `docs/sessions/2026-06-07-task406-admin-remaining-token-refactor.md` (new "## Rendered
admin coverage addendum" section). It MUST contain:

1. **Renderable inventory.** List every affected admin surface/route that CAN be rendered in the current environment
   (which admin pages/components, behind which auth/role, with what seed/fixture data). One row per surface, mapped to the
   touched file(s) from the 406 Files-Changed table.
2. **Targeted rendered evidence per renderable surface:** `uk@320`, `uk@375`, `uk@390`, **and** one representative
   `≥1024` desktop. Attach the machine-produced artifacts (PNG/JSON path under `.screenshots/…`), not prose. Confirm at
   each cell: no horizontal overflow at 320; affected control/label renders identically to pre-refactor (the swap is
   inert); full-width <640 where the mobile gate applies.
3. **Coverage gaps (explicit).** For every affected admin surface that CANNOT be rendered (missing auth/data/harness),
   document it as an explicit gap — name the surface, the blocker (e.g. "requires authenticated admin session + seeded
   exchange providers"), and mark it **DEFERRED to Task 410**. Do NOT silently drop it.
4. **No fabricated cells.** Every PASS cell must correspond to an artifact that was actually rendered. A cell that was not
   rendered is reported as a gap (point 3), never as PASS. (agent-contract clause 12 — no "OWNER QA REQUIRED / NOT
   CHECKED" passes.)
5. **Milestone not re-litigated.** The token/hardcode milestone stays committed; this addendum only adds the rendered
   admin evidence. `check:design-tokens` must remain 0 and the committed diff unchanged.

**Acceptance (addendum):** renderable admin surfaces have uk@320/375/390 + one ≥1024 desktop rendered artifacts attached;
every unrenderable surface is listed as a Task-410 gap with its blocker; zero fabricated cells; committed 406 diff
untouched. On delivery the orchestrator reviews the artifacts and marks 406 rendered coverage **proven (renderable
subset) / deferred (gap subset → Task 410)**.

---

## Part 2 — Task 410 — Admin render/auth harness (so admin routes become assertable)

```
Type:        Tooling / test-harness (NOT product code; no UI/behavior change to admin routes)
Priority:    MEDIUM — unblocks rendered coverage for admin routes (406 addendum gaps + all future admin UI tasks)
Depends on:  406 token milestone (committed). Coordinate with Task 408 (detector) only for scheduling, no code overlap.
Goal:        A repeatable way to render authenticated admin routes/components at the canonical breakpoints × 4 locales so
             `screenshots:assert`-style machine artifacts can be produced for admin surfaces (today only Storybook is
             covered). Closes the structural reason 406 admin coverage could not be proven.
```

**Problem.** `screenshots:assert` renders Storybook stories only. Admin pages require an authenticated admin session +
seeded data, so they are invisible to the current rendered-evidence pipeline — making the mobile <640 gate (clause 11/12)
unprovable for admin UI by rendering. Every admin UI task inherits this gap, not just 406.

**Acceptance criteria (to be expanded into a full kickoff before execution — STOP & ASK on the auth approach first):**
- A documented, repeatable harness that renders the in-scope admin surfaces at the canonical breakpoints × `sq/en/uk/it`
  and emits PNG/JSON artifacts compatible with the existing `screenshots:assert` review flow. Choose ONE approach and get
  owner sign-off before building: (a) **admin Storybook stories** with mocked session/data (preferred — reuses the
  existing assert pipeline + gates), or (b) an **authenticated e2e render harness** (Playwright + seeded test admin) if
  the components can't be meaningfully storied in isolation.
- No change to admin route behavior, auth, RLS, or product code. Test-only / story-only additions.
- Wired so future admin UI tasks (and the 406 gap surfaces) can produce the uk@320/375/390 + desktop matrix.
- `check:stories` / lint / tsc stay green; no hardcoded strings in any new stories/fixtures (clause 13).

**Pre-read when scheduled:** `docs/storybook-governance.md` · `docs/storybook-visual-snapshots.md` ·
`docs/responsive-screenshot-governance.md` · `docs/rls-rules.md` (auth/session for option b) ·
`docs/component-governance.md` (§11 AdminTableRow) · `docs/agent-contract.md` (1–14).

> **Sequencing.** JJ critical path stays **408 → 407**. The 406 rendered addendum (Part 1) can run now on the renderable
> subset; Task 410 (Part 2) closes the unrenderable gap and is NOT a blocker for the already-committed token milestone.
