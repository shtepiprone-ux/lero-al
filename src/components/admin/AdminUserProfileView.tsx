'use client'

import type { ComponentProps, ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core'
import {
  ChevronLeft, History, MapPin, Pencil, RotateCcw, Save, ShieldCheck, Trash2, UserPlus, X,
} from 'lucide-react'
import { MantineFormSection, MantineSelect } from '@/design-system/mantine/patterns'
import { RangeDatePicker } from '@/design-system/mantine/patterns/RangeDatePicker'
import { PhoneField } from '@/components/shared/PhoneField'
import type { PhoneFieldValue } from '@/components/shared/PhoneField'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { ProfileType } from '@/modules/admin/actions'
import type { User, UserChangeLog, UserStatusHistory, HistoryClearSource } from '@/types/database'

// ── Types and constants (shared with the container) ─────────────────────────────

export interface CityOption { id: number; name_al: string; region_id: number | null }
export interface RegionOption { id: number; name_al: string }

export type UserWithLocation = User & {
  location?: { id: number; name_al: string; region_id: number | null; parent?: { id: number; name_al: string } | null } | null
}

export const PROFILE_TYPES = ['admin', 'moderator', 'private', 'agent', 'developer'] as const
export const STATUS_VALUES = ['active', 'blocked', 'inactive'] as const

export type AdminUserProfileMode = 'view' | 'edit' | 'create'

export interface AdminUserProfileFormValues {
  firstName: string
  lastName: string
  profileType: typeof PROFILE_TYPES[number]
  phone: string
  useMainPhone: boolean
  whatsapp?: string
  locationId: number
  companyName?: string
  companyLogoUrl?: string
  website?: string
  position?: string
  yearStarted?: number | null
  status: typeof STATUS_VALUES[number]
  blockReason?: string
  suspendedUntil?: string | null
}

export type AdminUserProfileErrors = Partial<Record<
  'firstName' | 'lastName' | 'profileType' | 'phone' | 'whatsapp' | 'locationId' | 'companyName' | 'website' | 'yearStarted' | 'status' | 'blockReason',
  string
>>

export function profileTypeFromUser(user: Pick<User, 'role' | 'user_type'>): ProfileType {
  if (user.role === 'admin') return 'admin'
  if (user.role === 'moderator') return 'moderator'
  if (user.role === 'agent') return 'agent'
  if (user.user_type === 'developer') return 'developer'
  return 'private'
}

const STATUS_COLOR = { active: 'green', blocked: 'red', inactive: 'yellow' } as const

export interface AdminUserProfileViewProps {
  mode: AdminUserProfileMode
  /** The stored user (read-only display data); `null` in create mode. */
  user: UserWithLocation | null
  email: string
  emailConfirmedAt?: string | null
  cities: CityOption[]
  regions: RegionOption[]
  changeLog: UserChangeLog[]
  statusHistory: UserStatusHistory[]
  isAdmin: boolean
  canClearHistory: boolean
  /** Pre-formatted on the server (sq ICU divergence): rendered verbatim when present. */
  changeLogDates?: Record<string, string>
  statusHistoryDates?: Record<string, string>
  suspendedUntilFormatted?: string | null
  /** The live form values and their validation messages (the container owns the form). */
  values: AdminUserProfileFormValues
  errors: AdminUserProfileErrors
  onFieldChange: <K extends keyof AdminUserProfileFormValues>(field: K, value: AdminUserProfileFormValues[K]) => void
  phoneE164: string
  whatsappE164: string
  onPhoneChange: (value: PhoneFieldValue) => void
  onWhatsappChange: (value: PhoneFieldValue) => void
  createEmail: string
  createEmailError: string | null
  onCreateEmailChange: (value: string) => void
  saving: boolean
  saveError: string | null
  isDirty: boolean
  /** The avatar field (the container passes `AdminUserAvatarField`, which owns the upload state). */
  avatar: ReactNode
  locationRequestLoading: boolean
  onApproveLocationRequest: (locationId: number) => void
  onRejectLocationRequest: () => void
  onAddLocation?: ComponentProps<typeof LocationCombobox>['onAddLocation']
  onBack: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDeactivate: () => void
  onReactivate: () => void
  onDelete: () => void
  onClearHistory: (source: HistoryClearSource) => void
  onClearHistoryRow: (source: HistoryClearSource, rowId: string) => void
}

// ── Field row: label column + value column ──────────────────────────────────────

interface FieldRowProps {
  label: string
  /** `id` of a single control the label is `for`. */
  htmlFor?: string
  /** `id` of the label, for a composite control (phone, city) that is exposed as a labelled group. */
  labelId?: string
  editing: boolean
  children: ReactNode
}

function FieldRow({ label, htmlFor, labelId, editing, children }: FieldRowProps) {
  const theme = useMantineTheme()
  return (
    <Grid gutter="sm" align="flex-start">
      <Grid.Col span={{ base: 12, sm: 3 }}>
        <Flex align="center" mih={editing ? theme.other.touchTarget : undefined}>
          <Text component="label" size="sm" c="dimmed" htmlFor={htmlFor} id={labelId}>
            {label}
          </Text>
        </Flex>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 9 }}>
        {labelId ? (
          <Box role="group" aria-labelledby={labelId}>
            {children}
          </Box>
        ) : (
          children
        )}
      </Grid.Col>
    </Grid>
  )
}

