Before starting this task, Claude Code MUST read and follow these docs:
- /docs/ai-behavior.md
- /docs/analytics-rules.md
- /docs/architecture.md
- /docs/backlog.md
- /docs/component-rules.md
- /docs/data-access-rules.md
- /docs/dependencies.md
- /docs/domain-rules.md
- /docs/env.md
- /docs/integrations.md
- /docs/performance.md
- /docs/qa-rules.md
- /docs/rls-rules.md
- /docs/ui-rules.md

Task: Hydration budget pass for `/[locale]/listings/[slug]` (mobile LCP root cause) + wire `revalidateTag('site-stats')` into listing create/update/delete mutations. Targeted server/client boundary cleanup, no architectural rewrites.

IMPORTANT — LOCALE & ROUTE SCOPE:
Project ships 4 locales: `sq`, `en`, `uk`, `it`. Every measurement and validation step MUST be executed against ALL 4 locales for the listing detail route pattern `/[locale]/listings/[slug]`. No code change in this task may introduce a per-locale branch or hardcode a locale prefix. The reference slug for ALL Lighthouse measurements is `test-2-mokkj60o` (10 real Cloudinary images — confirmed representative). If that slug is unavailable, use any other slug with ≥ 8 real photos and explicitly note which one was used.

Context:
The Post-LCP Cleanup Pass landed every reasonable image-pipeline optimization for the listing detail page (Cloudinary preconnect, server-side `<link rel="preload">` for the hero, height-constrained srcset, opacity-100 for priority images, server preload helper). After all of those, mobile Lighthouse LCP is still 5329–5787 ms across all 4 locales — POOR by Google CWV (> 4000 ms). Desktop unthrottled is fine (746–1073 ms).

The previous report's own diagnosis identifies the remaining bottleneck precisely:
  > 827 fiber tasks, 222 ms total at native speed → ~888 ms at 4× throttle
  > Each individual task is < 50 ms (TBT = 80 ms) but collectively prevent
  > paint opportunities for ~4.3 s after FCP.

The hero image arrives in < 500 ms but cannot paint for ~4.3 s because React hydration is doing too much above the fold on a throttled mobile CPU. The image pipeline is already optimal — further tuning there yields nothing. The actionable lever is **client-side JS doing too much above the fold**.

This is the Google CWV signal that affects SEO ranking via field data (CrUX). "Lab artifact" is not a defense — Lighthouse Slow 4G + 4× CPU models a median Moto G4 user, and CrUX 75th percentile mobile LCP correlates with throttled lab measurements. Fixing this matters for organic discovery.

In parallel, the previous pass added `unstable_cache(getSiteStats, ['site-stats'], { revalidate: 3600 })` for the homepage stats counter but did NOT wire `revalidateTag('site-stats')` into listing mutations, so the counter is stale for up to 1 hour after a listing is created or removed. That is a small marketplace-correctness fix that fits cleanly into this pass.

Requirements:
- DO NOT introduce a new state-management library (no zustand/jotai/recoil/redux additions)
- DO NOT introduce new image components or change the AppImage public API
- DO NOT redesign the gallery component
- DO NOT introduce new caching subsystems
- DO NOT add new performance subsystems, new metrics, or new dispatch channels
- DO NOT change route-pattern caching strategy beyond what is required to wire `revalidateTag('site-stats')`
- DO NOT migrate to a new i18n library (use whatever next-intl APIs the codebase already has, just on the correct side of the boundary)
- DO NOT introduce experimental Next.js features that are not stable in the installed Next.js version
- ONLY: audit the client/server boundary, push as much above-fold work to RSC as possible, defer below-fold work behind Suspense / `next/dynamic`, eliminate non-essential third-party scripts above the fold, and wire one `revalidateTag` call set
- Preserve every guarantee from prior passes (budgets unchanged, `shtepi:vitals` event name, WebVitalMetric public field shape, zero CLS, no hydration mismatch, Cloudinary-first delivery, predictive preload / imageGuard untouched, locale-stripped route normalization)

--------------------------------------------------
1. Hydration cost inventory (audit only — no changes yet)
--------------------------------------------------

