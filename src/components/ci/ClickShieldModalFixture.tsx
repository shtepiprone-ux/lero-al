'use client'

import { useState } from 'react'
import { Button } from '@mantine/core'
import { useTranslations } from 'next-intl'
import { LightboxView } from '@/modules/listings/components/LightboxView'

const FIXTURE_IMAGES = [{ url: '/og-default.png' }]

/**
 * Deterministic CI harness for the production LightboxView interaction. This component is only
 * mounted by the route guarded with CLICK_SHIELD_CI_FIXTURE, so it cannot surface in the normal
 * application. It deliberately uses the production overlay rather than a hand-built dialog.
 */
export function ClickShieldModalFixture() {
  const [opened, setOpened] = useState(false)
  const common = useTranslations('common')
  const listing = useTranslations('listing')
  const title = listing('all_photos')

  return (
    <>
      <Button data-click-shield-modal-trigger onClick={() => setOpened(true)}>
        {title}
      </Button>
      <LightboxView
        opened={opened}
        images={FIXTURE_IMAGES}
        activeIndex={0}
        title={title}
        labels={{
          close: common('close'),
          prev: common('aria_prev'),
          next: common('aria_next'),
          counter: (index, total) => `${index} / ${total}`,
        }}
        onClose={() => setOpened(false)}
        onPrev={() => {}}
        onNext={() => {}}
        onSelect={() => {}}
      />
    </>
  )
}
