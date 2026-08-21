# Task 757 — Owner decision record

**Date:** 2026-08-21 · **Sprint:** 60 · **Task:** 757 (`AuthSheet` de-Tailwind) · **Recorded by:** Opus orchestrator
**Purpose:** persist the owner decisions that Task 757's closure depends on, so the review ledger can cite a
repository artifact rather than chat. A self-declared waiver is not evidence (`review-task/SKILL.md` §baseline 7);
these are owner decisions, quoted and dated.

---

## D757-1 — `MantineAddItemPanel` radius stays 12px

**Decision:** the shared panel keeps Mantine `radius.xl` = 12px. The project's `rounded-xl` = 18px is not applied.

**Rationale (owner):** 12px is the canonical Mantine radius for this primitive.

**Effect:** the cross-task radius finding raised against Task 756 is **CLOSED — NOT A DEFECT**. Task 757 correctly
did not modify the shared component. No follow-up task is opened for it.

**Scope:** `src/design-system/mantine/patterns/MantineAddItemPanel.tsx` — unchanged by Task 757.

---

## D757-2 — Success-state `<h3>` line-height stays `1.75rem` (authorized envelope delta)

**Decision:** the two success-state titles keep `style={{ lineHeight: '1.75rem' }}` (28px).

**This is an authorized change, not a zero-delta reproduction.** The pre-migration computed value was **22.5px**,
not 28px. Evidence, from the built CSS in this repository (`.next/static/css/*.css`), verbatim:

```
h1,h2,h3,h4,h5,h6{--tw-leading:var(--leading-tight);line-height:var(--leading-tight);--tw-font-weight:600;--tw-tracking:-.025em;letter-spacing:-.025em;font-weight:600}
.text-lg{font-size:1.125rem;line-height:var(--tw-leading,1.75rem)}
--leading-tight:1.25;
```

The base `h1..h6` rule writes `--tw-leading: 1.25` onto the element itself, so `.text-lg`'s
`line-height: var(--tw-leading, 1.75rem)` resolves to **1.25**, never to its `1.75rem` fallback.
Original `<h3 className="font-semibold text-lg">` therefore computed **18px x 1.25 = 22.5px**.

**Authorized delta:** `line-height` 22.5px -> 28px (+5.5px per title line) at
`src/modules/auth/components/AuthSheet.tsx:225` and `:654`. Both sites, all locales, all viewports.
Downstream content in each success block shifts down by the same 5.5px. No other property changes.

**Ledger effect:** this delta is `allowedSemanticDeltas[].field = "declarations"` with this file as
`ownerDecisionArtifact`. Without this record it would be `MISMATCH_RECORDED` with an open P1 finding.

**Session-log corrections this decision forces** (the log currently asserts a false before-value):

| Location | Current (incorrect) | Correction |
|---|---|---|
| Round 2, item 2 | "Tailwind's exact `text-lg` = 28px ... the compiled `.text-lg{...line-height:1.75rem}` rule" | The compiled rule is `line-height:var(--tw-leading,1.75rem)`; the `var()` wrapper was elided. On `<h3>` it resolves to `--leading-tight` = 1.25 -> 22.5px |
| Round 3, "fourth line-height defect" | "the two `h3` sites are genuinely unaffected (`<h3>` is not `<p>`) ... confirming round 2's `1.75rem` fix was correct as shipped" | Correct that `p{leading-relaxed}` does not target `<h3>`; incomplete because the separate base rule `h1..h6{--tw-leading:var(--leading-tight)}` does. The round-2 value is not the pre-migration value |
| Visual-source-trace, success row | "Tailwind's `.text-lg{line-height:1.75rem}` (28px) ... the plain text-lg value is correct here" | Pre-migration value is 22.5px; 28px is an owner-authorized change (this record, D757-2) |

**Note on round 2:** before round 2 the `h3` sites rendered at Mantine's 28.08px. Round 2 changed them to 28px,
closing 0.08px of a 5.58px divergence from the true 22.5px baseline. The defect predates round 2; round 2 did not
introduce it and did not resolve it.

---

## D757-3 — AC3 success-state matrix cells: owner manual verification accepted

**Decision:** the two success states (`forgot_password_success`, `register_success`) are **not** required to be
captured in the formal locale/viewport matrix. The owner verified them manually across all breakpoints.

