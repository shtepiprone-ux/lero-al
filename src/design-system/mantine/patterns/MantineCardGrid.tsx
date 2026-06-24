'use client'

import { SimpleGrid, Card, Text, Badge, Group, Stack, Image } from '@mantine/core'

export interface CardGridItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price?: string
  badge?: string
  badgeColor?: string
  imageUrl?: string
  onClick?: () => void
}

export interface MantineCardGridProps {
  items: CardGridItem[]
  cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number }
  minCardWidth?: number
}

/**
 * Canonical card grid pattern.
 *
 * Mobile (<sm / 640px): 1 column.
 * Tablet (sm-md): 2 columns.
 * Desktop (md+): 3 columns.
 * Wide (xl+): 4 columns.
 *
 * Responsive API: SimpleGrid with `cols` responsive object — Mantine native.
 * Cards use `onClick` for touch-accessible interaction.
 * Badges use Mantine Badge component with project brand colors.
 */
export function MantineCardGrid({
  items,
  cols = { base: 1, sm: 2, md: 3, xl: 4 },
}: MantineCardGridProps) {
  return (
    <SimpleGrid cols={cols} spacing="md">
      {items.map((item) => (
        <Card
          key={item.id}
          shadow="sm"
          padding="md"
          radius="md"
          withBorder
          style={{ cursor: item.onClick ? 'pointer' : undefined }}
          onClick={item.onClick}
        >
          {item.imageUrl && (
            <Card.Section>
              <Image
                src={item.imageUrl}
                height={160}
                alt={item.title}
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%23f5f5f5'/%3E%3C/svg%3E"
              />
            </Card.Section>
          )}

          <Stack gap={4} mt={item.imageUrl ? 'md' : 0}>
            <Group justify="space-between" align="flex-start" gap="xs">
              <Text fw={600} size="sm" lineClamp={2} style={{ flex: 1 }}>
                {item.title}
              </Text>
              {item.badge && (
                <Badge
                  color={item.badgeColor ?? 'brand'}
                  variant="filled"
                  size="sm"
                  style={{ flexShrink: 0 }}
                >
                  {item.badge}
                </Badge>
              )}
            </Group>

            {item.subtitle && (
              <Text size="xs" c="dimmed">
                {item.subtitle}
              </Text>
            )}

            {item.description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {item.description}
              </Text>
            )}

            {item.price && (
              <Text fw={700} size="md" c="brand" mt={4}>
                {item.price}
              </Text>
            )}
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  )
}
