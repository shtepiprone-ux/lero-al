# Task 856 — AGT-11 "Top listings by …": three static photo cards ranked by one selected event

Sprint 78 · P2 · QA profile **Q3** · Wave D, last · depends on **849, 854, 855** approved and O78-3 ·
**Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET (gated on O78-3)**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) (D78-1: chat options absent).

## 1. Mode and task type

`IMPLEMENTATION` — one new canonical pattern (the top-listing photo card) with its Story, a pure ranking function
with tests, and its composition into the agent view. Bundles: **UI / Current Mantine path** + **Storybook / Visual Proof**.

## 2. Objective

A full-width section on `/{locale}/cabinet/statistics` (spec §16.3, §17.3 AGT-11). The header reads
**"Top listings by {event}"** and has **one** event selector: Views · WhatsApp clicks · Form inquiries, default
Views. Chat options do not exist until Task 342, so they are **not rendered** (not disabled).

The section shows up to **3** static cards, 3-up on desktop and 1 column on mobile. Each card has:
- a 4:3 image (a neutral placeholder when there is no cover);
- a status badge **below** the image (no text over the photo);
- the title (≤ 2 lines);
- the selected event's label and its count;
- the last-activity date.

Only listings whose selected count is **> 0** in the period qualify. When fewer qualify, the section shows fewer
cards; when none do, it shows "No such events in this period". There is no carousel, no auto-scroll and no composite
score. Clicking a card opens AGT-10 on the same page, sorted by the same event and keeping the same period (spec §13
"Top listings").

## 3. Verified context — to be re-measured at I0

- 849: `getOwnerActivityByListing(ownerId, period)` → `{ listing_id, recorded_views, whatsapp_clicks,
  listing_inquiry_submissions, last_activity_date }` for listings with activity.
- 848: the owner's listing rows with `title`, `status`, `slug`, `coverUrl` (848 §3.1 AGT-10).
- 854/855: `AgentStatisticsView`, its URL state (`period`, `event`, `sort`), AGT-10 with activity sorting (855 R5), and
  `theme.other.boxSize.dashboardListingThumb`.
- **Candidate pattern inspected: `MantineListingCardPattern`** (enrolled, Story `Patterns/Mantine/ListingCardPattern`).
  It renders status/promo badges **on top of the photo** and carries the price/features anatomy of a public card. The
  spec forbids small text over the photo and asks for a different anatomy (event label + count + last activity).
  → not reused; a small dedicated pattern is created. Its image is the canonical `AppImage`
  (`src/design-system/media/AppImage.tsx`, enrolled, storied, with a no-src placeholder state).
- `LISTING_STATUS_COLOR` (844) for the status badge.

### 3.1 Spec rules restated (v3.3 AGT-11, §17.3, §16.4, §13)

- Rank: `ORDER BY selected_count DESC, last_activity_at DESC NULLS LAST, listing_id ASC`; scope = own listings with
  `selected_count > 0` in the completed period; the channels are never mixed.
- Show up to 3 on the dashboard; if fewer, show all that qualify; if none, "No such events in this period".
- Card: image 4:3; the status badge below the image; title ≤ 2 lines; the selected-action label; the count; the last
  activity. No overlay text, no auto-scroll/carousel; keyboard accessible; static.
- The selector changes only the ranking channel. The header always names the event. Clicking keeps the period and
  channel.
