import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Filter, Menu } from "lucide-react";
import { Button } from "./button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: "Primitives/Sheet",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Canonical drawer/panel. ALWAYS use Sheet instead of custom div.fixed.inset-0 mobile drawers. See docs/ui-rules.md §12." } } },
};
export default meta;
type Story = StoryObj;

const s = (key: string, locale = "en") => storyT(locale, `storybook.sheet.${key}`);

export const FilterSheetRight: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Sheet>
        <SheetTrigger render={<Button size="icon-xl" variant="outline" aria-label={s("open_filters", locale)}><Filter /></Button>} />
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{s("filters", locale)}</SheetTitle>
            <SheetDescription>{s("narrow_q", locale)}</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">{s("filter_here", locale)}</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  },

  parameters: {
    docs: { description: { story: "Filter panel sheet — canonical pattern for mobile filter overlay." } }
  },

  globals: {
    viewport: {
      value: "mobile375",
      isRotated: false
    }
  }
};

export const NavDrawerLeft: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    const navItems = [s("home", locale), s("listings", locale), s("favorites", locale), s("about", locale)];
    return (
      <Sheet>
        <SheetTrigger render={<Button size="icon-xl" variant="ghost" aria-label={s("open_nav", locale)}><Menu /></Button>} />
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle>{s("menu", locale)}</SheetTitle>
          </SheetHeader>
          <nav className="py-4 space-y-1">
            {navItems.map(item => (
              <Button key={item} variant="ghost" size="default" className="w-full justify-start text-sm">{item}</Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  },

  parameters: {
    docs: { description: { story: "Navigation drawer — canonical left-side panel for mobile navigation." } }
  },

  globals: {
    viewport: {
      value: "mobile375",
      isRotated: false
    }
  }
};

export const LocaleSheetContent: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Sheet>
        <SheetTrigger render={<Button size="xl">{s("open_sheet", locale)}</Button>} />
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{s("search_filters", locale)}</SheetTitle>
            <SheetDescription>{s("refine", locale)}</SheetDescription>
          </SheetHeader>
          <div className="py-4 text-sm text-muted-foreground">
            {s("params_here", locale)}
          </div>
        </SheetContent>
      </Sheet>
    );
  },
  parameters: { docs: { description: { story: "Locale variant — Sheet header with longer title/description. Use locale toolbar to switch sq/en/uk/it." } } },
};
