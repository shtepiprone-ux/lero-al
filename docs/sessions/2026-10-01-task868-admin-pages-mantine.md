# Task 868 — `/admin/pages` on canonical Mantine + `sq_body_required` shown on the Albanian body (executor session)

Executor: Sonnet 5.5 · 2026-10-01 · QA profile Q3 · Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**
(never self-approved; owner matrix **O78-7** is owed). Evidence: `docs/sessions/evidence/task868/`.

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## 1. Requirement ledger

| ID | Done | Where |
|---|---|---|
| R1 | yes | `PageEditorDialog` (in `AdminPagesManager.tsx`) maps `sq_body_required` → `activeTab='sq'`, `sqBodyError`; `PageEditorDialogView` shows `admin.pages.sq_body_required` as the `error` of the `sq` body `Textarea`; cleared on the next `sq` body edit; no toast. Key added in 4 locales. |
| R2 | yes | `AdminPagesManager` renders only `AdminPagesView`; props `{ pages, adminLocale }` unchanged; 0 `className`, 0 `ui/*`. |
| R3 | yes (see D2) | `AdminPagesView.tsx` |
| R4 | yes (see D1) | `PageEditorDialog` container; helpers moved unchanged to `adminPagesContent.ts` |
| R5 | yes (see D3, D4) | `PageEditorDialogView.tsx` |
| R6 | yes | `page.tsx` `Box p={{ base:'xl', lg:'2xl' }} maw={layout.adminPageNarrowMaxWidth} mx="auto"`; `theme.ts:278` type line, `:837` value `'56rem'` |
| R7 | yes (see D5) | two Story files, 5 + 6 exports; both Views enrolled in `scripts/mantine-migration-scope.json` |
| R8 | yes | `admin.footer.link_url_invalid_internal` reworded in 4 locales |
| R9 | yes (see D1) | census after: no tier-2 node, no `AdminInput`; baseline: 8 keys removed, 0 added |
| R10 | yes | `AdminPagesManager.smoke.test.tsx` T1–T6; P1–P3 |

## 2. I0

- `04-platform.txt`: `win32 v22.22.3 C:\Claude_Code_Projects\lero-al`. `01-status-before.txt`: clean tree.
- **877 gate (quotes):** `docs/backlog-archive.md:18` "Task 877 (Sprint 78) — ✅ APPROVED, review 7"; `MantineDataTableToCards.tsx:225` `visibleFrom?: MantineBreakpoint`;
  `theme.ts:832` `adminPageMaxWidth: '64rem'`; `AdminPageHeader` is a manifest+story node over `MantineDashboardHeader` (census `02`).
