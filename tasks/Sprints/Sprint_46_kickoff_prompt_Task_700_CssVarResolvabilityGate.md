# Task 700 — custom-property resolvability gate (Sprint 46.3)

**Kickoff path:** `tasks/Sprints/Sprint_46_kickoff_prompt_Task_700_CssVarResolvabilityGate.md`
**Sprint:** 46 — ListingCard de-Tailwind + overlay exit, order **46.3**
**Executor:** Sonnet, via `.claude/skills/execute-task/SKILL.md`
**Filed:** 2026-08-10, after 702 landed as the sprint's second task
**Revised:** 2026-08-10 (**draft 3**) — see §0.2 and §0.3. Drafts 1 and 2 were both rejected in owner review
before handoff.

---

## 0. Read this before anything else

### 0.1 This task was re-scoped before it was written

`docs/backlog.md` reserved 700 as: *"General `@theme`-dependency gate: fail when a `.module.css` consumes an
`@theme` var whose last Tailwind-utility consumer disappears."*

**That hazard does not exist in this repository.** It was measured against the real production bundle and falsified
(§3.1). Writing the reserved gate would have shipped a gate that cannot fail — the defect Sprint 54 rejected three
tasks for. The owner authorized the re-scope on 2026-08-10 after seeing §3.1.

### 0.2 Draft 1 was rejected, and its four defects are the reason this document exists

Owner review, 2026-08-10, before handoff. **All four were confirmed by re-measurement; none was drift.**

| # | Draft-1 defect | Correction |
|---:|---|---|
| **D1** | **The gate could not catch its own motivating example.** Draft 1 scanned only the shipped CSS, yet Task 690's `var(--color-overlay*)` consumers live in **TSX inline styles** — `LightboxView.tsx:45` and `MantineListingGalleryPattern.tsx:91`. If those aliases lost their declaration, no CSS reference would remain, and the gate would pass green on the exact regression it cited. | The gate gains a **second arm** over project source (§3.5). **16** owned tokens are referenced *only* from `.tsx`/`.ts` — including both overlay tokens. Plant **P3** targets `--color-overlay-foreground` specifically (§10.7). |
| **D2** | **A measured error in the base numbers.** `globals.css:148` contains the text `--spacing-N: var(--space-N)` **inside a comment block** (`:147-150`). Draft 1's parser counted it as a declaration. | Corrected throughout: `@theme` **190** (not 191), dropped **140** (not 141), owned **259** (not 260). AC3's "260" would have failed any correct implementation — the requirement contradicted R4. |
| **D3** | **The stale-build guard was too narrow.** It compared the bundle only against `globals.css`, so editing any `.module.css` after a build left the gate reading stale CSS and passing. | The guard now compares against **every scanned input** (§5 A1, R1). |
| **D4** | **No input seam.** §10 demanded temp-copy plants but defined no way to point the script at one, making the negative runs unverifiable. | `--css-dir`, `--globals-path`, `--src-dir` are now required flags (§10.3, R11). |

**A fifth, found while re-measuring D2's blast radius:** draft 1 claimed *"19 vars are kept alive solely by a
`.module.css`"*. The correct figure is **11** — the 19 counted tokens whose only *source* reference is a module,
which silently included tokens like `--space-6` that have real Tailwind utility consumers. §3.1 now states 11 and
says how it was derived.

**Draft 1 also over-claimed coverage of "future dynamic `var()`".** A text scan cannot see `var(--${name})`. That
claim is withdrawn and replaced with something the gate can actually enforce: an assertion that **zero** dynamic
construction sites exist (§3.4, R6), which is the measured state today.

**D2 is the sharpest defect of the series: the document required the executor to strip comments before scanning (R4)
while its own numbers came from a parser that did not.**

### 0.3 Draft 2 was also rejected — two P0 and two P1, all confirmed by re-measurement

| # | Draft-2 defect | Correction |
|---:|---|---|
| **E1** `P0` | **R6/AC5's baseline was wrong, and its plant did not exercise the real class.** §3.4 claimed **0** dynamic `var()` sites. There are **8**, all `var(--mantine-color-${color}-N)` — `theme.ts:759,766,767,869,870,886`, `MantineDropdownMenu.tsx:150`, `MantineNotificationPattern.tsx:92`. Draft 2's regex only matched interpolation *immediately* after `var(` or `--`. Its plant `var(--${x})` therefore tested a shape that does not occur. | §3.4 rewritten: raw baseline **8**, *scoped* baseline **0**, with the scoping rule stated exactly. The plant now uses an in-class prefix (§10.7 P4). |
| **E2** `P0` | **P3 was impossible to execute literally.** It ordered removal of `--color-overlay-foreground` from `@theme inline` **and `:root`**. That property is declared only once, at `globals.css:85`; `:root:471` declares `--overlay-foreground`, a **different name** with live CSS `var()` consumers. Following the instruction would have broken Arm A's required silence. | §10.7 P3 now removes **only** the `@theme` alias, and forbids touching `--overlay-foreground`. |
| **E3** `P1` | **Arm B's count contradicted its own glob.** `src/**/*.{module.css,tsx,ts}` yields **54** owned names; the measured **55** came from also reading the non-module `input-chrome.css:273`, which contributes `--color-input`. | Glob widened to `src/**/*.{css,tsx,ts}` minus `globals.css` — `input-chrome.css` is a real project stylesheet with real consumers, so widening is correct and **55** stands. Freshness scope widened to match. |
| **E4** `P1` | **Comment stripping was under-specified.** Only the `/*…*/` form was named, but one of the gate's own control cases is a **line** comment: `theme.ts:280` carries `var(--button-hover, …)` after `//`. | R4 now requires a tokenizer handling block, line and JSX comments for TS/TSX, with string-literal awareness (`https://` must not be read as a comment), and a unit test per form. |