- Chat options are hidden until chat exists.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.1 | `src/modules/cabinet/statistics/topListings.ts` exports the pure `rankTopListings(rows, event, limit = 3)`: it filters `count > 0`, sorts per §3.1 with explicit tie-breakers, and slices. Tests: ties on count broken by last activity, then by id; null last-activity sorts last; zero-count rows are never included; the channels are independent (the same fixture ranks differently per event). | P0 | AC1 | Confirmed |
| **R2** | §3.1, D78-5 | `MantineDashboardTopListingCard` (`src/design-system/mantine/patterns/`): props `href`, `imageSrc \| null`, `imageAlt`, `title`, `status: { label, color }`, `eventLabel`, `count` (preformatted), `lastActivity: ReactNode`. It renders a Mantine `Card` (theme defaults) whose root is one `next/link` anchor; `Card.Section` holds `AspectRatio ratio={4 / 3}` containing `AppImage` (the placeholder when null); below it, the `Badge`, `Text lineClamp={2}` title, an event label/count row, and a last-activity line. Focus ring visible; no text layered over the image; no animation beyond the theme's hover transition. | P0 | AC2, AC3 | Confirmed |
| **R3** | 16c, GR-3 | Own Story `Patterns/Mantine/DashboardTopListingCard`: with image, without image (placeholder), long `uk` title, count 0 is **not** a state (the ranking excludes it — documented in JSDoc). Enrolled in the manifest. | P1 | AC4 | Confirmed |
| **R4** | §16.3 | `AgentStatisticsView`: a `Full` row "Top listings by {event}" placed after the analytics row. Selector = `SegmentedControl` (Views · WhatsApp clicks · Form inquiries), state in `?top=` (independent of the chart's `?event=`, because the spec gives each block its own selector), period inherited. Cards in `SimpleGrid cols={{ base: 1, md: 3 }}`. Empty → the specific text inside the section. Card `href` = the statistics page with the same `period`/`from`/`to`, `sort=<event>_desc`, and `#agt-10` (AGT-10's section gets `id="agt-10"`). | P0 | AC5, AC6 | Confirmed |
| **R5** | i18n, hardcode | Strings in 4 locales; no `className`, Tailwind, raw values or inline styles in the new pattern and the edited view. | P0 | AC7 | Confirmed |

## 5. Assumptions and open questions

- **Separate selector state** (`?top=` vs `?event=`) follows the spec's "one selector for the whole block" per block.
  INFERENCE; the owner may ask to link them.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (5, 7, 9, 11, 13, 14, 16–16d) · `docs/qa-profiles.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6 · `docs/component-rules.md` ·
`docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` · `.claude/skills/execute-task/SKILL.md` ·
kickoffs 844, 848, 849, 854, 855.

## 7. Scope

- **Created:** `src/modules/cabinet/statistics/topListings.ts` + `__tests__/topListings.test.ts` ·
  `src/design-system/mantine/patterns/MantineDashboardTopListingCard.tsx` ·
  `src/stories/patterns/mantine/DashboardTopListingCard.stories.tsx`.
- **Edited:** `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` · the agent page (pass `top` state
  and data) · `src/stories/patterns/mantine/AgentStatisticsView.stories.tsx` (+ fixtures: 3 / 1 / 0 qualifying) ·
  `src/design-system/mantine/patterns/index.ts` · `scripts/mantine-migration-scope.json` (1) ·
  `messages/{sq,en,uk,it}.json` · `docs/backlog.md` (856 line).

## 8. Out of scope

Chat options (Task 342) · a per-listing detail page (the target is AGT-10 sorted) · `MantineListingCardPattern` and
`ListingCard` · public listing pages.

## 9. Current and required behavior

**Before.** No top-listings block. **After.** §2.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes; approvals + O78-3 confirmed; census of `AgentStatisticsView.tsx`
   (clean before).
2. Ranking tests first (R1), red → green.
3. Pattern + Story (R2/R3), then composition (R4), then fixtures and states.
4. Live check (agent session): switch the selector; the order and counts change; click a card and confirm the landing
   URL keeps the period and sorts AGT-10 by that event, with the clicked listing among the first rows.

## 11. Positive and negative flows

**Positive.** Agent A selects "Form inquiries" and sees three cards (5, 3, 3; the two 3s ordered by last activity). A
click lands on AGT-10 sorted by form inquiries for the same 30 days.

| Negative flow | Applicable | Expected |
|---|---|---|
| No listing with events | Yes | "No such events in this period"; no cards, no zeros. |
| One qualifying listing | Yes | One card; no empty slots. |
| No cover image | Yes | Neutral placeholder at 4:3. |
| Long `uk` title | Yes | Clamped to 2 lines. |
| Keyboard | Yes | Selector operable; each card is one tab stop. |
| Aggregate stale/error | Yes | The section shows the stale badge / error + Retry (as 855's blocks). |
| ≤ 767px | Yes | One column; no horizontal scroll. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `npm.cmd run test -- src/modules/cabinet/statistics/__tests__/topListings.test.ts`, when run,
  then all cases pass. Given a plant that drops the `count > 0` filter, when re-run, then the "zero never included"
  case fails; revert with an equal hash.
- **AC2 [R2]** — Given `Patterns/Mantine/DashboardTopListingCard`, when the DOM is inspected, then exactly one `<a>` wraps
  the card, and no text node is a descendant of the image container.
- **AC3 [R2]** — Given the card at 1440 and 390, when the image box is measured, then width / height = 4 / 3 (± 1px rounding).
- **AC4 [R3]** — Given `check:story-coverage`, `check:pattern-enrolment` and the pattern's census, when run, then they
  exit 0 and it reads `manifest:yes story:yes`.
- **AC5 [R4]** — Given the agent view Story fixtures (3 / 1 / 0 qualifying), when rendered, then 3, 1 and 0 cards are
  shown, the last with the empty text; the header names the selected event.
- **AC6 [R4]** — Given the live check of §10.4, when a card is clicked, then the landing URL contains the same period
  params, `sort=<event>_desc`, and `#agt-10`.
