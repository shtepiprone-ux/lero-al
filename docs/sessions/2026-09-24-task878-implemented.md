# Task 878 — the header renders the real bell everywhere it is proven, and the header tree loses its inline-style hardcode: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW

Kickoff: `tasks/Sprints/Sprint_81_kickoff_prompt_Task_878_Header_Bell_And_Inline_Style_Hardcode.md`

## I0 — no drift

| Check | Kickoff §10.1 expectation | This session | Result |
|---|---|---|---|
| `00-node-platform.txt` | `win32` | `win32 v22.22.3` | match |
| 875 landed | `CaptchaWidget.tsx` has `language` inside `options` | confirmed by direct read | match |
| `02-style-sites.txt` | 28 sites across 9 files (F4) | identical count per file | match — no drift |
| `02b-census-header.txt` | 21 nodes, exit 1, exactly the two D81-2 FAIL lines (`Header`, `NotificationBell`) | identical | match |
| `03-heights-before.txt` | 97/97/65/65 at 320/389/390/1440, en+uk | identical | match |

Pre-existing dirty tree (unrelated, unchanged throughout): `docs/sessions/evidence/task861/storybook-dev.log`,
`scripts/schema-drift-check.sql`.

No `PREMISE DRIFT` at I0. Proceeded to implementation.

## GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT` (one per changed file; full receipts and search evidence are in
`04-style-ledger.md`, summarized here):
- `NotificationBellView.tsx` — queries: Flex, mah, dimmed; decision REUSE (Mantine `Flex`/`mah` style prop); new hardcoded visual values: NONE.
- `NotificationCenter.tsx` — queries: flex, mih, dimmed; decision REUSE; new hardcoded visual values: NONE.
- `NotificationItem.tsx` — queries: mt, spacing.micro, dimmed; decision REUSE; D35's `color-mix()` row left untouched (protected decision); new hardcoded visual values: NONE.
- `AuthSheet.tsx` — queries: dimmed, iconSize.standard, red.6 (matches `LocationCombobox.tsx:171`), green-6 (matches `notificationVariants.ts` success mapping), gray-6 (matches `SaveToCollectionButton.tsx:182`), Divider defaultProps, display prop; decision REUSE throughout; new hardcoded visual values: NONE.
- `UserMenu.tsx` / `LocaleSwitcher.tsx` — queries: Text span, fw; decision REUSE (matches `FavoritesTypeFilter.tsx`/`SaveToCollectionButton.tsx` `Text span` precedent); new hardcoded visual values: NONE.
- `LocationCombobox.tsx` — query: w style prop; decision REUSE; new hardcoded visual values: NONE.
- `PhoneField.tsx` — query: flex/miw style props; decision REUSE; new hardcoded visual values: NONE.
- `CaptchaWidget.tsx` — query: dimmed; decision REUSE; new hardcoded visual values: NONE.

`GR-3a STORY PREFLIGHT`:
- `HeaderView × signed-in bell` → canonical candidate `Mantine/Primitives/HeaderView` (direct import, own file); decision EXTEND — swap the stand-in for the real `NotificationBellView`.
- `HeaderActions × signed-in bell` → canonical candidate `Mantine/Primitives/HeaderActions`; decision EXTEND — same swap.

`GR-3 STORY PROVEN — NotificationBellView ← src/stories/mantine/primitives/NotificationBellView.stories.tsx` (own Story, unchanged). The `HeaderView`/`HeaderActions` Stories are composition proof only (GR-3), now composing the real node instead of a stand-in.

