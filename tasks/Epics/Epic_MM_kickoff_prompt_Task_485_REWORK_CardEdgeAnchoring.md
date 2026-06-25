# Task 485 — REWORK — Card rows must be EDGE-ANCHORED (retract the 38/62 two-column layout)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus.
> **What's wrong:** the mobile card meta rows use a fixed ~38%/62% two-column grid, so the VALUE starts in the
> middle of the card with empty space on the right. The reference card anchors every row to BOTH side edges:
> label → left edge, value → right edge (right-aligned). **This retracts the earlier "aligned 2-col / no
> space-between" instruction — that was wrong.** UI-only; theme tokens only; preserve handlers/testids.
> Scope: the `renderDesignedCard` / CardConfig path in `MantineDataTableToCards.tsx` (+ verify other patterns'
> cards follow the same rule).

## The required card pattern (every row anchored to the card's two padded edges)

Implement the card EXACTLY like this skeleton (Mantine v8, tokens only; mock content via props):

```tsx
<Card withBorder radius="2xl" padding="md">{/* p=16; padding defines the left/right anchor edges */}
  <Stack gap="sm">

    {/* HEADER: id left ↔ actions right */}
    <Group justify="space-between" wrap="nowrap" align="center">
      <Text size="xs" c="gray.5">{card.id?.(row)}</Text>      {/* #101 — left edge */}
      <Group gap="xs" wrap="nowrap">{card.actions?.(row)}</Group> {/* icons — right edge */}
    </Group>

    <Divider color="gray.1" />

    {/* PRIMARY: avatar+title+subtitle left ↔ status badge right (top-aligned) */}
    <Group justify="space-between" wrap="nowrap" align="flex-start">
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        {card.avatar?.(row)}
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} c="gray.7" truncate>{card.title(row)}</Text>
          <Text size="xs" c="gray.5" truncate>{card.subtitle?.(row)}</Text>
        </Stack>
      </Group>
      <div style={{ flexShrink: 0 }}>{card.badge?.(row)}</div>   {/* right edge */}
    </Group>

    <Divider color="gray.1" />

    {/* META: each row label left edge ↔ value right edge (value right-aligned) */}
    <Stack gap="xs">
      {card.meta?.map((m) => (
        <Group key={m.label} justify="space-between" wrap="nowrap" align="center" gap="md">
          <Text size="xs" c="gray.5" style={{ flexShrink: 0 }}>{m.label}</Text>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <Text size="sm" c="gray.7" component="span">{m.value(row)}</Text>
          </div>
        </Group>
      ))}
    </Stack>

  </Stack>
</Card>
```

## Hard rules

1. **NO fixed-percentage columns** (no 38%/62%, no `SimpleGrid cols={2}` for meta). Every row is
   `Group justify="space-between"` — label hugs the LEFT padded edge, value hugs the RIGHT padded edge.
2. Value content is **right-aligned** (`textAlign: 'right'`). Multi-line values (e.g. date + "Online: …")
   stack right-aligned.
3. Card `padding` is the only thing defining the side margins — content anchors to those inner edges, no extra
   left indent on values.
4. Tight vertical rhythm: `Stack gap="sm"` for sections, `gap="xs"` for meta rows; `gap={2}` for title/subtitle.
5. Dividers `color="gray.1"`, full width (default).
6. Tokens/colors only (gray.5 labels, gray.7 values); no raw px except the `gap={2}` title micro-gap and
   `minWidth:0` truncation helpers.
7. Preserve all handlers/testids (id/actions render the same verify/revoke + detail link).

## Acceptance
1. In the rendered card, labels sit flush at the left inner edge and values flush at the right inner edge — no
   value starting mid-card, no empty right gutter.
2. Matches the reference card rhythm (header / divider / avatar+title+subtitle | badge / divider / meta).
3. Rendered proof at 320/375/480 × en/uk (sq/it@320) — owner-grade match to the reference card.
4. tsc=0 · check:stories green · check:i18n green · check:design-tokens green · RTL 20/20 · file-integrity clean.
5. No git; UI-only; no behavior change.
