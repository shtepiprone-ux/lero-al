# Task 793 — the contact card becomes canonical Mantine, moves into the content flow, and takes its clearance with it

**Sprint:** 71 · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-05 · **Rewritten clean:** 2026-09-06
· **State:** `KICKOFF FILED — EXECUTABLE`

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception: **no review
ledger**.

> **This file was rewritten from scratch on 2026-09-06.** The first draft accumulated five layers of amendment as
> owner decisions landed, and a fresh session would have had to reconstruct the current truth from superseded
> prose. Every decision is now stated once, in the body, as the requirement it produced. The history that still
> matters — which earlier decisions this task reverses — is §3.7, and nothing else refers backwards.

**Every number below was measured at source on 2026-09-06, after Task 791 was approved and archived.
Re-measure at execution; this document is not the authority for a count.**

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **component migration onto an existing canonical Mantine pattern**,
plus a **deletion** (the fixed mobile bar), a **relocation** (favorite + share into the badges row) and a **coupled
token removal** (the clearance the bar reserved). Mixed migration: the card's children — the two dialogs,
`FavoriteButton`, `SaveToCollectionButton` — stay legacy by design and each names the task that owns it.

## 2. Objective

`src/modules/listings/components/ListingContact.tsx` — **423 lines, 75 `className` occurrences, the largest Tailwind
file left on this route** — stops hand-rolling the contact card and renders the canonical
`MantineListingContactPattern`. In the same change the card becomes visible **in the content flow beneath the
listing** on mobile, the fixed bottom bar is **deleted**, favorite and share move **into the badges row**, and the
page clearance that existed only for that bar is removed with it.

## 3. Verified context

### 3.1 The seam Task 791 built — do not touch it

`ListingDetailView.tsx` is a **Server Component**. It passes `<LazyListingContact …>` into
`MantineListingDetailPattern`'s `contactSlot` (Task 791 E2). `ListingContact.tsx` is `'use client'`.

`INFERENCE`, and it is this task's whole design: because `ListingContact` is already a client component, **it can
render `MantineListingContactPattern` itself** and supply the function props (`onCall`, `onWhatsApp`, `onShare`,
`onLogin`) a Server Component cannot. The migration therefore happens **inside** `ListingContact`, and
`ListingDetailView.tsx` is edited for exactly one reason: to pass the two new badge-row slots (§3.4).

⚠️ **Task 791 shipped a P0 on precisely this boundary.** A `galleryLabels` object containing a `counter` arrow
function was passed from the Server Component into the client pattern, and the route **errored on every request**
while `build`, a `curl` 200 and `check:hydration` all stayed green. The corollary is in
`docs/orchestrator-procedures.md`. **Nothing you pass from `ListingDetailView` may contain a function.**

### 3.2 What the canonical card already covers, and the two things it does not

`MantineListingContactPattern` (261 lines) mirrors the desktop sticky sidebar and its five states —
`normal` · `guestCta` · `ownerDeleted` · `ownerUnavailable` · `closedListing` — and takes `inquiryTrigger` /
`reportTrigger` as positioned nodes. Two production behaviours have no equivalent and must be added to the
**canonical source**, each with its own story state, before the consumer composes them:

| ID | Production behaviour | Where it is today | Disposition |
|---|---|---|---|
| **E-A** | `SaveToCollectionButton` in the secondary-action row | `ListingContact.tsx:277` | `extend` — a positioned-node slot, same idiom as `inquiryTrigger` |
| **E-B** | Call/WhatsApp disabled with a `Loader2` spinner while `getListingOwnerContact` resolves | `ListingContact.tsx` `contactLoading` state | `extend` — a `loading` prop on the pattern |

`FACT`: the pattern renders **in flow at every width** — `pos={{ base: 'static', lg: 'sticky' }}`. The owner's
requested mobile layout (§3.4) therefore needs **no extension at all**; it is what the pattern already does once the
legacy `hidden lg:block` wrapper is gone.

