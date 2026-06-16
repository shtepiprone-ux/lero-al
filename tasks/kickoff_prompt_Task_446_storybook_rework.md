# Task 446 (rework, in-scope) — `/auth/verified` Storybook contract-compliance + closeout

> **This is a rework WITHIN Task 446 — NOT a new task number.** Owner chose option A: close Task 446
> with ONE contract-clean commit, no Storybook debt deferred to a follow-up. The core route/page fix is
> already owner-native runtime-validated (confirmation link → `/uk/auth/verified`, header authenticated
> immediately, preserved on refresh, `/uk/cabinet` opens without login redirect). Do **not** touch the
> validated runtime behavior of `route.ts` / `page.tsx` except for the small, explicitly-listed items below.

## Why this rework exists (reviewer findings, 2026-06-16)

`src/stories/VerifiedPage.stories.tsx` violates the clause-13 / Sprint-33 no-hardcode Storybook contract:
- a hardcoded four-locale `STRINGS` literal map (clause 13a — every visible string must come from `t()`/`storyT()`);
- `globals: { locale: ... }` pins on every story (clause 13c — stories must be toolbar-reactive);
- it duplicates the page JSX (text already drifted: "use all features of the platform" vs real
  `verified_body` "browse listings and use all features");
- rendered proof came from a throwaway `scripts/task446-mobile-check.mjs`, not canonical `npm run screenshots:assert`.

The current `check:stories` regexes happen to miss these (nested-brace gap in Check 4; Check 7 only matches
`uk:'…'` not the `uk: {` object form) — a green gate here is a FALSE pass. We fix the file to satisfy the
contract in spirit, not just dodge the regex.

## Pre-read (Storybook / visual-snapshot task bundle, per `docs/rule-index.md`)

- `docs/agent-contract.md` (clauses 1–15; clause 13 + 15 are the load-bearing ones here)
- `docs/backlog.md`
- `docs/critical-flow-registry.md` — the Signup-confirmation row (already ✅; keep it accurate)
- `docs/storybook-governance.md` §14 (enforced gates) + §14.2 (`storyT`) + §14.4 (`screenshots:assert` is the only rendered proof)
- `docs/design-system.md` §26 (mobile <640 full-width / bottom-sheet) + §27 (Storybook proof contract)
- `docs/component-rules.md`, `docs/qa-rules.md`

**Canonical reference to copy the pattern from:** `src/stories/FeaturedListings.stories.tsx` (toolbar-reactive:
`const locale = (context?.globals?.locale as string) ?? 'en'`, NO `globals.locale` pin) and the helper
`src/stories/_storyI18n.ts` (`storyT(locale, key)` / `useStoryMessages(locale)`).

**Harness fact you must rely on:** `scripts/check-stories-rendered.mjs` iterates `LOCALES = ['sq','en','uk','it']`
× the viewport set for EVERY `ASSERT_STORIES` entry. Therefore one toolbar-reactive story per state is rendered
across all four locales and all viewports automatically. Per-locale exports (`ErrorSq320`, `ErrorEn320`, …) and
per-viewport exports (`SuccessMobile320/375/390`) are **redundant and forbidden** — remove them.

## Scope (exact files you may touch)

1. `src/stories/VerifiedPage.stories.tsx` — rewrite (see AC below).
2. `src/app/[locale]/auth/verified/VerifiedCard.tsx` — **NEW** presentational component (extraction; see AC2).
3. `src/app/[locale]/auth/verified/page.tsx` — refactor the three branches to render `<VerifiedCard>` (no behavior change); fix `generateMetadata` (AC8) if trivial.
4. `src/app/auth/confirm/__tests__/route.test.ts` — remove/repair the tautological "planted-violation proof" block (AC7).
5. `scripts/check-stories-rendered.mjs` — update `ASSERT_STORIES` to the final export IDs ONLY (AC5), after stories compile.
6. `docs/sessions/2026-06-16-task446-signup-confirm-session-mismatch.md` — update (AC9).
7. `docs/critical-flow-registry.md` — keep the Signup-confirmation command/row accurate if export IDs change.

Do **not** touch `messages/*.json` (the `auth.*` keys already exist with parity — reuse them; do NOT add a
parallel `storybook.auth.*` namespace). Do **not** change `route.ts` runtime logic. Do **not** create new throwaway scripts.

## Acceptance criteria

**AC1 — No hardcoded strings.** Delete the `STRINGS` literal map entirely. Every visible string in the story
comes from `storyT(locale, 'auth.<key>')` against the existing `auth.*` namespace
(`verified_title`, `verified_body`, `verified_browse`, `verified_error_title`, `verified_error_body`,
`verified_nosession_body`, `login`). No raw user-facing literal, no `aria-label` literal.