For the listing detail route, build a complete inventory of the React tree from the layout root down to the bottom of the above-fold viewport. For EVERY component on the path, record:

  - File path
  - Server component or Client component (`'use client'` directive presence)
  - If client: estimated JS payload contribution (use `next build && ANALYZE=true next build` with `@next/bundle-analyzer` if already in deps; if not, do not install — read the build output's per-route summary instead)
  - If client: reason it is client (event handlers, hooks, browser APIs, third-party lib that requires DOM)
  - Whether it renders ABOVE the fold on a 360-width mobile viewport (the LCP-relevant region) or BELOW
  - Whether it is on the critical path to the gallery hero `<img>` (i.e. would suspending it delay the LCP candidate)

Specific suspects to confirm or rule out (do NOT assume — verify each in the actual codebase):
- Top-level `AuthProvider` — if it wraps the whole tree as `'use client'`, every server child below it still SSRs, but the provider boundary triggers a hydration sweep over the whole subtree. Confirm: is this the case here?
- `NextIntlClientProvider` — does the listing detail page use `useTranslations` (client) anywhere above the fold, or only `getTranslations` (server)?
- Theme/Toast/Tooltip providers (shadcn/ui patterns) — typically client-only. Confirm scope.
- Currency converter / exchange-rate hooks — if any above-fold price uses a client hook fed by `/api/exchange-rate`, that's hydration-blocking.
- Image gallery container — is the gallery a client component for arrow-key navigation / lightbox, or is the FIRST image rendered server-side and only the interactive shell hydrated?
- Map preview / share buttons / favorite button / contact form — confirm whether they are above or below fold on mobile.
- Third-party scripts loaded via `next/script` or in layout — record strategy (`beforeInteractive` / `afterInteractive` / `lazyOnload`) and whether they execute above the fold.

Deliverable for §1:
- A table with the columns above, sorted top-to-bottom by tree position.
- A short bullet list of the top 3 hydration-cost contributors and why.
- The current per-route First Load JS for `/[locale]/listings/[slug]` from the build output.

--------------------------------------------------
2. Server/Client boundary cleanup (above the fold only)
--------------------------------------------------

Apply the smallest possible set of changes to push above-the-fold rendering to Server Components.

2026 marketplace best-practice playbook (apply where it fits the codebase, do not force-fit):

a) **First gallery frame as RSC.** The very first photo (`gallery-main` first slide) should be rendered by a Server Component as a plain `<img>` (or AppImage rendered server-side). The interactive gallery shell — arrows, swipe, lightbox, thumbnail strip — is mounted as a separate small client island that takes over once hydrated. The user sees a painted hero immediately from SSR HTML; interactivity arrives later without delaying paint. This is the islands / partial-hydration pattern, applied surgically to the LCP candidate.

b) **`getTranslations` over `useTranslations` above the fold.** Anywhere on the critical path that calls `useTranslations` — replace with `getTranslations` in the surrounding Server Component and pass already-translated strings as props to any client island that needs them. `useTranslations` requires a Client Component, which inflates the hydration tree.

c) **Move providers off the critical path where possible.** Audit each provider in the layout chain:
  - If a provider has NO consumer above the fold on the listing detail page, do not wrap above-fold subtrees in it. Keep the provider, but consider rendering above-fold content OUTSIDE its boundary — or, if Next.js layout structure forces wrapping, ensure the provider does not block paint (it should render `{children}` immediately and do its work in `useEffect`).
  - For `AuthProvider`: if above-fold UI does not need user state to render, the provider can be deferred (mount below the fold or in a client island). Auth-gated UI like "Save listing" / "Contact owner" can be a small client island that reads the context locally.

d) **Heavy interactive widgets behind `next/dynamic` with `ssr: true`.** Any widget that ships > 30 KB of JS and lives below the fold (related listings carousel, map widget, contact form, share menu) — wrap with `next/dynamic(() => import('...'), { ssr: true, loading: () => <Skeleton /> })`. `ssr: true` keeps the SSR HTML for SEO; the JS chunk loads lazily.

e) **Third-party scripts.** Any analytics or marketing tag in the layout or page that runs above-fold — switch to `next/script strategy="lazyOnload"` or move to a `useEffect` after first paint. Synchronous third-party scripts are forbidden above the fold.

f) **Suspense for below-the-fold sections.** Wrap "Similar listings", "Owner info / agent card", "Reviews", "Map preview", etc. in `<Suspense fallback={<Skeleton />}>` so the page can stream the above-fold portion first and the below-fold sections in subsequent flushes. This requires the data fetches for those sections to be deferred (use Server Component `await` inside the Suspense boundary, not at page-component top level).

