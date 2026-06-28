# Task 506-R — Fix self-referential `--font-sans` (Open Sans not applying)

**Date:** 2026-06-27  
**Sprint:** 38 corrective  
**Status:** CODE COMPLETE — awaiting orchestrator rendered-proof review

## Root cause

Task 506 renamed the Next.js font loader variable to `--font-sans`, which collided with the existing `@theme inline` token `--font-sans`. Result: `globals.css` contained `--font-sans: var(--font-sans), …` — a self-reference (guaranteed-invalid in CSS). This invalidated `font-family` everywhere it was consumed, so Open Sans never applied and text fell back to a system font.

## Changes made

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Renamed loader variable `--font-sans` → `--font-open-sans`; updated comment |
| `src/app/globals.css` | Removed self-reference; `--font-sans` and `--font-heading` now reference `var(--font-open-sans), "Open Sans", system-ui, …`; updated comment |
| `src/design-system/mantine/theme.ts` | `fontFamily` and `headings.fontFamily` updated to `var(--font-open-sans), "Open Sans", system-ui, …`; updated comment |
| `.storybook/preview.tsx` | Removed `setProperty('--font-sans', ...)` workaround (no longer needed — `"Open Sans"` literal + CDN link in `preview-head.html` covers Storybook); updated comment |

## Self-validation

**Grep sweep — zero self-references:**
```
grep -rn "var(--font-sans)" src → 0 results matching --font-sans: var(--font-sans)
grep -rn "--font-outfit" src → 0 results
```

**Gates:**
- tsc = 0 errors ✅
- `check:design-tokens` = 0 violations ✅
- `check:i18n` = 1989 keys, parity PASSED ✅

## Rendered proof required (orchestrator)

Per acceptance criteria clause 4 — the orchestrator must verify in Storybook:
- DevTools "Fonts Used" / computed `font-family` shows **Open Sans** for Cyrillic label (not a system fallback) at uk@320 and uk@1043
- Toggling `font-weight: 500 → 400` visibly changes the Cyrillic label weight (proves real medium glyph)
- Network tab shows Open Sans **Cyrillic** woff2 downloaded
- Across TextInput, Textarea, AND PasswordInput stories at uk@320/375/390

## NO git add/git commit — orchestrator emits at review
