# Task 989 — Revision 3 executor report (Review 4, F8-F12)

Kickoff: `tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md` ("## Revision 3"). Review: `docs/reviews/Task_989_Review_4.md`.
Executor: Sonnet, 2026-11-27. Base commit `debd90141`. Shell: Windows PowerShell 5.1 (the PowerShell tool) unless a line names Git Bash.
No Git command that writes was run; read-only `git status`, `git log`, `git diff`, `git show` only.

## Checklist I

| Item | Result |
|---|---|
| A0 | `node scripts/quality/owasp.mjs sync` → `owasp sync: 142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0`, exit 0; `node scripts/quality/owasp.mjs plan <kickoff>` exit 0 (no sheet beyond the kickoff's "## OWASP" list; the revision changes no action, query or output path). Read `.claude/rules/quality-gates.md` §1, §2, §4, §5, §8, §8.1. Per file kind: `.ts`/`.tsx` — ESLint and `tsc` (§1, §2); `.json` — parses (§1); Stories — no wrapper styling, no English literal (the F9/F11 gates); `.md` report — relative links only to existing files (§1). |
| I1 | `git status --short` → only `docs/backlog.md`, the kickoff, `docs/reviews/Task_989_Review_4.md` (Opus's documents); `git log --oneline -1` → `debd90141 Task 989: kickoff, Reviews 1-3 (APPROVED), OWASP record; Task 1022 archive; rules A5 and H1b`. |
| I2 | Scope of Revision 3: `scripts/ui-contract-registry.json`, `src/stories/mantine/primitives/AppImage.stories.tsx`, `src/stories/mantine/primitives/HeaderView.stories.tsx`, `src/components/admin/AdminSettings.tsx`, `src/components/admin/__tests__/adminFormsKit.test.ts`, `scripts/surface-census-baseline.json` (written by the command of item 4a), `src/modules/admin/lib/__tests__/adminLib.test.ts`, `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx` (new), `src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx` (new). |
| I3 | Read each file and its `main` diff (`git diff main --stat` / `git diff main -- <Stories>`); `main` drew the default mark as `Badge variant="light"` in the brand colour (Review 4 F10). |
| I4 | Below, "Failing first". |
| I5-I6 | Only the Scope files above changed. |
| I7 | `git diff --stat debd90141` below; every changed file read once. |
| I8 | Below, "Commands". |
| I8a | Below, "Measurements". The dev-server page is `BLOCKED` (fact below). |
| I9 | Below, "Breaks". |
| I10 | Not named by the kickoff: not run. |
| I11 | No CI check run locally: not `check:ui-contract`, `check:stories`, `check-badge-canonical`, `check:surface-census:changed` (only its `--update-baseline` of item 4a), `changed-lines-coverage`, no build, no full run. |

## `git diff --stat debd90141`

```
 docs/backlog.md                                    |  4 +-
 scripts/surface-census-baseline.json               | 50 +++-------------
 scripts/ui-contract-registry.json                  | 41 ++++++++++++++
 src/components/admin/AdminSettings.tsx             |  5 +-
 .../admin/__tests__/adminFormsKit.test.ts          | 11 ++++
 src/modules/admin/lib/__tests__/adminLib.test.ts   | 30 +++++++++-
 .../mantine/primitives/AppImage.stories.tsx        | 26 ---------
 .../mantine/primitives/HeaderView.stories.tsx      | 66 ++++++++++++----------
 ...prompt_Task_989_Site_Settings_Reach_The_Site.md | 10 ++++
 9 files changed, 139 insertions(+), 104 deletions(-)
```

Untracked: `src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx`, `src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx` (mine); `docs/reviews/Task_989_Review_4.md` (Opus's). `docs/backlog.md` and the kickoff are Opus's and were not touched.

## Per item

1. **F8** — `scripts/ui-contract-registry.json`: two entries appended after `mantine-delete-icon-button`, exactly as the prompt gives them: `admin-footer-manager` (Story exports `Default`, `Empty`, `NotInitialized`, `Forbidden`, each present at `src/stories/patterns/mantine/AdminFooterManager.stories.tsx:32,35,41,47`) and `admin-settings` (token owners `theme.ts`, `badgeTones.ts`; exports `Default`, `Empty` at `AdminSettings.stories.tsx:25,34`).
2. **F9, F11** —
   - `AppImage.stories.tsx`: the `BrandLogo` Story, its comment and `DEMO_LOGO` removed. No import was used only by it (`Box` is used by `Placeholder`, `useMantineTheme` by `VariantCases`, `Stack`/`Text` by `Default`), so no import changed. The file is now byte-identical to `main` (diff index `707532000..041724840`, `041724840` being `main`'s blob). The `alt="Lero.al"` line of F11 left with it.
   - `HeaderView.stories.tsx`: `WithLogo` renders only `<MantineStoryShell><HeaderView {...common} isAuthenticated={false} user={null} notificationSlot={undefined} /></MantineStoryShell>`; new `WithLogoSignedIn` renders `<MantineStoryShell><HeaderView {...common} isAuthenticated user={{ name: 'Alba Krasniqi', avatar_url: null, role: 'user' }} notificationSlot={realBell} /></MantineStoryShell>` with the real bell of `Default`. The shared props object moved into one function `logoProps(locale)` used by both. The comment above `WithLogo` now says it is the guest header and names `WithLogoSignedIn`. `Default` and `SigningOut` unchanged; no Stack or Text in either logo Story; no new storybook message key.
3. **F10** — `AdminSettings.tsx`: `Badge` left the `@mantine/core` import; `import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'`; the mark is `<MantineBadge variant="tone" tone="brand" size="xs">DEFAULT</MantineBadge>`. Test: `adminFormsKit.test.ts` "the settings form draws the default-language mark with MantineBadge, not the Mantine Badge" (no `Badge` in the `@mantine/core` import, the `MantineBadge` import, the exact element, no `<Badge`).
4. **F12** —
   a. Baseline: below.
   b. `adminLib.test.ts`, `describe('getSettings')`: an empty key list returns `{}`, with `createAdminClient` set to throw and `db.log` empty (no client, no query); rows map to `{ key: value }`, a key without a row is absent, and the one query is on `site_settings` with filters exactly `[['key', 'in', [<the keys given>]]]`; a client whose `.in()` resolves `{ data: null, error }` makes it reject with `site_settings read failed`.
   c. `footerPage.test.tsx` (new): `requireStaffPage`, `getAdminLocale`, `getTranslations`, `getAllFooterContent` mocked (the footer actions module also stubs `saveFooterShared` and `upsertFooterContent`, which `AdminFooterManager` imports); the page's element tree is walked to the `AdminFooterManager` element: `initialData`, `initialShared`, `initialized`, `serverError` are the read's `data`, `shared`, `initialized`, `error` (a successful read, and a `forbidden` read); the call order is exactly `requireStaffPage {"adminOnly":true}`, then `getAllFooterContent`.
   d. `settingsPage.test.tsx` (new): `getAllSettings` mocked (and `saveSettings`, which `AdminSettings` imports, as `AdminSettings.seo.test.tsx:18` does); the `AdminSettings` element's `initialSettings` has exactly the keys of `SETTINGS_FORM_KEYS`; an empty store gives `site_name` `Lero.al`, `archived_noindex_days` `String(ARCHIVED_NOINDEX_DAYS)`, `default_locale` `sq` and `''` for every other key; stored values win; `social_facebook`, `about_al`, `tagline` in the store do not reach the form; the call order is exactly `requireStaffPage {"page":"page.settings"}`, then `getAllSettings`.
5. Commands quoted below with their printed lines and exit codes.

### Item 4a — the census baseline

`node scripts/check-surface-census-changed.mjs --base main --update-baseline` (PowerShell), last lines as printed:

```
Baseline updated -> scripts\surface-census-baseline.json
    version: 1
    entries written: 256 (carried-forward entries for the 268-entry prior baseline's un-censused surfaces are preserved, not deleted)
PASS  check:surface-census:changed:update-baseline — baseline written, no tier-2 refusals.
EXIT=0
```

`git diff -U0 -- scripts/surface-census-baseline.json`:

```
@@ -93,0 +94,3 @@
+    "src/app/[locale]/(site)/cabinet/statistics/page.tsx :: src/app/[locale]/(site)/cabinet/statistics/page.tsx :: tier1-unenrolled-or-unstoried": {
+      "reasonCode": "tier1-unenrolled-or-unstoried"
+    },
@@ -130 +133 @@
-    "src/app/[locale]/layout.tsx :: src/app/[locale]/layout.tsx :: tier1-unenrolled-or-unstoried": {
+    "src/app/[locale]/(site)/layout.tsx :: src/app/[locale]/(site)/layout.tsx :: tier1-unenrolled-or-unstoried": {
@@ -301,15 +303,0 @@
-    "src/app/[locale]/admin/footer/page.tsx :: src/components/admin/AdminFooterManager.tsx :: tier1-unenrolled-or-unstoried": {
-      "reasonCode": "tier1-unenrolled-or-unstoried"
-    },
-    "src/app/[locale]/admin/footer/page.tsx :: src/components/ui/button.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
-    "src/app/[locale]/admin/footer/page.tsx :: src/components/ui/input.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
-    "src/app/[locale]/admin/footer/page.tsx :: src/components/ui/label.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
-    "src/app/[locale]/admin/footer/page.tsx :: src/components/ui/tabs.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
@@ -493,21 +480,0 @@
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/admin/AdminInput.tsx :: tier1-unenrolled-or-unstoried": {
-      "reasonCode": "tier1-unenrolled-or-unstoried"
-    },
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/admin/AdminSettings.tsx :: tier1-unenrolled-or-unstoried": {
-      "reasonCode": "tier1-unenrolled-or-unstoried"
-    },
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/shared/Combobox.tsx :: tier1-unenrolled-or-unstoried": {
-      "reasonCode": "tier1-unenrolled-or-unstoried"
-    },
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/ui/button.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/ui/input.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/ui/label.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
-    "src/app/[locale]/admin/settings/page.tsx :: src/components/ui/textarea.tsx :: tier2-legacy-primitive": {
-      "reasonCode": "tier2-legacy-primitive"
-    },
@@ -549,0 +517,3 @@
+    "src/app/[locale]/layout.tsx :: src/app/[locale]/layout.tsx :: tier1-unenrolled-or-unstoried": {
+      "reasonCode": "tier1-unenrolled-or-unstoried"
+    },
@@ -801,6 +770,0 @@
-    },
-    "src/app/[locale]/(site)/layout.tsx :: src/app/[locale]/(site)/layout.tsx :: tier1-unenrolled-or-unstoried": {
-      "reasonCode": "tier1-unenrolled-or-unstoried"
-    },
-    "src/app/[locale]/(site)/cabinet/statistics/page.tsx :: src/app/[locale]/(site)/cabinet/statistics/page.tsx :: tier1-unenrolled-or-unstoried": {
-      "reasonCode": "tier1-unenrolled-or-unstoried"
```

The text diff also moves three existing keys. Key comparison (Git Bash `git show HEAD:scripts/surface-census-baseline.json` to a scratch file, then a Node script parsing both files and comparing `blocks`), as printed:

```
entries before 268 after 256
removed 12
  - src/app/[locale]/admin/footer/page.tsx :: src/components/admin/AdminFooterManager.tsx :: tier1-unenrolled-or-unstoried
  - src/app/[locale]/admin/footer/page.tsx :: src/components/ui/button.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/footer/page.tsx :: src/components/ui/input.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/footer/page.tsx :: src/components/ui/label.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/footer/page.tsx :: src/components/ui/tabs.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/settings/page.tsx :: src/components/admin/AdminInput.tsx :: tier1-unenrolled-or-unstoried
  - src/app/[locale]/admin/settings/page.tsx :: src/components/admin/AdminSettings.tsx :: tier1-unenrolled-or-unstoried
  - src/app/[locale]/admin/settings/page.tsx :: src/components/shared/Combobox.tsx :: tier1-unenrolled-or-unstoried
  - src/app/[locale]/admin/settings/page.tsx :: src/components/ui/button.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/settings/page.tsx :: src/components/ui/input.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/settings/page.tsx :: src/components/ui/label.tsx :: tier2-legacy-primitive
  - src/app/[locale]/admin/settings/page.tsx :: src/components/ui/textarea.tsx :: tier2-legacy-primitive
added 0 []
value changed 0 []
other top-level fields changed []
EXIT=0
```

Because the prompt's stop condition reads "if it changes anything else", the executor asked the owner before going on. The owner's answer (2026-11-27), quoted: "Option 1. Keep scripts/surface-census-baseline.json as the command wrote it. Opus verified (2026-11-27): HEAD debd90141 → working tree 268 → 256 keys, removed exactly the 12 rows of Review 4 F12, added 0, changed 0; the three moved keys are the script's own key sort (scripts/check-surface-census-changed.mjs:270, `Object.keys(blocksObj).sort()`), the file at HEAD was not in that order. The stop condition of item 4a was about content, not order. In the report quote the diff, your key comparison and this answer. Continue with the remaining items."

## Failing first (I4)

The new cases ran on the unchanged product code (base `debd90141`), PowerShell:

`npm test -- src/components/admin/__tests__/adminFormsKit.test.ts src/modules/admin/lib/__tests__/adminLib.test.ts "src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx" "src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx"`

```
 ❯ src/components/admin/__tests__/adminFormsKit.test.ts (8 tests | 1 failed) 31ms
     × the settings form draws the default-language mark with MantineBadge, not the Mantine Badge 8ms
AssertionError: expected [ 'Badge', 'Box', 'Button', …(12) ] to not include 'Badge'
 Test Files  1 failed | 3 passed (4)
      Tests  1 failed | 48 passed (49)
```

Exit code 1. The MantineBadge case (item 3, a new product line) fails. The cases of items 4b-4d pin behaviour that already exists at `debd90141` (`getSettings`, `settings.ts:36-42`; the two pages) and pass on the base, as the prompt allows. Their sensitivity is shown by the breaks below (`getSettings`). For the two pages, no product line was broken (the prompt's I9 names only the MantineBadge swap and the `getSettings` body).

## Commands (I8)

All PowerShell.

1. `npm test -- src/components/admin/__tests__/adminFormsKit.test.ts src/modules/admin/lib/__tests__/adminLib.test.ts "src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx" "src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx" src/components/admin/__tests__/AdminSettings.seo.test.tsx src/components/admin/__tests__/AdminFooterManager.shared.test.tsx src/components/layout/__tests__/HeaderView.logo.test.tsx`
   ```
    Test Files  7 passed (7)
         Tests  68 passed (68)
   ```
   Exit 0.
2. `npm run typecheck` — first run (output piped to `Select-Object -Last 15`): printed `EXIT=2`; the run again with the output captured: `EXIT=1`, `total TS errors: 80`, `in src: 0`, `in .next: 80`. Every error is in `.next/types/validator.ts`, the generated file of an earlier local `next dev`/build, which names routes that no longer exist (for example `error TS2307: Cannot find module '../../src/app/admin/support/page.js'`). Errors in `src`: 0. `UNKNOWN`: the exit code on a tree without the stale `.next/types` (CI builds before it type-checks).
3. `npx eslint --no-warn-ignored --max-warnings 0 src/components/admin/AdminSettings.tsx src/components/admin/__tests__/adminFormsKit.test.ts src/modules/admin/lib/__tests__/adminLib.test.ts "src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx" "src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx" src/stories/mantine/primitives/AppImage.stories.tsx src/stories/mantine/primitives/HeaderView.stories.tsx` — no output, exit 0.
4. `npx vitest related --run --reporter=verbose` over every changed file (the seven above plus `scripts/ui-contract-registry.json` and `scripts/surface-census-baseline.json`):
   ```
   ✓ src/app/[locale]/admin/footer/__tests__/footerPage.test.tsx
   ✓ src/app/[locale]/admin/settings/__tests__/settingsPage.test.tsx
   ✓ src/components/admin/__tests__/adminFormsKit.test.ts
   ✓ src/components/admin/__tests__/AdminSettings.seo.test.tsx
   ✓ src/modules/admin/lib/__tests__/adminLib.test.ts
    Test Files  5 passed (5)
         Tests  52 passed (52)
   ```
   Exit 0.
5. Text search of §8.1 (Git Bash): `grep -rlE "components/admin/AdminSettings|stories/mantine/primitives/AppImage\.stories|stories/mantine/primitives/HeaderView\.stories|AppImage\.stories|HeaderView\.stories|ui-contract-registry|surface-census-baseline|admin/lib/__tests__/adminLib|admin/__tests__/adminFormsKit|footer/__tests__/footerPage|settings/__tests__/settingsPage|\bBrandLogo\b|\bWithLogoSignedIn\b|\bWithLogo\b" src scripts --include=*.test.ts --include=*.test.tsx --include=*.test.mjs` → `settingsPage.test.tsx`, `adminFormsKit.test.ts` (both run above) and `scripts/__tests__/check-design-tokens.test.ts` (lines 1228, 1253, 1267, 1273 name the HeaderView Story file); exit 0. No test names `BrandLogo`, `WithLogo` or `WithLogoSignedIn`.
6. `npm test -- scripts/__tests__/check-design-tokens.test.ts`:
   ```
    Test Files  1 passed (1)
         Tests  157 passed (157)
   ```
   Exit 0.

## Breaks (I9)

Each file was copied to the scratch folder first and restored from the copy; its SHA-256 before and after are equal (`AdminSettings.tsx` `97B6141B…3655`, `settings.ts` `EC195F6B…2302`).

- The MantineBadge swap removed (`Badge` back in the `@mantine/core` import, `<Badge variant="light" size="xs">DEFAULT</Badge>`), `npm test -- src/components/admin/__tests__/adminFormsKit.test.ts`:
  ```
       × the settings form draws the default-language mark with MantineBadge, not the Mantine Badge 3ms
  AssertionError: expected [ 'Badge', 'Box', 'Button', …(12) ] to not include 'Badge'
   Test Files  1 failed (1)
        Tests  1 failed | 7 passed (8)
  ```
  Exit 1. Restored, hash equal.
- The `getSettings` body replaced by `void keys; return {}`, `npm test -- src/modules/admin/lib/__tests__/adminLib.test.ts`:
  ```
       × maps the rows to key and value, and asks for exactly the keys given 5ms
       × a read error throws 2ms
  AssertionError: expected {} to deeply equal { …(2) }
  AssertionError: promise resolved "{}" instead of rejecting
   Test Files  1 failed (1)
        Tests  2 failed | 32 passed (34)
  ```
  Exit 1. Restored, hash equal. The stub also returns `{}` for an empty list, so the empty-list case was broken on its own as well: only the line `if (keys.length === 0) return {}` removed:
  ```
       × an empty key list is an empty map and creates no client 3ms
  Error: db down
   Test Files  1 failed (1)
        Tests  1 failed | 33 passed (34)
  ```
  Exit 1. Restored, hash equal.

## Measurements (I8a)

The owner's Storybook dev server (`http://localhost:6006`, HTTP 200), Playwright Chromium. Each Story was loaded in a same-origin iframe of the given width; values are computed styles and bounding boxes.

`Mantine/Primitives/HeaderView` (locale `en`):

| Story | Width | Headers | Header height | Logo height | Logo width | Logo loaded, `object-fit` | Header overflow | Page overflow |
|---|---|---|---|---|---|---|---|---|
| WithLogo | 320 | 1 | 97 | 28 | 138 | yes, contain | no | no |
| WithLogo | 640 | 1 | 65 | 28 | 138 | yes, contain | no | no |
| WithLogo | 1024 | 1 | 65 | 28 | 138 | yes, contain | no | no |
| WithLogo | 1440 | 1 | 65 | 28 | 138 | yes, contain | no | no |
| WithLogoSignedIn | 320 | 1 | 97 | 28 | 138 | yes, contain | no | no |
| WithLogoSignedIn | 640 | 1 | 65 | 28 | 138 | yes, contain | no | no |
| WithLogoSignedIn | 1024 | 1 | 65 | 28 | 138 | yes, contain | no | no |
| WithLogoSignedIn | 1440 | 1 | 65 | 28 | 138 | yes, contain | no | no |
| Default (comparison, wordmark) | 320 / 640 / 1024 / 1440 | 2 | 97 / 65 / 65 / 65 | wordmark link 28 | — | — | no | no |

The logo frame (`.frameLogo`) is 28px high, the same as the wordmark link of `Default`; the header heights equal `Default`'s at every width. No caption text and no wrapper outside the header. A screenshot of `WithLogoSignedIn` at 1440 shows the logo, Home and Listings, the language switch, the bell with 3, favourites and the user menu "Alba Krasniqi".

`Patterns/Mantine/AdminSettings` Default, tab "Localization", the `DEFAULT` mark, compared with the canonical `Mantine/Primitives/Badge` Default (the `tone="brand"` badge, and the `xs` size row):

| Element | Width | Height | Background | Text colour | Radius | Border | Padding | Font | Text transform | Shadow |
|---|---|---|---|---|---|---|---|---|---|---|
| AdminSettings DEFAULT | 320, 640, 1024, 1440 (identical) | 24 | rgb(236, 84, 71) | rgb(255, 255, 255) | 9999px | 1px solid transparent | 2px 8px | 12px / 500, line 18px | none | none |
| Canonical brand badge | 1440 | 24 | rgb(236, 84, 71) | rgb(255, 255, 255) | 9999px | 1px solid transparent | 2px 8px | 12px / 500 | none | none |
| Canonical `xs` badge (success) | 1440 | 24 | rgb(2, 122, 72) | rgb(255, 255, 255) | 9999px | 1px solid transparent | 2px 8px | 12px / 500 | none | none |

The mark sits on the "🇦🇱 Albanian" row (default `sq`); one `DEFAULT` mark per page; no row overflow and no page overflow at any width. The Storybook console logged only `Failed to load resource: … 404 (Not Found) @ http://localhost:6006/api/presence` while the AdminSettings Story was open. INFERENCE: not from this change, which adds no request; the source of the call was not traced.

`BLOCKED: the dev server page /uk/admin/settings in the owner's session` — the Chrome DevTools tool: "Could not connect to Chrome … Could not find DevToolsActivePort"; the Claude-in-Chrome tool: "Browser extension is not connected". The Playwright browser has no session: `http://localhost:3000/uk/admin/settings` redirected to `http://localhost:3000/uk/auth/login?next=%2Fuk%2Fadmin&session=lost`. The executor does not sign in with a password (the sign-in needs a Turnstile token and the session rules).

## Not done

- `BLOCKED`: I8a on the dev server `/uk/admin/settings` (above).
- No Git command run; the owner commits and pushes (Opus hands over the commands, checklist H).
