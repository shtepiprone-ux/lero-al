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

---

## 16. Orchestrator review — `NEEDS REVISION` (2026-09-06)

**One requirement has no evidence of any kind, and it can be closed without the owner and without a database.**
Everything else is verified. This is a narrow return, not a rejection.

### 16.1 Verified by the reviewer at source — do not redo

| Claim | Reviewer's own result |
|---|---|
| R3 — the card is canonical | `ListingContact.tsx`: **0** `@/components/ui/*` imports, **0** `className` occurrences, **0** references to the deleted bar. Was 2 / 75 / 1 |
| R5 — the clearance is gone | The only surviving `listingContactBarClearance` hits are **three explanatory comments** in the evidence script. See §16.4 — my AC5 was the defect, not this |
| R10 — the RSC boundary | `ListingShareButton.tsx` is `'use client'`; `ListingDetailView.tsx:215` passes it **string props only** (`listingTitle`, `listingUrl`). No function crosses the boundary — the P0 class from Task 791 is not repeated |
| R2 mechanism | `ListingDetailView.tsx:426-427` passes `favorite={favoriteSlot}` and `share={shareSlot}` into the pattern's badges row |
| Evidence freshness | Sources 10:27-10:52, every artifact 10:52-10:53. Post-dates the diff — the failure this task's predecessor was returned for twice does not recur |
| Files Changed honesty | The session log **does** name `scripts/task612-qa-listinggallery-lightbox-portal.mjs` (`:53`) and classifies it correctly as an ad-hoc non-CI script. Only the chat summary omitted it |

**The harness was strengthened, not weakened — checked because that is the classic failure mode here.** The full
diff to the Task 612 script is a comment plus **one selector line**; its verdict logic is untouched. And in
`task791-detail-evidence.mjs` the executor replaced a probe that could no longer run with a **stronger**
unconditional assertion — `dialogCoversViewport` is asserted on every cell, and covering the whole viewport subsumes
covering wherever the card happens to be. The reasoning is also right: Task 612's scroll-lock means a probe point
outside the viewport proves nothing. This is the correct engineering answer to a migration that moved a node.

### 16.2 Blocking finding

**F1 · P2 · [R11, R4, AC12] · `contactDisabled` has no standalone proof, and R11 has no rendered proof at all.**

*Observed:* the executor added a third capability to the canonical pattern — `contactDisabled`, carrying the owner's
archived/expired rule — and `grep -n "contactDisabled\|archived\|disabled" src/stories/patterns/mantine/ListingContactPattern.stories.tsx`
returns **nothing**. E-A and E-B got story states; the capability that implements a P0 owner instruction did not.
*Expected:* §10 phase 1 — a canonical extend is proven standalone **before** the consumer composes it; AC12 —
rendered proof for archived, expired and sold.
*Why the executor's explanation only covers half:* the seeded DB has one active listing, which explains the missing
**live-route** proof. It does not explain the missing **story** proof — a story state is hand-written fixture data
and needs no database. The sold/rented arm is the sharpest gap: the executor's own design note says they
deliberately did **not** use the pattern's `closedListing` state because it would have removed Call/WhatsApp from
sold listings. That is a real and correct catch — and it is exactly the kind of claim that must be shown rendered,
not argued.
*Resolution:*
1. Add a `contactDisabled` section to `Patterns/Mantine/ListingContactPattern` showing Call / WhatsApp /
   Send-message **disabled** while share stays enabled.
2. Add a section proving the untouched `closedListing` (sold/rented) path still renders Call and WhatsApp
   **enabled** with only Send-message disabled — this is the regression the design note claims to have avoided.
3. Add an `archived` state to `Patterns/Mantine/ListingDetailView`, whose fixture is hand-written
   (`ListingDetailView.stories.tsx` already declares `status` in `baseListing`).
*Verification:* the three states render in `build-storybook`, and the owner reviews them in the §13 matrix. Live-route
proof for archived stays owed and is recorded as a limitation until the DB has a non-active listing — do **not**
seed production data to satisfy it.