**Nine consecutive kickoffs have now shipped a factual defect; three of the last four were caught in this document
before handoff.** Every defect in both rounds was a *derived* claim about what another file does. Treat every number
below as hostile (§14.9).

---

## 1. Mode and task type

Implementation task. Type: **Governance / CI gate** — authors a new blocking check. No product code, no UI.

D28/D34 do not bind this task; it changes no styles. **M1/M2/M4/M5 binds it hard:** a gate is not delivered until it
has been shown failing on planted violations and passing on controls.

---

## 2. Objective

Add `scripts/check-css-var-resolvability.mjs` and wire it into CI so that **every reference to a project-owned
custom property resolves to a declaration that ships** — whether the reference is written in CSS or in a TSX
runtime style. Baseline is **0** violations, and the gate must be proven able to fail.

Two arms, because one is not enough (§0.2 D1):

- **Arm A — shipped CSS.** Every `var(--owned)` in `.next/static/css/*.css` resolves to a shipped declaration.
- **Arm B — project source.** Every `var(--owned)` written in `src/**/*.{css,tsx,ts}` (excluding `globals.css`,
  which is the ownership source) resolves to a shipped declaration. This is the arm that sees `LightboxView.tsx:45`,
  and the only one that would have caught Task 690. **The glob is `.css`, not `.module.css`** — §0.3 E3.

Explicitly **not claimed:** this gate does not resolve dynamically-constructed variable names. It reports only those
whose literal prefix could name an owned token, and asserts that count stays at **0** (§3.4).

---

## 3. Verified context

Every figure below was re-measured on **2026-08-10** with **comments stripped** (`/\*.*?\*/`, dot-matches-newline)
against `.next/static/css/*.css` from the build at `0dac78755` — 6 files, `e55fe1d775976885.css` = Tailwind's own
output, `fa22169bb7793d5f.css` = the CSS-Modules chunk — and against `src/app/globals.css`. Only documentation files
have changed since that build, so the bundle is current for these counts.

**Re-derive all of it before writing code** (§10.1). This kickoff's own numbers are not exempt; §0.2 D2 exists
precisely because draft 1's were wrong.

### 3.1 The reserved premise, falsified — Tailwind v4 keeps a `@theme` var alive for ANY static `var()` reference

`globals.css` declares **190** custom properties in theme blocks: **189** in `@theme inline` (`:41`) and **1** in the
plain `@theme` at `:31` (`--breakpoint-notification-compact`).

| | count |
|---|---:|
| declared in `@theme` / `@theme inline` | **190** |
| emitted in the shipped `@layer theme` | **50** |
| **dropped** (tree-shaken away) | **140** |
| dropped **that have any `var()` reference in `src/`** | **0** |

