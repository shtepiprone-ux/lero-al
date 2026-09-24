# Task 875 — the Turnstile captcha follows the app locale

Sprint 81 · **P3** · QA profile **Q2** · depends on nothing · owner decision **D81-6** · owner actions **O81-6, O81-7** ·
**Status: 📝 KICKOFF FILED 2026-09-24, READY FOR SONNET**

Sprint plan: [`Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md`](Sprint_81_Signing_Out_Keeps_You_Where_You_Were.md)
(D81-6 is quoted verbatim there and in §5 below).

## 1. Mode and task type

`IMPLEMENTATION`: a one-option change to an enrolled component (`CaptchaWidget.tsx`), plus one new unit test.

- No new visual value, token, CSS rule, `className`, locale key, Story or Story export.
- Bundles:
  - **UI / Mantine current path**, because the change is visible inside a third-party iframe;
  - **Auth**, because the captcha sits on the Signup and Recovery request critical flows. Those flows are only read
    here, and their contract does not change.

## 2. Objective

Today the Cloudflare Turnstile captcha renders in the **browser's** language. After this task it renders in the
**app's** language:
- `/en` in English;
- `/it` in Italian;
- `/uk` in Ukrainian;
- `/sq` keeps today's behaviour (`auto`), because Cloudflare has no Albanian (D81-6).

## 3. Verified context — measured 2026-09-24 (re-measure at I0)

- **F1 (FACT).** `src/components/auth/CaptchaWidget.tsx` renders
  `<Turnstile ref siteKey onSuccess onError onExpire options={{ theme, size: 'flexible' }} aria-label style />` at
  `:62-73`. It passes **no `language`**. It already imports `useTranslations` from `next-intl` (`:5`).

  Without a site key (`:47`, `:53-60`) it renders `CaptchaDevFallback`, which calls `onSuccess('dev-noop-token')` and
  shows a localized note.
- **F2 (FACT, library source).** `@marsidev/react-turnstile` **1.5.2** (`package.json:127` `^1.5.2`, installed 1.5.2).
  - Its render config sets `language: d.language || 'auto'` (`node_modules/@marsidev/react-turnstile/dist/index.js`).
    `language` is in that memo's dependency list.
  - The effect that renders the widget removes it and renders it again when the config changes. A changed `language`
    therefore re-renders the widget; no key or remount is needed.
  - `index.d.ts:161-165` types `language?: string`. `:401` exports `type TurnstileLangCode`, which contains `en`, `it`
    and `uk` but **not `sq`**.
- **F3 (FACT, Cloudflare docs, fetched 2026-09-24).** `https://developers.cloudflare.com/turnstile/reference/supported-languages/`:
  - lists `en`, `it` and `uk` (and `en-us`, `it-it`, `uk-ua`);
  - has **no Albanian** (`sq`);
  - says *"Turnstile supports `auto` (default), which uses the visitor's browser language if it is supported."*
- **F4 (FACT).** The app locales are `['sq', 'en', 'uk', 'it']` (`src/i18n/routing.ts:4`).
- **F5 (FACT).** Consumers of `CaptchaWidget` are `src/modules/auth/components/AuthSheet.tsx:259` (register) and
  `:742` (forgot password), plus the Story `src/stories/patterns/mantine/AuthSheet.stories.tsx:135-141`: export
  `Captcha`, the real `CaptchaWidget` rendered standalone.

  Storybook wraps every story in `NextIntlClientProvider locale={context.globals.locale}` (`.storybook/preview.tsx:105-111`),
  so `useLocale()` follows the toolbar. The owner saw the real widget there in O81-2 (872). No test file imports
  `CaptchaWidget` today.
- **F6 (FACT, GR-1 census 2026-09-24, win32).** `node.exe scripts\check-surface-census.mjs --surface
  src/components/auth/CaptchaWidget.tsx` gives:
  - `Nodes visited: 1`, `manifest:yes story:yes className:0 ui-imports:0`;
  - `GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story; tier2 0 imports removed; tier3 0`;
  - exit 0.
- **F7 (FACT, simulation with the gate's own `runPipeline`/`compareToBaseline`/`computeBaselineUpdate`, 2026-09-24,
  win32).** With candidate `CaptchaWidget.tsx`:
  - the mapped surface is `src/components/auth/CaptchaWidget.tsx` only (it is a manifest root);
  - 0 new blocks, 0 stale keys, 0 baselined, and the updater changes nothing.

  **No census baseline change is expected.** A test file is excluded from mapping by the mapper itself.
