# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)

**Date:** 2026-07-04 | **Harness:** `scripts/check-stories-rendered.mjs` + `scripts/geometry-integrity.mjs` (Task 467 R1–R4/B1–B8)
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (275 stories, 400 cells)

> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.
> Full global-enumeration run.

## Summary (three-bucket model + style integrity)

| Counter | Count |
|---------|-------|
| Total cells | 400 |
| PASS (clean, verdict=pass) | 382 |
| FAIL (hard defect, verdict=fail) | 0 |
| OUT-OF-RANGE (viewport mismatch, not product defect) | 0 |
| AMBIGUOUS (needs-owner-decision, verdict=ambiguous) | 18 |
| text-clipped | 0 |
| offscreen-control | 0 |
| outside-container | 0 |
| element-overlap | 0 |
| bottomsheet-overflow | 0 |
| ambiguous-overlap | 18 |
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
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-s04z0me0p ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-s04z0me0p ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-7nn83iny6 ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-7nn83iny6 ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-3vf8d6dj1 ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-ecyo5fsb2 ↔ #mantine-ez7eibsn8 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-ecyo5fsb2 ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-irz1piulq ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-irz1piulq ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-nqtskg9q1 ↔ button("SarandëBregdetare") | "(empty)" ↔ "SarandëBregdetare" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-nqtskg9q1 ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-yi5v4vt5d ↔ #mantine-0vshb8vy0 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-3agi8yrjb ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-3agi8yrjb ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-cyyhkw942 ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-8fo34zipf ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-638g5obqc ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-638g5obqc ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-cbxitgllh ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-cbxitgllh ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-20452p548 ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-s8vj2hhgf ↔ #mantine-92aqzkev8 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-s8vj2hhgf ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-fiyg81wdz ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-fiyg81wdz ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-dugd3dtjg ↔ button("SarandëCoastal") | "(empty)" ↔ "SarandëCoastal" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-dugd3dtjg ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-p8lcfr2da ↔ #mantine-6xqsye67m | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-ujnbcx7zo ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-ujnbcx7zo ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-6qyuuhw1d ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-n1fppru9t ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-v83vnj7p2 ↔ #mantine-r1wj5e9px | "Обрати місто" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-ce9ljt6dw ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-ce9ljt6dw ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-jhj5y0b0s ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-jhj5y0b0s ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-2vkcs07hx ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-fsiyn09t3 ↔ #mantine-hp2q69l0a | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-fsiyn09t3 ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-oinfjd0wt ↔ button("Влера") | "(empty)" ↔ "Влера" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-oinfjd0wt ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-46ofoxps4 ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-46ofoxps4 ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-uagalpp8b ↔ #mantine-nwn7upk26 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-zfc4joz5l ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-zfc4joz5l ↔ button("Дуррес") | "(empty)" ↔ "Дуррес" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-x32zieaxt ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-x32zieaxt ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-9tzghhiux ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-08fp00pm3 ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-08fp00pm3 ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-75uagnti5 ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-75uagnti5 ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-div3vc9j0 ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-yy3yoek8b ↔ #mantine-tnkg7wxgv | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-yy3yoek8b ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-ezlq4t9y3 ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-ezlq4t9y3 ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-m6ndqxxm5 ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-m6ndqxxm5 ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-hlyys4qom ↔ #mantine-1hhrvvwou | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-zqbvu3kkq ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-zqbvu3kkq ↔ button("Durazzo") | "(empty)" ↔ "Durazzo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-8gdp2gw7p ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-8gdp2gw7p ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-e6vnk7c58 ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | sq | desktop-1024 | `mantine-primitives-drawer--default__sq__desktop-1024.png` | ambiguous-overlap | button("Hap panelin") ↔ button("Anulo") | "Hap panelin" ↔ "Anulo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | sq | desktop-1024 | `mantine-primitives-drawer--default__sq__desktop-1024.png` | ambiguous-overlap | button("Hap panelin") ↔ button("Konfirmo") | "Hap panelin" ↔ "Konfirmo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | en | desktop-1024 | `mantine-primitives-drawer--default__en__desktop-1024.png` | ambiguous-overlap | button("Open drawer") ↔ button("Cancel") | "Open drawer" ↔ "Cancel" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | en | desktop-1024 | `mantine-primitives-drawer--default__en__desktop-1024.png` | ambiguous-overlap | button("Open drawer") ↔ button("Confirm") | "Open drawer" ↔ "Confirm" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | uk | desktop-1024 | `mantine-primitives-drawer--default__uk__desktop-1024.png` | ambiguous-overlap | button("Відкрити панель") ↔ button("Скасувати") | "Відкрити панель" ↔ "Скасувати" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | uk | desktop-1024 | `mantine-primitives-drawer--default__uk__desktop-1024.png` | ambiguous-overlap | button("Відкрити панель") ↔ button("Підтвердити") | "Відкрити панель" ↔ "Підтвердити" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | it | desktop-1024 | `mantine-primitives-drawer--default__it__desktop-1024.png` | ambiguous-overlap | button("Apri pannello") ↔ button("Annulla") | "Apri pannello" ↔ "Annulla" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | it | desktop-1024 | `mantine-primitives-drawer--default__it__desktop-1024.png` | ambiguous-overlap | button("Apri pannello") ↔ button("Conferma") | "Apri pannello" ↔ "Conferma" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-ck9nzirp6-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-offscreen | #mantine-943h1a1yp-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) |

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
- **Run timestamp:** 2026-07-04T19-03
