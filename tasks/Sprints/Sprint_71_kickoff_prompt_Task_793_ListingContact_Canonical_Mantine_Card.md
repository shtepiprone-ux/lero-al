# Task 793 — `ListingContact` onto the canonical Mantine contact card, and the clearance it reserves

**Sprint:** 71 · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-05 · **State:** `KICKOFF FILED — EXECUTABLE`

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. Frontend exception: **no review
ledger**.

**Every measured fact below was read or measured at source on 2026-09-05.** The rendered numbers come from a live
`next start` on the Task 791 Revision 1 build, at a real seeded listing, via computed-style capture — not from a
document. **Re-measure at execution.**

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **component migration onto an existing canonical Mantine pattern**,
plus one **coupled layout-token correction** that Task 791 deliberately left open. Mixed migration: the card's own
children (`FavoriteButton`, `SaveToCollectionButton`, the two dialogs) stay legacy by design and are named with the
task that owns each.

## 2. Objective

`src/modules/listings/components/ListingContact.tsx` (423 lines, **75** `className` occurrences — the largest
Tailwind file left on this route) stops hand-rolling the contact card and renders the canonical
`MantineListingContactPattern`. In the same change, the page clearance that reserves space for its fixed mobile bar
is re-derived from the bar's real height, closing the coupling Task 791 preserved verbatim and Task 787 left half
open.

## 3. Verified context

### 3.1 The seam Task 791 built — do not touch it

`ListingDetailView.tsx` (a **Server Component**) passes `<LazyListingContact …>` into
`MantineListingDetailPattern`'s `contactSlot` (Task 791 E2). `ListingContact` is `'use client'`.

`INFERENCE`, and it is the design of this task: because `ListingContact` is already a client component, **it can
render `MantineListingContactPattern` itself** and pass the function props (`onCall`, `onWhatsApp`, `onShare`,
`onLogin`) that a Server Component cannot. So this migration happens *inside* `ListingContact`, and
`ListingDetailView.tsx` is **not edited at all**. The `contactSlot` seam, the RSC boundary and the LCP subtree are
untouched.

⚠️ Task 791 Revision 1 shipped a P0 caused by exactly this boundary: a `galleryLabels` object containing a
`counter` arrow function was passed from the Server Component into the client pattern and **the route errored on
every request** while `build`, `curl` 200 and `check:hydration` all stayed green. See
`docs/orchestrator-procedures.md`'s 791 corollary. **Do not pass a function from `ListingDetailView` to anything.**

### 3.2 The five measured divergences — the real work

`MantineListingContactPattern` (261 lines) mirrors the **desktop sticky sidebar** and its five states
(`normal` / `guestCta` / `ownerDeleted` / `ownerUnavailable` / `closedListing`). It does not cover:

| # | Production has | Pattern has | Disposition |
|---|---|---|---|
| D1 | A second, **`lg:hidden fixed` mobile bar** (`ListingContact.tsx:307-…`) with its own price row, a 640px-gated phone/WhatsApp arrangement and its own inquiry trigger | one responsive `Paper` (`pos={{base:'static', lg:'sticky'}}`) — **no mobile bar at all** | **§5 R1 — owner decision required before code** |
| D2 | `SaveToCollectionButton` in the secondary-action row | no slot | `extend` |
| D3 | Call/WhatsApp disabled + `Loader2` spinner while `getListingOwnerContact` resolves | no loading state | `extend` |
| D4 | Share label toggles to `t('link_copied')` for 2s after a clipboard fallback | static `labels.share` | `extend` |
| D5 | WhatsApp button uses `bg-whatsapp` | `color="green"` | owner visual (D71-2) |

### 3.3 ⚠️ The favorite button moves, and that is a visible change

`ListingContact` renders `FavoriteButton` in its secondary-action row. The canonical pattern **cannot** take it:
Task 784's **D69-25** (owner instruction, 2026-09-04) moved the favorite out of the contact card entirely, into
`MantineListingDetailPattern`'s badges row, right-aligned, at every breakpoint — the comment is in that file.

