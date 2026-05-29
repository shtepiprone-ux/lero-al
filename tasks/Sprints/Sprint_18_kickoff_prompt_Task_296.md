# Sprint 18 — Task 296 kickoff (Tailwind entropy MEDIUM/LOW audit + TabButton canonical extraction)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off). Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **Tailwind / styling governance** audit task + minor component extraction — pre-read `tailwind-governance.md`, `tailwind-canonical-fragments.md`, `tailwind-entropy-audit.md`, `ui-rules.md`, `component-rules.md`, `qa-rules.md`. No scope change; STOP & ASK if ambiguous.

---

```
Type:        audit + targeted refactor (tailwind entropy classification + 1 canonical fragment extraction)
Priority:    MEDIUM (follow-up to Task 283; non-blocking; closes audit gap exposed during 283 review)
Area:        tailwind entropy MEDIUM/LOW classification + TabButton fragment
```

## Why this task exists (2026-05-29 orchestrator review of Task 283)

Task 283 burned down three named buckets (3 HIGH button-clones, 1 MEDIUM `py-10`, ~47 LOW arbitrary font-sizes via allowlist). The kickoff explicitly excluded the remaining entropy findings: *"this task burns down the three concrete, prioritized buckets ... the rest stay tracked"*. After Task 283:

- `tailwind-entropy.mjs --report` → **MEDIUM: 14, LOW: 220** (tracked, not gated)
- `governance:tailwind` (CI gate) → `C0/H0/M0` ✅

The 14 MEDIUM + 220 LOW have never been **classified** as a working set. They are an aggregate metric. The orchestrator wants:
1. A classified, file-level inventory of the 14 MEDIUM — split into (a) genuinely fixable / (b) legitimate exception → add to allowlist with reason / (c) deferred (open named-bucket task).
2. A sampled audit of the 220 LOW — 30 random samples + same classification — to estimate the burn-down vs allowlist ratio for a future LOW sprint.
3. **One canonical extraction**: introduce a `TabButton` variant (either as a new `Button` `size` variant or as a documented fragment in `tailwind-canonical-fragments.md`) and migrate the three admin segmented-tab call sites (`AdminListingsTable`, `AdminSettings`, `AdminUsersTable`) from "Button + custom px-4/py-2/h-auto className" to the canonical token. This closes the "button-like className on Button component" pattern noted in Task 283 review.

This task is **deliberately small**: an audit deliverable + one component extraction. No new features. No visual change.

## Goal

1. Produce `docs/governance-reports/2026-05-29-tailwind-entropy-medium-audit.md` (NEW) with a classified table for every MEDIUM finding (target = 14):

   | File:line | Category | Pattern | Verdict | Action |
   |-----------|----------|---------|---------|--------|
   | … | overflow-risk | `whitespace-nowrap` without `truncate` | fixable / legitimate / deferred | (fix in this task / new allowlist entry / file follow-up Task N) |

2. Produce `docs/governance-reports/2026-05-29-tailwind-entropy-low-sample.md` (NEW) with the same classification for a random 30-sample of the 220 LOW findings (use `node` to pick deterministic 30 via seeded random or first/last/middle 10 each).
3. **Fix the genuinely-fixable subset of the 14 MEDIUM** (estimated 3–6 entries — `nowrap-without-truncate` is usually fixable; `missing-2xl-grid` is usually a 1-line `2xl:grid-cols-N` add; `arbitrary-z-index` on stack-context legitimate overlays is usually allowlist).
4. **Extract canonical TabButton** — pick the lower-friction path:
   - **Path A (preferred):** add a `tab` size variant to `Button` CVA in `src/components/ui/button.tsx` (e.g. `tab: "h-auto px-4 py-2 rounded-lg text-sm hover:bg-card"`). Migrate the three admin tabs to `<Button variant="ghost" size="tab">` and drop the custom className.
   - **Path B (fallback):** create `src/components/shared/AdminSegmentedTab.tsx` wrapper. Document the choice in `tailwind-canonical-fragments.md`.
   - **STOP & ASK** before committing to Path A vs B (they have different ripple). Default suggestion: Path A.

