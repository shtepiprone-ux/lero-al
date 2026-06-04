import type { Meta, StoryObj } from "@storybook/react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Button } from "./button";
import { useState } from "react";

const meta: Meta = {
  title: "Primitives/Command",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "cmdk Command palette. CommandDialog wraps DialogContent which at <640px renders as a full-width bottom sheet." } } },
};
export default meta;
type Story = StoryObj;

const CMD: Record<string, Record<string, string>> = {
  search:   { en: "Search listings…",           sq: "Kërko njoftimet…",               uk: "Пошук оголошень…",             it: "Cerca annunci…" },
  no_res:   { en: "No results.",                sq: "Nuk ka rezultate.",               uk: "Немає результатів.",            it: "Nessun risultato." },
  cities:   { en: "Cities",                     sq: "Qytetet",                         uk: "Міста",                        it: "Città" },
  open_cmd: { en: "Open command palette",       sq: "Hap paletën e komandave",         uk: "Відкрити палітру команд",      it: "Apri tavolozza comandi" },
  search_s: { en: "Search",                     sq: "Kërko",                           uk: "Пошук",                        it: "Cerca" },
  find:     { en: "Find listings or locations", sq: "Gjeni njoftimet ose vendndodhjet",uk: "Знайдіть оголошення або локації",it: "Trova annunci o luoghi" },
  no_found: { en: "No results found.",          sq: "Nuk u gjet asnjë rezultat.",      uk: "Результатів не знайдено.",      it: "Nessun risultato trovato." },
  listings: { en: "Listings",                   sq: "Njoftimet",                       uk: "Оголошення",                   it: "Annunci" },
  apt1:     { en: "Apartment in Tirana center, 2 rooms", sq: "Apartament në qendër të Tiranës, 2 dhoma", uk: "Квартира в центрі Тирани, 2 кімнати", it: "Appartamento centro Tirana, 2 locali" },
  apt2:     { en: "Villa in Durrës beachfront, 4 rooms", sq: "Vilë në bregdet të Durrësit, 4 dhoma",     uk: "Вілла на узбережжі Дурреса, 4 спальні", it: "Villa lungomare Durazzo, 4 locali" },
  apt3:     { en: "Office in Tirana business district, 80 m²", sq: "Zyrë në zonën e biznesit, Tiranë, 80 m²", uk: "Офіс у діловому районі Тирани, 80 кв.м.", it: "Ufficio quartiere affari Tirana, 80 m²" },
}
const c = (k: string, l = "en") => CMD[k]?.[l] ?? CMD[k]?.en ?? k;

export const Inline: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Command className="rounded-xl border shadow-md w-full max-w-xs">
        <CommandInput placeholder={c("search", locale)} />
        <CommandList>
          <CommandEmpty>{c("no_res", locale)}</CommandEmpty>
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
      <Button onClick={() => setOpen(true)}>{c("open_cmd", locale)}</Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={c("search_s", locale)} description={c("find", locale)}>
        <Command>
          <CommandInput placeholder={c("search", locale)} />
          <CommandList>
            <CommandEmpty>{c("no_found", locale)}</CommandEmpty>
            <CommandGroup heading={c("listings", locale)}>
              <CommandItem>{c("apt1", locale)}</CommandItem>
              <CommandItem>{c("apt2", locale)}</CommandItem>
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
      <Button onClick={() => setOpen(true)}>{c("search_s", locale)}</Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={c("search_s", locale)} description={c("find", locale)}>
        <Command>
          <CommandInput placeholder={c("search", locale)} />
          <CommandList>
            <CommandEmpty>{c("no_found", locale)}</CommandEmpty>
            <CommandGroup heading={c("listings", locale)}>
              <CommandItem>{c("apt1", locale)}</CommandItem>
              <CommandItem>{c("apt2", locale)}</CommandItem>
              <CommandItem>{c("apt3", locale)}</CommandItem>
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
