import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverTrigger } from "./popover";
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: "Primitives/Popover",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Base-UI Popover primitive. At <640px renders as a full-width bottom sheet." } } },
};
export default meta;
type Story = StoryObj;

const p = (k: string, l = "en") => storyT(l, `storybook.popover.${k}`);

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Popover>
        <PopoverTrigger render={<Button variant="outline">{p("open", locale)}</Button>} />
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>{p("title", locale)}</PopoverTitle>
            <PopoverDescription>{p("desc", locale)}</PopoverDescription>
          </PopoverHeader>
          <p className="text-sm text-muted-foreground">{p("body", locale)}</p>
        </PopoverContent>
      </Popover>
    );
  }
};

export const MobileBottomSheet: Story = {
  parameters: {
    docs: { description: { story: "@320: popover opens as a full-width bottom sheet — edge-to-edge, drag handle. Use locale toolbar." } }
  },

  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <div className="p-4">
        <Popover defaultOpen>
          <PopoverTrigger render={<Button>{p("open_long", locale)}</Button>} />
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>{p("title_long", locale)}</PopoverTitle>
              <PopoverDescription>{p("desc_long", locale)}</PopoverDescription>
            </PopoverHeader>
            <p className="text-sm text-muted-foreground">{p("body_long", locale)}</p>
          </PopoverContent>
        </Popover>
      </div>
    );
  },

  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
};
