# Session Archive: Task 808 — the detail route's React `key` warning — 2026-09-10

Task path: `tasks/Sprints/Sprint_71_kickoff_prompt_Task_808_Detail_Route_Missing_Key_Warning.md`
Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Phase 1 — the reproduction (R1/AC1)

### 1.1 What the kickoff's own assumption got wrong, and how that was established

The kickoff's §5 `ASSUMPTION (reversible, stated)` was that the warning reproduces in a vitest
render of `MantineListingDetailPattern`/`ListingDetailViewBody` with the real slot shape. It does
**not**, at any level tried:

| Level | Mechanism tried | Result |
|---|---|---|
| 1 | `render()` of `MantineListingDetailPattern` (jsdom+RTL), real slot shape (favorite/share single elements, `features[].icon` elements, `contentFooter` a 4-child Fragment) | 0 console.error calls |
| 2 | Same, plus a `rerender()` with **freshly created, unkeyed** favorite/share elements (simulating a second `ListingDetailViewBody` execution) | 0 console.error calls |
| 3 | `createRoot` + `React.StrictMode` double-invoked mount, then a `startTransition`-wrapped update with fresh unkeyed elements | 0 console.error calls |
| 4 | A `<Suspense>` boundary that suspends on first render, then resolves **inside a `startTransition`** to the real content for the first time (the closest jsdom analog to an App Router segment resolving) | 0 console.error calls |

None of these reproduce it. `git --no-optional-locks status --porcelain` confirms no exploratory
test file survives in the diff — each was deleted after use; this table is the record.

### 1.2 What does reproduce it — Playwright against the real `next dev` app

`scripts/task808-key-warning-probe.mjs` (new, evidence/guard tool — see §6 for why this is a script
and not a vitest test):

