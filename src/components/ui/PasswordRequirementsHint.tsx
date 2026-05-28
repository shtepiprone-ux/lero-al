'use client'

import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export interface PasswordRules {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  digit: boolean
  special: boolean
}

export function checkPasswordRules(value: string): PasswordRules {
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    digit: /[0-9]/.test(value),
    special: /[!@#$%*=]/.test(value),
  }
}

export function allPasswordRulesMet(value: string): boolean {
  const rules = checkPasswordRules(value)
  return Object.values(rules).every(Boolean)
}

interface RuleRowProps {
  met: boolean
  label: string
}

function RuleRow({ met, label }: RuleRowProps) {
  return (
    <li className={cn('flex items-start gap-1.5 text-xs', met ? 'text-status-success' : 'text-muted-foreground')}>
      {met ? (
        <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <X className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <span>{label}</span>
    </li>
  )
}

interface PasswordRequirementsHintProps {
  value: string
}

export function PasswordRequirementsHint({ value }: PasswordRequirementsHintProps) {
  const t = useTranslations('auth')
  const rules = checkPasswordRules(value)
  const hasInput = value.length > 0
  const allMet = Object.values(rules).every(Boolean)

  return (
    <div className="flex flex-col gap-1 mt-1">
      {hasInput && !allMet && (
        <p className="text-xs text-destructive">{t('password_requirements_error')}</p>
      )}
      <ul className="flex flex-col gap-1">
        <RuleRow met={rules.length}    label={t('password_rule_length')} />
        <RuleRow met={rules.uppercase} label={t('password_rule_uppercase')} />
        <RuleRow met={rules.lowercase} label={t('password_rule_lowercase')} />
        <RuleRow met={rules.digit}     label={t('password_rule_digit')} />
        <RuleRow met={rules.special}   label={t('password_rule_special')} />
      </ul>
    </div>
  )
}
