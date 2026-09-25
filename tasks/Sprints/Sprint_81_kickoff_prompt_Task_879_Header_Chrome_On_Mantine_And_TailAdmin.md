# Task 879 — the header's chrome leaves its CSS modules: Mantine props and theme tokens, traced to TailAdmin

**Sprint:** 81 (`tasks/Sprints/Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md`, goal 4) · **Priority:** P2 ·
**QA profile:** Q4 (see §13) · **Depends on:** 878 (✅ archived 2026-09-24) · **Owner decision:** D81-7 ·
**State:** `READY FOR SONNET` · **Written:** 2026-09-25 by the orchestrator (Opus).

Executor: follow `.claude/skills/execute-task/SKILL.md`. Your strongest allowed status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Never approve, and never run or suggest a mutating git command.

---

## 1. Mode and task type

`TASK DESIGN` → implementation task. Types: **UI / Layout / Component (current Mantine path)** + **TailAdmin / Styling
Governance** + **Regression / Critical Flow** (the header rows of `docs/critical-flow-registry.md`, §3 F11). The
boundary: every visible change is in five files the header renders (§7). One governance script changes only because
it hard-codes a file this task deletes (§3 F9).

## 2. Objective

The public header and the auth drawer it opens stop carrying Tailwind output reproduced in four CSS modules. Each
declaration becomes a Mantine component, a Mantine style prop, or a theme token, and every visual value traces to the
TailAdmin reference row written for this task (`docs/tailadmin-style-reference.md` §6v). The four modules are deleted.
Header height, stacking level and behaviour stay as they are.

## 3. Verified context

All facts measured by the orchestrator on 2026-09-25, `win32`, Node v22.22.3, unless marked otherwise. **I0 (§10.1)
re-measures them; that is a freshness check, not first verification.**

- **F1 (FACT) — the four modules and their consumers.**
  - `src/components/layout/HeaderView.module.css` (138 lines) backs **11** `className` sites in `HeaderView.tsx`
    (`:36, :45, :96, :119, :121, :122, :123, :129, :137, :158, :174`). It holds `z-index: 30`, `border-bottom: 1px
    solid var(--border)`, `color-mix(in oklab, var(--background) 95%/60%, transparent)`, `backdrop-filter: blur(8px)`,
    a raw `@media (min-width: 390px)`, `transition-duration: 0.15s`, and legacy `var(--primary)`, `var(--foreground)`
    and `var(--homepage-runtime-*)` references.
  - `src/components/layout/MobileNavDrawer.module.css` (15 lines) backs **6** `.navLink` sites
    (`MobileNavDrawer.tsx:61, :64, :69, :74, :79, :84`).
  - `src/components/shared/LocaleSwitcher.module.css` (23 lines) holds one `@keyframes` spinner for the pending
    `Loader2` (`LocaleSwitcher.tsx:57`).
  - `src/modules/auth/components/AuthSheet.module.css` (169 lines) backs **13** sites in `AuthSheet.tsx`
    (`:125, :146, :147, :148, :150, :151, :177, :232, :275, :470, :473, :677, :760`).
- **F2 (FACT) — legacy colour and raw spacing props outside the modules, in the same files.**
  `MobileNavDrawer.tsx:56, :97, :122` pass `<Divider color="var(--border)" />`; `:111, :129` pass
  `styles={{ root: { paddingLeft: 0 } }}`. `AuthSheet.tsx:119, :298, :431, :727` carry `<Stack gap={6}>`, `:462`
  `<Stack gap={4}>`, `:531` `pt={4}`.
- **F3 (FACT) — the design-tokens gate cannot see AuthSheet.** `scripts/design-tokens-allowlist.json` allowlists
  `src/modules/auth/components/AuthSheet.tsx` as a whole file (reason: the Google SVG brand colours). The strict run on
  2026-09-25 printed `0 violations` while F2's raw `gap={6}` sits in that file. **GR-2:** a green
  `check:design-tokens` proves nothing about AuthSheet; §13 closes AuthSheet with a targeted search.
- **F4 (FACT) — tokens that exist** (`src/design-system/mantine/theme.ts`): spacing `xs` 8px, `sm` 12px, `xl` 24px,
  `tight` 4px, `compact` 6px (`:557-573`); `fontSizes.sm/xl` 14/20px; `other.iconSize.badge` 12; `other.touchTarget`
  `'2.75rem'`; gray ramp `gray.2 #e4e7ec`, `gray.4 #98a2b3`, `gray.7 #344054`, `gray.8 #1d2939` (`:296-307`);
  `components.Divider.defaultProps.color = 'gray.2'` (`:1269-1271`); Button `variant="transparent"` with no `color`
  resolves to `var(--mantine-color-gray-7)`, 14px/500, `--button-padding-x` 1rem, min-height 44px (`:806-858`).
  Breakpoints are `xs` 20em, `xs2` 30em, `sm` 40em … (`:524-536`); **none is 390px**.
- **F5 (FACT) — tokens that do NOT exist at runtime.** `--z-sticky: 30` (`src/app/globals.css:258`) is declared inside
  `@theme inline` (opens `:35`), not `:root` (`:327`); Task 718 proved such names are not emitted. **Do not consume
  `var(--z-sticky)`.** Mantine's own `--mantine-z-index-app` is `100` (`node_modules/@mantine/core/styles.css`).
- **F6 (FACT) — the TailAdmin header exists; the reserved row was wrong.** `demo_tailadmin_com.zip` → `index.html`
  has one `<header class="sticky top-0 z-99999 flex w-full border-gray-200 bg-white xl:border-b">`. The live capture
  (§6v) measured it at 390px: 65px tall, `rgb(255,255,255)`, `backdrop-filter: none`, 1px `rgb(228,231,236)` bottom
  line; at 1440px: 77px. The sign-in page's links measured 14px/20px/400 brand, no underline; its "Or" label
  14px/20px `rgb(152,162,179)`. Evidence: `docs/sessions/evidence/task879/design/`. *Note on the JSON:* its keys
  `headerActionCluster`/`notificationButton` matched the top row and the sidebar toggle, not what the key names say;
  §6v reports them as what they are.