function ViewValue({ children }: { children?: ReactNode }) {
  return children ? (
    <Text size="sm" fw={500}>
      {children}
    </Text>
  ) : (
    <Text size="sm" c="dimmed">
      —
    </Text>
  )
}

// ── History rows ────────────────────────────────────────────────────────────────

interface HistoryRowProps {
  id: string
  source: HistoryClearSource
  date: string
  from: string
  to: string
  reason?: string | null
  canClear: boolean
  onClearRow: (source: HistoryClearSource, rowId: string) => void
}

function HistoryRow({ id, source, date, from, to, reason, canClear, onClearRow }: HistoryRowProps) {
  const t = useTranslations('admin.user_profile')
  const theme = useMantineTheme()
  return (
    <Group wrap="nowrap" align="flex-start" gap="sm">
      <Box pt="micro">
        <History size={theme.other.iconSize.compact} />
      </Box>
      <Stack gap={0} flex={1} miw={0}>
        <Text size="xs">
          <Text span c="dimmed" inherit>{date}</Text>
          {' · '}
          <Text span fw={500} inherit>{from}</Text>
          {' → '}
          <Text span fw={500} inherit>{to}</Text>
        </Text>
        {reason && (
          <Text size="xs" c="dimmed">
            {t('feedback.reason_prefix', { reason })}
          </Text>
        )}
      </Stack>
      {canClear && (
        <ActionIcon
          type="button"
          variant="subtle"
          color="gray"
          size={theme.other.touchTarget}
          aria-label={t('actions.clear_history_row_aria')}
          onClick={() => onClearRow(source, id)}
        >
          <Trash2 size={theme.other.iconSize.standard} />
        </ActionIcon>
      )}
    </Group>
  )
}

function ClearAllButton({ source, onClear }: { source: HistoryClearSource; onClear: (source: HistoryClearSource) => void }) {
  const t = useTranslations('admin.user_profile')
  const theme = useMantineTheme()
  return (
    <Button
      type="button"
      variant="outline"
      color="red"
      leftSection={<Trash2 size={theme.other.iconSize.standard} />}
      onClick={() => onClear(source)}
    >
      {t('actions.clear_history')}
    </Button>
  )
}

// ── View ──────────────────────────────────────────────────────────────────────

/**
 * Presentational View of `/admin/users/[id]` and `/admin/users/new` (Task 893, R5; Container/Presentational split
 * of `AdminUserProfile`). Composes canonical Mantine sources only: `MantineFormSection` cards, `MantineSelect`,
 * `RangeDatePicker` (single), `PhoneField`, `LocationCombobox`, and Mantine `Grid`/`Alert`/`Badge`/`Button`. The
 * avatar is a slot (its upload state belongs to the container). The container owns the form, the validation, every server action and every navigation; this View holds no state.
 * Every edit control's accessible name is its row label.
 */
