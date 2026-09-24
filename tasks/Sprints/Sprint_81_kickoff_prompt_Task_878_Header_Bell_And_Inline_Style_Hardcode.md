# Task 878 — the header renders the real bell everywhere it is proven, and the header tree loses its inline-style hardcode

Sprint 81 · **P2** · QA profile **Q3** (navigation/header chrome) · depends on **875** (both edit `CaptchaWidget.tsx`) ·
owner decision **D81-7** · owner action **O81-8** · **Status: 🔍 PARTIALLY VERIFIED (review 2, 2026-09-24) — §16 remediation
verified; no executor action; approval waits only on the owner's O81-8 matrix (§13.3)**

Sprint plan: [`Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md`](Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md).
The header's CSS modules and global classes are **879** (reserved, D81-7), not this task.

## 1. Mode and task type

`IMPLEMENTATION`, covering:
- a canonical-Story correction: slot stand-in → real component;
- a visible-chrome fix on one enrolled component (`NotificationBellView`);
- a hardcode removal across 9 enrolled files of the header render tree.

No new component, pattern, Story file, Story title, locale key or theme token.

Bundles:
- **UI / Mantine current path**;
- **Storybook / Visual Proof**;
- **TailAdmin / Styling Governance**, because values are re-sourced from theme tokens.

## 2. Objective

1. **The bell on the site looks like the bell in the Story.** The owner, 2026-09-24: *"в HeaderView Story кнопка
   сповіщень виглядає так як треба, а от на реальному сайті вона зовсім інша"* (in the HeaderView Story the bell looks
   right, but on the real site it is completely different).
2. **The Stories can no longer hide such a divergence.** The header's composition Stories render the real
   `NotificationBellView`, not a hand-made stand-in.
3. **No inline `style` object in the header render tree carries a visual value.** Colours, sizes, line heights and
   weights come from Mantine props and theme tokens.

## 3. Verified context — measured 2026-09-24 (re-measure at I0)

- **F1 (FACT) — why the bell differs.** The real site renders `Header.tsx:78`
  `notificationSlot={headerUser ? <NotificationBell /> : undefined}`. `NotificationBell` renders
  `NotificationBellView` (`src/modules/notifications/components/NotificationBellView.tsx`).

  That View **is** canonical Mantine: `MantinePopover`, `Indicator`, and `ActionIcon` at `:41-50`. Its trigger is
  **`variant="default"`** (bordered).

  The two header composition Stories do **not** render it. Each passes a hand-made stand-in into the slot:
  - `src/stories/mantine/primitives/HeaderView.stories.tsx:41-45` (`Default`), and the same markup in `SigningOut`
    (876);
  - `src/stories/mantine/primitives/HeaderActions.stories.tsx:34-37`.

  The stand-in is `<ActionIcon variant="subtle" … aria-label={t('header_actions_bell_slot_aria')}><Bell/></ActionIcon>`.
  So the Stories show a **subtle** (borderless) bell with no `Indicator` and no popover, while production shows a
  **default** (bordered) bell. The stand-in's justification comment, *"own hooks … never hook-calls the real bell"*,
  applies to the container `NotificationBell`, **not** to the presentational `NotificationBellView`. The View takes
  plain props (`notifications`, `unreadCount`, `onRead`) and is already storied with fixtures
  (`Mantine/Primitives/NotificationBellView`).

  This is the "slot or demo mismatch" that `docs/orchestrator-procedures.md` → "Canonical Story source-of-truth
  check" forbids.
- **F2 (FACT).** The bell's right-hand neighbour in production, the Favourites `ActionIcon`
  (`src/components/layout/HeaderActions.tsx:35-44`), is `variant="subtle"` with `mih`/`miw={theme.other.touchTarget}`
  and a `theme.other.iconSize.roomy` icon. That is exactly the stand-in's look.
- **F3 (FACT).** `src/stories/fixtures/notifications.fixture.ts` exists and is imported by the `NotificationCenter`
  and `NotificationItem` Stories.
