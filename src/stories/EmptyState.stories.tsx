import type { Meta, StoryObj } from '@storybook/react';
import { Home, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const meta: Meta = {
  title: 'System/EmptyState',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Canonical empty state pattern. See docs/tailwind-canonical-fragments.md §10.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Reusable empty state component following canonical fragment
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
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
  render: () => (
    <EmptyState
      icon={Home}
      title="No listings found"
      description="Try adjusting your search filters to find more properties."
      action={<Button size="xl" variant="outline">Clear filters</Button>}
    />
  ),
};

export const NoFavorites: Story = {
  render: () => (
    <EmptyState
      icon={Heart}
      title="No saved listings"
      description="Save listings you like to see them here."
      action={<Button size="xl">Browse listings</Button>}
    />
  ),
};

export const NoSearchResults: Story = {
  render: () => (
    <EmptyState
      icon={Search}
      title="No results"
      description="We couldn't find any properties matching your search."
      action={<Button size="xl" variant="outline">Modify search</Button>}
    />
  ),
};

export const UkrainianLocale: Story = {
  render: () => (
    <EmptyState
      icon={Home}
      title="Оголошень не знайдено"
      description="Спробуйте змінити параметри пошуку, щоб знайти більше нерухомості."
      action={<Button size="xl" variant="outline">Очистити фільтри</Button>}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ukrainian locale empty state — longer text, must fit within max-w-sm.',
      },
    },
  },
};

export const MobileEmptyState: Story = {
  render: () => (
    <EmptyState
      icon={Home}
      title="No listings found"
      description="Try adjusting your search filters."
      action={<Button size="xl" className="w-full">Clear filters</Button>}
    />
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
  },
};
