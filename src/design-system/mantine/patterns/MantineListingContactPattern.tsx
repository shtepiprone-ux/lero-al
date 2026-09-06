'use client'

import type { ReactNode } from 'react'
import { Avatar, Text, Group, Stack, Paper, Divider, Button, Flex, Box, ThemeIcon, useMantineTheme } from '@mantine/core'
import { Phone, MessageCircle, CheckCircle, UserX, LogIn, Loader2 } from 'lucide-react'

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
  onLogin?: () => void
  /** Task 793 E-B — disables Call/WhatsApp and swaps their icon for a spinner while the
   * click-time contact RPC (`getListingOwnerContact`, Task 266) resolves. Transient, independent
   * of listing lifecycle — see `contactDisabled` for the permanent archived/expired case. */
  loading?: boolean
  /** Task 793 R11 + F2 (owner instructions, 2026-09-06) — disables Call/WhatsApp/Send-message
   * permanently for archived, expired **and** closed (sold/rented) listings (no spinner, unlike
   * `loading`). Orthogonal to `state`: for `closedListing` this composes with the headline block
   * (both render) rather than replacing it — F2 superseded the original kickoff's §3.5b split,
   * under which sold/rented kept Call/WhatsApp active. */
  contactDisabled?: boolean
  /** Shown as each disabled Call/WhatsApp button's `title` when `contactDisabled` is true. */
  contactDisabledLabel?: string
  /** Real inquiry-dialog trigger (app) / demo trigger (story) — positioned node. Rendered only in
   * the `normal` state, matching the pre-migration gate (`ListingContact.tsx`'s `showInquiryTrigger`). */
  inquiryTrigger?: ReactNode
  /** Task 793 E-A — `SaveToCollectionButton` (app) / demo trigger (story), same positioned-node
   * idiom as `inquiryTrigger`. Rendered whenever supplied, independent of `state` — pre-migration
   * `ListingContact.tsx` showed this control regardless of the card's owner-account state, gated
   * only on the listing having an id. */
  saveTrigger?: ReactNode
  /** Real report-dialog trigger (app) / demo trigger (story) — positioned node. Rendered whenever
   * supplied, independent of `state` (same "always regardless of state" contract as `saveTrigger`
   * — pre-migration `ListingContact.tsx` showed Report regardless of owner-account state). */
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
 * Task 793 (owner instruction, 2026-09-06): share followed favorite out of this card into the
 * same badges row — this pattern no longer renders a share button or takes `onShare`/`labels.share`.
 * Renders in normal document flow at every width below `lg` (no consumer-side wrapper needed) —
 * `ListingContact.tsx` deleted its own fixed mobile bar and now renders this pattern unconditionally.
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
  onLogin,
  loading = false,
  contactDisabled = false,
  contactDisabledLabel,
  inquiryTrigger,
  saveTrigger,
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
      data-testid="listing-contact-card"
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
            confirmed only from xl (1280px, 416px sidebar) in both it and uk.
            Task 793 F2 (owner instruction, 2026-09-06): also renders for `closedListing` (sold/
            rented) — composed with, not replaced by, the headline block above — so Call/WhatsApp
            show disabled (via `contactDisabled`) instead of disappearing outright. */}
        {(state === 'normal' || state === 'closedListing') && (hasPhone || hasWhatsapp) && (
          <Flex direction={{ base: 'column', xs2: 'row', md: 'column', xl: 'row' }} gap="sm">
            {hasPhone && (
              <Button
                color="brand"
                onClick={onCall}
                disabled={loading || contactDisabled}
                title={contactDisabled ? contactDisabledLabel : undefined}
                aria-disabled={contactDisabled || undefined}
                leftSection={loading ? <Loader2 size={theme.other.iconSize.comfortable} className="animate-spin" /> : <Phone size={theme.other.iconSize.comfortable} />}
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
                disabled={loading || contactDisabled}
                title={contactDisabled ? contactDisabledLabel : undefined}
                aria-disabled={contactDisabled || undefined}
                leftSection={loading ? <Loader2 size={theme.other.iconSize.comfortable} className="animate-spin" /> : <MessageCircle size={theme.other.iconSize.comfortable} />}
                style={{ flex: 1, minWidth: 0 }}
                styles={{ inner: { minWidth: 0 }, label: { minWidth: 0 } }}
              >
                <span style={{ minWidth: 0, display: 'block' }}>{labels.whatsapp}</span>
              </Button>
            )}
          </Flex>
        )}

        {/* Send-message trigger — `inquiryTrigger` is an opaque consumer-supplied node that sets
            its own `fullWidth` internally (hook-free split, Task 605); wrapping it in a
            `flex:1, minWidth:0` container lets that fill the row. Task 793 (D69-24's share
            partner) removed Share from this row — it moved to `MantineListingDetailPattern`'s
            badges row (kickoff §3.4) — so the row now holds only the send-message trigger.
            F2 — also renders for `closedListing`, same composition rule as the Call/WhatsApp
            row above (the consumer supplies a disabled "Send message" button for that case). */}
        {(state === 'normal' || state === 'closedListing') && (
          <Flex direction={{ base: 'column', xs2: 'row', md: 'column', xl: 'row' }} gap="sm">
            <Box style={{ flex: 1, minWidth: 0 }}>{inquiryTrigger}</Box>
          </Flex>
        )}

        {/* Task 793 E-A — SaveToCollection, same Flex/Box idiom as the send-message row above.
            Rendered whenever supplied, independent of `state` (see the prop doc). */}
        {saveTrigger && (
          <Flex direction={{ base: 'column', xs2: 'row', md: 'column', xl: 'row' }} gap="sm">
            <Box style={{ flex: 1, minWidth: 0 }}>{saveTrigger}</Box>
          </Flex>
        )}

        {/* Report listing — real full-width fix (724R V2 route a): the consumer-supplied
            `reportTrigger` node sets its own `fullWidth`, same as `inquiryTrigger`'s established
            convention. Rendered whenever supplied, independent of `state` (see the prop doc) —
            pre-724 baseline gave Report its own row (`Group justify="flex-end"`), preserved here. */}
        {reportTrigger && (
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
