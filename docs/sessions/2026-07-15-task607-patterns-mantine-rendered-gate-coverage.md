# Session Archive: Task 607 — Extend the canonical Mantine rendered gate to `Patterns/Mantine/*` (13 pattern stories) — 2026-07-15

Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_607_PatternsMantineRenderedGateCoverage.md`
**Governance/gate task — no product code or story files edited (per hard contract).**

## Why (owner-directed, from the Task 606 review)

`scripts/check-stories-rendered.mjs`'s auto-discovery matched only the title prefix
`Mantine/Primitives/*`. The 13 `Patterns/Mantine/*` composite-pattern stories fell into the
weaker geometry-only phase (no render/anchor/style assertions, zero `--mantine-only` coverage).
Consequence found at the Task 605/606 reviews: `Patterns/Mantine/ListingCardPattern` had no
machine rendered coverage at all, forcing throwaway ad-hoc QA scripts for both tasks.

## Fix — prefix LIST, not a second mechanism

`MANTINE_PRIMITIVES_TITLE_PREFIX` (single string) → `MANTINE_STORY_TITLE_PREFIXES =
['Mantine/Primitives/', 'Patterns/Mantine/']`. `discoverMantinePrimitiveStories` matches ANY
listed prefix and derives `componentName` by stripping whichever matched — purely
prefix-derived, no hardcoded story-id allowlist (Task 529 no-drift discipline preserved). The
existing `geometryOnlyStories` exclusion needed zero code change — the 13 patterns moved out of
the geometry-only phase automatically once discovered.

**Result:** 43 `Mantine/Primitives/*` + 13 `Patterns/Mantine/*` = 56 stories, 900 cells
(320/375/390/1024 × 4 locales). Primitives byte-unchanged — confirmed: 692 primitive cells, 665
pass + 27 ambiguous (the same pre-existing Combobox/RangeDatePicker/Tabs ambiguous set) + 0 fail,
identical to the pre-Task-607 baseline (43 stories via direct index scan, matching count).

## Open-trigger triage (owner `AskUserQuestion`, resolved before implementation)

11 of 13 patterns render inline/immediately (confirmed via source read — no `play` function in
any of the 13 story files). Two do not:

- **`DialogDrawerPattern`** — a real controlled overlay (`useDisclosure(false)` +
  `<Button onClick={open}>`), the same lifecycle as `Modal`/`Drawer`/`Popover`. **Added to
  `MANTINE_OVERLAY_PRIMITIVES`** — owner-authorized, reuses the proven click-then-assert
  mechanism, zero new heuristic. Result: 16/16 PASS.
- **`NotificationPattern`** — trigger buttons call the imperative `notifications.show()` API (an
  auto-dismissing toast portal), not a controlled overlay. Owner: do NOT add to the same set (an
  auto-dismissing portal is a flaky-assert risk, and would be the exact silent-heuristic
  invention this file's governance forbids). **Deliberately left un-opened** — asserted only on
  its on-load render (trigger buttons + static content), which genuinely PASSed 16/16. Full
  toast-trigger coverage deferred to candidate **Task 608**.

## Real-defect triage — course correction mid-task (IMPORTANT — read before trusting any prior framing)

The first pass over the 3 newly-failing stories characterized all three as "genuine, hard,
real defects" and I asked the owner how to handle the CI-blocking consequence. The owner
authorized a tracked-known-failure registry mechanism on that premise. **Before finalizing, I
opened the actual screenshots and read the actual pattern source for all three — and two of the
three turned out to be misclassified.** I flagged this reversal explicitly to the owner rather
than let a wrong "confirmed real defect" label ship. Their ruling (2026-07-15):

> Per the orchestrator rule (§18.9: approving a chrome/overlap call from anything other than
> personally-viewed pixels is a review failure), I have to see the evidence before any exemption
> lands. [...] So: ListingDetailPattern → tracked known-fail + fix task. #1/#2 → hold, give me
> the artifacts, no allowlist in the diff until I confirm.

Accordingly, `MANTINE_PATTERN_KNOWN_FAILURES` now holds **only** `ListingDetailPattern`
(confirmed). `AdminSurfacePattern` and `AppShellFoundation` are **NOT** in the registry, **NOT**
allowlisted, and remain genuine, CI-blocking `fail` verdicts — the safe default until the owner
personally reviews the evidence below. **This means `--mantine-only` currently exits 1
(blocking)** — that is the correct, intended state of this session, not a task failure.

### 1. `ListingDetailPattern` — CONFIRMED real defect → Task 609

Horizontal overflow at all 16 cells (4 viewports × 4 locales), including desktop-1024.
Screenshot (`patterns-mantine-listingdetailpattern--default__uk__mobile-320.png`) shows no
*visible* clipping — the defect is a technical `scrollWidth` (330px) vs `clientWidth` (320px)
mismatch invisible to the eye. Root-caused via a live DOM offender scan: Mantine's own
`.mantine-Grid-inner`/`.mantine-Grid-col` elements extend to `left:-10, right:330` (340px wide,
10px bleed per side) — this is Mantine `Grid`'s standard negative-margin gutter technique
(`Grid-inner` gets a negative margin equal to half the gutter, `Grid-col` gets matching positive
padding, so the VISIBLE content lines up, but the intermediate wrapper's own bounding box
technically extends past the viewport edge). Whatever ancestor is supposed to clip this
(`overflow-x: hidden`) isn't doing so. Owner-confirmed as real: "that's precisely the kind of
geometry bug the gate exists to catch that the eye misses." Registry entry:
`ListingDetailPattern: { followUpTask: 609, expectedFailingCells: 16, expectedFailReason:
'horizontal-overflow' }`.

### 2. `AdminSurfacePattern` — HELD for owner pixel-review (likely gate false positive)

Reported `element-overlap` at all 16 cells. Exact finding (sq/mobile-320, from the clean-run
manifest):
```
selector: "#mantine-55vvqezis ↔ button", label: "(empty)" ↔ "Kërko..."
details: a=[16,60,304,104] b=[275,71,297,93]
```
`a` = the `TextInput`'s own bounding box (288×44). `b` = the button nested INSIDE it (22×22,
positioned at x=275–297, i.e. entirely within `a`'s own right-edge padding). Source
(`src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` lines 86–99):
```tsx
<TextInput
  placeholder={searchPlaceholder}
  ...
  rightSection={
    <ActionIcon variant="subtle" color="gray" size="sm" aria-label={searchPlaceholder}>
      <svg ...>...</svg>
    </ActionIcon>
  }
/>
```
This is Mantine's own documented `TextInput` `rightSection` pattern (a search icon docked inside
the input's own reserved right-hand slot) — the same shape as a native `<input type="search">`
with a magnifying-glass affordance. Screenshots
(`patterns-mantine-adminsurfacepattern--default__{sq,en,uk,it}__mobile-320.png`,
`__{sq,en,uk,it}__desktop-1024.png`, persisted in `docs/sessions/2026-07-15-task607-assets/`)
show a clean, unclipped search bar with the icon sitting inside the input's border, clear
whitespace on all sides — no visible text/icon collision at any locale or width.

**This looks like a gate-heuristic limitation, not a product bug**: `element-overlap` currently
cannot distinguish "two independent siblings colliding" (a real bug) from "a control correctly
nested inside its own parent's reserved padding/section" (by design — Mantine's `rightSection`/
`leftSection` API exists exactly for this). **Not concluded here** — owner correctly noted this
requires personal pixel confirmation before any fix lands (§18.9), and specifically that IF
confirmed a false positive, the correct remedy is a fix to the `element-overlap` heuristic
itself (so it doesn't also miss a REAL text/icon collision elsewhere later), not a per-story
allowlist. **No code change made for this story.** Remains a genuine blocking `fail` (16/16)
until adjudicated.

### 3. `AppShellFoundation` — HELD for owner pixel-review (likely open-trigger case, not false positive)

Reported `offscreen-control` for all 4 nav links at the 3 mobile viewports only (12/16 cells;
desktop-1024 passes 4/4). Exact finding (en/mobile-320): `a("Home")` etc. all report
`left=-308, viewportWidth=320`. Source (`MantineAppShellFoundation.tsx`):
```tsx
const [opened, { toggle }] = useDisclosure()          // line 46 — defaults CLOSED
...
navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}   // line 54
...
<Burger opened={opened} onClick={toggle} hiddenFrom="sm" ... />            // lines 61-62
```
This is Mantine's own `AppShell` responsive navbar: on mobile it starts collapsed
(off-canvas, `translateX`) until the user taps the `Burger`. This is **mechanically identical**
to `DialogDrawerPattern`'s own shape (a real, closed-by-default control with a genuine clickable
trigger, `useDisclosure`) — which IS already in `MANTINE_OVERLAY_PRIMITIVES` as of this same
task. Screenshots (`patterns-mantine-appshellfoundation--default__{sq,en,uk,it}__mobile-320.png`
+ `__{sq,en,uk,it}__desktop-1024.png`) show the closed-mobile state rendering correctly (header +
burger + brand, no clipping) — nothing is visibly broken; the nav content is simply off-screen
by design until opened.

**This is very likely an open-trigger case the existing mechanism would resolve with zero new
heuristic** (click the Burger, assert the opened nav) — not a false positive requiring a fix, and
not a confirmed real defect requiring a product fix either. **Not added to
`MANTINE_OVERLAY_PRIMITIVES` in this task** — held for the same owner pixel-review before any
diff change, per instruction. Remains a genuine blocking `fail` (12/16) until adjudicated.

## Also found: `layout='grid'` vs `layout='list'` title-hover divergence (out of Task 607's own scope)

While gathering the evidence above I confirmed a REAL divergence in `MantineListingCardPattern`
(Task 606 port artifact) that the rendered gate structurally cannot see (it is static-screenshot
geometry — it never asserts a `:hover` state):

- `layout='grid'` title (line 263): plain Mantine `<Text fw={600} size="sm" lineClamp={2}>` — no
  `group`/`group-hover` wiring anywhere on this branch's `Card`. **Title never changes color on
  hover.**
- `layout='list'` title (line 158): `<h3 className="... group-hover:text-primary
  transition-colors">`, with `'group'` on the Card's own className (line 130) — ported directly
  from the legacy horizontal branch. **Title DOES change color on hover.**

Confirmed by direct source read, not a hunch. Not fixed here (governance/gate task, no product
code touched, and this is a NEW finding outside this task's own diff). Candidate follow-up
**Task 610**: unify grid/list title-hover behavior (most likely: add the same `group-hover`
wiring to grid's `Text`, since grid is the live production surface and should probably keep
today's actual behavior — needs an owner call on which direction is "correct") + add a targeted
hover-state assertion so a `layout` divergence like this can't silently drift again (the exact
blind-spot class this rendered gate has by construction).

## Anti-no-op proof (clause 13)

Temporarily injected `style={{ minWidth: 2000 }}` on the `Default` story's outer `Stack` in
`ListingCardPattern.stories.tsx` (a real, if extreme, overflow). Ran `--mantine-only`:

```
Results: 813/900 PASS, 16 FAIL, 27 AMBIGUOUS, 44 KNOWN-FAILURE
  Patterns/Mantine/ListingCardPattern/Default × sq × mobile-320
    ✗ horizontal overflow detected
    ✗ geometry [offscreen-control]: [data-slot="button"] — Shto te preferuarat
    ... (11 more offscreen-control violations, same cell)
  ... (all 16 ListingCardPattern cells fail identically, 4 locales × 4 viewports)
```
16/16 ListingCardPattern cells genuinely FAILed with cascading `horizontal-overflow` +
`offscreen-control` violations — not silently absorbed by the known-failure registry (this story
was never in it). Reverted the injected style immediately; confirmed the revert is byte-identical
to the pre-plant committed state via `git diff` (empty diff on the story file). Re-ran
`--mantine-only` on the reverted code: 829/900 PASS, 0 FAIL (before the AdminSurfacePattern/
AppShellFoundation correction) — full transcripts for all 4 runs (baseline-reconciliation,
planted-violation, first-clean-confirm, corrected-registry-final) persisted at
`docs/sessions/2026-07-15-task607-assets/transcript-{1,2,3,4}-*.log`.

## Tracked known-failure registry mechanism (`MANTINE_PATTERN_KNOWN_FAILURES`)

Built because `--mantine-only` is confirmed **hard-blocking CI**
(`.github/workflows/governance-pr.yml` line 150, no `continue-on-error`) — the owner's own
conditional authorization ("add a tracked xfail registry... only if the wiring forces it") was
triggered once I confirmed the wiring. Each entry pins the EXACT failure signature
(failing-cell count + single primary fail reason); a matching cell still fails, still prints
loudly (a new "TRACKED KNOWN FAILURES" console section + "Bucket 1b" in the persisted governance
inventory `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md`), and
still carries `verdict: 'known-failure'` (never `'pass'`) in the manifest — excluded from the
CI-blocking count ONLY while the signature matches exactly. ANY divergence (fewer/more/different
failures) reverts to a normal hard failure with a loud "SIGNATURE CHANGED" warning, so it can
never silently mask a NEW or WORSE regression. **This is explicitly NOT the `LOADER_ALLOWLIST`
mechanism** (§14.9.8 etc., which is for FALSE positives) — it's for CONFIRMED true positives with
a filed fix task, kept visibly red-adjacent rather than invisible.

## Final state (this session's last run, `2026-07-15T19-36`)

```
Results: 829/900 PASS, 28 FAIL, 27 AMBIGUOUS (needs-owner-decision), 16 KNOWN-FAILURE (tracked, Task 609)
EXIT_CODE=1
```

**28 FAIL = `AdminSurfacePattern` (16) + `AppShellFoundation` (12), held for owner review — NOT
allowlisted.** `--mantine-only` is currently genuinely RED. This is the correct, safe state given
neither has been personally confirmed — do not treat this as a Task 607 defect; it is the honest
byproduct of extending real coverage to 2 stories with pre-existing, previously-invisible issues
that need the owner's own eyes before classification. Governance inventory Bucket 1 = 28 rows
(the 2 held stories), Bucket 1b = 16 rows (`ListingDetailPattern`, Task 609).

## Gates

```
node --check scripts/check-stories-rendered.mjs   → syntax OK
npm run check:stories                             → 116 files, 0 violations
npm run check:file-integrity                      → clean (all touched files)
npm run check:mojibake                            → 0 artifacts
```
No `git add`/`git commit` run — orchestrator's call at review.

## AC-by-AC self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. Prefix LIST match, `componentName` stripped correctly, no hardcoded allowlist | `discoverMantinePrimitiveStories` diff (file:line ~284-306) | ✅ |
| 2. All 13 patterns in `--mantine-only` output + full-mode Mantine phase; none double-counted in geometry-only | 900-cell runs, 208 pattern cells consistently present; `geometryOnlyStories` unaffected (no code change needed) | ✅ |
| 3. Primitives byte-unchanged (before/after count + diff) | 43 primitive stories both before (raw index scan) and after (via new code); 692 cells, 665 pass + 27 ambiguous + 0 fail, matches pre-existing baseline | ✅ |
| 4. Zero-match guard updated, still exits non-zero on zero discovery | Guard message now references `MANTINE_STORY_TITLE_PREFIXES.join(', ')` (file:line ~1253-1258) | ✅ |
| 5. Per-story triage table; every non-PASS is either an open-trigger STOP-AND-ASK or a recorded real-defect follow-up; NONE resolved by editing a product component/story | See "Open-trigger triage" + "Real-defect triage" sections above — DialogDrawerPattern open-trigger added (authorized); NotificationPattern deliberately left un-opened (authorized); ListingDetailPattern confirmed + tracked; AdminSurfacePattern/AppShellFoundation held for owner review, NOT resolved unilaterally | ✅ |
| 6. Anti-no-op planted-violation transcript | 16/16 ListingCardPattern cells genuinely FAILed, reverted, `git diff` empty | ✅ |
| 7. Rendered evidence persisted (uk@320/375/390 + desktop × 4 locales) | `docs/sessions/2026-07-15-task607-assets/` — 91 screenshots (7 cells × 13 stories) + manifests + transcripts | ✅ |
| 8. Gates green (script-appropriate) | Gates section above | ✅ |
| 9. Session log, backlog updated, STOP-AND-ASK spelled out | This document; `docs/backlog.md` updated | ✅ |

## Files Changed

| File | Rationale |
|------|-----------|
| `scripts/check-stories-rendered.mjs` | Prefix-list discovery (`MANTINE_STORY_TITLE_PREFIXES`); `DialogDrawerPattern` added to `MANTINE_OVERLAY_PRIMITIVES` (owner-authorized); new `MANTINE_PATTERN_KNOWN_FAILURES` tracked-xfail registry + reconciliation pass + report sections (holds only `ListingDetailPattern`); zero-match guard message updated; governance inventory gained a "Bucket 1b" section. |
| `docs/storybook-governance.md` | New §14.9.18 documenting the coverage extension, open-trigger triage, the AdminSurfacePattern/AppShellFoundation held-for-review evidence, the ListingDetailPattern confirmed defect, the hover-parity finding, and the anti-no-op proof. |
| `docs/critical-flow-registry.md` | Row 57 appended: `ListingCardPattern` now has real CI-blocking coverage via the extended gate. |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Regenerated by the gate itself (committed, harness-generated report) — reflects the final corrected state (28 Bucket-1 rows, 16 Bucket-1b rows). |
| `docs/sessions/2026-07-15-task607-assets/` | New — 91 rendered screenshots + 2 manifests + 4 run transcripts (`.screenshots/` is gitignored). |
| `docs/sessions/2026-07-15-task607-patterns-mantine-rendered-gate-coverage.md` | This session log. |

**No product component or `*.stories.tsx` file was edited** (the planted-violation edit to
`ListingCardPattern.stories.tsx` was temporary and fully reverted — `git diff` confirms zero
net change to that file).

## Outstanding for orchestrator/owner review

1. **Personally review** `docs/sessions/2026-07-15-task607-assets/patterns-mantine-adminsurfacepattern--default__{sq,en,uk,it}__{mobile-320,desktop-1024}.png` + source lines 86–99 of `MantineAdminSurfacePattern.tsx` → confirm/deny the search-icon-overlap is a false positive; if confirmed, the fix belongs in the `element-overlap` heuristic (`checkGeometryIntegrity`/`geometry-integrity.mjs`), not a per-story allowlist.
2. **Personally review** `docs/sessions/2026-07-15-task607-assets/patterns-mantine-appshellfoundation--default__{sq,en,uk,it}__{mobile-320,desktop-1024}.png` + `MantineAppShellFoundation.tsx` lines 46/54/61-62 → confirm whether to add `AppShellFoundation` to `MANTINE_OVERLAY_PRIMITIVES` (click-then-assert the opened nav) — the same authorized mechanism already used for `DialogDrawerPattern` in this task.
3. Open dedicated follow-up tasks per the owner's provisional numbering: **608** (NotificationPattern imperative-toast trigger), **609** (ListingDetailPattern Grid gutter overflow — registry already wired to this number), **610** (ListingCard grid/list title-hover parity + hover assertion coverage).
4. `--mantine-only` is currently exit 1 (blocking CI) due to the 2 held stories — this is expected and correct pending the review above, not a Task 607 regression.
