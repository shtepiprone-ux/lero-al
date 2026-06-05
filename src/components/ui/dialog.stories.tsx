import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: "Primitives/Dialog",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "Canonical modal. ALWAYS use Dialog instead of custom div.fixed.inset-0 overlays. See docs/ui-rules.md §12." } } },
};
export default meta;
type Story = StoryObj;

const d = (key: string, locale = "en") => storyT(locale, `storybook.dialog.${key}`);
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
            {LOREM.map((_, i) => (<p key={i} className="text-muted-foreground">{'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}</p>))}
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
            <Button size="xl" variant="destructive">{d("delete", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },

  parameters: {
    docs: { description: { story: "Mobile 375px: trigger full-width, dialog is a full-width bottom sheet. Use locale toolbar." } }
  },

  globals: {
    viewport: {
      value: "mobile375",
      isRotated: false
    }
  }
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
            <Button size="xl" variant="destructive">{d("delete", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },

  parameters: {
    docs: { description: { story: "@320: dialog pre-opened — full-width bottom sheet. Use locale toolbar." } }
  },

  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
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
            <Button variant="destructive">{d("delete", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  parameters: { docs: { description: { story: "Locale variant — use locale toolbar for sq/en/uk/it. All labels update live." } } },
};
