# Sprint 13 — Critical Bugs (owner directive 2026-05-27)

Owner: shtepiprone@gmail.com
Source: owner verbal report 2026-05-27 (7 production bugs)
Tasks: **255, 256, 257, 258, 259, 260, 261**

> **🆕 NEW MANDATORY RULE (owner directive 2026-05-27, codified in `docs/orchestrator-role.md`
> and `docs/agent-contract.md` clause 6a).** Every kickoff in this sprint contains TWO explicit
> sections: `Positive flow (happy path)` and `Negative flow (every off-happy-path branch)`.
> Sonnet must implement BOTH. A diff that ships only the happy path is INCOMPLETE — the
> orchestrator routes it back without approval. See the new entry in
> `docs/orchestrator-role.md` → "Orchestrator standing rules" + "Review checklist".

## Owner-reported bug list (verbatim)

1. **Bug 1** — When sending letters from admin, the full message history must always be preserved. Currently only the user's original request is visible; admin/moderator replies are not shown.
2. **Bug 2** — No mail is being delivered to `sales@lero.al`.
3. **Bug 3** — When opening emails in admin, the topic label shows the raw value "Тема general" instead of the correctly translated topic in the current locale.
4. **Bug 4** — An authenticated user viewing a listing sees the contact card render "N/A · Приватна особа" instead of the actual owner's name and account type.
5. **Bug 5** — On the listing detail page the contact card has a "Save to collection" button. The collection is created and saved, but the user can't find it anywhere — it should appear under "Favorites → Collections".
6. **Bug 6** — Activating premium for a listing in admin does not work. Find the root cause, fix it, verify both activation AND deactivation positive + negative flows.
7. **Bug 7** — Every `<button>`, Combobox, and Select trigger must show `cursor: pointer` on hover.

## Sprint-13 task table

| Task | Title | Epic | Owner-bug | Primary surface |
|---|---|---|---|---|
| 255 | Admin Inquiries reply history visible in detail panel | V (Contacts & Inquiries) | Bug 1 | `AdminInquiriesManager` detail dialog + `sendInquiryReply` returned data |
| 256 | `sales@lero.al` delivery investigation + verified-sender enforcement | V (Contacts & Inquiries) / GG (email policy) | Bug 2 | `resolveMailbox`, Resend sender verification, `submitContactInquiry`, ENV |
| 257 | Translate inquiry topic in admin (no more raw "general") | V (Contacts & Inquiries) / N (locale) | Bug 3 | `AdminInquiriesManager.displaySubject` + `messages/*.json` admin.inquiries.topics |
| 258 | Listing detail contact card: real owner name + correct user_type for authed viewers | T (Global UX Polish) | Bug 4 | `app/[locale]/listings/[slug]/page.tsx` (RLS+JOIN), `ListingContact.tsx` |
| 259 | Save-to-Collection visibility in Favorites → Collections | F (Favorites) | Bug 5 | `SaveToCollectionButton`, `FavoritesShell`, `CollectionsSection`, realtime refresh |
| 260 | Premium activation/deactivation in admin: error-returning action + DB column verified | R (Admin Panel) / X (Domain Type Integrity) | Bug 6 | `setListingPremium`, `PremiumDialog`, `premium_until` migration |
| 261 | Global `cursor-pointer` on Button, Combobox trigger, Select trigger | T (Global UX Polish) / CC (Combobox v2) | Bug 7 | `components/ui/button.tsx`, `components/shared/Combobox.tsx`, `components/ui/select.tsx` |

## Suggested run order

The order is chosen so that dependencies and verification overlap cleanly:

1. **Task 260 (premium)** — has the biggest production impact (admin can't operate) and may require a DB migration the owner needs to run; surfacing the SQL first gives the owner runway.
2. **Task 256 (sales@lero.al)** — also requires owner action (Resend sender verification); kick off the investigation early so the owner can complete DNS/verification in parallel.
3. **Task 258 (contact card N/A)** — high-visibility regression on the public detail page.
4. **Task 255 (reply history)** + **Task 257 (topic translation)** — both touch `AdminInquiriesManager`; run sequentially to avoid merge conflict.
5. **Task 259 (Save-to-Collection)** — Favorites surface, isolated.
6. **Task 261 (cursor-pointer)** — global cosmetic; run last to avoid touching primitives during in-flight work above.

## Exit criteria (Sprint 13)

- All 7 tasks closed with verified `git diff` + AC self-audit + positive/negative-flow parity.
- `docs/backlog.md` updated; one session log per task under `docs/sessions/`.
- Pending Action Items table updated with any owner-only follow-ups (DB SQL, Resend verification).
- No regression to: contact page (Task 222), admin reply email (Task 223), Favorites collections (Task 136 / Task 212), admin listings table (Task 235 once shipped), listing detail contact card guest/owner states (Tasks 84 + 211).

## Out of scope for Sprint 13

- Redesigning the contact card layout (Epic T) or the admin inquiries layout.
- Email template visual redesign (Epic GG / Epic D — separate work).
- Adding new admin permissions or new RLS policies beyond what's required to fix these 7 bugs.
- Combobox / Select architectural changes beyond the cursor rule (those live in Epic CC v2).
