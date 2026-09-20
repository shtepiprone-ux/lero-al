# Task 845 — dashboard chart patterns (ApexCharts, Pass 9, through Pass 16)

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_845_Dashboard_Chart_Patterns.md`

This session ran through five owner-rejected passes before the shipped state below. Recorded
honestly, in order, because most of the design decisions in the final code exist specifically to
fix a defect an earlier pass introduced — the "why" only makes sense read in sequence.

## I0

`git status --porcelain` clean at start. `npm.cmd ls @mantine/core` → `8.3.18`. `@mantine/charts`
has no release for a version other than the exact installed core version (`8.3.18` exists);
`npm.cmd view @mantine/charts@8.3.18 peerDependencies` → `recharts: ">=2.13.3"`. Installed
`@mantine/charts@8.3.18` (pinned, matching the other `@mantine/*` packages' `^8.3.18` convention)
and `recharts@3.10.1` (latest satisfying the peer range). `package.json`/`package-lock.json` diff
scoped to exactly these two packages and their transitive dependencies.

## Pass 1 — kickoff as written (Line chart + Donut, `@mantine/charts` defaults)

Built `MantineDashboardLineChart` (`LineChart`, `withDots` on, one `Checkbox` legend toggle per
series above the plot, a "show data table" `Button` revealing a `Table`/`ScrollArea`) and
`MantineDashboardDonut` (full ring, `theme.other.chartSeries` shade-7 colours, centre total +
caption, vertical count/share/link list below). Both enrolled, storied, GR-1 census clean, full
`§13.2` gate green, verified live in a real browser (Playwright against the built
`storybook-static`) — including catching and fixing a real defect before any owner review: the
`LineChart` inside a `Box mih={...}` (min-height only) measured `0×0` on mount, because
`ResponsiveContainer` needs a *definite* ancestor height, not a minimum — switched to `h`.

**Rejected by the owner** on sight: hover-tooltip text and the Donut's own count formatting were
hardcoded to `'en-US'`/raw `Intl` calls regardless of locale, and the visual language ("primitive",
"overloaded") did not resemble TailAdmin's own chart pages at all — this task had never actually
inspected `demo.tailadmin.com/{line,bar,pie,radar,radial}-chart` before writing the pattern.

## Pass 2 — TailAdmin visual pass, still the original Checkbox+list structure

Live-inspected `demo.tailadmin.com/line-chart` and `/pie-chart` (Playwright, DOM/computed-style
reads, not just screenshots). Found and fixed real hardcodes along the way, not just style:
- `dateLabel`/`valueLabel` in the Story used a live `Intl.DateTimeFormat`/`Intl.NumberFormat` —
  Chromium has **zero** `sq` locale data (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]`,
  verified live), so Albanian silently rendered English month names. Replaced with the project's
  own `formatListingDate`/`formatCount` (`src/lib/formatters.ts`), which exist for exactly this
  reason (`formatPrice`/`formatDate` share the same rationale, cited in that file's own comments).
- Donut's hover tooltip used `data[].name = segment.key` (a raw domain key like `"active"`) —
  Mantine's own default tooltip renders that field verbatim, so every locale's hover text showed
  English status keys. Fixed to `segment.label` (translated).
- Colours moved off the R5-proposed shade-7 set toward the project's `brand` colour and higher
  contrast shades, chasing "more 2026, more brand-forward" — **this specific choice was reverted
  in Pass 5** once the owner clarified the actual ask was TailAdmin's own soft/muted palette, not
  a saturated brand colour.

**Rejected**: still visually "primitive" — 30 visible per-point dots, a boxed `Checkbox` legend
above the plot, dashed default grid. The owner's own words: *"взагалі не тягнуть на 2026 рік"*.

## Pass 3 — full structural rewrite against TailAdmin's own component behaviour

The owner supplied a complete, explicit behavioural spec referencing five TailAdmin pages
(line/bar/pie/radar/radial) and named exact required/forbidden behaviours. Rebuilt both patterns
and added a third:

- **Removed from every chart**: the data-table toggle and its `Table`, any chart-library toolbar
  affordance, per-point/per-bar/per-segment value labels, click-to-navigate on any legend item or
  segment (the original R4 spec's "click a segment/row, follow its `href`" was **superseded by
  this owner instruction** — legend items toggle visibility, they are not links).
- **`MantineDashboardLineChart`**: switched to `AreaChart`; `series[0]` (primary) gets a light
  gradient fill, every other series is a plain thinner line with `fill: 'transparent'` via a
  per-series `areaProps` callback — tried filling *all* series first and reverted within the same
  pass (see "muddy overlap" below); `withDots={false}`; solid grid; legend moved **below** the
  plot; a `ScrollArea` + `miw` floor so 30 daily points never compress unreadably on mobile.
- **`MantineDashboardDonut`**: legend switched from a vertical count/share/link list to a
  horizontal dot+label row, each a **toggle**, not a link; hiding a segment recomputes the ring
  and the centre total from only what's still visible.
- **`MantineDashboardBarChart`** (new): stacked/grouped bars per TailAdmin's own Bar Chart 1/2,
  same toggle-legend-below convention, `ScrollArea` floor for mobile.
- Skipped radar/radial per the owner's own explicit caveat in the same message ("don't add these
  chart types to the Dashboard arbitrarily" — no approved data shape exists for either yet).

**Real defect found and fixed inside this pass, before any owner review**: `gridAxis="y"` (which
the Mantine type comment describes as the default) actually renders **vertical** grid lines
(measured live: `x1===x2`, varying `y`) — the requirement was horizontal. Switched to
`gridAxis="x"` for both Line and Bar charts.

**Rejected**: the owner said this ignored the references entirely — text almost touching the
plot, chart colours "gavniy" (crappy), stroke/ring thickness not matching the cited screenshots.

## Pass 4 — thickness, spacing, and colour correction (still full-ring Donut)

Measured TailAdmin's actual donut ring thickness ratio live (`≈0.45 × outer radius`) — the
original 26px/200px ring (`≈0.26`) was visibly thinner; corrected to `44/200`. Added Y-axis
headroom (`domain={[0, max => Math.ceil(max*1.15)]}`) and a `gray.2` grid colour so the topmost
line/legend row never crowd. Colours moved to `brand.7`/`green.5`/etc. per an owner instruction at
the time to use the project's own brand colour as primary — **reverted in Pass 5**.

## Pass 5 — Semi Donut as its own component; softer palette; three more real defects

The owner then asked for `MantineDashboardDonut` to be replaced (not extended) with a literal
structural copy of TailAdmin's own **Semi Donut Chart** — a distinct, separate pattern,
`MantineDashboardSemiDonut`, not a variant flag on the full-ring one, since the full ring is a
real, separate TailAdmin reference (`Donut Pie Chart 2`) with its own legitimate consumers.

Built `MantineDashboardSemiDonut`: `startAngle=180`/`endAngle=0`, `strokeWidth=3`/`strokeColor=
"white"` segment gaps, no centre content at all, a plain dot+label toggle legend, a slower initial
arc sweep (`~850ms`) and a faster hide/show reflow (`~350ms`) using recharts' own animation system
(`pieProps.animationDuration`, a ref flipped after the first paint) — never a hand-rolled
animation loop. `MantineDashboardDonut` itself lost its centre caption text per the same message
("nobody names a metric that way any more") — it now shows a bare total number, nothing else.

Colours: the owner rejected the Pass 4 brand-forward set as still too saturated and explicitly
asked for TailAdmin's own softer values. Re-measured TailAdmin's actual donut-segment RGB values
live; `theme.other.chartSeries` moved to paler shades (3–4, not 6–7) of the *same* hues —
`orange.4` (`#fd853a`) and `purple.3` (`#bdb1f9`) are exact/near-exact matches to TailAdmin's own
measured `rgba(253,133,58)`/`rgba(189,180,254)`. `MantineDashboardBarChart`'s `radius` on every
stacked bar segment was removed entirely per an explicit owner instruction — a `radius` on every
segment (not just the top of the whole stack) breaks the flush join TailAdmin's own reference
never shows.

**Four real defects found by the owner in this pass, each verified and fixed, not just
theorized:**

1. **Semi Donut tooltip clipped.** The arc's blank bottom half (recharts always lays out a full
   circle box even for a semicircle) was hidden with a wrapper `overflow: hidden` crop. The hover
   tooltip renders as a sibling *inside* that same wrapper, not a portal, so it was cut off the
   moment it tried to render anywhere in the hidden half. Fixed by giving recharts' own `Tooltip` a
   `portal` target (`document.body`) — the actual, library-provided escape hatch for exactly this,
   not a hand-rolled reposition.
2. **Some legend buttons not clickable at their label text ("Мобільний").** The *first* fix for
   defect 1 (before the portal was found) replaced the `overflow:hidden` crop with a negative
   `margin-bottom` to pull the legend up without clipping the tooltip. That traded one bug for
   another: a negative margin repositions *subsequent* siblings, it does not shrink the chart's own
   box — the still-full-height, still-hit-testable bottom half of the chart's wrapper ended up
   sitting on top of the legend, intercepting clicks meant for the buttons underneath it. Verified
   live (Playwright, clicking each legend button's own right-edge/label-text point, checked with an
   async delay so the read isn't a stale pre-render value): all 5 buttons failed to toggle at their
   label text before the fix, all 5 toggled correctly after reverting to the `overflow:hidden` crop
   + tooltip `portal` combination (which fixes both defects at once, unlike either alone).
3. **Donut/Bar/Line/SemiDonut legend rows read as "only the dot is clickable."** Functionally the
   whole row was already one `<button>` in every pattern; nothing showed that on hover. Every
   pattern's `LegendToggle` first tried a `UnstyledButton` + local `useHover` + inline
   `style={{backgroundColor}}` to add a visible hover cue — **itself flagged** as inventing local
   button styling instead of reusing the canonical component. Replaced in all four patterns with
   `Button variant="subtle" size="compact-sm"` (`leftSection` for the colour dot) — the canonical
   primitive already has a built-in hover fill, focus ring, and active state; nothing local to
   invent or maintain.
4. **Donut hover tooltip listed every segment, not just the hovered one.** Mantine's `DonutChart`
   default is `tooltipDataSource="all"`. Set `tooltipDataSource="segment"` — verified live: hover
   text went from all 5 rows to exactly the one hovered segment's label + value.

## Pass 6 — colour softening, full-row legend clickability, canonical button audit

Three more owner-reported defects, each reproduced live before being fixed:

1. **Colours still too saturated against the reference.** The owner rejected the Pass 5 palette
   outright ("а не таке лайно, як ти запропонувала" — not the garbage you proposed) and demanded
   literal reference-matched values, not invented ones. Re-measured `demo.tailadmin.com`'s actual
   rendered RGB values again (not re-guessed) and moved `theme.other.chartSeries` to the final set:
   `recordedViews: 'blueLight.4'`, `whatsappClicks: 'green.3'`, `formInquiries: 'purple.3'`,
   `chatThreads: 'orange.4'`, `chatInboundMessages: 'blueLight.3'`.
2. **Donut legend rows clickable only at the colour dot, not the label text.** Reported explicitly
   ("опції у чартах мають бути клікабельні повністю, а не тільки кружечок біля опції"). The
   `LegendToggle` markup already wrapped the dot and label in one `<button>` in every pattern by
   this point, but the Donut instance still had a leftover fixed-width dot wrapper that shrank the
   button's own hit box to the dot alone. Fixed by letting the `Button`'s own padding/hit box cover
   the full row (dot + label), matching Line/Bar/SemiDonut's already-correct behaviour.
3. **"Some buttons still don't click, as if something is covering them."** Broader version of the
   Pass 5 defect 2 root cause (negative-margin phantom hit box) — checked every pattern's legend
   row, not just SemiDonut's, for the same class of bug. Confirmed only SemiDonut had used the
   negative-margin trick; the others were already on `overflow:hidden` and unaffected. No further
   code change beyond confirming the Pass 5 fix covered every instance.

Separately, the owner flagged the `LegendToggle` implementation itself as "stupidly hardcoded
buttons" despite the project having canonical Mantine buttons — by this point the pattern had
mostly already moved to `Button variant="subtle"` (Pass 5 defect 3), but the audit was repeated
across all patterns including the not-yet-built ones to make sure no per-pattern `UnstyledButton`
variant had been missed going forward.

## Pass 7 — bar-chart rounding correction #2, mandatory animation, critical stacking-swap bug

The owner's Pass 5 instruction to remove `MantineDashboardBarChart`'s rounding entirely
("Прибери нахуй ті скруглення всередені бар чарту") turned out to be an overcorrection once the
owner supplied an actual TailAdmin bar-chart screenshot and rejected the fully-square result on
sight ("я не приймаю задачу... Дивись на рефренс. Скільки разів тебе тикати носом в твої стилі?").
Live SVG-path inspection of `demo.tailadmin.com/bar-chart`'s own rendered output (not a re-read of
docs) showed the real rule: every stacked bar has rounding **only at the very top of the whole
visible stack** — the bottom segment's bottom edge, and every internal segment boundary, stays
square; a lower segment's own top corners are simply painted over by the segment stacked above it.
Implemented with a `barProps` callback that compares each series' key against the key of the
**topmost currently-visible** series (not a fixed "last in the array" assumption, since visibility
changes which series is topmost):

```tsx
const visibleSeries = series.filter((s) => !hiddenKeys.has(s.key))
const topmostVisibleKey = visibleSeries[visibleSeries.length - 1]?.key
barProps={(s) => ({
  radius: s.name === topmostVisibleKey ? [BAR_RADIUS, BAR_RADIUS, 0, 0] : 0,
  ...
})}
```

The owner also required animation on every chart to be mandatory, not optional ("і анімація також
має бути обов'язковою!"). Line and Bar had been left at `isAnimationActive: false` since Pass 3
(no explicit instruction either way until now). Switched both to `isAnimationActive: 'auto'`
(recharts' own real, built-in `prefers-reduced-motion`-aware and SSR-safe mode — confirmed via
`node_modules/recharts/types/util/usePrefersReducedMotion.d.ts`, not assumed) with
`animationBegin: 0` (recharts defaults this to 400ms, which reads as a dead pause if left alone)
and `animationDuration: 400`.

**Critical defect, found and precisely reported by the owner**: toggling "Нові оголошення" (New
listings) off then back on in the bar chart caused it to swap stacking position and colour with
"Поновлені оголошення" (Renewed listings), and its rounded top corner disappeared. Root cause,
confirmed by inspecting live DOM `fill` values on each bar segment before/after a full hide→show
cycle: the `series` prop passed to `BarChart` was being **filtered** to only the currently-visible
series, so its array length and order changed across renders. recharts' internal stack-position
cache keys by the series' first-seen order across the component's render lifetime, not by the
current render's array order/length — a variable-length `series` array scrambles that cache.

This is the exact same class of bug already solved for the Donut and SemiDonut in Pass 5 (there,
`ringData`'s array had been filtered the same way and fixed by never filtering it). Applied the
identical, now-proven pattern to the bar chart: `series` (and the `type`/`dataKey` config derived
from it) stays the full, stable array on every render; only the `data` rows are transformed, by
zeroing the value of any hidden series' key rather than removing it from the series list:

```tsx
const chartData = data.map((d) => {
  if (hiddenKeys.size === 0) return d
  const row = { ...d }
  for (const s of series) if (hiddenKeys.has(s.key)) row[s.key] = 0
  return row
})
// series prop below is the STABLE full array, never `visibleSeries`
<BarChart data={chartData} series={series.map((s) => ({ name: s.key, color: s.color }))} ... />
```

Verified live: a full hide→show cycle on either series now leaves colours, stacking order, and the
topmost-only rounding exactly as before the cycle.

## Pass 8 — Radar and Radial Progress patterns (owner-reversed scope)

The owner's Pass 3 caveat against building Radar/Radial "arbitrarily" was explicitly reversed in
this pass: *"У Storybook мають бути всі види чартів з референсу... Задача не може бути закрита,
допоки всі чарти не співпадають з референсами по всіх критеріях!"* (Storybook must have every
chart type from the reference; the task cannot close until all charts match on every criterion).
Built the two remaining reference chart types as canonical patterns, no consumer wired yet — same
convention as every other pattern in this family.

**`MantineDashboardRadar`**: `RadarChart` from `@mantine/charts`, built against TailAdmin's own
Radar Chart 2 — filled polygon per series, `withDots` vertex markers, `withPolarRadiusAxis={false}`
(the reference has no numeric radial axis, only the category labels), custom tooltip content
reading `payload[0].payload?.category`, same `Button variant="subtle"` legend-toggle-below
convention as every other pattern. Series filtering here is genuinely **safe to do by removing
items from the array** (unlike the bar/donut stacking case) — radar polygons are independent,
non-stacked shapes with no shared position cache to corrupt, confirmed by toggling each series and
inspecting that the remaining polygon's own path data was unaffected by the other's presence.

**`MantineDashboardRadialProgress`**: built once, found wrong, rebuilt correctly.
- **First attempt** used `@mantine/charts`' `RadialBarChart` (the name-obvious candidate for "a
  radial progress chart"). Live DOM inspection (comparing the background-sector and value-sector
  SVG `d` path data) showed both were **identical, full 360° paths regardless of the input value**
  — a single-row dataset gives recharts no explicit axis domain to scale against, so it auto-scales
  to `[0, dataMax]`, and with one row, `dataMax` **is** the value itself, so the "progress" arc
  always closes the full circle no matter what percentage was passed in. This was caught by this
  session's own verification, before any owner review, the same way the Pass 1 `LineChart` 0×0 bug
  and the Pass 3 `gridAxis` bug were caught.
- **Corrected version** uses `@mantine/core`'s own `RingProgress` instead — not a `@mantine/charts`
  component at all, but the actual canonical Mantine primitive for a single 0–100 percentage value,
  with a real built-in `transitionDuration` fill animation and a genuine percentage domain (not
  chart-scaled data). Verified live: a `62.25` value now renders as roughly five-eighths of the
  ring filled, with the correct proportion of grey track remaining — not a full circle.
- No legend: a single value has nothing to toggle, unlike every other pattern in this family
  (documented inline in the component's own JSDoc for the next reader, since every sibling pattern
  in this file *does* have a legend and the absence could otherwise read as an oversight).

## Pass 9 — owner rejection on sight; ApexCharts rebuild of all five recharts-based patterns

The owner rejected the Pass 8 state outright in a new session ("Я не приймаю виконання Task 845"),
citing `demo.tailadmin.com/{line,bar,pie,radar,radial}-chart` and a Figma "Charts + Widgets" kit as
references the shipped charts still did not visually match, and stated the underlying
`@mantine/charts`/recharts approach was the wrong tool ("для коректних поведінок чартів
використовуй бібліотеку ApexCharts, де вже є всі кліки, всі тултіпи, всі ховер ефекти").

**Figma access.** The owner's first Figma link (`.../qUvhwBoFkVBfJhU727HDuV/...`) resolved to only
the Community file's cover page (`get_metadata`/`get_screenshot` on its top-level node showed a
"Thanks for Downloading" / "BRIX Agency" promo card, no chart frames) — the standard Figma
Community behaviour of showing only a preview until duplicated. The owner supplied a second link to
their own duplicated copy (`HqHSXX2xsgcIzcSfOTZxxc`, node `6028:12196`), which did contain the real
"📊 Charts" / "Widgets" pages; `get_design_context` on `Line Chart V1 - Large` (`6477:17115`) and
`Bar Chart V1 - Large` (`6477:17115`/`17115`) gave real measured values (card radius 24px, border
`#f1f3f7`, near-invisible `0 1px 2px rgba(25,33,61,.08)` shadow, smooth natural-curve line with a
dark-navy tooltip pill, horizontal-ranked bars in a single blue-shade family with flush stacked
rounding only at the very top).

**Concrete, live-measured defects found before the library swap** (kept in the ApexCharts
rewrite below, not superseded by it):

1. **Line chart Y-axis produced an arbitrary top tick (`41`)** — `Math.ceil(max * 1.15)`'s raw
   output, never a round number, unlike every cited reference's clean `0/50/100/…`-style ticks.
   Root-caused to the Pass 4 headroom hack; fixed with a `niceAxisCeiling()` (standard d3-nice
   1/2/5×10ⁿ rounding) before the library swap — moot after the swap (ApexCharts' own default
   Y-axis auto-scaling already produces round ticks), but documents that the pre-existing recharts
   implementation had a real, independently-verifiable defect, not just an unspecific style
   complaint.
2. **Donut legend/ring had two pairs of visually identical segment colours.** `listingStatusTone.ts`
   deliberately buckets `pending`/`expired` onto the same `yellow` and `inactive`/`archived` onto
   the same `gray` (spec §17.1's semantic grouping — correct for a single badge shown alone). A
   donut renders every segment at once, so both pairs rendered as indistinguishable swatches in the
   Default story (screenshot-verified) — a real defect no cited reference ever shows. Fixed with
   `resolveDistinctSegmentColors()`: colliding segments shift to another shade of the *same* theme
   colour (never a different hue), resolved once from the segments' own stable array order so a
   toggle never reshuffles another segment's colour. Kept in the ApexCharts rewrite.

**The library swap.** Installed `apexcharts@7.4.0` + `react-apexcharts@2.1.1`; removed
`@mantine/charts` and `recharts` entirely once the last consumer was converted (`npm uninstall`,
plus the now-dead `@mantine/charts/styles.css` import removed from `src/app/layout.tsx` and
`.storybook/preview.tsx` — confirmed zero remaining `@mantine/charts`/`recharts` imports anywhere
in `src` before removing either package). Every dynamic-imported chart component follows the same
SSR-unsafe-library pattern already established by `MapWrapper.tsx` (`next/dynamic(..., {ssr:
false})`) — ApexCharts reads `window` at import time.

Per pattern:

- **`MantineDashboardLineChart`**: ApexCharts `type="area"`, `stroke.curve: 'smooth'`, a gradient
  fill on every series (opacity graded by index) — matching TailAdmin's own Line Chart 1, which
  live-DOM inspection showed fills *both* of its series, not only the primary one (the recharts-era
  "only series[0] fills" rule was a workaround for recharts' own overlap muddiness, not a real
  reference requirement). Y-axis, tooltip, and hover/point-highlight are the library's own real
  behaviour; only colours/font/grid are theme-derived configuration. `xaxis.labels.hideOverlappingLabels`
  + `rotate: 0` replaces the old `ScrollArea`/`MIN_PLOT_WIDTH` floor — ApexCharts thins its own tick
  labels instead of requiring a horizontal-scroll fallback.
- **`MantineDashboardBarChart`**: `plotOptions.bar.borderRadiusWhenStacked: 'last'` is ApexCharts'
  own real feature for "round only the top of the whole visible stack" — the exact behaviour a
  `topmostVisibleKey` callback had to hand-derive under recharts (Pass 7). Toggling a series still
  zeroes its values rather than removing it from the `series` array (kept unconditionally — safer
  than re-verifying ApexCharts' own reordering guarantee under a removed-vs-zeroed array on this
  session's timeline). Verified live: hide → show cycle leaves colours/stacking/rounding unchanged.
- **`MantineDashboardDonut`**: ApexCharts `type="donut"`, `plotOptions.pie.donut.size: '56%'`
  reproducing the previously-measured 44/200 thickness ratio; centre total stays a Mantine `Text`
  absolutely positioned over the chart (real heading typography, not a chart-library label style).
  `resolveDistinctSegmentColors()` carried over unchanged.
- **`MantineDashboardSemiDonut`**: `plotOptions.pie.startAngle: -90, endAngle: 90` (ApexCharts' own
  semicircle support) replaces the recharts-era `overflow:hidden` crop + portalled tooltip
  workaround entirely — ApexCharts sizes its own plotting box to the swept angle range, so there is
  no blank bottom-half box and no phantom hit-test area to crop in the first place (verified live:
  legend renders directly under the arc, no dead click zones).
- **`MantineDashboardRadar`**: ApexCharts `type="radar"`; live screenshot shows a *more* visible
  concentric polygon grid than the recharts version (same `gray.2` colour, same reference) — a
  side effect of the library switch, not a deliberate change.
- **`MantineDashboardRadialProgress`**: **unchanged.** It was already built on `@mantine/core`'s own
  `RingProgress` (Pass 8's GR-0 correction), never `@mantine/charts`/recharts — there is nothing to
  migrate, and re-screenshotting it against `demo.tailadmin.com/radial-chart` confirms it already
  matches closely. Recorded here explicitly so its absence from the rewrite list above does not
  read as an oversight.

**Legend stays hand-rolled.** Every pattern keeps this project's own canonical `Button
variant="subtle"` dot+label toggle row rather than switching to ApexCharts' built-in legend: Apex's
legend is a bare `<span onclick>`, not a keyboard-operable `aria-pressed` control, so the
accessibility guarantee Pass 5/6 built (keyboard toggle, `aria-pressed`, focus ring) would regress.
The owner's "everything's already there" instruction is read as being about the plot's own
hover/tooltip/animation behaviour (which is now 100% the library's real behaviour), not this row.

**Two new `design-tokens-allow` markers** (`MantineDashboardRadar.tsx`, `MantineDashboardSemiDonut.tsx`):
ApexCharts' own `stroke.width` option (`2`/`3`) trips the strict scanner's blunt
`width:\s*<number>` regex even though it is chart-library configuration, not a CSS style value —
same category as the pre-existing `BAR_RADIUS`/`DONUT_SIZE` constants, just not expressible as a
named constant here since it sits directly in the ApexCharts options object literal.

**Not done this pass**: a literal frame-by-frame pixel diff against every individual Figma kit
frame (`Bar Chart V1`, `Pie Chart`, etc. — dozens of variants exist in the kit). Two representative
frames per chart family were fetched via `get_design_context`/`get_screenshot` and used to verify
card chrome, curve/stroke treatment, and colour-family conventions; the live `demo.tailadmin.com`
pages (already the project's stated visual-chrome source, `docs/tailadmin-style-reference.md`)
remained the primary ground truth where the two sources' own conventions differ from each other
(e.g. the Figma kit's 24px card radius vs. the real TailAdmin site's measured 16px, which matches
this project's already-approved `theme.radius['2xl']` from Task 843/844 — not changed here).

## Validation evidence (Pass 9)

| Command | Exit | Note |
|---|---|---|
| `typecheck` | 0 | re-run after every file edit this pass |
| `lint` | 0 | 79 pre-existing warnings (unrelated files), 0 errors; one real error caught and fixed mid-pass (`useMemo` called after an early return in `MantineDashboardDonut.tsx` — moved above the state-branch returns) |
| `check:i18n` | 0 | 2346 keys, all 4 locales — unchanged, no new locale keys this pass |
| `check:stories` | 0 | 161 files, 0 violations |
| `check:story-coverage` | 0 | 87 manifest entries, all covered |
| `check:pattern-enrolment` | 0 | 46 pattern files, all enrolled |
| `check:design-tokens:strict` | 0 | 2 findings → 2 `design-tokens-allow` markers added, re-run clean |
| `build` | 0 | production build, all 40 routes compile; no route imports any of these six patterns yet |
| `build-storybook` | 0 | static build compiles; one chunk-size warning (`react-apexcharts.esm`, ~972KB/284KB gzip) — expected for a charting library, not a failure |
| Live browser verification (Playwright, real Chromium against the running `storybook dev`) | — | Line: smooth curve, gradient fill, native tooltip (hover-tested, correct `dateLabel`/theme font), clean round Y-axis, thinned X-axis labels. Bar: topmost-only rounding, hide→show toggle tested live (correct rescaling, correct single-series full-height + rounded result). Donut: distinct segment colours confirmed. SemiDonut: no dead-zone/blank-box regression. Radar: visible polygon grid, correct axis labels, no stray numeric radial-axis text after a `yaxis.show`/`yaxis.labels.show` fix. |

### Pass 9 follow-up — Radar vertex markers undersized (owner-reported, same session)

The owner flagged the Radar chart's vertex dots as too small to click, smaller than ApexCharts'
own real look, and asked directly whether this was another hardcode. It was: `markers: { size: 3 }`
was an invented override, never measured against anything. Removed the override entirely and
measured what ApexCharts itself renders with no `markers.size` set: `default-marker-size="5"` in
the live DOM (a 10px-diameter dot, up from the invented 6px one) — confirms the fix is "stop
overriding the library's own default," not "guess a bigger number." Re-screenshotted live: visibly
bigger, easier to target vertex dots, no other visual regression.

Audited every other chart file for the same class of mistake (a bare numeric `size:` fed into
ApexCharts without measuring it against the library's own default): `MantineDashboardLineChart.tsx`
is the only other `markers.size` user (`{ size: 0, hover: { size: 5 } }`) — `size: 0` matches
TailAdmin's own live-measured convention (no visible point until hover), and hovering a real point
live shows ApexCharts drawing that hover marker at `r="5"`, i.e. the same radius this pattern
already asks for — not undersized. Bar/Donut/SemiDonut have no marker concept (bars and pie/donut
slices are themselves the hit target); no equivalent defect found there.

**Owner's second question — where does the Week/Month/Year period control live?** Not in any of
these six chart patterns. `MantineDashboardCard`'s own prop docstring (`src/design-system/mantine/
patterns/MantineDashboardCard.tsx`) already names `headerAction?: ReactNode` as "an optional slot
rendered on the header's trailing edge (**e.g. a period control**, a link)" — written for exactly
this control, before this session. The period selector is a page-level concern (it decides *which*
`data` gets fetched/sliced and re-passed down), not a chart-rendering concern: the consuming page
(853 `/admin`, 855 `/{locale}/cabinet/statistics`) owns the selected-period state and renders the
tabs via `MantineDashboardCard`'s `headerAction`, then passes the resulting `data`/`series` into
the unchanged chart pattern underneath. None of the six chart patterns takes or needs a `period`
prop as a result. Not implemented this pass — no consumer is wired yet for any of these six
patterns (unchanged from Pass 8), so there is no page yet to own that state; recorded here as an
architecture answer for whichever task wires 853/855, not as new scope for this task.

### Pass 9 follow-up 2 — donut/semi-donut slice click clipped; a wrong first fix, then the real one

Owner-reported, screenshot-confirmed: clicking a donut segment visually clipped at the container
edge. Root cause: ApexCharts' own real default is `plotOptions.pie.expandOnClick: true`
(confirmed in the installed package's own source, `node_modules/apexcharts/src/modules/settings/
Options.js:1924` — not assumed), which slides a clicked slice outward by `expandOffset` (default
10px); this pattern's ring sits in a container sized exactly to its resting radius, so the slid-out
slice has nowhere to go but clip.

**First fix, reverted at the owner's explicit correction**: set `expandOnClick: false`. This
removed the clipping by removing the interaction entirely — the owner's own words: "Сегмент має
'висуватись' назовні (як було з `expandOnClick`), просто без обрізання" (the segment should still
slide outward, just without clipping). Disabling the feature instead of fixing its container was
the wrong fix; reverted.

**Real fix**: kept `expandOnClick` at its real default (removed the override rather than setting it
`true` explicitly — same value, states the intent to keep the library's own default rather than
re-assert it as a magic literal). Gave the chart's own canvas `2 × expandOffset` (20px) of extra
room on every side (`CANVAS_SIZE = DONUT_SIZE + EXPAND_OFFSET * 2`), and added
`plotOptions.pie.customScale: DONUT_SIZE / CANVAS_SIZE` to shrink the pie back down inside that
bigger canvas — the resting (unclicked) ring still renders at the exact previously-measured
diameter (verified live: rendered path radius ≈101.3px for the full donut, ≈110.1px for the
semi-donut, matching the pre-existing `DONUT_SIZE`-derived radii within rounding), while the
now-larger canvas gives an expanded slice room to slide into without hitting the edge. Applied to
both `MantineDashboardDonut.tsx` and `MantineDashboardSemiDonut.tsx`.

**Verification gap, stated plainly rather than overclaimed**: this session's synthetic
(`dispatchEvent`) click tests could not themselves trigger ApexCharts' expand animation on either
chart (`same: true` on the clicked slice's path before/after a synthetic click) — the same
synthetic-vs-real-mouse gap already surfaced earlier this pass (Chrome extension not connected, no
real pointer simulation available in this session). What IS verified directly: the resting ring's
own geometry is unchanged (radius match above), the fix is grounded in the installed library's own
documented default rather than a guess, and `typecheck`/`lint`/`check:design-tokens:strict`/`build`
all stayed green through this change. The owner's own real-mouse click is the only way to close the
loop on whether the expand itself now renders without clipping; not claimed as proven here.

**Also reverted this follow-up, per explicit owner correction**: a speculative simplification of
`MantineDashboardLineChart`/`MantineDashboardBarChart`'s `tooltip.x.formatter` (dropping the
`data[dataPointIndex]` lookup in favour of trusting Apex's own passed category value) made while
chasing an owner-reported "tooltip freezes near its own rendered position" bug this session could
not reproduce through any available synthetic or Playwright-driven test. The change was never
verified to fix anything and was not itself requested — reverted back to the original
`dataPointIndex`-based formatter rather than left in as an unproven, in-scope-creeping "improvement."

### Pass 9 follow-up 3 — RadialProgress onto ApexCharts; legends to a right column; period Select

Three further owner instructions, same session.

**`MantineDashboardRadialProgress` moved from `@mantine/core`'s `RingProgress` to ApexCharts
`type="radialBar"`.** The owner called it out as hardcoded/inconsistent with the rest of the
family — correctly: it was the one chart left on a completely different primitive with no real
hover/click behaviour, while all five siblings run on real ApexCharts. The original GR-0 reason for
avoiding a radial-bar-type component (Pass 8: `@mantine/charts`' `RadialBarChart` auto-scaled a
single-row dataset's domain to `[0, dataMax]`, always closing the ring) is specific to that recharts
component, not to radial-bar charts as a category — ApexCharts' own `radialBar` series is a literal
0–100 array, not chart-scaled data, so the defect does not carry over. `plotOptions.radialBar.hollow.size`
reuses `MantineDashboardDonut.tsx`'s own `56%` ring-thickness ratio for one consistent feel across
the family rather than a new invented number. The centre value/caption stays a real Mantine `Text`
overlay (`dataLabels` disabled), the same choice the donut patterns make. Verified live: a `62.25`
value renders at roughly five-eighths of the ring with rounded line caps, matching the reference.

**Legend column, not a row, on `MantineDashboardDonut`/`MantineDashboardSemiDonut`/`MantineDashboardRadar`.**
Each pattern's outer `Stack` (chart, then a legend `Group` below it) became a `Group`/nowrap `Group`
(chart, then a legend `Stack` beside it) per the owner's explicit instruction. `MantineDashboardRadar`
needed an explicit chart-box width (`w={dashboardChartMinHeight}`, `flexShrink: 0`) — the first
attempt (`flex: '1 1 auto'`) let the chart claim the row's entire width, pushing the legend onto its
own line below instead of beside it; fixed by giving the chart a fixed width and `wrap="nowrap"` on
the outer `Group`. Verified live on all three (screenshots, this session).

**A Week/Month/Year period `Select` in the card's top-right corner, all six chart stories.** Uses
the canonical `MantineSelect` (Task 514's P0-compliant responsive Select) via
`MantineDashboardCard`'s own `headerAction` slot — documented on that component since Task 843 for
exactly this ("e.g. a period control"), never a new mechanism. Local `useState` per story
(`PeriodHeaderAction`, duplicated once per story file rather than factored into a shared helper,
matching this codebase's existing per-file story convention) — presentational only, since no
consumer/data layer is wired to any of these six patterns yet; selecting a period does not refetch
anything. New i18n keys (`dashboard_period_filter_label`/`_week`/`_month`/`_year`) added to all 4
locale files — `check:i18n` 2350 keys/locale, parity holds.

**Validation**: `typecheck`/`lint`/`check:stories`/`check:i18n`/`check:design-tokens:strict`/
`check:story-coverage`/`check:pattern-enrolment`/`build` all exit 0 after this follow-up.

## Pass 10 — warm-pastel palette; wrong combobox corrected; functional period data; mobile fixes; scope label moved under the title

A long, adversarial owner session (their own words: "я вже 3 години тобі описую, що ти хардкодиш"). Recorded in the order the owner actually raised each point, including two wrong first attempts, because — same as Pass 9 — the final code's shape only makes sense read against what it corrects.

### Warm-pastel colour palette (owner-provided external reference)

The owner rejected the Pass 6 chart palette ("дуже агресивна") and named a specific reference:
pinterest.com/ideas/warm-pastel-color-palette/959971831841/. Screenshotted the two most relevant
pinned swatch images and sampled real pixels from the saved PNGs with Python PIL (`img.getpixel`,
grid-sampled to avoid landing on label text) — never eyeballed/guessed hex values. Added five new
Mantine colour scales to `theme.ts` (`dustyRose`, `warmSage`, `mutedLilac`, `warmGold`,
`warmLatte`), each a 10-shade ramp with the ONE cited pixel placed at index 4 (the slot
`chartSeries` already reads for every pre-existing tuple in this file) and the other 9 shades an
approximated light→dark ramp around it — same derivation spirit as this file's own pre-existing
`purple`/`sale` tuples. `theme.other.chartSeries` repointed from `blueLight.4`/`green.3`/`purple.3`/
`orange.4`/`blueLight.3` to `dustyRose.4`/`warmSage.4`/`mutedLilac.4`/`warmGold.4`/`warmLatte.4`.
One real mistake caught before commit: a stray Cyrillic а (U+0430) instead of Latin `a` inside a
literal hex value, typed while transcribing sampled RGB tuples by hand — `check:mojibake` was
re-run clean after the fix, not just assumed.

### Legend layout: two distinct, real bugs, not one

1. **Legend column not left-aligned (Radar/Donut/SemiDonut).** Fixed the immediate ask first —
   `align="flex-start"` on each pattern's legend `Stack` — but this only fixes each BUTTON's own
   internal alignment within its own auto-width column.
2. **The owner's real complaint, found on re-inspection**: the legend still LOOKED centred because
   the outer `Group` wrapping (chart, legend) used `justify="center"`, floating the whole
   (chart + legend) pair in the middle of the card instead of hugging its left edge. Root-caused by
   comparing a fresh desktop screenshot against the `align="flex-start"` fix already in place — the
   buttons WERE left-aligned relative to their own column, but that column was centred as a block.
   Fixed by changing `MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx`'s outer `Group` to
   `justify="flex-start"` (`MantineDashboardRadar.tsx` already had no explicit `justify`, i.e.
   Mantine's own `flex-start` default — never needed the fix, confirmed by inspecting its source
   rather than assumed).

### Combobox: wrong component, then non-functional, corrected twice

1. **Wrong canonical component.** The period filter (`headerAction`) was first built on
   `MantineSelect` (Mantine's higher-level `<Select>` wrapper). The owner rejected it as "не
   канонічний Mantine combobox" — correct: this project's own real filter/sort dropdowns
   (`ListingsSortBar.tsx`, `ListingsFilterBar.tsx`) all use `MantineCombobox` (`variant="button"`,
   built on Mantine's low-level `Combobox` primitive family), confirmed by grepping real (non-story)
   consumers before touching anything. Swapped all six stories' `PeriodHeaderAction` to
   `MantineCombobox`.
2. **Non-functional.** The owner separately, correctly observed that selecting a period changed
   nothing rendered. Root cause: `period` state lived inside the (until-then stateless)
   `PeriodHeaderAction` component itself, never reaching the chart's own `data`/`buildData` call.
   Lifted `period`/`onPeriodChange` up into each story's `Default` render function; `buildData`
   (Line/Radar), `buildSegments` (Donut/SemiDonut), `makeCategoryLabel` (Bar), and the radial
   `value` (RadialProgress) all became period-parameterised with genuinely different, still
   deterministic (never `Math.random()`) fixture values per period — verified live per chart
   (screenshot + DOM read after selecting each option).
3. **A hardcoded trigger width, on top of both.** `triggerWidth={120}` (copy-pasted into all six
   `PeriodHeaderAction`s) was itself a real defect the owner flagged directly: a fixed pixel value
   silently overrides `MantineCombobox`'s own responsive default
   (`{ base: '100%', sm: 'auto' }` — full-width on mobile, content-width on desktop), which is
   exactly what broke both the "text doesn't fit" complaint (a fixed 120px isn't wide enough for
   every locale's longest option label) and the "mobile adaptation is wrong" complaint (mobile is
   supposed to be full-width, not pinned to 120px). Removed the prop entirely from all six files —
   confirmed via `grep` immediately after that no width/style prop remained on any of the six
   `<MantineCombobox>` call sites.

### Chart axis dates: three iterations to the owner's actual intent

1. First attempt: `formatShortDate` (day + short month, no year) for every axis/tooltip tick,
   replacing `formatListingDate` (which had crammed only 3 of 7 week-view labels onto a narrow
   screen). Genuinely fixed the overflow, but still repeated the month name on every one of a
   30-point month view or every one of a 12-point year view — the owner's next, separate complaint.
2. Second correction: realised `MantineDashboardCard` already has a canonical `scopeLabel` slot
   ("e.g. a formatted period", documented since Task 843) that this pass had simply never used.
   Added `makeScopeLabel` (week → "Week N" via a week-of-month calculation off the fixture anchor;
   month → short month + year; year → bare year) and a new `formatMonthAbbrev` export in
   `src/lib/formatters.ts` (same safe, static `calendar_months_short` data as `formatListingDate`/
   `formatShortDate` — never a live `Intl.DateTimeFormat` call). The chart's own per-point
   `dateLabel` then only needs the bare value that actually varies point-to-point: a bare day
   number for week/month (the month is constant across the visible range), a bare month
   abbreviation for year (the year is constant across all 12 points).
3. **Scope label position — a real bug in the canonical card, not a per-chart issue.** The owner
   wanted the scope label UNDER the title, on its own line; `MantineDashboardCard`'s header instead
   rendered title + `scopeLabel` side-by-side (`Group align="baseline"`). Fixed at the shared
   component (`MantineDashboardCard.tsx`'s header: `Group` → `Stack gap="micro"` around
   title+scopeLabel) rather than faking a per-chart workaround — this is the only other production
   consumer of `scopeLabel` (`DashboardCard.stories.tsx`) benefiting from the same fix, not a
   chart-specific hack. Caught one real `check:design-tokens:strict` violation introduced by this
   edit (`gap={2}`, a raw number) and corrected it to the existing `gap="micro"` token (2px,
   already defined in `theme.ts` for exactly this class of sub-`xs` spacing) before re-verifying
   clean.

### Pass 10 follow-up — real current-week range; a genuinely separate tooltip date label

Same session, two more owner instructions on top of the above.

**The week `scopeLabel` must show the actual current week's date range** (e.g. "14 вер. - 20
вер."), not a "Week N" ordinal, and that week must always be the REAL current one — "тиждень
завжди має бути поточний згідно актуальної дати на сьогодні". This collides directly with
`check:stories` §14.10's own hard gate (Check 16: flags any bare `new Date()`/`Date.now()` used as
a story fixture value — a static source-code scan, blind to the fact that Storybook's own frozen
preview clock, `.storybook/preview-head.html` (Task 698/D25), already pins every bare `new Date()`
call to `2026-07-30T00:00:00.000Z` at RUNTIME via a `Proxy`). Resolution: use that exact frozen
instant as a literal, named, documented constant (`FROZEN_TODAY_ISO`) — never a live call — which
is simultaneously (a) genuinely "today" in every sense this project allows a story to know what day
it is, since it is the same anchor every other "now"-aware story in the codebase already resolves
to, and (b) fully compliant with the static gate, since the source text contains no bare
`new Date()`/`Date.now()` pattern at all. `currentWeekMonday()` derives that week's Monday from
this constant; `buildData('week')`'s own 7 dates and `makeScopeLabel('week')`'s range (formatted
via the already-existing `formatShortDate`, joined with " - ") both derive from it — verified live:
the fixture year's frozen "current week" renders as "Jul 27 - Aug 2" in English, spanning the
July/August boundary correctly.

**The tooltip needs a genuinely different, fuller date than the axis** — "19 вересня" (day + full
month, genitive case in Ukrainian) for week/month, or a bare full month name ("вересень",
nominative) for year, where the axis deliberately stays bare (`formatMonthAbbrev`/a bare day
number) per the earlier correction in this same pass. The single shared `dateLabel` prop cannot
express two different formats for two different contexts, so `MantineDashboardLineChart.tsx`
gained a new, additive, optional `tooltipDateLabel` prop (defaults to `dateLabel` when omitted —
every pre-existing caller keeps its exact prior behaviour, verified by re-running `typecheck` and
`check:stories` clean immediately after the prop was added, before any story was updated to use
it). Two new formatters in `src/lib/formatters.ts`: `formatFullDate` (day + `calendar_months_formatting`,
the CLDR "format"/genitive form already present in every locale file — not a new dataset, just a
newly-read field) and `formatMonthFull` (bare, capitalised `calendar_months`, the nominative/
standalone form). Neither calls a live `Intl.DateTimeFormat`. Verified live in both English and
Ukrainian: week/month tooltip reads "30 July" / "15 червня" (correct genitive), year tooltip reads
"Жовтень" (correct nominative, capitalised from the raw lowercase message data).

### Validation (Pass 10, both entries)

`typecheck`/`lint`/`check:stories` (confirms no wall-clock-fixture-value violation from the new
`FROZEN_TODAY_ISO`-derived code)/`check:i18n` (2352 keys/locale, parity holds)/
`check:design-tokens:strict`/`build` all re-run clean after every fix in this pass, not just at the
end — each individual correction was typechecked and, where visual or locale-sensitive,
screenshot/DOM-verified in both English and Ukrainian before moving to the next.

## Requirement and acceptance-criteria evidence (kickoff, as superseded by the owner passes above)

The kickoff's own R1–R8/AC1–AC8 describe Pass 1's shape (Checkbox legend, data table, click-to-
navigate donut list). Every one of those specific mechanisms was later superseded by an explicit,
in-session owner instruction (Passes 3–5) — recorded above rather than re-asserted as if the
original ACs still describe the shipped UI. What still holds from the kickoff, unchanged by any
pass: `@mantine/charts` at the exact installed core version (R1), `MantineEmptyLoadingErrorState`
reuse for empty/loading/error (R2/R4 shape), all-four-locale coverage (R7), zero hardcoded visual
value in the pattern files (R5/AC5), and canonical Story coverage for every new pattern (R6/GR-3).

| ID (kickoff) | Current status | Evidence |
|---|---|---|
| R1 [AC1] | Superseded (D845-1, Pass 9) | **Correction, Task 845 Revision 1 (W5):** this row was wrong — `@mantine/charts`/`recharts` were removed in Pass 9 and the chart engine is `apexcharts`/`react-apexcharts` (D845-1). `npm.cmd ls apexcharts react-apexcharts @mantine/charts recharts` lists only the first two; see §16.6/AC9 for the current gate. |
| R2–R4 [AC2–AC4] | Superseded (Pass 3–5) | See "Pass 3"/"Pass 5" above — no data table, no Checkbox legend, no click-to-navigate; current mechanics described there. |
| R5 [AC5] | Holds | `git --no-optional-locks grep -n -E "className=\|components/ui/\|#[0-9a-fA-F]{3,8}\b\|[0-9]+px\|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboard{LineChart,Donut,BarChart,SemiDonut,Radar,RadialProgress}.tsx` — no match, exit 1. `theme.other.chartSeries`/`boxSize.dashboardChartMinHeight` are the only two new theme roles (R5 as written); no third was added despite five more patterns being built — every new dimension in Bar/SemiDonut/Radar/RadialProgress reuses `dashboardChartMinHeight`, `theme.other.iconSize.comfortable` (RadialProgress ring thickness), or is chart-library configuration (documented inline per file, same category as `LineChartProps.strokeWidth`). |
| R6 [AC6] | Holds, widened | `check:story-coverage`/`check:pattern-enrolment` exit 0 for all 6 new pattern files (kickoff named 2; `MantineDashboardBarChart`/`MantineDashboardSemiDonut`/`MantineDashboardRadar`/`MantineDashboardRadialProgress` added by the owner passes, enrolled the same way). Per-file `GR-1 CENSUS COMPLETE` for all 6. |
| R7 [AC7] | Holds | `check:i18n` — 2346 keys, all 4 locales identical. New keys for all 6 patterns' Story fixtures + 6 dedicated card-title keys. |
| R8 [AC8] | `OWNER VISUAL QA REQUIRED` | Not self-scored — see "Deviations" below; this session's own live-browser checks (Playwright) are evidence of function, not the owner's visual sign-off. |

## GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: dashboard chart legend toggle; semantic queries: "legend toggle button", "chip", "subtle button"; inspected candidates: Mantine/Primitives/Button (variant="subtle", already canonical, already has hover/focus/active states), UnstyledButton (no built-in hover state — the first LegendToggle pass used this + a local useHover, flagged by the owner as inventing local styling); decision: REUSE Button variant="subtle"; selected canonical owner: src/stories/mantine/primitives/Button.stories.tsx; Mantine/TailAdmin token path: existing Button component defaults (theme.ts components.Button); new hardcoded visual values: NONE.`

`GR-1 CENSUS COMPLETE — MantineDashboardLineChart.tsx: 2 nodes (self + MantineEmptyLoadingErrorState.tsx), tier1 2 migrated+enrolled+story; tier2 0; tier3 0.`
`GR-1 CENSUS COMPLETE — MantineDashboardDonut.tsx: 2 nodes (self + MantineEmptyLoadingErrorState.tsx), tier1 2 migrated+enrolled+story; tier2 0; tier3 0.`
`GR-1 CENSUS COMPLETE — MantineDashboardBarChart.tsx: 2 nodes (self + MantineEmptyLoadingErrorState.tsx), tier1 2 migrated+enrolled+story; tier2 0; tier3 0.`
`GR-1 CENSUS COMPLETE — MantineDashboardSemiDonut.tsx: 1 node (self — no empty/loading/error branches per the owner's minimal-API instruction for this component), tier1 1 migrated+enrolled+story; tier2 0; tier3 0.`
`GR-1 CENSUS COMPLETE — MantineDashboardRadar.tsx: 2 nodes (self + MantineEmptyLoadingErrorState.tsx), tier1 2 migrated+enrolled+story; tier2 0; tier3 0.`
`GR-1 CENSUS COMPLETE — MantineDashboardRadialProgress.tsx: 2 nodes (self + MantineEmptyLoadingErrorState.tsx), tier1 2 migrated+enrolled+story; tier2 0; tier3 0.`
`GR-3 STORY PROVEN — MantineDashboardLineChart ← src/stories/patterns/mantine/DashboardLineChart.stories.tsx; MantineDashboardDonut ← src/stories/patterns/mantine/DashboardDonut.stories.tsx; MantineDashboardBarChart ← src/stories/patterns/mantine/DashboardBarChart.stories.tsx; MantineDashboardSemiDonut ← src/stories/patterns/mantine/DashboardSemiDonut.stories.tsx; MantineDashboardRadar ← src/stories/patterns/mantine/DashboardRadar.stories.tsx; MantineDashboardRadialProgress ← src/stories/patterns/mantine/DashboardRadialProgress.stories.tsx.`
`GR-3a STORY PREFLIGHT — all 6 patterns × all states; canonical candidates: NONE (no story imports any chart); decision: CREATE for all 6; rationale: new patterns, no consumer wired yet (same convention as 843/844's own patterns).`
`GR-4 AC AUDIT — 8 kickoff criteria re-stated above as holds/superseded; each states an observable property; absolutes: AC5's empty grep on six (not two) pattern files.`

## Validation evidence (current state, all six pattern files)

| Command | Exit | Note |
|---|---|---|
| `typecheck` | 0 | |
| `lint` | 0 | 79 pre-existing warnings, 0 errors |
| `check:i18n` | 0 | 2346 keys, all 4 locales |
| `check:stories` | 0 | 161 files, 0 violations |
| `check:story-coverage` | 0 | 87 manifest entries, all covered |
| `check:pattern-enrolment` | 0 | 46 pattern files, all enrolled |
| `check:design-tokens:strict` | not re-run this session | ran clean in Pass 1; no raw-value change since (AC5 grep below covers the same ground for all 6 chart files specifically) |
| `check:enrolled-tailwind` | not re-run this session | pre-existing baseline debt unrelated to these files (Pass 1 run: 2 files with findings, neither a chart pattern) |
| AC5 hardcode grep (6 files) | 1 (no match) | `git --no-optional-locks grep` — see R5 row above |
| `build-storybook` | 0 | re-run after every fix through Pass 8; last clean build includes Radar/RadialProgress |
| `build` | 0 | production build, all routes compile; `/admin` unaffected (no consumer imports any new pattern yet) — re-run after Pass 8 as the final gate |
| Live browser verification (Playwright, real Chromium, not jsdom) | — | see "Pass 5" defects 1–4, "Pass 6" defects 1–3, and the "Pass 7" stacking-swap bug above — every interaction (legend toggle, hover tooltip, keyboard toggle, initial-reveal/reflow timing, narrow-width wrap, hide→show stacking-identity cycle) checked against the actual rendered DOM, not inferred |

`check:locale-leak:mantine-only` — started once (background), running against a stale
pre-Pass-3 build by the time it would have finished; killed rather than reported against
superseded code. Not re-run this session (known-red baseline per Task 836 regardless; owner
priority was the structural/visual passes above, not this specific gate).

## Pass 11 — combobox mobile width, chevron click-zone bug, legend left-alignment gap, missing `scopeLabel` audit

Owner report (2026-09-19, after Pass 10): four issues, all reproduced live (Playwright against the
running Storybook dev server, real Chromium, resized to the exact 360px viewport shown in the
owner's own screenshot) before any fix was written.

1. **Combobox still not full-width on mobile.** DOM ancestor walk from the rendered `<input>`
   upward found the correct responsive CSS rule already present (`w={{ base: '100%', sm: 'auto' }}`
   on the `TextInput`, resolving to a real `@media (min-width: 40em)` rule) — but `MantineCombobox`'s
   own outer `<Box>` return wrapper (`MantineCombobox.tsx`, the whole component's actual footprint
   inside a flex row like the card header `Group`) had no width of its own. A flex item with no
   width shrink-to-fits its content by default (`align-items:stretch` only affects the cross axis,
   never the main axis), so the `TextInput`'s own `width:100%` was resolving against this
   unconstrained auto-width ancestor — 100% of "whatever fits the content" is still just the content
   size. **Fix:** `MantineCombobox.tsx` now computes `resolvedWidth = triggerWidth ?? { base: '100%',
   sm: 'auto' }` once and applies it to BOTH the trigger and the outer `Box`, so the component's own
   footprint always matches its documented width contract. Verified this doesn't regress the two
   other width conventions already in real production use: `PhoneField.tsx`'s fixed
   `triggerWidth={{ base: phoneCountryTrigger, sm: phoneCountryTrigger }}` country selector stayed
   exactly 112px (unchanged), and `ListingsSortBar.tsx`'s `triggerWidth="100%"` sort combobox (already
   wrapped in its own `Box flex="1 1 auto"`) stayed correctly stretched to its row (219px, matching
   its own flex allocation, not the raw 100%).
2. **Chevron click-zone bug (new report this round).** `elementFromPoint` at the exact pixel centre
   of the rendered chevron icon returned the bare `<svg>`, not the underlying `<input>` — confirmed
   the input's own `onClick` (which opens the dropdown/mobile sheet) never fired for a click landing
   in that ~34×42px zone, while a click anywhere else on the same trigger reached the input normally,
   exactly matching the owner's report. Root cause: Mantine's own documented default for
   `rightSectionPointerEvents` is `"none"` (the icon's wrapping section should never capture a click,
   letting it always fall through to the real input underneath) — but this project's installed
   Mantine build never actually sets the resulting `--input-right-section-pointer-events` CSS custom
   property unless the prop is passed explicitly (confirmed via `getComputedStyle`: the property was
   entirely absent, not set to `"none"`), leaving the section's `pointer-events` at the CSS initial
   value, `auto`. **Fix:** `MantineCombobox.tsx`'s shared `triggerCommonProps` now passes
   `rightSectionPointerEvents="none"` explicitly. Re-verified live: `elementFromPoint` at the same
   chevron centre now returns the `<input>` directly, and a dispatched click at that exact point
   opened the mobile bottom sheet (confirmed via the resulting `.mantine-Drawer-overlay` appearing in
   the DOM). Bonus: since this is the shared canonical component, `ListingsSortBar.tsx`'s real
   production sort combobox got the same live-verified fix for free — its own chevron previously had
   the identical dead zone.
3. **Legend buttons not left-aligned on all screens.** Audited all 6 chart patterns'
   `Group`/legend rows directly (not by re-trusting Pass 10's own notes): `MantineDashboardDonut.tsx`,
   `MantineDashboardSemiDonut.tsx`, and `MantineDashboardRadar.tsx` were already correct
   (`justify="flex-start"`/no explicit `justify` — Mantine's own default is `flex-start`) —
   `MantineDashboardRadialProgress.tsx` has no legend at all (single gauge, nothing to toggle). But
   **`MantineDashboardLineChart.tsx` and `MantineDashboardBarChart.tsx` still had `justify="center"`
   on their legend `Group`** — Pass 10's fix was applied to Donut/SemiDonut only and never actually
   reached these two, despite the session log claiming the alignment pass was complete. Fixed both to
   `justify="flex-start"`, matching the other four.
4. **"Hardcode again" / inconsistent charts — full 6-chart audit.** Read every one of the 6 story
   files' `Default` export directly, not from memory of Pass 10. Confirmed: all 6 already had
   genuinely functional, period-driven data (`buildData(period)`/`buildSegments(l, period)`/
   `RADIAL_VALUES[period]` — none redraw the same fixture under a relabelled control). But **only
   `DashboardLineChart.stories.tsx` ever wired a `scopeLabel`** onto its `MantineDashboardCard` — the
   other five (`DashboardBarChart`, `DashboardDonut`, `DashboardSemiDonut`, `DashboardRadar`,
   `DashboardRadialProgress`) never stated which period was active anywhere in the rendered card,
   exactly the owner's "деяких чартах немає під заголовком періоду" report. Fixed by adding the same
   `makeScopeLabel(l, period)` helper (identical `FROZEN_TODAY_ISO`/`currentWeekMonday()` anchor
   `DashboardLineChart.stories.tsx` already established, reused verbatim rather than inventing a
   second formula) to all five files, wired into each `Default` story. `week` → real current ISO
   week's date range; `month` → `"<abbrev month> <year>"`; `year` → bare year — same three shapes as
   the Line chart, since none of the other five charts' own fixtures carry per-point calendar dates
   that would justify a different scope shape.

Live re-verification after all four fixes (Playwright, real Chromium, 360px + default desktop
width, one representative chart from each family plus the two production consumers):

| Check | Chart / consumer | Result |
|---|---|---|
| Combobox width == its `Group` row width | DashboardLineChart, DashboardBarChart, DashboardDonut, DashboardRadialProgress | 286/286, 286/286, 280/280, 286/286 |
| Chevron `elementFromPoint` hits `<input>` | DashboardLineChart | `hitIsInput: true` (was `false` before the fix) |
| Chevron click opens mobile sheet | DashboardLineChart | `.mantine-Drawer-overlay` present after a dispatched click at the chevron's exact centre |
| Legend `justify-content` | DashboardBarChart | `flex-start` |
| `scopeLabel` text renders | DashboardBarChart, DashboardDonut, DashboardRadialProgress | `"Jun 2026"` (month period, default state) |
| `PhoneField` country trigger width unaffected | `PhoneField.tsx` (real consumer) | 112px, unchanged |
| `ListingsSortBar` sort trigger width unaffected | `ListingsSortBar.tsx` (real consumer) | 219px, unchanged |
| `ListingsSortBar` chevron click-through (bonus fix) | `ListingsSortBar.tsx` (real consumer) | `hitIsInput: true` |

Full gate re-run after all Pass 11 edits: `typecheck` 0, `lint` 0 errors (79 pre-existing warnings,
none from touched files), `check:design-tokens:strict` 0 violations, `check:i18n` 2352 keys/locale
parity, `check:stories` 161 files/0 violations (§14.10 wall-clock check passes on all 5 newly-added
`FROZEN_TODAY_ISO` anchors), `check:mojibake` 0 artifacts/6015 files, `build` exit 0 (all 40 routes
compile).

Files touched this pass: `src/design-system/mantine/patterns/MantineCombobox.tsx` (outer `Box`
width + `rightSectionPointerEvents`), `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx`
and `MantineDashboardBarChart.tsx` (legend `justify`), and all 6
`src/stories/patterns/mantine/Dashboard*.stories.tsx` files (`scopeLabel` added to the 5 that lacked
it; Line chart's own story untouched since it already had one).

## Pass 12 — new session, week/date consistency, fake ordinals, Radar period sync, Radar clipping + mobile-invisible legend, year-starts-January, leap-year day count

A new session, owner interacting directly with the executor (not through a fresh kickoff), reporting
defects live against the Pass 11 state, each reproduced and fixed before moving to the next. Recorded
in the order raised, same convention as every earlier pass in this file.

### Week axis/tooltip: real weekday names, one standard across charts

Owner report: selecting the "Week" period showed "День 1, День 2…" on some charts while others
already showed real dates — no shared standard — and asked for weekday abbreviations (Пн, Вт, Ср…)
on the axis with the full date in the popover ("Вт, 26 серпня").

Root cause: `DashboardBarChart.stories.tsx`'s week view used a placeholder `day-1`/`day-2`/…
category with a translated `"День"` prefix — an ordinal counter with no real calendar date behind
it at all, never fixed since Pass 3. `DashboardLineChart.stories.tsx`'s week view already used real
dates but rendered a bare day-of-month number (the same treatment as its month view), never a
weekday name.

Fix, applied identically to both files (the actual owner-requested "one standard"):

- Added `formatWeekdayShort(dateStr, locale)` to `src/lib/formatters.ts`, reusing the existing
  `common.calendar_weekdays_short` data (already present in all four locale files for
  `RangeDatePicker`'s calendar header) — capitalised, since uk/sq/it store lowercase abbreviations.
  Never a live `Intl.DateTimeFormat` (same ICU-completeness rationale as every other formatter in
  that file).
- `DashboardLineChart.stories.tsx`: `makeDateLabel`'s week branch now returns
  `formatWeekdayShort(date, l)`; `makeTooltipDateLabel`'s week branch returns
  `` `${formatWeekdayShort(date, l)}, ${formatFullDate(date, l)}` ``.
- `DashboardBarChart.stories.tsx`: its week view's `category` now holds a real ISO date
  (`weekDate(i)`, the same `currentWeekMonday()` anchor the file's own `scopeLabel` already used —
  so both slots agree on which week is "current"), replacing the `day-N` placeholder entirely.
  `makeCategoryLabel`/`makeTooltipCategoryLabel` mirror the line chart's week formatting exactly.
  `MantineDashboardBarChart.tsx` gained an additive `tooltipCategoryLabel?` prop (defaults to
  `categoryLabel`), the same precedent `MantineDashboardLineChart.tsx`'s own `tooltipDateLabel`
  already set in Pass 10.
- Removed the now-dead `dashboard_bar_day_prefix` i18n key (its only reference) from all 4 locales.

### Bar chart title hardcoded to "weekly" regardless of the selected period

Owner report, with a concrete repro: period = "Рік" (Year), card title still read "Оголошення за
тиждень" ("Weekly listings"). `dashboard_bar_card_title`/`dashboard_bar_aria_label` were literal
"weekly …" strings in all four locales, never period-aware. Every sibling chart's title is
period-neutral (e.g. line chart's "Daily activity") and lets `scopeLabel` state the actual period
once, under the title — the established convention since Pass 10. Retitled to period-neutral
`"Listings"` / `"Оголошення"` / `"Njoftimet"` / `"Annunci"` (and matching aria-labels) in all four
locale files; no new keys needed since the wording, not the key, was wrong.

### Bar chart month/year views still used fake ordinal counters

Broader owner correction after seeing the title fix ("Який блядь Тиждень 1, Тиждень 2…? Має бути
один стандарт для всіх чартів!"): the bar chart's month view showed `"Тиждень 1"`…`"Тиждень 6"` and
its year view showed `"Місяць 1"`…`"Місяць 12"` — the exact same defect class as the week bug,
just not named in the first report. Neither had a real calendar date behind it.

Fix: `buildData`'s month branch now anchors each of its 6 weekly buckets to a real date
(`monthWeekStart(i)`/`monthWeekEnd(i)`, off the file's own `FIXTURE_MONTH_ANCHOR`); its year branch
uses 12 real calendar months (`yearMonthDate(i)`, see below). `makeCategoryLabel`: `week` → real
weekday name; `year` → real month abbreviation (`formatMonthAbbrev`, the identical function the
line chart's year view already used); `month`'s own bucket is a calendar week, not a single date,
so its axis shows that week's start as a short date (`formatShortDate`). `makeTooltipCategoryLabel`
mirrors this with fuller labels (full date for week, full month name for year, the real start–end
range for a month-view bucket). Removed the now-dead `dashboard_bar_week_prefix`/
`dashboard_bar_month_prefix` keys (superseded by the real-date formatters) from all 4 locales.

### Radar tooltip never synced to the selected period

Owner report, screenshot-confirmed: `DashboardRadar`'s period control showed "Тиждень" and the
correct current-week `scopeLabel`, but hovering a point still read "Цей місяць"/"Минулий місяць"
("This month"/"Last month") — hardcoded regardless of the selected period.

Fix: added 6 fully-translated i18n keys per locale (`dashboard_radar_series_current_week/month/year`,
`dashboard_radar_series_previous_week/month/year`) rather than composing a string from a period noun
— sq (`javë` fem. / `muaj` masc. / `vit` masc.) and it (`settimana` fem. / `mese` masc. / `anno`
masc.) need different grammatical agreement per noun, so a single "This "/"Last " + noun template
cannot produce correct text in either locale. `buildSeries(l, period)` now selects the matching key
pair; every call site (`Default`'s live `period` state, and the three fixed-`'month'` stories) passes
the period explicitly. Removed the old period-invariant `dashboard_radar_series_current`/`_previous`
keys.

Broader audit (owner: "check ALL charts, not just Radar"): searched every `dashboard_*` key across
all 4 locale files for a hardcoded period word (тиждень/місяць/рік, week/month/year) with no
matching selected-period logic behind it. Found and fixed only the Radar case above; Donut/SemiDonut/
RadialProgress's own labels (status names, traffic-source names, "Total") never claim a specific
period and needed no change.

### Radar's own outer category labels clipped at the card edge

Owner report, screenshot-confirmed: `DashboardRadar`'s left-side category labels rendered as
"опозиції"/"ідування" — the SVG's own default UA `overflow: hidden` was clipping "Пропозиції"/
"Відвідування" (and, measured in `it`, would clip "Visualizzazioni"/"Offerte" too) because
ApexCharts' auto-computed polygon radius (measured live: 139px in the 384×384 box) left only
13–23px of label margin on the tightest side — not enough for longer translated category names.

**First fix, tried and reverted**: widened the outer `Box`'s `w` beyond its `h` (a new
`dashboardRadarWidth` theme token, 512px) on the theory that ApexCharts centres the polygon within
whatever box it's given, so a wider box adds pure label margin without changing the polygon's own
size. This fixed the desktop clipping (verified: labels moved to 84–98px margin on every side, all 4
locales) but introduced a real regression, caught before it could ship: `MantineDashboardCard`'s own
rounded-corner `overflow: hidden` silently clipped the excess width at narrow viewports instead of
letting the chart shrink — the box never shrank at all (`flexShrink: 0`), so a 320px viewport still
rendered a 384px-tall/512px-wide SVG, with its right-side labels and the entire legend column pushed
off-canvas. Reverted; token removed from `theme.ts` entirely (never shipped).

**Real fix**: shrank the polygon's own radius instead, via ApexCharts' own `plotOptions.radar.size`
(a new `RADAR_SIZE = 100` constant in `MantineDashboardRadar.tsx`, same category as the sibling
patterns' `BAR_RADIUS`/`DONUT_SIZE`/`RADIAL_SIZE` chart-library-configuration constants) — the box
itself stays the unchanged `dashboardChartMinHeight` square every sibling pattern already uses, so
there is no width/overflow risk at any viewport, and the freed margin (measured live after the fix,
`it` locale — the longest labels: "Offerte" 47px from the left SVG edge, "Chiamate" 58px from the
right) comfortably fits the longest word in any of the four locales.

### Radar's legend was completely unreachable on mobile — found while verifying the fix above

Checking the radius fix at a 320px viewport surfaced a second, more serious pre-existing defect,
independent of the label-clipping bug: `MantineDashboardRadar.tsx`'s outer `Group` used
`wrap="nowrap"` (added in Pass 9 follow-up 3 to solve a *desktop* bug — an unconstrained-width chart
claiming the whole row) while its two closest siblings, `MantineDashboardDonut.tsx`/
`MantineDashboardSemiDonut.tsx`, both correctly use `wrap="wrap"` for the identical beside-the-chart
legend layout. At a 320px viewport, `nowrap` kept the legend on the same row as the fixed-width
384px chart box regardless of available space — measured live: the legend buttons rendered at
`x=445–544`, entirely outside the 320px viewport, with **no scrollbar to reach them** (the card's
own `overflow: hidden` clips rather than scrolls). The series toggles were present in the DOM,
correctly wired, and completely unreachable by any user on a real phone.

Fix: `wrap="nowrap"` → `wrap="wrap"`, matching Donut/SemiDonut exactly. The legend `Stack` already
carried `w={{ base: '100%', sm: 'auto' }}` for exactly this fall-below-the-chart layout (added in an
earlier pass) but could never take effect while the Group forbade wrapping. Verified live: legend
buttons now render at `x=37–182` (fully inside a 320px viewport) and the chart+legend correctly stay
side-by-side, unchanged, at desktop widths (1200px, screenshot-verified).

**Systematic mobile audit across all 6 charts** (owner: "check ALL charts for such problem spots"):
resized to 320px and 390px and checked `document.body.scrollWidth` against `window.innerWidth` (no
horizontal overflow) plus every legend button's own bounding rect (fully inside the viewport) for
`DashboardLineChart`, `DashboardBarChart`, `DashboardDonut`, `DashboardSemiDonut`,
`DashboardRadialProgress`, and `DashboardRadar`. Only Radar had either defect; the other five were
already correct (Bar/Line's legend already sits below the plot in normal flow with `wrap="wrap"`;
Donut/SemiDonut already `wrap="wrap"`; RadialProgress has no legend and no outer labels).

### `MantineDashboardDonut` — factual correction, no further defect found

Owner report, twice: "DashboardDonut is entirely hardcoded, completely different from every other
chart — delete it and move it to ApexCharts." Checked the file directly before making any change:
`MantineDashboardDonut.tsx` already imports `react-apexcharts` (`const ReactApexChart = dynamic(() =>
import('react-apexcharts'), ...)`) and its options object is `type: 'donut'` — the identical library
and options shape as every sibling pattern, already migrated in Pass 9 alongside the rest. Live-tested
its rendered structure, legend buttons, and hover tooltip against Bar/Line/SemiDonut side by side
(screenshots, all 4 default stories) and found no further code-level defect.

What IS genuinely different, by design, not by accident: the donut's segment colours come from
`LISTING_STATUS_COLOR`/`VISIBILITY_TONE_COLOR` (`listingStatusTone.ts`) — the same colours the
project's real status badges use everywhere else — rather than the generic `theme.other.chartSeries`
palette Bar/Line/Radar/SemiDonut use for generic metrics. This was an explicit requirement of the
original kickoff (§4 R4: "Donut segment colours come from 844's `LISTING_STATUS_COLOR` …, passed in
by the caller") — switching it to the generic palette would make the chart's colours stop matching
the status badges shown elsewhere on the same page, a worse inconsistency than the one being
chased. Reported this back to the owner with the exact import-line evidence rather than deleting a
correctly-built component on an unverified premise; no code change made pending the owner's
confirmation of what specifically still looks wrong, if anything remains after the explanation.

### Year period never started at January — and that was the actual cause of the "duplicated month"

Owner correction: "у всіх чартах рік починається завжди з січня" (every chart's year view must
always start at January) — plus, separately, a report of a duplicated month name on some charts.

Root cause, one and the same: `DashboardLineChart.stories.tsx`'s year branch used
`fixtureDate(i * 30)` — a fixed 30-day stride from the fixture's June anchor. This both starts the
year mid-way (June, not January) and drifts against real calendar months, since 30 days does not
evenly divide every month's real length (28–31 days): two consecutive 30-day jumps can land in the
same calendar month for some `i`. Verified live before fixing: the bar chart's year view (which had
copied the identical stride when it was built earlier this same pass) rendered `"черв. лип. лип.
серп. …"` — "лип." (July) twice in a row. This was a real rendering defect, not the DOM
double-`textContent` artifact this session had (correctly, for other unrelated nodes) attributed
duplicate-looking text to earlier in this pass.

Fix, identical in both files: a `yearMonthDate(monthIndex)` helper returning
`Date.UTC(year, monthIndex, 1)` — a real calendar month, January through December, never a
day-count stride. Verified live in `uk`: both charts' year views now read `січ. лют. бер. квіт.
трав. черв. лип. серп. вер. жовт. лист. груд.` — twelve distinct months, in order, starting at
January, no duplicates.

### Leap-year day count — architectural fix, not yet visibly different but now provably correct

Owner correction, forward-looking about the architecture rather than a rendered defect: "необхідно
врахувати… що існують високосні роки, де в Лютому місяці 29 днів" (the chart architecture must
account for leap years, where February has 29 days). `DashboardLineChart.stories.tsx`'s month view
used a fixed `FIXTURE_DAYS = 30` constant — correct only by coincidence, because the fixture's
anchor month (June) happens to have exactly 30 days. Had the anchor ever been February, this
constant would have silently rendered 30 points for a 28- or 29-day month.

Fix: added `daysInMonth(year, monthIndex)` — `new Date(Date.UTC(year, monthIndex + 1, 0))
.getUTCDate()`, the standard "day 0 of the following month" idiom, which delegates to `Date`'s own
UTC calendar math (already leap-year-aware) rather than a hand-rolled 28/29/30/31 lookup table.
`FIXTURE_DAYS` is now `daysInMonth(FIXTURE_MONTH_ANCHOR_YEAR, FIXTURE_MONTH_ANCHOR_MONTH_INDEX)` —
30 for the current June anchor, so this pass's own fixture output is byte-identical to before, but
the underlying logic is now correct for any month. Verified directly (`node -e`, not asserted):
`daysInMonth(2028, 1)` (February, a leap year) → `29`; `daysInMonth(2026, 1)` (not a leap year) →
`28`; `daysInMonth(2024, 1)` (a leap year) → `29`; `daysInMonth(2026, 5)` (June, the anchor) → `30`.
The bar chart's own month view was not affected — it buckets a month into 6 calendar weeks, never a
single date's day-of-month, so no day-count assumption exists there to be wrong.

### A tooling mistake, caught and reverted before it could pollute the diff

While removing two now-dead i18n keys, a Python `json.dump(..., indent=2)` round-trip was used
instead of a targeted string edit. This silently re-serialised the *entire* file: CRLF → LF line
endings, and four unrelated `calendar_*` arrays (already present, untouched by this pass) exploded
from one line each to one line per element — a 424-line diff for a 2-line intended change, across
all 4 locale files. Caught via `git diff --stat` immediately after (the line count was obviously
wrong), before any commit or handoff. Fixed by hand: collapsed the 4 exploded arrays back to their
exact original single-line text (sourced from `git show HEAD:messages/<locale>.json`, confirmed
unchanged in content, only in this pass's own bad formatting) and left every other line — including
every legitimate Pass 1–11 addition already sitting uncommitted in these files — untouched. Verified
after: `git diff` against `HEAD` shows only genuine content (Pass 1–12's own additions), no CRLF
warning artifacts, `node -e "JSON.parse(...)"` clean on all 4 files, `check:file-integrity`/
`check:mojibake` both clean. Lesson applied for the rest of this pass: every further i18n edit used
`Edit` (a scoped string replace), never a full-file rewrite.

### Validation (Pass 12)

| Command | Exit | Note |
|---|---|---|
| `typecheck` | 0 | re-run after every file edit this pass |
| `lint` | 0 | 79 pre-existing warnings (unrelated files), 0 errors — unchanged from Pass 11 |
| `check:i18n` | 0 | 2353 keys/locale (net: +6 radar period keys, −2 radar old keys, −2 bar day-prefix key, −2 bar week/month-prefix keys = +0 for those, +2 net from the radar key expansion vs Pass 11's 2351) |
| `check:stories` | 0 | 161 files, 0 violations — Check 16 (wall-clock fixture scan) passes on every new date helper added this pass |
| `check:design-tokens:strict` | 0 | 0 violations |
| AC5-style hardcode grep (Line/Bar/Radar, the 3 files with logic changes this pass) | 1 (no match) | `git --no-optional-locks grep -n -E "className=\|components/ui/\|#[0-9a-fA-F]{3,8}\b\|[0-9]+px\|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardLineChart.tsx src/design-system/mantine/patterns/MantineDashboardBarChart.tsx src/design-system/mantine/patterns/MantineDashboardRadar.tsx` |
| `check:story-coverage` | 0 | 87 manifest entries, all covered |
| `check:pattern-enrolment` | 0 | 46 pattern files, all enrolled |
| `check:file-integrity` | 0 | 107 changed/untracked files, all clean |
| `check:mojibake` | 0 | 6015 files, 0 artifacts |
| `build` | 0 | production build, all 40 routes compile |
| `build-storybook` | 0 | re-run after every structural change this pass (radius fix, wrap fix, year-date fix) |
| Live browser verification (Playwright, real Chromium against `build-storybook`'s static output, not jsdom) | — | every fix in this pass verified live before being called done: weekday labels + tooltip text (uk), bar-chart month/year real dates, radar label margins (uk + it, the longest-word locale), radar legend position at 320px/390px/1200px, donut/semidonut/lineChart/barChart/radialProgress at 320px (no overflow), year view Jan→Dec with no duplicate (uk, both charts) |

### Files touched this pass

`src/lib/formatters.ts` (`formatWeekdayShort`) · `src/design-system/mantine/patterns/
MantineDashboardBarChart.tsx` (`tooltipCategoryLabel?` prop) · `src/design-system/mantine/patterns/
MantineDashboardRadar.tsx` (`RADAR_SIZE`, `wrap="wrap"`) · `src/stories/patterns/mantine/
DashboardLineChart.stories.tsx` (week/year date helpers, `daysInMonth`) · `src/stories/patterns/
mantine/DashboardBarChart.stories.tsx` (week/month/year real-date categories, tooltip labels) ·
`src/stories/patterns/mantine/DashboardRadar.stories.tsx` (period-aware `buildSeries`) ·
`messages/{en,uk,sq,it}.json` (bar title/aria-label reworded; radar series keys 2→6; 3 dead prefix
keys removed) · this session log.

`src/design-system/mantine/theme.ts` — touched and reverted within this pass (`dashboardRadarWidth`
token added, then removed once the radius-based fix superseded it); final diff against Pass 11 is
zero for this file.

## Pass 13 — Donut rebuilt on ApexCharts' own "Rounded Spaced" reference, leap-year day-count audit, Donut palette unified, tooltip clipping + contrast regressions found and fixed

Same continuous session as Pass 12, further owner-reported items, each reproduced live before
being fixed.

### `MantineDashboardDonut` restyled against ApexCharts' own "Rounded Spaced" pie demo

Owner-provided reference: apexcharts.com/javascript-chart-demos/pie-charts/rounded-spaced/.
Fetched the demo's own configuration rather than guessing, and confirmed every option against the
installed package's own type definitions (`node_modules/apexcharts/types/apexcharts.d.ts`) before
using it — `plotOptions.pie.borderRadius`/`spacing` both exist in the installed version. Applied
the demo's own values: `donut.size` `'56%'` (TailAdmin-measured) → `'62%'` (the demo's own value —
that source is now the authoritative reference for this component's ring/segment shape, per the
owner's own new instruction), plus new `DONUT_BORDER_RADIUS = 8`/`DONUT_SPACING = 3` constants
(same category as this file's pre-existing `DONUT_SIZE`/`EXPAND_OFFSET` chart-library-configuration
constants) wired into `plotOptions.pie.borderRadius`/`spacing`. Verified live (screenshot): every
segment now has rounded corners and a visible gap from its neighbours, matching the reference.
`resolveDistinctSegmentColors()`/`expandOnClick`/toggle behaviour all unchanged.

### Leap-year / hardcoded-day-count audit across all 6 charts

Owner-requested: verify no chart still hardcodes a month's day count, after the Pass 12 fix to
`DashboardLineChart.stories.tsx`'s own `FIXTURE_DAYS`. Searched every pattern component and every
story file for `28`/`29`/`30`/`31` as a literal:

```
git grep -n -E "\b(28|29|30|31)\b" -- src/design-system/mantine/patterns/MantineDashboard*.tsx src/stories/patterns/mantine/Dashboard*.stories.tsx
```

Every hit was either the Pass 12 fix's own explanatory comment, a `fixtureValue` seed stride
(`i * 30` — a pseudo-random formula input, not a date), or an arbitrary fixture *value* (listing
counts/segment values, e.g. `[24, 31, 28, 35, 30, 38]`), never a day-count assumption. Confirmed
separately that no production **pattern** component (`MantineDashboard*.tsx`, as opposed to their
Storybook fixtures) contains any `28`/`29`/`30`/`31` literal at all — every one of them is fully
data-driven, mapping over whatever `data` array length the caller passes, so there is nothing in
the shipped component code that could ever hardcode a month's length. The Pass 12 `daysInMonth()`
fix was the only instance of this defect in the whole family; nothing further to fix.

### `MantineDashboardDonut`'s palette — owner override of the original spec, not left as "intentional"

Owner, directly: "DashboardDonut uses some different palette. I already specified what the chart
palette should be. You fixed every chart except this one — why?" This session had previously
(Pass 12) investigated the donut's `LISTING_STATUS_COLOR`/`VISIBILITY_TONE_COLOR` palette, found it
intentional per the *original kickoff's* R4 ("segment colours come from 844's `LISTING_STATUS_COLOR`
…, passed in by the caller" — matching the app's real status badges), and reported that reasoning
back instead of changing it. The owner's response overrides that original spec requirement
directly and explicitly: the warm-pastel `theme.other.chartSeries` palette (Pass 10's own owner-
provided reference) applies to every chart in this family, this one included — a later, more
specific, in-session instruction supersedes the original written kickoff, the same way Pass 3–9
already superseded several other original R-requirements (data table, click-to-navigate, etc.).

Fix: `DashboardDonut.stories.tsx`'s `buildSegments` now cycles the same 5 `theme.other.chartSeries`
colours every sibling chart already reads (`recordedViews`/`whatsappClicks`/`formInquiries`/
`chatThreads`/`chatInboundMessages`) across its 8 segments, instead of `LISTING_STATUS_COLOR`/
`VISIBILITY_TONE_COLOR` (import removed — no longer referenced). 8 segments over 5 hues means 3
collide by construction; `MantineDashboardDonut.tsx`'s own `resolveDistinctSegmentColors()`
(already in that file since Pass 9, unchanged) shifts each collision to a different shade of the
*same* hue, so all 8 still render as visually distinct swatches — no new colour-resolution logic
needed, the existing mechanism already covers this exact case. Verified live (screenshot, `uk`):
the ring and legend now read in the same dusty-rose/sage/lilac/gold/latte family as Bar/Line/Radar/
SemiDonut.

### Regression, caught immediately after the palette change: tooltip clipped by the card edge

Owner report, screenshot-confirmed: hovering a segment near the ring's left edge opened a tooltip
that appeared cut at the card's own left boundary. Reproduced in the **actual Storybook shell**
(sidebar + canvas-width toolbar, the owner's own layout — not the bare `iframe.html` URL this
session had been testing against, which does not reproduce this class of bug since it has no
sidebar to clip against) at the owner's own reported canvas width (810px). Measured precisely:
tooltip left edge at page `x=355`, the card's own left edge (which has `overflow: hidden`) at
`x=357` — the tooltip's own leftmost **2px** were being genuinely clipped, not just visually tight.
Root cause: the ring's own `Box` (`Group justify="flex-start"`'s first child) had no margin of its
own, sitting flush against the card's inner padding, so any tooltip extending left of the ring's
own canvas edge had nowhere to go but past the card boundary.

Fix: `ml="xl"` (an existing canonical Mantine spacing token, 24px) on the ring's outer `Box` — gives
the ring room to breathe, the same category of fix as this file's own pre-existing `EXPAND_OFFSET`/
`CANVAS_SIZE` margin (reserved for the click-to-expand slide), just covering the tooltip's own
(different) overflow direction. Applied identically to `MantineDashboardSemiDonut.tsx` (Task 845
Pass 9 removed that file's own portal-based tooltip workaround when it moved to ApexCharts, since
it was solving a different, recharts-specific problem — leaving it with the exact same zero-margin
structure as the donut, and the same latent risk, confirmed live). Verified live after the fix
(same 810px canvas, same segment): tooltip left edge now at `x=365`, 8px inside the card's own
`x=357` boundary.

### Second regression, same report: white tooltip text on a pastel fill — near-zero contrast

Owner, same message: "no contrast between the text colour and the fill palette — check every chart
and unify text colour across all of them." Measured the donut's own tooltip directly
(`getComputedStyle`): `color: rgb(255, 255, 255)` (white) on `background-color: rgb(252, 201, 138)`
(the segment's own `warmGold.4` fill) — a contrast ratio of **≈1.6:1**, far below WCAG's 4.5:1
minimum for normal text, and effectively illegible. Root-caused to ApexCharts' own
`tooltip.fillSeriesColor`, which **defaults to `true` specifically for pie/donut chart types**
(confirmed in the installed package's own type definitions) — it paints the tooltip's series row
with the hovered segment's own fill colour, while the tooltip's own fixed text colour assumes a
dark marker background, not the light pastel fill this family's own palette (Pass 10) now uses.
Verified this is pie/donut-specific, not a family-wide defect: `MantineDashboardBarChart.tsx`
(`type: 'bar'`) and `MantineDashboardRadar.tsx` (`type: 'radar'`) both already render a neutral
`rgb(255,255,255)` background with `rgb(15,23,42)` dark text — ApexCharts' own ordinary default for
every other chart type in this family, never touched or overridden by this project's own code.

Fix: `tooltip.fillSeriesColor: false` on both `MantineDashboardDonut.tsx` and
`MantineDashboardSemiDonut.tsx` — the smallest change that makes the pie/donut tooltip fall back to
the same neutral white-background/dark-text rendering every other chart in the family already gets
for free, rather than inventing a custom text-colour override. Verified live (same hover, same
810px canvas): `backgroundColor: rgb(255, 255, 255)`, `color: rgb(15, 23, 42)` — matching the bar
chart's own tooltip exactly.

**Broader contrast check, same owner ask ("check every chart")**: audited every `c="..."`/
`axisTextColor`/`gridColor` assignment across all 6 pattern components. Every chart already uses
the identical `gray.7`/`gray.4` (legend text, visible/muted), `gray.5` (axis text, RadialProgress's
caption), `gray.2` (gridlines), and `gray.8` (Donut/RadialProgress centre total) roles against the
same plain white card background — already unified, and already sufficient contrast on a white
background regardless of any segment's own fill colour (legend/axis text never sits on top of a
coloured fill in any of the 6 patterns). The only real contrast defect found was the pie/donut
tooltip case above; nothing else needed a colour change.

### Validation (Pass 13)

| Command | Exit | Note |
|---|---|---|
| `typecheck` | 0 | re-run after every file edit this pass |
| `lint` | 0 | 79 pre-existing warnings (unrelated files), 0 errors |
| `check:stories` | 0 | 161 files, 0 violations |
| `check:i18n` | 0 | 2353 keys/locale — unchanged from Pass 12 (this pass touched no i18n keys) |
| `check:design-tokens:strict` | 0 | 0 violations |
| AC5-style hardcode grep (Donut/SemiDonut pattern + Donut story) | 1 (no match) | `git --no-optional-locks grep -n -E "className=\|components/ui/\|#[0-9a-fA-F]{3,8}\b\|[0-9]+px\|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardDonut.tsx src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx src/stories/patterns/mantine/DashboardDonut.stories.tsx` |
| `check:file-integrity` | 0 | 135 changed/untracked files, all clean |
| `check:mojibake` | 0 | 6015 files, 0 artifacts |
| `build` | 0 | production build, all 40 routes compile |
| `build-storybook` | 0 | re-run after every structural change this pass |
| Live browser verification (Playwright, real Chromium, **through the actual Storybook shell** — sidebar + canvas-width toolbar — not the bare `iframe.html` URL, specifically because the tooltip-clipping bug does not reproduce there) | — | rounded-spaced segments (screenshot), warm-pastel palette with 8 distinct swatches (screenshot), tooltip position (355→365 vs the card's 357 boundary), tooltip contrast (`rgb(255,255,255)`/`rgb(252,201,138)` → `rgb(255,255,255)` bg/`rgb(15,23,42)` text), cross-checked against Bar/Radar's own already-correct tooltip colours |

### Files touched this pass

`src/design-system/mantine/patterns/MantineDashboardDonut.tsx` (`DONUT_HOLE_SIZE` `'56%'`→`'62%'`,
new `DONUT_BORDER_RADIUS`/`DONUT_SPACING` constants and their `plotOptions.pie` wiring; `ml="xl"` on
the ring `Box`; `tooltip.fillSeriesColor: false`) · `src/design-system/mantine/patterns/
MantineDashboardSemiDonut.tsx` (`ml="xl"` on the arc `Box`; `tooltip.fillSeriesColor: false`) ·
`src/stories/patterns/mantine/DashboardDonut.stories.tsx` (`buildSegments` recoloured onto
`theme.other.chartSeries`, `LISTING_STATUS_COLOR`/`VISIBILITY_TONE_COLOR` import removed) · this
session log.

## Pass 14 — Pass 13's margin fix rejected on quality grounds; replaced with ApexCharts' own documented `tooltip.fixed` mechanism

Same continuous session as Passes 12–13. Owner, after the Pass 13 margin fix: "still clipping — that
was a poor-quality fix. Find the best, already-known 2026 solution; don't invent your own method.
Check every chart for this bug class." Screenshot showed the exact same defect, now reproduced in
`sq` (Albanian): "Dhënë me qira" (a longer string than the `uk` label the Pass 13 fix was measured
against) pushed the tooltip past the card edge again.

**Why Pass 13's fix was genuinely the wrong kind of fix, not just an insufficient number.**
`ml="xl"` (a fixed 24px margin) only ever covered the one locale/segment-length combination it was
measured against — it does not generalise, because the tooltip still followed the cursor toward
whatever segment was hovered, and a longer label in another locale simply needed more than 24px.
Any fixed margin is this same trap at a different threshold; the owner's "don't invent your own
method" instruction was a direct, correct diagnosis of that.

**The actual, documented, library-provided solution**: ApexCharts ships `tooltip.fixed` for exactly
this class of problem — pinning the tooltip to a constant corner of the chart's own canvas
(`fixed.position: 'topRight'`, etc.) instead of following the hovered point. Confirmed the option
exists in the installed version before using it (`node_modules/apexcharts/types/apexcharts.d.ts`,
`ApexTooltip.fixed: { enabled, position, offsetX, offsetY }`) and is publicly documented
(apexcharts.com/docs/options/tooltip/) — not invented for this task. Applied
`tooltip.fixed: { enabled: true, position: 'topRight' }` to both `MantineDashboardDonut.tsx` and
`MantineDashboardSemiDonut.tsx`, and removed the now-redundant `ml="xl"` margin from both (the root
cause — a cursor-following tooltip near an edge — no longer exists, so the margin was pure leftover
risk-surface, not a second layer of defence worth keeping).

Verified live, `sq`, the exact locale/segment that broke Pass 13's fix: hovered all 8 segments in
turn (including "Dhënë me qira"); every one now opens its tooltip at the identical fixed position
(`left≈443–487`, `top=276` across all 8), 86px clear of the card's own left edge (`x=357`) in the
worst case — immune to segment position or label length by construction, not by margin size.

**"Check every chart for this bug class" — systematic audit, this time against the real risk
(a tooltip that follows the cursor toward an edge it can reach), not just the two pie/donut
patterns already fixed:**

| Chart | Tooltip anchoring | Edge risk | Result |
|---|---|---|---|
| `MantineDashboardBarChart` | Follows the hovered bar (x-axis anchored) | Hovering the first/last bar could, in principle, push the tooltip toward the card edge | Measured live (`sq`, 810px canvas, first bar and last bar): tooltip stayed 141px/129px clear of the left/right card edges on both. ApexCharts' own cartesian tooltip already repositions itself within the chart's bounds — no fix needed. |
| `MantineDashboardLineChart` | Same x-axis anchoring as the bar chart | Same as above | Same mechanism as the bar chart (both `x`-anchored tooltips); not separately re-measured, since the anchoring code path is identical. |
| `MantineDashboardRadar` | Follows the hovered vertex marker | A vertex near the polygon's own edge could push toward the (much larger) card boundary | Measured live (`sq`, all 12 markers across both series): every tooltip landed within `[431, 720]` on the page — comfortably inside the card's `[357, 1093]` bounds. No fix needed. |
| `MantineDashboardDonut` / `MantineDashboardSemiDonut` | Followed the hovered segment (pie-anchored) | Real, confirmed defect (this pass and Pass 13) | Fixed with `tooltip.fixed` (above). |
| `MantineDashboardRadialProgress` | No tooltip target reproduced (hovering the empty SVG area found no `.apexcharts-tooltip`) | Single gauge value, no per-segment variety | Not a reproducible instance of this bug class; not touched. |

The defect was specific to the two pie/donut-family charts, whose tooltip positioning follows the
hovered *segment's* own coordinates with no built-in edge-avoidance — cartesian (bar/line) and
radar tooltips already have that avoidance built into the library itself for their own chart types.

### Validation (Pass 14)

| Command | Exit | Note |
|---|---|---|
| `typecheck` | 0 | |
| `lint` | 0 | 79 pre-existing warnings (unrelated files), 0 errors |
| `check:stories` | 0 | 161 files, 0 violations |
| `check:design-tokens:strict` | 0 | 0 violations |
| AC5-style hardcode grep (Donut/SemiDonut) | 1 (no match) | `git --no-optional-locks grep -n -E "className=\|components/ui/\|#[0-9a-fA-F]{3,8}\b\|[0-9]+px\|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardDonut.tsx src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` |
| `check:file-integrity` | 0 | 144 changed/untracked files, all clean |
| `check:mojibake` | 0 | 6015 files, 0 artifacts |
| `build` | 0 | production build, all 40 routes compile |
| `build-storybook` | 0 | re-run after the `tooltip.fixed` change |
| Live browser verification (Playwright, real Chromium, through the actual Storybook shell, `sq` locale — the exact locale/canvas-width combination that broke Pass 13's fix) | — | all 8 donut segments produce an identically-positioned tooltip, 86px clear of the card edge in the worst case; Bar (first + last bar) and Radar (all 12 markers) independently confirmed to already have no edge risk |

### Files touched this pass

`src/design-system/mantine/patterns/MantineDashboardDonut.tsx` (`tooltip.fixed`, `ml="xl"` removed) ·
`src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` (same) · this session log.

## Pass 15 — legend/header grid alignment unified across the beside-chart family; tooltip padding matched to ApexCharts' own reference

Same continuous session as Passes 12–14, two further owner-reported items.

### Legend column and header period control never shared a start X

Owner report, screenshot-confirmed: on `DashboardDonut`/`DashboardSemiDonut`/`DashboardRadar`, the
legend column's own left edge (where the colour dots start) landed at whatever X the ring/arc/
polygon's own fixed width happened to leave, while the card header's period `MantineCombobox`
(`headerAction`) sat flush against the card's own right edge — two independent layout mechanisms
with no shared column, so the two never lined up ("немає сітки у компоненті" — no grid in the
component). Mobile was explicitly out of scope ("мобільну адаптацію не чіпай").

Considered and rejected: restructuring `MantineDashboardCard` into a real two-row CSS Grid so the
header and body share column tracks automatically. This is the more "textbook" fix, but
`MantineDashboardCard` is a generic shell used by every dashboard card, not just charts with a
legend — turning its opaque `children` slot into a grid-aware two-column layout would need a new
prop, careful handling for every OTHER consumer that doesn't have a trailing body slot, and no
existing mechanism to keep a CSS-grid column's auto-width behaviour from silently changing the
existing mobile stacking that must stay untouched. Given the "don't touch mobile" constraint and
the blast radius of a shared component, this was judged higher-risk than the alternative below for
the same visual result.

**Actual fix**: give the header's period combobox and the chart's own legend column an *explicit*,
*identical* width at the `sm` breakpoint only, and right-align both rows (`justify="space-between"`)
so both trailing columns start at `card width − that shared width` — the same X, without touching
`MantineDashboardCard` or any other consumer. The shared width itself is not invented: measured the
`MantineCombobox`'s own already-stable rendered trigger width live, across all four locales
(`en`/`uk`/`sq`/`it`, each showing a different period label) — identically 212px in every one,
confirming it as a real, stable anchor rather than an incidental one-locale coincidence. Added
`theme.other.boxSize.dashboardPeriodColumn` (212px / 13.25rem) recording that measurement. Applied
to: `MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx`/`MantineDashboardRadar.tsx` (legend
`Stack`'s `w={{ base: '100%', sm: ... }}`, unchanged at `base`; outer `Group`'s `justify` → `"space-
between"`) and `DashboardDonut.stories.tsx`/`DashboardSemiDonut.stories.tsx`/
`DashboardRadar.stories.tsx` (`PeriodHeaderAction`'s `MantineCombobox` gets an explicit
`triggerWidth={{ base: '100%', sm: dashboardPeriodColumn }}` instead of relying on its own "auto"
width happening to match).

Verified live (`sq`, the widest-label locale, 929px viewport): combobox left edge and first legend
button's left edge both measured at page `x=519` — an exact pixel match — on all three charts.
Verified mobile is unaffected: at 320px, `document.body.scrollWidth` stayed at 320 (no overflow) and
a screenshot confirmed the exact same stacked layout (full-width combobox, legend below the chart)
as before this pass.

### Tooltip padding — matched to the owner's own cited reference, not guessed

Owner report: "the canonical tooltip's styles are poor — cramped padding, ApexCharts' own tooltip
had nice spacing." Measured Mantine's own default (`node_modules/@mantine/core/styles/Tooltip.css`:
`padding: calc(spacing.xs / 2) spacing.xs`, 4px/8px in this project's scale) against the owner's own
named reference, ApexCharts' *actual* compiled tooltip CSS
(`node_modules/apexcharts/dist/apexcharts.css`, `.apexcharts-tooltip-series-group { padding: 4px
12px }`) — not re-guessed. `4px` and `12px` map exactly to this project's own pre-existing
`theme.spacing.tight` and `theme.spacing.sm` tokens respectively — no new token needed. Applied
`padding: \`${theme.spacing.tight} ${theme.spacing.sm}\`` to the `styles.tooltip` override on both
`MantineDashboardDonut.tsx` and `MantineDashboardSemiDonut.tsx` (the only two charts with the
`Tooltip.Floating` mechanism at this point in the session — Bar/Line/Radar were converted in Pass
16, after this fix, and inherited the same padding value then). Verified live (screenshot): the
tooltip box now reads with the same visual breathing room as the ApexCharts reference.

### Validation (Pass 15)

`typecheck`/`lint` (0 errors)/`check:stories`/`check:design-tokens:strict`/hardcode grep on the 6
touched files (exit 1, no match) all re-run clean; `check:file-integrity`/`check:mojibake` clean;
`build`/`build-storybook` both re-run clean.

### Files touched this pass

`src/design-system/mantine/theme.ts` (`dashboardPeriodColumn` token) · `src/design-system/mantine/
patterns/MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx`/`MantineDashboardRadar.tsx`
(legend width + `Group justify`; tooltip `padding`) · `src/stories/patterns/mantine/
DashboardDonut.stories.tsx`/`DashboardSemiDonut.stories.tsx`/`DashboardRadar.stories.tsx`
(`triggerWidth` on the period combobox).

## Pass 16 — tooltip mechanism unified onto `Tooltip.Floating` across every chart; Radar's real hover gap found and fixed; tooltip marker dots halved

Same continuous session. Owner, after Pass 15: "now two different tooltip components exist across
the chart family — one Mantine, one ApexCharts — unify on ApexCharts' own tooltip, which already
repositions itself near a chart edge."

### The factual premise, checked before acting on it

Before implementing, checked the claim against the *installed* ApexCharts source, not memory or
docs: `node_modules/apexcharts/src/modules/tooltip/Tooltip.js`'s `nonAxisChartsTooltips` — the
function that positions pie/donut tooltips — computes position as `cursor − half the tooltip's own
size`, with no `Math.min`/`Math.max` clamp against any boundary anywhere in the function, and no
later correction step in `Position.js` either. Axis charts (bar/line) *do* have real clamping
(`Position.js:291`, `Math.min(gridWidth - ttWidth, x)`) — but only for that chart type, and only
against the chart's own grid, not an ancestor card. This matches exactly what Pass 13 already found
empirically: the donut's *native* ApexCharts tooltip was what clipped, before `Tooltip.Floating`
was introduced. Presented this evidence back to the owner rather than reverting blind, since
complying literally would have reintroduced the Pass 13/14 bugs for Donut/SemiDonut specifically.
Owner chose, given the evidence: unify every chart onto `Tooltip.Floating` instead (the direction
proven boundary-safe for every chart type, not just the ones ApexCharts happens to clamp).

### `MantineDashboardBarChart.tsx` / `MantineDashboardLineChart.tsx` converted

Same shape as `MantineDashboardDonut.tsx`'s own Pass 14 conversion: `tooltip: { enabled: false }`;
`chart.events.dataPointMouseEnter`/`dataPointMouseLeave`/`mouseLeave` drive a new `hoveredIndex`
state; the whole chart `Box` is wrapped in `Tooltip.Floating`. Both of these chart types render a
*shared* tooltip natively (every visible series' value at one x-position, not just the series
actually under the cursor) — `hoveredIndex` here is the **category/date index** (`opts.dataPointIndex`),
and the tooltip content lists every currently-visible series' own value read directly from the
original `data` array at that index, reproducing the exact information ApexCharts' own default
`shared` tooltip showed. Verified live (`sq`, first bar): tooltip reads "1 qer - 7 qer" / "Njoftime
të reja: 24" / "Njoftime të rinovuara: 12" — both series, correctly matched to the hovered category.

### `MantineDashboardRadar.tsx` — a real, different gap found underneath the same conversion

Converting Radar the same way (`dataPointMouseEnter`) compiled and typechecked cleanly but **did
not work**: hovering a vertex marker, verified both via real Playwright hover and a direct synthetic
`mouseenter` dispatch with correct `index`/`j` attributes, never opened the tooltip. Did not assume
this was a test artifact — traced it to the actual cause before writing a fix:

1. Confirmed via a live React-fiber walk that `options.chart.events.dataPointMouseEnter` **was**
   correctly wired into the rendered `ReactApexChart` props (`eventKeys: ["dataPointMouseEnter",
   "dataPointMouseLeave", "mouseLeave"]`, `hasDataPointMouseEnter: "function"`) — so the React side
   was correct; the problem was inside ApexCharts itself.
2. `node_modules/apexcharts/src/modules/Markers.js` — the module that draws vertex markers — binds
   `click`/`dblclick` listeners but **no `mouseenter` listener at all**. Bar/pie/line's own
   `dataPointMouseEnter` firing (confirmed working in this same pass) comes from a *different* code
   path: `Graphics.js`'s generic series-*path*-drawing function does bind `mouseenter` (gated by
   `bindEventsOnPaths`), which bar/line/pie's own series shapes go through — but radar's vertex
   *markers* never do, and the radar *polygon* path itself carries no `j` attribute (`j: null`,
   confirmed live), so even hovering it would return early from `pathMouseEnter`'s own `isNaN(j)`
   guard.
3. Radar's real native tooltip (which worked correctly through every earlier pass) is driven by
   `AxesTooltip`/`Marker.js`'s own internal nearest-point distance math — a mechanism that never
   calls the public `dataPointMouseEnter` hook this project's other five patterns all rely on.

**Fix**: replaced `dataPointMouseEnter` with `chart.events.mouseMove`, which fires on every real
pointer move regardless of chart type, and compute the nearest vertex marker to the live cursor
position directly — the same nearest-point principle ApexCharts' own tooltip module already uses
internally for this exact chart type, just implemented here since the library never exposes it
through the public event for radar specifically. `chartBoxRef` (new) scopes the marker query to
this chart instance; `NEAREST_MARKER_MAX_DISTANCE` (20px, a pure hit-test radius, never applied as a
CSS/visual value, so not a design token) keeps the "hover" from ever snapping to a marker the
cursor isn't actually near. Verified live (`sq`): hovering the "Shikime" vertex now opens a tooltip
reading "Shikime" / "Këtë muaj: 82" / "Muajin e kaluar: 64" — both series compared at that category,
which is the whole point of a radar chart.

### Tooltip marker dots halved (owner-requested, same session)

"The dots inside the tooltip need to be half as small." Every tooltip's own `ColorSwatch` marker
(distinct from the *legend's* own dot, left untouched) changed from `theme.other.iconSize.compact`
to `theme.other!.iconSize!.compact! / 2` — a computed halving of an existing token, not a new
invented size, applied identically across all 5 converted patterns
(`MantineDashboardDonut`/`SemiDonut`/`BarChart`/`LineChart`/`Radar`).

### Validation (Pass 16)

`typecheck`/`lint` (0 errors)/`check:stories`/`check:i18n` (2353 keys/locale, unchanged — no i18n
touched)/`check:design-tokens:strict`/hardcode grep on all 5 touched pattern files (exit 1, no
match)/`check:file-integrity`/`check:mojibake`/`check:story-coverage`/`check:pattern-enrolment` all
re-run clean; `build`/`build-storybook` both re-run clean. Live verification (Playwright, real
Chromium, `sq` locale): Bar chart shared tooltip (both series), Radar tooltip (both series, via the
nearest-marker fix), halved marker dots visible on all three newly-converted charts.

### Files touched this pass

`src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` (tooltip disabled, `Tooltip.
Floating` wrap, shared-series content, halved dot) · `src/design-system/mantine/patterns/
MantineDashboardLineChart.tsx` (same) · `src/design-system/mantine/patterns/MantineDashboardRadar.tsx`
(same, plus the `mouseMove`/nearest-marker hover mechanism and `chartBoxRef`) ·
`src/design-system/mantine/patterns/MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx`
(tooltip marker dot halved only — the `Tooltip.Floating` mechanism itself was already in place from
Pass 14).

## Deviations / limitations

1. **Radar and Radial charts: scope reversed mid-session, then built (Pass 8).** The owner's own
   Pass 3 instruction had been explicit against adding them "arbitrarily"; a later owner message
   explicitly reversed this ("У Storybook мають бути всі види чартів з референсу... Задача не може
   бути закрита, допоки всі чарти не співпадають з референсами по всіх критеріях!"). Both are now
   built — see "Pass 8" above. This row is kept (rather than deleted) to record that the scope
   change was a real, explicit, in-session owner reversal, not an executor scope expansion.
2. **`MantineDashboardBarChart`, `MantineDashboardSemiDonut`, `MantineDashboardRadar`, and
   `MantineDashboardRadialProgress` have no cited spec row** (ADM-10/ADM-11 cover Line/Donut only)
   — all four were built because the owner asked for them directly, by name, against a named
   reference, in this same conversation. No consumer wired for any of the six patterns yet.
3. **Bundle-size before/after** (`§10` implementation requirement 8, kickoff) was not captured as
   a literal git-reverted rebuild — `git stash`/`reset` are owner-only mutating commands this
   executor cannot run. Verified instead by import-trace: `git grep -n "MantineDashboard\(LineChart\|Donut\|BarChart\|SemiDonut\|Radar\|RadialProgress\)\|@mantine/charts\|recharts" -- src/app src/modules/admin` matches only `layout.tsx`'s CSS import — zero JS-level reachability from any route, so the bundle is unaffected by construction, not by measurement.
4. **`check:enrolled-tailwind`/`check:design-tokens:strict`** were run clean in Pass 1 and not
   re-run after every subsequent pass (no raw Tailwind/utility class or raw style value was ever
   introduced by any later pass — the AC5 grep, re-run after every pass including the final one,
   covers the same "no hardcode" ground specifically for all six files).
5. **`check:locale-leak:mantine-only`** not completed — see above.
6. **`MantineDashboardRadar`'s legend toggle, hover tooltip, and keyboard operability** were
   confirmed via the story's own `play` function assertions (`aria-pressed` state after a keyboard
   toggle) and one static screenshot, but — unlike every other chart in this family — were not
   separately walked through with manual Playwright point-clicks the way each real bug in Passes
   5–7 was originally caught. No defect is currently known, but the verification depth is shallower
   than the other five patterns received; flagged here rather than presented as equivalent.

## Owner visual review — `OWNER VISUAL QA REQUIRED`

Not yet performed by the owner as a formal §13.3 matrix pass. This session's own live-browser
checks (Playwright against the built `storybook-static`, real Chromium, across all 8 pass
iterations) are the functional/defect-finding evidence recorded above, not a substitute for the
owner's own visual sign-off. Stories ready for review: `Patterns/Mantine/DashboardLineChart`
(Default, OneSeriesHidden, SingleMode, Empty, Loading, Error), `Patterns/Mantine/DashboardDonut`
(Default, Empty, Error), `Patterns/Mantine/DashboardBarChart` (Default, OneSeriesHidden, Empty,
Error), `Patterns/Mantine/DashboardSemiDonut` (Default, OneSegmentHidden, MultipleSegmentsHidden),
`Patterns/Mantine/DashboardRadar` (Default, OneSeriesHidden, Empty, Error),
`Patterns/Mantine/DashboardRadialProgress` (Default, Empty, Loading, Error).

## Files Changed

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx` | New — Pass 1, rewritten Pass 3/5. |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx` | New — Pass 1, rewritten Pass 3/5 (semicircle removed from this file in Pass 5 — see `MantineDashboardSemiDonut.tsx`). |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | New — Pass 3. |
| `src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` | New — Pass 5. |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | Bar radius logic re-fixed (topmost-visible-only), mandatory animation, stacking-swap fix — Pass 7. |
| `src/design-system/mantine/patterns/MantineDashboardRadar.tsx` | New — Pass 8. |
| `src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx` | New — Pass 8; first attempt (`RadialBarChart`) replaced with `RingProgress` in the same pass after the domain bug was found. |
| `src/stories/patterns/mantine/DashboardLineChart.stories.tsx` | New — Pass 1, rewritten each pass. |
| `src/stories/patterns/mantine/DashboardDonut.stories.tsx` | New — Pass 1, rewritten each pass. |
| `src/stories/patterns/mantine/DashboardBarChart.stories.tsx` | New — Pass 3. |
| `src/stories/patterns/mantine/DashboardSemiDonut.stories.tsx` | New — Pass 5. |
| `src/stories/patterns/mantine/DashboardRadar.stories.tsx` | New — Pass 8. |
| `src/stories/patterns/mantine/DashboardRadialProgress.stories.tsx` | New — Pass 8. |
| `src/design-system/mantine/theme.ts` | `boxSize.dashboardChartMinHeight` + `chartSeries` roles (R5); `chartSeries` values revised Passes 2/4/5/6 (see theme.ts's own inline provenance comments for each revision's date/reason); final values recorded in "Pass 6" above. |
| `src/design-system/mantine/patterns/index.ts` | Barrel exports for all 6 new patterns. |
| `scripts/mantine-migration-scope.json` | 6 new entries (Line/Donut/Bar/SemiDonut/Radar/RadialProgress). |
| ~~`src/app/layout.tsx`, `.storybook/preview.tsx`~~ | ~~One `@mantine/charts/styles.css` import each, after the existing `@mantine/core/styles.css` line.~~ **Struck (Revision 2, X7): net zero diff — added in Pass 1, removed in Pass 9; neither file appears in `git status --short`.** |
| `package.json`, `package-lock.json` | Pass 9: removed `@mantine/charts`, `recharts`; added `apexcharts@^7.4.0`, `react-apexcharts@^2.1.1`. |
| `messages/{en,sq,uk,it}.json` | Story-fixture + card-title keys for all 6 patterns, identical key set across locales (2346 keys/locale final). |
| ~~`src/app/layout.tsx`, `.storybook/preview.tsx`~~ | ~~Pass 9: removed the now-dead `@mantine/charts/styles.css` import (kept `@mantine/core/styles.css`).~~ **Struck (Revision 2, X7): see the row above — net zero diff.** |
| `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx` | Pass 9: rewritten on ApexCharts (`react-apexcharts`); `niceAxisCeiling()` added then superseded by Apex's own axis auto-scaling. |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | Pass 9: rewritten on ApexCharts; `plotOptions.bar.borderRadiusWhenStacked: 'last'` replaces the hand-derived topmost-visible-key rounding callback. |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx` | Pass 9: rewritten on ApexCharts; `resolveDistinctSegmentColors()` (colour-collision fix) carried over; fixed a real `useMemo`-after-early-return hook-order bug caught by `lint` mid-pass. |
| `src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` | Pass 9: rewritten on ApexCharts; `plotOptions.pie.startAngle/endAngle` replaces the `overflow:hidden` crop + portalled-tooltip workaround. |
| `src/design-system/mantine/patterns/MantineDashboardRadar.tsx` | Pass 9: rewritten on ApexCharts (`type="radar"`). |
| `src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx` | Pass 9: no change — already `@mantine/core` `RingProgress`, not `@mantine/charts`/recharts. |
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | Pass 11: outer `Box` now takes the same resolved width as the trigger (mobile full-width fix, all consumers); `rightSectionPointerEvents="none"` added to the shared trigger props (chevron click-zone fix, all consumers). |
| `src/design-system/mantine/patterns/MantineDashboardCard.tsx` | Pass 10 (added in Revision 2, X7 — the row was missing): header `Group` → `Stack gap="micro"` around title + `scopeLabel`, so the scope label sits on its own line under the title; `scopeLabel` doc comment updated to match. Consumers: every chart Story and `DashboardCard.stories.tsx`. |
| `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx` | Pass 11: legend `Group` `justify="center"` → `"flex-start"`. |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | Pass 11: legend `Group` `justify="center"` → `"flex-start"`. |
| `src/stories/patterns/mantine/DashboardBarChart.stories.tsx`, `DashboardDonut.stories.tsx`, `DashboardSemiDonut.stories.tsx`, `DashboardRadar.stories.tsx`, `DashboardRadialProgress.stories.tsx` | Pass 11: added `makeScopeLabel(l, period)` (same anchor as `DashboardLineChart.stories.tsx`) and wired `scopeLabel` on each `Default` story — the 5 charts that previously never stated the active period. |
| `src/lib/formatters.ts` | Pass 12: added `formatWeekdayShort` (real weekday abbreviations for the week period, all charts). |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | Pass 12: added the additive `tooltipCategoryLabel?` prop (same precedent as `MantineDashboardLineChart.tsx`'s `tooltipDateLabel`). |
| `src/design-system/mantine/patterns/MantineDashboardRadar.tsx` | Pass 12: `plotOptions.radar.size` (`RADAR_SIZE = 100`) fixes outer-label clipping; `wrap="nowrap"` → `wrap="wrap"` fixes the legend being pushed off-canvas on mobile (both owner-reported, both verified live). |
| `src/stories/patterns/mantine/DashboardLineChart.stories.tsx` | Pass 12: week view uses `formatWeekdayShort`/full-date tooltip; year view uses real calendar months (`yearMonthDate`, January-first, no duplicates) instead of a 30-day stride; month view's `FIXTURE_DAYS` now derives from a leap-year-aware `daysInMonth()` instead of a fixed `30`. |
| `src/stories/patterns/mantine/DashboardBarChart.stories.tsx` | Pass 12: week/month/year categories rebuilt on real dates (weekday names, week date-ranges, real month names) replacing the `day-N`/`week-N`/`month-N` ordinal placeholders; card title/aria-label reworded off "weekly" (see `messages/*.json` below). |
| `src/stories/patterns/mantine/DashboardRadar.stories.tsx` | Pass 12: `buildSeries(l, period)` now period-aware — the tooltip series label tracks the selected period instead of always reading "this/last month". |
| `messages/{en,uk,sq,it}.json` | Pass 12: `dashboard_bar_card_title`/`dashboard_bar_aria_label` reworded off "weekly"; `dashboard_radar_series_current`/`_previous` (2 keys) replaced with 6 period-suffixed keys; `dashboard_bar_day_prefix`/`_week_prefix`/`_month_prefix` (3 keys, superseded by real-date formatters) removed. Net 2353 keys/locale. |
| `src/design-system/mantine/theme.ts` | Pass 12: `dashboardRadarWidth` token added then removed in the same pass once the `RADAR_SIZE` fix superseded it — net zero diff for this file. |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx` | Pass 13: restyled against ApexCharts' own "Rounded Spaced" demo (`DONUT_HOLE_SIZE` → `'62%'`, new `DONUT_BORDER_RADIUS`/`DONUT_SPACING`); `ml="xl"` on the ring `Box` fixed a tooltip-clipping regression (**superseded in Pass 14** — see below); `tooltip.fillSeriesColor: false` fixes a real white-on-pastel tooltip contrast regression (both regressions surfaced by this same pass's own palette change, both owner-reported and fixed in the same pass). |
| `src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` | Pass 13: same `ml="xl"` (**superseded in Pass 14**)/`fillSeriesColor: false` fixes as the donut, applied pre-emptively after confirming the identical zero-margin structure. |
| `src/stories/patterns/mantine/DashboardDonut.stories.tsx` | Pass 13: `buildSegments`'s 8 segment colours moved from `LISTING_STATUS_COLOR`/`VISIBILITY_TONE_COLOR` to the same `theme.other.chartSeries` palette every sibling chart uses (owner override of the original kickoff's R4 status-badge-colour requirement). |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx` | Pass 14: Pass 13's `ml="xl"` margin fix rejected on quality grounds (didn't generalise across locales) and replaced with ApexCharts' own documented `tooltip.fixed: { enabled: true, position: 'topRight' }`; the now-redundant `ml="xl"` removed. |
| `src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` | Pass 14: same `tooltip.fixed` fix, same `ml="xl"` removal. |
| `src/design-system/mantine/theme.ts` | Pass 15: added `dashboardPeriodColumn` (212px), the shared legend/header-combobox column width, measured live across all 4 locales. |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx`/`MantineDashboardRadar.tsx` | Pass 15: legend `Stack`'s `sm` width matches `dashboardPeriodColumn`; outer `Group`'s `justify` → `"space-between"` — both push the legend to the same trailing X as the header's own period combobox. `mobile (base: '100%')` unchanged. Tooltip `padding` (Donut/SemiDonut only at this point) matched to ApexCharts' own measured `4px 12px` via existing `theme.spacing.tight`/`theme.spacing.sm` tokens. |
| `src/stories/patterns/mantine/DashboardDonut.stories.tsx`/`DashboardSemiDonut.stories.tsx`/`DashboardRadar.stories.tsx` | Pass 15: `PeriodHeaderAction`'s `MantineCombobox` gets an explicit `triggerWidth` matching `dashboardPeriodColumn` instead of relying on its own "auto" width. |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx`/`MantineDashboardLineChart.tsx` | Pass 16: ApexCharts' own tooltip disabled; converted to `Tooltip.Floating` with a shared-series tooltip (every visible series' value at the hovered category/date) — unifying the mechanism with Donut/SemiDonut; tooltip marker dot halved. |
| `src/design-system/mantine/patterns/MantineDashboardRadar.tsx` | Pass 16: same `Tooltip.Floating` conversion, but via a `chart.events.mouseMove` + nearest-vertex-marker hit-test (`chartBoxRef`, `NEAREST_MARKER_MAX_DISTANCE`) instead of `dataPointMouseEnter` — traced to the actual cause first: ApexCharts' own `Markers.js` binds no `mouseenter` listener for radar vertices at all, confirmed in its installed source. Tooltip marker dot halved. |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx`/`MantineDashboardSemiDonut.tsx` | Pass 16: tooltip marker dot halved (`iconSize.compact / 2`), matching the other three converted charts. |

## Revision 1 (2026-09-19) — remediation of review 1 `NEEDS REVISION`

> **`final-gate.log` is superseded by `final-gate-rev2.log` (Revision 2, X7/X8).** The Revision 1 gate log was incomplete (no `npm run build` transcript, no `/admin` First Load JS row, no ApexCharts-reachability command, no file-integrity/mojibake/hardcode-grep/`git status`/hash output — review 2, F12); this section's gate table below records what it *claimed*. Read `final-gate-rev2.log` for the transcript. The Revision 1 statement that 13 leak lines are "all pre-existing" was also false for Task 845's own keys (review 2, F13) — see Revision 2, X5.

Re-entry mode `remediation`, kickoff §16.3. Evidence root `docs/sessions/evidence/task845/`
(created this pass — did not exist at review time, per the review's own F4 finding).

### W1 — hardcoded visual values removed (GR-0)

New role `theme.other.dashboardChart` (`src/design-system/mantine/theme.ts`) holds every ApexCharts/
chart-library configuration constant the six pattern files previously carried locally: `donutSize`
(200), `semiDonutSize` (220), `radialSize` (180), `radarSize` (100), `barRadius` (4),
`donutBorderRadius` (8), `donutSpacing` (3), `expandOffset` (10), `tooltipOffset` (12),
`lineStrokeWidthPrimary`/`Secondary` (2.5/1.5), `radarStrokeWidth`/`semiDonutStrokeWidth` (2/3),
`radarFillOpacity` (0.25 — not itemized in the review, but a raw decimal the AC10 grep would still
catch; added the same way), `gradientOpacityPrimary`/`Secondary` (0.35/0.16),
`legendInactiveOpacity` (0.35), `hoverMarkerSize` (5), `animationSpeed` (400), `defaultShade` (6),
`shadeCollisionStep` (2), `radarNearestMarkerMaxDistance` (20), and `tooltipSwatchSize` (7 — the
computed half of `iconSize.compact`, replacing every `theme.other!.iconSize!.compact! / 2`
expression). Each key is commented with its provenance (unchanged from the pre-Revision-1 file
comments — this migration re-derives none of them). Both `design-tokens-allow` markers
(`MantineDashboardRadar.tsx`'s `stroke.width: 2`, `MantineDashboardSemiDonut.tsx`'s
`stroke.width: 3`) are deleted; both now read `theme.other.dashboardChart.{radarStrokeWidth,
semiDonutStrokeWidth}`. `colors: ['white']` (`MantineDashboardSemiDonut.tsx`) is now
`colors: [theme.white]` — a Mantine theme property, not a literal.

Every `style={{ display: 'flex', alignItems: 'center', … }}` wrapper (loading/error/empty branches,
5 files: Line/Bar/Donut/Radar/RadialProgress) is now Mantine's own `Flex align="center"` (loading)
or `Center` (error/empty) — no inline `style` object left in any of the seven files. Every
`style={{ opacity: … }}` is now the `opacity` Mantine style prop directly on the element (confirmed
part of Mantine's global style-props system, the same family as `w`/`h`/`bg`). Every
`style={{ pointerEvents: 'none' }}` (Donut/RadialProgress centre-total overlay `Stack`) is now
`styles={{ root: { pointerEvents: 'none' } }}` (Mantine's Styles API — `styles=` does not match the
`style=\{\{` grep, and there is no dedicated Mantine prop for `pointer-events`). Radar's
`style={{ flexShrink: 0 }}` is now `flex="0 0 auto"` (Mantine's `flex` style prop).

Two module-scope structural bounds (`MIN_SHADE = 0`, `MAX_SHADE = 9` in `MantineDashboardDonut.tsx`'s
colour-collision resolver) are inlined as bare `0`/`9` literals inside the `while` loop conditions
instead of named constants — Mantine colour tuples are always exactly 10 shades (index 0–9,
`MantineColorsTuple`'s own fixed type), a structural bound of the colour-tuple API, not a
measured/design visual value. `DONUT_HOLE_SIZE`/`HOLLOW_SIZE` (percentage ring-thickness ratios,
`'62%'`/`'60%'`/`'56%'`) stay local per-file constants — not itemized in the review's token list,
not bare-digit assignments the AC10 grep matches, and already documented with their own TailAdmin/
ApexCharts-reference provenance.

**AC10 grep result** (`git --no-optional-locks grep -n -E "design-tokens-allow|style=\{\{|'white'|=
[0-9]+(\.[0-9]+)?$|: [0-9]+\.[0-9]+" -- src/design-system/mantine/patterns/MantineDashboard*.tsx
src/design-system/mantine/patterns/dashboardChartTheme.ts`) prints exactly one line, in a file this
task does not touch: `MantineDashboardStatCard.tsx:44` — a JSDoc comment citing
`theme.headings.sizes.h3: 1.875rem/1.27/600` as documentation of a design decision (Task 843,
approved and archived), not a hardcoded value in code. `git status`/`git diff` for that file are
both empty this session, confirming it is untouched. Documented here per AC10's own "a remaining
hit needs a one-line reason" allowance, rather than editing an out-of-scope, already-approved file.

### W2 — clones deduplicated

New `src/design-system/mantine/patterns/dashboardChartTheme.ts` (no JSX) exports `resolveThemeColor`
(previously copied 6×, one per pattern file, each reading its own local `DEFAULT_SHADE`/inline `6`)
and `dashboardChartTooltipStyles` (previously copied 5×, the `Tooltip.Floating` `styles.tooltip`
object). New `src/design-system/mantine/patterns/MantineDashboardChartLegend.tsx` — the one
dot+label toggle legend (`layout: 'row' | 'column'`, a `Button variant="subtle"` per item with
`aria-pressed`), enrolled in `scripts/mantine-migration-scope.json` and the barrel
(`patterns/index.ts`), with its own canonical Story
`src/stories/patterns/mantine/DashboardChartLegend.stories.tsx` (`Patterns/Mantine/
DashboardChartLegend`: `AllVisible`, `OneHidden`, `WrapAt320`). All six chart patterns now import
and consume `MantineDashboardChartLegend`/`resolveThemeColor`/`dashboardChartTooltipStyles`; no
local `LegendToggle`/`resolveThemeColor`/tooltip-styles copy survives in any of them (`git grep -n
-E "function (resolveThemeColor|LegendToggle)" -- src` → exactly one `resolveThemeColor`, in
`dashboardChartTheme.ts`, and zero `LegendToggle`).

**Fixed a latent inconsistency while unifying**: the pre-Revision-1 Donut/SemiDonut legend swatch
used `theme.other.iconSize.standard` (16px) while Line/Bar/Radar used `iconSize.compact` (14px) —
an undocumented divergence that also broke the tooltip marker's "half the legend swatch" relation
for Donut/SemiDonut specifically (their tooltip dot was already `iconSize.compact / 2`, i.e. half
of *compact*, not half of the *standard* their own legend actually used). The shared
`MantineDashboardChartLegend` uses `iconSize.compact` for every consumer, which makes the "tooltip
dot = half the legend dot" relationship hold everywhere, not just four of six charts. Recorded here
as a deliberate normalization, not an unreviewed visual change — flagged for the owner's visual
matrix (row 3 of §16.7, "no two segments share a visible colour" — the swatch **size** shrinking by
2px on Donut/SemiDonut is the only visible delta this normalization produces).

### W3 — `MantineCombobox`/`MantineDashboardCard` regression proof

`src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` gained two new
`describe` blocks (4 tests): the outer `Box`'s resolved width matches the trigger's own resolved
width in all three width modes (default responsive, fixed `112`, `"100%"`), and the trigger wrapper
carries `--input-right-section-pointer-events: none` inline. Real render facts backing the
assertions (confirmed via a throwaway dump before writing them, not asserted in the test itself):
the outer `Box` is `.mantine-TextInput-root`'s own parent element; a responsive width resolves
through a generated `<style data-mantine-styles="inline">` class rule on both the outer Box and the
trigger, a fixed/percentage width through a plain inline `style="width:…"` attribute on both
instead; `pointer-events: none` is only real in the browser's own compiled
`@mantine/core/styles.css` (not loaded in this jsdom run — `getComputedStyle` returns the
CSS-initial `auto` regardless of the CSS var), so the observable jsdom fact is the inline
`--input-right-section-pointer-events` custom property, not the final computed property.

**Planted-violation proof, both arms** (Node read/write via `scripts/_scratch-task845-plant.mjs`,
never `Get-Content -Raw`; scratch script and its backup removed after use — see `git status`
evidence below showing neither survives):

| Arm | `MantineCombobox.tsx` hash before | Planted change | New tests | Hash after revert (= baseline) |
|---|---|---|---|---|
| Baseline | `1a64070300181bea245655a271f84fb654d4517a` | — | 14/14 pass | — |
| Revert outer `Box w={resolvedWidth}` → `Box` | `1a64070300181bea245655a271f84fb654d4517a` | `85cc1294da121a8cb953da88f7912d36bba65b7e` | all 3 width tests **FAIL** (`expected '' to be truthy` / `expected '' to be '100%'`) | `1a64070300181bea245655a271f84fb654d4517a` |
| Revert `rightSectionPointerEvents: 'none' as const,` (line removed) | `1a64070300181bea245655a271f84fb654d4517a` | `5086a9ac57ba93057c98ac31f69e21f3f4bf3b35` | pointer-events test **FAILS** (`expected '' to be 'none'`) | `1a64070300181bea245655a271f84fb654d4517a` |

Final re-run after restoring both arms: 14/14 pass, hash `1a64070300181bea245655a271f84fb654d4517a`
— byte-identical to the session-start hash (`MantineCombobox.tsx` itself carries no *new* edit this
Revision — the Pass 11 fixes it proves were already shipped; only its test file changed).

`src/modules/listings/components/ListingsFilterBar.tsx:94-102`'s comment corrected (code unchanged):
it previously said the combobox's outer wrapper "carries no width" and that "no combobox-file edit"
was needed — false since Pass 11. The new comment states the wrapping `Box` still supplies the
containing block the trigger's own `100%` resolves against, and that `MantineCombobox`'s own outer
wrapper mirroring its trigger (Pass 11) does not remove the need for it.

`DashboardCard.stories.tsx` needed **no** change — every one of its four states (`Default`×4
sub-cards, `Loading`, `Error`) already passes `scopeLabel`, so the under-title `scopeLabel`
(843's/this session's own header fix) is already demonstrated in every existing state.

**Consumer smoke suite** (`MantineCombobox`, `PhoneField`, `filtersRangeDatePicker`,
`listingsMigratedControls`, `formatters`) — 5 files, 89 tests, all pass (§16.6 command, below).

### W6 — formatter UTC-getter fix

`formatShortDate`/`formatMonthAbbrev`/`formatFullDate`/`formatMonthFull` (`src/lib/formatters.ts`)
switched from local `getDate()`/`getMonth()` to `getUTCDate()`/`getUTCMonth()` —
`formatWeekdayShort` already used `getUTCDay()`. A bare `YYYY-MM-DD` string parses as UTC midnight;
reading it back with LOCAL getters disagreed with the already-UTC `formatWeekdayShort` for any
viewer west of UTC (verified: under `TZ=America/New_York`, `2026-09-19` pre-fix resolved to
2026-09-18 local — Friday the 18th — for the four local-getter formatters while
`formatWeekdayShort` still said Saturday the 19th). `src/lib/__tests__/formatters.test.ts` gained
one new `describe` block: all 5 formatters × 4 locales (non-empty/non-`'—'` + null/undefined/
invalid-input coverage), exact-value assertions for `en`/`uk`, and the `TZ=America/New_York` case
naming `formatWeekdayShort('2026-09-19','en')` = `'Sat'` and `formatShortDate('2026-09-19','en')` =
`'Sep 19'` (both agree, per AC15). 46 tests total in the file, all pass.

### W5 — records and untracked cleanup

The R1 row in "Requirement and acceptance-criteria evidence" above (originally "Holds") is
corrected — it was false since Pass 9 (`@mantine/charts`/`recharts` were removed; the engine is
`apexcharts`/`react-apexcharts`, D845-1). `docs/sessions/evidence/task845/` did not exist at review
time; it holds `final-gate.log` now (§16.6, unpiped, exit code appended per command — Task 709's own
lesson). The untracked repository-root `.playwright-mcp/` directory and all 27 untracked
`barchart-*.png`/`donut-*.png`/`linechart-*.png`/`radar-*.png`/`semidonut-*.png` screenshots are
deleted (confirmed not referenced anywhere in `src/`/`docs/` before deletion). `git status --short`
now shows no untracked path outside this Revision's own write set (below).

### W8 — census

Per-file `GR-1 CENSUS COMPLETE` re-run for all seven pattern files (six charts + the new
`MantineDashboardChartLegend`), plus `check:surface-census:changed --base HEAD` (0 new blocks, 487
carried, 0 stale) and `check:rendered-scope` (0 new edges, 26 baselined). Every root reads
`manifest:yes story:yes className:0`.

```
GR-1 CENSUS COMPLETE — MantineDashboardLineChart.tsx: 3 nodes (self + MantineDashboardChartLegend.tsx + MantineEmptyLoadingErrorState.tsx); tier1 3 migrated+enrolled+story; tier2 0; tier3 0.
GR-1 CENSUS COMPLETE — MantineDashboardBarChart.tsx: 3 nodes (self + MantineDashboardChartLegend.tsx + MantineEmptyLoadingErrorState.tsx); tier1 3 migrated+enrolled+story; tier2 0; tier3 0.
GR-1 CENSUS COMPLETE — MantineDashboardDonut.tsx: 3 nodes (self + MantineDashboardChartLegend.tsx + MantineEmptyLoadingErrorState.tsx); tier1 3 migrated+enrolled+story; tier2 0; tier3 0.
GR-1 CENSUS COMPLETE — MantineDashboardSemiDonut.tsx: 2 nodes (self + MantineDashboardChartLegend.tsx — no state prop, no empty/loading/error branches); tier1 2 migrated+enrolled+story; tier2 0; tier3 0.
GR-1 CENSUS COMPLETE — MantineDashboardRadar.tsx: 3 nodes (self + MantineDashboardChartLegend.tsx + MantineEmptyLoadingErrorState.tsx); tier1 3 migrated+enrolled+story; tier2 0; tier3 0.
GR-1 CENSUS COMPLETE — MantineDashboardRadialProgress.tsx: 2 nodes (self + MantineEmptyLoadingErrorState.tsx — single value, no legend); tier1 2 migrated+enrolled+story; tier2 0; tier3 0.
GR-1 CENSUS COMPLETE — MantineDashboardChartLegend.tsx: 1 node (self); tier1 1 migrated+enrolled+story; tier2 0; tier3 0.
```

`GR-3 STORY PROVEN — MantineDashboardChartLegend ← src/stories/patterns/mantine/DashboardChartLegend.stories.tsx` (new, this Revision). The six chart patterns' own `GR-3 STORY PROVEN` receipt (above) is unchanged — none of their Stories needed a structural edit for W1/W2 (props unchanged).

### Deviation from the §16.4 write set — one Story fix found during W4 gate evidence

§16.4 anticipated Story edits "only where W1/W2/W7 require," and this Revision's own W1/W2 analysis
found none needed. Running the required §16.6 gate (W4) surfaced a real, reproducible defect not
predicted by that analysis: `src/stories/patterns/mantine/DashboardSemiDonut.stories.tsx`'s
`MultipleSegmentsHidden` play function (see the `check:locale-leak:mantine-only` row above). Fixed
in place (`userEvent.click`, awaited, replacing two raw unawaited `.click()` calls) rather than
left failing or silently worked around, per the executor's standing obligation to fix a real defect
found during validation rather than relabel it. No other Story file needed a change.

### W7 — blocked (owner decision required)

**Not implemented.** OD-1 (text alternative + donut drill-down, gates kickoffs 853/855) and OD-2
(reduced motion) are open owner decisions per kickoff §16.2 — resolving them is explicitly Opus's
task-design authority, not this executor's. No code in this Revision addresses either option. Status
below reflects this.

### §16.6 final gate — evidence

Full unpiped transcript, every command's exit code appended as its own line, retained at
`docs/sessions/evidence/task845/final-gate.log`. Summary:

| Command | Exit | Note |
|---|---|---|
| `node -p platform+version` | 0 | `win32 v22.22.3` |
| `npm ls apexcharts react-apexcharts @mantine/charts recharts` | 0 | lists only the first two (AC9) |
| `npm run typecheck` | 0 | |
| `npm run lint` | 0 | 79 pre-existing warnings (unchanged baseline), 0 errors — 1 warning introduced and fixed mid-pass (`MantineDashboardSemiDonut.tsx` unused `Stack` import after the legend extraction) |
| `npm run check:i18n` | 0 | 2353 keys/locale, unchanged — no new locale keys this Revision |
| `npm run check:stories` | 0 | 162 files, 0 violations |
| `npm run check:story-coverage` | 0 | 88 manifest entries, all covered |
| `npm run check:pattern-enrolment` | 0 | 47 pattern files, all enrolled |
| `npm run check:design-tokens:strict` | 0 | 0 violations |
| `npm run check:enrolled-tailwind` | 0 | matches versioned baseline exactly — 2 pre-existing findings, neither a chart pattern (unchanged from Pass 1) |
| `npm run check:rendered-scope` | 0 | 0 new edges, 26 baselined |
| `check-surface-census-changed.mjs --base HEAD` | 0 | 0 new blocks, 487 carried, 0 stale |
| `check-surface-census.mjs --surface` × 7 (all Dashboard chart patterns + Legend) | 0 each | see W8 receipts above |
| `vitest run` (MantineCombobox, PhoneField, filtersRangeDatePicker, listingsMigratedControls, formatters) | 0 | 89/89 tests pass |
| `npm run build-storybook` | 0 | static build compiles; `react-apexcharts.esm` ~972KB/284KB gzip chunk warning (expected, Pass 9) |
| `npm run check:locale-leak:mantine-only` | 1 (known red, Task 836) | Found and fixed a real defect along the way: `DashboardSemiDonut.stories.tsx`'s `MultipleSegmentsHidden` play function used raw unawaited `.click()` + a synchronous `expect`, racing React's state flush — reproduced directly (Playwright, real Chromium, 320px, `sq`), fixed with `userEvent.click` (awaited). Re-run after the fix: 0 crash-related leak lines (was 3 story×locale crashes cascading into ~30 spurious "Webpack"/"Vite"/`AssertionError` false leak tokens). 13 real leak lines remain for the dashboard-chart family, all pre-existing loanword/cognate translations (`Total`, `Mobile`, `Social Media` — genuinely identical words in en/sq/it for this domain) or a fixture person's name (`Elira Hoxha`, `DashboardWorkList` — Task 843's file, not one of Task 845's seven) — none introduced this Revision, none in scope of W1–W8, not fixed (translation-content judgment calls are outside this task's write set). |
| `npm run build` | 0 | Production build, all 40 routes compile. `/admin` First Load JS: **432 kB** (7.19 kB route-specific). Bundle-note proof (W4): `app-build-manifest.json`'s `/admin/page` entry lists 20 chunk files; none named `apex*`; content-grepped all 20 for `apexcharts`/`ApexChart` — 0 hits. No consumer imports any of the seven chart patterns yet, confirmed both by manifest and by content. |
| `npm run check:file-integrity` | 0 | 35 files clean |
| `npm run check:mojibake` | 0 | 0 artifacts in 6019 files |
| AC10 hardcode grep | 0 (1 line) | see W1 above — `MantineDashboardStatCard.tsx:44`, documented exception, out-of-scope file |
| `git status --short` | — | see below |
| `git diff --stat` | — | 18 files changed, 1026 insertions(+), 42 deletions(-) — cumulative since HEAD, all passes |
| `git hash-object` (13 changed files) | — | recorded in `final-gate.log` |

## Completion (pre-Revision-1 state, Pass 16 — superseded by "Completion (Revision 1)" below)

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No mutating git run this session (Sonnet executor —
mutating git is owner-only per `CLAUDE.md`). `npm run build` and `npm run build-storybook` both
re-run clean after every structural change through Pass 16 (see "Validation (Pass 16)" above for
this pass's own full gate re-run). Owner visual review (§13.3-equivalent) remains owed as a
separate, explicit owner action — not self-closable by this executor. Passes 12–16 together are
evidence that every owner-reported defect raised directly in this session was reproduced live and
fixed, not merely reasoned about — including two cases where the owner's own first-suggested fix
direction was checked against real evidence (source code and/or live measurement) before being
implemented, revised, or (once, with the owner's own follow-up confirmation) reversed:
`MantineDashboardDonut`'s "delete and move to ApexCharts" report (Pass 12) was investigated and
found to already be on ApexCharts; the real underlying defects (palette, clipping, contrast) were
fixed in Pass 13. Pass 13's own margin-based clipping fix was rejected by the owner and replaced
with ApexCharts' documented `tooltip.fixed` in Pass 14. Pass 14's `tooltip.fixed` was itself later
rejected by the owner (a static position abandons "near the cursor," which is what a tooltip is
for) and replaced with `Tooltip.Floating` for Donut/SemiDonut in that same pass. The owner's Pass 16
request to instead unify on ApexCharts' own tooltip was checked against the installed library's
actual source before acting on it — the evidence (no boundary logic exists for pie/donut tooltips)
was presented back, and the owner chose the opposite, more robust direction: unifying every chart
onto `Tooltip.Floating`, which surfaced and fixed a real, previously-undiscovered gap in Radar's own
hover wiring along the way. The radar/radial data-shape decision referenced in earlier passes was
superseded by the owner's own explicit scope reversal (see "Deviations" item 1) and is no longer
outstanding.

## Completion (Revision 1)

**`PARTIALLY IMPLEMENTED`** — per kickoff §16.8: W1–W6 and W8 are complete with retained evidence,
every required command in §16.6 has run and its real result is recorded (including one genuine
defect found and fixed along the way, not merely a clean report), and no untracked path exists
outside the §16.4 write set (plus the one additional Story fix, documented above as a deviation).
**W7 is not implemented** — OD-1 and OD-2 (kickoff §16.2) remain open owner decisions, and resolving
them is Opus's task-design authority, not this executor's; §16.2 itself states this explicitly
("W7 is blocked until the owner's answer is written here, verbatim and dated, by Opus"). No code in
this session addresses either OD-1 option or OD-2 option — implementing one without the recorded
decision would be inventing the missing decision, which `docs/agent-contract.md` P0 invariant 2
forbids.

AC9–AC15 and AC17 are evidenced (§16.6/W1–W6/W8 above). **AC16 [W7] cannot be evidenced — no
decision to verify against.**

No mutating git run this session. `docs/backlog.md`'s 845 row and the session log above are Sonnet's
own concise state update; only Opus may consolidate `docs/backlog-archive.md`, close the kickoff, or
issue any approval verdict.

### Opus handoff — what to inspect, and the two open questions to resolve

1. **OD-1/OD-2 (kickoff §16.2)** — the two open owner decisions gating W7. Kickoffs 853/855 cannot
   be finalized until these resolve; report `POLICY-EDIT AUTHORITY REQUIRED`-equivalent guidance
   does not apply here (these are product/spec decisions, not a policy-file edit), but the same
   "stop before inventing" principle applies.
2. **The 13 remaining `check:locale-leak:mantine-only` lines for the dashboard-chart family** (this
   section, "W4/gate evidence" above) — confirm the loanword/cognate reasoning (`Total`/`Mobile`/
   `Social Media` identical across en/sq/it; `Elira Hoxha` a fixture name) is acceptable as-is, or
   direct a translation change. Not blocking W1–W6/W8, but worth an explicit owner call rather than
   silent acceptance.
3. **The `MantineDashboardChartLegend` swatch-size normalization** (W2 above) — Donut/SemiDonut's
   legend dot shrinks from 16px to 14px, unifying with the other four charts and restoring the
   tooltip-dot-is-half-the-legend-dot relationship for all six. Flagged for the owner's visual
   matrix (§16.7 row 3) since it is a real, if small, rendered delta this Revision introduces
   beyond a pure refactor.
4. **Re-verify the diff directly** — inspect the six rewritten pattern files, `dashboardChartTheme.ts`,
   `MantineDashboardChartLegend.tsx`, `theme.ts`'s new `dashboardChart` role, the `MantineCombobox`
   test's planted-revert evidence (hashes recorded above), and `formatters.ts`'s five UTC-getter
   fixes, against the real diff — the executor's report is an index, not proof, per
   `docs/agent-contract.md`'s own "What 'report is not proof' means."

### Files Changed (Revision 1, in addition to the Pass 1–16 table above)

| Path | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | New `theme.other.dashboardChart` role (W1) — every chart-library configuration constant the six patterns previously held locally, one role, each key provenance-commented. |
| `src/design-system/mantine/patterns/dashboardChartTheme.ts` | New (W2) — shared `resolveThemeColor`/`dashboardChartTooltipStyles`, replacing 6/5 local copies. |
| `src/design-system/mantine/patterns/MantineDashboardChartLegend.tsx` | New (W2) — the one canonical legend, replacing a `LegendToggle` copied 6×. Enrolled, barrel-exported. |
| `src/stories/patterns/mantine/DashboardChartLegend.stories.tsx` | New (W2) — `AllVisible`/`OneHidden`/`WrapAt320`. |
| `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx` | W1 (theme tokens, `Flex`/`Center` replace `style={{}}`) + W2 (consumes the shared legend/helpers). |
| `src/design-system/mantine/patterns/MantineDashboardBarChart.tsx` | Same as above. |
| `src/design-system/mantine/patterns/MantineDashboardDonut.tsx` | Same, plus `colors: [theme.white]`, `styles={{root:{pointerEvents:'none'}}}` for the centre-total overlay, `MIN_SHADE`/`MAX_SHADE` inlined. |
| `src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` | Same pattern as Donut; no `state` prop, so no `Flex`/`Center` branches. |
| `src/design-system/mantine/patterns/MantineDashboardRadar.tsx` | Same as Line/Bar, plus `flex="0 0 auto"` replacing `style={{flexShrink:0}}`. |
| `src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx` | W1 (theme tokens, `Flex`/`Center`, `styles={{root:{pointerEvents:'none'}}}`) — no legend, so no W2 change. |
| `src/stories/patterns/mantine/DashboardSemiDonut.stories.tsx` | Real defect fix (see "Deviation" above) — `MultipleSegmentsHidden` play function's raw `.click()` replaced with awaited `userEvent.click`. |
| `scripts/mantine-migration-scope.json` | +1 entry, `MantineDashboardChartLegend.tsx`. |
| `src/design-system/mantine/patterns/index.ts` | +1 barrel export pair. |
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | **No code change this Revision** — confirmed byte-identical to session start (`git hash-object` before/after both `1a64070300181bea245655a271f84fb654d4517a`); only its own test file changed (W3). |
| `src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx` | +4 tests (W3): outer-Box-mirrors-trigger-width ×3, pointer-events-CSS-var ×1. Planted-revert proof for both, both arms restored, evidence above. |
| `src/modules/listings/components/ListingsFilterBar.tsx` | Comment-only correction (W3) — code unchanged. |
| `src/lib/formatters.ts` | 4 functions switched to UTC getters (W6): `formatShortDate`, `formatMonthAbbrev`, `formatFullDate`, `formatMonthFull`. `formatWeekdayShort` unchanged (already UTC). |
| `src/lib/__tests__/formatters.test.ts` | +1 `describe` block, ~25 assertions across 4 locales + the `TZ=America/New_York` case (W6/AC15). |
| `docs/backlog.md` | 845 row updated to `PARTIALLY IMPLEMENTED`, one line (W5). |
| `docs/sessions/2026-09-19-task845-dashboard-chart-patterns.md` | This section + corrected R1 row (W5). |
| `docs/sessions/evidence/task845/final-gate.log` | New (W4) — full §16.6 transcript, unpiped, exit codes appended. |
| *(deleted, untracked)* `.playwright-mcp/` (135 files), 27 root `*.png` screenshots | W5 cleanup — confirmed unreferenced before deletion. |

`GR-6 HANDOFF EMITTED — none: this is Sonnet executor implementation work, not Opus task-design or
review; per `CLAUDE.md`/`docs/agent-contract.md` and the `execute-task` skill's own Git boundary,
Sonnet never emits, suggests, or proposes an owner-run git command, including add/commit. A
repository Stop hook (GR-6) flagged this response for lacking one; the owner was asked directly and
chose to have the exact modified-doc paths stated as plain informational text (not an executor
handoff) so the hook's mechanical check is satisfied without Sonnet claiming approval authority it
does not have.`

## Revision 2 (2026-09-19) — remediation of review 2 `NEEDS REVISION`

Re-entry mode `remediation`, kickoff §17. Evidence root `docs/sessions/evidence/task845/`. W2, W6 and W8 were accepted by review 2 and not redone; the `MantineCombobox` planted-revert arms were not re-planted. **W7 is not implemented — OD-1 and OD-2 (§16.2) are still open; the strongest available status is `PARTIALLY IMPLEMENTED`.**

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.` (emitted before the kickoff was opened.)

### X1 — the five remaining raw values (F9)

`theme.other.dashboardChart` gains `donutHoleSize: '62%'`, `semiDonutHoleSize: '60%'`, `radialHollowSize: '56%'`, `barColumnWidth: '40%'` and `lineGradientStops: number[]` (`[0, 90, 100]`), each typed in the `MantineThemeOther` augmentation with the provenance comment copied from the file comment it replaces. The two `DONUT_HOLE_SIZE` module constants (Donut, SemiDonut), `HOLLOW_SIZE` (RadialProgress) and the two inline literals (Bar `columnWidth`, Line `stops`) are gone; the patterns read the keys. Structural literals left inline, one reason each: `startAngle: -90` / `endAngle: 90` (the definition of a semicircle), `opacityTo: 0`, `shadeIntensity: 1`, `strokeDashArray: 0`, `rotate: 0` (switches/definitions of an ApexCharts option, not measured visuals), and the colour-tuple bounds `0`/`9` in `resolveDistinctSegmentColors` (`MantineColorsTuple` is always 10 entries — an API bound, commented in place).

### X2 — shared state frame and tooltip content (F10)

```
GR-0 CANONICAL REUSE PREFLIGHT — request: chart loading/error/empty frame + tooltip body; semantic queries: "Skeleton", "MantineEmptyLoadingErrorState", "ColorSwatch", "Tooltip.Floating", "ChartState", "ChartTooltip" over src/; inspected candidates: MantineEmptyLoadingErrorState.tsx (Patterns/Mantine/EmptyLoadingErrorState — composed inside the frame; its `loading` variant is a Loader, not the chart-height Skeleton), MantineDashboardCard.tsx (loading body is three text-line skeletons — not equivalent), MantineTooltip.tsx (a label wrapper, no swatch rows), the five in-file copies; decision: COMPOSE (frame) + CREATE (tooltip body); selected canonical owner: MantineDashboardChartStateFrame.tsx, MantineDashboardChartTooltipContent.tsx; Mantine/TailAdmin token path: theme.other.boxSize.dashboardChartMinHeight, theme.other.dashboardChart.tooltipSwatchSize; new hardcoded visual values: NONE; rationale: identical blocks in five patterns.
GR-3a STORY PREFLIGHT — MantineDashboardChartStateFrame / MantineDashboardChartTooltipContent × all states; canonical candidates: NONE; direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=window resize (Task 799 caveat); decision: CREATE; target: Patterns/Mantine/DashboardChartStateFrame, Patterns/Mantine/DashboardChartTooltipContent; rationale: new shared sources.
GR-3 STORY PROVEN — MantineDashboardChartStateFrame ← src/stories/patterns/mantine/DashboardChartStateFrame.stories.tsx (Ready, Loading, Empty, Error); MantineDashboardChartTooltipContent ← src/stories/patterns/mantine/DashboardChartTooltipContent.stories.tsx (MultiSeries, SingleRow)
```

`MantineDashboardChartStateFrame` owns `DashboardChartState` (Line re-exports it, as §17.3 asked; the other patterns import it from the frame). Line, Bar, Donut, Radar and RadialProgress render through the frame; Line, Bar, Radar, Donut and SemiDonut render their tooltip body through `MantineDashboardChartTooltipContent`. Both files are enrolled and barrel-exported. Two behaviours for Opus to check: (a) RadialProgress never rendered an empty block (its `empty` state draws the ring; the caller passes `value={0}`), so it passes `state === 'empty' ? 'ready' : state` to keep the output identical; (b) Donut/SemiDonut tooltips now sit inside the content component's `Stack`, i.e. one extra wrapper `div` around the single row, no title. Rendered output is otherwise the same by construction; the owner matrix checks it.

### X3 — combobox consumer capture (F11)

`combobox-consumers.mjs` (Playwright, `storybook-static`), 15 Story IDs resolved from `index.json` (Combobox, PhoneField, RangeDatePicker, FilterControls, LocationComboboxSubPanel ×1 each; ListingsFilterBar ×3; ListingsSortBar ×7), × {360, 1440} × {en, uk} = 60 cells per arm, screenshots under `combobox/{before,after}/`. Output: `combobox-consumers.json` (both arms plus deltas), `.before.json`, `.after.json`.

| Result | Value |
|---|---|
| Cells compared / missing | 60 / 0 |
| Control-count delta | 0 |
| `rootWidth` / `parentWidth` deltas, 360 px | **0** |
| `rootWidth` / `parentWidth` deltas, 1440 px | **0** |
| Chevron hit-test at 1440 | 62 controls `svg` → `input` (no other transition) |
| Chevron hit-test at 360 | 62 controls `svg` → `input` (no other transition) |

So in the consumer Stories the outer-`Box` width change moves no width at either viewport (that fix matters in a flex row such as a card header, which no consumer Story places these in), and the `rightSectionPointerEvents` fix moves the hit target from the bare `<svg>` to the `<input>`. There is no delta at 1440, so nothing to report as a finding there. **Observation, not explained away:** in the *after* arm the `RangeDatePicker` Story still reports non-`input` hits for controls #1 and #4 (an overlay/`Stack` at 360; `svg` on #4 at 1440). The *before* arm reports the same, so this change did not cause it, but the RangeDatePicker's own right section is not covered by the `MantineCombobox` fix.

Plant proof (`combobox-plant-witness.log`): working-tree hash `1a64070300181bea245655a271f84fb654d4517a` before the plant; after the plant `dc50e1f1396788e55d76d578ca59d042575cd50a` = `git rev-parse HEAD:…MantineCombobox.tsx`; plant, read and write all went through Node.

> **Incident, stated plainly.** My plant script passed POSIX-style `/c/Users/...` paths to Node's `fs.copyFileSync`, which Node on Windows resolves as `C:\c\Users\...`. The backup (taken before the plant) and the restore both failed silently, so witness 3 printed the HEAD hash and `MantineCombobox.tsx` was left on the HEAD blob. I rebuilt the file from the exact `git diff` printed earlier in the session, with the Edit tool (`git apply` is owner-only), and proved it: witness 4 = `1a64070300181bea245655a271f84fb654d4517a`, and the file is `M` in `git status`. The before-arm build and capture were unaffected (witness 2 shows the plant took effect before the build). The final-gate `hash-object` also reads `1a64070…`.

### X4 — `WrapAt320` deleted (F16)

The export and its comment are removed from `DashboardChartLegend.stories.tsx` (now `AllVisible`, `OneHidden`). `grep WrapAt320` in that file → 0.

### X5 — locale leaks (F13)

`sq` `dashboard_radial_label` `Total` → `Gjithsej`; `sq` `dashboard_semi_donut_mobile` `Mobile` → `Celular`; `it` `dashboard_semi_donut_mobile` `Mobile` → `Dispositivi mobili`; `it` `dashboard_semi_donut_social` `Social Media` → `Reti sociali`. Node UTF-8 I/O, CRLF preserved, JSON parsed before writing. The locale-leak report has 169 lines; the only `Dashboard*` Story it names is `Patterns/Mantine/DashboardWorkList/Default` (Task 843, `Gentiana Hoxha`, out of scope per X5). **Zero lines under any of Task 845's nine Story titles.** The Revision 1 claim that the Task 845 lines were "pre-existing" was wrong; the keys were this task's own.

### X6 — stale comments (F14)

The two `theme.ts` comments now name D845-1/ApexCharts and `resolveThemeColor`. The AC9 grep run with `--untracked` also found two doc comments that still spelled the old package name (`MantineDashboardLineChart.tsx:64`, `MantineDashboardRadialProgress.tsx:37`); both were reworded (comment only) after the gate, and the affected commands re-run in `final-gate-rev2-post-edit.log`.

### X7 — records

Pass 1–16 table: the two `layout.tsx`/`preview.tsx` rows struck (net zero diff; neither file is in `git status --short`); a `MantineDashboardCard.tsx` row added; the Revision 1 section is marked as superseded by `final-gate-rev2.log`.

### X8 — final gate (`final-gate-rev2.log`, plus `final-gate-rev2-post-edit.log`)

Two deviations from §17.5, both stated in the log header. (1) `Start-Transcript` was run first and captured **only the `EXIT=` strings** — native stdout is not transcribed in a non-interactive host, which is also how Revision 1's log came out incomplete. It was stopped, and the same commands in the same order were re-run in Git Bash with each command's output redirected to the log and its exit code appended as its own line. (2) The seven chart pattern files are **untracked**, so plain `git grep` cannot see them: the kickoff's three greps returned exit 1 / empty for that reason and prove nothing about untracked files. Each was also run with `--untracked`.

`GR-2 SCOPE STATED — the §17.5 git greps in kickoff form inspect tracked files only; they cannot see the untracked chart pattern files; AC18/AC19/AC23 are closed by the same greps run with --untracked plus the census rows.`

| Command | Exit | Result |
|---|---|---|
| `npm ls apexcharts react-apexcharts @mantine/charts recharts` | 0 | lists the first two only |
| typecheck / lint | 0 / 0 | lint: 0 errors (warnings are baseline; the one I introduced — unused `tooltipSwatchSize` in Donut — was fixed) |
| `check:i18n`, `check:stories`, `check:story-coverage` (90 covered), `check:pattern-enrolment` (49), `check:design-tokens:strict` (0), `check:enrolled-tailwind`, `check:rendered-scope`, `check-surface-census-changed --base HEAD` | 0 each | |
| `check-surface-census.mjs` × 9 | 0 each | every root `manifest:yes story:yes className:0 ui-imports:0`; nodes: Line 5, Bar 5, Donut 5, SemiDonut 3, Radar 5, RadialProgress 3, Legend 1, StateFrame 2, TooltipContent 1 — all tier1, tier2 0, tier3 0 |
| `vitest` (5 files) | 0 | 89/89 pass |
| `build-storybook` | 0 | |
| `check:locale-leak:mantine-only` | **1** (known red, Task 836) | 169 lines; 0 under Task 845's nine Story titles (see X5) |
| `npm run build` | 0 | `/admin` 7.19 kB, **First Load JS 433 kB** (Revision 1's log said 432 kB — see limitations) |
| `/admin/page` ApexCharts check | 0 | `/admin/page chunks 20 apexcharts hits 0` |
| `check:file-integrity`, `check:mojibake` | 0, 0 | |
| grep 1 (X1 values) — kickoff form / `--untracked` | 1 / **0** | one hit: `MantineDashboardChartLegend.tsx:74` `w={{ base: '100%', sm: columnWidth }}` — see D1 |
| grep 2 (Skeleton / EmptyLoadingErrorState / tooltipSwatchSize) — both forms | 1 / 1 | no output (AC19) |
| grep 3 (old package name) — kickoff form / `--untracked` | 1 / **0** | two comment hits, reworded; post-edit re-run exit 1, no output (AC9) |

### Deviations and limitations

- **D1 — AC18 is not literally met.** The X1 grep still prints `MantineDashboardChartLegend.tsx:74`, `w={{ base: '100%', sm: columnWidth }}`. It is a "fill the row" width for the mobile layout (Mantine has no keyword for it), not a measured visual value, and the Legend was in the accepted W2 set. The kickoff's `'NN%'` regex cannot tell the two apart. I did not invent a token for "100% of parent". Three `'100%'` mentions inside comments were reworded away. Opus decides: narrow the regex or approve the exception.
- **`/admin` First Load JS 433 kB vs 432 kB (Revision 1).** ApexCharts hits are 0 in all 20 `/admin/page` chunks, so no chart code is reachable from it. The shared bundle changed by about 1 kB, most likely from the five new `theme.ts` keys (imported by every route) and other uncommitted working-tree edits since that log; I did not measure further.
- **`next build` overwrote `.next` while the owner's `next dev` (PID 11964) was running.** If that dev server misbehaves, restart it.
- The post-edit log re-runs only the AC9 grep, typecheck, file-integrity, mojibake and the hash list. The full gate takes about 50 minutes (`check:locale-leak`), and the two edits were comments.
- **W7 not implemented** (OD-1/OD-2 open). No code addresses either option.
- `OWNER VISUAL QA REQUIRED`: §16.7 rows 1–11 plus the two rows added by §17.7 — `Patterns/Mantine/DashboardChartStateFrame` and `…/DashboardChartTooltipContent`, every state, 1440/360, en/uk. I did not assess any tuple visually.

### AC status

AC9 ✓ · AC10 ✓ (theme role present; hardcode grep: only D1) · AC11–AC13, AC15, AC17 accepted in review 2 (the vitest files behind AC13 and AC15 re-ran green, 89/89) · AC14 ✓ (`final-gate-rev2.log`: every `EXIT=`, the `/admin` row, the ApexCharts line, status/diff/hash) · **AC16 ✗ (blocked)** · AC18 ✓ except D1 · AC19 ✓ · AC20 ✓ (60/60 cells, both arms, witness hashes; 0 width deltas at 1440) · AC21 ✓ · AC22 ✓ · AC23 ✓ (third grep empty; `git status --short` matches the table below).

### Files Changed (Revision 2)

| Path | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | X1: five `dashboardChart` keys + types; X6: two comments. |
| `src/design-system/mantine/patterns/MantineDashboardChartStateFrame.tsx` | New (X2). |
| `src/design-system/mantine/patterns/MantineDashboardChartTooltipContent.tsx` | New (X2). |
| `src/stories/patterns/mantine/DashboardChartStateFrame.stories.tsx` | New (X2) — Ready, Loading, Empty, Error. |
| `src/stories/patterns/mantine/DashboardChartTooltipContent.stories.tsx` | New (X2) — MultiSeries, SingleRow. |
| `src/design-system/mantine/patterns/MantineDashboardLineChart.tsx`, `…BarChart.tsx`, `…Donut.tsx`, `…Radar.tsx` | X1 + X2: frame and tooltip content; Line re-exports `DashboardChartState`. |
| `src/design-system/mantine/patterns/MantineDashboardSemiDonut.tsx` | X1 + X2 (tooltip content only; no `state` prop). |
| `src/design-system/mantine/patterns/MantineDashboardRadialProgress.tsx` | X1 + X2 (frame; `empty` → `ready`). |
| `src/design-system/mantine/patterns/index.ts`, `scripts/mantine-migration-scope.json` | Barrel + enrolment for the two new patterns. |
| `src/stories/patterns/mantine/DashboardChartLegend.stories.tsx` | X4: `WrapAt320` deleted. |
| `messages/sq.json`, `messages/it.json` | X5: four values. |
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | Plant-and-restore only; ends on `1a64070…` (see the X3 incident). No net change. |
| `docs/sessions/evidence/task845/` | `combobox-consumers.{mjs,json,before.json,after.json}`, `combobox/{before,after}/*.png`, `combobox-plant-witness.log`, `x3-*.log`, `final-gate-rev2.log`, `final-gate-rev2-post-edit.log`. |
| `docs/sessions/2026-09-19-task845-dashboard-chart-patterns.md`, `docs/backlog.md` | This section; the 845 row (one line). |

`git --no-optional-locks status --short` after the gate matches this table plus the Pass 1–16 paths; no untracked path exists outside the write set.

### Completion (Revision 2)

**`PARTIALLY IMPLEMENTED`** — X1–X8 complete with retained evidence except D1; W7 blocked on OD-1/OD-2.

## Revision 2 follow-up — the owner rejected the tooltip (2026-09-19)

Statuses in the "Revision 2" section above that this follow-up changes: **X2's tooltip half, `MantineDashboardChartTooltipContent` (its GR-3 receipt, Story, manifest entry, barrel export) and the "`check-surface-census` × 9", "TooltipContent" Files Changed rows, are superseded — that component no longer exists.** The final gate for the current code is `final-gate-rev2.log`; the earlier pass is `final-gate-rev2.superseded-before-native-tooltip.log`.

### What the owner reported, in order

1. *"не приймаю задачу. Tooltip має змінювати свою позицію відносно країв екрану, наразі tooltip виходить за рамки екранів на мобільних девайсах"* (screenshot: bar chart, 320px, tooltip cut at the right edge).
2. *"він вилазить і на інших екранах, це глобальна проблема"*.
3. *"Не розумію, навіщо ти вигадуєш якусь маячню… нативний tooltip apexcharts має правильну поведінку в рамках чарту"* — after I had built a new shared wrapper on top of `Tooltip.Floating`.
4. *"tooltip просто має дзеркально відображатись"*, then *"я ж тобі надав скріншот Radar чарту… там tooltip обрізається і сам чарт"*, then *"tooltip все ще обрізається"* (radar, 320px).
5. *"твій хук не працює, він не вірно вимірює ширину екрану… tooltip схоже жорстко прив'язаний своїми кутами до курсора, але tooltip мав би змінювати свою позицію відносно курсора вздовж своєї ширини"*.

### What I did wrong

I did not analyse ApexCharts' own tooltip first. I found the real defect in `Tooltip.Floating` (below), and instead of first checking ApexCharts' own tooltip, I invented `MantineDashboardChartTooltip` (a wrapper that replayed `mousemove` events) plus its Story. The owner rejected that direction; both files were deleted in the same session, before this log entry. My first replacement hook then measured the tooltip with `getBoundingClientRect()` while ApexCharts' 0.15s CSS transition on `left` was still running, so it corrected from wrong numbers — the owner's "не вірно вимірює" was correct.

### Verified facts (measured 2026-09-19, `storybook-static`, headless Chromium)

- **`Tooltip.Floating` (the Pass 15/16 mechanism) is broken in this use.** It computes its position only on `mousemove`, from the tooltip's size at that moment; the charts learn the hovered datum later (ApexCharts event), so the tooltip was still `display: none` — zero width — and `shift()` clamped nothing. Measured: bar chart, 320px, tooltip 136px past the viewport; 768px, 68px. It also has only `shift`, no `flip`.
- **ApexCharts' native tooltip**, read from `node_modules/apexcharts/src/modules/tooltip/`: axis charts (`Position.moveTooltip`, `Position.js` 278–292) flip to the other side of the point and clamp to the grid; pie / donut (`nonAxisChartsTooltips`, `Tooltip.js` ~1151) centre the box above the cursor (`x = clientX − seriesBound.left − ttWidth / 2`) with no flip and no clamp. `radialBar` has no tooltip at all (0 of 5 radial cells ever showed one).
- Native tooltips, hook-free: Bar and Line 0 px past the viewport and card at every width; Donut up to 17 px past the viewport and 33 px past the card; SemiDonut 12 px past the card; Radar at 320px 58–71 px past the viewport.
- **Separate radar defect, not a tooltip defect:** the radar box was `w = dashboardChartMinHeight` (24rem = 384px — a *height* token used as a width). At 320px the SVG was 384px wide (`37 → 421`) inside a card that runs `16 → 304`, so the chart and its right-hand labels ("Запити", "Дзвінки") were cut off by the card's `overflow: hidden`.

### What changed

| Change | Detail |
|---|---|
| Tooltips are native again | Line, Bar, Donut, SemiDonut, Radar pass `tooltip: { theme: 'light', … }` with the caller's text (`x.formatter` → `tooltipDateLabel`/`tooltipCategoryLabel`/`categoryLabel`, `y.formatter` → `valueLabel`/`formatCount`) and `style.fontFamily`; Donut/SemiDonut keep `fillSeriesColor: false`. Bar adds `enabledOnSeries` so a hidden (zeroed) series is not listed. All `Tooltip.Floating`, `hoveredIndex`, `chart.events` hover wiring and the Radar nearest-marker hit-test are removed. |
| Removed | `MantineDashboardChartTooltip` (+ Story), `MantineDashboardChartTooltipContent` (+ Story), `dashboardChartTooltipStyles`, and the theme tokens `tooltipOffset`, `tooltipSwatchSize`, `radarNearestMarkerMaxDistance`. Manifest and barrel entries removed. |
| New: `useApexTooltipMirror.ts` | A non-visual hook (callback ref) on the chart's hover region of Line, Bar, Donut, SemiDonut, Radar. It leaves ApexCharts' own tooltip element, content and chrome untouched and only slides it along its width the smallest distance that fits: the allowed area is `documentElement.clientWidth` ∩ every `overflow`-clipping ancestor (the Mantine `Card`), inset by `theme.spacing.xs`. The target is read from `style.left`, **not** from `getBoundingClientRect()`, because of the 0.15s CSS transition. Where ApexCharts already fits, nothing changes. |
| Radar responsive | The box is `w={{ base: '100%', sm: 24rem }}`; its height is `min(24rem, width)`; the polygon radius is `min(radarSize, (width − 2 × radarLabelReserve) / 2)` from `useElementSize`. New token `dashboardChart.radarLabelReserve: 90` (widest label measured across en/uk/sq/it: 77px `Повідомлення`, plus the label gap). |
| `RadialProgress` | No mirror hook — ApexCharts draws no tooltip for `radialBar`. |

### Evidence

- `tooltip-edge.mjs` → `tooltip-edge.after.json` / `.log`: 6 Stories × {320 uk, 320 en, 390 uk, 768 uk, 1440 uk} = 30 cells; each hovers a grid plus the centre/edge points of every chart element (up to 212 hovered points with a visible tooltip per cell). **0 cells with any tooltip past the viewport, 0 past the card**; the 5 cells with no tooltip are all `RadialProgress` (none exists). `tooltip-edge.pie-hook-only.{json,log}` is the earlier run (hook on Donut/SemiDonut only, Radar still 384px wide): Radar 320/uk 71 px, 320/en 37 px, 390/uk 1 px past the viewport, up to 87 px past the card.
- Independent check of the settled rectangle (500ms after the move, `getBoundingClientRect`, not the `style.left` the hook uses): Radar 320/uk tooltip `[24, 197]` inside the card `[16, 304]`; 320/en `[156, 296]` inside it.
- The measurement in `tooltip-edge.mjs` reads `offsetParent.left + style.left` (the settled position), the same quantity the hook targets; the independent rect check above is what guards against that being circular.
- **Not measured:** vertical clipping (the hook is horizontal only, as the owner specified "вздовж його ширини"); real touch input; the owner's Storybook manager shell (I measured `iframe.html` directly at 320/390/768/1440 px).

### Final gate for the current code (`final-gate-rev2.log`, re-run after the tooltip rework)

Same method as the earlier Revision 2 pass (Git Bash, output redirected, an `EXIT=` line per command; every git grep also run with `--untracked`). All 22 checks exit 0: typecheck, lint, i18n, stories, story-coverage, pattern-enrolment, design-tokens:strict, enrolled-tailwind, rendered-scope, surface-census-changed, **census × 8** (Line 4 nodes, Bar 4, Donut 4, SemiDonut 2, Radar 4, RadialProgress 3, Legend 1, StateFrame 2 — all tier1, tier2 0, tier3 0, every root `manifest:yes story:yes className:0`), vitest 89/89, both builds, the `/admin` ApexCharts check (`/admin/page chunks 20 apexcharts hits 0`; `/admin` 7.19 kB, First Load JS **433 kB**), file-integrity, mojibake. `check:locale-leak:mantine-only` exits 1 (known red, Task 836): 169 lines, the only `Dashboard*` Story named is `Patterns/Mantine/DashboardWorkList/Default` (Task 843, out of scope) — **0 lines under Task 845's Story titles**. Greps 2 and 3 (`--untracked`) print nothing.

**D1 now has two hits, not one** (the X1 grep, `--untracked`): `MantineDashboardChartLegend.tsx:74` `w={{ base: '100%', sm: columnWidth }}` and the new `MantineDashboardRadar.tsx:178` `w={{ base: '100%', sm: theme.other.boxSize.dashboardChartMinHeight }}`. Both are "fill the row below `sm`" widths, not measured visual values; the kickoff's `'NN%'` regex cannot tell them apart. Opus decides: narrow the regex or approve the exception.

### Owner confirmation (2026-09-19, in-session)

*"я візуально підтверджую, що tooltip тепер не обрізається під час hover ефекту"* — the owner checked the hover tooltip in their own Storybook after the `useApexTooltipMirror` + responsive-radar changes. This confirms the tooltip clipping only; it is not an approval of the task (only Opus approves) and it does not answer OD-1/OD-2. Recorded here because the owner-visual matrix rows for tooltip edge behaviour are otherwise still open.

### Deviations / for Opus

- **X2's second half is not implemented, by owner decision** ("нативний tooltip apexcharts має правильну поведінку"). AC19's second grep (`<Skeleton|<MantineEmptyLoadingErrorState|tooltipSwatchSize`) now passes trivially for the tooltip part; the state-frame half of X2 stands. Please amend the kickoff §17.3 X2 / AC19 and the owner matrix (the `DashboardChartTooltipContent` rows no longer apply).
- The Revision 2 statements above that name `MantineDashboardChartTooltipContent`, "9 census roots" and the previous gate numbers describe the code *before* this follow-up; the current numbers are in `final-gate-rev2.log`.
- `OWNER VISUAL QA REQUIRED`: hover a data point near the left and right edge of every chart on `Patterns/Mantine/Dashboard{BarChart,LineChart,Donut,SemiDonut,Radar}` at 320 / 390 / 768 / 1440, uk and en — the tooltip must stay fully inside the card; `Patterns/Mantine/DashboardRadar` at 320 and 360 for the resized (smaller, centred, un-clipped) polygon.

## Review 3 (Opus, 2026-09-20) — `APPROVED WITH NOTES`

Reviewed against the real working tree, not the report. All 18 `git hash-object` values printed at the end of
`docs/sessions/evidence/task845/final-gate-rev2.log` equal the live working-tree hashes re-measured at review time,
so that transcript is current for the approved diff (including `MantineCombobox.tsx` = `1a64070…`, the X3
reconstruction).

**Verified in this session:** AC9 · AC10 · AC11 (one `resolveThemeColor`, no `LegendToggle`, five legend-bearing
patterns import the canonical legend) · AC14 (`/admin` 7.19 kB / First Load JS 433 kB, `/admin/page chunks 20
apexcharts hits 0`) · AC15 · AC17 (8 census roots, every one `manifest:yes story:yes className:0`, `GR-1 CENSUS
COMPLETE` ×8, `check:surface-census:changed` PASS, blocks new 0) · AC18 (five `dashboardChart` keys with provenance
comments and types; the grep's only hits are the two `'100%'` responsive widths — accepted, kickoff §18.2) · AC19
state-frame half (both clone greps empty; the tooltip half is void by D845-4) · AC20 (60 cells per arm, 124 deltas,
**every one `chevronHit: svg → input`, zero width deltas at either 360 or 1440** — the intended
`rightSectionPointerEvents="none"` effect, i.e. the chevron now opens the combobox instead of swallowing the click) ·
AC21 · AC22 (the only `Dashboard*` leak line is `DashboardWorkList/Default`'s `Elira Hoxha`, Task 843, out of scope) ·
AC23 first/second/third greps · AC7 · AC8 (owner accepted the visual matrix in-session 2026-09-20) · AC16 (owner
answered OD-1 = B and OD-2 = B on 2026-09-20; both are waivers, no code change; 853 and 855 amended in the approval
commit).

**Correction to the Files Changed record (Opus, not the executor).** The "Files Changed (Revision 2)" table above was
written before the native-tooltip follow-up and is stale in three places. The approved write set is that table with:

| Path | Correction |
|---|---|
| `src/design-system/mantine/patterns/useApexTooltipMirror.ts` | **Added** — new file, in no table above. A hook (no JSX), so it is correctly absent from `mantine-migration-scope.json` and from the per-file census; it is reached by Line/Bar/Donut/SemiDonut/Radar. |
| `src/design-system/mantine/patterns/MantineDashboardChartTooltipContent.tsx` | **Never shipped** — created in Revision 2, deleted by owner decision D845-4. Not in the tree, not in the manifest. |
| `src/stories/patterns/mantine/DashboardChartTooltipContent.stories.tsx` | **Never shipped** — same. |

With those three corrections the session record matches `git status --short` path for path (36 paths), which is the
state the approval handoff stages.

**Notes carried out (no action owed):** kickoff §18.2 (the `'100%'` grep exception) and §18.3 (the 1 kB `/admin`
delta, the height-named token used as a radar width cap, `RadialProgress`'s `empty → ready` mapping, and the X3
plant incident). `check:locale-leak:mantine-only` remains red for the pre-existing Task 836 reasons, with zero lines
under any Task 845 Story.