- **F7 (FACT) — the height constraint, corrected.** `src/design-system/mantine/notification-chrome.css:57-64` offsets
  top-positioned toasts by `97px` below **40em (640px)** and `65px` from 640px. The header measures 97px below 390px
  and 65px from 390px (Task 590, Task 706 I2). So between 390 and 639px the toast offset is already 32px below the
  header. That is pre-existing and not changed here. The reserved row's "97 below 390 / 65 from 390" was the header's
  height, not the offset's breakpoint. **This task keeps the header at 97px below 390px and 65px from 390px.**
- **F8 (FACT) — who reads the global classes.** `.site-header` has **no CSS rule** in any stylesheet under `src/`
  (only comments), but `scripts/check-click-shield.mjs:253,259`, `scripts/check-header-id-parity.mjs:147` and
  `scripts/task612-qa-listinggallery-lightbox-portal.mjs:67` select it. It stays as a marker class. `.container-wide`
  (`globals.css:710-720`) has 18 files of consumers far outside the header (`[locale]/page.tsx`, favorites, contact,
  `FooterView`, `MantineHomeSection`, Storybook `preview.tsx`, …). It stays, unchanged.
- **F9 (FACT) — live consumers of the files this task deletes (clause 9 audit, `git grep`, 2026-09-25).**
  - `scripts/check-homepage-theme-runtime-deps.mjs` lists `HeaderView.module.css` in `MIGRATION_INPUTS_REL`
    (`:95`), in four `MIGRATION_TARGETS` rows (`:124-127`: `--space-1`→1 use, `--space-16`→1, `--space-2`→5,
    `--space-6`→1), in verify-gate Case 3 (`:488`, index `[3]`) and Case 6 (`:567`, plants on
    `var(--homepage-runtime-space-2)` in that file). Constants today: `FULL_CENSUS_PAIRS 77`, `USES 142`,
    `MIGRATION_TARGET_PAIRS 34`, `USES 66`, `MIGRATION_SIGNATURE 9ed1b2c3…b3d8` (`:157-161`). Task 787 removed
    `MobileBottomNavView.module.css` from this same manifest and is the precedent (`:112-114`, `:517-525`).
  - `docs/design-system.md:688-690` and `:1242` call `HeaderView.module.css:35` "the sole marked site" of
    `z-index: 30`.
  - `scripts/task770-copyid-computed.mjs:91` names the file in a historical task probe that is not wired into
    `package.json` → not a live consumer; leave it.
  - `--motion-duration-spinner` (`globals.css:337`) has no consumer other than `LocaleSwitcher.module.css`. It becomes
    unused; it is listed in `scripts/css-var-ownership-snapshot.json:150`. **Leave both** (§8).
  - The `--homepage-runtime-*` tokens HeaderView/MobileNavDrawer consume all keep other consumers (checked per token).
- **F10 (FACT) — GR-1 census**, `node.exe scripts\check-surface-census.mjs --surface src\components\layout\Header.tsx`:
  21 nodes; FAIL only on `Header.tsx` and `NotificationBell.tsx`, both container-exempt under D81-2 (GR-1). Every
  other node is `manifest:yes story:yes ui-imports:0`. `className` counts: HeaderView 11, AuthSheet 13,
  MobileNavDrawer 6, LocaleSwitcher 2, LocationCombobox 1, MantineAddItemPanel 1, all others 0.
  `LocaleSwitcher`'s second `className` (`:55`) is a pass-through prop that `AdminLocaleSwitcher.tsx:33` fills with
  Tailwind classes. `LocationCombobox`'s and `MantineAddItemPanel`'s are pass-through props too.
- **F11 (FACT) — critical flows touched** (`docs/critical-flow-registry.md`): "Login (email/password)" (`AuthSheet`,
  `test:auth`); "Header overlays (locale switch · user menu · mobile drawer)" (`check:hydration`); "Authenticated
  header hydration — NotificationBell SSR shell" (`check:header-id-parity`); "Listing-detail gallery lightbox
  stacking", which depends on the header's working `z-index: 30` being below the lightbox's Mantine 200.
- **F12 (FACT) — Stories.** Each changed component has its own canonical Story that imports it directly:
  `Mantine/Primitives/HeaderView` (`Default` guest + authed, `SigningOut`),
  `Mantine/Primitives/MobileNavDrawer` (`Default`, arg `loggedIn`), `Mantine/Primitives/LocaleSwitcher` (`Default`,
  includes `isPending`), `Patterns/Mantine/AuthSheet` (`Login`, `Register`, `RegisterAgent`, `ForgotPassword`,
  `LoginValidationError`, `Captcha`, `RegisterAgentAddCompany`). No Story renders the company-logo **image preview**
  (`AuthSheet.tsx:465-471`) or the forgot-password **success** view (`:228-233`).
- **F13 (FACT) — Storybook's viewport toolbar does not resize the preview** (reserved **799**). The owner matrix
  (§13.3) therefore uses the iframe URL at a set browser width, not the toolbar.
- **Worktree at design time:** clean on `main` before this design; this design adds only the artifacts in the §15
  handoff.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D81-7, F1, F6 | The header shell (`HeaderView.tsx` `<header>`) is `Box component="header"` with `className="site-header"` (marker only), `pos="sticky"`, `top={0}`, `w="100%"`, `bg="white"`, **no** backdrop filter, and a `<Divider />` (theme default `gray.2`) as the bottom line after the bar. | P1 | AC1, AC7 | Confirmed |
