import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

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

const TB: Record<string, Record<string, string>> = {
  my_lst:   { en: 'My listings',    sq: 'Njoftimet e mia',    uk: 'Moi oholoshennia',      it: 'I miei annunci' },
  saved:    { en: 'Saved',          sq: 'Te ruajtura',        uk: 'Zberezhenni',            it: 'Salvati' },
  profile:  { en: 'Profile',        sq: 'Profili',            uk: 'Profil',                 it: 'Profilo' },
  active:   { en: 'Active',         sq: 'Aktive',             uk: 'Aktyvni',                it: 'Attivi' },
  closed:   { en: 'Closed',         sq: 'Te mbyllura',        uk: 'Zakryti',                it: 'Chiuse' },
  pending:  { en: 'Pending',        sq: 'Ne pritje',          uk: 'Ochikuiut',              it: 'In attesa' },
  drafts:   { en: 'Drafts',         sq: 'Projekte',           uk: 'Chernietky',             it: 'Bozze' },
  archived: { en: 'Archived',       sq: 'Arkivuara',          uk: 'Arkhivovani',            it: 'Archiviate' },
  content:  { en: 'Listings content here.',  sq: 'Permbajtja ketu.',  uk: 'Vmist tut.',  it: 'Contenuto qui.' },
  saved_c:  { en: 'Saved searches here.',    sq: 'Kerkesat ketu.',    uk: 'Poshuky tut.', it: 'Ricerche qui.' },
  prof_c:   { en: 'Profile settings here.',  sq: 'Cilesite ketu.',    uk: 'Nalashtuvannia tut.', it: 'Impostazioni qui.' },
  overflow: { en: 'Many tabs — scrolls when overflow', sq: 'Shume skeda', uk: 'Bahato vkladok', it: 'Molte schede' },
  long_lbl: { en: 'Long labels — scrolls horizontally', sq: 'Etiketa te gjata', uk: 'Dovhi etykety', it: 'Etichette lunghe' },
  saved_l:  { en: 'Saved searches',   sq: 'Kerkesat e ruajtura', uk: 'Zberezheni poshuky',      it: 'Ricerche salvate' },
  prof_l:   { en: 'Profile settings', sq: 'Cilesite e profilit', uk: 'Nalashtuvannia profiliu', it: 'Impostazioni profilo' },
}
const tb = (k: string, l = 'en') => TB[k]?.[l] ?? TB[k]?.en ?? k

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Default tabs — canonical underline style. Use locale toolbar for sq/en/uk/it.' } },
  },
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <Tabs defaultValue="listings" className="w-full max-w-lg">
        <TabsList>
          <TabsTrigger value="listings">{tb('my_lst', l)}</TabsTrigger>
          <TabsTrigger value="saved">{tb('saved', l)}</TabsTrigger>
          <TabsTrigger value="profile">{tb('profile', l)}</TabsTrigger>
        </TabsList>
        <TabsContent value="listings"><p className="text-sm text-muted-foreground p-4">{tb('content', l)}</p></TabsContent>
        <TabsContent value="saved"><p className="text-sm text-muted-foreground p-4">{tb('saved_c', l)}</p></TabsContent>
        <TabsContent value="profile"><p className="text-sm text-muted-foreground p-4">{tb('prof_c', l)}</p></TabsContent>
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
            <TabsTrigger value="a">{tb('my_lst', l)}</TabsTrigger>
            <TabsTrigger value="b">{tb('saved_l', l)}</TabsTrigger>
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
          <p className="text-xs text-muted-foreground mb-3">{tb('overflow', l)}</p>
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
          <p className="text-xs text-muted-foreground mb-3">{tb('long_lbl', l)}</p>
          <Tabs defaultValue="a" className="w-full">
            <TabsList>
              <TabsTrigger value="a">{tb('my_lst', l)}</TabsTrigger>
              <TabsTrigger value="b">{tb('saved_l', l)}</TabsTrigger>
              <TabsTrigger value="c">{tb('prof_l', l)}</TabsTrigger>
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
