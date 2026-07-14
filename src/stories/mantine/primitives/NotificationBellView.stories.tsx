import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { MantineStoryShell } from '../_MantineStoryShell'
import { NotificationBellView } from '@/modules/notifications/components/NotificationBellView'
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

// Template-driven rows (Task 319) — title/body render via t(<template_id>_title/_body)
// in the active locale (NextIntlClientProvider), so the panel content is locale-correct
// in the toolbar. Fixtures are plain data — no Supabase, no hook mock (Task 591 split gate).
const UNREAD_ROWS: Notification[] = [
  n({
    id: '1',
    type: 'saved_search_match',
    title: 'Kërkim i ruajtur: Apartament 2+1 Tiranë',
    body: '3 listim të reja',
    template_id: 'saved_search_match',
    template_params: { searchName: 'Apartament 2+1 Tiranë, Qendër, deri 120,000 EUR', count: 3 },
    link: '/sq/listings',
  }),
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
  n({
    id: '3',
    type: 'support_reply',
    title: 'Ankesë për llogarinë tuaj:',
    body: 'Administratori ka hapur një ankesë lidhur me llogarinë tuaj. Ekipi ynë do ta shqyrtojë.',
    template_id: 'support_created',
    template_params: {},
  }),
]

const ALL_READ_ROWS: Notification[] = UNREAD_ROWS.map(row => ({ ...row, is_read: true }))

const EMPTY_ROWS: Notification[] = []

const meta: Meta = {
  title: 'Mantine/Primitives/NotificationBellView',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <MantineStoryShell>
      <Stack gap="xl">

        {/* 1 — unread: mixed read/unread rows, badge shows count (2); click opens panel.
            ≥640: anchored dropdown (align end); <640: full-width bottom sheet.
            Use the toolbar viewport switcher to verify both paths on this ONE section. */}
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            unread — mixed read/unread rows, badge shows count; click opens panel; ≥640: anchored dropdown; &lt;640: full-width bottom sheet (drag handle · rows not clipped · long uk wraps · no h-scroll@320)
          </Text>
          <NotificationBellView
            notifications={UNREAD_ROWS}
            unreadCount={UNREAD_ROWS.filter(row => !row.is_read).length}
            onRead={() => {}}
          />
        </Stack>

        {/* 2 — all read: no badge, no "mark all read" button */}
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            all read — no unread badge, no &quot;mark all read&quot; button
          </Text>
          <NotificationBellView
            notifications={ALL_READ_ROWS}
            unreadCount={0}
            onRead={() => {}}
          />
        </Stack>

        {/* 3 — empty: no notifications, localized empty message */}
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>
            empty — no notifications, localized empty message, no badge, no &quot;mark all read&quot;
          </Text>
          <NotificationBellView
            notifications={EMPTY_ROWS}
            unreadCount={0}
            onRead={() => {}}
          />
        </Stack>

      </Stack>
    </MantineStoryShell>
  ),
}
