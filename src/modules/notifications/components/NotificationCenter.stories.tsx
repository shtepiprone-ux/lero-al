import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationCenter } from './NotificationCenter'
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
// in the active locale, so the bottom sheet content is locale-correct in the toolbar.
const ROWS: Notification[] = [
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
    title: 'Ankesë për llogarinë tuaj',
    body: 'Administratori ka hapur një ankesë lidhur me llogarinë tuaj. Ekipi ynë do ta shqyrtojë.',
    template_id: 'support_created',
    template_params: {},
  }),
]

const EMPTY_ROWS: Notification[] = []

interface DemoProps {
  notifications: Notification[]
}

/**
 * Mirrors NotificationBell.tsx: Popover trigger (bell) + PopoverContent hosting
 * NotificationCenter — w-80 anchored dropdown >=640px, full-width bottom sheet <640px.
 */
function NotificationBellDemo({ notifications }: DemoProps) {
  const t = useTranslations('notifications')
  return (
    <div className="flex justify-end p-4">
      <Popover defaultOpen>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('title')}
              className="relative rounded-xl bg-muted text-foreground"
            >
              <Bell className="size-5" />
            </Button>
          }
        />
        <PopoverContent
          role="dialog"
          aria-label={t('title')}
          align="end"
          sideOffset={8}
          className="w-80 max-h-120 gap-0 rounded-xl border bg-background p-0 shadow-lg ring-0 overflow-hidden"
        >
          <NotificationCenter notifications={notifications} onRead={() => {}} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const meta: Meta<typeof NotificationBellDemo> = {
  title: 'Notifications/NotificationCenter',
  component: NotificationBellDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'NotificationBell popup (design-system §26.2). At <640px renders as a full-width bottom sheet — edge-to-edge, rounded top corners, drag handle, internal scroll; at >=640px renders as the anchored w-80 dropdown, unchanged.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof NotificationBellDemo>

export const Default: Story = {
  args: { notifications: ROWS },
}

export const MobileBottomSheet: Story = {
  args: { notifications: ROWS },
  parameters: {
    docs: {
      description: {
        story: '@320: notification popup opens as a full-width bottom sheet — edge-to-edge, drag handle, rounded top corners, internal scroll, no document h-scroll. Use locale toolbar (uk@320/375/390 mandatory).',
      },
    },
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

export const Empty: Story = {
  args: { notifications: EMPTY_ROWS },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