### 16.3 Non-blocking

- **P3 — the Task 612 script now proves strictly less on mobile, and nothing says so.** Its pre-existing verdict
  line `&& (data.contactCardVisibleInViewport ? data.contactCardCoveredByDialog : true)` skips the contact-occlusion
  assertion when the card is not in the viewport. Before this task the mobile contact surface was `position: fixed`
  and therefore always in the viewport, so the assertion always ran; now the card is in flow and below the fold, so
  on mobile it silently stops asserting. The executor compensated for exactly this in
  `task791-detail-evidence.mjs` and did not port that compensation here. It is an ad-hoc non-CI probe (confirmed: no
  `package.json` script, no `.github/` reference), which is why this is P3 — but it is the artifact
  `docs/critical-flow-registry.md` names for that flow. *Resolution:* port the unconditional `dialogCoversViewport`
  assertion into its verdict, or record the coverage decrease in the registry row. Either closes it.
- **NOTE** — `scripts/task791-detail-evidence.mjs` carries CRLF line endings; `.gitattributes` normalises on commit
  (`* text=auto eol=lf`) and `check:file-integrity` passed. No action.
- **NOTE** — declining to regenerate `catalog:components` (which would have reset ~30 unrelated components' review
  status) and hand-editing the affected rows instead was the right call. A diff that resets unrelated governance
  state to satisfy one task is worse than the staleness it fixes.

### 16.4 Task-design defect — mine

**AC5 and AC9 contradict each other about the same grep.** AC5 demanded
`grep -rn "listingContactBarClearance" src/ scripts/` return **nothing**; AC9 permits historical prose for the same
census. The three surviving hits are comments in the evidence script explaining that the token was deleted — which
AC9 allows and AC5 forbids. **AC9 is the correct formulation; AC5 is amended to match it.** Not an executor defect,
and not a reason to touch those comments.

### 16.5 Revision 1 verification plan

```powershell
npm.cmd run check:stories
npm.cmd run build-storybook
npm.cmd run typecheck
npm.cmd run lint
```

Expected: every command exit 0, and the three new story sections present in the built Storybook. Return the exit
codes and the section names. **Do not re-run the live evidence script** — nothing it measures changed.

Non-command step, after the block: open `Patterns/Mantine/ListingContactPattern` and confirm the three states
render as described in F1's resolution.

---

## 17. Revision 1 amendment — two owner-reported defects, verified at source (2026-09-06)

The owner reviewed the rendered result and reported two defects. **Both are real, both are reproduced at source
below, and one of them reverses a design decision this task shipped deliberately.** The verdict stays
`NEEDS REVISION`; F1 is unchanged and F2/F3/F4 are added to the same revision.

### 17.1 F2 · P1 · The sold/rented design note is itself the defect — `contactDisabled` must include CLOSED

*Owner instruction, verbatim (2026-09-06):*
> На сторінці оголошення, яке має статус 'Здано'/'Продано' я все ще бачу активні кнопки подзвонити та написати у
> WhatsApp, хоча ці кнопки мають бути заблоковані(деактивовані).

*Observed at source* — `src/modules/listings/components/ListingContact.tsx:93`:

```ts
const contactLifecycleDisabled = listingArchived || listingExpired
```

and `:212` `contactDisabled={contactLifecycleDisabled}`. The executor's own comment at `:91-92` states the intent
explicitly: *"Distinct from `listingClosed` (sold/rented), whose Call/WhatsApp stay ACTIVE today — only
Send-message is disabled — unchanged (kickoff §3.5b)."*

*Status of that decision:* **superseded by the owner.** The executor read the existing behaviour correctly and
preserved it correctly under the kickoff as written — this is not an implementation error. It is a requirement the
kickoff got wrong. §3.5b and R11 said archived/expired; the owner has now ruled that CLOSED (sold/rented) carries
the same contact lockout. **R11 is hereby extended:** Call, WhatsApp and Send-message are disabled for
`archived`, `expired`, `sold` and `rented`. Share stays enabled in all four. Favorite stays disabled in all four
(already true — `ListingDetailView.tsx:197`).

