'use client'

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { storyT } from './_storyI18n';

type AdminLayoutArgs = {
  onFilter?: () => void
  onAddListing?: () => void
  onAddUser?: () => void
}


const AL_KEY: Record<string, string> = {
  add_lst: 'add_listing', add_usr: 'add_user',
  col_name: 'col_name', col_role: 'col_role', col_status: 'col_status', col_actions: 'col_actions',
  role_agent: 'role_agent', role_user: 'role_user', role_admin: 'role_admin',
  total_lst: 'total_listings', search_ph: 'search_ph',
}
const al = (k: string, l = 'en') => storyT(l, `storybook.adminlayout.${AL_KEY[k] ?? k}`)

const meta: Meta<AdminLayoutArgs> = {
  title: 'System/AdminLayout',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Admin layout patterns — toolbar, table wrapper, card. ' +
          'See docs/tailwind-canonical-fragments.md §5 for admin table wrapper.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<AdminLayoutArgs>;

function AdminToolbarRender({ onFilter, onAddListing, locale = 'en' }: { onFilter?: () => void; onAddListing?: () => void; locale?: string }) {
  const [lastAction, setLastAction] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      {/* <640: flex-col — title row on top, control row below, no horizontal overflow.
          ≥640 (sm:): flex-row — canonical desktop horizontal layout. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 md:p-6 border-b bg-card rounded-t-2xl gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{al('listings', locale)}</h2>
          <Badge variant="secondary">1,248</Badge>
        </div>
        {/* Control row: flex-col on mobile (each control stacks full-width, no overflow).
            sm: flex-row — canonical horizontal desktop layout. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 max-sm:w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="search"
              placeholder={al('search_ph', locale)}
              className="pl-9 h-9 w-full sm:w-48"
            />
          </div>
          <Button variant="outline" size="default" onClick={() => { onFilter?.(); setLastAction(al('filter', locale)) }}>
            <Filter className="h-4 w-4 shrink-0" />
            {al('filter', locale)}
          </Button>
          <Button size="default" onClick={() => { onAddListing?.(); setLastAction(al('add_lst', locale)) }}>
            <Plus className="shrink-0" />
            {al('add_lst', locale)}
          </Button>
        </div>
      </div>
      {lastAction && (
        <p className="text-xs text-muted-foreground px-1">{lastAction}</p>
      )}
    </div>
  )
}

export const AdminToolbar: Story = {
  args: { onFilter: fn(), onAddListing: fn() },
  render: (args, context) => <AdminToolbarRender onFilter={args.onFilter} onAddListing={args.onAddListing} locale={(context?.globals?.locale as string) ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Admin toolbar: canonical Input (not raw input), canonical Button. Clicking Filter/Add logs to Actions panel via fn() AND shows in-canvas label.',
      },
    },
  },
};

function AdminTableWrapperRender({ onAddUser, locale = 'en' }: { onAddUser?: () => void; locale?: string }) {
  const [lastAction, setLastAction] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden max-w-6xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-lg font-semibold">{al('users', locale)}</h2>
          <Button size="default" onClick={() => { onAddUser?.(); setLastAction(al('add_usr', locale)) }}><Plus /> {al('add_usr', locale)}</Button>
        </div>
      {/* Table (scroll wrapper for mobile) */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{al('col_name', locale)}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{al('col_role', locale)}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{al('col_status', locale)}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{al('col_actions', locale)}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              { name: 'Ana Koci',     role: al('role_agent', locale) },
              { name: 'Blerim Hoxha', role: al('role_user', locale) },
              { name: 'Flutura Lleshi', role: al('role_admin', locale) },
            ].map(row => (
              <tr key={row.name} className="hover:bg-muted/30">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.role}</td>
                <td className="px-4 py-3">
                  <Badge variant="success">{al('active', locale)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="xs" variant="ghost">{al('edit', locale)}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
      {lastAction && (
        <p className="text-xs text-muted-foreground px-1">{lastAction}</p>
      )}
    </div>
  )
}

export const AdminTableWrapper: Story = {
  args: { onAddUser: fn() },
  render: (args, context) => <AdminTableWrapperRender onAddUser={args.onAddUser} locale={(context?.globals?.locale as string) ?? 'en'} />,
  parameters: {
    docs: {
      description: {
        story: 'Admin table wrapper: `bg-card rounded-2xl border shadow-sm overflow-hidden` + `overflow-x-auto` for mobile scroll. "Add user" button logs to Actions panel via fn() AND shows in-canvas label.',
      },
    },
  },
};

export const AdminCards: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const cards = [
      { labelKey: 'total_lst', value: '1,248', badge: 'success' as const, badgeText: '+12%' },
      { labelKey: 'active',    value: '934',   badge: 'success' as const, badgeText: al('live', l) },
      { labelKey: 'pending',   value: '87',    badge: 'warning' as const, badgeText: al('review', l) },
      { labelKey: 'users',     value: '3,421', badge: 'info' as const,    badgeText: '+8%' },
      { labelKey: 'agents',    value: '156',   badge: 'info' as const,    badgeText: al('verified', l) },
      { labelKey: 'revenue',   value: '\u20ac42k', badge: 'success' as const, badgeText: '+23%' },
    ]
    return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-6xl mx-auto">
      {cards.map(card => (
        <div key={card.labelKey} className="bg-card rounded-2xl border shadow-sm p-5">
          <p className="text-xs text-muted-foreground">{al(card.labelKey, l)}</p>
          <p className="text-2xl font-bold mt-1">{card.value}</p>
          <Badge variant={card.badge} className="mt-2">{card.badgeText}</Badge>
        </div>
      ))}
    </div>
    )
  },
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story: 'Admin stat cards: `bg-card rounded-2xl border shadow-sm p-5` — canonical admin card pattern (26+ occurrences).',
      },
    },
  },
};

export const AdminLoadingState: Story = {
  render: () => (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border shadow-sm p-5 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  ),
};
