'use client'

import type { ReactNode } from 'react'
import { Avatar, Text, Group, Stack, Paper, Divider, Button, Flex, ThemeIcon, useMantineTheme } from '@mantine/core'
import { Phone, MessageCircle, Share2, CheckCircle, UserX, LogIn } from 'lucide-react'

export interface MantineListingContactAgent {
  name: string
  avatarUrl?: string | null
  /** Fallback initials shown when `avatarUrl` is absent (e.g. "EH"). */
  initials?: string
  isVerified?: boolean
  /** Company name (agent) or "Private person" (owner) — already translated. */
  subtitle?: string
}

export interface MantineListingContactPriceInfo {
  price: string
  originalPrice?: string
  originalPriceLabel?: string
}

export type MantineListingContactState = 'normal' | 'guestCta' | 'ownerDeleted' | 'ownerUnavailable' | 'closedListing'

export interface MantineListingContactLabels {
  verified: string
  call: string
  whatsapp: string
  share: string
  inquiry: string
  report: string
  loginCta: string
  guestTitle: string
  guestDesc: string
  deletedTitle: string
  deletedDesc: string
  unavailableDesc: string
  closedLabel: string
  favoriteAriaAdd: string
}

export interface MantineListingContactPatternProps {
  /** @default 'normal' */
  state?: MantineListingContactState
  agent: MantineListingContactAgent
  price: MantineListingContactPriceInfo
  labels: MantineListingContactLabels
  hasPhone?: boolean
  hasWhatsapp?: boolean
  onCall?: () => void
  onWhatsApp?: () => void
  onShare?: () => void
  onLogin?: () => void
  /** Real `FavoriteButton` (app) / demo heart (story) — positioned node, hook-free split. */
  favorite?: ReactNode
  /** Real inquiry-dialog trigger (app) / demo trigger (story) — positioned node. */
  inquiryTrigger?: ReactNode
  /** Real report-dialog trigger (app) / demo trigger (story) — positioned node. */
  reportTrigger?: ReactNode
}

/**
 * Canonical listing-detail contact-card pattern (Task 616 D2) — ALL Mantine, its own story.
 * Content mirrors `ListingContact.tsx`'s desktop sticky sidebar; `favorite`/`inquiryTrigger`/
 * `reportTrigger` are passed as positioned nodes (Task 605 hook-free split) so this pattern
 * never imports the real stateful dialogs/actions. Preserves the Task 615 CTA fix
 * (`Flex direction={{base:'column',sm:'row'}}` + per-button `flex:1 minWidth:0` + wrapping
 * `<span>` so long uk/it labels wrap instead of overflowing) and the sticky positioning
 * (`position:'sticky', top:80`).
 */
