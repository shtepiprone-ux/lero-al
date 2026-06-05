import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './skeleton';

const meta: Meta = {
  title: 'Primitives/Skeleton',
  tags: ['autodocs'],
  parameters: {},
};

export default meta;
type Story = StoryObj;

export const ListingCardSkeleton: Story = {
  render: () => (
    <div className="w-full rounded-xl border bg-card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Listing card loading state skeleton.' } },
  },
};

export const ListingGridSkeleton: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  ),

  parameters: {
    docs: {
      description: {
        story: 'Listing grid skeleton — 8 cards. Note `2xl:grid-cols-4` for huge desktop.',
      },
    }
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
};

export const AdminCardSkeleton: Story = {
  render: () => (
    <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3 w-full max-w-xs">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  ),
};
