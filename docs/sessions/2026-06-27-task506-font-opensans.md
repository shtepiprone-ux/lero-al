# Task 506 — Global font swap Outfit → Open Sans (Cyrillic) — Session Log

**Date:** 2026-06-27  
**Sprint:** 38 corrective  
**Executor:** Sonnet 4.6

## Summary

Replaced `Outfit` with `Open Sans` project-wide. Outfit ships only `latin`/`latin-ext` subsets —
zero Cyrillic glyphs — so every Ukrainian (`uk`) string fell back to the system font and fw500
labels were invisible (root cause of the "labels not medium" rejection on input stories).
Open Sans covers Latin + Cyrillic + Cyrillic-ext, weights 300–800 (variable font).

## Files Changed

| File | Change |
|------|--------|
| `src/app/layout.tsx` | `import { Outfit }` → `import { Open_Sans }`; loader: `Open_Sans({ subsets: ['latin','latin-ext','cyrillic','cyrillic-ext'], variable: '--font-sans', display: 'swap' })`; renamed `outfit` → `sans`; `className={outfit.variable}` → `className={sans.variable}`; updated comment block |
| `.storybook/preview-head.html` | Replaced Outfit Google Fonts `<link>` with Open Sans variable-font CDN link (ital,wght@0,300..800;1,300..800); updated comments |
| `.storybook/preview.tsx` | `withTheme` decorator: `setProperty('--font-outfit', '"Outfit"')` → `setProperty('--font-sans', '"Open Sans"')`; updated surrounding comments |
| `src/design-system/mantine/theme.ts` | `fontFamily`: `var(--font-outfit), Outfit, …` → `var(--font-sans), "Open Sans", …`; `headings.fontFamily`: `Outfit, var(--font-outfit), …` → `"Open Sans", var(--font-sans), …`; updated comment |
| `src/app/globals.css` | `@theme inline` font comment updated; `--font-sans: var(--font-outfit), …` → `--font-sans: var(--font-sans), …`; `--font-heading: var(--font-outfit), …` → `--font-heading: var(--font-sans), …`; body comment "Outfit uses normal defaults" → "Open Sans uses normal defaults" |
| `src/stories/PlantedVisualViolations.stories.tsx` | Comment: "project font (Outfit)" → "project font (Open Sans)" |
| `docs/mantine-responsive-design-system.md` | Font family row: Outfit → Open Sans + Task 506 rationale |
| `docs/tailadmin-style-reference.md` | Font entry: `Outfit, sans-serif` → `Open Sans, sans-serif` + Task 506 rationale |

## Grep Sweep (AC-5)

```
$ grep -rni "outfit|--font-outfit" src .storybook --include="*.ts" --include="*.tsx" --include="*.css" --include="*.html"
src/app/globals.css:98:  /* Font — Open Sans is the single project family (Outfit retired 2026-06-27, no Cyrillic; Task 506).
src/app/layout.tsx:18:// Open Sans: the single project font (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506).
src/design-system/mantine/theme.ts:91:  // Font: Open Sans (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506).
.storybook/preview-head.html:4:<!-- Open Sans: the single project font (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506). -->
```

**ZERO functional references to `--font-outfit` or `Outfit` as a font name.** Remaining hits are
historical "Outfit retired" rationale in comments only — all in descriptive prose, not in any
font stack, CSS variable value, or import statement.

## Gates

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| Grep sweep clean | ✅ 0 functional `outfit`/`--font-outfit` refs |
| No token value changes | ✅ only variable name + comments changed |
| No layout/spacing/weight changes | ✅ font-family only |

## Rendered Proof (AC-6)

> **Note for orchestrator:** AC-6 requires Storybook visual proof at uk@320/375/390 + en/sq/it@320
> showing (a) Cyrillic in Open Sans and (b) field labels visibly medium (500) vs 400 body.
> Network-tab proof that the Cyrillic woff2 subset loads is also required.
> This session log records the code changes and gate results; rendered screenshots must be
> captured by the owner in Storybook after restarting with the updated `preview-head.html`.

## AC Checklist

- [x] AC-1: `layout.tsx` loads Open Sans with all 4 subsets, variable `--font-sans`; no Outfit
- [x] AC-2: `preview-head.html` loads Open Sans incl. Cyrillic; Outfit link removed
- [x] AC-3: `theme.ts` both font stacks = Open Sans / `--font-sans`; no Outfit literal
- [x] AC-4: `globals.css` variable renamed `--font-outfit`→`--font-sans` in values; zero value changes; comments updated
- [x] AC-5: Grep sweep clean (zero functional refs) — pasted above
- [ ] AC-6: Rendered proof — requires owner Storybook run (uk@320/375/390 labels medium)
- [x] AC-7: tsc=0
- [ ] AC-8: File-integrity (owner to paste transcript)
- [x] AC-9: `docs/mantine-responsive-design-system.md` + `docs/tailadmin-style-reference.md` updated; `docs/backlog.md` Last Session updated; this session log created