Tree-shaking is real and aggressive — 140 of 190 are gone. But **not one** dropped variable is referenced by anything
in `src/`. Conversely, **11** emitted theme variables appear in `var()` form **only** in the CSS-Modules chunk and
never in Tailwind's own output — i.e. they have no utility consumer at all and are kept alive purely by a
`.module.css` reference: `--color-badge-premium`, `--color-muted-foreground`, `--shadow-listing-card-elevation-lg`,
`--space-2-5`, `--text-2xs`, `--text-sm`, `--text-sm--line-height`, `--text-xl`, `--text-xl--line-height`,
`--text-xs`, `--text-xs--line-height`. *(Derivation: `var(--x)` absent from `e55fe1d775976885.css` and present in
`fa22169bb7793d5f.css`. Draft 1's "19" used a weaker test and is superseded — §0.2.)*

**Two natural experiments already in the repo settle this without a test build:**

| Tokens | `var()` references in `src/` | Shipped? |
|---|---|---|
| `--space-0-5` · `--space-1-5` · `--space-3-5` | none | ❌ dropped |
| `--space-2-5` | exactly one, `FooterView.module.css` | ✅ emitted |
| `--text-2xl` · `--text-3xl` · `--text-4xl` · `--text-5xl` | `page.tsx` | ✅ emitted |
| `--text-2xl--line-height` and its three companions | none | ❌ dropped |

Four identically-shaped spacing tokens differing only in whether one file names them. **A `.module.css` reference is
itself a consumer**, so the reserved hazard cannot occur.

**Control, confirming `inline` semantics rather than assuming them:** `--color-status-info` is dropped, yet
`bg-status-info/80` works, because `@theme inline` substitutes the value —
`.bg-status-info\/80{background-color:var(--status-info)}`, the `:root` token, not the `--color-*` alias. This
corrects **Task 702 §3.6**, which listed `--color-status-info`/`--color-status-rented` as *"safe, 9 consumers"*: they
are safe because nothing needs them, not because consumers keep them. State this in the report; **741** inherits it.

### 3.2 The hazard that IS real — and why Arm B is mandatory

Retention depends on Tailwind's scanner seeing the literal text `var(--x)` in a scanned file. What hides that text:

- **`@source not` exclusions.** `globals.css:11-25` excludes `docs/`, `tasks/`, `scripts/`. The `scripts/` exclusion
  (Task 696) was added *because* `scripts/__tests__/` naming a utility literally could keep it alive after its last
  real consumer was gone — the comment at `:20-24` names this task as the intended detector.
- **Task 690's measured regression**, in `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` and summarized
  at `globals.css:70-81`: non-Tailwind `var(--color-overlay*)` consumers went stale when no `bg-overlay*` utility
  survived. D19 fixed it by *duplicating* the pair into `:root` — a manual belt-and-braces nothing verifies.

**Those consumers are TSX, not CSS**, which is exactly why draft 1 failed:

```
LightboxView.tsx:43-49   const LIGHTBOX_ACTION_ICON_STYLE = { … '--ai-bg':
                           'color-mix(in oklab, var(--color-overlay-foreground) 10%, transparent)', … }
MantineListingGalleryPattern.tsx:91   <Text … c="var(--color-overlay-foreground)">
```

Both reach the DOM as runtime inline styles and appear in **no** CSS file, shipped or authored. **16** owned tokens
are in this position — referenced only from `.tsx`/`.ts`, invisible to any CSS-only scan:

`--color-overlay` · `--color-overlay-foreground` · `--color-status-success` · `--color-status-warning` ·
`--home-section-py-base/-md/-lg` · `--listing-gallery-h-mobile/-tablet/-desktop` · `--radius-md` · `--space-24` ·
`--text-2xl/-3xl/-4xl/-5xl`

All 16 resolve today. None would be missed by Arm B; all 16 would be missed by Arm A alone.

### 3.3 Why the naive gate is unusable — measured, not guessed

Across the six shipped CSS files: **698** `var()` references without a fallback, **232** with one, **1178** declared
properties, **80** `@property` registrations. A naive "every `var()` must resolve" gate reports **112 violations on a
clean tree**, and every one is a Mantine runtime variable set through inline styles: `--app-shell-navbar-width`,
`--slider-thumb-size`, `--table-max-height`, `--tabs-color`, `--mantine-color-brand-0…9`, and 100 more.

**Ownership must therefore scope the gate, and must be computed, not listed** — the 724 F1 / 740 rule. Computable
definition: **a name is owned iff `src/app/globals.css` declares it** (comments stripped). That yields:

| | count | unresolved |
|---|---:|---:|
| owned names | **259** | — |
| owned referenced in shipped CSS (Arm A) | **78** | **0** |
| owned referenced from `src/**/*.{css,tsx,ts}` (Arm B) | **55** | **0** |

**Baseline on both arms: 0.** That is the number the gate must reproduce.

**Arm B's glob is load-bearing and was wrong in draft 2** (§0.3 E3). `src/**/*.{module.css,tsx,ts}` yields **54**;
the 55th is `--color-input`, referenced from `src/design-system/mantine/input-chrome.css:273` — a real project
stylesheet that is not a CSS Module. Scanning every `.css` under `src/` except `globals.css` is the correct scope
and the one this document specifies. If the executor's count comes out 54, the glob is too narrow, not the number.

### 3.4 Dynamic construction — scoped assertion, not resolution

A text scan cannot resolve `var(--${name})`. **Draft 2 claimed 0 such sites; there are 8** (§0.3 E1), because
interpolation need not follow `--` immediately:

```
theme.ts:759,766,767,869,870,886      `var(--mantine-color-${color}-5)` and siblings
MantineDropdownMenu.tsx:150           `var(--mantine-color-${item.color}-6)`
MantineNotificationPattern.tsx:92     `var(--mantine-color-${color}-…)`
```

**All 8 share the literal prefix `--mantine-color-`, and no owned name begins with it** — measured: zero of the 259
owned names start with `--mantine`. They are Mantine runtime colours and are none of this gate's business.

**The rule, stated exactly.** For each dynamic site, take the literal text between `var(--` and the first `${` and
call it the *prefix*. Report the site **iff some owned name starts with that prefix**. So `--mantine-color-` is
ignorable, while `--space-`, `--color-` and `--text-` are reportable, because owned names begin with each.

| | count |
|---|---:|
| dynamic `var()` construction sites, raw | **8** |
| of those, whose prefix could name an owned token — **the gate's baseline** | **0** |

The gate asserts the scoped zero. A site that could produce an owned name is unresolvable by any static analysis, so
the gate fails and a human decides. This replaces draft 1's withdrawn coverage claim (§0.2) and draft 2's wrong
baseline (§0.3 E1).

### 3.5 Three parser requirements, all found by measurement

1. **Strip comments before scanning — both arms, and all three comment forms.** This is what draft 1's own numbers
   got wrong (§0.2 D2), and it is why six names look like unresolved references while existing only in prose:
   `--spacing-N` (`globals.css:148`, block), `--ai-bg` (`LightboxView.tsx:33`, block), `--sc-label-color`
   (`input-chrome.css:311`, block), `--tabs-color` (`input-chrome.css:349`, block), `--mb-z-index`
   (`ListingGallery.portal.smoke.test.tsx:107`, block), and **`--button-hover` (`theme.ts:280`, a `//` LINE
   comment)**.

   **A `/\*.*?\*/` regex is not sufficient** (§0.3 E4). CSS has only block comments, but TS/TSX carries block, line
   and JSX (`{/* … */}`) forms, and a naive `//` strip corrupts string literals — `https://`, protocol-relative URLs,
   regex literals. Use a small tokenizer that tracks string/template/regex state, or an existing parser. Each form
   needs its own unit test (AC4).
2. **`@property`-registered names are resolvable with no declaration.** 80 of them, including the `--tw-shadow` /
   `--tw-ring-*` family `ListingCard.module.css` and `MobileBottomNavView.module.css` depend on (Task 702 C1). Miss
   this and the gate false-positives on landed D28 work.
3. **Arm B must read TSX string literals, not just CSS syntax.** `c="var(--color-overlay-foreground)"` and
   `'--ai-bg': '… var(--color-overlay-foreground) …'` are both plain strings inside TSX.

### 3.6 Where it runs in CI — measured, no new build

`.github/workflows/governance-pr.yml` has four jobs. Three (`rendered-proof`, `homepage-grid`, `locale-leak`) run
`build-storybook`; `governance` runs no build. **`click-shield` is the only job that runs `npm run build`**
(`:306`), so it is the only workspace containing `.next/static/css`. Add the step there, after the build and before
the server start. **No new job, no second build** — the constraint Task 701 was held to.

### 3.7 Precedent to copy

- `scripts/check-homepage-grid.mjs` — the `--verify-gate` self-test convention and its provenance-comment style.
- `scripts/check-design-tokens.mjs` — strict/report split, violation-report format, and the `0 stale-marker` idea
  (a gate should report its own dead configuration).
- `scripts/__tests__/` — the unit-test location the `governance` job already runs (`:39`).

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §2 Arm A | Every `var(--owned)` in the shipped CSS resolves to a shipped declaration or an `@property` registration | P0 | AC1 | Confirmed |
| R2 | §2 Arm B, §3.2 | Every `var(--owned)` written in `src/**/*.{css,tsx,ts}` except `globals.css` resolves the same way | P0 | AC2 | Confirmed |
| R3 | §3.3 | Ownership computed from `globals.css` at run time — **no hardcoded list, no allowlist file**; an empty owned set exits non-zero | P0 | AC3, code inspection | Confirmed |
| R4 | §3.5.1 | Comments stripped before scanning on both arms, covering **block, line and JSX** forms without corrupting string/template/regex literals | P0 | AC4 | Confirmed |
| R5 | §3.5.2 | `@property --x` counts as a declaration | P0 | AC4 | Confirmed |
| R6 | §3.4 | Dynamic `var()` sites are reported **iff** their literal prefix could name an owned token; raw count **8**, scoped count **0**, and a new in-class site fails the gate | P1 | AC5 | Confirmed |
| R7 | §3.1/§3.3 | On the current tree: owned **259**, Arm A refs **78**, Arm B refs **55**, violations **0**, exit 0 | P0 | AC6 | Confirmed |
| R8 | §0.2 D3 | Fails closed when `.next/static/css` is missing, or older than **any** scanned input | P0 | AC7 | Confirmed |
| R9 | M1/M2/M4/M5 | `--verify-gate`: **four** planted violations shown FAILING, **four** controls shown PASSING | P0 | AC8 | Confirmed |
| R10 | §3.3 | Fallback-bearing references reported separately, **non-blocking** | P1 | AC9 | Confirmed |
| R11 | §0.2 D4 | `--css-dir`, `--globals-path`, `--src-dir` flags exist so plants run against a temp copy | P0 | AC8, AC10 | Confirmed |
| R12 | §3.6 | Wired into the `click-shield` job after `npm run build`; `package.json` gains exactly two scripts | P0 | AC11 | Confirmed |
| R13 | Standing | `npm run build` exit 0; **no file under `src/` changed** | P0 | AC12 | Confirmed |
| R14 | Backlog rules | Concise `docs/backlog.md` update + session log | P1 | AC13 | Confirmed |
| R15 | §3.1 | Report states whether §3.1/§3.3 reproduced, and restates the 702 §3.6 correction for 741 | P1 | AC14 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 (was draft 1's weakest point — §0.2 D3).** The gate reads build output, so it is only as current as the last
  `npm run build`. Freshness must be checked against **every scanned input** — `globals.css` plus every file matching
  Arm B's glob, `src/**/*.{css,tsx,ts}`. A bundle older than any of them is a non-zero exit. **The freshness set and
  the Arm B set are the same set**; they must be derived from one list in the code, so widening one cannot silently
  leave the other narrow (§0.3 E3). This is the most likely way for this gate to rot into a lifeline.
- **A2.** `:root` blocks outside `@theme` are part of ownership; `--overlay`/`--overlay-foreground` are declared in
  both (D19) and must resolve either way.
- **A3.** Arm B scans `src/` only. `scripts/`, `docs/`, `tasks/` are outside Tailwind's `@source` and outside this
  gate; a `var()` there is not a production consumer.
- **OQ1 — none open.** The scope decision was the re-scope itself (§0.1) and the Arm-B extension (§0.2 D1), both
  owner-decided 2026-08-10.

---

## 6. Pre-read rule bundle

Always Required: `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md` ·
`docs/critical-flow-registry.md` (scan only — confirm explicitly that **no** row is affected).

Governance/gate path: `docs/qa-rules.md` · `docs/orchestrator-procedures.md` → "Detector-aware requirements and
migrations".

Task-specific, required:

- `src/app/globals.css` `:1-100`, `:143-152` (the comment that broke draft 1), and every `:root` block.
- `src/modules/listings/components/LightboxView.tsx` `:33-50` and
  `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx` `:86-95` — Arm B's reason to exist.
- `scripts/check-homepage-grid.mjs` `:1-60` and its self-test section.
- `scripts/check-design-tokens.mjs` — report format and strict-mode exit behavior.
- `.github/workflows/governance-pr.yml` `:260-330` — the `click-shield` job.
- `docs/sessions/2026-07-30-task690-overlay-root-relocation.md` §F1.

Do **not** read the legacy `docs/design-system.md` bundle, the UI rule bundle, or any Storybook document. **No story
is touched** — the permanent-story creation gate is `N/A`, not satisfied-by-argument.

---

## 7. Scope

| Path | Action |
|---|---|
| `scripts/check-css-var-resolvability.mjs` | **create** — both arms, the seam flags, and `--verify-gate` |
| `scripts/__tests__/css-var-resolvability.test.ts` | **create** — parser units: comment stripping, fallback split, `@property`, TSX string extraction |
| `package.json` | **modify** — add `check:css-vars` and `check:css-vars:verify` only |
| `.github/workflows/governance-pr.yml` | **modify** — one step in the `click-shield` job |
| `docs/backlog.md` | **modify** — concise state |
| `docs/sessions/2026-08-10-task700-css-var-resolvability-gate.md` | **create** — session log |

---

## 8. Out of scope

- **Every file under `src/`.** This task changes no product code, no CSS, no token. If the gate finds a real
  violation, **report it and stop** — fixing it is a new number.
- Changing `@source not` directives, `@theme`, `@theme inline`, or the D19 `:root` duplication.
- The overlay exit condition (**695**) and 692's sync gate — 695 owns those; do not update or delete either.
- `CLOSED_OVERLAY_STYLE` (**741**), the pattern files (**691**), and the `--mantine-only` pairing defect (**742**).
- Any Storybook story, viewport, or rendered matrix.
- Deleting the 3 consolidated probes — owner cleanup step 3.

---

## 9. Current and required behavior

**Current.** Nothing verifies that a referenced custom property resolves. Task 690 shipped exactly this defect and it
was found by eye. D19's duplicate `:root` copy is held in place by a comment asking future authors to keep two blocks
in sync. `globals.css:20-24` names this task as the intended detector.

**Required.** `npm run check:css-vars` exits 0 on the current tree reporting `0 violations` across both arms over 259
owned names; exits 1 with a precise per-reference report — file, line, token — when any owned reference loses its
declaration, **including when the only consumer is a TSX inline style**; and `--verify-gate` demonstrates both
outcomes without leaving a modified file behind.

---

## 10. Implementation requirements

1. **Re-derive §3.1 and §3.3 first.** Run `npm run build`, then reproduce 190/50/140, the 259/78/55 counts, the 11
   module-kept tokens and the 16 TSX-only tokens. **If any disagrees with this document, the build wins** — record
   the discrepancy and proceed from the measured value. Draft 1 was wrong here; assume this draft can be too.
2. **Ownership is computed, never listed** (R3). Parse `globals.css` for every `--x:` declaration in `@theme`,
   `@theme inline` and every `:root` block, **after stripping comments**. A hardcoded array or JSON allowlist fails
   R3 outright. An empty owned set is a non-zero exit, not a vacuous pass.
3. **Define the input seam first** (R11): `--css-dir` (default `.next/static/css`), `--globals-path` (default
   `src/app/globals.css`), `--src-dir` (default `src`). Every plant and negative run in §13.2 drives the script
   through these flags against a temp copy. **No plant ever writes to the real tree.**
4. **Strip comments on both arms** (R4) with a tokenizer covering block, line and JSX forms and preserving string,
   template and regex literals (§3.5.1) — a `/\*.*?\*/` regex alone misses `theme.ts:280`. Split `var(--x)` from
   `var(--x, fallback)` — the latter is R10's report-only tier.
5. **Treat `@property --x` as a declaration** (R5).
6. **Fail closed on stale or missing input** (R8/A1): compare the newest bundle mtime against the newest mtime among
   *all* scanned inputs. Older, or absent, is a non-zero exit with an explicit message.
7. **`--verify-gate` (R9) — four plants, each shown FAILING; four controls, each shown PASSING.** All against a
   temp copy via the §10.3 flags.
   - **P1 (Arm A)** — rename an owned token's declaration in the globals copy while leaving its CSS consumer;
     mirrors a half-applied rename.
   - **P2 (Arm A)** — delete an owned token's declaration entirely; mirrors Task 690's move out of `@theme`.
   - **P3 (Arm B) — `--color-overlay-foreground`.** Remove **only** its `@theme inline` declaration at
     `globals.css:85` from the globals copy, and its one `@layer theme` declaration from the CSS copy.
     **Do not touch `--overlay-foreground` at `globals.css:471`** — that is a *different name* with live CSS `var()`
     consumers, and removing it makes Arm A fire, destroying the plant (§0.3 E2, draft 2's error). Measured
     precondition: `--color-overlay-foreground` has **0** `var()` references in the shipped CSS — its single
     occurrence there is the declaration itself — so after the removal its only consumers are `LightboxView.tsx:45`
     and `MantineListingGalleryPattern.tsx:91`. **Assert both outcomes: Arm A silent, Arm B failing.** A failure from
     the wrong arm proves nothing.
   - **P4 (dynamic, R6)** — insert `var(--space-${n})` into a TSX copy. `--space-` **is** a prefix of owned names, so
     the site is in-class and must be reported. Draft 2's plant used `var(--${x})`, a shape that occurs nowhere
     (§0.3 E1).
   - **C1** — a fallback-bearing reference must not block (R10).
   - **C2** — an unowned Mantine runtime name (`--app-shell-navbar-width`) must not be reported at all (R3/§3.3).
   - **C3** — a token named only inside a comment must not be reported (R4), and the control must cover **both**
     forms: `--spacing-N` at `globals.css:148` (block) and **`--button-hover` at `theme.ts:280` (`//` line)**.
     **This control encodes draft 1's and draft 2's own defects** — keep both halves.
   - **C4** — an out-of-class dynamic site (`var(--mantine-color-${c}-5)`, `theme.ts:759`) must not be reported
     (R6). Without this, P4 cannot distinguish a working prefix rule from one that reports everything.
   - **Before each plant, prove no further lifeline**: confirm the chosen token has no other declaration in the
     bundle copy, or the plant proves nothing.
8. Do not add an allowlist, a baseline file, or `continue-on-error`. This gate starts at 0 and stays blocking.

---

## 11. Positive and negative flows

**Positive.** A developer moves a token out of `@theme`, or renames it in `globals.css` only; CI fails on the
`click-shield` job naming the exact token, the referencing file and line, and which arm caught it.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form, action or schema | N/A | — |
| Authorization/RLS | **No** | No route or table | N/A | — |
| Offline/network | **No** | Build-time script | N/A | — |
| Concurrent writer | **No** | No data model | N/A | — |
| **Missing or stale build output** | **Yes** | A1, R8 | Non-zero exit; never a silent pass. Includes the `.module.css`-edited-after-build case draft 1 missed | AC7 |
| **Zero owned tokens parsed** | **Yes** | R3 — a `globals.css` parse failure yields an empty set and a vacuous pass | Non-zero exit | AC3 |
| **Reference only in a comment** | **Yes** | §3.5.1, 5 measured cases + `--spacing-N` | Not reported | AC4, control C3 |
| **Reference only in a TSX runtime style** | **Yes** | §3.2, 16 measured tokens | Reported by Arm B when unresolved | AC2, plant P3 |
| **Fallback-bearing reference** | **Yes** | §3.3, 232 measured | Non-blocking tier only | AC9, control C1 |
| **Unowned Mantine runtime var** | **Yes** | §3.3, 112 measured | Not reported at all | AC3, control C2 |
| **Dynamically-constructed name, in class** | **Yes** | §3.4, prefix could name an owned token; 0 today | Gate fails; a human decides | AC5, plant P4 |
| **Dynamically-constructed name, out of class** | **Yes** | §3.4, the 8 `--mantine-color-${…}` sites | Not reported | AC5, control C4 |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the current tree after `npm run build`, *when* `npm run check:css-vars` runs, *then* Arm A
  reports its reference count and `0 violations`.
- **AC2 [R2]** — *Given* the same run, *then* Arm B reports its reference count and `0 violations`, and its scan
  demonstrably includes `LightboxView.tsx` and `MantineListingGalleryPattern.tsx` — quote the two tokens it found
  there.
- **AC3 [R3]** — *Given* the script source, *then* no hardcoded token array and no allowlist file exists; the owned
  set is parsed at run time; an empty owned set exits non-zero; `--app-shell-navbar-width` appears in no report.
- **AC4 [R4, R5]** — *Given* the six comment-only names, *then* none is reported — and the unit tests cover **each
  comment form separately**: block (`--spacing-N`, `globals.css:148`), line (`--button-hover`, `theme.ts:280`), JSX,
  plus a string-literal case proving `https://` is not stripped as a comment. *Given* `--tw-shadow`, *then* it is
  treated as declared.
- **AC5 [R6]** — *Given* the current tree, *then* the gate reports **8** dynamic sites raw and **0** in-class
  (prefix could name an owned token), and exits 0 on that basis. *Given* a planted `var(--space-${n})`, *then* it
  exits non-zero; *given* `var(--mantine-color-${c}-5)`, *then* it does not.
- **AC6 [R7]** — *Given* the current tree, *then* owned = **259**, Arm A refs = **78**, Arm B refs = **55** over the
  glob `src/**/*.{css,tsx,ts}` minus `globals.css`, violations **0**, exit 0. **A result of 54 means the glob dropped
  `input-chrome.css`, not that the number is wrong** (§0.3 E3). *(Re-measure per §10.1; if the tree genuinely moved,
  quote the new numbers and say so.)*
- **AC7 [R8]** — *Given* `.next/static/css` absent, *then* non-zero. *Given* a bundle whose mtime precedes a touched
  `src/**/*.module.css`, *then* non-zero. *Given* a bundle whose mtime precedes a touched **non-module**
  `src/design-system/mantine/input-chrome.css`, *then* non-zero — **this third case is what proves the freshness set
  widened with Arm B's glob**; a gate still watching only `*.module.css` passes the second and fails this one
  (§0.3 E3). All three demonstrated.
- **AC8 [R9, R11]** — *Given* `npm run check:css-vars:verify`, *then* **P1, P2, P3, P4 each FAIL** with the planted
  token quoted, **P3 fails on Arm B while Arm A stays silent** (both asserted), **C1, C2, C3, C4 each PASS**, the run
  exits 0 overall, and `git status --porcelain` is unchanged afterwards — quote it.
- **AC9 [R10]** — *Given* the 232 fallback-bearing references, *then* they appear in a separate non-blocking section
  and do not affect the exit code.
- **AC10 [R11]** — *Given* `--css-dir`, `--globals-path`, `--src-dir` pointed at a temp copy, *then* the gate reads
  only that copy; the real tree is untouched, proven by `git status --porcelain`.
- **AC11 [R12]** — *Given* `governance-pr.yml`, *then* the new step sits in the `click-shield` job after
  `npm run build`, with no `continue-on-error`; `package.json` gained exactly the two named scripts.
- **AC12 [R13]** — `npm run build` exits 0; `git status --porcelain` lists only the six §7 paths and no `src/` path.
- **AC13 [R14]** — `docs/backlog.md` updated concisely; session log at the §7 path holds every transcript.
- **AC14 [R15]** — the report states whether §3.1/§3.3 reproduced, and restates the 702 §3.6 correction.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, per `docs/qa-profiles.md`: *"planted-violation failure proof when a gate is
claimed."* The entire deliverable is a gate and its baseline is 0, so nothing but a planted violation can show it
works. Not `Q3`: no visual surface, no story, no rendered matrix. Not `Q2`: a gate that cannot fail is the Sprint 54
defect class — and draft 1 of this very task was one.

`docs/critical-flow-registry.md`: scan and confirm **no** row is affected.

### 13.2 Commands — record the actual result of each

1. `git --no-optional-locks status --porcelain` at I0; backlog baseline from
   `git show HEAD:docs/backlog.md | wc -l` **before** any edit.
2. `npm run build` — **before** writing code, to produce the bundle §10.1 re-derives from; and after, exit 0.
3. The §3.1/§3.3 re-derivation: 190/50/140, owned 259, Arm A 78, Arm B 55, the 11 module-kept and 16 TSX-only lists.
   Persist the transcript.
4. `npm run check:css-vars` — exit 0, `0 violations` on both arms.
5. `npm run check:css-vars:verify` — **P1/P2/P3/P4 FAIL** (P3 on Arm B with Arm A silent), **C1/C2/C3/C4 PASS**,
   overall exit 0; then `git status --porcelain` to prove the tree is unchanged.
6. Stale/missing-input runs, driven **through the §10.3 flags against a temp copy** — never by renaming the real
   `.next`: (a) `--css-dir` at an empty dir; (b) a copy whose bundle mtime precedes a touched **`.module.css`**;
   (c) a copy whose bundle mtime precedes a touched **non-module `src/design-system/mantine/input-chrome.css`**;
   (d) `--globals-path` at a file with empty theme blocks. All four must exit non-zero. **(c) is not redundant with
   (b)** — it is the only case that proves the freshness set really widened with Arm B's glob (§0.3 E3); a gate that
   still watches only `*.module.css` passes (b) and fails (c). Quote `git status --porcelain` afterwards.
7. `npx vitest run scripts/__tests__/css-var-resolvability.test.ts`, then the full `npx vitest run`.
   **Known, not a regression:** the full-run-only timeout class — Task 702 observed
   `RangeDatePickerLocalization` · `saveSavedSearch.dedup` · `filtersRangeDatePicker.smoke` ·
   `filtersPanelShell.smoke`, all 4 passing in isolation (**wider than the trio Task 692 recorded — 702 N1**). If one
   appears, re-run it in isolation and report both results. Report the run you observed.
8. `npm run typecheck` — exit 0.
9. `npm run check:design-tokens` · `check:stories` · `check:mojibake` · `check:file-integrity` — each unchanged.
   **Not required:** any Storybook or rendered command. This task ships no CSS; `screenshots:assert` would prove
   nothing, and running it is not evidence of diligence.

Any of these that cannot run in your environment is a **`PARTIALLY IMPLEMENTED`**, not a pass.

---

## 14. Completion report contract

Report as `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. Never self-approve.

1. Changed files and why, reconciled against the **actual final** `git status --porcelain` — quote the final one.
2. Requirement IDs completed; any not completed, with why.
3. Every §13.2 command with its **actual** result.
4. The complete new gate file and the CI diff.
5. The `--verify-gate` transcript showing **P1/P2/P4 FAIL, P3 FAIL on Arm B with Arm A silent, C1/C2/C3/C4 PASS**,
   plus the post-run `git status --porcelain`.
6. The §10.1 re-derivation table against §3.1/§3.3, stating explicitly which numbers matched and which moved.
7. The no-further-lifeline proof for each planted token (§10.7).
8. Confirmation that **no** file under `src/` was changed.
9. Assumptions, deviations, limitations. **This kickoff's own measured facts are not exempt.** Draft 1 shipped four
   defects plus a wrong count (§0.2); draft 2 shipped two P0 and two P1 (§0.3). Both were rejected before handoff.
   The two sharpest are now controls: **C3** (a base number produced by a parser that did not strip comments, in a
   document requiring comment stripping) and **C4** (a dynamic-site baseline of 0 that was really 8, with a plant
   testing a shape that occurs nowhere). **Nine consecutive kickoffs have shipped a factual defect**, and the pattern
   in every case is a *derived* claim about what another file does. The derived claims still standing in this draft:
   that `click-shield` is the only building job (§3.6), that `@property` covers the `--tw-*` family (§3.5.2), that
   the TSX-only tokens are exactly 16 (§3.2), and that no owned name begins with `--mantine` (§3.4). **Open each
   file.** If one of these is wrong, say so and stop — do not route around it.
10. Confirmation that no `docs/critical-flow-registry.md` entry is affected.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet with no chat context | **Yes** — every count, path, line number and CI job is in §3 |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1–R15 → AC1–AC14 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, and R13's "no `src/` file" is AC12, not a hope |
| Comparator shown able to fail | **Yes** — R9/AC8 is four planted failures plus four passing controls, with P3 required to fail **on the correct arm** and P4/C4 required to separate in-class from out-of-class dynamic sites. Draft 1 failed this check outright; draft 2 failed it subtly, planting a `var(--${x})` shape that occurs nowhere in the repo |
| Pre-plant census / no further lifeline | **Yes** — §10.7, required before each plant, reported at §14.7 |
| No claimed command, file, value or behavior went uninspected | **Partial, and stated rather than asserted.** Every §3 number was re-measured today with comments stripped, after draft 1's were found wrong. Four claims remain *derived* and are named for re-check in §14.9. This row is the one draft 1 got wrong, so it is deliberately not a "Yes" |
| Owner-only exceptions traceable | **Yes** — the §0.1 re-scope and the §0.2 D1 Arm-B extension are both owner decisions of 2026-08-10; no other exception is claimed |
| Sprint assignment | **Yes** — Sprint 46, order 46.3, filed inside `tasks/Sprints/` |
| Permanent Storybook creation gate | **N/A** — no story added, extended or probed; §6 forbids reading the Storybook bundle and §13.2.9 forbids running rendered commands as filler |
| No number duplicated | **Yes** — 700 keeps its number under the §0.1 re-scope; the C3 pairing defect is **742** |
| Dirty-worktree manifest | **Conditional** — clean at `0dac78755`. If `git status` is not clean at I0, complete `docs/orchestrator-dirty-worktree-manifest-template.md` for every entry before editing |

---

## Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Take the §13.2 step-1 baseline and run
`npm run build` **before** writing any code, re-derive §3.1/§3.3 from that build, and treat §8 as a fence: if the
gate finds a real violation on the current tree, that is a finding to report, not a file to fix.