This task is NOT a 220-LOW burn-down — the LOW sample is for **planning**, not execution. After this task lands, the orchestrator opens a follow-up named-bucket task (e.g. "Tailwind LOW burn-down sprint") if the sample shows a meaningful fixable ratio.

## Current behavior to preserve (Note 19 + 20)

- Three admin segmented tabs (AdminListingsTable / AdminSettings / AdminUsersTable) keep identical visual output (h-auto, px-4, py-2, rounded-lg, text-sm, hover behavior, active `bg-card shadow-sm text-foreground`, inactive `text-muted-foreground hover:text-foreground`). After TabButton extraction, **the rendered DOM should be byte-identical** at all 7 breakpoints in `uk`.
- onClick/navigate/setTab handlers untouched.
- Any MEDIUM finding "fixed" via code change MUST preserve runtime behavior — e.g. adding `truncate` to a `whitespace-nowrap` element only if the content is genuinely safe to truncate (Albanian-translated labels usually are NOT; orchestrator advice: prefer `min-w-0` + flexbox over `truncate`).

## Positive / Negative flow

This is mainly an audit task — no new user flows. For the TabButton extraction:
- **Positive:** all three tabs render identically; same onClick fires; URL navigation / `setTab` preserved; active visual matches pixel-for-pixel.
- **Negative:** if Path A's `size="tab"` causes a visual regression on any of the three sites (different padding, different height, different rounded radius, hover bg drift), STOP and revert — do not paper over with `className` re-overrides. Either find a CVA composition that's a true superset, or fall back to Path B.

## Required investigation (PASTE in session log)

```
npm run governance:tailwind                     # confirm baseline post-Task-283: C0/H0/M0
node scripts/governance/tailwind-entropy.mjs --report
                                                # produce the full entropy report; capture allFindings counts
cat scripts/governance/reports/tailwind-entropy-latest.json | jq '[.[] | select(.severity == "MEDIUM")] | length'
cat scripts/governance/reports/tailwind-entropy-latest.json | jq '[.[] | select(.severity == "MEDIUM")] | group_by(.category) | map({category: .[0].category, count: length})'
# Extract the 14 MEDIUM into a working file
cat scripts/governance/reports/tailwind-entropy-latest.json | jq '[.[] | select(.severity == "MEDIUM")]' > /tmp/medium-14.json
# Sample 30 LOW deterministically
cat scripts/governance/reports/tailwind-entropy-latest.json | jq '[.[] | select(.severity == "LOW")] | length'
# (use seeded random or first/middle/last 10)
sed -n '455,475p' src/components/admin/AdminListingsTable.tsx
sed -n '120,140p' src/components/admin/AdminSettings.tsx
sed -n '90,110p'  src/components/admin/AdminUsersTable.tsx
cat src/components/ui/button.tsx | sed -n '1,75p'   # Button CVA structure
cat docs/tailwind-canonical-fragments.md            # to choose extraction location
```

Confirm the MEDIUM total is exactly 14 before classification. If different (10, 16, 20), STOP & ASK — Task 283's BEFORE/AFTER may have drifted.

## Scope (files Sonnet may touch)

