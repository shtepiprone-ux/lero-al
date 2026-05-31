# Sprint 30 — Task 330 kickoff (Sonnet) — Homepage agent CTA copy: early-launch positioning

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 5, 6, 6a, 7, 8, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits. Sonnet MUST NOT run git.
>
> **Numbering:** Task 330 = first direct Sonnet task in Sprint 30 (renumbered from old "329" which collided with Sprint 29 Epic Z.2 modal). Parallel-safe with Tasks 334 + 335 (disjoint file scope). Wave 1.
>
> **Source:** `issues.md` 2026-05-31 — "Update homepage agent CTA copy for early-launch positioning".

```
Type:     UX copy / localization
Priority: medium
Area:     src/app/[locale]/page.tsx (lines 125–142, Agent CTA section)
          messages/{sq,en,uk,it}.json (existing keys: home.agent_cta_title / _desc / _button)
Change:   3 keys × 4 locales = 12 string updates (NO source structure change)
```

## Pre-read (task-type bundle: "UI / layout / component task")

1. `docs/agent-contract.md` (always)
2. `docs/backlog.md` (always)
3. `docs/ui-rules.md`
4. `docs/component-rules.md`
5. `docs/qa-rules.md`
6. `docs/ai-behavior.md` → Localization (i18n) Rules + Notes 18 + 19
7. `tasks/Sprints/Sprint_30_—_Owner_Issues_2026-05-31.md` (sprint index)
8. `src/app/[locale]/page.tsx` lines 125–142
9. `messages/{sq,en,uk,it}.json` — `home.agent_cta_*` keys (Ukrainian source confirmed at `messages/uk.json` lines 542–544)

## Owner-reported problem

Current Ukrainian copy («Зареєструйтесь як агент і розміщуйте оголошення безкоштовно» / «Зареєструватись як агент») does not communicate early-launch positioning. Owner wants: new platform · free during early launch · advantage for first agents.

## Current behavior to preserve (Notes 19/20)

Inventory before edit + record in session log:
- Section wrapper classes (gradient bg, padding, content-visibility hints).
- `max-w-2xl mx-auto text-center` content layout.
- `Building2` icon (lucide-react) above title.
- `<h2>` keyed to `home.agent_cta_title`.
- `<p>` keyed to `home.agent_cta_desc`.
- `<Link href={/${locale}/auth/register?type=agent}>` with `buttonVariants({ size: 'lg' })`, `gap-2`, `data-track="register"`, `Building2` icon, `home.agent_cta_button` text.

**Every one of these MUST remain functionally identical.** Only the 3 locale key values change. Source structure, route, icon, click destination, tracking attribute, container, button variant — NOT touched. If `uk` description wraps to >3 lines at 320px, a minimum-safe wrap class on the description `<p>` is allowed.

## Required after behavior

As a guest on `/{locale}` (sq/en/uk/it), the Agent CTA section shows the new copy below + the `<Link>` still navigates to `/{locale}/auth/register?type=agent`.

## Positive flow (happy path)

1. Guest visits `https://lero.al/uk`.
2. Scrolls past Hero / Stats / Featured / Latest / Popular Locations / "How it works".
3. Reaches Agent CTA section.
4. Sees new title — **uk**: «Ви агент з нерухомості?» · **sq**: «Jeni agjent imobiliar?» · **en**: "Are you a real estate agent?" · **it**: "Sei un agente immobiliare?"
5. Sees new description — **uk**: «Приєднуйтесь до нової платформи нерухомості Албанії, розміщуйте об'єкти безкоштовно під час раннього запуску та отримайте перевагу серед перших агентів.» · **sq**: «Bashkohuni me platformën e re të pasurive të paluajtshme në Shqipëri, publikoni prona falas gjatë lançimit të hershëm dhe përfitoni nga avantazhi i të qenit ndër agjentët e parë.» · **en**: "Join Albania's new real estate platform, list properties for free during the early launch, and gain an advantage as one of the first agents." · **it**: "Unisciti alla nuova piattaforma immobiliare per l'Albania, pubblica immobili gratuitamente durante il lancio anticipato e ottieni un vantaggio tra i primi agenti."
6. Sees new button — **uk**: «Приєднатись як агент» · **sq**: «Bashkohu si agjent» · **en**: "Join as an agent" · **it**: "Unisciti come agente"
7. Clicks any part of the visible button area (text / icon / padding).
8. Browser navigates to `/{locale}/auth/register?type=agent`. Existing agent-registration screen loads (NOT changed).
9. Refresh / Back / Forward all preserve the displayed copy in the active locale.

## Negative flow (every off-happy-path branch)

