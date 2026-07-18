import Link from 'next/link'
import { Box, Stack, Group, Flex } from '@mantine/core'
import type { FooterLink } from '@/types/database'

// Resolve a link URL: internal paths get locale prefix; external used as-is.
function resolveHref(url: string, locale: string): string {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `/${locale}${url.startsWith('/') ? url : '/' + url}`
}

function isExternal(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

function FooterLink_({ link, locale }: { link: FooterLink; locale: string }) {
  const href = resolveHref(link.url, locale)
  const ext = isExternal(link.url)
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </Link>
  )
}

// Social links are always absolute external URLs (DB-driven or fallback) — always
// rendered with target/rel, never through resolveHref (matches container behavior).
function SocialLink_({ link }: { link: FooterLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {link.label}
    </a>
  )
}

export interface FooterViewProps {
  brand: string
  tld: string
  tagline: string
  navTitle: string
  infoTitle: string
  socialTitle: string
  /** Nav column: when false, renders the hardcoded fallback trio via navFallbackLabels
   *  (a direct `/${locale}` home link cannot be reproduced through resolveHref, whose
   *  `if (!url) return '#'` guard has no non-empty input that resolves to a bare
   *  `/${locale}` — see Task 623 session log for the full trace). */
  hasNavLinks: boolean
  navLinks: FooterLink[]
  navFallbackLabels: { home: string; listings: string; addListing: string }
  /** Info/social columns have no root-path edge case — the container already resolves
   *  fallback selection into a plain FooterLink[] for these two. */
  infoLinks: FooterLink[]
  socialLinks: FooterLink[]
  copyright: string
  locale: string
}

export function FooterView({
  brand,
  tld,
  tagline,
  navTitle,
  infoTitle,
  socialTitle,
  hasNavLinks,
  navLinks,
  navFallbackLabels,
  infoLinks,
  socialLinks,
  copyright,
  locale,
}: FooterViewProps) {
  return (
    <Box component="footer" className="site-footer border-t bg-surface-2 pb-14 md:pb-0">
      <Box className="container-wide py-12">
        {/* gap-10 (40px) has no exact Mantine spacing token — kept as a Tailwind utility on a
            plain Box (no Mantine gap mechanism engaged) rather than inventing an off-token
            Mantine `spacing` value on SimpleGrid/Grid (component-rules "no invented spacing"). */}
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

          {/* Brand — gap-4 (16px) matches the Mantine `md` spacing token exactly */}
          <Stack gap="md">
            <Link href={`/${locale}`} className="font-bold text-xl w-fit">
              <span className="text-primary">{brand}</span>
              <span className="text-foreground">{tld}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-55">
              {tagline}
            </p>
          </Stack>

          {/* Navigation — gap-4 matches `md`; the link stack's gap-2.5 (10px) has no token
              match, so it stays a plain Box (see grid note above) */}
          <Stack gap="md">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {navTitle}
            </p>
            <Box component="nav" className="flex flex-col gap-2.5" aria-label={navTitle}>
              {hasNavLinks ? (
                navLinks.map(link => (
                  <FooterLink_ key={link.id} link={link} locale={locale} />
                ))
              ) : (
                <>
                  <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{navFallbackLabels.home}</Link>
                  <Link href={`/${locale}/listings`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{navFallbackLabels.listings}</Link>
                  <Link href={`/${locale}/listings/create`} className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">{navFallbackLabels.addListing}</Link>
                </>
              )}
            </Box>
          </Stack>

          {/* Information */}
          <Stack gap="md">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {infoTitle}
            </p>
            <Box component="nav" className="flex flex-col gap-2.5" aria-label={infoTitle}>
              {infoLinks.map(link => (
                <FooterLink_ key={link.id} link={link} locale={locale} />
              ))}
            </Box>
          </Stack>
        </Box>

        {/* Bottom bar — column <640, row ≥640 (Mantine `Flex` responsive `direction`);
            gap-3 (12px) matches the `sm` token exactly */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap="sm"
          className="mt-12 border-t pt-6"
        >
          <p className="text-xs text-muted-foreground">{copyright}</p>
          {/* gap-5 (20px) matches the `lg` token exactly */}
          <Group align="center" gap="lg">
            <span className="text-xs text-muted-foreground hidden sm:block">{socialTitle}:</span>
            {socialLinks.map(link => (
              <SocialLink_ key={link.id} link={link} />
            ))}
          </Group>
        </Flex>
      </Box>
    </Box>
  )
}
