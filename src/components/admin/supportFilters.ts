import type { TicketStatus } from '@/types/database'

export type SupportTypeFilter = 'all' | 'support' | 'user_complaint'
export type SupportAssignedFilter = 'all' | 'unassigned'

/** The status filter is one choice: every status, the "active" preset (open + in progress), or one status. */
export type SupportStatusFilter = 'all' | 'active' | TicketStatus

export interface SupportFilters {
  type: SupportTypeFilter
  status: SupportStatusFilter
  assigned: SupportAssignedFilter
}

export const SUPPORT_TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

/** The statuses the "active" preset covers (the ADM-06 dashboard card links to this set). */
export const SUPPORT_ACTIVE_STATUSES: TicketStatus[] = ['open', 'in_progress']

export const DEFAULT_SUPPORT_FILTERS: SupportFilters = { type: 'all', status: 'all', assigned: 'all' }

type SearchParamValue = string | string[] | undefined

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/**
 * Parses the `/admin/support` search params (Task 859): `type` is `support` or `user_complaint`, else `all`;
 * `status` is a comma list normalised to one choice: `open,in_progress` in any order is `active`, one known status is
 * that status, anything else (unknown, empty or another combination) is `all`; `assigned` is `unassigned`, else `all`.
 * A plain module (no `'use client'`) so the server `page.tsx` can call it.
 */
export function parseSupportFilters(sp: Record<string, SearchParamValue>): SupportFilters {
  const type = first(sp.type)
  const assigned = first(sp.assigned)
  const known = SUPPORT_TICKET_STATUSES as string[]
  const list = (first(sp.status) ?? '')
    .split(',')
    .map(s => s.trim())
    .filter((s, i, all) => known.includes(s) && all.indexOf(s) === i) as TicketStatus[]
  const isActive = list.length === SUPPORT_ACTIVE_STATUSES.length && SUPPORT_ACTIVE_STATUSES.every(s => list.includes(s))
  const status: SupportStatusFilter = isActive ? 'active' : list.length === 1 ? list[0] : 'all'
  return {
    type: type === 'support' || type === 'user_complaint' ? type : 'all',
    status,
    assigned: assigned === 'unassigned' ? 'unassigned' : 'all',
  }
}

/** Inverse of `parseSupportFilters`: the query string (no leading `?`), defaults omitted, encoded like the dashboard hrefs. */
export function serializeSupportFilters(filters: SupportFilters): string {
  const { type, status: statusChoice, assigned } = filters
  const params = new URLSearchParams()
  if (assigned !== 'all') params.set('assigned', assigned)
  if (statusChoice === 'active') params.set('status', SUPPORT_ACTIVE_STATUSES.join(','))
  else if (statusChoice !== 'all') params.set('status', statusChoice)
  if (type !== 'all') params.set('type', type)
  return params.toString()
}

export function matchesSupportFilters(
  ticket: { ticket_type: string; status: string; assigned_to: string | null },
  filters: SupportFilters,
): boolean {
  const { type, status: statusChoice, assigned } = filters
  const { ticket_type: ticketType, status: ticketStatus, assigned_to: assignedTo } = ticket
  if (type !== 'all' && ticketType !== type) return false
  if (statusChoice === 'active' && !(SUPPORT_ACTIVE_STATUSES as string[]).includes(ticketStatus)) return false
  if (statusChoice !== 'all' && statusChoice !== 'active' && ticketStatus !== statusChoice) return false
  if (assigned === 'unassigned' && assignedTo !== null) return false
  return true
}
