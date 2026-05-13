import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSettings } from '@/components/admin/AdminSettings'
import type { AllSettings } from '@/components/admin/AdminSettings'
import { getAllSettings } from '@/modules/admin/lib/settings'
import { ARCHIVED_NOINDEX_DAYS } from '@/modules/listings/constants'

export const metadata = { title: 'Налаштування — Admin' }

const DEFAULTS: AllSettings = {
  site_name:            'Lero.al',
  tagline:              'Tregu kryesor i pasurive të paluajtshme në Shqipëri.',
  contact_email:        '',
  contact_phone:        '',
  logo_url:             '',
  logo_dark_url:        '',
  favicon_url:          '',
  social_facebook:      '',
  social_instagram:     '',
  social_linkedin:      '',
  about_al:             '',
  about_uk:             '',
  meta_title:           'Lero.al — Imobiliare në Shqipëri',
  meta_desc:            'Gjeni shtëpinë tuaj të ëndrrave në Shqipëri.',
  og_image:             '',
  archived_noindex_days: String(ARCHIVED_NOINDEX_DAYS),
}

export default async function AdminSettingsPage() {
  const stored = await getAllSettings()

  const initialSettings: AllSettings = {
    site_name:            stored['site_name']            ?? DEFAULTS.site_name,
    tagline:              stored['tagline']              ?? DEFAULTS.tagline,
    contact_email:        stored['contact_email']        ?? DEFAULTS.contact_email,
    contact_phone:        stored['contact_phone']        ?? DEFAULTS.contact_phone,
    logo_url:             stored['logo_url']             ?? DEFAULTS.logo_url,
    logo_dark_url:        stored['logo_dark_url']        ?? DEFAULTS.logo_dark_url,
    favicon_url:          stored['favicon_url']          ?? DEFAULTS.favicon_url,
    social_facebook:      stored['social_facebook']      ?? DEFAULTS.social_facebook,
    social_instagram:     stored['social_instagram']     ?? DEFAULTS.social_instagram,
    social_linkedin:      stored['social_linkedin']      ?? DEFAULTS.social_linkedin,
    about_al:             stored['about_al']             ?? DEFAULTS.about_al,
    about_uk:             stored['about_uk']             ?? DEFAULTS.about_uk,
    meta_title:           stored['meta_title']           ?? DEFAULTS.meta_title,
    meta_desc:            stored['meta_desc']            ?? DEFAULTS.meta_desc,
    og_image:             stored['og_image']             ?? DEFAULTS.og_image,
    archived_noindex_days: stored['archived_noindex_days'] ?? DEFAULTS.archived_noindex_days,
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <AdminPageHeader
        title="Налаштування сайту"
        subtitle="Загальні налаштування платформи Lero.al"
      />
      <AdminSettings initialSettings={initialSettings} />
    </div>
  )
}
