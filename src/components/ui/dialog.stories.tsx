import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta: Meta = {
  title: 'Primitives/Dialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Canonical modal. ALWAYS use Dialog instead of custom `div.fixed.inset-0` overlays. ' +
          'Provides built-in focus trap and scroll lock. See docs/ui-rules.md §12.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive this listing? This action can be undone later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Terms of service</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Please read before continuing.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {Array.from({ length: 8 }).map((_, i) => (
            <p key={i} className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
            </p>
          ))}
        </div>
        <DialogFooter>
          <Button size="xl">Accept and continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Long content: dialog scrolls internally — `overflow-y-auto` is on the inner scroll container, ' +
          '`overflow-hidden` on the outer clips the scrollbar to the `rounded-2xl` boundary. ' +
          'Click the trigger to open; one dialog at a time.',
      },
    },
  },
};

export const MobileDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button size="xl">Delete listing</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete listing</DialogTitle>
          <DialogDescription>
            This listing will be removed permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button size="xl" variant="outline" className="w-full sm:w-auto">Cancel</Button>
          <Button size="xl" variant="destructive" className="w-full sm:w-auto">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story:
          'Mobile dialog: footer buttons stack vertically, `size="xl"` for 44px touch targets. ' +
          'Click trigger to open — one dialog at a time (no `defaultOpen` stacking).',
      },
    },
  },
};

export const LocaleVariant: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button size="xl">Відкрити діалог</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Підтвердіть дію</DialogTitle>
          <DialogDescription>
            Ви впевнені, що хочете видалити це оголошення про нерухомість? Цю дію неможливо скасувати.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Скасувати</Button>
          <Button variant="destructive">Видалити</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    globals: { locale: 'uk' },
    docs: {
      description: {
        story:
          'Ukrainian locale — longer title/description strings. ' +
          'Click trigger to open one dialog at a time.',
      },
    },
  },
};
