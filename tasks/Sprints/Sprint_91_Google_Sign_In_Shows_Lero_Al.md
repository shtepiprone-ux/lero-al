# Sprint 91 — Google sign-in shows Lero.al, not a Supabase subdomain

**Opened:** 2026-10-20 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (927) · **Retired unused:** 928 (withdrawn by 927 Amendment 2, never reuse)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-10-20, verbatim:** *"необхідно створити задачу, бо Sonnet відмовляється без задачі виконувати
> мої вказівки в чаті"*, with the owner's written specification: *"я обрав авторизацію через Google методом Google Identity Services.
> У Vercel та у env.local я додав ключ NEXT_PUBLIC_GOOGLE_CLIENT_ID=."*

## The defect

The sign-in sheet's Google button calls Supabase's redirect flow, so the visitor is sent to the Supabase project's own domain and
Google's consent screen names that domain instead of Lero.al.

## Goal

Google sign-in runs through Google Identity Services and `signInWithIdToken` with a per-attempt nonce; Google's popup names Lero.al;
the password sign-in, the server and the secrets are unchanged; frontend, server, database and provider security cases prove it.

## Goal fit

Open sprints 46, 55–57, 61–62, 69–74, 77–79, 83, 84, 86, 87, 89 and 90 are about Tailwind exits, Story geometry, cards, tests, CMS
pages, the listing form and corners. Sprint 78 holds Task 923's auth hardening, but its goal is the admin and agent dashboards; this
change is a sign-in flow of every visitor. None fits, so Sprint 91 is opened.

## Decisions

| ID | Question | Owner answer (verbatim) | Binding consequence |
|---|---|---|---|
| **D91-1** | (2026-10-20, AskUserQuestion) Which Google button the login sheet shows to obtain `response.credential`? | *"Кнопка від Google (Recommended)"*. The option read: `google.accounts.id.renderButton`, Google's official button in an iframe; Lero.al tokens do not apply to it; recorded as a dated owner exception. | **927** D2: Google's rendered button; no One Tap, no custom button. |

## Tasks

The single state source for this sprint's tasks.

| # | State | Scope |
|---|---|---|
| **927** | 🔁 `NEEDS REVISION` 2026-10-20 (review 1 → kickoff §13 Amendment 3: slot trailing gap, one Google button at a time in the profile tab, a UI-contract row for `GoogleSignInButton`, the canonical Alert wraps long tokens, contract stage + report; 24 security cases), P1, Q4 → [kickoff](Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.md) | GIS loader and nonce, Google's rendered button in the login view, `signInWithIdToken`, sanitized redirect, unavailable state; Amendment 2 (2026-10-20, owner D9/D10): the cabinet profile tab's Google re-confirmation moves to the same button and call, the deletion dialog takes the Google control as a slot, `signInWithOAuth` is removed; 23 security cases (frontend, server, database, provider). Approval waits for Task 923's rendered-state census gate. Owner actions: Google origins and branding, Supabase client ID and nonce check, Vercel redeploy. |

## Security test contract

This sprint plan is a state and ordering record; it authorizes no product change. Each task's own kickoff and its adjacent
`*.security.json` carry the frontend, server and real-boundary security cases of that task (`.claude/rules/shared/security-testing.md`).
The plan's own contract (`Sprint_91_Google_Sign_In_Shows_Lero_Al.security.json`) is Q0: runtime rows not applicable.

## Exit criteria

1. 927 approved by Opus.
2. The owner has accepted 927's native Google sign-in check on localhost and production (AC12) and its owner matrix.