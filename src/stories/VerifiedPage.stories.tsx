/**
 * Storybook stories for the /auth/verified page card (Task 446).
 *
 * Three state stories (Success / ErrorState / SyncFail) + one LocaleStress export.
 * All stories are toolbar-reactive (no globals.locale pin) — the harness iterates
 * LOCALES × VIEWPORTS automatically for every ASSERT_STORIES entry.
 *
 * CTA is a <Link> styled with buttonVariants({ size: 'xl' }) + w-full — full-width
 * at every breakpoint. It does not carry data-slot="button" so gate (d) does not
 * apply; the proof is gate (a) (no h-scroll) + visible PNGs across 320/375/390.
 * Card container (max-w-sm w-full, content card) is exempt from the bottom-sheet
 * rule (design-system.md §26) — no overlay/popup on this page.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from './_storyI18n'
import { VerifiedCard } from '@/app/[locale]/auth/verified/VerifiedCard'

const meta: Meta = {
  title: 'Auth/VerifiedPage',
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj

export const Success: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'sq'
    return (
      <VerifiedCard
        variant="success"
        title={storyT(locale, 'auth.verified_title')}
        body={storyT(locale, 'auth.verified_body')}
        ctaLabel={storyT(locale, 'auth.verified_browse')}
        ctaHref={`/${locale}/listings`}
      />
    )
  },
}

export const ErrorState: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'sq'
    return (
      <VerifiedCard
        variant="error"
        title={storyT(locale, 'auth.verified_error_title')}
        body={storyT(locale, 'auth.verified_error_body')}
        ctaLabel={storyT(locale, 'auth.login')}
        ctaHref={`/${locale}/auth/login`}
      />
    )
  },
}

export const SyncFail: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'sq'
    return (
      <VerifiedCard
        variant="syncfail"
        title={storyT(locale, 'auth.verified_error_title')}
        body={storyT(locale, 'auth.verified_nosession_body')}
        ctaLabel={storyT(locale, 'auth.login')}
        ctaHref={`/${locale}/auth/login`}
      />
    )
  },
}

export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'sq'
    return (
      <VerifiedCard
        variant="error"
        title={storyT(locale, 'auth.verified_error_title')}
        body={storyT(locale, 'auth.verified_error_body')}
        ctaLabel={storyT(locale, 'auth.login')}
        ctaHref={`/${locale}/auth/login`}
      />
    )
  },
  globals: {
    viewport: { value: 'mobile320', isRotated: false },
  },
}