- **F4 (FACT) — inline `style={…}` objects in the header render tree** (the 21 nodes of
  `check-surface-census --surface src/components/layout/Header.tsx`), counted with `grep -c "style={"`:

  | File | Sites | What they hold (read at the cited lines) |
  |---|---:|---|
  | `src/modules/auth/components/AuthSheet.tsx` | 13 | `:160` svg `width:16,height:16`; `:171`, `:227`, `:241` `color:'var(--muted-foreground)'` + `lineHeight:'1.625'`; `:225`, `:656` `color:'var(--status-success)'`; `:473` muted colour; `:511` `color:'var(--destructive)'` + lh; `:513` `fz={10}` + muted + lh; others at I0 |
  | `src/modules/notifications/components/NotificationItem.tsx` | 6 | `:191` cursor + `transition` (motion tokens); `:207` `marginTop:'var(--mantine-spacing-micro)'`; `:212` `flex`,`minWidth:0`; `:219`, `:232` `whiteSpace`,`overflowWrap`; `:256` `flexShrink:0` |
  | `src/modules/notifications/components/NotificationCenter.tsx` | 3 | `:35`, `:79` flex/min-height/overflow; `:54` `flexShrink:0` |
  | `src/modules/notifications/components/NotificationBellView.tsx` | 1 | `:57` flex column + `maxHeight: theme.other.layout.notificationPanelMaxHeight` + overflow |
  | `src/components/layout/UserMenu.tsx` | 1 | `:28` `fontWeight: 500` |
  | `src/components/shared/LocaleSwitcher.tsx` | 1 | `:45` `fontWeight: 600` |
  | `src/components/shared/LocationCombobox.tsx` | 1 | `:145` `width:'fit-content'` |
  | `src/components/shared/PhoneField.tsx` | 1 | `:179` `flex:1, minWidth:0` |
  | `src/components/auth/CaptchaWidget.tsx` | 1 | `:71` `width:'100%'` on the third-party `Turnstile` |
  | **Total** | **28** | |

  Raw literal props measured in the same tree:
  - `lh={1.625}`: `MobileNavDrawer.tsx:55`, `NotificationCenter.tsx:59`, `:81`;
  - `lh={1.25}`: `AuthSheet.tsx:226`, `:657`;
  - `lh={1.375}`, `lh={1.625}`: in `NotificationItem.tsx`;
  - `c="var(--muted-foreground)"`: `NotificationCenter.tsx:81`, `CaptchaWidget.tsx:37`;
  - `fz={10}`: `AuthSheet.tsx:513`.
- **F5 (FACT) — tokens that exist** (`src/design-system/mantine/theme.ts`):
  - `fontSizes.micro = '0.625rem'` (10px) at `:595`;
  - `lineHeights` xs/sm/md/lg/xl at `:575-`;
  - `other.lineHeight.authNoteParagraph = '1.21875rem'` (19.5px) at `:687`;
  - Mantine `c="dimmed"`, the dominant canonical muted colour: 27 production files, 12 of them patterns, against 17
    that still use `var(--muted-foreground)`.
- **F6 (FACT).** The header's CSS modules (`HeaderView.module.css`, `MobileNavDrawer.module.css`,
  `LocaleSwitcher.module.css`, `AuthSheet.module.css`) and the global `.site-header`/`.container-wide` classes are
  **879** (D81-7). `docs/tailadmin-style-reference.md` has no header reference (clause 16a).
- **F7 (FACT).** `src/design-system/mantine/notification-chrome.css:49` depends on the measured `header.site-header`
  height (97px below 390px, 65px from 390px; Task 684 D3). This task must not change the header bar's height.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Objective 1, F1, F2, D81-7 | In `NotificationBellView.tsx`, the trigger `ActionIcon` changes from `variant="default"` to **`variant="subtle"`**, the look the owner approved in the Story and the one its Favourites neighbour uses. Nothing else about the trigger changes: `Indicator`, `aria-*`, touch target and icon size stay. | P1 | AC1, AC6 | Confirmed |
