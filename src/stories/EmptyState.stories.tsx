import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Home, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: 'System/EmptyState',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: 'Canonical empty state pattern. See docs/tailwind-canonical-fragments.md §10.' } } },
};
export default meta;
type Story = StoryObj;

const e = (k: string, l = 'en') => storyT(l, `storybook.emptystate.${k}`)

function EmptyStateBlock({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export const NoListings: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Home} title={e('no_listings_title',l)} description={e('no_listings_desc',l)} action={<Button size="xl" variant="outline">{e('clear_filters',l)}</Button>} />
  },
};

export const NoFavorites: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Heart} title={e('no_saved_title',l)} description={e('no_saved_desc',l)} action={<Button size="xl">{e('browse',l)}</Button>} />
  },
};

export const NoSearchResults: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Search} title={e('no_results_title',l)} description={e('no_results_desc',l)} action={<Button size="xl" variant="outline">{e('modify_search',l)}</Button>} />
  },
};

export const LocaleStress: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Home} title={e('no_listings_title',l)} description={e('no_listings_desc',l)} action={<Button size="xl" variant="outline">{e('clear_filters',l)}</Button>} />
  },
  parameters: { docs: { description: { story: 'Locale stress — longer text must fit within max-w-sm. Use locale toolbar for sq/en/uk/it.' } } },
};

export const MobileEmptyState: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Home} title={e('no_listings_title',l)} description={e('no_listings_desc',l)} action={<Button size="xl" className="w-full">{e('clear_filters',l)}</Button>} />
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  },
};
