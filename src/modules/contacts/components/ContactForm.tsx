'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@/components/shared/Combobox'
import { submitContactInquiry } from '@/modules/contacts/actions'

interface FormValues {
  topic: string
  customSubject: string
  name: string
  email: string
  message: string
}

export function ContactForm() {
  const t = useTranslations('contact')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: { topic: '', customSubject: '', name: '', email: '', message: '' },
  })

  const topic = watch('topic')
  const isOther = topic === 'other'

  const topicOptions: ComboboxOption[] = [
    { value: 'general',     label: t('topics.general') },
    { value: 'sales',       label: t('topics.sales') },
    { value: 'support',     label: t('topics.support') },
    { value: 'partnership', label: t('topics.partnership') },
    { value: 'press',       label: t('topics.press') },
    { value: 'other',       label: t('topics.other') },
  ]

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    const result = await submitContactInquiry({
      topic: values.topic,
      customSubject: values.customSubject || undefined,
      name: values.name,
      email: values.email,
      message: values.message,
    })
    setSubmitting(false)

    if (result.error === 'rate_limited') {
      toast.error(t('rate_limited_toast'))
      return
    }
    if (result.error === 'mailbox_unverified') {
      toast.warning(t('errors.mailbox_unverified'))
      return
    }
    if (result.error === 'email_transient') {
      toast.warning(t('errors.email_transient'))
      return
    }
    if (result.error) {
      toast.error(t('error_toast'))
      return
    }

    toast.success(t('success_toast'))
    reset()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <p className="text-lg font-semibold mb-2">{t('success_toast')}</p>
        <p className="text-muted-foreground">{t('success_body')}</p>
        <Button
          size="lg"
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          {t('send_another')}
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 flex flex-col gap-5"
      noValidate
    >
      {/* Topic */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-topic">{t('topic_label')}</Label>
        <Combobox
          options={topicOptions}
          value={topic}
          onChange={v => setValue('topic', v, { shouldValidate: true })}
          placeholder={t('topic_placeholder')}
          variant="button"
          size="default"
          error={errors.topic?.message}
        />
        <input
          type="hidden"
          {...register('topic', { required: t('validation_topic_required') })}
        />
      </div>

      {/* Custom subject — visible only when "Other" is selected */}
      {isOther && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field-custom-subject">{t('custom_subject_label')}</Label>
          <Input
            id="field-custom-subject"
            placeholder={t('custom_subject_placeholder')}
            {...register('customSubject', {
              validate: (v) => !isOther || !!v.trim() || t('validation_custom_subject_required'),
            })}
          />
          {errors.customSubject && (
            <p className="text-xs text-destructive">{errors.customSubject.message}</p>
          )}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-name">{t('name_label')}</Label>
        <Input
          id="field-name"
          placeholder={t('name_placeholder')}
          {...register('name', { required: t('validation_name_required') })}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-email">{t('email_label')}</Label>
        <Input
          id="field-email"
          type="email"
          inputMode="email"
          placeholder={t('email_placeholder')}
          {...register('email', {
            required: t('validation_email_invalid'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('validation_email_invalid'),
            },
          })}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="field-message">{t('message_label')}</Label>
        <Textarea
          id="field-message"
          rows={5}
          placeholder={t('message_placeholder')}
          className="resize-none"
          {...register('message', {
            required: t('validation_message_min'),
            minLength: { value: 20, message: t('validation_message_min') },
          })}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="self-end">
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
