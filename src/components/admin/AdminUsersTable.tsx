'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, MapPin, Search, ChevronRight } from 'lucide-react'
import {
  Avatar, Badge, Button, Group, Stack, Tabs, Text, TextInput, ActionIcon, Loader,
  SegmentedControl, ScrollArea,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { MantineDataTableToCards, type TableColumn, type CardConfig } from '@/design-system/mantine/patterns'
import { formatDate } from '@/lib/formatters'
import { toggleUserVerified } from '@/modules/admin/actions'
import type { UserRole } from '@/types/database'
import { toast } from '@/lib/toast'

export interface VerifiedAgent {
  id: string
  name: string | null
  company_name: string | null
  created_at: string
}

const ROLES: UserRole[] = ['user', 'agent', 'moderator', 'admin']

const ROLE_COLOR: Record<UserRole, string> = {
  user: 'gray', agent: 'blueLight', moderator: 'orange', admin: 'green',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'green', blocked: 'red', inactive: 'red', // §1b: Inactive→error (same as blocked)
}

export interface AdminUser {
  id: string
  public_id?: number | null
  name: string | null
  last_name: string | null
  phone: string | null
  role: UserRole
  user_type: string
  is_verified: boolean
  company_name: string | null
  status: string | null
  location_request: { city: string; region?: string } | null
  created_at: string
  last_seen_at?: string | null
  avatar_url?: string | null
}

interface Props {
  users: AdminUser[]
  total: number
  page: number
  perPage: number
  activeRole: string
  activeStatus?: string
  locationRequestFilter?: boolean
  searchQuery?: string
  activeTab?: string
  verifiedAgents?: VerifiedAgent[]
}

export function AdminUsersTable({
  users: init,
  total,
  page,
  perPage,
  activeRole,
  activeStatus = '',
  locationRequestFilter,
  searchQuery = '',
  activeTab = 'all',
  verifiedAgents = [],
}: Props) {
  const t = useTranslations('admin.users')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [items, setItems] = useState(init)
  const [searchValue, setSearchValue] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.ceil(total / perPage)

  // SSR: useMediaQuery returns false on first render; mobile layout applies after hydration.
  // Admin pages are auth-gated — the desktop→mobile reflow is not visible to unauthenticated users.
  const isMobile = useMediaQuery('(max-width: 40em)')

  useEffect(() => { setItems(init) }, [init])

  // Sync search field from URL only when no debounce is pending (user not mid-type).
  useEffect(() => {
    if (!debounceRef.current) setSearchValue(searchQuery)
  }, [searchQuery])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v === null ? params.delete(k) : params.set(k, v))
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setSearchValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('q', next)
      else params.delete('q')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
  }

  function withLoading(id: string, fn: () => Promise<void>) {
    setLoadingId(id)
    startTransition(async () => { await fn(); setLoadingId(null) })
  }

  // Mobile card config — designed hierarchy for <40em.
  // Desktop uses userColumns table (below). Handlers + testids are identical in both paths.
  const userCard: CardConfig<AdminUser> = {
    id: (u) => u.public_id != null ? `#${u.public_id}` : undefined,
    actions: (u) => {
      const isLoading = loadingId === u.id
      return (
        <Group gap="xs">
          {isLoading
            ? <Loader size="xs" />
            : (
              <ActionIcon
                variant="subtle"
                color={u.is_verified ? 'red' : 'green'}
                size="sm"
                mih="2.75rem"
                miw="2.75rem"
                title={u.is_verified ? t('revoke_verify') : t('verify')}
                onClick={() => withLoading(u.id, async () => {
                  await toggleUserVerified(u.id, !u.is_verified)
                  toast.success(t(u.is_verified ? 'revoke_success' : 'verify_success'))
                })}
                data-testid={u.is_verified ? 'revoke-btn' : 'verify-btn'}
              >
                {u.is_verified ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              </ActionIcon>
            )
          }
          <ActionIcon
            variant="subtle"
            size="sm"
            mih="2.75rem"
            miw="2.75rem"
            component={Link as any}
            href={`/admin/users/${u.id}`}
            data-testid="user-detail-link"
          >
            <ChevronRight size={14} />
          </ActionIcon>
        </Group>
      )
    },
    avatar: (u) => {
      const initials = u.name
        ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?'
      return (
        <Avatar src={u.avatar_url ?? null} radius="pill" size={40} color="brand">
          {initials}
        </Avatar>
      )
    },
    title: (u) => (
      <Text size="sm" fw={500} c="gray.7" truncate="end">
        {[u.name, u.last_name].filter(Boolean).join(' ') || '—'}
      </Text>
    ),
    subtitle: (u) => u.company_name || undefined,
    badge: (u) => (
      <Badge color={STATUS_COLOR[u.status ?? 'active'] ?? 'gray'} variant="light" size="sm">
        {t(`user_status_${u.status ?? 'active'}` as `user_status_active`)}
      </Badge>
    ),
    meta: [
      {
        label: t('col_role'),
        value: (u) => (
          <Badge color={ROLE_COLOR[u.role as UserRole] ?? 'gray'} variant="light" size="sm">
            {t(`role_${u.role}` as `role_admin`)}
          </Badge>
        ),
      },
      {
        label: t('col_phone'),
        value: (u) => <Text size="sm" c="gray.7">{u.phone ?? '—'}</Text>,
      },
      {
        label: t('col_date'),
        value: (u) => (
          <Stack gap="xs">
            <Text size="sm" c="gray.7">{formatDate(u.created_at, locale)}</Text>
            {u.last_seen_at && (
              <Text size="sm" c="gray.7" style={{ opacity: 0.7 }}>
                {t('last_seen_short')}: {formatDate(u.last_seen_at, locale)}
              </Text>
            )}
          </Stack>
        ),
      },
      {
        label: t('location_request_badge'),
        value: (u) => u.location_request ? (
          <Group gap="xs" wrap="nowrap">
            <MapPin size={10} style={{ color: 'var(--mantine-color-orange-6)', flexShrink: 0 }} />
            <Text size="xs" c="orange.6">{t('location_request_badge')}</Text>
          </Group>
        ) : null,
      },
    ],
  }

  const userColumns: TableColumn<AdminUser>[] = [
    {
      key: 'user',
      label: t('col_user'),
      width: '35%',
      render: (u) => {
        const initials = u.name
          ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : '?'
        const fullName = [u.name, u.last_name].filter(Boolean).join(' ') || '—'
        return (
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src={u.avatar_url ?? null}
              radius="pill"
              size={40}
              color="brand"
              style={{ flexShrink: 0 }}
            >
              {initials}
            </Avatar>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Link href={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
                <Text size="sm" fw={500} c="gray.7" truncate="end">{fullName}</Text>
              </Link>
              {(u.company_name || u.public_id != null) && (
                <Text size="xs" c="gray.5" truncate="end">
                  {[u.company_name, u.public_id != null ? `#${u.public_id}` : null].filter(Boolean).join(' · ')}
                </Text>
              )}
              {u.location_request && (
                <Group gap="xs" wrap="nowrap">
                  <MapPin size={10} style={{ color: 'var(--mantine-color-orange-6)', flexShrink: 0 }} />
                  <Text size="xs" c="orange.6">{t('location_request_badge')}</Text>
                </Group>
              )}
            </Stack>
          </Group>
        )
      },
    },
    {
      key: 'role',
      label: t('col_role'),
      align: 'center',
      width: '10%',
      render: (u) => (
        <Badge color={ROLE_COLOR[u.role as UserRole] ?? 'gray'} variant="light" size="sm">
          {t(`role_${u.role}` as `role_admin`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: t('col_status'),
      align: 'center',
      width: '10%',
      render: (u) => (
        <Badge color={STATUS_COLOR[u.status ?? 'active'] ?? 'gray'} variant="light" size="sm">
          {t(`user_status_${u.status ?? 'active'}` as `user_status_active`)}
        </Badge>
      ),
    },
    {
      key: 'phone',
      label: t('col_phone'),
      width: '13%',
      render: (u) => <Text size="xs" c="dimmed">{u.phone ?? '—'}</Text>,
    },
    {
      key: 'date',
      label: t('col_date'),
      align: 'right',
      width: '20%',
      render: (u) => (
        <Stack gap="xs">
          <Text size="xs" c="dimmed">{formatDate(u.created_at, locale)}</Text>
          {u.last_seen_at && (
            <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
              {t('last_seen_short')}: {formatDate(u.last_seen_at, locale)}
            </Text>
          )}
        </Stack>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: '12%',
      render: (u) => {
        const isLoading = loadingId === u.id
        return (
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            {isLoading ? (
              <Loader size="xs" />
            ) : (
              <ActionIcon
                variant="subtle"
                color={u.is_verified ? 'red' : 'green'}
                size="sm"
                title={u.is_verified ? t('revoke_verify') : t('verify')}
                onClick={() => withLoading(u.id, async () => {
                  await toggleUserVerified(u.id, !u.is_verified)
                  toast.success(t(u.is_verified ? 'revoke_success' : 'verify_success'))
                })}
                data-testid={u.is_verified ? 'revoke-btn' : 'verify-btn'}
              >
                {u.is_verified ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              </ActionIcon>
            )}
            <ActionIcon
              variant="subtle"
              size="sm"
              component={Link as any}
              href={`/admin/users/${u.id}`}
              data-testid="user-detail-link"
            >
              <ChevronRight size={14} />
            </ActionIcon>
          </Group>
        )
      },
    },
  ]

  const verifiedColumns: TableColumn<VerifiedAgent>[] = [
    {
      key: 'agent',
      label: t('col_agent'),
      width: '55%',
      render: (u) => {
        const initials = u.name
          ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : '?'
        return (
          <Group gap="sm" wrap="nowrap">
            <Avatar radius="pill" size={40} color="brand" style={{ flexShrink: 0 }}>
              {initials}
            </Avatar>
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Link href={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }} data-testid="agent-detail-link">
                <Text size="sm" fw={500} c="gray.7" truncate="end">{u.name ?? '—'}</Text>
              </Link>
              {u.company_name && (
                <Text size="xs" c="gray.5" truncate="end">{u.company_name}</Text>
              )}
            </Stack>
          </Group>
        )
      },
    },
    {
      key: 'date',
      label: t('col_date'),
      align: 'right',
      width: '25%',
      render: (u) => <Text size="xs" c="dimmed">{formatDate(u.created_at, locale)}</Text>,
    },
    {
      key: 'revoke',
      label: '',
      align: 'right',
      width: '10%',
      render: (u) => {
        const isLoading = loadingId === u.id
        if (isLoading) return <Group justify="flex-end"><Loader size="xs" /></Group>
        return (
          <Group justify="flex-end">
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              title={t('revoke_verify')}
              onClick={() => withLoading(u.id, async () => {
                await toggleUserVerified(u.id, false)
                toast.success(t('revoke_success'))
              })}
              data-testid="revoke-btn"
            >
              <ShieldOff size={14} />
            </ActionIcon>
          </Group>
        )
      },
    },
  ]

  return (
    <Stack gap="md" data-testid="admin-users-table">
      {/* Tabs — content-width pill strip inside a horizontal ScrollArea (theme.ts:830), matching
          Tabs.stories.tsx:36. `grow` removed (Task 749 rev.1, D-6): it was already inert (each tab
          is pinned at max-content by `min-width: auto`), and under a full-width track it would
          stretch each tab to ~50% of the strip, a design change nobody asked for. */}
      <Tabs
        value={activeTab}
        onChange={(tab) => navigate({
          tab: tab === 'all' ? null : tab,
          page: null,
          role: null,
          q: null,
        })}
      >
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
          <Tabs.List>
            <Tabs.Tab value="all">{t('tab_all')}</Tabs.Tab>
            <Tabs.Tab value="verified">{t('tab_verified')}</Tabs.Tab>
          </Tabs.List>
        </ScrollArea>
      </Tabs>

      {activeTab === 'verified' ? (
        <MantineDataTableToCards<VerifiedAgent>
          columns={verifiedColumns}
          rows={verifiedAgents}
          emptyLabel={t('empty_verified')}
          rowClassName={(u) => loadingId === u.id ? 'opacity-50' : ''}
        />
      ) : (
        <>
          {/* Search — full-width */}
          <TextInput
            value={searchValue}
            placeholder={t('search_placeholder')}
            leftSection={<Search size={14} />}
            onChange={handleSearchChange}
            style={{ width: '100%' }}
            data-testid="users-search"
          />

          {/* Role filter — SegmentedControl with horizontal scroll on mobile.
              Ukrainian labels ("Адміністратор" 13 chars) clip at 320px with fullWidth.
              ScrollArea scrollbars="x" lets users swipe to see all options. */}
          <ScrollArea scrollbars="x" w="100%">
            <SegmentedControl
              value={activeRole}
              onChange={(val) => navigate({ role: val || null, page: null })}
              size="xs"
              data-testid="role-segmented-control"
              data={[
                { value: '', label: t('filter_all') },
                ...ROLES.map(r => ({ value: r, label: t(`role_${r}` as `role_admin`) })),
              ]}
            />
          </ScrollArea>

          {locationRequestFilter && (
            <Button
              variant="light"
              color="orange"
              size="sm"
              fullWidth={isMobile}
              leftSection={<MapPin size={12} />}
              onClick={() => navigate({ location_request: null, page: null })}
              data-testid="location-request-filter"
            >
              {t('location_request_badge')} ×
            </Button>
          )}

          {/* Status filter — SegmentedControl with horizontal scroll on mobile.
              "Заблокований" (12 chars uk) clips at ≤80px per segment. */}
          <ScrollArea scrollbars="x" w="100%">
            <SegmentedControl
              value={activeStatus}
              onChange={(val) => navigate({ status: val || null, page: null })}
              size="xs"
              data-testid="status-segmented-control"
              data={[
                { value: '', label: t('filter_status_all') },
                { value: 'active', label: t('filter_status_active') },
                { value: 'inactive', label: t('filter_status_inactive') },
                { value: 'blocked', label: t('filter_status_blocked') },
              ]}
            />
          </ScrollArea>

          {/* Table/Cards — rendered via MantineDataTableToCards */}
          <MantineDataTableToCards<AdminUser>
            columns={userColumns}
            rows={items}
            emptyLabel={t('empty')}
            rowClassName={(u) => loadingId === u.id ? 'opacity-50' : ''}
            card={userCard}
          />

          {/* Pagination — full-width on mobile */}
          {totalPages > 1 && (
            <Group justify="center" gap="sm" wrap="wrap" align="center">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => navigate({ page: String(page - 1) })}
                fullWidth={isMobile}
                data-testid="prev-page"
              >
                {t('prev_page')}
              </Button>
              <Text size="sm" c="dimmed">
                {page} / {totalPages}
              </Text>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => navigate({ page: String(page + 1) })}
                fullWidth={isMobile}
                data-testid="next-page"
              >
                {t('next_page')}
              </Button>
            </Group>
          )}
        </>
      )}
    </Stack>
  )
}
