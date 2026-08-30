# Binding Decisions — durable register

> Owner and orchestrator decisions that bind future work. **Moved out of `docs/backlog.md` on 2026-08-27**
> by the row-by-row audit (`docs/chat-gpt-reports/2026-08-27-backlog-row-by-row-audit.md`): a decided decision
> is policy, not active state, and the backlog holds active state only.
>
> **A decision listed here is closed and binding.** Quote it by number in a kickoff; do not re-litigate it,
> and do not restate its text in `docs/backlog.md`.
>
> **Open, undecided decisions are NOT here.** They are live state and stay in `docs/backlog.md` until decided —
> currently **D762-3** (`--text-*` scope) and Sprint 59's unapproved D-B/D-D/D-E/D-F/D-G/D-I. When one is decided, move its text here in the same edit
> that removes it from the backlog.
>
> Related: `docs/ai-behavior.md` (executor rules), `docs/orchestrator-procedures.md` (task design, review, Git policy),
> `docs/rule-index.md` (per-task rule routing).

## Register

### D19

**D19 — CLOSED 2026-08-13 (695).** Overlay pair no longer declared in `@theme inline`; `:root` is the single source (694 no longer touches the pair — D35).

### D25

**D25** frozen Storybook preview clock.

### D26

**D26** sub-perceptual delta **≤2/255** is an attribution path under 4 conjunctive conditions only (`storybook-governance.md` §14.11).

### D27

**D27** Skeleton `::after` fill = gray-3 `#d0d5dd`, token not hex.

### D28

**D28** (2026-08-01) de-hybrid = **mechanism-only, zero visual delta**; authorizes no restyle, token, spacing or typography change.

### D32

**D32** a migration may not be proven against a comparator not shown to fail.

### D33

**D33** re-anchor a gate onto a de-Tailwind-stable hook, never another utility class.

### D34

**D34** (2026-08-05) a D28 module reproduces the utility's cascade **layer** — wrap in `@layer utilities`; the inverse 602/629/650/651/653/654/656 family stays **unlayered** on purpose (a migration reproduces; a cascade-trap fix overrides).

### D35

**D35** (2026-08-10, owner) **a `@theme inline` value that feeds an opacity-modifier static fallback may not be aliased to a runtime `var()`.** Measured on the repo's own `tailwindcss@4.3.0`: `--overlay: var(--mantine-color-black)` collapses `.bg-overlay\/30{background-color:#0000004d}` to a bare `var(--overlay)` — Task 690's regression exactly, compound-selector collapse included, across **12** opacity-modifier utilities. This is why 694's original alias scope is closed, not deferred. The 660/661 alias convention is unaffected: `--brand-*` lives in `:root`, never `@theme`, and the built CSS has **zero** `bg/text/border-brand-*/NN` utilities — the convention has never once been applied to a token consumed with an opacity modifier.

### D36

**D36** (2026-08-10, owner) **691 is allowed to run; the perf gate is "no increase", not "no excess".** Owner's reasoning, recorded because it corrects a category error the backlog carried for weeks: 691 is a mechanical de-Tailwind of an already-`'use client'` `MantineListingCardPattern` — it adds **no new client boundary and no new page dependency**; the barrel suspicion is still only `NEEDS VERIFICATION — not blocking`; and **185 kB shared JS and 618 kB route First Load JS are not comparable quantities**, so their difference was never a valid pre/post base for 691. Blocking a local, visually-risky refactor on an unattributed pre-existing number also freezes **741** and **695** with no guarantee of any perf benefit. **Condition:** record `/[locale]` First Load JS before and after, stop 691 on any increase. The route-specific client JS above shared — **435 kB measured**, not the ~433 kB estimated — is a separate attribution problem, filed as **744**. *(Both figures in the owner's statement were re-measured against the build at `0dac78755`: route **619 kB**, shared **184 kB**. The condition binds to the I0 re-measurement, never to a number quoted from a document.)*

### D37

