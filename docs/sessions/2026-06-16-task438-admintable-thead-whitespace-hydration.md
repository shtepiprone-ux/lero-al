# Task 438 — Remove whitespace text node in AdminTable `<thead>` (hydration fix)

**Applied by:** Opus orchestrator, with explicit owner authorization for `src/components/admin/AdminTable.tsx`
this session (2026-06-16). **Type:** one-character JSX fix. **Origin:** the "AdminTable whitespace" hydration issue
that Task 434 was reframed away from ("supersedes the 'AdminTable whitespace' framing" — backlog numbering note);
resurfaced as a real, reproduced bug, so it gets its own task number (438).

## Summary

After Task 433 unblocked the build, `/admin/users` threw a React hydration error (owner native, 2026-06-16):

> In HTML, whitespace text nodes cannot be a child of `<thead>`. Make sure you don't have any extra whitespace
> between tags on each line of your source code. This will cause a hydration error.

Root cause: `src/components/admin/AdminTable.tsx:152` had a literal space between the `<thead>` tag and a trailing
JSX comment:

```jsx
<thead className="sticky top-0 z-[2] bg-card"> {/* design-tokens-allow: z-[2] … */}
```

JSX preserves that space as a `{" "}` text node, and a text node directly inside `<thead>` is invalid HTML →
hydration mismatch. It only surfaced now because the page could not render at all while the CSS was broken
(Task 433).

## Fix

Removed the single space so the comment sits flush against the tag (a JSX comment renders nothing → no text node).
The `design-tokens-allow: z-[2]` marker stays on the same line, so the design-token lint suppression is preserved.
No other logic, markup, or styles touched.

```jsx
<thead className="sticky top-0 z-[2] bg-card">{/* design-tokens-allow: z-[2] … */}
```

## Verification

- Owner native (2026-06-16): `/admin/users` renders, the table displays, and the `<thead>` whitespace hydration
  error no longer appears in the console.
- (Benign: `git` reports `CRLF will be replaced by LF` on this file — line-ending normalization per the repo's
  `.gitattributes`, not a content change.)

## Scope boundaries (per owner directive, 2026-06-16)

This is ONLY the AdminTable `<thead>` whitespace fix. NOT included: Task 433 globals.css fix, Task 434 date-format
hydration work (`AdminUserProfile.tsx`, `src/lib/formatters.ts`), the Task 427 kickoff, or the prior uncommitted
`docs/backlog.md` edits.

## Files Changed

| File | Change |
|---|---|
| `src/components/admin/AdminTable.tsx` | Removed the single whitespace char between `<thead …>` and its trailing `{/* … */}` comment (hydration fix). |
| `docs/sessions/2026-06-16-task438-admintable-thead-whitespace-hydration.md` | New session log (this file). |

> `docs/backlog.md` entry for Task 438 (and the new Task 439 for the admin-profile <640 overflow) is handled by the
> orchestrator natively against confirmed content, separately from this commit.
