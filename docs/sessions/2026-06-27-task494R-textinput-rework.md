# Session Log — Task 494-R: TextInput Story Rework

**Date:** 2026-06-27  
**Executor:** Sonnet 4.6  
**Sprint:** 38 / MM Phase-1 Batch B  
**Status:** ✅ COMPLETE — all gates pass

---

## What Changed

Theme chrome (`theme.ts`) from first pass is ACCEPTED and untouched.  
This session fixes the two owner-rejected defects in the story + locale files.

### Defect 1 — Cyrillic email placeholder in uk.json
- `ti_placeholder` was `"ви@приклад.com"` (Cyrillic transliteration of email — WRONG)
- Changed to `"example@gmail.com"` IDENTICAL in all 4 locales
- Governance: `docs/i18n-rules.md §5a` — email/machine-format placeholders never translated

### Defect 2 — Phone icon input misrepresents the product
- First-pass story had an "input-group" section with `<Phone size={16} />` in `leftSection`
- Product uses `PhoneField` (`src/components/shared/PhoneField.tsx`) — two-field composite
- Removed `import { Phone } from 'lucide-react'`; deleted entire input-group section
- Story now has exactly 6 sections (was 7)

### Gate unblock — check:stories Check 8 email allowlist
- Check 8 (`uk-latin-only`) blocked `"example@gmail.com"` in uk.json storybook.* namespace
- `LATIN_ALLOWLIST_PATTERNS` had "// URL paths, slugs, email domains" comment but missed
  actual email-address format (`user@domain.tld`); only covered `domain.tld` prefix form
- Added `/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/` to the pattern array
- This is a necessary 7th file (script, not product code) to enforce the new §5a rule

---

## Files Changed

| File | Change |
|------|--------|
| `src/stories/mantine/primitives/TextInput.stories.tsx` | Remove `Phone` import; delete input-group section; `ti_name_placeholder` in long-label; 6 sections total |
| `messages/en.json` | `ti_placeholder`→`example@gmail.com`; remove `ti_icon_label`; add `ti_name_placeholder: "e.g. Jane Smith"` |
| `messages/sq.json` | `ti_placeholder`→`example@gmail.com`; remove `ti_icon_label`; add `ti_name_placeholder: "p.sh. Lulëzim Hoxha"` |
| `messages/uk.json` | `ti_placeholder`→`example@gmail.com` (Latin — correct for email); remove `ti_icon_label`; add `ti_name_placeholder: "напр., Іван Петренко"` |
| `messages/it.json` | `ti_placeholder`→`example@gmail.com`; remove `ti_icon_label`; add `ti_name_placeholder: "es. Mario Rossi"` |
| `scripts/check-stories.mjs` | Add email-address regex to `LATIN_ALLOWLIST_PATTERNS` (§5a enforcement) |

**theme.ts: NOT TOUCHED** (accepted from first pass)

---

## Gate Results

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 82 files, 0 violations |
| `check:i18n` | ✅ 1979 keys × 4 locales, parity pass |
| `check:design-tokens` | ✅ 0 violations |

---

## Key Counts (unchanged)

- Total keys per locale: **1979** (removed `ti_icon_label`, added `ti_name_placeholder` — net 0)
- `ti_placeholder` identical across all 4 locales: `"example@gmail.com"`
- `ti_name_placeholder` properly localized: sq/en/it=Latin, uk=Cyrillic ✅
