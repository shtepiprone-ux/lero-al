import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: "Primitives/DropdownMenu",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Base-UI Menu primitive. At <640px renders as a full-width bottom sheet. Items are >=44px at mobile." } } },
};
export default meta;
type Story = StoryObj;

const d = (k: string, l = "en") => storyT(l, `storybook.dropdown.${k}`);

export const Default: Story = {
  parameters: {},
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button>{d("open", locale)}</Button>} />
        <DropdownMenuContent>
          <DropdownMenuItem>{d("edit", locale)}</DropdownMenuItem>
          <DropdownMenuItem>{d("dup", locale)}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">{d("del", locale)}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const MobileBottomSheet: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" }, docs: { description: { story: "@320: menu opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px, long labels wrap. Use locale toolbar." } } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button>{d("actions", locale)}</Button>} />
          <DropdownMenuContent>
            <DropdownMenuItem>{d("edit_long", locale)}</DropdownMenuItem>
            <DropdownMenuItem>{d("dup_long", locale)}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">{d("del_long", locale)}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
};
