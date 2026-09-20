/**
 * Agent statistics drill-down targets, built in one place — Task 848.
 *
 * Every target is an EXISTING cabinet landing: `/{locale}/cabinet?tab=listings&filter=<group>`, where
 * `<group>` is one of `VALID_VISIBILITY_GROUPS`. No new cabinet filter exists; a card whose set is
 * narrower than the group lands on the group that contains it.
 *
 *   pending        -> HIDDEN   (the group holds `pending`, `inactive`, `expired`)
 *   inactive       -> HIDDEN
 *   hidden (AGT-01)-> VISIBLE  (status `active`; the listing is hidden only by its expiry — the
 *                               cabinet row's edit/status flow is where the agent renews it)
 *   expiring       -> VISIBLE  (edit / renewal of a still-visible listing)
 *   visible        -> VISIBLE
 *   sold / rented  -> CLOSED
 *   all            -> ALL
 *
 * Queries go through `URLSearchParams`, never string concatenation.
 */
import type { ListingVisibilityGroup } from '@/modules/cabinet/lib/queries'

export type AgentCardTarget = 'pending' | 'hidden' | 'expiring' | 'visible' | 'inactive' | 'sold' | 'rented' | 'all'

const GROUP_BY_TARGET: Record<AgentCardTarget, ListingVisibilityGroup> = {
  pending: 'HIDDEN',
  hidden: 'VISIBLE',
  expiring: 'VISIBLE',
  visible: 'VISIBLE',
  inactive: 'HIDDEN',
  sold: 'CLOSED',
  rented: 'CLOSED',
  all: 'ALL',
}

/** The cabinet listings tab filtered to `group`. */
export function cabinetListingsHref(locale: string, group: ListingVisibilityGroup): string {
  const query = new URLSearchParams([
    ['tab', 'listings'],
    ['filter', group],
  ]).toString()
  return `/${encodeURIComponent(locale)}/cabinet?${query}`
}

/** The drill-down target of an AGT-01 / AGT-02 card. */
export function agentCardHref(locale: string, target: AgentCardTarget): string {
  return cabinetListingsHref(locale, GROUP_BY_TARGET[target])
}