**Standing basis:** the executor's blocker is confirmed real and not a policy choice — this project's Turnstile
site key is a real production key, not a Cloudflare test key, so a headless browser cannot reach either state.

**Residual risk accepted:** the orchestrator traced every substitution in both success blocks against `theme.ts`
and the built CSS. `gap-4/pb-6/pt-2` -> `gap="md"/pb="xl"/pt="xs"` (16/24/8px, exact); `h-12 w-12` -> `size={48}`
(exact); `mt-2` -> `mt="xs"` (8px, exact); the `linkPrimarySm` button (parent is `Stack`, not `<p>`, so
`--tw-leading` is unset and the `1.25rem` fallback is correct); body `Text` `lineHeight: 1.625` (matches the
original `leading-relaxed`). **D757-2 is the only delta in these two states.**

**Ledger effect:** AC3 is `VERIFIED` with the success-state tuples declared in `coverageGaps` and linked to this
record, not to an open finding.

---

## D757-4 — AC7 narrowed to a scoped criterion

**Decision:** AC7's literal `check:locale-leak` exit 0 is replaced, for Task 757 only, by:

> the run is executed and its raw exit code recorded; no locale leak newly introduced by this diff; every
> AuthSheet-attributable finding is enumerated with its disposition.

**Result under the scoped criterion:** `EXIT_CODE=1`, 327 leaks / 46 story titles repo-wide; `--mantine-only`
`EXIT_CODE=1`, 22 leaks / 4 titles. Exactly 6 (the 2 `AuthSheet` story titles, identical in both runs) are
attributable to `AuthSheet`, all the same hardcoded `"Google"` OAuth-button text, present before Task 757 and
untouched by its diff. The remaining 321 / 16 are unrelated to this task. **Scoped criterion: satisfied.**

**Owner context that resolves the finding's real nature:** Google OAuth **is not implemented**. The button is a
placeholder with no working handler behind it. The `"Google"` string is therefore not a missed `t()` call on a
live control — it is untranslated text on an unbuilt feature, and it is resolved by building that feature, not by
wrapping it. Remediation of the other 321 findings is explicitly **not** Task 757's scope.

**Standing project position unchanged:** CI keeps `check:locale-leak` warn-only for the duration of the Mantine
migration. This decision does not alter that, and does not narrow AC7 for any other task.

---

## D757-5 — `src/hooks/useIsMobile.ts` is `EXCLUDED AS UNRELATED`

**Decision:** the file stays exactly as it is. It is **not** deleted, **not** modified, and **not** staged by
Task 757's commit.

**Provenance:** untracked, zero consumers in `src`, docstring references `AdminTable` / `admin-ux-rules` §14.3.
It is owner-authored groundwork for the next Task 306 increment.

**Handoff requirement:** Task 757's commit handoff must name explicit paths only. `git add -A` and `git add -u`
are forbidden (already project policy; restated here because this untracked file makes the consequence concrete).
The handoff must state: `pre-existing untracked src/hooks/useIsMobile.ts, excluded as unrelated`.

**Also `EXCLUDED AS UNRELATED`, same basis:** `docs/sessions/2026-05-31-task-306-fix-g3-prime-mobile-click-bottomsheet.md`,
`docs/sessions/2026-05-31-task-306-fix2-admin-mobile-responsive-i18n.md`.

---

## D757-6 — Google OAuth is a separate follow-up task

**Decision:** not merged into Task 757. Task 757 deliberately did not change OAuth behavior.

**Scope dictated by the owner, to be turned into a kickoff:**

1. Audit the existing Google button handler — what it currently does, and what it does not.
2. Supabase Google provider configuration.
3. Callback URL.
4. Real browser E2E.
5. A proper error state.
6. A separate decision on the brand name `"Google"` in `check:locale-leak` (translate, allowlist, or document as
   an intentional brand literal).

**Sequencing:** the task must be filed under an open sprint per `CLAUDE.md`; the sprint is selected from the
`docs/backlog.md` "Sprints" section at filing time, by goal fit, not by highest number.

---

## Backlog integrity note (orchestrator, not an owner decision)

`docs/backlog.md` currently contains two contradictions that Opus owns and must reconcile at closure:

1. The Sprint 60 row reads `zero landed tasks` while the same sentence records 752-756 as delivered and archived.
2. The Git row names branch `codex/task741-final-review-closeout`; the worktree is on `codex/merge-main-20260820`
   with upstream `origin/main`. Per that row's own warning, branch state must be read from git, not from the
   backlog.

Current backlog length: 77 lines (limit 80).

---

## D757-7 — Envelope deltas of the inert reproductions (CONDITIONAL authorisation)

**Recorded 2026-08-21.** Owner authorises **exactly two** envelope deltas, and no others:

1. The loss of the `var(--tw-leading, …)` read in the five `AuthSheet.module.css` classes that reproduce
   `text-sm` / `text-xs` line-height as a literal (`.linkPrimarySm`, `.linkMutedSm`, `.agentBackLink`,
   `.linkMutedXs`, `.orSeparatorLabelWrap`).
2. The `transition-colors` reproduction: `transition-property` shortened from ten entries to seven
   (`--tw-gradient-from/via/to` dropped) and the `var(--tw-ease, …)` / `var(--tw-duration, …)` guards removed.

**Condition attached by the owner:** the authorisation holds only if the native validator confirms, for each
affected row, both the exact generated before-rule and an equivalent negative probe.

**Confirmation status against the 2026-08-21 native runs:**

| Row | Candidate | Exact generated rule | Equivalent negative probe |
|---|---|---|---|
| AC3 / R3.4 | `transition-colors` | Confirmed — no `rawRule` violation raised | Confirmed — no "outcomes differ" violation raised |
| AC3 / R3.2 | `text-sm` | Pending — first run used the minified built-CSS form (`.875rem`); corrected to the compiler's `0.875rem` | Confirmed — no "outcomes differ" violation raised |
| AC3 / R3.3 | `text-xs` | Pending — same leading-zero correction (`.75rem` → `0.75rem`) | Confirmed — no "outcomes differ" violation raised |

The two pending cells are confirmed by the next native `check:review-ledger` run. If that run raises a `rawRule`
violation on either row, this authorisation does not apply to it and the row reverts to `MISMATCH_RECORDED`.

**Explicitly NOT covered by D757-7:**

- The six envelope deltas of `AC3 / R3.1` (`text-lg` → inline style): selector, layer, specificity, sourceOrder,
  declarations, customProperties. D757-2 authorised the **rendered value** (28px), not the envelope. Finding F1
  therefore stays OPEN at P1 and the review decision cannot reach `APPROVED` or `APPROVED WITH NOTES`.
- The AC3 success-state matrix amendment — that is D757-3 and stands separately.
- The AC7 `check:locale-leak` narrowing — that is D757-4 and stands separately.
- The Task 756 `MantineAddItemPanel` radius disposition — that is D757-1 and stands separately.

**Owner instruction on record:** do not set `review.decision` to `APPROVED WITH NOTES`, `review.ledgerGate.status`
to `PASSED`, or `handoff.commitPush` to `ALLOWED` ahead of the owner's own output of the dump producer and
`check:review-ledger`.

---

## D757-4a — AC7 owner resolution, final wording (supersedes the summary in D757-4)

**Recorded 2026-08-21, owner verbatim:**

> The literal exit-0 requirement is amended for Task 757. `check:locale-leak` was executed; its non-zero result and
> per-story attribution are retained. Task 757 does not modify unrelated stories, detector policy, or allowlists.
> The six AuthSheet findings are pre-existing `Google` OAuth-button text, unchanged by this migration. Defer their
> product/allowlist disposition to the separate Google Auth task. For Task 757, AC7 is satisfied by successful
> execution and attribution of the gate; typecheck, design-token, i18n, story-coverage, Storybook build, app build,
> and auth tests remain required green.

**Required-green set under this wording, with the evidence actually held:**

| Gate | Result | Source |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | executor session log |
| `npm run check:design-tokens -- --strict` | 0 violations, exit 0 | executor session log |
| `npm run check:i18n` | 2218 keys x 4 locales, parity PASSED, exit 0 | executor session log |
| `npm run check:story-coverage` | 18/18 covered, exit 0 | executor session log |
| `npm run build` | 40/40 pages, exit 0 | **owner-run 2026-08-21** |
| `npm run test:auth` (registry commands) | 8/8 passed | **owner-run 2026-08-21** |
| `npm run check:stories` | 129 files, 0 violations, exit 0 | executor session log only — not owner-run |
| `npm run build-storybook` | built, exit 0 | executor session log only — not owner-run |