- **AC7 [R5]** — Given
  `git --no-optional-locks grep -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardTopListingCard.tsx src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`,
  when run, then it prints nothing; `check:i18n`, `check:design-tokens:strict` and `check:enrolled-tailwind` exit 0.
- **AC8** — Given the owner matrix §13.3, when reviewed, then each tuple is accepted or returned with a concrete defect.

`GR-4 AC AUDIT — 8 criteria; each states an observable property; absolutes: AC7's empty grep on two named files; AC3 allows rounding.`

`GR-3a STORY PREFLIGHT — MantineDashboardTopListingCard × image/no-image/long-title; canonical candidates: Patterns/Mantine/ListingCardPattern (inspected: renders MantineListingCardPattern with badges over the photo and public-card anatomy — not this component, and its layout contradicts spec AGT-11 "no text over the photo"); direct-import evidence: NONE for the new component; toolbar coverage: locale=toolbar, viewport=toolbar (Task 799 caveat); decision: CREATE; target: Patterns/Mantine/DashboardTopListingCard; rationale: different anatomy mandated by the spec; image reused via AppImage.`

`GR-1 CENSUS COMPLETE — agent view surface: tier1 1 created+enrolled+story (MantineDashboardTopListingCard) + reused AppImage (enrolled, storied); tier2 0; tier3 0 listed and filed as none.`

`GR-3 STORY PROVEN — MantineDashboardTopListingCard ← src/stories/patterns/mantine/DashboardTopListingCard.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q3`** — a new visible pattern composed into a page.

### 13.1 Re-entry

`from-scratch` (gated on O78-3). Evidence root `docs/sessions/evidence/task856/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/cabinet/statistics/__tests__
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineDashboardTopListingCard.tsx
node.exe scripts\check-surface-census.mjs --surface src\modules\cabinet\statistics\components\AgentStatisticsView.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantineDashboardTopListingCard.tsx src/modules/cabinet/statistics/components/AgentStatisticsView.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/modules/cabinet/statistics/topListings.ts src/design-system/mantine/patterns/MantineDashboardTopListingCard.tsx src/modules/cabinet/statistics/components/AgentStatisticsView.tsx
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for
`patterns-mantine-dashboardtoplistingcard` / `patterns-mantine-agentstatisticsview`; quote the grep.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize. Live: agent session.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Patterns/Mantine/DashboardTopListingCard` | with / without image | 1440 | en | 4:3 image, badge below, 2-line title, event label + count, last activity |
| 2 | same | long title | 390 / 320 | uk | clamp, no overflow |
| 3 | `/en/cabinet/statistics` (live) | Views | 1440 | en | 3 static cards in a row; header names the event |
| 4 | `/sq/cabinet/statistics` (live) | WhatsApp | 1024 | sq | re-ranked; fewer cards when fewer qualify |
| 5 | `/it/cabinet/statistics` (live) | Form | 768 | it | layout |
| 6 | `/uk/cabinet/statistics` (live) | Views | 390 | uk | one column |
| 7 | `Patterns/Mantine/AgentStatisticsView` | 0 qualifying | 1280 | en | "No such events in this period" |

### 13.4 Evidence the executor hands over

§13.2 transcripts · AC1 plant with hashes · AC2/AC3 DOM and measurement quotes · §10.4 live notes · owner matrix.

## 14. Completion report contract

Files with hashes · R1–R5 · AC1–AC8 with quotes · commands with exit codes · GR receipts · assumptions · deviations ·
limitations · owner matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval, no mutating git. Update the 856 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate card pattern? | `MantineListingCardPattern` inspected and rejected on a spec rule (overlay text), recorded in GR-3a; `AppImage` reused. |
| Single channel only? | R1 per-event ranking + tests. |
| Zero rows never shown? | R1 + AC1 plant. |
| Static, no carousel? | R2/R4. |
| Commands in blocks | §13.2. |
