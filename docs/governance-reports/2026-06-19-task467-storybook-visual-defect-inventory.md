# Task 467 — Storybook visual-defect inventory (geometry + style integrity layers)

**Date:** 2026-07-04 | **Harness:** `scripts/check-stories-rendered.mjs` + `scripts/geometry-integrity.mjs` (Task 467 R1–R4/B1–B8)
**Run mode:** full (320/375/390 × sq/en/uk/it) | **Scope:** Global enumeration (275 stories, 400 cells)

> **Harness-generated inventory.** Every row below is emitted by the harness from the manifest.
> Full global-enumeration run.

## Summary (three-bucket model + style integrity)

| Counter | Count |
|---------|-------|
| Total cells | 400 |
| PASS (clean, verdict=pass) | 397 |
| FAIL (hard defect, verdict=fail) | 0 |
| OUT-OF-RANGE (viewport mismatch, not product defect) | 0 |
| AMBIGUOUS (needs-owner-decision, verdict=ambiguous) | 3 |
| text-clipped | 0 |
| offscreen-control | 0 |
| outside-container | 0 |
| element-overlap | 0 |
| bottomsheet-overflow | 0 |
| ambiguous-overlap | 3 |
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
| `mantine-primitives-tabs--default` | sq | mobile-320 | `mantine-primitives-tabs--default__sq__mobile-320.png` | ambiguous-offscreen | #mantine-3fn15fosk-tab-activity | Regjistri i aktivitetit | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | uk | mobile-320 | `mantine-primitives-tabs--default__uk__mobile-320.png` | ambiguous-offscreen | #mantine-nn51rkn8i-tab-activity | Журнал активності | element reachable by horizontal scrolling (carousel/scroll-tabs) |
| `mantine-primitives-tabs--default` | it | mobile-320 | `mantine-primitives-tabs--default__it__mobile-320.png` | ambiguous-offscreen | #mantine-v1qop0ti1-tab-activity | Registro attività | element reachable by horizontal scrolling (carousel/scroll-tabs) |

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
- **Run timestamp:** 2026-07-04T13-17
