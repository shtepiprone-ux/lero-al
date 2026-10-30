'use client'

import { useTranslations } from 'next-intl'
import { ShieldWarningIcon, UserIcon } from '@solar-icons/react/broken'
import { Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { MantineCombobox, type MantineComboboxOption } from '@/design-system/mantine/patterns/MantineCombobox'
import type { PickerUser } from '@/components/admin/AdminSupportManager'
import type { UserRole, UserStatus } from '@/types/database'

export type UserPickerIcon = 'user' | 'shield'

export interface UserPickerFieldViewProps {
  label: string
  icon: UserPickerIcon
  value: PickerUser | null
  onClear: () => void
  query: string
  onQueryChange: (query: string) => void
  results: PickerUser[]
  /** Kept for the container's contract: `MantineCombobox` owns its own open state (focus, click, typing). */
  open?: boolean
  isSearching: boolean
  onSelect: (user: PickerUser) => void
  error?: string
  placeholder?: string
}

function pickerUserName(user: PickerUser): string | null {
  return [user.name, user.last_name].filter(Boolean).join(' ') || null
}

/**
 * Presentational View of the support/complaint user picker (Task 859, Container/Presentational split of
 * `UserPickerField`; Revision 2 R27). It renders the canonical searchable `MantineCombobox`
 * (`Mantine/Primitives/Combobox`): the typed text goes to the container's debounced server search through
 * `onInputChange`, the results are the options (name, phone or short id, role and status badges), and the
 * selected user is the combobox value with its pinned clear row. `useTranslations` / `useMantineTheme` only: no
 * search, debounce or server action.
 */
export function UserPickerFieldView({
  label,
  icon,
  value,
  onClear,
  query,
  onQueryChange,
  results,
  isSearching,
  onSelect,
  error,
  placeholder,
}: UserPickerFieldViewProps) {
  const t = useTranslations('admin.support')
  const tu = useTranslations('admin.users')
  const theme = useMantineTheme()
  const Icon = icon === 'shield' ? ShieldWarningIcon : UserIcon

  const toOption = (user: PickerUser): MantineComboboxOption => ({
    value: user.id,
    label: pickerUserName(user) ?? '—',
    description: user.phone ?? user.id,
    // The server already matched the query (name, e-mail, phone, company); the combobox's own client filter must keep the row.
    searchText: query,
    adornment: (
      <Group gap="xs" wrap="nowrap">
        <MantineBadge variant="status" entity="userRole" value={user.role as UserRole} size="xs">
          {t(`role_${user.role}` as 'role_admin')}
        </MantineBadge>
        {user.status && (
          <MantineBadge variant="status" entity="user" value={user.status as UserStatus} size="xs">
            {tu(`user_status_${user.status}` as 'user_status_active')}
          </MantineBadge>
        )}
      </Group>
    ),
  })

  const options = value ? [toOption(value)] : results.map(toOption)

  const handleChange = (id: string) => {
    if (!id) {
      onClear()
      return
    }
    const user = results.find(u => u.id === id)
    if (user) onSelect(user)
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="nowrap">
        <Icon size={theme.other.iconSize.compact} aria-hidden="true" />
        <Text size="sm" fw={500}>{label}</Text>
      </Group>
      <MantineCombobox
        options={options}
        value={value?.id ?? ''}
        onChange={handleChange}
        onInputChange={onQueryChange}
        placeholder={placeholder}
        icon={<UserIcon size={theme.other.iconSize.compact} aria-hidden="true" />}
        clearLabel={value ? t('aria_clear_selection') : undefined}
        noResultsLabel={isSearching ? t('searching') : t('no_results')}
        triggerAriaLabel={label}
        sheetTitle={label}
        searchPlaceholder={placeholder}
        triggerWidth="100%"
        error={error}
      />
    </Stack>
  )
}
