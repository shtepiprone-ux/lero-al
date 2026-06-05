import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { storyT } from '@/stories/_storyI18n';

const meta: Meta = {
  title: 'Primitives/Tabs',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical tab component. ALWAYS use shadcn Tabs instead of local tab button clones. ' +
          'Single style: primary-color underline indicator on active tab. ' +
          'Scrolls horizontally when tabs overflow the container. ' +
          'See docs/ui-rules.md §15a.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const tb = (k: string, l = 'en') => storyT(l, `storybook.tabs.${k}`)

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Default tabs — canonical underline style. Use locale toolbar for sq/en/uk/it.' } },
  },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <Tabs defaultValue="listings" className="w-full max-w-lg">
        <TabsList>
          <TabsTrigger value="listings">{tb('my_listings', l)}</TabsTrigger>
          <TabsTrigger value="saved">{tb('saved', l)}</TabsTrigger>
          <TabsTrigger value="profile">{tb('profile', l)}</TabsTrigger>
        </TabsList>
        <TabsContent value="listings"><p className="text-sm text-muted-foreground p-4">{tb('content', l)}</p></TabsContent>
        <TabsContent value="saved"><p className="text-sm text-muted-foreground p-4">{tb('saved_content', l)}</p></TabsContent>
        <TabsContent value="profile"><p className="text-sm text-muted-foreground p-4">{tb('profile_content', l)}</p></TabsContent>
      </Tabs>
    )
  },
};

export const WithLongLocaleLabels: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">{tb('my_listings', l)}</TabsTrigger>
            <TabsTrigger value="b">{tb('saved_long', l)}</TabsTrigger>
            <TabsTrigger value="c">{tb('profile', l)}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    )
  },
  parameters: {
    docs: { description: { story: 'Long locale labels — shadcn Tabs handles wrapping correctly. Use locale toolbar.' } },
  },
};

export const Disabled: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{tb('active', l)}</TabsTrigger>
          <TabsTrigger value="disabled" disabled>{tb('drafts', l)}</TabsTrigger>
          <TabsTrigger value="other">{tb('closed', l)}</TabsTrigger>
        </TabsList>
      </Tabs>
    )
  },
};

export const MobileScroll: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="flex flex-col gap-8 w-full max-w-xs">
        <div>
          <p className="text-xs text-muted-foreground mb-3">{tb('many', l)}</p>
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">{tb('active', l)}</TabsTrigger>
              <TabsTrigger value="closed">{tb('closed', l)}</TabsTrigger>
              <TabsTrigger value="pending">{tb('pending', l)}</TabsTrigger>
              <TabsTrigger value="drafts">{tb('drafts', l)}</TabsTrigger>
              <TabsTrigger value="archived">{tb('archived', l)}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-3">{tb('long_labels', l)}</p>
          <Tabs defaultValue="a" className="w-full">
            <TabsList>
              <TabsTrigger value="a">{tb('my_listings', l)}</TabsTrigger>
              <TabsTrigger value="b">{tb('saved_long', l)}</TabsTrigger>
              <TabsTrigger value="c">{tb('profile_long', l)}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    )
  },
  parameters: {
    docs: { description: { story: 'Tabs scroll horizontally when they overflow. Use locale toolbar for sq/en/uk/it.' } },
  },
};
