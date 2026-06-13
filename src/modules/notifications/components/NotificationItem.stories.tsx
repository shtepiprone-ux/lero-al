import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/types/database'

const NOW = new Date().toISOString()

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
const ROWS: Notification[] = [
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
    title: 'Ankesë për llogarinë tuaj',
    body: 'Administratori ka hapur një ankesë lidhur me llogarinë tuaj. Ekipi ynë do ta shqyrtojë.',
    template_id: 'support_created',
    template_params: {},
  }),
  // Producer #2 — support_resolved (template_id, no params)
  n({
    id: '4',
    type: 'report_outcome',
    title: 'Çështja juaj u zgjidh',
    body: 'Ankesa lidhur me llogarinë tuaj u shqyrtua dhe u zgjidh nga ekipi ynë.',
    template_id: 'support_resolved',
    template_params: {},
    is_read: true,
  }),
  // Producer #5 — report_resolved (template_id, no params)
  n({
    id: '5',
    type: 'report_outcome',
    title: 'Raporti juaj u shqyrtua',
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
    title: 'Statusi i listimit u ndryshua',
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

const meta: Meta<typeof NotificationItem> = {
  title: 'Notifications/NotificationItem',
  component: NotificationItem,
  tags: ['autodocs'],
  args: { onRead: () => {} },
}
export default meta
type Story = StoryObj<typeof NotificationItem>

/**
 * All Task 319 producer cases + legacy fallbacks, stacked inside the real
 * `w-80` (320px) NotificationCenter list container — mirrors the bell dropdown.
 */
export const AllCases: Story = {
  render: () => (
    <div className="w-80 max-h-120 flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg divide-y">
      {ROWS.map(row => (
        <NotificationItem key={row.id} notification={row} onRead={() => {}} />
      ))}
    </div>
  ),
  globals: { viewport: { value: 'mobile390', isRotated: false } },
}

export const AllCasesMobile320: Story = {
  ...AllCases,
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

export const AllCasesMobile375: Story = {
  ...AllCases,
  globals: { viewport: { value: 'mobile375', isRotated: false } },
}

/** Single price_change row, unread, mobile320 — focuses on the long listing name + ICU price params. */
export const PriceChangeUnread: Story = {
  args: { notification: ROWS[1], onRead: () => {} },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

/** Single saved_search_match row with a long search name — title param wrap check. */
export const SavedSearchMatchUnread: Story = {
  args: { notification: ROWS[0], onRead: () => {} },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
