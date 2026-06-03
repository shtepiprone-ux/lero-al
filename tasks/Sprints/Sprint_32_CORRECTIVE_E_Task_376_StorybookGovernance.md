### Task 376 — CORRECTIVE E: Storybook governance/i18n STANDARD + deep fixes (StoryListingCard · PasswordInput i18n · Select label · Actions panel)

> **Execution order (Sprint 32 correctives) — A → B → C → D → E → F, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. F is the FINAL certification sweep (run after A–E all land), never a parallel task. **E follows D and defines the canonical story STANDARD consumed by F.**

Type:      corrective bugfix — story governance + i18n infra (owner-rejected 365/370/371)
Priority:  CRITICAL
Area:      src/stories/StoryListingCard.tsx · src/components/ui/PasswordInput.stories.tsx · Storybook NextIntl provider ·
           src/components/ui/select.tsx · src/stories/AdminLayout.stories.tsx · src/stories/RecentlyViewedSection.stories.tsx

## Owner rejection context
Story governance + i18n requirements ignored: raw `<button>` and English leaks in `StoryListingCard`; PasswordInput
renders English even on the uk-pinned story; Select trigger shows raw value; Actions panel never wired (only `useState`).
This task establishes the CANONICAL story rules (consumed by Corrective F) AND fixes these specific deep issues.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/storybook-governance.md` (§8a/§8b/§9) · `docs/component-governance.md`
· `docs/ui-rules.md` · `docs/component-rules.md` · `docs/qa-rules.md` · `docs/ai-behavior.md` Note 14. Storybook config:
`.storybook/preview.tsx` (locale decorator / NextIntl provider).

## Current broken behavior (file evidence)
- `stories/StoryListingCard.tsx`: raw `<button>` at L128 + L191; English `aria-label` "Add/Remove from favorites" (L130),
  "Copy ID"/"Copied" (L195); visible hardcoded `"2h ago"` (L204).
- `ui/PasswordInput.stories.tsx:131` pins `globals:{locale:'uk'}` and uses `t('auth.…')`, yet renders English → the
  Storybook NextIntl provider/decorator is NOT switching messages by `globals.locale`, OR the `auth` keys lack uk values.
- `ui/select.tsx:21-29` `SelectValue` renders `<SelectPrimitive.Value/>` with no value→label mapping → Base-UI shows the
  raw `value` ("in_progress","tirana") instead of the localized/capitalized label.
- `stories/AdminLayout.stories.tsx:30,76` + `RecentlyViewedSection.stories.tsx:111`: in-canvas `useState` only; no
  Storybook `fn()`/args action wiring.

## Required after behavior
**Canonical story STANDARD (document in `docs/storybook-governance.md`) — used by Corrective F:**
1. No raw `<button>`/`<input>`/`<select>` in stories or story helpers — canonical components only.
2. No hardcoded user-facing English in any non-English-only context; aria-labels and visible text use `t()` or a
   locale-safe story label; no English leak in sq/uk/it canvases.
3. No hardcoded relative-time/text like `"2h ago"` — use a localized relative-time label or a locale-safe story token.
4. Locale-stress stories pin `globals:{locale:'uk'}`; non-stress stories follow the toolbar; never mixed-language canvas.
5. Interactive controls log to the Storybook **Actions** panel via `fn()`/args (from `@storybook/test` or the project's
   action util); in-canvas feedback may remain only as ADDITIONAL feedback.
6. Scenario-named exports (§8b); canonical components; no governance anti-patterns.

**Deep fixes:**
- `StoryListingCard.tsx`: raw favorite/copy `<button>` → canonical `Button` (preserve exact visual size/position/round);
  localize aria-labels; replace visible `"2h ago"` with a localized relative-time label or locale-safe token. Keep
  `StoryListingCard` a SINGLE shared helper consumed by BOTH `ListingGrid` and `RecentlyViewedSection`. No runtime
  `ListingCard` change.
- **PasswordInput i18n root cause:** make the Storybook NextIntl provider actually load the active `globals.locale`
  messages (fix `.storybook/preview.tsx` decorator) AND ensure the `auth` keys used exist in all 4 locales. Result: the
  uk-pinned story renders Ukrainian; toolbar switching changes language live; no English leak.
- **Select label:** canonical `Select` displays the selected option's LABEL (localized + capitalized), never the raw
  value (Base-UI `items` prop or `Select.Value` render fn — one documented approach). Audit ALL Select consumers (Note 14).
- **Actions panel:** `RecentlyViewedSection` clear control + `AdminLayout` buttons log via `fn()`/args; keep in-canvas
  feedback as optional extra.

## Exact files to inspect / allowed to edit
Inspect: the files above + `.storybook/preview.tsx` + all Select consumers (`rg "from '@/components/ui/select'"`) +
`messages/*` auth keys. Edit: `stories/StoryListingCard.tsx`, `ui/PasswordInput.stories.tsx`, `.storybook/preview.tsx`,
`ui/select.tsx`, `stories/AdminLayout.stories.tsx`, `stories/RecentlyViewedSection.stories.tsx`, `messages/*` (only to add
missing auth keys, keeping parity), `docs/storybook-governance.md`, `docs/ui-rules.md`, `docs/backlog.md`, new session log.

## Current behavior to preserve
ListingGrid/RVS shared helper single-source; RVS mobile horizontal scroll + desktop grid; favorite/copy visual position +
interaction; Select/Combobox APIs; all Select consumers' selection behavior.

## Positive flow
1. StoryListingCard favorite/copy are canonical Buttons; aria-labels localized; "days ago" localized; both grids share it.
2. PasswordInput uk story → Ukrainian labels/hints; toolbar→sq/en/it switches live.
3. Select with a value → shows localized capitalized label, not raw value.
4. RVS Clear / AdminLayout buttons → entry appears in Storybook Actions panel.

## Negative flow
- Non-English canvas → zero English leak (aria + visible). - Select nothing selected → placeholder (not raw value).
- Missing auth uk key → added (no fallback-to-English); `check:i18n` PASS. - Select consumer with custom value child →
  still works (STOP&ASK if ambiguous). - In-canvas feedback present but does NOT replace Actions wiring.

## Acceptance criteria (visible + file-verifiable, negative branch each)
- AC1 Zero raw `<button>` in `StoryListingCard.tsx`; favorite/copy are canonical `Button`, same visual — grep gate +
  file:line. Negative: visual position unchanged.
- AC2 No English aria-label/visible-text leak in StoryListingCard; `"2h ago"` replaced — grep gate
  (`rg "Add to favorites|Remove from favorites|Copy ID|Copied|2h ago" src/stories/StoryListingCard.tsx` → none).
- AC3 PasswordInput uk story renders Ukrainian; provider switches messages by `globals.locale` — file:line in
  `.storybook/preview.tsx` + visible. Negative: toolbar=sq renders Albanian, no English.
- AC4 Select trigger shows localized+capitalized label, never raw value — `ui/select.tsx`:line + visible in select stories;
  ALL consumers audited (list). Negative: nothing-selected shows placeholder.
- AC5 RVS Clear + AdminLayout buttons log to Actions panel via `fn()`/args — file:line. Negative: in-canvas optional only.
- AC6 `docs/storybook-governance.md` documents the 6-point story STANDARD (consumed by Corrective F).
- Grep gates: raw `<button>` / English-leak / `"2h ago"` absent in the edited story files.

## Out of scope
Tabs/Button/Dialog/FilterBar/Phone primitives (A–D); the full 26-file sweep (Corrective F applies THIS standard
everywhere); multilingual settlements (Task 368).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · grep gates · AC self-audit · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED)
Locales sq/en/uk/it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Verify: StoryListingCard buttons/labels localized; PasswordInput uk Ukrainian + toolbar switch; Select shows labels;
Actions panel logs.

## Final report requirements
Root-cause for PasswordInput i18n; AC table file:line; Select consumer inventory; grep outputs; the documented STANDARD;
validation outputs; Files Changed table. NO `git add`/`commit`.
