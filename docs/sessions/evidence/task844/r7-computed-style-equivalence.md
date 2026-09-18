# Task 844 R7 — computed-style equivalence, verified against Mantine's real compiled CSS

No live browser session was available this session (Claude-in-Chrome not connected). Rather than
assert equivalence by inspection alone, the claim was checked against the actual shipped CSS
(`node_modules/@mantine/core/styles/Text.css`) and the component source
(`node_modules/@mantine/core/esm/components/Text/Text.mjs`), for the two required sample
consumers plus the one that does pass `className`:

- `AdminListingsTable.tsx:334` — `<p className="font-medium"><RelativeTime date={...} /></p>` — no `className` passed to `RelativeTime` itself.
- `AdminListingsTable.tsx:559` — `<span className="text-muted-foreground text-xs"><RelativeTime .../></span>` — same, no `className` on `RelativeTime`.
- `ListingsTab.tsx:353` — `<RelativeTime date={listing.created_at} />` — no wrapper, no `className`.
- `AdminDashboardRecentListings.tsx:85,116` — DOES pass `className` directly to `RelativeTime` (`"text-xs text-muted-foreground hidden md:block"` / `"font-medium"`).

`RelativeTime`'s new root is `<Text component="time" inherit dateTime={...} {...rest}>` (`rest`
carries `className` through untouched for the fourth case above — confirmed by the AC9 grep
finding no literal `className=` in the file's own source, i.e. no NEW styling was added).

Two independent CSS mechanisms make the render equivalent to the pre-migration bare `<span>`:

1. `Text.css:43-47` — `[data-inherit]` (set by the `inherit` prop) explicitly overrides
   `line-height`, `font-weight` and `font-size` to `inherit`.
2. `Text.css:9` — `color: var(--text-color)`, and `Text.mjs:44` —
   `"--text-color": color ? getThemeColor(color, theme) : void 0`. `RelativeTime` never passes a
   `c`/`color` prop, so `--text-color` is left **unset**. `var(--text-color)` with no custom
   property and no fallback is a guaranteed-invalid value; for an inherited CSS property (`color`
   is one), a guaranteed-invalid value resolves to the *inherited* value, not the initial value —
   so `color` inherits from the ancestor exactly as the bare `<span>` did, even though `inherit`
   the boolean prop does not itself touch `color` in the stylesheet rule.

Net: font-size, line-height, font-weight and color all inherit from whatever ancestor
(`<p className="font-medium">`, `<span className="text-muted-foreground text-xs">`, or nothing)
wraps each call site — identical to the pre-migration `<span>`'s own bare inheritance. This is a
static-source determination from the real shipped package, not an assumption; flagged as a
limitation that it is not a live `getBoundingClientRect()`/`getComputedStyle()` reading, matching
Task 842's own precedent for the same missing-live-session gap.
