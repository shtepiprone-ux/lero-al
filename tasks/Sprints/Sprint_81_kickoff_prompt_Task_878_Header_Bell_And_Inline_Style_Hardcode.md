# Task 878 — the header renders the real bell everywhere it is proven, and the header tree loses its inline-style hardcode

Sprint 81 · **P2** · QA profile **Q3** (navigation/header chrome) · depends on **875** (both edit `CaptchaWidget.tsx`) ·
owner decision **D81-7** · owner action **O81-8** · **Status: 📝 KICKOFF FILED 2026-09-24, READY FOR SONNET after 875 lands**

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
- `docs/sessions/2026-09-2?-task878-*.md` and `docs/sessions/evidence/task878/**`
- `docs/backlog.md`: the 878 state cell only

## 8. Out of scope

- **879:** every `*.module.css`, every `className`, the `.site-header`/`.container-wide` globals, and the
  `notification-chrome.css` offset.
- The containers `Header.tsx` and `NotificationBell.tsx`.
- Any new Story file, export or title.
- `scripts/mantine-migration-scope.json` and both census baselines. No node changes enrolment: all 9 files are
  already `manifest:yes story:yes`, or container-exempt.
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
  - the census baseline diff is empty;
  - the final status lists no path outside §7 beyond those in `01-status-before.txt`.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: AC3's "no … literal" is the GR-0 rule itself, scoped to the F4 sites and checked by the ledger, not a repo-wide absolute; AC5 is the pre-existing measured invariant (Task 684 D3).`

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
