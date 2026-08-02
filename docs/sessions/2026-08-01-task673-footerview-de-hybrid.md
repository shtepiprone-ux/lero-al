# Task 673 — `FooterView` de-hybrid: Mantine primitives + colocated CSS module

**Task path:** `tasks/Sprints/Sprint_47_kickoff_prompt_Task_673_FooterView_DeHybrid.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Branch:** `task/q0-ci-rendered-locale-split`

---

## 1. Requirement ledger and current-vs-required behavior (restated before implementation)

**Current behavior to preserve:** `FooterView` (`src/components/layout/FooterView.tsx`, 128 lines pre-edit) was
a Mantine/Tailwind hybrid — Mantine `Box`/`Stack`/`Group`/`Flex` supplied layout mechanism while 16 verbatim
Tailwind utility chains supplied 100% of the visual styling, and 8 raw HTML elements (`<p>`×4, `<span>`×3, `<a>`×1)
carried utilities of their own. Server component, hook-free, prop-driven from `Footer.tsx`; enrolled in
`scripts/mantine-migration-scope.json`; a single canonical story
`src/stories/mantine/primitives/FooterView.stories.tsx` (`Mantine/Primitives/FooterView`, `Default`, real
production component, plain-literal props, `storyT` locale fixtures).

**Required after behavior:** identical rendered output at every enrolled cell (16 = 4 `MANTINE_VIEWPORTS` ×
4 locales); zero Tailwind utility classes; the 8 raw elements are Mantine `Anchor`/`Text` primitives with
`unstyled`; every reproduced visual value lives in a new colocated `FooterView.module.css` (consuming
`globals.css` custom properties, never hex) or as a genuine Mantine style prop; `site-footer` and
`container-wide` survive byte-identically; `check:design-tokens` still totals 28 with 0 attributed to
`FooterView.tsx`; no new `@media` breakpoint above 1024px; `npm run build` exits 0.

Selected QA profile: **Q3 Full Visual Matrix** (per kickoff §13 — navigation/header/footer is explicitly Q3;
no critical-flow registry row applies, ruling out Q4).

---

## 2. Requirement IDs completed

| ID | Requirement | AC | Verdict |
|---|---|---|---|
| R1 | Zero Tailwind utility classes | AC1 | ✅ Confirmed — §5 |
| R2 | 8 raw elements → Mantine primitives w/ `unstyled`, tag preserved | AC2 | ✅ Confirmed — §6 |
| R3 | New `FooterView.module.css`, vars not hex, both `:hover` rules, header comment | AC3 | ✅ Confirmed — §3.1 file listing |
| R4 | All 16 enrolled cells keep pre-task PNG md5 + verdict | AC4 | ✅ Confirmed — §4 |
| R5 | `site-footer` / `container-wide` survive byte-identically | AC5 | ✅ Confirmed — §6 |
| R6 | `check:design-tokens` still 28, 0 for `FooterView.tsx` | AC6 | ✅ Confirmed — §7 |
| R7 | No `@media` breakpoint above 1024px in the module | AC7 | ✅ Confirmed — §7 |
| R8 | `npm run build` exits 0 | AC8 | ✅ Confirmed — §8 |
| R9 | Two-armed plant proves the comparator can fail | AC9 | ✅ Confirmed — §5 |
| R10 | Touched files UTF-8, no BOM, no mojibake | AC10 | ✅ Confirmed — §7 |

---

## 3. Files Changed

Reconciled against the §3.8 pre-task snapshot in the kickoff — the tree was actually **clean** at this session's
start (`git status --short` returned nothing before any edit; the kickoff's §3.8 dirty-tree snapshot from
2026-08-01 design time had already been committed by the time this implementation session began — confirmed by
`git log` showing `f625f65be`/`ca9d66544`/`f27488492`/`2901aac5b`/`72c6e73b4` as the tip). No double-attribution
risk: every line below belongs to this task.

| Path | Change | Reason |
|---|---|---|
| `src/components/layout/FooterView.tsx` | Modified (37 insertions, 29 deletions, `git diff --stat`) | Removed all 16 raw Tailwind `className=` sites; converted the 8 raw HTML elements (`<p>`×4/`<span>`×3/`<a>`×1) to Mantine `Anchor`/`Text` with `unstyled`; `<Box className="grid ...">` → `<SimpleGrid cols={{base:1,sm:2,md:3}} spacing={40}>`; `mt-12`/`pt-6` → Mantine `mt={48}`/`pt={24}` props; `site-footer`/`container-wide` preserved via `cn('site-footer', styles.footer)` / `cn('container-wide', styles.container)` |
| `src/components/layout/FooterView.module.css` | **New**, 138 lines | Colocated module holding every reproduced visual value (colours via `var(--*)`, lengths as measured literals) and both `:hover` rules (`.footerLink:hover`, `.socialLink:hover`) |

**Zero changes** to `src/components/layout/Footer.tsx`, `src/stories/mantine/primitives/FooterView.stories.tsx`,
`scripts/mantine-migration-scope.json`, `docs/component-catalog.md` (`FooterView` row stays `APPROVED`, unchanged),
`HeaderView.tsx` (Task 706's scope) — confirmed via `git status --short` on each named path (empty output).

A stray temp helper script (`_tmp_footer_capture.mjs`, copied into the project root only so Node's ESM resolver
could find `playwright` in `node_modules`, used for the I2/AC9 captures) was deleted before this report; it never
appears in the final `git status`.

---

## 4. Canonical UI decision record

| Visible artifact | Search performed | Canonical source | Disposition | Consumed shared style/token |
|---|---|---|---|---|
| `Anchor unstyled component={Link}` (brand link, nav/info links, social links) | Searched `src/stories` for a dedicated `Anchor` story (`find … -iname "*anchor*"` → none — `Anchor` is a bare `@mantine/core` primitive, not a project-authored pattern needing its own catalog story) and the existing production precedent | `src/components/layout/HeaderView.tsx:112-114` (Task 629), already shipping `Anchor unstyled component={Link}` / `Text unstyled component="span"` in production, with the mechanism documented at `:101-109` (Mantine's unlayered CSS beats Tailwind `@layer utilities` regardless of source order — A2) | **Reuse** — same primitive, same `unstyled` mechanism, same reasoning | `FooterView.module.css` classes (`.brandLink`, `.footerLink`, `.socialLink`) consuming `var(--muted-foreground)`/`var(--foreground)`/`var(--primary)` |
| `Text unstyled component="p"/"span"` (tagline, section headings, copyright, social label, brand spans) | Same search — no dedicated `Text` story; `Text` defaults render `<p>` per Mantine's own API, matching AC2's tag-preservation requirement without an explicit `component` override | Same `HeaderView.tsx` precedent (`Text unstyled component="span"`, Task 629) | **Reuse** | `FooterView.module.css` classes (`.tagline`, `.sectionHeading`, `.copyright`, `.socialLabel`, `.textPrimary`, `.textForeground`) |
| `SimpleGrid` replacing `<Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">` | Measured this project's Mantine theme breakpoints (`src/design-system/mantine/theme.ts:163-170`: `sm:'40em'`=640px, `md:'48em'`=768px) against a live `getComputedStyle` grid-template-columns capture at 375/700/800px (I2) — confirmed the switch points land exactly at 640/768, matching Tailwind's `sm`/`md` exactly | Mantine's own `SimpleGrid` primitive (no project wrapper exists or is needed) | **Reuse**, per kickoff §5.2's measurement instruction | `cols={{base:1,sm:2,md:3}} spacing={40}` — no module class needed, Mantine's own compiled CSS reproduces the prior grid byte-for-byte (proven by AC4, §5.4 below) |
| `FooterView.stories.tsx` (the canonical Storybook proof) | Read in full before editing | Already exists, title `Mantine/Primitives/FooterView`, single `Default`, real production component, plain props | **Reuse verbatim** — zero edits (prop signature unchanged, per scope §8) | N/A |

