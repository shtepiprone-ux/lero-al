# Task 690 — `--overlay`/`--overlay-foreground` relocation `@theme` → `:root` + scrim swap

**Status: `BLOCKED`** — stopped at I3 per the kickoff's own explicit stop condition (A2/I3): the
before/after built-bundle `overlay` selector-set diff is **not empty**. D18's safety mechanism
(§3.3) is falsified by measurement. Sonnet does not self-approve, does not revert or hand-write a
workaround, and does not run any mutating git command; this report hands the finding to the
orchestrator for a new owner decision.

## 1. What happened, in one paragraph

D18 assumed that moving `--overlay`/`--overlay-foreground` out of `@theme inline` into `:root`
was safe because the *compiled* Tailwind utilities already dereference `var(--overlay)` at
runtime (kickoff §3.3, quoting the pre-change bundle). That is true for the **primary**
`color-mix()` rule each opacity-modifier utility emits. It is not true for the **static-fallback**
rule Tailwind v4 emits alongside it: that fallback is a build-time-computed flat colour (e.g.
`#0000004d` for `bg-overlay/30`), and Tailwind can only compute it by statically resolving the
referenced custom property's value — which it can only do by reading `@theme`. Once
`--overlay`/`--overlay-foreground` moved to `:root`, Tailwind could no longer resolve that value,
so the fallback rule for every opacity-modifier `bg-overlay*`/`text-overlay-foreground*`/
`border-overlay-foreground*` utility silently degraded from a computed translucent hex to a bare
`var(--overlay)` reference (i.e. **full opacity, no mixing**) — and two rules
(`.bg-overlay`/`.bg-overlay/30`, `.text-overlay-foreground`/`.text-overlay-foreground/40`) merged
into compound selectors because their (now-identical) fallback bodies collapsed. AC1's own binding
gate — `diff overlay-selectors-before.txt overlay-selectors-after.txt` empty — is violated. This
is exactly the stop condition I3/A2 name; I did not attempt either forbidden workaround
(re-adding the declaration to `@theme`, or hand-writing the utilities).

**Real-world severity, measured, not assumed:** the `color-mix()` rule is emitted *after* the
fallback rule in every case (verified below, raw un-sorted bundle order), so in any browser that
supports `color-mix()` — which includes the Playwright/Chromium harness this task's own Q3 proof
path would have used — the correct, opacity-mixed value still wins the cascade. The regression is
real but scoped to browsers without `color-mix()` support, which silently render these opacity
utilities at full (unmixed) opacity instead of the intended translucency. This is a genuine defect
introduced by the D18 mechanism, not a measurement artifact — confirmed on a clean rebuild
(`rm -rf .next && npm run build`, same result both times).

## 2. Files Changed

| File | Change | Reason |
|---|---|---|
| `src/app/globals.css` | Moved `--overlay`/`--overlay-foreground` declarations + updated comment from `@theme inline` (old :51-55) to `:root` (new :417-427); `--color-overlay`/`--color-overlay-foreground` stayed in `@theme inline` with an updated comment (:51-57) | R1, R8 |
| `src/modules/locations/components/PopularLocationsView.module.css` | `.scrim`'s two `color-mix(in oklab, var(--color-black) …)` refs → `var(--overlay)` | R3 |
| `.screenshots/task690-delta/*` | Task-created evidence (local-only, D6) | I2/I3 evidence |

`docs/backlog.md` and this session log are the only other touched paths (records, not scope).
**No file outside §7's scope was touched.** `LightboxView.tsx`, `MantineListingGalleryPattern.tsx`,
and every other consumer named in A3 remain absent from `git status` (confirmed below).

## 3. Start/end worktree snapshot

**I0 start**, before any write: `git status --porcelain` → **empty**. `git log -1 --oneline` →
`9e8098b17 docs(Task690): --overlay/-foreground @theme->:root relocation + scrim swap kickoff
(D18), 688 review outcome + D17, 691/692 reserved`. `git log --oneline | grep a9934c037` →
`a9934c037 feat(Task688): PopularLocationsView de-Tailwind onto Mantine props + colocated CSS
module (D17: 56-cell comparator re-scoped, max channel delta 1/255; design-tokens 44->43)` —
present, confirming Task 688 is an ancestor of `HEAD`. Both preconditions in A5 satisfied.

**Final `git status --porcelain`** (after this log and the backlog update were written):