export function AdminUserProfileView({
  mode,
  user,
  email,
  emailConfirmedAt,
  cities,
  regions,
  changeLog,
  statusHistory,
  isAdmin,
  canClearHistory,
  changeLogDates,
  statusHistoryDates,
  suspendedUntilFormatted,
  values,
  errors,
  onFieldChange,
  phoneE164,
  whatsappE164,
  onPhoneChange,
  onWhatsappChange,
  createEmail,
  createEmailError,
  onCreateEmailChange,
  saving,
  saveError,
  isDirty,
  avatar,
  locationRequestLoading,
  onApproveLocationRequest,
  onRejectLocationRequest,
  onAddLocation,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDeactivate,
  onReactivate,
  onDelete,
  onClearHistory,
  onClearHistoryRow,
}: AdminUserProfileViewProps) {
  const t = useTranslations('admin.user_profile')
  const locale = useLocale()
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard

  const isCreate = mode === 'create'
  const editing = mode !== 'view'
  const isBusiness = ['agent', 'developer'].includes(values.profileType)
  const displayName = user ? [user.name, user.last_name].filter(Boolean).join(' ') || '—' : ''
  const regionName = regions.find(r => r.id === cities.find(c => c.id === values.locationId)?.region_id)?.name_al
    ?? user?.location?.parent?.name_al
  const currentYear = new Date().getFullYear()
  const profileTypeLabel = t('fields.profile_type').replace(' *', '')

  const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
    admin: t('profile_types.admin'),
    moderator: t('profile_types.moderator'),
    private: t('profile_types.private'),
    agent: t('profile_types.agent'),
    developer: t('profile_types.developer'),
  }
  const STATUS_LABELS = {
    active: t('statuses.active'),
    blocked: t('statuses.blocked'),
    inactive: t('statuses.inactive'),
  }

  const storedStatus = (user?.status ?? 'active') as keyof typeof STATUS_LABELS
  const storedProfileType = user ? profileTypeFromUser(user) : 'private'

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const sidebarView = user ? (
    <>
      <MantineFormSection title={t('sections.actions')}>
        <Stack gap="sm">
          <Button fullWidth justify="flex-start" variant="default" leftSection={<Pencil size={iconSize} />} onClick={onEdit}>
            {t('actions.edit_profile')}
          </Button>
          {isAdmin && storedStatus !== 'inactive' && (
            <Button
              fullWidth
              justify="flex-start"
              variant="outline"
              color="yellow"
              leftSection={<Trash2 size={iconSize} />}
              onClick={onDeactivate}
            >
              {t('actions.deactivate_profile')}
            </Button>
          )}
          {isAdmin && storedStatus === 'inactive' && (
            <Button
              fullWidth
              justify="flex-start"
              variant="outline"
              color="green"
              leftSection={<RotateCcw size={iconSize} />}
              onClick={onReactivate}
            >
              {t('actions.reactivate_profile')}
            </Button>
          )}
          {isAdmin && (
            <Button
              fullWidth
              justify="flex-start"
              variant="outline"
              color="red"
              leftSection={<Trash2 size={iconSize} />}
              onClick={onDelete}
            >
              {t('actions.delete_permanently')}
            </Button>
          )}
        </Stack>
      </MantineFormSection>
      <MantineFormSection title={t('sections.account_status')}>
        <Stack gap="sm">
          <Group justify="space-between" gap="sm">
            <Text size="xs" c="dimmed">
              {profileTypeLabel}
            </Text>
            <Badge variant="light" color="gray">
              {PROFILE_TYPE_LABELS[storedProfileType]}
            </Badge>
          </Group>
          <Group justify="space-between" gap="sm">
            <Text size="xs" c="dimmed">
              {t('fields.status')}
            </Text>
            <Badge variant="light" color={STATUS_COLOR[storedStatus]}>
              {STATUS_LABELS[storedStatus]}
            </Badge>
          </Group>
          {user.status === 'blocked' && user.suspended_until && (
            <Text size="xs" c="dimmed">
              {t('fields.suspended_until').toLowerCase()}{' '}
              {suspendedUntilFormatted ?? formatDate(user.suspended_until, locale)}
            </Text>
          )}
          {user.block_reason && (
            <Text size="xs" c="dimmed" fs="italic">
              {user.block_reason}
            </Text>
          )}
        </Stack>
      </MantineFormSection>
    </>
  ) : null

  const sidebarEdit = (
    <>
      <MantineFormSection title={t('sections.actions')}>
        <Stack gap="sm">
          <Button
            fullWidth
            justify="flex-start"
            loading={saving}
            disabled={!isCreate && !isDirty}
            leftSection={isCreate ? <UserPlus size={iconSize} /> : <Save size={iconSize} />}
            onClick={onSave}
          >
            {isCreate ? t('actions.create_user') : t('actions.save')}
          </Button>
          <Button fullWidth justify="flex-start" variant="outline" color="gray" leftSection={<X size={iconSize} />} onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
        </Stack>
      </MantineFormSection>
      <MantineFormSection title={t('sections.role_status')}>
        <Stack gap="md">
          <MantineSelect
            label={profileTypeLabel}
            data={PROFILE_TYPES.map(pt => ({ value: pt, label: PROFILE_TYPE_LABELS[pt] }))}
            value={values.profileType}
            onChange={v => { if (v) onFieldChange('profileType', v as typeof PROFILE_TYPES[number]) }}
            disabled={!isAdmin}
            allowDeselect={false}
            error={errors.profileType}
          />
          {!isCreate && (
            <MantineSelect
              label={t('sections.account_status')}
              data={STATUS_VALUES.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
              value={values.status}
              onChange={v => { if (v) onFieldChange('status', v as typeof STATUS_VALUES[number]) }}
              allowDeselect={false}
              error={errors.status}
            />
          )}
          {!isCreate && (values.status === 'blocked' || user?.block_reason) && (
            <TextInput
              label={t('fields.block_reason')}
              placeholder={t('placeholders.block_reason')}
              value={values.blockReason ?? ''}
              onChange={e => onFieldChange('blockReason', e.target.value)}
              error={errors.blockReason}
            />
          )}
          {!isCreate && values.status === 'blocked' && (
            <Stack gap={0} role="group" aria-labelledby="admin-user-suspended-until-label">
              <Text component="label" size="sm" fw={500} id="admin-user-suspended-until-label">
                {t('fields.suspended_until')}
              </Text>
              <RangeDatePicker
                selectionMode="single"
                value={{ from: values.suspendedUntil ?? undefined, to: values.suspendedUntil ?? undefined }}
                onChange={next => onFieldChange('suspendedUntil', next.from ?? null)}
                placeholder={t('fields.block_permanent')}
              />
            </Stack>
          )}
        </Stack>
      </MantineFormSection>
    </>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Stack data-testid="admin-user-profile" gap="md">
      <Group>
        <Button variant="subtle" color="gray" leftSection={<ChevronLeft size={iconSize} />} onClick={onBack}>
          {t('actions.back_to_users')}
        </Button>
      </Group>

      {saveError && (
        <Alert color="red" variant="light">
          {saveError}
        </Alert>
      )}

      <Grid gutter={{ base: 'md', lg: 'xl' }}>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="xl">
            {/* ── Header card ─────────────────────────────────────────────────── */}
            <Paper withBorder radius="2xl" p={{ base: 'lg', sm: 'xl' }}>
              <Group align="flex-start" wrap="nowrap" gap="lg">
                {avatar}
                <Stack gap="xs" miw={0} flex={1}>
                  {isCreate || !user ? (
                    <>
                      <Title order={1} fz="xl" fw={700}>
                        {t('header.new_user_title')}
                      </Title>
                      <Text size="sm" c="dimmed">
                        {t('header.new_user_subtitle')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Title order={1} fz="xl" fw={700}>
                        {displayName}
                      </Title>
                      <Group gap="xs">
                        <Badge variant="light" color="gray">
                          {PROFILE_TYPE_LABELS[storedProfileType]}
                        </Badge>
                        <Badge variant="light" color={STATUS_COLOR[storedStatus]}>
                          {STATUS_LABELS[storedStatus]}
                        </Badge>
                        {user.is_verified && (
                          <Badge variant="light" color="green" leftSection={<ShieldCheck size={theme.other.iconSize.badge} />}>
                            {t('header.verified_badge')}
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed" truncate="end" title={email}>
                        {email}
                      </Text>
                      {user.public_id != null && (
                        <Text size="xs" c="dimmed" ff="monospace">
                          #{user.public_id}
                        </Text>
                      )}
                    </>
                  )}
                </Stack>
              </Group>
            </Paper>

            {/* ── Location request ────────────────────────────────────────────── */}
            {user?.location_request && (
              <Alert color="yellow" variant="light" icon={<MapPin size={iconSize} />} title={t('location_request.title')}>
                <Stack gap="sm">
                  <Text size="sm">
                    <Text span fw={700} inherit>{user.location_request.city}</Text>
                    {user.location_request.region ? `, ${user.location_request.region}` : ''}
                  </Text>
                  <Group gap="sm" align="center" wrap="wrap">
                    <Box flex={1} miw={0} opacity={locationRequestLoading ? 0.5 : 1} inert={locationRequestLoading}>
                      <LocationCombobox
                        locations={cities}
                        value=""
                        onChange={id => { if (id) onApproveLocationRequest(Number(id)) }}
                        placeholder={t('placeholders.city_assign')}
                      />
                    </Box>
                    <Button
                      type="button"
                      variant="subtle"
                      color="red"
                      loading={locationRequestLoading}
                      onClick={onRejectLocationRequest}
                    >
                      {t('actions.reject_request')}
                    </Button>
                  </Group>
                </Stack>
              </Alert>
            )}

            {/* ── Basic info ──────────────────────────────────────────────────── */}
            <MantineFormSection id="section-identity" title={t('sections.basic_info')}>
              <Stack gap="md">
                {isCreate ? (
                  <FieldRow label={t('fields.email_create')} htmlFor="admin-user-email" editing>
                    <TextInput
                      id="admin-user-email"
                      type="email"
                      value={createEmail}
                      onChange={e => onCreateEmailChange(e.target.value)}
                      placeholder="user@example.com"
                      error={createEmailError}
                    />
                  </FieldRow>
                ) : (
                  <FieldRow label={t('fields.email')} editing={false}>
                    <Stack gap={0}>
                      <Group gap="xs" wrap="wrap">
                        <Text size="sm" fw={500} truncate="end" title={email}>
                          {email}
                        </Text>
                        {emailConfirmedAt !== undefined && (
                          <Badge variant="light" color={emailConfirmedAt ? 'green' : 'yellow'}>
                            {emailConfirmedAt ? t('fields.email_confirmed') : t('fields.email_not_confirmed')}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {t('fields.email_immutable')}
                      </Text>
                    </Stack>
                  </FieldRow>
                )}
                <FieldRow label={t('fields.first_name')} htmlFor="admin-user-first-name" editing={editing}>
                  {editing ? (
                    <TextInput
                      id="admin-user-first-name"
                      value={values.firstName}
                      onChange={e => onFieldChange('firstName', e.target.value)}
                      placeholder={t('placeholders.first_name')}
                      error={errors.firstName}
                    />
                  ) : (
                    <ViewValue>{user?.name}</ViewValue>
                  )}
                </FieldRow>
                <FieldRow label={t('fields.last_name')} htmlFor="admin-user-last-name" editing={editing}>
                  {editing ? (
                    <TextInput
                      id="admin-user-last-name"
                      value={values.lastName}
                      onChange={e => onFieldChange('lastName', e.target.value)}
                      placeholder={t('placeholders.last_name')}
                      error={errors.lastName}
                    />
                  ) : (
                    <ViewValue>{user?.last_name}</ViewValue>
                  )}
                </FieldRow>
                {/* Profile type is read-only here; it is edited in the sidebar Role & status card. */}
                <FieldRow label={profileTypeLabel} editing={false}>
                  <ViewValue>{PROFILE_TYPE_LABELS[values.profileType]}</ViewValue>
                </FieldRow>
              </Stack>
            </MantineFormSection>

            {/* ── Contact ─────────────────────────────────────────────────────── */}
            <MantineFormSection title={t('sections.contact')}>
              <Stack gap="md">
                <FieldRow label={t('fields.phone')} labelId="admin-user-phone-label" editing={editing}>
                  {editing ? (
                    <PhoneField value={phoneE164} onChange={onPhoneChange} error={errors.phone} />
                  ) : (
                    <ViewValue>{user?.phone}</ViewValue>
                  )}
                </FieldRow>
                <FieldRow label={t('fields.whatsapp')} labelId="admin-user-whatsapp-label" editing={editing}>
                  {editing ? (
                    <Stack gap="sm">
                      <Checkbox
                        label={t('fields.use_main_phone')}
                        checked={values.useMainPhone}
                        onChange={e => onFieldChange('useMainPhone', e.currentTarget.checked)}
                      />
                      {!values.useMainPhone && (
                        <PhoneField value={whatsappE164} onChange={onWhatsappChange} error={errors.whatsapp} />
                      )}
                    </Stack>
                  ) : (
                    <ViewValue>{user?.whatsapp}</ViewValue>
                  )}
                </FieldRow>
              </Stack>
            </MantineFormSection>

            {/* ── Location ────────────────────────────────────────────────────── */}
            <MantineFormSection
              id="section-location"
              title={isBusiness ? t('sections.location_work') : t('sections.location_home')}
            >
              <Stack gap="md">
                <FieldRow label={t('fields.city')} labelId="admin-user-city-label" editing={editing}>
                  {editing ? (
                    <LocationCombobox
                      locations={cities}
                      value={values.locationId ? String(values.locationId) : ''}
                      onChange={id => onFieldChange('locationId', (id ? Number(id) : undefined) as unknown as number)}
                      error={errors.locationId}
                      placeholder={t('placeholders.city_search')}
                      regions={isAdmin ? regions : undefined}
                      onAddLocation={isAdmin ? onAddLocation : undefined}
                    />
                  ) : (
                    <Stack gap={0}>
                      <ViewValue>{user?.location?.name_al}</ViewValue>
                      {user?.location?.parent?.name_al && (
                        <Text size="xs" c="dimmed">
                          {user.location.parent.name_al}
                        </Text>
                      )}
                    </Stack>
                  )}
                </FieldRow>
                {editing && regionName && (
                  <FieldRow label={t('fields.region')} editing={false}>
                    <Text size="sm" c="dimmed">
                      {regionName} {t('actions.region_auto')}
                    </Text>
                  </FieldRow>
                )}
              </Stack>
            </MantineFormSection>

            {/* ── Business (agent / developer) ────────────────────────────────── */}
            {(isBusiness || (mode === 'view' && user && ['agent', 'developer'].includes(profileTypeFromUser(user)))) && (
              <MantineFormSection id="section-business" title={t('sections.company')}>
                <Stack gap="md">
                  <FieldRow label={t('fields.company_name')} htmlFor="admin-user-company-name" editing={editing}>
                    {editing ? (
                      <TextInput
                        id="admin-user-company-name"
                        value={values.companyName ?? ''}
                        onChange={e => onFieldChange('companyName', e.target.value)}
                        placeholder={t('placeholders.company_name')}
                        error={errors.companyName}
                      />
                    ) : (
                      <ViewValue>{user?.company_name}</ViewValue>
                    )}
                  </FieldRow>
                  <FieldRow label={t('fields.website')} htmlFor="admin-user-website" editing={editing}>
                    {editing ? (
                      <TextInput
                        id="admin-user-website"
                        value={values.website ?? ''}
                        onChange={e => onFieldChange('website', e.target.value)}
                        placeholder={t('placeholders.website')}
                        error={errors.website}
                      />
                    ) : (
                      <ViewValue>
                        {user?.website ? (
                          <Anchor href={user.website} target="_blank" rel="noopener noreferrer" size="sm" truncate="end">
                            {user.website}
                          </Anchor>
                        ) : undefined}
                      </ViewValue>
                    )}
                  </FieldRow>
                  <FieldRow label={t('fields.position')} htmlFor="admin-user-position" editing={editing}>
                    {editing ? (
                      <TextInput
                        id="admin-user-position"
                        value={values.position ?? ''}
                        onChange={e => onFieldChange('position', e.target.value)}
                        placeholder={t('placeholders.position')}
                      />
                    ) : (
                      <ViewValue>{user?.position}</ViewValue>
                    )}
                  </FieldRow>
                  <FieldRow label={t('fields.year_started')} htmlFor="admin-user-year-started" editing={editing}>
                    {editing ? (
                      <TextInput
                        id="admin-user-year-started"
                        type="number"
                        min={1900}
                        max={currentYear}
                        placeholder="2015"
                        value={values.yearStarted == null || Number.isNaN(values.yearStarted) ? '' : values.yearStarted}
                        onChange={e => onFieldChange('yearStarted', e.target.valueAsNumber)}
                        error={errors.yearStarted}
                      />
                    ) : (
                      <ViewValue>{user?.year_started?.toString()}</ViewValue>
                    )}
                  </FieldRow>
                </Stack>
              </MantineFormSection>
            )}

            {/* ── Password info (create mode only) ────────────────────────────── */}
            {isCreate && (
              <Alert color="gray" variant="light" title={t('password_info.title')}>
                <Stack gap="xs">
                  <Text size="xs">{t('password_info.body')}</Text>
                  <Stack gap={0}>
                    <Text size="xs">{t('password_info.rule_length')}</Text>
                    <Text size="xs">{t('password_info.rule_case')}</Text>
                    <Text size="xs">{t('password_info.rule_digits')}</Text>
                    <Text size="xs">{t('password_info.rule_special')}</Text>
                  </Stack>
                </Stack>
              </Alert>
            )}

            {/* ── Change history (never in create mode) ───────────────────────── */}
            {!isCreate && changeLog.length > 0 && (
              <MantineFormSection
                title={t('sections.change_log')}
                headerAction={canClearHistory ? <ClearAllButton source="user_change_log" onClear={onClearHistory} /> : undefined}
              >
                <Stack gap="sm">
                  {changeLog.map(entry => (
                    <HistoryRow
                      key={entry.id}
                      id={entry.id}
                      source="user_change_log"
                      date={changeLogDates?.[entry.id] ?? formatDateTime(entry.changed_at, locale)}
                      from={PROFILE_TYPE_LABELS[entry.old_value as ProfileType] ?? entry.old_value ?? ''}
                      to={PROFILE_TYPE_LABELS[entry.new_value as ProfileType] ?? entry.new_value ?? ''}
                      canClear={canClearHistory}
                      onClearRow={onClearHistoryRow}
                    />
                  ))}
                </Stack>
              </MantineFormSection>
            )}

            {/* ── Status history (never in create mode) ───────────────────────── */}
            {!isCreate && statusHistory.length > 0 && (
              <MantineFormSection
                title={t('sections.status_history')}
                headerAction={canClearHistory ? <ClearAllButton source="user_status_history" onClear={onClearHistory} /> : undefined}
              >
                <Stack gap="sm">
                  {statusHistory.slice(0, 10).map(entry => (
                    <HistoryRow
                      key={entry.id}
                      id={entry.id}
                      source="user_status_history"
                      date={statusHistoryDates?.[entry.id] ?? formatDateTime(entry.changed_at, locale)}
                      from={entry.old_status ? t(`statuses.${entry.old_status}` as Parameters<typeof t>[0]) : '—'}
                      to={t(`statuses.${entry.new_status}` as Parameters<typeof t>[0])}
                      reason={entry.reason}
                      canClear={canClearHistory}
                      onClearRow={onClearHistoryRow}
                    />
                  ))}
                </Stack>
              </MantineFormSection>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md" pos={{ base: 'static', lg: 'sticky' }} top={{ lg: theme.other.layout.adminTopBarHeight }}>
            {mode === 'view' ? sidebarView : sidebarEdit}
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