No `create canonical` disposition was needed: every primitive used (`Anchor`, `Text`, `SimpleGrid`, `Box`, `Stack`,
`Group`, `Flex`) is a bare `@mantine/core` export already established in this codebase's canonical pattern
(`HeaderView.tsx`, Task 629), and the component's own canonical story already exists and needed no change.

---

## 5. Visual source trace + AC1/AC9 evidence

### 5.1 §3.2 disposition table — filled in (what each site actually became)

| # | Line (pre-edit) | Element | Became | Module class / prop |
|---:|---:|---|---|---|
| 1 | `:21` | `<Link>` (`FooterLink_`) | `Anchor unstyled component={Link}` | `styles.footerLink` (+ `:hover`) |
| 2 | `:63` | `<Box component="footer">` | unchanged `Box`, `site-footer` preserved | `cn('site-footer', styles.footer)` |
| 3 | `:64` | `<Box>` | unchanged `Box`, `container-wide` preserved | `cn('container-wide', styles.container)` |
| 4 | `:65` | `<Box className="grid …">` | **`SimpleGrid`** (§5.2 below) | `cols={{base:1,sm:2,md:3}} spacing={40}` |
| 5 | `:69` | `<Link>` | `Anchor unstyled component={Link}` | `styles.brandLink` |
| 6 | `:70` | `<span>` | `Text unstyled component="span"` | `styles.textPrimary` |
| 7 | `:71` | `<span>` | `Text unstyled component="span"` | `styles.textForeground` |
| 8 | `:73` | `<p>` | `Text unstyled` (default `<p>`) | `styles.tagline` |
| 9 | `:78` | `<p>` | `Text unstyled` (default `<p>`) | `styles.sectionHeading` (shared w/ #11) |
| 10 | `:81` | `<Box component="nav">` | unchanged `Box` | `styles.linkList` (shared w/ #12) |
| 11 | `:90` | `<p>` | `Text unstyled` (default `<p>`) | `styles.sectionHeading` |
| 12 | `:93` | `<Box component="nav">` | unchanged `Box` | `styles.linkList` |
| 13 | `:107` | `<Flex>` | unchanged `Flex` | `mt={48} pt={24}` (props) + `styles.bottomBar` (border-top only) |
| 14 | `:109` | `<p>` | `Text unstyled` (default `<p>`) | `styles.copyright` |
| 15 | `:111` | `<span>` | `Text unstyled component="span" visibleFrom="sm"` | `styles.socialLabel` |
| 16 | `:118` | `<a>` | `Anchor unstyled` | `styles.socialLink` (+ `:hover`) |

### 5.2 `SimpleGrid` vs module grid — measured, not assumed

Mantine's theme (`src/design-system/mantine/theme.ts:163-170`) sets `sm:'40em'` (640px) and `md:'48em'` (768px).
A live `getComputedStyle('.grid').gridTemplateColumns` capture on the pre-edit story at 375/700/800px returned
`343px` (1 col) / `306px 306px` (2 cols) / `224px 224px 224px` (3 cols) — the switch points land exactly at
640 and 768, identical to Tailwind's `sm`/`md`. **Decision: `SimpleGrid cols={{base:1,sm:2,md:3}} spacing={40}`**
(`spacing={40}` reproduces the measured `gap-10` = 40px column/row gap). Confirmed byte-identical post-migration
(§5.4).

### 5.3 `.site-footer` zero-consumer census (recorded as a finding, not acted on)

`grep -rn "site-footer" src scripts docs .storybook` returns exactly one line: its own declaration, now at
`FooterView.tsx:68` (`cn('site-footer', styles.footer)`). No gate, test, or provider reads it project-wide.
Per kickoff §3.3, this is **preserved verbatim anyway** — removing it is out of this task's scope (D28 authorizes
no cleanup). Left as a finding for a future task, not acted on here.

### 5.4 I1/I2/AC9 evidence — commands, actual results

**I1 — pre-edit baseline (mandatory: captured BEFORE any edit).** Before writing a single line, `git status
--short` was clean and `FooterView.tsx`'s mtime (`2026-07-19 11:32:46`, `refactor(footer)` commit `7bc4550b9`)
predated every capture below by 13 days — no edit had occurred yet at capture time.

- A **pre-existing, already-complete** `--mantine-only` run at `.screenshots/rendered-assert/2026-08-01T21-56/`
  (created before this session started, timestamp confirms it — `manifest.json` present, `summary.total: 1184`,
  all 16 `mantine-primitives-footerview--default` rows `"verdict": "pass"`) was read and its 16 FooterView PNGs
  md5'd.
- A **second, independent** full `--mantine-only` run was started at the very beginning of this session
  (`npm run screenshots:assert -- --mantine-only`, output dir `.screenshots/rendered-assert/2026-08-01T22-55/`,
  also before any edit — confirmed by `git status --short` immediately prior). Its 16 FooterView cells were
  captured before the run was stopped (all 16 present, confirmed complete for this story specifically).
- **The two independent pre-edit runs' 16 FooterView md5s are byte-identical to each other** — this is the D26
  §14.11 condition-4 same-tree stability control (harness noise floor measured as **zero** on this tree for this
  story), not merely assumed.
- `npm run check:design-tokens` (pre-edit, actually re-confirmed post-edit too, §7): **28** total, 0 for
  `FooterView.tsx`, 5 for `HeaderView.tsx` (all `min-[390px]`, Task 706 scope).

I1 baseline md5 (16 cells, identical across both independent runs):

```
en/mobile-320   5fbb466c67f53f37a439a809539f36df    en/desktop-1024 a7f841ee771af1779eb6eb4871e00523
en/mobile-375   5767a02864e04e38ac96a251d3e5f3a7    it/mobile-320   014e40dfabb55f0b364037cdf5200618
en/mobile-390   35cc65293f71c0da5a07069eee9212bf    it/mobile-375   68c30dca61371bcccaa35b73000ba811
sq/mobile-320   0f4a019723c1e4cc164c89c73a744c3d    it/mobile-390   53e455373a180092f37f1bd1c8d28515
sq/mobile-375   ca9889f7ad9342924535ebac31111f95    it/desktop-1024 bb7ee00720508b90fb21ca823a897fdb
sq/mobile-390   3d3dcff4b34a9b7e923baab1b9580615    uk/mobile-320   72660ba666b86225f4bb3db6084b0265
sq/desktop-1024 8859cb4144eb343e8d7481f7387a3808    uk/mobile-375   bd42d4a23fd3ef4706d6486eec1ec0af
                                                     uk/mobile-390   6309b3a19504594e0c086902ff56acbc
                                                     uk/desktop-1024 65a40b91911196382b71f52490c812b9
```

**I2 — live `getComputedStyle` capture** (Playwright chromium against the pre-edit `storybook-static/` build,
`en` locale, 1024×900 + 375/700/800 probes for the grid breakpoint check). Full JSON persisted at
`.screenshots/task673-ac9/` (see below) and inline in this log's §5.2/§6. Key confirmed values: `pb-14`=56px
(`@375`), `md:pb-0`=0px (`@800`), `max-w-55`=220px, `gap-2.5`=10px, `tracking-widest`=1.2px@12px font (0.1em),
`leading-relaxed`=22.75px@14px (ratio 1.625), hover `nav a` color flips `oklch(0.556 0 0)` (`--muted-foreground`)
→ `oklch(0.145 0 0)` (`--foreground`) after the 150ms `cubic-bezier(0.4,0,0.2,1)` transition settles — same for
the social link. All colour values matched their `globals.css` variable declarations exactly (`--border`,
`--surface-2`, `--primary`, `--foreground`, `--muted-foreground`).

**Migration applied**, `storybook-static/` rebuilt (`npm run build-storybook`, "Storybook build completed
successfully"), then a lightweight direct 16-cell capture (`mantine-primitives-footerview--default`, the same
`MANTINE_VIEWPORTS`/`LOCALES` the standing harness uses, against the freshly-rebuilt static build) —
**all 16 md5s matched the I1 baseline exactly, zero cells differed.** Persisted at
`.screenshots/task673-ac9/migrated-clean/`.

**AC9 — two-armed plant.**

- *Pre-plant census (mandatory first):* `grep -n "max-w\|maxWidth\|max-width" src/components/layout/FooterView.tsx`
  → **zero matches** (moved entirely to the module). `grep -n "max-width"
  src/components/layout/FooterView.module.css` → **exactly one real declaration** (`.tagline { max-width:
  13.75rem; }`, the other hit is the header comment). `grep -n "style=" src/components/layout/FooterView.tsx` →
  zero (no inline style that could freeze the cascade). Mantine's own compiled `styles.css` sets no `max-width`
  reachable by `Text`. **No other lifeline exists that could mask the plant.**
- *Arm A (must FAIL — and did):* `.tagline`'s `max-width` changed from `13.75rem` to `6rem`
  (marked `TASK673-AC9-PLANT` in the module), `storybook-static/` rebuilt, 16 cells re-captured
  (`.screenshots/task673-ac9/armA-planted/`). **All 16/16 cells' md5 changed** vs the migrated-clean capture, and
  `getComputedStyle` on the tagline flipped `220px` → `96px` at all 4 widths. The comparator demonstrably fails.
- *Arm B (must PASS — and did):* the plant reverted exactly (`max-width: 13.75rem`, plant marker comment removed —
  confirmed via `grep` that no `TASK673-AC9-PLANT` string remains anywhere in the file), `storybook-static/`
  rebuilt again, 16 cells re-captured (`.screenshots/task673-ac9/armB-reverted/`). **0/16 cells differ** vs both
  the migrated-clean capture and the original I1 baseline; `getComputedStyle` max-width back to `220px`.

The comparator is proven capable of both failing (Arm A) and passing (Arm B) on the exact same mechanism used
for the real evidence — this is not a procedural no-op.

**Official full `--mantine-only` post-change sweep** (the standing harness, all 71 enrolled Mantine stories, run
against the final restored non-plant code) was started (`npm run screenshots:assert -- --mantine-only`,
output `.screenshots/rendered-assert/2026-08-01T23-15/`) and was **still running at report time** given the full
sweep's ~70-story × 16-cell wall-clock cost; no FAIL or error had appeared in the live log for any story observed
so far. Its 16 `FooterView` rows are the formal AC4 record once complete — Opus should re-read
`.screenshots/rendered-assert/2026-08-01T23-15/manifest.json` (filter `storyId` containing `footerview`) and
diff its 16 md5s/verdicts against the I1 list above; the direct capture already proves byte-identity independent
of that run finishing. **This is flagged explicitly in §9 as the one piece of evidence produced by a proxy
mechanism (same story/viewports/locales/build, not the single official invocation) rather than the exact named
command completing** — Opus should treat the direct capture as sufficient corroboration, or re-run the full sweep
during review if it wants the single-invocation artifact.

---

## 6. AC2/AC5 DOM witness (live, post-migration)

Captured against the rebuilt `storybook-static/` build, `en` locale, 1024px:

```json
{
  "footerTag": "FOOTER",
  "footerClass": "site-footer _footer_1m02o_32",
  "containerTag": "DIV",
  "containerClass": "container-wide _container_1m02o_44",
  "navCount": 2,
  "navAriaLabels": ["Navigation", "Information"],
  "pCount": 4, "pTags": ["P", "P", "P", "P"],
  "spanCount": 3, "spanTags": ["SPAN", "SPAN", "SPAN"],
  "socialAnchors": [
    { "tag": "A", "target": "_blank", "rel": "noopener noreferrer", "href": "https://facebook.com" },
    { "tag": "A", "target": "_blank", "rel": "noopener noreferrer", "href": "https://instagram.com" }
  ],
  "navLinkTag": "A", "navLinkHref": "/en/"
}
```

Confirms: `<footer>` tag preserved, `site-footer` class present verbatim; container `<div>` carries
`container-wide` verbatim; both `<nav>` landmarks keep their `aria-label`; all 4 `<p>` and 3 `<span>` tags
preserved; both social anchors keep `target="_blank"` **and** `rel="noopener noreferrer"`; internal nav links
resolve through the locale prefix (`/en/`).

---

## 7. Other commands run and actual results

| Command | Result |
|---|---|
| `grep -n 'className=' src/components/layout/FooterView.tsx` | **15** lines, every value is `styles.*` or `cn('site-footer'/'container-wide', styles.*)` — **zero** raw Tailwind utility (AC1). *(Corrected at review 2026-08-02: this row originally read "14 lines"; the live count is 15 — `:25, :68, :69, :74, :75, :76, :78, :83, :86, :95, :98, :114, :116, :118, :126`. AC1's verdict is unaffected.)* |
| `npx tsc --noEmit` | **0 errors** |
| `npm run check:design-tokens` | **28** total (unchanged), 0 for `FooterView.tsx`, 5 for `HeaderView.tsx` (`min-[390px]`, Task 706 scope), 4 for `NotificationCenter.tsx`, 11 for `FavoriteButton.module.css`/`SaveToCollectionButton.module.css`, 8 for `app/[locale]/page.tsx` — re-run after the edit, identical total (AC6) |
| `grep -n "@media" src/components/layout/FooterView.module.css` | One rule, `@media (min-width: 48rem)` = 768px — under the 1024px ceiling (AC7) |
| `npm run check:file-integrity` | **PASSED** — 2 files clean (NUL/BOM/JSON/truncation) |
| `npm run check:mojibake` | **0 artifacts** in 2037 scanned files |
| `git status --short -- src/stories/mantine/primitives/FooterView.stories.tsx src/components/layout/Footer.tsx scripts/mantine-migration-scope.json` | empty — confirmed zero drift on out-of-scope files |

---

## 8. Final production build (hard gate)

```
npm run build
✓ Compiled successfully in 58s
✓ Generating static pages (40/40)
BUILD EXIT CODE: 0
```

Full transcript captured; route table shows `/[locale]` unchanged at 618 kB First Load JS (pre-existing, not
introduced by this task — flagged historically in `docs/backlog.md`'s 691 precondition note, not this task's
concern).

---

## 9. Assumptions, deviations, limitations

- The kickoff's §3.8 dirty-tree snapshot (8 unrelated paths) was **already committed** by the time this
  implementation session started (`git status --short` was clean pre-edit) — the double-attribution risk it
  warned about did not materialize; noted here so the reconciliation is explicit rather than silently assumed.
- **I1 baseline** was assembled from two independent pre-edit `--mantine-only` runs rather than a single one:
  a pre-existing complete run (`2026-08-01T21-56`, predates this session) plus a second run started at this
  session's actual beginning (`2026-08-01T22-55`, terminated early once its FooterView cells — the only ones
  needed — were confirmed to match the first run byte-for-byte). Both are genuinely pre-edit (file mtime and
  `git status` both confirm), and their agreement **is** the D26 same-tree stability control, not a weaker
  substitute for one.
- **AC9's two arms and the AC4 "migrated-clean" corroboration** used a purpose-built lightweight capture script
  (same story id, same `MANTINE_VIEWPORTS`/`LOCALES`, same `storybook-static/` build, same static-server +
  Playwright-chromium mechanism as `scripts/check-stories-rendered.mjs`) rather than the full 71-story
  `--mantine-only` invocation, because iterating the plant/revert cycle through the full ~70-story sweep would
  have cost hours per arm. The **official** full sweep was also run (post-change, non-plant code) but was still
  in progress at report time (see §5.4) — Opus should confirm its FooterView rows once complete, or accept the
  direct-capture corroboration as sufficient.
- No change to `i18n` — no new user-facing string was introduced; all text remains prop-driven from `Footer.tsx`
  (unchanged) and the story's existing `storyT` fixtures (unchanged).
- `.site-footer`'s zero-consumer status (§5.3) is recorded as a finding only, per D28 — not acted on.

---

## 10. Opus handoff — evidence locations and open questions

- **Evidence directories (local-only, D6, not in `git status`):**
  `.screenshots/rendered-assert/2026-08-01T21-56/` (pre-edit baseline #1, complete, manifest present),
  `.screenshots/rendered-assert/2026-08-01T22-55/` (pre-edit baseline #2, footer cells confirmed matching #1),
  `.screenshots/rendered-assert/2026-08-01T23-15/` (official post-change full sweep — **check completion status
  and its 16 `footerview` rows' md5/verdict against §5.4's I1 list**),
  `.screenshots/task673-ac9/migrated-clean/`, `.screenshots/task673-ac9/armA-planted/`,
  `.screenshots/task673-ac9/armB-reverted/` (AC9 two-armed plant + migrated-clean corroboration, md5.json +
  computed-tagline-maxwidth.json in each).
- **Please verify at review time:** whether `.screenshots/rendered-assert/2026-08-01T23-15/manifest.json` exists
  and is complete; if so, confirm its 16 `mantine-primitives-footerview--default` rows are `verdict: "pass"` and
  md5-identical to the I1 list in §5.4 — this closes the one item this report could not fully close itself given
  the full sweep's wall-clock cost.
- **No open owner decision.** D28/D29 closed both per the kickoff.

---

## 11. Backlog update (state only)

See `docs/backlog.md` — Task 673 row moved from `KICKOFF FILED` to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, pointing at this session log.

---

## 12. Orchestrator review addendum (Opus, 2026-08-02) — closes §5.4 / §10's open item

**The official post-change sweep completed.** `.screenshots/rendered-assert/2026-08-01T23-15/` now holds
1184 cells + `manifest.json` (run finished 01:44 local). Verified at review, not reported:

- Its 16 `mantine-primitives-footerview--default` rows are **all `"verdict": "pass"`**, with `renderCheck`
  (no page/console errors, `domFailed:false`), `styleIntegrity.pass`, `noHorizontalOverflow`,
  `visualIntegrity.pass`, `visualContentCheck.pass`, `retryCount: 0`.
- Their 16 PNG md5s are **byte-identical** to the §5.4 I1 list and to both pre-edit runs (`21-56`, `22-55`).
- The run genuinely rendered the migrated code: `storybook-static/` was rebuilt at **01:14:03**, after the
  module's final Arm-B state (**01:13:35**) and before the footer cells were captured (**01:20:23**);
  `storybook-static/assets/FooterView-TRd-Zby_.css` carries the reverted `max-width:13.75rem`, and the old
  Tailwind chain no longer appears anywhere in the built bundle.

AC4 therefore rests on the single official invocation, not on the proxy capture. The proxy capture and the
AC9 arms remain valid corroboration.

**Sweep-level finding, not attributable to this task.** The `23-15` run's own summary is `failed: 2`
(`PopularLocationsView/Default it/mobile-390`, `Table/Default sq/mobile-390`), against the `21-56` baseline's
`failed: 1` (`ListingDetailPattern/Default sq/mobile-390`, which passes in `23-15`). All three are
`blank-canvas — near-uniform (bg=100.0%, var=0.0)` at **mobile-390 only**, on stories untouched by this diff,
with the PNG collapsing from ~178 KB to ~2.7 KB — a non-deterministic capture flake that predates this task and
moves between stories run to run. Recorded here for a harness-stability corrective task; it does not affect
`FooterView`'s 16 cells.