`FACT`: Task 791 does **not** pass `favorite` to the pattern (read at source), so today the favorite still renders
inside the legacy `ListingContact`. Adopting the pattern therefore **moves the favorite from the sidebar to the
badges row** — which requires `ListingDetailView.tsx` to start passing `favorite`, contradicting §3.1's "do not
edit that file".

**This is a `CONFLICT`, and it is the task's first decision, not something to resolve while coding.** See §5 R2.

### 3.4 ⚠️ The clearance coupling, measured

Live at **390px**, guest state, seeded listing:

| Quantity | Measured |
|---|---|
| Mobile bar height | **134px** |
| Bar offset from viewport bottom | **56px** before Task 791's follow-up edit, **0px** now |
| Space the bar occupied | **190px** (134 + 56) |
| Page clearance reserved (`theme.other.layout.listingContactBarClearance.base`) | **176px** |

Two consequences, both `FACT`:

1. Before the edit the reservation was **14px short** — content was already slipping under the bar.
2. After the edit (`ListingContact.tsx:309` is now `fixed bottom-0`, applied 2026-09-05 under owner authorisation)
   the bar occupies 134px against a 176px reservation → **~42px of dead tail** at `base`. That is precisely the
   defect Task 787's exit criterion 3 names.

**Do not fix this by subtracting 56 from 176.** 134px is one state (guest CTA) of one listing at one locale. The
bar's height varies with: guest vs authenticated, `has_phone` / `has_whatsapp` combinations, the `<640` layout where
WhatsApp takes its own row, and label length across `sq`/`uk`/`it`. The `md` value (80px) needs the same treatment.

### 3.5 What is on this route that must not regress

`docs/critical-flow-registry.md` names two rows this task touches:

- **Listing-detail gallery lightbox stacking (Task 612)** — asserts the lightbox paints above the header **and the
  sticky contact card**. This task changes that card's positioning mechanism (`pos`/`top` responsive props vs the
  legacy `sticky top-20`), so the stacking proof must be re-run. Task 791's evidence script already measures it.
- **Inquiry / send message** and **Report listing** — the triggers live inside this card. They are passed as
  `inquiryTrigger` / `reportTrigger` nodes; their dialogs are **795**'s. `npm run test:listings` must stay green.

Also live inside this file and easy to lose: `trackListingContactEvent` (WhatsApp only), the
`getListingOwnerContact` RPC that fetches digits on click (Task 266 — digits are **never** in the SSR HTML),
`openAuthSheet('login')`, and the archived-listing suppression (`!listingArchived` gates the whole mobile bar).

### 3.6 Facts that remove plausible blockers

- `MantineRootProvider` is in the **root** `src/app/layout.tsx:50`, so both the public route and
  `/admin/listings/[id]/preview` are inside a provider.
- `theme.other.layout.listingContactStickyOffset` = **80** already exists and is what the pattern consumes for its
  `lg` sticky offset — the legacy `sticky top-20`. Do **not** confuse it with the clearance token.
