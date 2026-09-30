import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useRef, useState } from 'react'
import {
  AdminUserProfileView,
  profileTypeFromUser,
  type AdminUserProfileErrors,
  type AdminUserProfileFormValues,
  type AdminUserProfileMode,
  type UserWithLocation,
} from '@/components/admin/AdminUserProfileView'
import { AdminUserAvatarFieldView } from '@/components/admin/AdminUserAvatarFieldView'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { storyT } from '@/stories/_storyI18n'
import {
  FIXTURE_CHANGE_LOG,
  FIXTURE_CITIES,
  FIXTURE_PROFILE_USER,
  FIXTURE_PROFILE_USER_AGENT,
  FIXTURE_PROFILE_USER_BLOCKED,
  FIXTURE_PROFILE_USER_LOCATION_REQUEST,
  FIXTURE_PROFILE_USER_PRIVATE,
  FIXTURE_REGIONS,
  FIXTURE_STATUS_HISTORY,
} from '@/stories/fixtures/admin.fixtures'

// Task 893 (R5) — presentational View of `/admin/users/[id]` and `/admin/users/new` (Container/Presentational
// split of `AdminUserProfile`). GR-3a: CREATE — only the legacy `Admin/AdminUserProfile` Story existed, and it
// rendered the legacy component (retired by this task). The View is props-only: this Story owns the form values in
// local state and every server-bound callback is a no-op. Users, cities, histories and the pre-formatted dates are
// labelled fixture data; the avatar slot renders the real `AdminUserAvatarFieldView` (its own Story covers the
// upload states); validation and error texts come from the product `admin.user_profile` messages.
// Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminUserProfileView> = {
  title: 'Patterns/Mantine/AdminUserProfileView',
  component: AdminUserProfileView,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Admin user profile: header card, `MantineFormSection` cards (basic info, contact, location, company, histories) and a sticky sidebar (actions, account status / role and status). The confirmation dialogs are the separate `AdminUserProfileDialogsView`.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminUserProfileView>

const FIXTURE_CHANGE_LOG_DATES = { 'chg-001': '05 Mar 2026, 11:00' }
const FIXTURE_STATUS_HISTORY_DATES = { 'sth-001': '10 Apr 2026, 08:45', 'sth-002': '01 May 2026, 16:00' }

function valuesFromUser(user: UserWithLocation | null): AdminUserProfileFormValues {
  if (!user) {
    return {
      firstName: '', lastName: '', profileType: 'private', phone: '', useMainPhone: false, whatsapp: '',
      locationId: undefined as unknown as number, companyName: '', website: '', position: '', yearStarted: undefined,
      status: 'active', blockReason: '', suspendedUntil: null,
    }
  }
  return {
    firstName: user.name ?? '',
    lastName: user.last_name ?? '',
    profileType: profileTypeFromUser(user),
    phone: user.phone ?? '',
    useMainPhone: !!(user.phone && user.phone === user.whatsapp),
    whatsapp: user.whatsapp ?? '',
    locationId: user.location_id ?? (undefined as unknown as number),
    companyName: user.company_name ?? '',
    companyLogoUrl: user.company_logo_url ?? '',
    website: user.website ?? '',
    position: user.position ?? '',
    yearStarted: user.year_started ?? undefined,
    status: user.status ?? 'active',
    blockReason: user.block_reason ?? '',
    suspendedUntil: user.suspended_until ?? null,
  }
}

interface ProfileDemoProps {
  mode: AdminUserProfileMode
  user: UserWithLocation | null
  isAdmin?: boolean
  canClearHistory?: boolean
  errors?: AdminUserProfileErrors
  saveError?: string | null
  saving?: boolean
  isDirty?: boolean
  /** Overrides the values derived from `user` (an edit state that differs from the stored profile). */
  valuesOverride?: Partial<AdminUserProfileFormValues>
  locationRequestLoading?: boolean
}

