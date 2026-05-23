# Epic T — kickoff prompts (Global UX Polish & Forms)

> Tasks 205–207. Shared hard contract: no scope change; no invented architecture; literal AC; update
> docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors; governance PASS; locale parity
> sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global Change Verification Rule;
> commit + single `git add -A` then `git log -1` (owner runs git/SQL).

## Task 205 — T.1 — Action toasts audit + implementation (Note 35)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Use the EXISTING canonical toast — do NOT add a second toast system.
Pre-read: Task 100 session log (admin save toast); the canonical toast component; docs/ui-rules.md.
Scope: audit every action a user (any role) can perform and add a consistent localized toast after it
(Save, Delete, Update, etc.). Deliver an action→toast inventory in the session log, then implement.
Acceptance criteria:
- Inventory in session log; each meaningful action shows a localized success/error toast via the canonical
  toast (× 4 locales).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: field-level validation (206).
```

## Task 206 — T.2 — Required-field validation UX: highlight + scroll-to (Note 36)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top).
Pre-read: docs/component-rules.md, docs/ui-rules.md; src/modules/listings/components/ListingFormShell.tsx,
src/modules/listings/validations/index.ts, cabinet ProfileTab.tsx, the admin edit screens; react-hook-form
usage.
Scope: on profile/listing edit (site AND admin), all required fields must be filled. On submit, highlight
empty required fields and scroll to the first invalid field (when the form scrolls). Consistent across
site + admin; localized messages × 4.
Acceptance criteria:
- Empty required fields highlighted on submit; form scrolls to the first invalid field; consistent
  site/admin; localized × 4.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: toasts (205).
```

## Task 207 — T.3 — Remove the dead "Перекласти" button (Note 2)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Global Change Verification Rule: remove dead translator code/route/strings, keep
the four catalogs in key parity.
Pre-read: Task 102 session log (Google Translate + DeepL removed); src/modules/listings/components/
ListingDescriptionTranslator.tsx; src/app/api/translate/route.ts; the listing detail page usage of the
translator; docs/ai-behavior.md.
Scope: Task 102 removed the translation APIs but the "Translate" button remains on the listing description.
Remove the button and any now-dead translator component/route/i18n keys.
Acceptance criteria:
- "Translate" button gone from the listing description; dead translator code/route removed; no orphaned/
  mismatched i18n keys across the four catalogs.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: reintroducing any translation feature.
```

## Task 213 — T.4 — Unify list/card price template: per-m² missing in List view (found 2026-05-23)

> New owner note (2026-05-23): in the listings list, the **List ("horizontal") view omits the
> price-per-m²** line that the **Card ("vertical") view shows**. Confirmed in code: `ListingCard.tsx`
> renders two layouts by `variant: 'vertical' | 'horizontal'`, and the per-m² line (`formatPrice(pricePerSqm,
> activeCurrency, locale)`, ~line 330) exists in only ONE layout block. This is a duplicated-template
> divergence — fix it by extracting ONE shared price block so it can never recur (the owner's explicit ask:
> "one correct template"). Direct follow-up to Task 176 (M.2).

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top of this file). Global Change Verification Rule: do NOT just paste the per-m² line
into the second block — extract a single shared price sub-block (price + old/strikethrough price + per-m²)
and use it in BOTH `variant` layouts so the two can never diverge again. Keep the currency correctness from
Task 176 (per-m² from `displayPrice`, label `activeCurrency`).

Pre-read: src/modules/listings/components/ListingCard.tsx (the two `variant` layout blocks — price ~188-192
and ~319-331; per-m² currently only ~329-331); src/lib/formatters.ts (`formatPrice`); Task 176 session log
(sessions/2026-05-23-task-176-price-per-sqm-currency-fix.md); docs/ui-rules.md.

Scope: extract a shared price block within ListingCard and render it in both the vertical (Card) and
horizontal (List) variants. The List view must show the per-m² line identically to the Card view, with the
same currency rules. Verify both views at all breakpoints.

Acceptance criteria:
- Both List (horizontal) and Card (vertical) views show price, old/strikethrough price, and per-m² from one
  shared sub-block; grep confirms no duplicated price-rendering blocks remain in ListingCard.
- Per-m² value derives from displayPrice and is labelled with activeCurrency (no regression of Task 176).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope: the listings filter bar; price logic outside ListingCard (detail page already fixed in 176).
```