| **R2** | Objective 2, F1, F3 | `HeaderView.stories.tsx` (`Default` and `SigningOut`) and `HeaderActions.stories.tsx` pass the **real** `NotificationBellView` into `notificationSlot`, fed from `notifications.fixture.ts`, with `unreadCount` > 0 so the `Indicator` shows, and `onRead` as a no-op. The stand-in `ActionIcon` and its comment are removed. If `storybook.mantine.header_actions_bell_slot_aria` has no other user afterwards, remove it from all four `messages/*.json`. **No new export or file.** | P1 | AC2, AC6 | Confirmed |
| **R3** | Objective 3, F4, F5, GR-0 | Every site in F4 gets exactly one disposition, recorded in a per-site ledger (§10.3).<br>• **MAPPED:** replaced by a Mantine prop, layout component or theme token.<br>• **MECHANISM-KEPT:** a non-visual CSS mechanic with no Mantine prop stays in `style`, with the reason. Examples: `overflowWrap`, `cursor`, `flexShrink`, a `transition` already bound to motion tokens, `width:'100%'` on the third-party `Turnstile`.<br>• **STOP:** a visual value with no token.<br>A colour, px size, font size, font weight or line height can **never** be MECHANISM-KEPT. | P1 | AC3, AC4 | Confirmed |
| **R4** | F4, F5 | The F4 raw literal props become tokens:<br>• `fz={10}` → `fz="micro"`;<br>• `c="var(--muted-foreground)"` and `style={{ color: 'var(--muted-foreground)' }}` → `c="dimmed"`;<br>• raw `lh={…}` / `lineHeight` → removed, so the theme's size-paired line height applies, **or** the existing `theme.other.lineHeight.*` token for that role where one is named (F5).<br>Status colours use the Mantine theme colour that an existing canonical pattern already uses for the same role (GR-0 search). If none exists, STOP. | P1 | AC3 | Confirmed |
| **R5** | F7 | The header bar's height stays 97px below 390px and 65px from 390px. The measurement is in §10.4. | P0 | AC5 | Confirmed |

## 5. Assumptions and open questions

1. **DECIDED — D81-7 (owner, 2026-09-24).** The question listed the three findings (bell stand-in, inline styles, CSS
   modules without a TailAdmin header reference) and asked how to task them. The option chosen, verbatim: *"Two tasks
   (Recommended)"*. The option read: *"878 now: the real bell in the HeaderView/HeaderActions Stories, the bell trigger
   switched to the Story look (subtle, like the heart next to it), and every inline style object in the header tree
   replaced with Mantine props/theme tokens. 879: the four CSS modules and global classes, starting by capturing a
   TailAdmin header reference."*
2. **Expected, authorized visual change.** Removing a raw `lh` changes some text line heights to the theme's canonical
   scale. For example, `lh={1.625}` on 14px text is 22.75px, and the theme's `sm` rung is 1.43, about 20px. The owner
   matrix (O81-8) judges the result. This is the migration's intended effect, not a regression. A returned tuple
   becomes a revision.
3. **Correction of the design-time question.** The owner was told "24 inline style objects". The complete census is
   **28**: the three sites in `LocationCombobox`, `PhoneField` and `CaptchaWidget` were missed. This kickoff uses 28.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0 to GR-6.
- `docs/agent-contract.md`: clauses 3, 5, 7, 11, 13, 14, 16, 16a–16d.
- `docs/orchestrator-procedures.md`: "Canonical Story source-of-truth check" (the slot/demo mismatch rule).
- `docs/mantine-responsive-design-system.md`: style props and layout components before `style`.
- `docs/tailadmin-style-reference.md`: §2 (type scale), §4 (colour).
- `docs/storybook-governance.md`: canonical titles, no new pages, toolbar locale/viewport.
- `docs/qa-profiles.md`: the Q3 row.

## 7. Scope

Files the executor may change:
- `src/modules/notifications/components/NotificationBellView.tsx`: R1, R3
- `src/modules/notifications/components/NotificationCenter.tsx`, `NotificationItem.tsx`: R3, R4
- `src/modules/auth/components/AuthSheet.tsx`: R3, R4. **Not** its `.module.css` or any `className` (879).
- `src/components/layout/UserMenu.tsx`, `src/components/shared/LocaleSwitcher.tsx`,
  `src/components/shared/LocationCombobox.tsx`, `src/components/shared/PhoneField.tsx`,
  `src/components/layout/MobileNavDrawer.tsx`, `src/components/auth/CaptchaWidget.tsx`: R3 and R4 at the F4 sites
  only