### 3.3 The fixed mobile bar is deleted, and what it carries must be re-homed, not dropped

`ListingContact.tsx:307-309` — `{!listingArchived && <div className="listing-contact-mobile lg:hidden fixed bottom-0 …">`.
Inside it: a price row, an owner-name line, a 640px-gated phone/WhatsApp arrangement (WhatsApp takes its own row
below `sm`), a guest login CTA, an owner-deleted chip and its own inquiry trigger.

Every one of those exists in the in-flow card **except** the archived-listing suppression, which today gates the bar
alone. Decide explicitly what archived listings show in the card and implement it; do not let the behaviour vanish
because its only gate was deleted.

### 3.4 Favorite and share leave the card for the badges row

Owner instruction, 2026-09-06: *"кнопку «Поділитись» перенести праворуч від кнопки «Додати в обране» біля badge
глобально по всіх breakpoints"*, modelled on dom.ria's `Поділитися · В обране` pair.

- `MantineListingDetailPattern` already renders a right-aligned `favorite` node in the badges row — D69-25, owner
  instruction 2026-09-04, comment in that file. **Extend that same `Group` with share; do not add a second row.**
- `FavoriteButton` (`ListingContact.tsx:268`) and the share button (`:287-293`) leave the card.
- The share implementation is `handleShare` (`:111`) plus a `copied` state (`:67`) that flips the label to
  `t('link_copied')` for 2s. **It moves with the button.** It is a function and `ListingDetailView` is a Server
  Component, so it must live inside its own `'use client'` component that the route renders as a slot — see §3.1.
- `MantineListingContactPattern`'s own `onShare`/share button are removed.

### 3.5 The clearance is deleted, and it has consumers in four files

With no fixed bar there is nothing to reserve. `theme.other.layout.listingContactBarClearance` was created by Task
791 hours before this task and is retired here. Census 2026-09-06 — **re-run it; this is a starting point, not an
authority**:

