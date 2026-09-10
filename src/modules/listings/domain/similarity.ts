/**
 * Similar-listings similarity source (Task 803, D72-3) — single source for the relaxable part of
 * the similar-listings predicate. One ordered structure, two renderers over it: a Supabase
 * predicate applier (`applySimilarityEntries`) and a URL builder (`buildSimilarityHref`). A
 * parameter cannot appear in one without being expressible in the other.
 *
 * Core, non-relaxable fields (`applyPublicVisibility`, `.neq('id', currentId)`, `property_type`,
 * `listing_type`) are NOT modelled here (D72-2) — they are applied by the caller outside the
 * ladder this module only describes the tiers that get relaxed.
 *
 * Param names match the canonical `filterEngine.ts:88-103` table exactly, so a URL built here is
 * accepted end-to-end by `parseSearchParams`/`applyListingFilters` with no new parameter.
 */

export type SimilarityTier = 'A' | 'B' | 'C'
export type SimilarityOp = 'eq' | 'gte' | 'lte' | 'in' | 'overlaps'

export interface SimilarityEntry {
  tier: SimilarityTier
  /** Canonical `/listings` URL parameter name (`filterEngine.ts`). */
  param: string
  op: SimilarityOp
  /** Listing column the predicate applies to. */
  column: string
  value: string | number | string[]
  /** Serialized value for the URL — matches the shape `parseSearchParams` expects for `param`. */
  urlValue: string
}

/** The current listing's fields relevant to similarity. Only the relaxable ones — no
 * `listing_type`/`property_type` (core, D72-2) and no `id` (used only for `.neq`, not similarity). */
export interface SimilarityListingInput {
  location_id: number | null
  condition: string | null
  heating: string | null
  wall_type: string | null
  market_type: string | null
  offer_type: string | null
  purchase_conditions: string[] | null | undefined
  rooms: number | null
  area_gross: number | null
  floor: number | null
  year_built: number | null
}

/** `ASSUMPTION (reversible, stated)` — area ±25%, year_built ±5, rooms/floor exact. Similarity
 * heuristics, not measured product rules (Task 803 kickoff §5). */
const AREA_TOLERANCE = 0.25
const YEAR_BUILT_TOLERANCE = 5

/**
 * Builds the ordered, tiered similarity structure for one listing. Tier A = location, tier B =
 * amenity enums, tier C = numeric-derived ranges. A field is omitted entirely when its source
 * column is null/empty — never emitted as an empty/zero predicate.
 */
export function buildSimilarityEntries(listing: SimilarityListingInput): SimilarityEntry[] {
  const entries: SimilarityEntry[] = []

  // ── Tier A — location ──────────────────────────────────────────────────────
  if (listing.location_id != null) {
    entries.push({
      tier: 'A', param: 'location_id', op: 'eq', column: 'location_id',
      value: listing.location_id, urlValue: String(listing.location_id),
    })
  }

  // ── Tier B — amenity enums ───────────────────────────────────────────────────
  if (listing.condition) {
    entries.push({ tier: 'B', param: 'condition', op: 'in', column: 'condition', value: [listing.condition], urlValue: listing.condition })
  }
  if (listing.heating) {
    entries.push({ tier: 'B', param: 'heating', op: 'in', column: 'heating', value: [listing.heating], urlValue: listing.heating })
  }
  if (listing.wall_type) {
    entries.push({ tier: 'B', param: 'wall_type', op: 'in', column: 'wall_type', value: [listing.wall_type], urlValue: listing.wall_type })
  }
  if (listing.market_type) {
    entries.push({ tier: 'B', param: 'market_type', op: 'eq', column: 'market_type', value: listing.market_type, urlValue: listing.market_type })
  }
  if (listing.offer_type) {
    entries.push({ tier: 'B', param: 'offer_type', op: 'in', column: 'offer_type', value: [listing.offer_type], urlValue: listing.offer_type })
  }
  const purchaseConditions = listing.purchase_conditions ?? []
  if (purchaseConditions.length > 0) {
    entries.push({
      tier: 'B', param: 'purchase_conditions', op: 'overlaps', column: 'purchase_conditions',
      value: purchaseConditions, urlValue: purchaseConditions.join(','),
    })
  }

  // ── Tier C — numerics ─────────────────────────────────────────────────────
  // F7 (Task 803 kickoff §16.2/§16.3d): this predicate is `eq`, but `/listings` reads
  // `rooms=N` as "N or more" (`filterEngine.ts:263-271`) and ignores `rooms>N` — so the URL built
  // from this entry is broader than the query that produced the rendered rows. Reconciling the two
  // is Task 804's scope (comment only, no behaviour change here).
  if (listing.rooms != null) {
    entries.push({ tier: 'C', param: 'rooms', op: 'eq', column: 'rooms', value: listing.rooms, urlValue: String(listing.rooms) })
  }
  if (listing.area_gross != null) {
    const min = Math.round(listing.area_gross * (1 - AREA_TOLERANCE))
    const max = Math.round(listing.area_gross * (1 + AREA_TOLERANCE))
    entries.push({ tier: 'C', param: 'area_min', op: 'gte', column: 'area_gross', value: min, urlValue: String(min) })
    entries.push({ tier: 'C', param: 'area_max', op: 'lte', column: 'area_gross', value: max, urlValue: String(max) })
  }
  if (listing.floor != null) {
    entries.push({ tier: 'C', param: 'floor_min', op: 'gte', column: 'floor', value: listing.floor, urlValue: String(listing.floor) })
    entries.push({ tier: 'C', param: 'floor_max', op: 'lte', column: 'floor', value: listing.floor, urlValue: String(listing.floor) })
  }
  if (listing.year_built != null) {
    const min = listing.year_built - YEAR_BUILT_TOLERANCE
    const max = listing.year_built + YEAR_BUILT_TOLERANCE
    entries.push({ tier: 'C', param: 'year_built_min', op: 'gte', column: 'year_built', value: min, urlValue: String(min) })
    entries.push({ tier: 'C', param: 'year_built_max', op: 'lte', column: 'year_built', value: max, urlValue: String(max) })
  }

  return entries
}

