# Task 545 — Separator primitive → TailAdmin (Phase 1 · P1.25)

**Sprint 40 / Epic MM. Executor: direct execution, no orchestrator layer in this session.**

## Summary

New canonical Mantine `Divider` primitive + `Mantine/Primitives/Separator` story. Primitive + story only,
zero consumer migration (Phase 2), per the P1.23/P1.24 precedent.

**Step 0 extraction result: positive — real `<hr>` + vertical-divider markup found in the zip,** resolving
the kickoff's gray-100-vs-gray-200 ambiguity:
- Horizontal (`html/image-generator.html` + 3 other generator pages, 10–13 occurrences, dropdown-menu
  between-item dividers): `<hr class="my-1 border-gray-200 dark:border-white/10"/>`. Color = **gray-200**
  `#e4e7ec` (`.border-gray-200{border-color:var(--color-gray-200)}` + `--color-gray-200:#e4e7ec`, both
  confirmed in `css/style.css`) — NOT gray-100 (a different, lower-contrast token for a different surface).
  Thickness = **1px** (Tailwind's `hr{border-top-width:1px}` preflight reset). Style = **solid** (Tailwind's
  universal `*{border:0 solid}` preflight, no dashed/dotted utility present).
- Vertical (`html/index.html`/`saas.html`/`invoices.html` toolbar/sidebar dividers):
  `class="h-7 w-px bg-gray-200 dark:bg-gray-800"` — same gray-200 token, applied as a filled 1px bar.
- **Labeled divider — NOT found.** All 10 `<hr>` occurrences are plain menu-item separators with no adjacent
  label ("OR"-style auth divider). Story ships horizontal + vertical only, no labeled variant.

Full record: `docs/tailadmin-style-reference.md` §6o.

**Zero wrapper needed** — Mantine's raw `<Divider>` is a strict superset of the legacy `separator.tsx`
contract (Base-UI `Separator`, orientation + `bg-border`).

