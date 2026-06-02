import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta = {
  title: 'Primitives/Tabs',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Canonical tab component. ALWAYS use shadcn Tabs instead of local tab button clones. ' +
          'See docs/component-governance.md §1.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="listings" className="w-full max-w-lg">
      <TabsList>
        <TabsTrigger value="listings">My listings</TabsTrigger>
        <TabsTrigger value="saved">Saved</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="listings">
        <p className="text-sm text-muted-foreground p-4">Listings content here.</p>
      </TabsContent>
      <TabsContent value="saved">
        <p className="text-sm text-muted-foreground p-4">Saved searches here.</p>
      </TabsContent>
      <TabsContent value="profile">
        <p className="text-sm text-muted-foreground p-4">Profile settings here.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithLongLocaleLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-muted-foreground mb-2">English</p>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">My listings</TabsTrigger>
            <TabsTrigger value="b">Saved searches</TabsTrigger>
            <TabsTrigger value="c">Profile</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Ukrainian — longest labels</p>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Мої оголошення</TabsTrigger>
            <TabsTrigger value="b">Збережені пошуки</TabsTrigger>
            <TabsTrigger value="c">Профіль</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ukrainian tab labels are significantly longer. ' +
               'shadcn Tabs handles wrapping correctly — local clones often do not.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-lg">
      <div>
        <p className="text-xs text-muted-foreground mb-3">Underline variant — active tab: primary-color indicator</p>
        <Tabs defaultValue="listings" className="w-full">
          <TabsList variant="underline">
            <TabsTrigger value="listings">My listings</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="listings">
            <p className="text-sm text-muted-foreground p-4">Listings content here.</p>
          </TabsContent>
          <TabsContent value="saved">
            <p className="text-sm text-muted-foreground p-4">Saved searches here.</p>
          </TabsContent>
          <TabsContent value="profile">
            <p className="text-sm text-muted-foreground p-4">Profile settings here.</p>
          </TabsContent>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-3">Ukrainian labels — overflow stress</p>
        <Tabs defaultValue="a" className="w-full">
          <TabsList variant="underline">
            <TabsTrigger value="a">Мої оголошення</TabsTrigger>
            <TabsTrigger value="b">Збережені пошуки</TabsTrigger>
            <TabsTrigger value="c">Профіль</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-3">Disabled trigger — underline variant</p>
        <Tabs defaultValue="active" className="w-full">
          <TabsList variant="underline">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Opt-in underline style via `variant="underline"` on `TabsList`. ' +
          'Active tab shows a primary-color underline indicator; inactive tabs show none. ' +
          'The Task 359 mobile full-width + `mobileScroll` contract applies to this variant. ' +
          'Default (pill background) style is unchanged for all consumers that do not opt in.',
      },
    },
  },
};