- **F8 (FACT).** `vitest.config.ts` uses `environment: 'jsdom'` with no `include` restriction. `vi.stubEnv` is the house
  way to set an env var in a test (`src/app/api/cron/listing-activity/__tests__/route.test.ts:58`).
  `src/components/layout/__tests__/header-hydration-id-parity.test.tsx` is the house pattern for
  `NextIntlClientProvider` + `MantineProvider theme env="test"`.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Objective, F1–F4, D81-6 | `CaptchaWidget.tsx` reads the locale with `useLocale()` from `next-intl` and passes `language` inside the existing `options` object: `options={{ theme, size: 'flexible', language }}`. A module-level constant maps app locale → Turnstile code: `en → 'en'`, `it → 'it'`, `uk → 'uk'`. **Every other locale, `sq` included, gives `'auto'`** (D81-6). Type the constant with the library's exported `TurnstileLangCode`. A 1–3 line comment cites the Cloudflare list (F3) and D81-6. **No other change:** the props API, `CaptchaDevFallback`, `aria-label`, `style`, `theme`, `size` and the ref handle stay as they are. | P1 | AC1, AC2 | Confirmed |
| **R2** | R1 | New test `src/components/auth/__tests__/CaptchaWidget.language.test.tsx` (T1), specified in §10.3, with plants P1/P2 whose **run transcripts are kept**. | P1 | AC2, AC3 | Confirmed |
| **R3** | GR-3, GR-3a | No Story change. The existing `Patterns/Mantine/AuthSheet` → `Captcha` export already renders the real `CaptchaWidget` under the toolbar locale (F5). It is the visual proof (O81-6). | P2 | AC4 | Confirmed |

## 5. Assumptions and open questions

1. **DECIDED — D81-6 (owner, 2026-09-24).** The question was which language the captcha gets for `sq`. Verbatim answer
   chosen: *"auto for sq (Recommended)"*. The option read: *"sq passes \"auto\", Turnstile's current default: it uses
   the visitor's browser language if supported. Same as today for sq visitors, never worse than en. en/it/uk get their
   own code."*
2. **UNKNOWN, recorded and not needed.** F3 does not say what Turnstile does with an **unsupported** code. R1 never
   passes one, so the question does not arise.
3. **INFERENCE (from F2).** When the locale changes while the widget is mounted, the widget is removed and rendered
   again, and any token already issued is discarded. In the app this cannot happen while a form is open: a locale
   switch navigates to another `/<locale>` route, which remounts the sheet. In Storybook, switching the toolbar locale
   re-renders the widget, which is what O81-6 wants.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0, GR-1, GR-3a, GR-4, GR-6 (Sonnet: none of the git parts).
- `docs/agent-contract.md`: clauses 1, 3, 5, 7, 9, 10, 14, 16b–16d.
- `docs/mantine-responsive-design-system.md`: native props before custom work.
- `docs/component-rules.md`: "Container / Presentational Primitive Split". `CaptchaWidget` is a leaf; no split is
  required, and none may be added.
- `docs/critical-flow-registry.md`: the "Signup" and "Recovery request" rows, read only.
- `docs/qa-profiles.md`: the Q2 row.

## 7. Scope

Files the executor may create or change:
- `src/components/auth/CaptchaWidget.tsx`: R1 only
- `src/components/auth/__tests__/CaptchaWidget.language.test.tsx` *(new)*: T1
- `docs/sessions/2026-09-2?-task875-*.md` and `docs/sessions/evidence/task875/**`
- `docs/backlog.md`: the 875 state cell only

## 8. Out of scope

- Every file not listed in §7. In particular:
  - `AuthSheet.tsx`;
  - `AuthSheet.stories.tsx`, with no new Story or export;
  - `messages/*.json`;
  - `package.json`;
  - `docs/critical-flow-registry.md`;
  - `scripts/mantine-migration-scope.json`;
  - both census baselines.