| **R2** | F5, F11 | The header's stacking level stays **30**. It comes from a new theme token `theme.other.zIndex.siteHeader = 30` (typed in `MantineThemeOther`), applied as the one permitted `style={{ zIndex: … }}` on the header (MECHANISM-KEPT, 878 R3). No `var(--z-sticky)`, no `--mantine-z-index-app`, no literal `30` in `HeaderView.tsx`. | P0 | AC2 | Confirmed |
| **R3** | F7 | Header height stays **97px below 390px** and **65px from 390px** (1px of each is the Divider). The 390px switch comes from a new theme breakpoint `xs1: '24.375em'`, and the ≥390px bar height from `theme.other.boxSize.siteHeaderBar = '4rem'`. | P0 | AC3 | Confirmed |
| **R4** | F1, F4, §6v | Every `HeaderView` layout site is a Mantine layout component with props (mapping in §10.3): the bar is `Flex` (keeps `className="container-wide"`), the clusters are `Flex`/`Group`, and no `unstyled` remains on them. The wordmark is `Anchor component={Link} underline="never" fz="xl" fw={700}` with line height from `theme.other.lineHeight.siteWordmark = '1.75rem'`; "Lero" is `c="brand"`, ".al" is `c="gray.8"`. | P1 | AC1, AC4 | Confirmed |
| **R5** | §6v, §6a-link | Header and drawer nav links render as `Button component={Link} variant="transparent"` (themed: 14px/500 gray-7, 44px min height). Drawer links are `fullWidth justify="flex-start" pl={0}`, like their existing Register-agent/Logout siblings; the drawer nav `Stack` gap becomes `0`. | P1 | AC4, AC7 | Confirmed |
| **R6** | F2 | `MobileNavDrawer`: the three `Divider color="var(--border)"` become `<Divider />`; the two `styles={{ root: { paddingLeft: 0 } }}` become `pl={0}`. | P2 | AC5 | Confirmed |
| **R7** | F1 | `LocaleSwitcher`'s pending icon is Mantine `<Loader size={theme.other.iconSize.badge} color="currentColor" />`; `Loader2` and the module import go. The `className` pass-through prop stays (F10). | P2 | AC5, AC7 | Confirmed |
| **R8** | §6v, F1 | AuthSheet links: forgot-password (`:125`), the three switch/back links styled `linkPrimarySm` (`:177, :232, :760`) → `Anchor component="button" type="button" size="sm" c="brand"` (the `MantineAuthFormPattern.tsx:133-141` form, reused). The two "←" back links (`:275`, `:677`) → the same with `c="dimmed"`; `:275` also `ta="center"`. The `-0.25rem` top margin of `:677` is dropped. Handlers, labels and `type="button"` unchanged. | P1 | AC6, AC7 | Confirmed |
| **R9** | §6v, §6o | The "or" separator (`:146-153`) becomes `<Divider label={<Text span size="sm" c="gray.4" tt="uppercase">{t('or')}</Text>} labelPosition="center" />`. `tt="uppercase"` keeps today's rendered case; the messages are lowercase in all four locales (`or`/`ose`/`або`/`o`) and do not change. | P2 | AC6, AC7 | Confirmed |
| **R10** | F1 | The company-logo tile (`:465-475`), image and placeholder alike, becomes `Paper withBorder radius="lg" w={tile} h={tile} flex="none"` with `tile = theme.other.boxSize.providerLogoTile` (new, `'2.25rem'`), holding `Image src fit="contain" h="100%"` or `Center h="100%"` + the unchanged `ImagePlus`. The `eslint-disable` for `<img>` goes with the `<img>`. The `alt` text is unchanged. | P2 | AC6 | Confirmed |
| **R11** | F2 | AuthSheet raw spacing props become tokens: `gap={6}` → `gap="compact"` (×4), `gap={4}` → `gap="tight"`, `pt={4}` → `pt="tight"`. | P2 | AC6 | Confirmed |
| **R12** | D81-7 | The four `.module.css` files are deleted and nothing imports them. | P1 | AC5, AC6 | Confirmed |
| **R13** | F9, clause 9 | `check-homepage-theme-runtime-deps.mjs` drops `HeaderView.module.css` from `MIGRATION_INPUTS_REL` and its four `MIGRATION_TARGETS` rows; `MIGRATION_TARGET_PAIRS/USES` become **30/58**; `FULL_CENSUS_*` and `MIGRATION_SIGNATURE` take the values the gate itself reports for the unmodified post-change tree; Case 3's comment and Case 6's plant target move to another manifest file that contains `var(--homepage-runtime-space-2)` (`HeroSearchView.module.css` is one). Both the gate and its `--verify-gate` exit 0, and verify-gate still reports 6/6 with Case 6 failing the plant as designed. `docs/design-system.md:688-690` and `:1242` state that the site now uses `theme.other.zIndex.siteHeader`. | P1 | AC8 | Confirmed |
| **R14** | GR-3a, F12 | One new export `RegisterAgentAddCompanyLogo` in `src/stories/patterns/mantine/AuthSheet.stories.tsx`: same render as `RegisterAgentAddCompany`, and its `play` clicks "+ add", then uploads a generated ≤256×256 PNG under 2 MB (built in the play function, no fixture file) into the logo `<input type="file">`, so the image-tile state renders. No new Story file or title. | P2 | AC6, AC9 | Confirmed |
| **R15** | F11 | No behaviour change: nav targets, `onClick` handlers, drawer close-then-navigate order, auth view switching, locale switching, sign-out pending, hydration id parity. | P0 | AC10 | Confirmed |

## 5. Assumptions and open questions

