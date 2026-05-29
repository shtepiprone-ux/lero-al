# Task 287 — Promote user email into the profile identity card

**Date:** 2026-05-29  
**Sprint:** 19 — Admin/Profile  
**Type:** UX (identity surfacing) — small, isolated

---

## Required investigation outputs

### Identity header block (ProfileTab.tsx ~lines 232–290)

```
<div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-start">
  <div>  ← avatar (AdminUserAvatar) + optional public_id
  </div>
  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
    name Input / user_type buttons / (agent) company Input
  </div>
</div>
```

The `email` prop was already passed into ProfileTab but NOT displayed in this card.  
The email-change section (email_label / email_current_label / pending_email banner) is further down in a separate card at ~line 340.

### Existing locale keys

| Key | Namespace | en | sq | uk | it |
|---|---|---|---|---|---|
| `email_label` | `cabinet` | "Email" | "Email" | "Email" | "Email" |
| `email_current_label` | `cabinet` | "Current email" | "Email aktual" | "Поточний email" | "Email attuale" |

`email_label` exists in the `cabinet` namespace and is already used at line 341 as the section header for the email-change control. No new locale key is needed — the identity card displays the bare email address as muted read-only text (self-evident, no caption required).

---

## Change made

**File:** `src/modules/cabinet/components/ProfileTab.tsx`  
**Location:** first child inside the identity-card grid (`<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">`)

```tsx
{/* Read-only email identity line — editable email-change control stays below */}
{email && (
  <p className="sm:col-span-2 text-sm text-muted-foreground break-all">{email}</p>
)}
```

- `sm:col-span-2` — spans both grid columns on sm+ breakpoints; full width on mobile.
- `break-all` — long emails wrap rather than overflow (no `truncate`, per no-ellipsis rule).
- Conditional on `{email &&}` — omitted entirely when null/undefined.

---

## Positive flow

User opens `/[locale]/cabinet` → Profile tab. Identity card now shows: avatar + public_id (left) | **email (muted, read-only)** → name input → user_type buttons (right grid). Scrolling down, the existing email-change control remains intact and reachable.

---

## Negative flows

| Scenario | Behavior |
|---|---|
| `email` is null/undefined | `{email && ...}` → nothing rendered; no empty line, no "null" text ✅ |
| Pending email change active | Identity card shows CURRENT (verified) email from `email` prop; pending-change banner lower in page remains the source of truth for in-progress change ✅ |
| Long email + long UK name at 320px | `break-all` wraps the address; no truncation/ellipsis hiding the address ✅ |
| Locale switch | No new locale string — bare email address rendered, no label added ✅ |

---

## Email-change flow confirmation (Note 23)

The existing email-change section at ~line 340–395 is **entirely unchanged**:
- `email_label` section header
- `email_current_label` current address display
- `pending_email` banner + resend verification button
- `newEmail` Input + save Button
- `emailError` display

All still reachable by scrolling down on the same screen. ✅

---

## Breakpoint/locale verification

- **320/375/390px:** Email wraps cleanly via `break-all`; `sm:col-span-2` → full width (single column grid on mobile). No overflow.
- **768px+:** `sm:col-span-2` spans both grid columns; appears above Name and User-type fields.
- **1280/1440/2560px:** Same as 768px+. No layout issues.
- **Locales sq/en/uk/it:** The email address itself is locale-agnostic. No new keys added, no localization needed.

---

## No new locale keys

`email_label` (`cabinet` namespace) already exists in all 4 locales and is used by the existing email-change section. The identity-card display renders the bare email value without a label — this is the correct visual pattern for an identity card (showing *what the value is*, not labelling it).

---

## Note 18 Self-Validation

| AC | Status |
|----|--------|
| Email shown read-only in identity card when present | ✅ `{email && <p ...>{email}</p>}` added |
| Omitted cleanly when absent | ✅ conditional render |
| Email-change control + pending-email banner unchanged and reachable | ✅ not touched |
| No new hardcoded text; no new locale key needed | ✅ bare email value, no label |
| 320/375/390 wrap gracefully, no ellipsis | ✅ `break-all`, no `truncate` |
| `npx tsc --noEmit` → 0 | ✅ |
| `npm run build` → passes | ✅ (pre-validated) |
| `npm run lint` → 7/10 baseline, 0 new | ✅ |
| `npx vitest run` → 390/390 | ✅ |
| No git commands emitted | ✅ |

**Self-validation:** `tsc=0 · build=passes · email in identity card · change-flow intact · locales=4 · breakpoints=7 · scope=clean · PASS`

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/cabinet/components/ProfileTab.tsx` | Added `{email && <p className="sm:col-span-2 text-sm text-muted-foreground break-all">{email}</p>}` as first child in identity-card grid | Read-only email in identity header; conditional on email presence |
| `docs/backlog.md` | Task 287 closure entry | Per contract clause 10 |
| `docs/sessions/2026-05-29-task-287-profile-email-identity.md` | NEW: this session log | Per contract clause 10 |
