# Task 749 — Revision 2: make Checks 1 and 3 scroll-aware, and retire the Task 529 allowlist

**Filed:** 2026-08-15. **Mode:** `TASK DESIGN`, execution state **`remediation`**. **QA profile:** `Q3`.
**Preflight:** `tasks/Sprints/Sprint_58_Task_749_revision_2_evidence_preflight.md` — read §0 first; it records the
three orchestrator defects that produced two blocked rounds and the process correction now binding this brief.

**Supersedes:** Revision 1 §5 checkpoint R1's STOP disposition only. Revision 1 §7 (the `257 -> 256` test edit) is
**still pending and still in force**. Everything accepted in Revision 1 §1 stays accepted.

---

## 1. Where the tree actually is

Verified from `.screenshots/rendered-assert/2026-08-15T14-47/manifest.json`, not from the report:

```
summary: passed 1179 · failed 3 · ambiguousOnly 22 · textClipped 3 · outsideContainer 0 · offscreenControl 0
```

| Cell | violations | ambiguous |
|---|---|---|
| sq × mobile-320 | `text-clipped` ×2 — `scrollWidth=349, clientWidth=288` | `ambiguous-offscreen` ×1 |
| sq × mobile-375 | `text-clipped` ×2 — `scrollWidth=349, clientWidth=343` | — |
| uk × mobile-320 | `text-clipped` ×2 — `scrollWidth=328, clientWidth=288` | `ambiguous-offscreen` ×1 |
| en, it × all · sq/uk × 390, 1024 | none | none |

**The ScrollArea worked.** `noHorizontalOverflow` is `true` on all 16 cells and `offscreenControl` is **0** —
the real defect (a 320px phone scrolling sideways) is fixed, and Check 2's `hasHorizontalScrollAncestor` downgrade
fired exactly as designed. Do not revert it.

**What remains is three false positives.** Check 1 reports the *ancestor's* overflow as the *element's* clipping,
so it flags `Të gjithë përdoruesit` — a label that is **fully visible on screen** — and it treats a **6px**
overflow inside a deliberately swipe-scrollable strip (sq@375) as a hard visual defect.

## 2. Owner decision D-8, 2026-08-15

> **"Виправити гейт у 749"**

Chosen over: keeping ScrollArea and deferring the gate to 750 · reverting AdminUsersTable · shortening the sq/uk
labels. This authorises a diff to `scripts/geometry-integrity.mjs` and `scripts/check-stories-rendered.mjs`, and
**amends Sprint 58 exit criterion 3**, which had forbidden any diff to the latter.

**What D-8 does not authorise:** `continue-on-error`, a non-blocking job, a baseline-comparison CI mode, a
per-story exemption for `AdminUsersTable`, any change to `FULL_WIDTH_TOLERANCE`, `isChipSetMember`, the viewport
sets, or `MANTINE_PATTERN_KNOWN_FAILURES`. D-1 still holds for all of those.

## 3. Why a structural predicate and not an allowlist entry

`check-stories-rendered.mjs:635-640` already carries the Task 529 answer to this exact false positive:

```js
{ storyId: 'mantine-primitives-tabs--default', failReason: 'text-clipped',
  reason: 'intentional horizontal swipe-scroll tab bar — clipped tab is reachable by scrolling, not a layout defect' },
```

Adding a second such row for `admin-adminuserstable--default` would be one line and would make the cells **PASS**.
It is rejected because the repository has already litigated this shape twice: Task **724R** replaced the
`role="group"` gate suppression with the DOM-measured `isChipSetMember` predicate, and Task **726** deleted the
`[role="group"]` skip outright, on the stated ground that *an exemption must be a condition the gate evaluates,
never one an author applies*. A story-id allowlist is the same species: hand-maintained, silent when it drifts, and
blind to the next component that follows `theme.ts:830` correctly. The structural rule generalises; the row does not.

**So this revision retires the Task 529 row in the same diff.** Leaving it would also mask whether the new
predicate actually works on `Tabs/Default` — the free two-armed plant described in §6.

## 4. The edit

### 4.1 One shared predicate — `scripts/geometry-integrity.mjs`

`hasHorizontalScrollAncestor` (`:249-261`) already encodes the exact signal pair. Extract its per-node test so all
three call sites share **one definition** and cannot drift:

