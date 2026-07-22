# Task 658 — MantineListingCardPattern + ListingCard container: full internal-chrome de-Tailwind → Mantine primitives

## 1. Mode and task type

- **Mode:** Implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** UI — current Mantine path. **Shared canonical pattern** consumed on every listing surface (homepage Featured/Latest, `/listings` grid + list view, `/favorites`, cabinet listings tab, admin listing preview). High blast radius.
- **QA profile:** `Q3 Full Visual Matrix` (justified in §13). This is a migrated-primitive chrome change on the core product card governed by canonical Stories (clause 16c).

## 2. Objective

Convert the residual raw-HTML chrome inside `MantineListingCardPattern.tsx` (both `layout='grid'` and `layout='list'` variants) and the raw elements authored in its `ListingCard.tsx` container/data-mapper to Mantine primitives (`Text`, `Group`, `Stack`, `Box`, `Center`), **preserving the rendered result byte-for-byte**. This closes the last raw-HTML on the homepage render tree and unifies the card's text/layout chrome on Mantine primitives.

**This is a primitive swap, not a redesign.** Every color, size, weight, spacing, radius, line-clamp, hover behavior, and wrap behavior must render identically to today at every viewport/locale.

### Scope reality the executor and owner must accept up front

A "full de-Tailwind" of this pattern is **not** achievable as "zero Tailwind classes," and attempting that would break rendering. Several classes have **no Mantine primitive/prop equivalent** and are retained deliberately (each cited in §10's disposition table):

- `group` + `group-hover:text-primary transition-colors` on the title — hover color tied to the Card's `group` class; Mantine has no group-hover prop.
- The `styles.*` CSS module (hover elevation, image zoom, premium border, list-row `display:flex`) — **do not touch**; it exists precisely because Mantine's unlayered `Card` CSS defeats Tailwind `hover:`/`flex` utilities (documented in the module header, Task 602/606).
- `text-2xs` (original-price line) — no Mantine font token below `xs`.
- Overlay decoration (`bg-overlay/30`, `text-overlay-foreground`, `rotate-[-8deg]`, `border-2`, the `overlay.className` status tints), photo-counter pill tints (`bg-overlay/60 rounded-full`) — custom semantic tokens / arbitrary values with no Mantine equivalent.

The migration converts **structural/text elements** to Mantine primitives and **retains** the above as `className` on the nearest Mantine `Box`/`Text`. That is the correct end state under the project UI rule split (Mantine = mechanism/behavior; TailAdmin/Tailwind = residual visual chrome with no primitive equivalent), not a shortfall.

## 3. Verified context

Inspected in the working tree on 2026-07-22, after Task 657 landed.

**Affected files (inspected):**

- `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (primary — the canonical pattern; both variants)
- `src/modules/listings/components/ListingCard.tsx` (container/data-mapper — builds the `image`/`footerActions` slot nodes)
- `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` (**inspected — DO NOT MODIFY**; owns hover/premium/list-display)

**Canonical Stories (clause 16c proof path — already truthful real-component stories, Task 656):**

- `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` — renders the real `MantineListingCardPattern` (grid + list). **This is the direct proof for this task's artifact.**
- `src/stories/mantine/primitives/ListingCard.stories.tsx` — statically imports and renders the real production `ListingCard` (Task 656). Proof for the container slot nodes.

Both already pass `check:story-coverage` (7/7 per Task 656 archive). No new story must be created; both must be re-verified to render the migrated primitives with unchanged visuals.

**Current raw-HTML inventory (the migration target):**

*`MantineListingCardPattern.tsx` — `layout='list'` branch:* lines 155, 162, 172, 179, 180, 181, 182 (`<p>` typeLabel), 185 (`<h3>` title), 189, 190, 191, 192, 193 (`<span>` price), 195 (priceOld), 199 (pricePerSqm), 203 (`text-2xs` originalPrice), 207 (features row), 209 (feature item), 236 (location+footer row), 238, 240 (location).

*`MantineListingCardPattern.tsx` — `layout='grid'` branch:* lines 268 (badges wrapper), 278–284 (overlay), 289 (photo counter), 304 (`<h3>` title), 314 (features row), 316 (feature item), 338–340 (originalPrice/pricePerSqm row). Note: grid typeLabel/location/price already use Mantine `Text`/`Group` (lines 298–336) — preserve.

*`ListingCard.tsx` container:* lines 151/240 (no-image fallback `<div className="absolute inset-0 flex items-center justify-center">`), 191/285 (date `<span className="whitespace-nowrap">`), 278 (vertical footer wrapper `<div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">`).

**Token traces (verify before coding — reuse the Task 657 confirmed values):**

- `text-muted-foreground` = `--muted-foreground` = `--neutral-500` = `oklch(0.556 0 0)`. **Parity hazard:** the pattern already mixes `Text c="dimmed"` (Mantine gray-6, a *different* value — confirmed in Task 657) on some lines with `text-muted-foreground` on the raw spans. See open decision **D-1**: whether to keep each migrated element's *current* color exactly (bind raw-span colors to `c="var(--muted-foreground)"`, leave existing `c="dimmed"` lines untouched) or unify. Default = **preserve each element's current computed color exactly** (no visible change).
- `text-xs` = 12px → Mantine `Text size="xs"` (theme `fontSizes.xs`; verify equals 0.75rem and that line-height matches). `text-sm` = 14px → `size="sm"`. `text-base` = 16px → `size="md"`. `text-2xs` → **no token**, keep className.
- `font-bold` = 700 → `fw={700}`; `font-semibold` = 600 → `fw={600}`.
- `text-primary`/`text-brand` = brand-700 `#EC5447` → `c="brand"` (theme `primaryColor:'brand'`, shade 7). Verify `c="brand"` resolves to shade 7.
- `gap-2`=8px→`gap="xs"`; `gap-3`=12px→`gap="sm"` (verify against theme spacing xs=8/sm=12); `gap-1`=4px→`gap={4}`.
- `line-clamp-2` → Mantine `Text lineClamp={2}` prop (exists). `line-through` → `td="line-through"`. `whitespace-nowrap` → `style={{ whiteSpace:'nowrap' }}` or keep className.
- `py-3 pr-3`, `mt-1/mt-1.5/mt-2`, `mb-1` → Mantine spacing props (`py`/`pr`/`mt`/`mb`) where a token matches; otherwise literal rem, as Task 657 did for `py="2rem"`.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner (scope decision) | Grid-variant raw text/structure elements (§3 grid list) migrated to Mantine primitives, visuals unchanged | P1 | Diff + Q3 rendered parity | Confirmed |
| R2 | Owner | List-variant raw text/structure elements migrated to Mantine primitives, visuals unchanged | P1 | Diff + Q3 rendered parity | Confirmed |
| R3 | Owner | `ListingCard.tsx` container raw elements (footer wrapper, date span, no-image fallback) migrated, visuals unchanged | P1 | Diff + Q3 rendered parity | Confirmed |
| R4 | P0 cl.5/6/16 | Rendered output identical to pre-change at every Q3 viewport/locale — color, size, weight, spacing, radius, line-clamp, wrap, hover, premium, archived, sold/rented overlay, photo counter | P0 | Q3 matrix + computed-style parity | Confirmed |
| R5 | P0 cl.3/4 | No capability/state lost: badges, overlay, photo counter, favorite, copy-id, date, features, price(+old/per-sqm), contact CTA, hover zoom, premium ring all still render/behave identically in both variants | P0 | Q3 rendered + interaction check | Confirmed |
| R6 | Pattern module.css | `MantineListingCardPattern.module.css` is NOT modified; hover/premium/list-display behavior preserved | P0 | Diff shows css untouched; hover rendered proof | Confirmed |
| R7 | P0 cl.16c | Canonical `ListingCardPattern` + `ListingCard` Stories re-verified to render migrated primitives with unchanged visuals; `check:story-coverage` stays green | P1 | Story inspection + gate | Confirmed |
| R8 | P0 cl.7 | No user-facing string or i18n key changed (pattern is hook-free; strings arrive as props) | P0 | Diff + `check:i18n` no delta | Confirmed |
| R9 | P0 cl.9 | `npm run build` exits 0; typecheck 0 | P0 | Native transcript | Confirmed |

Every acceptance criterion maps to one or more of R1–R9.

## 5. Assumptions and open questions

- **D-1 (AMBIGUOUS — color parity, owner decision):** The pattern currently mixes `c="dimmed"` (≠ `--muted-foreground`) and `text-muted-foreground`. **Default in this task: preserve each element's *current* computed color exactly** — migrated raw `text-muted-foreground` spans → `c="var(--muted-foreground)"`; existing `c="dimmed"` lines left as-is. This yields zero visible change but *perpetuates* the two-shade inconsistency. If the owner wants the card unified on one dimmed token, that is a deliberate visual change and a **separate** task (it alters rendered color on some elements). Executor must NOT unify silently.
- **D-2 (title hover):** the `group-hover:text-primary transition-colors` on the title is retained as `className` on the migrated `Text lineClamp={2}` (Mantine has no group-hover prop). Assumed acceptable; this is the sanctioned residual-chrome pattern.
- **A-3 (slicing):** This task is large. It is organized into three sequential, independently-verifiable slices (S1 grid, S2 list, S3 container — §10). The executor SHOULD land them as three commits/sessions in order, each with its own Q3 evidence for the surfaces it touches, rather than one monolithic diff. Opus reviews each slice before the next. If the executor judges a single atomic diff safer, it must still provide per-slice evidence.
- **A-4:** `text-2xs`, overlay tints, photo-counter pill tints, the `styles.*` module, and `group`/`group-hover` are retained as `className` (no Mantine equivalent) — this is authorized, not a deviation.

## 6. Pre-read rule bundle (executor reads exactly these)

- `docs/agent-contract.md`
- `docs/rule-index.md`
- `docs/qa-profiles.md`
- `docs/backlog.md`
- `docs/critical-flow-registry.md` (scan: card links to listing detail — browse render, no write path; confirm no registry entry)
- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md`
- `docs/component-rules.md` (container/presentational split)
- `docs/ui-rules.md` (routing / legacy-boundary)
- `docs/qa-rules.md`
- `docs/storybook-governance.md` + `docs/storybook-visual-snapshots.md` (R7, Q3 proof path)
- This task file.

## 7. Scope

1. `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` — migrate the §3 grid + list raw text/structure elements to Mantine primitives, retaining the §2/§10 documented className carve-outs.
2. `src/modules/listings/components/ListingCard.tsx` — migrate the container raw elements (footer wrapper, date span, no-image fallback) to Mantine primitives.
3. `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` and `src/stories/mantine/primitives/ListingCard.stories.tsx` — re-verify (and only if a rendered divergence appears, minimally adjust) that they render the migrated primitives; keep them truthful real-component stories.

## 8. Out of scope (do not touch)

- `MantineListingCardPattern.module.css` — **frozen** (R6). Hover, premium, list-display, image zoom all live here and must not change.
- The `styles.card`/`styles.imageSection`/`styles.premium`/`styles.listRow` class references on the `Card`/wrappers — keep as-is.
- `MantineCopyIdButton`, `FavoriteButton`, `AppImage`, `ListingFeatureIcon`, `Badge` usage — already canonical; unchanged.
- The Mantine primitives the pattern ALREADY uses correctly (grid `Text`/`Group`/`Stack` at lines 298–336, `Card`, `Badge`, contact `Button`) — preserve.
- Any **visual change**: unifying dimmed vs muted-foreground (D-1), restyling, re-spacing, changing radius/typography. Parity only.
- `messages/*` (no strings change).
- Other card surfaces' consumers (`/listings` FilterBar, detail view, etc.) beyond re-verifying they render unchanged.
- `data-*` tracking attributes, `onClick`/`onContact` wiring, favorite positioning contract.

## 9. Current and required behavior

For each migrated element: **current** = raw `<div>/<span>/<p>/<h3>` + Tailwind utilities producing a specific computed style; **required** = the equivalent Mantine primitive (`Text`/`Group`/`Stack`/`Box`/`Center`) producing the **same** computed style, with no-Mantine-equivalent utilities retained as `className`. Triggers, data mapping, slot nodes, both variants, and all states (populated/hover/premium/archived/sold-rented overlay/photo-counter/no-image fallback) are preserved. Nothing is added or removed (P0 cl.3/4/5).

Explicitly preserved behaviors requiring rendered proof (R5): card hover elevation + image zoom (`(hover:hover)` guard), premium gold border + elevated hover shadow, archived grayscale/opacity, sold/rented rotated overlay, photo-counter pill (grid bottom-right / list bottom-left), title 2-line clamp + group-hover brand color, price struck-old+new, features wrap, list-view location+footer single-row wrap behavior (the Task 656 fix).

## 10. Implementation requirements — per-artifact disposition & slice plan

Migrate only structural/text elements; retain cited carve-outs. `MIGRATE` = replace element with the named Mantine primitive preserving all values; `KEEP className` = leave as raw element (or move className onto the nearest Mantine primitive) with the cited reason.

### Slice S1 — `layout='grid'` (MantineListingCardPattern.tsx)

| Line | Element | Disposition |
|---|---|---|
| 268 | badges wrapper `<div className="absolute top-2 left-2 flex flex-wrap gap-1">` | MIGRATE → `Box` (keep positioning className) |
| 278–285 | overlay `<div>`+`<span>` (rotated status) | MIGRATE wrapper → `Box`/`Center`; **KEEP className** on inner label (`rotate-[-8deg] border-2 text-overlay-foreground` + `overlay.className` — no Mantine equivalent) |
| 289 | photo-counter `<div className="... bg-overlay/60 text-overlay-foreground text-xs rounded-full">` | MIGRATE → `Group gap={4}` wrapper; **KEEP className** for the overlay tint + pill radius |
| 304 | title `<h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">` | MIGRATE → `Text component="h3" fw={600} size="sm" lineClamp={2}`; **KEEP className** `group-hover:text-primary transition-colors leading-snug` (D-2) |
| 314 | features row `<div className="... text-xs text-muted-foreground border-t pt-2 flex-wrap">` | MIGRATE → `Group gap="sm" wrap="wrap"` + color/border via props or retained className (`border-t` has no Mantine prop → keep or `style={{borderTop}}`) |
| 316 | feature item `<span className="flex items-center gap-1">` | MIGRATE → `Group gap={4} wrap="nowrap"` |
| 338–340 | originalPrice/pricePerSqm `<div>`+`<span>`s (`text-2xs text-muted-foreground/70`) | MIGRATE wrapper → `Group justify="space-between"`; **KEEP className** for `text-2xs` + `/70` opacity (no token) |

### Slice S2 — `layout='list'` (MantineListingCardPattern.tsx)

| Line | Element | Disposition |
|---|---|---|
| 155 | image section wrapper `<div className={cn(styles.imageSection, 'relative w-32 ...')}>` | MIGRATE → `Box` (keep `styles.imageSection` + sizing className; must retain `onClick`) |
| 162 | badges wrapper | MIGRATE → `Box` (keep positioning) |
| 172 | photo counter pill | MIGRATE → `Group` + KEEP tint className (as S1/289) |
| 179 | info column `<div className="flex flex-col justify-between py-3 pr-3 flex-1 min-w-0">` | MIGRATE → `Stack justify="space-between"` (keep `py/pr` via props, `flex-1 min-w-0` className) — retain `onClick` |
| 180,181,189,190,191,192 | grouping `<div>`s (flex rows/cols) | MIGRATE → `Box`/`Group`/`Stack` preserving flex/wrap/gap/justify/align |
| 182 | typeLabel `<p className="text-xs text-muted-foreground">` | MIGRATE → `Text size="xs" c="var(--muted-foreground)"` (D-1) |
| 185 | title `<h3 ...>` | MIGRATE as S1/304 |
| 193 | price `<span className="text-base font-bold text-primary whitespace-nowrap">` | MIGRATE → `Text component="span" size="md" fw={700} c="brand"` + nowrap |
| 195 | priceOld `<span className="text-xs text-muted-foreground line-through whitespace-nowrap">` | MIGRATE → `Text size="xs" c="var(--muted-foreground)" td="line-through"` + nowrap |
| 199 | pricePerSqm `<span className="text-xs text-muted-foreground whitespace-nowrap">` | MIGRATE → `Text size="xs" c="var(--muted-foreground)"` + nowrap |
| 203 | originalPrice `<span className="text-2xs text-muted-foreground/70 leading-tight">` | MIGRATE → `Text component="span"` + **KEEP className** `text-2xs text-muted-foreground/70 leading-tight` |
| 207,209 | features row + item | MIGRATE as S1/314,316 |
| 236,238,240 | location+footer row, location cluster | MIGRATE wrappers → `Group wrap="wrap"`; **preserve the Task 656 single-row-wrap behavior exactly** (`shrink-0 max-w-full` on location, `truncate min-w-0` on inner) — this is the most fragile piece; verify computed `width` at 320px does not collapse to 0 |

### Slice S3 — container (`ListingCard.tsx`)

| Line | Element | Disposition |
|---|---|---|
| 151/240 | no-image fallback `<div className="absolute inset-0 flex items-center justify-center">` | MIGRATE → `Center pos="absolute" inset={0}` (keep lucide `Maximize2` child; its `h-6 w-6`/`h-8 w-8 text-muted-foreground` className stays — icon sizing) |
| 191/285 | date `<span className="whitespace-nowrap">` | MIGRATE → `Text component="span"` + nowrap (inherits footer color context) |
| 278 | vertical footer wrapper `<div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">` | MIGRATE → `Group justify="flex-end" gap="xs" wrap="nowrap"` + `fz="xs" c="var(--muted-foreground)"` |

**General constraints:** preserve every `onClick` handler on wrappers (the pattern routes card clicks through them). Do not alter the `cn(styles.…, …)` class composition on the `Card` root or image sections. Do not change prop names, the slot API, or the container/pattern boundary. Keep `Camera`/`MapPin`/`Maximize2` lucide icons.

## 11. Positive and negative flows

**Positive:** On every listing surface, both card variants render identical to today across populated/hover/premium/archived/sold-rented/no-image/photo-counter states; homepage Featured/Latest, `/listings` grid + list, `/favorites`, cabinet, admin preview all unchanged.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Validation / Auth-RLS / Offline / Concurrent writer | No | Read-only presentational card; no form/auth/network/write | N/A | — |
| No-image listing | Yes | `!coverImage` fallback (S3) | Mantine `Center` + Maximize2 icon, both variants, unchanged | Rendered proof |
| Sold/rented (overlay) | Yes | grid overlay (S1) | Rotated overlay + status tint identical | Rendered proof |
| Premium / archived | Yes | `isPremium`/`isArchived` (module.css + className) | Gold border + hover elevation / grayscale-opacity unchanged | Rendered proof (hover) |
| Price reduced (old+new) | Yes | `data.priceOld` | Struck old + brand new, both variants | Rendered proof |
| Long location/title @320 (list wrap) | Yes | Task 656 wrap fix (S2/236) | Location wraps/truncates, never collapses to width:0; footer sheds correctly | Computed-style @320 proof |

## 12. Acceptance criteria

- **AC1 [R1,R4]** Given the grid card in any state, when rendered at every Q3 viewport/locale, then all S1 elements are Mantine primitives (no raw `<h3>/<span>/<div>` except cited carve-outs) and computed style (color/size/weight/spacing/line-clamp/wrap) is byte-identical to pre-change.
- **AC2 [R2,R4]** Given the list card in any state, same as AC1 for S2 elements, **including** the @320 location+footer single-row wrap behavior (location never `width:0`).
- **AC3 [R3,R4]** Given a listing with no cover image, when either variant renders, then the fallback is a Mantine `Center` with the Maximize2 icon, visually identical; and the footer date/cluster are Mantine primitives, unchanged.
- **AC4 [R5]** Given hover (mouse), premium, archived, sold/rented, and photo-counter states, when rendered, then every one behaves/renders exactly as before (hover elevation + image zoom present; module.css untouched).
- **AC5 [R6]** Given the diff, then `MantineListingCardPattern.module.css` shows zero changes.
- **AC6 [R7]** Given Storybook, then `ListingCardPattern` (grid+list) and `ListingCard` stories render the migrated primitives with unchanged visuals and `check:story-coverage` passes.
- **AC7 [R8]** Given `check:i18n`, then no key delta; diff shows no string literal changes.
- **AC8 [R9]** Given native `npm run build` and typecheck, then both exit 0.

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** Justification: chrome change on the **core product card** (migrated Mantine artifact) governed by canonical Stories (clause 16c), rendered on every listing surface — high visual + responsive risk (esp. the S2 list-wrap behavior). Above Q2 despite being a "swap" because of blast radius and the Story-governance obligation.

**Plan (executor runs; paste actual transcripts/evidence):**

1. `npx tsc --noEmit` → 0.
2. `check:i18n` → no delta (no keys/strings changed).
3. File-integrity/mojibake on the two `.tsx` files + touched stories.
4. `check:story-coverage` → PASS; `build-storybook` → 0 errors.
5. **Q3 full visual matrix** for `ListingCardPattern` (grid + list) and `ListingCard` stories: the canonical viewport set (`320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560`) and all four locales (`sq/en/uk/it`) incl. mobile stress; capture every preserved state (populated/hover/premium/archived/sold-rented/no-image/photo-counter/price-reduced). Provide **side-by-side pre/post** parity for a representative width/locale per state.
6. **Computed-style parity proof** (real browser) for the highest-risk elements: title (line-clamp + group-hover brand color on hover), price/priceOld/pricePerSqm colors+sizes, features row, the S2 location+footer @320 wrap (assert location computed `width` > 0 and no overflow), no-image fallback centering.
7. Per-slice evidence (S1, S2, S3) if landed as separate sessions (A-3).
8. **Hard gate:** native `npm run build` → exit 0 transcript.

### Visual source map (executor rebuilds independently from source+diff before accepting)

| Visible artifact/state | Component/markup | Class/selector | Token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Title (both variants) | `<h3>` → `Text component="h3" lineClamp={2}` | `font-semibold text-sm line-clamp-2 group-hover:text-primary` | 600 / 14px / brand-700 | Changed→Mantine + KEEP group-hover className | AC1/AC2, hover computed-style |
| Price / old / per-sqm | `<span>` → `Text` | `text-base/xs font-bold text-primary/muted line-through` | 16/12px, 700, brand-700, muted oklch(0.556) | Changed→Mantine | computed-style parity |
| originalPrice | `<span>` (`text-2xs …/70`) → `Text`+KEEP className | `text-2xs text-muted-foreground/70` | no token | KEEP className | AC1/AC2 |
| Features row/item | `<div>/<span>` → `Group` | `flex gap-3 text-xs text-muted-foreground border-t` | 12px muted; `border-t` no prop | Changed→Mantine + KEEP border className | AC1/AC2 |
| List location+footer row | `<div>/<span>` → `Group wrap="wrap"` | `flex-wrap … shrink-0 max-w-full truncate min-w-0` | 12px muted | Changed→Mantine, **preserve 656 wrap** | @320 computed-width proof |
| Overlay (sold/rented) | `<div>/<span>` → `Center`/`Box`+KEEP label className | `rotate-[-8deg] border-2 text-overlay-foreground` + `overlay.className` | custom tints | wrapper→Mantine, KEEP label className | AC4 |
| Photo counter | `<div>` → `Group`+KEEP tint className | `bg-overlay/60 rounded-full text-overlay-foreground` | custom | wrapper→Mantine, KEEP className | AC4 |
| No-image fallback | `<div>` → `Center pos="absolute" inset={0}` | `absolute inset-0 flex center` | — | Changed→Mantine | AC3 |
| Container footer / date | `<div>/<span>` → `Group`/`Text` | `justify-end gap-2 text-xs muted / whitespace-nowrap` | 8px, 12px, muted | Changed→Mantine | AC3 |
| Hover/premium/archived/list-display | `styles.*` module + `group` class | CSS module | — | **Preserve (frozen)** | AC4/AC5 diff-clean |

### Canonical UI decision record

| Visible artifact | Search/inspected | Canonical source | Disposition | Style/token path |
|---|---|---|---|---|
| All migrated text/structure | Inspected `patterns/**` (Text/Group/Stack/Box/Center are the canonical primitives; pattern already consumes them) | `@mantine/core` primitives | **reuse** (no copied local style; bind colors to existing project tokens) | `size`/`fw`/`c`/`gap`/`justify`/`lineClamp`/`td` props; retained className only where no Mantine equivalent (cited) |
| Card chrome (hover/premium/list) | Inspected `MantineListingCardPattern.module.css` (unlayered-CSS rationale) | existing CSS module | **preserve** (frozen) | untouched |

No new shared primitive, pattern, or token is created; no new canonical Story is created (both truthful stories already exist — Task 656). Disposition matches the whole-pattern scope the owner selected.

## 14. Completion report contract (Sonnet)

- Status: exactly one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, `BLOCKED`. Never self-approve. If landed per-slice, report each slice's status.
- Changed-files table matching the real diff (assert `MantineListingCardPattern.module.css` NOT present).
- R1–R9 + AC1–AC8 self-audit.
- Every command's actual output (tsc, i18n, story-coverage, build-storybook, `npm run build` exit code).
- Q3 matrix + computed-style parity evidence locations (incl. the @320 list-wrap width proof and hover brand-color proof).
- The resolved color decision under D-1 (list each migrated element's before/after computed color proving no change).
- Assumptions/deviations/limitations; explicitly confirm the §2/§10 className carve-outs are intentional.
- Update `docs/backlog.md` (≤80 lines; flag `BACKLOG LIMIT BREACH` if needed) + session log under `docs/sessions/` with Files Changed table.
- No mutating git.

## 15. Task quality gate (orchestrator self-check — all yes)

- ✅ Fresh Sonnet can execute without hidden chat context (per-artifact table + line numbers + slice plan).
- ✅ Every requirement has ≥1 binary AC + verification method.
- ✅ Scope names what must not change (module.css frozen, slot API, container/pattern boundary, no visual change, D-1 not unified).
- ✅ Current/legacy boundary explicit (current Mantine path; module.css and no-Mantine-equivalent classes explicitly carved out with cited reasons — not silent Tailwind residue).
- ✅ Each changed artifact + preserved sibling traced to markup/class/token; ring/border/overlay/hover distinguished; the fragile S2 656-wrap behavior called out with its own proof.
- ✅ Canonical UI decision record backed by inspection; `reuse` forbids copied local styles; carve-outs cited; no uncited "no story" (both truthful stories already exist).
- ✅ Classifications agree with owner intent (full pattern migration, parity-preserving); D-1 unification correctly excluded as a separate visual change.
- ✅ Negative flows selected by applicability (card states), not generic.
- ✅ No claimed command/file/story/token not inspected.
- ✅ Q3 gates prove changed rendering (matrix + computed-style parity + build), not procedural.
- ✅ Assumptions (D-1 color, D-2 hover, A-3 slicing, A-4 carve-outs) surfaced for executor + reviewer.

---

**Task path:** `tasks/kickoff_prompt_Task_658_ListingCardPattern_FullChrome_Mantine_Migration.md`
**QA profile:** `Q3 Full Visual Matrix`
**Remaining ambiguous/owner decisions:** D-1 — confirm the migration **preserves each element's current color exactly** (default; keeps the existing `dimmed` vs `muted-foreground` two-shade split) rather than unifying dimmed tokens (a separate visual task). A-3 — confirm landing as three sequential slices (S1 grid → S2 list → S3 container) with per-slice Q3 review, versus one atomic diff.
