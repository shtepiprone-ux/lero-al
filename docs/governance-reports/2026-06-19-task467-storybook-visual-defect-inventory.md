# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)

**Date:** 2026-07-04 | **Harness:** `scripts/check-stories-rendered.mjs` + `scripts/geometry-integrity.mjs` (Task 467 R1–R4/B1–B8)
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (276 stories, 416 cells)

> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.
> Full global-enumeration run.

## Summary (three-bucket model + style integrity)

| Counter | Count |
|---------|-------|
| Total cells | 416 |
| PASS (clean, verdict=pass) | 398 |
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
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-vupyrvliy ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-vupyrvliy ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-fk3qsvvlh ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-fk3qsvvlh ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-f1kkd4wrt ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-2ledube76 ↔ #mantine-xee1a0ulp | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-2ledube76 ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-btolzv24d ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-btolzv24d ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-6q014h2t0 ↔ button("SarandëBregdetare") | "(empty)" ↔ "SarandëBregdetare" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-6q014h2t0 ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-pas5pwzmx ↔ #mantine-dwyw5w9uv | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-px4lhez0p ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-px4lhez0p ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-jse8sg53f ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-ab4gzzqth ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-kd0j55raq ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-kd0j55raq ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-pl7usyr29 ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-pl7usyr29 ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-dtgyiilr2 ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-eivwsrtp6 ↔ #mantine-cui2jwxx7 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-eivwsrtp6 ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-ljmfmabk1 ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-ljmfmabk1 ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-uum3crv01 ↔ button("SarandëCoastal") | "(empty)" ↔ "SarandëCoastal" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-uum3crv01 ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-ixpkb20qd ↔ #mantine-ugiadbq3t | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-d520e0q1j ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-d520e0q1j ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-gkk31i61r ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-m8xo9jspg ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-muxr1xzfk ↔ #mantine-q84twxnhe | "Обрати місто" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-tcqdykrnk ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-tcqdykrnk ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-u2wp7a6ff ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-u2wp7a6ff ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-pg651chcq ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-xcrs9ey36 ↔ #mantine-ocybyh74w | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-xcrs9ey36 ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-9duu4g7cq ↔ button("Влера") | "(empty)" ↔ "Влера" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-9duu4g7cq ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-dg728r25g ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-dg728r25g ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-h58owovoq ↔ #mantine-iwysmserw | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-ly5y3ek7i ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-ly5y3ek7i ↔ button("Дуррес") | "(empty)" ↔ "Дуррес" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-6u9wl1p22 ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-6u9wl1p22 ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-cdea7q2hj ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-3b5pqzo6i ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-3b5pqzo6i ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-v4nwhb8kd ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-v4nwhb8kd ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-wxexqorpp ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-nhkpr2yi7 ↔ #mantine-mn0590yn8 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-nhkpr2yi7 ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-cq4auymxv ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-cq4auymxv ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-h3r0lnfsj ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-h3r0lnfsj ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-jm7w5y6ml ↔ #mantine-kupytn3kw | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-d96swwwm6 ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-d96swwwm6 ↔ button("Durazzo") | "(empty)" ↔ "Durazzo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-7s50l4p1j ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-7s50l4p1j ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-qv8cs5lvs ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | sq | desktop-1024 | `mantine-primitives-drawer--default__sq__desktop-1024.png` | ambiguous-overlap | button("Hap panelin") ↔ button("Anulo") | "Hap panelin" ↔ "Anulo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | sq | desktop-1024 | `mantine-primitives-drawer--default__sq__desktop-1024.png` | ambiguous-overlap | button("Hap panelin") ↔ button("Konfirmo") | "Hap panelin" ↔ "Konfirmo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | en | desktop-1024 | `mantine-primitives-drawer--default__en__desktop-1024.png` | ambiguous-overlap | button("Open drawer") ↔ button("Cancel") | "Open drawer" ↔ "Cancel" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | en | desktop-1024 | `mantine-primitives-drawer--default__en__desktop-1024.png` | ambiguous-overlap | button("Open drawer") ↔ button("Confirm") | "Open drawer" ↔ "Confirm" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | uk | desktop-1024 | `mantine-primitives-drawer--default__uk__desktop-1024.png` | ambiguous-overlap | button("Відкрити панель") ↔ button("Скасувати") | "Відкрити панель" ↔ "Скасувати" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | uk | desktop-1024 | `mantine-primitives-drawer--default__uk__desktop-1024.png` | ambiguous-overlap | button("Відкрити панель") ↔ button("Підтвердити") | "Відкрити панель" ↔ "Підтвердити" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | it | desktop-1024 | `mantine-primitives-drawer--default__it__desktop-1024.png` | ambiguous-overlap | button("Apri pannello") ↔ button("Annulla") | "Apri pannello" ↔ "Annulla" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | it | desktop-1024 | `mantine-primitives-drawer--default__it__desktop-1024.png` | ambiguous-overlap | button("Apri pannello") ↔ button("Conferma") | "Apri pannello" ↔ "Conferma" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-oufqzub47-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-offscreen | #mantine-4idqd1zb9-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) |

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
- **Run timestamp:** 2026-07-04T20-44