- `src/stories/mantine/primitives/HeaderView.stories.tsx`, `src/stories/mantine/primitives/HeaderActions.stories.tsx`:
  R2
- `messages/*.json`: only the R2 key removal, if it applies
- `scripts/surface-census-baseline.json`: **only** removal of rows that `check:surface-census:changed` reports as
  stale because an F4 edit made it re-census their parent (Revision 1, §16.3). No row may be added or re-worded.
- `docs/sessions/2026-09-2?-task878-*.md` and `docs/sessions/evidence/task878/**`
- `docs/backlog.md`: the 878 state cell only

## 8. Out of scope

- **879:** every `*.module.css`, every `className`, the `.site-header`/`.container-wide` globals, and the
  `notification-chrome.css` offset.
- The containers `Header.tsx` and `NotificationBell.tsx`.
- Any new Story file, export or title.
- `scripts/mantine-migration-scope.json`, `scripts/rendered-scope-baseline.json`, and any **addition** to
  `scripts/surface-census-baseline.json`. No node changes enrolment: all 9 files are already `manifest:yes story:yes`,
  or container-exempt. Stale-row removal is in scope (§7, §16.3).
- Behaviour: the popover, unread logic, the auth flows and the Turnstile token all stay unchanged.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Header bell on the site | bordered `default` `ActionIcon` + red unread `Indicator` | borderless `subtle` `ActionIcon` + the same `Indicator` |
| `HeaderView` / `HeaderActions` Stories, signed in | hand-made subtle bell, no Indicator, no popover | the real `NotificationBellView`: subtle, with an Indicator, and the popover opens on click |
| Muted helper text in the header tree | `var(--muted-foreground)` by style or prop | `c="dimmed"` |
| Raw `lh`, `fz={10}` | literals | theme line heights / `fz="micro"` |
| Header bar height | 97 / 65 px | unchanged |

## 10. Implementation requirements

### 10.1 I0

1. Record the platform (`win32`), then save the dirty-tree snapshot and the hash of every modified path:
   `git --no-optional-locks status --porcelain`, plus `git hash-object` of every ` M` path, go to
   `01-status-before.txt`.
2. Confirm that **875 has landed**: `CaptchaWidget.tsx` contains `language` inside `options`. If it has not landed,
   return `BLOCKED — 875 FIRST`.
3. Re-run the F4 count → `02-style-sites.txt`, plus the Header census → `02b-census-header.txt`. If the per-file
   count differs from F4, record the new count and use it; line drift is expected after 875. If a file has **more**
   sites, all of them are in scope.
4. Capture header heights **before** any edit (§10.4) → `03-heights-before.txt`.

### 10.2 GR receipts before the related write

- **GR-0:** one receipt per changed file. Queries: `dimmed`, `lineHeights`, `fontSizes.micro`, `Flex`, `Stack`,
  `miw`, `mah`, `ScrollArea`, plus the status colour role. Decision: `REUSE`. `new hardcoded visual values: NONE`.
- **GR-3a:**
  - `HeaderView × signed-in bell` → `EXTEND Mantine/Primitives/HeaderView`, using the real child in the existing
    exports;
  - `HeaderActions × signed-in bell` → `EXTEND Mantine/Primitives/HeaderActions`.
- **GR-3:** `GR-3 STORY PROVEN — NotificationBellView ← src/stories/mantine/primitives/NotificationBellView.stories.tsx` (own Story, unchanged). The header Stories are **composition** proof only (GR-3).
- **GR-1, at the end:** `GR-1 CENSUS COMPLETE — 21 nodes; tier1 0 migrated in this task (all edited nodes already enrolled+story) + 2 container-exempt (Header, NotificationBell — D81-2); tier2 0 imports removed; tier3 0.`

### 10.3 Per-site ledger (R3)

Record it as the file `04-style-ledger.md`, one row per F4 site plus every raw prop from F4.

| File:line (after 875) | Before | Disposition | After | Reason (MECHANISM-KEPT only) |
|---|---|---|---|---|

