/**
 * Notification fixtures (Task 861 R4c) — shared, labelled fixture DATA for the `NotificationItem` and
 * `NotificationCenter` Mantine Stories. Moved verbatim from the retired
 * `src/modules/notifications/components/NotificationItem.stories.tsx` (title `Notifications/NotificationItem`), the
 * four prose titles now resolved per toolbar locale:
 * the eight rows cover every Task 319 producer plus the three legacy `template_id = null` fallbacks. Plain
 * data — no Supabase, no wall-clock (frozen `NOW`).
 */
import type { Notification } from '@/types/database'
import { storyT } from '../_storyI18n'

// Frozen "now" (no Date.now()/new Date() wall-clock in fixtures per Storybook governance §14,
// Task 697, D24) — a cross-day capture must render byte-identical PNGs.
const NOW = '2026-07-30T00:00:00.000Z'

function n(partial: Partial<Notification> & Pick<Notification, 'id' | 'type' | 'title' | 'body'>): Notification {
  return {
    user_id: 'user-1',
    link: null,
    is_read: false,
    created_at: NOW,
    template_id: null,
    template_params: null,
    ...partial,
  }
}

// Task 319 (Epic II Phase 2) — render-time locale-binding fix. Each story below
// represents one producer's stored row (sq-fallback title/body + template_id/params)
// plus the two legacy (template_id=null) rows that must keep rendering verbatim /
// via the pre-existing special-cases.

/**
 * Rows are built per toolbar locale: the four titles that read as user-facing prose come from `storyT` (§14.2) —
 * the three template rows' stored fallback is the real `notifications.<template_id>_title` copy, and the legacy
 * status row's verbatim title is `storybook.notifications.legacy_status_title`.
 */
export function notificationRows(locale: string): Notification[] {
  return [
    // Producer #3 — saved_search_match (template_id, {searchName, count})
    n({
      id: '1',
      type: 'saved_search_match',
      title: 'Kërkim i ruajtur: Apartament 2+1 Tiranë',
      body: '3 listim të reja',
      template_id: 'saved_search_match',
      template_params: { searchName: 'Apartament 2+1 Tiranë, Qendër, deri 120,000 EUR', count: 3 },
      link: '/sq/listings',
    }),
    // Producer #4 — price_change (template_id, numeric params)
    n({
      id: '2',
      type: 'price_change',
      title: 'Ndryshim çmimi: Vilë private me oborr dhe pishinë, Durrës',
      body: '180,000 EUR → 165,000 EUR',
      template_id: 'price_change',
      template_params: {
        oldPrice: 180000,
        newPrice: 165000,
        currency: 'EUR',
        listingName: 'Vilë private me oborr dhe pishinë, Durrës',
        listingId: 'listing-1',
      },
      link: '/sq/listings/listing-1',
      is_read: true,
    }),
    // Producer #1 — support_created (template_id, no params)
    n({
      id: '3',
      type: 'support_reply',
      title: storyT(locale, 'notifications.support_created_title'),
      body: 'Administratori ka hapur një ankesë lidhur me llogarinë tuaj. Ekipi ynë do ta shqyrtojë.',
      template_id: 'support_created',
      template_params: {},
    }),
    // Producer #2 — support_resolved (template_id, no params)
    n({
      id: '4',
      type: 'report_outcome',
      title: storyT(locale, 'notifications.support_resolved_title'),
      body: 'Ankesa lidhur me llogarinë tuaj u shqyrtua dhe u zgjidh nga ekipi ynë.',
      template_id: 'support_resolved',
      template_params: {},
      is_read: true,
    }),
    // Producer #5 — report_resolved (template_id, no params)
    n({
      id: '5',
      type: 'report_outcome',
      title: storyT(locale, 'notifications.report_resolved_title'),
      body: 'Faleminderit për raportimin tuaj. Ne kemi shqyrtuar ankesën dhe kemi ndërmarrë hapat e nevojshëm.',
      template_id: 'report_resolved',
      template_params: {},
      is_read: true,
    }),
    // LEGACY row — saved_search_match, template_id NULL, body = numeric count string
    // (pre-existing special-case in NotificationItem must still resolve `saved_search_match_body`)
    n({
      id: '6',
      type: 'saved_search_match',
      title: 'Kërkim i ruajtur: Tokë / Truall Vlorë',
      body: '7',
      template_id: null,
      template_params: null,
      link: '/sq/listings',
    }),
    // LEGACY row — listing_status_change, template_id NULL, NEW JSON body
    // (pre-existing resolveStatusBody() special-case must still run)
    n({
      id: '7',
      type: 'listing_status_change',
      title: storyT(locale, 'storybook.notifications.legacy_status_title'),
      body: JSON.stringify({ from: 'pending', to: 'active' }),
      template_id: null,
      template_params: null,
      is_read: true,
      link: '/sq/listings/listing-2',
    }),
    // LEGACY row — verbatim title/body, no special-case (e.g. old marketing/new_message row)
    n({
      id: '8',
      type: 'marketing',
      title: 'Mirë se vini në Lero.al',
      body: 'Eksploroni listimet më të fundit në platformën tonë.',
      template_id: null,
      template_params: null,
      is_read: true,
    }),
  ]
}
