import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { FooterView } from '@/components/layout/FooterView'
import type { FooterLink } from '@/types/database'

const meta: Meta = {
  title: 'Mantine/Primitives/FooterView',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const link = (id: string, label: string, url: string, order: number): FooterLink => ({
  id,
  label,
  url,
  enabled: true,
  order,
})

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `nav.${key}`)

    return (
      <FooterView
        brand="Lero"
        tld=".al"
        tagline={t('tagline')}
        navTitle={t('navigation')}
        infoTitle={t('information')}
        socialTitle={t('follow_us')}
        navLinks={[
          link('nav-home', t('home'), '/', 0),
          link('nav-listings', t('listings'), '/listings', 1),
          link('nav-add', t('add_listing'), '/listings/create', 2),
        ]}
        infoLinks={[
          link('info-about', t('about'), '/about', 0),
          link('info-contact', t('contacts'), '/contact', 1),
          link('info-privacy', t('privacy'), '/privacy-policy', 2),
          link('info-terms', t('terms'), '/terms-of-service', 3),
        ]}
        socialLinks={[
          link('social-facebook', 'Facebook', 'https://facebook.com', 0),
          link('social-instagram', 'Instagram', 'https://instagram.com', 1),
        ]}
        copyright={`© 2026 Lero.al — ${t('all_rights')}`}
        locale={locale}
      />
    )
  },
}