Rules:
- A MECHANISM-KEPT row may contain only non-visual properties: `overflowWrap`, `whiteSpace`, `cursor`, `flexShrink`,
  `overflow`, `minWidth:0`/`minHeight:0` where no `miw`/`mih` fits, a `transition` built from `--motion-*` tokens,
  and `width` on the third-party `Turnstile`.
- Before using `style` for a layout mechanic, prefer the Mantine layout component or style prop that expresses it:
  `Stack`/`Group`/`Flex` for direction, `flex`, `miw`, `mih`, `mah`, `w`, and `ScrollArea` for a scrolling region.
- A **STOP** row ends the task as `BLOCKED — CANONICAL STYLE DECISION REQUIRED`, naming the site and the missing
  token.

### 10.4 Header height measurement (R5)

Use a Playwright script, the house pattern for measured evidence: `scripts/*probe*.mjs`. Store the script **under
`docs/sessions/evidence/task878/`**, not under `scripts/`.

It measures `header.site-header`'s `getBoundingClientRect().height` on the `Mantine/Primitives/HeaderView` →
`Default` Story iframe (`iframe.html?id=mantine-primitives-headerview--default&globals=locale:<l>`) at 320, 389, 390
and 1440 px, for `en` and `uk`, before (`03-heights-before.txt`) and after (`30-heights-after.txt`). Expected:
97/97/65/65 in both runs.

Run it against a `build-storybook` output served locally, and record the exact command in the session log.

### 10.5 Rules

- No new `className`, CSS rule, module, token, `theme.other` key or Story.
- UTF-8 without BOM. Use the Edit tool or Node `fs`.
- **Do not re-order or re-structure JSX** beyond what a disposition requires.

## 11. Positive and negative flows

**Positive.** A signed-in user sees a borderless bell in the header, with a red count when unread notifications exist.
Clicking it opens the same panel as today. The Storybook `HeaderView` shows that same bell.

| Branch | Applicable | Source | Expected | Evidence |
|---|---:|---|---|---|
| 0 unread | Yes | `NotificationBellView:39` | Indicator hidden | `NotificationBellView` Story (unchanged); O81-8 |
| >99 unread | Yes | `:35` | `99+` | existing Story state |
| Mobile popover (bottom sheet <640) | Yes | `MantinePopover` | unchanged | O81-8 at 320 |
| Guest header | Yes | `Header.tsx:78` | no bell | `HeaderView` `Default` guest instance |
| Header height regression | Yes | F7 | 97/65 unchanged | §10.4 |
| Auth / captcha / phone behaviour | No — only visual props change | F4 | — | `test:auth` regression |

## 12. Acceptance criteria

- **AC1 [R1]** Given the diff of `NotificationBellView.tsx`, when read, then the trigger's `variant` is `"subtle"`.
  Any other change in the file comes from R3 (the `:57` site).
- **AC2 [R2]** Given both Story files, when read, then:
  - each imports `NotificationBellView` and passes it with fixture notifications and `unreadCount` > 0;
  - neither contains a bell stand-in;
  - their export names are unchanged;
  - `check:story-coverage`, `check:i18n` and `build-storybook` exit 0.
- **AC3 [R3, R4]** Given `04-style-ledger.md` and the diff, when compared, then:
  - every F4 site has a row;
  - no MAPPED or remaining site carries a colour, px, font-size, font-weight or line-height literal;
  - every MECHANISM-KEPT row lists only §10.3's allowed properties;
  - there is no STOP row.
- **AC4 [R3]** Given the post-change count, when compared with I0, then the remaining `style={` sites equal the
  number of MECHANISM-KEPT rows.
- **AC5 [R5]** Given `03-heights-before.txt` and `30-heights-after.txt`, when read, then both show 97/97/65/65 at
  320/389/390/1440 for `en` and `uk`.
