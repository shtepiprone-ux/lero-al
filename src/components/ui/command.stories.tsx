import type { Meta, StoryObj } from "@storybook/react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Button } from "./button";
import { useState } from "react";
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: "Primitives/Command",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "cmdk Command palette. CommandDialog wraps DialogContent which at <640px renders as a full-width bottom sheet." } } },
};
export default meta;
type Story = StoryObj;

const c = (k: string, l = "en") => storyT(l, `storybook.command.${k}`);

export const Inline: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Command className="rounded-xl border shadow-md w-full max-w-xs">
        <CommandInput placeholder={c("search", locale)} />
        <CommandList>
          <CommandEmpty>{c("no_results", locale)}</CommandEmpty>
          <CommandGroup heading={c("cities", locale)}>
            <CommandItem>Tirana</CommandItem>
            <CommandItem>Durrës</CommandItem>
            <CommandItem>Vlorë</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
};

function DialogStory({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{c("open_palette", locale)}</Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={c("search_short", locale)} description={c("find", locale)}>
        <Command>
          <CommandInput placeholder={c("search", locale)} />
          <CommandList>
            <CommandEmpty>{c("no_found", locale)}</CommandEmpty>
            <CommandGroup heading={c("listings", locale)}>
              <CommandItem>{c("apt_1", locale)}</CommandItem>
              <CommandItem>{c("apt_2", locale)}</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export const WithDialog: Story = {
  parameters: {},
  render: (_, context) => <DialogStory locale={(context?.globals?.locale as string) ?? "en"} />,
};

function MobileStory({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>{c("search_short", locale)}</Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={c("search_short", locale)} description={c("find", locale)}>
        <Command>
          <CommandInput placeholder={c("search", locale)} />
          <CommandList>
            <CommandEmpty>{c("no_found", locale)}</CommandEmpty>
            <CommandGroup heading={c("listings", locale)}>
              <CommandItem>{c("apt_1", locale)}</CommandItem>
              <CommandItem>{c("apt_2", locale)}</CommandItem>
              <CommandItem>{c("apt_3", locale)}</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}

export const MobileBottomSheet: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" }, docs: { description: { story: "@320: CommandDialog opens as a full-width bottom sheet. Use locale toolbar for sq/en/uk/it." } } },
  render: (_, context) => <MobileStory locale={(context?.globals?.locale as string) ?? "en"} />,
};
