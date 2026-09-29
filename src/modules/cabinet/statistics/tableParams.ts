/**
 * The AGT-10 table URL contract (Task 854) — read by the server page, written by the client view.
 *
 * Deliberately its own plain module: `AgentStatisticsView.tsx` is `'use client'`, and a Server
 * Component may only render a client module's exported Components, never call one of its plain
 * function exports directly (Next.js: "Attempted to call X() from the server but X is on the
 * client"). Measured live 2026-09-27 — `page.tsx` importing `parseAgt10Table` from the view
 * threw exactly that error on first real request; moving the pure functions here (no `'use client'`)
 * fixes it, since both a Server Component and a Client Component may import a plain shared module.
 *
 * The kickoff names exactly `period, from, to, status, visibility, type, sort, page` as the read URL
 * params — no separate `direction` param (an inference, not an owner decision — see the kickoff's
 * §5 open-questions list, which does not cover this). `AGT10_SORT_TOKENS` carries field+direction as
 * one combined token.
 */
import { LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import type { Agt10Table, Agt10Sort, Agt10Direction } from '@/modules/cabinet/statistics/types'
import type { ListingStatus } from '@/types/database'

export const AGT10_SORT_TOKENS: Record<string, { sort: Agt10Sort; direction: Agt10Direction }> = {
  created_desc: { sort: 'created_at', direction: 'desc' },
  created_asc: { sort: 'created_at', direction: 'asc' },
  expires_asc: { sort: 'expires_at', direction: 'asc' },
  expires_desc: { sort: 'expires_at', direction: 'desc' },
  inquiries_desc: { sort: 'form_inquiries', direction: 'desc' },
  inquiries_asc: { sort: 'form_inquiries', direction: 'asc' },
  // Task 891 (R7) — the activity aggregate's per-listing columns.
  views_desc: { sort: 'recorded_views', direction: 'desc' },
  views_asc: { sort: 'recorded_views', direction: 'asc' },
  whatsapp_desc: { sort: 'whatsapp_clicks', direction: 'desc' },
  whatsapp_asc: { sort: 'whatsapp_clicks', direction: 'asc' },
  activity_desc: { sort: 'last_activity_date', direction: 'desc' },
  activity_asc: { sort: 'last_activity_date', direction: 'asc' },
}
export const DEFAULT_AGT10_SORT_TOKEN = 'created_desc'

export function sortTokenOf(sort: Agt10Sort, direction: Agt10Direction): string {
  const found = Object.entries(AGT10_SORT_TOKENS).find(([, v]) => v.sort === sort && v.direction === direction)
  return found ? found[0] : DEFAULT_AGT10_SORT_TOKEN
}

/**
 * Resolves a URL/user-supplied token to its sort/direction pair. `Object.hasOwn` (review 1, N2) —
 * a bare `AGT10_SORT_TOKENS[token]` lookup resolves `?sort=constructor` or `?sort=__proto__` to an
 * inherited `Object.prototype` member instead of `undefined`, which would put `undefined` into
 * `Agt10Table.sort`/`direction` and break the type. Every token lookup goes through this function.
 */
export function resolveSortToken(token: string | undefined): { sort: Agt10Sort; direction: Agt10Direction } {
  if (token !== undefined && Object.hasOwn(AGT10_SORT_TOKENS, token)) return AGT10_SORT_TOKENS[token]
  return AGT10_SORT_TOKENS[DEFAULT_AGT10_SORT_TOKEN]
}

type ParamValue = string | string[] | undefined
export type Agt10SearchParams = URLSearchParams | Record<string, ParamValue>

function readParam(params: Agt10SearchParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

const KNOWN_STATUSES = new Set<string>(LISTING_STATUS_CODES)

/** The inverse of `serializeAgt10Table`. Anything missing, malformed or unknown falls back to the
 * default (no filter / `created_desc` / page 1) — never throws (kickoff §10.3). */
export function parseAgt10Table(params: Agt10SearchParams): Agt10Table {
  const status = readParam(params, 'status')
  const visibility = readParam(params, 'visibility')
  const listingType = readParam(params, 'type')
  const sortToken = readParam(params, 'sort')
  const { sort, direction } = resolveSortToken(sortToken)
  const pageRaw = Number(readParam(params, 'page'))
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  return {
    status: status && KNOWN_STATUSES.has(status) ? (status as ListingStatus) : undefined,
    visibility: visibility === 'visible' || visibility === 'hidden' ? visibility : undefined,
    listingType: listingType === 'sale' || listingType === 'rent' ? listingType : undefined,
    sort,
    direction,
    page,
  }
}

/** The inverse of `parseAgt10Table` — only the params the kickoff names are ever written. */
export function serializeAgt10Table(table: Agt10Table): Record<string, string> {
  const out: Record<string, string> = { sort: sortTokenOf(table.sort, table.direction) }
  if (table.status) out.status = table.status
  if (table.visibility) out.visibility = table.visibility
  if (table.listingType) out.type = table.listingType
  if (table.page > 1) out.page = String(table.page)
  return out
}
