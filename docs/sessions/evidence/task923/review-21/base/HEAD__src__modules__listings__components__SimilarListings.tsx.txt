import { getTranslations, getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { getExchangeRates } from '@/lib/getExchangeRateServer'
import type { CardListingData } from '@/modules/listings/components/ListingCard'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'
import {
  applySimilarityEntries,
  buildSimilarityEntries,
  buildSimilarityHref,
  entriesForAttempt,
  SIMILARITY_ATTEMPTS,
  type SimilarityAttempt,
  type SimilarityEntry,
  type SimilarityListingInput,
} from '@/modules/listings/domain/similarity'
import { SimilarListingsView } from './SimilarListingsView'

interface Props {
  currentId: string
  propertyType: string
  listingType: string
  locationId: number | null
  condition: string | null
  heating: string | null
  wallType: string | null
  marketType: string | null
  offerType: string | null
  purchaseConditions: string[] | null | undefined
  rooms: number | null
  areaGross: number | null
  floor: number | null
  yearBuilt: number | null
}

const SELECT = `
  id, public_id, slug, title, price, price_old, currency, listing_type, property_type,
  rooms, bedrooms, bathrooms, area_gross, floor, total_floors, is_premium, status, created_at,
  location:locations(id, name_al, slug, type),
  images:listing_images(url, is_cover, order)
`

// Max rows requested per rung — one more than the render cap (R3) so a 9th row signals "more
// exist" without a separate count query (Task 803 kickoff §5 ASSUMPTION).
const QUERY_LIMIT = 9
const RENDER_LIMIT = 8

/**
 * Builds one rung of the relaxation ladder's query: core (never relaxed, D72-2) + the given
 * attempt's similarity entries (D72-4). Exported so the public-visibility regression test
 * (Task 803 R6/AC6) can walk all 4 rungs against a recording mock builder without a live Supabase
 * client, and so a planted-violation proof (removing `applyPublicVisibility`) is a one-line,
 * revertible edit isolated to this function. Unconstrained generic `Q` + internal `any`, same
 * pattern `applyListingFilters`/`applyPublicVisibility` already use to sidestep Postgrest's
 * builder generics (`filterEngine.ts:227-229`, `visibility.ts:99,119`).
 */
export function buildSimilarityRungQuery<Q>(
  baseQuery: () => Q,
  core: { currentId: string; propertyType: string; listingType: string },
  entries: SimilarityEntry[],
  attempt: SimilarityAttempt,
): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = applyPublicVisibility(baseQuery() as any)
  q = q.eq('property_type', core.propertyType)
  q = q.eq('listing_type', core.listingType)
  q = q.neq('id', core.currentId)
  const rungEntries = entriesForAttempt(entries, attempt)
  q = applySimilarityEntries(q, rungEntries)
  return q as Q
}

export interface SimilarityLadderResult {
  listings: Record<string, unknown>[] | null
  settledEntries: SimilarityEntry[]
  /** Number of Supabase round trips actually made (R5/AC5 — at most 4). */
  attemptCount: number
}

/**
 * Runs the relaxation ladder (R5/D72-4): calls `fetchAttempt` for each of the 4 attempts in
 * order, stopping at the first that returns at least one row. Takes a plain async callback
 * instead of a live Supabase client so AC5 (attempt count) and the settled-rung selection are
 * directly testable without a database.
 */
export async function runSimilarityLadder(
  fetchAttempt: (attempt: SimilarityAttempt) => Promise<Record<string, unknown>[] | null>,
  entries: SimilarityEntry[],
): Promise<SimilarityLadderResult> {
  let attemptCount = 0
  for (const attempt of SIMILARITY_ATTEMPTS) {
    attemptCount++
    const data = await fetchAttempt(attempt)
    if (data?.length) {
      return { listings: data, settledEntries: entriesForAttempt(entries, attempt), attemptCount }
    }
  }
  return { listings: null, settledEntries: [], attemptCount }
}

export interface SimilarListingsPresentation {
  rendered: Record<string, unknown>[]
  /** True only when a 9th row was returned (R4) — gates the `ViewAllLink`. */
  hasMore: boolean
  /** Present only when `hasMore` — built by `similarity.ts`'s URL renderer from the SETTLED
   * predicate (D72-1). `undefined` renders no control. */
  viewAllHref: string | undefined
}

/**
 * Caps the fetched (up to 9) rows to the rendered 8 (R3) and decides whether the view-all control
 * appears (R4). Pure — directly testable for AC3 (render cap) and AC4 (href equals the settled
 * predicate's URL, assigned only when a 9th row exists) without rendering `ListingCard`.
 */
