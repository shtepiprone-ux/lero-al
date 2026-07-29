# Task 681 — Retire Sonner: route all 169 `toast.*` call sites onto the TailAdmin-conformed Mantine notifications system

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** UI / component migration — **current Mantine path** (`docs/rule-index.md`).
- **Secondary types:** cross-cutting import migration (33 consumer files + 2 mount sites); design-system shared-source extraction; Storybook
  governance (existing canonical Pattern + Story must be updated, cl. 16c); **critical-flow-adjacent** — three
  `docs/critical-flow-registry.md` rows name `toast.*` behavior explicitly (§3.8).
- **Origin:** the owner's homepage/layout Mantine-migration plan, the unnumbered row
  *"Sonner `Toaster` у `app/[locale]/layout.tsx`, номера задачі немає."* Number **681** assigned this session
  (`docs/backlog.md` numbering line: last used 675; 676–680 reserved by Task 675; 683 reserved by Task 672).

> **Read this first.** Unlike Task 672, this is **not** a zero-visual-change migration and must not be executed as
> one. Sonner and Mantine `Notification` are different components; the toast **will** look different. That is
> intended: the target chrome is already owner-ratified and already implemented in `theme.ts` from the live
> TailAdmin capture (§3.5). What must **not** change is *behavioral*: every one of the 169 call sites keeps its
> exact message, its exact variant, and its exact firing condition. You are changing the transport, not the copy.

---

## 2. Objective

1. Introduce a single shared variant source (`notificationVariants.ts`) and a thin `toast` adapter over
   `@mantine/notifications`, preserving the exact `toast.success|error|info|warning(message)` call signature that
   all 169 existing call sites already use.
2. Re-point all 34 importing files and all 3 test mocks from `sonner` to the adapter — **without editing a single
   call site's arguments**.
3. Unmount and delete the Sonner `Toaster`, ending the current state where two independent toast systems are
   mounted simultaneously.
4. Bring the rendered toast onto the §6r-LIVE TailAdmin shape by supplying the icon `theme.ts` already styles but
   nothing currently passes, and prove it through the existing canonical Story.

---

## 3. Verified context

Every fact below was inspected in the worktree at `9601d6908` on branch `task/q0-ci-rendered-locale-split`. Line
numbers are from that commit. **Nothing in this section is inferred from a filename or a prior report.**

### 3.1 Owner decisions — D1, D2

Recorded 2026-07-29, in response to explicit orchestrator questions:

| ID | Question put to the owner | Owner ruling |
|---|---|---|
| **D1** | For hybrid surfaces (Mantine API + Tailwind visuals), what counts as "migrated"? | **Mechanism-only, as in Task 672.** Raw elements become Mantine primitives; behavior and responsiveness move to Mantine props; visuals are preserved until a TailAdmin reference row exists. *Scope note: D1 governs surfaces with **no** reference row. It does **not** apply to this task's toast chrome, which **has** an authoritative reference row (§3.5) — see D2.* |
| **D2** | Sonner renders at its default **bottom-right**; `MantineRootProvider` is hard-coded **top-right**. All 169 toasts will move. | **Keep `top-right`.** Adopt the value already shipped in `MantineRootProvider`; do not introduce a second position. Because this is a user-visible move, the task must carry rendered proof that a toast at `top-right` does not collide with the header at the narrow stress width (AC9). |

D1 and D2 are the source of truth and must not be re-litigated.

### 3.2 The Sonner surface — measured, not estimated

`src/components/ui/sonner.tsx` (49 lines), `'use client'`. It wraps `sonner`'s `Toaster`, reads `next-themes`'
`useTheme()`, supplies five lucide icons, maps four CSS custom properties
(`--normal-bg`/`--normal-text`/`--normal-border`/`--border-radius`) onto `--popover`/`--popover-foreground`/
`--border`/`--radius`, and sets `toastOptions.classNames.toast = "cn-toast"`.

`grep -rn "cn-toast" src/app/globals.css` → **0 hits**. That class is dead; nothing styles it.

**Mounted in TWO places** — corrected 2026-07-29 after Sonnet's I0 stop (see §3.11 R2):

| Mount | Import | Render | Wraps |
|---|---|---|---|
| `src/app/[locale]/layout.tsx` | `:14` | `:58` | every public `/{locale}/*` route |
| `src/app/admin/layout.tsx` | `:9` | `:62` | every `/admin/*` route |

Both render `<Toaster />` with **no props**, so Sonner's default position is in effect on both (D2). The admin
mount predates the cited commit — `git log -S "from '@/components/ui/sonner'" -- src/app/admin/layout.tsx` →
`3e30eae9b` *"fix: avatar upload silent failures + admin nav guard back-button + Toaster"*. It is **not** drift;
the first draft of this kickoff simply failed to search for it.

**Call-site census** — the numbers that make this task mechanical:

| Measure | Value | Command |
|---|---:|---|
| Consumer files importing `toast` (single-quoted) | **33** | `grep -rln "from 'sonner'" src/` |
| …plus the wrapper's own double-quoted import | **1** (`src/components/ui/sonner.tsx`) | `grep -rln 'from "sonner"' src/` |
| Files rendering `<Toaster />` | **2** | `grep -rn "<Toaster" src/` |
| Total `toast.*` call sites | **169** | `grep -rn "toast\.[a-z]" src/ --include=*.tsx --include=*.ts` |
| `toast.error` | 101 | `grep -rhoE "toast\.[a-zA-Z]+" src/ \| sort \| uniq -c` |
| `toast.success` | 57 | same |
| `toast.info` | 7 | same |
| `toast.warning` | 4 | same |
| Bare `toast(...)` | **0** | `grep -rhoE "(^\|[^.a-zA-Z])toast\(" src/` |
| `toast.promise` / `.loading` / `.custom` / `.dismiss` | **0** | the `uniq -c` above returns only the four variants |
| Call sites passing a Sonner options object | **0** | the single `grep` hit, `AdminPropertyTypesManager.tsx:185`, is `toast.error(t('delete_blocked', { count: … }))` — a **`t()` interpolation**, not a toast option |

**Consequence:** the entire production surface is `toast.<one of four>(message: string)`. A four-method adapter with
that exact signature is a complete, lossless replacement. **Do not rewrite call-site arguments.**

### 3.3 The Mantine notification system is already installed, mounted, and styled

This is the fact that makes the task small. Verified, not assumed:

- `package.json` — `@mantine/notifications: ^8.3.18`; `node_modules/@mantine/notifications/` present.
- `src/app/layout.tsx:7` — `import '@mantine/notifications/styles.css'` already present.
- `src/design-system/mantine/MantineRootProvider.tsx:4` imports `Notifications`; the provider renders
  `<Notifications position="top-right" />` inside `ModalsProvider` inside `MantineProvider`. **Already live in
  production on every route**, public and admin.
- `.storybook/preview.tsx:4,12` — `Notifications` and its stylesheet are already in the Storybook decorator tree, so
  a Story can fire a real notification.

