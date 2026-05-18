import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link', 'success', 'warning', 'info', 'rented', 'neutral'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Premium', variant: 'default' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">New</Badge>
      <Badge variant="secondary">For rent</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Archived</Badge>
      <Badge variant="info">Premium</Badge>
      <Badge variant="rented">Rented</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="neutral">Neutral</Badge>
    </div>
  ),
};

export const ListingStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending review</Badge>
      <Badge variant="neutral">Inactive</Badge>
      <Badge variant="destructive">Archived</Badge>
      <Badge variant="rented">Rented / Sold</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Canonical listing status badges.' },
    },
  },
};

export const LocaleVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Active</Badge>
        <Badge variant="success">Aktiv</Badge>
        <Badge variant="success">Активний</Badge>
        <Badge variant="success">Attivo</Badge>
      </div>
      <p className="text-xs text-muted-foreground">en / sq / uk / it — badge text varies in length</p>
    </div>
  ),
};