**D37** (2026-08-11, owner) **one passing re-run does not retro-explain a failing one.** When a rendered cell fails once and passes on re-run, the acceptance criterion closes on the **result of the final run**, not "with a changed set documented as a flake". The first artifact is preserved and labelled **`UNATTRIBUTED`**: a single passing repeat demonstrates instability, it does **not** establish the mechanism, and naming a mechanism it did not measure is the same substitution of hypothesis for evidence that a comparator exists to prevent.

### D63-B

**D63-B — APPROVED AND RETIRED 2026-08-27 (owner).** The homepage de-Tailwind claim is bounded to one sentence and
nothing more: **"Task 766 gate: 0 static utility literals in its 3 guarded files."** That is a gate result over three
named files. It is **not** route certification, **not** homepage completion, and **not** evidence that `/[locale]` is
independent of Tailwind. Do not restate it in a wider form, and do not cite it as coverage of anything the gate does
not read. The decision that raised it — whether the stale "✅ COMPLETE" phrasing should be corrected immediately or at
phase closure — is answered: it was corrected immediately, and the decision is retired.

### D65-A

**D65-A — CLOSED 2026-08-27 (owner).** `PerfDevOverlay` is excluded from the Homepage **production visual and
functional exit criterion**: it has no intended production UI. This is not an exemption from production-bundle hygiene
or global Tailwind retirement. The production build measured for this decision still contains the overlay's client module
and CSS in the `/[locale]` layout graph even though the compiled component returns `null`; a static import plus a
runtime `NODE_ENV` guard is therefore not evidence of zero production cost. No Sprint 65 task may alter the overlay.
Any future remediation is a separate developer-tooling task: the server layout must not statically import the overlay;
a small Client Component may load it only in development, and the task must prove after `next build` that the overlay
module and CSS are absent from the `/[locale]` production client graph while `next dev` still renders it. Do not enable
the overlay in production through a public environment flag, and do not call the current implementation "stripped from
production bundles" until that artifact proof exists.

## Owner decision pass — 2026-08-27

Ten decisions were executed as one documentation pass. Those that bind future work live in their owning documents;
this list exists so the pass is traceable from one place.

| Decision | Binding outcome | Where it lives |
|---|---|---|
| D63-B | Approved and retired; the claim is bounded to the Task 766 gate sentence | This file, above |
| Sprint 63 | Closed **SUPERSEDED / REPLANNED** — not "fully delivered" | `docs/backlog-archive.md` · the sprint file |
| Sprint 64 | Closed **DELIVERED**; residual notes belong to Task 743 | `docs/backlog-archive.md` · the sprint file |
| Epic MM | Tracker and epic file **HISTORICAL**, never refreshed; live work = `docs/backlog.md`, file-level reference = `docs/mantine-responsive-design-system.md` | Both files carry the banner |
| Route-composition CI · Sprint 59 · Task 667 | Accepted as a known limitation; sprint closed, 667 retired; **task-scoped route evidence** replaces any global CI claim | `docs/maintenance-playbook.md` §14.3 |
| HIBP | Deferred until a Supabase Pro upgrade; no code work, no custom workaround | `docs/integrations.md` |
| Notification localization | Narrowed to one owner QA action with an explicit PASS/FAIL disposition | `docs/backlog.md` → Pending Action Items |
| `/listings` mobile overflow | Filed as **Task 772** in **Sprint 66**, scoped to `ListingsSortBar` mobile layout only | `tasks/Sprints/Sprint_66_*` |
| Task 313 | Approved to start **only** under the five-clause schema contract, once the owner signs it | `tasks/Epics/Epic_HH_Admin_UX_System.md` |
| Task 689 | Acknowledged retired; no task, no review, no new evidence | `docs/backlog-archive.md` |

### D775-A