```
 M docs/backlog.md
 M src/app/globals.css
 M src/modules/locations/components/PopularLocationsView.module.css
?? docs/sessions/2026-07-30-task690-overlay-root-relocation.md
?? .screenshots/task690-delta/
```

`.screenshots/` is local-only per D6/`.gitignore:55` and does not appear as a trackable change.

## 4. R1–R9 mapped to AC1–AC8

| Req | Status | Evidence |
|---|---|---|
| **R1** [AC1] | **MET** | Declarations moved to `:root` (line 417 > `@theme inline`'s close at line 296+); values byte-unchanged. See §5 excerpt. |
| **R2** [AC1] | **NOT MET — the task's stop condition** | `diff overlay-selectors-before.txt overlay-selectors-after.txt` is non-empty. See §6. |
| R3 [AC2] | MET | `.scrim` now reads `var(--overlay)`; `grep -rn 'color-black' src/` → 0 hits (quoted above). |
| R4 [AC3] | **NOT RUN** | I4 (computed-style AFTER capture) not attempted — blocked by R2's stop condition before reaching I4. |
| R5 [AC4] | **NOT RUN** | Same reason. |
| R6 [AC5] | **NOT RUN** | I5 (1184-cell `--mantine-only` proof) not attempted — would burn the full Storybook rebuild + screenshot-assert budget on a path already known to fail its predecessor gate. |
| R7 [AC6] | **MET, independently of the blocker** | `check:design-tokens` re-run post-edit: **43 / 0 stale**, same as baseline; module contributes 0. Quoted in §7. |
| R8 [AC7] | MET | Comment relocated and rewritten to state the unconditional-emission rationale, naming Task 690/F1 (see §5). |
| R9 [AC8] | **NOT RUN in full** | `build` (×2, including a clean `rm -rf .next` rebuild) exits 0 both times — quoted in §8 — but `typecheck`/`check:stories`/`check:story-coverage`/`check:i18n`/`vitest`/`check:file-integrity`/`check:mojibake` were only run as the I1 **baseline** (pre-edit); not re-run post-edit because the task's own I3 stop condition halts the order of operations before I6. |

## 5. `globals.css` before/after excerpt

**Before** (original `@theme inline` block, :51-55):

```css
  /* Overlay tokens — always dark/light regardless of mode (photo overlays, lightbox) */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
  --color-overlay:            var(--overlay);
  --color-overlay-foreground: var(--overlay-foreground);
```

**After** — `@theme inline`, :51-57 (namespace entries only, comment rewritten):

```css
  /* Overlay Tailwind namespace entries — keep the `overlay` colour name registered as a Tailwind
     utility (`bg-overlay*`, `text-overlay-foreground*`). The declarations themselves live in
     `:root` below (Task 690/F1): `@theme inline` emission is usage-contingent on a surviving
     Tailwind utility, which left `--overlay`/`--overlay-foreground` invisible to non-Tailwind
     consumers (`LightboxView.tsx`, `MantineListingGalleryPattern.tsx`) unless some unrelated
     `bg-overlay*`/`text-overlay-foreground*` utility happened to still be scanned. */
  --color-overlay:            var(--overlay);
  --color-overlay-foreground: var(--overlay-foreground);
```

**After** — `:root`, :417-427 (relocated declarations):

```css
  /* Overlay tokens — always dark/light regardless of mode (photo overlays, lightbox). Declared
     here, not inside `@theme inline`, so they emit unconditionally (Task 690/F1): `@theme inline`
     only emits a variable while a generated Tailwind utility still consumes it, which left these
     two invisible to non-Tailwind `var(--color-overlay*)` consumers (`LightboxView.tsx`,
     `MantineListingGalleryPattern.tsx`) whenever no `bg-overlay*`/`text-overlay-foreground*`
     utility happened to survive the scan. The `--color-overlay*` Tailwind namespace entries stay
     in `@theme inline` above, so `bg-overlay`/`text-overlay-foreground` remain valid utilities. */
  --overlay:            oklch(0 0 0);       /* Pure black — for photo/lightbox overlays */
  --overlay-foreground: oklch(1 0 0);       /* Pure white — text on black overlays */
```

## 6. Bundle `overlay` selector-set diff — the blocking evidence

`npm run build` run twice (once immediately after the edit, once after `rm -rf .next` — same
result both times, ruling out a stale-cache artifact). Command, verbatim (I3):

```
grep -ho "\.\(bg\|text\|border\)-overlay[^{]*{[^}]*}" .next/static/css/*.css | sort -u
```

`diff overlay-selectors-before.txt overlay-selectors-after.txt` → **exit 1, non-empty**:

```
1c1
< .bg-overlay\/30{background-color:#0000004d}
---
> .bg-overlay,.bg-overlay\/30{background-color:var(--overlay)}
3d2
< .bg-overlay\/50{background-color:#00000080}
5c4
< .bg-overlay\/60{background-color:#0009}
---
> .bg-overlay\/50{background-color:var(--overlay)}
7c6
< .bg-overlay\/85{background-color:#000000d9}
---
> .bg-overlay\/60{background-color:var(--overlay)}
9c8
< .bg-overlay\/95{background-color:#000000f2}
---
> .bg-overlay\/85{background-color:var(--overlay)}
11,12c10
< .bg-overlay{background-color:var(--overlay)}
< .border-overlay-foreground\/20{border-color:#fff3}
---
> .bg-overlay\/95{background-color:var(--overlay)}
14c12,13
< .text-overlay-foreground\/40{color:#fff6}
---
> .border-overlay-foreground\/20{border-color:var(--overlay-foreground)}
> .text-overlay-foreground,.text-overlay-foreground\/40{color:var(--overlay-foreground)}
16d14
< .text-overlay-foreground\/50{color:#ffffff80}
18c16
< .text-overlay-foreground\/60{color:#fff9}
---
> .text-overlay-foreground\/50{color:var(--overlay-foreground)}
20c18
< .text-overlay-foreground\/70{color:#ffffffb3}
---
> .text-overlay-foreground\/60{color:var(--overlay-foreground)}
22c20
< .text-overlay-foreground\/80{color:#fffc}
---
> .text-overlay-foreground\/70{color:var(--overlay-foreground)}
24c22
< .text-overlay-foreground{color:var(--overlay-foreground)}
---
> .text-overlay-foreground\/80{color:var(--overlay-foreground)}
```

**Raw cascade-order confirmation** (un-sorted, un-deduped, direct `grep` on the built bundle —
proves the `color-mix()` rule still wins the cascade in any browser that supports it, since it is
emitted *second* for every affected utility):

```
.border-overlay-foreground\/20{border-color:var(--overlay-foreground)}
.border-overlay-foreground\/20{border-color:color-mix(in oklab,var(--overlay-foreground) 20%,transparent)}
.bg-overlay,.bg-overlay\/30{background-color:var(--overlay)}
.bg-overlay\/30{background-color:color-mix(in oklab,var(--overlay) 30%,transparent)}
.bg-overlay\/50{background-color:var(--overlay)}
.bg-overlay\/50{background-color:color-mix(in oklab,var(--overlay) 50%,transparent)}
.bg-overlay\/60{background-color:var(--overlay)}
.bg-overlay\/60{background-color:color-mix(in oklab,var(--overlay) 60%,transparent)}
.bg-overlay\/85{background-color:var(--overlay)}
.bg-overlay\/85{background-color:color-mix(in oklab,var(--overlay) 85%,transparent)}
.bg-overlay\/95{background-color:var(--overlay)}
.bg-overlay\/95{background-color:color-mix(in oklab,var(--overlay) 95%,transparent)}
.text-overlay-foreground,.text-overlay-foreground\/40{color:var(--overlay-foreground)}
.text-overlay-foreground\/40{color:color-mix(in oklab,var(--overlay-foreground) 40%,transparent)}
.text-overlay-foreground\/50{color:var(--overlay-foreground)}
.text-overlay-foreground\/50{color:color-mix(in oklab,var(--overlay-foreground) 50%,transparent)}
.text-overlay-foreground\/60{color:var(--overlay-foreground)}
.text-overlay-foreground\/60{color:color-mix(in oklab,var(--overlay-foreground) 60%,transparent)}
.text-overlay-foreground\/70{color:var(--overlay-foreground)}
.text-overlay-foreground\/70{color:color-mix(in oklab,var(--overlay-foreground) 70%,transparent)}
.text-overlay-foreground\/80{color:var(--overlay-foreground)}
.text-overlay-foreground\/80{color:color-mix(in oklab,var(--overlay-foreground) 80%,transparent)}
```

**Diagnosis:** every opacity-modifier utility's *static-fallback* rule (first in source order)
degraded from a build-time-computed hex (e.g. `#0000004d`) to a bare `var(--overlay)` reference
(no opacity applied), because Tailwind can no longer statically resolve `--overlay`'s value once
it lives outside `@theme`. The *primary* `color-mix()` rule (second in source order, wins the
cascade in any `color-mix()`-supporting browser, which includes this project's own Playwright/
Chromium QA harness) is unaffected and still correctly resolves `var(--overlay)` with the right
percentage. `.bg-overlay` and `.bg-overlay/30`'s fallback rules also merged into one compound
selector because their (now-identical, opacity-free) fallback bodies became byte-identical.

This is **exactly** the class of failure I3/A2 name as a stop condition: "any body that stops
resolving `var(--overlay)`/`var(--overlay-foreground)` … is a stop and report." The fallback rule
bodies still *contain* `var(--overlay)`, but they no longer resolve to the *same value* they did
before (they lost the opacity mix), which is the substance A2 exists to catch. AC1's literal gate
— an empty diff — is unambiguously failed regardless of how the underlying mechanism is
characterized.

## 7. `check:design-tokens` — before/after (independently of the blocker)

**Before** (I1 baseline, untouched tree): `43 raw / 0 stale-marker` (`length` 31, `color` 11,
`z-index` 1); `PopularLocationsView.module.css` contributes 0.

**After** (post-edit, re-run at the point of stopping):

```
    color                11
    z-index              1
❌  check:design-tokens STRICT — 43 raw style-value violation(s) + 0 stale-marker(s) found.
```

**43 / 0 stale, unchanged.** `globals.css` is excluded from the scan (kickoff §3.6); the module's
swap from `var(--color-black)` to `var(--overlay)` contributes 0 either way. R7/AC6 is
independently satisfied and is not affected by the R2 blocker.

## 8. Commands actually run, with actual exit status

| Command | When | Result |
|---|---|---|
| `git status --porcelain` | I0 | empty (exit 0) |
| `git log -1 --oneline` / `git log --oneline \| grep a9934c037` | I0 | as quoted §3 |
| `npm run check:design-tokens` | I1 baseline | 43/0 stale (exit 1 — script's own convention: non-zero exit *reports* a nonzero-but-allowed count, not a regression; matches the documented baseline) |
| `npm run check:stories` | I1 baseline | 0 violations, 127 files (exit 0) |
| `npm run check:story-coverage` | I1 baseline | 15/15 (exit 0) |
| `npm run check:i18n` | I1 baseline | 2215×4, 0 leaks (exit 0) |
| `npm run build` (#1, incremental) | I2 BEFORE capture | exit 0, 40/40 pages |
| `grep … \| sort -u > overlay-selectors-before.txt` | I2 | 24 lines, matches R2's named set |
| `npm run build-storybook` | I2 | exit 0 |
| `node .screenshots/task690-delta/capture-computed-styles.mjs --mode=before` | I2 | exit 0, `computed-before.json` written — see §9 |
| source edit (`globals.css`, `PopularLocationsView.module.css`) | I3 | — |
| `npm run build` (#2, incremental) | I3 | exit 0, 40/40 pages |
| `grep … \| sort -u > overlay-selectors-after.txt` (#1) | I3 | non-empty diff vs before — **the stop condition** |
| `rm -rf .next && npm run build` (#3, clean) | I3 verification | exit 0, 40/40 pages — re-run to rule out a stale-cache artifact |
| `grep … \| sort -u > overlay-selectors-after.txt` (#2, post-clean-rebuild) | I3 verification | **identical non-empty diff** — confirms the finding is real, not cache staleness |
| `grep -rn 'color-black' src/` | sanity (R3) | 0 hits (exit 1, grep's no-match convention) |
| `npm run check:design-tokens` | sanity (R7), post-edit | 43/0 stale, unchanged |
| `git status --porcelain` | sanity | exactly the 2 expected `src/` files modified |

**Not run** (blocked before reaching them in the mandated I3→I4→…→I8 order): I4's
`computed-after.json`/`computed-diff.json`, I5's `--mantine-only` 1184-cell proof, I6's
`typecheck`/`check:stories`/`check:story-coverage`/`check:i18n`/`vitest` **re-run** (only the I1
baseline pre-edit values are evidenced), I7's **final** `build` (the two builds above prove the
edit compiles and is stable across a clean rebuild, but are not offered as the I7 completion gate,
which the kickoff places last, after every other gate passes), I8's `check:file-integrity` /
`check:mojibake`.

## 9. Computed-style capture (I2 only — no I4 counterpart)

`computed-before.json` (`.screenshots/task690-delta/computed-before.json`), captured against
`storybook-static/` built from the untouched tree, en/desktop-1024:

```json
{
  "popularLocationsScrim": { "backgroundImage": "linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%, rgba(0, 0, 0, 0) 100%)" },
  "lightbox": { "backdropFound": true, "backdrop": "oklab(0 0 0 / 0.95)", "counterFound": true, "counterColor": "oklab(1 0 0 / 0.8)" },
  "listingCardOverlayChip": { "backgroundColor": "oklab(0 0 0 / 0.6)" },
  "resolvedProperties": { "overlay": "oklch(0% 0 0)", "overlayForeground": "oklch(100% 0 0)" }
}
```

The scrim value is byte-identical to §3.7's measured target
(`linear-gradient(to top, oklab(0 0 0 / 0.6) 0%, oklab(0 0 0 / 0.2) 50%, rgba(0, 0, 0, 0) 100%)`).
No `computed-after.json` was captured — I4 was never reached.

## 10. Deviations

1. **Stopped at I3, before I4.** The kickoff's own order of operations (I0→I1→I2→I3→I4→…→I8) and
   its explicit stop condition (A2, I3: "Any selector that disappears, or any body that stops
   resolving `var(--overlay)`/`var(--overlay-foreground)`, is a **stop and report**") were
   followed literally. R2/AC1 fails; every requirement gated behind it (R4–R6, and the post-edit
   portion of R9) was not attempted rather than run against a known-failing predecessor.
2. **Did not revert the source edit.** The kickoff does not instruct a revert on this stop
   condition, and Sonnet has no git-write authority regardless. The two `src/` edits remain in the
   worktree exactly as D18 specified them, so the orchestrator can inspect the literal diff that
   produced this finding. `git status --porcelain` in §3 shows precisely this state.
3. **Ran `npm run build` three times** (one beyond the kickoff's I2/I3 minimum) to rule out a
   stale `.next` cache as the explanation before treating the finding as real. This is additive
   verification, not scope creep — it directly serves I3's "quote the diff result" requirement
   with a result that cannot be dismissed as a caching artifact.
4. **Did not attempt either forbidden workaround** named in the kickoff's own Known-risk note
   (§15) or A2 (re-adding the declaration to `@theme`, hand-writing the utilities). Both are
   explicitly out of scope regardless of this finding.

## 11. Limitations

- The severity assessment in §1/§6 (real for non-`color-mix()`-supporting browsers, latent for
  the harness's own Chromium-based Q3 proof path) is derived from reading the cascade order in the
  compiled bundle, not from a rendered pixel capture — I4/I5 were never reached, so there is no
  rendered proof either confirming or bounding this for the actual Q3 matrix.
- **7-width proof path**, **four non-enrolled overlay consumers**
  (`ListingGallery.tsx`/`ImageUpload.tsx`/`AdminUserAvatar.tsx`/`PerfDevOverlay.tsx`), and Task
  691/692/689's deferred scope are all still applicable exactly as the kickoff states in §13.1/§8
  — none of that changes based on this finding.
- `.screenshots/` evidence, including this task's `overlay-selectors-before/after.txt` and
  `computed-before.json`, is local-only per D6/`.gitignore:55` and will not appear in `git status`.
- **This finding falsifies §3.3's "decisive fact" and therefore D18's mechanism as specified.** A
  new owner decision is needed before this task (or a redesigned version of it) can proceed: e.g.
  accept the fallback-tier regression as bounded to non-`color-mix()`-supporting browsers and
  amend AC1's comparator accordingly (an explicit re-scope, not a silent pass), find a third
  mechanism that keeps both the `@theme` static-resolution property and the `:root` unconditional-
  emission property, or determine the fallback-tier browsers are out of the project's support
  matrix and the risk is acceptable. This is exactly the kind of decision Sonnet cannot make
  unilaterally (agent-contract.md cl. 2).

## Opus handoff

- **Primary question:** how should D18 be amended given §3.3's mechanism is falsified? The three
  options are sketched in §11's last bullet.
- **Evidence to inspect directly:** the raw cascade-order dump in §6 (proves `color-mix()` still
  wins in any browser that supports it) and the `diff` output immediately above it (proves AC1's
  literal gate fails regardless of that mitigation).
- **Verify independently:** re-run `rm -rf .next && npm run build` on this worktree and re-grep
  the bundle; the result should reproduce exactly.
- **Not yet known:** whether this fallback-tier regression is acceptable for lero.al's actual
  browser support matrix — that policy question is not established anywhere in the pre-read
  bundle and needs an owner ruling, not an inference.
