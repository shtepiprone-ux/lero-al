'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { signUp } from '@/lib/auth/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function RegisterForm() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [userType, setUserType] = useState<'private' | 'agent'>('private')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(email, password, {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}`,
        data: {
          name,
          phone,
          user_type: userType,
          company_name: userType === 'agent' ? companyName : null,
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    setSuccess(false)
    router.push(`/${locale}`)
  }

  return (
    <>
      <div className="register-page min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Shtepi.al</CardTitle>
            <CardDescription>{t('register')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>{t('register_as')}</Label>
                <RadioGroup
                  value={userType}
                  onValueChange={v => setUserType(v as 'private' | 'agent')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">{t('private')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agent" id="agent" />
                    <Label htmlFor="agent">{t('agent')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {userType === 'agent' && (
                <div className="space-y-2">
                  <Label htmlFor="company">{t('company')}</Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('register')}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('have_account')}{' '}
              <Link href={`/${locale}/auth/login`} className="text-primary hover:underline font-medium">
                {t('login')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={success} onOpenChange={(open) => { if (!open) handleDismiss() }}>
        <DialogContent showCloseButton className="sm:max-w-sm text-center">
          <DialogHeader className="items-center gap-3 pt-2">
            <CheckCircle2 className="h-12 w-12 text-green-500 shrink-0" />
            <DialogTitle className="text-lg font-semibold">
              {t('register_success_title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {t('register_success_body')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose render={<Button className="w-full h-11" />}>
              {t('register_success_go_home')}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
