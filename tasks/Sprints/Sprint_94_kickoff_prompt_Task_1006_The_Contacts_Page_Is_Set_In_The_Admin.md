# Task 1006 — The "Contacts" page is set in the admin: its text, which contacts it shows, and the form

Sprint 94. Priority P2. Owner decisions: O989-1 (2026-11-19, translated): "The 'Contacts' page must be a separate page
altogether, which must be fully configured in the admin, namely: settings for showing this or that contact element (a
switcher), the feedback form (it is already implemented), editable text after the heading 'Contact us', which the admin
can edit in the admin!"; O989-3 (2026-11-19, translated): footer settings are merged into the Footer page and "Site
settings - Footer" is removed, so one admin page holds one surface; O1006-1 (2026-11-19, translated): "this must be a
setting on the 'Contacts' page, namely a field for entering the address to which the letters from the form will be
sent."; O1006-2 (2026-11-19, translated): "The user chose a topic; an e-mail address is attached to each topic, so each
letter goes to the address attached to its topic. If the user replied to the letter sent to them in reply, that letter
must come to the address from which the admin's or moderator's reply was sent from the admin. By the way, this must
also be a separate setting in the admin on the 'Contacts' page, where the admin can change the address of each topic in
the feedback form." and "Right now the functionality works correctly."; O1006-3 (2026-11-19, translated): "Sending
letters without a chosen topic must not be allowed; the send button must be disabled." Plan file:
`tasks/Sprints/Sprint_94_Owner_List_Of_2026-11-19.md`. Implementer: Sonnet. Reviewer: Opus. Human owner of the change:
the owner.

## Goal

After the task: the admin has a "Contacts page" page (Content group, beside "Footer") where the admin writes the text
under the heading "Contact us" in each of the four languages and switches on or off each contact (phone, support e-mail,
sales e-mail, social links) and the feedback form, and changes the address of each of the form's six topics; a message
goes to its topic's address and a staff reply is still sent from that address, so the user's answer returns to it, as
today; the form's Send button stays disabled until a topic is chosen; the contact values themselves stay on the
Footer page; the public
`/contact` page shows exactly that, built from canonical Mantine parts.

## Cause

Read at `213103f0a`
- The page renders the heading and the text under it from the message catalogue and then the form, nothing else (`src/app/[locale]/contact/page.tsx:26-36`); no setting is read, so the admin can change neither the text nor what the page shows.
- The topic starts empty (`src/modules/contacts/components/ContactForm.tsx:35`) and Send is disabled only while sending (`:193`); a press without a topic shows "Please select a topic" (`:120`) and the server refuses an empty or unknown topic (`src/modules/contacts/actions/index.ts:78-79`), so no message leaves without a topic today, but the button looks pressable.
- The page and the form are built from Tailwind classes and the legacy `@/components/ui` kit (`src/app/[locale]/contact/page.tsx:29-34`, `src/modules/contacts/components/ContactForm.tsx:7-10`).
- The form delivers to the server variables `CONTACT_SUPPORT_EMAIL` and `CONTACT_SALES_EMAIL`, chosen by topic (`src/modules/contacts/actions/index.ts:20-27`, `:32-33`); no admin setting holds a topic's address.
- The reply path is right today and stays: a staff reply is sent from the stored address with it as Reply-To (`src/modules/notifications/lib/emails/contactInquiry.ts:256-258`, called with `inquiry.target_mailbox` at `src/modules/contacts/actions/index.ts:269`), so the user's answer returns to the address the message went to. Production, read-only 2026-11-19: `node mailbox.mjs` → partnership and sales → sales@lero.al, general and support → support@lero.al, five replies on three of them.
- The admin "Support" and "Sales" inquiry pages split messages by whether the stored address contains "sales" (`src/app/admin/inquiries/sales/page.tsx:29`, `src/app/admin/inquiries/support/page.tsx:29`, `src/components/admin/AdminInquiriesManager.tsx:69`), so a topic address set in the admin without that word would land on the wrong page.
- Mail goes through Resend (`src/modules/notifications/lib/emails/send.ts:14`, `:87-89`) with the site's own domain as sender (`:18`), and Resend "sends emails using a domain you own (i.e., not a shared or public domain)" (resend.com/docs/dashboard/domains/introduction, read 2026-11-19), so a reply from a topic address on another domain would fail.