The last two rows are the only members of the owner's own required-green set that rest on the executor's report
rather than on an owner-run or reviewer-reproduced result. They are named here so the gap is visible rather than
assumed; the reviewer does not treat an executor-reported exit code as proof.

**Ledger effect:** AC7 / R7 remains `VERIFIED` under the amended criterion. If either unrun gate comes back
non-zero, that status is withdrawn and a new finding is opened.

---

## D757-8 — Envelope deltas of the success-title `h3` inline style (option A)

**Recorded 2026-08-21.** Owner authorises the six envelope deltas of `AC3 / R3.1` — `selector`, `layer`,
`specificity`, `sourceOrder`, `declarations`, `customProperties` — **scoped strictly to the two success-title
`<h3>` sites** (`AuthSheet.tsx:225`, `:654`), as the technical consequence of the rendered `line-height: 1.75rem`
already authorised in D757-2.

**Explicit owner instruction:** do not change the code and do not move the `h3` line-height into a CSS Module
class. Option B is declined.

**Scope limit:** this authorisation covers these two sites only. It does not license inline styles as a general
substitute for canonical sources anywhere else in the codebase, and it does not extend to any future task.

**Ledger effect:** `AC3 / R3.1` moves from `MISMATCH_RECORDED` to `EQUIVALENT` with all six deltas listed in
`allowedSemanticDeltas` against this record. Finding F1 is closed.

---

## D757-3a — AC3 scope narrowing withdrawn (supersedes D757-3)

**Recorded 2026-08-21.** The owner withdraws the D757-3 narrowing. The two success states return to the review's
required scope and are recorded as `VERIFIED` on **owner-native manual evidence**. The `F4` P3 coverage-gap note
is removed.

**How this is represented, stated plainly rather than absorbed:** the success states occupy their own requirement
row, `AC3 / R3.5`, whose `requiredScope.phases` is `["after"]` — not `["before", "after"]`. No pre-migration
capture of either state exists or can be produced (the project's Turnstile site key is a real production key that
a headless browser cannot solve), so the owner's evidence is an after-state verification at every breakpoint
against his own prior familiarity with the surface, not a captured baseline. That limit is recorded in the row's
counter-checks; it is not claimed as a before/after proof.

The one property in these states whose pre-migration value was established analytically rather than captured is
the `h3` line-height, recorded in D757-2 and authorised in D757-8. Every other substitution in both success blocks
was traced by the reviewer against `theme.ts` and the built CSS and matches exactly.

---

## D757-2b — D757-2 and D757-8 WITHDRAWN (supersedes both)

**Recorded 2026-08-21.** The owner withdraws the authorisation of the `1.75rem` / 28px success-title line-height and
the six envelope deltas that followed from it.

**Owner reasoning, verbatim in substance:** Tailwind is the baseline only — it shows what the old screen actually
rendered. The goal of the migration is to reproduce that result by Mantine's means, not to carry Tailwind internals
across. `1.75rem` is taken from Tailwind's table, not from the render; it is a deliberate new visual change, which
is permissible only as a separate product decision and contradicts D28's zero-visual-delta requirement. Option C is
selected: restore the actual `22.5px`, expressed in Mantine.

**Consequences:**

- `AC3 / R3.1`'s `EQUIVALENT` assessment and its six `allowedSemanticDeltas` no longer have owner authorisation.
- The Task 757 review decision `APPROVED WITH NOTES` is **withdrawn**. Commit `50d18411f` stands but is unpushed.
- Correction task filed: `tasks/Sprints/Sprint_60_kickoff_prompt_Task_757R_authsheet_runtime_tokens.md`.
- The ledger is renamed to `.review-ledger.SUPERSEDED.json` only atomically with a valid successor that names it in
  `review.supersedes`.

**Still standing, untouched by this withdrawal:** D757-1 (radius), D757-3a (AC3 success-state evidence),
D757-4a (AC7 wording), D757-5 (excluded paths), D757-6 (Google Auth follow-up), and the `transition-property`
half of D757-7. The `--tw-leading` half of D757-7 is superseded in effect by 757R, which removes the literals'
counterpart dependency entirely.
