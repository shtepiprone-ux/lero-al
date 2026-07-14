# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)

**Harness:** `scripts/check-stories-rendered.mjs` + `scripts/geometry-integrity.mjs` (Task 467 R1–R4/B1–B8) — run timestamp recorded in `.screenshots/rendered-assert/<ts>/manifest.json`
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (295 stories, 692 cells)

> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.
> Full global-enumeration run.

## Summary (three-bucket model + style integrity)

| Counter | Count |
|---------|-------|
| Total cells | 692 |
| PASS (clean, verdict=pass) | 665 |
| FAIL (hard defect, verdict=fail) | 0 |
| OUT-OF-RANGE (viewport mismatch, not product defect) | 0 |
| AMBIGUOUS (needs-owner-decision, verdict=ambiguous) | 27 |
| text-clipped | 0 |
| offscreen-control | 0 |
| outside-container | 0 |
| element-overlap | 0 |
| bottomsheet-overflow | 0 |
| ambiguous-overlap | 27 |
| unstyled-render | 0 |

---

## Bucket 1: Hard defects (true positives — product layout fixes needed)

| Story ID | Locale | Viewport | Screenshot | Fail Reason | Selector | Label |
|---|---|---|---|---|---|---|
| *(none)* | | | | | | |

---

## Bucket 2: Needs-owner-decision (ambiguous third state)

| Story ID | Locale | Viewport | Screenshot | Fail Reason | Selector | Label | Reason |
|---|---|---|---|---|---|---|---|
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("SarandëBregdetare") | "(empty)" ↔ "SarandëBregdetare" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("SarandëCoastal") | "(empty)" ↔ "SarandëCoastal" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "Обрати місто" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Влера") | "(empty)" ↔ "Влера" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Дуррес") | "(empty)" ↔ "Дуррес" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Durazzo") | "(empty)" ↔ "Durazzo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-notificationbellview--default` | en | mobile-320 | `mantine-primitives-notificationbellview--default__en__mobile-320.png` | ambiguous-overlap | button ↔ button("Mark all as read") | "Notifications" ↔ "Mark all as read" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | sq | mobile-320 | `mantine-primitives-rangedatepicker--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Muaj" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | sq | mobile-320 | `mantine-primitives-rangedatepicker--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Viti" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | sq | mobile-375 | `mantine-primitives-rangedatepicker--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Muaj" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | sq | mobile-375 | `mantine-primitives-rangedatepicker--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Viti" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | sq | mobile-390 | `mantine-primitives-rangedatepicker--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Muaj" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | sq | mobile-390 | `mantine-primitives-rangedatepicker--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Viti" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | en | mobile-320 | `mantine-primitives-rangedatepicker--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Month" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | en | mobile-320 | `mantine-primitives-rangedatepicker--default__en__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Year" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | en | mobile-375 | `mantine-primitives-rangedatepicker--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Month" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | en | mobile-375 | `mantine-primitives-rangedatepicker--default__en__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Year" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | en | mobile-390 | `mantine-primitives-rangedatepicker--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Month" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | en | mobile-390 | `mantine-primitives-rangedatepicker--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Year" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | uk | mobile-320 | `mantine-primitives-rangedatepicker--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Місяць" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | uk | mobile-320 | `mantine-primitives-rangedatepicker--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Рік" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | uk | mobile-375 | `mantine-primitives-rangedatepicker--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Місяць" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | uk | mobile-375 | `mantine-primitives-rangedatepicker--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Рік" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | uk | mobile-390 | `mantine-primitives-rangedatepicker--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Місяць" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | uk | mobile-390 | `mantine-primitives-rangedatepicker--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Рік" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | it | mobile-320 | `mantine-primitives-rangedatepicker--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Mese" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | it | mobile-320 | `mantine-primitives-rangedatepicker--default__it__mobile-320.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Anno" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | it | mobile-375 | `mantine-primitives-rangedatepicker--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Mese" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | it | mobile-375 | `mantine-primitives-rangedatepicker--default__it__mobile-375.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Anno" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | it | mobile-390 | `mantine-primitives-rangedatepicker--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Mese" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-rangedatepicker--default` | it | mobile-390 | `mantine-primitives-rangedatepicker--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ #mantine-<id> | "(empty)" ↔ "Anno" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-<id>-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-offscreen | #mantine-<id>-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) |

---

## Capture / style-integrity failures (NOT product layout defects)

| Story ID | Locale | Viewport | Failing Signals | Screenshot |
|---|---|---|---|---|
| *(none in this run)* | | | | |

---

## Viewport-mismatch failures (NOT product layout defects)

> Stories rendered outside their meaningful viewport range (e.g. mobile-only header at desktop, mobile drawer at desktop).

| Story ID | Locale | Viewport | Screenshot | Fail Reason | Range |
|---|---|---|---|---|---|
| *(none)* | | | | | |

---

## Planted violation stories (standing fixtures — NOT product defects)

| Story ID | Verdict | Fail Reason | Cells |
|---|---|---|---|

---

## Notes

- **Harness-generated:** all rows above are emitted from the manifest, not hand-written.
- **Authoritative full run** = owner NATIVE on committed tree.
- **Run timestamp:** recorded per-run in `.screenshots/rendered-assert/<ts>/manifest.json` (gitignored) — not duplicated here so the committed report stays byte-identical across identical runs.