export function MantineListingContactPattern({
  state = 'normal',
  agent,
  price,
  labels,
  hasPhone = true,
  hasWhatsapp = true,
  onCall,
  onWhatsApp,
  onShare,
  onLogin,
  favorite,
  inquiryTrigger,
  reportTrigger,
}: MantineListingContactPatternProps) {
  const theme = useMantineTheme()
  const dimmed = state === 'ownerDeleted' || state === 'guestCta' || state === 'ownerUnavailable'

  return (
    <Paper withBorder p="lg" style={{ position: 'sticky', top: 80 }}>
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" style={dimmed ? { opacity: 0.5 } : undefined}>
          <Avatar src={state === 'ownerDeleted' ? null : agent.avatarUrl} radius="xl" size="lg" color="brand">
            {state === 'ownerDeleted' ? <UserX size={theme.other.iconSize.roomy} /> : agent.initials}
          </Avatar>
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={6} wrap="nowrap">
              <Text fw={600} size="sm" truncate>
                {agent.name}
              </Text>
              {!dimmed && agent.isVerified && (
                <CheckIconBadge label={labels.verified} />
              )}
            </Group>
            {agent.subtitle && (
              <Text size="xs" c="dimmed" truncate>
                {agent.subtitle}
              </Text>
            )}
          </Stack>
        </Group>

        <Divider />

        <Stack gap={2}>
          <Text fw={700} size="xl" c="brand">
            {price.price}
          </Text>
          {price.originalPrice && (
            <Text size="xs" c="dimmed" td="line-through">
              {price.originalPriceLabel}: {price.originalPrice}
            </Text>
          )}
        </Stack>

        <Divider />

        {state === 'ownerDeleted' && (
          <NoticeBox icon={<UserX size={theme.other.iconSize.roomy} />} title={labels.deletedTitle} desc={labels.deletedDesc} />
        )}

        {state === 'ownerUnavailable' && (
          <NoticeBox icon={<UserX size={theme.other.iconSize.roomy} />} desc={labels.unavailableDesc} />
        )}

        {state === 'guestCta' && (
          <Stack gap="sm">
            <NoticeBox icon={<LogIn size={theme.other.iconSize.roomy} />} title={labels.guestTitle} desc={labels.guestDesc} />
            <Button color="brand" fullWidth onClick={onLogin} leftSection={<LogIn size={theme.other.iconSize.standard} />}>
              {labels.loginCta}
            </Button>
          </Stack>
        )}

        {state === 'closedListing' && (
          <Button color="gray" variant="light" fullWidth disabled title={labels.closedLabel}>
            {labels.closedLabel}
          </Button>
        )}

        {state === 'normal' && (hasPhone || hasWhatsapp) && (
          <Flex direction={{ base: 'column', sm: 'row' }} gap="sm">
            {hasPhone && (
              <Button
                color="brand"
                onClick={onCall}
                leftSection={<Phone size={theme.other.iconSize.comfortable} />}
                style={{ flex: 1, minWidth: 0 }}
                styles={{ inner: { minWidth: 0 }, label: { minWidth: 0 } }}
              >
                <span style={{ minWidth: 0, display: 'block' }}>{labels.call}</span>
              </Button>
            )}
            {hasWhatsapp && (
              <Button
                color="green"
                onClick={onWhatsApp}
                leftSection={<MessageCircle size={theme.other.iconSize.comfortable} />}
                style={{ flex: 1, minWidth: 0 }}
                styles={{ inner: { minWidth: 0 }, label: { minWidth: 0 } }}
              >
                <span style={{ minWidth: 0, display: 'block' }}>{labels.whatsapp}</span>
              </Button>
            )}
          </Flex>
        )}

        {state === 'normal' && inquiryTrigger}

        {/* Share is the single real CTA in this row — full-width alone (P0 mobile gate,
            Task 724). A fixed-width sibling icon in the same row made `flex:1` mathematically
            unable to satisfy the gate, which compares against the Group's FULL content width,
            not "remaining space after the icon" (measured deficit 46px, R8-geometry-probe). */}
        {state === 'normal' && (
          <Button
            variant="default"
            onClick={onShare}
            leftSection={<Share2 size={theme.other.iconSize.standard} />}
            fullWidth
          >
            {labels.share}
          </Button>
        )}

        {/* Favorite (icon-only ActionIcon — not a `.mantine-Button-root`, so clause 11's
            full-width check never applies to it) gets its own compact row, same `Group
            justify="flex-end"` container this pattern used for `reportTrigger` alone before
            Task 724 (no new chrome). 724R review F6: no TailAdmin reference row exists for this
            exact favorite-icon placement — clause-16a stop, documented in the 724R session log
            V7/AV7; not a blocker since no new visual chrome (color/spacing/radius/shadow) is
            introduced, only the pre-existing Group primitive. */}
        {state === 'normal' && favorite && (
          <Group justify="flex-end">
            {favorite}
          </Group>
        )}

        {/* Report listing — real full-width fix (724R V2 route a), same Mantine mechanism as
            Share above (docs/mantine-responsive-design-system.md:622,
            MantineResponsiveActionFooter.tsx:47-78): the consumer-supplied `reportTrigger` node
            sets its own `fullWidth`, same as `inquiryTrigger`'s established convention in this
            file's story. Pre-724 baseline already gave Report its own row
            (`Group justify="flex-end"`); this restores that row and only changes the child's
            width behavior — no new chrome. */}
        {state === 'normal' && reportTrigger && (
          <Group justify="flex-end">
            {reportTrigger}
          </Group>
        )}
      </Stack>
    </Paper>
  )
}

function CheckIconBadge({ label }: { label: string }) {
  const theme = useMantineTheme()
  return (
    <ThemeIcon size="sm" radius="xl" color="brand" variant="light" aria-label={label}>
      <CheckCircle size={theme.other.iconSize.badge} />
    </ThemeIcon>
  )
}

function NoticeBox({ icon, title, desc }: { icon: ReactNode; title?: string; desc: string }) {
  return (
    <Paper radius="lg" p="md" bg="gray.0" style={{ textAlign: 'center' }}>
      <Stack gap="xs" align="center">
        <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
          {icon}
        </ThemeIcon>
        {title && (
          <Text size="sm" fw={600}>
            {title}
          </Text>
        )}
        <Text size="xs" c="dimmed">
          {desc}
        </Text>
      </Stack>
    </Paper>
  )
}