// ── The relaxation ladder (R5/D72-4, exactly 4 attempts — Task 803 kickoff §10.3) ──────────────

export const SIMILARITY_ATTEMPTS = [1, 2, 3, 4] as const
export type SimilarityAttempt = (typeof SIMILARITY_ATTEMPTS)[number]

/**
 * Attempt 1: A+B+C. Attempt 2: A+C (amenity enums dropped). Attempt 3: A only (numerics dropped).
 * Attempt 4: core only (location dropped) — reproduces pre-Task-803 behaviour exactly.
 */
export function entriesForAttempt(entries: SimilarityEntry[], attempt: SimilarityAttempt): SimilarityEntry[] {
  if (attempt === 1) return entries
  if (attempt === 2) return entries.filter(e => e.tier !== 'B')
  if (attempt === 3) return entries.filter(e => e.tier === 'A')
  return []
}

// ── Supabase predicate renderer ──────────────────────────────────────────────────────────────

export interface SimilarityQueryBuilder {
  eq(column: string, value: unknown): SimilarityQueryBuilder
  gte(column: string, value: unknown): SimilarityQueryBuilder
  lte(column: string, value: unknown): SimilarityQueryBuilder
  in(column: string, values: unknown[]): SimilarityQueryBuilder
  overlaps(column: string, values: unknown[]): SimilarityQueryBuilder
}

/** Chains the given entries onto a Supabase query builder — same unconstrained generic-`Q` +
 * internal `any` pattern `applyListingFilters` (`filterEngine.ts:227-229`) and `applyPublicVisibility`
 * (`visibility.ts:99,119`) already use to sidestep Postgrest's builder generics; callers keep their
 * own concrete type via `Q`. Order-preserving; no entry is skipped or reordered. `Q` is documented
 * by `SimilarityQueryBuilder` for mocks/tests, not enforced as a generic bound here. */
export function applySimilarityEntries<Q>(query: Q, entries: SimilarityEntry[]): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query
  for (const entry of entries) {
    switch (entry.op) {
      case 'eq': q = q.eq(entry.column, entry.value); break
      case 'gte': q = q.gte(entry.column, entry.value); break
      case 'lte': q = q.lte(entry.column, entry.value); break
      case 'in': q = q.in(entry.column, entry.value as string[]); break
      case 'overlaps': q = q.overlaps(entry.column, entry.value as string[]); break
    }
  }
  return q as Q
}

// ── URL renderer ──────────────────────────────────────────────────────────────────────────────

/** Builds the `/{locale}/listings` href from the core listing/property type plus the given
 * (already-relaxed) similarity entries. `type`/`property_type` are set first so their position in
 * the resulting query string matches the pre-Task-803 `buildSimilarListingsHref` output exactly. */
export function buildSimilarityHref(
  locale: string,
  core: { listingType: string; propertyType: string },
  entries: SimilarityEntry[],
): string {
  const sp = new URLSearchParams()
  if (core.listingType) sp.set('type', core.listingType)
  if (core.propertyType) sp.set('property_type', core.propertyType)
  for (const entry of entries) sp.set(entry.param, entry.urlValue)
  return `/${locale}/listings?${sp.toString()}`
}
