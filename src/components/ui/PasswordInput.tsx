'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input, type InputProps } from '@/components/ui/input'

export type PasswordInputState = 'idle' | 'error' | 'success'

interface PasswordInputProps extends Omit<InputProps, 'type'> {
  inputState?: PasswordInputState
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, inputState = 'idle', ...props }, ref) => {
    const t = useTranslations('common')
    const [visible, setVisible] = React.useState(false)

    return (
      <div data-slot="password-input" className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'pr-12',
            inputState === 'error' && 'border-destructive ring-2 ring-destructive/20',
            inputState === 'success' && 'border-status-success ring-2 ring-status-success/20',
            className,
          )}
        />
        <button
          type="button"
          aria-label={visible ? t('hide_password') : t('show_password')}
          aria-pressed={visible}
          onClick={() => setVisible(v => !v)}
          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center h-11 w-11 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-xl"
        >
          {visible ? (
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