**So the app currently mounts two toast systems in parallel.** This task removes one of them; it does not add
infrastructure.

### 3.4 The installed `notifications.show` API — read from the shipped `.d.ts`

`node_modules/@mantine/notifications/lib/notifications.store.d.ts`:

```ts
export interface NotificationData extends Omit<NotificationProps, 'onClose'>, Record<`data-${string}`, any> {
  id?: string
  position?: NotificationPosition
  message: React.ReactNode          // required
  autoClose?: boolean | number
  …
}
export declare function showNotification(notification: NotificationData, store?): string
export declare const notifications: { readonly show: typeof showNotification; readonly hide; readonly update; readonly clean; readonly cleanQueue }
```

`color`, `title` and `icon` are inherited from `@mantine/core`'s `NotificationProps`. `message` is the only required
field, which is exactly the shape the adapter needs. `notifications.show()` is already exercised in production by
`MantineNotificationPattern` (§3.6), so the call is verified by working code, not only by types.

### 3.5 The TailAdmin reference row **exists** — this is why the visuals may change

`docs/tailadmin-style-reference.md:872`, **§6r-LIVE**, is an authoritative orchestrator live capture from
`demo.tailadmin.com/notifications` (2026-07-05), explicitly marked *"AUTHORITATIVE, supersedes the prose values
below"*, with the prose §6r at `:907` marked SUPERSEDED. Measured values: white background, `rounded-md` 6px,
`p-3`, `gap-3`, a **4px bottom-border accent** (not a left bar), `shadow-theme-sm`, `w-full` below `sm` capped at
`sm:max-w-[340px]`, a **40×40 `rounded-lg` tinted icon badge** (`bg-<semantic>-50`, 24px `<semantic>-600` glyph),
title 16px, close button 24×24.

`src/design-system/mantine/theme.ts:726` already implements this in `components.Notification`: `radius: 'md'`,
`closeButtonProps: { size: 24, iconSize: 16 }`, and a `styles` function setting
`root.borderBottom: 4px solid var(--mantine-color-${color}-5)`, the §6r-LIVE `boxShadow`, `icon` at
`2.5rem`/`2.5rem` with `borderRadius: lg`, `backgroundColor: color-0`, `color: color-6`, and
`title` at `1rem` / `fontWeight: 600` (a documented owner override of the captured 400, dated 2026-07-05).

**Therefore cl. 16a is not triggered and cl. 16 is satisfied by citation:** the target chrome has provenance and is
already coded. **No new visual value may be invented in this task.**

**The gap this task closes:** `theme.ts` styles an `icon` slot that **nothing currently passes**, so the §6r-LIVE
40×40 tinted badge never renders today. Supplying the icon is conformance to an existing cited row, not a new
design decision.

### 3.6 The canonical Mantine source already exists — disposition is `reuse`/`extend`, not `create`

`src/design-system/mantine/patterns/MantineNotificationPattern.tsx`, `'use client'`, imports `notifications` from
`@mantine/notifications` and owns:

```ts
export type NotificationVariant = 'success' | 'error' | 'info' | 'warning'
const VARIANT_COLORS: Record<NotificationVariant, string> = {
  success: 'green', error: 'red', info: 'blue', warning: 'yellow',
}
```

and `showNotification()` calling `notifications.show({ title, message, color, autoClose: 4000 })` — **with no
`icon`**. Its canonical Story is `src/stories/patterns/mantine/NotificationPattern.stories.tsx`,
`title: 'Patterns/Mantine/NotificationPattern'`, strings via `storyT`, exports covering success / error / loading.

### 3.6a — the canonical **visual** Story already exists, and it is not the Pattern

`src/stories/mantine/primitives/Notification.stories.tsx`, `title: 'Mantine/Primitives/Notification'`, **already in
the screenshot manifest** (`Mantine/Primitives/Notification/Default` appears in
`.screenshots/rendered-assert/2026-07-28T20-40/manifest.json`). It renders five static `<Notification>` elements —
`green`/`blueLight`/`yellow`/`red` plus a neutral `gray` — each with the **same four lucide icons** this task needs,
at `const ICON_SIZE = 24 // §6r-LIVE — captured glyph size`.

Its own doc-block records a deliberate design decision:

> *"Static/determinate — no `notifications.show()` call (that's a portal with an auto-close timer + enter/leave
> transition, not byte-stable). Each state renders a `<Notification>` directly, matching §6r-LIVE…"*

**Consequences, and they are binding:**

- This Story — **not** `Patterns/Mantine/NotificationPattern` — is the canonical **visual** source of truth for the
  toast, and it is already under the standing visual gate.
- **A3 is answered by the repository**: the glyph size is `24`, already cited to §6r-LIVE. Do not choose a value.
- **Do not make any Story fire `notifications.show()`.** An earlier draft of this kickoff instructed exactly that;
  it is withdrawn. The portal + timer is not byte-stable and would inject flake into the gate.

`VARIANT_COLORS` is the repository's canonical variant→colour mapping and **must be reused, not duplicated**
(cl. 16b). It cannot simply be imported by the adapter, because that module is `'use client'` and imports
`Button`/`Group`/`Stack`/`Paper`/`Text`/`ThemeIcon`/`Badge` from `@mantine/core` — importing it from a helper used
at 169 sites would pull the whole pattern into every consumer bundle. **Extract it to a shared leaf module instead
(I1); both the pattern and the adapter then consume the one source.**

### 3.7 The three test mocks that will break loudly

```
src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx
src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx
src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx
```

each contain `vi.mock('sonner', …)`. Once the product code imports the adapter instead, these mocks target a module
the code no longer loads: the spy never fires and the `expect(toast.success).toHaveBeenCalledWith(...)` assertions
**fail loudly**. That is the desired behavior — a silent pass would be the dangerous outcome. All three must be
re-pointed in this task (R6).

### 3.8 Critical-flow registry — three rows name toast behavior (this is why the profile is Q4)

`docs/critical-flow-registry.md`, grepped:

- `:43` — *Clear history (no-op race)*, Task 432/436: `{cleared:0}` → **neutral info toast**.
- `:45` — *Verify / revoke agent*, Task 483: `toggleUserVerified(userId,true)` + **`toast.success('verify_success')`**;
  the row's own regression evidence is *"RTL smoke: … toast.success with correct key"*.
- `:61` — *Report listing*, Task 442/458: **`already_reported → toast.info` + dialog closes**, plus
  *"+6 per-branch error toast tests (16 total)"*.

cl. 15 therefore attaches. **No registry row is edited** — the observable behavior (same variant, same message key,
same firing condition) is preserved by construction; what changes is the module the assertion mocks. The registry's
existing commands remain the regression evidence and must be re-run (§13.3).

### 3.9 `next-themes` — sole consumer is the file being deleted

