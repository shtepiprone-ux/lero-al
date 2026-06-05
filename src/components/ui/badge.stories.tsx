import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import { storyT } from '@/stories/_storyI18n';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {},
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link', 'success', 'warning', 'info', 'rented', 'neutral'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

const bg = (k: string, l = 'en') => storyT(l, `storybook.badge.${k}`)

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <Badge variant="default">{bg('premium', l)}</Badge>
  },
};

export const AllVariants: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">{bg('new', l)}</Badge>
        <Badge variant="secondary">{bg('for_rent', l)}</Badge>
        <Badge variant="success">{bg('active', l)}</Badge>
        <Badge variant="warning">{bg('pending', l)}</Badge>
        <Badge variant="destructive">{bg('archived', l)}</Badge>
        <Badge variant="info">{bg('premium', l)}</Badge>
        <Badge variant="rented">{bg('rented', l)}</Badge>
        <Badge variant="outline">{'Outline'}</Badge>
        <Badge variant="neutral">{'Neutral'}</Badge>
      </div>
    )
  },
};

export const ListingStatuses: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">{bg('active', l)}</Badge>
        <Badge variant="warning">{bg('pending', l)}</Badge>
        <Badge variant="neutral">{bg('inactive', l)}</Badge>
        <Badge variant="destructive">{bg('archived', l)}</Badge>
        <Badge variant="rented">{bg('rented', l)}</Badge>
      </div>
    )
  },
  parameters: { docs: { description: { story: 'Canonical listing status badges. Use locale toolbar for sq/en/uk/it.' } } },
};

export const LocaleVariants: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">{bg('active', 'en')}</Badge>
          <Badge variant="success">{bg('active', 'sq')}</Badge>
          <Badge variant="success">{bg('active', 'uk')}</Badge>
          <Badge variant="success">{bg('active', 'it')}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">en / sq / uk / it — badge text varies in length</p>
        <Badge variant="info">{bg('active', l)}</Badge>
      </div>
    )
  },
};

