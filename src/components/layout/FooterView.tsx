import Link from 'next/link'
import { Box, Stack, Group, Flex } from '@mantine/core'
import type { FooterLink } from '@/types/database'

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
    <Link
      href={resolveHref(link.url, locale)}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </Link>
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
 * Presentational footer built from Mantine layout primitives (Box/Stack/Group/Flex).
 * Prop-driven and hook-free — all data resolution (DB values, fallbacks, i18n) happens in the
 * `Footer` container. Visual tokens keep the existing footer classNames so the migration is
 * pixel-faithful to the legacy footer.
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
    <Box component="footer" className="site-footer border-t bg-surface-2 pb-14 md:pb-0">
      <Box className="container-wide py-12">
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">

          {/* Brand */}
          <Stack gap="md">
            <Link href={`/${locale}`} className="font-bold text-xl w-fit">
              <span className="text-primary">{brand}</span>
              <span className="text-foreground">{tld}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-55">{tagline}</p>
          </Stack>

          {/* Navigation */}
          <Stack gap="md">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {navTitle}
            </p>
            <Box component="nav" className="flex flex-col gap-2.5" aria-label={navTitle}>
              {navLinks.map(link => (
                <FooterLink_ key={link.id} link={link} locale={locale} />
              ))}
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

        {/* Bottom bar */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="space-between"
          gap="sm"
          className="mt-12 border-t pt-6"
        >
          <p className="text-xs text-muted-foreground">{copyright}</p>
          <Group align="center" gap="lg">
            <span className="text-xs text-muted-foreground hidden sm:block">{socialTitle}:</span>
            {socialLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </Group>
        </Flex>
      </Box>
    </Box>
  )
}
