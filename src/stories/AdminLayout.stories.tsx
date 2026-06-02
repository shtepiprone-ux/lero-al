'use client'

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const meta: Meta = {
  title: 'System/AdminLayout',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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
type Story = StoryObj;

function AdminToolbarRender() {
  const [lastAction, setLastAction] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-4 md:p-6 border-b bg-card rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Listings</h2>
          <Badge variant="secondary">1,248</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="search"
              placeholder="Search listings…"
              className="pl-9 h-9 w-48"
            />
          </div>
          <Button variant="outline" size="default" onClick={() => setLastAction('Filter clicked')}>
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button size="default" onClick={() => setLastAction('Add listing clicked')}>
            <Plus />
            Add listing
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
  render: () => <AdminToolbarRender />,
  parameters: {
    docs: {
      description: {
        story: 'Admin toolbar: canonical Input (not raw input), canonical Button. Clicking Filter/Add logs an in-canvas action.',
      },
    },
  },
};

function AdminTableWrapperRender() {
  const [lastAction, setLastAction] = useState<string | null>(null)
  return (
    <div className="space-y-2">
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden max-w-6xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-lg font-semibold">Users</h2>
          <Button size="default" onClick={() => setLastAction('Add user clicked')}><Plus /> Add user</Button>
        </div>
      {/* Table (scroll wrapper for mobile) */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              { name: 'Ana Koci', role: 'Agent', status: 'Active' },
              { name: 'Blerim Hoxha', role: 'User', status: 'Active' },
              { name: 'Flutura Lleshi', role: 'Admin', status: 'Active' },
            ].map(row => (
              <tr key={row.name} className="hover:bg-muted/30">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.role}</td>
                <td className="px-4 py-3">
                  <Badge variant="success">{row.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="xs" variant="ghost">Edit</Button>
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
  render: () => <AdminTableWrapperRender />,
  parameters: {
    docs: {
      description: {
        story: 'Admin table wrapper: `bg-card rounded-2xl border shadow-sm overflow-hidden` + `overflow-x-auto` for mobile scroll. "Add user" button logs action in canvas.',
      },
    },
  },
};

export const AdminCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-6xl mx-auto">
      {[
        { label: 'Total listings', value: '1,248', badge: 'success', badgeText: '+12%' },
        { label: 'Active', value: '934', badge: 'success', badgeText: 'Live' },
        { label: 'Pending', value: '87', badge: 'warning', badgeText: 'Review' },
        { label: 'Users', value: '3,421', badge: 'info', badgeText: '+8%' },
        { label: 'Agents', value: '156', badge: 'info', badgeText: 'Verified' },
        { label: 'Revenue', value: '€42k', badge: 'success', badgeText: '+23%' },
      ].map(card => (
        <div key={card.label} className="bg-card rounded-2xl border shadow-sm p-5">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-bold mt-1">{card.value}</p>
          <Badge variant={card.badge as 'success' | 'warning' | 'info'} className="mt-2">
            {card.badgeText}
          </Badge>
        </div>
      ))}
    </div>
  ),
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
