# Task 749 — Revision 1: AdminUsersTable via ScrollArea, and the AC8 contradiction

**Filed:** 2026-08-15 by the orchestrator, after the executor returned `BLOCKED` on two findings. **Both findings
are upheld.** This brief is narrow: it supersedes exactly the sections named in §7 of the original kickoff
(`Sprint_58_kickoff_prompt_Task_749_RenderedProof_Mobile_Remediation.md`) and changes nothing else.

---

## 1. Accepted as implemented — do not re-work, do not re-touch

The executor's first two fixes are correct and stay exactly as they are on disk:

- `MantineCountButton.tsx` (`iconOnlyAbove`) + its smoke test additions — R9/AC9 met.
- `HeroSearchView.tsx` + `HeroSearchView.module.css` — R2/R3/R4/R5 met; `band-700` and `desktop-1024` md5-identical
  for both `HeroSearch` stories, `Fallback` identical at every cell.
- `NotificationCenter.tsx` (390 -> 640) — R6/R7 met; only the 4 authorized `mobile-390` cells moved.

Re-running their verification is **not** required by this revision. Re-run only what §10 names.

## 2. Two orchestrator defects, named

Both were mine, in the original kickoff. The executor followed §14 correctly by stopping instead of rerouting.

**O-1 — §6.A asserted an unmeasured layout claim.** The kickoff said `minWidth: 0` was defence-in-depth and
implied it was inert where space is sufficient ("**Both are required**"). It is not inert. The tab strip is
**content-width, not full-width**: measured natural widths, read from the executor's own BEFORE PNGs at
`desktop-1024` and corroborated by the manifest's `right=` values — **en 227 · it 267 · uk 323 · sq 344 px**,
against content boxes of **288 @320 · 343 @375 · 358 @390 · 976 @1024**. Today each tab renders at its own
max-content because `flex: 1`'s `min-width: auto` clamp floors it there. Removing that clamp lets `flex-grow`
split the strip **50/50**, so the short label widens, the long one narrows and wraps — at every viewport, in every
locale. That is precisely what the executor measured. The kickoff's own §6.A "Expected rendered delta" paragraph
was therefore wrong, and AC2 as written was **unsatisfiable by that mechanism**.

**O-2 — AC8 required two things that cannot both hold.** `scripts/__tests__/css-var-resolvability.test.ts` has
**two** uses of `--breakpoint-notification-compact`. The kickoff inspected only the first (`:170`/`:185`, a
synthetic fixture string) and declared the file zero-diff on that basis. The second, at `:198-205`, reads the
**real** `src/app/globals.css` and asserts `expect(owned.size).toBe(257)`. Deleting the token makes it 256. The
kickoff's instruction "if `npm run test` fails on that file, the fixture was misread; stop and report" sent the
executor into a contradiction the kickoff itself created. This is the eighth occurrence of the
`docs/backlog.md:74` corollary — *a kickoff's own measured facts are not exempt* — and this time the defect was
reading **part** of a file and generalising from it.

## 3. Owner decisions, 2026-08-15 (round 2)

- **D-5 — AdminUsersTable is fixed with `ScrollArea`,** the mechanism the theme itself prescribes.
- **D-6 — the canonical-story shape,** i.e. the full-width track, not a content-width variant.
- **D-7 — update the test expectation `257 -> 256`;** the token deletion stands.

## 4. Why ScrollArea is the canonical answer — three independent sources

1. **The theme states it.** `src/design-system/mantine/theme.ts:830-831` sets `list.flexWrap: 'nowrap'` with the
   comment: *"tabs always stay in a single horizontal row (owner P0 — never wrap; consumers wrap `Tabs.List` in
   `ScrollArea` for swipe-scroll on overflow)."* The shipped `whiteSpace: 'normal'` attempt wraps **inside** the
   label, which defeats that owner P0 by a different route than the one it forbids.
2. **The canonical story demonstrates it.** `src/stories/mantine/primitives/Tabs.stories.tsx:36` —
   `<ScrollArea type="auto" scrollbars="x" scrollbarSize={0}><Tabs.List>…</Tabs.List></ScrollArea>`, with the
   rationale in the comment at `:25-30`. Note it uses `Tabs.List` **without** `grow`.
3. **The same file already ships it, 25 lines below.** `AdminUsersTable.tsx:459-471` wraps the role
   `SegmentedControl` in `<ScrollArea scrollbars="x" w="100%">` for the identical reason — the comment at `:457-459`
   even names the Ukrainian-label-clipping-at-320 case. `ScrollArea` is already imported at `:10`.

