import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { userEvent } from 'storybook/test'
import { AdminReportsManager } from './AdminReportsManager'
import type { ReportRow } from './AdminReportsManager'

const FIXTURE_REPORT: ReportRow = {
  id: 'r-story-1',
  listing_id: 'l-1',
  user_id: 'u-reporter',
  reason: 'fraud',
  comment: 'Оголошення містить неправдиву інформацію про ціну.',
  status: 'pending',
  created_at: '2026-06-18T10:30:00Z',
  listing: {
    id: 'l-1',
    title: 'Apartament 2+1 në Tiranë',
    slug: 'apartament-2-1-ne-tirane',
    owner: { id: 'u-owner', name: 'Agim Krasniqi', user_type: 'agent' },
  },
  reporter: { id: 'u-reporter', name: 'Blerina Hoxha' },
}

const FIXTURE_REPORTS: ReportRow[] = [
  FIXTURE_REPORT,
  {
    ...FIXTURE_REPORT,
    id: 'r-story-2',
    reason: 'duplicate',
    status: 'resolved',
    comment: null,
    listing: {
      id: 'l-2',
      title: 'Vila me pishinë në Durrës — përballë plazhit',
      slug: 'vila-durres',
      owner: { id: 'u-owner-2', name: 'Driton Berisha', user_type: 'developer' },
    },
    reporter: { id: 'u-reporter-2', name: 'Fatmir Gashi' },
  },
]

const FIXTURE_RESOLVED_REPORT: ReportRow = {
  ...FIXTURE_REPORT,
  id: 'r-story-resolved',
  status: 'resolved',
}

const meta: Meta<typeof AdminReportsManager> = {
  title: 'Admin/AdminReportsManager',
  component: AdminReportsManager,
  tags: ['autodocs'],
  args: { reports: FIXTURE_REPORTS, locale: 'uk', canOverrideReportStatus: false, canDeleteReports: false },
}
export default meta
type Story = StoryObj<typeof AdminReportsManager>

export const Default: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
}

export const Tablet: Story = {
  globals: { viewport: { value: 'tablet768', isRotated: false } },
}

export const LocaleStress: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}

// ── Task 461 AC6 — ReportDetailDialog with owner row at mobile breakpoints ──
// Toolbar-reactive: locale comes from the Storybook locale toolbar, not pinned.
// screenshots:assert sweeps locales (uk@320/375/390 mandatory) per rendered-evidence gate.

const openDialog = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const rows = canvasElement.querySelectorAll('tbody tr')
  if (!rows[0]) throw new Error('No table rows found')
  await userEvent.click(rows[0])
}

export const DialogOwnerRow_Mobile320: Story = {
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: openDialog,
}

export const DialogOwnerRow_Mobile375: Story = {
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  play: openDialog,
}

export const DialogOwnerRow_Mobile390: Story = {
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  play: openDialog,
}

export const DialogOwnerRow_Desktop: Story = {
  globals: { viewport: { value: 'desktop1280', isRotated: false } },
  play: openDialog,
}

// ── Task 463 — Full management controls (status override + reopen + delete) ──

const openPendingDialogWithCaps = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const rows = canvasElement.querySelectorAll('tbody tr')
  if (!rows[0]) throw new Error('No table rows found')
  await userEvent.click(rows[0])
}

export const FullManagement_Mobile320: Story = {
  args: { reports: [FIXTURE_REPORT], canOverrideReportStatus: true, canDeleteReports: true },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: openPendingDialogWithCaps,
}

export const FullManagement_Mobile375: Story = {
  args: { reports: [FIXTURE_REPORT], canOverrideReportStatus: true, canDeleteReports: true },
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  play: openPendingDialogWithCaps,
}

export const FullManagement_Mobile390: Story = {
  args: { reports: [FIXTURE_REPORT], canOverrideReportStatus: true, canDeleteReports: true },
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  play: openPendingDialogWithCaps,
}

// Terminal report with Reopen + Delete

const clickResolvedFilter = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const tabs = canvasElement.querySelectorAll('button')
  let clicked = false
  for (const tab of tabs) {
    if (tab.textContent?.includes('filter_resolved') || tab.textContent?.includes('Resolved') || tab.textContent?.includes('Вирішено') || tab.textContent?.includes('Zgjidhur') || tab.textContent?.includes('Risolte')) {
      await userEvent.click(tab)
      clicked = true
      break
    }
  }
  if (!clicked) throw new Error('Resolved filter tab not found')
  await new Promise(r => setTimeout(r, 100))
  const rows = canvasElement.querySelectorAll('tbody tr')
  if (!rows[0]) throw new Error('No table rows found after switching to resolved filter')
  await userEvent.click(rows[0])
}

export const TerminalReopen_Mobile320: Story = {
  args: { reports: [FIXTURE_RESOLVED_REPORT], canOverrideReportStatus: true, canDeleteReports: true },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: clickResolvedFilter,
}

export const TerminalReopen_Mobile375: Story = {
  args: { reports: [FIXTURE_RESOLVED_REPORT], canOverrideReportStatus: true, canDeleteReports: true },
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  play: clickResolvedFilter,
}

export const TerminalReopen_Mobile390: Story = {
  args: { reports: [FIXTURE_RESOLVED_REPORT], canOverrideReportStatus: true, canDeleteReports: true },
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  play: clickResolvedFilter,
}

// Delete confirmation dialog

const openDeleteConfirm = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const rows = canvasElement.querySelectorAll('tbody tr')
  if (!rows[0]) throw new Error('No table rows found')
  await userEvent.click(rows[0])
  await new Promise(r => setTimeout(r, 300))
  const deleteBtn = canvasElement.querySelector('[data-testid="delete-btn"]') as HTMLElement
  if (!deleteBtn) throw new Error('delete-btn not found in dialog')
  deleteBtn.scrollIntoView({ block: 'center' })
  await new Promise(r => setTimeout(r, 100))
  await userEvent.click(deleteBtn)
}

export const DeleteConfirm_Mobile320: Story = {
  args: { reports: [FIXTURE_REPORT], canOverrideReportStatus: false, canDeleteReports: true },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: openDeleteConfirm,
}

export const DeleteConfirm_Mobile375: Story = {
  args: { reports: [FIXTURE_REPORT], canOverrideReportStatus: false, canDeleteReports: true },
  globals: { viewport: { value: 'mobile375', isRotated: false } },
  play: openDeleteConfirm,
}

export const DeleteConfirm_Mobile390: Story = {
  args: { reports: [FIXTURE_REPORT], canOverrideReportStatus: false, canDeleteReports: true },
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  play: openDeleteConfirm,
}
