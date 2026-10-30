import Link from 'next/link'
import { Anchor, Box, Stack, Group, Flex, SimpleGrid, Text } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { cn } from '@/lib/utils'
import type { FooterLink } from '@/types/database'
import { resolveLinkTarget } from '@/lib/security/safeUrl'
import styles from './FooterView.module.css'

// A configured link is rendered only when it resolves to a safe target (Task 923 Revision 7, S9): internal paths get the locale prefix, http(s) / mailto / tel
// are used as they are, and anything else (a `javascript:` or `data:` URL, also with a tab inside the scheme) is shown as plain text, never as a link.
function FooterLink_({ link, locale }: { link: FooterLink; locale: string }) {
  const target = resolveLinkTarget(link.url, locale)
  if (!target) return <Text unstyled component="span" className={styles.footerLink}>{link.label}</Text>
  return (
    <Anchor
      unstyled
      component={Link}
      href={target.href}
      className={styles.footerLink}
      {...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </Anchor>
  )
}

export interface FooterViewProps {
  brand: string
  tld: string
  tagline: string
  navTitle: string
  infoTitle: string
  socialTitle: string
  navLinks: FooterLink[]
  infoLinks: FooterLink[]
  socialLinks: FooterLink[]
  copyright: string
  locale: string
}

/**
 * Presentational footer built from Mantine layout primitives (Box/Stack/Group/Flex/SimpleGrid)
 * and Mantine content primitives (Anchor/Text, both `unstyled`). Prop-driven and hook-free — all
 * data resolution (DB values, fallbacks, i18n) happens in the `Footer` container. Visual values
 * live in `FooterView.module.css` (consuming `globals.css` variables) or as Mantine style props —
 * zero raw Tailwind utility classes (Task 673, D28 mechanism-only de-hybrid).
 */
export function FooterView({
  brand,
  tld,
  tagline,
  navTitle,
  infoTitle,
  socialTitle,
  navLinks,
  infoLinks,
  socialLinks,
  copyright,
  locale,
}: FooterViewProps) {
  return (
    <Box component="footer" className={cn('site-footer', styles.footer)}>
      <Box className={cn('container-wide', styles.container)}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={theme.other!.layout!.footerGridGap}>

          {/* Brand */}
          <Stack gap="md">
            <Anchor unstyled component={Link} href={`/${locale}`} className={styles.brandLink}>
              <Text unstyled component="span" className={styles.textPrimary}>{brand}</Text>
              <Text unstyled component="span" className={styles.textForeground}>{tld}</Text>
            </Anchor>
            <Text unstyled className={styles.tagline}>{tagline}</Text>
          </Stack>

          {/* Navigation */}
          <Stack gap="md">
            <Text unstyled className={styles.sectionHeading}>
              {navTitle}
            </Text>
            <Box component="nav" className={styles.linkList} aria-label={navTitle}>
              {navLinks.map(link => (
                <FooterLink_ key={link.id} link={link} locale={locale} />
              ))}
            </Box>
          </Stack>

          {/* Information */}
          <Stack gap="md">
            <Text unstyled className={styles.sectionHeading}>
              {infoTitle}
            </Text>
            <Box component="nav" className={styles.linkList} aria-label={infoTitle}>
              {infoLinks.map(link => (
                <FooterLink_ key={link.id} link={link} locale={locale} />
              ))}
            </Box>
          </Stack>
        </SimpleGrid>

        {/* Bottom bar */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap="sm"
          mt="3xl"
          pt="xl"
          className={styles.bottomBar}
        >
          <Text unstyled className={styles.copyright}>{copyright}</Text>
          <Group align="center" gap="lg">
            <Text unstyled component="span" className={styles.socialLabel} visibleFrom="sm">{socialTitle}:</Text>
            {socialLinks.map(link => {
              const target = resolveLinkTarget(link.url, locale)
              // a social link is always another site: an internal or unsafe value is not rendered as a link
              if (!target?.external) return <Text unstyled component="span" key={link.id} className={styles.socialLink}>{link.label}</Text>
              return (
              <Anchor
                unstyled
                key={link.id}
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                {link.label}
              </Anchor>
              )
            })}
          </Group>
        </Flex>
      </Box>
    </Box>
  )
}