Canonical UI decision record: **`reuse`** — no new pattern, no new token, no story change.

## 5. Revision A — the edit

**A1. Restore first.** `git checkout -- src/components/admin/AdminUsersTable.tsx` so the file is byte-identical to
`HEAD` (`git hash-object` must equal `147239a7a`'s blob). Do not hand-remove the `styles` prop; restore, then edit.

**A2. Wrap the list, matching `Tabs.stories.tsx:36` exactly:**

```tsx
<Tabs value={activeTab} onChange={…}>
  <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
    <Tabs.List>
      <Tabs.Tab value="all">{t('tab_all')}</Tabs.Tab>
      <Tabs.Tab value="verified">{t('tab_verified')}</Tabs.Tab>
    </Tabs.List>
  </ScrollArea>
</Tabs>
```

**A3. `grow` is removed** — orchestrator decision derived from D-6, stated so it is reviewable rather than silent.
Three reasons: the canonical story has no `grow`; `grow` is **already inert** today (every tab is pinned at
max-content by the `min-width: auto` clamp, which is why the strip's width varies by locale at 1024); and under
D-6's full-width track `grow` would stretch each tab to ~488px at 1024, which is a design change nobody asked for.
**Replace the stale comment at `:421`** — *"Tabs — full-width on mobile via `Tabs.List grow`"* has never been true
and is the sentence that hid this defect. Say what is now true: a content-width pill strip inside a horizontal
`ScrollArea`, per `theme.ts:830`.

**A4. Nothing else in the file changes.** No `styles` prop, no `.module.css`, no label edit, no padding change.
For the record, so it is not re-proposed: trimming the theme's `tab.paddingInline` (12px) to zero saves 48px and
leaves `sq` at **296px** against a 288px box — it cannot work, and the label-shortening route was declined.

## 6. Two gate traps this mechanism may hit — read before running, report if either fires

The kickoff must not assert the gate outcome here, because two code paths make it genuinely uncertain and neither
has a live example anywhere in the current 1204-cell matrix (all 22 existing `AMBIGUOUS` are `ambiguousOverlap`,
i.e. Check 4 — **zero** are `ambiguous-offscreen`, so that branch is unexercised in this scope).

**Trap 1 — the downgrade needs both signals on the same element.**
`scripts/geometry-integrity.mjs:249-261`: `hasHorizontalScrollAncestor` returns true only for an ancestor that has
**both** `overflow-x: auto|scroll` **and** `data-scrollbars` in `{x, xy}`. Mantine puts `data-scrollbars` on the
**viewport** (`ScrollArea.mjs:125`), which is also the scrolling element — so this should hold, but it is a
conjunction of two facts about the same node and must be observed, not assumed.

**Trap 2 — Check 3 has no scroll-aware downgrade at all.**
`geometry-integrity.mjs:423-453` (`outside-container`) fires on the **nearest** ancestor matching
`hidden|clip|auto|scroll` (`isClippingAncestor`, `:138-142`) whose `overflow` string then contains `hidden|clip`.
The ScrollArea root computes `overflow: hidden` (`ScrollArea.mjs:234`) and the viewport is likely
`overflow-x: scroll` + `overflow-y: hidden`. Either can match. Unlike Check 2, Check 3 has **no**
`hasHorizontalScrollAncestor` branch — so a tab that escapes the viewport could turn today's `offscreen-control`
into a hard `outside-container`, a different hard FAIL rather than a fix.

**Checkpoint R1 (do this before anything else, and before touching the test in §7).** Apply A1–A4, build Storybook,
run `npm run screenshots:assert -- --mantine-only`, and report the **full `assertions.visualIntegrity` payload**
for `admin-adminuserstable--default` × `sq` and `uk` × `mobile-320`, verbatim from the manifest. Three outcomes:

| Observed | Meaning | Do |
|---|---|---|
| `violations: []`, `ambiguous: []` — cell `pass: true` | best case; the strip fits or the checks clear entirely | continue; AMBIGUOUS stays **22** |
| `violations: []`, `ambiguous: [{failReason:'ambiguous-offscreen', …}]` | the intended path (Trap 1 holds, Trap 2 does not fire) | continue; AMBIGUOUS becomes **24** |
| any `violations` entry — `outside-container`, `offscreen-control`, `text-clipped`, `self-clipped` | Trap 2 (or 1) fired | **STOP. Report `BLOCKED` with the payload.** Do not add a gate exemption, do not switch mechanism, do not touch `geometry-integrity.mjs`. This is a finding about the gate — same family as reserved Task **738** — and needs an owner decision |

## 7. Revision B — the AC8 contradiction

`scripts/__tests__/css-var-resolvability.test.ts` **joins the write set**, for exactly one expectation:

```
expect(owned.size).toBe(256)
```

with the existing comment block extended in the form Task 695 already used there (`259 -> 257`). Required wording,
verbatim: `257 -> 256 (Task 749): --breakpoint-notification-compact deleted with its last consumer
(NotificationCenter's 390px threshold retargeted to the canonical 640px sm, owner decision 2026-08-15 superseding
Task 593). Measured 2026-08-15.` The fixture at `:170`/`:185` is **unchanged** — it is a synthetic string and must
stay.

Do **not** convert the assertion to a derived count. It is a deliberate canary, it did its job here, and rebuilding
it as a self-measuring check is reserved **Task 747**'s scope, not this task's.

## 8. Amended acceptance criteria

**Retired:** AC2 (unsatisfiable, O-1) · AC8's zero-diff arm (contradictory, O-2). **AC1, AC3–AC7, AC9, AC10,
AC13–AC15 stand unchanged.**

- **AC2R [R1]** Given before/after PNGs for `Admin/AdminUsersTable/Default`, when compared, then **every changed
  cell is enumerated with a before/after image pair** in the report; the single-row pill strip is preserved in all
  4 locales at all 4 viewports; **no tab label wraps mid-label at any width**; and no cell of any **other** story
  changes. A rendered delta on AdminUsersTable is expected under D-6 and is not a defect — an unenumerated one is.
- **AC8R [R6,R8]** Given `grep -rn "notification-compact" src/`, then **0** matches; and `npm run test` exits 0
  with `css-var-resolvability.test.ts` changed in exactly one expectation, `257 -> 256`, plus its comment.
- **AC11R [R11]** Given `npm run screenshots:assert -- --mantine-only`, then **`0 FAIL`** and **exit 0**. The PASS
  count is **1180/1204** if checkpoint R1 lands on the `ambiguous-offscreen` row and **1182/1204** if it lands on
  the clean-pass row. Report the printed line verbatim; do not reconcile it to a predicted number.
- **AC12R [R12]** Given the before and after manifests, when the ambiguous set is diffed **as a set**, then the
  only permitted delta is **+2** — `admin-adminuserstable--default × {sq,uk} × mobile-320`, `ambiguous-offscreen`.
  The pre-existing **22** `ambiguousOverlap` cells are **0 added / 0 removed**. Any other movement is a regression.

## 9. Amended plant matrix

**P1a and P1b are retired with the mechanism they tested.** Replacements:

| # | Plant | Consumed by | Required observable |
|---:|---|---|---|
| P1a-R | Remove the `<ScrollArea>` wrapper, leaving `Tabs.List` bare | AC1 | the same 2 cells return to a hard `offscreen-control` violation with `right=360` (sq) / `right=339` (uk) |
| P1b-R | Keep the wrapper, set `scrollbars="y"` on it | AC1, AC12R | `data-scrollbars` no longer reads `x`/`xy`, so `hasHorizontalScrollAncestor` (`:249-261`) returns false and the cells go **hard-FAIL again** — this proves the downgrade is the scroll ancestor's doing and nothing else, and it is the arm that makes Trap 1 an observed fact rather than an assumption |

Both are reverted before final verification, each with its pre-plant `git hash-object` and absence from
`git status --porcelain`.

## 10. Verification delta — run only this

```
git checkout -- src/components/admin/AdminUsersTable.tsx
#   … apply §5 A2–A4, then STOP at checkpoint R1 …
npm run build-storybook
npm run screenshots:assert -- --mantine-only          # checkpoint R1 — classify per §6 before continuing
#   … then §7, then …
npm run test                                          # must exit 0 with the 257 -> 256 edit
npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx   # registry row 45
npm run check:css-vars
npm run check:design-tokens
npm run typecheck
npm run lint
git status --porcelain
npm run build                                         # hard gate, last, exit 0
```

Not re-run by this revision: `check:hydration`, `test:header-hydration-id-parity`, row 50's set,
`check:locale-leak:mantine-only`, `check:story-coverage`, `check:mojibake`, `check:i18n` — all already exited 0 (or,
for `check:locale-leak:mantine-only`, exited 1 on **13 pre-existing AdminUsersTable findings that this task's diff
does not touch**; that is reserved Task **736**, correctly reported and correctly not absorbed).

## 11. Report contract delta

Add to the original §13: the checkpoint R1 payload verbatim · the AC2R image-pair enumeration · both P1a-R/P1b-R
transcripts · the one-line test diff. Status remains `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED` — never self-approved.
