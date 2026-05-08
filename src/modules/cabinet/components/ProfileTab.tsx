'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { User, UserType } from '@/types/database'

interface Props {
  profile: User | null
  locale: string
}

export function ProfileTab({ profile, locale: _locale }: Props) {
  const t = useTranslations('cabinet')
  const tc = useTranslations('common')

  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? '')
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [userType, setUserType] = useState<UserType>(profile?.user_type ?? 'private')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleSave() {
    if (!profile?.id) return
    setStatus('saving')
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        name: name.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        company_name: userType === 'agent' ? (companyName.trim() || null) : null,
        user_type: userType,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Profile update failed', { error, userId: profile.id })
      setStatus('error')
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="profile-tab bg-card rounded-2xl border shadow-sm p-6">
      <h2 className="font-semibold text-base mb-6">{t('profile_tab')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-sm">{t('name')}</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="h-11 rounded-xl"
            placeholder={t('name')}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone" className="text-sm">{t('phone')}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="h-11 rounded-xl"
            placeholder={tc('phone_placeholder')}
          />
        </div>

        {/* WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp" className="text-sm">{t('whatsapp')}</Label>
          <Input
            id="whatsapp"
            type="tel"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            className="h-11 rounded-xl"
            placeholder={tc('phone_placeholder')}
          />
        </div>

        {/* Account type */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">{t('user_type_label')}</Label>
          <div className="flex gap-2">
            {(['private', 'agent'] as UserType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={cn(
                  'flex-1 h-11 rounded-xl border text-sm font-medium transition-all duration-150',
                  userType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                )}
              >
                {type === 'private' ? t('user_type_private') : t('user_type_agent')}
              </button>
            ))}
          </div>
        </div>

        {/* Company name — agent only */}
        {userType === 'agent' && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="company" className="text-sm">{t('company_name')}</Label>
            <Input
              id="company"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="h-11 rounded-xl"
              placeholder={t('company_name')}
            />
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t gap-4">
        {status === 'saved' && (
          <span className="flex items-center gap-1.5 text-sm text-status-success">
            <CheckCircle2 className="h-4 w-4" />
            {t('profile_updated')}
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {t('error_saving')}
          </span>
        )}
        <div className="ml-auto">
          <Button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="h-11 px-8 rounded-xl"
          >
            {status === 'saving' ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </div>
    </div>
  )
}
