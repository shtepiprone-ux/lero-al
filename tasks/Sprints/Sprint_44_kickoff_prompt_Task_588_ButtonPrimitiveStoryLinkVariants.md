# Task 588 — Button primitive story: showcase the §6a-link text/link variant (with-icon AND no-icon)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** Storybook / visual — canonical primitive story addition (story + storybook i18n only). **Owner-directed 2026-07-13.**
**Depends on / completes:** Task 587 (added the themed `variant="transparent"` `§6a-link` chrome to `theme.ts`). **Commit 588 together with 587** — 587 is HELD (not committed) until this rendered proof lands.

## Why

Task 587 made `variant="transparent"` a **first-class TailAdmin `§6a-link` variant** (transparent bg, no border, no
hover/press fill, gray-700 default text / red for destructive, icon-left via `leftSection`). But the canonical
**`Button` primitive story** (`src/stories/mantine/primitives/Button.stories.tsx`) still only renders a single bare
`variant="transparent"` text swatch (line 45) with **no icon** and **no borderless-link showcase**. The owner caught
this on review: a new first-class variant MUST be provable in its own primitive story (rendered-evidence gate,
agent-contract clause 13) — not only inside a consumer (`MobileNavDrawer`) and a throwaway probe.

**Owner requirement (2026-07-13):** the Button primitive story must show **two text/link-button variants — one WITH
a left icon and one WITHOUT an icon** — both rendering the `§6a-link` look (transparent, no border, no fill). Include
the destructive red case too, since that is the real Logout consumer.

## Pre-read (rule-index → Storybook / visual snapshot task)

- `docs/agent-contract.md` (clauses **1, 7, 11, 12, 13, 16**) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (this task touches NO registry flow — story + i18n only; confirm and state so).
- 🔴 `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof rules — `skipCanvas:true`,
  `storybook.mantine.*` namespace, single `Default` export, toolbar-driven viewport/locale) + §13 + §18.9
  (icon↔label gap, no overlap — the `leftSection` gap on the with-icon link).
- 🔴 `docs/tailadmin-style-reference.md` — the **`§6a-link` row + note** (the single source of truth for this variant:
  transparent bg, no border, `text-theme-sm` 14/500, gray-700 text `#344054`, icon-left gap 12px, radius 8, ≥44px,
  owner override = NO hover fill; destructive = `color="red"`).
- `docs/storybook-governance.md` (§14 enforced gates — `check:stories`), `docs/storybook-visual-snapshots.md`,
  `docs/component-rules.md`, `docs/qa-rules.md`.
- Reference: `src/stories/mantine/primitives/Button.stories.tsx` (the story you extend — keep the existing sections
  intact), `src/design-system/mantine/theme.ts` Button block (the `§6a-link` `vars` + `styles` — do NOT touch it here),
  `src/components/layout/MobileNavDrawer.tsx` (the real consumer the swatches must visually match).

## Files in scope

1. `src/stories/mantine/primitives/Button.stories.tsx` — ADD one new section to the existing `Default` story's
   `<Stack>` (do NOT create a second story export — single `Default` only, §8). The section demonstrates the
   `§6a-link` link/tertiary variant in **both** forms plus the destructive case.
2. `messages/{sq,en,uk,it}.json` — add the new `storybook.mantine.*` label key(s) in **all four** locales, same key
   set, in the existing `storybook.mantine` block (alongside `button_variant_transparent` etc.).

**MUST NOT touch:** `theme.ts` (the `§6a-link` chrome is already correct from 587 — this task only *renders* it),
`MobileNavDrawer.tsx`, any other story, any product `nav.*`/app locale key, the existing Button story sections
(filled/default/subtle/light/transparent swatch, sizes, icon, full-width, disabled, loading, long-label — all stay
byte-identical; you only APPEND the new link section).

## Current behavior to PRESERVE / required after-behavior

- **Preserve:** every existing `Default`-story section renders exactly as today; the existing bare
  `variant="transparent"` swatch in the "variants" row stays (it is the inline no-color demo). `check:stories` /
  `check:i18n` key counts only INCREASE by the new keys, nothing removed or renamed.
