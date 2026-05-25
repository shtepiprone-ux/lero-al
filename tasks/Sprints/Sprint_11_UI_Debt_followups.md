# Sprint 11 — UI Debt Follow-ups (T221b · T221c · z-index allowlist)

**Filed by:** Opus 4.7 orchestrator review 2026-05-25  
**Triggered by:** Task 221a deferred inventory + allowlist gap found in review  
**Last task number before sprint:** 224  
**Tasks:** 225 (T221b) · 226 (T221c) · 227 (z-index chore)

---

## Background

Task 221a (2026-05-24) fixed 23 canonical Button height violations but explicitly deferred
three categories as follow-ups — logged as T221b, T221c, and a z-index allowlist chore.
The orchestrator review confirmed all three are still open.

| Tag | What | Files | Priority |
|---|---|---|---|
| T221b | Raw `<Link>/<button>/<a>/<div>` with manual h-* instead of canonical `buttonVariants()` | admin/users/page.tsx · AdminExchangeProvidersManager.tsx · ListingContact.tsx · ListingMobileCTA.tsx | Medium |
| T221c | Admin form `<Input className="h-10 ...">` height overrides (§4 violation — widespread) | AdminUserProfile, AdminSettings, AdminLocationsManager, AdminUserCreate, others | Low (design decision needed) |
| z-index chore | `ListingGallery.tsx:135 z-[100]` missing from allowlist.json | scripts/governance/tailwind-entropy.allowlist.json | Low (governance hygiene) |

---

## Task 225 — T221b: Canonical `buttonVariants()` for raw interactive elements

See kickoff: `tasks/Sprints/Sprint_11_kickoff_prompts.md` → Task 225 section.

## Task 226 — T221c: Admin form Input height standardization

See kickoff: `tasks/Sprints/Sprint_11_kickoff_prompts.md` → Task 226 section.

## Task 227 — z-index allowlist: add ListingGallery z-[100]

See kickoff: `tasks/Sprints/Sprint_11_kickoff_prompts.md` → Task 227 section.
