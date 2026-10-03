import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2 } from 'lucide-react'
import { Button, Card, useMantineTheme } from '@mantine/core'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

// Task 857 R48 — canonical dialog footer (docs §23.7). GR-3a: CREATE — no Story imports a dialog footer (searched
// `src/stories/**`: `MantineResponsiveActionFooter` is a sticky page footer with an inline style, not a dialog
// footer). A `Card` with the dialog body's `md` padding stands in for the dialog so the pair reads in context. GR-3b:
// fluid, no width or viewport pin. GR-3d: no gutter of its own, so every export wraps in `StoryPageGutter`. Button
// labels are the existing `common` translations. Locale and viewport come from the Storybook toolbar.
const meta: Meta<typeof MantineDialogFooter> = {
  title: 'Patterns/Mantine/DialogFooter',
  component: MantineDialogFooter,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Footer of a dialog (§23.7): at most two buttons of equal width at every width — secondary (`variant="default"`) on the left, primary (filled) on the right, each at least 44px tall; a lone button spans the full width. The footer forces the width and height, so a caller cannot break the pair.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MantineDialogFooter>

function FooterDemo({ pair }: { pair: boolean }) {
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard
  return (
    <StoryPageGutter>
      <Card withBorder radius="md" padding="md">
        <MantineDialogFooter
          secondary={
            pair ? (
              <Button variant="default" c="red.7" leftSection={<Trash2 size={iconSize} />}>
                {tc('delete')}
              </Button>
            ) : undefined
          }
          primary={<Button leftSection={<Pencil size={iconSize} />}>{tc('edit')}</Button>}
        />
      </Card>
    </StoryPageGutter>
  )
}

// A resting destructive secondary (red icon and label on `variant="default"`) and the filled primary.
export const Default: Story = { render: () => <FooterDemo pair /> }

// One button: full width.
export const SingleButton: Story = { render: () => <FooterDemo pair={false} /> }
