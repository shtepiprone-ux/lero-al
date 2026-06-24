import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineNotificationPattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineNotificationPattern> = {
  title: 'Patterns/Mantine/NotificationPattern',
  component: MantineNotificationPattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Mantine notification patterns. Requires Notifications portal (provided by MantineRootProvider). Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineNotificationPattern>;

const makeArgs = (l = 'en') => ({
  triggerSuccessLabel: storyT(l, 'storybook.mantine.notification_success_title'),
  triggerErrorLabel: storyT(l, 'storybook.mantine.notification_error_title'),
  triggerInfoLabel: storyT(l, 'storybook.mantine.loading_title'),
  successConfig: {
    variant: 'success' as const,
    title: storyT(l, 'storybook.mantine.notification_success_title'),
    message: storyT(l, 'storybook.mantine.notification_success_msg'),
  },
  errorConfig: {
    variant: 'error' as const,
    title: storyT(l, 'storybook.mantine.notification_error_title'),
    message: storyT(l, 'storybook.mantine.notification_error_msg'),
  },
  infoConfig: {
    variant: 'info' as const,
    title: storyT(l, 'storybook.mantine.loading_title'),
    message: storyT(l, 'storybook.mantine.empty_description'),
  },
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineNotificationPattern {...makeArgs(l)} />;
  },
};