- **After:** a new **"link / tertiary (§6a-link)"** section renders, in this order, at least:
  1. **Link — no icon:** `<Button variant="transparent">{t('button_link_no_icon')}</Button>` — gray-700 text,
     transparent, no border, no fill.
  2. **Link — with icon:** `<Button variant="transparent" leftSection={<Icon size={16} aria-hidden />}>
     {t('button_link_with_icon')}</Button>` — same chrome + a lucide left icon with the §18.9 visible gap to the label.
  3. **Link — destructive (with icon):** `<Button variant="transparent" color="red" leftSection={<LogOut size={16}
     aria-hidden />}>{t('button_link_destructive')}</Button>` — red text, transparent, no border/fill (the real Logout).
  - Use a lucide icon already in the deps (e.g. `LogOut` for the destructive one; pick any existing lucide glyph such
    as `ExternalLink`/`ArrowRight` for the neutral with-icon one — do NOT add a new dependency).
  - Wrap the three in a `Group gap="sm" wrap="wrap"` (or a `Stack` — match the file's existing section style), under a
    `<Text size="xs" c="gray.5" fw={500}>` caption naming the section (caption may be a literal, consistent with the
    existing section captions on lines 29/53/68).

## i18n (clause 7)

Add to `storybook.mantine` in all four locales (suggested keys — keep the SAME key set across sq/en/uk/it):

- `button_link_no_icon` — en "Link" · sq "Lidhje" · uk "Посилання" · it "Collegamento"
- `button_link_with_icon` — en "Link with icon" · sq "Lidhje me ikonë" · uk "Посилання з іконкою" · it "Collegamento con icona"
- `button_link_destructive` — en "Logout" · sq "Dil" · uk "Вийти" · it "Esci"

(Reuse existing keys instead if a better match exists — but do NOT rename/remove `button_variant_transparent`.)
`check:i18n` must stay green with the new keys present in all four files.

## Mobile <640 full-width gate (clause 11)

These swatches are demo controls in a story `Group`/`Stack` — content-width is acceptable for the inline swatches
(they demonstrate the variant, not a mobile CTA), BUT the story must not introduce any horizontal scroll at 320: the
`Group wrap="wrap"` must wrap, long uk/it labels ("Посилання з іконкою") must wrap (theme default), no clip, ≥44px
touch height (theme default `minHeight:2.75rem`). No new full-width claim is required for these demo swatches; if you
also add a `fullWidth` link demo, it must fill <640 edge-to-edge.

## TailAdmin conformance (clause 16 / §6a-link)

The rendered swatches must visibly match the `§6a-link` reference **side-by-side**: transparent bg, NO border, NO
hover/press background fill (hover = text-darken only), gray-700 (`#344054`) resting text for the neutral links, red
for the destructive one, 14px/500, radius 8, icon-left gap (§18.9 visible gap, no overlap). Zero invented values —
all trace to `§6a-link`. `tsc=0`/gate-green is NOT style proof.

## Positive / Negative flow

- **Positive:** the `Default` story renders the new link section; toolbar locale switch (en/uk/sq/it) re-labels the
  three buttons; toolbar viewport 320→1920 keeps them borderless/fill-less, gray-700 (or red), icon gap intact, no
  h-scroll. `screenshots:assert -- --mantine-only` still PASSES the `Button` story cells (story count unchanged — still
  ONE `Default` export; the section is additive within it).
- **Negative:** NO second story export added; NO `parameters.layout:'centered'|'padded'`; NO raw `<button>`; NO raw
  user-facing string as a button **label** (all via `t()`); NO new dependency; NO hover background fill on any link
  swatch (capture a hover frame at one desktop width proving `background-color` stays `rgba(0,0,0,0)`); long uk/it
  labels wrap, no clip, no h-scroll at 320; the existing sections and their keys are unchanged.

## Rendered evidence (clauses 12/13 + §18.9) — REQUIRED to close

- `screenshots:assert -- --mantine-only` before/after counts pasted (expect the `Button` story cells to still PASS;
  story count unchanged).
- 🔴 **§18.9 human-visual proof** at **uk@320/375/390 (mandatory) + sq@320 + it@320 + en@1280**: paste inspected
  screenshots proving the three link swatches render (a) transparent, no border, no fill; (b) neutral = gray-700, the
  destructive = red; (c) the with-icon and destructive swatches show a visible icon→label gap (no overlap); (d) the
  no-icon swatch has NO icon; (e) long uk/it labels wrap, no h-scroll at 320.
- **Hover frame** (one desktop width): `getComputedStyle(button).backgroundColor` = `rgba(0,0,0,0)` at rest AND on
  hover for a neutral link and the destructive link — proving the owner's "no fill even on hover".
- Rendered matrix (breakpoints × sq/en/uk/it) with real per-cell evidence; uk@320/375/390 mandatory stress cells.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. `Button.stories.tsx` `Default` story gains a "link / tertiary (§6a-link)" section with at minimum: a **no-icon**
   transparent link, a **with-icon** transparent link (`leftSection`), and a **destructive red with-icon** link;
   existing sections byte-identical; single `Default` export preserved. *(diff)*
2. All three button labels via `t('storybook.mantine.button_link_*')`; new keys present in **all four** locales with
   the same key set; `check:i18n` green. *(diff + transcript)*
3. Rendered `§6a-link` match: transparent / no border / no hover fill / gray-700 (neutral) / red (destructive) /
   14px-500 / radius-8 / icon-left gap. *(clause 16, rendered)*
4. No h-scroll at 320, labels wrap, ≥44px; `Group wrap="wrap"`. *(clause 11/12, rendered)*
5. Gates: `tsc=0`, `eslint`, `check:stories` (0 violations, single Default export, no raw label/`<button>`),
   `check:i18n`, `check:file-integrity`, `check:mojibake`, `screenshots:assert -- --mantine-only` all green; §18.9
   human-visual set + hover frame pasted; Files-Changed table + AC-by-AC self-audit + rendered matrix in the session
   log. **Do NOT run `git add`/`git commit` — HELD for orchestrator review; 588 commits together with 587.** *(transcript)*

## Out of scope

Any change to `theme.ts` (the `§6a-link` chrome is done in 587), `MobileNavDrawer.tsx`, other stories, product locale
keys, or the pre-existing `default`/`outline` `--button-color` vars-precedence latent bug Sonnet flagged in the 587
session log (that is a SEPARATE potential follow-up — do NOT touch it here). No new npm dependency; no second story
export.
