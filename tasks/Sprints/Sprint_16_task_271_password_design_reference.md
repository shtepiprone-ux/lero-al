# Task 271 — Password UX Design Reference

> Visual reference for Task 271 (Sprint 16 — "Password UX refactor: canonical
> `<PasswordInput>` + live requirements hint + drop confirm-password fields"). Owner
> provided a mockup screenshot on 2026-05-28; the screenshot itself is not in the repo
> (pasted as an inline image), so this file captures the visual pattern in writing for
> the executor to follow.

## Overall layout (form-level)

- Single password input field — full-width within the form column.
- Eye / hide-eye icon button positioned at the right edge of the input (vertically
  centered). Toggles `type="password"` ↔ `type="text"` on click.
- Below the input (vertical gap = canonical helper spacing): the five-rule list with
  per-rule live indicator.
- Below the list (vertical gap = canonical form spacing): the form CTA button.
- NO confirm-password field. The show-password toggle replaces the confirm pattern as
  the typo-prevention mechanism (owner directive 2026-05-28).

## Input border + helper text states

| State | Trigger | Border | Inline helper text |
|---|---|---|---|
| Empty / pristine | Field has not received input yet | Neutral / default token (existing `<Input>` border color) | None |
| Typing — at least one rule failing | User has typed but ≥1 rule is unmet | Error / coral token | Localized error line below the input (e.g. "Please strengthen your password to meet all requirements") |
| All rules met | All 5 rules pass live-validation | Success / green token | None (per-rule indicators communicate the success state) |

The border color and helper text MUST use existing design tokens — no hardcoded hex.
Look up the canonical error and success border tokens in `docs/ui-rules.md` / Tailwind
config; if no success border token exists for inputs, STOP & ASK before inventing one.

## Per-rule indicator list (the live hint)

Five rules, in this order:

1. **At least 8 characters**
2. **One uppercase letter**
3. **One lowercase letter**
4. **One number**
5. **One special character (!@#$%*=)** — the parenthetical inline-lists the allowed symbols
   so the user knows exactly which characters count.

Each row in the list:

- Small icon at the start (16–20 px / canonical icon size for helper context).
- Text label after the icon (helper-text typography per `ui-rules.md` § Typography).
- Icon + text color are coupled:
  - Rule **unmet**: muted grey icon (e.g. `text-muted-foreground` / X-mark icon) + muted
    grey text. Do NOT use the error / coral color for unmet rules in the pristine state —
    the unmet state is informational, not destructive.
  - Rule **met**: success / green icon (e.g. `text-success` / check-mark icon) + same
    success color for the text label.
- Icon choice from `lucide-react` (per `ai-behavior.md` — lucide only):
  - Met: `Check` (or `CheckCircle2` if a circular variant looks better at small size).
  - Unmet: `X` (or `Circle` for a lower-intensity look).
  - Pick ONE pair and use it consistently — do not mix `Check` with `Circle`.

Spacing between rule rows: tight (e.g. `gap-1` / `space-y-1` per canonical spacing scale).

## CTA button state

- Default (form invalid): button rendered in disabled visual state (`disabled` attribute
  + muted background per canonical disabled button styling). Click is blocked at both
  the HTML level and the form-submit level.
- Form valid (all 5 rules + any other field requirements pass): button enabled, brand
  background color, click submits the form.

This is the existing button-disabled pattern in the project — do NOT invent a new disabled
treatment. Look at how the current signup button handles its disabled state and mirror it.

## Show / hide password toggle (eye icon)

- Position: right side of the input, vertically centered, inside the input's padding
  area (not breaking out of the border).
- Icon: `Eye` (password hidden / default state) ↔ `EyeOff` (password shown). lucide-react.
- Hit target: must satisfy mobile touch-target rules (`min-h-[44px]` / `min-w-[44px]` per
  `ui-rules.md`). The visible icon is smaller but the click area is full 44×44.
- Accessibility:
  - `<button type="button">` (NOT `<button>` without type — would submit the form).
  - `aria-label` with localized text ("Show password" / "Hide password" — translated to
    ×4 locales).
  - `aria-pressed` reflects the current state.
  - Focus ring per the canonical button focus pattern.
- Behavior: clicking toggles the input `type` between `"password"` and `"text"`. The
  hint list below the input does NOT depend on this state — it shows live rule status
  based on the input value, regardless of mask state.

## Mobile / responsive

The reference mockup is iPhone-sized (≈ 390 px) but the pattern must work down to 320 px
in `uk` (longest strings):

- The rule list text must wrap to a second line gracefully if a translated string is too
  long — do NOT truncate; the helper text is informational and truncation defeats its
  purpose.
- The eye-icon button must remain inside the input border at 320 px (no overflow).
- The CTA button stays above the fold on a 320 px viewport (after the input + helper
  error text + 5-rule list); if it falls below the fold, reduce the list's vertical
  spacing, do NOT shrink the input.

At 2560 px the form column stays at its canonical max-width — the password input does
NOT stretch full-screen.

## Locale notes

- The five rule labels need ×4 locale keys (sq / en / uk / it).
- The special-character parenthetical `(!@#$%*=)` is LITERAL — same in all four locales,
  not translated.
- The error helper text ("Please strengthen your password to meet all requirements" or
  similar) also needs ×4 locale keys.
- The eye-icon `aria-label` ("Show password" / "Hide password") needs ×4 locale keys.

## What the reference mockup shows that is OUT OF SCOPE here

The mockup shows two phone screens for a fictional "Rivora" app:

- A "Re-enter password" second field below the primary input — IGNORE per owner directive
  2026-05-28. Drop confirm-password fields everywhere they exist in this project.
- A page indicator dots at the bottom — IGNORE; not part of the password component.
- Specific brand colors (purple/coral) — IGNORE; use the project's existing design tokens
  (brand accent `#EC5447` from `BaseEmail.tsx`, etc.).
- Specific font ("Rivora" handwritten logo, etc.) — IGNORE; project uses its existing
  typography per `ui-rules.md`.

The reference is for the PATTERN (live ✓/✗ rule list, input border color states, eye
toggle, inline special-character listing, CTA enable/disable), not the brand styling.