*Resolution:* extend the lifecycle predicate to cover CLOSED and give it a label. All four `action_disabled_*`
keys already exist in all four locales (`messages/uk.json:205-208`) — no new i18n keys are needed for F2.
`closedLabel` at `:99` already resolves `action_disabled_sold` / `action_disabled_rented`; fold it into
`contactDisabledLabel` rather than leaving two parallel label variables.

*Do not lose:* `state='closedListing'` renders the sold/rented headline block at
`MantineListingContactPattern.tsx:181`. That state stays. `contactDisabled` is orthogonal to it by construction
(`:198-214` gate the buttons on `contactDisabled`, not on `state`) — so the correct fix composes them, and does
**not** replace one with the other. F1's story requirement #2 changes accordingly: the `closedListing` section must
now prove Call and WhatsApp **disabled**, not enabled.

### 17.2 F3 · P1 · `status_banner_pending` renders as a raw i18n key — two statuses have no banner copy

*Owner-observed:* the literal string `listing.status_banner_pending` rendered in place of a message.

*Reproduced at source.* `ListingDetailView.tsx:407-411` renders the banner whenever
`!isListingVisible(listing.status)`. Per `VISIBILITY_DB_STATUSES` (`listingSemanticLayer.ts:95-100`) that predicate
is true for **six** statuses — `inactive`, `pending`, `expired`, `archived`, `sold`, `rented`. `messages/*.json`
defines banner copy for **four**:

| Status | Reaches the banner | `status_banner_*` key | `STYLES[status]` |
|---|---|---|---|
| `sold` · `rented` · `archived` · `expired` | yes | present (4 locales) | present |
| `pending` | yes | **missing — renders the raw key** | **`undefined`** |
| `inactive` | yes | **missing — renders the raw key** | **`undefined`** |

*Root cause — a cast that lies to the compiler.* `:408` reads
`status={listing.status as 'sold' | 'rented' | 'archived' | 'expired'}`. `ListingStatus` has seven members
(`src/types/database.ts:43`); the cast narrows it to four with no runtime check, so TypeScript could not see either
gap. **F4 below is the second gap the same cast conceals.**

*Pre-existing, not introduced here.* `git log -S "status_banner_"` attributes the block to Task 237. It is in scope
for this revision because the owner reported it against this task's rendered output and because the fix is adjacent
to F2's, not because 793 caused it.

*Resolution — one of these two, executor's choice, stated in the completion report:*
1. **Narrow the render condition** so the banner only renders for the four statuses that have copy, and let the
   HIDDEN statuses (`pending`, `inactive`) fall through to the existing `previewBanner` path that already handles
   the unpublished case; **or**
2. **Add `status_banner_pending` and `status_banner_inactive`** to all four locale files plus `STYLES` entries in
   `ListingStatusBanner.tsx`.

Whichever is chosen, **the cast at `:408` must be replaced by a real narrowing** — a typed predicate or a lookup
whose failure is visible to `tsc`. A fix that leaves the cast in place fixes today's two statuses and leaves the
next status addition to fail the same way.

### 17.3 F4 · P2 · The same cast leaves `ListingStatusBanner` unstyled for the same two statuses

`ListingStatusBanner.tsx:10-15` indexes `STYLES` by the same four-member union. For `pending` and `inactive`,
`STYLES[status]` is `undefined`, and `cn('listing-status-banner …', undefined)` emits the banner with **no border,
background or text colour** — an unstyled block, not a coloured alert. Closed by whichever branch of F3 is taken;
listed separately so that branch 2 is not implemented without its `STYLES` rows.

### 17.4 What this changes about the review, honestly

