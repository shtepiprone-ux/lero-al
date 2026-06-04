import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverTrigger } from "./popover";

const meta: Meta = {
  title: "Primitives/Popover",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Base-UI Popover primitive. At <640px renders as a full-width bottom sheet." } } },
};
export default meta;
type Story = StoryObj;

const POP: Record<string, Record<string, string>> = {
  open:    { en: "Open popover",                                 sq: "Hap popoverin",                                    uk: "Відкрити підказку",                                it: "Apri popover" },
  title:   { en: "Listing details",                              sq: "Detajet e njoftimit",                               uk: "Деталі оголошення",                                it: "Dettagli annuncio" },
  desc:    { en: "Additional information about this listing.",   sq: "Informacione shtesë rreth këtij njoftimi.",         uk: "Додаткова інформація про це оголошення.",          it: "Informazioni aggiuntive su questo annuncio." },
  body:    { en: "Content goes here.",                           sq: "Përmbajtja shkon këtu.",                            uk: "Вміст тут.",                                       it: "Il contenuto va qui." },
  // mobile stress
  open_lg: { en: "Detailed information",                         sq: "Informacion i detajuar",                            uk: "Детальна інформація",                              it: "Informazioni dettagliate" },
  title_lg:{ en: "Listing information",                          sq: "Informacion i njoftimit",                           uk: "Інформація про оголошення",                        it: "Informazioni sull annuncio" },
  desc_lg: { en: "Additional details about this property in Tirana.", sq: "Detaje shtesë rreth kësaj prone në Tiranë.", uk: "Додаткові відомості про цю нерухомість у Тирані.", it: "Dettagli aggiuntivi su questa proprietà a Tirana." },
  body_lg: { en: "The apartment is located in the central district with well-developed infrastructure.", sq: "Apartamenti ndodhet në rrethin qendror me infrastrukturë të zhvilluar.", uk: "Квартира розташована в центральному районі міста з розвинутою інфраструктурою.", it: "L appartamento si trova nel quartiere centrale con infrastrutture ben sviluppate." },
}
const p = (k: string, l = "en") => POP[k]?.[l] ?? POP[k]?.en ?? k;

export const Default: Story = {
  parameters: {},
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
  },
};

export const MobileBottomSheet: Story = {
  parameters: { viewport: { defaultViewport: "mobile320" }, docs: { description: { story: "@320: popover opens as a full-width bottom sheet — edge-to-edge, drag handle. Use locale toolbar." } } },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <div className="p-4">
        <Popover>
          <PopoverTrigger render={<Button>{p("open_lg", locale)}</Button>} />
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>{p("title_lg", locale)}</PopoverTitle>
              <PopoverDescription>{p("desc_lg", locale)}</PopoverDescription>
            </PopoverHeader>
            <p className="text-sm text-muted-foreground">{p("body_lg", locale)}</p>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};
