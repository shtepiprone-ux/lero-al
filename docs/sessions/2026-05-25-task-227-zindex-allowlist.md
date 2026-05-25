# Task 227 — z-index allowlist: ListingGallery z-[100]

**Date:** 2026-05-25
**Sprint:** Sprint 11 — UI Debt Follow-ups
**Status:** ✅ DONE

## Scope

Add `ListingGallery.tsx z-[100]` to the tailwind-entropy allowlist and update the §11 z-index table in `tailwind-governance.md`.

## Pre-existing bug fixed

`scripts/governance/tailwind-entropy.allowlist.json` had a JSON syntax error: missing comma after the last `arbitrary-font-size` entry (after `ListingGrid.stories.tsx`) before the first `arbitrary-z-index` entry. Fixed as part of this task.

## Changes

### `scripts/governance/tailwind-entropy.allowlist.json`
- Fixed: added missing comma between the `ListingGrid.stories.tsx` font-size entry and the `PerfDevOverlay` z-index entry.
- Added new `arbitrary-z-index` entry:
  ```json
  {
    "rule": "arbitrary-z-index",
    "file": "src/modules/listings/components/ListingGallery.tsx",
    "pattern": "z-[100]",
    "reason": "Full-screen gallery overlay must sit above all floating UI (dialogs z-50, sheets z-50). Fixed inset-0 — no conflict with positioned content.",
    "reviewer": "governance",
    "expires": "2026-12-01",
    "severity": "MEDIUM",
    "why_safe": "Full-screen inset-0 overlay. Cannot overlap other content because it covers the entire viewport. Layer value consistent with Sonner toast layer."
  }
  ```

### `docs/tailwind-governance.md §11`
- Updated Toast row: `| Toast | z-[100] | Sonner toasts |` → `| Toast / Gallery | z-[100] | Sonner toasts; ListingGallery full-screen overlay (allowlisted) |`

## Verification

JSON is now valid (no syntax errors). `z-[100]` is documented in both the allowlist and the z-index table.
