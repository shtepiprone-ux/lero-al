import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button, Stack, TextInput } from '@mantine/core'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { AdminEditLayout } from '@/components/admin/AdminEditLayout'
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers to concrete file paths.
import { MantineFormSection } from '@/design-system/mantine/patterns/MantineFormSectionStack'

// Task 957 Revision 2 (R2-1; Review 2 F8): `AdminEditLayout` on Mantine, with its direct Story. The main column holds two form section cards, the sidebar a card with the actions.
// One column below 1024px; from 1024px the sidebar is 288px wide and sticks 80px from the top, from 1280px it is 320px (`theme.other.layout.editLayoutSidebar*`).
// Fixture texts come from the storybook messages; viewport and locale come from the Storybook toolbar.
// GR-3d (Revision 3, F17): the layout has no page gutter of its own (the page that renders it supplies it), so the export is wrapped in `StoryPageGutter` on all four sides.
const meta: Meta<typeof AdminEditLayout> = {
  title: 'Patterns/Mantine/AdminEditLayout',
  component: AdminEditLayout,
  tags: ['autodocs'],
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof AdminEditLayout>

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <StoryPageGutter>
        <AdminEditLayout
          main={(
            <>
              <MantineFormSection title={storyT(l, 'storybook.mantine.form_section_contact')}>
                <Stack>
                  <TextInput label={storyT(l, 'storybook.mantine.form_name')} />
                  <TextInput label={storyT(l, 'storybook.mantine.form_email')} type="email" />
                </Stack>
              </MantineFormSection>
              <MantineFormSection title={storyT(l, 'storybook.mantine.form_section_location')}>
                <TextInput label={storyT(l, 'storybook.mantine.form_address')} />
              </MantineFormSection>
            </>
          )}
          sidebar={(
            <MantineFormSection>
              <Stack>
                <Button fullWidth>{storyT(l, 'storybook.mantine.action_save')}</Button>
                <Button fullWidth variant="default">{storyT(l, 'storybook.mantine.action_cancel')}</Button>
              </Stack>
            </MantineFormSection>
          )}
        />
      </StoryPageGutter>
    )
  },
}