g) **Avoid CSS-in-JS runtime above the fold.** If any above-fold component uses a runtime CSS-in-JS solution that requires JS to apply styles (rare with Tailwind, but check for any), replace with Tailwind classes or a static CSS module.

Constraints:
- Do not refactor unrelated code.
- Do not change the visual output. Same DOM, same styling, same interactive behavior — only the boundary changes.
- Every change must be justified by a row in the §1 inventory.

--------------------------------------------------
3. Speculation Rules API (optional, only if stable)
--------------------------------------------------

If the installed Chrome-targeted browser support and Next.js version permit, add a `<script type="speculationrules">` JSON block in the listing detail layout that prerenders the next likely listing(s) (e.g. the first 2 cards in "Similar listings"). This dramatically improves perceived LCP on subsequent navigations within the marketplace and is a 2026 best practice for marketplace UX.

If the project does not yet have a "Similar listings" data source, SKIP this section — do not invent one. Document the skip in the final report.

Constraints:
- No new dependencies.
- No fallback for unsupported browsers required (Speculation Rules is a progressive enhancement).
- The prerender list must respect the user's `Save-Data` header (skip if present) and `prefers-reduced-data`.

--------------------------------------------------
4. Wire `revalidateTag('site-stats')` into listing mutations
--------------------------------------------------

Required steps:
- In `src/modules/listings/lib/queries.ts` (or wherever `getSiteStats` lives), confirm the cache wrapper signature includes a tag:
  ```
  unstable_cache(fn, ['site-stats'], { revalidate: 3600, tags: ['site-stats'] })
  ```
  If the `tags` field is missing, ADD it. `revalidateTag` only works on tagged caches.
- Find every server-side mutation that creates, updates publication state of, or deletes a listing. Likely locations:
  - `src/modules/listings/lib/mutations.ts` (or equivalent)
  - Any API route handler under `src/app/api/listings/**`
  - Any Server Action under `src/modules/listings/**` or `src/app/[locale]/**`
- After each successful mutation, call `revalidateTag('site-stats')`.
- Do NOT call `revalidateTag` unconditionally before the mutation succeeds.
- Do NOT call `revalidatePath('/')` (too broad — invalidates the entire homepage cache instead of just the stats fragment).

Mutation events that MUST trigger revalidation:
- listing created (becomes visible publicly)
- listing transitioned to/from a public/published state (e.g. `status: 'active' | 'draft' | 'archived'`)
- listing permanently deleted

Mutation events that MUST NOT trigger revalidation:
- view counter increment (`POST /api/listings/[slug]/view`)
- favorite/unfavorite
- contact form submission
- any pure read

Constraint:
- This is the only caching change permitted in this pass.

--------------------------------------------------
5. Verification — mobile Lighthouse + bundle size
--------------------------------------------------

Re-run for ALL 4 locales on `/[locale]/listings/test-2-mokkj60o`:

a) Lighthouse mobile (default throttling, Slow 4G, 4× CPU):
- LCP (target: ≤ 2500 ms — "good")
- TBT (target: ≤ 200 ms — should drop substantially after §2)
- INP / responsiveness check (target: < 200 ms)
- CLS (target: 0)
- Total page weight + image weight breakdown

b) Build output for the route:
- First Load JS for `/[locale]/listings/[slug]` (target: meaningful reduction vs §1 baseline)
- Per-chunk top contributors (record top 5)

c) `revalidateTag` integration test:
- Manually create a listing → reload `/[locale]` → confirm stats counter updated WITHOUT waiting 1 hour.
- Manually delete the same listing → reload `/[locale]` → confirm stats counter decremented.
- Trigger a view-count increment → confirm stats counter does NOT change.

d) Streaming verification:
- View the listing detail page response in DevTools Network with "Disable cache" — confirm chunked transfer / multiple flushes (above-fold first, below-fold streamed).
- Confirm above-fold content (gallery hero + title + price) is in the FIRST flush.

e) Hydration sanity:
- No React hydration warnings in console for any locale.
- No "Text content does not match" warnings.
- Server-rendered first gallery image must match what the client gallery shell shows once hydrated (same src, same dimensions, same alt).

