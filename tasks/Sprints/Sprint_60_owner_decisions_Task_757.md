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
