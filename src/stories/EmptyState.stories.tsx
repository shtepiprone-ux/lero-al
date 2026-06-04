import type { Meta, StoryObj } from '@storybook/react';
import { Home, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const meta: Meta = {
  title: 'System/EmptyState',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: 'Canonical empty state pattern. See docs/tailwind-canonical-fragments.md §10.' } } },
};
export default meta;
type Story = StoryObj;

const ES: Record<string, Record<string, string>> = {
  no_lst_t:   { en: 'No listings found',            sq: 'Nuk u gjet asnjë njoftim',                         uk: 'Оголошень не знайдено',                     it: 'Nessun annuncio trovato' },
  no_lst_d:   { en: 'Try adjusting your search filters to find more properties.',
                sq: 'Provoni të ndryshoni filtrat e kërkimit për të gjetur më shumë prona.',
                uk: 'Спробуйте змінити параметри пошуку, щоб знайти більше нерухомості.',
                it: 'Prova a modificare i filtri di ricerca per trovare più proprietà.' },
  clear_fil:  { en: 'Clear filters',                sq: 'Pastro filtrat',                                   uk: 'Очистити фільтри',                          it: 'Cancella filtri' },
  no_fav_t:   { en: 'No saved listings',             sq: 'Nuk ka njoftimet e ruajtura',                      uk: 'Немає збережених оголошень',                it: 'Nessun annuncio salvato' },
  no_fav_d:   { en: 'Save listings you like to see them here.',
                sq: "Ruani njoftimet që ju pëlqejnë për t'i parë këtu.",
                uk: 'Збережіть оголошення, які вам подобаються, щоб бачити їх тут.',
                it: 'Salva gli annunci che ti piacciono per vederli qui.' },
  browse:     { en: 'Browse listings',               sq: 'Shfleto njoftimet',                                uk: 'Переглянути оголошення',                    it: 'Sfoglia annunci' },
  no_res_t:   { en: 'No results',                    sq: 'Nuk ka rezultate',                                 uk: 'Немає результатів',                         it: 'Nessun risultato' },
  no_res_d:   { en: "We couldn't find any properties matching your search.",
                sq: 'Nuk gjetëm asnjë pronë që përputhet me kërkimin tuaj.',
                uk: 'Ми не знайшли жодної нерухомості, що відповідає вашому пошуку.',
                it: 'Non abbiamo trovato proprietà corrispondenti alla tua ricerca.' },
  mod_search: { en: 'Modify search',                 sq: 'Ndrysho kërkimin',                                 uk: 'Змінити пошук',                             it: 'Modifica ricerca' },
}
const e = (k: string, l = 'en') => ES[k]?.[l] ?? ES[k]?.en ?? k

function EmptyStateBlock({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export const NoListings: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Home} title={e('no_lst_t',l)} description={e('no_lst_d',l)} action={<Button size="xl" variant="outline">{e('clear_fil',l)}</Button>} />
  },
};

export const NoFavorites: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Heart} title={e('no_fav_t',l)} description={e('no_fav_d',l)} action={<Button size="xl">{e('browse',l)}</Button>} />
  },
};

export const NoSearchResults: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Search} title={e('no_res_t',l)} description={e('no_res_d',l)} action={<Button size="xl" variant="outline">{e('mod_search',l)}</Button>} />
  },
};

export const LocaleStress: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Home} title={e('no_lst_t',l)} description={e('no_lst_d',l)} action={<Button size="xl" variant="outline">{e('clear_fil',l)}</Button>} />
  },
  parameters: { docs: { description: { story: 'Locale stress — longer text must fit within max-w-sm. Use locale toolbar for sq/en/uk/it.' } } },
};

export const MobileEmptyState: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return <EmptyStateBlock icon={Home} title={e('no_lst_t',l)} description={e('no_lst_d',l)} action={<Button size="xl" className="w-full">{e('clear_fil',l)}</Button>} />
  },
  parameters: { viewport: { defaultViewport: 'mobile375' } },
};