Fix: an admin "Contacts page" page whose settings the public page reads, with an address per topic on the site's mail domain; delivery uses the topic's address and the reply keeps today's sender; the inquiry pages split by topic; Send stays disabled until a topic is chosen; the page and the form move to canonical Mantine parts.

## Scope

- Dependencies: Task 989 (`src/modules/admin/lib/settingKeys.ts` with its validators, the Footer page that holds the phone, the two e-mails and the social links, the reach test) and Task 955 (`src/lib/security/securityEvent.ts`). Task 959 adds Turnstile to the same form: if it has merged, the Mantine form keeps its widget; otherwise 959 adds it to the Mantine form.
- Keys: `contact_intro_sq`, `contact_intro_en`, `contact_intro_uk`, `contact_intro_it` (plain text, at most 1000 characters, line breaks kept); `contact_topic_email_general`, `_sales`, `_support`, `_partnership`, `_press`, `_other` (one address each: the 989 e-mail validator and the domain of `FROM_ADDRESS`, `send.ts:18`; empty = the topic's server variable); switches `contact_show_phone`, `contact_show_email_support`, `contact_show_email_sales`, `contact_show_social`, `contact_show_form` (`'true'` or `'false'`, absent = on).
- Admin: `src/app/admin/contact-page/page.tsx` (administrator only, as the Footer page; inside `AdminPageFrame` as `src/app/admin/currency/page.tsx:20`, listed in `src/app/admin/__tests__/adminPageFrame.test.ts`) with `src/components/admin/AdminContactPageManager.tsx` (Mantine): the "Form topics" block, one address field per topic labelled with the topic's name (empty shows that the server address applies), the five switches in a shared block, each showing the current value from the Footer page and a link to edit it there, then language tabs with the intro (`Textarea` with a counter); a sidebar entry after "Footer" (`src/components/admin/AdminSidebar.tsx:55`).
- `src/modules/admin/actions/contactPage.ts` (new): `saveContactPage`, the same admin check as the Footer page actions before any read, the validators, writes `site_settings`, revalidates `/[locale]/contact`; a save writes `authz_admin:<user hash>,contact_page_saved`, and a changed topic address also `authz_admin:<user hash>,contact_topic_email_changed` (Task 955 vocabulary; no address in the event).
- Delivery (`src/modules/contacts/actions/index.ts`): each topic goes to its `contact_topic_email_<topic>`, checked again with the validator at use; empty, unreadable or invalid → today's server variable of the topic (`TOPIC_MAILBOX`). `target_mailbox` stores the address used. The reply is unchanged (O1006-2): sent from `target_mailbox` with it as Reply-To. The two inquiry pages and `AdminInquiriesManager` split by the topic's group in `TOPIC_MAILBOX` (sales, partnership, press → Sales; general, support, other → Support), which lists every stored row where it is today, instead of the address text. `docs/env.md` lines 13-14: the variables are the fallback of an empty topic.
- `src/modules/contacts/components/ContactPageView.tsx` (new, prop-driven) with Story `src/stories/patterns/mantine/ContactPageView.stories.tsx`: heading `contact.title` → the intro of the page's language as paragraphs (empty → `contact.subtitle`) → the contacts through `MantineDetailList` (phone as `tel:`, e-mails as `mailto:`, social links as outside links), each only when filled and on → the form when on. `page.tsx` reads the settings with `getSettings` and renders the view; `generateMetadata` uses the intro's first 160 characters when filled. No `className` in the page.
- `ContactForm.tsx` moves to Mantine (`MantineFormSectionStack`, `TextInput`, `MantineTextarea` of Task 1008 for the message, or Mantine `Textarea` if 1008 has not merged, which 1008 then switches, `MantineCombobox`), same fields, messages and action; Send is disabled while no topic is chosen and while sending (O1006-3), and the server keeps refusing an empty topic; no `@/components/ui` import (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`); `ContactForm.tsx`, `ContactPageView.tsx` and `AdminContactPageManager.tsx` join `scripts/mantine-migration-scope.json`, and the legacy page frame of `src/app/[locale]/contact/page.tsx` goes with the move to the view.
- Messages in four locales (`admin.sidebar.item_contact_page`, `admin.contact_page.*`).
- Out of scope: the contact values (Task 989), the form's limiter and Turnstile (Task 959).

## Attack surface

Changed: a new admin action; staff-saved text and switches are output on a public page; the form's delivery address.
1. **What are we working on?** Fifteen settings written by an administrator through `saveContactPage`, read with the service
   role, rendered on `/contact` to every visitor; the six topic addresses used by `submitContactInquiry` and, through the stored address, by the reply.
2. **What can go wrong?**
   - T1 E: anyone calls `saveContactPage` → mitigate: the admin check before any read or write → AC2, `SEC-1006-SAVE-DENY`.
   - T2 T/I: an intro with markup runs in visitors' browsers → mitigate: plain text, React escapes it, no HTML sink → AC3, `SEC-1006-INTRO-TEXT`.
   - T3 T: a switch or text outside its rule is stored → mitigate: the validators refuse it → AC2.
   - T4 D: a failed settings read breaks the page → mitigate: the catalogue text, no contacts, the form shown → AC1.
   - T5 I/R: a taken-over administrator account sends visitors' messages elsewhere (owner decisions O1006-1 and O1006-2
     add the fields) → mitigate: administrator only, one plain address on the site's mail domain per topic, checked
     again at use, each change a security event → AC2, AC6.
   - T6 T: an address with `?cc=` or a line break adds recipients or headers → mitigate: the validator on save and at use → AC2, AC6.
3. Each mitigation is an acceptance criterion with a test that fails when the control is removed.
4. Authorization matrix: `SEC-1006-SAVE-DENY` — `saveContactPage` as anonymous, user, agent and moderator → refused, nothing written; as admin → saved.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-19, revised with O989-3).

- Abuse_Case: "it is important to identify the attacks which the application must defend against" — a forged call of the new action and a hostile intro are the abuse cases of the threat model — AC2, AC3.
- AI_Agent_Security: not applicable — the task cites a project rule file; no agent, tool or agent permission changes.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the new action and the nine settings output on `/contact` — AC1, AC2, AC3.
- Authentication: not applicable — no sign-in, password or session path changes; the public page needs no account.
- Authentication_Patterns: not applicable — no authentication scheme is added or changed by this task.
- Authorization: "Permission should be validated correctly on every request, regardless of whether the request was initiated by an AJAX script, server-side, or any other source." — `saveContactPage` checks the admin before any read or write — AC2.
- Authorization_Decisions_And_Output_Handling: "Fail closed. Deny protected operations on PDP errors, timeouts, or unusable output." — a failed admin check refuses and writes nothing — AC2.
- Authorization_Patterns: "Keep enforcement close to the protected resource so it can check the requested action, object, and tenant." — the check runs inside the action, not in the admin page — AC2.
- Authorization_Regression_Testing: "Automated tests should specifically target the ways authorization usually degrades over time." — `SEC-1006-SAVE-DENY` fails if the check is removed — AC2.
- Authorization_Testing_Automation: "Integration test cases validate the correct implementation of the authorization matrix." — the matrix row runs for anonymous, user, agent, moderator and admin — AC2.
- Bot_Management_and_Anti-Automation: not applicable — the form's limiter and Turnstile are Task 959; the move to Mantine keeps the action call unchanged.
- Content_Security_Policy: not applicable — no script, style or frame source is added; the policy is Task 954.
- Cookie_Theft_Mitigation: not applicable — no cookie is added or changed by this task.
- Credential_Stuffing_Prevention: not applicable — the page has no sign-in; the form's human check is Task 959.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the intro is validated on save and rendered as React text — AC2, AC3.
- Cryptographic_Storage: not applicable — nothing is encrypted or stored with a key; the event hash is the Task 955 helper.
- Database_Security: not applicable — "migration" names the Mantine UI migration; no schema, grant or SQL file changes.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the intro reaches only text nodes; the contact values only `href` through `resolveLinkTarget` — AC3.
- Denial_of_Service: "Using validation that is cheap in resources first" — one read of named keys per request; the intro is capped at 1000 characters on save — AC1, AC2.
- GraphQL: not applicable — the project has no GraphQL endpoint; "migration" names the Mantine UI migration.
- Identity_Propagation_Patterns: not applicable — the service-role read of public settings carries no identity, as today.
- Injection_Prevention: not applicable — the migration manifest is a JSON list of paths; no interpreter receives input.
- Input_Validation: "Reject invalid requests with a clear error; do not continue with partially validated data." — one invalid value refuses the whole save, and each topic address is checked again at use — AC2, AC6.
- Insecure_Direct_Object_Reference_Prevention: not applicable — the action writes fixed keys; no row is chosen by a client identifier.
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or regular expression over input is added.
- Key_Management: not applicable — no key is created or used; the hash salt belongs to Task 955.
- LLM_Prompt_Injection_Prevention: not applicable — no language model reads or writes any data of this task.
- Mass_Assignment: "Do not rely on a block-list as the sole protection: a new or overlooked sensitive field remains bindable." — the action accepts only its fifteen keys with validators; the reach test fails for an unread one — AC2.
- MCP_Security: not applicable — no MCP server, tool or agent permission is added or changed here.
- Multi_Tenant_Security: not applicable — "migration" names the Mantine UI migration; no tenant data path changes.
- Multifactor_Authentication: not applicable — no factor or staff sign-in changes here.
- Nextjs_Security: "Treat each reachable action as a client-callable POST entry point." — `saveContactPage` is tested by direct call without a session and with forged values — AC2.
- OAuth2: not applicable — no OAuth flow or return path is touched.
- OS_Command_Injection_Defense: not applicable — editing the migration manifest starts no operating system process at all.
- Prototype_Pollution_Prevention: not applicable — the view takes named props; no object is built from client keys.
- Query_Parameterization: not applicable — "migration" names the Mantine UI migration; no query text is built here.
- React_Security: "Where possible, render untrusted content as text using JSX expressions." — the intro is validated on save and rendered as React text — AC2, AC3.
- Secrets_Management: not applicable — the two existing server variables stay where they are; no secret is added.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — reviewed with the review-task skill on this task's diff — AC8.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — no dependency added; the reviewer reruns every claim of the report — AC8.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — the threat model's mitigations are AC1-AC3 and AC6.
- Session_Management: not applicable — no session is created or changed by the page or the action.
- SQL_Injection_Prevention: not applicable — "migration" names the Mantine UI migration; no SQL is written or built.
- Third_Party_Javascript_Management: not applicable — no outside script is added; Turnstile loading is Task 959.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — answered in "## Attack surface" — AC1, AC2, AC3, AC6.
- Unvalidated_Redirects_and_Forwards: not applicable — the social links open outside sites in a new tab; no redirect is built from input.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the implementer's results, the deliberate breaks included — AC8.
- Web_Cache_Security: not applicable — the revalidation refreshes the public page only; no per-user data enters it.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — no HTML sink; the intro is text — AC3.

## UI

GR-0 queries: "contact details list", "public form", "settings switches". Inspected: `MantineDetailList` and its Story
`DetailList`, `MantineFormSectionStack`, `MantineCombobox`, `Mantine/Primitives/Switch`, `CmsPageView` (heading scale),
the Footer page of Task 989. Decision: CREATE `ContactPageView` composed only of these; REUSE them; one column (heading →
text → contacts → form), no new layout decision; the admin page follows the Footer page's shared block and language tabs.
Reference research (GR-7): inherited canonical design — owner decision 2026-10-20 (`MantineDetailList`,
`MantineFormSectionStack`, `Mantine/Primitives/Switch`).

## Mobile adaptation record
- Scope: visible
- Surfaces: src/modules/contacts/components/ContactPageView.tsx — the contacts page; src/modules/contacts/components/ContactForm.tsx — the form; src/components/admin/AdminContactPageManager.tsx — the admin page
- Component families: record-list-and-data, form-picker-and-choice
- Pattern IDs: linear-flow, key-value-stack, form-stack
- Standards: w3c-reflow, w3c-meaningful-sequence, apple-hig-layout, android-adapt-layouts, android-layout-basics, android-content-structure, w3c-labels-instructions
- Mantine mechanism: responsive-props
- Mantine owner: src/design-system/mantine/patterns/MantineDetailList.tsx, src/design-system/mantine/patterns/MantineFormSectionStack.tsx
- Mobile range and switches: <640px (theme.other.mobileGate / sm): one column at full width, each contact label above its value, form fields full width; 640px transition: the same column at the page's content width
- Mobile order: heading → text → phone → support e-mail → sales e-mail → social links → form; admin — topic addresses → switches → language tabs → text
- Required-content treatment: text, addresses and phone wrap at any character, never truncated
- Story and verification: ContactPageView (all on; some off; empty text; form off) at 320px, 639px, 640px and 1440px × sq, en, uk, it

## Acceptance criteria

- AC1 The page follows the admin — test: `src/app/[locale]/contact/__tests__/contactPage.test.tsx` (new): the intro of the page's language, the catalogue text when empty; each contact shown when filled and on, hidden when off or empty; the form hidden when off; a failed read shows the catalogue text and the form.
- AC2 The write holds its rules and its check — test: `src/__tests__/security/staffActions.test.ts` (extended): `saveContactPage` refuses an intro over 1000 characters, a switch other than `'true'` or `'false'`, and a topic address with a space, `?`, `&`, `,`, `;`, a line break, over 254 characters or outside the domain of `FROM_ADDRESS`, and `SEC-1006-SAVE-DENY`; a valid admin save writes the fifteen keys and the two events.
- AC3 The intro is text — test: `src/modules/contacts/components/__tests__/ContactPageView.test.tsx` (new): `SEC-1006-INTRO-TEXT`: an intro with `<script>` and `<img onerror>` renders as text; line breaks become paragraphs.
- AC4 The admin page saves every field — test: `src/components/admin/__tests__/AdminContactPageManager.test.tsx` (new): the six topic addresses, the five switches with the Footer page's values, the four texts; saving sends their keys.
- AC5 The form keeps its behaviour on Mantine — test: `src/modules/contacts/components/__tests__/ContactForm.test.tsx` (new): each validation message; Send is disabled with no topic and enabled once one is chosen; a valid submit calls `submitContactInquiry` with the same fields; no `@/components/ui` import; `npm run check:enrolled-tailwind`, `npm run check:rendered-scope` and `npm run check:story-coverage` pass with the three files enrolled in `scripts/mantine-migration-scope.json` and no baseline entry for them; and `contacts.security.test.ts` (extended): a direct call with an empty or unknown topic is refused and nothing is stored or sent.
- AC6 Messages reach their topic's address, replies come from it, and messages stay filed — test: `src/modules/contacts/actions/__tests__/contacts.security.test.ts` (extended: each of the six topics goes to its set address; empty, unreadable or an invalid stored value → the topic's server variable; a reply is sent from the stored address with it as Reply-To) and `src/app/admin/inquiries/__tests__/inquiriesSplit.test.tsx` (new: a sales topic sent to an address without "sales" is listed under Sales, a support topic under Support).
- AC7 Stories, widths and languages hold — test: `node scripts/check-i18n-parity.mjs`, `node scripts/check-mobile-adaptation-contract.mjs` and the census of `.claude/rules/shared/rendered-state-census.md` for `ContactPageView`.
- AC8 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. Starts after Tasks 989 and 955 are merged. Branch from `main`. Read the contact page, the form, its action, the inquiry pages, `contactInquiry.ts`, `settingKeys.ts`, the Footer page with its action, `AdminSidebar.tsx`, `MantineDetailList`, `MantineFormSectionStack`.
2. Tests first (AC1-AC6); save each failing output.
3. Keys, the action, the admin page and sidebar entry, the delivery and the inquiry split, the view and its Story, the page, the form on Mantine, the messages, `docs/env.md`. One pass over every changed file (checklist I7).
4. Run: the task tests · CI on GitHub only (`gh pr checks <n>`, checklist A5); deliberate breaks: the intro through an HTML sink → `SEC-1006-INTRO-TEXT` fails; the admin check removed → `SEC-1006-SAVE-DENY` fails; the validator at use removed → the AC6 invalid-address case fails; each restored.
5. Report: each command, exit code, relevant output. After the merge the owner writes the four texts and, when wanted, the topic addresses; Opus checks `/contact` in four languages at 390 and 1440.

## Review