export function resolveSimilarListingsPresentation(
  listings: Record<string, unknown>[],
  settledEntries: SimilarityEntry[],
  locale: string,
  core: { listingType: string; propertyType: string },
): SimilarListingsPresentation {
  const rendered = listings.slice(0, RENDER_LIMIT)
  const hasMore = listings.length > RENDER_LIMIT
  const viewAllHref = hasMore ? buildSimilarityHref(locale, core, settledEntries) : undefined
  return { rendered, hasMore, viewAllHref }
}

/**
 * Similar Listings — Server Component.
 *
 * Task 803 — the block is now a working entry point into `/listings` (Sprint 72). Up to 9 rows are
 * queried across a 4-rung relaxation ladder (D72-4), the widest non-empty rung's first 8 rows are
 * rendered (R3), and the header's "view all" control (when a 9th row exists) is built from the
 * SAME settled predicate that produced the rendered rows (D72-1) via `similarity.ts` (D72-3) — the
 * one shared source also consumed by `buildSimilarListingsHref` (`ListingDetailView.tsx`, R2).
 *
 * Speculation Rules (§3): emits a <script type="speculationrules"> for the first 2 of the
 * RENDERED (not fetched) similar listing URLs when Save-Data is not set (§10.5 preservation).
 *
 * Task 665: the heading + card grid are extracted into the presentational
 * `SimilarListingsView` (container/View split); this container keeps the query,
 * headers, and speculation-rules script, and owns the `.similar-listings` wrapper so
 * production output stays byte-identical to the pre-split render.
 */
export async function SimilarListings({
  currentId, propertyType, listingType, locationId,
  condition, heating, wallType, marketType, offerType, purchaseConditions,
  rooms, areaGross, floor, yearBuilt,
}: Props) {
  const [t, locale, supabase, exchangeRates, authUser] = await Promise.all([
    getTranslations('listing'),
    getLocale(),
    createClient(),
    getExchangeRates(),
    getUser(),
  ])

  let displayCurrency = 'ALL'
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('id', authUser.id)
      .maybeSingle()
    displayCurrency = (profile as { preferred_currency?: string } | null)?.preferred_currency ?? 'ALL'
  }

  const similarityInput: SimilarityListingInput = {
    location_id: locationId,
    condition, heating,
    wall_type: wallType,
    market_type: marketType,
    offer_type: offerType,
    purchase_conditions: purchaseConditions,
    rooms,
    area_gross: areaGross,
    floor,
    year_built: yearBuilt,
  }
  const entries = buildSimilarityEntries(similarityInput)
  const core = { currentId, propertyType, listingType }

  // Relaxation ladder (R5/D72-4) — at most 4 Supabase round trips, stopping at the first
  // non-empty rung. Attempt 4 (core only) reproduces pre-Task-803 behaviour exactly.
  const baseQuery = () => supabase.from('listings').select(SELECT)
  const { listings, settledEntries } = await runSimilarityLadder(async attempt => {
    const q = buildSimilarityRungQuery(baseQuery, core, entries, attempt)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- .limit() exists on every rung's real Postgrest query; buildSimilarityRungQuery's unconstrained `Q` doesn't carry it through.
    const { data } = await (q as any).limit(QUERY_LIMIT)
    return data
  }, entries)

  if (!listings?.length) return null

  const { rendered, hasMore, viewAllHref } = resolveSimilarListingsPresentation(
    listings, settledEntries, locale, { listingType, propertyType },
  )

  // Speculation Rules — prerender the first 2 of the RENDERED similar listing URLs on hover/focus
  // intent. Skipped when the client sends Save-Data: on (bandwidth-constrained users).
  const headersList = await headers()
  const saveData = headersList.get('Save-Data') === 'on'
  const speculationUrls = !saveData
    ? rendered.slice(0, 2).map(l => `/${locale}/listings/${(l as { slug: string }).slug}`)
    : []

  return (
    <div className="similar-listings">
      <SimilarListingsView
        heading={t('similar_listings')}
        listings={rendered as unknown as CardListingData[]}
        rates={exchangeRates}
        displayCurrency={displayCurrency}
        viewAllHref={viewAllHref}
        viewAllLabel={hasMore ? t('view_all') : undefined}
      />

      {speculationUrls.length > 0 && (
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [{
                source: 'list',
                urls: speculationUrls,
                eagerness: 'conservative',
              }],
            }),
          }}
        />
      )}
    </div>
  )
}