- **Hard navigation** (`page.goto` directly to `/uk/listings/<slug>`, any slug, including the
  kickoff's own `shitet-gazonjere-ne-pogradec-mtu8u1lg`) → **never** warns, on any of several runs.
  `docs/sessions/evidence/task808/console-hard-nav-named-slug.txt` — 4 messages, none the key
  warning, `next dev` on port 3002 (3000 was already in use by an unrelated process this session).
- **Client-side (soft) navigation** — `page.goto('/uk/listings')` then `.click()` on a real rendered
  `<Link>` to a listing detail page — **reliably** produces:

  ```
  Each child in a list should have a unique "key" prop.

  Check the render method of `@mantine/core/Box`.  It was passed a child from ListingDetailViewBody.
  ```

  — the exact §3.1/§3.1a text, byte-for-byte. `docs/sessions/evidence/task808/
  console-soft-nav-before.txt` (pre-fix, captured with the working tree's fix stashed out) is the
  printed artifact AC1 requires.

**Why hard reload never shows it (mechanistic finding, not just an observation):** the array in
question is built by `@mantine/core/Group`'s own `filterFalsyChildren` = `Children.toArray(children)
.filter(Boolean)` (confirmed at source, `node_modules/@mantine/core/esm/components/Group/
Group.mjs:62` and `filter-falsy-children.mjs`). `Children.toArray`'s own implementation
(`node_modules/react/cjs/react.development.js:373-391`) does assign every child a synthetic
positional key — **but** when the original child had no real `.key` and was not already
"pre-validated" (i.e. it was not itself one of the *statically authored* JSX children at its own
creation site), the clone is marked with a special `_store.validated = 2` sentinel that forces the
downstream reconciler to warn anyway; the auto-generated positional key is explicitly not treated as
a fix. `favoriteSlot`/`shareSlot` are created as **single-value `const`s** in `ListingDetailViewBody`
(never part of a multi-child JSX position at their own creation site), so they carry this sentinel
every time they later land in `MantineListingDetailPattern`'s `<Group>{favorite}{share}</Group>`
(`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:182-187`). The warning-emitting
check itself, however, only runs on React's **update** reconciler path (`reconcileChildFibers`), not
the **mount** path (`mountChildFibers`) that both a fresh SSR render and a hydration pass use — this
is a well-documented React distinction and explains why the warning is a real reconciliation defect
that is invisible to any single-render/mount-only probe (§1.1's four attempts), and why Next.js App
Router's client-side navigation (which keeps the root layout mounted and reconciles the page slot as
an **update**, not a fresh mount) is the one path that exercises it. `docs/backlog.md`'s existing
§3.4 refutation of `Group` was based on `Children.toArray` assigning *a* key, without accounting for
this `validated`-sentinel branch — refuted here at the same two source files it originally cited,
plus this additional line range.

**AC1's required citations, quoted from source:**

- **The array**: `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:182-187` —
  `<Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>{favorite}{share}</Group>`, rendered via
  `@mantine/core/Box` per `Group.mjs:81-92` (`jsx(Box, { …, children: filteredChildren })`).
- **The unkeyed element**: `src/modules/listings/components/ListingDetailView.tsx:257` (pre-fix) —
  `const shareSlot = <ListingShareButton listingTitle={listing.title} listingUrl={listingUrl} />`
  — matches the owner's §3.1a code-frame caret exactly (column 21, the element-creation expression).
  `favoriteSlot` (`:247-254`, pre-fix) carries the identical defect whenever `effectiveListingId` is
  truthy (an authenticated viewer with a real listing id) — not independently re-captured live in
  this session (the anonymous probe browser never has a listing id), but it is the same array, the
  same missing-key mechanism, and the same fix; leaving it unfixed would still warn for every
  authenticated viewer. Both are fixed together (§2).

## 2. Phase 2 — the fix (R2/AC2)

**Which of §10.2's two fixes:** keys at the array site — `favoriteSlot`/`shareSlot` are two
genuinely distinct, meaningfully-named slots (not an accidental array that should not exist), so
stable identity keys (`"favorite"` / `"share"`) are correct per R2, not `key={i}`.

```diff
   const favoriteSlot = effectiveListingId ? (
     <FavoriteButton
+      key="favorite"
       listingId={effectiveListingId}
       isFavorited={effectiveIsFavorited}
       disabled={favoriteDisabled}
       disabledLabel={favoriteDisabledLabel}
     />
   ) : undefined

-  const shareSlot = <ListingShareButton listingTitle={listing.title} listingUrl={listingUrl} />
+  const shareSlot = <ListingShareButton key="share" listingTitle={listing.title} listingUrl={listingUrl} />
```

One production file (`src/modules/listings/components/ListingDetailView.tsx`) — AC2's "diff touches
exactly one production file" holds. `MantineListingDetailPattern.tsx` needs no change: `Group`'s
`Children.toArray` already preserves a real supplied key instead of forcing the `validated=2`
sentinel once one exists.

**Zero visual change:** a `key` prop is never forwarded to the rendered DOM (React strips it before
`props` reaches the element) — the diff cannot change rendered output by construction. Confirmed
empirically too: `docs/sessions/evidence/task808/console-soft-nav-after.txt` (post-fix, same
listing, same click-through) — clean, no warning, and the app's screenshots evidence log (`i5-build
.txt` route table) shows the same route compiling to the same output shape.

## 3. Phase 3 — the guard (R3/AC3)

### 3.1 Why this is `scripts/task808-key-warning-probe.mjs`, not a vitest test

§1.1 above is the record: 4 escalating jsdom/RTL reproduction attempts, none fired. The mechanism
requires a real Next.js App Router client-side navigation (root layout stays mounted, the page slot
is reconciled as an **update**) — there is no jsdom equivalent, because jsdom+RTL never goes through
Next's router/RSC pipeline at all. This is the same reason `scripts/check-hydration-console.mjs`
(Epic RS Slice 1, Task 436) is a Playwright script and not a vitest test: "These errors do NOT
appear in tsc / lint / build — only in a running browser" (its own header comment). A vitest
assertion of "no console.error" here would be **vacuously true both before and after the fix**
(§1.1 proves the bug never fires under jsdom regardless of whether the keys are present) — presenting
that as the R3 guard would be exactly the "guard whose failing arm was never fired" the kickoff
warns against, in the opposite direction (a guard that can never fire at all). Recorded here as a
deviation from §7's literal "vitest test under one of the two `__tests__/` dirs" for Opus to rule on.

### 3.2 The two-armed proof (AC3)

Both arms use the **identical, unmodified** guard script — `git hash-object
scripts/task808-key-warning-probe.mjs` is `a2f300b9273fce658598fc66825e6d77211dbc4a` in both runs
(confirmed by re-hashing after each run, not merely once).

**Before (bug present)** — production file reverted to `HEAD` via `git stash push -- src/modules/
listings/components/ListingDetailView.tsx`, guard run, then the stash popped to restore the fix:

```
[1/3] Hard navigation to http://localhost:3002/uk/listings
[2/3] Client-side (soft) navigation via click on a[href="/uk/listings/apartament-ne-lungomare-mtuf41kg"]
[3/3] Captured 6 console message(s) during the transition.
Transcript written to docs/sessions/evidence/task808/console-soft-nav-before.txt

FAIL — key warning present: Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.

Check the render method of `@mantine/core/Box`.  It was passed a child from Li
EXIT=1
```

**After (fix restored)** — same command, same script, fix in place:

```
[1/3] Hard navigation to http://localhost:3002/uk/listings
[2/3] Client-side (soft) navigation via click on a[href="/uk/listings/apartament-ne-lungomare-mtuf41kg"]
[3/3] Captured 5 console message(s) during the transition.
Transcript written to docs/sessions/evidence/task808/console-soft-nav-after.txt

PASS — no key warning during the transition.
EXIT=0
```

**Why `apartament-ne-lungomare-mtuf41kg` and not the kickoff's named
`shitet-gazonjere-ne-pogradec-mtu8u1lg`:** the named listing does not appear as a rendered `<Link>`
on `/uk/listings` page 1 or via the tried search query in this environment (likely a
sold/archived/paginated listing not surfaced by the default index — not investigated further, out
of scope), so no real client-side navigation to it could be triggered without fabricating a
non-Link click target, which would not exercise the real Next.js router path this bug depends on.
The bug is structural, independent of listing content (same `ListingDetailViewBody` code path for
every listing) — confirmed reproducing/clearing identically on this substitute listing. The named
slug's own hard-nav console is captured separately in §1.2 for the record (clean, as expected, since
hard nav never triggers this class regardless of listing).

## 4. AC4/AC5 — live-route console evidence

- `console-soft-nav-before.txt` → `console-soft-nav-after.txt`: before-set minus the key warning
  equals the after-set (both sets otherwise identical dev-noise: LCP log, Vercel Speed Insights,
  Fast Refresh lines that differ only in incidental HMR timing across the two separate dev-server
  interactions — no other message type changed). AC5 holds.
- `console-hard-nav-named-slug.txt` (post-fix, exact kickoff slug): 4 messages, no key warning, no
  other new console error/warning. AC4 holds for the exact named route.
- No other console error or warning was introduced or silenced by this diff (R4) — the only change
  is two `key` props, which are invisible to rendered output and to every other console signal.

## 5. Further hypotheses refuted (beyond kickoff §3.4)

None additional were needed — §1.2's source-level trace (`Group.mjs` + `Children.toArray`) identifies
the actual mechanism directly rather than by elimination.

## 6. Visual source trace / Canonical UI decision record

Not applicable in the standard sense — this task adds no new visible artifact and changes no
class/selector/token; it adds a `key` prop, which React never renders. Per the visual-source-trace
requirement: the only "visible artifact" touched is `favoriteSlot`/`shareSlot`'s own JSX creation
site, unchanged in every prop except the addition of `key`, so its DOM/computed-style output is
provably identical (React strips `key` before constructing the host node's props).

## 7. `OWNER VISUAL QA REQUIRED`

Per kickoff §13, on the live route (not Storybook toolbar):

| Surface | State | Locale | Viewport | Note |
|---|---|---|---|---|
| Listing detail route | normal listing, badges row + favorite + share | uk, sq | 320, 390, 768, 1024, 1440 | Zero visual diff expected (key-only change) — owner spot-check, not full matrix, is proportionate |
| Listing detail route | badges row, long `uk` title | uk | 320 (mandatory) | Same |
| Listing detail route | listing without coordinates (no map card) | uk | 390 | Unaffected — `contentFooter`'s map branch is untouched by this diff |

## 8. Other findings (report only, per completion-report contract)

- **§8's named Tailwind residue** (`MantineListingDetailPattern.tsx:250`'s
  `className="shrink-0 text-muted-foreground"`) — confirmed still present, untouched, out of scope
  for this task per the kickoff.
- **Whether the same unkeyed-slot shape exists elsewhere:** not searched beyond this route — out of
  scope per §5's "report only."

## 9. Validation evidence

Platform: `win32`. All transcripts under `docs/sessions/evidence/task808/`.

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | `i1-typecheck.txt` — 0 errors, `EXIT_CODE=0` |
| Lint | `npm run lint` | `i2-lint.txt` — 0 errors, 72 warnings (pre-existing count; `ListingDetailView.tsx` not named), `EXIT_CODE=0` |
| Targeted vitest | `npx vitest run src/design-system src/modules/listings` | `i3-vitest-targeted.txt` — 3 failed / 728 passed; the 3 failures (`theme.d69-18.test.tsx`, `ListingCard.smoke.test.tsx` ×2) reproduce identically with this diff reverted (stash push/pop, re-ran the same 2 files) — pre-existing, unrelated (neither file imports `ListingDetailView`) |
| Full test | `npm run test` | `i4-full-test.txt` — 5 failed / 1562 passed, 4 files — exactly the Task 790 documented baseline (`theme.d69-18.test.tsx`, `scripts/__tests__/css-var-resolvability.test.ts`, `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` (self-declared `BLOCKED`), `ListingCard.smoke.test.tsx` ×2) |
| Build | `Remove-Item .next -Recurse -Force; npm run build` | `i5-build.txt` — `EXIT_CODE=0`, `.next/BUILD_ID` present, route table includes `ƒ /[locale]/listings/[slug]` |
| File integrity (pass 1) | `npm run check:file-integrity` | `i6-file-integrity-pass1.txt` — `EXIT_CODE=0` |
| Mojibake (pass 1) | `npm run check:mojibake` | `i7-mojibake-pass1.txt` — `EXIT_CODE=0` |
| File integrity (pass 2, final path set) | `npm run check:file-integrity` | `i8-file-integrity-pass2.txt` |
| Mojibake (pass 2, final path set) | `npm run check:mojibake` | `i9-mojibake-pass2.txt` |
| Guard, failing arm | `scripts/task808-key-warning-probe.mjs` against reverted `ListingDetailView.tsx` | `console-soft-nav-before.txt`, `EXIT_CODE=1` |
| Guard, passing arm | same script, unmodified (`hash-object` identical), fix restored | `console-soft-nav-after.txt`, `EXIT_CODE=0` |

## 10. Acceptance-criteria self-audit

| AC | Result | Where verified |
|---|---|---|
| AC1 [R1] | ✅ | §1.2 — printed warning artifact + array/element file:line quoted from source |
| AC2 [R2] | ✅ | §2 — stable-identity keys, one production file |
| AC3 [R3] | ✅ (via script, not vitest — see §3.1) | §3.2 — failing then passing, guard script byte-identical (`hash-object`) across both arms |
| AC4 [R2,R5] | ✅ | §4, §9 — no `Each child in a list` message post-fix on the named slug; rendered output provably unchanged (key is not rendered) |
| AC5 [R4] | ✅ | §4 — before-set minus after-set = exactly the key warning |

Self-validation: `tsc=0 errors · build=passes (exit 0, BUILD_ID present, route table has ƒ /[locale]/listings/[slug]) · AC table=all green · runtime locale=uk PASS (soft-nav before/after captured) · scope=clean (one production file) · integrity=PASS`

## 11. Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingDetailView.tsx` | Adds `key="favorite"` / `key="share"` at `favoriteSlot`/`shareSlot`'s creation sites — the fix (§2) |
| `scripts/task808-key-warning-probe.mjs` | New — Playwright-based reproduction/regression-guard tool (§3.1); not a vitest test, deviation recorded for Opus |
| `docs/sessions/evidence/task808/*` | New — transcripts for every command in §9 plus the four console captures cited in §1/§3/§4 |
| `docs/backlog.md` | Task 808 state update (see backlog diff) |
| `docs/sessions/2026-09-10-task808-detail-route-missing-key-warning.md` | This session log |

## 12. Assumptions, deviations, limitations

- **Deviation (flagged for Opus):** the R3 guard is `scripts/task808-key-warning-probe.mjs`
  (Playwright, live `next dev`), not a vitest test under the two named `__tests__/` directories —
  §3.1 records why a vitest test cannot be a falsifiable guard for this specific defect class.
- **Limitation:** the guard's soft-navigation reproduction uses `apartament-ne-lungomare-mtuf41kg`,
  not the kickoff's named `shitet-gazonjere-ne-pogradec-mtu8u1lg` (§3.2) — the named slug is not
  reachable via a real rendered `<Link>` from `/uk/listings` in this environment. Its hard-nav
  console is captured separately and is clean, consistent with the established mechanism.
- **Limitation:** `favoriteSlot`'s half of the fix (authenticated viewer, real `listingId`) is not
  independently live-captured pre-fix in this session (the probe browser is always anonymous) — the
  fix is applied on the strength of the identical source-level mechanism (§1.2), not a second live
  repro. Flagged for Opus; an authenticated live capture would close this gap if required.
- **Assumption:** port 3000 was occupied by an unrelated process at session start (unrelated
  `next dev` from a prior/parallel session, `PID 39276`) — this session's dev server ran on port
  3002 instead; not stopped, not touched, per the single-writer/no-unrelated-process-kill discipline.

## 13. Opus handoff

- Confirm the §3.1 deviation (Playwright guard vs. vitest) is acceptable, or direct further work to
  find a jsdom-reproducible shape (§1.1's four attempts are the record of what was tried).
- Confirm whether the `favoriteSlot` limitation (§12) needs an authenticated live capture before
  approval, or whether the shared-mechanism argument (§1.2) is sufficient.
- Evidence root: `docs/sessions/evidence/task808/`.