| Branch | Trigger | Expected response | What is NOT done | Locale key |
|---|---|---|---|---|
| Long-string overflow at 320px in `uk` | Description wraps onto 4+ lines | Layout reflows; no horizontal page scroll; section spacing balanced | Do NOT shrink font; NO `truncate`; NO `whitespace-nowrap` | visual only |
| Long-string overflow at 320px in `it` | Italian button label may be longest | Button keeps `size="lg"`; label wraps to 2 lines if needed; full-width-capable | NO ellipsis; NO `min-w-[…]` hack | visual only |
| Missing locale key in one of 4 files | next-intl falls back to key string | **FAILURE — task incomplete; re-edit and re-ship** | Do NOT ship partial coverage | n/a |
| Footer collision below | Taller section pushes against footer | Footer sits cleanly below; `container-wide` max-width respected | Do NOT touch footer code | n/a |
| Click outside text but inside button padding | Tap on icon or empty padding | Navigation still fires (full hit-target on `<Link>` + `buttonVariants`) | Do NOT shrink `<Link>` to text-only wrapper | n/a |
| Locale switch mid-page via `LocaleSwitcher` | `uk` → `it` | All 3 strings re-render in new locale w/o reload | Do NOT cache client-side | n/a |
| Permission-denied / auth | guest clicks → goes to `/auth/register?type=agent` | Existing register screen handles guest state | NOT changed by this task | existing auth keys |
| Locale mismatch in URL (`/zz/`) | next-intl middleware handles | Middleware default behavior preserved | NOT changed | existing |
| Network offline | Page already rendered | Static text persists; navigation pending | NOT applicable to copy update | n/a |

## Required investigation

1. Open `src/app/[locale]/page.tsx`; confirm lines 125–142.
2. Open each `messages/{locale}.json`; locate `home.agent_cta_*` keys.
3. `rg -n "Ви агент з нерухомості|Зареєструйтесь як агент|Зареєструватись як агент|agent_cta_title|agent_cta_desc|agent_cta_button" src messages` — confirm keys referenced ONLY from homepage.
4. If keys reused elsewhere, update those references OR document why separate.

## Implementation requirements

- Edit ONLY: 4 locale files + (if 320px `uk` wraps badly) minimum-safe wrap class on the description `<p>`.
- Replace 3 key values per locale per "Positive flow".
- Do NOT add / delete / rename keys.
- Do NOT change `<Link>` route, icon, tracking attribute, container, or button variant.
- Do NOT change unrelated homepage sections or footer.

## Acceptance criteria

- 3 keys carry new values in all 4 locale files (= 12 string updates).
- Key counts per locale file remain identical to current (no orphans / no missing).
- `src/app/[locale]/page.tsx` Agent CTA section: zero structural change OR only minimum-safe wrap class if 320px `uk` requires.
- Runtime locale switching shows new copy in each locale (Note 19 cross-page propagation).
- Button keeps full-area click target at all widths (Note 20 + Task 339 cross-ref).
- 0 new lint errors / 0 new warnings; `pnpm tsc --noEmit` → 0 errors; `pnpm build` passes.
- All 14 canonical widths render the section without horizontal scroll / clipped text / footer collision: **320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560**.
- All 4 locales (sq/en/uk/it) verified at minimum at 320, 375, 390, 480 + 2560.
- `docs/backlog.md` "Last Session" updated.
- Session log at `docs/sessions/2026-05-31-task-330-homepage-agent-cta-copy.md` with Note 18 self-validation block + "Files Changed" table.
- Sonnet MUST NOT emit `git add` / `git commit` commands.

## Out of scope

- Do NOT redesign the homepage.
- Do NOT change "How it works", footer, header, or any other section.
- Do NOT change `/auth/register?type=agent` flow.
- Do NOT change auth / session behavior.
- Do NOT add pricing / plan / early-access logic.
- Do NOT add admin controls for this text in this task.

## Validation

```
pnpm tsc --noEmit       # → 0 errors
pnpm lint               # → 0 new errors / 0 new warnings
pnpm build              # → passes
```

Search commands (paste outputs in session log):

```
rg -n "agent_cta_title|agent_cta_desc|agent_cta_button" src messages
rg -n "Ви агент з нерухомості|Jeni agjent imobiliar|Sei un agente immobiliare|real estate agent" src messages
```

## Manual QA

- Open `/sq`, `/en`, `/uk`, `/it` at all 14 widths.
- Verify new copy in every locale.
- Click button from left padding / icon / text / right padding — confirm full-area click.
- Confirm no horizontal page overflow.
- Footer remains separated below.
- Capture notes per locale × width band.

## Final report (session log)

1. Files Changed table.
2. Translation keys updated (3 × 4 = 12 strings).
3. Final copy for sq/en/uk/it.
4. Confirmation route/action preserved.
5. Confirmation no unrelated sections changed.
6. Confirmation sq/en/uk/it verified at runtime.
7. Confirmation 14 widths verified.
8. Validation results (tsc / lint / build).
9. Backlog + session log paths.
10. Self-validation verdict line per Note 18:
    `Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS · scope=clean`

Sonnet does NOT emit `git add` / `git commit`.
