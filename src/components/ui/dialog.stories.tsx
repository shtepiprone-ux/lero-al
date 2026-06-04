import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";

const meta: Meta = {
  title: "Primitives/Dialog",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Canonical modal. ALWAYS use Dialog instead of custom div.fixed.inset-0 overlays. See docs/ui-rules.md §12." } } },
};
export default meta;
type Story = StoryObj;

const DLG: Record<string, Record<string, string>> = {
  open:        { en: "Open dialog",         sq: "Hap dialogun",           uk: "Відкрити діалог",        it: "Apri dialog" },
  confirm:     { en: "Confirm action",       sq: "Konfirmo veprimin",      uk: "Підтвердити дію",        it: "Conferma azione" },
  archive_q:   { en: "Are you sure you want to archive this listing? This action can be undone later.",
                 sq: "A jeni i sigurt? Ky veprim mund të zhbëhet.",
                 uk: "Ви впевнені? Цю дію можна скасувати пізніше.",
                 it: "Sei sicuro? Questa azione può essere annullata." },
  cancel:      { en: "Cancel",              sq: "Anulo",                  uk: "Скасувати",              it: "Annulla" },
  archive:     { en: "Archive",             sq: "Arkivo",                 uk: "Архівувати",             it: "Archivia" },
  terms_btn:   { en: "Terms of service",    sq: "Kushtet e shërbimit",    uk: "Умови використання",     it: "Termini di servizio" },
  terms_title: { en: "Terms of Service",    sq: "Kushtet e Shërbimit",    uk: "Умови використання",     it: "Termini di Servizio" },
  terms_sub:   { en: "Please read before continuing.", sq: "Lexoni para se të vazhdoni.", uk: "Прочитайте перед продовженням.", it: "Leggere prima di continuare." },
  accept:      { en: "Accept and continue", sq: "Pranoni dhe vazhdoni",   uk: "Прийняти та продовжити", it: "Accetta e continua" },
  delete_btn:  { en: "Delete listing",      sq: "Fshi njoftimin",         uk: "Видалити оголошення",    it: "Elimina annuncio" },
  delete_q:    { en: "This listing will be removed permanently.", sq: "Ky njoftim do të hiqet përgjithmonë.", uk: "Це оголошення буде видалено назавжди.", it: "Questo annuncio verrà rimosso definitivamente." },
  delete_act:  { en: "Delete",              sq: "Fshi",                   uk: "Видалити",               it: "Elimina" },
  confirm_act: { en: "Confirm action",      sq: "Konfirmo veprimin",      uk: "Підтвердити дію",        it: "Conferma azione" },
  irrev_q:     { en: "Are you sure you want to delete this listing? This action cannot be undone.", sq: "A jeni i sigurt? Ky veprim nuk mund të zhbëhet.", uk: "Ви впевнені? Цю дію неможливо скасувати.", it: "Sei sicuro? Questa azione non può essere annullata." },
}
const d = (key: string, locale = "en") => DLG[key]?.[locale] ?? DLG[key]?.en ?? key;
const LOREM = Array.from({ length: 8 });

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Dialog>
        <DialogTrigger render={<Button>{d("open", locale)}</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d("confirm", locale)}</DialogTitle>
            <DialogDescription>{d("archive_q", locale)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">{d("cancel", locale)}</Button>
            <Button variant="destructive">{d("archive", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const LongContent: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Dialog>
        <DialogTrigger render={<Button>{d("terms_btn", locale)}</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d("terms_title", locale)}</DialogTitle>
            <DialogDescription>{d("terms_sub", locale)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {LOREM.map((_, i) => (<p key={i} className="text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>))}
          </div>
          <DialogFooter>
            <Button size="xl">{d("accept", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  parameters: { docs: { description: { story: "Long content: only body region scrolls. Close X fixed above scroll." } } },
};

export const MobileDialog: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Dialog>
        <DialogTrigger render={<Button size="xl">{d("delete_btn", locale)}</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d("delete_btn", locale)}</DialogTitle>
            <DialogDescription>{d("delete_q", locale)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="xl" variant="outline">{d("cancel", locale)}</Button>
            <Button size="xl" variant="destructive">{d("delete_act", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  parameters: { viewport: { defaultViewport: "mobile375" }, docs: { description: { story: "Mobile 375px: trigger full-width, dialog is a full-width bottom sheet. Use locale toolbar." } } },
};

export const MobileFullWidth: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d("confirm_act", locale)}</DialogTitle>
            <DialogDescription>{d("irrev_q", locale)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="xl" variant="outline">{d("cancel", locale)}</Button>
            <Button size="xl" variant="destructive">{d("delete_act", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  parameters: { viewport: { defaultViewport: "mobile320" }, docs: { description: { story: "@320: dialog pre-opened — full-width bottom sheet. Use locale toolbar." } } },
};

export const LocaleVariant: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? "en";
    return (
      <Dialog>
        <DialogTrigger render={<Button size="xl">{d("open", locale)}</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d("confirm_act", locale)}</DialogTitle>
            <DialogDescription>{d("irrev_q", locale)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">{d("cancel", locale)}</Button>
            <Button variant="destructive">{d("delete_act", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  parameters: { docs: { description: { story: "Locale variant — use locale toolbar for sq/en/uk/it. All labels update live." } } },
};