- `docs/governance-reports/2026-05-29-tailwind-entropy-medium-audit.md` (NEW)
- `docs/governance-reports/2026-05-29-tailwind-entropy-low-sample.md` (NEW)
- `docs/tailwind-canonical-fragments.md` — to document the chosen TabButton path (Path A: new Button size; Path B: shared component).
- `src/components/ui/button.tsx` (Path A only — add `tab` size to CVA `size` variants)
- `src/components/shared/AdminSegmentedTab.tsx` (Path B only — new wrapper)
- `src/components/admin/AdminListingsTable.tsx`, `AdminSettings.tsx`, `AdminUsersTable.tsx` — migrate the tab buttons to canonical TabButton; drop custom className.
- `scripts/governance/tailwind-entropy.allowlist.json` — new entries ONLY for MEDIUM findings classified as "legitimate exception" with documented reason. Each entry follows the existing schema (rule / file / pattern / reason / reviewer / expires / severity / why_safe).
- File(s) containing any MEDIUM finding that is classified as "fixable in this task" — code-level fix.
- `docs/backlog.md` (closure entry).
- `docs/sessions/2026-05-29-task-296-tailwind-entropy-audit.md` (NEW).

**Maximum SOURCE-FILE delta:** 3 admin tab files + Button.tsx (Path A) OR + AdminSegmentedTab.tsx (Path B) + ≤6 files with MEDIUM-fix code edits. If you find yourself touching more, STOP & ASK.

## Out of scope (do NOT touch)

- **Task 283's already-allowlisted entries** (the 19 old + 10 new font-size entries). Do NOT re-classify or re-justify them — they shipped with Task 283.
- **Task 295's lint baseline files** (`PasswordInput.stories.tsx`, `contacts/actions/index.ts`, `ListingContact/MobileCTA`, etc.). Task 295 runs concurrently; do not touch its file scope.
- **Task 294's filter logic.**
- **The 220 LOW findings beyond the 30-sample** — sampling is for planning only.
- **`tailwind-entropy.mjs` core scanner logic** — only the allowlist may grow; the scanner code is unchanged.
- **Any visual redesign, color change, locale key, feature change.**

## Acceptance criteria (literal)

- `docs/governance-reports/2026-05-29-tailwind-entropy-medium-audit.md` exists; the table covers exactly the 14 MEDIUM findings; every row has a Verdict and an Action.
- `docs/governance-reports/2026-05-29-tailwind-entropy-low-sample.md` exists; sample is 30 entries with classifications + a summary `fixable ratio` line at the bottom.
- The MEDIUM findings classified as "fixable in this task" are actually fixed (the entropy report's MEDIUM count drops by exactly that number after this task).
- TabButton extraction lands on either Path A (Button CVA `size="tab"`) OR Path B (AdminSegmentedTab.tsx); chosen path documented in `tailwind-canonical-fragments.md`.
- Three admin tabs (AdminListingsTable / AdminSettings / AdminUsersTable) now use the canonical TabButton; their custom `className="px-4 py-2 h-auto transition-colors rounded-lg text-sm ..."` is gone OR reduced to only the active-state classes.
- Visual parity at 320/375/390/768/1280/1440/2560 in `uk` — three tabs render byte-identical (DOM diff = layout/positioning attrs only, no visible pixel shift).
- `npm run governance:tailwind` AFTER: still `C0/H0/M0` (no regression).
- `tailwind-entropy.mjs --report` AFTER: MEDIUM count = `14 - <fixed-in-this-task>`; LOW count unchanged (we audited a sample, did not burn the bucket).
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → same Sprint-17 baseline (7/10) OR Task-295 burn-down result if 295 landed first.
- No new locale keys, no copy change, no visual redesign.
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · governance:tailwind=C0/H0/M0 · MEDIUM audit complete · LOW sample complete · TabButton extracted · 3 tabs migrated · visual parity ✅ · scope=clean · PASS`.

## Final report required

1. Files Changed table. 2. MEDIUM audit summary (fixable / legitimate / deferred counts). 3. LOW 30-sample summary (estimated fixable %). 4. TabButton path chosen + rationale. 5. Three tabs before/after className. 6. Visual parity evidence (screenshot or DOM diff narrative for 320 `uk`). 7. Confirmation no Task 283 / 295 / 294 file outside this kickoff was touched.

Do NOT emit git commands. Do NOT run git. Do NOT touch the 220 LOW beyond sample. Do NOT introduce new architecture. STOP & ASK on Path A vs Path B before committing.