```js
function isHorizontalScrollContainer(node) {
  const cs = window.getComputedStyle(node);
  if (!/auto|scroll/.test(cs.overflowX)) return false;
  const scrollbars = node.getAttribute('data-scrollbars');
  return scrollbars === 'x' || scrollbars === 'xy';
}
```

`hasHorizontalScrollAncestor` keeps its `isInsideOverlayBody(el)` guard and its ancestor walk, and calls the new
helper instead of inlining the test. **Check 2's behaviour must not change** — proven by AC-R2-3.

### 4.2 Check 1 — `text-clipped` (`:338-380`)

Inside the existing ancestor walk, the branch that currently pushes a violation gains a third arm, ordered **after**
the ellipsis arm so that arm's semantics are untouched:

```js
} else if (isHorizontalScrollContainer(check) && !isInsideOverlayBody(el)) {
  ambiguous.push({
    failReason: 'ambiguous-text-clipped-scrollable',
    selector: selectorFor(el), label: labelFor(el),
    details: `scrollWidth=${check.scrollWidth}, clientWidth=${check.clientWidth}, text="${text.slice(0,40)}", horizontal scroll container`,
    reason: 'text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2',
  });
} else { …existing violation push… }
```

Only the clipping node **being examined by the walk** is tested. An element clipped by a plain `overflow:hidden`
box that merely happens to sit inside a scroller further up is **not** excused — the walk stops at the first
clipping ancestor, which is the one that clips it.

### 4.3 Check 3 — `outside-container` (`:424-453`)

**This half is not optional.** Check 3 is silent today only because of the `alreadyReported` guard at `:442-446`,
which skips the push when the same selector already has a `text-clipped` violation. Remove Check 1's violations and
Check 3 inherits the same three cells. Add, after `clipParent` is resolved:

```js
const horizScroller = isHorizontalScrollContainer(clipParent);
```

and gate only the **horizontal** escape dimensions on it: when `horizScroller` is true, `escapeRight` and
`escapeLeft` do not raise a violation — `escapeBottom` and `escapeTop` still do, and still hard-fail. A vertical
escape from a horizontal scroller is a real defect and must stay one. When the only escapes are horizontal, push an
`ambiguous` entry with `failReason: 'ambiguous-outside-scrollable'` rather than nothing, so the cell stays visible.

### 4.4 Retire the Task 529 allowlist row — `check-stories-rendered.mjs:635-640`

Delete the entry and its comment. Nothing replaces it.

### 4.5 Revision 1 §7, still pending

`scripts/__tests__/css-var-resolvability.test.ts` → `expect(owned.size).toBe(256)` with the comment form Revision 1
§7 specifies verbatim. It was gated behind Revision 1's checkpoint and never attempted.

## 5. Expected result — and what it is not

| | before (`14-47`) | after |
|---|---:|---:|
| PASS | 1179 | **1179** |
| FAIL | 3 | **0** |
| AMBIGUOUS | 22 | **25** |
| exit code | 1 | **0** |

**The three AdminUsersTable cells become `AMBIGUOUS`, not `PASS`.** State this plainly in the report and do not
describe the run as "all green". `check-stories-rendered.mjs:2073` prints, for exactly this case, *"ambiguous cells
need owner triage — not citable as green proof"*. The debt stays visible and permanent until someone shortens the
`sq`/`uk` labels — a content decision the owner declined this round.

`Tabs/Default`'s two cells must remain at **`ambiguousOverlap`**, unchanged, after the allowlist row is retired.

## 6. Plant matrix — every arm consumes a named AC

Each plant is reverted before final verification, with its pre-plant `git hash-object` and its absence from
`git status --porcelain` recorded.

| # | Plant | Consumes | Required observable | Why it exists |
|---:|---|---|---|---|
| P-G1 | With the fix in, change the `ScrollArea` on `AdminUsersTable` to `scrollbars="y"` | AC-R2-1 | `data-scrollbars` no longer reads `x`/`xy` → all three cells return to **hard `text-clipped`** | proves the downgrade is conditioned on the measured signal pair, not blanket-excusing the component |
| P-G2 | With the fix in, revert **§4.3 only**, keeping §4.2 | AC-R2-2 | the same three cells hard-fail with **`outside-container`** | converts the preflight's one `ANALYTICAL` masking prediction to `EXECUTED`; this is the arm whose absence would have caused a third blocked round |
| P-G3 | Revert **§4.1/§4.2/§4.3** but keep §4.4 (allowlist retired, no structural rule) | AC-R2-3 | `mantine-primitives-tabs--default` goes **hard-red** on `text-clipped` | proves the structural predicate — not the retired allowlist — is what keeps `Tabs/Default` green, using real production data |
| P-G4 | With the fix in, plant a genuinely clipped label: a fixed-width `overflow:hidden` box with **no** `data-scrollbars`, in an existing story, text overflowing | AC-R2-1 | hard `text-clipped` fires | proves the check still catches the defect class it exists for |

