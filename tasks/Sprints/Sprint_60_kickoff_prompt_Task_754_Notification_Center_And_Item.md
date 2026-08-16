# Task 754 — `NotificationCenter` + `NotificationItem`

**Sprint:** 60 · **Type:** UI mechanism (D28) + Mantine migration · **QA profile:** `Q2 Standard UI` · **Status:** KICKOFF FILED

## Objective

Migrate the notification centre's two view components. One vertical, one task — `NotificationCenter` renders
`NotificationItem`, so splitting them would mean two rendered matrices of the same screen.

`NotificationCenter` already imports Mantine; `NotificationItem` imports **none**.

## Exact current state — read 2026-08-16, verify before editing

### `src/modules/notifications/components/NotificationCenter.tsx` (70 lines)

| Line | Current |
|---|---|
| 31 | `<div data-testid="notification-center" className="flex flex-1 min-h-0 flex-col overflow-hidden">` |
| 40 | `<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b shrink-0">` |
| 41 | `<p className="text-sm font-semibold">{t('title')}</p>` |
| 51 | `className="w-full sm:w-auto"` |
| 59 | `<div className="flex-1 min-h-0 overflow-y-auto divide-y">` |
| 61 | `<p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>` |

### `src/modules/notifications/components/NotificationItem.tsx` (212 lines)

| Line | Current |
|---|---|
| 172 | `className={cn(` — root, conditional |
| 183 | `<span className="text-base shrink-0 mt-0.5" aria-hidden>` |
| 186 | `<div className="flex-1 min-w-0">` |
| 187 | `<p className={cn('text-sm leading-snug whitespace-normal break-words', !notification.is_read && 'font-medium')}>` |
| 190 | `<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-normal break-words">` |
| 193 | `<p className="text-2xs text-muted-foreground/60 mt-1">` |
| 198 | `<span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" aria-label={t('unread_count', { count: 1 })} />` |
| 205 | `<a href={notification.link} className="block hover:no-underline" onClick={handleClick}>` |

Read line 172's full `cn(...)` before editing — it is conditional and its branches carry the read/unread
state.

## Replacement rules

- Responsive utilities (`sm:flex-row`, `sm:items-center`, `sm:justify-between`, `sm:w-auto`) → Mantine
  responsive props on `Group`/`Stack`/`Button`. **`sm:` in this project's Tailwind config is 640px — confirm
  it against the config, then map to the Mantine breakpoint that resolves to the same px.** A mismatch here is
  a visual regression that renders only between two widths, which is exactly what the matrix must catch.
- `divide-y` (`:59`) has **no Mantine prop equivalent**. Either a CSS module rule reproducing
  `& > * + * { border-top: … }`, or a `Divider` between items — the second changes the DOM and therefore
  needs rendered proof of equivalence. Pick one and justify it.
- `text-2xs` and `text-muted-foreground/60` (`:193`) are a project scale value and an **opacity-modified
  token**. Under D35 an opacity-modifier consumer must not be aliased to a runtime `var()`. Read `globals.css`
  for `--text-2xs`'s value and reproduce the rendered result; do not approximate.
- `line-clamp-2` (`:190`) → Mantine `Text lineClamp={2}`.
- `hover:no-underline` (`:205`) → Mantine `Anchor underline="never"`, **only if** it renders identically.
- Icons/dot at `:198` is a decorative 8px dot with a semantic `bg-primary`. Keep the token.

## Preserve exactly

- `data-testid="notification-center"` (`:31`) — used by existing tooling.
- `aria-hidden` (`:183`) and `aria-label={t('unread_count', …)}` (`:198`).
- The read/unread conditional at `:172` and `:187` — both branches, unchanged in behaviour.
- `handleClick` on the anchor (`:205`) and the `href`.
- Every `t()` key. **The owner's standing item "eyeball-verify notification localization under `/sq`" is open
  in the backlog — do not "fix" any string here.** Text changes are out of scope in both directions.

## Out of scope

`NotificationBell` / `NotificationBellView` (752 covers the bell icon) · `useNotifications` hook · any data
or read-state logic · any string change.

## Acceptance criteria

- **AC1** — both files render via Mantine primitives; every surviving Tailwind utility is listed with its reason.
- **AC2** — rendered evidence, zero visual delta, at 320 / 390 / 768 / 1024 / 1440, `uk@320` mandatory, in **four** states: empty list · unread item · read item · list of ≥3 items (to prove the `divide-y` replacement).
- **AC3** — the `sm:` → Mantine breakpoint mapping is stated as a px value, and the matrix includes at least one width on each side of it.
- **AC4** — `data-testid`, both ARIA attributes, `href` and `handleClick` verified present in the rendered DOM.
- **AC5** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0.
- **AC6** — no string content changed; `check:i18n` key parity unchanged.

## Report contract

Changed files with line numbers; the `divide-y` decision and its evidence; the `sm:` px mapping; the
`text-2xs` / opacity-token handling; every utility kept with the reason; commands with actual output;
rendered evidence locations for all four states.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
