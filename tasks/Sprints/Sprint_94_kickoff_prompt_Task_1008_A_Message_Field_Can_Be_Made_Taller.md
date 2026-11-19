# Task 1008 — A message field can be made taller with a handle at its bottom

Sprint 94. Priority P2. Owner request (2026-11-19, translated): "The 'Message' field must have an option to extend the
field's height, as in the screenshot (at the bottom of the 'Message' field)"; the screenshot shows a message editor
with a short bar centred under its text area. Plan file: `tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

After the task: every multi-line field on canonical Mantine shows a short bar centred under its text area; dragging it
with a mouse, pen or finger, or moving it with the keyboard, makes the field taller (and back down to its starting
height); one canonical component owns that look and behaviour, and a gate keeps every multi-line field on it.

## Cause

Read at `1d625874c`
- The contact form's "Message" field is a legacy textarea with resizing switched off: `rows={5}` and `className="resize-none"` (`src/modules/contacts/components/ContactForm.tsx:178-183`).
- Mantine's `Textarea` sets CSS `resize` to `'none'` by default: `grep -n "resize" node_modules/@mantine/core/lib/components/Textarea/Textarea.d.ts` → `11: /** Controls resize CSS property @default 'none' */`, and the theme sets no other value (`src/design-system/mantine/theme.ts:1083-1095`), so no Mantine multi-line field can be made taller either: `src/components/admin/AdminUserProfileDialogsView.tsx:63`, `src/components/admin/CreateTicketDialogView.tsx:117`, `:160`, `src/components/admin/InquiryDetailDialogView.tsx:140`, `src/components/admin/ReportDetailDialogView.tsx:221`, `src/components/admin/StatusChangeSelect.tsx:88`, `src/components/admin/TicketDetailDialogView.tsx:160`, `src/design-system/mantine/patterns/MantineFormSectionStack.tsx:96`, `src/design-system/mantine/patterns/MantineTwoColumnForm.tsx:77`, `src/modules/listings/components/ListingInquiryDialogView.tsx:87`.
- The browser's own handle cannot serve phones: MDN browser-compat-data `css.properties.resize` (read 2026-11-19) → `safari_ios` "version_added": false, "The property is recognized, but has no effect"; `firefox_android` removed in 79 with the same note. It also sits in the corner, not centred as in the owner's screenshot.
- Mantine's input wrapper offers a place for a bar under the text area: `grep -n "inputContainer" node_modules/@mantine/core/lib/components/Input/InputWrapper/InputWrapper.d.ts` → `25: inputContainer?: (children: React.ReactNode) => React.ReactNode;` (Mantine 8.3.18). The autosize textarea refuses an inline `style.minHeight` (`src/design-system/mantine/theme.ts:1088-1090`), so the height is set on the element, not through the React `style` prop.
- One owner per visual element is already gated for badges (`scripts/check-badge-canonical.mjs:61`, run by `scripts/quality/product-gates.mjs:52`); no gate keeps multi-line fields on one owner.
- Legacy `@/components/ui/textarea` fields reach the canonical field through their open migrations: `ContactForm.tsx` (Task 1006), `src/components/admin/AdminSettings.tsx` (Task 989), `src/modules/listings/components/ListingFormShellView.tsx` (Task 957, which took over that migration from Task 907 on 2026-11-19) and `src/modules/listings/components/steps/StepBasicInfo.tsx` (Task 905), `src/modules/listings/components/ListingReportDialog.tsx` (Task 795). `src/components/admin/AdminLegalManager.tsx` is rendered by no route: `grep -rln AdminLegalManager src` → the file itself and `src/__tests__/reactHooksV7Components.test.tsx`.

Fix: a canonical `MantineTextarea` with the bottom handle, every Mantine multi-line field on it, a gate that refuses any other `Textarea` import, and the unused legal manager removed.

## Scope

- `src/design-system/mantine/patterns/MantineTextarea.tsx` (new, client): takes Mantine `Textarea` props unchanged and renders the handle through `inputContainer`, under the text area inside the field: a short bar centred as in the owner's screenshot, drawn with theme tokens only (gray shade, radius), hit area at least 24 by 24 CSS pixels.
- Behaviour: dragging (pointer events with pointer capture, `touch-action: none` on the handle, so a finger drag does not scroll the page) changes the height in whole lines, from the field's starting height up to the viewport height; it sets the text area's minimum height on the element, so an autosize field still grows with its text and never gets shorter than it started. Keyboard: the handle is focusable, role `separator`, `aria-orientation="horizontal"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` in lines, label `common.textarea_resize` ("Change the field's height") in four locales; Arrow Down and Arrow Up one line, Home and End to the limits. A disabled or read-only field shows no handle.
- The ten Mantine fields of "## Cause" switch to `MantineTextarea` with their props unchanged; any Mantine `Textarea` added before this task merges (Tasks 905, 957, 989, 1006) switches too.
- `scripts/check-textarea-canonical.mjs` (new, modelled on `check-badge-canonical.mjs`): refuses a `Textarea` import from `@mantine/core` outside `MantineTextarea.tsx` in production files (Stories and tests excluded, as there); `--verify-gate` self-test; run by `scripts/quality/product-gates.mjs` after the badge gate; `package.json` scripts `check:textarea-canonical` and `check:textarea-canonical:verify`.
- `scripts/mobile-adaptation-patterns.json`: `MantineTextarea.tsx` joins the members of `form-picker-and-choice`, and `scripts/mantine-migration-scope.json` enrols it.
- The ten fields switch in files already on Mantine; a changed file that still carries a legacy part moves it to Mantine in this task (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`).
- The Story `Mantine/Primitives/Textarea` (`src/stories/mantine/primitives/Textarea.stories.tsx`) renders `MantineTextarea` in each of its states.
- `AdminLegalManager.tsx` and its block in `reactHooksV7Components.test.tsx` are deleted; `admin.legal` message keys read by no other file leave with it.
- Out of scope: the legacy fields until their tasks move them (the gate makes each use `MantineTextarea`), the rich text editor (Task 990).