function ProfileDemo({
  mode,
  user,
  isAdmin = true,
  canClearHistory = true,
  errors = {},
  saveError = null,
  saving = false,
  isDirty = false,
  valuesOverride,
  locationRequestLoading = false,
}: ProfileDemoProps) {
  const [values, setValues] = useState<AdminUserProfileFormValues>({ ...valuesFromUser(user), ...valuesOverride })
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? '')
  const [createEmail, setCreateEmail] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  return (
    <StoryPageGutter>
      <AdminUserProfileView
        mode={mode}
        user={user}
        email={user ? 'arben@example.com' : ''}
        emailConfirmedAt={user ? '2026-01-15T09:00:00Z' : undefined}
        cities={FIXTURE_CITIES}
        regions={FIXTURE_REGIONS}
        changeLog={mode === 'create' ? [] : FIXTURE_CHANGE_LOG}
        statusHistory={mode === 'create' ? [] : FIXTURE_STATUS_HISTORY}
        isAdmin={isAdmin}
        canClearHistory={canClearHistory}
        changeLogDates={FIXTURE_CHANGE_LOG_DATES}
        statusHistoryDates={FIXTURE_STATUS_HISTORY_DATES}
        suspendedUntilFormatted={user?.suspended_until ? '31 Dec 2026' : null}
        values={values}
        errors={errors}
        onFieldChange={(field, value) => setValues(prev => ({ ...prev, [field]: value }))}
        phoneE164={phone}
        whatsappE164={whatsapp}
        onPhoneChange={v => setPhone(v.e164)}
        onWhatsappChange={v => setWhatsapp(v.e164)}
        createEmail={createEmail}
        createEmailError={null}
        onCreateEmailChange={setCreateEmail}
        saving={saving}
        saveError={saveError}
        isDirty={isDirty}
        avatar={
          <AdminUserAvatarFieldView
            imageUrl={user?.avatar_url ?? null}
            canEdit={mode !== 'view'}
            busy={false}
            showRemove
            showOptionalHint={mode === 'create'}
            error={null}
            inputRef={avatarInputRef}
            onPick={() => {}}
            onFileChange={() => {}}
            onRemove={() => {}}
          />
        }
        locationRequestLoading={locationRequestLoading}
        onApproveLocationRequest={() => {}}
        onRejectLocationRequest={() => {}}
        onBack={() => {}}
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDeactivate={() => {}}
        onReactivate={() => {}}
        onDelete={() => {}}
        onClearHistory={() => {}}
        onClearHistoryRow={() => {}}
      />
    </StoryPageGutter>
  )
}

export const View: Story = { render: () => <ProfileDemo mode="view" user={FIXTURE_PROFILE_USER_PRIVATE} /> }

export const ViewBlocked: Story = { render: () => <ProfileDemo mode="view" user={FIXTURE_PROFILE_USER_BLOCKED} /> }

export const ViewAgent: Story = { render: () => <ProfileDemo mode="view" user={FIXTURE_PROFILE_USER_AGENT} /> }

export const ViewLocationRequest: Story = {
  render: () => <ProfileDemo mode="view" user={FIXTURE_PROFILE_USER_LOCATION_REQUEST} />,
}

export const ViewNoHistoryControls: Story = {
  render: () => <ProfileDemo mode="view" user={FIXTURE_PROFILE_USER_PRIVATE} isAdmin={false} canClearHistory={false} />,
}

export const Edit: Story = { render: () => <ProfileDemo mode="edit" user={FIXTURE_PROFILE_USER_PRIVATE} isDirty /> }

export const EditBlocked: Story = {
  render: () => <ProfileDemo mode="edit" user={FIXTURE_PROFILE_USER_BLOCKED} isDirty />,
}

export const EditErrors: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <ProfileDemo
        mode="edit"
        user={FIXTURE_PROFILE_USER_AGENT}
        isDirty
        valuesOverride={{ firstName: '', companyName: '', locationId: undefined as unknown as number }}
        errors={{
          firstName: storyT(locale, 'admin.user_profile.validation.firstName_required'),
          locationId: storyT(locale, 'admin.user_profile.validation.location_required'),
          companyName: storyT(locale, 'admin.user_profile.validation.company_name_required'),
        }}
        saveError={storyT(locale, 'admin.user_profile.feedback.save_error')}
      />
    )
  },
}

export const Create: Story = { render: () => <ProfileDemo mode="create" user={null} /> }

export const Saving: Story = {
  render: () => <ProfileDemo mode="edit" user={FIXTURE_PROFILE_USER} isDirty saving />,
}