`grep -rln "next-themes" src/` → **exactly one hit: `src/components/ui/sonner.tsx`**. After deletion, `next-themes`
(`^0.4.6`) and `sonner` (`^2.0.7`) both become unreferenced from `src/`. **Dependency removal is out of scope**
(§8) — package surgery has its own blast radius (Storybook/config consumers outside `src/` were not audited).
**Task 682 is reserved** for it.

### 3.10 Catalog

`docs/component-catalog.md:51` — `| \`sonner\` | NEEDS_STORY | — | — | — |`, inside the
`Canonical UI Primitives (src/components/ui/) (34)` section. Deleting the file removes this row and decrements that
section count and the Summary totals. The generator (`scripts/governance/component-catalog.mjs`) derives the Story
column from a **colocated** sibling only (`:126` — `absPath.replace('.tsx','.stories.tsx')`), so a
`src/stories/**` story never sets `✅` there. Hand-correct the affected counters; **do not run
`catalog:components --write`** — it would sweep in unreviewed Task 669/675 drift (the Task 672 review reached the
same conclusion).

### 3.11 Draft-1 defects, corrected 2026-07-29 (read this before trusting any number above)

Sonnet stopped at I0 on a census divergence. The stop was correct; the investigation that followed found **five**
defects in this kickoff's first draft. All are corrected above and below. They are recorded, not erased, because
the executor must know which claims were re-verified.

| # | Draft-1 defect | Correction | Found by |
|---|---|---|---|
| **1** | §3.2 claimed the `Toaster` is *"mounted in exactly one place"*. The claim came from grepping **two named files**, never the tree. | `src/app/admin/layout.tsx:9,62` is a second mount. Added to scope (§7, I7). Deleting `sonner.tsx` without it would break the admin build — R10/AC10 — and leave an AC5 grep hit. | **Sonnet, I0** |
| **2** | "34 files importing from `sonner`" conflated **33** consumer files with the wrapper's own **double-quoted** import. §7 then told the executor to edit an import line in the file it also deletes. | Census split into 33 consumers + 1 wrapper + 2 mounts. This — not the admin mount — is what actually tripped A1; the admin mount matched **neither** grep and would have detonated at build time instead. | Orchestrator, reviewing Sonnet's stop |
| **3** | §16 named `Patterns/Mantine/NotificationPattern` as the canonical source. | `Mantine/Primitives/Notification` exists, is already in the screenshot manifest, and is the canonical **visual** source (§3.6a). Draft 1 violated cl. 16c in the task design itself. | Orchestrator |
| **4** | I8 instructed the Story to "fire the real icon-bearing notification". | **Withdrawn.** The canonical Story deliberately renders static `<Notification>` elements because a portal + auto-close timer is not byte-stable (§3.6a). | Orchestrator |
| **5** | R1 said to move `VARIANT_COLORS` **verbatim**, including `info: 'blue'`. | **`blue` is not a registered theme colour.** `theme.ts:139` registers `{ brand, gray, green, yellow, red, blueLight, purple, sale }`, and `theme.ts:837` documents `info→blueLight`. The canonical Story uses `blueLight`. Verbatim reuse would have shipped an unthemed-palette fallback to all 7 `toast.info` sites. See below. | Orchestrator |

**Defect 5 — the `info` colour correction (needs ratification at review).** `MantineNotificationPattern`'s
`VARIANT_COLORS.info = 'blue'` is a **pre-existing latent bug**, not a design choice: Mantine falls back to its own
default blue ramp because the project never registers `blue`. The shared module must use **`blueLight`**, matching
`theme.ts:837`'s documented intent and the canonical Story. This changes the rendered colour of the 7 `toast.info`
sites and of the Pattern's info trigger. It is a correction toward documented intent with no invented value, and it
is flagged here for explicit owner ratification at review — the same handling Task 672's D4 received. **Report the
before/after colour tokens; do not treat it as a silent fix.**

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.6, §3.6a, §3.11, cl. 16b | `src/design-system/mantine/notificationVariants.ts` exists as a shared leaf module exporting `NotificationVariant`, `VARIANT_COLORS`, `VARIANT_ICONS`, `NOTIFICATION_AUTO_CLOSE`. It imports **no** `@mantine/core` component and is not `'use client'`. `VARIANT_COLORS.info` is **`blueLight`**, not `blue` (§3.11 defect 5); icons and their `size={24}` match the canonical Story exactly. | P0 | AC1 | Confirmed |
| R2 | §3.2, §3.4 | `src/lib/toast.ts` exports `toast` with exactly `success`, `error`, `info`, `warning`, each `(message: string) => void`, delegating to `notifications.show({ message, color, icon, autoClose })` using R1's maps. | P0 | AC2 | Confirmed |
| R3 | §3.6, cl. 16b | `MantineNotificationPattern.tsx` no longer declares its own `VARIANT_COLORS`; it imports from R1 and passes `icon` to `notifications.show`. Its public props are unchanged. | P0 | AC3 | Confirmed |
| R4 | §3.2 | All **33** consumer files import `toast` from `@/lib/toast`; `grep -rn "from 'sonner'" src/` returns **0 hits**. **No call-site argument is edited** — the 169 sites keep their exact message expressions and variants. | P0 | AC4 | Confirmed |
| R5 | §3.2, §3.11 | `<Toaster />` and its import are removed from **both** `src/app/[locale]/layout.tsx` **and** `src/app/admin/layout.tsx`; `src/components/ui/sonner.tsx` is deleted; `grep -rn "sonner" src/` returns hits **only** in `src/stories/mantine/primitives/Notification.stories.tsx` (a prose comment, §3.6a) — quote the surviving hit. | P0 | AC5 | Confirmed |
| R6 | §3.7 | All three `vi.mock('sonner')` test files mock `@/lib/toast` instead, and still assert the same observable call (variant + message key). | P0 | AC6 | Confirmed |
| R7 | cl. 15, §3.8 | The three registry-referenced suites pass unchanged in substance, and a **new** adapter smoke test proves each of the four variants calls `notifications.show` with the correct `color` and `icon` from R1. | P0 | AC7 | Confirmed |
| R8 | cl. 16c, §3.6a, §3.11 | The canonical **visual** Story `Mantine/Primitives/Notification` keeps rendering static `<Notification>` elements and stays byte-stable — its cells must be **unchanged** by this task. `NotificationPattern`'s info trigger reflects the `blueLight` correction. **No Story fires `notifications.show()`.** `check:stories` and `check:story-coverage` stay green. | P1 | AC8 | Confirmed |
| R9 | D2, cl. 11 | Rendered proof at `320` that a `top-right` toast does not collide with the site header, in all four locales. | P0 | AC9 | Confirmed |
| R10 | cl. 9 | `npm run build` exits 0 on a fresh post-change transcript. | P0 | AC10 | Confirmed |
| R11 | cl. 7, 14 | Zero new i18n keys (parity stays 2215×4); `check:design-tokens` gains no violation in any touched file; `check:file-integrity` / `check:mojibake` exit 0. | P1 | AC11 | Confirmed |
| R12 | §3.10 | `docs/component-catalog.md` loses the `sonner` row, and the section count and Summary counters are hand-corrected to match. | P2 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — the census is a measurement, and it is your gate.** Expected: **169** call sites / **33** consumer files /
  **1** wrapper / **2** mount sites / 101-57-7-4, re-verified 2026-07-29 after the draft-1 correction (§3.11).
  **Re-run the census commands before you start**, including `grep -rn "<Toaster" src/` — draft 1 omitted that
  command, which is why the second mount survived research. If any number differs, or if any `toast.promise`,
  `toast.loading`, `toast.custom`, `toast.dismiss`, bare `toast(...)`, or a genuine Sonner options object appears,
  **stop and report** — the four-method adapter is no longer a lossless replacement and the task needs re-scoping.
  Do not extend the adapter on your own initiative.