## Attack surface

Attack surface: unchanged. A presentation and input-height change inside existing forms; no data, request, action,
storage or permission changes, and the deleted component is rendered by no route.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19).

- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the field keeps React's value binding and the handle renders only its translated label — AC1.
- Database_Security: not applicable — "migration" names the Mantine UI migration; no schema, grant or SQL file changes.
- DOM_Clobbering_Prevention: not applicable — the rich text editor is out of scope; the handle adds no element named from input.
- DOM_based_XSS_Prevention: not applicable — no input value reaches a DOM sink; the handle writes a height in pixels.
- Dependency_Graph_SBOM: not applicable — `package.json` gains two script entries; no dependency or lockfile change.
- GraphQL: not applicable — the project has no GraphQL endpoint; "migration" names the Mantine UI migration.
- Injection_Prevention: not applicable — the gate reads source files as text and builds no command or query.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over user input is added.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Mass_Assignment: not applicable — "migration" names the Mantine UI migration; no object is bound from client keys.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: not applicable — "migration" names the Mantine UI migration; no tenant data path changes.
- NPM_Security: not applicable — no package is added, removed or updated; only two script entries.
- OS_Command_Injection_Defense: not applicable — the new gate starts no process; `product-gates.mjs` gains one fixed argument list.
- Query_Parameterization: not applicable — "migration" names the Mantine UI migration; no query text is built here.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC5.
- Software_Supply_Chain_Security: not applicable — the lockfile does not change and no dependency is added.
- SQL_Injection_Prevention: not applicable — "migration" names the Mantine UI migration; no SQL is written or built.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate break included — AC5.
- Vulnerable_Dependency_Management: not applicable — no dependency version changes in this task at all.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink is added — AC1.
- XSS_Filter_Evasion: not applicable — no filter or sanitiser is added or changed; the editor is Task 990.

## UI

GR-0 queries: "textarea resize", "resize handle", "message field". Inspected: `Mantine/Primitives/Textarea` Story, the
ten Mantine fields, the legacy contact form, Mantine's `Textarea` and `inputContainer` types. Decision: CREATE
`MantineTextarea` (no canonical multi-line field with a handle exists) at the shared owner with its direct Story;
consumers pass data and documented props only. Reference research (GR-7): the owner's screenshot (a centred bar under
the message editor); inherited canonical design for the field chrome — owner decision 2026-10-20 (`input-chrome.css`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/design-system/mantine/patterns/MantineTextarea.tsx — the multi-line field and its handle, in every form that uses it
- Component families: form-picker-and-choice
- Pattern IDs: form-stack, inline-control
- Standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineFormSectionStack.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): the field at full width, the handle centred under it, dragged by a finger; 640px transition: the same field and handle at the form's width
- Mobile order: label → text area → handle → description → error
- Required-content treatment: the text wraps inside the field; the handle never covers text; no clipping
- Story and verification: Mantine/Primitives/Textarea at 320px, 639px, 640px and 1440px × sq, en, uk, it, with a touch drag at 390px

## Acceptance criteria

- AC1 The handle makes the field taller — test: `src/design-system/mantine/patterns/__tests__/MantineTextarea.test.tsx` (new): a pointer drag down by three lines adds three lines; a drag up stops at the starting height; Arrow Down, Arrow Up, Home and End move it by one line and to the limits; the handle has role `separator`, its label and `aria-valuenow`; an autosize field still grows with its text after a drag; a disabled field has no handle.
- AC2 One owner for multi-line fields — test: `node scripts/check-textarea-canonical.mjs` reports 0 violations, its `--verify-gate` self-test refuses a planted `Textarea` import from `@mantine/core` outside `MantineTextarea.tsx`, and `node scripts/quality/product-gates.mjs` runs it; `npm run check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` pass with `MantineTextarea.tsx` enrolled.
- AC3 The unused legal manager leaves — test: `npx tsc --noEmit` and `npx vitest run src/__tests__/reactHooksV7Components.test.tsx` pass, and `node scripts/check-i18n-parity.mjs` passes after the keys leave.
- AC4 Stories, widths and languages hold — test: `node scripts/check-mobile-adaptation-contract.mjs`, `node scripts/check-i18n-parity.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for `Mantine/Primitives/Textarea`, with a touch drag at 390px that makes the field taller.
- AC5 The CI jobs pass — test: every no-secret job of `.github/workflows/ci.yml` as written (CI-parity rule of `flow.md`, `npx --yes npm@10.9.8 ci`), then `gh pr checks <n>`.

## Route

1. Branch from `main`. Read the ten fields, `ContactForm.tsx`, `theme.ts` (Textarea), `input-chrome.css`, `check-badge-canonical.mjs`, `product-gates.mjs` and the Textarea Story.
2. Tests first (AC1, AC2); save each failing output.
3. The component, the switch of the ten fields, the gate and its self-test, the family member, the Story, the messages, the deletion. Three passes over every changed file (`flow.md` §2).
4. Run: the task tests · the CI job commands of the CI-parity rule (`flow.md`), read from `ci.yml`, with `npx --yes npm@10.9.8 ci`; deliberate break: a Mantine `Textarea` import planted in a production file → the gate fails; restored.
5. Report: each command, exit code, relevant output. After the merge Opus drags the handle of the listing inquiry message at 390 (touch) and 1440 (mouse) in Ukrainian.

## Review
