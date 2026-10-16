# Task 923 — review 7 (Opus), 2026-10-16: Revision 6

Platform: native Windows (`MINGW64_NT-10.0-26300`), Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, HEAD `003e6f82f`.
Built Storybook: `storybook-static/` from the executor's final `build-storybook` (`r7-83-build-storybook.txt`), sources unchanged since.

**Verdict: `NEEDS REVISION`** → kickoff §16 (Revision 7: R32, AC34–AC37). The executor's status `PARTIALLY IMPLEMENTED` is right.

## What was verified (current session)

| Check | Evidence | Result |
|---|---|---|
| Delivered files equal the executor's end hashes | `rv7-01-hashes.txt` | 69 of 69, no mismatch |
| R28–R31 in the code as written | `scripts/rendered-state-census/runner.mjs` 185–341 (`waitStable`, `dismissCheck`), 105–107 (`markSkippedActions`), 543–554 (`runWithRetry`) | holds |
| AC29 self-test | `rv7-20-verify.txt` | exit 0; 58 cases (25 PASS, 33 FAIL as stated); case lines byte-identical to `r7-83-verify.txt` |
| AC29 mutation proof | `rv7-21-mutations.txt` | 26 of 26 proved, exit 0; repository hashes of `runner.mjs` / `in-page.mjs` unchanged afterwards |
| AC32 determinism (executor's script) | `r7-84-determinism-a-b.txt` | reproduced: 13 differing rows, 9 allowed (C118), 4 not |
| AC32 structure, run b | `r7-84-ac32-checks-b.txt` | every key present, gate-level cells owned by 924 / 925, 0 `image-layer` |

## The three cells, causes found

1. **`admindashboardview--activity-error~about-visible-listings` uk 320 (run a) — a gate defect.** The run-a app row is the row of a page
   that lost its stylesheet: a 16x6 burger, the SegmentedControl's native 13x13 radios, no line clamps. Aborting the Storybook stylesheet
   `assets/iframe-*.css`, or answering it 404, reproduces the row's signature exactly: settle bound hit, `declared 1 portal root(s), found 0`,
   the same first `target-small` detail (`rv7-10-differing-cells-cause-probe.txt` lines 4–5). The signature is in exactly 1 row of run a and in
   0 rows of run b and `r6-full` (`rv7-13-unstyled-signature-count.txt`). `loadTarget` never checks a subresource, and the static server answers
   404 to **every** read error (`runner.mjs` 56–58), so the cause leaves no trace. A sweep of all 260 Stories finds no same-origin script,
   stylesheet or document failure, and 107 same-origin `fetch` 404s (`/api/*`, 85 Stories) that are deterministic
   (`rv7-12-same-origin-failure-sweep.txt`) — the new rule must not count `fetch`.
2. **`listingdetailview--archived-listing~all-photos` sq 390 — a product race, not a gate defect.** `Map.tsx` opens the popup in the
   `import('leaflet')` callback (line 35); its stylesheet is a cross-origin `<link>` to unpkg rendered by the same component (line 48). At CPU 1x
   Leaflet writes the popup width while the popup is still `position: static` in the page's 16px Open Sans: 301px, then the stylesheet applies
   and nothing re-measures (popup 38..385 in a 37..353 map). At 4x the stylesheet is there first: 248px, inside the map
   (`rv7-11-leaflet-popup-width-probe.txt`). Delaying leaflet.css 3 000ms or blocking Google Fonts keeps 347px (`rv7-10` C lines). The settled
   page does not change afterwards (`r7-65` line 6): no settle condition can see it (executor D42: no settle extension).
3. **`listingdetailview--archived-listing~share-listing` en 320 (run a) — a product race.** The state is a Mantine `Tooltip` on
   `ListingShareButton`, whose label flips back 2 000ms after the click (`ListingShareButton.tsx` 32). Escape closes the tooltip in about
   120ms; when Escape comes before the flip, the tooltip comes back on its own under the resting pointer and stays (Escape at 504, 1 505,
   1 915, 2 007ms: reopened; at 2 103 and 2 615ms: stays closed — `rv7-10` B lines). Run a's settle took 1 715ms (run b: 429ms), so its
   Escape fell next to the flip. A dismissed tooltip that reappears by itself is a product defect (owner row); the gate's verdict on the row
   follows a product timer.

## Accepted / answered

D39, D40, D41, D44, D45 accepted. D42: no settle extension (cause 2 is in the product). D43: one is a gate defect (cause 1 → R32), one a
product race (cause 3). New owner rows to file at closure: the Leaflet popup race (`Map.tsx`), the share tooltip that reappears after
Escape (`ListingShareButton`), the AdminShell drawer initial-focus race (C118), the dismissal focus-return class (992 details), the dashboard
chart overflow, the other components of `r7-86-owner-summary.txt`. The CI scope of the full run (8 028–9 604 s) stays a §9 closure decision.

## Probes (diagnosis only; no repository file other than evidence was written)

`rv7-10-differing-cells-cause-probe.mjs`, `rv7-11-leaflet-popup-width-probe.mjs`, `rv7-12-same-origin-failure-sweep.mjs`; each transcript
ends with `EXIT_CODE=0`.