- **AC6 [Objective] — owner, before approval (O81-8):** the §13.3 matrix.
- **AC7 [all]** Given the §13.2 block, when run, then:
  - `typecheck`, `lint`, `test:auth`, `check:rendered-scope` (and `:verify`), `check:surface-census:changed --base`
    (and `:verify`), `check:file-integrity`, `check:mojibake` and `npm run build` exit 0;
  - `scripts/rendered-scope-baseline.json` has no diff, and `scripts/surface-census-baseline.json`'s diff contains
    only removed rows, each one named as stale by the gate's own first run (Revision 1, §16.3);
  - the final status lists no path outside §7 beyond those in `01-status-before.txt`.
- **AC8 [R3, R4] — Revision 1.** Given `32b-menu-label-fz-after.txt`, when read, then in
  `Mantine/Primitives/UserMenu` → `Default` (admin fixture, "Dashboard" item) and `Mantine/Primitives/LocaleSwitcher`
  → `Default` (the current-locale item), at 1440 and 390, the emphasised label's computed `font-size` and
  `line-height` equal those of its sibling items' labels in the same open menu, and its `font-weight` is 500
  (UserMenu) / 600 (LocaleSwitcher). `32a-menu-label-fz-before.txt`, run against the reviewed build before the fix,
  shows the same probe reporting the mismatch.

`GR-4 AC AUDIT — 8 criteria (AC8 and AC7's baseline clause amended in Revision 1 — the original "baseline diff is empty" was an absolute a correct implementation violated); each states an observable property; absolutes: AC3's "no … literal" is the GR-0 rule itself, scoped to the F4 sites and checked by the ledger, not a repo-wide absolute; AC5 is the pre-existing measured invariant (Task 684 D3).`

## 13. QA profile and verification plan

**Q3:** header/navigation chrome, 9 files and two composition Stories. It needs the owner matrix and the Q1 gates.
There is no critical-flow row change, and `test:auth` is the regression guard for the auth sheet and captcha.

### 13.1 Re-entry

From scratch, after 875. Evidence root: `docs/sessions/evidence/task878/`.

### 13.2 Gate block (executor, Windows PowerShell, project root, after every §7 write)

```powershell
$ev = "docs\sessions\evidence\task878"
$base = git --no-optional-locks rev-parse HEAD
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\12-test-auth.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\15-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/components/layout/Header.tsx *>&1 | Tee-Object "$ev\16-census-header.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\17-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\18-rendered-scope-verify.txt"
node.exe scripts\check-surface-census-changed.mjs --base $base *>&1 | Tee-Object "$ev\19-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\20-census-changed-verify.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\21-i18n.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\24-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\27-build.txt"
git --no-optional-locks diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json *>&1 | Tee-Object "$ev\28a-baseline-diff.txt"
git --no-optional-locks hash-object src/modules/notifications/components/NotificationBellView.tsx src/modules/notifications/components/NotificationCenter.tsx src/modules/notifications/components/NotificationItem.tsx src/modules/auth/components/AuthSheet.tsx src/components/layout/UserMenu.tsx src/components/shared/LocaleSwitcher.tsx src/components/shared/LocationCombobox.tsx src/components/shared/PhoneField.tsx src/components/layout/MobileNavDrawer.tsx src/components/auth/CaptchaWidget.tsx src/stories/mantine/primitives/HeaderView.stories.tsx src/stories/mantine/primitives/HeaderActions.stories.tsx *>&1 | Tee-Object "$ev\28-hash-object.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
```

After each command, append `"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>`. Then run §10.4 →
`30-heights-after.txt`.

Expected results:
- `10` prints `win32`.
- `12`–`15` exit 0.
- `16` exits 1 with exactly the two D81-2 FAIL lines (`Header`, `NotificationBell`).
- `17`–`27` exit 0.
- `28a` is empty.
- `30` matches `03`.

### 13.3 Owner steps

