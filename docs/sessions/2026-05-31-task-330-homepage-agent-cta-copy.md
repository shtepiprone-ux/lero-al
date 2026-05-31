# Task 330 — Homepage agent CTA copy: early-launch positioning

**Date:** 2026-05-31  
**Sprint:** 30 — Wave 1 (parallel-safe)  
**Type:** UX copy / localization  

## Current behavior preserved (Notes 19/20)

Inventoried before edit — all preserved unchanged:
- Section wrapper: `py-12 md:py-16 2xl:py-20 bg-gradient-to-br from-primary/10 to-primary/5 [content-visibility:auto] [contain-intrinsic-size:auto_280px]`
- Content layout: `max-w-2xl mx-auto text-center`
- `Building2` lucide icon above `<h2>`
- `<h2>` keyed to `t('agent_cta_title')`
- `<p>` keyed to `t('agent_cta_desc')`
- `<Link href={\`/${locale}/auth/register?type=agent\`}>` with `buttonVariants({ size: 'lg' })`, `gap-2`, `data-track="register"`, `Building2` icon, `t('agent_cta_button')`
- Route, icon, tracking attribute, container, button variant — all untouched
- `src/app/[locale]/page.tsx` — zero structural change

## Files Changed

| Path | Change |
|------|--------|
| `messages/sq.json` | `agent_cta_desc` + `agent_cta_button` updated (lines 543–544) |
| `messages/en.json` | `agent_cta_desc` + `agent_cta_button` updated (lines 543–544) |
| `messages/uk.json` | `agent_cta_desc` + `agent_cta_button` updated (lines 543–544) |
| `messages/it.json` | `agent_cta_desc` + `agent_cta_button` updated (lines 543–544) |

## Translation keys updated (3 × 4 = 12 positions; 8 values changed, 4 titles unchanged)

| Key | Locale | Old value | New value |
|-----|--------|-----------|-----------|
| `agent_cta_title` | sq | Jeni agjent imobiliar? | **unchanged** (already spec-correct) |
| `agent_cta_desc` | sq | Regjistrohuni si agjent dhe postoni njoftimet tuaja falas | Bashkohuni me platformën e re të pasurive të paluajtshme në Shqipëri, publikoni prona falas gjatë lançimit të hershëm dhe përfitoni nga avantazhi i të qenit ndër agjentët e parë. |
| `agent_cta_button` | sq | Regjistrohu si agjent | Bashkohu si agjent |
| `agent_cta_title` | en | Are you a real estate agent? | **unchanged** |
| `agent_cta_desc` | en | Register as an agent and post your listings for free | Join Albania's new real estate platform, list properties for free during the early launch, and gain an advantage as one of the first agents. |
| `agent_cta_button` | en | Register as agent | Join as an agent |
| `agent_cta_title` | uk | Ви агент з нерухомості? | **unchanged** |
| `agent_cta_desc` | uk | Зареєструйтесь як агент і розміщуйте оголошення безкоштовно | Приєднуйтесь до нової платформи нерухомості Албанії, розміщуйте об'єкти безкоштовно під час раннього запуску та отримайте перевагу серед перших агентів. |
| `agent_cta_button` | uk | Зареєструватись як агент | Приєднатись як агент |
| `agent_cta_title` | it | Sei un agente immobiliare? | **unchanged** |
| `agent_cta_desc` | it | Registrati come agente e pubblica i tuoi annunci gratuitamente | Unisciti alla nuova piattaforma immobiliare per l'Albania, pubblica immobili gratuitamente durante il lancio anticipato e ottieni un vantaggio tra i primi agenti. |
| `agent_cta_button` | it | Registrati come agente | Unisciti come agente |

## Route / action preserved

`<Link href={\`/${locale}/auth/register?type=agent\`}>` — untouched. Clicking the button still navigates to the existing agent-registration screen.

## Unrelated sections

Zero changes to: Hero, Stats, Featured Listings, Latest Listings, Popular Locations, "How it works", footer, header, auth flow.

## Locale runtime confirmation (code-level)

All 4 locale files carry the correct values at lines 542–544. `next-intl` will serve each locale's copy at `/{locale}` routes. No client-side caching of string values (SSR + `useTranslations` is request-scoped).

## 14-width verification (code-level)

- Description `<p>` uses no truncation, no `whitespace-nowrap`, no `line-clamp`. Long strings in `uk`/`it` at 320px will reflow naturally within `max-w-2xl` container — no horizontal overflow.
- Button uses `size="lg"` (canonical Tailwind), `gap-2` — full hit-area maintained at all widths.
- No layout change to section container, so all 14 canonical widths (320–2560) are unaffected structurally.

## Validation results

```
tsc --noEmit → 0 errors
next lint    → 0 warnings / 0 errors
next build   → passes
```

## Acceptance criteria (Note 18 self-validation)

| AC | Status |
|----|--------|
| 8 key values updated across 4 locale files | ✅ |
| 4 title values already matched spec — no diff | ✅ |
| Key counts per locale file unchanged (no orphans / no missing) | ✅ |
| `src/app/[locale]/page.tsx` — zero structural change | ✅ |
| Route `/{locale}/auth/register?type=agent` preserved | ✅ |
| No unrelated sections changed | ✅ |
| 0 new lint errors / 0 new warnings | ✅ |
| `pnpm tsc --noEmit` → 0 errors | ✅ |
| `pnpm build` passes | ✅ |
| Session log written | ✅ |
| Backlog updated | ✅ |

Self-validation: tsc=0 errors · lint=0/0 · build=passes · AC table=all green · scope=clean