f) SEO sanity:
- `curl -s http://localhost:<port>/<locale>/listings/test-2-mokkj60o > /tmp/listing-<locale>.html` for each locale. Confirm the raw HTML (no JS) contains: title, price, primary photo `<img>`, description text, and the H1. Streaming below-fold sections is fine, but above-fold marketing-critical content must be in the initial HTML.

--------------------------------------------------
6. Documentation updates
--------------------------------------------------

Update `docs/performance.md`:
- New section "Listing detail hydration budget" — document the inventory approach, the rule "above the fold = RSC, interactive shell = client island", and the per-route First Load JS target.
- Update the existing "Gallery LCP Delivery Contract" section to reflect: first frame is now SSR'd as a server-rendered `<img>` (or AppImage SSR'd), interactive shell hydrates after.
- Note the `revalidateTag('site-stats')` contract: which mutations trigger it, which do not.

Update `docs/data-access-rules.md`:
- Add a short rule: "Any cached read used on the homepage above-the-fold must be tagged. Mutations affecting that read must call `revalidateTag('<tag>')` immediately after a successful write. Never use `revalidatePath('/')` for fragment-level cache invalidation."

Update `docs/architecture.md`:
- Add to the relevant module section a one-line rule: "Above-the-fold UI on listing detail must remain Server-Component-renderable. New 'use client' directives on this path require an inventory entry and a justification."

Update `docs/backlog.md`:
- Closed entry: "Listing detail hydration budget pass + site-stats revalidation wiring."
- If §3 Speculation Rules was skipped because no similar-listings data source exists, OPEN entry: "Add similar-listings data source + Speculation Rules prerender for marketplace navigation."

--------------------------------------------------
7. Validation checklist
--------------------------------------------------

After implementation verify:

Hydration / boundary:
- §1 inventory table produced and attached to the final report
- Top hydration contributors above the fold either converted to RSC, deferred behind `next/dynamic`, or justified as necessary
- No new state-management library introduced
- No `'use client'` directive added on the critical path to the gallery hero `<img>`
- Above-fold `useTranslations` calls replaced with `getTranslations` where the surrounding component can be RSC

LCP / mobile:
- Lighthouse mobile LCP for `/[locale]/listings/test-2-mokkj60o` ≤ 2500 ms in ALL 4 locales
- Lighthouse mobile TBT ≤ 200 ms
- CLS = 0
- Hero image is first-paint candidate, identified by Lighthouse as the LCP element
- Desktop unthrottled LCP did not regress (must remain in the 700–1100 ms band or better)

Bundle:
- First Load JS for the route reduced vs §1 baseline (record exact numbers before/after)
- No accidental new heavy dependency added

`revalidateTag`:
- `getSiteStats` cache wrapper has `tags: ['site-stats']`
- Listing create/publish/unpublish/delete server actions / API routes call `revalidateTag('site-stats')` on success
- View-count increment does NOT call it
- Favorite / contact / read paths do NOT call it
- Manual create → homepage stats counter updates without waiting
- Manual delete → homepage stats counter decrements

Streaming / SSR:
- Above-fold content (hero image, title, price, H1) present in raw curl output for all 4 locales
- Network panel shows multi-flush streaming with above-fold in first flush
- No hydration warnings in any locale

Locale parity:
- Every measurement and check executed for ALL 4 locales (`sq`, `en`, `uk`, `it`)
- No per-locale branch or hardcoded locale prefix introduced

Preserved guarantees (still hold):
- Budgets unchanged (good ≤ 2500 ms, poor > 4000 ms)
- Analytics event name `shtepi:vitals` unchanged
- WebVitalMetric public field shape unchanged
- Zero CLS, no hydration mismatch
- Cloudinary delivery contract unchanged
- AppImage public API unchanged
- Predictive preload / imageGuard untouched
- Locale-stripped route normalization continues to apply uniformly

Final report (in PR description) must include:
- §1 hydration inventory table (the full table, not just a summary)
- §2 list of boundary changes with justification per change
- §3 Speculation Rules — applied or skipped, with reason
- §4 list of mutation sites that now call `revalidateTag('site-stats')`
- §5 before/after Lighthouse mobile table (4 locales × LCP, TBT, INP, CLS)
- §5 before/after First Load JS for the route
- Files modified
- Confirmation that all "Preserved guarantees" still hold
- Any new backlog entries filed
