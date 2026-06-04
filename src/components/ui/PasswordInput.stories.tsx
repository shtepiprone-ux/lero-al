'use client'

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { useTranslations } from 'next-intl'
import { PasswordInput } from './PasswordInput'
import { PasswordRequirementsHint, allPasswordRulesMet } from './PasswordRequirementsHint'
import { Button } from './button'
import { Label } from './label'

const meta: Meta<typeof PasswordInput> = {
  title: 'Primitives/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
  parameters: {},
  argTypes: {
    inputState: { control: 'select', options: ['idle', 'error', 'success'] },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof PasswordInput>

export const Default: Story = {
  args: { placeholder: 'Enter password', inputState: 'idle' },
}

export const ErrorState: Story = {
  args: { placeholder: 'Enter password', inputState: 'error' },
}

export const SuccessState: Story = {
  args: { placeholder: 'Enter password', inputState: 'success', value: 'Sample123!' },
}

export const Disabled: Story = {
  args: { disabled: true, value: 'locked-password' },
}

function WithHintIdleRender() {
  const [value, setValue] = useState('')
  const hasInput = value.length > 0
  const allMet = allPasswordRulesMet(value)
  const inputState = hasInput ? (allMet ? 'success' : 'error') : 'idle'
  const t = useTranslations('auth')
  return (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="story-pass">{t('reset_password_new_label')}</Label>
      <PasswordInput
        id="story-pass"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoComplete="new-password"
        inputState={inputState}
      />
      <PasswordRequirementsHint value={value} />
      <Button size="xl" className="w-full mt-2" disabled={!allMet}>
        {t('reset_password_submit')}
      </Button>
    </div>
  )
}

export const WithHintIdle: Story = {
  render: () => <WithHintIdleRender />,
  parameters: {
    docs: { description: { story: 'Full password-with-hint form. Type to see live rule validation.' } },
  },
}

function WithHintAllRulesMetRender() {
  const [value, setValue] = useState('Sample123!')
  const hasInput = value.length > 0
  const allMet = allPasswordRulesMet(value)
  const inputState = hasInput ? (allMet ? 'success' : 'error') : 'idle'
  const t = useTranslations('auth')
  return (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="story-pass-ok">{t('reset_password_new_label')}</Label>
      <PasswordInput
        id="story-pass-ok"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoComplete="new-password"
        inputState={inputState}
      />
      <PasswordRequirementsHint value={value} />
      <Button size="xl" className="w-full mt-2" disabled={!allMet}>
        {t('reset_password_submit')}
      </Button>
    </div>
  )
}

export const WithHintAllRulesMet: Story = {
  render: () => <WithHintAllRulesMetRender />,
  parameters: {
    docs: { description: { story: 'All 5 rules met — green border, all check marks, button enabled.' } },
  },
}

function Mobile320UkrainianRender() {
  const [value, setValue] = useState('Abc1!')
  const hasInput = value.length > 0
  const allMet = allPasswordRulesMet(value)
  const inputState = hasInput ? (allMet ? 'success' : 'error') : 'idle'
  const t = useTranslations('auth')
  return (
    <div className="flex flex-col gap-2 w-full p-4">
      <Label htmlFor="story-uk">{t('reset_password_new_label')}</Label>
      <PasswordInput
        id="story-uk"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoComplete="new-password"
        inputState={inputState}
      />
      <PasswordRequirementsHint value={value} />
      <Button size="xl" className="w-full mt-2" disabled={!allMet}>
        {t('reset_password_submit')}
      </Button>
    </div>
  )
}

export const LocaleStress: Story = {
  render: () => <Mobile320UkrainianRender />,
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '320px Ukrainian — longest strings, rule rows wrap gracefully.' } },
  },
}