- The server-side token check (`src/modules/auth/actions/captcha.ts`). Language never reaches the server.
- `theme` and `size`: unchanged.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Captcha on `/en`, `/it`, `/uk` | browser language (`auto`) | `en`, `it`, `uk` |
| Captcha on `/sq` | browser language (`auto`) | unchanged: `auto` (D81-6) |
| No `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | dev fallback note plus `onSuccess('dev-noop-token')` | unchanged |
| Token callbacks, `reset()` handle, `aria-label`, full width | as today | unchanged |
| Signup and password-recovery submission | token verified on the server | unchanged |

## 10. Implementation requirements

### 10.1 I0

1. Record the platform, then save the dirty-tree snapshot and the hash of every modified path:
   `node.exe -p "process.platform + ' ' + process.version"` must print `win32`.
   `git --no-optional-locks status --porcelain`, plus `git hash-object` of every ` M` path, go to
   `01-status-before.txt`.
2. Re-run F6's census → `02-census-I0.txt`. It must print 1 node, the `GR-1 CENSUS COMPLETE` line and exit 0.
3. Re-read F1 (`CaptchaWidget.tsx:62-73`) and F2 (the `language` fallback in the library `dist/index.js`, and
   `TurnstileLangCode` in `index.d.ts`).

A different result from any step is `PREMISE DRIFT`: stop and report.

### 10.2 GR receipts before the related write

- `GR-0 CANONICAL REUSE PREFLIGHT — request: Turnstile widget language follows the app locale; semantic queries: language, locale, useLocale, Turnstile, captcha; inspected candidates: @marsidev/react-turnstile options.language (native), CaptchaWidget.tsx, AuthSheet.stories.tsx Captcha export; decision: REUSE (the library's native options.language); selected canonical owner: src/components/auth/CaptchaWidget.tsx; Mantine/TailAdmin token path: NONE (no visual value; the widget is a Cloudflare iframe); new hardcoded visual values: NONE; rationale: the library already exposes the option, and only the value is missing.`
- `GR-3a STORY PREFLIGHT — CaptchaWidget × app-locale language; canonical candidates: Patterns/Mantine/AuthSheet → Captcha; direct-import evidence: src/stories/patterns/mantine/AuthSheet.stories.tsx:5; toolbar coverage: locale=NextIntlClientProvider from globals.locale (.storybook/preview.tsx:105-111), viewport=toolbar; decision: REUSE; target: Patterns/Mantine/AuthSheet → Captcha; rationale: the export renders the real widget, and the new state is only the toolbar locale.`
- At the end: `GR-1 CENSUS COMPLETE — 1 nodes; tier1 1 migrated+enrolled+story (CaptchaWidget, unchanged enrolment); tier2 0 imports removed; tier3 0.`

### 10.3 T1 — observable assertions

File `src/components/auth/__tests__/CaptchaWidget.language.test.tsx`.

**Setup:**
- `vi.mock('@marsidev/react-turnstile', …)` exports `Turnstile` as a `vi.fn(() => null)` that records its props.
  Export nothing else the component does not import.
- `vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key')` in `beforeEach`; `vi.unstubAllEnvs()` in
  `afterEach`.
- Render `CaptchaWidget` with no-op callbacks inside `NextIntlClientProvider locale={l} messages={messages/<l>.json}`
  and `MantineProvider theme env="test"` (F8).

**Cases:**
- **`it.each`, the four locales.** The last `Turnstile` call's `options` **equals** `{ theme: 'auto', size: 'flexible',
  language: <expected> }`, where `sq → 'auto'`, `en → 'en'`, `uk → 'uk'`, `it → 'it'`.

  The assertion covers the whole `options` object, so the preservation of `theme`/`size` is proven in the same case.
- **Dev fallback preserved.** With `vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')`:
  - `Turnstile` is not called;
  - the `onSuccess` spy is called once with `'dev-noop-token'`;
  - the localized `auth.captcha_not_configured` text for `en` is rendered.

**Plants.** Take a `git hash-object` witness before each plant and after its restore, and restore with the Edit tool.
Each run's full output is kept:
- **P1.** Remove `language` from `options`. The four locale cases must fail. `sq` fails too: `undefined` is not
  `'auto'`.
- **P2.** Map `sq → 'sq'`. Only the `sq` case must fail.

### 10.4 Rules

- No new `className`, style, CSS, token, locale key, Story or export.
- UTF-8 without BOM. Read and write through Node `fs` or the Edit tool; never through `Get-Content -Raw` without
  `-Encoding utf8`.

