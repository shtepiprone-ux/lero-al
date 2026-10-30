'use client'

import type { ReactNode } from 'react'
import { Avatar, Text, Group, Stack, Paper, Divider, Button, SimpleGrid, ThemeIcon, Loader, useMantineTheme } from '@mantine/core'
import { Phone, MessageCircle, CheckCircle, UserX, LogIn } from 'lucide-react'
import { MantineListingPrice } from './MantineListingPrice'

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
  /** Struck old price, already formatted; pass only when the owner lowered the price. */
  priceOld?: string
  /** Price in the owner's currency, already formatted; pass only when the viewer's currency differs. */
  originalPrice?: string
  /** Label for `originalPrice`, e.g. "Price in the owner's currency". */
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
  /** Task 793 E-B, Task 923 R116 (owner decision D74) — the channel whose click-time contact gateway request
   * (`revealListingContact`, Task 923 R111) is running. Only that button is disabled and swaps its icon for a
   * spinner; the other one keeps its icon and stays enabled. Transient, independent of listing lifecycle — see
   * `contactDisabled` for the permanent archived/expired case. */
  loading?: 'call' | 'whatsapp'
  /** Task 923 R118 (owner decision D75) — the phone number the contact gateway returned. When set (and `contactDisabled` is false) the first button becomes a
   * link: it shows `label` (the number, already formatted) instead of `labels.call`, with the same colour, size and icon, and dials `href` (`tel:` + digits). It
   * has no click handler and is not disabled. */
  revealedPhone?: { label: string; href: string }
  /** Task 923 R118 (owner decision D78) — set when WhatsApp could not be opened at once (the browser's click activation had expired before the number arrived).
   * When set (and `contactDisabled` is false) the WhatsApp button becomes a link that opens `href` in a new tab and shows `label`, and `note` — the reason, asking
   * the visitor to press again — is shown under the buttons as dimmed extra-small text announced as a status. */
  whatsappFallback?: { href: string; label: string; note: string }
  /** Task 923 R113 — the human check (app: the interaction-only `CaptchaWidget`), a positioned node rendered right after the Call/WhatsApp
   * grid as a child of the card's Stack (so it keeps the card's `md` rhythm). Only in the `normal` state and only where the grid renders. The
   * slot owns its own visibility: the app's widget takes no space until Cloudflare asks for interaction. */
  humanCheck?: ReactNode
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
 * real stateful dialogs/actions. Task 886 R19: the Call/WhatsApp row is a container-keyed `SimpleGrid` (two-up only when the card
 * itself is wide enough), so long uk/it labels never wrap inside a narrow card. Sticky positioning preserved.
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
  loading,
  revealedPhone,
  whatsappFallback,
  contactDisabled = false,
  contactDisabledLabel,
  humanCheck,
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
        <Group gap="sm" wrap="nowrap" opacity={dimmed ? 0.5 : undefined}>
          <Avatar src={state === 'ownerDeleted' ? null : agent.avatarUrl} radius="xl" size="lg" color="brand">
            {state === 'ownerDeleted' ? <UserX size={theme.other.iconSize.roomy} /> : agent.initials}
          </Avatar>
          <Stack gap="micro" flex={1} miw={0}>
            <Group gap="compact" wrap="nowrap">
              <Text fw={600} size="sm">
                {agent.name}
              </Text>
              {!dimmed && agent.isVerified && (
                <CheckIconBadge label={labels.verified} />
              )}
            </Group>
            {agent.subtitle && (
              <Text size="xs" c="dimmed">
                {agent.subtitle}
              </Text>
            )}
          </Stack>
        </Group>

        <Divider />

        <MantineListingPrice
          price={price.price}
          priceOld={price.priceOld}
          ownerCurrency={
            price.originalPrice && price.originalPriceLabel
              ? { label: price.originalPriceLabel, value: price.originalPrice }
              : undefined
          }
        />

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

        {/* Task 886 R19 (owner O83-1 return): the row is keyed on the CARD's own width, not the
            viewport (Mantine `SimpleGrid type="container"`, the D74-9 precedent): one column, two-up
            only when the card is at least `xs2` (480px) wide. Viewport breakpoints picked the row
            layout inside a ~280px card in the Docs preview and the sidebar. Task 793 F2: also renders
            for `closedListing`, with Call/WhatsApp disabled via `contactDisabled`. */}
        {(state === 'normal' || state === 'closedListing') && (hasPhone || hasWhatsapp) && (
          <SimpleGrid type="container" cols={{ base: 1, [theme.breakpoints.xs2]: 2 }} spacing="md">
            {hasPhone && (revealedPhone && !contactDisabled ? (
              <Button
                component="a"
                href={revealedPhone.href}
                color="brand"
                fullWidth
                leftSection={<Phone size={theme.other.iconSize.comfortable} />}
              >
                {revealedPhone.label}
              </Button>
            ) : (
              <Button
                color="brand"
                fullWidth
                onClick={onCall}
                disabled={loading === 'call' || contactDisabled}
                title={contactDisabled ? contactDisabledLabel : undefined}
                aria-disabled={contactDisabled || undefined}
                leftSection={loading === 'call' ? <Loader size={theme.other.iconSize.comfortable} color="currentColor" /> : <Phone size={theme.other.iconSize.comfortable} />}
              >
                {labels.call}
              </Button>
            ))}
            {hasWhatsapp && (whatsappFallback && !contactDisabled ? (
              <Button
                component="a"
                href={whatsappFallback.href}
                target="_blank"
                rel="noopener noreferrer"
                color="green"
                fullWidth
                leftSection={<MessageCircle size={theme.other.iconSize.comfortable} />}
              >
                {whatsappFallback.label}
              </Button>
            ) : (
              <Button
                color="green"
                fullWidth
                onClick={onWhatsApp}
                disabled={loading === 'whatsapp' || contactDisabled}
                title={contactDisabled ? contactDisabledLabel : undefined}
                aria-disabled={contactDisabled || undefined}
                leftSection={loading === 'whatsapp' ? <Loader size={theme.other.iconSize.comfortable} color="currentColor" /> : <MessageCircle size={theme.other.iconSize.comfortable} />}
              >
                {labels.whatsapp}
              </Button>
            ))}
          </SimpleGrid>
        )}

        {/* Task 923 R118 — why WhatsApp did not open at once, right under the buttons it concerns: the same dimmed extra-small text as the card's other notes. */}
        {(state === 'normal' || state === 'closedListing') && hasWhatsapp && !contactDisabled && whatsappFallback && (
          <Text size="xs" c="dimmed" role="status">
            {whatsappFallback.note}
          </Text>
        )}

        {/* Task 923 R113 — the human check, right after the grid it belongs to: the card's `md` rhythm is the gap around it. */}
        {state === 'normal' && (hasPhone || hasWhatsapp) && humanCheck}

        {/* Send-message trigger — `inquiryTrigger` is an opaque consumer-supplied node that sets its
            own `fullWidth` internally (hook-free split, Task 605), so it fills the card directly.
            F2 — also renders for `closedListing`, same composition rule as the row above. */}
        {(state === 'normal' || state === 'closedListing') && inquiryTrigger}

        {/* Task 793 E-A — SaveToCollection, rendered whenever supplied, independent of `state`
            (see the prop doc). Its default shape is `fullWidth`. */}
        {saveTrigger}

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
    <Paper radius="lg" p="md" bg="gray.0" ta="center">
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
