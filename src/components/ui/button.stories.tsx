import type { Meta, StoryObj } from '@storybook/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Canonical button. Always use this instead of raw `<button>`. ' +
          'See docs/ui-rules.md §3 for size/variant governance.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', 'icon', 'icon-xl', 'icon-sm', 'icon-xs'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ── Default ──────────────────────────────────────────────────────────────────
export const Default: Story = {
  args: { children: 'Save listing' },
};

// ── Variants ─────────────────────────────────────────────────────────────────
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// ── Sizes ─────────────────────────────────────────────────────────────────────
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="xs">XS (24px)</Button>
      <Button size="sm">SM (28px)</Button>
      <Button size="default">Default (32px)</Button>
      <Button size="lg">LG (36px)</Button>
      <Button size="xl">XL (44px) — Mobile safe ✅</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use `size="xl"` (44px) for all mobile-reachable buttons. ' +
          'Sizes below xl are for desktop-only contexts.',
      },
    },
  },
};

// ── Mobile safe ───────────────────────────────────────────────────────────────
export const MobileSafe: Story = {
  args: { size: 'xl', children: 'Contact agent' },
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: '`size="xl"` is 44px — the minimum touch target for mobile. ' +
               'ALWAYS use for mobile-reachable primary actions.',
      },
    },
  },
};

// ── With icons ────────────────────────────────────────────────────────────────
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button><Plus /> Add listing</Button>
      <Button variant="outline"><Plus /> Add listing</Button>
      <Button variant="destructive"><Trash2 /> Delete</Button>
      <Button disabled><Loader2 className="animate-spin" /> Saving…</Button>
    </div>
  ),
};

// ── Icon-only buttons ─────────────────────────────────────────────────────────
export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="icon" variant="outline" aria-label="Add"><Plus /></Button>
      <Button size="icon-xl" variant="outline" aria-label="Add (mobile safe)"><Plus /></Button>
      <Button size="icon-sm" variant="ghost" aria-label="Delete"><Trash2 /></Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons MUST have `aria-label`. Use `size="icon-xl"` (44px) for mobile.',
      },
    },
  },
};

// ── Disabled ──────────────────────────────────────────────────────────────────
export const Disabled: Story = {
  args: { disabled: true, children: 'Submit' },
};

// ── Long locale label (Ukrainian stress test) ─────────────────────────────────
export const LongLocaleLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-3 max-w-xs">
      <Button size="xl">Contact agent</Button>
      <Button size="xl">Зв&apos;яжіться з агентом нерухомості</Button>
      <Button size="xl" variant="outline">Переглянути всі оголошення про оренду нерухомості</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ukrainian labels can be significantly longer. Buttons must wrap or truncate gracefully.',
      },
    },
  },
};