**AC2 — Shared presentational component (anti-drift).** Extract a server component
`VerifiedCard` (no hooks) taking resolved props, e.g.
`{ variant: 'success' | 'error' | 'syncfail'; title: string; body: string; ctaLabel: string; ctaHref: string }`,
that renders the exact card markup currently in `page.tsx` (icon by variant: `CheckCircle2`/`text-status-success`
for success, `XCircle`/`text-destructive` otherwise; CTA = `<Link className={cn(buttonVariants({size:'xl'}), 'w-full justify-center')}>`).
`page.tsx` renders `<VerifiedCard …/>` in each of its three branches (strings via server `t()`), and the story
renders the SAME `<VerifiedCard …/>` (strings via `storyT()`). This guarantees structure + text are single-source
and cannot drift. The CTA MUST remain full-width at <640 (`w-full` is acceptable — it is full-width at every
breakpoint, which satisfies the <640 gate).

**AC3 — Toolbar-reactive, no locale pins.** Every story reads
`const locale = (context?.globals?.locale as string) ?? 'sq'` and passes it to `storyT`. NO `globals: { locale }`
on any export. Viewport pins via `globals: { viewport: { value: 'mobile320', … } }` are allowed.

**AC4 — Minimal compliant export set.** Exactly the three state stories — `Success`, `ErrorState`, `SyncFail` —
each toolbar-reactive, plus one `LocaleStress` export pinned to `mobile320` viewport (locale still from toolbar)
per clause 13(c). No per-locale, no per-viewport-duplicate exports. No `/Ukrainian/` export name.

**AC5 — `ASSERT_STORIES` updated to final IDs only.** Replace the 10 current VerifiedPage entries with the final
export IDs (auto-derived from title `Auth/VerifiedPage` + export name, e.g. `auth-verifiedpage--success`,
`auth-verifiedpage--error-state`, `auth-verifiedpage--sync-fail`, `auth-verifiedpage--locale-stress`). The harness
sweeps locale × viewport, so uk@320/375/390 is produced automatically — confirm those cells are PASS in the
manifest. Verify each ID resolves (no 404/blank canvas → that scores FAIL under assertion (c)).

**AC6 — Rendered proof via `--fast` (owner waiver 2026-06-16, full 14-viewport render NOT required for this
closeout).** Run `npm run screenshots:assert -- --fast` (NOT a throwaway script) — this renders only the
mobile-critical viewports 320/375/390 × sq/en/uk/it for the assert stories, which is the proof that matters for
this card. The full canonical 14-viewport run is explicitly waived here (owner does not want the ~2.5h render;
the harness now permanently guards these stories going forward). Paste the `--fast` manifest summary into the
session log: for each of the 3 states, cells at 320/375/390 × sq/en/uk/it = PASS, no h-scroll at 320 (assertion a),
no render failure (assertion c). uk@320/375/390 mandatory. State plainly that the full render was not run.

**AC7 — Repair the tautological route test.** The `describe('planted-violation proof' …)` block in
`route.test.ts` currently asserts `expect([].length).toBe(0)` and does NOT exercise the route — remove it (the
real load-bearing proof is the success-path test asserting `setCookieHeader.length > 0`, which genuinely fails
when `successRedirect.cookies.set()` is removed). Either delete the misleading block, OR replace it with a real
negative test that imports the route and asserts the documented FAIL when cookies are not written. Keep the
genuine 6 page-invariant tests + the genuine route tests intact (16 → 15 if you delete one tautology; state the
final count). Re-paste the planted-violation FAIL transcript for BOTH the route success-cookie test and the page
`syncFailed`-guard test so clause-15 "FAILS on a planted violation" is satisfied by REAL tests.

**AC8 — `generateMetadata` error-state title.** Currently returns `verified_title` ("Email confirmed!") even for
`?error=confirm_failed` / sync-fail, so the tab title contradicts the error page. If trivial, make
`generateMetadata` read `searchParams` and return `verified_error_title` when `error === 'confirm_failed'`
(note: a metadata function reading `searchParams` is supported in the App Router — verify the signature compiles).
If it proves non-trivial or risks the validated runtime, do NOT force it — instead add an explicit one-line
follow-up entry to `docs/backlog.md` "Next free: 447" and note it in the session log. State which path you took.

