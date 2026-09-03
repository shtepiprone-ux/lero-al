'use client'

import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Group, Stack, Text, useMantineTheme } from '@mantine/core'
import {
  checkPasswordRules,
  allPasswordRulesMet,
  type PasswordRules,
} from '@/lib/passwordRules'

export { checkPasswordRules, allPasswordRulesMet, type PasswordRules }

interface RuleRowProps {
  met: boolean
  label: string
}

function RuleRow({ met, label }: RuleRowProps) {
  const theme = useMantineTheme()
  return (
    <Group
      component="li"
      gap={6}
      wrap="nowrap"
      align="flex-start"
      fz="xs"
      lh="1rem"
      c={met ? 'var(--status-success)' : 'var(--muted-foreground)'}
    >
      {met ? (
        <Check size={theme.other.iconSize.compact} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
      ) : (
        <X size={theme.other.iconSize.compact} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
      )}
      <span>{label}</span>
    </Group>
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
    <Stack data-testid="password-requirements-hint" gap={4} mt={4}>
      {hasInput && !allMet && (
        // lh matches the pre-migration <p>'s measured 19.5px (globals.css `p { @apply
        // leading-relaxed }` base rule), not text-xs's paired 16px — see CaptchaWidget.tsx.
        <Text size="xs" lh="19.5px" c="var(--destructive)">{t('password_requirements_error')}</Text>
      )}
      <Stack component="ul" gap={4} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <RuleRow met={rules.length}    label={t('password_rule_length')} />
        <RuleRow met={rules.uppercase} label={t('password_rule_uppercase')} />
        <RuleRow met={rules.lowercase} label={t('password_rule_lowercase')} />
        <RuleRow met={rules.digit}     label={t('password_rule_digit')} />
        <RuleRow met={rules.special}   label={t('password_rule_special')} />
      </Stack>
    </Stack>
  )
}