- Census before (`02`): 15 nodes (§3.2 listed 14; the extra node `MantineDashboardHeader.tsx` is tier 1, manifest yes, story yes, reached through 877's `AdminPageHeader` — nothing unmigrated, no `BLOCKED — CLAUSE 16d`).
- Baseline (`03`): `pages-and-footer-validation.smoke.test.ts` 21/21, exit 0.

## 3. GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/pages list, editor dialog, delete confirm, page wrapper; semantic queries: data table/cards, modal, confirm, tabs, text input, textarea, alert, switch, badge, action icon, page max width; inspected candidates: patterns/MantineDataTableToCards.tsx, patterns/MantineModal.tsx, AdminExchangeProvidersView + ProviderFormDialogView (874) and their Stories, AdminCurrencyTabs (877), MantineDashboardPeriodControl (ScrollArea precedent), theme.other.layout; decision: COMPOSE (+ EXTEND theme.other.layout by one key); selected canonical owner: those patterns and Mantine primitives; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts; new hardcoded visual values: NONE; rationale: every artifact has a canonical owner; only the legacy 56rem width needed a token.`

`GR-3a STORY PREFLIGHT — AdminPagesView / PageEditorDialogView × the R7 states; canonical candidates: NONE (grep over src/.storybook/scripts: no Story imported AdminPagesManager or either View); decision: CREATE; target: Patterns/Mantine/AdminPagesView, Patterns/Mantine/PageEditorDialogView.`

`GR-1 CENSUS COMPLETE — 11 nodes after (08): tier1 2 migrated+enrolled+story (AdminPagesView, PageEditorDialogView) + container-exempt AdminPagesManager (holds PageEditorDialog) + route root page.tsx baselined; RelativeTime, MantineDataTableToCards, MantineModal, MantineTooltip, responsiveBottomSheet, AdminPageHeader, MantineDashboardHeader already migrated; AdminInput import removed; tier2 7 imports removed; tier3 0.`

`GR-3b STORY RESPONSIVE CHECK` (all 11 Stories, `30-measurements.json`, real Chromium on `storybook-static`, 320/390/768/1024/1440, plus `uk`/`sq` at 390 and 1440): no document overflow in any run; no console error; fixed-width containers: NONE; style objects: NONE (the two monospace inputs use `styles.input` with `theme.fontFamilyMonospace` — see D4); viewport pins: NONE. View: the content root equals its parent minus the gutter (288/320 · 358/390 · 720/768 · 960/1024 · 1376/1440). Table from 640 px; `Slug` column from 768 px, `Updated` from 1024 px (headers measured). Dialog: sheet 320/390 wide, bottom-anchored (0 px), centred 440 px (confirm) / 620 px (editor) from 640 px.

`GR-3c TYPE RESPONSIVE CHECK` (same runs): no heading in either View; modal title 16 px at every width; body, label and input text 14 px (labels also 16 px at one sample: the Switch/Input wrapper label); list text 12 / 14 px. No size ≥ 24 px anywhere; no rich text.

`GR-3d STORY GUTTER CHECK` (`31-gutter.txt`; the five `AdminPagesView` Stories wrap in `StoryPageGutter`, the page content has no gutter of its own): top/bottom 24 at every width; left/right 16 @320, 16 @390, 32 @1024, 32 @1440 — equal to the profile on all four sides, all five Stories. The six `PageEditorDialogView` Stories are overlay-only (`MantineModal`): nothing to add.

## 4. Deviations and findings (for Opus)

- **D1 — `PageEditorDialog.tsx` is not a separate file.** R4/§7 name a new file `src/components/admin/PageEditorDialog.tsx`, but R9/AC8 forbid adding a baseline key, and the census cannot recognise the split: with the separate file `check:surface-census:changed` reported `Blocks new (not in baseline): 1 … PageEditorDialog.tsx [tier1-unenrolled-or-unstoried]` (this run, before the move). I kept the container in `AdminPagesManager.tsx`, exactly as 874 kept `ProviderFormDialog` in `AdminExchangeProvidersManager.tsx`; the baseline diff is 8 removals, 0 additions (`20`). Reverting is one file move plus one new baseline key; that is the owner's call. P1 targets the container's branch in its final location.
- **D2 — preview link stays enabled while migration is pending.** R3 says "all are disabled while migration is pending"; §3.3/§9 say the three controls "new", edit and delete (today's behaviour — the preview anchor was never disabled). I kept today's behaviour.
- **D3 — no `withAsterisk` on the `sq` title.** The theme suppresses Mantine's asterisk globally (`theme.ts` `InputWrapper.styles.required: { display:'none' }`, owner decision 2026-06-26), so the prop would render nothing. The `sq` title is still required for saving (button disabled).
- **D4 — monospace goes through `styles.input`, not `ff`.** Mantine routes style props (`ff`) to the input wrapper, while the input reads `--input-font-family`, so `ff="monospace"` has no effect on the text. Measured: the `Textarea` and slug input render `ui-monospace` through `styles={{ input: { fontFamily: theme.fontFamilyMonospace } }}` (theme token, no raw value).
- **D5 — Story export `SqBodyRequired` is named `PublishBodyRequired`.** `check:stories` Check 3 (`prebuild-storybook`) rejects an export segment equal to a locale code (`Sq`); an allowlist entry would be a scanner allowlist, so I renamed the export. Story ID `patterns-mantine-pageeditordialogview--publish-body-required`.
- **D6 — the locale tab strip scrolls sideways.** Four tabs did not fit a 320 px sheet nor `uk` at 390 px (measured: tab list wider than the dialog). The strip is wrapped in `ScrollArea type="auto" scrollbars="x" scrollbarSize={0}`, the pattern `MantineDashboardPeriodControl` uses; after the change every run fits, and the strip swipes at 320 px and `uk`@390. Owner matrix should look at it.
- **D7 — row actions are 22 px on the desktop table** (`ActionIcon size="sm"`, as the 874 provider table), 44 px on the cards (`theme.other.touchTarget`). The legacy buttons were 28 px.
- **D8 — `check:i18n-hardcode` (`22b`) exits 1 for files this task does not touch:** `AdminHeader.tsx:53` and `AdminSidebar.tsx:93` (`>Admin<`). Both lines are identical in `HEAD` and neither file is in the diff (`22b-preexisting-proof.txt`). My files add no finding.
- **D9 — `docs/component-catalog.md` not edited:** `governance:components` (`--check`) exits 0 without new rows.
- The Story fixture titles come from `nav.about/privacy/terms` (`useTranslations('nav')`), because lint rule H rejects raw capitalised `title:` literals; page bodies are `<p>…</p>` placeholders.

## 5. Plants (`05`–`07`; hashes equal before/after restore)

| Plant | File | Hash before = restored | Planted | Result |
|---|---|---|---|---|
| P1 | `src/components/admin/AdminPagesManager.tsx` (container branch removed) | `7759257541d3ceba3523a9680b6d87a5d4d08d3e` | `b3628870af09c08cc55aa8d8c3b5258805ffd00f` | T1 fails (1 failed / 5 passed); passes after restore |
| P2 | `src/components/admin/AdminPagesManager.tsx` (delete without confirm) | `7759257541d3ceba3523a9680b6d87a5d4d08d3e` | `53490698fd652c0e1b6546d4f9374392d4b0a351` | T4 fails; passes after restore |
| P3 | `src/components/admin/AdminPagesView.tsx` (legacy `ui/badge` re-added) | `a0c687814064d1557a160d530c9d6fc939c13876` | `947493d154b21e2f0c738c227f258117dc84050f` | census exits 1 naming `src/components/ui/badge.tsx [tier2-legacy-primitive]` |

(An earlier P1 and P2 run against the first layout, with the container in its own file, also failed as required; the final-tree runs above replace them.)

## 6. Commands and exit codes (final tree)

| # | Command | Exit | Evidence |
|---|---|---|---|
| 04 | platform | 0 | `04-platform.txt` |
| 08 | `check-surface-census.mjs --surface src/app/admin/pages/page.tsx` | **1, expected** (route root + container baselined; no tier-2, no `AdminInput`) | `08` |
| 09 | vitest T1–T6 + `pages-and-footer-validation.smoke.test.ts` | 0 (6 + 21 tests) | `09` |
| 10 | `typecheck` | 0 | `10` |
| 11 | `lint` | 0 (0 errors, 130 warnings, none in this task's files) | `11` |
| 12 | `check:story-coverage` | 0 | `12` |
| 13 | `check:rendered-scope` | 0 | `13` |
| 14 | `check:surface-census:changed -- --base HEAD` | 0 | `14` |
| 15 / 15b | `check:design-tokens` / `check:enrolled-tailwind` | 0 / 0 | `15`, `15b` |
| 22a / 22b / 22c | `check:i18n` / `check:i18n-hardcode` / `check:i18n-dynamic` | 0 / **1 (D8, pre-existing)** / 0 | `22a`–`22c`, `22b-preexisting-proof.txt` |
| 16 / 17 | `check:file-integrity` / `check:mojibake` | 0 / 0 | `16`, `17` |
| 24 | `governance:components` | 0 | `24-governance-components.txt` |
| 18 | `build-storybook` (includes `check:stories`) | 0 | `18` |
| 19 | `npm run build` | 0 | `19-build.txt` |
| 20 / 21 / 23 | baseline diff / status / hashes | — | `20`, `21`, `23` |

Update-baseline: `npm run check:surface-census:changed:update-baseline -- --base HEAD`, exit 0 (`08a`). The §13.2 block gives no `--base`; the gate requires one, `HEAD` is the tree's base.
Measurements: `probe868.mjs` → `30-measurements.json`/`.txt`; `probe868-gutter.mjs` → `31-gutter.txt`.
`check:locale-leak` was not run (not in §13.2).

## 7. i18n diff (R1 and R8 keys only)

`admin.pages.sq_body_required` added, and `admin.footer.link_url_invalid_internal` reworded, in `messages/{en,sq,uk,it}.json` — texts exactly as R1 and R8. No other key changed (`git diff` of the four files shows two additions/changes each).

## 8. Files changed

| Path | Change | `git hash-object` |
|---|---|---|
| `src/components/admin/adminPagesContent.ts` | new — helpers moved unchanged | `bfac77bcba74f8ea3d21b6050ac3cc44192fc19d` |
| `src/components/admin/AdminPagesView.tsx` | new — View | `a0c687814064d1557a160d530c9d6fc939c13876` |
| `src/components/admin/PageEditorDialogView.tsx` | new — View | `d9710ce7376806a4f253ad239b2091ae36c75ecf` |
| `src/components/admin/AdminPagesManager.tsx` | rewritten — containers `AdminPagesManager` + `PageEditorDialog` | `7759257541d3ceba3523a9680b6d87a5d4d08d3e` |
| `src/app/admin/pages/page.tsx` | wrapper → Mantine `Box` + token | `d9089abee3aa3d4efa451f4948d0522165587ed8` |
| `src/design-system/mantine/theme.ts` | `adminPageNarrowMaxWidth` (type + value) | `2100ee45277691daefe1c0daa116584733e1d5d1` |
| `src/stories/patterns/mantine/AdminPagesView.stories.tsx` | new — 5 Stories | `4a9b574cc1dcac885ac447aee6a8d2fd98c06d59` |
| `src/stories/patterns/mantine/PageEditorDialogView.stories.tsx` | new — 6 Stories | `1f928754de840801a107ec8c5e9124874c2ce8dd` |
| `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx` | new — T1–T6 | `6bcc9098aa45ad1669b7fe9acb7d91b5e927bc87` |
| `messages/{en,sq,uk,it}.json` | R1 + R8 | `e4a23029…` · `f67c75b1…` · `22441e8a…` · `5224d3ae…` |
| `scripts/mantine-migration-scope.json` | two entries | `eb60f8c6efcf24d8fd408b782d1a6315c79ea936` |
| `scripts/surface-census-baseline.json` | 8 `admin/pages` keys removed, 0 added | `56422a9242dbd1d9c685e1e02f25cff714dc5e8f` |
| `docs/backlog.md` | 868 registry cell only | — |
| `docs/sessions/2026-10-01-task868-admin-pages-mantine.md`, `docs/sessions/evidence/task868/*` | this log and evidence | — |

`21-status-after.txt` shows no path outside §7 (the new `adminPagesContent.ts` and the Story/test files are in §7 items 3–5; `PageEditorDialog.tsx` was created and removed in-session, see D1).

## 9. Owed

**`OWNER VISUAL QA REQUIRED` — O78-7** (§13.3, 48 tuples) is not done. Please include in it: the `Check` glyph on filled locale tabs (assumption 2), the swiping tab strip at 320 px / `uk`@390 (D6), the 22 px desktop row actions (D7), and, after the deploy, a real publish of a page with an empty Albanian body as admin.

---

# 10. Revision 1 (kickoff §17) — executor session, 2026-10-01

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved; owner matrix **O78-7** (§17.9) is owed again.
Evidence: `docs/sessions/evidence/task868/r1-*` (§§1–9 above and `01`–`31` are untouched; P1–P3 not re-run, T1–T6 re-run).
`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## 10.1 Requirement ledger

| ID | Done | Where |
|---|---|---|
| R11 | yes (see E1) | `MantineDataTableToCards.tsx`: state-3 `Group justify="flex-start"`; the comments that said "badge right / top-right" for state 3 are updated; no doc under `docs/` describes state 3 (grep), so none changed |
| R12 | yes | `patterns/MantineRichTextEditor.tsx`, enrolled; Story `Patterns/Mantine/RichTextEditor` (`Default`, `WithContent`, `WithError`, `ImageUploading`) |
| R13 | yes (see E2, E3) | toolbar of D868-3; `richtext/columnsExtension.ts`; image `MantineModal`; 46 keys `admin.pages.editor.*` × 4 locales |
| R14 | yes | `PageEditorDialogView` uses the editor per tab, `size="xl"`, export `RichContent`; the `sq` error clears on the next editor change |
| R15 | yes | `src/app/api/upload-cms-image/route.ts` + test T9; the container owns the `fetch` and the toast |
| R16 | yes | `sanitizeCmsHtml.ts`: `div` (data-type / data-cols value lists), Cloudinary-only `img`, `text-align` on p / h2–h4 / li |
| R17 | yes | `typography-chrome.css` (columns grid, scrolling table, fluid image, table cells break at word boundaries); Story `CmsPageView` `RichLayout` |
| R18 | yes (see E4) | `isCmsBodyEmpty.ts`; both guard lines in `actions/index.ts` |
| R19 | yes | `richTextRoundTrip.test.ts` (T10) |
| R20 | yes | `/[locale]/[slug]` First Load JS **362 kB = 362 kB** (`r1-19-build.txt:164` vs `19-build.txt:114`); the editor's CSS is imported in `MantineRootProvider.tsx` and `.storybook/preview.tsx`; `/admin/pages` grew 604 kB → 763 kB (admin only) |
| R21 | yes (see E5) | `r1-03-npm-view.txt`, `r1-04-npm-install.txt` |

## 10.2 Deviations and findings

- **E1 — state 3 was measured on 154 cards in 10 Stories** (`AdminPagesView` × 4, `AgentStatisticsView` × 6), `sq`/`uk` × 320/390: `badge.left − card content-box start` is 0 for all of them (`r1-3x-badge.txt`). For a card with an avatar (24 of the lines) the card start is the avatar's left edge, so the badge sits 52px left of the title zone; I read "the title zone's left edge" as the avatar+title row's start (the owner's words: left in the frame). If the owner wants the badge over the text instead, that is a one-line change. The badge wrapper's `margin` token moved from left to right so the fit math keeps its gap and the badge is not shifted; the measurement reads either margin.
- **E2 — the hit area is 44px at every width**, not only below 640px. Mantine's own 26px size cannot be restored from `sm` without a raw value (a style prop at `sm` overrides its zero-specificity default; measured 17px), so the touch-target token applies at every width. The toolbar is therefore 2 rows at 1440 and 8 rows at 320. Look at it in the matrix.
- **E3 — the table controls are two groups** (3 + 4 controls): one group of seven 44px controls was 308px, wider than a 320px sheet (the document overflowed by 21px until it was split).
- **E4 — `isCmsBodyEmpty` runs on the sanitised HTML**, so a lone `<script>` or an `<img>` from another host counts as empty (the public page would show nothing). R18's list is unchanged: `''`, `<p></p>`, `<p> </p><br>` and `<p>&nbsp;</p>` are empty; `<p>x</p>` and a Cloudinary image are not. The numeric entity is written `&#(?:160|xa0);` because `check:design-tokens` reads `#160` as a colour.
- **E5 — dependencies.** `@mantine/tiptap@8.3.18` (peer `@mantine/core 8.3.18`) and Tiptap `3.31.4` for every `@tiptap/*` package (`react`, `pm`, `core`, `starter-kit`, `extension-link`, `-text-align`, `-table` (it also holds row/cell/header), `-image`, `html`). `@tiptap/core` is a peer of the others and is listed explicitly. `npm ls` shows no `invalid`/`UNMET`. `@tiptap/html` (test only) is a devDependency, and its Node build needs `happy-dom` as a peer: `happy-dom@20.8.9` was already in the tree through vitest and is now a devDependency too (`r1-04b-happy-dom.txt`).
- **E6 — the editor emits `''` only for an empty document.** An image, a table or a columns block counts as content even while empty (an empty columns block would otherwise be swallowed, which the test caught); the server guard still refuses to publish it.
- **E7 — a label for the editable area.** `Input.Wrapper` pointed its `for` at nothing; the label is now a `div` and the contenteditable has `role="textbox"` and `aria-labelledby`.
- **E8 — kept in the schema, not on the toolbar:** h1/h5/h6, inline code, code block and rule, so an existing body that has them is not flattened. T10 lists what the editor renames or drops: `b` → `strong`, `i` → `em`, and `thead` (a header row is written as `th` cells inside `tbody`). The layout fixtures and the CMS fixtures lose no tag.
- **E9 — files outside §17.6:** `src/stories/fixtures/richContent.fixtures.ts` (the per-locale rich fixture shared by three Stories and T10; HTML is built through tag helpers because `check:stories` §14.7 rejects `>text<` on one line), `MantineRichTextEditor.smoke.test.tsx` and `richTextRoundTrip.test.ts` (T7/T11 and T10), and `isCmsBodyEmpty.test.ts` (T8).
- **E10 — the editor's Story imports the pattern by its own path**, because `check:story-coverage` does not count a barrel import. The labels hook `useCmsEditorLabels` lives in `PageEditorDialogView.tsx` and the Story imports it.
- **E11 — the CSS import for `@mantine/tiptap/styles.css` is in `MantineRootProvider.tsx`** as §17.6 says (the core styles are in `layout.tsx`); it ships CSS only, no Tiptap JS.
- **E12 — `check:i18n-hardcode` (`22b`) is still red** on `AdminHeader.tsx:53` and `AdminSidebar.tsx:93` only (task 910); none of this revision's files has a finding.

## 10.3 Plants (all two-armed, hashes equal after restore)

| Plant | File | Hash before = restored | Planted | Result |
|---|---|---|---|---|
| P4 | `src/modules/admin/actions/index.ts` | `cbc5e086e5feab0c8ece3c75f23f400e0ec4b5f6` | `b4513ea923db575cee5b401ad9df0720388f5328` | the 2 new `<p></p>` rows FAIL; 23/23 after restore (`r1-05`) |
| P5 | `src/modules/cms/lib/sanitizeCmsHtml.ts` | `af6b4ca47d57bede562a3f53d9b1cbe7f602c327` | `7d4c27077480b5a08cb7a8469f971c581156cbd1` | 8 T7 "dropped img" rows FAIL; 50/50 after restore (`r1-06`) |
| P6 | `src/app/api/upload-cms-image/route.ts` | `59f5d38e7b0b850fc1ee6753998c7f8de01b3f30` | `1652ffaa4080343f5cf524c9d4a831cdfd97d3b0` | T9 row 1 FAILS; 7/7 after restore (`r1-07`) |
| P7 | `MantineDataTableToCards.tsx` | `5834d9426435a2d486299844acd9b3e2669fdfe2` | `455ed878e7d40186c54e1948f41c259afd482efb` | planted: 154 of 154 state-3 cards outside ±1px (e.g. 165.5px); restored: 0 (`r1-08`) |
| P8 | `typography-chrome.css` | `0e79e7dac0534f07f9b6d0e24f1e6da91b9da411` | `f90b800d8b16f6fceadfe55bc8a085ab895ad2f1` | planted: 0 of 6 rows (1024/1440) side by side; restored: 6 of 6 (`r1-08`) |

Runners: `plant.mjs`, `plant-browser.mjs` (the hash is the blob SHA-1, computed with Node crypto; it equals `git hash-object`).

## 10.4 Probes and receipts (real Chromium on `storybook-static`; `probe868-r1.mjs`)

- AC12 `RichTextEditor` × 4 Stories × `sq`/`uk` × 320/390/768/1440 (`r1-3x-editor.txt`): 30 controls, 0 unnamed, no English name in `sq`/`uk`, every control 44 × 44, no document overflow, 0 console errors; toolbar rows 8 / 6 / 3 / 2. The error text shows on `WithError`; the image dialog is a full-width sheet below 640 and 440px wide from it.
- AC17 `CmsPageView` `RichLayout` × `sq`/`uk`/`en` × 320/390/700/768/1024/1440 (`r1-3x-cms.txt`): columns stack below 640 and sit side by side from it (2 → 332/356, 3 → 213/229); the table scrolls inside its box at 320 and 390; the image is never wider than its column; H2 18 / 18 / 20 / 24 / 24 and H3 16 / 16 / 18 / 20 / 20 at 320 / 390 / 700 / 768 / 1024+ (table in §17.4); title 20 / 20 / 24 / 30 / 30, so no heading exceeds the title; no overflow.
- `PageEditorDialogView` `RichContent` × `sq`/`uk` × 320…1440 (`r1-3x-dialog.txt`): sheet 320/390, modal 691 (768) and 780 (≥1024); 1 columns block, 1 table, 1 image; no overflow.

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-richtexteditor--{default,with-content,with-error,image-uploading}: 320 288/320 · 390 358/390 · 768 720/768 · 1440 1376/1440; patterns-mantine-pageeditordialogview--rich-content: sheet 320/320 · 390/390, modal 691 @768, 780 @1024/1440; patterns-mantine-cmspageview--rich-layout: body 256 · 326 · 620 · 688 · 736 · 736; overflow: none; fixed-width containers: NONE; style objects: only theme tokens (borderColor var(--mantine-color-error), fontFamily theme.fontFamilyMonospace); viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — editor: label 14, content 16, error 12; CMS: h2 18/18/20/24/24, h3 16/16/18/20/20, p 16 at 320/390/700/768/1440; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE (title 20/20/24/30/30).`

`GR-3d STORY GUTTER CHECK — RichTextEditor × 4: StoryPageGutter all; rendered root width 288 @320, 358 @390, 1376 @1440 = viewport minus the profile's 16/16/32 gutters on both sides (the probe's own gap column reads 0 because it measured the wrapper's parent, not the content rect, so the top/bottom 24 are taken from the wrapper's profile, not measured here); PageEditorDialogView × 7: n/a: overlay-only; CmsPageView × RichLayout: own px="md" py, default canvas, as 869's Stories; blast radius (the 10 state-3 Stories): AdminPagesView × 4 → StoryPageGutter all, measured in 31-gutter.txt; AgentStatisticsView × 6 → Stories unchanged, gutter not touched by R11.`

## 10.5 Commands (final tree, exit codes)

| Command | Exit | Evidence |
|---|---|---|
| vitest: manager T1–T6 + T12 (8), actions (23), `src/modules/cms/lib` (65), upload route (7), editor (8), round trip (9) = **120** in 7 files (corrected at revision 2: the 122 / 8 files I first wrote also counted the `src/modules/cms` component test the reviewer's list does not) | 0 | `r1-09` |
| `typecheck` / `lint` (0 errors) | 0 / 0 | `r1-10`, `r1-11` |
| `check:story-coverage` / `check:pattern-enrolment` / `check:rendered-scope` | 0 / 0 / 0 | `r1-12`, `r1-12b`, `r1-13` |
| census (page.tsx) | 1, expected (route root and container baselined; no tier-2) | `r1-08-census-after.txt` |
| `check:surface-census:changed -- --base HEAD` | 0 (0 new blocks, 0 stale) | `r1-14`; baseline diff unchanged, 8 removals (`r1-20`) |
| `check:design-tokens` / `check:enrolled-tailwind` | 0 / 0 | `r1-15`, `r1-15b` |
| `check:i18n` / `-hardcode` / `-dynamic` | 0 (2564 keys × 4) / **1 (E12)** / 0 | `r1-22a`–`c` |
| `check:file-integrity` / `check:mojibake` / `governance:components` | 0 / 0 / 0 | `r1-16`, `r1-17`, `r1-24` |
| `build-storybook` (with `check:stories`) / `npm run build` | 0 / 0 | `r1-18`, `r1-19` |
| `check:locale-leak:mantine-only` | **not completed**: I stopped the full run (351 Stories × 3 locales × 3 viewports, over an hour) at the owner's objection; it is not a pass. In its place, a targeted probe of the 4 `RichTextEditor` Stories in `sq`/`uk`/`it` found no English control name and no console error (`r1-3x-editor*.txt`). The gate has no per-Story filter, so Opus or the owner may run it natively | `r1-25` |

## 10.6 Files changed (`r1-23-hash-object.txt`)

New: `MantineRichTextEditor.tsx`, `richtext/columnsExtension.ts`, `isCmsBodyEmpty.ts`, `upload-cms-image/route.ts`, `richContent.fixtures.ts`, `RichTextEditor.stories.tsx`, and the tests `MantineRichTextEditor.smoke`, `richTextRoundTrip`, `isCmsBodyEmpty`, `upload-cms-image/route`. Changed: `MantineDataTableToCards.tsx`, `patterns/index.ts`, `typography-chrome.css`, `MantineRootProvider.tsx`, `.storybook/preview.tsx`, `sanitizeCmsHtml.ts` (+ test), `actions/index.ts` (+ test rows), `PageEditorDialogView.tsx`, `AdminPagesManager.tsx` (+ test), both Stories and `CmsPageView.stories.tsx`, `messages/*.json` (`admin.pages.editor.*` only), `mantine-migration-scope.json` (one entry), `package.json` and `package-lock.json`, `critical-flow-registry.md` (the 884 row), `backlog.md` (the 868 cell). `plant.mjs`, `plant-browser.mjs` and `probe868-r1.mjs` are evidence.

## 10.7 Owed

**O78-7 (§17.9)**: `AdminPagesView` 20 + `PageEditorDialogView` 28 + `RichTextEditor` 16 + `CmsPageView` `RichLayout` 6 tuples, and the R11 blast-radius cards (`AgentStatisticsView`, `sq`@390). Look at: the 44px toolbar controls (E2, 8 rows at 320), the badge over the avatar (E1), the table scrolling at 320. After the deploy: **O78-7b** (a page with 2 columns, a table and an image, on a phone; then an empty publish) and **O78-7c** (open every live page in the editor and compare with the public page before saving).

---

# 11. Revision 2 (kickoff §18) — executor session, 2026-10-01

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved; O78-7 goes to the owner after review 4.
Evidence: `docs/sessions/evidence/task868/r2-*`. Everything under `01`–`31` and `r1-*` is untouched; P1–P8 were not re-run.
`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## 11.1 Requirement ledger

| ID | Done | Where |
|---|---|---|
| R22 | yes | the two export lines are gone from `patterns/index.ts` (the file is back to its `HEAD` content); `PageEditorDialogView.tsx` imports the editor from `@/design-system/mantine/patterns/MantineRichTextEditor`; no other non-test file imports it |
| R23 | yes | `CmsPageView.stories.tsx` `meta.parameters.skipCanvas: true`; no `StoryPageGutter`, no padding |
| R24 | yes | (a) `theme.ts` type line `richTextContentMinHeight` (next to `prose`) and the value `richTextContentMinHeight: '10lh'` at `theme.ts:780`, provenance: the legacy body `Textarea` `minRows={10}`; `MantineRichTextEditor.tsx` reads `theme.other.boxSize.richTextContentMinHeight`; (b) the state-3 comment now says "the start of the card's content box" |
| R25 | yes | `messages/sq.json` `admin.pages.status_draft`: `"Draft"` → `"Projektim"` (the only line changed in this revision) |

## 11.2 AC22 — Tiptap reaches `/admin/pages` only

- Fresh `npm run build` on the final tree: exit 0 (`r2-19-build.txt`). `r2-26-tiptap-routes.txt` (a Node script over `.next/app-build-manifest.json` and the chunk files, `r2-routes.mjs`): **`/admin/pages/page`, COUNT 1 of 64 pages**. The first build, before the plant, gave the same list (`r2-26a`).
- Plant **P9** (re-add the two barrel exports), hashes before = restored `c51d75aae6ced693e5358257941962e6764d4184`, planted `0357a9e45c24dba8d56b8523fbee09f2ebe5d6ea`: the route list grows to **14** pages, among them `/[locale]/page`, `/[locale]/layout`, `/[locale]/listings/page`, `/[locale]/cabinet/page` (`r2-27-plant-p9.txt`). The final `r2-19-build.txt` is the rebuild on the restored tree.
- First Load JS against `19-build.txt` (`r2-28-first-load-compare.txt`, 57 routes compared): every route is within +3 kB except `/admin/pages` (604 → 763 kB). Examples: `/[locale]` 663 → 666, `/[locale]/listings` 673 → 676, `/[locale]/[slug]` 362 → 362, `/admin/users` 529 → 531. (The +2/+3 kB on some routes comes from the sq/uk/it/en message additions of revision 1 and the type-scale CSS, not from Tiptap: no other route contains it.)

## 11.3 AC23 — `CmsPageView` Stories add no gutter (`r2-3x-cms-gutter.txt`, real Chromium, `storybook-static`, `sq`)

All six exports (`Default`, `TitleOnly`, `BodyOnly`, `LongTitleWrap`, `RichBody`, `RichLayout`), measured on all four sides as the content box's distance from the viewport edge:

| Width | top | right | bottom | left | expected |
|---|---|---|---|---|---|
| 320 | 32 | 16 | 32 | 16 | the component's own `px="md"`, `py` base `2xl` |
| 390 | 32 | 16 | 32 | 16 | same |
| 1024 | 48 | 144 | 48 | 144 | `py` md `3xl`; (1024 − 768) / 2 + 16 |
| 1440 | 48 | 352 | 48 | 352 | (1440 − 768) / 2 + 16 |

No side is 0, none is larger than the component's own value, and no document overflow. Before this revision `RichLayout` measured top 56 / left 32 at 320 (doubled).

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-cmspageview--rich-layout: body 256 @320 · 326 @390 · 736 @1024 · 736 @1440 (r1-3x-cms.txt, unchanged by this revision); overflow: none; fixed-width containers: NONE (the component's own maw var(--width-content)); style objects: NONE; viewport pins: NONE.`
`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-cmspageview--rich-layout: h2 18 / 18 / 24 / 24, h3 16 / 16 / 20 / 20, p 16, title 20 / 20 / 30 / 30 at 320 / 390 / 1024 / 1440; ≥24px text without a responsive step: NONE; child heading larger than page title: NONE.`
`GR-3d STORY GUTTER CHECK — patterns-mantine-cmspageview--{default,title-only,body-only,long-title-wrap,rich-body,rich-layout}: own gutter on all four sides, skipCanvas, no StoryPageGutter; top/right/bottom/left 320 32/16/32/16 · 390 32/16/32/16 · 1024 48/144/48/144 · 1440 48/352/48/352 (expected the component's own values, centred by maw); side at 0: NONE; doubled gutter: NONE; gutter written in the Story: NONE.`

## 11.4 AC24 — `mih` reads the theme key

`MantineRichTextEditor` `RichTextEditor.Content` computes `min-height: 240px` at 390 and 1440 (`10lh` of the content's 24px line height), the same value as before, since `10lh` is unchanged and only its owner moved (`r2-3x-cms-gutter.txt`, last two lines). The definition line is quoted in §11.1.

## 11.5 Commands (final tree)

| Command | Exit | Evidence |
|---|---|---|
| vitest, the six files of §18.7: **120 tests in 7 files** | 0 | `r2-09` |
| `typecheck` / `lint` (0 errors) | 0 / 0 | `r2-10`, `r2-11` |
| `check:story-coverage` / `check:pattern-enrolment` / `check:rendered-scope` | 0 / 0 / 0 | `r2-12`, `r2-12b`, `r2-13` |
| `check:surface-census:changed -- --base HEAD` | 0 | `r2-14` |
| `check:design-tokens` / `check:i18n` | 0 / 0 | `r2-15`, `r2-22a` |
| `check:file-integrity` / `check:mojibake` | 0 / 0 | `r2-16`, `r2-17` |
| `build-storybook` / `npm run build` | 0 / 0 | `r2-18`, `r2-19` |

Hashes: `r2-01-hashes.txt` (before the first write) and `r2-23-hash-object.txt` (final). Status: `r2-21-status-after.txt`. Platform: `win32 v22.22.3` (`r2-04-platform.txt`).

## 11.6 Notes

- `check:pattern-enrolment` stayed green after the barrel export was removed (it reads the directory), as §18.4 expected.
- `RichTextEditor.stories.tsx` and `richTextRoundTrip.test.ts` already imported the pattern by its own path; they needed no change.
- The `"Slug"` field label stays in every locale (§18.3): not in 868's write set.
- I did not run `check:locale-leak` again (§18.3: the reviewer owns it; R25 changes one `sq` value).
- Owed: O78-7 (§17.9) after review 4, with the points of §18.8.

---

# 12. Revision 3 (kickoff §19.3, R26 / AC26) — executor session, 2026-10-01

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved. Nothing rendered changes, so the owner's O78-7 matrix (§17.9 with the §18.8 points) can run at the same time.
Evidence: `docs/sessions/evidence/task868/r3-*`. No plant was re-run.

**R26.** `MantineDataTableToCards.tsx`, the `CardConfig` doc block (line 184): the primary-row line now reads "badge beside the title on one line, or, when it does not fit, on its own row above the avatar + title, aligned to the start of the card's content box (Task 868 D868-4)". One line replaced by two comment lines; no code touched.

**AC26.** `Select-String … -Pattern 'badge \(right, own row\)'` equivalent: a count of that string in the file is **0** (it was 1). The file's blob hash before the edit, `6f4654d753fdfb251be5e4fed56f3d1a94aef7e6`, equals its `r2-23-hash-object.txt` entry; after the edit it is `8716ca65b9272cfe75487ce87a2c8d8b912516fa` (`r3-23-hash-object.txt`). The edit is a single anchored replacement of that one comment line, so the difference from the r2 content is that comment only.

| Command | Exit | Evidence |
|---|---|---|
| platform (`win32 v22.22.3`) | 0 | `r3-04-platform.txt` |
| `npm run typecheck` | 0 | `r3-10-typecheck.txt` |
| `npm run check:file-integrity` | 0 | `r3-16-file-integrity.txt` |
| `npm run build` | 0 | `r3-19-build.txt` |
| blob hash of the file | — | `r3-23-hash-object.txt` |

Not re-run, by §19.3: lint, tests, Storybook, probes and plants. A comment cannot change them; the reviewer's own run of `lint` covers the file.

---

# 13. Revision 4 (kickoff §20, R27 / AC27, D868-5) — executor session, 2026-10-01

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved. Evidence: `docs/sessions/evidence/task868/r4-*`. Platform `win32 v22.22.3` (`r4-04-platform.txt`). Hashes before the first write: `r4-01-hashes.txt`; status before/after identical (`r4-01-status-before.txt`, `r4-21-status-after.txt`).

`GR-0 CANONICAL REUSE PREFLIGHT — request: rich-text toolbar control size from sm; semantic queries: richTextControlSize, touchTarget, control size, theme.other.boxSize; inspected candidates: MantineRichTextEditor.tsx:198-203, theme.ts:718 touchTarget, theme.ts boxSize block, @mantine/tiptap/styles.css .m_c2207da6[data-variant='default'] (26px); decision: EXTEND theme.other.boxSize by one key and COMPOSE it in the existing pattern; selected canonical owner: src/design-system/mantine/theme.ts; Mantine/TailAdmin token path: theme.other.boxSize.richTextControlSize; new hardcoded visual values: NONE; rationale: the 26px is a theme key with Mantine's stylesheet line as provenance (D868-5), no style object or CSS rule.`

**R27.**
- (a) `theme.ts:782` `richTextControlSize: '1.625rem'` (type line `:126`), comment: 26px, Mantine's own control size, D868-5.
- (b) `MantineRichTextEditor.tsx:199` `controlSize = { base: theme.other.touchTarget, sm: theme.other.boxSize.richTextControlSize }`; `touch` uses it for `miw` and `mih` (30 toolbar controls spread `touch`).
- (c) the comment above it now reads: 44px below 640 (clause 11), then Mantine's own 26px from `sm` through the theme key (D868-5). The header JSDoc already said "below 640px", so it is unchanged.

**AC27** (`r4-3x-toolbar.txt`, `probe868-r4.mjs` = r1 probe + `maxHit`; fresh `storybook-static`; `default` and `with-content`, `sq` and `uk`):

| Width | Control box (min/max) | Toolbar rows | Revision 1 rows | Doc overflow |
|---|---|---|---|---|
| 320 | 44 / 44 | 8 | 8 | no |
| 390 | 44 / 44 | 6 | 6 | no |
| 639 | 44 / 44 | 3 | — | no |
| 640 | 26 / 26 | 2 | — | no |
| 768 | 26 / 26 | 2 | 3 | no |
| 1440 | 26 / 26 | 1 | 2 | no |

The 1440 row count is 1, so no `PREMISE DRIFT — toolbar rows`. `PageEditorDialogView` `RichContent` at `sq` (`r4-3x-dialog.txt`): 768 and 1440 `minHit` 26, no overflow, no console error. `check:design-tokens` exit 0.

**P10** (`r4-27-plant-p10.txt`): `sm` set back to `theme.other.touchTarget`, Storybook rebuilt. 1440 measured 44,44 and 2 rows, so the 26 ± 1 assertion fails. Hashes: before `ca395eba…`, planted `3c43768b…`, restored `ca395eba…` (equal). The fresh Storybook build after the restore is the one the AC27 probe above ran on.

| Command | Exit | Evidence |
|---|---|---|
| platform | 0 | `r4-04-platform.txt` |
| vitest (the six files; 7 files, 120 tests) | 0 | `r4-09-tests.txt` |
| `typecheck` | 0 | `r4-10-typecheck.txt` |
| `lint` | 0 | `r4-11-lint.txt` |
| `check:design-tokens` | 0 | `r4-15-design-tokens.txt` |
| `check:file-integrity` | 0 | `r4-16-file-integrity.txt` |
| `check:mojibake` | 0 | `r4-17-mojibake.txt` |
| `build-storybook` | 0 | `r4-18-storybook-build.txt` |
| `build` | 0 | `r4-19-build.txt` |
| hashes | — | `r4-23-hash-object.txt` (theme.ts `1978f1ed…`, MantineRichTextEditor.tsx `ca395eba…`, MantineDataTableToCards.tsx `8716ca65…` = r3) |

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-richtexteditor--default: 320 288/320 · 390 358/390 · 768 720/768 · 1440 1376/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-richtexteditor--default: content 16px and label 14px at 320 · 390 · 768 · 1440 (the Default export has no heading); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

`GR-3d`: carried from §18.1 (gutter unchanged; no Story file changed in this revision).

Files changed in revision 4: `src/design-system/mantine/theme.ts` (the key and its type line), `src/design-system/mantine/patterns/MantineRichTextEditor.tsx` (`touch` and its comment), this log, `docs/sessions/evidence/task868/r4-*` and `probe868-r4.mjs`, and the `docs/backlog.md` 868 cell.

Not run, by §20.5: `check:story-coverage`, `check:pattern-enrolment`, `check:rendered-scope`, `check:surface-census:changed` and the i18n gates (no Story, manifest, message or import changed). No other plant was re-run.

Owed: the §20.6 owner matrix (`RichTextEditor` `Default` `sq` 390/768/1440; `PageEditorDialogView` `RichContent` `sq` 1440), and O78-7b / O78-7c after the deploy.

---

# 14. Revision 5 (kickoff §22, R28–R30 / AC28–AC32, D868-6, D868-7) — executor session, 2026-10-01

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved. Evidence: `docs/sessions/evidence/task868/r5-*`. Platform `win32 v22.22.3` (`r5-04-platform.txt`). Hashes before the first write: `r5-01-hashes.txt` (`hash  path`). Consumers of `MantineDropdownMenu` re-grepped at I0 (`r5-01-consumers.txt`): `HeaderView`, `UserMenu`, `LocaleSwitcher`, the `Header.signOut` test and the `DropdownMenu`/`UserMenu` Stories.

`GR-0 CANONICAL REUSE PREFLIGHT — request: editor toolbar as menus; semantic queries: menu, dropdown, combobox, popover, action menu, bottom sheet; inspected candidates: MantineDropdownMenu.tsx (Mantine/Primitives/DropdownMenu), MantineCombobox.tsx, MantinePopover.tsx, MantineNavigationMenu.tsx; decision: REUSE MantineDropdownMenu + EXTEND it with active; selected canonical owner: src/design-system/mantine/patterns/MantineDropdownMenu.tsx; Mantine/TailAdmin token path: theme.ts touchTarget, boxSize.richTextControlSize, iconSize.compact/standard/badge; Mantine variant "subtle"; new hardcoded visual values: NONE; rationale: the project's command menu already has the <640 bottom sheet and the ≥640 anchored menu.`

`GR-3a STORY PREFLIGHT — MantineDropdownMenu × active item; canonical candidates: Mantine/Primitives/DropdownMenu; direct-import evidence: src/stories/mantine/primitives/DropdownMenu.stories.tsx; toolbar coverage: locale=Storybook toolbar, viewport=Storybook toolbar; decision: EXTEND; target: Mantine/Primitives/DropdownMenu (WithActiveItems). MantineRichTextEditor × menu toolbar → REUSE Patterns/Mantine/RichTextEditor.`

## 14.1 What changed

- **R29** `MantineDropdownMenu.tsx`: `DropdownMenuItemDef.active?: boolean`. When true: a lucide `Check` at `iconSize.compact` at the item's end (`rightSection` on the desktop `Menu.Item`; `ms="auto"` in the sheet row) and `data-active`. `undefined` renders as before (the sheet row's `Group` only gets `w="100%"` when `active` is defined). Story `Mantine/Primitives/DropdownMenu` → `WithActiveItems`.
- **R30** four keys `admin.pages.editor.menu_format|menu_paragraph|menu_insert|menu_history` in `sq`/`en`/`uk`/`it` (en: Text format · Paragraph · Insert · History; sq: Formatimi i tekstit · Paragrafi · Fut · Historiku; uk: Форматування тексту · Абзац · Вставити · Історія; it: Formato testo · Paragrafo · Inserisci · Cronologia). `RichTextEditorLabels` gains `menuFormat|menuParagraph|menuInsert|menuHistory`, filled in `useCmsEditorLabels()` (`PageEditorDialogView.tsx`). `RichTextEditor.stories.tsx` and the dialog both use that hook, so the Story file needed no label change.
- **R28** `MantineRichTextEditor.tsx`: `variant="subtle"`; one `ControlsGroup` with Format (`Bold`), Paragraph (`Pilcrow`), Insert (`Plus`), the unchanged `RichTextEditor.Link`, History (`Undo2`). Items: Format 5 + remove link (6), Paragraph 10, Insert 11, History 2. Every item runs today's command, keeps today's `disabled` rule and label, and sets `active` from `editor.isActive(…)`. Triggers are `RichTextEditor.Control` (`iconOnlyTrigger`; `aria-label`, `title` and the sheet title are the menu label; `active` when any item is), with the chevron at `iconSize.badge` (12). The `ImageUploading` play function now opens the Insert menu and presses its image item.

## 14.2 Deviations and findings (for the reviewer)

1. **`h` added to `touch`.** The `subtle` variant sets `height: 2rem` (`@mantine/tiptap/styles.css`, `.m_c2207da6[data-variant='subtle']`), so `miw`/`mih` alone measured 32px high from 640. `touch` now also carries `h: controlSize` (the same two theme keys): 44px below 640, 26px from 640. No raw value, no `style`.
2. **`PREMISE DRIFT` on plant P11 (§22.2/§22.4).** The kickoff says five separate `ControlsGroup`s take 268px against a 254px inner width. Measured (`r5-27-plant-p11-geometry.txt`): the `subtle` toolbar padding is 4px, not 10/16, so the inner width at 320 is **278px** and five separate groups **fit in 1 row** (planted tree: `groups=5 rows=1`). P11 as written cannot fail AC28; I changed no value to force it. The detector is shown two-armed by **P11b** (mine): five groups plus two extra separate controls, 380px, gives `rows=2` at 320; restored with an equal hash. See `r5-27-plant-p11.txt`.
3. **A file outside §22.5's write set changed:** `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx` (T12). It pressed the toolbar's "Insert image" button, which is now an Insert-menu item; it failed twice in the first `r5-09` run until `openImageDialog` opened the Insert menu first. The assertions are unchanged.
4. `RichTextEditor.stories.tsx` changed for the `ImageUploading` play function only.
5. The smoke test asserts the toolbar holds exactly 5 buttons, Link among them.

## 14.3 Evidence

**AC28** (`r5-3x-toolbar.txt`, final restored build; `probe868-r5.mjs`; `default` and `with-content` × `sq`/`uk` × 320, 390, 639, 640, 768, 1440 = 24 rows): all 24 read `controls=5 groups=1 rows=1`, `overflow=false`, `unnamed=0`. Size: 44 × 44 at 320/390/639; 26 × 26 at 640/768/1440. `PageEditorDialogView` `rich-content` `sq` (`r5-3x-dialog.txt`): 390 gives 5 controls, 1 row, 44px; 1440 gives 5 controls, 1 row, 26px.

**AC32** (`r5-3x-dialog.txt`, 390 `sq`): cursor in a plain paragraph. Tapping Paragraph opens the sheet (2 dialogs). `elementFromPoint` at the "Titull 2" row's centre is inside that row (44px high). Pressing it turns the paragraph into an `h2` (the `h2` count goes 1 to 2). The sheet closes (1 dialog) and the editor dialog stays open.

**AC29/AC30** (`r5-09-tests.txt`): 8 files, **131 tests**, exit 0 (the §22.5 list plus `Header.signOut.test.tsx`; the editor smoke file has 18). New rows: five-button toolbar; the four menus listing 6/10/11/2 items by localized name; bold through Format (`<p><strong>hello</strong></p>`, selection 1–6 survives); H2 through Paragraph; align centre gives `text-align: center`; remove link disabled outside a link and enabled inside one; undo through History; AC30 (Format trigger has `data-active`, the Bold item shows `.lucide-check`, Italic does not). `Header.signOut.test.tsx` passes unchanged.

**`WithActiveItems`** (`r5-3x-menu.txt`, `sq`/`uk` × 320/390/768/1440): one `Check`, one `data-active` item, no overflow, no console error.

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-richtexteditor--default: 320 288/320 · 390 358/390 · 768 720/768 · 1440 1376/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3b STORY RESPONSIVE CHECK — mantine-primitives-dropdownmenu--with-active-items: trigger 320 288/320 · 390 358/390 · 768 95/768 · 1440 95/1440 (sq; uk 51); overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-richtexteditor--default: content 16px and label 14px at 320 · 390 · 768 · 1440; ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

`GR-3c TYPE RESPONSIVE CHECK — mantine-primitives-dropdownmenu--with-active-items: caption 12px, item label 14px at 320 · 390 · 768 · 1440 (the sheet row's button element reports 16px at 320/390 but holds only the 14px label); ≥24px text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.`

`GR-3d`: `RichTextEditor` StoryPageGutter all, unchanged (§18.1; the Story's render is untouched); `PageEditorDialogView` n/a: overlay-only; `DropdownMenu` n/a: MantineStoryShell primitive.

| Command | Exit | Evidence |
|---|---|---|
| platform | 0 | `r5-04-platform.txt` |
| vitest (8 files, 131 tests) | 0 | `r5-09-tests.txt` |
| `typecheck` | 0 | `r5-10-typecheck.txt` |
| `lint` (0 errors, 132 warnings; none from `probe868-r5.mjs`) | 0 | `r5-11-lint.txt` |
| `check:story-coverage` | 0 | `r5-12-story-coverage.txt` |
| `check:pattern-enrolment` | 0 | `r5-12b-pattern-enrolment.txt` |
| `check:surface-census:changed -- --base HEAD` | 0 | `r5-14-census-changed.txt` |
| `check:design-tokens` | 0 | `r5-15-design-tokens.txt` |
| `check:i18n` | 0 | `r5-22a-i18n.txt` |
| `check:file-integrity` | 0 | `r5-16-file-integrity.txt` |
| `check:mojibake` | 0 | `r5-17-mojibake.txt` |
| `build-storybook` (restored tree) | 0 | `r5-18-storybook-build.txt` |
| `build` | 0 | `r5-19-build.txt` |
| status after (only the two new write-set files differ from before) | — | `r5-21-status-after.txt` |
| hashes | — | `r5-23-hash-object.txt` |

Not run: `check:locale-leak` (AC31 leaves the scoped run to the reviewer) and the earlier plants. Owner matrix §22.6 is owed: `RichTextEditor` `Default`/`WithContent` × `sq`/`uk` × 390/1440 (8), `PageEditorDialogView` `RichContent` `sq` 390/1440 (2), `DropdownMenu` `WithActiveItems` `sq` 390/1440 (2); O78-7b and O78-7c after the deploy.

Files changed in revision 5: `MantineRichTextEditor.tsx`, `MantineDropdownMenu.tsx`, `DropdownMenu.stories.tsx`, `RichTextEditor.stories.tsx`, `PageEditorDialogView.tsx`, `MantineRichTextEditor.smoke.test.tsx`, `AdminPagesManager.smoke.test.tsx`, `messages/{sq,en,uk,it}.json`, this log, `docs/sessions/evidence/task868/r5-*` and `probe868-r5.mjs`, and the `docs/backlog.md` 868 cell (still 80 lines).

---

# 15. Revision 6 (kickoff §23.3, R31 / AC31′) — executor session, 2026-10-01

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**. Never self-approved. Evidence: `docs/sessions/evidence/task868/r6-*`. Platform `win32 v22.22.3` (`r6-04-platform.txt`). Hashes before the first write: `r6-01-hashes.txt`. By the owner's instruction for this run, no probe, no plant and no `check:locale-leak` was run.

**R31 (a).** The `WithActiveItems` caption in `DropdownMenu.stories.tsx` is now `{t('dm_active_items_caption')}`, like `dm_fullwidth_trigger_caption`. The key `storybook.mantine.dm_active_items_caption` is added right after that one in `messages/{sq,en,uk,it}.json`:
- en: "active — the current item carries a trailing check; the others are unchanged"
- sq: "active — elementi aktual ka një shenjë kontrolli në fund; të tjerët mbeten të pandryshuar"
- uk: "active — поточний пункт має позначку в кінці; решта без змін"
- it: "active — la voce corrente ha un segno di spunta finale; le altre restano invariate"

The leading `active` is the prop name, as `fullWidthTrigger` is in the neighbouring caption.

**R31 (b).** The comment above the toolbar's `ControlsGroup` (`MantineRichTextEditor.tsx:342`) now reads: five 44px controls take 220px and fit the **278px** inner width at 320 (`subtle` pads the toolbar 4px; D868-7). Nothing else in that file changed (checked by reading it back; the file is untracked, so `git diff` has no base for it).

**AC31′.** The caption is read through `t(...)` from the four locale files, so no English literal remains in the Story. Its rendering in `sq` was not re-measured, because probes were excluded. `check:i18n` exits 0.

| Command | Exit | Evidence |
|---|---|---|
| platform | 0 | `r6-04-platform.txt` |
| `typecheck` | 0 | `r6-10-typecheck.txt` |
| `check:i18n` | 0 | `r6-22a-i18n.txt` |
| `check:file-integrity` | 0 | `r6-16-file-integrity.txt` |
| `build-storybook` | 0 | `r6-18-storybook-build.txt` |
| `build` | 0 | `r6-19-build.txt` |
| hashes of the six write-set sources | — | `r6-23-hash-object.txt` |

Files changed in revision 6: `src/stories/mantine/primitives/DropdownMenu.stories.tsx` (the caption), `messages/{sq,en,uk,it}.json` (one key each), `src/design-system/mantine/patterns/MantineRichTextEditor.tsx` (one comment), this log, `docs/sessions/evidence/task868/r6-*`, and the `docs/backlog.md` 868 cell. The backlog stays 80 lines.

Owed: the owner's confirmation of `DropdownMenu` `WithActiveItems` (`sq`, 390 and 1440); O78-7b and O78-7c after the deploy.
