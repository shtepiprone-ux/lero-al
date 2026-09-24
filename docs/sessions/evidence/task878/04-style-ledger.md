# Task 878 §10.3 — per-site style ledger (R3/R4)

Re-measured at I0 (`02-style-sites.txt`): 28 `style={` sites, matching F4 exactly.

**Classification rule used below (reconciles with AC4's count invariant):** a row is **MECHANISM-KEPT**
if-and-only-if a `style={}` attribute still exists on that node after the edit (even when some of its
sibling values were also extracted to a Mantine prop in the same edit) — never MAPPED-with-a-remainder,
because a mixed label would break AC4's "remaining sites = MECHANISM-KEPT row count" arithmetic. A row is
**MAPPED** if-and-only-if its `style={}` attribute is eliminated entirely. Raw-literal-prop-only rows
(`lh={…}`, `c="var(--muted-foreground)"` with no sibling `style={}`) were never `style={}` sites and are
listed separately; they do not count toward either the 28-site or the 13-remaining tally.

Two `c="var(--muted-foreground)"` conversions go beyond F4's two named examples
(NotificationCenter.tsx:81, CaptchaWidget.tsx:47 post-drift) because R4's rule is general ("c='var(--muted-
foreground)' … → c='dimmed'") and this session's independent re-grep (required by I0 step 3) found it at
NotificationItem.tsx:228 too, immediately adjacent to an in-scope `lh` removal on the same `<Text>`.

## `style={}` sites (28, matching F4)

| File:line (after 875) | Before | Disposition | After | Reason (MECHANISM-KEPT only) |
|---|---|---|---|---|
| NotificationBellView.tsx:57 | `<Box style={{ display: 'flex', flexDirection: 'column', maxHeight: theme.other.layout.notificationPanelMaxHeight, overflow: 'hidden' }}>` | MECHANISM-KEPT | `<Flex direction="column" mah={theme.other.layout.notificationPanelMaxHeight} style={{ overflow: 'hidden' }}>` — display/flexDirection/maxHeight moved to props | overflow: 'hidden' — non-visual clipping mechanic, no Mantine style prop for it |
| NotificationCenter.tsx:35 | `style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}` on `Stack` | MECHANISM-KEPT | `flex="1 1 0%" mih={0}` props added; `style={{ overflow: 'hidden' }}` remains | overflow: 'hidden' |
| NotificationCenter.tsx:54 | `style={{ flexShrink: 0 }}` on `Flex` | MECHANISM-KEPT | unchanged | flexShrink is directly allowed |
| NotificationCenter.tsx:79 | `style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}` on `Box` | MECHANISM-KEPT | `flex="1 1 0%" mih={0}` props added; `style={{ overflowY: 'auto' }}` remains | overflowY — same non-visual scroll-clip family as `overflow`; no Mantine style prop exists for a single-axis overflow, and swapping to `ScrollArea` would change scrollbar chrome, a bigger structural change than this disposition covers |
| NotificationItem.tsx:191-194 | `style={{ cursor: interactive ? 'pointer' : undefined, transition: 'background-color var(--motion-duration-base) var(--motion-ease-standard)' }}` | MECHANISM-KEPT | unchanged | cursor allowed; transition already built from `--motion-*` tokens, explicitly allowed |
| NotificationItem.tsx:207 | `style={{ flexShrink: 0, marginTop: 'var(--mantine-spacing-micro)' }}` | MECHANISM-KEPT | `mt="micro"` prop added (matches the sibling `mt="micro"`/`mt="tight"` already in this file at :231/:244); `style={{ flexShrink: 0 }}` remains | flexShrink |
| NotificationItem.tsx:212 | `style={{ flex: '1 1 0%', minWidth: 0 }}` on `Box` | MAPPED | `flex="1 1 0%" miw={0}` props, `style` removed | — |
| NotificationItem.tsx:219 | `style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}` | MECHANISM-KEPT | unchanged | both directly allowed |
| NotificationItem.tsx:232 | `style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}` | MECHANISM-KEPT | unchanged | both directly allowed |
| NotificationItem.tsx:256 | `style={{ flexShrink: 0 }}` on `Box` | MECHANISM-KEPT | unchanged | flexShrink allowed |
| AuthSheet.tsx:160 | `<svg style={{ width: 16, height: 16, flexShrink: 0 }}>` | MECHANISM-KEPT | `width={theme.other.iconSize.standard} height={theme.other.iconSize.standard}` as real SVG attributes (not style); `style={{ flexShrink: 0 }}` remains | flexShrink; `LoginView` gains `const theme = useMantineTheme()` (not previously called there) |
| AuthSheet.tsx:171 | `style={{ color: 'var(--muted-foreground)', lineHeight: '1.625' }}` | MAPPED | `c="dimmed"` prop, `style` removed | — |
| AuthSheet.tsx:225 | `style={{ color: 'var(--status-success)', flexShrink: 0 }}` on `CheckCircle2` | MECHANISM-KEPT | `color="var(--mantine-color-green-6)"` prop added (matches `notificationVariants.ts`'s success→green mapping); `style={{ flexShrink: 0 }}` remains | flexShrink |
| AuthSheet.tsx:227 | `style={{ color: 'var(--muted-foreground)', lineHeight: 1.625 }}` | MAPPED | `c="dimmed"` | — |
| AuthSheet.tsx:241 | `style={{ color: 'var(--muted-foreground)', lineHeight: '1.625' }}` | MAPPED | `c="dimmed"` | — |
| AuthSheet.tsx:473 | `style={{ color: 'var(--muted-foreground)' }}` on `ImagePlus` | MAPPED | `color="var(--mantine-color-gray-6)"` (matches `SaveToCollectionButton.tsx:182` `Folder` icon precedent) | — |
| AuthSheet.tsx:511 | `style={{ color: 'var(--destructive)', lineHeight: '1.625' }}` | MAPPED | `c="red.6"` (matches `LocationCombobox.tsx:171` precedent, same in-scope file family) | — |
| AuthSheet.tsx:513 | `fz={10}`, `style={{ color: 'var(--muted-foreground)', lineHeight: '1.625' }}` | MAPPED | `fz="micro"`, `c="dimmed"`, `style` removed | — |
| AuthSheet.tsx:656 | `style={{ color: 'var(--status-success)', flexShrink: 0 }}` on `CheckCircle2` | MECHANISM-KEPT | `color="var(--mantine-color-green-6)"` prop added; `style={{ flexShrink: 0 }}` remains | flexShrink |
| AuthSheet.tsx:658 | `style={{ color: 'var(--muted-foreground)', lineHeight: 1.625 }}` | MAPPED | `c="dimmed"` | — |
| AuthSheet.tsx:754 | `style={{ color: 'var(--muted-foreground)', lineHeight: '1.625' }}` | MAPPED | `c="dimmed"` | — |
| AuthSheet.tsx:766 | `<Box pt="md" style={{ borderTop: '1px solid var(--border)' }}>` | MAPPED | replaced with a genuine Mantine layout component: `<Box><Divider /><Box pt="md">…</Box></Box>` — `Divider`'s own theme default (`defaultProps.color: 'gray.2'`, default `size` = 1px, default `variant` = solid) renders exactly `1px solid var(--mantine-color-gray-2)` with zero style props; the inner `Box pt="md"` reproduces the original's post-border 16px gap so total spacing to the button is unchanged | — |
| AuthSheet.tsx:805 | `style={{ display: 'block' }}` | MAPPED | `display="block"` prop | — |
| UserMenu.tsx:28 | `<span style={{ fontWeight: 500 }}>` | MAPPED | `<Text span inherit fw={500}>` (matches `FavoritesTypeFilter.tsx`/`SaveToCollectionButton.tsx` `Text span … inherit` precedent — **Revision 1 correction**: the original edit omitted `inherit`, and `Text` without it sets its own `font-size: var(--mantine-font-size-md)` (16px), a real regression against the 14px `Menu.item`/mobile-Text ambient context; see kickoff §16.1) | — |
| LocaleSwitcher.tsx:45 | `<span style={{ fontWeight: 600 }}>` | MAPPED | `<Text span inherit fw={600}>` (Revision 1 correction, same defect and fix as `UserMenu.tsx:28`) | — |
| LocationCombobox.tsx:145 | `style={{ width: 'fit-content' }}` on `Anchor` | MAPPED | `w="fit-content"` prop | — |
| PhoneField.tsx:179 | `style={{ flex: 1, minWidth: 0 }}` on `TextInput` | MAPPED | `flex={1} miw={0}` props | — |
| CaptchaWidget.tsx:83 | `style={{ width: '100%' }}` on `Turnstile` | MECHANISM-KEPT | unchanged | explicitly named allowed exception (third-party Turnstile width) |

## Raw literal props with no sibling `style={}` (not counted above; re-grepped independently this session)

| File:line (after 875) | Before | Disposition | After |
|---|---|---|---|
| NotificationCenter.tsx:59 | `lh={1.625}` | MAPPED | removed — theme `sm` lineHeight (1.43) applies |
| NotificationCenter.tsx:81 | `c="var(--muted-foreground)"`, `lh={1.625}` | MAPPED | `c="dimmed"`; `lh` removed |
| NotificationItem.tsx:206 | `lh={theme.other.lineHeight.notificationGlyph}` | out of scope | unchanged — already a named token, not a raw literal |
| NotificationItem.tsx:218 | `lh={1.375}` | MAPPED | removed — theme `sm` lineHeight (1.43) applies |
| NotificationItem.tsx:228 | `c="var(--muted-foreground)"` | MAPPED (R4 general rule; not one of F4's two named examples, found by this session's independent grep) | `c="dimmed"` |
| NotificationItem.tsx:229 | `lh={1.625}` | MAPPED | removed — theme `xs` lineHeight (1.5) applies |
| NotificationItem.tsx:242 | `c="color-mix(in oklab, var(--muted-foreground) 60%, transparent)"` | out of scope | unchanged — D35 binding decision: a deliberately reproduced opacity-modified token, explicitly not to be aliased to a flat `dimmed` (comment at :236-239 cites D35 by name) |
| NotificationItem.tsx:243 | `lh={1.625}` | MAPPED | removed — no `fontSizes.micro`-paired lineHeight token exists; Mantine's `Text` default lineHeight applies |
| AuthSheet.tsx:226 | `lh={1.25}` | MAPPED | removed — theme `lg` lineHeight (1.56) applies |
| AuthSheet.tsx:657 | `lh={1.25}` | MAPPED | removed — theme `lg` lineHeight (1.56) applies |
| CaptchaWidget.tsx:47 | `c="var(--muted-foreground)"` | MAPPED | `c="dimmed"` |
| CaptchaWidget.tsx:47 | `lh={mantineTheme.other.lineHeight.authNoteParagraph}` | out of scope | unchanged — already a named token |
| MobileNavDrawer.tsx:55 | `lh={1.625}` | MAPPED | removed — theme `sm` lineHeight (1.43) applies |
| MobileNavDrawer.tsx (Divider) | `<Divider color="var(--border)" />` | out of scope | unchanged — `color` prop, not `style={}`; not named in F4 |

## Disposition counts

- **MAPPED (style={} eliminated entirely):** 15 of the 28 sites — NotificationItem.tsx:212; AuthSheet.tsx:171,
  227, 241, 473, 511, 513, 658, 754, 766, 805; UserMenu.tsx:28; LocaleSwitcher.tsx:45; LocationCombobox.tsx:145;
  PhoneField.tsx:179.
- **MECHANISM-KEPT (style={} remains, allowed properties only):** 13 of the 28 sites — NotificationBellView.tsx:57;
  NotificationCenter.tsx:35, :54, :79; NotificationItem.tsx:191-194, :207, :219, :232, :256; AuthSheet.tsx:160,
  225, 656; CaptchaWidget.tsx:83. **This equals the expected post-change `style={` count (AC4).**
- **STOP:** 0.
- Raw-literal-only rows (no sibling `style={}`, not counted above): 14, of which 11 are MAPPED, 3 are out of
  scope (already-tokenized `lh` at NotificationItem.tsx:206 and CaptchaWidget.tsx:47, plus the D35-protected
  `color-mix()` at NotificationItem.tsx:242, plus MobileNavDrawer's `Divider color="var(--border)"` which is
  a `color` prop not named in F4).
