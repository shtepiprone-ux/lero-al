'use client'

import type { ChangeEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ShieldCheck, ShieldOff, Search, ChevronRight } from 'lucide-react'
import { Anchor, Avatar, Box, Button, Group, Stack, Tabs, Text, TextInput, ActionIcon, Loader, SegmentedControl, ScrollArea, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { belowMobileGateQuery } from '@/design-system/mantine/belowMobileGate'
import { MantineDataTableToCards, type TableColumn, type CardConfig } from '@/design-system/mantine/patterns'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineFilterChips } from '@/design-system/mantine/patterns/MantineFilterChips'
import { BADGE_TONES } from '@/design-system/mantine/badgeTones'
import { formatDate } from '@/lib/formatters'
import type { UserRole, UserStatus } from '@/types/database'

export interface VerifiedAgent {
  id: string
  name: string | null
  company_name: string | null
  created_at: string
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

const ROLES: UserRole[] = ['user', 'agent', 'moderator', 'admin']

export interface AdminUsersTableViewProps {
  users: AdminUser[]
  total: number
  page: number
  perPage: number
  activeRole: string
  activeStatus?: string
  locationRequestFilter?: boolean
  activeTab?: string
  verifiedAgents?: VerifiedAgent[]
  /** The search field's current text (the parent owns it, debounces it and writes `q`). */
  searchValue: string
  /** The id of the user whose verify toggle is in flight. */
  loadingId: string | null
  /** Tabs, role, status, location chip and pagination: the parent turns `updates` into the URL (a `null` removes a param). */
  onNavigate: (updates: Record<string, string | null>) => void
  onSearchChange: (value: string) => void
  /** Verify or revoke: receives the user's current state, the parent flips it. */
  onToggleVerified: (user: { id: string; is_verified: boolean }) => void
}

function initialsOf(name: string | null): string {
  return name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
}

/**
 * Presentational view of the admin users surface (Task 859 Revision 7, R52). It holds no router, no server action and no
 * debounce: everything it shows comes from props and everything it does goes out through the callbacks, so a Story can
 * drive it with a stateful harness and every control works. `AdminUsersTable` is the container that wires it to the
 * URL and to `toggleUserVerified`.
 */
export function AdminUsersTableView({
  users,
  total,
  page,
  perPage,
  activeRole,
  activeStatus = '',
  locationRequestFilter,
  activeTab = 'all',
  verifiedAgents = [],
  searchValue,
  loadingId,
  onNavigate,
  onSearchChange,
  onToggleVerified,
}: AdminUsersTableViewProps) {
  const t = useTranslations('admin.users')
  const tc = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()
  const totalPages = Math.ceil(total / perPage)

  // SSR: useMediaQuery returns false on first render; mobile layout applies after hydration.
  // Admin pages are auth-gated — the desktop→mobile reflow is not visible to unauthenticated users.
  const isMobile = useMediaQuery(belowMobileGateQuery(theme))

  const verifyIcon = (u: { is_verified: boolean }) =>
    u.is_verified ? <ShieldCheck size={theme.other.iconSize.compact} /> : <ShieldOff size={theme.other.iconSize.compact} />

  const locationRequestBadge = (
    <MantineBadge variant="status" entity="userSignal" value="locationRequest" size="xs">
      {t('location_request_badge')}
    </MantineBadge>
  )

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
                color={u.is_verified ? BADGE_TONES.danger : BADGE_TONES.success}
                size="sm"
                mih={theme.other.touchTarget}
                miw={theme.other.touchTarget}
                title={u.is_verified ? t('revoke_verify') : t('verify')}
                onClick={() => onToggleVerified(u)}
                data-testid={u.is_verified ? 'revoke-btn' : 'verify-btn'}
              >
                {verifyIcon(u)}
              </ActionIcon>
            )
          }
          <ActionIcon
            variant="subtle"
            size="sm"
            mih={theme.other.touchTarget}
            miw={theme.other.touchTarget}
            component={Link}
            href={`/admin/users/${u.id}`}
            data-testid="user-detail-link"
          >
            <ChevronRight size={theme.other.iconSize.compact} />
          </ActionIcon>
        </Group>
      )
    },
    avatar: (u) => (
      <Avatar src={u.avatar_url ?? null} radius="pill" size={theme.other.iconSize.banner} color="brand">
        {initialsOf(u.name)}
      </Avatar>
    ),
    title: (u) => (
      <Text size="sm" fw={500}>
        {[u.name, u.last_name].filter(Boolean).join(' ') || '—'}
      </Text>
    ),
    subtitle: (u) => u.company_name || undefined,
    badge: (u) => (
      <MantineBadge variant="status" entity="user" value={(u.status ?? 'active') as UserStatus}>
        {t(`user_status_${u.status ?? 'active'}` as `user_status_active`)}
      </MantineBadge>
    ),
    meta: [
      {
        label: t('col_role'),
        value: (u) => (
          <MantineBadge variant="status" entity="userRole" value={u.role as UserRole}>
            {t(`role_${u.role}` as `role_admin`)}
          </MantineBadge>
        ),
      },
      {
        label: t('col_phone'),
        value: (u) => <Text size="sm">{u.phone ?? '—'}</Text>,
      },
      {
        label: t('col_date'),
        value: (u) => (
          <Stack gap="xs">
            <Text size="sm">{formatDate(u.created_at, locale)}</Text>
            {u.last_seen_at && (
              <Text size="sm" c="dimmed">
                {t('last_seen_short')}: {formatDate(u.last_seen_at, locale)}
              </Text>
            )}
          </Stack>
        ),
      },
      {
        label: t('location_request_badge'),
        value: (u) => u.location_request ? locationRequestBadge : null,
      },
    ],
  }

  const userColumns: TableColumn<AdminUser>[] = [
    {
      key: 'user',
      label: t('col_user'),
      // §7.3 (a): the user cell wraps in a column of the table-title token width.
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      render: (u) => {
        const fullName = [u.name, u.last_name].filter(Boolean).join(' ') || '—'
        return (
          <Group gap="sm" wrap="nowrap">
            <Avatar src={u.avatar_url ?? null} radius="pill" size={theme.other.iconSize.banner} color="brand" flex="none">
              {initialsOf(u.name)}
            </Avatar>
            {/* R70, GR-3h: the text block and the location-request badge are two blocks one rhythm step (sm) apart.
                R71, GR-3i, R82(b), D6: the name, the company line and the phone wrap — nothing is cut. */}
            <Stack gap="sm" miw={0}>
              <Stack gap={0}>
                <Anchor component={Link} href={`/admin/users/${u.id}`} underline="never" c="inherit">
                  <Text size="sm" fw={500}>{fullName}</Text>
                </Anchor>
                {(u.company_name || u.public_id != null) && (
                  <Text size="xs" c="dimmed">
                    {[u.company_name, u.public_id != null ? `#${u.public_id}` : null].filter(Boolean).join(' · ')}
                  </Text>
                )}
                {u.phone && <Text size="xs" c="dimmed">{u.phone}</Text>}
              </Stack>
              {u.location_request && locationRequestBadge}
            </Stack>
          </Group>
        )
      },
    },
    {
      key: 'status',
      label: t('col_status'),
      // §7.3 (b): role and status stacked in one cell, one rhythm step (sm) apart (R70, GR-3h).
      render: (u) => (
        <Stack gap="sm" align="flex-start">
          <MantineBadge variant="status" entity="userRole" value={u.role as UserRole}>
            {t(`role_${u.role}` as `role_admin`)}
          </MantineBadge>
          <MantineBadge variant="status" entity="user" value={(u.status ?? 'active') as UserStatus}>
            {t(`user_status_${u.status ?? 'active'}` as `user_status_active`)}
          </MantineBadge>
        </Stack>
      ),
    },
    {
      key: 'date',
      label: t('col_date'),
      align: 'right',
      visibleFrom: 'xl',
      render: (u) => (
        <Stack gap="xs">
          <Text size="xs" c="dimmed">{formatDate(u.created_at, locale)}</Text>
          {u.last_seen_at && (
            <Text size="xs" c="dimmed">
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
      render: (u) => {
        const isLoading = loadingId === u.id
        return (
          <Group gap="xs" justify="flex-end" wrap="nowrap">
            {isLoading ? (
              <Loader size="xs" />
            ) : (
              <ActionIcon
                variant="subtle"
                color={u.is_verified ? BADGE_TONES.danger : BADGE_TONES.success}
                size="sm"
                title={u.is_verified ? t('revoke_verify') : t('verify')}
                onClick={() => onToggleVerified(u)}
                data-testid={u.is_verified ? 'revoke-btn' : 'verify-btn'}
              >
                {verifyIcon(u)}
              </ActionIcon>
            )}
            <ActionIcon
              variant="subtle"
              size="sm"
              component={Link}
              href={`/admin/users/${u.id}`}
              data-testid="user-detail-link"
            >
              <ChevronRight size={theme.other.iconSize.compact} />
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
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      render: (u) => (
        <Group gap="sm" wrap="nowrap">
          <Avatar radius="pill" size={theme.other.iconSize.banner} color="brand" flex="none">
            {initialsOf(u.name)}
          </Avatar>
          <Stack gap={0} miw={0}>
            <Anchor component={Link} href={`/admin/users/${u.id}`} underline="never" c="inherit" data-testid="agent-detail-link">
              <Text size="sm" fw={500}>{u.name ?? '—'}</Text>
            </Anchor>
            {u.company_name && (
              <Text size="xs" c="dimmed">{u.company_name}</Text>
            )}
          </Stack>
        </Group>
      ),
    },
    {
      key: 'date',
      label: t('col_date'),
      align: 'right',
      render: (u) => <Text size="xs" c="dimmed">{formatDate(u.created_at, locale)}</Text>,
    },
    {
      key: 'revoke',
      label: '',
      align: 'right',
      render: (u) => {
        const isLoading = loadingId === u.id
        if (isLoading) return <Group justify="flex-end"><Loader size="xs" /></Group>
        return (
          <Group justify="flex-end">
            <ActionIcon
              variant="subtle"
              color={BADGE_TONES.danger}
              size="sm"
              title={t('revoke_verify')}
              onClick={() => onToggleVerified({ id: u.id, is_verified: true })}
              data-testid="revoke-btn"
            >
              <ShieldOff size={theme.other.iconSize.compact} />
            </ActionIcon>
          </Group>
        )
      },
    },
  ]

  // R82(a), GR-3j: the Verified tab renders the card anatomy, not the generic column list — avatar, name link and company,
  // the date as a labelled field, and the revoke action as the card's last block with the 44px touch target.
  const verifiedCard: CardConfig<VerifiedAgent> = {
    avatar: (u) => (
      <Avatar radius="pill" size={theme.other.iconSize.banner} color="brand">
        {initialsOf(u.name)}
      </Avatar>
    ),
    title: (u) => (
      <Anchor component={Link} href={`/admin/users/${u.id}`} underline="never" c="inherit" data-testid="agent-detail-link">
        <Text size="sm" fw={500}>{u.name ?? '—'}</Text>
      </Anchor>
    ),
    subtitle: (u) => u.company_name || undefined,
    meta: [{ label: t('col_date'), value: (u) => formatDate(u.created_at, locale) }],
    actions: (u) =>
      loadingId === u.id ? (
        <Loader size="xs" />
      ) : (
        <ActionIcon
          variant="subtle"
          color={BADGE_TONES.danger}
          size="sm"
          mih={theme.other.touchTarget}
          miw={theme.other.touchTarget}
          title={t('revoke_verify')}
          onClick={() => onToggleVerified({ id: u.id, is_verified: true })}
          data-testid="revoke-btn"
        >
          <ShieldOff size={theme.other.iconSize.compact} />
        </ActionIcon>
      ),
  }

  const locationChipLabel = t('location_request_badge')

  return (
    <Stack gap="md" data-testid="admin-users-table">
      {/* Tabs — content-width pill strip inside a horizontal ScrollArea (theme.ts:830), matching
          Tabs.stories.tsx:36. `grow` removed (Task 749 rev.1, D-6): it was already inert (each tab
          is pinned at max-content by `min-width: auto`), and under a full-width track it would
          stretch each tab to ~50% of the strip, a design change nobody asked for. */}
      <Tabs
        value={activeTab}
        onChange={(tab) => onNavigate({
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
          card={verifiedCard}
          rows={verifiedAgents}
          emptyLabel={t('empty_verified')}
          rowClassName={(u) => loadingId === u.id ? 'opacity-50' : ''}
          cardsBelow="md"
        />
      ) : (
        <>
          {/* Search — full-width */}
          <TextInput
            value={searchValue}
            placeholder={t('search_placeholder')}
            leftSection={<Search size={theme.other.iconSize.compact} />}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            w="100%"
            data-testid="users-search"
          />

          {/* Role filter — SegmentedControl with horizontal scroll on mobile.
              Ukrainian labels ("Адміністратор" 13 chars) clip at 320px with fullWidth.
              ScrollArea scrollbars="x" lets users swipe to see all options. */}
          <ScrollArea scrollbars="x" w="100%">
            <SegmentedControl
              value={activeRole}
              onChange={(val) => onNavigate({ role: val || null, page: null })}
              size="xs"
              data-testid="role-segmented-control"
              data={[
                { value: '', label: t('filter_all') },
                ...ROLES.map(r => ({ value: r, label: t(`role_${r}` as `role_admin`) })),
              ]}
            />
          </ScrollArea>

          {locationRequestFilter && (
            <Box data-testid="location-request-filter">
              <MantineFilterChips
                chips={[{ key: 'location_request', label: locationChipLabel, ariaLabel: `${locationChipLabel} — ${tc('aria_remove_filter')}` }]}
                onRemove={() => onNavigate({ location_request: null, page: null })}
              />
            </Box>
          )}

          {/* Status filter — SegmentedControl with horizontal scroll on mobile.
              "Заблокований" (12 chars uk) clips at ≤80px per segment. */}
          <ScrollArea scrollbars="x" w="100%">
            <SegmentedControl
              value={activeStatus}
              onChange={(val) => onNavigate({ status: val || null, page: null })}
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
            rows={users}
            emptyLabel={t('empty')}
            rowClassName={(u) => loadingId === u.id ? 'opacity-50' : ''}
            card={userCard}
            cardsBelow="md"
          />

          {/* Pagination — full-width on mobile */}
          {totalPages > 1 && (
            <Group justify="center" gap="sm" wrap="wrap" align="center">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => onNavigate({ page: String(page - 1) })}
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
                onClick={() => onNavigate({ page: String(page + 1) })}
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
