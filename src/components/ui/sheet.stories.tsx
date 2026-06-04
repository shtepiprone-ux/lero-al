import type { Meta, StoryObj } from "@storybook/react";
import { Filter, Menu } from "lucide-react";
import { Button } from "./button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

const meta: Meta = {
  title: "Primitives/Sheet",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Canonical drawer/panel. ALWAYS use Sheet instead of custom div.fixed.inset-0 mobile drawers. See docs/ui-rules.md §12." } } },
};
export default meta;
type Story = StoryObj;

const SHT: Record<string, Record<string, string>> = {
  filters:    { en: "Filters",            sq: "Filtra",                   uk: "Фільтри",                 it: "Filtri" },
  narrow_q:   { en: "Narrow your search results.", sq: "Ngushtoni rezultatet e kërkimit.", uk: "Звузьте результати пошуку.", it: "Limita i risultati della ricerca." },
  filter_here:{ en: "Filter controls here…",  sq: "Kontrollet e filtrit këtu…", uk: "Елементи фільтрів тут…",  it: "Controlli filtro qui…" },
  open_fil:   { en: "Open filters",       sq: "Hap filtrat",              uk: "Відкрити фільтри",        it: "Apri filtri" },
  menu:       { en: "Menu",               sq: "Menuja",                   uk: "Меню",                    it: "Menu" },
  open_nav:   { en: "Open navigation",    sq: "Hap navigimin",            uk: "Відкрити навігацію",      it: "Apri navigazione" },
  home:       { en: "Home",               sq: "Kreu",                     uk: "Головна",                 it: "Home" },
  listings:   { en: "Listings",           sq: "Njoftimet",                uk: "Оголошення",              it: "Annunci" },
  favorites:  { en: "Favorites",          sq: "Të preferuara",            uk: "Вибране",                 it: "Preferiti" },
  about:      { en: "About",              sq: "Rreth nesh",               uk: "Про нас",                 it: "Chi siamo" },
  search_fil: { en: "Search filters",     sq: "Filtra kërkimi",           uk: "Фільтри пошуку",          it: "Filtri di ricerca" },
  refine:     { en: "Refine your property search parameters.", sq: "Precizoni parametrat e kërkimit të pronës.", uk: "Уточніть параметри пошуку нерухомості.", it: "Perfeziona i parametri di ricerca proprietà." },
  params_here:{ en: "Filter parameters…", sq: "Parametrat e filtrit…",   uk: "Параметри фільтрів…",     it: "Parametri filtro…" },
  open_sheet: { en: "Open filters",       sq: "Hap filtrat",              uk: "Відкрити фільтри",        it: "Apri filtri" },
}
const s = (key: string, locale = "en") => SHT[key]?.[locale] ?? SHT[key]?.en ?? key;

export const FilterSheetRight: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Sheet>
        <SheetTrigger render={<Button size="icon-xl" variant="outline" aria-label={s("open_fil", locale)}><Filter /></Button>} />
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
  parameters: { viewport: { defaultViewport: "mobile375" }, docs: { description: { story: "Filter panel sheet — canonical pattern for mobile filter overlay." } } },
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
  parameters: { viewport: { defaultViewport: "mobile375" }, docs: { description: { story: "Navigation drawer — canonical left-side panel for mobile navigation." } } },
};

export const LocaleSheetContent: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Sheet>
        <SheetTrigger render={<Button size="xl">{s("open_sheet", locale)}</Button>} />
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{s("search_fil", locale)}</SheetTitle>
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
