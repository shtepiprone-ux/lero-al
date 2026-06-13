import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: "Primitives/NavigationMenu",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Base-UI NavigationMenu primitive. At <640px the open submenu popup renders as a full-width bottom sheet." } } },
};
export default meta;
type Story = StoryObj;

const n = (key: string, locale = "en") => storyT(locale, `storybook.sheet.${key}`);

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="listings">
            <NavigationMenuTrigger>{n("listings", locale)}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#">{n("home", locale)}</NavigationMenuLink>
              <NavigationMenuLink href="#">{n("favorites", locale)}</NavigationMenuLink>
              <NavigationMenuLink href="#">{n("about", locale)}</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }
};

export const MobileOpen: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <div className="p-4">
        <NavigationMenu defaultValue="listings">
          <NavigationMenuList>
            <NavigationMenuItem value="listings">
              <NavigationMenuTrigger>{n("listings", locale)}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#">{n("home", locale)}</NavigationMenuLink>
                <NavigationMenuLink href="#">{n("favorites", locale)}</NavigationMenuLink>
                <NavigationMenuLink href="#">{n("about", locale)}</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    );
  },

  parameters: {
    docs: { description: { story: "@320: submenu pre-opened via defaultValue — popup renders as a full-width bottom sheet, drag handle, edge-to-edge. Use locale toolbar." } }
  },

  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
};