1. **Expected, authorized visible changes (D81-7 + clause 16):** opaque white header with no blur; the bottom line
   goes from `#EBEBEB` to gray-200 `#e4e7ec`; nav links become 44px transparent Buttons (in the drawer they gain touch
   height, clause 11); AuthSheet links go from muted 12px/underlined to 14px brand; the "or" rule gains Mantine's
   label gap and a 14px gray-4 label; the loader becomes Mantine's. The owner matrix (§13.3) judges them. A returned
   tuple becomes a revision.
2. **Deliberate non-adoptions (not owner exceptions; §6v "Not adopted"):** TailAdmin's `z-index: 99999` and its 77px
   desktop height. Both are stacking or geometry mechanics that other live code depends on (F5, F7, F11).
3. **Wordmark colour** `.al` → `gray.8`: the wordmark has no TailAdmin counterpart (the TailAdmin logo is an image);
   gray-800 is §4's heading-text rung and the nearest to today's `#232323`. **INFERENCE**, open to the owner matrix.
4. **Forgot-password success view** (`:228-233`) cannot be reached in Storybook without a network mock, which the
   Container/Presentational rule forbids. Its link is the same JSX composition as the Login/Register links that the
   Stories do render. Recorded as a limitation; it is checked live after deploy (O81-9 step 2).
5. No owner decision is open.

## 6. Pre-read rule bundle

- `docs/golden-rules.md` — GR-0 … GR-6 (emit every receipt in §10.2).
- `docs/agent-contract.md` — clauses 3, 5, 7, 9, 11, 13, 14, 15, 16, 16a–16d.
- `docs/mantine-responsive-design-system.md` — style props and layout components before `style`; §18 (inline
  styles cannot express state selectors).
