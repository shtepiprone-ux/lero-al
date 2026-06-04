import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";

const meta: Meta = {
  title: "Primitives/DropdownMenu",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Base-UI Menu primitive. At <640px renders as a full-width bottom sheet. Items are >=44px at mobile." } } },
};
export default meta;
type Story = StoryObj;

const DD: Record<string, Record<string, string>> = {
  open:   { en: "Open menu",                          sq: "Hap menunë",                         uk: "Відкрити меню",                          it: "Apri menu" },
  edit:   { en: "Edit listing",                       sq: "Ndrysho njoftimin",                  uk: "Редагувати оголошення",                  it: "Modifica annuncio" },
  dup:    { en: "Duplicate",                          sq: "Dupliko",                            uk: "Дублювати",                              it: "Duplica" },
  del:    { en: "Delete",                             sq: "Fshi",                               uk: "Видалити",                               it: "Elimina" },
  // long labels for mobile stress
  actions:{ en: "Listing actions",                   sq: "Veprimet e njoftimit",               uk: "Дії з оголошенням",                      it: "Azioni annuncio" },
  edit_lg:{ en: "Edit real estate listing details",  sq: "Ndrysho detajet e njoftimit të pronës", uk: "Редагувати оголошення про продаж нерухомості", it: "Modifica i dettagli dell annuncio immobiliare" },
  dup_lg: { en: "Duplicate listing",                 sq: "Dupliko njoftimin",                  uk: "Дублювати оголошення",                   it: "Duplica annuncio" },
  del_lg: { en: "Delete listing permanently",        sq: "Fshi njoftimin përgjithmonë",         uk: "Видалити оголошення назавжди",            it: "Elimina annuncio definitivamente" },
}
const d = (k: string, l = "en") => DD[k]?.[l] ?? DD[k]?.en ?? k;

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
            <DropdownMenuItem>{d("edit_lg", locale)}</DropdownMenuItem>
            <DropdownMenuItem>{d("dup_lg", locale)}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">{d("del_lg", locale)}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
};