1. **O81-8 — `OWNER VISUAL QA REQUIRED`, before approval**, toolbar locales `sq`, `en`, `uk`, `it`:

   | Story | Export | Viewports | Tuples | Look at |
   |---|---|---|---|---|
   | `Mantine/Primitives/HeaderView` | `Default` | 320, 1440 | 8 | the signed-in bell: subtle, red count |
   | `Mantine/Primitives/HeaderView` | `SigningOut` | 320, 1440 | 8 | same bell, loader on the controls |
   | `Mantine/Primitives/HeaderActions` | its existing exports | 320, 1440 | 8 per export | bell next to the heart |
   | `Mantine/Primitives/NotificationBellView` | its existing exports | 390, 1440 | 8 per export | open the panel: item text line heights, muted texts |
   | `Patterns/Mantine/AuthSheet` | `Login`, `Register`, `RegisterAgent`, `ForgotPassword` | 390 | 4 per export | muted helper texts, the company-logo hint at 10px (`RegisterAgent`), the "or" separator row |
   | `Mantine/Primitives/UserMenu` *(Revision 1)* | `Default` | 390, 1440 | 8 | the admin "Dashboard" item is the same size as its siblings, only bolder |
   | `Mantine/Primitives/LocaleSwitcher` *(Revision 1)* | `Default` | 390, 1440 | 8 | the current-language item is the same size as the others, only bolder |
   | `Mantine/Primitives/MobileNavDrawer` *(Revision 1)* | its existing exports | 390 | 4 per export | the signed-in user's name line (raw `lh` removed) |

   Record accepted or returned with a concrete defect.

   **Stated limitation.** Two changed AuthSheet sites render only in internal success states that no Story can reach:
   - `ForgotPasswordView` success (`:225-227`);
   - `RegisterView` success (`:656-657`).

   Both are set by `useState` after a server action. No Story is added for them, because that would be a probe, not a
   production state (create-task "permanent Storybook story creation gate"). They are covered by step 2 below.
2. **After deploy, on lero.al:**
   - sign in, and check that the header bell is borderless like the heart next to it;
   - request a password reset for any address, and look at the success screen (icon and muted text);
   - the register success screen is covered by O81-7's real registration, if that is the path taken there.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

Report:
- changed files with their hashes;
- R1–R5 and AC1–AC5, AC7 (AC6 = `MISSING EVIDENCE`, owed by the owner);
- every command with its exit code;
- the ledger path and its row count by disposition;
- the heights before and after;
- the GR receipts;
- deviations.

Update the 878 backlog state cell. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Root cause of the owner's report | measured (F1): the production bell is canonical Mantine but `variant="default"`; the Stories used a `subtle` stand-in, so the divergence was invisible to every review |
| Slot/demo mismatch closed | R2 renders the real View in both composition Stories; the View is presentational (no hook mocking) |
| GR-1 | Header census, 21 nodes; no enrolment change; 879 carries the CSS modules (D81-7) |
| Two-armed control | this task adds no gate. Its proofs are the ledger (per-site, reviewable against the diff), the height measurement before and after, and the owner matrix. The Story change is itself the control that was missing. |
| Sequencing | after 875 (shared `CaptchaWidget.tsx`); the I0 step 2 check enforces it |
| Owner decision quoted | D81-7 verbatim |

## 16. Revision 1 — review 1, 2026-09-24: `NEEDS REVISION`

Re-entry mode: **remediation**. Everything not named here was verified in review 1 and must not be redone. That
covers R1, R2, the 26 other ledger rows, AC4's 28 → 13 count, AC5's heights, the Header census, and the gate block.

**Preserve these artifacts. Do not re-run or overwrite them:** `01-status-before.txt`, `02-style-sites.txt`,
`02b-census-header.txt`, `03-heights-before.txt`.

### 16.1 Finding R1-F1 (P2): two emphasised menu labels render larger than their siblings. Requirements: R3, R4, AC3, AC8.

- **Where.** `src/components/layout/UserMenu.tsx:28` `<Text span fw={500}>` and
  `src/components/shared/LocaleSwitcher.tsx:45` `<Text span fw={600}>`.
- **What happens now.** Mantine `Text` without `inherit` sets
  `font-size: var(--text-fz, var(--mantine-font-size-md))` and the matching `md` line height. Source:
  `node_modules/@mantine/core/styles/Text.css:4-5`. The theme's `Menu.item` is 14px (`theme.ts` `Menu.styles.item`).
