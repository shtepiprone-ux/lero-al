/**
 * Story fixture for the dashboard period patterns (Task 846) — shared by
 * `Patterns/Mantine/DashboardHeader` and `Patterns/Mantine/DashboardPeriodControl`.
 *
 * Deterministic: `DASHBOARD_PERIOD_NOW` is a frozen instant (no Date.now()), so "yesterday" in
 * Europe/Tirane is always 2026-09-17 in every render. All text resolves through `storyT`, so the
 * toolbar locale drives it.
 */
import { storyT } from '@/stories/_storyI18n'
import type { DashboardPeriodControlLabels } from '@/design-system/mantine/patterns/MantineDashboardPeriodControl'

/** 2026-09-18 10:00 in Tirane (CEST) — yesterday, the last selectable day, is 2026-09-17. */
export const DASHBOARD_PERIOD_NOW = '2026-09-18T08:00:00Z'

export function dashboardPeriodLabels(locale: string): DashboardPeriodControlLabels {
  const t = (key: string) => storyT(locale, `dashboard.period.${key}`)
  return {
    label7d: t('label_7d'),
    label30d: t('label_30d'),
    labelCustom: t('label_custom'),
    rangePlaceholder: t('range_placeholder'),
    scopeLabel: t('scope_label'),
    errors: {
      end_after_yesterday: t('error_end_after_yesterday'),
      start_after_end: t('error_start_after_end'),
      longer_than_90_days: t('error_longer_than_90_days'),
      invalid_date: t('error_invalid_date'),
    },
  }
}