- **A2 — `title` is deliberately not part of the adapter.** Sonner call sites pass a single string and Mantine
  renders `message` alone perfectly well. Do **not** invent a title, and do **not** derive one from the variant
  (that would create user-facing copy with no i18n key, breaking cl. 7).
- **A3 — icon size is already decided: `24`.** `Notification.stories.tsx:18` declares
  `const ICON_SIZE = 24 // §6r-LIVE — captured glyph size`. Use that value; do not pick your own. If the rendered
  badge does not match §6r-LIVE, fix it in the shared module, never by editing `theme.ts` global chrome (§8).
- **A4 — `MantineNotificationPattern`'s `autoClose: 4000` is the existing value** and becomes
  `NOTIFICATION_AUTO_CLOSE`. Preserve it exactly; Sonner's own default is not the reference here, the in-repo
  Mantine pattern is.
- **A5 — worktree starts clean.** Snapshot `git status --porcelain` before the first write and record it. If it is
  not clean, **stop and report**; do not reconcile foreign paths.
- **A6 — the 34-file edit must be reviewable.** Change only the import line. If a file needs any other edit to
  compile, name it explicitly in the session log with the reason; an unexplained extra hunk in a call-site file is
  an R4 failure.

**Open questions — none.** D1 and D2 are decided (§3.1); the adapter shape is fixed by the census (§3.2); the
visual target is cited (§3.5); the canonical source exists (§3.6).

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 3, 5, 7, 9, 11, 12, 13, 14, 15, 16, 16b, 16c.
2. `docs/rule-index.md` — "Current Mantine path".
3. `docs/qa-profiles.md` — the **Q4** row, the **Q3** row it inherits, and the viewport policy.
4. `docs/component-rules.md` — no-duplicate rule (why `VARIANT_COLORS` is extracted, not copied).
5. `docs/mantine-responsive-design-system.md`
6. `docs/tailadmin-style-reference.md` — **§6r-LIVE at `:872` only**. Do **not** implement from §6r at `:907`; it is
   explicitly marked SUPERSEDED.
7. `docs/storybook-governance.md` — §15.1 (`check:story-coverage`) and §8b (canonical story taxonomy).
8. `docs/critical-flow-registry.md` — lines 43, 45, 61.
9. `docs/qa-rules.md`
10. `docs/backlog.md` — the numbering line and the 80-line limit.

**Source pre-read**

11. `src/components/ui/sonner.tsx` — all 49 lines.
12. `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` — all lines.
13. `src/stories/patterns/mantine/NotificationPattern.stories.tsx` — all lines, as the Story to extend.
14. `src/design-system/mantine/MantineRootProvider.tsx` — all lines.
15. `src/design-system/mantine/theme.ts` — the `Notification` block (from `:726`).
16. `src/app/[locale]/layout.tsx` — lines 1–20 and 50–70.
17. The three test files named in §3.7 — the `vi.mock` block and the toast assertions in each.
18. `node_modules/@mantine/notifications/lib/notifications.store.d.ts` — the `NotificationData` interface.

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/design-system/mantine/notificationVariants.ts` | **create** | Shared leaf source for variant→colour/icon (R1). |
| `src/lib/toast.ts` | **create** | The four-method adapter (R2). |
| `src/design-system/mantine/patterns/MantineNotificationPattern.tsx` | modify | Consume R1, pass `icon` (R3). |
| **33** files importing `toast` from `sonner` | modify | **Import line only** (R4). Enumerate every one in the session log. |
| `src/app/admin/layout.tsx` | modify | **Second `Toaster` mount** — remove the `:9` import and the `:62` render (R5, §3.11 defect 1). |
| `src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | modify | Re-point `vi.mock` (R6). |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | modify | Re-point `vi.mock` (R6). |
| `src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` | modify | Re-point `vi.mock` (R6). |
| `src/lib/__tests__/toast.smoke.test.ts` | **create** | Adapter variant/colour/icon proof (R7). |
| `src/app/[locale]/layout.tsx` | modify | Remove the `Toaster` import and render (R5). |
| `src/components/ui/sonner.tsx` | **delete** | Sonner retired (R5). |
| `docs/component-catalog.md` | modify | Remove the `sonner` row; correct section count + Summary counters (R12). |
| `docs/backlog.md` | modify | Concise 681 entry; reserve **682**. Keep **≤80 lines** — consolidate, do not append. |
| `docs/sessions/2026-07-2X-task681-*.md` | **create** | Session log with a `Files Changed` table matching the real diff. |

---

## 8. Out of scope

- **Removing `sonner` / `next-themes` from `package.json`** — **Task 682 reserved** (§3.9). Consumers outside `src/`
  were not audited; do not touch `package.json` or the lockfile.
- **`Notifications position`** — stays `top-right` per D2. Do not add a `position` prop to any `show()` call.
- **`src/design-system/mantine/theme.ts`** — the `Notification` block is already §6r-LIVE-conformant and is the
  cited source of truth. If something looks wrong there, **report it, do not edit it**.
- **Any other TailAdmin restyle**, token change, or `globals.css` edit — including removing the now-dead
  `--popover*` CSS-variable plumbing, which has other consumers.
- **Editing any of the 169 call sites' arguments**, message keys, or firing conditions (R4/A6).
- **`docs/critical-flow-registry.md`** — no row is added or edited (§3.8).
- **Adding `toast.promise`/`loading`/`custom`/`dismiss`** — the census proves zero consumers (A1).
- **`MANTINE_VIEWPORTS` / `MANTINE_STORY_EXTRA_VIEWPORTS`** — no new widths; the 14-width canon remains Task 678.

---

## 9. Current and required behavior

**Current.** `src/app/[locale]/layout.tsx:58` mounts Sonner's `<Toaster />` at its default bottom-right, themed
through `next-themes` and four `--popover`/`--border`/`--radius` CSS variables, with five lucide icons and a dead
`cn-toast` class. In parallel, `MantineRootProvider` mounts `<Notifications position="top-right" />`, whose
`Notification` chrome is already TailAdmin-conformed in `theme.ts` but whose 40×40 tinted icon badge never renders
because no caller passes `icon`. 169 call sites across **33** consumer files import `toast` from `sonner` and call
exactly four variants with a single string, and a **second** `<Toaster />` is mounted in `src/app/admin/layout.tsx`,
so `/admin/*` renders the same dual-system problem. Three test files mock `sonner`.

