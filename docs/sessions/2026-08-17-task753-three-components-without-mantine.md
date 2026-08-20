# Task 753 — The three homepage components with no Mantine at all

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_753_Three_Components_Without_Mantine.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Requirement / acceptance-criteria evidence

| AC | Requirement | Evidence |
|---|---|---|
| AC1 | All three files import from `@mantine/*`; no raw Tailwind layout/typography utility survives, or each survivor is named with a reason | `CaptchaWidget.tsx` imports `Text`; `Turnstile`'s `className="w-full"` replaced with `style={{width:'100%'}}` — Turnstile is a third-party widget (not migrated, out of scope per kickoff) so it cannot itself import `@mantine/*`; this is the file's one named survivor. `AuthRedirect.tsx` imports `Center`. `PasswordRequirementsHint.tsx` imports `Group`/`Stack`/`Text`. `Loader2`'s `h-8 w-8 animate-spin text-muted-foreground` className is a second named survivor (see AC2 row) |
| AC2 | Rendered evidence, zero visual delta, at 320/390/768/1024/1440, `uk@320` mandatory, for the captcha note, the auth-redirect spinner, and the password list (met/unmet) | Live dev-server route capture (`/auth/register`, `/auth/login`) before (`git show HEAD:<path>` content) vs. after (edited content), same real AuthSheet render context. 219 `getComputedStyle()` properties compared programmatically across all required viewport/locale combinations — **0 mismatches**. Screenshots visually confirm (see Validation evidence) |
| AC3 | Every ARIA attribute and `data-testid` survives, verified in the rendered DOM | Confirmed in captured `outerHTML`: `role="note"` (CaptchaWidget), `aria-live="polite"` + `aria-label="Loading..."`/`"Завантаження..."` (AuthRedirect), `data-testid="password-requirements-hint"` + `aria-hidden` on both icons (PasswordRequirementsHint) — all present post-migration |
| AC4 | `allPasswordRulesMet` export signature unchanged; `AuthSheet` still compiles against it | Export line untouched (`export { checkPasswordRules, allPasswordRulesMet, type PasswordRules }`); `AuthSheet.tsx:16` import and `:597,:607` call sites unchanged; `npm run typecheck` exit 0 |
| AC5 | `typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0 | All four re-run on final content, all exit 0 (see Validation evidence) |
| AC6 | `check:design-tokens` stays green on `min-h-[60vh]`, state which method | **Removed the arbitrary value entirely** — replaced with Mantine `Center mih="60vh"`. Confirmed via the scanner's own source (`scripts/check-design-tokens.mjs`) that it only matches Tailwind arbitrary brackets with **px/rem** units (`*-[Npx]`/`*-[Nrem]`) — `min-h-[60vh]` (a `vh` unit) was never flagged before or after; no marker was ever needed |

## Current versus required behavior

- **Preserved (all three files):** every `t()` key (no i18n keys added — `check:i18n` still reports 2218 keys/locale); `allPasswordRulesMet` export; `<ul>`/`<li>` semantics in `PasswordRequirementsHint` (via `component="ul"`/`component="li"` on Mantine `Stack`/`Group`); every named ARIA attribute; `Loader2`+`animate-spin` (kept unchanged — see below).
- **Required after behavior:** raw Tailwind layout/typography utilities replaced with Mantine primitives per the kickoff's replacement rules, zero visual delta (D28).
- **Negative flows:** N/A — these are presentational/state-only components (loading spinner, disabled/enabled password rule rows, dev-only captcha fallback); no validation/authorization/network/concurrency branches are in scope. Applicability table intentionally empty per `docs/qa-profiles.md` "do not invent irrelevant scope."

## Files Changed

| File | Reason |
|---|---|
| `src/components/auth/CaptchaWidget.tsx` | Dev-fallback `<p>` → Mantine `Text` (`size="xs" lh="19.5px" c="var(--muted-foreground)" ta="center" py={4}`); `Turnstile`'s `className="w-full"` → `style={{width:'100%'}}` |
| `src/modules/auth/components/AuthRedirect.tsx` | Wrapper `<div className="min-h-[60vh] flex items-center justify-center">` → Mantine `Center mih="60vh"`; `Loader2`+`animate-spin` kept unchanged |
| `src/components/ui/PasswordRequirementsHint.tsx` | Outer `<div>` → `Stack` (`gap={4} mt={4}`); `<ul>` → `Stack component="ul"` (`gap={4}`, inline `listStyle:none` to survive the Mantine/Tailwind cascade); `<li>` (`RuleRow`) → `Group component="li"` (`gap={6} wrap="nowrap" align="flex-start" fz="xs" lh="1rem"`); `Check`/`X` icons → `size={14}` + inline `flexShrink/marginTop`; error `<p>` → `Text` (`size="xs" lh="19.5px" c="var(--destructive)"`) |

## Validation evidence

Commands (final content, all after the evidence-capture defect fix below):

```
npm run typecheck        → exit 0
npm run check:design-tokens --strict → 0 violations, exit 0
npm run check:i18n        → 2218 keys × 4 locales, parity PASSED, exit 0
npm run check:mojibake    → 0 artifacts in 2846 files, exit 0
npm run build              → ✓ Compiled successfully, 40/40 static pages, exit 0
npx vitest run src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts
                            → 1 file / 5 tests passed (mocks PasswordRequirementsHint; unaffected by markup)
