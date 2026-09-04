import Link from 'next/link'
import { Anchor, Box, Stack, Group, Flex, SimpleGrid, Text } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { cn } from '@/lib/utils'
import type { FooterLink } from '@/types/database'
import styles from './FooterView.module.css'

// Resolve a link URL: internal paths get the locale prefix; external used as-is.
function resolveHref(url: string, locale: string): string {
  if (!url) return `/${locale}`
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `/${locale}${url.startsWith('/') ? url : '/' + url}`
}

function isExternal(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function FooterLink_({ link, locale }: { link: FooterLink; locale: string }) {
  const ext = isExternal(link.url)
  return (
    <Anchor
      unstyled
      component={Link}
      href={resolveHref(link.url, locale)}
      className={styles.footerLink}
      {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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
            {socialLinks.map(link => (
              <Anchor
                unstyled
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                {link.label}
              </Anchor>
            ))}
          </Group>
        </Flex>
      </Box>
    </Box>
  )
}