**Required after.** One toast system. Every one of the 169 call sites is byte-identical in its arguments but
imports from `@/lib/toast`, which fires `notifications.show()` with the canonical colour and icon for its variant
and `autoClose: 4000`. Toasts render at top-right in the §6r-LIVE shape: white, 6px radius, 4px semantic bottom
accent, `shadow-theme-sm`, 40×40 `rounded-lg` tinted badge with the variant glyph, 16px/600 title area, 24px close.
Sonner is unmounted, its component file deleted, and no `sonner` reference remains in `src/`. The canonical
`Patterns/Mantine/NotificationPattern` Story renders all four production variants with icons, so the shape is under
the standing visual gate. The three registry-referenced suites still prove the same observable behavior.

---

## 10. Implementation requirements

**I0 — census first.** `git status --porcelain` (expect clean, A5), then re-run every command in §3.2's table and
quote the actual numbers. Any divergence from 169/34/101/57/7/4, or any fifth call shape, is a **stop** (A1).

**I1 — the shared variant source.** Create `src/design-system/mantine/notificationVariants.ts`. It must be a plain
leaf module — **no `'use client'`, no `@mantine/core` component import**. Move `NotificationVariant` and
`VARIANT_COLORS` here from `MantineNotificationPattern.tsx` with **exactly one corrected value**:
`success:'green'`, `error:'red'`, `warning:'yellow'`, **`info:'blueLight'`** — *not* the pattern's `'blue'`, which
is not a registered theme colour (§3.11 defect 5; `theme.ts:139`, `theme.ts:837`).

Add `VARIANT_ICONS` using the four lucide icons **already used by the canonical Story** — `CircleCheckIcon`
(success), `OctagonXIcon` (error), `InfoIcon` (info), `TriangleAlertIcon` (warning) — at `size={24}`, the value the
Story already cites to §6r-LIVE (`ICON_SIZE = 24`). Add `NOTIFICATION_AUTO_CLOSE = 4000` (A4). `Loader2Icon` has
**no** consumer (zero `toast.loading` call sites) and must not be carried over.

The resulting variant→colour→icon triple must match `Notification.stories.tsx` cell-for-cell. If it does not, the
shared module is wrong — the Story is the visual source of truth (§3.6a), not the Pattern.

**I2 — the adapter.** Create `src/lib/toast.ts`:

```ts
export const toast = {
  success: (message: string) => show('success', message),
  error:   (message: string) => show('error',   message),
  info:    (message: string) => show('info',    message),
  warning: (message: string) => show('warning', message),
}
```

where `show(variant, message)` calls
`notifications.show({ message, color: VARIANT_COLORS[variant], icon: VARIANT_ICONS[variant], autoClose: NOTIFICATION_AUTO_CLOSE })`.
Export `toast` as a **named** export so the 34 import lines change module specifier only. No `title` (A2), no
`position`, no `id`.

**I3 — the pattern.** Edit `MantineNotificationPattern.tsx` to import `NotificationVariant`/`VARIANT_COLORS`/
`VARIANT_ICONS`/`NOTIFICATION_AUTO_CLOSE` from I1, delete its local `VARIANT_COLORS` literal, re-export
`NotificationVariant` if any consumer imports it from here (check first), and pass `icon` in `showNotification`.
Its props interface must not change.

**I4 — the 34 import lines.** Mechanical: `from 'sonner'` → `from '@/lib/toast'`. **Nothing else in those files.**
List all 34 paths in the session log (A6).

**I5 — the three test mocks.** `vi.mock('sonner', …)` → `vi.mock('@/lib/toast', …)` in the three files from §3.7.
Keep every existing assertion; the point is that they still prove the same variant + message key.

**I6 — the adapter test.** Create `src/lib/__tests__/toast.smoke.test.ts`. Mock `@mantine/notifications` and assert,
for each of the four variants, that `notifications.show` is called **once** with the expected `color`, the expected
`icon` component, `autoClose: 4000`, and the message passed through **unchanged**. Add one negative assertion:
`title` is `undefined` (A2). This must assert observable arguments, not that a function exists.

**I7 — unmount BOTH, then delete.** Remove the import and `<Toaster />` from **both** layouts:
`src/app/[locale]/layout.tsx` (`:14`, `:58`) **and** `src/app/admin/layout.tsx` (`:9`, `:62`). Only then delete
`src/components/ui/sonner.tsx`. Deleting first will break the admin build (§3.11 defect 1). Afterwards
`grep -rn "sonner" src/` must return exactly **one** hit — the prose comment in `Notification.stories.tsx` — and
nothing else (AC5).

**I8 — the Stories: verify, do not rewrite.**

- `Mantine/Primitives/Notification` (canonical visual source, §3.6a): **do not modify it.** Its cells must be
  byte-unchanged by this task; that is the comparator proving you did not disturb the visual source of truth.
- `Patterns/Mantine/NotificationPattern`: its info trigger inherits `blueLight` via I3. Update the Story only if a
  visible string or fixture actually requires it; if no change is needed, say so explicitly rather than editing it
  to look busy.
- **Do not add a Story that calls `notifications.show()`.** The canonical Story documents why (portal + auto-close
  timer is not byte-stable). Draft 1 instructed the opposite; that instruction is withdrawn (§3.11 defect 4).

**I9 — rendered proof (D2/R9).** Capture the `top-right` toast against the real header at **320** in all four
locales and confirm no overlap of the toast with the header's interactive controls. Storybook cannot prove this —
the header is not in the pattern Story — so use a live route capture, and state the method and the exact
route/command you used. If a collision is found, **report it; do not fix it by changing the position** (that would
contradict D2) — it becomes an owner decision.

**I10 — order of operations.** I0 → I1 → I2 → I6 → I3 → I8 → I4 → I5 → I7 → gates → I9 → records.

---

## 11. Positive and negative flows

### Positive flow