§16.2 called the executor's sold/rented design note *"a real and correct catch"*. It was correct as an observation
about existing behaviour and correct against the kickoff I wrote — and it preserved a behaviour the owner considers
a defect. That is the argument for F1 restated in the sharpest possible terms: **a claim defended in prose and
never rendered is a claim nobody can review.** Had the `closedListing` state existed as a story, the owner would
have seen live Call/WhatsApp buttons on a sold listing during the §13 matrix and caught this before implementation,
not after. F1 stays P2 and stays blocking.

### 17.5 Revision 1 scope — consolidated

| # | Finding | Priority | Files |
|---|---|---|---|
| F1 | Three story states: `contactDisabled`, `closedListing`, `ListingDetailView` `archived` | P2 | `ListingContactPattern.stories.tsx`, `ListingDetailView.stories.tsx` |
| F2 | Extend the lifecycle lockout to `sold`/`rented`; merge the two label variables | P1 | `ListingContact.tsx` |
| F3 | Banner copy gap for `pending`/`inactive` + replace the four-member cast | P1 | `ListingDetailView.tsx`, `messages/*.json` **or** render condition |
| F4 | `STYLES` rows, if F3 branch 2 is taken | P2 | `ListingStatusBanner.tsx` |
| P3 | Task 612 script mobile assertion (§16.3) | P3 | `task612-qa-…mjs` **or** `critical-flow-registry.md` |

**AC13 (new):** the `closedListing` story section shows Call, WhatsApp and Send-message disabled with Share
enabled. **AC14 (new):** no route reachable through `ListingDetailView` renders a raw `listing.*` i18n key for any
of the seven `ListingStatus` members, and this is shown by narrowing rather than asserted.

### 17.6 Revision 1 verification plan — paste-ready

```powershell
cd C:\Claude_Code_Projects\lero-al
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build-storybook
```

Status-copy census — every status that can reach the banner must have copy in every locale:

```powershell
cd C:\Claude_Code_Projects\lero-al
Get-ChildItem messages\*.json | ForEach-Object {
  $n = $_.Name
  'sold','rented','archived','expired','pending','inactive' | ForEach-Object {
    $k = "status_banner_$_"
    $hit = Select-String -Path "messages\$n" -Pattern $k -SimpleMatch -Quiet
    "{0,-10} {1,-26} {2}" -f $n, $k, $(if ($hit) { 'OK' } else { 'MISSING' })
  }
}
```

Contact-lockout census — the predicate must name all four lifecycle statuses:

```powershell
cd C:\Claude_Code_Projects\lero-al
Select-String -Path src\modules\listings\components\ListingContact.tsx -Pattern 'contactLifecycleDisabled\s*=' -Context 0,1
Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern "as 'sold' \| 'rented'"
```

Expected: every command exit 0; the census prints `OK` on every row **or** the render condition no longer admits
`pending`/`inactive`; the second census shows the predicate covering closed listings and **no** four-member cast
surviving.

Non-command step, after the blocks: open `Patterns/Mantine/ListingContactPattern` and
`Patterns/Mantine/ListingDetailView` and confirm the four sections from F1 and F2 render as described.

---

## 18. Orchestrator review — Revision 1 — `APPROVED WITH NOTES` (2026-09-06)

**All five returned findings are closed, and each was verified by the reviewer reading the shipped source — not by
reading the completion report.** The one non-green gate is a bounded, arithmetically-reconciled exception, accepted
below with a constraint attached.

### 18.1 Findings — verified closed at source

