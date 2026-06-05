import type { Meta, StoryObj } from '@storybook/react';
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: 'System/Containers',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical container patterns. See docs/ui-rules.md §6 and ' +
          'docs/tailwind-canonical-fragments.md §1.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function DemoBox({ label, locale = 'en', className }: { label: string; locale?: string; className?: string }) {
  return (
    <div className={`bg-primary/10 border border-primary/20 rounded-lg p-4 ${className ?? ''}`}>
      <p className="text-xs font-mono text-primary">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{storyT(locale, 'storybook.containers.content')}</p>
    </div>
  );
}

export const ContainerWide: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
    <div className="w-full bg-muted/30 py-8">
      <div className="container-wide mx-auto px-4">
        <DemoBox label=".container-wide — max 88rem (1408px) — public pages" locale={locale} />
      </div>
    </div>
  )},
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'desktop2560' },
    docs: {
      description: {
        story: 'At 2560px: `.container-wide` bounds content at 1408px, preventing whitespace wasteland.',
      },
    },
  },
};

export const ContainerNarrow: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
    <div className="w-full bg-muted/30 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <DemoBox label="max-w-5xl mx-auto — auth/cabinet pages (~64rem)" locale={locale} />
      </div>
    </div>
  )},
  parameters: { layout: 'fullscreen' },
};

export const AdminContainer: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
    <div className="w-full bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <DemoBox label="max-w-6xl mx-auto p-6 lg:p-8 — admin content" locale={locale} />
      </div>
    </div>
  )},
  parameters: { layout: 'fullscreen' },
};

export const AllContainers: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
    <div className="space-y-4 w-full">
      <div className="container-wide mx-auto px-4">
        <DemoBox label=".container-wide (88rem) — public pages" locale={locale} className="border-blue-500/50 bg-blue-500/10" />
      </div>
      <div className="max-w-5xl mx-auto px-4">
        <DemoBox label="max-w-5xl — auth/cabinet" locale={locale} className="border-green-500/50 bg-green-500/10" />
      </div>
      <div className="max-w-3xl mx-auto px-4">
        <DemoBox label="max-w-3xl — narrow centered content" locale={locale} className="border-orange-500/50 bg-orange-500/10" />
      </div>
    </div>
  )},
  parameters: { layout: 'fullscreen' },
};