- `docs/tailadmin-style-reference.md` — **§6v** (this task's reference), §6o (Divider), §6s, §6a-link note, §4.
- `docs/component-rules.md` — "Container / Presentational Primitive Split" (no hook mocks in Stories).
- `docs/storybook-governance.md` — canonical titles, no new pages, toolbar locale.
- `docs/qa-profiles.md` — Q3 and Q4 rows; `docs/qa-rules.md` — encoding and validation.
- `docs/critical-flow-registry.md` — the four rows in F11.
- `docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes", the 818/819 corollaries (read and write
  through Node or `-Encoding utf8`; `git hash-object` witnesses).

## 7. Scope

Files the executor may change:

- `src/components/layout/HeaderView.tsx` — R1–R5
- `src/components/layout/MobileNavDrawer.tsx` — R5, R6
- `src/components/shared/LocaleSwitcher.tsx` — R7
- `src/modules/auth/components/AuthSheet.tsx` — R8–R11
- `src/design-system/mantine/theme.ts` — **only** these additions, each with a provenance comment and its type:
  `breakpoints.xs1 = '24.375em'` (390px, Task 590 owner 2026-07-13 / D30); `other.zIndex.siteHeader = 30`;
  `other.boxSize.siteHeaderBar = '4rem'` (same value as `mainViewportOffset`, a distinct role — rule 3);
  `other.boxSize.providerLogoTile = '2.25rem'`; `other.lineHeight.siteWordmark = '1.75rem'`
- **Deleted:** `src/components/layout/HeaderView.module.css`, `src/components/layout/MobileNavDrawer.module.css`,
  `src/components/shared/LocaleSwitcher.module.css`, `src/modules/auth/components/AuthSheet.module.css`
- `src/stories/patterns/mantine/AuthSheet.stories.tsx` — R14 only
- `scripts/check-homepage-theme-runtime-deps.mjs` — R13 only
- `docs/design-system.md` — the two R13 passages only
- `scripts/task879-header-chrome-probe.mjs` — new, §13.2 (task-scoped evidence script, not wired into `package.json`)
- `scripts/surface-census-baseline.json` — **only** removal of rows that `check:surface-census:changed` reports as
  stale; no addition or rewording
- `docs/sessions/2026-09-2?-task879-*.md`, `docs/sessions/evidence/task879/**` (except `design/`, which is the
  orchestrator's and must stay byte-identical)
- `docs/backlog.md` — the 879 state cell only

## 8. Out of scope

- `Header.tsx`, `NotificationBell.tsx` (containers, D81-2), `HeaderActions.tsx`, `UserMenu.tsx`, `CaptchaWidget.tsx`,
  `LocationCombobox.tsx`, `PhoneField.tsx`, `MantineAddItemPanel.tsx`: no module and no visual hardcode left in them
  (F10, 878).
- `src/app/globals.css`, including `.container-wide`, `--z-sticky` and the now-unused `--motion-duration-spinner`,
  and `scripts/css-var-ownership-snapshot.json`. Removing the orphan token is dead-code cleanup the snapshot gate
  governs, not header chrome; it is recorded in the session log as a P3 note.
- `notification-chrome.css` and its offsets (F7).
- Migrating the layout to Mantine `AppShell`. `MantineAppShellFoundation` was inspected (§10.2 GR-0) and owns a
  navbar and a main frame the public layout does not have.
- `FooterView.module.css` (another surface), `AdminLocaleSwitcher`'s Tailwind `className` (admin surface).
- Any message key. The logo `alt="logo preview"` is an untranslated literal: pre-existing, left as it is, noted in the
  session log.
- `scripts/mantine-migration-scope.json`, `scripts/rendered-scope-baseline.json`: no node changes enrolment.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Header background | 60% `--background` + 8px blur | solid white, no blur (§6v) |
| Header bottom line | 1px `--border` `#EBEBEB` on the header | `<Divider />` gray-200 `#e4e7ec` |
| Header stacking | `z-index: 30` from the module | `30` from `theme.other.zIndex.siteHeader` |
| Header height | 97px <390, 65px ≥390 | unchanged |
| Header nav (≥768) | 14px/500 text links, `foreground` 80% | `Button variant="transparent"` 14px/500 gray-7, 44px |
| Drawer nav | 14px text links, 16px gap | full-width transparent Buttons, 44px rows, gap 0 |
| Locale pending icon | lucide `Loader2` + local keyframe | Mantine `Loader` |
| Auth links | 12px muted / 14px underlined brand / 14px muted | 14px brand (Anchor, hover underline); back links 14px dimmed |
| "or" rule | masked uppercase 12px label | Mantine `Divider` label, 14px gray-4, uppercase |
| Logo tile | module-styled `<img>` / `<div>` | `Paper withBorder` + `Image fit="contain"` / `Center` |
| Behaviour (all flows) | as is | unchanged (R15) |

## 10. Implementation requirements

### 10.1 I0 — before any write

1. Record `node.exe -p process.platform` (must be `win32`) and `node.exe --version` → `00-platform.txt`.
2. `git --no-optional-locks status --porcelain` + `git hash-object` of every path in §7 → `01-status-before.txt`.
   If the status is not empty, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry.
3. Re-run F1's per-file `className` counts, F2's search, F9's `git grep`, and the census (§13.1 block A) →
   `02-*.txt`. A different count is recorded and the new number used; **more sites are in scope**.
4. Build Storybook from the **unchanged** tree and run the probe (§13.2) with `--label before` →
   `03-probe-before.json`. Expected: height/stacking assertions PASS and the TailAdmin assertions FAIL (this is the
   failing arm; exit code 1 is the expected result here). Keep a copy of the build output if you need it again; do not
   overwrite `03-probe-before.json` later.
5. Run the baseline test set (§13.1 block B) and save the failing-test list → `04-tests-before.txt`. Pre-existing reds
   are expected (reserved 790: `theme.d69-18`, `css-var-resolvability`, `ListingGallery.portal.smoke` ×4, …).

### 10.2 GR receipts, each before its related write

- **GR-0**, one per changed component:
  - `HeaderView` — queries: `sticky header`, `AppShell`, `Divider`, `Flex responsive wrap`, `transparent Button nav`,
    `wordmark`; inspected: `MantineAppShellFoundation.tsx` + `Patterns/Mantine/AppShellFoundation` (rejected: owns a
    navbar + main frame), `MantinePageHeaderWithActions`, `MobileNavDrawer`'s transparent Buttons, §6o Divider;
    decision `COMPOSE`; owner: Mantine `Box`/`Flex`/`Group`/`Divider`/`Button` + `theme.ts`; new hardcoded visual
    values: NONE.
  - `MobileNavDrawer` — `REUSE` (transparent Button, Divider defaults).
  - `LocaleSwitcher` — queries `Loader`, `pending`; precedent `SaveSearchButton.tsx` Mantine `Loader`; `REUSE`.
  - `AuthSheet` — links: `REUSE` `MantineAuthFormPattern.tsx:133-141`; separator: `COMPOSE` Mantine `Divider label`
    (§6o/§6v); tile: `COMPOSE` `Paper withBorder` + `Image`/`Center`.
- **GR-1** (design-time, re-emit at the end): `GR-1 CENSUS COMPLETE — 21 nodes; tier1 19 migrated+enrolled+story + 2
  container-exempt (Header, NotificationBell — D81-2); tier2 0 imports removed; tier3 0 listed.`
- **GR-3a:** `HeaderView × {guest, authed, signing-out}` → `REUSE Mantine/Primitives/HeaderView`;
  `MobileNavDrawer × {loggedIn true/false}` → `REUSE`; `LocaleSwitcher × pending` → `REUSE`;
  `AuthSheet × {login, register, register-agent, forgot-password, add-company}` → `REUSE`;
  `AuthSheet × logo-image-preview` → `EXTEND Patterns/Mantine/AuthSheet` (new export R14, same file, same title).
- **GR-3:** `GR-3 STORY PROVEN — <component> ← <its own story file>` for HeaderView, MobileNavDrawer, LocaleSwitcher,
  AuthSheet (F12 paths).
- **GR-2**, wherever a gate closes a requirement (§13).

### 10.3 Per-declaration ledger (mandatory, in the session log)

Every declaration of the four modules, and every F2 site, gets one row: selector/site → `MAPPED` (the Mantine
component, prop or theme token that replaces it, with the §6v/§4/§6o citation) · `MECHANISM-KEPT` (only R2's
`zIndex`) · `DROPPED` (no TailAdmin source and no behaviour: the blur, the `@supports` fallback, the `color-mix`
opacities, the `transition-*` reproductions, the `data-perf-tier` guard — the replacement components carry their own
Mantine transitions, which the global `[class*="transition-"]` guard never matched on hashed classes either) ·
`STOP` (a visual value with no token — stop and report; do not invent one).
Design-time mapping for `HeaderView` (the executor verifies each):

| Module class | Replacement |
|---|---|
| `.header` | R1 + R2 |
| `.bar` | `<Flex className="container-wide" wrap={{ base: 'wrap', xs1: 'nowrap' }} align="center" justify="space-between" gap="xs" py={{ base: 'xs', xs1: 0 }} h={{ base: 'auto', xs1: theme.other.boxSize.siteHeaderBar }}>` |
| `.logo`, `.brandPrimary`, `.brandForeground` | R4: `Anchor` › `Group component="span" gap="tight" wrap="nowrap"` › `Text span inherit c="brand"` / `c="gray.8"` |
| `.desktopNav` | `<Group gap={0} wrap="nowrap" visibleFrom="md">` (Button padding supplies the spacing) |
| `.navLink` | R5 |
| `.rightCluster` | `<Flex align="center" gap="xs" w={{ base: '100%', xs1: 'auto' }} justify={{ base: 'space-between', xs1: 'flex-start' }}>` |
| `.trailingCluster`, `.userMenuSlot` | `<Group gap="xs" wrap="nowrap">` (`visibleFrom="md"` kept on the slot) |

If a Mantine prop in this table does not produce the stated computed result (the probe will say so), record it and
use the nearest Mantine form that does. Never fall back to a CSS module, a raw value or a utility class.

## 11. Positive and negative flows

**Positive:** a visitor on `/en` at 1440 sees a white sticky header, 65px, with a gray-200 line; Home/Listings nav in
gray-700; locale switch, Favourites, the bell and the user menu work as before. At 320 the header wraps to two rows
(97px) and the drawer opens with 44px nav rows; tapping one closes the drawer, then navigates. The auth drawer shows
brand 14px links and the uppercase "or" rule; the register-agent logo upload shows the bordered 36px tile.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Scroll under the sticky header; legacy `z-50` dialog or Mantine overlay open | Yes | R2, F11 | header stays under both (30 < 50 < 200) | probe `zIndex === '30'`; lightbox smoke unchanged vs baseline |
| Toast while the header is visible | Yes | F7 | offset unchanged, no overlap | header heights unchanged (AC3) |
| Locale switch pending | Yes | R7 | disabled button + spinning Mantine Loader | Story `LocaleSwitcher` pending section, owner matrix |
| Auth validation error | Yes | Login critical flow | unchanged localized error | `LoginValidationError` Story + `test:auth` |
| Logo too large / wrong type | Yes | `AuthSheet.tsx:345-366` | unchanged error, tile stays placeholder | code unchanged in that branch; review of the diff |
| Hydration of the authenticated header | Yes | F11 | zero mismatch | `check:header-id-parity`, `check:hydration` |
| Authorization / RLS / concurrent writer / offline | No | no data path changes | — | — |

## 12. Acceptance criteria

- **AC1 [R1, R4]** Given `HeaderView.tsx` after the change, when it is read, then it imports no `.module.css`, uses
  no `unstyled` prop, and carries exactly two `className` attributes, `"site-header"` and `"container-wide"`.
- **AC2 [R2]** Given the built `Mantine/Primitives/HeaderView--default` at 390 and 1440, when the probe reads the
  `header.site-header` computed style, then `position` is `sticky` and `zIndex` is `30`; and `HeaderView.tsx`
  contains no `var(--z-`, no `mantine-z-index`, and no numeric z-index literal.
- **AC3 [R3]** Given the same Story at 320, 375, 389 (height `< 390`) and 390, 480, 640, 768, 1024, 1440, 1920
  (height `≥ 390`), when the probe measures `header.site-header`, then its height is 97px below 390 and 65px from 390,
  within ±0.5px.
- **AC4 [R4, R5]** Given the same Story at 1440, when the probe reads it, then the header background is
  `rgb(255, 255, 255)`, `backdropFilter` is `none`, the bottom separator is 1px `rgb(228, 231, 236)`, each nav link is
  14px / 500 / `rgb(52, 64, 84)` and at least 44px tall, and the wordmark is 20px / 700 with a 28px line height.
- **AC5 [R6, R7, R12]** Given `MobileNavDrawer.tsx` and `LocaleSwitcher.tsx`, when read, then neither imports a
  `.module.css`; `MobileNavDrawer` has no `className`, no `var(--border)` and no `styles=` object; `LocaleSwitcher`
  imports no `Loader2` and its only `className` is the pass-through prop. And at 320 in
  `Mantine/Primitives/MobileNavDrawer--default`, each nav link is at least 44px tall (probe).
- **AC6 [R8–R12, R14]** Given `AuthSheet.tsx`, when searched with the §13.1 block C commands, then it has no
  `className=`, no `.module.css` import, no `gap={<digits>}`/`pt={<digits>}` literal and no `<img`; and in
  `Patterns/Mantine/AuthSheet--login` at 390 the forgot link and the register link are 14px / 400 /
  `rgb(236, 84, 71)` with no underline at rest, and the "or" label is 14px `rgb(152, 162, 179)` with a 1px
  `rgb(228, 231, 236)` line (probe). `--register-agent-add-company-logo` renders an `<img>` inside a 36×36 bordered
  tile (probe).
- **AC7 [R1–R10]** Given every tuple in §13.3, when the owner opens it, then the owner records it accepted, or
  returns it with a concrete visual defect.
- **AC8 [R13]** Given the post-change tree, when block D of §13.1 runs, then `check:homepage-theme-runtime-deps`
  exits 0 with MIGRATED_TARGETS 30/58, `--verify-gate` exits 0 reporting 6/6 with Case 6's plant failing as designed,
  and `docs/design-system.md` no longer calls `HeaderView.module.css:35` a live site.
- **AC9 [R14]** Given `AuthSheet.stories.tsx`, when read, then it has exactly one new export,
  `RegisterAgentAddCompanyLogo`, under the existing title, and `check:story-coverage` still passes.
- **AC10 [R15]** Given the §13.1 block B test set after the change, when compared with `04-tests-before.txt`, then no
  test fails that passed before; and `check:header-id-parity` and `check:hydration` pass against a production
  build.
- **AC11 [all]** Given the final tree, when block E runs, then `typecheck`, `lint`, `check:design-tokens`,
  `check:story-coverage`, `check:rendered-scope`, `check:surface-census:changed`, `check:mojibake` and
  `build-storybook` exit 0, and the final `npm run build` exits 0.

GR-4 AC AUDIT — 11 criteria; each states an observable property; absolutes: none (AC3 carries a ±0.5px tolerance;
AC1/AC5/AC6 count attributes that a correct implementation removes by design; AC10 compares against the measured
baseline instead of demanding a green suite).

## 13. QA profile and verification plan

**Q4.** The header is navigation chrome (Q3), and the change touches four critical-flow rows (F11), so Q4 applies:
regression baseline (§10.1 step 5), the changed-behaviour probe with a failing arm (§10.1 step 4 vs §13.2),
owner-native evidence for the production-server checks when they cannot run here, and the final build.

### 13.1 Commands (Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task879"
node.exe -p process.platform
node.exe scripts\check-surface-census.mjs --surface src\components\layout\Header.tsx
npx.cmd vitest run src/lib/auth/__tests__/browser.smoke.test.ts src/components/layout src/modules/auth src/components/shared src/design-system/mantine src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx
npm.cmd run test:auth
Select-String -Path src\modules\auth\components\AuthSheet.tsx -Pattern 'className=','\.module\.css','\b(gap|pt|pb|py|px|p|m|mt|mb)=\{\d','<img'
Select-String -Path src\components\layout\HeaderView.tsx,src\components\layout\MobileNavDrawer.tsx,src\components\shared\LocaleSwitcher.tsx -Pattern '\.module\.css','unstyled','var\(--z-','mantine-z-index','var\(--border\)','styles=\{','Loader2'
npm.cmd run check:homepage-theme-runtime-deps
npm.cmd run check:homepage-theme-runtime-deps:verify-gate
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:design-tokens
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:surface-census:changed
npm.cmd run check:mojibake
npm.cmd run build-storybook
node.exe scripts\task879-header-chrome-probe.mjs --label after --out "$ev\20-probe-after.json"
npm.cmd run build
```

Blocks, for the ACs: **A** = census (line 3); **B** = the two test lines; **C** = the AuthSheet `Select-String`
(expected: no output) and the next line (expected: no output); **D** = the two
`check:homepage-theme-runtime-deps` lines; **E** = from `typecheck` to `npm run build`. Expected: every command
exits 0, except that the census exits 1 while listing only `Header.tsx` and `NotificationBell.tsx` (D81-2). Save each
transcript under `$ev` with its exit code. The final build must be the last command, after every edit.

**GR-2 SCOPE STATED — check:design-tokens** inspects enrolled files minus allowlisted ones; it cannot see
`AuthSheet.tsx` (F3); AuthSheet is closed by block C. **check:story-coverage** inspects enrolled components only; the
four components are enrolled (F10), so it applies. **check:surface-census:changed** maps the diff to surfaces; it
cannot see what a `.module.css` rule did, so the probe and the owner matrix close the visual criteria.

Production-server checks (AC10). Run after `npm run build`, with the server started in a second terminal by
`npm.cmd run start`:

```powershell
$env:BASE_URL = "http://localhost:3000"
npm.cmd run check:hydration
npm.cmd run check:header-id-parity
```

If either cannot run in the executor's environment, return `PARTIALLY IMPLEMENTED` and give these blocks to the owner.
Expected: both exit 0.

### 13.2 The probe — `scripts/task879-header-chrome-probe.mjs`

Serves `storybook-static/` over `node:http` (same shape as `scripts/task787-header-evidence.mjs`), drives Playwright
Chromium, and writes one JSON with raw computed values and rects for every cell. It exits 1 if any assertion fails and
2 on infrastructure failure (missing build, story not rendered, selector absent — fail closed).
Cells and assertions:

- `mantine-primitives-headerview--default`, locale `en`, widths 320/375/389/390/480/640/768/1024/1440/1920, plus
  `uk` at 320 and 1440: AC2, AC3, AC4. Nav-link checks from 768; the first `header.site-header` is the guest one.
- `mantine-primitives-mobilenavdrawer--default` at 320, `loggedIn` true and false (`&args=loggedIn:false`): AC5.
- `patterns-mantine-authsheet--login` at 390 and 1440: AC6 links and "or" rule; `…--register-agent-add-company-logo`
  at 390: AC6 tile.

It runs twice: `--label before` on the unchanged build (§10.1 step 4: geometry/stacking PASS, TailAdmin assertions
FAIL → exit 1, **the failing arm**), and `--label after` (all PASS → exit 0). Every file read or written goes through
Node's UTF-8 APIs. Record the `git hash-object` of the probe script in the same pass as the final gate block.

### 13.3 OWNER VISUAL QA REQUIRED — O81-9

Open `http://localhost:6006/iframe.html?id=<story-id>&globals=locale:<locale>` (after `npm.cmd run storybook`) in a
browser window set to the width, with DevTools device mode. Do not use the toolbar viewport (F13, reserved 799).

| # | Story id | State | Locales | Widths |
|---|---|---|---|---|
| 1 | `mantine-primitives-headerview--default` | guest + authed | sq, en, uk, it | 320, 390, 768, 1440 |
| 2 | `mantine-primitives-headerview--signing-out` | pending | en, uk | 320, 1440 |
| 3 | `mantine-primitives-mobilenavdrawer--default` | logged in / `&args=loggedIn:false` | en, uk | 320 |
| 4 | `mantine-primitives-localeswitcher--default` | default, label, pending | en | 390, 1440 |
| 5 | `patterns-mantine-authsheet--login` | links + "or" rule | sq, en, uk, it | 320, 1440 |
| 6 | `patterns-mantine-authsheet--register` / `--forgot-password` / `--register-agent` | switch and back links | en, uk | 320, 1440 |
| 7 | `patterns-mantine-authsheet--register-agent-add-company` / `--register-agent-add-company-logo` | tile placeholder / image | en | 390 |

After deploy (O81-9 step 2): on lero.al, the header at 390 and 1440, the drawer at 390, and one forgot-password
request through to its success screen and its back link (§5 item 4).

## 14. Completion report contract

Session log `docs/sessions/2026-09-2?-task879-header-chrome-on-mantine.md` with: status
(`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`); a Files Changed table that
matches `git status`; requirement IDs done; the §10.3 ledger in full; every GR receipt; each command with its exit code
and transcript path; `03-probe-before.json` vs `20-probe-after.json` with the per-assertion flip; `04-tests-before.txt`
vs the after list; the `git hash-object` of every changed file in the final pass; deviations, limitations (§5 item 4,
the orphaned `--motion-duration-spinner`, the untranslated logo `alt`) and anything unresolved. Update the 879 cell in
`docs/backlog.md` only; do not touch the sprint file or the archive.

## 15. Task quality gate

- A fresh Sonnet session can execute this from the file: every path, line, token value and command above was
  measured at design time (§3) and is re-measured at I0.
- Scope protects the containers, globals, the toast offsets, the admin surface and every behaviour (§8, R15).
- The canonical source of each visual value is named (§6v, §4, §6o, `MantineAuthFormPattern`); the theme additions are
  listed exhaustively (§7); `STOP` replaces invention (§10.3).
- The permanent Story addition (R14) documents an in-scope production state that no Story renders (F12); it is not a
  probe. The probe is a script, not Story markup.
- Clause 16d: all 21 census nodes are listed (F10); no rendered component is excluded; no tier-3 node exists.
- Clause 16a: the reference row exists before implementation (§6v, with evidence).
- Commands are in paste-ready blocks; no `screenshots:assert`; the final build is the last gate.

---

## Appendix A — Evidence preflight (design)

| Field | Value |
|---|---|
| Execution state | `from-scratch` |
| Start step | §10.1 |
| Must not be overwritten | `docs/sessions/evidence/task879/design/**`, `03-probe-before.json`, `04-tests-before.txt` |
| Owner decision required | no |

| Claim | Source inspected | Falsification attempted | Result |
|---|---|---|---|
| TailAdmin has a header (F6) | zip `index.html` + live capture | the reserved row said none | premise rejected, `VERIFIED` |
| `--z-sticky` not runtime (F5) | `globals.css:35,258,327` | Task 718 history | `VERIFIED` |
| heights 97/65 and the toast breakpoint (F7) | `HeaderView.module.css:21-24,58-64`; `notification-chrome.css:57-64` | the reserved row's "from 390" | corrected, `VERIFIED` |
| `.site-header` has readers but no rule (F8) | `git grep` across `src/`, `scripts/` | a stylesheet rule | none found, `VERIFIED` |
| AuthSheet invisible to design-tokens (F3) | allowlist + strict run printing 0 with `gap={6}` present | — | `VERIFIED` (executed) |
| deleted module's live consumers (F9) | `git grep` over the repo minus archives/sessions | historical script vs gate | one gate + one doc live, `VERIFIED` |
| runtime tokens keep consumers after deletion | per-token `git grep` | each of 8 tokens | all keep ≥1, `VERIFIED` |
| `pl={0}`/`gap={0}` pass the gate | `check-design-tokens.mjs:383` filter `={-?0}` | — | `VERIFIED` (source) |
| Mantine props produce the stated computed values (§10.3) | Mantine 8.3.18 docs knowledge | not run | `ASSUMED` → the probe verifies; `STOP` rule covers a miss |

## Appendix B — Rule-compliance ledger

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| GR-0 / 16b | canonical search, no new hardcode | §10.2 receipts; §10.3 ledger; theme additions each cited | COMPLIANT |
| GR-1 / 16d | full census, no exclusion | F10, 21 nodes | COMPLIANT |
| GR-2 | gate scope stated | §13.1 | COMPLIANT |
| GR-3 / GR-3a / 16c | own Stories; missing state extends the existing page | F12, R14 | COMPLIANT |
| GR-4 | observable ACs | §12 audit line | COMPLIANT |
| GR-5 | state synced | backlog, reserved, sprint edited together (design) | COMPLIANT |
| GR-6 | owner git block, no push | design response | COMPLIANT |
| 16 / 16a | TailAdmin provenance before code | §6v + evidence | COMPLIANT |
| clause 9 | deletion audit | F9, R13 | COMPLIANT |
| clause 7 | 4 locales | no string changes; Stories run in 4 locales | COMPLIANT |
| clause 11 | mobile touch targets | R5 44px drawer rows, AC5 | COMPLIANT |
| clause 14 | UTF-8, manifest writes | §13.2, §6 bundle | COMPLIANT |
| clause 15 | critical-flow regression proof | §10.1 step 5, AC10 | COMPLIANT |
| QA Q4 | baseline, changed-behaviour test with failing arm, final build | §10.1, §13 | COMPLIANT |
| screenshots:assert retired | not used; owner matrix | §13.3 | COMPLIANT |

## Appendix C — Execution contract

One route (D81-7). Starting mode: clean isolated, or dirty with manifest (§10.1 step 2). Final write set: §7.

| # | Checkpoint | Producer → artifact | Comparator / failure |
|---|---|---|---|
| 0 | platform + status + hashes | I0 → `00-`, `01-` | not `win32` → BLOCKED |
| 1 | baseline probe (failing arm) | probe `--label before` → `03-` | must exit 1 with only TailAdmin assertions failing; any other outcome → BLOCKED |
| 2 | baseline tests | vitest → `04-` | saved list |
| 3 | edits (R1–R14) | executor | GR receipts precede each write |
| 4 | gates | §13.1 → transcripts | any non-zero (except census's D81-2 FAIL) → not IMPLEMENTED |
| 5 | after probe | probe `--label after` → `20-` | exit 0 required |
| 6 | regression compare | after list vs `04-` | new failure → not IMPLEMENTED |
| 7 | production checks | hydration + header-id-parity | missing → PARTIALLY IMPLEMENTED + owner block |
| 8 | final build + hashes | `npm run build` last | non-zero → not IMPLEMENTED |