## 11. Positive and negative flows

**Positive.**
1. A visitor on `/it` opens Register in the auth sheet.
2. The Turnstile widget's text is Italian.
3. Completing the captcha issues a token exactly as today, and registration continues.

| Branch | Applicable | Source | Expected | Evidence |
|---|---:|---|---|---|
| `sq` locale | Yes | D81-6 | `language: 'auto'`, which is today's behaviour | T1 `sq` case; O81-6 |
| Missing site key | Yes | F1 | dev fallback unchanged | T1 fallback case |
| Locale switched while the widget is mounted | Yes | F2, §5 item 3 | the widget re-renders in the new language | O81-6 (toolbar switch) |
| Unsupported code sent to Cloudflare | No — R1 sends only `en`/`it`/`uk`/`auto` | F3 | — | T1 |
| Token verification fails | No — server-side, unchanged | `captcha.ts` | — | `test:auth` regression |

## 12. Acceptance criteria

- **AC1 [R1]** Given the diff of `CaptchaWidget.tsx`, when read, then it adds:
  - the `useLocale` import;
  - the `TurnstileLangCode` type import;
  - the locale → code constant;
  - the `language` key inside the existing `options`;
  - the short comment.

  Nothing else in the file changes.
- **AC2 [R1, R2]** Given T1, when run, then its cases pass. **P1** fails all four locale cases, and **P2** fails only
  the `sq` case. Both run transcripts show `EXIT_CODE=1`, and each post-restore hash equals its pre-plant hash.
- **AC3 [R2]** Given `npm.cmd run test:auth`, when run, then it exits 0 (regression for Signup and Recovery request).
- **AC4 [R3]** Given `29-status-after.txt`, when read, then `src/stories/patterns/mantine/AuthSheet.stories.tsx` does
  not appear in it: the file is tracked and clean at I0, so absence means unchanged. `check:story-coverage` and
  `build-storybook` also exit 0.
- **AC5 [all]** Given the §13.2 block, when run, then:
  - `typecheck`, `lint`, `check:rendered-scope` (and `:verify`), `check:surface-census:changed --base` (and
    `:verify`), `check:file-integrity`, `check:mojibake` and `npm run build` exit 0;
  - `03-census-changed.txt` reports the mapped surface `src/components/auth/CaptchaWidget.tsx` with 0 new and 0
    stale;
  - the final status lists no path outside §7 beyond those in `01-status-before.txt`.
- **AC6 [Objective] — owner, before approval (O81-6)** — the Storybook matrix in §13.3.
- **AC7 [Objective] — owner, after deploy (O81-7)** — the live check in §13.3. It is not an approval gate. Like
  O81-1 and O81-3, it is recorded when it is done.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none. AC1's "nothing else" names a fixed change set; AC5's "0 new / 0 stale" is measured (F7).`

## 13. QA profile and verification plan

**Q2.** An existing surface changes only the language of a third-party iframe, so this is a standard UI change. The
unit test proves the wiring. The owner's rendered check proves what Cloudflare shows. `test:auth` and the build
guard the two critical flows the widget sits on.

### 13.1 Re-entry

From scratch. Evidence root: `docs/sessions/evidence/task875/`.

### 13.2 Gate block (executor, Windows PowerShell, project root, after the R1/R2 edits)

```powershell
$ev = "docs\sessions\evidence\task875"
$base = git --no-optional-locks rev-parse HEAD
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
npx.cmd vitest run src/components/auth/__tests__/CaptchaWidget.language.test.tsx *>&1 | Tee-Object "$ev\11-new-test.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\12-test-auth.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\15-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/components/auth/CaptchaWidget.tsx *>&1 | Tee-Object "$ev\16-census-captcha.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\17-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\18-rendered-scope-verify.txt"
node.exe scripts\check-surface-census-changed.mjs --base $base *>&1 | Tee-Object "$ev\03-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\20-census-changed-verify.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\24-build-storybook.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\27-build.txt"
git --no-optional-locks hash-object src/components/auth/CaptchaWidget.tsx src/components/auth/__tests__/CaptchaWidget.language.test.tsx src/stories/patterns/mantine/AuthSheet.stories.tsx *>&1 | Tee-Object "$ev\28-hash-object.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
```

After each command, append its exit code to its file, following the 876 convention:
`"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>`.

