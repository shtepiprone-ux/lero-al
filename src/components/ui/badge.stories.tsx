import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

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

const BG: Record<string, Record<string, string>> = {
  premium:  { en: 'Premium',        sq: 'Premium',           uk: 'Premium',          it: 'Premium' },
  new_b:    { en: 'New',            sq: 'E re',              uk: 'Nove',             it: 'Nuovo' },
  for_rent: { en: 'For rent',       sq: 'Me qira',           uk: 'V orendu',         it: 'In affitto' },
  active:   { en: 'Active',         sq: 'Aktiv',             uk: 'Aktyvne',          it: 'Attivo' },
  pending:  { en: 'Pending review', sq: 'Ne shqyrtim',       uk: 'Na perevirotsi',   it: 'In revisione' },
  inactive: { en: 'Inactive',       sq: 'Joaktiv',           uk: 'Neaktyvne',        it: 'Inattivo' },
  archived: { en: 'Archived',       sq: 'Arkivuar',          uk: 'Arkhivovane',      it: 'Archiviato' },
  rented:   { en: 'Rented / Sold',  sq: 'Qiradhene / Shitur', uk: 'Orendovano / Prodano', it: 'Affittato / Venduto' },
}
const bg = (k: string, l = 'en') => BG[k]?.[l] ?? BG[k]?.en ?? k

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
        <Badge variant="default">{bg('new_b', l)}</Badge>
        <Badge variant="secondary">{bg('for_rent', l)}</Badge>
        <Badge variant="success">{bg('active', l)}</Badge>
        <Badge variant="warning">{bg('pending', l)}</Badge>
        <Badge variant="destructive">{bg('archived', l)}</Badge>
        <Badge variant="info">{bg('premium', l)}</Badge>
        <Badge variant="rented">{bg('rented', l)}</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="neutral">Neutral</Badge>
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