## 7. Acceptance criteria

- **AC-R2-1** Given the post-fix `--mantine-only` manifest, the three `admin-adminuserstable--default` cells have
  `violations: []` and carry `ambiguous-text-clipped-scrollable`; `verdict` is `ambiguous`; and plants P-G1 and
  P-G4 each produce a hard `text-clipped` when applied and clear when reverted.
- **AC-R2-2** Given plant P-G2, `outside-container` fires on those same three cells; with §4.3 restored,
  `summary.outsideContainer` is **0**.
- **AC-R2-3** Given the post-fix manifest, `mantine-primitives-tabs--default × {sq,it} × mobile-320` are still
  `ambiguousOverlap` and still exactly 2 cells; and plant P-G3 turns them hard-red, proving the retired allowlist is
  genuinely replaced rather than merely deleted. **Check 2 is unchanged:** `summary.offscreenControl` is 0 and the
  two `ambiguous-offscreen` entries are still present.
- **AC-R2-4** Given before/after PNG md5s for all 16 `admin-adminuserstable--default` cells across the `14-47` run
  and the post-fix run, **every one is identical** — the gate change alters no CSS, so any pixel delta means
  something else moved. Enumerate the comparison; do not assert it without running it.
- **AC-R2-5** Given a SHA-256 content witness captured **before the first write** for every `M` path in
  `git status --porcelain` that this revision does not touch, when re-captured at the end, then every witness is
  unchanged. A porcelain `M` entry alone is not evidence.
- **AC-R2-6** Given `npm run screenshots:assert -- --mantine-only`, stdout reads `1179/1204 PASS, 0 FAIL` with
  `25 AMBIGUOUS` and the process **exits 0**. Report the line verbatim; if the numbers differ, report the
  difference rather than reconciling to this table.
- **AC-R2-7** Revision 1 §7 lands: `grep -rn "notification-compact" src/` returns **0**, and `npm run test` exits 0
  with `css-var-resolvability.test.ts` changed in exactly one expectation.
- **AC-R2-8** `npm run build` exits **0**, transcript retained. **AC10, AC13, AC15 from the original kickoff still
  bind**, with §6's write set substituted for the original one.

## 8. Verification plan

```
git status --porcelain > <evidence>/S0-start-status.txt          # BEFORE the first write
sha256sum <every M path not touched by this revision> > <evidence>/S0-witnesses.txt
#   … apply §4.1 – §4.5 …
npm run typecheck && npm run lint
npm run test
npm run build-storybook
npm run screenshots:assert -- --mantine-only                     # expect 0 FAIL, exit 0, 25 AMBIGUOUS
#   … plants P-G1 … P-G4, each with revert + hash proof …
npm run check:assertion-liveness
npm run check:css-vars
npm run check:design-tokens
sha256sum -c <evidence>/S0-witnesses.txt
git status --porcelain                                           # compare to S0, not to a clean tree
npm run build
```

Not re-run: the HeroSearch / NotificationBellView / `MantineCountButton` set and critical-flow rows 33/45/50 —
their inputs are untouched by §6's write set. Row 45 **is** re-run, because `AdminUsersTable.tsx` is in the
accepted state and its smoke suite is cheap insurance.

## 9. Report contract

Add to the original §13: the four plant transcripts with hash proofs · the AC-R2-4 md5 enumeration · the S0/S1
status and witness comparison · the verbatim results line · and an explicit sentence stating that the three
AdminUsersTable cells are **AMBIGUOUS, not PASS**, with the residual debt named. Status stays
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.

**If a fourth surprise appears, stop and report it.** Two rounds were lost to my failure to enumerate a detector
before writing acceptance criteria; a third would be mine again, not yours.