- **Measured by the reviewer** against the executor's `storybook-static` build (win32, Node v22.22.3):

  | Story | Emphasised label | Sibling labels | Row height |
  |---|---|---|---|
  | `usermenu--default` @1440, "Dashboard" | 16px, line height 24px, weight 500 | 14px | 44px vs 41px |
  | `localeswitcher--default` @1440, "EN English" | 16px, line height 24px, weight 600 | 14px | 44px vs 41px |

  The removed `<span style={{ fontWeight }}>` inherited the item's 14px, so this is a regression. Both GR-0
  receipts cite `FavoritesTypeFilter.tsx` and `SaveToCollectionButton.tsx` as precedent. Both of those use
  `<Text span … inherit>` (`FavoritesTypeFilter.tsx:40,48`, `SaveToCollectionButton.tsx:164`). The receipt and the
  code contradict each other.
- **Fix.** Add the `inherit` prop to both elements and keep `fw`:
  - `<Text span inherit fw={500}>` in `UserMenu.tsx`;
  - `<Text span inherit fw={600}>` in `LocaleSwitcher.tsx`.

  `fw` is an inline style prop, so it wins over the `:where([data-inherit])` `font-weight: inherit` rule. AC8
  measures the result. Correct both GR-0 receipts and both ledger rows in `04-style-ledger.md` so that they state
  `inherit`.
- **Two-armed proof (AC8).** Write `docs/sessions/evidence/task878/probe-menu-label-fz.mjs`, reusing the static-server
  shape of `probe-header-heights.mjs` on its own port. For each Story at 1440 and 390, open the menu:
  - `UserMenu` `Default`: the Story's `play` opens it;
  - `LocaleSwitcher` `Default`: click the trigger, finding a selector that works at both widths. Below 640 the menu
    is a bottom sheet.

  Print, for every item, the label's computed `font-size`, `line-height` and `font-weight`, and the nested
  `.mantine-Text-root` span's values when there is one. The probe exits non-zero when an emphasised span's
  font-size or line-height differs from its siblings' labels.
  1. **Before the fix**, against the current build: `32a-menu-label-fz-before.txt` must exit **non-zero** and show 16px.
  2. Make the fix, run `npm.cmd run build-storybook`, and run the probe again: `32b-menu-label-fz-after.txt` must
     exit **0**.

### 16.2 Finding R1-F2 (P3): a stale comment. Requirement: R4.

`src/modules/notifications/components/NotificationCenter.tsx:58-60` still says
`lh=1.625 (leading-relaxed) matches this <p>'s …`. The `lh` it describes was removed on the next line. Replace it
with a one-line comment in the style of the sibling `NotificationItem.tsx` comments: the raw `lh` was removed in
Task 878 and the theme `sm` line height applies (D81-7).

### 16.3 Accepted deviation: the stale census-baseline rows

The executor's 4-row removal from `scripts/surface-census-baseline.json` is **accepted**. The reviewer re-verified it:
- `LocaleSwitcher.tsx` and `PhoneField.tsx` are `manifest:yes story:yes` (`mantine-migration-scope.json:98-99`);
- a live census of `src/app/admin/layout.tsx` and of `AdminUserCreate.tsx` reports neither as a FAIL;
- the diff removes rows and adds none.

The original AC7 clause "the census baseline diff is empty" was the orchestrator's GR-4 defect, and it is amended
above. Keep the removal as it is. Do not re-run `--update-baseline` unless the gate's first run in §16.4 names a
further stale row. In that case record the gate output and remove only that row.

### 16.4 Re-validation

After §16.1 and §16.2:
1. Re-run the whole §13.2 block, overwriting `10`–`29`. The final hashes must describe the shipped files.
2. Re-run §10.4 into `30-heights-after.txt`. Expected: still 97/97/65/65.
3. Re-run `31-style-sites-after.txt`. Expected: 13, unchanged.

Append a `## Revision 1` section to the existing session log, `docs/sessions/2026-09-24-task878-implemented.md`.
It must include AC8's before/after, the corrected GR-0 receipts, and an updated Files Changed table. Set 878's
backlog state cell back to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW (revision 1)`.

AC6 / O81-8 stays owner-owed. The owner matrix in §13.3 gained UserMenu, LocaleSwitcher and MobileNavDrawer rows in
this revision.
