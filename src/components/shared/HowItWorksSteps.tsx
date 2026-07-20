'use client'

import { Box, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { Search, Home, Phone } from 'lucide-react'

const STEP_ICONS = [Search, Home, Phone] as const

export interface HowItWorksStep {
  title: string
  desc: string
}

export interface HowItWorksStepsProps {
  heading: string
  /** Exactly 3 steps — icons (Search/Home/Phone) and numbers (1/2/3) are owned internally by index. */
  steps: readonly [HowItWorksStep, HowItWorksStep, HowItWorksStep]
}

/**
 * Presentational "How it works" section — Mantine primitives + theme tokens only.
 * Prop-driven, hook-free (no useTranslations) so it renders identically in the story via
 * storyT() and in the future page.tsx consumer (Task 645).
 */
export function HowItWorksSteps({ heading, steps }: HowItWorksStepsProps) {
  return (
    <>
      <Title order={2} ta="center" fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }} mb={40}>
        {heading}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={32} maw={768} mx="auto">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index]
          return (
            <Stack key={step.title} align="center" ta="center" gap="sm">
              <Box pos="relative">
                <ThemeIcon size={56} radius="2xl" color="brand" variant="light">
                  <Icon size={24} />
                </ThemeIcon>
                <ThemeIcon
                  size={24}
                  radius="pill"
                  color="brand"
                  variant="filled"
                  pos="absolute"
                  fz="xs"
                  fw={700}
                  style={{
                    top: 'calc(var(--mantine-spacing-xs) * -1)',
                    right: 'calc(var(--mantine-spacing-xs) * -1)',
                  }}
                >
                  {index + 1}
                </ThemeIcon>
              </Box>
              <Text component="h3" fw={600} size="md">
                {step.title}
              </Text>
              <Text size="sm" c="dimmed">
                {step.desc}
              </Text>
            </Stack>
          )
        })}
      </SimpleGrid>
    </>
  )
}