Expected results:
- `10` prints `win32`.
- `11`: every T1 case passes.
- `12`–`15` exit 0.
- `16`: 1 node, exit 0.
- `17`, `18`, `03` and `20` exit 0. `03` names only the CaptchaWidget surface, with 0 new and 0 stale.
- `24`–`27` exit 0.
- `29`: `AuthSheet.stories.tsx` is absent (AC4).

**Plants, after `27`.** Order: pre-hash → apply the plant (Edit tool) → run → append `EXIT_CODE` → restore → post-hash.

```powershell
$ev = "docs\sessions\evidence\task875"
git --no-optional-locks hash-object src/components/auth/CaptchaWidget.tsx *>&1 | Tee-Object "$ev\plant-p1-pre-hash.txt"
npx.cmd vitest run src/components/auth/__tests__/CaptchaWidget.language.test.tsx *>&1 | Tee-Object "$ev\plant-p1-run.txt"
"EXIT_CODE=$LASTEXITCODE" | Add-Content "$ev\plant-p1-run.txt"
git --no-optional-locks hash-object src/components/auth/CaptchaWidget.tsx *>&1 | Tee-Object "$ev\plant-p1-post-hash.txt"
git --no-optional-locks hash-object src/components/auth/CaptchaWidget.tsx *>&1 | Tee-Object "$ev\plant-p2-pre-hash.txt"
npx.cmd vitest run src/components/auth/__tests__/CaptchaWidget.language.test.tsx *>&1 | Tee-Object "$ev\plant-p2-run.txt"
"EXIT_CODE=$LASTEXITCODE" | Add-Content "$ev\plant-p2-run.txt"
git --no-optional-locks hash-object src/components/auth/CaptchaWidget.tsx *>&1 | Tee-Object "$ev\plant-p2-post-hash.txt"
npx.cmd vitest run src/components/auth/__tests__/CaptchaWidget.language.test.tsx *>&1 | Tee-Object "$ev\11b-new-test.txt"
```

Expected results:
- `plant-p1-run`: `EXIT_CODE=1`, the four locale cases fail, and the fallback case passes.
- `plant-p2-run`: `EXIT_CODE=1`, only the `sq` case fails.
- Each post-hash equals its pre-hash, and both equal the `CaptchaWidget.tsx` line in `28`.
- `11b` passes.

### 13.3 Owner steps

1. **O81-6 — `OWNER VISUAL QA REQUIRED`, before approval.** Open `Patterns/Mantine/AuthSheet` → `Captcha`.

   | Toolbar locale | Viewports | Expected widget text |
   |---|---|---|
   | `en` | 320, 1440 | English |
   | `it` | 320, 1440 | Italian |
   | `uk` | 320, 1440 | Ukrainian |
   | `sq` | 320, 1440 | the language of **your browser** (D81-6) |

   That is 8 tuples. Record accepted or returned for each.
2. **O81-7 — after deploy, on lero.al.** Open the auth sheet's Register view on `/en`, `/it`, `/uk` and `/sq`. The
   widget text matches the table above. Complete one real registration **or** one password-recovery request on any
   locale to confirm the token still verifies.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approved.

Report:
- changed files with their hashes (`28`);
- R1–R3 and AC1–AC5 status (AC6 = `MISSING EVIDENCE`, owed by the owner; AC7 after deploy);
- every §13.2 command with its exit code;
- the I0 results;
- the plant transcripts and hashes;
- the GR-0, GR-3a and GR-1 receipts;
- deviations and limitations.

Update the 875 backlog state cell. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — facts cited by file:line, D81-6 verbatim, commands in §13.2 |
| Two-armed control | P1 (no `language`) fails every locale case; P2 (`sq → 'sq'`) fails only `sq`. Transcripts are kept, not only hashes (876's review 1 lesson). |
| Detector blind spot stated | T1 proves what is passed to the library, not what Cloudflare renders; that is O81-6/O81-7. `check:surface-census:changed` sees only the mapped `CaptchaWidget` surface (F7). |
| GR-1 | census at design time (F6): 1 node, complete |
| Owner decision quoted | D81-6 verbatim (§5 item 1 and the sprint plan) |
| Dirty worktree | I0 snapshot with hash witnesses; AC5 comparator |
| Critical flows | Signup and Recovery request are read only; `test:auth` and `build` are the regression guard |
