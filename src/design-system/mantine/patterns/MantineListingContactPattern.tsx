'use client'

import type { ReactNode } from 'react'
import { Avatar, Text, Group, Stack, Paper, Divider, Button, Flex, Box, ThemeIcon, useMantineTheme } from '@mantine/core'
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
  /** Real inquiry-dialog trigger (app) / demo trigger (story) — positioned node. */
  inquiryTrigger?: ReactNode
  /** Real report-dialog trigger (app) / demo trigger (story) — positioned node. */
  reportTrigger?: ReactNode
}

/**
 * Canonical listing-detail contact-card pattern (Task 616 D2) — ALL Mantine, its own story.
 * Content mirrors `ListingContact.tsx`'s desktop sticky sidebar; `inquiryTrigger`/`reportTrigger`
 * are passed as positioned nodes (Task 605 hook-free split) so this pattern never imports the
 * real stateful dialogs/actions. Preserves the Task 615 CTA fix (per-button `flex:1 minWidth:0`
 * + wrapping `<span>` so long uk/it labels wrap instead of overflowing) and the sticky positioning.
 * Task 784 D69-25 (owner instruction, 2026-09-04): favorite moved out of this card entirely —
 * `MantineListingDetailPattern` now owns it directly, always in its badges row, at every
 * breakpoint (previously split between here and the badges row by viewport; see that
 * component's own comment for the current placement contract).
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
  inquiryTrigger,
  reportTrigger,
}: MantineListingContactPatternProps) {
  const theme = useMantineTheme()
  const dimmed = state === 'ownerDeleted' || state === 'guestCta' || state === 'ownerUnavailable'

  return (
    // Task 784 Revision 5 (D69-20): the Revision 3 `styles={{root:{'@media...':{...}}}}` block
    // emitted no CSS (Mantine resolves `styles` keys as properties/selectors, never as
    // `@media` at-rules — see docs/sessions/evidence/task784/d69-19-browser/
    // styles-prop-media-query-defect-proof.md), silently reverting this Paper to always-static and
    // regressing the pre-Task-784 `HEAD` behavior (`style={{position:'sticky', top:80}}`, working
    // but ungated). Fixed via Mantine's native responsive Box style props (`pos`/`top`), which do
    // emit real `@media` rules keyed off `theme.breakpoints.lg` — position `static` below the
    // gate, `sticky` at `lg`, offset sourced only from theme.other.layout.listingContactStickyOffset.
    <Paper
      withBorder
      p="lg"
      pos={{ base: 'static', lg: 'sticky' }}
      top={{ lg: theme.other.layout.listingContactStickyOffset }}
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" style={dimmed ? { opacity: 0.5 } : undefined}>
          <Avatar src={state === 'ownerDeleted' ? null : agent.avatarUrl} radius="xl" size="lg" color="brand">
            {state === 'ownerDeleted' ? <UserX size={theme.other.iconSize.roomy} /> : agent.initials}
          </Avatar>
          <Stack gap="micro" style={{ flex: 1, minWidth: 0 }}>
            <Group gap="compact" wrap="nowrap">
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

        <Stack gap="micro">
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

        {/* Task 784 D69-22 (owner instruction, 2026-09-04): row from xs2 (480px) while the panel
            is full-width (D69-21's Grid fix stacks it below md=768px). At md and above the panel
            becomes a narrow Grid sidebar (~245-330px) — row there re-wraps the longest uk label
            (measured), so direction reverts to column until the sidebar is wide enough again,
            confirmed only from xl (1280px, 416px sidebar) in both it and uk. */}
        {state === 'normal' && (hasPhone || hasWhatsapp) && (
          <Flex direction={{ base: 'column', xs2: 'row', md: 'column', xl: 'row' }} gap="sm">
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

        {/* Task 784 D69-24 (owner instruction, 2026-09-04): "Send message" and "Share" share one
            row now, same mechanism and breakpoint gate as the Call/WhatsApp row above (D69-22).
            Share's prior "full-width alone" note (Task 724, R8-geometry-probe) was about a
            FIXED-WIDTH icon sibling, whose deficit math doesn't apply to a same-shaped sibling
            Button here — `inquiryTrigger` is an opaque consumer-supplied node that sets its own
            `fullWidth` internally (hook-free split, Task 605); wrapping it in a `flex:1,
            minWidth:0` container lets that internal `fullWidth` fill the container's share of the
            row instead of the whole panel, same as Share's own `flex:1` below. */}
        {state === 'normal' && (
          <Flex direction={{ base: 'column', xs2: 'row', md: 'column', xl: 'row' }} gap="sm">
            <Box style={{ flex: 1, minWidth: 0 }}>{inquiryTrigger}</Box>
            <Button
              variant="default"
              onClick={onShare}
              leftSection={<Share2 size={theme.other.iconSize.standard} />}
              style={{ flex: 1, minWidth: 0 }}
              styles={{ inner: { minWidth: 0 }, label: { minWidth: 0 } }}
            >
              <span style={{ minWidth: 0, display: 'block' }}>{labels.share}</span>
            </Button>
          </Flex>
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
