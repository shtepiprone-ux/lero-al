# Epic C — Trust, Safety & Moderation

**Status:** IN PROGRESS — C.1–C.3 done (Tasks 116–118); C.4 BLOCKED by Epic D; C.5 next available

> Progress (global numbering):
> - ✅ Task 116 — C.1 Anti-scam messaging research & decision (commit `f6c2a69d6`)
> - ✅ Task 117 — C.2 User report flow (commit `f6c2a69d6`)
> - ✅ Task 118 — C.3 Admin / moderator complaint dashboard (commit `b4b9e6f21`)
> - ⛔ C.4 Reporter notification flow — BLOCKED: needs Epic D.1 (transactional email) + D.4 first. Do NOT start until Epic D email infra exists.
> - ⏭ C.5 Account blocking / suspension tools — next available task (no email dependency). Would be **Task 119**.
**Opened:** 2026-05-19

## Goal

Protect users from scams, unwanted messages, and abuse. Build a complete report / moderation pipeline: research → user-facing report flow → admin/moderator complaint dashboard → reporter notification → account blocking tools.

## Dependencies

- Epic D (Email Infrastructure) must be at least partially complete (D.1 + D.4) before C.4 (reporter notification) can ship via email.
- Epic K (Admin Tables Standardization) underlies C.3 (admin complaint dashboard).

## Tasks

### Task C.1 — Anti-scam messaging research & decision

**Type:** Research / architecture
**Priority:** High
**Area:** Messaging system, abuse protection, moderation tooling

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/backlog.md`
2. `docs/rls-rules.md`, `docs/data-access-rules.md`
3. `docs/domain-rules.md`
4. Existing messaging implementation (file inventory in `src/`)

**Localization coverage:** N/A (research)
**Responsive coverage:** N/A (research)

**Goal:** Decide on a layered protection model among:
- User blocking
- Report-user flow
- Suspicious-message filtering (regex / heuristics / LLM)
- Rate limits per sender
- Manual moderation queue
- Automatic moderation rules

Deliver a written decision in `docs/sessions/` and update `docs/domain-rules.md` with the chosen protection stack.

**Acceptance criteria:** Decision document with rationale; backlog entries for chosen layers.

### Task C.2 — User report flow

**Type:** Feature
**Priority:** High
**Area:** Report form, "Поскаржитись" button, reports table

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/ui-rules.md`, `docs/component-rules.md`
2. `docs/rls-rules.md` (reporter / reported user permissions)
3. `docs/data-access-rules.md` (new `reports` table)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560

**Goal:** Replace the "Поскаржитись" placeholder button with a real flow: open a Sheet/Dialog with categories, free-text field, optional screenshot attachment. Persist to a `reports` table.

**Acceptance criteria:**
- Report form with categories (defined during C.1).
- Server-side validation; RLS rules drafted.
- All four locales; all seven breakpoints.

### Task C.3 — Admin / moderator complaint dashboard

**Type:** Feature
**Priority:** High
**Area:** Admin panel, reports table view

**Pre-read:** Same as C.2, plus Epic K (canonical admin table behavior)
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Admin page listing all reports with statuses (`new`, `under_review`, `resolved`, `rejected`), moderator action history, filters, search.

**Acceptance criteria:**
- Table follows Epic K canonical pattern (clickable name → preview dialog).
- Status transitions logged with `actor_id`, `actor_role`, `timestamp`, `notes`.

### Task C.4 — Reporter notification flow

**Type:** Feature
**Priority:** Medium-High
**Area:** Notifications, email + in-app
**Dependencies:** Epic D.1 (transactional email) + Epic D.4 (recovery email template manager) must exist first.
**Pre-read:** C.2, C.3, plus Epic D files
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** Email render at narrow widths

**Goal:** When a moderator resolves a report, the original reporter receives the outcome via email and an in-app notification.

**Acceptance criteria:** Email + in-app notification fire on `resolved` / `rejected` transitions; locale matches the reporter's preference.

### Task C.5 — Account blocking / suspension tools

**Type:** Feature
**Priority:** Medium-High
**Area:** Admin user management, account status, audit log

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/rls-rules.md`, `docs/data-access-rules.md`
2. `docs/domain-rules.md`
3. Existing account status logic touched by Sprint 0 Task 84 (contact card)
4. Epic K (canonical admin tables)

**Localization coverage:** sq, en, uk, it
**Responsive coverage:** All 7 breakpoints

**Goal:** Moderator/admin can temporarily suspend or permanently block users. All actions logged with reason.

**Acceptance criteria:**
- Suspend (with duration) and permanent block actions in user admin row.
- Reason required and persisted.
- Listing contact card respects the new statuses (regression check against Task 84).
- RLS enforces that suspended/blocked users cannot post or message.

## Epic-level acceptance

End-to-end report → moderation → notification → block flow works across all four locales. RLS rules updated. Audit log persisted.