| # | Claim | Reviewer's own result |
|---|---|---|
| **F1** | Three story states | `ListingContactPattern.stories.tsx:147-198` — a `contactDisabled` section (`state="normal"` + `contactDisabled`) and a `closedListing` section (`state="closedListing"` + `contactDisabled`) both present. `ListingDetailView.stories.tsx:210` — `ArchivedListing` export, `status: 'archived'`, and correctly `isGuest: false` + a real `listingId` so the disabled favorite actually renders rather than being omitted by the guest gate. **Closed** |
| **F2** | Lockout extended to CLOSED | `ListingContact.tsx:97` — `listingArchived \|\| listingExpired \|\| listingClosed`. `:182` `inquiryNode` now keys off the single predicate; `:225` feeds it to `contactDisabled`. The two label variables are merged into one `contactDisabledLabel` (`:100-106`) resolving all four `action_disabled_*` keys. **Closed** |
| **F3** | Real narrowing, not a cast | `listingSemanticHelpers.ts:65` — `isListingNonActiveStatus(status): status is Exclude<ListingStatus, 'active'>`, derived from `isListingVisible` so it cannot drift from `VISIBILITY_DB_STATUSES`. `ListingDetailView.tsx` call site carries **no cast**. Exported through `domain/index.ts:39`. Locale census: **24/24 `OK`** — all six statuses × all four locales. **Closed** |
| **F4** | `STYLES` widened | `ListingStatusBanner.tsx` — `Props['status']` is now `Exclude<ListingStatus, 'active'>` and `STYLES` has six rows. `pending`/`inactive` reuse `--status-warning`, whose own doc comment names those two statuses. **Closed** |
| **P3** | Task 612 mobile assertion | `:166` — `&& data.dialogCoversViewport`, unconditional, outside the `contactCardVisibleInViewport` ternary. The fail-open branch survives but no longer decides the cell alone. **Closed** |

**The F3 fix is better than what was asked for.** The brief permitted either narrowing the render condition or
adding the copy; the executor did both, and derived the predicate from the semantic layer rather than hand-listing
six members. A seventh status added to `ListingStatus` now fails `tsc` at `STYLES` instead of rendering a raw key
in production. That is the difference between fixing two statuses and closing the class.

### 18.2 The one non-green gate — accepted, bounded, pinned

`check:locale-leak:mantine-only` exits **1** with **131** leaks. Accepted, because the attribution is arithmetic
rather than asserted:

- Pre-Revision-1 count: **107**. Post: **131**. Delta: **exactly 24**.
- The session log's R5 table gives `Patterns/Mantine/ListingDetailView/Public Listing` = **24** and the new
  `Patterns/Mantine/ListingDetailView/Archived Listing` = **24**, same family (Leaflet chrome + the `Elira Hoxha`
  fixture name), and the per-export census sums to 131 exactly.
- `131 − 24 = 107` — the pre-revision total, unchanged. **Every leak in the delta is one required new story export
  reproducing Task 798's already-filed family on a component that already leaked it three times over.**

Zero leak lines trace to F2, F3 or F4 — the new `status_banner_*` values are real translations in all four locales,
and the new story sections use `storyT()`.

**Constraint attached to this acceptance:** 131 is now the pinned baseline. Any later count above 131 that is not
explained by a new `ListingDetailView` story export is a regression, not an inheritance, and must not be waved
through by citing this paragraph. Task **798** owns bringing it to 0.

### 18.3 Notes — non-blocking, no revision

- **N1 · The session log's §1 R-table is stale against its own Revision 1.** Row **R6** still reads *"`listingClosed`
  still renders a disabled Send-message placeholder with `closedLabel`, Call/WhatsApp remain active (unchanged)"*
  and row **R11** still reads `contactLifecycleDisabled = listingArchived || listingExpired`. Both describe
  Revision 0 and are contradicted by `ListingContact.tsx:97`. Appending a Revision 1 section rather than rewriting
  the table is the right instinct for an append-only evidence log — but a reader grepping `R11` gets the superseded
  answer with nothing marking it superseded. *Resolution (fold into the next task in this file, do not reopen 793):*
  add `— SUPERSEDED by Revision 1 F2, see §Revision 1` to those two rows.
- **N2 · Both new contact story sections pass the same `listing_detail_closed_label`.** The `contactDisabled`
  section exists to prove the **archived/expired** tooltip; it currently displays the sold/rented copy. The disabled
  state renders correctly — only the label string is the wrong one of the four, in the story whose purpose is to
  show that label. Cosmetic, story-only, no production path affected.
