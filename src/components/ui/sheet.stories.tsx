import type { Meta, StoryObj } from '@storybook/react';
import { Filter, Menu } from 'lucide-react';
import { Button } from './button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

const meta: Meta = {
  title: 'Primitives/Sheet',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Canonical drawer/panel. ALWAYS use Sheet instead of custom `div.fixed.inset-0` mobile drawers. ' +
          'Provides built-in focus trap. See docs/ui-rules.md §12.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const FilterSheetRight: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={
        <Button size="icon-xl" variant="outline" aria-label="Open filters">
          <Filter />
        </Button>
      } />
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow your search results.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">Filter controls here…</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: 'Filter panel sheet — canonical pattern for mobile filter overlay.',
      },
    },
  },
};

export const NavDrawerLeft: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={
        <Button size="icon-xl" variant="ghost" aria-label="Open navigation">
          <Menu />
        </Button>
      } />
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="py-4 space-y-1">
          {['Home', 'Listings', 'Favorites', 'About'].map(item => (
            <button key={item} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted">
              {item}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: 'Navigation drawer — canonical left-side panel for mobile navigation.',
      },
    },
  },
};

export const LocaleSheetContent: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Фільтри пошуку</SheetTitle>
          <SheetDescription>Уточніть параметри пошуку нерухомості.</SheetDescription>
        </SheetHeader>
        <div className="py-4 text-sm text-muted-foreground">
          Параметри фільтрів…
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ukrainian locale — Sheet header with longer title/description text.',
      },
    },
  },
};
