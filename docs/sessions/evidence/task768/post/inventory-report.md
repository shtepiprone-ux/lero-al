# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)

**Harness:** `scripts/check-stories-rendered.mjs` + `scripts/geometry-integrity.mjs` (Task 467 R1–R4/B1–B8) — run timestamp recorded in `.screenshots/rendered-assert/<ts>/manifest.json`
**Run mode:** mantine-only (320/375/390 × sq/en/uk/it) | **Scope:** mantine-only (rendered scope only — Phase 1 (ASSERT_STORIES — including the 4 `.listing-card` anchor rows: system-featuredlistings--default, system-latestlistings--default, system-similarlistings--default, patterns-mantine-homepagelistinggrids--default); Phase 2 (geometry-only sweep) NOT run; 80 stories, 1332 cells)

> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.
> mantine-only run. NOT RUN: Phase 1 (ASSERT_STORIES — including the 4 `.listing-card` anchor rows: system-featuredlistings--default, system-latestlistings--default, system-similarlistings--default, patterns-mantine-homepagelistinggrids--default); Phase 2 (geometry-only sweep).

## Summary (three-bucket model + style integrity)

| Counter | Count |
|---------|-------|
| Total cells | 1332 |
| PASS (clean, verdict=pass) | 1225 |
| FAIL (hard defect, verdict=fail) | 80 |
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
| `patterns-mantine-authsheet--login` | sq | mobile-375 | `patterns-mantine-authsheet--login__sq__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | sq | mobile-390 | `patterns-mantine-authsheet--login__sq__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | en | mobile-375 | `patterns-mantine-authsheet--login__en__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | en | mobile-390 | `patterns-mantine-authsheet--login__en__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | uk | mobile-375 | `patterns-mantine-authsheet--login__uk__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | uk | mobile-390 | `patterns-mantine-authsheet--login__uk__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | it | mobile-375 | `patterns-mantine-authsheet--login__it__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login` | it | mobile-390 | `patterns-mantine-authsheet--login__it__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | sq | mobile-320 | `patterns-mantine-authsheet--register__sq__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | sq | mobile-375 | `patterns-mantine-authsheet--register__sq__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | sq | mobile-390 | `patterns-mantine-authsheet--register__sq__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | sq | desktop-1024 | `patterns-mantine-authsheet--register__sq__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | en | mobile-320 | `patterns-mantine-authsheet--register__en__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | en | mobile-375 | `patterns-mantine-authsheet--register__en__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | en | mobile-390 | `patterns-mantine-authsheet--register__en__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | en | desktop-1024 | `patterns-mantine-authsheet--register__en__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | uk | mobile-320 | `patterns-mantine-authsheet--register__uk__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | uk | mobile-375 | `patterns-mantine-authsheet--register__uk__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | uk | mobile-390 | `patterns-mantine-authsheet--register__uk__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | uk | desktop-1024 | `patterns-mantine-authsheet--register__uk__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | it | mobile-320 | `patterns-mantine-authsheet--register__it__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | it | mobile-375 | `patterns-mantine-authsheet--register__it__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | it | mobile-390 | `patterns-mantine-authsheet--register__it__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register` | it | desktop-1024 | `patterns-mantine-authsheet--register__it__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | sq | mobile-320 | `patterns-mantine-authsheet--register-agent__sq__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | sq | mobile-375 | `patterns-mantine-authsheet--register-agent__sq__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | sq | mobile-390 | `patterns-mantine-authsheet--register-agent__sq__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | sq | desktop-1024 | `patterns-mantine-authsheet--register-agent__sq__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | en | mobile-320 | `patterns-mantine-authsheet--register-agent__en__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | en | mobile-375 | `patterns-mantine-authsheet--register-agent__en__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | en | mobile-390 | `patterns-mantine-authsheet--register-agent__en__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | en | desktop-1024 | `patterns-mantine-authsheet--register-agent__en__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | uk | mobile-320 | `patterns-mantine-authsheet--register-agent__uk__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | uk | mobile-375 | `patterns-mantine-authsheet--register-agent__uk__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | uk | mobile-390 | `patterns-mantine-authsheet--register-agent__uk__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | uk | desktop-1024 | `patterns-mantine-authsheet--register-agent__uk__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | it | mobile-320 | `patterns-mantine-authsheet--register-agent__it__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | it | mobile-375 | `patterns-mantine-authsheet--register-agent__it__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | it | mobile-390 | `patterns-mantine-authsheet--register-agent__it__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent` | it | desktop-1024 | `patterns-mantine-authsheet--register-agent__it__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | sq | mobile-320 | `patterns-mantine-authsheet--forgot-password__sq__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | sq | mobile-375 | `patterns-mantine-authsheet--forgot-password__sq__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | sq | mobile-390 | `patterns-mantine-authsheet--forgot-password__sq__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | sq | desktop-1024 | `patterns-mantine-authsheet--forgot-password__sq__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | en | mobile-320 | `patterns-mantine-authsheet--forgot-password__en__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | en | mobile-375 | `patterns-mantine-authsheet--forgot-password__en__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | en | mobile-390 | `patterns-mantine-authsheet--forgot-password__en__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | en | desktop-1024 | `patterns-mantine-authsheet--forgot-password__en__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | uk | mobile-320 | `patterns-mantine-authsheet--forgot-password__uk__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | uk | mobile-375 | `patterns-mantine-authsheet--forgot-password__uk__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | uk | mobile-390 | `patterns-mantine-authsheet--forgot-password__uk__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | uk | desktop-1024 | `patterns-mantine-authsheet--forgot-password__uk__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | it | mobile-320 | `patterns-mantine-authsheet--forgot-password__it__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | it | mobile-375 | `patterns-mantine-authsheet--forgot-password__it__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | it | mobile-390 | `patterns-mantine-authsheet--forgot-password__it__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--forgot-password` | it | desktop-1024 | `patterns-mantine-authsheet--forgot-password__it__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | sq | mobile-375 | `patterns-mantine-authsheet--login-validation-error__sq__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | sq | mobile-390 | `patterns-mantine-authsheet--login-validation-error__sq__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | en | mobile-375 | `patterns-mantine-authsheet--login-validation-error__en__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | en | mobile-390 | `patterns-mantine-authsheet--login-validation-error__en__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | uk | mobile-375 | `patterns-mantine-authsheet--login-validation-error__uk__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | uk | mobile-390 | `patterns-mantine-authsheet--login-validation-error__uk__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | it | mobile-375 | `patterns-mantine-authsheet--login-validation-error__it__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--login-validation-error` | it | mobile-390 | `patterns-mantine-authsheet--login-validation-error__it__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | sq | mobile-320 | `patterns-mantine-authsheet--register-agent-add-company__sq__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | sq | mobile-375 | `patterns-mantine-authsheet--register-agent-add-company__sq__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | sq | mobile-390 | `patterns-mantine-authsheet--register-agent-add-company__sq__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | sq | desktop-1024 | `patterns-mantine-authsheet--register-agent-add-company__sq__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | en | mobile-320 | `patterns-mantine-authsheet--register-agent-add-company__en__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | en | mobile-375 | `patterns-mantine-authsheet--register-agent-add-company__en__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | en | mobile-390 | `patterns-mantine-authsheet--register-agent-add-company__en__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | en | desktop-1024 | `patterns-mantine-authsheet--register-agent-add-company__en__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | uk | mobile-320 | `patterns-mantine-authsheet--register-agent-add-company__uk__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | uk | mobile-375 | `patterns-mantine-authsheet--register-agent-add-company__uk__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | uk | mobile-390 | `patterns-mantine-authsheet--register-agent-add-company__uk__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | uk | desktop-1024 | `patterns-mantine-authsheet--register-agent-add-company__uk__desktop-1024.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | it | mobile-320 | `patterns-mantine-authsheet--register-agent-add-company__it__mobile-320.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | it | mobile-375 | `patterns-mantine-authsheet--register-agent-add-company__it__mobile-375.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | it | mobile-390 | `patterns-mantine-authsheet--register-agent-add-company__it__mobile-390.png` | (render/visual) |  |  |
| `patterns-mantine-authsheet--register-agent-add-company` | it | desktop-1024 | `patterns-mantine-authsheet--register-agent-add-company__it__desktop-1024.png` | (render/visual) |  |  |

---

## Bucket 1b: Tracked known failures (Task 607 registry — real defects, dedicated follow-up task, non-blocking)

| Story ID | Locale | Viewport | Screenshot | Fail Reason | Follow-up Task |
|---|---|---|---|---|---|
| *(none)* | | | | | |

---

## Bucket 2: Needs-owner-decision (ambiguous third state)

| Story ID | Locale | Viewport | Screenshot | Fail Reason | Selector | Label | Reason |
|---|---|---|---|---|---|---|---|
| `admin-adminuserstable--default` | sq | mobile-320 | `admin-adminuserstable--default__sq__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-all | Të gjithë përdoruesit | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | sq | mobile-320 | `admin-adminuserstable--default__sq__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-verified | ✓ Agjentë të verifikuar | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | sq | mobile-320 | `admin-adminuserstable--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-<id>-tab-verified | ✓ Agjentë të verifikuar | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `admin-adminuserstable--default` | sq | mobile-320 | `admin-adminuserstable--default__sq__mobile-320.png` | ambiguous-outside-scrollable | #mantine-<id>-tab-verified | ✓ Agjentë të verifikuar | element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | sq | mobile-375 | `admin-adminuserstable--default__sq__mobile-375.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-all | Të gjithë përdoruesit | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | sq | mobile-375 | `admin-adminuserstable--default__sq__mobile-375.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-verified | ✓ Agjentë të verifikuar | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | uk | mobile-320 | `admin-adminuserstable--default__uk__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-all | Всі користувачі | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | uk | mobile-320 | `admin-adminuserstable--default__uk__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-verified | ✓ Верифіковані агенти | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `admin-adminuserstable--default` | uk | mobile-320 | `admin-adminuserstable--default__uk__mobile-320.png` | ambiguous-offscreen | #mantine-<id>-tab-verified | ✓ Верифіковані агенти | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `admin-adminuserstable--default` | uk | mobile-320 | `admin-adminuserstable--default__uk__mobile-320.png` | ambiguous-outside-scrollable | #mantine-<id>-tab-verified | ✓ Верифіковані агенти | element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-combobox--default` | sq | mobile-390 | `mantine-primitives-combobox--default__sq__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Prona me qira afatgjatë pranë ") | "(empty)" ↔ "Prona me qira afatgjatë pranë qendrës historike të qytetit m" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | en | mobile-390 | `mantine-primitives-combobox--default__en__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Long-term rental properties ne") | "(empty)" ↔ "Long-term rental properties near the historic city center wi" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | uk | mobile-390 | `mantine-primitives-combobox--default__uk__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Довгострокова оренда нерухомос") | "(empty)" ↔ "Довгострокова оренда нерухомості поблизу історичного центру " | background page content behind an opened overlay's backdrop |
| `mantine-primitives-combobox--default` | it | mobile-390 | `mantine-primitives-combobox--default__it__mobile-390.png` | ambiguous-overlap | #mantine-<id> ↔ button("Immobili in affitto a lungo te") | "(empty)" ↔ "Immobili in affitto a lungo termine vicino al centro storico" | background page content behind an opened overlay's backdrop |
| `mantine-primitives-popularlocationsview--long-city-name` | sq | mobile-320 | `mantine-primitives-popularlocationsview--long-city-name__sq__mobile-320.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | sq | mobile-375 | `mantine-primitives-popularlocationsview--long-city-name__sq__mobile-375.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | sq | mobile-390 | `mantine-primitives-popularlocationsview--long-city-name__sq__mobile-390.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | sq | desktop-1024 | `mantine-primitives-popularlocationsview--long-city-name__sq__desktop-1024.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | en | mobile-320 | `mantine-primitives-popularlocationsview--long-city-name__en__mobile-320.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | en | mobile-375 | `mantine-primitives-popularlocationsview--long-city-name__en__mobile-375.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | en | mobile-390 | `mantine-primitives-popularlocationsview--long-city-name__en__mobile-390.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | en | desktop-1024 | `mantine-primitives-popularlocationsview--long-city-name__en__desktop-1024.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | uk | mobile-320 | `mantine-primitives-popularlocationsview--long-city-name__uk__mobile-320.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | uk | mobile-375 | `mantine-primitives-popularlocationsview--long-city-name__uk__mobile-375.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | uk | mobile-390 | `mantine-primitives-popularlocationsview--long-city-name__uk__mobile-390.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | uk | desktop-1024 | `mantine-primitives-popularlocationsview--long-city-name__uk__desktop-1024.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | it | mobile-320 | `mantine-primitives-popularlocationsview--long-city-name__it__mobile-320.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | it | mobile-375 | `mantine-primitives-popularlocationsview--long-city-name__it__mobile-375.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | it | mobile-390 | `mantine-primitives-popularlocationsview--long-city-name__it__mobile-390.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-popularlocationsview--long-city-name` | it | desktop-1024 | `mantine-primitives-popularlocationsview--long-city-name__it__desktop-1024.png` | text-clipped-ellipsis | a("Rrogozhinë-Peqin-Kavajë Bashki") | Rrogozhinë-Peqin-Kavajë Bashkiake | intentional ellipsis with accessible name or content link |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-overview | Përmbledhje | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-details | Detajet | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-activity | Regjistri i aktivitetit | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-<id>-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-outside-scrollable | #mantine-<id>-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-375 | `mantine-primitives-tabs--default__sq__mobile-375.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-overview | Përmbledhje | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-375 | `mantine-primitives-tabs--default__sq__mobile-375.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-details | Detajet | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-375 | `mantine-primitives-tabs--default__sq__mobile-375.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-activity | Regjistri i aktivitetit | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | sq | mobile-375 | `mantine-primitives-tabs--default__sq__mobile-375.png` | ambiguous-outside-scrollable | #mantine-<id>-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | uk | mobile-320 | `mantine-primitives-tabs--default__uk__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-overview | Огляд | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | uk | mobile-320 | `mantine-primitives-tabs--default__uk__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-details | Деталі | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | uk | mobile-320 | `mantine-primitives-tabs--default__uk__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-activity | Журнал активності | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | uk | mobile-320 | `mantine-primitives-tabs--default__uk__mobile-320.png` | ambiguous-outside-scrollable | #mantine-<id>-tab-activity | Журнал активності | element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-overview | Panoramica | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-details | Dettagli | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-text-clipped-scrollable | #mantine-<id>-tab-activity | Registro attività | text reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-offscreen | #mantine-<id>-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-outside-scrollable | #mantine-<id>-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) — same R1 rule as Check 2 |

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