**D775-A = A2 — CLOSED 2026-08-30 (owner, Task 775).** A migrated public surface expresses its page gutter in
**Mantine responsive props only**, on this theme's breakpoints, with the top step at **`xxl = 1440`**. **1536 is not
used anywhere** — not as a Mantine breakpoint, not as a CSS-module media query, not as a literal. `max-width` comes
from the registered root token `var(--width-page-max)` (`globals.css:299`). Rejected: **A1**, a component CSS module
reproducing `.container-wide`'s ladder, and **A3**, keeping `className="container-wide"` — *"вони тягнуть legacy
Tailwind container/breakpoint у новий Mantine-компонент"*. The consequence is bounded and accepted: because
`.container-wide` steps to 3rem at 1536 and the Mantine ladder steps at 1440, a migrated surface pads **3rem where
the legacy markup padded 2rem across 1440–1535px** — *"усвідомлений результат міграції на Mantine, не регресія"*.
Second-order effect, recorded when the decision was applied: `HeaderView.tsx:114` and `FooterView.tsx:69` still carry
`.container-wide`, so in that same band a migrated page's content column no longer aligns with the site chrome,
against `docs/design-system.md:155`. That divergence is accepted until the header and footer migrate; Task 775
measures and reports it. Its `2rem` and `3rem` steps are supplied by **D775-C**.

### D775-B

**D775-B = B2 — CLOSED 2026-08-30 (owner, Task 775).** Migrated breadcrumb chrome takes the **measured TailAdmin
contract** (`docs/tailadmin-style-reference.md` §6d `:154`-`:156`, measured row `:453`): **14px**, link **gray-500**,
current page **gray-800**, separator **gray-400**, gap **6px**. Rationale: it is the only route under which migrated
chrome has TailAdmin provenance (`agent-contract.md` 16). Rejected: **B1**, preserving the legacy 12px /
`--muted-foreground` deviation inside a new Mantine component. Consumption is **token, not hex** (**D27**): the three
values are already the registered theme tuple `gray.4` / `gray.5` / `gray.8` (`theme.ts:5`-`:16`), and 14px is
`fontSizes.sm` (`:222`), i.e. `Breadcrumbs size="sm"` — a raw hex or raw px in a consumer is a violation, not a
shortcut. Scope, owner, same date: `/favorites` (`page.tsx:72`) and the listing detail page
(`ListingDetailView.tsx:190`) keep the legacy breadcrumb until their own migration; the resulting temporary
difference between those routes and `/listings` is accepted, not a defect.

### D775-C

**D775-C = C1 — CLOSED 2026-08-30 (owner, Task 775).** The Mantine spacing scale gains two semantic keys —
**`2xl: '2rem'`** and **`3xl: '3rem'`** — so a migrated public surface expresses its page gutter as the Mantine token
ladder **`md → xl → 2xl → 3xl`**, with **no raw values, no `design-tokens-allow:` markers and no Tailwind variables**.
The keys are declared **natively in the Mantine types** via `declare module '@mantine/core'` augmenting
`MantineThemeSizesOverride.spacing` with all seven keys (owner: *"краще використовувати рідні Mantine ключі spacing у
типах"*); omitting a default key would retype `theme.spacing` for every existing consumer. Rejected: **C2**, raw
values plus gate markers — *"створює постійний виняток у новому Mantine surface"*; **C3**, `--space-8`/`--space-12` —
*"повертає залежність від Tailwind-token layer"*, and those names live inside `@theme inline` (`globals.css:35`,
`:132`-`:140`), the family Sprint 62/65 is retiring. Verified in the installed framework before adoption: custom
spacing keys are emitted as CSS variables (`default-css-variables-resolver.mjs:85` iterates the whole `theme.spacing`
object) and resolve through `spacing-resolver.mjs`. **Known limit, not a defect:** `_MantineSpacing` keeps an
unconditional `| (string & {})` member (`theme.types.d.ts:138`-`:140`), so the augmentation gives autocomplete and one
declared source of truth but does **not** reject a mistyped key — a typo compiles and silently renders a raw length.
A rendered assertion, not the type, is the guard.