| File | Hits |
|---|---|
| `src/design-system/mantine/theme.ts` | `:146` type, `:493` value |
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` | `:147-150` value assertion · `:281-286` `CONTRACT_CONSUMERS` row |
| `src/modules/listings/components/ListingDetailView.tsx` | `:324` comment · `:328-329` the `pb` consumer |
| `scripts/task791-detail-evidence.mjs` | `:57-58` — **derives its expectations from `theme.ts` by regex and `throw`s when the match fails** |

⚠️ That last row is not paperwork. Task 791's R13 revert deleted a *different* token and left this same script
throwing at startup — a harness that cannot run while the task looks green. **Update the script in the same change.**

Measured coupling, for reference only: at 390px the bar is **134px** tall and the page reserves **176px**; with the
bar gone the reservation is pure dead tail. The page's bottom padding becomes ordinary spacing expressed as a token.
Task **787**'s exit criterion 3 ("no mobile page carries an unexplained tail") closes here.

`ListingMobileCTA.tsx:70` still carries `bottom-14` and has **zero consumers** — Sprint 57's, not yours.
`globals.css:380`'s `--homepage-runtime-space-14` already carries Task 787's corrected comment — leave it.

### 3.5b ⚠️ The archived rule is a behaviour CHANGE on desktop, not a re-homing

Owner instruction, 2026-09-06: *"В архівних оголошеннях показувати картку контактів, але з деактивованими кнопками
контактів. Кнопку «Розшерити» показувати активною… кнопку «Додати в обране» деактивувати."*

Measured today, and the asymmetry matters:

| Gate | Where it is used | Effect |
|---|---|---|
| `listingClosed` (`sold` · `rented`) | `:227` disabled Send-message, `:258` the `closedLabel` note, `:271` `FavoriteButton disabled` | closed listings already behave close to the new rule |
| `listingArchived` (`archived` only) | **`:308` alone** — the mobile bar's suppression | on **desktop** an archived listing shows Call and WhatsApp **fully active** today |

`FACT`: `listingSemanticLayer.ts:98-99` — `ARCHIVED: ['archived']`, `CLOSED: ['sold','rented']`.

`INFERENCE`: deleting the bar does not merely move the archived gate; below `lg` the gate disappears, and at `lg`+ it
never existed. R11 therefore **tightens desktop behaviour** — archived listings lose active contact CTAs they have
today. That is the owner's intent, and a reviewer must not read it as a regression. `FavoriteButton` already accepts
`disabled` / `disabledLabel` (`:271`), so the mechanism exists; widen the condition rather than inventing one.

### 3.6 What must not regress

Living in this file and easy to lose:

- `trackListingContactEvent` — fired on the **WhatsApp** path only.
- `getListingOwnerContact` — the click-time RPC (Task 266). **Digits must never appear in the SSR HTML.**
- `openAuthSheet('login')` for the guest CTA.
- The self-inquiry guard (`showInquiryTrigger`) and the `closedListing` disabled state with its `closedLabel`.
- Staff-preview inertness: `ListingDetailView` forces `effectiveListingId`/`canReport`/`canSendInquiry` off. Note 14.

From `docs/critical-flow-registry.md`: **listing-detail lightbox stacking (Task 612)** asserts the lightbox paints
above the header **and the sticky contact card** — this task changes that card's positioning mechanism, so the proof
is re-run. **Inquiry** and **Report** are registry rows whose triggers live in this card; `npm run test:listings`
must stay green.

### 3.7 What this task reverses — read before deleting

- **Task 466 (2026-06-23) created the bar this task deletes.** It removed `ListingMobileCTA` and consolidated
  everything into one `listing-contact-mobile` bar, with its own ACs for the <640 Call↔WhatsApp overlap, the
  archived guard and the `lg:hidden` boundary. Read `docs/sessions/2026-06-23-task466-listingdetailview-mobile-fix.md`
  so those behaviours are re-homed consciously.
- **D69-25 (2026-09-04) moved the favorite out of the contact card** into the badges row. Production never followed;
  this task makes production match the decision.
- **Owner, 2026-09-05:** *"панель внизу прибираємо"* and *"картка контактів на мобільних екранах має бути видима
  після контенту оголошення."*
- **Owner, 2026-09-06:** share joins favorite in the badges row at every breakpoint.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.2, §3.3 | Below `lg` the contact card renders **in the content flow beneath the listing**, and the fixed bar does not exist. Every affordance the bar carried is present in the card, and the archived-listing behaviour is re-homed explicitly | P0 | AC1 | Confirmed |
| **R2** | §3.4 | Favorite **and** share render in the badges row, adjacent, at every breakpoint; each appears exactly once in the DOM; neither appears in the contact card | P0 | AC2 | Confirmed |
| **R3** | §3.1 | `ListingContact.tsx` renders `MantineListingContactPattern`; **zero** `@/components/ui/*` imports remain (2 today); `ListingDetailView.tsx` is edited only to pass the two badge-row slots | P0 | AC3 | Confirmed |
| **R4** | §3.2 | **E-A** and **E-B** land in the canonical pattern with a story state each, and its pre-existing states render unchanged | P0 | AC4 | Confirmed |
| **R5** | §3.5 | `listingContactBarClearance` and every consumer in the four named files are removed; the page's bottom padding is ordinary token-expressed spacing; no viewport shows a dead tail | P0 | AC5 | Confirmed |
| **R6** | §3.6 | Every behaviour in §3.6 is preserved exactly | P0 | AC6 | Confirmed |
| **R7** | §3.6 | Task 612's stacking contract holds; `test:listings` stays green | P1 | AC7 | Confirmed |
| **R8** | D71-4 | No raw pixel in the diff; a missing value becomes a created token | P0 | AC8 | Confirmed |
| **R9** | §3.5 | Every reference to the deleted bar and the deleted token is removed or classified in writing as historical prose, **including the evidence script** | P0 | AC9 | Confirmed |
| **R10** | §3.1 | Nothing passed from `ListingDetailView` contains a function; the share handler lives in its own `'use client'` component | P0 | AC10 | Confirmed |
| **R11** | Owner, 2026-09-06 | On an **archived** listing (and, per **A4**, an expired one): the contact card **renders**, its contact CTAs — Call, WhatsApp, Send message — are **disabled**; **share stays enabled and shareable**; **favorite is disabled**. Both of the latter now live in the badges row (R2), so the rule spans two places | P0 | AC12 | Confirmed |

## 5. Assumptions and open questions

**No owner decision blocks this task.** All four that did are resolved and folded into §3 and §4: the card renders in
flow (§3.2), the bar is deleted (§3.3), favorite honours D69-25 and share joins it (§3.4).

| ID | Statement | Disposition |
|---|---|---|
| A1 | **RESOLVED by the owner 2026-09-06** — see **R11**. No longer an assumption |
| A2 | WhatsApp keeps `color="green"` from the pattern rather than production's `bg-whatsapp` | Accepted visual delta → owner matrix (D71-2) |
| A3 | Below `lg` the card sits after the amenities card and before the map/report/similar block, i.e. where `contentFooter` begins | **Reversible** — it is where the Grid's second column lands today; confirm rendered and report |
| UNKNOWN | The bar's height across its states is irrelevant now — nothing reserves space for it. No measurement is owed | — |
| **A4** | `expired` is in **neither** visibility group (`ARCHIVED: ['archived']`, `CLOSED: ['sold','rented']` — `listingSemanticLayer.ts:98-99`), so an **expired** listing today offers fully active Call / WhatsApp / Send-message while its own banner says it is expired. The owner's R11 instruction named archived only | **Reversible assumption:** `expired` is treated exactly like `archived` (R11). Conservative, and it matches what the banner already tells the user. Implement it, state it in the report, and the owner may return it |

## 6. Pre-read rule bundle

`docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (the three rows in §3.6 only) · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` · `docs/component-rules.md` · `docs/ui-rules.md` (legacy boundary only) ·
`docs/qa-rules.md` · `docs/storybook-governance.md` §14.9 and §15 · Sprint 71's **D71-1 · D71-2 · D71-3 · D71-4** ·
`docs/sessions/2026-06-23-task466-listingdetailview-mobile-fix.md` (§3.7) · Task 791's kickoff **§16.8** (the token
rule end to end) and **§21** (what that task did and did not close).

At source: `ListingContact.tsx` · `MantineListingContactPattern.tsx` · `MantineListingDetailPattern.tsx` (the D69-25
comment) · `ListingContactPattern.stories.tsx` · `ListingDetailView.tsx` · `ListingDetailView.stories.tsx` ·
`FavoriteButton.tsx` · `SaveToCollectionButton.tsx` · `getListingOwnerContact.ts` · `contactEvents.ts` ·
`scripts/task791-detail-evidence.mjs` · `theme.ts`.

## 7. Scope

`src/modules/listings/components/ListingContact.tsx` · `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`
(E-A, E-B, and removing its share button) · `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx`
(share joins the badges `Group`) · `src/modules/listings/components/ListingDetailView.tsx` (**only** the two slot
props) · `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` and
`ListingDetailPattern.stories.tsx` (a state per change) · `src/design-system/mantine/theme.ts` and
`__tests__/theme.d69-18.test.tsx` (R5) · `scripts/task791-detail-evidence.mjs` (R5, R9) ·
`scripts/mantine-migration-scope.json` · stale `docs/component-catalog.md` rows · `docs/backlog.md` · the session log.

## 8. Out of scope

`ListingGallery` / `LightboxView` / `GalleryStaticFrame` (**794**) · `ListingInquiryDialog` / `ListingReportDialog` /
`SaveToCollectionButton`'s own dialog (**795**) · `FavoriteButton`'s internals · `ListingBackButton` /
`ListingStatusBanner` / `[slug]/loading.tsx` (**792**) · `ListingMobileCTA.tsx` (Sprint 57) · the form family
(**796**) · the Storybook viewport defect (**799**) · story/prod state coverage (**800**) · any route, query or
server action · **new breakpoints or allowlist entries** (a new **token** is required wherever a raw value would
otherwise survive — D71-4).

## 9. Current and required behavior — visual source map and canonical UI decision record

| Visible artifact | Today | Token path | Disposition |
|---|---|---|---|
| Desktop sticky sidebar | `hidden lg:block sticky top-20`, `rounded-2xl border bg-card shadow-md p-5` | `--card`, `--border` | **changed** → the pattern (`pos`/`top` from `listingContactStickyOffset`) |
| Mobile contact surface | `lg:hidden fixed` bar | — | **deleted**; the same pattern renders in flow (`pos: static`) |
| Owner row · price · dividers · CTA rows · notice boxes | hand-rolled | — | **changed** → the pattern's composition |
| WhatsApp button | `bg-whatsapp` | `--whatsapp` | **changed** → `color="green"` (A2, owner matrix) |
| Loading spinner · SaveToCollection | hand-rolled | — | **changed** → E-B, E-A |
| Favorite · Share | secondary row of the card | — | **moved** → the badges row of `MantineListingDetailPattern` |
| Page bottom clearance | `listingContactBarClearance` | created by 791 | **deleted** → ordinary token spacing |

| Artifact | Canonical source | Disposition |
|---|---|---|
| Contact card | `Patterns/Mantine/ListingContactPattern` | **reuse + extend** (E-A, E-B) |
| Badges row with favorite + share | `Patterns/Mantine/ListingDetailPattern` (D69-25's `Group`) | **extend** |
| Everything else | — | preserved / deleted / owned elsewhere |

**No artifact needs a visual value without provenance. There is no `create canonical` here.**

## 10. Implementation requirements — phased, in this order

1. **Extend the canonical sources first.** E-A and E-B on the contact pattern; share into the detail pattern's
   badges `Group`; remove the contact pattern's own share button. One story state per change, and prove the
   pre-existing states render unchanged **before** any consumer composes them.
2. **Migrate the card.** `ListingContact` renders the extended pattern, passing the real triggers as nodes and the
   callbacks as function props (legal — the file is `'use client'`).
3. **Delete the bar** and re-home the archived-listing behaviour per A1.
4. **Move favorite and share** into the badges row; `ListingDetailView` gains exactly two slot props, neither
   carrying a function (R10).
5. **Delete the clearance** and every consumer in §3.5's four files, including the evidence script's expectations.
6. **Re-prove** the critical flows and register the migrated component in the manifest.

If any phase shows a canonical source cannot take the change without altering its existing rendered output, stop and
report a design blocker — do not absorb the difference in the consumer.

## 11. Positive and negative flows

**Positive.** A guest at 390px scrolls the listing, and after the amenities card the contact card appears in flow —
agent, price, Call, WhatsApp, Send message, and Save-to-collection — with no floating bar and no dead space at the
page bottom. Favorite and share sit together beside the badges above the title. Tapping WhatsApp fetches the digits
at click time and opens `wa.me`. At 1280px the same card is the sticky sidebar, and the lightbox still paints above it.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Validation | **No** | no form or schema changes | N/A | — |
| Authorization / RLS | **No** | the RPC and the tracking action are untouched | unchanged | `test:listings` |
| Offline / network | **Yes** | the click-time RPC | `toast.error(t('contact_load_failed'))`, spinner clears (E-B) | rendered + existing smoke |
| Concurrent writer | **No** | no write path | N/A | — |
| **Owner/listing states** | **Yes** | `ownerDeleted` · `ownerUnavailable` · `guestCta` · `closedListing` · archived · self-inquiry | each renders its documented composition; archived per A1 | one story state + one rendered cell each |
| **Long-locale overflow** | **Yes** | `uk`/`it` at 320 | no overflow; CTA labels wrap, never clip | rendered |
| **Stacking** | **Yes** | Task 612 | lightbox above header and card | evidence script |

## 12. Acceptance criteria

- **AC1 [R1]** — at 320 / 390 / 768 the contact card is in normal flow after the listing content, **no element on the page computes `position: fixed` at the viewport bottom**, and every affordance present before the change is present after, asserted by accessible name on a guest and an authenticated fixture. Archived: state and prove A1's behaviour.
- **AC2 [R2]** — favorite and share each appear **exactly once** in the DOM at 320 / 390 / 768 / 1280, adjacent in the badges row, and neither is inside the contact card. Assert both counts — a duplicated control is the failure mode this criterion exists for.
- **AC3 [R3]** — `ListingContact.tsx` has **zero** `@/components/ui/*` imports and no Tailwind utility `className`; `git diff --stat` shows `ListingDetailView.tsx` changed only by the two slot props.
- **AC4 [R4]** — E-A and E-B each have a story state; the contact pattern's five pre-existing states render byte-identically to `HEAD` (retain both serializations).
- **AC5 [R5]** — `grep -rn "listingContactBarClearance" src/ scripts/` returns **nothing**; the page's rendered `padding-bottom` at 320 / 390 / 768 / 1280 equals the token-expressed ordinary value with no residual clearance; the last content element is fully reachable at the end of the scroll. Report before/after per width.
- **AC6 [R6]** — no phone or WhatsApp digits in the SSR HTML (assert on the served payload); the WhatsApp path still calls `trackListingContactEvent`; the guest CTA still opens the auth sheet; the self-inquiry and closed-listing guards behave as before.
- **AC7 [R7]** — Task 612's stacking assertion passes at 390 / 1280 × `sq` / `uk`; `test:listings` exits 0.
- **AC8 [R8]** — no raw pixel in the diff: grep the consumers and quote the grepped definition line of any created token. **A green `check:design-tokens --scope=mantine` is not evidence** — Task **797** records why its regex cannot see a responsive object prop.
- **AC9 [R9]** — `grep -rn "listing-contact-mobile\|listingContactBarClearance" src/ scripts/ docs/` returns only historical prose, **every hit enumerated and classified**; `node scripts/task791-detail-evidence.mjs` runs and passes with its expectations updated; `vitest run src/design-system/mantine/__tests__` shows no assertion referencing the deleted token and no new failure beyond Task 790's standing one.
- **AC10 [R10]** — `ListingDetailView.tsx` passes no function-valued prop; the share handler is inside a `'use client'` file. Proven by source read **and** by a real `next start` request returning 200 with the card in the HTML — a green build does not cover a `ƒ` route (D71-1).
- **AC12 [R11]** — on an archived listing at 390 and 1280: the contact card renders; Call / WhatsApp / Send-message are **disabled** (assert the disabled state, not merely a visual difference); **share is enabled and produces the listing URL**; **favorite is disabled**. Repeat for an expired listing per **A4**, and repeat for a `sold` listing to prove the pre-existing `closedListing` behaviour did not change.
- **AC11** — `npm run build` exit 0, then `next start` with 200 on `/sq/listings/<slug>` and `/uk/listings/<slug>`.

## 13. QA profile and verification plan

**`Q3`** — a migrated component with five states on a route carrying three critical-flow rows, a deletion that
changes every mobile page of that route, and a relocation visible at every breakpoint.

Windows-native PowerShell only. Every log must post-date every changed source file — Task 791 was returned twice for
stale transcripts.

```powershell
$slug = "11-mr7ucly4"
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:i18n
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run governance:components
npm.cmd run test:listings
npx.cmd vitest run src/modules/listings
npx.cmd vitest run src/design-system/mantine/__tests__
npm.cmd run build-storybook
npm.cmd run build
```

Then, in a second PowerShell window:

```powershell
npm.cmd run start
```

Then, back in the first window:

```powershell
$slug = "11-mr7ucly4"
node scripts/task791-detail-evidence.mjs
curl.exe -s -o NUL -w "%{http_code}`n" "http://localhost:3000/uk/listings/$slug"
curl.exe -s -o NUL -w "%{http_code}`n" "http://localhost:3000/sq/listings/$slug"
```

Expected: `win32`; every gate exit 0; the scoped detector `0 violations`; the evidence script passes with its
clearance checks **replaced** by AC5's; both `curl` `200`. Return the evidence script's final line, the `build` exit
code, and AC5's measured before/after table.

**`OWNER VISUAL QA REQUIRED`** (D71-2). ⚠️ The viewport dimension is not reviewable in Storybook until Task **799**
is fixed; until then review the width dimension on the **live route**, which resizes normally.

| Surface | State | Locale | Viewport |
|---|---|---|---|
| Live `/{locale}/listings/{slug}` | guest | sq, uk | 320, 390, 768, 1280 |
| Live `/{locale}/listings/{slug}` | authenticated | uk | 390, 1280 |
| Live, **archived** listing — CTAs disabled, share live, favorite disabled | any | en, uk | 390, 1280 |
| Live, **expired** listing (A4) | any | en | 390 |
| `Patterns/Mantine/ListingContactPattern` | all five states + E-A + E-B | en, uk | 1280 (until 799) |
| `Patterns/Mantine/ListingDetailPattern` | badges row with favorite + share | uk | 1280 (until 799) |

## 14. Completion report contract

Files changed and **deleted** · requirement IDs and the AC that closed each · commands with real exit codes,
platform, Node version, cwd · **AC9's reference census with every hit classified** · AC5's measured before/after
padding table · AC6's SSR-payload assertion · AC7's stacking result · A1's archived-listing decision as implemented ·
the E-A/E-B story states and the proof the pre-existing states are unchanged · assumptions, deviations, limitations ·
status `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Update `docs/backlog.md`,
the Sprint 71 Tasks row **and** the session log in the same edit.

## 15. Task quality gate

Executable cold — every path, prop, token, line reference, command and count above was read or measured at source on
2026-09-06 · every requirement has a binary AC · scope names what must not change, and R6 lists the five behaviours
easiest to lose in a rewrite · canonical-first: `reuse + extend` only, no `create canonical`, no local styling
authorized · the permanent-story gate is satisfied by states on **existing** canonical stories with a real in-scope
production consumer · detector-aware: AC8 refuses the scoped gate's exit code as proof and cites 797 · every owner
decision is quoted, not paraphrased, and §3.7 names the two earlier decisions this task reverses · the deletion
carries a reference census (AC9) because this repo has been bitten by that exact gap three times · commands are a
paste-ready block per the 2026-09-06 rule · no superseded claim survives: this file was rewritten rather than amended.

---

`FACTS` — `ListingContact.tsx` is 423 lines with 75 `className` occurrences and 2 `@/components/ui/*` imports ·
the mobile bar is `:307-309`, gated by `!listingArchived` · favorite `:268`, SaveToCollection `:277`, share
`:287-293` with `handleShare` `:111` and `copied` `:67` · `MantineListingContactPattern` is `pos: static` below `lg`
and has no mobile bar and no favorite slot · `listingContactBarClearance` has consumers in four files, one of which
`throw`s when the regex fails · `ListingMobileCTA.tsx` still has `bottom-14` and zero consumers.

`INFERENCES` — `ListingContact` being `'use client'` is what makes the function props legal, so the migration lives
inside it and Task 791's seam is untouched.

`UNKNOWNS` — whether `expired` follows the archived rule (**A4**, reversible; it is in neither visibility group and has no CTA gate today).

`CONFLICTS` — None open.

**Task path:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_793_ListingContact_Canonical_Mantine_Card.md`
**QA profile:** `Q3` · **Owner decisions required before dispatch:** none. **Executable.**
