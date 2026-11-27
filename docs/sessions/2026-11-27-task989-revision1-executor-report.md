# Task 989 — Revision 1, executor report (Sonnet)

Kickoff: [Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md](../../tasks/Sprints/Sprint_94_kickoff_prompt_Task_989_Site_Settings_Reach_The_Site.md) ·
Review: [Task_989_Review_1.md](../reviews/Task_989_Review_1.md), "Revision 1 (for the implementer)" · Base commit `6dedcb419` ("Task 989: the
implementation as reviewed in Review 1, before Revision 1"). No Git command that writes was run.

## Owner decisions taken in this session (2026-11-27, translated)

- Item 3, the delete control: "`touch` at every width" — `MantineDeleteIconButton` has two sizes only (22px without `touch`, 44px with it) and its file is
  outside the Scope, so the delete control is 44×44 at every width (≥ 32px from 640px holds); the handle, up and down are 44px below 640px and 32px from 640px.
- Item 1f, `adminOrphans.test.ts`: "extend the detector" — with the keys imported (21) and `TASK_930_KEYS` empty, the detector, which counted only
  `getSetting('<key>'` and `key=eq.<key>` as a reader, reported 17 of 21 keys as unread (output below), although `settingsReach.test.ts` (AC1) finds their
  readers. A file outside the admin code that imports `getSettings` from `@/modules/admin/lib/settings` and names the key (quoted, as the template
  `<base>_${` of a per-language key, or through `FOOTER_SETTING_KEYS` for one of its keys) now counts as a reader; one planted case pins it and its controls.

## A0 — documents read

`node scripts/quality/owasp.mjs sync` → `owasp sync: 142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0`, exit 0;
`node scripts/quality/owasp.mjs plan <kickoff>` → exit 0 (sheets as the kickoff's "## OWASP"; Input_Validation and Denial_of_Service hold item 4);
`.claude/rules/quality-gates.md` §1, §2, §4, §5, §8, §8.1; `.claude/rules/project-facts.md`; checklists A, I, U. Kinds of file changed and their rule:
`.ts`/`.tsx` — parse, ESLint, `tsc` (§1, §2: run below); `.ico` — binary type matches its signature (§1: same bytes, moved); `.md` (this report) — relative
links resolve (§1).

## `git diff --stat 6dedcb419 -- src public`

```
 src/__tests__/security/staffActions.test.ts        |  53 +++++++++++++++
 .../[locale]/(site)/__tests__/siteLayout.test.tsx  |   7 +-
 src/app/[locale]/(site)/layout.tsx                 |   7 +-
 src/app/[locale]/__tests__/layoutBrand.test.ts     |  36 ++++++++---
 src/app/[locale]/admin/layout.tsx                  |   5 +-
 src/app/favicon.ico                                | Bin 25931 -> 0 bytes
 src/components/admin/AdminFooterManager.tsx        |  11 ++--
 .../__tests__/AdminFooterManager.shared.test.tsx   |  40 ++++++++++++
 .../layout/__tests__/FooterView.security.test.tsx  |   7 +-
 .../__tests__/headerFooterContainers.test.tsx      |  10 ++-
 src/modules/admin/__tests__/adminOrphans.test.ts   |  72 +++++++++++++++------
 .../pages-and-footer-validation.smoke.test.ts      |  49 +++++++-------
 .../__tests__/userAdministration.security.test.ts  |   8 +--
 src/modules/admin/actions/footer.ts                |  10 ++-
 src/modules/admin/lib/settingKeys.ts               |  20 ++++++
 .../mantine/primitives/AppImage.stories.tsx        |   3 +-
 16 files changed, 261 insertions(+), 77 deletions(-)
```

Untracked: `public/favicon.ico` (sha256 `2b8ad2d33455a8f736fc3a8ebf8f0bdea8848ad4c0db48a2833bd0f9cd775932`, the same as the removed `src/app/favicon.ico`).
Opus's documents in the tree (`docs/`, `tasks/`, `.claude/rules/`) were not touched.

## Per item

1. **F1 — six tests follow the kickoff.**
   - a. `siteLayout.test.tsx`: mocks `getSettings` → `{}`; imports `generateMetadata`; the title is "Lero.al — Real estate marketplace in Albania".
   - b. `pages-and-footer-validation.smoke.test.ts`: `social_links` left `EMPTY_FOOTER_PAYLOAD` (its type omits it) and the payloads of the old lines
     167 and 185; the positive case asserts the upsert payload has no `social_links`; the scheme cases call `saveFooterShared({ settings: {}, social_links: [link] })`
     as an administrator and expect `invalid_url` with no `site_footer` update, no `site_settings` upsert and no upsert; the https, mailto and tel links are saved
     through `saveFooterShared` (update to `locale` in sq, en, uk, it). The mock gained `site_footer.update().in()` and `site_settings.upsert()`. Fact: the
     scheme list `SCRIPT_URLS` holds eight values (the owner's prompt says "nine" and lists eight); all eight run, the navigation-link cases are unchanged.
   - c. `FooterView.security.test.tsx` `[SEC-S09-SRV-DENY]`: `saveFooterShared` with each unsafe link, the caller an administrator (`@/lib/auth/staff` mocked),
     `createAdminClient` still throws, so the refusal comes before any database client.
   - d. `headerFooterContainers.test.tsx`: a social list with none enabled gives no social link; a failing `getFooterContent` gives the built-in Facebook and
     Instagram links. The file's header comment now says so.
   - e. `userAdministration.security.test.ts`: the stored keys are the form's only (`social_facebook` dropped); the script case is `logo_url: 'java\tscript:alert(1)'`,
     the over-5000 case `site_name`; `site_name` of exactly 5000 characters is saved.
   - f. `adminOrphans.test.ts`: the real-tree keys are `SETTINGS_FORM_KEYS` + `FOOTER_SETTING_KEYS` (21, unique); `TASK_930_KEYS` is empty; the two titles
     changed; `findSettingFindings` takes the key list (the planted cases keep parsing their planted `SETTING_KEYS` block, unchanged); the detector extension of the
     owner's decision above with its planted case.
2. **F2 — one tab icon.** `src/app/favicon.ico` → `public/favicon.ico` (same bytes). `(site)/layout.tsx` and `admin/layout.tsx`: `icons: { icon: <accepted saved
   favicon> }`, else `{ icon: '/favicon.ico' }`, also on a failed read; the comment at `(site)/layout.tsx:34-35` updated. `layoutBrand.test.ts`: each refused value
   and a failed read give `{ icon: '/favicon.ico' }` for both layouts; an accepted one gives that value; a new admin case runs accepted, refused, empty and failed
   read and checks that `src/app/favicon.ico` is absent and `public/favicon.ico` present.
3. **F3 — link row controls.** `AdminFooterManager.tsx:67-69,75,82,86,96`: handle, up and down `mih`/`miw` `{ base: theme.other.touchTarget, sm: theme.other.iconSize.prominent }`
   (44px, 32px); the delete `MantineDeleteIconButton touch` (owner's decision). Test in `AdminFooterManager.shared.test.tsx`: reads each control's size below and
   from 640px from Mantine's inline style rule and its `@media(min-width: 40em)` rule.
4. **F4 — bounds.** `settingKeys.ts:70-88` `withinFooterBounds(lists, texts)`: ≤ 50 links per list, `id` ≤ 64, `label` ≤ 200, `url` ≤ 2048, each text ≤ 5000
   (`SETTING_MAX_LENGTH`); a list that is not a list is out of bounds. `footer.ts:151` (`saveFooterShared`, after the admin check and the settings check, before any
   database call) and `footer.ts:195-199` (`upsertFooterContent`, right after the locale check) → `{ error: 'validation' }`. Tests in `staffActions.test.ts`
   ("Revision 1, F4"): each bound at it (saved) and one over (refused, no write, no side effect) — `saveFooterShared`: 4 cases; `upsertFooterContent`: the four
   link bounds × `nav_links` and `info_links` and the six text fields (14 cases).
5. **F5** — every summary line below is copied from the output; exit codes as printed by `echo "EXIT=$?"`.
6. **F6** — `AppImage.stories.tsx:137-139`: a Cloudinary logo is fitted into 84px of height (`h_84,c_fit,f_auto,q_auto`), its width kept; a non-Cloudinary fixture
   (`DEMO_LOGO`) is served as it is (`safeImageSrc` passes a root path unchanged, `appImageConfig.ts`).

## I4 — failing first (new cases on the unchanged product code)

`npm test -- layoutBrand.test.ts AdminFooterManager.shared.test.tsx staffActions.test.ts siteLayout.test.tsx pages-and-footer-validation.smoke.test.ts FooterView.security.test.tsx headerFooterContainers.test.tsx userAdministration.security.test.ts adminOrphans.test.ts` → `EXIT=1`

```
 Test Files  3 failed | 6 passed (9)
      Tests  28 failed | 445 passed (473)
```

Failed: the 18 bound cases of `staffActions.test.ts` (each at its "over" call, lines 370, 383, 395: `expected {} to deeply equal { error: 'validation' }`, the
address cases `expected { error: 'invalid_url' } …`), the 9 icon cases of `layoutBrand.test.ts` (`expected undefined to deeply equal { icon: '/favicon.ico' }`)
and the control-size case of `AdminFooterManager.shared.test.tsx` (`handle width below 640px: expected 0 to be greater than or equal to 44`). The item 1 cases
follow the code of the base commit, so they pass on it; before their edit they were the failures Review 1 F1 reproduced. `adminOrphans.test.ts` with the keys
imported and the old detector (before the owner's decision): `Test Files  1 failed (1)`, `Tests  1 failed | 8 passed (9)` — 17 keys "no reader outside the admin code"
(`logo_url`, `favicon_url`, the eight `meta_*_<locale>`, `contact_phone`, `contact_email`, `contact_email_sales`, the four `footer_show_*`).

## Commands on the final tree

| Command | Printed summary | Exit |
|---|---|---|
| `npm test --` the 15 files of the owner's list | ` Test Files  15 passed (15)` / `      Tests  600 passed (600)` | 0 |
| `npm run typecheck` | 80 errors, all in `.next/types/validator.ts` (untracked, gitignored by `.gitignore:18`, built 2026-11-21; e.g. `.next/types/validator.ts(959,39): error TS2307: Cannot find module '../../src/app/admin/layout.js'`); 0 in `src` | 2 |
| `npx eslint --no-warn-ignored --max-warnings 0` the 15 changed code files | no output | 0 |
| `npx vitest related --run --reporter=verbose` the 15 changed code files (`public/favicon.ico` excluded; the removed `src/app/favicon.ico` has no path) | ` Test Files  45 passed (45)` / `      Tests  922 passed (922)` | 0 |
| §8.1 text search (each changed path without `src/` and extension, `favicon`, `withinFooterBounds`) → 18 test files, 5 not in the graph's set; `npm test --` those 5 (`HeaderView.logo` — comment only; `sanitizeReturnTo` — a test title naming `admin/layout.tsx`; `footerContent.security` — reads `footer.ts` as text; `middlewareScope.security`, `sessionMiddleware` — `/favicon.ico` in the proxy matcher cases) | ` Test Files  5 passed (5)` / `      Tests  66 passed (66)` | 0 |
| `SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<from .env.local, 20 characters> npx vitest related --run --reporter=verbose --config vitest.integration.config.ts` the 15 files | ` Test Files  8 passed (8)` / `      Tests  52 passed (52)` | 0 |

No `scripts/quality/*.test.mjs` matched the text search. `[SEC-T1-SRV-BUILT-PROXY]` (`proxyFile.test.ts`) and `[SEC-S28-INT-DENY]`
(`serverActionManifest.integration.test.ts`) were not reached by this change (neither search found them), so neither ran; `src/proxy.ts` is unchanged.

## I9 — deliberate breaks (each restored, sha256 identical after restore)

- The bound helper: `return true` as the first line of `withinFooterBounds` → `npm test -- src/__tests__/security/staffActions.test.ts` → `EXIT=1`,
  ` Test Files  1 failed (1)`, `      Tests  18 failed | 238 passed (256)`: exactly the 18 bound cases.
- The single-icon rule: both layouts back to their base-commit text and the icon copied back to `src/app/favicon.ico` → `npm test -- "src/app/[locale]/__tests__/layoutBrand.test.ts"`
  → `EXIT=1`, ` Test Files  1 failed (1)`, `      Tests  9 failed | 28 passed (37)`: the 7 refused favicons, the failed read, the admin single-icon case.

## I8a — measured

Storybook dev server (Playwright), `Patterns/Mantine/AdminFooterManager` Default, 5 link rows, each row's handle / up / down / delete (width × height):

| Width | Handle | Up | Down | Delete | Page overflow |
|---|---|---|---|---|---|
| 320 | 44×44 | 44×44 | 44×44 | 44×44 | none |
| 640 | 32×32 | 32×32 | 32×32 | 44×44 | none |
| 1024 | 32×32 | 32×32 | 32×32 | 44×44 | none |
| 1440 | 32×32 | 32×32 | 32×32 | 44×44 | none |

At 1440: radius 8px on all four; colour `rgb(52, 64, 84)` (handle, down), `rgb(102, 112, 133)` on the disabled "up", `rgb(180, 35, 24)` on the delete; the
row switch track 38×20, radius 1000px (as Review 1 V5a). Compared with `main` (`h-8 w-8`, 32px, `main` `AdminFooterManager.tsx:78,91`): equal from 640px for
handle, up, down; the delete is 44px (owner's decision). Console: one 404 for `/api/presence` on the Storybook server (no such route there; not the changed code).

Dev server: `/uk` (Playwright, no session) — server HTML (`curl` and `fetch('/uk')`) holds exactly one icon link,
`<link rel="icon" href="https://res.cloudinary.com/die7okukn/image/upload/v1795042640/favicon-16x16_zhhnmq.png"/>`; the DOM holds 1 icon link at 320, 640, 1024
and 1440, no page overflow; `/favicon.ico` → 200, `image/x-icon`, 25931 bytes (from `public/`). Console: Google One Tap (FedCM) errors of a signed-out browser.

BLOCKED: `/uk/admin/footer` in the owner's session — the Claude-in-Chrome extension is not connected and Chrome has no remote debugging
(`DevToolsActivePort` missing), so no signed-in admin page could be opened: its icon links and its link row sizes on the dev server were not measured. A scripted
admin sign-in would send a password to the hosted Supabase project, which this session may not do.

## For Opus (A4: holes seen, not fixed in this revision)

- A bound refusal from a language tab (`upsertFooterContent` → `validation`, item 4) reaches `showResult` (`AdminFooterManager.tsx`), whose `validation` toast is
  `error_invalid_contact`, "Check the phone and the e-mail addresses: one address each, a phone of digits." (`messages/en.json:1170`): wrong text for 51 links
  or a 5001-character field. The editor itself sets no limit on adding links.
- Item 1d says the built-in social links appear "only when `getFooterContent` fails"; `Footer.tsx:61` also shows them when there is no footer row (`footerData`
  null), and the unchanged case "without database content …" (`headerFooterContainers.test.tsx:207-214`) pins that. Not changed (outside the six items).
