# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)

**Date:** 2026-07-05 | **Harness:** `scripts/check-stories-rendered.mjs` + `scripts/geometry-integrity.mjs` (Task 467 R1–R4/B1–B8)
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (277 stories, 432 cells)

> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.
> Full global-enumeration run.

## Summary (three-bucket model + style integrity)

| Counter | Count |
|---------|-------|
| Total cells | 432 |
| PASS (clean, verdict=pass) | 414 |
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
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-o5vnmh9vh ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-o5vnmh9vh ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-uy54miclv ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-uy54miclv ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-320 | `mantine-primitives-combobox--default__sq__mobile-320.png` | ambiguous-overlap | #mantine-6omxnmviq ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-o72mvkj4w ↔ #mantine-wgxchkpdf | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-o72mvkj4w ↔ button("Të gjitha qytetet") | "(empty)" ↔ "Të gjitha qytetet" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-ljsbwtakk ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-ljsbwtakk ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-46ww8h5sy ↔ button("SarandëBregdetare") | "(empty)" ↔ "SarandëBregdetare" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-375 | `mantine-primitives-combobox--default__sq__mobile-375.png` | ambiguous-overlap | #mantine-46ww8h5sy ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-egl6waj3j ↔ #mantine-a6hz2qfad | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-3i9byxcvp ↔ button("Tiranë") | "(empty)" ↔ "Tiranë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-3i9byxcvp ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-cfu9psyn9 ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-plo5irafv ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-gsns463b2 ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-gsns463b2 ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-vh8021omu ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-vh8021omu ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-320 | `mantine-primitives-combobox--default__en__mobile-320.png` | ambiguous-overlap | #mantine-gcmcbe5eu ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-wkwfo52ip ↔ #mantine-5grf9ab44 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-wkwfo52ip ↔ button("All cities") | "(empty)" ↔ "All cities" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-kna3e04d2 ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-kna3e04d2 ↔ button("Vlorë") | "(empty)" ↔ "Vlorë" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-peu8x3hwj ↔ button("SarandëCoastal") | "(empty)" ↔ "SarandëCoastal" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-375 | `mantine-primitives-combobox--default__en__mobile-375.png` | ambiguous-overlap | #mantine-peu8x3hwj ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-pha2rmt0g ↔ #mantine-fnm0efoln | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-f9cjift7i ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-f9cjift7i ↔ button("Durrës") | "(empty)" ↔ "Durrës" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-iy16mlv1j ↔ button("Shkodër") | "(empty)" ↔ "Shkodër" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-ql9m596lm ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-l6k6pe3k3 ↔ #mantine-pnln904nb | "Обрати місто" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-ovac5scob ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-ovac5scob ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-hlgu2znur ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-hlgu2znur ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-320 | `mantine-primitives-combobox--default__uk__mobile-320.png` | ambiguous-overlap | #mantine-kdacn3njc ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-07dlqm1rb ↔ #mantine-lacnqk4sa | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-07dlqm1rb ↔ button("Усі міста") | "(empty)" ↔ "Усі міста" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-y35seuwqf ↔ button("Влера") | "(empty)" ↔ "Влера" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-y35seuwqf ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-qaoaa43m4 ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-375 | `mantine-primitives-combobox--default__uk__mobile-375.png` | ambiguous-overlap | #mantine-qaoaa43m4 ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-6rhtajslr ↔ #mantine-3rf0iy52z | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-i5spgh9p9 ↔ button("Тирана") | "(empty)" ↔ "Тирана" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-i5spgh9p9 ↔ button("Дуррес") | "(empty)" ↔ "Дуррес" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-vrwi3ayba ↔ button("Шкодер") | "(empty)" ↔ "Шкодер" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-vrwi3ayba ↔ button("СарандаПрибережне") | "(empty)" ↔ "СарандаПрибережне" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-2dqn8ob32 ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-5quw6indy ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-5quw6indy ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-mwjdt4f2m ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-mwjdt4f2m ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-320 | `mantine-primitives-combobox--default__it__mobile-320.png` | ambiguous-overlap | #mantine-tnkjj6w13 ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-8m4613poh ↔ #mantine-42au1flm9 | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-8m4613poh ↔ button("Tutte le città") | "(empty)" ↔ "Tutte le città" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-u4006bx9v ↔ button("Valona") | "(empty)" ↔ "Valona" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-u4006bx9v ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-zvx43w5gm ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-375 | `mantine-primitives-combobox--default__it__mobile-375.png` | ambiguous-overlap | #mantine-zvx43w5gm ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-cf5mpb1yz ↔ #mantine-ui3cadodc | "(empty)" ↔ "(empty)" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-6n0rsj61c ↔ button("Tirana") | "(empty)" ↔ "Tirana" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-6n0rsj61c ↔ button("Durazzo") | "(empty)" ↔ "Durazzo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-asdpicaul ↔ button("Scutari") | "(empty)" ↔ "Scutari" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-asdpicaul ↔ button("SarandaCostiera") | "(empty)" ↔ "SarandaCostiera" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-crtuacmwg ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | sq | desktop-1024 | `mantine-primitives-drawer--default__sq__desktop-1024.png` | ambiguous-overlap | button("Hap panelin") ↔ button("Anulo") | "Hap panelin" ↔ "Anulo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | sq | desktop-1024 | `mantine-primitives-drawer--default__sq__desktop-1024.png` | ambiguous-overlap | button("Hap panelin") ↔ button("Konfirmo") | "Hap panelin" ↔ "Konfirmo" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | en | desktop-1024 | `mantine-primitives-drawer--default__en__desktop-1024.png` | ambiguous-overlap | button("Open drawer") ↔ button("Cancel") | "Open drawer" ↔ "Cancel" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | en | desktop-1024 | `mantine-primitives-drawer--default__en__desktop-1024.png` | ambiguous-overlap | button("Open drawer") ↔ button("Confirm") | "Open drawer" ↔ "Confirm" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | uk | desktop-1024 | `mantine-primitives-drawer--default__uk__desktop-1024.png` | ambiguous-overlap | button("Відкрити панель") ↔ button("Скасувати") | "Відкрити панель" ↔ "Скасувати" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | uk | desktop-1024 | `mantine-primitives-drawer--default__uk__desktop-1024.png` | ambiguous-overlap | button("Відкрити панель") ↔ button("Підтвердити") | "Відкрити панель" ↔ "Підтвердити" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | it | desktop-1024 | `mantine-primitives-drawer--default__it__desktop-1024.png` | ambiguous-overlap | button("Apri pannello") ↔ button("Annulla") | "Apri pannello" ↔ "Annulla" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-drawer--default` | it | desktop-1024 | `mantine-primitives-drawer--default__it__desktop-1024.png` | ambiguous-overlap | button("Apri pannello") ↔ button("Conferma") | "Apri pannello" ↔ "Conferma" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-reviny9pm-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-offscreen | #mantine-yr63ekdw4-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) |

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
- **Run timestamp:** 2026-07-05T07-52