```

File integrity: all three touched files verified UTF-8, no BOM, no NUL bytes.

### Rendered evidence method

No canonical Mantine Storybook story exists for `CaptchaWidget` or `AuthRedirect` (only a legacy-style story exists for `PasswordRequirementsHint`, pre-dating the Mantine proof path). Rather than build new Storybook scaffolding/mocks for two components whose defining behavior is auth-routing (`useUser`, `useRouter`, `sessionStorage`) — which the backlog's own owner decision D-C already prefers route-level DOM evidence for — this task captured evidence directly from the real product route:

- `/{locale}/auth/register` mounts `AuthRedirect` → `AuthSheet` register view, which renders both `PasswordRequirementsHint` and `CaptchaWidget` together.
- `/{locale}/auth/login` mounts `AuthRedirect`'s own spinner directly.

Method: for each of BEFORE (`git show HEAD:<path>` content) and AFTER (edited content), swap the file content on disk (no `git stash` — that command is owner-only per project policy; content was read/written directly), run the Next dev server, and use Playwright to navigate + `getComputedStyle()` the exact artifact + screenshot it, across `320/390/768/1024/1440` (en) and `320` (uk, mandatory). Captcha's dev-fallback note additionally required `NEXT_PUBLIC_TURNSTILE_SITE_KEY` overridden empty (it is configured in this repo's `.env.local`, so the real widget renders otherwise) — a second dev server instance ran with that override for the two required widths + uk@320 (this artifact carries no responsive classes of its own — `text-xs text-muted-foreground text-center py-1` — so its computed style cannot vary by viewport; the reduced set is a deliberate risk-based reduction, not a missed check).

Result: **219 `getComputedStyle()` properties** (font-size, line-height, color, display, align-items, justify-content, gap, flex-wrap, flex-direction, margin-top, text-align, min-height) compared programmatically before vs. after — **0 mismatches**. Screenshots (`.png`, not committed — captured to a scratch dir) visually confirm at 320 (en + uk) for all three states.

### A defect found and fixed during evidence capture

The first capture pass used `lh="1rem"` (16px) on the two `<p>`-rendered `Text` nodes (CaptchaWidget's dev-fallback note, PasswordRequirementsHint's error text), reasoning from `globals.css`'s `--text-xs--line-height: 1rem` token. The BEFORE measurement contradicted this: both real `<p className="text-xs ...">` elements measured **19.5px**, not 16px. Root cause: `globals.css:581` has `p { @apply leading-relaxed; }` in `@layer base`, an unconditional site-wide default for every `<p>` tag, unrelated to `text-xs`; it wins over `text-xs`'s own paired line-height for this element type in the real cascade (`<li>`-based rows, which no `li{}` rule targets, correctly measured the naively-expected 16px). Both Mantine `Text` nodes (which also render as `<p>` by default) were corrected to `lh="19.5px"` to match the true baseline, then re-verified with 0 mismatches. Left in place as an inline comment explaining the non-obvious constraint, since `text-xs="16px line-height"` is the natural (wrong) first assumption for the next reader.

A second defect (evidence-capture-only, not a product bug): after the `lh` fix, an evidence-capture step temporarily reverted all three files to `HEAD` content to isolate the error-text baseline, then two of the three files were explicitly restored via `Write` but `AuthRedirect.tsx` was missed. The stale content was then served by a Turbopack dev server that additionally failed to hot-reload the correction (a known file-watcher edge case with rapid successive external overwrites), so one capture pass silently compared the unmigrated markup against itself. Caught by re-inspecting the captured `outerHTML` (still showed the old `min-h-[60vh]` div/class instead of `mantine-Center-root`), fixed by restoring the file and restarting the dev server on a fresh port, then re-captured and reconfirmed 0 mismatches with `Center-root` now genuinely present in the served HTML.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector (before) | Utility/token path | Change | Evidence |
|---|---|---|---|---|---|
| Captcha dev-fallback note | `CaptchaDevFallback` → `<p>` | `text-xs text-muted-foreground text-center py-1` | `--text-xs` (12px) via Tailwind; `--muted-foreground` (`var(--neutral-500)`) | → Mantine `Text size="xs" lh="19.5px" c="var(--muted-foreground)" ta="center" py={4}` | Computed style + screenshot, 320/1440/uk@320 |
| Turnstile widget width | `<Turnstile>` | `className="w-full"` | n/a (Tailwind width utility) | → `style={{width:'100%'}}` (inline, third-party component, out of Mantine scope) | Source diff; widget itself unreachable in this sandbox (no network to `challenges.cloudflare.com`), width mechanism preserved regardless |
| Auth-redirect spinner wrapper | `AuthRedirect` return | `min-h-[60vh] flex items-center justify-center` | arbitrary `vh` value + flex utilities | → Mantine `Center mih="60vh"` | Computed style (`display/align-items/justify-content/min-height`) + screenshot, all 5 widths + uk@320 |
| Auth-redirect spinner icon | `Loader2` | `h-8 w-8 animate-spin text-muted-foreground` | n/a | **Preserved** — no Mantine `animate-spin` equivalent (matches Task 752's `LocaleSwitcher` precedent) | `outerHTML` unchanged in captured DOM |
| Password rule row | `RuleRow` → `<li>` | `flex items-start gap-1.5 text-xs` + conditional `text-status-success`/`text-muted-foreground` | `--text-xs`; `--status-success`; `--muted-foreground` | → Mantine `Group component="li" gap={6} wrap="nowrap" align="flex-start" fz="xs" lh="1rem" c={...}` | Computed style (met + unmet), all 5 widths + uk@320 |
| Rule row icons | `Check`/`X` | `h-3.5 w-3.5 shrink-0 mt-0.5` | n/a | → `size={14}` + inline `flexShrink/marginTop` | Source diff (14px = h-3.5/w-3.5 exactly) |
| Password hint container | outer `<div>` | `flex flex-col gap-1 mt-1` | n/a | → Mantine `Stack gap={4} mt={4}` | Computed style, all combinations |
| Password rule list | `<ul>` | `flex flex-col gap-1` | n/a | → Mantine `Stack component="ul" gap={4}` + inline `listStyle:none` (bulletproof against the Mantine/Tailwind unlayered-cascade risk documented in `mantine-responsive-design-system.md` §6) | Computed style + screenshot |
| Password error text | error `<p>` | `text-xs text-destructive` | `--text-xs`; `--destructive` | → Mantine `Text size="xs" lh="19.5px" c="var(--destructive)"` | Computed style (partial-password state), all 5 widths + uk@320 |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Muted/dimmed text color | Searched `c="dimmed"` (18 hits) vs. `c="var(--muted-foreground)"` (9 hits, incl. `MantineListingCardPattern.tsx`, `ListingCard.tsx`, `FeaturedListingsView.tsx`). Read `MantineFilterSection.tsx:26-33`'s own comment: `dimmed` resolves to `gray.6` (`#475467`), **not** this project's `--muted-foreground` (`var(--neutral-500)`, `#8C8C8C`-family) | `c="var(--muted-foreground)"` direct-token pattern (multiple ListingCard-family consumers) | `reuse` | `var(--muted-foreground)` |
| Destructive/error text color | Searched `c="red.6"` (`LocationCombobox.tsx`, Task 553) vs. direct `var(--destructive)` consumption (`FavoriteButton.module.css`, a Mantine-migrated Task 653 component). Computed `--destructive` = `var(--brand-900)` = `#8E322B`; Mantine `red.6` = `#d92d20` — a materially different color, would be a real visual change | Direct `var(--destructive)` token (matches `FavoriteButton.module.css`'s own consumption) | `reuse` | `var(--destructive)` |
| Success text color | Kickoff explicitly names this: "keep the token, do not substitute a Mantine palette shade" | `var(--status-success)` (no prior Mantine-Text consumer existed; `MantineCopyIdButton.tsx` still uses the raw Tailwind class on a lucide icon, out of this task's scope) | `reuse` (the token itself, not a Mantine shade) | `var(--status-success)` |
| Centered flex wrapper (spinner) | Searched `Center` usage: `ListingCard.tsx`, `MantineListingCardPattern.tsx`, `MantineEmptyLoadingErrorState.tsx` (the last is the canonical loading-state *pattern*, inspected in full) | `MantineEmptyLoadingErrorState`'s `loading` variant was **considered and rejected**: it uses Mantine `Loader` (brand-colored ring, `size="lg"`) and `minHeight:200` fixed px, both materially different from `Loader2`+`animate-spin`+`min-h-[60vh]` — reusing it would be an unauthorized visual change | `reuse` (bare `Center` core primitive only, not the pattern) | Mantine `Center` (core, no project token) |
| Row/list flex layout | Searched `Group`/`Stack` with `component="li"`/`component="ul"` — explicitly named by the kickoff itself; direct precedent `ListingCard.tsx:285` (`Group ... fz="xs" c="var(--muted-foreground)"`, same fz+c-on-Group-inherits-to-children shape) | `Group`/`Stack` core primitives | `reuse` | n/a (layout primitives, no token) |

## Implementation validation notes

Two defects found and fixed, both described in detail under "A defect found and fixed during evidence capture" above: (1) the `lh="1rem"` line-height mismatch on the two `<p>`-rendered `Text` nodes (real product-code defect, caught before handoff, fixed); (2) an evidence-capture-only staleness bug (`AuthRedirect.tsx` briefly left in its pre-migration state during a capture pass, masked by a Turbopack HMR miss) — never shipped, caught by inspecting the captured `outerHTML` rather than trusting the "0 mismatches" result at face value, then re-captured correctly.

No remaining gaps against the six acceptance criteria.

## Assumptions, deviations, and limitations

- The Turnstile widget's actual Cloudflare challenge iframe could not be rendered in this sandbox (no network access to `challenges.cloudflare.com`); the width-mechanism fix (`className` → `style`) is verified by source diff and by the widget's documented `size="flexible"` behavior (100% width per its own library, `node_modules/@marsidev/react-turnstile/dist/index.d.ts`), not by a rendered screenshot of the live challenge.
- Rendered evidence used live dev-server routes rather than new Storybook stories for `CaptchaWidget`/`AuthRedirect` (no canonical story existed for either; see Validation evidence for the reasoning, consistent with the backlog's owner decision D-C preferring route-level DOM evidence). `PasswordRequirementsHint`'s existing legacy-style story (`Idle`/`PartiallyMet`/`AllMet`/`LocaleStress`) was not additionally used since the live-route capture already exercises the same component with the required met/unmet/uk@320 states plus real ARIA verification in the same pass.
- No new i18n keys added; no automated regression test added or required (this task touches no `docs/critical-flow-registry.md` entry — presentational-only components).

## Opus handoff

- Diff: `git diff -- src/components/auth/CaptchaWidget.tsx src/modules/auth/components/AuthRedirect.tsx src/components/ui/PasswordRequirementsHint.tsx`
- This session log: `docs/sessions/2026-08-17-task753-three-components-without-mantine.md`
- Backlog: `docs/backlog.md` (Last Session line + registry row 753 updated, 80 lines, no growth)
- Sprint plan: `tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md` row 753 updated
- Owner-run commit (explicit paths), when ready:
  `git add docs/backlog.md docs/sessions/2026-08-17-task753-three-components-without-mantine.md src/components/auth/CaptchaWidget.tsx src/components/ui/PasswordRequirementsHint.tsx src/modules/auth/components/AuthRedirect.tsx tasks/Sprints/Sprint_60_Homepage_Mantine_Completion_And_Tailwind_Residue.md`

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