- `ListingMobileCTA.tsx` has **zero consumers** (re-measured 2026-09-05) and still carries `bottom-14`. It is a
  Sprint 57 deletion candidate, **not** this task's.

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| **R1** | OD-1, OD-1b | The contact card renders **in flow beneath the listing content** below `lg` (the pattern's own `pos: static`), and the fixed mobile bar is **deleted**. Every affordance the bar carried — price, call, WhatsApp, send-message, the guest login CTA, the owner-deleted notice — is present in the in-flow card, and the archived-listing suppression is re-homed, not dropped | P0 | AC1 | **Confirmed** |
| **R2** | §3.3, OD-2, OD-3 | The favorite renders **in the badges row** (D69-25), passed from `ListingDetailView` as `favorite`, and no longer in the contact card. **Share sits immediately to its right, in that same row, at every breakpoint** (owner instruction 2026-09-06, modelled on dom.ria's `Поділитися · В обране` pair) and is removed from the contact card's action stack. Staff-preview inertness preserved for both | P0 | AC2 | **Confirmed** |
| **R3** | §3.1 | `ListingContact.tsx` renders `MantineListingContactPattern` for the desktop sidebar; **zero** `@/components/ui/*` imports remain except non-shadcn `AppImage`; `ListingDetailView.tsx` is not edited | P0 | AC3 | Confirmed |
| **R4** | §3.2 D2-D4 | The pattern is extended for `SaveToCollectionButton`, the contact-loading state and the copied-share label — in the canonical source, with a story state each, before the consumer composes them | P0 | AC4 | Confirmed |
| **R5** | OD-1b, §3.4 | With the bar gone, **no clearance survives**: `listingContactBarClearance` is deleted from `theme.ts` together with **all six** consumers in the census above, the page's bottom padding becomes ordinary spacing expressed as a token, and no viewport shows a dead tail. Task **787**'s exit criterion 3 closes here | P0 | AC5 | Confirmed |
| **R6** | §3.5 | `trackListingContactEvent`, the `getListingOwnerContact` click-time RPC (no digits in SSR HTML), `openAuthSheet`, the archived suppression and the self-inquiry guard all behave exactly as today | P0 | AC6 | Confirmed |
| **R7** | §3.5 | The Task 612 stacking contract still holds; `npm run test:listings` stays green | P1 | AC7 | Confirmed |
| **R8** | D71-4 | No raw pixel anywhere in the diff; a missing value becomes a created token | P0 | AC8 | Confirmed |
| **R9** | §3.4 census | Every reference to the deleted bar and the deleted token is removed or classified in writing as historical prose. `scripts/task791-detail-evidence.mjs` is updated in the same change so its expectations are not silently lost | P0 | AC10 | Confirmed |

## 5. Assumptions and open questions — **two owner decisions block execution**

**OD-1 (R1) — WITHDRAWN AND REPLACED, 2026-09-05.** The original options were framed around the canonical
pattern's *limitation* ("it has no mobile bar") rather than around what a user sees, and the owner rightly did not
recognise the question. Two corrections:

- **What "as it is now" actually is, measured** (320 / 390 / 768, live build): the Grid's second column has height
  **0px** and `.listing-contact` computes `display: none` below `lg`. **There is no contact card under the content
  on mobile today.** The only contact affordance below 1024 is the fixed bottom bar.
- **What the pattern already does:** `MantineListingContactPattern` is
  `pos={{ base: 'static', lg: 'sticky' }}` — it renders **in flow at every width**, so in the Grid's second column
  it lands under the content on mobile with no extension at all.

**Owner instruction (2026-09-05):** *"картка контактів має бути відображена під контентом оголошення"* — the card
renders in flow beneath the listing content on mobile. That is satisfied by adopting the pattern as-is; the
"extend the pattern with a mobile bar" branch is dead and must not be built.

**OD-1b — RESOLVED BY THE OWNER, 2026-09-05: *"панель внизу прибираємо"* — the fixed mobile bar is DELETED.**

Together with the screenshot instruction (*"картка контактів на мобільних екранах має бути видима після контенту
оголошення"*), the mobile contract is now: **the in-flow canonical card is the only contact surface below `lg`.**
The earlier `A-BAR` assumption (bar stays) is **withdrawn** — it was never an owner decision and must not be
implemented.

⚠️ **This reverses a deliberate earlier decision, and the executor must know that.** Task **466** (2026-06-23,
`docs/sessions/2026-06-23-task466-listingdetailview-mobile-fix.md`) *created* this bar: it removed `ListingMobileCTA`
entirely and consolidated everything into a single `listing-contact-mobile` bar, with its own ACs for the <640
Call↔WhatsApp overlap, the archived-listing guard and the `lg:hidden` desktop boundary. Deleting the bar retires
466's outcome by a newer owner decision. Read 466's session log before deleting, so the behaviours it enumerated
(archived suppression, self-inquiry guard, the phone/WhatsApp split) are consciously re-homed into the in-flow card
rather than silently lost.

**Deleting the bar deletes its clearance, and the clearance has six live consumers outside `theme.ts`.** Census
2026-09-05 — **re-run it at execution, this list is a starting point, not an authority** (the Task 782-F4 / 788
lesson: a deletion leaves live references no gate can see):

| Path | What |
|---|---|
| `src/design-system/mantine/theme.ts:146` · `:493` | the type augmentation and the value |
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx:147-149` | the `{base:176, md:80}` value assertion |
| `src/design-system/mantine/__tests__/theme.d69-18.test.tsx:281-285` | the `CONTRACT_CONSUMERS` mechanical row |
| `src/modules/listings/components/ListingDetailView.tsx:324` · `:328-329` | the consumer and its comment |
| `scripts/task791-detail-evidence.mjs:53-54` | **derives `EXPECTED_BASE_PX`/`EXPECTED_MD_PX` from `theme.ts` by regex** — delete the token and this harness silently loses its expectations. It must be updated in the same change, or AC5 measures nothing |
| `.listing-contact-mobile` (class) | one live site — `ListingContact.tsx:309`; every other hit is historical Task 466 prose |

`theme.other.layout.listingContactBarClearance` was created by Task 791 on 2026-09-05 under D71-4 and is retired
the same day by this decision. That is not waste — it was correct while the bar existed, and it is the reason the
dead tail was measurable at all.

**OD-3 — RESOLVED, 2026-09-06 (owner instruction).** *"Треба кнопку «Поділитись» перенести праворуч від кнопки
«Додати в обране» біля badge глобально по всіх breakpoints (як на прикладі з dim.ua)."* So the badges row ends with
**favorite then share**, at every width, and both leave the contact card. Consequences on top of OD-2's:

- `MantineListingDetailPattern` already renders `favorite` right-aligned in the badges row (D69-25). Share joins it
  there — extend that same `Group`, do **not** invent a second row.
- `MantineListingContactPattern`'s own Share button and its `onShare` callback are removed from the card. The
  clipboard/`navigator.share` handler and the `copied` label state (D4) move with it to whatever renders share in
  the badges row; **D4 is therefore no longer a contact-card extend** — re-read §3.2 before implementing it.
- Both nodes cross from `ListingDetailView` (a Server Component) as slots, so neither may carry a function prop —
  the share handler lives inside its own `'use client'` component. This is the §3.1 hazard that already cost one P0.
- AC2's duplicate-count assertion covers **both** controls: exactly one favorite and exactly one share in the DOM
  at every breakpoint, both in the badges row, neither in the card.

**OD-2 — RESOLVED, 2026-09-05.** Owner instruction: *"favorite кнопка має бути біля badge, як я раніше і сказав"* —
**D69-25 is honoured**, option (a). Consequences, all in scope:

- `ListingDetailView.tsx` **is** edited, for exactly one thing: it starts passing `favorite={<FavoriteButton …/>}`
  to `MantineListingDetailPattern`. §8's "do not edit that file" is amended to permit only that prop.
- `ListingContact.tsx` drops `FavoriteButton` from its secondary-action row.
- The favorite is gated on `listingId`, which `ListingDetailView` already computes as `effectiveListingId`
  (staff preview forces it `undefined` — Note 14 inertness must survive; assert it).
- **AC2's duplicate-count assertion is now the load-bearing check**: exactly one favorite control in the DOM at
  every breakpoint, in the badges row, never in the card.

**No owner decision now blocks this task.** OD-2 is resolved; OD-1 was withdrawn; OD-1b proceeds under the labelled assumption **A-BAR**. The executor implements one branch and reports the assumption verbatim. Do not pick a branch while coding;
the whole point of D69-25's history is that this placement has already been decided once and changing it silently
would be the third time it moved.

Reversible assumptions (labelled, not blocking): D5's WhatsApp colour goes to the owner's visual matrix; the
`closedListing` and `ownerUnavailable` states keep their current copy.

## 6. Pre-read rule bundle

`docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (the two rows in §3.5 only) · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` · `docs/component-rules.md` · `docs/ui-rules.md` (legacy boundary only) ·
`docs/qa-rules.md` · `docs/storybook-governance.md` §14.9/§15 · Sprint 71's **D71-1 · D71-2 · D71-3 · D71-4** ·
Task 791's kickoff **§16.8** (the token rule worked through end to end) and **§18.4** (this coupling's measurements).

At source: `ListingContact.tsx`, `MantineListingContactPattern.tsx`, `MantineListingDetailPattern.tsx` (the D69-25
comment), `ListingContactPattern.stories.tsx`, `ListingDetailView.tsx` (read only — not edited),
`FavoriteButton.tsx`, `SaveToCollectionButton.tsx`, `getListingOwnerContact.ts`, `contactEvents.ts`,
`scripts/task791-detail-evidence.mjs`.

## 7. Scope

`src/modules/listings/components/ListingContact.tsx` · `src/design-system/mantine/patterns/MantineListingContactPattern.tsx`
(R4 extends only) · `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` (a state per extend) ·
`src/design-system/mantine/theme.ts` (R5's re-derived clearance) · `scripts/task791-detail-evidence.mjs` (extend for
R5/R7 proof) · `scripts/mantine-migration-scope.json` · `docs/component-catalog.md` rows made stale ·
`docs/backlog.md` · the session log.

## 8. Out of scope

`ListingDetailView.tsx` (unless OD-2 resolves to (a)) · `ListingGallery`/`LightboxView`/`GalleryStaticFrame` (**794**) ·
`ListingInquiryDialog`/`ListingReportDialog`/`SaveToCollectionButton`'s own dialog (**795**) · `FavoriteButton`'s
internals · `ListingMobileCTA.tsx` (Sprint 57) · `ListingBackButton`/`ListingStatusBanner`/`loading.tsx` (**792**) ·
the form family (**796**) · any route, query or server action · new breakpoints or allowlist entries.

## 9. Current and required behavior — visual source map and canonical UI decision record

| Visible artifact | Component/markup today | Token path | Disposition |
|---|---|---|---|
| Desktop sticky sidebar | `ListingContact` `hidden lg:block sticky top-20` + `rounded-2xl border bg-card shadow-md p-5` | `--card`, `--border` | **changed** → `MantineListingContactPattern` (`pos`/`top` from `listingContactStickyOffset`) |
| Owner row, price block, dividers, CTA rows, notice boxes | hand-rolled | — | **changed** → pattern's own composition |
| WhatsApp button | `bg-whatsapp` | `--whatsapp` | **changed** → `color="green"` (D5, owner) |
| Loading spinner / copied label / SaveToCollection | hand-rolled | — | **changed** → pattern extends (R4) |
| Mobile fixed bar | `lg:hidden fixed bottom-0 … z-40` | — | **OD-1** |
| Favorite | `FavoriteButton` in the secondary row | — | **OD-2** |
| Page clearance | `theme.other.layout.listingContactBarClearance` | created by 791 | **changed** → re-derived (R5) |

| Artifact | Canonical source | Disposition |
|---|---|---|
| Contact card | `Patterns/Mantine/ListingContactPattern` (`MantineListingContactPattern`) | **reuse + extend** (R4) |
| Everything else above | — | preserved / owner decision |

No artifact needs a visual value without provenance. There is no `create canonical` here.

## 10. Implementation requirements — phased

1. **Answer OD-1 and OD-2 before writing code.** If unanswered at dispatch, stop and return `BLOCKED`.
2. **Extend the pattern (R4)** — `SaveToCollectionButton` slot, loading state, copied-share label — each with a
   story state on `Patterns/Mantine/ListingContactPattern`, and prove the pre-existing states render unchanged.
3. **Migrate `ListingContact`'s desktop sidebar** onto the extended pattern, passing the real triggers as nodes and
   the four callbacks as function props (legal — this file is `'use client'`).
4. **Implement OD-1's branch** for the mobile bar.
5. **Re-derive the clearance (R5)** — measure the bar's real height in every state × locale first, then set the
   token, then re-measure.
6. **Re-prove the critical flows (R7)** and register the migrated component in the manifest.

## 11. Positive and negative flows

**Positive.** A guest at 390px sees the mobile bar flush to the viewport bottom with no dead tail and no content
under it; tapping the WhatsApp button fetches digits at click time and opens `wa.me`; at 1280px the sticky card
shows the agent, price, call/WhatsApp/message/share and the report row, and stays above the fold while scrolling —
and the lightbox still paints above it.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Validation | **No** | no form or schema changes | N/A | — |
| Authorization / RLS | **No** | `getListingOwnerContact`/`trackListingContactEvent` unchanged | unchanged | `test:listings` |
| Offline / network | **Yes** | the click-time RPC | `toast.error(t('contact_load_failed'))`, spinner clears | rendered + existing smoke |
| Concurrent writer | **No** | no write path | N/A | — |
| **Owner/listing states** | **Yes** | `ownerDeleted`, `ownerUnavailable`, `guestCta`, `closedListing`, archived, self-inquiry | each renders its documented composition; archived suppresses the whole mobile bar | one story state + one rendered cell each |
| **Long-locale overflow** | **Yes** | `uk`/`it` at 320 | no overflow; CTA labels wrap, never clip | rendered |
| **Stacking** | **Yes** | Task 612 | lightbox above header and card | evidence script |

## 12. Acceptance criteria

- **AC1 [R1]** — OD-1's branch is implemented; on a guest and an authenticated fixture at 320/390/768 every contact affordance present today is present after, asserted by accessible name.
- **AC2 [R2]** — OD-2's and OD-3's branches are implemented; the favorite **and** share controls each appear exactly once in the DOM at every breakpoint, adjacent in the badges row, and neither appears in the contact card (assert both counts — a duplicated control is the failure mode this criterion exists for).
- **AC3 [R3]** — `grep -c 'className=' ListingContact.tsx` returns 0 for Tailwind utilities; no `@/components/ui/*` import except `AppImage`; `git diff --stat` shows `ListingDetailView.tsx` untouched (unless OD-2 = (a), in which case its diff is only the added `favorite` prop).
- **AC4 [R4]** — each of D2/D3/D4 has a story state, and the pattern's pre-existing states render byte-identically to `HEAD` (retain both serializations).
- **AC5 [R5]** — at 320/390/639/768/1023 there is **no** fixed element pinned to the viewport bottom (assert on computed `position`), the page's rendered `padding-bottom` equals the token-expressed ordinary value with **no residual clearance**, and the last content element is fully visible at the end of the scroll. Report the measured before/after `padding-bottom` per width. A leftover tail is a rejected diff, not a note.
- **AC6 [R6]** — no phone/WhatsApp digits appear in the SSR HTML (assert on the served payload); the WhatsApp path still calls `trackListingContactEvent`; archived listings render no mobile bar.
- **AC7 [R7]** — the Task 612 stacking assertion passes at 390/1280 × sq/uk; `npm run test:listings` exits 0.
- **AC8 [R8]** — no raw pixel in the diff: grep the consumer, and quote the grepped definition line of any created token. **A green `check:design-tokens --scope=mantine` is not evidence** — see Task **797**.
- **AC10 [R9]** — `grep -rn "listing-contact-mobile\|listingContactBarClearance" src/ scripts/ docs/` returns only historical prose; **enumerate every hit and classify each**. `npm.cmd run vitest run src/design-system/mantine/__tests__` shows no assertion referencing the deleted token, and `node scripts/task791-detail-evidence.mjs` still exits 0 with its expectations updated.
- **AC9** — `npm run build` exit 0, then a real `next start` request to `/sq/listings/<slug>` and `/uk/listings/<slug>` returning 200 **with the contact card present in the HTML** (D71-1).

## 13. QA profile and verification plan

**`Q3`** — a migrated component with five states on a route carrying two critical-flow rows, plus a layout-token
change affecting every mobile page of that route. Windows-native PowerShell only; record
`node.exe -p process.platform` (`win32`), Node version, cwd, exact command and real exit code.

```powershell
node.exe -p process.platform
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:locale-leak:mantine-only
npm.cmd run test:listings
npx.cmd vitest run src/modules/listings
npm.cmd run build-storybook
node scripts/task791-detail-evidence.mjs
npm.cmd run build
npm.cmd run start
```

Every log must post-date every changed source file — Task 791 was returned once for exactly this.

**`OWNER VISUAL QA REQUIRED`** (D71-2):

| Surface | State | Locale | Viewport |
|---|---|---|---|
| `Patterns/Mantine/ListingContactPattern` | all five states + the three new ones | en, uk | 390, 768, 1280 |
| Live `/{locale}/listings/{slug}` | guest | sq, uk | 320, 390, 768, 1280 |
| Live `/{locale}/listings/{slug}` | authenticated | uk | 390, 1280 |
| Live, archived listing | any | en | 390 |
| **Page bottom after the bar's removal** — no tail, last element reachable | guest | uk | 320, 390, 768 |

## 14. Completion report contract

Files changed · requirement IDs and the AC that closed each · commands with real exit codes, platform, Node, cwd ·
**the per-state bar-height table behind R5** and the resulting token value · AC5's measured pairs · AC6's SSR-payload
assertion · AC7's stacking result · the OD-1/OD-2 branches as implemented, quoting the owner decision · assumptions,
deviations, limitations · status `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 15. Task quality gate

Executable cold — every path, prop, token, command and measured number above was read or captured at source ·
every requirement has a binary AC · scope names what must not change, and R6 lists the four behaviours easiest to
lose · canonical-first: `reuse + extend`, no `create canonical`, no local styling authorized · the permanent-story
gate is satisfied by states on an existing canonical story with a real in-scope production consumer ·
detector-aware: AC8 explicitly refuses the scoped gate's exit code as proof and cites 797 · the two genuine
conflicts are surfaced as blocking owner decisions rather than delegated · negative flows chosen by applicability ·
no owner exception invented: D69-25 is quoted, not paraphrased.

---

`FACTS` — bar 134px at 390 guest state; clearance 176px; bar now `bottom-0`; 75 `className` in the file;
`listingContactStickyOffset` = 80 exists and is a different contract; `ListingMobileCTA` has zero consumers;
`MantineRootProvider` is in the root layout; the pattern has no mobile bar and no favorite slot.

`INFERENCES` — `ListingContact` being `'use client'` is what makes the function props legal, so the migration
happens inside it and 791's seam is untouched.

`UNKNOWNS` — the bar's height in the authenticated / phone-only / WhatsApp-only states and in `uk`/`it`; R5 measures
them before setting the token.

`CONFLICTS` — None open. OD-1 withdrawn as badly framed; OD-2 resolved in favour of D69-25; OD-1b resolved by the owner —
the bar is deleted, retiring Task 466's consolidation by a newer decision.

**Task path:** `tasks/Sprints/Sprint_71_kickoff_prompt_Task_793_ListingContact_Canonical_Mantine_Card.md`
**QA profile:** `Q3` · **Owner decisions required before dispatch:** none — OD-1b resolved (bar deleted), OD-2 resolved (favorite to the badges row). **Executable.**