**AC9 — Session log + Files Changed table.** Update
`docs/sessions/2026-06-16-task446-signup-confirm-session-mismatch.md`:
(a) record owner-native AC1/AC3 runtime validation (already passed — keep it);
(b) replace the throwaway-Playwright matrix with the `screenshots:assert -- --fast` manifest summary, and state
honestly: "canonical full 14-viewport render NOT run (owner waiver 2026-06-16); fast gate used for 320/375/390 ×
sq/en/uk/it; clause-13 source contract fixed (no hardcoded STRINGS, no globals.locale pins)";
(c) a COMPLETE "Files Changed" table — one row per touched path + 1-line rationale — that **matches the real diff
exactly**, INCLUDING `docs/backlog.md` and `docs/backlog-archive.md` if they remain modified in the working tree
(if they are stray/unrelated, revert them so the diff is clean — do not leave undisclosed edits).
Do NOT emit `git add`/`git commit` yourself — the orchestrator emits commit commands after diff review.

**AC10 — Gates green (paste transcripts).** `npx tsc --noEmit` = 0, `npm run lint` = 0,
`npm run check:i18n` = parity, `npm run check:stories` = 0 violations (and confirm it now passes for the RIGHT
reason — no hardcode, no locale pin — NOT via the regex blind spot), `npm run screenshots:assert -- --fast` = all
in-scope mobile cells (320/375/390 × sq/en/uk/it) PASS,
`npx vitest run src/app/auth/confirm/__tests__/route.test.ts "src/app/[locale]/auth/verified/__tests__/page.test.tsx"`
= all green. File-integrity (clause 14): read every touched file back, 0 NUL bytes, `.tsx`/`.ts` compile, `.mjs`
`node --check` passes.

## Positive flow (story render — happy path)

Actor: Storybook reader / the `screenshots:assert` harness. For each state story, with the locale toolbar set to
each of sq/en/uk/it and viewport at 320/375/390 (and full set): the `VerifiedCard` renders with the correct
variant icon, the title/body/CTA text resolved from `auth.*` for that locale, the CTA spans the card full-width
with no horizontal overflow at 320, and no render error. Success → `verified_title`/`verified_body`/`verified_browse`
→ `/{locale}/listings`. Error & SyncFail → `XCircle` + `verified_error_title` + (`verified_error_body` /
`verified_nosession_body`) + `login` CTA → `/{locale}/auth/login`.

## Negative flow (every off-happy-path branch)

- **Missing `auth.*` key for a locale** → `storyT` throws in dev (no silent English fallback) → the story render
  fails → `screenshots:assert` assertion (c) scores FAIL. Expected: never happens because all keys have parity;
  if it does, it surfaces loudly (this is desired).
- **Locale toolbar at a non-uk locale (sq/en/it)** → long labels (it/sq) must still wrap, CTA still full-width,
  no clip, no h-scroll at 320. Verify in the manifest (assertion a + d/b).
- **A reader pins a locale via `globals`** → forbidden; `check:stories` Check 4 must not be relied on (it has the
  nested-brace gap) — you simply must not write the pin. Self-verify by grep: no `globals: { … locale:` in the file.
- **Blank canvas / 404 story ID in `ASSERT_STORIES`** → assertion (c) FAIL. Verify each new ID resolves before
  claiming PASS.
- **`generateMetadata` reads `searchParams` but the signature regresses build** → if `tsc`/`build` errors, revert
  to AC8 fallback (track as 447) rather than shipping a broken metadata signature.

## Mobile <640 full-width gate (OWNER P0 — mandatory)

The only interactive surface is the CTA `<Link>` styled `buttonVariants({size:'xl'})` + `w-full justify-center` —
full-width at every breakpoint, ≥44px height (size xl). It is a `<Link>` (no `data-slot="button"`), so
`screenshots:assert` assertion (d) does not target it; the proof for this element is assertion (a) (no h-scroll)
+ the visible PNG showing it fill the card at 320/375/390 across all four locales. Card container is
`max-w-sm w-full` centered — acceptable (content card, not a popup; no bottom-sheet rule applies — there is no
overlay/popup on this page). Document this exemption line explicitly in the session log.

## Out of scope / do not do

- Do NOT change `route.ts` cookie logic, the `auth.*` message values, or the AuthContext.
- Do NOT add a `storybook.auth.*` namespace (reuse `auth.*` via `storyT`).
- Do NOT create new one-off scripts; use `npm run screenshots:assert`.
- Do NOT emit git commands. Provide the Files Changed table; the orchestrator emits the single explicit-path commit.
- Confirm `scripts/local-generate-signup-link.mjs` and `scripts/task446-mobile-check.mjs` are absent (not committed).