A guest on `/{locale}/listings/{slug}` taps "Report listing", submits the dialog, and the action resolves: the
dialog closes and a single green-accented toast slides in at the top-right, ≤340px wide on desktop and full-width
below 640px, showing the localized success message with a 40×40 green-tinted check badge, auto-dismissing after
4 s. On a 320px viewport the same toast is full-width and does not cover the header's controls.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Error variant (the dominant path — 101 of 169)** | **Yes** | §3.2 | red accent + `OctagonXIcon`, message unchanged | AC7 |
| **`info` / `warning` (11 sites, easily missed)** | **Yes** | §3.2 | blue / yellow accent + correct glyph | AC7 |
| **Registry flows: clear-history no-op, verify/revoke, already-reported** | **Yes** | §3.8 cl. 15 | identical variant + message key as before | AC7 registry suites |
| **Locale expansion (sq/uk/it)** | **Yes** | cl. 7 | zero new keys; long `uk`/`it` strings wrap inside the 340px cap without clipping | AC8, AC9, AC11 |
| **Small viewport (<640)** | **Yes** | cl. 11, §6r-LIVE | toast is `w-full`, no horizontal overflow, no header collision | AC9 |
| **Message interpolation** (`t('delete_blocked', { count })`) | **Yes** | §3.2 | resolved string passes through the adapter unchanged | AC7 |
| Validation | No | The adapter takes a resolved string; no user input | N/A | — |
| Authorization / RLS | No | No data path; the adapter is a presentation call | N/A | — |
| Missing / failed data | No | Callers already handle it — the failure *is* the `toast.error` branch | N/A | — |
| Offline / network | No | No fetch added | N/A | — |
| Concurrent writer | No | Notification store is client-local; Mantine already queues via `limit` | N/A | — |
| RTL | No | No RTL locale in the project | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** — *Given* the final diff, *when* `src/design-system/mantine/notificationVariants.ts` is read, *then*
  it exports `NotificationVariant`, `VARIANT_COLORS`, `VARIANT_ICONS`, `NOTIFICATION_AUTO_CLOSE`; `VARIANT_COLORS`
  is character-identical to §3.6's quoted literal; and `grep -n "use client\|@mantine/core" <file>` returns **0
  hits**.

- **AC2 [R2]** — *Given* `src/lib/toast.ts`, *when* read, *then* `toast` has exactly four methods, each typed
  `(message: string) => void`, and the file contains no `title:` and no `position:`.

- **AC3 [R3]** — *Given* the final diff, *when* `MantineNotificationPattern.tsx` is grepped, *then*
  `grep -n "VARIANT_COLORS: Record" <file>` returns **0 hits** (the literal moved, not copied) and
  `showNotification` passes `icon`.

- **AC4 [R4]** — *Given* the final diff, *then* `grep -rn "from 'sonner'" src/` returns **0 hits**, exactly **33**
  files show an import-line change, and `git diff -U0 -- <those 33 files>` contains **no** hunk touching a
  `toast.` call site. Quote the per-file hunk count.

- **AC5 [R5]** — *Given* the final tree, *then* `grep -rn "<Toaster" src/` returns **0 hits**;
  `grep -rn "sonner" src/` returns **exactly one** hit — the prose comment in
  `src/stories/mantine/primitives/Notification.stories.tsx` — quoted in the report; `src/components/ui/sonner.tsx`
  shows as `D` in `git status --porcelain`; and neither `src/app/[locale]/layout.tsx` nor `src/app/admin/layout.tsx`
  contains `Toaster`.

- **AC6 [R6]** — *Given* the three test files, *then* each mocks the exact specifier `@/lib/toast`, none still
  references `'sonner'`, and each still asserts the same variant + message key it asserted before. Quote one
  before/after assertion pair per file.

- **AC7 [R7]** — *Given* the suites, *when* run, *then*
  `npx vitest run src/lib/__tests__/toast.smoke.test.ts` exits 0 with per-variant `color`/`icon`/`autoClose`/
  message-passthrough and the `title === undefined` assertion; **and** the three registry commands from §13.3 exit
  0 with their pre-existing counts. Report each separately.

- **AC8 [R8]** — *Given* a fresh `build-storybook` and a `--mantine-only` capture, *then* every
  `mantine-primitives-notification--default__*` cell is **byte-identical** to the pre-change baseline (hash-compare
  and quote the counts) — proving the canonical visual source was not disturbed; no Story calls
  `notifications.show()` (`grep -rn "notifications.show" src/stories/` → 0 hits); `npm run check:stories` exits
  **0**; and `npm run check:story-coverage` exits **0** at its current total, unchanged (state the number).

- **AC9 [R9]** — *Given* a live capture at **320** × {sq,en,uk,it}, *then* a fired toast does not overlap the site
  header's interactive controls, and no horizontal overflow is introduced. Quote the method, the route, and the
  measured toast rect vs header rect per locale.

- **AC10 [R10]** — `npm run build` exits 0 on a fresh post-change transcript. Report the page count actually
  printed and **quote the transcript tail** — do **not** cite `.next/BUILD_ID` (Task 669 review finding).

- **AC11 [R11]** — `npm run check:i18n` exits 0 at 2215×4 with no new keys; `npm run check:design-tokens` shows no
  new violation in any touched file (quote before/after totals **and** the `stale-marker` count);
  `npm run check:file-integrity` and `npm run check:mojibake` exit 0.

- **AC12 [R12]** — *Given* `docs/component-catalog.md`, *then* the `sonner` row at `:51` is gone, the
  `Canonical UI Primitives` section count is decremented from 34, and the Summary `Total cataloged components` and
  `Client components ('use client')` counters are decremented to match. State the arithmetic.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`.** `docs/qa-profiles.md:15` routes `Q4` to *"changes touching
`docs/critical-flow-registry.md`"*; §3.8 shows three rows whose stated expected behavior is a specific `toast.*`
call, and this task re-points the module those flows dispatch through. `Q4` inherits the `Q3` visual obligations
(new/migrated Mantine primitive + Storybook governance + TailAdmin conformance slice) and the `Q1` gates including
the zero-exit build.

**Q4's planted-violation clause applies to R7's new gate.** After `toast.smoke.test.ts` is green, plant a single
violation — swap `VARIANT_COLORS.error` to `'green'` — confirm the test **genuinely fails**, then revert and
confirm green again. Quote both outputs and prove the revert with `git diff --stat` on the touched file. A gate
that cannot fail is not a gate.

**Declared proof path.** `MANTINE_VIEWPORTS` (320/375/390/1024) × sq/en/uk/it for the `NotificationPattern` Story,
plus AC9's live-route 320 capture. The remaining canonical widths are **not** captured — that boundary is Task
678's scope and must be reported as a boundary, never as satisfied full-matrix coverage.

**TailAdmin side-by-side:** **required** — visual chrome is in scope and §6r-LIVE is the cited row. Compare the
rendered toast against §6r-LIVE's measured values (radius 6px, 4px bottom accent, `shadow-theme-sm`, 40×40
`rounded-lg` tinted badge, ≤340px cap, 24px close) and report each as match / deviation. Any deviation is fixed in
`notificationVariants.ts`, never in `theme.ts` (§8).

### 13.2 Worktree

Start state expected **clean**. Snapshot `git status --porcelain` before the first write and record it. If it is
not clean, **stop and report** — do not reconcile foreign paths.

### 13.3 Gates

| Command | Expected |
|---|---|
| `npm run typecheck` | 0 |
| `npx vitest run src/lib/__tests__/toast.smoke.test.ts` | 0 — per-variant assertions, reported individually |
| `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | 0 — registry row `:45`, pre-existing 14 tests |
| `npx vitest run src/components/admin/__tests__/AdminReportsManager.smoke.test.tsx` | 0 — registry row `:61` |
| `npx vitest run src/modules/listings/actions/__tests__/reportListing.smoke.test.ts src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx` | 0 — registry row `:61` |
| `npx vitest run` (full suite) | 0 new failures attributable to this diff; report any pre-existing full-run-only timeout with its isolated re-run |
| *(planted-violation)* | error-colour swap **fails**, revert **passes**, `git diff --stat` clean |
| `npm run check:stories` | 0 |
| `npm run check:story-coverage` | 0, total unchanged (state it) |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL; classify every `AMBIGUOUS`; compare the full manifest against the pre-change run and **name every changed story** |
| `npm run check:design-tokens` | no new violation in touched files; `0 stale-marker(s)` |
| `npm run check:i18n` | 0, 2215×4 |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 |
| `BASE_URL=http://localhost:3000 npm run check:hydration` | required — `[locale]/layout.tsx` changes and the toast root mounts on every SSR route |
| `npm run build` | **0 — hard gate**, transcript tail quoted |