`GR-1 CENSUS COMPLETE — 21 nodes; tier1 0 migrated in this task (all edited nodes already enrolled+story) + 2 container-exempt (Header, NotificationBell — D81-2); tier2 0 imports removed; tier3 0.` (`16-census-header.txt`, unchanged from I0's `02b`.)

## Requirement and acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R1 | Confirmed | `NotificationBellView.tsx` diff: trigger `ActionIcon` `variant="default"` → `variant="subtle"`. `Indicator`, `aria-*`, touch target, icon size unchanged. |
| R2 | Confirmed | Both `HeaderView.stories.tsx` (`Default`, `SigningOut`) and `HeaderActions.stories.tsx` (`Default`) now import and render the real `NotificationBellView`, fed from `notifications.fixture.ts`'s `notificationRows(locale)` with `unreadCount = rows.filter(r => !r.is_read).length` (3 of 8 fixture rows, so > 0). Export names unchanged. The stand-in `ActionIcon`/`Bell` markup and its comment are removed from both files. `header_actions_bell_slot_aria` had no other consumer (re-grepped) and is removed from all four `messages/*.json`. `check:i18n` still reports 2369/2369/2369/2369 matching keys. |
| R3 | Confirmed | Full per-site ledger: `docs/sessions/evidence/task878/04-style-ledger.md`. 28/28 F4 sites dispositioned (15 MAPPED — `style={}` eliminated; 13 MECHANISM-KEPT — `style={}` remains, allowed properties only). 0 STOP rows. |
| R4 | Confirmed | Same ledger: every `fz={10}`→`fz="micro"`, every `c="var(--muted-foreground)"`/`style` muted colour →`c="dimmed"`, every raw `lh`/`lineHeight` removed or (where a named token exists) left alone, status colours mapped to the existing canonical `red.6`/`green-6`/`gray-6` roles used elsewhere in this exact codebase. |
| R5 | Confirmed | `03-heights-before.txt` and `30-heights-after.txt` both print 97/97/65/65 at 320/389/390/1440 for en and uk. |
| AC1 | Confirmed | `NotificationBellView.tsx` diff: only the `variant` change plus the R3 `:57` site (Box→Flex). Nothing else. |
| AC2 | Confirmed | Both Story files import `NotificationBellView` with fixture data and `unreadCount>0`; no stand-in remains; export names unchanged; `15-story-coverage.txt`, `21-i18n.txt`, `24-build-storybook.txt` all exit 0. |
| AC3 | Confirmed | Ledger: every F4 site has a row; no MAPPED/remaining site carries a colour/px/font-size/font-weight/line-height literal; every MECHANISM-KEPT row lists only §10.3's allowed properties (verified per-row in the ledger); 0 STOP rows. |
| AC4 | Confirmed | `31-style-sites-after.txt`: 13 remaining `style={` sites (3+5+3+1+0+0+0+0+1+0), exactly equal to the 13 MECHANISM-KEPT ledger rows. |
| AC5 | Confirmed | `03-heights-before.txt` = `30-heights-after.txt` = 97/97/65/65 for en+uk at all four widths. |
| AC6 | `MISSING EVIDENCE` (owed by the owner, O81-8) | Storybook matrix in kickoff §13.3 — not an executor gate. |
| AC7 | Confirmed, with one documented deviation from its literal "baseline diff is empty" clause — see below | `12`–`27` all exit 0 (see table); `29-status-after.txt` lists no path outside §7 beyond the two pre-existing unrelated `M` entries. |

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none — AC3's "no … literal" is GR-0's own rule scoped to the F4 sites, checked by the ledger; AC5 is the pre-existing measured invariant (Task 684 D3).`

### AC7 deviation — `scripts/surface-census-baseline.json` diff is not empty (documented, not hidden)

`check:surface-census:changed --base` initially **FAILED** (`19-census-changed.txt`, first run) with 4 stale
baseline entries: `src/app/admin/layout.tsx :: LocaleSwitcher.tsx`, and three `... :: PhoneField.tsx` rows (two
admin user pages + `AdminUserCreate.tsx`), all reason-coded `tier1-unenrolled-or-unstoried`.

**Root cause, verified, not assumed:** `LocaleSwitcher.tsx` and `PhoneField.tsx` were *already*
`manifest:yes story:yes` before this task touched them (confirmed independently by `16-census-header.txt`,
unrelated to any R3/R4 edit). The baseline rows recording them as `tier1-unenrolled-or-unstoried` from four
*other* admin surfaces' perspective were stale debt that predates this task. `check:surface-census-changed.mjs`
only re-censuses a baseline row's parent when the row's child (here, `LocaleSwitcher.tsx`/`PhoneField.tsx`) is
itself a changed file in the diff — which R3/R4 mandates. So this task's diff was the first to *trigger* the
re-census that exposed already-paid-off debt; it did not create the debt or cause a regression.

Kickoff §8 marks "both census baselines" out of scope on the stated rationale "no node changes enrolment" —
true, and nothing was enrolled. But leaving 4 now-provably-false baseline rows in place would permanently fail
this exact CI gate with no other remedy, since the FAIL is "no matching block exists" for an assertion that is
simply no longer true. The gate's own printed remediation is `check:surface-census:changed:update-baseline`, the
same mechanism `docs/golden-rules.md`'s own GR-1 enforcement section describes as normal operation for "debt
that already existed" (and the same class of action Task 876's session log recorded for its own R7′, removing 2
keys with owner acceptance). I ran it once, inspected the diff (`git diff -- scripts/surface-census-baseline.json`),
confirmed it is a **pure 12-line removal of exactly those 4 rows** (3 lines each) with **zero additions** and
**zero change** to `scripts/rendered-scope-baseline.json`, then re-ran the gate: `19-census-changed.txt` (second
run) is `PASS`, 0 new, 0 stale. `20-census-changed-verify.txt`: 12/12 arms pass.

This is flagged here for Opus's independent verification rather than silently treated as in-scope, because it is
a real, if narrow, deviation from the kickoff's explicit "both census baselines" exclusion and AC7's literal
"diff is empty" wording — both written before the kickoff's own F-facts anticipated this one-hop interaction.

## Current versus required behavior

Matches §9 of the kickoff exactly:

| | Current (pre-878) | Required | Verified by |
|---|---|---|---|
| Header bell on the site | bordered `default` `ActionIcon` + red unread `Indicator` | borderless `subtle` `ActionIcon` + the same `Indicator` | `NotificationBellView.tsx` diff (R1); unchanged `Indicator` props |
| `HeaderView`/`HeaderActions` Stories, signed in | hand-made subtle bell, no Indicator, no popover | the real `NotificationBellView`: subtle, with an Indicator, popover opens on click | R2 diff; `24-build-storybook.txt` exit 0; owner O81-8 confirms the rendered result |
| Muted helper text in the header tree | `var(--muted-foreground)` by style or prop | `c="dimmed"` | ledger, 15 MAPPED rows |
| Raw `lh`, `fz={10}` | literals | theme line heights / `fz="micro"` | ledger |
| Header bar height | 97/65 px | unchanged | `03`/`30` heights match |

Negative-flow applicability table (§11): unchanged from the kickoff — no branch added or removed. All six rows
(0 unread, >99 unread, mobile popover, guest header, header-height regression, auth/captcha/phone behaviour)
match their stated evidence; `test:auth` (71/71) is the regression guard for the last row.

## Files Changed

| File | Reason |
|---|---|
| `src/modules/notifications/components/NotificationBellView.tsx` | R1 (variant), R3 (`:57` Box→Flex) |
| `src/modules/notifications/components/NotificationCenter.tsx` | R3/R4 (3 style sites + 2 raw-lh/c rows) |
| `src/modules/notifications/components/NotificationItem.tsx` | R3/R4 (6 style sites + 4 raw-lh/c rows) |
| `src/modules/auth/components/AuthSheet.tsx` | R3/R4 (13 style sites + 2 raw-lh rows); `LoginView` gains `useMantineTheme()`; agent-register border becomes a real `Divider` |
| `src/components/layout/UserMenu.tsx` | R3/R4 (1 style site → `Text span fw`) |
| `src/components/shared/LocaleSwitcher.tsx` | R3/R4 (1 style site → `Text span fw`) |
| `src/components/shared/LocationCombobox.tsx` | R3/R4 (1 style site → `w` prop) |
| `src/components/shared/PhoneField.tsx` | R3/R4 (1 style site → `flex`/`miw` props) |
| `src/components/auth/CaptchaWidget.tsx` | R4 (1 raw `c` prop → `dimmed`) |
| `src/components/layout/MobileNavDrawer.tsx` | R4 (1 raw `lh` removed) |
| `src/stories/mantine/primitives/HeaderView.stories.tsx` | R2 — real `NotificationBellView`, fixture-fed |
| `src/stories/mantine/primitives/HeaderActions.stories.tsx` | R2 — same fix |
| `messages/en.json`, `messages/it.json`, `messages/sq.json`, `messages/uk.json` | R2 — `header_actions_bell_slot_aria` removed (no other consumer) |
| `scripts/surface-census-baseline.json` | AC7 deviation above — 4 provably-stale rows removed, 0 added |
| `docs/sessions/2026-09-24-task878-implemented.md` *(new)* | this session log |
| `docs/sessions/evidence/task878/**` *(new)* | full gate/ledger/probe evidence |
| `docs/backlog.md` | 878 state cell updated |

## Validation evidence

QA profile: **Q3** (header/navigation chrome).

| Command | File | Exit |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | `00-node-platform.txt` | `win32 v22.22.3` |
| `npm run test:auth` | `12-test-auth.txt` | 0 (9 files, 71 tests) |
| `npm run typecheck` | `13-typecheck.txt` | 0 |
| `npm run lint` | `14-lint.txt` | 0 (0 errors; pre-existing repo warnings only, none in a changed file) |
| `npm run check:story-coverage` | `15-story-coverage.txt` | 0 |
| `node scripts/check-surface-census.mjs --surface .../Header.tsx` | `16-census-header.txt` | 1 (exactly the two expected D81-2 FAIL lines) |
| `npm run check:rendered-scope` | `17-rendered-scope.txt` | 0 (0 new edges) |
| `npm run check:rendered-scope:verify` | `18-rendered-scope-verify.txt` | 0 (5/5 arms) |
| `node scripts/check-surface-census-changed.mjs --base <HEAD>` | `19-census-changed.txt` | 0 (second run, after the documented baseline update; first run: 1, see AC7 deviation) |
| `npm run check:surface-census:changed:verify` | `20-census-changed-verify.txt` | 0 (12/12 arms) |
| `npm run check:i18n` | `21-i18n.txt` | 0 (2369/2369/2369/2369 keys) |
| `npm run build-storybook` | `24-build-storybook.txt` | 0 |
| `npm run check:file-integrity` | `25-file-integrity.txt` | 0 (46 files clean) |
| `npm run check:mojibake` | `26-mojibake.txt` | 0 (6636 files, 0 artifacts) |
| `npm run build` | `27-build.txt` | 0 |
| `git diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json` | `28a-baseline-diff.txt` | non-empty — see AC7 deviation; pure 4-row removal, `rendered-scope-baseline.json` untouched |
| `git hash-object` (final, 12 files) | `28-hash-object.txt` | recorded |
| `git status --porcelain` (final) | `29-status-after.txt` | only §7 paths + the AC7-deviation baseline file + the two pre-existing unrelated `M` entries |
| `node docs/sessions/evidence/task878/probe-header-heights.mjs` (before) | `03-heights-before.txt` | 97/97/65/65 en+uk |
| same probe (after) | `30-heights-after.txt` | 97/97/65/65 en+uk |
| `grep -c 'style={' <file>` × 10 (before/after) | `02-style-sites.txt` / `31-style-sites-after.txt` | 28 → 13 |

One evidence-capture note, same as Task 875: PowerShell's `Tee-Object`/`Out-File` write UTF-8 **with** BOM by
default, which briefly made several evidence `.txt` files themselves flag under `check:file-integrity`'s BOM
check — never a source file. Stripped via Node `fs` before the final `check:file-integrity` run recorded above
(46 files clean).

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/Preserve | Evidence |
|---|---|---|---|---|---|
| Header bell trigger | `NotificationBellView.tsx` `ActionIcon` | `variant` prop | Mantine `ActionIcon` variant scale | Change (default→subtle) | R1 diff; owner O81-8 |
| Header bell popover panel sizing | `NotificationBellView.tsx` wrapper | `Flex`/`mah` | `theme.other.layout.notificationPanelMaxHeight` (unchanged value, unchanged mechanism) | Preserve (re-expressed as props) | ledger row 1 |
| Muted helper texts across the tree | `Text c=` / `style.color` | n/a | Mantine `dimmed` (existing, dominant pattern per F5: 27→31 of ~44 files) | Change (authorized, D81-7) | ledger, 15 MAPPED rows |
| Success-state checkmarks (`AuthSheet.tsx` ×2) | `CheckCircle2` lucide icon | `color` prop | `var(--mantine-color-green-6)`, matching `notificationVariants.ts`'s success→green role | Change (authorized) | ledger AuthSheet:225/656 |
| Agent-register section divider | `AuthSheet.tsx` | `Divider` (new) | Mantine `Divider` theme default (`color: 'gray.2'`) | Change from inline `style` to a real component, zero net spacing change | ledger AuthSheet:766 |
| Header bar height | `HeaderView.module.css` (untouched, 879's scope) | `.site-header` | `notification-chrome.css:49`'s 97/65 measurement (Task 684 D3) | Preserve | `03`/`30` heights |

## Canonical UI decision record

Full search evidence and disposition per changed visible artifact is in `docs/sessions/evidence/task878/04-style-ledger.md` (38 rows: 28 `style={}` sites + 14 raw-literal-only rows, minus overlaps). Summary dispositions used: REUSE (all 9 source files — existing Mantine props/theme tokens/canonical patterns already present elsewhere in this codebase), EXTEND (both header composition Stories, per GR-3a). No `CREATE` disposition was needed; no new visual value, token, CSS rule, `className`, locale key, Story, or Story export was added.

## Implementation validation notes

One genuine gap surfaced during implementation, not anticipated by the kickoff's I0/F-facts: the
`check:surface-census:changed` baseline staleness described under the AC7 deviation above. No other defect
found. `AuthSheet.tsx:766`'s original disposition plan (keep `style={{borderTop}}` with a re-tokenized value,
matching two other canonical patterns' own un-migrated `style={{borderTop}}` usage) was revised mid-implementation
to a genuine `Divider` component instead, because AC4's count invariant (remaining sites = MECHANISM-KEPT rows)
is only satisfiable if every MAPPED row's `style={}` attribute is actually eliminated — verified by re-deriving
the arithmetic before writing any code, not by trial and error.

## Assumptions, deviations, and limitations

- AC7's "census baseline diff is empty" clause is not met literally; see the documented, verified deviation above.
- AC6 (owner Storybook matrix) is explicitly owner-owed per §12/§13.3 and reported as outstanding.
- `header_actions_bell_slot_aria` removed from all four locale files; `check:i18n` confirms continued parity.

## Opus handoff

- Evidence root: `docs/sessions/evidence/task878/`; ledger: `docs/sessions/evidence/task878/04-style-ledger.md`.
- Please independently verify: the AC7 baseline-diff deviation (`28a-baseline-diff.txt` plus the reasoning
  above) — this is the one place this session's judgment substituted for the kickoff's literal wording.
- Please independently verify: AC4's exact 28→13 reconciliation (`02-style-sites.txt` vs `31-style-sites-after.txt`)
  against the ledger's MAPPED/MECHANISM-KEPT split.
- Please independently verify: `AuthSheet.tsx:766`'s `Divider` replacement introduces no spacing change (reasoning
  in the ledger and in "Implementation validation notes" above) — this is the one row that moved further than a
  simple prop swap.
- Outstanding, not blocking this handoff: AC6 (owner Storybook matrix, O81-8).

## Backlog update

`docs/backlog.md` line 41 (Sprints 80/81 combined row): 878 marked `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`;
execution-order note updated (878 done, 879 next, still reserved). Physical backlog line count unchanged
(single-line edit within the existing merged row) — no `BACKLOG LIMIT BREACH`.

## Revision 1 — remediation of review 1's `NEEDS REVISION` (kickoff §16)

Review 1 returned `NEEDS REVISION`: finding R1-F1 (P2) — `UserMenu.tsx:28` and `LocaleSwitcher.tsx:45`'s
`<Text span fw={…}>` labels were missing `inherit`, so the emphasised menu item rendered at Mantine's default
16px/24px instead of the ambient 14px/21px the sibling items use — a real regression against the removed
`<span style={{fontWeight}}>`'s inherited sizing. Finding R1-F2 (P3) — a stale comment in
`NotificationCenter.tsx` still described a removed `lh` value. The 4-row census-baseline removal was **accepted**
as-is (§16.3); nothing there was re-touched or re-run beyond confirming the second `check:surface-census:changed`
run stayed clean (no further stale row named).

Everything not named in §16 was preserved unmodified per the kickoff's re-entry instructions: R1, R2, the other
26 ledger rows, AC4's 28→13 count, AC5's heights, and the Header census were **not** redone from scratch — but
because §16.4 requires re-running the whole §13.2 block (overwriting `10`–`29`) to produce hashes describing the
shipped files, every gate below is this revision's own fresh run, not a copy of round 1's.

### §16.1 fix — R1-F1

- `src/components/layout/UserMenu.tsx:28`: `<Text span fw={500}>` → `<Text span inherit fw={500}>`.
- `src/components/shared/LocaleSwitcher.tsx:45`: `<Text span fw={600}>` → `<Text span inherit fw={600}>`.
- Both GR-0 receipts and both `04-style-ledger.md` rows corrected to state `inherit` and cite the real precedent
  (`FavoritesTypeFilter.tsx`/`SaveToCollectionButton.tsx` both already use `Text span … inherit`).

**Root-cause mechanism, confirmed by DOM inspection (not just the reviewer's claim):** `--text-fz` is a CSS
custom property, which cascades to descendants by default. On the **mobile** bottom-sheet path,
`MantineDropdownMenu.tsx`'s own wrapper already renders every item inside `<Text size="sm">`, which sets
`--text-fz: var(--mantine-font-size-sm)` inline — so even the *pre-fix* nested `<Text span fw>` (with no
`--text-fz` of its own) correctly inherited 14px via the cascading custom property, no bug visible there. On
the **desktop** path, `Menu.Item` sets a literal CSS `font-size` (not the `--text-fz` custom property) — so
`--text-fz` was undefined in that ancestry chain, and the un-inherited nested `Text`'s own rule
(`font-size: var(--text-fz, var(--mantine-font-size-md))`) fell back to 16px. This is why the probe's `32a`
run below shows the mismatch **only** at 1440, not at 390 — an asymmetry AC8 was written to catch by measuring
both widths rather than assuming uniformity.

### §16.1 AC8 — two-armed proof

New script `docs/sessions/evidence/task878/probe-menu-label-fz.mjs` (house `scripts/*probe*.mjs` pattern, a
local static server + Playwright against `storybook-static`). For `Mantine/Primitives/UserMenu` → `Default`
(admin fixture) and `Mantine/Primitives/LocaleSwitcher` → `Default`, at 1440 and 390, it opens the menu (via
the Story's own `play` at ≥640, or a click at <640 since `play`'s own width guard skips it there), measures
every item's rendering target (the innermost `.mantine-Text-root`, or the item container when none exists),
and asserts the emphasised item's font-size/line-height match its siblings' and its font-weight is 500/600.

- **Before** (`32a-menu-label-fz-before.txt`, against the round-1 `storybook-static` build, unmodified):
  `EXIT_CODE=1`. UserMenu@1440: `fontSize=16px != siblings' 14px`, `lineHeight=24px != siblings' 21px`.
  LocaleSwitcher@1440: identical shape. Both @390 already matched (mobile path unaffected, per the mechanism
  above) — the probe correctly found 0 problems there even pre-fix.
- **After** (`32b-menu-label-fz-after.txt`, storybook rebuilt with the `inherit` fix):
  `EXIT_CODE=0`. All four tuples (UserMenu/LocaleSwitcher × 1440/390) report the emphasised item's
  `fontSize`/`lineHeight` equal to its siblings', with `fontWeight` 500 (UserMenu) / 600 (LocaleSwitcher).

### §16.2 fix — R1-F2

`NotificationCenter.tsx:58-60`'s stale 3-line comment (still describing the removed `lh={1.625}`) replaced with
a single line matching the sibling comment style used elsewhere in this same diff: `// Task 878: raw lh={1.625}
removed — theme sm lineHeight (1.43) now applies (D81-7).`

### Re-validation (§16.4) — full §13.2 re-run, `10`–`29` overwritten

| Command | File | Exit |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | `10-platform.txt` | `win32 v22.22.3` |
| `npm run test:auth` | `12-test-auth.txt` | 0 (9 files, 71 tests) |
| `npm run typecheck` | `13-typecheck.txt` | 0 |
| `npm run lint` | `14-lint.txt` | 0 (0 errors; same pre-existing warnings, none new) |
| `npm run check:story-coverage` | `15-story-coverage.txt` | 0 |
| `node scripts/check-surface-census.mjs --surface .../Header.tsx` | `16-census-header.txt` | 1 (unchanged: exactly the two D81-2 FAIL lines) |
| `npm run check:rendered-scope` | `17-rendered-scope.txt` | 0 (0 new edges) |
| `npm run check:rendered-scope:verify` | `18-rendered-scope-verify.txt` | 0 (5/5 arms) |
| `node scripts/check-surface-census-changed.mjs --base <HEAD>` | `19-census-changed.txt` | 0 (0 new, 0 stale — no further stale row; §16.3's accepted 4-row removal unchanged) |
| `npm run check:surface-census:changed:verify` | `20-census-changed-verify.txt` | 0 (12/12 arms) |
| `npm run check:i18n` | `21-i18n.txt` | 0 (2369/2369/2369/2369 keys) |
| `npm run build-storybook` (with the fix) | `24-build-storybook.txt` | 0 |
| `npm run check:file-integrity` | `25-file-integrity.txt` | 0 (51 files clean) |
| `npm run check:mojibake` | `26-mojibake.txt` | 0 (6647 files, 0 artifacts) |
| `npm run build` | `27-build.txt` | 0 |
| `git diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json` | `28a-baseline-diff.txt` | unchanged from round 1: pure 4-row removal, `rendered-scope-baseline.json` untouched |
| `git hash-object` (final, 12 files) | `28-hash-object.txt` | `UserMenu.tsx`/`LocaleSwitcher.tsx`/`NotificationCenter.tsx` hashes changed from round 1; the other 9 unchanged |
| `git status --porcelain` (final) | `29-status-after.txt` | same file set as round 1, no path outside §7 |
| `node docs/sessions/evidence/task878/probe-header-heights.mjs` | `30-heights-after.txt` | 97/97/65/65 en+uk — unchanged |
| `grep -c 'style={' <file>` × 10 | `31-style-sites-after.txt` | 13 total — unchanged |
| `node docs/sessions/evidence/task878/probe-menu-label-fz.mjs` (before/after) | `32a`/`32b` | 1 → 0, see above |

### Files Changed (Revision 1 delta)

| File | Reason |
|---|---|
| `src/components/layout/UserMenu.tsx` | R1-F1 fix — add `inherit` |
| `src/components/shared/LocaleSwitcher.tsx` | R1-F1 fix — add `inherit` |
| `src/modules/notifications/components/NotificationCenter.tsx` | R1-F2 fix — stale comment corrected |
| `docs/sessions/evidence/task878/probe-menu-label-fz.mjs` *(new)* | AC8 two-armed proof script |
| `docs/sessions/evidence/task878/32a-menu-label-fz-before.txt`, `32b-menu-label-fz-after.txt` *(new)* | AC8 evidence |
| `docs/sessions/evidence/task878/04-style-ledger.md` | corrected UserMenu/LocaleSwitcher rows |
| `docs/sessions/2026-09-24-task878-implemented.md` | this Revision 1 section |
| `docs/sessions/evidence/task878/10`–`31` | overwritten per §16.4 |
| `docs/backlog.md` | 878 state cell → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)` |

All other files from the original Files Changed table are unchanged in this revision.

### Opus handoff (Revision 1)

- Please independently verify AC8 against `32a-menu-label-fz-before.txt` / `32b-menu-label-fz-after.txt` and the
  probe's source (`probe-menu-label-fz.mjs`) — in particular that the "sibling" measurement target and the
  "emphasised" target are derived structurally (innermost `.mantine-Text-root`, or the container when none
  exists), not hand-picked per case.
- AC6 (owner Storybook matrix) remains owner-owed; §16's amendment adds UserMenu, LocaleSwitcher and
  MobileNavDrawer rows to the O81-8 matrix (kickoff §13.3).

## Revision 2 — remediation of review 2's `NEEDS REVISION` (kickoff §17)

Review 2 verified Revision 1's `inherit` fix, re-ran AC8 (exit 0), and confirmed the full gate block's hashes
matched the files on disk. The owner accepted every O81-8 tuple except one: **D81-8** (owner, verbatim, quoted
in the sprint file) — the unread-count badge sits visibly away from the bell glyph, only readable as "belonging"
to the bell on hover. Preserved per §17, not re-run: `01`, `02`, `02b`, `03`, `32a`, `32b`.

**Also corrected in this revision:** review 2 found `32a-menu-label-fz-before.txt`'s `EXIT_CODE=0` trailer was
mis-captured — the underlying `node … | tee <file>` bash pipeline records `tee`'s exit status, not `node`'s, so
a real `process.exit(1)` (visible in that same file's own `FAIL` output) was wrongly annotated as success. The
line is now struck through with a `CORRECTION` note and the true `EXIT_CODE=1` beneath it; the run itself was
**not** repeated, only the wrong trailer line. Every exit code captured in this revision instead uses the
PowerShell `Tee-Object` + `$LASTEXITCODE` pattern (immediately after each command, per §17.4 step 7), which does
not have this failure mode.

### §17.2 root cause, re-verified independently (not just quoted from the kickoff)

`Indicator`'s `offset` (`theme.other.layout`, was named `notificationPopoverOffset` = 4) places the badge centre
at `(width − offset, offset)` of the wrapped 44×44 touch-target box, i.e. `(40, 4)`. The 20×20 bell glyph's
top-right corner sits at `((44+20)/2, (44−20)/2) = (32, 12)` — an 8px/8px gap in both axes. Before Revision 1's
`variant="default"` → `subtle` change, the 44px box drew a visible border, so the badge sat on a visible corner;
`subtle` made that box invisible, exposing the gap as a floating badge (D81-8's own observation — a real
consequence of Revision 1's fix, not a pre-existing defect it merely left alone).

### §17.3 R6 — fix

Renamed `theme.other.layout.notificationPopoverOffset` → `iconButtonIndicatorOffset` (a role future icon-button
counters can reuse, D81-8: *"у багатьох сторісах"*), value `4` → `12`, derived as
`(touchTarget 44 − iconSize.roomy 20) / 2 = 12` — placing the badge centre exactly on the icon corner for any
icon-button sharing this touch target and icon size, not re-measured ad hoc. Changed in the same diff:
- `theme.ts` type (`other.layout` interface);
- `theme.ts` value;
- the Task 822-era comment describing this role, rewritten to cite the derivation and D81-8 **without repeating
  the retired identifier literally** (`git grep notificationPopoverOffset -- src` returns nothing, confirmed —
  the AC's own check, not assumed);
- the sole consumer, `NotificationBellView.tsx:38`.

`GR-0 CANONICAL REUSE PREFLIGHT — request: Indicator badge position on any icon-button; semantic queries: Indicator offset, ActionIcon overflow hidden, touchTarget, iconSize.roomy; inspected candidates: theme.other.layout (existing role, being extended/renamed), @mantine/core ActionIcon.css (confirmed overflow:hidden rules out placing the badge inside the button); decision: EXTEND theme.ts other.layout, consumed via the existing Indicator offset prop (no new Mantine API); Mantine path: Indicator offset; provenance: D81-8's screenshot plus the geometry derivation above; new hardcoded visual values: NONE (12 is derived from two existing tokens — touchTarget, iconSize.roomy — and documented in the theme comment, not invented).`

Colour, size, the `99+` label and `disabled` at 0 are unchanged — confirmed by inspecting the diff (only `offset`
and its value/name changed on the `Indicator`).

### §17.3 AC9 — two-armed proof

New script `docs/sessions/evidence/task878/probe-bell-indicator.mjs` (same house static-server + Playwright
pattern as the other two probes in this task, its own port). For six tuples (`HeaderView`/`HeaderActions`/
`NotificationBellView` `Default`, each at 320 and 1440), it measures the centre of `.mantine-Indicator-indicator`
against the top-right corner of the bell `<svg>` inside the same `.mantine-Indicator-root`, and fails when
`|dx| > 1` or `|dy| > 1` **or when no indicator is found at all** (so an accidentally-hidden badge cannot read
as a pass).

- **Before** (`33a-bell-indicator-before.txt`, against the Revision-1 build, unmodified): `EXIT_CODE=1`. All six
  tuples: `dx=+8.00 dy=-8.00`, badge `16×16`, glyph `20×20` — an exact match to the reviewer's own measurement
  table (§17.2).
- **After** (`33b-bell-indicator-after.txt`, storybook rebuilt with the R6 fix): `EXIT_CODE=0`. All six tuples:
  `dx=+0.00 dy=+0.00` — exact coincidence, not merely within the ±1px tolerance.

### Re-validation (§17.4) — full §13.2 re-run, `10`–`29` overwritten

| Command | File | Exit |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | `10-platform.txt` | `win32 v22.22.3` |
| `npm run test:auth` | `12-test-auth.txt` | 0 (9 files, 71 tests) |
| `npm run typecheck` | `13-typecheck.txt` | 0 |
| `npm run lint` | `14-lint.txt` | 0 (0 errors; same pre-existing warnings) |
| `npm run check:story-coverage` | `15-story-coverage.txt` | 0 |
| `node scripts/check-surface-census.mjs --surface .../Header.tsx` | `16-census-header.txt` | 1 (unchanged: the two D81-2 FAIL lines) |
| `npm run check:rendered-scope` | `17-rendered-scope.txt` | 0 (0 new edges) |
| `npm run check:rendered-scope:verify` | `18-rendered-scope-verify.txt` | 0 (5/5 arms) |
| `node scripts/check-surface-census-changed.mjs --base <HEAD>` | `19-census-changed.txt` | 0 (0 new, 0 stale; `theme.ts` now appears as an 11th included surface, censused clean) |
| `npm run check:surface-census:changed:verify` | `20-census-changed-verify.txt` | 0 (12/12 arms) |
| `npm run check:i18n` | `21-i18n.txt` | 0 (2369/2369/2369/2369 keys) |
| `npm run build-storybook` (with the R6 fix) | `24-build-storybook.txt` | 0 |
| `npm run check:file-integrity` | `25-file-integrity.txt` | 0 (55 files clean) |
| `npm run check:mojibake` | `26-mojibake.txt` | 0 (6650 files, 0 artifacts) |
| `npm run build` | `27-build.txt` | 0 |
| `git diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json` | `28a-baseline-diff.txt` | unchanged from Revision 1: the same accepted 4-row removal, nothing new |
| `git hash-object` (final, 13 files incl. `theme.ts`) | `28-hash-object.txt` | recorded |
| `git status --porcelain` (final) | `29-status-after.txt` | same file set as Revision 1 plus `theme.ts`, no path outside §7 |
| `node .../probe-header-heights.mjs` | `30-heights-after.txt` | 97/97/65/65 en+uk — unchanged |
| `grep -c 'style={' <file>` × 10 | `31-style-sites-after.txt` | 13 total — unchanged |
| `node .../probe-bell-indicator.mjs` (before/after) | `33a`/`33b` | dx+8/dy-8 → dx+0/dy+0, see above |

### Files Changed (Revision 2 delta)

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | R6 — `notificationPopoverOffset` renamed to `iconButtonIndicatorOffset`, value 4→12, comment rewritten |
| `src/modules/notifications/components/NotificationBellView.tsx` | R6 — consumer updated to the renamed token |
| `docs/sessions/evidence/task878/probe-bell-indicator.mjs` *(new)* | AC9 two-armed proof script |
| `docs/sessions/evidence/task878/33a-bell-indicator-before.txt`, `33b-bell-indicator-after.txt` *(new)* | AC9 evidence |
| `docs/sessions/evidence/task878/32a-menu-label-fz-before.txt` | corrected: struck-through mis-captured `EXIT_CODE=0` trailer, true `EXIT_CODE=1` added; run itself unchanged |
| `docs/sessions/2026-09-24-task878-implemented.md` | this Revision 2 section |
| `docs/sessions/evidence/task878/10`–`31` | overwritten per §17.4 step 5 |
| `docs/backlog.md` | 878 state cell → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 2)` |

All other files from the original and Revision 1 Files Changed tables are unchanged in this revision.

### Opus handoff (Revision 2)

- Please independently verify AC9 against `33a-bell-indicator-before.txt` / `33b-bell-indicator-after.txt` and
  `probe-bell-indicator.mjs`'s measurement logic (badge = closest `[class*="Indicator-indicator"]`, glyph = the
  `<svg>` inside the same `[class*="Indicator-root"]`).
- Please independently verify the `32a` correction: the struck-through line plus the true `EXIT_CODE=1` line,
  against the script's own `process.exit(1)` call and the FAIL output already printed above it in that file.
- AC6 (owner Storybook matrix) remains owner-owed; §17.5 narrows the re-check to the three returned tuples only.

## Post-Revision-2 — owner follow-up in chat (informational, no code change)

Two items the owner raised in chat after Revision 2 was reported. Neither produced a code change to this task;
both are recorded here for the record and for Opus's awareness, per the owner's explicit instruction to log them
without folding either into Task 878's scope.

### 1. Indicator roundness — investigated, no reproducible defect found

The owner reported the Indicator badge "has facets" (not round) and asked for a fix, explicitly "without
hardcoding." Investigation, in order:
1. Computed style on the live rendered badge: `border-radius: 16000px` on a `16×16px` box — Mantine's own
   default (`var(--indicator-radius, 1000rem)`), no override anywhere in `theme.ts`. Mathematically an exact
   circle.
2. A 4× device-scale-factor Playwright screenshot of the actual rendered element
   (`docs/sessions/evidence/task878/indicator-zoom.png`, not part of any AC, evidence-only): a clean, smooth
   circle, no visible faceting.
3. Checked `src/app/globals.css` for a conflicting `border-radius` reset or a `--mantine-scale` definition that
   could invalidate the Indicator's sizing custom properties: none found (the one `border-radius: 50%` rule in
   that file targets `.reactEasyCrop_CropAreaRound`, an unrelated avatar-crop tool).
4. Asked the owner where exactly they saw it; confirmed: the red count badge circle itself, not the bell glyph.
5. Measured the owner's screenshot file directly: `C:\Users\Nox\Downloads\Screenshot_3.png` is **96×67 pixels
   total** (836 bytes) — at that resolution the badge itself is roughly 10–14 physical pixels across, and any
   circle at that scale will show visible stair-stepping/aliasing in a compressed PNG purely from the tiny
   resolution, independent of the actual CSS.

**Conclusion reported to the owner:** no CSS defect found; the most likely explanation is the screenshot's own
tiny resolution, not a rendering bug. No code change made. If the owner still sees faceting in the live browser
(not a cropped screenshot) at normal zoom, that would need a fresh repro (browser/OS, and ideally a full-resolution
screenshot) — flagged as open, not closed, pending that.

### 2. Notification-delivery regression report — investigated read-only, routed to the owner/Opus, not Task 878

The owner reported, translated: "looks like a regression — no notifications arrive at all, neither when a user
sends a message via the listing page's 'send message' button, nor when a complaint is filed against a user (the
reported user gets no notification)." A read-only fork investigation (no files edited) found:

1. **Listing "send message" inquiry never created an in-app notification, at any point in history** —
   `ListingContact.tsx` → `ListingInquiryDialog.tsx` → `src/modules/listings/actions/submitListingInquiry.ts`
   inserts into `listing_inquiries` and sends the owner an **email only** (`sendListingInquiryNotification`).
   Repo-wide search: zero creation sites for a `new_message` notification row anywhere in `src/`. Not a
   regression — this in-app path was never built. Whether the *email* itself is failing is unverifiable from
   local code (would need live Resend logs).
2. **"Reported user gets no notification" only fires on ticket *resolution*, not on filing** —
   `src/modules/admin/actions/index.ts` (`updateTicketStatus`) creates a `report_outcome` notification for
   `reported_user_id` only when an admin sets the ticket to `resolved`/`closed`. The public listing-report dialog
   reports a *listing*, not a *user*, and notifies the *reporter* on resolution, not the listing owner. May be
   expected behaviour depending on which exact flow the owner tried.
3. **Real, separate latent risk (not confirmed as currently active):** both notification-creation call sites
   (`src/modules/notifications/lib/mutations.ts` and its caller in `updateTicketStatus`) swallow insert failures
   with only `console.error`, never surfaced anywhere — if an insert were failing in production, nobody would see
   it.
4. Confirmed Task 878's own diffs (`NotificationBellView.tsx`/`NotificationCenter.tsx`/`NotificationItem.tsx`)
   are presentational only — no data-fetching or notification-creation code touched; not the cause of this report.
5. Existing tests for the two flows (`submitListingInquiry.test.ts`, `reportListing.smoke.test.ts`) pass locally,
   25/25; no test covers `updateTicketStatus`'s notification branch.

**Conclusion:** not a Task 878 regression. No code change made — the owner said they will take this to the
orchestrator (Opus) directly as its own item. Full findings relayed to the owner in chat; recorded here for the
session record only.

## Revision 3 — remediation of review 4's `NEEDS REVISION` (kickoff §18)

Re-entry mode: **remediation**. Review 4/§17 verified: the badge centre sits exactly on the glyph corner (dx/dy 0)
and stays there. **Preserved, not re-run:** `01`, `02`, `02b`, `03`, `32a`, `32b`, `33a`, `33b`.

### §18.1 The returned tuple: D81-9

The owner's chat report from "Post-Revision-2" above was formalized by the reviewer as **D81-9** (owner,
verbatim, quoted in the sprint file): *"в Storybook ці count overlaps не круглі!"* … *"я хочу щоб ці red count
overlaps були як на Rozetka.com.ua або Prom.ua, круглі"* — a Rozetka header screenshot showing a round badge
about the size of its icon. On two-or-more digits: *"Pill is fine (Recommended)"*.

### §18.2 Root cause, as measured by the reviewer

Not a CSS defect — a plain 16px `border-radius: 50%` circle renders pixel-identical to the badge in the same
browser. At DPR 1, any 16px circle shows flat facets; 18px and 20px render visibly rounder. The badge's size,
`theme.other.iconSize.standard` (16), was an **icon token reused as a badge diameter** — the same "one value,
two unrelated visual roles" collision class as the offset fix in Revision 2, this time for size instead of
position. `docs/sessions/evidence/task878/review4-badge-size-comparison.png` (hash `8ae95bb0b834e4f412d33d3d8cf3a08ce0e376d8`, confirmed present, not regenerated) is the reviewer's saved
size comparison.

### §18.3 R7 — fix

- `theme.other.layout.iconButtonIndicatorSize = 20` added to `theme.ts` (type + value + a comment citing D81-9
  and the derivation: the owner's reference badge is about as large as the 20px `iconSize.roomy` glyph, and 20
  is the smallest size in the reviewer's comparison that renders round at DPR 1). This is the **one new
  `theme.other` key** §10.5 explicitly authorizes for this revision.
- `NotificationBellView.tsx`'s `Indicator` now takes `size={theme.other.layout.iconButtonIndicatorSize}` instead
  of `theme.other.iconSize.standard` — the only line changed in that file this revision.
- Nothing else touched: `offset` stays `iconButtonIndicatorOffset` (12), colour, the `99+` label, and
  `disabled` at 0 are unchanged — confirmed by inspecting the diff.
- Two-or-more-digit counts keep Mantine's native pill (no padding/font-size override) — the owner's "Pill is
  fine."

`GR-0 CANONICAL REUSE PREFLIGHT — request: Indicator badge diameter on any icon-button; semantic queries: Indicator size, iconSize tokens, badge diameter; inspected candidates: theme.other.iconSize.standard (the token being replaced — an icon-token role collision, not a canonical badge-size source), theme.other.layout (existing role family, being extended, same pattern as iconButtonIndicatorOffset); decision: EXTEND theme.ts other.layout with iconButtonIndicatorSize; Mantine path: Indicator size prop (unchanged API, new value source); provenance: D81-9 owner screenshot + reviewer's DPR/size comparison; new hardcoded visual values: NONE (20 is a named, documented theme token, not a literal at the call site).`

`GR-3a STORY PREFLIGHT — NotificationBellView × two new count states (12, 99+); canonical candidates: src/stories/mantine/primitives/NotificationBellView.stories.tsx Default (direct import, already renders the real production component with several labelled sections); decision: EXTEND — two new labelled sections added to the existing Default export, no new export, no new file; rationale: both are real production states of the same already-storied component, matching R8's "no new component, Story, token or className" rule's Story clause (only one new theme token, explicitly authorized by §10.5).`

### §18.3 AC10 — two-armed proof, extended (not forked)

`probe-bell-indicator.mjs` extended in place: the existing six single-digit tuples now also assert badge size
20×20 (±0.5) and width==height (±0.5); two new checks read the Default story's 2nd/3rd indicator badges (the new
`unreadCount={12}`/`unreadCount={120}` sections) at 1440 only, asserting height 20 (±0.5) and width≥height (a
pill).

- **Before** (`36a-bell-indicator-size-before.txt`, against the Revision-2 build): `EXIT_CODE=1` — all six
  tuples report `badge=16x16` (expected 20×20); both multi-digit sections report `NO INDICATOR FOUND` (they did
  not exist in that build yet).
- **After** (`36b-bell-indicator-size-after.txt`, storybook rebuilt with the R7 fix + Story sections):
  `EXIT_CODE=0` — all six tuples `badge=20x20`, `dx=+0.00 dy=+0.00`; `unreadCount=12` → `text="12"
  badge=21.73x20`; `unreadCount=120` → `text="99+" badge=28.59x20` — both multi-digit badges 20px tall, wider
  than tall (Mantine's native pill), centred on the glyph corner.
- DPR crops (`36c-badge-crop-dpr1.png`, `36c-badge-crop-dpr2.png`) captured via a one-off Playwright script
  (`docs/sessions/evidence/task878/capture-badge-crop.mjs`, house static-server pattern, its own port 6044),
  visually confirming the badge is round at both device pixel ratios — for the owner's O81-8 re-check.

### Re-validation (§18.4 step 5) — full §13.2 re-run, `10`–`29` overwritten; `30` re-run

| Command | File | Exit |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | `10-platform.txt` | `win32 v22.22.3` |
| `npm run test:auth` | `12-test-auth.txt` | 0 |
| `npm run typecheck` | `13-typecheck.txt` | 0 |
| `npm run lint` | `14-lint.txt` | 0 |
| `npm run check:story-coverage` | `15-story-coverage.txt` | 0 |
| `node scripts/check-surface-census.mjs --surface .../Header.tsx` | `16-census-header.txt` | 1 (unchanged: the two D81-2 FAIL lines, `Header.tsx`/`NotificationBell.tsx`) |
| `npm run check:rendered-scope` | `17-rendered-scope.txt` | 0 |
| `npm run check:rendered-scope:verify` | `18-rendered-scope-verify.txt` | 0 |
| `node scripts/check-surface-census-changed.mjs --base <HEAD>` | `19-census-changed.txt` | 0 |
| `npm run check:surface-census:changed:verify` | `20-census-changed-verify.txt` | 0 |
| `npm run check:i18n` | `21-i18n.txt` | 0 |
| `npm run build-storybook` (with the R7 fix + Story sections) | `24-build-storybook.txt` | 0 |
| `npm run check:file-integrity` | `25-file-integrity.txt` | 0 |
| `npm run check:mojibake` | `26-mojibake.txt` | 0 |
| `npm run build` | `27-build.txt` | 0 |
| `git diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json` | `28a-baseline-diff.txt` | unchanged from Revision 1/2: the same accepted 4-row removal, nothing new; `rendered-scope-baseline.json` has no diff |
| `git hash-object` (12 files) | `28-hash-object.txt` | recorded |
| `git status --porcelain` (final) | `29-status-after.txt` | see deviation note below |
| `node .../probe-header-heights.mjs` | `30-heights-after.txt` | 97/97/65/65 en+uk — unchanged |

**Deviation — concurrent out-of-scope paths in the final `git status`.** `29-status-after.txt` shows several
paths neither `00-i0.txt`/`01-status-before.txt` (this task's own baseline) nor Task 878's §7 scope name:
`docs/backlog-archive.md`, `docs/design-system-pattern-ownership.md`,
`docs/reviews/2026-08-24-task765-runtime-motion-radius-tokens.review-ledger.json`,
`scripts/__tests__/check-ledger-claim-projection.test.ts`, `scripts/check-ledger-claim-projection.mjs`,
`tasks/Sprints/Sprint_46_kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`,
`tasks/Sprints/Sprint_46_kickoff_prompt_Task_742_RenderedRunModeProvenance.md`,
`tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md`. None of these were touched by this session — they were not
present in the prior revision's `29-status-after.txt` either. This working tree is shared with concurrent
sessions (this same session ran Task 880 immediately before this task, and other activity landed commits between
turns — see `git log`). Reported factually per AC7's letter ("no path outside §7 beyond `01-status-before.txt`");
not reverted, since they are not this task's files to revert and may be another session's in-progress work.

### Files Changed (Revision 3 delta)

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | R7 — `iconButtonIndicatorSize` (20) added (type + value + comment) |
| `src/modules/notifications/components/NotificationBellView.tsx` | R7 — `Indicator size` consumes the new token |
| `src/stories/mantine/primitives/NotificationBellView.stories.tsx` | R7 — two labelled sections added to `Default` (`unreadCount=12`, `unreadCount=120`) |
| `docs/sessions/evidence/task878/probe-bell-indicator.mjs` | extended in place (not forked) — size assertions + multi-digit measurement |
| `docs/sessions/evidence/task878/capture-badge-crop.mjs` *(new)* | one-off DPR1/DPR2 crop capture for O81-8 |
| `docs/sessions/evidence/task878/36a-bell-indicator-size-before.txt`, `36b-bell-indicator-size-after.txt`, `36c-badge-crop-dpr1.png`, `36c-badge-crop-dpr2.png` *(new)* | AC10 evidence |
| `docs/sessions/2026-09-24-task878-implemented.md` | this Revision 3 section |
| `docs/sessions/evidence/task878/10`–`30` | overwritten per §18.4 step 5 |
| `docs/backlog.md` | 878 state cell → `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 3)` |

All other files from the original and Revision 1/2 Files Changed tables are unchanged in this revision.

### Opus handoff (Revision 3)

- Please independently verify AC10 against `36a`/`36b` and the extended `probe-bell-indicator.mjs` measurement
  logic (size from the same `getBoundingClientRect()` already used for `dx`/`dy`; multi-digit badges read by
  document-order index from `measureAll()`, since the Default story now renders 3 indicator badges in one
  canvas).
- Please independently verify the DPR crops render a visually round badge at both DPR 1 and DPR 2.
- Please assess the concurrent-paths deviation above — whether it blocks this revision's review or is simply
  noted and excluded from this task's diff inspection.
- AC6/O81-8 stays owner-owed; §18.5 narrows the re-check to the returned tuple only.