- **N3 · R11's live-route proof stays owed and stays out of scope.** This sandbox's seeded DB has one `active`
  listing. The `ArchivedListing` story is the accepted substitute, which is what the return asked for. **Do not seed
  production-shaped data to close this.** It closes when the environment has a non-active fixture.
- **NOTE** — the executor declining to re-execute a replayed completion report, and saying so plainly rather than
  redoing finished work or assuming the reviewer's role, was correct. A duplicate delivery is not a new instruction.

### 18.4 Owner verification — paste-ready

```powershell
cd C:\Claude_Code_Projects\lero-al
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run build-storybook
```

Status-copy census — must print `OK` on all 24 rows:

```powershell
cd C:\Claude_Code_Projects\lero-al
Get-ChildItem messages\*.json | ForEach-Object {
  $n = $_.Name
  'sold','rented','archived','expired','pending','inactive' | ForEach-Object {
    $k = "status_banner_$_"
    $hit = Select-String -Path "messages\$n" -Pattern "`"$k`"" -SimpleMatch -Quiet
    "{0,-10} {1,-26} {2}" -f $n, $k, $(if ($hit) { 'OK' } else { 'MISSING' })
  }
}
```

Lockout and cast census — must show all four statuses in the predicate and **no** surviving four-member cast:

```powershell
cd C:\Claude_Code_Projects\lero-al
Select-String -Path src\modules\listings\components\ListingContact.tsx -Pattern 'contactLifecycleDisabled\s*='
Select-String -Path src\modules\listings\components\ListingDetailView.tsx -Pattern "as 'sold' \| 'rented'"
Select-String -Path src\modules\listings\domain\listingSemanticHelpers.ts -Pattern 'isListingNonActiveStatus'
```

Leak baseline — the count must be **131**, not merely non-zero:

```powershell
cd C:\Claude_Code_Projects\lero-al
npm.cmd run check:locale-leak:mantine-only
```

**Visual step, in the Storybook you have running (rebuild it first — the sections are new):**

1. `Patterns/Mantine/ListingContactPattern` → the **contactDisabled** section: Call, WhatsApp and Send-message all
   greyed and unclickable; the save/favorite trigger still present.
2. Same story → the **closedListing** section: the sold/rented headline block **and** Call/WhatsApp/Send-message
   disabled together. This is the F2 fix — before Revision 1 those two buttons were live here.
3. `Patterns/Mantine/ListingDetailView` → **Archived Listing**: the status banner renders real Albanian/Ukrainian
   copy (no `listing.status_banner_*` raw key), the contact card is visible with contacts disabled, favorite is
   disabled in the badges row, and **Share is still enabled**.
4. `Patterns/Mantine/ListingDetailView` → **Staff Preview Unpublished** (`status: 'pending'`): this is the F3/F4
   regression case — the banner must show real copy on an amber background, not the raw key on an unstyled block.

Expected: every command exit 0 except the leak check, which exits 1 with exactly **131**.

### 18.5 Scope of this verdict — stated fail-closed

The reviewer verified **F1, F2, F3, F4 and P3 by reading the shipped source on the owner's machine**, and verified
the locale-leak attribution **arithmetically** against the session log's own per-export census. That is real
evidence and it is why the verdict is `APPROVED WITH NOTES` rather than `PARTIALLY VERIFIED`.

What the reviewer did **not** do is run the gates. Per **D71-1** and the standing Windows-native evidence rule,
gate output produced anywhere but the owner's own PowerShell is an environment screen, not repository evidence.
**Task 793 archives when the §18.4 block comes back clean from the owner's machine** — every command exit 0 except
`check:locale-leak:mantine-only`, which must exit 1 at **exactly 131**. A different leak count, a failing command,
or a visual step that does not match §18.4's four descriptions **reverts this verdict to `NEEDS REVISION`** and
reopens as Revision 2. Nothing about this paragraph is a formality: 131 is a specific falsifiable number, and the
four visual descriptions are specific falsifiable renders.