**`theme.ts`: `defaultProps: { color: 'gray.2' }` — no `-chrome.css` file, contrary to the Skeleton
precedent.** Verified against `@mantine/core`'s compiled `Divider.mjs`: unlike Skeleton's hardcoded
pseudo-element pulse color, `Divider`'s border color is a normal element style
(`border-top`/`border-inline-start`), and the component's own `varsResolver` already reads the `color` prop.
So a plain `defaultProps` entry resolves the one real divergence (Mantine's own default is `gray-3`, one
shade off `gray-2`). Rendered proof: `getComputedStyle` → `borderTopColor`/`borderInlineStartColor` =
`rgb(228, 231, 236)` (`#e4e7ec`) on both orientations. Thickness (1px) and style (solid) already matched
Mantine's own defaults — zero-override for both. Documented in `storybook-governance.md` §14.9.13 as the
general lesson (check the compiled source per component; don't assume the same fix mechanism applies).

**Loader-allowlist: verified NOT needed** (same empirical-verification discipline as Task 544, this time
following the kickoff's own instruction not to copy the Skeleton assumption forward). All 6 `loaderPresent`
signals `false` on the built story. `LOADER_ALLOWLIST` UNCHANGED. Documented in
`storybook-governance.md` §14.9.12.

**i18n — corrected the Task 544 pattern per this kickoff's explicit instruction.** All dev-annotation/spec
commentary (§-citations, token names) lives in JSX comments (never rendered, never needs translation);
every VISIBLE string in the story (`separator_content_intro`, `separator_content_details`,
`separator_item_left`, `separator_item_right`, `separator_content_long`) is `storyT`-driven with full
sq/en/uk/it parity — 5 new keys added to all 4 `messages/*.json` files (2082→2087 keys). `check:stories`
Check 10 confirms 0 violations (no hardcoded JSX text/prop literals).

## Consumer audit (expected zero — confirmed)

`grep -rl "@/components/ui/separator" src` (and the relative-path equivalent) → **0 consumers.** Matches the
kickoff's stated expectation exactly.

## Mobile <640 full-width gate (clause 11)

Horizontal `<Divider />` is full-width by default (Mantine's own root width, no fixed px). Vertical
`<Divider orientation="vertical" />` stays intrinsic 1px width / stretches to `Group` sibling height
(documented exemption — same class as Skeleton's circle exemption; a vertical rule is not a full-width
surface). `≥44px` tap-target N/A — non-interactive (`role="separator"`, not focusable).

## Gates

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 101 files, 0 violations
npm run check:i18n                   → PASSED, 4 locales, 2087 keys (5 new)
npm run check:mojibake               → 0 artifacts, 1564 files
npm run check:design-tokens --strict → 0 violations, 394 files scanned
npm run check:file-integrity         → PASSED, 10 files clean
npm run build-storybook              → built clean (3x: initial, planted, reverted)
npm run screenshots:assert -- --mantine-only → 414/432 PASS, 0 FAIL, 18 AMBIGUOUS (pre-existing Task 538
                                        set, unchanged — 16 documented ambiguous-overlap + 2 Tabs swipe)
```

## Planted-violation transcript (AC5)

Planted a `<div data-testid="task545-planted-overflow" style={{width:900, height:12}} />` at the top of the
story (temporary). Pre-check confirmed real document overflow at 320px viewport (`scrollWidth=916` vs
`clientWidth=320`). Full native gate:

```
Results: 402/432 PASS, 12 FAIL, 18 AMBIGUOUS
❌ Failed cells:
  Mantine/Primitives/Separator/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390}
    ✗ horizontal overflow detected
```

Exactly the expected 12 cells; desktop-1024 correctly unaffected. Reverted (`grep -n "planted"` → 0 matches),
rebuilt, reconfirmed green: **414/432 PASS, 0 FAIL, 18 AMBIGUOUS** (identical to the pre-plant baseline).

## Regression (clause 15)

`grep -in separator docs/critical-flow-registry.md` → 0 matches, no registered critical flow touched.
Theme-only + new-file change scoped to `Divider`; no other primitive's `theme.ts` block, story, or chrome
CSS modified; no `-chrome.css` file created at all this task.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/theme.ts` | New `Divider: { defaultProps: { color: 'gray.2' } }` block + comment | Fixes the one real §6o divergence (base color); thickness/style already zero-override |
| `src/stories/mantine/primitives/Separator.stories.tsx` | New file — `Default` story: horizontal, vertical, long-content negative-flow states | Required rendered-proof surface, AC2 |
| `messages/en.json`, `sq.json`, `uk.json`, `it.json` | 5 new `storybook.mantine.separator_*` keys each | i18n parity for the story's visible content, per this kickoff's explicit correction of the Task 544 pattern |
| `docs/tailadmin-style-reference.md` | New `## 6o.` section | Step 0 extraction record (positive result, gray-200 confirmed over gray-100), AC1 |
| `docs/storybook-governance.md` | New `§14.9.12` + `§14.9.13` | Records the verified "no loader-allowlist needed" finding (AC3) + the "defaultProps sufficient, no chrome CSS" mechanism finding |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.25 row updated ⬜ → 🟡 Task 545 | Tracker accuracy |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` (final clean run) | Standing auto-generated artifact |

No product/consumer file touched (zero consumers exist for `separator.tsx`, confirmed above).

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | New §6o row extracted FIRST, color/thickness/style cited, zero invented | ✅ | `tailadmin-style-reference.md` §6o — positive extraction, gray-200 confirmed over gray-100, both orientations cross-checked |
| 2 | `theme.ts` (defaultProps/vars preferred) + story render matching reference at ≥640/320 × 4 locales, `storyT` i18n parity | ✅ | `defaultProps.color` sufficient (rendered proof: `#e4e7ec`); story renders horizontal/vertical/long-content states; native gate 414/432 PASS; 0 hardcoded JSX text (Check 10 clean) |
| 3 | `LOADER_ALLOWLIST` verified empirically — UNCHANGED, no assumption copied from Task 544 | ✅ | §14.9.12 — all 6 signals false, confirmed independently (not copy-pasted from Skeleton's finding) |
| 4 | Consumer audit in session log (expect zero; migrate zero); no other primitive regressed | ✅ | 0 consumers confirmed; gate shows 0 new FAIL/ambiguous outside Separator's own cells |
| 5 | Rendered `--assert` matrix + planted-violation transcript; all light gates green | ✅ | Both transcripts above; all 6 light gates green |
| 6 | Session log: Files-Changed, AC self-audit, `Self-validation:` line; no git run | ✅ | This file; no `git` command executed |

## Self-validation

Self-validation: all 6 ACs met with rendered-gate evidence. Step 0 extraction resolved a genuine ambiguity
(gray-100 vs gray-200) with a real zip citation rather than guessing. The color-override mechanism was
verified per-component against compiled source rather than assumed from the Skeleton precedent — found
`defaultProps` sufficient this time, avoiding an unnecessary `-chrome.css` file, and documented the general
lesson. The Task 544 dev-annotation-caption pattern was NOT repeated — all visible story text is
`storyT`-driven with genuine 4-locale parity, per this kickoff's explicit correction. Loader-allowlist
assumption was independently re-verified, not copied forward. Planted-violation transcript proves the gate
still catches a real defect on this surface (12/12 expected cells FAILed, reverted clean). Final native
gate: 414/432 PASS, 0 FAIL, 18 AMBIGUOUS (all pre-existing from Task 538, unchanged). Zero product/consumer
file touched; zero new CSS chrome file created.
**HELD — no git commands run; awaiting review + explicit-path commit emission.**