---

## 14. Completion report contract

Session log at `docs/sessions/<date>-task681-sonner-retire-mantine-notifications.md`:

1. `Files Changed` table matching the real `git diff` — with all 34 import-only files listed explicitly.
2. R1–R12 mapped to AC1–AC12 with evidence.
3. The I0 census output, quoted, vs §3.2's expected numbers.
4. Every command with its **actual** exit code; the `npm run build` transcript tail quoted verbatim.
5. The planted-violation before/after output and the revert proof.
6. The `--mantine-only` totals with every `AMBIGUOUS` classified **and the full-manifest cross-story comparison**
   naming every changed story (a Task 672 review finding — do not report only your own story's cells).
7. AC9's measured toast-vs-header rects per locale, with the method and route stated.
8. The TailAdmin §6r-LIVE side-by-side table, match/deviation per measured value.
9. Deviations, each with a reason.
10. Limitations — at minimum: the declared 4-width proof path (§13.1); that `sonner`/`next-themes` remain in
    `package.json` (Task 682); and that toast position moved bottom-right → top-right per D2.

Backlog: concise 681 entry, reserve **682**, keep ≤80 lines (consolidate, do not append).

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_681_SonnerToaster_Mantine_Notifications.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Visual source map

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Toast container position | `<Notifications position="top-right" />` | Mantine-managed | `MantineRootProvider` (already shipped) | **changed vs Sonner** — bottom-right → top-right, **D2** | §3.3, AC9 |
| Toast surface (white, 6px radius) | Mantine `Notification` root | `theme.ts` `components.Notification` | §6r-LIVE `rounded-md`, white | **reuse existing theme** | §3.5 |
| 4px semantic bottom accent | same | `root.borderBottom` | `var(--mantine-color-${color}-5)` | **reuse existing theme** | `theme.ts:726+` |
| Shadow | same | `root.boxShadow` | §6r-LIVE `shadow-theme-sm` | **reuse existing theme** | `theme.ts:726+` |
| 40×40 tinted icon badge | `Notification` icon slot | `icon` style block | `color-0` fill, `color-6` glyph, `radius lg` | **newly reachable** — styled already, but nothing passed `icon` until now | §3.5, AC8 |
| Variant glyph | lucide `CircleCheck`/`OctagonX`/`Info`/`TriangleAlert` | `VARIANT_ICONS` | carried over verbatim from the retired `sonner.tsx` | **reuse, relocated** | §3.2, I1 |
| Variant colour | `notifications.show({ color })` | `VARIANT_COLORS` | green / red / blue / yellow | **reuse, relocated** — moved from the pattern, not copied | §3.6, AC3 |
| Title weight 600 | `Notification` title | `theme.ts` `title.fontWeight` | owner override 2026-07-05 over §6r-LIVE's captured 400 | **reuse existing theme, do not touch** | §3.5, §8 |
| Auto-close 4000ms | `notifications.show({ autoClose })` | `NOTIFICATION_AUTO_CLOSE` | existing in-repo pattern value | **reuse, relocated** | §3.6, A4 |

## 16. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Application toast — **rendered chrome** | `grep -rln "sonner" src/` (full tree, 40 hits); `ls src/stories/mantine/primitives/ \| grep -i notif`; read `Notification.stories.tsx` in full; `grep -n "Notification" .screenshots/rendered-assert/*/manifest.json` | **`Mantine/Primitives/Notification`** — exists, already in the screenshot manifest, renders 5 static `<Notification>` states with the 4 lucide icons at `ICON_SIZE = 24`, deliberately **without** `notifications.show()` | **reuse, unchanged** — it is already the canonical visual source; this task must leave its cells byte-identical and use it as the comparator (AC8) | No new component, no new value; `theme.ts` `Notification` supplies the chrome from §6r-LIVE. **Draft 1 missed this Story entirely and named the Pattern instead — corrected, §3.11 defect 3.** |
| Application toast — **dispatch behavior** | read `MantineNotificationPattern.tsx` and `NotificationPattern.stories.tsx` in full | **`Patterns/Mantine/NotificationPattern`** — the behavioral demo that actually calls `notifications.show()` | **reuse; touch only via the `blueLight` correction (I3)** — it is not the visual source of truth and must not be reshaped to become one | Consumes the shared module from R1; no manifest change |
| Variant → colour mapping | Read `MantineNotificationPattern.tsx` in full; `grep -rn "VARIANT_COLORS" src/` → single declaration | `VARIANT_COLORS` inside `MantineNotificationPattern.tsx` | **extract to shared leaf, then reuse** — a second copy inside the adapter would violate cl. 16b / the no-duplicate rule, and importing the `'use client'` pattern at 169 call sites would drag `@mantine/core` components into every consumer bundle | New `src/design-system/mantine/notificationVariants.ts`; both the pattern and the adapter import it |
| Toast chrome (fill, radius, accent, badge, shadow) | `grep -niE "toast\|notification" docs/tailadmin-style-reference.md` → §6r-LIVE at `:872` (AUTHORITATIVE) and §6r at `:907` (SUPERSEDED) | **§6r-LIVE**, live-captured 2026-07-05, already implemented in `theme.ts:726+` (Task 550) | **reuse-existing, no restyle** — the reference row exists, so cl. 16a is **not** triggered and no value is invented | Existing `theme.ts` `Notification` block; **Task 682** reserved for dependency removal only, not for chrome |

**Clause 16a is not triggered:** unlike Task 672's bottom nav, this artifact **has** an authoritative TailAdmin
reference row with recorded provenance. This task is therefore **not** `BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

## 17. Rule-compliance ledger

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `agent-contract.md` cl. 1 (scope bounded) | A 34-file cross-cutting edit | Import lines only; no drive-by refactor in call-site files | AC4's zero-call-site-hunk proof | `COMPLIANT` |
| cl. 3 (capabilities stay reachable) | 169 user-facing feedback surfaces | Every variant still fires with the same message; none dropped | AC7 | `COMPLIANT` |
| cl. 5 (UX flows intact) | Toast is the terminal step of many flows | Same firing condition, same copy; only transport + position change (D2) | AC4, AC7, AC9 | `COMPLIANT` |
| cl. 7 (four locales) | All messages are `t()`-resolved at call sites | Zero new keys; parity 2215×4 unchanged; no adapter-invented copy (A2) | AC11, AC2 | `COMPLIANT` |
| cl. 9 (validation evidence) | Non-Q0 task | `npm run build` exit 0, fresh transcript **quoted** | AC10 | `COMPLIANT` |
| cl. 11 (mobile/overlay protection) | Fixed overlay below 640px | `w-full` below `sm`, no overflow, no header collision | AC9 | `COMPLIANT` |
| cl. 12 (rendered evidence follows risk) | Q4/Q3 visual work | Declared proof path + live-route capture, machine-produced | AC8, AC9 | `COMPLIANT` |
| cl. 13 (Storybook/no-hardcode gates) | Story changed | `storyT`-backed strings, no raw `<button>`, gates green | AC8 | `COMPLIANT` |
| cl. 14 (file integrity) | Files created, modified, and **deleted** | UTF-8 no BOM, no mojibake; deletion audited for live downstream references (`grep -rn "sonner" src/` = 0) | AC5, AC11 | `COMPLIANT` |
| cl. 15 (critical flows) | Registry rows `:43`, `:45`, `:61` name `toast.*` | Existing baseline preserved; the three registry commands re-run; new gate carries planted-violation proof | §13.3, AC7 | `COMPLIANT` |
| cl. 16 (TailAdmin visual source) | Visual chrome in scope | Every value traced to §6r-LIVE; side-by-side required | §15, §13.1 | `COMPLIANT` |
| cl. 16a (missing reference → provenance) | Reference row **exists** (§3.5) | Not triggered; no value invented | §16 row 3 | `NOT APPLICABLE` |
| cl. 16b (canonical provenance before code) | Variant map + toast chrome | Canonical source searched, found, extracted for shared reuse — not duplicated | §16 rows 2–3, AC3 | `COMPLIANT` |
| cl. 16c (canonical Story cannot be bypassed) | The changed artifact **has** a Story | Story extended in the same task to render all four production variants with icons; no demo stand-in accepted | §16 row 1, AC8 | `COMPLIANT` |
| `component-rules.md` no-duplicate | `VARIANT_COLORS` needed by two consumers | Single declaration, shared leaf module | AC1, AC3 | `COMPLIANT` |

## 18. Execution contract

| Field | Value |
|---|---|
| Task | 681 |
| Active route / owner decision | Single route: adapter-based Sonner retirement onto the already-mounted, already-TailAdmin-conformed Mantine notifications, `top-right` (owner, §3.1 D1+D2) |
| Decision source, date, scope | Owner, 2026-07-29; scope = transport + position + icon conformance; **no** copy change, **no** dependency removal |
| Starting worktree mode | **clean isolated** — §13.2 sets the stop condition |
| Producer of each checkpoint | census → shared module → adapter → adapter test (+ planted violation) → pattern → Story → 34 imports → 3 mocks → unmount/delete → gates → live 320 capture |
| Persisted result | census output; vitest outputs incl. planted-violation pair; `.screenshots/rendered-assert/<ts>/` manifest; live 320 capture artifacts; build transcript tail; session log |
| Comparator | AC4's zero-call-site-hunk diff; AC5's zero-hit grep; AC7's per-variant argument assertions; AC9's rect-vs-rect measurement; AC12's arithmetic |
| Failure path | Census divergence or a fifth call shape → stop (A1); planted violation does **not** fail → the gate is void, stop; header collision at 320 → report, do **not** change position (I9); dirty start → stop (A5) |
| Zero/empty input case | `toast.warning` (4 sites) and `toast.info` (7 sites) are the sparse variants most likely to be missed — both are first-class AC7 assertions, not edge cases |
| Task-created artifacts in baselines | The `warning` Story export is task-created, so its screenshot cells have **no** pre-change baseline. Capture the `--mantine-only` baseline **before** I8 adds the export, and compare like-for-like; do not report the new cells as regressions or as unchanged |

## 19. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every path, line number, count, command, expected number and both owner rulings are inline |
| Every primary requirement has a binary AC | **Yes** — R1–R12 → AC1–AC12 |
| Scope names what must not change | **Yes** — §8, incl. `theme.ts`, `package.json`, call-site arguments, registry, position |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4 (with the registry rows that trigger it); §16 |
| Canonical-source search performed before proposing a style | **Yes** — §16; the search **found** an existing Story and an existing reference row, which is why the disposition is extend/reuse, not create |
| Owner-only exceptions traceable | **Yes** — D1 and D2, each with question, answer, date and scope (§3.1); §6r-LIVE's title-weight override cited to its own dated owner ruling |
| Baselines account for task-created artifacts | **Yes** — §18 row 9: the `warning` cells have no pre-change baseline, and the capture order is specified |
| Dirty-worktree handling | **Yes** — clean start asserted with a stop condition (§13.2, A5) |
| Gates prove the changed behavior | **Yes** — AC4 asserts the *absence* of call-site hunks; AC7 asserts actual `show()` arguments; the Q4 planted violation proves the new gate can fail; AC9 measures rects rather than eyeballing |
| Single active owner route | **Yes** — the only forks are A1's census stop and A5's dirty-worktree stop |
| API claims verified, not assumed | **Yes** — §3.4 reads the installed `notifications.store.d.ts`; §3.2's counts are grep output; §3.5 quotes the authoritative reference block and the implementing `theme.ts` lines |

**Draft-2 provenance.** This kickoff was corrected on 2026-07-29 after Sonnet's I0 stop exposed five draft-1
research defects (§3.11). The corrections were verified by tree-wide greps and by reading
`Notification.stories.tsx` and `theme.ts:139/837` — not by patching the numbers to agree. Reviewers should treat
§3.2, §3.6a, §3.11 and §16 as the re-verified sections.

**Known-risk note for the reviewer.** Six likely defects. Zeroth, **deleting `sonner.tsx` before unmounting the
admin layout** — I7's ordering is load-bearing, and getting it wrong fails the build. First, **scope creep in the
33-file edit** — a "helpful" refactor inside a call-site file; AC4's `git diff -U0` hunk count is the detector.
Fifth, **"fixing" the canonical `Notification` Story** to fire real notifications or to match the Pattern — AC8's
byte-identity comparator is the detector. Second, **inventing a `title`**
to make the toast look fuller, creating untranslated user-facing copy (A2 forbids it; AC7 asserts
`title === undefined`). Third, **copying `VARIANT_COLORS` into the adapter** instead of extracting it — AC3's
zero-hit grep on the original declaration is the detector. Fourth, **declaring AC9 satisfied from a Storybook
screenshot** — the header is not in the pattern Story, so only a live-route capture can prove the collision case;
a Storybook cell is not acceptable evidence for that AC.
